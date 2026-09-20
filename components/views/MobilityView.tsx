'use client'

import React from 'react'
import { Footprints, Navigation, ShieldCheck, Zap } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { TelemetryValue } from '@/components/ui/TelemetryValue'
import { RiskBadge } from '@/components/ui/RiskBadge'

export function MobilityView() {
  const { telemetry, baseline, risks, scenario } = useTelemetry()
  const mobilityScore = Math.max(5, 100 - risks.mobility)
  const isFallDetected = scenario === 'disaster_fall_sos'

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Biomechanical Gait & Motion Intelligence</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>Mobility & Gait Dynamics</h1>
        <p className="subhead">
          Tracking gait symmetry, step variability, and impact vectors using 6-axis MPU6050 IMU telemetry.
        </p>
      </div>

      {/* Fall Detection Warning Banner */}
      {isFallDetected && (
        <article
          style={{
            margin: '0 0 16px',
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid var(--main-red)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={20} style={{ color: 'var(--main-red)' }} />
            <div>
              <strong style={{ fontSize: 13, color: '#991B1B' }}>FALL IMPACT DETECTED</strong>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                Sudden impact acceleration vector detected on MPU6050. Emergency SOS active.
              </p>
            </div>
          </div>
          <RiskBadge level="CRITICAL" score={95} size="md" />
        </article>
      )}

      {/* Main Score Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Mobility Score Card */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="icon-box yellow">
              <Navigation size={18} />
            </span>
            <RiskBadge level={mobilityScore < 50 ? 'WARNING' : 'SAFE'} score={mobilityScore} size="sm" />
          </div>
          <TelemetryValue label="Overall Mobility Score" value={mobilityScore} unit="/ 100" />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '8px 0 0' }}>
            {risks.mobility > 45
              ? 'Movement pattern deviates from your learned baseline.'
              : 'Gait mechanics and stride symmetry are optimal.'}
          </p>
        </article>

        {/* Gait Symmetry Card */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="icon-box red">
              <Footprints size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--panel-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              L/R BALANCE
            </span>
          </div>
          <TelemetryValue label="Gait Symmetry" value={telemetry.gaitSymmetry} unit="%" />
          <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', margin: '8px 0 0' }}>
            Baseline Target: <strong>{baseline.gaitSymmetryBaseline}%</strong>
          </p>
        </article>

        {/* Movement Variability Card */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="icon-box dark">
              <Zap size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--panel-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              IMU VARIABILITY
            </span>
          </div>
          <TelemetryValue label="Step Variability Index" value={telemetry.gaitVariability} unit="%" />
          <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', margin: '8px 0 0' }}>
            Baseline Target: <strong>{baseline.gaitVariabilityBaseline}%</strong>
          </p>
        </article>
      </div>

      {/* Live Motion Metrics Table */}
      <article className="panel" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>Live IMU Motion Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8 }}>
            <p className="eyebrow" style={{ fontSize: 10 }}>Daily Step Count</p>
            <strong style={{ fontSize: 22, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{telemetry.steps.toLocaleString()} steps</strong>
          </div>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8 }}>
            <p className="eyebrow" style={{ fontSize: 10 }}>Walking Cadence</p>
            <strong style={{ fontSize: 22, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{telemetry.cadence} steps/min</strong>
          </div>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8 }}>
            <p className="eyebrow" style={{ fontSize: 10 }}>Walking Speed</p>
            <strong style={{ fontSize: 22, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{telemetry.walkingSpeed} m/s</strong>
          </div>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8 }}>
            <p className="eyebrow" style={{ fontSize: 10 }}>Active State</p>
            <strong style={{ fontSize: 20, fontFamily: 'var(--font-mono)', color: isFallDetected ? 'var(--risk-critical)' : 'var(--text-primary)' }}>
              {isFallDetected ? 'IMPACT DETECTED' : telemetry.activity}
            </strong>
          </div>
        </div>
      </article>

      {/* Safety Notice */}
      <article className="panel" style={{ padding: 16 }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong>Non-Diagnostic Safety Notice:</strong> AERIS monitors movement variability and stride symmetry to assist early awareness of fatigue or temporary mobility changes. AERIS does not diagnose joint diseases or neurological disorders.
        </p>
      </article>
    </div>
  )
}
