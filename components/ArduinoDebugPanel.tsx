'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Cpu, Terminal } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function ArduinoDebugPanel() {
  const { arduinoData, wsConnected, arduinoConnected, rawLogs } = useTelemetry()
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <div
      style={{
        margin: '16px 0',
        background: 'var(--panel-bg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--panel-elevated)',
          border: 0,
          color: 'var(--text-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={16} style={{ color: 'var(--yellow)' }} />
          <span>Arduino UNO MAX30102 Device Diagnostics (COM3 @ 115200 baud)</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              background: arduinoConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(198, 40, 40, 0.15)',
              color: arduinoConnected ? 'var(--risk-safe)' : 'var(--risk-critical)',
              border: `1px solid ${arduinoConnected ? 'rgba(16,185,129,0.3)' : 'rgba(198,40,40,0.3)'}`,
            }}
          >
            {arduinoConnected ? 'COM3 ONLINE' : 'COM3 OFFLINE'}
          </span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expanded Debug Dashboard */}
      {isOpen && (
        <div style={{ padding: 16, color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>WebSocket Bridge</div>
              <strong style={{ fontSize: 12, color: wsConnected ? 'var(--risk-safe)' : 'var(--risk-critical)' }}>
                {wsConnected ? 'ws://localhost:3001' : 'Disconnected'}
              </strong>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Serial Port (COM3)</div>
              <strong style={{ fontSize: 12, color: arduinoData?.connected ? 'var(--risk-safe)' : 'var(--risk-critical)' }}>
                {arduinoData?.connected ? 'CONNECTED (115200)' : 'UNPLUGGED'}
              </strong>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>MAX30102 State</div>
              <strong style={{ fontSize: 12, color: 'var(--yellow)' }}>
                {arduinoData?.status || 'UNKNOWN'}
              </strong>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Finger Detection</div>
              <strong style={{ fontSize: 12, color: arduinoData?.fingerDetected ? 'var(--risk-safe)' : 'var(--yellow)' }}>
                {arduinoData?.fingerDetected ? 'Finger Placed' : 'No Finger Detected'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 14 }}>
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
              <small style={{ color: 'var(--text-muted)', fontSize: 10 }}>BPM (Stable)</small>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--yellow)' }}>
                {arduinoData?.stableBpm || arduinoData?.bpm || '--'}
              </div>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
              <small style={{ color: 'var(--text-muted)', fontSize: 10 }}>SpO₂ (Stable)</small>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--yellow)' }}>
                {arduinoData?.stableSpo2 || arduinoData?.spo2 ? `${arduinoData?.stableSpo2 || arduinoData?.spo2}%` : '--'}
              </div>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
              <small style={{ color: 'var(--text-muted)', fontSize: 10 }}>IR Intensity</small>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {arduinoData?.ir ?? '--'}
              </div>
            </div>

            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
              <small style={{ color: 'var(--text-muted)', fontSize: 10 }}>R-Ratio</small>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {arduinoData?.r !== null && arduinoData?.r !== undefined ? arduinoData.r.toFixed(3) : '--'}
              </div>
            </div>
          </div>

          {/* Raw Serial Log Console */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--text-muted)', fontSize: 11 }}>
              <Terminal size={14} />
              <span>Raw Arduino COM3 Serial Stream Feed</span>
            </div>
            <div
              style={{
                background: '#040609',
                borderRadius: 8,
                padding: '10px 12px',
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 11,
                maxHeight: 120,
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                color: 'var(--risk-safe)',
              }}
            >
              {rawLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Waiting for serial input on COM3...</div>
              ) : (
                rawLogs.map((log, i) => (
                  <div key={i} style={{ marginBottom: 2, whiteSpace: 'nowrap' }}>
                    &gt; {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
