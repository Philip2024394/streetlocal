// vendor-order-create-charge — multi-gateway dispatcher for products-local
// and services-local. Targets vendor_orders table (uuid PK, uuid vendor_id).
// Mirrors food-order-create-charge but lives separately so the two
// product lines can evolve independently.
//
// Body: { vendorOrderId, vendorId, returnUrl?, gateway? }
// Returns: { gateway, token?, redirectUrl, orderId, amount, mode, clientKey? }
//
// Order-id format: VND-<vendor_id>-<order_id>-<ts>
// Webhooks recognise the VND- prefix and route to vendor_orders.
//
// Deploy: `supabase functions deploy vendor-order-create-charge`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

const PREFERENCE = ['midtrans', 'stripe', 'xendit', 'paypal', 'razorpay', 'adyen', 'checkout-com', 'mollie', 'hitpay', 'rapyd']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { vendorOrderId, vendorId, returnUrl, gateway: hinted } = await req.json()
    if (!vendorOrderId || !vendorId) return json({ error: 'vendorOrderId and vendorId required' }, 400)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('vendor_orders')
      .select('id, vendor_id, total, subtotal, items, customer_name, customer_phone, customer_address, status, payment_status, gateway_order_id, module')
      .eq('id', vendorOrderId).eq('vendor_id', vendorId).single()
    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.payment_status === 'paid') return json({ error: 'order already paid' }, 409)

    const { data: conns } = await supabase
      .from('vendor_payment_connections')
      .select('gateway_id, server_key, client_key, webhook_secret, additional_config, mode')
      .eq('vendor_id', vendorId).eq('is_active', true)
    if (!conns || conns.length === 0) return json({ error: 'no payment gateway connected' }, 400)

    let conn
    if (hinted) conn = conns.find((c) => c.gateway_id === hinted)
    if (!conn) for (const id of PREFERENCE) { const c = conns.find((x) => x.gateway_id === id); if (c) { conn = c; break } }
    if (!conn) conn = conns[0]
    if (!conn.server_key) return json({ error: `gateway "${conn.gateway_id}" missing server_key` }, 400)

    const amount = Math.round(Number(order.total ?? order.subtotal) || 0)
    if (!amount) return json({ error: 'order amount is zero' }, 400)
    const orderId = order.gateway_order_id || `VND-${vendorId}-${String(order.id).replace(/-/g, '')}-${Date.now()}`
    const finishUrl = (returnUrl || 'https://imoutnow.vercel.app/') +
      ((returnUrl || '').includes('?') ? '&' : '?') +
      'order=ok&order_id=' + encodeURIComponent(orderId)
    const cancelUrl = finishUrl.replace('order=ok', 'order=cancel')

    let result: { gateway: string; redirectUrl: string; token?: string; clientKey?: string; mode?: string }
    if (conn.gateway_id === 'midtrans')      result = await chargeMidtrans(conn, order, orderId, amount, finishUrl)
    else if (conn.gateway_id === 'stripe')   result = await chargeStripe(conn, order, orderId, amount, finishUrl, cancelUrl)
    else if (conn.gateway_id === 'xendit')   result = await chargeXendit(conn, order, orderId, amount, finishUrl, cancelUrl)
    else return json({ error: `gateway "${conn.gateway_id}" not wired for customer checkout in this app yet — use Midtrans, Stripe, or Xendit` }, 501)

    await supabase.from('vendor_orders').update({
      gateway_order_id: orderId,
      gateway_used: conn.gateway_id,
      payment_status: 'pending',
      updated_at: new Date().toISOString(),
    }).eq('id', order.id)

    return json({ ...result, orderId, amount })
  } catch (e) {
    console.error('vendor-order-create-charge error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})

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

async function chargeMidtrans(conn: any, order: any, orderId: string, amount: number, finishUrl: string) {
  const base = conn.mode === 'live' ? 'https://app.midtrans.com/snap/v1' : 'https://app.sandbox.midtrans.com/snap/v1'
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
      custom_field1: String(order.vendor_id), custom_field2: String(order.id),
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
  params.set('payment_intent_data[metadata][vendor_order_id]', String(order.id))
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
      external_id: orderId, amount, description: `Order #${String(order.id).slice(-6)}`,
      success_redirect_url: finishUrl, failure_redirect_url: cancelUrl,
      currency: 'IDR',
      items: safeItems(order.items, amount).map((it) => ({ name: it.name, quantity: it.quantity, price: it.price, category: order.module || 'General' })),
    }),
  })
  const data = await r.json()
  if (!r.ok || !data.invoice_url) throw new Error(data?.message || `Xendit ${r.status}`)
  return { gateway: 'xendit', redirectUrl: data.invoice_url, mode: conn.mode }
}
