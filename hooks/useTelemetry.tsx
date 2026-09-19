'use client'

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ArduinoHealthData, useHealthData } from '@/hooks/useHealthData'
import { evaluateAlerts } from '@/lib/alerts'
import { ExternalWeatherData, fetchRealWeather } from '@/lib/external-weather'
import { calculateRiskScores } from '@/lib/risk-engine'
import { CORE_SENSORS } from '@/lib/sensors'
import {
  calculateDailyAnalysis,
  calculateDemographicReferenceHRRange,
  DEFAULT_BASELINE,
  DEFAULT_USER_PROFILE,
  generateHistoryPoints,
  getScenarioTarget,
  tickTelemetry,
  updateBaselineWithSample,
} from '@/lib/telemetry'
import {
  AlertItem,
  DailyAnalysis,
  HardwareSensor,
  HistoricalPoint,
  PersonalBaseline,
  RiskScores,
  Scenario,
  TelemetryData,
  UserProfile,
} from '@/types/aeris'

export interface RealHistoryPoint {
  time: string
  heartRate: number
  spo2: number
  bodyTemp: number
  stress: number
  ambientTemp: number
  humidity: number
  aqi: number
}

interface TelemetryContextType {
  userProfile: UserProfile
  updateUserProfile: (updates: Partial<UserProfile>) => void
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
  dailyAnalysis: DailyAnalysis
  dailyHistory: TelemetryData[]
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

  // Canonical SOS System Pipeline
  isSosActive: boolean
  sosSource: 'WEB' | 'PHYSICAL_BUTTON' | null
  triggerSos: (source?: 'WEB' | 'PHYSICAL_BUTTON') => void
  dismissSos: () => void

