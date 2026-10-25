'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed } from 'lucide-react'
import { SafePlace, SafePlaceType, UserLocation } from '@/types/aeris'
import { getDirectionsUrl } from '@/lib/safe-places'

interface SafePlaceMapProps {
  userLocation: UserLocation | null
  places: SafePlace[]
  selectedPlace: SafePlace | null
  onSelectPlace?: (place: SafePlace) => void
}

function getMarkerColor(type: SafePlaceType): string {
  switch (type) {
    case 'Hospital':
      return '#C62828' // Main red
    case 'PHC':
      return '#2563EB' // Royal Blue
    case 'Shelter':
      return '#D97706' // Amber
    case 'Pharmacy':
      return '#059669' // Emerald Green
    default:
      return '#DC2626'
  }
}

// Inline SVG glyphs (lucide-style strokes) so pins need no image requests.
const TYPE_GLYPH: Record<SafePlaceType, string> = {
  Hospital: '<path d="M12 6v12M6 12h12"/>',
  PHC: '<path d="M4 12h4l2-4 4 8 2-4h4"/>',
  Shelter: '<path d="M4 11l8-6 8 6v8H4z"/><path d="M10 19v-5h4v5"/>',
  Pharmacy: '<rect x="4" y="9" width="16" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>',
}

function getMarkerIconSvg(type: SafePlaceType, selected = false): string {
  const size = selected ? 37 : 32
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${getMarkerColor(type)};display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35)${selected ? ',0 0 0 4px rgba(255,255,255,.6)' : ''};cursor:pointer;transition:transform .2s">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${TYPE_GLYPH[type]}</svg>
  </div>`
}

function getClusterIconSvg(count: number): string {
  const size = count >= 100 ? 48 : count >= 20 ? 42 : 36
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#0F1419;color:#fff;display:grid;place-items:center;font:600 13px ui-monospace,monospace;border:3px solid rgba(255,255,255,.9);box-shadow:0 4px 12px rgba(0,0,0,.35);cursor:pointer">${count}</div>`
}

// User location: 12px dot with a static 40% halo (no pulse).
function getUserLocationIconSvg(): string {
  return `<div style="position:relative;width:28px;height:28px;display:grid;place-items:center">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(29,78,216,.4)"></div>
    <div style="width:12px;height:12px;border-radius:50%;background:#1D4ED8;border:2px solid #fff"></div>
  </div>`
}

