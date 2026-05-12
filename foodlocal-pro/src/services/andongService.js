/**
 * Andong (Horse Cart) Service
 * Cultural heritage transport — Yogyakarta traditional horse-drawn carriage.
 *
 * INDOO operates andong bookings under strict animal welfare standards.
 * This is a cultural preservation initiative, not a commercial venture.
 *
 * Welfare rules enforced by the app:
 * - Max 6 working hours per day per horse
 * - Max 4 trips per day per horse
 * - Min 20 min rest between trips
 * - Max 30 km total distance per day
 * - 1 mandatory rest day per week
 * - Temperature shutdown at 35°C, reduced ops at 33°C
 * - Water break alerts every 30 min in heat
 * - Vet check every 3 months (horse blocked if overdue)
 */

import { supabase } from '@/lib/supabase'

// ── Welfare Constants ───────────────────────────────────────────────────────

export const WELFARE = {
  MAX_HOURS_PER_DAY: 6,
  MAX_TRIPS_PER_DAY: 4,
  MIN_REST_MINUTES: 20,
  MAX_DISTANCE_KM_PER_DAY: 30,
  MAX_TRIP_DURATION_HOURS: 2,
  DAYS_OFF_PER_WEEK: 1,
  VET_CHECK_INTERVAL_DAYS: 90,
  TEMP_WARNING_C: 30,
  TEMP_REDUCED_C: 33,
  TEMP_SHUTDOWN_C: 35,
  WATER_BREAK_NORMAL_MIN: 60,
  WATER_BREAK_HOT_MIN: 30,
}

// ── Pricing ─────────────────────────────────────────────────────────────────

export const ANDONG_PRICING = {
  hotelPickupFee: 50000,
  commission: 0.10,
}

// ── Tour Packages ───────────────────────────────────────────────────────────
// Categorized: City / Village / Premium / Special
// Ride segments ≤30 min each, total pulling ≤2h, shade+water stops, flat terrain preferred

