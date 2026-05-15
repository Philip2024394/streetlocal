// FOMO Pay online Cashier payment creation.
// Customer hits "Pay" → frontend calls this → we build a signed
// payment-request body, POST to FOMO Pay's online cashier endpoint,
// get back a hosted checkout URL, redirect the customer there.
// FOMO Pay specialises in WeChat Pay, Alipay, GrabPay, and other
// Asian e-wallets.
//
// Heads-up: FOMO Pay's API contract varies slightly by merchant account
// configuration. The signing scheme below (sorted params + &key=<signKey>
// then HMAC-SHA256, uppercase hex) is the modern default. If the vendor
// gets sign-mismatch errors, they should confirm their `signType` with
// FOMO Pay support.
//
// Deploy: `supabase functions deploy fomopay-create-payment`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { FOMO_API, fomoSign } from '../_shared/fomopay.ts'
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
      .select('mode, server_key, webhook_secret, additional_config, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'fomo-pay')
      .single()

    const apiKey = (conn as any)?.server_key
    const signKey = (conn as any)?.webhook_secret || apiKey
    const merchantId = (conn as any)?.additional_config?.merchantId
    if (connErr || !apiKey || !signKey || !merchantId || !conn?.is_active) {
      return json({ error: 'FOMO Pay not configured or inactive for this vendor' }, 400)
    }
    const mode = (conn as any).mode || 'test'
    const signType = (conn as any).additional_config?.signType || 'HMAC-SHA256'

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
      gateway_id: 'fomo-pay',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const notifyUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/fomopay-webhook`
    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'fomo_status=success&order_id=' + encodeURIComponent(orderId)

    // FOMO Pay amounts are in the smallest currency unit (cents for SGD/USD)
    const amountMinor = Math.round(Number(verifiedAmount) * 100)
    const desc = description || (items?.length ? (items as any[]).slice(0, 5).map((it) => `${it.qty}x ${it.name}`).join(', ').slice(0, 100) : `Order ${orderId}`)

    const params: Record<string, unknown> = {
      merchant_no: merchantId,
      order_no: orderId,
      amount: amountMinor,
      currency: currency.toUpperCase(),
      goods_name: desc.slice(0, 64),
      notify_url: notifyUrl,
      return_url: successUrl,
      timestamp: Math.floor(Date.now() / 1000),
      sign_type: signType,
      version: '1.0',
    }
    if (customerEmail) params.customer_email = customerEmail
    if (customerPhone) params.customer_phone = customerPhone
    if (customerName) params.customer_name = customerName

    params.sign = await fomoSign(params, signKey, signType)

    // Form-encoded body (FOMO Pay convention)
    const form = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => form.set(k, String(v)))

    const r = await fetch(`${FOMO_API(mode)}/online/v3/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: form.toString(),
    })
    const result = await r.json().catch(async () => ({ raw: await r.text() }))
    const checkoutUrl = result.checkout_url || result.payment_url || result.cashier_url || result.url
    if (!r.ok || !checkoutUrl) {
      console.error('FOMO Pay payment creation failed', result)
      return json({ error: result.error_msg || result.message || 'FOMO Pay payment creation failed', detail: result }, r.status || 500)
    }

    // Stash FOMO's own payment_id if returned (sometimes called `trade_no` or `transaction_id`)
    const fomoTxnId = result.trade_no || result.transaction_id || result.payment_id
    if (fomoTxnId) {
      await supabase.from('orders').update({ gateway_transaction_id: fomoTxnId }).eq('gateway_order_id', orderId)
    }

    return json({ url: checkoutUrl, fomoTxnId, orderId })
  } catch (e) {
    console.error('fomopay-create-payment error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
