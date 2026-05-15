// Midtrans Snap token creation.
// Customer hits "Pay" → frontend calls this function → we look up the
// vendor's server_key from vendor_payment_connections, hit Midtrans Snap
// API, and return the snap_token + client_key so the frontend can call
// window.snap.pay(snap_token, callbacks).
//
// Deploy: `supabase functions deploy midtrans-create-token`
// Env required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { vendorId, orderId, amount, customerName, customerPhone, items, deliveryFee, conversationId } = body

    if (!vendorId || !orderId || !amount) {
      return json({ error: 'vendorId, orderId, and amount are required' }, 400)
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

    // Vendor's Midtrans credentials
    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'midtrans')
      .single()

    if (connErr || !conn?.server_key || !conn.is_active) {
      return json({ error: 'Midtrans not configured or inactive for this vendor' }, 400)
    }

    const total = Math.round(Number(verifiedAmount))
    const itemsPayload = (items ?? []).map((it: any) => ({
      id: String(it.id ?? ''),
      price: Math.round(Number(it.price ?? 0)),
      quantity: Number(it.qty ?? 1),
      name: String(it.name ?? 'Item').slice(0, 50),
    }))
    if (deliveryFee && Number(deliveryFee) > 0) {
      itemsPayload.push({ id: 'delivery', price: Math.round(Number(deliveryFee)), quantity: 1, name: 'Delivery' })
    }

    // Persist the pending order so the webhook can join later
    await supabase.from('orders').insert({
      vendor_id: vendorId,
      conversation_id: conversationId ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
      items: items ?? [],
      subtotal: total - Number(deliveryFee || 0),
      delivery_fee: Number(deliveryFee || 0),
      total,
      currency: 'IDR',
      gateway_id: 'midtrans',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const midtransUrl = conn.mode === 'live'
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    const payload = {
      transaction_details: { order_id: orderId, gross_amount: total },
      customer_details: {
        first_name: customerName || 'Customer',
        phone: customerPhone || '',
      },
      item_details: itemsPayload,
    }

    const auth = 'Basic ' + btoa(conn.server_key + ':')
    const r = await fetch(midtransUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth, 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !result.token) {
      console.error('Midtrans token creation failed', result)
      return json({ error: result.error_messages?.join(', ') || 'Midtrans token creation failed', detail: result }, r.status || 500)
    }

    return json({ snapToken: result.token, clientKey: conn.client_key, mode: conn.mode, orderId })
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
