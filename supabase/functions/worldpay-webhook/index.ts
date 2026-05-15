// Worldpay Online order-notification webhook.
// Worldpay POSTs JSON notifications when order state changes (refunds,
// chargebacks, late captures). Body is HMAC-SHA512 signed with the
// vendor's webhook signing secret in the X-Worldpay-Signature header.
//
// Configure: Worldpay dashboard → Webhooks → Add → URL =
//   https://<project>.supabase.co/functions/v1/worldpay-webhook
//   Subscribe to order events; copy the signing secret into the
//   "Webhook signing secret" field on the vendor's connect form.
//
// Deploy: `supabase functions deploy worldpay-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyWorldpaySignature } from '../_shared/worldpay.ts'
import { webhookCors, guardedStatusUpdate } from '../_shared/paymentSecurity.ts'

const corsHeaders = webhookCors

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const rawBody = await req.text()
    const event: any = (() => { try { return JSON.parse(rawBody) } catch { return null } })()
    if (!event) return new Response('invalid json', { status: 400, headers: corsHeaders })

    const orderId = event.customerOrderCode || event.orderCode
    if (!orderId) return new Response('no order id', { status: 200, headers: corsHeaders })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Match by gateway_order_id (customerOrderCode = the orderId we sent)
    // or fall back to gateway_transaction_id (Worldpay's orderCode).
    let { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('gateway_order_id', orderId)
      .single()
    if (!order && event.orderCode) {
      const { data: order2 } = await supabase
        .from('orders')
        .select('id, vendor_id')
        .eq('gateway_transaction_id', event.orderCode)
        .single()
      order = order2 || null
    }
    if (!order) {
      console.warn('worldpay webhook: order not found', orderId, event.orderCode)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'worldpay')
      .single()

    const secret = (conn as any)?.webhook_secret
    if (secret) {
      // Only enforce when the vendor has set up signing — Worldpay allows
      // webhook configs without signing for back-office use.
      const ok = await verifyWorldpaySignature(rawBody, req.headers.get('x-worldpay-signature'), secret)
      if (!ok) {
        console.warn('worldpay webhook: signature mismatch')
        return new Response('invalid signature', { status: 401, headers: corsHeaders })
      }
    }

    const status = String(event.paymentStatus || event.status || '').toUpperCase()
    let paymentStatus: string | null = null
    if (status === 'SUCCESS' || status === 'AUTHORIZED' || status === 'SETTLED' || status === 'CAPTURED') paymentStatus = 'paid'
    else if (status === 'REFUNDED' || status === 'SENT_FOR_REFUND') paymentStatus = 'refunded'
    else if (status === 'CHARGED_BACK' || status === 'INFORMATION_REQUESTED' || status === 'CHARGEBACK_REVERSED') paymentStatus = 'refunded'
    else if (status === 'FAILED' || status === 'REFUSED' || status === 'CANCELLED') paymentStatus = 'failed'

    if (!paymentStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = {}
    if (event.orderCode) patch.gateway_transaction_id = event.orderCode
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
      console.log(`worldpay webhook: idempotent skip (${updateResult.reason}) for order ${order.id}, current: ${updateResult.currentStatus}`)
    }
    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('worldpay webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
