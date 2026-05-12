import { useState, useEffect } from 'react'
import styles from './CountdownTimer.module.css'

/**
 * Shows a live countdown from expiresAtMs to now.
 * e.g. "Leaving in 47 min"
 */
export default function CountdownTimer({ expiresAtMs, className = '' }) {
  const [remaining, setRemaining] = useState(getRemaining(expiresAtMs))

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(getRemaining(expiresAtMs))
    }, 30000) // update every 30s
    return () => clearInterval(id)
  }, [expiresAtMs])

  if (remaining <= 0) return <span className={[styles.timer, styles.expired, className].join(' ')}>Leaving soon</span>

  const mins = Math.floor(remaining / 60000)
  const label = mins >= 60
    ? `${Math.floor(mins / 60)}h ${mins % 60}m`
    : `${mins} min`

  return (
    <span className={[styles.timer, className].join(' ')}>
      Leaving in {label}
    </span>
  )
}

function getRemaining(expiresAtMs) {
  return Math.max(0, expiresAtMs - Date.now())
}
