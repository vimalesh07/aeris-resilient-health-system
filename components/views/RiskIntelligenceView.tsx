'use client'

import React from 'react'
import { Info, Layers, ShieldAlert } from 'lucide-react'
import { HumanRiskVisualization } from '@/components/HumanRiskVisualization'
import { useTelemetry } from '@/hooks/useTelemetry'
import { RiskBadge } from '@/components/ui/RiskBadge'

export function RiskIntelligenceView() {
  const { risks, telemetry, baseline } = useTelemetry()

  const subRisks = [
    { title: 'Physiological Risk (30% Weight)', score: risks.physiological, desc: 'Elevated HR above baseline & SpO₂ drop', chip: 'MAX30102' },
    { title: 'Subclinical Temp Anomaly (20% Weight)', score: risks.temperature, desc: 'Core body temperature deviation above circadian baseline', chip: 'MAX30205' },
    { title: 'Heat Strain Index / PSI (20% Weight)', score: risks.heat, desc: `Physiological Strain Index (PSI ${risks.psi}/9, WBGT ${risks.wbgt}°C)`, chip: 'MAX30102 + Ambient' },
    { title: 'Environmental Risk (15% Weight)', score: risks.environmental, desc: `External AQI ${telemetry.externalAqi}, PM2.5 & pressure`, chip: 'Open-Meteo API' },
    { title: 'Mobility & Gait Variation (15% Weight)', score: risks.mobility, desc: 'Gait asymmetry & step cadence variability', chip: 'MPU6050' },
    { title: 'Autonomic Stress Score', score: risks.stress, desc: 'HRV & HR stress calculation', chip: 'MAX30102' },
  ]

  const flowSteps = [
    'Physical MAX30102 (COM3)',
    'Temperature & Weather API',
    'Circadian Baseline (14d)',
    'Feature Extraction',
    'Late Fusion CRI Engine',
    'Single-Domain Override',
    'AERIS Composite Risk Index',
  ]

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">AERIS Multi-Modal Fusion Engine</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>Risk Intelligence & Fusion Architecture</h1>
        <p className="subhead">
          On-device Late Fusion Risk Engine fusing physiological biometrics with ambient environmental hazard telemetry.
        </p>
      </div>

      {/* Single-Domain Critical Override Banner */}
      {risks.criticalOverride && (
        <article
          style={{
            margin: '0 0 16px',
            padding: '14px 18px',
            background: 'rgba(198, 40, 40, 0.15)',
            border: '1px solid var(--main-red)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={22} style={{ color: 'var(--main-red)' }} />
            <div>
              <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>SINGLE-DOMAIN CRITICAL OVERRIDE ACTIVE</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{risks.overrideReason}</p>
            </div>
          </div>
          <RiskBadge level="CRITICAL" score={risks.overall} size="md" />
        </article>
      )}

      {/* Sensor Data Flow Diagram */}
      <article className="panel" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Layers size={18} style={{ color: 'var(--main-red)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>On-Device Multi-Modal Fusion Flow</h3>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--panel-elevated)',
            border: '1px solid var(--border-subtle)',
            padding: 12,
            borderRadius: 10,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {flowSteps.map((step, idx) => (
            <React.Fragment key={step}>
              <span
                style={{
                  background: idx === flowSteps.length - 1 ? 'var(--main-red)' : 'var(--panel-bg)',
                  color: idx === flowSteps.length - 1 ? '#FFFFFF' : 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '5px 10px',
                  borderRadius: 6,
                  textAlign: 'center',
                  fontWeight: 800,
                  boxShadow: idx === flowSteps.length - 1 ? '0 2px 6px rgba(220, 38, 38, 0.25)' : 'none',
                }}
              >
                {step}
              </span>
              {idx < flowSteps.length - 1 && <span style={{ color: 'var(--main-red)', fontSize: 12 }}>➔</span>}
            </React.Fragment>
          ))}
        </div>
      </article>

      {/* Main 3D Digital Twin & CRI Engine Card */}
      <article className="panel" style={{ padding: 20, marginBottom: 20 }}>
        <HumanRiskVisualization
          risks={risks}
          currentBpm={telemetry.heartRate}
          currentTemp={telemetry.bodyTemp}
          currentSpo2={telemetry.spo2}
          baselineHR={baseline.restingHR}
          baselineTemp={baseline.tempBaseline}
        />
      </article>

      {/* Late Fusion Contribution Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
        <article className="panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>Late Fusion Contribution Weights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Physiological Risk (30% weight)</span>
              <strong>+{risks.contributions.physiological} / 30 pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Temperature Anomaly (20% weight)</span>
              <strong>+{risks.contributions.temperature} / 20 pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Heat Strain / PSI (20% weight)</span>
              <strong>+{risks.contributions.heat} / 20 pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Environmental Risk (15% weight)</span>
              <strong>+{risks.contributions.environmental} / 15 pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mobility & Gait (15% weight)</span>
              <strong>+{risks.contributions.mobility} / 15 pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 8, borderRadius: 6, fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>
              <span>Total Composite Risk Index (CRI)</span>
              <span>{risks.overall} / 100</span>
            </div>
          </div>
        </article>

        {/* Climate-Health Explainability */}
        <article className="panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>CLIMATE ↔ PHYSIOLOGY EXPLAINABILITY</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {risks.explanations.map((exp, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: 10,
                  background: 'var(--panel-elevated)',
                  borderRadius: 8,
                  borderLeft: '3px solid var(--main-red)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                }}
              >
                <Info size={16} style={{ color: 'var(--main-red)', flexShrink: 0, marginTop: 2 }} />
                <span>{exp}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* 6 Sub-Risk Scores Grid */}
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>Fused Sub-Risk Modules</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {subRisks.map((sub) => (
          <article className="panel" style={{ padding: 16 }} key={sub.title}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{sub.title}</strong>
              <RiskBadge level={sub.score > 60 ? 'CRITICAL' : sub.score > 30 ? 'WARNING' : 'SAFE'} score={sub.score} size="sm" />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 10px' }}>{sub.desc}</p>
            <div style={{ background: 'var(--panel-elevated)', height: 6, borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${sub.score}%`,
                  background: sub.score > 60 ? 'var(--risk-critical)' : sub.score > 30 ? 'var(--risk-warning)' : 'var(--risk-safe)',
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'right' }}>
              Sensor: <strong>{sub.chip}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
