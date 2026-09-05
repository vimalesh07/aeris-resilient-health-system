import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { text: null, fallback: true, error: 'GEMINI_API_KEY is not configured' },
        { status: 200 }
      )
    }

    const { prompt, telemetry, risks, baseline } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemInstruction = `
You are AERIS, a privacy-preserving Edge AI health & climate resilience personal companion.
You are interacting with user Vimal using real-time biometric and environmental prototype telemetry.

Current Live Telemetry Context:
- Heart Rate: ${telemetry?.heartRate ?? 70} BPM (Resting Baseline Target: ${baseline?.restingHR ?? 68} BPM, Range: ${baseline?.restingHRRange?.min ?? 60}–${baseline?.restingHRRange?.max ?? 76} BPM)
- HRV (Physiological): ${telemetry?.hrv ?? 65} ms (Baseline Target: ${baseline?.hrvBaseline ?? 65} ms, Range: ${baseline?.hrvRange?.min ?? 50}–${baseline?.hrvRange?.max ?? 85} ms)
- Body/Skin Temp: ${telemetry?.bodyTemp ?? 36.6}°C (Baseline Target: ${baseline?.tempBaseline ?? 36.6}°C, Range: ${baseline?.tempRange?.min ?? 36.2}–${baseline?.tempRange?.max ?? 37.1}°C)
- Ambient Temp: ${telemetry?.ambientTemp ?? 28}°C, Relative Humidity: ${telemetry?.humidity ?? 50}%
- Barometric Pressure: ${telemetry?.pressure ?? 1013} hPa, Rain State: ${telemetry?.rain ? 'Active Precipitation' : 'Dry'}
- Gait Symmetry: ${telemetry?.gaitSymmetry ?? 95}%, Movement Variability: ${telemetry?.gaitVariability ?? 12}%
- Overall AERIS Risk Score: ${risks?.overall ?? 15}/100 (${risks?.statusLabel ?? 'Low Risk'})
  - Fused Sub-Risks: Physiological: ${risks?.physiological ?? 10}, Stress: ${risks?.stress ?? 15}, Temperature: ${risks?.temperature ?? 10}, Heat Strain: ${risks?.heat ?? 12}, Mobility: ${risks?.mobility ?? 10}, Environment: ${risks?.environmental ?? 10}

STRICT SAFETY & COMPLIANCE MANDATES:
1. NEVER claim or suggest medical diagnoses (e.g. Fever, Dengue, Malaria, Heat Stroke, Depression, Arthritis, Bone Disease).
2. ALWAYS use non-diagnostic pattern indicators ("Elevated stress pattern", "Temperature anomaly", "Increased heat risk", "Mobility change", "Environmental risk", "Health-risk indication").
3. Provide concise, clear, empathetic, and structured markdown responses.
`

    const ai = new GoogleGenAI({ apiKey })
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

    const response = await ai.models.generateContent({
      model,
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
