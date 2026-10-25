'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { CheckCircle2, Clock, Laptop, Loader2, PhoneOff, ShieldAlert, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

type State =
  | { kind: 'unavailable' }
  | { kind: 'expired' }
  | { kind: 'ready' | 'mismatch' | 'no-phone'; device: string; requestedPhone: string; accountName: string; expiresAt: string }

export function ApproveQrLogin({ id, state }: { id: string; state: State }) {
  const [result, setResult] = useState<'approved' | 'denied' | null>(null)
  const [busy, setBusy] = useState<'approve' | 'deny' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const expiresAt = 'expiresAt' in state ? state.expiresAt : null
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => setSecondsLeft(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [expiresAt])

  const decide = async (decision: 'approve' | 'deny') => {
    setBusy(decision)
    setError(null)
    try {
      const res = await fetch('/api/auth/qr/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setResult(decision === 'approve' ? 'approved' : 'denied')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  const expired = state.kind === 'expired' || secondsLeft === 0

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-5">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 text-center shadow-md"
      >
        {result === 'approved' ? (
          <Outcome icon={<CheckCircle2 />} tone="success" title="Login approved" body="The other device is signing in now. You can close this page." />
        ) : result === 'denied' ? (
          <Outcome icon={<ShieldX />} tone="neutral" title="Login denied" body="Nobody was signed in. If you didn't try to log in, you can ignore this." />
        ) : state.kind === 'unavailable' ? (
          <Outcome icon={<ShieldAlert />} tone="neutral" title="QR login isn’t set up" body="This server isn’t connected to Supabase, so QR login is unavailable." />
        ) : expired ? (
          <Outcome icon={<Clock />} tone="neutral" title="This code expired" body="Codes last 2 minutes. Get a new code on the other device and scan again." />
        ) : (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Laptop className="size-7" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-fg">Log in on another device?</h1>
            <p className="mt-1 text-sm text-fg-2">
              <strong className="font-semibold text-fg">{state.device}</strong> wants to sign in to your AERIS account.
            </p>

            <dl className="mt-5 grid gap-2 rounded-2xl bg-surface-2 p-4 text-left text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">Account</dt>
                <dd className="truncate font-medium text-fg">{state.accountName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">Mobile number</dt>
                <dd className="font-medium text-fg tabular-nums">{state.requestedPhone}</dd>
              </div>
              {secondsLeft !== null && (
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Expires in</dt>
                  <dd className="font-medium text-fg tabular-nums">
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                  </dd>
                </div>
              )}
            </dl>

            {state.kind === 'mismatch' && (
              <p role="alert" className="mt-4 flex gap-2 rounded-xl border border-danger-line bg-danger-soft p-3 text-left text-sm text-danger">
                <PhoneOff className="mt-0.5 size-4 shrink-0" aria-hidden />
                This code is for a different mobile number than the one on your account, so it can’t be approved here.
              </p>
            )}
            {state.kind === 'no-phone' && (
              <p role="alert" className="mt-4 rounded-xl border border-warning-line bg-warning-soft p-3 text-left text-sm text-fg-2">
                Your account has no mobile number yet.{' '}
                <Link href="/user/settings" className="font-medium text-brand underline-offset-2 hover:underline">
                  Add it in Settings
                </Link>
                , then scan again.
              </p>
            )}

            <p className="mt-4 flex gap-2 text-left text-xs text-fg-muted">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              Only approve if you are looking at this code on your own screen. Never approve a code someone sent you.
            </p>

            {error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" onClick={() => decide('deny')} disabled={busy !== null}>
                {busy === 'deny' && <Loader2 className="animate-spin" />} Deny
              </Button>
              <Button size="lg" onClick={() => decide('approve')} disabled={busy !== null || state.kind !== 'ready'}>
                {busy === 'approve' && <Loader2 className="animate-spin" />} Approve
              </Button>
            </div>
          </>
        )}
      </motion.section>
    </main>
  )
}

function Outcome({ icon, tone, title, body }: { icon: React.ReactNode; tone: 'success' | 'neutral'; title: string; body: string }) {
  return (
    <div className="py-4">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`mx-auto grid size-14 place-items-center rounded-full [&_svg]:size-7 ${tone === 'success' ? 'bg-success-soft text-success' : 'bg-surface-2 text-fg-2'}`}
      >
        {icon}
      </motion.span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-fg">{title}</h1>
      <p className="mt-1 text-sm text-fg-2">{body}</p>
    </div>
  )
}
