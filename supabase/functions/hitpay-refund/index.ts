// Refund a HitPay payment.
// HitPay refund API: POST /v1/refund with form-encoded payment_id +
// optional amount (for partial). The stored gateway_transaction_id is
// set by the webhook to the HitPay payment_id (NOT the payment_request_id).
//
// Deploy: `supabase functions deploy hitpay-refund`

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
    const { orderId, amount } = await req.json()
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_transaction_id, total, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'hitpay') return json({ error: 'order is not a HitPay payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no HitPay payment id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'hitpay')
      .single()

    const apiKey = (conn as any)?.server_key
    if (!apiKey) return json({ error: 'vendor HitPay not configured' }, 400)
    const mode = (conn as any).mode || 'test'
    const apiBase = mode === 'live' ? 'https://api.hit-pay.com/v1' : 'https://api.sandbox.hit-pay.com/v1'

    const form = new URLSearchParams()
    form.set('payment_id', order.gateway_transaction_id)
    if (amount) form.set('amount', Number(amount).toFixed(2))

    const r = await fetch(`${apiBase}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-BUSINESS-API-KEY': apiKey, 'X-Requested-With': 'XMLHttpRequest' },
      body: form.toString(),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result.message || 'refund failed', detail: result }, r.status || 500)

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: result.id })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
