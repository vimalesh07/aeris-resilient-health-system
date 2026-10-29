import { GovernmentDashboard } from '@/components/GovernmentDashboard'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'

export default async function GovernmentPage() {
  const context = await requireRole('government')
  if (!hasSupabaseEnv()) {
    return (
      <GovernmentDashboard
        profile={{ full_name: context.profile.full_name, role: 'government' }}
        incidents={[]}
      />
    )
  }
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('government_incidents').select('id, incident_type, severity, status, summary, created_at, escalated_at').order('created_at', { ascending: false }).limit(100)
  return <GovernmentDashboard profile={{ full_name: context.profile.full_name, role: 'government' }} incidents={data || []} />
}

