import 'server-only'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'

export type AppRole = 'user' | 'admin' | 'government'

export interface AuthContext {
  user: { id: string; email?: string }
  profile: { id: string; full_name: string; email: string; role: AppRole; phone: string | null }
}

const LOCAL_FALLBACK_CONTEXT: AuthContext = {
  user: { id: 'local-dev-user', email: 'user@aeris.local' },
  profile: {
    id: 'local-dev-user',
    full_name: 'Local User',
    email: 'user@aeris.local',
    role: 'user',
    phone: null,
  },
}

export async function getAuthContext(): Promise<AuthContext | null> {
  if (!hasSupabaseEnv()) {
    return LOCAL_FALLBACK_CONTEXT
  }

  try {
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
  } catch (err) {
    console.warn('Failed to retrieve Supabase auth context:', err)
    return null
  }
}

export async function requireRole(role: AppRole): Promise<AuthContext> {
  const context = await getAuthContext()
  if (!context) redirect('/login?error=session')
  if (context.profile.role !== role) {
    if (!hasSupabaseEnv()) {
      return {
        user: { id: `local-${role}-user`, email: `${role}@aeris.local` },
        profile: {
          id: `local-${role}-user`,
          full_name: `Local ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          email: `${role}@aeris.local`,
          role,
          phone: null,
        },
      }
    }
    redirect('/unauthorized')
  }
  return context
}

