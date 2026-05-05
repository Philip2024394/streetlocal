import { useState, useRef } from 'react'
import { uploadImage } from '@/lib/uploadImage'
import { submitDealReview } from '@/services/dealService'
import { supabase } from '@/lib/supabase'
import styles from './QuickReviewSheet.module.css'

export default function QuickReviewSheet({ open, onClose, deal, userId, onSubmitted }) {
  const [stars, setStars] = useState(0)
  const [caption, setCaption] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  if (!open || !deal) return null

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!stars) return
    setSubmitting(true)
    try {
      let photoUrl = null
      if (photoFile) {
        photoUrl = await uploadImage(photoFile, 'deal-reviews')
      }

      // Demo mode — skip Supabase, return mock
      if (!supabase) {
        const mock = {
          id: `r-${Date.now()}`,
          deal_title: deal.title,
          stars,
          photo_url: photoUrl || photoPreview,
          caption,
          reviewer_name: 'You',
          created_at: new Date().toISOString(),
        }
        onSubmitted?.(mock)
        resetAndClose()
        return
      }

      const review = await submitDealReview({
        dealId: deal.id,
        dealTitle: deal.title,
        sellerId: deal.seller_id,
        reviewerId: userId,
        reviewerName: null,
        stars,
        photoUrl,
        caption,
      })
      onSubmitted?.(review)
      resetAndClose()
    } catch (err) {
      console.warn('[QuickReviewSheet] submit failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  const resetAndClose = () => {
    setStars(0)
    setCaption('')
    setPhotoFile(null)
    setPhotoPreview(null)
    onClose?.()
  }

  return (
    <div className={styles.backdrop} onClick={resetAndClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          {deal.images?.[0] && (
            <img src={deal.images[0]} alt="" className={styles.dealThumb} />
          )}
          <div>
            <h3 className={styles.sheetTitle}>How was the deal?</h3>
            <p className={styles.dealName}>{deal.title}</p>
          </div>
        </div>

        {/* Star rating */}
        <div className={styles.starRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              className={styles.starBtn}
              onClick={() => setStars(i)}
            >
              <span style={{ color: i <= stars ? '#FFD700' : '#555', fontSize: 32 }}>★</span>
            </button>
          ))}
        </div>

        {/* Photo capture */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          className={styles.hiddenInput}
        />
        {photoPreview ? (
          <div className={styles.previewWrap}>
            <img src={photoPreview} alt="" className={styles.previewImg} />
            <button className={styles.removePhoto} onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}>✕</button>
          </div>
        ) : (
          <button className={styles.cameraBtn} onClick={() => fileRef.current?.click()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>Add Photo</span>
          </button>
        )}

        {/* Caption */}
        <input
          type="text"
          className={styles.captionInput}
          placeholder="Write a short review..."
          maxLength={100}
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />

        {/* Submit */}
        <button
          className={styles.submitBtn}
          disabled={!stars || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit Review ⭐'}
        </button>

        {/* Skip */}
        <button className={styles.skipBtn} onClick={resetAndClose}>Skip</button>
      </div>
    </div>
  )
}
