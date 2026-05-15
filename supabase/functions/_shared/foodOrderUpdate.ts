// Shared helper for the 13 gateway webhook functions to ALSO update the
// foodlocal-pro food_orders table when an order_id has the FOO- prefix.
// Existing webhooks already update the food-basic `orders` table; this
// helper is ADDITIVE — it only writes to food_orders, never touches orders.
//
// Now idempotent: uses guardedStatusUpdate so duplicate webhook deliveries
// (standard gateway behaviour) don't double-decrement stock or downgrade
// a terminal status. Closes audit finding #1 (duplicate webhook processing).
//
// Usage at the bottom of each webhook handler, right after the orders update:
//
//   import { maybeUpdateFoodOrder } from '../_shared/foodOrderUpdate.ts'
//   await maybeUpdateFoodOrder(supabase, orderId, paymentStatus, transactionId, 'paypal')
//
// `paymentStatus` follows the existing webhook vocabulary: 'paid' | 'pending'
// | 'failed' | 'cancelled' | 'refunded'.

import { guardedStatusUpdate } from './paymentSecurity.ts'

export async function maybeUpdateFoodOrder(
  supabase: any,
  gatewayOrderId: string,
  paymentStatus: string,
  transactionId: string | undefined,
  gatewayId: string,
): Promise<{ updated: boolean, reason?: string }> {
  if (!gatewayOrderId || !String(gatewayOrderId).startsWith('FOO-')) {
    return { updated: false, reason: 'not-food-order' }
  }
  const { data: foodOrder } = await supabase
    .from('food_orders')
    .select('id, restaurant_id, customer_phone, total, status')
    .eq('gateway_order_id', gatewayOrderId)
    .single()
  if (!foodOrder) return { updated: false, reason: 'order-not-found' }

  let nextStatus: string | null = null
  if (paymentStatus === 'paid') nextStatus = 'confirmed'
  else if (paymentStatus === 'pending') nextStatus = 'payment_submitted'
  else if (paymentStatus === 'cancelled' || paymentStatus === 'failed') nextStatus = 'cancelled'
  else if (paymentStatus === 'refunded') nextStatus = 'refunded'
  if (!nextStatus) return { updated: false, reason: 'unknown-payment-status' }

  const patch: Record<string, unknown> = {
    payment_intent_id: transactionId || null,
    gateway_used: gatewayId,
    updated_at: new Date().toISOString(),
  }
  if (nextStatus === 'confirmed') {
    patch.auto_confirmed_at = new Date().toISOString()
    patch.payment_confirmed_at = new Date().toISOString()
    patch.payment_method = gatewayId
  }
  if (nextStatus === 'cancelled') {
    patch.cancel_reason = `${gatewayId} ${paymentStatus}`
  }

  // Idempotent update — won't flip a terminal status backwards, won't
  // double-process duplicate webhook deliveries, race-safe via status
  // guard in the UPDATE WHERE clause.
  const result = await guardedStatusUpdate(supabase, {
    table: 'food_orders',
    matchColumn: 'id',
    matchValue: foodOrder.id,
    nextStatus,
    statusColumn: 'status',
    patch,
  })

  if (!result.updated) {
    // Already in this status, terminal lock, or race — none of these
    // are errors, but we shouldn't double-fire notifications either.
    return { updated: false, reason: result.reason }
  }

  if (nextStatus === 'confirmed') {
    // Best-effort vendor push + customer WhatsApp. Only fires on the
    // FIRST 'confirmed' transition (the guard above ensures this).
    try {
      await supabase.functions.invoke('send-vendor-push', {
        body: { restaurant_id: foodOrder.restaurant_id, title: 'New order confirmed', body: `Order #${foodOrder.id} paid (${gatewayId})`, order_id: foodOrder.id },
      })
    } catch {}
    try {
      if (foodOrder.customer_phone) {
        await supabase.functions.invoke('send-customer-whatsapp', {
          body: { restaurant_id: foodOrder.restaurant_id, customer_phone: foodOrder.customer_phone, event: 'order_confirmed', payload: { order_id: foodOrder.id, total: foodOrder.total } },
        })
      }
    } catch {}
  }
  return { updated: true }
}
