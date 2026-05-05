import { useRef, useState, useEffect } from 'react'
import { saveProfile, uploadAvatar } from '@/services/profileService'
import { useAuth } from '@/hooks/useAuth'
import { sendPhoneOTP, verifyOTP } from '@/services/authService'
import { saveAddress } from '@/services/addressService'
import { useLanguage } from '@/i18n'
import styles from './JoinSheet.module.css'

// ── Same time-based background as home & location screens ──
const BG_IMAGES = {
  sunrise: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  day:     'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  night:   'https://ik.imagekit.io/nepgaxllc/Untitledfsdf.png?updatedAt=1775555383465',
}

function getWIBHour() {
  // Use user's local time so background matches their actual daylight
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

function getBGPhase(h) {
  if (h >= 5   && h < 7.5)  return 'sunrise'
  if (h >= 7.5 && h < 17.5) return 'day'
  if (h >= 17.5 && h < 19.5) return 'sunset'
  return 'night'
}

function getSunsetProgress(h) {
  if (h < 17.5 || h >= 19.5) return 0
  return (h - 17.5) / 2
}

// Steps: phone → otp → profile
export default function JoinSheet({ open, onClose, initialStep = 'phone' }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const fileRef = useRef()

  const [step, setStep]   = useState(initialStep)
  const [localNum, setLocalNum]   = useState('')
  const [otp, setOtp]             = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [name, setName]           = useState('')
  const [address, setAddress]     = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [locatingAddr, setLocatingAddr] = useState(false)

  // ── Time-based background ──
  const [hour, setHour]           = useState(getWIBHour)
  const [imgLoaded, setImgLoaded] = useState({})

  useEffect(() => {
    const id = setInterval(() => setHour(getWIBHour()), 60_000)
    return () => clearInterval(id)
  }, [])

  const bgPhase    = getBGPhase(hour)
  const bgProgress = getSunsetProgress(hour)
  const bgIsSunset = bgPhase === 'sunset'
  const bgIsNight  = bgPhase === 'night'
  const bgIsDay    = bgPhase === 'day'
  const bgSrc      = bgIsDay ? BG_IMAGES.day : bgIsNight ? BG_IMAGES.night : BG_IMAGES.sunrise
  const bgNightFade    = bgIsSunset ? bgProgress : 0
  const bgOverlayOpacity = bgIsSunset ? Math.sin(bgProgress * Math.PI) * 0.45 : 0
  const markBgLoaded = (key) => setImgLoaded(prev => ({ ...prev, [key]: true }))

  const DIAL_CODE = '+62'
  const fullPhone = DIAL_CODE + localNum.replace(/^\s*0+/, '').replace(/\D/g, '')

  const reset = () => {
    setStep(initialStep)
    setLocalNum(''); setOtp('')
    setConfirmation(null); setName(''); setAddress('')
    setPhotoFile(null); setPhotoPreview(null)
    setLoading(false); setError(null); setLocatingAddr(false)
  }

  const handleClose = () => { reset(); onClose() }

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true'

  // ── Phone: send OTP ──
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (isDemo) {
      // Demo mode — skip OTP, go straight to profile
      setTimeout(() => { setStep('profile'); setLoading(false) }, 800)
      return
    }
    try {
      const result = await sendPhoneOTP(fullPhone)
      setConfirmation(result)
      setStep('otp')
    } catch (err) {
      setError(err.message ?? 'Could not send code. Check the number.')
    }
    setLoading(false)
  }

  // ── OTP: verify ──
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (isDemo) {
      setTimeout(() => { setStep('profile'); setLoading(false) }, 600)
      return
    }
    try {
      await verifyOTP(confirmation, otp)
      setStep('profile')
    } catch {
      setError('Invalid code. Please try again.')
    }
    setLoading(false)
  }

  // ── GPS: auto-fill address from current location ──
  const handleDetectAddress = () => {
    if (!navigator.geolocation) return
    setLocatingAddr(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          // Reverse geocode via Google (or fallback to coords)
          const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
          if (key) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}&language=id`)
            const data = await res.json()
            if (data.results?.[0]) {
              setAddress(data.results[0].formatted_address)
              setLocatingAddr(false)
              return
            }
          }
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        } catch { /* fallback handled */ }
        setLocatingAddr(false)
      },
      () => setLocatingAddr(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Profile: save name + photo + address ──
  const handleProfileSave = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      if (isDemo) {
        // Demo mode — save to localStorage and enter app
        localStorage.setItem('indoo_demo_profile', JSON.stringify({ name: name.trim(), address: address.trim(), phone: fullPhone, photo: photoPreview }))
        setTimeout(() => { handleClose() }, 600)
        setLoading(false)
        return
      }
      const uid = user?.id ?? user?.uid
      if (uid) {
        if (photoFile) await uploadAvatar(uid, photoFile)
        await saveProfile({ userId: uid, displayName: name.trim() })
        if (address.trim()) {
          await saveAddress(uid, { label: 'Home', address: address.trim(), isDefault: true })
        }
      }
      handleClose()
    } catch (err) {
      setError(err.message ?? 'Could not save profile.')
    }
    setLoading(false)
  }


  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && handleClose()}>

      {/* ── Time-based background images ── */}
      <img
        key={bgSrc}
        src={bgSrc}
        alt=""
        className={`${styles.bgLayer} ${imgLoaded[bgSrc] ? styles.bgLayerVisible : ''}`}
        onLoad={() => markBgLoaded(bgSrc)}
        draggable={false}
      />
      {bgIsSunset && (
        <img
          src={BG_IMAGES.night}
          alt=""
          className={styles.bgLayer}
          style={{ opacity: bgNightFade, transition: 'opacity 4s ease' }}
          draggable={false}
        />
      )}
      {bgOverlayOpacity > 0 && (
        <div className={styles.bgSunsetOverlay} style={{ opacity: bgOverlayOpacity }} />
      )}
      <div className={styles.cityShimmer} />

      {/* Logo — hero area centered */}
      <div className={styles.heroLogo}>
        <img
          src="https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926"
          alt="INDOO"
          className={styles.headerLogo}
          draggable={false}
        />
        <span className={styles.heroSlogan}>Indonesia's Superapp</span>
      </div>

      <div className={styles.sheet}>
        <div className={styles.handle} onClick={handleClose} />

        {/* ── STEP: phone number ── */}
        {step === 'phone' && (
          <div className={styles.content}>
            <h2 className={`${styles.title} ${styles.titleShine}`}>{t('join.phone.title')}</h2>
            <p className={styles.sub}>{t('join.phone.sub')}</p>

            {error && <p className={styles.error}>{error}</p>}

            <form className={styles.form} onSubmit={handleSendOTP}>
              <div className={styles.phoneRow}>
                <div className={styles.dialBadge}>
                  <span>🇮🇩</span>
                  <span>{DIAL_CODE}</span>
                </div>
                <input
                  className={styles.phoneInput}
                  type="tel"
                  placeholder={t('join.phone.placeholder')}
                  value={localNum}
                  onChange={e => setLocalNum(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={loading || localNum.trim().length < 6}
              >
                {loading ? t('join.phone.sending') : t('join.phone.send')}
              </button>
            </form>

          </div>
        )}

        {/* ── STEP: OTP ── */}
        {step === 'otp' && (
          <div className={styles.content}>
            <img
              src="https://ik.imagekit.io/nepgaxllc/Futuristic%20biker%20in%20sleek%20gear.png"
              alt=""
              className={styles.otpBikerImg}
              aria-hidden="true"
            />
            <h2 className={styles.title}>{t('join.otp.title')}</h2>
            <p className={styles.sub}>{t('join.otp.sentTo')} {fullPhone}</p>

            {error && <p className={styles.error}>{error}</p>}

            <form className={styles.form} onSubmit={handleVerifyOTP}>
              <input
                className={`${styles.input} ${styles.otpInput}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                autoFocus
                required
              />
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={loading || otp.length < 4}
              >
                {loading ? t('join.otp.verifying') : t('join.otp.verify')}
              </button>
            </form>

            <button
              type="button"
              className={styles.skipBtn}
              onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
            >
              {t('join.otp.change')}
            </button>
          </div>
        )}

        {/* ── STEP: profile ── */}
        {step === 'profile' && (
          <div className={styles.content}>
            {/* Right-side decorative image */}
            <img
              src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdfdasdadasd-removebg-preview.png?updatedAt=1775663126206"
              alt=""
              className={styles.profileStepImg}
              aria-hidden="true"
            />

            <h2 className={`${styles.title} ${styles.titleShine}`}>{t('join.profile.title')}</h2>
            <p className={styles.sub}>{t('join.profile.sub')}</p>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.photoRow}>
              <button
                className={styles.photoCircle}
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                {photoPreview
                  ? <img src={photoPreview} alt="Preview" className={styles.photoImg} />
                  : <span className={styles.cameraIcon}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </span>
                }
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className={styles.hidden}
                onChange={handlePhotoChange}
              />
              <button
                className={styles.photoLabel}
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                {photoPreview ? t('join.profile.changePhoto') : t('join.profile.addPhoto')}
              </button>
            </div>

            <input
              className={styles.input}
              type="text"
              placeholder={t('join.profile.name')}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              autoFocus
            />

            {/* Address — one-time capture, used by all modules */}
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                className={styles.input}
                type="text"
                placeholder="Delivery address (home, office, etc.)"
                value={address}
                onChange={e => setAddress(e.target.value)}
                maxLength={200}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={handleDetectAddress}
                disabled={locatingAddr}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, borderRadius: 10, border: 'none',
                  background: locatingAddr ? 'rgba(141,198,63,0.3)' : 'rgba(141,198,63,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
                title="Use current location"
              >
                {locatingAddr ? (
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #8DC63F', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                  </svg>
                )}
              </button>
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: -6, display: 'block' }}>
              Used for food delivery, rides & parcels — you can add more later
            </span>

            <button
              className={styles.primaryBtn}
              onClick={handleProfileSave}
              disabled={!name.trim() || loading}
            >
              {loading ? t('join.profile.saving') : t('join.profile.save')}
            </button>

            <button className={styles.skipBtn} onClick={handleClose}>
              {t('join.profile.skip')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
