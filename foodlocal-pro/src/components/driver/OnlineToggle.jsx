import { useState, useEffect, useRef, useCallback } from 'react'
import { setDriverOnline, updateDriverLocation, getDriverOnlineStatus, setDriverBusy, setDriverSpeedKmh } from '@/services/bookingService'
import { haversineKm } from '@/utils/distance'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import GoOnlineSelfieModal from './GoOnlineSelfieModal'
import styles from './OnlineToggle.module.css'

const LOCATION_INTERVAL_MS = 10_000
// Auto-busy thresholds
const MIN_DISTANCE_KM  = 0.1  // 100 m minimum — ignores GPS drift and walking
const SPEED_BUSY_KMH   = 25   // above this → driver is moving
const SPEED_FREE_KMH   = 8    // below this → driver is stopped
const READINGS_TO_BUSY = 2    // consecutive fast readings before auto-busy
const READINGS_TO_FREE = 3    // consecutive slow readings before auto-clear

export default function OnlineToggle({ userId }) {
  const [online,     setOnline]     = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [showSelfie, setShowSelfie] = useState(false)
  const [autoBusy,   setAutoBusy]   = useState(false)

  const { requestPermission, registerPushSubscription } = usePushNotifications()

  const intervalRef    = useRef(null)
  const watchRef       = useRef(null)
  const prevLocRef     = useRef(null)   // { lat, lng, time }
  const movingCountRef = useRef(0)      // consecutive fast readings
  const stillCountRef  = useRef(0)      // consecutive slow readings

  // Load current status on mount
  useEffect(() => {
    getDriverOnlineStatus(userId).then(status => {
      setOnline(status)
      setLoading(false)
      if (status) startTracking(userId)
    })
    return () => stopTracking()
  }, [userId]) // eslint-disable-line

  // ── Speed check — called on each location ping ──────────────────────────────
  const checkSpeed = useCallback((uid, coords) => {
    const now  = Date.now()
    const prev = prevLocRef.current

    if (prev) {
      const distKm       = haversineKm(prev.lat, prev.lng, coords.lat, coords.lng)

      // Ignore GPS drift and walking — must move at least 100 m between readings
      if (distKm < MIN_DISTANCE_KM) {
        stillCountRef.current++
        movingCountRef.current = 0
        prevLocRef.current = { ...coords, time: now }
        return
      }

      const timeDiffHrs  = (now - prev.time) / 3_600_000
      const speedKmh     = timeDiffHrs > 0 ? distKm / timeDiffHrs : 0

      setDriverSpeedKmh(uid, speedKmh)

      if (speedKmh > SPEED_BUSY_KMH) {
        movingCountRef.current++
        stillCountRef.current = 0
        if (movingCountRef.current >= READINGS_TO_BUSY) {
          // Sustained movement — driver is likely on another service's job
          setDriverBusy(uid, true, 'auto')
          setAutoBusy(true)
        }
      } else if (speedKmh < SPEED_FREE_KMH) {
        stillCountRef.current++
        movingCountRef.current = 0
        if (stillCountRef.current >= READINGS_TO_FREE) {
          // Sustained stop — clear auto-busy only (don't clear explicit booking busy)
          setDriverBusy(uid, false, 'auto')
          setAutoBusy(false)
        }
      } else {
        // Mid-range speed — reset both counters, don't change state
        movingCountRef.current = 0
        stillCountRef.current  = 0
      }
    }

    prevLocRef.current = { ...coords, time: now }
  }, [])

  // ── Location tracking ────────────────────────────────────────────────────────
  const startTracking = useCallback((uid) => {
    if (!navigator.geolocation) return

    // Reset speed tracking state on each go-online
    prevLocRef.current     = null
    movingCountRef.current = 0
    stillCountRef.current  = 0

    // Immediate first ping (no speed check — no prev point yet)
    navigator.geolocation.getCurrentPosition(pos => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      updateDriverLocation(uid, coords)
      prevLocRef.current = { ...coords, time: Date.now() }
    }, () => {})

    // Recurring updates with speed check
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        updateDriverLocation(uid, coords)
        checkSpeed(uid, coords)
      }, () => {})
    }, LOCATION_INTERVAL_MS)
  }, [checkSpeed])

  const stopTracking = () => {
    clearInterval(intervalRef.current)
    intervalRef.current    = null
    prevLocRef.current     = null
    movingCountRef.current = 0
    stillCountRef.current  = 0
    if (watchRef.current !== null) {
      navigator.geolocation?.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }

  // ── Toggle ───────────────────────────────────────────────────────────────────
  const toggle = async () => {
    if (saving) return
    if (!online) {
      // Going online — require selfie first
      setShowSelfie(true)
      return
    }
    // Going offline
    setSaving(true)
    try {
      stopTracking()
      await setDriverOnline(userId, false)
      await setDriverBusy(userId, false, 'offline')
      setAutoBusy(false)
      setOnline(false)
    } catch (e) {
      console.error('Toggle error:', e)
    }
    setSaving(false)
  }

  const handleSelfieSuccess = async () => {
    setShowSelfie(false)
    setSaving(true)
    try {
      // Request push permission and register subscription (once — browser remembers the choice)
      const perm = await requestPermission()
      if (perm === 'granted') await registerPushSubscription(userId)

      let coords = null
      await new Promise(resolve => {
        navigator.geolocation?.getCurrentPosition(
          pos => { coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; resolve() },
          () => resolve(),
          { timeout: 4000 }
        )
      })
      await setDriverOnline(userId, true, coords)
      await setDriverBusy(userId, false, 'offline') // ensure clean slate
      startTracking(userId)
      setAutoBusy(false)
      setOnline(true)
    } catch (e) {
      console.error('Go online error:', e)
    }
    setSaving(false)
  }

  if (loading) return null

  return (
    <>
      <div className={styles.wrap}>
        <button
          className={`${styles.toggleBtn} ${online ? styles.online : styles.offline}`}
          onClick={toggle}
          disabled={saving}
          aria-label={online ? 'Go offline' : 'Go online'}
        >
          <span className={styles.dot} />
          <span className={styles.label}>
            {saving ? '…' : online ? 'ONLINE' : 'OFFLINE'}
          </span>
          {online && <span className={styles.pulse} />}
        </button>

        {/* Auto-busy indicator */}
        {online && autoBusy && (
          <span className={styles.autoBusyBadge} title="Auto-detected: you appear to be on a trip. You will become available again when you stop.">
            🚦 Auto-busy — moving
          </span>
        )}
      </div>

      {showSelfie && (
        <GoOnlineSelfieModal
          userId={userId}
          onSuccess={handleSelfieSuccess}
          onCancel={() => setShowSelfie(false)}
        />
      )}
    </>
  )
}
