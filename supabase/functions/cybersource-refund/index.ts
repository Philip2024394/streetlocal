// Refund a CyberSource payment via REST API (pts/v2/payments/{id}/refunds).
// Uses HTTP Signature authentication with the vendor's Merchant ID +
// API Key ID + Shared Secret (separate from Secure Acceptance keys).
//
// Deploy: `supabase functions deploy cybersource-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCsHttpSignatureHeaders, CS_REST_LIVE, CS_REST_TEST } from '../_shared/cybersource.ts'

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
    if (order.gateway_id !== 'cybersource') return json({ error: 'order is not a CyberSource payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no CyberSource transaction id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key, webhook_secret')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'cybersource')
      .single()

    const merchantId   = (conn as any)?.server_key
    const apiKeyId     = (conn as any)?.client_key
    const sharedSecret = (conn as any)?.webhook_secret
    if (!merchantId || !apiKeyId || !sharedSecret) {
      return json({ error: 'vendor missing CyberSource REST credentials (merchantId/apiKeyId/sharedSecret)' }, 400)
    }

    const host = conn?.mode === 'live' ? CS_REST_LIVE : CS_REST_TEST
    const resourcePath = `/pts/v2/payments/${order.gateway_transaction_id}/refunds`
    const reqBody = JSON.stringify({
      clientReferenceInformation: { code: orderId },
      orderInformation: {
        amountDetails: {
          totalAmount: Number(amount || order.total).toFixed(2),
          currency: (order.currency || 'USD').toUpperCase(),
        },
      },
      ...(reason ? { processingInformation: { reconciliationId: reason.slice(0, 60) } } : {}),
    })

    const headers = await buildCsHttpSignatureHeaders({
      method: 'POST',
      resourcePath,
      host,
      merchantId,
      apiKeyId,
      sharedSecret,
      body: reqBody,
    })

    const r = await fetch(`https://${host}${resourcePath}`, { method: 'POST', headers, body: reqBody })
    const result = await r.json().catch(() => ({}))
    if (!r.ok) return json({ error: result.message || result.reason || 'refund failed', detail: result }, r.status || 500)

    await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)
    return json({ ok: true, detail: result })
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
