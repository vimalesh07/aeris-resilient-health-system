export interface ExternalWeatherData {
  locationName: string
  ambientTemp: number // °C
  humidity: number // %
  pressure: number // hPa
  rain: boolean
  precipitation: number // mm
  externalAqi: number // AQI
  uvIndex: number
  weatherCondition: string
  source: string
  timestamp: string
}

export async function fetchRealWeather(latitude?: number, longitude?: number, isServer = false): Promise<ExternalWeatherData> {
  // If running in browser and not explicitly requested as server execution, call backend API route
  if (typeof window !== 'undefined' && !isServer) {
    try {
      const params = new URLSearchParams()
      if (latitude !== undefined) params.set('lat', String(latitude))
      if (longitude !== undefined) params.set('lon', String(longitude))
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/weather${query}`)
      if (res.ok) {
        return await res.json()
      }
    } catch (err) {
      console.warn('Weather API route call failed, falling back to direct client fetch:', err)
    }
  }

  let lat = latitude || 28.6139 // Default New Delhi / fallback
  let lon = longitude || 77.209
  let locationName = 'Local Region'

  // Attempt IP Geolocation if coordinates not passed
  if (!latitude || !longitude) {
    try {
      const ipRes = await fetch('https://ipapi.co/json/')
      if (ipRes.ok) {
        const ipData = await ipRes.json()
        if (ipData.latitude && ipData.longitude) {
          lat = ipData.latitude
          lon = ipData.longitude
          locationName = `${ipData.city || ipData.region}, ${ipData.country_code || ''}`
        }
      }
    } catch (e) {
      console.warn('IP geolocation fallback used')
    }
  }

  const owmKey = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

  // 1. Try OpenWeatherMap API if key available
  if (owmKey) {
    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${owmKey}`
      const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${owmKey}`

      const [wRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)])

      if (wRes.ok) {
        const wData = await wRes.json()
        let externalAqi = 45

        if (aqiRes.ok) {
          const aqiData = await aqiRes.json()
          const rawAqi = aqiData.list?.[0]?.main?.aqi || 2
          // Convert 1-5 scale to standard AQI range
          externalAqi = rawAqi === 1 ? 25 : rawAqi === 2 ? 45 : rawAqi === 3 ? 85 : rawAqi === 4 ? 130 : 180
        }

        const isRain = Boolean(wData.rain || wData.weather?.[0]?.main?.toLowerCase().includes('rain'))

        return {
          locationName: `${wData.name || locationName}`,
          ambientTemp: Number((wData.main?.temp || 28).toFixed(1)),
          humidity: Math.round(wData.main?.humidity || 50),
          pressure: Math.round(wData.main?.pressure || 1012),
          rain: isRain,
          precipitation: isRain ? 2.5 : 0,
          externalAqi,
          uvIndex: 4,
          weatherCondition: wData.weather?.[0]?.main || 'Clear',
          source: 'OpenWeatherMap API',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      }
    } catch (err) {
      console.warn('OpenWeatherMap API call failed, using Open-Meteo fallback')
    }
  }

  // 2. Open-Meteo Fallback (100% Free, Zero Key Required)
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,precipitation,rain,weather_code`
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,uv_index`

    const [wRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)])

    if (wRes.ok) {
      const wData = await wRes.json()
      const currentW = wData.current || {}

      let externalAqi = 42
      let uvIndex = 3

      if (aqiRes.ok) {
        const aqiData = await aqiRes.json()
        if (aqiData.current) {
          externalAqi = Math.round(aqiData.current.us_aqi || 42)
          uvIndex = Math.round(aqiData.current.uv_index || 3)
        }
      }

      const code = currentW.weather_code || 0
      let weatherCondition = 'Clear Sky'
      let isRaining = (currentW.precipitation || 0) > 0.1 || (currentW.rain || 0) > 0.1

      if (code >= 51 && code <= 67) {
        weatherCondition = 'Light Drizzle / Rain'
        isRaining = true
      } else if (code >= 80 && code <= 99) {
        weatherCondition = 'Heavy Rain / Shower'
        isRaining = true
      }

      return {
        locationName,
        ambientTemp: Number((currentW.temperature_2m || 28).toFixed(1)),
        humidity: Math.round(currentW.relative_humidity_2m || 50),
        pressure: Math.round(currentW.surface_pressure || 1012),
        rain: isRaining,
        precipitation: Number((currentW.precipitation || 0).toFixed(1)),
        externalAqi,
        uvIndex,
        weatherCondition,
        source: 'Open-Meteo Climate Feed',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    }
  } catch (err) {
    console.error('All weather providers failed:', err)
  }

  return {
    locationName: 'Local Region',
    ambientTemp: 28.5,
    humidity: 55,
    pressure: 1012,
    rain: false,
    precipitation: 0,
    externalAqi: 45,
    uvIndex: 4,
    weatherCondition: 'Clear',
    source: 'Default Climate Baseline',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}
