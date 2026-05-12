// Generate a Braintree client token for the customer's Drop-in UI.
// The Drop-in (loaded from CDN: braintree-web-drop-in.min.js) needs a
// short-lived token to render the card / PayPal / Venmo options.
//
// Deploy: `supabase functions deploy braintree-client-token`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { btGraphql } from '../_shared/braintree.ts'

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
      .select('mode, server_key, client_key, is_active, additional_config')
      .eq('vendor_id', vendorId)
      .eq('gateway_id', 'braintree')
      .single()

    const publicKey  = (conn as any)?.server_key
    const privateKey = (conn as any)?.client_key
    const merchantId = (conn as any)?.additional_config?.merchantId
    if (connErr || !publicKey || !privateKey || !conn?.is_active) {
      return json({ error: 'Braintree not configured or inactive for this vendor' }, 400)
    }
    const mode = (conn as any).mode || 'test'

    const data = await btGraphql<any>(publicKey, privateKey, mode,
      `mutation CreateClientToken($input: CreateClientTokenInput!) {
        createClientToken(input: $input) { clientToken }
      }`,
      { input: merchantId ? { merchantAccountId: merchantId } : {} },
    )

    const clientToken = data?.createClientToken?.clientToken
    if (!clientToken) return json({ error: 'no clientToken returned' }, 500)

    return json({ clientToken, mode })
  } catch (e) {
    console.error('braintree-client-token error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
