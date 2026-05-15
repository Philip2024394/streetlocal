// Mollie webhook receiver.
//
// SECURITY MODEL
// Mollie webhooks send ONLY a payment id (no signature). We then GET
// /v2/payments/{id} from Mollie ourselves with our credentials, which
// is Mollie's documented authentication model.
//
// HOWEVER — an attacker who guesses a real Mollie payment id for ANY
// of our orders could trigger this webhook with that id and get the
// matching order marked as paid for free. To close that hole we now:
//
//   1) Verify the Mollie-returned payment's metadata.gateway_order_id
//      MATCHES the order's stored gateway_order_id (we set this at
//      payment-create time — see mollie-create-payment). Attackers
//      enumerating random ids won't have the right metadata.
//   2) Use guardedStatusUpdate so duplicate webhooks (Mollie retries
//      up to 24h) don't double-process. Closes audit findings #1 + #8.
//   3) No `Access-Control-Allow-Origin: *` — Mollie's server doesn't
//      need browser CORS. Closes audit finding #10.
//
// Deploy: `supabase functions deploy mollie-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { webhookCors, guardedStatusUpdate, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'
import { maybeUpdateFoodOrder } from '../_shared/foodOrderUpdate.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: webhookCors })

  try {
    // Mollie sends form-encoded body with just `id=tr_xxx`
    const text = await req.text()
    const params = new URLSearchParams(text)
    const paymentId = params.get('id')
    if (!paymentId) {
      console.warn('mollie webhook: no id in body', text)
      return new Response('no id', { status: 200, headers: webhookCors })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Find our order via the Mollie payment id we stored at create-time.
    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id, gateway_order_id, payment_status')
      .eq('gateway_transaction_id', paymentId)
      .single()

    if (!order) {
      // Either the id is bogus / from another tenant / pre-our-system.
      // Return 200 so Mollie doesn't retry forever — they don't get
      // any signal about whether the id is "real" in our DB.
      console.warn('mollie webhook: order not found for id', paymentId)
      return new Response('order not found', { status: 200, headers: webhookCors })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'mollie')
      .single()

    const mode = (conn as any)?.mode || 'test'
    const apiKey = mode === 'live' ? (conn as any)?.server_key : (conn as any)?.client_key
    if (!apiKey) {
      console.error('mollie webhook: no api key for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: webhookCors })
    }

    // Re-fetch the payment from Mollie. This is our signature-equivalent —
    // anyone POSTing a forged id can't fake what Mollie's API returns.
    const r = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const payment = await r.json().catch(() => ({}))
    if (!r.ok) {
      // Mollie returned an error — could be 404 (unknown id) or 401
      // (this vendor's key doesn't own that payment). Either way,
      // don't touch the order. 200 prevents retries.
      const errId = newErrorId()
      logWithId(errId, 'mollie-payment-fetch-failed', { paymentId, status: r.status, payment })
      return new Response('mollie api error', { status: 200, headers: webhookCors })
    }

    // SECURITY CHECK #1 — metadata.gateway_order_id MUST match what we
    // stored at create-time. Without this, an attacker who guesses any
    // real Mollie payment id for our project could mark an unrelated
    // order as paid.
    const metaGatewayOrderId = payment?.metadata?.gateway_order_id
    if (!metaGatewayOrderId || metaGatewayOrderId !== order.gateway_order_id) {
      const errId = newErrorId()
      logWithId(errId, 'mollie-metadata-mismatch', {
        paymentId,
        expectedGatewayOrderId: order.gateway_order_id,
        gotGatewayOrderId: metaGatewayOrderId,
      })
      return new Response('metadata mismatch', { status: 200, headers: webhookCors })
    }

    // Map Mollie status → our payment_status
    let paymentStatus: string | null = null
    const status = String(payment.status || '').toLowerCase()
    if (status === 'paid' || status === 'authorized') paymentStatus = 'paid'
    else if (status === 'pending' || status === 'open') paymentStatus = 'pending'
    else if (status === 'canceled') paymentStatus = 'cancelled'
    else if (status === 'expired') paymentStatus = 'expired'
    else if (status === 'failed') paymentStatus = 'failed'

    // Refunds — Mollie also sends webhooks when a refund is created.
    // Refund is a stronger signal than the underlying payment status:
    // if amountRefunded > 0, mark as refunded regardless.
    if (payment.amountRefunded?.value && Number(payment.amountRefunded.value) > 0) {
      paymentStatus = 'refunded'
    }

    if (!paymentStatus) return new Response('status not actionable', { status: 200, headers: webhookCors })

    const patch: Record<string, unknown> = {
      payment_method: payment.method || null,
    }
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    // Idempotent update — won't double-process Mollie's 24h retry loop
    // and won't flip a terminal state backwards. Closes finding #1.
    const result = await guardedStatusUpdate(supabase, {
      table: 'orders',
      matchColumn: 'id',
      matchValue: order.id,
      nextStatus: paymentStatus,
      patch,
    })

    if (!result.updated && result.reason !== 'not-found') {
      console.log(`mollie: idempotent skip (${result.reason}) for order ${order.id}, currently ${result.currentStatus}`)
    }

    // Also update food_orders table if this is a foodlocal-pro order.
    await maybeUpdateFoodOrder(supabase, order.gateway_order_id, paymentStatus, paymentId, 'mollie')

    return new Response('OK', { status: 200, headers: webhookCors })
  } catch (e) {
    const errId = newErrorId()
    logWithId(errId, 'mollie-webhook-uncaught', { error: String(e) })
    return new Response('server error', { status: 500, headers: webhookCors })
  }
})
