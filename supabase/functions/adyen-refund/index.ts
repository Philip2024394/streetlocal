// Refund an Adyen payment.
// Vendor presses "Refund" → we use the stored gateway_transaction_id
// (the pspReference Adyen returned in the AUTHORISATION webhook) and
// POST /v71/payments/<pspReference>/refunds.
//
// Deploy: `supabase functions deploy adyen-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { adyenApiBase, adyenMinorUnits } from '../_shared/adyen.ts'

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
    if (order.gateway_id !== 'adyen') return json({ error: 'order is not an Adyen payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Adyen pspReference recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, additional_config')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'adyen')
      .single()

    const apiKey = (conn as any)?.server_key
    const merchantAccount = (conn as any)?.additional_config?.merchantAccount
    const liveUrlPrefix = (conn as any)?.additional_config?.liveUrlPrefix
    if (!apiKey || !merchantAccount) return json({ error: 'vendor Adyen not configured' }, 400)
    const mode = (conn as any).mode || 'test'

    const cur = (order.currency || 'EUR').toUpperCase()
    const refundAmount = adyenMinorUnits(amount ? Number(amount) : Number(order.total), cur)

    const r = await fetch(`${adyenApiBase(mode, liveUrlPrefix)}/payments/${order.gateway_transaction_id}/refunds`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: { value: refundAmount, currency: cur },
        merchantAccount,
        merchantRefundReason: reason || 'OTHER',
        reference: `refund-${orderId}`,
      }),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result.message || result.errorMessage || 'refund failed', detail: result }, r.status || 500)

    // Adyen refunds are async — actual status comes via REFUND webhook.
    // Update locally to refunded so vendor UI shows the action took effect.
    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: result.pspReference, status: result.status })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
