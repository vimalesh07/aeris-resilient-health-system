'use client'

import React, { useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CloudSun,
  HeartPulse,
  Info,
  Radio,
  ShieldAlert,
  Thermometer,
  User,
  Zap,
} from 'lucide-react'
import { EmergencySosModal } from '@/components/EmergencySosModal'
import { HumanRiskVisualization } from '@/components/HumanRiskVisualization'
import { useTelemetry } from '@/hooks/useTelemetry'
import { Scenario } from '@/types/aeris'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
}

export function DashboardView() {
  const {
    userProfile,
    telemetry,
    baseline,
    risks,
    alerts,
    sensors,
    scenario,
    setScenario,
    setActiveView,
    arduinoData,
    isHardwareConnected,
    isSosActive,
    triggerSos,
    dismissSos,
  } = useTelemetry()

  const [scenarioTab, setScenarioTab] = useState<'everyday' | 'disaster'>('everyday')

  const connectedCount = sensors.filter((s) => s.connected).length
  const isArduinoActive = Boolean(isHardwareConnected && arduinoData?.connected)

  // Direct Live Values from Arduino COM3 (Null if no finger / stabilizing)
  const realBpm = arduinoData?.stableBpm ?? arduinoData?.bpm ?? null
  const realSpo2 = arduinoData?.stableSpo2 ?? arduinoData?.spo2 ?? null

  const isStabilizing = Boolean(isArduinoActive && arduinoData?.status === 'STABILIZING')

  const currentHR = isArduinoActive ? (realBpm !== null ? realBpm : telemetry.heartRate) : telemetry.heartRate
  const hrDev = currentHR - baseline.restingHR
  const hrDevPct = Number((((currentHR - baseline.restingHR) / Math.max(1, baseline.restingHR)) * 100).toFixed(1))

  const tempDev = Number((telemetry.bodyTemp - baseline.tempBaseline).toFixed(1))

  const EVERYDAY_SCENARIOS: { id: Scenario; label: string }[] = [
    { id: 'Normal', label: '🟢 Normal' },
    { id: 'Stress', label: '🟡 Stress' },
    { id: 'Heat', label: '🟠 Heat Strain' },
    { id: 'Temperature Anomaly', label: '🔴 Temp Anomaly' },
    { id: 'Mobility', label: '🏃 Mobility' },
    { id: 'Monsoon', label: '🌧️ Monsoon' },
  ]

  const DISASTER_SCENARIOS: { id: Scenario; label: string; desc: string }[] = [
    { id: 'disaster_heatwave', label: '🔥 Extreme Heatwave (44°C)', desc: 'Severe hyperthermia & WBGT heat crisis' },
    { id: 'disaster_flood', label: '🌊 Cyclone Surge (984 hPa)', desc: 'Cyclonic pressure drop & torrential flood' },
    { id: 'disaster_aqi_spike', label: '🌫️ AQI Crisis (395)', desc: 'Hazardous PM2.5 smog & SpO2 desaturation' },
    { id: 'disaster_fall_sos', label: '🚨 Fall / SOS Distress', desc: 'Sudden impact fall vector & panic tachycardia' },
  ]

  const handleScenarioClick = (s: Scenario) => {
    setScenario(s)
    if (s === 'disaster_fall_sos') {
      triggerSos('WEB')
    }
  }

  return (
    <>
      {/* Emergency SOS Action Button in Dashboard Header */}
      <div className="content-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p className="eyebrow">Personal Health & Climate Resilience Intelligence</p>
            {baseline.isLearningMode ? (
              <span
                style={{
                  background: 'rgba(255,193,7,0.12)',
                  color: 'var(--yellow)',
                  border: '1px solid rgba(255,193,7,0.3)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                BASELINE LEARNING MODE ({baseline.totalSamplesCount}/10 samples)
              </span>
            ) : (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--risk-safe)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                BASELINE STABLE ({baseline.restingHR} BPM)
              </span>
            )}
          </div>
          <h1 style={{ margin: '4px 0' }}>{getGreeting()}, {userProfile.name}.</h1>
          <p className="subhead">
            {isArduinoActive
              ? `● LIVE HARDWARE (COM3) ACTIVE • MAX30102 connected. Live BPM: ${realBpm ?? '--'}, SpO₂: ${realSpo2 ?? '--'}%`
              : '○ SIMULATION / DEMO MODE (HARDWARE OFFLINE) • All 5 risk modules active locally.'}
          </p>
        </div>

        {/* Emergency SOS Action */}
        <button
          onClick={() => triggerSos('WEB')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'var(--main-red)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#FFF',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(198,40,40,0.4)',
          }}
        >
          <AlertOctagon size={16} />
          EMERGENCY SOS
        </button>
      </div>

      {/* DUAL-MODE SCENARIO CONTROLLER STRIP */}
      <section className="scenario-strip">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', width: '100%', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={15} style={{ color: 'var(--yellow)' }} />
            <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>SCENARIO SIMULATION CONTROLLER</strong>
          </div>

          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--panel-elevated)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setScenarioTab('everyday')}
              style={{
                padding: '4px 12px',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: 6,
                border: 0,
                background: scenarioTab === 'everyday' ? 'var(--yellow)' : 'transparent',
                color: scenarioTab === 'everyday' ? '#080B10' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Everyday Companion
            </button>
            <button
              onClick={() => setScenarioTab('disaster')}
              style={{
                padding: '4px 12px',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: 6,
                border: 0,
                background: scenarioTab === 'disaster' ? 'var(--main-red)' : 'transparent',
                color: scenarioTab === 'disaster' ? '#FFF' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Disaster Shield
            </button>
          </div>
        </div>

        {/* Scenario Pills */}
        <div className="scenario-pills">
          {scenarioTab === 'everyday'
            ? EVERYDAY_SCENARIOS.map((item) => (
                <button
                  key={item.id}
                  className={scenario === item.id ? 'selected' : ''}
                  onClick={() => handleScenarioClick(item.id)}
                >
                  {item.label}
                </button>
              ))
            : DISASTER_SCENARIOS.map((item) => (
                <button
                  key={item.id}
                  className={scenario === item.id ? 'selected' : ''}
                  onClick={() => handleScenarioClick(item.id)}
                  style={{
                    background: scenario === item.id ? 'var(--main-red)' : 'var(--panel-elevated)',
                    borderColor: scenario === item.id ? 'var(--yellow)' : 'var(--border-subtle)',
                    color: scenario === item.id ? '#FFF' : 'var(--text-secondary)',
                  }}
                  title={item.desc}
                >
                  {item.label}
                </button>
              ))}
        </div>
      </section>

      {/* Single-Domain Critical Override Banner */}
      {risks.criticalOverride && (
        <article
          style={{
            margin: '0 0 16px',
            padding: '12px 16px',
            background: 'rgba(198, 40, 40, 0.15)',
            border: '1px solid var(--main-red)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={22} style={{ color: 'var(--main-red)' }} />
            <div>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>CRITICAL OVERRIDE ACTIVE</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{risks.overrideReason}</p>
            </div>
          </div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--main-red)', background: 'rgba(198,40,40,0.2)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(198,40,40,0.4)' }}>
            CRITICAL TIER
          </span>
        </article>
      )}

      {/* Primary Vitals Grid */}
      <section className="metrics-grid">
        {/* CARD 1: HEART RATE */}
        <article className="panel metric-card" onClick={() => setActiveView('Vitals')} style={{ cursor: 'pointer' }}>
          <div className="metric-top">
            <span className="icon-box red">
              <HeartPulse size={16} />
            </span>
            <span className="delta">
              {hrDev === 0 ? (
                <span style={{ color: 'var(--risk-safe)' }}>Baseline</span>
              ) : hrDev > 0 ? (
                <span style={{ color: 'var(--main-red)' }}>+{hrDev} BPM ({hrDevPct}%)</span>
              ) : (
                <span style={{ color: 'var(--risk-safe)' }}>{hrDev} BPM ({hrDevPct}%)</span>
              )}
            </span>
          </div>
          <p className="eyebrow">Heart Rate {isArduinoActive ? '(COM3 LIVE)' : ''}</p>
          <div className="metric-value">
            {isArduinoActive ? (realBpm !== null ? realBpm : '--') : telemetry.heartRate}
            <small>BPM</small>
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            Personal baseline: <strong>{baseline.restingHR} BPM</strong> (Target: {baseline.refRestingHRRange.min}–{baseline.refRestingHRRange.max})
          </small>
        </article>

        {/* CARD 2: BLOOD OXYGEN */}
        <article className="panel metric-card" onClick={() => setActiveView('Vitals')} style={{ cursor: 'pointer' }}>
          <div className="metric-top">
            <span className="icon-box yellow">
              <Activity size={16} />
            </span>
            <span className="delta">
              {isArduinoActive ? (
                realSpo2 !== null ? (
                  realSpo2 >= 95 ? (
                    <span style={{ color: 'var(--risk-safe)' }}>Optimal</span>
                  ) : (
                    <span style={{ color: 'var(--main-red)' }}>Attention</span>
                  )
                ) : isStabilizing ? (
                  <span style={{ color: 'var(--yellow)' }}>Stabilizing</span>
                ) : (
                  <span style={{ color: 'var(--yellow)' }}>No Finger</span>
                )
              ) : (
                <span style={{ color: telemetry.spo2 >= 95 ? 'var(--risk-safe)' : 'var(--main-red)' }}>
                  {telemetry.spo2 >= 95 ? 'Optimal' : 'Monitored'}
                </span>
              )}
            </span>
          </div>
          <p className="eyebrow">Blood Oxygen {isArduinoActive ? '(COM3 LIVE)' : ''}</p>
          <div className="metric-value">
            {isArduinoActive ? (realSpo2 !== null ? realSpo2 : '--') : telemetry.spo2}
            <small>%</small>
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Personal baseline: 98% (Target: 95–100%)</small>
        </article>

        {/* CARD 3: BODY TEMPERATURE */}
        <article className="panel metric-card" onClick={() => setActiveView('Vitals')} style={{ cursor: 'pointer' }}>
          <div className="metric-top">
            <span className="icon-box red">
              <Thermometer size={16} />
            </span>
            <span className="delta">
              {tempDev > 0 ? (
                <span style={{ color: tempDev > 0.5 ? 'var(--main-red)' : 'var(--yellow)' }}>+{tempDev.toFixed(1)}°C</span>
              ) : (
                <span style={{ color: 'var(--risk-safe)' }}>Optimal</span>
              )}
            </span>
          </div>
          <p className="eyebrow">Body Temperature</p>
          <div className="metric-value">
            {telemetry.bodyTemp.toFixed(1)}
            <small>°C</small>
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            Personal baseline: <strong>{baseline.tempBaseline}°C</strong> ({risks.tempAnomaly.detected ? 'Anomaly' : 'Stable'})
          </small>
        </article>

        {/* CARD 4: ENVIRONMENT */}
        <article className="panel metric-card" onClick={() => setActiveView('Climate Health')} style={{ cursor: 'pointer' }}>
          <div className="metric-top">
            <span className="icon-box dark">
              <CloudSun size={16} />
            </span>
            <span className="delta" style={{ color: 'var(--text-secondary)' }}>{telemetry.rain ? 'Rain Active' : 'Dry'}</span>
          </div>
          <p className="eyebrow">Ambient Weather</p>
          <div className="metric-value">
            {telemetry.ambientTemp.toFixed(1)}
            <small>°C / {telemetry.humidity}%</small>
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>External AQI: {telemetry.externalAqi}</small>
        </article>
      </section>

      {/* Main Intelligence Grid */}
      <section className="dashboard-grid">
        {/* Risk Overview Panel */}
        <article className="panel risk-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AERIS Fusion Engine</p>
              <h2>Composite Risk Index (CRI)</h2>
            </div>
            <button className="text-button" onClick={() => setActiveView('Risk Intelligence')}>
              Full Analysis <ArrowUpRight size={14} />
            </button>
          </div>

          {/* User Profile Context Badge */}
          <div
            style={{
              margin: '4px 0 14px',
              padding: '6px 12px',
              background: 'var(--panel-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <User size={14} style={{ color: 'var(--yellow)' }} />
            <span>
              Profile Context: <strong>{userProfile.age} yrs</strong> • <strong>{userProfile.sex}</strong> • <strong>{userProfile.weightKg} kg ({userProfile.heightCm} cm)</strong> • <strong>{userProfile.activityLevel}</strong>
            </span>
          </div>

          <HumanRiskVisualization
            risks={risks}
            currentBpm={currentHR}
            currentTemp={telemetry.bodyTemp}
            currentSpo2={isArduinoActive ? (realSpo2 !== null ? realSpo2 : telemetry.spo2) : telemetry.spo2}
            baselineHR={baseline.restingHR}
            baselineTemp={baseline.tempBaseline}
            mobilityStatus={scenario === 'disaster_fall_sos' ? 'FALL IMPACT DETECTED' : 'Normal'}
            onAiClick={() => setActiveView('AI Companion')}
          >
            {/* Climate ↔ Physiology Insight Callout */}
            {risks.climateBodyAnalysis.length > 0 && (
              <div
                style={{
                  margin: '10px 0',
                  padding: '8px 12px',
                  background: 'rgba(255,193,7,0.1)',
                  borderLeft: '3px solid var(--yellow)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}
              >
                <strong style={{ color: 'var(--yellow)' }}>Climate ↔ Body Interaction:</strong>
                <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{risks.climateBodyAnalysis[0]}</p>
              </div>
            )}
          </HumanRiskVisualization>
        </article>

        {/* Hardware Sensors Panel */}
        <article className="panel sensor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Connected Hardware Node</p>
              <h2>Sensor Health</h2>
            </div>
            <span className="healthy">
              ● {connectedCount} of 5 online
            </span>
          </div>

          <div className="sensor-list">
            {sensors.map((sensor) => (
              <div className="sensor-row" key={sensor.id}>
                <span className={`sensor-icon ${sensor.connected ? 'green' : 'dark'}`}>
                  <Radio size={15} />
                </span>
                <div className="sensor-name">
                  <strong>{sensor.name} ({sensor.chip})</strong>
                  <small>{sensor.signals}</small>
                </div>
                <div className="sensor-bar">
                  <i
                    style={{ width: `${sensor.signalQuality}%` }}
                    className={sensor.connected ? '' : 'red'}
                  />
                </div>
                <b>{sensor.signalQuality}%</b>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)' }}>
            <span>External AQI Feed: <b>US AQI {telemetry.externalAqi}</b></span>
            <button className="text-button" onClick={() => setActiveView('Device Diagnostics')}>
              COM3 Console <ArrowUpRight size={14} />
            </button>
          </div>
        </article>
      </section>

      {/* Lower Grid: Top Risk Factors & Personalized Baseline */}
      <section className="lower-grid">
        <article className="panel alerts-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Risk Rationale</p>
              <h2>Top Contributing Factors</h2>
            </div>
            <button className="text-button" onClick={() => setActiveView('Alerts')}>
              Alert Queue ({alerts.length}) <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0' }}>
            {risks.explanations.map((exp, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 12px',
                  background: 'var(--panel-elevated)',
                  borderRadius: 8,
                  borderLeft: '3px solid var(--main-red)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                }}
              >
                <Info size={15} style={{ color: 'var(--main-red)', flexShrink: 0, marginTop: 2 }} />
                <span>{exp}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel baseline-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Personalized Baseline</p>
              <h2>Circadian Learned Range</h2>
            </div>
            <button className="text-button" onClick={() => setActiveView('Health History')}>
              History <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="baseline-chart" style={{ padding: '10px 0' }}>
            <div className="chart-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Resting HR Personal Baseline</span>
              <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {currentHR} <small style={{ color: 'var(--text-muted)' }}>BPM</small>
              </b>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '8px 0' }}>
              Personal Learned Baseline: <strong style={{ color: 'var(--text-primary)' }}>{baseline.restingHR} BPM</strong> (Target: {baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM)
            </p>
            <div style={{ background: 'var(--panel-elevated)', height: 8, borderRadius: 6, overflow: 'hidden', margin: '12px 0', border: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  background: 'var(--yellow)',
                  height: '100%',
                  width: `${Math.min(100, Math.max(10, ((currentHR - 40) / 60) * 100))}%`,
                  borderRadius: 6,
                }}
              />
            </div>
          </div>

          <div className="baseline-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: Math.abs(hrDev) <= 8 ? 'var(--risk-safe)' : 'var(--main-red)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} />
              {Math.abs(hrDev) <= 8 ? 'Near personal baseline' : `Elevated +${hrDev} BPM from baseline`}
            </span>
            <button className="text-button" onClick={() => setActiveView('Settings')}>
              Tune Baseline <ArrowUpRight size={14} />
            </button>
          </div>
        </article>
      </section>

      {/* Non-Clinical Prototype Disclaimer */}
      <footer style={{ marginTop: 24, textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '12px 0' }}>
        * AERIS Risk Engine • Personal learned baseline evaluation • Non-clinical monitoring prototype
      </footer>
    </>
  )
}
