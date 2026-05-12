import { supabase } from '@/lib/supabase'
import { haversineKm } from '@/utils/distance'
import { getDriverETA } from '@/utils/googleDirections'

// ── Demo fallback drivers ─────────────────────────────────────────────────────
export const DEMO_DRIVERS = [
  { id: 'd1', display_name: 'Budi Santoso', driver_age: 28, driver_type: 'bike_ride', driver_online: true, driver_busy: false, rating: 4.9, total_trips: 342, phone: '6281234567890', vehicle_model: 'Honda Vario 125', vehicle_year: 2022, vehicle_color: 'Black',  plate_prefix: 'AB12', accepts_rides: true,  accepts_packages: true,  driver_last_location: { lat: -7.797, lng: 110.370 } },
  { id: 'd2', display_name: 'Ani Rahayu',   driver_age: 24, driver_type: 'bike_ride', driver_online: true, driver_busy: false, rating: 4.7, total_trips: 178, phone: '6281234567891', vehicle_model: 'Yamaha NMAX',     vehicle_year: 2021, vehicle_color: 'Blue',   plate_prefix: 'AB34', accepts_rides: true,  accepts_packages: false, driver_last_location: { lat: -7.801, lng: 110.365 } },
  { id: 'd3', display_name: 'Citra Dewi',   driver_age: 31, driver_type: 'car_taxi',  driver_online: true, driver_busy: false, rating: 4.8, total_trips: 521, phone: '6281234567892', vehicle_model: 'Toyota Avanza',   vehicle_year: 2020, vehicle_color: 'White',  plate_prefix: 'AB56', accepts_rides: true,  accepts_packages: true,  driver_last_location: { lat: -7.793, lng: 110.375 } },
  { id: 'd4', display_name: 'Hendra Putra', driver_age: 35, driver_type: 'bike_ride', driver_online: true, driver_busy: false, rating: 4.6, total_trips: 89,  phone: '6281234567893', vehicle_model: 'Honda Beat',      vehicle_year: 2023, vehicle_color: 'Red',    plate_prefix: 'AB78', accepts_rides: false, accepts_packages: true,  driver_last_location: { lat: -7.805, lng: 110.358 } },
  { id: 'd5', display_name: 'Sari Wulan',   driver_age: 27, driver_type: 'car_taxi',  driver_online: true, driver_busy: false, rating: 4.9, total_trips: 634, phone: '6281234567894', vehicle_model: 'Daihatsu Xenia',  vehicle_year: 2021, vehicle_color: 'Silver', plate_prefix: 'AB90', accepts_rides: true,  accepts_packages: true,  driver_last_location: { lat: -7.789, lng: 110.381 } },
]

// ── Set driver busy state (explicit booking or auto speed detection) ──────────
export async function setDriverBusy(driverId, busy, source = 'booking') {
  if (!supabase) return
  await supabase.from('profiles').update({
    driver_busy:      busy,
    driver_auto_busy: source === 'auto' ? busy : false,
  }).eq('id', driverId)
}

export async function setDriverSpeedKmh(driverId, speedKmh) {
  if (!supabase) return
  await supabase.from('profiles').update({ driver_speed_kmh: Math.round(speedKmh) }).eq('id', driverId)
}

// ── Nearby drivers ────────────────────────────────────────────────────────────
export async function fetchNearbyDrivers(userLat, userLng, driverType, excludeIds = []) {
  let drivers = DEMO_DRIVERS.filter(d => d.driver_type === driverType && !excludeIds.includes(d.id))

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, driver_age, driver_type, driver_online, driver_busy, driver_auto_busy, driver_speed_kmh, driver_last_location, phone, rating, total_trips, vehicle_model, vehicle_year, vehicle_color, plate_prefix, cancellation_count')
      .eq('is_driver', true)
      .eq('driver_online', true)
      .eq('driver_type', driverType)
      .not('id', 'in', excludeIds.length ? `(${excludeIds.join(',')})` : '()')
      .limit(12)
    if (data?.length) drivers = data
  }

  // Calculate real ETA via Google Directions for each driver
  const withETA = await Promise.all(
    drivers.map(async d => {
      const loc = d.driver_last_location
      if (userLat && userLng && loc?.lat && loc?.lng) {
        const { distKm, etaMin } = await getDriverETA(loc.lat, loc.lng, userLat, userLng)
        return { ...d, distKm, etaMin }
      }
      // Fallback for drivers without location
      const distKm = Math.round((Math.random() * 1.8 + 0.3) * 10) / 10
      return { ...d, distKm, etaMin: Math.max(1, Math.round(distKm * 3)) }
    })
  )

  // Sort: available first, then fewest cancellations, then closest
  return withETA.sort((a, b) => {
    if (a.driver_busy !== b.driver_busy) return a.driver_busy ? 1 : -1
    const aCancels = a.cancellation_count ?? 0
    const bCancels = b.cancellation_count ?? 0
    if (aCancels !== bCancels) return aCancels - bCancels
    return a.distKm - b.distKm
  })
    .slice(0, 8)
}

// ── Driver online/offline ─────────────────────────────────────────────────────
export async function setDriverOnline(userId, online, coords = null) {
  // Start/stop GPS trace recording
  try {
    if (online) {
      const { startRecording } = await import('@/services/gpsTraceService')
      startRecording(userId, 'bike')
    } else {
      const { stopRecording } = await import('@/services/gpsTraceService')
      stopRecording()
    }
  } catch {}

  if (!supabase) return
  const update = {
    driver_online: online,
    ...(online && coords ? {
      driver_last_location:    { lat: coords.lat, lng: coords.lng },
      driver_last_location_at: new Date().toISOString(),
    } : {}),
  }
  await supabase.from('profiles').update(update).eq('id', userId)
}

