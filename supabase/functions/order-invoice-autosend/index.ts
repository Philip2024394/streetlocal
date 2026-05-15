// order-invoice-autosend
//
// Cron-fired Edge Function. For each paid order with invoice_sent_at
// null, assigns an invoice number (idempotent), then sends the invoice
// to chat / email based on the vendor's autosend toggles.
//
// Mirrors order-receipt-autosend but uses the invoice template + the
// dedicated invoice_* columns on vendor_accounts.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API   = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL   = Deno.env.get('RESEND_FROM_EMAIL') ?? 'invoices@streetlocal.live'

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

function buildInvoiceText (order: any, vendor: any): string {
  const placed = new Date(order.created_at)
  const items  = Array.isArray(order.items) ? order.items : []
  const lines: string[] = []
  lines.push(`📄 Invoice ${order.invoice_number || '(no number)'}`)
  lines.push(vendor.invoice_legal_name || vendor.shop_name)
  if (vendor.invoice_tax_id) lines.push(`Tax ID: ${vendor.invoice_tax_id}`)
  if (vendor.shop_address)   lines.push(vendor.shop_address)
  lines.push('')
  lines.push(`Date: ${placed.toLocaleDateString()}`)
  if (order.invoice_due_date) lines.push(`Due: ${order.invoice_due_date}`)
  if (order.invoice_customer_business) lines.push(`Bill to: ${order.invoice_customer_business}`)
  if (order.invoice_customer_tax_id)   lines.push(`Customer tax ID: ${order.invoice_customer_tax_id}`)
  if (order.invoice_po_reference)      lines.push(`PO ref: ${order.invoice_po_reference}`)
  lines.push('')
  lines.push('Items:')
  for (const it of items) {
    const qty = it.qty || 1
    const lt  = it.lineTotal != null ? it.lineTotal : (it.price || 0) * qty
    lines.push(`  ${qty}× ${it.name}  ${fmtMoney(lt)}`)
  }
  lines.push('')
  if (order.subtotal != null) lines.push(`Subtotal: ${fmtMoney(order.subtotal)}`)
  if ((order.delivery_fee || 0) > 0) lines.push(`Delivery: ${fmtMoney(order.delivery_fee)}`)
  if ((order.tax_amount || 0) > 0)   lines.push(`Tax (${order.tax_rate}%): ${fmtMoney(order.tax_amount)}`)
  if (order.total != null) lines.push(`TOTAL: ${fmtMoney(order.total)}`)
  if (vendor.invoice_payment_terms) {
    lines.push('')
    lines.push(`Payment terms: ${vendor.invoice_payment_terms}`)
  }
  if (vendor.invoice_bank_details) {
    lines.push('')
    lines.push(vendor.invoice_bank_details)
  }
  if (vendor.invoice_footer_note) {
    lines.push('')
    lines.push(vendor.invoice_footer_note)
  }
  return lines.join('\n')
}

