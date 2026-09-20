'use client'

import React from 'react'
import { Activity as ActivityIcon, HeartPulse, Thermometer, Waves } from 'lucide-react'
import { HumanRiskVisualization } from '@/components/HumanRiskVisualization'
import { useTelemetry } from '@/hooks/useTelemetry'
import { TelemetryValue } from '@/components/ui/TelemetryValue'

export function VitalsView() {
  const { risks, telemetry, baseline, dailyAnalysis, history, realHistory, arduinoData, arduinoConnected, transport } = useTelemetry()

  const isArduinoActive = Boolean(arduinoConnected && arduinoData?.connected)
  const isFingerPlaced = Boolean(arduinoData?.fingerDetected)
  const isStabilizing = Boolean(isArduinoActive && arduinoData?.status === 'STABILIZING')

  const realBpm = arduinoData?.stableBpm ?? arduinoData?.bpm ?? null
  const realSpo2 = arduinoData?.stableSpo2 ?? arduinoData?.spo2 ?? null

  const activeHistory = isArduinoActive && realHistory.length > 0 ? realHistory : history

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Biometric Signal Monitoring</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>Live Vitals Dashboard</h1>
        <p className="subhead">
          {isArduinoActive
            ? `● Real-time physiological telemetry streaming directly via ${transport} hardware bridge.`
            : '○ Continuous physiological telemetry captured locally via physical sensors & edge AI modules.'}
        </p>
      </div>

      <article className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>Holographic Digital Twin Status</h3>
        <HumanRiskVisualization
          risks={risks}
          compact
          currentBpm={isArduinoActive ? (realBpm !== null ? realBpm : telemetry.heartRate) : telemetry.heartRate}
          currentTemp={telemetry.bodyTemp}
          currentSpo2={isArduinoActive ? (realSpo2 !== null ? realSpo2 : telemetry.spo2) : telemetry.spo2}
          baselineHR={baseline.restingHR}
          baselineTemp={baseline.tempBaseline}
        />
      </article>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {/* CARD 1: Heart Rate */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box red">
              <HeartPulse size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: isArduinoActive ? (realBpm !== null ? 'var(--risk-safe)' : 'var(--yellow)') : 'var(--text-muted)', background: 'var(--panel-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              {isArduinoActive
                ? realBpm !== null
                  ? transport.includes('WiFi') ? 'WIFI LIVE' : 'LIVE'
                  : isStabilizing
                  ? 'STABILIZING'
                  : 'NO FINGER'
                : 'MAX30102'}
            </span>
          </div>
          <TelemetryValue
            label="Heart Rate"
            value={isArduinoActive ? (realBpm !== null ? realBpm : '--') : telemetry.heartRate}
            unit="BPM"
            status={isArduinoActive ? (realBpm !== null ? 'live' : isStabilizing ? 'stabilizing' : 'stale') : 'live'}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
            Circadian Baseline: <strong>{baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM</strong>
          </div>
        </article>

        {/* CARD 2: Blood Oxygen (SpO2) */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <ActivityIcon size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: isArduinoActive ? (realSpo2 !== null ? 'var(--risk-safe)' : 'var(--yellow)') : 'var(--text-muted)', background: 'var(--panel-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              {isArduinoActive
                ? realSpo2 !== null
                  ? transport.includes('WiFi') ? 'WIFI LIVE' : 'LIVE'
                  : isStabilizing
                  ? 'STABILIZING'
                  : 'NO FINGER'
                : 'MAX30102'}
            </span>
          </div>
          <TelemetryValue
            label="Blood Oxygen (SpO₂)"
            value={isArduinoActive ? (realSpo2 !== null ? realSpo2 : '--') : telemetry.spo2}
            unit="%"
            status={isArduinoActive ? (realSpo2 !== null ? 'live' : isStabilizing ? 'stabilizing' : 'stale') : 'live'}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
            Expected Target: <strong>95–100%</strong>
          </div>
        </article>

        {/* CARD 3: Body Temperature */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box red">
              <Thermometer size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--risk-safe)', background: 'var(--panel-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              MAX30205
            </span>
          </div>
          <TelemetryValue
            label="Body Temperature"
            value={telemetry.bodyTemp.toFixed(1)}
            unit="°C"
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
            Target: <strong>{baseline.tempRange.min}–{baseline.tempRange.max}°C</strong>
          </div>
        </article>

        {/* CARD 4: Heart Rate Variability */}
        <article className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="icon-box yellow">
              <Waves size={18} />
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--panel-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              rMSSD
            </span>
          </div>
          <TelemetryValue
            label="Heart Rate Variability"
            value={telemetry.hrv !== null ? telemetry.hrv : '--'}
            unit="ms"
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
            Target: <strong>{baseline.hrvRange.min}–{baseline.hrvRange.max} ms</strong>
          </div>
        </article>
      </div>

      {/* TODAY'S VITAL TREND SUMMARY */}
      <article className="panel" style={{ padding: 20, margin: '20px 0' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>DAILY VITAL TREND SUMMARY</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Avg HR</span>
            <h4 style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>{dailyAnalysis.avgHR} <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>BPM</small></h4>
          </div>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Peak HR</span>
            <h4 style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--risk-critical)' }}>{dailyAnalysis.maxHR} <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>BPM</small></h4>
          </div>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Avg SpO₂</span>
            <h4 style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--risk-safe)' }}>{dailyAnalysis.avgSpo2} <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>%</small></h4>
          </div>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Lowest SpO₂</span>
            <h4 style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 800, color: dailyAnalysis.minSpo2 < 95 ? 'var(--risk-critical)' : 'var(--text-primary)' }}>{dailyAnalysis.minSpo2} <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>%</small></h4>
          </div>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Avg Temp</span>
            <h4 style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>{dailyAnalysis.avgBodyTemp} <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>°C</small></h4>
          </div>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Temp Anomalies</span>
            <h4 style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 800, color: dailyAnalysis.tempAnomalyCount > 0 ? 'var(--risk-critical)' : 'var(--risk-safe)' }}>{dailyAnalysis.tempAnomalyCount}</h4>
          </div>
        </div>
      </article>

      {/* 24-Hour Telemetry History Table */}
      <article className="panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>
          {isArduinoActive ? `24-Hour Telemetry History (${transport} Stream)` : '24-Hour Telemetry History'}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Heart Rate</th>
                <th style={{ padding: '10px 12px' }}>SpO₂</th>
                <th style={{ padding: '10px 12px' }}>Body Temp</th>
                <th style={{ padding: '10px 12px' }}>Stress Index</th>
              </tr>
            </thead>
            <tbody>
              {activeHistory.slice(-10).map((pt, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{pt.time}</td>
                  <td style={{ padding: '10px 12px', color: pt.heartRate > baseline.restingHRRange.max ? 'var(--risk-critical)' : 'var(--text-primary)', fontWeight: 700 }}>
                    {pt.heartRate} BPM
                  </td>
                  <td style={{ padding: '10px 12px', color: pt.spo2 < 95 ? 'var(--risk-critical)' : 'var(--risk-safe)', fontWeight: 700 }}>
                    {pt.spo2}%
                  </td>
                  <td style={{ padding: '10px 12px' }}>{pt.bodyTemp}°C</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, background: pt.stress > 60 ? 'rgba(198,40,40,0.2)' : 'rgba(16,185,129,0.15)', color: pt.stress > 60 ? 'var(--risk-critical)' : 'var(--risk-safe)' }}>
                      {pt.stress} / 100
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
