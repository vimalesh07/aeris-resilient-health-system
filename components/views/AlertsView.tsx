'use client'

import React, { useState } from 'react'
import { AlertTriangle, Bell, BellRing, CheckCircle, Eye, Trash2, X } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { AlertItem } from '@/types/aeris'

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
            background: 'rgba(0,0,0,0.85)',
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
              padding: 22,
              background: '#FFF',
              color: '#171717',
              borderRadius: 18,
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className={`badge ${selectedAlert.severity.toLowerCase()}`}>{selectedAlert.severity} Severity</span>
              <button
                onClick={() => setSelectedAlert(null)}
                style={{
                  width: 44,
                  height: 44,
                  display: 'grid',
                  placeItems: 'center',
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '50%',
                }}
                aria-label="Close alert details"
              >
                <X size={22} />
              </button>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#171717' }}>{selectedAlert.title}</h2>
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 14, lineHeight: 1.5 }}>{selectedAlert.trigger}</p>

            <h4 style={{ fontSize: 12, fontWeight: 800, margin: '0 0 6px', color: '#171717', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Supporting Telemetry Signals</h4>
            <ul style={{ paddingLeft: 18, fontSize: 12, color: '#4B5563', marginBottom: 16 }}>
              {selectedAlert.supportingSignals.map((sig, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {sig}
                </li>
              ))}
            </ul>

            <div style={{ background: '#FEF3C7', padding: 12, borderRadius: 10, fontSize: 12, color: '#78350F', fontWeight: 700, marginBottom: 18, lineHeight: 1.5 }}>
              Recommended Action: {selectedAlert.recommendedAction}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="demo-toggle"
                onClick={() => {
                  acknowledgeAlert(selectedAlert.id)
                  setSelectedAlert(null)
                }}
                style={{ background: 'var(--yellow)', color: '#171717', border: 0, minHeight: 44, padding: '0 18px', width: '100%', justifyContent: 'center' }}
              >
                <CheckCircle size={16} /> Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="eyebrow">Real-Time Risk Advisories</p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '4px 0 6px', color: '#FFF' }}>System Alerts</h1>
          <p className="subhead">
            Dynamic early warnings generated on-device when telemetry anomalies cross personal baseline thresholds.
          </p>
        </div>

        {/* Chrome Push Notification Toggle Button */}
        <button
          className="demo-toggle"
          onClick={enableChromeNotifications}
          style={{
            background: notificationsEnabled ? 'var(--yellow)' : 'rgba(255,255,255,0.1)',
            color: notificationsEnabled ? '#171717' : '#FFF',
            border: 0,
            minHeight: 44,
            padding: '8px 16px',
            fontWeight: 800,
          }}
        >
          {notificationsEnabled ? <BellRing size={16} /> : <Bell size={16} />}
          <span>{notificationsEnabled ? 'Chrome Desktop Push Active' : 'Enable Chrome Alerts'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.length === 0 ? (
          <article className="panel" style={{ padding: 28, textAlign: 'center', color: '#6B7280' }}>
            <CheckCircle size={32} style={{ color: '#10B981', margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: 17, color: '#171717', margin: 0 }}>Zero Active System Alerts</h3>
            <p style={{ fontSize: 12, margin: '4px 0 0' }}>All 5 core sensors reporting signals within personal baseline limits.</p>
          </article>
        ) : (
          alerts.map((alert) => (
            <article
              className="panel"
              key={alert.id}
              style={{
                padding: 16,
                borderLeft: `5px solid ${alert.severity === 'Critical' ? 'var(--main-red)' : alert.severity === 'High' ? '#F97316' : 'var(--yellow)'}`,
                opacity: alert.acknowledged ? 0.75 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#171717' }}>{alert.title}</h3>
                    <span className={`badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                    {alert.acknowledged && <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>✓ Acknowledged</span>}
                  </div>
                  <small style={{ color: '#6B7280', fontSize: 11 }}>Triggered at {alert.time}</small>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="outline-button"
                    onClick={() => setSelectedAlert(alert)}
                    style={{ padding: '6px 12px', minHeight: 38, fontSize: 11 }}
                  >
                    <Eye size={14} /> View Details
                  </button>

                  {!alert.acknowledged && (
                    <button
                      className="demo-toggle"
                      onClick={() => acknowledgeAlert(alert.id)}
                      style={{ padding: '6px 12px', minHeight: 38, fontSize: 11, background: 'var(--yellow)', color: '#171717', border: 0 }}
                    >
                      <CheckCircle size={14} /> Acknowledge
                    </button>
                  )}

                  <button
                    className="icon-button"
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss alert"
                    style={{ width: 38, height: 38, minWidth: 38, minHeight: 38 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#374151', margin: '10px 0 8px', lineHeight: 1.5 }}>{alert.trigger}</p>

              <div style={{ background: '#F9FAFB', padding: 10, borderRadius: 8, fontSize: 12, color: '#4B5563' }}>
                <strong>Recommended Action:</strong> {alert.recommendedAction}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
