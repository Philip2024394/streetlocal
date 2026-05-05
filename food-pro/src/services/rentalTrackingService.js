/**
 * Rental Tracking Service
 * - Tracks renter's phone GPS during active rental
 * - Geofence alerts when vehicle leaves defined area
 * - Booking request system (Supabase + localStorage)
 * - Price calculator
 */
import { supabase } from '@/lib/supabase'

const BOOKINGS_KEY = 'indoo_rental_bookings'
const TRACKING_KEY = 'indoo_rental_tracking'

// ── Price Calculator ─────────────────────────────────────────────────────────

export function calculateRentalPrice({ priceDaily, priceWeekly, priceMonthly, driverDaily, withDriver }, days, addDriver) {
  let total = 0
  let breakdown = []
  let remaining = days

  // Apply monthly rate first if available
  if (priceMonthly && remaining >= 30) {
    const months = Math.floor(remaining / 30)
    total += months * priceMonthly
    breakdown.push({ label: `${months} month${months > 1 ? 's' : ''}`, amount: months * priceMonthly })
    remaining -= months * 30
  }

  // Apply weekly rate if available
  if (priceWeekly && remaining >= 7) {
    const weeks = Math.floor(remaining / 7)
    total += weeks * priceWeekly
    breakdown.push({ label: `${weeks} week${weeks > 1 ? 's' : ''}`, amount: weeks * priceWeekly })
    remaining -= weeks * 7
  }

  // Remaining days at daily rate
  if (remaining > 0) {
    total += remaining * priceDaily
    breakdown.push({ label: `${remaining} day${remaining > 1 ? 's' : ''}`, amount: remaining * priceDaily })
  }

  // Daily rate without discounts for comparison
  const fullDaily = days * priceDaily
  const saved = fullDaily - total

  // Driver cost
  let driverTotal = 0
  if (addDriver && withDriver && driverDaily) {
    driverTotal = days * driverDaily
    breakdown.push({ label: `Driver (${days} days)`, amount: driverTotal })
  }

  return {
    days,
    subtotal: total,
    driverTotal,
    total: total + driverTotal,
    fullDailyRate: fullDaily,
    saved,
    breakdown,
  }
}

// ── Booking Requests ─────────────────────────────────────────────────────────

function loadBookings() {
  try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [] }
  catch { return [] }
}

function saveBookings(data) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(data))
}

export async function createBookingRequest({ listingId, vehicleName, renterName, renterPhone, startDate, endDate, days, total, addDriver, ownerId }) {
  const commission = Math.round(total * 0.10)
  const booking = {
    id: 'bk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    listingId,
    vehicleName,
    renterName: renterName || 'User',
    renterPhone: renterPhone || '',
    startDate,
    endDate,
    days,
    total,
    addDriver,
    status: 'pending',
    trackingActive: false,
    commission,
    createdAt: new Date().toISOString(),
  }

  // localStorage (always, as cache)
  const bookings = loadBookings()
  bookings.unshift(booking)
  saveBookings(bookings)

  // Supabase
  if (supabase) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const renterId = userData?.user?.id
      await supabase.from('rental_bookings').insert({
        listing_ref: listingId,
        listing_title: vehicleName,
        renter_id: renterId,
        renter_name: renterName || 'User',
        renter_phone: renterPhone || '',
        owner_id: ownerId || null,
        start_date: startDate,
        end_date: endDate,
        days,
        total,
        commission,
        add_driver: addDriver || false,
        status: 'pending',
      })
    } catch (e) {
      console.warn('Supabase booking insert error:', e)
    }
  }

  return booking
}

export function getBookings() { return loadBookings() }

/** Fetch bookings — Supabase first, localStorage fallback */
export async function getMyBookings() {
  if (supabase) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (userId) {
        const { data, error } = await supabase
          .from('rental_bookings')
          .select('*')
          .eq('renter_id', userId)
          .order('created_at', { ascending: false })
        if (!error && data?.length) return data
      }
    } catch {}
  }
  return loadBookings()
}

/** Fetch bookings for a listing owner */
export async function getBookingsForOwner(ownerId) {
  if (!supabase || !ownerId) return []
  try {
    const { data, error } = await supabase
      .from('rental_bookings')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
    if (!error) return data || []
  } catch {}
  return []
}

export function updateBookingStatus(id, status) {
  const bookings = loadBookings()
  const idx = bookings.findIndex(b => b.id === id)
  if (idx === -1) return null
  bookings[idx].status = status
  if (status === 'active') bookings[idx].trackingActive = true
  if (status === 'completed') bookings[idx].trackingActive = false
  saveBookings(bookings)
  return bookings[idx]
}

// ── Live GPS Tracking ────────────────────────────────────────────────────────

function loadTracking() {
  try { return JSON.parse(localStorage.getItem(TRACKING_KEY)) || {} }
  catch { return {} }
}

function saveTracking(data) {
  localStorage.setItem(TRACKING_KEY, JSON.stringify(data))
}

/** Record a GPS point for a booking */
export function recordLocation(bookingId, lat, lng) {
  const tracking = loadTracking()
  if (!tracking[bookingId]) tracking[bookingId] = []
  tracking[bookingId].push({
    lat, lng,
    timestamp: new Date().toISOString(),
  })
  // Keep last 500 points
  if (tracking[bookingId].length > 500) {
    tracking[bookingId] = tracking[bookingId].slice(-500)
  }
  saveTracking(tracking)
}

/** Get tracking history for a booking */
export function getTrackingHistory(bookingId) {
  const tracking = loadTracking()
  return tracking[bookingId] || []
}

/** Get latest location for a booking */
export function getLatestLocation(bookingId) {
  const history = getTrackingHistory(bookingId)
  return history.length > 0 ? history[history.length - 1] : null
}

// ── Geofence ─────────────────────────────────────────────────────────────────

// Yogyakarta city center
const CITY_CENTER = { lat: -7.7928, lng: 110.3653 }
const DEFAULT_GEOFENCE_KM = 30

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

/** Check if location is within geofence */
export function isWithinGeofence(lat, lng, radiusKm = DEFAULT_GEOFENCE_KM) {
  const dist = haversineKm(CITY_CENTER.lat, CITY_CENTER.lng, lat, lng)
  return { within: dist <= radiusKm, distanceKm: Math.round(dist * 10) / 10, radiusKm }
}

// ── Reviews ──────────────────────────────────────────────────────────────────

const REVIEWS_KEY = 'indoo_rental_reviews'

function loadReviews() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [] }
  catch { return [] }
}

function saveReviews(data) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(data))
}

export function submitReview({ listingId, vehicleName, renterName, rating, comment }) {
  const reviews = loadReviews()
  const review = {
    id: 'rv_' + Date.now(),
    listingId, vehicleName, renterName, rating, comment,
    createdAt: new Date().toISOString(),
  }
  reviews.unshift(review)
  saveReviews(reviews)
  return review
}

export function getReviewsForListing(listingId) {
  return loadReviews().filter(r => r.listingId === listingId)
}

export function getAverageRating(listingId) {
  const reviews = getReviewsForListing(listingId)
  if (reviews.length === 0) return { avg: 0, count: 0 }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  return { avg: Math.round(avg * 10) / 10, count: reviews.length }
}
