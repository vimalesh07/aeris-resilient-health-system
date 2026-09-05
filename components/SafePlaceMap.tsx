'use client'

import React, { useCallback, useEffect, useRef } from 'react'
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

function getMarkerIconSvg(type: SafePlaceType): string {
  const color = getMarkerColor(type)
  let symbol = '✚'
  if (type === 'PHC') symbol = '⚕'
  if (type === 'Shelter') symbol = '⌂'
  if (type === 'Pharmacy') symbol = 'Rx'

  return `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      background: ${color};
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4);
      cursor: pointer;
    ">
      <span style="
        transform: rotate(45deg);
        color: #FFFFFF;
        font-size: ${type === 'Pharmacy' ? '11px' : '14px'};
        font-weight: 900;
        line-height: 1;
      ">${symbol}</span>
    </div>
  `
}

function getUserLocationIconSvg(): string {
  return `
    <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: rgba(255, 193, 7, 0.4);
        animation: pulse 1.8s infinite ease-out;
      "></div>
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #FFC107;
        border: 2.5px solid #1F0505;
        box-shadow: 0 0 8px rgba(255, 193, 7, 0.8);
      "></div>
    </div>
  `
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
    map.flyTo([userLocation.lat, userLocation.lon], 14, { duration: 1.0 })

    const label =
      userLocation.source === 'gps'
        ? '📍 Current GPS Location'
        : `📍 Selected: ${userLocation.shortName || userLocation.displayName || 'Location'}`
    const sublabel =
      userLocation.source === 'gps'
        ? 'Browser Detected Geolocation'
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
        iconSize: [26, 26],
        iconAnchor: [13, 13],
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

    places.forEach((place) => {
      const markerIcon = L.divIcon({
        className: 'custom-facility-pin',
        html: getMarkerIconSvg(place.type),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -30],
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
              ? `<div style="font-size: 9px; color: #B45309; background: #FEF3C7; padding: 1px 4px; border-radius: 3px; margin-bottom: 6px; display: inline-block;">Demo Facility</div>`
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
            ">Get Directions ↗</a>
          </div>
        </div>
      `

      const marker = L.marker([place.lat, place.lon], { icon: markerIcon })
        .addTo(markersLayer)
        .bindPopup(popupContent)

      marker.on('click', () => {
        onSelectPlaceRef.current?.(place)
      })

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
  }, [places, userLocation])

  // Pan to selected place when explicitly clicked from the facility card list
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !selectedPlace) return

    map.flyTo([selectedPlace.lat, selectedPlace.lon], 15, {
      duration: 1.0,
    })
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
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 380,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Leaflet DOM container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 380,
          zIndex: 1,
          touchAction: 'pan-x pan-y',
        }}
      />

      {/* Top Legend & Re-center Control Strip */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Category Legend */}
        <div
          style={{
            background: 'rgba(31, 5, 5, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: 8,
            padding: '6px 12px',
            display: 'flex',
            gap: 12,
            fontSize: 11,
            color: '#FFF',
            pointerEvents: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C62828' }} /> Hospital
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} /> PHC
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706' }} /> Shelter
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} /> Pharmacy
          </span>
        </div>

        {/* Re-center Button */}
        <button
          onClick={handleRecenter}
          title="Re-center map on currently selected location"
          style={{
            background: 'rgba(31, 5, 5, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 193, 7, 0.4)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--bright-yellow)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            transition: 'all 0.15s ease',
          }}
        >
          <LocateFixed size={13} />
          <span>Re-center</span>
        </button>
      </div>
    </div>
  )
}
