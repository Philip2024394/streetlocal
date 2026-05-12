/**
 * CountdownTimer — HH:MM:SS countdown for deal expiry.
 * Uses requestAnimationFrame for smooth updates.
 * Flashes red when < 1 hour remaining.
 */
import { useState, useEffect, useRef } from 'react'
import styles from './CountdownTimer.module.css'

function pad(n) {
  return String(n).padStart(2, '0')
}

function getRemaining(endTime) {
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return { h: 0, m: 0, s: 0, total: 0 }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, total: diff }
}

export default function CountdownTimer({ endTime, size = 'small', variant = 'pill' }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endTime))
  const rafRef = useRef(null)
  const lastSecRef = useRef(-1)

  useEffect(() => {
    function tick() {
      const r = getRemaining(endTime)
      const sec = Math.floor(r.total / 1000)
      if (sec !== lastSecRef.current) {
        lastSecRef.current = sec
        setRemaining(r)
      }
      if (r.total > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [endTime])

  const expired = remaining.total <= 0
  const urgent = !expired && remaining.total < 3600000

  const cls = [
    styles.timer,
    styles[size],
    styles[variant],
    urgent ? styles.urgent : '',
    expired ? styles.expired : '',
  ].filter(Boolean).join(' ')

  return (
    <span className={cls}>
      {variant === 'pill' && !expired && <span className={styles.icon}>&#9201;</span>}
      {expired ? (
        <span className={styles.digits}>EXPIRED</span>
      ) : (
        <span className={styles.digits}>
          {pad(remaining.h)}:{pad(remaining.m)}:{pad(remaining.s)}
        </span>
      )}
    </span>
  )
}
