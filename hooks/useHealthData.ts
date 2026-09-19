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
  lastSosEvent: { type: string; source: string; timestamp: number } | null
}

export function useHealthData(): UseHealthDataReturn {
  const [data, setData] = useState<ArduinoHealthData | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const [isStale, setIsStale] = useState<boolean>(false)
  const [rawLogs, setRawLogs] = useState<string[]>([])
  const [lastSosEvent, setLastSosEvent] = useState<{ type: string; source: string; timestamp: number } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPacketTimeRef = useRef<number>(0)

  useEffect(() => {
    let isMounted = true

    const connect = () => {
      const port = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || '3001'
      const wsUrl = `ws://localhost:${port}`

      try {
        const socket = new WebSocket(wsUrl)
        wsRef.current = socket

        socket.onopen = () => {
          if (!isMounted) return
          console.log('[AERIS Hardware Listener] WebSocket connected to Arduino Serial Bridge.')
          setWsConnected(true)
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

        socket.onerror = (error) => {
          if (!isMounted) return
          console.warn('[AERIS Hardware Listener] WebSocket connection error:', error)
          setWsConnected(false)
        }

        socket.onclose = () => {
          if (!isMounted) return
          console.log('[AERIS Hardware Listener] WebSocket disconnected. Retrying in 3s...')
          setWsConnected(false)
          setData(null)
          reconnectTimerRef.current = setTimeout(connect, 3000)
        }
      } catch (e) {
        if (!isMounted) return
        console.error('[AERIS Hardware Listener] Error initializing WebSocket:', e)
        setWsConnected(false)
        setData(null)
        reconnectTimerRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    // 4-second stale packet detector (marks connection inactive if hardware stops sending bytes)
    const staleInterval = setInterval(() => {
      if (lastPacketTimeRef.current > 0 && Date.now() - lastPacketTimeRef.current > 4000) {
        if (!isStale) {
          console.warn('[AERIS Hardware Listener] Stale data timeout (>4s). Marking hardware disconnected.')
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
  }, [])

  const arduinoConnected = Boolean(wsConnected && data?.connected && !isStale)
  const isFingerDetected = Boolean(arduinoConnected && data?.fingerDetected)

  return {
    data,
    wsConnected,
    arduinoConnected,
    isHardwareConnected: arduinoConnected,
    isFingerDetected,
    stableBpm: data?.stableBpm ?? null,
    stableSpo2: data?.stableSpo2 ?? null,
    rawBpm: data?.bpm ?? null,
    rawSpo2: data?.spo2 ?? null,
    rawLogs,
    lastSosEvent,
  }
}
