import styles from './RestaurantMenuSheet.module.css'

// ── Review modal ──────────────────────────────────────────────────────────────
export default function ReviewModal({
  reviewOrder,
  reviewStars,
  setReviewStars,
  reviewComment,
  setReviewComment,
  onSubmit,
  onClose,
}) {
  if (!reviewOrder) return null

  return (
    <div className={styles.processingOverlay} onClick={onClose}>
      <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
        <h3 className={styles.confirmTitle}>Rate Your Order</h3>
        <p className={styles.infoPanelSub} style={{ textAlign: 'center' }}>{reviewOrder.restaurant}</p>
        <div className={styles.reviewStarsRow}>
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              className={styles.reviewStarBtn}
              style={{ color: n <= reviewStars ? '#F59E0B' : 'rgba(255,255,255,0.15)' }}
              onClick={() => setReviewStars(n)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          className={styles.reviewCommentInput}
          placeholder="Tell us about your experience (optional)"
          value={reviewComment}
          onChange={e => setReviewComment(e.target.value)}
          rows={3}
          maxLength={300}
        />
        <button
          className={styles.confirmDoneBtn}
          onClick={onSubmit}
          disabled={!reviewStars}
          style={{ opacity: reviewStars ? 1 : 0.4 }}
        >
          Submit Review
        </button>
        <button
          className={styles.orderCancelBtn}
          onClick={onClose}
          style={{ marginTop: 4 }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
