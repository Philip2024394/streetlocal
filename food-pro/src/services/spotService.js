import { supabase } from '@/lib/supabase'

/**
 * Check if a postcode is available to claim.
 * Returns { available: bool, spot: object|null }
 */
export async function checkPostcode(postcode) {
  const code = postcode.trim().toUpperCase().replace(/\s+/g, ' ')
  if (!supabase) {
    // Demo mode — always available
    return { available: true, spot: null }
  }
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('postcode', code)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return { available: !data, spot: data ?? null }
}

/**
 * Check if a postcode is in the protected list (govt, royal, public).
 */
export async function isProtected(postcode) {
  const code = postcode.trim().toUpperCase().replace(/\s+/g, ' ')
  if (!supabase) return false
  const { data } = await supabase
    .from('protected_postcodes')
    .select('postcode')
    .eq('postcode', code)
    .maybeSingle()
  return !!data
}

/**
 * Get the current user's claimed spot (if any).
 */
export async function getMySpot(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Record a spot claim (called after successful payment via webhook,
 * but we also insert immediately as pending so the pin shows live).
 */
export async function claimSpot({ userId, postcode, type, category, lat, lng, stripeSubscriptionId }) {
  if (!supabase) {
    return { id: 'demo', postcode, type, status: 'pending' }
  }
  const code = postcode.trim().toUpperCase().replace(/\s+/g, ' ')
  const { data, error } = await supabase
    .from('spots')
    .insert({
      user_id: userId,
      postcode: code,
      type,
      category: category ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      status: 'pending',
      stripe_subscription_id: stripeSubscriptionId ?? null,
      claimed_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Fetch all active spots for the map.
 */
export async function getActiveSpots() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .in('status', ['active', 'pending'])
  if (error) throw new Error(error.message)
  return data ?? []
}
