// Refund a Xendit payment.
// Vendor presses "Refund" → frontend calls this with the orderId →
// we look up the gateway_transaction_id (the payment_id Xendit returned
// in the webhook), call Xendit's refund API, and flip the local order
// to refunded.
//
// Deploy: `supabase functions deploy xendit-refund`

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
    if (order.gateway_id !== 'xendit') return json({ error: 'order is not a Xendit payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Xendit payment_id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'xendit')
      .single()

    if (!(conn as any)?.server_key) return json({ error: 'vendor Xendit not configured' }, 400)

    const auth = 'Basic ' + btoa((conn as any).server_key + ':')
    const refundAmount = amount ? Math.round(Number(amount)) : Math.round(Number(order.total))

    // Xendit's modern Refunds API (v2). The path-style endpoint
    // /payments/<payment_id>/refunds also works for some payment types;
    // /refunds works universally.
    const r = await fetch('https://api.xendit.co/refunds', {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: order.gateway_transaction_id,
        amount: refundAmount,
        currency: (order.currency || 'IDR').toUpperCase(),
        reason: reason || 'OTHERS',
      }),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) {
      return json({ error: result.message || 'refund failed', detail: result }, r.status || 500)
    }

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: result.id })
  } catch (e) {
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
