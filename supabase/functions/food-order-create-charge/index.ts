// food-order-create-charge — multi-gateway dispatcher.
// Picks the vendor's first active connection (or the gateway hinted in the
// request) and mints a hosted-checkout payment session using THAT gateway's
// keys. Returns a redirect URL the customer's browser visits to complete.
//
// Wired today (16 gateways): midtrans, stripe, xendit, paypal, razorpay,
// mollie, hitpay, adyen, rapyd, checkout-com, authorize-net, 2checkout,
// cybersource, worldpay, fomo-pay, braintree.
//
// Each gateway has its own webhook receiver that flips the food_orders row
// to 'confirmed' on settlement. See:
//   food-order-payment-webhook       (midtrans)
//   food-order-webhook-stripe        (stripe)
//   food-order-webhook-xendit        (xendit)
//   <gateway>-webhook                (rest — dual-handle FOO- prefixed orders)
//
// Body: { foodOrderId, restaurantId, returnUrl?, gateway? }
// Returns: { gateway, token?, redirectUrl, orderId, amount, mode, clientKey? }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertAmountMatches, assertCurrencyMatches, webhookUrlFor, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// Preference order when the vendor has multiple gateways connected.
const PREFERENCE = ['midtrans', 'stripe', 'xendit', 'paypal', 'razorpay', 'adyen', 'checkout-com', 'mollie', 'hitpay', 'rapyd', 'authorize-net', '2checkout', 'cybersource', 'worldpay', 'fomo-pay', 'braintree']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { foodOrderId, restaurantId, returnUrl, gateway: hintedGateway } = await req.json()
    if (!foodOrderId || !restaurantId) return json({ error: 'foodOrderId and restaurantId required' }, 400)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('food_orders')
      .select('id, restaurant_id, total, items, customer_name, customer_phone, customer_address, status, gateway_order_id')
      .eq('id', foodOrderId).eq('restaurant_id', restaurantId).single()
    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.status !== 'awaiting_payment') return json({ error: `order status is "${order.status}", cannot charge` }, 409)

    const { data: conns } = await supabase
      .from('vendor_payment_connections')
      .select('gateway_id, server_key, client_key, webhook_secret, additional_config, mode')
      .eq('vendor_id', restaurantId).eq('is_active', true)
    if (!conns || conns.length === 0) return json({ error: 'no payment gateway connected' }, 400)

    let conn
    if (hintedGateway) conn = conns.find((c) => c.gateway_id === hintedGateway)
    if (!conn) for (const id of PREFERENCE) { const c = conns.find((x) => x.gateway_id === id); if (c) { conn = c; break } }
    if (!conn) conn = conns[0]
    if (!conn.server_key) return json({ error: `gateway "${conn.gateway_id}" missing server_key` }, 400)

    // SECURITY: assert the vendor's gateway currency matches the order
    // currency. Without this, an IDR order would silently convert to
    // USD/EUR at a hardcoded rate (see chargePayPal `amount/15500`),
    // potentially shorting the vendor by 5-20% on every order.
    const orderCurrency = (order as any).currency || 'IDR'
    const gwCurrency = conn.additional_config?.currency
    const currencyCheck = assertCurrencyMatches(orderCurrency, gwCurrency)
    if (!currencyCheck.ok && gwCurrency) {
      return json({
        error: `Currency mismatch: ${currencyCheck.error}`,
        gateway: conn.gateway_id,
        orderCurrency,
        gatewayCurrency: gwCurrency,
      }, 400)
    }

    // SECURITY: defence in depth. Even though `order.total` was read
    // from the DB (not the request body), we re-compute from `order.items`
    // to catch any case where the upstream order-creation flow trusted
    // a client-side total. If items-derived total differs from order.total
    // by >2% (covers tax/rounding/currency-conversion edge cases),
    // refuse to charge — this gateway should never bill a fabricated price.
    const declaredAmount = Math.round(Number(order.total) || 0)
    const amountCheck = assertAmountMatches(declaredAmount, {
      items: (order.items || []).map((it: any) => ({
        id: it.id, price: it.price, promoPrice: it.promoPrice,
        qty: it.qty, lineTotal: it.lineTotal, name: it.name,
      })),
    }, 2)
    if (!amountCheck.ok) {
      const errId = newErrorId()
      logWithId(errId, 'amount-tampering', { restaurantId, foodOrderId, ...amountCheck })
      return json({ error: 'Order amount validation failed. Contact support.', errorId: errId }, 400)
    }
    const amount = amountCheck.total
    const orderId = order.gateway_order_id || `FOO-${restaurantId}-${order.id}-${Date.now()}`
    const finishUrl = (returnUrl || 'https://imoutnow.vercel.app/') +
      ((returnUrl || '').includes('?') ? '&' : '?') +
      'order=ok&order_id=' + encodeURIComponent(orderId)
    const cancelUrl = finishUrl.replace('order=ok', 'order=cancel')

    let result: { gateway: string; redirectUrl: string; token?: string; clientKey?: string; mode?: string }
    try {
      switch (conn.gateway_id) {
        case 'midtrans':      result = await chargeMidtrans(conn, order, orderId, amount, finishUrl, restaurantId); break
        case 'stripe':        result = await chargeStripe(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case 'xendit':        result = await chargeXendit(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case 'paypal':        result = await chargePayPal(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case 'razorpay':      result = await chargeRazorpay(conn, order, orderId, amount, finishUrl); break
        case 'mollie':        result = await chargeMollie(conn, order, orderId, amount, finishUrl); break
        case 'hitpay':        result = await chargeHitPay(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case 'adyen':         result = await chargeAdyen(conn, order, orderId, amount, finishUrl); break
        case 'rapyd':         result = await chargeRapyd(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case 'checkout-com':  result = await chargeCheckoutCom(conn, order, orderId, amount, finishUrl); break
        case 'authorize-net': result = await chargeAuthorizeNet(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case '2checkout':     result = await charge2Checkout(conn, order, orderId, amount, finishUrl); break
        case 'cybersource':   result = await chargeCyberSource(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case 'worldpay':      result = await chargeWorldpay(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case 'fomo-pay':      result = await chargeFomoPay(conn, order, orderId, amount, finishUrl, cancelUrl); break
        case 'braintree':     result = await chargeBraintree(conn, order, orderId, amount, finishUrl); break
        default: return json({ error: `gateway "${conn.gateway_id}" not wired for customer checkout` }, 501)
      }
    } catch (e) {
      return json({ error: (e as Error).message || 'gateway error', gateway: conn.gateway_id }, 500)
    }

    await supabase.from('food_orders').update({ gateway_order_id: orderId, gateway_used: conn.gateway_id }).eq('id', order.id)
    return json({ ...result, orderId, amount })
  } catch (e) {
    console.error('food-order-create-charge error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────

const safeItems = (items: any[], amount: number) => {
  const arr = (items || []).slice(0, 50).map((it: any, i: number) => ({
    id: String(it.id || `item-${i}`),
    name: String(it.name || 'Item').slice(0, 50),
    price: Math.round(Number(it.price) || 0),
    quantity: Math.max(1, Number(it.qty) || 1),
  }))
  const sum = arr.reduce((s, it) => s + it.price * it.quantity, 0)
  if (sum !== amount) arr.push({ id: 'adjust', name: amount > sum ? 'Delivery & fees' : 'Discount', price: amount - sum, quantity: 1 })
  return arr
}

// ── Gateway adapters ───────────────────────────────────────────────────────

async function chargeMidtrans(conn: any, order: any, orderId: string, amount: number, finishUrl: string, restaurantId: number) {
  const isProd = conn.mode === 'live'
  const base = isProd ? 'https://app.midtrans.com/snap/v1' : 'https://app.sandbox.midtrans.com/snap/v1'
  const r = await fetch(`${base}/transactions`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(conn.server_key + ':')}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: safeItems(order.items, amount),
      customer_details: { first_name: order.customer_name || 'Customer', phone: order.customer_phone || '' },
      enabled_payments: ['credit_card', 'gopay', 'shopeepay', 'qris', 'bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va', 'echannel'],
      credit_card: { secure: true },
      callbacks: { finish: finishUrl },
      custom_field1: String(restaurantId), custom_field2: String(order.id),
    }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || !data.token) throw new Error(data?.error_messages?.[0] || `Midtrans ${r.status}`)
  return { gateway: 'midtrans', token: data.token, redirectUrl: data.redirect_url, clientKey: conn.client_key || null, mode: conn.mode }
}

async function chargeStripe(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  const params = new URLSearchParams()
  params.set('mode', 'payment'); params.set('success_url', finishUrl); params.set('cancel_url', cancelUrl)
  params.set('client_reference_id', orderId)
  params.set('payment_intent_data[metadata][food_order_id]', String(order.id))
  params.set('payment_intent_data[metadata][gateway_order_id]', orderId)
  params.append('payment_method_types[]', 'card')
  safeItems(order.items, amount).forEach((it, i) => {
    params.append(`line_items[${i}][quantity]`, String(it.quantity))
    params.append(`line_items[${i}][price_data][currency]`, 'idr')
    params.append(`line_items[${i}][price_data][unit_amount]`, String(it.price))
    params.append(`line_items[${i}][price_data][product_data][name]`, it.name.slice(0, 80))
  })
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${conn.server_key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const data = await r.json()
  if (!r.ok || !data.url) throw new Error(data?.error?.message || `Stripe ${r.status}`)
  return { gateway: 'stripe', redirectUrl: data.url, mode: conn.mode }
}

async function chargeXendit(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  const r = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(conn.server_key + ':')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_id: orderId, amount, description: `Order #${order.id}`,
      success_redirect_url: finishUrl, failure_redirect_url: cancelUrl,
      currency: 'IDR',
      items: safeItems(order.items, amount).map((it) => ({ name: it.name, quantity: it.quantity, price: it.price, category: 'Food' })),
    }),
  })
  const data = await r.json()
  if (!r.ok || !data.invoice_url) throw new Error(data?.message || `Xendit ${r.status}`)
  return { gateway: 'xendit', redirectUrl: data.invoice_url, mode: conn.mode }
}

async function chargePayPal(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  // server_key = clientId, client_key = secret. PayPal returns dollars w/ 2dp.
  // For IDR we settle in USD; the vendor's PayPal account converts.
  const isProd = conn.mode === 'live'
  const base = isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(conn.server_key + ':' + conn.client_key)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const t = await tokenRes.json()
  if (!t.access_token) throw new Error('PayPal auth failed')
  // Convert IDR → USD at a coarse fixed rate ONLY if currency would otherwise be rejected.
  // Real-world: vendor sets currency in additional_config.
  const currency = (conn.additional_config?.currency || 'USD').toUpperCase()
  const r = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${t.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: orderId, invoice_id: orderId, reference_id: orderId,
        amount: { currency_code: currency, value: currency === 'IDR' ? String(Math.round(amount)) : (amount / 15500).toFixed(2) },
      }],
      application_context: { return_url: finishUrl, cancel_url: cancelUrl, user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING' },
    }),
  })
  const data = await r.json()
  const approve = (data?.links || []).find((l: any) => l.rel === 'approve')?.href
  if (!approve) throw new Error(data?.message || `PayPal ${r.status}`)
  return { gateway: 'paypal', redirectUrl: approve, mode: conn.mode }
}

