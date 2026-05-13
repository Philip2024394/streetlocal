// Customer-side: mint a Snap token via food-order-create-charge then
// open Midtrans Snap. Settlement is handled server-side by the
// food-order-payment-webhook which flips food_orders.status to 'confirmed'
// and stamps auto_confirmed_at.
import { supabase } from '@/lib/supabase'

async function loadSnap(clientKey, mode) {
  if (typeof window === 'undefined') return null
  if (window.snap) return window.snap
  const src = mode === 'live'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    if (clientKey) s.setAttribute('data-client-key', clientKey)
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return window.snap || null
}

// Returns { orderId, paid, pending?, redirected? }. Throws on errors.
// Dispatches by gateway returned from the edge function:
//   - midtrans → Snap popup (or redirect fallback)
//   - stripe   → redirect to Checkout Session URL
//   - xendit   → redirect to Xendit invoice URL
export async function chargeFoodOrder({ foodOrderId, restaurantId, returnUrl, gateway }) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.functions.invoke('food-order-create-charge', {
    body: { foodOrderId, restaurantId, returnUrl: returnUrl || window.location.href, gateway },
  })
  if (error) throw new Error(error.message || 'Could not create charge')
  if (data?.error) throw new Error(data.error)

  if (data.gateway === 'midtrans') {
    const snap = await loadSnap(data.clientKey, data.mode)
    if (snap) {
      return new Promise((resolve, reject) => {
        snap.pay(data.token, {
          onSuccess: () => resolve({ orderId: data.orderId, paid: true }),
          onPending: () => resolve({ orderId: data.orderId, paid: false, pending: true }),
          onError:   (err) => reject(err),
          onClose:   () => reject(new Error('closed')),
        })
      })
    }
    // Snap JS unavailable → fall through to redirect.
  }

  if (data.redirectUrl) {
    window.location.href = data.redirectUrl
    return { orderId: data.orderId, paid: false, redirected: true, gateway: data.gateway }
  }
  throw new Error('Gateway returned neither a token nor a redirect URL')
}

// Poll a food order for ~30s to detect the webhook flipping status to confirmed.
export async function pollOrderConfirmed(foodOrderId, { tries = 10, intervalMs = 3000 } = {}) {
  if (!supabase || !foodOrderId) return null
  for (let i = 0; i < tries; i++) {
    const { data } = await supabase
      .from('food_orders')
      .select('id, status, auto_confirmed_at, payment_method, gateway_used')
      .eq('id', foodOrderId)
      .single()
    if (data?.status === 'confirmed' || data?.auto_confirmed_at) return data
    await new Promise(r => setTimeout(r, intervalMs))
  }
  return null
}
