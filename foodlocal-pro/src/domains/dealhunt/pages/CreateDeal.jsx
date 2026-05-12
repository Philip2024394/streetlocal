import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { uploadImage } from '@/lib/uploadImage'
import { createDeal } from '@/services/dealService'
import { checkDealEligibility } from '@/services/dealEligibilityService'
import { useAuth } from '@/hooks/useAuth'
import styles from './CreateDeal.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { key: 'food',        icon: '\uD83C\uDF7D\uFE0F', label: 'Food' },
  { key: 'marketplace', icon: '\uD83D\uDECD\uFE0F', label: 'Marketplace' },
  { key: 'massage',     icon: '\uD83D\uDC86',       label: 'Massage' },
  { key: 'rentals',     icon: '\uD83D\uDE97',       label: 'Rental' },
  { key: 'rides',       icon: '\uD83C\uDFCD\uFE0F', label: 'Rides' },
  { key: 'property',    icon: '\uD83C\uDFE0',       label: 'Property' },
]

const SUB_CATEGORIES = {
  food:        ['Rice', 'Noodles & Meatball', 'Chicken', 'Seafood', 'Drinks', 'Snack', 'Coffee', 'Other'],
  marketplace: ['Fashion', 'Electronics', 'Beauty', 'Home & Living', 'Sports', 'Other'],
  massage:     ['Full Body', 'Reflexology', 'Couple', 'Spa Package', 'Other'],
  rentals:     ['Motorcycle', 'Car', 'Bicycle', 'Audio', 'Property', 'Other'],
  rides:       ['Motorcycle Ride', 'Car Taxi', 'Airport', 'Other'],
  property:    ['Boarding House', 'Villa', 'Apartment', 'Other'],
}

const QUICK_DURATIONS = [
  { label: '3 Hours',  hours: 3 },
  { label: '6 Hours',  hours: 6 },
  { label: '1 Day', hours: 24 },
  { label: '3 Days', hours: 72 },
  { label: '7 Days', hours: 168 },
]

const MAX_IMAGES = 5
const MAX_TITLE = 100
const MAX_DESC = 500
const MAX_DEAL_DAYS = 7

const MIN_DISCOUNT = {
  food: 15,
  massage: 15,
  marketplace: 10,
  rentals: 10,
  rides: 10,
}
const DEFAULT_MIN_DISCOUNT = 10

const DEAL_TYPES = [
  { key: 'eat_in',   label: 'Eat In' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'pickup',   label: 'Pick Up' },
]

