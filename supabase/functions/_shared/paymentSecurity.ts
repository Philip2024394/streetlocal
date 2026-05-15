// ═══════════════════════════════════════════════════════════
// Shared payment-security helpers used by every gateway Edge
// Function. Closes the audit findings:
//
//   • Constant-time HMAC comparison           → constantTimeEq
//   • Webhook idempotency / state guard       → guardedStatusUpdate
//   • Refund authorization (vendor ownership) → requireVendorAuth
//   • Webhook CORS (preflight only, NO *)     → webhookCors
//   • Customer-facing CORS                    → customerCors
//   • Sandbox vs production key detection     → detectKeyMode
//   • Error IDs for support without leaking   → newErrorId / logWithId
//   • Server-side currency check              → assertCurrencyMatches
//
// Every gateway file must import from here instead of rolling its
// own. Single source of truth for the security surface.
// ═══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* ─── CORS ──────────────────────────────────────────────────── */

// For CUSTOMER-FACING endpoints (create-charge, create-link, etc.).
// Browser must be able to POST cross-origin → wildcard origin is OK.
export const customerCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// For WEBHOOK endpoints (called server-to-server by the gateway).
// No wildcard origin — browsers should NEVER be able to POST here.
// Allow preflight headers only so that legitimate platform tools
// (Supabase dashboard test invoke) can OPTIONS, but actual webhooks
// arrive without an Origin header from the gateway anyway.
export const webhookCors = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-callback-token, stripe-signature, x-razorpay-signature, x-hitpay-signature, anet-signature, paypal-transmission-sig, x-mollie-signature, x-adyen-hmac-signature, cko-signature',
}

export function jsonResponse (
  data: unknown,
  status = 200,
  corsHeaders: Record<string, string> = customerCors,
) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

/* ─── CONSTANT-TIME COMPARISON ──────────────────────────────── */

/**
 * Timing-safe string equality. Use whenever comparing an HMAC
 * signature to a computed one. A naive `===` returns early on the
 * first mismatched byte, leaking signature bytes via timing.
 */
export function constantTimeEq (a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/* ─── ERROR IDS ─────────────────────────────────────────────── */

/**
 * Generate an 8-char error ID. Returned to the caller AND logged
 * server-side with the full error detail. Support staff can grep
 * the logs for the ID instead of relying on customers to paraphrase
 * what went wrong.
 */
export function newErrorId (): string {
  return Math.random().toString(36).slice(2, 10)
}

export function logWithId (id: string, scope: string, payload: unknown) {
  console.error(`[${id}] ${scope}`, payload)
}

/* ─── KEY MODE DETECTION ────────────────────────────────────── */

export type KeyMode = 'test' | 'live' | 'unknown'

/**
 * Detect whether an API key is test or live by its prefix.
 * Covers the major gateways' standard naming conventions.
 * Returns 'unknown' if the prefix is unrecognised — caller decides
 * whether to allow that.
 */
export function detectKeyMode (key: string): KeyMode {
  if (!key) return 'unknown'
  const k = String(key).trim()
  // Stripe: sk_test_xxx / sk_live_xxx / pk_test_xxx / pk_live_xxx
  if (/^(sk|pk|rk)_test_/.test(k)) return 'test'
  if (/^(sk|pk|rk)_live_/.test(k)) return 'live'
  // Razorpay: rzp_test_xxx / rzp_live_xxx
  if (/^rzp_test_/.test(k)) return 'test'
  if (/^rzp_live_/.test(k)) return 'live'
  // Midtrans server keys: SB-Mid-server-xxx (sandbox) / Mid-server-xxx (live)
  if (/^SB-Mid-/.test(k)) return 'test'
  if (/^Mid-server-/.test(k)) return 'live'
  // Xendit: xnd_development_xxx / xnd_production_xxx
  if (/^xnd_development_/.test(k)) return 'test'
  if (/^xnd_production_/.test(k)) return 'live'
  // PayPal: sandbox/live differentiated at the API URL, not the key
  // Mollie: test_xxx / live_xxx
  if (/^test_/.test(k)) return 'test'
  if (/^live_/.test(k)) return 'live'
  return 'unknown'
}

/**
 * Throw if the key's mode doesn't match the declared mode (e.g. a
 * vendor pastes sk_test_ but selects "live" — would burn real
 * customers on a test endpoint or vice versa).
 */
export function assertKeyModeMatches (key: string, declaredMode: 'test' | 'live'): { ok: boolean, error?: string } {
  const detected = detectKeyMode(key)
  if (detected === 'unknown') return { ok: true } // gateway uses URL-based mode (e.g. PayPal)
  if (detected !== declaredMode) {
    return {
      ok: false,
      error: `Key looks like a ${detected} key but you selected ${declaredMode} mode. Either swap the key or change the mode setting.`,
    }
  }
  return { ok: true }
}

/* ─── VENDOR JWT AUTH ───────────────────────────────────────── */

/**
 * Extract the authenticated vendor_id from the request's
 * Authorization: Bearer <JWT> header. Returns null if no auth
 * or the JWT doesn't carry a vendor_id claim. Used by refund
 * endpoints + any vendor-only Edge Function.
 *
 * Verifies the JWT by calling supabase.auth.getUser() with the
 * token — this hits Supabase Auth's verification endpoint, so
 * we don't have to validate the signature ourselves.
 */
export async function requireVendorAuth (req: Request): Promise<{ vendor_id: string } | { error: string, status: number }> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: 'Missing Authorization header', status: 401 }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // getUser validates the JWT signature server-side.
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return { error: 'Invalid or expired session', status: 401 }

  const vendorId = (data.user.app_metadata as Record<string, unknown> | undefined)?.vendor_id
  if (!vendorId || typeof vendorId !== 'string') {
    return { error: 'No vendor_id claim in session', status: 403 }
  }
  return { vendor_id: vendorId }
}

