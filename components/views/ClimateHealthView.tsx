'use client'

import React from 'react'
import { CloudRain, CloudSun, MapPin, RefreshCw, Thermometer, Wind } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function ClimateHealthView() {
  const {
    telemetry,
    risks,
    history,
    useRealWeather,
    setUseRealWeather,
    realWeatherData,
    fetchLiveWeather,
  } = useTelemetry()

  const heatState = risks.heat > 75 ? 'High Risk' : risks.heat > 50 ? 'Warning' : risks.heat > 30 ? 'Monitor' : 'Normal'

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Environmental Hazard & Climate Resilience</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>Climate Health & Weather Index</h1>
          <p className="subhead">
            Integrates BME280 sensor node data or <strong>Live External Weather & Climate API (Open-Meteo)</strong>.
          </p>
        </div>

        {/* Real Weather API Toggle Button */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="demo-toggle"
            onClick={() => setUseRealWeather(!useRealWeather)}
            style={{ background: useRealWeather ? 'var(--yellow)' : 'rgba(255,255,255,0.1)', color: useRealWeather ? '#171717' : '#FFF', border: 0, fontWeight: 800 }}
          >
            <CloudSun size={15} />
            <span>{useRealWeather ? 'Live External API Active' : 'Enable Real Weather API'}</span>
          </button>

          {useRealWeather && (
            <button className="icon-button" onClick={() => fetchLiveWeather()} title="Refresh live weather">
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Location / Weather Source Banner */}
      {useRealWeather && realWeatherData && (
        <article className="panel" style={{ padding: 16, marginBottom: 20, background: '#3B0000', borderColor: 'var(--yellow)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={20} style={{ color: 'var(--yellow)' }} />
            <div>
              <strong style={{ fontSize: 14, color: '#FFF' }}>Live Location: {realWeatherData.locationName}</strong>
              <small style={{ display: 'block', color: 'var(--yellow)', fontSize: 11 }}>
                Condition: {realWeatherData.weatherCondition} • UV Index: {realWeatherData.uvIndex} • Updated at {realWeatherData.timestamp}
              </small>
            </div>
          </div>
          <span style={{ fontSize: 10, font: "10px 'Geist Mono', monospace", background: 'rgba(255,193,7,0.2)', padding: '4px 8px', borderRadius: 4, color: 'var(--yellow)' }}>
            Open-Meteo Live Feed
          </span>
        </article>
      )}

      {/* Prototype Heat Risk Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20 }}>
        <article className="panel" style={{ padding: 24, background: '#FFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="icon-box red">
              <Thermometer size={20} />
            </span>
            <span className={`status-pill ${heatState === 'High Risk' ? 'red' : heatState === 'Warning' ? 'orange' : heatState === 'Monitor' ? 'yellow' : 'green'}`}>
              {heatState}
            </span>
          </div>

          <p className="eyebrow">Prototype Heat Strain Index</p>
          <div style={{ fontSize: 44, fontWeight: 900, color: '#171717', margin: '4px 0 8px' }}>
            {risks.heat} <small style={{ fontSize: 16, color: '#6B7280' }}>/ 100</small>
          </div>

          <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px' }}>
            {risks.heat > 50
              ? '"Heat strain indicators are elevated. Move to a cooler environment and maintain hydration."'
              : '"Environmental heat strain is within safe operational limits."'}
          </p>

          <span style={{ fontSize: 11, fontStyle: 'italic', color: '#6B7280' }}>
            * Prototype risk estimation based on ambient temp ({telemetry.ambientTemp}°C), humidity ({telemetry.humidity}%), body temp & HR.
          </span>
        </article>

        {/* Ambient Metrics Grid */}
        <article className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#171717' }}>
            {useRealWeather ? 'Real External Weather Metrics' : 'Live Environmental Telemetry'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#171717' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span>Ambient Temperature</span>
              <strong>{telemetry.ambientTemp.toFixed(1)} °C</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span>Relative Humidity</span>
              <strong>{telemetry.humidity} %</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span>Barometric Pressure</span>
              <strong>{telemetry.pressure} hPa</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span>Precipitation / Rain</span>
              <strong style={{ color: telemetry.rain ? 'var(--main-red)' : '#059669' }}>
                {telemetry.rain ? 'Active Precipitation' : 'Dry'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F3F4F6', padding: 8, borderRadius: 6 }}>
              <span>Air Quality Index</span>
              <strong>External AQI Data: {telemetry.externalAqi}</strong>
            </div>
          </div>
        </article>
      </div>

      {/* Barometric Pressure & Weather History */}
      <article className="panel" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#171717' }}>Barometric Pressure & Climate Trend</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB', color: '#6B7280', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Time</th>
                <th style={{ padding: '10px 12px' }}>Ambient Temp</th>
                <th style={{ padding: '10px 12px' }}>Humidity</th>
                <th style={{ padding: '10px 12px' }}>Pressure</th>
                <th style={{ padding: '10px 12px' }}>Heat Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-8).map((point, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', color: '#171717' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{point.time}</td>
                  <td style={{ padding: '10px 12px' }}>{point.ambientTemp} °C</td>
                  <td style={{ padding: '10px 12px' }}>{point.humidity} %</td>
                  <td style={{ padding: '10px 12px' }}>{1013 - idx * 2} hPa</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${point.heatRisk > 60 ? 'high' : 'medium'}`}>{point.heatRisk} / 100</span>
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
