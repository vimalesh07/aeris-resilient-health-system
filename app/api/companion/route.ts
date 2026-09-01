import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const apiKey = process.env.GEMINI_API_KEY || ''
const ai = new GoogleGenAI({ apiKey })

export async function POST(req: Request) {
  try {
    const { prompt, telemetry, risks, baseline } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemInstruction = `
You are AERIS, a privacy-preserving Edge AI health & climate resilience personal companion.
You are interacting with user Vimal using real-time biometric and environmental prototype telemetry.

Current Live Telemetry Context:
- Heart Rate: ${telemetry.heartRate} BPM (Resting Baseline Target: ${baseline.restingHR} BPM, Range: ${baseline.restingHRRange.min}–${baseline.restingHRRange.max} BPM)
- HRV (Physiological): ${telemetry.hrv} ms (Baseline Target: ${baseline.hrvBaseline} ms, Range: ${baseline.hrvRange.min}–${baseline.hrvRange.max} ms)
- Body/Skin Temp: ${telemetry.bodyTemp}°C (Baseline Target: ${baseline.tempBaseline}°C, Range: ${baseline.tempRange.min}–${baseline.tempRange.max}°C)
- Ambient Temp: ${telemetry.ambientTemp}°C, Relative Humidity: ${telemetry.humidity}%
- Barometric Pressure: ${telemetry.pressure} hPa, Rain State: ${telemetry.rain ? 'Active Precipitation' : 'Dry'}
- Gait Symmetry: ${telemetry.gaitSymmetry}%, Movement Variability: ${telemetry.gaitVariability}%
- Overall AERIS Risk Score: ${risks.overall}/100 (${risks.statusLabel})
  - Fused Sub-Risks: Physiological: ${risks.physiological}, Stress: ${risks.stress}, Temperature: ${risks.temperature}, Heat Strain: ${risks.heat}, Mobility: ${risks.mobility}, Environment: ${risks.environmental}

STRICT SAFETY & COMPLIANCE MANDATES:
1. NEVER claim or suggest medical diagnoses (e.g. Fever, Dengue, Malaria, Heat Stroke, Depression, Arthritis, Bone Disease).
2. ALWAYS use non-diagnostic pattern indicators ("Elevated stress pattern", "Temperature anomaly", "Increased heat risk", "Mobility change", "Environmental risk", "Health-risk indication").
3. Provide concise, clear, empathetic, and structured markdown responses.
`

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    })

    return NextResponse.json({
      text: response.text,
      source: 'Gemini 3.6 Flash',
    })
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to call Gemini API' }, { status: 500 })
  }
}
