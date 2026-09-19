'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AlertOctagon, HeartPulse, PhoneCall, ShieldAlert, X, CheckCircle2 } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

interface HeartRateLimitSosPopupProps {
  thresholdBpm?: number
}

export function HeartRateLimitSosPopup({ thresholdBpm = 115 }: HeartRateLimitSosPopupProps) {
  const { telemetry, userProfile, setActiveView, isSosActive, scenario } = useTelemetry()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [secondsLeft, setSecondsLeft] = useState<number>(3)
  const [isCancelled, setIsCancelled] = useState<boolean>(false)
  const [isDispatched, setIsDispatched] = useState<boolean>(false)
  const [dispatchStatus, setDispatchStatus] = useState<string>('')
  const [waUrl, setWaUrl] = useState<string>('')

  const targetPhone = userProfile?.emergencyContactPhone || '7092796084'
  const isTriggeredRef = useRef<boolean>(false)
  const snoozedUntilRef = useRef<number>(0)

  // Detect when Heart Rate exceeds threshold BPM limit
  useEffect(() => {
    // If global SOS is already active or in disaster fall scenario, do not trigger separate tachycardia popup
    if (isSosActive || scenario === 'disaster_fall_sos') {
      if (isOpen) {
        setIsOpen(false)
        isTriggeredRef.current = false
      }
      return
    }

    const currentBpm = telemetry.heartRate
    const now = Date.now()

    if (currentBpm >= thresholdBpm && now > snoozedUntilRef.current) {
      if (!isTriggeredRef.current) {
        isTriggeredRef.current = true
        setIsOpen(true)
        setSecondsLeft(3)
        setIsCancelled(false)
        setIsDispatched(false)
        setDispatchStatus('')
        setWaUrl('')
      }
    } else if (currentBpm < thresholdBpm - 5) {
      isTriggeredRef.current = false
    }
  }, [telemetry.heartRate, thresholdBpm, isSosActive, scenario, isOpen])

  // 3-Second Precision Countdown Timer
  useEffect(() => {
    if (!isOpen || isCancelled || isDispatched) return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          triggerSosPush()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, isCancelled, isDispatched])

  // Trigger automated Twilio SMS Push
  const triggerSosPush = async () => {
    setIsDispatched(true)
    setDispatchStatus('Dispatching automated Twilio SMS SOS to +91 ' + targetPhone + '...')

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🚨 CRITICAL TACHYCARDIA SOS (HR ${telemetry.heartRate} BPM)`,
          trigger: `Heart rate exceeded maximum safe threshold (${telemetry.heartRate} BPM vs limit ${thresholdBpm} BPM). User did not halt operation within 3s popup window.`,
          severity: 'Critical',
          recommendedAction: 'IMMEDIATE DISPATCH: Contact user or dispatch emergency medical responder team.',
          phone: targetPhone,
          vitals: {
            heartRate: telemetry.heartRate,
            spo2: telemetry.spo2,
            bodyTemp: telemetry.bodyTemp,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        setDispatchStatus(`✅ EMERGENCY SMS DISPATCHED TO +91 ${targetPhone}`)
      } else {
        setDispatchStatus(`⚠️ Dispatch notice: ${data.error}`)
      }
    } catch (err: any) {
      setDispatchStatus(`⚠️ Network alert dispatch error: ${err?.message}`)
    } finally {
      // Snooze popup for 2 minutes and reset trigger lock so it doesn't loop infinitely
      snoozedUntilRef.current = Date.now() + 120000
      isTriggeredRef.current = false
      setTimeout(() => {
        setIsOpen(false)
      }, 2500)
    }
  }

  // Handle user manual cancellation / shutdown operation button
  const handleStopOperation = () => {
    setIsCancelled(true)
    setIsOpen(false)
    isTriggeredRef.current = false
    // Snooze popup for 60 seconds so user can stabilize
    snoozedUntilRef.current = Date.now() + 60000
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(8, 11, 16, 0.92)',
        backdropFilter: 'blur(12px)',
        padding: 16,
      }}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#11161D',
          border: '2px solid var(--main-red)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 25px 60px rgba(198, 40, 40, 0.5)',
          color: 'var(--text-primary)',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <button
          onClick={handleStopOperation}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'var(--panel-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
          aria-label="Close popup"
        >
          <X size={16} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--main-red)', marginBottom: 10 }}>
          <AlertOctagon size={22} className="animate-pulse" />
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            AUTOMATED CRITICAL VITAL OVERRIDE
          </span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 6px', color: '#FFF' }}>
          HEART RATE LIMIT EXCEEDED!
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
          Live Heart Rate reached <strong style={{ color: 'var(--main-red)' }}>{telemetry.heartRate} BPM</strong> (Limit: {thresholdBpm} BPM).
        </p>

        {/* 3-Second Giant Countdown Circle */}
        {!isDispatched ? (
          <div style={{ margin: '14px 0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: 'rgba(198, 40, 40, 0.15)',
                border: '3px solid var(--main-red)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(198, 40, 40, 0.4)',
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#FFF', lineHeight: 1 }}>
                {secondsLeft}
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--yellow)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                SECONDS
              </span>
            </div>

            <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--yellow)', margin: 0, fontWeight: 700 }}>
              Auto-pushing Twilio SMS to +91 {targetPhone} in {secondsLeft}s...
            </p>
          </div>
        ) : (
          /* Dispatched Status Report */
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 12, padding: 14, margin: '14px 0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--risk-safe)', fontWeight: 800, fontSize: 14 }}>
              <CheckCircle2 size={20} />
              {dispatchStatus}
            </div>
          </div>
        )}

        {/* Vitals Summary Card */}
        <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 12, marginBottom: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div>
            <small style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Heart Rate</small>
            <strong style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--main-red)' }}>{telemetry.heartRate} BPM</strong>
          </div>
          <div>
            <small style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>SpO₂ Level</small>
            <strong style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--risk-safe)' }}>{telemetry.spo2}%</strong>
          </div>
          <div>
            <small style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Body Temp</small>
            <strong style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--yellow)' }}>{telemetry.bodyTemp}°C</strong>
          </div>
        </div>

        {/* Primary Action Button: STOP OPERATION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleStopOperation}
            style={{
              width: '100%',
              minHeight: 48,
              padding: '12px 16px',
              background: 'var(--yellow)',
              color: '#080B10',
              border: 0,
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 14,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(255, 193, 7, 0.4)',
            }}
          >
            <ShieldAlert size={18} />
            <span>🛑 STOP OPERATION / CANCEL ALARM</span>
          </button>

          {isDispatched && (
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              Close Window
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
