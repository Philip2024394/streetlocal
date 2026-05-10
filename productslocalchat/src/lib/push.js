/* Web Push helper for vendor inbox (Products Local Chat) */
import { supabase } from './supabase'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported() {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/products/chat/sw.js', { scope: '/products/chat/' })
    return reg
  } catch (e) {
    console.warn('[push] SW register failed', e)
    return null
  }
}

export async function getCurrentSubscription() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.ready
    return await reg.pushManager.getSubscription()
  } catch { return null }
}

export async function enableVendorPush(vendorId) {
  if (!pushSupported()) return { error: 'Browser does not support push' }
  if (!VAPID_PUBLIC) return { error: 'VAPID public key missing — set VITE_VAPID_PUBLIC_KEY' }
  if (!vendorId) return { error: 'Vendor not signed in' }

  // Permission
  let perm = Notification.permission
  if (perm !== 'granted') {
    perm = await Notification.requestPermission()
    if (perm !== 'granted') return { error: 'Permission denied' }
  }

  // SW
  let reg = await navigator.serviceWorker.getRegistration('/products/chat/')
  if (!reg) reg = await registerSW()
  if (!reg) return { error: 'Service worker not available' }
  await navigator.serviceWorker.ready

  // Subscribe (or reuse existing)
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })
    } catch (e) {
      return { error: 'Subscribe failed: ' + (e?.message || e) }
    }
  }

  // POST to Supabase
  const json = sub.toJSON()
  const endpoint = json.endpoint || sub.endpoint
  const p256dh = (json.keys && json.keys.p256dh) || ''
  const auth = (json.keys && json.keys.auth) || ''
  if (!endpoint || !p256dh || !auth) return { error: 'Bad subscription' }

  if (supabase) {
    const { error } = await supabase.from('vendor_push_subscriptions').upsert({
      vendor_id: vendorId,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
    }, { onConflict: 'endpoint' })
    if (error) return { error: error.message }
  }
  return { ok: true, endpoint }
}

export async function disableVendorPush() {
  const sub = await getCurrentSubscription()
  if (sub) {
    if (supabase) {
      try { await supabase.from('vendor_push_subscriptions').delete().eq('endpoint', sub.endpoint) } catch {}
    }
    try { await sub.unsubscribe() } catch {}
  }
  return { ok: true }
}
