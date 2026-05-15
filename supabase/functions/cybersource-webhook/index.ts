// CyberSource Secure Acceptance return-handler / webhook.
// When the customer completes payment on the hosted page, CyberSource
// POSTs the result fields (form-encoded) to the URL we set as
// `override_custom_receipt_page`. The payload is signed with the same
// secret_key we used to sign the outbound form.
//
// Configure: vendor's Business Center → Secure Acceptance profile →
//   Notifications → set Merchant POST URL to:
//   https://<project>.supabase.co/functions/v1/cybersource-webhook
//   (Or rely on the receipt-page POST — CyberSource sends to both.)
//
// Deploy: `supabase functions deploy cybersource-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifySecureAcceptanceFields } from '../_shared/cybersource.ts'
import { webhookCors, guardedStatusUpdate } from '../_shared/paymentSecurity.ts'

const corsHeaders = webhookCors

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const text = await req.text()
    const params = new URLSearchParams(text)
    const fields: Record<string, string> = {}
    params.forEach((v, k) => { fields[k] = v })

    const orderId = fields.req_reference_number || fields.reference_number
    if (!orderId) {
      console.warn('cybersource webhook: no order id', fields)
      return new Response('no order id', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('gateway_order_id', orderId)
      .single()
    if (!order) {
      console.warn('cybersource webhook: order not found', orderId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('additional_config')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'cybersource')
      .single()

    const secretKey = (conn as any)?.additional_config?.secretKey
    if (!secretKey) {
      console.error('cybersource webhook: no secretKey for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    const ok = await verifySecureAcceptanceFields(fields, secretKey)
    if (!ok) {
      console.warn('cybersource webhook: signature mismatch')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // decision = ACCEPT | REVIEW | DECLINE | ERROR | CANCEL
    const decision = (fields.decision || '').toUpperCase()
    let paymentStatus: string | null = null
    if (decision === 'ACCEPT') paymentStatus = 'paid'
    else if (decision === 'REVIEW') paymentStatus = 'pending'
    else if (decision === 'DECLINE' || decision === 'ERROR') paymentStatus = 'failed'
    else if (decision === 'CANCEL') paymentStatus = 'cancelled'

    if (!paymentStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = {}
    if (fields.transaction_id) patch.gateway_transaction_id = fields.transaction_id
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()

    const updateResult = await guardedStatusUpdate(supabase, {
      table: 'orders',
      matchColumn: 'id',
      matchValue: order.id,
      nextStatus: paymentStatus,
      patch,
    })
    if (!updateResult.updated && updateResult.reason !== 'not-found') {
      console.log(`cybersource webhook: idempotent skip (${updateResult.reason}) for order ${order.id}, current: ${updateResult.currentStatus}`)
    }
    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('cybersource webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
