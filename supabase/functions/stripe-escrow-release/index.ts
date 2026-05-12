// Release a held Stripe escrow order: capture the PaymentIntent.
// Customer (or vendor / admin) calls this to confirm delivery and let
// funds settle to the vendor's Stripe account.
//
// Deploy: `supabase functions deploy stripe-escrow-release`

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
    const { orderId, actor } = await req.json() // actor: 'customer' | 'vendor' | 'admin'
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_transaction_id, payment_status, escrow_status')
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

    // Capture the PaymentIntent (default = full original amount).
    const r = await fetch(`https://api.stripe.com/v1/payment_intents/${order.gateway_transaction_id}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: '',
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: (result as any).error?.message || 'capture failed', detail: result }, r.status || 500)

    await supabase.from('orders').update({
      escrow_status: 'released',
      escrow_captured_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      payment_status: 'paid',
    }).eq('id', orderId)

    return json({ ok: true, releasedBy: actor || 'unknown' })
  } catch (e) {
    return json({ error: (e as Error).message || 'release failed' }, 500)
  }
})
