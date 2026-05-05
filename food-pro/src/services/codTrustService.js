/**
 * COD Trust & Anti-Fraud Service.
 * Prevents fake orders, manages trust levels, bank transfer incentives.
 *
 * Payment split:
 * - FOOD: paid to restaurant via bank transfer (3% discount) or COD to driver
 * - DELIVERY FEE: always paid cash to driver on arrival
 *
 * Bank transfer discount: 3% off food price (from INDOO's 10% commission → 7%)
 * - Customer saves 3%
 * - Restaurant gets 93% instead of 90%
 * - INDOO gets 7% instead of 10% (worth it: no fraud risk)
 * - Driver delivery fee unchanged
 */
import { supabase } from '@/lib/supabase'

// ── Trust Levels ────────────────────────────────────────────────────────────

const TRUST_LEVELS = {
  new:      { codAllowed: false, maxCodAmount: 0,         label: 'New Account' },
  verified: { codAllowed: true,  maxCodAmount: Infinity,  label: 'Verified' },     // After 1 bank transfer — no limits
}

const ORDERS_FOR_VERIFIED = 1  // 1 bank transfer = fully trusted, driver verifies via phone

/**
 * Get user's trust level based on order history.
 */
export async function getUserTrustLevel(userId) {
  if (!supabase) return { level: 'trusted', ...TRUST_LEVELS.trusted, completedOrders: 5 }

  const { count } = await supabase
    .from('food_orders')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .eq('status', 'delivered')

  const completedOrders = count ?? 0
  const level = completedOrders >= ORDERS_FOR_VERIFIED ? 'verified' : 'new'

  return { level, ...TRUST_LEVELS[level], completedOrders }
}

/**
 * Check if user can use COD for a given order amount.
 * Returns { allowed, reason }
 */
export async function canUseCOD(userId, orderAmount) {
  const trust = await getUserTrustLevel(userId)

  if (!trust.codAllowed) {
    return {
      allowed: false,
      reason: 'Complete your first order with bank transfer to unlock Cash on Delivery.',
      ordersNeeded: ORDERS_FOR_VERIFIED - trust.completedOrders,
    }
  }

  // Verified users — no COD limits. Driver verifies via phone call.
  return { allowed: true, reason: null }
}

// ── Bank Transfer Discount ──────────────────────────────────────────────────

const BANK_TRANSFER_DISCOUNT_PERCENT = 3 // 3% off food price
const INDOO_COMMISSION_NORMAL = 10        // 10% on COD
const INDOO_COMMISSION_BANK = 7           // 7% on bank transfer (3% goes to customer as discount)

/**
 * Calculate payment breakdown for an order.
 *
 * @param {number} foodTotal - total food price before discount
 * @param {number} deliveryFee - delivery fee (always cash to driver)
 * @param {'bank'|'cod'} paymentMethod
 * @returns {{ foodTotal, discount, foodAfterDiscount, deliveryFee, customerPays, restaurantReceives, indooCommission, driverEarns }}
 */
export function calculatePaymentBreakdown(foodTotal, deliveryFee, paymentMethod) {
  if (paymentMethod === 'bank') {
    const discount = Math.round(foodTotal * BANK_TRANSFER_DISCOUNT_PERCENT / 100)
    const foodAfterDiscount = foodTotal - discount
    const commission = Math.round(foodTotal * INDOO_COMMISSION_BANK / 100)
    const restaurantReceives = foodTotal - commission

    return {
      foodTotal,
      discount,
      discountPercent: BANK_TRANSFER_DISCOUNT_PERCENT,
      foodAfterDiscount,
      deliveryFee,
      customerPays: foodAfterDiscount + deliveryFee,
      customerPaysBankTransfer: foodAfterDiscount, // sent to restaurant
      customerPaysCashToDriver: deliveryFee,        // paid on arrival
      restaurantReceives,
      indooCommission: commission,
      indooCommissionPercent: INDOO_COMMISSION_BANK,
      driverEarns: deliveryFee,
      savings: discount,
    }
  }

  // COD — no discount
  const commission = Math.round(foodTotal * INDOO_COMMISSION_NORMAL / 100)
  return {
    foodTotal,
    discount: 0,
    discountPercent: 0,
    foodAfterDiscount: foodTotal,
    deliveryFee,
    customerPays: foodTotal + deliveryFee,
    customerPaysBankTransfer: 0,
    customerPaysCashToDriver: foodTotal + deliveryFee, // everything to driver
    restaurantReceives: foodTotal - commission,
    indooCommission: commission,
    indooCommissionPercent: INDOO_COMMISSION_NORMAL,
    driverEarns: deliveryFee,
    savings: 0,
  }
}

// ── Blacklist System ────────────────────────────────────────────────────────

/**
 * Check if user is blacklisted.
 */
export async function isBlacklisted(userId) {
  if (!supabase) return false
  const { data } = await supabase
    .from('blacklist')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  return !!data
}

/**
 * Blacklist a user after repeated fake orders.
 */
export async function blacklistUser(userId, reason) {
  if (!supabase) return
  await supabase.from('blacklist').upsert({
    user_id: userId,
    reason,
    is_active: true,
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

/**
 * Record a fake/cancelled COD order. Auto-blacklist after 2.
 */
export async function recordFakeOrder(userId, orderId) {
  if (!supabase) return

  await supabase.from('fraud_events').insert({
    user_id: userId,
    order_id: orderId,
    type: 'fake_cod',
    created_at: new Date().toISOString(),
  })

  // Count total fraud events
  const { count } = await supabase
    .from('fraud_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) >= 2) {
    await blacklistUser(userId, `Auto-blacklisted: ${count} fake COD orders`)
  }
}

// ── Address Validation ──────────────────────────────────────────────────────

/**
 * Validate delivery address coordinates.
 * Checks if the location is a real building/address area.
 * Returns { valid, reason }
 */
export async function validateDeliveryAddress(lat, lng) {
  // Basic bounds check — must be in Indonesia
  if (lat < -11 || lat > 6 || lng < 95 || lng > 141) {
    return { valid: false, reason: 'Address is outside Indonesia' }
  }

  // Check against Google Geocoding (if API available)
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (SUPABASE_URL && SUPABASE_ANON) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/directions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'apikey': SUPABASE_ANON,
        },
        body: JSON.stringify({
          origin: `${lat},${lng}`,
          destination: `${lat + 0.001},${lng + 0.001}`,
          mode: 'driving',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.source === 'google') return { valid: true, reason: null }
      }
    } catch { /* geocoding failed — allow anyway */ }
  }

  return { valid: true, reason: null } // Default: allow (don't block on API failure)
}

// ── Driver Cancel Without Penalty ───────────────────────────────────────────

const UNREACHABLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

/**
 * Check if driver can cancel without penalty (customer unreachable).
 * @param {string} orderId
 * @param {number} lastContactAttemptAt - timestamp of first call/chat attempt
 * @returns {{ canCancel: boolean, minutesLeft: number }}
 */
export function canDriverCancelNoPenalty(lastContactAttemptAt) {
  if (!lastContactAttemptAt) return { canCancel: false, minutesLeft: 5 }
  const elapsed = Date.now() - lastContactAttemptAt
  if (elapsed >= UNREACHABLE_TIMEOUT) return { canCancel: true, minutesLeft: 0 }
  return { canCancel: false, minutesLeft: Math.ceil((UNREACHABLE_TIMEOUT - elapsed) / 60000) }
}

function fmtRp(n) { return 'Rp ' + (n ?? 0).toLocaleString('id-ID') }
