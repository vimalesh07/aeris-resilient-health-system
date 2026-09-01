import { PersonalBaseline, RiskScores, TelemetryData } from '@/types/aeris'

export function generateCompanionResponse(
  query: string,
  telemetry: TelemetryData,
  risks: RiskScores,
  baseline: PersonalBaseline
): string {
  const q = query.toLowerCase()

  if (q.includes('heat') || q.includes('hot') || q.includes('temperature ambient')) {
    return `Your heat-risk indicator is currently **${risks.heat}/100**. This prototype score combines ambient temperature (${telemetry.ambientTemp}°C) and humidity (${telemetry.humidity}%) with your physiological signals (heart rate: ${telemetry.heartRate} BPM, body temp: ${telemetry.bodyTemp}°C). When external heat is high, your body works harder to maintain balance. Consider resting in a shaded or cooled space and drinking water.`
  }

  if (q.includes('stress') || q.includes('hrv') || q.includes('anxiety') || q.includes('heart rate')) {
    return `Your stress index is **${risks.stress}/100**. AERIS measures physiological stress primarily using your heart rate (${telemetry.heartRate} BPM) and heart rate variability (${telemetry.hrv} ms) relative to your personal resting baseline (${baseline.restingHR} BPM, ${baseline.hrvBaseline} ms). Your indicators show elevated strain. Would you like to launch a 2-minute guided breathing session?`
  }

  if (q.includes('temp') || q.includes('fever') || q.includes('body temp') || q.includes('anomaly')) {
    const dev = (telemetry.bodyTemp - baseline.tempBaseline).toFixed(1)
    return `Your current body temperature reading is **${telemetry.bodyTemp}°C** (${dev >= '0' ? '+' : ''}${dev}°C from your 36.6°C baseline). This temperature trend is above your usual range. Continue monitoring your signals, stay hydrated, and rest.`
  }

  if (q.includes('mobility') || q.includes('gait') || q.includes('walk') || q.includes('steps')) {
    return `Your mobility score is **${100 - risks.mobility}/100**. Your simulated MPU6050 motion sensor measures gait symmetry (${telemetry.gaitSymmetry}%) and movement variability (${telemetry.gaitVariability}%). Your current movement pattern differs slightly from your usual baseline (${baseline.gaitSymmetryBaseline}% symmetry).`
  }

  if (q.includes('rain') || q.includes('monsoon') || q.includes('climate') || q.includes('weather') || q.includes('pressure')) {
    return `Current climate health sensors (BME280 & Rain Sensor) report ambient temperature of ${telemetry.ambientTemp}°C, humidity at ${telemetry.humidity}%, barometric pressure at ${telemetry.pressure} hPa, and precipitation state: ${telemetry.rain ? 'Active Rain' : 'Dry'}. External AQI is ${telemetry.externalAqi}.`
  }

  if (q.includes('overall') || q.includes('risk') || q.includes('score') || q.includes('status')) {
    return `Your overall AERIS Risk Score is **${risks.overall}/100** (${risks.statusLabel}). This score is calculated on-device by fusing vitals (physiological: ${risks.physiological}), stress (${risks.stress}), body temp (${risks.temperature}), heat strain (${risks.heat}), mobility (${risks.mobility}), and environmental context (${risks.environmental}).`
  }

  if (q.includes('privacy') || q.includes('cloud') || q.includes('data') || q.includes('security')) {
    return `AERIS operates under a strict privacy-first architecture. All signal processing, feature extraction, Edge AI inference, and risk scoring execute locally on your device. Raw sensor data and health profiles are encrypted and never uploaded to any cloud server.`
  }

  return `I am monitoring your 6 core signal groups in real-time. Currently, your overall AERIS score is **${risks.overall}/100** (${risks.statusLabel}). Your heart rate is ${telemetry.heartRate} BPM, HRV is ${telemetry.hrv} ms, body temperature is ${telemetry.bodyTemp}°C, and ambient temperature is ${telemetry.ambientTemp}°C. Ask me about your heat risk, stress pattern, mobility, climate health, or privacy architecture!`
}
