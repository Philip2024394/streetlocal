// Refund a Stripe charge.
// Vendor presses "Refund" in their dashboard → frontend calls this with
// the orderId → we hit Stripe `/v1/refunds` using the stored
// payment_intent id → mark the order as refunded locally.
//
// Deploy: `supabase functions deploy stripe-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })

const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF', 'IDR'])

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId, reason, amount } = await req.json()
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_transaction_id, total, currency, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'stripe') return json({ error: 'order is not a Stripe payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Stripe payment_intent recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'stripe')
      .single()

    const secretKey = (conn as any)?.server_key
    if (!secretKey) return json({ error: 'vendor Stripe not configured' }, 400)

    const cur = (order.currency || 'IDR').toUpperCase()
    const factor = ZERO_DECIMAL.has(cur) ? 1 : 100
    const refundAmount = amount ? Math.round(Number(amount) * factor) : null

    const form = new URLSearchParams()
    form.set('payment_intent', order.gateway_transaction_id)
    if (refundAmount) form.set('amount', String(refundAmount))
    if (reason && ['duplicate', 'fraudulent', 'requested_by_customer'].includes(reason)) form.set('reason', reason)

    const r = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || result.error) {
      return json({ error: result.error?.message || 'refund failed', detail: result }, r.status || 500)
    }

    // Webhook will also flip status, but update immediately for snappy UI
    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: result.id })
  } catch (e) {
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
