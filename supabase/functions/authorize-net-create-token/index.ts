// Authorize.net Accept Hosted token creation.
// Customer hits "Pay" → frontend calls this → we exchange vendor's
// loginId + transactionKey for a Hosted Payment Page token. Frontend
// builds a hidden form that POSTs `token=<value>` to Authorize.net's
// payment-payment URL — Authorize.net renders the hosted card form,
// processes the payment, redirects back to our return URL.
//
// Deploy: `supabase functions deploy authorize-net-create-token`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ANET_API, ANET_HOSTED, anetRequest } from '../_shared/authorizenet.ts'
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
    const { vendorId, orderId, amount, items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId } = body
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
      .select('mode, server_key, client_key, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'authorize-net')
      .single()

    const apiLoginId = (conn as any)?.server_key
    const transactionKey = (conn as any)?.client_key
    if (connErr || !apiLoginId || !transactionKey || !conn?.is_active) {
      return json({ error: 'Authorize.net not configured or inactive for this vendor' }, 400)
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
      currency: 'USD',
      gateway_id: 'authorize-net',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    const successUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'anet_status=success&order_id=' + encodeURIComponent(orderId)
    const cancelUrl  = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'anet_status=cancel&order_id=' + encodeURIComponent(orderId)

    // Authorize.net's hostedPaymentSettings expects each setting's value to be a stringified JSON. Yes really.
    const payload = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: Number(verifiedAmount).toFixed(2),
          order: {
            invoiceNumber: orderId.slice(0, 20),
            description: (items?.length ? (items as any[]).slice(0, 3).map((it) => `${it.qty}x ${it.name}`).join(', ') : `Order ${orderId}`).slice(0, 255),
          },
          customer: {
            email: customerEmail || '',
          },
          billTo: {
            firstName: (customerName || 'Customer').split(' ')[0].slice(0, 50),
            lastName: (customerName || '').split(' ').slice(1).join(' ').slice(0, 50) || '.',
            phoneNumber: customerPhone || '',
          },
        },
        hostedPaymentSettings: {
          setting: [
            { settingName: 'hostedPaymentReturnOptions',  settingValue: JSON.stringify({ showReceipt: false, url: successUrl, urlText: 'Continue', cancelUrl, cancelUrlText: 'Cancel' }) },
            { settingName: 'hostedPaymentButtonOptions',  settingValue: JSON.stringify({ text: `Pay $${Number(verifiedAmount).toFixed(2)}` }) },
            { settingName: 'hostedPaymentBillingAddressOptions', settingValue: JSON.stringify({ show: true, required: false }) },
            { settingName: 'hostedPaymentShippingAddressOptions', settingValue: JSON.stringify({ show: false, required: false }) },
            { settingName: 'hostedPaymentPaymentOptions',  settingValue: JSON.stringify({ cardCodeRequired: true }) },
            { settingName: 'hostedPaymentStyleOptions',    settingValue: JSON.stringify({ bgColor: 'blue' }) },
            { settingName: 'hostedPaymentCustomerOptions', settingValue: JSON.stringify({ showEmail: !!customerEmail, requiredEmail: false }) },
          ],
        },
      },
    }

    const result = await anetRequest(ANET_API(mode), payload)
    const token = result?.token
    if (!token) return json({ error: 'Authorize.net returned no token', detail: result }, 500)

    return json({ token, hostedUrl: ANET_HOSTED(mode), orderId })
  } catch (e: any) {
    console.error('authorize-net-create-token error', e?.detail || e)
    return json({ error: e?.message || 'server error', detail: e?.detail }, 500)
  }
})
