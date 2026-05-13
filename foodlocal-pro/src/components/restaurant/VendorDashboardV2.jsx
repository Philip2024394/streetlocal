/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VendorDashboardV2 — Ultimate Food Vendor Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 * Stripe + Shopify inspired. 6 pages. Live/Offline toggles. Help icons.
 * Full CRUD menu management. Orders feed. Analytics. Payouts.
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import imgError from '../../imgFallback'
import { PAYMENT_ICONS } from '@/constants/paymentIcons'
import { saveVendorExtras as saveExtrasToDb, saveBundleDiscount as saveBundleToDb, saveMenuItem as saveMenuItemToDb, deleteMenuItem as deleteMenuItemFromDb } from '@/services/vendorExtrasService'
import { supabase } from '@/lib/supabase'
import { SUPPORTED_GATEWAYS as RAW_GATEWAYS } from '@shared/constants/paymentGateways'
import { startFoodproCheckout, pollSubscriptionLive, FOODPRO_TIERS } from '@/services/foodproSubscriptionService'
import DesignStudio from './DesignStudio'
import HoursHolidays from './HoursHolidays'
import DeliverySettings from './DeliverySettings'
import ModifierGroups from './ModifierGroups'
import OrderBoard from './OrderBoard'
import RefundsConsole from './RefundsConsole'
import PayoutsPage from './PayoutsPage'
import CouponsPage from './CouponsPage'
import ReviewsPage from './ReviewsPage'
import AnalyticsPage from './AnalyticsPage'
import SettingsPage from './SettingsPage'
import LocationsPage from './LocationsPage'
import StaffPage from './StaffPage'
import NotificationsCenter from './NotificationsCenter'
import POSIntegrations from './POSIntegrations'
import ChannelSettings from '@shared/channels/ChannelSettings.jsx'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')
const LOCAL_KEY = 'indoo_vendor_restaurant'

// FoodLocal Pro brand red palette. Green (#DC2626) is reserved for the
// "Live / Open" semantic across the dashboard, so brand identity rides on
// red instead. Danger red (#EF4444) is still used for destructive actions.
const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redDeep:   '#991B1B',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
  redFaint:  'rgba(220,38,38,0.08)',
}

// ── Payment gateway wiring (copied from food-basic; kept self-contained
// so FoodLocal Pro and FoodLocal basic stay independent codebases) ────────
// IDs of gateways whose Edge Functions are deployed end-to-end. Anything
// not listed renders as "Coming Soon" in the gateway picker.
const LIVE_GATEWAY_IDS = new Set([
  'midtrans', 'stripe', 'xendit', 'paypal', 'razorpay', 'braintree',
  'mollie', 'hitpay', 'adyen', 'rapyd', 'checkout-com', 'fomo-pay',
  'authorize-net', '2checkout', 'cybersource', 'worldpay',
  'ewallet', 'bank',
])
// Map each gateway's UI field names to vendor_payment_connections columns
// (server_key | client_key | webhook_secret). Anything not mapped lands
// in additional_config jsonb so unusual fields don't need new columns.
const GATEWAY_FIELD_MAP = {
  midtrans:        { server_key: 'server_key', client_key: 'client_key' },
  stripe:          { secretKey: 'server_key', publishableKey: 'client_key', webhookSecret: 'webhook_secret' },
  xendit:          { secretKey: 'server_key', publicKey: 'client_key', callbackToken: 'webhook_secret' },
  paypal:          { clientId: 'server_key', secret: 'client_key', webhookId: 'webhook_secret' },
  razorpay:        { keyId: 'server_key', keySecret: 'client_key', webhookSecret: 'webhook_secret' },
  braintree:       { publicKey: 'server_key', privateKey: 'client_key' },
  mollie:          { liveApiKey: 'server_key', testApiKey: 'client_key' },
  hitpay:          { apiKey: 'server_key', salt: 'webhook_secret' },
  adyen:           { apiKey: 'server_key', clientKey: 'client_key', hmacKey: 'webhook_secret' },
  rapyd:           { accessKey: 'server_key', secretKey: 'client_key' },
  'checkout-com':  { secretKey: 'server_key', publicKey: 'client_key', webhookSecret: 'webhook_secret' },
  'fomo-pay':      { apiKey: 'server_key', signKey: 'webhook_secret' },
  'authorize-net': { apiLoginId: 'server_key', transactionKey: 'client_key', signatureKey: 'webhook_secret' },
  '2checkout':     { merchantCode: 'server_key', secretKey: 'client_key', secretWord: 'webhook_secret' },
  cybersource:     { merchantId: 'server_key', apiKeyId: 'client_key', sharedSecret: 'webhook_secret' },
  worldpay:        { serviceKey: 'server_key', clientKey: 'client_key', webhookSecret: 'webhook_secret' },
}
// Flatten raw gateway data + flag the not-yet-supported ones as comingSoon.
const SUPPORTED_GATEWAYS = RAW_GATEWAYS.map(g =>
  g.comingSoon || LIVE_GATEWAY_IDS.has(g.id) ? g : { ...g, comingSoon: true }
)

