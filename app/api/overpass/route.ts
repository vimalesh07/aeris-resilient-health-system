import { NextRequest, NextResponse } from 'next/server'
import { findSafePlaces } from '@/lib/places-server'

/**
 * Nearby safe places: hospitals, health centres, pharmacies and shelters.
 * Tries Overpass (all mirrors in parallel) and Nominatim, then a bundled
 * OpenStreetMap snapshot, so the finder still works when Overpass is overloaded.
 */
export async function POST(req: NextRequest) {
  try {
    const { lat, lon, radius = 6000 } = (await req.json()) as { lat?: unknown; lon?: unknown; radius?: unknown }
    if (typeof lat !== 'number' || typeof lon !== 'number' || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: 'Valid latitude and longitude are required.', places: [], source: 'none' }, { status: 400 })
    }
    const r = typeof radius === 'number' ? Math.min(Math.max(radius, 1000), 15000) : 6000
    return NextResponse.json(await findSafePlaces(lat, lon, r))
  } catch (error) {
    console.error('Safe places lookup failed:', error)
    return NextResponse.json({ places: [], source: 'none', note: 'Could not look up places right now.' })
  }
}
