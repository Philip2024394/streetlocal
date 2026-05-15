// Refund a Worldpay Online order via POST /v1/orders/<orderCode>/refund.
//
// Deploy: `supabase functions deploy worldpay-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WP_API } from '../_shared/worldpay.ts'
import { requireVendorAuth, assertOrderBelongsToVendor, jsonResponse, customerCors, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// Same minor-unit handling as worldpay-charge.
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
    const { orderId, amount, reason } = body
    if (!orderId) return json({ error: 'orderId required' }, 400)

    // SECURITY: only the vendor who owns the order can refund it.
    // Without this, anyone with an order ID could refund any shop's
    // payment via this endpoint. The JWT comes from the vendor's
    // signed-in session (supabase.auth.signInWithPassword → JWT carries
    // app_metadata.vendor_id).
    const auth = await requireVendorAuth(req)
    if ('error' in auth) return jsonResponse({ error: auth.error }, auth.status, customerCors)
    const callerVendorId = auth.vendor_id

    // Confirm the order belongs to this vendor (or restaurant for food_orders).
    // Try the 'orders' table first (food-basic flow), then 'food_orders'
    // (foodlocal-pro flow). Match by id OR gateway_order_id depending on what
    // the caller passes.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = (await import('https://esm.sh/@supabase/supabase-js@2')).createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const orderIdToCheck = body.orderId || body.order_id || body.gatewayOrderId || body.gateway_order_id
    if (!orderIdToCheck) return jsonResponse({ error: 'orderId required' }, 400, customerCors)

    // Look up by gateway_order_id (most common) OR by primary id. Authorize against vendor_id (orders) or restaurant_id (food_orders).
    let ownership: { ok: boolean, error?: string } = { ok: false }
    const { data: orderRow } = await adminClient
      .from('orders')
      .select('id, vendor_id')
      .or(`id.eq.${orderIdToCheck},gateway_order_id.eq.${orderIdToCheck}`)
      .maybeSingle()
    if (orderRow) {
      if (orderRow.vendor_id !== callerVendorId) {
        const errId = newErrorId()
        logWithId(errId, 'refund-auth-fail', { callerVendorId, orderVendorId: orderRow.vendor_id, orderId: orderIdToCheck })
        return jsonResponse({ error: 'Order does not belong to your shop', errorId: errId }, 403, customerCors)
      }
      ownership = { ok: true }
    } else {
      // Fall through to food_orders (foodlocal-pro). restaurant_id is used there.
      const { data: foodRow } = await adminClient
        .from('food_orders')
        .select('id, restaurant_id')
        .or(`id.eq.${orderIdToCheck},gateway_order_id.eq.${orderIdToCheck}`)
        .maybeSingle()
      if (!foodRow) return jsonResponse({ error: 'Order not found' }, 404, customerCors)
      if (foodRow.restaurant_id !== callerVendorId) {
        const errId = newErrorId()
        logWithId(errId, 'refund-auth-fail', { callerVendorId, restaurantId: foodRow.restaurant_id, orderId: orderIdToCheck })
        return jsonResponse({ error: 'Order does not belong to your shop', errorId: errId }, 403, customerCors)
      }
      ownership = { ok: true }
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_transaction_id, total, currency, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'worldpay') return json({ error: 'order is not a Worldpay payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Worldpay orderCode recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'worldpay')
      .single()

    const serviceKey = (conn as any)?.server_key
    if (!serviceKey) return json({ error: 'vendor Worldpay not configured' }, 400)

    const refundBody: Record<string, unknown> = {
      refundAmount: toMinorUnits(Number(amount || order.total), order.currency || 'GBP'),
      refundCurrency: (order.currency || 'GBP').toUpperCase(),
      reference: (reason || `Refund order ${orderId}`).slice(0, 60),
    }

    const r = await fetch(`${WP_API}/orders/${order.gateway_transaction_id}/refund`, {
      method: 'POST',
      headers: { 'Authorization': serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(refundBody),
    })
    // Worldpay refund endpoint returns 200 with empty body on success.
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}))
      return json({ error: (detail as any).message || (detail as any).customCode || 'refund failed', detail }, r.status || 500)
    }

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)
    return json({ ok: true })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
