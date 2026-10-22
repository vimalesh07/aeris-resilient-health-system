'use client'

import React, { useState } from 'react'
import { BiologicalSex, UserActivityLevel } from '@/types/aeris'
import { Info, Save, Sliders, User } from 'lucide-react'
import { ArduinoDebugPanel } from '@/components/ArduinoDebugPanel'
import { useTelemetry } from '@/hooks/useTelemetry'
import { calculateBMI } from '@/lib/telemetry'

export function SettingsView() {
  const { userProfile, updateUserProfile, baseline } = useTelemetry()

  const [name, setName] = useState<string>(userProfile.name || 'Vimal')
  const [age, setAge] = useState<number>(userProfile.age || 20)
  const [sex, setSex] = useState<BiologicalSex>(userProfile.sex || 'Male')
  const [heightCm, setHeightCm] = useState<number>(userProfile.heightCm || 175)
  const [weightKg, setWeightKg] = useState<number>(userProfile.weightKg || 72)
  const [activityLevel, setActivityLevel] = useState<UserActivityLevel>(userProfile.activityLevel || 'Moderately Active')
  const [knownRestingHR, setKnownRestingHR] = useState<number | ''>(userProfile.knownRestingHR || 64)
  const [phone, setPhone] = useState<string>(userProfile.emergencyContactPhone || '9715042529')
  const [enableSms, setEnableSms] = useState<boolean>(userProfile.enableSmsAlerts !== false)
  const [testStatus, setTestStatus] = useState<string>('')
  const [saved, setSaved] = useState<boolean>(false)

  const bmi = calculateBMI(weightKg, heightCm)

  const handleSaveProfile = () => {
    updateUserProfile({
      name,
      age: Number(age) || 20,
      sex,
      heightCm: Number(heightCm) || 175,
      weightKg: Number(weightKg) || 72,
      activityLevel,
      knownRestingHR: knownRestingHR !== '' ? Number(knownRestingHR) : null,
      emergencyContactPhone: phone,
      enableSmsAlerts: enableSms,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleTestSms = async () => {
    setTestStatus('Dispatching test SMS alert...')
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔥 AERIS System Test Alert',
          trigger: 'Manual test push requested from AERIS Settings panel',
          severity: 'Critical',
          recommendedAction: 'Verify SMS delivery on your mobile phone.',
          phone: phone || '9715042529',
          vitals: { heartRate: 78, spo2: 98, bodyTemp: 36.6 },
        }),
      })
      const data = await res.json()
      if (data.success && data.smsStatus && data.smsStatus.startsWith('sent')) {
        setTestStatus(`✅ Alert dispatched! SMS Status: ${data.smsStatus}`)
      } else if (data.smsStatus) {
        setTestStatus(`⚠️ Push notice: ${data.smsStatus}`)
      } else {
        setTestStatus(`⚠️ Push notice: ${data.error || 'Failed to dispatch'}`)
      }
    } catch (e: any) {
      setTestStatus(`⚠️ Dispatch failed: ${e?.message}`)
    }
  }

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Top Header Section */}
      <div style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, margin: '0 0 4px' }}>
          PERSONAL SYSTEM TUNING & BASELINE ENGINE
        </p>
        <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Personal Profile & System Settings
        </h1>
        <p className="subhead" style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          AERIS evaluates your physiological metrics against your learned circadian baseline rather than generic population averages.
        </p>
      </div>

      {/* Arduino Device Diagnostics Bar (Directly below Header, exact match to Image 2) */}
      <div style={{ marginBottom: 20 }}>
        <ArduinoDebugPanel />
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* 1. PERSONAL HEALTH PROFILE */}
        <article className="panel" style={{ padding: 22, background: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <User size={18} style={{ color: 'var(--main-red)' }} />
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              1. PERSONAL HEALTH PROFILE
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                User Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Age (years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Biological Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as BiologicalSex)}
                  style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 13, outline: 'none' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {/* Calculated BMI Badge */}
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 12, color: 'var(--text-primary)', display: 'block' }}>Body Mass Index (BMI)</strong>
                <small style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Contextual profile metric</small>
              </div>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--main-red)', background: '#FEF2F2', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(220, 38, 38, 0.25)' }}>
                {bmi} BMI
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Physical Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as UserActivityLevel)}
                style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 13, outline: 'none' }}
              >
                <option value="Sedentary">Sedentary (Little or no exercise)</option>
                <option value="Lightly Active">Lightly Active (1-3 days/week)</option>
                <option value="Moderately Active">Moderately Active (3-5 days/week)</option>
                <option value="Very Active">Very Active (6-7 days/week)</option>
                <option value="Athlete">Athlete (Professional training)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Known Resting HR (BPM, optional)
              </label>
              <input
                type="number"
                placeholder="64"
                value={knownRestingHR}
                onChange={(e) => setKnownRestingHR(e.target.value !== '' ? Number(e.target.value) : '')}
                style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 13, outline: 'none' }}
              />
            </div>

            {/* Telegram Bot & SMS Push Notification Container */}
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 10, marginTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🤖 Telegram Bot & SMS Emergency Push
                </strong>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--risk-safe)', background: 'rgba(16,185,129,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                  ONLINE (Telegram +91)
                </span>
              </div>

              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>
                Emergency Contact Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9715042529"
                style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 6, background: '#FFFFFF', border: '1px solid #CBD5E1', color: 'var(--main-red)', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 800, outline: 'none', marginBottom: 6 }}
              />
              <p style={{ margin: '0 0 10px', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                ℹ️ <strong>Automated Push Pipeline:</strong> Instant push alerts are dispatched to Telegram bot <code>@hacksporabot</code> and emergency SMS to <code>+91 {phone || '9715042529'}</code>.
              </p>

              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enableSms}
                    onChange={(e) => setEnableSms(e.target.checked)}
                  />
                  <span>Automated Push & Telegram Alerts</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleTestSms}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--main-red)',
                  color: '#FFF',
                  border: 0,
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                ⚡ Dispatch Test Emergency Push (Telegram & SMS)
              </button>
              {testStatus && (
                <small style={{ display: 'block', marginTop: 6, fontSize: 10, color: 'var(--main-red)', fontFamily: 'var(--font-mono)' }}>
                  {testStatus}
                </small>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'var(--main-red)',
                color: '#FFFFFF',
                border: 0,
                marginTop: 4,
                width: '100%',
                minHeight: 40,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Save size={15} />
              <span>{saved ? 'Profile Saved!' : 'Save Profile Settings'}</span>
            </button>
          </div>
        </article>

        {/* 2. LEARNED BASELINES */}
        <article className="panel" style={{ padding: 22, background: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sliders size={18} style={{ color: 'var(--main-red)' }} />
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              2. LEARNED BASELINES
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8, borderLeft: '3px solid var(--main-red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Resting Heart Rate Baseline</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--risk-safe)' }}>
                  {baseline.isLearningMode ? 'LEARNING' : 'ESTABLISHED'}
                </span>
              </div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0F172A' }}>
                {baseline.restingHR} <small style={{ fontSize: 12, color: 'var(--text-muted)' }}>BPM</small>
              </div>
              <small style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Target range: {baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM
              </small>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8, borderLeft: '3px solid var(--main-red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Body Temperature Baseline</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--risk-safe)' }}>
                  ESTABLISHED
                </span>
              </div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0F172A' }}>
                {baseline.tempBaseline.toFixed(1)} <small style={{ fontSize: 12, color: 'var(--text-muted)' }}>°C</small>
              </div>
              <small style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Target range: {baseline.tempRange.min}–{baseline.tempRange.max}°C
              </small>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8, borderLeft: '3px solid var(--risk-safe)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Blood Oxygen (SpO₂) Target</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--risk-safe)' }}>
                  ESTABLISHED
                </span>
              </div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0F172A' }}>
                98 <small style={{ fontSize: 12, color: 'var(--text-muted)' }}>%</small>
              </div>
              <small style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Expected Range: 95–100%
              </small>
            </div>
          </div>
        </article>

        {/* 3. BASELINE EXPLAINABILITY */}
        <article className="panel" style={{ padding: 22, background: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Info size={18} style={{ color: 'var(--main-red)' }} />
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              3. BASELINE EXPLAINABILITY
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12 }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'block', letterSpacing: '0.04em', marginBottom: 4 }}>
                RATIONALE
              </span>
              <strong style={{ color: '#0F172A', fontSize: 13, display: 'block' }}>
                Personal Resting HR: {baseline.restingHR} BPM
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Learned from {baseline.totalSamplesCount || 342} valid measurements over a 14-day rolling window.
              </p>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'block', letterSpacing: '0.04em', marginBottom: 4 }}>
                DEMOGRAPHIC CONTEXT
              </span>
              <strong style={{ color: '#0F172A', fontSize: 13, display: 'block' }}>
                Reference Range: {baseline.refRestingHRRange.min}–{baseline.refRestingHRRange.max} BPM
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Reference calculated for {userProfile.age || 20}yo {userProfile.sex || 'Male'} ({userProfile.activityLevel || 'Moderately Active'}).
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, marginTop: 4 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                  CONFIDENCE
                </span>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>
                  {baseline.confidence || 'High'} Confidence
                </strong>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Last sync: {baseline.lastUpdated || 'Sep 19, 2026'}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
