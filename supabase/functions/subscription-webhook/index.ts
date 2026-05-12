// StreetLocal subscription webhook — Midtrans Notification handler for
// the CENTRAL StreetLocal Midtrans account that processes vendor
// subscription payments. Distinct from midtrans-webhook which handles
// each vendor's own Midtrans account for customer orders.
//
// On settlement (or capture+accept), this flips the vendor's
// vendor_accounts.status to 'active' and updates the matching
// payment_records row keyed by midtrans_order_id.
//
// Signature: sha512(order_id + status_code + gross_amount + server_key)
//
// Configure in Midtrans dashboard (StreetLocal's account):
//   Settings → Configuration → Payment Notification URL:
//     https://<project>.supabase.co/functions/v1/subscription-webhook
//
// Deploy: `supabase functions deploy subscription-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha512hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const event = await req.json()
    const orderId = event?.order_id
    if (!orderId) return new Response('no order id', { status: 200, headers: corsHeaders })
    if (!String(orderId).startsWith('SLS-')) {
      // Not a subscription order — ignore. (Could be a stray vendor-side
      // Midtrans webhook hitting the wrong URL.)
      return new Response('not a subscription order', { status: 200, headers: corsHeaders })
    }

    const serverKey = Deno.env.get('MIDTRANS_SUBSCRIPTION_SERVER_KEY')
    if (!serverKey) {
      console.error('subscription webhook: MIDTRANS_SUBSCRIPTION_SERVER_KEY not set')
      return new Response('not configured', { status: 500, headers: corsHeaders })
    }

    // Verify Midtrans signature: sha512(order_id + status_code + gross_amount + server_key)
    const sigInput = `${orderId}${event.status_code}${event.gross_amount}${serverKey}`
    const expected = await sha512hex(sigInput)
    if (event.signature_key && event.signature_key.toLowerCase() !== expected.toLowerCase()) {
      console.warn('subscription webhook: signature mismatch')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: paymentRow } = await supabase
      .from('payment_records')
      .select('id, vendor_id, period_end, amount, notes')
      .eq('midtrans_order_id', orderId)
      .single()

    if (!paymentRow) {
      console.warn('subscription webhook: payment_records row not found for', orderId)
      return new Response('payment row not found', { status: 200, headers: corsHeaders })
    }

    const txStatus = String(event.transaction_status || '').toLowerCase()
    const fraudStatus = String(event.fraud_status || '').toLowerCase()
    let recordStatus: 'paid' | 'pending' | 'failed' | null = null
    let vendorActivate = false

    if (txStatus === 'capture' && fraudStatus === 'accept') { recordStatus = 'paid'; vendorActivate = true }
    else if (txStatus === 'settlement') { recordStatus = 'paid'; vendorActivate = true }
    else if (txStatus === 'pending') { recordStatus = 'pending' }
    else if (['cancel', 'expire', 'deny', 'failure'].includes(txStatus)) { recordStatus = 'failed' }

    if (!recordStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const recordPatch: Record<string, unknown> = {
      status: recordStatus,
      midtrans_transaction_id: event.transaction_id,
      midtrans_transaction_status: txStatus,
      payment_method: event.payment_type || 'card',
    }
    if (vendorActivate) {
      recordPatch.verified_at = new Date().toISOString()
      recordPatch.verified_by = 'midtrans-auto'
    }
    await supabase.from('payment_records').update(recordPatch).eq('id', paymentRow.id)

    if (vendorActivate) {
      const renewAt = new Date(paymentRow.period_end || (Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString()
      await supabase.from('vendor_accounts').update({
        status: 'active',
        url_active: true,
        activated_at: new Date().toISOString(),
        plan_started_at: new Date().toISOString(),
        expires_at: renewAt,
        subscription_renew_at: renewAt,
      }).eq('id', paymentRow.vendor_id)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('subscription webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
