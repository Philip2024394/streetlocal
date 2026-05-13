// food-order-webhook-stripe — receives Stripe webhook events from a
// VENDOR's own Stripe account. Signature is verified using the vendor's
// webhook_secret stored in vendor_payment_connections.
//
// Event we care about: checkout.session.completed (payment captured).
// We auto-confirm the matching food_orders row.
//
// Deploy: `supabase functions deploy food-order-webhook-stripe --no-verify-jwt`
//
// Vendor configures the webhook URL in their Stripe Dashboard:
//   https://fjvafjkzvygkhiwjuvla.supabase.co/functions/v1/food-order-webhook-stripe?vendor=<restaurant_id>
// We use the ?vendor= query param to look up the right webhook_secret
// (Stripe doesn't include any free-form identifier in the signature so
// we route via URL instead).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function parseSigHeader(h: string | null) {
  if (!h) return null
  const parts: Record<string, string> = {}
  for (const seg of h.split(',')) {
    const [k, v] = seg.split('=', 2)
    if (k && v) parts[k.trim()] = v.trim()
  }
  return parts.t && parts.v1 ? { t: parts.t, v1: parts.v1 } : null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const restaurantId = Number(url.searchParams.get('vendor') || 0)
    if (!restaurantId) return new Response('missing vendor query', { status: 400, headers: corsHeaders })

    const body = await req.text()  // raw body needed for signature
    const sig  = req.headers.get('stripe-signature')
    const parsed = parseSigHeader(sig)
    if (!parsed) return new Response('missing/invalid stripe-signature', { status: 400, headers: corsHeaders })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', restaurantId)
      .eq('gateway_id', 'stripe')
      .eq('is_active', true)
      .single()
    if (!conn?.webhook_secret) return new Response('vendor stripe not configured', { status: 401, headers: corsHeaders })

    const expected = await hmacSha256Hex(conn.webhook_secret, `${parsed.t}.${body}`)
    if (expected.toLowerCase() !== parsed.v1.toLowerCase()) {
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    const event = JSON.parse(body)
    const type = event?.type

    // We listen for the completed checkout session. payment_intent.succeeded
    // also fires but session.completed has client_reference_id (our orderId).
    if (type !== 'checkout.session.completed' && type !== 'payment_intent.succeeded') {
      return new Response('event ignored', { status: 200, headers: corsHeaders })
    }

    const session = event.data?.object || {}
    const gatewayOrderId =
      session.client_reference_id ||
      session.metadata?.gateway_order_id ||
      session.payment_intent?.metadata?.gateway_order_id ||
      null
    if (!gatewayOrderId) return new Response('no order ref', { status: 200, headers: corsHeaders })

    const { data: order } = await supabase
      .from('food_orders')
      .select('id, restaurant_id, status')
      .eq('gateway_order_id', gatewayOrderId)
      .single()
    if (!order) return new Response('order not found', { status: 200, headers: corsHeaders })

    const paid = (session.payment_status === 'paid') || (event.type === 'payment_intent.succeeded')

    const patch: Record<string, unknown> = {
      payment_intent_id: session.payment_intent || session.id,
      gateway_used: 'stripe',
      updated_at: new Date().toISOString(),
    }
    if (paid) {
      patch.status = 'confirmed'
      patch.auto_confirmed_at = new Date().toISOString()
      patch.payment_confirmed_at = new Date().toISOString()
      patch.payment_method = 'card'
    } else if (session.payment_status === 'unpaid') {
      patch.status = 'payment_submitted'
    }

    await supabase.from('food_orders').update(patch).eq('id', order.id)

    if (paid) {
      const { data: full } = await supabase.from('food_orders').select('customer_phone, total').eq('id', order.id).single()
      try {
        await supabase.functions.invoke('send-vendor-push', {
          body: { restaurant_id: order.restaurant_id, title: 'New order confirmed', body: `Order #${order.id} paid (Stripe)`, order_id: order.id },
        })
      } catch (e) { console.warn('push notify failed', e) }
      try {
        if (full?.customer_phone) {
          await supabase.functions.invoke('send-customer-whatsapp', {
            body: { restaurant_id: order.restaurant_id, customer_phone: full.customer_phone, event: 'order_confirmed', payload: { order_id: order.id, total: full.total } },
          })
        }
      } catch (e) { console.warn('whatsapp notify failed', e) }
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('food-order-webhook-stripe error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
