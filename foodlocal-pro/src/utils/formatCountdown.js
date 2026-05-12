/**
 * Returns a short human-readable string for time remaining until expiresAtMs.
 * e.g. "2h 30m", "45m", "open" if no expiry
 * Returns null if already expired.
 */
export function formatCountdown(expiresAtMs) {
  if (!expiresAtMs) return null
  const remaining = expiresAtMs - Date.now()
  if (remaining <= 0) return null
  const totalMins = Math.floor(remaining / 60000)
  const hours = Math.floor(totalMins / 60)
  const mins  = totalMins % 60
  if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim()
  return `${mins}m`
}
