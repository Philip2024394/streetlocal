// send-customer-whatsapp — fire a WhatsApp message to the customer when a
// notification event occurs. Two delivery modes, picked by which env vars
// are set:
//
//   1. Meta WhatsApp Cloud API (preferred, automated)
//      WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
//      Optional WHATSAPP_TEMPLATE_NAME, WHATSAPP_TEMPLATE_LANG (defaults: hello_world / en_US)
//
//   2. wa.me deep-link (fallback, manual — returns a click-to-send URL
//      so the vendor can tap once to send from their phone)
//
// Body: { restaurant_id, customer_phone, event, payload }
//   event:   'order_confirmed' | 'order_ready' | 'order_picked_up' | 'order_delivered' | 'refund_requested' | 'custom'
//   payload: { order_id?, restaurant_name?, total?, message? }
//
// Returns: { sent: bool, mode: 'cloud'|'deeplink', deeplink?: string, messageId?: string }
//
// Deploy: `supabase functions deploy send-customer-whatsapp`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })

function normalizePhone(p: string): string {
  return String(p || '').replace(/[^0-9]/g, '')
}

// Plain-text templates per event. Vendor-facing app reads notification_prefs
// to decide WHETHER to send; this function just formats the body.
function bodyFor(event: string, payload: any): string {
  const rest = payload?.restaurant_name || 'the restaurant'
  const oid  = payload?.order_id ? `#${payload.order_id}` : ''
  const total = payload?.total ? ` (Rp ${Number(payload.total).toLocaleString('id-ID')})` : ''
  switch (event) {
    case 'order_confirmed':  return `✅ Your order ${oid} at ${rest}${total} is confirmed. Kitchen is preparing it now.`
    case 'order_ready':      return `🍱 Your order ${oid} at ${rest} is ready! Driver is on the way.`
    case 'order_picked_up':  return `🛵 Driver picked up your order ${oid} from ${rest}.`
    case 'order_delivered':  return `🎉 Your order ${oid} from ${rest} has been delivered. Enjoy your meal!`
    case 'refund_requested': return `↩️ Your refund request for order ${oid}${total} is being processed by ${rest}.`
    default:                 return payload?.message || `Update from ${rest}.`
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { restaurant_id, customer_phone, event, payload = {} } = await req.json()
    const phone = normalizePhone(customer_phone)
    if (!phone) return json({ error: 'customer_phone required' }, 400)
    if (!event) return json({ error: 'event required' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Pull notification_prefs to know if the vendor wants this event sent.
    // If prefs say "no whatsapp" for this event, we early-return without sending.
    if (restaurant_id) {
      const { data: r } = await supabase.from('restaurants')
        .select('notification_prefs, name').eq('id', restaurant_id).single()
      if (r?.notification_prefs) {
        const eventKey = mapEventToPrefKey(event)
        const enabled = r.notification_prefs?.[eventKey]?.whatsapp
        if (eventKey && enabled === false) return json({ sent: false, mode: 'skipped', reason: 'vendor disabled whatsapp for this event' })
      }
      if (r?.name && !payload.restaurant_name) payload.restaurant_name = r.name
    }

    const text = bodyFor(event, payload)
    const token = Deno.env.get('WHATSAPP_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    // Mode 1: Meta Cloud API (automated).
    if (token && phoneNumberId) {
      const r = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: text, preview_url: false },
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        // Fall back to deeplink so the user still has a path.
        return json({ sent: false, mode: 'cloud', error: data?.error?.message || `cloud api ${r.status}`, deeplink: buildDeepLink(phone, text) }, 200)
      }
      return json({ sent: true, mode: 'cloud', messageId: data?.messages?.[0]?.id })
    }

    // Mode 2: deep link (manual). Returns the URL so the caller can show
    // it as a button or open it in a new tab.
    return json({ sent: false, mode: 'deeplink', deeplink: buildDeepLink(phone, text) })
  } catch (e) {
    console.error('send-customer-whatsapp error', e)
    return json({ error: (e as Error).message || 'server error' }, 500)
  }
})

function buildDeepLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

// Map event id → notification_prefs key. Keep these in sync with
// NotificationsCenter.jsx EVENTS list.
function mapEventToPrefKey(event: string): string | null {
  switch (event) {
    case 'order_confirmed':  return 'payment_paid'
    case 'order_ready':
    case 'order_picked_up':
    case 'order_delivered':  return 'new_order'
    case 'refund_requested': return 'refund_requested'
    default: return null
  }
}
