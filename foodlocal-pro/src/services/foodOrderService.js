/**
 * foodOrderService.js
 *
 * Food delivery — dating gift model.
 * Payment flow:
 *   1. Order created (awaiting_payment) → customer has 10 min to bank-transfer restaurant
 *   2. Customer uploads transfer screenshot → payment_submitted
 *   3. Restaurant confirms receipt in their dashboard → confirmed
 *   4. Driver notified → driver_heading
 *   5. Driver enters pickup code at restaurant → picked_up
 *   6. Driver delivers → delivered
 *
 * No money is held or processed on-platform.
 * Restaurant pays driver cash on collection.
 */
import { supabase } from '@/lib/supabase'
import { fetchNearbyDrivers, setDriverBusy } from './bookingService'
import { getDeliveryRoute } from '@/utils/googleDirections'
import { processCommission } from './walletService'
import { recordCommission } from './commissionService'

// ── Order status pipeline ─────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  { key: 'awaiting_payment',  label: 'Awaiting payment',           icon: '💳', color: '#F59E0B' },
  { key: 'payment_submitted', label: 'Payment sent — confirming',  icon: '🧾', color: '#F59E0B' },
  { key: 'confirmed',         label: 'Confirmed — driver assigned', icon: '✓',  color: '#E8458C' },
  { key: 'driver_heading',    label: 'Driver heading to restaurant',icon: '🏍️', color: '#E8458C' },
  { key: 'picked_up',         label: 'Food collected',             icon: '📦', color: '#8DC63F' },
  { key: 'delivered',         label: 'Delivered!',                 icon: '🎁', color: '#8DC63F' },
]

export function getStatusIndex(status) {
  return ORDER_STATUSES.findIndex(s => s.key === status)
}

/** True while the order is in the payment window (not yet confirmed by restaurant) */
export function isAwaitingPayment(status) {
  return status === 'awaiting_payment' || status === 'payment_submitted'
}

// ── Driver search ─────────────────────────────────────────────────────────────

/**
 * Find available bike drivers that accept packages, near a restaurant.
 * Uses the existing bookingService driver pool.
 */
export async function searchFoodDrivers(restaurantLat, restaurantLng) {
  const lat = restaurantLat ?? -7.797
  const lng = restaurantLng ?? 110.370
  // Food delivery: bike first, car fallback if no bikes available
  try {
    const { findDriverForDelivery } = await import('./deliveryRoutingService')
    const result = await findDriverForDelivery(lat, lng, 'food')
    return result.drivers.slice(0, 5)
  } catch {
    // Fallback to direct search
    const all = await fetchNearbyDrivers(lat, lng, 'bike_ride')
    return all.filter(d => d.accepts_packages !== false && !d.driver_busy).slice(0, 5)
  }
}

/**
 * Calculate full delivery route ETA + distance using Google Directions.
 * driver → restaurant → customer
 *
 * @param {{ lat: number, lng: number }} driverCoords
 * @param {{ lat: number, lng: number }} restaurantCoords
 * @param {{ lat: number, lng: number }} customerCoords
 * @returns {Promise<{ toRestaurant: object, toCustomer: object, totalMin: number, totalKm: number }>}
 */
export async function calculateDeliveryETA(driverCoords, restaurantCoords, customerCoords) {
  return getDeliveryRoute(driverCoords, restaurantCoords, customerCoords)
}

// ── Spam / abuse guards ───────────────────────────────────────────────────────

const ACTIVE_STATUSES  = ['confirmed', 'driver_heading', 'picked_up']
const CANCEL_COOLDOWN_MS = 30 * 60 * 1000  // 30 min after a cancellation

/**
 * Returns a human-readable reason string if the sender should be blocked,
 * or null if they're clear to order.
 */
export async function checkOrderEligibility(senderId) {
  if (!supabase || !senderId) return null

  const since = new Date(Date.now() - CANCEL_COOLDOWN_MS).toISOString()

  const { data: recent } = await supabase
    .from('food_orders')
    .select('id, status, updated_at')
    .eq('sender_id', senderId)
    .in('status', [...ACTIVE_STATUSES, 'cancelled'])
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!recent?.length) return null

  // Block if any order is still active
  const active = recent.find(o => ACTIVE_STATUSES.includes(o.status))
  if (active) return 'You already have an order in progress. Wait for it to be delivered before placing a new one.'

  // Block if last cancellation was within the cooldown window
  const lastCancel = recent.find(o => o.status === 'cancelled')
  if (lastCancel) {
    const elapsed = Date.now() - new Date(lastCancel.updated_at).getTime()
    if (elapsed < CANCEL_COOLDOWN_MS) {
      const minsLeft = Math.ceil((CANCEL_COOLDOWN_MS - elapsed) / 60000)
      return `Please wait ${minsLeft} minute${minsLeft !== 1 ? 's' : ''} before placing another order.`
    }
  }

  return null
}

