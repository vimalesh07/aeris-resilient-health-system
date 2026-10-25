'use client'

import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

/** Horizontal Safe / Monitor / Critical scale with a marker (used where a second ring would compete with the risk ring). */
export function TierScale({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion()
  const pct = Math.min(98, Math.max(2, value))
  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2 rounded-full">
        <div className="absolute inset-0 flex gap-0.5 overflow-hidden rounded-full">
          <span className="h-full w-[30%] bg-safe-solid" />
          <span className="h-full w-[30%] bg-monitor-solid" />
          <span className="h-full flex-1 bg-critical-solid" />
        </div>
        <motion.span
          aria-hidden
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-fg shadow-md"
          initial={reduce ? false : { left: '2%' }}
          animate={{ left: `${pct}%` }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-fg-muted">
        <span>Safe 0–30</span>
        <span>Monitor 31–60</span>
        <span>Critical 61–100</span>
      </div>
    </div>
  )
}
