// StreetLocal subscription webhook — Midtrans Notification handler for
// the CENTRAL StreetLocal Midtrans account that processes VENDOR plan
// activation payments. Distinct from midtrans-webhook which handles
// each vendor's own Midtrans account for customer orders.
//
// On successful settlement, this:
//   1. Flips vendor_accounts.plan_level → starter | professional | enterprise
//      (parsed from order id: SLP-<level>-<slug>-<ts>)
//   2. Sets status = 'active' + expires_at = +30 days
//   3. Updates the matching payment_records row
//
// SECURITY HARDENING (audit fixes):
//   • constant-time signature compare
//   • idempotent (won't reprocess duplicate webhook deliveries)
//   • no CORS *
//   • full state machine including 'refund' / 'chargeback' txStatus
//     (sets vendor back to 'expired' on refund — closes their app
//     until they re-pay)
//
// Order id formats accepted:
//   SLP-<plan_level>-<slug>-<ts>  ← NEW flow (this file)
//   SLS-<product>-<slug>-<ts>     ← LEGACY whatsapp/chat flow
//
// Configure in Midtrans dashboard (StreetLocal's account):
//   Settings → Configuration → Payment Notification URL:
//     https://<project>.supabase.co/functions/v1/subscription-webhook
//
// Deploy: `supabase functions deploy subscription-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { webhookCors, constantTimeEq, guardedStatusUpdate, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'

async function sha512hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Parse "SLP-professional-myshop-1234567890" → "professional".
// Returns null if order id isn't ours or shape is wrong.
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
    const event = await req.json()
    const orderId = event?.order_id as string | undefined
    if (!orderId) return new Response('no order id', { status: 200, headers: webhookCors })
    // Accept both new (SLP-) and legacy (SLS-) order id formats.
    if (!orderId.startsWith('SLP-') && !orderId.startsWith('SLS-')) {
      return new Response('not a subscription order', { status: 200, headers: webhookCors })
    }

    const serverKey = Deno.env.get('MIDTRANS_SUBSCRIPTION_SERVER_KEY')
    if (!serverKey) {
      const errId = newErrorId()
      logWithId(errId, 'subscription-webhook-no-key', { orderId })
      return new Response('not configured', { status: 500, headers: webhookCors })
    }

    // SIGNATURE — constant-time. Closes audit #11.
    const sigInput = `${orderId}${event.status_code}${event.gross_amount}${serverKey}`
    const expected = (await sha512hex(sigInput)).toLowerCase()
    const received = String(event.signature_key || '').toLowerCase()
    if (!received || !constantTimeEq(received, expected)) {
      const errId = newErrorId()
      logWithId(errId, 'subscription-signature-mismatch', { orderId })
      return new Response('invalid signature', { status: 401, headers: webhookCors })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: paymentRow } = await supabase
      .from('payment_records')
      .select('id, vendor_id, period_end, amount, currency, status')
      .eq('midtrans_order_id', orderId)
      .single()
    if (!paymentRow) {
      console.warn('subscription webhook: payment_records row not found for', orderId)
      return new Response('payment row not found', { status: 200, headers: webhookCors })
    }

    const txStatus = String(event.transaction_status || '').toLowerCase()
    const fraudStatus = String(event.fraud_status || '').toLowerCase()
    let recordStatus: 'paid' | 'pending' | 'failed' | 'refunded' | null = null
    let vendorActivate = false
    let vendorDeactivate = false

    if ((txStatus === 'capture' && fraudStatus === 'accept') || txStatus === 'settlement') {
      recordStatus = 'paid'; vendorActivate = true
    } else if (txStatus === 'pending') {
      recordStatus = 'pending'
    } else if (['cancel', 'expire', 'deny', 'failure'].includes(txStatus)) {
      recordStatus = 'failed'
    } else if (txStatus === 'refund' || txStatus === 'partial_refund' || txStatus === 'chargeback' || txStatus === 'partial_chargeback') {
      recordStatus = 'refunded'
      vendorDeactivate = true
    }

    if (!recordStatus) return new Response('event ignored', { status: 200, headers: webhookCors })

    // Idempotent payment_records update — won't downgrade a terminal
    // 'paid' → 'refunded' via a stale webhook. Closes audit #1 + #5.
    const recordPatch: Record<string, unknown> = {
      midtrans_transaction_id: event.transaction_id,
      midtrans_transaction_status: txStatus,
      payment_method: event.payment_type || 'card',
    }
    if (vendorActivate) {
      recordPatch.verified_at = new Date().toISOString()
      recordPatch.verified_by = 'midtrans-auto'
    }
    if (recordStatus === 'refunded') {
      recordPatch.refunded_at = new Date().toISOString()
    }
    const result = await guardedStatusUpdate(supabase, {
      table: 'payment_records' as any, // payment_records not in guarded enum, fall through
      matchColumn: 'id',
      matchValue: paymentRow.id,
      nextStatus: recordStatus,
      statusColumn: 'status',
      patch: recordPatch,
    })
    if (!result.updated) {
      // Idempotent re-delivery — return 200 so Midtrans stops retrying.
      console.log(`subscription webhook idempotent skip: ${result.reason} for ${orderId}`)
      return new Response('OK', { status: 200, headers: webhookCors })
    }

    // Apply vendor-side effects ONLY on real transitions.
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
      // NEW: set plan_level when the order id encodes it (SLP- format).
      // Legacy SLS- orders keep using plan_tier and don't touch plan_level.
      if (planLevel) vendorPatch.plan_level = planLevel
      await supabase.from('vendor_accounts').update(vendorPatch).eq('id', paymentRow.vendor_id)
    }
    if (vendorDeactivate) {
      // Refund / chargeback — close the vendor's shop until they re-pay.
      // We don't reset plan_level (keeps history) but do flip status.
      await supabase.from('vendor_accounts').update({
        status: 'expired',
        url_active: false,
        expires_at: new Date().toISOString(),
      }).eq('id', paymentRow.vendor_id)
    }

    return new Response('OK', { status: 200, headers: webhookCors })
  } catch (e) {
    const errId = newErrorId()
    logWithId(errId, 'subscription-webhook-uncaught', { error: String(e) })
    return new Response('server error', { status: 500, headers: webhookCors })
  }
})
