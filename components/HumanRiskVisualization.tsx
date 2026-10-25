'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { RiskScores } from '@/types/aeris'
import { cn } from '@/lib/utils'

const AERISDigitalTwin3D = dynamic(() => import('@/components/3d/AERISDigitalTwin3D'), {
  ssr: false,
  loading: () => (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-xl bg-[#050608]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/twin-poster.webp" alt="" width={422} height={430} className="absolute inset-0 size-full object-contain opacity-80" />
    </div>
  ),
})

interface BodyViewProps {
  risks: RiskScores
  compact?: boolean
  currentBpm?: number
  currentTemp?: number
  currentSpo2?: number
  baselineHR?: number
  baselineTemp?: number
  mobilityStatus?: string
  className?: string
}

export function riskLevelOf(risks: RiskScores): 'CRITICAL' | 'WARNING' | 'SAFE' {
  if (risks.overall > 60 || risks.criticalOverride) return 'CRITICAL'
  if (risks.overall > 30) return 'WARNING'
  return 'SAFE'
}

/** Interactive 3D body view with each vital pinned to where it is measured. */
export function HumanRiskVisualization({
  risks,
  compact = false,
  currentBpm = 76,
  currentTemp = 36.5,
  currentSpo2 = 98,
  baselineHR = 64,
  baselineTemp = 36.5,
  mobilityStatus = 'Normal',
  className,
}: BodyViewProps) {
  return (
    <div className={cn('relative flex h-full w-full flex-col overflow-hidden rounded-xl', className)}>
      <div className={cn('flex flex-1 flex-col', compact ? 'min-h-[260px]' : 'min-h-[340px]')}>
        <AERISDigitalTwin3D
          risks={risks}
          compact={compact}
          currentBpm={currentBpm}
          currentTemp={currentTemp}
          currentSpo2={currentSpo2}
          baselineHR={baselineHR}
          baselineTemp={baselineTemp}
          mobilityStatus={mobilityStatus}
        />
      </div>
    </div>
  )
}
