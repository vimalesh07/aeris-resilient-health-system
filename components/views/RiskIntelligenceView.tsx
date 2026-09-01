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

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="eyebrow">Edge AI Multi-Modal Risk Architecture</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>Risk Intelligence</h1>
        <p className="subhead">
          Fusing 6 distinct telemetry channels on-device to compute real-time early warning risk scores.
        </p>
      </div>

      {/* Sensor Data Flow Diagram */}
      <article className="panel" style={{ padding: 24, marginBottom: 20, background: '#3B0000', color: '#FFF', borderColor: 'var(--yellow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Layers size={20} style={{ color: 'var(--yellow)' }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>On-Device Multi-Modal Fusion Flow</h3>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.3)',
            padding: 16,
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            color: '#FFF',
          }}
        >
          <span>5 Core Sensors</span>
          <span style={{ color: 'var(--yellow)' }}>➔</span>
          <span>ESP32 Node</span>
          <span style={{ color: 'var(--yellow)' }}>➔</span>
          <span>BLE Gateway</span>
          <span style={{ color: 'var(--yellow)' }}>➔</span>
          <span>Edge Feature Extraction</span>
          <span style={{ color: 'var(--yellow)' }}>➔</span>
          <span>Personal Baseline</span>
          <span style={{ color: 'var(--yellow)' }}>➔</span>
          <span>Multi-Modal Fusion</span>
          <span style={{ color: 'var(--yellow)' }}>➔</span>
          <span style={{ background: 'var(--yellow)', color: '#171717', padding: '4px 8px', borderRadius: 4 }}>AERIS Risk Score</span>
        </div>
      </article>

      {/* Main Score & Threshold Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, marginBottom: 20 }}>
        <article className="panel" style={{ padding: 24, display: 'grid', placeItems: 'center' }}>
          <p className="eyebrow" style={{ width: '100%', textAlign: 'left' }}>Overall AERIS Risk Index</p>
          <RiskGauge risks={risks} />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <span className={`status-pill ${risks.color}`}>{risks.statusLabel}</span>
            <p style={{ fontSize: 12, color: '#4B5563', margin: '8px 0 0' }}>
              Multi-signal agreement check: <strong>Active</strong> (Prevents false alarms)
            </p>
          </div>
        </article>

        <article className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px', color: '#171717' }}>Prototype Risk Thresholds</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { range: '0 – 25', label: 'Normal (Low Risk)', desc: 'Biometric & environmental signals strictly within baseline.', color: '#10B981' },
              { range: '26 – 50', label: 'Monitor (Moderate Risk)', desc: 'Minor signal variation; continued passive edge tracking.', color: 'var(--yellow)' },
              { range: '51 – 75', label: 'Warning (Elevated Risk)', desc: 'Multi-signal strain detected; user advisory generated.', color: '#F97316' },
              { range: '76 – 100', label: 'High Risk (High Attention)', desc: 'Significant physiological or climate hazard anomaly.', color: 'var(--main-red)' },
            ].map((item) => (
              <div key={item.range} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, background: '#F9FAFB', borderRadius: 8, borderLeft: `4px solid ${item.color}` }}>
                <span style={{ font: "12px 'Geist Mono', monospace", fontWeight: 800, width: 70, color: '#171717' }}>{item.range}</span>
                <div>
                  <strong style={{ fontSize: 13, color: '#171717' }}>{item.label}</strong>
                  <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* 6 Sub-Risk Scores Grid */}
      <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px', color: '#FFF' }}>Fused Sub-Risk Indicators</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {subRisks.map((sub) => (
          <article className="panel" style={{ padding: 20 }} key={sub.title}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 15, color: '#171717' }}>{sub.title}</strong>
              <span className={`badge ${sub.score > 60 ? 'high' : sub.score > 30 ? 'medium' : 'low'}`}>{sub.score} / 100</span>
            </div>
            <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 12px' }}>{sub.desc}</p>
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
