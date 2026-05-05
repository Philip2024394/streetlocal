/**
 * notificationService.js
 * Inserts rows into the `notifications` Supabase table.
 * The `useNotifications` hook picks these up via realtime and fires
 * local browser push for online users. The service worker handles
 * true background push for offline users via Web Push API.
 */
import { supabase } from '@/lib/supabase'

async function send(toUserId, { type, title, body, fromUserId, sessionId, data }) {
  if (!supabase || !toUserId) return
  const { error } = await supabase.from('notifications').insert({
    id:           `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id:      toUserId,
    type,
    title,
    body:         body ?? null,
    from_user_id: fromUserId ?? null,
    session_id:   sessionId ?? null,
    data:         data ?? null,
    read:         false,
    created_at:   new Date().toISOString(),
  })
  if (error) console.warn('[notificationService]', error.message)
}

// ── Date invite ───────────────────────────────────────────────────────────────

export function notifyDateInvite(toUserId, { fromName, ideaTitle, fromUserId }) {
  return send(toUserId, {
    type:       'date_invite',
    title:      `💕 Date invite from ${fromName}`,
    body:       `${fromName} wants to take you on a date: ${ideaTitle}. Tap to view and accept.`,
    fromUserId,
    data:       { action: 'open_chat' },
  })
}

export function notifyDateAccepted(toUserId, { fromName, ideaTitle, fromUserId }) {
  return send(toUserId, {
    type:       'date_accepted',
    title:      `🎉 ${fromName} accepted your date invite!`,
    body:       `${ideaTitle} is on! Chat is open — start planning.`,
    fromUserId,
    data:       { action: 'open_chat' },
  })
}

// ── Social / meet ─────────────────────────────────────────────────────────────

export function notifyWave(toUserId, { fromName, fromUserId, sessionId }) {
  return send(toUserId, {
    type:       'wave',
    title:      `👋 ${fromName} wants to meet!`,
    body:       `${fromName} sent you a wave — they're out now. Tap to view their profile.`,
    fromUserId,
    sessionId,
    data:       { action: 'open_discovery' },
  })
}

export function notifyLiked(toUserId, { fromName, fromUserId }) {
  return send(toUserId, {
    type:       'like',
    title:      `💚 ${fromName} liked your profile`,
    body:       `${fromName} is out now and liked you — check them out!`,
    fromUserId,
    data:       { action: 'open_discovery' },
  })
}

// ── Chat / messages ───────────────────────────────────────────────────────────

export function notifyNewMessage(toUserId, { fromName, preview, fromUserId, convId }) {
  return send(toUserId, {
    type:       'message',
    title:      `💬 ${fromName}`,
    body:       preview,
    fromUserId,
    data:       { action: 'open_chat', convId },
  })
}

// ── Ride ──────────────────────────────────────────────────────────────────────

export function notifyRideRequest(toUserId, { passengerName, pickup, fromUserId, bookingId }) {
  return send(toUserId, {
    type:       'ride',
    title:      `🏍️ New ride request`,
    body:       `${passengerName} needs a ride from ${pickup}. You have 60 seconds to accept.`,
    fromUserId,
    data:       { action: 'open_ride', bookingId },
  })
}

export function notifyRideAccepted(toUserId, { driverName, eta, fromUserId, bookingId }) {
  return send(toUserId, {
    type:       'ride_accepted',
    title:      `🏍️ Driver on the way!`,
    body:       `${driverName} accepted your ride request. ETA: ${eta ?? 'a few minutes'}.`,
    fromUserId,
    data:       { action: 'open_ride', bookingId },
  })
}

export function notifyRideExpired(toUserId, { bookingId }) {
  return send(toUserId, {
    type:       'ride',
    title:      `⏱️ No drivers available right now`,
    body:       `Your ride request timed out. Try again or choose a different driver.`,
    fromUserId: null,
    data:       { action: 'open_ride', bookingId },
  })
}

// ── Gift orders ───────────────────────────────────────────────────────────────

/** Tell the seller they have an anonymous gift order. Buyer identity is NOT included. */
export function notifyGiftToSeller(toUserId, { productName, orderId, fromUserId }) {
  return send(toUserId, {
    type:       'gift_order',
    title:      `🎁 New anonymous gift order!`,
    body:       `Someone sent "${productName}" as an anonymous gift. Open your orders to confirm and prepare.`,
    fromUserId, // stored for internal reference, not shown to seller
    data:       { action: 'open_gift_orders', orderId },
  })
}

/** Tell the recipient a gift is on its way. Sender identity is NOT included. */
export function notifyGiftToRecipient(toUserId, { sellerName, productName, orderId, fromUserId }) {
  return send(toUserId, {
    type:       'gift_received',
    title:      `🎁 You have an anonymous gift!`,
    body:       `Someone sent you "${productName}" from ${sellerName}. Set your delivery address to receive it.`,
    fromUserId, // stored for internal reference, not shown to recipient
    data:       { action: 'open_gift_address', orderId },
  })
}

