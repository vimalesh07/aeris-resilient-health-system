'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Inbox, Landmark, Loader2, MapPin, ShieldAlert, Siren, Undo2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Select, Textarea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { useToast } from '@/components/ui/toast'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { SEVERITY_RANK, SEVERITY_TONE, TYPE_ICON, TYPE_LABEL, relativeTime } from '@/lib/incident-meta'
import { cn } from '@/lib/utils'

export interface AdminRequest {
  id: string
  request_type: string
  severity: string
  title: string
  details: string | null
  recommended_action: string | null
  location_lat: number | string | null
  location_lon: number | string | null
  vitals: Record<string, unknown> | null
  status: string
  admin_decision: 'escalated' | 'declined' | null
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  escalated_at: string | null
  profile: { full_name: string | null; email: string | null; phone: string | null } | null
}

type Filter = 'pending' | 'escalated' | 'declined' | 'all'
type Severity = 'low' | 'medium' | 'high' | 'critical'

const POLL_MS = 20_000
const CANCELLED_NOTE = 'Cancelled by user'

function sortRequests(rows: AdminRequest[]) {
  return [...rows].sort(
    (a, b) =>
      Number(a.admin_decision !== null) - Number(b.admin_decision !== null) ||
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

function decisionBadge(req: AdminRequest): { label: string; tone: BadgeTone } {
  if (req.admin_decision === 'escalated') return { label: req.status === 'resolved' ? 'Resolved by government' : 'Sent to government', tone: req.status === 'resolved' ? 'success' : 'brand' }
  if (req.admin_decision === 'declined') return req.status === 'resolved' ? { label: 'Handled internally', tone: 'success' } : { label: 'Declined', tone: 'neutral' }
  if (req.admin_notes?.startsWith(CANCELLED_NOTE)) return { label: 'Cancelled by user', tone: 'neutral' }
  return { label: req.status === 'reviewing' ? 'In review' : 'Pending review', tone: 'warning' }
}

async function patchRequest(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request update failed.')
  return data
}

export function RequestQueue({ initialRequests, live }: { initialRequests: AdminRequest[]; live: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<Filter>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [escalating, setEscalating] = useState<AdminRequest | null>(null)
  const [declining, setDeclining] = useState<AdminRequest | null>(null)
  const requestsRef = useRef(requests)
  requestsRef.current = requests
  // Stable so the open Dialog doesn't re-run its focus trap on every keystroke.
  const closeEscalate = useCallback(() => setEscalating(null), [])
  const closeDecline = useCallback(() => setDeclining(null), [])

  // Server refreshes (realtime or after an action) replace local state.
  useEffect(() => setRequests(initialRequests), [initialRequests])

  useEffect(() => {
    if (!live) return
    let disposed = false
    let poll: number | undefined
    const startPolling = () => {
      if (!disposed && poll === undefined) poll = window.setInterval(() => router.refresh(), POLL_MS)
    }
    let cleanup: (() => void) | undefined
    try {
      const supabase = createBrowserSupabaseClient()
      const channel = supabase
        .channel('admin-emergency-requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_requests' }, (payload: { eventType: string; new: Partial<AdminRequest> }) => {
          if (payload.eventType === 'INSERT') {
            const type = payload.new.request_type ?? 'sos'
            toast({ tone: type === 'sos' ? 'warning' : 'info', title: `New ${TYPE_LABEL[type] ?? 'request'} request`, description: payload.new.title })
          }
          router.refresh()
        })
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') startPolling()
        })
      cleanup = () => void supabase.removeChannel(channel)
    } catch {
      startPolling()
    }
    return () => {
      disposed = true
      if (poll !== undefined) window.clearInterval(poll)
      cleanup?.()
    }
  }, [live, router, toast])

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.admin_decision === null).length,
      escalated: requests.filter((r) => r.admin_decision === 'escalated').length,
      declined: requests.filter((r) => r.admin_decision === 'declined').length,
      all: requests.length,
    }),
    [requests],
  )

  const rows = useMemo(
    () =>
      sortRequests(
        requests.filter((r) =>
          filter === 'pending' ? r.admin_decision === null : filter === 'all' ? true : r.admin_decision === filter,
        ),
      ),
    [requests, filter],
  )

  const updateLocal = (id: string, patch: Partial<AdminRequest>) => setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const toggle = (req: AdminRequest) => {
    const opening = expanded !== req.id
    setExpanded(opening ? req.id : null)
    if (opening && live && req.status === 'submitted' && req.admin_decision === null) {
      updateLocal(req.id, { status: 'reviewing' })
      patchRequest(req.id, { action: 'review' }).catch(() => updateLocal(req.id, { status: 'submitted' }))
    }
  }

  const runAction = useCallback(
    async (req: AdminRequest, body: Record<string, unknown>, optimistic: Partial<AdminRequest>, success: { title: string; description: string }) => {
      const snapshot = requestsRef.current
      setBusyId(req.id)
      updateLocal(req.id, optimistic)
      try {
        await patchRequest(req.id, body)
        toast({ tone: 'success', ...success })
        router.refresh()
        return true
      } catch (error) {
        setRequests(snapshot)
        toast({ tone: 'error', title: 'Action failed', description: error instanceof Error ? error.message : 'Request update failed.' })
        return false
      } finally {
        setBusyId(null)
      }
    },
    [router, toast],
  )

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <CardHeader
          title="Request queue"
          description="Every SOS, report and health alert lands here first. Only requests you escalate reach the government."
          icon={<ShieldAlert className="size-4" />}
        />
        <Segmented
          label="Filter requests"
          value={filter}
          onChange={setFilter}
          className="self-start sm:self-auto"
          options={[
            { value: 'pending', label: `Pending${counts.pending ? ` ${counts.pending}` : ''}` },
            { value: 'escalated', label: 'Escalated' },
            { value: 'declined', label: 'Declined' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-fg-muted">
            <Inbox className="size-5" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-semibold text-fg">{requests.length === 0 ? 'No requests yet' : filter === 'pending' ? 'All caught up' : 'Nothing matches this filter'}</p>
          <p className="mt-1 max-w-sm text-sm text-fg-2">
            {requests.length === 0 ? 'SOS calls, reports and critical health alerts from users will appear here as they happen.' : filter === 'pending' ? 'Every request has been reviewed.' : 'Try another filter to see more requests.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((req) => {
            const type = req.request_type?.toLowerCase()
            const severity = req.severity?.toLowerCase()
            const Icon = TYPE_ICON[type] ?? Siren
            const open = expanded === req.id
            const decision = decisionBadge(req)
            const busy = busyId === req.id
            return (
              <li key={req.id}>
                <button
                  type="button"
                  onClick={() => toggle(req)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-surface-2 sm:items-center md:px-5"
                >
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', severity === 'critical' ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-fg-2')}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{TYPE_LABEL[type] ?? req.request_type}</p>
                      <Badge tone={SEVERITY_TONE[severity] ?? 'neutral'}>{req.severity}</Badge>
                      <Badge tone={decision.tone}>{decision.label}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-fg-2">{req.title}</p>
                    <p className="mt-0.5 text-xs text-fg-muted" suppressHydrationWarning>
                      {req.profile?.full_name || req.profile?.email || 'Unknown user'} · {relativeTime(req.created_at)}
                    </p>
                  </div>
                  <motion.span animate={{ rotate: open ? 180 : 0 }} className="mt-2 shrink-0 text-fg-muted sm:mt-0">
                    <ChevronDown className="size-4" aria-hidden />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <RequestDetails
                        req={req}
                        busy={busy}
                        disabled={!live || busyId !== null}
                        onEscalate={() => setEscalating(req)}
                        onDecline={() => setDeclining(req)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      )}

      {escalating && (
        <EscalateDialog
          key={escalating.id}
          req={escalating}
          busy={busyId === escalating.id}
          onClose={closeEscalate}
          onConfirm={async (summary, severity) => {
            const ok = await runAction(
              escalating,
              { action: 'escalate', summary, severity },
              { admin_decision: 'escalated', status: 'verified', escalated_at: new Date().toISOString() },
              { title: 'Sent to government', description: 'An anonymised incident is now in the government feed.' },
            )
            if (ok) setEscalating(null)
          }}
        />
      )}
      {declining && (
        <DeclineDialog
          key={declining.id}
          req={declining}
          busy={busyId === declining.id}
          onClose={closeDecline}
          onConfirm={async (notes, resolved) => {
            const ok = await runAction(
              declining,
              { action: 'decline', notes, resolved },
              { admin_decision: 'declined', status: resolved ? 'resolved' : 'rejected', admin_notes: declining.admin_notes ? `${declining.admin_notes}\n${notes}` : notes },
              { title: resolved ? 'Handled internally' : 'Request declined', description: 'It will not be sent to the government.' },
            )
            if (ok) setDeclining(null)
          }}
        />
      )}
    </Card>
  )
}

function RequestDetails({ req, busy, disabled, onEscalate, onDecline }: { req: AdminRequest; busy: boolean; disabled: boolean; onEscalate: () => void; onDecline: () => void }) {
  const vitals = req.vitals ?? {}
  const vitalRows = [
    { label: 'Heart rate', value: vitals.heartRate, unit: 'BPM' },
    { label: 'SpO₂', value: vitals.spo2, unit: '%' },
    { label: 'Body temp', value: vitals.bodyTemp, unit: '°C' },
  ].filter((v) => v.value !== undefined && v.value !== null && v.value !== '')
  const hasLocation = req.location_lat !== null && req.location_lon !== null

  return (
    <div className="grid gap-4 px-4 pb-4 text-sm text-fg-2 md:px-5 md:pl-[68px]">
      {req.details && <p className="whitespace-pre-line">{req.details}</p>}
      {req.recommended_action && (
        <p>
          <span className="font-medium text-fg">Recommended action: </span>
          {req.recommended_action}
        </p>
      )}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {vitalRows.length > 0 && (
          <div className="rounded-xl border border-line p-3">
            <dt className="text-eyebrow text-fg-muted uppercase">Vitals at send time</dt>
            <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[13px] text-fg tabular-nums">
              {vitalRows.map((v) => (
                <span key={v.label}>
                  {v.label} {String(v.value)}
                  {v.unit}
                </span>
              ))}
            </dd>
          </div>
        )}
        <div className="rounded-xl border border-line p-3">
          <dt className="text-eyebrow text-fg-muted uppercase">User contact</dt>
          <dd className="mt-1 text-fg">
            {req.profile?.full_name || 'Unnamed user'}
            {req.profile?.phone && (
              <>
                {' · '}
                <a href={`tel:${req.profile.phone}`} className="text-brand underline-offset-4 hover:underline">
                  {req.profile.phone}
                </a>
              </>
            )}
            {req.profile?.email && <span className="block text-fg-2">{req.profile.email}</span>}
          </dd>
        </div>
      </dl>
      {hasLocation && (
        <a
          href={`https://maps.google.com/?q=${req.location_lat},${req.location_lon}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 self-start text-brand underline-offset-4 hover:underline"
        >
          <MapPin className="size-4" aria-hidden /> Open location in Google Maps
        </a>
      )}
      {req.admin_notes && (
        <p className="rounded-xl bg-surface-2 p-3 whitespace-pre-line">
          <span className="font-medium text-fg">Admin notes: </span>
          {req.admin_notes}
        </p>
      )}
      <p className="font-mono text-xs text-fg-muted">
        Received {new Date(req.created_at).toLocaleString()} · ID {req.id.slice(0, 8)}
        {req.escalated_at && ` · Escalated ${new Date(req.escalated_at).toLocaleString()}`}
      </p>
      {req.admin_decision === null && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="h-11 w-full sm:h-10 sm:w-auto" onClick={onEscalate} disabled={disabled}>
            {busy ? <Loader2 className="animate-spin" /> : <Landmark />} Send to Government
          </Button>
          <Button variant="secondary" className="h-11 w-full sm:h-10 sm:w-auto" onClick={onDecline} disabled={disabled}>
            <Undo2 /> Handle internally / Decline
          </Button>
        </div>
      )}
    </div>
  )
}

function EscalateDialog({ req, busy, onClose, onConfirm }: { req: AdminRequest; busy: boolean; onClose: () => void; onConfirm: (summary: string, severity: Severity) => void }) {
  const type = req.request_type?.toLowerCase()
  const [summary, setSummary] = useState(`${TYPE_LABEL[type] ?? req.request_type} · ${req.title} · ${req.severity}`.slice(0, 500))
  const [severity, setSeverity] = useState<Severity>((req.severity as Severity) ?? 'high')
  const trimmed = summary.trim()
  const error = trimmed.length < 10 ? 'Write at least 10 characters.' : null

  return (
    <Dialog open onClose={onClose} dismissible={!busy} title="Send to Government" description="This creates an anonymised incident in the government feed.">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!error) onConfirm(trimmed, severity)
        }}
        noValidate
      >
        <p role="note" className="flex gap-2 rounded-xl border border-warning-line bg-warning-soft p-3 text-sm text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Do not include names, phone numbers or health readings. Government sees only this summary, type, severity and location.
        </p>
        <Field label="Public summary" htmlFor="escalate-summary" hint={`${trimmed.length}/500`}>
          <Textarea
            id="escalate-summary"
            value={summary}
            maxLength={500}
            onChange={(e) => setSummary(e.target.value)}
            aria-invalid={Boolean(error)}
            data-autofocus
          />
        </Field>
        {error && (
          <p role="alert" className="-mt-2 text-sm text-danger">
            {error}
          </p>
        )}
        <Field label="Severity" htmlFor="escalate-severity">
          <Select id="escalate-severity" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" className="h-11 sm:h-10" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" className="h-11 sm:h-10" disabled={busy || Boolean(error)}>
            {busy ? <Loader2 className="animate-spin" /> : <Landmark />} Confirm and send
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function DeclineDialog({ req, busy, onClose, onConfirm }: { req: AdminRequest; busy: boolean; onClose: () => void; onConfirm: (notes: string, resolved: boolean) => void }) {
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState<'resolved' | 'rejected'>('resolved')
  const [touched, setTouched] = useState(false)
  const trimmed = notes.trim()
  const error = trimmed.length < 3 ? 'Give a reason (at least 3 characters).' : null

  return (
    <Dialog open onClose={onClose} dismissible={!busy} title="Handle internally or decline" description={`“${req.title}” will not be sent to the government.`}>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          setTouched(true)
          if (!error) onConfirm(trimmed, outcome === 'resolved')
        }}
        noValidate
      >
        <div className="grid gap-1.5">
          <p className="text-sm font-medium text-fg">Outcome</p>
          <Segmented
            label="Outcome"
            value={outcome}
            onChange={setOutcome}
            className="self-start"
            options={[
              { value: 'resolved', label: 'Resolved by us' },
              { value: 'rejected', label: 'Not valid / rejected' },
            ]}
          />
        </div>
        <Field label="Reason" htmlFor="decline-notes" hint="Visible to admins only.">
          <Textarea
            id="decline-notes"
            value={notes}
            maxLength={1000}
            onChange={(e) => setNotes(e.target.value)}
            aria-invalid={touched && Boolean(error)}
            placeholder={outcome === 'resolved' ? 'e.g. Called the user, local volunteers delivered water.' : 'e.g. Duplicate of an earlier request.'}
            data-autofocus
          />
        </Field>
        {touched && error && (
          <p role="alert" className="-mt-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" className="h-11 sm:h-10" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" className="h-11 sm:h-10" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {outcome === 'resolved' ? 'Mark handled' : 'Decline request'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
