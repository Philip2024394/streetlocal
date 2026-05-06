/**
 * PropertyReviews — Tenant review section + VerifiedBadge for INDOO property listings.
 * Displays demo reviews, allows writing new reviews (saved to localStorage).
 * Default export: PropertyReviews  |  Named export: VerifiedBadge
 *
 * Props (PropertyReviews): { listingId, listingTitle, rating, reviewCount }
 * Props (VerifiedBadge): { verified }
 */
import { useState, useEffect } from 'react'

const DEMO_REVIEWS = [
  {
    id: 'demo1',
    name: 'Andi Pratama',
    date: '2026-03-12',
    rating: 5,
    text: 'Tempatnya sangat bersih dan strategis. Pemilik ramah dan responsif. Air panas dan WiFi lancar setiap hari. Sangat recommended untuk mahasiswa!',
  },
  {
    id: 'demo2',
    name: 'Siti Nurhaliza',
    date: '2026-02-28',
    rating: 4,
    text: 'Kamarnya luas dan nyaman. Parkiran motor aman. Hanya saja kadang air mati di jam sibuk, tapi overall bagus untuk harganya.',
  },
  {
    id: 'demo3',
    name: 'Budi Setiawan',
    date: '2026-01-15',
    rating: 5,
    text: 'Sudah tinggal 6 bulan di sini. Lingkungan tenang, dekat minimarket dan laundry. Pemilik kos sangat pengertian. Pasti perpanjang lagi.',
  },
  {
    id: 'demo4',
    name: 'Dewi Lestari',
    date: '2025-12-20',
    rating: 3,
    text: 'Lokasi bagus dekat kampus, tapi fasilitas dapur kurang lengkap. Kamar mandi bersama cukup bersih. Harga sesuai untuk area ini.',
  },
  {
    id: 'demo5',
    name: 'Rizky Firmansyah',
    date: '2025-11-08',
    rating: 4,
    text: 'Kos ini cocok untuk pekerja. Ada AC dan meja kerja di setiap kamar. WiFi stabil untuk WFH. Pemilik fast response di WhatsApp.',
  },
]

const styles = {
  section: {
    padding: '20px 0',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  overallRating: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(250,204,21,0.12)',
    padding: '6px 12px',
    borderRadius: 10,
  },
  bigStar: {
    fontSize: 22,
    color: '#FACC15',
  },
  ratingNum: {
    fontSize: 18,
    fontWeight: 700,
    color: '#FACC15',
  },
  reviewCountText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
  writeBtn: {
    padding: '8px 16px',
    background: 'rgba(141,198,63,0.15)',
    border: '1px solid rgba(141,198,63,0.3)',
    borderRadius: 10,
    color: '#8DC63F',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
  },
  reviewCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  reviewTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(141,198,63,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: '#8DC63F',
    flexShrink: 0,
  },
  reviewMeta: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  reviewDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
  },
  starsRow: {
    display: 'flex',
    gap: 2,
  },
  star: {
    fontSize: 14,
    color: '#FACC15',
  },
  starEmpty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.15)',
  },
  reviewText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.6,
    margin: 0,
  },
  // Write review form
  formOverlay: {
    background: 'rgba(20,20,20,0.97)',
    border: '1px solid rgba(141,198,63,0.2)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    marginBottom: 14,
  },
  starSelector: {
    display: 'flex',
    gap: 8,
    marginBottom: 14,
  },
  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 28,
    padding: 0,
    minWidth: 36,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 80,
    resize: 'vertical',
    fontFamily: 'inherit',
    marginBottom: 12,
  },
  formActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '8px 20px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
  },
  submitBtn: {
    padding: '8px 20px',
    background: '#8DC63F',
    border: 'none',
    borderRadius: 10,
    color: '#0a0a0a',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 44,
  },
  // Verified badge
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(141,198,63,0.15)',
    border: '1px solid rgba(141,198,63,0.3)',
    borderRadius: 8,
    padding: '3px 8px',
    fontSize: 12,
    fontWeight: 600,
    color: '#8DC63F',
  },
  shieldIcon: {
    fontSize: 14,
  },
}

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function Stars({ count }) {
  return (
    <div style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={n <= count ? styles.star : styles.starEmpty}>&#9733;</span>
      ))}
    </div>
  )
}

export function VerifiedBadge({ verified }) {
  if (!verified) return null
  return (
    <span style={styles.badge}>
      <span style={styles.shieldIcon}>&#128737;</span>
      Verified
    </span>
  )
}

export default function PropertyReviews({ listingId, listingTitle, rating, reviewCount }) {
  const [showForm, setShowForm] = useState(false)
  const [userReviews, setUserReviews] = useState([])
  const [newRating, setNewRating] = useState(0)
  const [newText, setNewText] = useState('')

  const storageKey = `indoo_property_reviews_${listingId || 'default'}`

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
    setUserReviews(saved)
  }, [storageKey])

  const allReviews = [...userReviews, ...DEMO_REVIEWS]

  const displayRating = rating || 4.3
  const displayCount = reviewCount || allReviews.length

  function handleSubmitReview() {
    if (newRating === 0 || !newText.trim()) return

    const review = {
      id: 'user_' + Date.now(),
      name: 'You',
      date: new Date().toISOString().split('T')[0],
      rating: newRating,
      text: newText.trim(),
    }

    const updated = [review, ...userReviews]
    setUserReviews(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setNewRating(0)
    setNewText('')
    setShowForm(false)
  }

  return (
    <div style={styles.section}>
      {/* Header */}
      <div style={styles.sectionHeader}>
        <div style={styles.headerLeft}>
          <h3 style={styles.sectionTitle}>Tenant Reviews</h3>
          <div style={styles.overallRating}>
            <span style={styles.bigStar}>&#9733;</span>
            <span style={styles.ratingNum}>{displayRating}</span>
            <span style={styles.reviewCountText}>({displayCount})</span>
          </div>
        </div>
        <button style={styles.writeBtn} onClick={() => setShowForm(!showForm)}>
          Write Review
        </button>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div style={styles.formOverlay}>
          <p style={styles.formTitle}>Your Review{listingTitle ? ` for ${listingTitle}` : ''}</p>
          <div style={styles.starSelector}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                style={styles.starBtn}
                onClick={() => setNewRating(n)}
                aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
              >
                <span style={{ color: n <= newRating ? '#FACC15' : 'rgba(255,255,255,0.2)' }}>&#9733;</span>
              </button>
            ))}
          </div>
          <textarea
            style={styles.textarea}
            placeholder="Share your experience living here..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            maxLength={500}
          />
          <div style={styles.formActions}>
            <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setNewRating(0); setNewText('') }}>
              Cancel
            </button>
            <button
              style={{ ...styles.submitBtn, opacity: newRating > 0 && newText.trim() ? 1 : 0.4 }}
              onClick={handleSubmitReview}
              disabled={newRating === 0 || !newText.trim()}
            >
              Submit Review
            </button>
          </div>
        </div>
      )}

      {/* Review Cards */}
      {allReviews.map((review) => (
        <div key={review.id} style={styles.reviewCard}>
          <div style={styles.reviewTop}>
            <div style={styles.avatar}>{getInitials(review.name)}</div>
            <div style={styles.reviewMeta}>
              <p style={styles.reviewerName}>{review.name}</p>
              <p style={styles.reviewDate}>{formatDate(review.date)}</p>
            </div>
            <Stars count={review.rating} />
          </div>
          <p style={styles.reviewText}>{review.text}</p>
        </div>
      ))}
    </div>
  )
}
