'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { UserViewId } from '@/lib/navigation'
import { getView } from '@/lib/navigation'
import dynamic from 'next/dynamic'
import { DashboardView } from '@/components/views/DashboardView'

// The dashboard ships with the shell; other screens load when opened.
const loading = () => <ViewSkeleton />
const StressWellbeingView = dynamic(() => import('@/components/views/StressWellbeingView').then((m) => m.StressWellbeingView), { ssr: false, loading })
const ClimateHealthView = dynamic(() => import('@/components/views/ClimateHealthView').then((m) => m.ClimateHealthView), { ssr: false, loading })
const SafePlacesView = dynamic(() => import('@/components/views/SafePlacesView').then((m) => m.SafePlacesView), { ssr: false, loading })
const AICompanionView = dynamic(() => import('@/components/views/AICompanionView').then((m) => m.AICompanionView), { ssr: false, loading })
const HealthHistoryView = dynamic(() => import('@/components/views/HealthHistoryView').then((m) => m.HealthHistoryView), { ssr: false, loading })
const SettingsView = dynamic(() => import('@/components/views/SettingsView').then((m) => m.SettingsView), { ssr: false, loading })

const VIEWS: Record<UserViewId, React.ComponentType> = {
  dashboard: DashboardView,
  stress: StressWellbeingView,
  climate: ClimateHealthView,
  'safe-places': SafePlacesView,
  assistant: AICompanionView,
  trends: HealthHistoryView,
  settings: SettingsView,
}

export function UserViewRenderer({ viewId }: { viewId: UserViewId }) {
  const View = VIEWS[viewId]
  // The dashboard is server-rendered (its first render is deterministic) so its
  // text arrives with the HTML. Other screens render on the client only, behind
  // a skeleton. The very first paint doesn't fade in; later navigations do.
  const firstPaint = useRef(true)
  useEffect(() => {
    firstPaint.current = false
  }, [])

  useEffect(() => {
    document.title = `${getView(viewId).label} · AERIS`
  }, [viewId])

  return (
    <motion.div
      key={viewId}
      initial={firstPaint.current ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <View />
    </motion.div>
  )
}

function ViewSkeleton() {
  // Shimmer for at most 8s, then stop and say so.
  const [stale, setStale] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setStale(true), 8000)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <div aria-busy="true" aria-label="Loading" className={stale ? undefined : 'animate-pulse'}>
      {stale && <p className="mb-4 text-sm text-fg-muted">Still loading… check your connection if this takes much longer.</p>}
      <div className="h-7 w-56 rounded-lg bg-surface-2" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-surface-2" />
      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-surface-2" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="h-96 rounded-2xl bg-surface-2 lg:col-span-7" />
        <div className="h-96 rounded-2xl bg-surface-2 lg:col-span-5" />
      </div>
    </div>
  )
}
