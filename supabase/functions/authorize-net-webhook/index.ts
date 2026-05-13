// Authorize.net webhook receiver.
// Authorize.net sends Standard Webhooks events when transactions change
// state. Each is signed with HMAC-SHA512 of the raw body using the
// per-vendor Signature Key (Account → Settings → Signature Key).
// Header: X-ANET-Signature: sha512=<HEX>
//
// Configure in Account → Settings → Webhooks → Add Endpoint:
//   URL: https://<project>.supabase.co/functions/v1/authorize-net-webhook
//   Events: net.authorize.payment.authcapture.created,
//           net.authorize.payment.refund.created,
//           net.authorize.payment.void.created,
//           net.authorize.payment.priorAuthCapture.created,
//           net.authorize.payment.authorization.created (optional)
//
// Deploy: `supabase functions deploy authorize-net-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyAnetWebhook } from '../_shared/authorizenet.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-anet-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const rawBody = await req.text()
    const sigHeader = req.headers.get('x-anet-signature') || ''

    let event: any
    try { event = JSON.parse(rawBody) } catch { return new Response('invalid json', { status: 400, headers: corsHeaders }) }

    // Authorize.net event shape:
    // { notificationId, eventType, eventDate, webhookId, payload: { responseCode, authCode, avsResponse, authAmount, invoiceNumber, entityName, id } }
    const data = event?.payload || {}
    const invoiceNumber = data.invoiceNumber || data.merchantReferenceId
    const trxnId = data.id
    if (!invoiceNumber && !trxnId) {
      console.warn('anet webhook: no invoice/id', event?.eventType)
      return new Response('no ref', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Try lookup by invoiceNumber first (our orderId may be truncated to 20 chars
    // in the original request — that's an Authorize.net limit). If miss, try
    // by transaction id stored from a previous webhook.
    const isFoodOrder = String(invoiceNumber || '').startsWith('FOO-')
    let order: any = null
    let foodOrderRef: string | null = null
    if (isFoodOrder) {
      const { data: fo } = await supabase
        .from('food_orders')
        .select('id, restaurant_id, gateway_order_id')
        .ilike('gateway_order_id', `${invoiceNumber}%`)
        .limit(1)
        .maybeSingle()
      if (fo) { order = { id: fo.id, vendor_id: fo.restaurant_id }; foodOrderRef = fo.gateway_order_id }
    } else if (invoiceNumber) {
      const { data: o } = await supabase
        .from('orders')
        .select('id, vendor_id, gateway_order_id')
        .eq('gateway_id', 'authorize-net')
        .ilike('gateway_order_id', `${invoiceNumber}%`)
        .limit(1)
        .maybeSingle()
      order = o
    }
    if (!order && trxnId) {
      const { data: o } = await supabase
        .from('orders')
        .select('id, vendor_id, gateway_order_id')
        .eq('gateway_transaction_id', trxnId)
        .maybeSingle()
      order = o
    }
    if (!order) {
      console.warn('anet webhook: order not found', invoiceNumber, trxnId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'authorize-net')
      .single()

    const signatureKey = (conn as any)?.webhook_secret
    if (!signatureKey) {
      console.error('anet webhook: no signature key for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    const verified = await verifyAnetWebhook(rawBody, sigHeader, signatureKey)
    if (!verified) {
      console.warn('anet webhook: signature mismatch')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // Map event type → payment_status
    const type = String(event.eventType || '')
    let paymentStatus: string | null = null
    if (type === 'net.authorize.payment.authcapture.created' || type === 'net.authorize.payment.priorAuthCapture.created' || type === 'net.authorize.payment.capture.created') {
      paymentStatus = data.responseCode === 1 ? 'paid' : 'failed'
    } else if (type === 'net.authorize.payment.refund.created') {
      paymentStatus = 'refunded'
    } else if (type === 'net.authorize.payment.void.created') {
      paymentStatus = 'cancelled'
    } else if (type === 'net.authorize.payment.authorization.created') {
      paymentStatus = data.responseCode === 1 ? 'pending' : 'failed' // auth-only; capture pending
    }

    if (!paymentStatus) return new Response('OK', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = {
      payment_status: paymentStatus,
      payment_method: 'card',
    }
    if (trxnId) patch.gateway_transaction_id = trxnId
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    if (isFoodOrder && foodOrderRef) {
      const { maybeUpdateFoodOrder } = await import('../_shared/foodOrderUpdate.ts')
      await maybeUpdateFoodOrder(supabase, foodOrderRef, paymentStatus, trxnId, 'authorize-net')
    } else {
      await supabase.from('orders').update(patch).eq('id', order.id)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('anet webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
