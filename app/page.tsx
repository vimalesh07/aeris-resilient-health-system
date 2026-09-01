'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  BrainCircuit,
  HeartPulse,
  LayoutDashboard,
  Menu,
  MessageSquareText,
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
  const { activeView, setActiveView } = useTelemetry()
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

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

  return (
    <div className="app-shell">
      <Sidebar open={mobileMenuOpen} setOpen={setMobileMenuOpen} />

      <main className="main-content">
        <button
          className="menu-trigger icon-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open mobile navigation"
        >
          <Menu size={20} />
        </button>

        <TopBar />
        {renderView()}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom">
        {[
          { label: 'Dashboard', icon: LayoutDashboard },
          { label: 'Vitals', icon: HeartPulse },
          { label: 'Risks', view: 'Risk Intelligence', icon: BrainCircuit },
          { label: 'Alerts', icon: AlertTriangle },
          { label: 'AI', view: 'AI Companion', icon: MessageSquareText },
        ].map(({ label, view, icon: Icon }) => {
          const targetView = view || label
          return (
            <button
              key={label}
              className={activeView === targetView ? 'active' : ''}
              onClick={() => setActiveView(targetView)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
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
