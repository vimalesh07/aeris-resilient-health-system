'use client'

import React, { useEffect, useState } from 'react'
import {
  Activity,
  CloudSun,
  History,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Settings2,
  Waves,
  X,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { AICompanionView } from '@/components/views/AICompanionView'
import { ClimateHealthView } from '@/components/views/ClimateHealthView'
import { DashboardView } from '@/components/views/DashboardView'
import { HealthHistoryView } from '@/components/views/HealthHistoryView'
import { SafePlacesView } from '@/components/views/SafePlacesView'
import { SettingsView } from '@/components/views/SettingsView'
import { StressWellbeingView } from '@/components/views/StressWellbeingView'
import { HeartRateLimitSosPopup } from '@/components/HeartRateLimitSosPopup'
import { EmergencySosModal } from '@/components/EmergencySosModal'
import { PushNotificationToast } from '@/components/PushNotificationToast'
import { useScrollReveal } from '@/components/ScrollReveal'
import { TelemetryProvider, useTelemetry } from '@/hooks/useTelemetry'

function MainApp() {
  const { activeView, setActiveView, isSosActive, dismissSos, isHardwareConnected, transport } = useTelemetry()
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  // Attach fluid scroll reveal observer for scrolling animations
  useScrollReveal(activeView)

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Prevent background scrolling when mobile menu drawer is open (bulletproof across iOS & Android)
  useEffect(() => {
    if (mobileMenuOpen) {
      const scrollY = window.scrollY
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      const originalBodyPosition = document.body.style.position
      const originalBodyTop = document.body.style.top
      const originalBodyWidth = document.body.style.width

      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
        document.body.style.position = originalBodyPosition
        document.body.style.top = originalBodyTop
        document.body.style.width = originalBodyWidth
        window.scrollTo(0, scrollY)
      }
    }
  }, [mobileMenuOpen])

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard':
      case 'Overview':
        return <DashboardView />
      case 'Stress & Well-being':
        return <StressWellbeingView />
      case 'Climate Health':
        return <ClimateHealthView />
      case 'Safe Places':
      case 'Safe Place Finder':
      case 'SafePlace Finder':
        return <SafePlacesView />
      case 'Analytics':
      case 'Health Analytics':
      case 'Health History':
      case 'History':
        return <HealthHistoryView />
      case 'AI Companion':
        return <AICompanionView />
      case 'Settings':
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  const handleMobileNavigate = (targetView: string) => {
    setActiveView(targetView)
    setMobileMenuOpen(false)
  }

  const MOBILE_MAIN_ITEMS = [
    { label: 'SafePlace Finder', view: 'Safe Places', icon: MapPin, desc: 'Nearby emergency hospitals, clinics & cooling shelters' },
    { label: 'Dashboard', view: 'Dashboard', icon: LayoutDashboard, desc: 'Home & live emergency overview' },
  ]

  const MOBILE_INTELLIGENCE_ITEMS = [
    { label: 'Stress & Well-being', icon: Waves, desc: 'HRV-driven ANS balance & cognitive load' },
    { label: 'Climate Health', icon: CloudSun, desc: 'Heat, humidity & AQI vulnerability metrics' },
  ]

  const MOBILE_SYSTEM_ITEMS = [
    { label: 'AI Companion', icon: MessageSquareText, desc: 'Contextual LLM clinical assistant' },
    { label: 'Analytics', icon: History, desc: 'Heat trends, biometric archives & telemetry' },
    { label: 'Settings', icon: Settings2, desc: 'Personal baseline vitals & alert setup' },
  ]

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          onTouchMove={(e) => e.preventDefault()}
          className="mobile-drawer-backdrop"
          aria-hidden="true"
        />
      )}

      {/* Mobile Top Hamburger Drawer Menu */}
      {mobileMenuOpen && (
        <aside className="mobile-drawer" aria-label="Mobile Navigation Menu">
          {/* Drawer Header */}
          <div className="mobile-drawer-header">
            <div
              className="topbar-brand"
              onClick={() => handleMobileNavigate('Dashboard')}
              style={{ cursor: 'pointer' }}
              title="Go to Home Dashboard"
            >
              <span className="brand-mark">
                <Activity size={16} />
              </span>
              <strong className="brand-title">AERIS</strong>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="icon-button"
              aria-label="Close navigation menu"
              title="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="mobile-drawer-body">
            {/* Section 1: Main Features */}
            <p className="mobile-drawer-section-title">Main Navigation</p>
            <div className="mobile-drawer-nav">
              {MOBILE_MAIN_ITEMS.map(({ label, view, icon: Icon, desc }) => (
                <button
                  key={label}
                  className={`mobile-drawer-item ${activeView === (view || label) || (view === 'Safe Places' && (activeView === 'Safe Places' || activeView === 'SafePlace Finder')) ? 'active' : ''}`}
                  onClick={() => handleMobileNavigate(view || label)}
                >
                  <div className="mobile-drawer-icon" style={{ position: 'relative' }}>
                    <Icon size={18} />
                  </div>
                  <div className="mobile-drawer-text">
                    <span className="mobile-drawer-label">{label}</span>
                    <span className="mobile-drawer-desc">{desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Section 2: Health Intelligence */}
            <p className="mobile-drawer-section-title">Health Intelligence</p>
            <div className="mobile-drawer-nav">
              {MOBILE_INTELLIGENCE_ITEMS.map(({ label, icon: Icon, desc }) => (
                <button
                  key={label}
                  className={`mobile-drawer-item ${activeView === label ? 'active' : ''}`}
                  onClick={() => handleMobileNavigate(label)}
                >
                  <div className="mobile-drawer-icon">
                    <Icon size={18} />
                  </div>
                  <div className="mobile-drawer-text">
                    <span className="mobile-drawer-label">{label}</span>
                    <span className="mobile-drawer-desc">{desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Section 3: System Tools & Settings */}
            <p className="mobile-drawer-section-title">System & Operations</p>
            <div className="mobile-drawer-nav">
              {MOBILE_SYSTEM_ITEMS.map(({ label, icon: Icon, desc }) => {
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
                    className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleMobileNavigate(label)}
                  >
                    <div className="mobile-drawer-icon">
                      <Icon size={18} />
                    </div>
                    <div className="mobile-drawer-text">
                      <span className="mobile-drawer-label">{label}</span>
                      <span className="mobile-drawer-desc">{desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="mobile-drawer-footer">
            <div
              className="profile"
              onClick={() => handleMobileNavigate('Settings')}
              style={{ cursor: 'pointer', margin: 0 }}
            >
              <span className="avatar">VM</span>
              <div>
                <strong>Vimal</strong>
                <small>{isHardwareConnected ? `${transport} Active` : 'Personal Edge Hub'}</small>
              </div>
              <Settings2 size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </aside>
      )}

      {/* Desktop Left Sidebar (Unchanged for laptop/desktop view) */}
      <Sidebar open={false} setOpen={() => {}} />

      {/* Main Content Wrapper */}
      <main className="main-content">
        <PushNotificationToast />
        <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        {isSosActive && <EmergencySosModal onClose={dismissSos} />}
        <HeartRateLimitSosPopup thresholdBpm={115} />
        <div key={activeView} className="animate-slide-up-right">
          {renderView()}
        </div>
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <TelemetryProvider>
      <MainApp />
    </TelemetryProvider>
  )
}
