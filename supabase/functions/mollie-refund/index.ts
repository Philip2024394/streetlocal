// Refund a Mollie payment.
// Vendor presses "Refund" → frontend calls this with the orderId →
// we use the stored Mollie payment id and POST
// /v2/payments/<paymentId>/refunds.
//
// Deploy: `supabase functions deploy mollie-refund`

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
    const { orderId, reason, amount } = await req.json()
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_transaction_id, total, currency, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'mollie') return json({ error: 'order is not a Mollie payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Mollie payment id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'mollie')
      .single()

    const mode = (conn as any)?.mode || 'test'
    const apiKey = mode === 'live' ? (conn as any)?.server_key : (conn as any)?.client_key
    if (!apiKey) return json({ error: 'vendor Mollie not configured' }, 400)

    const cur = (order.currency || 'EUR').toUpperCase()
    const decimals = cur === 'JPY' ? 0 : 2
    const amountStr = amount ? Number(amount).toFixed(decimals) : Number(order.total).toFixed(decimals)

    const r = await fetch(`https://api.mollie.com/v2/payments/${order.gateway_transaction_id}/refunds`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: { currency: cur, value: amountStr },
        description: reason || 'Vendor refund',
      }),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result.detail || 'refund failed', detail: result }, r.status || 500)

    // Mollie will also fire a webhook to confirm — update now for snappy UI
    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: result.id })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
