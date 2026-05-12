// Returns the vendor's public Worldpay Online clientKey (T_C_... / L_C_...)
// so the foodlocalchat client can initialise Worldpay.js for card
// tokenisation. Keeping this behind an Edge Function means the customer
// app never has to query vendor_payment_connections directly (which
// would expose the serviceKey alongside).
//
// Deploy: `supabase functions deploy worldpay-client-key`

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
    const { vendorId } = await req.json()
    if (!vendorId) return json({ error: 'vendorId required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: conn, error: connErr } = await supabase
      .from('vendor_payment_connections')
      .select('client_key, mode, is_active')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'worldpay')
      .single()

    if (connErr || !conn?.is_active || !conn.client_key) {
      return json({ error: 'Worldpay not configured or inactive for this vendor' }, 400)
    }
    return json({ clientKey: conn.client_key, mode: conn.mode })
  } catch (e) {
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
