// subscription-create-checkout — vendor activates / upgrades their
// StreetLocal plan_level (starter / professional / enterprise).
//
// Two gateway paths, dispatched by the vendor's locked country:
//
//   Indonesia / SE Asia / India / MENA   → Midtrans Snap
//   US / UK / EU / AU / CA / NZ / SG / … → Stripe Checkout
//
// CENTRAL gateway accounts — server keys live in env vars, NOT in
// the vendor's `vendor_payment_connections` table (that's for the
// vendor's OWN customer-checkout flow).
//
// Required secrets:
//   MIDTRANS_SUBSCRIPTION_SERVER_KEY    SB-Mid-server-...  (sandbox)
//                                       Mid-server-...     (production)
//   MIDTRANS_SUBSCRIPTION_MODE          'sandbox' | 'production'
//   STRIPE_SUBSCRIPTION_SECRET_KEY      sk_test_...  /  sk_live_...
//
// Body: { vendorId, planLevel: 'starter'|'professional'|'enterprise',
//         returnUrl?: string, countryOverride?: 'US'|'GB'|... }
// Returns: { gateway, redirectUrl, token?, clientKey?, orderId, amount, currency }
//
// Deploy: `supabase functions deploy subscription-create-checkout`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { customerCors, jsonResponse, newErrorId, logWithId, requireVendorAuth } from '../_shared/paymentSecurity.ts'
import { PLAN_PRICING, resolvePlanMarket, getTierPrice, isValidPlanLevel, formatPriceForDisplay, type PlanLevel } from '../_shared/planPricing.ts'

const ORDER_PREFIX = 'SLP'  // "StreetLocal Plan" — distinguishes from the
                             // legacy SLS- prefix used by the older
                             // whatsapp/chat tier flow.

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: customerCors })
  if (req.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405)

  // Auth required — vendor must be logged in (we use their JWT to
  // confirm they're upgrading their OWN account, not someone else's).
  const auth = await requireVendorAuth(req)
  if ('error' in auth) return jsonResponse({ error: auth.error }, auth.status, customerCors)

  let body: { vendorId?: string, planLevel?: string, returnUrl?: string, countryOverride?: string }
  try { body = await req.json() } catch { return jsonResponse({ error: 'Invalid JSON body' }, 400) }

  const { vendorId, planLevel, returnUrl, countryOverride } = body
  if (!vendorId || vendorId !== auth.vendor_id) {
    return jsonResponse({ error: 'vendorId mismatch — cannot charge another vendor' }, 403, customerCors)
  }
  if (!isValidPlanLevel(planLevel)) {
    return jsonResponse({ error: 'planLevel must be starter / professional / enterprise' }, 400, customerCors)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // Vendor lookup — need country_locked + slug + email for the gateway.
  const { data: vendor, error: vendorErr } = await supabase
    .from('vendor_accounts')
    .select('id, shop_name, phone, slug, country_locked, plan_level, status')
    .eq('id', vendorId)
    .single()
  if (vendorErr || !vendor) return jsonResponse({ error: 'vendor not found' }, 404, customerCors)

  // Country resolution: prefer the locked country (set at signup by
  // resolve-pricing's geofence). countryOverride is allowed only when
  // no country is locked yet (first-time activation).
  let country = vendor.country_locked
  if (!country && countryOverride) country = countryOverride
  const market = resolvePlanMarket(country)
  const amount = getTierPrice(market, planLevel as PlanLevel)

  // Don't let a vendor "downgrade" via this flow. Downgrades go
  // through support to handle proration.
  const tierIdx = (t: string) => ['starter', 'professional', 'enterprise'].indexOf(t)
  if (vendor.plan_level && tierIdx(planLevel as string) < tierIdx(vendor.plan_level)) {
    return jsonResponse({ error: 'Downgrades go through support — email streetlocallive@gmail.com' }, 400, customerCors)
  }

  // Order id encodes plan_level for the webhook to read back.
  const slug = String(vendor.slug || vendor.id).slice(0, 16)
  const orderId = `${ORDER_PREFIX}-${planLevel}-${slug}-${Date.now()}`
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Pending payment row BEFORE we hit the gateway so the webhook
  // always lands on a real record. Includes plan_level so the
  // webhook handler can flip the vendor's plan_level field on success.
  await supabase.from('payment_records').insert({
    vendor_id: vendor.id,
    amount,
    currency: market.currency,
    period_start: new Date().toISOString(),
    period_end: periodEnd,
    status: 'pending',
    payment_method: 'pending',
    midtrans_order_id: orderId,
    notes: `StreetLocal ${planLevel} subscription · ${market.code} ${formatPriceForDisplay(market, planLevel as PlanLevel)}`,
  })

  // Stash on vendor so the client can poll progress.
  await supabase.from('vendor_accounts').update({
    subscription_order_id: orderId,
    subscription_provider: market.gateway,
    subscription_product: planLevel,
  }).eq('id', vendor.id)

  try {
    let result
    if (market.gateway === 'midtrans') {
      result = await checkoutViaMidtrans({
        orderId, amount, planLevel: planLevel as PlanLevel, market, vendor, returnUrl,
      })
    } else {
      result = await checkoutViaStripe({
        orderId, amount, planLevel: planLevel as PlanLevel, market, vendor, returnUrl,
      })
    }
    return jsonResponse({ ...result, orderId, amount, currency: market.currency })
  } catch (e) {
    const errId = newErrorId()
    logWithId(errId, 'subscription-checkout-fail', { vendorId, planLevel, country: market.code, error: String(e) })
    // Mark the payment record so we don't leak a "stuck pending" row.
    await supabase.from('payment_records').update({ status: 'failed', notes: `Gateway create failed: ${String(e).slice(0, 200)}` }).eq('midtrans_order_id', orderId)
    return jsonResponse({ error: (e as Error).message || 'gateway create failed', errorId: errId }, 502, customerCors)
  }
})

