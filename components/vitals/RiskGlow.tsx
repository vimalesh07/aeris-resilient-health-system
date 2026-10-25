'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { RiskTier } from '@/lib/risk-tier'
import { cn } from '@/lib/utils'

const TIER_VAR: Record<RiskTier, string> = {
  safe: 'var(--safe-solid)',
  monitor: 'var(--monitor-solid)',
  critical: 'var(--critical-solid)',
}

/**
 * Soft tier-coloured light behind a hero. Changes are an opacity cross-fade
 * between two pre-rendered radial layers — never an animated filter.
 * Strength comes from --glow-alpha (stronger in dark mode).
 */
export function RiskGlow({ tier, color, className }: { tier: RiskTier | string; color?: string; className?: string }) {
  const fill = color ?? TIER_VAR[tier as RiskTier] ?? 'var(--risk)'
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 -z-10', className)} style={{ opacity: 'var(--glow-alpha)' }}>
      <AnimatePresence initial={false}>
        <motion.div
          key={`${tier}-${fill}`}
          className="absolute top-1/2 left-1/2 size-[600px] max-w-[160vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(closest-side, ${fill}, transparent)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>
    </div>
  )
}
