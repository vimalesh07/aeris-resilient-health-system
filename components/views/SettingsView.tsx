'use client'

import React, { useState } from 'react'
import { BiologicalSex, UserActivityLevel } from '@/types/aeris'
import { Info, Save, Sliders, User } from 'lucide-react'
import { ArduinoDebugPanel } from '@/components/ArduinoDebugPanel'
import { useTelemetry } from '@/hooks/useTelemetry'
import { calculateBMI } from '@/lib/telemetry'

export function SettingsView() {
  const { userProfile, updateUserProfile, baseline, isOffline, setIsOffline } = useTelemetry()

  const [name, setName] = useState<string>(userProfile.name)
  const [age, setAge] = useState<number>(userProfile.age)
  const [sex, setSex] = useState<BiologicalSex>(userProfile.sex)
  const [heightCm, setHeightCm] = useState<number>(userProfile.heightCm)
  const [weightKg, setWeightKg] = useState<number>(userProfile.weightKg)
  const [activityLevel, setActivityLevel] = useState<UserActivityLevel>(userProfile.activityLevel)
  const [knownRestingHR, setKnownRestingHR] = useState<number | ''>(userProfile.knownRestingHR || '')
  const [healthNotes, setHealthNotes] = useState<string>(userProfile.healthNotes || '')
  const [phone, setPhone] = useState<string>(userProfile.emergencyContactPhone || '7092796084')
  const [enableSms, setEnableSms] = useState<boolean>(userProfile.enableSmsAlerts !== false)
  const [enableWhatsapp, setEnableWhatsapp] = useState<boolean>(userProfile.enableWhatsappAlerts !== false)
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
      healthNotes,
      emergencyContactPhone: phone,
      enableSmsAlerts: enableSms,
      enableWhatsappAlerts: enableWhatsapp,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Personal System Tuning & Baseline Engine</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
          Personal Profile & System Settings
        </h1>
        <p className="subhead">
          AERIS evaluates your physiological metrics against your learned circadian baseline rather than generic population averages.
        </p>
      </div>

      {/* Arduino Hardware Developer Debug Console */}
      <ArduinoDebugPanel />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* SECTION 1: PERSONAL PROFILE */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <User size={18} style={{ color: 'var(--yellow)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>1. PERSONAL HEALTH PROFILE</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                User Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', minHeight: 40, borderRadius: 8, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
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
                  style={{ width: '100%', padding: '8px 12px', minHeight: 40, borderRadius: 8, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Biological Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as BiologicalSex)}
                  style={{ width: '100%', padding: '8px 12px', minHeight: 40, borderRadius: 8, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Unspecified</option>
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
                  style={{ width: '100%', padding: '8px 12px', minHeight: 40, borderRadius: 8, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
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
                  style={{ width: '100%', padding: '8px 12px', minHeight: 40, borderRadius: 8, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {/* Calculated BMI Badge */}
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Body Mass Index (BMI)</strong>
                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Contextual profile metric</small>
              </div>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--yellow)', background: 'rgba(255,193,7,0.12)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,193,7,0.25)' }}>
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
                style={{ width: '100%', padding: '8px 12px', minHeight: 40, borderRadius: 8, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
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
                placeholder="e.g. 64"
                value={knownRestingHR}
                onChange={(e) => setKnownRestingHR(e.target.value !== '' ? Number(e.target.value) : '')}
                style={{ width: '100%', padding: '8px 12px', minHeight: 40, borderRadius: 8, background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
              />
            </div>

            {/* Emergency Contact & Twilio SMS Push Settings */}
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 10, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📱 Twilio SMS Push Notification
                </strong>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--risk-safe)', background: 'rgba(16,185,129,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                  ACTIVE (+91)
                </span>
              </div>

              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>
                Emergency Contact Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="7092796084"
                style={{ width: '100%', padding: '8px 12px', minHeight: 38, borderRadius: 6, background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)', color: 'var(--yellow)', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 800, outline: 'none', marginBottom: 10 }}
              />

              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enableSms}
                    onChange={(e) => setEnableSms(e.target.checked)}
                  />
                  <span>Automated Twilio SMS Alert</span>
                </label>
              </div>

              <button
                type="button"
                onClick={async () => {
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
                        phone: phone || '7092796084',
                        vitals: { heartRate: 78, spo2: 98, bodyTemp: 36.6 },
                      }),
                    })
                    const data = await res.json()
                    if (data.success) {
                      setTestStatus(`✅ Alert dispatched! SMS Status: ${data.smsStatus}`)
                    } else {
                      setTestStatus(`⚠️ Push notice: ${data.error}`)
                    }
                  } catch (e: any) {
                    setTestStatus(`⚠️ Dispatch failed: ${e?.message}`)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '7px 12px',
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
                ⚡ Test Twilio SMS Push to +91 {phone || '7092796084'}
              </button>
              {testStatus && (
                <small style={{ display: 'block', marginTop: 6, fontSize: 10, color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>
                  {testStatus}
                </small>
              )}
            </div>

            <button
              onClick={handleSaveProfile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'var(--yellow)',
                color: '#080B10',
                border: 0,
                marginTop: 6,
                minHeight: 40,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Save size={15} />
              <span>{saved ? 'Profile Saved!' : 'Save Profile Settings'}</span>
            </button>
          </div>
        </article>

        {/* SECTION 2: LEARNED PERSONAL BASELINES */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Sliders size={18} style={{ color: 'var(--yellow)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>2. LEARNED BASELINES</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--main-red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Resting Heart Rate Baseline</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: baseline.isLearningMode ? 'var(--yellow)' : 'var(--risk-safe)' }}>
                  {baseline.isLearningMode ? 'LEARNING' : 'ESTABLISHED'}
                </span>
              </div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>
                {baseline.restingHR} <small style={{ fontSize: 12, color: 'var(--text-muted)' }}>BPM</small>
              </div>
              <small style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Target range: {baseline.restingHRRange.min}–{baseline.restingHRRange.max} BPM
              </small>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--yellow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Body Temperature Baseline</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--risk-safe)' }}>ESTABLISHED</span>
              </div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>
                {baseline.tempBaseline.toFixed(1)} <small style={{ fontSize: 12, color: 'var(--text-muted)' }}>°C</small>
              </div>
              <small style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Target range: {baseline.tempRange.min}–{baseline.tempRange.max}°C
              </small>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--risk-safe)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Blood Oxygen (SpO₂) Target</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--risk-safe)' }}>ESTABLISHED</span>
              </div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>
                98 <small style={{ fontSize: 12, color: 'var(--text-muted)' }}>%</small>
              </div>
              <small style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Expected Range: 95–100%</small>
            </div>
          </div>
        </article>

        {/* SECTION 3: BASELINE EXPLAINABILITY */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Info size={18} style={{ color: 'var(--yellow)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>3. BASELINE EXPLAINABILITY</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', display: 'block' }}>RATIONALE</span>
              <strong style={{ color: 'var(--text-primary)' }}>Personal Resting HR: {baseline.restingHR} BPM</strong>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Learned from <strong>{baseline.totalSamplesCount} valid measurements</strong> over a 14-day rolling window.
              </p>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', display: 'block' }}>DEMOGRAPHIC CONTEXT</span>
              <strong style={{ color: 'var(--text-primary)' }}>Reference Range: {baseline.refRestingHRRange.min}–{baseline.refRestingHRRange.max} BPM</strong>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Reference calculated for <strong>{userProfile.age}yo {userProfile.sex} ({userProfile.activityLevel})</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', display: 'block' }}>CONFIDENCE</span>
                <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{baseline.confidence} Confidence</strong>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Last sync: {baseline.lastUpdated}
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* System Settings & Offline Mode */}
      <article className="panel" style={{ padding: 18, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>System Privacy & Offline Mode</h3>
        <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 13, display: 'block', color: 'var(--text-primary)' }}>Offline Privacy Processing Mode</strong>
            <small style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Force 100% on-device local processing</small>
          </div>
          <input
            type="checkbox"
            checked={isOffline}
            onChange={() => setIsOffline(!isOffline)}
            style={{ width: 20, height: 20, accentColor: 'var(--yellow)', cursor: 'pointer' }}
          />
        </div>
      </article>
    </div>
  )
}
