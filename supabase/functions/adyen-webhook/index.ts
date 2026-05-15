// Adyen webhook receiver.
// Adyen sends a NotificationRequest with one or more NotificationRequestItem
// objects. Each item is signed with HMAC-SHA256 using the vendor's HMAC key
// (configured in Customer Area → Developers → Webhooks). The signature is
// in `additionalData.hmacSignature` per-item.
//
// Configure in Customer Area → Developers → Webhooks → Add Standard webhook:
//   URL: https://<project>.supabase.co/functions/v1/adyen-webhook
//   Events: AUTHORISATION, CAPTURE, REFUND, REFUND_FAILED, CANCELLATION
//   Auth: Basic (username/password set in CA) — Adyen will use those creds
//         when POSTing to us. The vendor must also paste the username/password
//         into their setup if they want us to challenge auth back (we don't
//         require it because HMAC is the actual security mechanism).
//   HMAC key: generate → paste into vendor's setup form here.
//
// Deploy: `supabase functions deploy adyen-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { adyenVerifyNotification } from '../_shared/adyen.ts'
import { webhookCors, guardedStatusUpdate } from '../_shared/paymentSecurity.ts'

const corsHeaders = webhookCors

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const items = body?.notificationItems || []
    if (!Array.isArray(items) || items.length === 0) {
      return new Response('[accepted]', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    for (const item of items) {
      const i = item.NotificationRequestItem
      if (!i) continue
      const merchantReference = i.merchantReference // our orderId
      if (!merchantReference) {
        console.warn('adyen webhook: no merchantReference in item', i.eventCode)
        continue
      }

      const isFoodOrder = String(merchantReference).startsWith('FOO-')
      let order: any = null
      if (isFoodOrder) {
        const { data } = await supabase.from('food_orders').select('id, restaurant_id').eq('gateway_order_id', merchantReference).single()
        if (data) order = { id: data.id, vendor_id: data.restaurant_id }
      } else {
        const { data } = await supabase.from('orders').select('id, vendor_id').eq('gateway_order_id', merchantReference).single()
        order = data
      }
      if (!order) {
        console.warn('adyen webhook: order not found', merchantReference)
        continue
      }

      const { data: conn } = await supabase
        .from('vendor_payment_connections')
        .select('webhook_secret')
        .eq('vendor_id', order.vendor_id)
        .eq('gateway_id', 'adyen')
        .single()

      const hmacKey = (conn as any)?.webhook_secret
      if (!hmacKey) {
        console.error('adyen webhook: no hmac key for vendor', order.vendor_id)
        continue
      }

      const ok = await adyenVerifyNotification(item, hmacKey)
      if (!ok) {
        console.warn('adyen webhook: hmac mismatch for', merchantReference, i.eventCode)
        continue
      }

      // Map eventCode + success → our payment_status
      const success = i.success === true || i.success === 'true'
      let paymentStatus: string | null = null
      const code = String(i.eventCode || '').toUpperCase()
      if (code === 'AUTHORISATION') paymentStatus = success ? 'paid' : 'failed'
      else if (code === 'CAPTURE') paymentStatus = success ? 'paid' : 'failed'
      else if (code === 'REFUND') paymentStatus = success ? 'refunded' : 'failed'
      else if (code === 'REFUND_FAILED') paymentStatus = 'failed'
      else if (code === 'CANCELLATION') paymentStatus = 'cancelled'
      else if (code === 'EXPIRE') paymentStatus = 'expired'

      if (!paymentStatus) continue

      const patch: Record<string, unknown> = {}
      if (i.pspReference) patch.gateway_transaction_id = i.pspReference
      if (i.paymentMethod) patch.payment_method = i.paymentMethod
      if (paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
      if (paymentStatus === 'refunded') patch.refunded_at = new Date().toISOString()

      if (isFoodOrder) {
        const { maybeUpdateFoodOrder } = await import('../_shared/foodOrderUpdate.ts')
        await maybeUpdateFoodOrder(supabase, merchantReference, paymentStatus, i.pspReference, 'adyen')
      } else {
        const updateResult = await guardedStatusUpdate(supabase, {
          table: 'orders',
          matchColumn: 'id',
          matchValue: order.id,
          nextStatus: paymentStatus,
          patch,
        })
        if (!updateResult.updated && updateResult.reason !== 'not-found') {
          console.log(`adyen webhook: idempotent skip (${updateResult.reason}) for order ${order.id}, current: ${updateResult.currentStatus}`)
        }
      }
    }

    // Adyen requires the string "[accepted]" as the response body
    return new Response('[accepted]', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('adyen webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
