'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Construction, HeartPulse, Loader2, MapPin, ShieldCheck, Siren, Utensils, X } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import type { PushNotificationEvent } from '@/types/aeris'
import { cn } from '@/lib/utils'

const DURATION_MS = 7000

const META: Record<PushNotificationEvent['type'], { icon: React.ElementType; tone: string; label: string }> = {
  sos: { icon: Siren, tone: 'bg-brand text-white', label: 'Emergency alert' },
  threshold: { icon: HeartPulse, tone: 'bg-brand text-white', label: 'Health alert' },
  obstacle: { icon: Construction, tone: 'bg-warning text-white', label: 'Report sent' },
  food: { icon: Utensils, tone: 'bg-success text-white', label: 'Request sent' },
  cancel: { icon: CheckCircle2, tone: 'bg-success text-white', label: 'Alert cancelled' },
}

/** Confirms that an alert or report left the device, and whether it was delivered. */
export function PushNotificationToast() {
  const { activePushNotification, dismissPushNotification } = useTelemetry()
  const [current, setCurrent] = useState<PushNotificationEvent | null>(null)

  useEffect(() => {
    if (activePushNotification) setCurrent(activePushNotification)
  }, [activePushNotification])

  useEffect(() => {
    if (!current) return
    const t = window.setTimeout(() => setCurrent(null), DURATION_MS)
    return () => window.clearTimeout(t)
  }, [current?.id])

  const close = () => {
    setCurrent(null)
    dismissPushNotification()
  }

  const meta = current ? META[current.type] : null
  const status = current?.smsStatus ?? ''
  const pending = status.startsWith('Sending')
  const delivered = status === 'Delivered'

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-[calc(var(--topbar-h)+12px+var(--sat))] z-[var(--z-toast)] flex justify-center">
      <AnimatePresence>
        {current && meta && (
          <motion.div
            key={current.id}
            role="status"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 460, damping: 36 }}
            className="pointer-events-auto relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-line border-l-[3px] bg-surface shadow-lg"
            style={{ borderLeftColor: current.type === 'sos' || current.type === 'threshold' ? 'var(--critical-solid)' : current.type === 'obstacle' ? 'var(--monitor-solid)' : 'var(--safe-solid)' }}
          >
            <div className="flex items-start gap-3 p-4">
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', meta.tone)}>
                <meta.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-fg-muted">
                  {meta.label} · {current.timestamp}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-fg">{current.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-fg-2">{current.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className={cn('inline-flex items-center gap-1 font-medium', pending ? 'text-fg-muted' : delivered ? 'text-success' : 'text-warning')}>
                    {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                    {status}
                  </span>
                  {current.sentToCoordinators && (
                    <span className="inline-flex items-center gap-1 text-fg-muted">
                      <ShieldCheck className="size-3.5" aria-hidden />
                      Sent to AERIS coordinators
                    </span>
                  )}
                  {current.location && (
                    <span className="inline-flex items-center gap-1 text-fg-muted">
                      <MapPin className="size-3.5" aria-hidden />
                      {current.location.lat}, {current.location.lon}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Dismiss"
                className="-m-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <X className="size-4" />
              </button>
            </div>
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-brand/60"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: DURATION_MS / 1000, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
