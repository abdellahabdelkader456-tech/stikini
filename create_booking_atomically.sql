CREATE OR REPLACE FUNCTION public.create_booking_atomically(p_booking jsonb, p_automatic_choice boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_salon_id text;
  v_salon_name text;
  v_date date;
  v_time text;
  v_start integer;
  v_duration integer;
  v_price numeric;
  v_services jsonb;
  v_input_count integer;
  v_unique_count integer;
  v_service_count integer;
  v_candidate_names text[];
  v_candidate_name text;
  v_existing record;
  v_existing_start integer;
  v_existing_duration integer;
  v_bad_duration boolean;
  v_available boolean;
  v_inserted public.bookings%ROWTYPE;
BEGIN
  IF p_booking IS NULL
     OR jsonb_typeof(p_booking) <> 'object'
     OR p_automatic_choice IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'بيانات الحجز غير صالحة'
    );
  END IF;

  v_salon_id := p_booking->>'salon_id';
  v_time := p_booking->>'time';

  IF COALESCE(v_salon_id, '') = ''
     OR COALESCE(p_booking->>'client_name', '') = ''
     OR COALESCE(p_booking->>'phone', '') = ''
     OR COALESCE(p_booking->>'code', '') = ''
     OR COALESCE(v_time, '') !~
       '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'
     OR jsonb_typeof(p_booking->'services') <> 'array' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'بيانات الحجز غير صالحة'
    );
  END IF;

  IF jsonb_array_length(p_booking->'services') NOT BETWEEN 1 AND 10 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'عدد الخدمات غير صالح'
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_booking->'services') AS x(item)
    WHERE COALESCE(x.item->>'id', '') !~
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'معرّف إحدى الخدمات غير صالح'
    );
  END IF;

  BEGIN
    v_date := (p_booking->>'date')::date;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'تاريخ الحجز غير صالح'
    );
  END;

  IF v_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'لا يمكن الحجز في تاريخ سابق'
    );
  END IF;

  SELECT name
  INTO v_salon_name
  FROM public.salons
  WHERE id = v_salon_id
    AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'الصالون غير متاح للحجز'
    );
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT item->>'id')
  INTO v_input_count, v_unique_count
  FROM jsonb_array_elements(p_booking->'services') AS x(item);

  IF v_input_count <> v_unique_count THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'لا يمكن تكرار الخدمة نفسها'
    );
  END IF;

  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'price', s.price,
        'duration', s.duration
      )
      ORDER BY x.ordinality
    ),
    COALESCE(SUM(s.price), 0),
    COALESCE(SUM(s.duration), 0),
    COUNT(s.id)
  INTO v_services, v_price, v_duration, v_service_count
  FROM jsonb_array_elements(p_booking->'services')
       WITH ORDINALITY AS x(item, ordinality)
  JOIN public.salon_services AS s
    ON s.id = (x.item->>'id')::uuid
   AND s.salon_id = v_salon_id;

  IF v_service_count <> v_input_count THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'إحدى الخدمات لم تعد متاحة في هذا الصالون'
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_services) AS x(item)
    WHERE (item->>'price')::numeric < 0
       OR (item->>'duration')::integer <= 0
  ) OR v_duration <= 0 OR v_duration > 480 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'سعر إحدى الخدمات أو مدتها غير صالح'
    );
  END IF;

  v_start :=
    split_part(v_time, ':', 1)::integer * 60
    + split_part(v_time, ':', 2)::integer;

  IF v_start + v_duration > 1440 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'مدة الحجز تتجاوز نهاية اليوم'
    );
  END IF;

  -- Serialize all booking attempts for this salon and date.
  PERFORM pg_advisory_xact_lock(
    hashtext(v_salon_id),
    hashtext(v_date::text)
  );

  IF p_automatic_choice THEN
    SELECT array_agg(
      barber.name
      ORDER BY
        COALESCE((
          SELECT SUM(
            CASE
              WHEN COALESCE(item->>'duration', '') ~ '^[0-9]+$'
              THEN (item->>'duration')::integer
              ELSE 0
            END
          )
          FROM public.bookings AS b
          CROSS JOIN LATERAL jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(b.services) = 'array'
              THEN b.services
              ELSE '[]'::jsonb
            END
          ) AS x(item)
          WHERE b.salon_id = v_salon_id
            AND b.barber_name = barber.name
            AND b.date = v_date
            AND b.status = 'مؤكد'
        ), 0) ASC,
        (
          SELECT COUNT(*)
          FROM public.bookings AS b
          WHERE b.salon_id = v_salon_id
            AND b.barber_name = barber.name
            AND b.date = v_date
            AND b.status = 'مؤكد'
        ) ASC,
        barber.name ASC
    )
    INTO v_candidate_names
    FROM public.salon_barbers AS barber
    WHERE barber.salon_id = v_salon_id;
  ELSE
    SELECT ARRAY[barber.name]
    INTO v_candidate_names
    FROM public.salon_barbers AS barber
    WHERE barber.salon_id = v_salon_id
      AND barber.name = p_booking->>'barber_name';
  END IF;

  IF COALESCE(array_length(v_candidate_names, 1), 0) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'لا يوجد حلاق صالح لهذا الحجز'
    );
  END IF;

  FOREACH v_candidate_name IN ARRAY v_candidate_names
  LOOP
    v_available := true;

    FOR v_existing IN
      SELECT time, services
      FROM public.bookings
      WHERE salon_id = v_salon_id
        AND barber_name = v_candidate_name
        AND date = v_date
        AND status = 'مؤكد'
    LOOP
      IF COALESCE(v_existing.time, '') !~
           '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'
         OR jsonb_typeof(v_existing.services) <> 'array'
         OR jsonb_array_length(v_existing.services) = 0 THEN
        v_available := false;
        EXIT;
      END IF;

      SELECT
        COALESCE(SUM(
          CASE
            WHEN COALESCE(item->>'duration', '') ~ '^[0-9]+$'
            THEN (item->>'duration')::integer
            ELSE 0
          END
        ), 0),
        COALESCE(BOOL_OR(
          CASE
            WHEN COALESCE(item->>'duration', '') ~ '^[0-9]+$'
            THEN (item->>'duration')::integer <= 0
            ELSE true
          END
        ), false)
      INTO v_existing_duration, v_bad_duration
      FROM jsonb_array_elements(v_existing.services) AS x(item);

      IF v_bad_duration OR v_existing_duration <= 0 THEN
        v_available := false;
        EXIT;
      END IF;

      v_existing_start :=
        split_part(v_existing.time, ':', 1)::integer * 60
        + split_part(v_existing.time, ':', 2)::integer;

      IF v_start < v_existing_start + v_existing_duration
         AND v_existing_start < v_start + v_duration THEN
        v_available := false;
        EXIT;
      END IF;
    END LOOP;

    IF v_available THEN
      EXIT;
    END IF;

    v_candidate_name := NULL;
  END LOOP;

  IF v_candidate_name IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'conflict', true,
      'error', 'هذا التوقيت غير متاح. يرجى اختيار توقيت آخر.'
    );
  END IF;

  INSERT INTO public.bookings (
    id, code, user_id, salon_id, salon_name,
    services, barber_name, date, time,
    client_name, phone, email, notes,
    total_price, discount, promo_code, status
  )
  VALUES (
    COALESCE(NULLIF(p_booking->>'id', ''), gen_random_uuid()::text),
    p_booking->>'code',
    NULLIF(p_booking->>'user_id', '')::uuid,
    v_salon_id,
    v_salon_name,
    v_services,
    v_candidate_name,
    v_date,
    v_time,
    p_booking->>'client_name',
    p_booking->>'phone',
    COALESCE(p_booking->>'email', ''),
    COALESCE(p_booking->>'notes', ''),
    v_price,
    0,
    NULL,
    'مؤكد'
  )
  RETURNING * INTO v_inserted;

  RETURN jsonb_build_object(
    'ok', true,
    'booking', to_jsonb(v_inserted)
  );
END;
$function$
