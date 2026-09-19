import {
  DailyAnalysis,
  HistoricalPoint,
  PersonalBaseline,
  RiskScores,
  Scenario,
  TelemetryData,
  UserProfile,
} from '@/types/aeris'

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Vimal',
  age: 20,
  sex: 'Male',
  heightCm: 175,
  weightKg: 72,
  activityLevel: 'Moderately Active',
  knownRestingHR: 64,
  knownHrvBaseline: 65,
  healthNotes: '',
  units: 'metric',
  emergencyContactPhone: '7092796084',
  enableSmsAlerts: true,
  enableWhatsappAlerts: true,
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 23.5
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  return Number(bmi.toFixed(1))
}

export function calculateDemographicReferenceHRRange(profile: UserProfile): { min: number; max: number } {
  let min = 60
  let max = 76

  switch (profile.activityLevel) {
    case 'Athlete':
      min = 45
      max = 60
      break
    case 'Very Active':
      min = 52
      max = 68
      break
    case 'Moderately Active':
      min = 58
      max = 75
      break
    case 'Lightly Active':
      min = 62
      max = 80
      break
    case 'Sedentary':
      min = 65
      max = 85
      break
  }

  // Slight age adjustment for reference context only
  if (profile.age > 60) {
    min += 2
    max += 4
  }

  return { min, max }
}

export const DEFAULT_BASELINE: PersonalBaseline = {
  restingHR: 64,
  restingHRRange: { min: 56, max: 72 },
  hrvBaseline: 65,
  hrvRange: { min: 50, max: 85 },
  tempBaseline: 36.5,
  tempRange: { min: 36.1, max: 37.1 },
  activityBaseline: 30,
  gaitSymmetryBaseline: 96,
  gaitVariabilityBaseline: 12,
  isLearningMode: false,
  totalSamplesCount: 342,
  confidence: 'High',
  lastUpdated: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
  timeOfDayModel: '24 hourly circadian bins (14-day rolling window)',
  refRestingHRRange: { min: 58, max: 75 },
  circadianBins: {},
}

