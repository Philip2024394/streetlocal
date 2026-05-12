// PayPal Orders v2 — create an order with intent CAPTURE and return the
// "approve" link. The frontend redirects the customer to that URL; PayPal
// handles login, card-or-balance choice, etc. on its hosted page and
// returns the customer to our return_url. PayPal also sends a webhook
// (CHECKOUT.ORDER.APPROVED + PAYMENT.CAPTURE.COMPLETED) which we use to
// flip the order to paid.
//
// Deploy: `supabase functions deploy paypal-create-order`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PAYPAL_API, paypalAccessToken } from '../_shared/paypal.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// PayPal currencies use 2 decimal places (with a few zero-decimal ones for HUF/JPY/TWD).
// IDR is supported but cross-border is restricted; vendors typically settle in USD.
const ZERO_DECIMAL = new Set(['HUF', 'JPY', 'TWD'])

function fmtMoney(n: number, currency: string): string {
  return ZERO_DECIMAL.has(currency.toUpperCase())
    ? Math.round(n).toString()
    : Number(n).toFixed(2)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { vendorId, orderId, amount, currency = 'USD', items, customerName, customerEmail, deliveryFee, returnUrl, conversationId, customerPhone } = body
    if (!vendorId || !orderId || !amount) return json({ error: 'vendorId, orderId, amount required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'paypal')
      .single()

    // For PayPal: server_key holds clientId, client_key holds secret
    const clientId = (conn as any)?.server_key
    const secret   = (conn as any)?.client_key
    if (connErr || !clientId || !secret || !conn?.is_active) {
      return json({ error: 'PayPal not configured or inactive for this vendor' }, 400)
    }
    const mode = conn.mode || 'test'

    // Insert pending order for webhook join
    await supabase.from('orders').insert({
      vendor_id: vendorId,
      conversation_id: conversationId ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
      items: items ?? [],
      subtotal: Number(amount) - Number(deliveryFee || 0),
      delivery_fee: Number(deliveryFee || 0),
      total: Number(amount),
      currency: currency.toUpperCase(),
      gateway_id: 'paypal',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const cur = currency.toUpperCase()
    const itemTotal = (items ?? []).reduce((s: number, it: any) => s + Number(it.price ?? 0) * Number(it.qty ?? 1), 0)
    const ship = Number(deliveryFee || 0)

    const orderPayload: Record<string, unknown> = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId,
        custom_id: orderId,
        amount: {
          currency_code: cur,
          value: fmtMoney(Number(amount), cur),
          breakdown: {
            item_total: { currency_code: cur, value: fmtMoney(itemTotal, cur) },
            ...(ship > 0 ? { shipping: { currency_code: cur, value: fmtMoney(ship, cur) } } : {}),
          },
        },
        items: (items ?? []).map((it: any) => ({
          name: String(it.name ?? 'Item').slice(0, 127),
          quantity: String(it.qty ?? 1),
          unit_amount: { currency_code: cur, value: fmtMoney(Number(it.price ?? 0), cur) },
          category: 'PHYSICAL_GOODS',
        })),
      }],
      application_context: {
        return_url: (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'paypal_status=success&order_id=' + encodeURIComponent(orderId),
        cancel_url: (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'paypal_status=cancel&order_id=' + encodeURIComponent(orderId),
        brand_name: 'StreetLocal',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    }
    if (customerEmail) {
      (orderPayload as any).payer = { email_address: customerEmail }
    }

    const accessToken = await paypalAccessToken(clientId, secret, mode)
    const r = await fetch(`${PAYPAL_API(mode)}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(orderPayload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !result.id) {
      console.error('PayPal order creation failed', result)
      return json({ error: result.message || result.error_description || 'PayPal order creation failed', detail: result }, r.status || 500)
    }

    // Update local row with PayPal's own order id (used in webhook + capture)
    await supabase.from('orders').update({ gateway_transaction_id: result.id }).eq('gateway_order_id', orderId)

    const approveLink = (result.links || []).find((l: any) => l.rel === 'approve')?.href
    if (!approveLink) return json({ error: 'PayPal returned no approve link', detail: result }, 500)

    return json({ url: approveLink, paypalOrderId: result.id, orderId })
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
