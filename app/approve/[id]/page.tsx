import { notFound, redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { isQrRequestId, maskPhone, normalizePhone } from '@/lib/qr-login'
import { ApproveQrLogin } from '@/components/ApproveQrLogin'

export const dynamic = 'force-dynamic'

/** Opened on the phone after scanning a login QR code. */
export default async function ApproveQrPage({ params }: PageProps<'/approve/[id]'>) {
  const { id } = await params
  if (!isQrRequestId(id)) notFound()

  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <ApproveQrLogin id={id} state={{ kind: 'unavailable' }} />
  }

  const context = await getAuthContext()
  if (!context) redirect(`/login?next=${encodeURIComponent(`/approve/${id}`)}`)

  const admin = createAdminSupabaseClient()
  const { data: request } = await admin.from('qr_login_requests').select('phone, status, device_label, expires_at').eq('id', id).maybeSingle()

  if (!request || request.status !== 'pending' || new Date(request.expires_at).getTime() < Date.now()) {
    return <ApproveQrLogin id={id} state={{ kind: 'expired' }} />
  }

  const accountPhone = normalizePhone(context.profile.phone)
  return (
    <ApproveQrLogin
      id={id}
      state={{
        kind: !accountPhone ? 'no-phone' : accountPhone !== request.phone ? 'mismatch' : 'ready',
        device: request.device_label,
        requestedPhone: maskPhone(request.phone),
        accountName: context.profile.full_name || context.profile.email,
        expiresAt: request.expires_at,
      }}
    />
  )
}
