'use client'

import React, { useState } from 'react'
import { CheckCircle, RefreshCw, Save, Settings2, Sliders } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function SettingsView() {
  const { baseline, isOffline, setIsOffline, sensors } = useTelemetry()
  const [saved, setSaved] = useState<boolean>(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="eyebrow">Personal System Tuning</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>System Settings</h1>
        <p className="subhead">
          Tune baseline sensitivity, alert thresholds, offline mode, and prototype hardware diagnostic tools.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Baseline Targets Tuning */}
        <article className="panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Sliders size={20} style={{ color: 'var(--main-red)' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#171717' }}>Personal Baseline Targets</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Resting Heart Rate Target (BPM)
              </label>
              <input
                type="number"
                defaultValue={baseline.restingHR}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                HRV Baseline Target (ms)
              </label>
              <input
                type="number"
                defaultValue={baseline.hrvBaseline}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Baseline Body Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                defaultValue={baseline.tempBaseline}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 13 }}
              />
            </div>

            <button
              className="demo-toggle"
              onClick={handleSave}
              style={{ background: 'var(--yellow)', color: '#171717', border: 0, marginTop: 8, justifyContent: 'center' }}
            >
              <Save size={15} />
              <span>{saved ? 'Settings Saved!' : 'Save Baseline Preferences'}</span>
            </button>
          </div>
        </article>

        {/* Offline & System Diagnostics */}
        <article className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#171717' }}>System Diagnostics & Privacy</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#F9FAFB', padding: 14, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 13, display: 'block', color: '#171717' }}>Offline Intelligence Mode</strong>
                <small style={{ color: '#6B7280', fontSize: 11 }}>Force 100% on-device local processing</small>
              </div>
              <input
                type="checkbox"
                checked={isOffline}
                onChange={() => setIsOffline(!isOffline)}
                style={{ width: 18, height: 18, accentColor: 'var(--main-red)' }}
              />
            </div>

            <div style={{ background: '#F9FAFB', padding: 14, borderRadius: 8 }}>
              <strong style={{ fontSize: 13, display: 'block', color: '#171717', marginBottom: 8 }}>Prototype Hardware Re-Sync</strong>
              <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 10 }}>
                Active BLE Sensors: <strong>5 Connected</strong> (MAX30102, MAX30205, MPU6050, BME280, Rain Sensor)
              </div>
              <button className="outline-button" style={{ fontSize: 11, padding: '6px 12px' }}>
                <RefreshCw size={13} /> Re-scan BLE Nodes
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
