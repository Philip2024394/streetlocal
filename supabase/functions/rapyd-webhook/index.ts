// Rapyd webhook receiver.
// Rapyd POSTs an event when a payment / refund changes status. Each
// webhook is signed using the SAME custom HMAC scheme as outbound
// requests (signature header = base64(hex(hmac(url+salt+timestamp+
// access_key+secret_key+body, secret_key)))).
//
// Configure in Rapyd Dashboard → Developers → Webhooks → Add:
//   URL: https://<project>.supabase.co/functions/v1/rapyd-webhook
//   Events: PAYMENT_COMPLETED, PAYMENT_FAILED, PAYMENT_CANCELED,
//           PAYMENT_EXPIRED, REFUND_COMPLETED, CHECKOUT_PAYMENT_COMPLETED
//
// Deploy: `supabase functions deploy rapyd-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyRapydWebhook } from '../_shared/rapyd.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, access_key, signature, salt, timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const rawBody = await req.text()
    let event: any
    try { event = JSON.parse(rawBody) } catch { return new Response('invalid json', { status: 400, headers: corsHeaders }) }

    // The event's data payload is at event.data. Find the merchant reference + payment.
    const data = event?.data || {}
    const merchantRef =
      data.merchant_reference_id ||
      data.checkout?.merchant_reference_id ||
      data.payment?.merchant_reference_id ||
      data.refund?.merchant_reference_id

    if (!merchantRef) {
      console.warn('rapyd webhook: no merchant_reference_id', event?.type)
      return new Response('no ref', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('gateway_order_id', merchantRef)
      .single()

    if (!order) {
      console.warn('rapyd webhook: order not found', merchantRef)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'rapyd')
      .single()

    const accessKey = (conn as any)?.server_key
    const secretKey = (conn as any)?.client_key
    if (!accessKey || !secretKey) {
      console.error('rapyd webhook: no keys for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    // Reconstruct the URL Rapyd POSTed to (used in their HMAC payload)
    const fullUrl = req.url

    const verified = await verifyRapydWebhook(fullUrl, rawBody, req.headers, accessKey, secretKey)
    if (!verified) {
      console.warn('rapyd webhook: signature invalid')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // Map Rapyd event type → our payment_status
    let paymentStatus: string | null = null
    let transactionId: string | undefined = undefined
    let paymentMethod: string | undefined = undefined

    const type = String(event.type || '').toUpperCase()
    if (type === 'PAYMENT_COMPLETED' || type === 'CHECKOUT_PAYMENT_COMPLETED') {
      paymentStatus = 'paid'
      transactionId = data.id || data.payment?.id
      paymentMethod = data.payment_method_type_category || data.paid_with
    } else if (type === 'PAYMENT_FAILED') {
      paymentStatus = 'failed'
      transactionId = data.id || data.payment?.id
    } else if (type === 'PAYMENT_CANCELED') {
      paymentStatus = 'cancelled'
    } else if (type === 'PAYMENT_EXPIRED') {
      paymentStatus = 'expired'
    } else if (type === 'REFUND_COMPLETED' || type === 'REFUND_CREATED') {
      paymentStatus = 'refunded'
    } else if (type === 'REFUND_FAILED') {
      paymentStatus = 'failed'
    }

    if (!paymentStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = { payment_status: paymentStatus }
    if (transactionId) patch.gateway_transaction_id = transactionId
    if (paymentMethod) patch.payment_method = paymentMethod
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    await supabase.from('orders').update(patch).eq('id', order.id)

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('rapyd webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
