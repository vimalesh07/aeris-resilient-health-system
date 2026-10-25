'use client'

import { useEffect } from 'react'

/**
 * Tracks the on-screen keyboard. Exposes its height as --kb on <html> and sets
 * data-kb-open while it is up, so fixed UI (bottom nav) can step aside and the
 * chat composer stays visible. Works where `interactive-widget` isn't supported
 * (e.g. iOS Safari) by measuring the visual viewport.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
      root.style.setProperty('--kb', `${inset}px`)
      if (inset > 80) root.dataset.kbOpen = ''
      else delete root.dataset.kbOpen
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty('--kb')
      delete root.dataset.kbOpen
    }
  }, [])
}
