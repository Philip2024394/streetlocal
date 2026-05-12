/**
 * Location drift — inactive users' pins drift away from busy areas.
 * After 30 days without login the pin starts to drift.
 * On login the pin snaps back to real location instantly.
 *
 * Uses userId as a deterministic seed so the drift is consistent
 * across renders (same user always drifts the same direction).
 */

const DRIFT_START_DAYS = 30
const DRIFT_FULL_DAYS  = 90   // fully drifted after 90 days
const MAX_DRIFT_KM     = 18   // maximum drift distance in km (≈ 0.16 degrees lat/lng)
const KM_PER_DEGREE    = 111

// Simple deterministic hash from a string → number 0–1
function seededRandom(seed, offset = 0) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  h = Math.imul(h + offset, 0x9e3779b9) | 0
  return ((h >>> 0) % 10000) / 10000
}

/**
 * @param {string} userId
 * @param {number} lat
 * @param {number} lng
 * @param {number} lastActiveAt — unix ms timestamp of last login
 * @returns {{ lat: number, lng: number, drifted: boolean }}
 */
export function getDriftedCoords(userId, lat, lng, lastActiveAt) {
  if (!lastActiveAt) return { lat, lng, drifted: false }

  const daysSince = (Date.now() - lastActiveAt) / (1000 * 60 * 60 * 24)

  if (daysSince < DRIFT_START_DAYS) return { lat, lng, drifted: false }

  // 0→1 as days go from DRIFT_START to DRIFT_FULL
  const driftFactor = Math.min((daysSince - DRIFT_START_DAYS) / (DRIFT_FULL_DAYS - DRIFT_START_DAYS), 1)

  const driftKm    = MAX_DRIFT_KM * driftFactor
  const driftDeg   = driftKm / KM_PER_DEGREE

  // Deterministic direction based on userId
  const angle = seededRandom(userId, 1) * Math.PI * 2
  const latOff = Math.sin(angle) * driftDeg
  const lngOff = Math.cos(angle) * driftDeg

  return {
    lat: lat + latOff,
    lng: lng + lngOff,
    drifted: true,
  }
}

/**
 * Apply drift to an array of session objects.
 * Each session needs: userId, lat, lng, lastActiveAt
 */
export function applyDriftToSessions(sessions) {
  return sessions.map(s => {
    if (!s.lat || !s.lng) return s
    const { lat, lng, drifted } = getDriftedCoords(s.userId, s.lat, s.lng, s.lastActiveAt)
    return { ...s, lat, lng, drifted }
  })
}
