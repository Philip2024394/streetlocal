/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VendorDashboardV2 — Ultimate Food Vendor Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 * Stripe + Shopify inspired. 6 pages. Live/Offline toggles. Help icons.
 * Full CRUD menu management. Orders feed. Analytics. Payouts.
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PAYMENT_ICONS } from '@/constants/paymentIcons'
import { saveVendorExtras as saveExtrasToDb, saveBundleDiscount as saveBundleToDb, saveMenuItem as saveMenuItemToDb, deleteMenuItem as deleteMenuItemFromDb } from '@/services/vendorExtrasService'
import { getPrepaidWallet, topUpPrepaidWallet } from '@/services/walletService'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')
const LOCAL_KEY = 'indoo_vendor_restaurant'

// ── Help content per section ─────────────────────────────────────────────────
const HELP = {
  menu: {
    title: 'Menu Management',
    steps: [
      'Tap "+ Add Item" to create a new menu item with name, price, photo, and category.',
      'Use the green/grey toggle on each item to set it LIVE (visible to customers) or OFFLINE (hidden).',
      'Tap the pencil icon to edit an item, or the trash icon to delete it.',
      'Filter by category or status using the dropdowns above.',
      'Customers only see LIVE items — use OFFLINE during busy hours instead of deleting.',
    ],
  },
  orders: {
    title: 'Orders',
    steps: [
      'New orders appear here automatically when a customer places an order.',
      'Tap "Confirm" to accept the order and start preparing.',
      'Update status as you progress: Preparing → Ready → Completed.',
      'The driver will be notified when the order is ready for pickup.',
      'Completed orders move to the history tab.',
    ],
  },
  analytics: {
    title: 'Analytics',
    steps: [
      'Track your daily, weekly, and monthly sales.',
      'See which items sell the most so you can stock accordingly.',
      'Peak hours show when you get the most orders — staff up during these times.',
      'Items set to OFFLINE during peak hours may reduce your revenue.',
    ],
  },
  settings: {
    title: 'Store Settings',
    steps: [
      'Update your store name, photo, and address here.',
      'Set your opening and closing hours — customers see this on your page.',
      'Add your bank details so customers can pay you directly.',
      'Keep your phone number updated so drivers can contact you.',
    ],
  },
  payouts: {
    title: 'Payouts',
    steps: [
      'INDOO takes 10% commission on every order (7% if customer pays via bank transfer).',
      'Commission is tracked here. You pay INDOO from your wallet balance.',
      'When your commission owed exceeds Rp 50,000, please top up your wallet.',
      'All customer payments go directly to your bank account — INDOO never holds your money.',
    ],
  },
  deals: {
    title: 'Deals & Promotions',
    steps: [
      'Create deals by selecting menu items and setting a discount percentage.',
      'Choose which days the deal is available and set start/end dates.',
      'Set a daily quantity limit so you control how many deals go out each day.',
      'Toggle deals active or inactive anytime — inactive deals are hidden from customers.',
      'Preview how your deal card looks to customers before publishing.',
    ],
  },
  toggle: {
    title: 'Live / Offline Toggle',
    steps: [
      'LIVE means customers can see and order this item.',
      'OFFLINE means the item is hidden from customers.',
      'Use this during busy hours to pause specific items without deleting them.',
      'The master toggle at the top sets your entire store Live or Offline.',
      'Individual item toggles can override the global status.',
    ],
  },
}

