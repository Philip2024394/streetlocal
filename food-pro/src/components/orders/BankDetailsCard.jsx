/**
 * BankDetailsCard — inline chat card for seller bank transfer details.
 *
 * Seller activates this in chat when both parties agree on the order.
 * Buyer sees bank details + upload screenshot button.
 * Screenshot upload triggers commission lock.
 */
import { useState, useRef } from 'react'
import { uploadImage } from '@/lib/uploadImage'
import styles from './BankDetailsCard.module.css'

export default function BankDetailsCard({ bankDetails, fromMe, orderId, onScreenshotUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const isSeller = fromMe
  const isBuyer = !fromMe

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setError(null)
    setUploading(true)

    try {
      const url = await uploadImage(file, 'payment-proofs')
      setUploaded(true)
      onScreenshotUploaded?.({ imageUrl: url, orderId })
    } catch (err) {
      setError('Upload failed. Please try again.')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  if (!bankDetails) return null

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.bankIcon}>🏦</span>
        <div>
          <div className={styles.title}>Bank Transfer Details</div>
          <div className={styles.subtitle}>
            {isSeller ? 'Your bank details have been shared' : 'Transfer to complete your order'}
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>Bank</span>
          <span className={styles.value}>{bankDetails.bankName}</span>
        </div>
        <div className={styles.row} onClick={() => copyToClipboard(bankDetails.accountNumber)} style={{ cursor: 'pointer' }}>
          <span className={styles.label}>Account No.</span>
          <span className={styles.value}>
            {bankDetails.accountNumber}
            <span className={styles.copyHint}>tap to copy</span>
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Account Name</span>
          <span className={styles.value}>{bankDetails.accountName}</span>
        </div>
        {bankDetails.reference && (
          <div className={styles.row}>
            <span className={styles.label}>Reference</span>
            <span className={styles.value} style={{ color: '#FFB800', fontWeight: 700 }}>{bankDetails.reference}</span>
          </div>
        )}
      </div>

      {/* Buyer: upload screenshot */}
      {isBuyer && !uploaded && (
        <div className={styles.uploadSection}>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />

          {previewUrl && (
            <div className={styles.preview}>
              <img src={previewUrl} alt="Payment proof" className={styles.previewImg} />
            </div>
          )}

          <button
            className={styles.uploadBtn}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : previewUrl ? 'Change Screenshot' : 'Upload Payment Screenshot'}
          </button>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.notice}>
            After uploading, the seller will verify your payment. Commission is recorded automatically.
          </div>
        </div>
      )}

      {/* Screenshot uploaded confirmation */}
      {isBuyer && uploaded && (
        <div className={styles.uploadedSection}>
          {previewUrl && (
            <div className={styles.preview}>
              <img src={previewUrl} alt="Payment proof" className={styles.previewImg} />
            </div>
          )}
          <div className={styles.uploadedBadge}>Payment screenshot sent</div>
          <div className={styles.notice}>Waiting for seller to verify...</div>
        </div>
      )}

      {/* Seller sees uploaded screenshot */}
      {isSeller && (
        <div className={styles.sellerNotice}>
          {uploaded
            ? 'Buyer has uploaded payment proof. Verify and confirm the order.'
            : 'Waiting for buyer to upload payment screenshot...'}
        </div>
      )}
    </div>
  )
}
