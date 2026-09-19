'use client'

import React from 'react'
import { HardDrive, Lock, ShieldCheck, WifiOff } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { RiskBadge } from '@/components/ui/RiskBadge'

export function PrivacyView() {
  const { isOffline, setIsOffline } = useTelemetry()

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Zero-Cloud Privacy Guarantee</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>Privacy & Data Architecture</h1>
        <p className="subhead">
          "Sensitive physiological signal processing is designed to remain strictly on-device."
        </p>
      </div>

      {/* Privacy Guarantees Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <ShieldCheck size={18} />
            </span>
            <RiskBadge level="SAFE" score={100} size="sm" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>Local Edge AI Inference</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Signal extraction and multi-modal risk scoring execute 100% locally on your device or Edge Hub.
          </p>
        </article>

        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box red">
              <WifiOff size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--risk-critical)', background: 'rgba(198,40,40,0.15)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(198,40,40,0.3)' }}>
              ZERO UPLOAD
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>Cloud Health Data Isolation</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Zero health vitals, stress logs, or gait metrics are ever uploaded to external cloud servers.
          </p>
        </article>

        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box dark">
              <Lock size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--risk-safe)', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(16,185,129,0.3)' }}>
              LOCAL AES-256
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>Encrypted Local Storage</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Biometric baselines and historical telemetry buffers are stored securely in browser local storage.
          </p>
        </article>

        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <HardDrive size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--panel-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              DISCARDED
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>Raw Sensor Stream Handling</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            High-frequency PPG & IMU waveforms are processed in volatile RAM and discarded after feature extraction.
          </p>
        </article>
      </div>

      {/* Offline Intelligence Banner */}
      <article className="panel" style={{ padding: 20, marginBottom: 18, background: 'var(--panel-elevated)', border: '1px solid var(--border-focus)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--yellow)', letterSpacing: '0.1em' }}>
              OFFLINE INTELLIGENCE ACTIVE
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '4px 0 4px', color: 'var(--text-primary)' }}>
              LOCAL PROCESSING ENABLED
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              AERIS runs offline — sensor signal processing, risk calculations, alerts, and AI guidance operate without internet.
            </p>
          </div>

          <button
            onClick={() => setIsOffline(!isOffline)}
            style={{
              background: 'var(--yellow)',
              color: '#080B10',
              border: 0,
              padding: '8px 16px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              borderRadius: 8,
              minHeight: 40,
              cursor: 'pointer',
            }}
          >
            {isOffline ? 'Offline Mode Active' : 'Enable Offline Mode'}
          </button>
        </div>
      </article>

      {/* Hardware Architecture Flow */}
      <article className="panel" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>AERIS Edge Architecture Pipeline</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          {[
            { step: '1. Core Sensors', desc: 'MAX30102, MAX30205, MPU6050, BME280' },
            { step: '2. Local MCU', desc: 'Arduino UNO / ESP32 Serial Node' },
            { step: '3. Transport', desc: 'USB Serial (COM3 @ 115200 baud)' },
            { step: '4. Edge Hub', desc: 'Node.js WebSocket Bridge (ws://3001)' },
            { step: '5. Risk Engine', desc: 'Multi-Modal Fusion & Personal Baseline' },
            { step: '6. Output', desc: 'Local Storage & Grounded UI' },
          ].map((s) => (
            <div key={s.step} style={{ background: 'var(--panel-elevated)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ display: 'block', color: 'var(--yellow)', marginBottom: 4 }}>{s.step}</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
