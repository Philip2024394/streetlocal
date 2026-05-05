import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? null

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  )

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return 'denied'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  /**
   * Register a Web Push subscription and save the endpoint + keys to Supabase.
   * Requires VITE_VAPID_PUBLIC_KEY in .env.local and a server-side Web Push sender.
   * Safe no-op if VAPID key is missing or service worker is not supported.
   */
  const registerPushSubscription = async (userId) => {
    if (!VAPID_KEY || !userId || !supabase) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        })
      }
      // Save / upsert subscription to Supabase
      const endpoint = sub.endpoint
      const p256dh   = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh'))))
      const auth     = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))))
      await supabase.from('push_subscriptions').upsert({
        user_id:    userId,
        endpoint,
        p256dh,
        auth,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' })
    } catch (e) {
      console.warn('[usePushNotifications] subscription failed:', e.message)
    }
  }

  /**
   * Show a local notification immediately (in-app / foreground trigger).
   * Falls back gracefully if permission not granted.
   */
  const notify = (title, options = {}) => {
    if (permission !== 'granted') return
    navigator.serviceWorker.ready
      .then(reg => {
        reg.showNotification(title, {
          icon:     'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
          badge:    'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png',
          vibrate:  [200, 100, 200],
          ...options,
        })
      })
      .catch(() => {
        try { new Notification(title, options) } catch (_) {}
      })
  }

  // Schedule Friday 6pm digest via background sync
  const scheduleFridayDigest = () => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return
    navigator.serviceWorker.ready.then(reg => {
      reg.sync.register('weekly-digest').catch(() => {})
    })
  }

  return { permission, requestPermission, registerPushSubscription, notify, scheduleFridayDigest }
}