/**
 * Confirm the order belongs to the vendor. Use AFTER requireVendorAuth
 * passes. Reads the order's vendor_id (or restaurant_id, depending on
 * the table) and rejects if it doesn't match.
 */
export async function assertOrderBelongsToVendor (
  supabase: ReturnType<typeof createClient>,
  table: 'orders' | 'vendor_orders' | 'food_orders',
  orderId: string,
  vendorId: string,
  fieldName: 'vendor_id' | 'restaurant_id' = 'vendor_id',
): Promise<{ ok: true, order: Record<string, unknown> } | { ok: false, error: string, status: number }> {
  const { data: order, error } = await supabase.from(table).select('*').eq('id', orderId).maybeSingle()
  if (error) return { ok: false, error: 'Order lookup failed', status: 500 }
  if (!order) return { ok: false, error: 'Order not found', status: 404 }
  if (order[fieldName] !== vendorId) return { ok: false, error: 'Order does not belong to your shop', status: 403 }
  return { ok: true, order }
}

/* ─── WEBHOOK IDEMPOTENCY ───────────────────────────────────── */

/**
 * Statuses considered TERMINAL — once an order reaches one of these,
 * subsequent webhooks for the same order shouldn't flip it back.
 */
export const TERMINAL_PAYMENT_STATUSES = new Set([
  'paid',         // food-basic 'orders' table
  'refunded',
  'confirmed',    // foodlocal-pro 'food_orders' table
  'cancelled',
  'delivered',
])

/**
 * Idempotent payment-status update.
 *
 * If the row is already in a terminal state matching what the
 * webhook is trying to set, this is a no-op. If the row is in a
 * DIFFERENT terminal state (e.g. webhook says 'paid' but already
 * 'refunded'), we DO NOT downgrade — return { skipped: true }.
 *
 * Otherwise, update with a freshness guard: only apply the update
 * if the row's current status is NOT a terminal state.
 *
 * Returns:
 *   { updated: true, before, after }    — happy path
 *   { updated: false, reason: 'already-final', currentStatus }
 *   { updated: false, reason: 'not-found' }
 *   { updated: false, reason: 'race', currentStatus } — concurrent webhook beat us
 */
export async function guardedStatusUpdate (
  supabase: ReturnType<typeof createClient>,
  params: {
    table: 'orders' | 'food_orders' | 'vendor_orders',
    matchColumn: 'id' | 'gateway_order_id',
    matchValue: string,
    nextStatus: string,
    statusColumn?: string, // defaults to 'payment_status' for orders, 'status' for food_orders
    patch?: Record<string, unknown>,
  },
): Promise<
  | { updated: true, before: Record<string, unknown>, after: Record<string, unknown> }
  | { updated: false, reason: 'not-found' | 'already-final' | 'race' | 'error', currentStatus?: string, error?: string }
> {
  const statusCol = params.statusColumn || (params.table === 'orders' ? 'payment_status' : 'status')
  const { data: rows, error: selErr } = await supabase
    .from(params.table)
    .select('*')
    .eq(params.matchColumn, params.matchValue)
    .limit(1)
  if (selErr) return { updated: false, reason: 'error', error: selErr.message }
  const before = rows?.[0]
  if (!before) return { updated: false, reason: 'not-found' }
  const currentStatus = String(before[statusCol] || '')

  // Already at a terminal status that's NOT what we're setting → don't downgrade.
  if (TERMINAL_PAYMENT_STATUSES.has(currentStatus) && currentStatus !== params.nextStatus) {
    return { updated: false, reason: 'already-final', currentStatus }
  }
  // Same terminal status → no-op (idempotent re-delivery).
  if (currentStatus === params.nextStatus) {
    return { updated: false, reason: 'already-final', currentStatus }
  }

  const patch = {
    ...(params.patch || {}),
    [statusCol]: params.nextStatus,
  }

  // Race-safe update: include the original status in the WHERE so a
  // concurrent webhook that already changed it loses the race.
  const { data: afterRows, error: updErr } = await supabase
    .from(params.table)
    .update(patch)
    .eq(params.matchColumn, params.matchValue)
    .eq(statusCol, currentStatus)
    .select()
  if (updErr) return { updated: false, reason: 'error', error: updErr.message }
  if (!afterRows || afterRows.length === 0) {
    // Lost the race — the row's status changed between SELECT and UPDATE.
    const { data: nowRows } = await supabase
      .from(params.table)
      .select(statusCol)
      .eq(params.matchColumn, params.matchValue)
      .limit(1)
    return { updated: false, reason: 'race', currentStatus: String(nowRows?.[0]?.[statusCol] || '') }
  }
  return { updated: true, before, after: afterRows[0] }
}