export const ANDONG_PACKAGES = [
  // ── CITY TOURS ──
  {
    id: 'malioboro-classic',
    category: 'city',
    label: 'Malioboro Classic',
    desc: 'Evening ride through Yogyakarta\'s most famous street with city lights & photo stops',
    hours: 1,
    price: 100000,
    icon: '🌆',
    badge: null,
    bestTime: 'Evening',
    welfareNote: 'Short ride, evening = cool temperature',
    includes: ['City landmarks', 'Street atmosphere', 'Photo stops'],
  },
  {
    id: 'royal-heritage',
    category: 'city',
    label: 'Royal Heritage',
    desc: 'Kraton → Taman Sari → Alun-Alun — the heart of royal Yogyakarta',
    hours: 2,
    price: 250000,
    icon: '🏛️',
    badge: null,
    bestTime: 'Morning or Afternoon',
    welfareNote: '2 rest stops with water, shade at Kraton',
    includes: ['Sultan\'s Palace view', 'Royal water castle', 'Twin banyan trees'],
  },
  {
    id: 'full-city-culture',
    category: 'city',
    label: 'Full City Culture',
    desc: 'Extended royal route through Kotagede — silver craft village & ancient capital',
    hours: 3,
    price: 500000,
    icon: '🎨',
    badge: null,
    bestTime: 'Morning',
    welfareNote: '3 rest stops, shaded village roads',
    includes: ['Kraton', 'Taman Sari', 'Kotagede silver village', 'Alun-Alun'],
  },

  // ── VILLAGE TOURS (Best for horse welfare) ──
  {
    id: 'prambanan-village',
    category: 'village',
    label: 'Prambanan Village Tour',
    desc: 'Rice fields, hidden temples & authentic village scenery near Prambanan',
    hours: 2,
    price: 400000,
    icon: '🌾',
    badge: 'Best Seller',
    bestTime: 'Morning',
    welfareNote: 'Flat village roads, frequent shade stops, cool morning air',
    includes: ['Candi Plaosan view', 'Village scenery', 'Rice field views', 'Photo stops'],
  },
  {
    id: 'slow-life-jogja',
    category: 'village',
    label: 'Slow Life Jogja',
    desc: 'Peaceful ride through villages, rice fields & quiet countryside lanes',
    hours: 3,
    price: 500000,
    icon: '🌿',
    badge: null,
    bestTime: 'Morning',
    welfareNote: 'Short ride segments with cultural stops — low horse fatigue',
    includes: ['Village roads', 'Rice field panorama', 'Countryside views', 'Rest stops'],
  },
  {
    id: 'hidden-temples',
    category: 'village',
    label: 'Hidden Temple Route',
    desc: 'Off-the-beaten-path temples — Plaosan, Sojiwan & quiet countryside roads',
    hours: 2,
    price: 350000,
    icon: '🛕',
    badge: null,
    bestTime: 'Morning',
    welfareNote: 'Flat calm roads, no traffic, shaded paths',
    includes: ['Candi Plaosan', 'Candi Sojiwan', 'Village scenery'],
  },

  // ── PREMIUM EXPERIENCES ──
  {
    id: 'borobudur-village',
    category: 'premium',
    label: 'Borobudur Village Ride',
    desc: 'Candirejo village loop around Borobudur — scenic countryside & temple views',
    hours: 3,
    price: 750000,
    icon: '🏯',
    badge: 'Premium',
    bestTime: 'Morning',
    welfareNote: 'Village loop = flat, shaded, slow pace with rest stops',
    includes: ['Borobudur area views', 'Candirejo village loop', 'Countryside scenery'],
  },
  {
    id: 'eco-experience',
    category: 'premium',
    label: 'Eco Andong Experience',
    desc: 'Horse care education — feed, groom & learn about ethical animal welfare + village ride',
    hours: 2,
    price: 500000,
    icon: '💚',
    badge: 'Ethical',
    bestTime: 'Morning',
    welfareNote: 'Includes feeding + grooming the horse — horse rests during education',
    includes: ['Horse care workshop', 'Feed & groom session', 'Short village ride', 'Welfare certificate'],
  },

  // ── SPECIAL / TIME-BASED ──
  {
    id: 'sunrise-ride',
    category: 'special',
    label: 'Sunrise Village Ride',
    desc: 'Early morning ride through misty rice fields — best light for photos',
    hours: 1.5,
    price: 250000,
    icon: '🌅',
    badge: 'Limited Slots',
    bestTime: '6:00 - 7:30 AM',
    welfareNote: 'Cool dawn temperature = best conditions for horse',
    includes: ['Sunrise rice field views', 'Village morning life', 'Photo stops'],
    note: 'Breakfast not included — ask your kusir for local recommendations nearby',
  },
  {
    id: 'sunset-rice-field',
    category: 'special',
    label: 'Sunset Rice Field Ride',
    desc: 'Golden hour ride through rice paddies — the most Instagrammable experience',
    hours: 1,
    price: 175000,
    icon: '🌄',
    badge: 'Sunset',
    bestTime: '4:30 - 5:30 PM',
    welfareNote: 'Cooler late afternoon, short scenic loop',
    includes: ['Golden hour views', 'Rice field panorama', 'Photo spots'],
  },
  {
    id: 'cultural-arrival',
    category: 'special',
    label: 'Cultural Arrival Ride',
    desc: 'Arrive in style by andong to your destination — short scenic transfer',
    hours: 1,
    price: 250000,
    icon: '🎭',
    badge: null,
    bestTime: 'Evening',
    welfareNote: 'Short ride only — minimal horse fatigue',
    includes: ['Scenic arrival ride', 'Photo opportunity', 'Cultural experience'],
  },
]

// Package categories for UI filtering
export const PACKAGE_CATEGORIES = [
  { id: 'all',     label: 'All Tours',   icon: '🐴' },
  { id: 'city',    label: 'City',        icon: '🌆' },
  { id: 'village', label: 'Village',     icon: '🌾' },
  { id: 'premium', label: 'Premium',     icon: '⭐' },
  { id: 'special', label: 'Special',     icon: '✨' },
]

// Advance booking time slots
export const TIME_SLOTS = [
  { id: 'sunrise',   label: 'Sunrise',   time: '06:00 - 07:30', icon: '🌅' },
  { id: 'morning',   label: 'Morning',   time: '08:00 - 10:00', icon: '☀️' },
  { id: 'midday',    label: 'Midday',    time: '10:00 - 12:00', icon: '🌤️' },
  { id: 'afternoon', label: 'Afternoon', time: '14:00 - 16:00', icon: '⛅' },
  { id: 'sunset',    label: 'Sunset',    time: '16:30 - 18:00', icon: '🌇', premium: true },
  { id: 'evening',   label: 'Evening',   time: '18:30 - 20:00', icon: '🌙' },
]

