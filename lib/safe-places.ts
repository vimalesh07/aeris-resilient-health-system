import { RiskScores, SafePlace, SafePlaceFilter, SafePlaceType, Scenario, TelemetryData } from '@/types/aeris'

/**
 * Calculates distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

/**
 * Generates realistic demo safe facilities centered around user coordinates.
 * Explicitly marked with isDemo: true to uphold safety transparency.
 */
export function getDemoSafePlaces(centerLat: number, centerLon: number): SafePlace[] {
  const rawTemplates: Array<{
    name: string
    type: SafePlaceType
    dLat: number
    dLon: number
    address: string
    phone: string
    capabilities: string[]
  }> = [
    {
      name: 'Apex Trauma & Multi-Specialty Hospital',
      type: 'Hospital',
      dLat: 0.0068,
      dLon: 0.0074,
      address: 'Plot 14, Health Boulevard, Medical Enclave',
      phone: '+91 1800-419-0099',
      capabilities: ['24/7 Trauma ICU', 'Oxygen Plant', 'Cardiac Resuscitation', 'Burn Unit'],
    },
    {
      name: 'District Civil Government Hospital',
      type: 'Hospital',
      dLat: -0.0112,
      dLon: 0.0089,
      address: 'Main Collectorate Road, Near Red Cross Station',
      phone: '+91 102',
      capabilities: ['Emergency Ward', 'Heatstroke Hydration Ward', 'Ambulance Station'],
    },
    {
      name: 'Urban Primary Health Centre (PHC Zone-3)',
      type: 'PHC',
      dLat: 0.0042,
      dLon: -0.0051,
      address: 'Community Center Complex, Sector 4',
      phone: '+91 044-2490-1122',
      capabilities: ['General Triage', 'ORS & IV Fluids', 'Basic Diagnostics', 'Maternal First Aid'],
    },
    {
      name: 'Sector 9 Model Primary Health Centre',
      type: 'PHC',
      dLat: -0.0075,
      dLon: -0.0083,
      address: 'Opposite Public Library, Cross Road 6',
      phone: '+91 044-2561-8844',
      capabilities: ['Outpatient Care', 'Rapid Glucose/ECG', 'Essential Medications'],
    },
    {
      name: 'City Disaster Relief & Climate Shelter',
      type: 'Shelter',
      dLat: 0.0125,
      dLon: -0.0032,
      address: 'Indoor Sports Stadium, High Ground Elevation',
      phone: '+91 1077 (Disaster Helpline)',
      capabilities: ['High-Ground Elevated', 'Active HVAC Cooling', 'Clean Drinking Water', 'Auxiliary Generator'],
    },
    {
      name: 'Community Cyclone & Monsoon Refuge Center',
      type: 'Shelter',
      dLat: -0.0142,
      dLon: -0.0067,
      address: 'Civic Auditorium, Hilltop Ridge Road',
      phone: '+91 1070',
      capabilities: ['Flood Resilient', 'Emergency Bedding', 'First Responder Station', 'Satellite Comms'],
    },
    {
      name: '24/7 MedCare Emergency Pharmacy',
      type: 'Pharmacy',
      dLat: 0.0031,
      dLon: 0.0028,
      address: 'Shop 4, Ground Floor, Central Market Square',
      phone: '+91 98400-12345',
      capabilities: ['Emergency Inhalers', 'Cold-chain Insulin', 'ORS Hydration Kits', 'Nebulizers'],
    },
    {
      name: 'Apollo 24x7 Express Medical Store',
      type: 'Pharmacy',
      dLat: -0.0049,
      dLon: 0.0037,
      address: '32 Radial Highway, Opp. Metro Pillar 114',
      phone: '+91 1860-500-0101',
      capabilities: ['24/7 Dispensing', 'Oxygen Canisters', 'Pulse Oximeters', 'Emergency First-Aid'],
    },
  ]

  return rawTemplates.map((t, index) => {
    const lat = centerLat + t.dLat
    const lon = centerLon + t.dLon
    const distanceKm = calculateDistanceKm(centerLat, centerLon, lat, lon)

    return {
      id: `demo-${index + 1}`,
      name: t.name,
      type: t.type,
      lat,
      lon,
      distanceKm,
      address: t.address,
      phone: t.phone,
      openNow: true,
      isDemo: true,
      capabilities: t.capabilities,
    }
  })
}

