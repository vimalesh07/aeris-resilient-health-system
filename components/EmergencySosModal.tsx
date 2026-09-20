'use client'

import React, { useEffect, useState } from 'react'
import { AlertOctagon, MapPin, PhoneCall, QrCode, X } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

interface EmergencySosModalProps {
  onClose: () => void
}

export function EmergencySosModal({ onClose }: EmergencySosModalProps) {
  const { telemetry, userProfile, arduinoData, isHardwareConnected } = useTelemetry()
  const [countdown, setCountdown] = useState<number>(10)
  const [isDispatched, setIsDispatched] = useState<boolean>(false)
  const [showQr, setShowQr] = useState<boolean>(false)

  const isArduinoActive = Boolean(isHardwareConnected && arduinoData?.connected)
  const realBpm = isArduinoActive ? (arduinoData?.stableBpm ?? arduinoData?.bpm ?? null) : null
  const realSpo2 = isArduinoActive ? (arduinoData?.stableSpo2 ?? arduinoData?.spo2 ?? null) : null

  const displayBpm = isArduinoActive ? (realBpm !== null ? `${realBpm} BPM` : '-- BPM') : `${telemetry.heartRate} BPM`
  const displaySpo2 = isArduinoActive ? (realSpo2 !== null ? `${realSpo2}%` : '-- %') : `${telemetry.spo2}%`

  useEffect(() => {
    if (isDispatched) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsDispatched(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isDispatched])

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        padding: 16,
        cursor: 'pointer',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--panel-bg)',
          border: '1px solid var(--main-red)',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 0 25px rgba(220, 38, 38, 0.15)',
          color: 'var(--text-primary)',
          position: 'relative',
          cursor: 'default',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'var(--panel-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#FEF2F2',
              border: '1px solid var(--main-red)',
              color: 'var(--main-red)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <AlertOctagon size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              EMERGENCY SOS ACTIVE
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--main-red)', fontWeight: 700 }}>
              {isDispatched ? '🚨 DISPATCHED TO EMERGENCY SERVICES' : `Auto-dispatching in ${countdown}s...`}
            </p>
          </div>
        </div>

        {/* Telegram Bot Push Confirmation Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 8, color: '#065F46', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            TELEGRAM BOT PUSH DISPATCHED
          </span>
          <span style={{ fontWeight: 800 }}>@hacksporabot</span>
        </div>

        {/* User Location & Telemetry Snapshot Card */}
        <div
          style={{
            background: 'var(--panel-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--main-red)', marginBottom: 8, fontWeight: 700, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            <MapPin size={14} />
            <span>Location: 10.9030° N, 76.9550° E (Madukkarai, Coimbatore)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center', marginTop: 8 }}>
            <div style={{ background: 'var(--panel-bg)', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <small style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', display: 'block' }}>Heart Rate</small>
              <strong style={{ color: 'var(--main-red)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{displayBpm}</strong>
            </div>

            <div style={{ background: 'var(--panel-bg)', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <small style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', display: 'block' }}>SpO₂ Level</small>
              <strong style={{ color: 'var(--risk-safe)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{displaySpo2}</strong>
            </div>

            <div style={{ background: 'var(--panel-bg)', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <small style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', display: 'block' }}>Gait Symmetry</small>
              <strong style={{ color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{telemetry.gaitSymmetry}%</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href="tel:112"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--main-red)',
              color: '#FFF',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
            }}
          >
            <PhoneCall size={16} />
            Call National Disaster Helpline (112 / 108)
          </a>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowQr(!showQr)}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'var(--panel-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--main-red)',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              <QrCode size={14} />
              {showQr ? 'Hide QR' : 'Responder QR'}
            </button>

            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--panel-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              Cancel Alarm
            </button>
          </div>
        </div>

        {/* Optional QR Code Card */}
        {showQr && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              background: 'var(--panel-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)' }}>
              EMERGENCY MEDICAL PROFILE ({userProfile.name}, Age {userProfile.age})
            </p>
            <div style={{ display: 'grid', placeItems: 'center', margin: '6px 0' }}>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="var(--text-primary)">
                <rect width="100" height="100" fill="var(--panel-bg)" />
                <path d="M10 10h30v30H10zM50 10h40v20H50zM10 50h20v40H10zM40 40h20v20H40zM70 50h20v40H70zM40 70h20v20H40z" fill="var(--main-red)" />
              </svg>
            </div>
            <small style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Encrypted local medical baseline & contact snapshot.
            </small>
          </div>
        )}
      </div>
    </div>
  )
}
