
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const timeToMinutes = (value: unknown): number | null => {
  if (typeof value !== 'string') return null

  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(value)

  if (!match) return null

  return Number(match[1]) * 60 + Number(match[2])
}

const serviceDuration = (services: unknown): number => {
  if (!Array.isArray(services)) return 0

  return services.reduce((total, service) => {
    const duration = Number(service?.duration)

    return total + (
      Number.isFinite(duration) && duration > 0
        ? duration
        : 0
    )
  }, 0)
}

const overlaps = (
  startA: number,
  durationA: number,
  startB: number,
  durationB: number,
) => startA < startB + durationB && startB < startA + durationA

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'طريقة الطلب غير مدعومة' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Missing required Supabase environment variables')
    return jsonResponse({ error: 'إعدادات الخادم غير مكتملة' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  try {
    const rawBody = await req.json()

    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return jsonResponse({ error: 'بيانات الحجز غير صالحة' }, 400)
    }

    const input = rawBody as Record<string, unknown>

    const {
      salonId,
      services: requestedServices,
      barberName,
      date,
      time,
      clientName,
      phone,
      email,
      notes,
    } = input

    if (
      !isText(salonId) ||
      !Array.isArray(requestedServices) ||
      requestedServices.length === 0 ||
      requestedServices.length > 10 ||
      !isText(barberName) ||
      !isText(date) ||
      !isText(time) ||
      !isText(clientName) ||
      !isText(phone)
    ) {
      return jsonResponse({ error: 'يرجى التحقق من بيانات الحجز' }, 400)
    }

    if (
      clientName.trim().length > 120 ||
      phone.trim().length > 30 ||
      (typeof email === 'string' && email.length > 254) ||
      (typeof notes === 'string' && notes.length > 1000)
    ) {
      return jsonResponse({ error: 'تجاوزت إحدى البيانات الحد المسموح' }, 400)
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
    ) {
      return jsonResponse({ error: 'التاريخ غير صالح' }, 400)
    }

    const requestedStart = timeToMinutes(time)

    if (requestedStart === null) {
      return jsonResponse({ error: 'التوقيت غير صالح' }, 400)
    }

    const serviceIds = requestedServices.map((item) =>
      typeof item?.id === 'string' ? item.id : ''
    )

    if (
      serviceIds.some((id) => !id) ||
      new Set(serviceIds).size !== serviceIds.length
    ) {
      return jsonResponse({ error: 'الخدمات المختارة غير صالحة' }, 400)
    }

    // Verify a supplied user token. A public anon-key request is a guest.
    let userId: string | null = null
    const authorization = req.headers.get('Authorization')

    if (authorization) {
      const match = /^Bearer\s+(.+)$/i.exec(authorization)

      if (!match) {
        return jsonResponse({ error: 'بيانات المصادقة غير صالحة' }, 401)
      }

      const token = match[1]

      if (token !== anonKey) {
        const authClient = createClient(supabaseUrl, anonKey, {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })

        const { data, error } = await authClient.auth.getUser()

        if (error || !data.user) {
          return jsonResponse({ error: 'انتهت صلاحية جلسة الدخول' }, 401)
        }

        userId = data.user.id
      }
    }

    // Only approved salons may receive bookings.
    const { data: salon, error: salonError } = await admin
      .from('salons')
      .select('id, name, status')
      .eq('id', salonId.trim())
      .eq('status', 'approved')
      .maybeSingle()

    if (salonError) throw salonError

    if (!salon) {
      return jsonResponse({ error: 'الصالون غير متاح للحجز' }, 404)
    }

    // Load authoritative prices and durations from the database.
    const { data: services, error: servicesError } = await admin
      .from('salon_services')
      .select('id, salon_id, name, price, duration')
      .eq('salon_id', salon.id)
      .in('id', serviceIds)

    if (servicesError) throw servicesError

    if (!services || services.length !== serviceIds.length) {
      return jsonResponse({
        error: 'إحدى الخدمات لم تعد متاحة في هذا الصالون',
      }, 400)
    }

    const orderedServices = serviceIds.map((id) =>
      services.find((service) => service.id === id)!
    )

    if (orderedServices.some((service) =>
      !Number.isFinite(Number(service.price)) ||
      Number(service.price) < 0 ||
      !Number.isInteger(Number(service.duration)) ||
      Number(service.duration) <= 0
    )) {
      return jsonResponse({ error: 'بيانات إحدى الخدمات غير صالحة' }, 400)
    }

    const totalDuration = orderedServices.reduce(
      (sum, service) => sum + Number(service.duration),
      0,
    )

    const totalPrice = orderedServices.reduce(
      (sum, service) => sum + Number(service.price),
      0,
    )

    if (
      totalDuration <= 0 ||
      totalDuration > 480 ||
      requestedStart + totalDuration > 24 * 60
    ) {
      return jsonResponse({ error: 'مدة الحجز غير صالحة' }, 400)
    }

    // Load actual barbers belonging to this salon.
    const { data: barbers, error: barbersError } = await admin
      .from('salon_barbers')
      .select('id, name')
      .eq('salon_id', salon.id)
      .order('name')

    if (barbersError) throw barbersError

    if (!barbers || barbers.length === 0) {
      return jsonResponse({ error: 'لا يوجد حلاقون متاحون حاليًا' }, 409)
    }

    const automaticChoice = barberName.trim() === 'أول حلاق متاح'

    const selectedBarber = automaticChoice
      ? null
      : barbers.find((barber) => barber.name === barberName.trim())

    if (!automaticChoice && !selectedBarber) {
      return jsonResponse({
        error: 'الحلاق المختار لا ينتمي إلى هذا الصالون',
      }, 400)
    }

    // Check existing confirmed appointments and their stored durations.
    const { data: existingBookings, error: bookingsError } = await admin
      .from('bookings')
      .select('barber_name, time, services')
      .eq('salon_id', salon.id)
      .eq('date', date)
      .eq('status', 'مؤكد')

    if (bookingsError) throw bookingsError

    const bookings = existingBookings ?? []

    const isAvailable = (name: string) => {
      return !bookings.some((booking) => {
        if (booking.barber_name !== name) return false

        const existingStart = timeToMinutes(booking.time)
        const existingDuration = serviceDuration(booking.services)

        // Fail closed if an existing appointment cannot be interpreted.
        if (existingStart === null || existingDuration <= 0) return true

        return overlaps(
          requestedStart,
          totalDuration,
          existingStart,
          existingDuration,
        )
      })
    }

    const barber = automaticChoice
      ? barbers.find((candidate) => isAvailable(candidate.name))
      : isAvailable(selectedBarber!.name)
        ? selectedBarber
        : null

    if (!barber) {
      return jsonResponse({
       error: 'هذا التوقيت غير متاح. يرجى اختيار توقيت آخر.',
      }, 409)
    }

    const bookingCode = `STK-${crypto.randomUUID()
      .replaceAll('-', '')
      .slice(0, 12)
      .toUpperCase()}`

    const bookingPayload = {
      id: crypto.randomUUID(),
      code: bookingCode,
      salon_id: salon.id,
      salon_name: salon.name,
      services: orderedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price),
        duration: Number(service.duration),
      })),
      barber_name: barber.name,
      date,
      time,
      client_name: clientName.trim(),
      phone: phone.trim(),
      email: typeof email === 'string' ? email.trim() : '',
      notes: typeof notes === 'string' ? notes.trim() : '',
      total_price: totalPrice,
      discount: 0,
      promo_code: null,
      user_id: userId,
      status: 'مؤكد',
    }

   
    const { data: result, error: insertError } = await admin.rpc(
      'create_booking_atomically',
      {
        p_booking: bookingPayload,
        p_automatic_choice: automaticChoice,
      },
    )

    if (insertError) {
      console.error('Atomic booking creation failed:', insertError.code)
      throw insertError
    }

    if (!result?.ok || !result.booking) {
      return jsonResponse(
        {
          error:
            result?.error ??
            'هذا التوقيت غير متاح. يرجى اختيار توقيت آخر.',
        },
        result?.conflict ? 409 : 400,
      )
    }

  
    const booking = result.booking

    return jsonResponse({
      ok: true,
      booking,
      message: 'تم إنشاء الحجز بنجاح',
    }, 201)
  } catch (error) {
    console.error(
      'Create booking failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )

    return jsonResponse({
      error: 'حدث خطأ أثناء إنشاء الحجز. يرجى المحاولة لاحقًا.',
    }, 500)
  }
})
