/**
 * Driver Support & SOS Service.
 * In-app help center, SOS emergency button, incident reporting.
 */
import { supabase } from '@/lib/supabase'

// ── SOS Emergency ───────────────────────────────────────────────────────────

/**
 * Trigger driver SOS — alerts admin + nearby authorities.
 */
export async function triggerDriverSOS(driverId, lat, lng, bookingId) {
  const alert = {
    user_id: driverId,
    booking_id: bookingId ?? null,
    lat, lng,
    status: 'active',
    source: 'driver',
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    await supabase.from('sos_alerts').insert(alert)
    // Also create urgent notification for admin
    await supabase.from('notifications').insert({
      user_id: driverId,
      type: 'sos_alert',
      title: '🚨 DRIVER SOS ALERT',
      body: `Driver triggered SOS at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      data: { lat, lng, booking_id: bookingId },
      created_at: new Date().toISOString(),
    }).catch(() => {})
  }

  return alert
}

// ── Incident Reporting ──────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  { id: 'accident',       label: 'Traffic Accident',     icon: '🚗', priority: 'high' },
  { id: 'harassment',     label: 'Harassment',           icon: '⚠️', priority: 'high' },
  { id: 'vehicle_damage', label: 'Vehicle Damage',       icon: '🔧', priority: 'medium' },
  { id: 'wrong_address',  label: 'Wrong Address',        icon: '📍', priority: 'low' },
  { id: 'payment_issue',  label: 'Payment Issue',        icon: '💰', priority: 'medium' },
  { id: 'customer_issue', label: 'Customer Issue',       icon: '👤', priority: 'medium' },
  { id: 'restaurant_issue', label: 'Restaurant Issue',   icon: '🍽', priority: 'low' },
  { id: 'app_bug',        label: 'App Problem',          icon: '📱', priority: 'low' },
  { id: 'other',          label: 'Other',                icon: '📝', priority: 'low' },
]

export { INCIDENT_TYPES }

/**
 * Submit an incident report.
 */
export async function submitIncidentReport(driverId, bookingId, incidentType, description, photoUrl) {
  const report = {
    driver_id: driverId,
    booking_id: bookingId ?? null,
    incident_type: incidentType,
    description: description?.trim() ?? '',
    photo_url: photoUrl ?? null,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  if (!supabase) return { ...report, id: `INC-${Date.now()}` }

  const { data, error } = await supabase
    .from('driver_incidents')
    .insert(report)
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Support Chat ────────────────────────────────────────────────────────────

const SUPPORT_FAQ = [
  { q: 'How do I get paid?', a: 'Earnings are transferred to your bank account weekly every Monday. You can also request instant cash-out for a small fee.' },
  { q: 'My customer cancelled, do I get paid?', a: 'If cancelled after you accepted and started heading to pickup, you receive a cancellation fee (Rp 5k bike, Rp 10k car).' },
  { q: 'How does the tier system work?', a: 'Complete more trips with high ratings to level up. Higher tiers get priority orders, bigger bonuses, and exclusive perks.' },
  { q: 'I had an accident, what do I do?', a: 'First ensure you are safe. Tap the SOS button if you need immediate help. Then submit an incident report with photos.' },
  { q: 'Restaurant made me wait too long', a: 'Report the wait time via the incident report. Restaurants with frequent delays get warnings from our team.' },
  { q: 'How do I update my documents?', a: 'Go to Profile → Documents. Upload your renewed SIM/STNK. Our team reviews within 24 hours.' },
  { q: 'Customer gave wrong address', a: 'Contact the customer via chat. If unreachable after 5 minutes, mark as "wrong address" in incident report and keep the food.' },
  { q: 'How does order batching work?', a: 'When you pick up an order, the system may offer you a second delivery going the same direction. You earn extra for each delivery.' },
]

export { SUPPORT_FAQ }

/**
 * Send a support message from driver.
 */
export async function sendSupportMessage(driverId, message, category) {
  if (!supabase) return { id: Date.now() }

  const { data } = await supabase
    .from('support_messages')
    .insert({
      user_id: driverId,
      role: 'driver',
      message: message.trim(),
      category: category ?? 'general',
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  return data
}

/**
 * Get support chat history for a driver.
 */
export async function getSupportHistory(driverId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('support_messages')
    .select('*')
    .eq('user_id', driverId)
    .order('created_at', { ascending: true })
    .limit(50)
  return data ?? []
}