/**
 * Converts a text location query into geographic coordinates using the server-side Nominatim proxy.
 */
export async function geocodeLocation(query: string): Promise<{
  displayName: string
  shortName: string
  lat: number
  lon: number
}[]> {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json()
    return data?.results || []
  } catch (err) {
    console.error('Client geocoding error:', err)
    return []
  }
}

export type PlacesSource = 'overpass' | 'nominatim' | 'saved' | 'none' | 'sample'

/**
 * Nearby safe places via the server (/api/overpass), which tries live
 * OpenStreetMap sources and then a saved snapshot. Sample places are used only
 * when the server can't be reached at all, and are always marked as samples.
 */
export async function fetchNearbySafePlaces(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<{ places: SafePlace[]; isDemoFallback: boolean; source: PlacesSource; fallbackReason?: string }> {
  try {
    const response = await fetch('/api/overpass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, radius: 6000 }),
      signal,
    })
    if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`)
    const data = (await response.json()) as { places?: SafePlace[]; source?: PlacesSource; note?: string }
    return {
      places: data.places ?? [],
      isDemoFallback: false,
      source: data.source ?? 'none',
      fallbackReason: data.note,
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err
    console.warn('Safe places lookup failed:', err?.message)
    return {
      places: getDemoSafePlaces(lat, lon),
      isDemoFallback: true,
      source: 'sample',
      fallbackReason: 'AERIS could not reach the server, so these are sample places for illustration only. Call 112 or 108 in an emergency.',
    }
  }
}

/**
 * Prioritizes and decorates safe places based on active AERIS health & climate risks.
 */
export function prioritizeSafePlaces(
  places: SafePlace[],
  risks: RiskScores,
  scenario: Scenario,
  telemetry: TelemetryData
): SafePlace[] {
  const isHighHealthRisk = risks.overall >= 50 || risks.physiological >= 50 || scenario === 'Temperature Anomaly'
  const isHeatwaveRisk = scenario === 'Heat' || risks.heat >= 50 || telemetry.ambientTemp >= 38
  const isFloodMonsoonRisk = scenario === 'Monsoon' || telemetry.rain
  const isPollutionRisk = telemetry.externalAqi >= 100 || risks.environmental >= 50

  const decorated = places.map((place) => {
    let priorityWeight = 0
    let reason: string | undefined

    if (isHighHealthRisk) {
      if (place.type === 'Hospital') {
        priorityWeight += 100
        reason = 'Your risk is high — nearest emergency care first'
      } else if (place.type === 'PHC') {
        priorityWeight += 60
        reason = 'Can check vitals and stabilise you'
      }
    }

    if (isHeatwaveRisk) {
      if (place.type === 'Shelter') {
        priorityWeight += 95
        reason = 'Heatwave — a cool place to rest and rehydrate'
      } else if (place.type === 'Hospital') {
        priorityWeight += 80
        reason = 'Treats heat exhaustion and heatstroke'
      } else if (place.type === 'Pharmacy') {
        priorityWeight += 40
        reason = 'ORS and electrolytes for rehydration'
      }
    }

    if (isFloodMonsoonRisk) {
      if (place.type === 'Shelter') {
        priorityWeight += 110
        reason = 'Flooding risk — shelter on higher ground'
      } else if (place.type === 'Hospital') {
        priorityWeight += 70
        reason = 'Emergency care during floods'
      }
    }

    if (isPollutionRisk) {
      if (place.type === 'Hospital') {
        priorityWeight += 85
        reason = 'Poor air — breathing and oxygen support'
      } else if (place.type === 'Pharmacy') {
        priorityWeight += 65
        reason = 'Inhalers and N95 masks'
      }
    }

    // Default distance scoring (closer gets slightly higher priority within same tier)
    const distancePenalty = (place.distanceKm || 0) * 2

    return {
      ...place,
      recommendationReason: reason || place.recommendationReason,
      _sortScore: priorityWeight - distancePenalty,
    }
  })

  // Sort descending by calculated priority score
  return decorated.sort((a, b) => b._sortScore - a._sortScore)
}

/**
 * Filter safe places by category
 */
export function filterSafePlaces(places: SafePlace[], filter: SafePlaceFilter): SafePlace[] {
  if (filter === 'All') return places
  return places.filter((p) => p.type === filter)
}

/**
 * Builds standard Google Maps Directions URL
 */
export function getDirectionsUrl(lat: number, lon: number, destinationName?: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
}