// Persists the vendor's gateway credentials into vendor_payment_connections
// (the same table food-basic uses). Edge Functions read from this row at
// charge time. Keys are NEVER passed to the client beyond this form.
async function saveGatewayConnection(vendorId, gatewayId, config) {
  if (!supabase || !vendorId) return
  const map = GATEWAY_FIELD_MAP[gatewayId] || {}
  const knownCols = new Set(['server_key', 'client_key', 'webhook_secret'])
  const row = {
    vendor_id: vendorId, gateway_id: gatewayId,
    mode: config.mode || 'test', is_active: true,
    server_key: null, client_key: null, webhook_secret: null,
    additional_config: {},
  }
  Object.entries(config).forEach(([k, v]) => {
    if (k === 'mode') return
    const mapped = map[k] || k
    if (knownCols.has(mapped)) row[mapped] = v
    else row.additional_config[k] = v
  })
  await supabase.from('vendor_payment_connections').upsert(row, { onConflict: 'vendor_id,gateway_id' })
}
async function removeGatewayConnection(vendorId, gatewayId) {
  if (!supabase || !vendorId) return
  await supabase.from('vendor_payment_connections').delete().eq('vendor_id', vendorId).eq('gateway_id', gatewayId)
}

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
      'Keep your phone number updated so customers can reach you for delivery.',
    ],
  },
  payments: {
    title: 'Payment Methods',
    steps: [
      'FoodLocal Pro is a flat monthly subscription — there is NO commission on orders. You keep 100% of every payment.',
      'Connect your own payment gateway (Stripe, Midtrans, Xendit, PayPal, and 12 more) so customers can pay by card / e-wallet / QRIS directly at checkout.',
      'You can also accept cash, bank transfer, or QRIS without connecting any gateway — vendor confirms payment manually.',
      'Customer card data flows straight to your gateway — StreetLocal never sees or holds your money.',
      'You manage refunds, disputes, and payouts from your gateway\'s own dashboard.',
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
        width: 22, height: 22, borderRadius: '50%', background: 'rgba(220,38,38,0.15)',
        border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', fontSize: 11, fontWeight: 900,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>?</button>
      {open && createPortal(
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1e', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 20, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>💡</div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 12px', textAlign: 'center' }}>{help.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {help.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', color: '#DC2626', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setOpen(false)} style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 12, background: '#DC2626', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Got it!</button>
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
      background: active ? '#DC2626' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s',
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
function StatCard({ label, value, color = '#DC2626', icon }) {
  return (
    <div style={{
      flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon && (typeof icon === 'string' && icon.startsWith('http') ? <img src={icon} alt="" onError={imgError('generic')} style={{ width: 41, height: 41, objectFit: 'contain' }} /> : <span style={{ fontSize: 18 }}>{icon}</span>)}
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
        <img src={item.photo_url} alt="" onError={imgError('food')} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
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
        background: item.is_available ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.06)',
        color: item.is_available ? '#DC2626' : 'rgba(255,255,255,0.3)',
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

// FoodLocal Pro is a subscription-only product — no commission, no
// prepaid wallet for paying StreetLocal. Vendors keep 100% of orders.
// Replaces the old "Payouts" + "Wallet & Top Up" nav entries (which
// existed for the indoo commission model) with "Payment Methods" —
// where the vendor connects their own gateway, same as food-basic.
const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',          icon: '📊' },
  { id: 'orderboard',  label: 'Live Order Board',  icon: '🟢' },
  { id: 'orders',      label: 'Orders (list)',     icon: '📋' },
  { id: 'menu',        label: 'Menu',              icon: '🍽️' },
  { id: 'channels',    label: 'Order Channels',    icon: '📲' },
  { id: 'modifiers',   label: 'Modifier Groups',   icon: '➕' },
  { id: 'eightysix',   label: '86 List',           icon: '🚫' },
  { id: 'hours',       label: 'Hours & Holidays',  icon: '🕐' },
  { id: 'delivery',    label: 'Delivery Settings', icon: '🛵' },
  { id: 'refunds',     label: 'Refunds',           icon: '↩️' },
  { id: 'payouts',     label: 'Payouts',           icon: '💰' },
  { id: 'subscription',label: 'Subscription',      icon: '🔥' },
  { id: 'payments',    label: 'Payment Methods',   icon: '💳' },
  { id: 'design',      label: 'Design Studio',     icon: '🎨' },
  { id: 'banners',     label: 'Banner Ads',        icon: '📢' },
  { id: 'extras',      label: 'Extras & Add-ons',  icon: '🍟' },
  { id: 'deals',       label: 'Deals & Promotions',icon: '🏷️' },
  { id: 'coupons',     label: 'Coupons & Codes',   icon: '🎟️' },
  { id: 'reviews',     label: 'Reviews',           icon: '⭐' },
  { id: 'events',      label: 'Events & Venue',    icon: '🎉' },
  { id: 'analytics',   label: 'Analytics',         icon: '📈' },
  { id: 'locations',   label: 'Locations',         icon: '🏪' },
  { id: 'staff',       label: 'Staff & Roles',     icon: '👥' },
  { id: 'notifications',label:'Notifications',     icon: '🔔' },
  { id: 'pos',         label: 'POS Integrations',  icon: '🔌' },
  { id: 'settings',    label: 'Profile / Settings',icon: '⚙️' },
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
  { id: 'fire', label: 'Fire Sale', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-24-2026-06_22_44-pm.png', color: '#EF4444' },
  { id: 'juice', label: 'Free Juice', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-25-2026-04_22_55-am.png', color: '#DC2626' },
  { id: 'fries', label: 'Free Fries', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-25-2026-04_22_09-am.png', color: '#FACC15' },
  { id: 'street', label: 'Street Food', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', color: '#F59E0B' },
  { id: 'seafood', label: 'Ocean Fresh', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600', color: '#3B82F6' },
  { id: 'spicy', label: 'Spicy Hot', img: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600', color: '#DC2626' },
]

const BANNER_PRICE = 100000 // Rp 100.000 per 24 hours
const BANNER_STORAGE = 'indoo_vendor_banners'
const BANNER_BANK = { bank: 'BCA', number: '8810 2233 4455', holder: 'PT FoodLocal Pro Indonesia' }

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
  const [subscription, setSubscription] = useState(null) // { url_active, expires_at, subscription_tier }
  const [subActivating, setSubActivating] = useState(false) // true while polling after Midtrans return

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
  }, [])

  // Fetch live subscription state from Supabase whenever the restaurant id
  // is known. The url_active flag is the source of truth for "shop is live".
  useEffect(() => {
    if (!restaurant?.id || !supabase) return
    let cancelled = false
    supabase.from('restaurants')
      .select('id, url_active, expires_at, subscription_tier, subscription_product, subscription_order_id')
      .eq('id', restaurant.id).single()
      .then(({ data }) => { if (!cancelled && data) setSubscription(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [restaurant?.id])

  // Return-from-Midtrans handler: ?subscription=ok&order_id=... arrives
  // after the vendor pays. We jump to the Subscription page, show an
  // "Activating…" state, and poll until the webhook flips url_active.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') !== 'ok') return
    if (!restaurant?.id) return
    setPage('subscription')
    setSubActivating(true)
    pollSubscriptionLive(restaurant.id).then(row => {
      if (row) setSubscription(row)
    }).finally(() => {
      setSubActivating(false)
      // Strip the query params so a refresh doesn't re-trigger the poll.
      const url = new URL(window.location.href)
      url.searchParams.delete('subscription')
      url.searchParams.delete('order_id')
      window.history.replaceState({}, '', url.toString())
    })
  }, [restaurant?.id])

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
    { id: 'ORD-1001', items: [{ name: 'Nasi Gudeg', qty: 2, prepTime: 10 }, { name: 'Es Teh', qty: 2, prepTime: 2 }], total: 66000, customer: 'Agus Prasetyo', phone: '6281234567890', address: 'Jl. Kaliurang Km 5', status: 'confirmed', time: '2 min ago', driverETA: 8, paymentMethod: 'bank', qrCode: 'INDOO-1001-AGS', paymentProof: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-06_43_19-am.png' },
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
      backgroundImage: 'url(https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-06_43_19-am.png)',
      backgroundSize: 'cover', backgroundPosition: 'center top', backgroundColor: '#000',
      isolation: 'isolate',
    }}>
      {/* Glass overlay — same as notifications */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }} />
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes flashGreen { 0%,100% { background: #DC2626; transform: scale(1); } 50% { background: #991B1B; transform: scale(1.02); box-shadow: 0 0 20px rgba(220,38,38,0.5); } }
        @keyframes bellShake { 0%,100% { transform: rotate(0deg); } 15% { transform: rotate(15deg); } 30% { transform: rotate(-15deg); } 45% { transform: rotate(10deg); } 60% { transform: rotate(-10deg); } 75% { transform: rotate(5deg); } }
        @keyframes runLeftLight { 0% { top: -30%; } 100% { top: 100%; } }
      `}</style>

      {/* ── Header — same style as notifications ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        background: 'transparent', position: 'relative', zIndex: 1, flexShrink: 0,
      }}>
        <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsssaaa22ss-removebg-preview.png" alt="" onError={imgError('generic')} style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{restaurant?.name ?? 'My Restaurant'}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block' }}>{restaurant?.city ?? ''}{restaurant?.address ? ` · ${restaurant.address}` : ''}</span>
        </div>
        <button onClick={() => setSideOpen(true)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
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
          <span style={{ fontSize: 22, fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>23</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Orders</span>
        </div>
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: storeOpen ? '#DC2626' : '#EF4444', lineHeight: 1 }}>{storeOpen ? 'Open' : 'Closed'}</span>
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
                <span style={{ fontSize: 11, fontWeight: 900, color: storeOpen ? '#DC2626' : '#EF4444' }}>{storeOpen ? 'OPEN' : 'CLOSED'}</span>
                <StatusToggle active={storeOpen} onChange={toggleStore} size="large" />
                <HelpIcon section="toggle" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard label="Sales" value={fmtRp(847000)} color="#FACC15" icon="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledssscc-removebg-preview.png" />
              <StatCard label="Orders" value="23" color="#DC2626" icon="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsssaaa22-removebg-preview.png" />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {/* Live Items — tappable */}
              <div onClick={() => setPage('live')} style={{
                flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16, cursor: 'pointer', position: 'relative',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(220,38,38,0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>🟢 LIVE ITEMS</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#DC2626' }}>{liveCount}</span>
                <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/detailed-white-fingerprint-on-transparent-background.png" alt="" onError={imgError('generic')} style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, opacity: 0.15, objectFit: 'contain' }} />
              </div>
              {/* Offline Items — tappable */}
              <div onClick={() => setPage('offline')} style={{
                flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16, cursor: 'pointer', position: 'relative',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>⚫ OFFLINE</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{offCount}</span>
                <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/detailed-white-fingerprint-on-transparent-background.png" alt="" onError={imgError('generic')} style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, opacity: 0.15, objectFit: 'contain' }} />
              </div>
            </div>

            <SectionHeader title="Live Orders" helpKey="orders" />
            {orders.filter(o => o.status !== 'completed').length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No active orders right now</div>
            ) : orders.filter(o => o.status !== 'completed').map(o => {
              const statusColor = o.status === 'confirmed' ? '#DC2626' : o.status === 'preparing' ? '#FACC15' : '#60A5FA'
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
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block' }}>{o.customer}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{o.address}</span>
                    </div>
                    <button onClick={() => setShowPaymentProof(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, position: 'relative' }}>
                      <img src={o.paymentMethod === 'bank' ? PAYMENT_ICONS.bank : PAYMENT_ICONS.cod} alt={o.paymentMethod === 'bank' ? 'Bank' : 'COD'} onError={imgError('payment')} style={{ width: 42, height: 42, objectFit: 'contain' }} />
                      {o.paymentMethod === 'bank' && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#DC2626', border: '2px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/></svg></div>}
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
                        <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitlediuooiuoifsdfsdf-removebg-preview.png" alt="" onError={imgError('generic')} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: o.driverETA <= 2 ? '#DC2626' : '#FACC15' }}>
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
                        background: '#DC2626', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
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
              <button onClick={() => setEditItem({})} style={{ padding: '8px 16px', borderRadius: 10, background: '#DC2626', border: 'none', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>+ Add Item</button>
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
              const statusColor = o.status === 'confirmed' ? '#DC2626' : o.status === 'preparing' ? '#FACC15' : '#60A5FA'
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
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block' }}>{o.customer}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{o.address}</span>
                    </div>
                    <button onClick={() => setShowPaymentProof(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, position: 'relative' }}>
                      <img src={o.paymentMethod === 'bank' ? PAYMENT_ICONS.bank : PAYMENT_ICONS.cod} alt={o.paymentMethod === 'bank' ? 'Bank' : 'COD'} onError={imgError('payment')} style={{ width: 42, height: 42, objectFit: 'contain' }} />
                      {o.paymentMethod === 'bank' && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#DC2626', border: '2px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/></svg></div>}
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
                        <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitlediuooiuoifsdfsdf-removebg-preview.png" alt="" onError={imgError('generic')} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: o.driverETA <= 2 ? '#DC2626' : '#FACC15' }}>
                          {o.driverETA <= 2 ? 'Arriving now' : `Driver: ${o.driverETA} min`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {o.status === 'confirmed' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#DC2626', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', animation: 'flashGreen 1s ease-in-out infinite' }}>✓ Accept Order</button>}
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
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#DC2626' }}>{fmtRp(o.total)}</span>
                    <span style={{ fontSize: 9, color: '#DC2626', display: 'block' }}>✓ Completed</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══════════ PAGE: ANALYTICS (real, from food_orders) ══════════ */}
        {page === 'analytics' && (
          <AnalyticsPage restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {/* ══════════ PAGE: SETTINGS (restaurant profile) ══════════ */}
        {page === 'settings' && (
          <SettingsPage restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'coupons' && (
          <CouponsPage restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'reviews' && (
          <ReviewsPage restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'locations' && (
          <LocationsPage
            restaurant={restaurant}
            onBack={() => setPage('overview')}
            onSwitchContext={(b) => { setRestaurant(prev => ({ ...prev, ...b })); setPage('overview') }}
          />
        )}

        {page === 'staff' && (
          <StaffPage restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'notifications' && (
          <NotificationsCenter restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'pos' && (
          <POSIntegrations restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'channels' && (
          <ChannelSettings
            vendor={restaurant}
            appKind="food"
            availableIds={['whatsapp', 'chat']}
            onSave={async (channels) => {
              if (!supabase || !restaurant?.id) return
              const { error } = await supabase.from('restaurants').update({ channels }).eq('id', restaurant.id)
              if (error) throw error
              setRestaurant((r) => ({ ...r, channels }))
            }}
            onBack={() => setPage('overview')}
          />
        )}

        {/* ══════════ PAGE: PAYMENT METHODS ══════════ */}
        {page === 'payments' && (
          <PaymentsPage vendorId={restaurant?.id} />
        )}

        {page === 'subscription' && (
          <SubscriptionPage
            restaurant={restaurant}
            subscription={subscription}
            activating={subActivating}
            onActivated={(row) => setSubscription(row)}
          />
        )}

        {page === 'design' && (
          <DesignStudio restaurant={restaurant} onClose={() => setPage('overview')} />
        )}

        {page === 'hours' && (
          <HoursHolidays restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'delivery' && (
          <DeliverySettings restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'modifiers' && (
          <ModifierGroups restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'eightysix' && (
          <EightySixList menuItems={menuItems} onToggle={toggleItem} onBack={() => setPage('overview')} />
        )}

        {page === 'orderboard' && (
          <OrderBoard restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'refunds' && (
          <RefundsConsole restaurant={restaurant} onBack={() => setPage('overview')} />
        )}

        {page === 'payouts' && (
          <PayoutsPage restaurant={restaurant} subscription={subscription} onBack={() => setPage('overview')} />
        )}

        {/* ══════════ PAGE: LIVE ITEMS ══════════ */}
        {page === 'live' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setPage('overview')} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#DC2626', margin: 0, flex: 1 }}>🟢 Live Items ({liveCount})</h2>
              <HelpIcon section="menu" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.filter(i => i.is_available).map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14,
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(220,38,38,0.15)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                  {item.photo_url ? <img src={item.photo_url} alt="" onError={imgError('food')} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{item.category}</span>
                  </div>
                  <button onClick={() => setEditItem(item)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#DC2626', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
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
                  {item.photo_url ? <img src={item.photo_url} alt="" onError={imgError('food')} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{item.category}</span>
                  </div>
                  <button onClick={() => setEditItem(item)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#DC2626', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
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

        </div>
      </div>

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
            <div onClick={e => e.stopPropagation()} style={{ background: '#111', borderRadius: 24, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center', border: '2px solid rgba(220,38,38,0.2)' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 4 }}>{order.id}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 16 }}>Show this QR to the driver</span>

              {/* QR Code */}
              <div style={{ padding: 16, borderRadius: 16, background: '#fff', display: 'inline-block', marginBottom: 16 }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${order.qrCode}`} alt="QR" onError={imgError('qr')} style={{ width: 180, height: 180, display: 'block' }} />
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
                background: '#DC2626', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 8,
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
                    <img src={PAYMENT_ICONS.bank} alt="" onError={imgError('payment')} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#DC2626', display: 'block' }}>Bank Transfer</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{order.customer}</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginLeft: 'auto' }}>{fmtRp(order.total)}</span>
                  </div>
                  {order.paymentProof ? (
                    <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <img src={order.paymentProof} alt="Payment proof" onError={imgError('payment')} style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'contain', background: '#000' }} />
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
                    <img src={PAYMENT_ICONS.cod} alt="" onError={imgError('payment')} style={{ width: 32, height: 32, objectFit: 'contain' }} />
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
                background: page === nav.id ? 'rgba(220,38,38,0.1)' : 'none',
                color: page === nav.id ? '#DC2626' : 'rgba(255,255,255,0.5)',
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

// ── Payment Methods page ────────────────────────────────────────────────────
// Vendor connects their own gateway accounts so customer payments flow
// directly to them. StreetLocal never holds funds. Mirrors the food-basic
// flow but standalone (apps are separate per architecture decision).
function PaymentsPage({ vendorId }) {
  const [connections, setConnections] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeGateway, setActiveGateway] = useState(null)
  const [formConfig, setFormConfig] = useState({ mode: 'test' })
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Load existing connections from supabase on mount + when vendor changes.
  useEffect(() => {
    if (!supabase || !vendorId) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase
          .from('vendor_payment_connections')
          .select('gateway_id, is_active, mode')
          .eq('vendor_id', vendorId)
        if (cancelled) return
        const map = {}
        for (const row of data || []) {
          map[row.gateway_id] = { connected: !!row.is_active, mode: row.mode }
        }
        setConnections(map)
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [vendorId])

  const handleSave = async () => {
    if (!activeGateway || !vendorId || saveBusy) return
    setSaveBusy(true); setSaveMsg('')
    try {
      await saveGatewayConnection(vendorId, activeGateway.id, formConfig)
      setConnections(prev => ({ ...prev, [activeGateway.id]: { connected: true, mode: formConfig.mode || 'test' } }))
      setSaveMsg('Connected — customers can now pay via this gateway at checkout.')
      setTimeout(() => { setActiveGateway(null); setFormConfig({ mode: 'test' }); setSaveMsg('') }, 1500)
    } catch (e) {
      setSaveMsg(e?.message || 'Save failed — check the keys and try again.')
    } finally { setSaveBusy(false) }
  }

  const handleDisconnect = async (gatewayId) => {
    if (!vendorId) return
    if (!window.confirm('Disconnect this gateway? Customers can\'t pay via this method until you reconnect.')) return
    try {
      await removeGatewayConnection(vendorId, gatewayId)
      setConnections(prev => { const next = { ...prev }; delete next[gatewayId]; return next })
    } catch {}
  }

  const connectedList = SUPPORTED_GATEWAYS.filter(g => connections[g.id]?.connected)
  const availableList = SUPPORTED_GATEWAYS.filter(g => !connections[g.id]?.connected && !g.comingSoon)
  const comingSoonList = SUPPORTED_GATEWAYS.filter(g => g.comingSoon && !connections[g.id]?.connected)

  return (
    <>
      <SectionHeader title="Payment Methods" helpKey="payments" />
      <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#DC2626', marginBottom: 6 }}>You keep 100% of every order</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>FoodLocal Pro is a flat monthly subscription — no commission, no transaction fees from StreetLocal. Customer payments flow through your own connected gateway directly to your bank account. You can also run on cash, bank transfer, or QRIS without connecting anything.</div>
      </div>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}

      {!loading && connectedList.length > 0 && (
        <>
          <SectionHeader title={`Connected (${connectedList.length})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {connectedList.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(220,38,38,0.25)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: (g.color || '#DC2626') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{g.icon || '💳'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, marginTop: 2 }}>Active · {connections[g.id]?.mode === 'live' ? 'Live' : 'Sandbox'}</div>
                </div>
                <button onClick={() => handleDisconnect(g.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Disconnect</button>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && (
        <>
          <SectionHeader title={`Available (${availableList.length})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {availableList.map(g => (
              <button key={g.id} onClick={() => { setActiveGateway(g); setFormConfig({ mode: 'test' }); setSaveMsg('') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: (g.color || '#fff') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{g.icon || '💳'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.4 }}>{g.tagline || g.bestFor || 'Tap to connect'}</div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {!loading && comingSoonList.length > 0 && (
        <details style={{ marginBottom: 16 }}>
          <summary style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px 0' }}>Coming soon ({comingSoonList.length})</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {comingSoonList.map(g => (
              <div key={g.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{g.name} — {g.tagline || 'Not yet wired'}</div>
            ))}
          </div>
        </details>
      )}

      {/* Gateway connection modal */}
      {activeGateway && createPortal(
        <div onClick={() => !saveBusy && setActiveGateway(null)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f0f12', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', color: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 4 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: (activeGateway.color || '#DC2626') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{activeGateway.icon || '💳'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Connect {activeGateway.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{activeGateway.tagline}</div>
              </div>
            </div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginTop: 6 }}>Mode</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['test', 'live'].map(m => (
                <button key={m} onClick={() => setFormConfig(c => ({ ...c, mode: m }))} style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: formConfig.mode === m ? '#DC2626' : 'rgba(255,255,255,0.08)', color: formConfig.mode === m ? '#000' : 'rgba(255,255,255,0.6)' }}>{m === 'test' ? 'Sandbox / Test' : 'Live'}</button>
              ))}
            </div>
            {(activeGateway.fields || []).map(f => (
              <div key={f.key} style={{ marginTop: 4 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700, display: 'block', marginBottom: 4 }}>{f.label}{f.required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}</label>
                <input
                  type={f.type === 'password' || f.secret ? 'password' : (f.type || 'text')}
                  placeholder={f.placeholder || ''}
                  value={formConfig[f.key] || ''}
                  onChange={e => setFormConfig(c => ({ ...c, [f.key]: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            ))}
            {activeGateway.docUrl && (
              <a href={activeGateway.docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#DC2626', textDecoration: 'underline', marginTop: 4 }}>How to find these keys →</a>
            )}
            {activeGateway.setupSteps && activeGateway.setupSteps.length > 0 && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>Setup steps</summary>
                <ol style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
                  {activeGateway.setupSteps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </details>
            )}
            {saveMsg && <div style={{ fontSize: 12, color: saveMsg.toLowerCase().includes('fail') ? '#FCA5A5' : '#86EFAC', textAlign: 'center', padding: '6px 4px' }}>{saveMsg}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={() => setActiveGateway(null)} disabled={saveBusy} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, cursor: saveBusy ? 'wait' : 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saveBusy} style={{ flex: 2, padding: 12, borderRadius: 12, border: 'none', background: '#DC2626', color: '#000', fontSize: 13, fontWeight: 900, cursor: saveBusy ? 'wait' : 'pointer', opacity: saveBusy ? 0.6 : 1 }}>{saveBusy ? 'Connecting…' : 'Connect Gateway'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Subscription page ──────────────────────────────────────────────────────
// Pay Rp 100.000 (WhatsApp orders) or Rp 150.000 (in-app chat orders) via
// Midtrans Snap. On settlement the foodpro-subscription-webhook flips
// restaurants.url_active to true so the shop goes live automatically.
function SubscriptionPage({ restaurant, subscription, activating, onActivated }) {
  const [busy, setBusy] = useState(null) // tier id currently being purchased
  const [msg, setMsg] = useState('')

  const isLive = !!subscription?.url_active
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - new Date()) / 86400000)) : null
  const currentTier = subscription?.subscription_tier

  const handleBuy = async (tier) => {
    if (!restaurant?.id) { setMsg('Restaurant not loaded yet — refresh and try again.'); return }
    setBusy(tier.id); setMsg('')
    try {
      await startFoodproCheckout({
        restaurantId: restaurant.id,
        planTier: tier.id,
        returnUrl: window.location.href.split('?')[0] + '?view=vendor',
      })
      // Snap closed via onSuccess — start polling so the UI updates.
      setMsg('Payment received. Activating your shop…')
      const row = await pollSubscriptionLive(restaurant.id)
      if (row) { onActivated(row); setMsg('Your shop is live!') }
      else setMsg('Activation pending — Midtrans is still processing. Refresh in a minute.')
    } catch (e) {
      if (e?.message === 'closed') setMsg('Checkout closed — no charge made.')
      else setMsg(e?.message || 'Checkout failed. Try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <SectionHeader title="Subscription" />

      {/* Status banner */}
      <div style={{
        padding: 16, borderRadius: 16, marginBottom: 16, position: 'relative', overflow: 'hidden',
        background: isLive ? 'rgba(220,38,38,0.10)' : 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: isLive ? `1px solid ${BRAND.redBorder}` : '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FoodLocal Pro</span>
          <span style={{
            fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 6,
            background: isLive ? BRAND.redGlow : 'rgba(255,255,255,0.06)',
            color: isLive ? BRAND.redLight : 'rgba(255,255,255,0.5)',
          }}>
            {activating ? 'ACTIVATING…' : isLive ? '● LIVE' : 'NOT LIVE'}
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: isLive ? '#fff' : 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
          {activating
            ? 'Activating your shop…'
            : isLive
              ? `${(currentTier === 'chat' ? 'Chat' : 'WhatsApp')} Orders · ${daysLeft != null ? daysLeft + ' days left' : '30 days'}`
              : 'Pick a package below to go live'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
          Midtrans handles your payment. The moment it settles, your shop is auto-published and customers can order. No commission — you keep 100% of every order.
        </div>
      </div>

      {/* Package cards */}
      {FOODPRO_TIERS.map(tier => {
        const isCurrent = isLive && currentTier === tier.id
        return (
          <div key={tier.id} style={{
            padding: 18, borderRadius: 16, marginBottom: 12, position: 'relative', overflow: 'hidden',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: isCurrent ? `1.5px solid ${BRAND.red}` : `1px solid ${BRAND.redBorder}`,
            boxShadow: isCurrent ? `0 0 24px ${BRAND.redGlow}` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{tier.label}</span>
              {isCurrent && (
                <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 6, background: BRAND.redGlow, color: BRAND.redLight }}>CURRENT</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: BRAND.redLight }}>{fmtRp(tier.price)}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>/ 30 days</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>{tier.tagline}</div>
            <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none' }}>
              {tier.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: BRAND.redGlow, color: BRAND.redLight, fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleBuy(tier)}
              disabled={busy === tier.id || isCurrent}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: isCurrent ? 'rgba(255,255,255,0.08)' : BRAND.red,
                color: isCurrent ? 'rgba(255,255,255,0.4)' : '#fff',
                fontSize: 14, fontWeight: 900, cursor: (busy === tier.id || isCurrent) ? 'wait' : 'pointer',
                opacity: busy === tier.id ? 0.7 : 1,
              }}>
              {busy === tier.id ? 'Opening Midtrans…' : isCurrent ? `Active · ${daysLeft != null ? daysLeft + ' days left' : ''}` : `Pay ${fmtRp(tier.price)} via Midtrans`}
            </button>
          </div>
        )
      })}

      {msg && (
        <div style={{
          padding: 12, borderRadius: 12, marginBottom: 12, fontSize: 13, lineHeight: 1.5,
          background: msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('closed')
            ? 'rgba(239,68,68,0.08)' : BRAND.redFaint,
          border: msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('closed')
            ? '1px solid rgba(239,68,68,0.2)' : `1px solid ${BRAND.redBorder}`,
          color: msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('closed') ? '#FCA5A5' : '#FECACA',
        }}>{msg}</div>
      )}

      {/* How it works */}
      <div style={{
        padding: 16, borderRadius: 16,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 10 }}>How it works</span>
        {[
          'Pick a package and pay via Midtrans (card, GoPay, ShopeePay, QRIS, bank VA).',
          'Midtrans settlement triggers an automatic webhook to StreetLocal.',
          'Your shop goes live the instant the webhook fires — usually under 30 seconds.',
          'Connect your own payment gateway on the Payment Methods tab so customer payments flow straight to your bank.',
          'StreetLocal charges no commission and never holds your money.',
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: BRAND.redGlow, color: BRAND.redLight, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{s}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// 86 List — items currently unavailable. Quick way to see what's hidden
// from customers and bulk un-86 when stock returns. Toggle wires back to
// menu_items.is_available via toggleItem in the parent.
function EightySixList({ menuItems, onToggle, onBack }) {
  const off = menuItems.filter(i => i.is_available === false)
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>🚫 86 List ({off.length})</h2>
        {off.length > 0 && (
          <button onClick={() => off.forEach(i => onToggle(i.id))} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.15)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Un-86 all</button>
        )}
      </div>
      <div style={{ padding: 14, borderRadius: 16, marginBottom: 12, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.30)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Items hidden from customers</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
          "86'd" means out of stock right now. The item stays in your menu but is hidden until you un-86 it. Use this instead of deleting when you run out for the day.
        </div>
      </div>
      {off.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Nothing is 86'd. Everything is live.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {off.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {item.photo_url
                ? <img src={item.photo_url} alt="" onError={imgError('food')} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0, opacity: 0.5 }} />
                : <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{fmtRp(item.price)} · {item.category || 'Main'}</div>
              </div>
              <button onClick={() => onToggle(item.id)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>Un-86</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
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
          width: '100%', padding: '14px', borderRadius: 14, border: '2px dashed rgba(220,38,38,0.3)',
          background: 'rgba(220,38,38,0.06)', color: '#DC2626', fontSize: 14, fontWeight: 900,
          cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>+</span> Create New Deal
        </button>
      )}

      {/* ══════════ CREATE DEAL FORM ══════════ */}
      {showCreate && (
        <div style={{ ...cardStyle, border: '1px solid rgba(220,38,38,0.2)', marginBottom: 20 }}>
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
                  background: selected ? 'rgba(220,38,38,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, border: selected ? '2px solid #DC2626' : '2px solid rgba(255,255,255,0.15)',
                    background: selected ? '#DC2626' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  {item.photo_url && <img src={item.photo_url} alt="" onError={imgError('food')} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
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
                background: days.includes(day) ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.04)',
                color: days.includes(day) ? '#DC2626' : 'rgba(255,255,255,0.3)',
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
            background: canSave ? '#DC2626' : 'rgba(220,38,38,0.2)', color: canSave ? '#000' : 'rgba(255,255,255,0.3)',
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
          <div key={deal.id} style={{ ...cardStyle, border: running ? '1px solid rgba(220,38,38,0.15)' : '1px solid rgba(255,255,255,0.06)' }}>
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
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: running ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.04)', color: running ? '#DC2626' : 'rgba(255,255,255,0.3)' }}>
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
                background: deal.active ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.03)',
                color: deal.active ? '#DC2626' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
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
            <img key={i} src={item.photo_url} alt="" onError={imgError('food')} style={{ flex: 1, height: '100%', objectFit: 'cover', borderRight: i < 2 ? '1px solid rgba(0,0,0,0.3)' : 'none' }} />
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
          <span style={{ fontSize: 16, fontWeight: 900, color: '#DC2626' }}>{fmtRp(discountedPrice)}</span>
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
              background: editHasSize ? '#DC2626' : 'rgba(255,255,255,0.1)',
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
            width: '100%', padding: 14, borderRadius: 14, background: editName.trim() && editPrice ? '#DC2626' : 'rgba(255,255,255,0.06)',
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
          <span style={{ fontSize: 14, fontWeight: 900, color: '#DC2626' }}>{bundleDiscount}% off</span>
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
            background: activeCategory === c.id ? '#DC2626' : 'rgba(255,255,255,0.06)',
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
            <button onClick={() => { setEditItem({ category: activeCategory, index: i }); setEditName(item.name); setEditPrice(String(item.price)); setEditLargePrice(item.largePrice ? String(item.largePrice) : ''); setEditHasSize(item.hasSize ?? false) }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#DC2626', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
            <button onClick={() => deleteItem(i)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button onClick={() => {
        setShowLibraryPicker(activeCategory)
      }} style={{
        width: '100%', padding: 14, borderRadius: 14, background: '#DC2626', border: 'none', color: '#000',
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
                          background: enabled ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${enabled ? '#DC2626' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'left',
                        }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: enabled ? '#DC2626' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              <button onClick={() => setShowLibraryPicker(null)} style={{ width: '100%', padding: 14, borderRadius: 14, background: '#DC2626', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                Done — {(extras[key] ?? []).length} {label.toLowerCase()} selected
              </button>
            </div>
          </div>
        )
      })()}

      {toast && <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 12, background: '#DC2626', color: '#000', fontSize: 14, fontWeight: 800, zIndex: 10000 }}>✓ {toast}</div>}
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
                <img src={t.img} alt="" onError={imgError('banner')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <img src={b.template_img} alt="" onError={imgError('banner')} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>{b.template_label}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                      background: b.status === 'active' ? 'rgba(220,38,38,0.15)' : b.status === 'pending' ? 'rgba(250,204,21,0.15)' : 'rgba(239,68,68,0.15)',
                      color: b.status === 'active' ? '#DC2626' : b.status === 'pending' ? '#FACC15' : '#EF4444',
                    }}>{b.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Next button */}
          <button onClick={() => { if (selectedTemplate) setStep('promo') }} disabled={!selectedTemplate} style={{
            width: '100%', padding: 14, borderRadius: 14, marginTop: 16,
            background: selectedTemplate ? '#DC2626' : 'rgba(255,255,255,0.06)',
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
            <img src={template.img} alt="" onError={imgError('banner')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{restaurant?.name ?? 'Your Restaurant'}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: template.color }}>{promoText || 'Your promo text here'}</span>
            </div>
          </div>

          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Promo Text</span>
          <input value={promoText} onChange={e => setPromoText(e.target.value)} placeholder="e.g. 20% OFF Today Only!" maxLength={40} style={{ ...inputStyle, marginBottom: 4 }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{promoText.length}/40</span>

          <button onClick={() => setStep('payment')} style={{ width: '100%', padding: 14, borderRadius: 14, marginTop: 16, background: '#DC2626', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Next — Payment</button>
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
              <button onClick={() => { navigator.clipboard?.writeText(BANNER_BANK.number); setCopyMsg(true); setTimeout(() => setCopyMsg(false), 2000) }} style={{ padding: '4px 10px', borderRadius: 6, background: copyMsg ? 'rgba(220,38,38,0.2)' : '#DC2626', border: 'none', color: copyMsg ? '#DC2626' : '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{copyMsg ? '✓ Copied' : 'Copy'}</button>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>Upload Payment Screenshot</span>
            <button onClick={() => proofRef.current?.click()} style={{ width: '100%', height: 130, borderRadius: 14, border: '1.5px dashed rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {proofPreview ? <img src={proofPreview} alt="" onError={imgError('payment')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
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
            background: proofPreview ? '#DC2626' : 'rgba(255,255,255,0.06)',
            border: 'none', color: proofPreview ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: 14, fontWeight: 900, cursor: proofPreview ? 'pointer' : 'default',
          }}>Submit & Pay</button>
        </>
      )}

      {/* ── SUBMITTED ── */}
      {step === 'submitted' && (
        <div style={{ ...cardStyle, textAlign: 'center', marginTop: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: '2px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>Banner Submitted!</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>FoodLocal Pro team will verify payment and activate your banner.</span>
          <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 700, display: 'block', marginBottom: 16 }}>Activation: Same day during business hours</span>
          <button onClick={() => { setStep('library'); setSelectedTemplate(null); setPromoText(''); setProofPreview(null); setProofFile(null) }} style={{ padding: '12px 32px', borderRadius: 12, background: '#DC2626', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Done</button>
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
              <img src={img} alt="" onError={imgError('banner')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          background: '#DC2626', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
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
              border: `1px solid ${enabled ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{type.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: enabled ? '#fff' : 'rgba(255,255,255,0.5)', display: 'block' }}>{type.label}</span>
                  {enabled && hasContent && (
                    <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>
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
                  background: enabled ? '#DC2626' : 'rgba(255,255,255,0.1)',
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
                    color: '#DC2626', fontSize: 12, fontWeight: 800, cursor: 'pointer',
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
// Perk ribbon presets — shown at the top of a menu card. Vendor can pick
// one or write a custom 24-char tagline.
const PERK_LABELS = {
  bogo:       { emoji: '🎁', text: 'BUY 1 GET 1 FREE' },
  freeDrink:  { emoji: '🥤', text: 'FREE DRINK' },
  freeRice:   { emoji: '🍚', text: 'FREE RICE' },
  freeFries:  { emoji: '🍟', text: 'FREE FRIES' },
  freeCoffee: { emoji: '☕', text: 'FREE COFFEE' },
  spendFree:  { emoji: '💸', text: 'SPEND Rp 50K — FREE DELIVERY' },
}

const DIETARY_TAGS = [
  { id: 'vegetarian',   label: 'Vegetarian',     icon: '🌱', color: '#22c55e' },
  { id: 'vegan',        label: 'Vegan',          icon: '🌿', color: '#16a34a' },
  { id: 'halal',        label: 'Halal',          icon: '🕌', color: '#0d9488' },
  { id: 'kosher',       label: 'Kosher',         icon: '✡️', color: '#2563eb' },
  { id: 'gluten_free',  label: 'Gluten-Free',    icon: '🌾', color: '#ca8a04' },
  { id: 'dairy_free',   label: 'Dairy-Free',     icon: '🥛', color: '#0891b2' },
  { id: 'nut_free',     label: 'Nut-Free',       icon: '🥜', color: '#a16207' },
  { id: 'healthy',      label: 'Healthy',        icon: '🥗', color: '#15803d' },
  { id: 'high_protein', label: 'High-Protein',   icon: '💪', color: '#9333ea' },
  { id: 'organic',      label: 'Organic',        icon: '🌎', color: '#65a30d' },
]

const ALLERGEN_OPTIONS = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Egg', 'Soy']

function ItemModal({ item, onSave, onClose }) {
  const isNew = !item?.id
  const ex = item?.extras || {}

  // Core fields
  const [name, setName] = useState(item?.name ?? '')
  const [originalPrice, setOriginalPrice] = useState(item?.original_price?.toString() ?? '')
  const [price, setPrice] = useState(item?.price?.toString() ?? '')
  const [category, setCategory] = useState(item?.category ?? 'Main')
  const [description, setDescription] = useState(item?.description ?? '')
  const [photoUrl, setPhotoUrl] = useState(item?.photo_url ?? null)
  const [prepTime, setPrepTime] = useState(item?.prep_time_min?.toString() ?? '10')

  // Badge fields
  const [spice, setSpice] = useState(item?.spice ?? 0)
  const [halal, setHalal] = useState(item?.halal ?? false)
  const [popular, setPopular] = useState(item?.popular ?? false)

  // Optional fields (stored in extras JSONB on save)
  const [photos, setPhotos] = useState(ex.photos ?? [])
  const [allergens, setAllergens] = useState(ex.allergens ?? [])
  const [dietary, setDietary] = useState(ex.dietary ?? [])
  const [portion, setPortion] = useState(ex.portion ?? '')
  const [portionSize, setPortionSize] = useState(ex.portion_size ?? '')
  const [stock, setStock] = useState(item?.stock != null ? String(item.stock) : '')
  const [variants, setVariants] = useState(ex.variants ?? [])
  const [modifiers, setModifiers] = useState(ex.modifiers ?? [])
  const [perks, setPerks] = useState(ex.perks ?? [])
  const [perkText, setPerkText] = useState(ex.perk_text ?? '')
  const initialLimit = ex.perk_limit || {}
  const [perkLimitType, setPerkLimitType] = useState(initialLimit.type ?? 'none')
  const [perkLimitEndAt, setPerkLimitEndAt] = useState(initialLimit.endAt ?? '')
  const [perkLimitStock, setPerkLimitStock] = useState(initialLimit.remaining != null ? String(initialLimit.remaining) : '')

  const [expanded, setExpanded] = useState({
    photos: photos.length > 0, perks: perks.length > 0 || !!perkText,
    variants: variants.length > 0, modifiers: modifiers.length > 0,
    allergens: allergens.length > 0, dietary: dietary.length > 0,
    portion: !!portion, stock: stock !== '',
  })
  const toggleSection = (k) => setExpanded(p => ({ ...p, [k]: !p[k] }))

  const discountPct = originalPrice && Number(originalPrice) > Number(price)
    ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
    : 0

  const handleSave = () => {
    if (!name.trim() || !price) return
    const perkLimit =
      perkLimitType === 'time'  && perkLimitEndAt   ? { type: 'time', endAt: perkLimitEndAt } :
      perkLimitType === 'stock' && perkLimitStock !== '' ? { type: 'stock', remaining: Number(perkLimitStock) || 0 } :
      null
    const extras = {
      photos, allergens, dietary, portion, portion_size: portionSize,
      variants, modifiers, perks, perk_text: perkText, perk_limit: perkLimit,
    }
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
      spice: Number(spice) || 0,
      halal,
      popular,
      stock: stock === '' ? null : Number(stock),
      extras,
      is_available: item?.is_available ?? true,
    })
  }

  const inputStyle = { width: '100%', padding: '14px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 16, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }
  const sectionStyle = { marginBottom: 12, padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.10)', position: 'relative' }
  const sectionCloseBtn = (key) => (
    <button type="button" onClick={() => toggleSection(key)} aria-label="Close" style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, border: 'none', background: BRAND.red, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
  )

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10002,
      backgroundImage: 'url(https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-06_43_19-am.png)',
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
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 900 }}>{discountPct}% OFF</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>Rp {Number(originalPrice).toLocaleString('id-ID')}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: BRAND.red }}>Rp {Number(price).toLocaleString('id-ID')}</span>
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
            <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={imgError('logo')} />
          </div>
        )}

        {/* Badges row */}
        <label style={labelStyle}>Badges</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <button type="button" onClick={() => setHalal(v => !v)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid ' + (halal ? '#0d9488' : 'rgba(255,255,255,0.1)'), background: halal ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🕌 Halal</button>
          <button type="button" onClick={() => setPopular(v => !v)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid ' + (popular ? BRAND.red : 'rgba(255,255,255,0.1)'), background: popular ? BRAND.redGlow : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⭐ Popular</button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginRight: 4 }}>🌶 Spice</span>
            {[0, 1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setSpice(n)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', background: n <= spice && spice > 0 ? '#EF4444' : 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 11, fontWeight: 800 }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Optional sections chips */}
        <label style={labelStyle}>Optional details</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {[
            { key: 'perks', label: '🎁 Perk Ribbon' },
            { key: 'variants', label: '📏 Sizes' },
            { key: 'modifiers', label: '➕ Add-ons' },
            { key: 'allergens', label: '⚠️ Allergens' },
            { key: 'dietary', label: '🌱 Dietary' },
            { key: 'portion', label: '⚖️ Grams' },
            { key: 'stock', label: '📦 Stock' },
            { key: 'photos', label: '🖼 Photos' },
          ].map(opt => (
            <button key={opt.key} type="button" onClick={() => toggleSection(opt.key)} style={{
              background: expanded[opt.key] ? BRAND.redGlow : 'rgba(255,255,255,0.04)',
              border: '1px dashed ' + (expanded[opt.key] ? BRAND.redBorder : 'rgba(255,255,255,0.12)'),
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              padding: '7px 11px', borderRadius: 12, minHeight: 32,
            }}>{expanded[opt.key] ? '−' : '+'} {opt.label}</button>
          ))}
        </div>

        {expanded.perks && (
          <div style={sectionStyle}>
            {sectionCloseBtn('perks')}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Perk ribbon — shown at the top of this item's card.</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Preset</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {Object.entries(PERK_LABELS).map(([id, p]) => {
                const isActive = perks[0] === id && !perkText
                return (
                  <button key={id} type="button" onClick={() => { setPerks(isActive ? [] : [id]); setPerkText('') }} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: isActive ? BRAND.red : 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (isActive ? BRAND.red : 'rgba(255,255,255,0.1)'),
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    padding: '6px 10px', borderRadius: 14, minHeight: 36,
                  }}>
                    <span>{p.emoji}</span>{p.text}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Or write your own (max 24 chars)</div>
            <input value={perkText} maxLength={24} onChange={e => { setPerkText(e.target.value); if (e.target.value) setPerks([]) }} placeholder="e.g. Free Cendol Today!" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Limited offer?</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[
                { id: 'none', label: 'No limit' },
                { id: 'time', label: '⏱ Time' },
                { id: 'stock', label: '📦 Stock' },
              ].map(opt => (
                <button key={opt.id} type="button" onClick={() => setPerkLimitType(opt.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: perkLimitType === opt.id ? BRAND.red : 'rgba(255,255,255,0.08)', color: perkLimitType === opt.id ? '#fff' : 'rgba(255,255,255,0.6)', minHeight: 40 }}>{opt.label}</button>
              ))}
            </div>
            {perkLimitType === 'time' && (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {[
                    { label: '+1 h', ms: 1 * 3600000 },
                    { label: '+4 h', ms: 4 * 3600000 },
                    { label: '+24 h', ms: 24 * 3600000 },
                    { label: '+48 h', ms: 48 * 3600000 },
                    { label: '+7 days', ms: 7 * 24 * 3600000 },
                  ].map(opt => (
                    <button key={opt.label} type="button" onClick={() => setPerkLimitEndAt(new Date(Date.now() + opt.ms).toISOString())} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36 }}>{opt.label}</button>
                  ))}
                </div>
                <input type="datetime-local" value={perkLimitEndAt ? new Date(perkLimitEndAt).toISOString().slice(0, 16) : ''} onChange={e => setPerkLimitEndAt(e.target.value ? new Date(e.target.value).toISOString() : '')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
                {perkLimitEndAt && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Ends {new Date(perkLimitEndAt).toLocaleString()}</div>}
              </div>
            )}
            {perkLimitType === 'stock' && (
              <input type="number" min={0} value={perkLimitStock} onChange={e => setPerkLimitStock(e.target.value)} placeholder="e.g. 20 left" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            )}
          </div>
        )}

        {expanded.variants && (
          <div style={sectionStyle}>
            {sectionCloseBtn('variants')}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Sizes — customer picks one. Delta added to base price.</div>
            {variants.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={v.name} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Small / Large / Regular" style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <input type="number" value={v.priceDelta} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, priceDelta: Number(e.target.value) || 0 } : x))} placeholder="+0" style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setVariants(p => p.filter((_, j) => j !== i))} style={{ width: 34, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => setVariants(p => [...p, { id: 'v_' + Date.now(), name: '', priceDelta: 0 }])} style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add size</button>
          </div>
        )}

        {expanded.modifiers && (
          <div style={sectionStyle}>
            {sectionCloseBtn('modifiers')}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Add-ons — customer can pick multiple, each adds to price.</div>
            {modifiers.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={m.name} onChange={e => setModifiers(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Extra cheese / No onion" style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <input type="number" value={m.priceDelta} onChange={e => setModifiers(p => p.map((x, j) => j === i ? { ...x, priceDelta: Number(e.target.value) || 0 } : x))} placeholder="+0" style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setModifiers(p => p.filter((_, j) => j !== i))} style={{ width: 34, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => setModifiers(p => [...p, { id: 'm_' + Date.now(), name: '', priceDelta: 0 }])} style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add modifier</button>
          </div>
        )}

        {expanded.allergens && (
          <div style={sectionStyle}>
            {sectionCloseBtn('allergens')}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Contains — helps customers with allergies.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALLERGEN_OPTIONS.map(a => {
                const isActive = allergens.includes(a)
                return (
                  <button key={a} type="button" onClick={() => setAllergens(p => isActive ? p.filter(x => x !== a) : [...p, a])} style={{
                    background: isActive ? '#EF4444' : 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (isActive ? '#fff' : 'rgba(255,255,255,0.1)'),
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    padding: '6px 10px', borderRadius: 14, minHeight: 32,
                  }}>{a}</button>
                )
              })}
            </div>
          </div>
        )}

        {expanded.dietary && (
          <div style={sectionStyle}>
            {sectionCloseBtn('dietary')}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Dietary tags — customers can filter the menu by these.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DIETARY_TAGS.map(tag => {
                const isActive = dietary.includes(tag.id)
                return (
                  <button key={tag.id} type="button" onClick={() => setDietary(p => isActive ? p.filter(x => x !== tag.id) : [...p, tag.id])} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: isActive ? `${tag.color}33` : 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (isActive ? tag.color : 'rgba(255,255,255,0.1)'),
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    padding: '6px 10px', borderRadius: 14, minHeight: 32,
                  }}>
                    <span>{tag.icon}</span>{tag.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {expanded.portion && (
          <div style={sectionStyle}>
            {sectionCloseBtn('portion')}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Grams / weight</div>
            <input value={portion} onChange={e => setPortion(e.target.value)} placeholder='e.g. 200g · 350g · 1.2kg' style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {['Small', 'Medium', 'Large'].map(s => (
                <button key={s} type="button" onClick={() => setPortionSize(portionSize === s ? '' : s)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: portionSize === s ? BRAND.red : 'rgba(255,255,255,0.08)', color: portionSize === s ? '#fff' : 'rgba(255,255,255,0.6)' }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {expanded.stock && (
          <div style={sectionStyle}>
            {sectionCloseBtn('stock')}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Stock — auto-hides item when 0. Leave blank for unlimited.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min={0} value={stock} onChange={e => setStock(e.target.value)} placeholder='Unlimited' style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setStock('')} style={{ padding: '0 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: stock === '' ? BRAND.redGlow : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Unlimited</button>
            </div>
          </div>
        )}

        {expanded.photos && (
          <div style={sectionStyle}>
            {sectionCloseBtn('photos')}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Extra photos — up to 4 thumbnails shown in a gallery on the item page.</div>
            {photos.map((url, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={url} onChange={e => setPhotos(p => p.map((x, j) => j === i ? e.target.value : x))} placeholder="https://..." style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} style={{ width: 34, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
              </div>
            ))}
            {photos.length < 4 && (
              <button type="button" onClick={() => setPhotos(p => [...p, ''])} style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add photo URL ({photos.length}/4)</button>
            )}
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={!name.trim() || !price} style={{ flex: 2, padding: '16px', borderRadius: 14, background: BRAND.red, border: 'none', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', opacity: name.trim() && price ? 1 : 0.4 }}>{isNew ? 'Add Item' : 'Save Changes'}</button>
      </div>
    </div>,
    document.body
  )
}
