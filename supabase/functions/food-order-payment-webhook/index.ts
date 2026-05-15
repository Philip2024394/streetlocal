// Vendor-side food order payment webhook. Receives Midtrans Notification
// events from a VENDOR's own connected Midtrans account (keys live in
// vendor_payment_connections, NOT in env). When a customer pays at the
// vendor's menu page, this webhook fires on settlement, auto-confirms the
// food_orders row, stamps payment_method + auto_confirmed_at, and triggers
// vendor notifications + customer WhatsApp/chat confirmation.
//
// SECURITY HARDENING (audit Phase 8 fixes):
//   • constant-time signature comparison       → finding #11
//   • idempotent guardedStatusUpdate            → finding #1, #5
//   • full state machine incl. refund / chargeback  → finding #9
//   • no `Access-Control-Allow-Origin: *` CORS   → finding #10
//   • notifications fire ONLY on real transitions, not on duplicate
//     webhook deliveries → finding #16
//
// Order-id format: FOO-<restaurant_id>-<food_order_id>-<ts>
//   The restaurant_id lets us look up the connected gateway credentials
//   so we can verify the signature with the vendor's own server_key.
//
// Deploy: `supabase functions deploy food-order-payment-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { webhookCors, constantTimeEq, guardedStatusUpdate, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'

async function sha512hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: webhookCors })

  try {
    const event = await req.json()
    const orderId = event?.order_id as string | undefined
    if (!orderId) return new Response('no order id', { status: 200, headers: webhookCors })

    // FOO- prefix = food order (vendor's Midtrans). Anything else is not
    // ours; ignore so a stray FLP- (subscription) or SLS- (basic) doesn't
    // mistakenly mutate food_orders rows.
    if (!orderId.startsWith('FOO-')) {
      return new Response('not a food order', { status: 200, headers: webhookCors })
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
      return new Response('order not found', { status: 200, headers: webhookCors })
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
      return new Response('gateway not connected', { status: 401, headers: webhookCors })
    }

    const sigInput = `${orderId}${event.status_code}${event.gross_amount}${conn.server_key}`
    const expected = (await sha512hex(sigInput)).toLowerCase()
    const received = String(event.signature_key || '').toLowerCase()
    // CONSTANT-TIME — naive `!==` returns early on first mismatched byte,
    // leaking the signature one byte at a time. Closes finding #11.
    if (!received || !constantTimeEq(received, expected)) {
      const errId = newErrorId()
      logWithId(errId, 'midtrans-signature-mismatch', { orderId, received_len: received.length, expected_len: expected.length })
      return new Response('invalid signature', { status: 401, headers: webhookCors })
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
    } else if (txStatus === 'refund' || txStatus === 'partial_refund') {
      // CLOSES finding #9 — Midtrans sends refund webhooks; the previous
      // code silently ignored them, leaving orders in 'confirmed' state
      // after a refund was processed.
      nextStatus = 'refunded'
    } else if (txStatus === 'chargeback' || txStatus === 'partial_chargeback') {
      nextStatus = 'refunded'
    }

    if (!nextStatus) return new Response('event ignored', { status: 200, headers: webhookCors })

    const patch: Record<string, unknown> = {
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
    if (nextStatus === 'refunded') {
      patch.refunded_at = new Date().toISOString()
      patch.refund_reason = `gateway webhook: ${txStatus}`
    }

    // Idempotent update — duplicate Midtrans deliveries (standard
    // retry behaviour, up to ~24h) won't double-process. Race-safe
    // via status guard in the UPDATE WHERE clause. Closes findings #1 + #5.
    const result = await guardedStatusUpdate(supabase, {
      table: 'food_orders',
      matchColumn: 'id',
      matchValue: order.id,
      nextStatus,
      statusColumn: 'status',
      patch,
    })

    if (!result.updated) {
      // already-final / race / not-found — log and return 200 so the
      // gateway stops retrying. Not an error.
      console.log(`food-order-webhook idempotent skip: ${result.reason} for ${orderId}, current=${(result as any).currentStatus}`)
      return new Response('OK', { status: 200, headers: webhookCors })
    }

    // Notifications ONLY fire on the FIRST 'confirmed' transition.
    // If a duplicate webhook arrives later, guardedStatusUpdate above
    // returns updated:false, so we never get here a second time.
    // Closes finding #16 (notification atomicity).
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
    }

    return new Response('OK', { status: 200, headers: webhookCors })
  } catch (e) {
    const errId = newErrorId()
    logWithId(errId, 'food-order-payment-webhook-uncaught', { error: String(e) })
    return new Response('server error', { status: 500, headers: webhookCors })
  }
})
