// Copy approved. Do not change without product owner sign-off.

import styles from './VideoCheckBubble.module.css'

/**
 * Shown in the chat window for two states:
 *   'requesting' — current user sent request, waiting for response
 *   'incoming'   — other user sent request, showing accept/decline prompt
 */
export default function VideoCheckBubble({ phase, displayName, onAccept, onDecline }) {
  if (phase === 'requesting') {
    return (
      <div className={styles.waitingPill}>
        <span className={styles.waitingDot} />
        <span className={styles.waitingText}>Safety check sent — waiting for {displayName}…</span>
      </div>
    )
  }

  if (phase === 'incoming') {
    return (
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          {/* Shield icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <p className={styles.copy}>
          Quick safety check — optional. No sound. 10 seconds. See each other live before you meet.{' '}
          <span className={styles.copyEmphasis}>Recommended but never required.</span>
        </p>
        <div className={styles.actions}>
          <button className={styles.declineBtn} onClick={onDecline}>
            Decline
          </button>
          <button className={styles.acceptBtn} onClick={onAccept}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Accept
          </button>
        </div>
        <p className={styles.meta}>Camera only · No recording · No data stored</p>
      </div>
    )
  }

  return null
}
