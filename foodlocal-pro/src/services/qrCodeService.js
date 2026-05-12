/**
 * QR Code service for restaurant pickup verification.
 * Each restaurant gets a unique QR hash that drivers scan to confirm pickup.
 */
import { supabase } from '@/lib/supabase'

const QR_SECRET = 'indoo-qr-2026'

/**
 * Generate a SHA-256 hash for a restaurant QR code.
 */
async function generateHash(restaurantId) {
  const data = `${QR_SECRET}-${restaurantId}-${Date.now()}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24)
}

/**
 * Get or create QR hash for a restaurant.
 * Returns the hash string for encoding into QR.
 */
export async function getOrCreateQRHash(restaurantId) {
  if (!supabase) {
    // Demo mode: deterministic fake hash
    return `demo-qr-${restaurantId}`
  }

  // Check existing
  const { data: existing } = await supabase
    .from('restaurant_qr_codes')
    .select('qr_hash')
    .eq('restaurant_id', restaurantId)
    .single()

  if (existing?.qr_hash) return existing.qr_hash

  // Generate new
  const qrHash = await generateHash(restaurantId)
  await supabase.from('restaurant_qr_codes').upsert({
    restaurant_id: restaurantId,
    qr_hash: qrHash,
  })

  return qrHash
}

/**
 * Build the QR payload string (encoded into the QR image).
 */
export function buildQRPayload(restaurantId, qrHash) {
  return JSON.stringify({ rid: restaurantId, hash: qrHash, v: 1 })
}

/**
 * Verify a scanned QR code matches the expected restaurant.
 * Returns true if valid.
 */
export async function verifyQRScan(scannedPayload, expectedRestaurantId) {
  try {
    const { rid, hash } = JSON.parse(scannedPayload)

    // Demo mode
    if (!supabase) return rid === expectedRestaurantId || hash === `demo-qr-${expectedRestaurantId}`

    const { data } = await supabase
      .from('restaurant_qr_codes')
      .select('id')
      .eq('qr_hash', hash)
      .eq('restaurant_id', expectedRestaurantId)
      .single()

    return !!data
  } catch {
    return false
  }
}

/**
 * Regenerate QR hash for a restaurant (admin action).
 */
export async function regenerateQRHash(restaurantId) {
  const qrHash = await generateHash(restaurantId)
  if (supabase) {
    await supabase.from('restaurant_qr_codes').upsert({
      restaurant_id: restaurantId,
      qr_hash: qrHash,
    })
  }
  return qrHash
}
