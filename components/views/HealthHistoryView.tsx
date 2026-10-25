'use client'

import React, { useState } from 'react'
import { Footprints, HeartPulse, Thermometer, Sun, TriangleAlert } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { Stat } from '@/components/ui/meter'
import { TrendChart } from '@/components/ui/trend-chart'
import { Badge } from '@/components/ui/badge'

const TIMEFRAMES = [
  { value: '24h' as const, label: '24 hours' },
  { value: '7d' as const, label: '7 days' },
  { value: '30d' as const, label: '30 days' },
]

export function HealthHistoryView() {
  const { history, realHistory, baseline, timeframe, setTimeframe, telemetry, risks, scenario } = useTelemetry()
  const [tableView, setTableView] = useState<'heat' | 'all'>('heat')

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  const avgHR = Math.round(avg(history.map((h) => h.heartRate)))
  const hrvs = history.map((h) => h.hrv).filter((v): v is number => v !== null)
  const avgHRV = Math.round(avg(hrvs))
  const temps = history.map((h) => h.bodyTemp)
  const minTemp = temps.length ? Math.min(...temps) : 0
  const maxTemp = temps.length ? Math.max(...temps) : 0
  const peakRisk = history.length ? Math.max(...history.map((h) => h.overallRisk)) : 0

  const heatRows = (realHistory.length > 0 ? realHistory : history).slice(-10).reverse()
  const mobilityScore = Math.max(5, 100 - risks.mobility)
  const fallDetected = scenario === 'disaster_fall_sos'

  return (
    <>
      <PageHeader
        title="Trends"
        description="How your vitals, heat exposure and movement change over time."
        actions={<Segmented label="Time range" value={timeframe} onChange={setTimeframe} options={TIMEFRAMES} />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat label="Average heart rate" value={avgHR} unit="BPM" hint={`Baseline ${baseline.restingHR} BPM`} />
        <Stat label="Average HRV" value={avgHRV || '—'} unit={avgHRV ? 'ms' : undefined} hint="Higher means better recovery" />
        <Stat label="Body temp range" value={`${minTemp.toFixed(1)}–${maxTemp.toFixed(1)}`} unit="°C" />
        <Stat label="Peak risk" value={peakRisk} unit="/100" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <Card className="p-5 md:p-6">
          <CardHeader title="Heart rate" icon={<HeartPulse className="size-4" />} iconLayoutId="morph-heart" description="Dashed line is your normal resting rate" />
          <TrendChart
            className="mt-5"
            data={history.map((h) => ({ label: h.time, value: h.heartRate }))}
            unit="BPM"
            color="var(--brand)"
            baseline={baseline.restingHR}
            datasetKey={timeframe}
            demo={realHistory.length === 0}
            ariaLabel={`Heart rate over ${timeframe}, average ${avgHR} BPM`}
          />
        </Card>

        <Card className="p-5 md:p-6">
          <CardHeader title="Body temperature" icon={<Thermometer className="size-4" />} description="Dashed line is your usual temperature" />
          <TrendChart
            className="mt-5"
            data={history.map((h) => ({ label: h.time, value: h.bodyTemp }))}
            unit="°C"
            decimals={1}
            baseline={baseline.tempBaseline}
            datasetKey={timeframe}
            demo={realHistory.length === 0}
            ariaLabel={`Body temperature over ${timeframe}, between ${minTemp.toFixed(1)} and ${maxTemp.toFixed(1)} °C`}
          />
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-2">
          <CardHeader
            title={tableView === 'heat' ? 'Heat exposure log' : 'All readings'}
            icon={<Sun className="size-4" />}
            description={tableView === 'heat' ? 'Outside temperature against your body’s response' : `Every reading in the last ${TIMEFRAMES.find((t) => t.value === timeframe)?.label}`}
            action={
              <Segmented
                label="Table"
                value={tableView}
                onChange={setTableView}
                options={[
                  { value: 'heat', label: 'Heat' },
                  { value: 'all', label: 'All' },
                ]}
              />
            }
          />
          <div className="mt-4 overflow-x-auto">
            {tableView === 'heat' ? (
              <table className="w-full min-w-[560px] text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-line text-left text-xs text-fg-muted">
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Outside</th>
                    <th className="py-2 pr-4 font-medium">Body temp</th>
                    <th className="py-2 pr-4 font-medium">Heart rate</th>
                    <th className="py-2 font-medium">Heat strain</th>
                  </tr>
                </thead>
                <tbody>
                  {heatRows.map((pt, i) => {
                    const psi = Number((5 * Math.max(0, (pt.bodyTemp - baseline.tempBaseline) / 3) + 5 * Math.max(0, (pt.heartRate - baseline.restingHR) / 112)).toFixed(1))
                    const hotBody = pt.bodyTemp > baseline.tempBaseline + 0.6
                    const highHr = pt.heartRate > baseline.restingHR + 10
                    return (
                      <tr key={`${pt.time}-${i}`} className="border-b border-line last:border-0">
                        <td className="py-2.5 pr-4 text-fg-muted tabular-nums">{pt.time}</td>
                        <td className="py-2.5 pr-4 text-fg tabular-nums">{pt.ambientTemp}°C</td>
                        <td className="py-2.5 pr-4 tabular-nums">
                          <span className={hotBody ? 'font-medium text-danger' : 'text-fg'}>
                            {pt.bodyTemp}°C{hotBody && <TriangleAlert className="ml-1 inline size-3.5" aria-label="above baseline" />}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">
                          <span className={highHr ? 'font-medium text-danger' : 'text-fg'}>
                            {pt.heartRate} BPM{highHr && <TriangleAlert className="ml-1 inline size-3.5" aria-label="above baseline" />}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <RiskBadge level={psi >= 7 ? 'CRITICAL' : psi >= 4 ? 'WARNING' : 'SAFE'} score={psi} size="sm" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[560px] text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-line text-left text-xs text-fg-muted">
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Heart rate</th>
                    <th className="py-2 pr-4 font-medium">HRV</th>
                    <th className="py-2 pr-4 font-medium">Body temp</th>
                    <th className="py-2 pr-4 font-medium">Heat risk</th>
                    <th className="py-2 font-medium">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => (
                    <tr key={`${row.time}-${i}`} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-4 text-fg-muted tabular-nums">{row.time}</td>
                      <td className="py-2.5 pr-4 text-fg tabular-nums">{row.heartRate} BPM</td>
                      <td className="py-2.5 pr-4 text-fg tabular-nums">{row.hrv ?? '—'}{row.hrv !== null && ' ms'}</td>
                      <td className="py-2.5 pr-4 text-fg tabular-nums">{row.bodyTemp}°C</td>
                      <td className="py-2.5 pr-4 text-fg tabular-nums">{row.heatRisk}/100</td>
                      <td className="py-2.5">
                        <RiskBadge level={row.overallRisk > 60 ? 'CRITICAL' : row.overallRisk > 30 ? 'MONITOR' : 'SAFE'} score={row.overallRisk} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-2">
          <CardHeader
            title="Movement"
            icon={<Footprints className="size-4" />}
            description="Walking rhythm and balance from the wearable’s motion sensor"
            action={fallDetected ? <Badge tone="danger" dot>Fall detected</Badge> : <RiskBadge level={mobilityScore < 50 ? 'WARNING' : 'SAFE'} score={mobilityScore} size="sm" />}
          />
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
            <Stat label="Mobility score" value={mobilityScore} unit="/100" />
            <Stat label="Steps today" value={telemetry.steps.toLocaleString()} />
            <Stat label="Cadence" value={telemetry.cadence} unit="steps/min" />
            <Stat label="Walking speed" value={telemetry.walkingSpeed} unit="m/s" />
            <Stat label="Left/right balance" value={telemetry.gaitSymmetry} unit="%" hint={`Usual ${baseline.gaitSymmetryBaseline}%`} />
            <Stat label="Step variability" value={telemetry.gaitVariability} unit="%" hint={`Usual ${baseline.gaitVariabilityBaseline}%`} />
          </div>
          <p className="mt-3 text-sm text-fg-2">
            {fallDetected
              ? 'A sudden impact was detected. Emergency SOS has been triggered.'
              : risks.mobility > 45
              ? 'Your movement pattern differs from usual — this can be a sign of fatigue.'
              : 'Your walking rhythm and balance look normal.'}
          </p>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-fg-muted">AERIS does not diagnose joint, neurological or heart conditions.</p>
    </>
  )
}
