'use client'

import React from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

/** Labelled horizontal bar for a 0–100 value. Animates with transform only. */
export function Meter({
  label,
  value,
  max = 100,
  suffix,
  tone = 'auto',
  className,
}: {
  label: React.ReactNode
  value: number
  max?: number
  suffix?: React.ReactNode
  tone?: 'auto' | 'neutral' | 'brand' | 'info'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color =
    tone === 'neutral'
      ? 'bg-fg-2'
      : tone === 'brand'
      ? 'bg-brand'
      : tone === 'info'
      ? 'bg-info'
      : pct > 60
      ? 'bg-danger'
      : pct > 30
      ? 'bg-warning'
      : 'bg-success'
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-fg-2">{label}</span>
        <span className="text-fg tabular-nums">
          {value}
          <span className="text-fg-muted">{suffix ?? `/${max}`}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <motion.div
          className={cn('h-full w-full origin-left rounded-full', color)}
          initial={false}
          animate={{ scaleX: Math.max(pct, 2) / 100 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}

/** Small stat with a label, used inside cards. */
export function Stat({ label, value, unit, hint, className }: { label: string; value: React.ReactNode; unit?: string; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface-2/60 p-3.5', className)}>
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-fg tabular-nums">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-fg-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-fg-muted">{hint}</p>}
    </div>
  )
}
