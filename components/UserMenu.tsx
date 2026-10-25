'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, FlaskConical, LogOut, Moon, RefreshCw, Settings2, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase/lazy'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { usePreferences } from '@/hooks/usePreferences'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type Role = 'user' | 'admin' | 'government'

const ROLE_LABEL: Record<Role, string> = { user: 'Personal', admin: 'Admin', government: 'Government' }

export function initialsOf(name: string | undefined | null): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'A'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function UserMenu({
  name,
  email,
  role,
  onOpenSettings,
}: {
  name: string
  email?: string
  role: Role
  onOpenSettings?: () => void
}) {
  const router = useRouter()
  const { theme, setTheme, demoMode, setDemoMode } = usePreferences()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<Role | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const switchPortal = async (target: Role) => {
    if (target === role) return setOpen(false)
    setSwitching(target)
    try {
      const res = await fetch('/api/dev/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: target }),
      })
      if (res.ok) {
        window.location.href = `/${target}`
        return
      }
      const data = await res.json().catch(() => ({}))
      toast({ tone: 'error', title: 'Could not switch portal', description: data.error || 'Please try again.' })
    } catch {
      toast({ tone: 'error', title: 'Network error', description: 'Check your connection and try again.' })
    }
    setSwitching(null)
  }

  const signOut = async () => {
    if (hasSupabaseEnv()) {
      try {
        await (await getBrowserSupabase()).auth.signOut()
      } catch (err) {
        console.warn('Sign out error:', err)
      }
    }
    router.replace('/login')
    router.refresh()
  }

  const displayName = name || 'AERIS user'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface py-1 pr-2.5 pl-1 shadow-xs transition-colors hover:border-line-strong"
      >
        <span aria-hidden className="grid size-8 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-fg">{initialsOf(displayName)}</span>
        <span className="sr-only lg:hidden">{displayName}</span>
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-fg lg:block">{displayName}</span>
        <span className="sr-only">, account menu</span>
        <ChevronDown className="size-4 text-fg-muted" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            className="absolute right-0 z-[var(--z-dropdown)] mt-2 w-72 origin-top-right rounded-2xl border border-line bg-surface p-1.5 shadow-lg"
          >
            <div className="px-3 pt-2 pb-3">
              <p className="truncate text-sm font-semibold text-fg">{displayName}</p>
              {email && <p className="truncate text-xs text-fg-muted">{email}</p>}
              <span className="mt-2 inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-fg-2">{ROLE_LABEL[role]} portal</span>
            </div>

            <div className="h-px bg-line" />

            {onOpenSettings && (
              <MenuItem
                icon={<Settings2 />}
                onClick={() => {
                  setOpen(false)
                  onOpenSettings()
                }}
              >
                Settings
              </MenuItem>
            )}
            <MenuItem icon={theme === 'dark' ? <Sun /> : <Moon />} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </MenuItem>
            <MenuItem icon={<FlaskConical />} onClick={() => setDemoMode(!demoMode)} trailing={<Toggle on={demoMode} />}>
              Demo tools
            </MenuItem>

            {demoMode && (
              <>
                <div className="h-px bg-line" />
                <p className="px-3 pt-2 pb-1 text-[11px] font-medium text-fg-muted">Switch portal (demo)</p>
                {(['user', 'admin', 'government'] as Role[]).map((r) => (
                  <MenuItem
                    key={r}
                    icon={switching === r ? <RefreshCw className="animate-spin" /> : <span className="size-4" />}
                    onClick={() => switchPortal(r)}
                    trailing={r === role ? <Check className="size-4 text-success" /> : null}
                  >
                    {ROLE_LABEL[r]}
                  </MenuItem>
                ))}
              </>
            )}

            <div className="h-px bg-line" />
            <MenuItem icon={<LogOut />} onClick={signOut} danger>
              Log out
            </MenuItem>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItem({
  icon,
  children,
  onClick,
  trailing,
  danger,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  trailing?: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors [&_svg]:size-4',
        danger ? 'text-danger hover:bg-danger-soft' : 'text-fg hover:bg-surface-2',
      )}
    >
      <span className={cn('grid place-items-center', danger ? 'text-danger' : 'text-fg-muted')}>{icon}</span>
      <span className="flex-1">{children}</span>
      {trailing}
    </button>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cn('relative h-5 w-9 rounded-full transition-colors', on ? 'bg-brand' : 'bg-line-strong')}>
      <motion.span
        className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm"
        animate={{ x: on ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
      />
    </span>
  )
}