// ── Order creation ────────────────────────────────────────────────────────────

/**
 * Create a food delivery order.
 * No money is processed — delivery fee shown as "cash to driver".
 * Throws a plain Error with a user-facing message if the sender is blocked.
 * Returns the full order object (from Supabase or a local fallback).
 */
export async function createFoodOrder({
  restaurant,
  items,
  driver,
  sender,
  deliveryFee,
  deliveryDistanceKm,
  driverDistanceKm,
  comment,
}) {
  // ── Spam guard ──
  const blocked = await checkOrderEligibility(sender?.id)
  if (blocked) throw new Error(blocked)

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const total    = subtotal + deliveryFee
  // Short human-readable cash reference
  const cashRef  = `FD-${Date.now().toString(36).toUpperCase().slice(-6)}`

  const order = {
    restaurant_id:   restaurant.id,
    restaurant_name: restaurant.name,
    restaurant_lat:  restaurant.lat ?? null,
    restaurant_lng:  restaurant.lng ?? null,
    driver_id:       driver.id,
    driver_name:     driver.display_name,
    driver_vehicle:  driver.vehicle_model ?? null,
    driver_plate:    driver.plate_prefix  ?? null,
    driver_phone:    driver.phone         ?? null,
    sender_id:    sender?.id                          ?? null,
    sender_phone: sender?.phone ?? sender?.phoneNumber ?? null,
    // Delivery is to the sender themselves — no separate recipient
    recipient_id:   sender?.id           ?? null,
    recipient_name: sender?.displayName  ?? sender?.display_name ?? null,
    items:           items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
    subtotal,
    delivery_fee:    deliveryFee,
    total,
    comment:               comment?.trim() || null,
    delivery_distance_km:  deliveryDistanceKm ?? null,
    driver_distance_km:    driverDistanceKm   ?? null,
    cash_ref:              cashRef,
    status:                'awaiting_payment',
    payment_deadline:      new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    created_at:            new Date().toISOString(),
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('food_orders')
        .insert(order)
        .select()
        .single()
      if (!error && data) {
        await setDriverBusy(driver.id, true, 'booking')
        return data
      }
    } catch {}
  }

  // Local fallback — still functional without Supabase
  return { ...order, id: `local-${Date.now()}` }
}

// ── Realtime subscriptions ────────────────────────────────────────────────────