  // Arduino Live Serial Telemetry
  arduinoData: ArduinoHealthData | null
  wsConnected: boolean
  arduinoConnected: boolean
  isHardwareConnected: boolean
  isFingerDetected: boolean
  rawLogs: string[]
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'aeris_telemetry_store_v1'
const LOCAL_PROFILE_KEY = 'aeris_user_profile_v1'

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const {
    data: arduinoData,
    wsConnected,
    arduinoConnected,
    isHardwareConnected,
    isFingerDetected,
    stableBpm,
    stableSpo2,
    rawBpm,
    rawSpo2,
    rawLogs,
    lastSosEvent,
  } = useHealthData()

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE)
  const [scenario, setScenarioState] = useState<Scenario>('Normal')
  // Default to simulation running when offline / hardware disconnected
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true)
  const [isOffline, setIsOffline] = useState<boolean>(true)
  const [useRealWeather, setUseRealWeather] = useState<boolean>(true)
  const [realWeatherData, setRealWeatherData] = useState<ExternalWeatherData | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false)
  const [activeView, setActiveView] = useState<string>('Dashboard')
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h')

  // Canonical SOS System State
  const [isSosActive, setIsSosActive] = useState<boolean>(false)
  const [sosSource, setSosSource] = useState<'WEB' | 'PHYSICAL_BUTTON' | null>(null)
  const lastProcessedSosTimestampRef = useRef<number>(0)
  const dismissedCooldownRef = useRef<number>(0)

  const [baseline, setBaseline] = useState<PersonalBaseline>(DEFAULT_BASELINE)
  const [telemetry, setTelemetry] = useState<TelemetryData>(() => getScenarioTarget('Normal'))
  const [dailyHistory, setDailyHistory] = useState<TelemetryData[]>([])
  const [realHistory, setRealHistory] = useState<RealHistoryPoint[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  // Canonical Single SOS Trigger Function (Used by both WEB SOS button & PHYSICAL Arduino Button)
  const triggerSos = (source: 'WEB' | 'PHYSICAL_BUTTON' = 'WEB') => {
    if (isSosActive) {
      console.log(`[AERIS SOS System] Duplicate protection active: SOS already running (source: ${sosSource}). Ignoring redundant trigger.`)
      return
    }
    if (Date.now() < dismissedCooldownRef.current && source === 'PHYSICAL_BUTTON') {
      console.log('[AERIS SOS System] Cooldown active after manual user dismissal. Ignoring hardware event.')
      return
    }
    console.log(`🚨 [AERIS SOS System] CANONICAL SOS ACTIVATED! Trigger Source: ${source}`)
    setIsSosActive(true)
    setSosSource(source)
    setScenarioState('disaster_fall_sos')

    setTelemetry((prev) => {
      const activeBpm = isHardwareConnected && arduinoData ? (stableBpm || rawBpm || prev.heartRate) : prev.heartRate
      const activeSpo2 = isHardwareConnected && arduinoData ? (stableSpo2 || rawSpo2 || prev.spo2) : prev.spo2
      return {
        ...prev,
        heartRate: activeBpm,
        spo2: activeSpo2,
        weatherCondition: 'Impact Fall & Emergency SOS Active',
      }
    })
  }

  const dismissSos = () => {
    console.log('[AERIS SOS System] Canonical SOS Alarm dismissed.')
    dismissedCooldownRef.current = Date.now() + 5000 // 5 second cooldown for hardware re-triggers
    setIsSosActive(false)
    setSosSource(null)
    setScenarioState('Normal')
    setTelemetry(getScenarioTarget('Normal'))
  }

  // Automatic Bridge: Trigger Canonical SOS when hardware emits SOS_TRIGGERED / SOS STARTED
  useEffect(() => {
    if (!lastSosEvent) return
    if (lastSosEvent.timestamp <= lastProcessedSosTimestampRef.current) return

    lastProcessedSosTimestampRef.current = lastSosEvent.timestamp
    console.log(`🚨 [AERIS Hardware Bridge] Physical SOS button sequence confirmed! Invoking canonical web SOS handler... (Source: ${lastSosEvent.source})`)
    triggerSos('PHYSICAL_BUTTON')
  }, [lastSosEvent])

  const notifiedIdsRef = useRef<Set<string>>(new Set())
  const lastLoggedBpmRef = useRef<number | null>(null)
  const lastLoggedSpo2Ref = useRef<number | null>(null)
  const lastSyncedBpmRef = useRef<number | null>(null)
  const lastSyncedSpo2Ref = useRef<number | null>(null)

  // AUTO-TOGGLE SIMULATION LOOP BASED ON HARDWARE CONNECTION STATE
  useEffect(() => {
    if (isHardwareConnected) {
      setIsSimulationRunning(false)
      console.log('[AERIS Telemetry] Hardware connected on COM bridge. Auto-pausing synthetic simulation loop.')
    } else {
      setIsSimulationRunning(true)
      console.log('[AERIS Telemetry] Hardware bridge offline. Auto-enabling synthetic simulation loop.')
    }
  }, [isHardwareConnected])

  // Load persistent user profile & telemetry state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY)
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile))
      }

      const savedTelemetry = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (savedTelemetry) {
        const parsed = JSON.parse(savedTelemetry)
        if (parsed.telemetry) setTelemetry(parsed.telemetry)
        if (parsed.baseline) setBaseline(parsed.baseline)
        if (parsed.dailyHistory && Array.isArray(parsed.dailyHistory)) setDailyHistory(parsed.dailyHistory)
      }
    } catch (e) {
      console.warn('Failed to load local store:', e)
    }
  }, [])

  // Auto-save persistent telemetry state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const payload = {
        telemetry,
        baseline,
        dailyHistory: dailyHistory.slice(-100),
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
    } catch (e) {
      // Ignore storage errors
    }
  }, [telemetry, baseline, dailyHistory])

  // Save profile state to localStorage
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...updates }
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated))
      }
      // Re-evaluate demographic reference range on profile update
      const newRefRange = calculateDemographicReferenceHRRange(updated)
      setBaseline((b) => ({
        ...b,
        refRestingHRRange: newRefRange,
      }))
      return updated
    })
  }

  const updateBaseline = (updates: Partial<PersonalBaseline>) => {
    setBaseline((prev) => ({
      ...prev,
      ...updates,
      restingHRRange: updates.restingHR !== undefined ? { min: updates.restingHR - 8, max: updates.restingHR + 8 } : updates.restingHRRange || prev.restingHRRange,
      tempRange: updates.tempBaseline !== undefined ? { min: Number((updates.tempBaseline - 0.4).toFixed(1)), max: Number((updates.tempBaseline + 0.5).toFixed(1)) } : updates.tempRange || prev.tempRange,
    }))
  }

  // Calculate current multi-modal risk scores using Late Fusion & Report Formulas
  const risks = useMemo(() => calculateRiskScores(telemetry, baseline, userProfile), [telemetry, baseline, userProfile])

  // Calculate daily aggregates & insights
  const dailyAnalysis = useMemo(
    () => calculateDailyAnalysis(dailyHistory, baseline, risks),
    [dailyHistory, baseline, risks]
  )

  // Auto-fetch real live weather & AQI on mount
  useEffect(() => {
    fetchLiveWeather()
  }, [])

  // Live Sync MAX30102 Real Hardware Data over Telemetry when connected (100% Priority)
  useEffect(() => {
    if (!isHardwareConnected || !arduinoData) return

    const activeBpm = stableBpm || rawBpm
    const activeSpo2 = stableSpo2 || rawSpo2

    if (activeBpm === null && activeSpo2 === null) return

    // Guard: Prevent re-triggering state updates if reading values have not changed
    if (activeBpm === lastSyncedBpmRef.current && activeSpo2 === lastSyncedSpo2Ref.current) {
      return
    }

    lastSyncedBpmRef.current = activeBpm
    lastSyncedSpo2Ref.current = activeSpo2

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    setTelemetry((prev) => {
      const next: TelemetryData = {
        ...prev,
        heartRate: activeBpm !== null ? activeBpm : prev.heartRate,
        spo2: activeSpo2 !== null ? activeSpo2 : prev.spo2,
        timestamp,
      }
      return next
    })
  }, [isHardwareConnected, arduinoData, stableBpm, stableSpo2, rawBpm, rawSpo2])

  // Append real sensor readings to realHistory timeline when valid data arrives
  useEffect(() => {
    if (!isHardwareConnected || !arduinoData) return
    const activeBpm = stableBpm || rawBpm
    const activeSpo2 = stableSpo2 || rawSpo2

    if (activeBpm !== null && activeSpo2 !== null) {
      if (activeBpm !== lastLoggedBpmRef.current || activeSpo2 !== lastLoggedSpo2Ref.current) {
        lastLoggedBpmRef.current = activeBpm
        lastLoggedSpo2Ref.current = activeSpo2

        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setRealHistory((prev) => [
          ...prev.slice(-24),
          {
            time: timeLabel,
            heartRate: activeBpm,
            spo2: activeSpo2,
            bodyTemp: telemetry.bodyTemp,
            stress: risks.stress,
            ambientTemp: telemetry.ambientTemp,
            humidity: telemetry.humidity,
            aqi: telemetry.externalAqi,
          },
        ])
      }
    }
  }, [isHardwareConnected, arduinoData, stableBpm, stableSpo2, telemetry.bodyTemp, telemetry.ambientTemp, telemetry.humidity, telemetry.externalAqi, risks.stress])

  // Dynamically reflect Arduino MAX30102 status inside sensor array
  const sensors = useMemo<HardwareSensor[]>(() => {
    return CORE_SENSORS.map((s) => {
      if (s.id === 'max30102') {
        const isConn = Boolean(isHardwareConnected && wsConnected)
        const hasFinger = Boolean(isFingerDetected)
        const activeBpm = stableBpm || rawBpm
        const activeSpo2 = stableSpo2 || rawSpo2

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
  }, [arduinoData, wsConnected, isHardwareConnected, isFingerDetected, stableBpm, stableSpo2, rawBpm, rawSpo2])

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
          'Chrome notifications active! Real-time threshold alerts will pop up on your screen.',
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
      if (realWeatherData.pm25 !== undefined) target.pm25 = realWeatherData.pm25
      if (realWeatherData.pm10 !== undefined) target.pm10 = realWeatherData.pm10
      if (realWeatherData.o3 !== undefined) target.o3 = realWeatherData.o3
      if (realWeatherData.no2 !== undefined) target.no2 = realWeatherData.no2
    }

    // Preserve real MAX30102 readings if Arduino is connected
    if (isHardwareConnected && arduinoData) {
      const activeBpm = stableBpm || rawBpm
      const activeSpo2 = stableSpo2 || rawSpo2
      if (activeBpm !== null) target.heartRate = activeBpm
      if (activeSpo2 !== null) target.spo2 = activeSpo2
    }

    setTelemetry(target)
    notifiedIdsRef.current.clear()

    if (notificationsEnabled) {
      setTimeout(() => {
        const scenarioRisks = calculateRiskScores(target, baseline, userProfile)
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
      pm25: data.pm25 !== undefined ? data.pm25 : prev.pm25,
      pm10: data.pm10 !== undefined ? data.pm10 : prev.pm10,
      o3: data.o3 !== undefined ? data.o3 : prev.o3,
      no2: data.no2 !== undefined ? data.no2 : prev.no2,
    }))
  }

  useEffect(() => {
    if (useRealWeather) {
      fetchLiveWeather()
    }
  }, [useRealWeather])

  // Simulation tick loop: Runs ONLY when isSimulationRunning === true AND isHardwareConnected === false
  useEffect(() => {
    if (!isSimulationRunning || isHardwareConnected) return

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const next = tickTelemetry(prev, scenario)
        if (useRealWeather && realWeatherData) {
          next.ambientTemp = realWeatherData.ambientTemp
          next.humidity = realWeatherData.humidity
          next.pressure = realWeatherData.pressure
          next.rain = realWeatherData.rain
          next.externalAqi = realWeatherData.externalAqi
          if (realWeatherData.pm25 !== undefined) next.pm25 = realWeatherData.pm25
          if (realWeatherData.pm10 !== undefined) next.pm10 = realWeatherData.pm10
          if (realWeatherData.o3 !== undefined) next.o3 = realWeatherData.o3
          if (realWeatherData.no2 !== undefined) next.no2 = realWeatherData.no2
        }
        return next
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [isSimulationRunning, isHardwareConnected, scenario, useRealWeather, realWeatherData])

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

          // 1. Desktop Browser Push Notification
          dispatchDesktopNotification(
            `AERIS Alert: ${a.title}`,
            `${a.trigger}\nRecommended Action: ${a.recommendedAction}`,
            a.id
          )

          // 2. Mobile Phone Twilio SMS Push Notification (+91 7092796084)
          if (a.severity === 'Critical' || a.severity === 'High') {
            fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: a.title,
                trigger: a.trigger,
                severity: a.severity,
                recommendedAction: a.recommendedAction,
                phone: userProfile.emergencyContactPhone || '7092796084',
                vitals: {
                  heartRate: telemetry.heartRate,
                  spo2: telemetry.spo2,
                  bodyTemp: telemetry.bodyTemp,
                },
              }),
            }).catch((err) => console.warn('Mobile notify push failed:', err))
          }
        }
      })
    }
  }, [telemetry, risks, notificationsEnabled, userProfile])

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
        userProfile,
        updateUserProfile,
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
        dailyAnalysis,
        dailyHistory,
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
        isSosActive,
        sosSource,
        triggerSos,
        dismissSos,
        arduinoData,
        wsConnected,
        arduinoConnected,
        isHardwareConnected,
        isFingerDetected,
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
