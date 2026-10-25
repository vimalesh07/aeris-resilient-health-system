'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const ECG = 'M0 40 H140 L152 40 L160 12 L170 68 L180 30 L188 40 H320'
const SESSION_KEY = 'aeris-boot-shown'

/**
 * First-load reveal (once per session): a red trace powers on and beats once,
 * then the cover fades. The cover never blocks input, and any key or pointer
 * press skips it. Skipped entirely for reduced motion.
 */
export function BootReveal() {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (reduce) return
    let seen = false
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1'
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // Storage unavailable: just show it.
    }
    if (seen) return
    setShow(true)
    const skip = () => setShow(false)
    window.addEventListener('pointerdown', skip, { once: true })
    window.addEventListener('keydown', skip, { once: true })
    return () => {
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [reduce])

  if (!show) return null

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[var(--z-dialog)] grid place-items-center bg-[#07090D]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => setShow(false)}
    >
      <svg viewBox="0 0 320 80" className="w-[min(80vw,420px)]">
        <motion.line x1="0" y1="40" x2="320" y2="40" stroke="#EF4444" strokeWidth={1} style={{ originX: 0.5 }} initial={{ scaleX: 0, opacity: 0.6 }} animate={{ scaleX: 1, opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
        <motion.path
          d={ECG}
          fill="none"
          stroke="#EF4444"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.div>
  )
}
