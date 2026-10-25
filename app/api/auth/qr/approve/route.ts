import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { isQrRequestId, normalizePhone } from '@/lib/qr-login'

/**
 * Called from the signed-in phone to approve or deny a pending QR login.
 * Approval only succeeds when this account's registered mobile number matches
 * the number the login was requested for.
 */
export async function POST(req: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'QR login is not available in offline mode.' }, { status: 503 })
  }

  const context = await getAuthContext()
  if (!context) return NextResponse.json({ error: 'Sign in on this device first.' }, { status: 401 })

  const { id, decision } = (await req.json().catch(() => ({}))) as { id?: unknown; decision?: unknown }
  if (!isQrRequestId(id) || (decision !== 'approve' && decision !== 'deny')) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()
  const { data: request } = await admin
    .from('qr_login_requests')
    .select('id, phone, status, expires_at')
    .eq('id', id)
    .maybeSingle()

  if (!request || request.status !== 'pending' || new Date(request.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This code has expired or was already used. Get a new code and scan again.' }, { status: 410 })
  }

  if (decision === 'approve') {
    const accountPhone = normalizePhone(context.profile.phone)
    if (!accountPhone) {
      return NextResponse.json(
        { error: 'Add your mobile number in Settings → Profile first. QR login only works for the number on your account.', code: 'no_phone' },
        { status: 403 },
      )
    }
    if (accountPhone !== request.phone) {
      return NextResponse.json({ error: 'This code was requested for a different mobile number than the one on your account.', code: 'phone_mismatch' }, { status: 403 })
    }
  }

  const { data, error } = await admin
    .from('qr_login_requests')
    .update(
      decision === 'approve'
        ? { status: 'approved', user_id: context.user.id, approved_at: new Date().toISOString() }
        : { status: 'denied' },
    )
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) {
    console.warn('QR login approval failed:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'This code has expired or was already used. Get a new code and scan again.' }, { status: 410 })
  }

  return NextResponse.json({ success: true, decision })
}
