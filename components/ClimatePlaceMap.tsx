'use client'

import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed } from 'lucide-react'

interface ClimatePlaceMapProps {
  locationName: string
  lat?: number
  lon?: number
  weatherCondition?: string
  temp?: number
}

// Known geographic coordinate fallbacks for common locations
const KNOWN_COORDINATES: Record<string, [number, number]> = {
  madukkarai: [10.9038, 76.9602],
  coimbatore: [11.0168, 76.9558],
  valliyur: [8.3768, 77.6143],
  tirunelveli: [8.7139, 77.7567],
  nagercoil: [8.1833, 77.4119],
  chennai: [13.0827, 80.2707],
  delhi: [28.6139, 77.209],
}

function resolveCoordinates(name: string, lat?: number, lon?: number): [number, number] {
  if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
    return [lat, lon]
  }

  const clean = name.toLowerCase()
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (clean.includes(key)) {
      return coords
    }
  }

  // Default to Madukkarai (10.9038° N, 76.9602° E) as requested
  return [10.9038, 76.9602]
}

export default function ClimatePlaceMap({
  locationName,
  lat,
  lon,
  weatherCondition = 'Live Climate Station',
  temp,
}: ClimatePlaceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const [actualLat, actualLon] = resolveCoordinates(locationName, lat, lon)

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [actualLat, actualLon],
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    const customIcon = L.divIcon({
      className: 'climate-station-marker',
      html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#DC2626;border:3px solid #fff;box-shadow:0 0 0 6px rgba(220,38,38,0.2),0 2px 6px rgba(0,0,0,0.3)"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -12],
    })

    const marker = L.marker([actualLat, actualLon], { icon: customIcon }).addTo(map)
    const tempDisplay = temp !== undefined ? ` · ${temp}°C` : ''
    marker.bindPopup(
      `<div style="font-family:inherit;font-size:13px;line-height:1.4"><strong>${locationName}</strong><br/><span style="color:#64748B">${weatherCondition}${tempDisplay}</span></div>`,
    )

    markerRef.current = marker
    mapInstanceRef.current = map

    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [actualLat, actualLon, locationName, weatherCondition, temp])

  // Pan to updated location if coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([actualLat, actualLon], 13)
      markerRef.current.setLatLng([actualLat, actualLon])
    }
  }, [actualLat, actualLon])

  const handleCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([actualLat, actualLon], 14, { animate: true })
      if (markerRef.current) {
        markerRef.current.openPopup()
      }
    }
  }

  return (
    <div className="relative isolate overflow-hidden rounded-xl border border-line">
      <div ref={mapContainerRef} className="relative z-[1] h-[300px] w-full" />
      <button
        type="button"
        onClick={handleCenter}
        className="absolute top-3 right-3 z-[2] inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fg shadow-sm hover:bg-surface-2"
      >
        <LocateFixed className="size-3.5" aria-hidden /> Re-center
      </button>
    </div>
  )
}
