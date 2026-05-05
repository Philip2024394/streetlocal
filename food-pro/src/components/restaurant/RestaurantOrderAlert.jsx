/**
 * RestaurantOrderAlert
 * Full-screen alert shown to restaurant owner when a new order arrives.
 * Has a 3-minute countdown — auto-accepts if owner doesn't respond.
 * Alarm sound on mount.
 */
import { useState, useEffect, useRef } from 'react'
import styles from './RestaurantOrderAlert.module.css'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

function startAlarm() {
  try {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext
    const ctx = new AudioCtx()
    let active = true
    const beep = () => {
      if (!active) return
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = 660
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
      setTimeout(beep, 1200)
    }
    beep()
    return () => { active = false; ctx.close().catch(() => {}) }
  } catch { return () => {} }
}

export default function RestaurantOrderAlert({ order, onAccept, onDecline }) {
  const [secondsLeft, setSecondsLeft] = useState(180)   // 3 minutes
  const [accepted, setAccepted] = useState(false)
  const stopAlarmRef = useRef(null)

  useEffect(() => {
    stopAlarmRef.current = startAlarm()
    return () => stopAlarmRef.current?.()
  }, [])

  useEffect(() => {
    if (accepted) return
    if (secondsLeft <= 0) {
      stopAlarmRef.current?.()
      handleAccept()
      return
    }
    const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft, accepted]) // eslint-disable-line

  const handleAccept = () => {
    stopAlarmRef.current?.()
    setAccepted(true)
    onAccept?.()
  }

  const handleDecline = () => {
    stopAlarmRef.current?.()
    onDecline?.()
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const urgency = secondsLeft < 30

  const payBadge = order.paymentMethod === 'bank_transfer'
    ? { icon: '🏦', label: 'Bank Transfer', sub: '3% discount applied', color: '#60a5fa' }
    : { icon: '💵', label: 'Cash on Delivery', sub: 'Driver pays you at pickup', color: '#34C759' }

  return (
    <div className={styles.screen}>

      {/* Pulse ring behind icon */}
      <div className={styles.pulseRing} />
      <div className={styles.alertIcon}>🍽️</div>

      <h1 className={styles.title}>New Order!</h1>
      <p className={styles.subTitle}>from {order.buyerName ?? 'a customer'}</p>

      {/* Payment badge */}
      <div className={styles.payBadge} style={{ borderColor: `${payBadge.color}44`, background: `${payBadge.color}11` }}>
        <span className={styles.payBadgeIcon}>{payBadge.icon}</span>
        <div>
          <span className={styles.payBadgeLabel} style={{ color: payBadge.color }}>{payBadge.label}</span>
          <span className={styles.payBadgeSub}>{payBadge.sub}</span>
        </div>
      </div>

      {/* Order summary */}
      <div className={styles.orderCard}>
        <div className={styles.orderRef}>{order.ref}</div>
        <div className={styles.itemsList}>
          {(order.items ?? []).map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span className={styles.itemName}>×{item.qty} {item.name}</span>
              <span className={styles.itemPrice}>{fmtRp(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className={styles.orderDivider} />
        <div className={styles.orderTotal}>
          <span>Total</span>
          <span className={styles.orderTotalVal}>{fmtRp(order.finalTotal ?? order.total)}</span>
        </div>
        {order.notes?.trim() && (
          <div className={styles.orderNote}>📝 {order.notes}</div>
        )}
      </div>

      {/* Countdown */}
      <div className={`${styles.countdown} ${urgency ? styles.countdownUrgent : ''}`}>
        <span className={styles.countdownLabel}>Auto-accepts in</span>
        <span className={styles.countdownTime}>{mins}:{secs}</span>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.btnAccept} onClick={handleAccept}>
          ✓ Accept Order
        </button>
        <button className={styles.btnDecline} onClick={handleDecline}>
          Decline
        </button>
      </div>

    </div>
  )
}
