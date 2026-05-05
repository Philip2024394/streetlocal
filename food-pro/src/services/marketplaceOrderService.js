import { supabase } from '@/lib/supabase'
import { recordCommission } from './commissionService'
import { processCommission } from './walletService'

// ── Create order (buyer side) ───────────────────────────────────────────────
export async function createOrder({ buyerId, sellerId, items, subtotal, deliveryFee, total, paymentMethod, paymentProofUrl, deliveryAddress, notes }) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        items,
        subtotal,
        delivery_fee: deliveryFee ?? 0,
        total,
        status: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
        payment_method: paymentMethod,
        payment_proof_url: paymentProofUrl ?? null,
        delivery_address: deliveryAddress,
        notes: notes ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  } catch (e) {
    console.warn('[orderService] createOrder failed', e)
    return null
  }
}

// ── Fetch buyer's orders ────────────────────────────────────────────────────
export async function fetchBuyerOrders(buyerId) {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*, seller:seller_id ( display_name, brand_name, avatar_url )')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// ── Fetch seller's orders ───────────────────────────────────────────────────
export async function fetchSellerOrders(sellerId) {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*, buyer:buyer_id ( display_name, avatar_url, phone )')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// ── Update order status (seller side) ───────────────────────────────────────
export async function updateMarketplaceOrderStatus(orderId, status, extras = {}) {
  if (!supabase) return false
  try {
    const payload = { status }
    if (status === 'confirmed') payload.confirmed_at = new Date().toISOString()
    if (status === 'shipped') {
      payload.shipped_at = new Date().toISOString()
      if (extras.carrierName) payload.carrier_name = extras.carrierName
      if (extras.trackingNo) payload.tracking_no = extras.trackingNo
    }
    if (status === 'delivered') payload.delivered_at = new Date().toISOString()
    if (status === 'cancelled') payload.cancelled_at = new Date().toISOString()

    const { error } = await supabase
      .from('marketplace_orders')
      .update(payload)
      .eq('id', orderId)
    if (error) throw error

    // Record commission when order delivered — new wallet system (10%)
    if (status === 'delivered' && extras.sellerId && extras.orderTotal) {
      processCommission(extras.sellerId, 'marketplace', orderId, extras.orderTotal)
      // Legacy fallback
      await recordCommission(extras.sellerId, orderId, extras.orderTotal, 'marketplace')
    }

    return true
  } catch (e) {
    console.warn('[orderService] updateStatus failed', e)
    return false
  }
}

// ── Notify seller about new order ───────────────────────────────────────────
export async function notifySeller(sellerId, order) {
  if (!supabase) return
  try {
    const firstItem = order.items?.[0]
    const itemCount = order.items?.length ?? 1
    await supabase.from('notifications').insert({
      user_id: sellerId,
      type: 'market_order',
      title: 'New Order Received!',
      body: `${firstItem?.name ?? 'Item'}${itemCount > 1 ? ` +${itemCount - 1} more` : ''} — ${fmtRp(order.total)}`,
      read: false,
    })
  } catch { /* noop */ }
}

// ── Notify buyer about status change ────────────────────────────────────────
export async function notifyBuyer(buyerId, orderId, status, sellerName) {
  if (!supabase) return
  const messages = {
    confirmed: `Your order from ${sellerName} has been confirmed!`,
    shipped: `Your order from ${sellerName} has been shipped!`,
    delivered: `Your order from ${sellerName} has been delivered!`,
    cancelled: `Your order from ${sellerName} was cancelled.`,
  }
  try {
    await supabase.from('notifications').insert({
      user_id: buyerId,
      type: 'market_order',
      title: status === 'shipped' ? 'Order Shipped!' : status === 'delivered' ? 'Order Delivered!' : 'Order Update',
      body: messages[status] ?? `Order status: ${status}`,
      read: false,
    })
  } catch { /* noop */ }
}

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }
