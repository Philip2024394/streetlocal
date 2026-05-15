// Adyen Pay-by-Link creation.
// Customer hits "Pay" → frontend calls this → we POST /v71/paymentLinks
// with the vendor's API key + merchantAccount, get back a hosted
// payment-link URL, redirect the customer there. Adyen supports 250+
// payment methods (cards, iDEAL, Bancontact, Klarna, GiroPay, Sofort,
// etc.) — vendor enables which to show in Customer Area.
//
// Deploy: `supabase functions deploy adyen-create-link`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { adyenApiBase, adyenMinorUnits } from '../_shared/adyen.ts'
import { assertAmountMatches, jsonResponse, newErrorId, logWithId, customerCors } from '../_shared/paymentSecurity.ts'

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
    const { vendorId, orderId, amount, currency = 'EUR', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId, description, countryCode } = body
    if (!vendorId || !orderId || !amount) return json({ error: 'vendorId, orderId, amount required' }, 400)

    // SECURITY: server-side amount recalculation. Prevents client-side
    // tampering — a DevTools edit of the total can't get past this.
    const amountCheck = assertAmountMatches(
      Number(amount),
      {
        items: items?.map((it: any) => ({
          id: it.id, price: it.price, promoPrice: it.promoPrice,
          qty: it.qty, lineTotal: it.lineTotal, name: it.name,
        })),
        delivery: { fee: Number(deliveryFee || 0) },
        promo: body.promo ? { discount: Number(body.promo.discount || 0) } : undefined,
        tax: body.tax ? { rate: Number(body.tax.rate || 0), inclusive: !!body.tax.inclusive } : undefined,
      },
      2, // 2% tolerance — covers tax rounding + currency conversion edge cases
    )
    if (!amountCheck.ok) {
      const errId = newErrorId()
      logWithId(errId, 'amount-tampering', { vendorId, orderId, ...amountCheck })
      return jsonResponse({ error: 'Amount validation failed', errorId: errId }, 400, customerCors)
    }
    const verifiedAmount = amountCheck.total

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('mode, server_key, client_key, is_active, additional_config')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'adyen')
      .single()

    const apiKey = (conn as any)?.server_key
    const merchantAccount = (conn as any)?.additional_config?.merchantAccount
    const liveUrlPrefix = (conn as any)?.additional_config?.liveUrlPrefix
    if (connErr || !apiKey || !merchantAccount || !conn?.is_active) {
      return json({ error: 'Adyen not configured or inactive for this vendor' }, 400)
    }
    const mode = (conn as any).mode || 'test'

    await supabase.from('orders').insert({
      vendor_id: vendorId,
      conversation_id: conversationId ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
      items: items ?? [],
      subtotal: Number(verifiedAmount) - Number(deliveryFee || 0),
      delivery_fee: Number(deliveryFee || 0),
      total: Number(verifiedAmount),
      currency: currency.toUpperCase(),
      gateway_id: 'adyen',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'adyen_status=success&order_id=' + encodeURIComponent(orderId)

    const payload: Record<string, unknown> = {
      reference: orderId,
      amount: { value: adyenMinorUnits(Number(verifiedAmount), currency), currency: currency.toUpperCase() },
      merchantAccount,
      returnUrl: successUrl,
      countryCode: countryCode || 'NL', // default; vendor can pass an override
      description: description || `Order ${orderId}`,
      shopperReference: customerPhone ? `customer-${customerPhone}` : undefined,
      shopperEmail: customerEmail || undefined,
      shopperName: customerName ? { firstName: customerName.split(' ')[0], lastName: customerName.split(' ').slice(1).join(' ') || customerName } : undefined,
    }
    if (Array.isArray(items) && items.length) {
      payload.lineItems = items.map((it: any) => ({
        id: String(it.id ?? ''),
        description: String(it.name ?? 'Item').slice(0, 100),
        quantity: Number(it.qty ?? 1),
        amountIncludingTax: adyenMinorUnits(Number(it.price ?? 0), currency),
      }))
      if (deliveryFee && Number(deliveryFee) > 0) {
        (payload.lineItems as any[]).push({
          id: 'delivery',
          description: 'Delivery',
          quantity: 1,
          amountIncludingTax: adyenMinorUnits(Number(deliveryFee), currency),
        })
      }
    }

    const r = await fetch(`${adyenApiBase(mode, liveUrlPrefix)}/paymentLinks`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !result.url) {
      console.error('Adyen paymentLink failed', result)
      return json({ error: result.message || result.errorMessage || 'Adyen paymentLink creation failed', detail: result }, r.status || 500)
    }

    // Store Adyen's paymentLink id for refund use (and as a fallback join key)
    await supabase.from('orders').update({ gateway_transaction_id: result.id }).eq('gateway_order_id', orderId)

    return json({ url: result.url, adyenLinkId: result.id, orderId })
  } catch (e) {
    console.error('adyen-create-link error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
