'use client'

import React from 'react'
import { Activity as ActivityIcon, HeartPulse, ShieldAlert, Thermometer, Waves } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function VitalsView() {
  const { telemetry, baseline, history } = useTelemetry()

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="eyebrow">Biometric Signal Monitoring</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>Vital Signals</h1>
        <p className="subhead">
          Continuous physiological telemetry captured locally via MAX30102 pulse oximeter & MAX30205 temperature sensor.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Heart Rate Card */}
        <article className="panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="icon-box red">
              <HeartPulse size={20} />
            </span>
            <span className="status-pill red">MAX30102</span>
          </div>
          <p className="eyebrow">Heart Rate</p>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#171717', margin: '4px 0' }}>
            {telemetry.heartRate} <small style={{ fontSize: 14, color: '#6B7280' }}>BPM</small>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '8px 0' }}>
            Baseline: <strong>{baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM</strong>
          </div>
          <div style={{ fontSize: 12, color: telemetry.heartRate > baseline.restingHRRange.max ? 'var(--main-red)' : '#059669', fontWeight: 700 }}>
            {telemetry.heartRate > baseline.restingHRRange.max
              ? `Deviation: +${telemetry.heartRate - baseline.restingHR} BPM above baseline`
              : 'Status: Within normal resting range'}
          </div>
        </article>

        {/* HRV Card */}
        <article className="panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="icon-box yellow">
              <Waves size={20} />
            </span>
            <span className="status-pill yellow">MAX30102</span>
          </div>
          <p className="eyebrow">Heart Rate Variability (HRV)</p>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#171717', margin: '4px 0' }}>
            {telemetry.hrv} <small style={{ fontSize: 14, color: '#6B7280' }}>ms</small>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '8px 0' }}>
            Baseline Target: <strong>{baseline.hrvRange.min}–{baseline.hrvRange.max} ms</strong>
          </div>
          <div style={{ fontSize: 12, color: telemetry.hrv < baseline.hrvRange.min ? 'var(--main-red)' : '#059669', fontWeight: 700 }}>
            {telemetry.hrv < baseline.hrvRange.min ? 'Physiological stress pattern detected' : 'Optimal parasympathetic tone'}
          </div>
        </article>

        {/* Body Temperature Card */}
        <article className="panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="icon-box red">
              <Thermometer size={20} />
            </span>
            <span className="status-pill red">MAX30205</span>
          </div>
          <p className="eyebrow">Body / Skin Temperature</p>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#171717', margin: '4px 0' }}>
            {telemetry.bodyTemp.toFixed(1)} <small style={{ fontSize: 14, color: '#6B7280' }}>°C</small>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '8px 0' }}>
            Baseline Target: <strong>{baseline.tempRange.min}–{baseline.tempRange.max}°C</strong>
          </div>
          <div style={{ fontSize: 12, color: telemetry.bodyTemp > baseline.tempRange.max ? 'var(--main-red)' : '#059669', fontWeight: 700 }}>
            {telemetry.bodyTemp > baseline.tempRange.max
              ? `Temperature anomaly: +${(telemetry.bodyTemp - baseline.tempBaseline).toFixed(1)}°C variance`
              : 'Status: Thermoregulation stable'}
          </div>
        </article>

        {/* SpO2 Card */}
        <article className="panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="icon-box yellow">
              <ActivityIcon size={20} />
            </span>
            <span className="status-pill yellow">MAX30102</span>
          </div>
          <p className="eyebrow">Blood Oxygen Saturation (SpO₂)</p>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#171717', margin: '4px 0' }}>
            {telemetry.spo2} <small style={{ fontSize: 14, color: '#6B7280' }}>%</small>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '8px 0' }}>
            Expected Range: <strong>95–100%</strong>
          </div>
          <div style={{ fontSize: 12, color: telemetry.spo2 >= 95 ? '#059669' : 'var(--main-red)', fontWeight: 700 }}>
            {telemetry.spo2 >= 95 ? 'Oxygenation optimal' : 'Slight oxygenation drop monitored'}
          </div>
        </article>
      </div>

      {/* 24-Hour Vitals Trend Sparklines */}
      <article className="panel" style={{ marginTop: 20, padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#171717' }}>24-Hour Telemetry History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB', color: '#6B7280' }}>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Heart Rate</th>
                <th style={{ padding: '10px 12px' }}>HRV</th>
                <th style={{ padding: '10px 12px' }}>Body Temp</th>
                <th style={{ padding: '10px 12px' }}>Stress Score</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-8).map((point, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', color: '#171717' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{point.time}</td>
                  <td style={{ padding: '10px 12px' }}>{point.heartRate} BPM</td>
                  <td style={{ padding: '10px 12px' }}>{point.hrv} ms</td>
                  <td style={{ padding: '10px 12px' }}>{point.bodyTemp}°C</td>
                  <td style={{ padding: '10px 12px' }}>
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