/* ─── SERVER-SIDE AMOUNT RECALCULATION ──────────────────────── */

/**
 * Recompute the order grand total from the items + tax + delivery
 * + promo discount. Used in create-charge endpoints to detect
 * client-side amount tampering (DevTools changing total to 1¢).
 *
 * Throws if the client's claimed amount differs from the server's
 * calculation by more than `tolerancePercent` (default 1%).
 */
export function recalculateOrderTotal (orderPayload: {
  items?: Array<{ price?: number, promoPrice?: number, qty?: number, lineTotal?: number }>,
  subtotal?: number,
  promo?: { discount?: number },
  delivery?: { fee?: number },
  tax?: { rate?: number, amount?: number, inclusive?: boolean },
}): { subtotal: number, discount: number, taxableBase: number, taxAmount: number, deliveryFee: number, total: number } {
  const items = orderPayload.items || []
  const subtotal = items.reduce((sum, it) => {
    const lineTotal = typeof it.lineTotal === 'number'
      ? it.lineTotal
      : (it.promoPrice || it.price || 0) * (it.qty || 0)
    return sum + lineTotal
  }, 0)
  const discount = Math.max(0, Math.min(subtotal, orderPayload.promo?.discount || 0))
  const discountedSubtotal = subtotal - discount
  const deliveryFee = Math.max(0, orderPayload.delivery?.fee || 0)
  const taxRate = Math.max(0, Math.min(100, orderPayload.tax?.rate || 0))
  const taxableBase = discountedSubtotal + deliveryFee
  const taxAmount = taxRate > 0
    ? (orderPayload.tax?.inclusive
        ? taxableBase - taxableBase / (1 + taxRate / 100)
        : taxableBase * taxRate / 100)
    : 0
  const total = taxRate > 0 && !orderPayload.tax?.inclusive
    ? taxableBase + taxAmount
    : taxableBase
  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    taxableBase: Math.round(taxableBase),
    taxAmount: Math.round(taxAmount),
    deliveryFee: Math.round(deliveryFee),
    total: Math.round(total),
  }
}

/**
 * Compare the client's claimed amount against the server's recalc.
 * Returns { ok: true, total } if within tolerance, or
 * { ok: false, error, serverTotal, claimedAmount } otherwise.
 */
export function assertAmountMatches (
  claimedAmount: number,
  orderPayload: Parameters<typeof recalculateOrderTotal>[0],
  tolerancePercent = 1,
): { ok: true, total: number } | { ok: false, error: string, serverTotal: number, claimedAmount: number } {
  const { total } = recalculateOrderTotal(orderPayload)
  if (total <= 0) return { ok: false, error: 'Order total is zero or invalid', serverTotal: total, claimedAmount }
  const diffPct = Math.abs(claimedAmount - total) / total * 100
  if (diffPct > tolerancePercent) {
    return {
      ok: false,
      error: `Amount tampering detected. Client claimed ${claimedAmount}, server calculated ${total} (${diffPct.toFixed(1)}% mismatch).`,
      serverTotal: total,
      claimedAmount,
    }
  }
  return { ok: true, total }
}

/* ─── CURRENCY VALIDATION ───────────────────────────────────── */

/**
 * Assert that the order's currency matches the vendor's gateway
 * operating currency. Prevents silent bad-rate conversion when a
 * vendor's Stripe account is USD but the customer's IDR order is
 * sent through.
 */
export function assertCurrencyMatches (
  orderCurrency: string,
  gatewayCurrency: string | null | undefined,
): { ok: true } | { ok: false, error: string } {
  if (!gatewayCurrency) return { ok: true } // vendor hasn't pinned a currency
  if (orderCurrency.toUpperCase() === gatewayCurrency.toUpperCase()) return { ok: true }
  return {
    ok: false,
    error: `Order is in ${orderCurrency} but your gateway account operates in ${gatewayCurrency}. Configure matching currency in your payment connection.`,
  }
}

/* ─── WEBHOOK URL BUILDER ───────────────────────────────────── */

/**
 * Build a webhook URL from the project's SUPABASE_URL. Replaces
 * hardcoded URLs that break when deployed to a different project.
 */
export function webhookUrlFor (functionName: string): string {
  const base = Deno.env.get('SUPABASE_URL') || ''
  return `${base.replace(/\/+$/, '')}/functions/v1/${functionName}`
}
