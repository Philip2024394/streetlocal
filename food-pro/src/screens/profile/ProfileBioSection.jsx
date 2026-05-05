/**
 * ProfileBioSection — bio text, DOB, name, country/city, interests (Let's Meet With),
 * looking-for trigger, languages, star sign, height, deal breakers, voice intro,
 * mood light, search tags, and all Maker/business fields (brand, price, market,
 * business hours, trade role, cuisine, target audience, shop type).
 *
 * All state is managed in ProfileScreen and passed as props. This component
 * renders controlled fields only — no local state except UI-only toggles that
 * live in the sheet components themselves.
 *
 * // TODO: split into smaller per-category sections when dependencies are untangled
 */
import { useRef } from 'react'
import { LOOKING_FOR_OPTIONS, LANGUAGE_FLAGS, subCategoryText } from '@/utils/lookingForLabels'
import DriverDocumentUpload from '@/components/driver/DriverDocumentUpload'
import ProfileDatingFields from './ProfileDatingFields'
import ProfileMakerFields from './ProfileMakerFields'
import ProfileStatusSection from './ProfileStatusSection'
import OnlineToggle from '@/components/driver/OnlineToggle'
import styles from '../ProfileScreen.module.css'

// ── Inline help tip (self-contained UI widget) ───────────────────────────────
import { useState, useCallback, useEffect } from 'react'

function HelpTip({ text }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  const toggle = useCallback(() => {
    setOpen(p => {
      if (!p) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setOpen(false), 6000)
      }
      return !p
    })
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <span className={helpStyles.wrap}>
      <button className={helpStyles.btn} onClick={toggle} aria-label="Help" type="button">?</button>
      {open && <span className={helpStyles.tip}>{text}</span>}
    </span>
  )
}

