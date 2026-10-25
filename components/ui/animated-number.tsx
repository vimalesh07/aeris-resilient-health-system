'use client'

import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'motion/react'

/** Counts smoothly to a new value so live readings don't jump. */
export function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(value)
  const reduce = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reduce) {
      node.textContent = value.toFixed(decimals)
      previous.current = value
      return
    }
    const controls = animate(previous.current, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = v.toFixed(decimals)
      },
    })
    previous.current = value
    return () => controls.stop()
  }, [value, decimals, reduce])

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
    </span>
  )
}
