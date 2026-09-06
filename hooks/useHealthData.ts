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

interface UseHealthDataReturn {
  data: ArduinoHealthData | null
  wsConnected: boolean
  arduinoConnected: boolean
  rawLogs: string[]
}

export function useHealthData(): UseHealthDataReturn {
  const [data, setData] = useState<ArduinoHealthData | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const [rawLogs, setRawLogs] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

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
          console.log('[AERIS Hook] WebSocket connected to Arduino Serial Bridge.')
          setWsConnected(true)
        }

        socket.onmessage = (event) => {
          if (!isMounted) return
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'health_update' && message.data) {
              const updatedData: ArduinoHealthData = message.data
              setData(updatedData)

              if (updatedData.lastRawLine) {
                setRawLogs((prev) => [updatedData.lastRawLine!, ...prev.slice(0, 14)])
              }
            }
          } catch (e) {
            console.warn('[AERIS Hook] Error parsing WebSocket message:', e)
          }
        }

        socket.onerror = (error) => {
          if (!isMounted) return
          console.warn('[AERIS Hook] WebSocket connection error:', error)
          setWsConnected(false)
        }

        socket.onclose = () => {
          if (!isMounted) return
          console.log('[AERIS Hook] WebSocket disconnected. Retrying in 3s...')
          setWsConnected(false)
          reconnectTimerRef.current = setTimeout(connect, 3000)
        }
      } catch (e) {
        if (!isMounted) return
        console.error('[AERIS Hook] Error initializing WebSocket:', e)
        setWsConnected(false)
        reconnectTimerRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const arduinoConnected = Boolean(data?.connected && wsConnected)

  return {
    data,
    wsConnected,
    arduinoConnected,
    rawLogs,
  }
}
