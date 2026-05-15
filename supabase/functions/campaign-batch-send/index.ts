// campaign-batch-send
//
// Reads an email_campaigns row, resolves its segment (customer_accounts
// filtered by last_order_at / total_spent), and batch-sends via Resend.
// Stamps status='sending' → 'sent' on the row when done. Updates
// recipients_count + sent_at.
//
// Body: { campaign_id }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API   = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL   = Deno.env.get('RESEND_FROM_EMAIL') ?? 'shop@streetlocal.live'

function cors () {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() })

  try {
    const { campaign_id } = await req.json().catch(() => ({}))
    if (!campaign_id) return new Response(JSON.stringify({ error: 'campaign_id required' }), { status: 400, headers: { ...cors(), 'Content-Type': 'application/json' } })
    if (!RESEND_API)  return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: { ...cors(), 'Content-Type': 'application/json' } })

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: campaign, error: cErr } = await supabase.from('email_campaigns').select('*').eq('id', campaign_id).single()
    if (cErr || !campaign) return new Response(JSON.stringify({ error: 'campaign not found' }), { status: 404, headers: { ...cors(), 'Content-Type': 'application/json' } })
    if (campaign.status !== 'draft') return new Response(JSON.stringify({ ok: true, skipped: campaign.status }), { headers: { ...cors(), 'Content-Type': 'application/json' } })

    // Mark sending so a second invocation skips.
    await supabase.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign_id)

    // Resolve segment — fetch customer_accounts for the vendor + apply
    // the segment_filter. Supports: last_order_days_lte, last_order_days_gte, total_spent_gte.
    let q = supabase.from('customer_accounts').select('email, name').eq('vendor_id', campaign.vendor_id).not('email', 'is', null)
    const f = campaign.segment_filter || {}
    if (f.last_order_days_lte != null) {
      const since = new Date(Date.now() - f.last_order_days_lte * 24 * 3600 * 1000).toISOString()
      q = q.gte('last_order_at', since)
    }
    if (f.last_order_days_gte != null) {
      const before = new Date(Date.now() - f.last_order_days_gte * 24 * 3600 * 1000).toISOString()
      q = q.lte('last_order_at', before)
    }
    if (f.total_spent_gte != null) q = q.gte('total_spent', f.total_spent_gte)

    const { data: recipients, error: rErr } = await q
    if (rErr) {
      await supabase.from('email_campaigns').update({ status: 'failed' }).eq('id', campaign_id)
      return new Response(JSON.stringify({ error: 'segment query failed: ' + rErr.message }), { status: 500, headers: { ...cors(), 'Content-Type': 'application/json' } })
    }

    const { data: vendor } = await supabase.from('vendor_accounts').select('shop_name').eq('id', campaign.vendor_id).single()
    const fromName = vendor?.shop_name || 'StreetLocal shop'

    // Send in batches of 50 to stay friendly with Resend rate limits.
    let sent = 0
    const errors: string[] = []
    for (let i = 0; i < (recipients || []).length; i += 50) {
      const batch = recipients.slice(i, i + 50)
      const ops = batch.map(async (r: any) => {
        try {
          // Per-recipient {{name}} substitution. Cheap merge tag.
          const body = (campaign.body_html || '').replace(/\{\{\s*name\s*\}\}/g, r.name || 'friend')
          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: `${fromName} <${FROM_EMAIL}>`,
              to: [r.email],
              subject: campaign.subject,
              html: body,
            }),
          })
          if (resp.ok) sent++
          else errors.push((await resp.text()).slice(0, 100))
        } catch (e) {
          errors.push(String(e?.message || e).slice(0, 100))
        }
      })
      await Promise.all(ops)
    }

    await supabase.from('email_campaigns').update({
      status: sent > 0 ? 'sent' : 'failed',
      recipients_count: sent,
      sent_at: new Date().toISOString(),
    }).eq('id', campaign_id)

    return new Response(JSON.stringify({ ok: true, sent, errors: errors.slice(0, 5) }), { headers: { ...cors(), 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...cors(), 'Content-Type': 'application/json' } })
  }
})
