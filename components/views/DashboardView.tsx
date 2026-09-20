'use client'

import { useState } from 'react'
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  CloudSun,
  Construction,
  HeartPulse,
  ShieldAlert,
  Thermometer,
  User,
  Utensils,
  Zap,
  Loader2,
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
    scenario,
    setScenario,
    setActiveView,
    arduinoData,
    isHardwareConnected,
    transport,
    isSosActive,
    triggerSos,
    dismissSos,
    triggerNotificationPush,
  } = useTelemetry()

  const [scenarioTab, setScenarioTab] = useState<'everyday' | 'disaster'>('everyday')
  const [obstacleLoading, setObstacleLoading] = useState<boolean>(false)
  const [obstacleSent, setObstacleSent] = useState<boolean>(false)
  const [foodLoading, setFoodLoading] = useState<boolean>(false)
  const [foodSent, setFoodSent] = useState<boolean>(false)
  const [pushNotificationStatus, setPushNotificationStatus] = useState<string>('')

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

  const handleObstaclePush = async () => {
    try {
      setObstacleLoading(true)
      setPushNotificationStatus('Dispatching Obstacle Push Notification & Telegram Alert...')
      const data = await triggerNotificationPush({
        type: 'obstacle',
        title: '🚧 Field Obstacle & Path Blockage Reported',
        body: 'Field path obstacle / road obstruction detected. Tactical detour & clearance unit alerted.',
        vitals: {
          heartRate: currentHR,
          spo2: isArduinoActive ? (realSpo2 ?? telemetry.spo2) : telemetry.spo2,
          bodyTemp: telemetry.bodyTemp,
        },
        location: { lat: 10.903, lon: 76.955 },
      })
      setObstacleSent(true)
      setPushNotificationStatus(
        data?.success
          ? '✓ Obstacle push dispatched via Telegram!'
          : data?.smsStatus || 'Obstacle push active.'
      )
      setTimeout(() => setObstacleSent(false), 4000)
    } catch (e) {
      setPushNotificationStatus('Failed to send obstacle push: ' + String(e))
    } finally {
      setObstacleLoading(false)
      setTimeout(() => setPushNotificationStatus(''), 6000)
    }
  }

  const handleFoodRequirementPush = async () => {
    try {
      setFoodLoading(true)
      setPushNotificationStatus('Dispatching Food Requirement Notification & Telegram Alert...')
      const data = await triggerNotificationPush({
        type: 'food',
        title: '🍲 Emergency Ration & Food Requirement Reported',
        body: 'Emergency meal ration and potable water required. Relief team notified with live coordinates.',
        vitals: {
          heartRate: currentHR,
          spo2: isArduinoActive ? (realSpo2 ?? telemetry.spo2) : telemetry.spo2,
          bodyTemp: telemetry.bodyTemp,
        },
        location: { lat: 10.903, lon: 76.955 },
      })
      setFoodSent(true)
      setPushNotificationStatus(
        data?.success
          ? '✓ Food requirement alert dispatched via Telegram!'
          : data?.smsStatus || 'Food requirement push active.'
      )
      setTimeout(() => setFoodSent(false), 4000)
    } catch (e) {
      setPushNotificationStatus('Failed to send food requirement: ' + String(e))
    } finally {
      setFoodLoading(false)
      setTimeout(() => setPushNotificationStatus(''), 6000)
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
              ? `● LIVE HARDWARE (${transport.includes('WiFi') ? 'ESP8266 WIFI' : 'STREAM'}) ACTIVE • MAX30102 connected. Live BPM: ${realBpm ?? '--'}, SpO₂: ${realSpo2 ?? '--'}%`
              : '○ SIMULATION / DEMO MODE (HARDWARE OFFLINE) • All 5 risk modules active locally.'}
          </p>
        </div>

        {/* Action Buttons Cluster: Obstacle, Food, SOS */}
        <div className="w-full sm:w-auto grid grid-cols-1 sm:grid-cols-3 md:flex md:items-center gap-2.5">
          {/* Obstacle Push Button */}
          <button
            onClick={handleObstaclePush}
            disabled={obstacleLoading}
            title="Push field obstacle notice via Telegram to emergency responders"
            className="h-10 px-4 w-full md:w-auto md:min-w-[155px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs tracking-wide shadow-md shadow-amber-500/25 border border-amber-400 hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/40 active:scale-95 transition-all duration-150 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {obstacleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
            ) : obstacleSent ? (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            ) : (
              <Construction className="w-4 h-4 text-white shrink-0" />
            )}
            <span className="text-white truncate">{obstacleLoading ? 'Pushing...' : obstacleSent ? 'Sent to Telegram' : 'Obstacle Push'}</span>
          </button>

          {/* Food Requirement Button */}
          <button
            onClick={handleFoodRequirementPush}
            disabled={foodLoading}
            title="Push emergency food and ration requirement via Telegram"
            className="h-10 px-4 w-full md:w-auto md:min-w-[155px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-500/25 border border-emerald-400 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/40 active:scale-95 transition-all duration-150 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {foodLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
            ) : foodSent ? (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            ) : (
              <Utensils className="w-4 h-4 text-white shrink-0" />
            )}
            <span className="text-white truncate">{foodLoading ? 'Pushing...' : foodSent ? 'Sent to Telegram' : 'Food Requirement'}</span>
          </button>

          {/* Emergency SOS Action */}
          <button
            onClick={() => triggerSos('WEB')}
            className="relative h-10 px-4 w-full md:w-auto md:min-w-[155px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold tracking-wide text-xs shadow-[0_0_25px_rgba(239,68,68,0.5)] border border-red-500/80 hover:shadow-[0_0_35px_rgba(239,68,68,0.8)] hover:from-red-500 hover:to-rose-600 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {/* Live Pulsing Dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>

            <AlertOctagon className="w-4 h-4 text-white animate-pulse shrink-0" />
            <span className="truncate">EMERGENCY SOS</span>
          </button>
        </div>
      </div>

      {/* Twilio Push Notification Status Toast / Banner */}
      {pushNotificationStatus && (
        <div className="mb-4 p-3 rounded-xl bg-slate-900 text-white text-xs font-mono flex items-center justify-between gap-3 border border-slate-700 shadow-md">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{pushNotificationStatus}</span>
          </div>
          <button
            onClick={() => setPushNotificationStatus('')}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {false && (
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
      )}

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
      <section className="metrics-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* CARD 1: HEART RATE */}
        <article className="panel metric-card scroll-reveal scroll-reveal-delay-1 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between metric-top">
              <span className="icon-box red">
                <HeartPulse size={16} />
              </span>
              <span className="delta">
                {hrDev === 0 ? (
                  <span style={{ color: 'var(--risk-safe-text)' }}>Baseline</span>
                ) : hrDev > 0 ? (
                  <span style={{ color: 'var(--risk-critical-text)' }}>+{hrDev} BPM ({hrDevPct}%)</span>
                ) : (
                  <span style={{ color: 'var(--risk-safe-text)' }}>{hrDev} BPM ({hrDevPct}%)</span>
                )}
              </span>
            </div>
            <p className="eyebrow">Heart Rate {isArduinoActive ? `(${transport.includes('WiFi') ? 'WIFI LIVE' : 'LIVE'})` : ''}</p>
            <div className="flex items-baseline gap-1.5 mt-2 metric-value">
              <span>{isArduinoActive ? (realBpm !== null ? realBpm : '--') : telemetry.heartRate}</span>
              <small className="text-xs text-slate-500 font-semibold">BPM</small>
            </div>
          </div>
          <small className="mt-3 block" style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            Personal baseline: <strong className="text-slate-900">{baseline.restingHR} BPM</strong> (Target: {baseline.refRestingHRRange.min}–{baseline.refRestingHRRange.max})
          </small>
        </article>

        {/* CARD 2: BLOOD OXYGEN */}
        <article className="panel metric-card scroll-reveal scroll-reveal-delay-2 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between metric-top">
              <span className="icon-box red">
                <Activity size={16} />
              </span>
              <span className="delta">
                {isArduinoActive ? (
                  realSpo2 !== null ? (
                    realSpo2 >= 95 ? (
                      <span style={{ color: 'var(--risk-safe-text)' }}>Optimal</span>
                    ) : (
                      <span style={{ color: 'var(--risk-critical-text)' }}>Attention</span>
                    )
                  ) : isStabilizing ? (
                    <span style={{ color: 'var(--main-red)' }}>Stabilizing</span>
                  ) : (
                    <span style={{ color: 'var(--main-red)' }}>No Finger</span>
                  )
                ) : (
                  <span style={{ color: telemetry.spo2 >= 95 ? 'var(--risk-safe-text)' : 'var(--risk-critical-text)' }}>
                    {telemetry.spo2 >= 95 ? 'Optimal' : 'Monitored'}
                  </span>
                )}
              </span>
            </div>
            <p className="eyebrow">Blood Oxygen {isArduinoActive ? `(${transport.includes('WiFi') ? 'WIFI LIVE' : 'LIVE'})` : ''}</p>
            <div className="flex items-baseline gap-1.5 mt-2 metric-value">
              <span>{isArduinoActive ? (realSpo2 !== null ? realSpo2 : '--') : telemetry.spo2}</span>
              <small className="text-xs text-slate-500 font-semibold">%</small>
            </div>
          </div>
          <small className="mt-3 block" style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Personal baseline: <strong className="text-slate-900">98%</strong> (Target: 95–100%)</small>
        </article>

        {/* CARD 3: BODY TEMPERATURE */}
        <article className="panel metric-card scroll-reveal scroll-reveal-delay-3 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between metric-top">
              <span className="icon-box red">
                <Thermometer size={16} />
              </span>
              <span className="delta">
                {tempDev > 0 ? (
                  <span style={{ color: tempDev > 0.5 ? 'var(--risk-critical-text)' : 'var(--main-red)' }}>+{tempDev.toFixed(1)}°C</span>
                ) : (
                  <span style={{ color: 'var(--risk-safe-text)' }}>Optimal</span>
                )}
              </span>
            </div>
            <p className="eyebrow">Body Temperature</p>
            <div className="flex items-baseline gap-1.5 mt-2 metric-value">
              <span>{telemetry.bodyTemp.toFixed(1)}</span>
              <small className="text-xs text-slate-500 font-semibold">°C</small>
            </div>
          </div>
          <small className="mt-3 block" style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            Personal baseline: <strong className="text-slate-900">{baseline.tempBaseline}°C</strong> ({risks.tempAnomaly.detected ? 'Anomaly' : 'Stable'})
          </small>
        </article>

        {/* CARD 4: ENVIRONMENT */}
        <article className="panel metric-card scroll-reveal scroll-reveal-delay-4 flex flex-col justify-between h-full" onClick={() => setActiveView('Climate Health')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="flex items-center justify-between metric-top">
              <span className="icon-box red">
                <CloudSun size={16} />
              </span>
              <span className="delta" style={{ color: 'var(--text-secondary)' }}>{telemetry.rain ? 'Rain Active' : 'Dry'}</span>
            </div>
            <p className="eyebrow">Ambient Weather</p>
            <div className="flex items-baseline gap-1.5 mt-2 metric-value">
              <span>{telemetry.ambientTemp.toFixed(1)}</span>
              <small className="text-xs text-slate-500 font-semibold">°C / {telemetry.humidity}%</small>
            </div>
          </div>
          <small className="mt-3 block" style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>External AQI: <strong className="text-slate-900">{telemetry.externalAqi}</strong></small>
        </article>
      </section>

      {/* Main Intelligence Grid */}
      <section className="dashboard-grid w-full">
        {/* Risk Overview Panel */}
        <article className="panel risk-panel scroll-reveal w-full">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AERIS Fusion Engine</p>
              <h2>Composite Risk Index (CRI)</h2>
            </div>
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

        {/*
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

        </article>
        */}
      </section>

      {/*
      <section className="lower-grid">
        <article className="panel alerts-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Risk Rationale</p>
              <h2>Top Contributing Factors</h2>
            </div>
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
      */}

      {/* Non-Clinical Prototype Disclaimer */}
      <footer style={{ marginTop: 24, textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '12px 0' }}>
        * AERIS Risk Engine • Personal learned baseline evaluation • Non-clinical monitoring prototype
      </footer>
    </>
  )
}
