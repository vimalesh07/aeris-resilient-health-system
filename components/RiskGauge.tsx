'use client'

import React from 'react'
import { RiskScores } from '@/types/aeris'

export function RiskGauge({ risks }: { risks: RiskScores }) {
  const { overall, color, statusLabel } = risks
  const dash = `${Math.max(overall, 4)} 100`

  return (
    <div className="risk-gauge-wrap">
      <svg viewBox="0 0 180 100" className="risk-gauge" role="img" aria-label={`Prototype risk score ${overall} out of 100`}>
        <path d="M 20 90 A 70 70 0 0 1 160 90" pathLength="100" className="gauge-track" />
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          pathLength="100"
          strokeDasharray={dash}
          className={`gauge-fill ${color === 'red' ? 'high' : color === 'orange' ? 'warning' : color === 'yellow' ? 'monitor' : 'normal'}`}
        />
      </svg>
      <div className="gauge-number">
        <strong>{overall}</strong>
        <span>/ 100</span>
      </div>
      <div className="gauge-caption">Prototype risk score ({statusLabel})</div>
    </div>
  )
}
