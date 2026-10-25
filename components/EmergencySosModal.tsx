'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Check, HeartPulse, Loader2, MapPin, PhoneCall, Send, Thermometer, Wind } from 'lucide-react'
import { SOS_COUNTDOWN_SECONDS, useTelemetry } from '@/hooks/useTelemetry'

const R = 54
const C = 2 * Math.PI * R
const ANNOUNCE_AT = new Set([10, 5, 3, 2, 1])

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration is optional.
  }
}

/**
 * Full-screen SOS takeover.
 * Rule: actions are focused and tappable at 0ms — animation decorates the
 * countdown, it never gates it. The ring depletes linearly so time reads honestly.
 */
export function EmergencySosModal() {
  const { sosPhase, sosCountdown, sosSource, sosDispatchStatus, sendSosNow, dismissSos, telemetry, location, userProfile } = useTelemetry()
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [sentAt, setSentAt] = useState<string | null>(null)

  const open = sosPhase !== 'idle'
  const counting = sosPhase === 'countdown'
  const ring = useMotionValue(1)
  const dashOffset = useTransform(ring, (v) => C * (1 - v))

  useEffect(() => setMounted(true), [])

  // Linear depletion from the moment the countdown opens (1s steps for reduced motion)
  useEffect(() => {
    if (!counting) return
    if (reduce) {
      ring.set(sosCountdown / SOS_COUNTDOWN_SECONDS)
      return
    }
    if (sosCountdown === SOS_COUNTDOWN_SECONDS) {
      ring.set(1)
      const c = animate(ring, 0, { duration: SOS_COUNTDOWN_SECONDS, ease: 'linear' })
      return () => c.stop()
    }
  }, [counting, reduce, sosCountdown === SOS_COUNTDOWN_SECONDS]) // eslint-disable-line react-hooks/exhaustive-deps

  // Haptics: one long buzz on open, a short tick each of the last 3 seconds
  useEffect(() => {
    if (!counting) return
    if (sosCountdown === SOS_COUNTDOWN_SECONDS) vibrate(200)
    else if (sosCountdown <= 3 && sosCountdown > 0) vibrate(100)
  }, [counting, sosCountdown])

  useEffect(() => {
    if (sosPhase === 'sent') setSentAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    if (sosPhase === 'idle') setSentAt(null)
  }, [sosPhase])

  // Focus "Cancel" immediately, keep focus inside, lock scroll. Escape does not dismiss an emergency.
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus?.()
    }
  }, [open])

  if (!mounted) return null

  const ripples = counting && !reduce ? (sosCountdown <= 3 ? [0, 0.5] : [0]) : []

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sos-title"
          aria-describedby="sos-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.12, ease: 'linear' }}
          className="fixed inset-0 z-[var(--z-sos-takeover)] flex flex-col overflow-y-auto bg-[#0B0507] text-white"
        >
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[calc(2rem+var(--sat))] pb-[calc(1.5rem+var(--sab))]">
            <p className="text-eyebrow font-semibold text-red-300 uppercase">{sosSource === 'PHYSICAL_BUTTON' ? 'Wearable SOS' : 'Emergency SOS'}</p>
            <h1 id="sos-title" className="mt-2 text-3xl font-semibold tracking-tight">
              {counting ? 'Sending SOS' : sosPhase === 'sending' ? 'Alerting responders…' : 'Help is on the way'}
            </h1>
            <p id="sos-desc" className="mt-2 text-[15px] text-white/70">
              {counting
                ? 'Responders will get your location and vitals. Cancel now if you are safe.'
                : sosPhase === 'sending'
                ? 'Sharing your live location and vitals.'
                : `${sosDispatchStatus ?? 'Responders have been alerted.'}${sentAt ? ` · Location sent ${sentAt}` : ''}`}
            </p>

            <div className="relative mx-auto my-8 grid size-60 place-items-center">
              {ripples.map((delay) => (
                <motion.span
                  key={`${sosCountdown}-${delay}`}
                  aria-hidden
                  className="absolute inset-4 rounded-full border-2 border-red-500"
                  initial={{ scale: 1, opacity: 0.35 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.6, delay, ease: 'easeOut' }}
                />
              ))}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgb(239 68 68 / 0.18)" strokeWidth="6" />
                {counting && (
                  <motion.circle cx="60" cy="60" r={R} fill="none" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} style={{ strokeDashoffset: dashOffset }} />
                )}
              </svg>
              {counting ? (
                <div className="text-center">
                  <span className="block font-mono text-7xl font-light tabular-nums">{sosCountdown}</span>
                  <span className="text-eyebrow text-white/60 uppercase">seconds</span>
                </div>
              ) : sosPhase === 'sending' ? (
                <Loader2 className="size-12 animate-spin text-red-400" aria-hidden />
              ) : (
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }} className="grid size-28 place-items-center rounded-full bg-red-600">
                  <svg viewBox="0 0 24 24" className="size-14" aria-hidden>
                    <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.15 }} />
                  </svg>
                </motion.span>
              )}
            </div>

            <p className="sr-only" aria-live="assertive">
              {counting && ANNOUNCE_AT.has(sosCountdown) ? `Sending SOS in ${sosCountdown} seconds` : sosPhase === 'sent' ? 'SOS sent. Help is on the way.' : ''}
            </p>

            <dl className="grid grid-cols-3 gap-2">
              {[
                { icon: HeartPulse, label: 'Heart rate', value: telemetry.heartRate, unit: 'BPM' },
                { icon: Wind, label: 'SpO₂', value: telemetry.spo2, unit: '%' },
                { icon: Thermometer, label: 'Temp', value: telemetry.bodyTemp.toFixed(1), unit: '°C' },
              ].map(({ icon: Icon, label, value, unit }, i) => (
                <motion.div
                  key={label}
                  initial={sosPhase === 'sent' && !reduce ? { opacity: 0, y: 4 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <dt className="flex items-center gap-1 text-[11px] text-white/60">
                    <Icon className="size-3.5" aria-hidden /> {label}
                  </dt>
                  <dd className="mt-0.5 font-mono text-lg tabular-nums">
                    {value}
                    <span className="ml-0.5 text-[11px] text-white/60">{unit}</span>
                  </dd>
                </motion.div>
              ))}
            </dl>

            <p className="mt-3 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/75">
              <MapPin className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden />
              {location ? (
                <span>
                  Location <span className="font-mono">{location.lat}, {location.lon}</span>
                  {location.accuracy ? ` · ±${location.accuracy} m` : ''}
                </span>
              ) : (
                <span>Location unavailable — allow location access so responders can find you.</span>
              )}
            </p>
            {userProfile.name && (
              <p className="mt-2 text-xs text-white/50">
                For responders: {userProfile.name}, {userProfile.age} yrs, {userProfile.sex}
                {userProfile.healthNotes ? ` · ${userProfile.healthNotes}` : ''}
              </p>
            )}

            <div className="mt-auto grid gap-2 pt-8">
              {counting ? (
                <>
                  <button ref={cancelRef} type="button" onClick={dismissSos} className="h-14 cursor-pointer rounded-2xl bg-white text-[16px] font-semibold text-[#0B0507] active:scale-[0.99]">
                    Cancel — I’m safe
                  </button>
                  <button type="button" onClick={sendSosNow} className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 text-[16px] font-semibold text-white active:scale-[0.99]">
                    <Send className="size-5" aria-hidden /> Send now
                  </button>
                </>
              ) : (
                <>
                  <a href="tel:112" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 text-[16px] font-semibold text-white">
                    <PhoneCall className="size-5" aria-hidden /> Call 112
                  </a>
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={dismissSos}
                    disabled={sosPhase === 'sending'}
                    className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/20 text-[16px] font-semibold text-white disabled:opacity-50"
                  >
                    <Check className="size-5" aria-hidden /> I’m safe — cancel alert
                  </button>
                  <p className="text-center text-xs text-white/50">Cancelling sends a “false alarm” message to responders.</p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
