/**
 * Offline buffer for driver GPS locations.
 * Stores unsent updates locally and batch-uploads on reconnect.
 * Prevents "driver teleporting" on the customer's tracking view.
 */

const BUFFER_KEY = 'indoo_gps_buffer'
const MAX_BUFFER = 60 // max stored locations

/**
 * Add a GPS location to the local buffer.
 */
export function bufferLocation(driverId, lat, lng, heading, speed) {
  try {
    const buffer = JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]')
    buffer.push({
      driver_id: driverId,
      lat, lng, heading, speed,
      timestamp: Date.now(),
    })
    // Keep only the last MAX_BUFFER entries
    if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER)
    localStorage.setItem(BUFFER_KEY, JSON.stringify(buffer))
  } catch { /* localStorage full or unavailable */ }
}

/**
 * Get all buffered locations and clear the buffer.
 * Call this on reconnect to batch-upload missed updates.
 */
export function flushBuffer() {
  try {
    const buffer = JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]')
    localStorage.removeItem(BUFFER_KEY)
    return buffer
  } catch {
    return []
  }
}

/**
 * Get buffer size (for debugging).
 */
export function getBufferSize() {
  try {
    return JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]').length
  } catch {
    return 0
  }
}

/**
 * Notification TTL filter — removes expired notifications.
 * Call before displaying notification list.
 *
 * @param {Array} notifications - array of notification objects with created_at and type
 * @returns {Array} filtered notifications
 */
export function filterExpiredNotifications(notifications) {
  const now = Date.now()

  // TTL per notification type (milliseconds)
  const TTL = {
    ride_request: 60 * 1000,       // 60 seconds
    food_order: 5 * 60 * 1000,     // 5 minutes
    chat_message: 24 * 60 * 60 * 1000, // 24 hours
    payment: 7 * 24 * 60 * 60 * 1000,  // 7 days
    default: 7 * 24 * 60 * 60 * 1000,  // 7 days
  }

  return notifications.filter(n => {
    const age = now - new Date(n.created_at).getTime()
    const ttl = TTL[n.type] ?? TTL.default
    return age < ttl
  })
}
