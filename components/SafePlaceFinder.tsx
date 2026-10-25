'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  ExternalLink,
  Flame,
  Home,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Search,
  Shield,
  ShieldAlert,
  Wind,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Segmented } from '@/components/ui/segmented'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useTelemetry } from '@/hooks/useTelemetry'
import {
  fetchNearbySafePlaces,
  filterSafePlaces,
  geocodeLocation,
  getDemoSafePlaces,
  getDirectionsUrl,
  type PlacesSource,
  prioritizeSafePlaces,
} from '@/lib/safe-places'
import { SafePlace, SafePlaceFilter, SafePlaceType, UserLocation } from '@/types/aeris'

// Dynamic import of Leaflet map to guarantee zero SSR hydration issues
const SafePlaceMap = dynamic(() => import('@/components/SafePlaceMap'), {
  ssr: false,
  loading: () => <div className="h-full min-h-[340px] animate-pulse bg-surface-2" />,
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
  const [source, setSource] = useState<PlacesSource>('none')
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const isDesktop = useIsDesktop()

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
      setLoadingMessage(`Looking up "${q}"…`)

      try {
        const results = await geocodeLocation(q)
        if (!results || results.length === 0) {
          setIsLoading(false)
          setErrorMessage(`We couldn’t find "${q}". Try a nearby town or district.`)
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

        setLoadingMessage(`Finding facilities near ${match.shortName}…`)

        const fetchResult = await fetchNearbySafePlaces(match.lat, match.lon)
        setPlaces(fetchResult.places)
        setIsDemoData(fetchResult.isDemoFallback)
        setSource(fetchResult.source)
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
    setLoadingMessage('Getting your location…')

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
          displayName: `Your location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          shortName: 'you',
        }
        setUserLocation(newLocation)

        setLoadingMessage('Finding facilities near you…')

        try {
          const result = await fetchNearbySafePlaces(lat, lon)
          setPlaces(result.places)
          setIsDemoData(result.isDemoFallback)
          setSource(result.source)
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
          setErrorMessage('Location access is blocked. Search for your town instead, or allow location in your browser settings.')
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

  const FILTERS: { id: SafePlaceFilter; label: string; icon?: React.ElementType }[] = [
    { id: 'All', label: 'All' },
    { id: 'Hospital', label: 'Hospitals', icon: Building2 },
    { id: 'PHC', label: 'Health centres', icon: Shield },
    { id: 'Shelter', label: 'Shelters', icon: Home },
    { id: 'Pharmacy', label: 'Pharmacies', icon: Pill },
  ]

  const TYPE_LABEL: Record<SafePlaceType, string> = { Hospital: 'Hospital', PHC: 'Health centre', Shelter: 'Shelter', Pharmacy: 'Pharmacy' }
  const TYPE_TONE: Record<SafePlaceType, 'danger' | 'success' | 'warning' | 'info'> = { Hospital: 'danger', PHC: 'info', Shelter: 'warning', Pharmacy: 'success' }

  const priority =
    scenario === 'Heat' || risks.heat >= 50
      ? { icon: Flame, text: 'Cooling shelters and heatstroke care are listed first because of the heat.' }
      : scenario === 'Monsoon' || telemetry.rain
      ? { icon: ShieldAlert, text: 'Flood shelters on higher ground are listed first because of rain.' }
      : telemetry.externalAqi >= 100 || risks.environmental >= 50
      ? { icon: Wind, text: 'Facilities with oxygen and respiratory care are listed first because of poor air.' }
      : isHighRisk
      ? { icon: AlertTriangle, text: '24/7 emergency and ICU facilities are listed first because your risk is high.' }
      : null

  return (
    <div className="flex flex-col gap-4">
      {isHighRisk && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-danger-line bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-danger">Your health risk is high</p>
              <p className="text-sm text-fg-2">Find the nearest hospital now.</p>
            </div>
          </div>
          <Button
            variant="danger"
            onClick={() => {
              setActiveFilter('Hospital')
              if (!hasSearched) handleUseCurrentLocation()
            }}
          >
            <Building2 /> Nearest hospital
          </Button>
        </div>
      )}

      <Card className="sticky top-[calc(var(--topbar-h)+8px)] z-[var(--z-sticky)] p-4 shadow-md md:p-5">
        <form
          className="flex flex-col gap-2 md:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            handleSearchLocation()
          }}
          role="search"
        >
          <label className="relative flex-1">
            <span className="sr-only">Search a city, town or area</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
            <input
              type="search"
              className="h-11 w-full rounded-xl border border-line bg-surface-2 pr-3 pl-10 text-[15px] text-fg placeholder:text-fg-muted focus:border-brand focus:bg-surface focus:outline-none"
              placeholder="Search a city, town or area"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Button type="submit" size="lg" className="h-11" disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? <Loader2 className="animate-spin" /> : <Search />} Search
            </Button>
            <Button type="button" variant="secondary" size="lg" className="h-11" onClick={handleUseCurrentLocation} disabled={isLoading}>
              <LocateFixed /> Near me
            </Button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-fg-muted">Try:</span>
          {QUICK_LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              className="h-7 cursor-pointer rounded-full border border-line bg-surface px-3 text-xs text-fg-2 hover:border-line-strong hover:text-fg disabled:opacity-50"
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
      </Card>

      {isLoading && (
        <p className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-fg-2" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {loadingMessage || 'Finding nearby facilities…'}
        </p>
      )}

      {errorMessage && (
        <p className="flex items-start gap-2 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errorMessage}
        </p>
      )}

      {hasSearched && !isLoading && (isDemoData || source === 'saved' || source === 'nominatim') && (
        <p
          className={cn(
            'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm text-fg-2',
            isDemoData ? 'border-warning-line bg-warning-soft' : 'border-info-line bg-info-soft',
          )}
        >
          <Info className={cn('mt-0.5 size-4 shrink-0', isDemoData ? 'text-warning' : 'text-info')} aria-hidden />
          <span>
            <strong className="text-fg">{isDemoData ? 'Sample places. ' : source === 'saved' ? 'Saved map data. ' : 'Live search. '}</strong>
            {fallbackReason}
          </span>
        </p>
      )}

      {hasSearched && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="radiogroup" aria-label="Facility type">
            {FILTERS.map(({ id, label, icon: Icon }) => {
              const active = activeFilter === id
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setActiveFilter(id)}
                  className={cn(
                    'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                    active ? 'border-fg bg-fg text-on-fg' : 'border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg',
                  )}
                >
                  {Icon && <Icon className="size-4" aria-hidden />}
                  {label}
                  <span className={cn('text-xs tabular-nums', active ? 'opacity-80' : 'text-fg-muted')}>{counts[id as keyof typeof counts] || 0}</span>
                </button>
              )
            })}
          </div>
          {priority && (
            <p className="flex items-center gap-2 text-xs text-fg-2">
              <priority.icon className="size-4 shrink-0 text-warning" aria-hidden />
              {priority.text}
            </p>
          )}
        </div>
      )}

      {hasSearched ? (
        <>
        <Segmented
          className="lg:hidden"
          label="Show places as"
          value={mobileView}
          onChange={setMobileView}
          options={[
            { value: 'list', label: 'List' },
            { value: 'map', label: 'Map' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {(isDesktop || mobileView === 'map') && (
          <Card className="overflow-hidden p-0 lg:order-2 lg:col-span-7 lg:sticky lg:top-[calc(var(--topbar-h)+120px)] lg:self-start">
            <div className="h-[340px] md:h-[520px]">
              <SafePlaceMap userLocation={userLocation} places={filteredPlaces} selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} />
            </div>
          </Card>

          )}
          <Card className={cn('flex flex-col overflow-hidden p-0 lg:order-1 lg:col-span-5', !isDesktop && mobileView === 'map' && 'hidden')}>
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-fg">
                {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'}
                {userLocation?.shortName ? ` near ${userLocation.shortName}` : ' nearby'}
              </p>
              <p className="text-xs text-fg-muted">Sorted by priority, then distance</p>
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <MapPin className="size-8 text-fg-muted" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-fg">{activeFilter === 'Shelter' ? 'No shelters mapped here' : 'No places found here'}</p>
                <p className="mt-1 max-w-xs text-sm text-fg-2">
                  {activeFilter === 'Shelter'
                    ? 'Official relief shelters are rarely mapped online. Call 1077, the district disaster helpline, for the nearest open relief camp.'
                    : source === 'none'
                    ? 'Map data is unavailable right now and there is no saved data for this area. Try again shortly, or call 108 for an ambulance.'
                    : 'No matching places within 6 km. Try another category or a nearby town.'}
                </p>
                {activeFilter === 'Shelter' && (
                  <a href="tel:1077" className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white">
                    Call 1077
                  </a>
                )}
                {activeFilter !== 'All' && (
                  <Button variant="link" className="mt-3" onClick={() => setActiveFilter('All')}>
                    Show all categories
                  </Button>
                )}
              </div>
            ) : (
              <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto p-3">
                {filteredPlaces.map((place) => {
                  const isSelected = selectedPlace?.id === place.id
                  return (
                    <li key={place.id}>
                      <article
                        className={cn(
                          'cursor-pointer rounded-xl border p-3.5 transition-colors',
                          isSelected ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-line-strong',
                        )}
                        onClick={() => setSelectedPlace(place)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Badge tone={TYPE_TONE[place.type]}>{TYPE_LABEL[place.type]}</Badge>
                            {place.isDemo && <Badge tone="neutral">Sample</Badge>}
                          </div>
                          {place.distanceKm !== undefined && (
                            <span className="flex items-center gap-1 font-mono text-xs text-fg-muted tabular-nums">
                              <Navigation className="size-3" aria-hidden /> {place.distanceKm} km
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-fg">{place.name}</h3>
                        <p className="mt-0.5 text-xs text-fg-2">{place.address}</p>
                        {place.recommendationReason && <p className="mt-2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-fg-2">{place.recommendationReason}</p>}
                        {place.capabilities && place.capabilities.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {place.capabilities.slice(0, 4).map((cap) => (
                              <span key={cap} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-fg-muted">
                                {cap}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                          {place.phone && (
                            <a
                              href={`tel:${place.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-line px-3.5 text-sm font-medium text-fg hover:bg-surface-2"
                            >
                              <Phone className="size-3.5" aria-hidden /> Call
                            </a>
                          )}
                          <a
                            href={getDirectionsUrl(place.lat, place.lon, place.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-xl bg-fg px-4 text-sm font-semibold text-on-fg hover:opacity-90"
                          >
                            Directions <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
        </>
      ) : (
        !isLoading && (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <MapPin className="size-7" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-fg">Find help near you</h2>
            <p className="mt-1 max-w-md text-sm text-fg-2">Use your location or search a town to see hospitals, health centres, shelters and pharmacies on the map.</p>
            <Button className="mt-5" onClick={handleUseCurrentLocation}>
              <LocateFixed /> Use my location
            </Button>
          </Card>
        )
      )}
    </div>
  )
}
