'use client'

import React, { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CloudSun,
  Cpu,
  HeartPulse,
  History,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Navigation,
  Settings2,
  ShieldCheck,
  Waves,
  X,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { AICompanionView } from '@/components/views/AICompanionView'
import { AlertsView } from '@/components/views/AlertsView'
import { ClimateHealthView } from '@/components/views/ClimateHealthView'
import { DashboardView } from '@/components/views/DashboardView'
import { HealthHistoryView } from '@/components/views/HealthHistoryView'
import { MobilityView } from '@/components/views/MobilityView'
import { PrivacyView } from '@/components/views/PrivacyView'
import { RiskIntelligenceView } from '@/components/views/RiskIntelligenceView'
import { SafePlacesView } from '@/components/views/SafePlacesView'
import { SettingsView } from '@/components/views/SettingsView'
import { StressWellbeingView } from '@/components/views/StressWellbeingView'
import { VitalsView } from '@/components/views/VitalsView'
import { HeartRateLimitSosPopup } from '@/components/HeartRateLimitSosPopup'
import { EmergencySosModal } from '@/components/EmergencySosModal'
import { TelemetryProvider, useTelemetry } from '@/hooks/useTelemetry'

function MainApp() {
  const { activeView, setActiveView, alerts, isSosActive, dismissSos, isHardwareConnected } = useTelemetry()
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  const unackAlertCount = alerts.filter((a) => !a.acknowledged).length

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

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard':
      case 'Overview':
        return <DashboardView />
      case 'Vitals':
        return <VitalsView />
      case 'Risk Intelligence':
        return <RiskIntelligenceView />
      case 'Stress & Well-being':
        return <StressWellbeingView />
      case 'Mobility':
        return <MobilityView />
      case 'Climate Health':
        return <ClimateHealthView />
      case 'Alerts':
        return <AlertsView />
      case 'Safe Places':
      case 'Safe Place Finder':
      case 'SafePlace Finder':
        return <SafePlacesView />
      case 'Health History':
      case 'History':
        return <HealthHistoryView />
      case 'AI Companion':
        return <AICompanionView />
      case 'Privacy & Data':
      case 'Privacy':
        return <PrivacyView />
      case 'Settings':
      case 'Device Diagnostics':
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
    { label: 'Vitals', view: 'Vitals', icon: HeartPulse, desc: 'Real-time MAX30102 vitals stream' },
    { label: 'Alerts', view: 'Alerts', icon: AlertTriangle, desc: 'Active risk alerts & emergency SOS', hasAlertBadge: true },
  ]

  const MOBILE_INTELLIGENCE_ITEMS = [
    { label: 'Risk Intelligence', icon: BrainCircuit, desc: 'Predictive multivariant health risk index' },
    { label: 'Stress & Well-being', icon: Waves, desc: 'HRV-driven ANS balance & cognitive load' },
    { label: 'Mobility', icon: Navigation, desc: 'Gait symmetry & active fall detection' },
    { label: 'Climate Health', icon: CloudSun, desc: 'Heat, humidity & AQI vulnerability metrics' },
  ]

  const MOBILE_SYSTEM_ITEMS = [
    { label: 'AI Companion', icon: MessageSquareText, desc: 'Contextual LLM clinical assistant' },
    { label: 'Health History', icon: History, desc: 'Longitudinal telemetry archives' },
    { label: 'Privacy & Data', icon: ShieldCheck, desc: 'Zero-cloud local cryptographic vault' },
    { label: 'Device Diagnostics', icon: Cpu, desc: 'COM3 serial hardware bridge & MAX30102' },
    { label: 'Settings', icon: Settings2, desc: 'Personal baseline vitals & alert setup' },
  ]

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
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
              {MOBILE_MAIN_ITEMS.map(({ label, view, icon: Icon, desc, hasAlertBadge }) => (
                <button
                  key={label}
                  className={`mobile-drawer-item ${activeView === (view || label) || (view === 'Safe Places' && (activeView === 'Safe Places' || activeView === 'SafePlace Finder')) ? 'active' : ''}`}
                  onClick={() => handleMobileNavigate(view || label)}
                >
                  <div className="mobile-drawer-icon" style={{ position: 'relative' }}>
                    <Icon size={18} />
                    {hasAlertBadge && unackAlertCount > 0 && (
                      <span className="bottom-nav-alert-badge">
                        {unackAlertCount}
                      </span>
                    )}
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
              {MOBILE_SYSTEM_ITEMS.map(({ label, icon: Icon, desc }) => (
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
                <small>{isHardwareConnected ? 'COM3 Live Hardware' : 'Personal Edge Hub'}</small>
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
        <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        {isSosActive && <EmergencySosModal onClose={dismissSos} />}
        <HeartRateLimitSosPopup thresholdBpm={115} />
        {renderView()}
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
