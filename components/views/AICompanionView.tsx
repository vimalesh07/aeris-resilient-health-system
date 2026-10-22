'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Bot, Cpu, Loader2, Send, Sparkles, User, Zap } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { generateEdgeAiResponse } from '@/lib/edge-ai-companion'
import { ChatMessage } from '@/types/aeris'

export function AICompanionView() {
  const { telemetry, risks, baseline, isOffline, setIsOffline } = useTelemetry()
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
    let replySource: 'Gemini 3.6 Flash' | 'Local Edge AI' = 'Local Edge AI'
    let supportingData: ChatMessage['supportingData'] = undefined

    try {
      if (isOffline) {
        const edgeRes = generateEdgeAiResponse(query, telemetry, risks, baseline)
        replyText = edgeRes.response
        replySource = 'Local Edge AI'
        supportingData = {
          riskScore: risks.overall,
          triageLevel: edgeRes.triageLevel,
          confidence: edgeRes.confidence,
        }
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
          const edgeRes = generateEdgeAiResponse(query, telemetry, risks, baseline)
          replyText = edgeRes.response
          replySource = 'Local Edge AI'
          supportingData = {
            riskScore: risks.overall,
            triageLevel: edgeRes.triageLevel,
            confidence: edgeRes.confidence,
          }
        }
      }
    } catch (err) {
      console.warn('Gemini API fallback to Local Edge AI:', err)
      const edgeRes = generateEdgeAiResponse(query, telemetry, risks, baseline)
      replyText = edgeRes.response
      replySource = 'Local Edge AI'
      supportingData = {
        riskScore: risks.overall,
        triageLevel: edgeRes.triageLevel,
        confidence: edgeRes.confidence,
      }
    } finally {
      setIsLoading(false)
      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'aeris',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: replySource,
        supportingData,
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
    <div style={{ paddingTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div>
          <p className="eyebrow" style={{ margin: 0, fontSize: 10 }}>AERIS AI Clinical Assistant</p>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, margin: '2px 0 4px', color: 'var(--text-primary)' }}>AI Companion</h1>
          <p className="subhead" style={{ margin: 0, fontSize: 12 }}>
            Dual-Pipeline AI Assistant: <strong>Cloud Gemini 3.6 Flash</strong> vs. <strong>Local Edge AI Engine</strong> (100% Offline).
          </p>
        </div>

        {/* AI Processing Engine Switcher */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#F1F5F9',
            padding: 3,
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setIsOffline(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              border: 0,
              cursor: 'pointer',
              background: !isOffline ? '#FFFFFF' : 'transparent',
              color: !isOffline ? '#0F172A' : 'var(--text-secondary)',
              boxShadow: !isOffline ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
            title="Use Cloud Gemini 3.6 Flash API for rich contextual clinical reasoning"
          >
            <Sparkles size={12} color={!isOffline ? '#D97706' : 'currentColor'} />
            <span>Gemini 3.6 Flash</span>
            {!isOffline && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />}
          </button>

          <button
            type="button"
            onClick={() => setIsOffline(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              border: 0,
              cursor: 'pointer',
              background: isOffline ? '#FFFFFF' : 'transparent',
              color: isOffline ? '#0F172A' : 'var(--text-secondary)',
              boxShadow: isOffline ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
            title="Use zero-latency edge-native clinical reasoning engine without cloud API"
          >
            <Cpu size={12} color={isOffline ? '#10B981' : 'currentColor'} />
            <span>Local Edge AI</span>
            {isOffline && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />}
          </button>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        {/* Expanded Full-Width Chat Window */}
        <article
          className="panel"
          style={{
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            height: 'clamp(580px, 78vh, 780px)',
            width: '100%',
          }}
        >
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
                    background: msg.sender === 'user' ? 'var(--panel-elevated)' : '#FEF2F2',
                    border: msg.sender === 'user' ? '1px solid var(--border-subtle)' : '1px solid rgba(220, 38, 38, 0.25)',
                    color: msg.sender === 'user' ? 'var(--text-primary)' : 'var(--main-red)',
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
                          color: msg.source === 'Gemini 3.6 Flash' ? 'var(--yellow)' : '#10B981',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {msg.source === 'Gemini 3.6 Flash' ? <Sparkles size={10} /> : <Cpu size={10} />}
                        {msg.source === 'Gemini 3.6 Flash' ? 'Gemini 3.6 Flash' : 'Local Edge AI'}
                        {msg.supportingData?.triageLevel && (
                          <span style={{
                            padding: '1px 4px',
                            borderRadius: 3,
                            fontSize: 9,
                            background: msg.supportingData.triageLevel === 'Emergency' ? '#DC2626' : msg.supportingData.triageLevel === 'Urgent' ? '#F59E0B' : 'rgba(16, 185, 129, 0.2)',
                            color: msg.supportingData.triageLevel === 'Emergency' || msg.supportingData.triageLevel === 'Urgent' ? '#FFFFFF' : '#10B981',
                            fontWeight: 800,
                          }}>
                            {msg.supportingData.triageLevel.toUpperCase()}
                          </span>
                        )}
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
                background: 'var(--main-red)',
                color: '#FFFFFF',
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
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
              }}
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>Send</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  )
}
