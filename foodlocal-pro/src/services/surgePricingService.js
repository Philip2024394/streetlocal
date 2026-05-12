/**
 * Surge Pricing Service — dynamic fare multiplier based on demand/supply.
 * Monitors active bookings vs available drivers per zone.
 * Indonesian market: surge capped at 2x by regulation.
 */
import { supabase } from '@/lib/supabase'

// Surge tiers (multiplier based on demand ratio)
const SURGE_TIERS = [
  { ratio: 0,   multiplier: 1.0, label: null },         // Normal
  { ratio: 1.5, multiplier: 1.2, label: 'Busy' },       // 1.5x more demand than supply
  { ratio: 2.0, multiplier: 1.5, label: 'High Demand' },
  { ratio: 3.0, multiplier: 1.8, label: 'Very Busy' },
  { ratio: 5.0, multiplier: 2.0, label: 'Peak' },       // Capped at 2x
]

// Cache surge per zone for 60 seconds
const surgeCache = {}
const CACHE_TTL = 60_000

/**
 * Get current surge multiplier for a location.
 * @param {number} lat
 * @param {number} lng
 * @param {string} vehicleType - 'bike_ride' | 'car_taxi'
 * @returns {Promise<{ multiplier: number, label: string|null }>}
 */
export async function getSurgeMultiplier(lat, lng, vehicleType = 'bike_ride') {
  const zoneKey = `${Math.round(lat * 10)}_${Math.round(lng * 10)}_${vehicleType}`

  // Check cache
  if (surgeCache[zoneKey] && Date.now() - surgeCache[zoneKey].ts < CACHE_TTL) {
    return surgeCache[zoneKey].data
  }

  // Demo mode — simulate surge based on time of day
  if (!supabase) {
    const hour = new Date().getHours()
    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20) || (hour >= 11 && hour <= 13)
    const tier = isPeak ? SURGE_TIERS[2] : SURGE_TIERS[0]
    const result = { multiplier: tier.multiplier, label: tier.label }
    surgeCache[zoneKey] = { data: result, ts: Date.now() }
    return result
  }

  try {
    // Count active bookings in this zone (pending + in_progress)
    const { count: demand } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress'])
      .eq('vehicle_type', vehicleType)

    // Count online, non-busy drivers in this zone
    const { count: supply } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_driver', true)
      .eq('driver_online', true)
      .eq('driver_busy', false)
      .eq('driver_type', vehicleType)

    const ratio = supply > 0 ? (demand ?? 0) / supply : 5
    const tier = [...SURGE_TIERS].reverse().find(t => ratio >= t.ratio) ?? SURGE_TIERS[0]
    const result = { multiplier: tier.multiplier, label: tier.label }

    surgeCache[zoneKey] = { data: result, ts: Date.now() }
    return result
  } catch {
    return { multiplier: 1.0, label: null }
  }
}

/**
 * Apply surge to a base fare.
 */
export function applySurge(baseFare, multiplier) {
  return Math.round(baseFare * multiplier)
}