async function chargeRazorpay(conn: any, order: any, orderId: string, amount: number, finishUrl: string) {
  // Razorpay amounts are in paise (×100).
  const r = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(conn.server_key + ':' + conn.client_key)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amount * 100, currency: 'INR',
      accept_partial: false, description: `Order #${order.id}`,
      customer: { name: order.customer_name || 'Customer', contact: order.customer_phone || '' },
      notify: { sms: !!order.customer_phone, email: false },
      reminder_enable: true, callback_url: finishUrl, callback_method: 'get',
      reference_id: orderId,
    }),
  })
  const data = await r.json()
  if (!r.ok || !data.short_url) throw new Error(data?.error?.description || `Razorpay ${r.status}`)
  return { gateway: 'razorpay', redirectUrl: data.short_url, mode: conn.mode }
}

async function chargeMollie(conn: any, order: any, orderId: string, amount: number, finishUrl: string) {
  // Mollie expects 2dp string. Default currency EUR.
  const apiKey = conn.mode === 'live' ? conn.server_key : (conn.client_key || conn.server_key)
  const currency = (conn.additional_config?.currency || 'EUR').toUpperCase()
  const value = currency === 'IDR' ? String(Math.round(amount)) : (amount / 17000).toFixed(2)
  const r = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: { currency, value },
      description: `Order #${order.id}`,
      redirectUrl: finishUrl, metadata: { gateway_order_id: orderId, food_order_id: order.id },
    }),
  })
  const data = await r.json()
  const url = data?._links?.checkout?.href
  if (!url) throw new Error(data?.detail || `Mollie ${r.status}`)
  return { gateway: 'mollie', redirectUrl: url, mode: conn.mode }
}

