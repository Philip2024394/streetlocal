import { useEffect, useRef, useState } from 'react'
import { acceptBooking, declineBooking } from '@/services/bookingService'
import DriverWarningScreen from './DriverWarningScreen'
import styles from './DriverIncomingBooking.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

// ── Web Audio alarm ───────────────────────────────────────────────────────────
function startAlarm() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext ?? (/** @type {any} */ (window)).webkitAudioContext
    const ctx  = new AudioCtx()
    let active = true

    const beep = () => {
      if (!active) return
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type            = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
      setTimeout(beep, 900)
    }

    beep()
    return () => { active = false; ctx.close().catch(() => {}) }
  } catch (_) {
    return () => {}
  }
}

export default function DriverIncomingBooking({ booking, driverId, onAccepted, onDeclined }) {
  const [busy,        setBusy]       = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [warningType, setWarningType] = useState(null)
  const stopAlarmRef = useRef(null)

  // Start alarm on mount, stop on unmount
  useEffect(() => {
    stopAlarmRef.current = startAlarm()
    return () => stopAlarmRef.current?.()
  }, [])

  // Countdown from expires_at
  useEffect(() => {
    if (!booking?.expires_at) return
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(booking.expires_at) - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) { stopAlarmRef.current?.(); setWarningType('missed') }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [booking?.expires_at]) // eslint-disable-line

  const handleAccept = async () => {
    stopAlarmRef.current?.()
    setBusy(true)
    await acceptBooking(booking.id, driverId)
    onAccepted(booking)
  }

  const handleDecline = async () => {
    stopAlarmRef.current?.()
    setBusy(true)
    await declineBooking(booking.id, driverId)
    setWarningType('declined')
  }

  if (warningType) {
    return (
      <DriverWarningScreen
        driverId={driverId}
        warningType={warningType}
        onDismiss={() => onDeclined(warningType)}
      />
    )
  }

  const passenger = booking.passenger
  const pctLeft   = secondsLeft != null && booking?.expires_at
    ? (secondsLeft / Math.round((new Date(booking.expires_at) - new Date(booking.created_at)) / 1000)) * 100
    : 100

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalBg} />

        {/* Timer bar */}
        <div className={styles.timerBar}>
          <div className={styles.timerFill} style={{ width: `${pctLeft}%`, background: pctLeft < 25 ? '#ff6b6b' : '#8DC63F' }} />
        </div>

        <div className={styles.pulse}>🔔</div>
        <h2 className={styles.title}>New Booking Request</h2>
        {secondsLeft != null && (
          <p className={styles.countdown}>Expires in <strong>{secondsLeft}s</strong></p>
        )}

        {/* Passenger */}
        <div className={styles.passengerRow}>
          <div className={styles.passengerAvatar}>
            {passenger?.photo_url
              ? <img src={passenger.photo_url} alt={passenger.display_name} className={styles.avatarImg} />
              : <span className={styles.avatarInitial}>{passenger?.display_name?.[0]?.toUpperCase() ?? '?'}</span>
            }
          </div>
          <div className={styles.passengerInfo}>
            <span className={styles.passengerName}>{passenger?.display_name ?? 'Passenger'}</span>
            {passenger?.rating && (
              <span className={styles.passengerRating}>⭐ {passenger.rating}</span>
            )}
          </div>
          {booking.fare != null && (
            <span className={styles.fare}>{fmtRp(booking.fare)}</span>
          )}
        </div>

        {/* Route */}
        <div className={styles.route}>
          <div className={styles.routeRow}>
            <span className={styles.routeDot} style={{ background: '#8DC63F' }} />
            <div className={styles.routeTextWrap}>
              <span className={styles.routeLabel}>Pickup</span>
              <span className={styles.routeAddr}>{booking.pickup_location ?? '—'}</span>
            </div>
          </div>
          <div className={styles.routeConnector} />
          <div className={styles.routeRow}>
            <span className={styles.routeDot} style={{ background: '#F5C518' }} />
            <div className={styles.routeTextWrap}>
              <span className={styles.routeLabel}>Destination</span>
              <span className={styles.routeAddr}>{booking.dropoff_location ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnDecline} onClick={handleDecline} disabled={busy}>
            ✕ Decline
          </button>
          <button className={styles.btnAccept} onClick={handleAccept} disabled={busy}>
            {busy ? '…' : '✓ Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}
