'use client'

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ArduinoHealthData, useHealthData } from '@/hooks/useHealthData'
import { evaluateAlerts } from '@/lib/alerts'
import { ExternalWeatherData, fetchRealWeather } from '@/lib/external-weather'
import { calculateRiskScores } from '@/lib/risk-engine'
import { CORE_SENSORS } from '@/lib/sensors'
import { DEFAULT_BASELINE, generateHistoryPoints, getScenarioTarget, tickTelemetry } from '@/lib/telemetry'
import { AlertItem, HardwareSensor, HistoricalPoint, PersonalBaseline, RiskScores, Scenario, TelemetryData } from '@/types/aeris'

export interface RealHistoryPoint {
  time: string
  heartRate: number
  spo2: number
  bodyTemp: number
  stress: number
}

interface TelemetryContextType {
  scenario: Scenario
  setScenario: (s: Scenario) => void
  isSimulationRunning: boolean
  setIsSimulationRunning: (r: boolean) => void
  isOffline: boolean
  setIsOffline: (o: boolean) => void
  useRealWeather: boolean
  setUseRealWeather: (u: boolean) => void
  realWeatherData: ExternalWeatherData | null
  fetchLiveWeather: () => Promise<void>
  notificationsEnabled: boolean
  enableChromeNotifications: () => Promise<boolean>
  telemetry: TelemetryData
  baseline: PersonalBaseline
  updateBaseline: (updates: Partial<PersonalBaseline>) => void
  risks: RiskScores
  alerts: AlertItem[]
  acknowledgeAlert: (id: string) => void
  dismissAlert: (id: string) => void
  history: HistoricalPoint[]
  realHistory: RealHistoryPoint[]
  timeframe: '24h' | '7d' | '30d'
  setTimeframe: (t: '24h' | '7d' | '30d') => void
  sensors: HardwareSensor[]
  activeView: string
  setActiveView: (v: string) => void

