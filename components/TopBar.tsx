'use client'

import React from 'react'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { getView } from '@/lib/navigation'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { UserMenu } from '@/components/UserMenu'

export function TopBar() {
  const { activeView, setActiveView, userProfile, account } = useTelemetry()
  const view = getView(activeView)

  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-line bg-[color-mix(in_srgb,var(--bg-primary)_82%,transparent)] pt-[var(--sat)] backdrop-blur-md">
      <div className="mx-auto flex h-[var(--topbar-h)] max-w-[1400px] items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/user" className="flex items-center gap-2 lg:hidden" aria-label="AERIS home">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">
              <Activity className="size-4" aria-hidden />
            </span>
            <span className="text-sm font-bold tracking-[0.12em] text-fg">AERIS</span>
          </Link>
          <p className="hidden truncate text-sm font-medium text-fg-2 lg:block">{view.label}</p>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatus compact className="hidden sm:inline-flex" />
          <UserMenu
            name={userProfile.name || account?.name || ''}
            email={account?.email}
            role="user"
            onOpenSettings={() => setActiveView('settings')}
          />
        </div>
      </div>
    </header>
  )
}
