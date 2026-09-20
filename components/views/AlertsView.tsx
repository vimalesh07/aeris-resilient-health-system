'use client'

import React, { useState } from 'react'
import { Bell, BellRing, CheckCircle, Eye, Trash2, X } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { AlertItem } from '@/types/aeris'
import { RiskBadge } from '@/components/ui/RiskBadge'

export function AlertsView() {
  const { alerts, acknowledgeAlert, dismissAlert, notificationsEnabled, enableChromeNotifications } = useTelemetry()
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)

  return (
    <div style={{ paddingTop: 16 }}>
      {selectedAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
          }}
        >
          <div
            className="panel"
            style={{
              width: '100%',
              maxWidth: 480,
              padding: 20,
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              borderRadius: 12,
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              border: '1px solid var(--border-focus)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <RiskBadge level={selectedAlert.severity} size="sm" />
              <button
                onClick={() => setSelectedAlert(null)}
                style={{
                  width: 32,
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--panel-elevated)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  borderRadius: '50%',
                }}
                aria-label="Close alert details"
              >
                <X size={18} />
              </button>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>{selectedAlert.title}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{selectedAlert.trigger}</p>

            <h4 style={{ fontSize: 11, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Telemetry Rationale</h4>
            <ul style={{ paddingLeft: 16, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 14 }}>
              {selectedAlert.supportingSignals.map((sig, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {sig}
                </li>
              ))}
            </ul>

            <div style={{ background: '#FEF2F2', border: '1px solid rgba(220, 38, 38, 0.25)', padding: 10, borderRadius: 8, fontSize: 12, color: 'var(--main-red)', fontWeight: 600, marginBottom: 16, lineHeight: 1.4 }}>
              Recommended Action: {selectedAlert.recommendedAction}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  acknowledgeAlert(selectedAlert.id)
                  setSelectedAlert(null)
                }}
                style={{
                  background: 'var(--main-red)',
                  color: '#FFFFFF',
                  border: 0,
                  minHeight: 38,
                  padding: '0 16px',
                  width: '100%',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                }}
              >
                <CheckCircle size={15} /> Acknowledge Advisory
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="eyebrow">Real-Time Risk Advisories</p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>Operational Alert Queue</h1>
          <p className="subhead">
            Dynamic early warning advisories generated on-device when physiological signals cross baseline thresholds.
          </p>
        </div>

        {/* Chrome Push Notification Toggle Button */}
        <button
          onClick={enableChromeNotifications}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            border: notificationsEnabled ? '1px solid var(--main-red)' : '1px solid var(--border-subtle)',
            background: notificationsEnabled ? '#FEF2F2' : 'var(--panel-elevated)',
            color: notificationsEnabled ? 'var(--main-red)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          {notificationsEnabled ? <BellRing size={14} /> : <Bell size={14} />}
          <span>{notificationsEnabled ? 'Desktop Push Active' : 'Enable Desktop Push'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.length === 0 ? (
          <article className="panel" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle size={28} style={{ color: 'var(--risk-safe)', margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>Zero Active System Alerts</h3>
            <p style={{ fontSize: 12, margin: '4px 0 0' }}>All 5 core sensors reporting signals strictly within personal baseline limits.</p>
          </article>
        ) : (
          alerts.map((alert) => (
            <article
              className="panel"
              key={alert.id}
              style={{
                padding: 16,
                borderLeft: `4px solid ${alert.severity === 'Critical' ? 'var(--risk-critical)' : alert.severity === 'High' ? 'var(--risk-warning)' : 'var(--main-red)'}`,
                opacity: alert.acknowledged ? 0.65 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{alert.title}</h3>
                    <RiskBadge level={alert.severity} size="sm" />
                    {alert.acknowledged && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--risk-safe)', fontWeight: 700 }}>✓ ACKNOWLEDGED</span>}
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Triggered at {alert.time}</small>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      background: 'var(--panel-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={13} /> View Details
                  </button>

                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 10px',
                        background: 'var(--main-red)',
                        color: '#FFFFFF',
                        border: 0,
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(220, 38, 38, 0.25)',
                      }}
                    >
                      <CheckCircle size={13} /> Acknowledge
                    </button>
                  )}

                  <button
                    className="icon-button"
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss alert"
                    style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '8px 0 8px', lineHeight: 1.5 }}>{alert.trigger}</p>

              <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--main-red)' }}>Recommended Action:</strong> {alert.recommendedAction}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
