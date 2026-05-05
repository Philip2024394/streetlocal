/**
 * GPS Trace Recording Service
 * Records every driver's GPS trail while online/on-trip.
 * Data builds a road network over time — more accurate than Google for local streets.
 *
 * How it works:
 * - Driver goes online → startRecording(driverId)
 * - Every 3-5 seconds, addPoint() is called with lat/lng/speed/heading
 * - Points are batched in memory (50 points) then flushed to Supabase
 * - Driver goes offline or trip ends → stopRecording() flushes remaining
 * - Each trace has a session ID, driver ID, vehicle type, and timestamps
 *
 * Future use:
 * - Overlay traces on self-hosted OSM tiles to fill road gaps
 * - Detect new roads (gang/alleyways) that aren't on any map
 * - Calculate real average speeds per road segment
 * - Identify one-way streets, blocked roads, shortcuts
 */
import { supabase } from '@/lib/supabase'

const BATCH_SIZE = 50          // flush every 50 points
const MIN_DISTANCE_M = 5       // ignore points closer than 5 meters (noise filter)
const LOCAL_BUFFER_KEY = 'indoo_gps_trace_buffer'

let currentSession = null
let pointBuffer = []
let lastPoint = null

/**
 * Calculate distance between two points in meters (Haversine)
 */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Start recording a new GPS trace session
 */
export function startRecording(driverId, vehicleType = 'bike') {
  currentSession = {
    id: `trace-${Date.now().toString(36)}`,
    driver_id: driverId,
    vehicle_type: vehicleType,
    started_at: new Date().toISOString(),
    city: null,
  }
  pointBuffer = []
  lastPoint = null

  // Restore any unflushed points from previous crash
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_BUFFER_KEY) || '[]')
    if (saved.length > 0) {
      flushPoints(saved)
      localStorage.removeItem(LOCAL_BUFFER_KEY)
    }
  } catch {}

  return currentSession.id
}

/**
 * Add a GPS point to the current trace
 * Call this every 3-5 seconds from the driver's location watcher
 */
export function addPoint(lat, lng, speed = null, heading = null, accuracy = null) {
  if (!currentSession) return

  // Noise filter — skip if too close to last point
  if (lastPoint) {
    const dist = distanceMeters(lastPoint.lat, lastPoint.lng, lat, lng)
    if (dist < MIN_DISTANCE_M) return
  }

  const point = {
    session_id: currentSession.id,
    driver_id: currentSession.driver_id,
    lat,
    lng,
    speed_kmh: speed != null ? Math.round(speed * 3.6) : null, // m/s → km/h
    heading: heading != null ? Math.round(heading) : null,
    accuracy_m: accuracy != null ? Math.round(accuracy) : null,
    ts: new Date().toISOString(),
  }

  pointBuffer.push(point)
  lastPoint = { lat, lng }

  // Save to localStorage as crash protection
  try {
    localStorage.setItem(LOCAL_BUFFER_KEY, JSON.stringify(pointBuffer))
  } catch {}

  // Flush when batch is full
  if (pointBuffer.length >= BATCH_SIZE) {
    const batch = [...pointBuffer]
    pointBuffer = []
    localStorage.removeItem(LOCAL_BUFFER_KEY)
    flushPoints(batch)
  }
}

/**
 * Stop recording and flush remaining points
 */
export function stopRecording() {
  if (!currentSession) return

  if (pointBuffer.length > 0) {
    flushPoints([...pointBuffer])
    pointBuffer = []
  }

  // Save session metadata
  const session = {
    ...currentSession,
    ended_at: new Date().toISOString(),
    point_count: 0, // will be updated from DB
  }
  saveSession(session)

  currentSession = null
  lastPoint = null
  localStorage.removeItem(LOCAL_BUFFER_KEY)
}

/**
 * Flush a batch of points to Supabase (or localStorage fallback)
 */
async function flushPoints(points) {
  if (!points.length) return

  if (!supabase) {
    // Demo mode — save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('indoo_gps_traces') || '[]')
      existing.push(...points)
      // Keep last 10,000 points max in localStorage
      if (existing.length > 10000) existing.splice(0, existing.length - 10000)
      localStorage.setItem('indoo_gps_traces', JSON.stringify(existing))
    } catch {}
    return
  }

  try {
    await supabase.from('gps_traces').insert(points)
  } catch {
    // Network failure — save locally, retry on next flush
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_BUFFER_KEY) || '[]')
      existing.push(...points)
      localStorage.setItem(LOCAL_BUFFER_KEY, JSON.stringify(existing))
    } catch {}
  }
}

/**
 * Save session metadata
 */
async function saveSession(session) {
  if (!supabase) {
    try {
      const sessions = JSON.parse(localStorage.getItem('indoo_gps_sessions') || '[]')
      sessions.unshift(session)
      if (sessions.length > 100) sessions.pop()
      localStorage.setItem('indoo_gps_sessions', JSON.stringify(sessions))
    } catch {}
    return
  }

  try {
    await supabase.from('gps_trace_sessions').insert({
      id: session.id,
      driver_id: session.driver_id,
      vehicle_type: session.vehicle_type,
      started_at: session.started_at,
      ended_at: session.ended_at,
      city: session.city,
    })
  } catch {}
}

/**
 * Get trace statistics (for admin dashboard)
 */
export function getTraceStats() {
  const traces = JSON.parse(localStorage.getItem('indoo_gps_traces') || '[]')
  const sessions = JSON.parse(localStorage.getItem('indoo_gps_sessions') || '[]')

  // Calculate unique road segments (simplified — grid cells covered)
  const cells = new Set()
  traces.forEach(p => {
    // Round to ~100m grid cells
    const cellLat = Math.round(p.lat * 1000) / 1000
    const cellLng = Math.round(p.lng * 1000) / 1000
    cells.add(`${cellLat},${cellLng}`)
  })

  return {
    totalPoints: traces.length,
    totalSessions: sessions.length,
    uniqueRoadCells: cells.size,
    coverageKm2: Math.round(cells.size * 0.01 * 100) / 100, // rough estimate
    drivers: new Set(traces.map(t => t.driver_id)).size,
  }
}
