// PayPal webhook receiver.
// PayPal sends a notification when an Order is approved, a Capture
// completes / is denied, or a Refund is processed. Signature verification
// is delegated to PayPal's own /v1/notifications/verify-webhook-signature
// endpoint (cleaner than re-implementing their cert-chain HMAC).
//
// Configure in developer.paypal.com → Apps & Credentials → your app →
//   Webhooks → Add webhook URL:
//     https://<project>.supabase.co/functions/v1/paypal-webhook
//   Events: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED,
//           PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.REFUNDED
//   Then copy the generated Webhook ID into the vendor setup form (webhookId).
//
// Deploy: `supabase functions deploy paypal-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PAYPAL_API, paypalAccessToken, paypalVerifyWebhook } from '../_shared/paypal.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, paypal-transmission-id, paypal-transmission-time, paypal-cert-url, paypal-transmission-sig, paypal-auth-algo, paypal-auth-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const rawBody = await req.text()
    let event: any
    try { event = JSON.parse(rawBody) } catch { return new Response('invalid json', { status: 400, headers: corsHeaders }) }

    const resource = event?.resource || {}
    // Look up the order via reference_id (we set this to our local orderId in create-order)
    // For CAPTURE events, resource has `custom_id` (we set custom_id to orderId).
    // For ORDER events, resource.purchase_units[0].reference_id has it.
    const orderId =
      resource.custom_id ||
      resource.invoice_id ||
      resource.purchase_units?.[0]?.reference_id ||
      resource.purchase_units?.[0]?.custom_id ||
      resource.supplementary_data?.related_ids?.order_id
    if (!orderId) {
      console.warn('paypal webhook: no order id in event', event?.event_type)
      return new Response('no order id', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    // FOO- prefix routes to foodlocal-pro's food_orders; everything else
    // belongs to food-basic's orders table. vendor_id is the same shape:
    // restaurants.id for food_orders, vendor_accounts.id for orders.
    const isFoodOrder = String(orderId).startsWith('FOO-')
    let order: any = null
    if (isFoodOrder) {
      const { data } = await supabase.from('food_orders').select('id, restaurant_id').eq('gateway_order_id', orderId).single()
      if (data) order = { id: data.id, vendor_id: data.restaurant_id }
    } else {
      const { data } = await supabase.from('orders').select('id, vendor_id').eq('gateway_order_id', orderId).single()
      order = data
    }
    if (!order) {
      console.warn('paypal webhook: order not found', orderId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key, webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'paypal')
      .single()

    const clientId = (conn as any)?.server_key
    const secret   = (conn as any)?.client_key
    const webhookId = (conn as any)?.webhook_secret
    if (!clientId || !secret || !webhookId) {
      console.error('paypal webhook: vendor not fully configured', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }
    const mode = (conn as any).mode || 'test'

    // Verify signature with PayPal
    const accessToken = await paypalAccessToken(clientId, secret, mode)
    const verified = await paypalVerifyWebhook(mode, accessToken, req.headers, rawBody, webhookId)
    if (!verified) {
      console.warn('paypal webhook: signature verification failed')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // Map PayPal event type to our payment_status
    let paymentStatus: string | null = null
    let transactionId: string | undefined = undefined

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        // Approval ≠ paid; we still need to capture. For intent: CAPTURE PayPal auto-captures
        // and fires PAYMENT.CAPTURE.COMPLETED separately. Set to pending here.
        paymentStatus = 'pending'
        transactionId = resource.id
        break
      case 'PAYMENT.CAPTURE.COMPLETED':
        paymentStatus = 'paid'
        transactionId = resource.id // capture id (used for refunds)
        break
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REVERSED':
        paymentStatus = 'failed'
        break
      case 'PAYMENT.CAPTURE.REFUNDED':
      case 'CUSTOMER.DISPUTE.RESOLVED':
        paymentStatus = 'refunded'
        break
      case 'CHECKOUT.ORDER.VOIDED':
      case 'CHECKOUT.ORDER.DECLINED':
        paymentStatus = 'cancelled'
        break
    }
    if (!paymentStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = { payment_status: paymentStatus, payment_method: 'paypal' }
    if (transactionId) patch.gateway_transaction_id = transactionId
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    if (isFoodOrder) {
      const { maybeUpdateFoodOrder } = await import('../_shared/foodOrderUpdate.ts')
      await maybeUpdateFoodOrder(supabase, orderId, paymentStatus, transactionId, 'paypal')
    } else {
      await supabase.from('orders').update(patch).eq('id', order.id)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('paypal webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
