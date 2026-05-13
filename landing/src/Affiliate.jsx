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

const APPS = [
  // Both tiers now run on the same food-basic app (/food/chat/). The plan
  // query param pre-selects the tier on the post-signup activation gate
  // so the agent referral flow lands the vendor on the right plan.
  { id: 'basic', name: 'FoodLocal', tier: 'Software 1', price: 'Rp 35.000', commission: 'Rp 35.000', color: '#FF6B35', icon: '🍜', desc: 'From street carts to restaurants — WhatsApp order channel', url: '/food/chat/?plan=whatsapp' },
  { id: 'chat', name: 'FoodLocal Chat', tier: 'Software 1+', price: 'Rp 50.000', commission: 'Rp 50.000', color: '#22C55E', icon: '💬', desc: 'Same storefront with private in-app chat checkout + 16 payment gateways', url: '/food/chat/?plan=chat' },
  { id: 'pro', name: 'FoodLocal Pro', tier: 'Software 2', price: 'From Rp 100.000', commission: 'Rp 100.000', color: '#FFD600', icon: '🍽️', desc: 'Full restaurant suite: menu extras, deals, banner ads, analytics, KTP-verified. WhatsApp orders 100k/mo or in-app Chat orders 150k/mo.', url: '/food/pro/' },
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
  const COLORS = { join: '#3B82F6', sale: '#22c55e', earn: '#FFD600', click: '#8B5CF6', share: '#FF6B35' }

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
      <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B35', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
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
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFD600', marginBottom: 10 }}>{locale === 'id' ? '🏆 Top Agents Bulan Ini' : '🏆 Top Agents This Month'}</div>
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
        <span style={{ fontSize: 18, color: '#FF6B35', fontWeight: 700, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>+</span>
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
                    <button onClick={copyLink} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#FFD600', color: '#1a1a1a', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
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
      <div style={s.page}>
        <div style={{ ...s.topBar, borderBottom: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Agent Programme</div>
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
          {/* Hero */}
          <div style={s.hero}>
            <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledfffddfsdfsd-removebg-preview.png" alt="Become an Agent" style={{ width: 180, height: 'auto', marginBottom: 12 }} />
            <h1 style={s.heroTitle}>Become an Agent</h1>
            <p style={s.heroSub}>Earn 100% commission on every first-month subscription you refer</p>
          </div>

          {/* Limited Seats Banner */}
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Limited Seats — Act Now</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#FFD600' }}>{seatsRemaining.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 2 }}>seats remaining out of {maxSeats.toLocaleString()}</div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ width: `${(seatsTaken / maxSeats) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFD600)', borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Once all seats are filled, no new agents can join unless a cancellation opens up</div>
          </div>

          {/* Benefits */}
          <div style={s.benefitsGrid}>
            {[
              { icon: '💰', title: '100% First Month', desc: 'Keep the full subscription fee for every user you bring in' },
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

          {/* What apps you can sell */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', marginBottom: 4 }}>What apps you can sell</h2>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Three categories. Vendor picks WhatsApp, Chat, or Email at signup — you earn commission on any of them.</p>
            {[
              {
                icon: '🍜',
                color: '#FF6B35',
                title: 'Food',
                desc: 'Street carts, warungs, cafés, restaurants',
                variants: [
                  { tag: 'WhatsApp', desc: 'Orders go to vendor\'s WhatsApp' },
                  { tag: 'Chat', desc: 'Orders go to in-app chat' },
                ],
              },
              {
                icon: '🛍️',
                color: '#8B5CF6',
                title: 'Products',
                desc: 'Retail, fashion, electronics, anything physical',
                variants: [
                  { tag: 'WhatsApp', desc: 'Orders go to vendor\'s WhatsApp' },
                  { tag: 'Chat', desc: 'Orders go to in-app chat' },
                  { tag: 'Email', desc: 'Orders sent to vendor\'s email' },
                ],
              },
              {
                icon: '🛠️',
                color: '#22C55E',
                title: 'Services',
                desc: 'AC, plumber, electrician, painter, hairdresser, tutor, mechanic — 40+ trades',
                badge: 'NEW 2026',
                variants: [
                  { tag: 'WhatsApp', desc: 'Bookings go to vendor\'s WhatsApp' },
                  { tag: 'Chat', desc: 'Bookings go to in-app chat' },
                  { tag: 'Email', desc: 'Bookings sent to vendor\'s email' },
                ],
              },
            ].map((cat, i) => (
              <div key={i} style={{ background: '#FAFAFA', borderRadius: 14, padding: 14, border: '1px solid #f0f0f0', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{cat.title}</div>
                      {cat.badge && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#22C55E', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>{cat.badge}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.4 }}>{cat.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cat.variants.map((v, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '6px 10px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: cat.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{v.tag}</span>
                      <span style={{ fontSize: 11, color: '#666' }}>{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', marginBottom: 4 }}>Frequently asked questions</h2>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>What new agents ask before signing up</p>
            {[
              {
                q: 'How many app types can I sign vendors up for?',
                a: 'All three — Food, Products, and Services. Each has WhatsApp, Chat, or Email order-channel variants. Vendor picks at signup; affiliate gets commission regardless of which.',
              },
              {
                q: 'Do I get commission on Services apps too?',
                a: 'Yes — same commission rate as Food and Products. Services is the newest category (launched 2026), so demand from agents/cleaners/photographers is wide open.',
              },
              {
                q: 'What if my vendor wants to switch tiers later (WhatsApp ⇄ Chat)?',
                a: 'At the next renewal the vendor picks their tier again from the plan picker — they can switch direction at any monthly boundary. Your first-month commission was paid on whatever they originally chose; switches at renewal are routine vendor admin and don\'t generate additional commission.',
              },
              {
                q: 'How do I get paid?',
                a: 'Direct bank transfer for Indonesia affiliates (no processing fees). International affiliates via Stripe (fees deducted from commission — see pricing section).',
              },
              {
                q: 'Can I sign up vendors in countries outside Indonesia?',
                a: 'Yes — US, AU, EU, SG, TH, VN, PH, MY have local pricing. Use the lead-grab system to claim leads in any country.',
              },
              {
                q: 'How do I claim leads from the shared pool?',
                a: 'Use the "🎯 Leads to Contact" tab in your dashboard. Click "Grab Leads" — the system atomically assigns 5 leads to you. They\'re yours to work for 30 days.',
              },
              {
                q: 'What happens if I don\'t contact a grabbed lead?',
                a: 'After 30 days idle, leads return to the pool for other agents.',
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
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', margin: 0 }}>Indonesia pricing tiers</h2>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              Vendors pick a tier at signup. Your first-month commission matches whichever they choose.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                // FoodLocal actually ships two plan tiers, not three.
                // Both run on the same food-basic app; the only difference
                // is how customer orders reach the vendor.
                {
                  name: 'WhatsApp',
                  price: 'Rp 35.000',
                  color: '#FF6B35',
                  features: ['Full FoodLocal storefront', 'Orders go to vendor\'s WhatsApp', 'Customer pays cash / bank / QRIS / connected gateway', 'All 25 themes + custom theme editor', 'PWA install on any phone'],
                },
                {
                  name: 'Chat',
                  price: 'Rp 50.000',
                  color: '#22C55E',
                  features: ['Everything in WhatsApp tier', 'Orders go to private in-app chat (vendor\'s phone stays hidden)', 'Real-time customer chat thread per order', 'Built-in checkout via 16 payment gateways', 'In-thread refund + escrow controls', 'Multi-staff vendor login'],
                  popular: true,
                },
              ].map(tier => (
                <div key={tier.name} style={{ background: '#FAFAFA', border: `1px solid ${tier.popular ? tier.color : '#f0f0f0'}`, borderRadius: 14, padding: 14, position: 'relative' }}>
                  {tier.popular && (
                    <div style={{ position: 'absolute', top: -8, right: 12, background: tier.color, color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 8, letterSpacing: 0.5 }}>POPULAR</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: tier.color }}>{tier.name}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>per vendor / month</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a' }}>{tier.price}</div>
                      <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>You earn: {tier.price}</div>
                    </div>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#555', lineHeight: 1.6 }}>
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
                  Vendors can pay their subscription via Midtrans Snap (QRIS / GoPay / OVO / card, ~2.5% processing fee) or via manual bank transfer using an SL-XXXXXX activation code (no processing fee). When the vendor pays via Midtrans, the gateway fee comes out of the affiliate commission, not StreetLocal's share — your real take-home reflects the net amount received. Bank transfer signups pay zero fees so you keep the full Rp 35.000 or Rp 50.000.
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
                  When a vendor activates via an SL-XXXXXX bank-transfer code (instead of Midtrans), <strong>there are no Stripe / card / gateway fees, no deductions</strong> on their subscription. You keep the full Rp 35.000 or Rp 50.000 on every first-month signup paid this way.
                </div>
              </div>
            </div>
          </div>

          {/* Link preview */}
          {whatsapp && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#065F46', fontWeight: 600, marginBottom: 4 }}>Your agent link will be:</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#1a1a1a' }}>streetlocal.live/a/agent{whatsapp.replace(/[^0-9]/g, '').slice(-4) || '0000'}</div>
            </div>
          )}

          {!loginMode ? (
            <>
              {/* Signup Form */}
              <form onSubmit={handleSignup} style={{ ...s.form, background: 'rgba(0,0,0,0.9)', borderRadius: 16, padding: 20 }}>
                <h2 style={{ ...s.formTitle, color: '#fff' }}>Sign Up</h2>
                <label style={{ ...s.label, color: 'rgba(255,255,255,0.7)' }}>Full Name</label>
                <input style={{ ...s.input, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />

                <label style={{ ...s.label, color: 'rgba(255,255,255,0.7)' }}>Country</label>
                <select style={{ ...s.select, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} value={country} onChange={e => setCountry(e.target.value)}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>

                <label style={{ ...s.label, color: 'rgba(255,255,255,0.7)' }}>WhatsApp Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ ...s.prefix, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>{COUNTRIES.find(c => c.code === country)?.prefix || '+00'}</span>
                  <input style={{ ...s.input, flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} type="tel" placeholder="812 3456 7890" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                </div>

                {error && <div style={s.error}>{error}</div>}

                <button type="submit" style={{ ...s.primaryBtn, background: '#FFD600', color: '#1a1a1a' }} disabled={loading}>
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </form>

              <button onClick={() => { setLoginMode(true); setError('') }} style={{ ...s.linkBtn, color: '#FFD600' }}>
                Already an agent? Sign In
              </button>
            </>
          ) : (
            <>
              {/* Login Form */}
              <form onSubmit={handleLogin} style={{ ...s.form, background: 'rgba(0,0,0,0.9)', borderRadius: 16, padding: 20 }}>
                <h2 style={{ ...s.formTitle, color: '#fff' }}>Agent Sign In</h2>
                <label style={{ ...s.label, color: 'rgba(255,255,255,0.7)' }}>WhatsApp Number</label>
                <input style={{ ...s.input, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} type="tel" placeholder="e.g. 6281234567890" value={loginWhatsapp} onChange={e => setLoginWhatsapp(e.target.value)} />

                <label style={{ ...s.label, color: 'rgba(255,255,255,0.7)' }}>Agent Code</label>
                <input style={{ ...s.input, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} placeholder="e.g. agent2345" value={loginCode} onChange={e => setLoginCode(e.target.value)} />

                {error && <div style={s.error}>{error}</div>}

                <button type="submit" style={{ ...s.primaryBtn, background: '#FFD600', color: '#1a1a1a' }} disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <button onClick={() => { setLoginMode(false); setError('') }} style={{ ...s.linkBtn, color: '#FFD600' }}>
                Don't have an account? Sign Up
              </button>
            </>
          )}

          {/* T&C Link */}
          <button onClick={() => setStep('terms')} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, fontWeight: 700, color: '#555', cursor: 'pointer', marginTop: 8 }}>
            📋 View Terms & Conditions
          </button>
          <p style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 8 }}>By signing up you agree to our Agent Terms & Conditions</p>
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
            <li>Agents earn 100% commission on the first month's subscription of each referred user only</li>
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
            <div style={{ fontSize: 32, fontWeight: 900, color: '#FF6B35', marginBottom: 4 }}>Rp {AGENT_FEE}/mo</div>
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
              <span style={{ fontWeight: 900, fontSize: 16, color: '#FF6B35' }}>Rp {AGENT_FEE}</span>
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
      color: '#FF6B35',
      apps: [
        { id: 'basic', name: 'FoodLocal', price: 'Rp 35.000', commission: 'Rp 35.000', color: '#FF6B35', icon: '🍜', desc: locale === 'id' ? 'Dari gerobak hingga restoran — pemesanan via WhatsApp' : 'From street carts to restaurants — WhatsApp order channel', screenshot: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png', url: '/food/chat/?plan=whatsapp' },
        { id: 'chat', name: 'FoodLocal Chat', price: 'Rp 50.000', commission: 'Rp 50.000', color: '#22C55E', icon: '💬', desc: locale === 'id' ? 'Storefront yang sama dengan checkout chat dalam aplikasi' : 'Same storefront with private in-app chat checkout + 16 payment gateways', screenshot: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaa.png', url: '/food/chat/?plan=chat' },
        { id: 'pro', name: 'FoodLocal Pro', price: 'From Rp 100.000', commission: 'Rp 100.000', color: '#FFD600', icon: '🍽️', desc: locale === 'id' ? 'Suite restoran lengkap: menu extras, deal, banner ads, analitik, verifikasi KTP. Order WhatsApp 100k/bln atau Chat dalam aplikasi 150k/bln.' : 'Full restaurant suite: menu extras, deals, banner ads, analytics, KTP-verified. WhatsApp orders 100k/mo or in-app Chat orders 150k/mo.', screenshot: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledfsdfsdfsssss.png', url: '/food/pro/' },
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
          <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', color: '#FF6B35', fontSize: 13, fontWeight: 700 }}>
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
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a', marginTop: 6, textAlign: 'center' }}>{app.name}</div>
                    <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, textAlign: 'center' }}>{app.commission}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ── Main Agent App ── */
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ ...s.topBar, borderBottom: 'none' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
          <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>{L.agentHub}</div>
        </div>
        <button onClick={() => setDrawer(true)} style={{ ...s.backBtn, fontSize: 22 }}>☰</button>
      </div>

      {/* Status Banner */}
      {isPendingPayment && (
        <div style={{ ...s.statusBanner, background: '#FEF3C7', color: '#92400E' }}>
          {locale === 'id' ? 'Menunggu pembayaran' : 'Awaiting payment'} — <button onClick={() => setStep('payment')} style={{ background: 'none', border: 'none', color: '#92400E', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>{locale === 'id' ? 'Bayar Sekarang' : 'Pay Now'}</button>
        </div>
      )}

      {/* Mini stats ribbon */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 16px', background: '#FAFAFA', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#22c55e' }}>Rp {stats.totalEarnings.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{L.earnings}</div>
        </div>
        <div style={{ width: 1, background: '#e0e0e0' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#8B5CF6' }}>{stats.totalSignups}</div>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{L.referrals}</div>
        </div>
        <div style={{ width: 1, background: '#e0e0e0' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#3B82F6' }}>{stats.totalClicks}</div>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>Clicks</div>
        </div>
      </div>

      {/* Agent Link Bar */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F5F5', borderRadius: 12, padding: '10px 12px' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{agentLink}</span>
          <button onClick={copyLink} style={{ ...s.copyBtn, fontSize: 11, padding: '5px 12px' }}>
            {copied ? L.copied : L.copyLink}
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ padding: '14px 16px 8px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{ ...s.catPill, ...(selectedCategory === 'all' ? s.catPillActive : {}) }}
        >
          {L.allCategories}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{ ...s.catPill, ...(selectedCategory === cat.id ? s.catPillActive : {}) }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* App Library Title */}
      <div style={{ padding: '8px 16px 4px' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>{L.appLibrary}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{locale === 'id' ? 'Ketuk untuk melihat detail & bagikan' : 'Tap to view details & share'}</div>
      </div>

      {/* Phone Frame Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 16px 24px' }}>
        {filteredApps.map(app => (
          <div key={app.id} onClick={() => setSelectedApp(app)} style={{ cursor: 'pointer' }}>
            {/* Mini phone frame */}
            <div style={{ width: '100%', aspectRatio: '9/16', borderRadius: 22, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 8px 24px ${app.color}15, 0 4px 12px rgba(0,0,0,0.1)`, border: '2px solid #eee' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 19, overflow: 'hidden', background: '#000', position: 'relative' }}>
                {/* Dynamic island */}
                <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 36, height: 11, background: '#000', borderRadius: 10, zIndex: 3 }} />
                {app.screenshot ? (
                  <img src={app.screenshot} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${app.color}20, ${app.color}05)` }}>
                    <span style={{ fontSize: 32, opacity: 0.4 }}>{app.icon}</span>
                  </div>
                )}
                {/* Home indicator */}
                <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>
            {/* App label */}
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>{app.name}</div>
              <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, marginTop: 2 }}>{L.youEarn}: {app.commission}</div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>{app.price}{L.perMonth}</div>
            </div>
          </div>
        ))}

        {/* Coming soon placeholders */}
        {filteredApps.length < 4 && [...Array(4 - filteredApps.length)].map((_, i) => (
          <div key={`soon-${i}`} style={{ opacity: 0.3 }}>
            <div style={{ width: '100%', aspectRatio: '9/16', borderRadius: 22, background: '#f0f0f0', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24 }}>🔜</span>
            </div>
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ccc' }}>{locale === 'id' ? 'Segera Hadir' : 'Coming Soon'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works section */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#1a1a1a', marginBottom: 12 }}>{L.howItWorks}</div>
        {[
          { step: '1', title: L.step1, desc: L.step1d },
          { step: '2', title: L.step2, desc: L.step2d },
          { step: '3', title: L.step3, desc: L.step3d },
          { step: '4', title: L.step4, desc: L.step4d },
        ].map(st => (
          <div key={st.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: '#FF6B35', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{st.step}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>{st.title}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{st.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '12px 0 30px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 10, color: '#ccc' }}>Powered by</div>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{agent?.agent_code}</div>
      </div>

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
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B35', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
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
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B35', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>{locale === 'id' ? '🥇 Top Agent' : '🥇 Top Agents'}</h3>
                <button onClick={async () => { if (!supabase) return; const { data } = await supabase.rpc('agent_leaderboard'); setAgentBoard(data || []) }} style={{ background: '#FFD600', color: '#1a1a1a', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', marginBottom: 12 }}>🔄 {locale === 'id' ? 'Refresh' : 'Refresh'}</button>
                {agentBoard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 12 }}>{locale === 'id' ? 'Klik Refresh' : 'Click Refresh'}</div>
                ) : (
                  agentBoard.map((row, i) => (
                    <div key={row.agent_id} style={{ padding: 12, background: i === 0 ? 'linear-gradient(135deg, #FFD60020, #FFD60005)' : '#FAFAFA', borderRadius: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 16, background: i === 0 ? '#FFD600' : i < 3 ? '#FFE4A0' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>{i + 1}</div>
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
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B35', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>

                {/* ── Headline metrics: views, signups, click-through rate ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  <div style={{ background: '#EFF6FF', borderRadius: 14, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{locale === 'id' ? 'Dilihat' : 'Views'}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>{stats.totalClicks}</div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{locale === 'id' ? 'Klik link Anda' : 'Link clicks'}</div>
                  </div>
                  <div style={{ background: '#FAF5FF', borderRadius: 14, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6d28d9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{locale === 'id' ? 'Daftar' : 'Signups'}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#8B5CF6', marginTop: 4 }}>{stats.totalSignups}</div>
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
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B35', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
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
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B35', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>{L.verify}</h3>
                <div style={{ padding: 12, borderRadius: 12, background: isVerified ? '#D1FAE5' : agent?.verification_status === 'submitted' ? '#DBEAFE' : '#FEF3C7', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isVerified ? '#065F46' : agent?.verification_status === 'submitted' ? '#1E40AF' : '#92400E' }}>
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
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B35', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
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
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#FF6B35', background: '#FFF7ED', padding: '3px 6px', borderRadius: 4, flexShrink: 0 }}>{item.type}</span>
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
                        <span style={{ fontSize: 10, color: '#FF6B35', marginTop: 3 }}>●</span>
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
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#FFD600', width: 40, flexShrink: 0 }}>{row.time}</span>
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
                      <span style={{ fontSize: 10, color: '#FF6B35', marginTop: 3 }}>★</span>
                      <span style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DRAWER: SETTINGS ── */}
            {drawerPage === 'settings' && (
              <div style={{ padding: 20 }}>
                <button onClick={() => setDrawerPage(null)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B35', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>&#8592; {locale === 'id' ? 'Kembali' : 'Back'}</button>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>{L.settings}</h3>

                {/* Language toggle */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>{L.language}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setLocale('id')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: locale === 'id' ? '2px solid #FF6B35' : '1px solid #e0e0e0', background: locale === 'id' ? '#FFF7ED' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#1a1a1a' }}>
                      🇮🇩 Bahasa
                    </button>
                    <button onClick={() => setLocale('en')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: locale === 'en' ? '2px solid #FF6B35' : '1px solid #e0e0e0', background: locale === 'en' ? '#FFF7ED' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#1a1a1a' }}>
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
    background: '#ffffff',
    color: '#1a1a1a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 480,
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 10,
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
    padding: '16px 20px 30px',
  },
  hero: {
    textAlign: 'center',
    padding: '20px 0 24px',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 900,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: '#888',
    lineHeight: 1.5,
    maxWidth: 280,
    margin: '0 auto',
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
    background: '#FF6B35',
    color: '#fff',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 4,
  },
  linkBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    background: 'none',
    border: 'none',
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 12,
    marginBottom: 16,
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
    background: '#FF6B35',
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
    background: '#FF6B35',
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
