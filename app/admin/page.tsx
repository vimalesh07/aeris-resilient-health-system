import { AdminDashboard } from '@/components/AdminDashboard'
import type { AdminRequest } from '@/components/admin/RequestQueue'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'

const REQUEST_COLUMNS =
  'id, request_type, severity, title, details, recommended_action, location_lat, location_lon, vitals, status, admin_decision, admin_notes, created_at, reviewed_at, escalated_at, profile:profiles!emergency_requests_user_id_fkey(full_name, email, phone)'

export default async function AdminPage() {
  const context = await requireRole('admin')
  if (!hasSupabaseEnv()) {
    return (
      <AdminDashboard
        profile={{ full_name: context.profile.full_name, role: 'admin' }}
        counts={{ users: 1, requests: 0, alerts: 0, pending: 0 }}
        requests={[]}
        live={false}
      />
    )
  }
  const supabase = await createServerSupabaseClient()
  const [users, requests, alerts, pending, queue] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('emergency_requests').select('id', { count: 'exact', head: true }),
    supabase.from('risk_alerts').select('id', { count: 'exact', head: true }),
    supabase.from('emergency_requests').select('id', { count: 'exact', head: true }).is('admin_decision', null),
    supabase.from('emergency_requests').select(REQUEST_COLUMNS).order('created_at', { ascending: false }).limit(100),
  ])
  if (queue.error) console.warn('Unable to load the admin request queue:', queue.error)
  // An embedded to-one relation can come back as an object or a single-item array.
  const rows = ((queue.data ?? []) as unknown as (Omit<AdminRequest, 'profile'> & { profile: AdminRequest['profile'] | AdminRequest['profile'][] })[]).map((r) => ({
    ...r,
    profile: Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile,
  }))
  return (
    <AdminDashboard
      profile={{ full_name: context.profile.full_name, role: 'admin' }}
      counts={{ users: users.count || 0, requests: requests.count || 0, alerts: alerts.count || 0, pending: pending.count || 0 }}
      requests={rows}
      live
    />
  )
}
