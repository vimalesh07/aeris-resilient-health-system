'use client'

import React from 'react'
import { BrainCircuit, Cpu, Layers, ShieldCheck, Zap } from 'lucide-react'
import { RiskGauge } from '@/components/RiskGauge'
import { useTelemetry } from '@/hooks/useTelemetry'

export function RiskIntelligenceView() {
  const { risks, telemetry, baseline } = useTelemetry()

  const subRisks = [
    { title: 'Physiological Risk', score: risks.physiological, desc: 'Elevated HR above resting baseline & HRV reduction', chip: 'MAX30102' },
    { title: 'Physiological Stress', score: risks.stress, desc: 'Autonomic nervous system strain derived from HRV & HR (No GSR)', chip: 'MAX30102' },
    { title: 'Temperature Anomaly', score: risks.temperature, desc: 'Core body temperature deviation above learned baseline', chip: 'MAX30205' },
    { title: 'Prototype Heat Strain', score: risks.heat, desc: 'Combined ambient heat index + physiological strain', chip: 'BME280 + MAX30102' },
    { title: 'Mobility & Gait Variation', score: risks.mobility, desc: 'Gait asymmetry & step cadence variability', chip: 'MPU6050' },
    { title: 'Environmental Resilience', score: risks.environmental, desc: 'Barometric pressure drop, rain contact & external AQI', chip: 'BME280 + Rain Sensor' },
  ]

  const flowSteps = [
    '5 Core Sensors',
    'ESP32 Node',
    'BLE Gateway',
    'Edge Feature Extraction',
    'Personal Baseline',
    'Multi-Modal Fusion',
    'AERIS Risk Score',
  ]

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Edge AI Multi-Modal Risk Architecture</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '4px 0 6px', color: '#FFF' }}>Risk Intelligence</h1>
        <p className="subhead">
          Fusing 6 distinct telemetry channels on-device to compute real-time early warning risk scores.
        </p>
      </div>

      {/* Sensor Data Flow Diagram */}
      <article className="panel" style={{ padding: 20, marginBottom: 20, background: '#3B0000', color: '#FFF', borderColor: 'var(--yellow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Layers size={20} style={{ color: 'var(--yellow)' }} />
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>On-Device Multi-Modal Fusion Flow</h3>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
            padding: 14,
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            color: '#FFF',
          }}
        >
          {flowSteps.map((step, idx) => (
            <React.Fragment key={step}>
              <span
                style={{
                  background: idx === flowSteps.length - 1 ? 'var(--yellow)' : 'rgba(255,255,255,0.1)',
                  color: idx === flowSteps.length - 1 ? '#171717' : '#FFF',
                  padding: '6px 12px',
                  borderRadius: 8,
                  textAlign: 'center',
                  fontWeight: 800,
                }}
              >
                {step}
              </span>
              {idx < flowSteps.length - 1 && <span style={{ color: 'var(--yellow)', fontSize: 14 }}>➔</span>}
            </React.Fragment>
          ))}
        </div>
      </article>

      {/* Main Score & Threshold Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <article className="panel" style={{ padding: 20, display: 'grid', placeItems: 'center' }}>
          <p className="eyebrow" style={{ width: '100%', textAlign: 'left' }}>Overall AERIS Risk Index</p>
          <RiskGauge risks={risks} />
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <span className={`status-pill ${risks.color}`}>{risks.statusLabel}</span>
            <p style={{ fontSize: 12, color: '#4B5563', margin: '8px 0 0' }}>
              Multi-signal agreement check: <strong>Active</strong> (Prevents false alarms)
            </p>
          </div>
        </article>

        <article className="panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 12px', color: '#171717' }}>Prototype Risk Thresholds</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { range: '0 – 25', label: 'Normal (Low Risk)', desc: 'Biometric & environmental signals strictly within baseline.', color: '#10B981' },
              { range: '26 – 50', label: 'Monitor (Moderate Risk)', desc: 'Minor signal variation; continued passive edge tracking.', color: 'var(--yellow)' },
              { range: '51 – 75', label: 'Warning (Elevated Risk)', desc: 'Multi-signal strain detected; user advisory generated.', color: '#F97316' },
              { range: '76 – 100', label: 'High Risk (High Attention)', desc: 'Significant physiological or climate hazard anomaly.', color: 'var(--main-red)' },
            ].map((item) => (
              <div key={item.range} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, background: '#F9FAFB', borderRadius: 8, borderLeft: `4px solid ${item.color}` }}>
                <span style={{ font: "12px 'Geist Mono', monospace", fontWeight: 800, width: 68, color: '#171717', flexShrink: 0 }}>{item.range}</span>
                <div>
                  <strong style={{ fontSize: 13, color: '#171717', display: 'block' }}>{item.label}</strong>
                  <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* 6 Sub-Risk Scores Grid */}
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px', color: '#FFF' }}>Fused Sub-Risk Indicators</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {subRisks.map((sub) => (
          <article className="panel" style={{ padding: 18 }} key={sub.title}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 14, color: '#171717' }}>{sub.title}</strong>
              <span className={`badge ${sub.score > 60 ? 'high' : sub.score > 30 ? 'medium' : 'low'}`}>{sub.score} / 100</span>
            </div>
            <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 10px' }}>{sub.desc}</p>
            <div style={{ background: '#E5E7EB', height: 8, borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${sub.score}%`,
                  background: sub.score > 60 ? 'var(--main-red)' : sub.score > 30 ? 'var(--yellow)' : '#10B981',
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: '#6B7280', textAlign: 'right' }}>
              Hardware Source: <strong>{sub.chip}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
