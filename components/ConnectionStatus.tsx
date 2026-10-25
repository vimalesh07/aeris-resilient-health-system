'use client'

import React from 'react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { cn } from '@/lib/utils'

/** Single, honest indicator of where the numbers on screen come from. */
export function useDataSource() {
  const { isHardwareConnected, transport, isSimulationRunning, sqi } = useTelemetry()
  if (isHardwareConnected) {
    return {
      tone: 'live' as const,
      label: 'Wearable live',
      detail: `${transport.includes('WiFi') ? 'Wi-Fi' : 'USB'}${sqi != null ? ` · signal ${sqi}%` : ''}`,
    }
  }
  if (isSimulationRunning) return { tone: 'demo' as const, label: 'Demo data', detail: 'No wearable connected' }
  return { tone: 'paused' as const, label: 'Paused', detail: 'Demo data paused' }
}

export function ConnectionStatus({ compact = false, className }: { compact?: boolean; className?: string }) {
  const source = useDataSource()
  const dot = source.tone === 'live' ? 'bg-safe-solid' : 'border border-fg-muted'
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-medium text-fg-2',
        className,
      )}
      title={source.detail}
    >
      <span className="relative flex size-2">
        {source.tone === 'live' && <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />}
        <span className={cn('relative size-2 rounded-full', dot)} />
      </span>
      <span className="text-fg">{source.label}</span>
      {!compact && <span className="hidden text-fg-muted sm:inline">· {source.detail}</span>}
    </span>
  )
}