function buildInvoiceHtml (order: any, vendor: any): string {
  const placed = new Date(order.created_at)
  const items  = Array.isArray(order.items) ? order.items : []
  const itemsHtml = items.map((it: any) => {
    const qty = it.qty || 1
    const lt  = it.lineTotal != null ? it.lineTotal : (it.price || 0) * qty
    return `<tr><td style="padding:8px 6px;border-bottom:1px solid #ddd">${qty}× ${it.name}</td><td style="padding:8px 6px;border-bottom:1px solid #ddd;text-align:right;font-family:monospace">${fmtMoney(lt)}</td></tr>`
  }).join('')
  return `<!doctype html><html><body style="font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:30px;color:#1a1a1a;background:#fff">
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr>
      <td style="vertical-align:top">
        <h1 style="margin:0;font-size:28px;letter-spacing:-0.5px">${vendor.invoice_legal_name || vendor.shop_name}</h1>
        ${vendor.invoice_tax_id ? `<div style="font-size:13px;color:#555;margin-top:4px">Tax ID: ${vendor.invoice_tax_id}</div>` : ''}
        ${vendor.invoice_registration_number ? `<div style="font-size:13px;color:#555">Reg: ${vendor.invoice_registration_number}</div>` : ''}
        ${vendor.shop_address ? `<div style="font-size:13px;color:#555">${vendor.shop_address}</div>` : ''}
        ${vendor.shop_phone ? `<div style="font-size:13px;color:#555">${vendor.shop_phone}</div>` : ''}
      </td>
      <td style="vertical-align:top;text-align:right">
        <div style="font-size:30px;font-weight:700;letter-spacing:2px;color:#111">INVOICE</div>
        <div style="font-size:15px;font-family:monospace;margin-top:4px;color:#222">${order.invoice_number || '—'}</div>
        <div style="font-size:13px;color:#555;margin-top:8px">${placed.toLocaleDateString()}</div>
        ${order.invoice_due_date ? `<div style="font-size:13px;color:#555">Due: ${order.invoice_due_date}</div>` : ''}
      </td>
    </tr>
  </table>
  ${order.invoice_customer_business || order.invoice_customer_tax_id ? `<div style="padding:12px 14px;background:#f5f5f5;border-radius:6px;margin-bottom:20px;font-size:13px">
    <div style="font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Bill to</div>
    ${order.invoice_customer_business ? `<div style="font-weight:700;color:#111">${order.invoice_customer_business}</div>` : ''}
    ${order.invoice_customer_tax_id ? `<div>Tax ID: ${order.invoice_customer_tax_id}</div>` : ''}
    ${order.invoice_po_reference ? `<div>PO: ${order.invoice_po_reference}</div>` : ''}
  </div>` : ''}
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px">
    <thead><tr style="border-bottom:2px solid #111"><th style="text-align:left;padding:10px 6px;color:#555;text-transform:uppercase;letter-spacing:0.5px;font-size:12px">Item</th><th style="text-align:right;padding:10px 6px;color:#555;text-transform:uppercase;letter-spacing:0.5px;font-size:12px">Amount</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <table style="width:100%;font-size:14px">
    ${order.subtotal != null ? `<tr><td style="padding:4px 6px">Subtotal</td><td style="padding:4px 6px;text-align:right;font-family:monospace">${fmtMoney(order.subtotal)}</td></tr>` : ''}
    ${(order.delivery_fee || 0) > 0 ? `<tr><td style="padding:4px 6px">Delivery</td><td style="padding:4px 6px;text-align:right;font-family:monospace">${fmtMoney(order.delivery_fee)}</td></tr>` : ''}
    ${(order.tax_amount || 0) > 0 ? `<tr><td style="padding:4px 6px">${vendor.shop_tax_label || 'Tax'} (${order.tax_rate}%)</td><td style="padding:4px 6px;text-align:right;font-family:monospace">${fmtMoney(order.tax_amount)}</td></tr>` : ''}
    ${order.total != null ? `<tr style="font-size:18px;font-weight:700"><td style="padding:14px 6px;border-top:2px solid #111">TOTAL</td><td style="padding:14px 6px;border-top:2px solid #111;text-align:right;font-family:monospace">${fmtMoney(order.total)}</td></tr>` : ''}
  </table>
  ${vendor.invoice_payment_terms ? `<div style="margin-top:24px;font-size:13px"><strong>Payment terms:</strong> ${vendor.invoice_payment_terms}</div>` : ''}
  ${vendor.invoice_bank_details ? `<div style="margin-top:14px;padding:14px;background:#fafafa;border-left:4px solid #111;font-size:13px;white-space:pre-line">${vendor.invoice_bank_details}</div>` : ''}
  ${vendor.invoice_footer_note ? `<div style="margin-top:30px;text-align:center;color:#666;font-size:12px;border-top:1px solid #ddd;padding-top:16px">${vendor.invoice_footer_note}</div>` : ''}
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

    const { data: order, error: orderErr } = await supabase
      .from('vendor_orders').select('*').eq('id', body.order_id).single()
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'order not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }
    if (order.invoice_sent_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_sent' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    const { data: vendor, error: vendorErr } = await supabase
      .from('vendor_accounts').select('*').eq('id', order.vendor_id).single()
    if (vendorErr || !vendor) {
      return new Response(JSON.stringify({ error: 'vendor not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }
    if (!vendor.invoice_autosend_chat && !vendor.invoice_autosend_email) {
      return new Response(JSON.stringify({ ok: true, skipped: 'autosend_disabled' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    // Assign an invoice number if one isn't on the order yet.
    if (!order.invoice_number) {
      const { data: numData } = await supabase.rpc('assign_invoice_number', {
        p_vendor_id: order.vendor_id, p_order_id: order.id,
      })
      if (numData) order.invoice_number = numData
    }

    const invoiceText = buildInvoiceText(order, vendor)
    const sentChannels: string[] = []
    const errors: string[] = []

    if (vendor.invoice_autosend_chat) {
      try {
        const prev = Array.isArray(order.chat_messages) ? order.chat_messages : []
        const next = [...prev, {
          id: `invoice-${Date.now()}`,
          sender: 'system',
          type: 'invoice',
          invoice_number: order.invoice_number,
          body: invoiceText,
          created_at: new Date().toISOString(),
        }]
        const { error } = await supabase.from('vendor_orders').update({ chat_messages: next }).eq('id', body.order_id)
        if (error) errors.push('chat: ' + error.message); else sentChannels.push('chat')
      } catch (e) {
        errors.push('chat: ' + (e instanceof Error ? e.message : String(e)))
      }
    }

    if (vendor.invoice_autosend_email && order.customer_email && RESEND_API) {
      try {
        const html = buildInvoiceHtml(order, vendor)
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${vendor.invoice_legal_name || vendor.shop_name} <${FROM_EMAIL}>`,
            to: [order.customer_email],
            subject: `Invoice ${order.invoice_number} — ${vendor.invoice_legal_name || vendor.shop_name}`,
            html, text: invoiceText,
          }),
        })
        if (!resp.ok) errors.push('email: ' + (await resp.text()).slice(0, 200))
        else sentChannels.push('email')
      } catch (e) {
        errors.push('email: ' + (e instanceof Error ? e.message : String(e)))
      }
    }

    await supabase.from('vendor_orders').update({ invoice_sent_at: new Date().toISOString() }).eq('id', body.order_id)

    return new Response(JSON.stringify({ ok: true, sent: sentChannels, errors, invoice_number: order.invoice_number }), {
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})
