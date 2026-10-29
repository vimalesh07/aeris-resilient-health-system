import { NextResponse, type NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'

const validActions = new Set(['review', 'escalate', 'decline'])
const validSeverities = new Set(['low', 'medium', 'high', 'critical'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/admin/requests/[id]'>) {
  const context = await getAuthContext()
  if (!context) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
  if (context.profile.role !== 'admin') return NextResponse.json({ error: 'Administrator role required.' }, { status: 403 })
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'Supabase is not configured on this server.' }, { status: 503 })

  const { id } = await ctx.params
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Invalid request id.' }, { status: 400 })

  let body: { action?: unknown; summary?: unknown; severity?: unknown; notes?: unknown; resolved?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 })
  }
  const { action, summary, severity, notes, resolved } = body
  if (typeof action !== 'string' || !validActions.has(action)) {
    return NextResponse.json({ error: 'Action must be review, escalate or decline.' }, { status: 400 })
  }

  try {
    const supabase = await createServerSupabaseClient()

    if (action === 'review') {
      const { data, error } = await supabase
        .from('emergency_requests')
        .update({ status: 'reviewing', reviewed_by: context.user.id, reviewed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'submitted')
        .select('id, status')
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ id, status: data?.status ?? null })
    }

    if (action === 'escalate') {
      const text = typeof summary === 'string' ? summary.trim() : ''
      if (text.length < 10 || text.length > 500) {
        return NextResponse.json({ error: 'The public summary must be 10–500 characters.' }, { status: 400 })
      }
      if (severity !== undefined && severity !== null && (typeof severity !== 'string' || !validSeverities.has(severity))) {
        return NextResponse.json({ error: 'Severity must be low, medium, high or critical.' }, { status: 400 })
      }
      const { data: incidentId, error } = await supabase.rpc('escalate_emergency_request', {
        p_request_id: id,
        p_summary: text,
        p_severity: severity ?? null,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: rpcErrorStatus(error.code) })
      return NextResponse.json({ id, adminDecision: 'escalated', incidentId })
    }

    const reason = typeof notes === 'string' ? notes.trim() : ''
    if (reason.length < 3 || reason.length > 1000) {
      return NextResponse.json({ error: 'The reason must be 3–1000 characters.' }, { status: 400 })
    }
    const { error } = await supabase.rpc('decline_emergency_request', {
      p_request_id: id,
      p_notes: reason,
      p_resolved: resolved === true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: rpcErrorStatus(error.code) })
    return NextResponse.json({ id, adminDecision: 'declined', status: resolved === true ? 'resolved' : 'rejected' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Request update failed.' }, { status: 500 })
  }
}

function rpcErrorStatus(code?: string) {
  if (code === '42501') return 403
  if (code === 'P0002') return 404
  if (code === '22023') return 409
  return 500
}
