// order-sms-notify
//
// Sends a one-shot SMS via the vendor's Twilio account when an order
// status changes (ready / out-for-delivery / paid / cancelled).
// Callable from any client, but the auth check is the vendor's
// Twilio credentials — we read them from vendor_accounts on the
// server side (no client-shared secrets).
//
// Body: { order_id, kind }  where kind ∈ 'ready'|'dispatched'|'paid'|'cancelled'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function cors () {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function bodyFor (kind: string, shopName: string, orderRef: string) {
  switch (kind) {
    case 'ready':       return `${shopName}: Your order ${orderRef} is ready for pickup!`
    case 'dispatched':  return `${shopName}: Your order ${orderRef} is out for delivery.`
    case 'paid':        return `${shopName}: Payment received for order ${orderRef}. Thank you!`
    case 'cancelled':   return `${shopName}: Your order ${orderRef} has been cancelled. Reply to chat for help.`
    default:            return `${shopName}: Update on your order ${orderRef}.`
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() })

  try {
    const { order_id, kind } = await req.json().catch(() => ({}))
    if (!order_id || !kind) {
      return new Response(JSON.stringify({ error: 'order_id + kind required' }), { status: 400, headers: { ...cors(), 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
    const { data: order, error: orderErr } = await supabase
      .from('vendor_orders').select('id, vendor_id, customer_phone').eq('id', order_id).single()
    if (orderErr || !order || !order.customer_phone) {
      return new Response(JSON.stringify({ error: 'order or phone missing' }), { status: 404, headers: { ...cors(), 'Content-Type': 'application/json' } })
    }

    const { data: vendor, error: vErr } = await supabase
      .from('vendor_accounts').select('shop_name, sms_enabled, sms_account_sid, sms_auth_token, sms_from_number').eq('id', order.vendor_id).single()
    if (vErr || !vendor || !vendor.sms_enabled || !vendor.sms_account_sid || !vendor.sms_auth_token || !vendor.sms_from_number) {
      return new Response(JSON.stringify({ ok: true, skipped: 'sms_not_configured' }), { headers: { ...cors(), 'Content-Type': 'application/json' } })
    }

    // Normalise customer phone to E.164. Twilio rejects anything else.
    const phone = String(order.customer_phone).replace(/[^0-9+]/g, '')
    const toNumber = phone.startsWith('+') ? phone : `+${phone}`
    const text = bodyFor(kind, vendor.shop_name || 'Your shop', `#${order.id.slice(0, 8)}`)

    // Twilio API call — Basic auth, urlencoded body.
    const auth = btoa(`${vendor.sms_account_sid}:${vendor.sms_auth_token}`)
    const params = new URLSearchParams({ From: vendor.sms_from_number, To: toNumber, Body: text })
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${vendor.sms_account_sid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, error: data?.message || 'Twilio rejected', code: data?.code, status: resp.status }), { status: resp.status, headers: { ...cors(), 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ ok: true, sid: data.sid }), { headers: { ...cors(), 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...cors(), 'Content-Type': 'application/json' } })
  }
})
