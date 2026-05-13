// send-order-receipt — transactional receipt for a paid order.
//
// Sends two emails via Resend:
//   1. Customer receipt   → order.customer_email (if present)
//   2. Vendor notification → vendor's configured order email
//
// Invoked by:
//   - vendor-order-payment-webhook  (after payment_status flips to 'paid')
//   - food-order-payment-webhook    (same, for food_orders rows)
//
// Body: { orderId, orderTable: 'vendor_orders' | 'food_orders' }
// Idempotent via receipt_sent_at — won't send twice for the same row.
//
// Env required:
//   RESEND_API_KEY  — Resend API key (already configured for send-vendor-email)
//   RESEND_FROM     — verified sender (defaults to orders@streetlocal.live)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'orders@streetlocal.live'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

const fmtRp = (n: number) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

function buildHtml(role: 'customer' | 'vendor', order: any, shopName: string, shopAddress: string) {
  const items = Array.isArray(order.items) ? order.items : []
  const itemsHtml = items.map((it: any) => {
    const qty = it.qty || it.quantity || 1
    const price = Number(it.price || 0)
    return `<tr><td style="padding:8px 4px;border-bottom:1px solid #eee;">${qty}× ${esc(it.name || 'Item')}</td><td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;">${esc(fmtRp(price * qty))}</td></tr>`
  }).join('\n')

  const heading = role === 'customer'
    ? `Thanks for your order!`
    : `New paid order #${esc(String(order.id).slice(-6))}`
  const intro = role === 'customer'
    ? `Your payment was confirmed. ${esc(shopName)} has your order and will be in touch shortly.`
    : `${esc(order.customer_name || 'A customer')} just paid via ${esc(order.gateway_used || 'gateway')}. Prepare the order and reply directly to this email to message them.`

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <div style="border-bottom:2px solid #1a1a1a;padding-bottom:12px;margin-bottom:16px;">
        <div style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${esc(shopName)}</div>
        <h1 style="margin:6px 0 0;font-size:22px;font-weight:900;">${heading}</h1>
        <div style="font-size:13px;color:#666;margin-top:4px;">${intro}</div>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;color:#888;font-weight:700;margin-bottom:6px;">Order #${esc(String(order.id).slice(-6))}</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${itemsHtml}</table>
      </div>
      <div style="margin-bottom:16px;border-top:1px solid #eee;padding-top:12px;font-size:14px;">
        ${order.delivery_fee ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#666;"><span>Subtotal</span><span>${esc(fmtRp(order.subtotal || 0))}</span></div>` : ''}
        ${order.delivery_fee ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#666;"><span>Delivery</span><span>${esc(fmtRp(order.delivery_fee))}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:8px 0 0;border-top:1px solid #eee;margin-top:8px;font-weight:900;font-size:16px;"><span>Total paid</span><span>${esc(fmtRp(order.total || 0))}</span></div>
      </div>
      <div style="margin-bottom:16px;font-size:13px;color:#666;line-height:1.6;">
        <div><strong>Customer:</strong> ${esc(order.customer_name || '—')}</div>
        ${order.customer_phone ? `<div><strong>Phone:</strong> ${esc(order.customer_phone)}</div>` : ''}
        ${order.customer_email ? `<div><strong>Email:</strong> ${esc(order.customer_email)}</div>` : ''}
        ${order.customer_address ? `<div><strong>Address:</strong> ${esc(order.customer_address)}</div>` : ''}
        ${order.note ? `<div style="margin-top:6px;"><strong>Note:</strong> ${esc(order.note)}</div>` : ''}
      </div>
      ${shopAddress ? `<div style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:12px;">${esc(shopAddress)}</div>` : ''}
    </div>
    <div style="text-align:center;font-size:11px;color:#aaa;margin-top:16px;">Sent via StreetLocal.live</div>
  </div></body></html>`
}

async function sendOne(payload: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'authorization': `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || data?.error || `Resend ${res.status}`)
  return data
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500)

  try {
    const { orderId, orderTable } = await req.json()
    if (!orderId || !orderTable) return json({ error: 'orderId and orderTable required' }, 400)
    if (!['vendor_orders', 'food_orders'].includes(orderTable)) return json({ error: 'invalid orderTable' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order, error } = await supabase.from(orderTable).select('*').eq('id', orderId).single()
    if (error || !order) return json({ error: 'order not found' }, 404)
    if (order.receipt_sent_at) return json({ ok: true, skipped: 'already sent' })

    let shopName = 'Your Order'
    let shopAddress = ''
    let vendorEmail: string | null = null
    if (orderTable === 'vendor_orders') {
      const { data: v } = await supabase
        .from('vendor_accounts')
        .select('shop_name, shop_address, shop_email, email')
        .eq('id', order.vendor_id).single()
      if (v) { shopName = v.shop_name || shopName; shopAddress = v.shop_address || ''; vendorEmail = v.shop_email || v.email || null }
    } else {
      const { data: r } = await supabase
        .from('restaurants')
        .select('name, address, contact_email, email')
        .eq('id', order.restaurant_id).single()
      if (r) { shopName = r.name || shopName; shopAddress = r.address || ''; vendorEmail = r.contact_email || r.email || null }
    }

    const sent: string[] = []
    const errors: string[] = []

    if (order.customer_email) {
      try {
        await sendOne({
          from: RESEND_FROM,
          to: [order.customer_email],
          subject: `Your order from ${shopName} — confirmed`,
          html: buildHtml('customer', order, shopName, shopAddress),
          reply_to: vendorEmail || undefined,
        })
        sent.push('customer')
      } catch (e) { errors.push('customer: ' + (e as Error).message) }
    }

    if (vendorEmail) {
      try {
        await sendOne({
          from: RESEND_FROM,
          to: [vendorEmail],
          subject: `Paid order #${String(order.id).slice(-6)} — ${order.customer_name || 'Customer'}`,
          html: buildHtml('vendor', order, shopName, shopAddress),
          reply_to: order.customer_email || undefined,
        })
        sent.push('vendor')
      } catch (e) { errors.push('vendor: ' + (e as Error).message) }
    }

    if (sent.length > 0) {
      await supabase.from(orderTable).update({ receipt_sent_at: new Date().toISOString() }).eq('id', orderId)
    }

    return json({ ok: true, sent, errors })
  } catch (e) {
    console.error('send-order-receipt error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
