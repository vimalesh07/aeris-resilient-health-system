'use client'

import { SessionControls } from './SessionControls'
import { Building2, ShieldAlert, ArrowRight, Clock, AlertTriangle } from 'lucide-react'

export function GovernmentDashboard({
  profile,
  incidents,
}: {
  profile: { full_name: string; role: 'government' }
  incidents: Array<{
    id: string
    incident_type: string
    severity: string
    status: string
    summary: string
    created_at: string
  }>
}) {
  const quickSwitchRole = async (targetRole: 'user' | 'admin' | 'government') => {
    try {
      const res = await fetch('/api/dev/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = `/${targetRole}`
      } else {
        alert(data.error || 'Could not switch role')
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error switching role')
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '36px clamp(16px, 5vw, 60px)',
        background: 'radial-gradient(ellipse at 50% 10%, rgba(16, 185, 129, 0.08) 0%, #080B10 60%)',
        color: '#F8FAFC',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
          paddingBottom: 24,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 9999,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              marginBottom: 10,
            }}
          >
            <Building2 size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontWeight: 800, fontSize: 11, letterSpacing: '.1em' }}>
              AERIS GOVERNMENT RESILIENCE
            </span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#FFFFFF' }}>
            Public Safety & Incident Feed
          </h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 14 }}>
            Anonymized operational incident dispatch. Private user identities, vitals, and telemetry remain shielded.
          </p>
        </div>
        <SessionControls name={profile.full_name} role="government" />
      </header>

      {/* Portal Testing Switcher Header */}
      <section
        style={{
          marginTop: 20,
          padding: '14px 20px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: '#CBD5E1' }}>
          <strong>Portal Testing Hub:</strong> Jump between roles to verify each portal workflow:
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => quickSwitchRole('user')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60A5FA',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Switch to USER (/user)
          </button>
          <button
            onClick={() => quickSwitchRole('admin')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Switch to ADMIN (/admin)
          </button>
        </div>
      </section>

      {/* Incidents Feed */}
      <section
        style={{
          marginTop: 24,
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
            Active Operational Incidents ({incidents.length})
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8' }}>
                <th style={{ padding: '14px 24px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Severity</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Summary</th>
                <th style={{ padding: '14px 24px', fontWeight: 600 }}>Reported</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length ? (
                incidents.map((incident) => {
                  const isCritical = incident.severity === 'critical' || incident.severity === 'high'
                  return (
                    <tr
                      key={incident.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '16px 24px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase' }}>
                        {incident.incident_type}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                            color: isCritical ? '#F87171' : '#FACC15',
                            border: isCritical ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
                          }}
                        >
                          {incident.severity}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textTransform: 'capitalize', color: '#CBD5E1' }}>
                        {incident.status}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#CBD5E1', maxWidth: 360 }}>
                        {incident.summary}
                      </td>
                      <td style={{ padding: '16px 24px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} />
                          <span>{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: '#94A3B8' }}>
                    <ShieldAlert size={32} color="#475569" style={{ margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No government-visible incidents recorded.</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>
                      Incidents triggered via SOS or emergency thresholds will appear here in real time.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
