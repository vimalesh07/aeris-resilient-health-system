'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { MoreHorizontal } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { USER_VIEWS, viewHref, type UserViewId } from '@/lib/navigation'
import { Dialog } from '@/components/ui/dialog'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { cn } from '@/lib/utils'

const PRIMARY: UserViewId[] = ['dashboard', 'climate', 'safe-places', 'assistant']

export function MobileNav() {
  const { activeView } = useTelemetry()
  const [moreOpen, setMoreOpen] = useState(false)
  const inMore = !PRIMARY.includes(activeView)

  useEffect(() => setMoreOpen(false), [activeView])

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-line bg-[color-mix(in_srgb,var(--panel-bg)_92%,transparent)] pb-[var(--sab)] backdrop-blur-md lg:hidden [[data-kb-open]_&]:hidden"
      >
        <ul className="mx-auto grid h-[var(--bottom-nav-h)] max-w-lg grid-cols-5">
          {PRIMARY.map((id) => {
            const view = USER_VIEWS.find((v) => v.id === id)!
            const Icon = view.icon
            const active = activeView === id
            return (
              <li key={id}>
                <Link
                  href={viewHref(id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn('relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium', active ? 'text-fg' : 'text-fg-muted')}
                >
                  {active && <motion.span layoutId="mobile-nav-active" className="absolute top-0 h-1 w-8 rounded-b-full bg-brand" transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }} />}
                  <Icon className="size-5" aria-hidden />
                  {view.shortLabel}
                </Link>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn('relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium', inMore ? 'text-fg' : 'text-fg-muted')}
            >
              {inMore && <span className="absolute top-0 h-1 w-8 rounded-b-full bg-brand" />}
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="All sections" description={<ConnectionStatus />}>
        <ul className="grid gap-1">
          {USER_VIEWS.map((view) => {
            const Icon = view.icon
            const active = activeView === view.id
            return (
              <li key={view.id}>
                <Link
                  href={viewHref(view.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 transition-colors', active ? 'bg-brand-soft' : 'hover:bg-surface-2')}
                >
                  <span className={cn('grid size-10 place-items-center rounded-xl', active ? 'bg-brand text-white' : 'bg-surface-2 text-fg-2')}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-sm font-semibold', active ? 'text-brand' : 'text-fg')}>{view.label}</span>
                    <span className="block truncate text-xs text-fg-muted">{view.description}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Dialog>
    </>
  )
}
