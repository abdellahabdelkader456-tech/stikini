
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
): Response {
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
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { error: 'Method not allowed.' },
      405,
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY',
    )
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse(
        {
          error:
            'Required Supabase environment variables are missing.',
        },
        500,
      )
    }

    const authorization = req.headers.get('Authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return jsonResponse(
        { error: 'Authentication required.' },
        401,
      )
    }

    const token = authorization.slice('Bearer '.length)

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const {
      data: { user: adminUser },
      error: authError,
    } = await authClient.auth.getUser(token)

    if (authError || !adminUser) {
      return jsonResponse(
        { error: 'Invalid session.' },
        401,
      )
    }

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const {
      data: adminProfile,
      error: adminError,
    } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', adminUser.id)
      .single()

    if (adminError || adminProfile?.is_admin !== true) {
      return jsonResponse(
        { error: 'Admin access required.' },
        403,
      )
    }

    const body = await req.json()
    const userId = String(body.userId ?? '').trim()
    const requestId = String(body.requestId ?? '').trim()

    if (!userId || !requestId) {
      return jsonResponse(
        { error: 'userId and requestId are required.' },
        400,
      )
    }

    const {
      data: deletionRequest,
      error: requestError,
    } = await adminClient
      .from('account_deletion_requests')
      .select('id, user_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !deletionRequest) {
      return jsonResponse(
        { error: 'Deletion request not found.' },
        404,
      )
    }

    if (deletionRequest.user_id !== userId) {
      return jsonResponse(
        { error: 'User does not match request.' },
        400,
      )
    }

    if (deletionRequest.status !== 'pending') {
      return jsonResponse(
        {
          error:
            'This request has already been reviewed.',
        },
        409,
      )
    }

    // Mark the request as processing.
    const { data: processingRows, error: processingError } =
      await adminClient
        .from('account_deletion_requests')
        .update({
          status: 'processing',
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select('id')

    if (processingError) {
      throw processingError
    }

    if (!processingRows || processingRows.length === 0) {
      return jsonResponse(
        {
          error:
            'The request is already being processed or reviewed.',
        },
        409,
      )
    }

    // Find salons owned by the account.
    const { data: salons, error: salonsError } =
      await adminClient
        .from('salons')
        .select('id')
        .eq('owner_id', userId)

    if (salonsError) {
      throw salonsError
    }

    const salonIds = (salons ?? []).map(
      (salon) => salon.id,
    )

    // Delete related salon records first.
    if (salonIds.length > 0) {
      const { error: barbersError } = await adminClient
        .from('salon_barbers')
        .delete()
        .in('salon_id', salonIds)

      if (barbersError) throw barbersError

      const { error: imagesError } = await adminClient
        .from('salon_images')
        .delete()
        .in('salon_id', salonIds)

      if (imagesError) throw imagesError

      const { error: servicesError } = await adminClient
        .from('salon_services')
        .delete()
        .in('salon_id', salonIds)

      if (servicesError) throw servicesError

      const { error: salonsDeleteError } =
        await adminClient
          .from('salons')
          .delete()
          .in('id', salonIds)

      if (salonsDeleteError) {
        throw salonsDeleteError
      }
    }

    // Delete the user's profile.
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    // Delete the user from Supabase Authentication.
    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      throw authDeleteError
    }

    // Preserve the deletion request for admin history.
    const { error: approvedError } = await adminClient
      .from('account_deletion_requests')
      .update({
        status: 'approved',
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
        admin_note:
          'Account and associated salon data deleted.',
      })
      .eq('id', requestId)

    if (approvedError) {
      throw approvedError
    }

    return jsonResponse({
      success: true,
      message:
        'Account and salon data deleted successfully.',
    })
  } catch (error) {
    console.error('Delete account error:', error)

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected server error.',
      },
      500,
    )
  }
})