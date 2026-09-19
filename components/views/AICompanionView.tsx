'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Bot, Loader2, Send, Sparkles, User, Zap } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { generateCompanionResponse } from '@/lib/companion'
import { ChatMessage } from '@/types/aeris'

export function AICompanionView() {
  const { telemetry, risks, baseline, isOffline } = useTelemetry()
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'aeris',
      text: `Hello Vimal! I am your AERIS Companion. Currently, your overall risk score is ${risks.overall}/100 (${risks.statusLabel}). How can I clarify your signals today?`,
      timestamp: 'Just now',
      source: 'Gemini 3.6 Flash',
    },
  ])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    let replyText = ''
    let replySource: 'Gemini 3.6 Flash' | 'Local Rule Engine' = 'Local Rule Engine'

    try {
      if (isOffline) {
        replyText = generateCompanionResponse(query, telemetry, risks, baseline)
        replySource = 'Local Rule Engine'
      } else {
        const res = await fetch('/api/companion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            telemetry,
            risks,
            baseline,
          }),
        })

        if (!res.ok) {
          throw new Error('Gemini API request failed')
        }

        const data = await res.json()
        if (data.text) {
          replyText = data.text
          replySource = 'Gemini 3.6 Flash'
        } else {
          replyText = generateCompanionResponse(query, telemetry, risks, baseline)
          replySource = 'Local Rule Engine'
        }
      }
    } catch (err) {
      console.warn('Gemini API fallback to local engine:', err)
      replyText = generateCompanionResponse(query, telemetry, risks, baseline)
      replySource = 'Local Rule Engine'
    } finally {
      setIsLoading(false)
      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'aeris',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: replySource,
      }
      setMessages((prev) => [...prev, aiMsg])
    }
  }

  const presets = [
    'Why is my heat risk score elevated?',
    'Explain my physiological stress pattern',
    'Is my body temperature variance normal?',
    'What hardware sensors are active?',
  ]

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">AERIS AI Clinical Assistant</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>AI Companion</h1>
        <p className="subhead">
          Contextual AI Assistant with live provenance tags: <strong>Gemini 3.6 Flash API</strong> vs. <strong>Local Rule Engine</strong>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Chat Window */}
        <article className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', height: 'clamp(460px, 60vh, 580px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: msg.sender === 'user' ? 'var(--panel-elevated)' : 'rgba(255,193,7,0.15)',
                    border: '1px solid var(--border-subtle)',
                    color: msg.sender === 'user' ? 'var(--text-primary)' : 'var(--yellow)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {msg.sender === 'user' ? <User size={15} /> : <Bot size={16} />}
                </span>

                <div
                  style={{
                    maxWidth: '85%',
                    background: msg.sender === 'user' ? 'var(--panel-elevated)' : 'var(--panel-bg)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 4 }}>
                    {msg.sender === 'aeris' && msg.source && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--panel-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: msg.source === 'Gemini 3.6 Flash' ? 'var(--yellow)' : 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        {msg.source === 'Gemini 3.6 Flash' ? <Sparkles size={10} /> : <Zap size={10} />}
                        {msg.source === 'Gemini 3.6 Flash' ? 'Gemini 3.6 Flash' : 'Local Engine'}
                      </span>
                    )}

                    <small style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>{msg.timestamp}</small>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <Loader2 size={15} className="animate-spin" />
                <span>Evaluating telemetry context...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Touch-Friendly Prompt Shortcuts */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', margin: '10px 0', paddingBottom: 4 }}>
            {presets.map((preset) => (
              <button
                key={preset}
                disabled={isLoading}
                onClick={() => handleSend(preset)}
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--panel-elevated)',
                  color: 'var(--text-secondary)',
                  padding: '5px 10px',
                  minHeight: 34,
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your vitals, heat risk, or weather..."
              style={{
                flex: 1,
                padding: '8px 12px',
                minHeight: 40,
                borderRadius: 8,
                background: 'var(--panel-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              disabled={isLoading}
              onClick={() => handleSend()}
              style={{
                background: 'var(--yellow)',
                color: '#080B10',
                border: 0,
                padding: '0 14px',
                minHeight: 40,
                borderRadius: 8,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>Send</span>
            </button>
          </div>
        </article>

        {/* Right System Provenance Audit Card */}
        <article className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--yellow)' }}>
            <Sparkles size={16} />
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Live Telemetry Context Bar</h3>
          </div>

          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-secondary)' }}>
            <div style={{ background: 'var(--panel-elevated)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 8 }}>
              <span style={{ display: 'block', color: 'var(--yellow)', fontWeight: 700, marginBottom: 2 }}>
                {isOffline ? '⚡ Local Rule Engine Active' : '✨ Gemini 3.6 Flash Active'}
              </span>
              <small style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                {isOffline
                  ? 'Responses generated locally on-device.'
                  : 'Live responses generated via Gemini API.'}
              </small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>
              <span>Heart Rate:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{telemetry.heartRate} BPM</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>
              <span>Blood Oxygen:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{telemetry.spo2}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>
              <span>Body Temp:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{telemetry.bodyTemp}°C</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>
              <span>Ambient Temp:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{telemetry.ambientTemp}°C</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>
              <span>Composite Risk Index:</span>
              <strong style={{ color: 'var(--yellow)' }}>{risks.overall} / 100</strong>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
