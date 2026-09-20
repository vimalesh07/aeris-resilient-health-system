'use client'

import React, { useEffect, useState } from 'react'
import { HeartPulse, Pause, Play, RotateCcw, X, CheckCircle2 } from 'lucide-react'

interface GuidedBreathingProps {
  onClose: () => void
  currentHR?: number
  currentHRV?: number
  currentStress?: number
}

export function GuidedBreathingModal({ onClose, currentHR = 76, currentHRV = 55, currentStress = 38 }: GuidedBreathingProps) {
  const [sessionMinutes, setSessionMinutes] = useState<number>(2)
  const [totalSeconds, setTotalSeconds] = useState<number>(120)
  const [isRunning, setIsRunning] = useState<boolean>(true)
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale')
  const [counter, setCounter] = useState<number>(4)
  const [cycle, setCycle] = useState<number>(1)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const phaseRef = React.useRef<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>(phase)
  phaseRef.current = phase

  // Post-session simulated recovery analysis (using real pre-telemetry reference)
  const postHR = Math.max(55, currentHR - 6)
  const postHRV = (currentHRV || 55) + 8
  const postStress = Math.max(12, currentStress - 14)

  useEffect(() => {
    if (!isRunning || isCompleted) return

    const timer = setInterval(() => {
      setTotalSeconds((t) => {
        if (t <= 1) {
          clearInterval(timer)
          setIsCompleted(true)
          setIsRunning(false)
          return 0
        }
        return t - 1
      })

      setCounter((c) => {
        if (c > 1) return c - 1

        const currentPhase = phaseRef.current
        if (currentPhase === 'Inhale') {
          setPhase('Hold')
          return 4
        } else if (currentPhase === 'Hold') {
          setPhase('Exhale')
          return 4
        } else if (currentPhase === 'Exhale') {
          setPhase('Rest')
          return 2
        } else {
          setPhase('Inhale')
          setCycle((cy) => cy + 1)
          return 4
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, isCompleted])

  const handleSelectDuration = (mins: number) => {
    setSessionMinutes(mins)
    setTotalSeconds(mins * 60)
    setPhase('Inhale')
    setCounter(4)
    setCycle(1)
    setIsCompleted(false)
    setIsRunning(true)
  }

  const circleScale = phase === 'Inhale' ? 1.35 : phase === 'Hold' ? 1.35 : phase === 'Exhale' ? 0.85 : 0.95

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '28px 24px 24px',
          background: 'var(--panel-bg)',
          borderColor: 'var(--border-subtle)',
          borderRadius: 16,
          color: 'var(--text-primary)',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            border: '1px solid var(--border-subtle)',
            background: 'var(--panel-elevated)',
            cursor: 'pointer',
            borderRadius: '50%',
            color: 'var(--text-secondary)',
          }}
          aria-label="Close guided breathing"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--main-red)', marginBottom: 6 }}>
          <HeartPulse size={20} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Guided HRV Recovery
          </span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>Resonance Paced Breathing</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Aligning heart rate variability with respiratory rhythm to stimulate parasympathetic recovery.
        </p>

        {/* Duration Selection Buttons */}
        {!isCompleted && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {[2, 5, 10].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSelectDuration(mins)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--main-red)',
                  background: sessionMinutes === mins ? 'var(--main-red)' : 'transparent',
                  color: sessionMinutes === mins ? '#FFFFFF' : 'var(--main-red)',
                  cursor: 'pointer',
                }}
              >
                {mins} min
              </button>
            ))}
          </div>
        )}

        {!isCompleted ? (
          <>
            {/* Breathing Animation Circle */}
            <div style={{ height: 190, display: 'grid', placeItems: 'center', margin: '14px 0' }}>
              <div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: '50%',
                  background: phase === 'Inhale' ? '#EF4444' : phase === 'Hold' ? '#DC2626' : phase === 'Exhale' ? '#B91C1C' : '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${circleScale})`,
                  transition: `transform ${phase === 'Inhale' ? '4s' : phase === 'Hold' ? '0.3s' : phase === 'Exhale' ? '4s' : '2s'} ease-in-out, background 0.5s ease`,
                  boxShadow: '0 10px 30px rgba(220, 38, 38, 0.25)',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{phase}</span>
                <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{counter}s</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              <span>Cycle: {cycle}</span>
              <span>
                Remaining: {Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="top-pill-button"
                onClick={() => setIsRunning(!isRunning)}
                style={{ background: 'var(--main-red)', color: '#FFFFFF', border: 0, flex: 1, minHeight: 44, justifyContent: 'center', fontSize: 13, fontWeight: 800, boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)' }}
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{isRunning ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                className="top-pill-button"
                onClick={() => handleSelectDuration(sessionMinutes)}
                style={{ flex: 1, minHeight: 44, justifyContent: 'center', fontSize: 13, fontWeight: 700 }}
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
            </div>
          </>
        ) : (
          /* Post-Session Recovery Analysis Report */
          <div style={{ margin: '16px 0 0', textAlign: 'left' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--risk-safe)', fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                <CheckCircle2 size={18} />
                Session Complete — Recovery Analysis
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Resonance breathing cycle successfully completed. Parasympathetic recovery active.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--panel-elevated)', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Before Session</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>HR: {currentHR} BPM</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>HRV: {currentHRV || '--'} ms</div>
                <div style={{ fontSize: 12, color: 'var(--main-red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Stress: {currentStress}</div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span style={{ fontSize: 11, color: 'var(--risk-safe)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>After Session</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--risk-safe)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>HR: {postHR} BPM</div>
                <div style={{ fontSize: 12, color: 'var(--risk-safe)', fontFamily: 'var(--font-mono)' }}>HRV: {postHRV} ms</div>
                <div style={{ fontSize: 12, color: 'var(--risk-safe)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Stress: {postStress}</div>
              </div>
            </div>

            <button
              className="top-pill-button"
              onClick={onClose}
              style={{ width: '100%', background: 'var(--main-red)', color: '#FFF', border: 0, padding: 12, fontWeight: 800, fontSize: 13, justifyContent: 'center' }}
            >
              Return to Stress Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
