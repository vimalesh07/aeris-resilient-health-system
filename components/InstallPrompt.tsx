'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Download, Share, SquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Chrome/Edge/Android event; not in the standard DOM typings.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'aeris-install-dismissed-at'
const DISMISS_DAYS = 7
// Wait for the BootReveal intro to finish before asking.
const SHOW_DELAY_MS = 2000

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

/**
 * Registers the service worker and, on first visit, asks whether to install
 * AERIS as an app. On Chrome/Edge/Android the browser's install dialog opens
 * only after the user taps Install; on iOS Safari it shows the Add to Home
 * Screen steps instead. "Not now" hides it for a week.
 */
export function InstallPrompt() {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<'install' | 'ios' | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {})
    }
    if (isStandalone() || recentlyDismissed()) return

    let timer: number | undefined
    const showAfterDelay = (next: 'install' | 'ios') => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setMode(next), SHOW_DELAY_MS)
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      deferred.current = event as BeforeInstallPromptEvent
      showAfterDelay('install')
    }
    const onInstalled = () => {
      deferred.current = null
      setMode(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    if (isIos()) showAfterDelay('ios')

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Storage unavailable: it will ask again next visit.
    }
    setMode(null)
  }

  const install = async () => {
    const event = deferred.current
    if (!event) return
    deferred.current = null
    setMode(null)
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'dismissed') dismiss()
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(var(--sab)+80px)] z-[var(--z-toast)] flex justify-center lg:bottom-6">
      <AnimatePresence>
        {mode && (
          <motion.div
            role="dialog"
            aria-labelledby="install-title"
            aria-describedby="install-body"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 460, damping: 36 }}
            className="pointer-events-auto relative w-full max-w-[400px] rounded-2xl border border-line bg-surface p-4 shadow-lg"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-4" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <img src="/icon-192.png" alt="" className="size-12 shrink-0 rounded-xl border border-line" />
              <div className="min-w-0">
                <p id="install-title" className="text-sm font-semibold text-fg">
                  Install AERIS as an app?
                </p>
                <p id="install-body" className="mt-0.5 text-sm text-fg-2">
                  Open AERIS from your home screen in one tap, full screen, without the browser bar.
                </p>
              </div>
            </div>

            {mode === 'install' ? (
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={dismiss}>
                  Not now
                </Button>
                <Button size="sm" onClick={install}>
                  <Download aria-hidden />
                  Install
                </Button>
              </div>
            ) : (
              <>
                <ol className="mt-3 space-y-1.5 rounded-xl bg-surface-2 p-3 text-sm text-fg-2">
                  <li className="flex items-center gap-2">
                    <span className="font-semibold text-fg">1.</span> Tap <Share className="size-4 text-info" aria-label="Share" /> Share in Safari
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold text-fg">2.</span> Choose <SquarePlus className="size-4 text-fg" aria-hidden /> Add to Home Screen
                  </li>
                </ol>
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={dismiss}>
                    Got it
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
