'use client'

import React from 'react'
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CloudSun,
  Database,
  HeartPulse,
  History,
  LayoutDashboard,
  MessageSquareText,
  MoreHorizontal,
  Navigation,
  Settings2,
  ShieldCheck,
  Waves,
  X,
} from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Vitals', icon: HeartPulse },
  { label: 'Risk Intelligence', icon: BrainCircuit },
  { label: 'Stress & Well-being', icon: Waves },
  { label: 'Mobility', icon: Navigation },
  { label: 'Climate Health', icon: CloudSun },
  { label: 'Alerts', icon: AlertTriangle, hasAlerts: true },
]

export const SYSTEM_ITEMS = [
  { label: 'Health History', icon: History },
  { label: 'AI Companion', icon: MessageSquareText },
  { label: 'Privacy & Data', icon: ShieldCheck },
  { label: 'Settings', icon: Settings2 },
]

export function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { activeView, setActiveView, alerts, isOffline } = useTelemetry()
  const unackCount = alerts.filter((a) => !a.acknowledged).length

  const handleNav = (label: string) => {
    setActiveView(label)
    setOpen(false)
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <span className="brand-mark">
          <Activity size={20} />
        </span>
        <span>AERIS</span>
        <button className="icon-button mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>

      <p className="sidebar-label">Intelligence</p>
      <nav>
        {NAV_ITEMS.map(({ label, icon: Icon, hasAlerts }) => (
          <button
            key={label}
            className={`nav-item ${activeView === label ? 'active' : ''}`}
            onClick={() => handleNav(label)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {hasAlerts && unackCount > 0 && <b>{unackCount}</b>}
          </button>
        ))}
      </nav>

      <p className="sidebar-label secondary-label">System</p>
      <nav>
        {SYSTEM_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${activeView === label ? 'active' : ''}`}
            onClick={() => handleNav(label)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sync-dot">
          <span />
          {isOffline ? 'LOCAL PROCESSING ACTIVE' : 'Edge Hub Synced'}
        </div>
        <small>Sensors: 5/5 Connected via BLE</small>

        <div className="profile">
          <span className="avatar">VM</span>
          <div>
            <strong>Vimal</strong>
            <small>Personal Edge Hub</small>
          </div>
          <MoreHorizontal size={17} />
        </div>
      </div>
    </aside>
  )
}
