import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import type { TelemetryData } from '@/types/aeris'

const activityStates: TelemetryData['activity'][] = [
  'Sedentary',
  'Light Activity',
  'Moderate Walking',
  'Active Motion',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value)
}

function isTelemetryPayload(value: unknown): value is TelemetryData {
  if (!isRecord(value)) return false

  const requiredNumbers = [
    'heartRate',
    'bodyTemp',
    'spo2',
    'ambientTemp',
    'humidity',
    'pressure',
    'externalAqi',
    'gaitVariability',
    'gaitSymmetry',
    'steps',
    'cadence',
    'walkingSpeed',
    'activityLevel',
    'precipitation',
  ]

  if (requiredNumbers.some((field) => !isFiniteNumber(value[field]))) return false
  if (!isNullableFiniteNumber(value.hrv)) return false
  if (!isNullableFiniteNumber(value.pm25)) return false
  if (!isNullableFiniteNumber(value.pm10)) return false
  if (!isNullableFiniteNumber(value.o3)) return false
  if (!isNullableFiniteNumber(value.no2)) return false
  if (typeof value.weatherCondition !== 'string') return false
  if (typeof value.rain !== 'boolean') return false
  if (value.aqiStale !== undefined && typeof value.aqiStale !== 'boolean') return false
  if (!activityStates.includes(value.activity as TelemetryData['activity'])) return false

  return true
}

export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext()
    if (!authContext) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
    }

    if (!isTelemetryPayload(body)) {
      return NextResponse.json({ error: 'Invalid telemetry data' }, { status: 400 })
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ success: true, mode: 'local' })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('telemetry_readings')
      .insert({
        user_id: authContext.user.id,
        source: 'dashboard',
        heart_rate: body.heartRate,
        hrv: body.hrv,
        body_temp: body.bodyTemp,
        spo2: body.spo2,
        ambient_temp: body.ambientTemp,
        humidity: body.humidity,
        pressure: body.pressure,
        external_aqi: body.externalAqi,
        gait_variability: body.gaitVariability,
        gait_symmetry: body.gaitSymmetry,
        steps: body.steps,
        cadence: body.cadence,
        walking_speed: body.walkingSpeed,
        payload: {
          activityLevel: body.activityLevel,
          precipitation: body.precipitation,
          weatherCondition: body.weatherCondition,
          rain: body.rain,
          pm25: body.pm25,
          pm10: body.pm10,
          o3: body.o3,
          no2: body.no2,
          ...(body.aqiStale !== undefined ? { aqiStale: body.aqiStale } : {}),
          activity: body.activity,
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Telemetry persistence error:', error)
      return NextResponse.json({ error: 'Failed to persist telemetry' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Telemetry persistence request error:', error)
    return NextResponse.json({ error: 'Failed to persist telemetry' }, { status: 500 })
  }
}
