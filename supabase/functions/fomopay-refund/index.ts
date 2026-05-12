// Refund a FOMO Pay payment.
// FOMO Pay refund endpoint expects a signed form-POST. The exact path
// varies by integration; this implementation uses /online/v3/refund
// which is the modern endpoint. If the vendor's account is on the
// older API they may need to adjust.
//
// Deploy: `supabase functions deploy fomopay-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { FOMO_API, fomoSign } from '../_shared/fomopay.ts'

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
      .select('vendor_id, gateway_id, gateway_transaction_id, gateway_order_id, total, currency, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'fomo-pay') return json({ error: 'order is not a FOMO Pay payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, webhook_secret, additional_config')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'fomo-pay')
      .single()

    const apiKey = (conn as any)?.server_key
    const signKey = (conn as any)?.webhook_secret || apiKey
    const merchantId = (conn as any)?.additional_config?.merchantId
    if (!apiKey || !signKey || !merchantId) return json({ error: 'vendor FOMO Pay not configured' }, 400)
    const mode = (conn as any).mode || 'test'
    const signType = (conn as any).additional_config?.signType || 'HMAC-SHA256'

    const refundOrderNo = `R-${orderId}-${Date.now()}`
    const refundAmountMinor = Math.round(Number(amount || order.total) * 100)

    const params: Record<string, unknown> = {
      merchant_no: merchantId,
      order_no: order.gateway_order_id,
      refund_order_no: refundOrderNo,
      refund_amount: refundAmountMinor,
      currency: (order.currency || 'SGD').toUpperCase(),
      reason: reason || 'requested by vendor',
      timestamp: Math.floor(Date.now() / 1000),
      sign_type: signType,
      version: '1.0',
    }
    if (order.gateway_transaction_id) params.trade_no = order.gateway_transaction_id

    params.sign = await fomoSign(params, signKey, signType)

    const form = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => form.set(k, String(v)))

    const r = await fetch(`${FOMO_API(mode)}/online/v3/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: form.toString(),
    })
    const result = await r.json().catch(async () => ({ raw: await r.text() }))
    if (!r.ok || (result.code && Number(result.code) !== 0 && result.code !== 'SUCCESS')) {
      return json({ error: result.error_msg || result.message || 'refund failed', detail: result }, r.status || 500)
    }

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundOrderNo, refundId: result.refund_id })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
