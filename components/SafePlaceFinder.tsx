'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Compass,
  ExternalLink,
  Flame,
  Home,
  Info,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Wind,
} from 'lucide-react'
import { useTelemetry } from '@/hooks/useTelemetry'
import {
  fetchNearbySafePlaces,
  filterSafePlaces,
  geocodeLocation,
  getDemoSafePlaces,
  getDirectionsUrl,
  prioritizeSafePlaces,
} from '@/lib/safe-places'
import { SafePlace, SafePlaceFilter, SafePlaceType, UserLocation } from '@/types/aeris'

// Dynamic import of Leaflet map to guarantee zero SSR hydration issues
const SafePlaceMap = dynamic(() => import('@/components/SafePlaceMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(31, 5, 5, 0.6)',
        borderRadius: 14,
        border: '1px solid rgba(255, 193, 7, 0.2)',
        color: '#FFF8F0',
        gap: 10,
      }}
    >
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--yellow)' }} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>Loading OpenStreetMap Leaflet Engine...</span>
    </div>
  ),
})

interface SafePlaceFinderProps {
  compact?: boolean
  initialFilter?: SafePlaceFilter
  autoLocate?: boolean
}

const QUICK_LOCATIONS = [
  'Valliyur, Tirunelveli',
  'Tirunelveli',
  'Nagercoil',
  'Coimbatore',
  'Chennai',
]

