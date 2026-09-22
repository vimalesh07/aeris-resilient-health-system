import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

const validRoles = new Set(['user', 'admin', 'government'])

export async function PATCH(request: Request) {
  const context = await getAuthContext()
  if (!context) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
  if (context.profile.role !== 'admin') return NextResponse.json({ error: 'Administrator role required.' }, { status: 403 })
  try {
    const { email, role } = await request.json()
    if (typeof email !== 'string' || !validRoles.has(role)) return NextResponse.json({ error: 'Valid email and role are required.' }, { status: 400 })
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin.from('profiles').update({ role }).eq('email', email.trim().toLowerCase()).select('email, role').single()
    if (error || !data) return NextResponse.json({ error: error?.message || 'User not found.' }, { status: 404 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Role update failed.' }, { status: 500 })
  }
}
