// Refund a Midtrans transaction.
// Vendor presses "Refund" in their dashboard → frontend calls this with
// the orderId → we hit Midtrans `/v2/<order_id>/refund` and mark the
// order as refunded locally.
//
// Deploy: `supabase functions deploy midtrans-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireVendorAuth, assertOrderBelongsToVendor, jsonResponse, customerCors, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'

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
    const { orderId, reason, amount } = body
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_order_id, total, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'midtrans') return json({ error: 'order is not a Midtrans payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'midtrans')
      .single()

    if (!conn?.server_key) return json({ error: 'vendor Midtrans not configured' }, 400)

    const url = conn.mode === 'live'
      ? `https://api.midtrans.com/v2/${order.gateway_order_id}/refund`
      : `https://api.sandbox.midtrans.com/v2/${order.gateway_order_id}/refund`

    const refundAmount = Number(amount) || Number(order.total)
    const auth = 'Basic ' + btoa(conn.server_key + ':')
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth, 'Accept': 'application/json' },
      body: JSON.stringify({ amount: refundAmount, reason: reason || 'requested by vendor' }),
    })

    const result = await r.json().catch(() => ({}))
    if (!r.ok || (result.status_code && Number(result.status_code) >= 400)) {
      return json({ error: result.status_message || 'refund failed', detail: result }, 500)
    }

    await supabase
      .from('orders')
      .update({ payment_status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', orderId)

    return json({ ok: true, refundAmount })
  } catch (e) {
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
