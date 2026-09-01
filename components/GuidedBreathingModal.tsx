'use client'

import React, { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, X, HeartPulse } from 'lucide-react'

export function GuidedBreathingModal({ onClose }: { onClose: () => void }) {
  const [isRunning, setIsRunning] = useState<boolean>(true)
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale')
  const [counter, setCounter] = useState<number>(4)
  const [cycle, setCycle] = useState<number>(1)
  const [totalSeconds, setTotalSeconds] = useState<number>(120)

  useEffect(() => {
    if (!isRunning || totalSeconds <= 0) return

    const timer = setInterval(() => {
      setTotalSeconds((t) => t - 1)
      setCounter((c) => {
        if (c > 1) return c - 1

        if (phase === 'Inhale') {
          setPhase('Hold')
          return 4
        } else if (phase === 'Hold') {
          setPhase('Exhale')
          return 6
        } else {
          setPhase('Inhale')
          setCycle((cy) => cy + 1)
          return 4
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, phase, totalSeconds])

  const circleScale = phase === 'Inhale' ? 1.35 : phase === 'Hold' ? 1.35 : 0.85

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.85)',
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
          maxWidth: 440,
          padding: '28px 20px 24px',
          background: '#FFF',
          borderRadius: 20,
          color: '#171717',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: '50%',
          }}
          aria-label="Close guided breathing"
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--main-red)', marginBottom: 8 }}>
          <HeartPulse size={20} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Guided HRV Recovery
          </span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 6px', color: '#171717' }}>Paced Resonance Breathing</h2>
        <p style={{ fontSize: 12, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
          Aligning heart rate variability with respiration to lower autonomic physiological stress.
        </p>

        {/* Breathing Animation Circle */}
        <div style={{ height: 200, display: 'grid', placeItems: 'center', margin: '20px 0' }}>
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: '50%',
              background: phase === 'Inhale' ? 'var(--yellow)' : phase === 'Hold' ? 'var(--bright-yellow)' : 'var(--main-red)',
              color: phase === 'Exhale' ? '#FFF' : '#171717',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${circleScale})`,
              transition: `transform ${phase === 'Inhale' ? '4s' : phase === 'Hold' ? '0.3s' : '6s'} ease-in-out, background 0.5s ease`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 900 }}>{phase}</span>
            <span style={{ fontSize: 30, fontWeight: 900 }}>{counter}s</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 12, color: '#4B5563', marginBottom: 20, fontWeight: 700 }}>
          <span>Cycle: {cycle}</span>
          <span>
            Remaining: {Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            className="demo-toggle"
            onClick={() => setIsRunning(!isRunning)}
            style={{ background: 'var(--yellow)', color: '#171717', border: 0, flex: 1, minHeight: 44, justifyContent: 'center' }}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            className="outline-button"
            onClick={() => {
              setTotalSeconds(120)
              setPhase('Inhale')
              setCounter(4)
              setCycle(1)
            }}
            style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  )
}
