/**
 * PostDealPublic — Anyone can post a deal
 * Notifications-style glass UI. KTP + WhatsApp + location + photos → admin approval
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

const CATEGORIES = [
  { key: 'food',        icon: '🍽️', label: 'Food & Drinks' },
  { key: 'marketplace', icon: '🛍️', label: 'Buy & Sell' },
  { key: 'fashion',     icon: '👗', label: 'Fashion' },
  { key: 'electronics', icon: '📱', label: 'Electronics' },
  { key: 'home',        icon: '🏠', label: 'Home & Living' },
  { key: 'beauty',      icon: '💄', label: 'Beauty' },
  { key: 'sports',      icon: '⚽', label: 'Sports' },
  { key: 'vehicles',    icon: '🏍️', label: 'Vehicles' },
  { key: 'services',    icon: '🔧', label: 'Services' },
  { key: 'other',       icon: '📦', label: 'Other' },
]

const MAX_IMAGES = 5
const STORAGE_KEY = 'indoo_public_deals'
const KTP_KEY = 'indoo_deal_ktp_verified'

function fmtRp(n) { return 'Rp ' + (n ?? 0).toLocaleString('id-ID') }

function loadPublicDeals() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function savePublicDeal(deal) {
  const deals = loadPublicDeals()
  deals.unshift(deal)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deals))
}

export function getPublicDeals() { return loadPublicDeals() }
export function approvePublicDeal(dealId) {
  const deals = loadPublicDeals()
  const updated = deals.map(d => d.id === dealId ? { ...d, status: 'active' } : d)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
export function rejectPublicDeal(dealId, reason) {
  const deals = loadPublicDeals()
  const updated = deals.map(d => d.id === dealId ? { ...d, status: 'rejected', reject_reason: reason } : d)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

// Glass card style
const glass = {
  backgroundColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)',
  borderRadius: 16, padding: 16,
}
const inputStyle = {
  width: '100%', padding: '14px', borderRadius: 14,
  backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}
const labelStyle = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }

export default function PostDealPublic({ open, onClose, onPosted }) {
  const [step, setStep] = useState('form')
  const [ktpVerified, setKtpVerified] = useState(() => !!localStorage.getItem(KTP_KEY))
  const [ktpPhoto, setKtpPhoto] = useState(null)
  const [selfiePhoto, setSelfiePhoto] = useState(null)
  const [images, setImages] = useState([])
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [dealPrice, setDealPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [locating, setLocating] = useState(false)
  const [duration, setDuration] = useState(72)
  const [errors, setErrors] = useState({})
  const fileRef = useRef(null)
  const ktpRef = useRef(null)
  const selfieRef = useRef(null)

  if (!open) return null

  const discount = originalPrice && dealPrice ? Math.round((1 - Number(dealPrice) / Number(originalPrice)) * 100) : 0

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > MAX_IMAGES) return
    setImages(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))])
  }

  const handleLocate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLat(coords.latitude); setLng(coords.longitude)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
          const data = await res.json()
          setAddress(data.display_name ?? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
        } catch { setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`) }
        setLocating(false)
      }, () => setLocating(false), { timeout: 8000 }
    )
  }

  const validate = () => {
    const errs = {}
    if (!category) errs.category = 'Select a category'
    if (!title.trim()) errs.title = 'Enter a title'
    if (!originalPrice || Number(originalPrice) <= 0) errs.originalPrice = 'Enter original price'
    if (!dealPrice || Number(dealPrice) <= 0) errs.dealPrice = 'Enter deal price'
    if (Number(dealPrice) >= Number(originalPrice)) errs.dealPrice = 'Deal price must be lower'
    if (images.length === 0) errs.images = 'Upload at least 1 photo'
    if (!whatsapp.trim()) errs.whatsapp = 'Enter WhatsApp number'
    if (!address.trim()) errs.address = 'Enter pickup location'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!ktpVerified) { setStep('verify'); return }
    if (!validate()) return
    savePublicDeal({
      id: `DEAL-${Date.now().toString(36).toUpperCase()}`, seller_id: `user-${Date.now()}`,
      category, title: title.trim(), description: description.trim(),
      original_price: Number(originalPrice), deal_price: Number(dealPrice), discount_pct: discount,
      quantity: Number(quantity) || 1, images: images.map(i => i.url),
      whatsapp: whatsapp.trim(), address: address.trim(), lat, lng,
      duration_hours: duration, start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + duration * 3600000).toISOString(),
      status: 'pending', created_at: new Date().toISOString(), view_count: 0, claim_count: 0,
    })
    setStep('submitted')
    onPosted?.()
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      backgroundColor: '#000',
      backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33.png?updatedAt=1775555797749)',
      backgroundSize: 'cover', backgroundPosition: 'center top',
      display: 'flex', flexDirection: 'column', isolation: 'isolate',
    }}>
      {/* Glass overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2012_07_28%20AM.png?updatedAt=1776532065659" alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>Post a Deal</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Sell locally — buyers collect from you</span>
        </div>
      </div>

      {/* ── VERIFY STEP ── */}
      {step === 'verify' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ ...glass, textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🪪</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block' }}>Verify Your Identity</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, display: 'block' }}>One-time verification to start posting deals</span>
          </div>
          <div style={{ ...glass, marginBottom: 12 }}>
            <span style={labelStyle}>KTP Photo</span>
            <button onClick={() => ktpRef.current?.click()} style={{ width: '100%', height: 130, borderRadius: 14, border: '1.5px dashed rgba(255,255,255,0.15)', backgroundColor: 'rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {ktpPhoto ? <img src={URL.createObjectURL(ktpPhoto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700 }}>📸 Tap to upload KTP</span>}
            </button>
            <input ref={ktpRef} type="file" accept="image/*" capture="environment" onChange={e => setKtpPhoto(e.target.files?.[0])} style={{ display: 'none' }} />
          </div>
          <div style={{ ...glass, marginBottom: 16 }}>
            <span style={labelStyle}>Selfie with KTP</span>
            <button onClick={() => selfieRef.current?.click()} style={{ width: '100%', height: 130, borderRadius: 14, border: '1.5px dashed rgba(255,255,255,0.15)', backgroundColor: 'rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {selfiePhoto ? <img src={URL.createObjectURL(selfiePhoto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700 }}>🤳 Tap to take selfie holding KTP</span>}
            </button>
            <input ref={selfieRef} type="file" accept="image/*" capture="user" onChange={e => setSelfiePhoto(e.target.files?.[0])} style={{ display: 'none' }} />
          </div>
          <button onClick={() => { if (ktpPhoto && selfiePhoto) { localStorage.setItem(KTP_KEY, JSON.stringify({ verified: true, ts: Date.now() })); setKtpVerified(true); setStep('form') } }} disabled={!ktpPhoto || !selfiePhoto} style={{ width: '100%', padding: 16, borderRadius: 16, backgroundColor: ktpPhoto && selfiePhoto ? '#8DC63F' : 'rgba(255,255,255,0.06)', border: 'none', color: ktpPhoto && selfiePhoto ? '#000' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 900, cursor: ktpPhoto && selfiePhoto ? 'pointer' : 'default' }}>Verify & Continue</button>
        </div>
      )}

      {/* ── SUBMITTED STEP ── */}
      {step === 'submitted' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative', zIndex: 1 }}>
          <div style={{ ...glass, textAlign: 'center', maxWidth: 320 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(141,198,63,0.1)', border: '2px solid rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>Deal Submitted!</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Your deal is being reviewed and will appear soon.</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 20 }}>Admin approval usually takes less than 1 hour.</span>
            <button onClick={onClose} style={{ padding: '14px 40px', borderRadius: 14, backgroundColor: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}

      {/* ── FORM STEP ── */}
      {step === 'form' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 120px', position: 'relative', zIndex: 1 }}>

            {/* Photos */}
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📸</span>
                <span style={labelStyle}>Photos ({images.length}/{MAX_IMAGES})</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: 68, height: 68, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label style={{ width: 68, height: 68, borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 22 }}>+<input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} /></label>
                )}
              </div>
              {errors.images && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 6, display: 'block' }}>{errors.images}</span>}
            </div>

            {/* Category */}
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📂</span>
                <span style={labelStyle}>Category</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setCategory(c.key)} style={{ padding: '8px 2px', borderRadius: 10, cursor: 'pointer', backgroundColor: category === c.key ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.3)', border: `1px solid ${category === c.key ? 'rgba(141,198,63,0.4)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    <span style={{ fontSize: 8, fontWeight: 800, color: category === c.key ? '#8DC63F' : 'rgba(255,255,255,0.5)' }}>{c.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 6, display: 'block' }}>{errors.category}</span>}
            </div>

            {/* Title + Description */}
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>✏️</span>
                <span style={labelStyle}>Details</span>
              </div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What are you selling?" maxLength={100} style={{ ...inputStyle, marginBottom: 8 }} />
              {errors.title && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, display: 'block', marginBottom: 6 }}>{errors.title}</span>}
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={500} style={{ ...inputStyle, height: 70, resize: 'none', lineHeight: 1.5 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4, display: 'block' }}>{description.length}/500</span>
            </div>

            {/* Pricing */}
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>💰</span>
                <span style={labelStyle}>Pricing</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1 }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>Original</span><input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="100000" style={inputStyle} /></div>
                <div style={{ flex: 1 }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>Deal Price</span><input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} placeholder="70000" style={inputStyle} /></div>
              </div>
              {errors.originalPrice && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, display: 'block' }}>{errors.originalPrice}</span>}
              {errors.dealPrice && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, display: 'block' }}>{errors.dealPrice}</span>}
              {discount > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>{discount}% OFF</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Save {fmtRp(Number(originalPrice) - Number(dealPrice))}</span>
                </div>
              )}
              <div style={{ marginTop: 8 }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>Quantity</span><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" style={inputStyle} /></div>
            </div>

            {/* Duration */}
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>⏰</span>
                <span style={labelStyle}>Duration</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ label: '3 Hours', hours: 3 }, { label: '1 Day', hours: 24 }, { label: '3 Days', hours: 72 }, { label: '7 Days', hours: 168 }].map(d => (
                  <button key={d.hours} onClick={() => setDuration(d.hours)} style={{ flex: 1, padding: '10px 4px', borderRadius: 10, backgroundColor: duration === d.hours ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.3)', border: `1px solid ${duration === d.hours ? 'rgba(141,198,63,0.4)' : 'rgba(255,255,255,0.08)'}`, color: duration === d.hours ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{d.label}</button>
                ))}
              </div>
            </div>

            {/* Contact + Location */}
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <span style={labelStyle}>Contact & Pickup</span>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>WhatsApp</span>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123456789" type="tel" style={{ ...inputStyle, marginBottom: 8 }} />
              {errors.whatsapp && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, display: 'block', marginBottom: 6 }}>{errors.whatsapp}</span>}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>Pickup Location</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleLocate} disabled={locating} style={{ width: 48, borderRadius: 14, backgroundColor: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {locating ? '…' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                </button>
              </div>
              {errors.address && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 4, display: 'block' }}>{errors.address}</span>}
              {lat && <span style={{ fontSize: 11, color: '#8DC63F', fontWeight: 700, marginTop: 6, display: 'block' }}>📍 Location pinned</span>}
            </div>

            {/* KTP status */}
            <div style={{ ...glass, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{ktpVerified ? '✅' : '🪪'}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: ktpVerified ? '#8DC63F' : '#FACC15', display: 'block' }}>{ktpVerified ? 'Identity Verified' : 'Verification Required'}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ktpVerified ? 'You can post deals' : 'Verify to post'}</span>
              </div>
              {!ktpVerified && <button onClick={() => setStep('verify')} style={{ padding: '6px 14px', borderRadius: 8, backgroundColor: '#FACC15', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Verify</button>}
            </div>
          </div>

          {/* Submit button */}
          <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <button onClick={handleSubmit} style={{ width: '100%', padding: 16, borderRadius: 16, backgroundColor: '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Post Deal</button>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
