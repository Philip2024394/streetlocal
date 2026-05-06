/**
 * BookingRequest — Full-screen booking request popup for INDOO property marketplace.
 * Sends a booking request (no payment processing). Saves to localStorage.
 * Props: { open, onClose, listing }
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const RENTAL_PERIODS = {
  Kos: [
    { value: '1month', label: '1 Month' },
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
  ],
  House: [
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
    { value: '2years', label: '2 Years' },
  ],
  Villa: [
    { value: '1night', label: '1 Night' },
    { value: '1week', label: '1 Week' },
    { value: '1month', label: '1 Month' },
    { value: '1year', label: '1 Year' },
  ],
  Factory: [
    { value: '1year', label: '1 Year' },
    { value: '2years', label: '2 Years' },
    { value: '5years', label: '5 Years' },
  ],
}

const COMMISSION_RATE = 0.10

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    overflowY: 'auto',
  },
  container: {
    background: 'rgba(20,20,20,0.95)',
    border: '1px solid rgba(141,198,63,0.2)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '95vh',
    overflowY: 'auto',
    padding: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 18,
    minHeight: 44,
    minWidth: 44,
  },
  listingPreview: {
    display: 'flex',
    gap: 12,
    padding: 12,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 20,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    objectFit: 'cover',
    background: '#222',
  },
  listingInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: 700,
    color: '#8DC63F',
    margin: 0,
  },
  ownerType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 44,
  },
  phoneRow: {
    display: 'flex',
    gap: 8,
  },
  phonePrefix: {
    width: 64,
    padding: '10px 8px',
    background: 'rgba(141,198,63,0.15)',
    border: '1px solid rgba(141,198,63,0.3)',
    borderRadius: 10,
    color: '#8DC63F',
    fontSize: 14,
    textAlign: 'center',
    minHeight: 44,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 44,
    appearance: 'none',
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
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginTop: 4,
  },
  priceBreakdown: {
    background: 'rgba(141,198,63,0.08)',
    border: '1px solid rgba(141,198,63,0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  priceRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: 10,
    marginTop: 4,
  },
  termsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 18,
    cursor: 'pointer',
  },
  checkbox: {
    width: 20,
    height: 20,
    minWidth: 20,
    borderRadius: 6,
    border: '2px solid rgba(141,198,63,0.5)',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    background: '#8DC63F',
    border: '2px solid #8DC63F',
  },
  termsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.4,
  },
  submitBtn: {
    width: '100%',
    padding: '14px 0',
    background: '#8DC63F',
    border: 'none',
    borderRadius: 12,
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 48,
    transition: 'opacity 0.2s',
  },
  submitBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  successOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(10,10,10,0.97)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 32,
    textAlign: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(141,198,63,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    marginBottom: 20,
    animation: 'pulse 0.6s ease-out',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#8DC63F',
    margin: 0,
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    margin: 0,
    marginBottom: 24,
  },
  successCloseBtn: {
    padding: '12px 32px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
  },
}

function formatRupiah(num) {
  if (!num) return 'Rp 0'
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

export default function BookingRequest({ open, onClose, listing }) {
  const [form, setForm] = useState({
    fullName: '',
    whatsapp: '',
    moveInDate: '',
    rentalPeriod: '',
    occupants: '1',
    message: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        fullName: '',
        whatsapp: '',
        moveInDate: '',
        rentalPeriod: '',
        occupants: '1',
        message: '',
      })
      setAgreed(false)
      setSuccess(false)
    }
  }, [open])

  if (!open || !listing) return null

  const propertyType = listing.type || listing.propertyType || 'House'
  const periods = RENTAL_PERIODS[propertyType] || RENTAL_PERIODS.House
  const rentalPrice = listing.price || 0
  const commission = Math.round(rentalPrice * COMMISSION_RATE)
  const total = rentalPrice + commission

  const canSubmit =
    form.fullName.trim() &&
    form.whatsapp.trim() &&
    form.moveInDate &&
    form.rentalPeriod &&
    agreed

  function handleChange(field, value) {
    if (field === 'message' && value.length > 500) return
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!canSubmit) return

    const request = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      listingId: listing.id || listing.listingId || 'unknown',
      listingTitle: listing.title || listing.name || 'Untitled',
      fullName: form.fullName.trim(),
      whatsapp: '+62' + form.whatsapp.replace(/^0+/, ''),
      moveInDate: form.moveInDate,
      rentalPeriod: form.rentalPeriod,
      occupants: Number(form.occupants),
      message: form.message.trim(),
      rentalPrice,
      commission,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const existing = JSON.parse(localStorage.getItem('indoo_booking_requests') || '[]')
    existing.push(request)
    localStorage.setItem('indoo_booking_requests', JSON.stringify(existing))

    setSuccess(true)
  }

  const content = (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.container, position: 'relative' }}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Booking Request</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>

        {/* Listing Preview */}
        <div style={styles.listingPreview}>
          {listing.image || listing.thumbnail || listing.photo ? (
            <img
              src={listing.image || listing.thumbnail || listing.photo}
              alt={listing.title || listing.name}
              style={styles.thumbnail}
            />
          ) : (
            <div style={{ ...styles.thumbnail, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              🏠
            </div>
          )}
          <div style={styles.listingInfo}>
            <p style={styles.listingTitle}>{listing.title || listing.name || 'Property Listing'}</p>
            <p style={styles.listingPrice}>{formatRupiah(rentalPrice)}/month</p>
            <p style={styles.ownerType}>{listing.ownerType || 'Owner'} - {propertyType}</p>
          </div>
        </div>

        {/* Form */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={form.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>WhatsApp Number</label>
          <div style={styles.phoneRow}>
            <div style={styles.phonePrefix}>+62</div>
            <input
              type="tel"
              placeholder="812 3456 7890"
              value={form.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value.replace(/[^0-9]/g, ''))}
              style={{ ...styles.input, flex: 1 }}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Move-in Date</label>
          <input
            type="date"
            value={form.moveInDate}
            onChange={(e) => handleChange('moveInDate', e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Rental Period</label>
          <select
            value={form.rentalPeriod}
            onChange={(e) => handleChange('rentalPeriod', e.target.value)}
            style={styles.select}
          >
            <option value="" disabled>Select period</option>
            {periods.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Number of Occupants</label>
          <select
            value={form.occupants}
            onChange={(e) => handleChange('occupants', e.target.value)}
            style={styles.select}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Message to Owner (optional)</label>
          <textarea
            placeholder="Tell the owner about yourself, your needs, or any questions..."
            value={form.message}
            onChange={(e) => handleChange('message', e.target.value)}
            style={styles.textarea}
            maxLength={500}
          />
          <div style={styles.charCount}>{form.message.length}/500</div>
        </div>

        {/* Price Breakdown */}
        <div style={styles.priceBreakdown}>
          <div style={styles.priceRow}>
            <span>Rental Price</span>
            <span>{formatRupiah(rentalPrice)}</span>
          </div>
          <div style={styles.priceRow}>
            <span>INDOO Commission (10%)</span>
            <span>{formatRupiah(commission)}</span>
          </div>
          <div style={styles.priceRowTotal}>
            <span>Total</span>
            <span style={{ color: '#8DC63F' }}>{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Terms */}
        <div style={styles.termsRow} onClick={() => setAgreed(!agreed)}>
          <div style={{ ...styles.checkbox, ...(agreed ? styles.checkboxChecked : {}) }}>
            {agreed && <span style={{ color: '#0a0a0a', fontSize: 14, fontWeight: 700 }}>&#10003;</span>}
          </div>
          <span style={styles.termsText}>
            I agree to INDOO's booking terms and conditions. This is a request only — no payment is charged until the owner confirms.
          </span>
        </div>

        {/* Submit */}
        <button
          style={{ ...styles.submitBtn, ...(canSubmit ? {} : styles.submitBtnDisabled) }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Send Request
        </button>

        {/* Success Overlay */}
        {success && (
          <div style={styles.successOverlay}>
            <div style={styles.successIcon}>&#10003;</div>
            <h3 style={styles.successTitle}>Request Sent!</h3>
            <p style={styles.successText}>
              Owner will contact you via WhatsApp within 24 hours.
              <br />
              Check your WhatsApp for updates.
            </p>
            <button style={styles.successCloseBtn} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
