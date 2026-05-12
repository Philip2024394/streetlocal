/**
 * Haversine distance between two lat/lng points, returns kilometres.
 * @param {number} lat1 @param {number} lng1
 * @param {number} lat2 @param {number} lng2
 * @returns {number} distance in km
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180)
             * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

/**
 * Privacy-safe distance formatting.
 *
 * IMPORTANT: We never display distances below 2 km to other users.
 * This prevents location triangulation — a user cannot track another
 * profile's exact position by watching the distance count down.
 * Venue names and coordinates are also stripped before reaching the client.
 */

const FLOOR_KM = 5

/**
 * Format a distance value for display.
 * Anything under 5 km shows "Nearby" — prevents location triangulation.
 *
 * @param {number|null|undefined} km - raw distance in kilometres
 * @returns {string|null} display string, or null if no distance data
 */
export function formatDistance(km) {
  if (km == null) return null
  if (km < FLOOR_KM) return 'Nearby'
  if (km < 10)       return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/**
 * Walking-time estimate, floored to 2 km equivalent (~24 min).
 * Below the floor we return null so callers can hide the walk time entirely.
 *
 * @param {number|null|undefined} km
 * @returns {number|null} minutes, or null if below floor or no data
 */
export function walkMinutes(km) {
  if (km == null || km < FLOOR_KM) return null
  return Math.max(1, Math.round(km / 0.083))
}
