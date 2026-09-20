'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { CloudSun, MapPin, RefreshCw } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { RiskBadge } from '@/components/ui/RiskBadge'

const ClimatePlaceMap = dynamic(() => import('@/components/ClimatePlaceMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 280,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--panel-elevated)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: 13,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 20 }}>📍</span>
      <span>Loading OpenStreetMap Leaflet Engine for Place...</span>
    </div>
  ),
})

export function ClimateHealthView() {
  const {
    telemetry,
    baseline,
    risks,
    dailyAnalysis,
    useRealWeather,
    setUseRealWeather,
    realWeatherData,
    fetchLiveWeather,
  } = useTelemetry()

  const psi = risks.psi
  const wbgt = risks.wbgt

  const psiCategory =
    psi >= 9.0
      ? 'Critical Heat Strain (≥9.0)'
      : psi >= 7.0
      ? 'High Heat Strain (7.0–8.9)'
      : psi >= 4.0
      ? 'Moderate Strain (4.0–6.9)'
      : 'Safe / Low Strain (0.0–3.9)'

  const psiBadgeLevel =
    psi >= 9.0 ? 'CRITICAL' : psi >= 7.0 ? 'CRITICAL' : psi >= 4.0 ? 'WARNING' : 'SAFE'

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Environmental Hazard & Climate Resilience</p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>Climate Health & Environmental Load</h1>
          <p className="subhead">
            Integrates live ambient weather with <strong>Open-Meteo Air Quality & Climate API</strong>.
          </p>
        </div>

        {/* Real Weather API Toggle Button */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setUseRealWeather(!useRealWeather)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              border: useRealWeather ? '1px solid var(--main-red)' : '1px solid var(--border-subtle)',
              background: useRealWeather ? '#FEF2F2' : 'var(--panel-elevated)',
              color: useRealWeather ? 'var(--main-red)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <CloudSun size={14} />
            <span>{useRealWeather ? 'Live Weather API Active' : 'Enable Weather API'}</span>
          </button>

          {useRealWeather && (
            <button className="icon-button" onClick={() => fetchLiveWeather()} title="Refresh live weather">
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Location / Weather Source Banner */}
      <article className="panel" style={{ padding: 14, marginBottom: 14, background: 'var(--panel-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MapPin size={18} style={{ color: 'var(--main-red)' }} />
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              Location: {realWeatherData?.locationName || 'Madukkarai'}
            </strong>
            <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              Condition: {realWeatherData?.weatherCondition || 'Clouds / Clear'} • UV Index: {realWeatherData?.uvIndex ?? 4} • Updated: {realWeatherData?.timestamp || 'Live Feed'}
            </small>
          </div>
        </div>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: '#FEF2F2', padding: '3px 8px', borderRadius: 4, color: 'var(--main-red)', border: '1px solid rgba(220,38,38,0.25)', fontWeight: 700 }}>
          Open-Meteo Climate Feed
        </span>
      </article>

      {/* Actual Place Leaflet Map */}
      <div style={{ marginBottom: 20 }}>
        <ClimatePlaceMap
          locationName={realWeatherData?.locationName || 'Madukkarai'}
          lat={realWeatherData?.latitude ?? 10.9038}
          lon={realWeatherData?.longitude ?? 76.9602}
          weatherCondition={realWeatherData?.weatherCondition || 'Clear / Clouds'}
          temp={telemetry.ambientTemp}
        />
      </div>

      {/* CLIMATE ↔ HUMAN PHYSIOLOGY INTERACTION ANALYSIS */}
      {false && (
      <article className="panel" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          CLIMATE ↔ HUMAN PHYSIOLOGY INTERACTION ANALYSIS
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
          AERIS evaluates ambient climate load against physiological response relative to your personal circadian baseline.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--yellow)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>ENVIRONMENTAL LOAD</span>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Ambient: {telemetry.ambientTemp}°C | Humidity: {telemetry.humidity}%
            </p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>WBGT Approx: {wbgt}°C</span>
          </div>

          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--main-red)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>PHYSIOLOGICAL RESPONSE</span>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Body Temp: {telemetry.bodyTemp}°C | HR: {telemetry.heartRate} BPM
            </p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Baseline: {baseline.restingHR} BPM / {baseline.tempBaseline}°C
            </span>
          </div>

          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--yellow)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>THERMAL STRAIN INDEX (PSI)</span>
            <p style={{ margin: '4px 0 0', fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>
              PSI {psi} / 9
            </p>
            <div style={{ marginTop: 4 }}>
              <RiskBadge level={psiBadgeLevel} score={psi} size="sm" />
            </div>
          </div>
        </div>

        {/* Correlation Insights */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Correlation Insights:</strong>
          {dailyAnalysis.trendInsights.map((insight, idx) => (
            <p key={idx} style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>• {insight}</p>
          ))}
        </div>
      </article>
      )}

      {/* Weather & External AQI Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        <article className="panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>☀️ Climate & Heat Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>🌡️ Ambient Temperature</span>
              <strong>{telemetry.ambientTemp.toFixed(1)} °C</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>💧 Relative Humidity</span>
              <strong>{telemetry.humidity} %</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>⏱️ Barometric Pressure</span>
              <strong>{telemetry.pressure} hPa</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>♨️ Wet-Bulb Globe Temp (WBGT)</span>
              <strong>{wbgt} °C</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>🌧️ Precipitation / Rain</span>
              <strong style={{ color: telemetry.rain ? 'var(--risk-critical)' : 'var(--risk-safe)' }}>
                {telemetry.rain ? 'Active Rain' : 'Dry'}
              </strong>
            </div>
          </div>
        </article>

        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>🌬️ External Air Quality (AQI)</h3>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--panel-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              OPEN-METEO FEED
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>🍃 Overall US AQI</span>
              <strong>{telemetry.externalAqi} ({telemetry.externalAqi <= 50 ? 'Good' : telemetry.externalAqi <= 100 ? 'Moderate' : 'Unhealthy'})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>🌫️ PM2.5 Concentration</span>
              <strong>{telemetry.pm25 !== null ? `${telemetry.pm25} µg/m³` : 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>💨 PM10 Concentration</span>
              <strong>{telemetry.pm10 !== null ? `${telemetry.pm10} µg/m³` : 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>🧪 Ozone (O₃)</span>
              <strong>{telemetry.o3 !== null ? `${telemetry.o3} µg/m³` : 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>⚠️ Nitrogen Dioxide (NO₂)</span>
              <strong>{telemetry.no2 !== null ? `${telemetry.no2} µg/m³` : 'N/A'}</strong>
            </div>
          </div>
          <small style={{ display: 'block', margin: '10px 0 0', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            * External AQI data is fetched via Open-Meteo Air Quality API.
          </small>
        </article>
      </div>
    </div>
  )
}
