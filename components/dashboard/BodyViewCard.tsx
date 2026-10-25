'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Box } from 'lucide-react'
import type { RiskScores } from '@/types/aeris'
import { HumanRiskVisualization } from '@/components/HumanRiskVisualization'
import { RiskGlow } from '@/components/vitals/RiskGlow'
import { tierOfRisks } from '@/lib/risk-tier'

/** Static still of the body view (~15KB WebP) shown until the 3D scene loads — never empty, no layout shift. */
function TwinPoster() {
  return (
    <div className="relative h-full min-h-[340px] overflow-hidden rounded-xl bg-surface-inverse" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/twin-poster.webp" alt="" width={422} height={430} decoding="async" className="absolute inset-0 size-full object-contain opacity-80" />
    </div>
  )
}

export function BodyViewCard({
  risks,
  bpm,
  temp,
  spo2,
  baselineHR,
  baselineTemp,
  mobilityStatus,
}: {
  risks: RiskScores
  bpm: number
  temp: number
  spo2: number
  baselineHR: number
  baselineTemp: number
  mobilityStatus: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const tier = tierOfRisks(risks)

  // Mount three.js only when the card is within 300px of the viewport.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section data-risk={tier} aria-label="Body view" className="relative isolate flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <div>
          <p className="text-eyebrow font-medium text-fg-muted uppercase">Body view</p>
          <p className="mt-0.5 text-xs text-fg-muted">Drag to rotate · numbered dots match the list below</p>
        </div>
        <Box className="size-4 text-fg-muted" aria-hidden />
      </div>
      <div ref={ref} className="relative isolate flex-1 px-3 pb-3">
        <RiskGlow tier={tier} className="-z-10" />
        {near ? (
          <HumanRiskVisualization
            risks={risks}
            currentBpm={bpm}
            currentTemp={temp}
            currentSpo2={spo2}
            baselineHR={baselineHR}
            baselineTemp={baselineTemp}
            mobilityStatus={mobilityStatus}
          />
        ) : (
          <TwinPoster />
        )}
      </div>
    </section>
  )
}
