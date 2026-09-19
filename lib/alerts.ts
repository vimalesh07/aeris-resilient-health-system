import { AlertItem, RiskScores, TelemetryData } from '@/types/aeris'

export function evaluateAlerts(telemetry: TelemetryData, risks: RiskScores, existingAlerts: AlertItem[]): AlertItem[] {
  const activeAlerts: AlertItem[] = []
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Helper to add or update alert
  const addAlert = (newAlert: Omit<AlertItem, 'time' | 'acknowledged' | 'dismissed'>) => {
    const existing = existingAlerts.find((a) => a.id === newAlert.id)
    if (existing) {
      activeAlerts.push({
        ...newAlert,
        time: existing.time,
        acknowledged: existing.acknowledged,
        dismissed: existing.dismissed,
      })
    } else {
      activeAlerts.push({
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
      recommendedAction: 'Environmental conditions have changed. Stay sheltered and take precaution against wet or slippery surfaces.',
    })
  }

  // Disaster 1: Extreme Heatwave & Hyperthermia Alert
  if (telemetry.ambientTemp >= 42.0 || risks.heat >= 75) {
    addAlert({
      id: 'alert_disaster_heatwave',
      severity: 'Critical',
      title: '🔥 Extreme Heatwave & Hyperthermia Alert',
      trigger: `Ambient heat at ${telemetry.ambientTemp}°C with ${telemetry.humidity}% humidity causing critical physiological strain (PSI ${risks.psi}/9).`,
      supportingSignals: [
        `Ambient Temp: ${telemetry.ambientTemp}°C`,
        `Wet-Bulb Globe Temp: ${risks.wbgt}°C`,
        `Body Temp: ${telemetry.bodyTemp}°C`,
        `Heart Rate: ${telemetry.heartRate} BPM`,
      ],
      recommendedAction: 'IMMEDIATE ACTION REQUIRED: Move to an AC cooling shelter, consume ORS fluids, and rest immediately to prevent heatstroke.',
    })
  }

  // Disaster 2: Cyclonic Surge & Flood Safe Zone Alert
  if (telemetry.pressure <= 988 || (telemetry.rain && telemetry.precipitation >= 30)) {
    addAlert({
      id: 'alert_disaster_flood',
      severity: 'Critical',
      title: '🌊 Cyclonic Surge & Flood Warning',
      trigger: `Barometric pressure dropped to ${telemetry.pressure} hPa with torrential precipitation (${telemetry.precipitation} mm).`,
      supportingSignals: [
        `Barometric Pressure: ${telemetry.pressure} hPa (Cyclonic Low)`,
        `Precipitation Rate: ${telemetry.precipitation} mm`,
        `Gait Stability: ${telemetry.gaitSymmetry}%`,
      ],
      recommendedAction: 'FLOOD ADVISORY: Evacuate low-lying areas. Move to high-ground cyclone shelters and avoid submerged roads.',
    })
  }

  // Disaster 3: Hazardous AQI & Respiratory Desaturation Alert
  if (telemetry.externalAqi >= 300 || telemetry.spo2 <= 92) {
    addAlert({
      id: 'alert_disaster_aqi_spike',
      severity: 'Critical',
      title: '🌫️ Hazardous Air Quality (AQI 395) & SpO₂ Drop',
      trigger: `Severe air quality spike (AQI ${telemetry.externalAqi}, PM2.5 ${telemetry.pm25 || 250} µg/m³) accompanied by blood oxygen desaturation (${telemetry.spo2}%).`,
      supportingSignals: [
        `External AQI: ${telemetry.externalAqi} (Hazardous)`,
        `PM2.5: ${telemetry.pm25 || 250} µg/m³`,
        `Blood Oxygen SpO₂: ${telemetry.spo2}%`,
      ],
      recommendedAction: 'RESPIRATORY ALERT: Wear N95 respirator mask immediately. Stay indoors with air filtration and access emergency oxygen if needed.',
    })
  }

  // Disaster 4: Impact Fall & Emergency SOS Alert
  if (telemetry.gaitSymmetry <= 40 || telemetry.weatherCondition.includes('Fall SOS')) {
    addAlert({
      id: 'alert_disaster_fall_sos',
      severity: 'Critical',
      title: '🚨 Impact Fall & Emergency SOS Active',
      trigger: `Sudden gait impact vector detected (Symmetry ${telemetry.gaitSymmetry}%) with acute tachycardia (${telemetry.heartRate} BPM).`,
      supportingSignals: [
        `Gait Symmetry: ${telemetry.gaitSymmetry}% (Impact Arrest)`,
        `Heart Rate: ${telemetry.heartRate} BPM (Panic Tachycardia)`,
        `Movement Activity: ${telemetry.activity}`,
      ],
      recommendedAction: 'EMERGENCY SOS: Dispatching location coordinates to 24/7 Trauma ICU & Emergency Contact Helpline (+91 112 / +91 108).',
    })
  }

  // Critical Tachycardia & HR Limit Alert
  if (telemetry.heartRate >= 115) {
    addAlert({
      id: 'alert_tachycardia',
      severity: 'Critical',
      title: '🚨 Critical Tachycardia & HR Limit Exceeded',
      trigger: `Live heart rate (${telemetry.heartRate} BPM) exceeded maximum safe baseline threshold (115 BPM).`,
      supportingSignals: [
        `Heart Rate: ${telemetry.heartRate} BPM (Limit 115 BPM)`,
        `SpO₂ Level: ${telemetry.spo2}%`,
        `Activity State: ${telemetry.activity}`,
      ],
      recommendedAction: 'Automated 3-second SOS override executed. Rest immediately in a seated position.',
    })
  }

  return activeAlerts.filter((a) => !a.dismissed)
}
