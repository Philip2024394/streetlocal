/**
 * DealDetail — Full deal page with hero, pricing, countdown, seller card,
 * claim progress, and sticky CTA. Includes Claim confirmation modal
 * (bottom sheet) and Share sheet.
 *
 * Props: { deal, open, onClose, onClaim, onChat }
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import DealCheckout from './DealCheckout'
import SellerDealsDrawer from '../components/SellerDealsDrawer'
import styles from './DealDetail.module.css'

// ── helpers ──────────────────────────────────────────────

function formatRp(n) {
  return `Rp${Number(n).toLocaleString('id-ID')}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function getRemaining(endTime) {
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return { h: 0, m: 0, s: 0, total: 0 }
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    total: diff,
  }
}

function generateVoucherCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

/** Star rating display */
function Stars({ rating }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  let out = ''
  for (let i = 0; i < full; i++) out += '\u2605'
  if (half) out += '\u00BD'
  return <span className={styles.sellerStars}>{out} {rating.toFixed(1)}</span>
}

/** Domain pill color map */
const domainColors = {
  food: { bg: 'rgba(245,166,35,0.18)', color: '#f5a623' },
  beauty: { bg: 'rgba(233,30,99,0.18)', color: '#e91e63' },
  travel: { bg: 'rgba(33,150,243,0.18)', color: '#2196f3' },
  fitness: { bg: 'rgba(141,198,63,0.18)', color: '#8DC63F' },
  shopping: { bg: 'rgba(156,39,176,0.18)', color: '#9c27b0' },
  services: { bg: 'rgba(0,188,212,0.18)', color: '#00bcd4' },
  default: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' },
}

// ── main component ───────────────────────────────────────

