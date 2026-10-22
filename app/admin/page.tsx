import { AdminDashboard } from '@/components/AdminDashboard'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'

export default async function AdminPage() {
  const context = await requireRole('admin')
  if (!hasSupabaseEnv()) {
    return (
      <AdminDashboard
        profile={{ full_name: context.profile.full_name, role: 'admin' }}
        counts={{ users: 1, requests: 0, alerts: 0 }}
      />
    )
  }
  const supabase = await createServerSupabaseClient()
  const [users, requests, alerts] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('emergency_requests').select('id', { count: 'exact', head: true }),
    supabase.from('risk_alerts').select('id', { count: 'exact', head: true }),
  ])
  return <AdminDashboard profile={{ full_name: context.profile.full_name, role: 'admin' }} counts={{ users: users.count || 0, requests: requests.count || 0, alerts: alerts.count || 0 }} />
}

