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
        <p className="eyebrow">Transparent AI Intelligence Verification</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '4px 0 6px', color: '#FFF' }}>AERIS AI Companion</h1>
        <p className="subhead">
          Live AI Assistant showing exact response provenance: <strong>Gemini 3.6 Flash API</strong> vs. <strong>Local Rule Engine</strong>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Chat Window */}
        <article className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', height: 'clamp(460px, 60vh, 580px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
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
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: msg.sender === 'user' ? '#171717' : 'var(--yellow)',
                    color: msg.sender === 'user' ? '#FFF' : '#171717',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={18} />}
                </span>

                <div
                  style={{
                    maxWidth: '85%',
                    background: msg.sender === 'user' ? '#171717' : '#F3F4F6',
                    color: msg.sender === 'user' ? '#FFF' : '#171717',
                    padding: '12px 14px',
                    borderRadius: 14,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 4 }}>
                    {msg.sender === 'aeris' && msg.source && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: msg.source === 'Gemini 3.6 Flash' ? '#FEF3C7' : '#E5E7EB',
                          color: msg.source === 'Gemini 3.6 Flash' ? '#78350F' : '#374151',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        {msg.source === 'Gemini 3.6 Flash' ? <Sparkles size={11} /> : <Zap size={11} />}
                        {msg.source === 'Gemini 3.6 Flash' ? '✨ Gemini' : '⚡ Local'}
                      </span>
                    )}

                    <small style={{ opacity: 0.6, fontSize: 10, marginLeft: 'auto' }}>{msg.timestamp}</small>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#6B7280', fontSize: 12 }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Evaluating telemetry...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Touch-Friendly Prompt Shortcuts */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', margin: '12px 0 10px', paddingBottom: 4 }}>
            {presets.map((preset) => (
              <button
                key={preset}
                disabled={isLoading}
                onClick={() => handleSend(preset)}
                style={{
                  border: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  color: '#374151',
                  padding: '6px 12px',
                  minHeight: 38,
                  borderRadius: 20,
                  fontSize: 11,
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

          {/* Input Box with Min 44px Touch Standard */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your health signals or weather..."
              style={{
                flex: 1,
                padding: '10px 14px',
                minHeight: 44,
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              disabled={isLoading}
              onClick={() => handleSend()}
              style={{
                background: 'var(--yellow)',
                color: '#171717',
                border: 0,
                padding: '0 16px',
                minHeight: 44,
                borderRadius: 10,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>Send</span>
            </button>
          </div>
        </article>

        {/* Right System Provenance Audit Card */}
        <article className="panel" style={{ padding: 20, background: '#3B0000', color: '#FFF', borderColor: 'var(--yellow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: 'var(--yellow)' }}>
            <Sparkles size={18} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Data Source Audit</h3>
          </div>

          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'rgba(255,193,7,0.15)', padding: 10, borderRadius: 8, border: '1px solid var(--yellow)' }}>
              <span style={{ display: 'block', color: 'var(--yellow)', fontWeight: 800 }}>
                {isOffline ? '⚡ Offline Engine Active' : '✨ Gemini 3.6 Flash Active'}
              </span>
              <small style={{ color: '#FFF', fontSize: 10 }}>
                {isOffline
                  ? 'Responses generated locally on-device using rule engine.'
                  : 'Live responses generated via Google Gemini 3.6 Flash API.'}
              </small>
            </div>

            <div>Current HR: <strong>{telemetry.heartRate} BPM</strong></div>
            <div>Current HRV: <strong>{telemetry.hrv} ms</strong></div>
            <div>Body Temp: <strong>{telemetry.bodyTemp}°C</strong></div>
            <div>Ambient Temp: <strong>{telemetry.ambientTemp}°C</strong></div>
            <div>Overall Risk: <strong>{risks.overall} / 100</strong></div>
          </div>
        </article>
      </div>
    </div>
  )
}
