// pos-sync-menu — pull the vendor's menu from their connected POS into
// our menu_items table. Generic dispatcher with one adapter per provider.
//
// Trigger options:
//   - Manual: client calls supabase.functions.invoke('pos-sync-menu', { body: { restaurantId } })
//   - Cron:  call this fn from a pg_cron job hourly (see setup-cron-pos.sql, future)
//   - Webhook: providers like Toast support menu-changed webhooks; route those
//     to this fn after verifying signature.
//
// On success: writes pos_integrations.last_synced_at; on failure writes
// last_sync_error and returns 500. Idempotent: matches existing menu_items
// by extras.pos_external_id so re-running won't duplicate.
//
// Deploy: `supabase functions deploy pos-sync-menu`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

interface ExternalItem {
  external_id: string
  name: string
  description?: string
  price: number          // IDR (integer)
  category?: string
  photo_url?: string | null
  is_available?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { restaurantId, provider: hintedProvider } = await req.json()
    if (!restaurantId) return json({ error: 'restaurantId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Pick an active integration. If a provider is hinted, prefer it.
    const q = supabase.from('pos_integrations').select('*').eq('restaurant_id', restaurantId).eq('is_active', true)
    const { data: integrations } = hintedProvider ? await q.eq('provider', hintedProvider).limit(1) : await q.limit(1)
    const integ = integrations?.[0]
    if (!integ) return json({ error: 'no active POS integration for this restaurant' }, 404)

    let items: ExternalItem[]
    try {
      switch (integ.provider) {
        case 'toast':    items = await pullToast(integ); break
        case 'square':   items = await pullSquare(integ); break
        case 'loyverse': items = await pullLoyverse(integ); break
        default: return json({ error: `provider "${integ.provider}" sync not implemented` }, 501)
      }
    } catch (e) {
      const errMsg = (e as Error).message || 'sync failed'
      await supabase.from('pos_integrations').update({ last_sync_error: errMsg.slice(0, 500) }).eq('id', integ.id)
      return json({ error: errMsg }, 500)
    }

    // Upsert into menu_items keyed by extras.pos_external_id. We can't UNIQUE
    // on a jsonb field portably, so we fetch existing rows once, build an
    // external_id → row.id map, then INSERT or UPDATE per item.
    const { data: existing } = await supabase
      .from('menu_items')
      .select('id, extras')
      .eq('restaurant_id', restaurantId)
    const idByExternal: Record<string, number> = {}
    for (const row of existing || []) {
      const ext = (row.extras as any)?.pos_external_id
      if (ext) idByExternal[ext] = row.id
    }

    let inserted = 0, updated = 0
    for (const it of items) {
      const row = {
        restaurant_id: restaurantId,
        name: it.name,
        description: it.description ?? null,
        price: it.price,
        category: it.category ?? 'Main',
        photo_url: it.photo_url ?? null,
        is_available: it.is_available ?? true,
        prep_time_min: 10,
        sort_order: 0,
        extras: { pos_external_id: it.external_id, pos_provider: integ.provider },
      }
      const existingId = idByExternal[it.external_id]
      if (existingId) {
        const { error } = await supabase.from('menu_items').update(row).eq('id', existingId)
        if (!error) updated++
      } else {
        const { error } = await supabase.from('menu_items').insert(row)
        if (!error) inserted++
      }
    }

    await supabase.from('pos_integrations').update({
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    }).eq('id', integ.id)

    return json({ provider: integ.provider, inserted, updated, total: items.length })
  } catch (e) {
    console.error('pos-sync-menu error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})

// ── Provider adapters ───────────────────────────────────────────────────────

async function pullToast(integ: any): Promise<ExternalItem[]> {
  // Toast partner API: /menus/v2/menus returns the published menu graph.
  // api_key here is the partner-management access token. external_account_id
  // is the restaurant GUID Toast assigned to this location.
  const guid = integ.external_account_id
  if (!guid) throw new Error('Toast: external_account_id (restaurant GUID) missing')
  const r = await fetch('https://ws-api.toasttab.com/menus/v2/menus', {
    headers: { 'Authorization': `Bearer ${integ.api_key}`, 'Toast-Restaurant-External-ID': guid },
  })
  if (!r.ok) throw new Error(`Toast menus pull ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const data = await r.json()
  const out: ExternalItem[] = []
  // Toast menu shape: { menus: [ { menuGroups: [ { menuItems: [...] } ] } ] }
  for (const menu of data?.menus || []) {
    for (const group of menu?.menuGroups || []) {
      for (const it of group?.menuItems || []) {
        out.push({
          external_id: it.guid,
          name: it.name,
          description: it.description || undefined,
          price: Math.round((it.price || 0) * 100),         // Toast returns dollars; convert to cents (caller may re-scale)
          category: group.name || 'Main',
          photo_url: it.image || null,
          is_available: !it.unavailable,
        })
      }
    }
  }
  return out
}

async function pullSquare(integ: any): Promise<ExternalItem[]> {
  // Square Catalog API: POST /v2/catalog/list?types=ITEM,ITEM_VARIATION
  // api_key is the OAuth access token for the connected account.
  const r = await fetch('https://connect.squareup.com/v2/catalog/list?types=ITEM', {
    headers: { 'Authorization': `Bearer ${integ.api_key}`, 'Square-Version': '2024-10-17', 'Accept': 'application/json' },
  })
  if (!r.ok) throw new Error(`Square catalog list ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const data = await r.json()
  const out: ExternalItem[] = []
  for (const obj of data?.objects || []) {
    if (obj.type !== 'ITEM') continue
    const it = obj.item_data || {}
    const variation = (it.variations || [])[0]?.item_variation_data || {}
    const priceAmount = variation.price_money?.amount ?? 0      // smallest unit (cents/sen)
    out.push({
      external_id: obj.id,
      name: it.name,
      description: it.description || undefined,
      price: Math.round(Number(priceAmount)),
      category: it.category_id || 'Main',
      photo_url: null,
      is_available: !it.is_archived,
    })
  }
  return out
}

async function pullLoyverse(integ: any): Promise<ExternalItem[]> {
  // Loyverse API: GET /v1.0/items?limit=250
  const r = await fetch('https://api.loyverse.com/v1.0/items?limit=250', {
    headers: { 'Authorization': `Bearer ${integ.api_key}` },
  })
  if (!r.ok) throw new Error(`Loyverse items ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const data = await r.json()
  const out: ExternalItem[] = []
  for (const it of data?.items || []) {
    const variant = (it.variants || [])[0] || {}
    out.push({
      external_id: it.id,
      name: it.item_name,
      description: it.description || undefined,
      price: Math.round(Number(variant.default_price ?? 0)),
      category: it.category_id || 'Main',
      photo_url: it.image_url || null,
      is_available: !it.is_sold_by_weight,
    })
  }
  return out
}
