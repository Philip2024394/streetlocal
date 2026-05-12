/**
 * paymentService.js — Midtrans Snap integration for Indonesia.
 *
 * Flow:
 *   1. Frontend calls createSnapToken(payload) → hits our Supabase Edge Function
 *   2. Edge Function calls Midtrans API server-side (server key never exposed)
 *   3. Returns a snap_token
 *   4. Frontend calls window.snap.pay(snapToken, callbacks)
 *   5. On success Midtrans POSTs webhook → Supabase Edge Function /midtrans-webhook
 *
 * Supported methods (all via Midtrans Snap): Credit card, BCA/Mandiri/BRI virtual
 * account, QRIS, GoPay, OVO, ShopeePay, Alfamart, Indomaret.
 *
 * Env required:
 *   VITE_MIDTRANS_CLIENT_KEY  — public client key (pk-...)
 *   VITE_SUPABASE_URL         — already set
 */

import { supabase } from '@/lib/supabase'

const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? ''
const IS_PRODUCTION = import.meta.env.PROD

/** Lazily inject the Midtrans Snap JS once */
let snapLoaded = false
function loadSnapScript() {
  if (snapLoaded || !MIDTRANS_CLIENT_KEY) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = IS_PRODUCTION
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    s.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY)
    s.onload = () => { snapLoaded = true; resolve() }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

/**
 * Request a Snap token from our Supabase Edge Function.
 * The Edge Function holds the Midtrans SERVER key — never exposed to browser.
 */
async function createSnapToken({ orderId, grossAmount, itemDetails, customerDetails }) {
  const { data, error } = await supabase.functions.invoke('midtrans-create-token', {
    body: { orderId, grossAmount, itemDetails, customerDetails },
  })
  if (error) throw new Error(error.message)
  return data.snapToken
}

/**
 * Open Midtrans Snap popup.
 *
 * @param {object} payload
 *   orderId        — unique order ID (e.g. gift_orders.id)
 *   grossAmount    — total in IDR (integer, e.g. 45000)
 *   itemDetails    — [{ id, price, quantity, name }]
 *   customerDetails — { firstName, email?, phone? }
 * @returns Promise<{ status: 'success'|'pending'|'error', result }>
 */
export function openMidtransPayment(payload) {
  return new Promise(async (resolve, reject) => {
    // Demo / no key — simulate success immediately
    if (!MIDTRANS_CLIENT_KEY || !supabase) {
      await new Promise(r => setTimeout(r, 900))
      resolve({ status: 'success', result: { order_id: payload.orderId, demo: true } })
      return
    }

    try {
      await loadSnapScript()
      const snapToken = await createSnapToken(payload)
      window.snap.pay(snapToken, {
        onSuccess:  (result) => resolve({ status: 'success',  result }),
        onPending:  (result) => resolve({ status: 'pending',  result }),
        onError:    (result) => resolve({ status: 'error',    result }),
        onClose:    ()       => resolve({ status: 'closed',   result: null }),
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Venue / profile unlock payment — kept for backward compat.
 * Now uses Midtrans instead of Stripe.
 */
export async function unlockVenuePayment(otwRequestId, sessionId) {
  const res = await openMidtransPayment({
    orderId:        `unlock-${sessionId}-${Date.now()}`,
    grossAmount:    39000,   // Rp 39,000 (~$2.50)
    itemDetails:    [{ id: 'venue_unlock', price: 39000, quantity: 1, name: 'Profile Location Unlock' }],
    customerDetails: { firstName: 'User' },
  })

  if (res.status === 'success' || res.status === 'pending') {
    window.dispatchEvent(new CustomEvent('demo:payment-success', {
      detail: { sessionId, otwRequestId }
    }))
  }
}

/**
 * Gift / food order payment via Midtrans Snap.
 *
 * @param {object} order  — { id, productName, totalAmount, buyerName, buyerPhone }
 * @returns Promise<{ status }>
 */
export async function payGiftOrder(order) {
  return openMidtransPayment({
    orderId:        order.id,
    grossAmount:    order.totalAmount,
    itemDetails:    [{ id: order.productId ?? 'gift', price: order.totalAmount, quantity: 1, name: order.productName }],
    customerDetails: { firstName: order.buyerName ?? 'Buyer', phone: order.buyerPhone },
  })
}
