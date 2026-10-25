import 'server-only'

import saved from '@/lib/data/safe-places-saved.json'
import type { SafePlace, SafePlaceType } from '@/types/aeris'

export type PlacesSource = 'overpass' | 'nominatim' | 'saved' | 'none'

export interface PlacesResult {
  places: SafePlace[]
  source: PlacesSource
  note?: string
}

const UA = 'AERIS-Resilient-Health/1.0 (emergency facility finder)'
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
// Netlify functions stop at 10s; keep every live lookup comfortably inside that.
const OVERPASS_TIMEOUT_MS = 6000
const NOMINATIM_TIMEOUT_MS = 4000
const CACHE_TTL_MS = 15 * 60_000

const cache = new Map<string, { at: number; result: PlacesResult }>()

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

function typeFromTags(tags: Record<string, string>): SafePlaceType | null {
  if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') return 'Hospital'
  if (tags.amenity === 'pharmacy' || tags.healthcare === 'pharmacy') return 'Pharmacy'
  if (tags.emergency === 'shelter' || tags.social_facility === 'shelter' || tags.emergency === 'assembly_point') return 'Shelter'
  if (['clinic', 'doctors'].includes(tags.amenity) || ['clinic', 'centre', 'doctor'].includes(tags.healthcare)) return 'PHC'
  return null
}

function capabilitiesFromTags(tags: Record<string, string>): string[] {
  const caps: string[] = []
  if (tags.emergency === 'yes') caps.push('Emergency department')
  if (tags.opening_hours === '24/7') caps.push('Open 24/7')
  if (tags['healthcare:speciality']) caps.push(...tags['healthcare:speciality'].split(';').slice(0, 2).map((s) => s.trim().replace(/_/g, ' ')))
  if (tags.operator_type === 'government' || tags['operator:type'] === 'government') caps.push('Government')
  if (tags.beds) caps.push(`${tags.beds} beds`)
  return caps
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  try {
    return await run(controller.signal)
  } finally {
    clearTimeout(t)
  }
}

