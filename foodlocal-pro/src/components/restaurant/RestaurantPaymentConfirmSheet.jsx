/**
 * RestaurantPaymentConfirmSheet
 * Shown to restaurant when a buyer submits a bank transfer proof.
 * 15-minute auto-confirm countdown — restaurant just needs to glance and tap.
 * Dispute option opens a simple report flow.
 */
import { useState, useEffect } from 'react'
import styles from './RestaurantPaymentConfirmSheet.module.css'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

export default function RestaurantPaymentConfirmSheet({ open, order, onConfirm, onDispute, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(15 * 60)   // 15 minutes
  const [confirmed, setConfirmed] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [disputeNote, setDisputeNote] = useState('')

  useEffect(() => {
    if (!open || confirmed) return
    if (secondsLeft <= 0) { handleConfirm(); return }
    const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [open, secondsLeft, confirmed]) // eslint-disable-line

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm?.()
  }

  const handleDispute = () => {
    onDispute?.({ note: disputeNote })
  }

  if (!open) return null

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const isUrgent = secondsLeft < 60

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        {confirmed ? (
          <div className={styles.confirmedState}>
            <span className={styles.confirmedIcon}>✅</span>
            <span className={styles.confirmedTitle}>Payment Confirmed</span>
            <span className={styles.confirmedSub}>Order will now be prepared · 10% commission recorded</span>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <span className={styles.headerIcon}>📤</span>
                <div>
                  <span className={styles.headerTitle}>Payment Proof Received</span>
                  <span className={styles.headerRef}>{order?.ref}</span>
                </div>
              </div>
              <div className={`${styles.autoConfirm} ${isUrgent ? styles.autoConfirmUrgent : ''}`}>
                <span className={styles.autoConfirmLabel}>Auto-confirm</span>
                <span className={styles.autoConfirmTime}>{mins}:{secs}</span>
              </div>
            </div>

            {/* Amount */}
            <div className={styles.amountRow}>
              <span className={styles.amountLabel}>Amount transferred</span>
              <span className={styles.amountValue}>{fmtRp(order?.finalTotal ?? order?.total)}</span>
            </div>

            {/* Proof image */}
            {order?.proofUrl && (
              <div className={styles.proofWrap}>
                <img src={order.proofUrl} alt="Transfer proof" className={styles.proofImg} />
              </div>
            )}
            {!order?.proofUrl && (
              <div className={styles.proofPlaceholder}>
                <span>📷</span>
                <span>Screenshot submitted by buyer</span>
              </div>
            )}

            {/* Dispute form */}
            {disputing && (
              <div className={styles.disputeForm}>
                <span className={styles.disputeLabel}>Describe the issue</span>
                <textarea
                  className={styles.disputeInput}
                  value={disputeNote}
                  onChange={e => setDisputeNote(e.target.value)}
                  placeholder="e.g. Amount doesn't match, not received yet…"
                  rows={3}
                />
                <div className={styles.disputeActions}>
                  <button className={styles.btnSubmitDispute} onClick={handleDispute} disabled={!disputeNote.trim()}>
                    Submit Dispute
                  </button>
                  <button className={styles.btnCancelDispute} onClick={() => setDisputing(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!disputing && (
              <div className={styles.actions}>
                <button className={styles.btnConfirm} onClick={handleConfirm}>
                  ✓ Confirm Payment
                </button>
                <button className={styles.btnDispute} onClick={() => setDisputing(true)}>
                  ✗ Dispute
                </button>
              </div>
            )}

            <p className={styles.hint}>
              Auto-confirms in {mins}:{secs} if you take no action. 10% commission will be recorded on confirm.
            </p>
          </>
        )}

      </div>
    </div>
  )
}
