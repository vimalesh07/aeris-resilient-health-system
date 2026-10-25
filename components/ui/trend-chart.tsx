'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Point {
  label: string
  value: number
}

/**
 * Single-series line chart: 2px line, soft area, recessive grid, optional
 * baseline reference, and a crosshair tooltip on hover/touch.
 */
export function TrendChart({
  data,
  unit,
  color = 'var(--info)',
  baseline,
  baselineLabel = 'Your normal',
  datasetKey = 'default',
  demo = false,
  height = 180,
  decimals = 0,
  ariaLabel,
  className,
}: {
  data: Point[]
  unit: string
  color?: string
  baseline?: number
  baselineLabel?: string
  /** Changing this cross-fades the line instead of redrawing it. */
  datasetKey?: string
  demo?: boolean
  height?: number
  decimals?: number
  ariaLabel: string
  className?: string
}) {
  const gradientId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [width, setWidth] = useState(600)
  const reduce = useReducedMotion()
  const firstKey = useRef(datasetKey)

  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const W = 600
  const H = height
  const PAD_T = 12
  const PAD_B = 22

  const { min, max, points } = useMemo(() => {
    const values = data.map((d) => d.value).concat(baseline !== undefined ? [baseline] : [])
    let lo = Math.min(...values)
    let hi = Math.max(...values)
    if (lo === hi) {
      lo -= 1
      hi += 1
    }
    const pad = (hi - lo) * 0.15
    lo -= pad
    hi += pad
    const pts = data.map((d, i) => ({
      x: data.length === 1 ? W / 2 : (i / (data.length - 1)) * W,
      y: PAD_T + (1 - (d.value - lo) / (hi - lo)) * (H - PAD_T - PAD_B),
    }))
    return { min: lo, max: hi, points: pts }
  }, [data, baseline, H])

  if (data.length === 0) {
    return <div className={cn('grid place-items-center rounded-xl bg-surface-2 text-sm text-fg-muted', className)} style={{ height }}>No data yet</div>
  }

  const yFor = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H - PAD_B} L0,${H - PAD_B} Z`
  const gridYs = [0.25, 0.5, 0.75].map((f) => PAD_T + f * (H - PAD_T - PAD_B))

  const onMove = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    setHover(Math.round(ratio * (data.length - 1)))
  }

  const active = hover !== null ? { d: data[hover], p: points[hover] } : null
  // Roughly one time label per 90px so labels never collide.
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(width / 90))))

  return (
    <div className={cn('relative', className)}>
      <div
        ref={wrapRef}
        className="relative touch-none"
        style={{ height }}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerDown={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={ariaLabel}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {gridYs.map((y) => (
            <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1="0" x2={W} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--border-hover)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {baseline !== undefined && (
            <line x1="0" x2={W} y1={yFor(baseline)} y2={yFor(baseline)} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          )}
          <AnimatePresence initial={false}>
            <motion.g key={datasetKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.24 }}>
              <path d={area} fill={`url(#${gradientId})`} />
              <motion.path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={!reduce && datasetKey === firstKey.current ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.g>
          </AnimatePresence>
          {active && <line x1={active.p.x} x2={active.p.x} y1={PAD_T} y2={H - PAD_B} stroke="var(--text-muted)" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
        </svg>

        {active && (
          <span
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface"
            style={{ left: `${(active.p.x / W) * 100}%`, top: active.p.y, background: color }}
          />
        )}

        {demo && (
          <span className="pointer-events-none absolute top-0 right-0 rounded-full border border-dashed border-line-strong px-2 py-0.5 text-[10px] font-medium text-fg-muted">
            Demo data
          </span>
        )}

        {baseline !== undefined && (
          <span className="pointer-events-none absolute right-0 -translate-y-full rounded bg-surface px-1 pb-0.5 text-[10px] text-fg-2" style={{ top: yFor(baseline) }}>
            {baselineLabel} {baseline.toFixed(decimals)}
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 font-mono text-[10px] whitespace-nowrap text-fg-muted">
          {data.map((d, i) => {
            if (i % labelEvery !== 0) return null
            const pct = (points[i].x / W) * 100
            return (
              <span
                key={`${d.label}-${i}`}
                className="absolute bottom-0"
                style={{ left: `${pct}%`, transform: i === 0 ? 'none' : pct > 92 ? 'translateX(-100%)' : 'translateX(-50%)' }}
              >
                {d.label}
              </span>
            )
          })}
        </div>

        {active && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
            style={{ left: `${Math.min(88, Math.max(12, (active.p.x / W) * 100))}%`, top: active.p.y }}
          >
            <span className="text-fg-muted">{active.d.label}</span>
            <span className="ml-2 font-mono font-semibold text-fg tabular-nums">
              {active.d.value.toFixed(decimals)} {unit}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
