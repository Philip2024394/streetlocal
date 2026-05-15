// HitPay webhook receiver.
// HitPay POSTs form-encoded webhook with `hmac` field in the payload.
// Signature is computed by:
//   1. Remove the `hmac` field
//   2. Sort remaining fields by key (alphabetical)
//   3. Concatenate as `key{value}` pairs (no separators)
//   4. HMAC-SHA256(that string, salt) → hex
//   5. Compare to received hmac
//
// Configure in HitPay Dashboard → Settings → Webhooks (per payment, we
// pass the webhook URL in the payment-request body — no dashboard
// config needed, but the salt is set globally in Settings → API Keys).
//
// Deploy: `supabase functions deploy hitpay-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { webhookCors, guardedStatusUpdate } from '../_shared/paymentSecurity.ts'

const corsHeaders = webhookCors

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
    const text = await req.text()
    const params = new URLSearchParams(text)
    const fields: Record<string, string> = {}
    params.forEach((v, k) => { fields[k] = v })

    const receivedHmac = fields.hmac || ''
    delete fields.hmac

    const referenceNumber = fields.reference_number
    const hitpayPaymentId = fields.payment_id || fields.id
    if (!referenceNumber && !hitpayPaymentId) {
      console.warn('hitpay webhook: no reference_number or payment_id', text)
      return new Response('no order ref', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // FOO- prefix → foodlocal-pro food_orders; otherwise food-basic orders.
    const isFoodOrder = String(referenceNumber || '').startsWith('FOO-')
    let order: any = null
    if (isFoodOrder) {
      const { data } = await supabase.from('food_orders').select('id, restaurant_id').eq('gateway_order_id', referenceNumber).single()
      if (data) order = { id: data.id, vendor_id: data.restaurant_id }
    } else if (referenceNumber) {
      const { data } = await supabase.from('orders').select('id, vendor_id').eq('gateway_order_id', referenceNumber).single()
      order = data
    }
    if (!order && hitpayPaymentId) {
      const { data } = await supabase.from('orders').select('id, vendor_id').eq('gateway_transaction_id', hitpayPaymentId).single()
      order = data
    }
    if (!order) {
      console.warn('hitpay webhook: order not found', { referenceNumber, hitpayPaymentId })
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'hitpay')
      .single()

    const salt = (conn as any)?.webhook_secret
    if (!salt) {
      console.error('hitpay webhook: no salt for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    // Build canonical string: sort keys alphabetically, concatenate as key{value}
    const sortedKeys = Object.keys(fields).sort()
    const canonical = sortedKeys.map((k) => `${k}${fields[k]}`).join('')
    const expected = await hmacSha256Hex(salt, canonical)
    if (!constantTimeEq(expected, receivedHmac)) {
      console.warn('hitpay webhook: signature mismatch')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // Map HitPay status → our payment_status
    const status = String(fields.status || '').toLowerCase()
    let paymentStatus: string | null = null
    if (status === 'completed' || status === 'succeeded') paymentStatus = 'paid'
    else if (status === 'pending') paymentStatus = 'pending'
    else if (status === 'failed') paymentStatus = 'failed'
    else if (status === 'expired') paymentStatus = 'expired'
    else if (status === 'refunded' || status === 'partially_refunded') paymentStatus = 'refunded'
    else if (status === 'canceled' || status === 'cancelled') paymentStatus = 'cancelled'
    if (!paymentStatus) return new Response('status not actionable', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = {
      payment_method: fields.payment_type || fields.payment_method || null,
    }
    if (fields.payment_id) patch.gateway_transaction_id = fields.payment_id
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    if (isFoodOrder) {
      const { maybeUpdateFoodOrder } = await import('../_shared/foodOrderUpdate.ts')
      await maybeUpdateFoodOrder(supabase, referenceNumber, paymentStatus, fields.payment_id, 'hitpay')
    } else {
      const updateResult = await guardedStatusUpdate(supabase, {
        table: 'orders',
        matchColumn: 'id',
        matchValue: order.id,
        nextStatus: paymentStatus,
        patch,
      })
      if (!updateResult.updated && updateResult.reason !== 'not-found') {
        console.log(`hitpay webhook: idempotent skip (${updateResult.reason}) for order ${order.id}, current: ${updateResult.currentStatus}`)
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('hitpay webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