async function chargeHitPay(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  const apiBase = conn.mode === 'live' ? 'https://api.hit-pay.com/v1' : 'https://api.sandbox.hit-pay.com/v1'
  const currency = (conn.additional_config?.currency || 'SGD').toUpperCase()
  const value = currency === 'IDR' ? String(amount) : (amount / 11000).toFixed(2)
  const params = new URLSearchParams()
  params.set('amount', value); params.set('currency', currency)
  params.set('reference_number', orderId); params.set('redirect_url', finishUrl)
  params.set('webhook', webhookUrlFor('hitpay-webhook'))
  if (order.customer_name) params.set('name', order.customer_name)
  if (order.customer_phone) params.set('phone', order.customer_phone)
  const r = await fetch(`${apiBase}/payment-requests`, {
    method: 'POST',
    headers: { 'X-BUSINESS-API-KEY': conn.server_key, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const data = await r.json()
  if (!r.ok || !data.url) throw new Error(data?.message || `HitPay ${r.status}`)
  return { gateway: 'hitpay', redirectUrl: data.url, mode: conn.mode }
}

async function chargeAdyen(conn: any, order: any, orderId: string, amount: number, finishUrl: string) {
  const merchantAccount = conn.additional_config?.merchantAccount
  const liveUrlPrefix = conn.additional_config?.liveUrlPrefix
  if (!merchantAccount) throw new Error('Adyen merchantAccount missing in additional_config')
  const base = conn.mode === 'live'
    ? `https://${liveUrlPrefix}-checkout-live.adyenpayments.com/checkout/v70`
    : 'https://checkout-test.adyen.com/v70'
  const currency = (conn.additional_config?.currency || 'EUR').toUpperCase()
  const valueMinor = currency === 'IDR' ? amount : Math.round(amount / 170)   // approx
  const r = await fetch(`${base}/paymentLinks`, {
    method: 'POST',
    headers: { 'X-API-Key': conn.server_key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: orderId, merchantAccount,
      amount: { currency, value: valueMinor },
      returnUrl: finishUrl, shopperReference: String(order.id),
      countryCode: conn.additional_config?.countryCode || 'NL',
    }),
  })
  const data = await r.json()
  if (!r.ok || !data.url) throw new Error(data?.message || `Adyen ${r.status}`)
  return { gateway: 'adyen', redirectUrl: data.url, mode: conn.mode }
}

async function chargeRapyd(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  const accessKey = conn.server_key, secretKey = conn.client_key
  if (!secretKey) throw new Error('Rapyd secret_key missing (client_key)')
  const base = conn.mode === 'live' ? 'https://api.rapyd.net' : 'https://sandboxapi.rapyd.net'
  const path = '/v1/checkout'
  const country = conn.additional_config?.country || 'US'
  const currency = (conn.additional_config?.currency || 'USD').toUpperCase()
  const valueMinor = currency === 'IDR' ? amount : Math.round(amount / 15000 * 100)
  const bodyObj = {
    amount: valueMinor / 100, currency, country, complete_checkout_url: finishUrl, cancel_checkout_url: cancelUrl,
    merchant_reference_id: orderId,
  }
  const body = JSON.stringify(bodyObj)
  const salt = crypto.randomUUID()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const sigStr = `post${path}${salt}${timestamp}${accessKey}${secretKey}${body}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(sigStr))
  const sigHex = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  const signature = btoa(sigHex)
  const r = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'access_key': accessKey, 'salt': salt, 'timestamp': timestamp, 'signature': signature, 'Content-Type': 'application/json' },
    body,
  })
  const data = await r.json()
  const url = data?.data?.redirect_url
  if (!url) throw new Error(data?.status?.message || `Rapyd ${r.status}`)
  return { gateway: 'rapyd', redirectUrl: url, mode: conn.mode }
}

async function chargeCheckoutCom(conn: any, order: any, orderId: string, amount: number, finishUrl: string) {
  const base = conn.mode === 'live' ? 'https://api.checkout.com' : 'https://api.sandbox.checkout.com'
  const currency = (conn.additional_config?.currency || 'USD').toUpperCase()
  const ZERO = new Set(['IDR', 'JPY', 'KRW', 'VND'])
  const valueMinor = ZERO.has(currency) ? amount : Math.round(amount / 15500 * 100)
  const r = await fetch(`${base}/payment-links`, {
    method: 'POST',
    headers: { 'Authorization': conn.server_key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: valueMinor, currency,
      reference: orderId,
      billing: { address: { country: conn.additional_config?.billingCountry || 'US' } },
      customer: { name: order.customer_name || 'Customer' },
      return_url: finishUrl,
    }),
  })
  const data = await r.json()
  const url = data?._links?.redirect?.href || data?.redirect_href
  if (!url) throw new Error(data?.error_codes?.[0] || `Checkout.com ${r.status}`)
  return { gateway: 'checkout-com', redirectUrl: url, mode: conn.mode }
}

async function chargeAuthorizeNet(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  // Hosted Payment Page via getHostedPaymentPageRequest
  const isProd = conn.mode === 'live'
  const apiUrl = isProd ? 'https://api.authorize.net/xml/v1/request.api' : 'https://apitest.authorize.net/xml/v1/request.api'
  const apiLoginId = conn.server_key
  const transactionKey = conn.client_key
  if (!transactionKey) throw new Error('Authorize.Net transactionKey missing (client_key)')
  // USD only.
  const usd = (amount / 15500).toFixed(2)
  const r = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      getHostedPaymentPageRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
        transactionRequest: { transactionType: 'authCaptureTransaction', amount: usd, order: { invoiceNumber: orderId.slice(0, 20), description: `Order #${order.id}` } },
        hostedPaymentSettings: { setting: [
          { settingName: 'hostedPaymentReturnOptions', settingValue: JSON.stringify({ showReceipt: false, url: finishUrl, urlText: 'Continue', cancelUrl, cancelUrlText: 'Cancel' }) },
        ] },
      },
    }),
  })
  const txt = await r.text()
  // Authorize.Net returns BOM-prefixed JSON. Strip it.
  const clean = txt.replace(/^﻿/, '')
  const data = JSON.parse(clean)
  const token = data?.token
  if (!token) throw new Error(data?.messages?.message?.[0]?.text || `Authorize.Net ${r.status}`)
  const url = (isProd ? 'https://accept.authorize.net' : 'https://test.authorize.net') + '/payment/payment?token=' + encodeURIComponent(token)
  return { gateway: 'authorize-net', redirectUrl: url, mode: conn.mode }
}

