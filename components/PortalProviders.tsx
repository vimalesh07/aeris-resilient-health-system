'use client'

import React from 'react'
import { MotionConfig } from 'motion/react'
import { PreferencesProvider } from '@/hooks/usePreferences'
import { ToastProvider } from '@/components/ui/toast'

/** Shared client providers for every signed-in portal (user, admin, government). */
export function PortalProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <PreferencesProvider>
        <ToastProvider>{children}</ToastProvider>
      </PreferencesProvider>
    </MotionConfig>
  )
}