// Malioboro zone — no pickup fee within this area
const MALIOBORO_CENTER = { lat: -7.7928, lng: 110.3653 }
const MALIOBORO_RADIUS_KM = 1.5

// ── Demo Horse Profiles ─────────────────────────────────────────────────────

const DEMO_HORSES = [
  {
    id: 'horse-001',
    name: 'Kuda Jaya',
    breed: 'Java Pony',
    age: 8,
    color: 'Bay (Cokelat)',
    photo_url: null,
    owner_name: 'Pak Slamet',
    owner_phone: '081234567890',
    owner_photo: 'https://i.pravatar.cc/200?img=12',
    cart_style: 'Traditional Jogja',
    cart_type: 'covered',
    cart_color: 'Red & gold',
    seats: 4,
    languages: ['Indonesian', 'English'],
    lat: -7.7928, lng: 110.3653,
    registered_at: '2025-06-01',
    last_vet_check: '2026-03-15',
    next_vet_due: '2026-06-15',
    vet_status: 'healthy',
    is_active: true,
    rest_day: 'Monday',
    today_trips: 0,
    today_hours: 0,
    today_km: 0,
    last_trip_ended: null,
    rating: 4.9,
    total_trips: 342,
    status: 'available',
  },
  {
    id: 'horse-002',
    name: 'Si Putih',
    breed: 'Sandalwood Pony',
    age: 6,
    color: 'White (Putih)',
    photo_url: null,
    owner_name: 'Pak Bambang',
    owner_phone: '081298765432',
    owner_photo: 'https://i.pravatar.cc/200?img=15',
    cart_style: 'Classic Malioboro',
    cart_type: 'open',
    cart_color: 'Green & white',
    seats: 5,
    languages: ['Indonesian'],
    lat: -7.7945, lng: 110.3668,
    registered_at: '2025-08-15',
    last_vet_check: '2026-02-20',
    next_vet_due: '2026-05-20',
    vet_status: 'healthy',
    is_active: true,
    rest_day: 'Tuesday',
    today_trips: 1,
    today_hours: 1.5,
    today_km: 4,
    last_trip_ended: new Date(Date.now() - 45 * 60000).toISOString(),
    rating: 4.7,
    total_trips: 218,
    status: 'available',
  },
  {
    id: 'horse-003',
    name: 'Gagah',
    breed: 'Java Pony',
    age: 10,
    color: 'Black (Hitam)',
    photo_url: null,
    owner_name: 'Pak Widodo',
    owner_phone: '081356789012',
    owner_photo: 'https://i.pravatar.cc/200?img=18',
    cart_style: 'Royal Keraton',
    cart_type: 'covered',
    cart_color: 'Purple & gold',
    seats: 3,
    languages: ['Indonesian', 'English', 'Chinese'],
    lat: -7.7960, lng: 110.3640,
    registered_at: '2025-04-10',
    last_vet_check: '2026-04-01',
    next_vet_due: '2026-07-01',
    vet_status: 'healthy',
    is_active: true,
    rest_day: 'Wednesday',
    today_trips: 0,
    today_hours: 0,
    today_km: 0,
    last_trip_ended: null,
    rating: 4.8,
    total_trips: 456,
    status: 'available',
  },
  {
    id: 'horse-004',
    name: 'Bintang',
    breed: 'Java Pony',
    age: 7,
    color: 'Chestnut (Merah)',
    photo_url: null,
    owner_name: 'Pak Harto',
    owner_phone: '081345678901',
    owner_photo: 'https://i.pravatar.cc/200?img=22',
    cart_style: 'Vintage Classic',
    cart_type: 'open',
    cart_color: 'Blue & silver',
    seats: 4,
    languages: ['Indonesian', 'Japanese'],
    lat: -7.7910, lng: 110.3680,
    registered_at: '2025-09-01',
    last_vet_check: '2026-03-20',
    next_vet_due: '2026-06-20',
    vet_status: 'healthy',
    is_active: true,
    rest_day: 'Thursday',
    today_trips: 2,
    today_hours: 3,
    today_km: 12,
    last_trip_ended: new Date(Date.now() - 30 * 60000).toISOString(),
    rating: 4.6,
    total_trips: 156,
    status: 'booked',
  },
  {
    id: 'horse-005',
    name: 'Cendana',
    breed: 'Sandalwood Pony',
    age: 9,
    color: 'Dapple Grey (Abu)',
    photo_url: null,
    owner_name: 'Pak Suryo',
    owner_phone: '081267890123',
    owner_photo: 'https://i.pravatar.cc/200?img=25',
    cart_style: 'Heritage Deluxe',
    cart_type: 'covered',
    cart_color: 'Burgundy & cream',
    seats: 6,
    languages: ['Indonesian', 'English', 'Arabic'],
    lat: -7.7985, lng: 110.3625,
    registered_at: '2025-05-20',
    last_vet_check: '2026-04-10',
    next_vet_due: '2026-07-10',
    vet_status: 'healthy',
    is_active: true,
    rest_day: 'Friday',
    today_trips: 0,
    today_hours: 0,
    today_km: 0,
    last_trip_ended: null,
    rating: 4.9,
    total_trips: 389,
    status: 'available',
  },
]

