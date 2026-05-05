/**
 * Pre-booking / Scheduled Rides & Food Delivery.
 * Users can book rides or food orders for a future time.
 */
import { supabase } from '@/lib/supabase'

/**
 * Create a scheduled booking.
 * @param {object} params
 * @param {string} params.userId
 * @param {'ride'|'food'} params.type
 * @param {string} params.scheduledAt - ISO datetime
 * @param {object} params.pickupCoords - { lat, lng }
 * @param {object} params.dropoffCoords - { lat, lng } (ride only)
 * @param {string} params.pickupAddress
 * @param {string} params.dropoffAddress
 * @param {string} params.vehicleType - 'bike_ride' | 'car_taxi'
 * @param {number} params.estimatedFare
 * @param {string} params.restaurantId - (food only)
 * @param {Array} params.items - (food only)
 * @returns {Promise<object>} the created pre-booking
 */
export async function createPreBooking(params) {
  const booking = {
    user_id: params.userId,
    type: params.type,
    status: 'scheduled',
    scheduled_at: params.scheduledAt,
    pickup_coords: params.pickupCoords,
    dropoff_coords: params.dropoffCoords ?? null,
    pickup_address: params.pickupAddress ?? '',
    dropoff_address: params.dropoffAddress ?? '',
    vehicle_type: params.vehicleType ?? null,
    estimated_fare: params.estimatedFare ?? 0,
    restaurant_id: params.restaurantId ?? null,
    items: params.items ?? null,
    created_at: new Date().toISOString(),
  }

  if (!supabase) {
    return { ...booking, id: `PRE-${Date.now()}` }
  }

  const { data, error } = await supabase
    .from('pre_bookings')
    .insert(booking)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Get all upcoming pre-bookings for a user.
 */
export async function getUpcomingPreBookings(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('pre_bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
  return data ?? []
}

/**
 * Cancel a pre-booking.
 */
export async function cancelPreBooking(bookingId) {
  if (!supabase) return
  await supabase.from('pre_bookings').update({ status: 'cancelled' }).eq('id', bookingId)
}

/**
 * Get available time slots for scheduling (next 7 days, 30-min intervals).
 */
export function getAvailableTimeSlots() {
  const slots = []
  const now = new Date()
  const roundedMinutes = Math.ceil(now.getMinutes() / 30) * 30
  const start = new Date(now)
  start.setMinutes(roundedMinutes, 0, 0)
  start.setHours(start.getHours() + 1) // minimum 1 hour from now

  for (let day = 0; day < 7; day++) {
    const date = new Date(start)
    date.setDate(date.getDate() + day)

    for (let hour = 5; hour <= 23; hour++) {
      for (const min of [0, 30]) {
        const slot = new Date(date)
        slot.setHours(hour, min, 0, 0)
        if (slot > start) {
          slots.push({
            value: slot.toISOString(),
            label: slot.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
              + ' ' + slot.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            date: slot,
          })
        }
      }
    }
  }
  return slots
}
