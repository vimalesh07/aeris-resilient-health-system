'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * Number whose changed digits roll vertically (240ms); unchanged digits stay
 * still. Tabular mono figures keep the width from shifting.
 */
export function RollingNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const text = value.toFixed(decimals)
  const reduce = useReducedMotion()
  if (reduce) return <span className={cn('font-mono tabular-nums', className)}>{text}</span>

  return (
    <span className={cn('inline-flex font-mono tabular-nums', className)}>
      <span className="sr-only">{text}</span>
      {text.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={`${text.length}-${i}`} aria-hidden className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={ch}
                className="absolute inset-0 text-center"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            </AnimatePresence>
          </span>
        ) : (
          <span key={`${text.length}-${i}`} aria-hidden className={ch === '.' ? '-mx-[0.12em] leading-none' : 'leading-none'}>
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
