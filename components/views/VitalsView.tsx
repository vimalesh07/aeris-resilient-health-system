'use client'

import React from 'react'
import { Activity as ActivityIcon, HeartPulse, ShieldAlert, Thermometer, Waves } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function VitalsView() {
  const { telemetry, baseline, history } = useTelemetry()

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Biometric Signal Monitoring</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '4px 0 6px', color: '#FFF' }}>Vital Signals</h1>
        <p className="subhead">
          Continuous physiological telemetry captured locally via MAX30102 pulse oximeter & MAX30205 temperature sensor.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {/* Heart Rate Card */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box red">
              <HeartPulse size={20} />
            </span>
            <span className="status-pill red">MAX30102</span>
          </div>
          <p className="eyebrow">Heart Rate</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 6px' }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#171717', lineHeight: 1 }}>{telemetry.heartRate}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>BPM</span>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '6px 0' }}>
            Baseline: <strong>{baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM</strong>
          </div>
          <div style={{ fontSize: 11, color: telemetry.heartRate > baseline.restingHRRange.max ? 'var(--main-red)' : '#059669', fontWeight: 700 }}>
            {telemetry.heartRate > baseline.restingHRRange.max
              ? `Deviation: +${telemetry.heartRate - baseline.restingHR} BPM above baseline`
              : 'Status: Within normal resting range'}
          </div>
        </article>

        {/* HRV Card */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <Waves size={20} />
            </span>
            <span className="status-pill yellow">MAX30102</span>
          </div>
          <p className="eyebrow">Heart Rate Variability (HRV)</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 6px' }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#171717', lineHeight: 1 }}>{telemetry.hrv}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>ms</span>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '6px 0' }}>
            Baseline Target: <strong>{baseline.hrvRange.min}–{baseline.hrvRange.max} ms</strong>
          </div>
          <div style={{ fontSize: 11, color: telemetry.hrv < baseline.hrvRange.min ? 'var(--main-red)' : '#059669', fontWeight: 700 }}>
            {telemetry.hrv < baseline.hrvRange.min ? 'Physiological stress pattern detected' : 'Optimal parasympathetic tone'}
          </div>
        </article>

        {/* Body Temperature Card */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box red">
              <Thermometer size={20} />
            </span>
            <span className="status-pill red">MAX30205</span>
          </div>
          <p className="eyebrow">Body / Skin Temperature</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 6px' }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#171717', lineHeight: 1 }}>{telemetry.bodyTemp.toFixed(1)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>°C</span>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '6px 0' }}>
            Baseline Target: <strong>{baseline.tempRange.min}–{baseline.tempRange.max}°C</strong>
          </div>
          <div style={{ fontSize: 11, color: telemetry.bodyTemp > baseline.tempRange.max ? 'var(--main-red)' : '#059669', fontWeight: 700 }}>
            {telemetry.bodyTemp > baseline.tempRange.max
              ? `Temperature anomaly: +${(telemetry.bodyTemp - baseline.tempBaseline).toFixed(1)}°C variance`
              : 'Status: Thermoregulation stable'}
          </div>
        </article>

        {/* SpO2 Card */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <ActivityIcon size={20} />
            </span>
            <span className="status-pill yellow">MAX30102</span>
          </div>
          <p className="eyebrow">Blood Oxygen Saturation (SpO₂)</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 6px' }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#171717', lineHeight: 1 }}>{telemetry.spo2}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '6px 0' }}>
            Expected Range: <strong>95–100%</strong>
          </div>
          <div style={{ fontSize: 11, color: telemetry.spo2 >= 95 ? '#059669' : 'var(--main-red)', fontWeight: 700 }}>
            {telemetry.spo2 >= 95 ? 'Oxygenation optimal' : 'Slight oxygenation drop monitored'}
          </div>
        </article>
      </div>

      {/* 24-Hour Vitals History Table */}
      <article className="panel" style={{ marginTop: 20, padding: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px', color: '#171717' }}>24-Hour Telemetry History</h3>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB', color: '#6B7280' }}>
                <th style={{ padding: '10px 8px' }}>Timestamp</th>
                <th style={{ padding: '10px 8px' }}>Heart Rate</th>
                <th style={{ padding: '10px 8px' }}>HRV</th>
                <th style={{ padding: '10px 8px' }}>Body Temp</th>
                <th style={{ padding: '10px 8px' }}>Stress Score</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-8).map((point, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', color: '#171717' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{point.time}</td>
                  <td style={{ padding: '10px 8px' }}>{point.heartRate} BPM</td>
                  <td style={{ padding: '10px 8px' }}>{point.hrv} ms</td>
                  <td style={{ padding: '10px 8px' }}>{point.bodyTemp}°C</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className={`badge ${point.stress > 60 ? 'high' : 'medium'}`}>{point.stress} / 100</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}
