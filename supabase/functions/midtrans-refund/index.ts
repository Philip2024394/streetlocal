// Refund a Midtrans transaction.
// Vendor presses "Refund" in their dashboard → frontend calls this with
// the orderId → we hit Midtrans `/v2/<order_id>/refund` and mark the
// order as refunded locally.
//
// Deploy: `supabase functions deploy midtrans-refund`

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
      .select('vendor_id, gateway_id, gateway_order_id, total, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'midtrans') return json({ error: 'order is not a Midtrans payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'midtrans')
      .single()

    if (!conn?.server_key) return json({ error: 'vendor Midtrans not configured' }, 400)

    const url = conn.mode === 'live'
      ? `https://api.midtrans.com/v2/${order.gateway_order_id}/refund`
      : `https://api.sandbox.midtrans.com/v2/${order.gateway_order_id}/refund`

    const refundAmount = Number(amount) || Number(order.total)
    const auth = 'Basic ' + btoa(conn.server_key + ':')
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth, 'Accept': 'application/json' },
      body: JSON.stringify({ amount: refundAmount, reason: reason || 'requested by vendor' }),
    })

    const result = await r.json().catch(() => ({}))
    if (!r.ok || (result.status_code && Number(result.status_code) >= 400)) {
      return json({ error: result.status_message || 'refund failed', detail: result }, 500)
    }

    await supabase
      .from('orders')
      .update({ payment_status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', orderId)

    return json({ ok: true, refundAmount })
  } catch (e) {
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
