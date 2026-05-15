// Refund an Adyen payment.
// Vendor presses "Refund" → we use the stored gateway_transaction_id
// (the pspReference Adyen returned in the AUTHORISATION webhook) and
// POST /v71/payments/<pspReference>/refunds.
//
// Deploy: `supabase functions deploy adyen-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { adyenApiBase, adyenMinorUnits } from '../_shared/adyen.ts'
import { requireVendorAuth, assertOrderBelongsToVendor, jsonResponse, customerCors, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'

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
    if (order.gateway_id !== 'adyen') return json({ error: 'order is not an Adyen payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Adyen pspReference recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, additional_config')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'adyen')
      .single()

    const apiKey = (conn as any)?.server_key
    const merchantAccount = (conn as any)?.additional_config?.merchantAccount
    const liveUrlPrefix = (conn as any)?.additional_config?.liveUrlPrefix
    if (!apiKey || !merchantAccount) return json({ error: 'vendor Adyen not configured' }, 400)
    const mode = (conn as any).mode || 'test'

    const cur = (order.currency || 'EUR').toUpperCase()
    const refundAmount = adyenMinorUnits(amount ? Number(amount) : Number(order.total), cur)

    const r = await fetch(`${adyenApiBase(mode, liveUrlPrefix)}/payments/${order.gateway_transaction_id}/refunds`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: { value: refundAmount, currency: cur },
        merchantAccount,
        merchantRefundReason: reason || 'OTHER',
        reference: `refund-${orderId}`,
      }),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result.message || result.errorMessage || 'refund failed', detail: result }, r.status || 500)

    // Adyen refunds are async — actual status comes via REFUND webhook.
    // Update locally to refunded so vendor UI shows the action took effect.
    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: result.pspReference, status: result.status })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
