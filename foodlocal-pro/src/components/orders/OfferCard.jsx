/**
 * OfferCard — inline chat message card for price offers.
 *
 * offerCard shape:
 *   { productName, productImage, qty, offerPrice, listedPrice, totalOffer,
 *     message, status, updatedAt }
 *
 * status lifecycle:  pending → accepted | countered | declined
 *
 * Props:
 *   offerCard       — the offer data
 *   fromMe          — true if viewer sent this offer (buyer)
 *   onRespond(decision, counterPrice?) — seller responds
 */
import styles from './OfferCard.module.css'

function fmtRp(n) {
  if (!n && n !== 0) return '—'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f5c518', bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.3)' },
  accepted:  { label: 'Accepted',  color: '#8DC63F', bg: 'rgba(141,198,63,0.12)',  border: 'rgba(141,198,63,0.3)' },
  countered: { label: 'Countered', color: '#818CF8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)' },
  declined:  { label: 'Declined',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
}

export default function OfferCard({ offerCard, fromMe, onRespond }) {
  if (!offerCard) return null

  const {
    productName, productImage, qty, offerPrice, listedPrice,
    totalOffer, message, status = 'pending', counterPrice,
  } = offerCard

  const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const isBuyer = fromMe
  const isSeller = !fromMe
  const savings = (listedPrice - offerPrice) * qty
  const savingsPercent = listedPrice > 0 ? Math.round(((listedPrice - offerPrice) / listedPrice) * 100) : 0

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.offerIcon}>💰</span>
          <div>
            <div className={styles.headerTitle}>Price Offer</div>
            <div className={styles.headerProduct}>{productName}</div>
          </div>
        </div>
        <span className={styles.statusBadge} style={{ color: st.color, background: st.bg, borderColor: st.border }}>
          {st.label}
        </span>
      </div>

      {/* Product + pricing */}
      <div className={styles.body}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Listed</span>
          <span className={styles.priceListed}>{fmtRp(listedPrice)}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Offer</span>
          <span className={styles.priceOffer}>{fmtRp(offerPrice)} × {qty}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.priceRow}>
          <span className={styles.totalLabel}>Total offer</span>
          <span className={styles.totalValue}>{fmtRp(totalOffer)}</span>
        </div>
        {savings > 0 && (
          <div className={styles.savingsRow}>
            <span>{savingsPercent}% below listed price</span>
          </div>
        )}
      </div>

      {/* Buyer message */}
      {message?.trim() && (
        <div className={styles.message}>
          <span className={styles.messageLabel}>Message:</span> {message}
        </div>
      )}

      {/* Counter offer from seller */}
      {status === 'countered' && counterPrice && (
        <div className={styles.counterSection}>
          <span className={styles.counterLabel}>Seller counter offer</span>
          <span className={styles.counterPrice}>{fmtRp(counterPrice)} per item</span>
          <span className={styles.counterTotal}>Total: {fmtRp(counterPrice * qty)}</span>
        </div>
      )}

      {/* Seller actions — pending */}
      {status === 'pending' && isSeller && onRespond && (
        <div className={styles.actions}>
          <button className={styles.btnAccept} onClick={() => onRespond('accepted')}>
            Accept Offer
          </button>
          <button className={styles.btnCounter} onClick={() => {
            const price = prompt('Enter your counter price per item (Rp):')
            if (price && !isNaN(price)) onRespond('countered', Number(price))
          }}>
            Counter
          </button>
          <button className={styles.btnDecline} onClick={() => onRespond('declined')}>
            Decline
          </button>
        </div>
      )}

      {/* Status messages */}
      {status === 'accepted' && (
        <div className={styles.statusNote} style={{ color: '#8DC63F' }}>
          Offer accepted! Proceed to checkout to complete your order.
        </div>
      )}

      {status === 'declined' && (
        <div className={styles.statusNote} style={{ color: '#ef4444' }}>
          Offer was declined by the seller.
        </div>
      )}

      {status === 'countered' && isBuyer && onRespond && (
        <div className={styles.actions}>
          <button className={styles.btnAccept} onClick={() => onRespond('accepted')}>
            Accept Counter
          </button>
          <button className={styles.btnDecline} onClick={() => onRespond('declined')}>
            Decline
          </button>
        </div>
      )}
    </div>
  )
}