function HelpIcon({ section }) {
  const [open, setOpen] = useState(false)
  const help = HELP[section]
  if (!help) return null
  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        width: 22, height: 22, borderRadius: '50%', background: 'rgba(141,198,63,0.15)',
        border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 11, fontWeight: 900,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>?</button>
      {open && createPortal(
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1e', border: '1px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>💡</div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 12px', textAlign: 'center' }}>{help.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {help.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setOpen(false)} style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Got it!</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Status Toggle ────────────────────────────────────────────────────────────
function StatusToggle({ active, onChange, size = 'normal' }) {
  const w = size === 'large' ? 56 : 44
  const h = size === 'large' ? 28 : 24
  const knob = size === 'large' ? 22 : 18
  return (
    <button onClick={() => onChange(!active)} style={{
      width: w, height: h, borderRadius: h, border: 'none', cursor: 'pointer', padding: 0, position: 'relative',
      background: active ? '#8DC63F' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: (h - knob) / 2, left: active ? w - knob - 3 : 3,
        width: knob, height: knob, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

// ── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, helpKey, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>{title}</h2>
      {helpKey && <HelpIcon section={helpKey} />}
      {children}
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = '#8DC63F', icon }) {
  return (
    <div style={{
      flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon && (typeof icon === 'string' && icon.startsWith('http') ? <img src={icon} alt="" style={{ width: 41, height: 41, objectFit: 'contain' }} /> : <span style={{ fontSize: 18 }}>{icon}</span>)}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <span style={{ fontSize: 22, fontWeight: 900, color }}>{value}</span>
    </div>
  )
}

// ── Menu Item Card ───────────────────────────────────────────────────────────
function MenuCard({ item, onToggle, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      opacity: item.is_available ? 1 : 0.5, transition: 'opacity 0.3s',
    }}>
      {item.photo_url ? (
        <img src={item.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🍽️</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.category}</span>
        </div>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6,
        background: item.is_available ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)',
        color: item.is_available ? '#8DC63F' : 'rgba(255,255,255,0.3)',
      }}>{item.is_available ? 'LIVE' : 'OFF'}</span>
      <StatusToggle active={item.is_available} onChange={() => onToggle(item.id)} />
      <button onClick={() => onEdit(item)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button onClick={() => onDelete(item.id)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </div>
  )
}

const MENU_CATS = ['All', 'Main', 'Sides', 'Drinks', 'Snacks', 'Desserts', 'Rice', 'Noodles', 'Gorengan', 'Tea & Coffee', 'Juice & Smoothie', 'Satay & Grilled']

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'menu', label: 'Menu', icon: '🍽️' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'events', label: 'Events & Venue', icon: '🎉' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'payouts', label: 'Payouts', icon: '💰' },
  { id: 'banners', label: 'Banner Ads', icon: '📢' },
  { id: 'extras', label: 'Extras & Add-ons', icon: '🍟' },
  { id: 'wallet', label: 'Wallet & Top Up', icon: '💳' },
  { id: 'deals', label: 'Deals & Promotions', icon: '🏷️' },
]

// ── Extras management ───────────────────────────────────────────────────────
const EXTRAS_STORAGE = 'indoo_vendor_extras'
const EXTRA_CATEGORIES = [
  { id: 'sauces', label: 'Sauces', icon: '🌶️' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
  { id: 'sides', label: 'Sides', icon: '🍟' },
]

// Lazy import libraries
let _sauceLib = null, _sidesLib = null, _drinksLib = null
async function getSauceLibrary() {
  if (_sauceLib) return _sauceLib
  const mod = await import('@/constants/sauceLibrary')
  _sauceLib = mod.SAUCE_LIBRARY
  return _sauceLib
}
async function getSidesLibrary() {
  if (_sidesLib) return _sidesLib
  const mod = await import('@/constants/sidesLibrary')
  _sidesLib = mod.SIDES_LIBRARY
  return _sidesLib
}
async function getDrinksLibrary() {
  if (_drinksLib) return _drinksLib
  const mod = await import('@/constants/drinksLibrary')
  _drinksLib = mod.DRINKS_LIBRARY
  return _drinksLib
}

function loadVendorExtras() {
  try { return JSON.parse(localStorage.getItem(EXTRAS_STORAGE) || '{}') } catch { return {} }
}
function saveVendorExtras(data) {
  localStorage.setItem(EXTRAS_STORAGE, JSON.stringify(data))
}

// ── Banner Ad system ────────────────────────────────────────────────────────
const BANNER_TEMPLATES = [
  { id: 'fire', label: 'Fire Sale', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2024,%202026,%2006_22_44%20PM.png', color: '#EF4444' },
  { id: 'juice', label: 'Free Juice', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2025,%202026,%2004_22_55%20AM.png', color: '#8DC63F' },
  { id: 'fries', label: 'Free Fries', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2025,%202026,%2004_22_09%20AM.png', color: '#FACC15' },
  { id: 'street', label: 'Street Food', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', color: '#F59E0B' },
  { id: 'seafood', label: 'Ocean Fresh', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600', color: '#3B82F6' },
  { id: 'spicy', label: 'Spicy Hot', img: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600', color: '#DC2626' },
]

const BANNER_PRICE = 100000 // Rp 100.000 per 24 hours
const BANNER_STORAGE = 'indoo_vendor_banners'
const BANNER_BANK = { bank: 'BCA', number: '8810 2233 4455', holder: 'PT INDOO Indonesia' }

function loadVendorBanners() {
  try { return JSON.parse(localStorage.getItem(BANNER_STORAGE) || '[]') } catch { return [] }
}
function saveVendorBanner(banner) {
  const banners = loadVendorBanners()
  banners.unshift(banner)
  localStorage.setItem(BANNER_STORAGE, JSON.stringify(banners))
}
export function getActiveBanners() {
  return loadVendorBanners().filter(b => b.status === 'active' && new Date(b.expires_at) > new Date())
}

// ── Events & Venue management constants ─────────────────────────────────────
const EVENT_TYPES = [
  { id: 'seating', label: 'Venue & Seating', icon: '🪑', placeholder: 'Describe your venue — seating layout, AC, ambience, parking...' },
  { id: 'catering', label: 'Catering', icon: '🍽️', placeholder: 'What catering services do you offer — menu options, min order, delivery area...' },
  { id: 'birthday_setup', label: 'Birthday Parties', icon: '🎂', placeholder: 'Describe your birthday packages — decorations, cake, setup, what\'s included...' },
  { id: 'private_room', label: 'Private Room', icon: '🚪', placeholder: 'Describe your private room — capacity, amenities, minimum spend...' },
  { id: 'party_package', label: 'Party Package', icon: '🎊', placeholder: 'Describe your party package — what\'s included, pricing tiers, add-ons...' },
  { id: 'live_music', label: 'Live Music', icon: '🎵', placeholder: 'Describe live music at your venue — schedule, genres, booking for private events...' },
  { id: 'sound_system', label: 'DJ & Sound System', icon: '🎧', placeholder: 'Describe your DJ/sound setup — equipment, hire options, capacity...' },
  { id: 'wedding', label: 'Wedding', icon: '💒', placeholder: 'Describe wedding packages — capacity, decoration, catering, pricing...' },
  { id: 'corporate', label: 'Corporate Events', icon: '💼', placeholder: 'Describe corporate packages — meeting room, projector, lunch sets...' },
  { id: 'tour_guide', label: 'Tour Guide Package', icon: '🚌', placeholder: 'Describe your tour group deal — min pax, set menu, parking, guide discount...' },
]

const EVENTS_STORAGE_KEY = 'indoo_vendor_events'

function loadVendorEvents() {
  try { return JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) || '{}') } catch { return {} }
}

function saveVendorEvents(data) {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(data))
}

// ── Top Up Overlay ──────────────────────────────────────────────────────────
function TopUpOverlay({ wallet, onClose, onSuccess }) {
  const [step, setStep] = useState('select') // select | payment | uploading | success
  const [amount, setAmount] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [copyMsg, setCopyMsg] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const QUICK_AMOUNTS = [50000, 100000, 200000, 500000]
  const BANK_ACCOUNT = '7890-1234-5678'
  const bal = wallet?.balance ?? 0
  const balColor = bal >= 50000 ? '#8DC63F' : bal >= 25000 ? '#FACC15' : '#EF4444'

  const handleCopy = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT.replace(/-/g, '')).catch(() => {})
    setCopyMsg(true)
    setTimeout(() => setCopyMsg(false), 2000)
  }

  const handleProof = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setProofPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!amount || !proofFile) return
    setSubmitting(true)
    try {
      const updated = await topUpPrepaidWallet('vendor-demo', amount, 'bank_transfer')
      if (updated) {
        setStep('success')
        setTimeout(() => onSuccess(updated), 2000)
      }
    } catch {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10003, display: 'flex', flexDirection: 'column',
      background: '#000', isolation: 'isolate',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', zIndex: 0, pointerEvents: 'none' }} />

      {step === 'success' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F', marginBottom: 8 }}>Top Up Submitted</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Your top up of {fmtRp(amount)} is being verified. Balance will update shortly.</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 14px',
            position: 'relative', zIndex: 1, flexShrink: 0,
          }}>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', flex: 1 }}>Top Up Wallet</span>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 100px', position: 'relative', zIndex: 1 }}>

            {/* Current balance */}
            <div style={{
              padding: 16, borderRadius: 16, marginBottom: 20, textAlign: 'center',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${balColor}30`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Current Balance</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: balColor }}>{fmtRp(bal)}</span>
            </div>

            {/* Quick amount buttons */}
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 10 }}>Select Amount</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => { setAmount(a); setStep('payment') }} style={{
                  padding: '16px 10px', borderRadius: 14, cursor: 'pointer',
                  background: amount === a ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: amount === a ? '2px solid #8DC63F' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  color: amount === a ? '#8DC63F' : '#fff', fontSize: 16, fontWeight: 900, textAlign: 'center',
                }}>
                  {fmtRp(a)}
                </button>
              ))}
            </div>

            {/* Payment details — show after amount selected */}
            {step === 'payment' && (
              <>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 10 }}>Payment Method</span>
                <div style={{
                  padding: 16, borderRadius: 16, marginBottom: 16,
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(141,198,63,0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,82,164,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#0052A4', flexShrink: 0 }}>BCA</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>Bank Transfer BCA</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>PT HAMMEREX PRODUCTS</span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ flex: 1, fontSize: 18, fontWeight: 900, color: '#FACC15', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{BANK_ACCOUNT}</span>
                    <button onClick={handleCopy} style={{
                      padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(141,198,63,0.3)',
                      background: copyMsg ? 'rgba(141,198,63,0.2)' : 'rgba(141,198,63,0.08)',
                      color: '#8DC63F', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    }}>{copyMsg ? 'Copied!' : 'Copy'}</button>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                    Transfer exactly {fmtRp(amount)} to the account above
                  </div>
                </div>

                {/* Upload proof */}
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 10 }}>Upload Payment Proof</span>
                <div style={{
                  padding: 16, borderRadius: 16, marginBottom: 20, textAlign: 'center',
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px dashed rgba(255,255,255,0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                }} onClick={() => document.getElementById('topup-proof-input')?.click()}>
                  <input id="topup-proof-input" type="file" accept="image/*" onChange={handleProof} style={{ display: 'none' }} />
                  {proofPreview ? (
                    <img src={proofPreview} alt="Proof" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 10 }} />
                  ) : (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block' }}>Tap to upload screenshot</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', display: 'block', marginTop: 4 }}>Take a screenshot of your bank transfer confirmation</span>
                    </>
                  )}
                </div>

                {/* Confirm button */}
                <button onClick={handleSubmit} disabled={!proofFile || submitting} style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                  background: proofFile && !submitting ? '#8DC63F' : 'rgba(141,198,63,0.2)',
                  color: proofFile && !submitting ? '#000' : 'rgba(0,0,0,0.3)',
                  fontSize: 15, fontWeight: 900, cursor: proofFile && !submitting ? 'pointer' : 'not-allowed',
                }}>
                  {submitting ? 'Submitting...' : `Confirm Top Up ${fmtRp(amount)}`}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function VendorDashboardV2({ onClose }) {
  const [page, setPage] = useState('overview')
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [storeOpen, setStoreOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY))?.is_open ?? true } catch { return true }
  })
  const [editItem, setEditItem] = useState(null) // null = closed, {} = new, {...} = editing
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [menuFilter, setMenuFilter] = useState('All')
  const [menuStatus, setMenuStatus] = useState('all') // 'all' | 'live' | 'offline'
  const [menuSearch, setMenuSearch] = useState('')
  const [sideOpen, setSideOpen] = useState(false)
  const [liveListOpen, setLiveListOpen] = useState(false)
  const [offlineListOpen, setOfflineListOpen] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [showTopUp, setShowTopUp] = useState(false)

  // Load restaurant data
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(LOCAL_KEY))
      if (data) {
        setRestaurant(data)
        setMenuItems(data.menu_items ?? [])
        setStoreOpen(data.is_open ?? true)
      }
    } catch {}
    getPrepaidWallet('vendor-demo', 'restaurant').then(w => setWallet(w)).catch(() => {})
  }, [])

  // Persist changes
  const persist = (items, open) => {
    try {
      const data = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
      data.menu_items = items
      data.is_open = open ?? storeOpen
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
    } catch {}
  }

  // ── Menu CRUD ──────────────────────────────────────────────────────────────
  const toggleItem = (id) => {
    setMenuItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, is_available: !i.is_available } : i)
      persist(updated)
      return updated
    })
  }

  const deleteItem = (id) => {
    setMenuItems(prev => {
      const updated = prev.filter(i => i.id !== id)
      persist(updated)
      return updated
    })
    setDeleteConfirm(null)
  }

  const saveItem = async (item) => {
    // Sync to Supabase if restaurant exists
    if (restaurant?.id) {
      const saved = await saveMenuItemToDb(restaurant.id, item)
      if (saved?.id) item = { ...item, ...saved }
    }
    setMenuItems(prev => {
      let updated
      if (prev.find(i => i.id === item.id)) {
        updated = prev.map(i => i.id === item.id ? item : i)
      } else {
        updated = [...prev, { ...item, id: item.id ?? Date.now(), is_available: true }]
      }
      persist(updated)
      return updated
    })
    setEditItem(null)
  }

  const toggleStore = (val) => {
    setStoreOpen(val)
    persist(menuItems, val)
  }

  // Filtered menu
  const filtered = menuItems.filter(i => {
    if (menuFilter !== 'All' && i.category !== menuFilter) return false
    if (menuStatus === 'live' && !i.is_available) return false
    if (menuStatus === 'offline' && i.is_available) return false
    if (menuSearch && !i.name.toLowerCase().includes(menuSearch.toLowerCase())) return false
    return true
  })

  const liveCount = menuItems.filter(i => i.is_available).length
  const offCount = menuItems.length - liveCount

  // Demo orders with full details
  const [orders, setOrders] = useState([
    { id: 'ORD-1001', items: [{ name: 'Nasi Gudeg', qty: 2, prepTime: 10 }, { name: 'Es Teh', qty: 2, prepTime: 2 }], total: 66000, customer: 'Agus Prasetyo', phone: '6281234567890', address: 'Jl. Kaliurang Km 5', status: 'confirmed', time: '2 min ago', driverETA: 8, paymentMethod: 'bank', qrCode: 'INDOO-1001-AGS', paymentProof: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png?updatedAt=1776728649363' },
    { id: 'ORD-1002', items: [{ name: 'Bakso Jumbo', qty: 1, prepTime: 8 }, { name: 'Es Jeruk', qty: 1, prepTime: 3 }], total: 33000, customer: 'Siti Rahayu', phone: '6281234567891', address: 'Jl. Malioboro 12', status: 'preparing', time: '8 min ago', driverETA: 4, paymentMethod: 'cod', qrCode: 'INDOO-1002-STI', paymentProof: null },
    { id: 'ORD-1003', items: [{ name: 'Nasi Goreng', qty: 3, prepTime: 12 }, { name: 'Sate Ayam', qty: 1, prepTime: 10 }], total: 119000, customer: 'Budi Wijaya', phone: '6281234567892', address: 'Jl. Parangtritis 45', status: 'ready', time: '15 min ago', driverETA: 1, paymentMethod: 'bank', qrCode: 'INDOO-1003-BDI' },
    { id: 'ORD-1004', items: [{ name: 'Ayam Geprek', qty: 2, prepTime: 12 }], total: 50000, customer: 'Dewi Lestari', phone: '6281234567893', address: 'Jl. Solo Km 3', status: 'completed', time: '32 min ago', driverETA: 0, paymentMethod: 'bank', qrCode: 'INDOO-1004-DWI', qrScanned: true },
  ])
  const [showQR, setShowQR] = useState(null) // order id showing QR
  const [showPaymentProof, setShowPaymentProof] = useState(null) // order id showing proof

  const audioRef = useRef(null)

  // Play notification sound for unaccepted orders
  useEffect(() => {
    const hasUnaccepted = orders.some(o => o.status === 'confirmed')
    if (hasUnaccepted) {
      // Create audio context for notification beep
      const playBeep = () => {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = 880 // A5 note
          gain.gain.value = 0.15
          osc.start()
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
          osc.stop(ctx.currentTime + 0.5)
          // Second beep
          setTimeout(() => {
            const osc2 = ctx.createOscillator()
            const gain2 = ctx.createGain()
            osc2.connect(gain2)
            gain2.connect(ctx.destination)
            osc2.frequency.value = 1100 // C#6
            gain2.gain.value = 0.15
            osc2.start()
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
            osc2.stop(ctx.currentTime + 0.5)
          }, 200)
        } catch {}
      }
      playBeep()
      audioRef.current = setInterval(playBeep, 5000) // repeat every 5 seconds
      return () => clearInterval(audioRef.current)
    } else {
      if (audioRef.current) clearInterval(audioRef.current)
    }
  }, [orders.filter(o => o.status === 'confirmed').length]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column',
      backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png?updatedAt=1776728649363)',
      backgroundSize: 'cover', backgroundPosition: 'center top', backgroundColor: '#000',
      isolation: 'isolate',
    }}>
      {/* Glass overlay — same as notifications */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }} />
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes flashGreen { 0%,100% { background: #8DC63F; transform: scale(1); } 50% { background: #6BA32D; transform: scale(1.02); box-shadow: 0 0 20px rgba(141,198,63,0.5); } }
        @keyframes bellShake { 0%,100% { transform: rotate(0deg); } 15% { transform: rotate(15deg); } 30% { transform: rotate(-15deg); } 45% { transform: rotate(10deg); } 60% { transform: rotate(-10deg); } 75% { transform: rotate(5deg); } }
        @keyframes runLeftLight { 0% { top: -30%; } 100% { top: 100%; } }
      `}</style>

      {/* ── Header — same style as notifications ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        background: 'transparent', position: 'relative', zIndex: 1, flexShrink: 0,
      }}>
        <img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaaa22ss-removebg-preview.png" alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{restaurant?.name ?? 'My Restaurant'}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block' }}>{restaurant?.city ?? ''}{restaurant?.address ? ` · ${restaurant.address}` : ''}</span>
        </div>
        <button onClick={() => setSideOpen(true)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

      {/* ── Stats strip — same as notifications ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', background: 'transparent', position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{fmtRp(847000)}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sales</span>
        </div>
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F', lineHeight: 1 }}>23</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Orders</span>
        </div>
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: storeOpen ? '#8DC63F' : '#EF4444', lineHeight: 1 }}>{storeOpen ? 'Open' : 'Closed'}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
        </div>
      </div>

      {/* ── Content — scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', paddingBottom: 100, background: 'transparent', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '0 16px' }}>

        {/* ══════════ PAGE: OVERVIEW ══════════ */}
        {page === 'overview' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Today's Overview</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: storeOpen ? '#8DC63F' : '#EF4444' }}>{storeOpen ? 'OPEN' : 'CLOSED'}</span>
                <StatusToggle active={storeOpen} onChange={toggleStore} size="large" />
                <HelpIcon section="toggle" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard label="Sales" value={fmtRp(847000)} color="#FACC15" icon="https://ik.imagekit.io/nepgaxllc/Untitledssscc-removebg-preview.png" />
              <StatCard label="Orders" value="23" color="#8DC63F" icon="https://ik.imagekit.io/nepgaxllc/Untitledsssaaa22-removebg-preview.png" />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {/* Live Items — tappable */}
              <div onClick={() => setPage('live')} style={{
                flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16, cursor: 'pointer', position: 'relative',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>🟢 LIVE ITEMS</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#8DC63F' }}>{liveCount}</span>
                <img src="https://ik.imagekit.io/nepgaxllc/Detailed%20white%20fingerprint%20on%20transparent%20background.png?updatedAt=1775934544111" alt="" style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, opacity: 0.15, objectFit: 'contain' }} />
              </div>
              {/* Offline Items — tappable */}
              <div onClick={() => setPage('offline')} style={{
                flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16, cursor: 'pointer', position: 'relative',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>⚫ OFFLINE</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{offCount}</span>
                <img src="https://ik.imagekit.io/nepgaxllc/Detailed%20white%20fingerprint%20on%20transparent%20background.png?updatedAt=1775934544111" alt="" style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, opacity: 0.15, objectFit: 'contain' }} />
              </div>
            </div>

            {/* ── Wallet Balance Card ── */}
            {wallet && (() => {
              const bal = wallet.balance ?? 0
              const balColor = bal >= 50000 ? '#8DC63F' : bal >= 25000 ? '#FACC15' : '#EF4444'
              const wStatus = (wallet.status ?? 'active').charAt(0).toUpperCase() + (wallet.status ?? 'active').slice(1)
              const statusBg = wStatus === 'Active' ? 'rgba(141,198,63,0.15)' : wStatus === 'Restricted' ? 'rgba(250,204,21,0.15)' : 'rgba(239,68,68,0.15)'
              const statusColor = wStatus === 'Active' ? '#8DC63F' : wStatus === 'Restricted' ? '#FACC15' : '#EF4444'
              return (
                <div style={{
                  padding: 16, borderRadius: 16, marginBottom: 20, position: 'relative', overflow: 'hidden',
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${balColor}30`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prepaid Wallet</span>
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 6, background: statusBg, color: statusColor }}>{wStatus}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: balColor, marginBottom: 4 }}>{fmtRp(bal)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Minimum required: Rp 50,000</div>
                  <button onClick={() => setShowTopUp(true)} style={{
                    width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                    background: balColor, color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer',
                  }}>Top Up Wallet</button>
                </div>
              )
            })()}

            <SectionHeader title="Live Orders" helpKey="orders" />
            {orders.filter(o => o.status !== 'completed').length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No active orders right now</div>
            ) : orders.filter(o => o.status !== 'completed').map(o => {
              const statusColor = o.status === 'confirmed' ? '#8DC63F' : o.status === 'preparing' ? '#FACC15' : '#60A5FA'
              return (
                <div key={o.id} style={{
                  padding: 14, borderRadius: 16, marginBottom: 10, position: 'relative', overflow: 'hidden',
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${statusColor}30`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  borderLeft: `4px solid ${statusColor}`,
                }}>
                  {/* Running light on left border for confirmed orders */}
                  {o.status === 'confirmed' && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, overflow: 'hidden', pointerEvents: 'none' }}>
                      <div style={{ width: '100%', height: '30%', background: 'linear-gradient(180deg, transparent, #fff, transparent)', animation: 'runLeftLight 1.5s linear infinite', position: 'absolute' }} />
                    </div>
                  )}
                  {/* Order ref + status + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{o.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 6, background: `${statusColor}20`, color: statusColor, textTransform: 'uppercase' }}>{o.status}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{o.time}</span>
                  </div>

                  {/* Customer info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block' }}>{o.customer}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{o.address}</span>
                    </div>
                    <button onClick={() => setShowPaymentProof(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, position: 'relative' }}>
                      <img src={o.paymentMethod === 'bank' ? PAYMENT_ICONS.bank : PAYMENT_ICONS.cod} alt={o.paymentMethod === 'bank' ? 'Bank' : 'COD'} style={{ width: 42, height: 42, objectFit: 'contain' }} />
                      {o.paymentMethod === 'bank' && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#8DC63F', border: '2px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/></svg></div>}
                    </button>
                  </div>

                  {/* Items */}
                  <div style={{ marginBottom: 10 }}>
                    {o.items.map((it, i) => (
                      <span key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1.6 }}>
                        {it.qty}x {it.name}
                      </span>
                    ))}
                  </div>

                  {/* Total + Driver ETA */}
                  {/* Prep time + Driver ETA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(o.total)}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12 }}>🍳</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                          Prep: {Math.max(...o.items.map(i => i.prepTime ?? 10))} min
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: o.driverETA <= 2 ? '#8DC63F' : '#FACC15' }}>
                          {o.driverETA === 0 ? 'Delivered' : o.driverETA <= 2 ? 'Arriving now' : `Driver: ${o.driverETA} min`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action button based on status */}
                  <div style={{ marginTop: 10 }}>
                    {o.status === 'confirmed' && (
                      <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                        background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                        animation: 'flashGreen 1s ease-in-out infinite',
                      }}>
                        ✓ Accept Order
                      </button>
                    )}
                    {o.status === 'preparing' && (
                      <button onClick={() => updateOrderStatus(o.id, 'ready')} style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                        background: '#FACC15', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                      }}>
                        🔔 Ready for Pickup
                      </button>
                    )}
                    {o.status === 'ready' && (
                      <button onClick={() => setShowQR(o.id)} style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                        background: '#60A5FA', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                      }}>
                        📱 Show QR for Driver Scan
                      </button>
                    )}
                    {o.status === 'ready' && (
                      <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, display: 'block', marginTop: 6, textAlign: 'center' }}>
                        ⚠️ Payment processes only after driver scans QR
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ══════════ PAGE: MENU ══════════ */}
        {page === 'menu' && (
          <>
            <SectionHeader title="Menu Management" helpKey="menu">
              <button onClick={() => setEditItem({})} style={{ padding: '8px 16px', borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>+ Add Item</button>
            </SectionHeader>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Search items..." style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, outline: 'none' }} />
              <select value={menuFilter} onChange={e => setMenuFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, outline: 'none' }}>
                {MENU_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={menuStatus} onChange={e => setMenuStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, outline: 'none' }}>
                <option value="all">All Status</option>
                <option value="live">Live Only</option>
                <option value="offline">Offline Only</option>
              </select>
            </div>

            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 12 }}>{filtered.length} items · {liveCount} live · {offCount} offline</span>

            {/* Menu items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  {menuItems.length === 0 ? 'No menu items yet — tap "+ Add Item" to start' : 'No items match your filters'}
                </div>
              ) : filtered.map(item => (
                <MenuCard key={item.id} item={item} onToggle={toggleItem} onEdit={setEditItem} onDelete={(id) => setDeleteConfirm(id)} />
              ))}
            </div>
          </>
        )}

        {/* ══════════ PAGE: ORDERS ══════════ */}
        {page === 'orders' && (
          <>
            <SectionHeader title="Active Orders" helpKey="orders" />
            {orders.filter(o => o.status !== 'completed').length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No active orders</div>
            ) : orders.filter(o => o.status !== 'completed').map(o => {
              const statusColor = o.status === 'confirmed' ? '#8DC63F' : o.status === 'preparing' ? '#FACC15' : '#60A5FA'
              return (
                <div key={o.id} style={{ padding: 14, borderRadius: 16, marginBottom: 10, position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${statusColor}30`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', borderLeft: `4px solid ${statusColor}` }}>
                  {o.status === 'confirmed' && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, overflow: 'hidden', pointerEvents: 'none' }}>
                      <div style={{ width: '100%', height: '30%', background: 'linear-gradient(180deg, transparent, #fff, transparent)', animation: 'runLeftLight 1.5s linear infinite', position: 'absolute' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{o.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 6, background: `${statusColor}20`, color: statusColor, textTransform: 'uppercase' }}>{o.status}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{o.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block' }}>{o.customer}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{o.address}</span>
                    </div>
                    <button onClick={() => setShowPaymentProof(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, position: 'relative' }}>
                      <img src={o.paymentMethod === 'bank' ? PAYMENT_ICONS.bank : PAYMENT_ICONS.cod} alt={o.paymentMethod === 'bank' ? 'Bank' : 'COD'} style={{ width: 42, height: 42, objectFit: 'contain' }} />
                      {o.paymentMethod === 'bank' && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#8DC63F', border: '2px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/></svg></div>}
                    </button>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {o.items.map((it, i) => <span key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1.6 }}>{it.qty}x {it.name}</span>)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(o.total)}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12 }}>🍳</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                          Prep: {Math.max(...o.items.map(i => i.prepTime ?? 10))} min
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: o.driverETA <= 2 ? '#8DC63F' : '#FACC15' }}>
                          {o.driverETA <= 2 ? 'Arriving now' : `Driver: ${o.driverETA} min`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {o.status === 'confirmed' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#8DC63F', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', animation: 'flashGreen 1s ease-in-out infinite' }}>✓ Accept Order</button>}
                    {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}><span style={{ display: 'inline-block', animation: 'bellShake 0.5s ease-in-out infinite' }}>🔔</span> Ready for Pickup</button>}
                    {o.status === 'ready' && (
                      <>
                        <button onClick={() => setShowQR(o.id)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#60A5FA', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>📱 Show QR for Driver Scan</button>
                        <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, display: 'block', marginTop: 6, textAlign: 'center' }}>⚠️ Payment processes only after driver scans QR</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            <SectionHeader title="Completed Orders" />
            {orders.filter(o => o.status === 'completed').map(o => (
              <div key={o.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 8, opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{o.id}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{o.customer} · {o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(o.total)}</span>
                    <span style={{ fontSize: 9, color: '#8DC63F', display: 'block' }}>✓ Completed</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══════════ PAGE: ANALYTICS ══════════ */}
        {page === 'analytics' && (
          <>
            <SectionHeader title="Analytics" helpKey="analytics" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard label="This Week" value={fmtRp(4250000)} color="#FACC15" icon="https://ik.imagekit.io/nepgaxllc/Untitledsssaaa22sssdsd-removebg-preview.png" />
              <StatCard label="This Month" value={fmtRp(18700000)} color="#8DC63F" icon="https://ik.imagekit.io/nepgaxllc/Untitledsssaaa22sssdsdddasdasd-removebg-preview.png" />
            </div>

            <SectionHeader title="Top Selling Items" />
            {menuItems.slice(0, 5).map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.3)', width: 20 }}>#{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#FACC15' }}>{fmtRp(item.price * (12 - i * 2))}</span>
              </div>
            ))}

            <SectionHeader title="Peak Hours" />
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, marginBottom: 20 }}>
              {[10,25,40,65,90,100,85,70,45,30,15,8].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: h > 70 ? '#8DC63F' : h > 40 ? '#FACC15' : 'rgba(255,255,255,0.08)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} title={`${i + 9}:00`} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              <span>9am</span><span>12pm</span><span>3pm</span><span>6pm</span><span>9pm</span>
            </div>
          </>
        )}

        {/* ══════════ PAGE: SETTINGS ══════════ */}
        {page === 'settings' && (
          <>
            <SectionHeader title="Store Settings" helpKey="settings" />
            {[
              { label: 'Store Name', value: restaurant?.name ?? '', key: 'name' },
              { label: 'Address', value: restaurant?.address ?? '', key: 'address' },
              { label: 'City', value: restaurant?.city ?? '', key: 'city' },
              { label: 'Phone', value: restaurant?.phone ?? '', key: 'phone' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{field.label}</label>
                <input defaultValue={field.value} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <button style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', marginTop: 8 }}>Save Changes</button>
          </>
        )}

        {/* ══════════ PAGE: PAYOUTS ══════════ */}
        {page === 'payouts' && (
          <>
            <SectionHeader title="Payouts" helpKey="payouts" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard label="Balance" value={fmtRp(1250000)} color="#8DC63F" icon="https://ik.imagekit.io/nepgaxllc/mmmass-removebg-preview.png" />
              <StatCard label="Commission Owed" value={fmtRp(187000)} color="#EF4444" icon="📊" />
            </div>

            <SectionHeader title="Recent Transactions" />
            {[
              { type: 'Order', ref: 'ORD-1001', amount: 66000, commission: 6600, date: 'Today' },
              { type: 'Order', ref: 'ORD-0998', amount: 45000, commission: 4500, date: 'Yesterday' },
              { type: 'Payout', ref: 'PAY-0055', amount: -500000, commission: 0, date: '2 days ago' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.ref}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{t.date}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: t.amount > 0 ? '#8DC63F' : '#EF4444' }}>{t.amount > 0 ? '+' : ''}{fmtRp(Math.abs(t.amount))}</span>
                  {t.commission > 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block' }}>-{fmtRp(t.commission)} commission</span>}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══════════ PAGE: LIVE ITEMS ══════════ */}
        {page === 'live' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setPage('overview')} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', margin: 0, flex: 1 }}>🟢 Live Items ({liveCount})</h2>
              <HelpIcon section="menu" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.filter(i => i.is_available).map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14,
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.15)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                  {item.photo_url ? <img src={item.photo_url} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{item.category}</span>
                  </div>
                  <button onClick={() => setEditItem(item)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                  <StatusToggle active={true} onChange={() => toggleItem(item.id)} />
                </div>
              ))}
              {liveCount === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No live items — toggle items on from Offline page</div>}
            </div>
          </>
        )}

        {/* ══════════ PAGE: OFFLINE ITEMS ══════════ */}
        {page === 'offline' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setPage('overview')} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.5)', margin: 0, flex: 1 }}>⚫ Offline Items ({offCount})</h2>
              <HelpIcon section="menu" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.filter(i => !i.is_available).map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14,
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', opacity: 0.7,
                }}>
                  {item.photo_url ? <img src={item.photo_url} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{item.category}</span>
                  </div>
                  <button onClick={() => setEditItem(item)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                  <StatusToggle active={false} onChange={() => toggleItem(item.id)} />
                </div>
              ))}
              {offCount === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>All items are live — nothing offline</div>}
            </div>
          </>
        )}

        {/* ══════════ PAGE: EVENTS & VENUE ══════════ */}
        {page === 'events' && <EventsPage />}

        {/* ══════════ PAGE: BANNER ADS ══════════ */}
        {page === 'banners' && <BannerAdsPage restaurant={restaurant} />}

        {/* ══════════ PAGE: EXTRAS & ADD-ONS ══════════ */}
        {page === 'extras' && <ExtrasPage restaurantId={restaurant?.id} />}

        {/* ══════════ PAGE: DEALS & PROMOTIONS ══════════ */}
        {page === 'deals' && <DealsPage menuItems={menuItems} onBack={() => setPage('overview')} />}

        {/* ══════════ PAGE: WALLET & TOP UP ══════════ */}
        {page === 'wallet' && (() => {
          const bal = wallet?.balance ?? 0
          const balColor = bal >= 50000 ? '#8DC63F' : bal >= 25000 ? '#FACC15' : '#EF4444'
          const wStatus = wallet ? (wallet.status ?? 'active').charAt(0).toUpperCase() + (wallet.status ?? 'active').slice(1) : 'Unknown'
          const statusBg = wStatus === 'Active' ? 'rgba(141,198,63,0.15)' : wStatus === 'Restricted' ? 'rgba(250,204,21,0.15)' : 'rgba(239,68,68,0.15)'
          const statusColor = wStatus === 'Active' ? '#8DC63F' : wStatus === 'Restricted' ? '#FACC15' : '#EF4444'
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button onClick={() => setPage('overview')} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Wallet & Top Up</h2>
              </div>

              {/* Balance card */}
              <div style={{
                padding: 20, borderRadius: 16, marginBottom: 16, position: 'relative', overflow: 'hidden',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${balColor}30`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Balance</span>
                  <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 6, background: statusBg, color: statusColor }}>{wStatus}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: balColor, marginBottom: 6 }}>{fmtRp(bal)}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>Minimum required: Rp 50,000</div>
                <button onClick={() => setShowTopUp(true)} style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                }}>Top Up Wallet</button>
              </div>

              {/* How it works */}
              <div style={{
                padding: 16, borderRadius: 16, marginBottom: 16,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 10 }}>How it Works</span>
                {[
                  { icon: '1', text: 'INDOO takes 10% commission (7% for bank transfer orders).' },
                  { icon: '2', text: 'Commission is deducted from your wallet balance.' },
                  { icon: '3', text: 'Keep your balance above Rp 50,000 to stay active.' },
                  { icon: '4', text: 'Below minimum = Restricted. Zero balance = Deactivated.' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{s.text}</span>
                  </div>
                ))}
              </div>

              {/* Recent wallet transactions */}
              <div style={{
                padding: 16, borderRadius: 16,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 10 }}>Recent Activity</span>
                {(wallet?.transactions ?? []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No transactions yet</div>
                ) : (wallet.transactions ?? []).slice(0, 10).map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.type === 'topup' ? 'Top Up' : t.type === 'commission' ? 'Commission' : t.type}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{t.date ?? ''}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: t.amount > 0 ? '#8DC63F' : '#EF4444' }}>{t.amount > 0 ? '+' : ''}{fmtRp(Math.abs(t.amount))}</span>
                  </div>
                ))}
              </div>
            </>
          )
        })()}

        </div>
      </div>

      {/* ── Top Up Overlay ── */}
      {showTopUp && <TopUpOverlay
        wallet={wallet}
        onClose={() => setShowTopUp(false)}
        onSuccess={(updated) => { setWallet(updated); setShowTopUp(false) }}
      />}

      {/* ── Add/Edit Item Modal ── */}
      {editItem !== null && (
        <ItemModal item={editItem} onSave={saveItem} onClose={() => setEditItem(null)} />
      )}


      {/* ── QR Code Modal — vendor shows to driver ── */}
      {showQR && (() => {
        const order = orders.find(o => o.id === showQR)
        if (!order) return null
        return (
          <div onClick={() => setShowQR(null)} style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#111', borderRadius: 24, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center', border: '2px solid rgba(141,198,63,0.2)' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 4 }}>{order.id}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 16 }}>Show this QR to the driver</span>

              {/* QR Code */}
              <div style={{ padding: 16, borderRadius: 16, background: '#fff', display: 'inline-block', marginBottom: 16 }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${order.qrCode}`} alt="QR" style={{ width: 180, height: 180, display: 'block' }} />
              </div>

              {/* Order summary */}
              <div style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 4 }}>{order.customer}</span>
                {order.items.map((it, i) => (
                  <span key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block' }}>{it.qty}x {it.name}</span>
                ))}
                <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 6 }}>{fmtRp(order.total)}</span>
              </div>

              <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, display: 'block', marginBottom: 12 }}>
                ⚠️ Payment will only process after driver scans this code
              </span>

              {/* Simulate scan button (demo) */}
              <button onClick={() => { updateOrderStatus(order.id, 'completed'); setShowQR(null) }} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 8,
              }}>
                ✓ Driver Scanned — Complete Order
              </button>
              <button onClick={() => setShowQR(null)} style={{
                width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                Close
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Payment Proof Popup ── */}
      {showPaymentProof && (() => {
        const order = orders.find(o => o.id === showPaymentProof)
        if (!order) return null
        return (
          <div onClick={() => setShowPaymentProof(null)} style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#111', borderRadius: 20, padding: 20, maxWidth: 360, width: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Payment — {order.id}</span>
                <button onClick={() => setShowPaymentProof(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#EF4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {order.paymentMethod === 'bank' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <img src={PAYMENT_ICONS.bank} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', display: 'block' }}>Bank Transfer</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{order.customer}</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginLeft: 'auto' }}>{fmtRp(order.total)}</span>
                  </div>
                  {order.paymentProof ? (
                    <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <img src={order.paymentProof} alt="Payment proof" style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'contain', background: '#000' }} />
                    </div>
                  ) : (
                    <div style={{ padding: 30, textAlign: 'center', borderRadius: 14, background: 'rgba(255,255,255,0.03)', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No screenshot uploaded</span>
                    </div>
                  )}
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', textAlign: 'center' }}>Verify the amount and sender name match before accepting</span>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <img src={PAYMENT_ICONS.cod} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15', display: 'block' }}>Cash on Delivery</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{order.customer}</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginLeft: 'auto' }}>{fmtRp(order.total)}</span>
                  </div>
                  <div style={{ padding: 20, textAlign: 'center', borderRadius: 14, background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.15)' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#FACC15', display: 'block', marginBottom: 4 }}>Collect {fmtRp(order.total)} from driver</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Driver will pay you cash on pickup</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1e', borderRadius: 20, padding: 24, maxWidth: 300, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>🗑️</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>Delete this item?</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 16 }}>This action cannot be undone.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deleteItem(deleteConfirm)} style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#EF4444', border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Side Menu Overlay ── */}
      {sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.5)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 260, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.08)', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 16px 20px', animation: 'slideInRight 0.25s ease' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 4 }}>{restaurant?.name ?? 'My Restaurant'}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 20 }}>{restaurant?.cuisine_type ?? ''} · {restaurant?.city ?? ''}</span>
            {NAV_ITEMS.map(nav => (
              <button key={nav.id} onClick={() => { setPage(nav.id); setSideOpen(false) }} style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4,
                background: page === nav.id ? 'rgba(141,198,63,0.1)' : 'none',
                color: page === nav.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
                fontSize: 14, fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>{nav.icon}</span> {nav.label}
              </button>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 12, paddingTop: 12 }}>
              <button onClick={onClose} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>✕ Close Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}

// ── Deals & Promotions page ─────────────────────────────────────────────────
const DEALS_STORAGE = 'indoo_vendor_deals'
const DISCOUNT_OPTIONS = [10, 15, 20, 25, 30, 40, 50]
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function loadDeals() {
  try { return JSON.parse(localStorage.getItem(DEALS_STORAGE)) ?? [] } catch { return [] }
}
function saveDeals(deals) {
  try { localStorage.setItem(DEALS_STORAGE, JSON.stringify(deals)) } catch {}
}

function DealsPage({ menuItems, onBack }) {
  const [deals, setDeals] = useState(() => loadDeals())
  const [showCreate, setShowCreate] = useState(false)
  const [previewDeal, setPreviewDeal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ── Create deal state ──
  const [selectedItems, setSelectedItems] = useState([])
  const [discount, setDiscount] = useState(20)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [quantity, setQuantity] = useState(50)
  const [days, setDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  const [dealTitle, setDealTitle] = useState('')

  const resetForm = () => {
    setSelectedItems([]); setDiscount(20); setStartDate(''); setEndDate('')
    setQuantity(50); setDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']); setDealTitle('')
  }

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id)
      return exists ? prev.filter(i => i.id !== item.id) : [...prev, item]
    })
  }

  const toggleDay = (day) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const autoTitle = selectedItems.length > 0
    ? `${discount}% Off ${selectedItems.map(i => i.name).join(', ').slice(0, 60)}`
    : ''

  const canSave = selectedItems.length > 0 && startDate && endDate && days.length > 0 && quantity > 0

  const createDeal = () => {
    const deal = {
      id: 'deal-' + Date.now(),
      items: selectedItems.map(i => ({ name: i.name, price: i.price, photo_url: i.photo_url ?? '' })),
      discountPercent: discount,
      startDate,
      endDate,
      days,
      quantity: Number(quantity),
      claimed: 0,
      title: dealTitle.trim() || autoTitle,
      active: true,
      createdAt: new Date().toISOString(),
    }
    const updated = [deal, ...deals]
    setDeals(updated)
    saveDeals(updated)
    setShowCreate(false)
    resetForm()
  }

  const toggleDealActive = (id) => {
    const updated = deals.map(d => d.id === id ? { ...d, active: !d.active } : d)
    setDeals(updated)
    saveDeals(updated)
  }

  const deleteDeal = (id) => {
    const updated = deals.filter(d => d.id !== id)
    setDeals(updated)
    saveDeals(updated)
    setDeleteConfirm(null)
  }

  const isDealRunning = (deal) => {
    if (!deal.active) return false
    const today = new Date().toISOString().split('T')[0]
    return today >= deal.startDate && today <= deal.endDate
  }

  const daysRemaining = (deal) => {
    const end = new Date(deal.endDate)
    const now = new Date()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  // ── Styles ──
  const cardStyle = {
    padding: 16, borderRadius: 16, marginBottom: 12,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  }
  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Deals & Promotions</h2>
        <HelpIcon section="deals" />
      </div>

      {/* ── Create Deal Button ── */}
      {!showCreate && (
        <button onClick={() => setShowCreate(true)} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: '2px dashed rgba(141,198,63,0.3)',
          background: 'rgba(141,198,63,0.06)', color: '#8DC63F', fontSize: 14, fontWeight: 900,
          cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>+</span> Create New Deal
        </button>
      )}

      {/* ══════════ CREATE DEAL FORM ══════════ */}
      {showCreate && (
        <div style={{ ...cardStyle, border: '1px solid rgba(141,198,63,0.2)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>New Deal</span>
            <button onClick={() => { setShowCreate(false); resetForm() }} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
          </div>

          {/* Select menu items */}
          <span style={labelStyle}>Select Menu Items</span>
          <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            {menuItems.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No menu items — add items in the Menu page first</div>
            )}
            {menuItems.map(item => {
              const selected = selectedItems.find(i => i.id === item.id)
              return (
                <div key={item.id} onClick={() => toggleItemSelection(item)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                  background: selected ? 'rgba(141,198,63,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, border: selected ? '2px solid #8DC63F' : '2px solid rgba(255,255,255,0.15)',
                    background: selected ? '#8DC63F' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  {item.photo_url && <img src={item.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtRp(item.price)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Discount */}
          <span style={labelStyle}>Discount Percentage</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {DISCOUNT_OPTIONS.map(d => (
              <button key={d} onClick={() => setDiscount(d)} style={{
                padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800,
                background: discount === d ? '#FACC15' : 'rgba(255,255,255,0.06)',
                color: discount === d ? '#000' : 'rgba(255,255,255,0.5)',
              }}>{d}%</button>
            ))}
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>Start Date</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>End Date</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Quantity per day */}
          <span style={labelStyle}>Quantity Per Day</span>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" placeholder="50" style={{ ...inputStyle, marginBottom: 14 }} />

          {/* Days of week */}
          <span style={labelStyle}>Available Days</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {DAYS_OF_WEEK.map(day => (
              <button key={day} onClick={() => toggleDay(day)} style={{
                padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                background: days.includes(day) ? 'rgba(141,198,63,0.2)' : 'rgba(255,255,255,0.04)',
                color: days.includes(day) ? '#8DC63F' : 'rgba(255,255,255,0.3)',
              }}>{day}</button>
            ))}
          </div>

          {/* Deal title */}
          <span style={labelStyle}>Deal Title</span>
          <input type="text" value={dealTitle} onChange={e => setDealTitle(e.target.value)} placeholder={autoTitle || 'Deal title...'} style={{ ...inputStyle, marginBottom: 16 }} />

          {/* Preview mini */}
          {selectedItems.length > 0 && (
            <>
              <span style={labelStyle}>Card Preview</span>
              <DealCardPreview deal={{
                items: selectedItems.map(i => ({ name: i.name, price: i.price, photo_url: i.photo_url ?? '' })),
                discountPercent: discount,
                title: dealTitle.trim() || autoTitle,
                days,
                startDate,
                endDate,
                quantity: Number(quantity),
                claimed: 0,
                active: true,
              }} />
            </>
          )}

          {/* Save button */}
          <button onClick={createDeal} disabled={!canSave} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none', marginTop: 8,
            background: canSave ? '#8DC63F' : 'rgba(141,198,63,0.2)', color: canSave ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: 14, fontWeight: 900, cursor: canSave ? 'pointer' : 'not-allowed',
          }}>Create Deal</button>
        </div>
      )}

      {/* ══════════ ACTIVE DEALS LIST ══════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Your Deals</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6 }}>{deals.length}</span>
      </div>

      {deals.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>🏷️</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>No deals yet — create your first promotion above</span>
        </div>
      )}

      {deals.map(deal => {
        const running = isDealRunning(deal)
        const remaining = daysRemaining(deal)
        return (
          <div key={deal.id} style={{ ...cardStyle, border: running ? '1px solid rgba(141,198,63,0.15)' : '1px solid rgba(255,255,255,0.06)' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.title}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{deal.items.map(i => i.name).join(', ')}</span>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 900, flexShrink: 0,
                background: '#FACC15', color: '#000',
              }}>{deal.discountPercent}% OFF</span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 6 }}>
                Qty: {deal.claimed ?? 0}/{deal.quantity}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 6 }}>
                {deal.days.join(', ')}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: remaining <= 2 ? '#EF4444' : 'rgba(255,255,255,0.4)', background: remaining <= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 6 }}>
                {remaining > 0 ? `${remaining}d left` : 'Expired'}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: running ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.04)', color: running ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>
                {running ? 'Running' : deal.active ? 'Scheduled' : 'Inactive'}
              </span>
            </div>

            {/* Date range */}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
              {deal.startDate} to {deal.endDate}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleDealActive(deal.id)} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                background: deal.active ? 'rgba(141,198,63,0.08)' : 'rgba(255,255,255,0.03)',
                color: deal.active ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}>{deal.active ? 'Deactivate' : 'Activate'}</button>
              <button onClick={() => setPreviewDeal(deal)} style={{
                padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}>Preview</button>
              <button onClick={() => setDeleteConfirm(deal.id)} style={{
                padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.15)',
                background: 'rgba(239,68,68,0.06)', color: '#EF4444', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}>Delete</button>
            </div>
          </div>
        )
      })}

      {/* ── Delete Deal Confirmation ── */}
      {deleteConfirm && createPortal(
        <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1e', borderRadius: 20, padding: 24, maxWidth: 300, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>🗑️</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>Delete this deal?</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 16 }}>This action cannot be undone.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deleteDeal(deleteConfirm)} style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#EF4444', border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Deal Preview Modal ── */}
      {previewDeal && createPortal(
        <div onClick={() => setPreviewDeal(null)} style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1e', borderRadius: 20, padding: 24, maxWidth: 360, width: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 14, textAlign: 'center' }}>Customer View Preview</span>
            <DealCardPreview deal={previewDeal} />
            <button onClick={() => setPreviewDeal(null)} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 14,
            }}>Close</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function DealCardPreview({ deal }) {
  const firstItem = deal.items[0]
  const originalPrice = deal.items.reduce((sum, i) => sum + (i.price ?? 0), 0)
  const discountedPrice = Math.round(originalPrice * (1 - deal.discountPercent / 100))

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden', marginBottom: 8,
      background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
    }}>
      {/* Photo strip */}
      <div style={{ display: 'flex', height: 100, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
        {deal.items.slice(0, 3).map((item, i) => (
          item.photo_url ? (
            <img key={i} src={item.photo_url} alt="" style={{ flex: 1, height: '100%', objectFit: 'cover', borderRight: i < 2 ? '1px solid rgba(0,0,0,0.3)' : 'none' }} />
          ) : (
            <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', fontSize: 28 }}>🍽️</div>
          )
        ))}
      </div>

      {/* Discount badge */}
      <div style={{
        position: 'absolute', top: 8, right: 8, padding: '5px 10px', borderRadius: 8,
        background: '#FACC15', color: '#000', fontSize: 13, fontWeight: 900,
        boxShadow: '0 2px 8px rgba(250,204,21,0.3)',
      }}>{deal.discountPercent}% OFF</div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(discountedPrice)}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(originalPrice)}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', padding: '3px 6px', borderRadius: 4 }}>
            {deal.days.length === 7 ? 'Every day' : deal.days.join(', ')}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', padding: '3px 6px', borderRadius: 4 }}>
            {deal.quantity - (deal.claimed ?? 0)} left/day
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Banner Ads page ─────────────────────────────────────────────────────────
// ── Extras & Add-ons management page ────────────────────────────────────────
function ExtrasPage({ restaurantId }) {
  const [extras, setExtras] = useState(() => loadVendorExtras())
  const [activeCategory, setActiveCategory] = useState('sauces')
  const [editItem, setEditItem] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editLargePrice, setEditLargePrice] = useState('')
  const [editHasSize, setEditHasSize] = useState(false)
  const [bundleDiscount, setBundleDiscount] = useState(() => extras.bundleDiscount ?? 0)
  const [toast, setToast] = useState(null)
  const [sauceLibrary, setSauceLibrary] = useState([])
  const [sidesLibrary, setSidesLibrary] = useState([])
  const [drinksLibrary, setDrinksLibrary] = useState([])
  const [showLibraryPicker, setShowLibraryPicker] = useState(null) // 'sauces' | 'sides' | 'drinks' | null

  useEffect(() => { getSauceLibrary().then(setSauceLibrary); getSidesLibrary().then(setSidesLibrary); getDrinksLibrary().then(setDrinksLibrary) }, [])

  const categoryItems = extras[activeCategory] ?? []

  const saveItem = () => {
    if (!editName.trim() || !editPrice) return
    const updated = { ...extras }
    if (!updated[activeCategory]) updated[activeCategory] = []
    const item = {
      name: editName.trim(),
      price: Number(editPrice),
      largePrice: editHasSize && editLargePrice ? Number(editLargePrice) : null,
      hasSize: editHasSize,
    }
    if (editItem.index === -1) {
      updated[activeCategory].push(item)
    } else {
      updated[activeCategory][editItem.index] = item
    }
    setExtras(updated)
    saveVendorExtras(updated)
    if (restaurantId) saveExtrasToDb(restaurantId, activeCategory, updated[activeCategory] ?? [])
    setEditItem(null)
    setEditName(''); setEditPrice(''); setEditLargePrice(''); setEditHasSize(false)
    setToast('Saved')
    setTimeout(() => setToast(null), 2000)
  }

  const deleteItem = (idx) => {
    const updated = { ...extras }
    updated[activeCategory] = (updated[activeCategory] ?? []).filter((_, i) => i !== idx)
    setExtras(updated)
    saveVendorExtras(updated)
    if (restaurantId) saveExtrasToDb(restaurantId, activeCategory, updated[activeCategory] ?? [])
  }

  const saveBundleDiscount = (val) => {
    setBundleDiscount(val)
    const updated = { ...extras, bundleDiscount: val }
    setExtras(updated)
    saveVendorExtras(updated)
    if (restaurantId) saveBundleToDb(restaurantId, val)
  }

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  // Edit form
  if (editItem) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setEditItem(null)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{editItem.index === -1 ? 'Add' : 'Edit'} {EXTRA_CATEGORIES.find(c => c.id === activeCategory)?.label} Item</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Item Name</span>
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Extra Sambal" style={inputStyle} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Price (Regular)</span>
            <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="3000" style={inputStyle} />
          </div>

          {/* Size toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Offer size options (Regular / Large)</span>
            <button onClick={() => setEditHasSize(!editHasSize)} style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: editHasSize ? '#8DC63F' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: editHasSize ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
          </div>

          {editHasSize && (
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Large Price</span>
              <input type="number" value={editLargePrice} onChange={e => setEditLargePrice(e.target.value)} placeholder="5000" style={inputStyle} />
            </div>
          )}

          <button onClick={saveItem} disabled={!editName.trim() || !editPrice} style={{
            width: '100%', padding: 14, borderRadius: 14, background: editName.trim() && editPrice ? '#8DC63F' : 'rgba(255,255,255,0.06)',
            border: 'none', color: editName.trim() && editPrice ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: 14, fontWeight: 900, cursor: editName.trim() && editPrice ? 'pointer' : 'default',
          }}>Save Item</button>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>🍟 Extras & Add-ons</h2>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>Upload your sauces, drinks, and sides. Customers add them when ordering any dish.</p>

      {/* Bundle discount */}
      <div style={{ padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>💰 Bundle Discount</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>{bundleDiscount}% off</span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>Discount applied to extras when ordered with a main dish</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 5, 10, 15, 20].map(v => (
            <button key={v} onClick={() => saveBundleDiscount(v)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 8,
              background: bundleDiscount === v ? '#FACC15' : 'rgba(255,255,255,0.06)',
              border: bundleDiscount === v ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: bundleDiscount === v ? '#000' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}>{v}%</button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {EXTRA_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10,
            background: activeCategory === c.id ? '#8DC63F' : 'rgba(255,255,255,0.06)',
            border: activeCategory === c.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: activeCategory === c.id ? '#000' : 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 800, cursor: 'pointer',
          }}>{c.icon} {c.label}</button>
        ))}
      </div>

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {categoryItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No {EXTRA_CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase()} added yet</div>
        )}
        {categoryItems.map((item, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
                {item.hasSize && item.largePrice && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>· Large {fmtRp(item.largePrice)}</span>
                )}
              </div>
            </div>
            <button onClick={() => { setEditItem({ category: activeCategory, index: i }); setEditName(item.name); setEditPrice(String(item.price)); setEditLargePrice(item.largePrice ? String(item.largePrice) : ''); setEditHasSize(item.hasSize ?? false) }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
            <button onClick={() => deleteItem(i)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button onClick={() => {
        setShowLibraryPicker(activeCategory)
      }} style={{
        width: '100%', padding: 14, borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000',
        fontSize: 14, fontWeight: 900, cursor: 'pointer',
      }}>
        + Add {EXTRA_CATEGORIES.find(c => c.id === activeCategory)?.label} Item
      </button>

      {/* Library Picker — sauces or sides */}
      {showLibraryPicker && (() => {
        const lib = showLibraryPicker === 'sauces' ? sauceLibrary : showLibraryPicker === 'drinks' ? drinksLibrary : sidesLibrary
        const key = showLibraryPicker
        const label = showLibraryPicker === 'sauces' ? 'Sauces' : showLibraryPicker === 'drinks' ? 'Drinks' : 'Sides'
        const enabledIds = (extras[key] ?? []).map(s => s.id)
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10003, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowLibraryPicker(null)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Select {label}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {lib.map(group => (
                <div key={group.category} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{group.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{group.category}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.items.map(item => {
                      const enabled = enabledIds.includes(item.id)
                      const existing = (extras[key] ?? []).find(s => s.id === item.id)
                      return (
                        <button key={item.id} onClick={() => {
                          const updated = { ...extras }
                          if (!updated[key]) updated[key] = []
                          if (enabled) { updated[key] = updated[key].filter(s => s.id !== item.id) }
                          else { updated[key].push({ id: item.id, name: item.name, price: item.defaultPrice, largePrice: item.defaultLarge ?? null, hasSize: !!item.defaultLarge }) }
                          setExtras(updated)
                          saveVendorExtras(updated)
                          if (restaurantId) saveExtrasToDb(restaurantId, key, updated[key] ?? [])
                        }} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
                          background: enabled ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${enabled ? '#8DC63F' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'left',
                        }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: enabled ? '#8DC63F' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {enabled && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: enabled ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1 }}>{item.name}</span>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#FACC15', display: 'block' }}>{fmtRp(existing?.price ?? item.defaultPrice)}</span>
                            {item.defaultLarge && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>L: {fmtRp(item.defaultLarge)}</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <button onClick={() => setShowLibraryPicker(null)} style={{ width: '100%', padding: 14, borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                Done — {(extras[key] ?? []).length} {label.toLowerCase()} selected
              </button>
            </div>
          </div>
        )
      })()}

      {toast && <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 12, background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 800, zIndex: 10000 }}>✓ {toast}</div>}
    </>
  )
}

function BannerAdsPage({ restaurant }) {
  const [step, setStep] = useState('library') // library | promo | payment | submitted
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [promoText, setPromoText] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [copyMsg, setCopyMsg] = useState(false)
  const [myBanners, setMyBanners] = useState(() => loadVendorBanners())
  const proofRef = useRef(null)

  const template = BANNER_TEMPLATES.find(t => t.id === selectedTemplate)

  const handleSubmit = () => {
    if (!template || !proofPreview) return
    const banner = {
      id: `BAN-${Date.now().toString(36).toUpperCase()}`,
      restaurant_id: restaurant?.id ?? 'demo',
      restaurant_name: restaurant?.name ?? 'My Restaurant',
      template_id: template.id,
      template_img: template.img,
      template_label: template.label,
      promo_text: promoText.trim() || `${restaurant?.name ?? 'Restaurant'} — Order Now!`,
      price: BANNER_PRICE,
      proof_url: proofPreview,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    }
    saveVendorBanner(banner)
    setMyBanners(loadVendorBanners())
    setStep('submitted')
  }

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const cardStyle = { padding: 14, borderRadius: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        {step !== 'library' && step !== 'submitted' && (
          <button onClick={() => setStep(step === 'payment' ? 'promo' : step === 'promo' ? 'library' : 'library')} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
        )}
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>📢 Banner Ads</h2>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>
        {step === 'library' ? 'Select a banner style — displayed on the food browse page for 24 hours' : step === 'promo' ? 'Add your promo text' : step === 'payment' ? 'Complete payment' : 'Done!'}
      </p>

      {/* ── LIBRARY ── */}
      {step === 'library' && (
        <>
          {/* Price card */}
          <div style={{ ...cardStyle, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>💎</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', display: 'block' }}>{fmtRp(BANNER_PRICE)} / 24 hours</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Your banner on the food browse page, rotating every 4 seconds</span>
            </div>
          </div>

          {/* Template grid */}
          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>Select Banner Style</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {BANNER_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setSelectedTemplate(t.id)} style={{
                borderRadius: 16, overflow: 'hidden', position: 'relative', height: 120,
                border: selectedTemplate === t.id ? `2.5px solid ${t.color}` : '1.5px solid rgba(255,255,255,0.08)',
                padding: 0, cursor: 'pointer', background: 'none',
                boxShadow: selectedTemplate === t.id ? `0 0 16px ${t.color}33` : 'none',
              }}>
                <img src={t.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }} />
                {selectedTemplate === t.id && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{t.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* My banners history */}
          {myBanners.length > 0 && (
            <>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>My Banner History</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myBanners.map(b => (
                  <div key={b.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={b.template_img} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>{b.template_label}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                      background: b.status === 'active' ? 'rgba(141,198,63,0.15)' : b.status === 'pending' ? 'rgba(250,204,21,0.15)' : 'rgba(239,68,68,0.15)',
                      color: b.status === 'active' ? '#8DC63F' : b.status === 'pending' ? '#FACC15' : '#EF4444',
                    }}>{b.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Next button */}
          <button onClick={() => { if (selectedTemplate) setStep('promo') }} disabled={!selectedTemplate} style={{
            width: '100%', padding: 14, borderRadius: 14, marginTop: 16,
            background: selectedTemplate ? '#8DC63F' : 'rgba(255,255,255,0.06)',
            border: 'none', color: selectedTemplate ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: 14, fontWeight: 900, cursor: selectedTemplate ? 'pointer' : 'default',
          }}>Next — Add Promo Text</button>
        </>
      )}

      {/* ── PROMO TEXT ── */}
      {step === 'promo' && template && (
        <>
          {/* Preview */}
          <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 160, marginBottom: 16, border: `1.5px solid ${template.color}44` }}>
            <img src={template.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{restaurant?.name ?? 'Your Restaurant'}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: template.color }}>{promoText || 'Your promo text here'}</span>
            </div>
          </div>

          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Promo Text</span>
          <input value={promoText} onChange={e => setPromoText(e.target.value)} placeholder="e.g. 20% OFF Today Only!" maxLength={40} style={{ ...inputStyle, marginBottom: 4 }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{promoText.length}/40</span>

          <button onClick={() => setStep('payment')} style={{ width: '100%', padding: 14, borderRadius: 14, marginTop: 16, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Next — Payment</button>
        </>
      )}

      {/* ── PAYMENT ── */}
      {step === 'payment' && template && (
        <>
          <div style={{ ...cardStyle, marginBottom: 16, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block' }}>Amount</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 4 }}>{fmtRp(BANNER_PRICE)}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4 }}>24 hours · {template.label} · {restaurant?.name ?? 'Restaurant'}</span>
          </div>

          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>Transfer to</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'block' }}>{BANNER_BANK.bank}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', letterSpacing: '0.04em', display: 'block', marginTop: 4 }}>{BANNER_BANK.number}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{BANNER_BANK.holder}</span>
              <button onClick={() => { navigator.clipboard?.writeText(BANNER_BANK.number); setCopyMsg(true); setTimeout(() => setCopyMsg(false), 2000) }} style={{ padding: '4px 10px', borderRadius: 6, background: copyMsg ? 'rgba(141,198,63,0.2)' : '#8DC63F', border: 'none', color: copyMsg ? '#8DC63F' : '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{copyMsg ? '✓ Copied' : 'Copy'}</button>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>Upload Payment Screenshot</span>
            <button onClick={() => proofRef.current?.click()} style={{ width: '100%', height: 130, borderRadius: 14, border: '1.5px dashed rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {proofPreview ? <img src={proofPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>📱</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Tap to upload screenshot</span>
                </div>
              )}
            </button>
            <input ref={proofRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setProofFile(f); setProofPreview(URL.createObjectURL(f)) } }} style={{ display: 'none' }} />
          </div>

          <button onClick={handleSubmit} disabled={!proofPreview} style={{
            width: '100%', padding: 14, borderRadius: 14,
            background: proofPreview ? '#8DC63F' : 'rgba(255,255,255,0.06)',
            border: 'none', color: proofPreview ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: 14, fontWeight: 900, cursor: proofPreview ? 'pointer' : 'default',
          }}>Submit & Pay</button>
        </>
      )}

      {/* ── SUBMITTED ── */}
      {step === 'submitted' && (
        <div style={{ ...cardStyle, textAlign: 'center', marginTop: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(141,198,63,0.1)', border: '2px solid rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>Banner Submitted!</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>INDOO team will verify payment and activate your banner.</span>
          <span style={{ fontSize: 12, color: '#8DC63F', fontWeight: 700, display: 'block', marginBottom: 16 }}>Activation: Same day during business hours</span>
          <button onClick={() => { setStep('library'); setSelectedTemplate(null); setPromoText(''); setProofPreview(null); setProofFile(null) }} style={{ padding: '12px 32px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Done</button>
        </div>
      )}
    </>
  )
}

// ── Events & Venue management page ──────────────────────────────────────────
function EventsPage() {
  const [events, setEvents] = useState(() => loadVendorEvents())
  const [editing, setEditing] = useState(null) // event type id or null

  const save = (id, data) => {
    const updated = { ...events, [id]: data }
    setEvents(updated)
    saveVendorEvents(updated)
  }

  const toggle = (id) => {
    const current = events[id] ?? {}
    save(id, { ...current, enabled: !current.enabled })
  }

  const removeImage = (eventId, imgIdx) => {
    const current = events[eventId] ?? {}
    const images = [...(current.images ?? [])]
    images.splice(imgIdx, 1)
    save(eventId, { ...current, images })
  }

  const handleImageUpload = (eventId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Demo: use object URL (in production this uploads to ImageKit)
    const url = URL.createObjectURL(file)
    const current = events[eventId] ?? {}
    const images = [...(current.images ?? [])]
    if (images.length >= 4) return
    images.push(url)
    save(eventId, { ...current, images })
  }

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  // Edit page for a specific event type
  if (editing) {
    const type = EVENT_TYPES.find(t => t.id === editing)
    const data = events[editing] ?? {}
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setEditing(null)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>{type?.icon} {type?.label}</h2>
        </div>

        {/* Images — up to 4 */}
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Photos (up to 4)</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(data.images ?? []).map((img, i) => (
            <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => removeImage(editing, i)} style={{
                position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          ))}
          {(data.images ?? []).length < 4 && (
            <label style={{
              width: 72, height: 72, borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', fontSize: 24,
            }}>
              +
              <input type="file" accept="image/*" onChange={e => handleImageUpload(editing, e)} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {/* Description */}
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Description</span>
        <textarea
          value={data.description ?? ''}
          onChange={e => { if (e.target.value.length <= 500) save(editing, { ...data, description: e.target.value }) }}
          placeholder={type?.placeholder}
          style={{ ...inputStyle, height: 120, resize: 'none', lineHeight: 1.5, marginBottom: 4 }}
        />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 14 }}>{(data.description ?? '').length}/500</span>

        {/* Price range */}
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Price range (per person)</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>From</span>
            <input
              type="number"
              value={data.priceFrom ?? ''}
              onChange={e => save(editing, { ...data, priceFrom: Number(e.target.value) || '' })}
              placeholder="30000"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>To</span>
            <input
              type="number"
              value={data.priceTo ?? ''}
              onChange={e => save(editing, { ...data, priceTo: Number(e.target.value) || '' })}
              placeholder="70000"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Min pax */}
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Minimum group size</span>
        <input
          type="number"
          value={data.minPax ?? ''}
          onChange={e => save(editing, { ...data, minPax: Number(e.target.value) || '' })}
          placeholder="10"
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        {/* What's included */}
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>What's included (short)</span>
        <input
          value={data.includes ?? ''}
          onChange={e => save(editing, { ...data, includes: e.target.value })}
          placeholder="e.g. Main dish + drink + dessert"
          maxLength={80}
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        <button onClick={() => setEditing(null)} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
        }}>
          Save & Back
        </button>
      </>
    )
  }

  // Main events list
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>🎉 Events & Venue</h2>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', lineHeight: 1.4 }}>
        Enable the services you offer. Upload photos and details — customers see these on your restaurant page.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EVENT_TYPES.map(type => {
          const data = events[type.id] ?? {}
          const enabled = !!data.enabled
          const hasContent = !!(data.description || (data.images ?? []).length > 0)
          return (
            <div key={type.id} style={{
              padding: 14, borderRadius: 16,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
              border: `1px solid ${enabled ? 'rgba(141,198,63,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{type.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: enabled ? '#fff' : 'rgba(255,255,255,0.5)', display: 'block' }}>{type.label}</span>
                  {enabled && hasContent && (
                    <span style={{ fontSize: 11, color: '#8DC63F', fontWeight: 700 }}>
                      {(data.images ?? []).length} photos · {(data.description ?? '').length > 0 ? 'description added' : 'no description'}
                    </span>
                  )}
                  {enabled && !hasContent && (
                    <span style={{ fontSize: 11, color: '#FACC15', fontWeight: 700 }}>Enabled — tap Edit to add details</span>
                  )}
                </div>

                {/* Toggle */}
                <button onClick={() => toggle(type.id)} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: enabled ? '#8DC63F' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: enabled ? 22 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </button>

                {/* Edit button */}
                {enabled && (
                  <button onClick={() => setEditing(type.id)} style={{
                    padding: '6px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#8DC63F', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  }}>Edit</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Add/Edit Item — full page style ──────────────────────────────────────────
function ItemModal({ item, onSave, onClose }) {
  const isNew = !item?.id
  const [name, setName] = useState(item?.name ?? '')
  const [originalPrice, setOriginalPrice] = useState(item?.original_price?.toString() ?? '')
  const [price, setPrice] = useState(item?.price?.toString() ?? '')
  const [category, setCategory] = useState(item?.category ?? 'Main')
  const [description, setDescription] = useState(item?.description ?? '')
  const [photoUrl, setPhotoUrl] = useState(item?.photo_url ?? null)
  const [prepTime, setPrepTime] = useState(item?.prep_time_min?.toString() ?? '10')

  const discountPct = originalPrice && Number(originalPrice) > Number(price)
    ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
    : 0

  const handleSave = () => {
    if (!name.trim() || !price) return
    onSave({
      ...item,
      id: item?.id ?? Date.now(),
      name: name.trim(),
      original_price: originalPrice ? Number(originalPrice) : null,
      price: Number(price),
      category,
      description: description.trim(),
      photo_url: photoUrl,
      prep_time_min: Number(prepTime) || 10,
      is_available: item?.is_available ?? true,
    })
  }

  const inputStyle = { width: '100%', padding: '14px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 16, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10002,
      backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png?updatedAt=1776728649363)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#000',
      display: 'flex', flexDirection: 'column', isolation: 'isolate',
    }}>
      {/* Glass overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#EF4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', flex: 1 }}>{isNew ? 'Add Menu Item' : 'Edit Menu Item'}</span>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px', position: 'relative', zIndex: 1 }}>

        <label style={labelStyle}>Item Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nasi Goreng Spesial" style={inputStyle} />

        <label style={labelStyle}>Original Price / Harga Asli (Rp) — optional</label>
        <input value={originalPrice} onChange={e => setOriginalPrice(e.target.value.replace(/\D/g, ''))} placeholder="30000" inputMode="numeric" style={inputStyle} />

        <label style={labelStyle}>Selling Price / Harga Jual (Rp)</label>
        <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="25000" inputMode="numeric" style={inputStyle} />

        {discountPct > 0 && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 900 }}>{discountPct}% OFF</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>Rp {Number(originalPrice).toLocaleString('id-ID')}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F' }}>Rp {Number(price).toLocaleString('id-ID')}</span>
          </div>
        )}

        <label style={labelStyle}>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
          {MENU_CATS.filter(c => c !== 'All').map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label style={labelStyle}>Prep Time (minutes)</label>
        <input value={prepTime} onChange={e => setPrepTime(e.target.value.replace(/\D/g, ''))} placeholder="10" inputMode="numeric" style={inputStyle} />

        <label style={labelStyle}>Description (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your dish — ingredients, flavour, portion size..." rows={4} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5 }} />

        <label style={labelStyle}>Photo URL (optional)</label>
        <input value={photoUrl ?? ''} onChange={e => setPhotoUrl(e.target.value || null)} placeholder="https://..." style={inputStyle} />

        {photoUrl && (
          <div style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', height: 140 }}>
            <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={!name.trim() || !price} style={{ flex: 2, padding: '16px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', opacity: name.trim() && price ? 1 : 0.4 }}>{isNew ? 'Add Item' : 'Save Changes'}</button>
      </div>
    </div>,
    document.body
  )
}