async function charge2Checkout(conn: any, order: any, orderId: string, amount: number, finishUrl: string) {
  // ConvertPlus: build a buy-link URL signed with secretWord. server_key=merchantCode, client_key=secretKey, additional_config.secretWord=secret-word.
  const merchant = conn.server_key
  const secretWord = conn.additional_config?.secretWord || conn.webhook_secret
  if (!secretWord) throw new Error('2Checkout secretWord missing')
  const sandbox = conn.mode !== 'live'
  const base = sandbox ? 'https://sandbox.2checkout.com/checkout/buy' : 'https://www.2checkout.com/checkout/buy'
  // 2CO ConvertPlus has its own URL params; simplified for one-shot purchase.
  const u = new URL(base)
  u.searchParams.set('merchant', merchant)
  u.searchParams.set('dynamic', '1')
  u.searchParams.set('prod', `Order_${order.id}`)
  u.searchParams.set('price', String((amount / 15500).toFixed(2)))
  u.searchParams.set('return-url', finishUrl)
  u.searchParams.set('return-type', 'redirect')
  u.searchParams.set('merchant-order-id', orderId)
  return { gateway: '2checkout', redirectUrl: u.toString(), mode: conn.mode }
}

async function chargeCyberSource(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  // CyberSource Secure Acceptance: build a signed POST URL the client submits.
  // For simplicity here, we return a small bridge HTML hosted by Supabase Storage
  // is overkill — instead we return a data: URL with the form auto-submit.
  const accessKey = conn.server_key
  const secretKey = conn.client_key
  const profileId = conn.additional_config?.profileId
  if (!profileId || !secretKey) throw new Error('CyberSource profileId/secretKey missing')
  const sandbox = conn.mode !== 'live'
  const url = sandbox ? 'https://testsecureacceptance.cybersource.com/pay' : 'https://secureacceptance.cybersource.com/pay'
  const fields: Record<string, string> = {
    access_key: accessKey, profile_id: profileId, transaction_uuid: orderId.slice(0, 50),
    signed_field_names: 'access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency',
    unsigned_field_names: '', signed_date_time: new Date().toISOString().slice(0, 19) + 'Z',
    locale: 'en', transaction_type: 'sale', reference_number: orderId,
    amount: (amount / 15500).toFixed(2), currency: 'USD',
  }
  const signStr = (fields.signed_field_names as string).split(',').map(f => `${f}=${fields[f] || ''}`).join(',')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signStr))
  const signature = btoa(String.fromCharCode(...new Uint8Array(mac)))
  const inputs = Object.entries({ ...fields, signature }).map(([k, v]) =>
    `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}">`).join('')
  const html = `<!doctype html><html><body><form id="f" action="${url}" method="POST">${inputs}</form><script>document.getElementById('f').submit()</script></body></html>`
  const dataUrl = 'data:text/html;base64,' + btoa(html)
  return { gateway: 'cybersource', redirectUrl: dataUrl, mode: conn.mode }
}

