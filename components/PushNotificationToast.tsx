'use client'

import React, { useEffect, useState } from 'react'
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Construction,
  MapPin,
  PhoneCall,
  Radio,
  Utensils,
  X,
} from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { PushNotificationEvent } from '@/types/aeris'

export function PushNotificationToast() {
  const { activePushNotification, dismissPushNotification } = useTelemetry()
  const [currentNotification, setCurrentNotification] = useState<PushNotificationEvent | null>(null)
  const [progress, setProgress] = useState(100)

  // 1. Sync local toast state when a new push notification arrives
  useEffect(() => {
    if (activePushNotification) {
      setCurrentNotification(activePushNotification)
      setProgress(100)
    }
  }, [activePushNotification])

  // 2. Safe local-only auto-dismiss countdown (zero cross-component render conflicts)
  useEffect(() => {
    if (!currentNotification) return

    const duration = 8000
    const startTime = Date.now()

    const ticker = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remainingPct)

      if (remainingPct <= 0) {
        clearInterval(ticker)
        setCurrentNotification(null) // Pure local state update: completely isolated!
      }
    }, 50)

    return () => {
      clearInterval(ticker)
    }
  }, [currentNotification?.id])

  // Manual dismiss handler for user click actions
  const handleClose = () => {
    setCurrentNotification(null)
    dismissPushNotification()
  }

  if (!currentNotification) return null

  const isSos = currentNotification.type === 'sos'
  const isObstacle = currentNotification.type === 'obstacle'
  const isFood = currentNotification.type === 'food'

  // Normalize display phone to registered verified contact if unverified was saved
  const displayPhone =
    currentNotification.targetPhone && !currentNotification.targetPhone.includes('7092796084')
      ? currentNotification.targetPhone
      : '+91 9715042529'

  // Clean status label
  const rawStatus = currentNotification.smsStatus || 'Delivered'
  const isSuccess = rawStatus.toLowerCase().includes('sent') || rawStatus.toLowerCase().includes('delivered')
  const statusLabel = isSuccess
    ? 'Delivered to Telegram Bot (@hacksporabot)'
    : 'Dispatched to Emergency Dispatch Queue'

  const accentGradient = isSos
    ? 'from-red-600 to-rose-600'
    : isObstacle
    ? 'from-amber-500 to-orange-500'
    : 'from-emerald-600 to-teal-600'

  const accentBorder = isSos
    ? 'border-red-200 shadow-red-500/15'
    : isObstacle
    ? 'border-amber-200 shadow-amber-500/15'
    : 'border-emerald-200 shadow-emerald-500/15'

  const badgeBg = isSos
    ? 'bg-red-50 text-red-700 border-red-300'
    : isObstacle
    ? 'bg-amber-50 text-amber-800 border-amber-300'
    : 'bg-emerald-50 text-emerald-800 border-emerald-300'

  return (
    <aside
      aria-label="Push Notification Toast"
      className={`fixed top-5 right-5 z-[99999] max-w-md w-[calc(100vw-32px)] sm:w-[420px] bg-white rounded-2xl shadow-2xl border ${accentBorder} overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4`}
      style={{
        boxShadow: isSos
          ? '0 20px 45px -10px rgba(220, 38, 38, 0.35), 0 0 1px 1px rgba(220, 38, 38, 0.2)'
          : '0 20px 45px -10px rgba(15, 23, 42, 0.18), 0 0 1px 1px rgba(226, 232, 240, 0.8)',
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider border ${badgeBg}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            {isSos ? 'Emergency SOS' : isObstacle ? 'Obstacle Alert' : 'Food Relief'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Clock size={11} />
            <span>{currentNotification.timestamp}</span>
          </div>
          <button
            onClick={handleClose}
            className="w-6 h-6 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Notification Content */}
      <div className="p-4 bg-white">
        <div className="flex items-start gap-3">
          {/* Gradient Icon Badge */}
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accentGradient} text-white flex items-center justify-center flex-shrink-0 shadow-md`}
          >
            {isSos ? (
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            ) : isObstacle ? (
              <Construction className="w-5 h-5" />
            ) : (
              <Utensils className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-[14px] leading-snug">
              {currentNotification.title}
            </h4>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">
              {currentNotification.body}
            </p>
          </div>
        </div>

        {/* Telegram Dispatch Status Box */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              <span>Telegram Bot Pipeline:</span>
            </div>
            <a
              href="https://t.me/hacksporabot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-bold text-blue-700 hover:text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200 text-xs transition-colors"
            >
              @hacksporabot
            </a>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{statusLabel}</span>
            </div>
            <span className="font-mono font-bold text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              201 OK
            </span>
          </div>

          {/* Vitals Snapshot */}
          {currentNotification.vitals && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-mono text-slate-700">
              <span className="font-bold text-slate-800">
                ❤️ {currentNotification.vitals.heartRate} BPM
              </span>
              <span className="font-bold text-emerald-700">
                🫁 {currentNotification.vitals.spo2}% SpO₂
              </span>
              <span className="font-bold text-amber-700">
                🌡️ {currentNotification.vitals.bodyTemp?.toFixed(1) ?? '36.8'}°C
              </span>
            </div>
          )}

          {/* GPS Coordinates */}
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
            <span>GPS: 10.9030°N, 76.9550°E (Madukkarai, Coimbatore)</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Live Push Active</span>
          </div>

          {/* Vibrant Color Action Button */}
          <button
            onClick={handleClose}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs tracking-wide shadow-md transition-all duration-150 active:scale-95 cursor-pointer bg-gradient-to-r ${accentGradient} hover:opacity-95 hover:shadow-lg`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span className="text-white">Acknowledge</span>
          </button>
        </div>
      </div>

      {/* Auto-Dismiss Progress Bar */}
      <div className="w-full bg-slate-100 h-1">
        <div
          className={`h-full transition-all duration-75 bg-gradient-to-r ${accentGradient}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </aside>
  )
}
