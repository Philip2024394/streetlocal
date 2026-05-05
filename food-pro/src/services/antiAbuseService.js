/**
 * Anti-Abuse Service — protects against driver revenge, spam orders, collusion.
 *
 * Key threats:
 * 1. Fired drivers creating fake orders via new accounts
 * 2. Active drivers self-ordering for delivery fee fraud
 * 3. Angry drivers spam-ordering to restaurants
 * 4. Driver-restaurant collusion for fake commission
 */
import { supabase } from '@/lib/supabase'
import { haversineKm } from '@/utils/distance'

// ── Rate Limits ─────────────────────────────────────────────────────────────

const MAX_ORDERS_PER_HOUR = 3
const MAX_ORDERS_SAME_RESTAURANT_PER_DAY = 2
const FORMER_DRIVER_WATCH_MONTHS = 6
const SELF_DELIVERY_DISTANCE_KM = 0.3 // 300m — if customer is within 300m of driver's registered home, flag it

/**
 * Run all anti-abuse checks before allowing an order.
 * Returns { allowed: boolean, reason: string|null, flags: string[] }
 */
export async function checkOrderAbuse(userId, restaurantId, customerLat, customerLng, deviceFingerprint) {
  const flags = []

  if (!supabase) return { allowed: true, reason: null, flags }

  // 1. Check if user is blacklisted
  const { data: blocked } = await supabase
    .from('blacklist')
    .select('id, reason')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (blocked) {
    return { allowed: false, reason: 'Account suspended. Contact support.', flags: ['blacklisted'] }
  }

  // 2. Check if phone number belongs to a driver (active or deactivated)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_driver, driver_online, phone, device_fingerprint')
    .eq('id', userId)
    .single()

  // 3. Cross-check: is this customer account's phone number also registered as a driver?
  if (profile?.phone) {
    const { data: driverMatch } = await supabase
      .from('profiles')
      .select('id, is_driver, driver_online')
      .eq('phone', profile.phone)
      .eq('is_driver', true)
      .neq('id', userId)
      .maybeSingle()

    if (driverMatch) {
      flags.push('phone_matches_driver')
      // If this driver is currently online — high suspicion of self-ordering
      if (driverMatch.driver_online) {
        return {
          allowed: false,
          reason: 'This phone number is registered as an active driver. Cannot place orders from driver accounts.',
          flags: [...flags, 'active_driver_ordering'],
        }
      }
    }
  }

  // 4. Device fingerprint cross-check with driver accounts
  if (deviceFingerprint) {
    const { data: deviceMatch } = await supabase
      .from('profiles')
      .select('id, is_driver')
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_driver', true)
      .neq('id', userId)
      .maybeSingle()

    if (deviceMatch) {
      flags.push('device_matches_driver')
    }
  }

  // 5. Check former driver watchlist (deactivated in last 6 months)
  const watchDate = new Date()
  watchDate.setMonth(watchDate.getMonth() - FORMER_DRIVER_WATCH_MONTHS)
  const { data: formerDriver } = await supabase
    .from('driver_deactivations')
    .select('id, reason')
    .eq('user_id', userId)
    .gte('deactivated_at', watchDate.toISOString())
    .maybeSingle()

  if (formerDriver) {
    flags.push('former_driver_watchlist')
    // Former driver ordering COD = high risk
    // Don't block, but flag for monitoring
  }

  // 6. Order velocity — max per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentOrders } = await supabase
    .from('food_orders')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .gte('created_at', oneHourAgo)

  if ((recentOrders ?? 0) >= MAX_ORDERS_PER_HOUR) {
    return {
      allowed: false,
      reason: `Maximum ${MAX_ORDERS_PER_HOUR} orders per hour. Please wait before ordering again.`,
      flags: [...flags, 'velocity_limit'],
    }
  }

  // 7. Same restaurant spam — max per day
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: sameRestaurant } = await supabase
    .from('food_orders')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .eq('restaurant_id', restaurantId)
    .gte('created_at', todayStart.toISOString())

  if ((sameRestaurant ?? 0) >= MAX_ORDERS_SAME_RESTAURANT_PER_DAY) {
    return {
      allowed: false,
      reason: `Maximum ${MAX_ORDERS_SAME_RESTAURANT_PER_DAY} orders per day to the same restaurant.`,
      flags: [...flags, 'same_restaurant_spam'],
    }
  }

  // 8. Self-delivery detection — customer GPS near driver's home/last location
  if (customerLat && customerLng) {
    const { data: nearbyDrivers } = await supabase
      .from('driver_locations')
      .select('driver_id, lat, lng')

    if (nearbyDrivers?.length) {
      for (const d of nearbyDrivers) {
        const dist = haversineKm(customerLat, customerLng, d.lat, d.lng)
        if (dist < SELF_DELIVERY_DISTANCE_KM) {
          // Check if this driver's phone matches the customer's
          const { data: driverProfile } = await supabase
            .from('profiles')
            .select('phone, device_fingerprint')
            .eq('id', d.driver_id)
            .single()

          if (driverProfile?.phone === profile?.phone || driverProfile?.device_fingerprint === deviceFingerprint) {
            flags.push('self_delivery_suspected')
            // Don't block — but log for admin review
            await logAbuseEvent(userId, 'self_delivery_suspected', {
              driver_id: d.driver_id,
              distance_m: Math.round(dist * 1000),
            })
          }
        }
      }
    }
  }

  // All checks passed
  return { allowed: true, reason: null, flags }
}

/**
 * Check if a driver can accept a specific order (anti-collusion).
 * Blocks driver from accepting orders they or their household placed.
 */
export async function canDriverAcceptOrder(driverId, orderId) {
  if (!supabase) return { allowed: true, reason: null }

  const { data: order } = await supabase
    .from('food_orders')
    .select('sender_id')
    .eq('id', orderId)
    .single()

  if (!order) return { allowed: true, reason: null }

  // Same person
  if (order.sender_id === driverId) {
    return { allowed: false, reason: 'Cannot accept your own order.' }
  }

  // Same phone number
  const [driverProfile, customerProfile] = await Promise.all([
    supabase.from('profiles').select('phone, device_fingerprint').eq('id', driverId).single(),
    supabase.from('profiles').select('phone, device_fingerprint').eq('id', order.sender_id).single(),
  ])

  if (driverProfile.data?.phone && driverProfile.data.phone === customerProfile.data?.phone) {
    return { allowed: false, reason: 'Phone number matches the customer.' }
  }

  if (driverProfile.data?.device_fingerprint && driverProfile.data.device_fingerprint === customerProfile.data?.device_fingerprint) {
    return { allowed: false, reason: 'Same device detected.' }
  }

  return { allowed: true, reason: null }
}

/**
 * Log an abuse event for admin review.
 */
async function logAbuseEvent(userId, type, details) {
  if (!supabase) return
  await supabase.from('fraud_events').insert({
    user_id: userId,
    type,
    details: JSON.stringify(details),
    created_at: new Date().toISOString(),
  }).catch(() => {})
}

/**
 * Record driver deactivation (for watchlist).
 */
export async function recordDriverDeactivation(driverId, reason) {
  if (!supabase) return
  await supabase.from('driver_deactivations').insert({
    user_id: driverId,
    reason,
    deactivated_at: new Date().toISOString(),
  })
}

/**
 * Admin: get flagged orders for review.
 */
export async function getFlaggedOrders(limit = 20) {
  if (!supabase) return []
  const { data } = await supabase
    .from('fraud_events')
    .select('*, profiles!user_id(display_name, phone)')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
