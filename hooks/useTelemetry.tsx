'use client'

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { evaluateAlerts } from '@/lib/alerts'
import { ExternalWeatherData, fetchRealWeather } from '@/lib/external-weather'
import { calculateRiskScores } from '@/lib/risk-engine'
import { CORE_SENSORS } from '@/lib/sensors'
import { DEFAULT_BASELINE, generateHistoryPoints, getScenarioTarget, tickTelemetry } from '@/lib/telemetry'
import { AlertItem, HardwareSensor, HistoricalPoint, PersonalBaseline, RiskScores, Scenario, TelemetryData } from '@/types/aeris'

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
  timeframe: '24h' | '7d' | '30d'
  setTimeframe: (t: '24h' | '7d' | '30d') => void
  sensors: HardwareSensor[]
  activeView: string
  setActiveView: (v: string) => void
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined)

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenarioState] = useState<Scenario>('Normal')
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true)
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
  const [sensors] = useState<HardwareSensor[]>(CORE_SENSORS)

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
    setTelemetry(target)

    // Clear notified IDs on scenario change so new scenario alerts fire popups
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
  }, [isSimulationRunning, scenario, useRealWeather, realWeatherData])

  // Evaluate alerts cleanly when telemetry or risks change
  useEffect(() => {
    const updated = evaluateAlerts(telemetry, risks, alerts)

    // Compare with current alerts to check if anything changed to avoid infinite setState loops
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
        timeframe,
        setTimeframe,
        sensors,
        activeView,
        setActiveView,
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
