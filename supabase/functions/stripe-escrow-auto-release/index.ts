// Auto-release safety net for Stripe escrow holds.
//
// Why this exists: Visa/MC card auth holds expire at ~7 days. If a
// customer never confirms receipt AND the vendor never manually
// captures, the auth lapses and the vendor receives nothing — the
// customer's bank releases the hold automatically and we miss the
// settlement window. This function scans for any held orders whose
// `escrow_release_at` has passed and captures them on the vendor's
// behalf, locking in the payment before the auth can expire.
//
// Idempotent: it only acts on orders where escrow_status='held'. Once
// captured, the row moves to 'released' and is skipped on subsequent
// runs. Safe to call any number of times.
//
// Public on purpose (no JWT required): calling it just enforces the
// already-agreed-upon release schedule. Even if a third party triggers
// it, the only effect is "expired holds get captured slightly sooner."
//
// Schedule with pg_cron (one-time setup, see supabase/setup-cron-escrow.sql).
//
// Deploy: `supabase functions deploy stripe-escrow-auto-release --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const summary = { scanned: 0, captured: 0, failed: 0, errors: [] as Array<{ orderId: string; error: string }> }

  try {
    // Held Stripe orders whose release deadline has passed.
    // Limit to a reasonable batch so we don't get rate-limited by Stripe
    // even in worst-case scenarios; the next cron run picks up any leftovers.
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, vendor_id, gateway_transaction_id')
      .eq('gateway_id', 'stripe')
      .eq('escrow_status', 'held')
      .lte('escrow_release_at', new Date().toISOString())
      .limit(50)

    if (error) return json({ error: error.message, summary }, 500)
    summary.scanned = orders?.length || 0
    if (!orders || orders.length === 0) return json({ ok: true, summary })

    // Group by vendor so we can fetch each connection once.
    const vendorIds = [...new Set(orders.map((o) => o.vendor_id))]
    const { data: conns } = await supabase
      .from('vendor_payment_connections')
      .select('vendor_id, server_key')
      .eq('gateway_id', 'stripe')
      .in('vendor_id', vendorIds)
    const keyByVendor = new Map<string, string>()
    for (const c of conns || []) {
      if ((c as any).server_key) keyByVendor.set((c as any).vendor_id, (c as any).server_key)
    }

    for (const order of orders) {
      const secretKey = keyByVendor.get((order as any).vendor_id)
      if (!secretKey || !(order as any).gateway_transaction_id) {
        summary.failed++
        summary.errors.push({ orderId: order.id, error: !secretKey ? 'vendor stripe key missing' : 'no payment intent recorded' })
        continue
      }
      try {
        const r = await fetch(`https://api.stripe.com/v1/payment_intents/${(order as any).gateway_transaction_id}/capture`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: '',
        })
        const result = await r.json().catch(() => ({}))
        if (!r.ok) {
          summary.failed++
          summary.errors.push({ orderId: order.id, error: (result as any).error?.message || `stripe ${r.status}` })
          continue
        }
        await supabase.from('orders').update({
          escrow_status: 'released',
          escrow_captured_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          payment_status: 'paid',
        }).eq('id', order.id)
        summary.captured++
      } catch (e) {
        summary.failed++
        summary.errors.push({ orderId: order.id, error: (e as Error).message || 'capture threw' })
      }
    }

    return json({ ok: true, summary })
  } catch (e) {
    return json({ error: (e as Error).message || 'server error', summary }, 500)
  }
})