export default function SafePlaceMap({
  userLocation,
  places,
  selectedPlace,
  onSelectPlace,
}: SafePlaceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const lastFittedDatasetRef = useRef<string>('')
  const onSelectPlaceRef = useRef(onSelectPlace)
  const [zoom, setZoom] = useState(13)

  // Keep callback reference updated without triggering effects
  useEffect(() => {
    onSelectPlaceRef.current = onSelectPlace
  }, [onSelectPlace])

  // Initialize Map only ONCE
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    // Center on provided user location or fallback
    const initialLat = userLocation?.lat || 8.3768
    const initialLon = userLocation?.lon || 77.6143

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
    })

    // Custom positioned zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Free OpenStreetMap Tile Layer (no paid API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    map.on('zoomend', () => setZoom(map.getZoom()))
    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer
    mapInstanceRef.current = map

    // Immediate size invalidation after mount
    setTimeout(() => {
      map.invalidateSize()
    }, 150)

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markersLayerRef.current = null
      userMarkerRef.current = null
    }
  }, []) // Initialize only once

  // Dynamic ResizeObserver to handle container size changes cleanly
  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Update user location marker & fly map to selected location
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !userLocation) return

    // Smoothly fly to newly selected/searched coordinates
    map.flyTo([userLocation.lat, userLocation.lon], 14, { duration: 0.7 })

    const label =
      userLocation.source === 'gps'
        ? 'Your location'
        : userLocation.shortName || userLocation.displayName || 'Selected location'
    const sublabel =
      userLocation.source === 'gps'
        ? `Accurate to about ${Math.round(userLocation.accuracy ?? 0)} m`
        : userLocation.displayName || 'Searched Center'

    const popupHtml = `
      <div style="font-family: inherit; padding: 4px;">
        <strong style="color: #171717; font-size: 13px;">${label}</strong>
        <p style="margin: 3px 0 0; font-size: 11px; color: #4B5563;">${sublabel}</p>
        <small style="color: #6B7280; font-size: 10px;">Lat: ${userLocation.lat.toFixed(4)}, Lon: ${userLocation.lon.toFixed(4)}</small>
      </div>
    `

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon])
      userMarkerRef.current.bindPopup(popupHtml)
    } else {
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: getUserLocationIconSvg(),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup(popupHtml)
      userMarkerRef.current = marker
    }
  }, [userLocation])

  // Update facility markers & perform initial bounds fitting per search/filter change
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersLayer = markersLayerRef.current
    if (!map || !markersLayer) return

    markersLayer.clearLayers()

    const bounds: L.LatLngExpression[] = []

    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lon])
    }

    const clustered = new Set<string>()
    if (places.length > 50) {
      const cell = (60 * 360) / (256 * Math.pow(2, zoom))
      const groups = new Map<string, SafePlace[]>()
      places.forEach((pl) => {
        const key = `${Math.floor(pl.lat / cell)}:${Math.floor(pl.lon / cell)}`
        groups.set(key, [...(groups.get(key) ?? []), pl])
      })
      groups.forEach((group) => {
        if (group.length < 2) return
        group.forEach((pl) => clustered.add(pl.id))
        const lat = group.reduce((sum, pl) => sum + pl.lat, 0) / group.length
        const lon = group.reduce((sum, pl) => sum + pl.lon, 0) / group.length
        const size = group.length >= 100 ? 48 : group.length >= 20 ? 42 : 36
        L.marker([lat, lon], {
          icon: L.divIcon({ className: 'custom-facility-pin', html: getClusterIconSvg(group.length), iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
          title: `${group.length} places`,
        })
          .addTo(markersLayer)
          .on('click', () => map.flyTo([lat, lon], Math.min(18, zoom + 2), { duration: 0.7 }))
      })
    }

    places.forEach((place) => {
      if (clustered.has(place.id)) {
        bounds.push([place.lat, place.lon])
        return
      }
      const selected = selectedPlace?.id === place.id
      const markerIcon = L.divIcon({
        className: 'custom-facility-pin',
        html: getMarkerIconSvg(place.type, selected),
        iconSize: selected ? [37, 37] : [32, 32],
        iconAnchor: selected ? [18.5, 18.5] : [16, 16],
        popupAnchor: [0, -16],
      })

      const dirUrl = getDirectionsUrl(place.lat, place.lon, place.name)

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; color: #171717; min-width: 190px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <span style="
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 4px;
              background: ${getMarkerColor(place.type)};
              color: #FFFFFF;
            ">${place.type}</span>
            ${
              place.distanceKm !== undefined
                ? `<b style="color: #C62828; font-size: 11px;">${place.distanceKm} km away</b>`
                : ''
            }
          </div>
          <strong style="font-size: 13px; display: block; margin-bottom: 3px; line-height: 1.3;">${place.name}</strong>
          <p style="margin: 0 0 6px; font-size: 11px; color: #4B5563; line-height: 1.3;">${place.address}</p>
          ${
            place.isDemo
              ? `<div style="font-size: 9px; color: #B45309; background: #FEF3C7; padding: 1px 4px; border-radius: 3px; margin-bottom: 6px; display: inline-block;">Sample facility</div>`
              : ''
          }
          <div style="margin-top: 6px;">
            <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" style="
              display: block;
              text-align: center;
              padding: 6px 10px;
              border-radius: 6px;
              background: #C62828;
              color: #FFFFFF;
              font-weight: 700;
              font-size: 11px;
              text-decoration: none;
            ">Directions</a>
          </div>
        </div>
      `

      const marker = L.marker([place.lat, place.lon], { icon: markerIcon })
        .addTo(markersLayer)
        .bindPopup(popupContent)

      marker.on('click', () => {
        onSelectPlaceRef.current?.(place)
      })
      // Markers are rebuilt when the selection changes; keep the selected popup open.
      if (selected) marker.openPopup()

      bounds.push([place.lat, place.lon])
    })

    // Compute unique key identifying the current search/filter dataset
    const placesIdKey = places.map((p) => p.id).join(',')
    const userLocKey = userLocation ? `${userLocation.lat.toFixed(4)},${userLocation.lon.toFixed(4)}` : ''
    const currentDatasetKey = `${userLocKey}::${placesIdKey}`

    // ONLY fit bounds when the dataset has genuinely changed (new search, new filter)
    // NEVER re-fit bounds on background telemetry ticks, preserving manual pan & zoom!
    if (currentDatasetKey !== lastFittedDatasetRef.current) {
      if (places.length > 0 && bounds.length > 0) {
        try {
          map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 })
          lastFittedDatasetRef.current = currentDatasetKey
        } catch (e) {
          // ignore single point bounds
        }
      } else if (userLocation) {
        map.flyTo([userLocation.lat, userLocation.lon], 14, { duration: 0.8 })
        lastFittedDatasetRef.current = currentDatasetKey
      }
    }
  }, [places, userLocation, zoom, selectedPlace?.id])

  // Pan to selected place when explicitly clicked from the facility card list
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !selectedPlace) return

    map.flyTo([selectedPlace.lat, selectedPlace.lon], 15, { duration: 0.7 })
  }, [selectedPlace])

  // Re-center map directly on currently selected location
  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lon], 14, { duration: 0.8 })
    } else if (places.length > 0) {
      const bounds: L.LatLngExpression[] = places.map((p) => [p.lat, p.lon])
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 })
    }
  }, [userLocation, places])

  return (
    <div className="relative isolate h-full min-h-[340px] w-full overflow-hidden">
      <div ref={mapContainerRef} className="relative z-[1] h-full min-h-[340px] w-full" style={{ touchAction: 'pan-x pan-y' }} />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-[400] flex items-start justify-between gap-2">
        <ul className="pointer-events-auto flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-line bg-surface/95 px-3 py-1.5 text-[11px] text-fg-2 shadow-sm backdrop-blur">
          {[
            ['Hospital', '#C62828'],
            ['Health centre', '#2563EB'],
            ['Shelter', '#D97706'],
            ['Pharmacy', '#059669'],
          ].map(([label, color]) => (
            <li key={label} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
              {label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={handleRecenter}
          className="pointer-events-auto inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface/95 px-2.5 text-xs font-medium text-fg shadow-sm backdrop-blur hover:bg-surface"
        >
          <LocateFixed className="size-3.5" aria-hidden /> Re-center
        </button>
      </div>
    </div>
  )
}
