'use client'

import React from 'react'

interface TelemetryValueProps {
  value: number | string | null
  unit?: string
  label?: string
  status?: 'live' | 'stabilizing' | 'stale' | 'disconnected'
  size?: 'sm' | 'md' | 'lg'
}

export function TelemetryValue({
  value,
  unit,
  label,
  status = 'live',
  size = 'md',
}: TelemetryValueProps) {
  const fontSize = size === 'sm' ? 24 : size === 'lg' ? 42 : 34

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono), monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {label}
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontSize,
            fontFamily: 'var(--font-mono), monospace',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: status === 'disconnected' ? 'var(--text-muted)' : 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {value !== null && value !== undefined ? value : '--'}
        </span>
        {unit && (
          <small
            style={{
              fontSize: size === 'sm' ? 11 : 13,
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            {unit}
          </small>
        )}
      </div>

      {status === 'stabilizing' && (
        <small style={{ fontSize: 10, color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>
          ● Stabilizing signal...
        </small>
      )}
      {status === 'stale' && (
        <small style={{ fontSize: 10, color: 'var(--risk-warning)', fontFamily: 'var(--font-mono)' }}>
          ⚠ Stale signal (&gt;4s)
        </small>
      )}
    </div>
  )
}
