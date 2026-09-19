import { PersonalBaseline, RiskScores, TelemetryData, UserProfile } from '@/types/aeris'

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/**
 * Calculates Wet-Bulb Globe Temperature approximation (WBGT_approx)
 * Formula from AERIS Technical Report:
 * e (vapor pressure in kPa) = (humidity / 100) * 0.6105 * exp((17.27 * T_ambient) / (237.7 + T_ambient))
 * WBGT_approx = 0.567 * T_ambient + 0.393 * e + 3.94
 */
export function calculateWBGT(ambientTemp: number, humidity: number): number {
  const e = (humidity / 100) * 0.6105 * Math.exp((17.27 * ambientTemp) / (237.7 + ambientTemp))
  const wbgt = 0.567 * ambientTemp + 0.393 * e + 3.94
  return Number(wbgt.toFixed(1))
}

/**
 * Calculates Physiological Strain Index (PSI)
 * Formula from AERIS Technical Report:
 * PSI = 5 * [(T_skin,t - T_skin,0) / (39.5 - T_skin,0)] + 5 * [(HR_t - HR_0) / (180 - HR_0)]
 * Range: 0 to 9
 */
export function calculatePSI(
  currentBodyTemp: number,
  baselineBodyTemp: number,
  currentHR: number,
  baselineHR: number
): number {
  const tSkin0 = Math.max(35.0, baselineBodyTemp)
  const hr0 = Math.max(40, baselineHR)

  const tempTerm = (currentBodyTemp - tSkin0) / Math.max(0.1, 39.5 - tSkin0)
  const hrTerm = (currentHR - hr0) / Math.max(1, 180 - hr0)

  const psi = 5 * tempTerm + 5 * hrTerm
  return Number(clamp(psi, 0, 9).toFixed(1))
}