export function getScenarioTarget(scenario: Scenario): TelemetryData {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  switch (scenario) {
    case 'Normal':
      return {
        heartRate: 69,
        hrv: 65,
        bodyTemp: 36.5,
        spo2: 98,
        ambientTemp: 27.2,
        humidity: 48,
        pressure: 1014,
        rain: false,
        precipitation: 0,
        weatherCondition: 'Clear',
        externalAqi: 42,
        pm25: 12,
        pm10: 24,
        o3: 30,
        no2: 15,
        activity: 'Light Activity',
        activityLevel: 28,
        gaitVariability: 10,
        gaitSymmetry: 97,
        steps: 4520,
        cadence: 102,
        walkingSpeed: 1.2,
        timestamp,
      }
    case 'Stress':
      return {
        heartRate: 92,
        hrv: 34,
        bodyTemp: 36.8,
        spo2: 97,
        ambientTemp: 29.0,
        humidity: 52,
        pressure: 1012,
        rain: false,
        precipitation: 0,
        weatherCondition: 'Humid',
        externalAqi: 45,
        pm25: 14,
        pm10: 28,
        o3: 35,
        no2: 18,
        activity: 'Sedentary',
        activityLevel: 15,
        gaitVariability: 18,
        gaitSymmetry: 94,
        steps: 4580,
        cadence: 90,
        walkingSpeed: 1.0,
        timestamp,
      }
    case 'Heat':
      return {
        heartRate: 98,
        hrv: 40,
        bodyTemp: 37.3,
        spo2: 96,
        ambientTemp: 41.5,
        humidity: 88,
        pressure: 1006,
        rain: false,
        precipitation: 0,
        weatherCondition: 'Extreme Heat',
        externalAqi: 78,
        pm25: 28,
        pm10: 52,
        o3: 65,
        no2: 24,
        activity: 'Moderate Walking',
        activityLevel: 45,
        gaitVariability: 26,
        gaitSymmetry: 91,
        steps: 5820,
        cadence: 110,
        walkingSpeed: 1.1,
        timestamp,
      }
    case 'Temperature Anomaly':
      return {
        heartRate: 104,
        hrv: 35,
        bodyTemp: 38.3,
        spo2: 95,
        ambientTemp: 30.5,
        humidity: 50,
        pressure: 1010,
        rain: false,
        precipitation: 0,
        weatherCondition: 'Warm',
        externalAqi: 48,
        pm25: 15,
        pm10: 30,
        o3: 38,
        no2: 16,
        activity: 'Sedentary',
        activityLevel: 10,
        gaitVariability: 22,
        gaitSymmetry: 88,
        steps: 4610,
        cadence: 80,
        walkingSpeed: 0.9,
        timestamp,
      }
    case 'Mobility':
      return {
        heartRate: 78,
        hrv: 58,
        bodyTemp: 36.6,
        spo2: 98,
        ambientTemp: 27.5,
        humidity: 46,
        pressure: 1015,
        rain: false,
        precipitation: 0,
        weatherCondition: 'Clear',
        externalAqi: 42,
        pm25: 11,
        pm10: 22,
        o3: 28,
        no2: 12,
        activity: 'Active Motion',
        activityLevel: 65,
        gaitVariability: 68,
        gaitSymmetry: 72,
        steps: 7200,
        cadence: 118,
        walkingSpeed: 1.3,
        timestamp,
      }
    case 'Monsoon':
      return {
        heartRate: 76,
        hrv: 62,
        bodyTemp: 36.7,
        spo2: 98,
        ambientTemp: 26.5,
        humidity: 94,
        pressure: 986,
        rain: true,
        precipitation: 12.5,
        weatherCondition: 'Heavy Rain',
        externalAqi: 62,
        pm25: 18,
        pm10: 34,
        o3: 42,
        no2: 20,
        activity: 'Light Activity',
        activityLevel: 20,
        gaitVariability: 34,
        gaitSymmetry: 90,
        steps: 4650,
        cadence: 95,
        walkingSpeed: 1.0,
        timestamp,
      }
    case 'disaster_heatwave':
      return {
        heartRate: 112,
        hrv: 28,
        bodyTemp: 38.5,
        spo2: 95,
        ambientTemp: 44.0,
        humidity: 68,
        pressure: 1002,
        rain: false,
        precipitation: 0,
        weatherCondition: 'Extreme Heatwave Crisis (44°C)',
        externalAqi: 165,
        pm25: 75,
        pm10: 120,
        o3: 88,
        no2: 45,
        activity: 'Moderate Walking',
        activityLevel: 55,
        gaitVariability: 32,
        gaitSymmetry: 88,
        steps: 6100,
        cadence: 105,
        walkingSpeed: 1.0,
        timestamp,
      }
    case 'disaster_flood':
      return {
        heartRate: 88,
        hrv: 55,
        bodyTemp: 36.4,
        spo2: 97,
        ambientTemp: 25.5,
        humidity: 96,
        pressure: 984,
        rain: true,
        precipitation: 45.0,
        weatherCondition: 'Severe Cyclone & Flood Surge (984 hPa)',
        externalAqi: 85,
        pm25: 22,
        pm10: 40,
        o3: 30,
        no2: 18,
        activity: 'Active Motion',
        activityLevel: 60,
        gaitVariability: 48,
        gaitSymmetry: 68,
        steps: 4800,
        cadence: 88,
        walkingSpeed: 0.8,
        timestamp,
      }
    case 'disaster_aqi_spike':
      return {
        heartRate: 96,
        hrv: 38,
        bodyTemp: 36.7,
        spo2: 91,
        ambientTemp: 28.0,
        humidity: 65,
        pressure: 1010,
        rain: false,
        precipitation: 0,
        weatherCondition: 'Hazardous AQI 395 Smog Crisis',
        externalAqi: 395,
        pm25: 265,
        pm10: 420,
        o3: 110,
        no2: 95,
        activity: 'Sedentary',
        activityLevel: 15,
        gaitVariability: 20,
        gaitSymmetry: 94,
        steps: 2100,
        cadence: 70,
        walkingSpeed: 0.7,
        timestamp,
      }
    case 'disaster_fall_sos':
      return {
        heartRate: 72,
        hrv: 55,
        bodyTemp: 36.8,
        spo2: 95,
        ambientTemp: 28.5,
        humidity: 50,
        pressure: 1012,
        rain: false,
        precipitation: 0,
        weatherCondition: 'Impact Fall / Acute SOS Distress',
        externalAqi: 45,
        pm25: 12,
        pm10: 25,
        o3: 30,
        no2: 15,
        activity: 'Sedentary',
        activityLevel: 0,
        gaitVariability: 85,
        gaitSymmetry: 30,
        steps: 0,
        cadence: 0,
        walkingSpeed: 0,
        timestamp,
      }
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function tickTelemetry(current: TelemetryData, scenario: Scenario): TelemetryData {
  const target = getScenarioTarget(scenario)
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const hrDrift = (target.heartRate - current.heartRate) * 0.15
  const hrvDrift = target.hrv !== null && current.hrv !== null ? (target.hrv - current.hrv) * 0.15 : 0
  const tempDrift = (target.bodyTemp - current.bodyTemp) * 0.1
  const ambientDrift = (target.ambientTemp - current.ambientTemp) * 0.1
  const humDrift = (target.humidity - current.humidity) * 0.1
  const pressDrift = (target.pressure - current.pressure) * 0.1

  return {
    ...current,
    heartRate: Math.round(clamp(current.heartRate + hrDrift, 60, 110)),
    hrv: target.hrv !== null && current.hrv !== null ? Math.round(clamp(current.hrv + hrvDrift, 25, 95)) : current.hrv,
    bodyTemp: Number(clamp(current.bodyTemp + tempDrift, 36.0, 39.0).toFixed(1)),
    spo2: Math.round(clamp(current.spo2 + (target.spo2 - current.spo2) * 0.1, 93, 100)),
    ambientTemp: Number(clamp(current.ambientTemp + ambientDrift, 20.0, 45.0).toFixed(1)),
    humidity: Math.round(clamp(current.humidity + humDrift, 35, 98)),
    pressure: Math.round(clamp(current.pressure + pressDrift, 970, 1040)),
    rain: target.rain,
    activity: target.activity,
    activityLevel: target.activityLevel,
    gaitVariability: target.gaitVariability,
    gaitSymmetry: target.gaitSymmetry,
    steps: current.steps,
    cadence: target.cadence,
    walkingSpeed: target.walkingSpeed,
    externalAqi: target.externalAqi,
    pm25: target.pm25,
    pm10: target.pm10,
    o3: target.o3,
    no2: target.no2,
    timestamp,
  }
}

export function updateBaselineWithSample(
  prevBaseline: PersonalBaseline,
  telemetry: TelemetryData,
  profile?: UserProfile
): PersonalBaseline {
  const hour = new Date().getHours()
  const bins = { ...(prevBaseline.circadianBins || {}) }
  const currentBin = bins[hour] || {
    hourBin: hour,
    samplesCount: 0,
    avgRestingHR: telemetry.heartRate,
    avgBodyTemp: telemetry.bodyTemp,
    avgSpo2: telemetry.spo2,
    avgHrv: telemetry.hrv,
    stdDevBodyTemp: 0.3,
    isConverged: false,
  }

  const n = currentBin.samplesCount + 1
  const newAvgHR = currentBin.avgRestingHR + (telemetry.heartRate - currentBin.avgRestingHR) / n
  const newAvgTemp = currentBin.avgBodyTemp + (telemetry.bodyTemp - currentBin.avgBodyTemp) / n
  const newAvgSpo2 = currentBin.avgSpo2 + (telemetry.spo2 - currentBin.avgSpo2) / n
  const newAvgHrv =
    telemetry.hrv !== null
      ? (currentBin.avgHrv || telemetry.hrv) + (telemetry.hrv - (currentBin.avgHrv || telemetry.hrv)) / n
      : currentBin.avgHrv

  const isConverged = n >= 5

  bins[hour] = {
    hourBin: hour,
    samplesCount: n,
    avgRestingHR: Number(newAvgHR.toFixed(1)),
    avgBodyTemp: Number(newAvgTemp.toFixed(2)),
    avgSpo2: Number(newAvgSpo2.toFixed(1)),
    avgHrv: newAvgHrv !== null ? Number(newAvgHrv.toFixed(1)) : null,
    stdDevBodyTemp: 0.35,
    isConverged,
  }

  const totalSamples = prevBaseline.totalSamplesCount + 1
  const overallLearning = totalSamples < 10
  const confidence: PersonalBaseline['confidence'] = totalSamples > 50 ? 'High' : totalSamples >= 10 ? 'Medium' : 'Learning'

  const refRange = profile ? calculateDemographicReferenceHRRange(profile) : prevBaseline.refRestingHRRange

  return {
    ...prevBaseline,
    restingHR: Number(newAvgHR.toFixed(1)),
    restingHRRange: { min: Math.round(newAvgHR - 8), max: Math.round(newAvgHR + 8) },
    tempBaseline: Number(newAvgTemp.toFixed(2)),
    tempRange: { min: Number((newAvgTemp - 0.4).toFixed(1)), max: Number((newAvgTemp + 0.5).toFixed(1)) },
    totalSamplesCount: totalSamples,
    isLearningMode: overallLearning,
    confidence,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    refRestingHRRange: refRange,
    circadianBins: bins,
  }
}

export function calculateDailyAnalysis(
  telemetryHistory: TelemetryData[],
  baseline: PersonalBaseline,
  currentRisks: RiskScores
): DailyAnalysis {
  if (telemetryHistory.length === 0) {
    return {
      avgHR: baseline.restingHR,
      maxHR: baseline.restingHR + 5,
      avgSpo2: 98,
      minSpo2: 98,
      avgBodyTemp: baseline.tempBaseline,
      maxBodyTemp: baseline.tempBaseline,
      tempAnomalyCount: 0,
      avgAmbientTemp: 28,
      maxAmbientTemp: 28,
      avgHumidity: 50,
      avgAqi: 45,
      maxAqi: 45,
      avgCri: currentRisks.overall,
      maxCri: currentRisks.overall,
      timeInTier: { green: 100, yellow: 0, orange: 0, red: 0 },
      climateLinkedEventsCount: 0,
      trendInsights: ['Insufficient history collected today — AERIS baseline actively learning.'],
    }
  }

  const hrs = telemetryHistory.map((t) => t.heartRate)
  const spo2s = telemetryHistory.map((t) => t.spo2)
  const temps = telemetryHistory.map((t) => t.bodyTemp)
  const ambients = telemetryHistory.map((t) => t.ambientTemp)
  const hums = telemetryHistory.map((t) => t.humidity)
  const aqis = telemetryHistory.map((t) => t.externalAqi)

  const avgHR = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length)
  const maxHR = Math.max(...hrs)
  const avgSpo2 = Number((spo2s.reduce((a, b) => a + b, 0) / spo2s.length).toFixed(1))
  const minSpo2 = Math.min(...spo2s)
  const avgBodyTemp = Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1))
  const maxBodyTemp = Math.max(...temps)
  const avgAmbientTemp = Number((ambients.reduce((a, b) => a + b, 0) / ambients.length).toFixed(1))
  const maxAmbientTemp = Math.max(...ambients)
  const avgHumidity = Math.round(hums.reduce((a, b) => a + b, 0) / hums.length)
  const avgAqi = Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length)
  const maxAqi = Math.max(...aqis)

  const tempAnomalyCount = temps.filter((t) => t > baseline.tempBaseline + 0.6).length
  const climateEvents = telemetryHistory.filter((t) => t.ambientTemp >= 32 && t.heartRate > baseline.restingHR + 5).length

  const trendInsights: string[] = []

  if (maxAmbientTemp >= 32 && maxHR > baseline.restingHR + 10) {
    trendInsights.push(
      'Your heart rate remained elevated above your personal baseline during periods of higher ambient temperature.'
    )
  }

  if (maxBodyTemp > baseline.tempBaseline + 0.6) {
    trendInsights.push(
      'Body temperature deviation increased during peak heat exposure relative to your personal baseline.'
    )
  }

  if (maxAqi >= 80 && minSpo2 < 97) {
    trendInsights.push(
      'Elevated AQI coincided with a decrease in SpO₂ compared with your recent personal baseline.'
    )
  }

  if (trendInsights.length === 0) {
    trendInsights.push(
      'Physiological metrics stayed aligned with your personal baseline throughout today’s climate conditions.'
    )
  }

  return {
    avgHR,
    maxHR,
    avgSpo2,
    minSpo2,
    avgBodyTemp,
    maxBodyTemp,
    tempAnomalyCount,
    avgAmbientTemp,
    maxAmbientTemp,
    avgHumidity,
    avgAqi,
    maxAqi,
    avgCri: currentRisks.overall,
    maxCri: Math.max(currentRisks.overall, 45),
    timeInTier: { green: 75, yellow: 20, orange: 5, red: 0 },
    climateLinkedEventsCount: climateEvents,
    trendInsights,
  }
}

