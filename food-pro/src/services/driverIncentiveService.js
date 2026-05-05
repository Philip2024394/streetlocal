/**
 * Driver Incentive & Goals Service.
 * Weekly/daily goals, bonuses, favourite drivers, heat maps, tipping.
 */
import { supabase } from '@/lib/supabase'

// ── Driver Goals ────────────────────────────────────────────────────────────

const DEFAULT_GOALS = {
  daily_trips: 10,
  weekly_trips: 50,
  daily_bonus: 25000,   // Rp 25k bonus for hitting daily target
  weekly_bonus: 150000,  // Rp 150k bonus for hitting weekly target
}

/**
 * Get driver's current goals and progress.
 */
export async function getDriverGoals(driverId) {
  if (!supabase) {
    return {
      ...DEFAULT_GOALS,
      tripsToday: 3,
      tripsThisWeek: 18,
      dailyComplete: false,
      weeklyComplete: false,
    }
  }

  const { data: stats } = await supabase
    .from('driver_stats')
    .select('trips_today, trips_this_week')
    .eq('driver_id', driverId)
    .single()

  const tripsToday = stats?.trips_today ?? 0
  const tripsThisWeek = stats?.trips_this_week ?? 0

  return {
    ...DEFAULT_GOALS,
    tripsToday,
    tripsThisWeek,
    dailyComplete: tripsToday >= DEFAULT_GOALS.daily_trips,
    weeklyComplete: tripsThisWeek >= DEFAULT_GOALS.weekly_trips,
  }
}

// ── Favourite Drivers ───────────────────────────────────────────────────────

/**
 * Add a driver to user's favourites.
 */
export async function addFavouriteDriver(userId, driverId) {
  if (!supabase) return
  await supabase.from('favourite_drivers').upsert({
    user_id: userId,
    driver_id: driverId,
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id,driver_id' })
}

/**
 * Remove a driver from favourites.
 */
export async function removeFavouriteDriver(userId, driverId) {
  if (!supabase) return
  await supabase.from('favourite_drivers').delete()
    .eq('user_id', userId).eq('driver_id', driverId)
}

/**
 * Get user's favourite drivers.
 */
export async function getFavouriteDrivers(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('favourite_drivers')
    .select('driver_id, profiles!driver_id(display_name, rating, vehicle_model, driver_last_location)')
    .eq('user_id', userId)
  return data ?? []
}

// ── Demand Heat Map ─────────────────────────────────────────────────────────

/**
 * Get demand hotspots for driver heat map.
 * Returns areas with high booking activity in the last hour.
 */
export async function getDemandHotspots() {
  if (!supabase) {
    // Demo hotspots for Yogyakarta
    return [
      { lat: -7.7928, lng: 110.3657, intensity: 0.9, label: 'Malioboro' },
      { lat: -7.7822, lng: 110.4021, intensity: 0.7, label: 'Ambarukmo Plaza' },
      { lat: -7.7745, lng: 110.3802, intensity: 0.6, label: 'UGM Area' },
      { lat: -7.8012, lng: 110.3678, intensity: 0.5, label: 'Prawirotaman' },
      { lat: -7.7601, lng: 110.3831, intensity: 0.4, label: 'Seturan' },
    ]
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('bookings')
    .select('pickup_coords')
    .gte('created_at', oneHourAgo)
    .not('pickup_coords', 'is', null)

  if (!data?.length) return []

  // Cluster nearby bookings
  const clusters = clusterPoints(data.map(b => b.pickup_coords), 0.005) // ~500m clusters
  return clusters.map(c => ({
    lat: c.lat,
    lng: c.lng,
    intensity: Math.min(c.count / 10, 1),
    label: `${c.count} orders`,
  }))
}

function clusterPoints(points, threshold) {
  const clusters = []
  const used = new Set()
  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue
    const cluster = { lat: points[i].lat, lng: points[i].lng, count: 1 }
    used.add(i)
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue
      if (Math.abs(points[j].lat - cluster.lat) < threshold && Math.abs(points[j].lng - cluster.lng) < threshold) {
        cluster.lat = (cluster.lat * cluster.count + points[j].lat) / (cluster.count + 1)
        cluster.lng = (cluster.lng * cluster.count + points[j].lng) / (cluster.count + 1)
        cluster.count++
        used.add(j)
      }
    }
    if (cluster.count >= 2) clusters.push(cluster)
  }
  return clusters.sort((a, b) => b.count - a.count).slice(0, 10)
}

// ── Tipping ─────────────────────────────────────────────────────────────────

const TIP_OPTIONS = [
  { amount: 2000,  label: 'Rp 2k' },
  { amount: 5000,  label: 'Rp 5k' },
  { amount: 10000, label: 'Rp 10k' },
  { amount: 0,     label: 'Custom' },
]

export { TIP_OPTIONS }

/**
 * Send a tip to a driver.
 */
export async function sendTip(userId, driverId, bookingId, amount) {
  if (!supabase || amount <= 0) return
  await supabase.from('driver_tips').insert({
    user_id: userId,
    driver_id: driverId,
    booking_id: bookingId,
    amount,
    created_at: new Date().toISOString(),
  })
}

// ── Cancellation Fees ───────────────────────────────────────────────────────

const CANCEL_FREE_WINDOW = 2 * 60 * 1000 // 2 minutes free cancellation
const CANCEL_FEE_BIKE = 5000  // Rp 5k
const CANCEL_FEE_CAR = 10000  // Rp 10k

/**
 * Calculate cancellation fee based on timing and vehicle type.
 */
export function getCancellationFee(bookingCreatedAt, vehicleType) {
  const elapsed = Date.now() - new Date(bookingCreatedAt).getTime()
  if (elapsed < CANCEL_FREE_WINDOW) return 0 // Free within 2 minutes
  return vehicleType === 'car_taxi' ? CANCEL_FEE_CAR : CANCEL_FEE_BIKE
}

// ── Multi-stop Routes ───────────────────────────────────────────────────────

/**
 * Calculate fare for multi-stop route.
 * @param {Array<{lat, lng}>} stops - array of waypoints
 * @param {number} baseFarePerKm
 * @param {number} baseFare
 * @returns {Promise<{ totalKm: number, totalFare: number, legs: Array }>}
 */
export async function calculateMultiStopFare(stops, baseFarePerKm, baseFare) {
  if (stops.length < 2) return { totalKm: 0, totalFare: baseFare, legs: [] }

  const { getDirections } = await import('@/utils/googleDirections')
  const legs = []
  let totalKm = 0

  for (let i = 0; i < stops.length - 1; i++) {
    const result = await getDirections(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng)
    legs.push({
      from: stops[i],
      to: stops[i + 1],
      distanceKm: result.distanceKm,
      durationMin: result.durationMin,
    })
    totalKm += result.distanceKm
  }

  const totalFare = Math.round(baseFare + totalKm * baseFarePerKm)
  return { totalKm: Math.round(totalKm * 10) / 10, totalFare, legs }
}

// ── Reorder Previous Food Orders ────────────────────────────────────────────

/**
 * Get user's recent food orders for quick reorder.
 */
export async function getReorderHistory(userId, limit = 5) {
  if (!supabase) return []
  const { data } = await supabase
    .from('food_orders')
    .select('id, restaurant, items, total, created_at')
    .eq('sender_id', userId)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
