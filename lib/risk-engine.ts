import { PersonalBaseline, RiskScores, TelemetryData } from '@/types/aeris'

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function calculateRiskScores(telemetry: TelemetryData, baseline: PersonalBaseline): RiskScores {
  // 1. Physiological Risk (HR elevation above resting + HRV drop + SpO2 drop)
  const hrDev = Math.max(0, telemetry.heartRate - baseline.restingHRRange.max)
  const hrvDrop = Math.max(0, baseline.hrvRange.min - telemetry.hrv)
  const spo2Drop = Math.max(0, 98 - telemetry.spo2)

  const physiological = clamp(
    Math.round(hrDev * 2.2 + hrvDrop * 1.5 + spo2Drop * 8),
    5,
    98
  )

  // 2. Stress Risk (Physiological stress via HR elevation + low HRV at low activity - NO GSR)
  // Low activity + elevated HR + low HRV = high physiological stress indicator
  const activityFactor = telemetry.activityLevel < 35 ? 1.4 : 0.8
  const stress = clamp(
    Math.round(((telemetry.heartRate - 60) * 0.8 + (80 - telemetry.hrv) * 0.9) * activityFactor),
    10,
    95
  )

  // 3. Temperature Risk (Body temperature variance above baseline)
  const tempDev = Math.max(0, telemetry.bodyTemp - baseline.tempRange.max)
  const temperature = clamp(
    Math.round(tempDev * 45 + (telemetry.bodyTemp > 37.5 ? 25 : 0)),
    5,
    99
  )

  // 4. Heat Risk (Ambient temp + humidity + body temp + HR strain)
  // Prototype heat-risk calculation
  const heatIndexImpact = Math.max(0, telemetry.ambientTemp - 30) * 3.5 + Math.max(0, telemetry.humidity - 50) * 0.6
  const physiologicalHeatStrain = (telemetry.heartRate - 70) * 0.4 + Math.max(0, telemetry.bodyTemp - 36.6) * 15
  const heat = clamp(
    Math.round(heatIndexImpact + physiologicalHeatStrain),
    5,
    96
  )

  // 5. Mobility Risk (Gait variability + symmetry drop)
  const symmetryDrop = Math.max(0, baseline.gaitSymmetryBaseline - telemetry.gaitSymmetry)
  const variabilityIncrease = Math.max(0, telemetry.gaitVariability - baseline.gaitVariabilityBaseline)
  const mobility = clamp(
    Math.round(symmetryDrop * 2.8 + variabilityIncrease * 1.2),
    5,
    95
  )

  // 6. Environmental Risk (Barometric pressure drop + rain + humidity + ambient heat + external AQI)
  const pressureDrop = Math.max(0, 1013 - telemetry.pressure)
  const rainImpact = telemetry.rain ? 35 : 0
  const aqiImpact = Math.max(0, telemetry.externalAqi - 50) * 0.4
  const environmental = clamp(
    Math.round(pressureDrop * 1.8 + rainImpact + Math.max(0, telemetry.ambientTemp - 32) * 2 + aqiImpact),
    5,
    95
  )

  // Multi-Modal Fusion: Overall AERIS Risk Score
  // Weighted combination with multi-signal agreement check to prevent false alerts
  const rawOverall = (
    physiological * 0.25 +
    stress * 0.15 +
    temperature * 0.25 +
    heat * 0.15 +
    mobility * 0.10 +
    environmental * 0.10
  )

  // Count how many sub-risks are elevated (> 45)
  const elevatedCount = [physiological, stress, temperature, heat, mobility, environmental].filter((s) => s > 45).length

  // Anti-false alert dampener: if only 1 signal is slightly elevated, dampen overall score
  const multiSignalMultiplier = elevatedCount >= 2 ? 1.05 : elevatedCount === 1 ? 0.9 : 0.85

  const overall = clamp(Math.round(rawOverall * multiSignalMultiplier), 5, 99)

  let statusLevel: RiskScores['statusLevel'] = 'Normal'
  let statusLabel = 'Low Risk'
  let color: RiskScores['color'] = 'green'

  if (overall <= 25) {
    statusLevel = 'Normal'
    statusLabel = 'Low Risk'
    color = 'green'
  } else if (overall <= 50) {
    statusLevel = 'Monitor'
    statusLabel = 'Moderate Risk'
    color = 'yellow'
  } else if (overall <= 75) {
    statusLevel = 'Warning'
    statusLabel = 'Elevated Risk'
    color = 'orange'
  } else {
    statusLevel = 'High Risk'
    statusLabel = 'Attention Required'
    color = 'red'
  }

  return {
    physiological,
    stress,
    temperature,
    heat,
    mobility,
    environmental,
    overall,
    statusLevel,
    statusLabel,
    color,
  }
}