/** Tell recipient they have a gift waiting but need to set their delivery address first. */
export function notifyGiftAddressRequired(toUserId, { sellerName, fromUserId, orderId }) {
  return send(toUserId, {
    type:       'gift_address_required',
    title:      `🎁 You have a surprise gift waiting!`,
    body:       `Someone sent you an anonymous gift from ${sellerName}. Add your delivery address in Settings → Gift Delivery Address to receive it.`,
    fromUserId,
    data:       { action: 'open_gift_address', orderId },
  })
}

/** Tell buyer their gift order status changed. */
export function notifyGiftStatusUpdate(toUserId, { status, productName, orderId }) {
  const msgs = {
    seller_acknowledged: { title: '✅ Gift acknowledged!',       body: `The seller confirmed your gift of "${productName}" and is preparing it.` },
    preparing:           { title: '📦 Gift being prepared',      body: `Your gift of "${productName}" is being packed up.` },
    out_for_delivery:    { title: '🏍️ Gift is on its way!',      body: `Your anonymous gift of "${productName}" is out for delivery!` },
    delivered:           { title: '🎉 Gift delivered!',          body: `Your anonymous gift of "${productName}" has been delivered.` },
    cancelled:           { title: '❌ Gift order cancelled',     body: `The gift order for "${productName}" was cancelled.` },
  }
  const msg = msgs[status]
  if (!msg) return Promise.resolve()
  return send(toUserId, {
    type:       'gift_update',
    title:      msg.title,
    body:       msg.body,
    fromUserId: null,
    data:       { action: 'open_gift_orders', orderId },
  })
}

// ── Massage ──────────────────────────────────────────────────────────────────

export function notifyMassageBooking(toUserId, { customerName, serviceType, duration, fromUserId, bookingId }) {
  return send(toUserId, {
    type:       'massage_booking',
    title:      `New booking request`,
    body:       `${customerName} requested a ${duration}min ${serviceType} session. Tap to accept or decline.`,
    fromUserId,
    data:       { action: 'open_massage', bookingId },
  })
}

export function notifyMassageConfirmed(toUserId, { therapistName, serviceType, duration, fromUserId, bookingId }) {
  return send(toUserId, {
    type:       'massage_confirmed',
    title:      `Booking confirmed!`,
    body:       `${therapistName} confirmed your ${duration}min ${serviceType} session. They're on their way.`,
    fromUserId,
    data:       { action: 'open_massage', bookingId },
  })
}

export function notifyMassageCommissionDue(toUserId, { amount, dueIn }) {
  return send(toUserId, {
    type:       'massage_commission',
    title:      `Commission payment due`,
    body:       `Your commission of Rp ${Number(amount).toLocaleString('id-ID')} is due in ${dueIn}. Submit payment proof to avoid account restrictions.`,
    data:       { action: 'open_massage_commission' },
  })
}

export function notifyMassageCommissionOverdue(toUserId, { amount }) {
  return send(toUserId, {
    type:       'massage_commission_overdue',
    title:      `Commission overdue — action required`,
    body:       `Your commission of Rp ${Number(amount).toLocaleString('id-ID')} is overdue. Your account may be restricted until payment is received.`,
    data:       { action: 'open_massage_commission' },
  })
}

export function notifyMassageProfileDeactivated(toUserId, { reason }) {
  return send(toUserId, {
    type:       'massage_deactivated',
    title:      `Profile deactivated`,
    body:       reason || 'Your massage therapist profile has been deactivated by admin. Contact support for details.',
    data:       { action: 'open_massage' },
  })
}

export function notifyMassageProfileReactivated(toUserId) {
  return send(toUserId, {
    type:       'massage_reactivated',
    title:      `Profile reactivated`,
    body:       'Your massage therapist profile is active again. You can now receive new booking requests.',
    data:       { action: 'open_massage' },
  })
}

export function notifyMassageAdmin(toUserId, { title, body }) {
  return send(toUserId, {
    type:       'massage_admin',
    title:      title || 'Admin Notice',
    body:       body || '',
    data:       { action: 'open_massage' },
  })
}

// ── Commission / marketplace ─────────────────────────────────────────────────

const INDOO_NOTIF_KEY = 'indoo_notifications'
const COMMISSION_SPAM_KEY = 'indoo_commission_spam'

function fmtAmount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'jt'
  return Number(n ?? 0).toLocaleString('id-ID')
}

/**
 * Anti-spam gate — returns true if the notification should be SKIPPED.
 * Rules:
 *  1. Same type to same user in last 24h → skip
 *  2. Current hour 21:00–06:59 → skip (office hours only)
 *  3. Max 4 commission notifications per seller per week → skip
 */
