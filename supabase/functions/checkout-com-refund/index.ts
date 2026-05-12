// Refund a Checkout.com payment.
// Vendor presses "Refund" → we use the stored gateway_transaction_id
// (the payment id Checkout.com captured) and POST
// /payments/<payment_id>/refunds.
//
// Deploy: `supabase functions deploy checkout-com-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF', 'IDR'])
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND'])
function minor(amount: number, currency: string): number {
  const cur = currency.toUpperCase()
  if (THREE_DECIMAL.has(cur)) return Math.round(amount * 1000)
  if (ZERO_DECIMAL.has(cur)) return Math.round(amount)
  return Math.round(amount * 100)
}
const ckoApi = (mode: string) => mode === 'live' ? 'https://api.checkout.com' : 'https://api.sandbox.checkout.com'

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
    if (order.gateway_id !== 'checkout-com') return json({ error: 'order is not a Checkout.com payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Checkout.com payment id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'checkout-com')
      .single()

    const secretKey = (conn as any)?.server_key
    if (!secretKey) return json({ error: 'vendor Checkout.com not configured' }, 400)
    const mode = (conn as any).mode || 'test'

    const cur = (order.currency || 'USD').toUpperCase()
    const refundAmount = minor(amount ? Number(amount) : Number(order.total), cur)

    const r = await fetch(`${ckoApi(mode)}/payments/${order.gateway_transaction_id}/refunds`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        amount: refundAmount,
        reference: `refund-${orderId}`,
        metadata: reason ? { reason } : {},
      }),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result?.error_codes?.join(', ') || 'refund failed', detail: result }, r.status || 500)

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, actionId: result.action_id })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
