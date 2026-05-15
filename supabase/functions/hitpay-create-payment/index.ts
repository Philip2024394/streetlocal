// HitPay payment-request creation.
// Customer hits "Pay" → frontend calls this → we POST a payment-request
// with the vendor's API key, get back HitPay's hosted checkout URL,
// redirect the customer there. HitPay supports cards, PayNow QR
// (Singapore), Shopee Pay, GrabPay, Alipay, WeChat Pay.
//
// Deploy: `supabase functions deploy hitpay-create-payment`

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
    const { vendorId, orderId, amount, currency = 'SGD', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId, description } = body
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
      .select('mode, server_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'hitpay')
      .single()

    const apiKey = (conn as any)?.server_key
    if (connErr || !apiKey || !conn?.is_active) {
      return json({ error: 'HitPay not configured or inactive for this vendor' }, 400)
    }
    const mode = (conn as any).mode || 'test'

    // HitPay API base — sandbox vs live
    const apiBase = mode === 'live'
      ? 'https://api.hit-pay.com/v1'
      : 'https://api.sandbox.hit-pay.com/v1'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const webhookUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/hitpay-webhook`
    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'hitpay_status=success&order_id=' + encodeURIComponent(orderId)

    // Persist pending order — webhook joins via reference_number
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
      gateway_id: 'hitpay',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    // HitPay expects form-encoded body
    const desc = description || (items?.length ? (items as any[]).slice(0, 5).map((it) => `${it.qty}x ${it.name}`).join(', ').slice(0, 100) : `Order ${orderId}`)
    const form = new URLSearchParams()
    form.set('amount', Number(verifiedAmount).toFixed(2))
    form.set('currency', currency.toUpperCase())
    form.set('purpose', desc)
    form.set('reference_number', orderId)
    form.set('redirect_url', successUrl)
    form.set('webhook', webhookUrl)
    if (customerEmail) form.set('email', customerEmail)
    if (customerName) form.set('name', customerName)
    if (customerPhone) form.set('phone', customerPhone)
    form.set('send_email', customerEmail ? 'true' : 'false')
    form.set('send_sms', customerPhone ? 'true' : 'false')

    const r = await fetch(`${apiBase}/payment-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-BUSINESS-API-KEY': apiKey, 'X-Requested-With': 'XMLHttpRequest' },
      body: form.toString(),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !result.url) {
      console.error('HitPay payment request failed', result)
      return json({ error: result.message || 'HitPay payment request failed', detail: result }, r.status || 500)
    }

    // Stash HitPay's payment_request id for refund lookups (and webhook fallback join)
    await supabase.from('orders').update({ gateway_transaction_id: result.id }).eq('gateway_order_id', orderId)

    return json({ url: result.url, hitpayId: result.id, orderId })
  } catch (e) {
    console.error('hitpay-create-payment error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
