'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  /** Emergency dialogs must not close on backdrop click or Escape. */
  dismissible?: boolean
  size?: 'sm' | 'md' | 'lg'
  tone?: 'default' | 'danger'
  hideClose?: boolean
  className?: string
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  dismissible = true,
  size = 'md',
  tone = 'default',
  hideClose = false,
  className,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const descId = React.useId()
  const [mounted, setMounted] = React.useState(false)
  const [isSheet, setIsSheet] = React.useState(false)
  const dragControls = useDragControls()

  React.useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setIsSheet(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Mobile sheet: drag down from the handle to dismiss (fast flick or past 120px).
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 120) onClose()
  }
  const canDrag = isSheet && dismissible

  React.useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panelRef.current)?.focus()
    }, 30)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null)
      if (nodes.length === 0) return
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

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, dismissible, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[var(--z-dialog)] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.16 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            onClick={dismissible ? onClose : undefined}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role={tone === 'danger' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            className={cn(
              'relative max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] border border-line bg-surface p-6 shadow-lg outline-none sm:max-h-[92dvh] sm:rounded-[28px]',
              'pb-[calc(1.5rem+var(--sab))] sm:pb-6',
              tone === 'danger' && 'border-danger-line',
              SIZES[size],
              className,
            )}
            initial={isSheet ? { y: '100%' } : { opacity: 0, y: 8 }}
            animate={isSheet ? { y: 0, transition: { type: 'spring', stiffness: 380, damping: 36, mass: 0.8 } } : { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } }}
            exit={isSheet ? { y: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } } : { opacity: 0, transition: { duration: 0.12 } }}
            drag={canDrag ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            {canDrag && (
              <div
                className="-mx-6 -mt-6 mb-2 flex cursor-grab touch-none justify-center pt-3 pb-2 active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
                aria-hidden
              >
                <span className="h-1 w-9 rounded-full bg-line-strong" />
              </div>
            )}
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight text-fg">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-fg-2">
                    {description}
                  </p>
                )}
              </div>
              {!hideClose && dismissible && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
