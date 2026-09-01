'use client'

import React, { useState } from 'react'
import { HeartPulse, Play, ShieldAlert, Sparkles, Waves } from 'lucide-react'
import { GuidedBreathingModal } from '@/components/GuidedBreathingModal'
import { useTelemetry } from '@/hooks/useTelemetry'

export function StressWellbeingView() {
  const { telemetry, baseline, risks } = useTelemetry()
  const [showBreathing, setShowBreathing] = useState<boolean>(false)

  const stressState = risks.stress > 65 ? 'High' : risks.stress > 35 ? 'Elevated' : 'Normal'

  return (
    <div style={{ paddingTop: 20 }}>
      {showBreathing && <GuidedBreathingModal onClose={() => setShowBreathing(false)} />}

      <div style={{ marginBottom: 24 }}>
        <p className="eyebrow">Autonomic Nervous System Intelligence</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>Stress & Well-being</h1>
        <p className="subhead">
          Estimating physiological stress via MAX30102 HRV & resting heart rate telemetry — strictly without GSR hardware.
        </p>
      </div>

      {/* Main Stress Score Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20 }}>
        <article className="panel" style={{ padding: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="icon-box yellow">
              <Waves size={22} />
            </span>
            <span className={`status-pill ${stressState === 'High' ? 'red' : stressState === 'Elevated' ? 'yellow' : 'green'}`}>
              {stressState} Stress
            </span>
          </div>

          <p className="eyebrow">Physiological Stress Index</p>
          <div style={{ fontSize: 44, fontWeight: 900, color: '#171717', margin: '4px 0 8px' }}>
            {risks.stress} <small style={{ fontSize: 16, color: '#6B7280' }}>/ 100</small>
          </div>

          <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, margin: '0 0 20px' }}>
            "Your physiological stress indicators are {stressState === 'Normal' ? 'optimal and aligned with' : 'slightly elevated compared with'} your personal baseline."
          </p>

          <button
            className="demo-toggle"
            onClick={() => setShowBreathing(true)}
            style={{ background: 'var(--yellow)', color: '#171717', border: 0, padding: '12px 20px', fontSize: 13, fontWeight: 800 }}
          >
            <Play size={16} />
            <span>Launch Guided HRV Breathing</span>
          </button>
        </article>

        {/* Input Signal Sources (Confirming NO GSR!) */}
        <article className="panel" style={{ padding: 26 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#171717' }}>Signal Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, color: '#171717' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span>Heart Rate Variability (HRV)</span>
              <strong>{telemetry.hrv} ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span>Resting Heart Rate</span>
              <strong>{telemetry.heartRate} BPM</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span>Activity State</span>
              <strong>{telemetry.activity}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span>Learned Resting Baseline</span>
              <strong>{baseline.restingHR} BPM / {baseline.hrvBaseline} ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#FEF3C7', padding: 8, borderRadius: 6, color: '#78350F', fontWeight: 700 }}>
              <span>GSR / Galvanic Skin Sensor</span>
              <span>NOT REQUIRED (OMITTED)</span>
            </div>
          </div>
        </article>
      </div>

      {/* Safety Notice */}
      <article className="panel" style={{ padding: 20, background: '#FFF8F0', borderColor: 'var(--yellow)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ShieldAlert size={22} style={{ color: 'var(--main-red)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
            <strong>Non-Diagnostic Safety Standard:</strong> AERIS monitors physiological strain to promote recovery and resilience.
            It does not diagnose mental health or psychiatric conditions.
          </p>
        </div>
      </article>
    </div>
  )
}