function toLocalDatetime(date) {
  const d = new Date(date)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function formatRp(n) {
  if (!n && n !== 0) return ''
  return Number(n).toLocaleString('id-ID')
}

/* ══════════════════════════════════════════════════════════════════════════════
   CREATE DEAL FORM
   ══════════════════════════════════════════════════════════════════════════════ */

export default function CreateDeal({ open, onClose, onSaved, userId }) {
  const { userProfile } = useAuth()

  /* ── Eligibility gate ── */
  const [eligibility, setEligibility] = useState(null) // null = loading, { eligible, reasons }
  useEffect(() => {
    if (!open || !userId) return
    setEligibility(null)
    checkDealEligibility(userId, userProfile).then(setEligibility)
  }, [open, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Form state ── */
  const [images, setImages]           = useState([])       // array of { file, url }
  const [uploading, setUploading]     = useState(false)
  const [category, setCategory]       = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [dealPrice, setDealPrice]     = useState('')
  const [selectedDiscount, setSelectedDiscount] = useState(10)
  const DISCOUNT_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]

  // Auto-calculate deal price when original price or selected discount changes
  const autoCalcDealPrice = (origPrice, discPct) => {
    const orig = Number(origPrice)
    if (orig > 0) setDealPrice(String(Math.round(orig * (1 - discPct / 100))))
  }
  const [quantity, setQuantity]       = useState('5')
  const [perUser, setPerUser]         = useState('1')
  const [dealType, setDealType]       = useState('pickup')
  const [indooRide, setIndooRide]     = useState(true)
  const [startTime, setStartTime]     = useState(toLocalDatetime(new Date()))
  const [endTime, setEndTime]         = useState(toLocalDatetime(new Date(Date.now() + 3 * 3600000)))
  const [quickDur, setQuickDur]       = useState(3)
  const [terms, setTerms]             = useState('')

  /* ── UI state ── */
  const [submitting, setSubmitting]   = useState(false)
  const [toast, setToast]             = useState(null)
  const [errors, setErrors]           = useState({})
  const fileRef = useRef(null)

  if (!open) return null

  /* ── Eligibility gate — block form if not eligible ── */
  if (eligibility !== null && !eligibility.eligible) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px', textAlign: 'center' }}>Not eligible to post deals yet</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.6 }}>Complete these requirements to unlock deal posting:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
          {eligibility.reasons.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: '#EF4444', fontWeight: 900 }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{r}</span>
            </div>
          ))}
        </div>
        {eligibility.listings && (
          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: 'rgba(141,198,63,0.05)', border: '1px solid rgba(141,198,63,0.15)', width: '100%', maxWidth: 320 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8DC63F', display: 'block', marginBottom: 6 }}>Your active listings: {eligibility.listings.total}/5 needed</span>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(eligibility.listings.breakdown).map(([mod, count]) => (
                <span key={mod} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{mod}: {count}</span>
              ))}
            </div>
          </div>
        )}
        <button onClick={onClose} style={{ marginTop: 28, padding: '12px 32px', borderRadius: 12, background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          Go Back
        </button>
      </div>,
      document.body
    )
  }

  /* ── Derived ── */
  const origNum = Number(originalPrice) || 0
  const dealNum = Number(dealPrice) || 0
  const discount = origNum > 0 ? Math.round((1 - dealNum / origNum) * 100) : 0
  const discountValid = origNum > 0 && dealNum > 0 && dealNum < origNum
  const discountTooHigh = discount > 70
  const minDiscount = MIN_DISCOUNT[category] || DEFAULT_MIN_DISCOUNT
  const discountTooLow = discountValid && discount < minDiscount
  const discountBad = origNum > 0 && dealNum > 0 && dealNum >= origNum
  const subCats = SUB_CATEGORIES[category] || []
  const catObj = CATEGORIES.find(c => c.key === category)
  const maxEnd = toLocalDatetime(new Date(new Date(startTime).getTime() + MAX_DEAL_DAYS * 86400000))

  /* ── Image handling ── */
  const handleAddImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || images.length >= MAX_IMAGES) return
    e.target.value = ''

    setUploading(true)
    try {
      const url = await uploadImage(file, 'deals')
      setImages(prev => [...prev, { file, url }])
    } catch (err) {
      showToast(err.message || 'Failed to upload image', 'error')
    }
    setUploading(false)
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  /* ── Quick duration ── */
  const applyQuickDuration = (hours) => {
    setQuickDur(hours)
    const start = new Date(startTime)
    setEndTime(toLocalDatetime(new Date(start.getTime() + hours * 3600000)))
  }

  /* ── Toast ── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* ── Validation ── */
  const validate = () => {
    const errs = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (images.length === 0) errs.images = 'At least 1 image required'
    if (!category) errs.category = 'Select a category'
    if (!origNum || origNum <= 0) errs.originalPrice = 'Original price is required'
    if (!dealNum || dealNum <= 0) errs.dealPrice = 'Deal price is required'
    if (dealNum >= origNum) errs.dealPrice = 'Deal price must be lower'
    const catLabel = CATEGORIES.find(c => c.key === category)?.label || category
    const reqMin = MIN_DISCOUNT[category] || DEFAULT_MIN_DISCOUNT
    if (discountValid && discount < reqMin) errs.dealPrice = `Minimum discount for ${catLabel} is ${reqMin}%`
    if (discountValid && discount > 90) errs.dealPrice = 'Maximum discount is 90%'
    if (!quantity || Number(quantity) < 5) errs.quantity = 'Minimum 5 deals per post'
    const st = new Date(startTime)
    const et = new Date(endTime)
    if (et <= st) errs.endTime = 'Must be after start time'
    if (et - st > MAX_DEAL_DAYS * 86400000) errs.endTime = 'Maximum 7 days from start'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)

    try {
      const dealData = {
        seller_id: userId,
        domain: category,
        sub_category: subCategory || null,
        title: title.trim(),
        description: description.trim() || null,
        original_price: origNum,
        deal_price: dealNum,
        discount_pct: discount,
        quantity_available: Number(quantity) || 1,
        quantity_per_user: Number(perUser) || 1,
        images: images.map(img => img.url),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        terms: terms.trim() || null,
        redemption_method: 'voucher',
        deal_type: dealType,
        indoo_ride: dealType === 'delivery' ? indooRide : false,
      }

      const result = await createDeal(dealData)
      if (!result) throw new Error('Failed to create deal')

      showToast('Deal posted successfully!', 'success')
      onSaved?.(result)
      setTimeout(() => onClose?.(), 600)
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error')
    }
    setSubmitting(false)
  }

  /* ── Render ── */
  return createPortal(
    <div className={styles.overlay}>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Create New Deal</span>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>

      {/* Scrollable content */}
      <div className={styles.content}>

        {/* ── 1. Image Upload ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Deal Photos</h3>
          <p className={styles.cardSub}>Add up to 5 photos. The first photo will be the thumbnail.</p>
          <div className={styles.imageGrid}>
            {images.map((img, i) => (
              <div key={i} className={`${styles.imageSlot} ${i === 0 ? styles.imageSlotMain : ''}`}>
                <img src={img.url} alt="" className={styles.imageSlotImg} />
                <button className={styles.imageSlotRemove} onClick={() => removeImage(i)}>x</button>
                {i === 0 && <div className={styles.imageSlotBadge}>THUMB</div>}
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className={styles.imageAddBtn}>
                {uploading ? (
                  <span style={{ fontSize: 12, fontWeight: 700 }}>...</span>
                ) : (
                  <>
                    <span>+</span>
                    <span className={styles.imageAddLabel}>Add</span>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  style={{ display: 'none' }}
                  onChange={handleAddImage}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          {errors.images && <div className={styles.error}>{errors.images}</div>}
        </div>

        {/* ── 2. Category Selector ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Category</h3>
          <p className={styles.cardSub}>Choose your deal category</p>
          <div className={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`${styles.catBtn} ${category === cat.key ? styles.catBtnActive : ''}`}
                onClick={() => { setCategory(cat.key); setSubCategory('') }}
              >
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
          {errors.category && <div className={styles.error}>{errors.category}</div>}
        </div>

        {/* ── 3. Sub-category ── */}
        {subCats.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Sub-category</h3>
            <p className={styles.cardSub}>{catObj?.label} &mdash; choose a more specific type</p>
            <select
              className={styles.select}
              value={subCategory}
              onChange={e => setSubCategory(e.target.value)}
            >
              <option value="">-- Select sub-category --</option>
              {subCats.map(sc => (
                <option key={sc} value={sc.toLowerCase().replace(/\s+/g, '_')}>{sc}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── 3b. Deal Type Selector ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Deal Type</h3>
          <p className={styles.cardSub}>Choose how customers get this deal</p>
          <div className={styles.catGrid}>
            {DEAL_TYPES.map(dt => (
              <button
                key={dt.key}
                className={`${styles.catBtn} ${dealType === dt.key ? styles.catBtnActive : ''}`}
                onClick={() => setDealType(dt.key)}
              >
                <span className={styles.catLabel}>{dt.label}</span>
              </button>
            ))}
          </div>
          {dealType === 'eat_in' && (
            <div className={styles.cardSub} style={{ marginTop: 8, fontStyle: 'italic', color: '#e67e22' }}>
              Voucher valid today only
            </div>
          )}
          {dealType === 'delivery' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={indooRide}
                onChange={e => setIndooRide(e.target.checked)}
              />
              Ship with Indoo Ride (Rp5,000 discount)
            </label>
          )}
        </div>

        {/* ── 4. Deal Title ── */}
        <div className={styles.card}>
          <label className={styles.label}>Deal Title</label>
          <input
            className={styles.input}
            value={title}
            onChange={e => { if (e.target.value.length <= MAX_TITLE) setTitle(e.target.value) }}
            placeholder="Catchy deal title..."
            maxLength={MAX_TITLE}
          />
          <div className={`${styles.charCount} ${title.length > MAX_TITLE - 10 ? styles.charCountWarn : ''}`}>
            {title.length}/{MAX_TITLE}
          </div>
          {errors.title && <div className={styles.error}>{errors.title}</div>}
        </div>

        {/* ── 5. Description ── */}
        <div className={styles.card}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => { if (e.target.value.length <= MAX_DESC) setDescription(e.target.value) }}
            placeholder="Describe your deal in detail..."
            maxLength={MAX_DESC}
            rows={4}
          />
          <div className={`${styles.charCount} ${description.length > MAX_DESC - 30 ? styles.charCountWarn : ''}`}>
            {description.length}/{MAX_DESC}
          </div>
        </div>

        {/* ── 6. Price Section ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Price</h3>
          <p className={styles.cardSub}>Set the original price and deal price</p>
          <div className={styles.priceRow}>
            <div className={styles.priceField}>
              <label className={styles.label}>Original Price</label>
              <div className={styles.priceInputWrap}>
                <span className={styles.pricePrefix}>Rp</span>
                <input
                  className={styles.priceInput}
                  type="number"
                  inputMode="numeric"
                  value={originalPrice}
                  onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setOriginalPrice(v); autoCalcDealPrice(v, selectedDiscount) }}
                  placeholder="100000"
                />
              </div>
              {errors.originalPrice && <div className={styles.error}>{errors.originalPrice}</div>}
            </div>

            {/* Discount percentage selector */}
            <div style={{ marginBottom: 16 }}>
              <label className={styles.label}>Discount % <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(default 10%)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {DISCOUNT_OPTIONS.map(pct => (
                  <button key={pct} type="button" onClick={() => { setSelectedDiscount(pct); autoCalcDealPrice(originalPrice, pct) }} style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', minWidth: 48,
                    background: selectedDiscount === pct ? '#FACC15' : 'rgba(255,255,255,0.06)',
                    color: selectedDiscount === pct ? '#000' : 'rgba(255,255,255,0.5)',
                    border: selectedDiscount === pct ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.priceField}>
              <label className={styles.label}>Deal Price <span style={{ color: '#8DC63F', fontWeight: 700 }}>(auto-calculated)</span></label>
              <div className={styles.priceInputWrap}>
                <span className={styles.pricePrefix}>Rp</span>
                <input
                  className={styles.priceInput}
                  type="number"
                  inputMode="numeric"
                  value={dealPrice}
                  onChange={e => setDealPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="60000"
                />
              </div>
              {errors.dealPrice && <div className={styles.error}>{errors.dealPrice}</div>}
            </div>
          </div>

          {/* Discount badge */}
          {origNum > 0 && dealNum > 0 && (
            discountBad ? (
              <span className={`${styles.discountBadge} ${styles.discountError}`}>
                Deal price must be lower than original price!
              </span>
            ) : discountTooLow ? (
              <span className={`${styles.discountBadge} ${styles.discountError}`}>
                Discount {discount}% &mdash; minimum discount for {catObj?.label || category} is {minDiscount}%
              </span>
            ) : discountTooHigh ? (
              <span className={`${styles.discountBadge} ${styles.discountWarn}`}>
                Discount {discount}%! Wow, are you sure?
              </span>
            ) : (
              <span className={`${styles.discountBadge} ${styles.discountGreen}`}>
                Discount {discount}%!
              </span>
            )
          )}
        </div>

        {/* ── 7. Quantity & Per-user limit ── */}
        <div className={styles.card}>
          <div className={styles.numberRow}>
            <div className={styles.numberField}>
              <label className={styles.label}>Quantity available</label>
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                min="5"
                value={quantity}
                onChange={e => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="10"
              />
              {errors.quantity && <div className={styles.error}>{errors.quantity}</div>}
            </div>
            <div className={styles.numberField}>
              <label className={styles.label}>Max per user</label>
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                min="1"
                value={perUser}
                onChange={e => setPerUser(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* ── 8. Duration ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Deal Duration</h3>
          <p className={styles.cardSub}>When the deal starts and ends (max 7 days)</p>
          <div className={styles.dateRow}>
            <div className={styles.dateField}>
              <label className={styles.label}>Start</label>
              <input
                className={styles.input}
                type="datetime-local"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value)
                  setQuickDur(null)
                }}
              />
            </div>
            <div className={styles.dateField}>
              <label className={styles.label}>End</label>
              <input
                className={styles.input}
                type="datetime-local"
                value={endTime}
                max={maxEnd}
                onChange={e => {
                  setEndTime(e.target.value)
                  setQuickDur(null)
                }}
              />
              {errors.endTime && <div className={styles.error}>{errors.endTime}</div>}
            </div>
          </div>
          <div className={styles.quickBtns}>
            {QUICK_DURATIONS.map(d => (
              <button
                key={d.hours}
                className={`${styles.quickBtn} ${quickDur === d.hours ? styles.quickBtnActive : ''}`}
                onClick={() => applyQuickDuration(d.hours)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 9. Terms ── */}
        <div className={styles.card}>
          <label className={styles.label}>Terms &amp; Conditions (optional)</label>
          <textarea
            className={styles.textarea}
            value={terms}
            onChange={e => setTerms(e.target.value)}
            placeholder="Example: Dine-in only, cannot be combined with other promos..."
            rows={3}
          />
        </div>

        {/* ── 10. Preview Card ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Deal Preview</h3>
          <p className={styles.cardSub}>How your deal will look in the feed</p>

          <div className={styles.preview}>
            {images.length > 0 ? (
              <img src={images[0].url} alt="" className={styles.previewImg} />
            ) : (
              <div className={styles.previewImgPlaceholder}>&#x1F4F7;</div>
            )}
            <div className={styles.previewBody}>
              {catObj && (
                <span className={styles.previewCat}>{catObj.icon} {catObj.label}</span>
              )}
              <h4 className={styles.previewTitle}>{title || 'Your deal title...'}</h4>
              <div className={styles.previewPrices}>
                {dealNum > 0 && (
                  <span className={styles.previewDealPrice}>Rp {formatRp(dealNum)}</span>
                )}
                {origNum > 0 && (
                  <span className={styles.previewOrigPrice}>Rp {formatRp(origNum)}</span>
                )}
                {discountValid && !discountTooLow && discount <= 90 && (
                  <span className={styles.previewDiscount}>-{discount}%</span>
                )}
              </div>
              <div className={styles.previewMeta}>
                {quantity && Number(quantity) > 0
                  ? `${quantity} available`
                  : ''}
                {subCategory ? ` \u00B7 ${subCategory.replace(/_/g, ' ')}` : ''}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Sticky Submit ── */}
      <div className={styles.footer}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Post Deal \uD83D\uDD25'}
        </button>
      </div>

    </div>,
    document.body
  )
}
