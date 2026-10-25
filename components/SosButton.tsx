'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Siren } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { cn } from '@/lib/utils'

/**
 * Opens the SOS countdown. Nothing is sent on tap: the user gets a
 * 10-second window to cancel, so an accidental press never alerts anyone.
 */
export function SosButton({ variant = 'block', className }: { variant?: 'block' | 'fab' | 'compact'; className?: string }) {
  const { triggerSos, isSosActive, activeView } = useTelemetry()

  if (variant === 'fab') {
    return (
      <motion.button
        type="button"
        onClick={() => triggerSos('WEB')}
        disabled={isSosActive}
        whileTap={{ scale: 0.94 }}
        aria-label="Emergency SOS"
        className={cn(
          'fixed right-4 z-[var(--z-sos-fab)] grid size-16 cursor-pointer place-items-center rounded-full bg-brand text-white shadow-[inset_0_0_0_3px_rgb(255_255_255_/_0.85),0_12px_28px_-8px_rgb(220_38_38_/_0.55)] lg:hidden',
          // On the assistant screen, sit above the message box instead of covering Send.
          activeView === 'assistant' ? 'bottom-[calc(var(--bottom-nav-h)+120px+var(--sab))] [[data-kb-open]_&]:top-[calc(var(--topbar-h)+12px)] [[data-kb-open]_&]:bottom-auto' : 'bottom-[calc(var(--bottom-nav-h)+16px+var(--sab))]',
          className,
        )}
      >
        <span className="flex flex-col items-center leading-none">
          <Siren className="size-5" aria-hidden />
          <span className="mt-0.5 text-[10px] font-bold tracking-wide">SOS</span>
        </span>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={() => triggerSos('WEB')}
      disabled={isSosActive}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'group inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60',
        variant === 'compact' ? 'h-11 px-4 text-sm' : 'h-14 w-full px-4 text-[15px] shadow-[inset_0_0_0_3px_rgb(255_255_255_/_0.25)]',
        className,
      )}
    >
      <Siren className="size-5" aria-hidden />
      Emergency SOS
    </motion.button>
  )
}
