// Checkout.com webhook receiver.
// Checkout.com signs each webhook with HMAC-SHA256 of the raw body using
// the per-webhook "Signature Key" the vendor generated. Header:
// cko-signature (hex-encoded HMAC).
//
// Configure in Dashboard → Developers → Webhooks → Add:
//   URL: https://<project>.supabase.co/functions/v1/checkout-com-webhook
//   Events: payment_approved, payment_captured, payment_declined,
//           payment_refunded, payment_refund_declined, payment_expired
//   Copy the Signature Key shown after save → paste into vendor setup.
//
// Deploy: `supabase functions deploy checkout-com-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, cko-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function constantTimeEq(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const rawBody = await req.text()
    const sigHeader = req.headers.get('cko-signature') || ''

    let event: any
    try { event = JSON.parse(rawBody) } catch { return new Response('invalid json', { status: 400, headers: corsHeaders }) }

    // Checkout.com event shape: { type, id, data: { ... reference, id, status, ... } }
    const data = event?.data || {}
    const reference = data.reference || data.metadata?.orderId
    if (!reference) {
      console.warn('checkout.com webhook: no reference in event', event?.type)
      return new Response('no reference', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const isFoodOrder = String(reference || '').startsWith('FOO-')
    let order: any = null
    if (isFoodOrder) {
      const { data } = await supabase.from('food_orders').select('id, restaurant_id').eq('gateway_order_id', reference).single()
      if (data) order = { id: data.id, vendor_id: data.restaurant_id }
    } else {
      const { data } = await supabase.from('orders').select('id, vendor_id').eq('gateway_order_id', reference).single()
      order = data
    }
    if (!order) {
      console.warn('checkout.com webhook: order not found', reference)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'checkout-com')
      .single()

    const webhookKey = (conn as any)?.webhook_secret
    if (!webhookKey) {
      console.error('checkout.com webhook: no signature key for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    const expected = await hmacSha256Hex(webhookKey, rawBody)
    if (!constantTimeEq(expected, sigHeader)) {
      console.warn('checkout.com webhook: signature mismatch')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // Map event type → our payment_status
    let paymentStatus: string | null = null
    let transactionId: string | undefined = undefined
    let paymentMethod: string | undefined = undefined

    const type = String(event.type || '').toLowerCase()
    if (type === 'payment_captured' || type === 'payment_approved') {
      paymentStatus = 'paid'
      transactionId = data.id
      paymentMethod = data.source?.type
    } else if (type === 'payment_declined' || type === 'payment_capture_declined') {
      paymentStatus = 'failed'
      transactionId = data.id
    } else if (type === 'payment_expired') {
      paymentStatus = 'expired'
    } else if (type === 'payment_canceled' || type === 'payment_void') {
      paymentStatus = 'cancelled'
    } else if (type === 'payment_refunded' || type === 'payment_refund') {
      paymentStatus = 'refunded'
    } else if (type === 'payment_refund_declined') {
      paymentStatus = 'failed'
    }

    if (!paymentStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = { payment_status: paymentStatus }
    if (transactionId) patch.gateway_transaction_id = transactionId
    if (paymentMethod) patch.payment_method = paymentMethod
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    if (isFoodOrder) {
      const { maybeUpdateFoodOrder } = await import('../_shared/foodOrderUpdate.ts')
      await maybeUpdateFoodOrder(supabase, reference, paymentStatus, transactionId, 'checkout-com')
    } else {
      await supabase.from('orders').update(patch).eq('id', order.id)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('checkout.com webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
