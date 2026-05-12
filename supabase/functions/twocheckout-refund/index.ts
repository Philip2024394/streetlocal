// Refund a 2Checkout (Verifone) order.
// Uses REST 6.0 with X-Avangate-Authentication header.
// POST /rest/6.0/orders/<REFNO>/refund/
//
// Deploy: `supabase functions deploy twocheckout-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TC_REST, buildAvangateAuth } from '../_shared/twocheckout.ts'

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
    const { orderId, amount, reason } = await req.json()
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_transaction_id, total, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== '2checkout') return json({ error: 'order is not a 2Checkout payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no 2Checkout REFNO recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', '2checkout')
      .single()

    const merchantCode = (conn as any)?.server_key
    const secretKey   = (conn as any)?.client_key
    if (!merchantCode || !secretKey) return json({ error: 'vendor 2Checkout not configured' }, 400)

    const auth = await buildAvangateAuth(merchantCode, secretKey)
    const body: Record<string, unknown> = {
      Amount: Number(amount || order.total).toFixed(2),
      Reason: reason || 'Refund requested by vendor',
      Comment: reason || 'Refund requested by vendor',
    }

    const r = await fetch(`${TC_REST}/orders/${order.gateway_transaction_id}/refund/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Avangate-Authentication': auth,
      },
      body: JSON.stringify(body),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result.message || result.error_code || 'refund failed', detail: result }, r.status || 500)

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, detail: result })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
