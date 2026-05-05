import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/uploadImage'
import { getKTPStatus } from '@/services/ktpVerificationService'
import KTPVerification from '@/components/verification/KTPVerification'
import styles from './VendorOnboarding.module.css'

// ── Cuisine options (big icon buttons) ──────────────────────────────────────
const CUISINES = [
  { id: 'rice',        emoji: '\u{1F35A}', label: 'Rice & Nasi'    },
  { id: 'noodles',     emoji: '\u{1F35C}', label: 'Noodles & Mie'  },
  { id: 'chicken',     emoji: '\u{1F357}', label: 'Chicken & Ayam' },
  { id: 'western',     emoji: '\u{1F354}', label: 'Western'        },
  { id: 'japanese',    emoji: '\u{1F363}', label: 'Japanese'       },
  { id: 'padang',      emoji: '\u{1F958}', label: 'Padang'         },
  { id: 'drinks',      emoji: '\u{1F964}', label: 'Drinks'         },
  { id: 'street_food', emoji: '\u{1F362}', label: 'Street Food'    },
  { id: 'pizza',       emoji: '\u{1F355}', label: 'Pizza & Pasta'  },
  { id: 'other',       emoji: '\u{1F4E6}', label: 'Other'          },
]

const CITIES = [
  'Yogyakarta', 'Jakarta', 'Bandung', 'Surabaya', 'Semarang',
  'Bali', 'Medan', 'Makassar', 'Solo', 'Malang',
]

const BANKS = ['BCA', 'BRI', 'Mandiri', 'BNI', 'BSI', 'CIMB', 'Danamon', 'Other']

const MENU_CATEGORIES = ['Main', 'Sides', 'Drinks', 'Snacks', 'Desserts']

