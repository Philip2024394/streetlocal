// Refund a Braintree transaction.
// Vendor presses "Refund" → frontend calls this with the orderId →
// we use the stored gateway_transaction_id and call Braintree GraphQL.
// Note: Braintree distinguishes between *voiding* an authorized-but-not-
// settled transaction and *refunding* a settled one. We try refund first;
// if Braintree rejects with NOT_SETTLED, we fall back to void.
//
// Deploy: `supabase functions deploy braintree-refund`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { btGraphql } from '../_shared/braintree.ts'

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
    const { orderId, amount } = await req.json()
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('vendor_id, gateway_id, gateway_transaction_id, total, payment_status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'order not found' }, 404)
    if (order.gateway_id !== 'braintree') return json({ error: 'order is not a Braintree payment' }, 400)
    if (order.payment_status !== 'paid') return json({ error: 'only paid orders can be refunded' }, 400)
    if (!order.gateway_transaction_id) return json({ error: 'no Braintree transaction id recorded' }, 500)

    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'braintree')
      .single()

    const publicKey  = (conn as any)?.server_key
    const privateKey = (conn as any)?.client_key
    if (!publicKey || !privateKey) return json({ error: 'vendor Braintree not configured' }, 400)
    const mode = (conn as any).mode || 'test'

    const amountStr = amount ? Number(amount).toFixed(2) : Number(order.total).toFixed(2)

    try {
      const data = await btGraphql<any>(publicKey, privateKey, mode,
        `mutation Refund($input: RefundTransactionInput!) {
          refundTransaction(input: $input) { refund { id status } }
        }`,
        { input: { transactionId: order.gateway_transaction_id, refund: { amount: amountStr } } },
      )
      const refundId = data?.refundTransaction?.refund?.id
      if (!refundId) throw new Error('no refund returned')
      await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)
      return json({ ok: true, refundId })
    } catch (refundErr) {
      // If not yet settled, void instead (cancels the authorization)
      const msg = (refundErr as Error).message
      if (!/not.*settle|already.*void/i.test(msg)) throw refundErr
      const voidData = await btGraphql<any>(publicKey, privateKey, mode,
        `mutation Void($input: ReverseTransactionInput!) {
          reverseTransaction(input: $input) { reversal { ... on Transaction { id status } } }
        }`,
        { input: { transactionId: order.gateway_transaction_id } },
      )
      await supabase.from('orders').update({ payment_status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', orderId)
      return json({ ok: true, voided: true, reversalId: voidData?.reverseTransaction?.reversal?.id })
    }
  } catch (e) {
    return json({ error: (e as Error).message || 'refund failed' }, 500)
  }
})
