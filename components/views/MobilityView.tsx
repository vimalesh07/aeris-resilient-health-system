'use client'

import React from 'react'
import { Footprints, Navigation, ShieldCheck, Zap } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function MobilityView() {
  const { telemetry, baseline, risks } = useTelemetry()
  const mobilityScore = Math.max(5, 100 - risks.mobility)

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="eyebrow">Biomechanical Gait & Motion Intelligence</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>Mobility & Gait</h1>
        <p className="subhead">
          Tracking gait symmetry and movement variability using simulated MPU6050 6-axis IMU telemetry.
        </p>
      </div>

      {/* Main Score Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Mobility Score Card */}
        <article className="panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="icon-box yellow">
              <Navigation size={20} />
            </span>
            <span className="status-pill yellow">MPU6050</span>
          </div>
          <p className="eyebrow">Overall Mobility Score</p>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#171717', margin: '4px 0' }}>
            {mobilityScore} <small style={{ fontSize: 14, color: '#6B7280' }}>/ 100</small>
          </div>
          <p style={{ fontSize: 12, color: '#4B5563', margin: '8px 0' }}>
            {risks.mobility > 45
              ? 'Your movement pattern differs from your usual baseline.'
              : 'Gait mechanics and movement symmetry are optimal.'}
          </p>
        </article>

        {/* Gait Symmetry Card */}
        <article className="panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="icon-box red">
              <Footprints size={20} />
            </span>
            <span className="status-pill red">Gait Symmetry</span>
          </div>
          <p className="eyebrow">Left / Right Balance</p>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#171717', margin: '4px 0' }}>
            {telemetry.gaitSymmetry}%
          </div>
          <p style={{ fontSize: 12, color: '#4B5563', margin: '8px 0' }}>
            Baseline Target: <strong>{baseline.gaitSymmetryBaseline}%</strong>
          </p>
        </article>

        {/* Movement Variability Card */}
        <article className="panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="icon-box dark">
              <Zap size={20} />
            </span>
            <span className="status-pill dark">Variability</span>
          </div>
          <p className="eyebrow">Step Variability Index</p>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#171717', margin: '4px 0' }}>
            {telemetry.gaitVariability}%
          </div>
          <p style={{ fontSize: 12, color: '#4B5563', margin: '8px 0' }}>
            Baseline Target: <strong>{baseline.gaitVariabilityBaseline}%</strong>
          </p>
        </article>
      </div>

      {/* Detail Motion Metrics Table */}
      <article className="panel" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#171717' }}>Live IMU Motion Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 10 }}>
            <p className="eyebrow">Daily Step Count</p>
            <strong style={{ fontSize: 24, color: '#171717' }}>{telemetry.steps} steps</strong>
          </div>
          <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 10 }}>
            <p className="eyebrow">Walking Cadence</p>
            <strong style={{ fontSize: 24, color: '#171717' }}>{telemetry.cadence} steps/min</strong>
          </div>
          <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 10 }}>
            <p className="eyebrow">Walking Speed</p>
            <strong style={{ fontSize: 24, color: '#171717' }}>{telemetry.walkingSpeed} m/s</strong>
          </div>
          <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 10 }}>
            <p className="eyebrow">Active State</p>
            <strong style={{ fontSize: 24, color: '#171717' }}>{telemetry.activity}</strong>
          </div>
        </div>
      </article>

      {/* Safety Notice */}
      <article className="panel" style={{ padding: 18, background: '#FFF' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
          <strong>Non-Diagnostic Safety Wording:</strong> AERIS monitors movement variability and stride symmetry to assist early awareness of fatigue or temporary mobility changes. AERIS does not diagnose arthritis, joint diseases, or neurological disorders.
        </p>
      </article>
    </div>
  )
}
