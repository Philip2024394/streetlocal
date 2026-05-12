/**
 * Multi-provider directions utility.
 * Cascading fallback: Google → Mapbox → HERE → haversine estimate.
 * Compares routes from available providers and picks the fastest.
 */
import { haversineKm } from './distance'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const EDGE_FN_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/directions` : null
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''
const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY ?? ''

// ─── Provider: Google (via Supabase Edge Function) ───

async function googleDirections(originLat, originLng, destLat, destLng, mode = 'driving') {
  if (!EDGE_FN_URL || !SUPABASE_ANON) return null
  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        mode,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.source === 'google' && data.distanceKm != null) {
      return { ...data, source: 'google' }
    }
    return null
  } catch { return null }
}

async function googleNavigation(originLat, originLng, destLat, destLng) {
  if (!EDGE_FN_URL || !SUPABASE_ANON) return null
  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        mode: 'driving',
        full: true,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.source === 'google' && data.polyline) {
      return {
        polyline: data.polyline,
        decodedPath: decodePolyline(data.polyline),
        steps: data.steps || [],
        bounds: data.bounds,
        distanceKm: data.distanceKm,
        durationMin: data.durationMin,
        distanceText: data.distanceText,
        durationText: data.durationText,
        source: 'google',
      }
    }
    return null
  } catch { return null }
}

// ─── Provider: Mapbox Directions API ───

const MAPBOX_MANEUVER_MAP = {
  'turn right': 'turn-right',
  'turn left': 'turn-left',
  'sharp right': 'turn-sharp-right',
  'sharp left': 'turn-sharp-left',
  'slight right': 'turn-slight-right',
  'slight left': 'turn-slight-left',
  'uturn': 'uturn-left',
  'straight': 'straight',
  'depart': 'straight',
  'arrive': 'straight',
  'continue': 'straight',
  'merge right': 'merge',
  'merge left': 'merge',
  'roundabout': 'roundabout-right',
  'rotary': 'roundabout-right',
  'fork right': 'fork-right',
  'fork left': 'fork-left',
}

function mapboxManeuver(type, modifier) {
  if (modifier && MAPBOX_MANEUVER_MAP[modifier]) return MAPBOX_MANEUVER_MAP[modifier]
  if (type === 'turn' && modifier) return MAPBOX_MANEUVER_MAP[modifier] || 'straight'
  if (type === 'continue' || type === 'new name') return 'straight'
  if (type === 'depart' || type === 'arrive') return 'straight'
  if (type === 'roundabout' || type === 'rotary') return 'roundabout-right'
  if (type === 'merge') return 'merge'
  if (type === 'fork') return modifier?.includes('left') ? 'fork-left' : 'fork-right'
  if (type === 'end of road') return modifier?.includes('left') ? 'turn-left' : 'turn-right'
  return 'straight'
}

async function mapboxDirections(originLat, originLng, destLat, destLng) {
  if (!MAPBOX_TOKEN) return null
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.routes?.length) return null

    const route = data.routes[0]
    const distKm = Math.round((route.distance / 1000) * 10) / 10
    const durMin = Math.max(1, Math.ceil(route.duration / 60))

    return {
      distanceKm: distKm,
      durationMin: durMin,
      distanceText: `${distKm} km`,
      durationText: `${durMin} min`,
      source: 'mapbox',
    }
  } catch { return null }
}

async function mapboxNavigation(originLat, originLng, destLat, destLng) {
  if (!MAPBOX_TOKEN) return null
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&overview=full&steps=true&banner_instructions=true&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.routes?.length) return null

    const route = data.routes[0]
    const coords = route.geometry.coordinates
    const decodedPath = coords.map(c => ({ lat: c[1], lng: c[0] }))

    // Parse steps from all legs
    const steps = []
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        steps.push({
          instruction: step.name
            ? `${step.maneuver.instruction || step.maneuver.type} on ${step.name}`
            : step.maneuver.instruction || step.maneuver.type,
          maneuver: mapboxManeuver(step.maneuver.type, step.maneuver.modifier),
          distance: Math.round(step.distance),
          distanceText: step.distance > 999 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`,
          duration: Math.round(step.duration),
          durationText: `${Math.max(1, Math.ceil(step.duration / 60))} min`,
          endLocation: {
            lat: step.geometry.coordinates[step.geometry.coordinates.length - 1][1],
            lng: step.geometry.coordinates[step.geometry.coordinates.length - 1][0],
          },
        })
      }
    }

    const distKm = Math.round((route.distance / 1000) * 10) / 10
    const durMin = Math.max(1, Math.ceil(route.duration / 60))

    return {
      decodedPath,
      steps,
      distanceKm: distKm,
      durationMin: durMin,
      distanceText: `${distKm} km`,
      durationText: `${durMin} min`,
      source: 'mapbox',
    }
  } catch { return null }
}

