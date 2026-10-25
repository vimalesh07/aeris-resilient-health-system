'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Terminal } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/ui/meter'

/** Wearable connection details and the raw sensor log, for setup and troubleshooting. */
export function ArduinoDebugPanel() {
  const { arduinoData, arduinoConnected, transport, rawLogs } = useTelemetry()
  const [logOpen, setLogOpen] = useState(false)
  const logRef = useRef<HTMLPreElement>(null)
  const pinnedToBottom = useRef(true)

  // Follow new lines unless the user has scrolled up to read older ones.
  useEffect(() => {
    const el = logRef.current
    if (el && pinnedToBottom.current) el.scrollTop = el.scrollHeight
  }, [rawLogs, logOpen])
  const isWifi = transport === 'WiFi (ESP8266)'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={arduinoConnected ? 'success' : 'neutral'} dot>
          {arduinoConnected ? `Connected over ${isWifi ? 'Wi-Fi' : 'USB'}` : 'Not connected'}
        </Badge>
        <span className="text-xs text-fg-muted">{isWifi ? 'ESP8266 → /api/telemetry' : 'USB serial bridge → ws://localhost:3001'}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        <Stat label="Sensor status" value={<span className="text-base">{arduinoData?.status ? arduinoData.status.toLowerCase().replace(/_/g, ' ') : '—'}</span>} />
        <Stat label="Finger on sensor" value={<span className="text-base">{arduinoData?.fingerDetected ? 'Yes' : 'No'}</span>} />
        <Stat label="Last reading" value={<span className="text-base">{arduinoData?.timestamp ? new Date(arduinoData.timestamp).toLocaleTimeString() : '—'}</span>} />
        <Stat label="Heart rate" value={arduinoData?.stableBpm || arduinoData?.bpm || '—'} unit={arduinoData?.stableBpm || arduinoData?.bpm ? 'BPM' : undefined} />
        <Stat label="Blood oxygen" value={arduinoData?.stableSpo2 || arduinoData?.spo2 || '—'} unit={arduinoData?.stableSpo2 || arduinoData?.spo2 ? '%' : undefined} />
        <Stat label="Device" value={<span className="text-base">{arduinoData?.source || 'AERIS watch'}</span>} />
      </div>

      <button
        type="button"
        onClick={() => setLogOpen((o) => !o)}
        aria-expanded={logOpen}
        className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium text-fg hover:bg-surface-2"
      >
        <span className="flex items-center gap-2">
          <Terminal className="size-4 text-fg-muted" aria-hidden /> Raw sensor log
        </span>
        <motion.span animate={{ rotate: logOpen ? 180 : 0 }}>
          <ChevronDown className="size-4 text-fg-muted" aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {logOpen && (
          <motion.pre
            ref={logRef}
            onScroll={(e) => {
              const el = e.currentTarget
              pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
            }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 max-h-48 overflow-auto rounded-xl bg-surface-inverse p-3 font-mono text-xs leading-relaxed text-emerald-400"
          >
            {rawLogs.length === 0 ? <span className="text-slate-400">Waiting for data from the wearable…</span> : rawLogs.map((log) => `> ${log}`).join('\n')}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  )
}
