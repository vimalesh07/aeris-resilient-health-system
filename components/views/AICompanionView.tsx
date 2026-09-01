'use client'

import React, { useState } from 'react'
import { Bot, Loader2, Send, Sparkles, User, Zap } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { generateCompanionResponse } from '@/lib/companion'
import { ChatMessage } from '@/types/aeris'

export function AICompanionView() {
  const { telemetry, risks, baseline, isOffline } = useTelemetry()

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
        // Explicit Offline Mode Active -> Local Engine
        replyText = generateCompanionResponse(query, telemetry, risks, baseline)
        replySource = 'Local Rule Engine'
      } else {
        // Call live Gemini API Route
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
      console.warn('Gemini API connection fallback to local context engine:', err)
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
    'What hardware sensors are currently active?',
  ]

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="eyebrow">Transparent AI Intelligence Verification</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>AERIS AI Companion</h1>
        <p className="subhead">
          Live AI Assistant showing exact response provenance: <strong>Gemini 3.6 Flash API</strong> vs. <strong>Local Rule Engine</strong>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 16 }}>
        {/* Chat Window */}
        <article className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 560 }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 6 }}>
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
                    width: 34,
                    height: 34,
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
                    maxWidth: '82%',
                    background: msg.sender === 'user' ? '#171717' : '#F3F4F6',
                    color: msg.sender === 'user' ? '#FFF' : '#171717',
                    padding: '12px 16px',
                    borderRadius: 12,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, pt: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
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
                        {msg.source === 'Gemini 3.6 Flash' ? 'Source: Gemini 3.6 Flash API' : 'Source: Local Rule Engine (Offline)'}
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
                <span>Evaluating telemetry via Gemini 3.6 Flash API...</span>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '14px 0 10px' }}>
            {presets.map((preset) => (
              <button
                key={preset}
                disabled={isLoading}
                onClick={() => handleSend(preset)}
                style={{
                  border: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  color: '#374151',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about your health signals or weather..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
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
                padding: '0 18px',
                borderRadius: 8,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Send
            </button>
          </div>
        </article>

        {/* Right System Provenance Card */}
        <article className="panel" style={{ padding: 22, background: '#3B0000', color: '#FFF', borderColor: 'var(--yellow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: 'var(--yellow)' }}>
            <Sparkles size={18} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Data Source Audit</h3>
          </div>

          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'rgba(255,193,7,0.15)', padding: 10, borderRadius: 6, border: '1px solid var(--yellow)' }}>
              <span style={{ display: 'block', color: 'var(--yellow)', fontWeight: 800 }}>
                {isOffline ? '⚡ Offline Engine Active' : '✨ Gemini 3.6 Flash Active'}
              </span>
              <small style={{ color: '#FFF', fontSize: 10 }}>
                {isOffline
                  ? 'All responses generated locally using rule-based context engine.'
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
