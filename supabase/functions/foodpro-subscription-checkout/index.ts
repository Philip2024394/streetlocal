// FoodLocal Pro subscription checkout — creates a Midtrans Snap token using
// StreetLocal's CENTRAL Midtrans account. The restaurant pays Rp 100.000
// (whatsapp tier) or Rp 150.000 (chat tier) for monthly access. On
// settlement the foodpro-subscription-webhook flips
// restaurants.url_active to true and stamps expires_at = now + 30 days.
//
// Distinct from streetlocal's `subscription-create-checkout`, which targets
// food-basic's `vendor_accounts` table. FoodLocal Pro uses `restaurants`.
//
// Required env:
//   MIDTRANS_SUBSCRIPTION_SERVER_KEY  — SB-Mid-server-... or Mid-server-...
//   MIDTRANS_SUBSCRIPTION_MODE        — 'sandbox' | 'production' (default sandbox)
//
// Deploy: `supabase functions deploy foodpro-subscription-checkout`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

// FoodLocal Pro pricing (IDR). Mirrors the 'pro' row in the food-basic
// subscription edge function so vendor pricing stays consistent across apps.
const PRICE_TABLE: Record<string, number> = {
  whatsapp: 100000,
  chat:     150000,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { restaurantId, planTier, returnUrl } = body
    if (!restaurantId) return json({ error: 'restaurantId required' }, 400)
    if (!planTier || !(planTier in PRICE_TABLE)) {
      return json({ error: `planTier must be one of: ${Object.keys(PRICE_TABLE).join(', ')}` }, 400)
    }

    const serverKey = Deno.env.get('MIDTRANS_SUBSCRIPTION_SERVER_KEY')
    if (!serverKey) return json({ error: 'subscription gateway not configured (MIDTRANS_SUBSCRIPTION_SERVER_KEY missing)' }, 500)
    const isProd = (Deno.env.get('MIDTRANS_SUBSCRIPTION_MODE') || 'sandbox') === 'production'
    const snapBase = isProd ? 'https://app.midtrans.com/snap/v1' : 'https://app.sandbox.midtrans.com/snap/v1'

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: restaurant, error: restErr } = await supabase
      .from('restaurants')
      .select('id, name, phone')
      .eq('id', restaurantId)
      .single()
    if (restErr || !restaurant) return json({ error: 'restaurant not found' }, 404)

    const amount = PRICE_TABLE[planTier]
    // FLP- prefix lets the webhook tell foodlocal-pro orders apart from
    // food-basic's SLS- orders if both share the same Midtrans account.
    const safeSlug = String(restaurant.name || restaurant.id).replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 18)
    const orderId = `FLP-${planTier}-${safeSlug}-${Date.now()}`

    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('foodpro_payment_records').insert({
      restaurant_id: restaurant.id,
      amount,
      period_start: new Date().toISOString(),
      period_end: periodEnd,
      status: 'pending',
      payment_method: 'card',
      midtrans_order_id: orderId,
      notes: `FoodLocal Pro ${planTier} subscription via Midtrans Snap`,
    })

    const snapPayload = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [{
        id: `foodpro-${planTier}`,
        price: amount,
        quantity: 1,
        name: `FoodLocal Pro ${planTier === 'whatsapp' ? 'WhatsApp' : 'Chat'} Orders — 30 days`,
      }],
      customer_details: {
        first_name: restaurant.name || 'Restaurant',
        phone: restaurant.phone || '',
      },
      enabled_payments: ['credit_card', 'gopay', 'shopeepay', 'qris', 'bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va', 'echannel'],
      credit_card: { save_card: true, secure: true },
      callbacks: {
        finish: (returnUrl || 'https://imoutnow.vercel.app/?view=vendor') +
          ((returnUrl || '').includes('?') ? '&' : '?') +
          'subscription=ok&order_id=' + encodeURIComponent(orderId),
      },
      custom_field1: String(restaurant.id),
      custom_field2: planTier,
    }

    const r = await fetch(`${snapBase}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(serverKey + ':')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapPayload),
    })
    const result = await r.json().catch(() => ({}))
    if (!r.ok || !(result as any).token) {
      await supabase.from('foodpro_payment_records')
        .update({ status: 'failed', notes: `Snap creation failed: ${JSON.stringify(result).slice(0, 200)}` })
        .eq('midtrans_order_id', orderId)
      return json({ error: (result as any).error_messages?.[0] || 'Midtrans Snap creation failed', detail: result }, r.status || 500)
    }

    await supabase.from('restaurants').update({
      subscription_order_id: orderId,
      subscription_provider: 'midtrans',
      subscription_product: 'pro',
      subscription_tier: planTier,
    }).eq('id', restaurant.id)

    return json({
      token: (result as any).token,
      redirectUrl: (result as any).redirect_url,
      orderId,
      amount,
      planTier,
    })
  } catch (e) {
    console.error('foodpro-subscription-checkout error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})