function shouldSkipCommissionNotif(userId, type) {
  try {
    const now = new Date()
    const hour = now.getHours()
    if (hour >= 21 || hour < 7) return true

    const store = JSON.parse(localStorage.getItem(COMMISSION_SPAM_KEY) || '{}')
    const key = `${userId}_${type}`
    const userWeekKey = `${userId}__week`

    // Same type within 24h
    if (store[key] && (now.getTime() - store[key]) < 24 * 3600000) return true

    // Max 4 per week
    const weekEntries = store[userWeekKey] || []
    const oneWeekAgo = now.getTime() - 7 * 24 * 3600000
    const recent = weekEntries.filter(ts => ts > oneWeekAgo)
    if (recent.length >= 4) return true

    // Record this send
    store[key] = now.getTime()
    store[userWeekKey] = [...recent, now.getTime()]
    localStorage.setItem(COMMISSION_SPAM_KEY, JSON.stringify(store))
  } catch { /* localStorage unavailable — allow send */ }
  return false
}

function saveLocalNotification(userId, notif) {
  try {
    const all = JSON.parse(localStorage.getItem(INDOO_NOTIF_KEY) || '[]')
    all.unshift({ ...notif, user_id: userId })
    // keep last 200
    if (all.length > 200) all.length = 200
    localStorage.setItem(INDOO_NOTIF_KEY, JSON.stringify(all))
  } catch {}
}

/** Notify seller when commission is added from a completed order */
export async function notifyCommissionAdded(userId, orderRef, commissionAmount, totalOwed) {
  if (shouldSkipCommissionNotif(userId, 'commission_added')) return
  const notif = {
    id: `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'commission_added',
    title: 'Commission added',
    body: `Order ${orderRef} completed. 10% commission (Rp ${fmtAmount(commissionAmount)}) added. Total owed: Rp ${fmtAmount(totalOwed)}`,
    read: false,
    created_at: new Date().toISOString(),
  }
  saveLocalNotification(userId, notif)
  return send(userId, { type: notif.type, title: notif.title, body: notif.body, data: { action: 'open_wallet' } })
}

/** Notify seller 48h before commission due date */
export async function notifyCommissionDueSoon(userId, amount, dueDate) {
  if (shouldSkipCommissionNotif(userId, 'commission_due_soon')) return
  const notif = {
    id: `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'commission_due_soon',
    title: 'Commission payment due soon',
    body: `Commission payment of Rp ${fmtAmount(amount)} due in 48 hours. Tap to pay.`,
    read: false,
    created_at: new Date().toISOString(),
  }
  saveLocalNotification(userId, notif)
  return send(userId, { type: notif.type, title: notif.title, body: notif.body, data: { action: 'open_wallet', dueDate } })
}

/** Notify seller when commission is overdue (72h passed) */
export async function notifyCommissionOverdue(userId, amount) {
  if (shouldSkipCommissionNotif(userId, 'commission_overdue')) return
  const notif = {
    id: `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'commission_overdue',
    title: 'Commission overdue',
    body: `Commission overdue. Pay Rp ${fmtAmount(amount)} to avoid account restrictions.`,
    read: false,
    created_at: new Date().toISOString(),
  }
  saveLocalNotification(userId, notif)
  return send(userId, { type: notif.type, title: notif.title, body: notif.body, data: { action: 'open_wallet' } })
}

/** Notify seller when account is capped */
export async function notifyAccountCapped(userId, amount, debtLimit) {
  if (shouldSkipCommissionNotif(userId, 'account_capped')) return
  const toPay = amount - debtLimit + 1 // minimum to get below limit
  const notif = {
    id: `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'account_capped',
    title: 'Account capped',
    body: `Your account is capped at Rp ${fmtAmount(debtLimit)}. Pay Rp ${fmtAmount(toPay > 0 ? toPay : amount)} to resume receiving orders.`,
    read: false,
    created_at: new Date().toISOString(),
  }
  saveLocalNotification(userId, notif)
  return send(userId, { type: notif.type, title: notif.title, body: notif.body, data: { action: 'open_wallet' } })
}

/** Notify seller when payment confirmed */
export async function notifyCommissionPaid(userId, amount) {
  if (shouldSkipCommissionNotif(userId, 'commission_paid')) return
  const notif = {
    id: `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'commission_paid',
    title: 'Payment confirmed',
    body: `Payment of Rp ${fmtAmount(amount)} confirmed. Your account is active.`,
    read: false,
    created_at: new Date().toISOString(),
  }
  saveLocalNotification(userId, notif)
  return send(userId, { type: notif.type, title: notif.title, body: notif.body, data: { action: 'open_wallet' } })
}

// ── Date suggestions (admin) ──────────────────────────────────────────────────

export function notifyDateSuggestionAccepted(toUserId, { ideaTitle }) {
  return send(toUserId, {
    type:       'system',
    title:      `💡 Your date idea was accepted!`,
    body:       `"${ideaTitle}" is now live in the Date Ideas section. Start inviting!`,
    data:       { action: 'open_dating' },
  })
}