export function SafePlaceFinder({
  compact = false,
  initialFilter = 'All',
  autoLocate = false,
}: SafePlaceFinderProps) {
  const { telemetry, risks, scenario } = useTelemetry()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [places, setPlaces] = useState<SafePlace[]>([])
  const [selectedPlace, setSelectedPlace] = useState<SafePlace | null>(null)
  const [activeFilter, setActiveFilter] = useState<SafePlaceFilter>(initialFilter)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDemoData, setIsDemoData] = useState<boolean>(false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState<boolean>(false)

  // Risk detection state
  const isHighRisk =
    risks.overall >= 50 || risks.statusLevel === 'Warning' || risks.statusLevel === 'High Risk'

  // Stable place selection callback
  const handleSelectPlace = useCallback((place: SafePlace) => {
    setSelectedPlace(place)
  }, [])

  // Execute location search via Nominatim geocoding proxy
  const handleSearchLocation = useCallback(
    async (queryOverride?: string) => {
      const q = (queryOverride || searchQuery).trim()
      if (!q) {
        setErrorMessage('Please enter a city, town, or area to search.')
        return
      }

      setIsLoading(true)
      setErrorMessage(null)
      setPlaces([]) // Clear previous facility results immediately
      setSelectedPlace(null)
      setLoadingMessage(`Geocoding coordinates for "${q}" via OpenStreetMap...`)

      try {
        const results = await geocodeLocation(q)
        if (!results || results.length === 0) {
          setIsLoading(false)
          setErrorMessage(`No geographic coordinates found for "${q}". Please try a nearby town or district.`)
          return
        }

        const match = results[0]
        const newLocation: UserLocation = {
          lat: match.lat,
          lon: match.lon,
          displayName: match.displayName,
          shortName: match.shortName,
          source: 'search',
        }
        setUserLocation(newLocation)

        setLoadingMessage(`Found ${match.shortName}. Scanning nearby emergency healthcare, shelters & pharmacies...`)

        const fetchResult = await fetchNearbySafePlaces(match.lat, match.lon)
        setPlaces(fetchResult.places)
        setIsDemoData(fetchResult.isDemoFallback)
        setFallbackReason(fetchResult.fallbackReason || null)
        setHasSearched(true)
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error occurred while geocoding location.')
      } finally {
        setIsLoading(false)
        setLoadingMessage('')
      }
    },
    [searchQuery]
  )

  // Request browser geolocation API (explicit user action)
  const handleUseCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setPlaces([]) // Clear previous facility results
    setSelectedPlace(null)
    setLoadingMessage('Acquiring your browser GPS location...')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const accuracy = pos.coords.accuracy

        const newLocation: UserLocation = {
          lat,
          lon,
          accuracy,
          source: 'gps',
          displayName: `GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          shortName: 'GPS Location',
        }
        setUserLocation(newLocation)

        setLoadingMessage('Scanning for nearby verified facilities around your GPS coordinates...')

        try {
          const result = await fetchNearbySafePlaces(lat, lon)
          setPlaces(result.places)
          setIsDemoData(result.isDemoFallback)
          setFallbackReason(result.fallbackReason || null)
          setHasSearched(true)
        } catch (err: any) {
          setErrorMessage(err?.message || 'Error fetching nearby facilities.')
        } finally {
          setIsLoading(false)
          setLoadingMessage('')
        }
      },
      (err) => {
        setIsLoading(false)
        setLoadingMessage('')
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMessage('Location permission was denied. You can search any town or city using the search bar above.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMessage('GPS position is currently unavailable. Please search for your town/city above.')
        } else if (err.code === err.TIMEOUT) {
          setErrorMessage('Location request timed out. Please search for your area above.')
        } else {
          setErrorMessage('Unable to access location. Please search for your area above.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  // Auto-locate only if explicitly configured
  useEffect(() => {
    if (autoLocate && !hasSearched) {
      handleSearchLocation('Valliyur, Tirunelveli')
    }
  }, [autoLocate, hasSearched, handleSearchLocation])

  // Prioritize places based on active telemetry and hazard risks
  const prioritizedPlaces = useMemo(() => {
    return prioritizeSafePlaces(places, risks, scenario, telemetry)
  }, [places, risks, scenario, telemetry])

  // Apply category filter
  const filteredPlaces = useMemo(() => {
    return filterSafePlaces(prioritizedPlaces, activeFilter)
  }, [prioritizedPlaces, activeFilter])

  // Counts by category
  const counts = useMemo(() => {
    return {
      All: places.length,
      Hospital: places.filter((p) => p.type === 'Hospital').length,
      PHC: places.filter((p) => p.type === 'PHC').length,
      Shelter: places.filter((p) => p.type === 'Shelter').length,
      Pharmacy: places.filter((p) => p.type === 'Pharmacy').length,
    }
  }, [places])

  // Icon helper by type
  const getTypeIcon = (type: SafePlaceType) => {
    switch (type) {
      case 'Hospital':
        return <Building2 size={16} />
      case 'PHC':
        return <Shield size={16} />
      case 'Shelter':
        return <Home size={16} />
      case 'Pharmacy':
        return <Pill size={16} />
    }
  }

  // Color badge helper
  const getTypeBadgeClass = (type: SafePlaceType) => {
    switch (type) {
      case 'Hospital':
        return 'safe-badge-hospital'
      case 'PHC':
        return 'safe-badge-phc'
      case 'Shelter':
        return 'safe-badge-shelter'
      case 'Pharmacy':
        return 'safe-badge-pharmacy'
    }
  }

  return (
    <div className="safe-place-finder-container">
      {/* 1. Emergency Risk Alert Banner if High Risk detected */}
      {isHighRisk && (
        <div className="emergency-risk-banner">
          <div className="banner-left">
            <span className="banner-icon-pulse">
              <AlertTriangle size={22} />
            </span>
            <div>
              <strong>⚠️ High Health Risk Detected</strong>
              <p>Find the nearest safe healthcare facility.</p>
            </div>
          </div>
          <button
            className="emergency-action-btn"
            onClick={() => {
              setActiveFilter('Hospital')
              if (!hasSearched) {
                handleSearchLocation('Valliyur, Tirunelveli')
              }
            }}
          >
            <Building2 size={16} />
            Find Safe Place
          </button>
        </div>
      )}

      {/* 2. Top Header & Title */}
      <div className="safe-finder-header">
        <div className="header-info">
          <div className="header-eyebrow">
            <MapPin size={14} style={{ color: 'var(--yellow)' }} />
            <span>Resilient Geo-Spatial Safety Engine</span>
          </div>
          <h2>Safe Place Finder</h2>
          <p className="header-desc">
            Search any city, town, or area to locate verified hospitals, primary health centres (PHCs), disaster
            cooling shelters, and pharmacies linked with AERIS climate hazard intelligence.
          </p>
        </div>

        {/* Location Status Indicator */}
        <div className="header-location-box">
          <div className="location-indicator">
            <span className={`location-dot ${userLocation ? 'active' : ''}`} />
            <div className="location-meta">
              <small>
                {userLocation?.source === 'gps'
                  ? 'Current GPS Location'
                  : userLocation
                  ? 'Selected Location'
                  : 'Location Status'}
              </small>
              <strong>
                {userLocation?.source === 'search'
                  ? userLocation.shortName || userLocation.displayName
                  : userLocation
                  ? `Lat: ${userLocation.lat.toFixed(4)}, Lon: ${userLocation.lon.toFixed(4)}`
                  : 'No location selected'}
              </strong>
              {userLocation && (
                <span style={{ fontSize: 10, color: 'var(--bright-yellow)', display: 'block', opacity: 0.9 }}>
                  Lat: {userLocation.lat.toFixed(4)} • Lon: {userLocation.lon.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Location Search Bar & Quick Location Selection */}
      <div className="safe-search-section">
        <div className="search-input-group">
          <div className="search-input-wrapper">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              className="safe-search-input"
              placeholder="Search city, town or area (e.g. Valliyur, Tirunelveli)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchLocation()
                }
              }}
              disabled={isLoading}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>

          <button
            className="find-places-btn"
            onClick={() => handleSearchLocation()}
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Search Location</span>
              </>
            )}
          </button>

          <button
            className="gps-locate-btn"
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            title="Use browser Geolocation API"
          >
            <Compass size={16} />
            <span>📍 Use My Current Location</span>
          </button>
        </div>

        {/* Quick Pick Location Pills */}
        <div className="quick-locations-strip">
          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Quick Select:</span>
          {QUICK_LOCATIONS.map((loc) => (
            <button
              key={loc}
              className="quick-loc-pill"
              onClick={() => {
                setSearchQuery(loc)
                handleSearchLocation(loc)
              }}
              disabled={isLoading}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Loading & Error Status Messages */}
      {isLoading && (
        <div className="safe-finder-status-box loading">
          <Loader2 size={18} className="animate-spin" />
          <span>{loadingMessage || 'Locating verified facilities...'}</span>
        </div>
      )}

      {errorMessage && (
        <div className="safe-finder-status-box error">
          <AlertCircle size={18} />
          <div style={{ flex: 1 }}>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Demo Notice if Demo Data is Active */}
      {isDemoData && hasSearched && (
        <div className="safe-finder-demo-notice">
          <Info size={15} />
          <span>
            <b>DEMO DATA:</b> {fallbackReason || 'Simulation data active.'} These facilities are for project demonstration.
          </span>
        </div>
      )}

      {/* 5. Hazard AI Priority Strip */}
      {hasSearched && (
        <div className="hazard-context-strip">
          <span className="hazard-strip-label">
            <Sparkles size={14} style={{ color: 'var(--yellow)' }} /> Emergency AI Priority:
          </span>
          {scenario === 'Heat' || risks.heat >= 50 ? (
            <span className="hazard-strip-tag heat">
              <Flame size={13} /> Prioritizing Cooling Shelters & Heatstroke Wards
            </span>
          ) : scenario === 'Monsoon' || telemetry.rain ? (
            <span className="hazard-strip-tag monsoon">
              <ShieldAlert size={13} /> Prioritizing Elevated Flood Shelters & High Ground
            </span>
          ) : telemetry.externalAqi >= 100 || risks.environmental >= 50 ? (
            <span className="hazard-strip-tag pollution">
              <Wind size={13} /> Prioritizing Oxygen Stations & Respiratory Facilities
            </span>
          ) : isHighRisk ? (
            <span className="hazard-strip-tag critical">
              <AlertTriangle size={13} /> Prioritizing 24/7 Trauma Emergency & ICU Triage
            </span>
          ) : (
            <span className="hazard-strip-tag normal">
              All signals normal. Standard proximity routing active.
            </span>
          )}
        </div>
      )}

      {/* 6. Filter Strip: [All] [Hospitals] [PHCs] [Shelters] [Pharmacies] */}
      {hasSearched && (
        <div className="safe-filter-strip">
          {(['All', 'Hospital', 'PHC', 'Shelter', 'Pharmacy'] as SafePlaceFilter[]).map((f) => {
            const count = counts[f as keyof typeof counts] || 0
            const label =
              f === 'All'
                ? 'All Safe Places'
                : f === 'Hospital'
                ? 'Hospitals'
                : f === 'PHC'
                ? 'PHCs'
                : f === 'Shelter'
                ? 'Shelters'
                : 'Pharmacies'

            return (
              <button
                key={f}
                className={`safe-filter-pill ${activeFilter === f ? 'selected' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f === 'Hospital' && <Building2 size={13} />}
                {f === 'PHC' && <Shield size={13} />}
                {f === 'Shelter' && <Home size={13} />}
                {f === 'Pharmacy' && <Pill size={13} />}
                <span>{label}</span>
                <span className="filter-count">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 7. Main Interactive Area: Map View + Results Card Directory */}
      {hasSearched ? (
        <div className={`safe-finder-body ${compact ? 'compact-layout' : ''}`}>
          {/* Map View */}
          <div className="safe-map-card">
            <div className="map-card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Compass size={15} style={{ color: 'var(--yellow)' }} />
                <strong>
                  {userLocation?.shortName
                    ? `Safety Map: ${userLocation.shortName}`
                    : 'Interactive Resilient Safety Map'}
                </strong>
              </div>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>OpenStreetMap + Leaflet</span>
            </div>
            <div className="map-wrapper">
              <SafePlaceMap
                userLocation={userLocation}
                places={filteredPlaces}
                selectedPlace={selectedPlace}
                onSelectPlace={handleSelectPlace}
              />
            </div>
          </div>

          {/* Facility List Directory */}
          <div className="safe-list-card">
            <div className="list-card-head">
              <strong>
                {userLocation?.shortName
                  ? `Facilities in ${userLocation.shortName} (${filteredPlaces.length})`
                  : `Nearby Facilities (${filteredPlaces.length})`}
              </strong>
              <small>Sorted by Hazard Priority & Distance</small>
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="safe-empty-state">
                <Info size={32} style={{ opacity: 0.5, color: 'var(--yellow)' }} />
                <strong style={{ fontSize: 14, color: '#FFF' }}>
                  No verified nearby facilities found for this location.
                </strong>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 12px', maxWidth: 360 }}>
                  No medical amenities or emergency shelters are currently indexed in OpenStreetMap within 6km of{' '}
                  <b>{userLocation?.shortName || 'this area'}</b>.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="text-action-link" onClick={() => setActiveFilter('All')}>
                    Show all categories
                  </button>
                  <span style={{ color: '#4B5563' }}>•</span>
                  <button
                    className="text-action-link"
                    onClick={() => handleSearchLocation('Valliyur, Tirunelveli')}
                  >
                    View Valliyur, Tirunelveli Facilities →
                  </button>
                </div>
              </div>
            ) : (
              <div className="facility-cards-scroll">
                {filteredPlaces.map((place) => {
                  const isSelected = selectedPlace?.id === place.id
                  const dirUrl = getDirectionsUrl(place.lat, place.lon, place.name)

                  return (
                    <article
                      key={place.id}
                      className={`facility-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedPlace(place)}
                    >
                      <div className="facility-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`facility-type-badge ${getTypeBadgeClass(place.type)}`}>
                            {getTypeIcon(place.type)}
                            <span>{place.type}</span>
                          </span>
                          {place.isDemo && <span className="demo-data-badge">DEMO DATA</span>}
                        </div>

                        {place.distanceKm !== undefined && (
                          <div className="facility-distance">
                            <Navigation size={12} />
                            <span>{place.distanceKm} km away</span>
                          </div>
                        )}
                      </div>

                      <h3 className="facility-name">{place.name}</h3>
                      <p className="facility-address">{place.address}</p>

                      {/* Hazard-aware recommendation reason */}
                      {place.recommendationReason && (
                        <div className="facility-hazard-callout">
                          <Sparkles size={12} />
                          <span>{place.recommendationReason}</span>
                        </div>
                      )}

                      {/* Capabilities pills */}
                      {place.capabilities && place.capabilities.length > 0 && (
                        <div className="facility-capabilities">
                          {place.capabilities.map((cap, idx) => (
                            <span key={idx} className="cap-pill">
                              {cap}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action footer: Phone & Get Directions */}
                      <div className="facility-foot">
                        {place.phone ? (
                          <a
                            href={`tel:${place.phone}`}
                            className="facility-phone-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone size={13} />
                            <span>{place.phone}</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Verified OpenStreetMap Place</span>
                        )}

                        <a
                          href={dirUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="directions-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Get Directions</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Initial Prompt before search */
        <div className="safe-initial-prompt">
          <div className="prompt-inner">
            <span className="prompt-icon">
              <MapPin size={32} />
            </span>
            <h3>Search Any City or Town for Safe Places</h3>
            <p>
              Type your town or city name above (e.g. <b>Valliyur, Tirunelveli</b>, Nagercoil, Chennai) or click{' '}
              <b>"📍 Use My Current Location"</b> to center the map and load real emergency facilities.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                className="find-places-btn"
                onClick={() => {
                  setSearchQuery('Valliyur, Tirunelveli')
                  handleSearchLocation('Valliyur, Tirunelveli')
                }}
                disabled={isLoading}
              >
                <Search size={16} />
                Search Valliyur, Tirunelveli
              </button>
              <button
                className="gps-locate-btn"
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
              >
                <Compass size={16} />
                📍 Use My Current Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Mandated Emergency Disclaimer */}
      <div className="safe-disclaimer">
        <Info size={14} />
        <p>
          <strong>Notice:</strong> Safe Place Finder provides location-based suggestions. In a real emergency, contact
          local emergency services (Ambulance: <b>102 / 108</b>, National Emergency: <b>112</b>, Disaster Helpline: <b>1077</b>).
        </p>
      </div>
    </div>
  )
}
