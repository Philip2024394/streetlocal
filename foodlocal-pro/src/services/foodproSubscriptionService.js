// FoodLocal Pro subscription helpers. Calls the foodpro-subscription-checkout
// edge function which mints a Midtrans Snap token using StreetLocal's central
// Midtrans account. On settlement the foodpro-subscription-webhook flips
// restaurants.url_active to true so the restaurant goes live.
import { supabase } from '@/lib/supabase'

export const FOODPRO_PRICES = {
  whatsapp: 100000,
  chat:     150000,
}

export const FOODPRO_TIERS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp Orders',
    price: 100000,
    tagline: 'Orders flow to your WhatsApp — perfect to start fast.',
    features: [
      'Customer orders sent straight to your WhatsApp',
      'No app chat — vendors reply on their phone',
      'Menu, deals, banner ads, extras, analytics',
      'Connect your own payment gateway (you keep 100%)',
      '30 days — auto-live the moment payment settles',
    ],
  },
  {
    id: 'chat',
    label: 'In-App Chat Orders',
    price: 150000,
    tagline: 'Full chat experience — keeps customers inside your branded shop.',
    features: [
      'In-app chat orders — no jumping to WhatsApp',
      'Driver tracking + QR pickup verification',
      'Everything in the WhatsApp tier',
      'Priority placement in directory',
      '30 days — auto-live the moment payment settles',
    ],
  },
]

// Opens Midtrans Snap (popup) or redirects, depending on Snap library
// availability. Snap JS is loaded only when the vendor commits to pay.
async function loadSnapJs(clientKey) {
  if (typeof window === 'undefined') return null
  if (window.snap) return window.snap
  const isProd = import.meta.env.VITE_MIDTRANS_MODE === 'production'
  const src = isProd
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

// Returns { orderId, amount } once Snap closes. Throws on user cancel or
// API error so the caller can show a toast.
export async function startFoodproCheckout({ restaurantId, planTier, returnUrl }) {
  if (!supabase) throw new Error('Supabase not configured')
  if (!FOODPRO_PRICES[planTier]) throw new Error('Unknown plan tier: ' + planTier)

  const { data, error } = await supabase.functions.invoke('foodpro-subscription-checkout', {
    body: { restaurantId, planTier, returnUrl: returnUrl || window.location.href },
  })
  if (error) throw new Error(error.message || 'Checkout failed')
  if (!data?.token) throw new Error(data?.error || 'No Snap token returned')

  const clientKey = import.meta.env.VITE_MIDTRANS_SUBSCRIPTION_CLIENT_KEY
  const snap = await loadSnapJs(clientKey)
  if (snap) {
    return new Promise((resolve, reject) => {
      snap.pay(data.token, {
        onSuccess: () => resolve({ orderId: data.orderId, amount: data.amount }),
        onPending: () => resolve({ orderId: data.orderId, amount: data.amount, pending: true }),
        onError:   (err) => reject(err),
        onClose:   () => reject(new Error('closed')),
      })
    })
  }
  // Fallback: redirect to the Snap hosted page.
  window.location.href = data.redirectUrl
  return { orderId: data.orderId, amount: data.amount, redirected: true }
}

// Polls the restaurants row up to ~30s for url_active=true. Used on
// ?subscription=ok return so the UI can flip to "Live" without a refresh.
export async function pollSubscriptionLive(restaurantId, { tries = 10, intervalMs = 3000 } = {}) {
  if (!supabase || !restaurantId) return null
  for (let i = 0; i < tries; i++) {
    const { data } = await supabase
      .from('restaurants')
      .select('id, url_active, expires_at, subscription_tier, subscription_product')
      .eq('id', restaurantId)
      .single()
    if (data?.url_active) return data
    await new Promise(r => setTimeout(r, intervalMs))
  }
  return null
}
