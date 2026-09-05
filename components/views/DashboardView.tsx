'use client'

import React from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CloudSun,
  HeartPulse,
  MoreHorizontal,
  Navigation,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Thermometer,
  Waves,
  Zap,
} from 'lucide-react'
import { RiskGauge } from '@/components/RiskGauge'
import { SafePlaceFinder } from '@/components/SafePlaceFinder'
import { useTelemetry } from '@/hooks/useTelemetry'
import { Scenario } from '@/types/aeris'

const SCENARIOS: Scenario[] = ['Normal', 'Stress', 'Heat', 'Temperature Anomaly', 'Mobility', 'Monsoon']

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
}

export function DashboardView() {
  const {
    scenario,
    setScenario,
    isSimulationRunning,
    setIsSimulationRunning,
    telemetry,
    baseline,
    risks,
    alerts,
    sensors,
    setActiveView,
  } = useTelemetry()

  return (
    <>
      {/* Header section */}
      <div className="content-head">
        <div>
          <p className="eyebrow">Personal Health & Climate Resilience Intelligence</p>
          <h1>{getGreeting()}, Vimal.</h1>
          <p className="subhead">
            All 5 core Edge AI sensors active. Processing privacy-preserving health risks locally.
          </p>
        </div>

        <div className="head-actions">
          <button
            className={`demo-toggle ${isSimulationRunning ? 'on' : ''}`}
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
          >
            {isSimulationRunning ? <Pause size={15} /> : <Play size={15} />}
            {isSimulationRunning ? 'Pause simulation' : 'Run simulation'}
          </button>
        </div>
      </div>

      {/* Demo Scenario Pill Selector */}
      <div className="scenario-strip">
        <span>
          <Zap size={16} /> Demo Scenarios:
        </span>
        <div className="scenario-pills">
          {SCENARIOS.map((name) => (
            <button
              key={name}
              className={scenario === name ? 'selected' : ''}
              onClick={() => setScenario(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Top Vitals & Environmental Metrics Grid */}
      <section className="metrics-grid">
        <article className="panel metric-card" onClick={() => setActiveView('Vitals')} style={{ cursor: 'pointer' }}>
          <div className="metric-top">
            <span className="icon-box red">
              <HeartPulse size={18} />
            </span>
            <span className="delta">
              <ArrowUpRight size={13} />
              {telemetry.heartRate > baseline.restingHRRange.max ? `+${telemetry.heartRate - baseline.restingHRRange.max} BPM` : 'Optimal'}
            </span>
          </div>
          <p className="eyebrow">Heart Rate</p>
          <div className="metric-value">
            {telemetry.heartRate}
            <small>BPM</small>
          </div>
          <small style={{ color: '#6B7280', fontSize: 11 }}>Baseline: {baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM</small>
        </article>

        <article className="panel metric-card" onClick={() => setActiveView('Stress & Well-being')} style={{ cursor: 'pointer' }}>
          <div className="metric-top">
            <span className="icon-box yellow">
              <Waves size={18} />
            </span>
            <span className="delta">
              {telemetry.hrv < baseline.hrvRange.min ? 'Reduced' : 'Normal'}
            </span>
          </div>
          <p className="eyebrow">HRV (Physiological)</p>
          <div className="metric-value">
            {telemetry.hrv}
            <small>ms</small>
          </div>
          <small style={{ color: '#6B7280', fontSize: 11 }}>Baseline: {baseline.hrvRange.min}–{baseline.hrvRange.max} ms</small>
        </article>

        <article className="panel metric-card" onClick={() => setActiveView('Vitals')} style={{ cursor: 'pointer' }}>
          <div className="metric-top">
            <span className="icon-box red">
              <Thermometer size={18} />
            </span>
            <span className="delta">
              {telemetry.bodyTemp > baseline.tempRange.max ? `+${(telemetry.bodyTemp - baseline.tempBaseline).toFixed(1)}°C` : 'Stable'}
            </span>
          </div>
          <p className="eyebrow">Body Temperature</p>
          <div className="metric-value">
            {telemetry.bodyTemp.toFixed(1)}
            <small>°C</small>
          </div>
          <small style={{ color: '#6B7280', fontSize: 11 }}>Baseline: {baseline.tempRange.min}–{baseline.tempRange.max}°C</small>
        </article>

        <article className="panel metric-card" onClick={() => setActiveView('Climate Health')} style={{ cursor: 'pointer' }}>
          <div className="metric-top">
            <span className="icon-box dark">
              <CloudSun size={18} />
            </span>
            <span className="delta">{telemetry.rain ? 'Rain Active' : 'Dry'}</span>
          </div>
          <p className="eyebrow">Ambient Weather</p>
          <div className="metric-value">
            {telemetry.ambientTemp.toFixed(1)}
            <small>°C / {telemetry.humidity}%</small>
          </div>
          <small style={{ color: '#6B7280', fontSize: 11 }}>Pressure: {telemetry.pressure} hPa</small>
        </article>
      </section>

      {/* Main Intelligence Grid */}
      <section className="dashboard-grid">
        {/* Risk Overview Panel */}
        <article className="panel risk-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AERIS Edge Risk Engine</p>
              <h2>Health & Hazard Risk Score</h2>
            </div>
            <button className="text-button" onClick={() => setActiveView('Risk Intelligence')}>
              Details <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="risk-body">
            <RiskGauge risks={risks} />
            <div className="risk-copy">
              <span className={`status-pill ${risks.color}`}>{risks.statusLabel}</span>
              <h3>
                {risks.overall < 30
                  ? 'Your signals are balanced and within personal baseline.'
                  : risks.overall < 60
                  ? 'Elevated strain indicators detected in physiological or ambient signals.'
                  : 'Multiple signal anomalies detected. Review recommendations below.'}
              </h3>
              <p>
                Fused from physiological vitals, body temperature variance, motion gait symmetry, and local climate context.
                This is an early warning indicator, not a medical diagnosis.
              </p>

              {/* Emergency High Health Risk Callout */}
              {risks.overall >= 50 && (
                <div
                  style={{
                    margin: '12px 0',
                    padding: '10px 12px',
                    background: 'rgba(198, 40, 40, 0.25)',
                    border: '1px solid var(--main-red)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong style={{ color: '#FFF', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={15} style={{ color: 'var(--yellow)' }} />
                      ⚠️ High Health Risk Detected
                    </strong>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#FFF8F0' }}>
                      Find the nearest safe healthcare facility.
                    </p>
                  </div>
                  <button
                    className="demo-toggle on"
                    onClick={() => {
                      const el = document.getElementById('safe-place-finder-section')
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' })
                      } else {
                        setActiveView('Safe Places')
                      }
                    }}
                    style={{
                      fontSize: 12,
                      padding: '5px 10px',
                      background: 'var(--main-red)',
                      border: '1px solid var(--yellow)',
                      color: '#FFF',
                      fontWeight: 800,
                    }}
                  >
                    Find Safe Place
                  </button>
                </div>
              )}

              <button className="text-button" onClick={() => setActiveView('AI Companion')}>
                Ask AERIS Companion <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          <div className="contributors">
            <div>
              <span className={`contributor-dot ${risks.physiological > 50 ? 'red' : 'dark'}`} />
              Physiological <b>{risks.physiological}</b>
            </div>
            <div>
              <span className={`contributor-dot ${risks.stress > 50 ? 'yellow' : 'dark'}`} />
              Stress <b>{risks.stress}</b>
            </div>
            <div>
              <span className={`contributor-dot ${risks.heat > 50 ? 'red' : 'dark'}`} />
              Heat Strain <b>{risks.heat}</b>
            </div>
          </div>
        </article>

        {/* Hardware Sensors Panel */}
        <article className="panel sensor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Connected Prototype Hardware</p>
              <h2>Sensor Health</h2>
            </div>
            <span className="healthy">
              <CheckCircle2 size={14} /> 5 / 5 Connected
            </span>
          </div>

          <div className="sensor-list">
            {sensors.map((sensor) => (
              <div className="sensor-row" key={sensor.id}>
                <span className="sensor-icon yellow">
                  <Radio size={16} />
                </span>
                <div className="sensor-name">
                  <strong>{sensor.name} ({sensor.chip})</strong>
                  <small>{sensor.signals}</small>
                </div>
                <div className="sensor-bar">
                  <i style={{ width: `${sensor.signalQuality}%` }} />
                </div>
                <b>{sensor.signalQuality}%</b>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB', fontSize: 11, color: '#4B5563' }}>
            <span>External AQI Data: <b>{telemetry.externalAqi} (Good)</b></span>
            <button className="text-button" onClick={() => setActiveView('Privacy & Data')}>
              Privacy Architecture <ArrowUpRight size={14} />
            </button>
          </div>
        </article>
      </section>

      {/* Lower Grid: Alerts Queue & Personal Baseline */}
      <section className="lower-grid">
        <article className="panel alerts-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attention Queue</p>
              <h2>Active System Alerts ({alerts.length})</h2>
            </div>
            <button className="text-button" onClick={() => setActiveView('Alerts')}>
              Manage Queue <ArrowUpRight size={14} />
            </button>
          </div>

          {alerts.length === 0 ? (
            <p style={{ fontSize: 13, color: '#6B7280', margin: '20px 0' }}>All signals optimal. No active alerts.</p>
          ) : (
            alerts.slice(0, 2).map((alert) => (
              <div className="alert-row" key={alert.id}>
                <span className="sensor-icon red">
                  <AlertTriangle size={16} />
                </span>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong>{alert.title}</strong>
                    <span className={`badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                  </div>
                  <p>{alert.trigger}</p>
                  <small>
                    <b>Action:</b> {alert.recommendedAction}
                  </small>
                </div>
              </div>
            ))
          )}
        </article>

        <article className="panel baseline-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Personalized Baseline</p>
              <h2>7-Day Learned Range</h2>
            </div>
            <button className="text-button" onClick={() => setActiveView('Health History')}>
              History <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="baseline-chart" style={{ padding: '10px 0' }}>
            <div className="chart-label">
              <span>Resting Heart Rate Target</span>
              <b>
                {telemetry.heartRate} <small>BPM</small>
              </b>
            </div>
            <p style={{ fontSize: 12, color: '#4B5563', margin: '8px 0' }}>
              Baseline range: <strong>{baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM</strong>
            </p>
            <div style={{ background: '#F3F4F6', height: 10, borderRadius: 10, overflow: 'hidden', margin: '12px 0' }}>
              <div
                style={{
                  background: 'var(--main-red)',
                  height: '100%',
                  width: `${Math.min(100, Math.max(10, ((telemetry.heartRate - 50) / 60) * 100))}%`,
                  borderRadius: 10,
                }}
              />
            </div>
          </div>

          <div className="baseline-foot">
            <span style={{ color: telemetry.heartRate <= baseline.restingHRRange.max ? '#059669' : 'var(--main-red)' }}>
              <CheckCircle2 size={15} />
              {telemetry.heartRate <= baseline.restingHRRange.max ? 'Within target baseline' : 'Elevated from baseline'}
            </span>
            <button className="text-button" onClick={() => setActiveView('Settings')}>
              Tune Baseline <ArrowUpRight size={14} />
            </button>
          </div>
        </article>
      </section>

      {/* Safe Place Finder Section */}
      <section id="safe-place-finder-section" style={{ marginTop: 24 }}>
        <SafePlaceFinder />
      </section>
    </>
  )
}
