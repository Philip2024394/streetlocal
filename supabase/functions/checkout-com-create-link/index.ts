// Checkout.com Payment Link creation.
// Customer hits "Pay" → frontend calls this → we POST /payment-links
// using the vendor's secret key, return Checkout.com's hosted URL,
// redirect the customer there. Supports cards, Apple Pay, Google Pay,
// Klarna, iDEAL, Bancontact, Sofort, Multibanco, KNET, mada, plus
// many more depending on vendor account enablement.
//
// Deploy: `supabase functions deploy checkout-com-create-link`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// Checkout.com uses minor units; same currency rules as Stripe.
const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF', 'IDR'])
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND'])
function ckoMinorUnits(amount: number, currency: string): number {
  const cur = currency.toUpperCase()
  if (THREE_DECIMAL.has(cur)) return Math.round(amount * 1000)
  if (ZERO_DECIMAL.has(cur)) return Math.round(amount)
  return Math.round(amount * 100)
}

function ckoApi(mode: string): string {
  return mode === 'live' ? 'https://api.checkout.com' : 'https://api.sandbox.checkout.com'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { vendorId, orderId, amount, currency = 'USD', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId, description, billingCountry } = body
    if (!vendorId || !orderId || !amount) return json({ error: 'vendorId, orderId, amount required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'checkout-com')
      .single()

    const secretKey = (conn as any)?.server_key
    if (connErr || !secretKey || !conn?.is_active) {
      return json({ error: 'Checkout.com not configured or inactive for this vendor' }, 400)
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
      gateway_id: 'checkout-com',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'cko_status=success&order_id=' + encodeURIComponent(orderId)
    const failureUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'cko_status=cancel&order_id=' + encodeURIComponent(orderId)

    const desc = description || (items?.length ? (items as any[]).slice(0, 5).map((it) => `${it.qty}x ${it.name}`).join(', ').slice(0, 100) : `Order ${orderId}`)
    const cur = currency.toUpperCase()

    const payload: Record<string, unknown> = {
      amount: ckoMinorUnits(Number(amount), cur),
      currency: cur,
      reference: orderId,
      description: desc,
      return_url: successUrl,
      // Checkout.com Payment Links use `return_url` for both success and failure;
      // status comes through in query params they append (?cko-payment-id=...&cko-status=...)
      capture: true,
      billing: {
        address: { country: (billingCountry || 'US').toUpperCase() },
      },
    }
    if (customerName || customerEmail) {
      payload.customer = {
        name: customerName || undefined,
        email: customerEmail || undefined,
      }
    }
    if (Array.isArray(items) && items.length) {
      payload.products = items.map((it: any) => ({
        name: String(it.name ?? 'Item').slice(0, 100),
        quantity: Number(it.qty ?? 1),
        price: ckoMinorUnits(Number(it.price ?? 0), cur),
      }))
      if (deliveryFee && Number(deliveryFee) > 0) {
        (payload.products as any[]).push({ name: 'Delivery', quantity: 1, price: ckoMinorUnits(Number(deliveryFee), cur) })
      }
    }
    payload.metadata = { vendorId, orderId, conversationId: conversationId || '' }

    const r = await fetch(`${ckoApi(mode)}/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const result = await r.json().catch(() => ({}))
    const redirectUrl = result?._links?.redirect?.href
    if (!r.ok || !redirectUrl) {
      console.error('Checkout.com payment link failed', result)
      return json({ error: result?.error_codes?.join(', ') || result?.error_type || 'Checkout.com payment link creation failed', detail: result }, r.status || 500)
    }

    await supabase.from('orders').update({ gateway_transaction_id: result.id }).eq('gateway_order_id', orderId)

    return json({ url: redirectUrl, ckoLinkId: result.id, orderId })
  } catch (e) {
    console.error('checkout-com-create-link error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
