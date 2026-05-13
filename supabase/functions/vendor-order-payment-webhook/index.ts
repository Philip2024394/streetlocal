// vendor-order-payment-webhook — Midtrans webhook for vendor_orders rows.
// Signed with each vendor's own Midtrans server_key (from
// vendor_payment_connections). Flips vendor_orders.payment_status to 'paid'
// on settlement, stamps payment_confirmed_at, fires customer WhatsApp.
//
// Order-id format: VND-<vendor_id>-<order_id>-<ts>
//
// Deploy: `supabase functions deploy vendor-order-payment-webhook --no-verify-jwt`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha512hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const event = await req.json()
    const orderId = event?.order_id
    if (!orderId) return new Response('no order id', { status: 200, headers: corsHeaders })
    if (!String(orderId).startsWith('VND-')) {
      return new Response('not a vendor order', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order } = await supabase
      .from('vendor_orders')
      .select('id, vendor_id, payment_status, total, customer_phone')
      .eq('gateway_order_id', orderId).single()
    if (!order) return new Response('order not found', { status: 200, headers: corsHeaders })

    // Verify signature using the vendor's own Midtrans server key.
    const { data: conn } = await supabase
      .from('vendor_payment_connections')
      .select('server_key')
      .eq('vendor_id', order.vendor_id)
      .eq('gateway_id', 'midtrans')
      .eq('is_active', true).single()
    if (!conn?.server_key) {
      console.warn('vendor webhook: vendor midtrans not configured', order.vendor_id)
      return new Response('vendor gateway missing', { status: 401, headers: corsHeaders })
    }

    const sigInput = `${orderId}${event.status_code}${event.gross_amount}${conn.server_key}`
    const expected = await sha512hex(sigInput)
    if (event.signature_key && event.signature_key.toLowerCase() !== expected.toLowerCase()) {
      return new Response('invalid signature', { status: 401, headers: corsHeaders })
    }

    const txStatus = String(event.transaction_status || '').toLowerCase()
    const fraud = String(event.fraud_status || '').toLowerCase()
    let nextPayment: string | null = null
    let nextStatus: string | null = null
    let paid = false
    if ((txStatus === 'capture' && fraud === 'accept') || txStatus === 'settlement') {
      nextPayment = 'paid'; nextStatus = 'confirmed'; paid = true
    } else if (txStatus === 'pending') {
      nextPayment = 'pending'
    } else if (['cancel', 'expire', 'deny', 'failure'].includes(txStatus)) {
      nextPayment = 'failed'; nextStatus = 'cancelled'
    }
    if (!nextPayment) return new Response('event ignored', { status: 200, headers: corsHeaders })

    const patch: Record<string, unknown> = {
      payment_status: nextPayment,
      payment_intent_id: event.transaction_id,
      gateway_used: 'midtrans',
      payment_method: event.payment_type || 'card',
      updated_at: new Date().toISOString(),
    }
    if (nextStatus) patch.status = nextStatus
    if (paid) {
      patch.payment_confirmed_at = new Date().toISOString()
      patch.auto_confirmed_at = new Date().toISOString()
    }
    await supabase.from('vendor_orders').update(patch).eq('id', order.id)

    if (paid) {
      try {
        if (order.customer_phone) {
          await supabase.functions.invoke('send-customer-whatsapp', {
            body: { restaurant_id: null, vendor_id: order.vendor_id, customer_phone: order.customer_phone, event: 'order_confirmed', payload: { order_id: String(order.id).slice(-6), total: order.total } },
          })
        }
      } catch (e) { console.warn('whatsapp notify failed', e) }
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('vendor-order-payment-webhook error', e)
    return new Response('server error', { status: 500, headers: corsHeaders })
  }
})
