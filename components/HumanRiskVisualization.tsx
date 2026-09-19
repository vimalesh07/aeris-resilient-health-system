'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { RiskScores } from '@/types/aeris'
import { ArrowUpRight } from 'lucide-react'
import { RiskBadge } from '@/components/ui/RiskBadge'

const AERISDigitalTwin3D = dynamic(() => import('@/components/3d/AERISDigitalTwin3D'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-primary)', background: 'var(--panel-bg)', borderRadius: 12 }}>
      <span className="sync-dot"><span /></span>
      <p style={{ margin: '10px 0 0', color: 'var(--yellow)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
        AERIS DIGITAL TWIN • Loading WebGL 3D Canvas...
      </p>
    </div>
  ),
})

interface HumanRiskProps {
  risks: RiskScores
  compact?: boolean
  currentBpm?: number
  currentTemp?: number
  currentSpo2?: number
  baselineHR?: number
  baselineTemp?: number
  mobilityStatus?: string
  headline?: string
  description?: string
  children?: React.ReactNode
  onAiClick?: () => void
}

export function HumanRiskVisualization({
  risks,
  compact = false,
  currentBpm = 76,
  currentTemp = 36.5,
  currentSpo2 = 98,
  baselineHR = 64,
  baselineTemp = 36.5,
  mobilityStatus = 'Normal',
  headline,
  description,
  children,
  onAiClick,
}: HumanRiskProps) {
  const score = risks.overall
  const isRed = score > 60 || risks.criticalOverride
  const isOrange = score > 30 && !isRed
  const riskLevelText = isRed ? 'CRITICAL' : isOrange ? 'WARNING' : 'SAFE'

  const meterLeftPct = Math.min(96, Math.max(4, score))

  const defaultHeadline = risks.overall <= 25
    ? 'Biometric & climate signals strictly aligned with your personal baseline.'
    : risks.overall <= 50
    ? 'Moderate physiological strain or environmental load relative to baseline.'
    : 'High multi-modal risk pattern detected. Review recovery recommendations.'

  const defaultDescription = `Evaluated against learned personal baseline (${baselineHR} BPM, ${baselineTemp}°C) and Physiological Strain Index (PSI ${risks.psi}/9).`

  if (compact) {
    return (
      <div className="human-risk-container compact" style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 0',
            position: 'relative',
            background: 'var(--panel-bg)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <AERISDigitalTwin3D
            risks={risks}
            compact={true}
            currentBpm={currentBpm}
            currentTemp={currentTemp}
            currentSpo2={currentSpo2}
            baselineHR={baselineHR}
            baselineTemp={baselineTemp}
            mobilityStatus={mobilityStatus}
          />
          <div style={{ margin: '6px 0', textAlign: 'center' }}>
            <RiskBadge level={riskLevelText} score={score} size="md" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: 20,
        alignItems: 'stretch',
        width: '100%',
      }}
    >
      {/* LEFT COLUMN: 3D Anatomical Digital Twin Canvas */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          position: 'relative',
          background: 'radial-gradient(circle at 50% 40%, var(--panel-elevated) 0%, var(--bg-primary) 100%)',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          minHeight: 380,
        }}
      >
        {/* Header Bar Tag */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '8px 14px 4px',
            fontSize: 10,
            fontFamily: 'var(--font-mono), monospace',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ color: 'var(--yellow)', fontWeight: 800 }}>AERIS 3D DIGITAL TWIN</span>
          <span style={{ color: 'var(--text-muted)' }}>HOLOGRAPHIC WEBGL CANVAS</span>
        </div>

        {/* 3D Three.js Interactive Canvas Component */}
        <AERISDigitalTwin3D
          risks={risks}
          compact={false}
          currentBpm={currentBpm}
          currentTemp={currentTemp}
          currentSpo2={currentSpo2}
          baselineHR={baselineHR}
          baselineTemp={baselineTemp}
          mobilityStatus={mobilityStatus}
        />

        {/* Dynamic Risk Status Badge */}
        <div style={{ margin: '6px 0 10px', textAlign: 'center' }}>
          <RiskBadge level={riskLevelText} score={score} size="lg" />
        </div>
      </div>

      {/* RIGHT COLUMN: Composite Risk Index Engine & Clinical Rationale */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
        <div>
          {/* Header Score Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>Composite Risk Index (CRI)</p>
              <h3 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {headline || defaultHeadline}
              </h3>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <strong style={{ fontSize: 32, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {score} <small style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</small>
              </strong>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 12px', lineHeight: 1.5 }}>
            {description || defaultDescription}
          </p>

          {/* Segmented Risk Meter Bar */}
          <div
            style={{
              position: 'relative',
              height: 8,
              borderRadius: 4,
              background: 'linear-gradient(90deg, #10B981 0%, #10B981 30%, #FFC107 31%, #FFC107 60%, #F97316 61%, #C62828 100%)',
              margin: '10px 0 6px',
            }}
          >
            {/* Moving Indicator Dot */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${meterLeftPct}%`,
                transform: 'translate(-50%, -50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#F5F7FA',
                border: `2px solid ${isRed ? 'var(--risk-critical)' : isOrange ? 'var(--risk-warning)' : 'var(--risk-safe)'}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14 }}>
            <span style={{ color: 'var(--risk-safe)' }}>SAFE (0-30)</span>
            <span style={{ color: 'var(--risk-monitor)' }}>MONITOR (31-60)</span>
            <span style={{ color: 'var(--risk-critical)' }}>CRITICAL (61-100)</span>
          </div>

          {/* RISK CONTRIBUTION BREAKDOWN */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 6, marginBottom: 12 }}>
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)' }}>♥ Physiological</span>
              <strong style={{ color: risks.contributions.physiological > 8 ? 'var(--risk-critical)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                +{risks.contributions.physiological} pts
              </strong>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)' }}>🌡 Temp</span>
              <strong style={{ color: risks.contributions.temperature > 6 ? 'var(--risk-critical)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                +{risks.contributions.temperature} pts
              </strong>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)' }}>☀ Heat / PSI</span>
              <strong style={{ color: risks.contributions.heat > 6 ? 'var(--risk-critical)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                +{risks.contributions.heat} pts
              </strong>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)' }}>🌫 AQI / Env</span>
              <strong style={{ color: risks.contributions.environmental > 5 ? 'var(--yellow)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                +{risks.contributions.environmental} pts
              </strong>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 6, fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)' }}>🏃 Mobility</span>
              <strong style={{ color: risks.contributions.mobility > 5 ? 'var(--yellow)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                +{risks.contributions.mobility} pts
              </strong>
            </div>
          </div>

          {/* Children slots for callouts */}
          {children}
        </div>

        {onAiClick && (
          <button className="text-button" onClick={onAiClick} style={{ marginTop: 8 }}>
            Ask AERIS AI Companion <ArrowUpRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