export function generateHistoryPoints(timeframe: '24h' | '7d' | '30d', scenario: Scenario): HistoricalPoint[] {
  const count = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30
  const points: HistoricalPoint[] = []
  const target = getScenarioTarget(scenario)

  const now = new Date()

  for (let i = count - 1; i >= 0; i--) {
    let label = ''
    if (timeframe === '24h') {
      const d = new Date(now.getTime() - i * 3600 * 1000)
      label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (timeframe === '7d') {
      const d = new Date(now.getTime() - i * 86400 * 1000)
      label = d.toLocaleDateString([], { weekday: 'short' })
    } else {
      const d = new Date(now.getTime() - i * 86400 * 1000)
      label = `${d.getMonth() + 1}/${d.getDate()}`
    }

    const recencyFactor = Math.pow((count - i) / count, 1.5)
    const baseHR = DEFAULT_BASELINE.restingHR + (target.heartRate - DEFAULT_BASELINE.restingHR) * recencyFactor
    const baseHRV = target.hrv !== null ? DEFAULT_BASELINE.hrvBaseline + (target.hrv - DEFAULT_BASELINE.hrvBaseline) * recencyFactor : null
    const baseTemp = DEFAULT_BASELINE.tempBaseline + (target.bodyTemp - DEFAULT_BASELINE.tempBaseline) * recencyFactor
    const baseAmb = 28 + (target.ambientTemp - 28) * recencyFactor
    const baseHum = 50 + (target.humidity - 50) * recencyFactor

    const noise = Math.sin(i * 0.8) * 3

    points.push({
      time: label,
      heartRate: Math.round(clamp(baseHR + noise, 60, 110)),
      hrv: baseHRV !== null ? Math.round(clamp(baseHRV - noise * 0.5, 25, 95)) : null,
      spo2: target.spo2,
      bodyTemp: Number(clamp(baseTemp + noise * 0.05, 36.1, 38.8).toFixed(1)),
      ambientTemp: Number(clamp(baseAmb + noise * 0.4, 22, 44).toFixed(1)),
      humidity: Math.round(clamp(baseHum + noise * 1.5, 38, 96)),
      aqi: target.externalAqi,
      stress: Math.round(clamp(30 + (target.heartRate - 70) * 1.2, 10, 95)),
      heatRisk: Math.round(clamp((baseAmb - 25) * 2.5 + (baseHum - 40) * 0.6, 5, 95)),
      mobility: Math.round(clamp(target.gaitSymmetry, 50, 99)),
      overallRisk: Math.round(clamp(20 + (target.heartRate - 70) * 0.8 + (target.bodyTemp - 36.5) * 20, 10, 95)),
    })
  }

  return points
}
