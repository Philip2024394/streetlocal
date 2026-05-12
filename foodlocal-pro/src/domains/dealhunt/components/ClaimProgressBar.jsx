/**
 * ClaimProgressBar — Shows deal claim progress.
 * Color shifts green → orange → red as stock depletes.
 * Animated fill on mount.
 */
import { useState, useEffect } from 'react'
import styles from './ClaimProgressBar.module.css'

function getBarColor(pct) {
  if (pct <= 50) return '#8DC63F'
  if (pct <= 80) return '#F59E0B'
  return '#EF4444'
}

export default function ClaimProgressBar({ claimed = 0, total = 1 }) {
  const [mounted, setMounted] = useState(false)
  const pct = Math.min(100, Math.round((claimed / Math.max(total, 1)) * 100))
  const color = getBarColor(pct)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{
            width: mounted ? `${pct}%` : '0%',
            background: color,
          }}
        />
      </div>
      <div className={styles.label}>
        <span className={styles.pct} style={{ color }}>{pct}% diklaim</span>
        <span className={styles.detail}>{claimed} dari {total} diklaim</span>
      </div>
    </div>
  )
}
