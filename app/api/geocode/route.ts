import { NextRequest, NextResponse } from 'next/server'

export interface GeocodeResult {
  displayName: string
  shortName: string
  lat: number
  lon: number
}

/**
 * Server-side Nominatim Geocoding Proxy.
 * Converts location names (e.g. "Valliyur, Tirunelveli") to coordinates without browser CORS issues.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query parameter "q" is required', results: [] },
        { status: 400 }
      )
    }

    const trimmedQuery = query.trim()
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmedQuery
    )}&format=json&limit=5&addressdetails=1&countrycodes=in&accept-language=en`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8500)

    const response = await fetch(nominatimUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'AERIS-Resilient-Health-System/1.0 (Location Geocoding Module)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Nominatim geocoding returned status ${response.status}`, results: [] },
        { status: 200 }
      )
    }

    const rawData = await response.json()

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return NextResponse.json({
        results: [],
        message: 'No coordinates found for the specified location',
      })
    }

    const results: GeocodeResult[] = rawData.map((item: any) => {
      const parts = (item.display_name || '').split(', ')
      const shortName =
        parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : parts[0] || trimmedQuery

      return {
        displayName: item.display_name || trimmedQuery,
        shortName,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }
    })

    return NextResponse.json({
      results,
      count: results.length,
    })
  } catch (error: any) {
    console.error('Server geocode error:', error)
    return NextResponse.json(
      {
        results: [],
        error: error.name === 'AbortError' ? 'Geocoding request timed out' : error?.message,
      },
      { status: 200 }
    )
  }
}
