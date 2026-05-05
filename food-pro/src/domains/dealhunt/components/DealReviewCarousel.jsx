import { useState } from 'react'
import styles from './DealReviewCarousel.module.css'

// ── Star renderer ────────────────────────────────────────────────────────────
function Stars({ count, size = 12 }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= count ? '#FFD700' : '#555' }}>★</span>
      ))}
    </span>
  )
}

// ── Expanded review overlay ──────────────────────────────────────────────────
function ExpandedReview({ review, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.expandedCard} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <img src={review.photo_url} alt="" className={styles.expandedImg} />
        <div className={styles.expandedInfo}>
          <Stars count={review.stars} size={16} />
          <p className={styles.expandedCaption}>{review.caption}</p>
          <span className={styles.reviewerName}>— {review.reviewer_name}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main carousel ────────────────────────────────────────────────────────────
export default function DealReviewCarousel({ dealTitle, sellerId, reviews }) {
  const [expanded, setExpanded] = useState(null)

  if (!reviews || reviews.length === 0) return null

  return (
    <>
      <div className={styles.carousel}>
        {reviews.map(review => (
          <button
            key={review.id}
            className={styles.thumb}
            onClick={() => setExpanded(review)}
          >
            <img src={review.photo_url} alt="" className={styles.thumbImg} />
            <div className={styles.thumbStars}>
              <Stars count={review.stars} size={8} />
            </div>
          </button>
        ))}
      </div>

      {expanded && (
        <ExpandedReview review={expanded} onClose={() => setExpanded(null)} />
      )}
    </>
  )
}
