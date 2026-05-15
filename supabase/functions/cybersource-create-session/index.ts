// CyberSource Secure Acceptance — generate signed form fields for hosted checkout.
// The customer's browser POSTs these fields to CyberSource's hosted page;
// CyberSource processes payment and redirects back to our return URL.
//
// Vendor must have:
//   profileId, accessKey, secretKey (Business Center → Secure Acceptance →
//     Web/Mobile profile → Security → Create Key)
//
// Deploy: `supabase functions deploy cybersource-create-session`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { signSecureAcceptanceFields, CS_SA_HOSTED_LIVE, CS_SA_HOSTED_TEST } from '../_shared/cybersource.ts'
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
    const { vendorId, orderId, amount, currency = 'USD', items, customerName, customerEmail, customerPhone, deliveryFee, returnUrl, conversationId } = body
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
      .select('mode, is_active, additional_config')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'cybersource')
      .single()

    if (connErr || !conn?.is_active) {
      return json({ error: 'CyberSource not configured or inactive for this vendor' }, 400)
    }

    const cfg: any = conn.additional_config || {}
    const profileId = cfg.profileId
    const accessKey = cfg.accessKey
    const secretKey = cfg.secretKey
    if (!profileId || !accessKey || !secretKey) {
      return json({ error: 'Vendor missing CyberSource Secure Acceptance keys (profileId/accessKey/secretKey)' }, 400)
    }

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
      gateway_id: 'cybersource',
      gateway_order_id: orderId,
      payment_status: 'pending',
    })

    // CyberSource Secure Acceptance signed_date_time must be UTC ISO with 'Z'.
    const signedDateTime = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
    const txnUuid = (crypto as any).randomUUID().replace(/-/g, '').slice(0, 32)
    const returnSuccessUrl = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'cs_status=success&order_id=' + encodeURIComponent(orderId)
    const returnCancelUrl  = (returnUrl || 'https://streetlocal.live') + (returnUrl?.includes('?') ? '&' : '?') + 'cs_status=cancel&order_id=' + encodeURIComponent(orderId)

    const fields: Record<string, string> = {
      access_key: accessKey,
      profile_id: profileId,
      transaction_uuid: txnUuid,
      signed_date_time: signedDateTime,
      locale: 'en',
      transaction_type: 'sale',
      reference_number: orderId,
      amount: Number(verifiedAmount).toFixed(2),
      currency: currency.toUpperCase(),
      override_custom_receipt_page: returnSuccessUrl,
      override_custom_cancel_page: returnCancelUrl,
      unsigned_field_names: '',
    }
    if (customerName) {
      const parts = customerName.trim().split(/\s+/)
      fields.bill_to_forename = (parts[0] || 'Customer').slice(0, 60)
      fields.bill_to_surname  = (parts.slice(1).join(' ') || parts[0] || 'Customer').slice(0, 60)
    }
    if (customerEmail) fields.bill_to_email = customerEmail.slice(0, 100)
    if (customerPhone) fields.bill_to_phone = customerPhone.slice(0, 15)

    // signed_field_names list — order matters for signing.
    const signedNames = [
      'access_key', 'profile_id', 'transaction_uuid', 'signed_field_names', 'signed_date_time',
      'locale', 'transaction_type', 'reference_number', 'amount', 'currency',
      'override_custom_receipt_page', 'override_custom_cancel_page',
      ...(fields.bill_to_forename ? ['bill_to_forename', 'bill_to_surname'] : []),
      ...(fields.bill_to_email ? ['bill_to_email'] : []),
      ...(fields.bill_to_phone ? ['bill_to_phone'] : []),
    ]
    fields.signed_field_names = signedNames.join(',')
    fields.signature = await signSecureAcceptanceFields(fields, secretKey)

    const url = conn.mode === 'live' ? CS_SA_HOSTED_LIVE : CS_SA_HOSTED_TEST
    return json({ url, fields, orderId, method: 'POST' })
  } catch (e) {
    console.error('cybersource-create-session error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
