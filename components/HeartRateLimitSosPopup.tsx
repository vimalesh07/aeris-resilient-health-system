'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { HeartPulse, Send } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTelemetry } from '@/hooks/useTelemetry'

const CHECK_SECONDS = 10
const SNOOZE_AFTER_OK_MS = 5 * 60_000
const SNOOZE_AFTER_SEND_MS = 2 * 60_000

/**
 * When heart rate crosses the safe limit, ask "Are you OK?" and give the user
 * 10 seconds to respond before an alert is sent automatically.
 */
export function HeartRateLimitSosPopup({ thresholdBpm = 115 }: { thresholdBpm?: number }) {
  const { telemetry, isSosActive, scenario, triggerNotificationPush } = useTelemetry()
  const [open, setOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(CHECK_SECONDS)
  const [status, setStatus] = useState<'asking' | 'sending' | 'sent'>('asking')
  const triggeredRef = useRef(false)
  const snoozedUntilRef = useRef(0)
  const peakBpmRef = useRef(0)

  useEffect(() => {
    if (isSosActive || scenario === 'disaster_fall_sos') {
      if (open) setOpen(false)
      triggeredRef.current = false
      return
    }
    const bpm = telemetry.heartRate
    if (bpm >= thresholdBpm && Date.now() > snoozedUntilRef.current && !triggeredRef.current) {
      triggeredRef.current = true
      peakBpmRef.current = bpm
      setSecondsLeft(CHECK_SECONDS)
      setStatus('asking')
      setOpen(true)
    } else if (bpm < thresholdBpm - 5 && !open) {
      triggeredRef.current = false
    }
    if (open) peakBpmRef.current = Math.max(peakBpmRef.current, bpm)
  }, [telemetry.heartRate, thresholdBpm, isSosActive, scenario, open])

  useEffect(() => {
    if (!open || status !== 'asking') return
    if (secondsLeft <= 0) {
      void sendAlert()
      return
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [open, status, secondsLeft])

  const sendAlert = async () => {
    setStatus('sending')
    await triggerNotificationPush({
      type: 'threshold',
      title: `High heart rate: ${peakBpmRef.current} BPM`,
      body: `Heart rate stayed above the ${thresholdBpm} BPM limit and the user did not respond within ${CHECK_SECONDS} seconds.`,
      vitals: { heartRate: telemetry.heartRate, spo2: telemetry.spo2, bodyTemp: telemetry.bodyTemp },
    })
    setStatus('sent')
    snoozedUntilRef.current = Date.now() + SNOOZE_AFTER_SEND_MS
    window.setTimeout(() => {
      setOpen(false)
      triggeredRef.current = false
    }, 2500)
  }

  const imOk = () => {
    snoozedUntilRef.current = Date.now() + SNOOZE_AFTER_OK_MS
    setOpen(false)
    triggeredRef.current = false
  }

  return (
    <Dialog
      open={open}
      onClose={imOk}
      dismissible={false}
      tone="danger"
      size="sm"
      title="Are you OK?"
      description={
        status === 'sent'
          ? 'An alert with your vitals and location has been sent.'
          : `Your heart rate is ${telemetry.heartRate} BPM, above your ${thresholdBpm} BPM limit.`
      }
    >
      <div className="flex flex-col items-center">
        <motion.span
          className="my-2 grid size-20 place-items-center rounded-full bg-danger-soft text-brand"
          animate={status === 'asking' ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 0.9, repeat: status === 'asking' ? Infinity : 0 }}
        >
          <HeartPulse className="size-9" aria-hidden />
        </motion.span>
        {status === 'asking' && (
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <motion.div className="h-full w-full origin-left bg-brand" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: CHECK_SECONDS, ease: 'linear' }} />
          </div>
        )}
        {status === 'asking' && (
          <p className="text-sm text-fg-2" aria-live="assertive">
            Sending an alert in <strong className="text-fg tabular-nums">{secondsLeft}s</strong> unless you respond.
          </p>
        )}
        {status === 'sending' && <p className="text-sm text-fg-2">Sending alert…</p>}

        {status === 'asking' && (
          <div className="mt-5 grid w-full gap-2">
            <Button variant="secondary" size="lg" className="h-14" onClick={imOk} data-autofocus>
              I&apos;m OK
            </Button>
            <Button variant="primary" size="lg" className="h-14" onClick={sendAlert}>
              <Send /> Get help
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  )
}
