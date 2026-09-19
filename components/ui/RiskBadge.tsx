'use client'

import React from 'react'

export type RiskLevel = 'SAFE' | 'MONITOR' | 'WARNING' | 'CRITICAL' | 'Normal' | 'Monitor' | 'Warning' | 'High Risk' | 'Critical'

interface RiskBadgeProps {
  level: RiskLevel | string
  score?: number
  size?: 'sm' | 'md' | 'lg'
}

export function RiskBadge({ level, score, size = 'md' }: RiskBadgeProps) {
  const norm = String(level).toUpperCase()
  let bg = 'rgba(16, 185, 129, 0.12)'
  let color = 'var(--risk-safe)'
  let border = 'rgba(16, 185, 129, 0.3)'
  let label = level

  if (norm.includes('CRITICAL') || norm.includes('HIGH')) {
    bg = 'rgba(198, 40, 40, 0.18)'
    color = 'var(--risk-critical)'
    border = 'rgba(198, 40, 40, 0.4)'
    label = 'CRITICAL'
  } else if (norm.includes('WARN')) {
    bg = 'rgba(249, 115, 22, 0.18)'
    color = 'var(--risk-warning)'
    border = 'rgba(249, 115, 22, 0.4)'
    label = 'WARNING'
  } else if (norm.includes('MONITOR')) {
    bg = 'rgba(255, 193, 7, 0.15)'
    color = 'var(--risk-monitor)'
    border = 'rgba(255, 193, 7, 0.35)'
    label = 'MONITOR'
  } else {
    label = 'SAFE'
  }

  const padding = size === 'sm' ? '2px 6px' : size === 'lg' ? '6px 12px' : '4px 9px'
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 13 : 11

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding,
        fontSize,
        fontFamily: 'var(--font-mono), monospace',
        fontWeight: 800,
        letterSpacing: '0.05em',
        borderRadius: 6,
        background: bg,
        color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
        }}
      />
      {label} {score !== undefined ? `(${score})` : ''}
    </span>
  )
}
