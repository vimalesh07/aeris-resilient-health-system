'use client'

import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { MobileNav } from '@/components/MobileNav'
import dynamic from 'next/dynamic'

const DemoToolbar = dynamic(() => import('@/components/DemoToolbar').then((m) => m.DemoToolbar), { ssr: false })
import { SosButton } from '@/components/SosButton'
import { HeartRateLimitSosPopup } from '@/components/HeartRateLimitSosPopup'
import { EmergencySosModal } from '@/components/EmergencySosModal'
import { PushNotificationToast } from '@/components/PushNotificationToast'
import { PortalProviders } from '@/components/PortalProviders'
import { TelemetryProvider, type AccountInfo } from '@/hooks/useTelemetry'

export function AerisDashboard({ account, children }: { account: AccountInfo; children: React.ReactNode }) {
  return (
    <PortalProviders>
      <TelemetryProvider account={account}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="flex min-h-dvh bg-canvas">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <DemoToolbar />
            <main
              id="main"
              tabIndex={-1}
              className="mx-auto w-full max-w-[1400px] flex-1 overflow-x-clip px-4 pt-4 pb-[calc(var(--bottom-nav-h)+96px+var(--sab))] outline-none md:px-6 lg:px-8 lg:pb-12"
            >
              {children}
            </main>
          </div>
        </div>
        <MobileNav />
        <SosButton variant="fab" />
        <EmergencySosModal />
        <HeartRateLimitSosPopup thresholdBpm={115} />
        <PushNotificationToast />
      </TelemetryProvider>
    </PortalProviders>
  )
}
