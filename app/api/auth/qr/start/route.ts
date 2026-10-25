import { NextResponse } from 'next/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { describeDevice, hashQrSecret, maskPhone, newQrSecret, normalizePhone, QR_LOGIN_TTL_SECONDS } from '@/lib/qr-login'

/**
 * Creates a short-lived QR login request for a mobile number. The response is
 * the same whether or not an account has that number, so it can't be used to
 * discover registered numbers.
 */
export async function POST(req: Request) {
  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'QR login needs Supabase to be configured on the server.' }, { status: 503 })
  }

  const { phone: rawPhone } = (await req.json().catch(() => ({}))) as { phone?: unknown }
  const phone = normalizePhone(rawPhone)
  if (!phone) {
    return NextResponse.json({ error: 'Enter a valid mobile number, like 98765 43210.' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()
  const secret = newQrSecret()
  const expiresAt = new Date(Date.now() + QR_LOGIN_TTL_SECONDS * 1000).toISOString()

  // Housekeeping: drop requests that expired more than 10 minutes ago.
  await admin.from('qr_login_requests').delete().lt('expires_at', new Date(Date.now() - 10 * 60_000).toISOString())

  const { data, error } = await admin
    .from('qr_login_requests')
    .insert({ secret_hash: hashQrSecret(secret), phone, device_label: describeDevice(req.headers.get('user-agent')), expires_at: expiresAt })
    .select('id, expires_at')
    .single()

  if (error || !data) {
    console.warn('QR login request could not be created:', error)
    return NextResponse.json({ error: 'Could not create a QR code. Please try again.' }, { status: 500 })
  }

  const origin = req.headers.get('origin') || new URL(req.url).origin
  return NextResponse.json({
    id: data.id,
    secret,
    expiresAt: data.expires_at,
    maskedPhone: maskPhone(phone),
    approveUrl: `${origin}/approve/${data.id}`,
  })
}
