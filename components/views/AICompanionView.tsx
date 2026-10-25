'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, ArrowUp, Cpu, Sparkles } from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { generateEdgeAiResponse } from '@/lib/edge-ai-companion'
import { useKeyboardInset } from '@/hooks/useKeyboardInset'
import type { ChatMessage } from '@/types/aeris'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Segmented } from '@/components/ui/segmented'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Why is my heat risk elevated?',
  'Am I stressed right now?',
  'Is my body temperature normal?',
  'What should I do in this weather?',
]

const TRIAGE_TONE = { Emergency: 'danger', Urgent: 'warning' } as const

export function AICompanionView() {
  const { telemetry, risks, baseline, isOffline, setIsOffline, userProfile } = useTelemetry()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const firstName = (userProfile.name || '').split(' ')[0]
  useKeyboardInset()

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'aeris',
      text: `Hi${firstName ? ` ${firstName}` : ''}, I'm your AERIS assistant. Your overall risk is ${risks.overall}/100 right now. Ask me anything about your vitals, stress or the weather.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stillThinking, setStillThinking] = useState(false)

  useEffect(() => {
    if (!isLoading) return setStillThinking(false)
    const t = window.setTimeout(() => setStillThinking(true), 20_000)
    return () => window.clearTimeout(t)
  }, [isLoading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  const edgeReply = (query: string) => {
    const edge = generateEdgeAiResponse(query, telemetry, risks, baseline)
    return {
      text: edge.response,
      source: 'Local Edge AI' as const,
      supportingData: { riskScore: risks.overall, triageLevel: edge.triageLevel, confidence: edge.confidence },
    }
  }

  const send = async (override?: string) => {
    const query = (override ?? input).trim()
    if (!query || isLoading) return

    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), sender: 'user', text: query, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ])
    setInput('')
    setIsLoading(true)

    let reply: { text: string; source: ChatMessage['source']; supportingData?: ChatMessage['supportingData'] }
    try {
      if (isOffline) {
        reply = edgeReply(query)
      } else {
        const res = await fetch('/api/companion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query, telemetry, risks, baseline }),
        })
        if (!res.ok) throw new Error('Cloud assistant request failed')
        const data = await res.json()
        reply = data.text ? { text: data.text, source: 'Gemini 3.6 Flash' } : edgeReply(query)
      }
    } catch (err) {
      console.warn('Cloud assistant unavailable, answering on-device:', err)
      reply = edgeReply(query)
    }

    setIsLoading(false)
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now() + 1),
        sender: 'aeris',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: reply.source,
        supportingData: reply.supportingData,
      },
    ])
    inputRef.current?.focus()
  }

  return (
    <>
      <PageHeader
        title="AI assistant"
        description={isOffline ? 'On-device: your questions and vitals never leave this device. Not a substitute for medical advice.' : 'Cloud: your question and current vitals are sent to Gemini to answer. Not a substitute for medical advice.'}
        actions={
          <Segmented
            label="Where answers are generated"
            value={isOffline ? 'device' : 'cloud'}
            onChange={(v) => setIsOffline(v === 'device')}
            options={[
              {
                value: 'cloud',
                label: (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Cloud
                  </span>
                ),
              },
              {
                value: 'device',
                label: (
                  <span className="flex items-center gap-1.5">
                    <Cpu className="size-3.5" /> On-device
                  </span>
                ),
              },
            ]}
          />
        }
      />

      <Card className="flex h-[calc(100dvh-var(--topbar-h)-var(--bottom-nav-h)-220px-var(--kb,0px))] [[data-kb-open]_&]:h-[calc(100dvh-var(--topbar-h)-var(--kb,0px)-24px)] min-h-[460px] flex-col overflow-hidden p-0 lg:h-[calc(100dvh-var(--topbar-h)-200px)]">
        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6" aria-live="polite">
          <ul className="mx-auto flex max-w-3xl flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const mine = msg.sender === 'user'
                return (
                  <motion.li
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={cn('flex gap-3', mine && 'justify-end')}
                  >
                    {!mine && (
                      <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-white" aria-label="AERIS">
                        <Activity className="size-3.5" aria-hidden />
                      </span>
                    )}
                    <div className={cn(mine ? 'max-w-[85%] text-right md:max-w-[75%]' : 'max-w-[92%] md:max-w-[80%]')}>
                      <div
                        className={cn(
                          'inline-block rounded-2xl px-4 py-2.5 text-left text-[15px] leading-relaxed whitespace-pre-line',
                          mine ? 'rounded-br-md bg-surface-2 text-fg ring-1 ring-line' : 'px-0 py-0.5 text-fg',
                        )}
                      >
                        {msg.text}
                      </div>
                      <div className={cn('mt-1 flex items-center gap-2 text-[11px] text-fg-muted', mine && 'justify-end')}>
                        {msg.source && <span>{msg.source === 'Local Edge AI' ? 'On-device' : 'Cloud'}</span>}
                        {msg.supportingData?.triageLevel && msg.supportingData.triageLevel in TRIAGE_TONE && (
                          <Badge tone={TRIAGE_TONE[msg.supportingData.triageLevel as keyof typeof TRIAGE_TONE]}>{msg.supportingData.triageLevel}</Badge>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
            {isLoading && (
              <li className="flex gap-3" aria-label="Assistant is typing">
                <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-white">
                  <Activity className="size-3.5" aria-hidden />
                </span>
                <span className="inline-flex items-center gap-1 py-3">
                  {stillThinking ? <span className="text-sm text-fg-muted">Still thinking…</span> : [0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-fg-muted"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </span>
              </li>
            )}
          </ul>
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-line bg-surface px-3 pt-3 pb-3 md:px-6">
          {messages.length <= 2 && (
            <div className="mx-auto mb-2 flex max-w-3xl gap-1.5 overflow-x-auto pb-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isLoading}
                  onClick={() => send(s)}
                  className="h-8 shrink-0 cursor-pointer rounded-full border border-line bg-surface px-3 text-[13px] text-fg-2 hover:border-line-strong hover:text-fg disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line bg-surface-2 p-1.5 focus-within:border-line-strong"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <label htmlFor="assistant-input" className="sr-only">
              Message the assistant
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Ask a question…"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] text-fg placeholder:text-fg-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="size-5" />
            </button>
          </form>
        </div>
      </Card>
    </>
  )
}
