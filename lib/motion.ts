import type { Transition, Variants } from 'motion/react'

/**
 * Lifeline motion system. Every animation in the app uses one of these
 * presets instead of ad-hoc timings.
 *
 *   enter     cards, screens, list items appearing      never loops
 *   exit      anything leaving (always faster)           never loops
 *   emphasis  value/tier changed, shared-element morph   never loops
 *   alert     critical dialogs, SOS open                 no translate
 *   ambient   heartbeat dot, twin pulse                  loops, tied to real BPM
 *   reveal    risk score, login boot (cinematic)         plays once per mount
 */
export const ease = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  inQuick: [0.4, 0, 1, 1] as const,
  standard: [0.2, 0, 0, 1] as const,
}

export const t = {
  enter: { duration: 0.24, ease: ease.outExpo } satisfies Transition,
  exit: { duration: 0.12, ease: ease.inQuick } satisfies Transition,
  emphasis: { type: 'spring', stiffness: 380, damping: 36, mass: 0.8 } satisfies Transition,
  alert: { duration: 0.12, ease: 'linear' } satisfies Transition,
  reveal: { type: 'spring', stiffness: 60, damping: 20 } satisfies Transition,
}

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: t.enter },
  exit: { opacity: 0, transition: t.exit },
}

/** 40ms between siblings; children past `max` enter with the last staggered one. */
export const stagger = (step = 0.04): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step } },
})

/** Delay for item i in a capped stagger (max 6 staggered items). */
export const staggerDelay = (i: number, step = 0.04, max = 6) => Math.min(i, max - 1) * step
