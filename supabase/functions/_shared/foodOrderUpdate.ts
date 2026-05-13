// Shared helper for the 13 gateway webhook functions to ALSO update the
// foodlocal-pro food_orders table when an order_id has the FOO- prefix.
// Existing webhooks already update the food-basic `orders` table; this
// helper is ADDITIVE — it only writes to food_orders, never touches orders.
//
// Usage at the bottom of each webhook handler, right after the orders update:
//
//   import { maybeUpdateFoodOrder } from '../_shared/foodOrderUpdate.ts'
//   await maybeUpdateFoodOrder(supabase, orderId, paymentStatus, transactionId, 'paypal')
//
// `paymentStatus` follows the existing webhook vocabulary: 'paid' | 'pending'
// | 'failed' | 'cancelled' | 'refunded'.

export async function maybeUpdateFoodOrder(
  supabase: any,
  gatewayOrderId: string,
  paymentStatus: string,
  transactionId: string | undefined,
  gatewayId: string,
): Promise<void> {
  if (!gatewayOrderId || !String(gatewayOrderId).startsWith('FOO-')) return
  const { data: foodOrder } = await supabase
    .from('food_orders')
    .select('id, restaurant_id, customer_phone, total')
    .eq('gateway_order_id', gatewayOrderId)
    .single()
  if (!foodOrder) return

  let nextStatus: string | null = null
  if (paymentStatus === 'paid') nextStatus = 'confirmed'
  else if (paymentStatus === 'pending') nextStatus = 'payment_submitted'
  else if (paymentStatus === 'cancelled' || paymentStatus === 'failed') nextStatus = 'cancelled'
  // 'refunded' is handled by the refunds console flow, not via webhook here.
  if (!nextStatus) return

  const patch: Record<string, unknown> = {
    status: nextStatus,
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
  await supabase.from('food_orders').update(patch).eq('id', foodOrder.id)

  if (nextStatus === 'confirmed') {
    // Best-effort vendor push + customer WhatsApp.
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
}
