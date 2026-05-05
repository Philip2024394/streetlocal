/**
 * Seller opening hours helpers.
 * Hours format: { mon: { open: '09:00', close: '17:00' }, tue: ..., closed: false }
 * If a day has closed: true, seller is off that day.
 */

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Default hours — Mon-Sat 09:00-17:00, Sun closed
export const DEFAULT_HOURS = {
  mon: { open: '09:00', close: '17:00', closed: false },
  tue: { open: '09:00', close: '17:00', closed: false },
  wed: { open: '09:00', close: '17:00', closed: false },
  thu: { open: '09:00', close: '17:00', closed: false },
  fri: { open: '09:00', close: '17:00', closed: false },
  sat: { open: '09:00', close: '17:00', closed: false },
  sun: { open: null, close: null, closed: true },
}

/**
 * Parse "HH:MM" to minutes since midnight
 */
function parseTime(str) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  return h * 60 + (m || 0)
}

/**
 * Check if seller is currently open
 */
export function isSellerOpen(hours) {
  if (!hours) return true // no hours set = always open
  const now = new Date()
  const dayKey = DAYS[now.getDay()]
  const today = hours[dayKey]
  if (!today || today.closed) return false
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const openMins = parseTime(today.open)
  const closeMins = parseTime(today.close)
  if (openMins == null || closeMins == null) return false
  return nowMins >= openMins && nowMins < closeMins
}

/**
 * Get the next time the seller opens.
 * Returns { dayLabel, dayShort, time, date, diffMs } or null if always open.
 */
export function getNextOpenTime(hours) {
  if (!hours) return null
  const now = new Date()
  const nowDay = now.getDay()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  // Check up to 7 days ahead
  for (let offset = 0; offset < 7; offset++) {
    const checkDay = (nowDay + offset) % 7
    const dayKey = DAYS[checkDay]
    const day = hours[dayKey]
    if (!day || day.closed) continue

    const openMins = parseTime(day.open)
    if (openMins == null) continue

    // If it's today and we haven't passed opening time
    if (offset === 0 && nowMins < openMins) {
      const target = new Date(now)
      target.setHours(Math.floor(openMins / 60), openMins % 60, 0, 0)
      return {
        dayLabel: DAY_LABELS[checkDay],
        dayShort: DAY_SHORT[checkDay],
        time: day.open,
        date: target,
        diffMs: target - now,
      }
    }

    // Future day
    if (offset > 0) {
      const target = new Date(now)
      target.setDate(target.getDate() + offset)
      target.setHours(Math.floor(openMins / 60), openMins % 60, 0, 0)
      return {
        dayLabel: DAY_LABELS[checkDay],
        dayShort: DAY_SHORT[checkDay],
        time: day.open,
        date: target,
        diffMs: target - now,
      }
    }
  }
  return null
}

/**
 * Format a countdown from milliseconds to human-readable
 * e.g. "14h 23m" or "2d 6h" or "45m"
 */
export function formatCountdown(ms) {
  if (ms <= 0) return 'now'
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${mins % 60}m`
  return `${mins}m`
}

/**
 * Get current day status text
 * e.g. "Open · Closes at 17:00" or "Closed · Opens Mon 09:00"
 */
export function getSellerStatusText(hours) {
  if (!hours) return 'Always open'
  if (isSellerOpen(hours)) {
    const now = new Date()
    const dayKey = DAYS[now.getDay()]
    const today = hours[dayKey]
    return `Open · Closes at ${today.close}`
  }
  const next = getNextOpenTime(hours)
  if (!next) return 'Closed'
  return `Closed · Opens ${next.dayShort} ${next.time}`
}

export { DAYS, DAY_LABELS, DAY_SHORT }
