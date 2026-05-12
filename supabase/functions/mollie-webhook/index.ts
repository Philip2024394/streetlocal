// Mollie webhook receiver.
// Unique compared to other gateways: Mollie sends ONLY a payment id —
// no signature, no event payload. We GET /v2/payments/{id} ourselves to
// fetch the real status. This is intentional: even if an attacker
// POSTs a fake id, we always verify directly with Mollie's API using
// our own credentials, so no spoofing possible.
//
// Configure: the URL is passed in webhookUrl per-payment at create-time
// (see mollie-create-payment), so nothing to configure in Mollie's
// dashboard. The single endpoint:
//   https://<project>.supabase.co/functions/v1/mollie-webhook
//
// Deploy: `supabase functions deploy mollie-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Mollie sends form-encoded body with just `id=tr_xxx`
    const text = await req.text()
    const params = new URLSearchParams(text)
    const paymentId = params.get('id')
    if (!paymentId) {
      console.warn('mollie webhook: no id in body', text)
      return new Response('no id', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Find our order via the Mollie payment id we stored
    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id, gateway_order_id')
      .eq('gateway_transaction_id', paymentId)
      .single()

    if (!order) {
      console.warn('mollie webhook: order not found', paymentId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
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
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    // Re-fetch the payment from Mollie — this is the signature-equivalent
    // (we trust only what we read from Mollie's own API with our credentials).
    const r = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const payment = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('mollie webhook: fetch payment failed', payment)
      return new Response('mollie api error', { status: 200, headers: corsHeaders })
    }

    // Map Mollie status → our payment_status
    let paymentStatus: string | null = null
    const status = String(payment.status || '').toLowerCase()
    if (status === 'paid' || status === 'authorized') paymentStatus = 'paid'
    else if (status === 'pending' || status === 'open') paymentStatus = 'pending'
    else if (status === 'canceled') paymentStatus = 'cancelled'
    else if (status === 'expired') paymentStatus = 'expired'
    else if (status === 'failed') paymentStatus = 'failed'

    // Check for refunds — Mollie also sends webhooks when a refund is created
    if (payment.amountRefunded?.value && Number(payment.amountRefunded.value) > 0) {
      paymentStatus = 'refunded'
    }

    if (!paymentStatus) return new Response('status not actionable', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = {
      payment_status: paymentStatus,
      payment_method: payment.method || null,
    }
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    await supabase.from('orders').update(patch).eq('id', order.id)

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('mollie webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
