/**
 * driverNotificationService.js
 * Handles sound, vibration, and browser notifications for driver apps.
 * Works even when the phone is locked (via Notification API + persistent audio).
 */

let audioCtx = null

function getAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Play a single beep tone using Web Audio API.
 * @param {AudioContext} ctx
 * @param {number} startTime - when to start (in ctx.currentTime units)
 * @param {number} duration - beep length in seconds
 * @param {number} frequency - tone frequency in Hz
 */
function scheduleBeep(ctx, startTime, duration, frequency) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(1, startTime)
  gain.gain.setValueAtTime(0, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/**
 * Play a loud 3-beep alert pattern using Web Audio API.
 * Falls back to a base64 data URI beep via <audio> if Web Audio fails.
 */
export function playOrderAlert() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    // 3 beeps: 200ms on, 150ms gap between them, at 880 Hz
    scheduleBeep(ctx, now, 0.2, 880)
    scheduleBeep(ctx, now + 0.35, 0.2, 880)
    scheduleBeep(ctx, now + 0.7, 0.2, 880)
  } catch (_e) {
    // Fallback: generate a short WAV beep as a data URI
    try {
      const sampleRate = 8000
      const duration = 0.15
      const freq = 880
      const samples = sampleRate * duration
      const buffer = new ArrayBuffer(44 + samples * 2)
      const view = new DataView(buffer)
      // WAV header
      const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)) }
      writeStr(0, 'RIFF')
      view.setUint32(4, 36 + samples * 2, true)
      writeStr(8, 'WAVE')
      writeStr(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeStr(36, 'data')
      view.setUint32(40, samples * 2, true)
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate
        const val = Math.sin(2 * Math.PI * freq * t) * 32767
        view.setInt16(44 + i * 2, val, true)
      }
      const blob = new Blob([buffer], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const playBeep = () => {
        const a = new Audio(url)
        a.volume = 1
        return a.play().catch(() => {})
      }
      playBeep()
      setTimeout(playBeep, 350)
      setTimeout(playBeep, 700)
    } catch (_e2) {
      // Silently fail — vibration and notification still fire
    }
  }
}

/**
 * Vibrate the phone with a long repeating pattern.
 */
export function vibrateAlert() {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 200, 100, 200])
  }
}

/**
 * Request notification permission from the user.
 * @returns {Promise<boolean>} true if permission was granted
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch (_e) {
    return false
  }
}

/**
 * Check current notification permission state.
 * @returns {boolean}
 */
export function hasNotificationPermission() {
  if (!('Notification' in window)) return false
  return Notification.permission === 'granted'
}

/**
 * Show a browser notification. Works in background / lock screen on supported devices.
 * @param {string} title
 * @param {string} body
 * @param {string} [icon]
 */
export function showOrderNotification(title, body, icon) {
  if (!hasNotificationPermission()) return

  const options = {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    tag: 'driver-order-alert',
    renotify: true,
  }

  // Try service worker notification first (works when locked / in background)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => {
        // Fall back to basic Notification
        try { new Notification(title, options) } catch (_e) { /* noop */ }
      })
  } else {
    try { new Notification(title, options) } catch (_e) { /* noop */ }
  }
}

const ORDER_LABELS = {
  food_delivery: 'Food Delivery',
  bike_ride: 'Bike Ride',
  car_ride: 'Car Ride',
}

/**
 * Fire all alerts at once — sound + vibration + browser notification.
 * @param {'food_delivery'|'bike_ride'|'car_ride'} orderType
 * @param {string} customerName
 * @param {string} pickupLocation
 */
export function alertNewOrder(orderType, customerName, pickupLocation) {
  const label = ORDER_LABELS[orderType] || orderType
  playOrderAlert()
  vibrateAlert()
  showOrderNotification(
    `New ${label} Order!`,
    `${customerName || 'Customer'} — pickup at ${pickupLocation || 'nearby location'}`,
  )
}
