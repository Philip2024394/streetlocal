/**
 * PaymentTransferScreen
 *
 * Full-screen overlay shown immediately after order is placed.
 * Customer has 10 minutes to bank-transfer the full amount to the restaurant
 * and upload a screenshot as proof.
 *
 * Flow: countdown → upload screenshot → submit → restaurant confirms in their dashboard
 */
import { useState, useEffect } from 'react'
import { submitPaymentProof } from '@/services/foodOrderService'
import styles from './PaymentTransferScreen.module.css'

const PAYMENT_WINDOW = 10 * 60  // 10 minutes in seconds

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

export default function PaymentTransferScreen({ order, onSubmitted, onExpired }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!order?.payment_deadline) return PAYMENT_WINDOW
    const diff = Math.floor((new Date(order.payment_deadline) - Date.now()) / 1000)
    return Math.max(0, diff)
  })
  const [screenshot,  setScreenshot]  = useState(null)
  const [preview,     setPreview]     = useState(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)

  // Countdown
  useEffect(() => {
    if (secondsLeft <= 0) { onExpired?.(); return }
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(id); onExpired?.(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!screenshot || submitting) return
    setSubmitting(true)
    await submitPaymentProof(order.id, screenshot)
    setSubmitted(true)
    setSubmitting(false)
    onSubmitted?.()
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const pct  = (secondsLeft / PAYMENT_WINDOW) * 100
  const urgent = secondsLeft < 120  // last 2 minutes

  return (
    <div className={styles.overlay}>
      <div className={styles.screen}>

        {/* ── Timer bar ── */}
        <div className={styles.timerBar}>
          <div
            className={styles.timerFill}
            style={{ width: `${pct}%`, background: urgent ? '#F87171' : '#F59E0B' }}
          />
        </div>

        {/* ── Header ── */}
        <div className={styles.header}>
          <span className={styles.headerEmoji}>💳</span>
          <h2 className={styles.title}>Transfer to Restaurant</h2>
          <p className={styles.subtitle}>
            Complete your bank transfer within{' '}
            <strong className={urgent ? styles.urgent : ''}>{mins}:{secs}</strong>{' '}
            to confirm your order
          </p>
        </div>

        {/* ── Amount ── */}
        <div className={styles.amountCard}>
          <span className={styles.amountLabel}>Transfer exactly</span>
          <span className={styles.amountValue}>{fmtRp(order?.total ?? 0)}</span>
          <span className={styles.amountBreakdown}>
            Food {fmtRp(order?.subtotal ?? 0)} + Driver fee {fmtRp(order?.delivery_fee ?? 0)}
          </span>
        </div>

        {/* ── Restaurant bank details ── */}
        <div className={styles.bankCard}>
          <div className={styles.bankHeader}>
            <span className={styles.bankHeaderIcon}>🏦</span>
            <span className={styles.bankHeaderLabel}>Bank Transfer Details</span>
          </div>
          <div className={styles.bankRow}>
            <span className={styles.bankKey}>Bank</span>
            <span className={styles.bankVal}>{order?.restaurant_bank_name ?? '—'}</span>
          </div>
          <div className={styles.bankRow}>
            <span className={styles.bankKey}>Account</span>
            <button
              className={styles.bankAcct}
              onClick={() => navigator.clipboard?.writeText(order?.restaurant_bank_account ?? '')}
            >
              {order?.restaurant_bank_account ?? '—'}
              <span className={styles.copyHint}>tap to copy</span>
            </button>
          </div>
          <div className={styles.bankRow}>
            <span className={styles.bankKey}>Name</span>
            <span className={styles.bankVal}>{order?.restaurant_bank_holder ?? '—'}</span>
          </div>
          <div className={styles.bankRef}>
            <span className={styles.bankKey}>Reference</span>
            <span className={styles.bankRefVal}>{order?.cash_ref}</span>
          </div>
        </div>

        <p className={styles.refNote}>
          Include <strong>{order?.cash_ref}</strong> as the transfer note so the restaurant can match it
        </p>

        {/* ── Screenshot upload ── */}
        <div className={styles.uploadSection}>
          <p className={styles.uploadLabel}>Upload your transfer screenshot</p>

          {preview ? (
            <div className={styles.previewWrap}>
              <img src={preview} alt="Transfer proof" className={styles.previewImg} />
              <button className={styles.changeBtn} onClick={() => { setScreenshot(null); setPreview(null) }}>
                Change photo
              </button>
            </div>
          ) : (
            <label className={styles.uploadBox}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              <span className={styles.uploadIcon}>📸</span>
              <span className={styles.uploadText}>Tap to take photo or choose from gallery</span>
            </label>
          )}
        </div>

        {/* ── Submit ── */}
        {!submitted ? (
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!screenshot || submitting}
          >
            {submitting ? 'Sending…' : 'Submit Payment Proof →'}
          </button>
        ) : (
          <div className={styles.submittedMsg}>
            ✓ Screenshot sent — waiting for restaurant to confirm
          </div>
        )}

        <p className={styles.footNote}>
          The restaurant will verify the transfer and confirm your order.
          Your driver will be notified automatically once confirmed.
        </p>

      </div>
    </div>
  )
}
