'use client'

import React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BellOff, Check, CircleAlert, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTelemetry } from '@/hooks/useTelemetry'
import type { AlertItem } from '@/types/aeris'
import { cn } from '@/lib/utils'

const TONE: Record<AlertItem['severity'], 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

/** Live alerts feed (replaces the old Alerts page). */
export function AlertsCard({ className }: { className?: string }) {
  const { alerts, acknowledgeAlert, dismissAlert } = useTelemetry()
  const visible = alerts.filter((a) => !a.dismissed).slice(0, 5)
  const unread = visible.filter((a) => !a.acknowledged).length

  return (
    <Card className={cn('flex flex-col p-5 md:p-6', className)}>
      <CardHeader
        title="Alerts"
        description={unread > 0 ? `${unread} need${unread === 1 ? 's' : ''} your attention` : 'Everything is within your limits'}
        action={unread > 0 ? <Badge tone="danger">{unread} new</Badge> : null}
      />

      {visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
            <BellOff className="size-5" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-medium text-fg">No active alerts</p>
          <p className="mt-1 max-w-xs text-xs text-fg-muted">AERIS will notify you here and on your phone if a reading moves outside your safe range.</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {visible.map((a) => (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 16, transition: { duration: 0.14 } }}
                className={cn('rounded-xl border p-3.5', a.acknowledged ? 'border-line bg-surface' : 'border-line bg-surface-2')}
              >
                <div className="flex items-start gap-3">
                  <CircleAlert className={cn('mt-0.5 size-4 shrink-0', a.severity === 'Critical' ? 'text-danger' : a.severity === 'High' ? 'text-warning' : 'text-info')} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{a.title}</p>
                      <Badge tone={TONE[a.severity]}>{a.severity}</Badge>
                      <span className="text-xs text-fg-muted">{a.time}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-fg-2">{a.trigger}</p>
                    {a.recommendedAction && <p className="mt-1.5 text-xs text-fg-muted">Suggested: {a.recommendedAction}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!a.acknowledged && (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(a.id)}
                        aria-label={`Mark "${a.title}" as seen`}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-fg-muted hover:bg-surface hover:text-success"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissAlert(a.id)}
                      aria-label={`Dismiss "${a.title}"`}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg text-fg-muted hover:bg-surface hover:text-fg"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  )
}
