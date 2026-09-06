'use client'

import React from 'react'
import { Activity as ActivityIcon, HeartPulse, ShieldAlert, Thermometer, Waves } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function VitalsView() {
  const { telemetry, baseline, history, realHistory, arduinoData, arduinoConnected } = useTelemetry()

  const isArduinoActive = Boolean(arduinoConnected && arduinoData?.connected)
  const isFingerPlaced = Boolean(arduinoData?.fingerDetected)
  const isMeasuring = Boolean(isArduinoActive && isFingerPlaced && arduinoData?.status === 'MEASURING')
  const isStabilizing = Boolean(isArduinoActive && arduinoData?.status === 'STABILIZING')

  const realBpm = arduinoData?.stableBpm ?? arduinoData?.bpm ?? null
  const realSpo2 = arduinoData?.stableSpo2 ?? arduinoData?.spo2 ?? null

  const activeHistory = isArduinoActive && realHistory.length > 0 ? realHistory : history

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Biometric Signal Monitoring</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '4px 0 6px', color: '#FFF' }}>Vital Signals</h1>
        <p className="subhead">
          {isArduinoActive
            ? 'Live physiological telemetry streaming directly from Arduino UNO (COM3) MAX30102.'
            : 'Continuous physiological telemetry captured locally via MAX30102 pulse oximeter & MAX30205 temperature sensor.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {/* CARD 1: Heart Rate Card (MAX30102 Real Data) */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box red">
              <HeartPulse size={20} />
            </span>
            <span className={`status-pill ${isArduinoActive ? (realBpm !== null ? 'green' : 'yellow') : 'red'}`}>
              {isArduinoActive
                ? realBpm !== null
                  ? 'MAX30102 (COM3 LIVE)'
                  : isStabilizing
                  ? 'STABILIZING'
                  : 'NO FINGER DETECTED'
                : 'MAX30102 (DEMO)'}
            </span>
          </div>
          <p className="eyebrow">Heart Rate</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 6px' }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#171717', lineHeight: 1 }}>
              {isArduinoActive ? (realBpm !== null ? realBpm : '--') : telemetry.heartRate}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>BPM</span>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '6px 0' }}>
            Baseline: <strong>{baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM</strong>
          </div>
          <div style={{ fontSize: 11, color: isArduinoActive ? (realBpm !== null ? '#059669' : 'var(--main-red)') : (telemetry.heartRate > baseline.restingHRRange.max ? 'var(--main-red)' : '#059669'), fontWeight: 700 }}>
            {isArduinoActive
              ? realBpm !== null
                ? `Status: Live pulse ${realBpm} BPM`
                : isStabilizing
                ? 'Status: STABILIZING'
                : 'Status: NO FINGER DETECTED'
              : telemetry.heartRate > baseline.restingHRRange.max
              ? `Deviation: +${telemetry.heartRate - baseline.restingHR} BPM above baseline`
              : 'Status: Within normal resting range'}
          </div>
        </article>

        {/* CARD 2: Blood Oxygen (SpO2) Card (MAX30102 Real Data) */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <ActivityIcon size={20} />
            </span>
            <span className={`status-pill ${isArduinoActive ? (realSpo2 !== null ? 'green' : 'yellow') : 'yellow'}`}>
              {isArduinoActive
                ? realSpo2 !== null
                  ? 'MAX30102 (COM3 LIVE)'
                  : isStabilizing
                  ? 'STABILIZING'
                  : 'NO FINGER DETECTED'
                : 'MAX30102'}
            </span>
          </div>
          <p className="eyebrow">Blood Oxygen (SpO₂)</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 6px' }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#171717', lineHeight: 1 }}>
              {isArduinoActive ? (realSpo2 !== null ? realSpo2 : '--') : telemetry.spo2}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: '#4B5563', margin: '6px 0' }}>
            Expected Range: <strong>95–100%</strong>
          </div>
          <div style={{ fontSize: 11, color: isArduinoActive ? (realSpo2 !== null ? (realSpo2 >= 95 ? '#059669' : 'var(--main-red)') : 'var(--main-red)') : (telemetry.spo2 >= 95 ? '#059669' : 'var(--main-red)'), fontWeight: 700 }}>
            {isArduinoActive
              ? realSpo2 !== null
                ? realSpo2 >= 95
                  ? 'Status: Optimal oxygenation'
                  : 'Status: Needs Attention'
                : isStabilizing
                ? 'Status: STABILIZING'
                : 'Status: NO FINGER DETECTED'
              : telemetry.spo2 >= 95
              ? 'Status: Oxygenation optimal'
              : 'Status: Slight oxygenation drop monitored'}
          </div>
        </article>

        {/* CARD 3: Body Temperature Card */}
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

        {/* CARD 4: Heart Rate Variability (HRV) Card */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <Waves size={20} />
            </span>
            <span className="status-pill yellow">SIMULATED</span>
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
      </div>

      {/* 24-Hour Telemetry History Table */}
      <article className="panel" style={{ marginTop: 20, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#171717' }}>24-Hour Telemetry History</h3>
          {isArduinoActive && (
            <span className="status-pill green">
              COM3 LIVE STREAM ({realHistory.length} readings)
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB', color: '#6B7280' }}>
                <th style={{ padding: '10px 8px' }}>Timestamp</th>
                <th style={{ padding: '10px 8px' }}>Heart Rate</th>
                <th style={{ padding: '10px 8px' }}>Blood Oxygen (SpO₂)</th>
                <th style={{ padding: '10px 8px' }}>Body Temp</th>
                <th style={{ padding: '10px 8px' }}>Status / Stress</th>
              </tr>
            </thead>
            <tbody>
              {activeHistory.slice(-8).map((point: any, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', color: '#171717' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{point.time}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{point.heartRate} BPM</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: point.spo2 < 95 ? 'var(--main-red)' : '#059669' }}>
                    {point.spo2 !== undefined ? `${point.spo2}%` : `${telemetry.spo2}%`}
                  </td>
                  <td style={{ padding: '10px 8px' }}>{point.bodyTemp}°C</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className={`badge ${point.stress > 60 ? 'high' : 'medium'}`}>
                      {isArduinoActive && realHistory.length > 0 ? 'REAL MAX30102' : `${point.stress} / 100`}
                    </span>
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
