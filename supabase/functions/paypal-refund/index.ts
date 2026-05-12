// Refund a PayPal capture.
// Vendor presses "Refund" → frontend calls this with the orderId →
// we use the stored gateway_transaction_id (the CAPTURE id PayPal
// returned in PAYMENT.CAPTURE.COMPLETED) and call
// /v2/payments/captures/<id>/refund.
//
// Deploy: `supabase functions deploy paypal-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PAYPAL_API, paypalAccessToken } from '../_shared/paypal.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

const ZERO_DECIMAL = new Set(['HUF', 'JPY', 'TWD'])
const fmtMoney = (n: number, c: string) => ZERO_DECIMAL.has(c.toUpperCase()) ? Math.round(n).toString() : Number(n).toFixed(2)

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
    if (order.gateway_id !== 'paypal') return json({ error: 'order is not a PayPal payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no PayPal capture id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'paypal')
      .single()

    const clientId = (conn as any)?.server_key
    const secret   = (conn as any)?.client_key
    if (!clientId || !secret) return json({ error: 'vendor PayPal not configured' }, 400)
    const mode = (conn as any).mode || 'test'

    const accessToken = await paypalAccessToken(clientId, secret, mode)
    const cur = (order.currency || 'USD').toUpperCase()
    const refundBody: Record<string, unknown> = {}
    if (amount) refundBody.amount = { value: fmtMoney(Number(amount), cur), currency_code: cur }
    if (reason) refundBody.note_to_payer = reason

    const r = await fetch(`${PAYPAL_API(mode)}/v2/payments/captures/${order.gateway_transaction_id}/refund`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(refundBody),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result.message || 'refund failed', detail: result }, r.status || 500)

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)

    return json({ ok: true, refundId: result.id })
  } catch (e) {
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
