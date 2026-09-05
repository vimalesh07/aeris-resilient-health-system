import { NextRequest, NextResponse } from 'next/server'

interface OverpassRequestBody {
  lat: number
  lon: number
  radius?: number
  query?: string
}

/**
 * Server-side Overpass API Proxy.
 * Prevents browser CORS errors when requesting OpenStreetMap data from client browsers or devtunnels.
 */
export async function POST(req: NextRequest) {
  try {
    const body: OverpassRequestBody = await req.json()
    const { lat, lon, radius = 6000 } = body

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json(
        { error: 'Valid latitude and longitude numbers are required', elements: [] },
        { status: 400 }
      )
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of range', elements: [] },
        { status: 400 }
      )
    }

    const radiusMeters = Math.min(Math.max(radius, 1000), 15000)

    // Overpass QL querying hospitals, clinics, pharmacies, and emergency/disaster shelters (both nodes and ways)
    const overpassQuery = `[out:json][timeout:10];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  node["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
  node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});
  node["amenity"="social_facility"](around:${radiusMeters},${lat},${lon});
  node["emergency"="shelter"](around:${radiusMeters},${lat},${lon});
  node["social_facility"="shelter"](around:${radiusMeters},${lat},${lon});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  way["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
  way["emergency"="shelter"](around:${radiusMeters},${lat},${lon});
);
out center 25;`

    // Public Overpass endpoints with fallback mirror support
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ]

    let responseData: any = null
    let lastError: string = ''

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 9500)

        const res = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'User-Agent': 'AERIS-Resilient-Health-System/1.0 (Emergency Response Prototype)',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (res.ok) {
          responseData = await res.json()
          break
        } else {
          lastError = `Overpass endpoint ${endpoint} returned status ${res.status}`
        }
      } catch (err: any) {
        lastError = err.name === 'AbortError' ? 'Overpass request timed out' : err.message
      }
    }

    if (responseData && Array.isArray(responseData.elements)) {
      return NextResponse.json({
        elements: responseData.elements,
        source: 'osm-overpass-live',
        count: responseData.elements.length,
      })
    }

    // Graceful fallback response so client can activate realistic demo data with a clear reason
    return NextResponse.json({
      elements: [],
      error: lastError || 'Overpass service unavailable',
      isFallback: true,
    })
  } catch (error: any) {
    console.error('Server Overpass proxy error:', error)
    return NextResponse.json(
      {
        elements: [],
        error: error?.message || 'Internal proxy error',
        isFallback: true,
      },
      { status: 200 } // Return 200 so client handles fallback smoothly without console uncaught errors
    )
  }
}
