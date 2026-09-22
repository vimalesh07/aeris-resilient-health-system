import 'server-only'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type AppRole = 'user' | 'admin' | 'government'

export interface AuthContext {
  user: { id: string; email?: string }
  profile: { id: string; full_name: string; email: string; role: AppRole; phone: string | null }
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, phone')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !['user', 'admin', 'government'].includes(profile.role)) return null
  return { user: { id: user.id, email: user.email }, profile: profile as AuthContext['profile'] }
}

export async function requireRole(role: AppRole): Promise<AuthContext> {
  const context = await getAuthContext()
  if (!context) redirect('/login?error=session')
  if (context.profile.role !== role) redirect('/unauthorized')
  return context
}
