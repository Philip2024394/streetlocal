/**
 * DealCard — Shopee/Grab-style deal card.
 * Image 60% top, info 40% bottom. Dark glass aesthetic.
 * Discount badge, countdown timer, progress bar, social proof.
 */
import styles from './DealCard.module.css'
import CountdownTimer from './CountdownTimer'
import ClaimProgressBar from './ClaimProgressBar'

const DOMAIN_COLORS = {
  food: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', text: '#F97316', label: '🍜 Food' },
  market: { bg: 'rgba(141,198,63,0.15)', border: 'rgba(141,198,63,0.3)', text: '#8DC63F', label: '🛒 Market' },
  massage: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', text: '#A855F7', label: '💆 Massage' },
  rentals: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#3B82F6', label: '🏠 Rentals' },
  rides: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', text: '#EAB308', label: '🛵 Rides' },
}

function fmtPrice(n) {
  if (!n && n !== 0) return '-'
  return `Rp${n.toLocaleString('id-ID')}`
}

function calcDiscount(original, deal) {
  if (!original || !deal || original <= deal) return 0
  return Math.round(((original - deal) / original) * 100)
}

export default function DealCard({ deal, onTap, compact = false }) {
  const discount = calcDiscount(deal.original_price, deal.deal_price)
  const claimPct = deal.quantity_available
    ? (deal.quantity_claimed || 0) / deal.quantity_available
    : 0
  const almostGone = claimPct > 0.8
  const domain = DOMAIN_COLORS[deal.domain] || DOMAIN_COLORS.food

  return (
    <div
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      onClick={() => onTap?.(deal)}
    >
      {/* Image section */}
      <div className={styles.imageWrap}>
        <img
          src={deal.image || '/placeholder-deal.jpg'}
          alt={deal.title}
          className={styles.image}
          loading="lazy"
          onError={(e) => { e.target.src = '/placeholder-deal.jpg' }}
        />

        {/* Discount badge — top right */}
        {discount > 0 && (
          <div className={styles.discountBadge}>
            -{discount}%
          </div>
        )}

        {/* HOT badge — top left */}
        {deal.is_hot && (
          <div className={styles.hotBadge}>
            <span className={styles.hotFire}>🔥</span> HOT
          </div>
        )}

        {/* Segera Habis badge */}
        {almostGone && (
          <div className={styles.urgentBadge}>
            Segera Habis
          </div>
        )}

        {/* Timer overlay — bottom right of image */}
        {deal.end_time && (
          <div className={styles.timerOverlay}>
            <CountdownTimer endTime={deal.end_time} size="small" variant="pill" />
          </div>
        )}
      </div>

      {/* Info section */}
      <div className={styles.info}>
        {/* Domain pill */}
        <span
          className={styles.domainPill}
          style={{
            background: domain.bg,
            borderColor: domain.border,
            color: domain.text,
          }}
        >
          {domain.label}
        </span>

        {/* Title */}
        <h3 className={styles.title}>{deal.title}</h3>

        {/* Seller + distance */}
        <div className={styles.sellerRow}>
          <span className={styles.seller}>{deal.seller_name || 'Seller'}</span>
          {deal.distance_km != null && (
            <>
              <span className={styles.dot}>&#183;</span>
              <span className={styles.distance}>{deal.distance_km} km</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className={styles.priceRow}>
          {deal.original_price > deal.deal_price && (
            <span className={styles.originalPrice}>{fmtPrice(deal.original_price)}</span>
          )}
          <span className={styles.dealPrice}>{fmtPrice(deal.deal_price)}</span>
        </div>

        {/* Progress bar */}
        {deal.quantity_available > 0 && (
          <ClaimProgressBar
            claimed={deal.quantity_claimed || 0}
            total={deal.quantity_available}
          />
        )}

        {/* Social proof */}
        {(deal.quantity_claimed || 0) > 0 && (
          <div className={styles.socialProof}>
            {deal.quantity_claimed} orang sudah claim
          </div>
        )}
      </div>
    </div>
  )
}
