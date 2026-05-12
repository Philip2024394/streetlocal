// Daily sweep: delete orders older than 14 days that are in a settled
// state. Keeps the orders table from growing indefinitely while
// preserving anything still mid-flight (pending payment, held escrow).
//
// Retention policy:
//   - Delete orders where created_at < now() - 14 days AND
//     payment_status IN ('paid', 'refunded', 'failed', 'cancelled')
//   - SKIP 'pending' rows — they might still be in payment
//   - SKIP rows with escrow_status='held' — funds are still locked
//
// Idempotent: re-running is safe.
// Public endpoint (no JWT) — same reasoning as the escrow auto-release
// function: triggering it just enforces the retention policy.
//
// Schedule via supabase/setup-cron-orders-retention.sql.
//
// Deploy: `supabase functions deploy orders-retention-sweep --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

const RETENTION_DAYS = 14

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // Two-step so we can return a count: select ids first, then delete.
    // Limit to 1,000 per run to keep the request bounded; next cron tick
    // picks up the remainder if there's a big backlog.
    const { data: rows, error: selErr } = await supabase
      .from('orders')
      .select('id')
      .lt('created_at', cutoff)
      .in('payment_status', ['paid', 'refunded', 'failed', 'cancelled'])
      .or('escrow_status.is.null,escrow_status.neq.held')
      .limit(1000)

    if (selErr) return json({ error: selErr.message }, 500)
    if (!rows || rows.length === 0) return json({ ok: true, deleted: 0, cutoff })

    const ids = rows.map((r) => r.id)
    const { error: delErr } = await supabase.from('orders').delete().in('id', ids)
    if (delErr) return json({ error: delErr.message, deleted: 0 }, 500)

    return json({ ok: true, deleted: ids.length, cutoff })
  } catch (e) {
    return json({ error: (e as Error).message || 'sweep failed' }, 500)
  }
})
