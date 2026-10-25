'use client'

import React from 'react'
import { Badge, type BadgeTone } from '@/components/ui/badge'

export type RiskLevel = 'SAFE' | 'MONITOR' | 'WARNING' | 'CRITICAL' | 'Normal' | 'Monitor' | 'Warning' | 'High Risk' | 'Critical'

interface RiskBadgeProps {
  level: RiskLevel | string
  score?: number
  size?: 'sm' | 'md' | 'lg'
}

export function riskTier(level: string): { label: string; tone: BadgeTone } {
  const norm = String(level).toUpperCase()
  if (norm.includes('CRITICAL') || norm.includes('HIGH')) return { label: 'Critical', tone: 'danger' }
  if (norm.includes('WARN')) return { label: 'Warning', tone: 'warning' }
  if (norm.includes('MONITOR')) return { label: 'Monitor', tone: 'warning' }
  return { label: 'Safe', tone: 'success' }
}

export function RiskBadge({ level, score, size = 'md' }: RiskBadgeProps) {
  const { label, tone } = riskTier(String(level))
  return (
    <Badge tone={tone} dot className={size === 'sm' ? 'px-2 text-[11px]' : size === 'lg' ? 'px-3 py-1 text-sm' : undefined}>
      {label}
      {score !== undefined && <span className="tabular-nums">· {score}</span>}
    </Badge>
  )
}
