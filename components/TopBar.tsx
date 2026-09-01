'use client'

import React from 'react'
import { Activity, Bell, BellRing, Wifi, WifiOff } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function TopBar() {
  const { isOffline, setIsOffline, alerts, setActiveView, notificationsEnabled, enableChromeNotifications } = useTelemetry()
  const unackCount = alerts.filter((a) => !a.acknowledged).length

  return (
    <header className="topbar">
      {/* Left section: Brand & Status */}
      <div className="topbar-left">
        <div className="topbar-brand">
          <span className="brand-mark">
            <Activity size={16} />
          </span>
          <strong className="brand-title">AERIS</strong>
        </div>

        <div className="top-status">
          <span className="live-dot" />
          <span className="live-text">Edge AI</span>
          <span className="top-divider desktop-only" />
          <span className="muted desktop-only">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Right section: Actions */}
      <div className="top-actions">
        {/* Chrome Push Toggle (Desktop Only) */}
        <button
          className="top-pill-button desktop-only"
          onClick={enableChromeNotifications}
          title="Enable Chrome Push Notifications"
          style={{
            background: notificationsEnabled ? 'var(--yellow)' : 'rgba(255,255,255,0.1)',
            color: notificationsEnabled ? '#171717' : '#FFF',
          }}
        >
          {notificationsEnabled ? <BellRing size={13} /> : <Bell size={13} />}
          <span>{notificationsEnabled ? 'Push Active' : 'Chrome Alerts'}</span>
        </button>

        {/* Offline Mode Toggle (Desktop Only) */}
        <button
          className="top-pill-button desktop-only"
          onClick={() => setIsOffline(!isOffline)}
          title="Toggle Privacy Mode"
          style={{
            background: isOffline ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
            color: '#FFF',
          }}
        >
          {isOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
          <span>{isOffline ? 'LOCAL PROCESSING' : 'ONLINE HUB'}</span>
        </button>

        {/* Alert Bell */}
        <button
          className="icon-button relative"
          onClick={() => setActiveView('Alerts')}
          aria-label="View alerts"
          title="System Risk Advisories"
        >
          <Bell size={18} />
          {unackCount > 0 && (
            <span className="alert-counter-badge">
              {unackCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <button
          className="avatar"
          onClick={() => setActiveView('Settings')}
          aria-label="User Settings"
          title="Settings & Profile"
        >
          VM
        </button>
      </div>
    </header>
  )
}
