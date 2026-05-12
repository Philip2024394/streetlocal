// Worldpay Online — server-side charge using a card token from Worldpay.js.
// Customer enters card in the Worldpay.js iframe → SDK returns tk_..token →
// food-basic calls this endpoint with the token + order info → we POST
// to https://api.worldpay.com/v1/orders to authorise + capture.
//
// Deploy: `supabase functions deploy worldpay-charge`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WP_API } from '../_shared/worldpay.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// Worldpay amounts are in the smallest currency unit (cents/pence).
// Zero-decimal: JPY, KRW, IDR (rare on Worldpay but covered).
// Three-decimal: BHD, JOD, KWD, OMR, TND.
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'IDR', 'VND'])
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND'])
function toMinorUnits(amount: number, currency: string): number {
  const c = (currency || 'GBP').toUpperCase()
  if (ZERO_DECIMAL.has(c)) return Math.round(amount)
  if (THREE_DECIMAL.has(c)) return Math.round(amount * 1000)
  return Math.round(amount * 100)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { vendorId, orderId, token, amount, currency = 'GBP', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description } = body
    if (!vendorId || !orderId || !amount || !token) return json({ error: 'vendorId, orderId, amount, token required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'worldpay')
      .single()

    const serviceKey = (conn as any)?.server_key
    if (connErr || !serviceKey || !conn?.is_active) {
      return json({ error: 'Worldpay not configured or inactive for this vendor' }, 400)
    }

    // Insert the order row (pending) BEFORE we hit Worldpay so we have a
    // local record even if the charge fails.
    await supabase.from('orders').insert({
      vendor_id: vendorId,
      conversation_id: conversationId ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
      items: items ?? [],
      subtotal: Number(amount) - Number(deliveryFee || 0),
      delivery_fee: Number(deliveryFee || 0),
      total: Number(amount),
      currency: (currency || 'GBP').toUpperCase(),
      gateway_id: 'worldpay',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const wpBody = {
      token,
      orderType: 'ECOM',
      amount: toMinorUnits(Number(amount), currency),
      currencyCode: (currency || 'GBP').toUpperCase(),
      name: customerName || 'StreetLocal customer',
      orderDescription: description || `Order ${orderId}`,
      customerOrderCode: orderId,
      billingAddress: {
        // Worldpay requires *some* billing address even for token charges.
        // The Worldpay.js form collects this from the customer; here we
        // pass through whatever the client forwarded (or sensible blanks).
        address1: body.billingAddress1 || 'N/A',
        postalCode: body.billingPostal || 'N/A',
        city: body.billingCity || 'N/A',
        countryCode: (body.billingCountry || 'GB').toUpperCase(),
      },
      ...(customerEmail ? { shopperEmailAddress: customerEmail } : {}),
    }

    const r = await fetch(`${WP_API}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wpBody),
    })
    const result = await r.json().catch(() => ({}))

    if (!r.ok || !result.orderCode) {
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('gateway_order_id', orderId)
      return json({ error: result.message || result.customCode || 'charge failed', detail: result }, r.status || 500)
    }

    // paymentStatus: AUTHORIZED / SUCCESS / FAILED / SENT_FOR_REFUND etc.
    const status = String(result.paymentStatus || '').toUpperCase()
    let paymentStatus = 'pending'
    if (status === 'SUCCESS' || status === 'AUTHORIZED' || status === 'SETTLED' || status === 'CAPTURED') paymentStatus = 'paid'
    else if (status === 'FAILED' || status === 'REFUSED' || status === 'ERROR') paymentStatus = 'failed'

    const patch: Record<string, unknown> = {
      payment_status: paymentStatus,
      gateway_transaction_id: result.orderCode,
    }
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    await supabase.from('orders').update(patch).eq('gateway_order_id', orderId)

    return json({ ok: paymentStatus === 'paid', paymentStatus, orderCode: result.orderCode, detail: result })
  } catch (e) {
    console.error('worldpay-charge error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
