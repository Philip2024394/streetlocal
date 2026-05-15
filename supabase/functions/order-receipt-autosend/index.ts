// order-receipt-autosend
//
// Triggered by payment webhooks after an order becomes paid. Reads the
// vendor's receipt_autosend_chat / _email flags and, if either is on,
// posts the receipt into chat_messages and / or sends an email via Resend.
// Idempotent — uses vendor_orders.receipt_sent_at to ensure we never
// double-fire even if a webhook retries.
//
// Call from any payment webhook with:
//   await supabase.functions.invoke('order-receipt-autosend', {
//     body: { order_id: '...' }
//   })
//
// Or schedule a pg_cron job to sweep paid orders with receipt_sent_at IS NULL
// once a minute, for resilience against webhook failures.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API   = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL   = Deno.env.get('RESEND_FROM_EMAIL') ?? 'orders@streetlocal.live'

interface OrderRow {
  id: string
  vendor_id: string
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  items: any
  subtotal: number | null
  tax_amount: number | null
  tax_rate: number | null
  total: number | null
  delivery_fee: number | null
  payment_method: string | null
  scheduled_for: string | null
  created_at: string
  receipt_sent_at: string | null
  chat_messages: any[] | null
}

interface VendorRow {
  shop_name: string
  shop_address: string | null
  shop_phone: string | null
  shop_tax_label: string | null
  receipt_autosend_chat: boolean
  receipt_autosend_email: boolean
}