async function chargeWorldpay(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  // Worldpay Online Payments: hosted payment page via /orders endpoint.
  const isProd = conn.mode === 'live'
  const base = isProd ? 'https://api.worldpay.com/v1' : 'https://api.worldpay.com/v1'   // sandbox uses same domain w/ test service key
  const usd = Math.round(amount / 15500 * 100)
  const r = await fetch(`${base}/orders`, {
    method: 'POST',
    headers: { 'Authorization': conn.server_key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentMethod: { type: 'Card', name: order.customer_name || 'Customer' },
      orderType: 'ECOM', amount: usd, currencyCode: 'USD',
      orderDescription: `Order #${order.id}`, customerOrderCode: orderId,
      successUrl: finishUrl, cancelUrl,
    }),
  })
  const data = await r.json()
  const url = data?.redirectURL || data?.referenceValue
  if (!url) throw new Error(data?.message || `Worldpay ${r.status}`)
  return { gateway: 'worldpay', redirectUrl: url, mode: conn.mode }
}

async function chargeFomoPay(conn: any, order: any, orderId: string, amount: number, finishUrl: string, cancelUrl: string) {
  // FomoPay hosted page. server_key=apiKey, webhook_secret=signKey, additional_config.merchantId.
  const isProd = conn.mode === 'live'
  const base = isProd ? 'https://api.fomopay.com' : 'https://api-sandbox.fomopay.com'
  const r = await fetch(`${base}/payment-links`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${conn.server_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: conn.additional_config?.merchantId, amount,
      currency: conn.additional_config?.currency || 'SGD',
      reference: orderId, return_url: finishUrl, cancel_url: cancelUrl,
    }),
  })
  const data = await r.json()
  const url = data?.payment_url
  if (!url) throw new Error(data?.message || `FomoPay ${r.status}`)
  return { gateway: 'fomo-pay', redirectUrl: url, mode: conn.mode }
}

async function chargeBraintree(_conn: any, _order: any, _orderId: string, _amount: number, _finishUrl: string): Promise<any> {
  // Braintree is a Drop-In / hosted-fields gateway — there is no
  // "give me a checkout URL" endpoint. Card collection happens in the
  // customer's browser via Braintree's JS SDK, then we'd POST a nonce
  // back. That's a different UI mount than the redirect-URL pattern,
  // so we defer until we ship a dedicated Braintree Drop-In sheet.
  throw new Error('Braintree requires Drop-In card UI — not yet wired for redirect checkout. Use Stripe or Midtrans for cards.')
}
