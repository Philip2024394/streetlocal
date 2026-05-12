// Stripe webhook receiver.
// Stripe POSTs an event here when a Checkout Session is completed,
// payment succeeds/fails, or a refund is processed. We verify the
// signature using the vendor's webhook signing secret, then update the
// matching `orders` row.
//
// IMPORTANT: every event arrives with a `Stripe-Signature` header. We
// must verify it against the per-vendor signing secret. The vendor
// stores the secret in additional_config.webhookSecret OR in the
// dedicated webhook_secret column.
//
// Configure in Stripe Dashboard → Developers → Webhooks:
//   Endpoint URL: https://<project>.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, checkout.session.async_payment_succeeded,
//           checkout.session.async_payment_failed, payment_intent.succeeded,
//           payment_intent.payment_failed, charge.refunded
//
// Deploy: `supabase functions deploy stripe-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Stripe signs each webhook with a timestamp + HMAC-SHA256.
// Header format: `t=<unix_ts>,v1=<hex_sig>` (may include older v0 too).
async function verifyStripeSig(rawBody: string, sigHeader: string, secret: string): Promise<boolean> {
  if (!sigHeader || !secret) return false
  const parts: Record<string, string> = {}
  sigHeader.split(',').forEach((p) => {
    const [k, v] = p.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  })
  if (!parts.t || !parts.v1) return false
  const signedPayload = `${parts.t}.${rawBody}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
  // constant-time compare
  if (expected.length !== parts.v1.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i)
  return diff === 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const rawBody = await req.text() // need raw for signature verification
    const sigHeader = req.headers.get('Stripe-Signature') || ''

    // Parse the event body so we can find the order → the vendor → the secret.
    let event: any
    try { event = JSON.parse(rawBody) } catch { return new Response('invalid json', { status: 400, headers: corsHeaders }) }

    // Resolve order_id and vendor from event payload
    const obj = event?.data?.object || {}
    const orderId = obj.client_reference_id || obj.metadata?.orderId || obj.metadata?.order_id
    if (!orderId) {
      console.warn('stripe webhook: no order id in event', event?.type)
      return new Response('no order id', { status: 200, headers: corsHeaders }) // ack so Stripe doesn't retry forever
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('gateway_order_id', orderId)
      .single()

    if (!order) {
      console.warn('stripe webhook: order not found', orderId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret, additional_config')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'stripe')
      .single()

    const signingSecret = (conn as any)?.webhook_secret || (conn as any)?.additional_config?.webhookSecret
    if (!signingSecret) {
      console.error('stripe webhook: no signing secret stored for vendor', order.vendor_id)
      return new Response('vendor secret missing', { status: 500, headers: corsHeaders })
    }

    if (!await verifyStripeSig(rawBody, sigHeader, signingSecret)) {
      console.warn('stripe webhook: signature invalid')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // Map Stripe event types to our payment_status
    let paymentStatus: string | null = null
    let transactionId: string | undefined = undefined
    let paymentMethod: string | undefined = undefined

    switch (event.type) {
      case 'checkout.session.completed':
        if (obj.payment_status === 'paid') paymentStatus = 'paid'
        else if (obj.payment_status === 'unpaid') paymentStatus = 'pending'
        // For an escrow (manual-capture) session, Stripe still reports
        // payment_status='paid' once the auth succeeds — but funds are
        // held, not captured. The order row already has escrow_status='held'
        // from creation, so no change needed here.
        transactionId = obj.payment_intent
        paymentMethod = obj.payment_method_types?.[0]
        break
      case 'payment_intent.amount_capturable_updated':
        // Fires when a manual-capture PI moves to requires_capture state.
        // Auth confirmed; vendor (or auto-release) will capture later.
        paymentStatus = 'paid' // gateway-side authorisation succeeded
        transactionId = obj.id
        paymentMethod = obj.payment_method_types?.[0] || obj.payment_method
        break
      case 'checkout.session.async_payment_succeeded':
      case 'payment_intent.succeeded':
        paymentStatus = 'paid'
        transactionId = obj.id
        paymentMethod = obj.payment_method_types?.[0] || obj.payment_method
        break
      case 'payment_intent.canceled':
        // Manual-capture PI voided (escrow cancelled / auth expired).
        paymentStatus = 'cancelled'
        transactionId = obj.id
        break
      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed':
        paymentStatus = 'failed'
        transactionId = obj.id
        break
      case 'charge.refunded':
      case 'refund.created':
      case 'refund.updated':
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
    console.error('stripe webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
