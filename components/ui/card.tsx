'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/motion'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[20px] border border-line bg-surface shadow-sm', className)} {...props} />
}

export function CardHeader({
  title,
  description,
  eyebrow,
  action,
  icon,
  iconLayoutId,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
  /** Shared-element id so an icon can morph here from another screen. */
  iconLayoutId?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <motion.span layoutId={iconLayoutId} transition={t.emphasis} className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg-2">
            {icon}
          </motion.span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-xs font-medium text-fg-muted">{eyebrow}</p>}
          <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
          {description && <p className="mt-1 text-sm text-fg-2">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
