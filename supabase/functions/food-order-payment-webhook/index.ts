// Vendor-side food order payment webhook. Receives Midtrans Notification
// events from a VENDOR's own connected Midtrans account (keys live in
// vendor_payment_connections, NOT in env). When a customer pays at the
// vendor's menu page, this webhook fires on settlement, auto-confirms the
// food_orders row, stamps payment_method + auto_confirmed_at, and triggers
// vendor notifications + customer WhatsApp/chat confirmation.
//
// Order-id format: FOO-<restaurant_id>-<food_order_id>-<ts>
//   The restaurant_id lets us look up the connected gateway credentials
//   so we can verify the signature with the vendor's own server_key.
//
// Deploy: `supabase functions deploy food-order-payment-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha512hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const event = await req.json()
    const orderId = event?.order_id as string | undefined
    if (!orderId) return new Response('no order id', { status: 200, headers: corsHeaders })

    // FOO- prefix = food order (vendor's Midtrans). Anything else is not
    // ours; ignore so a stray FLP- (subscription) or SLS- (basic) doesn't
    // mistakenly mutate food_orders rows.
    if (!orderId.startsWith('FOO-')) {
      return new Response('not a food order', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Look up the order so we know which restaurant + gateway to verify.
    const { data: order, error: orderErr } = await supabase
      .from('food_orders')
      .select('id, restaurant_id, status, total, gateway_used')
      .eq('gateway_order_id', orderId)
      .single()

    if (orderErr || !order) {
      console.warn('food-order-payment-webhook: order not found for', orderId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    // Verify signature with the vendor's own Midtrans server key.
    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key, mode')
      .eq('vendor_id', order.restaurant_id)
      .eq('gateway_id', 'midtrans')
      .eq('is_active', true)
      .single()

    if (!conn?.server_key) {
      console.error('food-order-payment-webhook: no connected midtrans key for restaurant', order.restaurant_id)
      return new Response('gateway not connected', { status: 401, headers: corsHeaders })
    }

    const sigInput = `${orderId}${event.status_code}${event.gross_amount}${conn.server_key}`
    const expected = await sha512hex(sigInput)
    if (event.signature_key && event.signature_key.toLowerCase() !== expected.toLowerCase()) {
      console.warn('food-order-payment-webhook: signature mismatch for', orderId)
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    const txStatus = String(event.transaction_status || '').toLowerCase()
    const fraudStatus = String(event.fraud_status || '').toLowerCase()
    let nextStatus: string | null = null
    let confirmed = false

    if ((txStatus === 'capture' && fraudStatus === 'accept') || txStatus === 'settlement') {
      nextStatus = 'confirmed'
      confirmed = true
    } else if (txStatus === 'pending') {
      nextStatus = 'payment_submitted'
    } else if (['cancel', 'expire', 'deny', 'failure'].includes(txStatus)) {
      nextStatus = 'cancelled'
    }

    if (!nextStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = {
      status: nextStatus,
      payment_intent_id: event.transaction_id,
      payment_method: event.payment_type || 'card',
      gateway_used: 'midtrans',
      updated_at: new Date().toISOString(),
    }
    if (confirmed) {
      patch.auto_confirmed_at = new Date().toISOString()
      patch.payment_confirmed_at = new Date().toISOString()
    }
    if (nextStatus === 'cancelled' && !order.status?.startsWith('delivered')) {
      patch.cancel_reason = `payment ${txStatus}`
    }

    await supabase.from('food_orders').update(patch).eq('id', order.id)

    // Best-effort vendor push + customer WhatsApp confirmation. Both fire-
    // and-forget so the webhook returns 200 fast.
    if (confirmed) {
      const { data: full } = await supabase
        .from('food_orders')
        .select('customer_phone, total')
        .eq('id', order.id).single()
      try {
        await supabase.functions.invoke('send-vendor-push', {
          body: { restaurant_id: order.restaurant_id, title: 'New order confirmed', body: `Order #${order.id} paid · ${Number(full?.total ?? order.total).toLocaleString('id-ID')} IDR`, order_id: order.id },
        })
      } catch (e) { console.warn('push notify failed', e) }
      try {
        if (full?.customer_phone) {
          await supabase.functions.invoke('send-customer-whatsapp', {
            body: { restaurant_id: order.restaurant_id, customer_phone: full.customer_phone, event: 'order_confirmed', payload: { order_id: order.id, total: full.total } },
          })
        }
      } catch (e) { console.warn('whatsapp notify failed', e) }
      try {
        await supabase.functions.invoke('send-order-receipt', {
          body: { orderId: order.id, orderTable: 'food_orders' },
        })
      } catch (e) { console.warn('receipt email failed', e) }
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('food-order-payment-webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
