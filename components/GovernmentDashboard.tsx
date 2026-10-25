'use client'

import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Construction, HeartPulse, Inbox, ShieldCheck, Siren, Utensils } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Segmented } from '@/components/ui/segmented'
import { cn } from '@/lib/utils'

interface Incident {
  id: string
  incident_type: string
  severity: string
  status: string
  summary: string
  created_at: string
}

const SEVERITY_TONE: Record<string, BadgeTone> = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' }
const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const TYPE_ICON: Record<string, React.ElementType> = { sos: Siren, threshold: HeartPulse, obstacle: Construction, food: Utensils }
const TYPE_LABEL: Record<string, string> = { sos: 'SOS', threshold: 'Health alert', obstacle: 'Blocked path', food: 'Food & water' }

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function GovernmentDashboard({ profile, incidents }: { profile: { full_name: string; role: 'government' }; incidents: Incident[] }) {
  return (
    <PortalShell portal="Public safety" role="government" name={profile.full_name}>
      <IncidentFeed incidents={incidents} />
    </PortalShell>
  )
}

function IncidentFeed({ incidents }: { incidents: Incident[] }) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'open'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const counts = useMemo(
    () => ({
      total: incidents.length,
      critical: incidents.filter((i) => i.severity?.toLowerCase() === 'critical').length,
      open: incidents.filter((i) => i.status?.toLowerCase() !== 'resolved').length,
    }),
    [incidents],
  )

  const rows = useMemo(() => {
    const filtered = incidents.filter((i) =>
      filter === 'critical' ? i.severity?.toLowerCase() === 'critical' : filter === 'open' ? i.status?.toLowerCase() !== 'resolved' : true,
    )
    return [...filtered].sort(
      (a, b) =>
        (SEVERITY_RANK[a.severity?.toLowerCase()] ?? 9) - (SEVERITY_RANK[b.severity?.toLowerCase()] ?? 9) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [incidents, filter])

  return (
    <>
      <PageHeader
        title="Incident feed"
        description="Emergency requests from AERIS users in your region. Identities and personal health data are hidden."
        eyebrow={
          <Badge tone="success">
            <ShieldCheck className="size-3.5" aria-hidden /> Anonymised
          </Badge>
        }
      />

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'Total incidents', value: counts.total },
          { label: 'Critical', value: counts.critical, tone: counts.critical > 0 ? 'text-danger' : undefined },
          { label: 'Open', value: counts.open },
        ].map((s) => (
          <Card key={s.label} className="p-4 md:p-5">
            <p className={cn('font-mono text-2xl font-light tracking-tight text-fg tabular-nums md:text-3xl', s.tone)}>{s.value}</p>
            <p className="text-eyebrow text-fg-muted uppercase">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <p className="text-sm font-semibold text-fg">
            {rows.length} {rows.length === 1 ? 'incident' : 'incidents'}
          </p>
          <Segmented
            label="Filter incidents"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'critical', label: 'Critical' },
              { value: 'open', label: 'Open' },
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-fg-muted">
              <Inbox className="size-5" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-semibold text-fg">{incidents.length === 0 ? 'No incidents yet' : 'Nothing matches this filter'}</p>
            <p className="mt-1 max-w-sm text-sm text-fg-2">
              {incidents.length === 0 ? 'SOS calls and critical health alerts from users will appear here as they happen.' : 'Try another filter to see more incidents.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((inc) => {
              const type = inc.incident_type?.toLowerCase()
              const severity = inc.severity?.toLowerCase()
              const Icon = TYPE_ICON[type] ?? Siren
              const open = expanded === inc.id
              return (
                <li key={inc.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : inc.id)}
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-surface-2 md:px-5"
                  >
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', severity === 'critical' ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-fg-2')}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-fg">{TYPE_LABEL[type] ?? inc.incident_type}</p>
                        <Badge tone={SEVERITY_TONE[severity] ?? 'neutral'}>{inc.severity}</Badge>
                        <Badge tone={inc.status?.toLowerCase() === 'resolved' ? 'success' : 'neutral'}>{inc.status}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-fg-2">{inc.summary}</p>
                    </div>
                    <span className="hidden shrink-0 font-mono text-xs text-fg-muted sm:block">{relativeTime(inc.created_at)}</span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-fg-muted">
                      <ChevronDown className="size-4" aria-hidden />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pl-16 text-sm text-fg-2 md:px-5 md:pl-[68px]">
                          <p className="whitespace-pre-line">{inc.summary}</p>
                          <p className="mt-2 font-mono text-xs text-fg-muted">Reported {new Date(inc.created_at).toLocaleString()} · ID {inc.id.slice(0, 8)}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
