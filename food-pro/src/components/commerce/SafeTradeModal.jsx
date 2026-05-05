/**
 * SafeTradeModal
 * Explains Safe Trade (PayPal / Escrow) in simple terms for users
 * who may have never heard of these services.
 * Includes "Request Safe Trade" when seller hasn't enabled it.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './SafeTradeModal.module.css'

export default function SafeTradeModal({ open, onClose, product, sellerName, onRequestSafeTrade }) {
  const [requested, setRequested] = useState(false)

  if (!open) return null

  const safeTrade = product?.safeTrade ?? {}
  const offered = safeTrade.enabled ?? false
  const paypal = safeTrade.paypal ?? false
  const escrow = safeTrade.escrow ?? false

  function handleRequest() {
    setRequested(true)
    onRequestSafeTrade?.()
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalGlow} />

        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className={styles.modalInner}>

          {/* Header */}
          <div className={styles.header}>
            <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2007_26_42%20PM.png" alt="Safe Trade" className={styles.safeTradeLogo} />
            <h2 className={styles.title}>Safe Trade</h2>
            <p className={styles.subtitle}>Your money is protected until you receive your item</p>
          </div>

          {/* Simple explanation */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>What is Safe Trade?</h3>
            <p className={styles.sectionText}>
              When you buy something online from someone you don't know, there's always a risk — what if they take your money and never send the item? Safe Trade removes that risk completely.
            </p>
            <p className={styles.sectionText} style={{ marginTop: 10 }}>
              Instead of sending money directly to the seller, your payment goes to a <strong>trusted third-party company</strong> (like a bank holding your money). They keep it safe until you receive your item and confirm everything is correct. Only then does the seller get paid.
            </p>
            <p className={styles.sectionText} style={{ marginTop: 10 }}>
              If something goes wrong — wrong item, damaged, or never arrives — the third-party investigates and can return your money. <strong>Indoo Market strongly recommends Safe Trade for all purchases.</strong>
            </p>
          </div>

          {/* How it works — simple steps */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>How it works</h3>
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNum}>1</div>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>You pay through Safe Trade</span>
                  <span className={styles.stepSub}>Your money is held safely — the seller cannot touch it yet</span>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNum}>2</div>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>Seller sends your item</span>
                  <span className={styles.stepSub}>The seller ships your order with tracking information</span>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNum}>3</div>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>You check the item</span>
                  <span className={styles.stepSub}>When it arrives, check it matches what you ordered</span>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNum}>4</div>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>Confirm or raise a dispute</span>
                  <span className={styles.stepSub}>Happy? Confirm and the seller gets paid. Problem? Open a dispute and they will investigate</span>
                </div>
              </div>
            </div>
          </div>

          {/* PayPal explained */}
          <div className={styles.section}>
            <div className={styles.methodExplain}>
              <div className={styles.methodLogoWrap}>
                <img src="https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfs-removebg-preview.png" alt="PayPal" className={styles.methodLogo} />
              </div>
              <div className={styles.methodDetail}>
                <span className={styles.methodName}>What is PayPal?</span>
                <p className={styles.methodDesc}>
                  PayPal is one of the world's largest online payment companies, used by over 400 million people. When you pay with PayPal, your bank details are never shared with the seller. If your item doesn't arrive or isn't as described, PayPal's <strong>Buyer Protection</strong> can refund your money. You can pay using your bank account, card, or PayPal balance.
                </p>
                <span className={styles.methodFee}>Processing fee: ~3.49% + Rp 5,000 per transaction</span>
              </div>
            </div>
          </div>

          {/* Escrow explained */}
          <div className={styles.section}>
            <div className={styles.methodExplain}>
              <div className={styles.methodLogoWrap}>
                <img src="https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdasd-removebg-preview.png" alt="Escrow" className={styles.methodLogo} />
              </div>
              <div className={styles.methodDetail}>
                <span className={styles.methodName}>What is Escrow?</span>
                <p className={styles.methodDesc}>
                  Escrow is a licensed payment protection service. Think of it like a trusted middleman — they hold your money in a secure account until you receive and approve your purchase. The seller only gets paid after you confirm. If there's a problem, Escrow investigates and decides who gets the money. It's especially recommended for <strong>high-value items</strong> and transactions with sellers you haven't bought from before.
                </p>
                <span className={styles.methodFee}>Processing fee: ~3.25% (varies by transaction size)</span>
              </div>
            </div>
          </div>

          {/* Why use it */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Why should I use Safe Trade?</h3>
            <div className={styles.benefitsList}>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>Your money is protected — you only pay when satisfied</span>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>Independent dispute resolution if something goes wrong</span>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>Seller is verified and motivated to send the correct item</span>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>No risk of losing money to scams or fake listings</span>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>Small processing fee is worth the peace of mind</span>
              </div>
            </div>
          </div>

          {/* Seller status */}
          <div className={styles.sellerStatus}>
            <div className={styles.sellerHeader}>
              <span className={styles.sellerLabel}>
                {sellerName ?? 'This seller'}
              </span>
              <div className={`${styles.statusBadge} ${offered ? styles.statusOn : styles.statusOff}`}>
                <span className={styles.statusDot} />
                {offered ? 'Offers Safe Trade' : 'Not enabled'}
              </div>
            </div>

            {offered && (
              <>
                <p className={styles.sellerNote}>
                  This seller accepts Safe Trade. Choose {paypal && escrow ? 'PayPal or Escrow' : paypal ? 'PayPal' : 'Escrow'} at checkout for protected payment.
                </p>
                <div className={styles.methods}>
                  {paypal && (
                    <div className={styles.methodCard}>
                      <div className={styles.methodLogoWrap}>
                        <img src="https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfs-removebg-preview.png" alt="PayPal" className={styles.methodLogo} />
                      </div>
                      <span className={styles.methodCardLabel}>Available</span>
                    </div>
                  )}
                  {escrow && (
                    <div className={styles.methodCard}>
                      <div className={styles.methodLogoWrap}>
                        <img src="https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdasd-removebg-preview.png" alt="Escrow" className={styles.methodLogo} />
                      </div>
                      <span className={styles.methodCardLabel}>Available</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {!offered && (
              <>
                <p className={styles.notAvailableText}>
                  This seller has not enabled Safe Trade yet. You can request them to enable it — this sends a message in your chat asking the seller to set up PayPal or Escrow for safer transactions.
                </p>
                <button
                  className={styles.requestBtn}
                  onClick={handleRequest}
                  disabled={requested}
                >
                  {requested ? '✓ Request sent to seller' : 'Request Safe Trade from this seller'}
                </button>
              </>
            )}
          </div>

          {/* Indoo recommendation */}
          <div className={styles.recommendation}>
            <span className={styles.recommendIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <span>Indoo Market strongly recommends using Safe Trade for all marketplace purchases, especially for items over Rp 500,000</span>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
