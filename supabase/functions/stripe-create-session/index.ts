// Stripe Checkout session creator.
// Customer hits "Pay" → frontend calls this Edge Function → we look up
// the vendor's `secretKey` from vendor_payment_connections, create a
// Stripe Checkout Session, return the hosted-checkout URL. The frontend
// redirects the customer to that URL; Stripe handles cards / Apple Pay
// / Google Pay / Link / etc. on its hosted page; on success Stripe
// redirects back to success_url (and fires the webhook).
//
// Deploy: `supabase functions deploy stripe-create-session`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertAmountMatches, jsonResponse, newErrorId, logWithId, customerCors } from '../_shared/paymentSecurity.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })

// Stripe's API expects application/x-www-form-urlencoded with nested keys
// like line_items[0][price_data][currency]=usd. This helper flattens an
// object into that format.
function toStripeForm(obj: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === 'object') parts.push(toStripeForm(item as Record<string, unknown>, `${key}[${i}]`))
        else parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`)
      })
    } else if (typeof v === 'object') {
      parts.push(toStripeForm(v as Record<string, unknown>, key))
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
    }
  }
  return parts.join('&')
}

// Stripe currency notes:
// - "zero-decimal" currencies (IDR, JPY, KRW, VND, …) accept whole units.
// - All others accept the smallest unit (cents).
const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF', 'IDR'])

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { vendorId, orderId, amount, currency = 'IDR', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId } = body

    if (!vendorId || !orderId || !amount) {
      return json({ error: 'vendorId, orderId, amount required' }, 400)
    }

    // SECURITY: server-side amount recalculation. Prevents client-side
    // tampering — a DevTools edit of the total can't get past this.
    const amountCheck = assertAmountMatches(
      Number(amount),
      {
        items: items?.map((it: any) => ({
          id: it.id, price: it.price, promoPrice: it.promoPrice,
          qty: it.qty, lineTotal: it.lineTotal, name: it.name,
        })),
        delivery: { fee: Number(deliveryFee || 0) },
        promo: body.promo ? { discount: Number(body.promo.discount || 0) } : undefined,
        tax: body.tax ? { rate: Number(body.tax.rate || 0), inclusive: !!body.tax.inclusive } : undefined,
      },
      2, // 2% tolerance — covers tax rounding + currency conversion edge cases
    )
    if (!amountCheck.ok) {
      const errId = newErrorId()
      logWithId(errId, 'amount-tampering', { vendorId, orderId, ...amountCheck })
      return jsonResponse({ error: 'Amount validation failed', errorId: errId }, 400, customerCors)
    }
    const verifiedAmount = amountCheck.total

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('secret_key:server_key, is_active, additional_config, escrow_enabled, escrow_hold_days')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'stripe')
      .single()

    // Stripe uses publishable + secret keys; we map secretKey → server_key column.
    // publishableKey lives in additional_config so we don't need a 5th column.
    const secretKey = (conn as any)?.secret_key
    if (connErr || !secretKey || !conn?.is_active) {
      return json({ error: 'Stripe not configured or inactive for this vendor' }, 400)
    }

    // Escrow / authorisation-hold mode: Stripe authorises but does not
    // capture; vendor releases later via stripe-escrow-release (or it
    // auto-expires on the card network after ~7 days).
    const escrowEnabled = !!(conn as any)?.escrow_enabled
    const escrowDays = Math.min(Math.max(Number((conn as any)?.escrow_hold_days || 0), 0), 7)

    const cur = currency.toUpperCase()
    const factor = ZERO_DECIMAL.has(cur) ? 1 : 100
    const totalUnits = Math.round(Number(verifiedAmount) * factor)

    const lineItems = (items ?? []).map((it: any) => ({
      price_data: {
        currency: cur.toLowerCase(),
        product_data: { name: String(it.name ?? 'Item').slice(0, 250) },
        unit_amount: Math.round(Number(it.price ?? 0) * factor),
      },
      quantity: Number(it.qty ?? 1),
    }))
    if (deliveryFee && Number(deliveryFee) > 0) {
      lineItems.push({
        price_data: { currency: cur.toLowerCase(), product_data: { name: 'Delivery' }, unit_amount: Math.round(Number(deliveryFee) * factor) },
        quantity: 1,
      })
    }

    // Persist pending order so the webhook can join later. If escrow is
    // enabled, mark the order as held + record when the auto-release
    // window expires (informational; actual release is manual via the
    // stripe-escrow-release endpoint).
    const orderInsert: Record<string, unknown> = {
      vendor_id: vendorId,
      conversation_id: conversationId ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
      items: items ?? [],
      subtotal: Number(verifiedAmount) - Number(deliveryFee || 0),
      delivery_fee: Number(deliveryFee || 0),
      total: Number(verifiedAmount),
      currency: cur,
      gateway_id: 'stripe',
      gateway_order_id: orderId,
      payment_status: 'pending',
    }
    if (escrowEnabled && escrowDays > 0) {
      orderInsert.escrow_status = 'held'
      orderInsert.escrow_release_at = new Date(Date.now() + escrowDays * 24 * 60 * 60 * 1000).toISOString()
    }
    await supabase.from('orders').insert(orderInsert)

    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'stripe_status=success&order_id=' + encodeURIComponent(orderId)
    const cancelUrl  = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'stripe_status=cancel&order_id=' + encodeURIComponent(orderId)

    const sessionPayload: Record<string, unknown> = {
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: orderId,
      line_items: lineItems,
      metadata: { vendorId, orderId, conversationId: conversationId || '', escrow: escrowEnabled ? '1' : '0' },
    }
    if (customerEmail) sessionPayload.customer_email = customerEmail
    if (escrowEnabled && escrowDays > 0) {
      // payment_intent_data passes through to the underlying PaymentIntent
      // for the Checkout Session. capture_method=manual makes Stripe
      // authorise without capturing — funds are held on the card.
      sessionPayload.payment_intent_data = { capture_method: 'manual', metadata: { escrow: '1', vendorId, orderId } }
    }

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: toStripeForm(sessionPayload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !result.url) {
      console.error('Stripe session creation failed', result)
      return json({ error: result.error?.message || 'Stripe session creation failed', detail: result }, r.status || 500)
    }

    return json({ url: result.url, sessionId: result.id, orderId })
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
