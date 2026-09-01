import { HistoricalPoint, PersonalBaseline, Scenario, TelemetryData } from '@/types/aeris'

export const DEFAULT_BASELINE: PersonalBaseline = {
  restingHR: 68,
  restingHRRange: { min: 60, max: 76 },
  hrvBaseline: 65,
  hrvRange: { min: 50, max: 85 },
  tempBaseline: 36.6,
  tempRange: { min: 36.2, max: 37.1 },
  activityBaseline: 30,
  gaitSymmetryBaseline: 96,
  gaitVariabilityBaseline: 12,
}

export function getScenarioTarget(scenario: Scenario): TelemetryData {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  switch (scenario) {
    case 'Normal':
      return {
        heartRate: 70,
        hrv: 68,
        bodyTemp: 36.5,
        spo2: 98,
        ambientTemp: 27.2,
        humidity: 48,
        pressure: 1014,
        rain: false,
        activity: 'Light Activity',
        activityLevel: 28,
        gaitVariability: 10,
        gaitSymmetry: 97,
        steps: 4520,
        cadence: 102,
        walkingSpeed: 1.2,
        externalAqi: 42,
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
        activity: 'Sedentary',
        activityLevel: 15,
        gaitVariability: 18,
        gaitSymmetry: 94,
        steps: 4580,
        cadence: 90,
        walkingSpeed: 1.0,
        externalAqi: 45,
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
        activity: 'Moderate Walking',
        activityLevel: 45,
        gaitVariability: 26,
        gaitSymmetry: 91,
        steps: 5820,
        cadence: 110,
        walkingSpeed: 1.1,
        externalAqi: 78,
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
        activity: 'Sedentary',
        activityLevel: 10,
        gaitVariability: 22,
        gaitSymmetry: 88,
        steps: 4610,
        cadence: 80,
        walkingSpeed: 0.9,
        externalAqi: 48,
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
        activity: 'Active Motion',
        activityLevel: 65,
        gaitVariability: 68,
        gaitSymmetry: 72,
        steps: 7200,
        cadence: 118,
        walkingSpeed: 1.3,
        externalAqi: 42,
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
        activity: 'Light Activity',
        activityLevel: 20,
        gaitVariability: 34,
        gaitSymmetry: 90,
        steps: 4650,
        cadence: 95,
        walkingSpeed: 1.0,
        externalAqi: 62,
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

  // Smooth drift towards target + small random noise
  const hrDrift = (target.heartRate - current.heartRate) * 0.15 + (Math.random() * 2 - 1)
  const hrvDrift = (target.hrv - current.hrv) * 0.15 + (Math.random() * 2 - 1)
  const tempDrift = (target.bodyTemp - current.bodyTemp) * 0.1 + (Math.random() * 0.06 - 0.03)
  const ambientDrift = (target.ambientTemp - current.ambientTemp) * 0.1 + (Math.random() * 0.2 - 0.1)
  const humDrift = (target.humidity - current.humidity) * 0.1 + (Math.random() * 0.4 - 0.2)
  const pressDrift = (target.pressure - current.pressure) * 0.1 + (Math.random() * 0.4 - 0.2)
  const gaitVarDrift = (target.gaitVariability - current.gaitVariability) * 0.15 + (Math.random() * 2 - 1)
  const gaitSymDrift = (target.gaitSymmetry - current.gaitSymmetry) * 0.15 + (Math.random() * 1.5 - 0.75)

  return {
    ...current,
    heartRate: Math.round(clamp(current.heartRate + hrDrift, 60, 110)),
    hrv: Math.round(clamp(current.hrv + hrvDrift, 25, 95)),
    bodyTemp: Number(clamp(current.bodyTemp + tempDrift, 36.0, 39.0).toFixed(1)),
    spo2: Math.round(clamp(current.spo2 + (target.spo2 - current.spo2) * 0.1, 93, 100)),
    ambientTemp: Number(clamp(current.ambientTemp + ambientDrift, 20.0, 45.0).toFixed(1)),
    humidity: Math.round(clamp(current.humidity + humDrift, 35, 98)),
    pressure: Math.round(clamp(current.pressure + pressDrift, 970, 1040)),
    rain: target.rain,
    activity: target.activity,
    activityLevel: Math.round(clamp(target.activityLevel + (Math.random() * 4 - 2), 5, 100)),
    gaitVariability: Math.round(clamp(current.gaitVariability + gaitVarDrift, 5, 90)),
    gaitSymmetry: Math.round(clamp(current.gaitSymmetry + gaitSymDrift, 55, 99)),
    steps: current.steps + (current.activityLevel > 40 ? Math.floor(Math.random() * 3 + 1) : 0),
    cadence: target.cadence,
    walkingSpeed: target.walkingSpeed,
    externalAqi: target.externalAqi,
    timestamp,
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

    // Blend normal historical baseline with current scenario spikes near the end
    const recencyFactor = Math.pow((count - i) / count, 1.5)
    const baseHR = DEFAULT_BASELINE.restingHR + (target.heartRate - DEFAULT_BASELINE.restingHR) * recencyFactor
    const baseHRV = DEFAULT_BASELINE.hrvBaseline + (target.hrv - DEFAULT_BASELINE.hrvBaseline) * recencyFactor
    const baseTemp = DEFAULT_BASELINE.tempBaseline + (target.bodyTemp - DEFAULT_BASELINE.tempBaseline) * recencyFactor
    const baseAmb = 28 + (target.ambientTemp - 28) * recencyFactor
    const baseHum = 50 + (target.humidity - 50) * recencyFactor

    const noise = Math.sin(i * 0.8) * 3

    points.push({
      time: label,
      heartRate: Math.round(clamp(baseHR + noise, 60, 110)),
      hrv: Math.round(clamp(baseHRV - noise * 0.5, 25, 95)),
      bodyTemp: Number(clamp(baseTemp + noise * 0.05, 36.1, 38.8).toFixed(1)),
      ambientTemp: Number(clamp(baseAmb + noise * 0.4, 22, 44).toFixed(1)),
      humidity: Math.round(clamp(baseHum + noise * 1.5, 38, 96)),
      stress: Math.round(clamp(30 + (target.heartRate - 70) * 1.2 + (65 - target.hrv) * 0.8, 10, 95)),
      heatRisk: Math.round(clamp((baseAmb - 25) * 2.5 + (baseHum - 40) * 0.6, 5, 95)),
      mobility: Math.round(clamp(target.gaitSymmetry, 50, 99)),
      overallRisk: Math.round(clamp(20 + (target.heartRate - 70) * 0.8 + (target.bodyTemp - 36.6) * 20, 10, 95)),
    })
  }

  return points
}