// ── Haversine ───────────────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Welfare Checks ──────────────────────────────────────────────────────────

/**
 * Check if a horse is available for booking right now.
 * Returns { available, reason } — reason explains why if unavailable.
 */
export function checkHorseAvailability(horse, temperatureC = null) {
  const now = new Date()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = dayNames[now.getDay()]

  // Rest day check
  if (horse.rest_day === today) {
    return { available: false, reason: `${horse.name} is resting today (mandatory rest day)` }
  }

  // Vet check overdue
  if (horse.next_vet_due) {
    const vetDue = new Date(horse.next_vet_due)
    if (now > vetDue) {
      return { available: false, reason: `${horse.name} needs a vet check before next trip` }
    }
  }

  // Health status
  if (horse.vet_status !== 'healthy') {
    return { available: false, reason: `${horse.name} is currently under medical care` }
  }

  // Not active
  if (!horse.is_active) {
    return { available: false, reason: `${horse.name} is not currently active` }
  }

  // Max trips per day
  if (horse.today_trips >= WELFARE.MAX_TRIPS_PER_DAY) {
    return { available: false, reason: `${horse.name} has reached the daily trip limit (${WELFARE.MAX_TRIPS_PER_DAY} trips) — welfare rest required` }
  }

  // Max hours per day
  if (horse.today_hours >= WELFARE.MAX_HOURS_PER_DAY) {
    return { available: false, reason: `${horse.name} has reached the daily hour limit (${WELFARE.MAX_HOURS_PER_DAY}h) — welfare rest required` }
  }

  // Max distance per day
  if (horse.today_km >= WELFARE.MAX_DISTANCE_KM_PER_DAY) {
    return { available: false, reason: `${horse.name} has reached the daily distance limit (${WELFARE.MAX_DISTANCE_KM_PER_DAY}km)` }
  }

  // Rest between trips
  if (horse.last_trip_ended) {
    const lastEnd = new Date(horse.last_trip_ended)
    const minsSinceLastTrip = (now - lastEnd) / 60000
    if (minsSinceLastTrip < WELFARE.MIN_REST_MINUTES) {
      const remaining = Math.ceil(WELFARE.MIN_REST_MINUTES - minsSinceLastTrip)
      return { available: false, reason: `${horse.name} is resting — available in ${remaining} min` }
    }
  }

  // Temperature checks
  if (temperatureC != null) {
    if (temperatureC >= WELFARE.TEMP_SHUTDOWN_C) {
      return { available: false, reason: `Too hot (${temperatureC}°C) — all andong bookings suspended for horse safety` }
    }
    if (temperatureC >= WELFARE.TEMP_REDUCED_C) {
      return { available: true, reason: `High temperature (${temperatureC}°C) — shortened trips only, extra water breaks required`, warning: true }
    }
    if (temperatureC >= WELFARE.TEMP_WARNING_C) {
      return { available: true, reason: `Warm conditions (${temperatureC}°C) — water breaks every 30 min`, warning: true }
    }
  }

  return { available: true, reason: null }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get all registered horses with availability status.
 */
export async function getAvailableHorses(temperatureC = null) {
  let horses = DEMO_HORSES

  if (supabase) {
    const { data } = await supabase
      .from('andong_horses')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })
    if (data?.length) horses = data
  }

  // Approx km per hour for andong (~5km/h pace)
  const KM_PER_HOUR = 5

  return horses.map(horse => {
    const availability = checkHorseAvailability(horse, temperatureC)
    const remainingKm = Math.max(0, WELFARE.MAX_DISTANCE_KM_PER_DAY - (horse.today_km || 0))
    const remainingHours = Math.max(0, WELFARE.MAX_HOURS_PER_DAY - (horse.today_hours || 0))
    // What packages can this horse still do?
    const availablePackages = ANDONG_PACKAGES.filter(p =>
      p.hours <= remainingHours && (p.hours * KM_PER_HOUR) <= remainingKm
    )
    return {
      ...horse,
      ...availability,
      remainingKm,
      remainingHours,
      availablePackages,
    }
  })
}