export default function DealDetail({ deal, open, onClose, onClaim, onChat, onSelectDeal }) {
  const [termsOpen, setTermsOpen] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [sellerDrawerOpen, setSellerDrawerOpen] = useState(false)
  const [remaining, setRemaining] = useState(() => getRemaining(deal?.endTime))
  const rafRef = useRef(null)
  const lastSecRef = useRef(-1)

  // countdown
  useEffect(() => {
    if (!open || !deal?.endTime) return
    setRemaining(getRemaining(deal.endTime))
    lastSecRef.current = -1

    function tick() {
      const r = getRemaining(deal.endTime)
      const sec = Math.floor(r.total / 1000)
      if (sec !== lastSecRef.current) {
        lastSecRef.current = sec
        setRemaining(r)
      }
      if (r.total > 0) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [open, deal?.endTime])

  // reset state when deal changes
  useEffect(() => {
    if (open) {
      setShowClaimModal(false)
      setClaimSuccess(false)
      setShowShareSheet(false)
      setTermsOpen(false)
    }
  }, [open, deal?.id])

  // lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const handleClaim = useCallback(() => {
    setShowClaimModal(true)
  }, [])

  const handleConfirmClaim = useCallback(() => {
    const code = generateVoucherCode()
    setVoucherCode(code)
    setClaimSuccess(true)
    onClaim?.(deal, code)
  }, [deal, onClaim])

  const handleShare = useCallback((method) => {
    const title = deal?.title || ''
    const price = deal?.dealPrice || 0
    const url = window.location.href

    if (method === 'copy') {
      navigator.clipboard?.writeText(url)
      setShowShareSheet(false)
    } else if (method === 'whatsapp') {
      const text = encodeURIComponent(`Check this deal on Indoo! ${title} only ${formatRp(price)}! \uD83D\uDD25`)
      window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`, '_blank')
      setShowShareSheet(false)
    } else if (method === 'instagram') {
      // Instagram doesn't support direct share links, open app
      window.open('https://www.instagram.com/', '_blank')
      setShowShareSheet(false)
    }
  }, [deal])

  if (!open || !deal) return null

  const {
    image,
    dealPrice = 0,
    originalPrice = 0,
    discount = 0,
    title = '',
    domain = 'default',
    description = '',
    terms = '',
    claimed = 0,
    totalSlots = 50,
    seller = {},
    viewers = 0,
    endTime,
  } = deal

  const expired = remaining.total <= 0
  const soldOut = claimed >= totalSlots
  const claimPct = Math.min((claimed / totalSlots) * 100, 100)
  const almostGone = claimPct >= 80
  const urgent = !expired && remaining.total < 3600000
  const savings = originalPrice - dealPrice
  const remainingSlots = totalSlots - claimed
  const ctaDisabled = expired || soldOut

  const dc = domainColors[domain] || domainColors.default

  return createPortal(
    <>
      {/* ── Main page ── */}
      <div className={styles.overlay}>
        {/* Hero */}
        <div className={styles.hero}>
          <img className={styles.heroImg} src={image} alt={title} />
          <div className={styles.heroGradient} />

          {discount > 0 && (
            <div className={styles.discountBadge}>-{discount}%</div>
          )}

          <button
            className={`${styles.glassBtn} ${styles.backBtn}`}
            onClick={onClose}
            aria-label="Back"
          >
            &#8592;
          </button>

          <button
            className={`${styles.glassBtn} ${styles.shareBtn}`}
            onClick={() => setShowShareSheet(true)}
            aria-label="Share"
          >
            &#8599;
          </button>
        </div>

        <div className={styles.body}>
          {/* Price */}
          <div className={styles.priceSection}>
            <span className={styles.dealPrice}>{formatRp(dealPrice)}</span>
            <span className={styles.originalPrice}>{formatRp(originalPrice)}</span>
            {savings > 0 && (
              <span className={styles.savingsPill}>Save {formatRp(savings)}</span>
            )}
          </div>

          {/* Countdown */}
          <div className={`${styles.countdownBar} ${urgent ? styles.flash : ''}`}>
            <span className={styles.countdownLabel}>
              {expired ? 'Deal Ended' : 'Ends in'}
            </span>
            <span className={styles.countdownDigits}>
              {expired
                ? 'EXPIRED'
                : `${pad(remaining.h)}:${pad(remaining.m)}:${pad(remaining.s)}`}
            </span>
          </div>

          {/* Title + Domain */}
          <div className={styles.titleSection}>
            <span
              className={styles.domainPill}
              style={{ background: dc.bg, color: dc.color }}
            >
              {domain.charAt(0).toUpperCase() + domain.slice(1)}
            </span>
            <h1 className={styles.dealTitle}>{title}</h1>
          </div>

          {/* Claim progress */}
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${almostGone ? styles.almostGone : ''}`}
                style={{ width: `${claimPct}%` }}
              />
            </div>
            <div className={styles.progressText}>
              <span>{claimed} of {totalSlots} claimed</span>
              {almostGone && !soldOut && (
                <span className={styles.urgentLabel}>Almost Gone!</span>
              )}
              {soldOut && (
                <span className={styles.urgentLabel}>Sold Out!</span>
              )}
            </div>
          </div>

          {/* Seller card */}
          {seller.name && (
            <div className={styles.sellerCard}>
              {seller.photo && (
                <img className={styles.sellerPhoto} src={seller.photo} alt={seller.name} />
              )}
              <div className={styles.sellerInfo}>
                <div className={styles.sellerName}>{seller.name}</div>
                <div className={styles.sellerMeta}>
                  {seller.rating > 0 && <Stars rating={seller.rating} />}
                  {seller.city && <span>{seller.city}</span>}
                  {seller.distance && <span>• {seller.distance}</span>}
                </div>
              </div>
              <button className={styles.chatSellerBtn} onClick={() => onChat?.(seller)}>
                Chat Seller
              </button>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className={styles.descSection}>
              <div className={styles.descLabel}>Description</div>
              <div className={styles.descText}>{description}</div>
            </div>
          )}

          {/* Terms */}
          {terms && (
            <>
              <button
                className={styles.termsToggle}
                onClick={() => setTermsOpen(v => !v)}
              >
                <span className={styles.termsLabel}>Terms &amp; Conditions</span>
                <span className={`${styles.termsArrow} ${termsOpen ? styles.open : ''}`}>
                  &#9660;
                </span>
              </button>
              {termsOpen && (
                <div className={styles.termsContent}>{terms}</div>
              )}
            </>
          )}

          {/* Social proof */}
          {viewers > 0 && (
            <div className={styles.socialProof}>
              <span>{viewers}</span> people viewing this deal
            </div>
          )}
        </div>
      </div>


      {/* ── Sticky CTA ── */}
      <div className={styles.stickyCta}>
        <button
          className={`${styles.claimBtn} ${ctaDisabled ? styles.disabled : ''}`}
          disabled={ctaDisabled}
          onClick={handleClaim}
        >
          {soldOut
            ? 'Sold Out'
            : expired
              ? 'Deal Ended'
              : (
                <>
                  <span>{'\uD83D\uDD25'} Get This Deal</span>
                  {remainingSlots > 0 && (
                    <span className={styles.remaining}>({remainingSlots} left)</span>
                  )}
                </>
              )}
        </button>
      </div>

      {/* ── Share sheet ── */}
      {showShareSheet && (
        <>
          <div className={styles.sheetBackdrop} onClick={() => setShowShareSheet(false)} />
          <div className={styles.shareSheet}>
            <div className={styles.shareSheetTitle}>Share Deal</div>
            <div className={styles.shareOptions}>
              <button className={styles.shareOption} onClick={() => handleShare('copy')}>
                <span className={`${styles.shareOptionIcon} ${styles.copy}`}>{'\uD83D\uDD17'}</span>
                Copy Link
              </button>
              <button className={styles.shareOption} onClick={() => handleShare('whatsapp')}>
                <span className={`${styles.shareOptionIcon} ${styles.wa}`}>{'\uD83D\uDCAC'}</span>
                WhatsApp
              </button>
              <button className={styles.shareOption} onClick={() => handleShare('instagram')}>
                <span className={`${styles.shareOptionIcon} ${styles.ig}`}>{'\uD83D\uDCF7'}</span>
                Instagram
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Checkout flow (replaces old claim modal) ── */}
      <DealCheckout
        deal={deal}
        open={showClaimModal}
        onClose={() => { setShowClaimModal(false); setClaimSuccess(false) }}
        onSuccess={(result) => {
          setClaimSuccess(true)
          setVoucherCode(result.voucherCode)
          onClaim?.(deal, result.voucherCode)
        }}
      />

      {/* ── Seller Deals Drawer ── */}
      <SellerDealsDrawer
        open={sellerDrawerOpen}
        onClose={() => setSellerDrawerOpen(false)}
        sellerId={seller.id || deal.seller_id || deal.sellerId || ''}
        sellerName={seller.name || ''}
        onSelectDeal={(selectedDeal) => {
          setSellerDrawerOpen(false)
          if (onSelectDeal) {
            onSelectDeal(selectedDeal)
          }
        }}
      />
    </>,
    document.body
  )
}
