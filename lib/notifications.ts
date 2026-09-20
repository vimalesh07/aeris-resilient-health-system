'use client'

/**
 * High-reliability Web Audio API chime generator for AERIS Push Notifications
 * Generates synthetic auditory signals without requiring external MP3 assets.
 */
export function playPushNotificationSound(type: 'sos' | 'obstacle' | 'food' | 'normal' = 'normal') {
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    
    // Resume context if suspended by browser autoplay policy
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime

    if (type === 'sos') {
      // Urgent siren dual-tone
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(880, now) // A5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3)
      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45)
      osc.start(now)
      osc.stop(now + 0.46)
    } else if (type === 'obstacle') {
      // Tactical attention warning chime (double beep)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.setValueAtTime(880, now + 0.12) // A5
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc.start(now)
      osc.stop(now + 0.32)
    } else if (type === 'food') {
      // Pleasant resonant chime
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12) // E5
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
      osc.start(now)
      osc.stop(now + 0.36)
    } else {
      // Soft ping
      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, now)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc.start(now)
      osc.stop(now + 0.22)
    }
  } catch (e) {
    console.warn('Audio chime warning:', e)
  }
}
