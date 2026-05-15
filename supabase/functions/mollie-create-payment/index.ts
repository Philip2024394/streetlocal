// Mollie payment creation.
// Customer hits "Pay" → frontend calls this → we POST /v2/payments with
// the vendor's API key (live or test based on mode), get back a hosted
// checkout URL, redirect the customer there. Mollie supports iDEAL,
// Bancontact, SEPA, cards, PayPal, Klarna, Apple/Google Pay — the
// vendor enables which methods on Mollie's dashboard.
//
// Unique pattern: Mollie webhooks have NO signature. Instead they send
// only the payment id and we re-fetch GET /v2/payments/{id} to verify
// real status. Prevents spoofing — see mollie-webhook for details.
//
// Deploy: `supabase functions deploy mollie-create-payment`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertAmountMatches, jsonResponse, newErrorId, logWithId, customerCors } from '../_shared/paymentSecurity.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { vendorId, orderId, amount, currency = 'EUR', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId, description } = body
    if (!vendorId || !orderId || !amount) return json({ error: 'vendorId, orderId, amount required' }, 400)

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

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'mollie')
      .single()

    // server_key = live key, client_key = test key (Mollie ships separate keys per mode)
    const mode = (conn as any)?.mode || 'test'
    const apiKey = mode === 'live' ? (conn as any)?.server_key : (conn as any)?.client_key
    if (connErr || !apiKey || !conn?.is_active) {
      return json({ error: `Mollie ${mode} key missing or vendor inactive` }, 400)
    }

    // Build the webhook URL — we tell Mollie to call back here
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const webhookUrl = `${supabaseUrl.replace('//', '//').replace(/\/$/, '')}/functions/v1/mollie-webhook`

    const redirectSuccessUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'mollie_status=success&order_id=' + encodeURIComponent(orderId)

    // Mollie expects amounts as fixed-decimal strings ("10.00").
    // Most currencies have 2 decimals; JPY has 0.
    const decimals = currency.toUpperCase() === 'JPY' ? 0 : 2
    const amountStr = Number(verifiedAmount).toFixed(decimals)

    // Insert pending order — Mollie webhook will look it up via metadata.orderId
    await supabase.from('orders').insert({
      vendor_id: vendorId,
      conversation_id: conversationId ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
      items: items ?? [],
      subtotal: Number(verifiedAmount) - Number(deliveryFee || 0),
      delivery_fee: Number(deliveryFee || 0),
      total: Number(verifiedAmount),
      currency: currency.toUpperCase(),
      gateway_id: 'mollie',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const desc = description || (items?.length ? (items as any[]).slice(0, 5).map((it) => `${it.qty}x ${it.name}`).join(', ').slice(0, 255) : `Order ${orderId}`)

    const payload: Record<string, unknown> = {
      amount: { currency: currency.toUpperCase(), value: amountStr },
      description: desc,
      redirectUrl: redirectSuccessUrl,
      webhookUrl,
      // SECURITY: gateway_order_id in metadata is what mollie-webhook
      // checks to confirm a payment id legitimately belongs to this
      // order. Without this exact key the webhook rejects (closes the
      // attack where someone guesses a real payment id).
      metadata: { vendorId, gateway_order_id: orderId, orderId, conversationId: conversationId || '' },
    }
    if (customerName) payload.billingAddress = { givenName: customerName, ...(customerEmail ? { email: customerEmail } : {}) }

    const r = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !result._links?.checkout?.href) {
      console.error('Mollie payment creation failed', result)
      return json({ error: result.detail || result.title || 'Mollie payment creation failed', detail: result }, r.status || 500)
    }

    // Stash Mollie's payment id so refunds can use it later
    await supabase.from('orders').update({ gateway_transaction_id: result.id }).eq('gateway_order_id', orderId)

    return json({ url: result._links.checkout.href, molliePaymentId: result.id, orderId })
  } catch (e) {
    console.error('mollie-create-payment error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