/** All Overpass mirrors are asked at once; the first good answer wins. */
async function fromOverpass(lat: number, lon: number, radius: number): Promise<SafePlace[]> {
  const around = `(around:${radius},${lat},${lon})`
  const query = `[out:json][timeout:8];
(
  nwr["amenity"~"^(hospital|clinic|doctors|pharmacy)$"]${around};
  nwr["healthcare"~"^(hospital|clinic|centre)$"]${around};
  nwr["emergency"~"^(shelter|assembly_point)$"]${around};
  nwr["social_facility"="shelter"]${around};
);
out center 120;`

  return withTimeout(OVERPASS_TIMEOUT_MS, async (signal) => {
    const data = await Promise.any(
      OVERPASS_ENDPOINTS.map(async (endpoint) => {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': UA },
          signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!Array.isArray(json?.elements)) throw new Error('bad payload')
        return json
      }),
    )
    const places: SafePlace[] = []
    for (const el of data.elements) {
      const tags = el.tags || {}
      const type = typeFromTags(tags)
      const name = tags['name:en'] || tags.name
      if (!type || !name) continue
      const pLat = typeof el.lat === 'number' ? el.lat : el.center?.lat
      const pLon = typeof el.lon === 'number' ? el.lon : el.center?.lon
      if (typeof pLat !== 'number' || typeof pLon !== 'number') continue
      places.push({
        id: `osm-${el.type}-${el.id}`,
        name,
        type,
        lat: pLat,
        lon: pLon,
        distanceKm: distanceKm(lat, lon, pLat, pLon),
        address: [tags['addr:street'], tags['addr:suburb'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ') || 'OpenStreetMap location',
        phone: tags.phone || tags['contact:phone'] || undefined,
        openNow: tags.opening_hours === '24/7' ? true : undefined,
        isDemo: false,
        capabilities: capabilitiesFromTags(tags),
      })
    }
    return places
  })
}

/** Nominatim amenity search inside a ~radius box. Sequential to respect its 1 request/second policy. */
async function fromNominatim(lat: number, lon: number, radius: number): Promise<SafePlace[]> {
  const d = radius / 111_000
  const viewbox = `${lon - d},${lat + d},${lon + d},${lat - d}`
  const places = new Map<string, SafePlace>()
  for (const [i, q] of ['hospital', 'clinic', 'pharmacy'].entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1050))
    try {
      const rows = await withTimeout(NOMINATIM_TIMEOUT_MS, async (signal) => {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&viewbox=${viewbox}&bounded=1&limit=40&extratags=1&addressdetails=1&accept-language=en`,
          { headers: { 'User-Agent': UA }, signal },
        )
        return res.ok ? res.json() : []
      })
      for (const r of rows as any[]) {
        const tags = { amenity: r.type, ...(r.extratags || {}) }
        const type = typeFromTags(tags)
        if (!type || !r.name) continue
        const pLat = Number(r.lat)
        const pLon = Number(r.lon)
        const a = r.address || {}
        places.set(`osm-${r.osm_type}-${r.osm_id}`, {
          id: `osm-${r.osm_type}-${r.osm_id}`,
          name: r.name,
          type,
          lat: pLat,
          lon: pLon,
          distanceKm: distanceKm(lat, lon, pLat, pLon),
          address: [a.road, a.suburb || a.neighbourhood, a.city || a.town || a.village, a.postcode].filter(Boolean).join(', ') || 'OpenStreetMap location',
          phone: tags.phone || tags['contact:phone'] || undefined,
          openNow: tags.opening_hours === '24/7' ? true : undefined,
          isDemo: false,
          capabilities: capabilitiesFromTags(tags),
        })
      }
    } catch {
      // One failed category shouldn't drop the others.
    }
  }
  return [...places.values()]
}

/** Snapshot bundled with the app for the main Tamil Nadu cities (used when live sources are down). */
function fromSaved(lat: number, lon: number, radiusKm: number): SafePlace[] {
  return (saved.places as Array<Record<string, any>>)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type as SafePlaceType,
      lat: p.lat,
      lon: p.lon,
      distanceKm: distanceKm(lat, lon, p.lat, p.lon),
      address: p.address,
      phone: p.phone,
      openNow: p.open24h ? true : undefined,
      isDemo: false,
      capabilities: [p.emergency ? 'Emergency department' : null, p.open24h ? 'Open 24/7' : null].filter(Boolean) as string[],
    }))
    .filter((p) => p.distanceKm <= radiusKm)
}

export async function findSafePlaces(lat: number, lon: number, radius = 6000): Promise<PlacesResult> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)},${radius}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result

  // Overpass first; Nominatim joins only if Overpass hasn't answered within 1.5s,
  // so a healthy Overpass never adds load to Nominatim. Worst case stays under ~7s.
  let overpassAnswered = false
  const overpass = fromOverpass(lat, lon, radius)
    .then((p) => {
      overpassAnswered = p.length > 0
      return p
    })
    .catch(() => [] as SafePlace[])
  const nominatim = new Promise<void>((r) => setTimeout(r, 1500))
    .then(() => (overpassAnswered ? [] : fromNominatim(lat, lon, radius)))
    .catch(() => [] as SafePlace[])

  let result: PlacesResult
  const first = await overpass
  if (first.length > 0) {
    result = { places: first, source: 'overpass' }
  } else {
    const second = await nominatim
    if (second.length > 0) {
      result = { places: second, source: 'nominatim', note: 'Shelters may be missing — OpenStreetMap search only covers health facilities right now.' }
    } else {
      const snapshot = fromSaved(lat, lon, Math.max(12, radius / 1000))
      result =
        snapshot.length > 0
          ? { places: snapshot, source: 'saved', note: `Live map data is unavailable, so AERIS is showing places saved on ${saved.savedAt}. Call ahead to confirm they are open.` }
          : { places: [], source: 'none', note: 'Live map data is unavailable and there is no saved data for this area.' }
    }
  }

  result.places.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
  result.places = result.places.slice(0, 80)
  if (result.source !== 'none') cache.set(key, { at: Date.now(), result })
  return result
}
