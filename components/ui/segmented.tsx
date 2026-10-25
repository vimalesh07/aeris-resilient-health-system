'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: React.ReactNode }[]
  className?: string
  label: string
}) {
  const id = React.useId()
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-xl border border-line bg-surface-2 p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative h-8 cursor-pointer rounded-lg px-3 text-[13px] font-medium transition-colors',
              active ? 'text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