function corsHeaders () {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function fmtMoney (n: number | null) {
  return Math.round(Number(n || 0)).toLocaleString('en-US')
}

function buildReceiptText (order: OrderRow, vendor: VendorRow): string {
  const placed = new Date(order.created_at)
  const items  = Array.isArray(order.items) ? order.items : []
  const lines: string[] = []
  lines.push(`🧾 Receipt — ${vendor.shop_name}`)
  if (vendor.shop_address) lines.push(vendor.shop_address)
  if (vendor.shop_phone)   lines.push(vendor.shop_phone)
  lines.push('')
  lines.push(`Order #${order.id.slice(0, 8)}`)
  lines.push(`Placed: ${placed.toLocaleString()}`)
  if (order.scheduled_for) lines.push(`Scheduled: ${new Date(order.scheduled_for).toLocaleString()}`)
  if (order.customer_name) lines.push(`Customer: ${order.customer_name}`)
  lines.push('')
  lines.push('Items:')
  for (const it of items) {
    const qty = it.qty || 1
    const lt  = it.lineTotal != null ? it.lineTotal : (it.price || 0) * qty
    lines.push(`  ${qty}× ${it.name}  ${fmtMoney(lt)}`)
  }
  lines.push('')
  if (order.subtotal != null)    lines.push(`Subtotal: ${fmtMoney(order.subtotal)}`)
  if ((order.delivery_fee || 0) > 0) lines.push(`Delivery: ${fmtMoney(order.delivery_fee)}`)
  if ((order.tax_amount || 0) > 0)   lines.push(`${vendor.shop_tax_label || 'Tax'} (${order.tax_rate}%): ${fmtMoney(order.tax_amount)}`)
  if (order.total != null)       lines.push(`TOTAL: ${fmtMoney(order.total)}`)
  if (order.payment_method)      lines.push(`Paid via: ${order.payment_method}`)
  lines.push('')
  lines.push('Thank you for your order!')
  return lines.join('\n')
}

function buildReceiptHtml (order: OrderRow, vendor: VendorRow): string {
  const placed = new Date(order.created_at)
  const items  = Array.isArray(order.items) ? order.items : []
  const itemsHtml = items.map((it: any) => {
    const qty = it.qty || 1
    const lt  = it.lineTotal != null ? it.lineTotal : (it.price || 0) * qty
    return `<tr><td style="padding:6px 4px;border-bottom:1px solid #eee">${qty}× ${it.name}</td><td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">${fmtMoney(lt)}</td></tr>`
  }).join('')
  return `<!doctype html><html><body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#222">
  <h2 style="margin:0 0 4px;color:#000">${vendor.shop_name}</h2>
  ${vendor.shop_address ? `<div style="color:#666;font-size:13px">${vendor.shop_address}</div>` : ''}
  ${vendor.shop_phone ? `<div style="color:#666;font-size:13px">${vendor.shop_phone}</div>` : ''}
  <hr style="border:0;border-top:2px dashed #ccc;margin:14px 0">
  <div style="font-size:13px;color:#555">Order <strong style="color:#111;font-family:monospace">#${order.id.slice(0, 8)}</strong></div>
  <div style="font-size:13px;color:#555">Date: ${placed.toLocaleString()}</div>
  ${order.scheduled_for ? `<div style="font-size:13px;color:#555">Scheduled: <strong>${new Date(order.scheduled_for).toLocaleString()}</strong></div>` : ''}
  ${order.customer_name ? `<div style="font-size:13px;color:#555">Customer: ${order.customer_name}</div>` : ''}
  <table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:13px">${itemsHtml}</table>
  <table style="width:100%;font-size:13px">
    ${order.subtotal != null ? `<tr><td>Subtotal</td><td style="text-align:right;font-family:monospace">${fmtMoney(order.subtotal)}</td></tr>` : ''}
    ${(order.delivery_fee || 0) > 0 ? `<tr><td>Delivery</td><td style="text-align:right;font-family:monospace">${fmtMoney(order.delivery_fee)}</td></tr>` : ''}
    ${(order.tax_amount || 0) > 0 ? `<tr><td>${vendor.shop_tax_label || 'Tax'} (${order.tax_rate}%)</td><td style="text-align:right;font-family:monospace">${fmtMoney(order.tax_amount)}</td></tr>` : ''}
    ${order.total != null ? `<tr style="font-weight:900;font-size:15px"><td style="padding-top:10px;border-top:2px solid #111">TOTAL</td><td style="padding-top:10px;border-top:2px solid #111;text-align:right;font-family:monospace">${fmtMoney(order.total)}</td></tr>` : ''}
  </table>
  ${order.payment_method ? `<div style="font-size:12px;color:#666;margin-top:10px">Paid via: <strong style="color:#111">${order.payment_method}</strong></div>` : ''}
  <p style="text-align:center;color:#888;font-size:12px;margin-top:24px;border-top:2px dashed #ccc;padding-top:14px">Thank you for your order!</p>
  </body></html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })

  try {
    const body = await req.json().catch(() => ({})) as { order_id?: string }
    if (!body.order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    // Idempotency — exit early if already sent. Webhook retries land here.
    const { data: order, error: orderErr } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('id', body.order_id)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'order not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }
    if (order.receipt_sent_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_sent' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    const { data: vendor, error: vendorErr } = await supabase
      .from('vendor_accounts')
      .select('shop_name, shop_address, shop_phone, shop_tax_label, receipt_autosend_chat, receipt_autosend_email')
      .eq('id', order.vendor_id)
      .single()

    if (vendorErr || !vendor) {
      return new Response(JSON.stringify({ error: 'vendor not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }
    if (!vendor.receipt_autosend_chat && !vendor.receipt_autosend_email) {
      return new Response(JSON.stringify({ ok: true, skipped: 'autosend_disabled' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    const receiptText = buildReceiptText(order as OrderRow, vendor as VendorRow)
    const sentChannels: string[] = []
    const errors: string[] = []

    // CHAT — append a system message to chat_messages JSONB array on
    // the order row. Customer's storefront polls this column on every
    // chat tick, so the receipt appears within seconds.
    if (vendor.receipt_autosend_chat) {
      try {
        const prev = Array.isArray(order.chat_messages) ? order.chat_messages : []
        const next = [...prev, {
          id: `receipt-${Date.now()}`,
          sender: 'system',
          type: 'receipt',
          body: receiptText,
          created_at: new Date().toISOString(),
        }]
        const { error } = await supabase.from('vendor_orders').update({ chat_messages: next }).eq('id', body.order_id)
        if (error) errors.push('chat: ' + error.message)
        else sentChannels.push('chat')
      } catch (e) {
        errors.push('chat: ' + (e instanceof Error ? e.message : String(e)))
      }
    }

    // EMAIL — Resend transactional. Skipped silently if RESEND_API not
    // configured (development environment). Vendor sees the same toggle
    // applied but the email simply doesn't go out.
    if (vendor.receipt_autosend_email && order.customer_email && RESEND_API) {
      try {
        const html = buildReceiptHtml(order as OrderRow, vendor as VendorRow)
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${vendor.shop_name} <${FROM_EMAIL}>`,
            to: [order.customer_email],
            subject: `Receipt — ${vendor.shop_name} order #${order.id.slice(0, 8)}`,
            html,
            text: receiptText,
          }),
        })
        if (!resp.ok) {
          const errBody = await resp.text()
          errors.push('email: ' + errBody.slice(0, 200))
        } else {
          sentChannels.push('email')
        }
      } catch (e) {
        errors.push('email: ' + (e instanceof Error ? e.message : String(e)))
      }
    }

    // Stamp the timestamp — even if both channels failed, we mark it so
    // a stuck order doesn't retry forever. Vendor can manually resend
    // via the receipt modal if needed.
    await supabase.from('vendor_orders').update({ receipt_sent_at: new Date().toISOString() }).eq('id', body.order_id)

    return new Response(JSON.stringify({ ok: true, sent: sentChannels, errors }), {
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})
