
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function respond(
  status: number,
  body: Record<string, unknown>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return respond(405, { ok: false, error: 'Method not allowed' })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('Missing required Supabase environment variables')
      return respond(500, {
        ok: false,
        error: 'إعدادات الخادم غير مكتملة',
      })
    }

    const authorization = req.headers.get('Authorization') ?? ''
    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i)
    const accessToken = tokenMatch?.[1]

    if (!accessToken || accessToken === anonKey) {
      return respond(401, {
        ok: false,
        error: 'يرجى تسجيل الدخول أولاً',
      })
    }

    // Verify the caller's access token with Supabase Auth.
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: { user: authUser },
      error: authError,
    } = await authClient.auth.getUser(accessToken)

    if (authError || !authUser) {
      return respond(401, {
        ok: false,
        error: 'جلسة الدخول غير صالحة. يرجى تسجيل الدخول مجددًا.',
      })
    }

    const body = await req.json().catch(() => null)

    if (
      !body ||
      typeof body.bookingId !== 'string' ||
      !body.bookingId.trim() ||
      !['ملغى', 'مكتمل'].includes(body.status)
    ) {
      return respond(400, {
        ok: false,
        error: 'بيانات تحديث الحجز غير صالحة',
      })
    }

    const bookingId = body.bookingId.trim()
    const requestedStatus = body.status as 'ملغى' | 'مكتمل'

    // This client is server-side only. Never put the service-role key in Vite code.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from('profiles')
      .select('id, type, is_admin')
      .eq('id', authUser.id)
      .maybeSingle()

    if (profileError) {
      console.error('Profile lookup failed:', profileError.message)
      return respond(500, {
        ok: false,
        error: 'تعذر التحقق من صلاحيات الحساب',
      })
    }

    if (!profile) {
      return respond(403, {
        ok: false,
        error: 'لا يوجد ملف حساب صالح لهذا المستخدم',
      })
    }

    const {
      data: booking,
      error: bookingError,
    } = await adminClient
      .from('bookings')
      .select('id, user_id, salon_id, status')
      .eq('id', bookingId)
      .maybeSingle()

    if (bookingError) {
      console.error('Booking lookup failed:', bookingError.message)
      return respond(500, {
        ok: false,
        error: 'تعذر التحقق من الحجز',
      })
    }

    if (!booking) {
      return respond(404, {
        ok: false,
        error: 'الحجز غير موجود',
      })
    }

    // Only a currently confirmed booking may be cancelled or completed.
    if (booking.status !== 'مؤكد') {
      return respond(409, {
        ok: false,
        error: 'لا يمكن تغيير حالة هذا الحجز الحالية',
      })
    }

    const isAdmin = profile.is_admin === true
    const isClientOwner = booking.user_id === authUser.id

    let isSalonOwner = false

    if (profile.type === 'owner') {
      const {
        data: ownedSalon,
        error: salonError,
      } = await adminClient
        .from('salons')
        .select('id')
        .eq('id', booking.salon_id)
        .eq('owner_id', authUser.id)
        .maybeSingle()

      if (salonError) {
        console.error('Salon ownership check failed:', salonError.message)
        return respond(500, {
          ok: false,
          error: 'تعذر التحقق من ملكية الصالون',
        })
      }

      isSalonOwner = Boolean(ownedSalon)
    }

    const canCancel =
      isAdmin || isClientOwner || isSalonOwner

    const canComplete =
      isAdmin || isSalonOwner

    if (
      (requestedStatus === 'ملغى' && !canCancel) ||
      (requestedStatus === 'مكتمل' && !canComplete)
    ) {
      return respond(403, {
        ok: false,
        error: 'غير مصرح لك بتغيير حالة هذا الحجز',
      })
    }

    // Conditional update prevents overwriting a status changed in the meantime.
    const {
      data: updatedBooking,
      error: updateError,
    } = await adminClient
      .from('bookings')
      .update({ status: requestedStatus })
      .eq('id', bookingId)
      .eq('status', 'مؤكد')
      .select('*')
      .maybeSingle()

    if (updateError) {
      console.error('Booking status update failed:', updateError.message)
      return respond(500, {
        ok: false,
        error: 'تعذر تحديث حالة الحجز',
      })
    }

    if (!updatedBooking) {
      return respond(409, {
        ok: false,
        error: 'تغيرت حالة الحجز بالفعل. حدّث الصفحة وحاول مجددًا.',
      })
    }

    return respond(200, {
      ok: true,
      booking: updatedBooking,
      message:
        requestedStatus === 'ملغى'
          ? 'تم إلغاء الحجز بنجاح'
          : 'تم إكمال الحجز بنجاح',
    })
  } catch (error) {
    console.error(
      'Unexpected update-booking-status error:',
      error instanceof Error ? error.message : 'Unknown error',
    )

    return respond(500, {
      ok: false,
      error: 'حدث خطأ غير متوقع أثناء تحديث الحجز',
    })
  }
})
