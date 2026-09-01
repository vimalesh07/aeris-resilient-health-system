'use client'

import React, { useState } from 'react'
import { AlertTriangle, Bell, BellRing, CheckCircle, Eye, Trash2, X } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { AlertItem } from '@/types/aeris'

export function AlertsView() {
  const { alerts, acknowledgeAlert, dismissAlert, notificationsEnabled, enableChromeNotifications } = useTelemetry()
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)

  return (
    <div style={{ paddingTop: 20 }}>
      {selectedAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.8)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div className="panel" style={{ width: '100%', maxWidth: 500, padding: 26, background: '#FFF', color: '#171717' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span className={`badge ${selectedAlert.severity.toLowerCase()}`}>{selectedAlert.severity} Severity</span>
              <button onClick={() => setSelectedAlert(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px', color: '#171717' }}>{selectedAlert.title}</h2>
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>{selectedAlert.trigger}</p>

            <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px', color: '#171717' }}>Supporting Telemetry Signals</h4>
            <ul style={{ paddingLeft: 20, fontSize: 12, color: '#4B5563', marginBottom: 20 }}>
              {selectedAlert.supportingSignals.map((sig, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {sig}
                </li>
              ))}
            </ul>

            <div style={{ background: '#FEF3C7', padding: 12, borderRadius: 8, fontSize: 12, color: '#78350F', fontWeight: 700, marginBottom: 20 }}>
              Recommended Action: {selectedAlert.recommendedAction}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="demo-toggle"
                onClick={() => {
                  acknowledgeAlert(selectedAlert.id)
                  setSelectedAlert(null)
                }}
                style={{ background: 'var(--yellow)', color: '#171717', border: 0 }}
              >
                <CheckCircle size={15} /> Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Real-Time Risk Advisories</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>System Alerts</h1>
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
            padding: '10px 16px',
            fontWeight: 800,
          }}
        >
          {notificationsEnabled ? <BellRing size={16} /> : <Bell size={16} />}
          <span>{notificationsEnabled ? 'Chrome Desktop Push Active' : 'Enable Chrome Notifications'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {alerts.length === 0 ? (
          <article className="panel" style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
            <CheckCircle size={32} style={{ color: '#10B981', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 18, color: '#171717', margin: 0 }}>Zero Active System Alerts</h3>
            <p style={{ fontSize: 13, margin: '6px 0 0' }}>All 5 core sensors reporting signals within personal baseline limits.</p>
          </article>
        ) : (
          alerts.map((alert) => (
            <article
              className="panel"
              key={alert.id}
              style={{
                padding: 20,
                borderLeft: `6px solid ${alert.severity === 'Critical' ? 'var(--main-red)' : alert.severity === 'High' ? '#F97316' : 'var(--yellow)'}`,
                opacity: alert.acknowledged ? 0.75 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#171717' }}>{alert.title}</h3>
                    <span className={`badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                    {alert.acknowledged && <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>✓ Acknowledged</span>}
                  </div>
                  <small style={{ color: '#6B7280', fontSize: 11 }}>Triggered at {alert.time}</small>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="outline-button"
                    onClick={() => setSelectedAlert(alert)}
                    style={{ padding: '6px 12px', fontSize: 11 }}
                  >
                    <Eye size={14} /> View Details
                  </button>

                  {!alert.acknowledged && (
                    <button
                      className="demo-toggle"
                      onClick={() => acknowledgeAlert(alert.id)}
                      style={{ padding: '6px 12px', fontSize: 11, background: 'var(--yellow)', color: '#171717', border: 0 }}
                    >
                      <CheckCircle size={14} /> Acknowledge
                    </button>
                  )}

                  <button
                    className="icon-button"
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss alert"
                    style={{ width: 30, height: 30 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#374151', margin: '12px 0 8px', lineHeight: 1.5 }}>{alert.trigger}</p>

              <div style={{ background: '#F9FAFB', padding: 10, borderRadius: 6, fontSize: 12, color: '#4B5563' }}>
                <strong>Recommended Action:</strong> {alert.recommendedAction}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
