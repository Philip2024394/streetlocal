/**
 * PaymentVerificationCard — shown in chat after buyer uploads payment screenshot.
 *
 * Two buttons for the SELLER:
 *   - "Order Active"   → confirms payment received, order proceeds, commission locked
 *   - "Order Canceled" → buyer gets notification to re-upload screenshot
 *
 * Canceled orders count against the SELLER's reputation (not the buyer's).
 * The seller cannot abuse this to avoid commission because the screenshot
 * already proves the transaction happened.
 */
import { useState } from 'react'
import styles from './PaymentVerificationCard.module.css'

export default function PaymentVerificationCard({
  screenshotUrl,
  orderId,
  orderRef,
  salesNumber,
  fromMe,          // true = seller viewing, false = buyer viewing
  status,          // 'pending_verification' | 'active' | 'canceled' | 're_upload'
  onVerify,        // (decision: 'active' | 'canceled') => void
  cancelCount = 0, // how many times this order was canceled/re-uploaded
}) {
  const [confirming, setConfirming] = useState(null) // 'active' | 'canceled' | null
  const isSeller = fromMe
  const isBuyer = !fromMe

  const handleDecision = (decision) => {
    setConfirming(decision)
    onVerify?.(decision)
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>
          {status === 'active' ? '✅' : status === 'canceled' || status === 're_upload' ? '⚠️' : '🧾'}
        </span>
        <div>
          <div className={styles.title}>
            {status === 'active' ? 'Payment Verified' :
             status === 'canceled' || status === 're_upload' ? 'Re-upload Required' :
             'Payment Verification'}
          </div>
          <div className={styles.ref}>{orderRef}</div>
          {salesNumber && <div className={styles.salesNumber}>{salesNumber}</div>}
        </div>
      </div>

      {/* Screenshot preview */}
      {screenshotUrl && (
        <div className={styles.screenshotWrap}>
          <img src={screenshotUrl} alt="Payment proof" className={styles.screenshot} />
        </div>
      )}

      {/* SELLER: verification buttons */}
      {isSeller && status === 'pending_verification' && !confirming && (
        <div className={styles.actions}>
          <button className={styles.btnActive} onClick={() => handleDecision('active')}>
            Order Active
          </button>
          <button className={styles.btnCanceled} onClick={() => handleDecision('canceled')}>
            Order Canceled
          </button>
        </div>
      )}

      {/* SELLER: after decision */}
      {isSeller && status === 'active' && (
        <div className={styles.statusMsg} style={{ color: '#8DC63F' }}>
          Payment confirmed. Order is active. Commission has been recorded.
        </div>
      )}

      {isSeller && (status === 'canceled' || status === 're_upload') && (
        <div className={styles.statusMsg} style={{ color: '#f59e0b' }}>
          You marked this as canceled. The buyer has been asked to re-upload a clear screenshot.
          {cancelCount >= 2 && (
            <div className={styles.warningNote}>
              This order has been canceled {cancelCount} time(s). Excessive cancellations are reviewed by admin and affect your seller rating.
            </div>
          )}
        </div>
      )}

      {/* BUYER: pending */}
      {isBuyer && status === 'pending_verification' && (
        <div className={styles.statusMsg} style={{ color: '#00E5FF' }}>
          Your payment screenshot has been sent. Waiting for seller to verify...
        </div>
      )}

      {/* BUYER: confirmed */}
      {isBuyer && status === 'active' && (
        <div className={styles.statusMsg} style={{ color: '#8DC63F' }}>
          Payment verified! Your order is now active. The seller will prepare your item.
        </div>
      )}

      {/* BUYER: re-upload needed */}
      {isBuyer && (status === 'canceled' || status === 're_upload') && (
        <div className={styles.reuploadSection}>
          <div className={styles.reuploadMsg}>
            The seller could not verify your payment. Please upload a clear screenshot showing:
          </div>
          <ul className={styles.reuploadList}>
            <li>Transfer amount matching the order total</li>
            <li>Bank name and account number</li>
            <li>Date and time of transfer</li>
            <li>Transaction reference number</li>
          </ul>
          <div className={styles.reuploadWarning}>
            Canceled orders affect your buyer profile. Orders filled vs. orders canceled is visible to all sellers.
          </div>
        </div>
      )}

      {/* Return policy notice */}
      <div className={styles.returnPolicy}>
        <strong>Return Policy:</strong> You have 14 days from delivery to return an item in its original packaging. If the product matches the listing, the buyer pays return shipping. If the product does not match the listing details, the seller pays return shipping. Include a written reason for the return. Your buying reputation will not be affected by legitimate returns.
      </div>
    </div>
  )
}
