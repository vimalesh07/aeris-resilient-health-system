'use client'

import React from 'react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { RiskBadge } from '@/components/ui/RiskBadge'

export function HealthHistoryView() {
  const { history, timeframe, setTimeframe } = useTelemetry()

  const avgHR = history.length ? Math.round(history.reduce((sum, pt) => sum + pt.heartRate, 0) / history.length) : 70
  const validHrvs = history.map((h) => h.hrv).filter((v): v is number => v !== null)
  const avgHRV = validHrvs.length ? Math.round(validHrvs.reduce((sum, v) => sum + v, 0) / validHrvs.length) : 65
  const minTemp = history.length ? Math.min(...history.map((h) => h.bodyTemp)).toFixed(1) : '36.2'
  const maxTemp = history.length ? Math.max(...history.map((h) => h.bodyTemp)).toFixed(1) : '37.0'

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="eyebrow">Longitudinal Signal Intelligence</p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>Health History</h1>
          <p className="subhead">
            Tracking biometrics, stress patterns, and climate resilience over time.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--panel-elevated)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)', width: '100%', maxWidth: 320 }}>
          {(['24h', '7d', '30d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                flex: 1,
                background: timeframe === tf ? 'var(--yellow)' : 'transparent',
                color: timeframe === tf ? '#080B10' : 'var(--text-secondary)',
                border: 0,
                padding: '6px 12px',
                minHeight: 36,
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {tf === '24h' ? '24 Hours' : tf === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Historical Signal Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 18 }}>
        {/* Heart Rate Trend Card */}
        <article className="panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>Heart Rate ({timeframe.toUpperCase()} Trend)</h3>
          <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {history.map((pt, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: '100%',
                    background: 'var(--main-red)',
                    height: `${Math.max(12, ((pt.heartRate - 50) / 60) * 100)}px`,
                    borderRadius: 3,
                  }}
                  title={`${pt.time}: ${pt.heartRate} BPM`}
                />
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pt.time}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <span>Avg HR: <strong style={{ color: 'var(--text-primary)' }}>{avgHR} BPM</strong></span>
            <span>Avg HRV: <strong style={{ color: 'var(--text-primary)' }}>{avgHRV} ms</strong></span>
          </div>
        </article>

        {/* Body Temperature History Card */}
        <article className="panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>Body Temperature Variance</h3>
          <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {history.map((pt, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: '100%',
                    background: pt.bodyTemp > 37.2 ? 'var(--risk-critical)' : 'var(--yellow)',
                    height: `${Math.max(12, (pt.bodyTemp - 35.8) * 35)}px`,
                    borderRadius: 3,
                  }}
                  title={`${pt.time}: ${pt.bodyTemp}°C`}
                />
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pt.time}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <span>Min: <strong style={{ color: 'var(--text-primary)' }}>{minTemp}°C</strong></span>
            <span>Max: <strong style={{ color: 'var(--text-primary)' }}>{maxTemp}°C</strong></span>
          </div>
        </article>
      </div>

      {/* Historical Data Log */}
      <article className="panel" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>Longitudinal Data Archive ({timeframe.toUpperCase()})</h3>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px' }}>Time</th>
                <th style={{ padding: '10px 8px' }}>Heart Rate</th>
                <th style={{ padding: '10px 8px' }}>HRV</th>
                <th style={{ padding: '10px 8px' }}>Body Temp</th>
                <th style={{ padding: '10px 8px' }}>Heat Risk</th>
                <th style={{ padding: '10px 8px' }}>Overall Score</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                  <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{row.time}</td>
                  <td style={{ padding: '10px 8px' }}>{row.heartRate} BPM</td>
                  <td style={{ padding: '10px 8px' }}>{row.hrv} ms</td>
                  <td style={{ padding: '10px 8px' }}>{row.bodyTemp}°C</td>
                  <td style={{ padding: '10px 8px' }}>{row.heatRisk} / 100</td>
                  <td style={{ padding: '10px 8px' }}>
                    <RiskBadge level={row.overallRisk > 50 ? 'CRITICAL' : 'SAFE'} score={row.overallRisk} size="sm" />
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
