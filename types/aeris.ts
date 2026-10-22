export type Scenario =
  // Everyday Wellness Modes
  | 'Normal'
  | 'Stress'
  | 'Heat'
  | 'Temperature Anomaly'
  | 'Mobility'
  | 'Monsoon'
  // Climate Disaster Resilience Modes
  | 'disaster_heatwave'
  | 'disaster_flood'
  | 'disaster_aqi_spike'
  | 'disaster_fall_sos'

export type ActivityState = 'Sedentary' | 'Light Activity' | 'Moderate Walking' | 'Active Motion'
export type BiologicalSex = 'Male' | 'Female' | 'Other'
export type UserActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Athlete'

export interface UserProfile {
  name: string
  age: number
  sex: BiologicalSex
  heightCm: number
  weightKg: number
  bloodPressureSystolic?: number | null
  bloodPressureDiastolic?: number | null
  activityLevel: UserActivityLevel
  knownRestingHR?: number | null
  knownHrvBaseline?: number | null
  healthNotes?: string
  units: 'metric' | 'imperial'
  emergencyContactPhone?: string
  enableSmsAlerts?: boolean
  enableWhatsappAlerts?: boolean
}

export interface TelemetryData {
  heartRate: number // BPM (e.g. 76)
  hrv: number | null // ms (null if unmeasured)
  bodyTemp: number // °C (e.g. 36.5)
  spo2: number // % (e.g. 90)
  ambientTemp: number // °C
  humidity: number // %
  pressure: number // hPa
  weatherCondition: string
  rain: boolean
  precipitation: number
  externalAqi: number // External US AQI
  pm25: number | null // µg/m³ (External API)
  pm10: number | null // µg/m³ (External API)
  o3: number | null // µg/m³ (External API)
  no2: number | null // µg/m³ (External API)
  aqiStale?: boolean
  activity: ActivityState
  activityLevel: number
  gaitVariability: number
  gaitSymmetry: number
  steps: number
  cadence: number
  walkingSpeed: number
  timestamp: string
}

export interface CircadianBaselineBin {
  hourBin: number // 0 to 23
  samplesCount: number
  avgRestingHR: number
  avgBodyTemp: number
  avgSpo2: number
  avgHrv: number | null
  stdDevBodyTemp: number
  isConverged: boolean
}

export interface PersonalBaseline {
  restingHR: number // Personalized learned resting HR
  restingHRRange: { min: number; max: number }
  hrvBaseline: number
  hrvRange: { min: number; max: number }
  tempBaseline: number
  tempRange: { min: number; max: number }
  activityBaseline: number
  gaitSymmetryBaseline: number
  gaitVariabilityBaseline: number
  isLearningMode: boolean
  totalSamplesCount: number
  confidence: 'High' | 'Medium' | 'Learning'
  lastUpdated: string
  timeOfDayModel: string
  refRestingHRRange: { min: number; max: number } // Demographic reference range
  circadianBins?: Record<number, CircadianBaselineBin>
}

export interface RiskScores {
  physiological: number // 0-100
  stress: number // 0-100
  temperature: number // 0-100
  heat: number // 0-100 derived from PSI
  psi: number // Raw PSI 0-9
  wbgt: number // Wet-Bulb Globe Temp °C
  mobility: number // 0-100
  environmental: number // 0-100
  overall: number // Composite Risk Index (CRI) 0-100
  statusLevel: 'Normal' | 'Monitor' | 'Warning' | 'High Risk'
  statusLabel: string
  color: 'green' | 'yellow' | 'orange' | 'red'
  criticalOverride: boolean
  overrideReason?: string
  contributions: {
    physiological: number
    temperature: number
    heat: number
    environmental: number
    mobility: number
  }
  explanations: string[]
  climateBodyAnalysis: string[]
  tempAnomaly: {
    detected: boolean
    label: string
  }
}

export interface DailyAnalysis {
  avgHR: number
  maxHR: number
  avgSpo2: number
  minSpo2: number
  avgBodyTemp: number
  maxBodyTemp: number
  tempAnomalyCount: number
  avgAmbientTemp: number
  maxAmbientTemp: number
  avgHumidity: number
  avgAqi: number
  maxAqi: number
  avgCri: number
  maxCri: number
  timeInTier: { green: number; yellow: number; orange: number; red: number }
  climateLinkedEventsCount: number
  trendInsights: string[]
}

export interface AlertItem {
  id: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  title: string
  time: string
  trigger: string
  supportingSignals: string[]
  recommendedAction: string
  acknowledged: boolean
  dismissed: boolean
}

export interface HardwareSensor {
  id: string
  name: string
  chip: string
  signals: string
  connected: boolean
  battery: number
  signalQuality: number
  lastSync: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'aeris'
  text: string
  timestamp: string
  source?: 'Gemini 3.6 Flash' | 'Local Rule Engine' | 'Local Edge AI'
  supportingData?: {
    riskScore?: number
    vitalsSummary?: string
    triageLevel?: string
    confidence?: number
  }
}

export interface HistoricalPoint {
  time: string
  heartRate: number
  hrv: number | null
  spo2: number
  bodyTemp: number
  ambientTemp: number
  humidity: number
  aqi: number
  stress: number
  heatRisk: number
  mobility: number
  overallRisk: number
}

export type SafePlaceType = 'Hospital' | 'PHC' | 'Shelter' | 'Pharmacy'

export type SafePlaceFilter = 'All' | 'Hospital' | 'PHC' | 'Shelter' | 'Pharmacy'

export interface SafePlace {
  id: string
  name: string
  type: SafePlaceType
  lat: number
  lon: number
  distanceKm?: number
  address: string
  phone?: string
  openNow?: boolean
  isDemo?: boolean
  recommendationReason?: string
  capabilities?: string[]
}

export interface UserLocation {
  lat: number
  lon: number
  accuracy?: number
  displayName?: string
  shortName?: string
  source?: 'gps' | 'search'
}

export interface PushNotificationEvent {
  id: string
  type: 'obstacle' | 'food' | 'sos' | 'threshold'
  title: string
  body: string
  timestamp: string
  targetPhone: string
  smsStatus?: string
  vitals?: { heartRate: number; spo2: number; bodyTemp?: number }
  location?: { lat: number; lon: number }
}
