'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { RollingNumber } from '@/components/vitals/RollingNumber'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { t } from '@/lib/motion'

/** Keeps the last `size` values of a reading for a sparkline. */
export function useRecentValues(value: number | null, size = 40) {
  const [values, setValues] = useState<number[]>([])
  const last = useRef<number | null>(null)
  useEffect(() => {
    if (value === null || value === last.current) return
    last.current = value
    setValues((prev) => [...prev.slice(-(size - 1)), value])
  }, [value, size])
  return values
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="h-4 w-12" aria-hidden />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * 48).toFixed(1)},${(14 - ((v - min) / span) * 12).toFixed(1)}`)
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-12 overflow-visible" aria-hidden>
      <polyline points={pts.join(' ')} fill="none" stroke="var(--text-secondary)" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** A 6px dot that beats at the real heart rate (ambient loop, paused for reduced motion). */
function HeartbeatDot({ bpm }: { bpm: number }) {
  const reduce = useReducedMotion()
  const period = 60 / Math.min(200, Math.max(30, bpm))
  return (
    <motion.span
      aria-hidden
      className="size-1.5 rounded-full bg-brand"
      animate={reduce ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
      transition={reduce ? undefined : { duration: period, repeat: Infinity, ease: 'easeOut', times: [0, 0.15, 1] }}
    />
  )
}

/** Live = solid dot; Demo = hollow dot + the word. Never colour alone. */
function SourceChip({ source }: { source: 'live' | 'demo' }) {
  return source === 'live' ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-safe">
      <span className="size-1.5 rounded-full bg-safe-solid" aria-hidden /> Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-fg-muted">
      <span className="size-1.5 rounded-full border border-current" aria-hidden /> Demo
    </span>
  )
}

export function VitalTile({
  icon,
  label,
  value,
  decimals = 0,
  unit,
  spokenUnit,
  status,
  footnote,
  onClick,
  source,
  placeholder,
  sparkline,
  heartbeatBpm,
  morphId,
}: {
  icon: React.ReactNode
  label: string
  value: number | null
  decimals?: number
  unit: string
  spokenUnit?: string
  status?: { label: string; tone: BadgeTone }
  footnote?: React.ReactNode
  onClick?: () => void
  source: 'live' | 'demo'
  placeholder?: string
  sparkline?: number[]
  heartbeatBpm?: number | null
  /** Shared-element id: the icon morphs into the destination screen header. */
  morphId?: string
}) {
  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="flex items-center gap-2 text-[13px] font-medium whitespace-nowrap text-fg-2">
          <motion.span layoutId={morphId} transition={t.emphasis} className="grid size-8 place-items-center rounded-[10px] bg-surface-2 text-fg-2 ring-1 ring-line ring-inset [&_svg]:size-4">
            {icon}
          </motion.span>
          {label}
        </span>
        <SourceChip source={source} />
      </div>

      <div className="mt-5 flex items-end justify-between gap-2">
        <p className="flex items-end gap-1.5">
          <span className="sr-only">{value === null ? `${label}: no reading` : `${label} ${value.toFixed(decimals)} ${spokenUnit ?? unit}`}</span>
          <span aria-hidden className="contents">
          {value === null ? (
            <span className="font-mono text-metric font-light text-fg-muted">{placeholder ?? '--'}</span>
          ) : (
            <RollingNumber value={value} decimals={decimals} className="text-metric font-light text-fg" />
          )}
          <span aria-hidden className="pb-[0.2em] text-sm text-fg-muted">
            {unit}
          </span>
          </span>
        </p>
        <span className="flex items-center gap-2 pb-1.5">
          {sparkline && <Sparkline values={sparkline} />}
          {heartbeatBpm ? <HeartbeatDot bpm={heartbeatBpm} /> : null}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        {footnote && <p className="text-xs text-fg-muted">{footnote}</p>}
        {status && (
          <motion.span key={status.label} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}>
            <Badge tone={status.tone}>{status.label}</Badge>
          </motion.span>
        )}
      </div>
    </>
  )

  const cls = 'flex h-full min-h-[148px] flex-col rounded-[20px] border border-line bg-surface p-4 text-left shadow-sm md:p-5'
  return onClick ? (
    <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.99 }} className={cn(cls, 'cursor-pointer transition-[box-shadow,border-color] hover:border-line-strong md:hover:shadow-md')}>
      {body}
    </motion.button>
  ) : (
    <div className={cls}>{body}</div>
  )
}
