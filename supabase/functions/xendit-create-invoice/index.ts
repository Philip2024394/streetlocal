// Xendit Invoice creation.
// Customer hits "Pay" → frontend calls this → we look up the vendor's
// Xendit secretKey from vendor_payment_connections, hit Xendit's Invoice
// API, return the hosted invoice_url. Frontend redirects the customer
// there; Xendit's hosted page lets them pay with cards, e-wallets
// (OVO/DANA/ShopeePay/LinkAja), QRIS, or virtual-account bank transfer.
//
// Deploy: `supabase functions deploy xendit-create-invoice`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { vendorId, orderId, amount, currency = 'IDR', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId, description } = body

    if (!vendorId || !orderId || !amount) {
      return json({ error: 'vendorId, orderId, amount required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('server_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'xendit')
      .single()

    if (connErr || !conn?.server_key || !conn.is_active) {
      return json({ error: 'Xendit not configured or inactive for this vendor' }, 400)
    }

    // Persist pending order so the webhook can join via external_id
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
      gateway_id: 'xendit',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    // Build short item summary (Xendit caps `description` at ~280 chars)
    const itemSummary = description
      ?? (items?.length
        ? (items as any[]).map((it) => `${it.qty}x ${it.name}`).join(', ').slice(0, 280)
        : `Order ${orderId}`)

    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'xendit_status=success&order_id=' + encodeURIComponent(orderId)
    const failureUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'xendit_status=cancel&order_id=' + encodeURIComponent(orderId)

    const payload: Record<string, unknown> = {
      external_id: orderId,
      amount: Math.round(Number(amount)),
      description: itemSummary,
      currency: currency.toUpperCase(),
      success_redirect_url: successUrl,
      failure_redirect_url: failureUrl,
      invoice_duration: 60 * 60 * 24, // 24h
    }
    if (customerName || customerEmail || customerPhone) {
      payload.customer = {
        given_names: customerName || 'Customer',
        email: customerEmail || undefined,
        mobile_number: customerPhone || undefined,
      }
    }
    if (Array.isArray(items) && items.length) {
      payload.items = items.map((it: any) => ({
        name: String(it.name ?? 'Item').slice(0, 256),
        quantity: Number(it.qty ?? 1),
        price: Math.round(Number(it.price ?? 0)),
        category: 'food',
      }))
      if (deliveryFee && Number(deliveryFee) > 0) {
        (payload.items as any[]).push({ name: 'Delivery', quantity: 1, price: Math.round(Number(deliveryFee)), category: 'delivery' })
      }
    }

    const auth = 'Basic ' + btoa(conn.server_key + ':')
    const r = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !result.invoice_url) {
      console.error('Xendit invoice creation failed', result)
      return json({ error: result.message || 'Xendit invoice creation failed', detail: result }, r.status || 500)
    }

    return json({ url: result.invoice_url, invoiceId: result.id, orderId })
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
