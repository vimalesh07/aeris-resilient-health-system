'use client'

import React, { useState } from 'react'
import { Activity, ChevronDown, ChevronUp, Cpu, Radio, Terminal, Wifi, WifiOff } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'

export function ArduinoDebugPanel() {
  const { arduinoData, wsConnected, arduinoConnected, rawLogs } = useTelemetry()
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <div
      style={{
        margin: '20px 0',
        background: '#1F0505',
        border: '1px solid var(--border-yellow)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
      }}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(255,193,7,0.1)',
          border: 0,
          color: '#FFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={16} style={{ color: 'var(--yellow)' }} />
          <span>Arduino UNO MAX30102 Developer Debug Panel (COM3 @ 115200)</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 800,
              background: arduinoConnected ? '#059669' : '#C62828',
              color: '#FFF',
            }}
          >
            {arduinoConnected ? 'COM3 ACTIVE' : 'COM3 OFF'}
          </span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Expanded Debug Dashboard */}
      {isOpen && (
        <div style={{ padding: 16, color: '#FFF', fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 8 }}>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>WebSocket Bridge</div>
              <strong style={{ fontSize: 13, color: wsConnected ? '#10B981' : '#EF4444' }}>
                {wsConnected ? 'Connected (ws://localhost:3001)' : 'Disconnected'}
              </strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 8 }}>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>Serial Port (COM3)</div>
              <strong style={{ fontSize: 13, color: arduinoData?.connected ? '#10B981' : '#EF4444' }}>
                {arduinoData?.connected ? 'CONNECTED (115200 baud)' : 'DISCONNECTED / UNPLUGGED'}
              </strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 8 }}>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>MAX30102 State</div>
              <strong style={{ fontSize: 13, color: 'var(--bright-yellow)' }}>
                {arduinoData?.status || 'UNKNOWN'}
              </strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 8 }}>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>Finger Detection</div>
              <strong style={{ fontSize: 13, color: arduinoData?.fingerDetected ? '#10B981' : '#F59E0B' }}>
                {arduinoData?.fingerDetected ? 'Finger Placed' : 'No Finger Detected'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
              <small style={{ color: '#9CA3AF' }}>BPM (Stable)</small>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--yellow)' }}>
                {arduinoData?.stableBpm || arduinoData?.bpm || '--'}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
              <small style={{ color: '#9CA3AF' }}>SpO₂ (Stable)</small>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--yellow)' }}>
                {arduinoData?.stableSpo2 || arduinoData?.spo2 ? `${arduinoData?.stableSpo2 || arduinoData?.spo2}%` : '--'}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
              <small style={{ color: '#9CA3AF' }}>IR Reading</small>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>
                {arduinoData?.ir ?? '--'}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
              <small style={{ color: '#9CA3AF' }}>R-Ratio</small>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>
                {arduinoData?.r !== null && arduinoData?.r !== undefined ? arduinoData.r.toFixed(3) : '--'}
              </div>
            </div>
          </div>

          {/* Raw Serial Log Console */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#9CA3AF', fontSize: 11 }}>
              <Terminal size={14} />
              <span>Raw Arduino COM3 Serial Stream Feed</span>
            </div>
            <div
              style={{
                background: '#0D0202',
                borderRadius: 8,
                padding: '10px 12px',
                fontFamily: 'monospace',
                fontSize: 11,
                maxHeight: 120,
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#10B981',
              }}
            >
              {rawLogs.length === 0 ? (
                <div style={{ color: '#6B7280' }}>Waiting for serial input from COM3...</div>
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
