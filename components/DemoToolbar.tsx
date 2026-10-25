'use client'

import React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloudRain, Flame, FlaskConical, Footprints, HeartPulse, Pause, Play, Thermometer, Waves, Wind, Siren, Sun } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { usePreferences } from '@/hooks/usePreferences'
import type { Scenario } from '@/types/aeris'
import { cn } from '@/lib/utils'

const SCENARIOS: { id: Scenario; label: string; icon: React.ElementType; severe?: boolean }[] = [
  { id: 'Normal', label: 'Normal', icon: HeartPulse },
  { id: 'Stress', label: 'Stress', icon: Waves },
  { id: 'Heat', label: 'Heat strain', icon: Sun },
  { id: 'Temperature Anomaly', label: 'Fever', icon: Thermometer },
  { id: 'Mobility', label: 'Exercise', icon: Footprints },
  { id: 'Monsoon', label: 'Monsoon', icon: CloudRain },
  { id: 'disaster_heatwave', label: 'Heatwave 44°C', icon: Flame, severe: true },
  { id: 'disaster_flood', label: 'Cyclone', icon: Wind, severe: true },
  { id: 'disaster_aqi_spike', label: 'Smog AQI 395', icon: Wind, severe: true },
  { id: 'disaster_fall_sos', label: 'Fall', icon: Siren, severe: true },
]

/** Simulation controls, shown only when "Demo tools" is switched on. */
export function DemoToolbar() {
  const { demoMode } = usePreferences()
  const { scenario, setScenario, isSimulationRunning, setIsSimulationRunning, isHardwareConnected, triggerSos } = useTelemetry()

  return (
    <AnimatePresence initial={false}>
      {demoMode && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-b border-warning-line bg-warning-soft"
        >
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2 md:px-6 lg:px-8">
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-warning">
              <FlaskConical className="size-4" aria-hidden />
              <span className="hidden sm:inline">Demo</span>
            </span>
            {!isHardwareConnected && (
              <button
                type="button"
                onClick={() => setIsSimulationRunning(!isSimulationRunning)}
                className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-fg hover:border-line-strong"
              >
                {isSimulationRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {isSimulationRunning ? 'Pause' : 'Resume'}
              </button>
            )}
            <div className="flex min-w-0 gap-1.5 overflow-x-auto py-0.5" role="radiogroup" aria-label="Demo scenario">
              {SCENARIOS.map(({ id, label, icon: Icon, severe }) => {
                const active = scenario === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setScenario(id)
                      if (id === 'disaster_fall_sos') triggerSos('PHYSICAL_BUTTON')
                    }}
                    className={cn(
                      'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                      active
                        ? severe
                          ? 'border-brand bg-brand text-white'
                          : 'border-fg bg-fg text-on-fg'
                        : 'border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg',
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
