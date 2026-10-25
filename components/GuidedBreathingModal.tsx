'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckCircle2, Pause, Play, RotateCcw, X } from 'lucide-react'

type Phase = 'Breathe in' | 'Hold' | 'Breathe out'

// Resonance pacing: 4s in, 4s hold, 6s out.
const PHASES: { name: Phase; seconds: number; scale: number }[] = [
  { name: 'Breathe in', seconds: 4, scale: 1 },
  { name: 'Hold', seconds: 4, scale: 1 },
  { name: 'Breathe out', seconds: 6, scale: 0.6 },
]

const LENGTHS = ['1', '2', '5'] as const
type Length = (typeof LENGTHS)[number]

interface GuidedBreathingProps {
  open: boolean
  onClose: () => void
  currentHR?: number
  currentHRV?: number
  currentStress?: number
}

/** Full-screen dark "cinema" sheet with a breathing circle. Text cues are always visible. */
export function GuidedBreathingModal({ open, onClose, currentHR = 76, currentStress = 38 }: GuidedBreathingProps) {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [minutes, setMinutes] = useState<Length>('2')
  const [secondsLeft, setSecondsLeft] = useState(120)
  const [running, setRunning] = useState(true)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [phaseLeft, setPhaseLeft] = useState(PHASES[0].seconds)
  const [cycles, setCycles] = useState(0)
  const startHr = useRef(currentHR)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  const reset = (mins: Length = minutes) => {
    setMinutes(mins)
    setSecondsLeft(Number(mins) * 60)
    setPhaseIndex(0)
    setPhaseLeft(PHASES[0].seconds)
    setCycles(0)
    setRunning(true)
    startHr.current = currentHR
  }

  useEffect(() => {
    if (!open) return
    reset()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const done = secondsLeft <= 0

  useEffect(() => {
    if (!open || !running || done) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
      setPhaseLeft((left) => {
        if (left > 1) return left - 1
        setPhaseIndex((i) => {
          const next = (i + 1) % PHASES.length
          if (next === 0) setCycles((c) => c + 1)
          return next
        })
        return 0
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [open, running, done])

  useEffect(() => {
    if (phaseLeft === 0) setPhaseLeft(PHASES[phaseIndex].seconds)
  }, [phaseLeft, phaseIndex])

  if (!mounted) return null
  const phase = PHASES[phaseIndex]

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="breathe-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[var(--z-dialog)] flex flex-col bg-[#07090D] text-white"
        >
          <div className="flex items-center justify-between px-5 pt-[calc(1rem+var(--sat))]">
            <h2 id="breathe-title" className="text-eyebrow font-medium text-white/60 uppercase">
              Guided breathing
            </h2>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="grid size-11 cursor-pointer place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
              <X className="size-5" />
            </button>
          </div>

          {!done ? (
            <div className="flex flex-1 flex-col items-center justify-center px-5">
              <div className="relative grid size-72 place-items-center md:size-96">
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(closest-side, rgb(96 165 250 / 0.35), rgb(96 165 250 / 0.04))' }}
                  initial={false}
                  animate={reduce ? { scale: 0.85 } : { scale: running ? phase.scale : undefined }}
                  transition={{ duration: phase.seconds, ease: phase.name === 'Hold' ? 'linear' : 'easeInOut' }}
                />
                <motion.div
                  aria-hidden
                  className="absolute inset-[12%] rounded-full border border-blue-300/30"
                  initial={false}
                  animate={reduce ? { scale: 0.85 } : { scale: running ? phase.scale : undefined }}
                  transition={{ duration: phase.seconds, ease: 'easeInOut' }}
                />
                <div className="relative text-center" aria-live="polite">
                  <p className="text-2xl font-medium">{phase.name}</p>
                  <p className="mt-1 font-mono text-5xl font-light text-blue-200 tabular-nums">{phaseLeft || phase.seconds}</p>
                </div>
              </div>

              <p className="mt-8 font-mono text-sm text-white/60 tabular-nums">
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} left · {cycles} {cycles === 1 ? 'cycle' : 'cycles'}
              </p>

              <div role="radiogroup" aria-label="Session length" className="mt-6 flex rounded-full border border-white/10 p-1">
                {LENGTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={minutes === m}
                    onClick={() => reset(m)}
                    className={`h-9 cursor-pointer rounded-full px-4 text-sm ${minutes === m ? 'bg-white text-[#07090D]' : 'text-white/70 hover:text-white'}`}
                  >
                    {m} min
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-2 pb-[calc(1.5rem+var(--sab))]">
                <button type="button" onClick={() => setRunning((r) => !r)} className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold hover:bg-white/15">
                  {running ? <Pause className="size-4" /> : <Play className="size-4" />} {running ? 'Pause' : 'Resume'}
                </button>
                <button type="button" onClick={() => reset()} className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold text-white/70 hover:text-white">
                  <RotateCcw className="size-4" /> Restart
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
              <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid size-20 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="size-10" aria-hidden />
              </motion.span>
              <p className="mt-5 text-2xl font-medium">Session complete</p>
              <p className="mt-1 text-white/60">
                {cycles} breathing cycles in {minutes} {minutes === '1' ? 'minute' : 'minutes'}.
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-2 text-left">
                {[
                  ['HR at start', startHr.current],
                  ['HR now', currentHR],
                  ['Stress', currentStress],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-2xl border border-white/10 px-4 py-3">
                    <dt className="text-[11px] text-white/50">{label}</dt>
                    <dd className="font-mono text-lg tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex gap-2">
                <button type="button" onClick={() => reset()} className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold">
                  <RotateCcw className="size-4" /> Again
                </button>
                <button type="button" onClick={onClose} className="h-12 cursor-pointer rounded-full bg-white px-6 text-sm font-semibold text-[#07090D]">
                  Done
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
