'use client'

import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, MapPin } from 'lucide-react'

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

    // Create custom pulsating red station marker
    const customIcon = L.divIcon({
      className: 'climate-station-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(220, 38, 38, 0.25); animation: pulse 2s infinite ease-out;"></div>
          <div style="width: 28px; height: 28px; border-radius: 50% 50% 50% 0; background: #DC2626; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);">
            <span style="transform: rotate(45deg); color: #FFFFFF; font-size: 13px; font-weight: 900; line-height: 1;">📍</span>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 32],
      popupAnchor: [0, -32],
    })

    const marker = L.marker([actualLat, actualLon], { icon: customIcon }).addTo(map)

    const tempDisplay = temp !== undefined ? ` • <b>${temp}°C</b>` : ''
    marker
      .bindPopup(
        `<div style="font-family: inherit; padding: 4px 2px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 13px; color: #0F172A;">
            <span style="color: #DC2626;">📍</span> ${locationName}
          </div>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px; font-family: monospace;">
            Lat: ${actualLat.toFixed(4)}° N, Lon: ${actualLon.toFixed(4)}° E
          </div>
          <div style="font-size: 11px; color: #0F172A; margin-top: 4px; font-weight: 600;">
            ${weatherCondition}${tempDisplay}
          </div>
          <div style="font-size: 10px; color: #DC2626; margin-top: 4px; font-weight: 700; text-transform: uppercase;">
            ● Active Climate & Heat Telemetry Station
          </div>
        </div>`
      )
      .openPopup()

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
    <div
      className="panel"
      style={{
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        background: 'var(--panel-bg)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--panel-elevated)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} style={{ color: 'var(--main-red)' }} />
          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            Location Ground Map: {locationName}
          </strong>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: 4,
              background: '#FEF2F2',
              color: 'var(--main-red)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              fontWeight: 700,
            }}
          >
            {actualLat.toFixed(4)}° N, {actualLon.toFixed(4)}° E
          </span>
        </div>

        <button
          onClick={handleCenter}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
          title="Center on this location"
        >
          <LocateFixed size={12} style={{ color: 'var(--main-red)' }} />
          <span>Center Place</span>
        </button>
      </div>

      <div
        ref={mapContainerRef}
        style={{
          height: 280,
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  )
}