/** Sender: subscribe to status updates for their order. */
export function subscribeToFoodOrder(orderId, onUpdate) {
  if (!supabase || String(orderId).startsWith('local-')) return () => {}
  const ch = supabase
    .channel(`food-order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'food_orders',
      filter: `id=eq.${orderId}`,
    }, p => onUpdate(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}

/** Restaurant: subscribe to new incoming orders. */
export function subscribeToRestaurantOrders(restaurantId, onNew) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel(`restaurant-orders-${restaurantId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'food_orders',
      filter: `restaurant_id=eq.${restaurantId}`,
    }, p => onNew(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}

/** Driver: subscribe to food orders assigned to them. */
export function subscribeToDriverOrders(driverId, onNew) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel(`driver-food-orders-${driverId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'food_orders',
      filter: `driver_id=eq.${driverId}`,
    }, p => onNew(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}

// ── Status updates ────────────────────────────────────────────────────────────

/**
 * Customer submits transfer screenshot URL.
 * Uploads to Supabase storage bucket 'payment-proofs', returns public URL.
 * Then updates the order status to payment_submitted.
 */
export async function submitPaymentProof(orderId, imageFile) {
  let screenshotUrl = null

  if (supabase && imageFile) {
    const ext  = imageFile.name.split('.').pop()
    const path = `${orderId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('payment-proofs')
      .upload(path, imageFile, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from('payment-proofs').getPublicUrl(path)
      screenshotUrl = data?.publicUrl ?? null
    }
  }

  if (supabase) {
    await supabase.from('food_orders')
      .update({ status: 'payment_submitted', payment_screenshot_url: screenshotUrl })
      .eq('id', orderId)
  }
  return screenshotUrl
}

/**
 * Restaurant confirms they received the bank transfer.
 * Advances order to 'confirmed', which triggers driver notification via realtime.
 */
export async function confirmPaymentReceived(orderId) {
  if (!supabase) return
  await supabase.from('food_orders')
    .update({ status: 'confirmed', payment_confirmed_at: new Date().toISOString() })
    .eq('id', orderId)
}

/** Update order status. Frees driver when delivered/cancelled. Records commission on delivery. */
export async function updateFoodOrderStatus(orderId, status, driverId = null, orderData = null) {
  if (!supabase || String(orderId).startsWith('local-')) return
  await supabase.from('food_orders').update({ status }).eq('id', orderId)
  if ((status === 'delivered' || status === 'cancelled') && driverId) {
    await setDriverBusy(driverId, false, 'booking')
  }
  // Record 10% commission when food order is delivered
  if (status === 'delivered' && orderData) {
    const sellerId = orderData.restaurant_id || orderData.seller_id || 'default'
    const orderAmount = orderData.total || orderData.subtotal || 0
    if (orderAmount > 0) {
      processCommission(sellerId, 'food', orderId, orderAmount).catch(() => {})
      recordCommission({ sellerId, orderId, type: 'restaurant', amount: orderAmount }).catch(() => {})
    }
  }
}

/**
 * Called when a driver declines or times out on a food order.
 * Finds the next available nearby driver (excluding those who already declined)
 * and reassigns the order to them so they get the alert.
 * Returns the new driver object, or null if no drivers remain.
 */
export async function broadcastOrderToNextDriver(orderId, restaurantLat, restaurantLng, excludedDriverIds = []) {
  if (!supabase) return null

  // Free the declining driver
  if (excludedDriverIds.length) {
    await setDriverBusy(excludedDriverIds[excludedDriverIds.length - 1], false, 'booking')
  }

  // Find next available driver nearby, skipping all who have already declined
  const candidates = await searchFoodDrivers(restaurantLat, restaurantLng)
  const next = candidates.find(d => !excludedDriverIds.includes(d.id))

  if (!next) {
    // Nobody left — cancel the order so the customer knows
    await supabase.from('food_orders')
      .update({ status: 'cancelled', cancel_reason: 'No drivers available' })
      .eq('id', orderId)
    return null
  }

  // Reassign to next driver — keep status 'confirmed' so their subscription fires
  await supabase.from('food_orders')
    .update({
      driver_id:    next.id,
      driver_name:  next.display_name,
      driver_phone: next.phone ?? null,
      status:       'confirmed',
      declined_by:  excludedDriverIds,
    })
    .eq('id', orderId)

  await setDriverBusy(next.id, true, 'booking')
  return next
}

/**
 * Driver confirms pickup by entering the restaurant's pickup code.
 * Returns true if code matches, false otherwise.
 */
export async function confirmPickupWithCode(orderId, enteredCode, restaurantId) {
  // Verify code against restaurant's pickup_code
  if (supabase) {
    const { data: rest } = await supabase
      .from('restaurants')
      .select('pickup_code')
      .eq('id', restaurantId)
      .single()
    if (!rest) return false
    if (rest.pickup_code?.toUpperCase() !== enteredCode?.toUpperCase()) return false
  }
  // Code matched — update status to picked_up
  await updateFoodOrderStatus(orderId, 'picked_up')
  return true
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Restaurant: fetch active incoming orders. */
export async function getRestaurantOrders(restaurantId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('food_orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .not('status', 'in', '(delivered,cancelled)')
    .order('created_at', { ascending: false })
    .limit(30)
  return data ?? []
}

/** Driver: fetch active food orders assigned to them. */
export async function getDriverFoodOrders(driverId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('food_orders')
    .select('*')
    .eq('driver_id', driverId)
    .not('status', 'in', '(delivered,cancelled)')
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

// ── Restaurant pickup code ────────────────────────────────────────────────────

/**
 * Generate a unique 6-character pickup code for a restaurant.
 * Called once on registration or if they don't have one.
 */
export function generatePickupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Ensure restaurant has a pickup_code — generate and save if missing. */
export async function ensurePickupCode(restaurantId) {
  if (!supabase) return null
  const { data } = await supabase
    .from('restaurants')
    .select('pickup_code')
    .eq('id', restaurantId)
    .single()
  if (data?.pickup_code) return data.pickup_code
  const code = generatePickupCode()
  await supabase.from('restaurants').update({ pickup_code: code }).eq('id', restaurantId)
  return code
}
