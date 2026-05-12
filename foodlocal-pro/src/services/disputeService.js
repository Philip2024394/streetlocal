import { supabase } from '@/lib/supabase'

export const DISPUTE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

export function getDisputeTimeLeftMs(cancelledAt) {
  return Math.max(0, DISPUTE_WINDOW_MS - (Date.now() - new Date(cancelledAt).getTime()))
}

export function formatCountdown(ms) {
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

export async function submitDispute({
  bookingId, userId, userName, driverName, driverType,
  pickupLocation, dropoffLocation, cancelledAt, explanation,
}) {
  if (!supabase) {
    console.log('[disputeService] demo — dispute submitted:', { bookingId, explanation })
    return { ok: true }
  }
  const { error } = await supabase.from('ride_disputes').insert({
    id:               `DISP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    booking_id:       bookingId,
    user_id:          userId,
    user_name:        userName,
    driver_name:      driverName,
    driver_type:      driverType,
    pickup_location:  pickupLocation,
    dropoff_location: dropoffLocation,
    cancelled_at:     cancelledAt,
    explanation,
    status:           'pending',
    created_at:       new Date().toISOString(),
  })
  if (error) { console.warn('[disputeService]', error.message); return { ok: false, error } }
  return { ok: true }
}
