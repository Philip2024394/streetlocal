// Charge a Braintree payment method.
// Client side: Drop-in UI collects card / PayPal / Venmo, returns a
// `paymentMethodNonce`. Frontend POSTs the nonce + orderId + amount
// here. We call Braintree GraphQL `chargePaymentMethod` which executes
// the sale synchronously and returns the transaction status.
// On success we flip orders.payment_status to 'paid' immediately.
//
// Deploy: `supabase functions deploy braintree-charge`

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
    const { vendorId, orderId, amount, currency = 'USD', paymentMethodNonce, deviceData, items, customerName, customerPhone, customerEmail, deliveryFee, conversationId } = await req.json()
    if (!vendorId || !orderId || !amount || !paymentMethodNonce) {
      return json({ error: 'vendorId, orderId, amount, paymentMethodNonce required' }, 400)
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key, is_active, additional_config')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'braintree')
      .single()

    const publicKey  = (conn as any)?.server_key
    const privateKey = (conn as any)?.client_key
    const merchantId = (conn as any)?.additional_config?.merchantId
    if (connErr || !publicKey || !privateKey || !conn?.is_active) {
      return json({ error: 'Braintree not configured or inactive for this vendor' }, 400)
    }
    const mode = (conn as any).mode || 'test'

    // Insert (or upsert via gateway_order_id unique constraint) the pending order
    await supabase.from('orders').upsert({
      vendor_id: vendorId,
      conversation_id: conversationId ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
      items: items ?? [],
      subtotal: Number(amount) - Number(deliveryFee || 0),
      delivery_fee: Number(deliveryFee || 0),
      total: Number(amount),
      currency: currency.toUpperCase(),
      gateway_id: 'braintree',
      gateway_order_id: orderId,
      payment_status: 'pending',
    }, { onConflict: 'gateway_order_id' })

    const amountStr = Number(amount).toFixed(2)
    const txInput: Record<string, unknown> = {
      paymentMethodId: paymentMethodNonce,
      transaction: {
        amount: amountStr,
        orderId,
        ...(merchantId ? { merchantAccountId: merchantId } : {}),
        ...(deviceData ? { riskData: { customerDeviceId: deviceData } } : {}),
      },
    }

    const data = await btGraphql<any>(publicKey, privateKey, mode,
      `mutation Charge($input: ChargePaymentMethodInput!) {
        chargePaymentMethod(input: $input) {
          transaction { id status paymentMethod { ... on CreditCardDetails { brandCode last4 } } }
        }
      }`,
      { input: txInput },
    )

    const tx = data?.chargePaymentMethod?.transaction
    if (!tx?.id) return json({ error: 'Braintree returned no transaction' }, 500)

    const okStates = new Set(['AUTHORIZED', 'SETTLING', 'SETTLED', 'SUBMITTED_FOR_SETTLEMENT'])
    const paid = okStates.has(String(tx.status).toUpperCase())

    const patch: Record<string, unknown> = {
      gateway_transaction_id: tx.id,
      payment_method: 'card',
    }
    if (paid) {
      patch.payment_status = 'paid'
      patch.paid_at = new Date().toISOString()
    } else {
      patch.payment_status = 'failed'
    }
    await supabase.from('orders').update(patch).eq('gateway_order_id', orderId)

    return json({ status: paid ? 'paid' : 'failed', transactionId: tx.id, btStatus: tx.status })
  } catch (e) {
    console.error('braintree-charge error', e)
    return json({ error: (e as Error).message || 'charge failed' }, 500)
  }
})
