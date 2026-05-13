// food-order-webhook-xendit — receives Xendit invoice webhook events
// from a VENDOR's own Xendit account. Xendit signs requests with a
// per-account callback token sent in the `x-callback-token` header.
// The token is stored in vendor_payment_connections.webhook_secret.
//
// Vendor configures the webhook URL in their Xendit Dashboard:
//   https://fjvafjkzvygkhiwjuvla.supabase.co/functions/v1/food-order-webhook-xendit?vendor=<restaurant_id>
//
// Deploy: `supabase functions deploy food-order-webhook-xendit --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-callback-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const restaurantId = Number(url.searchParams.get('vendor') || 0)
    if (!restaurantId) return new Response('missing vendor query', { status: 400, headers: corsHeaders })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', restaurantId)
      .eq('gateway_id', 'xendit')
      .eq('is_active', true)
      .single()
    if (!conn?.webhook_secret) return new Response('vendor xendit not configured', { status: 401, headers: corsHeaders })

    const incoming = req.headers.get('x-callback-token') || ''
    // Constant-time-ish compare (Xendit tokens are short; this is fine).
    if (incoming !== conn.webhook_secret) {
      return new Response('invalid callback token', { status: 401, headers: corsHeaders })
    }

    const event = await req.json()
    const externalId = event?.external_id      // our orderId (FOO-…)
    const status = String(event?.status || '').toUpperCase()
    if (!externalId) return new Response('no external_id', { status: 200, headers: corsHeaders })

    const { data: order } = await supabase
      .from('food_orders')
      .select('id, restaurant_id, status')
      .eq('gateway_order_id', externalId)
      .single()
    if (!order) return new Response('order not found', { status: 200, headers: corsHeaders })

    let nextStatus: string | null = null
    let paid = false
    if (status === 'PAID' || status === 'SETTLED') { nextStatus = 'confirmed'; paid = true }
    else if (status === 'PENDING') nextStatus = 'payment_submitted'
    else if (status === 'EXPIRED' || status === 'FAILED') nextStatus = 'cancelled'
    if (!nextStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = {
      status: nextStatus,
      payment_intent_id: event?.id,
      gateway_used: 'xendit',
      payment_method: event?.payment_method || event?.payment_channel || 'unknown',
      updated_at: new Date().toISOString(),
    }
    if (paid) {
      patch.auto_confirmed_at = new Date().toISOString()
      patch.payment_confirmed_at = new Date().toISOString()
    }
    if (nextStatus === 'cancelled') {
      patch.cancel_reason = `xendit ${status.toLowerCase()}`
    }
    await supabase.from('food_orders').update(patch).eq('id', order.id)

    if (paid) {
      const { data: full } = await supabase.from('food_orders').select('customer_phone, total').eq('id', order.id).single()
      try {
        await supabase.functions.invoke('send-vendor-push', {
          body: { restaurant_id: order.restaurant_id, title: 'New order confirmed', body: `Order #${order.id} paid (Xendit)`, order_id: order.id },
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
    console.error('food-order-webhook-xendit error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
