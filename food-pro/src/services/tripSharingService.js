/**
 * Trip Sharing / Safety Service.
 * Share live trip GPS with trusted contacts.
 * Emergency SOS integration.
 */
import { supabase } from '@/lib/supabase'

/**
 * Create a shareable trip link.
 * Contact can view driver location + ETA without the app.
 * @param {string} bookingId
 * @param {string} userId
 * @returns {Promise<string>} shareable URL
 */
export async function createTripShareLink(bookingId, userId) {
  const token = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

  if (supabase) {
    await supabase.from('trip_shares').insert({
      booking_id: bookingId,
      user_id: userId,
      share_token: token,
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      created_at: new Date().toISOString(),
    })
  }

  const baseUrl = window.location.origin
  return `${baseUrl}/track/${token}`
}

/**
 * Share trip via platform share API or WhatsApp fallback.
 */
export async function shareTrip(bookingId, userId, driverName, pickupAddress) {
  const link = await createTripShareLink(bookingId, userId)

  const text = `I'm on a ride with ${driverName} via INDOO. Track my trip live: ${link}`

  // Try native share API first
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Track My Trip - INDOO', text, url: link })
      return true
    } catch { /* user cancelled or not supported */ }
  }

  // Fallback to WhatsApp
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  return true
}

/**
 * Send SOS alert during active trip.
 * Notifies emergency contacts + INDOO support.
 */
export async function sendSOSAlert(bookingId, userId, lat, lng) {
  if (supabase) {
    await supabase.from('sos_alerts').insert({
      booking_id: bookingId,
      user_id: userId,
      lat, lng,
      status: 'active',
      created_at: new Date().toISOString(),
    })
  }

  // Also notify user's emergency contacts
  if (supabase) {
    const { data: contacts } = await supabase
      .from('safety_contacts')
      .select('phone, display_name')
      .eq('user_id', userId)

    // Log for SMS dispatch (picked up by SMS service)
    if (contacts?.length) {
      for (const contact of contacts) {
        await supabase.from('failed_notifications').insert({
          user_id: userId,
          type: 'sos_alert',
          booking_id: bookingId,
          reason: `SOS to ${contact.display_name}: ${contact.phone}`,
          created_at: new Date().toISOString(),
        }).catch(() => {})
      }
    }
  }

  return true
}

/**
 * Get trip share data for public tracking page.
 */
export async function getTripShareData(shareToken) {
  if (!supabase) return null
  const { data } = await supabase
    .from('trip_shares')
    .select('*, bookings(*)')
    .eq('share_token', shareToken)
    .gt('expires_at', new Date().toISOString())
    .single()
  return data
}
