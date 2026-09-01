export type Scenario =
  | 'Normal'
  | 'Stress'
  | 'Heat'
  | 'Temperature Anomaly'
  | 'Mobility'
  | 'Monsoon'

export type ActivityState = 'Sedentary' | 'Light Activity' | 'Moderate Walking' | 'Active Motion'

export interface TelemetryData {
  heartRate: number // 60–100 BPM
  hrv: number // 30–90 ms
  bodyTemp: number // 36.2–37.4°C
  spo2: number // 94–100%
  ambientTemp: number // 25–42°C
  humidity: number // 40–95%
  pressure: number // 980–1030 hPa
  rain: boolean // ON/OFF
  activity: ActivityState
  activityLevel: number // 0-100
  gaitVariability: number // 0-100
  gaitSymmetry: number // 50-100%
  steps: number
  cadence: number // steps/min
  walkingSpeed: number // m/s
  externalAqi: number // Optional external AQI
  timestamp: string
}

export interface PersonalBaseline {
  restingHR: number
  restingHRRange: { min: number; max: number }
  hrvBaseline: number
  hrvRange: { min: number; max: number }
  tempBaseline: number
  tempRange: { min: number; max: number }
  activityBaseline: number
  gaitSymmetryBaseline: number
  gaitVariabilityBaseline: number
}

export interface RiskScores {
  physiological: number
  stress: number
  temperature: number
  heat: number
  mobility: number
  environmental: number
  overall: number
  statusLevel: 'Normal' | 'Monitor' | 'Warning' | 'High Risk'
  statusLabel: string
  color: 'green' | 'yellow' | 'orange' | 'red'
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
  source?: 'Gemini 3.6 Flash' | 'Local Rule Engine'
  supportingData?: {
    riskScore?: number
    vitalsSummary?: string
  }
}

export interface HistoricalPoint {
  time: string
  heartRate: number
  hrv: number
  bodyTemp: number
  ambientTemp: number
  humidity: number
  stress: number
  heatRisk: number
  mobility: number
  overallRisk: number
}
