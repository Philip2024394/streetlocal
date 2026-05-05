/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Deal Eligibility Service — gating rules for who can post deals
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Rules:
 * - Phone verified (OTP confirmed)
 * - Admin verified (is_verified = true)
 * - 5+ active products/items across ANY module combination
 * - Maximum 1 deal per day (resets midnight WIB)
 */
import { supabase } from '@/lib/supabase'

// WIB = UTC+7
function getWIBMidnight() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const wibMs = utcMs + 7 * 3_600_000
  const wib = new Date(wibMs)
  wib.setHours(0, 0, 0, 0)
  // Convert back to UTC for comparison
  return new Date(wib.getTime() - 7 * 3_600_000)
}

/**
 * Count active listings across all modules for a seller.
 * Checks: menu_items, marketplace_products, rental_listings, massage_services
 */
async function countActiveListings(userId) {
  if (!supabase) {
    // Demo mode — assume eligible
    return { total: 10, breakdown: { food: 5, marketplace: 3, rentals: 1, massage: 1 } }
  }

  const counts = { food: 0, marketplace: 0, rentals: 0, massage: 0 }

  // Food: count menu items from restaurants owned by this user
  const { count: foodCount } = await supabase
    .from('menu_items')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', userId)
    .eq('is_available', true)
    .limit(0)
  counts.food = foodCount ?? 0

  // Marketplace products
  const { count: marketCount } = await supabase
    .from('marketplace_products')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', userId)
    .eq('status', 'active')
    .limit(0)
  counts.marketplace = marketCount ?? 0

  // Rental listings
  const { count: rentalCount } = await supabase
    .from('rental_listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('status', 'active')
    .limit(0)
  counts.rentals = rentalCount ?? 0

  // Massage services
  const { count: massageCount } = await supabase
    .from('massage_services')
    .select('id', { count: 'exact', head: true })
    .eq('therapist_id', userId)
    .eq('is_available', true)
    .limit(0)
  counts.massage = massageCount ?? 0

  return {
    total: counts.food + counts.marketplace + counts.rentals + counts.massage,
    breakdown: counts,
  }
}

/**
 * Count deals posted today (WIB timezone) by this user.
 */
async function countDealsToday(userId) {
  if (!supabase) return 0

  const todayMidnight = getWIBMidnight().toISOString()

  const { count } = await supabase
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', userId)
    .gte('created_at', todayMidnight)
    .limit(0)

  return count ?? 0
}

/**
 * Check full eligibility for a user to post a deal.
 * Returns { eligible: boolean, reasons: string[] }
 */
export async function checkDealEligibility(userId, userProfile) {
  const reasons = []

  // 1. Phone verified
  if (!userProfile?.phone && !userProfile?.phoneNumber) {
    reasons.push('Phone number must be verified')
  }

  // 2. Admin verified
  if (!userProfile?.is_verified) {
    reasons.push('Account must be verified by INDOO admin')
  }

  // 3. Minimum 5 active listings
  const listings = await countActiveListings(userId)
  if (listings.total < 5) {
    reasons.push(`Need ${5 - listings.total} more active products (${listings.total}/5 listed)`)
  }

  // 4. Max 1 deal per day
  const todayCount = await countDealsToday(userId)
  if (todayCount >= 1) {
    reasons.push('Daily deal limit reached (1 per day, resets midnight WIB)')
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    listings,
    dealsToday: todayCount,
  }
}

/**
 * Quick check — returns true/false without detailed reasons.
 * Use for UI gating (show/hide create button).
 */
export async function canPostDeal(userId, userProfile) {
  const { eligible } = await checkDealEligibility(userId, userProfile)
  return eligible
}
