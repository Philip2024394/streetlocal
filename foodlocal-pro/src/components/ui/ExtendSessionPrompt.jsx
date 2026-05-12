import { useState } from 'react'
import { extendSession } from '@/services/sessionService'
import styles from './ExtendSessionPrompt.module.css'

/**
 * Bottom prompt shown when user's active session has <= 15 minutes remaining.
 *
 * "Still out? Extend 30min" — calls extendSession() then hides.
 * "End Session" — calls onEnd() to terminate the session.
 * Dismissible — user can ignore it; the session expires naturally.
 *
 * Props:
 *  session  — the current active session object from useMySession
 *  onEnd    — callback to end the session (calls endSession + clears state)
 *  onDismiss — callback when user taps "Maybe later"
 */
export default function ExtendSessionPrompt({ session, onEnd, onDismiss }) {
  const [extending, setExtending] = useState(false)
  const [ending,    setEnding]    = useState(false)

  async function handleExtend() {
    setExtending(true)
    try {
      await extendSession(session.id, 30)
      onDismiss?.() // hide prompt — session is extended, timer resets
    } catch {
      setExtending(false)
    }
  }

  async function handleEnd() {
    setEnding(true)
    try { await onEnd?.() } catch { setEnding(false) }
  }

  // Calculate minutes remaining for display
  const minsLeft = session?.expiresAtMs
    ? Math.max(0, Math.round((session.expiresAtMs - Date.now()) / 60_000))
    : 0

  return (
    <div className={styles.prompt} role="dialog" aria-label="Session expiring soon">
      <div className={styles.inner}>
        <div className={styles.iconRow}>
          <span className={styles.icon}>⏱️</span>
          <div className={styles.textBlock}>
            <span className={styles.title}>Still out?</span>
            <span className={styles.sub}>
              {minsLeft <= 1 ? 'Your session is about to end' : `${minsLeft} min left on your session`}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnEnd} onClick={handleEnd} disabled={ending || extending}>
            {ending ? '…' : 'End'}
          </button>
          <button className={styles.btnDismiss} onClick={onDismiss} disabled={extending || ending}>
            Later
          </button>
          <button className={styles.btnExtend} onClick={handleExtend} disabled={extending || ending}>
            {extending ? 'Extending…' : '+ 30 min'}
          </button>
        </div>
      </div>
    </div>
  )
}
