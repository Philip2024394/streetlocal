// 2Checkout (Verifone) hosted Buy Link.
// Customer hits "Pay" → frontend calls this → we build a 2Checkout Buy
// Link URL with the vendor's merchant code + the order details. The
// customer is redirected there; 2Checkout's hosted page handles cards
// + local methods, then redirects back to our return URL. The IPN
// webhook flips the order to paid.
//
// Deploy: `supabase functions deploy twocheckout-create-link`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TC_BUY_URL } from '../_shared/twocheckout.ts'

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
    const { vendorId, orderId, amount, currency = 'USD', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId, description } = body
    if (!vendorId || !orderId || !amount) return json({ error: 'vendorId, orderId, amount required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', '2checkout')
      .single()

    const merchantCode = (conn as any)?.server_key
    if (connErr || !merchantCode || !conn?.is_active) {
      return json({ error: '2Checkout not configured or inactive for this vendor' }, 400)
    }

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
      gateway_id: '2checkout',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'tc_status=success&order_id=' + encodeURIComponent(orderId)
    const productName = description || (items?.length ? (items as any[]).slice(0, 3).map((it) => `${it.qty}x ${it.name}`).join(', ').slice(0, 64) : `Order ${orderId}`)

    // Build the Buy Link URL with required params for a dynamic / non-catalog product.
    // `merchant-order-id` is what comes back in the IPN as REFNO-equivalent.
    const params = new URLSearchParams()
    params.set('merchant', merchantCode)
    params.set('dynamic', '1')
    params.set('tangible', '0')
    params.set('type', 'digital')
    params.set('prod', productName)
    params.set('price', Number(amount).toFixed(2))
    params.set('qty', '1')
    params.set('currency', currency.toUpperCase())
    params.set('merchant-order-id', orderId)
    params.set('return-url', successUrl)
    params.set('return-type', 'redirect')
    if (customerName) params.set('customer-name', customerName.slice(0, 100))
    if (customerEmail) params.set('customer-email', customerEmail.slice(0, 100))
    if (customerPhone) params.set('customer-phone', customerPhone.slice(0, 20))

    const url = `${TC_BUY_URL}?${params.toString()}`
    return json({ url, orderId })
  } catch (e) {
    console.error('twocheckout-create-link error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
