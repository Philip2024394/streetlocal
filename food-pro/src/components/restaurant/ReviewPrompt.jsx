import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './ReviewPrompt.module.css'

// Reads all pending reviews from localStorage
function getPendingReviews() {
  const pending = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('makan_review_')) continue
    try {
      const data = JSON.parse(localStorage.getItem(key))
      if (data && !data.reviewed) pending.push({ key, ...data })
    } catch {}
  }
  return pending
}

export default function ReviewPrompt({ userId }) {
  const [pending,  setPending]  = useState([])
  const [active,   setActive]   = useState(null)   // review being written
  const [stars,    setStars]    = useState(0)
  const [comment,  setComment]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const refresh = () => setPending(getPendingReviews())

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('makan:review-pending', handler)
    return () => window.removeEventListener('makan:review-pending', handler)
  }, [])

  const openReview = (item) => {
    setActive(item)
    setStars(0)
    setComment('')
  }

  const submitReview = async () => {
    if (!stars) return
    setSaving(true)
    if (supabase && userId) {
      await supabase.from('restaurant_reviews').upsert({
        restaurant_id: active.restaurantId,
        user_id:       userId,
        booking_ref:   active.orderRef,
        stars,
        comment:       comment.trim() || null,
      }, { onConflict: 'restaurant_id,user_id,booking_ref' })

      // Recalculate restaurant rating
      const { data: reviews } = await supabase
        .from('restaurant_reviews')
        .select('stars')
        .eq('restaurant_id', active.restaurantId)
      if (reviews?.length) {
        const avg = reviews.reduce((s, r) => s + r.stars, 0) / reviews.length
        await supabase.from('restaurants').update({
          rating:       Math.round(avg * 10) / 10,
          review_count: reviews.length,
        }).eq('id', active.restaurantId)
      }
    }
    // Mark reviewed in localStorage
    localStorage.setItem(active.key, JSON.stringify({ ...active, reviewed: true }))
    setActive(null)
    setSaving(false)
    refresh()
  }

  const dismiss = (item) => {
    localStorage.setItem(item.key, JSON.stringify({ ...item, reviewed: true }))
    refresh()
    if (active?.key === item.key) setActive(null)
  }

  if (pending.length === 0 && !active) return null

  return (
    <>
      {/* ── Notification badge — floats bottom-left ── */}
      {pending.length > 0 && !active && (
        <div className={styles.badge} onClick={() => openReview(pending[0])}>
          <span className={styles.badgeDot}>{pending.length}</span>
          <div className={styles.badgeText}>
            <span className={styles.badgeTitle}>Rate your order</span>
            <span className={styles.badgeSub}>{pending[0].restaurantName}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      )}

      {/* ── Review modal ── */}
      {active && (
        <div className={styles.backdrop} onClick={() => setActive(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <p className={styles.modalOrderRef}>{active.orderRef}</p>
            <h3 className={styles.modalTitle}>How was {active.restaurantName}?</h3>
            <p className={styles.modalSub}>Your review helps other diners</p>

            {/* Stars */}
            <div className={styles.starsRow}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  className={`${styles.starBtn} ${n <= stars ? styles.starOn : ''}`}
                  onClick={() => setStars(n)}
                >★</button>
              ))}
            </div>

            {/* Labels */}
            <div className={styles.starLabels}>
              <span>Terrible</span><span>Amazing</span>
            </div>

            {/* Comment */}
            <textarea
              className={styles.commentInput}
              placeholder="Tell others what you loved (optional)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={300}
            />

            <button
              className={styles.submitBtn}
              onClick={submitReview}
              disabled={!stars || saving}
            >
              {saving ? 'Submitting…' : 'Submit Review'}
            </button>

            <button className={styles.dismissBtn} onClick={() => dismiss(active)}>
              Skip — maybe later
            </button>
          </div>
        </div>
      )}
    </>
  )
}
