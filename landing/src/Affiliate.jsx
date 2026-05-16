import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const COUNTRIES = [
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia', prefix: '+62' },
  { code: 'MY', flag: '🇲🇾', name: 'Malaysia', prefix: '+60' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore', prefix: '+65' },
  { code: 'TH', flag: '🇹🇭', name: 'Thailand', prefix: '+66' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnam', prefix: '+84' },
  { code: 'PH', flag: '🇵🇭', name: 'Philippines', prefix: '+63' },
  { code: 'IN', flag: '🇮🇳', name: 'India', prefix: '+91' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', prefix: '+61' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', prefix: '+44' },
  { code: 'US', flag: '🇺🇸', name: 'United States', prefix: '+1' },
  { code: 'AE', flag: '🇦🇪', name: 'UAE', prefix: '+971' },
  { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia', prefix: '+966' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan', prefix: '+81' },
  { code: 'KR', flag: '🇰🇷', name: 'South Korea', prefix: '+82' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany', prefix: '+49' },
  { code: 'FR', flag: '🇫🇷', name: 'France', prefix: '+33' },
]

// Full ISO 3166-1 alpha-2 country list, used by the dashboard Profile section
// so an agent can pick any home country (not just the 16 supported at signup).
// Sorted alphabetically by display name. Flags are emoji regional-indicator pairs.
const ISO_COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' }, { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' }, { code: 'AS', name: 'American Samoa', flag: '🇦🇸' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' }, { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮' }, { code: 'AG', name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' }, { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼' }, { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' }, { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' }, { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' }, { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' }, { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' }, { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BM', name: 'Bermuda', flag: '🇧🇲' }, { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' }, { code: 'BA', name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' }, { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' }, { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' }, { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' }, { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' }, { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
  { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾' }, { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' }, { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' }, { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' }, { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩' }, { code: 'CK', name: 'Cook Islands', flag: '🇨🇰' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' }, { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' }, { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' }, { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' }, { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' }, { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' }, { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' }, { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' }, { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' }, { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' }, { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' }, { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' }, { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' }, { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GI', name: 'Gibraltar', flag: '🇬🇮' }, { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GL', name: 'Greenland', flag: '🇬🇱' }, { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GU', name: 'Guam', flag: '🇬🇺' }, { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' }, { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' }, { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' }, { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' }, { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' }, { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' }, { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' }, { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' }, { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' }, { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' }, { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' }, { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' }, { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' }, { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' }, { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' }, { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' }, { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MO', name: 'Macao', flag: '🇲🇴' }, { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' }, { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' }, { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' }, { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' }, { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' }, { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' }, { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' }, { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MS', name: 'Montserrat', flag: '🇲🇸' }, { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' }, { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' }, { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' }, { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨' }, { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' }, { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' }, { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' }, { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' }, { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' }, { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' }, { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' }, { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' }, { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' }, { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' }, { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' }, { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' }, { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', name: 'São Tomé & Príncipe', flag: '🇸🇹' }, { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' }, { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' }, { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' }, { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' }, { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' }, { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' }, { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' }, { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' }, { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' }, { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' }, { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' }, { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' }, { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' }, { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹' }, { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' }, { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' }, { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' }, { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' }, { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' }, { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' }, { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' }, { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' }, { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
]

const APPS = [
  // Affiliate now sells the 3 StreetLocal subscription tiers (Starter /
  // Professional / Enterprise) — same tiers shown on /donut pricing.
  // Commission is one-time bounty paid 30 days after the vendor's first
  // successful monthly charge clears. No recurring — agent's job is
  // acquisition, ours is retention. Higher tiers pay larger bounties
  // so agents are incentivised to push premium, not just Starter.
  //
  // Schema fields used downstream:
  //   - price          → what the vendor pays per month
  //   - commission     → agent bounty (display value)
  //   - commissionPct  → bounty as a % of first-month vendor price
  //   - commissionNote → one-line copy for the 30-day hold rule
  //   - color / icon   → visual differentiation
  //   - url            → activation landing route
  { id: 'starter',    name: 'Starter',      tier: 'Sell + market on social',         price: 'Rp 38.000',  commission: 'Rp 35.000',  commissionPct: '92%', commissionNote: 'Rp 35K per Starter referral · paid 30 days after vendor\'s first charge',           color: '#FACC15', icon: '🍩', desc: 'Premium PWA + WhatsApp checkout + marketing banners. Everything a small shop needs to open today and run social marketing.', url: '/food/chat/?plan=starter' },
  { id: 'pro',        name: 'Professional', tier: 'For growing shops',               price: 'Rp 199.000', commission: 'Rp 80.000',  commissionPct: '40%', commissionNote: 'Rp 80K per Professional referral · paid 30 days after vendor\'s first charge',      color: '#EAB308', icon: '💬', desc: 'Loyalty stamps, thermal printer, in-app chat, tipping, custom domain, SMS + email campaigns. For shops ready to grow.',     url: '/food/chat/?plan=professional' },
  { id: 'enterprise', name: 'Enterprise',   tier: 'Operations-heavy & multi-location', price: 'Rp 449.000', commission: 'Rp 180.000', commissionPct: '40%', commissionNote: 'Rp 180K per Enterprise referral · paid 30 days after vendor\'s first charge',     color: '#0A0A0A', icon: '🍽️', desc: 'KDS, kiosk, production planner, catering, multi-location, unlimited staff, white-label. The full StreetLocal stack.',     url: '/food/chat/?plan=enterprise' },
]

const AGENT_FEE = '35.000'
const AGENT_FEE_LABEL = 'Rp 35.000/month'

/* ─── Promo Carousel Component ─── */
/* ─── Community Live Feed Component ─── */
function CommunityFeed({ locale, leaderboard, onBack }) {
  const [feed, setFeed] = useState([])
  const [fadeIn, setFadeIn] = useState(null)

  // Generate realistic-looking live feed
  const NAMES_ID = ['Rina S.', 'Ahmad F.', 'Dewi L.', 'Budi S.', 'Putri A.', 'Rizky P.', 'Siti N.', 'Yoga A.', 'Nisa A.', 'Hendra W.', 'Dian P.', 'Farhan M.', 'Lia K.', 'Agus R.', 'Maya D.', 'Tono W.', 'Fitri H.', 'Deni S.', 'Andi B.', 'Ratna P.']
  const CITIES = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Yogyakarta', 'Makassar', 'Palembang', 'Denpasar', 'Malang', 'Bekasi', 'Tangerang', 'Bogor', 'Depok']
  const APPS_NAME = ['FoodLocal', 'Restaurant Pro']

  const EVENTS = [
    { type: 'join', template: locale === 'id' ? '{name} dari {city} baru bergabung' : '{name} from {city} just joined' },
    { type: 'sale', template: locale === 'id' ? '{name} mendapat referral baru — {app}' : '{name} got a new referral — {app}' },
    { type: 'earn', template: locale === 'id' ? '{name} mendapat komisi Rp {amount}' : '{name} earned Rp {amount} commission' },
    { type: 'click', template: locale === 'id' ? '{name} — link diklik {clicks}x hari ini' : '{name} — link clicked {clicks}x today' },
    { type: 'share', template: locale === 'id' ? '{name} membagikan di {platform}' : '{name} shared on {platform}' },
  ]
  const PLATFORMS = ['TikTok', 'Instagram', 'WhatsApp', 'Facebook', 'YouTube']
  const ICONS = { join: '👋', sale: '🎉', earn: '💰', click: '👆', share: '📲' }
  const COLORS = { join: '#71717A', sale: '#22c55e', earn: '#FACC15', click: '#A1A1AA', share: '#EAB308' }

  function generateEvent() {
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)]
    const name = NAMES_ID[Math.floor(Math.random() * NAMES_ID.length)]
    const city = CITIES[Math.floor(Math.random() * CITIES.length)]
    const app = APPS_NAME[Math.floor(Math.random() * APPS_NAME.length)]
    const amount = [35000, 100000][Math.floor(Math.random() * 2)].toLocaleString()
    const clicks = Math.floor(Math.random() * 15 + 3)
    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)]
    const text = event.template
      .replace('{name}', name)
      .replace('{city}', city)
      .replace('{app}', app)
      .replace('{amount}', amount)
      .replace('{clicks}', clicks)
      .replace('{platform}', platform)
    const ago = Math.floor(Math.random() * 45 + 1)
    return { id: Date.now() + Math.random(), type: event.type, text, ago: ago + (locale === 'id' ? ' menit lalu' : 'm ago') }
  }

  // Initialize with 8 events
  useEffect(() => {
    const initial = Array.from({ length: 8 }, () => generateEvent())
    setFeed(initial)
  }, [])

  // Add new event every 4-8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateEvent()
      setFadeIn(newEvent.id)
      setFeed(prev => [newEvent, ...prev.slice(0, 14)])
      setTimeout(() => setFadeIn(null), 800)
    }, Math.random() * 4000 + 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FACC15', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
      <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{locale === 'id' ? 'Komunitas Agents' : 'Agent Community'}</h3>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{locale === 'id' ? 'Aktivitas agent secara real-time' : 'Real-time agent activity'}</p>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>LIVE</span>
        <span style={{ fontSize: 11, color: '#aaa' }}>— {locale === 'id' ? '240 agents aktif' : '240 agents active'}</span>
      </div>

      {/* Top Agents */}
      {leaderboard.length > 0 && (
        <div style={{ background: '#1a1a1a', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FACC15', marginBottom: 10 }}>{locale === 'id' ? '🏆 Top Agents Bulan Ini' : '🏆 Top Agents This Month'}</div>
          {leaderboard.map((ag, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{ag.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{ag.total_clicks} clicks</span>
            </div>
          ))}
        </div>
      )}

      {/* Live Activity Feed */}
      <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>{locale === 'id' ? '📡 Aktivitas Terkini' : '📡 Live Activity'}</div>
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {feed.map(event => (
          <div
            key={event.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', marginBottom: 6,
              background: fadeIn === event.id ? '#F0FDF4' : '#FAFAFA',
              borderRadius: 12, border: '1px solid #f0f0f0',
              transition: 'background 0.8s ease',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{ICONS[event.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.4 }}>{event.text}</div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{event.ago}</div>
            </div>
            <div style={{ width: 4, height: 4, borderRadius: 2, background: COLORS[event.type], flexShrink: 0, marginTop: 8 }} />
          </div>
        ))}
      </div>

      {/* CSS animation for pulse */}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  )
}

/* ─── FAQ Accordion Item ─── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#FAFAFA', borderRadius: 14, border: '1px solid #f0f0f0', marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.4, flex: 1 }}>{q}</span>
        <span style={{ fontSize: 18, color: '#FACC15', fontWeight: 700, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', fontSize: 12, color: '#555', lineHeight: 1.6 }}>{a}</div>
      )}
    </div>
  )
}

function PromoCarousel({ promos, locale, agentCode, appName, appLink }) {
  const scrollRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [linkCopied, setLinkCopied] = useState(false)

  // Auto-scroll slowly
  useEffect(() => {
    if (paused || promos.length <= 1) return
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const container = scrollRef.current
        const cardWidth = container.scrollWidth / promos.length
        const nextScroll = container.scrollLeft + 1
        if (nextScroll >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0
        } else {
          container.scrollLeft = nextScroll
        }
        // Update current index
        setCurrentIndex(Math.round(container.scrollLeft / cardWidth))
      }
    }, 30)
    return () => clearInterval(interval)
  }, [paused, promos.length])

  // Pause on touch
  function handleTouchStart() { setPaused(true) }
  function handleTouchEnd() { setTimeout(() => setPaused(false), 3000) }

  function scrollTo(dir) {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.clientWidth
    scrollRef.current.scrollBy({ left: dir * cardWidth, behavior: 'smooth' })
    setPaused(true)
    setTimeout(() => setPaused(false), 3000)
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://${appLink}`).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  function shareWa(promo) {
    const msg = locale === 'id'
      ? `${promo.title || appName}\n\nCek & pesan disini:\nhttps://${appLink}`
      : `${promo.title || appName}\n\nCheck & order here:\nhttps://${appLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Group promos by platform inferred from the title prefix (case-insensitive).
  // Banners titled "Facebook — …" / "Instagram — …" land in their own section;
  // anything else goes into a generic "Other" group at the end.
  const platformOf = (p) => {
    const t = String(p.title || '').toLowerCase()
    if (t.includes('facebook')) return 'facebook'
    if (t.includes('instagram')) return 'instagram'
    return 'other'
  }
  const grouped = promos.reduce((acc, p) => {
    const k = platformOf(p)
    ;(acc[k] = acc[k] || []).push(p)
    return acc
  }, {})
  const PLATFORM_META = {
    facebook:  { label: locale === 'id' ? 'Facebook (Landscape)'   : 'Facebook (Landscape)',  hint: locale === 'id' ? 'Untuk feed Facebook & Marketplace'           : 'For Facebook feed & Marketplace',  color: '#1877F2' },
    instagram: { label: locale === 'id' ? 'Instagram (Square)'     : 'Instagram (Square)',    hint: locale === 'id' ? 'Untuk feed Instagram, Reels cover & Stories' : 'For Instagram feed, Reels covers & Stories',  color: '#E4405F' },
    other:     { label: locale === 'id' ? 'Banner Lainnya'         : 'Other Banners',         hint: locale === 'id' ? 'Bisa digunakan di platform mana saja'        : 'Use on any platform',                color: '#1a1a1a' },
  }

  return (
    <div style={{ width: '100%', marginTop: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{locale === 'id' ? 'Kit Promosi' : 'Share Kit'}</span>
          <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{promos.length} {locale === 'id' ? 'banner' : 'banners'}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => scrollTo(-1)} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8249;</button>
          <button onClick={() => scrollTo(1)} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8250;</button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
        {locale === 'id' ? 'Salin link & bagikan banner ini di sosial media' : 'Copy your link & share these banners on social media'}
      </div>

      {/* Per-platform sections: Facebook first (landscape), Instagram second (square), Other last. */}
      {['facebook', 'instagram', 'other'].map((key) => {
        const list = grouped[key]
        if (!list || list.length === 0) return null
        const meta = PLATFORM_META[key]
        return (
          <div key={key} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: meta.color }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{meta.label}</span>
              <span style={{ fontSize: 10, color: '#888' }}>· {list.length} {locale === 'id' ? 'banner' : list.length === 1 ? 'banner' : 'banners'}</span>
            </div>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>{meta.hint}</div>
            <div style={{ display: 'grid', gridTemplateColumns: key === 'instagram' ? 'repeat(2, 1fr)' : '1fr', gap: 10 }}>
              {list.map(promo => (
                <div key={promo.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {promo.type === 'video' ? (
                    <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                      <video src={promo.url} poster={promo.thumbnail_url || ''} style={{ width: '100%', display: 'block', aspectRatio: key === 'instagram' ? '1/1' : '16/9', objectFit: 'cover' }} controls />
                    </div>
                  ) : (
                    <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#f0f0f0' }}>
                      <img src={promo.url} alt={promo.title || ''} style={{ width: '100%', display: 'block', aspectRatio: key === 'instagram' ? '1/1' : '16/9', objectFit: 'cover' }} />
                    </div>
                  )}
                  {promo.title && <div style={{ fontSize: 10, fontWeight: 700, color: '#1a1a1a' }}>{promo.title}</div>}
                  <div style={{ fontSize: 9, color: '#888', wordBreak: 'break-all', background: '#FAFAFA', padding: '4px 6px', borderRadius: 6 }}>{appLink}{agentCode ? '?ref=' + agentCode : ''}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={copyLink} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#FACC15', color: '#1a1a1a', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      {linkCopied ? (locale === 'id' ? 'Tersalin!' : 'Copied!') : (locale === 'id' ? 'Salin Link' : 'Copy Link')}
                    </button>
                    <button onClick={() => shareWa(promo)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: meta.color, color: '#fff', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      {locale === 'id' ? 'Bagikan' : 'Share'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Hidden scroll ref keeps the older arrow nav (ToTop/Bottom) functional;
          per-platform sections above render the actual banner grids. */}
      <div ref={scrollRef} style={{ display: 'none' }} />
    </div>
  )
}

export default function Affiliate({ onClose }) {
  // Auth state
  const [agent, setAgent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sl_affiliate_agent')) || null } catch { return null }
  })
  const [step, setStep] = useState(agent ? 'dashboard' : 'signup') // signup | payment | dashboard
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Signup form
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  // Payment
  const [paymentProof, setPaymentProof] = useState(null)
  const [paymentUploading, setPaymentUploading] = useState(false)

  // Dashboard
  const [tab, setTab] = useState('apps') // apps | stats | earnings | verify
  const [myLeads, setMyLeads] = useState([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsMessage, setLeadsMessage] = useState('')
  const [agentBoard, setAgentBoard] = useState([])
  const [referrals, setReferrals] = useState([])
  const [stats, setStats] = useState({ totalClicks: 0, totalSignups: 0, totalEarnings: 0, pendingPayout: 0 })
  const [copied, setCopied] = useState(false)

  // Verification
  const [bankName, setBankName] = useState(agent?.bank_name || '')
  const [bankAccount, setBankAccount] = useState(agent?.bank_account || '')
  const [bankHolder, setBankHolder] = useState(agent?.bank_holder || '')
  const [ktpFile, setKtpFile] = useState(null)
  const [verifySaving, setVerifySaving] = useState(false)
  const [verifySaved, setVerifySaved] = useState(false)

  // Extended profile fields used by the new dashboard.
  //
  // ── DB migration note ──────────────────────────────────────────
  // The agent table currently has: name, country, whatsapp, agent_code,
  // status, total_clicks, bank_name, bank_account, bank_holder, ktp_url,
  // verification_status. The following extra columns are referenced by
  // the Profile section below — add them to the schema before going
  // live (none of these writes will succeed without the columns):
  //
  //   ALTER TABLE affiliate_agents
  //     ADD COLUMN email     TEXT,
  //     ADD COLUMN photo_url TEXT,
  //     ADD COLUMN city      TEXT,
  //     ADD COLUMN npwp      TEXT;
  //
  // Until the migration runs, the UI gracefully falls back to local
  // state (the values just don't persist server-side).
  const [profEmail, setProfEmail] = useState(agent?.email || '')
  const [profCity, setProfCity] = useState(agent?.city || '')
  const [profCountry, setProfCountry] = useState(agent?.country || '')
  const [profPhotoFile, setProfPhotoFile] = useState(null)
  const [profPhotoUrl, setProfPhotoUrl] = useState(agent?.photo_url || '')
  const [profNpwp, setProfNpwp] = useState(agent?.npwp || '')
  const [profSaving, setProfSaving] = useState(false)
  const [profSaved, setProfSaved] = useState(false)

  // Dashboard nav / UI state
  const [dashSection, setDashSection] = useState('home') // home | tools | banners | earnings | referrals | leads | profile | resources
  const [refFilter, setRefFilter] = useState('all') // all | pending | approved | paid | cancelled
  const [toast, setToast] = useState('')
  function showToast(msg) {
    setToast(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToast(''), 2400)
  }

  // Login
  const [loginMode, setLoginMode] = useState(false)
  const [loginWhatsapp, setLoginWhatsapp] = useState('')
  const [loginCode, setLoginCode] = useState('')

  // Agent App state
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedApp, setSelectedApp] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [drawerPage, setDrawerPage] = useState(null)
  const [appCopied, setAppCopied] = useState(false)
  const [locale, setLocale] = useState(() => localStorage.getItem('sl_agent_locale') || 'id')
  const [promoMaterials, setPromoMaterials] = useState([])
  const [leaderboard, setLeaderboard] = useState([])

  // Seat limits
  const [seatsTaken, setSeatsTaken] = useState(0)
  const [maxSeats, setMaxSeats] = useState(1000)
  const seatsRemaining = maxSeats - seatsTaken

  // Load seat count
  useEffect(() => {
    if (!supabase) return
    async function loadSeats() {
      // Get seat limit for Indonesia (primary market)
      const { data: limit } = await supabase.from('affiliate_seat_limits').select('max_seats').eq('id', 'ID').single()
      if (limit) setMaxSeats(limit.max_seats)
      // Count active + pending agents for Indonesia
      const { count } = await supabase.from('affiliate_agents').select('*', { count: 'exact', head: true }).in('status', ['pending_payment', 'pending_verification', 'active'])
      if (count !== null) setSeatsTaken(count)
    }
    loadSeats()
  }, [])

  useEffect(() => { localStorage.setItem('sl_agent_locale', locale) }, [locale])

  useEffect(() => {
    if (agent) {
      loadDashboardData()
      // Refresh agent data (skip for dev agent)
      if (supabase && agent.id && !String(agent.id).startsWith('dev')) {
        supabase.from('affiliate_agents').select('*').eq('id', agent.id).single().then(({ data }) => {
          if (data) {
            const updated = { ...agent, ...data }
            setAgent(updated)
            localStorage.setItem('sl_affiliate_agent', JSON.stringify(updated))
            setBankName(data.bank_name || '')
            setBankAccount(data.bank_account || '')
            setBankHolder(data.bank_holder || '')
            // Extended profile fields (only present once migration is applied)
            if (data.email !== undefined) setProfEmail(data.email || '')
            if (data.city !== undefined) setProfCity(data.city || '')
            if (data.photo_url !== undefined) setProfPhotoUrl(data.photo_url || '')
            if (data.npwp !== undefined) setProfNpwp(data.npwp || '')
            if (data.country) setProfCountry(data.country)
          }
        })
      }
    }
  }, [agent?.id])

  async function loadDashboardData() {
    if (!supabase) return
    // Always load promo materials + leaderboard
    const [promoRes, topAgentsRes] = await Promise.all([
      supabase.from('affiliate_promo_materials').select('*').eq('active', true).order('sort_order'),
      supabase.from('affiliate_agents').select('name, agent_code, total_clicks').eq('status', 'active').eq('country', 'ID').order('total_clicks', { ascending: false }).limit(5),
    ])
    if (promoRes.data) setPromoMaterials(promoRes.data)
    if (topAgentsRes.data) setLeaderboard(topAgentsRes.data)
    // Load referrals only for real agents
    if (agent?.id && !String(agent.id).startsWith('dev') && !String(agent.id).startsWith('local')) {
      const { data: refs } = await supabase.from('affiliate_referrals').select('*').eq('agent_id', agent.id).order('created_at', { ascending: false })
      if (refs) {
        setReferrals(refs)
        const totalEarnings = refs.filter(r => r.status === 'paid').reduce((s, r) => s + (r.commission_amount || 0), 0)
        const pendingPayout = refs.filter(r => r.status === 'approved').reduce((s, r) => s + (r.commission_amount || 0), 0)
        setStats({
          totalClicks: agent.total_clicks || 0,
          totalSignups: refs.length,
          totalEarnings,
          pendingPayout,
        })
      }
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (!name.trim() || !country || !whatsapp.trim()) { setError('Please fill all fields'); return }
    if (seatsRemaining <= 0) { setError('All agent seats are filled. Join the waitlist!'); setLoading(false); return }
    setError('')
    setLoading(true)
    try {
      // Generate agent code using their WhatsApp last 4 digits for personalization
      const waDigits = whatsapp.replace(/[^0-9]/g, '')
      const lastDigits = waDigits.slice(-4)
      const code = 'agent' + lastDigits
      if (supabase) {
        // Check if WhatsApp already registered
        const { data: existing } = await supabase.from('affiliate_agents').select('id').eq('whatsapp', waDigits).single()
        if (existing) { setError('This WhatsApp number is already registered'); setLoading(false); return }
        // Check if code taken (rare collision), append random if so
        const { data: codeExists } = await supabase.from('affiliate_agents').select('id').eq('agent_code', code).single()
        const finalCode = codeExists ? code + Math.floor(10 + Math.random() * 90) : code

        const { data, error: dbErr } = await supabase.from('affiliate_agents').insert({
          name: name.trim(),
          country,
          whatsapp: waDigits,
          agent_code: finalCode,
          status: 'pending_payment',
          total_clicks: 0,
        }).select().single()
        if (dbErr) throw new Error(dbErr.message)
        const agentData = data
        setAgent(agentData)
        localStorage.setItem('sl_affiliate_agent', JSON.stringify(agentData))
      } else {
        const agentData = { id: 'local-' + Date.now(), name: name.trim(), country, whatsapp: waDigits, agent_code: code, status: 'pending_payment' }
        setAgent(agentData)
        localStorage.setItem('sl_affiliate_agent', JSON.stringify(agentData))
      }
      setStep('payment')
    } catch (err) {
      setError(err.message || 'Signup failed')
    }
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!loginWhatsapp.trim() || !loginCode.trim()) { setError('Please enter WhatsApp and agent code'); return }
    setError('')
    setLoading(true)
    try {
      if (supabase) {
        const { data } = await supabase.from('affiliate_agents').select('*')
          .eq('whatsapp', loginWhatsapp.replace(/[^0-9]/g, ''))
          .eq('agent_code', loginCode.trim())
          .single()
        if (!data) { setError('Invalid credentials'); setLoading(false); return }
        setAgent(data)
        localStorage.setItem('sl_affiliate_agent', JSON.stringify(data))
        setBankName(data.bank_name || '')
        setBankAccount(data.bank_account || '')
        setBankHolder(data.bank_holder || '')
        setStep(data.status === 'pending_payment' ? 'payment' : 'dashboard')
      }
    } catch {
      setError('Login failed')
    }
    setLoading(false)
  }

  async function handlePaymentProof() {
    if (!paymentProof) return
    setPaymentUploading(true)
    try {
      let proofUrl = null
      if (supabase && agent?.id) {
        const ext = paymentProof.name.split('.').pop()
        const path = `affiliate-payments/${agent.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('images').upload(path, paymentProof, { contentType: paymentProof.type })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
          proofUrl = urlData?.publicUrl
        }
        await supabase.from('affiliate_agents').update({
          status: 'pending_verification',
          payment_proof: proofUrl,
          paid_at: new Date().toISOString(),
        }).eq('id', agent.id)
        const updated = { ...agent, status: 'pending_verification', payment_proof: proofUrl }
        setAgent(updated)
        localStorage.setItem('sl_affiliate_agent', JSON.stringify(updated))
      }
      setStep('dashboard')
    } catch {
      setError('Upload failed, please try again')
    }
    setPaymentUploading(false)
  }

  async function handleVerification(e) {
    e.preventDefault()
    if (!bankName.trim() || !bankAccount.trim() || !bankHolder.trim()) { setError('Please fill all bank details'); return }
    setVerifySaving(true)
    setError('')
    try {
      let ktpUrl = agent?.ktp_url || null
      if (ktpFile && supabase && agent?.id) {
        const ext = ktpFile.name.split('.').pop()
        const path = `affiliate-ktp/${agent.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('images').upload(path, ktpFile, { contentType: ktpFile.type })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
          ktpUrl = urlData?.publicUrl
        }
      }
      if (supabase && agent?.id) {
        await supabase.from('affiliate_agents').update({
          bank_name: bankName.trim(),
          bank_account: bankAccount.trim(),
          bank_holder: bankHolder.trim(),
          ktp_url: ktpUrl,
          verification_status: 'submitted',
        }).eq('id', agent.id)
        const updated = { ...agent, bank_name: bankName, bank_account: bankAccount, bank_holder: bankHolder, ktp_url: ktpUrl, verification_status: 'submitted' }
        setAgent(updated)
        localStorage.setItem('sl_affiliate_agent', JSON.stringify(updated))
      }
      setVerifySaved(true)
      setTimeout(() => setVerifySaved(false), 3000)
    } catch {
      setError('Failed to save verification details')
    }
    setVerifySaving(false)
  }

  function copyLink() {
    const link = `streetlocal.live/a/${agent?.agent_code || 'agent0000'}`
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  // ── Profile save (email / city / country / photo / npwp) ──
  // Writes to `affiliate_agents`. Each field is sent only if its column
  // exists in the schema (the migration in `affiliate_agents` declaration
  // adds: email, photo_url, city, npwp). If the DB rejects an unknown
  // column the call falls back to writing only the always-present
  // `country` field so the rest of the UI still works.
  async function handleProfileSave() {
    if (!supabase || !agent?.id || String(agent.id).startsWith('dev') || String(agent.id).startsWith('local')) {
      // Local-only update for dev/local agents
      const updated = { ...agent, email: profEmail, city: profCity, country: profCountry, photo_url: profPhotoUrl, npwp: profNpwp }
      setAgent(updated)
      localStorage.setItem('sl_affiliate_agent', JSON.stringify(updated))
      setProfSaved(true); setTimeout(() => setProfSaved(false), 2400)
      return
    }
    setProfSaving(true)
    try {
      let photoUrl = profPhotoUrl
      if (profPhotoFile) {
        const ext = profPhotoFile.name.split('.').pop()
        const path = `affiliate-photos/${agent.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('assets').upload(path, profPhotoFile, { contentType: profPhotoFile.type, upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path)
          photoUrl = urlData?.publicUrl
          setProfPhotoUrl(photoUrl)
        }
      }
      const payload = {
        country: profCountry || agent.country,
        email: profEmail || null,
        city: profCity || null,
        photo_url: photoUrl || null,
        npwp: profNpwp || null,
      }
      let { error: dbErr } = await supabase.from('affiliate_agents').update(payload).eq('id', agent.id)
      if (dbErr) {
        // Column missing — retry with only the columns that definitely exist
        await supabase.from('affiliate_agents').update({ country: payload.country }).eq('id', agent.id)
      }
      const updated = { ...agent, ...payload, photo_url: photoUrl }
      setAgent(updated)
      localStorage.setItem('sl_affiliate_agent', JSON.stringify(updated))
      setProfSaved(true); setTimeout(() => setProfSaved(false), 2400)
      setProfPhotoFile(null)
    } catch (e) {
      setError(e.message || 'Failed to save profile')
    }
    setProfSaving(false)
  }

  function logout() {
    localStorage.removeItem('sl_affiliate_agent')
    setAgent(null)
    setStep('signup')
    setTab('apps')
  }

  const agentLink = `streetlocal.live/a/${agent?.agent_code || 'agent0000'}`
  const isVerified = agent?.verification_status === 'verified'
  const isActive = agent?.status === 'active'
  const isPendingPayment = agent?.status === 'pending_payment'
  const isPendingVerification = agent?.status === 'pending_verification'

  /* ─── SIGNUP ─── */
  if (step === 'signup') {
    return (
      <div style={s.page} id="top">
        <style>{`
          @media (min-width: 900px) {
            .aff-hero { grid-template-columns: 1.15fr 1fr !important; gap: 60px !important; padding: 60px 0 48px !important; align-items: center !important; }
          }
        `}</style>
        <div style={{ ...s.topBar, borderBottom: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.5px' }}>Streetlocal<span style={{ color: '#FACC15' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#71717A', fontWeight: 600, letterSpacing: 0.5 }}>Agent Programme</div>
          </div>
          <button onClick={() => {
            const devAgent = { id: 'dev-admin', name: 'Admin (DEV)', country: 'ID', whatsapp: '0000000000', agent_code: 'agent0000', status: 'active', verification_status: 'verified', total_clicks: 42 }
            setAgent(devAgent)
            localStorage.setItem('sl_affiliate_agent', JSON.stringify(devAgent))
            setStep('dashboard')
          }} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', fontSize: 8, fontWeight: 700, cursor: 'pointer', marginRight: 6 }}>DEV</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>

        <div style={s.content}>
          {/* ── PREMIUM HERO — side-by-side pitch + signup card ── */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 36, padding: '40px 0 32px', alignItems: 'start' }} className="aff-hero">
            {/* LEFT — value pitch */}
            <div style={{ maxWidth: 560 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(234,179,8,0.5)', color: '#854D0E', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: '#EAB308', boxShadow: '0 0 10px rgba(250,204,21,0.9)' }} />
                🇮🇩 StreetLocal Agent Programme
              </span>
              <h1 style={{ fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.04, letterSpacing: '-1.2px', color: '#0A0A0A', margin: '0 0 22px' }}>
                Become a StreetLocal Agent.<br />
                <span style={{ background: 'linear-gradient(120deg, #EAB308 0%, #FACC15 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Earn Rp 35K–180K per signup.</span>
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.55, color: '#52525B', margin: '0 0 26px', fontWeight: 500, maxWidth: 480 }}>
                Refer Indonesian donut shops to StreetLocal. Earn a one-time bounty on every paying vendor — paid 30 days after their first subscription clears. No recurring fees on you, no commission cap.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { strong: 'Rp 35K bounty on Starter (Rp 38K vendor)', tail: '· 92% of first month' },
                  { strong: 'Rp 80K bounty on Professional', tail: '· Rp 180K on Enterprise' },
                  { strong: 'Paid 30 days after first charge', tail: '· bank transfer in IDR, no card fee' },
                ].map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: '#3F3F46', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 11, background: '#FACC15', color: '#0A0A0A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, marginTop: 1 }}>✓</span>
                    <span><strong style={{ color: '#0A0A0A', fontWeight: 800 }}>{b.strong}</strong> <span style={{ color: '#71717A' }}>{b.tail}</span></span>
                  </li>
                ))}
              </ul>
              <a href="#programme-details" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0A0A0A', fontWeight: 800, fontSize: 14, textDecoration: 'underline', textDecorationColor: '#FACC15', textDecorationThickness: 2, textUnderlineOffset: 4 }}>
                See full programme details ↓
              </a>
            </div>

            {/* RIGHT — signup / login card */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -10, background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', borderRadius: 28, filter: 'blur(28px)', opacity: 0.32, zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1, background: '#FFFFFF', borderRadius: 22, padding: 28, border: '1px solid rgba(234,179,8,0.25)', boxShadow: '0 24px 60px rgba(250,204,21,0.18), 0 4px 14px rgba(45,27,27,0.08)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#EAB308', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{loginMode ? 'Agent sign in' : 'Activate your dashboard'}</div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0A0A0A', margin: '0 0 6px', letterSpacing: '-0.4px' }}>{loginMode ? 'Welcome back' : 'Get your agent link in 30 seconds'}</h2>
                <p style={{ fontSize: 13, color: '#71717A', margin: '0 0 20px', lineHeight: 1.5 }}>{loginMode ? 'Sign in with your WhatsApp + agent code.' : 'Sign up and your agent dashboard is live immediately. No card required.'}</p>

                {!loginMode ? (
                  <form onSubmit={handleSignup}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#52525B', marginBottom: 6, display: 'block' }}>Full name</label>
                    <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E4E4E7', background: '#FAFAFA', color: '#0A0A0A', fontSize: 15, outline: 'none', marginBottom: 14, boxSizing: 'border-box', fontFamily: 'inherit' }} placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />

                    <label style={{ fontSize: 12, fontWeight: 700, color: '#52525B', marginBottom: 6, display: 'block' }}>Country</label>
                    <select style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E4E4E7', background: '#FAFAFA', color: '#0A0A0A', fontSize: 15, outline: 'none', marginBottom: 14, boxSizing: 'border-box', appearance: 'none', fontFamily: 'inherit' }} value={country} onChange={e => setCountry(e.target.value)}>
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                    </select>

                    <label style={{ fontSize: 12, fontWeight: 700, color: '#52525B', marginBottom: 6, display: 'block' }}>WhatsApp number</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      <span style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #E4E4E7', background: '#F4F4F5', fontSize: 14, fontWeight: 700, color: '#52525B', display: 'flex', alignItems: 'center', minWidth: 64, justifyContent: 'center' }}>{COUNTRIES.find(c => c.code === country)?.prefix || '+00'}</span>
                      <input style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid #E4E4E7', background: '#FAFAFA', color: '#0A0A0A', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} type="tel" placeholder="812 3456 7890" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                    </div>

                    {whatsapp && (
                      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700, marginBottom: 2 }}>Your agent link will be:</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A', wordBreak: 'break-all' }}>streetlocal.live/a/agent{whatsapp.replace(/[^0-9]/g, '').slice(-4) || '0000'}</div>
                      </div>
                    )}

                    {error && <div style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontWeight: 600, border: '1px solid #FECACA' }}>{error}</div>}

                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', color: '#0A0A0A', fontSize: 16, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 22px rgba(250,204,21,0.45)', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
                      {loading ? 'Activating…' : 'Activate Dashboard →'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, fontSize: 12, color: '#71717A' }}>
                      <button type="button" onClick={() => { setLoginMode(true); setError('') }} style={{ background: 'none', border: 'none', color: '#0A0A0A', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationColor: '#FACC15', textDecorationThickness: 2, textUnderlineOffset: 4, fontFamily: 'inherit' }}>
                        Already an agent? Sign in
                      </button>
                      <span>{seatsRemaining.toLocaleString()} seats left</span>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLogin}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#52525B', marginBottom: 6, display: 'block' }}>WhatsApp number</label>
                    <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E4E4E7', background: '#FAFAFA', color: '#0A0A0A', fontSize: 15, outline: 'none', marginBottom: 14, boxSizing: 'border-box', fontFamily: 'inherit' }} type="tel" placeholder="e.g. 6281234567890" value={loginWhatsapp} onChange={e => setLoginWhatsapp(e.target.value)} />

                    <label style={{ fontSize: 12, fontWeight: 700, color: '#52525B', marginBottom: 6, display: 'block' }}>Agent code</label>
                    <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E4E4E7', background: '#FAFAFA', color: '#0A0A0A', fontSize: 15, outline: 'none', marginBottom: 14, boxSizing: 'border-box', fontFamily: 'inherit' }} placeholder="e.g. agent2345" value={loginCode} onChange={e => setLoginCode(e.target.value)} />

                    {error && <div style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontWeight: 600, border: '1px solid #FECACA' }}>{error}</div>}

                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', color: '#0A0A0A', fontSize: 16, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 22px rgba(250,204,21,0.45)', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
                      {loading ? 'Signing in…' : 'Sign in →'}
                    </button>

                    <button type="button" onClick={() => { setLoginMode(false); setError('') }} style={{ width: '100%', padding: 10, marginTop: 12, background: 'none', border: 'none', color: '#0A0A0A', fontSize: 13, fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#FACC15', textDecorationThickness: 2, textUnderlineOffset: 4, fontFamily: 'inherit' }}>
                      Don't have an account? Sign up
                    </button>
                  </form>
                )}

                <p style={{ fontSize: 11, color: '#A1A1AA', textAlign: 'center', marginTop: 14, marginBottom: 0 }}>
                  By {loginMode ? 'signing in' : 'signing up'} you agree to our <button onClick={() => setStep('terms')} style={{ background: 'none', border: 'none', color: '#0A0A0A', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 11, fontFamily: 'inherit', fontWeight: 700 }}>Agent Terms & Conditions</button>.
                </p>
              </div>
            </div>
          </section>

          {/* Anchor for the "See full details ↓" link in the hero */}
          <div id="programme-details" style={{ scrollMarginTop: 80 }}>

          {/* Limited Seats Banner */}
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Limited Seats — Act Now</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#FACC15' }}>{seatsRemaining.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 2 }}>seats remaining out of {maxSeats.toLocaleString()}</div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ width: `${(seatsTaken / maxSeats) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #FACC15, #FACC15)', borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Once all seats are filled, no new agents can join unless a cancellation opens up</div>
          </div>

          {/* Benefits */}
          <div style={s.benefitsGrid}>
            {[
              { icon: '💰', title: 'Up to Rp 180K per signup', desc: 'One-time bounty per vendor — Starter Rp 35K, Pro Rp 80K, Enterprise Rp 180K' },
              { icon: '🔗', title: 'Your Number = Your Link', desc: 'Your agent link includes your WhatsApp number' },
              { icon: '📊', title: 'Live Dashboard', desc: 'Monitor signups, earnings, and payouts in real-time' },
              { icon: '📱', title: 'Agent App', desc: 'Your own agent storefront app for just Rp 35.000/month' },
            ].map((b, i) => (
              <div key={i} style={s.benefitCard}>
                <span style={{ fontSize: 24 }}>{b.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginTop: 6 }}>{b.title}</div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4, marginTop: 4 }}>{b.desc}</div>
              </div>
            ))}
          </div>

          {/* ── WHAT APPS YOU CAN SELL — premium 3-column grid ── */}
          <section style={{ marginBottom: 36 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: '#0A0A0A', color: '#FACC15', fontSize: 12, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 14 }}>Full catalog</span>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0A0A0A', margin: '0 0 12px', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
                What you can sell as an agent
              </h2>
              <p style={{ fontSize: 16, color: '#52525B', maxWidth: 580, margin: '0 auto', lineHeight: 1.55, fontWeight: 500 }}>
                <strong style={{ color: '#0A0A0A' }}>All StreetLocal apps are covered</strong> under the agent reseller programme — three verticals, three order channels, one commission you earn on every signup.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="aff-apps-grid">
              {[
                { icon: '🍜', tint: '#FACC15', tintBg: 'rgba(250,204,21,0.10)', title: 'Food',     blurb: 'Street carts, warungs, cafés, restaurants', detail: 'Donut shops, noodle stalls, bakeries, coffee carts, full-service restaurants — anyone selling prepared food.', variants: [{ tag: 'WhatsApp', desc: 'Orders go to vendor\'s WhatsApp' }, { tag: 'Chat', desc: 'Orders go to in-app chat' }] },
                { icon: '🛍️', tint: '#52525B', tintBg: 'rgba(82,82,91,0.10)', title: 'Products', blurb: 'Retail, fashion, electronics, anything physical',                                detail: 'Boutiques, electronics stores, hijab shops, accessories, beauty, household goods — physical product catalogs.', variants: [{ tag: 'WhatsApp', desc: 'Orders go to vendor\'s WhatsApp' }, { tag: 'Chat', desc: 'Orders go to in-app chat' }, { tag: 'Email', desc: 'Orders sent to vendor\'s email' }] },
                { icon: '🛠️', tint: '#22C55E', tintBg: 'rgba(34,197,94,0.10)',  title: 'Services', blurb: '40+ trades — AC, plumber, electrician, hairdresser, tutor, mechanic…',          detail: 'Bookings + service menus + deposit-on-book for every appointment trade. Newest category, biggest demand gap.', badge: 'NEW 2026', variants: [{ tag: 'WhatsApp', desc: 'Bookings go to vendor\'s WhatsApp' }, { tag: 'Chat', desc: 'Bookings go to in-app chat' }, { tag: 'Email', desc: 'Bookings sent to vendor\'s email' }] },
              ].map((cat, i) => (
                <article key={i} style={{ position: 'relative', background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 22, padding: 28, transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 2px 8px rgba(45,27,27,0.04)' }}>
                  {/* Top: icon tile + title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: cat.tintBg, border: `1.5px solid ${cat.tint}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, boxShadow: `0 4px 14px ${cat.tint}25` }}>{cat.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0A0A0A', margin: 0, letterSpacing: '-0.3px' }}>{cat.title}</h3>
                        {cat.badge && <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', background: cat.tint, padding: '3px 8px', borderRadius: 6, letterSpacing: '0.6px' }}>{cat.badge}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: '#52525B', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>{cat.blurb}</p>
                    </div>
                  </div>
                  {/* Detail copy */}
                  <p style={{ fontSize: 13, color: '#71717A', margin: 0, lineHeight: 1.6 }}>{cat.detail}</p>
                  {/* Variant chips */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Order channels</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cat.variants.map((v, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAFAFA', border: '1px solid #E4E4E7', borderRadius: 12, padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: cat.tint, textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 70, padding: '2px 8px', borderRadius: 6, background: cat.tintBg, textAlign: 'center' }}>{v.tag}</span>
                          <span style={{ fontSize: 12, color: '#52525B', lineHeight: 1.4 }}>{v.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Footer: commission reminder */}
                  <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1px dashed #E4E4E7', fontSize: 12, color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>💰</span> Same agent bounty applies — Starter / Pro / Enterprise tiers
                  </div>
                </article>
              ))}
            </div>
            <style>{`
              @media (min-width: 900px) {
                .aff-apps-grid { grid-template-columns: 1fr 1fr 1fr !important; }
              }
            `}</style>
          </section>

          {/* FAQ */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', marginBottom: 4 }}>Frequently asked questions</h2>
            <p style={{ fontSize: 12, color: '#71717A', marginBottom: 12 }}>What new agents ask before signing up</p>
            {[
              {
                q: 'How many app types can I sign vendors up for?',
                a: 'All three verticals — Food, Products, and Services — are open to agents from day one. There\'s no waiting period, no category restriction, no separate application. Each vertical has its own order-channel variants: Food supports WhatsApp + in-app Chat checkout. Products and Services both add Email as a third channel. The vendor chooses their preferred channel during signup based on how they want to receive orders. From your side as an agent the experience is identical — same dashboard, same referral link format, same commission structure. Your bounty depends on the SUBSCRIPTION TIER the vendor picks (Starter / Professional / Enterprise), not on which vertical or channel they choose. A Services Enterprise signup pays the same Rp 180K bounty as a Food Enterprise signup.',
              },
              {
                q: 'Do I get commission on Services apps too?',
                a: 'Yes — Services is fully covered with the same tier-based bounty structure as Food and Products. Starter pays Rp 35K, Professional pays Rp 80K, Enterprise pays Rp 180K — regardless of which vertical the vendor picks. Services launched in 2026 and is our newest category, which makes it a high-opportunity space for agents right now. We support 40+ trades: AC technicians, plumbers, electricians, hairdressers, tattoo studios, tutors, mechanics, photographers, cleaners, contractors, beauty therapists, and more. Most of these trades currently have no professional-grade booking platform in Indonesia. If you have connections in any of these trades, expect lower competition than the Food vertical where shops are already saturated with platform options. Independent service workers often respond faster than restaurants because the value proposition (a real booking system vs WhatsApp DMs) is much sharper for them.',
              },
              {
                q: 'What if my vendor wants to switch tiers later (Starter ⇄ Pro ⇄ Enterprise)?',
                a: 'Tier changes happen at the monthly renewal boundary. Your vendor can upgrade from Starter to Pro to Enterprise (or downgrade) any month from their dashboard — no contract lock-in, no penalty. Your first-month commission was paid on whatever tier the vendor originally chose at signup; upgrades or downgrades at renewal don\'t generate additional commission for you. This is by design: agents are rewarded for acquisition (getting the vendor in the door), not for the vendor\'s lifetime value progression — that\'s the platform\'s job. If you want to maximize earnings, push the highest tier you can credibly recommend at signup — closing a Pro signup pays Rp 80K vs Starter\'s Rp 35K, and closing Enterprise pays Rp 180K. A serious bakery, multi-location restaurant, or established service business genuinely benefits from Pro/Enterprise features (KDS, custom domain, loyalty programs, multi-staff), so recommending those tiers isn\'t aggressive selling — it\'s matching the vendor to the right product for their business size.',
              },
              {
                q: 'How do I get paid?',
                a: 'Indonesian agents are paid via direct bank transfer (BCA, Mandiri, BRI, BNI, CIMB, Permata, and other major banks). No card processing fees, no Stripe fees — you receive the full Rp 35K / 80K / 180K bounty for each referred vendor that completes their 30-day verification window. Payouts run weekly: every Monday, we batch all referrals whose 30-day window closed during the previous week and transfer the total to your bank on file. You\'ll receive a WhatsApp notification when the transfer lands. International agents (signing up vendors in US / AU / EU / SG / TH / VN / PH / MY) are paid via Stripe Connect — Stripe deducts its processing fee (~2-3% depending on country) from your bounty, and the net amount lands in your local bank within 2-5 business days. There\'s no minimum payout threshold for either route — even a single Rp 35K bounty triggers a transfer once the 30-day window closes. You can view all pending and paid commissions in real-time from the "Earnings" tab in your dashboard.',
              },
              {
                q: 'Can I sign up vendors in countries outside Indonesia?',
                a: 'Yes — agents can sign up vendors in any country where StreetLocal operates: Indonesia (primary market), Malaysia, Singapore, Thailand, Vietnam, Philippines, Australia, US, UK, EU. Each market has localized pricing in its own currency — for example, the US Starter tier is $19/month, the UK is £15/month, Singapore is S$25/month, Australia is A$29/month. Your bounty is paid in the local currency of the vendor (or its IDR equivalent if you\'re an Indonesian agent), and currency conversion uses the daily mid-market rate. International signups still go through the same dashboard and the same 30-day verification window. Note: if you\'re targeting a country you don\'t live in, you\'ll need to find leads yourself — the shared lead pool primarily contains Indonesian leads collected through our Indonesian marketing channels.',
              },
              {
                q: 'How do I claim leads from the shared pool?',
                a: 'Open the "🎯 Leads to Contact" tab in your agent dashboard after signup. Click "Grab Leads" and the system atomically assigns you 5 leads from the shared pool. These are real shop owners who have expressed interest (via the public "Get notified" form on the StreetLocal landing pages or by visiting the donut selling page) but haven\'t signed up yet. Each lead includes their business name, WhatsApp number, city, and what type of business they run — enough context to send a personalized first message rather than a cold blast. They\'re locked to you for 30 days — no other agent can claim or contact them during that window. The "grab 5 at a time" design prevents any single agent from hoarding the entire pool, and the 30-day window forces accountability — if you can\'t close a lead in a month, it returns to circulation for someone else to try. You can grab another batch of 5 as soon as you\'ve finished working through your current set.',
              },
              {
                q: 'What happens if I don\'t contact a grabbed lead?',
                a: 'After 30 days of inactivity (no logged contact attempt, no signup), grabbed leads automatically return to the shared pool and become available for other agents to claim. This is enforced by the system — there\'s no manual review or warning email. We track "last contact" through a simple button in your dashboard: each time you message a lead via WhatsApp, you tick a "contacted" checkbox which resets their 30-day window. As long as you log at least one contact attempt per month, the lead stays yours. If you let leads expire without contact, you\'ll see them disappear from your dashboard at the 30-day mark — no penalty beyond losing those specific leads. Your agent account stays active and you can grab fresh batches anytime. We do flag agents who repeatedly grab-and-abandon (more than 50% expiry rate over a 90-day window) for a follow-up conversation, since that pattern means leads are sitting locked instead of converting — and we\'d rather see them in circulation for other agents who will actually work them.',
              },
            ].map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>

          {/* Fee notice */}
          <div style={s.feeNotice}>
            <span style={{ fontSize: 18 }}>🎫</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>Agent App: {AGENT_FEE_LABEL}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Monthly subscription for your agent app & dashboard</div>
            </div>
          </div>

          {/* Indonesia Pricing Tiers */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🇮🇩</span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>Indonesia pricing tiers</h2>
            </div>
            <p style={{ fontSize: 12, color: '#71717A', marginBottom: 12 }}>
              Vendors pick a tier at signup. Higher tiers pay larger bounties — bigger reward, same effort.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                {
                  name: 'Starter',
                  vendorPays: 'Rp 38.000',
                  bounty: 'Rp 35.000',
                  bountyPct: '92%',
                  color: '#FACC15',
                  features: ['Premium PWA + WhatsApp checkout', 'Marketing banners + auto-post to chat', 'Promo codes + receipts + PPN 11%', 'All 16 payment gateways built-in', '1 staff account · 0% commission'],
                },
                {
                  name: 'Professional',
                  vendorPays: 'Rp 199.000',
                  bounty: 'Rp 80.000',
                  bountyPct: '40%',
                  color: '#EAB308',
                  features: ['Everything in Starter, plus:', 'In-app chat + thermal printer + loyalty stamps', 'Custom domain + tipping + advanced promos', 'SMS (Twilio) + email (Resend) campaigns', '5 staff accounts · priority WhatsApp support'],
                  popular: true,
                },
                {
                  name: 'Enterprise',
                  vendorPays: 'Rp 449.000',
                  bounty: 'Rp 180.000',
                  bountyPct: '40%',
                  color: '#0A0A0A',
                  features: ['Everything in Pro, plus:', 'KDS for tablets + self-serve kiosk mode', 'Production planner + catering + multi-location', 'White-label branding + dedicated account manager', 'Unlimited staff + native app option'],
                },
              ].map(tier => (
                <div key={tier.name} style={{ background: '#FAFAFA', border: `1px solid ${tier.popular ? tier.color : '#E4E4E7'}`, borderRadius: 14, padding: 14, position: 'relative' }}>
                  {tier.popular && (
                    <div style={{ position: 'absolute', top: -8, right: 12, background: tier.color, color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 8, letterSpacing: 0.5 }}>POPULAR</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: tier.color }}>{tier.name}</div>
                      <div style={{ fontSize: 10, color: '#71717A', marginTop: 1 }}>Vendor pays {tier.vendorPays}/month</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#15803D' }}>{tier.bounty}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>· {tier.bountyPct}</span>
                      </div>
                      <div style={{ fontSize: 9, color: '#71717A', marginTop: 4, fontWeight: 600 }}>one-time, paid day 30</div>
                    </div>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#52525B', lineHeight: 1.6 }}>
                    {tier.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Fee Disclosure — covers both vendor payment paths */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>💳</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E', marginBottom: 4 }}>How your commission is calculated</div>
                <div style={{ fontSize: 11, color: '#78350F', lineHeight: 1.5 }}>
                  Vendors can pay their subscription via Midtrans Snap (QRIS / GoPay / OVO / card, ~2.5% processing fee) or via manual bank transfer using an SL-XXXXXX activation code (no processing fee). When the vendor pays via Midtrans, the gateway fee comes out of the affiliate commission, not StreetLocal's share — your real take-home reflects the net amount received. Bank transfer signups pay zero fees so you keep the full Rp 35K (Starter) / Rp 80K (Professional) / Rp 180K (Enterprise) bounty.
                </div>
              </div>
            </div>
          </div>

          {/* Indonesia bank-transfer advantage */}
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 14, padding: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>🏦</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#065F46', marginBottom: 4 }}>Bank-transfer route: zero processing fees</div>
                <div style={{ fontSize: 11, color: '#065F46', lineHeight: 1.5 }}>
                  When a vendor activates via an SL-XXXXXX bank-transfer code (instead of Midtrans), <strong>there are no Stripe / card / gateway fees, no deductions</strong> on their subscription. You keep the full Rp 35K / Rp 80K / Rp 180K bounty (depending on the tier the vendor picked) on every signup paid this way.
                </div>
              </div>
            </div>
          </div>

          </div>{/* /programme-details */}

          {/* Bottom anchor — sends visitors back up to the activation card */}
          <div style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1px solid #FCD34D', borderRadius: 18, padding: '28px 24px', textAlign: 'center', margin: '32px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Ready to start?</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0A0A0A', margin: '0 0 12px', letterSpacing: '-0.4px' }}>Activate your dashboard now</h3>
            <p style={{ fontSize: 14, color: '#52525B', margin: '0 0 20px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
              Your agent code + referral link go live the moment you sign up. No card, no waiting, no approval delay.
            </p>
            <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '14px 26px', borderRadius: 14, background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', color: '#0A0A0A', fontSize: 15, fontWeight: 900, textDecoration: 'none', boxShadow: '0 6px 22px rgba(250,204,21,0.45)', cursor: 'pointer' }}>
              ↑ Activate Dashboard
            </a>
            <div style={{ marginTop: 16, fontSize: 12, color: '#71717A' }}>
              <button onClick={() => setStep('terms')} style={{ background: 'none', border: 'none', color: '#0A0A0A', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12, fontFamily: 'inherit', fontWeight: 700 }}>📋 View Terms & Conditions</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── TERMS & CONDITIONS ─── */
  if (step === 'terms') {
    return (
      <div style={s.page}>
        <div style={{ ...s.topBar, borderBottom: '1px solid #f0f0f0' }}>
          <button onClick={() => setStep(agent ? 'dashboard' : 'signup')} style={s.backBtn}>
            <span style={{ fontSize: 20 }}>&#8592;</span>
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>Terms & Conditions</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600 }}>Agent Programme</div>
          </div>
          <div style={{ width: 44 }} />
        </div>

        <div style={{ padding: '20px 20px 40px' }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Last updated: May 2026</p>

          {/* 1. Relationship */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>1. Independent Contractor Status</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
            Agents are independent contractors and are NOT employees, partners, or representatives of StreetLocal.live. At no point does participation in the Agent Programme create an employment relationship. StreetLocal.live has no obligation to provide benefits, insurance, or protections typically associated with employment.
          </p>

          {/* 2. Tax */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>2. Tax & Government Obligations</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
            Agents are fully responsible for all government taxes, fees, and obligations arising from income earned through the Agent Programme. This includes but is not limited to income tax, VAT, and any local government levies. StreetLocal.live will not withhold taxes or file returns on behalf of agents. It is the agent's sole responsibility to comply with all applicable tax laws in their country of residence.
          </p>

          {/* 3. Account Termination */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>3. Account Deactivation & Termination</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
            StreetLocal.live reserves the right to deactivate, suspend, or permanently terminate any agent account without prior notice if the agent is found to be in violation of these terms, engaging in fraudulent activity, or acting in a manner that damages the reputation of StreetLocal.live. No refunds will be issued for the current billing period upon termination for cause.
          </p>

          {/* 4. Prohibited Content */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>4. Prohibited Content & Platforms</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 8 }}>
            Agent referral links must NOT be shared, posted, or promoted on:
          </p>
          <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, marginBottom: 16 }}>
            <li>Pornographic, adult, or sexually explicit websites or platforms</li>
            <li>Content targeting or accessible to underage individuals (under 18)</li>
            <li>Forums, blogs, or websites that promote illegal activity</li>
            <li>Dark web or anonymous networks</li>
            <li>Hate speech, extremist, or violence-promoting platforms</li>
            <li>Gambling or unregulated financial platforms</li>
            <li>Any platform where the content violates local laws</li>
          </ul>

          {/* 5. Social Media Rules */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>5. Social Media Sharing Rules</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 8 }}>
            Agent links are intended for sharing on legitimate social media platforms (WhatsApp, Instagram, Facebook, TikTok, Twitter/X, YouTube, Telegram) only. Agents must:
          </p>
          <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, marginBottom: 16 }}>
            <li>Follow all rules and policies of the social media platform being used</li>
            <li>Not create fake accounts or profiles to distribute links</li>
            <li>Not impersonate StreetLocal.live or claim to be an official representative</li>
            <li>Not use bots, automation tools, or click farms to generate traffic</li>
            <li>Not post misleading, false, or deceptive claims about the products</li>
            <li>Clearly identify promotional content as such where required by platform rules</li>
          </ul>

          {/* 6. Spam */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>6. Anti-Spam Policy</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
            Spamming is strictly prohibited. This includes but is not limited to: unsolicited bulk emails, mass SMS messages, unsolicited WhatsApp messages to unknown contacts, comment spam on social media posts, and repetitive posting in groups or communities without permission. Violation of this policy will result in immediate account termination without refund.
          </p>

          {/* 7. Marketing Materials */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>7. Marketing Materials & Branding</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 8 }}>
            Agents must adhere to the following regarding promotional materials:
          </p>
          <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, marginBottom: 16 }}>
            <li>Agents may ONLY use banners, videos, and promotional materials officially provided through the Agent Hub Share Kit</li>
            <li>Creating custom banners, advertisements, or promotional materials using the StreetLocal brand, logo, or trademarks is strictly PROHIBITED unless explicitly approved in writing by StreetLocal.live admin</li>
            <li>Agents must not modify, edit, or alter official promotional materials</li>
            <li>Running paid advertisements (Google Ads, Facebook Ads, Instagram Ads, etc.) using StreetLocal branding is NOT permitted unless authorized by admin</li>
            <li>Agents must not create websites, landing pages, or microsites that mimic or replicate StreetLocal.live</li>
            <li>Any unauthorized use of the StreetLocal brand will result in immediate termination</li>
          </ul>

          {/* 8. Commission */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>8. Commission & Payments</h3>
          <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, marginBottom: 16 }}>
            <li>Agents earn a one-time bounty on each referred vendor's first-month subscription: Rp 35K (Starter, 92%), Rp 80K (Professional, 40%), Rp 180K (Enterprise, 40%). No recurring commission on subsequent months.</li>
            <li>After the first month, all subscription revenue belongs to StreetLocal.live</li>
            <li>Agents pay Rp 35.000/month for the Agent App subscription</li>
            <li>Agent app is deactivated immediately if monthly payment is not received</li>
            <li>Payouts are processed on the 1st of each month via bank transfer</li>
            <li>Bank account and KTP (ID) must be verified and matching before any payout is made</li>
            <li>Minimum payout threshold may apply as determined by StreetLocal.live</li>
            <li>Fraudulent referrals (self-referrals, fake accounts, refunded subscriptions) will not be paid and may result in termination</li>
          </ul>

          {/* 9. Seat Limits */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>9. Seat Limits & Availability</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
            Agent seats are limited per country (Indonesia: 1,000 seats). Once all seats are filled, no new agents can join unless an existing agent cancels or is terminated. Seats are non-transferable. StreetLocal.live reserves the right to adjust seat limits at any time.
          </p>

          {/* 10. Data & Privacy */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>10. Data & Privacy</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
            Agents must not collect, store, or misuse personal data of any referred users. All customer data belongs to StreetLocal.live. Agents are prohibited from contacting referred customers directly for purposes unrelated to StreetLocal services.
          </p>

          {/* 11. Liability */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>11. Limitation of Liability</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
            StreetLocal.live is not liable for any loss of income, profits, or damages arising from participation in the Agent Programme. The Agent Programme is provided "as is" and StreetLocal.live makes no guarantees regarding earnings potential. Agents participate at their own risk and discretion.
          </p>

          {/* 12. Changes */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>12. Modifications to Terms</h3>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
            StreetLocal.live reserves the right to modify these terms at any time. Agents will be notified of material changes via the Agent Hub. Continued use of the Agent Programme after changes constitutes acceptance of the updated terms.
          </p>

          <div style={{ background: '#FEF3C7', borderRadius: 12, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>By registering as an Agent, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions in full.</div>
          </div>

          <button onClick={() => setStep(agent ? 'dashboard' : 'signup')} style={{ ...s.primaryBtn, marginTop: 16, background: '#1a1a1a' }}>
            I Understand — Go Back
          </button>
        </div>
      </div>
    )
  }

  /* ─── PAYMENT ─── */
  if (step === 'payment') {
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <button onClick={() => setStep('signup')} style={s.backBtn}>
            <span style={{ fontSize: 20 }}>&#8592;</span>
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>Agent Payment</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600 }}>Monthly subscription</div>
          </div>
          <div style={{ width: 44 }} />
        </div>

        <div style={s.content}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 4 }}>Agent App Subscription</h2>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#FACC15', marginBottom: 4 }}>Rp {AGENT_FEE}/mo</div>
            <p style={{ fontSize: 13, color: '#888' }}>Monthly payment to keep your agent app active</p>
          </div>

          {/* Bank transfer details */}
          <div style={s.paymentCard}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Transfer to:</div>
            <div style={s.paymentRow}>
              <span style={{ color: '#888', fontSize: 13 }}>Bank</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>BCA</span>
            </div>
            <div style={s.paymentRow}>
              <span style={{ color: '#888', fontSize: 13 }}>Account</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>8720 8339 13</span>
            </div>
            <div style={s.paymentRow}>
              <span style={{ color: '#888', fontSize: 13 }}>Name</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>StreetLocal</span>
            </div>
            <div style={{ ...s.paymentRow, borderBottom: 'none' }}>
              <span style={{ color: '#888', fontSize: 13 }}>Amount</span>
              <span style={{ fontWeight: 900, fontSize: 16, color: '#FACC15' }}>Rp {AGENT_FEE}</span>
            </div>
          </div>

          {/* Upload proof */}
          <div style={{ marginTop: 20 }}>
            <label style={{ ...s.label, marginBottom: 8, display: 'block' }}>Upload Payment Proof</label>
            <label style={s.uploadArea}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setPaymentProof(e.target.files[0])} />
              {paymentProof ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>✅</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{paymentProof.name}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Tap to change</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>📸</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#666' }}>Tap to upload screenshot</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>JPG, PNG accepted</div>
                </div>
              )}
            </label>
          </div>

          {error && <div style={{ ...s.error, marginTop: 12 }}>{error}</div>}

          <button
            style={{ ...s.primaryBtn, marginTop: 16, opacity: (!paymentProof || paymentUploading) ? 0.5 : 1 }}
            disabled={!paymentProof || paymentUploading}
            onClick={handlePaymentProof}
          >
            {paymentUploading ? 'Uploading...' : 'Submit Payment Proof'}
          </button>

          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            Your agent account will be activated within 24 hours after payment is verified. Subscription renews monthly.
          </p>
        </div>
      </div>
    )
  }

  /* ─── AGENT APP (DASHBOARD) ─── */

  // Bilingual labels
  const L = locale === 'id' ? {
    agentHub: 'Agents Dashboard',
    appLibrary: 'Koleksi Aplikasi',
    allCategories: 'Semua',
    earnings: 'Penghasilan',
    referrals: 'Referral',
    yourLink: 'Link Agen Anda',
    copyLink: 'Salin',
    copied: 'Tersalin!',
    openDemo: 'Buka Demo',
    shareWa: 'Bagikan ke WhatsApp',
    copyAppLink: 'Salin Link Aplikasi',
    youEarn: 'Anda dapat',
    price: 'Harga',
    perMonth: '/bulan',
    alsoInCategory: 'Juga dalam kategori ini',
    stats: 'Statistik',
    verify: 'Verifikasi',
    settings: 'Pengaturan',
    language: 'Bahasa',
    logout: 'Keluar',
    howItWorks: 'Cara Kerja',
    step1: 'Bagikan link Anda',
    step1d: 'Kirim link agen Anda ke calon vendor',
    step2: 'User coba demo',
    step2d: 'Mereka jelajahi aplikasi via link referral Anda',
    step3: 'User berlangganan',
    step3d: 'Saat mereka bayar, Anda dapat 100% bulan pertama',
    step4: 'Terima pembayaran',
    step4d: 'Pembayaran tanggal 1 setiap bulan ke bank Anda',
    totalEarned: 'Total Didapat',
    pending: 'Menunggu',
    nextPayout: 'Pembayaran berikutnya: tanggal 1 bulan depan',
    noReferrals: 'Belum ada referral',
    shareToEarn: 'Bagikan link agen Anda untuk mulai menghasilkan',
    bankName: 'Nama Bank',
    accountNumber: 'Nomor Rekening',
    accountHolder: 'Nama Pemilik Rekening',
    ktpPhoto: 'Foto KTP',
    submitVerify: 'Kirim untuk Verifikasi',
    verified: 'Terverifikasi — Siap Menerima Pembayaran',
    underReview: 'Sedang Ditinjau',
    notVerified: 'Belum Terverifikasi',
    commission100: '100% Bulan Pertama',
    commissionDesc: 'Anda menerima seluruh biaya langganan bulan pertama dari setiap user baru',
  } : {
    agentHub: 'Agents Dashboard',
    appLibrary: 'App Library',
    allCategories: 'All',
    earnings: 'Earnings',
    referrals: 'Referrals',
    yourLink: 'Your Agent Link',
    copyLink: 'Copy',
    copied: 'Copied!',
    openDemo: 'Open Demo',
    shareWa: 'Share to WhatsApp',
    copyAppLink: 'Copy App Link',
    youEarn: 'You earn',
    price: 'Price',
    perMonth: '/mo',
    alsoInCategory: 'Also in this category',
    stats: 'Stats',
    verify: 'Verify',
    settings: 'Settings',
    language: 'Language',
    logout: 'Logout',
    howItWorks: 'How It Works',
    step1: 'Share Your Link',
    step1d: 'Send your unique agent link to potential vendors',
    step2: 'User Tries Demo',
    step2d: 'They explore the app through your referral link',
    step3: 'User Subscribes',
    step3d: 'When they pay, you earn 100% of the first month',
    step4: 'Get Paid',
    step4d: 'Payouts on the 1st of each month to your verified bank',
    totalEarned: 'Total Earned',
    pending: 'Pending',
    nextPayout: 'Next payout: 1st of next month',
    noReferrals: 'No referrals yet',
    shareToEarn: 'Share your agent link to start earning',
    bankName: 'Bank Name',
    accountNumber: 'Account Number',
    accountHolder: 'Account Holder Name',
    ktpPhoto: 'KTP Photo',
    submitVerify: 'Submit for Verification',
    verified: 'Verified — Ready for Payouts',
    underReview: 'Under Review',
    notVerified: 'Not Verified',
    commission100: '100% First Month',
    commissionDesc: 'You receive the full subscription amount for each new user\'s first month',
  }

  // Categories with apps (data-driven — add more categories here as main app grows)
  const CATEGORIES = [
    {
      id: 'food',
      name: locale === 'id' ? 'Makanan' : 'Food',
      icon: '🍜',
      color: '#FACC15',
      apps: [
        { id: 'basic', name: 'FoodLocal', price: 'Rp 35.000', commission: 'Rp 35.000', color: '#FACC15', icon: '🍜', desc: locale === 'id' ? 'Dari gerobak hingga restoran — pemesanan via WhatsApp' : 'From street carts to restaurants — WhatsApp order channel', screenshot: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png', url: '/food/chat/?plan=whatsapp' },
        { id: 'chat', name: 'FoodLocal Chat', price: 'Rp 50.000', commission: 'Rp 50.000', color: '#22C55E', icon: '💬', desc: locale === 'id' ? 'Storefront yang sama dengan checkout chat dalam aplikasi' : 'Same storefront with private in-app chat checkout + 16 payment gateways', screenshot: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png', url: '/food/chat/?plan=chat' },
        { id: 'pro', name: 'FoodLocal Pro', price: 'From Rp 100.000', commission: 'Rp 100.000', color: '#FACC15', icon: '🍽️', desc: locale === 'id' ? 'Suite restoran lengkap: menu extras, deal, banner ads, analitik, verifikasi KTP. Order WhatsApp 100k/bln atau Chat dalam aplikasi 150k/bln.' : 'Full restaurant suite: menu extras, deals, banner ads, analytics, KTP-verified. WhatsApp orders 100k/mo or in-app Chat orders 150k/mo.', screenshot: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledfsdfsdfsssss.png', url: '/food/pro/' },
      ],
    },
    // Future categories will auto-appear here
    // { id: 'property', name: 'Property', icon: '🏠', color: '#3B82F6', apps: [...] },
  ]

  const allApps = CATEGORIES.flatMap(c => c.apps.map(a => ({ ...a, category: c.name, categoryIcon: c.icon, categoryId: c.id })))

  const filteredApps = selectedCategory === 'all' ? allApps : allApps.filter(a => a.categoryId === selectedCategory)

  function getAppLink(app) {
    return `streetlocal.live${app.url}?ref=${agent?.agent_code || ''}`
  }

  function getDemoUrl(app) {
    if (window.location.hostname === 'localhost') {
      // Both basic and chat run on the same food-basic dev port (5177);
      // the plan query param is what differentiates them.
      if (app.id === 'basic') return `http://localhost:5177/food/chat/?ref=${agent?.agent_code || ''}&plan=whatsapp`
      if (app.id === 'chat') return `http://localhost:5177/food/chat/?ref=${agent?.agent_code || ''}&plan=chat`
      if (app.id === 'pro') return `http://localhost:5174/food/pro/?ref=${agent?.agent_code || ''}`
    }
    return `${app.url}?ref=${agent?.agent_code || ''}`
  }

  function copyAppLink(app) {
    navigator.clipboard.writeText(getAppLink(app)).then(() => { setAppCopied(true); setTimeout(() => setAppCopied(false), 2000) })
  }

  function shareWhatsApp(app) {
    const msg = locale === 'id'
      ? `Hai! Cek aplikasi ini untuk bisnis kamu: ${app.name} — ${getAppLink(app)}`
      : `Hey! Check out this app for your business: ${app.name} — ${getAppLink(app)}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  /* ── App Detail Modal ── */
  if (selectedApp) {
    const cat = CATEGORIES.find(c => c.apps.some(a => a.id === selectedApp.id))
    const otherApps = cat ? cat.apps.filter(a => a.id !== selectedApp.id) : []
    return (
      <div style={s.page}>
        <div style={{ ...s.topBar, borderBottom: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Agents Dashboard</div>
          </div>
          <button onClick={() => setDrawer(true)} style={{ ...s.backBtn, fontSize: 22 }}>☰</button>
        </div>

        {/* Back button row */}
        <div style={{ padding: '4px 16px 0', display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', color: '#FACC15', fontSize: 13, fontWeight: 700 }}>
            <span style={{ fontSize: 18 }}>&#8592;</span> {locale === 'id' ? 'Kembali' : 'Back'}
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Large phone mockup */}
          <div style={{ width: 220, height: 440, borderRadius: 36, background: '#1a1a1a', padding: 4, position: 'relative', boxShadow: `0 20px 60px ${selectedApp.color}22, 0 8px 24px rgba(0,0,0,0.15)`, border: '2px solid #333' }}>
            <div style={{ position: 'absolute', right: -3, top: 95, width: 3, height: 32, borderRadius: '0 2px 2px 0', background: '#333' }} />
            <div style={{ position: 'absolute', left: -3, top: 78, width: 3, height: 20, borderRadius: '2px 0 0 2px', background: '#333' }} />
            <div style={{ position: 'absolute', left: -3, top: 104, width: 3, height: 20, borderRadius: '2px 0 0 2px', background: '#333' }} />
            <div style={{ width: '100%', height: '100%', borderRadius: 32, background: '#000', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 56, height: 18, background: '#000', borderRadius: 20, zIndex: 3 }} />
              {selectedApp.screenshot ? (
                <img src={selectedApp.screenshot} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 48, opacity: 0.3 }}>{selectedApp.icon}</span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>

          {/* App info */}
          <div style={{ textAlign: 'center', marginTop: 20, width: '100%' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a' }}>{selectedApp.name}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4, lineHeight: 1.5 }}>{selectedApp.desc}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#888' }}>{L.price}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a' }}>{selectedApp.price}{L.perMonth}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888' }}>{L.youEarn}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{selectedApp.commission}</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => copyAppLink(selectedApp)} style={{ ...s.primaryBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>🔗</span> {appCopied ? L.copied : L.copyAppLink}
            </button>
            <a href={getDemoUrl(selectedApp)} target="_blank" rel="noopener noreferrer" style={{ ...s.primaryBtn, background: '#1a1a1a', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>▶️</span> {L.openDemo}
            </a>
            <button onClick={() => shareWhatsApp(selectedApp)} style={{ ...s.primaryBtn, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>📲</span> {L.shareWa}
            </button>
          </div>

          {/* Share Kit — Auto-scrolling Promo Carousel */}
          {(() => {
            const appPromos = promoMaterials.filter(p =>
              p.app_id === selectedApp.id ||
              (p.category_id === selectedApp.categoryId && !p.app_id) ||
              (p.category_id === 'global' && !p.app_id) // global affiliate banners — shown for every app
            )
            if (appPromos.length === 0) return null
            return <PromoCarousel promos={appPromos} locale={locale} agentCode={agent?.agent_code} appName={selectedApp.name} appLink={getAppLink(selectedApp)} />
          })()}

          {/* Other apps in same category */}
          {otherApps.length > 0 && (
            <div style={{ width: '100%', marginTop: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>{L.alsoInCategory}</div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {otherApps.map(app => (
                  <div key={app.id} onClick={() => setSelectedApp({ ...app, category: cat.name, categoryIcon: cat.icon, categoryId: cat.id })} style={{ flexShrink: 0, width: 120, cursor: 'pointer' }}>
                    <div style={{ width: 120, height: 200, borderRadius: 20, background: '#1a1a1a', padding: 2, position: 'relative', border: '2px solid #eee' }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', background: '#000' }}>
                        {app.screenshot ? (
                          <img src={app.screenshot} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 28, opacity: 0.3 }}>{app.icon}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0A0A0A', marginTop: 6, textAlign: 'center' }}>{app.name}</div>
                    <div style={{ fontSize: 11, color: '#15803D', fontWeight: 800, textAlign: 'center' }}>{app.commission} · {app.commissionPct}</div>
                    <div style={{ fontSize: 10, color: '#71717A', fontWeight: 600, textAlign: 'center', marginTop: 1 }}>Owners pay {app.price}/mo</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ─────────────────────────────────────────────────────────────
     ── Main Agent App / Dashboard (step === 'dashboard') ──
     A premium single-page dashboard. Sidebar nav on desktop,
     bottom tab bar on mobile. Sections scroll-anchored.
     ───────────────────────────────────────────────────────────── */

  // Bilingual dashboard strings — idiomatic Indonesian, not literal
  const D = locale === 'id' ? {
    greet: 'Halo',
    activeStatus: 'Aktif',
    pendingVerification: 'Menunggu Verifikasi',
    pendingPayment: 'Menunggu Pembayaran',
    monthEarn: 'Pendapatan bulan ini',
    pendingPayout: 'Menunggu dicairkan',
    totalVendors: 'Vendor terbawa',
    conversionRate: 'Konversi (klik → daftar)',
    quickTools: 'Alat Cepat',
    yourLink: 'Link referral kamu',
    copy: 'Salin',
    copied: 'Tersalin!',
    qrTitle: 'Kode QR',
    qrDesc: 'Cetak atau pasang di flyer offline',
    downloadPng: 'Unduh PNG',
    share: 'Bagikan',
    sharePack: 'Unduh share pack',
    sharePackDesc: 'Semua banner siap-pakai untuk sosmed',
    bannerStudio: 'Studio Banner',
    bannerStudioDesc: 'Banner resmi siap-pakai. Tambahkan caption pribadimu saat memposting.',
    earningsTitle: 'Pendapatan',
    last4Months: '4 bulan terakhir',
    nextPayoutDate: 'Pembayaran berikutnya',
    pending30Day: 'Menunggu (30 hari kerja)',
    paidHistory: 'Riwayat pembayaran',
    downloadCsv: 'Unduh CSV',
    referralsTitle: 'Referral Saya',
    filterAll: 'Semua',
    filterPending: 'Menunggu',
    filterApproved: 'Disetujui',
    filterPaid: 'Dibayar',
    filterCancelled: 'Dibatalkan',
    noReferralsTitle: 'Belum ada referral',
    leadPoolTitle: 'Lead Pool',
    leadPoolDesc: 'Ambil 25 lead segar dari pool publik. Eksklusif untukmu selama 30 hari.',
    profileTitle: 'Profil & KYC',
    personalInfo: 'Info Pribadi',
    fullName: 'Nama lengkap',
    email: 'Email',
    whatsapp: 'WhatsApp',
    profilePhoto: 'Foto profil',
    uploadPhoto: 'Pilih foto',
    location: 'Lokasi',
    country: 'Negara',
    city: 'Kota',
    bankInfo: 'Detail Bank',
    bankName: 'Nama Bank',
    accountNumber: 'Nomor Rekening',
    accountHolder: 'Nama Pemegang Rekening',
    ibanSwift: 'IBAN / SWIFT (internasional)',
    ktpId: 'Foto KTP / ID',
    npwp: 'NPWP (opsional)',
    taxNotice: 'Pajak penghasilan adalah tanggung jawab kamu sendiri. StreetLocal tidak memotong pajak.',
    verifStatus: 'Status verifikasi',
    notSubmitted: 'Belum diajukan',
    submitted: 'Diajukan',
    verified: 'Terverifikasi',
    rejected: 'Ditolak',
    saveProfile: 'Simpan profil',
    saved: 'Tersimpan!',
    submitVerify: 'Ajukan Verifikasi',
    resourcesTitle: 'Bantuan & FAQ',
    waSupport: 'Hubungi via WhatsApp',
    viewTerms: 'Lihat Syarat & Ketentuan',
    logout: 'Keluar',
    navHome: 'Beranda',
    navTools: 'Alat',
    navEarn: 'Pendapatan',
    navProfile: 'Profil',
    navBanners: 'Banner',
    navRefs: 'Referral',
    navLeads: 'Lead',
    navMore: 'Lainnya',
    more: 'Lainnya',
    backToHome: 'Kembali ke beranda',
    chooseCountry: 'Pilih negara',
    landscape: 'Landscape 1200×630',
    square: 'Square 1080×1080',
    story: 'Story 1080×1920',
    downloadShareKit: 'Unduh semua banner (.zip akan dikemas)',
    awaitingPayment: 'Pembayaran belum diterima — selesaikan dulu untuk mengaktifkan',
    payNow: 'Bayar Sekarang',
    day: 'Hari',
    of30: 'dari 30',
    perMonth: '/bulan',
    leaderboard: 'Papan Peringkat',
    marketingTips: 'Tips Marketing',
    community: 'Komunitas',
    appLibrary: 'Koleksi Aplikasi',
    appLibraryDesc: 'Ketuk untuk melihat detail & ambil link per-app',
    payoutSchedule: 'Pembayaran setiap Senin. Komisi dilepas 30 hari setelah vendor membayar bulan pertamanya.',
    sharePackNote: 'Kit berisi banner Landscape, Square, dan Story dalam bahasa ID & EN.',
    devSeedData: 'Data tampilan menggunakan contoh hingga referral asli masuk.',
    faqs: [
      { q: 'Kapan saya dibayar?',
        a: 'Pembayaran berjalan setiap hari Senin. Setiap komisi ditahan selama 30 hari setelah vendor melakukan pembayaran bulanan pertama yang berhasil — masa tahan ini melindungi kamu dan kami dari chargeback, refund, dan signup palsu (vendor yang batal di minggu ke-2 seharusnya tidak menghasilkan bounty untuk lead yang tidak benar-benar convert). Setelah 30 hari berlalu, bounty kamu pindah dari "Pending" ke "Released" di dashboard, dan pada Senin berikutnya akan ditransfer ke rekening bank yang kamu daftarkan di Profil. Agen Indonesia menerima transfer bank langsung (BCA / Mandiri / BRI / BNI / CIMB dan bank besar lainnya) tanpa potongan biaya pemrosesan. Agen internasional dibayar via Stripe Connect ke bank lokal mereka, dengan biaya pemrosesan Stripe (~2-3%) dipotong dari bounty. Tidak ada batas minimum pencairan — satu bounty Rp 35K pun langsung trigger transfer setelah memenuhi syarat. Kamu bisa melihat setiap komisi pending dan released secara real-time di tab Earnings. Kalau transfer gagal (detail bank salah, rekening tutup), saldo tetap ada dan kamu bisa update info bank di Profil, lalu kami coba lagi Senin berikutnya.',
      },
      { q: 'Berapa komisi per signup?',
        a: 'Bounty bersifat satu kali (one-time) dan tergantung TIER LANGGANAN yang dipilih vendor saat signup. Starter (vendor bayar Rp 38.000/bulan) → kamu dapat Rp 35.000, yaitu 92% dari bulan pertama vendor. Professional (vendor bayar Rp 199.000/bulan) → kamu dapat Rp 80.000, sekitar 40%. Enterprise (vendor bayar Rp 449.000/bulan) → kamu dapat Rp 180.000, juga ~40%. TIDAK ADA komisi berulang setelah bounty bulan pertama — reward kamu untuk akuisisi vendor, bukan untuk nilai langganan jangka panjang vendor. Ini sengaja dirancang supaya matematika sederhana: lebih banyak signup = lebih banyak uang, tidak perlu spreadsheet. Kalau vendor upgrade dari Starter ke Pro di bulan ke-4, kamu tidak dapat tambahan komisi — upgrade revenue masuk ke StreetLocal. Untuk maksimalkan pendapatan, rekomendasikan tier tertinggi yang benar-benar dibutuhkan vendor (toko roti multi-staf atau restoran multi-cabang punya alasan jelas untuk pilih Pro atau Enterprise — itu bukan menjual berlebihan, itu mencocokkan produk dengan ukuran bisnis).',
      },
      { q: 'Bagaimana cara mendapat lead?',
        a: 'Ada dua jalur. (1) Network kamu sendiri: bagikan link referral pribadi dari dashboard — setiap chat WhatsApp, bio Instagram, halaman Facebook, video TikTok, channel Telegram, atau signature email adalah potensi signup. Gunakan Banner Studio di dashboard untuk grab grafik siap-pakai (format Landscape, Square, Story) dalam Bahasa Indonesia dan Inggris supaya postinganmu kelihatan profesional tanpa harus design sendiri. (2) Lead pool bersama: setiap kali tombol "Grab Leads" tersedia, kamu bisa klaim 25 lead sekaligus — ini adalah pemilik toko nyata yang sudah ekspresikan minat lewat form "Get notified" di halaman publik StreetLocal tapi belum signup. Setiap lead berisi nama bisnis, nomor WhatsApp, kota, dan jenis usaha — cukup konteks untuk kirim pesan pembuka yang personal. Lead terkunci ke kamu selama 30 hari — tidak ada agen lain yang bisa klaim atau hubungi mereka dalam masa itu. Kalau kamu tidak log setidaknya satu upaya kontak per bulan, lead kembali ke pool. Best practice: klaim batch kecil, kerjakan sistematis (pesan template → follow up setelah 24 jam → follow up lagi setelah 3 hari), lalu klaim batch baru.',
      },
      { q: 'Apakah saya wajib bayar bulanan?',
        a: 'Tidak — bergabung dengan program agen sepenuhnya gratis. Tidak ada biaya signup, tidak ada langganan bulanan, tidak ada target penjualan minimum, dan tidak ada penalti untuk bulan-bulan tidak aktif. Kamu hanya menghasilkan uang saat berhasil mereferensikan vendor berbayar. Satu-satunya tanggung jawab finansial kamu adalah pajak penghasilan atas komisi yang diterima. Di Indonesia ini berarti PPh (Pajak Penghasilan) di bawah aturan untuk penghasilan freelance / wiraswasta — yang sudah jadi kewajiban pribadi kamu sebagai independent contractor. StreetLocal TIDAK memotong pajak atas nama kamu, TIDAK membuat laporan SPT untuk kamu, dan TIDAK menerbitkan Form 1721 (bukti pemotongan PPh 21 karyawan) karena kamu bukan karyawan. Kami menyediakan ringkasan penghasilan tahunan via dashboard yang bisa kamu export ke CSV untuk akuntan kamu. Kalau komisi tahunan melewati threshold PPh 21 (saat ini ~Rp 60jt/tahun untuk individu), kamu mungkin perlu daftar NPWP — tambahkan di Profil supaya kami bisa menyertakannya di ringkasan penghasilan. Untuk agen internasional, kamu menangani pajak sesuai aturan self-employment negara kamu sendiri.',
      },
      { q: 'Bisakah saya membuat banner sendiri?',
        a: 'Tidak — mohon gunakan hanya banner resmi dari Banner Studio di dashboard. Kami punya aturan ini untuk melindungi kamu dan brand. (1) Konsistensi brand: customer mengenali banner StreetLocal di ribuan agen yang posting di ribuan platform; memodifikasi logo/warna/typography melemahkan pengenalan itu dan menurunkan conversion rate kamu juga. (2) Kepatuhan hukum: banner sudah pre-review untuk standar iklan di Indonesia (aturan Bawaslu, KPI, OJK tentang promosi finansial) — banner yang dimodifikasi bisa memicu komplain yang menghabiskan seluruh akun agen kamu. (3) Akurasi komisi: banner resmi berisi link referral unik kamu dengan parameter tracking yang benar; versi buatan sendiri kemungkinan kehilangan link atau merusak atribusi, artinya signup tidak akan dikreditkan ke kamu. Yang BOLEH kamu lakukan: tambahkan caption / teks postingan kamu sendiri saat sharing (bahasa apa saja, gaya apa saja — jadilah diri sendiri), tag teman-teman, tulis pitch kamu sendiri kenapa produk ini bagus, posting di grup Facebook lokal atau chat WhatsApp. Cukup biarkan gambar banner-nya tidak diubah. Modifikasi tidak sah berulang bisa berakhir dengan suspensi akun di bawah T&C agen.',
      },
      { q: 'Bagaimana KTP saya disimpan?',
        a: 'Ketika kamu upload KTP (atau ID pemerintah lainnya untuk agen internasional), file disimpan di bucket Supabase Storage privat dengan policy row-level security yang membatasi akses baca ke (a) kamu, melihat file kamu sendiri dari sesi terautentikasi, dan (b) tim verifikasi StreetLocal, yang me-review submission secara manual dan menandai akun kamu sebagai Verified, Pending, atau Rejected. File TIDAK dapat diakses publik — tidak ada URL publik, tidak ada indexing Google, tidak ada sharing ke pihak ketiga. Juga TIDAK terlihat oleh agen lain, vendor, atau siapa pun yang login ke platform. Setelah verifikasi selesai (biasanya 1-3 hari kerja), file tetap di storage untuk memenuhi syarat retensi KYC di bawah regulasi finansial Indonesia (tidak boleh secara hukum meng-onboard orang yang menerima pembayaran cross-border tanpa menyimpan ID mereka untuk audit). Di bawah UU PDP (Undang-Undang Pelindungan Data Pribadi), kamu berhak meminta penghapusan KTP kapan saja dengan email ke streetlocallive@gmail.com — kami akan menghapusnya dalam 30 hari, tapi melakukan itu berarti kamu tidak bisa lagi menjadi agen verified dan payout tertunda mungkin ditahan sampai verifikasi alternatif. Bucket dienkripsi at rest (AES-256) dan in transit (TLS 1.3).',
      },
    ],
  } : {
    greet: 'Hi',
    activeStatus: 'Active',
    pendingVerification: 'Pending verification',
    pendingPayment: 'Pending payment',
    monthEarn: 'This month earnings',
    pendingPayout: 'Pending payout',
    totalVendors: 'Total vendors referred',
    conversionRate: 'Conversion (clicks → signups)',
    quickTools: 'Quick Tools',
    yourLink: 'Your referral link',
    copy: 'Copy',
    copied: 'Copied!',
    qrTitle: 'QR code',
    qrDesc: 'Print or paste on offline flyers',
    downloadPng: 'Download PNG',
    share: 'Share',
    sharePack: 'Download share pack',
    sharePackDesc: 'All ready-to-use social banners',
    bannerStudio: 'Banner Studio',
    bannerStudioDesc: 'Official banners ready to share. Add your own caption when posting.',
    earningsTitle: 'Earnings',
    last4Months: 'Last 4 months',
    nextPayoutDate: 'Next payout',
    pending30Day: 'Pending (30-day hold)',
    paidHistory: 'Payout history',
    downloadCsv: 'Download CSV',
    referralsTitle: 'My Referrals',
    filterAll: 'All',
    filterPending: 'Pending',
    filterApproved: 'Verified',
    filterPaid: 'Paid',
    filterCancelled: 'Cancelled',
    noReferralsTitle: 'No referrals yet',
    leadPoolTitle: 'Lead Pool',
    leadPoolDesc: 'Grab 25 fresh leads from the shared pool. Locked to you for 30 days.',
    profileTitle: 'Profile & KYC',
    personalInfo: 'Personal info',
    fullName: 'Full name',
    email: 'Email',
    whatsapp: 'WhatsApp',
    profilePhoto: 'Profile photo',
    uploadPhoto: 'Choose photo',
    location: 'Location',
    country: 'Country',
    city: 'City',
    bankInfo: 'Bank details',
    bankName: 'Bank name',
    accountNumber: 'Account number',
    accountHolder: 'Account holder',
    ibanSwift: 'IBAN / SWIFT (international)',
    ktpId: 'KTP / ID upload',
    npwp: 'NPWP (optional)',
    taxNotice: 'You are responsible for your own income tax. StreetLocal does not withhold.',
    verifStatus: 'Verification status',
    notSubmitted: 'Not submitted',
    submitted: 'Submitted',
    verified: 'Verified',
    rejected: 'Rejected',
    saveProfile: 'Save profile',
    saved: 'Saved!',
    submitVerify: 'Submit verification',
    resourcesTitle: 'Help & FAQ',
    waSupport: 'Contact us on WhatsApp',
    viewTerms: 'View Terms & Conditions',
    logout: 'Log out',
    navHome: 'Home',
    navTools: 'Tools',
    navEarn: 'Earnings',
    navProfile: 'Profile',
    navBanners: 'Banners',
    navRefs: 'Referrals',
    navLeads: 'Leads',
    navMore: 'More',
    more: 'More',
    backToHome: 'Back to home',
    chooseCountry: 'Choose country',
    landscape: 'Landscape 1200×630',
    square: 'Square 1080×1080',
    story: 'Story 1080×1920',
    downloadShareKit: 'Download all banners (.zip will be assembled)',
    awaitingPayment: 'Payment not received — finish that first to activate',
    payNow: 'Pay now',
    day: 'Day',
    of30: 'of 30',
    perMonth: '/mo',
    leaderboard: 'Leaderboard',
    marketingTips: 'Marketing tips',
    community: 'Community',
    appLibrary: 'App library',
    appLibraryDesc: 'Tap an app to see details & grab per-app links',
    payoutSchedule: 'Payouts every Monday. Commission released 30 days after the vendor pays their first month.',
    sharePackNote: 'Kit includes Landscape, Square, and Story banners in EN & ID.',
    devSeedData: 'Showing seed data until real referrals come in.',
    faqs: [
      { q: 'When do I get paid?',
        a: 'Payouts run every Monday. Each commission is held for exactly 30 days after the vendor makes their first successful monthly payment — that hold protects both you and us from chargebacks, refunds, and fraudulent signups (a vendor who cancels in week 2 should not pay you a bounty for a lead that never converted). Once the 30-day window closes, your bounty moves from "Pending" to "Released" in the dashboard, and on the next Monday it is transferred to the bank account on your profile. Indonesian agents get a direct bank transfer (BCA / Mandiri / BRI / BNI / CIMB and other major banks) with zero processing fees deducted. International agents are paid via Stripe Connect into their local bank, with Stripe\'s processing fee (~2-3%) coming out of your bounty. There is no minimum payout threshold — even a single Rp 35K bounty triggers a transfer once eligible. You can see every pending and released commission in real-time under the Earnings tab. If a transfer ever fails (wrong bank details, closed account), it stays in your balance and you can fix the bank info in Profile, then we retry the following Monday.',
      },
      { q: 'How much do I earn per signup?',
        a: 'Bounties are one-time and depend on the SUBSCRIPTION TIER your referred vendor picks at signup. Starter (vendor pays Rp 38,000/month) → you earn Rp 35,000, which is 92% of the vendor\'s first month. Professional (vendor pays Rp 199,000/month) → you earn Rp 80,000, which is roughly 40%. Enterprise (vendor pays Rp 449,000/month) → you earn Rp 180,000, also ~40%. There is NO recurring commission after the first-month bounty — your reward is for acquisition, not for the vendor\'s ongoing subscription value. This is by design and keeps the math simple: more signups = more money, no spreadsheet needed. If the vendor upgrades from Starter to Pro in month 4, you do not get a top-up commission — the upgrade revenue flows to StreetLocal. To maximize earnings, recommend the highest tier the vendor genuinely needs (a multi-staff bakery or restaurant chain has clear reasons to pick Pro or Enterprise — that is not over-selling, it is matching the right product to the right size of business).',
      },
      { q: 'How do I get leads?',
        a: 'Two streams. (1) Your own network: share the personalized referral link from your dashboard — every WhatsApp chat, Instagram bio, Facebook page, TikTok video, Telegram channel, or email signature is a potential signup. Use the Banner Studio in your dashboard to grab pre-designed graphics (Landscape, Square, Story formats) in EN + ID so your posts look professional without you doing design work. (2) Shared lead pool: every time the "Grab Leads" button refills, you can claim 25 leads at once — these are real shop owners who have expressed interest via the "Get notified" form on StreetLocal\'s public pages but have not signed up yet. Each lead includes business name, WhatsApp number, city, and what they sell — enough context for a personalized opening message. Leads are locked to you for 30 days — no other agent can claim or contact them in that window. If you do not log at least one contact attempt per month, the lead returns to the pool. Best practice: claim a small batch, work it methodically (template message → follow up after 24h → follow up again after 3 days), then come back for more.',
      },
      { q: 'Do I have to pay a monthly fee?',
        a: 'No — joining the agent programme is completely free. There is no signup fee, no monthly subscription, no minimum sales quota, and no penalty for inactive months. You only earn money when you successfully refer a paying vendor. The one financial responsibility you have is income tax on the commissions you receive. In Indonesia, that means PPh (Pajak Penghasilan) under the rules for freelance / self-employed income — which is your personal obligation as an independent contractor. StreetLocal does NOT withhold tax on your behalf, does NOT file returns for you, and does NOT issue Form 1721 (employment tax certificate) because you are not an employee. We do provide annual income summaries via your dashboard that you can export to CSV for your accountant. If your annual commissions cross the PPh 21 threshold (currently ~Rp 60M/year for individuals), you may need to register for an NPWP — add it in your Profile section so we can include it on income summaries. For international agents, you handle tax under your own country\'s self-employment rules.',
      },
      { q: 'Can I make my own banners?',
        a: 'No — please use only the official banners from the Banner Studio in your dashboard. We have these rules to protect both you and the brand. (1) Brand consistency: customers recognize StreetLocal banners across thousands of agents posting to thousands of platforms; modifying logo/colors/typography weakens that recognition and lowers your conversion rate too. (2) Legal compliance: banners are pre-reviewed for advertising standards in Indonesia (Bawaslu, KPI, OJK rules on financial promotion) — a modified banner could trigger a complaint that costs you the entire agent account. (3) Commission accuracy: official banners contain your unique referral link with the right tracking parameters; a self-made version is likely to lose the link or break attribution, meaning signups will not be credited to you. What you CAN do: add your own caption/post text when sharing (in any language, any tone — be yourself), tag relevant friends, write your own pitch about why the product is good, post in local Facebook groups or WhatsApp chats. Just leave the banner image itself unchanged. Repeated unauthorized modification can result in account suspension under the agent T&C.',
      },
      { q: 'How is my KTP stored?',
        a: 'When you upload your KTP (or any government ID for international agents), the file is stored in a private Supabase Storage bucket with row-level security policies that restrict read access to (a) you, viewing your own file from your authenticated session, and (b) StreetLocal\'s verification team, who manually review submissions and mark your account as Verified, Pending, or Rejected. The file is NOT publicly accessible — there is no public URL, no Google indexing, no third-party sharing. It is also NOT visible to other agents, to vendors, or to anyone else who might log into the platform. Once verification completes (typically within 1-3 business days), the file remains in storage to comply with KYC retention requirements under Indonesian financial regulations (you cannot legally onboard people receiving cross-border payments without keeping their ID for audit). Under UU PDP (Indonesia\'s data protection law) you have the right to request deletion of your KTP at any time by emailing streetlocallive@gmail.com — we will delete it within 30 days, but doing so means you can no longer be a verified agent and pending payouts may be held until alternate verification. The bucket is encrypted at rest (AES-256) and in transit (TLS 1.3).',
      },
    ],
  }

  // Build a comprehensive set of share targets driven off the agent link.
  // Used by the Quick Tools card + the Banner Studio cards.
  function buildShareTargets(link, captionEn, captionId) {
    const caption = locale === 'id' ? captionId : captionEn
    const text = `${caption}\n\nhttps://${link}`
    return [
      { id: 'wa',  label: 'WhatsApp', color: '#25D366', icon: '💬', href: `https://wa.me/?text=${encodeURIComponent(text)}` },
      { id: 'fb',  label: 'Facebook', color: '#1877F2', icon: 'f',  href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://' + link)}&quote=${encodeURIComponent(caption)}` },
      { id: 'ig',  label: 'Instagram',color: '#E4405F', icon: '📷', copyOnly: true },
      { id: 'tt',  label: 'TikTok',   color: '#000000', icon: '🎵', copyOnly: true },
      { id: 'tg',  label: 'Telegram', color: '#229ED9', icon: '✈️', href: `https://t.me/share/url?url=${encodeURIComponent('https://' + link)}&text=${encodeURIComponent(caption)}` },
      { id: 'em',  label: 'Email',    color: '#0A0A0A', icon: '✉️', href: `mailto:?subject=${encodeURIComponent(caption)}&body=${encodeURIComponent(text)}` },
    ]
  }

  const agentLastFour = (agent?.whatsapp || '').replace(/[^0-9]/g, '').slice(-4) || '0000'
  const fullAgentLink = `streetlocal.live/a/${agent?.agent_code || 'agent' + agentLastFour}`
  const fullAgentUrl = `https://${fullAgentLink}`

  // ── Inline QR generator ──
  // We have no QR library installed in landing/package.json. To avoid
  // a dependency, we use the free api.qrserver.com PNG service as the
  // image source. The PNG can be saved/downloaded directly. If the user
  // adds `qrcode` as a dep later, swap this for a true inline canvas.
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(fullAgentUrl)}`

  function copyToClipboard(value, msg) {
    navigator.clipboard.writeText(value).then(() => showToast(msg || (locale === 'id' ? 'Tersalin!' : 'Copied!')))
  }

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qrSrc
    a.download = `streetlocal-${agent?.agent_code || 'agent'}-qr.png`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // ── Banner studio data ──
  // Pulls live promo materials from Supabase if present; otherwise renders
  // a curated set of placeholder banners grouped by format. Each banner
  // has an EN + ID copy variant baked in.
  const fallbackBanners = [
    { id: 'fb1', format: 'landscape', en: 'Get your shop online in 5 minutes', id: 'Toko online dalam 5 menit', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png' },
    { id: 'fb2', format: 'landscape', en: 'Stop paying 30% commission to delivery apps', id: 'Berhenti bayar komisi 30% ke aplikasi delivery', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledfsdfsdfsssss.png' },
    { id: 'fb3', format: 'landscape', en: 'WhatsApp checkout · all 16 gateways · 0% commission', id: 'Checkout via WhatsApp · 16 gateway · 0% komisi', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png' },
    { id: 'ig1', format: 'square', en: 'Your shop. Your link. Zero commission.', id: 'Toko kamu. Link kamu. 0% komisi.', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png' },
    { id: 'ig2', format: 'square', en: 'Loyalty stamps · custom domain · KDS', id: 'Loyalty · domain custom · KDS', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledfsdfsdfsssss.png' },
    { id: 'ig3', format: 'square', en: 'Try the demo — no sign up required', id: 'Coba demo — tanpa daftar', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png' },
    { id: 'st1', format: 'story', en: 'Tap link in bio to start free', id: 'Klik link di bio untuk mulai gratis', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png' },
    { id: 'st2', format: 'story', en: 'From Rp 38K/month — full PWA + WA', id: 'Mulai Rp 38K/bulan — PWA lengkap + WA', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledfsdfsdfsssss.png' },
    { id: 'st3', format: 'story', en: 'Why I stopped using GoFood', id: 'Kenapa saya berhenti pakai GoFood', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png' },
  ]
  const liveBanners = (promoMaterials || []).map(p => ({
    id: p.id,
    format: (String(p.title || '').toLowerCase().includes('instagram') || String(p.title || '').toLowerCase().includes('square')) ? 'square'
          : (String(p.title || '').toLowerCase().includes('story') ? 'story' : 'landscape'),
    en: p.title || 'StreetLocal',
    id: p.title || 'StreetLocal',
    img: p.url,
    isVideo: p.type === 'video',
  }))
  const allBanners = liveBanners.length > 0 ? liveBanners : fallbackBanners
  const bannersByFormat = {
    landscape: allBanners.filter(b => b.format === 'landscape'),
    square:    allBanners.filter(b => b.format === 'square'),
    story:     allBanners.filter(b => b.format === 'story'),
  }

  // ── Earnings calculations ──
  // We synthesize the last 4 months of earnings from `referrals` if any
  // exist; otherwise we render a flat baseline so the chart isn't empty.
  function calcMonthlyEarnings() {
    const months = []
    const now = new Date()
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short' })
      const total = (referrals || [])
        .filter(r => r.status === 'paid' && r.paid_at && new Date(r.paid_at).getMonth() === d.getMonth() && new Date(r.paid_at).getFullYear() === d.getFullYear())
        .reduce((sum, r) => sum + (r.commission_amount || 0), 0)
      months.push({ label, value: total })
    }
    // If everything is zero, show seed shape to make the chart readable
    const sum = months.reduce((s, m) => s + m.value, 0)
    if (sum === 0) {
      return [
        { label: months[0].label, value: 0 },
        { label: months[1].label, value: 0 },
        { label: months[2].label, value: 0 },
        { label: months[3].label, value: 0 },
      ]
    }
    return months
  }
  const monthly = calcMonthlyEarnings()
  const maxMonthly = Math.max(1, ...monthly.map(m => m.value))

  function tierBounty(tier) {
    const t = String(tier || '').toLowerCase()
    if (t.includes('enter')) return 180000
    if (t.includes('pro'))   return 80000
    return 35000
  }

  // Next payout = next Monday (or today if today is Monday)
  function nextMondayLabel() {
    const today = new Date()
    const d = new Date(today)
    const dow = d.getDay() // 0=Sun..6=Sat
    const offset = dow === 1 ? 0 : (1 - dow + 7) % 7
    d.setDate(today.getDate() + offset)
    return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // Conversion rate (clicks vs signups)
  const convPct = stats.totalClicks > 0 ? ((stats.totalSignups / stats.totalClicks) * 100).toFixed(1) : '0.0'

  // CSV download for paid history
  function downloadStatementCsv() {
    const rows = [['Date', 'Vendor', 'Tier', 'Amount IDR', 'Status', 'Reference']]
    ;(referrals || []).forEach(r => {
      rows.push([
        r.paid_at ? new Date(r.paid_at).toISOString().slice(0, 10) : new Date(r.created_at).toISOString().slice(0, 10),
        r.customer_name || '',
        r.app_tier || '',
        String(r.commission_amount || tierBounty(r.app_tier)),
        r.status || '',
        r.id ? r.id.slice(0, 8) : '',
      ])
    })
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `streetlocal-statement-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filtered referral rows
  const filteredRefs = (referrals || []).filter(r => {
    if (refFilter === 'all') return true
    return r.status === refFilter
  })

  // Day-30 countdown for a referral
  function daysSinceCreated(r) {
    if (!r.created_at) return 0
    const ms = Date.now() - new Date(r.created_at).getTime()
    return Math.max(0, Math.min(30, Math.floor(ms / (1000 * 60 * 60 * 24))))
  }

  // Verification pill
  const verifPill = (() => {
    const v = agent?.verification_status || 'none'
    if (v === 'verified') return { label: D.verified,    bg: '#D1FAE5', fg: '#065F46', dot: '#22c55e' }
    if (v === 'submitted')return { label: D.submitted,   bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' }
    if (v === 'rejected') return { label: D.rejected,    bg: '#FEE2E2', fg: '#991B1B', dot: '#EF4444' }
    return { label: D.notSubmitted, bg: '#F4F4F5', fg: '#52525B', dot: '#A1A1AA' }
  })()

  // Status pill for hero strip
  const statusPill = (() => {
    if (isPendingPayment)      return { label: D.pendingPayment, bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' }
    if (isPendingVerification) return { label: D.pendingVerification, bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' }
    if (isActive)              return { label: D.activeStatus, bg: '#D1FAE5', fg: '#065F46', dot: '#22c55e' }
    return { label: agent?.status || '', bg: '#F4F4F5', fg: '#52525B', dot: '#A1A1AA' }
  })()

  // ── Sidebar items (desktop) / bottom tabs (mobile) ──
  const navItems = [
    { id: 'home',      label: D.navHome,    icon: '🏠' },
    { id: 'tools',     label: D.navTools,   icon: '🔗' },
    { id: 'banners',   label: D.navBanners, icon: '🎨' },
    { id: 'earnings',  label: D.navEarn,    icon: '💰' },
    { id: 'referrals', label: D.navRefs,    icon: '👥' },
    { id: 'leads',     label: D.navLeads,   icon: '🎯' },
    { id: 'profile',   label: D.navProfile, icon: '👤' },
  ]

  // Bottom-tab condensed set (mobile)
  const mobileTabs = [
    { id: 'home',     label: D.navHome,    icon: '🏠' },
    { id: 'tools',    label: D.navTools,   icon: '🔗' },
    { id: 'earnings', label: D.navEarn,    icon: '💰' },
    { id: 'profile',  label: D.navProfile, icon: '👤' },
  ]

  function navigateTo(id) {
    setDashSection(id)
    // Scroll the matching section into view
    setTimeout(() => {
      const el = document.getElementById(`dash-${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 30)
  }

  return (
    <div style={s.page}>
      {/* ── Sticky glass nav ── */}
      <div style={{ ...s.topBar, borderBottom: '1px solid #E4E4E7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FACC15, #EAB308)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, fontWeight: 900, color: '#0A0A0A' }}>S</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.3px' }}>Streetlocal<span style={{ color: '#FACC15' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#71717A', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>Agent Dashboard</div>
          </div>
        </div>
        {/* EN | ID pill toggle */}
        <div style={{ display: 'inline-flex', background: '#F4F4F5', borderRadius: 999, padding: 3, marginRight: 10, border: '1px solid #E4E4E7' }}>
          <button onClick={() => setLocale('id')} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 900, border: 'none', borderRadius: 999, background: locale === 'id' ? '#0A0A0A' : 'transparent', color: locale === 'id' ? '#FACC15' : '#52525B', cursor: 'pointer', letterSpacing: '0.5px', minWidth: 36 }}>ID</button>
          <button onClick={() => setLocale('en')} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 900, border: 'none', borderRadius: 999, background: locale === 'en' ? '#0A0A0A' : 'transparent', color: locale === 'en' ? '#FACC15' : '#52525B', cursor: 'pointer', letterSpacing: '0.5px', minWidth: 36 }}>EN</button>
        </div>
        <button onClick={() => setDrawer(true)} title={D.more} style={{ ...s.backBtn, fontSize: 20, marginRight: 4, color: '#52525B' }}>⋯</button>
        <button onClick={logout} title={D.logout} style={{ ...s.backBtn, fontSize: 16, color: '#52525B' }}>⎋</button>
      </div>

      {/* ── Pending payment banner ── */}
      {isPendingPayment && (
        <div style={{ background: '#FEF3C7', color: '#92400E', textAlign: 'center', padding: '10px 16px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #FCD34D' }}>
          {D.awaitingPayment} — <button onClick={() => setStep('payment')} style={{ background: 'none', border: 'none', color: '#92400E', fontWeight: 900, textDecoration: 'underline', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>{D.payNow}</button>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 600, background: '#0A0A0A', color: '#FACC15', padding: '12px 20px', borderRadius: 14, fontSize: 13, fontWeight: 800, boxShadow: '0 12px 30px rgba(0,0,0,0.25)', maxWidth: '92vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* ── Layout: sidebar + main on desktop, single column + bottom-tab on mobile ── */}
      <style>{`
        .sl-dash-wrap { display: grid; grid-template-columns: 1fr; gap: 0; max-width: 1200px; margin: 0 auto; padding: 0 clamp(12px, 3vw, 28px); box-sizing: border-box; }
        .sl-dash-side { display: none; }
        .sl-dash-bottom-tabs { position: fixed; left: 0; right: 0; bottom: 0; z-index: 90; background: rgba(255,255,255,0.96); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-top: 1px solid #E4E4E7; padding: 6px 4px calc(6px + env(safe-area-inset-bottom)); display: flex; gap: 2px; box-shadow: 0 -6px 18px rgba(0,0,0,0.04); }
        .sl-dash-main { padding-bottom: calc(92px + env(safe-area-inset-bottom)); }
        .sl-stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sl-tools-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .sl-banner-grid-landscape { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .sl-banner-grid-square { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sl-banner-grid-story { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sl-profile-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 900px) {
          .sl-dash-wrap { grid-template-columns: 240px 1fr; gap: 32px; padding: 24px clamp(16px, 4vw, 40px); align-items: start; }
          .sl-dash-side { display: block; position: sticky; top: 88px; align-self: start; }
          .sl-dash-bottom-tabs { display: none; }
          .sl-dash-main { padding-bottom: 60px; }
          .sl-stat-row { grid-template-columns: repeat(4, 1fr); gap: 14px; }
          .sl-tools-grid { grid-template-columns: 1.1fr 0.9fr; gap: 18px; }
          .sl-banner-grid-landscape { grid-template-columns: 1fr 1fr; }
          .sl-banner-grid-square { grid-template-columns: repeat(3, 1fr); }
          .sl-banner-grid-story { grid-template-columns: repeat(3, 1fr); }
          .sl-profile-grid { grid-template-columns: 1fr 1fr; gap: 18px; }
        }
        .sl-card { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 20px; padding: 18px; box-shadow: 0 2px 8px rgba(45,27,27,0.04); box-sizing: border-box; }
        @media (min-width: 900px) { .sl-card { padding: 22px; } }
        .sl-section-h { font-size: 18px; font-weight: 900; color: #0A0A0A; letter-spacing: -0.3px; margin: 0 0 4px; }
        .sl-section-sub { font-size: 13px; color: #71717A; margin: 0 0 14px; line-height: 1.5; }
        .sl-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid #E4E4E7; background: #FAFAFA; color: #0A0A0A; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; }
        .sl-input:focus { border-color: #FACC15; background: #FFFFFF; }
        .sl-label { font-size: 12px; font-weight: 700; color: #52525B; margin-bottom: 6px; display: block; }
        .sl-btn-primary { padding: 12px 18px; border-radius: 12px; border: none; background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%); color: #0A0A0A; font-size: 14px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(250,204,21,0.35); font-family: inherit; min-height: 44px; }
        .sl-btn-ghost { padding: 10px 14px; border-radius: 12px; border: 1px solid #E4E4E7; background: #FFFFFF; color: #0A0A0A; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; min-height: 44px; }
        .sl-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
      `}</style>

      <div className="sl-dash-wrap">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="sl-dash-side">
          <div className="sl-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F4F4F5' }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: profPhotoUrl ? `url(${profPhotoUrl}) center/cover` : 'linear-gradient(135deg,#FACC15,#EAB308)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#0A0A0A', flexShrink: 0 }}>
                {!profPhotoUrl && (agent?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent?.name || 'Agent'}</div>
                <div style={{ fontSize: 11, color: '#71717A', fontWeight: 700 }}>{agent?.agent_code}</div>
              </div>
            </div>
            {navItems.map(n => (
              <button key={n.id} onClick={() => navigateTo(n.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10,
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, textAlign: 'left', marginBottom: 2, minHeight: 44,
                background: dashSection === n.id ? '#FFFBEB' : 'transparent',
                color: dashSection === n.id ? '#0A0A0A' : '#52525B',
                fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
            <div style={{ borderTop: '1px solid #F4F4F5', marginTop: 10, paddingTop: 10 }}>
              <button onClick={() => setDrawer(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: '#71717A', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>⋯</span>
                <span>{D.more}</span>
              </button>
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>⎋</span>
                <span>{D.logout}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="sl-dash-main" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 14 }}>

          {/* ─── 1. HERO STRIP ─── */}
          <section id="dash-home" style={{ scrollMarginTop: 80 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#71717A', fontWeight: 700 }}>{D.greet},</div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: '#0A0A0A', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{agent?.name || 'Agent'}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                <span className="sl-pill" style={{ background: '#0A0A0A', color: '#FACC15' }}>
                  {agent?.agent_code}
                </span>
                <span className="sl-pill" style={{ background: statusPill.bg, color: statusPill.fg }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: statusPill.dot }} />
                  {statusPill.label}
                </span>
              </div>
            </div>

            <div className="sl-stat-row">
              {[
                { label: D.monthEarn,       value: 'Rp ' + (stats.totalEarnings || 0).toLocaleString(), color: '#22c55e', icon: '💰' },
                { label: D.pendingPayout,   value: 'Rp ' + (stats.pendingPayout || 0).toLocaleString(), color: '#F59E0B', icon: '⏳' },
                { label: D.totalVendors,    value: String(stats.totalSignups || 0),                     color: '#0A0A0A', icon: '👥' },
                { label: D.conversionRate,  value: convPct + '%',                                       color: '#EAB308', icon: '📈' },
              ].map((kpi, i) => (
                <div key={i} className="sl-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</span>
                    <span style={{ fontSize: 16, opacity: 0.5 }}>{kpi.icon}</span>
                  </div>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color: kpi.color, letterSpacing: '-0.4px' }}>{kpi.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── 2. QUICK TOOLS ─── */}
          <section id="dash-tools" style={{ scrollMarginTop: 80 }}>
            <div className="sl-tools-grid">
              {/* Link + share buttons */}
              <div className="sl-card">
                <h2 className="sl-section-h">{D.quickTools}</h2>
                <p className="sl-section-sub">{D.yourLink}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAFA', border: '1px solid #E4E4E7', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{fullAgentLink}</span>
                  <button onClick={() => copyToClipboard(fullAgentUrl, D.copied)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#0A0A0A', color: '#FACC15', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, minHeight: 36 }}>{D.copy}</button>
                </div>

                <div style={{ fontSize: 12, fontWeight: 800, color: '#52525B', marginBottom: 10 }}>{D.share}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  {buildShareTargets(fullAgentLink, 'Open your shop in 5 minutes with StreetLocal — premium PWA + WhatsApp checkout + 0% commission.', 'Buka toko online dalam 5 menit — PWA premium + checkout WA + 0% komisi.').map(t => (
                    <button key={t.id} onClick={() => {
                      if (t.copyOnly) { copyToClipboard(fullAgentUrl, locale === 'id' ? `Link disalin — tempel di ${t.label}` : `Link copied — paste in ${t.label}`); return }
                      window.open(t.href, '_blank', 'noopener')
                    }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, border: 'none', background: t.color, color: t.id === 'tt' || t.id === 'em' ? '#FACC15' : '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                      <span style={{ fontSize: 14 }}>{t.icon}</span>
                      <span style={{ display: 'inline-block' }}>{t.label}</span>
                    </button>
                  ))}
                </div>

                <button onClick={() => {
                  // No bundled .zip without a server endpoint — instead we trigger
                  // sequential downloads of every banner image. The browser will
                  // queue them. Note: many browsers prompt the user once for
                  // multi-download permission.
                  allBanners.forEach((b, i) => setTimeout(() => {
                    const a = document.createElement('a')
                    a.href = b.img
                    a.download = `streetlocal-banner-${b.format}-${b.id}.png`
                    a.target = '_blank'
                    a.rel = 'noopener'
                    document.body.appendChild(a); a.click(); document.body.removeChild(a)
                  }, i * 250))
                  showToast(locale === 'id' ? 'Mengunduh ' + allBanners.length + ' banner…' : 'Downloading ' + allBanners.length + ' banners…')
                }} className="sl-btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#FFFBEB', borderColor: '#FCD34D' }}>
                  <span style={{ fontSize: 16 }}>📦</span> {D.sharePack}
                </button>
                <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 6, lineHeight: 1.4 }}>{D.sharePackNote}</div>
              </div>

              {/* QR card */}
              <div className="sl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h2 className="sl-section-h" style={{ alignSelf: 'flex-start' }}>{D.qrTitle}</h2>
                <p className="sl-section-sub" style={{ alignSelf: 'flex-start' }}>{D.qrDesc}</p>
                <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 16, padding: 12, marginBottom: 14 }}>
                  <img src={qrSrc} alt="Agent QR code" width={200} height={200} style={{ display: 'block', width: 200, height: 200 }} />
                </div>
                <button onClick={downloadQR} className="sl-btn-primary" style={{ width: '100%' }}>
                  {D.downloadPng}
                </button>
              </div>
            </div>
          </section>

          {/* ─── 3. BANNER STUDIO ─── */}
          <section id="dash-banners" style={{ scrollMarginTop: 80 }}>
            <div className="sl-card">
              <h2 className="sl-section-h">{D.bannerStudio}</h2>
              <p className="sl-section-sub">{D.bannerStudioDesc}</p>

              {[
                { key: 'landscape', label: D.landscape, list: bannersByFormat.landscape, grid: 'sl-banner-grid-landscape', ratio: '1200/630' },
                { key: 'square',    label: D.square,    list: bannersByFormat.square,    grid: 'sl-banner-grid-square',    ratio: '1/1' },
                { key: 'story',     label: D.story,     list: bannersByFormat.story,     grid: 'sl-banner-grid-story',     ratio: '9/16' },
              ].map(group => {
                if (!group.list || group.list.length === 0) return null
                return (
                  <div key={group.key} style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: '#FACC15' }} />
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A' }}>{group.label}</span>
                      <span style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 700 }}>· {group.list.length}</span>
                    </div>
                    <div className={group.grid}>
                      {group.list.map(b => {
                        const caption = locale === 'id' ? b.id : b.en
                        return (
                          <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#FAFAFA', borderRadius: 14, padding: 10, border: '1px solid #F4F4F5' }}>
                            <div style={{ width: '100%', aspectRatio: group.ratio, borderRadius: 10, overflow: 'hidden', background: '#0A0A0A' }}>
                              {b.isVideo ? (
                                <video src={b.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                              ) : (
                                <img src={b.img} alt={caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              )}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#3F3F46', lineHeight: 1.35, minHeight: 28 }}>{caption}</div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {buildShareTargets(fullAgentLink, b.en, b.id).slice(0, 3).map(t => (
                                <button key={t.id} onClick={() => {
                                  if (t.copyOnly) { copyToClipboard(fullAgentUrl, locale === 'id' ? `Link disalin — tempel di ${t.label}` : `Link copied — paste in ${t.label}`); return }
                                  window.open(t.href, '_blank', 'noopener')
                                }} title={t.label} style={{ flex: '1 1 0', minHeight: 32, padding: '6px 4px', borderRadius: 8, border: 'none', background: t.color, color: t.id === 'tt' || t.id === 'em' ? '#FACC15' : '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  {t.icon}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => {
                              const a = document.createElement('a')
                              a.href = b.img
                              a.download = `streetlocal-${b.format}-${b.id}.png`
                              a.target = '_blank'
                              a.rel = 'noopener'
                              document.body.appendChild(a); a.click(); document.body.removeChild(a)
                            }} style={{ padding: '8px', borderRadius: 8, border: '1px solid #E4E4E7', background: '#FFFFFF', color: '#0A0A0A', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minHeight: 36 }}>
                              ↓ {D.downloadPng}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ─── 4. EARNINGS ─── */}
          <section id="dash-earnings" style={{ scrollMarginTop: 80 }}>
            <div className="sl-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div>
                  <h2 className="sl-section-h">{D.earningsTitle}</h2>
                  <p className="sl-section-sub" style={{ margin: 0 }}>{D.last4Months}</p>
                </div>
                <button onClick={downloadStatementCsv} className="sl-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>↓</span> {D.downloadCsv}
                </button>
              </div>

              {/* Inline SVG line graph */}
              <div style={{ background: '#FAFAFA', borderRadius: 14, padding: 16, marginBottom: 18 }}>
                <svg viewBox="0 0 320 130" preserveAspectRatio="none" style={{ width: '100%', height: 140, display: 'block' }}>
                  {/* Grid */}
                  {[0, 1, 2, 3].map(i => (
                    <line key={i} x1="32" x2="320" y1={20 + i * 28} y2={20 + i * 28} stroke="#E4E4E7" strokeWidth="1" />
                  ))}
                  {/* Path */}
                  {(() => {
                    const xs = monthly.map((_, i) => 32 + i * ((320 - 40) / 3))
                    const ys = monthly.map(m => 120 - (m.value / maxMonthly) * 92)
                    const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ')
                    const areaPts = `32,120 ${pts} 320,120`
                    return (
                      <>
                        <polygon points={areaPts} fill="url(#sl-area)" opacity="0.35" />
                        <polyline points={pts} fill="none" stroke="#EAB308" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                        {xs.map((x, i) => (
                          <g key={i}>
                            <circle cx={x} cy={ys[i]} r="4" fill="#FACC15" stroke="#0A0A0A" strokeWidth="1.5" />
                            <text x={x} y="128" fontSize="10" fill="#71717A" textAnchor="middle" fontWeight="700">{monthly[i].label}</text>
                          </g>
                        ))}
                        <defs>
                          <linearGradient id="sl-area" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#FACC15" />
                            <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </>
                    )
                  })()}
                </svg>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
                  {monthly.map((m, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A' }}>Rp {(m.value || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next payout */}
              <div style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1px solid #FCD34D', borderRadius: 14, padding: 14, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: '#FACC15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🗓️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{D.nextPayoutDate}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0A0A0A' }}>{nextMondayLabel()}</div>
                  <div style={{ fontSize: 11, color: '#71717A', marginTop: 2, lineHeight: 1.4 }}>{D.payoutSchedule}</div>
                </div>
              </div>

              {/* Pending payouts table */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A', marginBottom: 8 }}>{D.pending30Day}</div>
                {referrals.filter(r => r.status === 'approved' || r.status === 'pending').length === 0 ? (
                  <div style={{ fontSize: 12, color: '#A1A1AA', padding: 16, background: '#FAFAFA', borderRadius: 10, textAlign: 'center' }}>{locale === 'id' ? 'Belum ada referral menunggu.' : 'No pending referrals yet.'}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {referrals.filter(r => r.status === 'approved' || r.status === 'pending').map(r => {
                      const days = daysSinceCreated(r)
                      const bounty = r.commission_amount || tierBounty(r.app_tier)
                      return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#FAFAFA', borderRadius: 12, border: '1px solid #F4F4F5' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customer_name || 'Vendor'}</div>
                            <div style={{ fontSize: 11, color: '#71717A', marginTop: 2 }}>{r.app_tier || '—'} · {D.day} {days} {D.of30}</div>
                            <div style={{ width: '100%', height: 4, background: '#E4E4E7', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                              <div style={{ width: `${(days / 30) * 100}%`, height: '100%', background: '#FACC15' }} />
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#15803D', flexShrink: 0 }}>Rp {bounty.toLocaleString()}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Paid history */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A', marginBottom: 8 }}>{D.paidHistory}</div>
                {referrals.filter(r => r.status === 'paid').length === 0 ? (
                  <div style={{ fontSize: 12, color: '#A1A1AA', padding: 16, background: '#FAFAFA', borderRadius: 10, textAlign: 'center' }}>{locale === 'id' ? 'Belum ada pembayaran tercatat.' : 'No payouts recorded yet.'}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {referrals.filter(r => r.status === 'paid').map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
                        <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700, width: 80, flexShrink: 0 }}>{r.paid_at ? new Date(r.paid_at).toLocaleDateString() : '—'}</span>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customer_name || 'Vendor'}</span>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#15803D' }}>Rp {(r.commission_amount || 0).toLocaleString()}</span>
                        <span style={{ fontSize: 10, color: '#71717A', fontFamily: 'monospace' }}>#{(r.id || '').slice(0, 6)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ─── 5. MY REFERRALS ─── */}
          <section id="dash-referrals" style={{ scrollMarginTop: 80 }}>
            <div className="sl-card">
              <h2 className="sl-section-h">{D.referralsTitle}</h2>
              <p className="sl-section-sub">{stats.totalSignups || 0} total · {convPct}% conversion</p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, overflowX: 'auto' }}>
                {[
                  { id: 'all',       label: D.filterAll,       count: referrals.length },
                  { id: 'pending',   label: D.filterPending,   count: referrals.filter(r => r.status === 'pending').length },
                  { id: 'approved',  label: D.filterApproved,  count: referrals.filter(r => r.status === 'approved').length },
                  { id: 'paid',      label: D.filterPaid,      count: referrals.filter(r => r.status === 'paid').length },
                  { id: 'cancelled', label: D.filterCancelled, count: referrals.filter(r => r.status === 'cancelled').length },
                ].map(f => (
                  <button key={f.id} onClick={() => setRefFilter(f.id)} style={{
                    padding: '8px 12px', borderRadius: 999, border: '1px solid', borderColor: refFilter === f.id ? '#0A0A0A' : '#E4E4E7',
                    background: refFilter === f.id ? '#0A0A0A' : '#FFFFFF', color: refFilter === f.id ? '#FACC15' : '#52525B',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', minHeight: 36,
                  }}>{f.label} · {f.count}</button>
                ))}
              </div>

              {filteredRefs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', background: '#FAFAFA', borderRadius: 14 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#52525B' }}>{D.noReferralsTitle}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredRefs.map(r => {
                    const days = daysSinceCreated(r)
                    const bounty = r.commission_amount || tierBounty(r.app_tier)
                    const sc = r.status === 'paid' ? '#22c55e' : r.status === 'approved' ? '#15803D' : r.status === 'cancelled' ? '#A1A1AA' : '#F59E0B'
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#FAFAFA', borderRadius: 14, border: '1px solid #F4F4F5' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A' }}>{r.customer_name || 'Vendor'}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: sc, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.status}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#71717A' }}>{r.app_tier || '—'}{r.city ? ' · ' + r.city : ''}</div>
                          {r.status !== 'paid' && r.status !== 'cancelled' && (
                            <div style={{ width: '100%', maxWidth: 200, height: 4, background: '#E4E4E7', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                              <div style={{ width: `${(days / 30) * 100}%`, height: '100%', background: '#FACC15' }} />
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: r.status === 'paid' ? '#15803D' : '#0A0A0A' }}>Rp {bounty.toLocaleString()}</div>
                          {r.status !== 'paid' && r.status !== 'cancelled' && (
                            <div style={{ fontSize: 10, color: '#71717A', marginTop: 2 }}>{D.day} {days} {D.of30}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {(referrals.length === 0) && (
                <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>{D.devSeedData}</div>
              )}
            </div>
          </section>

          {/* ─── 6. LEAD POOL ─── */}
          <section id="dash-leads" style={{ scrollMarginTop: 80 }}>
            <div className="sl-card">
              <h2 className="sl-section-h">🎯 {D.leadPoolTitle}</h2>
              <p className="sl-section-sub">{D.leadPoolDesc}</p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button
                  disabled={leadsLoading}
                  onClick={async () => {
                    if (!agent?.id || !supabase) return
                    setLeadsLoading(true); setLeadsMessage('')
                    try {
                      const { data, error } = await supabase.rpc('grab_leads', { p_agent_id: agent.id, p_count: 25 })
                      if (error) setLeadsMessage('⚠️ ' + error.message)
                      else setLeadsMessage((locale === 'id' ? '✓ Ditambahkan ' : '✓ Added ') + (data || []).length + (locale === 'id' ? ' leads ke daftar kamu' : ' leads to your list'))
                      const { data: mine } = await supabase.from('outreach_leads').select('id,business_name,business_type,city,phone,whatsapp,address,status,target_app').eq('agent_id', agent.id).order('status').order('created_at', { ascending: false }).limit(200)
                      setMyLeads(mine || [])
                    } catch (e) { setLeadsMessage('⚠️ ' + e.message) }
                    setLeadsLoading(false)
                  }}
                  className="sl-btn-primary"
                  style={{ flex: 1 }}
                >
                  {leadsLoading ? '⏳ …' : (locale === 'id' ? '🎯 Ambil 25 Leads' : '🎯 Grab 25 Leads')}
                </button>
                <button
                  onClick={async () => {
                    if (!agent?.id || !supabase) return
                    setLeadsLoading(true)
                    const { data } = await supabase.from('outreach_leads').select('id,business_name,business_type,city,phone,whatsapp,address,status,target_app').eq('agent_id', agent.id).order('status').order('created_at', { ascending: false }).limit(200)
                    setMyLeads(data || []); setLeadsLoading(false)
                  }}
                  className="sl-btn-ghost"
                  title="Refresh"
                >🔄</button>
              </div>
              {leadsMessage && <div style={{ padding: 10, background: leadsMessage.includes('⚠️') ? '#FEE2E2' : '#D1FAE5', color: leadsMessage.includes('⚠️') ? '#991B1B' : '#065F46', borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{leadsMessage}</div>}

              {myLeads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', background: '#FAFAFA', borderRadius: 14 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🎯</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#52525B' }}>{locale === 'id' ? 'Belum ada lead. Klik tombol di atas.' : 'No leads yet. Click the button above.'}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflowY: 'auto' }}>
                  {myLeads.map(l => {
                    const phone = (l.whatsapp || l.phone || '').replace(/[^0-9+]/g, '')
                    const wa = phone ? `https://wa.me/${phone.startsWith('+') ? phone.slice(1) : phone}?text=${encodeURIComponent(`Halo ${l.business_name?.split(' ')[0] || ''}! Saya dari StreetLocal — aplikasi pemesanan online untuk bisnis kamu. Tanpa komisi seperti GoFood. Order langsung ke WhatsApp. Mulai Rp 38.000/bulan. Mau lihat demonya?`)}` : null
                    const statusColors = { queued: '#A1A1AA', contacted: '#71717A', responded: '#EAB308', interested: '#22C55E', signed: '#15803D', not_interested: '#A1A1AA', dead: '#EF4444' }
                    const sc = statusColors[l.status] || '#A1A1AA'
                    return (
                      <div key={l.id} style={{ padding: 12, background: '#FAFAFA', borderRadius: 12, borderLeft: `3px solid ${sc}`, border: '1px solid #F4F4F5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A' }}>{l.business_name}</div>
                            <div style={{ fontSize: 11, color: '#71717A', marginTop: 2 }}>{l.business_type} · {l.city}</div>
                            {phone && <div style={{ fontSize: 11, color: '#52525B', marginTop: 2 }}>📞 {l.whatsapp || l.phone}</div>}
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#fff', background: sc, padding: '3px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" onClick={async () => { if (supabase) await supabase.rpc('agent_update_lead_status', { p_agent_id: agent.id, p_lead_id: l.id, p_status: 'contacted' }); setTimeout(async () => { const { data } = await supabase.from('outreach_leads').select('id,business_name,business_type,city,phone,whatsapp,address,status,target_app').eq('agent_id', agent.id).order('status').order('created_at', { ascending: false }).limit(200); setMyLeads(data || []) }, 500) }} style={{ background: '#25D366', color: '#fff', textDecoration: 'none', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, minHeight: 32, display: 'inline-flex', alignItems: 'center' }}>💬 WA</a>}
                          {['contacted','responded','interested','dead'].map(st => (
                            <button key={st} onClick={async () => {
                              if (!supabase) return
                              const { error: rpcErr } = await supabase.rpc('agent_update_lead_status', { p_agent_id: agent.id, p_lead_id: l.id, p_status: st })
                              if (rpcErr) { alert(rpcErr.message); return }
                              const { data } = await supabase.from('outreach_leads').select('id,business_name,business_type,city,phone,whatsapp,address,status,target_app').eq('agent_id', agent.id).order('status').order('created_at', { ascending: false }).limit(200)
                              setMyLeads(data || [])
                            }} style={{ background: st === 'dead' ? '#EF4444' : st === 'interested' ? '#22C55E' : '#71717A', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 32 }}>{st.replace('_', ' ')}</button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ─── 7. PROFILE & KYC ─── */}
          <section id="dash-profile" style={{ scrollMarginTop: 80 }}>
            <div className="sl-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                <h2 className="sl-section-h">{D.profileTitle}</h2>
                <span className="sl-pill" style={{ background: verifPill.bg, color: verifPill.fg, fontSize: 12, padding: '6px 12px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: verifPill.dot }} />
                  {D.verifStatus}: {verifPill.label}
                </span>
              </div>
              <p className="sl-section-sub">{D.personalInfo}</p>

              {/* Tax notice */}
              <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 14px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                <div style={{ fontSize: 12, color: '#78350F', fontWeight: 600, lineHeight: 1.45 }}>{D.taxNotice}</div>
              </div>

              <div className="sl-profile-grid">
                {/* Personal info card */}
                <div>
                  <label className="sl-label">{D.fullName}</label>
                  <input className="sl-input" disabled value={agent?.name || ''} style={{ marginBottom: 12, opacity: 0.7, cursor: 'not-allowed' }} />

                  <label className="sl-label">{D.email}</label>
                  <input className="sl-input" type="email" value={profEmail} onChange={e => setProfEmail(e.target.value)} placeholder="you@example.com" style={{ marginBottom: 12 }} />

                  <label className="sl-label">{D.whatsapp}</label>
                  <input className="sl-input" disabled value={agent?.whatsapp || ''} style={{ marginBottom: 12, opacity: 0.7, cursor: 'not-allowed' }} />

                  <label className="sl-label">{D.profilePhoto}</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, border: '1px dashed #E4E4E7', background: '#FAFAFA', cursor: 'pointer', marginBottom: 12 }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProfPhotoFile(e.target.files[0])} />
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: profPhotoUrl ? `url(${profPhotoUrl}) center/cover` : '#E4E4E7', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {!profPhotoUrl && '📷'}
                    </div>
                    <div style={{ flex: 1, fontSize: 12, color: '#52525B', fontWeight: 700 }}>
                      {profPhotoFile ? profPhotoFile.name : (profPhotoUrl ? (locale === 'id' ? 'Foto sudah diunggah — klik untuk ganti' : 'Photo uploaded — click to change') : D.uploadPhoto)}
                    </div>
                  </label>
                </div>

                {/* Location card */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0A0A0A', marginBottom: 10 }}>📍 {D.location}</div>
                  <label className="sl-label">{D.country}</label>
                  <select className="sl-input" value={profCountry} onChange={e => setProfCountry(e.target.value)} style={{ marginBottom: 12, appearance: 'none' }}>
                    <option value="">{D.chooseCountry}</option>
                    {ISO_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>

                  <label className="sl-label">{D.city}</label>
                  <input className="sl-input" placeholder={locale === 'id' ? 'Jakarta, Surabaya, …' : 'Jakarta, Surabaya, …'} value={profCity} onChange={e => setProfCity(e.target.value)} style={{ marginBottom: 12 }} />

                  {profCountry === 'ID' && (
                    <>
                      <label className="sl-label">{D.npwp}</label>
                      <input className="sl-input" placeholder="00.000.000.0-000.000" value={profNpwp} onChange={e => setProfNpwp(e.target.value)} style={{ marginBottom: 12 }} />
                    </>
                  )}
                </div>
              </div>

              {/* Bank details */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0A0A0A', marginBottom: 10 }}>🏦 {D.bankInfo}</div>
                <form onSubmit={handleVerification}>
                  <div className="sl-profile-grid">
                    <div>
                      <label className="sl-label">{D.bankName}</label>
                      <input className="sl-input" placeholder="BCA, Mandiri, BNI, …" value={bankName} onChange={e => setBankName(e.target.value)} disabled={isVerified} style={{ marginBottom: 12 }} />

                      <label className="sl-label">{D.accountHolder}</label>
                      <input className="sl-input" placeholder={locale === 'id' ? 'Sesuai KTP' : 'Must match KTP / ID'} value={bankHolder} onChange={e => setBankHolder(e.target.value)} disabled={isVerified} style={{ marginBottom: 12 }} />
                    </div>
                    <div>
                      <label className="sl-label">{D.accountNumber}</label>
                      <input className="sl-input" placeholder="1234567890" value={bankAccount} onChange={e => setBankAccount(e.target.value)} disabled={isVerified} style={{ marginBottom: 12 }} />

                      <label className="sl-label">{D.ibanSwift}</label>
                      <input className="sl-input" placeholder={locale === 'id' ? 'Untuk pencairan internasional (opsional)' : 'For international payouts (optional)'} disabled={isVerified} style={{ marginBottom: 12 }} />
                    </div>
                  </div>

                  {/* KTP upload */}
                  <label className="sl-label" style={{ marginTop: 4 }}>{D.ktpId}</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, border: '2px dashed #E4E4E7', background: '#FAFAFA', cursor: isVerified ? 'not-allowed' : 'pointer', opacity: isVerified ? 0.5 : 1, marginBottom: 12 }}>
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} disabled={isVerified} onChange={e => setKtpFile(e.target.files[0])} />
                    <div style={{ fontSize: 24 }}>{agent?.ktp_url || ktpFile ? '✅' : '🪪'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: agent?.ktp_url || ktpFile ? '#15803D' : '#0A0A0A' }}>{ktpFile ? ktpFile.name : agent?.ktp_url ? (locale === 'id' ? 'KTP sudah diunggah' : 'ID uploaded') : (locale === 'id' ? 'Klik untuk unggah KTP / ID' : 'Click to upload KTP / ID')}</div>
                      <div style={{ fontSize: 11, color: '#71717A', marginTop: 2 }}>{locale === 'id' ? 'PDF atau gambar — disimpan terenkripsi' : 'PDF or image — stored encrypted'}</div>
                    </div>
                  </label>

                  {error && <div style={{ ...s.error, marginTop: 8 }}>{error}</div>}
                  {(verifySaved || profSaved) && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, marginTop: 8 }}>{D.saved}</div>}

                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <button type="button" onClick={handleProfileSave} className="sl-btn-primary" disabled={profSaving} style={{ flex: '1 1 200px' }}>
                      {profSaving ? '…' : D.saveProfile}
                    </button>
                    {!isVerified && (
                      <button type="submit" className="sl-btn-ghost" disabled={verifySaving} style={{ flex: '1 1 200px', background: '#0A0A0A', color: '#FACC15', borderColor: '#0A0A0A' }}>
                        {verifySaving ? '…' : D.submitVerify}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* ─── 9. RESOURCES / FAQ ─── */}
          <section id="dash-resources" style={{ scrollMarginTop: 80 }}>
            <div className="sl-card">
              <h2 className="sl-section-h">{D.resourcesTitle}</h2>
              <p className="sl-section-sub">{locale === 'id' ? 'Jawaban cepat untuk pertanyaan umum.' : 'Quick answers for common questions.'}</p>

              <div style={{ marginBottom: 16 }}>
                {D.faqs.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <a href={`https://wa.me/6281234567890?text=${encodeURIComponent(locale === 'id' ? 'Halo StreetLocal — saya agen ' + (agent?.agent_code || '') + ' butuh bantuan' : 'Hi StreetLocal — I am agent ' + (agent?.agent_code || '') + ' and need help')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#25D366', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 800, minHeight: 44 }}>
                  <span style={{ fontSize: 18 }}>💬</span> {D.waSupport}
                </a>
                <button onClick={() => setStep('terms')} className="sl-btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>📋</span> {D.viewTerms}
                </button>
                <button onClick={() => setDrawer(true)} className="sl-btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>🚀</span> {D.marketingTips} · {D.leaderboard} · {D.community}
                </button>
              </div>

              {/* Footer brand */}
              <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 18, borderTop: '1px solid #F4F4F5' }}>
                <div style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Powered by</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0A0A0A', marginTop: 2 }}>Streetlocal<span style={{ color: '#FACC15' }}>.live</span></div>
                <div style={{ fontSize: 10, color: '#A1A1AA', marginTop: 4 }}>{agent?.agent_code}</div>
              </div>
            </div>
          </section>

          {/* App Library — kept accessible from old flow (apps modal still works) */}
          <section style={{ scrollMarginTop: 80 }}>
            <div className="sl-card">
              <h2 className="sl-section-h">{D.appLibrary}</h2>
              <p className="sl-section-sub">{D.appLibraryDesc}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
                {filteredApps.map(app => (
                  <div key={app.id} onClick={() => setSelectedApp(app)} style={{ cursor: 'pointer' }}>
                    <div style={{ width: '100%', aspectRatio: '9/16', borderRadius: 18, background: '#0A0A0A', padding: 3, position: 'relative', boxShadow: `0 6px 18px ${app.color}20`, border: '1px solid #E4E4E7' }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: 15, overflow: 'hidden', background: '#000' }}>
                        {app.screenshot ? (
                          <img src={app.screenshot} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${app.color}20, ${app.color}05)` }}>
                            <span style={{ fontSize: 28, opacity: 0.4 }}>{app.icon}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0A0A0A' }}>{app.name}</div>
                      <div style={{ fontSize: 11, color: '#15803D', fontWeight: 800, marginTop: 2 }}>{app.commission}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ── BOTTOM TAB BAR (mobile only) ── */}
      <nav className="sl-dash-bottom-tabs">
        {mobileTabs.map(t => (
          <button key={t.id} onClick={() => navigateTo(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 4px',
            color: dashSection === t.id ? '#0A0A0A' : '#A1A1AA',
            fontFamily: 'inherit', minHeight: 44,
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3px' }}>{t.label}</span>
          </button>
        ))}
        <button onClick={() => setDrawer(true)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 4px',
          color: '#A1A1AA', fontFamily: 'inherit', minHeight: 44,
        }}>
          <span style={{ fontSize: 18 }}>⋯</span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3px' }}>{D.more}</span>
        </button>
      </nav>

      {/* ── DRAWER ── */}
      {drawer && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500 }} onClick={() => { setDrawer(false); setDrawerPage(null) }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '82vw', maxWidth: 340, background: '#fff', zIndex: 501, overflowY: 'auto', boxShadow: '4px 0 24px rgba(0,0,0,0.1)' }}>
            {/* Drawer header */}
            <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a' }}>{agent?.name}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{agent?.agent_code}</div>
              <div style={{ fontSize: 11, color: isActive ? '#22c55e' : '#F59E0B', fontWeight: 700, marginTop: 4 }}>
                {isActive ? (locale === 'id' ? 'Aktif' : 'Active') : (locale === 'id' ? 'Menunggu' : 'Pending')}
              </div>
            </div>

            {!drawerPage && (
              <div style={{ padding: '8px 0' }}>
                {[
                  { id: 'leads', icon: '🎯', label: locale === 'id' ? 'Leads untuk Dihubungi' : 'Leads to Contact' },
                  { id: 'leaderboard', icon: '🥇', label: locale === 'id' ? 'Papan Peringkat' : 'Leaderboard' },
                  { id: 'stats', icon: '📊', label: L.stats },
                  { id: 'earnings', icon: '💰', label: L.earnings },
                  { id: 'community', icon: '🏆', label: locale === 'id' ? 'Komunitas' : 'Community' },
                  { id: 'marketing', icon: '🚀', label: locale === 'id' ? 'Tips Marketing' : 'Marketing Tips' },
                  { id: 'verify', icon: isVerified ? '✅' : '🔐', label: L.verify },
                  { id: 'settings', icon: '⚙️', label: L.settings },
                ].map(item => (
                  <button key={item.id} onClick={() => setDrawerPage(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#1a1a1a', textAlign: 'left' }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span> {item.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #f0f0f0', margin: '8px 0' }} />
                <button onClick={() => { logout(); setDrawer(false) }} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#EF4444', textAlign: 'left' }}>
                  <span style={{ fontSize: 20 }}>🚪</span> {L.logout}
                </button>
              </div>
            )}

            {/* ── DRAWER: LEADS TO CONTACT ── */}
            {drawerPage === 'leads' && (
              <div style={{ padding: 20 }}>
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FACC15', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>{locale === 'id' ? 'Leads untuk Dihubungi' : 'Leads to Contact'}</h3>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 1.5 }}>
                  {locale === 'id'
                    ? 'Klik "Ambil 25 Leads" untuk dapat daftar bisnis dengan nomor WhatsApp. Klik tombol WA untuk kirim pesan template. Setiap signup = komisi.'
                    : 'Click "Grab 25 Leads" to get businesses with WhatsApp numbers. Click WA to send a template message. Every signup = your commission.'}
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    disabled={leadsLoading}
                    onClick={async () => {
                      if (!agent?.id || !supabase) return
                      setLeadsLoading(true); setLeadsMessage('')
                      try {
                        const { data, error } = await supabase.rpc('grab_leads', { p_agent_id: agent.id, p_count: 25 })
                        if (error) setLeadsMessage('⚠️ ' + error.message)
                        else setLeadsMessage(`✓ Ditambahkan ${(data || []).length} leads ke daftar kamu`)
                        const { data: mine } = await supabase.from('outreach_leads').select('id,business_name,business_type,city,phone,whatsapp,address,status,target_app').eq('agent_id', agent.id).order('status').order('created_at', { ascending: false }).limit(200)
                        setMyLeads(mine || [])
                      } catch (e) { setLeadsMessage('⚠️ ' + e.message) }
                      setLeadsLoading(false)
                    }}
                    style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', flex: 1 }}
                  >{leadsLoading ? '⏳ ...' : (locale === 'id' ? '🎯 Ambil 25 Leads' : '🎯 Grab 25 Leads')}</button>
                  <button
                    onClick={async () => {
                      if (!agent?.id || !supabase) return
                      setLeadsLoading(true)
                      const { data } = await supabase.from('outreach_leads').select('id,business_name,business_type,city,phone,whatsapp,address,status,target_app').eq('agent_id', agent.id).order('status').order('created_at', { ascending: false }).limit(200)
                      setMyLeads(data || []); setLeadsLoading(false)
                    }}
                    style={{ background: '#f0f0f0', color: '#1a1a1a', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                  >🔄</button>
                </div>
                {leadsMessage && <div style={{ padding: 10, background: leadsMessage.includes('⚠️') ? '#FFE4E1' : '#E8F5E9', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{leadsMessage}</div>}
                {myLeads.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{locale === 'id' ? 'Belum ada leads. Klik "Ambil 25 Leads"' : 'No leads yet. Click "Grab 25 Leads"'}</div>
                  </div>
                ) : (
                  myLeads.map((l) => {
                    const phone = (l.whatsapp || l.phone || '').replace(/[^0-9+]/g, '')
                    const wa = phone ? `https://wa.me/${phone.startsWith('+') ? phone.slice(1) : phone}?text=${encodeURIComponent(`Halo ${l.business_name.split(' ')[0]}! Saya dari StreetLocal — aplikasi pemesanan untuk bisnis kamu. Tanpa komisi seperti GoFood. Pelanggan order langsung ke WhatsApp. Hanya Rp 35.000/bulan. Mau lihat demonya?`)}` : null
                    const statusColors = { queued: '#888', contacted: '#3498db', responded: '#1abc9c', interested: '#22c55e', signed: '#22c55e', not_interested: '#888', dead: '#666' }
                    const sc = statusColors[l.status] || '#888'
                    return (
                      <div key={l.id} style={{ padding: 12, background: '#FAFAFA', borderRadius: 12, marginBottom: 8, borderLeft: `3px solid ${sc}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{l.business_name}</div>
                            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{l.business_type} · {l.city}</div>
                            {phone && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>📞 {l.whatsapp || l.phone}</div>}
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: sc, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{l.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" onClick={async () => { if (supabase) await supabase.rpc('agent_update_lead_status', { p_agent_id: agent.id, p_lead_id: l.id, p_status: 'contacted' }); setTimeout(async () => { const { data } = await supabase.from('outreach_leads').select('id,business_name,business_type,city,phone,whatsapp,address,status,target_app').eq('agent_id', agent.id).order('status').order('created_at', { ascending: false }).limit(200); setMyLeads(data || []) }, 500) }} style={{ background: '#25D366', color: '#fff', textDecoration: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>💬 WA</a>}
                          {['contacted','responded','interested','dead'].map(s => (
                            <button key={s} onClick={async () => {
                              if (!supabase) return
                              const { error } = await supabase.rpc('agent_update_lead_status', { p_agent_id: agent.id, p_lead_id: l.id, p_status: s })
                              if (error) { alert(error.message); return }
                              const { data } = await supabase.from('outreach_leads').select('id,business_name,business_type,city,phone,whatsapp,address,status,target_app').eq('agent_id', agent.id).order('status').order('created_at', { ascending: false }).limit(200)
                              setMyLeads(data || [])
                            }} style={{ background: s === 'dead' ? '#EF4444' : s === 'interested' ? '#22c55e' : '#888', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{s.replace('_',' ')}</button>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ── DRAWER: LEADERBOARD ── */}
            {drawerPage === 'leaderboard' && (
              <div style={{ padding: 20 }}>
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FACC15', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>{locale === 'id' ? '🥇 Top Agent' : '🥇 Top Agents'}</h3>
                <button onClick={async () => { if (!supabase) return; const { data } = await supabase.rpc('agent_leaderboard'); setAgentBoard(data || []) }} style={{ background: '#FACC15', color: '#1a1a1a', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', marginBottom: 12 }}>🔄 {locale === 'id' ? 'Refresh' : 'Refresh'}</button>
                {agentBoard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 12 }}>{locale === 'id' ? 'Klik Refresh' : 'Click Refresh'}</div>
                ) : (
                  agentBoard.map((row, i) => (
                    <div key={row.agent_id} style={{ padding: 12, background: i === 0 ? 'linear-gradient(135deg, #FACC1520, #FACC1505)' : '#FAFAFA', borderRadius: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 16, background: i === 0 ? '#FACC15' : i < 3 ? '#FFE4A0' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{row.agent_name}{row.agent_id === agent?.id ? ' (you)' : ''}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>{row.signed} signed · {row.contacted} contacted · {row.leads_assigned} total</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── DRAWER: STATS ── */}
            {drawerPage === 'stats' && (
              <div style={{ padding: 20 }}>
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FACC15', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>

                {/* ── Headline metrics: views, signups, click-through rate ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  <div style={{ background: '#EFF6FF', borderRadius: 14, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{locale === 'id' ? 'Dilihat' : 'Views'}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#0A0A0A', marginTop: 4 }}>{stats.totalClicks}</div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{locale === 'id' ? 'Klik link Anda' : 'Link clicks'}</div>
                  </div>
                  <div style={{ background: '#FAF5FF', borderRadius: 14, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6d28d9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{locale === 'id' ? 'Daftar' : 'Signups'}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#EAB308', marginTop: 4 }}>{stats.totalSignups}</div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{locale === 'id' ? 'Vendor daftar' : 'Vendors joined'}</div>
                  </div>
                  <div style={{ background: '#F0FDF4', borderRadius: 14, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{locale === 'id' ? 'Konversi' : 'CTR'}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', marginTop: 4 }}>
                      {stats.totalClicks > 0 ? ((stats.totalSignups / stats.totalClicks) * 100).toFixed(1) + '%' : '—'}
                    </div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{locale === 'id' ? 'Klik ke daftar' : 'Click → signup'}</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#888', marginBottom: 14, lineHeight: 1.5, padding: '8px 12px', background: '#FAFAFA', borderRadius: 10 }}>
                  {locale === 'id'
                    ? 'Klik dihitung setiap kali link Anda dikunjungi (?ref=' + (agent?.agent_code || 'kode_anda') + '). Konversi = persentase klik yang berakhir menjadi vendor terdaftar.'
                    : 'A click is counted each time your link is visited (?ref=' + (agent?.agent_code || 'your_code') + '). CTR = the percent of clicks that became signed-up vendors.'}
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>{L.referrals}</h3>
                {referrals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{L.noReferrals}</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>{L.shareToEarn}</div>
                  </div>
                ) : (
                  referrals.map((ref, i) => (
                    <div key={i} style={{ padding: 12, background: '#FAFAFA', borderRadius: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{ref.customer_name || 'User'}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{ref.app_type} — {new Date(ref.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>Rp {(ref.commission_amount || 0).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── DRAWER: EARNINGS ── */}
            {drawerPage === 'earnings' && (
              <div style={{ padding: 20 }}>
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FACC15', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>{L.earnings}</h3>
                <div style={{ background: '#F0FDF4', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#065F46' }}>{L.totalEarned}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#22c55e' }}>Rp {stats.totalEarnings.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>{L.pending}: <strong style={{ color: '#F59E0B' }}>Rp {stats.pendingPayout.toLocaleString()}</strong></div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{L.nextPayout}</div>
                </div>
                <div style={{ background: '#FAFAFA', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>🎯</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{L.commission100}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{L.commissionDesc}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── DRAWER: VERIFY ── */}
            {drawerPage === 'verify' && (
              <div style={{ padding: 20 }}>
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FACC15', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>{L.verify}</h3>
                <div style={{ padding: 12, borderRadius: 12, background: isVerified ? '#D1FAE5' : '#FEF3C7', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isVerified ? '#065F46' : '#92400E' }}>
                    {isVerified ? L.verified : agent?.verification_status === 'submitted' ? L.underReview : L.notVerified}
                  </div>
                </div>
                <form onSubmit={handleVerification}>
                  <label style={s.label}>{L.bankName}</label>
                  <input style={s.input} placeholder="BCA, Mandiri, BNI..." value={bankName} onChange={e => setBankName(e.target.value)} disabled={isVerified} />
                  <label style={s.label}>{L.accountNumber}</label>
                  <input style={s.input} placeholder="1234567890" value={bankAccount} onChange={e => setBankAccount(e.target.value)} disabled={isVerified} />
                  <label style={s.label}>{L.accountHolder}</label>
                  <input style={s.input} placeholder={locale === 'id' ? 'Sesuai KTP' : 'Must match KTP'} value={bankHolder} onChange={e => setBankHolder(e.target.value)} disabled={isVerified} />
                  <label style={s.label}>{L.ktpPhoto}</label>
                  <label style={{ ...s.uploadArea, opacity: isVerified ? 0.5 : 1, pointerEvents: isVerified ? 'none' : 'auto' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setKtpFile(e.target.files[0])} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24 }}>{agent?.ktp_url || ktpFile ? '✅' : '🪪'}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: agent?.ktp_url || ktpFile ? '#22c55e' : '#666', marginTop: 4 }}>{ktpFile ? ktpFile.name : agent?.ktp_url ? 'KTP uploaded' : (locale === 'id' ? 'Upload foto KTP' : 'Upload KTP photo')}</div>
                    </div>
                  </label>
                  {error && <div style={{ ...s.error, marginTop: 8 }}>{error}</div>}
                  {verifySaved && <div style={{ ...s.error, color: '#22c55e', background: '#D1FAE5' }}>{locale === 'id' ? 'Berhasil disimpan!' : 'Saved!'}</div>}
                  {!isVerified && (
                    <button type="submit" style={{ ...s.primaryBtn, marginTop: 8 }} disabled={verifySaving}>
                      {verifySaving ? '...' : L.submitVerify}
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* ── DRAWER: COMMUNITY ── */}
            {drawerPage === 'community' && (
              <CommunityFeed locale={locale} leaderboard={leaderboard} onBack={() => setDrawerPage(null)} />
            )}

            {/* ── DRAWER: MARKETING TIPS ── */}
            {drawerPage === 'marketing' && (
              <div style={{ padding: 20 }}>
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FACC15', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{locale === 'id' ? 'Tips Marketing Gratis' : 'Free Marketing Tips'}</h3>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8, lineHeight: 1.5 }}>{locale === 'id' ? 'Panduan lengkap untuk mendapatkan traffic gratis dan meningkatkan pendapatan Anda' : 'Complete guide to get free traffic and boost your earnings'}</p>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', lineHeight: 1.5 }}>
                    {locale === 'id'
                      ? '⚠️ PENTING: Hanya gunakan banner & video resmi dari Share Kit. Anda TIDAK boleh membuat banner/video sendiri. Tambahkan teks/caption Anda sendiri saat memposting.'
                      : '⚠️ IMPORTANT: Only use official banners & videos from the Share Kit. You must NOT create your own banners/videos. Add your own text/caption when posting.'}
                  </div>
                </div>

                {/* ─ TOP PLATFORMS ─ */}
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  {locale === 'id' ? '📱 Platform Gratis di Indonesia' : '📱 Free Platforms in Indonesia'}
                </div>

                {[
                  { cat: locale === 'id' ? 'Media Sosial' : 'Social Media', items: [
                    { name: 'TikTok', url: 'https://www.tiktok.com/', desc: locale === 'id' ? 'Jangkauan organik tertinggi. Konten makanan sangat viral. Video 15-30 detik.' : 'Highest organic reach. Food content goes viral. 15-30 sec videos.', type: 'Video' },
                    { name: 'Instagram Reels', url: 'https://www.instagram.com/', desc: locale === 'id' ? '109 juta pengguna di Indonesia. Reels + link sticker di Stories.' : '109M users in Indonesia. Reels + link stickers in Stories.', type: 'Video/Image' },
                    { name: 'Facebook Groups', url: 'https://www.facebook.com/groups/', desc: locale === 'id' ? '119 juta pengguna. Grup Bisnis Kuliner sangat aktif.' : '119M users. Food Business groups very active.', type: 'Post/Image' },
                    { name: 'YouTube Shorts', url: 'https://www.youtube.com/', desc: locale === 'id' ? '151 juta pengguna. Konten evergreen + Shorts viral.' : '151M users. Evergreen content + viral Shorts.', type: 'Video' },
                    { name: 'WhatsApp Status', url: 'https://www.whatsapp.com/', desc: locale === 'id' ? '9 dari 10 orang Indonesia aktif. Status = billboard gratis.' : '9 in 10 Indonesians active. Status = free billboard.', type: 'Image/Video' },
                    { name: 'Telegram', url: 'https://telegram.org/', desc: locale === 'id' ? 'Channel bisa broadcast ke subscriber unlimited. Tidak ada algoritma.' : 'Channels broadcast to unlimited subscribers. No algorithm suppression.', type: 'Text/Image' },
                    { name: 'X (Twitter)', url: 'https://x.com/', desc: locale === 'id' ? 'Thread viral + post banner resmi. Audience tech-savvy urban Indonesia.' : 'Viral threads + post official banners. Tech-savvy urban Indonesian audience.', type: 'Text/Image' },
                    { name: 'Snapchat', url: 'https://www.snapchat.com/', desc: locale === 'id' ? 'Spotlight untuk video pendek. Audience muda perkotaan Indonesia.' : 'Spotlight for short videos. Young urban Indonesian audience.', type: 'Video/Image' },
                    { name: 'Snack Video', url: 'https://www.snackvideo.com/', desc: locale === 'id' ? 'Video pendek populer di kota tier 2/3 Indonesia. Kurang kompetisi.' : 'Short video popular in tier 2/3 Indonesian cities. Less competition.', type: 'Video' },
                  ]},
                  { cat: locale === 'id' ? 'Marketplace & Iklan Baris' : 'Marketplaces & Classifieds', items: [
                    { name: 'Shopee', url: 'https://shopee.co.id/', desc: locale === 'id' ? 'Buka toko gratis. Listing jasa digital. Shopee Feed & LIVE.' : 'Free store setup. List digital services. Shopee Feed & LIVE.', type: 'Listing' },
                    { name: 'Tokopedia', url: 'https://www.tokopedia.com/', desc: locale === 'id' ? 'Toko gratis. Terintegrasi TikTok Shop. Jutaan pembeli.' : 'Free store. Integrated with TikTok Shop. Millions of buyers.', type: 'Listing' },
                    { name: 'TikTok Shop', url: 'https://seller.tiktok.com/', desc: locale === 'id' ? 'LIVE selling dominan di Indonesia. Komisi 10-20%.' : 'LIVE selling dominates in Indonesia. 10-20% commission.', type: 'Video/LIVE' },
                    { name: 'OLX Indonesia', url: 'https://www.olx.co.id/', desc: locale === 'id' ? 'Iklan baris #1 Indonesia. Pasang iklan jasa gratis.' : '#1 classifieds in Indonesia. Post free service ads.', type: 'Listing' },
                    { name: 'Facebook Marketplace', url: 'https://www.facebook.com/marketplace/', desc: locale === 'id' ? 'Listing jasa gratis. Jangkauan lokal. Renew setiap 7 hari.' : 'Free service listing. Local reach. Renew every 7 days.', type: 'Listing' },
                  ]},
                  { cat: locale === 'id' ? 'Blog & Artikel' : 'Blogs & Articles', items: [
                    { name: 'Kompasiana', url: 'https://www.kompasiana.com/', desc: locale === 'id' ? 'Platform blog terbesar Indonesia. SEO bagus. Gratis.' : 'Largest Indonesian blog platform. Good SEO. Free.', type: 'Article' },
                    { name: 'Medium', url: 'https://medium.com/', desc: locale === 'id' ? 'Domain authority tinggi. Artikel bahasa Indonesia/Inggris.' : 'High domain authority. Write in Bahasa/English.', type: 'Article' },
                    { name: 'Blogger', url: 'https://www.blogger.com/', desc: locale === 'id' ? 'Blog gratis dari Google. SEO natural. Bisa custom domain.' : 'Free blog from Google. Natural SEO. Custom domain possible.', type: 'Article' },
                    { name: 'Kaskus', url: 'https://www.kaskus.co.id/', desc: locale === 'id' ? 'Forum terbesar Indonesia. FJB untuk listing gratis.' : 'Largest Indonesian forum. FJB for free listings.', type: 'Thread/Listing' },
                  ]},
                  { cat: locale === 'id' ? 'Direktori & Alat Gratis' : 'Directories & Free Tools', items: [
                    { name: 'Google Business', url: 'https://business.google.com/', desc: locale === 'id' ? 'Muncul di Google Maps & pencarian lokal. Posts gratis.' : 'Appear in Google Maps & local search. Free posts.', type: 'Profile' },
                    { name: 'Linktree', url: 'https://linktr.ee/', desc: locale === 'id' ? 'Link-in-bio gratis. Kumpulkan semua link di satu tempat.' : 'Free link-in-bio. Collect all links in one place.', type: 'Link page' },
                    { name: 'Carousell', url: 'https://www.carousell.co.id/', desc: locale === 'id' ? 'Iklan baris gratis. Listing jasa dengan banner resmi.' : 'Free classifieds. List services with official banners.', type: 'Listing' },
                    { name: 'QR Code Generator', url: 'https://www.qr-code-generator.com/', desc: locale === 'id' ? 'Buat QR code dari link referral Anda untuk dibagikan offline.' : 'Generate QR code from your referral link to share offline.', type: 'QR Code' },
                  ]},
                  { cat: locale === 'id' ? 'Email Outreach (1-ke-1)' : 'Email Outreach (1-to-1)', items: [
                    { name: 'Google Maps', url: 'https://maps.google.com/', desc: locale === 'id' ? 'Cari restoran/warung di area Anda. Email bisnis sering tercantum di profil.' : 'Search restaurants in your area. Business emails often listed on profiles.', type: 'Email source' },
                    { name: 'Instagram DM', url: 'https://www.instagram.com/', desc: locale === 'id' ? 'Cari akun bisnis kuliner lokal, kirim DM personal dengan banner + link.' : 'Find local food business accounts, send personal DM with banner + link.', type: 'Direct msg' },
                    { name: 'GrabFood/GoFood Listings', url: 'https://food.grab.com/', desc: locale === 'id' ? 'Catat nama warung dari listing, cari kontak mereka online.' : 'Note restaurant names from listings, find their contacts online.', type: 'Lead source' },
                    { name: 'Gmail', url: 'https://mail.google.com/', desc: locale === 'id' ? 'Kirim email personal ke pemilik bisnis. BUKAN bulk/spam — 1 email per bisnis.' : 'Send personal emails to business owners. NOT bulk/spam — 1 email per business.', type: 'Outreach' },
                  ]},
                ].map((section, si) => (
                  <div key={si} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#555', marginBottom: 8 }}>{section.cat}</div>
                    {section.items.map((item, ii) => (
                      <a key={ii} href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #f5f5f5', textDecoration: 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#FACC15', background: '#FFF7ED', padding: '3px 6px', borderRadius: 4, flexShrink: 0 }}>{item.type}</span>
                      </a>
                    ))}
                  </div>
                ))}

                {/* ─ MARKETING STRATEGIES ─ */}
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10, marginTop: 20, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  {locale === 'id' ? '🎯 Strategi Marketing' : '🎯 Marketing Strategies'}
                </div>

                {[
                  { title: 'TikTok', icon: '🎵', tips: locale === 'id' ? [
                    'Upload video resmi dari Share Kit + tambahkan caption Anda',
                    'Posting jam 11.00-13.00 atau 19.00-21.00 WIB',
                    'Hashtag: #BisnisKuliner #UMKM #WarungDigital #FYPIndonesia',
                    'Bilang "Link di bio!" di setiap video',
                    'Pasang link referral di bio profil TikTok',
                    'Repost video resmi dengan suara trending Indonesia',
                  ] : [
                    'Upload official videos from Share Kit + add your own caption',
                    'Post at 11am-1pm or 7pm-9pm WIB',
                    'Hashtags: #BisnisKuliner #UMKM #WarungDigital #FYPIndonesia',
                    'Say "Link in bio!" in every video',
                    'Put your referral link in TikTok profile bio',
                    'Repost official videos with trending Indonesia sounds',
                  ]},
                  { title: 'WhatsApp', icon: '💬', tips: locale === 'id' ? [
                    'Post Status 3-5x sehari (pagi, siang, sore, malam)',
                    'Rotasi: testimonial, tips, demo app, promo, personal',
                    'Pakai WhatsApp Business: Katalog + Quick Reply + Label',
                    'Broadcast ke 256 kontak sekaligus (diterima sebagai DM)',
                    'Di grup: 80% tips bermanfaat, 20% promosi',
                    'Jangan drop link tanpa konteks — ceritakan kisah sukses dulu',
                  ] : [
                    'Post Status 3-5x per day (morning, lunch, afternoon, evening)',
                    'Rotate: testimonial, tips, app demo, promo, personal',
                    'Use WhatsApp Business: Catalog + Quick Reply + Labels',
                    'Broadcast to 256 contacts at once (received as DM)',
                    'In groups: 80% helpful tips, 20% promotion',
                    'Never drop links without context — tell success stories first',
                  ]},
                  { title: 'Facebook Groups', icon: '👥', tips: locale === 'id' ? [
                    'Cari & gabung: "UMKM Kuliner", "Bisnis Kuliner [Kota]"',
                    'Aktif 1-2 minggu dulu sebelum promosi (komentar, bantu)',
                    'Soft-selling: "Sharing pengalaman ya..." bukan "Daftar di sini!"',
                    'Post jam 07-09, 12-13, atau setelah 20.00 WIB',
                    'Jangan post konten sama di banyak grup sehari — ditandai spam',
                    'Facebook Marketplace: listing jasa gratis, renew tiap 7 hari',
                  ] : [
                    'Search & join: "UMKM Kuliner", "Bisnis Kuliner [City]"',
                    'Be active 1-2 weeks before promoting (comment, help)',
                    'Soft-sell: "Sharing experience..." not "Sign up here!"',
                    'Post at 7-9am, 12-1pm, or after 8pm WIB',
                    'Don\'t post same content in many groups same day — flagged as spam',
                    'FB Marketplace: free service listing, renew every 7 days',
                  ]},
                  { title: 'Instagram', icon: '📸', tips: locale === 'id' ? [
                    'Post banner resmi dari Share Kit sebagai Reels atau Feed post',
                    'Stories + Link Sticker: tulis "DAFTAR GRATIS" + tempel banner resmi',
                    'Max 5 hashtag: #BisnisKuliner #AplikasiRestoran #UMKM + lokasi',
                    'Tambahkan caption sendiri yang menarik di setiap postingan',
                    'Posting saat jam makan atau sore (konten makanan performa terbaik)',
                    'Link-in-bio wajib: pakai Linktree untuk kumpulkan semua link referral',
                  ] : [
                    'Post official banners from Share Kit as Reels or Feed posts',
                    'Stories + Link Sticker: write "SIGN UP FREE" + attach official banner',
                    'Max 5 hashtags: #BisnisKuliner #AplikasiRestoran #UMKM + location',
                    'Add your own engaging caption to every post',
                    'Post during meal times or evening (food content peaks)',
                    'Link-in-bio is essential: use Linktree to collect all referral links',
                  ]},
                  { title: locale === 'id' ? 'Offline → Online' : 'Offline → Online', icon: '🤝', tips: locale === 'id' ? [
                    'Buat QR code gratis (qr-code-generator.com) → cetak flyer',
                    'Kunjungi warung langsung: beli dulu, ngobrol, demo 2 menit',
                    'Flyer: "Warung Mau Makin Rame? SCAN untuk info GRATIS"',
                    'Target: warteg rame, nasi goreng antri, kopi kekinian, katering',
                    'Hadiri bazaar kuliner & pasar malam — network dengan vendor',
                    'Follow up via WA dalam 2-3 hari setelah bertemu',
                  ] : [
                    'Create free QR code (qr-code-generator.com) → print flyers',
                    'Visit stalls directly: buy first, chat, demo 2 minutes',
                    'Flyer: "Want More Customers? SCAN for FREE info"',
                    'Target: busy warteg, queued nasi goreng, coffee shops, catering',
                    'Attend food bazaars & night markets — network with vendors',
                    'Follow up via WA within 2-3 days after meeting',
                  ]},
                  { title: locale === 'id' ? 'Email & DM Outreach' : 'Email & DM Outreach', icon: '📧', tips: locale === 'id' ? [
                    'Cari email bisnis restoran/warung di Google Maps atau website mereka',
                    'Kirim email personal (BUKAN massal) — 1 email per bisnis',
                    'Template: "Halo Pak/Bu [nama], saya lihat [warung] di Google Maps..."',
                    'Lampirkan banner resmi + link referral Anda di email',
                    'DM Instagram ke akun bisnis kuliner lokal — personal & sopan',
                    'Follow up 1x setelah 3 hari jika belum dibalas, jangan spam',
                  ] : [
                    'Find restaurant emails on Google Maps or their websites',
                    'Send personal emails (NOT bulk) — 1 email per business',
                    'Template: "Hi [name], I saw [restaurant] on Google Maps..."',
                    'Attach official banner + your referral link in the email',
                    'DM Instagram local food business accounts — personal & polite',
                    'Follow up once after 3 days if no reply, don\'t spam',
                  ]},
                  { title: 'SEO & Blog', icon: '✍️', tips: locale === 'id' ? [
                    'Tulis artikel di Kompasiana/Blogger + sertakan banner resmi',
                    'Keyword populer: "cara terima order online warung", "menu digital"',
                    'Artikel min 800 kata, keyword di judul + paragraf pertama',
                    'Posting 2-3 artikel per minggu, share ke semua sosmed',
                    'Sisipkan banner resmi + link referral sebagai "rekomendasi"',
                    'Tulis caption sendiri yang relevan, jangan copy-paste dari orang lain',
                  ] : [
                    'Write articles on Kompasiana/Blogger + include official banners',
                    'Popular keywords: "cara terima order online warung", "menu digital"',
                    'Articles min 800 words, keyword in title + first paragraph',
                    'Post 2-3 articles per week, share to all social media',
                    'Embed official banners + referral link as "recommendation"',
                    'Write your own relevant captions, don\'t copy from others',
                  ]},
                ].map((strat, i) => (
                  <div key={i} style={{ marginBottom: 16, background: '#FAFAFA', borderRadius: 14, padding: 14, border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{strat.icon} {strat.title}</div>
                    {strat.tips.map((tip, ti) => (
                      <div key={ti} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, color: '#FACC15', marginTop: 3 }}>●</span>
                        <span style={{ fontSize: 12, color: '#444', lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Daily Action Plan */}
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10, marginTop: 20, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  {locale === 'id' ? '📅 Jadwal Harian Agent' : '📅 Daily Agent Schedule'}
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: 14, padding: 14 }}>
                  {[
                    { time: '08.00', action: locale === 'id' ? 'Post WA Status (tips hari ini)' : 'Post WA Status (tip of the day)' },
                    { time: '09.00', action: locale === 'id' ? 'Upload TikTok/Reels' : 'Upload TikTok/Reels' },
                    { time: '10.00', action: locale === 'id' ? 'Engage di 3-5 Facebook Groups' : 'Engage in 3-5 Facebook Groups' },
                    { time: '12.00', action: locale === 'id' ? 'Post WA Status (konten siang)' : 'Post WA Status (lunch content)' },
                    { time: '13.00', action: locale === 'id' ? 'Balas semua DM & inquiry' : 'Reply all DMs & inquiries' },
                    { time: '15.00', action: locale === 'id' ? 'Tulis 1 artikel atau buat 1 konten' : 'Write 1 article or create 1 content' },
                    { time: '18.00', action: locale === 'id' ? 'Post WA Status (promo sore)' : 'Post WA Status (evening promo)' },
                    { time: '19.00', action: locale === 'id' ? 'Upload TikTok/Reels (jam emas)' : 'Upload TikTok/Reels (golden hour)' },
                    { time: '20.00', action: locale === 'id' ? 'Post di Facebook Groups' : 'Post in Facebook Groups' },
                    { time: '21.00', action: locale === 'id' ? 'Follow up leads di WhatsApp' : 'Follow up warm leads on WhatsApp' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: i < 9 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#FACC15', width: 40, flexShrink: 0 }}>{row.time}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{row.action}</span>
                    </div>
                  ))}
                </div>

                {/* Key Principles */}
                <div style={{ marginTop: 20, background: '#FFF7ED', borderRadius: 14, padding: 14, border: '1px solid #FDBA74' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{locale === 'id' ? '💡 Prinsip Utama' : '💡 Key Principles'}</div>
                  {(locale === 'id' ? [
                    'Konsisten lebih penting dari sempurna',
                    'Jual solusi, bukan produk — bicara masalah mereka',
                    'Bangun kepercayaan dulu sebelum jualan',
                    'Pakai bahasa sederhana, bukan jargon teknis',
                    'Tunjukkan bukti nyata (testimonial > klaim)',
                    '80% penjualan terjadi setelah follow-up ke-5',
                  ] : [
                    'Consistency beats perfection',
                    'Sell solutions, not products — talk about their problems',
                    'Build trust before selling',
                    'Use simple language, not tech jargon',
                    'Show real proof (testimonials > claims)',
                    '80% of sales happen after the 5th follow-up',
                  ]).map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 10, color: '#FACC15', marginTop: 3 }}>★</span>
                      <span style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DRAWER: SETTINGS ── */}
            {drawerPage === 'settings' && (
              <div style={{ padding: 20 }}>
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FACC15', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>{L.settings}</h3>

                {/* Language toggle */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>{L.language}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setLocale('id')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: locale === 'id' ? '2px solid #FACC15' : '1px solid #e0e0e0', background: locale === 'id' ? '#FFF7ED' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#1a1a1a' }}>
                      🇮🇩 Bahasa
                    </button>
                    <button onClick={() => setLocale('en')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: locale === 'en' ? '2px solid #FACC15' : '1px solid #e0e0e0', background: locale === 'en' ? '#FFF7ED' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#1a1a1a' }}>
                      🇬🇧 English
                    </button>
                  </div>
                </div>

                {/* Agent info */}
                <div style={{ background: '#FAFAFA', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{locale === 'id' ? 'Kode Agen' : 'Agent Code'}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a', marginBottom: 12 }}>{agent?.agent_code}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>WhatsApp</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{agent?.whatsapp}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{locale === 'id' ? 'Negara' : 'Country'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{COUNTRIES.find(c => c.code === agent?.country)?.name || agent?.country}</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Styles ─── */
const s = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(250,204,21,0.18) 0%, transparent 60%), #FFFFFF',
    color: '#0A0A0A',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    width: '100%',
    minWidth: 0,
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px clamp(16px, 4vw, 32px)',
    borderBottom: '1px solid #E4E4E7',
    position: 'sticky',
    top: 0,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    zIndex: 10,
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1a1a1a',
  },
  content: {
    padding: '16px clamp(16px, 4vw, 48px) 30px',
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  hero: {
    textAlign: 'center',
    padding: '60px 0 40px',
    maxWidth: 760,
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 900,
    color: '#0A0A0A',
    marginBottom: 10,
    letterSpacing: '-0.8px',
    lineHeight: 1.08,
  },
  heroSub: {
    fontSize: 15,
    color: '#52525B',
    lineHeight: 1.55,
    maxWidth: 320,
    margin: '0 auto',
    fontWeight: 500,
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20,
  },
  benefitCard: {
    background: '#FAFAFA',
    borderRadius: 14,
    padding: 14,
    textAlign: 'center',
    border: '1px solid #f0f0f0',
  },
  feeNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#FFF7ED',
    border: '1px solid #FDBA74',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  form: {
    background: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#555',
    marginBottom: 6,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #e0e0e0',
    background: '#fff',
    color: '#1a1a1a',
    fontSize: 15,
    outline: 'none',
    marginBottom: 12,
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #e0e0e0',
    background: '#fff',
    color: '#1a1a1a',
    fontSize: 15,
    outline: 'none',
    marginBottom: 12,
    boxSizing: 'border-box',
    appearance: 'none',
  },
  prefix: {
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #e0e0e0',
    background: '#f5f5f5',
    fontSize: 14,
    fontWeight: 700,
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    minWidth: 56,
    justifyContent: 'center',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 4,
    boxShadow: '0 6px 22px rgba(250,204,21,0.45)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  linkBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    background: 'none',
    border: 'none',
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 12,
    marginBottom: 16,
    textDecoration: 'underline',
    textDecorationColor: '#FACC15',
    textDecorationThickness: '2px',
    textUnderlineOffset: '4px',
  },
  error: {
    fontSize: 13,
    color: '#EF4444',
    background: '#FEF2F2',
    borderRadius: 10,
    padding: '10px 14px',
    marginTop: 8,
    fontWeight: 600,
  },
  tcBox: {
    background: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    border: '1px solid #f0f0f0',
    marginTop: 12,
  },
  tcList: {
    paddingLeft: 18,
    margin: 0,
    fontSize: 12,
    color: '#666',
    lineHeight: 1.8,
  },
  paymentCard: {
    background: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    border: '1px solid #e0e0e0',
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  uploadArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #ddd',
    borderRadius: 14,
    padding: 24,
    cursor: 'pointer',
    marginBottom: 12,
    background: '#FAFAFA',
  },
  statusBanner: {
    textAlign: 'center',
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 700,
  },
  linkCard: {
    margin: '16px 20px 0',
    padding: 16,
    background: '#FAFAFA',
    borderRadius: 14,
    border: '1px solid #f0f0f0',
  },
  linkDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    padding: '8px 12px',
  },
  copyBtn: {
    background: '#FACC15',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    flexShrink: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    padding: '16px 20px 0',
  },
  statCard: {
    background: '#FAFAFA',
    borderRadius: 14,
    padding: 14,
    textAlign: 'center',
    border: '1px solid #f0f0f0',
  },
  tabs: {
    display: 'flex',
    gap: 0,
    margin: '16px 20px 0',
    background: '#F5F5F5',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '10px 4px',
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: '#888',
    cursor: 'pointer',
  },
  tabActive: {
    background: '#fff',
    color: '#1a1a1a',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  appCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    background: '#FAFAFA',
    borderRadius: 16,
    border: '1px solid #f0f0f0',
    marginBottom: 10,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    background: '#FACC15',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 900,
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  refCard: {
    padding: 14,
    background: '#FAFAFA',
    borderRadius: 14,
    border: '1px solid #f0f0f0',
    marginBottom: 8,
  },
  earningsCard: {
    background: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    border: '1px solid #f0f0f0',
  },
  commCard: {
    background: '#FAFAFA',
    borderRadius: 14,
    padding: 16,
    border: '1px solid #f0f0f0',
    marginBottom: 10,
  },
  verifyStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  catPill: {
    padding: '8px 16px',
    borderRadius: 20,
    border: '1px solid #e0e0e0',
    background: '#fff',
    color: '#888',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  catPillActive: {
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #1a1a1a',
  },
}
