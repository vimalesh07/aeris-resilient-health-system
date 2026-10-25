'use client'

import React from 'react'
import { CloudSun, Info } from 'lucide-react'
import type { RiskScores } from '@/types/aeris'
import { Dialog } from '@/components/ui/dialog'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { useTelemetry } from '@/hooks/useTelemetry'

/** Plain-language breakdown of the overall risk score (replaces the old Risk Intelligence page). */
export function RiskExplainerDialog({ open, onClose, risks }: { open: boolean; onClose: () => void; risks: RiskScores }) {
  const { telemetry } = useTelemetry()

  const modules = [
    { title: 'Heart & oxygen', weight: 30, score: risks.physiological, desc: 'Heart rate above your baseline and drops in blood oxygen.' },
    { title: 'Body temperature', weight: 20, score: risks.temperature, desc: 'Body temperature compared with your usual range for this time of day.' },
    { title: 'Heat strain', weight: 20, score: risks.heat, desc: `Physiological strain index ${risks.psi}/9, wet-bulb globe temperature ${risks.wbgt}°C.` },
    { title: 'Air & weather', weight: 15, score: risks.environmental, desc: `Outdoor air quality index ${telemetry.externalAqi}, humidity and pressure.` },
    { title: 'Movement', weight: 15, score: risks.mobility, desc: 'Walking rhythm and balance compared with normal.' },
    { title: 'Stress', weight: 0, score: risks.stress, desc: 'Heart-rate variability based stress (shown for context).' },
  ]

  return (
    <Dialog open={open} onClose={onClose} size="lg" title="How your risk score is calculated" description="AERIS combines five signals, each weighted, into one score from 0 to 100. Any single critical reading raises the score to critical on its own.">
      {risks.criticalOverride && risks.overrideReason && (
        <p className="mb-4 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{risks.overrideReason}</p>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {modules.map((m) => (
          <li key={m.title} className="rounded-xl border border-line p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-fg">{m.title}</p>
              <RiskBadge level={m.score > 60 ? 'CRITICAL' : m.score > 30 ? 'WARNING' : 'SAFE'} score={m.score} size="sm" />
            </div>
            <p className="mt-1 text-xs text-fg-2">{m.desc}</p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-fg-2" style={{ width: `${Math.max(2, m.score)}%` }} />
            </div>
            {m.weight > 0 && <p className="mt-1.5 text-[11px] text-fg-muted">Weight {m.weight}%</p>}
          </li>
        ))}
      </ul>

      {risks.explanations.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-fg">What AERIS noticed</h3>
          <ul className="grid gap-2">
            {risks.explanations.map((exp) => (
              <li key={exp} className="flex gap-2.5 text-sm text-fg-2">
                <Info className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden />
                {exp}
              </li>
            ))}
          </ul>
        </section>
      )}

      {risks.climateBodyAnalysis.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-fg">Climate and your body</h3>
          <ul className="grid gap-2">
            {risks.climateBodyAnalysis.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm text-fg-2">
                <CloudSun className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-5 text-xs text-fg-muted">AERIS is a non-clinical monitoring prototype. It does not diagnose medical conditions.</p>
    </Dialog>
  )
}
