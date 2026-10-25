'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Footprints, HeartPulse, Info, Sun, Thermometer, Wind } from 'lucide-react'
import type { RiskScores } from '@/types/aeris'
import { Button } from '@/components/ui/button'
import { RiskRing, TierBadge } from '@/components/vitals/RiskRing'
import { RiskGlow } from '@/components/vitals/RiskGlow'
import { ContributorBars } from '@/components/vitals/ContributorBars'
import { RiskExplainerDialog } from '@/components/dashboard/RiskExplainerDialog'
import { TIER_META, tierOfRisks } from '@/lib/risk-tier'
import { cn } from '@/lib/utils'

export const RISK_FACTORS = [
  { key: 'physiological', label: 'Heart & oxygen', icon: HeartPulse, max: 30 },
  { key: 'temperature', label: 'Body temperature', icon: Thermometer, max: 20 },
  { key: 'heat', label: 'Heat strain', icon: Sun, max: 20 },
  { key: 'environmental', label: 'Air & weather', icon: Wind, max: 15 },
  { key: 'mobility', label: 'Movement', icon: Footprints, max: 15 },
] as const

export function verdictFor(score: number, override: boolean) {
  if (override) return 'One reading is critical on its own'
  if (score <= 30) return 'You’re within your normal range'
  if (score <= 60) return 'Some strain above your baseline'
  return 'High combined risk — take action'
}

export function RiskSummaryCard({
  risks,
  baselineHR,
  baselineTemp,
  onAskAssistant,
  className,
}: {
  risks: RiskScores
  baselineHR: number
  baselineTemp: number
  onAskAssistant: () => void
  className?: string
}) {
  const [explainOpen, setExplainOpen] = useState(false)
  const tier = tierOfRisks(risks)

  // Announce only tier changes to screen readers, never every tick.
  const [announcement, setAnnouncement] = useState('')
  const lastTier = useRef(tier)
  useEffect(() => {
    if (lastTier.current !== tier) {
      setAnnouncement(`Overall risk is now ${TIER_META[tier].label}, ${risks.overall} out of 100.`)
      lastTier.current = tier
    }
  }, [tier, risks.overall])

  return (
    <section data-risk={tier} aria-labelledby="risk-title" className={cn('relative isolate flex flex-col rounded-[20px] border border-line bg-surface p-5 shadow-sm md:p-6', className)}>
      <RiskGlow tier={tier} className="-z-10 overflow-hidden rounded-[20px]" />

      <div className="flex items-center justify-between gap-3">
        <p className="text-eyebrow font-medium text-fg-muted uppercase">Overall risk</p>
        <TierBadge tier={tier} />
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-8">
        <RiskRing score={risks.overall} tier={tier} />
        <div className="w-full min-w-0 flex-1">
          <h2 id="risk-title" className="text-xl font-semibold tracking-tight text-balance text-fg md:text-2xl">
            {verdictFor(risks.overall, risks.criticalOverride)}
          </h2>
          <p className="mt-1.5 text-sm text-fg-2">
            Compared with your personal baseline of <span className="font-mono">{baselineHR}</span> BPM and <span className="font-mono">{baselineTemp}</span>°C.
          </p>
          <p className="mt-5 mb-3 text-eyebrow font-medium text-fg-muted uppercase">What’s contributing</p>
          <ContributorBars items={RISK_FACTORS.map((f) => ({ ...f, value: risks.contributions[f.key] }))} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
        <Button variant="secondary" size="sm" onClick={() => setExplainOpen(true)}>
          <Info /> Why this score
        </Button>
        <Button variant="ghost" size="sm" onClick={onAskAssistant}>
          Ask the assistant <ArrowUpRight />
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <RiskExplainerDialog open={explainOpen} onClose={() => setExplainOpen(false)} risks={risks} />
    </section>
  )
}
