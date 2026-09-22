'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
import { playPushNotificationSound } from '@/lib/notifications'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import {
  AlertItem,
  DailyAnalysis,
  HardwareSensor,
  HistoricalPoint,
  PersonalBaseline,
  PushNotificationEvent,
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
  activePushNotification: PushNotificationEvent | null
  dismissPushNotification: () => void
  triggerNotificationPush: (params: {
    type: 'obstacle' | 'food' | 'sos'
    title: string
    body: string
    vitals?: { heartRate: number; spo2: number; bodyTemp?: number }
    location?: { lat: number; lon: number }
  }) => Promise<any>
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

  // Arduino / ESP8266 Live Hardware Telemetry
  arduinoData: ArduinoHealthData | null
  wsConnected: boolean
  arduinoConnected: boolean
  isHardwareConnected: boolean
  isFingerDetected: boolean
  transport: 'WiFi (ESP8266)' | 'Serial (COM3)' | 'Offline'
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
    transport,
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

  // Global Push Notification State (Visible On-Screen HUD Toast + Desktop Push + Twilio)
  const [activePushNotification, setActivePushNotification] = useState<PushNotificationEvent | null>(null)
  const dismissPushNotification = useCallback(() => {
    setActivePushNotification(null)
  }, [])

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
  const supabaseUserIdRef = useRef<string | null>(null)
  const supabaseLoadedRef = useRef(false)

  // Universal Push Notification Trigger (Used by Obstacle Push, Food Requirement & SOS)
  const triggerNotificationPush = async (params: {
    type: 'obstacle' | 'food' | 'sos'
    title: string
    body: string
    vitals?: { heartRate: number; spo2: number; bodyTemp?: number }
    location?: { lat: number; lon: number }
  }) => {
    const activeVitals = params.vitals || {
      heartRate: telemetry.heartRate,
      spo2: telemetry.spo2,
      bodyTemp: telemetry.bodyTemp,
    }
    const activeLocation = params.location || { lat: 10.903, lon: 76.955 }
    const phone = userProfile.emergencyContactPhone || '9715042529'
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // 1. Play audible alert chime
    playPushNotificationSound(params.type)

    // 2. Set visible floating push notification toast immediately
    setActivePushNotification({
      id: 'push-' + Date.now(),
      type: params.type,
      title: params.title,
      body: params.body,
      timestamp,
      targetPhone: phone,
      smsStatus: 'Dispatching via Telegram Bot...',
      vitals: activeVitals,
      location: activeLocation,
    })

    // 3. Dispatch native Desktop/Browser Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        let permission = Notification.permission
        if (permission === 'default') {
          permission = await Notification.requestPermission()
          if (permission === 'granted') {
            setNotificationsEnabled(true)
          }
        }
        if (permission === 'granted') {
          new Notification(params.title, {
            body: `${params.body}\nTarget: Telegram Emergency Bot | Vitals: ${activeVitals.heartRate} BPM, ${activeVitals.spo2}% SpO2`,
            icon: '/icon.svg',
            tag: `push_${params.type}_${Date.now()}`,
            requireInteraction: true,
          } satisfies NotificationOptions)
        }
      } catch (e) {
        console.warn('Desktop notification dispatch warning:', e)
      }
    }

    // 4. Add into Alerts state feed
    const newAlert: AlertItem = {
      id: 'alert-push-' + Date.now(),
      severity: params.type === 'sos' ? 'Critical' : 'High',
      title: params.title,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      trigger: params.body,
      supportingSignals: [
        `Telegram Bot: Active Emergency Channel`,
        `Biometrics: HR ${activeVitals.heartRate} BPM, SpO2 ${activeVitals.spo2}%`,
        `Channel: Automated Telegram Broadcast`,
      ],
      recommendedAction:
        params.type === 'obstacle'
          ? 'Clear reported road blockage or route around obstacle'
          : params.type === 'food'
          ? 'Dispatch emergency food packs and potable water rations'
          : 'Immediate physical responder dispatch & emergency evaluation',
      acknowledged: false,
      dismissed: false,
    }
    setAlerts((prev) => [newAlert, ...prev])

    // 5. Fire Telegram notification API (/api/notify)
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: params.type,
          title: params.title,
          trigger: params.body,
          severity: params.type === 'sos' ? 'Critical' : 'High',
          recommendedAction: newAlert.recommendedAction,
          patientName: userProfile.name || 'Vimal',
          phone,
          location: activeLocation,
          vitals: activeVitals,
        }),
      })
      const data = await res.json()
      if (data && (data.dispatchStatus || data.smsStatus)) {
        const finalStatus = data.dispatchStatus || data.smsStatus
        setActivePushNotification((prev) =>
          prev ? { ...prev, smsStatus: `Delivered (${finalStatus})` } : null
        )
      }
      return data
    } catch (e: any) {
      console.warn('Telegram push dispatch error:', e)
      setActivePushNotification((prev) =>
        prev ? { ...prev, smsStatus: 'Sent to emergency queue' } : null
      )
    }
  }

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

    const activeBpm = isHardwareConnected && arduinoData ? (stableBpm || rawBpm || telemetry.heartRate) : telemetry.heartRate
    const activeSpo2 = isHardwareConnected && arduinoData ? (stableSpo2 || rawSpo2 || telemetry.spo2) : telemetry.spo2

    setTelemetry((prev) => ({
      ...prev,
      heartRate: activeBpm,
      spo2: activeSpo2,
      weatherCondition: 'Impact Fall & Emergency SOS Active',
    }))

    // Dispatch automated Emergency SMS notification and visible push notification with real-time vitals
    triggerNotificationPush({
      type: 'sos',
      title: source === 'PHYSICAL_BUTTON' ? '🚨 HARDWARE SOS BUTTON ACTIVATED' : '🚨 EMERGENCY SOS ACTIVATED',
      body: 'Critical distress signal initiated. Emergency responders and contacts notified with live location.',
      vitals: {
        heartRate: activeBpm,
        spo2: activeSpo2,
        bodyTemp: telemetry.bodyTemp,
      },
      location: { lat: 10.903, lon: 76.955 },
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
  const lastPersistedTelemetryAtRef = useRef<number>(0)

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
        const parsed = JSON.parse(savedProfile)
        if (!parsed.emergencyContactPhone || parsed.emergencyContactPhone.includes('7092796084')) {
          parsed.emergencyContactPhone = '9715042529'
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(parsed))
        }
        setUserProfile(parsed)
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

  // Supabase is the authenticated account store. Browser local storage remains a
  // resilience cache for the existing edge/offline experience.
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return
    let active = true
    const loadAccountData = async () => {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !active) return
        supabaseUserIdRef.current = user.id
        const [{ data: health }, { data: savedBaseline }] = await Promise.all([
          supabase.from('user_health_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('health_baselines').select('baseline').eq('user_id', user.id).maybeSingle(),
        ])
        if (!active) return
        if (health) {
          setUserProfile((current) => ({
            ...current,
            age: health.age ?? current.age,
            sex: health.sex ?? current.sex,
            heightCm: Number(health.height_cm ?? current.heightCm),
            weightKg: Number(health.weight_kg ?? current.weightKg),
            bloodPressureSystolic: health.blood_pressure_systolic ?? current.bloodPressureSystolic,
            bloodPressureDiastolic: health.blood_pressure_diastolic ?? current.bloodPressureDiastolic,
            activityLevel: health.activity_level ?? current.activityLevel,
            knownRestingHR: health.known_resting_hr ?? current.knownRestingHR,
            knownHrvBaseline: health.known_hrv_baseline ? Number(health.known_hrv_baseline) : current.knownHrvBaseline,
            healthNotes: health.health_notes ?? current.healthNotes,
            units: health.units ?? current.units,
            emergencyContactPhone: health.emergency_contact_phone ?? current.emergencyContactPhone,
            enableSmsAlerts: health.enable_sms_alerts,
            enableWhatsappAlerts: health.enable_whatsapp_alerts,
          }))
        }
        if (savedBaseline?.baseline && typeof savedBaseline.baseline === 'object') {
          setBaseline((current) => ({ ...current, ...(savedBaseline.baseline as Partial<PersonalBaseline>) }))
        }
      } catch (error) {
        console.warn('Supabase account data could not be loaded:', error)
      } finally {
        if (active) supabaseLoadedRef.current = true
      }
    }
    void loadAccountData()
    return () => { active = false }
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

  useEffect(() => {
    const userId = supabaseUserIdRef.current
    if (!supabaseLoadedRef.current || !userId) return
    const persistAccountData = async () => {
      try {
        const supabase = createBrowserSupabaseClient()
        await Promise.all([
          supabase.from('profiles').update({ full_name: userProfile.name, phone: userProfile.emergencyContactPhone || null }).eq('id', userId),
          supabase.from('user_health_profiles').upsert({
            user_id: userId, age: userProfile.age, sex: userProfile.sex, height_cm: userProfile.heightCm, weight_kg: userProfile.weightKg,
            blood_pressure_systolic: userProfile.bloodPressureSystolic ?? null, blood_pressure_diastolic: userProfile.bloodPressureDiastolic ?? null,
            activity_level: userProfile.activityLevel, known_resting_hr: userProfile.knownRestingHR ?? null, known_hrv_baseline: userProfile.knownHrvBaseline ?? null,
            health_notes: userProfile.healthNotes ?? null, units: userProfile.units, emergency_contact_phone: userProfile.emergencyContactPhone ?? null,
            enable_sms_alerts: Boolean(userProfile.enableSmsAlerts), enable_whatsapp_alerts: Boolean(userProfile.enableWhatsappAlerts),
          }),
          supabase.from('health_baselines').upsert({ user_id: userId, baseline }),
        ])
      } catch (error) {
        console.warn('Supabase account data could not be saved:', error)
      }
    }
    void persistAccountData()
  }, [userProfile, baseline])

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
          lastSync: isConn ? (transport || 'Live Hardware') : 'Offline',
        }
      }
      return s
    })
  }, [arduinoData, wsConnected, isHardwareConnected, isFingerDetected, stableBpm, stableSpo2, rawBpm, rawSpo2, transport])

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
        const now = Date.now()
        if (now - lastPersistedTelemetryAtRef.current >= 30_000) {
          lastPersistedTelemetryAtRef.current = now
          void fetch('/api/telemetry/persist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          })
            .then((response) => {
              if (!response.ok) {
                console.warn(`[AERIS Telemetry] Failed to persist reading (HTTP ${response.status})`)
              }
            })
            .catch((error) => {
              console.warn('[AERIS Telemetry] Failed to persist reading:', error)
            })
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

          // 2. Mobile Phone Twilio SMS Push Notification (+91 9715042529)
          if (a.severity === 'Critical' || a.severity === 'High') {
            fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: a.title,
                trigger: a.trigger,
                severity: a.severity,
                recommendedAction: a.recommendedAction,
                phone: userProfile.emergencyContactPhone || '9715042529',
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
        activePushNotification,
        dismissPushNotification,
        triggerNotificationPush,
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
        transport,
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