export async function updateDriverLocation(userId, coords) {
  // Record GPS trace point for road mapping
  try {
    const { addPoint } = await import('@/services/gpsTraceService')
    addPoint(coords.lat, coords.lng, coords.speed ?? null, coords.heading ?? null, coords.accuracy ?? null)
  } catch {}

  if (!supabase) return
  await supabase.from('profiles').update({
    driver_last_location:    { lat: coords.lat, lng: coords.lng },
    driver_last_location_at: new Date().toISOString(),
  }).eq('id', userId)
}

export async function getDriverOnlineStatus(userId) {
  if (!supabase) return false
  const { data } = await supabase
    .from('profiles')
    .select('driver_online')
    .eq('id', userId)
    .maybeSingle()
  return data?.driver_online ?? false
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export async function createBooking({ userId, driverId, pickupAddress, dropoffAddress, pickupCoords, dropoffCoords, fare, distanceKm, timeoutSeconds = 45 }) {
  const id        = `BOOK_${Date.now()}`
  const expiresAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString()
  const booking   = {
    id,
    user_id:          userId,
    driver_id:        driverId,
    status:           'pending',
    pickup_location:  pickupAddress,
    dropoff_location: dropoffAddress,
    pickup_coords:    pickupCoords  ?? null,
    dropoff_coords:   dropoffCoords ?? null,
    fare,
    distance_km:      distanceKm   ?? null,
    created_at:       new Date().toISOString(),
    expires_at:       expiresAt,
  }
  if (supabase) {
    const { error } = await supabase.from('bookings').insert(booking)
    if (error) console.warn('Booking insert error:', error.message)
    // Mark driver as explicitly busy
    await supabase.from('profiles').update({ driver_busy: true, driver_auto_busy: false }).eq('id', driverId)
  }
  return booking
}

export async function expireBooking(bookingId) {
  if (!supabase) return
  await supabase.from('bookings').update({ status: 'expired' }).eq('id', bookingId)
}

export async function markBookingStarted(bookingId) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'accepted', started_at: new Date().toISOString() })
    .eq('id', bookingId)
}

export async function incrementDriverTrips(driverId) {
  if (!supabase) return
  await supabase.rpc('increment_driver_trips', { p_driver_id: driverId })
}

export async function completeBooking(bookingId, driverId = null) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', bookingId)
  if (driverId) {
    await supabase.from('profiles').update({ driver_busy: false, driver_auto_busy: false }).eq('id', driverId)
  }
}

export async function cancelBooking(bookingId, reason = '', driverId = null) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'cancelled', cancel_reason: reason, completed_at: new Date().toISOString() })
    .eq('id', bookingId)
  if (driverId) {
    await supabase.from('profiles').update({ driver_busy: false, driver_auto_busy: false }).eq('id', driverId)
  }
}

// ── Driver-side booking actions ───────────────────────────────────────────────
export async function acceptBooking(bookingId, driverId) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', bookingId)
  await supabase.from('profiles')
    .update({ driver_busy: true, driver_auto_busy: false })
    .eq('id', driverId)
}

export async function declineBooking(bookingId, driverId) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'cancelled', cancel_reason: 'Driver declined' })
    .eq('id', bookingId)
  await supabase.from('profiles')
    .update({ driver_busy: false, driver_auto_busy: false })
    .eq('id', driverId)
}

export async function driverMarkArrived(bookingId) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ driver_arrived_at: new Date().toISOString() })
    .eq('id', bookingId)
}

export async function driverStartRide(bookingId) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', bookingId)
}

export async function driverCompleteRide(bookingId, driverId) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', bookingId)
  await supabase.from('profiles')
    .update({ driver_busy: false, driver_auto_busy: false })
    .eq('id', driverId)
  await supabase.rpc('increment_driver_trips', { p_driver_id: driverId }).catch(() => {})
}

// ── Realtime booking status subscription (passenger side) ────────────────────
export function subscribeToBooking(bookingId, onChange) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`booking:${bookingId}`)
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'bookings',
      filter: `id=eq.${bookingId}`,
    }, payload => onChange(payload.new))
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// Poll for new pending booking assigned to this driver
export async function fetchDriverPendingBooking(driverId) {
  if (!supabase) return null
  const { data } = await supabase
    .from('bookings')
    .select('id, pickup_location, dropoff_location, fare, distance_km, user_id, created_at, expires_at, status, pickup_coords, dropoff_coords, passenger:profiles!user_id(display_name, photo_url, rating)')
    .eq('driver_id', driverId)
    .in('status', ['pending', 'accepted', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

// Driver trip history + earnings
export async function fetchDriverTripHistory(driverId, limit = 20) {
  if (!supabase) return []
  const { data } = await supabase
    .from('bookings')
    .select('id, created_at, pickup_location, dropoff_location, fare, status, service_type, passenger:profiles!user_id(display_name)')
    .eq('driver_id', driverId)
    .in('status', ['completed', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function submitDriverReview({ bookingId, driverId, userId, stars, comment = '' }) {
  if (!supabase) return
  await supabase.from('driver_reviews').insert({
    booking_id:  bookingId,
    driver_id:   driverId,
    user_id:     userId,
    stars,
    comment,
    created_at:  new Date().toISOString(),
  })
  // Recalculate driver's average rating
  const { data } = await supabase
    .from('driver_reviews')
    .select('stars')
    .eq('driver_id', driverId)
  if (data?.length) {
    const avg = data.reduce((s, r) => s + r.stars, 0) / data.length
    await supabase.from('profiles')
      .update({ rating: Math.round(avg * 10) / 10 })
      .eq('id', driverId)
  }
}
