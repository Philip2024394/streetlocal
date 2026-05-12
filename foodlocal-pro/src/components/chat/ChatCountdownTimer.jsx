import styles from './ChatCountdownTimer.module.css'

const WARN_MS = 5 * 60 * 1000

function formatTime(ms) {
  if (ms === null || ms === undefined) return null
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * ChatCountdownTimer
 * Shows a pill in the chat header with remaining free time.
 * At ≤5 min remaining it glows amber and shows the unlock CTA.
 *
 * Props:
 *   timeLeftMs      — ms remaining, null if unlocked
 *   isUnlocked      — hide timer entirely if true
 *   onUnlockClick   — opens the UnlockGate modal
 */
export default function ChatCountdownTimer({ timeLeftMs, isUnlocked, onUnlockClick }) {
  if (isUnlocked || timeLeftMs === null) return null

  const display  = formatTime(timeLeftMs)
  const isWarn   = timeLeftMs <= WARN_MS
  const expired  = timeLeftMs <= 0

  return (
    <button
      className={[
        styles.pill,
        isWarn   ? styles.pillWarn   : '',
        expired  ? styles.pillExpired : '',
      ].join(' ')}
      onClick={onUnlockClick}
      aria-label="Free chat time remaining — tap to unlock"
    >
      {expired ? (
        <>
          <span className={styles.icon}>🔒</span>
          <span className={styles.label}>Time up — Unlock to continue</span>
        </>
      ) : isWarn ? (
        <>
          <span className={styles.icon}>⏳</span>
          <span className={styles.label}>{display} left — Unlock now</span>
        </>
      ) : (
        <>
          <span className={styles.icon}>💬</span>
          <span className={styles.label}>Free: {display}</span>
        </>
      )}
    </button>
  )
}
