'use client'

import React from 'react'
import { Calendar, History, TrendingUp } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function HealthHistoryView() {
  const { history, timeframe, setTimeframe } = useTelemetry()

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="eyebrow">Longitudinal Signal Intelligence</p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '4px 0 6px', color: '#FFF' }}>Health History</h1>
          <p className="subhead">
            Tracking biometrics, stress patterns, and climate resilience over time.
          </p>
        </div>

        {/* Timeframe Selector with 44px Touch Standard */}
        <div style={{ display: 'flex', gap: 4, background: '#3B0000', padding: 4, borderRadius: 10, border: '1px solid var(--yellow)', width: '100%', maxWidth: 340 }}>
          {(['24h', '7d', '30d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                flex: 1,
                background: timeframe === tf ? 'var(--yellow)' : 'transparent',
                color: timeframe === tf ? '#171717' : '#FFF',
                border: 0,
                padding: '8px 12px',
                minHeight: 44,
                borderRadius: 8,
                fontSize: 12,
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
        {/* Heart Rate & HRV History Card */}
        <article className="panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px', color: '#171717' }}>Heart Rate & HRV ({timeframe.toUpperCase()} Trend)</h3>
          <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
            {history.map((pt, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: '100%',
                    background: 'var(--main-red)',
                    height: `${Math.max(14, ((pt.heartRate - 50) / 60) * 110)}px`,
                    borderRadius: 4,
                  }}
                  title={`${pt.time}: ${pt.heartRate} BPM`}
                />
                <span style={{ fontSize: 9, color: '#6B7280', font: "9px 'Geist Mono', monospace" }}>{pt.time}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#4B5563' }}>
            <span>Avg HR: <strong>74 BPM</strong></span>
            <span>Avg HRV: <strong>58 ms</strong></span>
          </div>
        </article>

        {/* Body Temperature History Card */}
        <article className="panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px', color: '#171717' }}>Body Temperature Variance</h3>
          <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
            {history.map((pt, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: '100%',
                    background: pt.bodyTemp > 37.2 ? 'var(--main-red)' : 'var(--yellow)',
                    height: `${Math.max(14, (pt.bodyTemp - 35.8) * 40)}px`,
                    borderRadius: 4,
                  }}
                  title={`${pt.time}: ${pt.bodyTemp}°C`}
                />
                <span style={{ fontSize: 9, color: '#6B7280', font: "9px 'Geist Mono', monospace" }}>{pt.time}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#4B5563' }}>
            <span>Min: <strong>36.4°C</strong></span>
            <span>Max: <strong>{Math.max(...history.map((h) => h.bodyTemp))}°C</strong></span>
          </div>
        </article>
      </div>

      {/* Historical Data Log */}
      <article className="panel" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px', color: '#171717' }}>Longitudinal Data Archive ({timeframe.toUpperCase()})</h3>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB', color: '#6B7280', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px' }}>Time</th>
                <th style={{ padding: '10px 8px' }}>HR</th>
                <th style={{ padding: '10px 8px' }}>HRV</th>
                <th style={{ padding: '10px 8px' }}>Temp</th>
                <th style={{ padding: '10px 8px' }}>Heat Risk</th>
                <th style={{ padding: '10px 8px' }}>Overall Score</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', color: '#171717' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.time}</td>
                  <td style={{ padding: '10px 8px' }}>{row.heartRate} BPM</td>
                  <td style={{ padding: '10px 8px' }}>{row.hrv} ms</td>
                  <td style={{ padding: '10px 8px' }}>{row.bodyTemp}°C</td>
                  <td style={{ padding: '10px 8px' }}>{row.heatRisk} / 100</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className={`badge ${row.overallRisk > 50 ? 'high' : 'medium'}`}>{row.overallRisk} / 100</span>
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
