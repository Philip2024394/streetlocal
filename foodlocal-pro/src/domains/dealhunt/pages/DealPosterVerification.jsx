/**
 * DealPosterVerification — Two-step deal poster flow:
 *   Step 1: Identity verification (KTP, selfie, profile info)
 *   Step 2: Deal posting dashboard (manage deals, post new)
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import IndooFooter from '@/components/ui/IndooFooter'

const VERIFIED_KEY = 'indoo_deal_poster_verified'
const PROFILE_KEY = 'indoo_deal_poster_profile'
const DEALS_KEY = 'indoo_public_deals'

const CITIES = [
  'Yogyakarta', 'Jakarta', 'Surabaya', 'Bandung', 'Semarang',
  'Medan', 'Makassar', 'Denpasar', 'Malang', 'Solo',
]

// ── Shared styles ────────────────────────────────────────────────────────────
const glass = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)',
  borderRadius: 16,
  padding: 16,
}

const inputStyle = {
  width: '100%', padding: '14px', borderRadius: 14,
  backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)',
  display: 'block', marginBottom: 6, textTransform: 'uppercase',
}

// ── Time-based background ────────────────────────────────────────────────────
function getTimeBackground() {
  const h = new Date().getHours()
  if (h >= 6 && h < 18) {
    return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)'
  }
  return 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 40%, #0d0d2b 100%)'
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadDeals() {
  try { return JSON.parse(localStorage.getItem(DEALS_KEY) || '[]') } catch { return [] }
}

function saveDeals(deals) {
  localStorage.setItem(DEALS_KEY, JSON.stringify(deals))
}

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function DealPosterVerification({ onClose, onCreateDeal }) {
  const [verified, setVerified] = useState(() => localStorage.getItem(VERIFIED_KEY) === 'true')
  const [profile, setProfile] = useState(() => loadProfile())

  // Auto-fill from existing user profile
  const userProfile = (() => { try { return JSON.parse(localStorage.getItem('indoo_demo_profile') || '{}') } catch { return {} } })()
  const savedLocations = (() => { try { return JSON.parse(localStorage.getItem('indoo_saved_locations') || '{}') } catch { return {} } })()

  // Step 1 form fields — pre-filled from existing account
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(userProfile.photo || null)
  const [fullName, setFullName] = useState(userProfile.name || '')
  const [phone, setPhone] = useState(userProfile.phone?.replace(/^\+\d{1,3}/, '') || '')
  const [countryPrefix, setCountryPrefix] = useState('+62')
  const [address, setAddress] = useState(savedLocations.home?.address || userProfile.address || '')
  const [city, setCity] = useState(userProfile.city || 'Yogyakarta')
  const [ktpNumber, setKtpNumber] = useState('')
  const [ktpPhoto, setKtpPhoto] = useState(null)
  const [ktpPhotoUrl, setKtpPhotoUrl] = useState(null)
  const [selfiePhoto, setSelfiePhoto] = useState(null)
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState(null)
  const [businessName, setBusinessName] = useState('')
  const [errors, setErrors] = useState({})

  const profilePhotoRef = useRef(null)
  const ktpRef = useRef(null)
  const selfieRef = useRef(null)

  // Dashboard state
  const [deals, setDeals] = useState(() => loadDeals())

  // Refresh deals when switching to dashboard
  useEffect(() => {
    if (verified) setDeals(loadDeals())
  }, [verified])

  const myDeals = deals.filter(d => {
    if (!profile) return false
    return d.seller_id === profile.seller_id || d.whatsapp === profile.phone
  })

  const activeCount = myDeals.filter(d => d.status === 'active').length
  const claimsCount = myDeals.reduce((sum, d) => sum + (d.claim_count ?? d.quantity_claimed ?? 0), 0)
  const expiredCount = myDeals.filter(d => d.status === 'expired' || (d.end_time && new Date(d.end_time) < new Date())).length

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!profilePhotoUrl) errs.profilePhoto = 'Upload a profile photo'
    if (!fullName.trim()) errs.fullName = 'Enter your full name'
    if (!phone.trim()) errs.phone = 'Enter your phone/WhatsApp number'
    if (!address.trim()) errs.address = 'Enter your address'
    if (!city) errs.city = 'Select your city'
    if (!ktpNumber.trim() || ktpNumber.trim().length !== 16) errs.ktpNumber = 'Enter a valid 16-digit KTP number'
    if (!ktpPhotoUrl) errs.ktpPhoto = 'Upload your KTP photo'
    if (!selfiePhotoUrl) errs.selfiePhoto = 'Upload a selfie with your KTP'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit verification ────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) return
    const profileData = {
      seller_id: `seller-${Date.now()}`,
      profilePhoto: profilePhotoUrl,
      fullName: fullName.trim(),
      phone: `${countryPrefix}${phone.trim()}`,
      address: address.trim(),
      city,
      ktpNumber: ktpNumber.trim(),
      ktpPhoto: ktpPhotoUrl,
      selfiePhoto: selfiePhotoUrl,
      businessName: businessName.trim() || null,
      verifiedAt: new Date().toISOString(),
    }
    localStorage.setItem(VERIFIED_KEY, 'true')
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData))
    setProfile(profileData)
    setVerified(true)
  }

  // ── Deal actions ───────────────────────────────────────────────────────────
  const toggleDealStatus = (dealId) => {
    const updated = deals.map(d => {
      if (d.id !== dealId) return d
      const newStatus = d.status === 'active' ? 'paused' : 'active'
      return { ...d, status: newStatus }
    })
    saveDeals(updated)
    setDeals(updated)
  }

  const deleteDeal = (dealId) => {
    const updated = deals.filter(d => d.id !== dealId)
    saveDeals(updated)
    setDeals(updated)
  }

  // ── File upload handlers ───────────────────────────────────────────────────
  const handleFileUpload = (e, setUrl) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUrl(URL.createObjectURL(file))
  }

  // ── Status badge ───────────────────────────────────────────────────────────
  const statusBadge = (deal) => {
    const isExpired = deal.status === 'expired' || (deal.end_time && new Date(deal.end_time) < new Date())
    if (isExpired) return { label: 'Expired', bg: 'rgba(255,60,60,0.2)', color: '#ff6b6b' }
    if (deal.status === 'paused') return { label: 'Paused', bg: 'rgba(255,200,0,0.2)', color: '#ffd43b' }
    if (deal.status === 'pending') return { label: 'Pending', bg: 'rgba(255,165,0,0.2)', color: '#ffa500' }
    return { label: 'Active', bg: 'rgba(141,198,63,0.2)', color: '#8DC63F' }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: getTimeBackground(),
      display: 'flex', flexDirection: 'column', isolation: 'isolate',
    }}>
      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0, position: 'relative', zIndex: 1,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Deal Hunt</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {verified ? 'Deal Poster Dashboard' : 'Seller Verification'}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 16px 120px',
        position: 'relative', zIndex: 1,
        WebkitOverflowScrolling: 'touch',
      }}>
        {!verified ? renderVerificationForm() : renderDashboard()}
      </div>

      <IndooFooter label="Deal Hunt" onHome={onClose} onClose={onClose} />
    </div>,
    document.body
  )

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Verification Form
  // ══════════════════════════════════════════════════════════════════════════
  function renderVerificationForm() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title card */}
        <div style={{ ...glass, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏷️</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
            Verify to Post Deals
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            Your account details are pre-filled. Just upload your KTP for verification to start posting deals.
          </div>
        </div>

        {/* Auto-filled profile summary */}
        {(userProfile.name || userProfile.phone) && (
          <div style={{ ...glass, display: 'flex', alignItems: 'center', gap: 14 }}>
            {userProfile.photo && <img src={userProfile.photo} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8DC63F', flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{userProfile.name || 'Your Name'}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{userProfile.phone || 'Phone not set'}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.25)', color: '#8DC63F' }}>Auto-filled</span>
          </div>
        )}

        {/* Profile Photo */}
        <div style={glass}>
          <label style={labelStyle}>Profile Photo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              onClick={() => profilePhotoRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: errors.profilePhoto ? '2px solid #ff6b6b' : '2px dashed rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
              }}
            >
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Tap to upload your photo
            </div>
          </div>
          <input ref={profilePhotoRef} type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, setProfilePhotoUrl)} />
          {errors.profilePhoto && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>{errors.profilePhoto}</div>}
        </div>

        {/* Full Name */}
        <div style={glass}>
          <label style={labelStyle}>Full Name *</label>
          <input
            value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Your full legal name"
            style={{ ...inputStyle, borderColor: errors.fullName ? '#ff6b6b' : 'rgba(255,255,255,0.1)' }}
          />
          {errors.fullName && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>{errors.fullName}</div>}
        </div>

        {/* Phone / WhatsApp */}
        <div style={glass}>
          <label style={labelStyle}>Phone / WhatsApp *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={countryPrefix}
              onChange={e => setCountryPrefix(e.target.value)}
              style={{ ...inputStyle, width: 90, flexShrink: 0, padding: '14px 8px' }}
            >
              <option value="+62">+62</option>
              <option value="+60">+60</option>
              <option value="+65">+65</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+91">+91</option>
            </select>
            <input
              value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="81234567890"
              style={{ ...inputStyle, borderColor: errors.phone ? '#ff6b6b' : 'rgba(255,255,255,0.1)' }}
            />
          </div>
          {errors.phone && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>{errors.phone}</div>}
        </div>

        {/* Address */}
        <div style={glass}>
          <label style={labelStyle}>Address *</label>
          <input
            value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Your street address"
            style={{ ...inputStyle, borderColor: errors.address ? '#ff6b6b' : 'rgba(255,255,255,0.1)' }}
          />
          {errors.address && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>{errors.address}</div>}
        </div>

        {/* City */}
        <div style={glass}>
          <label style={labelStyle}>City *</label>
          <select
            value={city} onChange={e => setCity(e.target.value)}
            style={{ ...inputStyle, borderColor: errors.city ? '#ff6b6b' : 'rgba(255,255,255,0.1)' }}
          >
            <option value="">Select city...</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>{errors.city}</div>}
        </div>

        {/* KTP Number */}
        <div style={glass}>
          <label style={labelStyle}>KTP Number (16 digits) *</label>
          <input
            value={ktpNumber}
            onChange={e => setKtpNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 16))}
            placeholder="3301234567890123"
            maxLength={16}
            style={{ ...inputStyle, borderColor: errors.ktpNumber ? '#ff6b6b' : 'rgba(255,255,255,0.1)' }}
          />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            {ktpNumber.length}/16 digits
          </div>
          {errors.ktpNumber && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 2 }}>{errors.ktpNumber}</div>}
        </div>

        {/* KTP Photo */}
        <div style={glass}>
          <label style={labelStyle}>KTP Photo *</label>
          <div
            onClick={() => ktpRef.current?.click()}
            style={{
              width: '100%', height: 140, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: errors.ktpPhoto ? '2px solid #ff6b6b' : '2px dashed rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden',
            }}
          >
            {ktpPhotoUrl ? (
              <img src={ktpPhotoUrl} alt="KTP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                <div style={{ fontSize: 12, marginTop: 4 }}>Tap to upload KTP photo</div>
              </div>
            )}
          </div>
          <input ref={ktpRef} type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, setKtpPhotoUrl)} />
          {errors.ktpPhoto && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>{errors.ktpPhoto}</div>}
        </div>

        {/* Selfie with KTP */}
        <div style={glass}>
          <label style={labelStyle}>Selfie with KTP *</label>
          <div
            onClick={() => selfieRef.current?.click()}
            style={{
              width: '100%', height: 140, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: errors.selfiePhoto ? '2px solid #ff6b6b' : '2px dashed rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden',
            }}
          >
            {selfiePhotoUrl ? (
              <img src={selfiePhotoUrl} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/><rect x="14" y="2" width="8" height="6" rx="1"/></svg>
                <div style={{ fontSize: 12, marginTop: 4 }}>Tap to upload selfie holding KTP</div>
              </div>
            )}
          </div>
          <input ref={selfieRef} type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, setSelfiePhotoUrl)} />
          {errors.selfiePhoto && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>{errors.selfiePhoto}</div>}
        </div>

        {/* Business Name (optional) */}
        <div style={glass}>
          <label style={labelStyle}>Business Name (Optional)</label>
          <input
            value={businessName} onChange={e => setBusinessName(e.target.value)}
            placeholder="Your shop or restaurant name"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            For shops, restaurants, or businesses
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: 'linear-gradient(135deg, #8DC63F 0%, #6ba52a 100%)',
            border: 'none', color: '#fff', fontSize: 16, fontWeight: 900,
            cursor: 'pointer', marginTop: 8,
            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
          }}
        >
          Submit for Verification
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Deal Dashboard
  // ══════════════════════════════════════════════════════════════════════════
  function renderDashboard() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Profile header */}
        <div style={{ ...glass, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
            border: '2px solid #8DC63F', flexShrink: 0,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}>
            {profile?.profilePhoto ? (
              <img src={profile.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>My Deals</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {profile?.fullName ?? 'Verified Seller'}
              {profile?.businessName ? ` - ${profile.businessName}` : ''}
            </div>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 20,
            backgroundColor: 'rgba(141,198,63,0.15)',
            fontSize: 11, fontWeight: 800, color: '#8DC63F',
          }}>
            Verified
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Active', value: activeCount, color: '#8DC63F' },
            { label: 'Claims', value: claimsCount, color: '#ffd43b' },
            { label: 'Expired', value: expiredCount, color: '#ff6b6b' },
          ].map(stat => (
            <div key={stat.label} style={{
              ...glass, textAlign: 'center', padding: '14px 8px',
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Post New Deal button */}
        <button
          onClick={() => onCreateDeal?.()}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: 'linear-gradient(135deg, #8DC63F 0%, #6ba52a 100%)',
            border: 'none', color: '#fff', fontSize: 16, fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Post New Deal
        </button>

        {/* My deals list */}
        {myDeals.length === 0 ? (
          <div style={{ ...glass, textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>&#128722;</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>No deals yet</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Tap "Post New Deal" to create your first deal
            </div>
          </div>
        ) : (
          myDeals.map(deal => {
            const badge = statusBadge(deal)
            const discount = deal.discount_pct ?? (deal.original_price && deal.deal_price
              ? Math.round((1 - deal.deal_price / deal.original_price) * 100)
              : 0)
            return (
              <div key={deal.id} style={{ ...glass, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Deal thumbnail */}
                  {deal.images?.[0] && (
                    <div style={{
                      width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
                      flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.06)',
                    }}>
                      <img src={deal.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {deal.title}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                        backgroundColor: badge.bg, color: badge.color, flexShrink: 0,
                      }}>
                        {badge.label}
                      </span>
                    </div>
                    {discount > 0 && (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 8,
                        backgroundColor: 'rgba(255,212,59,0.15)', color: '#ffd43b',
                        fontSize: 12, fontWeight: 800, marginBottom: 4,
                      }}>
                        {discount}% OFF
                      </span>
                    )}
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {deal.claim_count ?? deal.quantity_claimed ?? 0}/{deal.quantity ?? deal.quantity_available ?? 0} claimed
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleDealStatus(deal.id)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      backgroundColor: deal.status === 'active' ? 'rgba(255,200,0,0.15)' : 'rgba(141,198,63,0.15)',
                      border: 'none',
                      color: deal.status === 'active' ? '#ffd43b' : '#8DC63F',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    }}
                  >
                    {deal.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteDeal(deal.id)}
                    style={{
                      padding: '10px 16px', borderRadius: 12,
                      backgroundColor: 'rgba(255,60,60,0.1)',
                      border: 'none', color: '#ff6b6b',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }
}
