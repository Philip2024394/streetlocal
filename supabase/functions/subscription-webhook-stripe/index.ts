// subscription-webhook-stripe — Stripe Checkout completion webhook for
// the CENTRAL StreetLocal Stripe account that processes international
// vendor plan activations.
//
// Distinct from stripe-webhook (which handles each vendor's own Stripe
// account for customer orders). This one ONLY processes SLP- order ids
// (StreetLocal Plan activation).
//
// SECURITY: Stripe-Signature header verified with HMAC-SHA256 using
// STREETLOCAL's webhook signing secret (set via Stripe dashboard →
// Developers → Webhooks). Constant-time comparison.
//
// On settlement, flips:
//   - vendor_accounts.plan_level → from order id metadata
//   - vendor_accounts.status = 'active'
//   - vendor_accounts.expires_at = +30 days
//   - payment_records.status = 'paid' (idempotent guard)
//
// Required secrets:
//   STRIPE_SUBSCRIPTION_WEBHOOK_SECRET   whsec_...
//
// Configure in Stripe Dashboard → Developers → Webhooks:
//   Endpoint URL: https://<project>.supabase.co/functions/v1/subscription-webhook-stripe
//   Events: checkout.session.completed, charge.refunded, charge.dispute.created
//
// Deploy: `supabase functions deploy subscription-webhook-stripe --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { webhookCors, constantTimeEq, guardedStatusUpdate, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'

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
  return constantTimeEq(expected, parts.v1)
}

function parsePlanLevelFromOrderId (orderId: string): 'starter' | 'professional' | 'enterprise' | null {
  if (!orderId.startsWith('SLP-')) return null
  const parts = orderId.split('-')
  if (parts.length < 4) return null
  const level = parts[1]
  if (level === 'starter' || level === 'professional' || level === 'enterprise') return level
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: webhookCors })

  try {
    const rawBody = await req.text()
    const sigHeader = req.headers.get('Stripe-Signature') || ''
    const webhookSecret = Deno.env.get('STRIPE_SUBSCRIPTION_WEBHOOK_SECRET')
    if (!webhookSecret) {
      const errId = newErrorId()
      logWithId(errId, 'stripe-sub-webhook-no-secret', { hint: 'set STRIPE_SUBSCRIPTION_WEBHOOK_SECRET' })
      return new Response('not configured', { status: 500, headers: webhookCors })
    }

    // SIGNATURE — verifies HMAC + constant-time. Closes audit #11.
    if (!(await verifyStripeSig(rawBody, sigHeader, webhookSecret))) {
      const errId = newErrorId()
      logWithId(errId, 'stripe-sub-signature-mismatch', { sigHeaderPresent: !!sigHeader })
      return new Response('invalid signature', { status: 401, headers: webhookCors })
    }

    let event: any
    try { event = JSON.parse(rawBody) } catch { return new Response('invalid json', { status: 400, headers: webhookCors }) }

    const obj = event?.data?.object || {}
    // Stripe Checkout puts our order id in client_reference_id.
    // Refunds / disputes carry it in metadata via the PaymentIntent.
    const orderId = obj.client_reference_id
      || obj.metadata?.order_id
      || obj.payment_intent && (typeof obj.payment_intent === 'object' ? obj.payment_intent.metadata?.order_id : null)

    if (!orderId || !String(orderId).startsWith('SLP-')) {
      // Not ours — ack so Stripe stops retrying. Could be a customer-side
      // order routed via the wrong webhook URL.
      return new Response('not a subscription order', { status: 200, headers: webhookCors })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: paymentRow } = await supabase
      .from('payment_records')
      .select('id, vendor_id, period_end, amount, currency, status')
      .eq('midtrans_order_id', orderId)  // column name is midtrans_order_id but stores any gateway's order_id
      .single()
    if (!paymentRow) {
      console.warn('stripe subscription webhook: payment_records row not found for', orderId)
      return new Response('payment row not found', { status: 200, headers: webhookCors })
    }

    // Map Stripe event types → our payment statuses.
    let recordStatus: 'paid' | 'failed' | 'refunded' | null = null
    let vendorActivate = false
    let vendorDeactivate = false

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'payment_intent.succeeded':
        if (obj.payment_status === 'paid' || obj.status === 'succeeded' || event.type === 'checkout.session.completed') {
          recordStatus = 'paid'; vendorActivate = true
        }
        break
      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed':
        recordStatus = 'failed'
        break
      case 'charge.refunded':
      case 'charge.dispute.created':
      case 'charge.dispute.funds_withdrawn':
        recordStatus = 'refunded'; vendorDeactivate = true
        break
    }

    if (!recordStatus) {
      return new Response('event ignored', { status: 200, headers: webhookCors })
    }

    const patch: Record<string, unknown> = {
      midtrans_transaction_id: obj.id || obj.payment_intent || null,
      midtrans_transaction_status: event.type,
      payment_method: 'stripe',
    }
    if (vendorActivate) {
      patch.verified_at = new Date().toISOString()
      patch.verified_by = 'stripe-auto'
    }
    if (recordStatus === 'refunded') {
      patch.refunded_at = new Date().toISOString()
    }

    const result = await guardedStatusUpdate(supabase, {
      table: 'payment_records' as any,
      matchColumn: 'id',
      matchValue: paymentRow.id,
      nextStatus: recordStatus,
      statusColumn: 'status',
      patch,
    })
    if (!result.updated) {
      console.log(`stripe subscription idempotent skip: ${result.reason} for ${orderId}`)
      return new Response('OK', { status: 200, headers: webhookCors })
    }

    if (vendorActivate) {
      const planLevel = parsePlanLevelFromOrderId(orderId)
      const renewAt = new Date(paymentRow.period_end || (Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString()
      const vendorPatch: Record<string, unknown> = {
        status: 'active',
        url_active: true,
        activated_at: new Date().toISOString(),
        plan_started_at: new Date().toISOString(),
        expires_at: renewAt,
        subscription_renew_at: renewAt,
      }
      if (planLevel) vendorPatch.plan_level = planLevel
      await supabase.from('vendor_accounts').update(vendorPatch).eq('id', paymentRow.vendor_id)
    }
    if (vendorDeactivate) {
      await supabase.from('vendor_accounts').update({
        status: 'expired',
        url_active: false,
        expires_at: new Date().toISOString(),
      }).eq('id', paymentRow.vendor_id)
    }

    return new Response('OK', { status: 200, headers: webhookCors })
  } catch (e) {
    const errId = newErrorId()
    logWithId(errId, 'stripe-subscription-webhook-uncaught', { error: String(e) })
    return new Response('server error', { status: 500, headers: webhookCors })
  }
})
