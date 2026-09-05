import { NextRequest, NextResponse } from 'next/server'
import { fetchRealWeather } from '@/lib/external-weather'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const latParam = searchParams.get('lat')
    const lonParam = searchParams.get('lon')

    const lat = latParam ? parseFloat(latParam) : undefined
    const lon = lonParam ? parseFloat(lonParam) : undefined

    const data = await fetchRealWeather(lat, lon, true)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Weather API route error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
