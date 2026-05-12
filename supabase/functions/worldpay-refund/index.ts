// Refund a Worldpay Online order via POST /v1/orders/<orderCode>/refund.
//
// Deploy: `supabase functions deploy worldpay-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WP_API } from '../_shared/worldpay.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// Same minor-unit handling as worldpay-charge.
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'IDR', 'VND'])
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND'])
function toMinorUnits(amount: number, currency: string): number {
  const c = (currency || 'GBP').toUpperCase()
  if (ZERO_DECIMAL.has(c)) return Math.round(amount)
  if (THREE_DECIMAL.has(c)) return Math.round(amount * 1000)
  return Math.round(amount * 100)
}

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
    if (order.gateway_id !== 'worldpay') return json({ error: 'order is not a Worldpay payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Worldpay orderCode recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'worldpay')
      .single()

    const serviceKey = (conn as any)?.server_key
    if (!serviceKey) return json({ error: 'vendor Worldpay not configured' }, 400)

    const refundBody: Record<string, unknown> = {
      refundAmount: toMinorUnits(Number(amount || order.total), order.currency || 'GBP'),
      refundCurrency: (order.currency || 'GBP').toUpperCase(),
      reference: (reason || `Refund order ${orderId}`).slice(0, 60),
    }

    const r = await fetch(`${WP_API}/orders/${order.gateway_transaction_id}/refund`, {
      method: 'POST',
      headers: { 'Authorization': serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(refundBody),
    })
    // Worldpay refund endpoint returns 200 with empty body on success.
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}))
      return json({ error: (detail as any).message || (detail as any).customCode || 'refund failed', detail }, r.status || 500)
    }

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)
    return json({ ok: true })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
