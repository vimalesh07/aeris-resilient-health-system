'use client'

import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BrainCircuit,
  Cpu,
  HeartPulse,
  History,
  LayoutDashboard,
  MessageSquareText,
  MoreHorizontal,
  Settings2,
  ShieldCheck,
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
import { SettingsView } from '@/components/views/SettingsView'
import { StressWellbeingView } from '@/components/views/StressWellbeingView'
import { VitalsView } from '@/components/views/VitalsView'
import { TelemetryProvider, useTelemetry } from '@/hooks/useTelemetry'

function MainApp() {
  const { activeView, setActiveView, alerts } = useTelemetry()
  const [moreBottomSheetOpen, setMoreBottomSheetOpen] = useState<boolean>(false)

  const unackAlertCount = alerts.filter((a) => !a.acknowledged).length

  // Close bottom sheet on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreBottomSheetOpen(false)
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
      case 'Health History':
      case 'History':
        return <HealthHistoryView />
      case 'AI Companion':
        return <AICompanionView />
      case 'Privacy & Data':
      case 'Privacy':
        return <PrivacyView />
      case 'Settings':
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  const handleMoreNavigate = (targetView: string) => {
    setActiveView(targetView)
    setMoreBottomSheetOpen(false)
  }

  const MORE_ITEMS = [
    { label: 'AI Companion', view: 'AI Companion', icon: MessageSquareText, desc: 'Contextual LLM Health Assistant' },
    { label: 'Health History', view: 'Health History', icon: History, desc: 'Longitudinal telemetry archives' },
    { label: 'Privacy & Data', view: 'Privacy & Data', icon: ShieldCheck, desc: 'Zero-cloud encryption settings' },
    { label: 'System Settings', view: 'Settings', icon: Settings2, desc: 'Personal baselines & preferences' },
    { label: 'Device Diagnostics', view: 'Settings', icon: Cpu, desc: 'BLE prototype hardware status' },
  ]

  return (
    <div className="app-shell">
      {/* More Bottom Sheet Backdrop */}
      {moreBottomSheetOpen && (
        <div
          onClick={() => setMoreBottomSheetOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
          aria-hidden="true"
        />
      )}

      {/* Mobile Bottom Sheet for More Menu */}
      {moreBottomSheetOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 95,
            background: '#3B0000',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTop: '2px solid var(--yellow)',
            padding: '20px 20px calc(24px + env(safe-area-inset-bottom))',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
            color: '#FFF',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFF' }}>AERIS System & Tools</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--bright-yellow)' }}>Select a module to view</p>
            </div>
            <button
              onClick={() => setMoreBottomSheetOpen(false)}
              style={{
                width: 44,
                height: 44,
                display: 'grid',
                placeItems: 'center',
                border: 0,
                background: 'rgba(255,255,255,0.1)',
                color: '#FFF',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MORE_ITEMS.map(({ label, view, icon: Icon, desc }) => (
              <button
                key={label}
                onClick={() => handleMoreNavigate(view)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  minHeight: 48,
                  background: activeView === view ? 'var(--yellow)' : 'rgba(255,255,255,0.08)',
                  color: activeView === view ? '#171717' : '#FFF',
                  border: 0,
                  borderRadius: 12,
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: activeView === view ? '#171717' : 'rgba(255,193,7,0.2)',
                    color: activeView === view ? 'var(--yellow)' : 'var(--bright-yellow)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div>{label}</div>
                  <small style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>{desc}</small>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <Sidebar open={false} setOpen={() => {}} />

      {/* Main Content Wrapper */}
      <main className="main-content">
        <TopBar />
        {renderView()}
      </main>

      {/* Fixed 64px Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom" aria-label="Mobile bottom navigation">
        {/* 1. Home */}
        <button
          className={activeView === 'Dashboard' || activeView === 'Overview' ? 'active' : ''}
          onClick={() => {
            setActiveView('Dashboard')
            setMoreBottomSheetOpen(false)
          }}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </button>

        {/* 2. Vitals */}
        <button
          className={activeView === 'Vitals' ? 'active' : ''}
          onClick={() => {
            setActiveView('Vitals')
            setMoreBottomSheetOpen(false)
          }}
        >
          <HeartPulse size={20} />
          <span>Vitals</span>
        </button>

        {/* 3. Insights */}
        <button
          className={activeView === 'Risk Intelligence' || activeView === 'Stress & Well-being' || activeView === 'Mobility' || activeView === 'Climate Health' ? 'active' : ''}
          onClick={() => {
            setActiveView('Risk Intelligence')
            setMoreBottomSheetOpen(false)
          }}
        >
          <BrainCircuit size={20} />
          <span>Insights</span>
        </button>

        {/* 4. Alerts */}
        <button
          className={activeView === 'Alerts' ? 'active' : ''}
          onClick={() => {
            setActiveView('Alerts')
            setMoreBottomSheetOpen(false)
          }}
          style={{ position: 'relative' }}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <AlertTriangle size={20} />
            {unackAlertCount > 0 && (
              <span className="bottom-nav-alert-badge">
                {unackAlertCount}
              </span>
            )}
          </div>
          <span>Alerts</span>
        </button>

        {/* 5. More */}
        <button
          className={moreBottomSheetOpen || activeView === 'AI Companion' || activeView === 'Health History' || activeView === 'Privacy & Data' || activeView === 'Settings' ? 'active' : ''}
          onClick={() => setMoreBottomSheetOpen(!moreBottomSheetOpen)}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
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
