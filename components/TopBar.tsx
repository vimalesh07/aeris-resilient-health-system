'use client'

import React from 'react'
import { Activity, Bell, BellRing, ShieldCheck, Wifi, WifiOff } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function TopBar() {
  const { isOffline, setIsOffline, alerts, setActiveView, notificationsEnabled, enableChromeNotifications } = useTelemetry()
  const unackCount = alerts.filter((a) => !a.acknowledged).length

  return (
    <header className="topbar">
      <div className="mobile-brand">
        <span className="brand-mark">
          <Activity size={16} />
        </span>
        AERIS
      </div>

      <div className="top-status">
        <span className="live-dot" />
        Live Edge Monitoring
        <span className="top-divider" />
        <span className="muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>

      <div className="top-actions">
        {/* Enable Chrome Notifications Toggle */}
        <button
          className="demo-toggle"
          onClick={enableChromeNotifications}
          title="Enable Chrome Push Notifications for System Risk Alerts"
          style={{
            background: notificationsEnabled ? 'var(--yellow)' : 'rgba(255,255,255,0.1)',
            color: notificationsEnabled ? '#171717' : '#FFF',
            border: 0,
          }}
        >
          {notificationsEnabled ? <BellRing size={14} /> : <Bell size={14} />}
          <span>{notificationsEnabled ? 'Chrome Push Active' : 'Enable Chrome Alerts'}</span>
        </button>

        <button
          className="demo-toggle"
          onClick={() => setIsOffline(!isOffline)}
          title="Toggle Edge Privacy Processing Mode"
          style={{ background: isOffline ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)', color: '#FFF' }}
        >
          {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span>{isOffline ? 'LOCAL PROCESSING ENABLED' : 'ONLINE HUB'}</span>
        </button>

        <button
          className="icon-button relative"
          onClick={() => setActiveView('Alerts')}
          aria-label="View alerts"
        >
          <Bell size={18} />
          {unackCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                background: 'var(--main-red)',
                color: '#FFF',
                borderRadius: '50%',
                width: 16,
                height: 16,
                fontSize: 10,
                fontWeight: 900,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {unackCount}
            </span>
          )}
        </button>

        <button className="avatar" onClick={() => setActiveView('Settings')}>
          VM
        </button>
      </div>
    </header>
  )
}
