// 2Checkout (Verifone) IPN (Instant Notification System) receiver.
// 2Checkout POSTs form-encoded notifications when an order status changes.
// Modern accounts include a HASH_SHA256_SIGNATURE field that we verify
// against the per-vendor INS Secret Word.
//
// Configure: Dashboard → Notifications → Settings → set INS Secret Word,
//                                     → Add URL: https://<project>.supabase.co/functions/v1/twocheckout-webhook
//             Enable HASH_SHA256_SIGNATURE if available.
//
// Deploy: `supabase functions deploy twocheckout-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyTwoCheckoutIPN } from '../_shared/twocheckout.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const text = await req.text()
    const params = new URLSearchParams(text)
    const fields: Record<string, string> = {}
    params.forEach((v, k) => { fields[k] = v })

    const orderId = fields.merchant_order_id || fields.IPN_MERCHANT_ORDER_ID || fields.REFNOEXT || fields.SALENO
    if (!orderId) {
      console.warn('2checkout webhook: no order id', fields)
      return new Response('no order id', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const isFoodOrder = String(orderId).startsWith('FOO-')
    let order: any = null
    if (isFoodOrder) {
      const { data } = await supabase.from('food_orders').select('id, restaurant_id').eq('gateway_order_id', orderId).single()
      if (data) order = { id: data.id, vendor_id: data.restaurant_id }
    } else {
      const { data } = await supabase.from('orders').select('id, vendor_id').eq('gateway_order_id', orderId).single()
      order = data
    }
    if (!order) {
      console.warn('2checkout webhook: order not found', orderId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', '2checkout')
      .single()

    const secretWord = (conn as any)?.webhook_secret
    if (!secretWord) {
      console.error('2checkout webhook: no INS Secret Word for vendor', order.vendor_id)
      return new Response('vendor not configured', { status: 500, headers: corsHeaders })
    }

    const ok = await verifyTwoCheckoutIPN(fields, secretWord)
    if (!ok) {
      console.warn('2checkout webhook: signature invalid (or legacy MD5 mode — enable HASH_SHA256_SIGNATURE in dashboard)')
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    // 2Checkout status fields vary by IPN version:
    //   MESSAGE_TYPE: ORDER_CREATED | FRAUD_STATUS_CHANGED | INVOICE_STATUS_CHANGED
    //   IPN_PSTATUS_1 (legacy): paid|cancelled|pending
    //   INVOICE_STATUS / ORDER_STATUS: AUTHRECEIVED | COMPLETE | PURCHASEPENDING | REFUND | CANCEL | DECLINE
    const status = (fields.INVOICE_STATUS || fields.ORDER_STATUS || fields.IPN_PSTATUS_1 || '').toUpperCase()

    let paymentStatus: string | null = null
    if (status === 'COMPLETE' || status === 'AUTHRECEIVED' || status === 'PAID' || status === 'APPROVED') paymentStatus = 'paid'
    else if (status === 'PURCHASEPENDING' || status === 'PENDING') paymentStatus = 'pending'
    else if (status === 'DECLINE' || status === 'DECLINED' || status === 'FAILED') paymentStatus = 'failed'
    else if (status === 'REFUND' || status === 'REFUNDED' || status === 'REVERSED') paymentStatus = 'refunded'
    else if (status === 'CANCEL' || status === 'CANCELLED' || status === 'CANCELED') paymentStatus = 'cancelled'

    if (!paymentStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = { payment_status: paymentStatus }
    const refNo = fields.REFNO || fields.IPN_PID_1 || fields.SALENO
    if (refNo) patch.gateway_transaction_id = refNo
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    if (isFoodOrder) {
      const { maybeUpdateFoodOrder } = await import('../_shared/foodOrderUpdate.ts')
      await maybeUpdateFoodOrder(supabase, orderId, paymentStatus, (patch as any).gateway_transaction_id, '2checkout')
    } else {
      await supabase.from('orders').update(patch).eq('id', order.id)
    }

    // 2Checkout expects a specific echo response — they want us to echo
    // back the IPN with our own hash (EPAYMENT) confirming receipt. For
    // simplicity we return a plain 200 OK; 2Checkout retries on non-2xx
    // but otherwise accepts non-EPAYMENT responses as ack.
    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('2checkout webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
