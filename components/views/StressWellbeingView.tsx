'use client'

import React, { useEffect, useState } from 'react'
import { Brain, Footprints, Wind } from 'lucide-react'
import { GuidedBreathingModal } from '@/components/GuidedBreathingModal'
import { HumanRiskVisualization } from '@/components/HumanRiskVisualization'
import { useTelemetry } from '@/hooks/useTelemetry'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/ui/meter'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { WellbeingCheckIn } from '@/components/WellbeingCheckIn'
import { describe, loadCheckIn, type CheckInResult } from '@/lib/wellbeing'
import { tierOf } from '@/lib/risk-tier'
import { TierBadge } from '@/components/vitals/RiskRing'
import { TierScale } from '@/components/vitals/TierScale'
import { ContributorBars } from '@/components/vitals/ContributorBars'

export function StressWellbeingView() {
  const { telemetry, baseline, risks, history, realHistory, arduinoData, arduinoConnected } = useTelemetry()

  const [showBreathing, setShowBreathing] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkIn, setCheckIn] = useState<CheckInResult | null>(null)
  useEffect(() => setCheckIn(loadCheckIn()), [])

  const isLive = Boolean(arduinoConnected && arduinoData?.connected)
  const currentHR = isLive ? arduinoData?.stableBpm ?? arduinoData?.bpm ?? telemetry.heartRate : telemetry.heartRate
  const currentSpo2 = isLive ? arduinoData?.stableSpo2 ?? arduinoData?.spo2 ?? telemetry.spo2 : telemetry.spo2
  const currentTemp = telemetry.bodyTemp

  const hrDevFromBaseline = currentHR - baseline.restingHR
  const isExercising = telemetry.activity === 'Active Motion' || telemetry.activity === 'Moderate Walking'
  const activityState = isExercising ? telemetry.activity : hrDevFromBaseline > 15 ? 'Light activity' : 'Resting'
  const movementLoad = Math.round(isExercising ? 78 : Math.min(100, Math.max(10, (telemetry.steps / 10000) * 100)))

  // Self-reported strain from the last check-in; not counted until one is done.
  const psychScore = checkIn?.selfScore ?? null

  const rawPhysioScore = Math.min(
    100,
    Math.max(
      10,
      Math.round(
        Math.max(0, hrDevFromBaseline) * 1.5 +
          (telemetry.hrv !== null ? Math.max(0, 65 - telemetry.hrv) * 0.8 : 12) +
          Math.max(0, (currentTemp - baseline.tempBaseline) * 20),
      ),
    ),
  )
  const physioStressScore = isExercising ? Math.round(rawPhysioScore * 0.45) : rawPhysioScore

  const climateLoadScore = Math.min(
    100,
    Math.round(
      Math.max(0, (telemetry.ambientTemp - 24) * 3) + Math.max(0, (telemetry.humidity - 50) * 0.6) + Math.max(0, (telemetry.externalAqi - 50) * 0.4),
    ),
  )

  // With a check-in: body 35%, self-check 35%, activity 15%, weather 15%.
  // Without one, the self-check share is spread over the other signals.
  const stressIndex =
    psychScore === null
      ? Math.min(100, Math.round((physioStressScore * 0.35 + movementLoad * 0.15 + climateLoadScore * 0.15) / 0.65))
      : Math.min(100, Math.round(physioStressScore * 0.35 + psychScore * 0.35 + movementLoad * 0.15 + climateLoadScore * 0.15))
  const stressTier = tierOf(stressIndex)
  const recoveryScore = Math.max(10, Math.min(100, 100 - Math.round(stressIndex * 0.6 + (isExercising ? 20 : 0))))

  const timeline = (realHistory.length > 0 ? realHistory : history).slice(-6).reverse()

  const summary = isExercising
    ? 'Your heart rate is up because you are moving — AERIS is not treating it as stress.'
    : stressIndex <= 30
    ? psychScore === null
      ? 'Your body signals point to low stress right now.'
      : 'Your body and self-check both point to low stress right now.'
    : stressIndex <= 60
    ? 'Some strain is building. A short breathing break can help.'
    : 'High strain. Pause, hydrate and try a guided breathing session.'

  return (
    <>
      <GuidedBreathingModal
        open={showBreathing}
        onClose={() => setShowBreathing(false)}
        currentHR={currentHR}
        currentHRV={telemetry.hrv ?? 55}
        currentStress={stressIndex}
      />

      <PageHeader
        title="Stress & recovery"
        description="Combines your heart rate, temperature, movement, the weather and — if you add it — a short wellbeing check-in into one stress score."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCheckIn(true)}>
              <Brain /> {checkIn ? 'Retake check-in' : 'Wellbeing check-in'}
            </Button>
            <Button onClick={() => setShowBreathing(true)}>
              <Wind /> Start breathing
            </Button>
          </>
        }
      />

      <WellbeingCheckIn open={showCheckIn} onClose={() => setShowCheckIn(false)} onComplete={setCheckIn} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <Card className="p-5 md:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-eyebrow font-medium text-fg-muted uppercase">Stress score</p>
            <TierBadge tier={stressTier} />
          </div>
          <p className="mt-3 flex items-baseline gap-2">
            <AnimatedNumber value={stressIndex} className="font-mono text-display font-light text-fg tabular-nums" />
            <span className="text-sm text-fg-muted">of 100</span>
          </p>
          <p className="mt-2 text-[15px] text-fg-2">{summary}</p>
          <TierScale value={stressIndex} className="mt-5" />

          <p className="mt-6 mb-3 border-t border-line pt-5 text-eyebrow font-medium text-fg-muted uppercase">What’s contributing</p>
          <ContributorBars
            delay={0.3}
            items={[
              { key: 'body', label: psychScore === null ? 'Body signals · 54%' : 'Body signals · 35%', value: physioStressScore, max: 100 },
              ...(psychScore === null ? [] : [{ key: 'self', label: 'Self-check · 35%', value: psychScore, max: 100 }]),
              { key: 'activity', label: psychScore === null ? 'Activity load · 23%' : 'Activity load · 15%', value: movementLoad, max: 100 },
              { key: 'weather', label: psychScore === null ? 'Weather load · 23%' : 'Weather load · 15%', value: climateLoadScore, max: 100 },
            ]}
          />
          {psychScore === null && (
            <p className="mt-4 text-sm text-fg-2">
              Add how you feel for a fuller picture.{' '}
              <Button variant="link" className="text-sm" onClick={() => setShowCheckIn(true)}>
                Take the 2-minute check-in
              </Button>
            </p>
          )}
        </Card>

        <Card className="flex flex-col overflow-hidden p-3 lg:col-span-5">
          <p className="px-2 pt-2 text-sm font-medium text-fg">Body view</p>
          <HumanRiskVisualization
            risks={risks}
            compact
            currentBpm={currentHR}
            currentTemp={currentTemp}
            currentSpo2={currentSpo2}
            baselineHR={baseline.restingHR}
            baselineTemp={baseline.tempBaseline}
            mobilityStatus={activityState}
            className="flex-1"
          />
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-4">
          <CardHeader title="Recovery" icon={<Wind className="size-4" />} action={<RiskBadge level={recoveryScore >= 70 ? 'SAFE' : recoveryScore >= 45 ? 'MONITOR' : 'CRITICAL'} size="sm" />} />
          <p className="mt-4 text-4xl font-semibold text-fg tabular-nums">
            <AnimatedNumber value={recoveryScore} />
            <span className="ml-1 text-sm font-normal text-fg-muted">/100</span>
          </p>
          <p className="mt-2 text-sm text-fg-2">
            Based on your resting heart rate ({baseline.restingHR} BPM) and heart-rate variability target ({baseline.hrvBaseline} ms).
          </p>
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-4">
          <CardHeader title="Activity" icon={<Footprints className="size-4" />} action={<Badge tone="neutral">{activityState}</Badge>} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Stat label="Movement load" value={movementLoad} unit="/100" />
            <Stat label="Steps today" value={telemetry.steps.toLocaleString()} />
          </div>
          <p className="mt-3 text-sm text-fg-2">{isExercising ? 'You are active — a higher heart rate is expected.' : 'You are resting, so heart-rate changes reflect stress and recovery.'}</p>
        </Card>

        <Card className="flex flex-col p-5 md:p-6 lg:col-span-4">
          <CardHeader
            title="Wellbeing check-in"
            icon={<Brain className="size-4" />}
            description={checkIn ? `Last done ${new Date(checkIn.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'Standard questions on stress, worry, mood and sleep.'}
          />
          {checkIn ? (
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-line p-3">
                <dt className="text-xs text-fg-muted">Stress (PSS-4)</dt>
                <dd className="font-mono text-fg">{checkIn.pss4}/16</dd>
              </div>
              <div className="rounded-xl border border-line p-3">
                <dt className="text-xs text-fg-muted">Sleep</dt>
                <dd className="text-fg">{describe(checkIn).sleep}</dd>
              </div>
              <div className="rounded-xl border border-line p-3">
                <dt className="text-xs text-fg-muted">Worry (GAD-2)</dt>
                <dd className="font-mono text-fg">{checkIn.gad2}/6</dd>
              </div>
              <div className="rounded-xl border border-line p-3">
                <dt className="text-xs text-fg-muted">Mood (PHQ-2)</dt>
                <dd className="font-mono text-fg">{checkIn.phq2}/6</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-fg-2">Takes about 2 minutes. Your answers stay on this device.</p>
          )}
          {checkIn?.followUp && (
            <a href="tel:14416" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-info underline-offset-2 hover:underline">
              Talk to someone: Tele-MANAS 14416 (free, 24/7)
            </a>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <Button size="sm" variant={checkIn ? 'secondary' : 'primary'} onClick={() => setShowCheckIn(true)}>
              {checkIn ? 'Retake' : 'Start check-in'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowBreathing(true)}>
              <Wind /> Breathe for 2 min
            </Button>
          </div>
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-12">
          <CardHeader title="Recent readings" description={realHistory.length > 0 ? 'From your wearable' : 'Demo history'} />
          <div className="mt-4 overflow-x-auto">
            <ul className="grid gap-2 md:hidden">
              {timeline.map((pt, i) => (
                <li key={`m-${pt.time}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                  <div>
                    <p className="font-mono text-xs text-fg-muted">{pt.time}</p>
                    <p className="mt-0.5 font-mono text-sm text-fg">
                      {pt.heartRate} BPM · {pt.spo2}%
                    </p>
                  </div>
                  <RiskBadge level={pt.stress > 60 ? 'CRITICAL' : pt.stress > 30 ? 'MONITOR' : 'SAFE'} score={pt.stress} size="sm" />
                </li>
              ))}
            </ul>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-line text-left text-xs text-fg-muted">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Heart rate</th>
                  <th className="py-2 pr-4 font-medium">SpO₂</th>
                  <th className="py-2 font-medium">Stress</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((pt, i) => (
                  <tr key={`${pt.time}-${i}`} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-4 text-fg-muted tabular-nums">{pt.time}</td>
                    <td className="py-2.5 pr-4 text-fg tabular-nums">{pt.heartRate} BPM</td>
                    <td className="py-2.5 pr-4 text-fg tabular-nums">{pt.spo2}%</td>
                    <td className="py-2.5">
                      <RiskBadge level={pt.stress > 60 ? 'CRITICAL' : pt.stress > 30 ? 'MONITOR' : 'SAFE'} score={pt.stress} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-fg-muted">Stress tracking supports recovery. It does not diagnose anxiety or any medical condition.</p>
    </>
  )
}
