// Cancel a held Stripe escrow order: void the PaymentIntent.
// The customer is not charged; the authorisation hold is released
// back to their card. Used when the customer disputes / vendor can't
// fulfil / order is cancelled before delivery.
//
// Deploy: `supabase functions deploy stripe-escrow-cancel`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId, reason, actor } = await req.json()
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_transaction_id, escrow_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'stripe') return json({ error: 'order is not a Stripe escrow order' }, 400)
    if (order.escrow_status !== 'held') return json({ error: `order is not held (status: ${order.escrow_status})` }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Stripe PaymentIntent id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'stripe')
      .single()

    const secretKey = (conn as any)?.server_key
    if (!secretKey) return json({ error: 'vendor Stripe not configured' }, 400)

    // Stripe cancel reasons: duplicate | fraudulent | requested_by_customer | abandoned
    const cancellationReason = (() => {
      const r = String(reason || '').toLowerCase()
      if (['duplicate', 'fraudulent', 'requested_by_customer', 'abandoned'].includes(r)) return r
      return 'requested_by_customer'
    })()

    const body = `cancellation_reason=${encodeURIComponent(cancellationReason)}`
    const r = await fetch(`https://api.stripe.com/v1/payment_intents/${order.gateway_transaction_id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: (result as any).error?.message || 'cancel failed', detail: result }, r.status || 500)

    await supabase.from('orders').update({
      escrow_status: 'cancelled',
      escrow_cancelled_at: new Date().toISOString(),
      payment_status: 'cancelled',
    }).eq('id', orderId)

    return json({ ok: true, cancelledBy: actor || 'unknown', reason: cancellationReason })
  } catch (e) {
    return json({ error: (e as Error).message || 'cancel failed' }, 500)
  }
})
