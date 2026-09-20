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
  let bg = '#ECFDF5'
  let color = '#059669'
  let border = '#A7F3D0'
  let insetSheen = '0 1px 2px rgba(0, 0, 0, 0.04)'
  let isCritical = false
  let label = level

  if (norm.includes('CRITICAL') || norm.includes('HIGH')) {
    bg = '#FEF2F2'
    color = '#DC2626'
    border = '#FECACA'
    insetSheen = '0 1px 2px rgba(220, 38, 38, 0.08)'
    isCritical = true
    label = 'CRITICAL'
  } else if (norm.includes('WARN')) {
    bg = '#FFF7ED'
    color = '#EA580C'
    border = '#FED7AA'
    insetSheen = '0 1px 2px rgba(234, 88, 12, 0.08)'
    label = 'WARNING'
  } else if (norm.includes('MONITOR')) {
    bg = '#FFFBEB'
    color = '#D97706'
    border = '#FDE68A'
    insetSheen = '0 1px 2px rgba(217, 119, 6, 0.08)'
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
        boxShadow: insetSheen,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          animation: isCritical ? 'tacticalPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : undefined,
        }}
      />
      {label} {score !== undefined ? `(${score})` : ''}
    </span>
  )
}
