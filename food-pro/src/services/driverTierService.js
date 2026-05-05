/**
 * Driver Tier System — Standard → Verified → Pro → Elite
 * Progression is earned by consistently hitting daily goals.
 * Elite drivers receive free INDOO promotional items & rewards.
 */
import { supabase } from '@/lib/supabase'

export const TIERS = [
  {
    id: 'standard', label: 'Standard', icon: '🏍️', color: '#888888', minTrips: 0, minRating: 0,
    perks: ['Basic orders', 'Standard dispatch priority'],
    description: 'New to INDOO — complete daily goals to level up',
  },
  {
    id: 'verified', label: 'Verified', icon: '✅', color: '#00E5FF', minTrips: 50, minRating: 4.3,
    perks: ['Priority food orders', 'Verified badge on profile', 'Early access to surge zones'],
    description: 'Trusted driver — consistently meeting goals',
  },
  {
    id: 'pro', label: 'Pro', icon: '⭐', color: '#FACC15', minTrips: 200, minRating: 4.6,
    perks: ['Priority all orders', 'Pro badge on profile', 'Exclusive promo access', 'Featured in customer app'],
    description: 'Top performer — priority on all services',
  },
  {
    id: 'elite', label: 'INDOO Elite', icon: '💎', color: '#8DC63F', minTrips: 500, minRating: 4.8,
    perks: [
      'First pick on ALL orders',
      'INDOO Elite badge',
      'VIP support line',
      'Free INDOO branded jacket',
      'Free INDOO delivery bag',
      'Hotel or villa stay voucher',
      'Meal vouchers',
      'Exclusive Elite events',
      'Featured driver profile',
    ],
    rewards: [
      { icon: '🧥', label: 'INDOO Jacket' },
      { icon: '🎒', label: 'INDOO Delivery Bag' },
      { icon: '🏨', label: 'Hotel / Villa Stay' },
      { icon: '🍽️', label: 'Meal Vouchers' },
      { icon: '🎫', label: 'Event Invites' },
      { icon: '📱', label: 'Priority Support' },
    ],
    description: 'The best of the best — exclusive rewards & recognition',
  },
]

/**
 * Calculate driver's current tier based on total trips and rating.
 */
export function calculateTier(totalTrips, rating) {
  let tier = TIERS[0]
  for (const t of TIERS) {
    if (totalTrips >= t.minTrips && rating >= t.minRating) tier = t
  }
  return tier
}

/**
 * Get driver's tier with progress to next level.
 */
export async function getDriverTier(driverId) {
  let totalTrips = 0
  let rating = 4.5

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('total_trips, rating')
      .eq('id', driverId)
      .single()
    if (data) {
      totalTrips = data.total_trips ?? 0
      rating = data.rating ?? 4.5
    }
  }

  const current = calculateTier(totalTrips, rating)
  const currentIdx = TIERS.findIndex(t => t.id === current.id)
  const next = TIERS[currentIdx + 1] ?? null

  return {
    current,
    next,
    totalTrips,
    rating,
    tripsToNext: next ? Math.max(0, next.minTrips - totalTrips) : 0,
    ratingNeeded: next ? next.minRating : null,
    progress: next ? Math.min(1, totalTrips / next.minTrips) : 1,
  }
}
