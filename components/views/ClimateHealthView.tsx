'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { CloudSun, CloudRain, Droplets, Gauge, Lightbulb, MapPin, RefreshCw, Sun, Thermometer, Wind } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/ui/meter'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { cn } from '@/lib/utils'
import { RiskGlow } from '@/components/vitals/RiskGlow'
import { motion } from 'motion/react'
import { t } from '@/lib/motion'
import { TierBadge } from '@/components/vitals/RiskRing'

const AQI_BANDS = [
  { max: 50, label: 'Good', color: 'var(--safe-solid)' },
  { max: 100, label: 'Moderate', color: 'var(--monitor-solid)' },
  { max: 150, label: 'Sensitive', color: '#EA580C' },
  { max: 200, label: 'Unhealthy', color: 'var(--critical-solid)' },
  { max: 300, label: 'Very unhealthy', color: '#9333EA' },
  { max: 500, label: 'Hazardous', color: '#7F1D1D' },
]

function AqiBand({ aqi }: { aqi: number }) {
  const pct = Math.min(99, (Math.min(aqi, 500) / 500) * 100)
  return (
    <div className="mt-4">
      <div className="relative flex h-2 gap-0.5">
        {AQI_BANDS.map((b, i) => (
          <span key={b.label} className="h-full rounded-full" style={{ background: b.color, flexGrow: b.max - (AQI_BANDS[i - 1]?.max ?? 0) }} />
        ))}
        <span aria-hidden className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-fg shadow" style={{ left: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-fg-muted">
        <span>0</span>
        <span>100</span>
        <span>200</span>
        <span>300</span>
        <span>500</span>
      </div>
    </div>
  )
}

const ClimatePlaceMap = dynamic(() => import('@/components/ClimatePlaceMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-surface-2" />,
})

function aqiInfo(aqi: number) {
  if (aqi <= 50) return { label: 'Good', tone: 'success' as const, advice: 'Air is clean. Outdoor activity is fine.' }
  if (aqi <= 100) return { label: 'Moderate', tone: 'warning' as const, advice: 'Sensitive people should limit long outdoor exertion.' }
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', tone: 'warning' as const, advice: 'Wear a mask outdoors if you have asthma or heart conditions.' }
  if (aqi <= 200) return { label: 'Unhealthy', tone: 'danger' as const, advice: 'Reduce time outdoors and keep windows closed.' }
  return { label: 'Hazardous', tone: 'danger' as const, advice: 'Stay indoors. Use a mask and air purifier if available.' }
}

function heatInfo(psi: number) {
  if (psi >= 7) return { level: 'CRITICAL', label: 'High heat strain', advice: 'Stop activity, move to shade or a cool place and drink water now.' }
  if (psi >= 4) return { level: 'WARNING', label: 'Moderate heat strain', advice: 'Take breaks in the shade and drink water every 20 minutes.' }
  return { level: 'SAFE', label: 'Low heat strain', advice: 'Your body is handling the current temperature well.' }
}

