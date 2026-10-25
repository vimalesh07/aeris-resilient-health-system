'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CloudSun, HeartPulse, ShieldAlert, Thermometer, Wind } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { RiskSummaryCard, verdictFor } from '@/components/dashboard/RiskSummaryCard'
import { VitalTile, useRecentValues } from '@/components/dashboard/VitalTile'
import { ReportCard } from '@/components/dashboard/ReportCard'
import { AlertsCard } from '@/components/dashboard/AlertsCard'
import { BodyViewCard } from '@/components/dashboard/BodyViewCard'
import { fadeRise, stagger } from '@/lib/motion'

function greeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Hello'
}

export function DashboardView() {
  const { userProfile, telemetry, baseline, risks, scenario, setActiveView, arduinoData, isHardwareConnected, useRealWeather, realWeatherData } = useTelemetry()

  const isLive = Boolean(isHardwareConnected && arduinoData?.connected)
  const source = isLive ? 'live' : 'demo'
  const liveBpm = arduinoData?.stableBpm ?? arduinoData?.bpm ?? null
  const liveSpo2 = arduinoData?.stableSpo2 ?? arduinoData?.spo2 ?? null
  const stabilizing = isLive && arduinoData?.status === 'STABILIZING'

  const heartRate = isLive ? liveBpm : telemetry.heartRate
  const spo2 = isLive ? liveSpo2 : telemetry.spo2
  const hrHistory = useRecentValues(heartRate)
  const hrDelta = heartRate !== null ? heartRate - baseline.restingHR : 0
  const tempDelta = Number((telemetry.bodyTemp - baseline.tempBaseline).toFixed(1))
  const firstName = (userProfile.name || '').split(' ')[0]
  // Time-of-day greeting depends on the viewer's clock, so set it after hydration.
  const [hello, setHello] = useState('Hello')
  useEffect(() => setHello(greeting()), [])

  const hrStatus =
    heartRate === null
      ? { label: stabilizing ? 'Stabilizing' : 'No reading', tone: 'neutral' as const }
      : Math.abs(hrDelta) <= 8
      ? { label: 'Normal', tone: 'success' as const }
      : hrDelta > 20
      ? { label: `High · +${hrDelta}`, tone: 'danger' as const }
      : { label: `${hrDelta > 0 ? '+' : ''}${hrDelta} BPM`, tone: 'warning' as const }

  const spo2Status =
    spo2 === null
      ? { label: isLive ? (stabilizing ? 'Stabilizing' : 'Place finger') : 'No reading', tone: 'neutral' as const }
      : spo2 >= 95
      ? { label: 'Normal', tone: 'success' as const }
      : spo2 >= 90
      ? { label: 'Low', tone: 'warning' as const }
      : { label: 'Very low', tone: 'danger' as const }

  const tempStatus =
    risks.tempAnomaly.detected || tempDelta > 0.8
      ? { label: `High · +${tempDelta}°C`, tone: 'danger' as const }
      : tempDelta > 0.4
      ? { label: `+${tempDelta}°C`, tone: 'warning' as const }
      : { label: 'Normal', tone: 'success' as const }

  const aqi = telemetry.externalAqi
  const aqiStatus = aqi <= 50 ? { label: 'Good air', tone: 'success' as const } : aqi <= 100 ? { label: 'Fair air', tone: 'warning' as const } : { label: `AQI ${aqi}`, tone: 'danger' as const }

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <ConnectionStatus compact className="sm:hidden" />
            {baseline.isLearningMode ? (
              <Badge tone="warning">Learning your baseline · {baseline.totalSamplesCount}/10</Badge>
            ) : (
              <Badge tone="neutral">
                Baseline <span className="font-mono">{baseline.restingHR}</span> BPM
              </Badge>
            )}
          </>
        }
        title={firstName ? `${hello}, ${firstName}` : hello}
        description={`${verdictFor(risks.overall, risks.criticalOverride)}. ${isLive ? 'Live readings from your wearable.' : 'Demo data — not your readings. Connect your AERIS wearable for live data.'}`}
      />

      {risks.criticalOverride && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12 }}
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-[20px] border border-danger-line bg-critical-bg p-4"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-critical" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-critical">Critical reading</p>
            <p className="mt-0.5 text-sm text-fg-2">{risks.overrideReason}</p>
          </div>
        </motion.div>
      )}

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <motion.div variants={fadeRise} className="order-1 lg:col-span-7">
          <RiskSummaryCard
            key={scenario}
            risks={risks}
            baselineHR={baseline.restingHR}
            baselineTemp={baseline.tempBaseline}
            onAskAssistant={() => setActiveView('assistant')}
            className="h-full"
          />
        </motion.div>

        <motion.div variants={fadeRise} className="order-4 lg:order-2 lg:col-span-5">
          <BodyViewCard
            risks={risks}
            bpm={heartRate ?? telemetry.heartRate}
            temp={telemetry.bodyTemp}
            spo2={spo2 ?? telemetry.spo2}
            baselineHR={baseline.restingHR}
            baselineTemp={baseline.tempBaseline}
            mobilityStatus={scenario === 'disaster_fall_sos' ? 'Fall detected' : 'Normal'}
          />
        </motion.div>

        <motion.section variants={fadeRise} className="order-2 grid grid-cols-2 gap-3 md:gap-4 lg:order-3 lg:col-span-12 xl:grid-cols-4" aria-label="Vital signs">
          <VitalTile
            icon={<HeartPulse />}
            label="Heart rate"
            value={heartRate}
            unit="BPM"
            spokenUnit="beats per minute"
            status={hrStatus}
            source={source}
            sparkline={hrHistory}
            heartbeatBpm={heartRate}
            morphId="morph-heart"
            onClick={() => setActiveView('trends')}
            footnote={
              <>
                Your range <span className="font-mono">{baseline.refRestingHRRange.min}–{baseline.refRestingHRRange.max}</span>
              </>
            }
          />
          <VitalTile icon={<Wind />} label="Blood oxygen" value={spo2} unit="%" spokenUnit="percent" status={spo2Status} source={source} footnote="Healthy 95–100%" />
          <VitalTile
            icon={<Thermometer />}
            label="Body temp"
            value={telemetry.bodyTemp}
            decimals={1}
            unit="°C"
            spokenUnit="degrees Celsius"
            status={tempStatus}
            source={source}
            footnote={
              <>
                Baseline <span className="font-mono">{baseline.tempBaseline}</span>°C
              </>
            }
          />
          <VitalTile
            icon={<CloudSun />}
            label="Outside"
            value={telemetry.ambientTemp}
            decimals={1}
            unit="°C"
            spokenUnit="degrees Celsius outside"
            status={aqiStatus}
            source={useRealWeather && realWeatherData ? 'live' : 'demo'}
            footnote={
              <>
                Humidity <span className="font-mono">{telemetry.humidity}</span>%{telemetry.rain ? ' · raining' : ''}
              </>
            }
            morphId="morph-outside"
            onClick={() => setActiveView('climate')}
          />
        </motion.section>

        <motion.div variants={fadeRise} className="order-3 lg:order-4 lg:col-span-7">
          <AlertsCard className="h-full" />
        </motion.div>

        <motion.div variants={fadeRise} className="order-5 lg:col-span-5">
          <ReportCard className="h-full" />
        </motion.div>
      </motion.div>

      <p className="mt-8 text-center text-xs text-fg-muted">AERIS is a non-clinical monitoring prototype and does not provide medical diagnosis.</p>
    </>
  )
}