export function calculateRiskScores(
  telemetry: TelemetryData,
  baseline: PersonalBaseline,
  profile?: UserProfile
): RiskScores {
  const currentHour = new Date().getHours()
  const currentBin = baseline.circadianBins?.[currentHour]

  // Use circadian baseline if available, otherwise general baseline
  const baselineHR = currentBin?.avgRestingHR || baseline.restingHR || 64
  const baselineTemp = currentBin?.avgBodyTemp || baseline.tempBaseline || 36.5
  const tempStdDev = currentBin?.stdDevBodyTemp || 0.4

  // -------------------------------------------------------------
  // 1. WBGT & PSI Heat Strain Risk (Technical Report Formula)
  // -------------------------------------------------------------
  const wbgt = calculateWBGT(telemetry.ambientTemp, telemetry.humidity)
  const psi = calculatePSI(telemetry.bodyTemp, baselineTemp, telemetry.heartRate, baselineHR)
  const heatScore = clamp(Math.round((psi / 9) * 100), 0, 100)

  // -------------------------------------------------------------
  // 2. Subclinical Temperature Anomaly
  // Current skin temp > rolling baseline mean + 2 stdDev
  // -------------------------------------------------------------
  const isTempAnomaly = telemetry.bodyTemp > baselineTemp + Math.max(0.6, 2 * tempStdDev)
  const tempDev = Math.max(0, telemetry.bodyTemp - baselineTemp)
  const tempScore = clamp(
    Math.round(tempDev * 45 + (isTempAnomaly ? 30 : 0) + (telemetry.bodyTemp > 37.5 ? 25 : 0)),
    0,
    100
  )

  // -------------------------------------------------------------
  // 3. Physiological Risk Score (Relative to PERSONAL BASELINE)
  // -------------------------------------------------------------
  const hrDev = Math.max(0, telemetry.heartRate - baselineHR)
  const hrDevPct = Number((((telemetry.heartRate - baselineHR) / Math.max(1, baselineHR)) * 100).toFixed(1))
  const spo2Drop = Math.max(0, 98 - telemetry.spo2)
  const hrvDrop = telemetry.hrv !== null ? Math.max(0, baseline.hrvBaseline - telemetry.hrv) : 0

  const physioRaw = hrDev * 2.0 + spo2Drop * 9 + tempDev * 25 + hrvDrop * 0.8
  const physiologicalScore = clamp(Math.round(physioRaw), 0, 100)

  // -------------------------------------------------------------
  // 4. Stress Score (Report Formula if HRV available, fallback if null)
  // -------------------------------------------------------------
  let stressScore = 0
  if (telemetry.hrv !== null) {
    const hrvTerm = 0.65 * (1 - telemetry.hrv / Math.max(1, baseline.hrvBaseline)) * 100
    const hrTerm = 0.35 * ((telemetry.heartRate - baselineHR) / Math.max(1, 180 - baselineHR)) * 100
    stressScore = clamp(Math.round(hrvTerm + hrTerm), 0, 100)
  } else {
    stressScore = clamp(Math.round(hrDev * 1.5 + (telemetry.activityLevel < 30 ? 15 : 0)), 0, 100)
  }

  // -------------------------------------------------------------
  // 5. Environmental Risk Score (AQI, PM2.5, Pressure)
  // -------------------------------------------------------------
  const aqiImpact = Math.max(0, telemetry.externalAqi - 50) * 0.35
  const pm25Impact = telemetry.pm25 !== null ? Math.max(0, telemetry.pm25 - 15) * 0.5 : 0
  const pressureDrop = Math.max(0, 1013 - telemetry.pressure) * 1.5
  const envRaw = aqiImpact + pm25Impact + pressureDrop + (telemetry.rain ? 20 : 0)
  const environmentalScore = clamp(Math.round(envRaw), 0, 100)

  // -------------------------------------------------------------
  // 6. Mobility Risk Score
  // -------------------------------------------------------------
  const symmetryDrop = Math.max(0, baseline.gaitSymmetryBaseline - telemetry.gaitSymmetry)
  const variabilityIncrease = Math.max(0, telemetry.gaitVariability - baseline.gaitVariabilityBaseline)
  const mobilityScore = clamp(Math.round(symmetryDrop * 2.5 + variabilityIncrease * 1.2), 0, 100)

  // -------------------------------------------------------------
  // 7. Late Fusion & Weighted Composite Risk Index (CRI)
  // Weights: Physio 30%, Temp 20%, Heat 20%, Env 15%, Mobility 15%
  // -------------------------------------------------------------
  const weights = {
    physiological: 0.3,
    temperature: 0.2,
    heat: 0.2,
    environmental: 0.15,
    mobility: 0.15,
  }

  const rawCri =
    physiologicalScore * weights.physiological +
    tempScore * weights.temperature +
    heatScore * weights.heat +
    environmentalScore * weights.environmental +
    mobilityScore * weights.mobility

  const cri = clamp(Math.round(rawCri), 0, 100)

  // Exact contribution breakdown
  const contributions = {
    physiological: Math.round(physiologicalScore * weights.physiological),
    temperature: Math.round(tempScore * weights.temperature),
    heat: Math.round(heatScore * weights.heat),
    environmental: Math.round(environmentalScore * weights.environmental),
    mobility: Math.round(mobilityScore * weights.mobility),
  }

  // -------------------------------------------------------------
  // 8. Single-Domain Critical Override Rule
  // If PSI >= 8.0 or Temp/Physio >= 85, trigger critical tier override
  // -------------------------------------------------------------
  let criticalOverride = false
  let overrideReason: string | undefined

  if (psi >= 8.0) {
    criticalOverride = true
    overrideReason = `Critical Heat Strain Detected (PSI ${psi}/9 >= 8.0)`
  } else if (tempScore >= 85) {
    criticalOverride = true
    overrideReason = `Severe Body Temperature Elevation (${telemetry.bodyTemp}°C)`
  } else if (physiologicalScore >= 85) {
    criticalOverride = true
    overrideReason = `Severe Physiological Deviation (HR ${telemetry.heartRate} BPM, SpO₂ ${telemetry.spo2}%)`
  }

  // -------------------------------------------------------------
  // 9. Risk Tiers & Visual Status Mapping
  // -------------------------------------------------------------
  let statusLevel: RiskScores['statusLevel'] = 'Normal'
  let statusLabel = 'Low Risk (Safe)'
  let color: RiskScores['color'] = 'green'

  const effectiveCri = criticalOverride ? Math.max(cri, 78) : cri

  if (effectiveCri <= 25) {
    statusLevel = 'Normal'
    statusLabel = 'Safe / Normal Personal Baseline'
    color = 'green'
  } else if (effectiveCri <= 50) {
    statusLevel = 'Monitor'
    statusLabel = 'Moderate Strain / Monitor'
    color = 'yellow'
  } else if (effectiveCri <= 75) {
    statusLevel = 'Warning'
    statusLabel = 'Elevated Risk / Warning'
    color = 'orange'
  } else {
    statusLevel = 'High Risk'
    statusLabel = criticalOverride ? `Critical Alert: ${overrideReason}` : 'High Risk Strain'
    color = 'red'
  }

  // -------------------------------------------------------------
  // 10. Climate ↔ Body Analysis & Explainability Generation
  // -------------------------------------------------------------
  const explanations: string[] = []
  const climateBodyAnalysis: string[] = []

  if (telemetry.ambientTemp >= 32 && telemetry.heartRate > baselineHR + 5) {
    climateBodyAnalysis.push(
      `Elevated environmental heat (${telemetry.ambientTemp}°C, ${telemetry.humidity}%) coincides with increased heart rate (+${hrDev} BPM above your personal baseline of ${baselineHR} BPM).`
    )
  }

  if (telemetry.externalAqi > 80 && telemetry.spo2 < 97) {
    climateBodyAnalysis.push(
      'Current air-quality conditions coincide with a downward deviation in your recent SpO₂ trend.'
    )
  }

  if (isTempAnomaly) {
    explanations.push(`Subclinical temperature deviation detected (${telemetry.bodyTemp}°C vs your personal baseline of ${baselineTemp.toFixed(1)}°C).`)
  }

  if (psi >= 4.0) {
    explanations.push(`Thermal Strain Index (PSI) is ${psi}/9 (${psi >= 7 ? 'High Heat Risk' : 'Moderate Strain'}).`)
  }

  if (telemetry.heartRate > baselineHR + 5) {
    explanations.push(
      `Heart rate is ${telemetry.heartRate} BPM (+${hrDev} BPM / +${hrDevPct}%) above your personal baseline of ${baselineHR} BPM.`
    )
  }

  if (telemetry.externalAqi > 100) {
    explanations.push(`External Air Quality Index is ${telemetry.externalAqi} (Unhealthy for sensitive groups).`)
  }

  if (explanations.length === 0) {
    explanations.push(`All physiological and climate telemetry metrics are aligned within your personal baseline (${baselineHR} BPM, ${baselineTemp.toFixed(1)}°C).`)
  }

  return {
    physiological: physiologicalScore,
    stress: stressScore,
    temperature: tempScore,
    heat: heatScore,
    psi,
    wbgt,
    mobility: mobilityScore,
    environmental: environmentalScore,
    overall: effectiveCri,
    statusLevel,
    statusLabel,
    color,
    criticalOverride,
    overrideReason,
    contributions,
    explanations,
    climateBodyAnalysis,
    tempAnomaly: {
      detected: isTempAnomaly,
      label: isTempAnomaly ? 'SUBCLINICAL TEMPERATURE ANOMALY DETECTED' : 'Normal Temperature',
    },
  }
}
