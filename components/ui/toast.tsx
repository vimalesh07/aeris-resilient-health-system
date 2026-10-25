'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'info' | 'success' | 'warning' | 'error'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (t: { title: string; description?: string; tone?: ToastTone; durationMs?: number }) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const ICONS = { info: Info, success: CheckCircle2, warning: TriangleAlert, error: XCircle }
const ICON_TONE = { info: 'text-info', success: 'text-success', warning: 'text-warning', error: 'text-danger' }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const idRef = React.useRef(0)

  const dismiss = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback<ToastContextValue['toast']>(
    ({ title, description, tone = 'info', durationMs = 4500 }) => {
      const id = ++idRef.current
      setItems((prev) => [...prev.slice(-3), { id, title, description, tone }])
      window.setTimeout(() => dismiss(id), durationMs)
    },
    [dismiss],
  )

  const value = React.useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(var(--bottom-nav-h)+16px+var(--sab))] z-[var(--z-toast)] flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:items-end"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = ICONS[t.tone]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg"
              >
                <Icon className={cn('mt-0.5 size-5 shrink-0', ICON_TONE[t.tone])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-sm text-fg-2">{t.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="-m-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
