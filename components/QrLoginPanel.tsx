'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, Loader2, QrCode, RefreshCw, ShieldX, Smartphone } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

type Phase = 'idle' | 'loading' | 'waiting' | 'signing-in' | 'denied' | 'expired' | 'error'

interface QrRequest {
  id: string
  secret: string
  expiresAt: string
  approveUrl: string
  maskedPhone: string
}

const POLL_MS = 2000

/**
 * "Scan to log in": shows a QR code that a phone already signed in to AERIS
 * scans and approves. This browser then signs in to the same account.
 * Styled for the dark login screen.
 */
export function QrLoginPanel({ enabled, className }: { enabled: boolean; className?: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [request, setRequest] = useState<QrRequest | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const requestRef = useRef<QrRequest | null>(null)
  const reduce = useReducedMotion()
  const reduceRef = useRef(reduce)
  reduceRef.current = reduce

  const start = useCallback(async () => {
    const digits = phone.replace(/D/g, '')
    if (digits.length < 10) {
      setError('Enter your 10-digit mobile number.')
      setPhase('idle')
      return
    }
    setPhase('loading')
    setError(null)
    try {
      const res = await fetch('/api/auth/qr/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create a QR code.')
      requestRef.current = data
      setRequest(data)
      setPhase('waiting')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create a QR code.')
      setPhase('error')
    }
  }, [phone])

  // Countdown until the code expires
  useEffect(() => {
    if (phase !== 'waiting' || !request) return
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(request.expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) setPhase('expired')
    }
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [phase, request])

  // Poll for the phone's decision
  useEffect(() => {
    if (phase !== 'waiting') return
    let cancelled = false
    const poll = async () => {
      const current = requestRef.current
      if (!current || cancelled) return
      try {
        const res = await fetch('/api/auth/qr/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, secret: current.secret }),
        })
        const data = await res.json()
        if (cancelled) return
        if (data.status === 'approved' && data.tokenHash) {
          setPhase('signing-in')
          const { error: otpError } = await createBrowserSupabaseClient().auth.verifyOtp({ token_hash: data.tokenHash, type: 'magiclink' })
          if (otpError) throw new Error(otpError.message)
          await new Promise((r) => setTimeout(r, reduceRef.current ? 600 : 900))
          router.replace('/')
          router.refresh()
        } else if (data.status === 'denied') {
          setPhase('denied')
        } else if (data.status === 'expired') {
          setPhase('expired')
        } else if (data.status === 'error') {
          setError(data.error || 'Could not sign you in.')
          setPhase('error')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not sign you in.')
          setPhase('error')
        }
      }
    }
    const t = window.setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [phase, router])

  if (!enabled) return null

  return (
    <section
      aria-labelledby="qr-login-title"
      className={`mx-auto mt-6 w-full max-w-[480px] rounded-[20px] border border-white/10 bg-[#0E1218] p-5 text-slate-100 shadow-xl ${className ?? ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-400">
          <QrCode className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="qr-login-title" className="text-[15px] font-semibold text-white">
            Scan to log in
          </h2>
          <p className="mt-0.5 text-sm text-slate-300">Enter your mobile number, then scan the code with your phone where you are already signed in to AERIS.</p>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {phase === 'idle' && (
          <motion.form
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 grid gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              start()
            }}
            noValidate
          >
            <label htmlFor="qr-phone" className="text-sm font-medium text-slate-200">
              Mobile number
            </label>
            <div className="flex h-11 items-center overflow-hidden rounded-xl border border-white/15 bg-white/5 focus-within:border-red-400">
              <span className="border-r border-white/10 px-3 text-sm text-slate-300">+91</span>
              <input
                id="qr-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (error) setError(null)
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'qr-phone-error' : undefined}
                className="h-full flex-1 bg-transparent px-3 text-[15px] text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            {error && (
              <p id="qr-phone-error" role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="mt-1 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <QrCode className="size-4" aria-hidden /> Show QR code
            </button>
          </motion.form>
        )}

        {phase === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 grid h-[260px] place-items-center">
            <Loader2 className="size-7 animate-spin text-slate-300" aria-label="Creating QR code" />
          </motion.div>
        )}

        {phase === 'waiting' && request && (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="mt-5 flex flex-col items-center"
          >
            <p className="mb-3 text-sm text-slate-300">
              Code for <strong className="font-semibold text-white">{request.maskedPhone}</strong>{' '}
              <button type="button" onClick={() => setPhase('idle')} className="cursor-pointer text-red-300 underline-offset-2 hover:underline">
                Change
              </button>
            </p>
            <div className="relative rounded-2xl bg-white p-4 shadow-lg">
              <QRCodeSVG value={request.approveUrl} size={196} level="M" marginSize={0} title="QR code to log in to AERIS" />
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-4 h-0.5 rounded-full bg-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                animate={{ y: [0, 196, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <ol className="mt-5 grid w-full gap-2 text-sm text-slate-300">
              <li className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">1</span>
                Open your phone camera and point it at the code.
              </li>
              <li className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">2</span>
                Tap <strong className="font-semibold text-white">Approve</strong>. Only the account registered with this number can approve.
              </li>
            </ol>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400" aria-live="polite">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                <span className="relative size-2 rounded-full bg-emerald-400" />
              </span>
              Waiting for your phone · code expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </p>
          </motion.div>
        )}

        {phase === 'signing-in' && (
          <motion.div key="signing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex flex-col items-center py-10 text-center">
            {reduce ? (
              <CheckCircle2 className="size-14 text-red-400" aria-hidden />
            ) : (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.18, type: 'spring', stiffness: 380, damping: 26 }}
                className="grid size-20 place-items-center rounded-full bg-red-600 shadow-[0_0_40px_rgb(239_68_68/0.45)]"
              >
                <svg viewBox="0 0 24 24" className="size-10" aria-hidden>
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  />
                </svg>
              </motion.span>
            )}
            <p className="mt-4 font-semibold text-white" aria-live="polite">
              Approved on your phone{request ? ` ending ${request.maskedPhone.slice(-4)}` : ''}
            </p>
            <p className="mt-1 text-sm text-slate-300">Signing you in…</p>
          </motion.div>
        )}

        {(phase === 'expired' || phase === 'denied' || phase === 'error') && (
          <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex flex-col items-center py-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-white/5 text-slate-300">
              {phase === 'denied' ? <ShieldX className="size-6" aria-hidden /> : <Smartphone className="size-6" aria-hidden />}
            </span>
            <p className="mt-3 font-semibold text-white">
              {phase === 'expired' ? 'This code expired' : phase === 'denied' ? 'Login was denied on your phone' : 'Something went wrong'}
            </p>
            {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
            <button
              type="button"
              onClick={start}
              className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500"
            >
              <RefreshCw className="size-4" aria-hidden /> Get a new code
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
