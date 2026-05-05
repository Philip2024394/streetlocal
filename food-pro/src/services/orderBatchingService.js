/**
 * Order Batching Service — stack 2 food deliveries for the same driver.
 * Only batches orders that are same direction / same area.
 *
 * Rules:
 * 1. Both restaurants within 500m of each other
 * 2. Both customers within 2km of each other OR same bearing (±30°)
 * 3. Total detour adds max 10 minutes to either delivery
 */
import { supabase } from '@/lib/supabase'
import { haversineKm } from '@/utils/distance'

const RESTAURANT_RADIUS_KM = 0.5  // 500m
const CUSTOMER_RADIUS_KM = 2.0    // 2km
const BEARING_TOLERANCE = 30       // degrees
const MAX_DETOUR_MIN = 10

/**
 * Calculate bearing between two points (degrees, 0=North, 90=East).
 */
function bearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180)
    - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360
}

/**
 * Check if two orders can be batched.
 * @param {object} orderA - { restaurant: { lat, lng }, customer: { lat, lng } }
 * @param {object} orderB - { restaurant: { lat, lng }, customer: { lat, lng } }
 * @returns {{ canBatch: boolean, reason: string }}
 */
export function canBatchOrders(orderA, orderB) {
  // Rule 1: Restaurants within 500m
  const restaurantDist = haversineKm(
    orderA.restaurant.lat, orderA.restaurant.lng,
    orderB.restaurant.lat, orderB.restaurant.lng
  )
  if (restaurantDist > RESTAURANT_RADIUS_KM) {
    return { canBatch: false, reason: `Restaurants ${(restaurantDist * 1000).toFixed(0)}m apart (max 500m)` }
  }

  // Rule 2: Customers within 2km OR same bearing
  const customerDist = haversineKm(
    orderA.customer.lat, orderA.customer.lng,
    orderB.customer.lat, orderB.customer.lng
  )

  if (customerDist <= CUSTOMER_RADIUS_KM) {
    return { canBatch: true, reason: `Customers ${(customerDist * 1000).toFixed(0)}m apart — same area` }
  }

  // Check bearing — are both customers in the same direction from restaurants?
  const midRestLat = (orderA.restaurant.lat + orderB.restaurant.lat) / 2
  const midRestLng = (orderA.restaurant.lng + orderB.restaurant.lng) / 2

  const bearingA = bearing(midRestLat, midRestLng, orderA.customer.lat, orderA.customer.lng)
  const bearingB = bearing(midRestLat, midRestLng, orderB.customer.lat, orderB.customer.lng)

  const bearingDiff = Math.abs(bearingA - bearingB)
  const normalizedDiff = bearingDiff > 180 ? 360 - bearingDiff : bearingDiff

  if (normalizedDiff <= BEARING_TOLERANCE) {
    return { canBatch: true, reason: `Same direction (${normalizedDiff.toFixed(0)}° apart)` }
  }

  return { canBatch: false, reason: `Different directions (${normalizedDiff.toFixed(0)}° apart)` }
}

/**
 * Find a batchable order for a driver who just picked up an order.
 * Looks for pending food orders near the same restaurant going the same direction.
 *
 * @param {object} currentOrder - the order the driver currently has
 * @param {string} driverId
 * @returns {Promise<object|null>} a batchable order, or null
 */
export async function findBatchableOrder(currentOrder, driverId) {
  if (!supabase) return null

  // Get pending food orders near the same restaurant
  const { data: pending } = await supabase
    .from('food_orders')
    .select('id, restaurant_lat, restaurant_lng, customer_lat, customer_lng, restaurant, items, total')
    .eq('status', 'confirmed')
    .is('driver_id', null)
    .limit(10)

  if (!pending?.length) return null

  const currentOrderCoords = {
    restaurant: { lat: currentOrder.restaurant_lat, lng: currentOrder.restaurant_lng },
    customer: { lat: currentOrder.customer_lat, lng: currentOrder.customer_lng },
  }

  for (const order of pending) {
    const candidateCoords = {
      restaurant: { lat: order.restaurant_lat, lng: order.restaurant_lng },
      customer: { lat: order.customer_lat, lng: order.customer_lng },
    }

    const { canBatch } = canBatchOrders(currentOrderCoords, candidateCoords)
    if (canBatch) return order
  }

  return null
}

/**
 * Assign a batched order to a driver.
 */
export async function assignBatchOrder(orderId, driverId) {
  if (!supabase) return
  await supabase.from('food_orders').update({
    driver_id: driverId,
    status: 'driver_heading',
    is_batched: true,
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)
}
