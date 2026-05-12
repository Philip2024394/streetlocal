// Razorpay webhook receiver.
// Razorpay POSTs an event here when a Payment succeeds/fails or a Refund
// is processed. The webhook is signed with HMAC-SHA256 using the
// per-account "Webhook Secret" the vendor configured.
//
// Configure in Razorpay Dashboard → Account & Settings → Webhooks:
//   URL: https://<project>.supabase.co/functions/v1/razorpay-webhook
//   Active events: payment.captured, payment.failed, payment_link.paid,
//                  refund.processed
//   Secret: any string — copy the same value into the vendor's setup form
//
// Deploy: `supabase functions deploy razorpay-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-razorpay-signature',
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
    const sigHeader = req.headers.get('x-razorpay-signature') || ''

    let event: any
    try { event = JSON.parse(rawBody) } catch { return new Response('invalid json', { status: 400, headers: corsHeaders }) }

    // Locate the order. For payment.* events, the payment entity has notes.reference_id
    // or order_id (which maps to our orderId via the payment link); for payment_link.* it's in payload.payment_link.entity.
    const pmt = event?.payload?.payment?.entity || {}
    const link = event?.payload?.payment_link?.entity || {}
    const refund = event?.payload?.refund?.entity || {}
    const orderId =
      link.reference_id ||
      pmt.notes?.reference_id ||
      pmt.invoice_id ||
      refund.notes?.reference_id ||
      // fallback: look up by payment_link.id which we stored as gateway_transaction_id
      undefined

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // If we don't have reference_id, try to resolve order via stored payment_link id
    let order: any = null
    if (orderId) {
      const { data } = await supabase.from('orders').select('id, vendor_id').eq('gateway_order_id', orderId).single()
      order = data
    } else if (link.id || pmt.invoice_id) {
      const { data } = await supabase.from('orders').select('id, vendor_id').eq('gateway_transaction_id', link.id || pmt.invoice_id).single()
      order = data
    }
    if (!order) {
      console.warn('razorpay webhook: order not found for event', event?.event)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'razorpay')
      .single()

    const webhookSecret = (conn as any)?.webhook_secret
    if (!webhookSecret) {
      console.error('razorpay webhook: no webhook secret for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    // Verify signature
    const expected = await hmacSha256Hex(webhookSecret, rawBody)
    if (!constantTimeEq(expected, sigHeader)) {
      console.warn('razorpay webhook: signature mismatch')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // Map Razorpay event → payment_status
    let paymentStatus: string | null = null
    let transactionId: string | undefined = undefined
    let paymentMethod: string | undefined = undefined

    switch (event.event) {
      case 'payment.captured':
      case 'payment_link.paid':
        paymentStatus = 'paid'
        transactionId = pmt.id // capture id (used for refunds)
        paymentMethod = pmt.method // upi | card | netbanking | wallet
        break
      case 'payment.failed':
        paymentStatus = 'failed'
        transactionId = pmt.id
        break
      case 'payment_link.expired':
        paymentStatus = 'expired'
        break
      case 'payment_link.cancelled':
        paymentStatus = 'cancelled'
        break
      case 'refund.created':
      case 'refund.processed':
        paymentStatus = 'refunded'
        break
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
    console.error('razorpay webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
