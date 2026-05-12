// Razorpay Payment Link creation.
// Customer hits "Pay" → frontend calls this → we use the vendor's
// keyId + keySecret to create a Razorpay Payment Link via /v1/payment_links
// and return its short_url. Frontend redirects the customer there;
// Razorpay's hosted page accepts UPI, cards, NetBanking, wallets.
//
// Deploy: `supabase functions deploy razorpay-create-link`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// Razorpay amounts are in the smallest unit (paise for INR, cents for USD/EUR/etc.).
// INR has 100 paise; the multiplier for all standard currencies is 100.
// Razorpay also supports zero-decimal currencies (JPY, IDR via INR-equivalent settlement);
// for now we treat everything as *100 since INR is the dominant use case.
function toSmallestUnit(amount: number, _currency: string): number {
  return Math.round(Number(amount) * 100)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { vendorId, orderId, amount, currency = 'INR', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId, description } = body
    if (!vendorId || !orderId || !amount) return json({ error: 'vendorId, orderId, amount required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('server_key, client_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'razorpay')
      .single()

    const keyId     = (conn as any)?.server_key
    const keySecret = (conn as any)?.client_key
    if (connErr || !keyId || !keySecret || !conn?.is_active) {
      return json({ error: 'Razorpay not configured or inactive for this vendor' }, 400)
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
      gateway_id: 'razorpay',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const callbackUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'razorpay_status=success&order_id=' + encodeURIComponent(orderId)

    const payload: Record<string, unknown> = {
      amount: toSmallestUnit(Number(amount), currency),
      currency: currency.toUpperCase(),
      accept_partial: false,
      reference_id: orderId,
      description: description || (items?.length ? (items as any[]).map((it) => `${it.qty}x ${it.name}`).join(', ').slice(0, 2048) : `Order ${orderId}`),
      callback_url: callbackUrl,
      callback_method: 'get',
      reminder_enable: true,
      notify: { sms: !!customerPhone, email: !!customerEmail },
    }
    if (customerName || customerEmail || customerPhone) {
      payload.customer = {
        name: customerName || undefined,
        email: customerEmail || undefined,
        contact: customerPhone || undefined,
      }
    }
    if (Array.isArray(items) && items.length) {
      payload.notes = { items_summary: (items as any[]).slice(0, 5).map((it) => `${it.qty}x ${it.name}`).join(' | ').slice(0, 256) }
    }

    const auth = 'Basic ' + btoa(`${keyId}:${keySecret}`)
    const r = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !result.short_url) {
      console.error('Razorpay payment link failed', result)
      return json({ error: result.error?.description || result.message || 'Razorpay payment link creation failed', detail: result }, r.status || 500)
    }

    // Stash the Razorpay link id so the webhook can join via reference_id or payment_link.id
    await supabase.from('orders').update({ gateway_transaction_id: result.id }).eq('gateway_order_id', orderId)

    return json({ url: result.short_url, paymentLinkId: result.id, orderId })
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
