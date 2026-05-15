// FOMO Pay webhook receiver.
// FOMO POSTs form-encoded body when a payment status changes. The body
// contains a `sign` field which we recompute and verify using the
// vendor's signKey (same algorithm as outbound requests).
//
// Configure: notify_url is passed per-payment in the cashier request
// (see fomopay-create-payment) — nothing to configure on FOMO's side
// for the URL. Only the signKey matters.
//
// Deploy: `supabase functions deploy fomopay-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fomoVerify } from '../_shared/fomopay.ts'
import { webhookCors, guardedStatusUpdate } from '../_shared/paymentSecurity.ts'

const corsHeaders = webhookCors

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const ct = req.headers.get('content-type') || ''
    let fields: Record<string, string> = {}
    if (ct.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      Object.entries(body || {}).forEach(([k, v]) => { fields[k] = String(v ?? '') })
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      params.forEach((v, k) => { fields[k] = v })
    }

    const orderId = fields.order_no || fields.merchant_order_no || fields.out_trade_no
    if (!orderId) {
      console.warn('fomopay webhook: no order id field', fields)
      return new Response('no order id', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('gateway_order_id', orderId)
      .single()

    if (!order) {
      console.warn('fomopay webhook: order not found', orderId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret, server_key, additional_config')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'fomo-pay')
      .single()

    const signKey = (conn as any)?.webhook_secret || (conn as any)?.server_key
    const signType = (conn as any)?.additional_config?.signType || fields.sign_type || 'HMAC-SHA256'
    if (!signKey) {
      console.error('fomopay webhook: no signKey for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    const ok = await fomoVerify(fields, signKey, signType)
    if (!ok) {
      console.warn('fomopay webhook: sign mismatch')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // Map FOMO status → our payment_status
    // Status field names vary across FOMO products: status, trade_status, payment_status
    const rawStatus = String(fields.status || fields.trade_status || fields.payment_status || '').toLowerCase()
    let paymentStatus: string | null = null
    if (rawStatus === 'success' || rawStatus === 'paid' || rawStatus === 'completed' || rawStatus === 'trade_success') paymentStatus = 'paid'
    else if (rawStatus === 'pending' || rawStatus === 'processing' || rawStatus === 'waiting') paymentStatus = 'pending'
    else if (rawStatus === 'failed' || rawStatus === 'fail' || rawStatus === 'declined') paymentStatus = 'failed'
    else if (rawStatus === 'expired' || rawStatus === 'timeout') paymentStatus = 'expired'
    else if (rawStatus === 'cancelled' || rawStatus === 'canceled' || rawStatus === 'closed') paymentStatus = 'cancelled'
    else if (rawStatus === 'refunded' || rawStatus === 'refund_success') paymentStatus = 'refunded'

    if (!paymentStatus) {
      // Many FOMO accounts respond with empty status on the initial ping —
      // ack but don't mutate so they stop retrying
      return new Response('SUCCESS', { status: 200, headers: corsHeaders })
    }

    const patch: Record<string, unknown> = {
      payment_method: fields.payment_method || fields.payment_type || fields.pay_type || null,
    }
    const txnId = fields.trade_no || fields.transaction_id || fields.payment_id
    if (txnId) patch.gateway_transaction_id = txnId
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    const updateResult = await guardedStatusUpdate(supabase, {
      table: 'orders',
      matchColumn: 'id',
      matchValue: order.id,
      nextStatus: paymentStatus,
      patch,
    })
    if (!updateResult.updated && updateResult.reason !== 'not-found') {
      console.log(`fomopay webhook: idempotent skip (${updateResult.reason}) for order ${order.id}, current: ${updateResult.currentStatus}`)
    }

    // FOMO Pay expects the response body "SUCCESS" (or "success") as ack
    return new Response('SUCCESS', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('fomopay webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