export function ClimateHealthView() {
  const { telemetry, baseline, risks, dailyAnalysis, useRealWeather, setUseRealWeather, realWeatherData, fetchLiveWeather } = useTelemetry()
  const [refreshing, setRefreshing] = useState(false)

  const psi = risks.psi
  const heat = heatInfo(psi)
  const aqi = aqiInfo(telemetry.externalAqi)
  const place = realWeatherData?.locationName

  // Heat glow mix: 0% = amber, 100% = red
  const heatMix = Math.round(Math.min(100, Math.max(0, (psi / 9) * 100)))
  // Map: always on desktop; on phones it loads only when opened
  const [mapOpened, setMapOpened] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const showMap = isDesktop || mapOpened

  const refresh = async () => {
    setRefreshing(true)
    await fetchLiveWeather()
    setRefreshing(false)
  }

  return (
    <>
      <PageHeader
        title="Climate health"
        description="How today’s heat, humidity and air quality are affecting your body."
        actions={
          <>
            <Button variant="secondary" onClick={() => setUseRealWeather(!useRealWeather)} aria-pressed={useRealWeather}>
              <span className={cn('size-2 rounded-full', useRealWeather ? 'bg-success' : 'bg-fg-muted')} />
              {useRealWeather ? 'Live weather on' : 'Live weather off'}
            </Button>
            {useRealWeather && (
              <Button variant="secondary" size="icon" onClick={refresh} aria-label="Refresh weather" disabled={refreshing}>
                <RefreshCw className={cn(refreshing && 'animate-spin')} />
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <Card className="relative isolate overflow-hidden p-5 md:p-6 lg:col-span-7">
          {/* The only hue-shifting glow in the app: amber at rest, red as heat strain rises */}
          <RiskGlow tier={`heat-${Math.round(heatMix / 10)}`} color={`color-mix(in oklab, var(--critical-solid) ${heatMix}%, var(--monitor-solid))`} />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <motion.span layoutId="morph-outside" transition={t.emphasis} className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg-2 ring-1 ring-line ring-inset">
                <CloudSun className="size-4" aria-hidden />
              </motion.span>
              <div>
              <p className="text-eyebrow font-medium text-fg-muted uppercase">Heat strain</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg md:text-2xl">{heat.label}</h2>
              </div>
            </div>
            <TierBadge tier={heat.level === 'CRITICAL' ? 'critical' : heat.level === 'WARNING' ? 'monitor' : 'safe'} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label="Strain index" value={<AnimatedNumber value={psi} decimals={1} />} unit="/ 9" />
            <Stat label="Feels-like heat (WBGT)" value={risks.wbgt} unit="°C" />
            <Stat label="Body temp" value={telemetry.bodyTemp.toFixed(1)} unit="°C" hint={`Baseline ${baseline.tempBaseline}°C`} />
          </div>
          <p className="mt-5 flex gap-3 text-[20px] leading-snug text-fg">
            <Lightbulb className="mt-1 size-5 shrink-0 text-monitor" aria-hidden />
            {heat.advice}
          </p>
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-eyebrow font-medium text-fg-muted uppercase">Air quality</p>
              <p className="mt-2 leading-none">
                <AnimatedNumber value={telemetry.externalAqi} className="font-mono text-metric font-light text-fg tabular-nums" />
              </p>
              <p className="mt-1 text-xs text-fg-muted">US AQI</p>
            </div>
            <Badge tone={aqi.tone} dot>
              {aqi.label}
            </Badge>
          </div>
          <AqiBand aqi={telemetry.externalAqi} />
          <p className="mt-4 text-sm text-fg-2">{aqi.advice}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
            {[
              ['PM2.5', telemetry.pm25],
              ['PM10', telemetry.pm10],
              ['Ozone', telemetry.o3],
              ['NO₂', telemetry.no2],
            ].map(([label, v]) => (
              <div key={label as string} className="flex justify-between gap-2">
                <dt className="text-fg-muted">{label}</dt>
                <dd className="font-mono text-fg tabular-nums">{v !== null && v !== undefined ? `${v} µg/m³` : '—'}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-12">
          <CardHeader title="Weather now" description={place ? `${place}${realWeatherData?.timestamp ? ` · updated ${realWeatherData.timestamp}` : ''}` : 'Using your location'} />
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            <Stat label="Temperature" value={telemetry.ambientTemp.toFixed(1)} unit="°C" />
            <Stat label="Humidity" value={telemetry.humidity} unit="%" />
            <Stat label="Pressure" value={telemetry.pressure} unit="hPa" />
            <Stat label="UV index" value={realWeatherData?.uvIndex ?? '—'} />
            <Stat label="Rain" value={telemetry.rain ? 'Raining' : 'Dry'} />
          </div>
          <div className="mt-2 hidden gap-4 text-xs text-fg-muted md:flex">
            <span className="flex items-center gap-1"><Thermometer className="size-3.5" /> Air temperature</span>
            <span className="flex items-center gap-1"><Droplets className="size-3.5" /> Relative humidity</span>
            <span className="flex items-center gap-1"><Gauge className="size-3.5" /> Barometric pressure</span>
            <span className="flex items-center gap-1"><Sun className="size-3.5" /> UV</span>
            <span className="flex items-center gap-1"><CloudRain className="size-3.5" /> Precipitation</span>
          </div>
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-5">
          <CardHeader title="Climate and your body" icon={<Wind className="size-4" />} />
          {risks.climateBodyAnalysis.length > 0 || dailyAnalysis.trendInsights.length > 0 ? (
            <ul className="mt-4 grid gap-3">
              {[...risks.climateBodyAnalysis, ...dailyAnalysis.trendInsights].slice(0, 5).map((line) => (
                <li key={line} className="flex gap-2.5 text-sm text-fg-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-fg-muted" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-fg-2">No climate-related strain detected. AERIS will flag it here when heat or air quality starts affecting your vitals.</p>
          )}
        </Card>

        <Card className="overflow-hidden p-0 lg:sticky lg:top-[calc(var(--topbar-h)+16px)] lg:col-span-7 lg:self-start">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <MapPin className="size-4 text-fg-muted" aria-hidden />
            <p className="text-sm font-medium text-fg">{place || 'Your area'}</p>
          </div>
          <div className="px-3 pb-3">
            {showMap ? (
              <ClimatePlaceMap
                locationName={place || 'Your area'}
                lat={realWeatherData?.latitude ?? 10.9038}
                lon={realWeatherData?.longitude ?? 76.9602}
                weatherCondition={realWeatherData?.weatherCondition || '—'}
                temp={telemetry.ambientTemp}
              />
            ) : (
              <button
                type="button"
                onClick={() => setMapOpened(true)}
                className="grid h-[200px] w-full cursor-pointer place-items-center rounded-xl border border-dashed border-line-strong bg-surface-2 text-sm font-medium text-fg-2 hover:text-fg"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="size-4" aria-hidden /> Show map of {place || 'your area'}
                </span>
              </button>
            )}
          </div>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-fg-muted">Weather and air quality from Open-Meteo.</p>
    </>
  )
}