const helpStyles = {
  wrap:  { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', verticalAlign: 'middle' },
  btn:   { width: 18, height: 18, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, fontFamily: 'inherit', padding: 0 },
  tip:   { position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, background: '#1c1c1c', border: '1px solid rgba(141,198,63,0.25)', borderRadius: 12, padding: '10px 13px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, whiteSpace: 'normal', width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' },
}

// ── Country data ─────────────────────────────────────────────────────────────
const COUNTRY_NATIVE_LANGUAGE = {
  'Indonesia': 'Indonesian', 'Philippines': 'Filipino', 'Vietnam': 'Vietnamese',
  'Thailand': 'Thai', 'Malaysia': 'Malay', 'Singapore': 'English',
  'Japan': 'Japanese', 'South Korea': 'Korean', 'China': 'Mandarin',
  'India': 'Hindi', 'Pakistan': 'Urdu', 'Bangladesh': 'Bengali',
  'United Kingdom': 'English', 'United States': 'English', 'Australia': 'English',
  'Canada': 'English', 'Ireland': 'English', 'New Zealand': 'English',
  'France': 'French', 'Germany': 'German', 'Spain': 'Spanish',
  'Italy': 'Italian', 'Portugal': 'Portuguese', 'Brazil': 'Portuguese',
  'Mexico': 'Spanish', 'Argentina': 'Spanish', 'Colombia': 'Spanish',
  'Russia': 'Russian', 'Ukraine': 'Ukrainian', 'Poland': 'Polish',
  'Netherlands': 'Dutch', 'Belgium': 'Dutch', 'Sweden': 'Swedish',
  'Norway': 'Norwegian', 'Denmark': 'Danish', 'Finland': 'Finnish',
  'Turkey': 'Turkish', 'Saudi Arabia': 'Arabic', 'Egypt': 'Arabic',
  'Nigeria': 'English', 'Ghana': 'English', 'South Africa': 'English',
  'Kenya': 'Swahili', 'Ethiopia': 'Amharic', 'Tanzania': 'Swahili',
}

const COUNTRIES = [
  { name: 'Afghanistan',             flag: '🇦🇫' },
  { name: 'Albania',                 flag: '🇦🇱' },
  { name: 'Algeria',                 flag: '🇩🇿' },
  { name: 'Andorra',                 flag: '🇦🇩' },
  { name: 'Angola',                  flag: '🇦🇴' },
  { name: 'Argentina',               flag: '🇦🇷' },
  { name: 'Armenia',                 flag: '🇦🇲' },
  { name: 'Australia',               flag: '🇦🇺' },
  { name: 'Austria',                 flag: '🇦🇹' },
  { name: 'Azerbaijan',              flag: '🇦🇿' },
  { name: 'Bahamas',                 flag: '🇧🇸' },
  { name: 'Bahrain',                 flag: '🇧🇭' },
  { name: 'Bangladesh',              flag: '🇧🇩' },
  { name: 'Belarus',                 flag: '🇧🇾' },
  { name: 'Belgium',                 flag: '🇧🇪' },
  { name: 'Belize',                  flag: '🇧🇿' },
  { name: 'Benin',                   flag: '🇧🇯' },
  { name: 'Bolivia',                 flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina',  flag: '🇧🇦' },
  { name: 'Botswana',                flag: '🇧🇼' },
  { name: 'Brazil',                  flag: '🇧🇷' },
  { name: 'Brunei',                  flag: '🇧🇳' },
  { name: 'Bulgaria',                flag: '🇧🇬' },
  { name: 'Burkina Faso',            flag: '🇧🇫' },
  { name: 'Cambodia',                flag: '🇰🇭' },
  { name: 'Cameroon',                flag: '🇨🇲' },
  { name: 'Canada',                  flag: '🇨🇦' },
  { name: 'Chile',                   flag: '🇨🇱' },
  { name: 'China',                   flag: '🇨🇳' },
  { name: 'Colombia',                flag: '🇨🇴' },
  { name: 'Congo',                   flag: '🇨🇬' },
  { name: 'Costa Rica',              flag: '🇨🇷' },
  { name: 'Croatia',                 flag: '🇭🇷' },
  { name: 'Cuba',                    flag: '🇨🇺' },
  { name: 'Cyprus',                  flag: '🇨🇾' },
  { name: 'Czech Republic',          flag: '🇨🇿' },
  { name: 'Denmark',                 flag: '🇩🇰' },
  { name: 'Dominican Republic',      flag: '🇩🇴' },
  { name: 'Ecuador',                 flag: '🇪🇨' },
  { name: 'Egypt',                   flag: '🇪🇬' },
  { name: 'El Salvador',             flag: '🇸🇻' },
  { name: 'Estonia',                 flag: '🇪🇪' },
  { name: 'Ethiopia',                flag: '🇪🇹' },
  { name: 'Fiji',                    flag: '🇫🇯' },
  { name: 'Finland',                 flag: '🇫🇮' },
  { name: 'France',                  flag: '🇫🇷' },
  { name: 'Georgia',                 flag: '🇬🇪' },
  { name: 'Germany',                 flag: '🇩🇪' },
  { name: 'Ghana',                   flag: '🇬🇭' },
  { name: 'Greece',                  flag: '🇬🇷' },
  { name: 'Guatemala',               flag: '🇬🇹' },
  { name: 'Honduras',                flag: '🇭🇳' },
  { name: 'Hungary',                 flag: '🇭🇺' },
  { name: 'Iceland',                 flag: '🇮🇸' },
  { name: 'India',                   flag: '🇮🇳' },
  { name: 'Indonesia',               flag: '🇮🇩' },
  { name: 'Iran',                    flag: '🇮🇷' },
  { name: 'Iraq',                    flag: '🇮🇶' },
  { name: 'Ireland',                 flag: '🇮🇪' },
  { name: 'Israel',                  flag: '🇮🇱' },
  { name: 'Italy',                   flag: '🇮🇹' },
  { name: 'Jamaica',                 flag: '🇯🇲' },
  { name: 'Japan',                   flag: '🇯🇵' },
  { name: 'Jordan',                  flag: '🇯🇴' },
  { name: 'Kazakhstan',              flag: '🇰🇿' },
  { name: 'Kenya',                   flag: '🇰🇪' },
  { name: 'Kosovo',                  flag: '🇽🇰' },
  { name: 'Kuwait',                  flag: '🇰🇼' },
  { name: 'Kyrgyzstan',              flag: '🇰🇬' },
  { name: 'Latvia',                  flag: '🇱🇻' },
  { name: 'Lebanon',                 flag: '🇱🇧' },
  { name: 'Libya',                   flag: '🇱🇾' },
  { name: 'Lithuania',               flag: '🇱🇹' },
  { name: 'Luxembourg',              flag: '🇱🇺' },
  { name: 'Malaysia',                flag: '🇲🇾' },
  { name: 'Maldives',                flag: '🇲🇻' },
  { name: 'Malta',                   flag: '🇲🇹' },
  { name: 'Mexico',                  flag: '🇲🇽' },
  { name: 'Moldova',                 flag: '🇲🇩' },
  { name: 'Monaco',                  flag: '🇲🇨' },
  { name: 'Mongolia',                flag: '🇲🇳' },
  { name: 'Montenegro',              flag: '🇲🇪' },
  { name: 'Morocco',                 flag: '🇲🇦' },
  { name: 'Mozambique',              flag: '🇲🇿' },
  { name: 'Myanmar',                 flag: '🇲🇲' },
  { name: 'Nepal',                   flag: '🇳🇵' },
  { name: 'Netherlands',             flag: '🇳🇱' },
  { name: 'New Zealand',             flag: '🇳🇿' },
  { name: 'Nicaragua',               flag: '🇳🇮' },
  { name: 'Nigeria',                 flag: '🇳🇬' },
  { name: 'North Macedonia',         flag: '🇲🇰' },
  { name: 'Norway',                  flag: '🇳🇴' },
  { name: 'Oman',                    flag: '🇴🇲' },
  { name: 'Pakistan',                flag: '🇵🇰' },
  { name: 'Panama',                  flag: '🇵🇦' },
  { name: 'Paraguay',                flag: '🇵🇾' },
  { name: 'Peru',                    flag: '🇵🇪' },
  { name: 'Philippines',             flag: '🇵🇭' },
  { name: 'Poland',                  flag: '🇵🇱' },
  { name: 'Portugal',                flag: '🇵🇹' },
  { name: 'Qatar',                   flag: '🇶🇦' },
  { name: 'Romania',                 flag: '🇷🇴' },
  { name: 'Russia',                  flag: '🇷🇺' },
  { name: 'Rwanda',                  flag: '🇷🇼' },
  { name: 'Saudi Arabia',            flag: '🇸🇦' },
  { name: 'Senegal',                 flag: '🇸🇳' },
  { name: 'Serbia',                  flag: '🇷🇸' },
  { name: 'Singapore',               flag: '🇸🇬' },
  { name: 'Slovakia',                flag: '🇸🇰' },
  { name: 'Slovenia',                flag: '🇸🇮' },
  { name: 'Somalia',                 flag: '🇸🇴' },
  { name: 'South Africa',            flag: '🇿🇦' },
  { name: 'South Korea',             flag: '🇰🇷' },
  { name: 'Spain',                   flag: '🇪🇸' },
  { name: 'Sri Lanka',               flag: '🇱🇰' },
  { name: 'Sudan',                   flag: '🇸🇩' },
  { name: 'Sweden',                  flag: '🇸🇪' },
  { name: 'Switzerland',             flag: '🇨🇭' },
  { name: 'Syria',                   flag: '🇸🇾' },
  { name: 'Taiwan',                  flag: '🇹🇼' },
  { name: 'Tanzania',                flag: '🇹🇿' },
  { name: 'Thailand',                flag: '🇹🇭' },
  { name: 'Tunisia',                 flag: '🇹🇳' },
  { name: 'Turkey',                  flag: '🇹🇷' },
  { name: 'Uganda',                  flag: '🇺🇬' },
  { name: 'Ukraine',                 flag: '🇺🇦' },
  { name: 'United Arab Emirates',    flag: '🇦🇪' },
  { name: 'United Kingdom',          flag: '🇬🇧' },
  { name: 'United States',           flag: '🇺🇸' },
  { name: 'Uruguay',                 flag: '🇺🇾' },
  { name: 'Uzbekistan',              flag: '🇺🇿' },
  { name: 'Venezuela',               flag: '🇻🇪' },
  { name: 'Vietnam',                 flag: '🇻🇳' },
  { name: 'Yemen',                   flag: '🇾🇪' },
  { name: 'Zambia',                  flag: '🇿🇲' },
  { name: 'Zimbabwe',                flag: '🇿🇼' },
]

const DATING_REL_GOAL_OPTIONS = [
  { value: 'casual',  emoji: '😊', label: 'Casual & Fun',        sub: 'Keeping it light and fun' },
  { value: 'serious', emoji: '💍', label: 'Something Serious',   sub: 'Looking for a real connection' },
  { value: 'open',    emoji: '🌻', label: 'Open to Everything',  sub: 'Not sure yet — just seeing what happens' },
  { value: 'friends', emoji: '👋', label: 'Friends First',       sub: 'Start as friends and see where it goes' },
]

const DATING_STAR_SIGNS = [
  { value: 'Aries',       emoji: '♈', label: 'Aries',       sub: '21 Mar – 19 Apr' },
  { value: 'Taurus',      emoji: '♉', label: 'Taurus',      sub: '20 Apr – 20 May' },
  { value: 'Gemini',      emoji: '♊', label: 'Gemini',      sub: '21 May – 20 Jun' },
  { value: 'Cancer',      emoji: '♋', label: 'Cancer',      sub: '21 Jun – 22 Jul' },
  { value: 'Leo',         emoji: '♌', label: 'Leo',         sub: '23 Jul – 22 Aug' },
  { value: 'Virgo',       emoji: '♍', label: 'Virgo',       sub: '23 Aug – 22 Sep' },
  { value: 'Libra',       emoji: '♎', label: 'Libra',       sub: '23 Sep – 22 Oct' },
  { value: 'Scorpio',     emoji: '♏', label: 'Scorpio',     sub: '23 Oct – 21 Nov' },
  { value: 'Sagittarius', emoji: '♐', label: 'Sagittarius', sub: '22 Nov – 21 Dec' },
  { value: 'Capricorn',   emoji: '♑', label: 'Capricorn',   sub: '22 Dec – 19 Jan' },
  { value: 'Aquarius',    emoji: '♒', label: 'Aquarius',    sub: '20 Jan – 18 Feb' },
  { value: 'Pisces',      emoji: '♓', label: 'Pisces',      sub: '19 Feb – 20 Mar' },
]

export { COUNTRIES, COUNTRY_NATIVE_LANGUAGE, DATING_REL_GOAL_OPTIONS, DATING_STAR_SIGNS }

// All commerce/service/professional categories that unlock business fields
export const MAKER_CATEGORIES = [
  'buy_sell', 'fresh_produce', 'agri_goods', 'fashion', 'electronics', 'vehicles',
  'property', 'tools_equip', 'antiques', 'import_export',
  'trades', 'auto_repair', 'cleaning', 'garden', 'security', 'laundry', 'tailoring',
  'childcare', 'eldercare', 'pet_care', 'transport',
  'healthcare', 'beauty', 'fitness_pt', 'mental_health', 'alt_medicine', 'veterinary', 'pharmacy',
  'catering', 'restaurant', 'hotel_accom', 'tourism_guide', 'event_planning', 'bar_nightclub',
  'creative', 'content_creator', 'music_perform', 'music', 'photography', 'writing', 'fashion_design', 'art_craft',
  'handmade', 'craft_supplies', 'vintage', 'hardware', 'wellness',
  'business', 'technology', 'legal', 'engineering', 'sales_leads', 'consulting',
  'real_estate', 'marketing', 'media_pro',
  'hiring', 'freelance', 'domestic_work', 'agri_work', 'manufacturing', 'mining',
  'education', 'coaching',
]

const DEFAULT_HOURS = { open: '', close: '', closed: false }
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ProfileBioSection({
  // Identity
  name, setName,
  dobDay, setDobDay,
  dobMonth, setDobMonth,
  dobYear, setDobYear,
  bio, setBio,
  // Location
  country, setCountry,
  countryQuery, setCountryQuery,
  countryOpen, setCountryOpen,
  countryRef,
  city, setCity,
  // Languages
  speakingNative, setSpeakingNative,
  speakingSecond,
  setLangPickerOpen,
  // Looking for
  lookingFor,
  subCategory,
  setIntentGridOpen,
  // Activity accordion
  selectedActivity, setSelectedActivity,
  expandedCategory, setExpandedCategory,
  // Dating
  relationshipGoal,
  setRelGoalOpen,
  starSign, setStarSign,
  setStarSignOpen,
  height, setHeight,
  dealBreakers, setDealBreakers,
  // Voice intro
  voiceIntroUrl, setVoiceIntroUrl,
  voiceRecording, setVoiceRecording,
  voiceProgress, setVoiceProgress,
  voiceMediaRef, voiceTimerRef,
  // Mood light
  moodLight, setMoodLight,
  // Maker / business fields
  tradeRole,
  setTradeRoleOpen,
  shopType, setShopType,
  setShopTypeOpen,
  cuisineType, setCuisineType,
  setCuisineOpen,
  targetAudience, setTargetAudience,
  brandName, setBrandName,
  priceMin, setPriceMin,
  priceMax, setPriceMax,
  market, setMarket,
  businessHours, setBusinessHours,
  // Driver fields
  driverAge, setDriverAge,
  vehicleModel, setVehicleModel,
  vehicleYear, setVehicleYear,
  vehicleColor, setVehicleColor,
  platePrefix, setPlatePrefix,
  userProfile,
  user,
  driverId,
  setEarningsOpen,
  setRestaurantDashOpen,
  // Tags
  tags, setTags,
  tagInput, setTagInput,
  // Status buttons
  pendingStatus,
  particles,
  handleStatusClick,
  mySession,
  showToast,
}) {
  const filteredCountries = countryQuery.length > 0
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countryQuery.toLowerCase())).slice(0, 8)
    : COUNTRIES.slice(0, 8)

  const updateHour = (day, field, value) =>
    setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))

  return (
    <>
      {/* ── Joined the app for ── */}
      <div className={styles.joinedWrap}>
        <span className={styles.joinedHeading}>Joined the app for</span>
        <button
          type="button"
          className={styles.lookingForTrigger}
          onClick={() => setIntentGridOpen(true)}
        >
          {lookingFor
            ? (() => {
                const opt = LOOKING_FOR_OPTIONS.find(o => o.value === lookingFor)
                if (!opt) return 'I\'m here for…'
                const subLabel = subCategory ? subCategoryText(lookingFor, subCategory) : null
                return (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {opt.img
                        ? <img src={opt.img} alt={opt.label} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        : <span>{opt.emoji}</span>
                      }
                      <span style={{ fontWeight: 700 }}>{opt.label}</span>
                    </span>
                    {subLabel && (
                      <span style={{ fontSize: 12, color: '#8DC63F', paddingLeft: 28 }}>{subLabel}</span>
                    )}
                  </span>
                )
              })()
            : <span className={styles.lookingForPlaceholder}>I'm here for… tap to choose</span>
          }
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.5 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* ── Details section ── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Your details</span>

        {/* Name */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Display Name</label>
            <HelpTip text="Shown on the map and in messages. Use your first name or a nickname — real names build more trust with matches." />
          </div>
          <input
            className={styles.fieldInput}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Date of Birth */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Date of Birth <span className={styles.requiredStar}>*</span></label>
            <HelpTip text="Required — used to confirm you're 18+ and to show your age to matches. Your exact birthday is never shared publicly." />
          </div>
          <div className={styles.dobRow}>
            <select className={styles.dobSelect} value={dobDay} onChange={e => setDobDay(e.target.value)}>
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select className={styles.dobSelect} value={dobMonth} onChange={e => setDobMonth(e.target.value)}>
              <option value="">Month</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select className={styles.dobSelect} value={dobYear} onChange={e => setDobYear(e.target.value)}>
              <option value="">Year</option>
              {Array.from({ length: 82 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio / Live feed opening text */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Bio</label>
            <HelpTip text="Tell people what makes you interesting! Profiles with a bio get 3× more messages. Keep it genuine — mention your interests, vibe, or what you're looking for." />
          </div>
          <textarea
            className={styles.bioInput}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell people what you're about…"
            rows={3}
            maxLength={350}
          />
          <span className={styles.bioCount}>{bio.length}/350</span>
          <ul className={styles.bioHints}>
            <li>This text appears on your <strong>Indoo Live</strong> feed card, visible to everyone browsing the live feed</li>
            <li>Max 350 characters including spaces</li>
            <li>Be clear and engaging — this is your first impression in the live feed</li>
          </ul>
        </div>

        {/* Country typeahead */}
        <div className={styles.fieldRow} ref={countryRef}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Country <span className={styles.requiredStar}>*</span></label>
            <HelpTip text="Required — helps us show your profile to people in the right region. Update this if you're travelling." />
          </div>
          <div className={styles.countryWrap}>
            <input
              className={styles.fieldInput}
              value={countryQuery}
              onChange={e => { setCountryQuery(e.target.value); setCountryOpen(e.target.value.length > 0) }}
              onBlur={() => setTimeout(() => setCountryOpen(false), 150)}
              placeholder="Type to search country…"
              autoComplete="off"
            />
            {countryOpen && filteredCountries.length > 0 && (
              <ul className={styles.countryDropdown}>
                {filteredCountries.map(c => (
                  <li
                    key={c.name}
                    className={styles.countryOption}
                    onMouseDown={() => {
                      setCountry(c.name)
                      setCountryQuery(c.name)
                      setCountryOpen(false)
                      setSpeakingNative(COUNTRY_NATIVE_LANGUAGE[c.name] ?? '')
                    }}
                  >
                    <span className={styles.countryFlag}>{c.flag}</span>
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Location / City */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Location <span className={styles.requiredStar}>*</span></label>
            <HelpTip text="Required — your city or area is used only to calculate distance between you and other users. It is never shown publicly. Without it you won't appear in local map searches." />
          </div>
          <input
            className={styles.fieldInput}
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Your city or area…"
          />
          <div className={styles.locationPrivacy}>
            <span className={styles.locationPrivacyIcon}>🔒</span>
            <span className={styles.locationPrivacyText}>
              Your location is <strong>never shared</strong> publicly — it is only used to calculate km distance and show you to people nearby. Not setting a location will cause errors on the map and prevent you from appearing to others near you.
            </span>
          </div>
        </div>

        {/* Search Tags */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Search Tags</label>
            <HelpTip text="Add keywords that describe what you offer or sell — e.g. 'leather handbags', 'handmade scarves', 'wedding dress'. People searching these words will find your profile. Max 10 tags." />
          </div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.35)',
                  borderRadius: 100, padding: '4px 10px',
                  fontSize: 12, fontWeight: 600, color: '#8DC63F',
                }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                    style={{ background: 'none', border: 'none', color: 'rgba(141,198,63,0.6)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 13 }}
                    aria-label={`Remove ${tag}`}
                  >×</button>
                </span>
              ))}
            </div>
          )}
          {tags.length < 10 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className={styles.fieldInput}
                value={tagInput}
                onChange={e => setTagInput(e.target.value.toLowerCase().slice(0, 25))}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    e.preventDefault()
                    const t = tagInput.trim().replace(/,/g, '')
                    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
                    setTagInput('')
                  }
                }}
                placeholder="Type a tag and press Enter…"
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.adjustBtn}
                style={{ flexShrink: 0, padding: '0 14px' }}
                onClick={() => {
                  const t = tagInput.trim().replace(/,/g, '')
                  if (t && !tags.includes(t)) setTags(prev => [...prev, t])
                  setTagInput('')
                }}
              >Add</button>
            </div>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{tags.length}/10 tags</span>
        </div>

        {/* Speaking */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Speaking</label>
            <HelpTip text="Your native language is set automatically from your country. Add a second language if you speak one — it helps people know how to connect with you." />
          </div>
          <div className={styles.speakingRow}>
            <div className={styles.speakingNative}>
              <span className={styles.speakingNativeLabel}>Native</span>
              <span className={styles.speakingNativeValue}>{speakingNative ? `${LANGUAGE_FLAGS[speakingNative] ?? ''} ${speakingNative}` : '—'}</span>
            </div>
            <button
              type="button"
              className={styles.lookingForTrigger}
              style={{ flex: 1 }}
              onClick={() => setLangPickerOpen(true)}
            >
              {speakingSecond
                ? <span>{LANGUAGE_FLAGS[speakingSecond] ?? '🌐'} {speakingSecond}</span>
                : <span className={styles.lookingForPlaceholder}>+ Add second language</span>
              }
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Driver vehicle details ── */}
        {(lookingFor === 'car_taxi' || lookingFor === 'bike_ride') && (
          <div className={styles.driverVehicleSection}>
            <p className={styles.driverVehicleTitle}>
              {lookingFor === 'car_taxi' ? '🚗' : '🛵'} Your Vehicle Details
            </p>
            <div className={styles.driverVehicleGrid}>
              <label className={styles.driverVehicleLabel}>Your Age
                <input className={styles.driverVehicleInput} type="number" min="18" max="70" value={driverAge} onChange={e => setDriverAge(e.target.value)} placeholder="e.g. 28" />
              </label>
              <label className={styles.driverVehicleLabel}>{lookingFor === 'car_taxi' ? 'Car' : 'Bike'} Make & Model
                <input className={styles.driverVehicleInput} type="text" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder={lookingFor === 'car_taxi' ? 'e.g. Toyota Avanza' : 'e.g. Honda Vario 125'} />
              </label>
              <label className={styles.driverVehicleLabel}>Year
                <input className={styles.driverVehicleInput} type="number" min="2000" max={new Date().getFullYear()} value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} placeholder="e.g. 2022" />
              </label>
              <label className={styles.driverVehicleLabel}>Colour
                <input className={styles.driverVehicleInput} type="text" value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} placeholder="e.g. Black" />
              </label>
              <label className={`${styles.driverVehicleLabel} ${styles.driverVehicleLabelFull}`}>Plate Number (first 4–6 characters)
                <input className={styles.driverVehicleInput} type="text" maxLength={8} value={platePrefix} onChange={e => setPlatePrefix(e.target.value.toUpperCase())} placeholder="e.g. AB 1234" />
              </label>
            </div>
            <p className={styles.driverVehicleNote}>These details are shown to passengers after booking. Save your profile to update.</p>
          </div>
        )}

        {/* Driver document upload + online toggle */}
        {(lookingFor === 'car_taxi' || lookingFor === 'bike_ride') && (
          <>
            <DriverDocumentUpload
              userId={user?.uid ?? user?.id}
              driverType={lookingFor}
            />
            {userProfile?.is_driver && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <OnlineToggle userId={driverId} />
                <button
                  onClick={() => setEarningsOpen(true)}
                  style={{
                    padding: '10px 24px', borderRadius: 12,
                    background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.3)',
                    color: '#8DC63F', fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  💰 My Earnings & Trips
                </button>
              </div>
            )}
          </>
        )}

        {/* Restaurant owner section */}
        {lookingFor === 'restaurant_owner' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <p style={{ color: '#555', fontSize: 13, textAlign: 'center', margin: 0 }}>
              List your restaurant, manage your menu, and receive orders via WhatsApp.
            </p>
            <button
              onClick={() => setRestaurantDashOpen(true)}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.3)',
                color: '#F5C518', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🍴 Open Restaurant Dashboard
            </button>
          </div>
        )}

        {/* Dating profile fields */}
        {lookingFor === 'dating' && (
          <ProfileDatingFields
            relationshipGoal={relationshipGoal} setRelGoalOpen={setRelGoalOpen}
            starSign={starSign} setStarSign={setStarSign} setStarSignOpen={setStarSignOpen}
            height={height} setHeight={setHeight}
            dealBreakers={dealBreakers} setDealBreakers={setDealBreakers}
            HelpTip={HelpTip}
          />
        )}

        {/* ── Voice Intro ── */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Voice Intro</label>
            <HelpTip text="Record a 7-second voice note. It plays automatically (muted) on your profile card — visitors tap to unmute. A great way to stand out." />
          </div>
          {voiceIntroUrl && !voiceRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <audio src={voiceIntroUrl} controls style={{ flex: 1, height: 34, borderRadius: 8 }} />
              <button
                type="button"
                onClick={() => setVoiceIntroUrl(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                aria-label="Remove voice intro"
              >×</button>
            </div>
          )}
          {voiceRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, background: 'rgba(232,69,140,0.1)', border: '1px solid rgba(232,69,140,0.3)', borderRadius: 12, padding: '10px 14px' }}>
              <span style={{ color: '#E8458C', fontSize: 20, lineHeight: 1, animation: 'livePulse 1.5s ease-in-out infinite' }}>🎙️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Recording… {voiceProgress}s / 7s</div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(voiceProgress / 7) * 100}%`, background: '#E8458C', transition: 'width 1s linear', borderRadius: 2 }} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  voiceMediaRef.current?.stop()
                  clearInterval(voiceTimerRef.current)
                  setVoiceRecording(false)
                  setVoiceProgress(0)
                }}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
              >Stop</button>
            </div>
          )}
          {!voiceRecording && (
            <button
              type="button"
              className={styles.adjustBtn}
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                  const recorder = new MediaRecorder(stream)
                  const chunks = []
                  recorder.ondataavailable = e => chunks.push(e.data)
                  recorder.onstop = async () => {
                    stream.getTracks().forEach(t => t.stop())
                    const blob = new Blob(chunks, { type: 'audio/webm' })
                    const { supabase } = await import('../../lib/supabase')
                    const path = `voice-intros/${user?.id ?? 'anon'}.webm`
                    const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'audio/webm' })
                    if (!error) {
                      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
                      setVoiceIntroUrl(publicUrl)
                    }
                    setVoiceRecording(false)
                    setVoiceProgress(0)
                  }
                  voiceMediaRef.current = recorder
                  recorder.start()
                  setVoiceRecording(true)
                  setVoiceProgress(0)
                  let elapsed = 0
                  voiceTimerRef.current = setInterval(() => {
                    elapsed++
                    setVoiceProgress(elapsed)
                    if (elapsed >= 7) {
                      recorder.stop()
                      clearInterval(voiceTimerRef.current)
                    }
                  }, 1000)
                } catch {
                  showToast('Microphone access is required to record a voice intro.')
                }
              }}
            >
              🎙️ {voiceIntroUrl ? 'Re-record' : 'Record 7-second intro'}
            </button>
          )}
        </div>

        {/* ── Mood Light ── */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Mood Light</label>
            <HelpTip text="A coloured glow ring around your profile card that signals your current energy. Visitors see it when they open your card." />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { value: 'warm', emoji: '🧡', label: 'Warm',  color: '#F97316' },
              { value: 'cool', emoji: '💙', label: 'Cool',  color: '#38BDF8' },
              { value: 'pink', emoji: '🩷', label: 'Pink',  color: '#F472B6' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMoodLight(moodLight === opt.value ? '' : opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 100,
                  background: moodLight === opt.value ? `${opt.color}22` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${moodLight === opt.value ? opt.color : 'rgba(255,255,255,0.1)'}`,
                  color: moodLight === opt.value ? opt.color : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {opt.emoji} {opt.label}
                {moodLight === opt.value && <span style={{ fontSize: 11 }}>✓</span>}
              </button>
            ))}
          </div>
          {moodLight && (
            <button type="button" className={styles.brandQuickBtn} onClick={() => setMoodLight('')} style={{ marginTop: 6 }}>
              ✕ Clear mood light
            </button>
          )}
        </div>

        {/* ── Maker / business fields ── */}
        {MAKER_CATEGORIES.includes(lookingFor) && (
          <ProfileMakerFields
            lookingFor={lookingFor}
            tradeRole={tradeRole} setTradeRoleOpen={setTradeRoleOpen}
            shopType={shopType} setShopType={setShopType} setShopTypeOpen={setShopTypeOpen}
            cuisineType={cuisineType} setCuisineType={setCuisineType} setCuisineOpen={setCuisineOpen}
            targetAudience={targetAudience} setTargetAudience={setTargetAudience}
            brandName={brandName} setBrandName={setBrandName}
            priceMin={priceMin} setPriceMin={setPriceMin}
            priceMax={priceMax} setPriceMax={setPriceMax}
            market={market} setMarket={setMarket}
            businessHours={businessHours} setBusinessHours={setBusinessHours}
            HelpTip={HelpTip}
          />
        )}
      </div>

      <ProfileStatusSection
        lookingFor={lookingFor} makerCategories={MAKER_CATEGORIES}
        selectedActivity={selectedActivity} setSelectedActivity={setSelectedActivity}
        expandedCategory={expandedCategory} setExpandedCategory={setExpandedCategory}
        pendingStatus={pendingStatus} particles={particles}
        handleStatusClick={handleStatusClick} mySession={mySession}
        HelpTip={HelpTip}
      />
    </>
  )
}
