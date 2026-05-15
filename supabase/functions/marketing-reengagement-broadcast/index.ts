// Re-engagement broadcast — daily cron-triggered Edge Function.
//
// What it does:
// 1. Reads every vendor with `marketing_autopost_14days = true`.
// 2. For each, finds conversations where the customer hasn't engaged
//    in `marketing_interval_days` days AND hasn't been broadcast to
//    in the same window (avoid spamming).
// 3. Picks a banner — random non-expired landscape if
//    `marketing_random_landscape = true`, otherwise the
//    `marketing_active_banner_id`.
// 4. Inserts a system message into the conversation with the banner's
//    discount + headline + subtitle + countdown + baked image URL.
// 5. Stamps `chat_conversations.last_marketing_broadcast_at = now()`.
//
// Triggered by pg_cron daily at 09:00 UTC (see migration
// 20260526000000_reengagement_cron.sql). Can also be invoked
// manually via `supabase functions invoke marketing-reengagement-broadcast`.
//
// Deploy: `supabase functions deploy marketing-reengagement-broadcast --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' }, status })

interface Vendor {
  id: string
  marketing_autopost_14days: boolean
  marketing_interval_days: number
  marketing_random_landscape: boolean
  marketing_active_banner_id: string | null
}
interface Banner {
  id: string
  vendor_id: string
  format: string
  bg_image: string | null
  headline: string
  discount: string
  subtitle: string | null
  baked_image_url: string | null
  countdown_ends_at: string | null
}
interface Conversation {
  id: string
  vendor_id: string
  customer_phone: string
  last_message_at: string | null
  last_marketing_broadcast_at: string | null
}

function fmtCountdown (endsAtMs: number): string {
  const ms = endsAtMs - Date.now()
  if (ms <= 0) return 'EXPIRED'
  const s = Math.floor(ms / 1000)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'missing env' }, 500)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1. Vendors with the 14-day toggle on
  const { data: vendors, error: vErr } = await supabase
    .from('vendor_accounts')
    .select('id, marketing_autopost_14days, marketing_interval_days, marketing_random_landscape, marketing_active_banner_id')
    .eq('marketing_autopost_14days', true)
    .eq('status', 'active')
  if (vErr) return json({ error: vErr.message }, 500)

  const vendorsOptedIn = (vendors || []) as Vendor[]
  let vendorsProcessed = 0
  let messagesSent = 0
  const errors: string[] = []

  for (const v of vendorsOptedIn) {
    try {
      const interval = Math.max(1, Math.min(365, v.marketing_interval_days || 14))
      const cutoff = new Date(Date.now() - interval * 24 * 60 * 60 * 1000).toISOString()

      // 2. Banner pool for this vendor
      const { data: bannerRows } = await supabase
        .from('marketing_banners')
        .select('id, vendor_id, format, bg_image, headline, discount, subtitle, baked_image_url, countdown_ends_at')
        .eq('vendor_id', v.id)
      const banners = (bannerRows || []) as Banner[]
      if (banners.length === 0) continue

      const pickBanner = (): Banner | null => {
        if (v.marketing_random_landscape) {
          const pool = banners.filter(b => b.format === 'landscape' && (!b.countdown_ends_at || new Date(b.countdown_ends_at).getTime() > Date.now()))
          if (pool.length === 0) return banners.find(b => b.id === v.marketing_active_banner_id) ?? null
          return pool[Math.floor(Math.random() * pool.length)]
        }
        return banners.find(b => b.id === v.marketing_active_banner_id) ?? null
      }

      // 3. Find inactive conversations for this vendor
      const { data: convs } = await supabase
        .from('chat_conversations')
        .select('id, vendor_id, customer_phone, last_message_at, last_marketing_broadcast_at')
        .eq('vendor_id', v.id)
        .lt('last_message_at', cutoff)
      const targets = ((convs || []) as Conversation[]).filter(c =>
        !c.last_marketing_broadcast_at || new Date(c.last_marketing_broadcast_at) < new Date(cutoff)
      )

      for (const c of targets) {
        // 4. Pick a banner per conversation so the random rotation
        //    actually rotates across customers, not "one banner per run".
        const banner = pickBanner()
        if (!banner) continue
        const cd = banner.countdown_ends_at ? `\n⏰ ${fmtCountdown(new Date(banner.countdown_ends_at).getTime())}` : ''
        const imageUrl = banner.baked_image_url || banner.bg_image || ''
        const body = `🎁 ${banner.discount} · ${banner.headline}${banner.subtitle ? '\n' + banner.subtitle : ''}${cd}${imageUrl ? '\n' + imageUrl : ''}`

        // 5. Insert chat_messages row + bump conversation's broadcast timestamp.
        const { error: mErr } = await supabase.from('chat_messages').insert({
          conversation_id: c.id,
          sender_role: 'system',
          body,
        })
        if (mErr) { errors.push(`conv ${c.id}: ${mErr.message}`); continue }
        await supabase.from('chat_conversations').update({ last_marketing_broadcast_at: new Date().toISOString() }).eq('id', c.id)
        messagesSent++
      }
      vendorsProcessed++
    } catch (e) {
      errors.push(`vendor ${v.id}: ${(e as Error).message}`)
    }
  }

  return json({ ok: true, vendorsProcessed, messagesSent, errors })
})
