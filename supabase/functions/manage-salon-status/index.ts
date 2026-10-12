
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { ok: false, message: 'Method not allowed' },
      405,
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('Missing required Supabase environment variables')

      return jsonResponse(
        { ok: false, message: 'Server configuration error' },
        500,
      )
    }

    const authorization = req.headers.get('Authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return jsonResponse(
        { ok: false, message: 'يجب تسجيل الدخول أولاً' },
        401,
      )
    }

    // Verify the caller's access token with Supabase Auth.
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return jsonResponse(
        { ok: false, message: 'جلسة الدخول غير صالحة' },
        401,
      )
    }

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return jsonResponse(
        { ok: false, message: 'بيانات الطلب غير صالحة' },
        400,
      )
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('salonId' in body) ||
      !('status' in body)
    ) {
      return jsonResponse(
        { ok: false, message: 'يجب إرسال salonId و status' },
        400,
      )
    }

    const { salonId, status } = body as {
      salonId: unknown
      status: unknown
    }

    if (
      typeof salonId !== 'string' ||
      salonId.trim().length === 0 ||
      salonId.length > 200
    ) {
      return jsonResponse(
        { ok: false, message: 'معرّف الصالون غير صالح' },
        400,
      )
    }

    if (status !== 'approved' && status !== 'rejected') {
      return jsonResponse(
        { ok: false, message: 'حالة الصالون المطلوبة غير مسموحة' },
        400,
      )
    }

    // This client is server-side only. Never expose its key to the browser.
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )

    // Check the caller's actual admin flag in the database.
    const { data: profile, error: profileError } =
      await adminClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) {
      console.error('Admin profile lookup failed:', profileError.message)

      return jsonResponse(
        { ok: false, message: 'تعذر التحقق من صلاحيات الإدارة' },
        500,
      )
    }

    if (profile?.is_admin !== true) {
      return jsonResponse(
        { ok: false, message: 'غير مصرح لك بهذه العملية' },
        403,
      )
    }

    // Update only the requested salon status.
    const { data: salon, error: updateError } =
      await adminClient
        .from('salons')
        .update({ status })
        .eq('id', salonId.trim())
        .select('id, status')
        .maybeSingle()

    if (updateError) {
      console.error('Salon status update failed:', updateError.message)

      return jsonResponse(
        { ok: false, message: 'تعذر تحديث حالة الصالون' },
        500,
      )
    }

    if (!salon) {
      return jsonResponse(
        { ok: false, message: 'لم يتم العثور على الصالون' },
        404,
      )
    }

    return jsonResponse({
      ok: true,
      message:
        status === 'approved'
          ? 'تمت الموافقة على الصالون بنجاح'
          : 'تم رفض الصالون',
      salonId: salon.id,
      status: salon.status,
    })
  } catch (error) {
    console.error(
      'Unexpected manage-salon-status error:',
      error instanceof Error ? error.message : 'Unknown error',
    )

    return jsonResponse(
      { ok: false, message: 'حدث خطأ غير متوقع' },
      500,
    )
  }
})
