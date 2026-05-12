// Xendit webhook receiver.
// Xendit POSTs an event here when an Invoice changes status (PAID,
// EXPIRED, …) or when a Refund completes. Xendit doesn't use HMAC
// signatures — instead each vendor configures a per-account
// "Callback Verification Token" which Xendit sends in the
// `x-callback-token` header. We compare it (constant-time) to the
// vendor's stored token.
//
// Configure in Xendit Dashboard → Settings → Developers → Webhooks:
//   Invoice paid:        https://<project>.supabase.co/functions/v1/xendit-webhook
//   Invoice expired:     same URL
//   Refund:              same URL
// Then under Settings → Developers → Callback URLs copy the
// "Callback Verification Token" and paste it into the vendor's Xendit
// setup form here.
//
// Deploy: `supabase functions deploy xendit-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-callback-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function constantTimeEq(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const tokenHeader = req.headers.get('x-callback-token') || ''
    const body = await req.json()

    // Xendit invoice payload uses `external_id`; refund/payment payloads
    // sometimes nest things differently. Try a few common places.
    const orderId = body.external_id || body.invoice?.external_id || body.data?.external_id
    if (!orderId) {
      console.warn('xendit webhook: no external_id', body)
      return new Response('no external_id', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('gateway_order_id', orderId)
      .single()

    if (!order) {
      console.warn('xendit webhook: order not found', orderId)
      return new Response('order not found', { status: 200, headers: corsHeaders })
    }

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'xendit')
      .single()

    const expectedToken = (conn as any)?.webhook_secret
    if (!expectedToken) {
      console.error('xendit webhook: no callback token for vendor', order.vendor_id)
      return new Response('vendor token missing', { status: 500, headers: corsHeaders })
    }

    if (!constantTimeEq(tokenHeader, expectedToken)) {
      console.warn('xendit webhook: token mismatch')
      return new Response('invalid callback token', { status: 401, headers: corsHeaders })
    }

    // Map Xendit status to our payment_status. The same webhook URL receives
    // both Invoice events (status=PAID/EXPIRED) and Refund events (status=SUCCEEDED/FAILED).
    const status = String(body.status || '').toUpperCase()
    let paymentStatus: string | null = null
    let transactionId: string | undefined = undefined
    let paymentMethod: string | undefined = undefined

    if (status === 'PAID' || status === 'SETTLED') {
      paymentStatus = 'paid'
      transactionId = body.payment_id || body.id
      paymentMethod = (body.payment_method || body.payment_channel || '').toLowerCase()
    } else if (status === 'EXPIRED') {
      paymentStatus = 'expired'
    } else if (status === 'FAILED') {
      paymentStatus = 'failed'
    } else if (status === 'SUCCEEDED' && body.event_type === 'refund') {
      paymentStatus = 'refunded'
    } else if (status === 'REFUNDED') {
      paymentStatus = 'refunded'
    } else if (body.event === 'refund.succeeded' || body.event === 'refund.created') {
      paymentStatus = 'refunded'
    }

    if (!paymentStatus) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = { payment_status: paymentStatus }
    if (transactionId) patch.gateway_transaction_id = transactionId
    if (paymentMethod) patch.payment_method = paymentMethod
    if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
    if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

    await supabase.from('orders').update(patch).eq('id', order.id)

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('xendit webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
