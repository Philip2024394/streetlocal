/**
 * ProfileScreen — thin orchestrator shell.
 *
 * All state lives here. Sub-components receive only what they need as props.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMySession } from '@/hooks/useMySession'
import { getSearchKeywords } from '@/utils/lookingForLabels'
import LookingForSheet from '@/components/ui/LookingForSheet'
import IntentGrid from '@/components/ui/IntentGrid'
import CuisineSheet from '@/components/ui/CuisineSheet'
import TradeRoleSheet from '@/components/ui/TradeRoleSheet'
import ShopTypeSheet from '@/components/ui/ShopTypeSheet'
import DatingPickerSheet from '@/components/dating/DatingPickerSheet'
import LanguagePickerSheet from '@/components/ui/LanguagePickerSheet'
import Toast from '@/components/ui/Toast'
import { saveProfile, uploadAvatar, uploadGalleryPhoto } from '@/services/profileService'
import { endSession } from '@/services/sessionService'
import GoOutSetup from '../GoOutSetup'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import { useIpCountry } from '@/hooks/useIpCountry'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { fetchDriverPendingBooking } from '@/services/bookingService'
import SideDrawer from '@/components/ui/SideDrawer'
import MicroShop from '@/components/ui/MicroShop'
import QAFeedScreen from '@/components/community/QAFeedScreen'
import styles from '../ProfileScreen.module.css'

import ProfileHeader from './ProfileHeader'
import ProfileBioSection, { MAKER_CATEGORIES, COUNTRY_NATIVE_LANGUAGE, DATING_REL_GOAL_OPTIONS, DATING_STAR_SIGNS } from './ProfileBioSection'
import ProfileShopSection from './ProfileShopSection'
import ProfilePrivacySection from './ProfilePrivacySection'

// ── Region pricing ────────────────────────────────────────────────────────────
const EU_COUNTRIES = new Set([
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark',
  'Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy',
  'Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland','Portugal',
  'Romania','Slovakia','Slovenia','Spain','Sweden','Norway','Iceland','Switzerland',
])
const ASIA_COUNTRIES = new Set([
  'India','Pakistan','Bangladesh','Sri Lanka','Nepal','Myanmar','Cambodia',
  'Vietnam','Thailand','Malaysia','Indonesia','Philippines','Singapore',
  'Japan','South Korea','China','Mongolia','Kazakhstan','Kyrgyzstan',
  'Uzbekistan','Azerbaijan','Georgia','Armenia','Lebanon','Jordan','Iraq','Iran',
])
function getRegionPricing(country) {
  if (!country) return { display: '$1.99', note: 'USD' }
  if (country === 'United Kingdom')    return { display: '£1.99', note: 'GBP' }
  if (country === 'Australia')         return { display: 'A$1.99', note: 'AUD' }
  if (EU_COUNTRIES.has(country))       return { display: '€1.99', note: 'EUR' }
  if (ASIA_COUNTRIES.has(country))     return { display: '$1.50', note: 'USD' }
  return { display: '$1.99', note: 'USD' }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateProfile({ name, dobDay, dobMonth, dobYear, country, city }) {
  if (!name.trim())                     return 'Please enter your display name so others can find you.'
  if (!dobDay || !dobMonth || !dobYear) return 'Please complete your date of birth — you must be 18 or over to use Indoo.'
  if (!country)                         return 'Please select your country so we can show you to the right people.'
  if (!city.trim())                     return 'Please add your city or area — without it you won\'t appear in map searches near you.'
  return null
}

const STATUS_CONFIG = {
  live:      { label: "I'M OUT NOW",   cls: 'bannerLive',      dot: 'dotLive'      },
  scheduled: { label: "I'M OUT LATER", cls: 'bannerScheduled', dot: 'dotScheduled' },
  online:    { label: "I'M ONLINE",    cls: 'bannerOnline',    dot: 'dotOnline'    },
}

const DEFAULT_HOURS = { open: '', close: '', closed: false }
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseDob(dobStr) {
  if (!dobStr) return { day: '', month: '', year: '' }
  const [y, m, d] = dobStr.split('-')
  return { day: String(parseInt(d, 10)), month: String(parseInt(m, 10)), year: y }
}

export default function ProfileScreen({ onClose, onboarding = false }) {
  const { user, userProfile: authProfile } = useAuth()
  const { session: mySession } = useMySession()
  const ipCountry = useIpCountry()

  // Load demo profile from localStorage if no auth profile
  const demoProfile = (() => { try { return JSON.parse(localStorage.getItem('indoo_demo_profile') || '{}') } catch { return {} } })()
  const userProfile = authProfile ?? {
    displayName: demoProfile.name || 'You',
    photoURL: demoProfile.photo || null,
    city: 'Yogyakarta',
    country: 'Indonesia',
  }
  const pricing = getRegionPricing(ipCountry)

  // ── Activity / intent ────────────────────────────────────────────────────────
  const [selectedActivity, setSelectedActivity] = useState(userProfile?.activities?.[0] ?? null)
  const [expandedCategory, setExpandedCategory] = useState(null)

  // ── Core identity fields ─────────────────────────────────────────────────────
  const [name,    setName]    = useState(userProfile?.displayName ?? user?.displayName ?? 'You')
  const [country, setCountry] = useState(userProfile?.country ?? '')
  const [city,    setCity]    = useState(userProfile?.city ?? '')
  const [bio,     setBio]     = useState(userProfile?.bio ?? '')

  // ── Looking for ──────────────────────────────────────────────────────────────
  const [lookingFor,   setLookingFor]   = useState(userProfile?.lookingFor ?? '')
  const [enabledDomains, setEnabledDomains] = useState(userProfile?.enabledDomains ?? ['marketplace', 'dating', 'food', 'rides'])
  const [subCategory,  setSubCategory]  = useState(userProfile?.subCategory ?? null)
  const [intentGridOpen, setIntentGridOpen] = useState(false)
  const [lookingForOpen, setLookingForOpen] = useState(false)

  // ── Languages ────────────────────────────────────────────────────────────────
  const [speakingNative, setSpeakingNative] = useState(
    userProfile?.speakingNative ?? (userProfile?.country ? (COUNTRY_NATIVE_LANGUAGE[userProfile.country] ?? '') : '')
  )
  const [speakingSecond, setSpeakingSecond] = useState(userProfile?.speakingSecond ?? '')
  const [langPickerOpen, setLangPickerOpen] = useState(false)

  // ── Dating ───────────────────────────────────────────────────────────────────
  const [relationshipGoal, setRelationshipGoal] = useState(userProfile?.relationshipGoal ?? '')
  const [starSign,         setStarSign]         = useState(userProfile?.starSign ?? '')
  const [starSignOpen,     setStarSignOpen]      = useState(false)
  const [relGoalOpen,      setRelGoalOpen]       = useState(false)
  const [height,           setHeight]            = useState(userProfile?.height ?? '')
  const [dealBreakers,     setDealBreakers]      = useState(userProfile?.dealBreakers ?? '')

  // ── Driver ───────────────────────────────────────────────────────────────────
  const [incomingBooking, setIncomingBooking] = useState(null)
  const [activeTrip,      setActiveTrip]      = useState(null)
  const [earningsOpen,    setEarningsOpen]    = useState(false)
  const [restaurantDashOpen, setRestaurantDashOpen] = useState(false)
  const driverId = user?.uid ?? user?.id

  const [driverAge,    setDriverAge]    = useState(userProfile?.driver_age     ?? '')
  const [vehicleModel, setVehicleModel] = useState(userProfile?.vehicle_model  ?? '')
  const [vehicleYear,  setVehicleYear]  = useState(userProfile?.vehicle_year   ?? '')
  const [vehicleColor, setVehicleColor] = useState(userProfile?.vehicle_color  ?? '')
  const [platePrefix,  setPlatePrefix]  = useState(userProfile?.plate_prefix   ?? '')

  useEffect(() => {
    if (!userProfile?.is_driver) return
    const poll = async () => {
      const booking = await fetchDriverPendingBooking(driverId)
      if (!booking) return
      if (booking.status === 'pending') setIncomingBooking(prev => prev?.id === booking.id ? prev : booking)
      if (booking.status === 'accepted' || booking.status === 'in_progress') {
        setIncomingBooking(null)
        setActiveTrip(prev => prev?.id === booking.id ? prev : booking)
      }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [userProfile?.is_driver, driverId])

  // ── Business / shop fields ───────────────────────────────────────────────────
  const [priceMin,      setPriceMin]      = useState(userProfile?.priceMin ?? '')
  const [priceMax,      setPriceMax]      = useState(userProfile?.priceMax ?? '')
  const [market,        setMarket]        = useState(userProfile?.market ?? '')
  const [brandName,     setBrandName]     = useState(userProfile?.brandName ?? '')
  const [tradeRole,     setTradeRole]     = useState(userProfile?.tradeRole ?? '')
  const [cuisineType,   setCuisineType]   = useState(userProfile?.cuisineType ?? null)
  const [cuisineOpen,   setCuisineOpen]   = useState(false)
  const [tradeRoleOpen, setTradeRoleOpen] = useState(false)
  const [shopType,      setShopType]      = useState(userProfile?.shopType ?? null)
  const [shopTypeOpen,  setShopTypeOpen]  = useState(false)
  const [targetAudience, setTargetAudience] = useState(userProfile?.targetAudience ?? [])
  const [businessHours, setBusinessHours] = useState(
    userProfile?.businessHours ?? Object.fromEntries(DAYS.map(d => [d, { ...DEFAULT_HOURS }]))
  )
  const [instagramHandle, setInstagramHandle] = useState(userProfile?.instagram ?? '')
  const [tiktokHandle,    setTiktokHandle]    = useState(userProfile?.tiktok ?? '')
  const [facebookHandle,  setFacebookHandle]  = useState(userProfile?.facebook ?? '')
  const [websiteUrl,      setWebsiteUrl]      = useState(userProfile?.website ?? '')
  const [youtubeHandle,   setYoutubeHandle]   = useState(userProfile?.youtube ?? '')
  const [tags, setTags] = useState(userProfile?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [echoPanelOpen, setEchoPanelOpen]     = useState(false)
  const [bizWhatsapp,   setBizWhatsapp]       = useState(userProfile?.bizWhatsapp ?? '')
  const [bizCategory,   setBizCategory]       = useState(userProfile?.bizCategory ?? '')
  const [productCondition, setProductCondition] = useState(userProfile?.productCondition ?? 'new')

  // ── Voice intro ──────────────────────────────────────────────────────────────
  const [voiceIntroUrl,  setVoiceIntroUrl]  = useState(userProfile?.voice_intro_url ?? null)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [voiceProgress,  setVoiceProgress]  = useState(0)
  const voiceMediaRef = useRef(null)
  const voiceTimerRef = useRef(null)

  // ── Mood light ───────────────────────────────────────────────────────────────
  const [moodLight, setMoodLight] = useState(userProfile?.moodLight ?? '')

  // ── Status buttons ───────────────────────────────────────────────────────────
  const [pendingStatus,  setPendingStatus]  = useState(null)
  const [particles,      setParticles]      = useState([])
  const [showGoOutSetup, setShowGoOutSetup] = useState(false)
  const [showUpgrade,    setShowUpgrade]    = useState(false)
  const isFirstSave = !userProfile?.lookingFor

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const [profileTab, setProfileTab] = useState('profile')
  const tier    = userProfile?.tier ?? 'free'
  const hasShop = tier === 'premium' || tier === 'business'
  const [confirmedLinks, setConfirmedLinks] = useState({})

  // ── Q&A Feed ─────────────────────────────────────────────────────────────────
  const [qaFeedOpen, setQaFeedOpen] = useState(false)

  // ── Account drawer ───────────────────────────────────────────────────────────
  const [drawerOpen,      setDrawerOpen]      = useState(false)
  const [drawerSigningOut, setDrawerSigningOut] = useState(false)
  const [deleteStep,       setDeleteStep]      = useState(null)
  const [exportingData,    setExportingData]   = useState(false)
  const [resetPwStep,      setResetPwStep]     = useState(null)
  const { permission, requestPermission } = usePushNotifications()
  const [notifOn, setNotifOn] = useState(permission === 'granted')

  // ── DOB ──────────────────────────────────────────────────────────────────────
  const initDob = parseDob(userProfile?.dob)
  const [dobDay,   setDobDay]   = useState(initDob.day)
  const [dobMonth, setDobMonth] = useState(initDob.month)
  const [dobYear,  setDobYear]  = useState(initDob.year)
  const [saving,   setSaving]   = useState(false)

  // ── Photos ───────────────────────────────────────────────────────────────────
  const [photoURL,      setPhotoURL]      = useState(userProfile?.photoURL ?? user?.photoURL ?? null)
  const [photoFile,     setPhotoFile]     = useState(null)
  const [photoOffsetX,  setPhotoOffsetX]  = useState(userProfile?.photoOffsetX ?? 50)
  const [photoOffsetY,  setPhotoOffsetY]  = useState(userProfile?.photoOffsetY ?? 50)
  const [photoZoom,     setPhotoZoom]     = useState(userProfile?.photoZoom ?? 1)
  const [extraPhotos,     setExtraPhotos]     = useState(
    userProfile?.extraPhotos?.length ? [...userProfile.extraPhotos, null, null, null, null].slice(0, 4) : [null, null, null, null]
  )
  const [extraPhotoFiles, setExtraPhotoFiles] = useState([null, null, null, null])

  // ── Country typeahead ────────────────────────────────────────────────────────
  const [countryQuery, setCountryQuery] = useState(userProfile?.country ?? '')
  const [countryOpen,  setCountryOpen]  = useState(false)
  const countryRef = useRef(null)

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)
  function showToast(msg) { setToast({ message: msg, type: 'error' }) }

  // Close country dropdown on outside click
  useEffect(() => {
    function onOut(e) {
      if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  // Re-sync when userProfile loads
  useEffect(() => {
    if (!userProfile) return
    setName(userProfile.displayName ?? user?.displayName ?? 'You')
    const pd = parseDob(userProfile.dob)
    setDobDay(pd.day); setDobMonth(pd.month); setDobYear(pd.year)
    setCountry(userProfile.country ?? '')
    setCountryQuery(userProfile.country ?? '')
    setCity(userProfile.city ?? '')
    setLookingFor(userProfile.lookingFor ?? '')
    setSubCategory(userProfile.subCategory ?? null)
    setBio(userProfile.bio ?? '')
    setSpeakingNative(userProfile.speakingNative ?? (userProfile.country ? (COUNTRY_NATIVE_LANGUAGE[userProfile.country] ?? '') : ''))
    setSpeakingSecond(userProfile.speakingSecond ?? '')
    setPriceMin(userProfile.priceMin ?? '')
    setPriceMax(userProfile.priceMax ?? '')
    setMarket(userProfile.market ?? '')
    setBrandName(userProfile.brandName ?? '')
    setTradeRole(userProfile.tradeRole ?? '')
    setCuisineType(userProfile.cuisineType ?? null)
    setShopType(userProfile.shopType ?? null)
    setTargetAudience(userProfile.targetAudience ?? [])
    setBusinessHours(userProfile.businessHours ?? Object.fromEntries(DAYS.map(d => [d, { ...DEFAULT_HOURS }])))
    setTags(userProfile.tags ?? [])
    setPhotoURL(userProfile.photoURL ?? null)
    setPhotoOffsetX(userProfile.photoOffsetX ?? 50)
    setPhotoOffsetY(userProfile.photoOffsetY ?? 50)
    setPhotoZoom(userProfile.photoZoom ?? 1)
    setSelectedActivity(userProfile.activities?.[0] ?? null)
    const ep = userProfile.extraPhotos ?? []
    setExtraPhotos([ep[0] ?? null, ep[1] ?? null, ep[2] ?? null, ep[3] ?? null])
  }, [userProfile]) // eslint-disable-line

  async function handleNotifToggle() {
    if (notifOn) {
      setNotifOn(false)
    } else {
      const result = await requestPermission()
      if (result === 'granted') setNotifOn(true)
    }
  }

  function handleStatusClick(status) {
    if (MAKER_CATEGORIES.includes(lookingFor) && !photoURL && extraPhotos.every(p => !p)) {
      showToast('You must add at least 1 photo before posting your profile.')
      return
    }
    setPendingStatus(status)
    triggerParticles(status)
  }

  function triggerParticles(type) {
    const chars = type === 'im_out'     ? ['❤️','💕','💗','💖']
                : type === 'invite_out' ? ['💌','💕','❤️','💝']
                :                        ['🕐','⏰','🕑','🕒']
    const newP = Array.from({ length: 14 }, (_, i) => ({
      id:    Date.now() + i,
      char:  chars[i % chars.length],
      left:  `${4 + (i * 6.5) % 88}%`,
      dur:   `${1.1 + (i * 0.12) % 0.7}s`,
      delay: `${(i * 0.07) % 0.55}s`,
    }))
    setParticles(newP)
    setTimeout(() => setParticles([]), 2200)
  }

  const handleDone = async () => {
    const validationError = validateProfile({ name, dobDay, dobMonth, dobYear, country, city })
    if (validationError) { showToast(validationError); return }
    setSaving(true)
    try {
      if (photoFile && user?.id) {
        const url = await uploadAvatar(user.id, photoFile)
        if (url) setPhotoURL(url)
      }
      const savedExtra = [...extraPhotos]
      for (let i = 0; i < 4; i++) {
        if (extraPhotoFiles[i] && user?.id) {
          const url = await uploadGalleryPhoto(user.id, extraPhotoFiles[i], i)
          if (url) savedExtra[i] = url
        }
      }
      setExtraPhotos(savedExtra)
      setExtraPhotoFiles([null, null, null, null])

      const dob = (dobYear && dobMonth && dobDay)
        ? `${dobYear}-${String(dobMonth).padStart(2,'0')}-${String(dobDay).padStart(2,'0')}`
        : null
      const autoKeywords = getSearchKeywords(lookingFor, subCategory)
      const mergedTags = [...new Set([...tags, ...autoKeywords])]

      await saveProfile({
        userId:      user?.id,
        displayName: name,
        dob,
        bio,
        city,
        country,
        activities:  selectedActivity ? [selectedActivity] : [],
        lookingFor,
        enabledDomains,
        subCategory,
        speakingNative,
        speakingSecond,
        priceMin,
        priceMax,
        market,
        brandName,
        tradeRole,
        shopType,
        cuisineType,
        targetAudience,
        businessHours,
        tags: mergedTags,
        instagramHandle,
        tiktokHandle,
        facebookHandle,
        websiteUrl,
        youtubeHandle,
        extraPhotos: savedExtra,
        photoOffsetX,
        photoOffsetY,
        photoZoom,
        relationshipGoal: lookingFor === 'dating' ? relationshipGoal : undefined,
        starSign:         lookingFor === 'dating' ? starSign         : undefined,
        height:           lookingFor === 'dating' ? (height.trim() || null)       : undefined,
        dealBreakers:     lookingFor === 'dating' ? (dealBreakers.trim() || null) : undefined,
        voice_intro_url:  voiceIntroUrl ?? null,
        moodLight:        moodLight || null,
        driver_age:    (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (Number(driverAge) || null)         : undefined,
        vehicle_model: (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (vehicleModel.trim() || null)       : undefined,
        vehicle_year:  (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (Number(vehicleYear) || null)       : undefined,
        vehicle_color: (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (vehicleColor.trim() || null)       : undefined,
        plate_prefix:  (lookingFor === 'car_taxi' || lookingFor === 'bike_ride') ? (platePrefix.trim().toUpperCase() || null) : undefined,
        bizWhatsapp:      lookingFor === 'business' ? (bizWhatsapp.trim() || null) : undefined,
        productCondition: lookingFor === 'business' ? (productCondition || null)   : undefined,
      })
      if (pendingStatus) setShowGoOutSetup(true)
    } catch { /* silent */ }
    setSaving(false)
    setPhotoFile(null)
  }

  return (
    <>
      <div className={styles.screen}>

        {/* ── Side Drawer for Settings ── */}
        <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <h2 style={{marginTop: 0, marginBottom: 20, color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px'}}>Dashboard</h2>
            <button style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>👤</span>View My Profile</button>
            <button onClick={() => setDrawerOpen(false)} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>📸</span>Edit Photos</button>
            <hr style={{border: 0, borderTop: '1px solid rgba(141,198,63,0.15)', margin: '12px 0'}} />
            <button style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>⚙️</span>Account Settings</button>
            <button style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>🔒</span>Privacy & Security</button>
            <button onClick={() => { showToast('Push notifications can be toggled in your device settings'); setDrawerOpen(false); }} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>🔔</span>Notifications</button>
            <hr style={{border: 0, borderTop: '1px solid rgba(141,198,63,0.15)', margin: '12px 0'}} />
            <button onClick={() => { showToast('Help & Support page coming soon'); setDrawerOpen(false); }} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>❓</span>Help & Support</button>
            <button onClick={() => { showToast("Indoo v0.1.0 — who's hanging near you?"); setDrawerOpen(false); }} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 10}}>ℹ️</span>About Indoo</button>
            <hr style={{border: 0, borderTop: '1px solid rgba(141,198,63,0.15)', margin: '12px 0'}} />
            <button onClick={() => setDrawerOpen(false)} style={{width: '100%', padding: '14px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}} onMouseEnter={(e) => {e.target.style.background = '#252525'; e.target.style.borderColor = '#353535'; e.target.style.boxShadow = '0 4px 16px rgba(141,198,63,0.15)';}} onMouseLeave={(e) => {e.target.style.background = '#1a1a1a'; e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';}}><span style={{display: 'inline-block', marginRight: 8}}>✕</span>Close</button>
          </div>
        </SideDrawer>

        <Toast message={toast?.message} type="error" onDismiss={() => setToast(null)} duration={4500} />

        {/* ── Upload Profile heading ── */}
        <div className={styles.uploadHeadingRow}>
          <div className={styles.uploadHeadingText}>
            <span className={styles.uploadHeadingTitle}>UPLOAD Profile</span>
            <span className={styles.uploadHeadingSub}>Please view images terms and conditions</span>
          </div>
        </div>

        <div className={styles.scroll}>

          {/* ── Photo gallery + editor ── */}
          <ProfileHeader
            photoURL={photoURL}
            setPhotoURL={setPhotoURL}
            photoFile={photoFile}
            setPhotoFile={setPhotoFile}
            photoOffsetX={photoOffsetX}
            setPhotoOffsetX={setPhotoOffsetX}
            photoOffsetY={photoOffsetY}
            setPhotoOffsetY={setPhotoOffsetY}
            photoZoom={photoZoom}
            setPhotoZoom={setPhotoZoom}
            extraPhotos={extraPhotos}
            setExtraPhotos={setExtraPhotos}
            extraPhotoFiles={extraPhotoFiles}
            setExtraPhotoFiles={setExtraPhotoFiles}
            lookingFor={lookingFor}
            user={user}
            showToast={showToast}
          />

          {/* ── Bio, details, interests, status ── */}
          <ProfileBioSection
            name={name} setName={setName}
            dobDay={dobDay} setDobDay={setDobDay}
            dobMonth={dobMonth} setDobMonth={setDobMonth}
            dobYear={dobYear} setDobYear={setDobYear}
            bio={bio} setBio={setBio}
            country={country} setCountry={setCountry}
            countryQuery={countryQuery} setCountryQuery={setCountryQuery}
            countryOpen={countryOpen} setCountryOpen={setCountryOpen}
            countryRef={countryRef}
            city={city} setCity={setCity}
            speakingNative={speakingNative} setSpeakingNative={setSpeakingNative}
            speakingSecond={speakingSecond}
            setLangPickerOpen={setLangPickerOpen}
            lookingFor={lookingFor}
            subCategory={subCategory}
            setIntentGridOpen={setIntentGridOpen}
            selectedActivity={selectedActivity} setSelectedActivity={setSelectedActivity}
            expandedCategory={expandedCategory} setExpandedCategory={setExpandedCategory}
            relationshipGoal={relationshipGoal}
            setRelGoalOpen={setRelGoalOpen}
            starSign={starSign} setStarSign={setStarSign}
            setStarSignOpen={setStarSignOpen}
            height={height} setHeight={setHeight}
            dealBreakers={dealBreakers} setDealBreakers={setDealBreakers}
            voiceIntroUrl={voiceIntroUrl} setVoiceIntroUrl={setVoiceIntroUrl}
            voiceRecording={voiceRecording} setVoiceRecording={setVoiceRecording}
            voiceProgress={voiceProgress} setVoiceProgress={setVoiceProgress}
            voiceMediaRef={voiceMediaRef} voiceTimerRef={voiceTimerRef}
            moodLight={moodLight} setMoodLight={setMoodLight}
            tradeRole={tradeRole}
            setTradeRoleOpen={setTradeRoleOpen}
            shopType={shopType} setShopType={setShopType}
            setShopTypeOpen={setShopTypeOpen}
            cuisineType={cuisineType} setCuisineType={setCuisineType}
            setCuisineOpen={setCuisineOpen}
            targetAudience={targetAudience} setTargetAudience={setTargetAudience}
            brandName={brandName} setBrandName={setBrandName}
            priceMin={priceMin} setPriceMin={setPriceMin}
            priceMax={priceMax} setPriceMax={setPriceMax}
            market={market} setMarket={setMarket}
            businessHours={businessHours} setBusinessHours={setBusinessHours}
            driverAge={driverAge} setDriverAge={setDriverAge}
            vehicleModel={vehicleModel} setVehicleModel={setVehicleModel}
            vehicleYear={vehicleYear} setVehicleYear={setVehicleYear}
            vehicleColor={vehicleColor} setVehicleColor={setVehicleColor}
            platePrefix={platePrefix} setPlatePrefix={setPlatePrefix}
            userProfile={userProfile}
            user={user}
            driverId={driverId}
            setEarningsOpen={setEarningsOpen}
            setRestaurantDashOpen={setRestaurantDashOpen}
            tags={tags} setTags={setTags}
            tagInput={tagInput} setTagInput={setTagInput}
            pendingStatus={pendingStatus}
            particles={particles}
            handleStatusClick={handleStatusClick}
            mySession={mySession}
            showToast={showToast}
          />

          {/* ── Shop section (ECHO commerce inline fields) ── */}
          <ProfileShopSection
            lookingFor={lookingFor}
            profileTab={profileTab}
            hasShop={hasShop}
            tier={tier}
            user={user}
            brandName={brandName} setBrandName={setBrandName}
            bizWhatsapp={bizWhatsapp} setBizWhatsapp={setBizWhatsapp}
            productCondition={productCondition} setProductCondition={setProductCondition}
            echoPanelOpen={echoPanelOpen} setEchoPanelOpen={setEchoPanelOpen}
          />

          {/* ── Save button ── */}
          {profileTab === 'profile' && (
            <div className={styles.saveRow}>
              <button className={styles.saveBtn} onClick={handleDone} disabled={saving}>
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              <button
                style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.25)', fontSize: 11, padding: '6px 12px', cursor: 'pointer', fontFamily: 'monospace', marginTop: 8, width: '100%' }}
                onClick={() => setProfileTab('verified')}
              >
                🛠 Dev: preview Get Verified page
              </button>
            </div>
          )}

        </div>

        {/* ── Privacy section: verified tab + account drawer + driver overlays ── */}
        <ProfilePrivacySection
          drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}
          drawerSigningOut={drawerSigningOut} setDrawerSigningOut={setDrawerSigningOut}
          deleteStep={deleteStep} setDeleteStep={setDeleteStep}
          exportingData={exportingData} setExportingData={setExportingData}
          resetPwStep={resetPwStep} setResetPwStep={setResetPwStep}
          notifOn={notifOn}
          handleNotifToggle={handleNotifToggle}
          user={user} userProfile={userProfile}
          mySession={mySession}
          setToast={setToast}
          incomingBooking={incomingBooking} setIncomingBooking={setIncomingBooking}
          activeTrip={activeTrip} setActiveTrip={setActiveTrip}
          earningsOpen={earningsOpen} setEarningsOpen={setEarningsOpen}
          driverId={driverId}
          restaurantDashOpen={restaurantDashOpen} setRestaurantDashOpen={setRestaurantDashOpen}
          profileTab={profileTab} setProfileTab={setProfileTab}
          pricing={pricing}
          instagramHandle={instagramHandle} setInstagramHandle={setInstagramHandle}
          tiktokHandle={tiktokHandle} setTiktokHandle={setTiktokHandle}
          facebookHandle={facebookHandle} setFacebookHandle={setFacebookHandle}
          websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
          youtubeHandle={youtubeHandle} setYoutubeHandle={setYoutubeHandle}
          confirmedLinks={confirmedLinks} setConfirmedLinks={setConfirmedLinks}
          onboarding={onboarding}
          onClose={onClose}
          showToast={showToast}
        />

      </div>

      {/* ── Go Out Setup overlay ── */}
      {showGoOutSetup && (
        <GoOutSetup
          pendingStatus={pendingStatus}
          activityType={selectedActivity}
          userCity={city}
          onDone={() => { setShowGoOutSetup(false); onClose?.() }}
          onSkip={() => { setShowGoOutSetup(false); onClose?.() }}
        />
      )}

      <UpgradeSheet
        open={showUpgrade}
        onClose={() => { setShowUpgrade(false); onClose?.() }}
        showToast={showToast}
        lookingFor={lookingFor}
      />

      {/* ── Sheets ── */}
      <ShopTypeSheet
        open={shopTypeOpen}
        value={shopType}
        onChange={setShopType}
        onClose={() => setShopTypeOpen(false)}
      />
      <TradeRoleSheet
        open={tradeRoleOpen}
        value={tradeRole}
        onChange={setTradeRole}
        onClose={() => setTradeRoleOpen(false)}
      />
      <CuisineSheet
        open={cuisineOpen}
        value={cuisineType}
        onChange={setCuisineType}
        onClose={() => setCuisineOpen(false)}
      />
      <LanguagePickerSheet
        open={langPickerOpen}
        value={speakingSecond}
        exclude={speakingNative}
        onChange={setSpeakingSecond}
        onClose={() => setLangPickerOpen(false)}
      />
      <DatingPickerSheet
        open={relGoalOpen}
        title="Looking for…"
        subtitle="What kind of connection are you hoping to make?"
        options={DATING_REL_GOAL_OPTIONS}
        value={relationshipGoal}
        onChange={setRelationshipGoal}
        onClose={() => setRelGoalOpen(false)}
      />
      <DatingPickerSheet
        open={starSignOpen}
        title="Star Sign"
        subtitle="Choose your zodiac sign"
        options={DATING_STAR_SIGNS}
        value={starSign}
        onChange={setStarSign}
        onClose={() => setStarSignOpen(false)}
      />
      <IntentGrid
        open={intentGridOpen}
        value={lookingFor}
        city={city}
        onChange={(val) => {
          setLookingFor(val)
          setSubCategory(null)
          setIntentGridOpen(false)
        }}
        onBrowseAll={() => { setIntentGridOpen(false); setLookingForOpen(true) }}
      />
      <LookingForSheet
        open={lookingForOpen}
        value={lookingFor}
        subValue={subCategory}
        onChange={(main, sub) => { setLookingFor(main); setSubCategory(sub ?? null) }}
        onClose={() => setLookingForOpen(false)}
      />

      <QAFeedScreen
        open={qaFeedOpen}
        onClose={() => setQaFeedOpen(false)}
        user={user}
        userProfile={userProfile}
      />
    </>
  )
}
