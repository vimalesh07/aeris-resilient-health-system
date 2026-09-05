'use client'

import React, { useState } from 'react'
import { CheckCircle, RefreshCw, Save, Settings2, Sliders } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function SettingsView() {
  const { baseline, updateBaseline, isOffline, setIsOffline, sensors } = useTelemetry()
  const [restingHR, setRestingHR] = useState<number>(baseline.restingHR)
  const [hrvBaseline, setHrvBaseline] = useState<number>(baseline.hrvBaseline)
  const [tempBaseline, setTempBaseline] = useState<number>(baseline.tempBaseline)
  const [saved, setSaved] = useState<boolean>(false)

  const handleSave = () => {
    updateBaseline({
      restingHR: Number(restingHR) || baseline.restingHR,
      hrvBaseline: Number(hrvBaseline) || baseline.hrvBaseline,
      tempBaseline: Number(tempBaseline) || baseline.tempBaseline,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Personal System Tuning</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '4px 0 6px', color: '#FFF' }}>System Settings</h1>
        <p className="subhead">
          Tune baseline sensitivity, alert thresholds, offline mode, and prototype hardware diagnostic tools.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 18 }}>
        {/* Baseline Targets Tuning */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Sliders size={20} style={{ color: 'var(--main-red)' }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#171717' }}>Personal Baseline Targets</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Resting Heart Rate Target (BPM)
              </label>
              <input
                type="number"
                value={restingHR}
                onChange={(e) => setRestingHR(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', minHeight: 44, borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                HRV Baseline Target (ms)
              </label>
              <input
                type="number"
                value={hrvBaseline}
                onChange={(e) => setHrvBaseline(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', minHeight: 44, borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Baseline Body Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={tempBaseline}
                onChange={(e) => setTempBaseline(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', minHeight: 44, borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none' }}
              />
            </div>

            <button
              className="demo-toggle"
              onClick={handleSave}
              style={{ background: 'var(--yellow)', color: '#171717', border: 0, marginTop: 4, minHeight: 44, width: '100%', justifyContent: 'center' }}
            >
              <Save size={16} />
              <span>{saved ? 'Settings Saved!' : 'Save Baseline Preferences'}</span>
            </button>
          </div>
        </article>

        {/* Offline & System Diagnostics */}
        <article className="panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px', color: '#171717' }}>System Diagnostics & Privacy</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 13, display: 'block', color: '#171717' }}>Offline Intelligence Mode</strong>
                <small style={{ color: '#6B7280', fontSize: 11 }}>Force 100% on-device local processing</small>
              </div>
              <input
                type="checkbox"
                checked={isOffline}
                onChange={() => setIsOffline(!isOffline)}
                style={{ width: 22, height: 22, accentColor: 'var(--main-red)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 10 }}>
              <strong style={{ fontSize: 13, display: 'block', color: '#171717', marginBottom: 6 }}>Prototype Hardware Re-Sync</strong>
              <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 10 }}>
                Active BLE Sensors: <strong>5 Connected</strong> (MAX30102, MAX30205, MPU6050, BME280, Rain Sensor)
              </div>
              <button className="outline-button" style={{ fontSize: 11, padding: '8px 14px', minHeight: 40, width: '100%', justifyContent: 'center' }}>
                <RefreshCw size={14} /> Re-scan BLE Nodes
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
