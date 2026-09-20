'use client'

import React, { useState } from 'react'
import {
  Brain,
  ExternalLink,
  History,
  Music,
  Play,
  ShieldAlert,
  Waves,
} from 'lucide-react'
import { GuidedBreathingModal } from '@/components/GuidedBreathingModal'
import { HumanRiskVisualization } from '@/components/HumanRiskVisualization'
import { useTelemetry } from '@/hooks/useTelemetry'
import { RiskBadge } from '@/components/ui/RiskBadge'

export function StressWellbeingView() {
  const {
    telemetry,
    baseline,
    risks,
    sensors,
    history,
    realHistory,
    arduinoData,
    arduinoConnected,
  } = useTelemetry()

  const [showBreathing, setShowBreathing] = useState<boolean>(false)
  const [showPsychQuestionnaire, setShowPsychQuestionnaire] = useState<boolean>(false)

  // Psychological Questionnaire State (Stored Locally)
  const [psychAnswers, setPsychAnswers] = useState({
    perceivedStress: 2,
    mentalFatigue: 2,
    sleepQuality: 3,
    concentration: 2,
    anxiety: 2,
    overwhelm: 2,
    mood: 3,
    restSufficiency: 2,
  })

  const isArduinoActive = Boolean(arduinoConnected && arduinoData?.connected)
  const currentHR = isArduinoActive ? (arduinoData?.stableBpm ?? arduinoData?.bpm ?? telemetry.heartRate) : telemetry.heartRate
  const currentSpo2 = isArduinoActive ? (arduinoData?.stableSpo2 ?? arduinoData?.spo2 ?? telemetry.spo2) : telemetry.spo2
  const currentTemp = telemetry.bodyTemp

  // Connected Sensors Check
  const max30102Active = isArduinoActive || sensors.some((s) => s.id === 'max30102' && s.connected)
  const max30205Active = sensors.some((s) => s.id === 'max30205' && s.connected)
  const mpu6050Active = sensors.some((s) => s.id === 'mpu6050' && s.connected)

  // Activity & Exertion Context Classification
  const hrDevFromBaseline = currentHR - baseline.restingHR
  const isExercising = telemetry.activity === 'Active Motion' || telemetry.activity === 'Moderate Walking'
  
  const activityState = isExercising
    ? telemetry.activity
    : hrDevFromBaseline > 15
    ? 'Light Activity'
    : 'Sedentary'

  const movementLoad = isExercising ? 78 : Math.min(100, Math.max(10, (telemetry.steps / 10000) * 100))

  // Psychological Stress Score (0-100)
  const psychScore = Math.round(
    ((psychAnswers.perceivedStress * 20) +
      (psychAnswers.mentalFatigue * 18) +
      ((6 - psychAnswers.sleepQuality) * 15) +
      (psychAnswers.concentration * 14) +
      (psychAnswers.anxiety * 18) +
      (psychAnswers.overwhelm * 15)) /
      5
  )

  const psychStatusLabel = psychScore > 65 ? 'High Strain' : psychScore > 35 ? 'Moderate Strain' : 'Low Strain'

  // Physiological Stress Score (0-100)
  const rawPhysioScore = Math.min(
    100,
    Math.max(
      10,
      Math.round(
        Math.max(0, hrDevFromBaseline) * 1.5 +
          (telemetry.hrv !== null ? Math.max(0, 65 - telemetry.hrv) * 0.8 : 12) +
          Math.max(0, (currentTemp - baseline.tempBaseline) * 20)
      )
    )
  )

  const physioStressScore = isExercising ? Math.round(rawPhysioScore * 0.45) : rawPhysioScore

  // Climate × Stress Analysis (0-100)
  const climateLoadScore = Math.min(
    100,
    Math.round(
      Math.max(0, (telemetry.ambientTemp - 24) * 3) +
        Math.max(0, (telemetry.humidity - 50) * 0.6) +
        Math.max(0, (telemetry.externalAqi - 50) * 0.4)
    )
  )

  // Overall Composite AERIS Stress Index (0-100)
  const overallStressIndex = Math.min(
    100,
    Math.round(physioStressScore * 0.35 + psychScore * 0.35 + movementLoad * 0.15 + climateLoadScore * 0.15)
  )

  const stressStatus = overallStressIndex > 60 ? 'CRITICAL' : overallStressIndex > 30 ? 'WARNING' : 'SAFE'

  // Recovery Score (0-100)
  const recoveryScore = Math.max(10, Math.min(100, 100 - Math.round(overallStressIndex * 0.6 + (isExercising ? 20 : 0))))

  const activeHistoryPoints = realHistory.length > 0 ? realHistory : history

  return (
    <div style={{ paddingTop: 16 }}>
      {showBreathing && (
        <GuidedBreathingModal
          onClose={() => setShowBreathing(false)}
          currentHR={currentHR}
          currentHRV={telemetry.hrv ?? 55}
          currentStress={overallStressIndex}
        />
      )}

      {/* Header section */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Autonomic & Climate Strain Intelligence</p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Stress & Well-being
          </h1>
          <p className="subhead">
            Fusing live MAX30102 pulse telemetry, body temperature, movement context, self-assessment, and ambient climate load.
          </p>
        </div>

        {/* Hardware Status Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: max30102Active ? 'var(--risk-safe)' : 'var(--risk-critical)' }}>
            MAX30102: {max30102Active ? 'CONNECTED' : 'OFFLINE'}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: max30205Active ? 'var(--risk-safe)' : 'var(--text-muted)' }}>
            MAX30205: {max30205Active ? 'CONNECTED' : 'OFFLINE'}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: mpu6050Active ? 'var(--risk-safe)' : 'var(--text-muted)' }}>
            MPU6050: {mpu6050Active ? 'ACTIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Main Stress Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* CARD 1: AERIS Composite Stress Index */}
        <article className="panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="icon-box yellow">
              <Waves size={20} />
            </span>
            <RiskBadge level={stressStatus} score={overallStressIndex} size="md" />
          </div>

          <p className="eyebrow">AERIS Composite Stress Index</p>
          <div style={{ fontSize: 44, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 8px', lineHeight: 1 }}>
            {overallStressIndex} <small style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</small>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
            {isExercising
              ? 'Elevated heart rate is contextually recognized as physical exertion during activity, avoiding false distress interpretation.'
              : overallStressIndex <= 30
              ? 'Physiological strain indicators are optimal and strictly aligned with your learned personal baseline.'
              : 'Autonomic strain indicators suggest elevated physiological or psychological load relative to baseline.'}
          </p>

          {/* Sub-Score Breakdown Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: 'var(--text-secondary)' }}>
                <span>Physiological Strain (35%)</span>
                <strong style={{ color: 'var(--text-primary)' }}>{physioStressScore} / 100</strong>
              </div>
              <div style={{ background: 'var(--panel-elevated)', height: 5, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: physioStressScore + "%", height: '100%', background: 'var(--main-red)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: 'var(--text-secondary)' }}>
                <span>Psychological Self-Check (35%)</span>
                <strong style={{ color: 'var(--text-primary)' }}>{psychScore} / 100</strong>
              </div>
              <div style={{ background: 'var(--panel-elevated)', height: 5, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: psychScore + "%", height: '100%', background: 'var(--main-red)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: 'var(--text-secondary)' }}>
                <span>Activity & Exertion Load (15%)</span>
                <strong style={{ color: 'var(--text-primary)' }}>{movementLoad} / 100</strong>
              </div>
              <div style={{ background: 'var(--panel-elevated)', height: 5, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: movementLoad + "%", height: '100%', background: '#3B82F6' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: 'var(--text-secondary)' }}>
                <span>Climate Load Coincidence (15%)</span>
                <strong style={{ color: 'var(--text-primary)' }}>{climateLoadScore} / 100</strong>
              </div>
              <div style={{ background: 'var(--panel-elevated)', height: 5, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: climateLoadScore + "%", height: '100%', background: 'var(--risk-safe)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowBreathing(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--main-red)',
                color: '#FFFFFF',
                border: 0,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Play size={14} />
              <span>Launch Guided Breathing</span>
            </button>
            <button
              onClick={() => setShowPsychQuestionnaire(!showPsychQuestionnaire)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--panel-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Brain size={14} />
              <span>{showPsychQuestionnaire ? 'Hide Questionnaire' : 'Psychological Check'}</span>
            </button>
          </div>
        </article>

        {/* CARD 2: Interactive 3D Digital Twin Visualizer */}
        <article className="panel" style={{ padding: 16 }}>
          <HumanRiskVisualization
            risks={risks}
            compact
            currentBpm={currentHR}
            currentTemp={currentTemp}
            currentSpo2={currentSpo2}
            baselineHR={baseline.restingHR}
            baselineTemp={baseline.tempBaseline}
            mobilityStatus={activityState}
          />
        </article>
      </div>

      {/* PSYCHOLOGICAL CHECK QUESTIONNAIRE */}
      {showPsychQuestionnaire && (
        <article className="panel" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <p className="eyebrow">Subjective Assessment</p>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Psychological Well-being Check
              </h3>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--risk-safe)', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(16,185,129,0.3)' }}>
              LOCAL STORAGE ONLY
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, margin: '14px 0' }}>
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                1. Perceived Stress Level
              </label>
              <select
                value={psychAnswers.perceivedStress}
                onChange={(e) => setPsychAnswers({ ...psychAnswers, perceivedStress: Number(e.target.value) })}
                style={{ width: '100%', padding: 6, borderRadius: 6, background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
              >
                <option value={1}>1 — Not stressed</option>
                <option value={2}>2 — Slightly stressed</option>
                <option value={3}>3 — Moderately stressed</option>
                <option value={4}>4 — Very stressed</option>
                <option value={5}>5 — Extremely stressed</option>
              </select>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                2. Mental Fatigue
              </label>
              <select
                value={psychAnswers.mentalFatigue}
                onChange={(e) => setPsychAnswers({ ...psychAnswers, mentalFatigue: Number(e.target.value) })}
                style={{ width: '100%', padding: 6, borderRadius: 6, background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
              >
                <option value={1}>1 — Not tired</option>
                <option value={2}>2 — Slightly tired</option>
                <option value={3}>3 — Moderately tired</option>
                <option value={4}>4 — Very tired</option>
                <option value={5}>5 — Extremely tired</option>
              </select>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                3. Recent Sleep Quality
              </label>
              <select
                value={psychAnswers.sleepQuality}
                onChange={(e) => setPsychAnswers({ ...psychAnswers, sleepQuality: Number(e.target.value) })}
                style={{ width: '100%', padding: 6, borderRadius: 6, background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
              >
                <option value={5}>5 — Very well</option>
                <option value={4}>4 — Well</option>
                <option value={3}>3 — Average</option>
                <option value={2}>2 — Poor</option>
                <option value={1}>1 — Very poor</option>
              </select>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                4. Concentration Difficulty
              </label>
              <select
                value={psychAnswers.concentration}
                onChange={(e) => setPsychAnswers({ ...psychAnswers, concentration: Number(e.target.value) })}
                style={{ width: '100%', padding: 6, borderRadius: 6, background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
              >
                <option value={1}>1 — Very easy</option>
                <option value={2}>2 — Easy</option>
                <option value={3}>3 — Moderate</option>
                <option value={4}>4 — Difficult</option>
                <option value={5}>5 — Very difficult</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Calculated Score: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{psychScore} / 100 ({psychStatusLabel})</strong></span>
            <button className="top-pill-button" onClick={() => setShowPsychQuestionnaire(false)}>
              Save & Apply
            </button>
          </div>
        </article>
      )}

      {/* ACTIVITY & RECOVERY SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Activity Context Card */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Activity Context & Load</h3>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {activityState}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 12 }}>
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Movement Load</span>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>{movementLoad} <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100</small></div>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Step Count</span>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>{telemetry.steps.toLocaleString()}</div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {isExercising
              ? 'Physical motion active via MPU6050. Heart rate elevation classified as normal physical exertion.'
              : 'Physical movement is resting. Pulse variations reflect autonomic state.'}
          </p>
        </article>

        {/* Recovery Score Card */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Autonomic Recovery Index</h3>
            <RiskBadge level={recoveryScore >= 70 ? 'SAFE' : recoveryScore >= 45 ? 'MONITOR' : 'CRITICAL'} score={recoveryScore} size="sm" />
          </div>

          <div style={{ fontSize: 36, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 8px' }}>
            {recoveryScore} <small style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ 100</small>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Evaluated against learned resting HR ({baseline.restingHR} BPM) and circadian HRV target ({baseline.hrvBaseline} ms).
          </p>
        </article>
      </div>

      {/* TODAY STRESS TIMELINE & SPOTIFY MIND RESET */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Timeline */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Today Stress Timeline</h3>
            <History size={16} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeHistoryPoints.slice(-5).map((pt, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{pt.time}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>HR {pt.heartRate} BPM • SpO₂ {pt.spo2}%</span>
                <span style={{ color: pt.stress > 60 ? 'var(--risk-critical)' : 'var(--risk-safe)' }}>
                  {pt.stress > 60 ? 'High' : pt.stress > 30 ? 'Elevated' : 'Normal'} ({pt.stress})
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* SPOTIFY MIND RESET CARD */}
        <article className="panel" style={{ padding: 20, background: 'var(--panel-elevated)', border: '1px solid #1DB954' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Music size={20} style={{ color: '#1DB954' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>MIND RESET</h3>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
            Take a short break and listen to relaxing ambient or focus music to support parasympathetic recovery.
          </p>

          <a
            href="https://open.spotify.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#1DB954',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: 20,
              fontWeight: 800,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
            }}
          >
            <span>Open Spotify</span>
            <ExternalLink size={14} />
          </a>
        </article>
      </div>

      {/* Safety Notice */}
      <article className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ShieldAlert size={20} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong>Non-Diagnostic Safety Notice:</strong> AERIS Stress Intelligence monitors physiological strain indicators to promote guided recovery. It does not diagnose clinical anxiety or medical conditions.
          </p>
        </div>
      </article>
    </div>
  )
}
