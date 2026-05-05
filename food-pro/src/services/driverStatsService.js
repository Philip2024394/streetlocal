/**
 * driverStatsService.js
 * Fetches driver profile, performance stats, and recent reviews
 * for the DriverWarningScreen performance review phase.
 */
import { supabase } from '@/lib/supabase'

// ── Demo fallback ─────────────────────────────────────────────────────────────
const DEMO_STATS = {
  profile: {
    display_name:      'Budi Santoso',
    driver_age:        28,
    photo_url:         null,
    rating:            4.6,
    total_trips:       342,
    cancellation_count: 4,
    acceptance_rate:   78,
    vehicle_model:     'Honda Vario 125',
    vehicle_color:     'Black',
    plate_prefix:      'AB 1234 XY',
    driver_type:       'bike_ride',
    created_at:        '2024-03-01T00:00:00Z',
  },
  tripsToday:   2,
  tripsThisWeek: 18,
  hoursOnlineToday: 4.5,
  hoursOnlineWeek:  31,
  reviews: [
    { stars: 5, comment: 'Very fast and polite!',        reviewer: 'Rina K.',  created_at: '2026-04-10T09:12:00Z' },
    { stars: 4, comment: 'Good service, arrived on time', reviewer: 'Dani S.', created_at: '2026-04-09T14:30:00Z' },
    { stars: 3, comment: 'A bit late but friendly',       reviewer: 'Maya W.', created_at: '2026-04-07T11:05:00Z' },
  ],
}

export async function fetchDriverStats(driverId) {
  if (!supabase || !driverId) return DEMO_STATS

  try {
    // ── Profile ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, driver_age, photo_url, rating, total_trips, cancellation_count, acceptance_rate, vehicle_model, vehicle_color, plate_prefix, driver_type, created_at')
      .eq('id', driverId)
      .single()

    // ── Bookings: today ──
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const { data: todayBookings } = await supabase
      .from('bookings')
      .select('id, created_at, status')
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString())

    const { data: weekBookings } = await supabase
      .from('bookings')
      .select('id, created_at, status')
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .gte('created_at', weekStart.toISOString())

    // ── Recent reviews ──
    const { data: rawReviews } = await supabase
      .from('driver_reviews')
      .select('stars, comment, created_at, reviewer:profiles!user_id(display_name)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(3)

    const reviews = (rawReviews ?? []).map(r => ({
      stars:      r.stars,
      comment:    r.comment,
      reviewer:   r.reviewer?.display_name ?? 'Passenger',
      created_at: r.created_at,
    }))

    return {
      profile:          profile ?? DEMO_STATS.profile,
      tripsToday:       todayBookings?.length ?? 0,
      tripsThisWeek:    weekBookings?.length  ?? 0,
      hoursOnlineToday: DEMO_STATS.hoursOnlineToday, // not tracked in DB yet
      hoursOnlineWeek:  DEMO_STATS.hoursOnlineWeek,
      reviews:          reviews.length ? reviews : DEMO_STATS.reviews,
    }
  } catch {
    return DEMO_STATS
  }
}

/** Generate a short management improvement note based on driver stats */
export function buildManagementNote(warningType, stats) {
  const { profile, tripsThisWeek } = stats
  const rate       = profile?.acceptance_rate ?? 100
  const cancels    = profile?.cancellation_count ?? 0
  const rating     = profile?.rating ?? 5
  const name       = profile?.display_name?.split(' ')[0] ?? 'Driver'

  const lines = []

  if (warningType === 'missed') {
    lines.push(`${name}, you did not respond to a customer booking request in time. Customers rely on fast responses — please ensure your device is active when you are online.`)
  } else {
    lines.push(`${name}, you declined a customer booking request. Frequent declines affect customer experience and your standing on the platform.`)
  }

  if (rate < 70) {
    lines.push(`Your acceptance rate of ${rate}% is below our minimum target of 70%. Please accept more trips to maintain your active driver status.`)
  } else if (rate < 80) {
    lines.push(`Your acceptance rate of ${rate}% is approaching our minimum threshold. We encourage you to improve this before further action is required.`)
  }

  if (cancels >= 3) {
    lines.push(`You have ${cancels} cancellations on record this period. Excessive cancellations lead to formal review and potential account suspension.`)
  }

  if (rating < 4.0) {
    lines.push(`Your current passenger rating of ${rating} is below the platform average. We recommend focusing on punctuality and communication with customers.`)
  }

  if (tripsThisWeek < 5) {
    lines.push(`You have completed only ${tripsThisWeek} trips this week. We encourage greater availability to maintain your driver tier.`)
  }

  return lines
}
