'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface Contributor {
  key: string
  label: string
  icon?: React.ElementType
  value: number
  max: number
}

/**
 * Weighted contributor bars. On mount they grow left-to-right with a 70ms
 * stagger (heaviest weight first) after the risk ring sweeps in.
 */
export function ContributorBars({ items, delay = 0.6, className }: { items: Contributor[]; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  const ordered = [...items].sort((a, b) => b.max - a.max)

  return (
    <ul className={cn('grid gap-3.5', className)}>
      {ordered.map(({ key, label, icon: Icon, value, max }, i) => {
        const pct = Math.min(100, (value / max) * 100)
        const tone = pct >= 50 ? 'bg-critical-solid' : pct >= 25 ? 'bg-monitor-solid' : 'bg-safe-solid'
        return (
          <li key={key} className={cn('grid items-center gap-3', Icon ? 'grid-cols-[18px_1fr_auto]' : 'grid-cols-[1fr_auto]')}>
            {Icon && <Icon className={cn('size-4', pct >= 50 ? 'text-critical' : 'text-fg-muted')} aria-hidden />}
            <div className="min-w-0">
              <p className="truncate text-[13px] text-fg-2">{label}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line ring-inset">
                <motion.div
                  className={cn('h-full w-full origin-left rounded-full', tone)}
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: Math.max(pct, 3) / 100 }}
                  transition={reduce ? { duration: 0 } : { delay: delay + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <span className="w-14 text-right font-mono text-[13px] text-fg tabular-nums">
              +{value}
              <span className="text-fg-muted">/{max}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
