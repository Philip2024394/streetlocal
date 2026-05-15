// Midtrans payment notification webhook.
// Midtrans calls this URL when a transaction's status changes (paid,
// pending, failed, refunded, etc.). We verify the signature using the
// vendor's server_key, then update the matching `orders` row.
//
// Configure in Midtrans dashboard: Settings → Configuration → Payment
// Notification URL = https://<your-project>.supabase.co/functions/v1/midtrans-webhook
//
// Deploy: `supabase functions deploy midtrans-webhook --no-verify-jwt`
// (the --no-verify-jwt is critical: Midtrans doesn't send a Supabase JWT)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { webhookCors, guardedStatusUpdate } from '../_shared/paymentSecurity.ts'

const corsHeaders = webhookCors

// Midtrans signs every notification with:
//   signature_key = SHA512(order_id + status_code + gross_amount + server_key)
async function sha512Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function mapStatus(transaction_status: string, fraud_status?: string): string {
  switch (transaction_status) {
    case 'capture':
    case 'settlement':
      return fraud_status && fraud_status !== 'accept' ? 'pending' : 'paid'
    case 'pending':
      return 'pending'
    case 'deny':
    case 'cancel':
    case 'failure':
      return 'failed'
    case 'expire':
      return 'expired'
    case 'refund':
    case 'partial_refund':
      return 'refunded'
    default:
      return 'pending'
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { order_id, status_code, gross_amount, signature_key, transaction_status, payment_type, transaction_id, fraud_status } = body

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return new Response('invalid payload', { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find the order to know which vendor it belongs to
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('gateway_order_id', order_id)
      .single()

    if (orderErr || !order) {
      console.warn('webhook: order not found', order_id)
      return new Response('order not found', { status: 404, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'midtrans')
      .single()

    if (!conn?.server_key) {
      console.warn('webhook: vendor not configured', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    // Verify signature
    const expected = await sha512Hex(order_id + status_code + gross_amount + conn.server_key)
    if (expected !== signature_key) {
      console.warn('webhook: invalid signature for order', order_id)
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    const paymentStatus = mapStatus(transaction_status, fraud_status)
    const patch: Record<string, unknown> = {
      payment_method: payment_type,
      gateway_transaction_id: transaction_id,
    }
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
      console.log(`midtrans webhook: idempotent skip (${updateResult.reason}) for order ${order.id}, current: ${updateResult.currentStatus}`)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
