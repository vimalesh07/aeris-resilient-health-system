import { NextResponse } from 'next/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { hashQrSecret, isQrRequestId } from '@/lib/qr-login'

/**
 * Polled by the browser that shows the QR code. Once the phone approves, this
 * returns a one-time token hash the browser exchanges for a session with
 * supabase.auth.verifyOtp(). The token is handed out exactly once.
 */
export async function POST(req: Request) {
  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'QR login is not configured.' }, { status: 503 })
  }

  const { id, secret } = (await req.json().catch(() => ({}))) as { id?: unknown; secret?: unknown }
  if (!isQrRequestId(id) || typeof secret !== 'string' || secret.length < 20) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()
  const { data: request } = await admin
    .from('qr_login_requests')
    .select('id, status, user_id, expires_at, secret_hash')
    .eq('id', id)
    .maybeSingle()

  if (!request || request.secret_hash !== hashQrSecret(secret)) {
    return NextResponse.json({ status: 'expired' })
  }
  if (request.status === 'denied') return NextResponse.json({ status: 'denied' })
  if (request.status === 'consumed') return NextResponse.json({ status: 'expired' })
  if (request.status === 'pending') {
    return NextResponse.json({ status: new Date(request.expires_at).getTime() < Date.now() ? 'expired' : 'pending' })
  }

  // Approved: claim it atomically so a second poll can never get another token.
  const { data: claimed } = await admin
    .from('qr_login_requests')
    .update({ status: 'consumed', consumed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'approved')
    .select('user_id')
    .maybeSingle()

  if (!claimed?.user_id) return NextResponse.json({ status: 'expired' })

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(claimed.user_id)
  const email = userData?.user?.email
  if (userError || !email) {
    return NextResponse.json({ status: 'error', error: 'This account has no email address, so QR login is not available for it.' })
  }

  // generateLink does not send an email; it just returns a one-time token.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (linkError || !link?.properties?.hashed_token) {
    console.warn('QR login token could not be generated:', linkError)
    return NextResponse.json({ status: 'error', error: 'Could not sign you in. Please try again.' })
  }

  return NextResponse.json({ status: 'approved', tokenHash: link.properties.hashed_token })
}