// ─── Provider: HERE Routing API ───

const HERE_MANEUVER_MAP = {
  'turnRight': 'turn-right',
  'turnLeft': 'turn-left',
  'sharpRight': 'turn-sharp-right',
  'sharpLeft': 'turn-sharp-left',
  'slightRight': 'turn-slight-right',
  'slightLeft': 'turn-slight-left',
  'uTurnRight': 'uturn-right',
  'uTurnLeft': 'uturn-left',
  'continue': 'straight',
  'depart': 'straight',
  'arrive': 'straight',
  'roundaboutExit': 'roundabout-right',
  'merge': 'merge',
  'forkRight': 'fork-right',
  'forkLeft': 'fork-left',
}

function hereManeuver(action) {
  return HERE_MANEUVER_MAP[action] || 'straight'
}

async function hereDirections(originLat, originLng, destLat, destLng) {
  if (!HERE_API_KEY) return null
  try {
    const url = `https://router.hereapi.com/v8/routes?transportMode=scooter&origin=${originLat},${originLng}&destination=${destLat},${destLng}&return=summary&apiKey=${HERE_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.routes?.length) return null

    const route = data.routes[0].sections[0]
    const distKm = Math.round((route.summary.length / 1000) * 10) / 10
    const durMin = Math.max(1, Math.ceil(route.summary.duration / 60))

    return {
      distanceKm: distKm,
      durationMin: durMin,
      distanceText: `${distKm} km`,
      durationText: `${durMin} min`,
      source: 'here',
    }
  } catch { return null }
}

async function hereNavigation(originLat, originLng, destLat, destLng) {
  if (!HERE_API_KEY) return null
  try {
    const url = `https://router.hereapi.com/v8/routes?transportMode=scooter&origin=${originLat},${originLng}&destination=${destLat},${destLng}&return=polyline,actions,instructions,turnByTurnActions&apiKey=${HERE_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.routes?.length) return null

    const section = data.routes[0].sections[0]

    // Decode HERE flexible polyline
    const decodedPath = decodeHerePolyline(section.polyline)

    // Parse turn-by-turn from actions
    const steps = (section.actions || []).map(action => ({
      instruction: action.instruction || action.action || 'Continue',
      maneuver: hereManeuver(action.action),
      distance: action.length || 0,
      distanceText: (action.length || 0) > 999
        ? `${((action.length || 0) / 1000).toFixed(1)} km`
        : `${action.length || 0} m`,
      duration: action.duration || 0,
      durationText: `${Math.max(1, Math.ceil((action.duration || 0) / 60))} min`,
      endLocation: action.offset != null && decodedPath[action.offset]
        ? decodedPath[action.offset]
        : decodedPath[decodedPath.length - 1],
    }))

    const distKm = Math.round((section.summary.length / 1000) * 10) / 10
    const durMin = Math.max(1, Math.ceil(section.summary.duration / 60))

    return {
      decodedPath,
      steps,
      distanceKm: distKm,
      durationMin: durMin,
      distanceText: `${distKm} km`,
      durationText: `${durMin} min`,
      source: 'here',
    }
  } catch { return null }
}

// ─── HERE flexible polyline decoder ───

