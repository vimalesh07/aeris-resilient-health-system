import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasSupabaseEnv } from '@/lib/supabase/env'

const VALID_ROLES = ['user', 'admin', 'government'] as const
type ValidRole = (typeof VALID_ROLES)[number]

/**
 * Dev/Testing endpoint to quickly switch the active user's role in public.profiles
 * so that USER, ADMIN, and GOVERNMENT workflows can all be tested independently.
 */
/**
 * Role switching lets any signed-in user change their own role, so it is only
 * available in development or when AERIS_ENABLE_PORTAL_SWITCH=true is set for
 * a demo deployment.
 */
function portalSwitchEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.AERIS_ENABLE_PORTAL_SWITCH === 'true'
}

export async function POST(req: NextRequest) {
  if (!portalSwitchEnabled()) {
    return NextResponse.json({ error: 'Portal switching is disabled on this deployment.' }, { status: 403 })
  }
  try {
    const { role } = await req.json()
    if (!VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 })
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({
        success: true,
        role,
        message: `Offline mode: Switched to ${role.toUpperCase()}. You can now access /${role}.`,
      })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            try {
              toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'You must be logged in to switch roles for testing.' }, { status: 401 })
    }

    // Update role directly for this user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: role as ValidRole })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      role,
      message: `Role switched to ${role.toUpperCase()}. You can now access /${role}.`,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to switch role.' }, { status: 500 })
  }
}
