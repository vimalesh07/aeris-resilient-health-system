'use client'

import React from 'react'
import {
  Activity,
  CloudSun,
  History,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  Settings2,
  Waves,
} from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Stress & Well-being', icon: Waves },
  { label: 'Climate Health', icon: CloudSun },
  { label: 'Safe Places', icon: MapPin },
]

export const SYSTEM_ITEMS = [
  { label: 'AI Companion', icon: MessageSquareText },
  { label: 'Analytics', icon: History },
  { label: 'Settings', icon: Settings2 },
]

export function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { activeView, setActiveView, isOffline } = useTelemetry()

  const handleNav = (label: string) => {
    setActiveView(label)
    setOpen(false)
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <span className="brand-mark">
          <Activity size={18} />
        </span>
        <span>AERIS</span>
      </div>

      <p className="sidebar-label">Intelligence</p>
      <nav>
        {NAV_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${activeView === label ? 'active' : ''}`}
            onClick={() => handleNav(label)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <p className="sidebar-label secondary-label">System</p>
      <nav>
        {SYSTEM_ITEMS.map(({ label, icon: Icon }) => {
          const isActive =
            activeView === label ||
            (label === 'Analytics' &&
              (activeView === 'Health History' ||
                activeView === 'History' ||
                activeView === 'Health Analytics' ||
                activeView === 'Analytics'))
          return (
            <button
              key={label}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(label)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sync-dot">
          <span className="sync-indicator" />
          <span className="sync-text">{isOffline ? 'LOCAL PROCESSING' : 'EDGE HUB SYNCED'}</span>
        </div>
        <small className="sync-subtext">
          ● Sensors online • Local processing
        </small>

        <div className="profile" onClick={() => setActiveView('Settings')} style={{ cursor: 'pointer' }}>
          <span className="avatar">VM</span>
          <div>
            <strong>Vimal</strong>
            <small>Personal Edge Hub</small>
          </div>
          <MoreHorizontal size={15} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </aside>
  )
}