  // Arduino Live Serial Telemetry
  arduinoData: ArduinoHealthData | null
  wsConnected: boolean
  arduinoConnected: boolean
  rawLogs: string[]
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined)

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const { data: arduinoData, wsConnected, arduinoConnected, rawLogs } = useHealthData()

  const [scenario, setScenarioState] = useState<Scenario>('Normal')
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false)
  const [isOffline, setIsOffline] = useState<boolean>(true)
  const [useRealWeather, setUseRealWeather] = useState<boolean>(false)
  const [realWeatherData, setRealWeatherData] = useState<ExternalWeatherData | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false)
  const [activeView, setActiveView] = useState<string>('Dashboard')
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h')

  const [baseline, setBaseline] = useState<PersonalBaseline>(DEFAULT_BASELINE)
  const notifiedIdsRef = useRef<Set<string>>(new Set())

  const [telemetry, setTelemetry] = useState<TelemetryData>(() => getScenarioTarget('Normal'))
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [realHistory, setRealHistory] = useState<RealHistoryPoint[]>([])

  const updateBaseline = (updates: Partial<PersonalBaseline>) => {
    setBaseline((prev) => ({
      ...prev,
      ...updates,
      restingHRRange: updates.restingHR !== undefined ? { min: updates.restingHR - 8, max: updates.restingHR + 8 } : updates.restingHRRange || prev.restingHRRange,
      hrvRange: updates.hrvBaseline !== undefined ? { min: Math.max(20, updates.hrvBaseline - 15), max: updates.hrvBaseline + 20 } : updates.hrvRange || prev.hrvRange,
      tempRange: updates.tempBaseline !== undefined ? { min: Number((updates.tempBaseline - 0.4).toFixed(1)), max: Number((updates.tempBaseline + 0.5).toFixed(1)) } : updates.tempRange || prev.tempRange,
    }))
  }

  // Memoize risk scores so reference only changes when telemetry changes
  const risks = useMemo(() => calculateRiskScores(telemetry, baseline), [telemetry, baseline])

  const lastLoggedBpmRef = useRef<number | null>(null)
  const lastLoggedSpo2Ref = useRef<number | null>(null)

  // Live Sync MAX30102 Real Hardware Data over Telemetry when connected
  useEffect(() => {
    if (!arduinoConnected || !arduinoData) return

    setTelemetry((prev) => {
      const activeBpm = arduinoData.stableBpm || arduinoData.bpm
      const activeSpo2 = arduinoData.stableSpo2 || arduinoData.spo2

      return {
        ...prev,
        heartRate: activeBpm !== null ? activeBpm : prev.heartRate,
        spo2: activeSpo2 !== null ? activeSpo2 : prev.spo2,
      }
    })
  }, [arduinoConnected, arduinoData])

  // Append real sensor readings to realHistory when valid data arrives
  useEffect(() => {
    if (!arduinoConnected || !arduinoData) return
    const activeBpm = arduinoData.stableBpm || arduinoData.bpm
    const activeSpo2 = arduinoData.stableSpo2 || arduinoData.spo2

    if (activeBpm !== null && activeSpo2 !== null) {
      if (activeBpm !== lastLoggedBpmRef.current || activeSpo2 !== lastLoggedSpo2Ref.current) {
        lastLoggedBpmRef.current = activeBpm
        lastLoggedSpo2Ref.current = activeSpo2

        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setRealHistory((prev) => [
          ...prev.slice(-19),
          {
            time: timeLabel,
            heartRate: activeBpm,
            spo2: activeSpo2,
            bodyTemp: telemetry.bodyTemp,
            stress: risks.stress,
          },
        ])
      }
    }
  }, [arduinoConnected, arduinoData, telemetry.bodyTemp, risks.stress])

  // Dynamically reflect Arduino MAX30102 status inside sensor array
  const sensors = useMemo<HardwareSensor[]>(() => {
    return CORE_SENSORS.map((s) => {
      if (s.id === 'max30102') {
        const isConn = Boolean(arduinoData?.connected && wsConnected)
        const hasFinger = Boolean(arduinoData?.fingerDetected)
        const activeBpm = arduinoData?.stableBpm || arduinoData?.bpm
        const activeSpo2 = arduinoData?.stableSpo2 || arduinoData?.spo2

        let signalsText = '🔴 DISCONNECTED'
        let quality = 0

        if (isConn) {
          if (hasFinger && activeBpm !== null && activeSpo2 !== null) {
            signalsText = `🟢 CONNECTED (Live BPM: ${activeBpm}, SpO₂: ${activeSpo2}%)`
            quality = 98
          } else if (arduinoData?.status === 'STABILIZING') {
            signalsText = '🟡 STABILIZING'
            quality = 50
          } else {
            signalsText = '🟡 NO FINGER DETECTED'
            quality = 40
          }
        }

        return {
          ...s,
          connected: isConn,
          signalQuality: quality,
          signals: signalsText,
          lastSync: isConn ? 'Live COM3' : 'Offline',
        }
      }
      return s
    })
  }, [arduinoData, wsConnected])

  // Check if browser notifications already granted
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true)
      }
    }
  }, [])

  const dispatchDesktopNotification = (title: string, body: string, tag?: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        tag: tag || String(Date.now()),
        requireInteraction: false,
      } satisfies NotificationOptions)
    } catch (e) {
      console.warn('Notification dispatch warning:', e)
    }
  }

  const enableChromeNotifications = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported in this environment.')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        dispatchDesktopNotification(
          'AERIS Health Companion',
          'Chrome notifications active! Demo scenario alerts will pop up on your screen.',
          'welcome_notification'
        )
        return true
      } else {
        setNotificationsEnabled(false)
        alert('Notification permission was denied. Please allow notifications in Chrome site settings.')
        return false
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e)
      return false
    }
  }

  const setScenario = (newScenario: Scenario) => {
    setScenarioState(newScenario)
    const target = getScenarioTarget(newScenario)
    if (useRealWeather && realWeatherData) {
      target.ambientTemp = realWeatherData.ambientTemp
      target.humidity = realWeatherData.humidity
      target.pressure = realWeatherData.pressure
      target.rain = realWeatherData.rain
      target.externalAqi = realWeatherData.externalAqi
    }

    // Preserve real MAX30102 readings if Arduino is connected
    if (arduinoConnected && arduinoData) {
      const activeBpm = arduinoData.stableBpm || arduinoData.bpm
      const activeSpo2 = arduinoData.stableSpo2 || arduinoData.spo2
      if (activeBpm !== null) target.heartRate = activeBpm
      if (activeSpo2 !== null) target.spo2 = activeSpo2
    }

    setTelemetry(target)
    notifiedIdsRef.current.clear()

    if (notificationsEnabled) {
      setTimeout(() => {
        const scenarioRisks = calculateRiskScores(target, baseline)
        dispatchDesktopNotification(
          `AERIS Scenario: ${newScenario}`,
          `Activated ${newScenario} scenario telemetry. Target Risk Score: ${scenarioRisks.overall}/100 (${scenarioRisks.statusLabel}).`,
          `scenario_${newScenario}_${Date.now()}`
        )
      }, 300)
    }
  }

  const fetchLiveWeather = async () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const data = await fetchRealWeather(pos.coords.latitude, pos.coords.longitude)
          setRealWeatherData(data)
          applyRealWeather(data)
        },
        async () => {
          const data = await fetchRealWeather()
          setRealWeatherData(data)
          applyRealWeather(data)
        }
      )
    } else {
      const data = await fetchRealWeather()
      setRealWeatherData(data)
      applyRealWeather(data)
    }
  }

  const applyRealWeather = (data: ExternalWeatherData) => {
    setTelemetry((prev) => ({
      ...prev,
      ambientTemp: data.ambientTemp,
      humidity: data.humidity,
      pressure: data.pressure,
      rain: data.rain,
      externalAqi: data.externalAqi,
    }))
  }

  useEffect(() => {
    if (useRealWeather) {
      fetchLiveWeather()
    }
  }, [useRealWeather])

  // Update telemetry continuously every 1.5s when simulation running
  useEffect(() => {
    if (!isSimulationRunning) return

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const next = tickTelemetry(prev, scenario)

        // Real Arduino MAX30102 values ALWAYS override fake tick values
        if (arduinoConnected && arduinoData) {
          const activeBpm = arduinoData.stableBpm || arduinoData.bpm
          const activeSpo2 = arduinoData.stableSpo2 || arduinoData.spo2
          if (activeBpm !== null) next.heartRate = activeBpm
          if (activeSpo2 !== null) next.spo2 = activeSpo2
        }

        if (useRealWeather && realWeatherData) {
          next.ambientTemp = realWeatherData.ambientTemp
          next.humidity = realWeatherData.humidity
          next.pressure = realWeatherData.pressure
          next.rain = realWeatherData.rain
          next.externalAqi = realWeatherData.externalAqi
        }
        return next
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [isSimulationRunning, scenario, useRealWeather, realWeatherData, arduinoConnected, arduinoData])

  // Evaluate alerts cleanly when telemetry or risks change
  useEffect(() => {
    const updated = evaluateAlerts(telemetry, risks, alerts)
    const changed =
      updated.length !== alerts.length ||
      updated.some((u, i) => u.id !== alerts[i]?.id || u.acknowledged !== alerts[i]?.acknowledged)

    if (changed) {
      setAlerts(updated)
    }

    if (notificationsEnabled) {
      updated.forEach((a) => {
        if (!a.acknowledged && !notifiedIdsRef.current.has(a.id)) {
          notifiedIdsRef.current.add(a.id)
          dispatchDesktopNotification(
            `AERIS Alert: ${a.title}`,
            `${a.trigger}\nRecommended Action: ${a.recommendedAction}`,
            a.id
          )
        }
      })
    }
  }, [telemetry, risks, notificationsEnabled])

  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  }

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)))
  }

  const history = useMemo(() => generateHistoryPoints(timeframe, scenario), [timeframe, scenario])

  return (
    <TelemetryContext.Provider
      value={{
        scenario,
        setScenario,
        isSimulationRunning,
        setIsSimulationRunning,
        isOffline,
        setIsOffline,
        useRealWeather,
        setUseRealWeather,
        realWeatherData,
        fetchLiveWeather,
        notificationsEnabled,
        enableChromeNotifications,
        telemetry,
        baseline,
        updateBaseline,
        risks,
        alerts,
        acknowledgeAlert,
        dismissAlert,
        history,
        realHistory,
        timeframe,
        setTimeframe,
        sensors,
        activeView,
        setActiveView,
        arduinoData,
        wsConnected,
        arduinoConnected,
        rawLogs,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  )
}

export function useTelemetry() {
  const context = useContext(TelemetryContext)
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider')
  }
  return context
}
