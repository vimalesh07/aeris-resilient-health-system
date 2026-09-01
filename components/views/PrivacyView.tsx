'use client'

import React from 'react'
import { Database, HardDrive, Lock, ShieldCheck, WifiOff } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function PrivacyView() {
  const { isOffline, setIsOffline } = useTelemetry()

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Zero-Cloud Privacy Guarantee</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '4px 0 6px', color: '#FFF' }}>Privacy & Data Architecture</h1>
        <p className="subhead">
          "Sensitive health processing is designed to remain strictly on-device."
        </p>
      </div>

      {/* Privacy Guarantees Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 18 }}>
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <ShieldCheck size={20} />
            </span>
            <span className="status-pill green">ENABLED</span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#171717' }}>Local Edge AI Inference</h3>
          <p style={{ fontSize: 12, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
            Signal extraction and multi-modal risk scoring execute 100% locally on your smartphone or Edge Hub.
          </p>
        </article>

        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box red">
              <WifiOff size={20} />
            </span>
            <span className="status-pill red">DISABLED</span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#171717' }}>Cloud Health Data Sharing</h3>
          <p style={{ fontSize: 12, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
            Zero health vitals, stress logs, or gait metrics are ever uploaded to cloud servers or third parties.
          </p>
        </article>

        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box dark">
              <Lock size={20} />
            </span>
            <span className="status-pill green">ENABLED</span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#171717' }}>Encrypted Local Storage</h3>
          <p style={{ fontSize: 12, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
            Biometric baselines and historical telemetry buffers are stored securely using AES-256 local device encryption.
          </p>
        </article>

        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <HardDrive size={20} />
            </span>
            <span className="status-pill red">DISABLED</span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#171717' }}>Raw Sensor Stream Export</h3>
          <p style={{ fontSize: 12, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
            Raw high-frequency PPG & IMU waveforms are processed in volatile RAM and discarded after feature extraction.
          </p>
        </article>
      </div>

      {/* Offline Intelligence Banner */}
      <article className="panel" style={{ padding: 20, marginBottom: 18, background: '#3B0000', color: '#FFF', borderColor: 'var(--yellow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, font: "11px 'Geist Mono', monospace", fontWeight: 800, color: 'var(--yellow)', letterSpacing: '0.1em' }}>
              OFFLINE INTELLIGENCE ACTIVE
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 4px', color: '#FFF' }}>
              LOCAL PROCESSING ENABLED
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#FFF', lineHeight: 1.5 }}>
              AERIS runs completely offline — sensor signal processing, risk calculations, alerts, and AI guidance operate without internet connectivity.
            </p>
          </div>

          <button
            className="demo-toggle"
            onClick={() => setIsOffline(!isOffline)}
            style={{ background: 'var(--yellow)', color: '#171717', border: 0, padding: '10px 16px', fontSize: 12, fontWeight: 800, minHeight: 44, width: '100%', justifyContent: 'center' }}
          >
            {isOffline ? 'Offline Mode Active' : 'Enable Offline Mode'}
          </button>
        </div>
      </article>

      {/* Hardware Architecture Flow */}
      <article className="panel" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px', color: '#171717' }}>AERIS Edge Architecture Pipeline</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, textAlign: 'center', fontSize: 12 }}>
          {[
            { step: '1. Core Sensors', desc: 'MAX30102, MAX30205, MPU6050, BME280, Rain Sensor' },
            { step: '2. Local MCU', desc: 'ESP32 Low-Energy Sampling Node' },
            { step: '3. Transport', desc: 'Bluetooth Low Energy (BLE)' },
            { step: '4. Edge Hub', desc: 'Signal Processing & Feature Extraction' },
            { step: '5. Risk Engine', desc: 'Multi-Modal Fusion & Personal Baseline' },
            { step: '6. Output', desc: 'Encrypted Storage & Local Dashboard Alerts' },
          ].map((s) => (
            <div key={s.step} style={{ background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <strong style={{ display: 'block', color: 'var(--main-red)', marginBottom: 4 }}>{s.step}</strong>
              <span style={{ color: '#4B5563', fontSize: 11 }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
