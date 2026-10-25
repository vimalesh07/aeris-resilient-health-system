'use client'

import { useEffect } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { TIER_META, type RiskTier } from '@/lib/risk-tier'
import { cn } from '@/lib/utils'

/**
 * Overall-risk ring. On mount the arc sweeps and the number counts up on the
 * same slow spring (the "reveal" preset); later changes re-spring from the
 * current value without replaying the reveal.
 */
export function RiskRing({ score, tier, className }: { score: number; tier: RiskTier; className?: string }) {
  const reduce = useReducedMotion()
  const v = useSpring(reduce ? score : 0, { stiffness: 60, damping: 20, mass: 1 })
  const progress = useTransform(v, (n) => Math.max(0.001, n / 100))
  const label = useTransform(v, (n) => Math.round(n).toString())
  const meta = TIER_META[tier]

  useEffect(() => {
    v.set(score)
  }, [score, v])

  return (
    <figure role="img" aria-label={`Overall risk ${score} out of 100, ${meta.label}`} className={cn('relative size-56 shrink-0 lg:size-64', className)}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--risk)"
          strokeWidth="8"
          strokeLinecap="round"
          style={{ pathLength: progress }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <motion.span aria-hidden suppressHydrationWarning className="font-mono text-display font-light text-fg tabular-nums">
          {label}
        </motion.span>
        <span className="text-eyebrow text-fg-muted uppercase">of 100</span>
      </div>
    </figure>
  )
}

/** Tier badge: icon + word + colour. Cross-fades on change. */
export function TierBadge({ tier, className }: { tier: RiskTier; className?: string }) {
  const meta = TIER_META[tier]
  const Icon = meta.icon
  return (
    <motion.span
      key={tier}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, delay: 0.1 }}
      className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold', meta.bg, meta.text, className)}
    >
      <Icon className="size-3.5" aria-hidden />
      {meta.label}
    </motion.span>
  )
}