function decodeHerePolyline(encoded) {
  const DECODING_TABLE = [
    62,  -1,  -1,  52,  53,  54,  55,  56,  57,  58,  59,  60,  61,  -1,  -1,  -1,
    -1,  -1,  -1,  -1,   0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,
    12,  13,  14,  15,  16,  17,  18,  19,  20,  21,  22,  23,  24,  25,  -1,  -1,
    -1,  -1,  63,  -1,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,
    38,  39,  40,  41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  51,
  ]

  function decodeChar(ch) {
    const code = ch.charCodeAt(0)
    return DECODING_TABLE[code - 45] || 0
  }

  function decodeSignedValue(encoded, idx) {
    let result = 0, shift = 0, value
    do {
      value = decodeChar(encoded[idx++])
      result |= (value & 0x1F) << shift
      shift += 5
    } while (value >= 32)
    if (result & 1) result = ~result
    result >>= 1
    return [result, idx]
  }

  // Skip header (precision info)
  let idx = 0
  const [, idx1] = decodeSignedValue(encoded, idx)
  const [, idx2] = decodeSignedValue(encoded, idx1)
  idx = idx2
  // Third value = has altitude flag
  if (idx < encoded.length) {
    const thirdChar = decodeChar(encoded[idx])
    if (thirdChar & 0x10) {
      // has altitude dimension, skip precision
      const [, idx3] = decodeSignedValue(encoded, idx)
      idx = idx3
    }
  }

  const points = []
  let lat = 0, lng = 0
  while (idx < encoded.length) {
    let latDelta, lngDelta
    ;[latDelta, idx] = decodeSignedValue(encoded, idx)
    ;[lngDelta, idx] = decodeSignedValue(encoded, idx)
    lat += latDelta
    lng += lngDelta
    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

// ─── Haversine fallback ───

function fallbackEstimate(originLat, originLng, destLat, destLng, mode) {
  const straightKm = haversineKm(originLat ?? 0, originLng ?? 0, destLat ?? 0, destLng ?? 0)
  const roadKm = Math.round(straightKm * 1.3 * 10) / 10
  const speeds = { driving: 20, bicycling: 15, walking: 5 }
  const speed = speeds[mode] ?? 20
  const durationMin = Math.max(1, Math.ceil((roadKm / speed) * 60))

  return {
    distanceKm: roadKm,
    durationMin,
    distanceText: `${roadKm} km`,
    durationText: `${durationMin} min`,
    source: 'fallback',
  }
}

// ─── Public: getDirections (cascading, picks fastest) ───

export async function getDirections(originLat, originLng, destLat, destLng, mode = 'driving') {
  if (!originLat || !originLng || !destLat || !destLng) {
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  }

  // Fire all providers in parallel
  const results = await Promise.allSettled([
    googleDirections(originLat, originLng, destLat, destLng, mode),
    mapboxDirections(originLat, originLng, destLat, destLng),
    hereDirections(originLat, originLng, destLat, destLng),
  ])

  // Collect successful results
  const valid = results
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(Boolean)

  if (valid.length === 0) {
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  }

  // Pick the fastest route (lowest duration), prefer Google if tied
  valid.sort((a, b) => {
    if (a.durationMin !== b.durationMin) return a.durationMin - b.durationMin
    const priority = { google: 0, mapbox: 1, here: 2 }
    return (priority[a.source] ?? 9) - (priority[b.source] ?? 9)
  })

  return valid[0]
}

// ─── Public: getNavigationRoute (cascading with full turn-by-turn) ───

export async function getNavigationRoute(originLat, originLng, destLat, destLng) {
  if (!originLat || !destLat) return null

  const isDemoMode = !EDGE_FN_URL && !SUPABASE_ANON
  const hasMapProvider = MAPBOX_TOKEN || HERE_API_KEY

  // Demo mode: use Mapbox/HERE to get a REAL road-snapped route, but mark as demo for simulation
  if (isDemoMode && hasMapProvider) {
    const realRoute = await getMapboxOrHereRoute(originLat, originLng, destLat, destLng)
    if (realRoute) return { ...realRoute, isDemo: true }
    return buildDemoRoute()
  }

  // No providers at all
  if (!EDGE_FN_URL && !hasMapProvider) return buildDemoRoute()

  // Production: fire all navigation providers in parallel
  const results = await Promise.allSettled([
    googleNavigation(originLat, originLng, destLat, destLng),
    mapboxNavigation(originLat, originLng, destLat, destLng),
    hereNavigation(originLat, originLng, destLat, destLng),
  ])

  const valid = results
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(r => r && r.decodedPath?.length > 0 && r.steps?.length > 0)

  if (valid.length === 0) return buildDemoRoute()

  // Pick fastest route with best step data
  valid.sort((a, b) => {
    if (a.durationMin !== b.durationMin) return a.durationMin - b.durationMin
    if (b.steps.length !== a.steps.length) return b.steps.length - a.steps.length
    const priority = { google: 0, mapbox: 1, here: 2 }
    return (priority[a.source] ?? 9) - (priority[b.source] ?? 9)
  })

  return valid[0]
}

// Try Mapbox first, then HERE — for demo mode road-snapped routes
async function getMapboxOrHereRoute(originLat, originLng, destLat, destLng) {
  if (MAPBOX_TOKEN) {
    const route = await mapboxNavigation(originLat, originLng, destLat, destLng)
    if (route?.decodedPath?.length > 0 && route?.steps?.length > 0) return route
  }
  if (HERE_API_KEY) {
    const route = await hereNavigation(originLat, originLng, destLat, destLng)
    if (route?.decodedPath?.length > 0 && route?.steps?.length > 0) return route
  }
  return null
}

// ─── Public: convenience wrappers ───

export async function getDriverETA(driverLat, driverLng, destLat, destLng) {
  const result = await getDirections(driverLat, driverLng, destLat, destLng, 'driving')
  return { distKm: result.distanceKm, etaMin: result.durationMin }
}

export async function getDeliveryRoute(driverCoords, restaurantCoords, customerCoords) {
  const [toRestaurant, toCustomer] = await Promise.all([
    getDirections(driverCoords.lat, driverCoords.lng, restaurantCoords.lat, restaurantCoords.lng),
    getDirections(restaurantCoords.lat, restaurantCoords.lng, customerCoords.lat, customerCoords.lng),
  ])
  return {
    toRestaurant,
    toCustomer,
    totalMin: toRestaurant.durationMin + toCustomer.durationMin,
    totalKm: Math.round((toRestaurant.distanceKm + toCustomer.distanceKm) * 10) / 10,
  }
}

export async function getRideDistance(pickupLat, pickupLng, dropoffLat, dropoffLng) {
  return getDirections(pickupLat, pickupLng, dropoffLat, dropoffLng, 'driving')
}

// ─── Demo route ───

function buildDemoRoute() {
  const decodedPath = [
    { lat: -7.7956, lng: 110.3695 },
    { lat: -7.7950, lng: 110.3694 },
    { lat: -7.7943, lng: 110.3692 },
    { lat: -7.7935, lng: 110.3690 },
    { lat: -7.7928, lng: 110.3689 },
    { lat: -7.7920, lng: 110.3688 },
    { lat: -7.7912, lng: 110.3686 },
    { lat: -7.7905, lng: 110.3685 },
    { lat: -7.7898, lng: 110.3683 },
    { lat: -7.7892, lng: 110.3681 },
    { lat: -7.7886, lng: 110.3678 },
    { lat: -7.7884, lng: 110.3670 },
    { lat: -7.7882, lng: 110.3660 },
    { lat: -7.7880, lng: 110.3650 },
    { lat: -7.7878, lng: 110.3640 },
    { lat: -7.7875, lng: 110.3630 },
    { lat: -7.7872, lng: 110.3620 },
    { lat: -7.7868, lng: 110.3610 },
    { lat: -7.7864, lng: 110.3600 },
    { lat: -7.7860, lng: 110.3592 },
    { lat: -7.7855, lng: 110.3588 },
    { lat: -7.7848, lng: 110.3584 },
    { lat: -7.7842, lng: 110.3580 },
    { lat: -7.7836, lng: 110.3575 },
    { lat: -7.7830, lng: 110.3568 },
    { lat: -7.7828, lng: 110.3560 },
    { lat: -7.7826, lng: 110.3554 },
    { lat: -7.7825, lng: 110.3550 },
  ]

  const steps = [
    { instruction: 'Head north on Jl. Malioboro', maneuver: 'straight', distance: 780, distanceText: '780 m', duration: 120, durationText: '2 min', endLocation: { lat: -7.7886, lng: 110.3678 } },
    { instruction: 'Turn left onto Jl. AM Sangaji', maneuver: 'turn-left', distance: 120, distanceText: '120 m', duration: 20, durationText: '1 min', endLocation: { lat: -7.7884, lng: 110.3670 } },
    { instruction: 'Continue straight on Jl. AM Sangaji', maneuver: 'straight', distance: 830, distanceText: '830 m', duration: 130, durationText: '2 min', endLocation: { lat: -7.7860, lng: 110.3592 } },
    { instruction: 'Turn right onto Jl. Tentara Pelajar', maneuver: 'turn-right', distance: 100, distanceText: '100 m', duration: 15, durationText: '1 min', endLocation: { lat: -7.7855, lng: 110.3588 } },
    { instruction: 'Continue straight on Jl. Tentara Pelajar', maneuver: 'straight', distance: 350, distanceText: '350 m', duration: 65, durationText: '1 min', endLocation: { lat: -7.7830, lng: 110.3568 } },
    { instruction: 'Slight left — destination on your left', maneuver: 'turn-slight-left', distance: 200, distanceText: '200 m', duration: 40, durationText: '1 min', endLocation: { lat: -7.7825, lng: 110.3550 } },
  ]

  return {
    decodedPath, steps,
    distanceKm: 2.4, durationMin: 7,
    distanceText: '2.4 km', durationText: '7 min',
    isDemo: true, source: 'demo',
  }
}

// ─── Google polyline decoder ───

export function decodePolyline(encoded) {
  const points = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let shift = 0, result = 0, byte
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)

    shift = 0; result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}
