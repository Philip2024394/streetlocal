// Rapyd hosted Checkout creation.
// Customer hits "Pay" → frontend calls this → we POST /v1/checkout with
// the vendor's signed credentials, get a redirect_url, send the customer
// there. Rapyd's checkout supports 900+ local methods across 100+
// countries (local wallets / bank transfers / cards / pay-on-delivery
// where allowed). Vendor enables which methods in their dashboard.
//
// Deploy: `supabase functions deploy rapyd-create-checkout`

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
    const body = await req.json()
    const { vendorId, orderId, amount, currency = 'USD', country = 'US', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId } = body
    if (!vendorId || !orderId || !amount) return json({ error: 'vendorId, orderId, amount required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'rapyd')
      .single()

    const accessKey = (conn as any)?.server_key
    const secretKey = (conn as any)?.client_key
    if (connErr || !accessKey || !secretKey || !conn?.is_active) {
      return json({ error: 'Rapyd not configured or inactive for this vendor' }, 400)
    }
    const mode = (conn as any).mode || 'test'

    await supabase.from('orders').insert({
      vendor_id: vendorId,
      conversation_id: conversationId ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
      items: items ?? [],
      subtotal: Number(amount) - Number(deliveryFee || 0),
      delivery_fee: Number(deliveryFee || 0),
      total: Number(amount),
      currency: currency.toUpperCase(),
      gateway_id: 'rapyd',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'rapyd_status=success&order_id=' + encodeURIComponent(orderId)
    const cancelUrl  = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'rapyd_status=cancel&order_id=' + encodeURIComponent(orderId)

    const reqBody: Record<string, unknown> = {
      amount: Number(amount),
      currency: currency.toUpperCase(),
      country: country.toUpperCase(),
      complete_payment_url: successUrl,
      cancel_checkout_url: cancelUrl,
      merchant_reference_id: orderId,
      capture: true, // auto-capture; vendor can switch to authorize-only via dashboard config
    }
    if (customerName || customerEmail || customerPhone) {
      reqBody.customer = {
        name: customerName || undefined,
        email: customerEmail || undefined,
        phone_number: customerPhone || undefined,
      }
    }

    const data = await rapydRequest(accessKey, secretKey, mode, 'POST', '/v1/checkout', reqBody)

    if (!data?.redirect_url) {
      console.error('Rapyd checkout returned no redirect_url', data)
      return json({ error: 'Rapyd checkout creation failed' }, 500)
    }

    // Stash the Rapyd checkout id for refund use (payment id is set later by webhook)
    await supabase.from('orders').update({ gateway_transaction_id: data.id }).eq('gateway_order_id', orderId)

    return json({ url: data.redirect_url, rapydCheckoutId: data.id, orderId })
  } catch (e: any) {
    console.error('rapyd-create-checkout error', e?.detail || e)
    return json({ error: e?.message || 'server error', detail: e?.detail }, 500)
  }
})