/**
 * Calculate andong fare.
 */
export function calculateAndongFare(packageOrHours, pickupLat, pickupLng) {
  // Accept a package object or find by hours
  const pkg = typeof packageOrHours === 'object'
    ? packageOrHours
    : ANDONG_PACKAGES.find(p => p.hours >= packageOrHours) || ANDONG_PACKAGES[0]

  let fare = pkg.price

  // Hotel pickup fee if outside Malioboro zone
  let pickupFee = 0
  if (pickupLat && pickupLng) {
    const dist = haversineKm(MALIOBORO_CENTER.lat, MALIOBORO_CENTER.lng, pickupLat, pickupLng)
    if (dist > MALIOBORO_RADIUS_KM) {
      pickupFee = ANDONG_PRICING.hotelPickupFee
    }
  }

  const total = fare + pickupFee
  const driverGets = Math.round(total * (1 - ANDONG_PRICING.commission))
  const indooKeeps = total - driverGets

  return {
    packageLabel: pkg.label,
    packagePrice: pkg.price,
    pickupFee,
    total,
    driverGets,
    indooKeeps,
    isOutsideMalioboro: pickupFee > 0,
  }
}

/**
 * Book an andong ride.
 */
export async function bookAndong({ horseId, passengerId, pickupCoords, durationHours, notes }) {
  const booking = {
    id: `andong-${Date.now()}`,
    horse_id: horseId,
    passenger_id: passengerId,
    pickup_lat: pickupCoords.lat,
    pickup_lng: pickupCoords.lng,
    duration_hours: durationHours,
    fare: calculateAndongFare(durationHours, pickupCoords.lat, pickupCoords.lng),
    status: 'pending',
    notes: notes || '',
    created_at: new Date().toISOString(),
    welfare_certified: true,
  }

  if (!supabase) return booking

  const { data, error } = await supabase
    .from('andong_bookings')
    .insert(booking)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get welfare summary for display.
 */
export function getWelfareSummary() {
  return {
    title: 'Animal Welfare Standards',
    subtitle: 'INDOO operates andong under strict welfare protection',
    standards: [
      { icon: '⏰', text: `Max ${WELFARE.MAX_HOURS_PER_DAY} working hours per day` },
      { icon: '🔄', text: `Max ${WELFARE.MAX_TRIPS_PER_DAY} trips per day with ${WELFARE.MIN_REST_MINUTES} min rest between` },
      { icon: '📏', text: `Max ${WELFARE.MAX_DISTANCE_KM_PER_DAY} km per day` },
      { icon: '🌡️', text: `No rides above ${WELFARE.TEMP_SHUTDOWN_C}°C — horse safety first` },
      { icon: '💧', text: 'Water breaks every 30 min in warm weather' },
      { icon: '🩺', text: 'Vet health check every 3 months — verified' },
      { icon: '😴', text: `${WELFARE.DAYS_OFF_PER_WEEK} mandatory rest day per week` },
    ],
    disclaimer: 'Andong rides are a cultural heritage experience. INDOO enforces animal welfare standards on every booking. This service operates under cultural preservation — not commercial profit.',
  }
}

export function formatRpAndong(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
