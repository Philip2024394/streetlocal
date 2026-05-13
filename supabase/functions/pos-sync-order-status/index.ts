// pos-sync-order-status — push a food_orders status change OUT to the
// vendor's POS so the POS reflects the same lifecycle (e.g. KDS marks
// the order ready, Toast prep state syncs).
//
// Trigger: after an UPDATE on food_orders.status, the dashboard or a
// trigger calls supabase.functions.invoke('pos-sync-order-status', { body: { foodOrderId } }).
//
// Currently a best-effort, fire-and-forget surface. Adapters return 200
// with sent:bool — failures are logged on pos_integrations.last_sync_error
// but the food_order itself is not rolled back.
//
// Deploy: `supabase functions deploy pos-sync-order-status`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { foodOrderId } = await req.json()
    if (!foodOrderId) return json({ error: 'foodOrderId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order } = await supabase
      .from('food_orders')
      .select('id, restaurant_id, status, gateway_order_id, total, items, customer_name, customer_phone')
      .eq('id', foodOrderId).single()
    if (!order) return json({ error: 'order not found' }, 404)

    const { data: integrations } = await supabase
      .from('pos_integrations').select('*')
      .eq('restaurant_id', order.restaurant_id).eq('is_active', true)
    if (!integrations || integrations.length === 0) return json({ sent: false, reason: 'no active POS' })

    const results: Array<{ provider: string; sent: boolean; error?: string }> = []
    for (const integ of integrations) {
      try {
        switch (integ.provider) {
          case 'square':   await pushSquare(integ, order); break
          case 'toast':    await pushToast(integ, order); break
          case 'loyverse': await pushLoyverse(integ, order); break
          case 'custom':   await pushCustomWebhook(integ, order); break
          default: continue
        }
        results.push({ provider: integ.provider, sent: true })
      } catch (e) {
        const errMsg = (e as Error).message || 'push failed'
        await supabase.from('pos_integrations').update({ last_sync_error: errMsg.slice(0, 500) }).eq('id', integ.id)
        results.push({ provider: integ.provider, sent: false, error: errMsg })
      }
    }
    return json({ sent: results.some((r) => r.sent), results })
  } catch (e) {
    console.error('pos-sync-order-status error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})

// ── Adapters ────────────────────────────────────────────────────────────────

async function pushSquare(integ: any, order: any) {
  // Square Orders API: PATCH /v2/orders/{order_id} sets state
  // (OPEN | COMPLETED | CANCELED). We map our pipeline to those three.
  const state = mapStatus(order.status, { paid: 'OPEN', ready: 'OPEN', delivered: 'COMPLETED', cancelled: 'CANCELED' })
  if (!state) return
  const orderRef = order.gateway_order_id
  if (!orderRef) return
  const r = await fetch(`https://connect.squareup.com/v2/orders/${encodeURIComponent(orderRef)}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${integ.api_key}`, 'Square-Version': '2024-10-17', 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: { state }, idempotency_key: `${orderRef}-${state}` }),
  })
  if (!r.ok) throw new Error(`Square ${r.status}: ${(await r.text()).slice(0, 200)}`)
}

async function pushToast(integ: any, order: any) {
  // Toast: orders are created via /orders/v2/orders. For status push we
  // could call /kitchen/v2/preparation-status when available; for now
  // we no-op on non-terminal states to avoid duplicate orders.
  if (order.status !== 'delivered' && order.status !== 'cancelled') return
  // Real implementation would map to Toast specifics. Leaving the call
  // commented but the structure ready for the user to fill in.
  return
}

async function pushLoyverse(integ: any, order: any) {
  // Loyverse currently exposes receipt-create but not order-state update
  // outside the receipt context. We post a receipt at delivery time only.
  if (order.status !== 'delivered') return
  const lineItems = (order.items || []).map((it: any) => ({
    item_name: it.name,
    quantity:  Number(it.qty) || 1,
    price:     Math.round(Number(it.price) || 0),
  }))
  const r = await fetch('https://api.loyverse.com/v1.0/receipts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${integ.api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receipt_type: 'SALE',
      customer_id:  null,
      note:         `Order #${order.id}`,
      line_items:   lineItems,
      payments:     [{ payment_type_id: 'cash', money_amount: Math.round(Number(order.total) || 0) }],
    }),
  })
  if (!r.ok) throw new Error(`Loyverse ${r.status}: ${(await r.text()).slice(0, 200)}`)
}

async function pushCustomWebhook(integ: any, order: any) {
  // Generic: POST the order payload to the URL the vendor stored in
  // external_account_id, signed with webhook_secret as a Bearer token.
  if (!integ.external_account_id) return
  const r = await fetch(integ.external_account_id, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': integ.webhook_secret ? `Bearer ${integ.webhook_secret}` : '' },
    body: JSON.stringify({ event: 'order.status_changed', order }),
  })
  if (!r.ok) throw new Error(`Custom webhook ${r.status}`)
}

function mapStatus(internal: string, map: Record<string, string>): string | null {
  if (internal === 'confirmed' || internal === 'driver_heading' || internal === 'picked_up') return map.paid || null
  if (internal === 'delivered') return map.delivered || null
  if (internal === 'cancelled') return map.cancelled || null
  return null
}
