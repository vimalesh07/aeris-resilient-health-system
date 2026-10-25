'use client'

import React from 'react'
import { Activity } from 'lucide-react'
import { PortalProviders } from '@/components/PortalProviders'
import { UserMenu } from '@/components/UserMenu'

/** Shared chrome for the admin and government portals. */
export function PortalShell({
  portal,
  role,
  name,
  children,
}: {
  portal: string
  role: 'admin' | 'government'
  name: string
  children: React.ReactNode
}) {
  return (
    <PortalProviders>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="min-h-dvh bg-canvas">
        <header className="sticky top-0 z-[var(--z-nav)] border-b border-line bg-[color-mix(in_srgb,var(--bg-primary)_82%,transparent)] pt-[var(--sat)] backdrop-blur-md">
          <div className="mx-auto flex h-[var(--topbar-h)] max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
                <Activity className="size-[18px]" aria-hidden />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-[0.12em] text-fg">AERIS</p>
                <p className="text-xs text-fg-muted">{portal}</p>
              </div>
            </div>
            <UserMenu name={name} role={role} />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-[1200px] px-4 py-6 outline-none md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </PortalProviders>
  )
}
