// Refund an Authorize.net transaction.
// Two-stage strategy:
//   1) Try voidTransaction — works for transactions not yet settled.
//   2) If that fails, try refundTransaction with just refTransId.
//      This requires the merchant's "Expanded Credit Capability" feature
//      enabled. Without it the API requires the masked card number
//      (XXXX1234) + masked expiry; that info we don't have because
//      Accept Hosted never exposes the card to us. Vendor will need
//      to enable Expanded Credit, or do the refund manually in the
//      Authorize.net dashboard.
//
// Deploy: `supabase functions deploy authorize-net-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ANET_API, anetRequest } from '../_shared/authorizenet.ts'
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
    const { orderId, amount } = body
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
      .select('vendor_id, gateway_id, gateway_transaction_id, total, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'authorize-net') return json({ error: 'order is not an Authorize.net payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Authorize.net trans id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'authorize-net')
      .single()

    const apiLoginId = (conn as any)?.server_key
    const transactionKey = (conn as any)?.client_key
    if (!apiLoginId || !transactionKey) return json({ error: 'vendor Authorize.net not configured' }, 400)
    const mode = (conn as any).mode || 'test'

    const refundAmount = (amount ? Number(amount) : Number(order.total)).toFixed(2)

    // Attempt 1: void (unsettled transactions)
    try {
      const voidPayload = {
        createTransactionRequest: {
          merchantAuthentication: { name: apiLoginId, transactionKey },
          transactionRequest: {
            transactionType: 'voidTransaction',
            refTransId: order.gateway_transaction_id,
          },
        },
      }
      const voidResult = await anetRequest(ANET_API(mode), voidPayload)
      const code = voidResult?.transactionResponse?.responseCode
      if (code === '1') {
        await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)
        return json({ ok: true, voided: true, transId: voidResult.transactionResponse.transId })
      }
      // fall through to refund attempt
    } catch (e: any) {
      // ignore — try refund next
    }

    // Attempt 2: refundTransaction (settled — requires Expanded Credit Capability)
    try {
      const refundPayload = {
        createTransactionRequest: {
          merchantAuthentication: { name: apiLoginId, transactionKey },
          transactionRequest: {
            transactionType: 'refundTransaction',
            amount: refundAmount,
            refTransId: order.gateway_transaction_id,
          },
        },
      }
      const refundResult = await anetRequest(ANET_API(mode), refundPayload)
      const code = refundResult?.transactionResponse?.responseCode
      if (code === '1') {
        await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)
        return json({ ok: true, refunded: true, transId: refundResult.transactionResponse.transId })
      }
      const errMsg = refundResult?.transactionResponse?.errors?.[0]?.errorText || 'refund declined'
      return json({ error: errMsg, detail: refundResult }, 500)
    } catch (e: any) {
      return json({
        error: e?.message || 'refund failed',
        hint: 'If this errors with "card information required", enable Expanded Credit Capability in your Authorize.net dashboard, or refund manually.',
        detail: e?.detail,
      }, 500)
    }
  } catch (e) {
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
