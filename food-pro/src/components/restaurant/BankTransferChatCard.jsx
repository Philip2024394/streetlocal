/**
 * BankTransferChatCard
 * Auto-injected into chat when buyer chooses bank transfer.
 * Progresses through 3 states:
 *   awaiting_proof → proof_uploaded → confirmed
 *
 * The restaurant never needs to open this card manually —
 * it auto-appears via the order flow and the proof upload triggers
 * a push notification to the restaurant.
 */
import { useState, useRef } from 'react'
import styles from './BankTransferChatCard.module.css'

const BANK_COLORS = {
  BCA:     '#005baa',
  Mandiri: '#003d6b',
  BRI:     '#003087',
  BNI:     '#e65c00',
  BSI:     '#1a6e3c',
  CIMB:    '#8b0000',
}

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

export default function BankTransferChatCard({ card, fromMe, onProofUploaded }) {
  const {
    bankName, accountNumber, accountHolder,
    grossTotal, discountAmount, finalTotal,
    orderRef, restaurantName,
    state: initialState = 'awaiting_proof',
    proofUrl: initialProof = null,
  } = card

  const [state, setState]       = useState(initialState)
  const [proofUrl, setProofUrl] = useState(initialProof)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const accentColor = BANK_COLORS[bankName] ?? '#1a3a6e'

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    // In production: upload to storage, get URL
    const url = URL.createObjectURL(file)
    await new Promise(r => setTimeout(r, 800))   // simulate upload
    setProofUrl(url)
    setState('proof_uploaded')
    setUploading(false)
    onProofUploaded?.({ proofUrl: url, orderRef })
  }

  return (
    <div className={styles.card}>

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>🏦</span>
        <div>
          <span className={styles.headerTitle}>Bank Transfer</span>
          <span className={styles.headerRef}>{orderRef}</span>
        </div>
        <span className={`${styles.statePill} ${styles[`statePill_${state}`]}`}>
          {state === 'awaiting_proof'  && '⏳ Awaiting proof'}
          {state === 'proof_uploaded'  && '📤 Proof sent'}
          {state === 'confirmed'       && '✅ Confirmed'}
        </span>
      </div>

      {/* Bank card visual */}
      <div className={styles.bankCard} style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}>
        <div className={styles.bankCardTop}>
          <span className={styles.bankCardBrand}>MAKAN by Indoo</span>
          <span className={styles.bankCardName}>{bankName}</span>
        </div>
        <div className={styles.bankCardNumber}>{accountNumber}</div>
        <div className={styles.bankCardBottom}>
          <span className={styles.bankCardHolder}>{accountHolder}</span>
        </div>
      </div>

      {/* Amount breakdown */}
      <div className={styles.amounts}>
        {discountAmount > 0 && (
          <>
            <div className={styles.amountRow}>
              <span className={styles.amountLabelGray}>Original</span>
              <span className={styles.amountValueCross}>{fmtRp(grossTotal)}</span>
            </div>
            <div className={styles.amountRow}>
              <span className={styles.amountDiscount}>3% bank transfer discount</span>
              <span className={styles.amountDiscount}>− {fmtRp(discountAmount)}</span>
            </div>
          </>
        )}
        <div className={`${styles.amountRow} ${styles.amountRowFinal}`}>
          <span>Transfer exactly</span>
          <span className={styles.amountFinal}>{fmtRp(finalTotal)}</span>
        </div>
      </div>

      {/* Steps — only when awaiting proof */}
      {state === 'awaiting_proof' && (
        <div className={styles.steps}>
          <div className={styles.step}><span className={styles.stepNum}>1</span><span>Open your banking app</span></div>
          <div className={styles.step}><span className={styles.stepNum}>2</span><span>Transfer <strong>{fmtRp(finalTotal)}</strong> to the account above</span></div>
          <div className={styles.step}><span className={styles.stepNum}>3</span><span>Upload your transfer screenshot below</span></div>
        </div>
      )}

      {/* Proof thumbnail — after upload */}
      {proofUrl && (
        <div className={styles.proofWrap}>
          <img src={proofUrl} alt="Transfer proof" className={styles.proofImg} />
          <span className={styles.proofLabel}>Transfer screenshot</span>
        </div>
      )}

      {/* Confirmed message */}
      {state === 'confirmed' && (
        <div className={styles.confirmedRow}>
          <span className={styles.confirmedIcon}>✅</span>
          <span className={styles.confirmedText}>Payment confirmed by {restaurantName} — order is being prepared</span>
        </div>
      )}

      {/* Upload button — buyer only, when awaiting */}
      {fromMe && state === 'awaiting_proof' && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button
            className={styles.uploadBtn}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '⏳ Uploading…' : '📤 Upload Transfer Proof'}
          </button>
        </>
      )}

      {fromMe && state === 'proof_uploaded' && (
        <div className={styles.waitingRow}>
          <span className={styles.waitingDot} />
          <span className={styles.waitingText}>Waiting for restaurant to confirm · auto-confirms in 15 min</span>
        </div>
      )}

    </div>
  )
}
