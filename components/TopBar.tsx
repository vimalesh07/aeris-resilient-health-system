'use client'

import React from 'react'
import { Activity, Bell, BellRing, Cpu, Menu, Play, Pause, Wifi, WifiOff } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function TopBar({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const {
    isOffline,
    setIsOffline,
    alerts,
    setActiveView,
    notificationsEnabled,
    enableChromeNotifications,
    isHardwareConnected,
    isSimulationRunning,
    setIsSimulationRunning,
  } = useTelemetry()

  const unackCount = alerts.filter((a) => !a.acknowledged).length

  return (
    <header className="topbar">
      {/* Left section: Hamburger (Mobile Only), Brand & Dynamic Hardware Status */}
      <div className="topbar-left">
        {onOpenMobileMenu && (
          <button
            className="icon-button mobile-only mobile-hamburger-btn"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="topbar-brand">
          <span className="brand-mark">
            <Activity size={15} />
          </span>
          <strong className="brand-title">AERIS</strong>
        </div>

        <span className="top-divider" />

        {/* Dynamic Hardware vs. Simulation Status Indicator */}
        {isHardwareConnected ? (
          <div
            className="top-status"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--risk-safe)',
            }}
          >
            <span style={{ position: 'relative', display: 'flex', width: 7, height: 7 }}>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'var(--risk-safe)',
                  opacity: 0.75,
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  borderRadius: '50%',
                  width: 7,
                  height: 7,
                  background: 'var(--risk-safe)',
                }}
              />
            </span>
            <span className="live-text" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
              LIVE HARDWARE (COM3)
            </span>
          </div>
        ) : (
          <div
            className="top-status"
            style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.25)',
              color: 'var(--yellow)',
              cursor: 'pointer',
            }}
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            title="Hardware Offline — Click to toggle synthetic simulation loop"
          >
            <Cpu size={13} style={{ color: 'var(--yellow)' }} />
            <span className="live-text" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
              DEMO MODE {isSimulationRunning ? '(SYNTHETIC TELEMETRY)' : '(PAUSED)'}
            </span>
          </div>
        )}

        <span className="top-divider desktop-only" />

        <span className="muted desktop-only" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Right section: Actions */}
      <div className="top-actions">
        {/* Simulation Toggle Button when Offline */}
        {!isHardwareConnected && (
          <button
            className="top-pill-button desktop-only"
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            title={isSimulationRunning ? 'Pause Simulation Loop' : 'Resume Simulation Loop'}
            style={{
              background: isSimulationRunning ? 'rgba(255, 193, 7, 0.12)' : 'var(--panel-elevated)',
              color: isSimulationRunning ? 'var(--yellow)' : 'var(--text-secondary)',
              borderColor: isSimulationRunning ? 'rgba(255, 193, 7, 0.3)' : 'var(--border-subtle)',
            }}
          >
            {isSimulationRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isSimulationRunning ? 'Simulation Ticking' : 'Simulation Paused'}</span>
          </button>
        )}

        {/* Chrome Push Toggle */}
        <button
          className="top-pill-button desktop-only"
          onClick={enableChromeNotifications}
          title="Enable Chrome Push Notifications"
          style={{
            background: notificationsEnabled ? 'var(--yellow)' : 'var(--panel-elevated)',
            color: notificationsEnabled ? '#080B10' : 'var(--text-secondary)',
            borderColor: notificationsEnabled ? 'var(--yellow)' : 'var(--border-subtle)',
            fontWeight: notificationsEnabled ? 800 : 600,
          }}
        >
          {notificationsEnabled ? <BellRing size={13} /> : <Bell size={13} />}
          <span>{notificationsEnabled ? 'Push Active' : 'Notifications'}</span>
        </button>

        {/* Offline Mode Toggle */}
        <button
          className="top-pill-button desktop-only"
          onClick={() => setIsOffline(!isOffline)}
          title="Toggle Privacy Mode"
        >
          {isOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
          <span>{isOffline ? 'LOCAL PROCESSING' : 'Online Hub'}</span>
        </button>

        {/* Alert Bell */}
        <button
          className="icon-button relative"
          onClick={() => setActiveView('Alerts')}
          aria-label="View alerts"
          title="System Risk Advisories"
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
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
