import { useEffect, useRef } from 'react'
import styles from './VideoCheckWindow.module.css'

/**
 * Live video safety check window.
 * Shows for 'connecting' and 'active' phases.
 *
 * Privacy guarantees enforced by useVideoCheck hook:
 *   - audio: false in getUserMedia — microphone never accessed
 *   - No recording, no storage, no data retained
 *   - Peer-to-peer only — video never touches the server
 */
export default function VideoCheckWindow({
  phase,
  localStream,
  remoteStream,
  countdown,
  displayName,
  onEnd,
}) {
  const localRef  = useRef(null)
  const remoteRef = useRef(null)

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  if (phase !== 'connecting' && phase !== 'active') return null

  const isConnecting = phase === 'connecting'
  const pct = (countdown / 10) * 100
  // SVG ring: circumference of r=42 circle
  const circ = 2 * Math.PI * 42
  const dash = (pct / 100) * circ

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.liveRow}>
            <span className={styles.liveDot} />
            <span className={styles.liveLabel}>Live Safety Check</span>
          </div>
          <button className={styles.endBtn} onClick={onEnd} aria-label="End video check">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            End
          </button>
        </div>

        {/* Video feeds */}
        <div className={styles.feeds}>

          {/* Remote feed — larger, left */}
          <div className={styles.feedWrap}>
            <div className={`${styles.circle} ${styles.circleRemote} ${isConnecting ? styles.circleConnecting : ''}`}>
              {/* Countdown ring — visible only when active */}
              {!isConnecting && (
                <svg className={styles.ring} viewBox="0 0 100 100">
                  <circle className={styles.ringTrack} cx="50" cy="50" r="42" />
                  <circle
                    className={styles.ringProgress}
                    cx="50" cy="50" r="42"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset="0"
                  />
                </svg>
              )}
              <video
                ref={remoteRef}
                className={styles.video}
                autoPlay
                playsInline
                muted
              />
              {isConnecting && (
                <div className={styles.connectingSpinner}>
                  <div className={styles.spinner} />
                </div>
              )}
            </div>
            <span className={styles.feedLabel}>{displayName}</span>
          </div>

          {/* Countdown — between the two circles */}
          {!isConnecting && (
            <div className={styles.countdownCol}>
              <span className={styles.countdownNum}>{countdown}</span>
              <span className={styles.countdownSub}>sec</span>
            </div>
          )}

          {/* Local feed — smaller, right */}
          <div className={styles.feedWrap}>
            <div className={`${styles.circle} ${styles.circleLocal}`}>
              <video
                ref={localRef}
                className={styles.video}
                autoPlay
                playsInline
                muted
              />
            </div>
            <span className={styles.feedLabel}>You</span>
          </div>

        </div>

        {/* Footer */}
        <p className={styles.footer}>
          Camera only · No sound · No recording · Ends automatically
        </p>

      </div>
    </div>
  )
}