/* ── Midtrans (Indonesia + Asia) ─────────────────────────────── */

async function checkoutViaMidtrans (args: {
  orderId: string, amount: number, planLevel: PlanLevel,
  market: ReturnType<typeof resolvePlanMarket>,
  vendor: { id: string, shop_name?: string, phone?: string },
  returnUrl?: string,
}) {
  const serverKey = Deno.env.get('MIDTRANS_SUBSCRIPTION_SERVER_KEY')
  if (!serverKey) throw new Error('Midtrans subscription gateway not configured (MIDTRANS_SUBSCRIPTION_SERVER_KEY missing)')
  const isProd = (Deno.env.get('MIDTRANS_SUBSCRIPTION_MODE') || 'sandbox') === 'production'
  const base = isProd ? 'https://app.midtrans.com/snap/v1' : 'https://app.sandbox.midtrans.com/snap/v1'

  const finishUrl = (args.returnUrl || 'https://streetlocal.live/')
    + ((args.returnUrl || '').includes('?') ? '&' : '?')
    + `subscription=ok&order_id=${encodeURIComponent(args.orderId)}`

  const r = await fetch(`${base}/transactions`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(serverKey + ':')}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_details: { order_id: args.orderId, gross_amount: args.amount },
      item_details: [{
        id: `streetlocal-${args.planLevel}`,
        price: args.amount,
        quantity: 1,
        name: `StreetLocal ${args.planLevel} — 30 days`,
      }],
      customer_details: {
        first_name: args.vendor.shop_name || 'Vendor',
        phone: args.vendor.phone || '',
      },
      enabled_payments: ['credit_card', 'gopay', 'shopeepay', 'qris', 'bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va', 'echannel'],
      credit_card: { save_card: true, secure: true },
      callbacks: { finish: finishUrl },
      custom_field1: args.vendor.id,
      custom_field2: args.planLevel,
      custom_field3: args.market.code,
    }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || !data?.token) {
    throw new Error(data?.error_messages?.[0] || `Midtrans ${r.status}`)
  }
  return {
    gateway: 'midtrans' as const,
    token: data.token,
    redirectUrl: data.redirect_url,
    clientKey: null,
    mode: isProd ? 'live' : 'test',
  }
}

/* ── Stripe (International) ──────────────────────────────────── */

async function checkoutViaStripe (args: {
  orderId: string, amount: number, planLevel: PlanLevel,
  market: ReturnType<typeof resolvePlanMarket>,
  vendor: { id: string, shop_name?: string, phone?: string },
  returnUrl?: string,
}) {
  const secretKey = Deno.env.get('STRIPE_SUBSCRIPTION_SECRET_KEY')
  if (!secretKey) throw new Error('Stripe subscription gateway not configured (STRIPE_SUBSCRIPTION_SECRET_KEY missing)')

  const finishUrl = (args.returnUrl || 'https://streetlocal.live/')
    + ((args.returnUrl || '').includes('?') ? '&' : '?')
    + `subscription=ok&order_id=${encodeURIComponent(args.orderId)}`
  const cancelUrl = finishUrl.replace('subscription=ok', 'subscription=cancel')

  // Stripe Checkout Session — one-time payment (30 days). For true
  // recurring subscriptions we'd switch to mode=subscription + a Price
  // object, but per-tier prices vary by market — easier to charge
  // 30-day periods and let the vendor re-checkout for renewal.
  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('success_url', finishUrl)
  params.set('cancel_url', cancelUrl)
  params.set('client_reference_id', args.orderId)
  params.set('payment_intent_data[metadata][vendor_id]', args.vendor.id)
  params.set('payment_intent_data[metadata][plan_level]', args.planLevel)
  params.set('payment_intent_data[metadata][country]', args.market.code)
  params.set('payment_intent_data[metadata][order_id]', args.orderId)
  params.append('payment_method_types[]', 'card')
  params.append(`line_items[0][quantity]`, '1')
  params.append(`line_items[0][price_data][currency]`, args.market.currency.toLowerCase())
  params.append(`line_items[0][price_data][unit_amount]`, String(args.amount))
  params.append(`line_items[0][price_data][product_data][name]`, `StreetLocal ${args.planLevel} — 30 days`)
  params.append(`line_items[0][price_data][product_data][description]`, `Activation for ${args.vendor.shop_name || 'your shop'}`)

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const data = await r.json()
  if (!r.ok || !data?.url) {
    throw new Error(data?.error?.message || `Stripe ${r.status}`)
  }
  return {
    gateway: 'stripe' as const,
    redirectUrl: data.url as string,
    token: null,
    clientKey: null,
    mode: secretKey.startsWith('sk_live_') ? 'live' : 'test',
  }
}
