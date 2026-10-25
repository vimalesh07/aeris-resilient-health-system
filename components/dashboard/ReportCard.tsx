'use client'

import React, { useState } from 'react'
import { CheckCircle2, Construction, Loader2, Utensils } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { useTelemetry } from '@/hooks/useTelemetry'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type ReportType = 'obstacle' | 'food'

const REPORTS: Record<ReportType, { label: string; description: string; icon: React.ElementType; title: string; body: string }> = {
  obstacle: {
    label: 'Report a blocked path',
    description: 'Fallen tree, flooding or debris on your route',
    icon: Construction,
    title: 'Blocked path reported',
    body: 'A road or path is blocked at this location. Please send a clearance team or suggest a detour.',
  },
  food: {
    label: 'Request food & water',
    description: 'Ask relief teams for rations and drinking water',
    icon: Utensils,
    title: 'Food and water requested',
    body: 'Food rations and drinking water are needed at this location.',
  },
}

/** Non-emergency field reports, kept visually secondary to SOS. */
export function ReportCard({ className }: { className?: string }) {
  const { triggerNotificationPush, telemetry } = useTelemetry()
  const { toast } = useToast()
  const [busy, setBusy] = useState<ReportType | null>(null)
  const [sent, setSent] = useState<ReportType | null>(null)

  const send = async (type: ReportType) => {
    setBusy(type)
    const r = REPORTS[type]
    const data = await triggerNotificationPush({
      type,
      title: r.title,
      body: r.body,
      vitals: { heartRate: telemetry.heartRate, spo2: telemetry.spo2, bodyTemp: telemetry.bodyTemp },
    })
    setBusy(null)
    if (data) {
      setSent(type)
      window.setTimeout(() => setSent(null), 4000)
    } else {
      toast({ tone: 'error', title: 'Report not sent', description: 'Check your connection and try again.' })
    }
  }

  return (
    <Card className={cn('p-5 md:p-6', className)}>
      <CardHeader title="Report to relief teams" description="Shares your location so responders know where to go." />
      <div className="mt-4 grid gap-2">
        {(Object.keys(REPORTS) as ReportType[]).map((type) => {
          const r = REPORTS[type]
          const Icon = busy === type ? Loader2 : sent === type ? CheckCircle2 : r.icon
          return (
            <button
              key={type}
              type="button"
              disabled={busy !== null}
              onClick={() => send(type)}
              className="group flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2 disabled:cursor-wait disabled:opacity-70"
            >
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', sent === type ? 'bg-success-soft text-success' : 'bg-surface-2 text-fg-2 group-hover:bg-surface')}>
                <Icon className={cn('size-5', busy === type && 'animate-spin')} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{sent === type ? 'Sent — responders notified' : r.label}</span>
                <span className="block text-xs text-fg-muted">{r.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
