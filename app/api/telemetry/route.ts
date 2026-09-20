import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface TelemetryPayload {
  source?: string
  bpm?: number
  spo2?: number
  status?: string
  sos?: boolean | number
  raw?: string
  timestamp?: number
}

interface HardwareTelemetryState {
  status: 'MEASURING' | 'NO FINGER' | 'STABILIZING' | 'DISCONNECTED'
  bpm: number | null
  spo2: number | null
  ir: number | null
  stableBpm: number | null
  stableSpo2: number | null
  r: number | null
  fingerDetected: boolean
  connected: boolean
  timestamp: number
  source: string
  lastRawLine?: string
}

// In-memory telemetry cache
let latestTelemetry: HardwareTelemetryState = {
  status: 'DISCONNECTED',
  bpm: null,
  spo2: null,
  ir: null,
  stableBpm: null,
  stableSpo2: null,
  r: null,
  fingerDetected: false,
  connected: false,
  timestamp: 0,
  source: 'offline',
  lastRawLine: '',
}

let pendingSosEvent: { type: string; source: string; timestamp: number } | null = null
let rawLogsHistory: string[] = []
let lastReceivedTime = 0

// Timeout threshold: if no packet arrives in 5 seconds, consider disconnected
const STALE_TIMEOUT_MS = 5000

export async function POST(req: Request) {
  try {
    const body: TelemetryPayload = await req.json()
    const now = Date.now()
    lastReceivedTime = now

    const rawBpm = typeof body.bpm === 'number' && body.bpm > 0 ? body.bpm : null
    const rawSpo2 = typeof body.spo2 === 'number' && body.spo2 > 0 ? body.spo2 : null
    const rawStatus = (body.status || 'OK').toUpperCase()
    const isSos = Boolean(body.sos === true || body.sos === 1)

    // Normalize finger placement and status
    let fingerDetected = false
    let normalizedStatus: 'MEASURING' | 'NO FINGER' | 'STABILIZING' | 'DISCONNECTED' = 'NO FINGER'

    if (rawStatus === 'STABILIZING') {
      fingerDetected = true
      normalizedStatus = 'STABILIZING'
    } else if (rawBpm !== null && rawSpo2 !== null) {
      fingerDetected = true
      normalizedStatus = 'MEASURING'
    } else if (rawStatus === 'MEASURING') {
      fingerDetected = true
      normalizedStatus = 'MEASURING'
    } else if (rawStatus === 'NO FINGER' || rawStatus === 'NO_FINGER') {
      fingerDetected = false
      normalizedStatus = 'NO FINGER'
    } else {
      fingerDetected = rawBpm !== null
      normalizedStatus = fingerDetected ? 'MEASURING' : 'NO FINGER'
    }

    const stableBpm = rawBpm && rawBpm >= 40 && rawBpm <= 220 ? rawBpm : null
    const stableSpo2 = rawSpo2 && rawSpo2 >= 70 && rawSpo2 <= 100 ? rawSpo2 : null

    const rawLine = body.raw || `BPM:${rawBpm ?? 0},SpO2:${rawSpo2 ?? 0},Status:${rawStatus},SOS:${isSos ? 1 : 0}`

    // Update state
    latestTelemetry = {
      status: normalizedStatus,
      bpm: rawBpm,
      spo2: rawSpo2,
      ir: fingerDetected ? 50000 : 0,
      stableBpm,
      stableSpo2,
      r: null,
      fingerDetected,
      connected: true,
      timestamp: now,
      source: body.source || 'esp8266_uno',
      lastRawLine: rawLine,
    }

    // Maintain raw logs
    rawLogsHistory = [rawLine, ...rawLogsHistory.slice(0, 19)]

    // One-shot SOS event detector
    if (isSos) {
      pendingSosEvent = {
        type: 'SOS_TRIGGERED',
        source: 'ESP8266_PHYSICAL_BUTTON',
        timestamp: now,
      }
    }

    return NextResponse.json({
      success: true,
      receivedAt: now,
      sosAcknowledged: isSos,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Invalid JSON body' },
      { status: 400 }
    )
  }
}

export async function GET() {
  const now = Date.now()
  const isConnected = lastReceivedTime > 0 && now - lastReceivedTime < STALE_TIMEOUT_MS

  const stateToSend: HardwareTelemetryState = {
    ...latestTelemetry,
    connected: isConnected,
    status: isConnected ? latestTelemetry.status : 'DISCONNECTED',
  }

  // Consume pending SOS event on delivery (one-shot)
  const sosEvent = pendingSosEvent
  pendingSosEvent = null

  return NextResponse.json(
    {
      success: true,
      connected: isConnected,
      data: stateToSend,
      lastSosEvent: sosEvent,
      rawLogs: rawLogsHistory,
      transport: 'wifi_esp8266',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  )
}
