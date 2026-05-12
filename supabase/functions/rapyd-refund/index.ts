// Refund a Rapyd payment.
// Vendor presses "Refund" → we use the stored gateway_transaction_id
// (set by the webhook to the actual payment_id) and POST /v1/refunds.
//
// Deploy: `supabase functions deploy rapyd-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { rapydRequest } from '../_shared/rapyd.ts'

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
      .select('vendor_id, gateway_id, gateway_transaction_id, total, currency, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'rapyd') return json({ error: 'order is not a Rapyd payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Rapyd payment id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'rapyd')
      .single()

    const accessKey = (conn as any)?.server_key
    const secretKey = (conn as any)?.client_key
    if (!accessKey || !secretKey) return json({ error: 'vendor Rapyd not configured' }, 400)
    const mode = (conn as any).mode || 'test'

    const reqBody: Record<string, unknown> = {
      payment: order.gateway_transaction_id,
      amount: amount ? Number(amount) : Number(order.total),
      currency: (order.currency || 'USD').toUpperCase(),
    }
    if (reason) reqBody.reason = reason

    const data = await rapydRequest(accessKey, secretKey, mode, 'POST', '/v1/refunds', reqBody)

    // Rapyd refunds are usually instant but may be async — update locally; the
    // REFUND_COMPLETED webhook will reconfirm.
    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: data?.id, status: data?.status })
  } catch (e: any) {
    return json({ error: e?.message || 'refund failed', detail: e?.detail }, 500)
  }
})
