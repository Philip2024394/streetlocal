// StreetLocal subscription checkout — creates a Midtrans Snap token
// using StreetLocal's CENTRAL Midtrans account (env-var keys, NOT a
// vendor's vendor_payment_connections row). The vendor pays Rp 35.000
// (whatsapp tier) or Rp 50.000 (chat tier) for their monthly access.
//
// Flow:
//   1. Client (post-signup) calls this with { vendorId, planTier }
//   2. We compute the amount, build an order_id like SLS-<vendorId>-<ts>
//   3. POST to Midtrans Snap API with StreetLocal's server key
//   4. Insert a pending payment_records row keyed on midtrans_order_id
//   5. Return { token, redirectUrl } — client opens Snap modal or redirect
//   6. After Midtrans settles, the subscription-webhook function flips
//      vendor.status to 'active' and updates the same payment row
//
// Required env (set once via `supabase secrets set ...`):
//   MIDTRANS_SUBSCRIPTION_SERVER_KEY  — SB-Mid-server-... (sandbox) or Mid-server-... (prod)
//   MIDTRANS_SUBSCRIPTION_MODE        — 'sandbox' or 'production' (default sandbox)
//
// Deploy: `supabase functions deploy subscription-create-checkout`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// Pricing matrix by product + tier (Indonesian rupiah).
//   basic    — FoodLocal basic: 35k WhatsApp / 60k Chat
//   pro      — FoodLocal Pro:   100k WhatsApp / 150k Chat
//   products — Products Local:  35k WhatsApp / 60k Chat
//   services — Services Local:  35k WhatsApp / 60k Chat
// 'both' tier (basic only) lets the vendor pick the channel at checkout
// via the in-app picker; priced at the higher chat tier.
const PRICE_TABLE: Record<string, Record<string, number>> = {
  basic:    { whatsapp: 35000,  chat: 60000,  both: 60000 },
  pro:      { whatsapp: 100000, chat: 150000 },
  products: { whatsapp: 35000,  chat: 60000,  both: 60000 },
  services: { whatsapp: 35000,  chat: 60000,  both: 60000 },
}
const VALID_PRODUCTS = Object.keys(PRICE_TABLE)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    // product defaults to 'basic' so older callers keep working.
    const { vendorId, planTier, returnUrl, product = 'basic' } = body
    if (!vendorId) return json({ error: 'vendorId required' }, 400)
    if (!VALID_PRODUCTS.includes(product)) return json({ error: `product must be one of: ${VALID_PRODUCTS.join(', ')}` }, 400)
    const tierTable = PRICE_TABLE[product]
    if (!planTier || !(planTier in tierTable)) return json({ error: `planTier for product '${product}' must be one of: ${Object.keys(tierTable).join(', ')}` }, 400)

    const serverKey = Deno.env.get('MIDTRANS_SUBSCRIPTION_SERVER_KEY')
    if (!serverKey) return json({ error: 'subscription gateway not configured (MIDTRANS_SUBSCRIPTION_SERVER_KEY missing)' }, 500)
    const isProd = (Deno.env.get('MIDTRANS_SUBSCRIPTION_MODE') || 'sandbox') === 'production'
    const snapBase = isProd ? 'https://app.midtrans.com/snap/v1' : 'https://app.sandbox.midtrans.com/snap/v1'

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: vendor, error: vendorErr } = await supabase
      .from('vendor_accounts')
      .select('id, shop_name, phone, slug')
      .eq('id', vendorId)
      .single()
    if (vendorErr || !vendor) return json({ error: 'vendor not found' }, 404)

    const amount = tierTable[planTier]
    // SLS-<product>-<slug>-<ts> so webhook can distinguish basic vs pro orders
    // (both flow through the same webhook handler but may diverge later).
    const orderId = `SLS-${product}-${String(vendor.slug || vendor.id).slice(0, 18)}-${Date.now()}`

    // Pending payment row inserted BEFORE we hit Midtrans so the
    // webhook always has somewhere to land. amount and plan are echoed
    // here from Midtrans's perspective via order_id.
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('payment_records').insert({
      vendor_id: vendor.id,
      amount,
      period_start: new Date().toISOString(),
      period_end: periodEnd,
      status: 'pending',
      payment_method: 'card',                      // updated by webhook to the actual method
      midtrans_order_id: orderId,
      notes: `${product === 'pro' ? 'FoodLocal Pro' : 'FoodLocal'} ${planTier} subscription via Midtrans Snap`,
    })

    const snapPayload = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [{
        id: `subscription-${product}-${planTier}`,
        price: amount,
        quantity: 1,
        name: `${product === 'pro' ? 'FoodLocal Pro' : 'FoodLocal'} ${planTier === 'whatsapp' ? 'WhatsApp' : planTier === 'chat' ? 'Chat' : 'Both'} — 30 days`,
      }],
      customer_details: {
        first_name: vendor.shop_name || 'Vendor',
        phone: vendor.phone || '',
      },
      // Constrain methods to ones that make sense for a subscription:
      // cards (auto-renewable), e-wallets (Indonesian), bank transfer / VA, QRIS.
      enabled_payments: ['credit_card', 'gopay', 'shopeepay', 'qris', 'bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va', 'echannel'],
      // Save credit-card token so future renewals can charge silently.
      credit_card: { save_card: true, secure: true },
      // Callback brings the vendor back to wherever they came from with a
      // ?subscription=ok&order_id=... query so the client can poll for
      // status (webhook will have flipped vendor.status by then).
      callbacks: {
        finish: (returnUrl || 'https://streetlocal.live/food/chat/') + ((returnUrl || '').includes('?') ? '&' : '?') + 'subscription=ok&order_id=' + encodeURIComponent(orderId),
      },
      // Custom field carries the vendor + tier so the webhook can find them
      custom_field1: vendor.id,
      custom_field2: planTier,
    }

    const r = await fetch(`${snapBase}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(serverKey + ':')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapPayload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !(result as any).token) {
      await supabase.from('payment_records').update({ status: 'failed', notes: `Snap creation failed: ${JSON.stringify(result).slice(0, 200)}` }).eq('midtrans_order_id', orderId)
      return json({ error: (result as any).error_messages?.[0] || 'Midtrans Snap creation failed', detail: result }, r.status || 500)
    }

    // Store on the vendor so the client can find the in-flight order.
    // subscription_product (added by migration 20260518000000) records
    // which app tier this vendor pays for — drives renewal pricing too.
    await supabase.from('vendor_accounts').update({
      subscription_order_id: orderId,
      subscription_provider: 'midtrans',
      subscription_product: product,
    }).eq('id', vendor.id)

    return json({
      token: (result as any).token,
      redirectUrl: (result as any).redirect_url,
      orderId,
      amount,
      product,
      planTier,
    })
  } catch (e) {
    console.error('subscription-create-checkout error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
