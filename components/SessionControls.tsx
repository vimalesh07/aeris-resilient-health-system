'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import type { AppRole } from '@/lib/auth'
import { LogOut, RefreshCw, ChevronDown } from 'lucide-react'

export function SessionControls({ name, role }: { name: string; role: AppRole }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const handleRoleSwitch = async (targetRole: AppRole) => {
    if (targetRole === role) {
      setMenuOpen(false)
      return
    }
    setSwitching(true)
    try {
      const res = await fetch('/api/dev/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      })
      if (res.ok) {
        window.location.href = `/${targetRole}`
      } else {
        const data = await res.json()
        alert(data.error || 'Could not switch role')
        setSwitching(false)
      }
    } catch {
      alert('Network error switching role')
      setSwitching(false)
    }
  }

  const roleColors: Record<AppRole, { bg: string; text: string; border: string }> = {
    user: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
    admin: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
    government: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' },
  }

  const currentColors = roleColors[role] || roleColors.user

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, position: 'relative' }}>
      {/* User Info & Role Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{name || 'AERIS user'}</span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            background: currentColors.bg,
            color: currentColors.text,
            border: `1px solid ${currentColors.border}`,
          }}
        >
          {role}
        </span>
      </div>

      {/* Switch Portal Dropdown for instant cross-testing */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          disabled={switching}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#CBD5E1',
            fontSize: 12,
            fontWeight: 600,
            cursor: switching ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={12} className={switching ? 'animate-spin' : ''} />
          <span>{switching ? 'Switching...' : 'Switch Portal'}</span>
          <ChevronDown size={12} />
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              padding: 6,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
              zIndex: 100,
              minWidth: 160,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {(['user', 'admin', 'government'] as AppRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleSwitch(r)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 0,
                  background: r === role ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: r === role ? '#FFFFFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: r === role ? 700 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{r.toUpperCase()}</span>
                {r === role && <span style={{ fontSize: 10, color: '#34D399' }}>Active</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Logout button */}
      <button
        type="button"
        onClick={async () => {
          if (hasSupabaseEnv()) {
            try {
              await createBrowserSupabaseClient().auth.signOut()
            } catch (err) {
              console.warn('Sign out error:', err)
            }
          }
          router.replace('/login')
          router.refresh()
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 6,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#F87171',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <LogOut size={12} />
        <span>Log out</span>
      </button>
    </div>
  )
}
