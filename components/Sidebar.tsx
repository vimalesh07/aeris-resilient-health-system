'use client'

import React from 'react'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import { motion } from 'motion/react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { USER_VIEWS, viewHref } from '@/lib/navigation'
import { SosButton } from '@/components/SosButton'
import { useDataSource } from '@/components/ConnectionStatus'
import { cn } from '@/lib/utils'
import { t } from '@/lib/motion'

const GROUPS = [
  { id: 'monitor', label: 'Monitor' },
  { id: 'tools', label: 'Tools' },
] as const

export function Sidebar() {
  const { activeView } = useTelemetry()
  const source = useDataSource()

  return (
    <aside className="sticky top-0 hidden h-dvh w-[var(--sidebar-w)] shrink-0 flex-col border-r border-line bg-sidebar px-3 py-5 lg:flex" aria-label="Main navigation">
      <Link href="/user" className="mb-6 flex items-center gap-2.5 rounded-xl px-2.5 py-1">
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
          <Activity className="size-[18px]" aria-hidden />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-[0.12em] text-fg">AERIS</span>
          <span className="text-[11px] text-fg-muted">Health &amp; climate safety</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 px-3 text-eyebrow font-medium text-fg-muted uppercase">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {USER_VIEWS.filter((v) => v.group === group.id).map((view) => {
                const active = activeView === view.id
                const Icon = view.icon
                return (
                  <li key={view.id}>
                    <Link
                      href={viewHref(view.id)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                        active ? 'text-fg' : 'text-fg-2 hover:bg-surface/60 hover:text-fg',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-surface shadow-sm ring-1 ring-line before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-full before:bg-brand"
                          transition={t.emphasis}
                        />
                      )}
                      <Icon className={cn('relative size-[18px]', active && 'text-brand')} aria-hidden />
                      <span className="relative">{view.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-3">
        <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-fg">
            <span className={cn('size-2 rounded-full', source.tone === 'live' ? 'bg-safe-solid' : 'border border-fg-muted')} aria-hidden />
            {source.tone === 'demo' ? 'Demo data — not your readings' : source.label}
          </div>
          <p className="mt-0.5 text-[11px] text-fg-muted">{source.detail}</p>
        </div>
        <SosButton />
      </div>
    </aside>
  )
}
