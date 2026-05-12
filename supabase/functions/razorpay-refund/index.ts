// Refund a Razorpay payment.
// Vendor presses "Refund" → frontend calls this with the orderId →
// we use the stored gateway_transaction_id (the payment id Razorpay
// captured) and POST /v1/payments/<payment_id>/refund.
//
// Deploy: `supabase functions deploy razorpay-refund`

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
    if (order.gateway_id !== 'razorpay') return json({ error: 'order is not a Razorpay payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Razorpay payment id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'razorpay')
      .single()

    const keyId = (conn as any)?.server_key
    const keySecret = (conn as any)?.client_key
    if (!keyId || !keySecret) return json({ error: 'vendor Razorpay not configured' }, 400)

    const auth = 'Basic ' + btoa(`${keyId}:${keySecret}`)
    const refundBody: Record<string, unknown> = { speed: 'normal' }
    if (amount) refundBody.amount = Math.round(Number(amount) * 100) // paise
    if (reason) refundBody.notes = { reason }

    const r = await fetch(`https://api.razorpay.com/v1/payments/${order.gateway_transaction_id}/refund`, {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(refundBody),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result.error?.description || 'refund failed', detail: result }, r.status || 500)

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: result.id })
  } catch (e) {
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
