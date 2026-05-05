/**
 * OrderProcessingOverlay
 * Full-screen overlay shown after buyer uploads payment screenshot.
 * Phase 1: Processing animation (4 seconds) with searching pulse
 * Phase 2: Order received confirmation with seller name
 * Close button returns to chat with notification message.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './OrderProcessingOverlay.module.css'

const PROCESSING_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2012_43_48%20AM.png?updatedAt=1776275045024'
const CONFIRMED_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2012_41_31%20AM.png?updatedAt=1776274910083'

export default function OrderProcessingOverlay({ open, sellerName, onClose }) {
  const [phase, setPhase] = useState('processing') // processing | confirmed

  useEffect(() => {
    if (!open) { setPhase('processing'); return }
    const timer = setTimeout(() => setPhase('confirmed'), 4000)
    return () => clearTimeout(timer)
  }, [open])

  if (!open) return null

  return createPortal(
    <div className={styles.overlay}>
      {phase === 'processing' ? (
        <>
          <img src={PROCESSING_IMG} alt="" className={styles.bgImg} />
          <div className={styles.bgDim} />
          <div className={styles.content}>
            {/* Pulsing icon */}
            <div className={styles.pulseWrap}>
              <div className={styles.pulseRing} />
              <div className={styles.pulseRing2} />
              <div className={styles.pulseIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
            </div>
            <h2 className={styles.title}>Processing Order</h2>
            <p className={styles.sub}>Please Wait</p>
            <div className={styles.dots}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        </>
      ) : (
        <>
          <img src={CONFIRMED_IMG} alt="" className={styles.bgImg} />
          <div className={styles.bgDim} />
          <div className={styles.content}>
            <div className={styles.checkIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className={styles.titleConfirmed}>
              {sellerName ?? 'Seller'} Has Received Your Order
            </h2>
            <p className={styles.subConfirmed}>
              And Will Process For Dispatch Soon
            </p>
            <button className={styles.closeBtn} onClick={onClose}>
              Back to Chat
            </button>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
