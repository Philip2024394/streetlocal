/**
 * giftService.js
 * Anonymous gifting via Indoo Marketplace.
 *
 * Privacy model:
 *  - Buyer never sees recipient address
 *  - Seller sees district-level area before acknowledgment
 *  - Full address revealed only via reveal_gift_address() RPC (SECURITY DEFINER)
 *  - Every reveal is logged to gift_address_views (immutable audit)
 *  - Address auto-expires 7 days after order creation
 */
import { supabase } from '@/lib/supabase'

// ── Indoo bike delivery tiers ───────────────────────────────────────────────
// Distance is measured from SELLER location to recipient — same-city radius.
// When the recipient is > 20 km from the seller, Indoo bike delivery is simply
// not shown; the seller can offer their own courier (nationwide) via their
// seller panel. The gift order still proceeds.
export const DELIVERY_TIERS = [
  { label: '0 – 3 km',   maxKm: 3,        fee: 5_000  },
  { label: '3 – 8 km',   maxKm: 8,        fee: 12_000 },
  { label: '8 – 15 km',  maxKm: 15,       fee: 22_000 },
  { label: '15 – 20 km', maxKm: 20,       fee: 35_000 },
]

/**
 * Returns the matching tier or null when outside Indoo local range (> 20 km).
 * Callers should treat null as "hide bike delivery — seller ships instead".
 */
export function getDeliveryTier(distanceKm) {
  if (distanceKm == null) return DELIVERY_TIERS[0]   // unknown → show cheapest tier
  return DELIVERY_TIERS.find(t => distanceKm <= t.maxKm) ?? null
}

/** Formats a number in IDR short-form. */
export function formatIDR(n) {
  if (!n && n !== 0) return '—'
  if (n === 0) return 'Free'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt IDR`
  return `Rp ${n.toLocaleString('id-ID')}`
}

// ── Order placement ───────────────────────────────────────────────────────────

/**
 * Create an anonymous gift order.
 * Returns { id, error }
 */
export async function placeGiftOrder({
  recipientId,
  sellerId,
  product,
  giftMessage,
  deliveryFee,
  distanceKm,
}) {
  if (!supabase) {
    // Demo mode — simulate success
    return { id: `demo-gift-${Date.now()}`, error: null }
  }

  const { data, error } = await supabase.rpc('place_gift_order', {
    p_recipient_id:    recipientId,
    p_seller_id:       sellerId,
    p_product_id:      String(product.id),
    p_product_name:    product.name,
    p_product_price:   Number(product.price),
    p_product_image:   product.image ?? product.image_url ?? null,
    p_product_variant: product.selectedVariant ?? null,
    p_gift_message:    giftMessage?.trim() || null,
    p_delivery_fee:    Number(deliveryFee ?? 0),
    p_distance_km:     distanceKm != null ? Number(distanceKm) : null,
  })

  if (error) return { id: null, error: error.message }
  return { id: data, error: null }
}

// ── Order queries ─────────────────────────────────────────────────────────────

/** Gifts this user has sent (as buyer). */
export async function getMyGiftsSent(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('gift_orders')
    .select('*')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

/** Gifts this user has received (as recipient). */
export async function getMyGiftsReceived(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('gift_orders')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

/** Gift orders for this seller's shop. */
export async function getSellerGiftOrders(sellerId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('gift_orders')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(30)
  return data ?? []
}

/** Update order status (seller). */
export async function updateGiftOrderStatus(orderId, status) {
  if (!supabase) return { error: null }
  const { error } = await supabase
    .from('gift_orders')
    .update({ status })
    .eq('id', orderId)
  return { error: error?.message ?? null }
}

// ── Address reveal (seller, SECURITY DEFINER) ─────────────────────────────────

/**
 * Reveals the full delivery address for an order.
 * Logs the view to gift_address_views and auto-acknowledges the order.
 *
 * Returns one of:
 *   { street, district, city, postal_code, country, instructions, expires_at }
 *   { error: 'address_expired' }
 *   { error: 'no_address' }
 *   { error: <message> }
 */
export async function revealDeliveryAddress(orderId) {
  if (!supabase) {
    // Demo: return a fake address
    return {
      street: 'Jl. Kemang Raya No. 45',
      district: 'Kemang',
      city: 'Jakarta Selatan',
      postal_code: '12730',
      country: 'Indonesia',
      instructions: 'Call before arriving',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  const { data, error } = await supabase.rpc('reveal_gift_address', {
    p_order_id: orderId,
  })
  if (error) return { error: error.message }
  return data
}

// ── Gift addresses (recipient sets once, used for all gift deliveries) ─────────

/** Upsert the user's gift delivery address. */
export async function saveGiftAddress(userId, { street, district, city, postalCode, country, instructions }) {
  if (!supabase) return { error: null }
  const { error } = await supabase
    .from('gift_addresses')
    .upsert(
      {
        user_id:      userId,
        street:       street.trim(),
        district:     district.trim(),
        city:         city.trim(),
        postal_code:  postalCode?.trim() ?? null,
        country:      country?.trim() ?? 'Indonesia',
        instructions: instructions?.trim() ?? null,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  return { error: error?.message ?? null }
}

/** Fetch the user's own saved gift address. */
export async function getMyGiftAddress(userId) {
  if (!supabase) return null
  const { data } = await supabase
    .from('gift_addresses')
    .select('street, district, city, postal_code, country, instructions')
    .eq('user_id', userId)
    .single()
  return data ?? null
}

/** Check if a user has a gift address saved (used before placing order). */
export async function hasGiftAddress(userId) {
  if (!supabase) return true  // demo: assume yes
  const { data } = await supabase
    .from('gift_addresses')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}
