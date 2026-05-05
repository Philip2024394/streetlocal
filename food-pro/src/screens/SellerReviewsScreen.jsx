/**
 * SellerReviewsScreen — seller can view all product reviews and reply.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import styles from './SellerReviewsScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

const DEMO_REVIEWS = [
  { id: 'r1', buyer: 'Chloe B.', avatar: 'https://i.pravatar.cc/80?img=5', product: 'Batik Shirt Premium', rating: 5, text: 'Beautiful quality! The fabric is so soft and the pattern is stunning. Will definitely order again.', date: 'Apr 16', reply: null, images: [] },
  { id: 'r2', buyer: 'Ravi G.', avatar: 'https://i.pravatar.cc/80?img=11', product: 'Samsung Galaxy Buds', rating: 4, text: 'Great sound quality. Shipping was fast. Packaging could be better though.', date: 'Apr 14', reply: 'Thank you Ravi! We appreciate the feedback and will improve our packaging.', images: [] },
  { id: 'r3', buyer: 'Maya P.', avatar: 'https://i.pravatar.cc/80?img=9', product: 'Nike Air Max 90', rating: 5, text: 'Original product, very comfortable. Seller was very responsive to questions.', date: 'Apr 12', reply: null, images: [] },
  { id: 'r4', buyer: 'Jordan L.', avatar: 'https://i.pravatar.cc/80?img=3', product: 'Leather Wallet Handmade', rating: 3, text: 'Wallet looks nice but the stitching on one side is a bit loose. Decent for the price.', date: 'Apr 10', reply: null, images: [] },
  { id: 'r5', buyer: 'Ava M.', avatar: 'https://i.pravatar.cc/80?img=1', product: 'Aromatherapy Candle Set', rating: 5, text: 'Smells amazing! Perfect gift. Beautifully packaged too.', date: 'Apr 8', reply: 'Thank you so much Ava! Glad you loved them 💛', images: [] },
]

function StarRow({ rating }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </div>
  )
}

export default function SellerReviewsScreen({ open, onClose }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState(DEMO_REVIEWS)
  const [filter, setFilter] = useState('all')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  if (!open) return null

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0'
  const unreplied = reviews.filter(r => !r.reply).length

  const filtered = filter === 'all' ? reviews
    : filter === 'unreplied' ? reviews.filter(r => !r.reply)
    : reviews.filter(r => r.rating === Number(filter))

  const submitReply = (reviewId) => {
    if (!replyText.trim()) return
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: replyText.trim() } : r))
    if (supabase) {
      supabase.from('product_reviews').update({ seller_reply: replyText.trim(), replied_at: new Date().toISOString() }).eq('id', reviewId).catch(() => {})
    }
    setReplyText('')
    setReplyingTo(null)
  }

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="Indoo Market" className={styles.headerLogo} />
        <h1 className={styles.title}>Reviews</h1>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statBig}>{avgRating}</span>
          <StarRow rating={Math.round(Number(avgRating))} />
          <span className={styles.statSub}>{reviews.length} reviews</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statBig}>{unreplied}</span>
          <span className={styles.statLabel}>Unreplied</span>
          <span className={styles.statSub}>Need your response</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statBig}>{reviews.filter(r => r.rating >= 4).length}</span>
          <span className={styles.statLabel}>4-5 Stars</span>
          <span className={styles.statSub}>{reviews.length ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}% positive</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'all', label: 'All' },
          { id: 'unreplied', label: `Unreplied (${unreplied})` },
          { id: '5', label: '5★' },
          { id: '4', label: '4★' },
          { id: '3', label: '3★' },
          { id: '2', label: '2★' },
          { id: '1', label: '1★' },
        ].map(t => (
          <button key={t.id} className={`${styles.tab} ${filter === t.id ? styles.tabActive : ''}`} onClick={() => setFilter(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>⭐</span>
            <span>No reviews yet</span>
          </div>
        )}
        {filtered.map(review => (
          <div key={review.id} className={`${styles.card} ${!review.reply ? styles.cardUnreplied : ''}`}>
            {/* Buyer info */}
            <div className={styles.cardHeader}>
              <img src={review.avatar} alt={review.buyer} className={styles.avatar} />
              <div className={styles.cardMeta}>
                <span className={styles.buyerName}>{review.buyer}</span>
                <StarRow rating={review.rating} />
              </div>
              <span className={styles.cardDate}>{review.date}</span>
            </div>

            {/* Product */}
            <span className={styles.cardProduct}>{review.product}</span>

            {/* Review text */}
            <p className={styles.cardText}>{review.text}</p>

            {/* Seller reply */}
            {review.reply && (
              <div className={styles.replyBox}>
                <span className={styles.replyLabel}>Your reply</span>
                <p className={styles.replyText}>{review.reply}</p>
              </div>
            )}

            {/* Reply input */}
            {!review.reply && replyingTo !== review.id && (
              <button className={styles.replyBtn} onClick={() => { setReplyingTo(review.id); setReplyText('') }}>
                Reply to this review
              </button>
            )}

            {replyingTo === review.id && (
              <div className={styles.replyInput}>
                <textarea
                  className={styles.replyTextarea}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                  maxLength={500}
                  autoFocus
                />
                <div className={styles.replyActions}>
                  <button className={styles.replyCancelBtn} onClick={() => setReplyingTo(null)}>Cancel</button>
                  <button className={styles.replySubmitBtn} onClick={() => submitReply(review.id)} disabled={!replyText.trim()}>
                    Send Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}