// ── Reusable help tooltip ───────────────────────────────────────────────────
function HelpTip({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)',
        color: '#8DC63F', fontSize: 12, fontWeight: 900,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>?</button>
      {open && createPortal(
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1a1a1e', border: '1px solid rgba(141,198,63,0.2)',
            borderRadius: 20, padding: '24px 20px', maxWidth: 320, width: '100%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4A1}'}</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>{text}</p>
            <button onClick={() => setOpen(false)} style={{
              marginTop: 16, padding: '10px 32px', borderRadius: 10,
              background: '#8DC63F', border: 'none', color: '#000',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}>Got it!</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Toggle switch ───────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
      onClick={() => onChange(!value)}
    >
      <div className={`${styles.toggleKnob} ${value ? styles.toggleKnobOn : ''}`} />
    </button>
  )
}

// ── Main wizard ─────────────────────────────────────────────────────────────
export default function VendorOnboarding({ open, onClose, onComplete, userId }) {
  const [ktpStatus, setKtpStatus] = useState(null) // null = loading
  const [ktpOpen, setKtpOpen] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    getKTPStatus(userId).then(s => setKtpStatus(s?.ktp_status ?? 'none'))
  }, [open, userId])

  // KTP gate — must be verified before vendor onboarding
  if (open && ktpStatus !== null && ktpStatus !== 'approved') {
    // Demo mode bypass
    if (import.meta.env.VITE_DEMO_MODE !== 'true') {
      return (
        <>
          {createPortal(
            <div style={{ position: 'fixed', inset: 0, zIndex: 9800, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(250,204,21,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px', textAlign: 'center' }}>Identity Verification Required</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.6 }}>
                To protect buyers and sellers, all vendors must verify their identity with KTP before listing on INDOO.
              </p>
              <button onClick={() => setKtpOpen(true)} style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: '#8DC63F', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', marginBottom: 12 }}>
                Verify Now
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer' }}>
                Maybe later
              </button>
            </div>,
            document.body
          )}
          <KTPVerification
            open={ktpOpen}
            onClose={() => setKtpOpen(false)}
            onVerified={() => { setKtpOpen(false); setKtpStatus('pending') }}
          />
        </>
      )
    }
  }

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const photoInputRef = useRef(null)
  const dishPhotoInputRef = useRef(null)
  const qrisInputRef = useRef(null)

  // Step 1 — Restaurant info
  const [vendorType, setVendorType] = useState(null) // 'restaurant' | 'street_vendor'
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)

  // Step 2 — Location
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)

  // Step 3 — Menu
  const [dishes, setDishes] = useState([])
  const [showDishForm, setShowDishForm] = useState(false)
  const [dishName, setDishName] = useState('')
  const [dishPrice, setDishPrice] = useState('')
  const [dishCategory, setDishCategory] = useState('Main')
  const [dishPhotoUrl, setDishPhotoUrl] = useState(null)
  const [dishPhotoFile, setDishPhotoFile] = useState(null)

  // Step 4 — Payment
  const [bank, setBank] = useState(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [qrisUrl, setQrisUrl] = useState(null)

  if (!open) return null

  const TOTAL_STEPS = 5

  // ── Validation per step ─────────────────────────────────────────────────
  const canNext = () => {
    if (step === 0) return vendorType !== null && name.trim().length > 0 && cuisine !== null
    if (step === 1) return city.length > 0 && address.trim().length > 0
    if (step === 2) return dishes.length >= 5
    if (step === 3) return (bank && accountNumber.trim() && accountHolder.trim()) || qrisUrl
    return true
  }

  // ── Photo upload handler ────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoUrl(URL.createObjectURL(file))
  }

  const handleDishPhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDishPhotoFile(file)
    setDishPhotoUrl(URL.createObjectURL(file))
  }

  const handleQrisChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadImage(file, 'qris')
      setQrisUrl(url)
    } catch { /* ignore */ }
  }

  // ── GPS ─────────────────────────────────────────────────────────────────
  const handleGps = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Add dish ────────────────────────────────────────────────────────────
  const saveDish = () => {
    if (!dishName.trim() || !dishPrice) return
    setDishes(prev => [...prev, {
      id: Date.now(),
      name: dishName.trim(),
      price: Number(dishPrice),
      category: dishCategory,
      photo_url: dishPhotoUrl,
      _file: dishPhotoFile,
      is_available: true,
    }])
    setDishName('')
    setDishPrice('')
    setDishCategory('Main')
    setDishPhotoUrl(null)
    setDishPhotoFile(null)
    setShowDishForm(false)
  }

  const removeDish = (id) => {
    setDishes(prev => prev.filter(d => d.id !== id))
  }

  const toggleDish = (id) => {
    setDishes(prev => prev.map(d => d.id === id ? { ...d, is_available: !d.is_available } : d))
  }

  // ── Complete — save to Supabase + localStorage ──────────────────────────
  const handleComplete = async () => {
    setSaving(true)
    try {
      // Upload restaurant photo if we have a file
      let finalPhotoUrl = photoUrl
      if (photoFile) {
        try {
          finalPhotoUrl = await uploadImage(photoFile, 'restaurants')
        } catch { /* keep blob url */ }
      }

      // Upload dish photos
      const finalDishes = await Promise.all(dishes.map(async (d) => {
        let url = d.photo_url
        if (d._file) {
          try { url = await uploadImage(d._file, 'dishes') } catch { /* keep blob */ }
        }
        const { _file, ...rest } = d
        return { ...rest, photo_url: url }
      }))

      const cuisineObj = CUISINES.find(c => c.id === cuisine)

      const restaurantData = {
        user_id: userId,
        name: name.trim(),
        vendor_type: vendorType ?? 'restaurant',
        cuisine_type: cuisineObj?.label ?? cuisine,
        cover_url: finalPhotoUrl,
        city,
        address: address.trim(),
        lat, lng,
        phone: null,
        is_open: true,
        status: 'pending',
        bank: (bank && accountNumber.trim() && accountHolder.trim())
          ? { name: bank, account_number: accountNumber.trim(), account_holder: accountHolder.trim() }
          : null,
        qris_url: qrisUrl,
        menu_items: finalDishes.map((d, i) => ({
          id: i + 1,
          name: d.name,
          price: d.price,
          category: d.category,
          photo_url: d.photo_url,
          is_available: d.is_available,
        })),
      }

      // Save to Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('restaurants')
          .insert([{
            user_id: restaurantData.user_id,
            name: restaurantData.name,
            cuisine_type: restaurantData.cuisine_type,
            cover_url: restaurantData.cover_url,
            city: restaurantData.city,
            address: restaurantData.address,
            lat: restaurantData.lat,
            lng: restaurantData.lng,
            is_open: restaurantData.is_open,
            status: restaurantData.status,
            bank: restaurantData.bank,
            qris_url: restaurantData.qris_url,
            menu_items: restaurantData.menu_items,
          }])
          .select()
          .single()

        if (!error && data) {
          restaurantData.id = data.id
        }
      }

      // Save to localStorage
      localStorage.setItem('indoo_vendor_restaurant', JSON.stringify(restaurantData))

      if (onComplete) onComplete(restaurantData)
    } catch (err) {
      console.error('VendorOnboarding save error:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── Step navigation ─────────────────────────────────────────────────────
  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1)
  }
  const goBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const cuisineObj = CUISINES.find(c => c.id === cuisine)

  return createPortal(
    <div className={styles.overlay}>
      {/* Close button */}
      <button className={styles.closeBtn} onClick={onClose}>{'\u2715'}</button>

      {/* Progress dots */}
      <div className={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`${styles.dot} ${i === step ? styles.dotActive : ''} ${i < step ? styles.dotDone : ''}`} />
            {i < TOTAL_STEPS - 1 && (
              <div className={`${styles.dotLine} ${i < step ? styles.dotLineDone : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Steps container */}
      <div className={styles.stepsWrapper}>
        <div
          className={styles.stepsTrack}
          style={{ transform: `translateX(-${step * 100}%)` }}
        >

          {/* ── STEP 1: Restaurant info ──────────────────────────────────── */}
          <div className={styles.step}>
            <img className={styles.stepHero} src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2006_35_28%20AM.png?updatedAt=1776814549960" alt="" />
            <h2 className={styles.stepTitle}>Daftarkan Bisnis Anda</h2>
            <p className={styles.stepSubtitle}>Register your food business on INDOO Street</p>

            {/* Vendor type selector */}
            <div className={styles.glassCard}>
              <label className={styles.fieldLabel}>
                What type of business?
                <HelpTip text="Choose 'Street Vendor' if you sell from a cart, warung, or kaki lima. Choose 'Restaurant' if you have a permanent building with seating." />
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setVendorType('street_vendor')}
                  style={{
                    flex: 1, padding: '16px 10px', borderRadius: 16, border: 'none', cursor: 'pointer',
                    background: vendorType === 'street_vendor' ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)',
                    outline: vendorType === 'street_vendor' ? '1.5px solid rgba(250,204,21,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 32 }}>{'\u{1F35C}'}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: vendorType === 'street_vendor' ? '#FACC15' : 'rgba(255,255,255,0.5)' }}>Street Vendor</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Warung, Kaki Lima, Cart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVendorType('restaurant')}
                  style={{
                    flex: 1, padding: '16px 10px', borderRadius: 16, border: 'none', cursor: 'pointer',
                    background: vendorType === 'restaurant' ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.03)',
                    outline: vendorType === 'restaurant' ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 32 }}>{'\u{1F37D}\u{FE0F}'}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: vendorType === 'restaurant' ? '#8DC63F' : 'rgba(255,255,255,0.5)' }}>Restaurant</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Cafe, Rumah Makan</span>
                </button>
              </div>
            </div>

            <div className={styles.glassCard}>
              <div className={styles.fieldGroup} style={{ marginBottom: 0 }}>
                <label className={styles.fieldLabel}>
                  {vendorType === 'street_vendor' ? 'Vendor Name' : 'Restaurant Name'}
                  <HelpTip text="This is the name customers will see. Use the name your customers already know — even if it's just your name + food type." />
                </label>
              <input
                className={styles.input}
                type="text"
                placeholder={vendorType === 'street_vendor' ? 'e.g. Bakso Pak Budi' : 'e.g. Warung Bu Sari'}
                value={name}
                onChange={e => setName(e.target.value)}
              />
              </div>
            </div>

            <div className={styles.glassCard}>
              <label className={styles.fieldLabel}>
                Cuisine Type
                <HelpTip text="Pick the type of food you sell most. This helps customers find you when they search." />
              </label>
              <div className={styles.cuisineGrid}>
                {CUISINES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.cuisineBtn} ${cuisine === c.id ? styles.cuisineBtnActive : ''}`}
                    onClick={() => setCuisine(c.id)}
                  >
                    <span className={styles.cuisineEmoji}>{c.emoji}</span>
                    <span className={styles.cuisineLabel}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.glassCard}>
              <label className={styles.fieldLabel}>
                {vendorType === 'street_vendor' ? 'Vendor Photo' : 'Restaurant Photo'}
                <HelpTip text="Upload a photo of your restaurant or food stall. Customers love seeing where their food comes from!" />
              </label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <div
                className={styles.photoUpload}
                onClick={() => photoInputRef.current?.click()}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="" className={styles.photoPreview} />
                ) : (
                  <>
                    <span className={styles.photoUploadIcon}>{'\u{1F4F7}'}</span>
                    <span className={styles.photoUploadText}>Tap to upload photo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── STEP 2: Location ─────────────────────────────────────────── */}
          <div className={styles.step}>
            <div className={styles.stepIcon}>{'\u{1F4CD}'}</div>
            <h2 className={styles.stepTitle}>Lokasi</h2>
            <p className={styles.stepSubtitle}>Where is your restaurant?</p>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                City
                <HelpTip text="We need your location so customers near you can find your restaurant." />
              </label>
              <select
                className={styles.select}
                value={city}
                onChange={e => setCity(e.target.value)}
              >
                <option value="">Select city...</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Street Address
                <HelpTip text="Enter your street address so delivery drivers can find you easily." />
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Jl. Malioboro 45"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <button
                type="button"
                className={styles.gpsBtn}
                onClick={handleGps}
                disabled={gpsLoading}
              >
                <span style={{ fontSize: 20 }}>{'\u{1F4F1}'}</span>
                {gpsLoading ? 'Getting location...' : lat ? `Location saved \u2713` : 'Use My Location'}
              </button>
              {lat && (
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'rgba(141,198,63,0.7)' }}>
                  GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 3: Menu ─────────────────────────────────────────────── */}
          <div className={styles.step}>
            <div className={styles.stepIcon}>{'\u{1F4CB}'}</div>
            <h2 className={styles.stepTitle}>Menu Kamu</h2>
            <p className={styles.stepSubtitle}>Add your dishes - you can always add more later</p>

            {/* Dish form */}
            {showDishForm ? (
              <div className={styles.dishForm}>
                <div className={styles.fieldGroup} style={{ marginBottom: 10 }}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Dish name"
                    value={dishName}
                    onChange={e => setDishName(e.target.value)}
                  />
                </div>
                <div className={styles.dishFormRow}>
                  <div className={styles.rpInput} style={{ flex: 1 }}>
                    <span className={styles.rpPrefix}>Rp</span>
                    <input
                      className={styles.rpField}
                      type="number"
                      placeholder="Price"
                      value={dishPrice}
                      onChange={e => setDishPrice(e.target.value)}
                    />
                  </div>
                  <select
                    className={styles.select}
                    style={{ width: 'auto', flex: '0 0 120px' }}
                    value={dishCategory}
                    onChange={e => setDishCategory(e.target.value)}
                  >
                    {MENU_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    ref={dishPhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDishPhotoChange}
                    style={{ display: 'none' }}
                  />
                  <div
                    className={styles.dishPhotoUpload}
                    onClick={() => dishPhotoInputRef.current?.click()}
                  >
                    {dishPhotoUrl ? (
                      <img src={dishPhotoUrl} alt="" className={styles.dishPhotoUploadImg} />
                    ) : (
                      <span style={{ fontSize: 20, color: 'rgba(141,198,63,0.5)' }}>{'\u{1F4F7}'}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Photo (optional)</span>
                </div>
                <div className={styles.dishFormActions}>
                  <button type="button" className={styles.dishCancelBtn} onClick={() => {
                    setShowDishForm(false)
                    setDishName('')
                    setDishPrice('')
                    setDishPhotoUrl(null)
                    setDishPhotoFile(null)
                  }}>Cancel</button>
                  <button
                    type="button"
                    className={styles.dishSaveBtn}
                    onClick={saveDish}
                    disabled={!dishName.trim() || !dishPrice}
                  >Save Dish</button>
                </div>
              </div>
            ) : (
              <button type="button" className={styles.addDishBtn} onClick={() => setShowDishForm(true)}>
                <span style={{ fontSize: 20 }}>+</span> Add Dish
              </button>
            )}

            {/* Help tip */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <HelpTip text="Add at least 5 dishes to get started. This helps customers see your full menu. You can add photos and more dishes later from your dashboard." />
            </div>

            {/* Dish list */}
            {dishes.map(d => (
              <div key={d.id} className={styles.dishCard}>
                {d.photo_url ? (
                  <img src={d.photo_url} alt="" className={styles.dishPhoto} />
                ) : (
                  <div className={styles.dishPhotoPlaceholder}>{'\u{1F372}'}</div>
                )}
                <div className={styles.dishInfo}>
                  <div className={styles.dishName}>{d.name}</div>
                  <div className={styles.dishPrice}>Rp {Number(d.price).toLocaleString('id-ID')}</div>
                </div>
                <Toggle value={d.is_available} onChange={() => toggleDish(d.id)} />
                <button type="button" className={styles.dishRemove} onClick={() => removeDish(d.id)}>{'\u2715'}</button>
              </div>
            ))}

            {/* Counter */}
            <div className={`${styles.dishCounter} ${dishes.length >= 3 ? styles.dishCounterDone : ''}`}>
              {dishes.length}/5 dishes added {dishes.length >= 5 ? '\u2713' : `— add ${5 - dishes.length} more`}
            </div>
          </div>

          {/* ── STEP 4: Payment ──────────────────────────────────────────── */}
          <div className={styles.step}>
            <div className={styles.stepIcon}>{'\u{1F4B3}'}</div>
            <h2 className={styles.stepTitle}>Pembayaran</h2>
            <p className={styles.stepSubtitle}>How do customers pay you?</p>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Bank
                <HelpTip text="Your customers will pay you directly. Add your bank details or QRIS code so they know where to send payment." />
              </label>
              <div className={styles.bankGrid}>
                {BANKS.map(b => (
                  <button
                    key={b}
                    type="button"
                    className={`${styles.bankBtn} ${bank === b ? styles.bankBtnActive : ''}`}
                    onClick={() => setBank(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Account Number</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. 1234 5678 90"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Account Holder Name</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Sari Warung Jogja"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
              />
            </div>

            <div className={styles.orDivider}>
              <div className={styles.orLine} />
              <span className={styles.orText}>OR</span>
              <div className={styles.orLine} />
            </div>

            <input
              ref={qrisInputRef}
              type="file"
              accept="image/*"
              onChange={handleQrisChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className={styles.qrisBtn}
              onClick={() => qrisInputRef.current?.click()}
            >
              <span style={{ fontSize: 20 }}>{'\u{1F4F7}'}</span>
              {qrisUrl ? 'QRIS Uploaded \u2713' : 'Upload QRIS Code'}
            </button>
          </div>

          {/* ── STEP 5: Complete ─────────────────────────────────────────── */}
          <div className={styles.step}>
            <div className={styles.checkAnim}>
              <span className={styles.checkIcon}>{'\u2705'}</span>
            </div>
            <h2 className={styles.stepTitle}>Siap!</h2>
            <p className={styles.stepSubtitle}>Your restaurant is now on Indoo!</p>

            {/* Preview card */}
            <div className={styles.previewCard}>
              {photoUrl && (
                <img src={photoUrl} alt="" className={styles.previewPhoto} />
              )}
              <div className={styles.previewName}>{name}</div>
              <div className={styles.previewMeta}>
                {cuisineObj?.emoji} {cuisineObj?.label} {'\u00B7'} {city}
              </div>
              <div className={styles.previewMeta} style={{ marginTop: 4 }}>
                {dishes.length} dishes on your menu
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom nav ─────────────────────────────────────────────────── */}
      <div className={styles.navBar}>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <button type="button" className={styles.backBtn} onClick={goBack}>Back</button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            className={styles.nextBtn}
            disabled={!canNext()}
            onClick={goNext}
          >
            {step === 0 ? 'Next' : step === 1 ? 'Next' : step === 2 ? 'Next' : 'Next'}
          </button>
        ) : (
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleComplete}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Start Receiving Orders'}
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
