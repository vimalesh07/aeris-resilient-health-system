'use client'

import React from 'react'
import { Activity, Cpu, Menu, Play, Pause, Wifi, WifiOff } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function TopBar({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const {
    isOffline,
    setIsOffline,
    setActiveView,
    isHardwareConnected,
    transport,
    isSimulationRunning,
    setIsSimulationRunning,
  } = useTelemetry()

  return (
    <header className="topbar white-glassmorphism rounded-full relative flex items-center justify-between w-full px-5 sm:px-7">
      {/* Left: Logo / Brand */}
      <div className="flex items-center gap-3 z-10">
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

        <div
          className="topbar-brand flex items-center gap-2.5"
          onClick={() => setActiveView('Dashboard')}
          style={{ cursor: 'pointer' }}
          title="Go to Home Dashboard"
        >
          <span className="brand-mark">
            <Activity size={15} />
          </span>
          <strong className="brand-title">AERIS</strong>
        </div>

        <span className="top-divider desktop-only" />

        <span className="muted desktop-only" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Center: Live Hardware Indicator (Only shown when live physical sensor stream is active) */}
      {isHardwareConnected && (
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-auto z-10">
          <div
            className="top-status flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--risk-safe)',
              whiteSpace: 'nowrap',
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
            <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              LIVE HARDWARE ({transport.includes('WiFi') ? 'WIFI' : 'STREAM'})
            </span>
          </div>
        </div>
      )}

      {/* Right: Actions */}
      <div className="top-actions flex items-center gap-2 sm:gap-2.5 z-10">
        {/* Simulation Toggle Button when Offline */}
        {!isHardwareConnected && (
          <button
            className="top-pill-button desktop-only"
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            title={isSimulationRunning ? 'Pause Simulation Loop' : 'Resume Simulation Loop'}
            style={{
              background: isSimulationRunning ? 'rgba(254, 242, 242, 0.9)' : 'rgba(255, 255, 255, 0.85)',
              color: isSimulationRunning ? '#DC2626' : 'var(--text-secondary)',
              borderColor: isSimulationRunning ? 'rgba(220, 38, 38, 0.3)' : 'rgba(226, 232, 240, 0.9)',
            }}
          >
            {isSimulationRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isSimulationRunning ? 'Sim Ticking' : 'Sim Paused'}</span>
          </button>
        )}

        {/* Offline Mode Toggle */}
        <button
          className="top-pill-button desktop-only"
          onClick={() => setIsOffline(!isOffline)}
          title="Toggle Privacy Mode"
          style={{
            background: isOffline ? '#FEF2F2' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isOffline ? 'rgba(220, 38, 38, 0.3)' : 'rgba(226, 232, 240, 0.9)',
            color: isOffline ? 'var(--main-red)' : 'var(--text-secondary)',
          }}
        >
          {isOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
          <span>{isOffline ? 'LOCAL PROCESSING' : 'Online Hub'}</span>
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
