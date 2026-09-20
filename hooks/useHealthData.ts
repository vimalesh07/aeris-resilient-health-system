'use client'

import { useEffect, useRef, useState } from 'react'

export interface ArduinoHealthData {
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
  source?: string
  lastRawLine?: string
}

export interface UseHealthDataReturn {
  data: ArduinoHealthData | null
  wsConnected: boolean
  arduinoConnected: boolean
  isHardwareConnected: boolean
  isFingerDetected: boolean
  stableBpm: number | null
  stableSpo2: number | null
  rawBpm: number | null
  rawSpo2: number | null
  rawLogs: string[]
  transport: 'WiFi (ESP8266)' | 'Serial (COM3)' | 'Offline'
  lastSosEvent: { type: string; source: string; timestamp: number } | null
}

export function useHealthData(): UseHealthDataReturn {
  const [data, setData] = useState<ArduinoHealthData | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const [apiConnected, setApiConnected] = useState<boolean>(false)
  const [isStale, setIsStale] = useState<boolean>(false)
  const [rawLogs, setRawLogs] = useState<string[]>([])
  const [transport, setTransport] = useState<'WiFi (ESP8266)' | 'Serial (COM3)' | 'Offline'>('Offline')
  const [lastSosEvent, setLastSosEvent] = useState<{ type: string; source: string; timestamp: number } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPacketTimeRef = useRef<number>(0)
  const lastSosTimestampRef = useRef<number>(0)

  // 1. ESP8266 WiFi Telemetry Polling Engine (Fetches from /api/telemetry)
  useEffect(() => {
    let isMounted = true

    const fetchApiTelemetry = async () => {
      try {
        const res = await fetch('/api/telemetry', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()

        if (!isMounted) return

        if (json.success && json.connected && json.data) {
          const apiData: ArduinoHealthData = json.data
          setData(apiData)
          setApiConnected(true)
          setTransport('WiFi (ESP8266)')
          lastPacketTimeRef.current = Date.now()
          setIsStale(false)

          if (json.rawLogs && Array.isArray(json.rawLogs) && json.rawLogs.length > 0) {
            setRawLogs(json.rawLogs)
          } else if (apiData.lastRawLine) {
            setRawLogs((prev) => [apiData.lastRawLine!, ...prev.slice(0, 14)])
          }

          // Handle incoming SOS from ESP8266
          if (json.lastSosEvent && json.lastSosEvent.timestamp > lastSosTimestampRef.current) {
            lastSosTimestampRef.current = json.lastSosEvent.timestamp
            console.log('🚨 [AERIS WiFi Bridge] Hardware SOS received from ESP8266:', json.lastSosEvent)
            setLastSosEvent(json.lastSosEvent)
          }
        } else if (json.success && !json.connected) {
          // If WebSocket is not connected either, mark API disconnected
          if (!wsConnected) {
            setApiConnected(false)
            if (transport === 'WiFi (ESP8266)') {
              setTransport('Offline')
            }
          }
        }
      } catch {
        // Next.js server might be initializing or busy
      }
    }

    // High-frequency real-time check (every 200ms)
    fetchApiTelemetry()
    const apiInterval = setInterval(fetchApiTelemetry, 200)

    return () => {
      isMounted = false
      clearInterval(apiInterval)
    }
  }, [wsConnected, transport])

  // 2. Legacy SerialPort WebSocket Listener (ws://localhost:3001) as Fallback
  useEffect(() => {
    let isMounted = true

    const connectWs = () => {
      const port = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || '3001'
      const wsUrl = `ws://localhost:${port}`

      try {
        const socket = new WebSocket(wsUrl)
        wsRef.current = socket

        socket.onopen = () => {
          if (!isMounted) return
          console.log('[AERIS Hardware Listener] WebSocket connected to Serial Bridge.')
          setWsConnected(true)
          setTransport('Serial (COM3)')
          setIsStale(false)
        }

        socket.onmessage = (event) => {
          if (!isMounted) return
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'SOS_TRIGGERED') {
              console.log('🚨 [AERIS Hardware Listener] Hardware SOS Event Received:', message)
              setLastSosEvent({
                type: 'SOS_TRIGGERED',
                source: message.source || 'PHYSICAL_BUTTON',
                timestamp: message.timestamp || Date.now(),
              })
            } else if (message.type === 'health_update' && message.data) {
              const updatedData: ArduinoHealthData = message.data
              setData(updatedData)
              setTransport('Serial (COM3)')
              lastPacketTimeRef.current = Date.now()
              setIsStale(false)

              if (updatedData.lastRawLine) {
                setRawLogs((prev) => [updatedData.lastRawLine!, ...prev.slice(0, 14)])
              }
            }
          } catch (e) {
            console.warn('[AERIS Hardware Listener] Error parsing WebSocket message:', e)
          }
        }

        socket.onerror = () => {
          if (!isMounted) return
          setWsConnected(false)
        }

        socket.onclose = () => {
          if (!isMounted) return
          setWsConnected(false)
          reconnectTimerRef.current = setTimeout(connectWs, 4000)
        }
      } catch {
        if (!isMounted) return
        setWsConnected(false)
        reconnectTimerRef.current = setTimeout(connectWs, 4000)
      }
    }

    connectWs()

    // 4-second stale packet detector
    const staleInterval = setInterval(() => {
      if (lastPacketTimeRef.current > 0 && Date.now() - lastPacketTimeRef.current > 4000) {
        if (!isStale) {
          setIsStale(true)
        }
      }
    }, 2000)

    return () => {
      isMounted = false
      clearInterval(staleInterval)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [isStale])

  const isHardwareConnected = Boolean((apiConnected || wsConnected) && data?.connected && !isStale)
  const isFingerDetected = Boolean(isHardwareConnected && data?.fingerDetected)

  return {
    data,
    wsConnected: Boolean(wsConnected || apiConnected),
    arduinoConnected: isHardwareConnected,
    isHardwareConnected,
    isFingerDetected,
    stableBpm: data?.stableBpm ?? null,
    stableSpo2: data?.stableSpo2 ?? null,
    rawBpm: data?.bpm ?? null,
    rawSpo2: data?.spo2 ?? null,
    rawLogs,
    transport: isHardwareConnected ? transport : 'Offline',
    lastSosEvent,
  }
}
