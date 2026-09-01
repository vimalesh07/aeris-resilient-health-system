import { AlertItem, RiskScores, TelemetryData } from '@/types/aeris'

export function evaluateAlerts(telemetry: TelemetryData, risks: RiskScores, existingAlerts: AlertItem[]): AlertItem[] {
  const alerts: AlertItem[] = [...existingAlerts]
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Helper to add or update alert
  const addAlert = (newAlert: Omit<AlertItem, 'time' | 'acknowledged' | 'dismissed'>) => {
    const existingIndex = alerts.findIndex((a) => a.id === newAlert.id)
    if (existingIndex >= 0) {
      // Preserve acknowledged state if already acknowledged
      alerts[existingIndex] = {
        ...alerts[existingIndex],
        ...newAlert,
        time: alerts[existingIndex].time,
      }
    } else {
      alerts.unshift({
        ...newAlert,
        time,
        acknowledged: false,
        dismissed: false,
      })
    }
  }

  // Heat Risk Alert
  if (risks.heat > 60) {
    addAlert({
      id: 'alert_heat',
      severity: risks.heat > 80 ? 'Critical' : 'High',
      title: 'Elevated Heat Risk',
      trigger: `Ambient temperature (${telemetry.ambientTemp}°C) and humidity (${telemetry.humidity}%) creating physiological strain.`,
      supportingSignals: [
        `Ambient Temp: ${telemetry.ambientTemp}°C`,
        `Humidity: ${telemetry.humidity}%`,
        `Heart Rate: ${telemetry.heartRate} BPM`,
        `Body Temp: ${telemetry.bodyTemp}°C`,
      ],
      recommendedAction: 'Move to a cooler environment, rest, and maintain hydration.',
    })
  }

  // Temperature Anomaly Alert
  if (risks.temperature > 55) {
    addAlert({
      id: 'alert_temp',
      severity: risks.temperature > 80 ? 'Critical' : 'High',
      title: 'Temperature Trend Change',
      trigger: `Body temperature (${telemetry.bodyTemp}°C) is above your normal baseline range (36.2–37.1°C).`,
      supportingSignals: [
        `Body Temp: ${telemetry.bodyTemp}°C`,
        `Baseline Deviation: +${(telemetry.bodyTemp - 36.6).toFixed(1)}°C`,
        `Elevated Heart Rate: ${telemetry.heartRate} BPM`,
      ],
      recommendedAction: 'Temperature trend is above usual baseline. Continue monitoring and consider rest.',
    })
  }

  // Mobility Pattern Alert
  if (risks.mobility > 50) {
    addAlert({
      id: 'alert_mobility',
      severity: risks.mobility > 75 ? 'High' : 'Medium',
      title: 'Mobility Pattern Change',
      trigger: `Gait symmetry has dropped to ${telemetry.gaitSymmetry}% with increased movement variability (${telemetry.gaitVariability}%).`,
      supportingSignals: [
        `Gait Symmetry: ${telemetry.gaitSymmetry}%`,
        `Gait Variability: ${telemetry.gaitVariability}%`,
        `Cadence: ${telemetry.cadence} steps/min`,
      ],
      recommendedAction: 'Your movement pattern differs from your usual baseline. Take caution while moving.',
    })
  }

  // Stress Pattern Alert
  if (risks.stress > 55) {
    addAlert({
      id: 'alert_stress',
      severity: risks.stress > 75 ? 'High' : 'Medium',
      title: 'Elevated Stress Pattern',
      trigger: `Heart rate variability (HRV) reduced to ${telemetry.hrv} ms while resting heart rate is elevated.`,
      supportingSignals: [
        `HRV: ${telemetry.hrv} ms`,
        `Heart Rate: ${telemetry.heartRate} BPM`,
        `Activity: ${telemetry.activity}`,
      ],
      recommendedAction: 'Physiological stress indicators are elevated compared with your baseline. Consider a guided breathing session.',
    })
  }

  // Monsoon / Weather Alert
  if (telemetry.rain || risks.environmental > 55) {
    addAlert({
      id: 'alert_monsoon',
      severity: 'Medium',
      title: 'Climate Condition Shift',
      trigger: `Precipitation active with humidity at ${telemetry.humidity}% and barometric pressure at ${telemetry.pressure} hPa.`,
      supportingSignals: [
        `Rain Sensor: ${telemetry.rain ? 'Active Rain' : 'Dry'}`,
        `Barometric Pressure: ${telemetry.pressure} hPa`,
        `Humidity: ${telemetry.humidity}%`,
        `External AQI: ${telemetry.externalAqi}`,
      ],
      recommendedAction: 'Environmental conditions have changed and your mobility pattern is slightly different from baseline.',
    })
  }

  return alerts.filter((a) => !a.dismissed)
}
