import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import AdminDashboard from './AdminDashboard'
import ActivatePage from './ActivatePage'
import { useAppLocale, LANGUAGES } from './i18n'
import imgError from './imgFallback'
import { FOOD_TYPES, THEME_PRESETS } from '@shared/themes/foodThemes'
import { SUPPORTED_GATEWAYS as RAW_GATEWAYS, ID_BANKS } from '@shared/constants/paymentGateways'
// Real end-to-end processing is wired for Midtrans + Stripe + Xendit + PayPal + Razorpay + Braintree + Mollie + HitPay + Adyen + Rapyd + Checkout.com + FOMO Pay + Authorize.net + 2Checkout
// (Edge Functions + webhooks).
// QRIS upload + bank transfer + escrow are manual-info flows (no real charge).
// Everything else is honestly flagged "Coming Soon" until its Edge Functions are built —
// previously vendors could "connect" Stripe etc. but no payment actually went through.
const LIVE_GATEWAY_IDS = new Set(['midtrans', 'stripe', 'xendit', 'paypal', 'razorpay', 'braintree', 'mollie', 'hitpay', 'adyen', 'rapyd', 'checkout-com', 'fomo-pay', 'authorize-net', '2checkout', 'cybersource', 'worldpay', 'ewallet', 'bank'])
// Map gateway-specific field names to our shared DB columns
// (server_key | client_key | webhook_secret). Anything not mapped lands in additional_config jsonb.
const GATEWAY_FIELD_MAP = {
  midtrans:        { server_key: 'server_key', client_key: 'client_key' },
  stripe:          { secretKey: 'server_key', publishableKey: 'client_key', webhookSecret: 'webhook_secret' },
  xendit:          { secretKey: 'server_key', publicKey: 'client_key', callbackToken: 'webhook_secret' },
  paypal:          { clientId: 'server_key', secret: 'client_key', webhookId: 'webhook_secret' }, // merchantEmail → additional_config
  razorpay:        { keyId: 'server_key', keySecret: 'client_key', webhookSecret: 'webhook_secret' },
  braintree:       { publicKey: 'server_key', privateKey: 'client_key' }, // merchantId → additional_config
  mollie:          { liveApiKey: 'server_key', testApiKey: 'client_key' }, // mode column decides which is used
  hitpay:          { apiKey: 'server_key', salt: 'webhook_secret' },
  adyen:           { apiKey: 'server_key', clientKey: 'client_key', hmacKey: 'webhook_secret' }, // merchantAccount + liveUrlPrefix → additional_config
  rapyd:           { accessKey: 'server_key', secretKey: 'client_key' }, // secretKey is also the webhook HMAC key
  'checkout-com':  { secretKey: 'server_key', publicKey: 'client_key', webhookSecret: 'webhook_secret' },
  'fomo-pay':      { apiKey: 'server_key', signKey: 'webhook_secret' }, // merchantId → additional_config
  'authorize-net': { apiLoginId: 'server_key', transactionKey: 'client_key', signatureKey: 'webhook_secret' },
  '2checkout':     { merchantCode: 'server_key', secretKey: 'client_key', secretWord: 'webhook_secret' },
  cybersource:     { merchantId: 'server_key', apiKeyId: 'client_key', sharedSecret: 'webhook_secret' }, // profileId/accessKey/secretKey (Secure Acceptance) → additional_config
  worldpay:        { serviceKey: 'server_key', clientKey: 'client_key', webhookSecret: 'webhook_secret' },
}
// gateway_id → Edge Function name that refunds it. Most are <id>-refund
// but a few naming quirks are baked into history (fomo-pay → fomopay-refund,
// 2checkout → twocheckout-refund).
const REFUND_FUNCTION_BY_GATEWAY = {
  midtrans: 'midtrans-refund',
  stripe: 'stripe-refund',
  xendit: 'xendit-refund',
  paypal: 'paypal-refund',
  razorpay: 'razorpay-refund',
  braintree: 'braintree-refund',
  mollie: 'mollie-refund',
  hitpay: 'hitpay-refund',
  adyen: 'adyen-refund',
  rapyd: 'rapyd-refund',
  'checkout-com': 'checkout-com-refund',
  'fomo-pay': 'fomopay-refund',
  'authorize-net': 'authorize-net-refund',
  '2checkout': 'twocheckout-refund',
  cybersource: 'cybersource-refund',
  worldpay: 'worldpay-refund',
}
const SUPPORTED_GATEWAYS = RAW_GATEWAYS.map(g =>
  g.comingSoon || LIVE_GATEWAY_IDS.has(g.id) ? g : { ...g, comingSoon: true }
)
import { S } from '@shared/constants/styles'
import { DEMO_MENU } from '@shared/data/foodDemoMenu'
import AdminInboxFab from '@shared/chat/AdminInboxFab.jsx'
import { haversineKm, adjustColor, fmt, loadJSON, saveJSON } from '@shared/utils/helpers'
import { VENDOR_TYPES } from '@shared/data/foodVendorTypes'
import { PLACEHOLDER_SM, PLACEHOLDER_LG, ACCENT_PALETTE, SHOP_LAT, SHOP_LON } from '@shared/constants/placeholders'
import { DELIVERY_DEFAULTS, buildDeliveryZones, DEFAULT_DELIVERY_ZONES, getDeliveryDefaults, getDeliveryFee } from '@shared/delivery/delivery'
import { MENU_CATEGORY_GROUPS, THEME_CATEGORY_OVERRIDES, DIETARY_TAGS, CUSTOM_CATEGORY_ICONS } from '@shared/data/menuCategoryGroups'
import {
  sendCustomerOrder,
  sendChatText,
  sendSystemStatus,
  loadMessages,
  loadVendorConversations,
  clearVendorUnread,
  clearCustomerUnread,
  subscribeToMessages,
  subscribeToVendorMessages,
  getRememberedConvo,
  fmtRupiah as fmtRupiahChat,
} from './lib/chat'
import { enableVendorPush, disableVendorPush, getCurrentSubscription, pushSupported, registerSW } from './lib/push'
import { emitFunnelStep } from './lib/funnel'

/* ─── Supabase Vendor Service ─── */
async function vendorSignup(phone, password, name) {
  if (!supabase) return { id: 'local-' + Date.now(), slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') }
  // Self-signups land in 'pending' state — visible to the vendor (they can
  // build their menu/theme) but not yet activated. A sales person flips
  // them to 'active' via ActivatePage with an activation_code, which also
  // writes the plan_tier (35k whatsapp / 50k chat). plan_tier is left as
  // the column default ('both') until activation. openOrderModePicker on
  // the customer side blocks order submission when vendorStatus !== 'active'
  // so trial vendors can preview their shop without taking real orders.
  emitFunnelStep('signup_started')
  const { data, error } = await supabase.from('vendor_accounts').insert({
    phone: phone.replace(/[^0-9]/g, ''),
    password_hash: password, // In production, hash this
    shop_name: name,
    shop_phone: phone.replace(/[^0-9]/g, ''),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30),
    status: 'pending',
  }).select().single()
  if (error) throw new Error(error.message)
  emitFunnelStep('signup_completed', { vendorId: data?.id })
  return data
}

async function vendorLogin(phone, password) {
  if (!supabase) return null
  const { data } = await supabase.from('vendor_accounts')
    .select('*')
    .eq('phone', phone.replace(/[^0-9]/g, ''))
    .eq('password_hash', password)
    .single()
  return data || null
}

async function updateVendorConfig(vendorId, config) {
  if (!supabase || !vendorId || String(vendorId).startsWith('local')) return
  await supabase.from('vendor_accounts').update(config).eq('id', vendorId)
}

async function getVendorBySlug(slug) {
  if (!supabase) return null
  const { data } = await supabase.from('vendor_accounts').select('*').eq('slug', slug).single()
  return data
}

async function getVendorMenuItems(vendorId) {
  if (!supabase || !vendorId) return []
  const { data } = await supabase.from('vendor_menu_items').select('*').eq('vendor_id', vendorId).eq('available', true).order('sort_order')
  return data || []
}

async function saveMenuItem(vendorId, item) {
  if (!supabase || !vendorId || String(vendorId).startsWith('local')) return item
  if (item.supabaseId) {
    await supabase.from('vendor_menu_items').update({
      name: item.name, price: item.price, description: item.desc,
      category: item.category, photo_url: item.photo, available: item.available,
      promo_price: item.promoPrice, prep_time: item.prepTime,
      spice: item.spice, halal: item.halal, popular: item.popular,
    }).eq('id', item.supabaseId)
    return item
  }
  const { data } = await supabase.from('vendor_menu_items').insert({
    vendor_id: vendorId, name: item.name, price: item.price,
    description: item.desc, category: item.category, photo_url: item.photo,
    available: item.available !== false,
    promo_price: item.promoPrice, prep_time: item.prepTime,
    spice: item.spice, halal: item.halal, popular: item.popular,
  }).select().single()
  return { ...item, supabaseId: data?.id }
}

async function deleteMenuItemSupa(itemId) {
  if (!supabase || !itemId) return
  await supabase.from('vendor_menu_items').delete().eq('id', itemId)
}

async function uploadMenuImage(vendorId, file) {
  if (!supabase) return null
  // Preserve transparency for PNG/WebP inputs (logos, product cut-outs with
  // alpha channel). JPEG re-encoding turns transparent pixels black because
  // JPEG doesn't carry an alpha channel.
  const isPng = file.type === 'image/png' || file.type === 'image/webp' || /\.(png|webp)$/i.test(file.name || '')
  const ext = isPng ? 'png' : 'jpg'
  const mime = isPng ? 'image/png' : 'image/jpeg'
  const path = `vendor-menu/${vendorId}/${Date.now()}.${ext}`
  // Compress first
  const compressed = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 600
        let w = img.width, h = img.height
        if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r) }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob(resolve, mime, isPng ? undefined : 0.7)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
  const { error } = await supabase.storage.from('images').upload(path, compressed, { contentType: mime, upsert: false })
  if (error) return null
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data?.publicUrl || null
}

const FOOD_TYPE_KEYS = Object.keys(FOOD_TYPES)

/* ─── Vendor type presets ─── */
// Picked once at signup. Each type loads its own 6-8 category quick-chips.
// Vendor can still type any custom category. Existing menu items are preserved
// across switches — the preset is suggestions, not enforcement.
// Payment gateway catalog — every gateway StreetLocal supports for vendors to connect.
// Vendor brings their OWN account; we never touch funds. UI mirrors Shopify/eBay/Amazon polish.
// `countries` is an ISO-like list shown to vendors so they know where it works. `logoUrl`
// uses public CDNs for real brand marks; falls back to colored letter avatar if it fails.

// Common Indonesian banks (shown in the Bank Transfer setup). Logos sourced from Wikimedia / official.


const FOOD_CATEGORIES = [...new Set(THEME_PRESETS.map(t => t.category))]

/* Helper: filter themes by country + food type */
function getFilteredThemes(countryCode, foodType, langCountries) {
  // Determine user's country list from detected country or language
  const userCountries = countryCode ? [countryCode] : (langCountries || [])

  // 1. Themes matching the selected food type
  const byFoodType = foodType ? THEME_PRESETS.filter(t => t.foodTypes.includes(foodType)) : []

  // 2. Themes for user's country (popular in your region)
  const byCountry = userCountries.length > 0
    ? THEME_PRESETS.filter(t => t.countries.length === 0 || t.countries.some(c => userCountries.includes(c)))
    : THEME_PRESETS

  // 3. Everything else
  const allIds = new Set([...byFoodType.map(t => t.id), ...byCountry.map(t => t.id)])
  const rest = THEME_PRESETS.filter(t => !allIds.has(t.id))

  return { byFoodType, byCountry, rest }
}

/* ─── Styles ─── */

/* ─── Customer Chat Panel (inline below cart confirmation) ─── */
function CustomerChatPanel({ conversation, messages, setMessages, draft, setDraft, accent, fmt, shopLogo, shopName }) {
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const scrollRef = useRef(null)
  const isDemoConv = conversation?.id && String(conversation.id).startsWith('demo-')

  // Subscribe to message inserts for this conversation — skip in demo (no real Supabase row)
  useEffect(() => {
    if (!conversation?.id || isDemoConv) return
    const unsub = subscribeToMessages(conversation.id, (msg) => {
      setMessages((prev) => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
    })
    // Mark customer's unread cleared when they view
    clearCustomerUnread(conversation.id)
    return unsub
  }, [conversation?.id, isDemoConv])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  if (!conversation) return null

  const orderMsg = messages.find(m => m.order_payload)
  const op = orderMsg?.order_payload || {}

  const onSend = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setErr('')
    // Optimistic
    const optimistic = { id: 'tmp-' + Date.now(), conversation_id: conversation.id, sender_role: 'customer', body, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])
    setDraft('')
    // Demo mode: skip Supabase, simulate owner reply after 1.5s
    if (isDemoConv) {
      setTimeout(() => {
        const reply = { id: 'demo-msg-' + Date.now(), conversation_id: conversation.id, sender_role: 'vendor', body: "Got it 👍 We'll handle that. Let me know if you need anything else!", created_at: new Date().toISOString() }
        setMessages((prev) => [...prev, reply])
      }, 1500)
      setSending(false)
      return
    }
    const res = await sendChatText({ conversationId: conversation.id, senderRole: 'customer', body })
    setSending(false)
    if (res.error) {
      setErr(res.error)
      setMessages((prev) => prev.filter(m => m.id !== optimistic.id))
    } else if (res.message) {
      setMessages((prev) => prev.map(m => m.id === optimistic.id ? res.message : m))
    }
  }

  const sStyle = {
    // Panel is a flex column that fills whatever vertical space its parent gives it.
    // Combined with parent's flex:1, this makes the chat absorb available space on
    // any phone size — small phones get a smaller msgList, large phones get a bigger one.
    panel: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', textAlign: 'left', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%', boxSizing: 'border-box' },
    header: { fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6, flexShrink: 0 },
    orderCard: { background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 10, marginBottom: 8, fontSize: 13, color: 'rgba(255,255,255,0.85)', flexShrink: 0 },
    // flex:1 so the message list absorbs whatever vertical space is left over after the
    // other rows (header/order-card/input). Internal overflow gives the chat its own
    // scrollbar — the OUTER page never scrolls.
    msgList: { flex: 1, minHeight: 80, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8, paddingRight: 4 },
    msgRow: (role) => ({ display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: role === 'customer' ? 'flex-end' : role === 'system' ? 'center' : 'flex-start' }),
    bubble: (role) => ({
      maxWidth: '78%',
      padding: '8px 12px',
      borderRadius: 14,
      fontSize: 13,
      lineHeight: 1.4,
      background: role === 'customer' ? accent : role === 'system' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.55)',
      color: role === 'system' ? 'rgba(255,255,255,0.7)' : '#fff',
      border: role === 'vendor' ? '1px solid rgba(255,255,255,0.06)' : 'none',
      fontStyle: role === 'system' ? 'italic' : 'normal',
      wordBreak: 'break-word',
    }),
    avatar: { width: 26, height: 26, borderRadius: 13, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)' },
    avatarFallback: { width: 26, height: 26, borderRadius: 13, flexShrink: 0, background: accent, color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' },
    inputRow: { display: 'flex', gap: 8, flexShrink: 0 },
    input: { flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, minHeight: 44 },
    sendBtn: { padding: '10px 14px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', minWidth: 64, minHeight: 44 },
  }

  return (
    <div style={sStyle.panel}>
      <div style={sStyle.header}>Chat with the vendor</div>
      {op && op.items && (
        <div style={sStyle.orderCard}>
          <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 13, color: '#FACC15' }}>Order {op.orderNumber || ''}</div>
          {/* Customer info — tidy single-block with icons */}
          {op.customer && (
            <div style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.75)' }}>
              {op.customer.name && <div>👤 {op.customer.name}</div>}
              {op.customer.phone && <div>📱 {op.customer.phone}</div>}
              {op.customer.address && <div>📍 {op.customer.address}</div>}
            </div>
          )}
          {/* Items + per-item notes/modifiers */}
          {op.items.map((it, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.qty}× {it.name}</span>
                <span style={{ flexShrink: 0, color: 'rgba(255,255,255,0.65)' }}>{fmt ? fmt(it.lineTotal) : it.lineTotal}</span>
              </div>
              {(it.modifiers && it.modifiers.length > 0) && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginLeft: 14 }}>+ {it.modifiers.join(' · ')}</div>
              )}
              {it.note && (
                <div style={{ fontSize: 13, color: '#FACC15', marginLeft: 14, fontStyle: 'italic' }}>📝 {it.note}</div>
              )}
            </div>
          ))}
          {op.delivery?.fee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              <span>Delivery {op.delivery.zone ? `(${op.delivery.zone})` : ''}</span>
              <span>{fmt ? fmt(op.delivery.fee) : op.delivery.fee}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, fontSize: 13 }}>
            <span>Total</span>
            <span style={{ color: '#FACC15' }}>{fmt ? fmt(op.total) : op.total}</span>
          </div>
          {op.note && <div style={{ marginTop: 4, opacity: 0.7, fontSize: 13, fontStyle: 'italic' }}>"{op.note}"</div>}
        </div>
      )}
      <div style={sStyle.msgList} ref={scrollRef}>
        {messages.filter(m => !m.order_payload).map((m) => (
          <div key={m.id} style={sStyle.msgRow(m.sender_role)}>
            {m.sender_role === 'vendor' && (
              shopLogo
                ? <img src={shopLogo} alt="" style={sStyle.avatar} />
                : <div style={sStyle.avatarFallback}>{(shopName || '?').charAt(0).toUpperCase()}</div>
            )}
            <div style={sStyle.bubble(m.sender_role)}>{m.body}</div>
          </div>
        ))}
      </div>
      <div style={sStyle.inputRow}>
        <input
          style={sStyle.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSend() }}
          placeholder="Type a message…"
          aria-label="Type a message to the vendor"
        />
        <button style={sStyle.sendBtn} onClick={onSend} disabled={sending || !draft.trim()}>{sending ? '…' : 'Send'}</button>
      </div>
      {err && <div style={{ marginTop: 6, color: '#FCA5A5', fontSize: 13 }}>{err}</div>}
    </div>
  )
}

/* ─── Vendor thread view (inbox conversation) ─── */
function VendorThreadView({ conversation, messages, accent, fmt, onBack, draft, setDraft, onSend, onStatus, order, onReleaseEscrow, onCancelEscrow, onRefund, payActionBusy, payActionMsg }) {
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  const orderMsg = messages.find(m => m.order_payload)
  const op = orderMsg?.order_payload || {}
  const sty = {
    header: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    backBtn: { padding: '8px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, cursor: 'pointer', minHeight: 44 },
    name: { fontSize: 15, fontWeight: 800, color: '#fff', flex: 1 },
    orderCard: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, margin: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    msgList: { flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
    msgRow: (role) => ({ display: 'flex', justifyContent: role === 'vendor' ? 'flex-end' : role === 'system' ? 'center' : 'flex-start' }),
    bubble: (role) => ({
      maxWidth: '78%',
      padding: '8px 12px',
      borderRadius: 14,
      fontSize: 13,
      lineHeight: 1.4,
      background: role === 'vendor' ? accent : role === 'system' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)',
      color: role === 'system' ? 'rgba(255,255,255,0.7)' : '#fff',
      fontStyle: role === 'system' ? 'italic' : 'normal',
      wordBreak: 'break-word',
    }),
    statusRow: { display: 'flex', gap: 6, padding: '8px 12px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)' },
    statusBtn: { padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 },
    inputRow: { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(255,255,255,0.05)' },
    input: { flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, minHeight: 44 },
    sendBtn: { padding: '10px 14px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', minWidth: 64, minHeight: 44 },
  }
  return (
    <>
      <div style={sty.header}>
        <button style={sty.backBtn} onClick={onBack}>‹ Back</button>
        <div style={sty.name}>{conversation.customer_name || conversation.customer_phone}</div>
      </div>
      {op && op.items && (
        <div style={sty.orderCard}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Order {op.orderNumber || ''}</div>
          {op.items.map((it, i) => (
            <div key={i}>{it.qty}x {it.name} — {fmt ? fmt(it.lineTotal) : it.lineTotal}</div>
          ))}
          {op.delivery?.fee > 0 && <div style={{ marginTop: 4 }}>Delivery: {fmt ? fmt(op.delivery.fee) : op.delivery.fee}</div>}
          <div style={{ marginTop: 4, fontWeight: 800 }}>Total: {fmt ? fmt(op.total) : op.total}</div>
          {op.note && <div style={{ marginTop: 4, opacity: 0.8 }}>Note: {op.note}</div>}
          {op.customer?.address && <div style={{ marginTop: 4, opacity: 0.8 }}>Address: {op.customer.address}</div>}
          <div style={{ marginTop: 4, opacity: 0.8 }}>Phone: {op.customer?.phone}</div>
        </div>
      )}
      {order && order.gateway_id && (() => {
        const isHeld = order.escrow_status === 'held'
        const isPaid = order.payment_status === 'paid' && order.escrow_status !== 'held'
        const isRefunded = order.payment_status === 'refunded'
        const isCancelled = order.payment_status === 'cancelled' || order.escrow_status === 'cancelled'
        const statusLabel =
          isHeld ? 'Funds held in escrow' :
          isRefunded ? 'Refunded' :
          isCancelled ? 'Cancelled' :
          isPaid ? 'Paid' :
          order.payment_status === 'pending' ? 'Pending payment' :
          order.payment_status === 'failed' ? 'Payment failed' : order.payment_status
        const badgeColor =
          isHeld ? '#F59E0B' :
          isPaid ? '#16A34A' :
          isRefunded ? '#94A3B8' :
          isCancelled ? '#64748B' :
          order.payment_status === 'failed' ? '#DC2626' : '#3B82F6'
        return (
          <div style={{ ...sty.orderCard, paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Payment</div>
              <span style={{ background: badgeColor, color: '#fff', fontSize: 13, fontWeight: 900, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.4 }}>{statusLabel}</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{order.gateway_id}</span>
            </div>
            {isHeld && order.escrow_release_at && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                Auto-releases {new Date(order.escrow_release_at).toLocaleString()}
              </div>
            )}
            {isHeld && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" disabled={payActionBusy} onClick={onReleaseEscrow}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 800, cursor: payActionBusy ? 'wait' : 'pointer', minHeight: 40, opacity: payActionBusy ? 0.6 : 1 }}>
                  {payActionBusy ? 'Working…' : 'Release funds'}
                </button>
                <button type="button" disabled={payActionBusy} onClick={onCancelEscrow}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 700, cursor: payActionBusy ? 'wait' : 'pointer', minHeight: 40, opacity: payActionBusy ? 0.6 : 1 }}>
                  Cancel hold
                </button>
              </div>
            )}
            {isPaid && (
              <button type="button" disabled={payActionBusy} onClick={onRefund}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.4)', background: 'rgba(220,38,38,0.12)', color: '#FCA5A5', fontSize: 13, fontWeight: 800, cursor: payActionBusy ? 'wait' : 'pointer', minHeight: 40, opacity: payActionBusy ? 0.6 : 1 }}>
                {payActionBusy ? 'Working…' : 'Issue refund'}
              </button>
            )}
            {payActionMsg && (
              <div style={{ marginTop: 8, fontSize: 13, color: payActionMsg.toLowerCase().includes('fail') ? '#FCA5A5' : '#86EFAC' }}>{payActionMsg}</div>
            )}
          </div>
        )
      })()}
      <div style={sty.msgList} ref={scrollRef}>
        {messages.filter(m => !m.order_payload).map((m) => (
          <div key={m.id} style={sty.msgRow(m.sender_role)}>
            <div style={sty.bubble(m.sender_role)}>{m.body}</div>
          </div>
        ))}
      </div>
      <div style={sty.statusRow}>
        {['Accepted', 'Preparing', 'Out for delivery', 'Completed'].map((s) => (
          <button key={s} style={sty.statusBtn} onClick={() => onStatus(s)}>{s}</button>
        ))}
      </div>
      <div style={sty.inputRow}>
        <input
          style={sty.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSend() }}
          placeholder="Reply to customer…"
          aria-label="Reply to customer"
        />
        <button style={sty.sendBtn} onClick={onSend} disabled={!draft.trim()}>Send</button>
      </div>
    </>
  )
}

/* ─── Perk labels for the menu-card ribbon ─── */
const PERK_LABELS = {
  bogo:       { emoji: '🎁', text: 'BUY 1 GET 1 FREE' },
  freeDrink:  { emoji: '🥤', text: 'FREE DRINK' },
  freeRice:   { emoji: '🍚', text: 'FREE RICE' },
  freeFries:  { emoji: '🍟', text: 'FREE FRIES' },
  freeCoffee: { emoji: '☕', text: 'FREE COFFEE' },
  spendFree:  { emoji: '💸', text: 'SPEND Rp 50K — FREE DELIVERY' },
}

// One-time migration: when a user previously visited the retired
// /food/whatsapp app (now redirected here), their vendorId was stored
// under `vendorbasic_vendorId`. Copy it forward so the rest of the app
// — which only reads `foodlocalchat_vendorId` — picks them up seamlessly.
try {
  if (typeof window !== 'undefined' && !localStorage.getItem('foodlocalchat_vendorId') && localStorage.getItem('vendorbasic_vendorId')) {
    localStorage.setItem('foodlocalchat_vendorId', localStorage.getItem('vendorbasic_vendorId'))
  }
} catch {}

/* ─── FitIframe ──────────────────────────────────────────────────────
   Mirrors the helper in landing/src/App.jsx. Renders an iframe at its
   intrinsic design size (390×844 by default — the canonical phone-frame
   used by all saved landing themes) and CSS-transform-scales it to cover
   the parent. ResizeObserver re-measures on every parent reflow.

   Used for the curated landing-theme snapshots (e.g. /themes/donuts.html)
   so they fill the food-basic phone shell instead of rendering at their
   native size in the top-left corner. */
function FitIframe({ src, sandbox = 'allow-scripts allow-same-origin', designW = 390, designH = 844, fit = 'cover' }) {
  const wrapRef = useRef(null)
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const iframe = wrap.querySelector('iframe')
    const measure = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight
      if (!w || !h || !iframe) return
      // cover = fill parent, may crop. contain = show whole design, may letterbox.
      const scale = fit === 'contain'
        ? Math.min(w / designW, h / designH)
        : Math.max(w / designW, h / designH)
      const offsetX = (w - designW * scale) / 2
      const offsetY = (h - designH * scale) / 2
      iframe.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [src, designW, designH, fit])
  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <iframe
        src={src}
        sandbox={sandbox}
        title="Landing theme"
        style={{ position: 'absolute', top: 0, left: 0, width: designW, height: designH, border: 'none', display: 'block', transformOrigin: 'top left' }}
      />
    </div>
  )
}

/* Country list for the Shop Config autocomplete (top 3 matches surface
   under the input as the vendor types). Alphabetical. */
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia',
  'Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Cambodia','Cameroon','Canada','Cape Verde','Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France',
  'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
  'Haiti','Honduras','Hong Kong','Hungary',
  'Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast',
  'Jamaica','Japan','Jordan',
  'Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan',
  'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
  'Macau','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius',
  'Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway',
  'Oman',
  'Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
  'Qatar',
  'Romania','Russia','Rwanda',
  'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Saudi Arabia',
  'Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
  'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
  'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Vanuatu','Vatican City','Venezuela','Vietnam',
  'Yemen',
  'Zambia','Zimbabwe',
]

/* Donut landing defaults — exact values from the frozen donuts.html
   snapshot so a vendor who hasn't customised yet sees the original design. */
const DONUT_LANDING_DEFAULTS = {
  heroLine1: 'Sweet',
  heroLine2: 'Glazed',
  heroLine3: 'Donuts',
  kicker: 'Freshly Made Daily',
  subtitle: 'Hand-crafted donuts glazed and filled with love. Baked fresh every morning.',
  openNow: 'Open Now',
  flavourKicker: "Today's Flavour",
  flavour1: 'Strawberry',
  flavour2: 'Glazed',
  cta: 'Order Donuts',
  stat1Num: '24K', stat1Label: 'Guests',
  stat2Num: '5★',  stat2Label: 'Rating',
  stat3Num: '12m', stat3Label: 'Delivery',
  heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddasddasdfssdfsdfsdsdasdss-removebg-preview.png',
  bouncingImg: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_26_20%20AM.png',
  bottomLeftImg: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_30_51%20AM.png',
  flavourOrbImg: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_56_26%20AM.png',
  bgImg: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%209,%202026,%2001_52_32%20PM.png',
  pink: '#F472B6',
  pinkBright: '#EC4899',
  heroFontSize: 44,
  heroFontFamily: 'system',
}

/* DonutSplash — React port of the frozen donuts.html design. Renders the
   ENTIRE design at the original 390x844 dimensions inside an absolutely-
   positioned content layer, then uses CSS transform: scale() driven by
   ResizeObserver to fit any parent (preview phone, full app shell, theme
   browser preview, etc.). Same behaviour the old FitIframe gave us before
   the iframe was replaced with this React component. */
function DonutSplash({ landing, onEnter, languageButton = null, fit = 'cover' }) {
  const L = { ...DONUT_LANDING_DEFAULTS, ...(landing || {}) }
  const FONT_MAP = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    nunito: '"Nunito", sans-serif',
    poppins: '"Poppins", sans-serif',
    playfair: '"Playfair Display", serif',
    caveat: '"Caveat", cursive',
    bebas: '"Bebas Neue", sans-serif',
  }
  const headingFont = FONT_MAP[L.heroFontFamily] || FONT_MAP.system
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(1)
  // TIER 2 — confetti burst spawned from the CTA button on tap. Each
  // particle is deterministic per burst (Math.random captured at fire
  // time, not in render), so no jitter on re-renders.
  const [confetti, setConfetti] = useState([])
  const fireConfetti = () => {
    const colors = ['#EC4899', '#FACC15', '#22C55E', '#3B82F6', '#F472B6', '#FB923C', '#FFFFFF']
    const particles = Array.from({ length: 30 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.35
      const distance = 80 + Math.random() * 80
      return {
        id: Date.now() + i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance - 24, // bias upward — gravity feel
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 6,
        rot: (Math.random() - 0.5) * 720,
        shape: i % 3, // 0=disc, 1=streak, 2=square
      }
    })
    setConfetti(particles)
    setTimeout(() => setConfetti([]), 1200)
  }
  const handleCTA = (e) => {
    e.stopPropagation()
    fireConfetti()
    // Give the burst a beat before transitioning away.
    setTimeout(() => { if (onEnter) onEnter() }, 550)
  }
  // Memoize the heavy image + sprinkle elements so editing text in the
  // Landing Page Edit doesn't re-render them every keystroke (which was
  // causing the visible flash). Each useMemo lists ONLY the props that
  // genuinely affect its output.
  const sprinklesLayerMemo = React.useMemo(() => (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 22 }, (_, i) => {
        const colors = ['#2C1810', '#3D1F0F', '#5C3317', '#7B4B2A', '#8B5A2B', '#A0522D']
        const leftPct = 60 + ((i * 19) % 38)
        const topPx = 60 + ((i * 29) % 140)
        const delay = ((i * 11) % 100) / 14
        const duration = 4 + (i % 4) * 0.6
        const size = 5 + (i % 3) * 2
        const color = colors[i % colors.length]
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${leftPct}%`, top: `${topPx}px`,
            width: size, height: size,
            borderRadius: i % 2 === 0 ? '50%' : 3,
            background: color,
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
            animation: `donutSprinkleFall ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
            willChange: 'transform',
          }} />
        )
      })}
    </div>
  ), [])
  const bgImgEl = React.useMemo(() => (
    L.bgImg ? <img src={L.bgImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} /> : null
  ), [L.bgImg])
  const bouncingImgEl = React.useMemo(() => (
    L.bouncingImg ? <img src={L.bouncingImg} alt="" style={{ position: 'absolute', top: 64, right: -40, width: 208, height: 208, borderRadius: '50%', objectFit: 'cover', animation: 'donutBounce 1s infinite', zIndex: 2, willChange: 'transform' }} /> : null
  ), [L.bouncingImg])
  const bottomLeftImgEl = React.useMemo(() => (
    L.bottomLeftImg ? <img src={L.bottomLeftImg} alt="" style={{ position: 'absolute', bottom: 0, left: -40, width: 176, height: 176, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 40px 140px rgba(34,211,238,0.4)', zIndex: 1 }} /> : null
  ), [L.bottomLeftImg])
  const heroImgEl = React.useMemo(() => (
    L.heroImg ? <img src={L.heroImg} alt="" style={{ width: 125, height: 125, objectFit: 'contain', flexShrink: 0, alignSelf: 'center', filter: `drop-shadow(0 8px 24px ${L.pink}66)` }} /> : null
  ), [L.heroImg, L.pink])
  const flavourOrbImgEl = React.useMemo(() => (
    L.flavourOrbImg ? <img src={L.flavourOrbImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null
  ), [L.flavourOrbImg])
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const calc = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      const sx = width / 390
      const sy = height / 844
      const next = fit === 'contain' ? Math.min(sx, sy) : Math.max(sx, sy)
      // Only update if the scale actually changed (prevents render loops if
      // ResizeObserver fires on subpixel jitter during state updates).
      setScale(prev => (Math.abs(prev - next) < 0.001 ? prev : next))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit])

  // Centering offsets: when scaled content is smaller than the wrapper
  // (contain mode) we centre it; when it's larger (cover mode) we keep it
  // top-left so the most important part (hero card) stays in view.
  const scaledW = 390 * scale
  const scaledH = 844 * scale

  return (
    <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', color: '#fff', background: L.pink || '#F472B6' }}>
      <div style={{
        position: 'absolute',
        width: 390, height: 844,
        left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center center',
      }}>
      {/* Static bg fills the frame — memoized, no re-render on text edits. */}
      {bgImgEl}

      {/* TIER 1 — Breathing pink wash. Sits over the bg image and pulses
          warm pink → cool pink → cream every 8s so the page feels alive
          without going one-note. Pure colour layer, no image required. */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${L.pinkBright}33 0%, ${L.pink}22 50%, transparent 80%)`,
        animation: 'donutBreath 8s ease-in-out infinite',
      }} />

      {languageButton}

      {/* TIER 1 — Chocolate crumbs falling FROM the bouncing donut.
          Memoized so text edits don't reflow this layer (which was the
          main source of the "flashing images" issue). */}
      {sprinklesLayerMemo}

      {/* Frame padding mirrors donuts.html: 46px top, 8px bottom, 24px sides */}
      <div style={{ position: 'absolute', inset: 0, padding: '46px 24px 8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>

        {/* Floating decoration donuts — memoized so text edits don't
            reload or remount them (was causing the visible flash). */}
        {bouncingImgEl}
        {bottomLeftImgEl}
        {/* Decorative glass circles */}
        <div style={{ position: 'absolute', top: '42%', left: -20, width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 20px 80px rgba(255,255,255,0.08)', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 160, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 20px 80px rgba(255,255,255,0.08)', zIndex: 1 }} />

        <style>{`
          @keyframes donutBounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); } }
          @keyframes donutPulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          @keyframes donutBreath { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
          @keyframes donutSprinkleFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 8% { opacity: 0.85; } 92% { opacity: 0.85; } 100% { transform: translateY(900px) rotate(720deg); opacity: 0; } }
          @keyframes donutHeadingGlow {
            0%, 100% { text-shadow: 0 0 8px ${L.pink}99, 0 0 18px ${L.pink}66; }
            50% { text-shadow: 0 0 24px ${L.pink}, 0 0 40px ${L.pink}99, 0 0 60px ${L.pink}55; }
          }
          @keyframes donutMarqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes donutCardTilt {
            0%, 100% { transform: perspective(1400px) rotateX(2deg) rotateY(-2deg); }
            25% { transform: perspective(1400px) rotateX(-1deg) rotateY(2deg); }
            50% { transform: perspective(1400px) rotateX(-2deg) rotateY(2deg); }
            75% { transform: perspective(1400px) rotateX(1deg) rotateY(-1deg); }
          }
          @keyframes donutConfettiBurst {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
            70% { opacity: 1; }
            100% { transform: translate(var(--tx, 0px), var(--ty, 0px)) rotate(var(--rot, 0deg)) scale(0.6); opacity: 0; }
          }
        `}</style>

        {/* Main card — ambient 3D tilt cycles continuously so the splash
            feels physical without needing pointer/gyro input. */}
        <div style={{ position: 'relative', zIndex: 3, width: '100%', maxWidth: 430, minHeight: 600, borderRadius: 48, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', overflow: 'visible', boxShadow: '0 40px 140px rgba(0,0,0,0.55)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', animation: 'donutCardTilt 14s ease-in-out infinite', transformStyle: 'preserve-3d' }}>
        {/* (scaled-content layer continues below) */}
          {/* radial gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 35%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 40, width: 2, height: '100%', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)', pointerEvents: 'none' }} />

          {/* Header — Open Now pill */}
          <div style={{ position: 'relative', zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: L.pinkBright, border: `1px solid ${L.pink}66`, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 10px 40px rgba(236,72,153,0.5)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'donutPulseDot 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: '#fff', textTransform: 'uppercase' }}>{L.openNow}</span>
            </span>
          </div>

          {/* Hero */}
          <div style={{ position: 'relative', zIndex: 4, marginTop: 12 }}>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{L.kicker}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              {/* Heading — pink lines render as solid colour (no glow / no
                  animation) per user spec. */}
              <h1 style={{ fontSize: L.heroFontSize, lineHeight: 0.85, letterSpacing: '-0.06em', fontWeight: 900, flex: 1, minWidth: 0, margin: 0, fontFamily: headingFont }}>
                {L.heroLine1}<br />
                <span style={{ color: L.pink }}>{L.heroLine2}</span>
                <span style={{ display: 'block', color: L.pink }}>{L.heroLine3}</span>
              </h1>
              {heroImgEl}
            </div>
            <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.4, maxWidth: 310, margin: 0, fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{L.subtitle}</p>
            {/* TIER 1 — Live customer feed marquee. Scrolls horizontally with
                a duplicated list so the loop appears seamless. Sample events
                until we wire in real orders/reviews. */}
            <div style={{ marginTop: 12, height: 22, overflow: 'hidden', position: 'relative', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 4 }}>
              {(() => {
                const events = [
                  `👤 Maya P. just ordered ${L.flavour1} ${L.flavour2}`,
                  '⭐ Jordan L. left a 5-star review',
                  '🛵 Ravi G. picked up — delivery in 12m',
                  '👤 Chloe B. just ordered Sprinkle Donut',
                  '⭐ Ava M. left a 5-star review',
                  '🍩 Marcus R. ordered Glazed × 6',
                ]
                const loop = [...events, ...events]
                return (
                  <div style={{ display: 'flex', gap: 28, whiteSpace: 'nowrap', animation: 'donutMarqueeScroll 40s linear infinite', willChange: 'transform' }}>
                    {loop.map((e, i) => (
                      <span key={i} style={{ fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{e}</span>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Featured / CTA */}
          <div style={{ position: 'relative', zIndex: 4, marginTop: 12, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', padding: 12, boxShadow: '0 30px 100px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -20, width: 128, height: 128, borderRadius: '50%', background: `${L.pinkBright}1a`, filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{L.flavourKicker}</div>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 0.95 }}>
                  {L.flavour1}
                  <span style={{ display: 'block', color: L.pink }}>{L.flavour2}</span>
                </div>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${L.pinkBright}, ${L.pink})`, boxShadow: `0 20px 80px ${L.pinkBright}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {flavourOrbImgEl}
              </div>
            </div>
            {/* CTA + confetti burst. Wrapping div positions the particle
                emitter precisely at the button's centre. */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={handleCTA}
                style={{ width: '100%', height: 56, borderRadius: 22, border: 'none', background: `linear-gradient(to right, ${L.pinkBright}, ${L.pink})`, color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer', boxShadow: `0 30px 100px ${L.pinkBright}73`, transition: 'transform 0.3s ease', fontFamily: 'inherit' }}
              >{L.cta}</button>
              {confetti.length > 0 && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, pointerEvents: 'none', zIndex: 20 }}>
                  {confetti.map(p => (
                    <div
                      key={p.id}
                      style={{
                        position: 'absolute',
                        left: -p.size / 2, top: -p.size / 2,
                        width: p.shape === 1 ? p.size * 0.5 : p.size,
                        height: p.shape === 1 ? p.size * 2 : p.size,
                        background: p.color,
                        borderRadius: p.shape === 0 ? '50%' : p.shape === 2 ? 2 : 1,
                        boxShadow: `0 0 6px ${p.color}88`,
                        animation: 'donutConfettiBurst 1s ease-out forwards',
                        ['--tx']: `${p.tx}px`,
                        ['--ty']: `${p.ty}px`,
                        ['--rot']: `${p.rot}deg`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div style={{ position: 'relative', zIndex: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
            {[
              { num: L.stat1Num, label: L.stat1Label },
              { num: L.stat2Num, label: L.stat2Label },
              { num: L.stat3Num, label: L.stat3Label },
            ].map((m, i) => (
              <div key={i} style={{ borderRadius: 16, background: `${L.pinkBright}26`, border: `1px solid ${L.pink}4d`, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{m.num}</div>
                <div style={{ fontSize: 13, color: '#fff', marginTop: 4, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

/* ─── Main App ─── */
export default function App() {
  // Route to admin or activate page
  const params = new URLSearchParams(window.location.search)
  const viewMode = params.get('view') || (window.location.pathname === '/admin' ? 'admin' : window.location.pathname === '/activate' ? 'activate' : null)

  if (viewMode === 'admin') return <AdminDashboard />
  if (viewMode === 'activate') return <ActivatePage />

  /* --- Traffic-source capture (powers 2bee Traffic & Funnel tab) --- */
  useEffect(() => {
    if (!supabase) return
    try {
      const qs = new URLSearchParams(window.location.search)
      let sid = localStorage.getItem('sl_session_id')
      if (!sid) {
        sid = (crypto.randomUUID && crypto.randomUUID()) ||
              ('s_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10))
        localStorage.setItem('sl_session_id', sid)
      }
      supabase.from('traffic_events').insert({
        app_id: 'food-basic',
        session_id: sid,
        utm_source: qs.get('utm_source'),
        utm_medium: qs.get('utm_medium'),
        utm_campaign: qs.get('utm_campaign'),
        utm_content: qs.get('utm_content'),
        utm_term: qs.get('utm_term'),
        referrer: document.referrer || null,
        landing_path: window.location.pathname + window.location.search,
        user_agent: navigator.userAgent,
        event_type: 'first_visit',
      }).then(() => {}, () => {})
      // Also fire the funnel step — same session_id, separate table.
      emitFunnelStep('landing_viewed')
    } catch {}
  }, [])

  /* --- Auto-healing + Health reporting --- */
  const APP_VERSION = '1.0.0'
  useEffect(() => {
    if (isDemo || isPreview || !supabase) return
    const vid = localStorage.getItem('foodlocalchat_vendorId')
    if (!vid || String(vid).startsWith('local')) return

    // Auto-heal: detect and fix broken states
    const errors = []
    const theme = localStorage.getItem('foodlocalchat_theme')
    const accentColor = localStorage.getItem('foodlocalchat_accentColor')
    const themeBg = localStorage.getItem('foodlocalchat_themeBg')

    // Fix invalid accent color
    if (accentColor && !/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
      localStorage.setItem('foodlocalchat_accentColor', '#8DC63F')
      errors.push('Invalid accent color reset')
    }
    // Fix missing theme background
    if (theme && theme !== 'custom' && !themeBg) {
      const preset = THEME_PRESETS.find(t => t.id === theme)
      if (preset) { localStorage.setItem('foodlocalchat_themeBg', preset.img); errors.push('Missing theme bg restored') }
    }
    // Fix NaN prices in menu
    try {
      const menu = JSON.parse(localStorage.getItem('foodlocalchat_menu') || '[]')
      let fixed = false
      menu.forEach(item => { if (isNaN(item.price) || item.price < 0) { item.price = 0; fixed = true } })
      if (fixed) { localStorage.setItem('foodlocalchat_menu', JSON.stringify(menu)); errors.push('NaN prices fixed') }
    } catch { errors.push('Corrupt menu JSON') }

    // Check for remote config (force reset, maintenance, announcements)
    supabase.from('vendor_status').select('force_reset, reset_theme, reset_accent').eq('vendor_id', vid).maybeSingle().then(({ data }) => {
      if (data?.force_reset) {
        const newTheme = data.reset_theme || 'noodle'
        const newAccent = data.reset_accent || '#8B0000'
        const preset = THEME_PRESETS.find(t => t.id === newTheme)
        if (preset) {
          localStorage.setItem('foodlocalchat_theme', newTheme)
          localStorage.setItem('foodlocalchat_themeBg', preset.img)
          localStorage.setItem('foodlocalchat_accentColor', newAccent)
          const bgImg = document.getElementById('app-bg-img')
          if (bgImg) bgImg.src = preset.img
          supabase.from('vendor_status').update({ force_reset: false }).eq('vendor_id', vid)
          window.location.reload()
        }
      }
    })

    // Report health
    const menuCount = JSON.parse(localStorage.getItem('foodlocalchat_menu') || '[]').length
    const status = errors.length > 0 ? 'warning' : 'healthy'
    supabase.from('vendor_health_logs').insert({
      vendor_id: vid, status, app_version: APP_VERSION,
      theme_id: theme, accent_color: accentColor, menu_count: menuCount,
      error_message: errors.length > 0 ? errors.join('; ') : null,
      user_agent: navigator.userAgent, screen_width: window.innerWidth,
    })
    // Update vendor status summary
    supabase.from('vendor_status').upsert({
      vendor_id: vid, last_health_check: new Date().toISOString(),
      current_status: status, theme_id: theme, accent_color: accentColor,
      menu_count: menuCount, app_version: APP_VERSION,
      error_count: errors.length, needs_attention: errors.length > 0,
    }, { onConflict: 'vendor_id' })
  }, [])

  /* --- Agent referral tracking --- */
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref && supabase) {
      // Store ref for attribution on purchase
      localStorage.setItem('sl_agent_ref', ref)
      // Record click
      supabase.from('affiliate_agents').select('id, total_clicks').eq('agent_code', ref).single().then(({ data }) => {
        if (data) {
          supabase.from('affiliate_agents').update({ total_clicks: (data.total_clicks || 0) + 1 }).eq('id', data.id)
        }
      })
    }
  }, [])

  /* --- Demo page setup --- */
  useEffect(() => {
    if (!isDemo || demoPage === 'landing') return
    if (demoPage === 'menu') { setShowLanding(false) }
    if (demoPage === 'item') { setShowLanding(false); setTimeout(() => setItemModal(DEMO_MENU[0]), 100) }
    if (demoPage === 'checkout') { setShowLanding(false); setCart([{ ...DEMO_MENU[0], qty: 2 }, { ...DEMO_MENU[5], qty: 1 }]); setTimeout(() => { setCheckoutOpen(true); setOrderDone(false) }, 100) }
    if (demoPage === 'sent') { setShowLanding(false); setCart([{ ...DEMO_MENU[0], qty: 1 }]); setTimeout(() => { setCheckoutOpen(true); setOrderDone(true) }, 100) }
    if (demoPage === 'visit') { setShowLanding(false); setTimeout(() => setShowLocation(true), 100) }
  }, [])

  /* --- i18n --- */
  const { locale, setLocale, t, nativeLang, countryCode, LANG_TO_COUNTRIES } = useAppLocale()

  /* --- Check vendor activation status for public visitors --- */
  const [publicVendorStatus, setPublicVendorStatus] = useState(null)
  const [publicVendorName, setPublicVendorName] = useState('')
  const [publicVendorLogo, setPublicVendorLogo] = useState('')
  useEffect(() => {
    // Check if this is a vendor's public page (has slug in URL or stored vendor ID)
    const storedId = localStorage.getItem('foodlocalchat_vendorId')
    if (storedId && !String(storedId).startsWith('local') && supabase) {
      supabase.from('vendor_accounts').select('status,shop_name,shop_logo').eq('id', storedId).single().then(({ data }) => {
        if (data) {
          setPublicVendorStatus(data.status || 'pending')
          setPublicVendorName(data.shop_name || '')
          setPublicVendorLogo(data.shop_logo || '')
        }
      })
    }
  }, [])

  /* --- State --- */
  const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true'
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true' // isolated preview — ignores localStorage
  const demoPage = new URLSearchParams(window.location.search).get('page') || 'landing'
  // Vendor toggle: when off, the donut splash / branded landing is skipped
  // and customers land directly on the menu/home. Persisted in localStorage.
  const [landingEnabled, setLandingEnabled] = useState(() => {
    if (isDemo) return true
    const saved = localStorage.getItem('foodlocalchat_landing_enabled')
    return saved === null ? true : saved === 'true'
  })
  useEffect(() => {
    try { localStorage.setItem('foodlocalchat_landing_enabled', String(landingEnabled)) } catch {}
  }, [landingEnabled])
  const [showLanding, setShowLanding] = useState(() => {
    if (isDemo) return demoPage === 'landing'
    // vendorbasic_vendorId fallback preserves state for users migrating from
    // the retired /food/whatsapp app (which used that localStorage key).
    const id = new URLSearchParams(window.location.search).get('vendor') || localStorage.getItem('foodlocalchat_vendorId') || localStorage.getItem('vendorbasic_vendorId') || localStorage.getItem('indoo_vendor_id')
    // Honour the landing-disabled toggle: customers land on the menu directly
    // when the vendor has switched the landing splash off.
    const landingOn = (localStorage.getItem('foodlocalchat_landing_enabled') !== 'false')
    return !id && landingOn
  })
  // If the vendor switches landing OFF mid-session, drop the splash immediately
  // (e.g. they're toggling while previewing the customer flow).
  useEffect(() => {
    if (!landingEnabled && showLanding) setShowLanding(false)
  }, [landingEnabled, showLanding])
  const [menuItems, setMenuItems] = useState(() => isDemo ? DEMO_MENU : loadJSON('foodlocalchat_menu', DEMO_MENU))
  const [cart, setCart] = useState([])
  const [isVendor, setIsVendor] = useState(() => {
    if (isDemo) return false
    const params = new URLSearchParams(window.location.search)
    const urlVendor = params.get('vendor')
    const urlCity = params.get('city')
    const urlCountry = params.get('country')
    if (urlVendor) {
      localStorage.setItem('foodlocalchat_vendorId', urlVendor)
      localStorage.setItem('indoo_vendor_id', urlVendor)
      if (urlCity) localStorage.setItem('foodlocalchat_shopCity', urlCity)
      if (urlCountry) localStorage.setItem('foodlocalchat_shopCountry', urlCountry)
      // Auto-set delivery rates for new vendors
      const countryCode = params.get('cc')
      if (countryCode && !localStorage.getItem('foodlocalchat_delRatesSet')) {
        const rates = getDeliveryDefaults(countryCode, urlCity)
        localStorage.setItem('foodlocalchat_delMin', rates.minCharge)
        localStorage.setItem('foodlocalchat_delMinKm', rates.minKm)
        localStorage.setItem('foodlocalchat_delPerKm', rates.perKm)
        localStorage.setItem('foodlocalchat_delMax', rates.maxKm)
        localStorage.setItem('foodlocalchat_delCurrency', rates.currency)
        localStorage.setItem('foodlocalchat_delRatesSet', 'true')
      }
    }
    const id = urlVendor || localStorage.getItem('foodlocalchat_vendorId') || localStorage.getItem('indoo_vendor_id')
    return !!id
  })
  const [vendorLogin, setVendorLogin] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [itemModal, setItemModal] = useState(null) // item being viewed
  const [modalQty, setModalQty] = useState(1)
  const [modalVariant, setModalVariant] = useState(null)        // picked variant in the item modal
  const [modalModifiers, setModalModifiers] = useState([])      // checked modifiers in the modal
  const [modalPhotoIdx, setModalPhotoIdx] = useState(0)         // primary=0; gallery starts at 1
  const modalSwipeStartX = useRef(null)                          // touch tracking for image gallery swipe
  const [modalNote, setModalNote] = useState('')                 // per-item note set by customer in the modal
  const [modalNoteOpen, setModalNoteOpen] = useState(false)      // progressive disclosure — note field hidden until tapped
  // Reset modal selections whenever a new item opens — auto-pick first variant if any
  useEffect(() => {
    if (itemModal) {
      setModalVariant((itemModal.variants && itemModal.variants.length > 0) ? itemModal.variants[0] : null)
      setModalModifiers([])
      setModalPhotoIdx(0)
      setModalNote('')
      setModalNoteOpen(false)
    }
  }, [itemModal])
  const [editItem, setEditItem] = useState(null) // item being edited by vendor
  const [addingItem, setAddingItem] = useState(false)
  const [shopConfig, setShopConfig] = useState(false) // show shop config
  const [designStudio, setDesignStudio] = useState(false) // show design studio
  const [menuCardsPage, setMenuCardsPage] = useState(false) // donut-only menu-cards customisation page
  const [donutTypesPage, setDonutTypesPage] = useState(false) // donut-only "Meet our donuts" editor for the vendor
  const [donutTypesGallery, setDonutTypesGallery] = useState(false) // customer-side swipe gallery
  const [donutTypesIdx, setDonutTypesIdx] = useState(0) // active card in the swipe gallery
  const [donutTypesEditIdx, setDonutTypesEditIdx] = useState(0) // active type in the vendor step-by-step editor
  // Customer reviews — v1 stores to localStorage per vendor. Production-grade
  // public visibility across customers requires Supabase (separate migration).
  // Each: { id, rating: 1-5, comment, name, createdAt }
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '', name: '' })
  const [reviews, setReviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foodlocalchat_reviews') || '[]') } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem('foodlocalchat_reviews', JSON.stringify(reviews)) } catch {} }, [reviews])
  const reviewsAvg = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) : 0
  const submitReview = () => {
    if (!reviewForm.rating) return
    const review = {
      id: Date.now(),
      rating: reviewForm.rating,
      comment: (reviewForm.comment || '').trim().slice(0, 280),
      name: (reviewForm.name || '').trim().slice(0, 40) || 'Guest',
      createdAt: new Date().toISOString(),
    }
    setReviews(prev => [review, ...prev])
    setReviewForm({ rating: 0, comment: '', name: '' })
  }
  // Per-item reviews (donut theme). Map of itemId → Review[]. Each review:
  // { id, rating, comment, name, orderRef, verified, createdAt }. Verification
  // works only on the device that placed the order — `foodlocalchat_my_orders`
  // is populated at checkout (see saveOrder below); entering a matching ref on
  // the review form earns the ✓ Verified badge with the ref masked.
  const [reviewsByItem, setReviewsByItem] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foodlocalchat_reviews_by_item') || '{}') } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem('foodlocalchat_reviews_by_item', JSON.stringify(reviewsByItem)) } catch {} }, [reviewsByItem])
  const [itemReviewsOpen, setItemReviewsOpen] = useState(null) // the item object whose reviews page is showing
  const [leaveReviewOpen, setLeaveReviewOpen] = useState(false)
  const [itemReviewForm, setItemReviewForm] = useState({ rating: 0, comment: '', name: '', orderRef: '', error: '' })
  const isVerifiedOrderRef = (ref) => {
    const r = String(ref || '').trim().toUpperCase()
    if (!r || !/^[A-Z]{1,4}-\d{6}$/.test(r)) return false
    try {
      const orders = JSON.parse(localStorage.getItem('foodlocalchat_my_orders') || '[]')
      return orders.some(o => o.orderNumber === r)
    } catch { return false }
  }
  const maskOrderRef = (ref) => {
    const m = String(ref || '').match(/^([A-Z]{1,4})-(\d{3})(\d{3})$/)
    return m ? `${m[1]}-•••${m[3]}` : ref
  }
  const submitItemReview = () => {
    if (!itemReviewsOpen) return
    if (!itemReviewForm.rating) {
      setItemReviewForm(p => ({ ...p, error: 'Please pick a star rating before submitting.' }))
      return
    }
    const ref = (itemReviewForm.orderRef || '').trim().toUpperCase()
    if (!ref) {
      setItemReviewForm(p => ({ ...p, error: 'Order reference number is required. Enter the ref from your order to leave a review.' }))
      return
    }
    if (!/^[A-Z]{1,4}-\d{6}$/.test(ref)) {
      setItemReviewForm(p => ({ ...p, error: 'Invalid format. Order ref looks like e.g. DD-487193 (letters, dash, 6 digits).' }))
      return
    }
    if (!isVerifiedOrderRef(ref)) {
      setItemReviewForm(p => ({ ...p, error: 'We couldn\'t verify that order ref. Only customers with a valid order can leave a review.' }))
      return
    }
    const review = {
      id: Date.now(),
      rating: itemReviewForm.rating,
      comment: (itemReviewForm.comment || '').trim().slice(0, 280),
      name: (itemReviewForm.name || '').trim().slice(0, 40) || 'Guest',
      orderRef: ref,
      verified: true,
      createdAt: new Date().toISOString(),
    }
    const key = itemReviewsOpen.id || itemReviewsOpen.name
    setReviewsByItem(prev => ({ ...prev, [key]: [review, ...(prev[key] || [])] }))
    setItemReviewForm({ rating: 0, comment: '', name: '', orderRef: '', error: '' })
    setLeaveReviewOpen(false)
  }
  // Vendor-uploaded content per donut type: { typeName: { image, description } }.
  // A type "publishes" to the customer swipe gallery only when BOTH image and
  // description are filled — otherwise it lives only in the vendor dashboard.
  const [donutTypesContent, setDonutTypesContent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foodlocalchat_donut_types') || '{}') } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_types', JSON.stringify(donutTypesContent)) } catch {} }, [donutTypesContent])
  // Shared color palette drawer — opened from any color picker in the Menu
  // Cards page. Holds { title, current, onPick(hex) }.
  const [colorPalette, setColorPalette] = useState(null)
  // Donut menu-card customisation. All values are empty strings on standard
  // themes — the render paths only read them when shopTheme === 'donut', so
  // other themes see no change.
  const [donutCardStyle, setDonutCardStyle] = useState(() => localStorage.getItem('foodlocalchat_donut_card_style') || 'solid') // 'solid' | 'glass' | 'frosted' | 'image'
  const [donutCardColor, setDonutCardColor] = useState(() => localStorage.getItem('foodlocalchat_donut_card_color') || '#1a1a1a') // drives Solid bg + Glass/Frosted tint. Default = near-black so first-time Solid renders white name + gray description.
  const [donutCardImage, setDonutCardImage] = useState(() => localStorage.getItem('foodlocalchat_donut_card_image') || '')
  const [donutFrameColor, setDonutFrameColor] = useState(() => localStorage.getItem('foodlocalchat_donut_frame_color') || '') // empty = use theme accent
  const [donutPromoColor, setDonutPromoColor] = useState(() => localStorage.getItem('foodlocalchat_donut_promo_color') || '') // empty = use theme accent
  // Donut Add-to-Cart button styling
  const [donutAddBtnShape, setDonutAddBtnShape] = useState(() => localStorage.getItem('foodlocalchat_donut_addbtn_shape') || 'circle') // 'circle' | 'pill'
  const [donutAddBtnColor, setDonutAddBtnColor] = useState(() => localStorage.getItem('foodlocalchat_donut_addbtn_color') || '') // empty = use promo bar color
  const [donutAddBtnTextColor, setDonutAddBtnTextColor] = useState(() => localStorage.getItem('foodlocalchat_donut_addbtn_text_color') || '#ffffff')
  const [donutAddBtnText, setDonutAddBtnText] = useState(() => localStorage.getItem('foodlocalchat_donut_addbtn_text') || 'Add to Cart')
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_addbtn_shape', donutAddBtnShape) } catch {} }, [donutAddBtnShape])
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_addbtn_color', donutAddBtnColor) } catch {} }, [donutAddBtnColor])
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_addbtn_text_color', donutAddBtnTextColor) } catch {} }, [donutAddBtnTextColor])
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_addbtn_text', donutAddBtnText) } catch {} }, [donutAddBtnText])
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_card_style', donutCardStyle) } catch {} }, [donutCardStyle])
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_card_color', donutCardColor) } catch {} }, [donutCardColor])
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_card_image', donutCardImage) } catch {} }, [donutCardImage])
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_frame_color', donutFrameColor) } catch {} }, [donutFrameColor])
  useEffect(() => { try { localStorage.setItem('foodlocalchat_donut_promo_color', donutPromoColor) } catch {} }, [donutPromoColor])
  const [landingThemePicker, setLandingThemePicker] = useState(false) // theme picker modal inside design studio
  const [landingThemeId, setLandingThemeId] = useState(() => {
    // When the customer arrives from landing's "Use This Theme" with ?theme=donut,
    // also auto-select the matching curated splash ('donuts') so the donut HTML
    // renders as their app's landing — accent + bg already wired via THEME_PRESETS.
    const urlTheme = new URLSearchParams(window.location.search).get('theme')
    if (urlTheme === 'donut') {
      try { localStorage.setItem('foodlocalchat_landing_theme_id', 'donuts') } catch {}
      return 'donuts'
    }
    return localStorage.getItem('foodlocalchat_landing_theme_id') || null
  })
  const donutsHtmlSrc = window.location.hostname === 'localhost'
    ? 'http://localhost:5173/themes/donuts.html'
    : window.location.origin + '/themes/donuts.html'

  // Donut landing edit state — every text/image/colour the vendor can change
  // on the donut landing splash. Defaults exactly match the frozen donuts.html
  // snapshot so the page looks identical until the vendor customises it.
  const [donutLanding, setDonutLanding] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('foodlocalchat_donut_landing') || 'null')
      return { ...DONUT_LANDING_DEFAULTS, ...(saved || {}) }
    } catch { return DONUT_LANDING_DEFAULTS }
  })
  useEffect(() => {
    try { localStorage.setItem('foodlocalchat_donut_landing', JSON.stringify(donutLanding)) } catch {}
  }, [donutLanding])
  const setDonutField = (k, v) => setDonutLanding(p => ({ ...p, [k]: v }))
  const resetDonutLanding = () => setDonutLanding({ ...DONUT_LANDING_DEFAULTS })

  // CASCADE — the master pink set in Landing Page Edit becomes the app
  // accent for donut theme, so every downstream component that falls back
  // to `accent` (frame stripes, promo bar, buttons, etc.) automatically
  // follows the master. Per-section overrides still win if explicitly set.
  // Shared palette picker drawer — any colour input opens this so vendors
  // pick from one consistent palette across the whole donut customisation.
  const [colorPickerTarget, setColorPickerTarget] = useState(null) // { value, onChange, label, allowInherit?, onInherit? }
  // Clear any stale uploaded-hero state from previous sessions so the donut
  // iframe always loads its original frozen illustration.
  try { localStorage.removeItem('foodlocalchat_donut_hero') } catch {}
  // Listen for the frozen theme iframe's CTA tap (e.g. "Order Donuts" → posts
  // sl-theme-enter-menu). Drop the splash when received so the menu reveals.
  useEffect(() => {
    const onMsg = (e) => { if (e && e.data && e.data.type === 'sl-theme-enter-menu') setShowLanding(false) }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])
  // Curated landing themes — frozen snapshots, separate from Design Studio's customisable tokens.
  const LANDING_THEMES = [
    {
      id: 'donuts',
      name: 'Donuts — Sweet Glazed',
      tagline: 'Hand-crafted donut shop landing with pink palette',
      previewUrl: '/themes/donuts.html',
    },
  ]
  const [themeBrowser, setThemeBrowser] = useState(false) // show theme browser
  const [themeSearch, setThemeSearch] = useState('')
  const [themeCountry, setThemeCountry] = useState('all')
  const [themePreviewId, setThemePreviewId] = useState(null)
  const [themePreviewImg, setThemePreviewImg] = useState(null) // active variant image in preview
  const [themePreviewPage, setThemePreviewPage] = useState('landing') // landing | menu
  const [themeCountryDrawer, setThemeCountryDrawer] = useState(false)
  const [showDeliverySettings, setShowDeliverySettings] = useState(false)
  const [domainPage, setDomainPage] = useState(false)
  const [termsOfListing, setTermsOfListing] = useState(false)
  const [vendorDrawer, setVendorDrawer] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const urlThemeParam = new URLSearchParams(window.location.search).get('theme')
  const urlThemePreset = urlThemeParam ? THEME_PRESETS.find(t => t.id === urlThemeParam) : null
  // Demo is locked to noodle (red) regardless of URL params. New vendors also start on noodle.
  const [shopTheme, setShopTheme] = useState(() => isDemo ? 'noodle' : urlThemePreset ? urlThemePreset.id : isPreview ? 'noodle' : (localStorage.getItem('foodlocalchat_theme') || 'noodle'))
  const [shopAccentColor, setShopAccentColor] = useState(() => isDemo ? '#8B0000' : urlThemePreset ? urlThemePreset.accent : isPreview ? '#8B0000' : (localStorage.getItem('foodlocalchat_accentColor') || '#8B0000'))
  // CASCADE — on donut theme, keep the app accent + saved accent in
  // lock-step with the master pink from Landing Page Edit. Every section
  // that falls back to `accent` (frame, promo, buttons, drawer chrome)
  // therefore updates automatically when the vendor picks a new master
  // colour. Declared AFTER both shopTheme + shopAccentColor (TDZ-safe).
  useEffect(() => {
    if (shopTheme === 'donut' && donutLanding.pink && donutLanding.pink !== shopAccentColor) {
      setShopAccentColor(donutLanding.pink)
      try { localStorage.setItem('foodlocalchat_accentColor', donutLanding.pink) } catch {}
    }
  }, [shopTheme, donutLanding.pink, shopAccentColor])
  const [themeEditor, setThemeEditor] = useState(null) // { url, posX, posY } or null
  const [editorColor, setEditorColor] = useState('#8DC63F')
  const [editorBaseColor, setEditorBaseColor] = useState('#8DC63F')
  const [editorPos, setEditorPos] = useState({ x: 50, y: 50 }) // percentage position

  // Apply ?theme= param background on mount (only if index.html didn't already via &bg=)
  useEffect(() => {
    const hasBgParam = new URLSearchParams(window.location.search).get('bg')
    if (hasBgParam) return // index.html already set it
    if (urlThemePreset) {
      const bgImg = document.getElementById('app-bg-img')
      if (bgImg) { bgImg.src = urlThemePreset.img; bgImg.style.objectFit = 'fill' }
    }
  }, [])

  // Keep the global app-bg-img in sync with shopTheme on EVERY change, no matter the path.
  // Without this, the landing page (React <img>) shows the current theme but the
  // app-shell <img id="app-bg-img"> stays on whatever it was loaded with at first paint.
  useEffect(() => {
    const preset = THEME_PRESETS.find(t => t.id === shopTheme)
    const bgUrl = preset?.img || localStorage.getItem('foodlocalchat_themeBg')
    if (!bgUrl) return
    try { localStorage.setItem('foodlocalchat_themeBg', bgUrl) } catch {}
    const bgImg = document.getElementById('app-bg-img')
    if (bgImg && bgImg.src !== bgUrl) {
      bgImg.src = bgUrl
      bgImg.style.objectFit = shopTheme === 'custom' ? 'cover' : 'fill'
    }
  }, [shopTheme])

  // Derive accent color from theme or custom selection
  const accent = shopAccentColor
  const accentLight = accent + '25'
  const accentBorder = accent + '40'
  const isCustomAccent = shopAccentColor !== '#8DC63F'
  // Donut menu-card derived styles. Single source of truth that all 3 card
  // variants (grid / horizontal / fullwidth) read so a single state change
  // updates every layout. Standard themes get null and fall back to legacy.
  const donutCardStyles = (() => {
    if (shopTheme !== 'donut') return null
    const tint = donutCardColor || '#ffffff'
    // Luminance-based text-colour pick — any dark surface gets white text,
    // any light surface gets dark text. Replaces the previous two-value
    // (only #1a1a1a / #000000) check so every colour the vendor picks reads.
    const luminance = (hex) => {
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return 1
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      return 0.299 * r + 0.587 * g + 0.114 * b
    }
    const textOn = (hex) => luminance(hex) < 0.55 ? '#fff' : '#1a1a1a'
    if (donutCardStyle === 'image' && donutCardImage) {
      // Image bg: assume mid-tone; default to white text with text-shadow at
      // render time would be ideal, but for now lean dark since uploads tend
      // to be light food photos.
      return { background: `url("${donutCardImage}") center/cover repeat`, backdropFilter: 'none', WebkitBackdropFilter: 'none', textColor: '#1a1a1a' }
    }
    if (donutCardStyle === 'glass') {
      return { background: tint + '1F', backdropFilter: 'blur(14px) saturate(150%)', WebkitBackdropFilter: 'blur(14px) saturate(150%)', textColor: textOn(tint) }
    }
    if (donutCardStyle === 'frosted') {
      return { background: tint + '55', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', textColor: textOn(tint) }
    }
    return { background: tint, backdropFilter: 'none', WebkitBackdropFilter: 'none', textColor: textOn(tint) }
  })()
  const donutFrameAccent = donutFrameColor || accent
  const donutPromoBarColor = donutPromoColor || accent
  // WCAG 2.1 contrast ratio (4.5:1 = AA normal text). Used by the Menu Cards
  // page to flag low-contrast colour pairings without blocking the vendor.
  const wcagContrastRatio = (hex1, hex2) => {
    const lum = (hex) => {
      const m = /^#([0-9A-Fa-f]{6})$/.exec(hex || '')
      if (!m) return 1
      const r = parseInt(m[1].slice(0, 2), 16) / 255
      const g = parseInt(m[1].slice(2, 4), 16) / 255
      const b = parseInt(m[1].slice(4, 6), 16) / 255
      const toLin = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b)
    }
    const l1 = lum(hex1), l2 = lum(hex2)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }
  // Resolved Add-to-Cart button color (falls back to promo bar color so the
  // CTA matches the active accents by default).
  const donutAddBtnBg = donutAddBtnColor || donutPromoBarColor
  // True when the donut "Image" card style is active and the vendor has
  // uploaded a bg image — in that mode the food photo is inset/shrunk so
  // the uploaded background pattern reads across the full card, not just
  // the text strip below the photo.
  const isDonutImageCard = shopTheme === 'donut' && donutCardStyle === 'image' && !!donutCardImage
  const savedBgPos = (() => { try { return JSON.parse(localStorage.getItem('foodlocalchat_bgPos')) } catch { return null } })()
  const bgStyle = shopTheme === 'custom' && savedBgPos ? { objectFit: 'cover', objectPosition: `${savedBgPos.x}% ${savedBgPos.y}%` } : { objectFit: 'fill' }
  const [delBaseFee, setDelBaseFee] = useState(() => parseInt(localStorage.getItem('foodlocalchat_delBase')) || 5000)
  const [delPerKm, setDelPerKm] = useState(() => parseInt(localStorage.getItem('foodlocalchat_delPerKm')) || 2500)
  const [delMinCharge, setDelMinCharge] = useState(() => parseInt(localStorage.getItem('foodlocalchat_delMin')) || 7000)
  const [delMaxKm, setDelMaxKm] = useState(() => parseInt(localStorage.getItem('foodlocalchat_delMax')) || 15)
  const [delFreeAbove, setDelFreeAbove] = useState(() => parseInt(localStorage.getItem('foodlocalchat_delFree')) || 0)
  const [delCurrency, setDelCurrency] = useState(() => localStorage.getItem('foodlocalchat_delCurrency') || 'Rp')
  const [delMinKm, setDelMinKm] = useState(() => parseInt(localStorage.getItem('foodlocalchat_delMinKm')) || 2)
  const [delEnabled, setDelEnabled] = useState(() => localStorage.getItem('foodlocalchat_delEnabled') !== 'false')

  /* Shop info */
  const [shopName, setShopName] = useState(() => localStorage.getItem('foodlocalchat_shopName') || 'Street Noodle')
  // Shop-name validation — emojis stripped automatically, URLs / @ handles
  // blocked outright. Error string surfaces under both shop-name inputs.
  const [shopNameError, setShopNameError] = useState('')
  const handleShopNameChange = (raw) => {
    const value = String(raw || '')
    // 1. Emojis — strip and warn (don't punish the typist; let them keep typing)
    if (/\p{Extended_Pictographic}/u.test(value)) {
      const cleaned = value.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ')
      setShopName(cleaned)
      setShopNameError('Emojis are not allowed in your shop name. They were removed.')
      return
    }
    // 2. Protocols (http://, https://, ftp://)
    if (/:\/\//i.test(value)) {
      setShopNameError('Web links are not allowed in your shop name.')
      return
    }
    // 3. www. prefix
    if (/\bwww\./i.test(value)) {
      setShopNameError('Web addresses (www.) are not allowed in your shop name.')
      return
    }
    // 4. Common domain endings (word.tld pattern, so ordinary "St. Mark" is safe)
    if (/[a-z0-9][a-z0-9-]*\.(com|net|org|io|co|app|live|shop|store|online|biz|info|me|us|uk|xyz|tech|site|page|link)\b/i.test(value)) {
      setShopNameError('Web addresses are not allowed in your shop name.')
      return
    }
    // 5. Social handles (@username)
    if (/@/.test(value)) {
      setShopNameError('Social handles (@username) are not allowed in your shop name.')
      return
    }
    setShopName(value)
    setShopNameError('')
  }
  const [shopLogo, setShopLogo] = useState(() => localStorage.getItem('foodlocalchat_shopLogo') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsadaaaa-removebg-preview.png')
  const [shopLogoStyle, setShopLogoStyle] = useState(() => localStorage.getItem('foodlocalchat_logoStyle') || 'circle') // circle | bare | off
  const [logoScale, setLogoScale] = useState(() => Number(localStorage.getItem('foodlocalchat_logoScale')) || 200) // 50-300, default 200 (2x)
  // Logo positioning INSIDE the circle so the uploaded image fits comfortably and the vendor can nudge it
  const [logoInner, setLogoInner] = useState(() => Number(localStorage.getItem('foodlocalchat_logoInner')) || 75) // 40-100% of outer circle
  const [logoOffsetX, setLogoOffsetX] = useState(() => Number(localStorage.getItem('foodlocalchat_logoOffsetX')) || 0)
  const [logoOffsetY, setLogoOffsetY] = useState(() => Number(localStorage.getItem('foodlocalchat_logoOffsetY')) || 0)
  const [heroSize, setHeroSize] = useState(() => localStorage.getItem('foodlocalchat_heroSize') || 'normal') // normal | large | xl
  const [heroFont, setHeroFont] = useState(() => localStorage.getItem('foodlocalchat_heroFont') || 'system') // system | nunito | poppins | playfair | caveat | bebas
  const [heroColor, setHeroColor] = useState(() => localStorage.getItem('foodlocalchat_heroColor') || '#ffffff')
  const [heroSubColor, setHeroSubColor] = useState(() => localStorage.getItem('foodlocalchat_heroSubColor') || '') // empty = auto from heroColor
  const [heroEffect, setHeroEffect] = useState(() => localStorage.getItem('foodlocalchat_heroEffect') || 'shadow') // shadow | glow | runGlow | outline | neon | none
  const [heroEditor, setHeroEditor] = useState(false) // full editor open
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem('foodlocalchat_shopPhone') || '6281234567890')
  const [shopOpen, setShopOpen] = useState(() => loadJSON('foodlocalchat_shopOpen', true))
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem('foodlocalchat_shopAddress') || 'Jl. Malioboro, Yogyakarta')
  const [shopHours, setShopHours] = useState(() => localStorage.getItem('foodlocalchat_shopHours') || '17:00 – 23:00')
  const defaultSchedule = { mon: { open: '17:00', close: '23:00', off: false }, tue: { open: '17:00', close: '23:00', off: false }, wed: { open: '17:00', close: '23:00', off: false }, thu: { open: '17:00', close: '23:00', off: false }, fri: { open: '17:00', close: '23:00', off: false }, sat: { open: '17:00', close: '23:00', off: false }, sun: { open: '17:00', close: '23:00', off: true } }
  const [shopSchedule, setShopSchedule] = useState(() => loadJSON('foodlocalchat_shopSchedule', defaultSchedule))
  const [shopMapsLink, setShopMapsLink] = useState(() => localStorage.getItem('foodlocalchat_shopMaps') || '')
  const [shopInstagram, setShopInstagram] = useState(() => localStorage.getItem('foodlocalchat_shopIG') || 'lummeenoodles')
  const [shopTiktok, setShopTiktok] = useState(() => localStorage.getItem('foodlocalchat_shopTT') || 'lummeenoodles')
  const [shopFacebook, setShopFacebook] = useState(() => localStorage.getItem('foodlocalchat_shopFB') || 'lummeenoodles')
  const [shopYoutube, setShopYoutube] = useState(() => localStorage.getItem('foodlocalchat_shopYT') || 'lummeenoodles')
  const [shopWebsite, setShopWebsite] = useState(() => localStorage.getItem('foodlocalchat_shopWeb') || 'www.lummeenoodles.com')
  const [shopQris, setShopQris] = useState(() => isDemo ? 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledxzxcczdsasdsadads.png' : (localStorage.getItem('foodlocalchat_shopQris') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledxzxcczdsasdsadads.png'))
  const [shopBio, setShopBio] = useState(() => localStorage.getItem('foodlocalchat_shopBio') || '')
  const [shopCity, setShopCity] = useState(() => localStorage.getItem('foodlocalchat_shopCity') || '')
  const [shopCountry, setShopCountry] = useState(() => localStorage.getItem('foodlocalchat_shopCountry') || '')
  const [countrySuggestions, setCountrySuggestions] = useState([])
  const [shopFoodType, setShopFoodType] = useState(() => localStorage.getItem('foodlocalchat_shopFoodType') || 'Indonesian Street Food')

  /* ─── Customization Features (all optional) ─── */
  const [btnShape, setBtnShape] = useState(() => localStorage.getItem('foodlocalchat_btnShape') || 'rounded')
  const [btnColor, setBtnColor] = useState(() => localStorage.getItem('foodlocalchat_btnColor') || '')
  const [btnText, setBtnText] = useState(() => localStorage.getItem('foodlocalchat_btnText') || '')
  const [btnSize, setBtnSize] = useState(() => Number(localStorage.getItem('foodlocalchat_btnSize')) || 100)
  // Button effect: 'none' | 'glow' | 'shake' | 'signal' | 'heartbeat' — only one active at a time.
  // Migrate from legacy btnGlow/btnDance booleans.
  const [btnEffect, setBtnEffect] = useState(() => {
    const saved = localStorage.getItem('foodlocalchat_btnEffect')
    if (saved) return saved
    if (localStorage.getItem('foodlocalchat_btnGlow') === 'true') return 'glow'
    if (localStorage.getItem('foodlocalchat_btnDance') === 'true') return 'shake'
    return 'none'
  })
  // Keep legacy variables alive so any unmigrated render lines still work
  const btnGlow = btnEffect === 'glow'
  const btnDance = btnEffect === 'shake'
  const [overlayOpacity, setOverlayOpacity] = useState(() => parseInt(localStorage.getItem('foodlocalchat_overlayOpacity')) || 40)
  const [landingLayout, setLandingLayout] = useState(() => localStorage.getItem('foodlocalchat_landingLayout') || 'center')
  const [customTagline, setCustomTagline] = useState(() => localStorage.getItem('foodlocalchat_customTagline') || '')
  const [menuCardStyle, setMenuCardStyle] = useState(() => localStorage.getItem('foodlocalchat_menuCardStyle') || 'horizontal')
  const [menuBanners, setMenuBanners] = useState(() => {
    // Blob URLs are session-only — if any leaked into localStorage from a
    // previous session (e.g. demo upload without cloud persist), drop them.
    const keep = u => typeof u === 'string' && !u.startsWith('blob:')
    try {
      const stored = JSON.parse(localStorage.getItem('foodlocalchat_menuBanners') || 'null')
      if (Array.isArray(stored)) return stored.filter(keep).slice(0, 5)
    } catch {}
    const single = localStorage.getItem('foodlocalchat_menuBanner') || ''
    return single && keep(single) ? [single] : []
  })
  const [menuBannerIdx, setMenuBannerIdx] = useState(0)
  // (Removed showClosedBanner toggle — when shop is closed, the banner now always shows.
  // It's basic UX clarity; vendors have no good reason to hide it.)
  const [promoBanner, setPromoBanner] = useState(() => localStorage.getItem('foodlocalchat_promoBanner') || '')
  const [promoBannerEnabled, setPromoBannerEnabled] = useState(() => localStorage.getItem('foodlocalchat_promoBannerEnabled') === 'true')
  const [promoBannerEffect, setPromoBannerEffect] = useState(() => localStorage.getItem('foodlocalchat_promoBannerEffect') || 'scroll')
  const [splashEnabled, setSplashEnabled] = useState(() => localStorage.getItem('foodlocalchat_splashEnabled') === 'true')
  const [showSplash, setShowSplash] = useState(() => localStorage.getItem('foodlocalchat_splashEnabled') === 'true')
  const [configPreviewTab, setConfigPreviewTab] = useState('landing')
  const [configTool, setConfigTool] = useState(null) // null | 'layout' | 'button' | 'text' | 'cards' | 'promo' | 'splash'

  const [showLocation, setShowLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [userDistance, setUserDistance] = useState(null)
  const [showDeals, setShowDeals] = useState(false)
  const [menuView, setMenuView] = useState('all') // 'all' or 'promo'
  const [dailyDeals, setDailyDeals] = useState(() => loadJSON('foodlocalchat_dailyDeals', []))
  const [showCustomers, setShowCustomers] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(() => localStorage.getItem('foodlocalchat_installDismissed') === 'true')
  const [customerSearch, setCustomerSearch] = useState('')
  const [promoMsg, setPromoMsg] = useState('')

  /* Checkout form */
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [addressLoading, setAddressLoading] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  // GPS → reverse-geocode via Nominatim (free, no key). Fills the address but stays editable.
  const detectAddress = () => {
    if (!navigator.geolocation) {
      alert('Location not available on this device')
      return
    }
    setAddressLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`, {
            headers: { 'Accept-Language': 'id,en' }
          })
          const data = await r.json()
          const a = data.address || {}
          // Build a clean line: house# + road + suburb + city — skip blanks
          const parts = [
            a.house_number ? `${a.house_number} ${a.road || ''}`.trim() : a.road,
            a.suburb || a.neighbourhood || a.village,
            a.city || a.town || a.county,
          ].filter(Boolean)
          const line = parts.length ? parts.join(', ') : (data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
          setCustAddress(line)
        } catch (e) {
          setCustAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        }
        setAddressLoading(false)
      },
      (err) => {
        setAddressLoading(false)
        alert('Could not get location: ' + (err.message || 'permission denied'))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
  const [payMethod, setPayMethod] = useState('cod')
  const [deliveryZones, setDeliveryZones] = useState(DEFAULT_DELIVERY_ZONES)
  const [deliveryZone, setDeliveryZone] = useState(DEFAULT_DELIVERY_ZONES[0])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [orderDone, setOrderDone] = useState(false)

  /* In-app chat state (foodlocalchat) */
  const [chatConversation, setChatConversation] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatDraft, setChatDraft] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState('')
  // Order channel picker — shown before submission only when the vendor's
  // plan_tier === 'both'. For 'whatsapp' or 'chat' tiers the customer is
  // routed directly to that channel; no choice surfaced.
  const [orderModePickerOpen, setOrderModePickerOpen] = useState(false)
  const [orderModeRemember, setOrderModeRemember] = useState(false)
  // vendor.plan_tier loaded from supabase: 'whatsapp' | 'chat' | 'both' | null
  // null = legacy vendor with no plan set; treated as 'both' for back-compat.
  const [vendorPlanTier, setVendorPlanTier] = useState(null)
  // Subscription payment state — for the post-signup "pay to activate" gate.
  const [subPickerOpen, setSubPickerOpen] = useState(false)
  const [subBusy, setSubBusy] = useState(false)
  const [subError, setSubError] = useState('')
  const [subMessage, setSubMessage] = useState('')
  // Escrow hold tracking — set when a Stripe-with-escrow order is found
  // for the current conversation. Drives the "Release funds / Cancel"
  // panel rendered in the order-done view.
  const [heldEscrowOrder, setHeldEscrowOrder] = useState(null) // { id, releaseAt, total, currency }
  const [escrowActionBusy, setEscrowActionBusy] = useState(false)
  const [escrowMessage, setEscrowMessage] = useState('')

  /* Vendor inbox state (foodlocalchat) */
  const [vendorTab, setVendorTab] = useState('shop') // 'shop' | 'orders' | 'settings'
  const [vendorConversations, setVendorConversations] = useState([])
  const [vendorActiveConv, setVendorActiveConv] = useState(null)
  // The current conversation's payment row (escrow status, gateway, totals).
  // Hydrated when the vendor opens a conversation; null when no order exists yet.
  const [vendorActiveOrder, setVendorActiveOrder] = useState(null)
  const [vendorPayActionBusy, setVendorPayActionBusy] = useState(false)
  const [vendorPayActionMsg, setVendorPayActionMsg] = useState('')
  const [vendorThreadMessages, setVendorThreadMessages] = useState([])
  const [vendorReplyDraft, setVendorReplyDraft] = useState('')
  const [vendorChimePrimed, setVendorChimePrimed] = useState(() => localStorage.getItem('foodlocalchat_chimePrimed') === 'true')
  const [vendorPushEnabled, setVendorPushEnabled] = useState(false)
  const [vendorPushBusy, setVendorPushBusy] = useState(false)
  const [vendorPushMsg, setVendorPushMsg] = useState('')

  // Payment Methods — vendor connects their OWN gateway accounts. StreetLocal never touches funds.
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false)
  // Sales dashboard — aggregates orders from vendorConversations + local
  // order_payload history. Vendor-only.
  const [salesDashboardOpen, setSalesDashboardOpen] = useState(false)
  const [setupGatewayId, setSetupGatewayId] = useState(null)        // which gateway is being configured
  const [paymentGateways, setPaymentGateways] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foodlocalchat_payment_gateways') || '{}') } catch { return {} }
  })
  useEffect(() => {
    try { localStorage.setItem('foodlocalchat_payment_gateways', JSON.stringify(paymentGateways)) } catch {}
  }, [paymentGateways])
  // Persist gateway connections to Supabase too (so Edge Functions can use the keys server-side).
  // localStorage stays as a UI cache only.
  const saveGatewayConnection = async (gatewayId, config) => {
    if (!supabase || !vendorId) return
    try {
      const map = GATEWAY_FIELD_MAP[gatewayId] || {}
      const knownCols = new Set(['server_key', 'client_key', 'webhook_secret'])
      // Escrow toggle: only meaningful for Stripe (capture_method=manual).
      // Anything other than stripe ignores these fields; they are stored
      // as dedicated columns rather than additional_config jsonb.
      const escrowCols = new Set(['escrow_enabled', 'escrow_hold_days'])
      const row = { vendor_id: vendorId, gateway_id: gatewayId, mode: config.mode || 'test', is_active: true, server_key: null, client_key: null, webhook_secret: null, additional_config: {} }
      Object.entries(config).forEach(([k, v]) => {
        if (k === 'mode') return
        if (escrowCols.has(k)) {
          if (gatewayId === 'stripe') row[k] = v
          // for non-stripe vendors silently drop the escrow toggle
          return
        }
        const mapped = map[k] || k
        if (knownCols.has(mapped)) row[mapped] = v
        else row.additional_config[k] = v
      })
      await supabase.from('vendor_payment_connections').upsert(row, { onConflict: 'vendor_id,gateway_id' })
    } catch (e) { console.warn('gateway save failed', e) }
  }
  const removeGatewayConnection = async (gatewayId) => {
    if (!supabase || !vendorId) return
    try {
      await supabase.from('vendor_payment_connections').delete()
        .eq('vendor_id', vendorId).eq('gateway_id', gatewayId)
    } catch (e) { console.warn('gateway remove failed', e) }
  }
  // Load Snap.js once when a Midtrans-using checkout is open.
  const loadSnapJs = (mode, clientKey) => new Promise((resolve, reject) => {
    if (window.snap) return resolve()
    const s = document.createElement('script')
    s.src = mode === 'live'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    s.setAttribute('data-client-key', clientKey || '')
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Midtrans Snap'))
    document.head.appendChild(s)
  })
  // Customer-side: charge via Midtrans Snap. Returns 'paid' | 'pending' | 'failed' | 'closed'.
  const payWithMidtrans = async ({ orderId, amount, items, deliveryFee, customerName, customerPhone, conversationId }) => {
    if (!supabase) return 'failed'
    const { data, error } = await supabase.functions.invoke('midtrans-create-token', {
      body: { vendorId, orderId, amount, items, deliveryFee, customerName, customerPhone, conversationId },
    })
    if (error || !data?.snapToken) {
      console.error('Snap token failed', error || data)
      return 'failed'
    }
    await loadSnapJs(data.mode, data.clientKey)
    return new Promise((resolve) => {
      window.snap.pay(data.snapToken, {
        onSuccess: () => resolve('paid'),
        onPending: () => resolve('pending'),
        onError:   () => resolve('failed'),
        onClose:   () => resolve('closed'),
      })
    })
  }
  // Customer-side: redirect to Stripe Checkout. Stripe is hosted-redirect, not modal,
  // so this function navigates away — the order is persisted as pending and the
  // webhook flips it to paid. On return Stripe appends ?stripe_status=success&order_id=…
  // which we handle on next mount (see the useEffect below).
  const payWithStripe = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('stripe-create-session', {
      body: { vendorId, orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl },
    })
    if (error || !data?.url) {
      console.error('Stripe session failed', error || data)
      return 'failed'
    }
    // Stash the in-progress order in localStorage so we can re-send the chat after redirect-back
    try { localStorage.setItem('foodlocalchat_pendingStripeOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: redirect to Xendit hosted Invoice page. Same redirect pattern
  // as Stripe — Xendit returns the customer to our returnUrl with ?xendit_status=…
  const payWithXendit = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('xendit-create-invoice', {
      body: { vendorId, orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl, description },
    })
    if (error || !data?.url) {
      console.error('Xendit invoice failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingXenditOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: redirect to PayPal's hosted approval page. Returns to our app
  // with ?paypal_status=success on approve, paypal_status=cancel on backout.
  const payWithPayPal = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('paypal-create-order', {
      body: { vendorId, orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl },
    })
    if (error || !data?.url) {
      console.error('PayPal order failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingPayPalOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: redirect to Razorpay's hosted payment-link page.
  // Razorpay supports UPI / cards / NetBanking / wallets at this URL.
  const payWithRazorpay = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('razorpay-create-link', {
      body: { vendorId, orderId, amount, currency: currency || 'INR', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl, description },
    })
    if (error || !data?.url) {
      console.error('Razorpay link failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingRazorpayOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: Braintree Drop-in UI modal (NOT a redirect).
  // 1) Fetch a client token from the Edge Function
  // 2) Lazy-load the Drop-in script from CDN
  // 3) Render Drop-in into a hidden container, wait for the nonce
  // 4) POST the nonce to braintree-charge which executes the sale synchronously
  // Returns 'paid' | 'failed' | 'closed' just like payWithMidtrans.
  const loadBraintreeDropin = () => new Promise((resolve, reject) => {
    if (window.braintree?.dropin) return resolve()
    const s = document.createElement('script')
    s.src = 'https://js.braintreegateway.com/web/dropin/1.42.0/js/dropin.min.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Braintree Drop-in'))
    document.head.appendChild(s)
  })
  const loadWorldpayJs = () => new Promise((resolve, reject) => {
    if (window.Worldpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://cdn.worldpay.com/v1/worldpay.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Worldpay.js'))
    document.head.appendChild(s)
  })
  // Customer-side: 2Checkout (Verifone) Buy Link hosted checkout.
  // Standard GET redirect to a 2Checkout-hosted purchase page.
  const payWithTwoCheckout = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('twocheckout-create-link', {
      body: { vendorId, orderId, amount, currency: currency || 'USD', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl, description },
    })
    if (error || !data?.url) {
      console.error('2Checkout link failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingTcOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: CyberSource Secure Acceptance Hosted Checkout.
  // The Edge Function returns the hosted URL + a signed set of form fields;
  // we POST them to CyberSource via a hidden auto-submitting form (same
  // pattern as Authorize.net Accept Hosted).
  const payWithCyberSource = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('cybersource-create-session', {
      body: { vendorId, orderId, amount, currency: currency || 'USD', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl },
    })
    if (error || !data?.url || !data?.fields) {
      console.error('CyberSource session failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingCsOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = data.url
    form.style.display = 'none'
    Object.entries(data.fields).forEach(([k, v]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = k
      input.value = String(v ?? '')
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
    return 'redirecting'
  }
  // Customer-side: Authorize.net Accept Hosted page.
  // Unlike the other hosted gateways, Authorize.net expects us to POST
  // the token to their payment URL (not GET-redirect). We build a
  // hidden form and submit it programmatically.
  const payWithAuthorizeNet = async ({ orderId, amount, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('authorize-net-create-token', {
      body: { vendorId, orderId, amount, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl },
    })
    if (error || !data?.token || !data?.hostedUrl) {
      console.error('Authorize.net token failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingAnetOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    // Build a hidden form and auto-submit — this is the standard
    // Accept Hosted handoff pattern
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = data.hostedUrl
    form.style.display = 'none'
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'token'
    input.value = data.token
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
    return 'redirecting'
  }
  // Customer-side: FOMO Pay hosted cashier redirect. Asian e-wallets
  // (WeChat Pay, Alipay, GrabPay, etc.) + cards.
  const payWithFomoPay = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('fomopay-create-payment', {
      body: { vendorId, orderId, amount, currency: currency || 'SGD', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl, description },
    })
    if (error || !data?.url) {
      console.error('FOMO Pay failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingFomoOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: Checkout.com Payment Link hosted redirect. Cards + Apple
  // Pay + Google Pay + Klarna + iDEAL + Bancontact + Sofort + Multibanco etc.
  const payWithCheckoutCom = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description, billingCountry }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('checkout-com-create-link', {
      body: { vendorId, orderId, amount, currency: currency || 'USD', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl, description, billingCountry },
    })
    if (error || !data?.url) {
      console.error('Checkout.com link failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingCkoOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: Rapyd hosted Checkout redirect. 900+ local methods across
  // 100+ countries (local wallets / bank transfers / cards / etc.) — vendor
  // enables which to show in Rapyd dashboard.
  const payWithRapyd = async ({ orderId, amount, currency, country, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('rapyd-create-checkout', {
      body: { vendorId, orderId, amount, currency: currency || 'USD', country: country || 'US', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl },
    })
    if (error || !data?.url) {
      console.error('Rapyd checkout failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingRapydOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: Adyen Pay-by-Link hosted redirect. Supports 250+ methods
  // (cards, iDEAL, Bancontact, Klarna, GiroPay, Sofort, etc.) — vendor
  // enables which to show in Adyen Customer Area.
  const payWithAdyen = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description, countryCode }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('adyen-create-link', {
      body: { vendorId, orderId, amount, currency: currency || 'EUR', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl, description, countryCode },
    })
    if (error || !data?.url) {
      console.error('Adyen link failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingAdyenOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: HitPay hosted checkout redirect. Supports cards / PayNow QR /
  // Shopee Pay / GrabPay / Alipay / WeChat Pay.
  const payWithHitPay = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('hitpay-create-payment', {
      body: { vendorId, orderId, amount, currency: currency || 'SGD', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl, description },
    })
    if (error || !data?.url) {
      console.error('HitPay payment failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingHitPayOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  // Customer-side: Mollie hosted checkout redirect. Same pattern as Stripe/Xendit/PayPal/Razorpay.
  const payWithMollie = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description }) => {
    if (!supabase) return 'failed'
    const returnUrl = window.location.origin + window.location.pathname + (window.location.search || '')
    const { data, error } = await supabase.functions.invoke('mollie-create-payment', {
      body: { vendorId, orderId, amount, currency: currency || 'EUR', items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, returnUrl, description },
    })
    if (error || !data?.url) {
      console.error('Mollie payment failed', error || data)
      return 'failed'
    }
    try { localStorage.setItem('foodlocalchat_pendingMollieOrder', JSON.stringify({ orderId, vendorId, at: Date.now() })) } catch {}
    window.location.href = data.url
    return 'redirecting'
  }
  const payWithBraintree = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId }) => {
    if (!supabase) return 'failed'
    try {
      const tokenRes = await supabase.functions.invoke('braintree-client-token', { body: { vendorId } })
      if (tokenRes.error || !tokenRes.data?.clientToken) {
        console.error('Braintree client token failed', tokenRes.error || tokenRes.data)
        return 'failed'
      }
      await loadBraintreeDropin()
      // Build a modal container the customer enters card / PayPal / Venmo into
      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:16px'
      const modal = document.createElement('div')
      modal.style.cssText = 'background:#fff;border-radius:16px;padding:18px;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;color:#1a1a1a'
      modal.innerHTML = `
        <div style="font-size:18px;font-weight:800;margin-bottom:12px">Payment — ${fmt(amount)}</div>
        <div id="bt-dropin-container"></div>
        <button id="bt-pay" style="margin-top:14px;width:100%;padding:14px;border-radius:12px;border:none;background:#00ADEF;color:#fff;font-size:15px;font-weight:800;cursor:pointer;min-height:48px">Pay ${fmt(amount)}</button>
        <button id="bt-cancel" style="margin-top:8px;width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;background:#fff;color:#666;font-size:14px;font-weight:600;cursor:pointer">Cancel</button>
        <div id="bt-error" style="margin-top:8px;color:#dc2626;font-size:12px"></div>
      `
      overlay.appendChild(modal)
      document.body.appendChild(overlay)
      return await new Promise(async (resolve) => {
        const cleanup = () => { document.body.removeChild(overlay) }
        let instance
        try {
          instance = await window.braintree.dropin.create({
            authorization: tokenRes.data.clientToken,
            container: '#bt-dropin-container',
            card: { cardholderName: { required: false } },
          })
        } catch (e) {
          modal.querySelector('#bt-error').textContent = (e?.message || 'Failed to load card form')
          modal.querySelector('#bt-cancel').onclick = () => { cleanup(); resolve('closed') }
          return
        }
        modal.querySelector('#bt-cancel').onclick = () => { instance.teardown(); cleanup(); resolve('closed') }
        modal.querySelector('#bt-pay').onclick = async () => {
          modal.querySelector('#bt-error').textContent = ''
          try {
            const payload = await instance.requestPaymentMethod()
            const chargeRes = await supabase.functions.invoke('braintree-charge', {
              body: { vendorId, orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, paymentMethodNonce: payload.nonce, deviceData: payload.deviceData },
            })
            if (chargeRes.error || chargeRes.data?.status !== 'paid') {
              modal.querySelector('#bt-error').textContent = chargeRes.data?.error || 'Payment was declined.'
              return
            }
            instance.teardown(); cleanup(); resolve('paid')
          } catch (e) {
            modal.querySelector('#bt-error').textContent = e?.message || 'Payment failed.'
          }
        }
      })
    } catch (e) {
      console.error('Braintree pay failed', e)
      return 'failed'
    }
  }
  // Customer-side: Worldpay (FIS) Online — card tokenisation in a modal
  // via Worldpay.js, then server-side charge against /v1/orders.
  const payWithWorldpay = async ({ orderId, amount, currency, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description }) => {
    if (!supabase) return 'failed'
    try {
      const keyRes = await supabase.functions.invoke('worldpay-client-key', { body: { vendorId } })
      if (keyRes.error || !keyRes.data?.clientKey) {
        console.error('Worldpay client key failed', keyRes.error || keyRes.data)
        return 'failed'
      }
      await loadWorldpayJs()
      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:16px'
      const modal = document.createElement('div')
      modal.style.cssText = 'background:#fff;border-radius:16px;padding:18px;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;color:#1a1a1a'
      // Worldpay.js useTemplateForm mounts its iframe card fields into the
      // payment section div. We build a real form so the SDK's submit hook fires.
      modal.innerHTML = `
        <div style="font-size:18px;font-weight:800;margin-bottom:12px">Payment — ${fmt(amount)}</div>
        <form id="wp-form" action="" method="post">
          <div id="wp-payment"></div>
          <input type="text" id="wp-postal" placeholder="Postcode / ZIP" style="margin-top:10px;width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:14px" />
          <button type="submit" id="wp-pay" style="margin-top:14px;width:100%;padding:14px;border-radius:12px;border:none;background:#E5251F;color:#fff;font-size:15px;font-weight:800;cursor:pointer;min-height:48px">Pay ${fmt(amount)}</button>
        </form>
        <button id="wp-cancel" style="margin-top:8px;width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;background:#fff;color:#666;font-size:14px;font-weight:600;cursor:pointer">Cancel</button>
        <div id="wp-error" style="margin-top:8px;color:#dc2626;font-size:12px"></div>
      `
      overlay.appendChild(modal)
      document.body.appendChild(overlay)
      return await new Promise((resolve) => {
        const cleanup = () => { try { document.body.removeChild(overlay) } catch {} }
        const errEl = modal.querySelector('#wp-error')
        modal.querySelector('#wp-cancel').onclick = () => { cleanup(); resolve('closed') }
        try {
          window.Worldpay.useTemplateForm({
            clientKey: keyRes.data.clientKey,
            form: 'wp-form',
            paymentSection: 'wp-payment',
            display: 'inline',
            type: 'card',
            callback: async (obj) => {
              if (!obj || obj.error) {
                errEl.textContent = obj?.error?.message || 'Card details invalid.'
                return
              }
              try {
                const billingPostal = modal.querySelector('#wp-postal')?.value || 'N/A'
                const chargeRes = await supabase.functions.invoke('worldpay-charge', {
                  body: { vendorId, orderId, amount, currency: currency || 'GBP', token: obj.token, items, deliveryFee, customerName, customerEmail, customerPhone, conversationId, description, billingPostal },
                })
                if (chargeRes.error || !chargeRes.data?.ok) {
                  errEl.textContent = chargeRes.data?.error || 'Payment was declined.'
                  return
                }
                cleanup(); resolve('paid')
              } catch (e) {
                errEl.textContent = e?.message || 'Payment failed.'
              }
            },
          })
        } catch (e) {
          errEl.textContent = e?.message || 'Could not load card form'
        }
      })
    } catch (e) {
      console.error('Worldpay pay failed', e)
      return 'failed'
    }
  }
  // Customer-side: vendor's active live gateway (read once on mount). The order of
  // preference is Midtrans → Xendit → Stripe → PayPal → Razorpay; vendors typically configure one.
  const [vendorStripeLive, setVendorStripeLive] = useState(false)
  const [vendorXenditLive, setVendorXenditLive] = useState(false)
  const [vendorPayPalLive, setVendorPayPalLive] = useState(false)
  const [vendorRazorpayLive, setVendorRazorpayLive] = useState(false)
  const [vendorBraintreeLive, setVendorBraintreeLive] = useState(false)
  const [vendorMollieLive, setVendorMollieLive] = useState(false)
  const [vendorHitPayLive, setVendorHitPayLive] = useState(false)
  const [vendorAdyenLive, setVendorAdyenLive] = useState(false)
  const [vendorRapydLive, setVendorRapydLive] = useState(false)
  const [vendorCkoLive, setVendorCkoLive] = useState(false)
  const [vendorFomoLive, setVendorFomoLive] = useState(false)
  const [vendorAnetLive, setVendorAnetLive] = useState(false)
  const [vendorTcLive, setVendorTcLive] = useState(false)
  const [vendorCsLive, setVendorCsLive] = useState(false)
  const [vendorWpLive, setVendorWpLive] = useState(false)
  // vendorId is declared HERE (early) because the gateway-probe useEffect
  // below depends on it. vendorStatus is also pulled up here because
  // another useEffect (auto-open subscription picker) reads it in its
  // dependency array — declaring later would cause a TDZ error during render.
  const [vendorId, setVendorId] = useState(() => new URLSearchParams(window.location.search).get('vendor') || localStorage.getItem('foodlocalchat_vendorId') || localStorage.getItem('indoo_vendor_id') || null)
  const [vendorStatus, setVendorStatus] = useState(null) // 'active' | 'expired' | 'pending'
  useEffect(() => {
    if (!supabase || !vendorId || isVendor) return
    const probe = (id, setter) => supabase.from('vendor_payment_connections')
      .select('is_active').eq('vendor_id', vendorId).eq('gateway_id', id)
      .maybeSingle()
      .then(({ data }) => setter(!!data?.is_active))
      .catch(() => {})
    probe('stripe', setVendorStripeLive)
    probe('xendit', setVendorXenditLive)
    probe('paypal', setVendorPayPalLive)
    probe('razorpay', setVendorRazorpayLive)
    probe('braintree', setVendorBraintreeLive)
    probe('mollie', setVendorMollieLive)
    probe('hitpay', setVendorHitPayLive)
    probe('adyen', setVendorAdyenLive)
    probe('rapyd', setVendorRapydLive)
    probe('checkout-com', setVendorCkoLive)
    probe('fomo-pay', setVendorFomoLive)
    probe('authorize-net', setVendorAnetLive)
    probe('2checkout', setVendorTcLive)
    probe('cybersource', setVendorCsLive)
    probe('worldpay', setVendorWpLive)
  }, [vendorId, isVendor])
  // If the vendor arrived via a marketing link like /food/chat/?plan=whatsapp
  // (from landing/Affiliate.jsx), and they're logged in with a pending status,
  // auto-open the subscription picker. The picker has both options visible
  // so they can still switch, but the chosen plan starts highlighted.
  useEffect(() => {
    if (!isVendor || subPickerOpen) return
    if (vendorStatus && vendorStatus !== 'pending') return
    const plan = new URLSearchParams(window.location.search).get('plan')
    if (plan === 'whatsapp' || plan === 'chat') {
      // Clear the param so it doesn't keep re-triggering on subsequent renders.
      const cleaned = new URL(window.location.href)
      cleaned.searchParams.delete('plan')
      window.history.replaceState({}, '', cleaned.toString())
      setSubPickerOpen(true)
    }
  }, [isVendor, vendorStatus])
  // Vendor subscription checkout — opens Midtrans Snap for the
  // StreetLocal central account. After payment, the webhook flips
  // vendor.status to 'active'. We poll briefly on return to reflect that.
  const startSubscriptionCheckout = async (planTier) => {
    if (!supabase || !vendorId || subBusy) return
    setSubBusy(true); setSubError('')
    try {
      emitFunnelStep('payment_started', { vendorId, metadata: { plan_tier: planTier, product: 'basic' } })
      const returnUrl = window.location.origin + window.location.pathname
      const { data, error } = await supabase.functions.invoke('subscription-create-checkout', {
        body: { vendorId, planTier, returnUrl },
      })
      if (error || !data?.redirectUrl) {
        setSubError(data?.error || 'Could not start payment. Try again in a moment.')
        setSubBusy(false)
        return
      }
      try { localStorage.setItem('foodlocalchat_pendingSubOrder', JSON.stringify({ orderId: data.orderId, vendorId, planTier, at: Date.now() })) } catch {}
      window.location.href = data.redirectUrl
    } catch (e) {
      setSubError(e?.message || 'Payment failed to start')
      setSubBusy(false)
    }
  }
  // Detect ?subscription=ok return from Midtrans → poll vendor.status until
  // the webhook has flipped it to 'active' (or 30s, whichever first).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') !== 'ok') return
    const cleanedUrl = window.location.pathname
    window.history.replaceState({}, '', cleanedUrl)
    setSubMessage('Activating your shop…')
    if (!supabase || !vendorId) return
    let attempts = 0
    const poll = async () => {
      attempts++
      try {
        const { data } = await supabase.from('vendor_accounts').select('status, plan_tier, expires_at').eq('id', vendorId).single()
        if (data?.status === 'active') {
          setVendorStatus('active')
          if (data.plan_tier) setVendorPlanTier(data.plan_tier)
          if (data.expires_at) setVendorExpiresAt(data.expires_at)
          setSubMessage('Your shop is live!')
          emitFunnelStep('payment_completed', { vendorId, metadata: { plan_tier: data.plan_tier || null } })
          try { localStorage.removeItem('foodlocalchat_pendingSubOrder') } catch {}
          return
        }
      } catch {}
      if (attempts < 10) setTimeout(poll, 3000)
      else setSubMessage('Payment received — activation may take a few minutes. Refresh to check.')
    }
    poll()
  }, [vendorId])
  // When the customer is on the order-confirmation screen, check whether the
  // most recent order for this conversation is a Stripe escrow hold that
  // hasn't been released or cancelled yet. If so, surface it so the customer
  // can release funds on receipt (or cancel before).
  useEffect(() => {
    if (!supabase || !orderDone || !chatConversation?.id) { setHeldEscrowOrder(null); return }
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, total, currency, escrow_release_at, escrow_status, gateway_id')
          .eq('conversation_id', chatConversation.id)
          .eq('gateway_id', 'stripe')
          .eq('escrow_status', 'held')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (cancelled) return
        if (data) setHeldEscrowOrder({ id: data.id, releaseAt: data.escrow_release_at, total: data.total, currency: data.currency })
        else setHeldEscrowOrder(null)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [orderDone, chatConversation?.id])
  // Release the escrow hold — captures the Stripe PaymentIntent, funds settle to vendor.
  const releaseEscrow = async () => {
    if (!supabase || !heldEscrowOrder || escrowActionBusy) return
    setEscrowActionBusy(true); setEscrowMessage('')
    try {
      const { data, error } = await supabase.functions.invoke('stripe-escrow-release', { body: { orderId: heldEscrowOrder.id, actor: 'customer' } })
      if (error || !data?.ok) {
        setEscrowMessage(data?.error || 'Could not release the hold. Try again or contact the vendor.')
      } else {
        setEscrowMessage('Funds released — thank you for confirming delivery.')
        setHeldEscrowOrder(null)
      }
    } catch (e) { setEscrowMessage(e?.message || 'Release failed') }
    finally { setEscrowActionBusy(false) }
  }
  // Cancel the escrow hold — voids the auth so the customer's card is not charged.
  const cancelEscrow = async () => {
    if (!supabase || !heldEscrowOrder || escrowActionBusy) return
    if (!window.confirm('Cancel this order? The hold will be released back to your card and you will not be charged.')) return
    setEscrowActionBusy(true); setEscrowMessage('')
    try {
      const { data, error } = await supabase.functions.invoke('stripe-escrow-cancel', { body: { orderId: heldEscrowOrder.id, actor: 'customer', reason: 'requested_by_customer' } })
      if (error || !data?.ok) {
        setEscrowMessage(data?.error || 'Could not cancel the hold. Try again or contact the vendor.')
      } else {
        setEscrowMessage('Hold released — your card was not charged.')
        setHeldEscrowOrder(null)
      }
    } catch (e) { setEscrowMessage(e?.message || 'Cancel failed') }
    finally { setEscrowActionBusy(false) }
  }
  // Handle redirect-back from any hosted gateway: clean the URL and show a toast.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('stripe_status') || params.get('xendit_status') || params.get('paypal_status') || params.get('razorpay_status') || params.get('mollie_status') || params.get('hitpay_status') || params.get('adyen_status') || params.get('rapyd_status') || params.get('cko_status') || params.get('fomo_status') || params.get('anet_status') || params.get('tc_status') || params.get('cs_status')
    if (!status) return
    const clean = window.location.pathname
    window.history.replaceState({}, '', clean)
    if (status === 'success') {
      try {
        localStorage.removeItem('foodlocalchat_pendingStripeOrder')
        localStorage.removeItem('foodlocalchat_pendingXenditOrder')
        localStorage.removeItem('foodlocalchat_pendingPayPalOrder')
        localStorage.removeItem('foodlocalchat_pendingRazorpayOrder')
        localStorage.removeItem('foodlocalchat_pendingMollieOrder')
        localStorage.removeItem('foodlocalchat_pendingHitPayOrder')
        localStorage.removeItem('foodlocalchat_pendingAdyenOrder')
        localStorage.removeItem('foodlocalchat_pendingRapydOrder')
        localStorage.removeItem('foodlocalchat_pendingCkoOrder')
        localStorage.removeItem('foodlocalchat_pendingFomoOrder')
        localStorage.removeItem('foodlocalchat_pendingAnetOrder')
        localStorage.removeItem('foodlocalchat_pendingTcOrder')
      } catch {}
      alert('✅ Payment received. Your order has been sent.')
    } else if (status === 'cancel') {
      alert('Payment cancelled. Your cart was not sent.')
    }
  }, [])
  const [showVisitUsWA, setShowVisitUsWA] = useState(() => localStorage.getItem('foodlocalchat_showVisitUsWA') === 'true')
  // Customer-side: knows whether THIS vendor has Midtrans live (loaded from Supabase).
  // Vendor's own localStorage doesn't reach customer devices, so we fetch the flag here.
  const [vendorMidtransLive, setVendorMidtransLive] = useState(false)
  useEffect(() => {
    if (!supabase || !vendorId || isVendor) return
    supabase.from('vendor_payment_connections')
      .select('is_active').eq('vendor_id', vendorId).eq('gateway_id', 'midtrans')
      .maybeSingle()
      .then(({ data }) => setVendorMidtransLive(!!data?.is_active))
      .catch(() => {})
  }, [vendorId, isVendor])
  const [flashConvId, setFlashConvId] = useState(null)
  const chimeAudioRef = useRef(null)

  /* Vendor login form */
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginMode, setLoginMode] = useState('login') // 'login' or 'signup'
  const [signupName, setSignupName] = useState('')
  const [signupCategory, setSignupCategory] = useState('')
  // vendorId AND vendorStatus are declared earlier (before the useEffects
  // that read them in dep arrays — moving them later caused a TDZ error).
  const [vendorExpiresAt, setVendorExpiresAt] = useState(null)

  /* Auto-detect user distance — silently skip when the browser has
     already denied geolocation, otherwise Chrome logs a warning every
     mount and the user sees a noisy console. User-initiated callsites
     (e.g. "Use my location" buttons) still call getCurrentPosition
     directly so the prompt re-appears when the user asks for it. */
  useEffect(() => {
    if (!navigator.geolocation) return
    let cancelled = false
    const ask = () => {
      if (cancelled) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = haversineKm(SHOP_LAT, SHOP_LON, pos.coords.latitude, pos.coords.longitude)
          setUserDistance(Math.round(d * 10) / 10)
        },
        () => {}
      )
    }
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((status) => { if (status.state !== 'denied') ask() })
        .catch(() => ask())
    } else {
      ask()
    }
    return () => { cancelled = true }
  }, [])

  /* Load delivery rates from admin settings (Supabase) */
  useEffect(() => {
    if (!supabase) return
    async function loadRates() {
      try {
        const { data } = await supabase.from('admin_settings').select('id,value').in('id', ['delivery_base_fee', 'delivery_per_km', 'delivery_min_charge', 'delivery_max_km', 'delivery_round_to'])
        if (data && data.length > 0) {
          const r = {}
          data.forEach(d => { r[d.id] = Number(d.value) })
          const zones = buildDeliveryZones(r.delivery_base_fee, r.delivery_per_km, r.delivery_min_charge, r.delivery_max_km, r.delivery_round_to)
          setDeliveryZones(zones)
          setDeliveryZone(zones[0])
        }
      } catch (e) { console.warn('Failed to load delivery rates:', e) }
    }
    loadRates()
  }, [])

  /* New / edit item form */
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formPromoPrice, setFormPromoPrice] = useState('')
  const [formPriceMode, setFormPriceMode] = useState('normal')
  const [formSpice, setFormSpice] = useState(0)
  const [formHalal, setFormHalal] = useState(false)
  const [formPopular, setFormPopular] = useState(false)
  const [formCategory, setFormCategory] = useState('Meal')
  // Global category picker modal state
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [categoryPickerGroup, setCategoryPickerGroup] = useState(null) // group.id or null (top-level)
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [customCategoryIcon, setCustomCategoryIcon] = useState('🍽️')
  const [formPhoto, setFormPhoto] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPrepTime, setFormPrepTime] = useState(0)
  // Progressive-disclosure fields — hidden by default, revealed via "+ feature" ghost button
  const [formPhotos, setFormPhotos] = useState([])         // additional photos (primary stays in formPhoto)
  const [formAllergens, setFormAllergens] = useState([])   // array of strings
  const [formDietary, setFormDietary] = useState([])       // array of strings (halal/vegan/etc)
  const [formPortion, setFormPortion] = useState('')       // grams text e.g. "200g"
  const [formPortionSize, setFormPortionSize] = useState('') // 'Small' | 'Medium' | 'Large' | ''
  const [formStock, setFormStock] = useState('')           // empty = unlimited; number = count
  const [formVariants, setFormVariants] = useState([])     // [{id, name, priceDelta}]
  const [formModifiers, setFormModifiers] = useState([])   // [{id, name, priceDelta}]
  const [formPerks, setFormPerks] = useState([])           // array of perk ids — renders as ribbon on menu card
  const [formPerkText, setFormPerkText] = useState('')     // custom override text — wins over preset
  const [formPerkLimitType, setFormPerkLimitType] = useState('none') // 'none' | 'time' | 'stock'
  const [formPerkLimitEndAt, setFormPerkLimitEndAt] = useState('')   // ISO timestamp
  const [formPerkLimitStock, setFormPerkLimitStock] = useState('')   // string of integer
  // Donut-theme-only fields. Persist on the menu item but only rendered as
  // form controls when shopTheme === 'donut'; standard themes ignore them.
  const [formFilling, setFormFilling] = useState('')        // '' | None | Cream | Custard | Jelly | Chocolate | Nutella | Peanut Butter
  const [formGlaze, setFormGlaze] = useState('')            // '' | None | Sugar | Chocolate | Maple | Strawberry | Vanilla | Caramel
  const [formTopping, setFormTopping] = useState('')        // '' | None | Sprinkles | Powdered Sugar | Cinnamon | Crushed Nuts | Coconut
  const [formDoughType, setFormDoughType] = useState('')    // '' | Yeast | Cake | Mochi | Cronut
  const [formFreshToday, setFormFreshToday] = useState(false) // "Baked fresh today" flag
  // Aspect ratio (width / height) of the currently-loaded formPhoto.
  // Drives the "How it looks on each card" preview + extreme-aspect warning.
  // 0 = unknown / no photo yet.
  const [formPhotoAspect, setFormPhotoAspect] = useState(0)
  useEffect(() => {
    if (!formPhoto) { setFormPhotoAspect(0); return }
    const img = new Image()
    img.onload = () => { if (img.width && img.height) setFormPhotoAspect(img.width / img.height) }
    img.onerror = () => setFormPhotoAspect(0)
    img.src = formPhoto
  }, [formPhoto])
  // Tick state — drives the countdown on perk ribbons (1s interval when any item has a time limit)
  const [nowTick, setNowTick] = useState(() => Date.now())
  // Which optional sections are expanded in the item form
  const [expandedSections, setExpandedSections] = useState({ photos: false, dietary: false, allergens: false, portion: false, stock: false, variants: false, modifiers: false, perks: false, donutCraft: false })
  const toggleSection = (k) => setExpandedSections(p => ({ ...p, [k]: !p[k] }))

  // --- Perk helpers ---
  // Pull display text + emoji for a menu item's perk (custom text wins over preset)
  const getPerkDisplay = (item) => {
    if (item.perkText) return { emoji: '🎁', text: item.perkText }
    const id = item.perks?.[0]
    return id ? PERK_LABELS[id] : null
  }
  // Compute countdown string, or null if no limit / 'expired' / 'soldout' to signal hide
  const getPerkCountdown = (item) => {
    const limit = item.perkLimit
    if (!limit) return null
    if (limit.type === 'time') {
      const ms = new Date(limit.endAt).getTime() - nowTick
      if (ms <= 0) return 'expired'
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      if (h > 0) return `${h}h ${m}m`
      if (m > 0) return `${m}:${String(s).padStart(2, '0')}`
      return `${s}s`
    }
    if (limit.type === 'stock') {
      if ((limit.remaining ?? 0) <= 0) return 'soldout'
      return `${limit.remaining} left`
    }
    return null
  }
  // Tick once per second only when at least one visible item has a time-based perk
  useEffect(() => {
    const hasTimeLimit = menuItems.some(m => m.perkLimit?.type === 'time')
    if (!hasTimeLimit) return
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [menuItems])

  // Shared progressive-disclosure block for both add + edit item forms
  const renderItemOptionalFields = () => (
    <div style={{ padding: '0 14px 4px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Optional details</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {[
          // Donut-only "craft" panel — surfaces Filling/Glaze/Topping/Dough +
          // "Baked fresh today" flag. Listed first so it's the most prominent
          // expander for donut vendors.
          ...(shopTheme === 'donut' ? [{ key: 'donutCraft', label: '🍩 Donut Craft' }] : []),
          { key: 'perks', label: '🎁 Perk Ribbon' },
          { key: 'variants', label: shopTheme === 'donut' ? '📦 Box Pack' : '📏 Sizes' },
          { key: 'modifiers', label: '➕ Add-ons' },
          { key: 'allergens', label: '⚠️ Allergens' },
          { key: 'dietary', label: '🌱 Dietary' },
          { key: 'portion', label: shopTheme === 'donut' ? '📐 Portion' : '⚖️ Grams' },
          { key: 'stock', label: '📦 Stock' },
        ].map(opt => (
          <button key={opt.key} type="button" onClick={() => toggleSection(opt.key)} style={{
            background: expandedSections[opt.key] ? (isCustomAccent ? `${accent}30` : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)',
            border: '1px dashed ' + (expandedSections[opt.key] ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.12)'),
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            padding: '7px 11px', borderRadius: 12, minHeight: 32,
          }}>{expandedSections[opt.key] ? '−' : '+'} {opt.label}</button>
        ))}
      </div>
      {/* Photo gallery is handled by the 4 thumbnail slots under the live preview card. */}
      {expandedSections.perks && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', position: 'relative' }}>
          <button type="button" onClick={() => toggleSection('perks')} aria-label="Close perks" style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 6px ${accent}66` }}>×</button>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Perk ribbon — shown across the top of this item's card.</div>
          {/* Preset chips */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Preset</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {Object.entries(PERK_LABELS).map(([id, p]) => {
              const isActive = formPerks[0] === id && !formPerkText
              return (
                <button key={id} type="button" onClick={() => { setFormPerks(isActive ? [] : [id]); setFormPerkText('') }} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: isActive ? accent : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (isActive ? accent : 'rgba(255,255,255,0.1)'),
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 14, minHeight: 36,
                }}>
                  <span>{p.emoji}</span>{p.text}
                </button>
              )
            })}
          </div>
          {/* Custom text override */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Or write your own (max 24 chars)</div>
          <input value={formPerkText} maxLength={24} onChange={e => { setFormPerkText(e.target.value); if (e.target.value) setFormPerks([]) }} placeholder="e.g. Free Cendol Today!" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
          {/* Countdown limit */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Limited offer? (countdown on right of ribbon)</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[
              { id: 'none', label: 'No limit' },
              { id: 'time', label: '⏱ Time' },
              { id: 'stock', label: '📦 Stock' },
            ].map(opt => (
              <button key={opt.id} type="button" onClick={() => setFormPerkLimitType(opt.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: formPerkLimitType === opt.id ? accent : 'rgba(255,255,255,0.08)', color: formPerkLimitType === opt.id ? '#fff' : 'rgba(255,255,255,0.6)', minHeight: 40 }}>{opt.label}</button>
            ))}
          </div>
          {formPerkLimitType === 'time' && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {[
                  { label: '+1 h',   ms: 1 * 3600000 },
                  { label: '+4 h',   ms: 4 * 3600000 },
                  { label: '+24 h',  ms: 24 * 3600000 },
                  { label: '+48 h',  ms: 48 * 3600000 },
                  { label: '+7 days', ms: 7 * 24 * 3600000 },
                ].map(opt => (
                  <button key={opt.label} type="button" onClick={() => setFormPerkLimitEndAt(new Date(Date.now() + opt.ms).toISOString())} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 36 }}>{opt.label}</button>
                ))}
              </div>
              <input type="datetime-local" value={formPerkLimitEndAt ? new Date(formPerkLimitEndAt).toISOString().slice(0,16) : ''} onChange={e => setFormPerkLimitEndAt(e.target.value ? new Date(e.target.value).toISOString() : '')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
              {formPerkLimitEndAt && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Ends {new Date(formPerkLimitEndAt).toLocaleString()}</div>}
            </div>
          )}
          {formPerkLimitType === 'stock' && (
            <div>
              <input type="number" min={0} value={formPerkLimitStock} onChange={e => setFormPerkLimitStock(e.target.value)} placeholder="e.g. 20" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>How many units of this perk available — ribbon hides at 0</div>
            </div>
          )}
          {/* Live preview of the ribbon */}
          {(() => {
            const previewText = formPerkText || PERK_LABELS[formPerks[0]]?.text
            const previewEmoji = formPerkText ? '🎁' : PERK_LABELS[formPerks[0]]?.emoji
            if (!previewText) return null
            let cd = null
            if (formPerkLimitType === 'time' && formPerkLimitEndAt) {
              const ms = new Date(formPerkLimitEndAt).getTime() - nowTick
              if (ms > 0) {
                const h = Math.floor(ms / 3600000)
                const m = Math.floor((ms % 3600000) / 60000)
                cd = h > 0 ? `${h}h ${m}m` : `${m}m`
              }
            } else if (formPerkLimitType === 'stock' && formPerkLimitStock !== '') {
              const n = Number(formPerkLimitStock)
              if (n > 0) cd = `${n} left`
            }
            return (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Preview</div>
                <div style={{ background: accent, color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 0.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
                  <span style={{ fontSize: 13 }}>{previewEmoji}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewText}</span>
                  {cd && <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{cd}</span>}
                </div>
              </div>
            )
          })()}
        </div>
      )}
      {expandedSections.donutCraft && shopTheme === 'donut' && (() => {
        // Donut-only craft panel. All five fields are optional. Each renders as
        // a chip group so the vendor taps to set/clear in one action.
        const FILLINGS = ['None', 'Cream', 'Custard', 'Jelly', 'Chocolate', 'Nutella', 'Peanut Butter']
        const GLAZES   = ['None', 'Sugar', 'Chocolate', 'Maple', 'Strawberry', 'Vanilla', 'Caramel']
        const TOPPINGS = ['None', 'Sprinkles', 'Powdered Sugar', 'Cinnamon', 'Crushed Nuts', 'Coconut']
        const DOUGHS   = ['Yeast', 'Cake', 'Mochi', 'Cronut']
        const chipRow = (label, options, current, setter) => (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {options.map(o => {
                const isActive = current === o
                return (
                  <button key={o} type="button" onClick={() => setter(isActive ? '' : o)} style={{
                    background: isActive ? accent : 'rgba(255,255,255,0.06)',
                    border: '1px solid ' + (isActive ? accent : 'rgba(255,255,255,0.1)'),
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    padding: '6px 10px', borderRadius: 14, minHeight: 32,
                  }}>{o}</button>
                )
              })}
            </div>
          </div>
        )
        return (
          <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', position: 'relative' }}>
            <button type="button" onClick={() => toggleSection('donutCraft')} aria-label="Close donut craft" style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, border: 'none', background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>×</button>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10, paddingRight: 30 }}>Donut craft — surfaces on the item card and order receipt.</div>
            {chipRow('Filling', FILLINGS, formFilling, setFormFilling)}
            {chipRow('Glaze', GLAZES, formGlaze, setFormGlaze)}
            {chipRow('Topping', TOPPINGS, formTopping, setFormTopping)}
            {chipRow('Dough type', DOUGHS, formDoughType, setFormDoughType)}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <button type="button" onClick={() => setFormFreshToday(!formFreshToday)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: formFreshToday ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: formFreshToday ? 19 : 3, transition: 'left 0.2s' }} />
              </button>
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>🥐 Baked fresh today</span>
            </div>
          </div>
        )
      })()}
      {expandedSections.allergens && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Contains — helps customers with allergies</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {/* Donut shops: prune to the 4 allergens that actually apply (no Shellfish / Soy). */}
            {(shopTheme === 'donut'
              ? ['Gluten', 'Dairy', 'Nuts', 'Egg']
              : ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Egg', 'Soy']
            ).map(a => {
              const isActive = formAllergens.includes(a)
              return (
                <button key={a} type="button" onClick={() => setFormAllergens(p => isActive ? p.filter(x => x !== a) : [...p, a])} style={{
                  background: isActive ? '#EF4444' : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (isActive ? '#fff' : 'rgba(255,255,255,0.1)'),
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 14, minHeight: 32,
                }}>{a}</button>
              )
            })}
          </div>
        </div>
      )}
      {expandedSections.dietary && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', position: 'relative' }}>
          <button type="button" onClick={() => toggleSection('dietary')} aria-label="Close dietary" style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, border: 'none', background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>×</button>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingRight: 30 }}>Dietary tags · customers can filter the menu by these</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {/* Donut shops: surface the 4 tags that matter — vegetarian, vegan,
                gluten-free, dairy-free. Halal is removed at the user's request. */}
            {(shopTheme === 'donut'
              ? DIETARY_TAGS.filter(t => ['vegetarian', 'vegan', 'gluten_free', 'dairy_free'].includes(t.id))
              : DIETARY_TAGS
            ).map(tag => {
              const isActive = formDietary.includes(tag.id)
              return (
                <button key={tag.id} type="button" onClick={() => setFormDietary(p => isActive ? p.filter(x => x !== tag.id) : [...p, tag.id])} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: isActive ? `${tag.color}22` : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (isActive ? tag.color : 'rgba(255,255,255,0.1)'),
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 14, minHeight: 32,
                }}>
                  {tag.svg && <svg width="14" height="14" viewBox="0 0 24 24" fill={tag.color}><path d={tag.svg} /></svg>}
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {expandedSections.portion && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)' }}>
          {shopTheme === 'donut' ? (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Portion — how the donut is sold</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Single', '3-pack', 'Half Dozen', 'Dozen', 'Mini Pack'].map(p => {
                  const isActive = formPortion === p
                  return (
                    <button key={p} type="button" onClick={() => setFormPortion(isActive ? '' : p)} style={{
                      background: isActive ? accent : 'rgba(255,255,255,0.06)',
                      border: '1px solid ' + (isActive ? accent : 'rgba(255,255,255,0.1)'),
                      color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      padding: '7px 12px', borderRadius: 14, minHeight: 32,
                    }}>{p}</button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Grams / weight</div>
              <input value={formPortion} onChange={(e) => setFormPortion(e.target.value)} placeholder='e.g. 200g · 350g · 1.2kg' style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </>
          )}
        </div>
      )}
      {expandedSections.stock && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Stock — auto-hides item when 0. Leave blank for unlimited.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min={0} value={formStock} onChange={(e) => setFormStock(e.target.value)} placeholder='Unlimited' style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', minHeight: 44, boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setFormStock('')} style={{ padding: '0 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: formStock === '' ? `${accent}25` : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Unlimited</button>
          </div>
        </div>
      )}
      {expandedSections.variants && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            {shopTheme === 'donut'
              ? 'Box packs — customer picks one. Price delta added to single-donut base.'
              : 'Sizes / variants — customer picks one. Price delta added to base.'}
          </div>
          {/* Donut shortcut: one tap to scaffold Single / Half Dozen / Dozen with
              auto price-delta = base × (6 × 0.85 - 1) and base × (12 × 0.80 - 1).
              The 15%/20% discounts mirror typical donut-shop box pricing. */}
          {shopTheme === 'donut' && formVariants.length === 0 && (
            <button type="button" onClick={() => {
              const base = Number(formPrice) || 0
              const ts = Date.now()
              setFormVariants([
                { id: 'v_' + (ts + 0), name: 'Single', priceDelta: 0 },
                { id: 'v_' + (ts + 1), name: 'Half Dozen (6)', priceDelta: Math.round(base * (6 * 0.85 - 1)) },
                { id: 'v_' + (ts + 2), name: 'Dozen (12)', priceDelta: Math.round(base * (12 * 0.80 - 1)) },
              ])
            }} style={{ width: '100%', padding: '10px 12px', marginBottom: 8, borderRadius: 8, border: `1px solid ${accent}`, background: `${accent}22`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📦 Quick add: Single / Half Dozen / Dozen</button>
          )}
          {formVariants.map((v, i) => (
            <div key={v.id} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={v.name} onChange={(e) => setFormVariants(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder={shopTheme === 'donut' ? 'Name (Single / Half Dozen / Dozen)' : 'Name (Small / Large / Regular)'} style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <input type="number" value={v.priceDelta} onChange={(e) => setFormVariants(p => p.map((x, j) => j === i ? { ...x, priceDelta: Number(e.target.value) || 0 } : x))} placeholder='+0' style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setFormVariants(p => p.filter((_, j) => j !== i))} style={{ width: 34, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>&times;</button>
            </div>
          ))}
          <button type="button" onClick={() => setFormVariants(p => [...p, { id: 'v_' + Date.now(), name: '', priceDelta: 0 }])} style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add {shopTheme === 'donut' ? 'pack' : 'size'}</button>
        </div>
      )}
      {expandedSections.modifiers && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Add-ons / modifiers — customer can pick multiple (each adds to price).</div>
          {formModifiers.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={m.name} onChange={(e) => setFormModifiers(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder={shopTheme === 'donut' ? 'Name (Extra glaze / Sprinkles)' : 'Name (Extra cheese / No onion)'} style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <input type="number" value={m.priceDelta} onChange={(e) => setFormModifiers(p => p.map((x, j) => j === i ? { ...x, priceDelta: Number(e.target.value) || 0 } : x))} placeholder='+0' style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setFormModifiers(p => p.filter((_, j) => j !== i))} style={{ width: 34, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>&times;</button>
            </div>
          ))}
          <button type="button" onClick={() => setFormModifiers(p => [...p, { id: 'm_' + Date.now(), name: '', priceDelta: 0 }])} style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add modifier</button>
        </div>
      )}
    </div>
  )

  /* --- Persist to localStorage + sync to Supabase --- */
  useEffect(() => { if (vendorId) localStorage.setItem('foodlocalchat_vendorId', vendorId) }, [vendorId])
  useEffect(() => { saveJSON('foodlocalchat_menu', menuItems) }, [menuItems])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopName', shopName) }, [shopName])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopLogo', shopLogo) }, [shopLogo])
  useEffect(() => { localStorage.setItem('foodlocalchat_logoStyle', shopLogoStyle) }, [shopLogoStyle])
  useEffect(() => { localStorage.setItem('foodlocalchat_logoScale', String(logoScale)) }, [logoScale])
  useEffect(() => { localStorage.setItem('foodlocalchat_logoInner', String(logoInner)) }, [logoInner])
  useEffect(() => { localStorage.setItem('foodlocalchat_logoOffsetX', String(logoOffsetX)) }, [logoOffsetX])
  useEffect(() => { localStorage.setItem('foodlocalchat_logoOffsetY', String(logoOffsetY)) }, [logoOffsetY])
  useEffect(() => { localStorage.setItem('foodlocalchat_heroSize', heroSize) }, [heroSize])
  useEffect(() => { localStorage.setItem('foodlocalchat_heroFont', heroFont) }, [heroFont])
  useEffect(() => {
    if (heroFont !== 'system') {
      const fontMap = { nunito: 'Nunito:wght@700;800;900', poppins: 'Poppins:wght@700;800;900', playfair: 'Playfair+Display:wght@700;800;900', caveat: 'Caveat:wght@700', bebas: 'Bebas+Neue' }
      const fontId = 'hero-font-link'
      let link = document.getElementById(fontId)
      if (!link) { link = document.createElement('link'); link.id = fontId; link.rel = 'stylesheet'; document.head.appendChild(link) }
      link.href = `https://fonts.googleapis.com/css2?family=${fontMap[heroFont]}&display=swap`
    }
  }, [heroFont])
  useEffect(() => { localStorage.setItem('foodlocalchat_heroColor', heroColor) }, [heroColor])
  useEffect(() => { localStorage.setItem('foodlocalchat_heroSubColor', heroSubColor) }, [heroSubColor])
  useEffect(() => { localStorage.setItem('foodlocalchat_heroEffect', heroEffect) }, [heroEffect])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopPhone', shopPhone) }, [shopPhone])
  useEffect(() => { saveJSON('foodlocalchat_shopOpen', shopOpen) }, [shopOpen])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopAddress', shopAddress) }, [shopAddress])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopHours', shopHours) }, [shopHours])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopSchedule', JSON.stringify(shopSchedule)) }, [shopSchedule])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopMaps', shopMapsLink) }, [shopMapsLink])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopIG', shopInstagram) }, [shopInstagram])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopTT', shopTiktok) }, [shopTiktok])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopFB', shopFacebook) }, [shopFacebook])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopYT', shopYoutube) }, [shopYoutube])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopWeb', shopWebsite) }, [shopWebsite])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopQris', shopQris) }, [shopQris])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopFoodType', shopFoodType) }, [shopFoodType])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopBio', shopBio) }, [shopBio])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopCity', shopCity) }, [shopCity])
  useEffect(() => { localStorage.setItem('foodlocalchat_shopCountry', shopCountry) }, [shopCountry])
  useEffect(() => { localStorage.setItem('foodlocalchat_delBase', delBaseFee) }, [delBaseFee])
  useEffect(() => { localStorage.setItem('foodlocalchat_delPerKm', delPerKm) }, [delPerKm])
  useEffect(() => { localStorage.setItem('foodlocalchat_delMin', delMinCharge) }, [delMinCharge])
  useEffect(() => { localStorage.setItem('foodlocalchat_delMax', delMaxKm) }, [delMaxKm])
  useEffect(() => { localStorage.setItem('foodlocalchat_delFree', delFreeAbove) }, [delFreeAbove])
  useEffect(() => { localStorage.setItem('foodlocalchat_delCurrency', delCurrency) }, [delCurrency])
  useEffect(() => { localStorage.setItem('foodlocalchat_delMinKm', delMinKm) }, [delMinKm])
  useEffect(() => { localStorage.setItem('foodlocalchat_delEnabled', delEnabled) }, [delEnabled])

  /* Customization features persistence */
  useEffect(() => { localStorage.setItem('foodlocalchat_btnShape', btnShape) }, [btnShape])
  useEffect(() => { localStorage.setItem('foodlocalchat_btnColor', btnColor) }, [btnColor])
  useEffect(() => { localStorage.setItem('foodlocalchat_btnText', btnText) }, [btnText])
  useEffect(() => { localStorage.setItem('foodlocalchat_btnSize', String(btnSize)) }, [btnSize])
  useEffect(() => { localStorage.setItem('foodlocalchat_btnEffect', btnEffect) }, [btnEffect])

  // Inject button effect keyframes globally — placing them inside the <button> element
  // worked inconsistently across browsers. Mount once into document.head.
  useEffect(() => {
    const id = 'foodlocalchat-btn-effect-keyframes'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes btnShake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
        20%, 40%, 60%, 80% { transform: translateX(3px); }
      }
      @keyframes btnHeartbeat {
        0%, 100% { transform: scale(1); }
        14% { transform: scale(1.10); }
        28% { transform: scale(1); }
        42% { transform: scale(1.08); }
        70% { transform: scale(1); }
      }
      @keyframes btnRunningGlow {
        0% { transform: translateX(-150%) skewX(-20deg); }
        100% { transform: translateX(250%) skewX(-20deg); }
      }
      @keyframes btnSignalPing {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.85; }
        100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
      }
      .overlay-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
      .overlay-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 26px; height: 26px; border-radius: 13px; background: #DC2626; border: 2px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.25); cursor: pointer; margin-top: -10px; }
      .overlay-slider::-moz-range-thumb { width: 26px; height: 26px; border-radius: 13px; background: #DC2626; border: 2px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer; }
      .overlay-slider::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; }
      .overlay-slider::-moz-range-track { height: 6px; border-radius: 3px; }
    `
    document.head.appendChild(style)
  }, [])
  useEffect(() => { localStorage.setItem('foodlocalchat_overlayOpacity', overlayOpacity) }, [overlayOpacity])
  useEffect(() => { localStorage.setItem('foodlocalchat_landingLayout', landingLayout) }, [landingLayout])
  useEffect(() => { localStorage.setItem('foodlocalchat_customTagline', customTagline) }, [customTagline])
  // Pre-fill the tagline field with what's currently shown on the phone (shopFoodType)
  // the first time the user opens the Text tool, so they can delete and retype.
  useEffect(() => { if (configTool === 'text' && !customTagline && shopFoodType) setCustomTagline(shopFoodType) }, [configTool])
  useEffect(() => { localStorage.setItem('foodlocalchat_menuCardStyle', menuCardStyle) }, [menuCardStyle])
  useEffect(() => { localStorage.setItem('foodlocalchat_menuBanners', JSON.stringify(menuBanners.filter(u => typeof u === 'string' && !u.startsWith('blob:')))) }, [menuBanners])
  useEffect(() => { if (menuBannerIdx >= menuBanners.length) setMenuBannerIdx(0) }, [menuBanners.length])
  useEffect(() => {
    if (menuBanners.length < 2) return
    const id = setInterval(() => setMenuBannerIdx(i => (i + 1) % menuBanners.length), 4000)
    return () => clearInterval(id)
  }, [menuBanners.length])
  useEffect(() => { localStorage.setItem('foodlocalchat_promoBanner', promoBanner) }, [promoBanner])
  useEffect(() => { localStorage.setItem('foodlocalchat_promoBannerEnabled', promoBannerEnabled) }, [promoBannerEnabled])
  useEffect(() => { localStorage.setItem('foodlocalchat_promoBannerEffect', promoBannerEffect) }, [promoBannerEffect])
  useEffect(() => { localStorage.setItem('foodlocalchat_splashEnabled', splashEnabled) }, [splashEnabled])
  // When splash is enabled (initially OR via toggle), show it for 2 seconds then auto-hide.
  // When disabled, hide immediately.
  useEffect(() => {
    if (splashEnabled) {
      setShowSplash(true)
      const t = setTimeout(() => setShowSplash(false), 2000)
      return () => clearTimeout(t)
    } else {
      setShowSplash(false)
    }
  }, [splashEnabled])

  // Build delivery zones from vendor's own settings
  useEffect(() => {
    const zones = buildDeliveryZones(delMinCharge, delMinKm, delPerKm, delMaxKm, 1000, delCurrency)
    setDeliveryZones(zones)
    setDeliveryZone(zones[0])
  }, [delMinCharge, delMinKm, delPerKm, delMaxKm, delCurrency])

  // Sync shop config to Supabase when vendor changes settings
  const syncTimer = useRef(null)
  useEffect(() => {
    if (!vendorId || String(vendorId).startsWith('local')) return
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      updateVendorConfig(vendorId, {
        shop_name: shopName, shop_logo: shopLogo, shop_phone: shopPhone,
        shop_open: shopOpen, shop_address: shopAddress, shop_hours: shopHours,
        shop_maps_link: shopMapsLink, shop_instagram: shopInstagram,
        shop_tiktok: shopTiktok, shop_facebook: shopFacebook,
        shop_youtube: shopYoutube, shop_website: shopWebsite,
        shop_food_type: shopFoodType,
        delivery_base_fee: delBaseFee, delivery_per_km: delPerKm,
        delivery_min_charge: delMinCharge, delivery_max_km: delMaxKm,
        delivery_free_above: delFreeAbove, delivery_currency: delCurrency,
        delivery_enabled: delEnabled,
      })
    }, 2000)
  }, [shopName, shopLogo, shopPhone, shopOpen, shopAddress, shopHours, shopMapsLink, shopInstagram, shopTiktok, shopFacebook, shopYoutube, shopWebsite, shopFoodType, delBaseFee, delPerKm, delMinCharge, delMaxKm, delFreeAbove, delCurrency, delEnabled])

  // Load shop config from Supabase on vendor login
  useEffect(() => {
    if (!vendorId || String(vendorId).startsWith('local')) return
    if (!supabase) return
    supabase.from('vendor_accounts').select('*').eq('id', vendorId).single().then(({ data }) => {
      if (!data) return
      if (data.shop_name) setShopName(data.shop_name)
      if (data.shop_logo) setShopLogo(data.shop_logo)
      if (data.shop_phone) setShopPhone(data.shop_phone)
      if (data.shop_address) setShopAddress(data.shop_address)
      if (data.shop_hours) setShopHours(data.shop_hours)
      if (data.shop_maps_link) setShopMapsLink(data.shop_maps_link)
      if (data.shop_instagram) setShopInstagram(data.shop_instagram)
      if (data.shop_tiktok) setShopTiktok(data.shop_tiktok)
      if (data.shop_facebook) setShopFacebook(data.shop_facebook)
      if (data.shop_youtube) setShopYoutube(data.shop_youtube)
      if (data.shop_website) setShopWebsite(data.shop_website)
      if (data.shop_food_type) setShopFoodType(data.shop_food_type)
      if (data.shop_open !== undefined) setShopOpen(data.shop_open)
      if (data.landing_theme_id) {
        setLandingThemeId(data.landing_theme_id)
        try { localStorage.setItem('foodlocalchat_landing_theme_id', data.landing_theme_id) } catch {}
        // When a vendor picks a saved landing theme, the theme's signature
        // colour cascades through the rest of the app (menu buttons, accent,
        // headers etc.) — unless the vendor has already overridden via the
        // Design Studio colour picker. We only force-apply when the local
        // accent is still the default (so we don't trample customisations).
        const THEME_ACCENTS = { donuts: '#EC4899' }
        const themeAccent = THEME_ACCENTS[data.landing_theme_id]
        const currentLocal = localStorage.getItem('foodlocalchat_accentColor')
        if (themeAccent && (!currentLocal || currentLocal === '#8B0000' || currentLocal === '#8DC63F')) {
          setShopAccentColor(themeAccent)
          try { localStorage.setItem('foodlocalchat_accentColor', themeAccent) } catch {}
        }
      }
      if (data.delivery_base_fee) setDelBaseFee(data.delivery_base_fee)
      if (data.delivery_per_km) setDelPerKm(data.delivery_per_km)
      if (data.delivery_min_charge) setDelMinCharge(data.delivery_min_charge)
      if (data.delivery_max_km) setDelMaxKm(data.delivery_max_km)
      if (data.delivery_free_above !== undefined) setDelFreeAbove(data.delivery_free_above)
      if (data.delivery_currency) setDelCurrency(data.delivery_currency)
      if (data.delivery_enabled !== undefined) setDelEnabled(data.delivery_enabled)
      // plan_tier drives the order-channel routing (see openOrderModePicker).
      // null is acceptable — handled as legacy 'both' in the dispatcher.
      setVendorPlanTier(data.plan_tier || null)
    })
  }, [vendorId])

  /* --- Cart helpers --- */
  const totalItems = cart.reduce((s, c) => s + c.qty, 0)
  const totalPrice = cart.reduce((s, c) => s + c.price * c.qty, 0)

  // Cart line ID is a composite key: itemId :: variantId :: sortedModifierIds :: noteHash —
  // so identical combos with same note merge, but a different note creates a new line.
  const buildCartLineId = (itemId, variant, modifiers, note) => {
    const vid = variant ? variant.id : ''
    const mids = (modifiers || []).map(m => m.id).sort().join(',')
    const nh = (note || '').trim() ? '~' + (note || '').trim().slice(0, 30).toLowerCase().replace(/\s+/g, '_') : ''
    return `${itemId}::${vid}::${mids}${nh}`
  }

  const addToCart = useCallback((item, qty = 1, variant = null, modifiers = [], note = '') => {
    setCart((prev) => {
      const lineId = buildCartLineId(item.id, variant, modifiers, note)
      const idx = prev.findIndex((c) => c.id === lineId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + qty }
        return next
      }
      const basePrice = item.promoPrice || item.price
      const variantDelta = variant ? (variant.priceDelta || 0) : 0
      const modifiersDelta = (modifiers || []).reduce((s, m) => s + (m.priceDelta || 0), 0)
      const unitPrice = basePrice + variantDelta + modifiersDelta
      const displayName = variant ? `${item.name} (${variant.name})` : item.name
      return [...prev, {
        id: lineId,
        itemId: item.id,
        name: displayName,
        desc: item.desc,
        photo: item.photo,
        price: unitPrice,
        promoPrice: item.promoPrice ? unitPrice : null,
        prepTime: item.prepTime,
        variant: variant,
        modifiers: modifiers,
        note: (note || '').trim(),
        qty,
      }]
    })
  }, [])

  /* --- GPS auto-delivery --- */
  const detectDeliveryZone = useCallback(() => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineKm(SHOP_LAT, SHOP_LON, pos.coords.latitude, pos.coords.longitude)
        setDeliveryZone(getDeliveryFee(dist, deliveryZones))
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    )
  }, [])

  /* --- Vendor login --- */
  const handleVendorLogin = async () => {
    if (!loginPhone.trim()) { setLoginError('Enter WhatsApp number'); return }
    if (!loginPass.trim()) { setLoginError('Enter password'); return }
    // Try Supabase first
    const vendor = await vendorLogin(loginPhone, loginPass)
    if (vendor) {
      setVendorId(vendor.id)
      setShopName(vendor.shop_name || shopName)
      setShopPhone(vendor.shop_phone || shopPhone)
      setShopAddress(vendor.shop_address || shopAddress)
      setShopHours(vendor.shop_hours || shopHours)
      setShopFoodType(vendor.shop_food_type || shopFoodType)
      setShopMapsLink(vendor.shop_maps_link || '')
      setShopInstagram(vendor.shop_instagram || '')
      setShopTiktok(vendor.shop_tiktok || '')
      setShopFacebook(vendor.shop_facebook || '')
      setShopYoutube(vendor.shop_youtube || '')
      setShopWebsite(vendor.shop_website || '')
      setShopOpen(vendor.shop_open !== false)
      // Set subscription status
      if (vendor.status) setVendorStatus(vendor.status)
      if (vendor.expires_at) {
        setVendorExpiresAt(vendor.expires_at)
        // Auto-check if expired
        if (new Date(vendor.expires_at) < new Date() && vendor.status === 'active') {
          setVendorStatus('expired')
        }
      }
      // Load menu from Supabase
      const items = await getVendorMenuItems(vendor.id)
      if (items.length > 0) {
        setMenuItems(items.map(i => ({ id: i.id, supabaseId: i.id, name: i.name, price: i.price, photo: i.photo_url, desc: i.description, category: i.category, available: i.available, promoPrice: i.promo_price, prepTime: i.prep_time, spice: i.spice, halal: i.halal, popular: i.popular })))
      }
      localStorage.setItem('indoo_vendor_phone', loginPhone.replace(/[^0-9]/g, ''))
      localStorage.setItem('indoo_vendor_pass', loginPass)
      setIsVendor(true); setVendorLogin(false)
      setLoginPhone(''); setLoginPass(''); setLoginError(''); setLoginMode('login')
      return
    }
    // Fallback to localStorage
    const storedPhone = localStorage.getItem('indoo_vendor_phone') || shopPhone
    const storedPass = localStorage.getItem('indoo_vendor_pass') || 'vendor123'
    if (loginPhone.replace(/[^0-9]/g, '') === storedPhone.replace(/[^0-9]/g, '') && loginPass === storedPass) {
      setIsVendor(true); setVendorLogin(false)
      setLoginPhone(''); setLoginPass(''); setLoginError(''); setLoginMode('login')
    } else {
      setLoginError('Wrong number or password')
    }
  }

  const handleVendorSignup = async () => {
    if (!signupName.trim()) { setLoginError('Enter your business name'); return }
    if (!signupCategory) { setLoginError('Select your food category'); return }
    if (!loginPhone.trim()) { setLoginError('Enter WhatsApp number'); return }
    if (!loginPass.trim()) { setLoginError('Create a password'); return }
    if (loginPass.length < 4) { setLoginError('Password min 4 characters'); return }
    try {
      const vendor = await vendorSignup(loginPhone, loginPass, signupName)
      setVendorId(vendor.id)
      localStorage.setItem('indoo_vendor_phone', loginPhone.replace(/[^0-9]/g, ''))
      localStorage.setItem('indoo_vendor_pass', loginPass)
      setShopName(signupName)
      setShopFoodType(signupCategory)
      localStorage.setItem('foodlocalchat_shopFoodType', signupCategory)
      setShopPhone(loginPhone.replace(/[^0-9]/g, ''))
      // Auto-set theme based on category
      const matchedTheme = THEME_PRESETS.find(t => t.category === signupCategory)
      if (matchedTheme) {
        setShopTheme(matchedTheme.id)
        localStorage.setItem('foodlocalchat_theme', matchedTheme.id)
        localStorage.setItem('foodlocalchat_themeBg', matchedTheme.img)
        const bgImg = document.getElementById('app-bg-img')
        if (bgImg) bgImg.src = matchedTheme.img
      }
      updateVendorConfig(vendor.id, { shop_food_type: signupCategory })
      setIsVendor(true)
      setVendorLogin(false)
      setLoginPhone(''); setLoginPass(''); setSignupName(''); setSignupCategory(''); setLoginError(''); setLoginMode('login')
    } catch (e) { setLoginError(e.message || 'Signup failed') }
  }

  /* --- Vendor actions --- */
  const toggleAvailability = (id) => {
    setMenuItems((prev) => prev.map((m) => m.id === id ? { ...m, available: !m.available } : m))
  }

  const deleteItem = (id) => {
    const item = menuItems.find(m => m.id === id)
    if (item?.supabaseId) deleteMenuItemSupa(item.supabaseId).catch(() => {})
    setMenuItems((prev) => prev.filter((m) => m.id !== id))
  }

  const startEdit = (item) => {
    setFormName(item.name)
    setFormPrice(String(item.price))
    setFormPhoto(item.photo)
    setFormDesc(item.desc)
    setFormCategory(item.category || 'Meal')
    setFormPrepTime(item.prepTime || 0)
    setFormPhotos(item.photos || [])
    setFormAllergens(item.allergens || [])
    setFormDietary(item.dietary || [])
    setFormPortion(item.portion || '')
    setFormPortionSize(item.portionSize || '')
    setFormStock(item.stock != null ? String(item.stock) : '')
    setFormVariants(item.variants || [])
    setFormModifiers(item.modifiers || [])
    setFormPerks(item.perks || [])
    setFormPerkText(item.perkText || '')
    setFormPerkLimitType(item.perkLimit?.type || 'none')
    setFormPerkLimitEndAt(item.perkLimit?.endAt || '')
    setFormPerkLimitStock(item.perkLimit?.remaining != null ? String(item.perkLimit.remaining) : '')
    setFormFilling(item.filling || '')
    setFormGlaze(item.glaze || '')
    setFormTopping(item.topping || '')
    setFormDoughType(item.doughType || '')
    setFormFreshToday(!!item.freshToday)
    setExpandedSections({
      photos: (item.photos || []).length > 0,
      allergens: (item.allergens || []).length > 0,
      dietary: (item.dietary || []).length > 0,
      portion: !!item.portion,
      stock: item.stock != null,
      variants: (item.variants || []).length > 0,
      modifiers: (item.modifiers || []).length > 0,
      perks: (item.perks || []).length > 0,
      donutCraft: !!(item.filling || item.glaze || item.topping || item.doughType || item.freshToday),
    })
    setEditItem(item)
  }

  const buildPerkLimit = () => {
    if (formPerkLimitType === 'time' && formPerkLimitEndAt) return { type: 'time', endAt: formPerkLimitEndAt }
    if (formPerkLimitType === 'stock' && formPerkLimitStock !== '') return { type: 'stock', remaining: Number(formPerkLimitStock) }
    return null
  }

  const saveEdit = () => {
    if (!formName || !formPrice) return
    // Normalize the "Other" placeholder. If the vendor picked Other but
    // didn't fill in a custom name, the sentinel '__OTHER__' is still in
    // formCategory — we drop it down to empty string on save.
    const safeCategory = formCategory === '__OTHER__' ? '' : formCategory
    const stockNum = formStock === '' ? null : Number(formStock)
    const extras = { photos: formPhotos, allergens: formAllergens, dietary: formDietary, portion: formPortion, portionSize: formPortionSize, stock: stockNum, variants: formVariants, modifiers: formModifiers, perks: formPerks, perkText: formPerkText || null, perkLimit: buildPerkLimit(), filling: formFilling || null, glaze: formGlaze || null, topping: formTopping || null, doughType: formDoughType || null, freshToday: !!formFreshToday }
    setMenuItems((prev) =>
      prev.map((m) =>
        m.id === editItem.id ? { ...m, name: formName, price: Number(formPrice), photo: formPhoto, desc: formDesc, category: safeCategory, prepTime: formPrepTime || 0, ...extras } : m
      )
    )
    if (vendorId) saveMenuItem(vendorId, { ...menuItems.find(m => m.id === editItem.id), name: formName, price: Number(formPrice), photo: formPhoto, desc: formDesc, category: safeCategory, prepTime: formPrepTime || 0, ...extras }).catch(() => {})
    setEditItem(null)
  }

  const startAdd = () => {
    setFormName('')
    setFormPrice('')
    setFormPromoPrice('')
    setFormPriceMode('normal')
    setFormSpice(0)
    setFormHalal(false)
    setFormPopular(false)
    setFormPhoto('')
    setFormDesc('')
    setFormPrepTime(0)
    setFormPhotos([])
    setFormAllergens([])
    setFormDietary([])
    setFormPortion('')
    setFormPortionSize('')
    setFormStock('')
    setFormVariants([])
    setFormModifiers([])
    setFormPerks([])
    setFormPerkText('')
    setFormPerkLimitType('none')
    setFormPerkLimitEndAt('')
    setFormPerkLimitStock('')
    setFormFilling('')
    setFormGlaze('')
    setFormTopping('')
    setFormDoughType('')
    setFormFreshToday(false)
    setExpandedSections({ photos: false, dietary: false, allergens: false, portion: false, stock: false, variants: false, modifiers: false, perks: false, donutCraft: false })
    setAddingItem(true)
  }

  const saveAdd = () => {
    if (!formName || !formPrice) return
    const newId = Date.now()
    const promoPrice = formPriceMode === 'promo' && formPromoPrice ? Number(formPromoPrice) : null
    const stockNum = formStock === '' ? null : Number(formStock)
    // Normalize the "Other" placeholder — see saveEdit for the same logic.
    const safeCategory = formCategory === '__OTHER__' ? '' : formCategory
    // Donut-only fields persist on the item; standard themes ignore the keys
    // (they're just stored as empty strings / false and don't render anywhere).
    const item = { id: newId, name: formName, price: Number(formPrice), promoPrice, spice: formSpice, halal: formHalal, popular: formPopular, photo: formPhoto, desc: formDesc, category: safeCategory, prepTime: formPrepTime || 0, available: true, photos: formPhotos, allergens: formAllergens, dietary: formDietary, portion: formPortion, portionSize: formPortionSize, stock: stockNum, variants: formVariants, modifiers: formModifiers, perks: formPerks, perkText: formPerkText || null, perkLimit: buildPerkLimit(), filling: formFilling || null, glaze: formGlaze || null, topping: formTopping || null, doughType: formDoughType || null, freshToday: !!formFreshToday }
    setMenuItems((prev) => [...prev, item])
    if (vendorId) saveMenuItem(vendorId, item).catch(() => {})
    setAddingItem(false)
  }

  /* --- In-app chat order (foodlocalchat) --- */
  // Format the current cart as a WhatsApp message body. Plain-text only;
  // emojis and bullet characters render fine in WhatsApp on every platform.
  const buildWhatsAppMessage = () => {
    const note = document.getElementById('orderNote')?.value?.trim() || ''
    const lines = []
    lines.push(`Hi ${shopName || 'there'}! I'd like to order:`)
    lines.push('')
    cart.forEach((c) => {
      const price = (c.promoPrice || c.price) * c.qty
      lines.push(`• ${c.qty}x ${c.name} — ${fmt(price)}`)
      if (c.modifiers?.length) lines.push(`   (${c.modifiers.map(m => m.name).filter(Boolean).join(', ')})`)
      if (c.note) lines.push(`   Note: ${c.note}`)
    })
    lines.push('')
    lines.push(`Subtotal: ${fmt(totalPrice)}`)
    if (delEnabled && deliveryZone?.fee > 0) lines.push(`Delivery${deliveryZone.label ? ` (${deliveryZone.label})` : ''}: ${fmt(deliveryZone.fee)}`)
    lines.push(`Total: ${fmt(totalPrice + (delEnabled ? (deliveryZone?.fee || 0) : 0))}`)
    lines.push('')
    if (custName) lines.push(`Name: ${custName}`)
    if (custPhone) lines.push(`Phone: ${custPhone}`)
    if (delEnabled && custAddress) lines.push(`Address: ${custAddress}`)
    if (note) { lines.push(''); lines.push(`Note: ${note}`) }
    return lines.join('\n')
  }
  // Open WhatsApp with the pre-filled order. Vendor handles confirmation
  // and payment over WhatsApp directly — no payment gateway involvement.
  const submitViaWhatsApp = () => {
    const cleanPhone = String(custPhone || '').replace(/[^0-9]/g, '')
    if (!cleanPhone) { setChatError('Enter your phone number'); return }
    const shopPhoneClean = String(shopPhone || '').replace(/[^0-9]/g, '')
    if (!shopPhoneClean) { setChatError('Vendor WhatsApp number missing'); return }
    if (orderModeRemember) { try { localStorage.setItem('foodlocalchat_orderModePref', 'whatsapp') } catch {} }
    setOrderModePickerOpen(false)
    const text = encodeURIComponent(buildWhatsAppMessage())
    const url = `https://wa.me/${shopPhoneClean}?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
    // Clear cart locally so the user returns to a clean state.
    setCart([])
    setCheckoutOpen(false)
  }
  // Dispatch in-app chat order (the original path). Closes the picker if open.
  const submitViaChat = () => {
    if (orderModeRemember) { try { localStorage.setItem('foodlocalchat_orderModePref', 'chat') } catch {} }
    setOrderModePickerOpen(false)
    sendOrder()
  }
  // Entry point from the "Send Order" button. Routing precedence:
  //   1. Vendor's plan_tier is the authority — 'whatsapp' or 'chat' tier
  //      vendors route directly; the customer is never offered the other
  //      channel and any saved preference is ignored.
  //   2. plan_tier 'both' or null (legacy) falls through to the picker,
  //      which can be auto-dispatched by the customer's saved preference.
  const openOrderModePicker = () => {
    if (chatSending) return
    const cleanCust = String(custPhone || '').replace(/[^0-9]/g, '')
    if (!cleanCust) { setChatError('Enter your phone number'); return }
    setChatError('')

    // 0. Block orders for trial / non-active vendors. Pending vendors can
    //    preview their shop, but can't take live orders until a sales
    //    person activates them via ActivatePage. isDemo skips this.
    if (!isDemo && vendorStatus && vendorStatus !== 'active') {
      setChatError(vendorStatus === 'pending' ? 'This shop is still being activated. Please check back soon.' : 'This shop is not currently accepting orders.')
      return
    }

    const vendorHasWhatsApp = !!String(shopPhone || '').replace(/[^0-9]/g, '')

    // 1. Vendor plan_tier is the source of truth.
    if (vendorPlanTier === 'whatsapp') {
      if (!vendorHasWhatsApp) { setChatError('Vendor WhatsApp number not configured'); return }
      return submitViaWhatsApp()
    }
    if (vendorPlanTier === 'chat') {
      return sendOrder()
    }

    // 2. 'both' or null (legacy) — picker logic with localStorage fallback.
    let pref = null
    try { pref = localStorage.getItem('foodlocalchat_orderModePref') } catch {}
    if (!vendorHasWhatsApp) return sendOrder() // no WhatsApp number → chat only
    if (pref === 'whatsapp') return submitViaWhatsApp()
    if (pref === 'chat') return sendOrder()
    setOrderModeRemember(false)
    setOrderModePickerOpen(true)
  }
  const sendOrder = async () => {
    if (chatSending) return
    setChatError('')
    const note = document.getElementById('orderNote')?.value?.trim() || ''
    const now = new Date()
    const orderNum = String(Date.now()).slice(-6)
    const initials = shopName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const maxPrep = Math.max(0, ...cart.map(c => c.prepTime || 0))
    const subtotal = totalPrice
    const deliveryFee = delEnabled && deliveryZone ? (deliveryZone.fee || 0) : 0
    const grandTotal = subtotal + deliveryFee

    const cleanPhone = String(custPhone || '').replace(/[^0-9]/g, '')
    if (!cleanPhone) { setChatError('Enter your phone number'); return }
    if (!vendorId && !isDemo) { setChatError('Vendor not set'); return }

    // Stock guard — block oversell. Any cart item whose qty exceeds the
    // current stock (when stock is tracked, i.e. not null) is rejected here
    // BEFORE the order is sent. After the check, we decrement local stock
    // optimistically so concurrent customers see the new availability
    // immediately. Items with stock === null are treated as unlimited.
    const stockShortages = cart.reduce((acc, c) => {
      const item = menuItems.find(m => m.id === c.id)
      if (item && item.stock != null && item.stock < c.qty) {
        acc.push({ name: c.name || item.name, qty: c.qty, stock: item.stock })
      }
      return acc
    }, [])
    if (stockShortages.length > 0) {
      const s = stockShortages[0]
      setChatError(
        stockShortages.length === 1
          ? `Sorry — only ${s.stock} ${s.name} left (you ordered ${s.qty}). Reduce the quantity and try again.`
          : `Stock changed since you started: ${stockShortages.map(x => `${x.name} (${x.stock} left)`).join(', ')}. Adjust your cart and try again.`
      )
      return
    }
    // Decrement local stock for tracked items (null stock = unlimited).
    setMenuItems(prev => prev.map(m => {
      const c = cart.find(x => x.id === m.id)
      if (!c || m.stock == null) return m
      return { ...m, stock: Math.max(0, m.stock - c.qty) }
    }))

    const orderPayload = {
      orderNumber: `${initials}-${orderNum}`,
      placedAt: now.toISOString(),
      customer: { name: custName || '', phone: cleanPhone, address: custAddress || '' },
      items: cart.map((c) => ({
        id: c.id || null,
        name: c.name,
        qty: c.qty,
        price: c.price,
        promoPrice: c.promoPrice || null,
        lineTotal: (c.promoPrice || c.price) * c.qty,
        note: c.note || '',
        modifiers: (c.modifiers || []).map(m => m.name).filter(Boolean),
      })),
      subtotal,
      delivery: {
        enabled: !!delEnabled,
        type: delEnabled ? 'delivery' : 'pickup',
        zone: delEnabled && deliveryZone ? deliveryZone.label || null : null,
        fee: deliveryFee,
        distanceKm: userDistance || null,
      },
      payment: { method: payMethod || 'cod' },
      note,
      total: grandTotal,
      prepMins: maxPrep,
      shop: { name: shopName, address: shopAddress },
    }

    // Persist this device's order numbers so the customer can earn the
    // ✓ Verified badge later when reviewing. Keep last 50.
    try {
      const existing = JSON.parse(localStorage.getItem('foodlocalchat_my_orders') || '[]')
      existing.unshift({ orderNumber: `${initials}-${orderNum}`, placedAt: now.toISOString() })
      localStorage.setItem('foodlocalchat_my_orders', JSON.stringify(existing.slice(0, 50)))
    } catch {}

    const summaryItems = cart.map(c => `${c.qty}x ${c.name}`).join(', ')
    const summaryBody = `New order #${initials}-${orderNum}: ${summaryItems} · ${fmt(grandTotal)}${note ? ` · Note: ${note}` : ''}`

    setChatSending(true)
    if (isDemo) {
      // Demo mode: fake the conversation locally so customer sees the chat panel without Supabase
      const fakeConvId = 'demo-conv-' + Date.now()
      const nowIso = new Date().toISOString()
      const fakeConv = { id: fakeConvId, vendor_id: 'demo', customer_phone: cleanPhone, customer_name: custName || 'Customer', created_at: nowIso }
      const fakeMessage = { id: 'demo-msg-' + Date.now(), conversation_id: fakeConvId, sender_role: 'customer', body: summaryBody, order_payload: orderPayload, created_at: nowIso }
      const ownerAck = { id: 'demo-msg-' + (Date.now() + 1), conversation_id: fakeConvId, sender_role: 'vendor', body: `Thanks ${custName || 'there'}! We received your order #${initials}-${orderNum}. We'll prep it now — about ${maxPrep || 15} minutes. We'll ping you here when it's ready.`, created_at: new Date(Date.now() + 1500).toISOString() }
      setChatConversation(fakeConv)
      setChatMessages([fakeMessage])
      // After 1.5s, simulate the vendor confirming the order so the user sees a 2-message thread
      setTimeout(() => setChatMessages(prev => [...prev, ownerAck]), 1500)
      setChatSending(false)
      setOrderDone(true)
      return
    }
    // Live gateway branching — if a real payment gateway is active for this vendor,
    // run the charge BEFORE the chat order. Priority: Midtrans → Xendit → HitPay → Stripe → Adyen → Checkout.com → Rapyd → PayPal → Razorpay → Braintree → Mollie.
    const activeGateway = vendorMidtransLive ? 'midtrans' : vendorXenditLive ? 'xendit' : vendorHitPayLive ? 'hitpay' : vendorFomoLive ? 'fomo-pay' : vendorStripeLive ? 'stripe' : vendorAdyenLive ? 'adyen' : vendorCkoLive ? 'checkout-com' : vendorRapydLive ? 'rapyd' : vendorAnetLive ? 'authorize-net' : vendorCsLive ? 'cybersource' : vendorWpLive ? 'worldpay' : vendorTcLive ? '2checkout' : vendorPayPalLive ? 'paypal' : vendorRazorpayLive ? 'razorpay' : vendorBraintreeLive ? 'braintree' : vendorMollieLive ? 'mollie' : null
    if (activeGateway) {
      const gatewayOrderId = `SL-${String(vendorId).slice(0,8)}-${Date.now()}`
      const payArgs = {
        orderId: gatewayOrderId,
        amount: grandTotal,
        currency: 'IDR',
        items: cart.map(c => ({ id: c.id, price: c.promoPrice || c.price, qty: c.qty, name: c.name })),
        deliveryFee,
        customerName: custName || 'Customer',
        customerPhone: cleanPhone,
      }
      try {
        if (activeGateway === 'midtrans') {
          const payRes = await payWithMidtrans(payArgs)
          if (payRes === 'closed' || payRes === 'failed') {
            setChatError(payRes === 'closed' ? 'Payment cancelled — your order was not sent.' : 'Payment failed — try again or use another method.')
            setChatSending(false)
            return
          }
          orderPayload.payment = { method: 'midtrans', status: payRes, gatewayOrderId }
        } else if (activeGateway === 'stripe') {
          // Stripe is hosted-redirect: we navigate away. Webhook flips status to paid.
          orderPayload.payment = { method: 'stripe', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending Stripe payment',
          }).catch(() => {})
          await payWithStripe({ ...payArgs, customerEmail: '' })
          return // browser is now navigating to Stripe
        } else if (activeGateway === 'xendit') {
          // Xendit is also hosted-redirect (Invoice page). Same pattern as Stripe.
          orderPayload.payment = { method: 'xendit', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending Xendit payment',
          }).catch(() => {})
          await payWithXendit({ ...payArgs, customerEmail: '', description: summaryItems })
          return // browser is now navigating to Xendit
        } else if (activeGateway === 'paypal') {
          // PayPal is hosted-redirect (Smart Checkout). Same pattern as Stripe/Xendit.
          orderPayload.payment = { method: 'paypal', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending PayPal payment',
          }).catch(() => {})
          await payWithPayPal({ ...payArgs, customerEmail: '' })
          return // browser is now navigating to PayPal
        } else if (activeGateway === 'razorpay') {
          // Razorpay hosted Payment Link (UPI / cards / NetBanking / wallets).
          orderPayload.payment = { method: 'razorpay', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending Razorpay payment',
          }).catch(() => {})
          await payWithRazorpay({ ...payArgs, customerEmail: '', description: summaryItems })
          return // browser is now navigating to Razorpay
        } else if (activeGateway === 'braintree') {
          // Braintree Drop-in UI modal (same page, awaited result like Midtrans).
          const payRes = await payWithBraintree({ ...payArgs, customerEmail: '' })
          if (payRes === 'closed' || payRes === 'failed') {
            setChatError(payRes === 'closed' ? 'Payment cancelled — your order was not sent.' : 'Payment failed — try again or use another method.')
            setChatSending(false)
            return
          }
          orderPayload.payment = { method: 'braintree', status: payRes, gatewayOrderId }
        } else if (activeGateway === 'mollie') {
          // Mollie hosted checkout redirect (iDEAL / Bancontact / SEPA / cards / PayPal / Klarna).
          orderPayload.payment = { method: 'mollie', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending Mollie payment',
          }).catch(() => {})
          await payWithMollie({ ...payArgs, customerEmail: '', description: summaryItems })
          return // browser is now navigating to Mollie
        } else if (activeGateway === 'hitpay') {
          // HitPay hosted checkout (cards / PayNow QR / Shopee Pay / GrabPay / Alipay / WeChat Pay).
          orderPayload.payment = { method: 'hitpay', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending HitPay payment',
          }).catch(() => {})
          await payWithHitPay({ ...payArgs, customerEmail: '', description: summaryItems })
          return // browser is now navigating to HitPay
        } else if (activeGateway === 'adyen') {
          // Adyen Pay-by-Link hosted redirect (250+ payment methods).
          orderPayload.payment = { method: 'adyen', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending Adyen payment',
          }).catch(() => {})
          await payWithAdyen({ ...payArgs, customerEmail: '', description: summaryItems })
          return // browser is now navigating to Adyen
        } else if (activeGateway === 'rapyd') {
          // Rapyd hosted Checkout (900+ local methods across 100+ countries).
          orderPayload.payment = { method: 'rapyd', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending Rapyd payment',
          }).catch(() => {})
          await payWithRapyd({ ...payArgs, customerEmail: '' })
          return // browser is now navigating to Rapyd
        } else if (activeGateway === 'checkout-com') {
          // Checkout.com Payment Link hosted redirect.
          orderPayload.payment = { method: 'checkout-com', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending Checkout.com payment',
          }).catch(() => {})
          await payWithCheckoutCom({ ...payArgs, customerEmail: '', description: summaryItems })
          return // browser is now navigating to Checkout.com
        } else if (activeGateway === 'fomo-pay') {
          // FOMO Pay hosted cashier (Asian e-wallets, WeChat/Alipay/GrabPay).
          orderPayload.payment = { method: 'fomo-pay', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending FOMO Pay payment',
          }).catch(() => {})
          await payWithFomoPay({ ...payArgs, customerEmail: '', description: summaryItems })
          return // browser is now navigating to FOMO Pay
        } else if (activeGateway === 'authorize-net') {
          // Authorize.net Accept Hosted (POST-form handoff, not GET redirect).
          orderPayload.payment = { method: 'authorize-net', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending Authorize.net payment',
          }).catch(() => {})
          await payWithAuthorizeNet({ ...payArgs, customerEmail: '' })
          return // form has been submitted; browser is navigating
        } else if (activeGateway === '2checkout') {
          // 2Checkout (Verifone) Buy Link hosted checkout.
          orderPayload.payment = { method: '2checkout', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending 2Checkout payment',
          }).catch(() => {})
          await payWithTwoCheckout({ ...payArgs, customerEmail: '', description: summaryItems })
          return // browser is now navigating to 2Checkout
        } else if (activeGateway === 'cybersource') {
          // CyberSource Secure Acceptance hosted checkout (signed form POST).
          orderPayload.payment = { method: 'cybersource', status: 'redirecting', gatewayOrderId }
          await sendCustomerOrder({
            vendorId,
            customerPhone: cleanPhone,
            customerName: custName || null,
            orderPayload,
            summaryBody: summaryBody + ' · Pending CyberSource payment',
          }).catch(() => {})
          await payWithCyberSource({ ...payArgs, customerEmail: '' })
          return // browser is now navigating to CyberSource Secure Acceptance
        } else if (activeGateway === 'worldpay') {
          // Worldpay (FIS) Online — card modal via Worldpay.js, server-side charge.
          const payRes = await payWithWorldpay({ ...payArgs, customerEmail: '', description: summaryItems })
          if (payRes === 'closed' || payRes === 'failed') {
            setChatError(payRes === 'closed' ? 'Payment cancelled — your order was not sent.' : 'Payment failed — try again or use another method.')
            setChatSending(false)
            return
          }
          orderPayload.payment = { method: 'worldpay', status: payRes, gatewayOrderId }
        }
      } catch (e) {
        console.error('Gateway payment failed', e)
        setChatError('Payment could not start. Try again in a moment.')
        setChatSending(false)
        return
      }
    }
    const res = await sendCustomerOrder({
      vendorId,
      customerPhone: cleanPhone,
      customerName: custName || null,
      orderPayload,
      summaryBody,
    })
    setChatSending(false)
    if (res.error) {
      setChatError(res.error)
      return
    }
    setChatConversation(res.conversation)
    setChatMessages([res.message])

    // Save customer to directory (localStorage + Supabase) — same as before
    const customers = loadJSON('foodlocalchat_customers', [])
    const returning = customers.find(c => c.phone === cleanPhone)
    if (returning) {
      returning.orders = (returning.orders || 0) + 1
      returning.totalSpent = (returning.totalSpent || 0) + totalPrice
      returning.lastOrder = new Date().toISOString()
      returning.name = custName || returning.name
    } else {
      customers.push({ phone: cleanPhone, name: custName, orders: 1, totalSpent: totalPrice, lastOrder: new Date().toISOString(), firstOrder: new Date().toISOString() })
    }
    saveJSON('foodlocalchat_customers', customers)
    if (supabase && vendorId && !String(vendorId).startsWith('local')) {
      try {
        supabase.from('vendor_customers').upsert({
          vendor_id: vendorId, phone: cleanPhone, name: custName,
          orders: returning ? returning.orders : 1,
          total_spent: returning ? returning.totalSpent : totalPrice,
          last_order: new Date().toISOString(),
        }, { onConflict: 'vendor_id,phone' }).then(() => {})
        supabase.from('vendor_orders').insert({
          vendor_id: vendorId, customer_name: custName, customer_phone: cleanPhone,
          items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
          subtotal: totalPrice, delivery_type: delEnabled ? 'delivery' : 'pickup', payment_method: payMethod || 'cod',
          note,
        }).then(() => {})
      } catch {}
    }
    setOrderDone(true)
  }

  /* --- Vendor chime: prime audio after first user click + WebAudio fallback --- */
  const primeVendorChime = useCallback(() => {
    if (!chimeAudioRef.current) {
      try {
        const a = new Audio('https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/notification-ping.mp3')
        a.preload = 'auto'
        a.volume = 0.7
        chimeAudioRef.current = a
      } catch {}
    }
    if (!vendorChimePrimed) {
      setVendorChimePrimed(true)
      try { localStorage.setItem('foodlocalchat_chimePrimed', 'true') } catch {}
    }
  }, [vendorChimePrimed])

  const playVendorChime = useCallback(() => {
    // Try the audio element first
    const a = chimeAudioRef.current
    if (a) {
      try { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => playWebAudioPing()); return } catch { /* fallback */ }
    }
    playWebAudioPing()
  }, [])

  function playWebAudioPing() {
    // 0.15s 880Hz sine fallback
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.16)
      setTimeout(() => { try { ctx.close() } catch {} }, 300)
    } catch {}
  }

  /* --- Vendor: load conversations + subscribe to incoming msgs --- */
  useEffect(() => {
    if (!isVendor || !vendorId || String(vendorId).startsWith('local')) return
    let cancelled = false
    ;(async () => {
      const list = await loadVendorConversations(vendorId)
      if (!cancelled) setVendorConversations(list)
    })()
    const unsub = subscribeToVendorMessages(vendorId, async (payload) => {
      if (payload.__conv) {
        // Conversation updated — refresh list
        const list = await loadVendorConversations(vendorId)
        setVendorConversations(list)
        return
      }
      // It's a chat_messages INSERT — only act on customer messages
      if (payload.sender_role === 'customer') {
        playVendorChime()
        try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]) } catch {}
        setFlashConvId(payload.conversation_id)
        setTimeout(() => setFlashConvId((cur) => cur === payload.conversation_id ? null : cur), 1500)
        const list = await loadVendorConversations(vendorId)
        setVendorConversations(list)
      }
      // If thread is open for this conversation, append
      if (vendorActiveConv && payload.conversation_id === vendorActiveConv.id) {
        setVendorThreadMessages((prev) => prev.find(m => m.id === payload.id) ? prev : [...prev, payload])
      }
    })
    return () => { cancelled = true; unsub && unsub() }
  }, [isVendor, vendorId, vendorActiveConv?.id, playVendorChime])

  /* --- Vendor: register SW for push --- */
  useEffect(() => {
    if (!isVendor) return
    if (pushSupported()) { try { registerSW() } catch {} }
    ;(async () => {
      const sub = await getCurrentSubscription()
      setVendorPushEnabled(!!sub)
    })()
  }, [isVendor])

  const onEnableVendorPush = async () => {
    if (vendorPushBusy) return
    setVendorPushBusy(true); setVendorPushMsg('')
    primeVendorChime()
    const res = await enableVendorPush(vendorId)
    setVendorPushBusy(false)
    if (res.error) { setVendorPushMsg(res.error); return }
    setVendorPushEnabled(true); setVendorPushMsg('Order alerts enabled.')
  }
  const onDisableVendorPush = async () => {
    if (vendorPushBusy) return
    setVendorPushBusy(true); setVendorPushMsg('')
    await disableVendorPush()
    setVendorPushBusy(false); setVendorPushEnabled(false); setVendorPushMsg('Order alerts disabled.')
  }

  /* --- Vendor: open conversation thread --- */
  const fetchVendorActiveOrder = useCallback(async (convId) => {
    if (!supabase || !convId) { setVendorActiveOrder(null); return }
    try {
      const { data } = await supabase
        .from('orders')
        .select('id, gateway_id, total, currency, payment_status, escrow_status, escrow_release_at, gateway_transaction_id')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setVendorActiveOrder(data || null)
    } catch { setVendorActiveOrder(null) }
  }, [supabase])
  const openVendorConv = useCallback(async (conv) => {
    primeVendorChime()
    setVendorActiveConv(conv)
    setVendorPayActionMsg('')
    const msgs = await loadMessages(conv.id, 200)
    setVendorThreadMessages(msgs)
    await clearVendorUnread(conv.id)
    fetchVendorActiveOrder(conv.id)
    // Refresh list to clear badge
    const list = await loadVendorConversations(vendorId)
    setVendorConversations(list)
  }, [vendorId, primeVendorChime, fetchVendorActiveOrder])
  // Vendor: release a held Stripe escrow order. Captures the PaymentIntent.
  const vendorReleaseEscrow = async () => {
    if (!supabase || !vendorActiveOrder || vendorPayActionBusy) return
    setVendorPayActionBusy(true); setVendorPayActionMsg('')
    try {
      const { data, error } = await supabase.functions.invoke('stripe-escrow-release', { body: { orderId: vendorActiveOrder.id, actor: 'vendor' } })
      if (error || !data?.ok) setVendorPayActionMsg(data?.error || 'Release failed.')
      else { setVendorPayActionMsg('Funds released to your Stripe account.'); fetchVendorActiveOrder(vendorActiveConv?.id) }
    } catch (e) { setVendorPayActionMsg(e?.message || 'Release failed') }
    finally { setVendorPayActionBusy(false) }
  }
  // Vendor: cancel a held Stripe escrow order. Voids the auth (no charge).
  const vendorCancelEscrow = async () => {
    if (!supabase || !vendorActiveOrder || vendorPayActionBusy) return
    if (!window.confirm('Cancel this hold? The customer\'s card will not be charged.')) return
    setVendorPayActionBusy(true); setVendorPayActionMsg('')
    try {
      const { data, error } = await supabase.functions.invoke('stripe-escrow-cancel', { body: { orderId: vendorActiveOrder.id, actor: 'vendor', reason: 'requested_by_customer' } })
      if (error || !data?.ok) setVendorPayActionMsg(data?.error || 'Cancel failed.')
      else { setVendorPayActionMsg('Hold cancelled — customer not charged.'); fetchVendorActiveOrder(vendorActiveConv?.id) }
    } catch (e) { setVendorPayActionMsg(e?.message || 'Cancel failed') }
    finally { setVendorPayActionBusy(false) }
  }
  // Vendor: refund a paid order via its gateway's refund Edge Function.
  const vendorRefund = async () => {
    if (!supabase || !vendorActiveOrder || vendorPayActionBusy) return
    const fnName = REFUND_FUNCTION_BY_GATEWAY[vendorActiveOrder.gateway_id]
    if (!fnName) { setVendorPayActionMsg('Refund not supported for this payment method.'); return }
    if (!window.confirm(`Refund ${vendorActiveOrder.currency || ''} ${vendorActiveOrder.total}? This cannot be undone.`)) return
    setVendorPayActionBusy(true); setVendorPayActionMsg('')
    try {
      const { data, error } = await supabase.functions.invoke(fnName, { body: { orderId: vendorActiveOrder.id, reason: 'Vendor-initiated refund' } })
      if (error || !data?.ok) setVendorPayActionMsg(data?.error || 'Refund failed.')
      else { setVendorPayActionMsg('Refund issued.'); fetchVendorActiveOrder(vendorActiveConv?.id) }
    } catch (e) { setVendorPayActionMsg(e?.message || 'Refund failed') }
    finally { setVendorPayActionBusy(false) }
  }

  const sendVendorReply = async () => {
    if (!vendorActiveConv) return
    const body = vendorReplyDraft.trim()
    if (!body) return
    setVendorReplyDraft('')
    const optimistic = { id: 'tmp-' + Date.now(), conversation_id: vendorActiveConv.id, sender_role: 'vendor', body, created_at: new Date().toISOString() }
    setVendorThreadMessages((prev) => [...prev, optimistic])
    const res = await sendChatText({ conversationId: vendorActiveConv.id, senderRole: 'vendor', body })
    if (res.message) setVendorThreadMessages((prev) => prev.map(m => m.id === optimistic.id ? res.message : m))
  }
  const sendVendorStatus = async (status) => {
    if (!vendorActiveConv) return
    const body = `Status: ${status}`
    const optimistic = { id: 'tmp-' + Date.now(), conversation_id: vendorActiveConv.id, sender_role: 'system', body, created_at: new Date().toISOString() }
    setVendorThreadMessages((prev) => [...prev, optimistic])
    const res = await sendSystemStatus({ conversationId: vendorActiveConv.id, body })
    if (res.message) setVendorThreadMessages((prev) => prev.map(m => m.id === optimistic.id ? res.message : m))
  }

  /* --- Persist showVisitUsWA toggle --- */
  useEffect(() => {
    try { localStorage.setItem('foodlocalchat_showVisitUsWA', showVisitUsWA ? 'true' : 'false') } catch {}
    if (supabase && vendorId && !String(vendorId).startsWith('local')) {
      try { supabase.from('vendor_accounts').update({ show_wa_on_visit_us: !!showVisitUsWA }).eq('id', vendorId).then(() => {}) } catch {}
    }
  }, [showVisitUsWA, vendorId])

  /* --- Menu category filter --- */
  const [menuFilter, setMenuFilter] = useState('All')
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  // Theme-specific category defaults: when shopTheme has a THEME_CATEGORY_OVERRIDES
  // entry (e.g. 'donut' — donut subtypes + drink subtypes), seed those types
  // so the customer-side toggle tabs + filter drawer show theme-relevant
  // categories instead of food taxonomy even before the vendor has added any
  // items. Drink subtypes (Fresh Juice / Soda Drinks / Water / Ice Drinks)
  // are now in the override's second group — no hardcoded 'Drinks' fallback.
  const themeMenuDefaults = (() => {
    const groups = THEME_CATEGORY_OVERRIDES[shopTheme]
    if (!groups || groups.length === 0) return []
    return groups.flatMap(g => g.types)
  })()
  const MENU_CATEGORIES = ['All', ...new Set([...themeMenuDefaults, ...menuItems.map(m => m.category).filter(Boolean)])]
  // Donut theme: pre-compute the two type sets so the toggle can render two
  // virtual GROUP tabs ("Donuts" / "Drinks") that filter by any matching
  // subtype, instead of forcing the vendor to scroll through 34 specific tabs
  // to find drinks. Drawer still lists every subtype individually.
  const DONUT_GROUP_FILTERS = (() => {
    if (shopTheme !== 'donut') return null
    const groups = THEME_CATEGORY_OVERRIDES.donut || []
    const donutTypes = groups[0]?.types || []
    const drinkTypes = groups[1]?.types || []
    return {
      donuts: new Set(donutTypes),
      drinks: new Set(drinkTypes),
    }
  })()

  /* --- Vendor type (warung / bakery / cafe / restaurant / general) --- */
  const [vendorType, setVendorType] = useState(() => localStorage.getItem('vendorbasic_vendor_type') || null)
  const [vendorTypePickerOpen, setVendorTypePickerOpen] = useState(false)
  useEffect(() => {
    if (vendorType) {
      try { localStorage.setItem('vendorbasic_vendor_type', vendorType) } catch {}
    }
  }, [vendorType])
  // Auto-open the picker once when vendor first enters admin without having chosen a type
  useEffect(() => {
    if (isVendor && !vendorType && !isDemo) setVendorTypePickerOpen(true)
  }, [isVendor, vendorType, isDemo])

  // Quick-chip suggestions: preset for current type ∪ any custom categories already in menu.
  // Donut theme overrides the preset with the 10 curated donut categories so
  // vendors aren't shown irrelevant warung/cafe taxonomy. The "+ Add custom"
  // input next to the chips acts as the Other path.
  const vendorPreset = vendorType ? VENDOR_TYPES[vendorType] : VENDOR_TYPES.warung
  const categoryChips = (() => {
    const existing = menuItems.map(m => m.category).filter(Boolean)
    if (shopTheme === 'donut') {
      const donutCats = (THEME_CATEGORY_OVERRIDES.donut?.[0]?.types) || []
      return [...new Set([...donutCats, ...existing])]
    }
    return [...new Set([...vendorPreset.categories, ...existing])]
  })()

  /* --- Visit Us FAB — expanded with "Visit Us" label on first session, collapses to pin only --- */
  const [fabExpanded, setFabExpanded] = useState(() => !localStorage.getItem('vendorbasic_visit_seen'))
  useEffect(() => {
    if (!fabExpanded) return
    const t = setTimeout(() => {
      setFabExpanded(false)
      try { localStorage.setItem('vendorbasic_visit_seen', '1') } catch {}
    }, 3000)
    return () => clearTimeout(t)
  }, [fabExpanded])

  /* --- Visible menu --- */
  // Customers don't see items that are unavailable OR have stock === 0. Vendor admin sees everything.
  const visibleMenu = (isVendor ? menuItems : menuItems.filter((m) => m.available && (m.stock == null || m.stock > 0))).filter(m => {
    if (menuFilter === 'All') return true
    // Donut theme virtual group filters: __donuts__ matches any donut subtype,
    // __drinks__ matches any drink subtype. Real category filters still match
    // exact category names as before.
    if (DONUT_GROUP_FILTERS && menuFilter === '__donuts__') return DONUT_GROUP_FILTERS.donuts.has(m.category)
    if (DONUT_GROUP_FILTERS && menuFilter === '__drinks__') return DONUT_GROUP_FILTERS.drinks.has(m.category)
    return m.category === menuFilter
  })

  // Active daily deals — filter by current time
  const activeDeals = dailyDeals.filter(d => {
    if (!d.active) return false
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const start = new Date(`${today}T${d.startTime || '00:00'}`)
    const end = new Date(`${today}T${d.endTime || '23:59'}`)
    return now >= start && now <= end
  })
  const hasDeals = activeDeals.length > 0

  /* ═══════════════════════ RENDER ══════════════════��════ */

  /* ═══ SPLASH SCREEN ═══ */
  if (showSplash && splashEnabled) {
    const HERO_FONTS_SP = { system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', nunito: '"Nunito", sans-serif', poppins: '"Poppins", sans-serif', playfair: '"Playfair Display", serif', caveat: '"Caveat", cursive', bebas: '"Bebas Neue", sans-serif' }
    const HERO_SIZES_SP = { normal: 42, large: 52, xl: 62 }
    const ffSp = HERO_FONTS_SP[heroFont] || HERO_FONTS_SP.system
    const titleSize = HERO_SIZES_SP[heroSize] || HERO_SIZES_SP.normal
    const EFFECTS_SP = {
      shadow: { textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.5)' },
      glow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 0 60px ${heroColor}20, 0 2px 4px rgba(0,0,0,0.9)` },
      runGlow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 2px 4px rgba(0,0,0,0.9)` },
      outline: { WebkitTextStroke: `2px ${heroColor}`, color: 'transparent', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
      neon: { textShadow: `0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}, 0 0 42px ${heroColor}80, 0 0 82px ${heroColor}40` },
      none: { textShadow: 'none' },
    }
    const fxSp = EFFECTS_SP[heroEffect] || EFFECTS_SP.shadow
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden' }}>
        {/* Theme background — same as landing */}
        <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...bgStyle }} />
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})` }} />
        {/* Logo — respects shopLogoStyle (off / bare / circle) */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, zIndex: 2 }}>
          {shopLogoStyle !== 'off' && shopLogo ? (
            shopLogoStyle === 'bare' ? (
              <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 200, height: 200, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))', transform: `translate(${logoOffsetX}px, ${logoOffsetY}px)` }} />
            ) : (
              <div style={{ width: 156, height: 156, borderRadius: 78, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', border: '3px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: Math.round(156 * logoInner / 100), height: Math.round(156 * logoInner / 100), objectFit: 'contain', transform: `translate(${logoOffsetX}px, ${logoOffsetY}px)` }} />
              </div>
            )
          ) : shopLogoStyle !== 'off' ? (
            <div style={{ width: 90, height: 90, borderRadius: 45, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#fff', border: '3px solid rgba(255,255,255,0.15)' }}>{shopName.charAt(0).toUpperCase()}</div>
          ) : null}
          <div style={{ fontSize: titleSize, fontWeight: 800, color: heroEffect === 'outline' ? 'transparent' : heroColor, fontFamily: ffSp, textAlign: 'center', lineHeight: 1.15, letterSpacing: -0.5, padding: '0 16px', ...fxSp }}>{shopName}</div>
        </div>
      </div>
    )
  }

  /* ═══ LANDING PAGE — full screen, no content behind ═══ */
  if (showLanding) {
    // If the vendor picked a saved landing theme (e.g. 'donuts'), render that
    // frozen theme inside an iframe in place of the default splash. The iframe
    // posts a message back when the customer taps its CTA — we listen for that
    // and flip showLanding to false so the menu reveals (the existing menu flow
    // takes over after that point).
    // Treat donut theme as the donut splash even if landingThemeId hasn't
    // been synced yet from Supabase — prevents a 1-3s flash of the generic
    // "Street Noodle" splash before vendor data arrives.
    if (landingThemeId === 'donuts' || shopTheme === 'donut') {
      // Render the saved donut theme exactly as approved. The snapshot at
      // /themes/donuts.html is pixel-accurate to the approved gallery design.
      // The HTML file is served from the landing app's /public, NOT from
      // food-basic — and food-basic's Vite base is '/food/chat/', so a bare
      // '/themes/donuts.html' here gets resolved to '/food/chat/themes/...'
      // which 404s into food-basic's SPA fallback. donutsHtmlSrc (computed
      // above) builds the right cross-origin URL in dev / same-origin in
      // prod, and appends ?hero=<url> when the vendor has uploaded a custom
      // hero image via Design Studio.
      const donutsSrc = donutsHtmlSrc
      return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: donutLanding.pink || '#F472B6' }}>
          {/* Language toggle still available at top-right */}
          <button onClick={() => {
            const codes = LANGUAGES.map(l => l.code)
            const idx = codes.indexOf(locale)
            setLocale(codes[(idx + 1) % codes.length])
          }} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, height: 36, borderRadius: 18, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={LANGUAGES.find(l => l.code === locale)?.flag} alt="" onError={imgError('generic')} style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{LANGUAGES.find(l => l.code === locale)?.label || 'EN'}</span>
          </button>
          {/* DonutSplash — React port of the frozen donuts.html design.
              Reads from `donutLanding` state so every text / image / colour
              is editable from the Landing Page Edit. */}
          <DonutSplash landing={donutLanding} onEnter={() => setShowLanding(false)} />
        </div>
      )
    }
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {/* Background image — uses vendor's selected theme */}
        <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle }} />


        {/* Language toggle — top right, single flag, tap to switch */}
        <button onClick={() => {
          const codes = LANGUAGES.map(l => l.code)
          const idx = codes.indexOf(locale)
          setLocale(codes[(idx + 1) % codes.length])
        }} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, height: 36, borderRadius: 18, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src={LANGUAGES.find(l => l.code === locale)?.flag} alt="" onError={imgError('generic')} style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{LANGUAGES.find(l => l.code === locale)?.label || 'EN'}</span>
        </button>

        {/* Background overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `rgba(0,0,0,${overlayOpacity / 100})`, zIndex: 1 }} />

        {/* Closed banner overlay — always shown when shop is closed */}
        {!shopOpen && (
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: 'rgba(220,38,38,0.9)', color: '#fff', padding: '10px 28px', borderRadius: 10, fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>CLOSED</div>
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: landingLayout === 'footer' ? 'flex-end' : 'center', paddingBottom: landingLayout === 'footer' ? 120 : 0 }}>
          {/* Shop logo — scaled by logoScale. Base sizes = original; 200% slider = real 2x */}
          {shopLogoStyle !== 'off' && shopLogo ? (() => {
            const scale = logoScale / 100
            const heroBare = Math.round(200 * scale)
            const heroOuter = Math.round(156 * scale)
            // Inner image fills (logoInner)% of the circle, leaving safe padding so it doesn't
            // touch the edges. objectFit:contain keeps the entire logo visible (no cropping).
            const innerPx = Math.round(heroOuter * logoInner / 100)
            return shopLogoStyle === 'bare' ? (
              <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: heroBare, height: heroBare, maxWidth: 'calc(100vw - 20px)', maxHeight: '50vh', objectFit: 'contain', marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))', transform: `translate(${logoOffsetX}px, ${logoOffsetY}px)` }} />
            ) : (
              <div style={{ width: heroOuter, height: heroOuter, maxWidth: 'calc(100vw - 20px)', maxHeight: '50vh', borderRadius: heroOuter / 2, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: `0 4px 24px rgba(0,0,0,0.5)`, border: '3px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: innerPx, height: innerPx, objectFit: 'contain', transform: `translate(${logoOffsetX}px, ${logoOffsetY}px)` }} />
              </div>
            )
          })() : shopLogoStyle !== 'off' ? (() => {
            const fallSz = Math.round(90 * logoScale / 100)
            return <div style={{ width: fallSz, height: fallSz, borderRadius: fallSz / 2, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(40 * logoScale / 100), fontWeight: 900, color: '#fff', marginBottom: 16, border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>{shopName.charAt(0).toUpperCase()}</div>
          })() : null}

          {/* Shop name + tagline + city */}
          {(() => {
            const HERO_FONTS = { system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', nunito: '"Nunito", sans-serif', poppins: '"Poppins", sans-serif', playfair: '"Playfair Display", serif', caveat: '"Caveat", cursive', bebas: '"Bebas Neue", sans-serif' }
            const HERO_SIZES = { normal: { title: 42, sub: 18, city: 12 }, large: { title: 52, sub: 22, city: 14 }, xl: { title: 62, sub: 26, city: 16 } }
            const sz = HERO_SIZES[heroSize] || HERO_SIZES.normal
            const ff = HERO_FONTS[heroFont] || HERO_FONTS.system
            const subC = heroSubColor || (heroColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : heroColor)
            const cityC = heroSubColor || (heroColor === '#ffffff' ? 'rgba(255,255,255,0.7)' : heroColor)
            const EFFECTS = {
              shadow: { textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.5)', WebkitTextStroke: '1px rgba(0,0,0,0.3)' },
              glow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 0 60px ${heroColor}20, 0 2px 4px rgba(0,0,0,0.9)` },
              runGlow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 2px 4px rgba(0,0,0,0.9)`, animation: 'heroRunGlow 3s ease-in-out infinite' },
              outline: { WebkitTextStroke: `2px ${heroColor}`, color: 'transparent', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
              neon: { textShadow: `0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}, 0 0 42px ${heroColor}80, 0 0 82px ${heroColor}40`, animation: 'heroNeonFlicker 4s ease-in-out infinite' },
              none: { textShadow: 'none' },
            }
            const fx = EFFECTS[heroEffect] || EFFECTS.shadow
            // Smart word wrapping: split name into lines by word fitting
            const nameLines = shopName.split(' ')
            const maxCharsPerLine = sz.title >= 52 ? 10 : 14
            const lines = []
            let currentLine = ''
            nameLines.forEach(word => {
              if (currentLine && (currentLine + ' ' + word).length > maxCharsPerLine) {
                lines.push(currentLine)
                currentLine = word
              } else {
                currentLine = currentLine ? currentLine + ' ' + word : word
              }
            })
            if (currentLine) lines.push(currentLine)

            return (
              <>
                <style>{`
                  @keyframes heroRunGlow { 0%, 100% { text-shadow: 0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 2px 4px rgba(0,0,0,0.9); } 50% { text-shadow: 0 0 20px ${heroColor}, 0 0 50px ${heroColor}60, 0 0 80px ${heroColor}30, 0 2px 4px rgba(0,0,0,0.9); } }
                  @keyframes heroNeonFlicker { 0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { text-shadow: 0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}, 0 0 42px ${heroColor}80, 0 0 82px ${heroColor}40; } 20%, 24%, 55% { text-shadow: none; } }
                `}</style>
                <div style={{ textAlign: landingLayout === 'left' ? 'left' : 'center', marginBottom: 8, padding: '0 16px' }}>
                  {lines.map((line, i) => (
                    <div key={i} style={{ fontSize: sz.title, fontWeight: 800, color: heroEffect === 'outline' ? 'transparent' : heroColor, fontFamily: ff, lineHeight: 1.15, letterSpacing: -0.5, ...fx }}>{line}</div>
                  ))}
                </div>
                {(customTagline || shopFoodType) && (() => {
                  const lines = (customTagline || shopFoodType).split('\n').filter(l => l.length > 0).slice(0, 2)
                  return (
                    <div style={{ padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
                      {lines.map((line, i) => (
                        <h2 key={i} style={{ textAlign: landingLayout === 'left' ? 'left' : 'center', margin: 0, marginBottom: i === lines.length - 1 ? 6 : 2, fontSize: sz.sub, fontWeight: 600, color: subC, fontFamily: ff, textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)', letterSpacing: 1, opacity: heroSubColor ? 1 : 0.85, wordBreak: 'break-word' }}>{line}</h2>
                      ))}
                    </div>
                  )
                })()}
                {(shopCity || shopCountry) && (
                  <p style={{ textAlign: landingLayout === 'left' ? 'left' : 'center', marginBottom: 40, fontSize: sz.city, fontWeight: 600, color: cityC, fontFamily: ff, textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)', opacity: heroSubColor ? 1 : 0.7 }}>
                    {[shopCity, shopCountry].filter(Boolean).join(', ')}
                  </p>
                )}
              </>
            )
          })()}
        </div>

        {/* Enter button — yellow — bottom */}
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, gap: 14 }}>
          <style>{`@keyframes landingGlow { 0% { left: -100%; } 100% { left: 200%; } }`}</style>
          {/* Set Location / Enter button */}
          <button onClick={() => {
            if (!delEnabled || !navigator.geolocation) { setShowLanding(false); return }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const d = haversineKm(SHOP_LAT, SHOP_LON, pos.coords.latitude, pos.coords.longitude)
                setUserDistance(Math.round(d * 10) / 10)
                setShowLanding(false)
              },
              () => setShowLanding(false)
            )
          }} style={{
            padding: `${Math.round(14 * btnSize / 100)}px ${Math.round(44 * btnSize / 100)}px`, border: 'none',
            borderRadius: btnShape === 'pill' ? 50 : btnShape === 'square' ? 4 : 12,
            cursor: 'pointer', fontSize: Math.round(15 * btnSize / 100), fontWeight: 700,
            position: 'relative', overflow: 'visible',
            background: btnColor || (isCustomAccent ? accent : '#FACC15'),
            color: (btnColor || (isCustomAccent ? accent : '#FACC15')) === '#FACC15' ? '#000' : '#fff',
            transformOrigin: 'center',
            whiteSpace: 'nowrap',
            ...(btnEffect === 'shake' ? { animation: 'btnShake 1s ease-in-out infinite' } : {}),
            ...(btnEffect === 'heartbeat' ? { animation: 'btnHeartbeat 1.2s ease-in-out infinite' } : {}),
          }}>
            {/* Running glow — bright shine sweeping across the button face */}
            {btnEffect === 'glow' && (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: btnShape === 'pill' ? 50 : btnShape === 'square' ? 4 : 12, pointerEvents: 'none' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%)',
                  animation: 'btnRunningGlow 2s linear infinite',
                }} />
              </div>
            )}
            {/* Signal rings — 2 staggered pings behind */}
            {btnEffect === 'signal' && (
              <>
                <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', borderRadius: btnShape === 'pill' ? 50 : btnShape === 'square' ? 4 : 12, border: `2px solid ${btnColor || accent}`, zIndex: -1, pointerEvents: 'none', animation: 'btnSignalPing 1.6s ease-out infinite' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', borderRadius: btnShape === 'pill' ? 50 : btnShape === 'square' ? 4 : 12, border: `2px solid ${btnColor || accent}`, zIndex: -1, pointerEvents: 'none', animation: 'btnSignalPing 1.6s ease-out infinite', animationDelay: '0.8s' }} />
              </>
            )}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: btnShape === 'pill' ? 50 : btnShape === 'square' ? 4 : 12 }}>
              <div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} />
            </div>
            <span style={{ position: 'relative', zIndex: 1 }}>{btnText || 'View Menu'}</span>
          </button>
          <a href="https://streetlocal.live" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 8, letterSpacing: 1, textDecoration: 'none' }}>streetlocal.live</a>

          {/* DEV: Quick dashboard access */}
          {!previewMode && <button onClick={() => { setIsVendor(true); setShowLanding(false); setVendorDrawer(true) }} style={{ marginTop: 10, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}>DEV: Dashboard</button>}
          {/* Preview mode — back to dashboard */}
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>

      {/* --- Vendor mode bar --- */}

      {/* --- Subscription expired banner --- */}
      {isVendor && vendorStatus === 'expired' && (
        <div style={{ background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: 12, margin: '8px 12px', padding: '12px 16px', textAlign: 'center', color: '#ff6b6b', fontSize: 14, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <span>Subscription expired — pay to renew</span>
          <button onClick={() => { setSubError(''); setSubPickerOpen(true) }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#22C55E', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', minHeight: 36 }}>Renew Now</button>
        </div>
      )}

      {/* --- Subscription renewal reminder (7-day window before expiry) --- */}
      {isVendor && vendorStatus === 'active' && vendorExpiresAt && (() => {
        const daysLeft = Math.ceil((new Date(vendorExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        if (daysLeft > 7 || daysLeft < 0) return null
        const urgent = daysLeft <= 2
        return (
          <div style={{ background: urgent ? 'rgba(245,158,11,0.18)' : 'rgba(250,204,21,0.12)', border: `1px solid ${urgent ? 'rgba(245,158,11,0.45)' : 'rgba(250,204,21,0.35)'}`, borderRadius: 12, margin: '8px 12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{urgent ? '⏰' : '🔔'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: urgent ? '#F59E0B' : '#FACC15' }}>
                {daysLeft === 0 ? 'Subscription expires today' : daysLeft === 1 ? 'Subscription expires tomorrow' : `Subscription expires in ${daysLeft} days`}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Renew now to keep customers ordering — no downtime.</div>
            </div>
            <button onClick={() => { setSubError(''); setSubPickerOpen(true) }} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: 'none', background: '#22C55E', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', minHeight: 36 }}>Renew</button>
          </div>
        )
      })()}

      {/* --- Activation pending banner (post-signup, before payment) --- */}
      {isVendor && (vendorStatus === 'pending' || (vendorStatus === null && vendorId && !String(vendorId).startsWith('local'))) && (
        <div style={{ background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.35)', borderRadius: 12, margin: '8px 12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>Pay to activate your shop</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>You can build your menu in preview mode. Customers can't place orders until you pay your monthly plan.</div>
          <button onClick={() => { setSubError(''); setSubPickerOpen(true) }} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#22C55E', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', minHeight: 40 }}>Choose Plan & Pay</button>
          {subMessage && <div style={{ fontSize: 13, color: '#86EFAC' }}>{subMessage}</div>}
        </div>
      )}

      {/* --- Subscription plan picker modal --- */}
      {subPickerOpen && (
        <div onClick={() => !subBusy && setSubPickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f0f12', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, width: '100%', maxWidth: 480, color: '#fff', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -10px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 4 }} />
            <div style={{ fontSize: 17, fontWeight: 800 }}>Choose your plan</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: -8, marginBottom: 4 }}>30 days of access. Pay via QRIS, GoPay, OVO, ShopeePay, Card, or Bank Transfer.</div>
            <button type="button" disabled={subBusy} onClick={() => startSubscriptionCheckout('whatsapp')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, border: '1px solid rgba(37,211,102,0.4)', background: 'rgba(37,211,102,0.08)', color: '#fff', textAlign: 'left', cursor: subBusy ? 'wait' : 'pointer', minHeight: 64, opacity: subBusy ? 0.6 : 1 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,211,102,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>📱</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>WhatsApp orders · Rp 35.000 / month</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.4 }}>Customers send orders to your WhatsApp — you handle the rest.</div>
              </div>
            </button>
            <button type="button" disabled={subBusy} onClick={() => startSubscriptionCheckout('chat')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, border: `1px solid ${accent}55`, background: `${accent}15`, color: '#fff', textAlign: 'left', cursor: subBusy ? 'wait' : 'pointer', minHeight: 64, opacity: subBusy ? 0.6 : 1 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>💬</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>App Chat orders · Rp 50.000 / month</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.4 }}>Real-time in-app chat + 16 payment gateways + order tracking.</div>
              </div>
            </button>
            {subError && <div style={{ fontSize: 13, color: '#FCA5A5', textAlign: 'center', padding: '4px 8px' }}>{subError}</div>}
            <button type="button" onClick={() => setSubPickerOpen(false)} disabled={subBusy} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, cursor: subBusy ? 'wait' : 'pointer', minHeight: 44 }}>{subBusy ? 'Opening Midtrans…' : 'Cancel'}</button>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 10 }}>
          {shopLogoStyle !== 'off' && shopLogo ? (
            shopLogoStyle === 'bare' ? (
              <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))', transform: `translate(${logoOffsetX * 40 / 156}px, ${logoOffsetY * 40 / 156}px)` }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 22, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 40, height: 40, objectFit: 'contain', transform: `translate(${logoOffsetX * 40 / 156}px, ${logoOffsetY * 40 / 156}px)` }} />
              </div>
            )
          ) : shopLogoStyle !== 'off' ? (
            <div style={{ width: 40, height: 40, borderRadius: 20, background: isCustomAccent ? accent : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>{shopName.charAt(0).toUpperCase()}</div>
          ) : null}
          <div>
            <span style={S.shopName}>{shopName}</span>
            <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 1, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{shopFoodType}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* DEV: Quick dashboard toggle */}
          {!isVendor && (
            <button onClick={() => { setIsVendor(true); setVendorDrawer(true) }} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>DEV</button>
          )}
          {/* Hamburger menu (vendor only) */}
          {isVendor && (
            <button onClick={() => setVendorDrawer(true)} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 6, minWidth: 38, minHeight: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          )}
          {/* Cart icon (hidden for vendor) */}
          {!isVendor && <button onClick={() => { if (cart.length > 0) { setCheckoutOpen(true); setOrderDone(false) } }} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', padding: 6, minWidth: 38, minHeight: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            {cart.length > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cart.reduce((s, c) => s + c.qty, 0)}
              </span>
            )}
          </button>}
        </div>
      </div>


      {/* --- Coming Soon overlay for pending vendors (public visitors only) --- */}
      {!isVendor && publicVendorStatus === 'pending' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {publicVendorLogo && <img src={publicVendorLogo} alt="" onError={imgError('logo')} style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', marginBottom: 16 }} />}
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8, textAlign: 'center' }}>{publicVendorName || shopName}</h1>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFD600', marginBottom: 8 }}>{t.comingSoon || 'Coming Soon!'}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.6, maxWidth: 280, marginBottom: 30 }}>
            {locale === 'id' ? 'Kami sedang mempersiapkan menu. Kunjungi lagi segera!' : 'We\'re preparing our menu. Check back shortly!'}
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, textAlign: 'center', width: '100%', maxWidth: 280 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Powered by</p>
            <a href="https://streetlocal.live" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD600' }}>StreetLocal</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Get your own food ordering software</div>
              <div style={{ fontSize: 13, color: '#8DC63F', fontWeight: 700, marginTop: 4 }}>from $2.50/month →</div>
            </a>
          </div>
        </div>
      )}

      {/* --- Promo Banner (marquee) — edge-safe via inner padded overflow-hidden box --- */}
      {promoBannerEnabled && promoBanner && (
        <div style={{ padding: '2px 0' }}>
          <div style={{ overflow: 'hidden', padding: '0 16px' }}>
            <style>{`
              @keyframes promoBannerScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
              @keyframes promoBannerWave { 0% { transform: translateX(100%) translateY(0); } 25% { transform: translateX(50%) translateY(-6px); } 50% { transform: translateX(0%) translateY(0); } 75% { transform: translateX(-50%) translateY(6px); } 100% { transform: translateX(-100%) translateY(0); } }
              @keyframes promoBannerGlow { 0%, 100% { text-shadow: 0 0 4px rgba(156,163,175,0.4); } 50% { text-shadow: 0 0 14px rgba(156,163,175,0.9), 0 0 22px rgba(156,163,175,0.5); } }
              @keyframes promoBannerPulse { 0%, 100% { transform: translateX(100%) scale(1); } 50% { transform: translateX(0%) scale(1.06); } }
              @keyframes promoBannerFade { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
              @keyframes promoBannerShake { 0%, 100% { transform: translateX(100%); } 10% { transform: translateX(95%) translateY(-1px); } 20% { transform: translateX(85%) translateY(1px); } 50% { transform: translateX(0%) translateY(-1px); } 80% { transform: translateX(-85%) translateY(1px); } 90% { transform: translateX(-95%) translateY(-1px); } }
            `}</style>
            {(() => {
              const animMap = {
                scroll:  'promoBannerScroll 14s linear infinite',
                wave:    'promoBannerWave 14s ease-in-out infinite',
                glow:    'promoBannerScroll 14s linear infinite, promoBannerGlow 2s ease-in-out infinite',
                pulse:   'promoBannerPulse 14s ease-in-out infinite',
                fade:    'promoBannerScroll 14s linear infinite, promoBannerFade 2.5s ease-in-out infinite',
                shake:   'promoBannerShake 14s linear infinite',
                none:    'promoBannerScroll 14s linear infinite',
              }
              const anim = animMap[promoBannerEffect] || animMap.scroll
              return (
                <div style={{ whiteSpace: 'nowrap', animation: anim, fontSize: 13, fontWeight: 700, color: '#9CA3AF', display: 'inline-block' }}>
                  {promoBanner.split('\n').map(s => s.trim()).filter(Boolean).join('   ·   ')}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ═══ Reviews modal — list + leave-a-review form ═══ */}
      {reviewsOpen && shopTheme === 'donut' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 260, display: 'flex', flexDirection: 'column' }} onClick={() => setReviewsOpen(false)}>
          {/* Theme bg + scrim — matches the rest of the app */}
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_52_32-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 0 }} />

          {/* Header */}
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setReviewsOpen(false)} style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Reviews</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                {reviews.length > 0 ? `${reviewsAvg.toFixed(1)} ★ · ${reviews.length} review${reviews.length === 1 ? '' : 's'}` : 'Be the first to review'}
              </div>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '0 16px 20px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
            {/* Leave-a-review form */}
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${accent}33`, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Leave a review</div>
              {/* Star picker */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setReviewForm(f => ({ ...f, rating: f.rating === i ? 0 : i }))} aria-label={`${i} stars`} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', color: i <= reviewForm.rating ? '#FACC15' : 'rgba(255,255,255,0.25)', fontSize: 30, cursor: 'pointer', padding: 0, lineHeight: 1 }}>★</button>
                ))}
              </div>
              {/* Comment */}
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value.slice(0, 280) }))}
                placeholder="What did you think of your donuts?"
                rows={3}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, lineHeight: 1.5, outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginBottom: 10 }}>{reviewForm.comment.length}/280</div>
              {/* Name */}
              <input
                value={reviewForm.name}
                onChange={(e) => setReviewForm(f => ({ ...f, name: e.target.value.slice(0, 40) }))}
                placeholder="Your name (optional)"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }}
              />
              <button onClick={submitReview} disabled={!reviewForm.rating} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none', background: reviewForm.rating ? accent : 'rgba(255,255,255,0.1)', color: reviewForm.rating ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: 900, cursor: reviewForm.rating ? 'pointer' : 'not-allowed', minHeight: 48, boxShadow: reviewForm.rating ? `0 6px 18px ${accent}55` : 'none' }}>
                {reviewForm.rating ? 'Post Review' : 'Pick a star rating to continue'}
              </button>
            </div>

            {/* All reviews */}
            {reviews.length === 0 ? (
              <div style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>★</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>No reviews yet</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Be the first to share your experience.</div>
              </div>
            ) : (
              reviews.map(r => (
                <div key={r.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: accent, color: '#fff', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{r.name}</div>
                        <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <span key={i} style={{ fontSize: 13, color: i <= r.rating ? '#FACC15' : 'rgba(255,255,255,0.2)' }}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  {r.comment && (
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>{r.comment}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating donut button — customer entry to the Donut Types gallery.
          Three donut images stacked + cross-faded so the button feels alive
          and signals "multiple donuts inside". Cycle every 2.5s.
          Home-page only: hide on splash, checkout/cart, item detail, the
          gallery itself, and the reviews modal. */}
      {shopTheme === 'donut' && !isVendor && !showLanding && !checkoutOpen && !itemModal && !donutTypesGallery && !reviewsOpen && (() => {
        // Always render on donut theme — gallery uses mock donuts as fallback
        // content when the vendor hasn't uploaded any yet.
        const FLOAT_IMGS = [
          'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_26_20%20AM.png?updatedAt=1778707604129',
          'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_30_51%20AM.png?updatedAt=1778707873204',
          'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2008_45_54%20PM.png',
          'https://ik.imagekit.io/nepgaxllc/Untitledasdaaaavdddddd-removebg-preview%20(1).png',
          'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2009_19_03%20PM.png',
        ]
        return (
          <button onClick={() => { setDonutTypesIdx(0); setDonutTypesGallery(true) }} aria-label="Meet our donuts" style={{
            // When the sticky checkout bar is showing (cart > 0) push the
            // floating donut above it so it doesn't cover the Checkout button.
            position: 'fixed', bottom: totalItems > 0 ? 80 : 20, right: 16, zIndex: 240,
            width: 86, height: 86, borderRadius: 43, border: 'none',
            background: 'transparent', cursor: 'pointer', padding: 0,
            display: 'block', overflow: 'visible',
            filter: `drop-shadow(0 8px 24px ${accent}99) drop-shadow(0 2px 6px rgba(0,0,0,0.5))`,
            animation: 'donutFloatPulse 2.4s ease-in-out infinite',
          }}>
            <style>{`
              @keyframes donutFloatPulse { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.08) rotate(2deg); } }
              @keyframes donutFloatCycle1 { 0%, 18% { opacity: 1; } 22%, 98% { opacity: 0; } 100% { opacity: 1; } }
              @keyframes donutFloatCycle2 { 0%, 18% { opacity: 0; } 22%, 38% { opacity: 1; } 42%, 100% { opacity: 0; } }
              @keyframes donutFloatCycle3 { 0%, 38% { opacity: 0; } 42%, 58% { opacity: 1; } 62%, 100% { opacity: 0; } }
              @keyframes donutFloatCycle4 { 0%, 58% { opacity: 0; } 62%, 78% { opacity: 1; } 82%, 100% { opacity: 0; } }
              @keyframes donutFloatCycle5 { 0%, 78% { opacity: 0; } 82%, 98% { opacity: 1; } 100% { opacity: 0; } }
            `}</style>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {FLOAT_IMGS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  onError={imgError('food')}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 43, objectFit: 'cover', animation: `donutFloatCycle${i + 1} 10s ease-in-out infinite` }}
                />
              ))}
            </div>
          </button>
        )
      })()}

      {/* ═══ DONUT TYPES gallery (customer-facing) ═══ */}
      {donutTypesGallery && shopTheme === 'donut' && (() => {
        // Mock donuts — shown when the vendor hasn't uploaded any content yet,
        // so the gallery always has something to demonstrate. Real vendor
        // content replaces these as soon as anything is published.
        const MOCK_DONUTS = [
          ['Sprinkle Donut', { image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_26_20%20AM.png?updatedAt=1778707604129', description: 'A celebration in every bite. Rainbow sprinkles on a soft vanilla-iced ring — the one the kids fight over and the adults pretend they didn\'t want.', rating: 5 }],
          ['Boston Cream', { image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2008_45_54%20PM.png', description: 'Filled with fresh vanilla custard, topped with rich chocolate ganache. Our most-ordered donut — and once you bite into it, you\'ll see why.', rating: 4 }],
          ['Chocolate Frosted', { image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2009_19_03%20PM.png', description: 'Deep, glossy chocolate ganache on a soft yeast ring. Simple, decadent, and the one regulars order without thinking.', rating: 5 }],
          ['Strawberry Frosted', { image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdaaaavdddddd-removebg-preview%20(1).png', description: 'Real-strawberry icing in soft pink, dusted with pearl sprinkles. As pretty as it tastes — Instagram-bait with substance.', rating: 5 }],
        ]
        const publishedReal = Object.entries(donutTypesContent).filter(([, c]) => c && c.image && c.description)
        // Always show mocks alongside any real uploads. Vendor uploads win
        // when names collide; otherwise mocks fill out the carousel so there's
        // always 3+ slides to swipe through — not just the one the vendor
        // uploaded.
        const realNames = new Set(publishedReal.map(([n]) => n))
        const mocksToAdd = MOCK_DONUTS.filter(([n]) => !realNames.has(n))
        const published = [...publishedReal, ...mocksToAdd]
        const isMock = publishedReal.length === 0
        const safeIdx = Math.min(donutTypesIdx, published.length - 1)
        const [name, data] = published[safeIdx]
        const rating = Math.max(0, Math.min(5, data.rating || 0))
        const goPrev = () => {
          const next = Math.max(0, safeIdx - 1)
          setDonutTypesIdx(next)
          const el = document.getElementById('donut-swipe-track')
          if (el) el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
        }
        const goNext = () => {
          const next = Math.min(published.length - 1, safeIdx + 1)
          setDonutTypesIdx(next)
          const el = document.getElementById('donut-swipe-track')
          if (el) el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
        }
        const goTo = (i) => {
          setDonutTypesIdx(i)
          const el = document.getElementById('donut-swipe-track')
          if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
        }
        const onScrollSnap = (e) => {
          const el = e.currentTarget
          const idx = Math.round(el.scrollLeft / el.clientWidth)
          if (idx !== safeIdx && idx >= 0 && idx < published.length) setDonutTypesIdx(idx)
        }
        const orderThis = () => {
          // Open the matching menu item modal so the user can Add to Cart in one
          // tap. Match by case-insensitive name. If no menu item exists yet for
          // this donut type, fall back to filtering the menu so they can browse.
          const lower = name.toLowerCase().trim()
          const match = menuItems.find(it => {
            const n = (it.name || '').toLowerCase().trim()
            return n === lower || n.includes(lower) || lower.includes(n)
          })
          if (match) {
            setDonutTypesGallery(false)
            setItemModal(match)
            setModalQty(1)
            setModalPhotoIdx(0)
            setModalVariant(null)
            setModalModifiers([])
          } else {
            setMenuFilter(name)
            setDonutTypesGallery(false)
          }
        }
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Main-site theme bg (donut hero pink) + dark scrim so foreground
                content stays legible. Matches the app's main background. */}
            <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_52_32-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 0 }} />
            {/* Soft pink atmospheric glow behind the donut */}
            <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '90vw', height: '40vh', background: `radial-gradient(closest-side, ${accent}55, transparent 70%)`, pointerEvents: 'none', filter: 'blur(20px)', zIndex: 0 }} />
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10, position: 'relative', zIndex: 2 }}>
              <button onClick={() => setDonutTypesGallery(false)} style={{ width: 44, height: 44, borderRadius: 22, background: '#000', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>←</button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Meet Our Donuts</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{safeIdx + 1} of {published.length}</div>
              </div>
              <div style={{ width: 44 }} />
            </div>
            {/* HERO — horizontal swipe track. Native scroll-snap so the user
                can swipe-flick on touch. Drop-shadow on each PNG for depth. */}
            <div
              id="donut-swipe-track"
              onScroll={onScrollSnap}
              style={{
                flex: '0 0 auto',
                height: '46vh',
                display: 'flex',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <style>{`#donut-swipe-track::-webkit-scrollbar { display: none; }`}</style>
              {published.map(([n, d]) => (
                <div key={n} style={{
                  // Bulletproof scroll-snap slide sizing — minWidth + flexShrink:0
                  // forces each slide to be at least the container's width and
                  // never collapse. `flex: 0 0 100%` was ambiguous in a
                  // horizontally-scrolling flex container — basis 100% folded
                  // back on itself and slides ended up zero-width.
                  flexShrink: 0,
                  minWidth: '100%',
                  height: '100%',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 8%',
                  boxSizing: 'border-box',
                }}>
                  <img src={d.image} alt={n} onError={imgError('food')} style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block', transform: n === 'Chocolate Frosted' ? 'scale(0.7)' : n === 'Boston Cream' ? 'scale(1.3)' : n === 'Strawberry Frosted' ? 'scale(0.68)' : 'scale(0.9)' }} />
                </div>
              ))}
            </div>
            {/* Floating left/right arrows over the hero band */}
            {published.length > 1 && (
              <>
                <button onClick={goPrev} disabled={safeIdx === 0} aria-label="Previous" style={{ position: 'absolute', top: 'calc(14vh + 70px)', left: 12, zIndex: 3, width: 48, height: 48, borderRadius: 24, background: '#EC4899', border: 'none', color: '#fff', fontSize: 26, fontWeight: 700, cursor: safeIdx === 0 ? 'default' : 'pointer', opacity: safeIdx === 0 ? 0.35 : 1, lineHeight: 1, boxShadow: '0 6px 20px rgba(236,72,153,0.45)' }}>‹</button>
                <button onClick={goNext} disabled={safeIdx === published.length - 1} aria-label="Next" style={{ position: 'absolute', top: 'calc(14vh + 70px)', right: 12, zIndex: 3, width: 48, height: 48, borderRadius: 24, background: '#EC4899', border: 'none', color: '#fff', fontSize: 26, fontWeight: 700, cursor: safeIdx === published.length - 1 ? 'default' : 'pointer', opacity: safeIdx === published.length - 1 ? 0.35 : 1, lineHeight: 1, boxShadow: '0 6px 20px rgba(236,72,153,0.45)' }}>›</button>
              </>
            )}
            {/* Dot indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 0 4px', flexShrink: 0, position: 'relative', zIndex: 2 }}>
              {published.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Go to ${i + 1}`} style={{ width: i === safeIdx ? 28 : 8, height: 8, borderRadius: 4, border: 'none', background: i === safeIdx ? accent : 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0, transition: 'width 250ms ease, background 250ms ease' }} />
              ))}
            </div>
            {/* Body container — name, rating, full description, order */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px', position: 'relative', zIndex: 2 }}>
              <div style={{ borderRadius: 20, padding: '20px 18px 18px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${accent}33`, boxShadow: `0 16px 40px rgba(0,0,0,0.55)` }}>
                {/* Name + Star rating row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, fontSize: 24, fontWeight: 900, color: '#fff', minWidth: 0, lineHeight: 1.2 }}>{name}</div>
                  {rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} style={{ fontSize: 18, color: i <= rating ? '#FACC15' : 'rgba(255,255,255,0.25)' }}>★</span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Description — full 1000 chars, scrolls inside if long */}
                <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: 16, maxHeight: '24vh', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{data.description}</div>
                <button onClick={orderThis} style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: `0 8px 24px ${accent}55`, minHeight: 48 }}>
                  Order {name} →
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* --- Menu Banner Image carousel --- */}
      {menuBanners.length > 0 && (
        <div style={{ margin: '4px 12px 0' }}>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '3 / 1', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
            {menuBanners.map((url, i) => (
              <img key={url + i} src={url} alt="" onError={imgError('banner')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === menuBannerIdx ? 1 : 0, transition: 'opacity 0.6s ease' }} />
            ))}
          </div>
          {menuBanners.length > 1 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'center' }}>
              {menuBanners.map((_, i) => (
                <button key={i} onClick={() => setMenuBannerIdx(i)} style={{ flex: '1 1 0', maxWidth: 40, height: 4, borderRadius: 2, border: 'none', background: i === menuBannerIdx ? accent : 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0, transition: 'background 0.3s ease' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Closed banner --- */}
      {!shopOpen && !isVendor && (
        <div style={S.closedBanner}>{t.shopClosed || 'This shop is currently closed'}</div>
      )}

      {/* Add Item button (vendor) — extra top padding when a banner is showing for easier touch reach */}
      {isVendor && vendorStatus !== 'expired' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: menuBanners.length > 0 ? '12px 16px 8px' : '0 16px' }}>
          <button onClick={startAdd} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#8DC63F', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, minWidth: 110 }}>+ Add Item</button>
        </div>
      )}
      {/* --- Daily Deals Button + Cards --- */}
      {hasDeals && (
        <div style={{ padding: '0 16px 8px' }}>
          <button onClick={() => setShowDeals(!showDeals)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
            🔥 Promo ({activeDeals.length})
            <span style={{ fontSize: 13 }}>{showDeals ? '▲' : '▼'}</span>
          </button>
          {showDeals && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeDeals.map(deal => {
                const now = new Date()
                const today = now.toISOString().slice(0, 10)
                const end = new Date(`${today}T${deal.endTime || '23:59'}`)
                const remaining = Math.max(0, end - now)
                const hrs = Math.floor(remaining / 3600000)
                const mins = Math.floor((remaining % 3600000) / 60000)
                return (
                  <div key={deal.id} style={{ background: 'rgba(255,214,0,0.08)', border: '1px solid rgba(255,214,0,0.2)', borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                    {deal.photo && <img src={deal.photo} alt="" onError={imgError('food')} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FFD600' }}>{fmt(deal.dealPrice)}</span>
                        <span style={{ fontSize: 13, color: '#888', textDecoration: 'line-through' }}>{fmt(deal.originalPrice)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700, marginTop: 4 }}>
                        ⏰ {hrs}h {mins}m remaining
                      </div>
                    </div>
                    <button onClick={() => {
                      const existing = cart.find(c => c.id === 'deal-' + deal.id)
                      if (existing) { setCart(cart.map(c => c.id === 'deal-' + deal.id ? { ...c, qty: c.qty + 1 } : c)) }
                      else { setCart([...cart, { id: 'deal-' + deal.id, name: deal.name + ' (Deal)', price: deal.dealPrice, qty: 1, photo: deal.photo }]) }
                    }} style={{ background: '#FFD600', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 800, color: '#1a1a1a', cursor: 'pointer', flexShrink: 0 }}>
                      + Add
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Menu --- */}
      <div style={{ paddingBottom: 12 }}>
        {/* Category text toggles + Visit Us */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 0' }}>
          <div style={{ display: 'flex', gap: 24, flex: 1, overflowX: 'auto', scrollbarWidth: 'none', alignItems: 'center' }}>
          {(() => {
            const allCats = MENU_CATEGORIES.slice(1)
            // Donut-theme toggle compaction: drop the trailing " Donut" suffix
            // so tabs like "Chocolate Frosted Donut" render as "Chocolate Frosted"
            // — keeps the toggle bar from blowing out its width. Filter values
            // and the side-drawer list still use the full category name; only
            // the tab LABEL is shortened.
            const stripDonut = (c) => c.replace(/ Donut$/, '')
            const friendly = (c) => {
              if (c === 'Drink') return 'Drinks'
              if (c === 'Snack') return 'Snacks'
              if (c === 'Extra Sauce') return 'Extra'
              if (shopTheme === 'donut') return stripDonut(c)
              return c
            }
            // Donut theme: always show "Donuts" + "Drinks" as group tabs so a
            // vendor with items in both groups never loses sight of either tab.
            // Other themes use the legacy top-3 + active-selection scheme.
            let tabs
            if (DONUT_GROUP_FILTERS) {
              tabs = [
                { label: 'All', filter: 'All' },
                { label: 'Donuts', filter: '__donuts__' },
                { label: 'Drinks', filter: '__drinks__' },
              ]
              // If the vendor has drilled into a specific subtype via the drawer,
              // surface it as a 4th tab so they can see what's active.
              if (menuFilter !== 'All' && menuFilter !== '__donuts__' && menuFilter !== '__drinks__') {
                tabs.push({ label: friendly(menuFilter), filter: menuFilter })
              }
            } else {
              const topThree = allCats.slice(0, 3)
              const inlineCats = (menuFilter === 'All' || topThree.includes(menuFilter)) ? topThree : [...topThree, menuFilter]
              tabs = [{ label: 'All', filter: 'All' }, ...inlineCats.map(c => ({ label: friendly(c), filter: c }))]
            }
            return tabs.map(tab => {
              const isActive = menuFilter === tab.filter
              return (
                <button key={tab.filter} onClick={() => setMenuFilter(tab.filter)} style={{
                  background: 'none', border: 'none', padding: '12px 0 10px', cursor: 'pointer', flexShrink: 0, minHeight: 44,
                  fontSize: 15, fontWeight: 700,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  borderBottom: isActive ? `2px solid ${isCustomAccent ? accent : '#fff'}` : '2px solid transparent',
                }}>
                  {tab.label}
                </button>
              )
            })
          })()}
          </div>
          {MENU_CATEGORIES.length > 4 && (
            <button onClick={() => setMenuDrawerOpen(true)} aria-label="All categories" title="All categories" style={{
              background: isCustomAccent ? accent : 'rgba(255,255,255,0.18)',
              border: 'none', padding: 8, marginLeft: 12, cursor: 'pointer', flexShrink: 0,
              minHeight: 44, minWidth: 44, borderRadius: 10,
              color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <span style={{ width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
              <span style={{ width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
              <span style={{ width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
            </button>
          )}
        </div>

        {/* Vendor-type picker — one-time question on signup, also reachable via item form */}
        {vendorTypePickerOpen && (
          <>
            <div onClick={() => vendorType && setVendorTypePickerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1000 }} />
            <div role="dialog" aria-label="Pick vendor type" style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 360, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto',
              background: 'linear-gradient(180deg, #1a1a1f 0%, #0c0c10 100%)',
              borderRadius: 22, padding: '26px 22px 22px', zIndex: 1001,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ width: 36, height: 3, borderRadius: 2, background: isCustomAccent ? accent : 'rgba(255,255,255,0.4)', marginBottom: 16, marginLeft: 'auto', marginRight: 'auto' }} />
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>What kind of vendor are you?</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>We'll set up your menu categories instantly.</div>
              </div>
              {Object.values(VENDOR_TYPES).map(vt => {
                const isActive = vendorType === vt.id
                return (
                  <button key={vt.id} onClick={() => { setVendorType(vt.id); setVendorTypePickerOpen(false) }} style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '14px 14px', marginBottom: 10, borderRadius: 14,
                    background: isActive
                      ? (isCustomAccent ? `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` : 'rgba(255,255,255,0.16)')
                      : 'rgba(255,255,255,0.04)',
                    border: '1px solid ' + (isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'),
                    boxShadow: isActive && isCustomAccent ? `0 6px 18px ${accent}55` : 'none',
                    cursor: 'pointer', textAlign: 'left', color: '#fff',
                    transition: 'all 150ms ease',
                  }}>
                    <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{vt.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{vt.label}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 4, fontWeight: 500 }}>{vt.tagline}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500, lineHeight: 1.4 }}>{vt.categories.slice(0, 5).join(' · ')}{vt.categories.length > 5 ? ' · …' : ''}</div>
                    </div>
                  </button>
                )
              })}
              {vendorType && (
                <button onClick={() => setVendorTypePickerOpen(false)} style={{
                  width: '100%', padding: '10px 14px', marginTop: 4, borderRadius: 12,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Cancel</button>
              )}
            </div>
          </>
        )}

        {/* ─── Global Category Picker — Browse all 85+ categories grouped, or add custom ─── */}
        {categoryPickerOpen && (() => {
          // When the vendor's shopTheme has a theme-specific category override
          // (e.g. donut theme → "Donuts" group with glazed/iced/cream-filled
          // subtypes), prepend it so the donut shop sees its own taxonomy first
          // — followed by the full global list (Beverages, Snacks, etc.) so
          // they can still add drinks and cross-sell items.
          const themeGroups = THEME_CATEGORY_OVERRIDES[shopTheme] || []
          const groupsForPicker = [...themeGroups, ...MENU_CATEGORY_GROUPS]
          const activeGroup = categoryPickerGroup ? groupsForPicker.find(g => g.id === categoryPickerGroup) : null
          const close = () => { setCategoryPickerOpen(false); setCategoryPickerGroup(null); setCustomCategoryName('') }
          return (
            <>
              <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1000 }} />
              <div role="dialog" aria-label="Pick a menu category" style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 380, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto',
                background: '#000', borderRadius: 22, padding: '24px 20px 20px', zIndex: 1001,
                boxShadow: '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    {activeGroup && (
                      <button type="button" onClick={() => { setCategoryPickerGroup(null); setCustomCategoryName('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 4 }}>← Back to groups</button>
                    )}
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {activeGroup && activeGroup.svg && <svg width="20" height="20" viewBox="0 0 24 24" fill="#EF4444"><path d={activeGroup.svg} /></svg>}
                      {activeGroup ? activeGroup.label : 'Pick a category'}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{activeGroup ? activeGroup.desc : 'Tap a group, then pick a type — or add your own.'}</div>
                  </div>
                  <button type="button" onClick={close} style={{ width: 32, height: 32, borderRadius: 16, background: '#EF4444', border: 'none', color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>✕</button>
                </div>

                {/* Group cards view */}
                {!activeGroup && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {groupsForPicker.map(g => (
                      <button key={g.id} type="button" onClick={() => setCategoryPickerGroup(g.id)} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        padding: 12, borderRadius: 14,
                        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        border: '1.5px solid #EF4444',
                        cursor: 'pointer', textAlign: 'left', color: '#fff', minHeight: 88,
                        transition: 'transform 100ms ease, background 150ms ease',
                      }}>
                        <span style={{ width: 28, height: 28, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {g.svg ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#EF4444"><path d={g.svg} /></svg> : null}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{g.label}</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: 2, lineHeight: 1.3 }}>{g.isCustom ? 'Type your own name' : `${g.types.length} types`}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tier-2 type chips (regular group) */}
                {activeGroup && !activeGroup.isCustom && (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {activeGroup.types.map(t => {
                        const isPicked = formCategory === t
                        return (
                          <button key={t} type="button" onClick={() => { setFormCategory(t); close() }} style={{
                            background: isPicked ? '#EF4444' : 'rgba(255,255,255,0.06)',
                            border: '1px solid ' + (isPicked ? '#EF4444' : 'rgba(255,255,255,0.1)'),
                            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            padding: '7px 12px', borderRadius: 16, minHeight: 32,
                          }}>{t}</button>
                        )
                      })}
                    </div>
                    {/* Custom-name input inside the group too — for niche dish types */}
                    <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600 }}>Or type a new one in this group</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          value={customCategoryName}
                          onChange={e => setCustomCategoryName(e.target.value)}
                          placeholder="e.g. Pho · Goreng · Tapas…"
                          maxLength={32}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, padding: '8px 12px', borderRadius: 10, outline: 'none' }}
                        />
                        <button type="button" disabled={!customCategoryName.trim()} onClick={() => { setFormCategory(customCategoryName.trim()); close() }} style={{
                          padding: '0 14px', borderRadius: 10, border: 'none',
                          background: customCategoryName.trim() ? '#EF4444' : 'rgba(255,255,255,0.06)',
                          color: '#fff', fontSize: 13, fontWeight: 700,
                          cursor: customCategoryName.trim() ? 'pointer' : 'not-allowed',
                          opacity: customCategoryName.trim() ? 1 : 0.5,
                        }}>Use</button>
                      </div>
                    </div>
                  </>
                )}

                {/* Other — custom category with icon picker */}
                {activeGroup && activeGroup.isCustom && (
                  <div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 600 }}>Category name</div>
                    <input
                      value={customCategoryName}
                      onChange={e => setCustomCategoryName(e.target.value)}
                      placeholder="e.g. Acai Bowls · Sundanese · Persian Stews"
                      maxLength={32}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, padding: '10px 12px', borderRadius: 10, outline: 'none', marginBottom: 14 }}
                    />
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 600 }}>Pick an icon</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14, maxHeight: 180, overflowY: 'auto', padding: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                      {CUSTOM_CATEGORY_ICONS.map(ic => (
                        <button key={ic} type="button" onClick={() => setCustomCategoryIcon(ic)} style={{
                          width: 36, height: 36, fontSize: 20, lineHeight: 1,
                          background: customCategoryIcon === ic ? '#EF4444' : 'rgba(255,255,255,0.04)',
                          border: '1px solid ' + (customCategoryIcon === ic ? '#EF4444' : 'rgba(255,255,255,0.08)'),
                          borderRadius: 8, cursor: 'pointer', padding: 0,
                        }}>{ic}</button>
                      ))}
                    </div>
                    <button type="button" disabled={!customCategoryName.trim()} onClick={() => { setFormCategory(customCategoryName.trim()); close() }} style={{
                      width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                      background: customCategoryName.trim() ? '#EF4444' : 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: 14, fontWeight: 800,
                      cursor: customCategoryName.trim() ? 'pointer' : 'not-allowed',
                      opacity: customCategoryName.trim() ? 1 : 0.5,
                    }}>Use "{customCategoryIcon} {customCategoryName.trim() || 'My Category'}"</button>
                  </div>
                )}
              </div>
            </>
          )
        })()}

        {/* Visit Us moved to the vendor side drawer — see end of drawer items. */}

        {/* Full-category drawer — slides in from right when burger pressed */}
        {menuDrawerOpen && (
          <>
            <div onClick={() => setMenuDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', zIndex: 998, animation: 'menuOverlayIn 200ms ease-out' }} />
            <div role="dialog" aria-label="Browse menu" style={{
              position: 'fixed', top: 0, right: 0, width: 300, maxWidth: '88vw', height: '100vh',
              background: '#000',
              zIndex: 999, padding: '22px 18px 24px', overflowY: 'auto',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.55), inset 1px 0 0 rgba(255,255,255,0.06)',
              borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
              animation: 'menuDrawerIn 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <style>{`
                @keyframes menuDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes menuOverlayIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes redRun {
                  0% { transform: translateY(-100%); }
                  100% { transform: translateY(100%); }
                }
              `}</style>
              {/* Animated running line on the left edge — uses theme accent */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', overflow: 'hidden', borderTopLeftRadius: 18, borderBottomLeftRadius: 18, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '60%', background: `linear-gradient(180deg, transparent 0%, ${accent} 40%, ${accent} 60%, transparent 100%)`, filter: `drop-shadow(0 0 6px ${accent}CC)`, animation: 'redRun 2.4s linear infinite' }} />
              </div>
              {/* Accent line on top — premium "title indicator" */}
              <div style={{ width: 36, height: 3, borderRadius: 2, background: isCustomAccent ? accent : 'rgba(255,255,255,0.4)', marginBottom: 14 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {/* Donut theme: small donut photo to the left of the header text. */}
                  {shopTheme === 'donut' && (
                    <img
                      src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_30_51%20AM.png?updatedAt=1778707873204"
                      alt=""
                      onError={imgError('theme')}
                      style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>Menu</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginTop: 2 }}>{MENU_CATEGORIES.length - 1} categories · {menuItems.length} items</div>
                  </div>
                </div>
                <button onClick={() => setMenuDrawerOpen(false)} aria-label="Close" style={{ background: accent, border: 'none', color: '#fff', fontSize: 22, fontWeight: 800, cursor: 'pointer', padding: 0, lineHeight: 1, width: 36, height: 36, borderRadius: 12, boxShadow: `0 2px 6px ${accent}66`, alignSelf: 'flex-start', marginTop: -4 }}>&times;</button>
              </div>
              {(() => {
                // Short description shown under each category label
                const DESCS = {
                  'All':         'Browse everything we serve',
                  'Meal':        'Main dishes & full plates',
                  'Drink':       'Beverages & refreshments',
                  'Drinks':      'Beverages & refreshments',
                  'Snack':       'Light bites & sides',
                  'Snacks':      'Light bites & sides',
                  'Dessert':     'Sweet treats to finish',
                  'Extra Sauce': 'Sauces, sambal & dips',
                  'Extra':       'Sauces, sambal & dips',
                }
                // SVG path data for each category — Material Symbols, high quality at any size
                const ICONS = {
                  'All':         'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
                  'Meal':        'M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 0 0 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.20-1.10-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z',
                  'Drink':       'M5 12l1.5 6h11L19 12V4H5v8zm2-6h10v2H7V6z',
                  'Drinks':      'M5 12l1.5 6h11L19 12V4H5v8zm2-6h10v2H7V6z',
                  'Snack':       'M21.598 11.064a1.006 1.006 0 0 0-.854-.172A2.94 2.94 0 0 1 20 11c-1.654 0-3-1.346-3.001-2.999.001-.471.108-.94.315-1.391a.999.999 0 0 0-1.029-1.41c-.108.013-.221.023-.336.023-1.654 0-3-1.346-3-3 0-.116.011-.229.022-.336a1 1 0 0 0-1.412-1.029 9.012 9.012 0 0 0-3.598 12.974 9.012 9.012 0 0 0 13.65-3.769 1.005 1.005 0 0 0-.013-.999z',
                  'Snacks':      'M21.598 11.064a1.006 1.006 0 0 0-.854-.172A2.94 2.94 0 0 1 20 11c-1.654 0-3-1.346-3.001-2.999.001-.471.108-.94.315-1.391a.999.999 0 0 0-1.029-1.41c-.108.013-.221.023-.336.023-1.654 0-3-1.346-3-3 0-.116.011-.229.022-.336a1 1 0 0 0-1.412-1.029 9.012 9.012 0 0 0-3.598 12.974 9.012 9.012 0 0 0 13.65-3.769 1.005 1.005 0 0 0-.013-.999z',
                  'Dessert':     'M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12c0-1.66-1.34-3-3-3z',
                  'Extra Sauce': 'M5.5 21c.83 0 1.5-.67 1.5-1.5V14H4v5.5c0 .83.67 1.5 1.5 1.5zM18 6h-2V3c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v3H6c-.55 0-1 .45-1 1v6h14V7c0-.55-.45-1-1-1zm-7-2h2v2h-2V4zm7.5 17c.83 0 1.5-.67 1.5-1.5V14h-3v5.5c0 .83.67 1.5 1.5 1.5z',
                  'Extra':       'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
                }
                return [{ filter: 'All', label: 'Full Menu' }, ...MENU_CATEGORIES.slice(1).map(c => ({ filter: c, label: c === 'Drink' ? 'Drinks' : c === 'Snack' ? 'Snacks' : c === 'Extra Sauce' ? 'Extra' : c }))].map(opt => {
                  const count = opt.filter === 'All' ? menuItems.length : menuItems.filter(m => m.category === opt.filter).length
                  const isActive = menuFilter === opt.filter
                  const iconPath = ICONS[opt.filter] || ICONS[opt.label] || ICONS['Extra']
                  return (
                    <button key={opt.filter} onClick={() => { setMenuFilter(opt.filter); setMenuDrawerOpen(false) }} style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '13px 14px', marginBottom: 8, borderRadius: 12,
                      background: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      border: `1.5px solid ${accent}`,
                      boxShadow: isActive ? `0 0 14px ${accent}66` : 'none',
                      cursor: 'pointer', minHeight: 48,
                      color: '#fff', fontSize: 15, fontWeight: 700, textAlign: 'left',
                      transition: 'background 150ms ease, box-shadow 150ms ease',
                    }}>
                      <span style={{ width: 36, height: 36, borderRadius: 10, background: isActive ? accent : `${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 150ms ease' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? '#fff' : accent} aria-hidden="true"><path d={iconPath} /></svg>
                      </span>
                      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{opt.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{DESCS[opt.filter] || DESCS[opt.label] || ''}</span>
                      </span>
                      <span style={{
                        padding: '4px 10px', borderRadius: 11,
                        background: '#FACC15',
                        color: '#1a1a1a',
                        fontSize: 13, fontWeight: 800, minWidth: 24, textAlign: 'center',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
                      }}>{count}</span>
                    </button>
                  )
                })
              })()}
            </div>
          </>
        )}

        <div style={{ height: 12 }} />
        <div style={menuCardStyle === 'grid' ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px' } : {}}>
        {visibleMenu.map((item) => (
          menuCardStyle === 'grid' ? (
            /* GRID card style — 2 columns, image on top */
            <div key={item.id} style={{
              background: donutCardStyles ? donutCardStyles.background : 'rgba(0,0,0,0.85)',
              backdropFilter: donutCardStyles?.backdropFilter || 'none',
              WebkitBackdropFilter: donutCardStyles?.WebkitBackdropFilter || 'none',
              border: donutCardStyles ? 'none' : (isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.06)'),
              // Match Design Studio preview card dimensions for donut theme:
              // tighter radius, same compact body sizing.
              borderRadius: donutCardStyles ? 10 : 14, overflow: 'hidden', position: 'relative',
              ...(!item.available && isVendor ? { background: 'rgba(139,0,0,0.4)' } : {})
            }}>
              {/* Donut frame-side stripe — explicit element with rounded top/
                  bottom-left corners so the frame colour visibly rounds at
                  both ends, not just clipped flat by the card's overflow. */}
              {donutCardStyles && (
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: donutFrameAccent, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, zIndex: 4, pointerEvents: 'none' }} />
              )}
              {/* Perk ribbon — overlay on top edge of image */}
              {(() => {
                const p = getPerkDisplay(item)
                if (!p) return null
                const cd = getPerkCountdown(item)
                if (cd === 'expired' || cd === 'soldout') return null
                return (
                  <div style={{ position: 'absolute', top: 0, left: donutCardStyles ? 4 : 0, right: 0, background: donutCardStyles ? donutPromoBarColor : accent, color: '#fff', fontSize: donutCardStyles ? 11 : 9, fontWeight: 800, letterSpacing: donutCardStyles ? 0.4 : 0.3, padding: donutCardStyles ? '6px 8px' : '3px 6px', display: 'flex', alignItems: 'center', gap: donutCardStyles ? 5 : 4, zIndex: 3 }}>
                    <span style={{ fontSize: 13 }}>{p.emoji}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.text}</span>
                    {cd && <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{cd}</span>}
                  </div>
                )
              })()}
              {isVendor && vendorStatus !== 'expired' && (
                <button style={{ ...S.toggle(item.available), position: 'absolute', top: (() => { const cd = getPerkCountdown(item); return getPerkDisplay(item) && cd !== 'expired' && cd !== 'soldout' ? 28 : 6 })(), right: 6, zIndex: 4 }} onClick={() => toggleAvailability(item.id)}><div style={S.toggleDot(item.available)} /></button>
              )}
              <img src={item.photo || PLACEHOLDER_SM} alt={item.name} onError={imgError('food')} style={
                donutCardStyles
                  ? {
                      // Match Design Studio preview: 4:3 landscape, contain
                      // with gray bg, 4px left margin for inset frame stripe.
                      width: 'calc(100% - 4px)',
                      marginLeft: 4,
                      aspectRatio: '4 / 3',
                      objectFit: 'contain',
                      background: '#f5f5f5',
                      display: 'block',
                    }
                  : { width: '100%', height: 110, objectFit: 'cover', display: 'block' }
              } onClick={() => { setItemModal(item); setModalQty(1) }} />
              {item.popular && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 13, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 4px', fontWeight: 800, zIndex: 2 }}>Popular</span>}
              {isVendor && vendorStatus !== 'expired' && <button onClick={() => deleteItem(item.id)} style={{ position: 'absolute', top: 80, left: 6, width: 22, height: 22, borderRadius: 11, border: 'none', background: '#8B0000', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>}
              <div style={{ padding: donutCardStyles ? '6px 8px 8px' : '8px 10px 10px' }}>
                <div style={{ fontSize: donutCardStyles ? 13 : 13, fontWeight: donutCardStyles ? 800 : 700, color: donutCardStyles ? donutCardStyles.textColor : '#fff', marginBottom: donutCardStyles ? 4 : 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => { setItemModal(item); setModalQty(1) }}>{item.name}</div>
                {/* Description — donut only on grid. 12px / WCAG-min, higher
                    contrast, wraps to 2 lines so it's actually readable. */}
                {donutCardStyles && item.desc && (
                  <div style={{ fontSize: 13, lineHeight: 1.3, color: donutCardStyles.textColor === '#fff' ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.7)', marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.desc}</div>
                )}
                {/* Donut grid: price on its own row, add-to-cart full-width under it.
                    Gives the price room to display without competing with the button. */}
                {donutCardStyles ? (
                  <>
                    <div style={{ marginBottom: 4, whiteSpace: 'nowrap' }}>
                      {item.promoPrice ? (
                        <><span style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', textDecoration: 'line-through', marginRight: 4 }}>{fmt(item.price)}</span><span style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>{fmt(item.promoPrice)}</span></>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 800, color: donutFrameAccent }}>{fmt(item.price)}</span>
                      )}
                    </div>
                    {!isVendor && shopOpen && item.available && (
                      donutAddBtnShape === 'pill' ? (
                        <button onClick={() => { setItemModal(item); setModalQty(1) }} style={{ width: '100%', height: 26, padding: '0 10px', borderRadius: 13, background: donutAddBtnBg, color: donutAddBtnTextColor, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>{donutAddBtnText}</button>
                      ) : (
                        <button onClick={() => { setItemModal(item); setModalQty(1) }} style={{ width: '100%', height: 26, borderRadius: 13, background: donutAddBtnBg, color: donutAddBtnTextColor, border: 'none', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                      )
                    )}
                    {isVendor && vendorStatus !== 'expired' && <button style={{ ...S.smallBtn('#8B0000'), marginTop: 6 }} onClick={() => startEdit(item)}>Edit</button>}
                  </>
                ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>{item.promoPrice ? <span style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>{fmt(item.promoPrice)}</span> : <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>{fmt(item.price)}</span>}</div>
                  {!isVendor && shopOpen && item.available && (
                    <button style={{ ...S.addBtn, position: 'static', width: 28, height: 28, borderRadius: 14, fontSize: 16 }} onClick={() => { setItemModal(item); setModalQty(1) }}>+</button>
                  )}
                  {isVendor && vendorStatus !== 'expired' && <button style={S.smallBtn('#8B0000')} onClick={() => startEdit(item)}>Edit</button>}
                </div>
                )}
              </div>
            </div>
          ) : menuCardStyle === 'fullwidth' ? (
            /* FULLWIDTH card style — large image cards */
            <div key={item.id} style={{
              background: donutCardStyles ? donutCardStyles.background : 'rgba(0,0,0,0.85)',
              backdropFilter: donutCardStyles?.backdropFilter || 'none',
              WebkitBackdropFilter: donutCardStyles?.WebkitBackdropFilter || 'none',
              border: donutCardStyles ? 'none' : (isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.06)'),
              boxShadow: donutCardStyles ? `inset 4px 0 0 ${donutFrameAccent}` : undefined,
              borderRadius: 16, margin: '8px 12px', overflow: 'hidden', position: 'relative',
              ...(!item.available && isVendor ? { background: 'rgba(139,0,0,0.4)' } : {})
            }}>
              {/* Perk ribbon — overlay on top edge of image */}
              {(() => {
                const p = getPerkDisplay(item)
                if (!p) return null
                const cd = getPerkCountdown(item)
                if (cd === 'expired' || cd === 'soldout') return null
                return (
                  <div style={{ position: 'absolute', top: 0, left: donutCardStyles ? 4 : 0, right: 0, background: donutCardStyles ? donutPromoBarColor : accent, color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 0.5, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 3 }}>
                    <span style={{ fontSize: 14 }}>{p.emoji}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.text}</span>
                    {cd && <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{cd}</span>}
                  </div>
                )
              })()}
              {isVendor && vendorStatus !== 'expired' && (
                <button style={{ ...S.toggle(item.available), position: 'absolute', top: (() => { const cd = getPerkCountdown(item); return getPerkDisplay(item) && cd !== 'expired' && cd !== 'soldout' ? 36 : 8 })(), right: 8, zIndex: 4 }} onClick={() => toggleAvailability(item.id)}><div style={S.toggleDot(item.available)} /></button>
              )}
              <img src={item.photo || PLACEHOLDER_SM} alt={item.name} onError={imgError('food')} style={
                donutCardStyles
                  ? {
                      // Donut: image inset under the promo banner, shorter
                      // height so the photo reads as a tidy block tucked
                      // between the banner and the body content.
                      width: 'calc(100% - 8px)',
                      marginLeft: 4,
                      marginTop: 32,
                      height: isDonutImageCard ? 80 : 90,
                      marginRight: 4,
                      borderRadius: 10,
                      objectFit: 'cover',
                      display: 'block',
                    }
                  : { width: '100%', height: 180, objectFit: 'cover', display: 'block' }
              } onClick={() => { setItemModal(item); setModalQty(1) }} />
              {item.popular && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 13, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 800, zIndex: 2 }}>Popular</span>}
              {item.halal && shopTheme !== 'donut' && <span style={{ position: 'absolute', top: 8, left: 70, fontSize: 13, background: 'rgba(34,197,94,0.8)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700, zIndex: 2 }}>Halal</span>}
              {isVendor && vendorStatus !== 'expired' && <button onClick={() => deleteItem(item.id)} style={{ position: 'absolute', bottom: 58, left: 8, width: 26, height: 26, borderRadius: 13, border: 'none', background: '#8B0000', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: donutCardStyles ? donutCardStyles.textColor : '#fff', marginBottom: 4 }} onClick={() => { setItemModal(item); setModalQty(1) }}>{item.name}{item.spice > 0 && shopTheme !== 'donut' &&<span style={{ marginLeft: 4 }}>{'🌶️'.repeat(item.spice)}</span>}</div>
                {item.desc && <div style={{ fontSize: 13, color: donutCardStyles ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{item.desc}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>{item.promoPrice ? <><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginRight: 6 }}>{fmt(item.price)}</span><span style={{ fontSize: 16, fontWeight: 800, color: '#EF4444' }}>{fmt(item.promoPrice)}</span></> : <span style={{ fontSize: 16, fontWeight: 800, color: donutCardStyles ? donutFrameAccent : '#FACC15' }}>{fmt(item.price)}</span>}</div>
                  {!isVendor && shopOpen && item.available && (donutCardStyles ? (
                    donutAddBtnShape === 'pill' ? (
                      <button onClick={() => { setItemModal(item); setModalQty(1) }} style={{ height: 36, padding: '0 16px', borderRadius: 18, background: donutAddBtnBg, color: donutAddBtnTextColor, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>{donutAddBtnText}</button>
                    ) : (
                      <button onClick={() => { setItemModal(item); setModalQty(1) }} style={{ width: 36, height: 36, borderRadius: 18, background: donutAddBtnBg, color: donutAddBtnTextColor, border: 'none', fontSize: 20, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                    )
                  ) : (
                    <button style={S.addBtn} onClick={() => { setItemModal(item); setModalQty(1) }}>+</button>
                  ))}
                  {isVendor && vendorStatus !== 'expired' && <button style={S.smallBtn('#8B0000')} onClick={() => startEdit(item)}>Edit</button>}
                </div>
              </div>
            </div>
          ) : (
            /* HORIZONTAL card style — default */
            <div
              key={item.id}
              style={{
                ...S.card,
                // Donut overrides for bg + frame side. Frame uses inset
                // box-shadow (not borderLeft) so children align with the
                // card's rounded outer edge. paddingBottom adds breathing
                // room for the absolutely-positioned Add-to-Cart button so
                // it doesn't overlap the item description.
                ...(donutCardStyles ? {
                  background: donutCardStyles.background,
                  backdropFilter: donutCardStyles.backdropFilter,
                  WebkitBackdropFilter: donutCardStyles.WebkitBackdropFilter,
                  boxShadow: `inset 3px 0 0 ${donutFrameAccent}`,
                  border: 'none',
                  // Small bottom breathing room under the inline Add-to-Cart button.
                  paddingBottom: 10,
                } : {}),
                ...(!item.available && isVendor ? { background: 'rgba(139,0,0,0.4)', border: '1px solid rgba(255,60,60,0.2)' } : {}),
                ...(isCustomAccent && !donutCardStyles ? { borderLeft: `3px solid ${accent}` } : {}),
                ...(getPerkDisplay(item) && getPerkCountdown(item) !== 'expired' && getPerkCountdown(item) !== 'soldout' ? { paddingTop: 30 } : {}),
              }}
            >
              {/* Perk ribbon — always visible when item has perks, hidden when expired/sold out */}
              {(() => {
                const p = getPerkDisplay(item)
                if (!p) return null
                const cd = getPerkCountdown(item)
                if (cd === 'expired' || cd === 'soldout') return null
                return (
                  <div style={{ position: 'absolute', top: 0, left: donutCardStyles ? 3 : 0, right: 0, background: donutCardStyles ? donutPromoBarColor : accent, color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 0.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, borderTopLeftRadius: donutCardStyles ? 0 : 16, borderTopRightRadius: 16, zIndex: 1 }}>
                    <span style={{ fontSize: 13 }}>{p.emoji}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.text}</span>
                    {cd && <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{cd}</span>}
                  </div>
                )
              })()}
              {isVendor && vendorStatus !== 'expired' && (
                <button style={{ ...S.toggle(item.available), position: 'absolute', top: (() => { const cd = getPerkCountdown(item); return getPerkDisplay(item) && cd !== 'expired' && cd !== 'soldout' ? 38 : 8 })(), right: 8, zIndex: 4 }} onClick={() => toggleAvailability(item.id)}>
                  <div style={S.toggleDot(item.available)} />
                </button>
              )}
              <img
                src={item.photo || PLACEHOLDER_SM}
                alt={item.name}
                onError={imgError('food')}
                style={isDonutImageCard ? { ...S.cardImg, margin: 8, borderRadius: 10, width: 'auto', maxWidth: 'calc(100% - 16px)' } : S.cardImg}
                onClick={() => { setItemModal(item); setModalQty(1) }}
              />
              {item.halal && shopTheme !== 'donut' && (
                <span style={{ position: 'absolute', bottom: 8, left: isVendor ? 40 : 8, fontSize: 13, background: 'rgba(34,197,94,0.8)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700, zIndex: 2 }}>Halal</span>
              )}
              {item.popular && (
                <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 13, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 800, zIndex: 2 }}>Popular</span>
              )}
              {isVendor && vendorStatus !== 'expired' && (
                <button onClick={() => deleteItem(item.id)} style={{ position: 'absolute', bottom: 8, left: 8, width: 26, height: 26, borderRadius: 13, border: 'none', background: '#8B0000', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>
              )}
              <div style={S.cardBody}>
                <div style={{ ...S.cardName, color: donutCardStyles ? donutCardStyles.textColor : (S.cardName && S.cardName.color) }} onClick={() => { setItemModal(item); setModalQty(1) }}>{item.name}{item.spice > 0 && shopTheme !== 'donut' &&<span style={{ marginLeft: 4 }}>{'🌶️'.repeat(item.spice)}</span>}</div>
                <div style={{ ...S.cardDesc, color: donutCardStyles ? 'rgba(0,0,0,0.55)' : (S.cardDesc && S.cardDesc.color) }}>{item.desc}{item.prepTime > 0 && <span style={{ marginLeft: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>⏱ {item.prepTime}min</span>}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    {item.promoPrice ? (
                      <><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginRight: 6 }}>{fmt(item.price)}</span><span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>{fmt(item.promoPrice)}</span></>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: donutCardStyles ? donutFrameAccent : '#FACC15' }}>{fmt(item.price)}</span>
                    )}
                  </div>
                  {/* Donut: Add-to-Cart inline on the same row as the price,
                      sitting below the description. Standard themes still use
                      the absolute-positioned S.addBtn outside cardBody. */}
                  {donutCardStyles && !isVendor && shopOpen && item.available && (
                    donutAddBtnShape === 'pill' ? (
                      <button onClick={() => { setItemModal(item); setModalQty(1) }} style={{ height: 26, padding: '0 12px', borderRadius: 13, background: donutAddBtnBg, color: donutAddBtnTextColor, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{donutAddBtnText}</button>
                    ) : (
                      <button onClick={() => { setItemModal(item); setModalQty(1) }} style={{ width: 28, height: 28, borderRadius: 14, background: donutAddBtnBg, color: donutAddBtnTextColor, border: 'none', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>+</button>
                    )
                  )}
                  {isVendor && vendorStatus !== 'expired' && (
                    <button style={S.smallBtn('#8B0000')} onClick={() => startEdit(item)}>Edit</button>
                  )}
                </div>
              </div>
              {/* Standard-theme Add-to-Cart — absolute, original behaviour. */}
              {!donutCardStyles && !isVendor && shopOpen && item.available && (
                <button style={S.addBtn} onClick={() => { setItemModal(item); setModalQty(1) }}>+</button>
              )}
            </div>
          )
        ))}

        {visibleMenu.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>{t.noItems || 'No items on the menu'}</div>
        )}
      </div>


      {/* --- StreetLocal Footer Link --- */}
      {!isVendor && (
        <a href="https://streetlocal.live" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '16px 0 8px', textDecoration: 'none' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Powered by </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>StreetLocal</span>
        </a>
      )}
      </div>

      {/* --- Sticky Cart Bar --- */}
      {totalItems > 0 && !isVendor && (
        <div style={{ ...S.stickyCart, ...(isCustomAccent ? { background: accent } : {}) }}>
          <span style={S.cartText}>{totalItems} item{totalItems > 1 ? 's' : ''} &middot; {fmt(totalPrice)}</span>
          <button style={{ ...S.checkoutBtn, ...(isCustomAccent ? { background: '#fff', color: accent } : {}) }} onClick={() => { setCheckoutOpen(true); setOrderDone(false); detectDeliveryZone() }}>
            {t.checkout || 'Checkout'} &rarr;
          </button>
        </div>
      )}


      {/* ═══ ITEM DETAIL MODAL ═══ */}
      {itemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }} onClick={() => setItemModal(null)}>
          {/* Fixed background + glass — stays in place while content scrolls */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', zIndex: 0 }} />
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 0 }} />

          {/* Content — scrollable over the fixed glass background */}
          {(() => {
            const priceColor = '#FACC15'
            const qtyBg = isCustomAccent ? accent : '#FACC15'
            const qtyColor = isCustomAccent ? '#fff' : '#000'
            return (
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto', height: '100%' }} onClick={(e) => e.stopPropagation()}>

            {/* Header — company name + cart */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px' }}>
              <button onClick={() => setItemModal(null)} style={{ width: 38, height: 38, borderRadius: 19, background: isCustomAccent ? accent : 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{shopName}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{shopFoodType}</div>
              </div>
              <button onClick={() => { setItemModal(null); if (cart.length > 0) { setCheckoutOpen(true); setOrderDone(false) } }} style={{ background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', padding: 6, minWidth: 44, minHeight: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' }}>
                <span style={{ fontSize: 20 }}>🛒</span>
                {cart.length > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cart.reduce((s, c) => s + c.qty, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Hero image — with side padding + rounded */}
            <div style={{ padding: '0 14px', position: 'relative' }}>
              {(() => {
                const photoStrip = [itemModal.photo, ...(itemModal.photos || [])].filter(Boolean)
                const activePhoto = photoStrip[modalPhotoIdx] || itemModal.photo || PLACEHOLDER_LG
                const hasMany = photoStrip.length > 1
                const goPrev = () => setModalPhotoIdx(i => (i - 1 + photoStrip.length) % photoStrip.length)
                const goNext = () => setModalPhotoIdx(i => (i + 1) % photoStrip.length)
                return (
                  <>
                    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden' }}
                      onTouchStart={(e) => { modalSwipeStartX.current = e.touches[0].clientX }}
                      onTouchEnd={(e) => {
                        if (modalSwipeStartX.current === null || !hasMany) return
                        const dx = e.changedTouches[0].clientX - modalSwipeStartX.current
                        if (Math.abs(dx) > 50) { dx > 0 ? goPrev() : goNext() }
                        modalSwipeStartX.current = null
                      }}
                    >
                      <img
                        src={activePhoto}
                        alt={itemModal.name}
                        onError={imgError('food')}
                        style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block', transition: 'opacity 250ms ease' }}
                        key={activePhoto}
                      />
                      {hasMany && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); goPrev() }} aria-label="Previous photo" style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 18, border: 'none', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>‹</button>
                          <button onClick={(e) => { e.stopPropagation(); goNext() }} aria-label="Next photo" style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 18, border: 'none', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>›</button>
                          {/* Dot indicator */}
                          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, pointerEvents: 'none' }}>
                            {photoStrip.map((_, i) => (
                              <span key={i} style={{ width: i === modalPhotoIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === modalPhotoIdx ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'width 200ms ease, background 200ms ease' }} />
                            ))}
                          </div>
                          {/* Counter badge */}
                          <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: '#fff', fontSize: 13, fontWeight: 700, pointerEvents: 'none' }}>{modalPhotoIdx + 1} / {photoStrip.length}</div>
                        </>
                      )}
                    </div>
                    {hasMany && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 2px' }}>
                        {photoStrip.map((url, i) => (
                          <button key={i} onClick={() => setModalPhotoIdx(i)} style={{
                            flexShrink: 0, width: 56, height: 56, borderRadius: 10, padding: 0,
                            border: '2px solid ' + (modalPhotoIdx === i ? (isCustomAccent ? accent : '#FACC15') : 'rgba(255,255,255,0.1)'),
                            background: 'none', cursor: 'pointer', overflow: 'hidden',
                          }}>
                            <img src={url} alt="" onError={imgError('food')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
              {/* Category badge — hidden on donut theme so the Reviews pill
                  can sit at the very top-right of the image without stacking. */}
              {itemModal.category && shopTheme !== 'donut' && (
                <span style={{ position: 'absolute', top: 12, right: 26, fontSize: 13, fontWeight: 700, color: '#fff', background: accent, padding: '4px 10px', borderRadius: 8 }}>{itemModal.category}</span>
              )}
              {/* Reviews pill — donut theme only. Top-right, just under the
                  modal header. Opens the per-item reviews page. */}
              {shopTheme === 'donut' && (() => {
                const key = itemModal.id || itemModal.name
                const list = reviewsByItem[key] || []
                return (
                  <button
                    onClick={() => setItemReviewsOpen(itemModal)}
                    style={{
                      position: 'absolute', top: 12, right: 26,
                      padding: '6px 12px', borderRadius: 100,
                      background: '#FACC15', border: 'none', color: '#000',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      minHeight: 32, zIndex: 3, fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>★</span>
                    Reviews{list.length > 0 ? ` · ${list.length}` : ''}
                  </button>
                )
              })()}
            </div>

            {/* Info card — pulls up over image */}
            <div style={{ margin: '-20px 12px 0', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 20, padding: '20px 18px', position: 'relative', border: isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.08)' }}>
              {/* Red accent line for noodle theme */}
              {isCustomAccent && <div style={{ position: 'absolute', top: 20, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{itemModal.name}</h2>
              {itemModal.spice > 0 && shopTheme !== 'donut' &&<span style={{ fontSize: 14 }}>{'🌶️'.repeat(itemModal.spice)}</span>}
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{itemModal.desc}</p>

              {/* Badges — popular, halal, dietary tags */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {itemModal.popular && <span style={{ fontSize: 13, fontWeight: 700, background: 'rgba(250,204,21,0.15)', color: '#FACC15', padding: '4px 10px', borderRadius: 8 }}>⭐ Popular</span>}
                {shopTheme !== 'donut' && (itemModal.halal || (itemModal.dietary || []).includes('Halal')) && <span style={{ fontSize: 13, fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '4px 10px', borderRadius: 8 }}>☪️ Halal</span>}
                {(itemModal.dietary || []).filter(d => d !== 'Halal').map(d => (
                  <span key={d} style={{ fontSize: 13, fontWeight: 700, background: 'rgba(34,197,94,0.12)', color: '#86efac', padding: '4px 10px', borderRadius: 8 }}>🌱 {d}</span>
                ))}
                {itemModal.portion && <span style={{ fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 8 }}>⚖️ {itemModal.portion}</span>}
                {itemModal.stock != null && itemModal.stock > 0 && itemModal.stock <= 5 && (
                  <span style={{ fontSize: 13, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '4px 10px', borderRadius: 8 }}>Only {itemModal.stock} left</span>
                )}
              </div>
              {/* Allergen warning — surfaces only if allergens present */}
              {(itemModal.allergens || []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600 }}>Contains: {(itemModal.allergens || []).join(', ')}</span>
                </div>
              )}

              {/* Price + Qty */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  {(() => {
                    const basePrice = itemModal.promoPrice || itemModal.price
                    const variantDelta = modalVariant ? (modalVariant.priceDelta || 0) : 0
                    const modifiersDelta = modalModifiers.reduce((s, m) => s + (m.priceDelta || 0), 0)
                    const livePrice = basePrice + variantDelta + modifiersDelta
                    if (itemModal.promoPrice && !modalVariant && modalModifiers.length === 0) {
                      return (
                        <>
                          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', marginRight: 8 }}>{fmt(itemModal.price)}</span>
                          <span style={{ fontSize: 24, fontWeight: 900, color: '#EF4444' }}>{fmt(itemModal.promoPrice)}</span>
                        </>
                      )
                    }
                    return <span style={{ fontSize: 24, fontWeight: 900, color: priceColor }}>{fmt(livePrice)}</span>
                  })()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} style={{ width: 38, height: 38, borderRadius: 19, border: 'none', background: qtyBg, color: qtyColor, fontSize: 20, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', minWidth: 28, textAlign: 'center' }}>{modalQty}</span>
                  <button onClick={() => setModalQty(modalQty + 1)} style={{ width: 38, height: 38, borderRadius: 19, border: 'none', background: qtyBg, color: qtyColor, fontSize: 20, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            </div>

            {/* Add to Cart button */}
            {/* Variants picker — required choice if item has variants */}
            {itemModal.variants && itemModal.variants.length > 0 && (
              <div style={{ padding: '0 14px 12px' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Size · choose one</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {itemModal.variants.map(v => {
                    const isActive = modalVariant && modalVariant.id === v.id
                    return (
                      <button key={v.id} onClick={() => setModalVariant(v)} style={{
                        flex: '1 1 calc(50% - 4px)', minWidth: 100, padding: '10px 12px',
                        borderRadius: 12, border: '1px solid ' + (isActive ? '#fff' : 'rgba(255,255,255,0.1)'),
                        background: isActive ? (isCustomAccent ? accent : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.04)',
                        color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span>{v.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>{v.priceDelta > 0 ? `+${fmt(v.priceDelta)}` : v.priceDelta < 0 ? fmt(v.priceDelta) : 'base'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Modifiers — optional multi-select */}
            {itemModal.modifiers && itemModal.modifiers.length > 0 && (
              <div style={{ padding: '0 14px 12px' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Add-ons · optional</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {itemModal.modifiers.map(m => {
                    const isChecked = modalModifiers.some(x => x.id === m.id)
                    return (
                      <button key={m.id} onClick={() => setModalModifiers(p => isChecked ? p.filter(x => x.id !== m.id) : [...p, m])} style={{
                        padding: '10px 12px', borderRadius: 12,
                        border: '1px solid ' + (isChecked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'),
                        background: isChecked ? (isCustomAccent ? `${accent}30` : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.04)',
                        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid rgba(255,255,255,0.3)', background: isChecked ? (isCustomAccent ? accent : '#fff') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: isCustomAccent ? '#fff' : '#000', fontWeight: 900 }}>{isChecked && '✓'}</span>
                          {m.name}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: m.priceDelta > 0 ? '#FACC15' : 'rgba(255,255,255,0.5)' }}>{m.priceDelta > 0 ? `+${fmt(m.priceDelta)}` : m.priceDelta < 0 ? fmt(m.priceDelta) : 'free'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Per-item note — progressive disclosure ghost button + collapsible textarea */}
            {shopOpen && itemModal.available && (
              <div style={{ padding: '0 12px 8px' }}>
                {!modalNoteOpen ? (
                  <button onClick={() => setModalNoteOpen(true)} type="button" style={{
                    width: '100%', padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 14 }}>📝</span>
                    <span>{modalNote.trim() ? `Note: ${modalNote.slice(0, 30)}${modalNote.length > 30 ? '…' : ''}` : 'Add note for this item'}</span>
                  </button>
                ) : (
                  <div style={{ padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>📝 Note for vendor</span>
                      <button onClick={() => setModalNoteOpen(false)} type="button" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1, width: 24, height: 24 }}>&times;</button>
                    </div>
                    <textarea
                      value={modalNote}
                      onChange={(e) => setModalNote(e.target.value.slice(0, 100))}
                      placeholder={shopTheme === 'donut' ? 'Extra glaze · no sprinkles · less sugar' : 'Extra spicy · no onion · less sugar'}
                      autoFocus
                      style={{ width: '100%', minHeight: 50, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4, textAlign: 'right' }}>{modalNote.length}/100</div>
                  </div>
                )}
              </div>
            )}

            {/* Add to Cart button */}
            {shopOpen && itemModal.available && (() => {
              const basePrice = itemModal.promoPrice || itemModal.price
              const variantDelta = modalVariant ? (modalVariant.priceDelta || 0) : 0
              const modifiersDelta = modalModifiers.reduce((s, m) => s + (m.priceDelta || 0), 0)
              const unitPrice = basePrice + variantDelta + modifiersDelta
              const totalPriceForBtn = unitPrice * modalQty
              return (
                <div style={{ padding: '8px 12px 32px' }}>
                  <button
                    style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: isCustomAccent ? accent : '#8DC63F', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                    onClick={() => { addToCart(itemModal, modalQty, modalVariant, modalModifiers, modalNote); setItemModal(null) }}
                  >
                    {isCustomAccent && <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}><div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} /></div>}
                    <span style={{ position: 'relative', zIndex: 1 }}>{t.addToCart || 'Add to Cart'} &middot; {fmt(totalPriceForBtn)}</span>
                  </button>
                </div>
              )
            })()}
          </div>
            )
          })()}
        </div>
      )}

      {/* ═══ VISIT US PAGE ═══ */}
      {showLocation && (() => {
        const DAYS = [
          { key: 'mon', en: 'Monday' }, { key: 'tue', en: 'Tuesday' }, { key: 'wed', en: 'Wednesday' },
          { key: 'thu', en: 'Thursday' }, { key: 'fri', en: 'Friday' }, { key: 'sat', en: 'Saturday' }, { key: 'sun', en: 'Sunday' }
        ]
        const todayKey = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key
        const todaySched = shopSchedule[todayKey]
        const closedDays = DAYS.filter(d => shopSchedule[d.key]?.off)

        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0, pointerEvents: 'none' }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setShowLocation(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{shopName}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{userDistance !== null ? `Distance ${userDistance} km` : 'Visit Us'}</div>
              </div>
            </div>

            {/* Page title */}
            <div style={{ padding: '4px 16px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Visit Us</div>
            </div>

            {/* Single info card */}
            <div style={{ margin: '0 14px 24px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: 20, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>

              {/* Logo + name + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                {shopLogoStyle !== 'off' && shopLogo ? (
                  shopLogoStyle === 'bare' ? (
                    <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 58, height: 58, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))', transform: `translate(${logoOffsetX * 58 / 156}px, ${logoOffsetY * 58 / 156}px)` }} />
                  ) : (
                    <div style={{ width: 68, height: 68, borderRadius: 34, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                      <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 58, height: 58, objectFit: 'contain', transform: `translate(${logoOffsetX * 58 / 156}px, ${logoOffsetY * 58 / 156}px)` }} />
                    </div>
                  )
                ) : shopLogoStyle !== 'off' ? (
                  <div style={{ width: 68, height: 68, borderRadius: 34, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{shopName.charAt(0).toUpperCase()}</div>
                ) : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{shopName}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{shopFoodType}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: shopOpen ? '#22c55e' : '#EF4444' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: shopOpen ? '#22c55e' : '#EF4444' }}>{shopOpen ? 'Open Now' : 'Closed'}</span>
                  </div>
                  {/* WhatsApp on Visit Us — only when vendor opts in (foodlocalchat) */}
                  {(isVendor || showVisitUsWA) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledbbbbv-removebg-preview.png" alt="" onError={imgError('generic')} style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    {!isVendor && shopPhone ? (
                      <a href={`https://wa.me/${String(shopPhone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{shopPhone}</a>
                    ) : (
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{shopPhone}</span>
                    )}
                  </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
                {shopBio || `Welcome to ${shopName}! Fresh food prepared right in front of you.`}
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

              {/* Today's hours + countdown */}
            {(() => {
              const now = new Date()
              const openStr = todaySched?.open || '17:00'
              const closeStr = todaySched?.close || '23:00'
              const [oh, om] = openStr.split(':').map(Number)
              const [ch, cm] = closeStr.split(':').map(Number)
              const openMin = oh * 60 + om
              const closeMin = ch * 60 + cm
              const nowMin = now.getHours() * 60 + now.getMinutes()
              const isOpen = !todaySched?.off && nowMin >= openMin && nowMin < closeMin
              const minsLeft = isOpen ? closeMin - nowMin : 0
              const hrsLeft = Math.floor(minsLeft / 60)
              const mLeft = minsLeft % 60
              const totalMins = closeMin - openMin
              const progress = isOpen && totalMins > 0 ? ((nowMin - openMin) / totalMins) : 0
              const circumference = 2 * Math.PI * 18
              const dashOffset = circumference * (1 - progress)
              const ringColor = isCustomAccent ? accent : '#22c55e'

              // Build open days summary (e.g. "Mon–Fri" or "Mon–Sat")
              const openDays = DAYS.filter(d => !shopSchedule[d.key]?.off)
              const openDayLabels = openDays.map(d => (t[d.en.toLowerCase()] || d.en).slice(0, 3))
              const dayRange = openDayLabels.length > 0 ? (openDayLabels.length === 7 ? 'Every day' : `${openDayLabels[0]}–${openDayLabels[openDayLabels.length - 1]}`) : ''

              return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Open Today Till {closeStr}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>From {openStr} · {dayRange}</div>
                  </div>
                  {!todaySched?.off && isOpen && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                        <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                          <circle cx="16" cy="16" r="12" fill="none" stroke={ringColor} strokeWidth="2.5" strokeDasharray={2 * Math.PI * 12} strokeDashoffset={(2 * Math.PI * 12) * (1 - progress)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        </svg>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: minsLeft <= 30 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>
                        {minsLeft <= 30 ? `${mLeft}m left` : `${hrsLeft}h ${mLeft}m`}
                      </span>
                    </div>
                  )}
                </div>
                {closedDays.length > 0 && (
                  <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 600, marginTop: 6 }}>
                    Closed on — {closedDays.map(d => (t[d.en.toLowerCase()] || d.en).slice(0, 3)).join(' / ')}
                  </div>
                )}
              </>
              )
            })()}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsdasdvvvdsds-removebg-preview.png" alt="" onError={imgError('generic')} style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{shopAddress || 'Address not set'}</div>
                  {(shopCity || shopCountry) && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{[shopCity, shopCountry].filter(Boolean).join(', ')}</div>}
                  </div>
              </div>
              {shopMapsLink && (
                <a href={shopMapsLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 10, borderRadius: 10, marginTop: 10, background: isCustomAccent ? `${accent}25` : 'rgba(141,198,63,0.1)', border: isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(141,198,63,0.2)', textAlign: 'center', textDecoration: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isCustomAccent ? '#fff' : '#8DC63F' }}>Open in Google Maps →</span>
                </a>
              )}

              {/* Social links */}
              {(shopInstagram || shopTiktok || shopFacebook || shopYoutube || shopWebsite) && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0 14px' }} />
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    {shopInstagram && (
                      <a href={`https://instagram.com/${shopInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://cdn.simpleicons.org/instagram/white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                    {shopFacebook && (
                      <a href={shopFacebook.startsWith('http') ? shopFacebook : `https://facebook.com/${shopFacebook}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://cdn.simpleicons.org/facebook/white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                    {shopTiktok && (
                      <a href={`https://tiktok.com/@${shopTiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://cdn.simpleicons.org/tiktok/white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                    {shopYoutube && (
                      <a href={shopYoutube.startsWith('http') ? shopYoutube : `https://x.com/${shopYoutube.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://cdn.simpleicons.org/x/white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                    {shopWebsite && (
                      <a href={shopWebsite.startsWith('http') ? shopWebsite : `https://${shopWebsite}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://api.iconify.design/mdi/web.svg?color=white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                  </div>
                </>
              )}

              {/* Delivery status */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '14px 0 12px' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: isCustomAccent ? accent : (delEnabled ? '#22c55e' : '#F59E0B') }}>{delEnabled ? 'Delivery Available' : 'Collection Only'}</span>
              </div>

            </div>{/* close single card */}
          </div>
        </div>
        )
      })()}

      {/* ═══ HERO TEXT EDITOR ═══ */}
      {heroEditor && (() => {
        const HERO_FONTS_E = { system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', nunito: '"Nunito", sans-serif', poppins: '"Poppins", sans-serif', playfair: '"Playfair Display", serif', caveat: '"Caveat", cursive', bebas: '"Bebas Neue", sans-serif' }
        const HERO_SIZES_E = { normal: { title: 28, sub: 13, city: 9 }, large: { title: 34, sub: 16, city: 10 }, xl: { title: 40, sub: 19, city: 12 } }
        const szE = HERO_SIZES_E[heroSize] || HERO_SIZES_E.normal
        const ffE = HERO_FONTS_E[heroFont] || HERO_FONTS_E.system
        const subC = heroSubColor || (heroColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : heroColor)
        // Smart line break preview
        const maxChars = szE.title >= 34 ? 10 : 14
        const words = shopName.split(' ')
        const pLines = []
        let cur = ''
        words.forEach(w => { if (cur && (cur + ' ' + w).length > maxChars) { pLines.push(cur); cur = w } else { cur = cur ? cur + ' ' + w : w } })
        if (cur) pLines.push(cur)
        const lineWarning = pLines.length > 3
        const charWarning = shopName.length > 20

        const EFFECTS_LIST = [
          { id: 'shadow', label: 'Shadow', desc: 'Classic drop shadow' },
          { id: 'glow', label: 'Glow', desc: 'Soft color glow' },
          { id: 'runGlow', label: 'Pulse Glow', desc: 'Animated breathing glow' },
          { id: 'outline', label: 'Outline', desc: 'Hollow text with stroke' },
          { id: 'neon', label: 'Neon', desc: 'Neon sign flicker' },
          { id: 'none', label: 'None', desc: 'Clean, no effects' },
        ]
        const EFFECTS_PREVIEW = {
          shadow: { textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)' },
          glow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40` },
          runGlow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40`, animation: 'heroRunGlow 3s ease-in-out infinite' },
          outline: { WebkitTextStroke: `2px ${heroColor}`, color: 'transparent' },
          neon: { textShadow: `0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}` },
          none: {},
        }
        const fxP = EFFECTS_PREVIEW[heroEffect] || EFFECTS_PREVIEW.shadow
        const COLOR_SWATCHES = ['#ffffff', '#f5f5f5', '#FACC15', '#FFD600', '#FF6B35', '#EF4444', '#8B0000', '#DC2626', '#22c55e', '#0D9488', '#3B82F6', '#1E40AF', '#8B5CF6', '#A855F7', '#F472B6', '#DB2777', '#000000', '#374151']

        const renderColorPicker = (current, setter, label) => (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
              {COLOR_SWATCHES.map(c => (
                <button key={c} onClick={() => setter(c)} style={{ width: 28, height: 28, borderRadius: 14, border: current === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0, boxShadow: current === c ? '0 0 8px rgba(255,255,255,0.3)' : 'none' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input key={current} defaultValue={current} placeholder="#ffffff" maxLength={7} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none' }} onKeyDown={e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setter(v) } }} />
              <button onClick={(e) => { const v = e.currentTarget.previousSibling.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setter(v) }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Set</button>
            </div>
          </div>
        )

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
            {/* Theme background + glass overlay (Shop Config pattern) — covers viewport, stays put while content scrolls */}
            <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
            {/* Content scroll container — sits above the fixed bg + overlay */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header — sticky. Donut theme: no tinted container (clean look
                over the pink theme bg). Other themes: keep the translucent
                bg + blur for legibility while scrolling. */}
            <div style={landingThemeId === 'donuts'
              ? { padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 5 }
              : { padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 5 }
            }>
              <button onClick={() => setHeroEditor(false)} style={{ width: 36, height: 36, borderRadius: 18, background: accent, border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{landingThemeId === 'donuts' ? 'Landing Page Edit' : 'Hero Text Editor'}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{landingThemeId === 'donuts' ? 'Edit every text, image, and colour on your donut landing' : 'Customise your landing page brand'}</div>
              </div>
            </div>

            {/* Live Preview — iPhone mockup */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 10px', position: 'relative', zIndex: 2 }}>
              <div style={{ position: 'relative' }}>
                {/* iPhone frame */}
                <div style={{ width: 200, height: 400, borderRadius: 30, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 12px 40px ${accent}20, 0 4px 16px rgba(0,0,0,0.3)`, border: '2px solid #333' }}>
                  {/* Side buttons */}
                  <div style={{ position: 'absolute', right: -3, top: 80, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                  <div style={{ position: 'absolute', left: -3, top: 68, width: 3, height: 16, borderRadius: '2px 0 0 2px', background: '#333' }} />
                  <div style={{ position: 'absolute', left: -3, top: 90, width: 3, height: 16, borderRadius: '2px 0 0 2px', background: '#333' }} />
                  {/* Screen */}
                  <div style={{ width: '100%', height: '100%', borderRadius: 27, overflow: 'hidden', position: 'relative', background: '#000' }}>
                    {/* Dynamic island */}
                    <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 48, height: 14, background: '#000', borderRadius: 12, zIndex: 10 }} />
                    {/* Donut theme: render the curated frozen HTML so the editor's
                        phone preview matches what the customer actually sees on
                        the landing. The custom hero-text/logo controls below are
                        a no-op for the donut theme but stay reachable for other
                        themes the vendor may switch to later. */}
                    {landingThemeId === 'donuts' && (
                      <DonutSplash landing={donutLanding} onEnter={() => {}} fit="cover" />
                    )}
                    {/* Background image */}
                    {landingThemeId !== 'donuts' && (<>
                    <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
                    {/* Content */}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                      <style>{`
                        @keyframes heroRunGlow { 0%, 100% { text-shadow: 0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 2px 4px rgba(0,0,0,0.9); } 50% { text-shadow: 0 0 20px ${heroColor}, 0 0 50px ${heroColor}60, 0 0 80px ${heroColor}30, 0 2px 4px rgba(0,0,0,0.9); } }
                        @keyframes heroNeonFlicker { 0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { text-shadow: 0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}, 0 0 42px ${heroColor}80; } 20%, 24%, 55% { text-shadow: none; } }
                      `}</style>
                      {/* Logo */}
                      {shopLogoStyle !== 'off' && shopLogo ? (
                        shopLogoStyle === 'bare' ? (
                          <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 6, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 26, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)' }}>
                            <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 46, height: 46, borderRadius: 23, objectFit: 'cover' }} />
                          </div>
                        )
                      ) : shopLogoStyle !== 'off' ? (
                        <div style={{ width: 36, height: 36, borderRadius: 18, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)' }}>{shopName.charAt(0).toUpperCase()}</div>
                      ) : null}
                      {/* Title lines */}
                      {pLines.map((line, i) => (
                        <div key={i} style={{ fontSize: szE.title, fontWeight: 800, color: heroEffect === 'outline' ? 'transparent' : heroColor, fontFamily: ffE, lineHeight: 1.15, letterSpacing: -0.5, textAlign: 'center', ...fxP }}>{line}</div>
                      ))}
                      {shopFoodType && <div style={{ fontSize: szE.sub, fontWeight: 600, color: subC, fontFamily: ffE, marginTop: 4, textShadow: '0 1px 3px rgba(0,0,0,0.9)', opacity: heroSubColor ? 1 : 0.85, textAlign: 'center' }}>{shopFoodType}</div>}
                      {(shopCity || shopCountry) && <div style={{ fontSize: szE.city, fontWeight: 600, color: subC, fontFamily: ffE, marginTop: 2, opacity: 0.7, textShadow: '0 1px 3px rgba(0,0,0,0.9)', textAlign: 'center' }}>{[shopCity, shopCountry].filter(Boolean).join(', ')}</div>}
                      {/* Mock View Menu button */}
                      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '6px 18px', borderRadius: 8, background: accent, fontSize: 13, fontWeight: 700, color: '#fff' }}>View Menu</div>
                    </div>
                    </>)}
                    {/* Home indicator */}
                    <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 50, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls — donut theme wraps the section in a glass-black panel
                so the dark-tinted inputs and effect buttons read as one cohesive
                glass surface over the pink theme bg. Other themes keep the flat
                14px padding so existing rendering is unchanged. */}
            <div style={landingThemeId === 'donuts'
              ? { margin: '14px', padding: '14px', borderRadius: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 2 }
              : { padding: '14px', position: 'relative', zIndex: 2 }
            }>

              {/* ═══ DONUT LANDING EDIT PANEL ═══ */}
              {landingThemeId === 'donuts' && (() => {
                const L = donutLanding
                const labelStyle = { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 4, display: 'block' }
                const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
                const SectionHeading = ({ children }) => (
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 18, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{children}</div>
                )
                const ImageRow = ({ label, valueKey }) => (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{label}</span>
                      <button type="button" onClick={() => setDonutField(valueKey, DONUT_LANDING_DEFAULTS[valueKey])} style={{ background: 'none', border: 'none', color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Reset</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {L[valueKey] ? (
                        <img src={L[valueKey]} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📷</div>
                      )}
                      <label style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {L[valueKey] ? 'Replace' : 'Upload'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const url = await uploadMenuImage(vendorId, f); if (url) setDonutField(valueKey, url) }} />
                      </label>
                      {L[valueKey] && (
                        <button type="button" onClick={() => setDonutField(valueKey, '')} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                      )}
                    </div>
                  </div>
                )
                return (
                  <>
                    <SectionHeading>Hero</SectionHeading>
                    <label style={labelStyle}>Line 1</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={30} value={L.heroLine1} onChange={(e) => setDonutField('heroLine1', e.target.value)} />
                    <label style={labelStyle}>Line 2 (accent colour)</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={30} value={L.heroLine2} onChange={(e) => setDonutField('heroLine2', e.target.value)} />
                    <label style={labelStyle}>Line 3 (accent colour)</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={30} value={L.heroLine3} onChange={(e) => setDonutField('heroLine3', e.target.value)} />
                    <label style={labelStyle}>Kicker (small caps above heading)</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={40} value={L.kicker} onChange={(e) => setDonutField('kicker', e.target.value)} />
                    <label style={labelStyle}>Subtitle paragraph</label>
                    <textarea style={{ ...inputStyle, marginBottom: 8, resize: 'vertical', minHeight: 72, lineHeight: 1.4 }} maxLength={140} rows={2} value={L.subtitle} onChange={(e) => setDonutField('subtitle', e.target.value)} />
                    <label style={labelStyle}>Status pill (top-left)</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={20} value={L.openNow} onChange={(e) => setDonutField('openNow', e.target.value)} />

                    <SectionHeading>Today&apos;s Flavour</SectionHeading>
                    <label style={labelStyle}>Section heading</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={30} value={L.flavourKicker} onChange={(e) => setDonutField('flavourKicker', e.target.value)} />
                    <label style={labelStyle}>Flavour name (line 1)</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={20} value={L.flavour1} onChange={(e) => setDonutField('flavour1', e.target.value)} />
                    <label style={labelStyle}>Flavour name (line 2, accent colour)</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={20} value={L.flavour2} onChange={(e) => setDonutField('flavour2', e.target.value)} />
                    <label style={labelStyle}>CTA button text</label>
                    <input style={{ ...inputStyle, marginBottom: 8 }} maxLength={30} value={L.cta} onChange={(e) => setDonutField('cta', e.target.value)} />

                    <SectionHeading>Stats (3 small cards)</SectionHeading>
                    {[1, 2, 3].map(n => (
                      <div key={n} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input style={{ ...inputStyle, flex: '0 0 32%' }} maxLength={8} placeholder={`#${n} number`} value={L[`stat${n}Num`]} onChange={(e) => setDonutField(`stat${n}Num`, e.target.value)} />
                        <input style={{ ...inputStyle, flex: 1 }} maxLength={16} placeholder={`#${n} label`} value={L[`stat${n}Label`]} onChange={(e) => setDonutField(`stat${n}Label`, e.target.value)} />
                      </div>
                    ))}

                    <SectionHeading>Images</SectionHeading>
                    <ImageRow label="Background" valueKey="bgImg" />
                    <ImageRow label="Hero donut (next to heading)" valueKey="heroImg" />
                    <ImageRow label="Bouncing donut (top-right)" valueKey="bouncingImg" />
                    <ImageRow label="Bottom-left donut" valueKey="bottomLeftImg" />
                    <ImageRow label="Today&apos;s Flavour orb" valueKey="flavourOrbImg" />

                    <SectionHeading>Colours (master theme)</SectionHeading>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10, lineHeight: 1.4 }}>
                      These two colours cascade to the whole donut app — buttons, cards, frames, promo bar all follow unless you set a specific override in Menu Cards.
                    </div>
                    {/* Master accent pink — opens the shared palette drawer */}
                    <button
                      type="button"
                      onClick={() => setColorPickerTarget({
                        value: L.pink,
                        onChange: (c) => setDonutField('pink', c),
                        label: 'Accent pink (headings + outlines)',
                      })}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', marginBottom: 10, minHeight: 52 }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: L.pink, border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Accent pink</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginTop: 2 }}>{L.pink}</div>
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>🎨 Open palette</span>
                    </button>
                    {/* Bright pink — opens the shared palette drawer */}
                    <button
                      type="button"
                      onClick={() => setColorPickerTarget({
                        value: L.pinkBright,
                        onChange: (c) => setDonutField('pinkBright', c),
                        label: 'Bright pink (CTA + status pill)',
                      })}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', marginBottom: 12, minHeight: 52 }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: L.pinkBright, border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Bright pink (CTA)</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginTop: 2 }}>{L.pinkBright}</div>
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>🎨 Open palette</span>
                    </button>

                    <SectionHeading>Hero size &amp; font</SectionHeading>
                    <label style={labelStyle}>Heading size ({L.heroFontSize}px)</label>
                    <style>{`
                      .donut-size-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
                      .donut-size-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 11px; background: #EC4899; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(236,72,153,0.55), inset 0 1px 2px rgba(255,255,255,0.35); cursor: pointer; margin-top: -8px; }
                      .donut-size-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 11px; background: #EC4899; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(236,72,153,0.55); cursor: pointer; }
                      .donut-size-slider::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; }
                      .donut-size-slider::-moz-range-track { height: 6px; border-radius: 3px; }
                    `}</style>
                    <input
                      className="donut-size-slider"
                      type="range" min={28} max={64} step={1}
                      value={L.heroFontSize}
                      onChange={(e) => setDonutField('heroFontSize', Number(e.target.value))}
                      style={{
                        // Track: gradient from white (filled portion) → grey (remaining)
                        background: `linear-gradient(to right, #ffffff 0%, #ffffff ${((L.heroFontSize - 28) / 36) * 100}%, rgba(255,255,255,0.18) ${((L.heroFontSize - 28) / 36) * 100}%, rgba(255,255,255,0.18) 100%)`,
                        marginBottom: 12,
                      }}
                    />
                    <label style={labelStyle}>Heading font</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
                      {[{ id: 'system', label: 'Default' }, { id: 'nunito', label: 'Rounded' }, { id: 'poppins', label: 'Bold' }, { id: 'playfair', label: 'Elegant' }, { id: 'caveat', label: 'Handwritten' }, { id: 'bebas', label: 'Street' }].map(f => (
                        <button key={f.id} type="button" onClick={() => setDonutField('heroFontFamily', f.id)} style={{ padding: '10px 6px', borderRadius: 10, border: L.heroFontFamily === f.id ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: L.heroFontFamily === f.id ? `${accent}20` : 'rgba(255,255,255,0.04)', color: L.heroFontFamily === f.id ? '#fff' : 'rgba(255,255,255,0.4)' }}>{f.label}</button>
                      ))}
                    </div>

                    <button type="button" onClick={resetDonutLanding} style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: '#000', color: '#FACC15', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>Reset Landing to Defaults</button>
                  </>
                )
              })()}

              {/* ─── Non-donut controls (Shop Name, Size, Font, Effects, Colours) ─── */}
              {landingThemeId !== 'donuts' && (<>
              {/* Shop Name Input */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Shop Name</span>
                  <span style={{ fontSize: 13, color: charWarning ? '#EF4444' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{shopName.length}/20</span>
                </div>
                <input value={shopName} maxLength={20} onChange={e => handleShopNameChange(e.target.value)} placeholder="Your shop name" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: (charWarning || shopNameError) ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.1)', background: landingThemeId === 'donuts' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.06)', backdropFilter: landingThemeId === 'donuts' ? 'blur(12px)' : 'none', WebkitBackdropFilter: landingThemeId === 'donuts' ? 'blur(12px)' : 'none', color: '#fff', fontSize: 16, fontWeight: 700, outline: 'none', fontFamily: ffE }} />
                {shopNameError && (
                  <div role="alert" style={{ marginTop: 6, padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: 13, fontWeight: 600, lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>⚠</span>
                    <span>{shopNameError}</span>
                  </div>
                )}
                {lineWarning && <div style={{ fontSize: 13, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>Name will stack to {pLines.length} lines. Try shorter words or a smaller size.</div>}
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Preview: {pLines.map((l, i) => (i > 0 ? ' / ' : '') + `"${l}"`)}</div>
              </div>

              {/* Size */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Size</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[{ id: 'normal', label: 'Normal', px: '42px' }, { id: 'large', label: 'Large', px: '52px' }, { id: 'xl', label: 'Extra Large', px: '62px' }].map(s => (
                  <button key={s.id} onClick={() => setHeroSize(s.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: heroSize === s.id ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: heroSize === s.id ? `${accent}20` : 'rgba(255,255,255,0.04)', color: heroSize === s.id ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    <div>{s.label}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.px}</div>
                  </button>
                ))}
              </div>

              {/* Font */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Font</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
                {[
                  { id: 'system', label: 'Default', ff: '-apple-system, sans-serif' },
                  { id: 'nunito', label: 'Rounded', ff: '"Nunito", sans-serif' },
                  { id: 'poppins', label: 'Bold', ff: '"Poppins", sans-serif' },
                  { id: 'playfair', label: 'Elegant', ff: '"Playfair Display", serif' },
                  { id: 'caveat', label: 'Handwritten', ff: '"Caveat", cursive' },
                  { id: 'bebas', label: 'Street', ff: '"Bebas Neue", sans-serif' },
                ].map(f => (
                  <button key={f.id} onClick={() => setHeroFont(f.id)} style={{ padding: '10px 6px', borderRadius: 10, border: heroFont === f.id ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: f.ff, background: heroFont === f.id ? `${accent}20` : 'rgba(255,255,255,0.04)', color: heroFont === f.id ? '#fff' : 'rgba(255,255,255,0.4)' }}>{f.label}</button>
                ))}
              </div>

              {/* Effects */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Effect</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                {EFFECTS_LIST.map(fx => {
                  // Donut theme: glass-black tint (backdrop-filter + black rgba)
                  // per user spec; other themes keep the original light style.
                  const isActive = heroEffect === fx.id
                  const isDonut = landingThemeId === 'donuts'
                  const bg = isDonut
                    ? (isActive ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.55)')
                    : (isActive ? `${accent}20` : 'rgba(255,255,255,0.04)')
                  return (
                  <button key={fx.id} onClick={() => setHeroEffect(fx.id)} style={{ padding: '10px 8px', borderRadius: 10, border: isActive ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', background: bg, backdropFilter: isDonut ? 'blur(12px)' : 'none', WebkitBackdropFilter: isDonut ? 'blur(12px)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.5)' }}>{fx.label}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{fx.desc}</div>
                  </button>
                  )
                })}
              </div>

              {/* Title Color */}
              {renderColorPicker(heroColor, setHeroColor, 'Title Color')}

              {/* Sub-text Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Sub-text Color</span>
                {heroSubColor && <button onClick={() => setHeroSubColor('')} style={{ background: 'none', border: 'none', color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Reset to auto</button>}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                {COLOR_SWATCHES.map(c => (
                  <button key={c} onClick={() => setHeroSubColor(c)} style={{ width: 28, height: 28, borderRadius: 14, border: heroSubColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0, boxShadow: heroSubColor === c ? '0 0 8px rgba(255,255,255,0.3)' : 'none' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <input key={heroSubColor} defaultValue={heroSubColor} placeholder="Auto from title" maxLength={7} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none' }} onKeyDown={e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setHeroSubColor(v) } }} />
                <button onClick={(e) => { const v = e.currentTarget.previousSibling.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setHeroSubColor(v) }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Set</button>
              </div>

              {/* Reset all */}
              <button onClick={() => { setHeroSize('normal'); setHeroFont('system'); setHeroColor('#ffffff'); setHeroSubColor(''); setHeroEffect('shadow') }} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Reset All to Default</button>
              </>)}
            </div>
            {/* Footer save button — sticks to viewport bottom while page scrolls */}
            <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.06)', position: 'sticky', bottom: 0, zIndex: 2 }}>
              <button onClick={() => setHeroEditor(false)} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer', minHeight: 48 }}>Save Changes</button>
            </div>
            </div>{/* end content scroll container */}
          </div>
        )
      })()}

      {/* ═══ THEME EDITOR ═══ */}
      {themeEditor && (() => {
        const [editorTool, setEditorTool] = [themeEditor.tool || 'position', (t) => setThemeEditor({ ...themeEditor, tool: t })]
        // Convert hex to HSL for the picker
        function hexToHsl(hex) {
          let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
          const max = Math.max(r,g,b), min = Math.min(r,g,b), l = (max+min)/2
          let h = 0, s = 0
          if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d/(2-max-min) : d/(max+min)
            if (max === r) h = ((g-b)/d + (g<b?6:0))/6
            else if (max === g) h = ((b-r)/d+2)/6
            else h = ((r-g)/d+4)/6
          }
          return [Math.round(h*360), Math.round(s*100), Math.round(l*100)]
        }
        function hslToHex(h,s,l) {
          s /= 100; l /= 100
          const a = s * Math.min(l, 1-l)
          const f = n => { const k = (n+h/30)%12; return Math.round(255*(l - a*Math.max(Math.min(k-3, 9-k, 1), -1))) }
          return '#' + [f(0),f(8),f(4)].map(x => x.toString(16).padStart(2,'0')).join('')
        }
        const [hue, sat, lit] = hexToHsl(editorColor)

        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-06_24_54-pm.png" alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Top bar — close + save */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>StreetLocal</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.5 }}>Theme Editor</div>
            </div>
            <button onClick={() => setThemeEditor(null)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#8B0000', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          </div>

          {/* Phone preview — centered, flex area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0, padding: '44px 48px' }}>
            <div style={{ width: 210, height: 420, borderRadius: 32, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 12px 40px ${editorColor}22, 0 4px 16px rgba(0,0,0,0.4)`, border: '2px solid #333' }}>
              {/* Side button */}
              <div style={{ position: 'absolute', right: -3, top: 75, width: 3, height: 26, borderRadius: '0 2px 2px 0', background: '#333' }} />
              <div style={{ position: 'absolute', left: -3, top: 62, width: 3, height: 16, borderRadius: '2px 0 0 2px', background: '#333' }} />
              <div style={{ position: 'absolute', left: -3, top: 82, width: 3, height: 16, borderRadius: '2px 0 0 2px', background: '#333' }} />
              {/* Screen */}
              <div style={{ width: '100%', height: '100%', borderRadius: 25, overflow: 'hidden', position: 'relative', background: '#000' }}>
                <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 46, height: 14, background: '#000', borderRadius: 14, zIndex: 5 }} />
                <img src={themeEditor.url} alt="" onError={imgError('theme')} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${editorPos.x}% ${editorPos.y}%`, transition: 'object-position 0.2s ease' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  {/* Respects shopLogoStyle — single source of truth. */}
                  {shopLogoStyle === 'off' ? null : shopLogo ? (
                    shopLogoStyle === 'bare' ? (
                      <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 6, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: 36, background: editorColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)', transition: 'background 0.2s' }}>
                        <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 62, height: 62, borderRadius: 31, objectFit: 'cover' }} />
                      </div>
                    )
                  ) : (
                    shopLogoStyle === 'bare' ? null : (
                      <div style={{ width: 72, height: 72, borderRadius: 36, background: editorColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)' }}>{shopName.charAt(0).toUpperCase()}</div>
                    )
                  )}
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.8)', textAlign: 'center', padding: '0 10px' }}>{shopName}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{shopFoodType}</div>
                  <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '6px 20px', borderRadius: 8, background: editorColor, fontSize: 13, fontWeight: 700, color: '#fff', transition: 'background 0.2s' }}>View Menu</div>
                </div>
                <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 50, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 3 }} />
              </div>
            </div>
            {/* Arrow buttons around the phone — moves image in arrow direction */}
            {/* Top — image moves up (decrease y) */}
            <button onClick={() => setEditorPos(p => ({ ...p, y: Math.min(100, p.y + 5) }))} style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>↑</button>
            {/* Bottom — image moves down (increase y) */}
            <button onClick={() => setEditorPos(p => ({ ...p, y: Math.max(0, p.y - 5) }))} style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>↓</button>
            {/* Left — image moves left (increase x) */}
            <button onClick={() => setEditorPos(p => ({ ...p, x: Math.min(100, p.x + 5) }))} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>←</button>
            {/* Right — image moves right (decrease x) */}
            <button onClick={() => setEditorPos(p => ({ ...p, x: Math.max(0, p.x - 5) }))} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>→</button>
          </div>

          {/* Footer — Reset + Color picker button */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 24px', gap: 12 }}>
            <button onClick={() => {
              setShopTheme('custom'); setShopAccentColor(editorColor); setBtnColor('') // reset button override so it follows the new accent
              localStorage.setItem('foodlocalchat_theme', 'custom'); localStorage.setItem('foodlocalchat_themeBg', themeEditor.url)
              localStorage.setItem('foodlocalchat_accentColor', editorColor); localStorage.setItem('foodlocalchat_bgPos', JSON.stringify(editorPos))
              const bgImg = document.getElementById('app-bg-img')
              if (bgImg) { bgImg.src = themeEditor.url; bgImg.style.objectFit = 'cover'; bgImg.style.objectPosition = `${editorPos.x}% ${editorPos.y}%` }
              setThemeEditor(null); setShowLanding(true)
            }} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: editorColor, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s' }}>Save Theme</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setEditorTool(editorTool === 'color' ? 'position' : 'color')} style={{ width: 48, height: 48, borderRadius: 24, border: `2px solid ${editorColor}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: editorColor }} />
            </button>
          </div>

          {/* Color Swatch Drawer — slides from left */}
          {editorTool === 'color' && (
            <>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 20 }} onClick={() => setEditorTool('position')} />
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', background: '#111', zIndex: 21, overflowY: 'auto' }}>
                <div style={{ padding: '16px 12px 0', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Pick Color</span>
                    <button onClick={() => setEditorTool('position')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: 8 }}>✕</button>
                  </div>
                  {/* Hex input — sticky under title */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: editorColor, border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                    <input type="text" placeholder="#8B0000" defaultValue={editorColor} maxLength={7} style={{ flex: 1, padding: '7px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', outline: 'none' }} onKeyDown={(e) => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) { setEditorColor(v); setEditorBaseColor(v); setEditorTool('position') } } }} />
                    <button onClick={(e) => { const v = e.currentTarget.previousSibling.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) { setEditorColor(v); setEditorBaseColor(v); setEditorTool('position') } }} style={{ padding: '7px 10px', borderRadius: 6, border: 'none', background: editorColor, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Go</button>
                  </div>
                </div>
                <div style={{ padding: '0 8px 20px' }}>
                  {[
                    { label: 'Red', h: 0 },
                    { label: 'Crimson', h: 345 },
                    { label: 'Rose', h: 330 },
                    { label: 'Pink', h: 315 },
                    { label: 'Magenta', h: 300 },
                    { label: 'Fuchsia', h: 285 },
                    { label: 'Purple', h: 270 },
                    { label: 'Violet', h: 255 },
                    { label: 'Indigo', h: 240 },
                    { label: 'Blue', h: 220 },
                    { label: 'Sky', h: 200 },
                    { label: 'Cyan', h: 185 },
                    { label: 'Teal', h: 170 },
                    { label: 'Mint', h: 155 },
                    { label: 'Green', h: 140 },
                    { label: 'Emerald', h: 120 },
                    { label: 'Lime', h: 90 },
                    { label: 'Chartreuse', h: 75 },
                    { label: 'Yellow', h: 55 },
                    { label: 'Gold', h: 45 },
                    { label: 'Amber', h: 35 },
                    { label: 'Orange', h: 25 },
                    { label: 'Vermilion', h: 12 },
                    { label: 'Brown', h: 20, sat: 60 },
                    { label: 'Maroon', h: 0, sat: 70 },
                    { label: 'Grey', h: 0, sat: 0 },
                    { label: 'Cool Grey', h: 210, sat: 10 },
                  ].map((row, ri) => {
                    const s = row.sat !== undefined ? row.sat : 80
                    const shades = row.sat === 0 || row.sat === 10
                      ? [12, 25, 40, 55, 72, 88].map(l => hslToHex(row.h, row.sat, l))
                      : [18, 30, 42, 54, 66, 80].map(l => hslToHex(row.h, l < 25 ? s + 10 : l > 70 ? s - 20 : s, l))
                    return (
                      <div key={ri} style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 2, paddingLeft: 2 }}>{row.label}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {shades.map((c, ci) => (
                            <button key={ci} onClick={() => { setEditorColor(c); setEditorBaseColor(c); setEditorTool('position') }} style={{
                              flex: 1, height: 36, borderRadius: 6, border: editorColor === c ? '2px solid #fff' : 'none',
                              background: c, cursor: 'pointer', padding: 0, minWidth: 0,
                            }} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div></div>
        )
      })()}

      {/* ═══ PER-ITEM REVIEWS PAGE (donut theme) ═══
          Stacks over the item modal at z-index 250. The Leave Review form
          stacks on top of THIS at z-index 260. Closing returns to the
          item modal (we don't null out itemModal when opening reviews). */}
      {itemReviewsOpen && shopTheme === 'donut' && (() => {
        const item = itemReviewsOpen
        const key = item.id || item.name
        const realList = reviewsByItem[key] || []
        // 5 sample reviews — shown only when no real reviews exist yet, so the
        // page never looks empty. As soon as a customer posts, the mocks step
        // aside and only real reviews show.
        const MOCK_REVIEWS = [
          { id: 'mock-1', rating: 5, name: 'Maya P.',   orderRef: 'DD-487193', verified: true,  comment: 'Absolutely the best donut I\'ve had in years. The icing is real fruit — you can taste it. Will order again.', createdAt: '2026-05-12T10:32:00Z' },
          { id: 'mock-2', rating: 5, name: 'Jordan L.', orderRef: '',          verified: false, comment: 'Heavenly. Custard filling is so fresh, not too sweet. Five stars easy.', createdAt: '2026-05-10T14:15:00Z' },
          { id: 'mock-3', rating: 4, name: 'Ravi G.',   orderRef: 'DD-624518', verified: true,  comment: 'Great donut, arrived warm. Lost a star because the box was slightly dented, but taste was 10/10.', createdAt: '2026-05-08T09:45:00Z' },
          { id: 'mock-4', rating: 5, name: 'Chloe B.',  orderRef: '',          verified: false, comment: 'My kids devoured these. Rich frosting without being too sugary. Found my new Sunday breakfast.', createdAt: '2026-05-05T08:20:00Z' },
          { id: 'mock-5', rating: 5, name: 'Ava M.',    orderRef: 'DD-301847', verified: true,  comment: 'Beautiful presentation, soft dough, perfect glaze. You can tell these are made with care.', createdAt: '2026-05-02T16:00:00Z' },
        ]
        const list = realList.length > 0 ? realList : MOCK_REVIEWS
        const avgRating = list.length > 0 ? (list.reduce((s, r) => s + (r.rating || 0), 0) / list.length) : 0
        const avatar = item.photo || (item.photos && item.photos[0]) || PLACEHOLDER_LG
        const close = () => { setItemReviewsOpen(null); setLeaveReviewOpen(false); setItemReviewForm({ rating: 0, comment: '', name: '', orderRef: '', error: '' }) }
        const closeLeaveSheet = () => { setLeaveReviewOpen(false); setItemReviewForm(p => ({ ...p, error: '' })) }
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 250 }}>
            {/* Same bg + glass as the item modal */}
            <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 0 }} />
            <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, margin: '0 auto', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', flexShrink: 0 }}>
                <button onClick={close} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 19, background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>←</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                    {list.length === 0 ? 'No reviews yet' : `${list.length} review${list.length === 1 ? '' : 's'} · ${avgRating.toFixed(1)} ★`}
                  </div>
                </div>
              </div>

              {/* Leave Review button — above the container, right side */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 10px', flexShrink: 0 }}>
                <button onClick={() => setLeaveReviewOpen(true)} style={{
                  padding: '8px 16px', borderRadius: 100,
                  background: '#FACC15', border: 'none', color: '#000',
                  fontSize: 13, fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  minHeight: 36, fontFamily: 'inherit',
                }}>✎ Leave Review</button>
              </div>

              {/* Tinted glass container holding all reviews for this item */}
              <div style={{ margin: '0 14px', padding: list.length > 0 ? '18px 16px' : 0, borderRadius: 20, background: list.length > 0 ? 'rgba(0,0,0,0.55)' : 'transparent', backdropFilter: list.length > 0 ? 'blur(14px)' : 'none', WebkitBackdropFilter: list.length > 0 ? 'blur(14px)' : 'none', border: list.length > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                {list.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>★</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>No reviews yet</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Be the first to share your experience.</div>
                  </div>
                ) : (
                  list.map((r, idx) => (
                    <div key={r.id}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: idx === 0 ? '0 0 14px' : '14px 0' }}>
                        <img src={avatar} alt={item.name} onError={imgError('food')} style={{ width: 46, height: 46, borderRadius: 23, objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.12)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                              <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                {[1,2,3,4,5].map(i => (
                                  <span key={i} style={{ fontSize: 13, color: i <= r.rating ? '#FACC15' : 'rgba(255,255,255,0.18)' }}>★</span>
                                ))}
                              </div>
                            </div>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
                              {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {r.verified && r.orderRef && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '3px 10px', borderRadius: 100, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                              <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 800 }}>✓ Verified Purchase</span>
                              <span style={{ fontSize: 13, color: '#86efac', fontFamily: 'monospace' }}>· {maskOrderRef(r.orderRef)}</span>
                            </div>
                          )}
                          {r.comment && (
                            <p style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)', margin: '8px 0 0' }}>{r.comment}</p>
                          )}
                        </div>
                      </div>
                      {idx < list.length - 1 && (
                        <div style={{ borderTop: '1.5px dotted rgba(255,255,255,0.22)' }} />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Leave Review button — same action, easier reach */}
              <div style={{ padding: '14px 14px 24px', flexShrink: 0 }}>
                <button onClick={() => setLeaveReviewOpen(true)} style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  background: '#FACC15', border: 'none', color: '#000',
                  fontSize: 15, fontWeight: 900, cursor: 'pointer',
                  minHeight: 48, fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(250,204,21,0.35)',
                }}>✎ Leave Review</button>
              </div>
            </div>

            {/* Leave Review modal — bottom sheet inside the reviews page */}
            {leaveReviewOpen && (
              <div onClick={closeLeaveSheet} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 260, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'rgba(15,15,15,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 18px calc(env(safe-area-inset-bottom, 0px) + 20px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Leave a review</h3>
                    <button onClick={closeLeaveSheet} aria-label="Close" style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8, fontWeight: 700 }}>Your rating</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setItemReviewForm(p => ({ ...p, rating: n, error: '' }))} aria-label={`${n} stars`} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                          <span style={{ fontSize: 28, color: n <= itemReviewForm.rating ? '#FACC15' : 'rgba(255,255,255,0.2)' }}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={itemReviewForm.comment}
                    onChange={(e) => setItemReviewForm(p => ({ ...p, comment: e.target.value, error: '' }))}
                    placeholder={`Tell others about the ${item.name}...`}
                    maxLength={280}
                    rows={3}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', resize: 'none' }}
                  />

                  <input
                    value={itemReviewForm.name}
                    onChange={(e) => setItemReviewForm(p => ({ ...p, name: e.target.value, error: '' }))}
                    placeholder="Your name (optional)"
                    maxLength={40}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
                  />

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6, fontWeight: 700 }}>
                      Order reference <span style={{ color: '#EF4444' }}>* required</span>
                    </div>
                    <input
                      value={itemReviewForm.orderRef}
                      onChange={(e) => setItemReviewForm(p => ({ ...p, orderRef: e.target.value.toUpperCase(), error: '' }))}
                      placeholder="e.g. DD-487193"
                      maxLength={12}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid ' + (itemReviewForm.error && !isVerifiedOrderRef(itemReviewForm.orderRef) ? '#EF4444' : 'rgba(255,255,255,0.1)'), background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums' }}
                    />
                    <div style={{ fontSize: 13, color: isVerifiedOrderRef(itemReviewForm.orderRef) ? '#22c55e' : 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: 600 }}>
                      {isVerifiedOrderRef(itemReviewForm.orderRef)
                        ? '✓ Verified — proceed to post your review'
                        : 'Only verified customers can leave a review. Enter the order ref from your purchase.'}
                    </div>
                  </div>

                  {/* Error message — surfaces validation failures from submit. */}
                  {itemReviewForm.error && (
                    <div role="alert" style={{ padding: '12px 14px', marginBottom: 12, borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: 13, fontWeight: 600, lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                      <span>{itemReviewForm.error}</span>
                    </div>
                  )}

                  <button onClick={submitItemReview} style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none',
                    background: '#FACC15', color: '#000',
                    fontSize: 15, fontWeight: 900, cursor: 'pointer',
                    minHeight: 48, fontFamily: 'inherit',
                    boxShadow: '0 6px 18px rgba(250,204,21,0.35)',
                  }}>Post Review</button>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ═══ CHECKOUT PAGE ═══ */}
      {checkoutOpen && (() => {
        const qtyBg = isCustomAccent ? accent : '#FACC15'
        const qtyColor = isCustomAccent ? '#fff' : '#000'
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', flexShrink: 0 }}>
              <button onClick={() => setCheckoutOpen(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{shopName}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t.checkout || 'Checkout'}</div>
              </div>
              {!orderDone && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{cart.reduce((s, c) => s + c.qty, 0)} items</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmt(totalPrice)}</div>
                </div>
              )}
            </div>

            {/* Scrollable content — but in orderDone state we lock the outer page (chat scrolls internally) */}
            <div style={{ flex: 1, overflowY: orderDone ? 'hidden' : 'auto', padding: orderDone ? 0 : '12px 14px 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {!orderDone ? (
                <>
                  {/* Cart items */}
                  {cart.map((c) => (
                    <div key={c.id} style={{ display: 'flex', gap: 12, padding: 12, marginBottom: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 16, position: 'relative', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)', ...(isCustomAccent ? { borderLeft: `3px solid ${accent}` } : {}) }}>
                      <button onClick={() => setCart(cart.filter(x => x.id !== c.id))} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>
                      <img src={c.photo || PLACEHOLDER_SM} alt="" onError={imgError('food')} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 20 }}>{c.name}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#FACC15', marginTop: 4 }}>{fmt(c.price * c.qty)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <button onClick={() => { if (c.qty > 1) setCart(cart.map(x => x.id === c.id ? { ...x, qty: x.qty - 1 } : x)) }} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: qtyBg, color: qtyColor, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: c.qty <= 1 ? 0.3 : 1 }}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', minWidth: 18, textAlign: 'center' }}>{c.qty}</span>
                          <button onClick={() => setCart(cart.map(x => x.id === c.id ? { ...x, qty: x.qty + 1 } : x))} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: qtyBg, color: qtyColor, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>{t.cartEmpty || 'Your cart is empty'}</p>
                  )}

                  {/* Summary — moved up to sit under cart items so customer sees the price total first */}
                  {cart.length > 0 && (
                    <div style={{ background: isCustomAccent ? `${accent}25` : 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 14, marginBottom: 8, border: isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.06)' }}>
                      {cart.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                          <span>{c.name} x{c.qty}</span>
                          <span>{fmt(c.price * c.qty)}</span>
                        </div>
                      ))}
                      {delEnabled ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6, paddingTop: 6 }}>
                          <span>Delivery ({deliveryZone.label})</span>
                          <span>{deliveryZone.fee > 0 ? fmt(deliveryZone.fee) : 'Free'}</span>
                        </div>
                      ) : (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isCustomAccent ? accent : '#F59E0B', background: isCustomAccent ? `${accent}25` : 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 6 }}>Collection Only</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{t.total || 'Total'}</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmt(totalPrice + (delEnabled ? (deliveryZone.fee || 0) : 0))}</span>
                      </div>
                    </div>
                  )}

                  {/* Payment method picker — the customer picks ONE before
                      submitting. Previously hardcoded to 'cod' which silently
                      ignored card selections. Methods shown depend on what
                      the vendor has set up. */}
                  {cart.length > 0 && (() => {
                    const cardConnected = SUPPORTED_GATEWAYS.some(g => paymentGateways[g.id]?.connected && LIVE_GATEWAY_IDS.has(g.id))
                    const methods = [
                      { id: 'cod',  icon: '💵', label: 'Cash on delivery',  desc: 'Pay when your order arrives.', show: true },
                      { id: 'qris', icon: '📲', label: 'QRIS / E-wallet',   desc: 'GoPay · OVO · DANA · ShopeePay. Scan after order.', show: !!shopQris },
                      { id: 'bank', icon: '🏦', label: 'Bank transfer',     desc: 'Vendor confirms transfer manually.', show: true },
                      { id: 'card', icon: '💳', label: 'Pay by card',       desc: 'Charged securely at checkout.', show: cardConnected },
                    ].filter(m => m.show)
                    return (
                      <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Pay with</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {methods.map(m => {
                            const isActive = payMethod === m.id
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setPayMethod(m.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '12px 14px', borderRadius: 12,
                                  border: isActive ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)',
                                  background: isActive ? `${accent}1f` : 'rgba(255,255,255,0.03)',
                                  cursor: 'pointer', textAlign: 'left', minHeight: 56, color: '#fff',
                                  transition: 'background 0.15s, border-color 0.15s',
                                }}
                              >
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: isActive ? accent : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: '#fff' }}>{m.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 800 }}>{m.label}</div>
                                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>
                                </div>
                                <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${isActive ? accent : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {isActive && <div style={{ width: 10, height: 10, borderRadius: 5, background: accent }} />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Your details — moved to bottom, the LAST thing customer fills before sending */}
                  {cart.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Your Details</div>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={custName}
                        onChange={e => setCustName(e.target.value)}
                        style={{ ...S.input, marginBottom: 8, fontSize: 13 }}
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp number (required)"
                        value={custPhone}
                        onChange={e => setCustPhone(e.target.value)}
                        style={{ ...S.input, marginBottom: delEnabled ? 8 : 0, fontSize: 13 }}
                      />
                      {delEnabled && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="text"
                            placeholder="Delivery address"
                            value={custAddress}
                            onChange={e => setCustAddress(e.target.value)}
                            style={{ ...S.input, marginBottom: 0, fontSize: 13, flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={detectAddress}
                            disabled={addressLoading}
                            title="Use my current location"
                            style={{
                              flexShrink: 0, padding: '0 12px', minHeight: 44, borderRadius: 10,
                              border: 'none', background: isCustomAccent ? accent : 'rgba(255,255,255,0.18)',
                              color: '#fff', fontSize: 13, fontWeight: 700, cursor: addressLoading ? 'wait' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                              opacity: addressLoading ? 0.6 : 1,
                            }}
                          >
                            <span style={{ fontSize: 14, lineHeight: 1 }}>📍</span>
                            <span>{addressLoading ? 'Locating…' : 'Set'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Order Confirmation — locked-height, only chat scrolls internally */
                <div style={{ padding: '12px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
                  {/* Merged status header — was 4 stacked blocks, now 1 row */}
                  <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 16, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${accent}55` }}>
                      <span style={{ fontSize: 16, color: '#fff', fontWeight: 900, lineHeight: 1 }}>✓</span>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                        <span>{t.orderSent || 'Order Sent'}</span>
                        <span style={{ color: '#FACC15', fontWeight: 900, fontSize: 14 }}>{fmt(totalPrice + (delEnabled ? (deliveryZone.fee || 0) : 0))}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                        {t.orderSentMsg || 'Vendor will reply shortly'}
                      </div>
                    </div>
                  </div>

                  {/* Inline customer chat panel */}
                  <CustomerChatPanel
                    conversation={chatConversation}
                    messages={chatMessages}
                    setMessages={setChatMessages}
                    draft={chatDraft}
                    setDraft={setChatDraft}
                    accent={accent}
                    fmt={fmt}
                    shopLogo={shopLogo}
                    shopName={shopName}
                  />

                  {/* QRIS Payment QR — landscape row: small QR on left, payment apps on right */}
                  {shopQris && (
                    <button
                      type="button"
                      onClick={() => setQrModalOpen(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, cursor: 'pointer',
                        textAlign: 'left', width: '100%',
                      }}
                    >
                      <div style={{ background: '#fff', borderRadius: 8, padding: 4, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                        <img src={shopQris} alt="QRIS" onError={imgError('qr')} style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 4, display: 'block' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Scan to Pay</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>GoPay · OVO · DANA · ShopeePay · Bank Transfer</div>
                        <div style={{ fontSize: 13, color: '#FACC15', fontWeight: 700, marginTop: 3 }}>Tap to enlarge ›</div>
                      </div>
                    </button>
                  )}

                  {/* Escrow hold panel — shown when this order is a Stripe
                      authorisation hold that has not yet been released. The
                      customer confirms receipt to release funds, or cancels
                      to void the hold (card is not charged). */}
                  {heldEscrowOrder && (
                    <div style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', border: '1px solid rgba(250,204,21,0.35)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 16, color: '#fff', fontWeight: 900, lineHeight: 1 }}>⏳</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Funds held in escrow</div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2, lineHeight: 1.4 }}>
                            {fmt(heldEscrowOrder.total)} authorised on your card. Released to the vendor when you confirm receipt{heldEscrowOrder.releaseAt ? ` (auto-releases ${new Date(heldEscrowOrder.releaseAt).toLocaleDateString()})` : ''}.
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          disabled={escrowActionBusy}
                          onClick={releaseEscrow}
                          style={{ flex: 1, padding: '11px 12px', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 800, cursor: escrowActionBusy ? 'wait' : 'pointer', minHeight: 44, opacity: escrowActionBusy ? 0.6 : 1 }}
                        >
                          {escrowActionBusy ? 'Working…' : 'Confirm received'}
                        </button>
                        <button
                          type="button"
                          disabled={escrowActionBusy}
                          onClick={cancelEscrow}
                          style={{ flex: 1, padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 700, cursor: escrowActionBusy ? 'wait' : 'pointer', minHeight: 44, opacity: escrowActionBusy ? 0.6 : 1 }}
                        >
                          Cancel order
                        </button>
                      </div>
                      {escrowMessage && (
                        <div style={{ fontSize: 13, color: '#FACC15', marginTop: 2, textAlign: 'center' }}>{escrowMessage}</div>
                      )}
                    </div>
                  )}
                  {!heldEscrowOrder && escrowMessage && (
                    <div style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 12, padding: 12, fontSize: 13, color: '#fff', textAlign: 'center' }}>
                      {escrowMessage}
                    </div>
                  )}

                  <button style={{ padding: '12px 30px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', alignSelf: 'center', minHeight: 44 }} onClick={() => { setCheckoutOpen(false); setCart([]); setOrderDone(false); setChatConversation(null); setChatMessages([]); setChatDraft(''); setEscrowMessage('') }}>
                    Back To Menu
                  </button>

                  {/* QR popup — large scannable view */}
                  {qrModalOpen && shopQris && (
                    <div onClick={() => setQrModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
                        <img src={shopQris} alt="QRIS" onError={imgError('qr')} style={{ width: 280, height: 280, maxWidth: '70vw', maxHeight: '70vw', objectFit: 'contain', display: 'block' }} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 16 }}>Scan to Pay</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>GoPay · OVO · DANA · ShopeePay · Bank Transfer</div>
                      <button onClick={() => setQrModalOpen(false)} style={{ marginTop: 20, padding: '10px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Close</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order channel picker — appears when the customer hits Send Order.
                Lets them choose in-app chat (real-time + gateway payments) or
                WhatsApp (vendor handles offline). Remembered preference can
                be cleared from a fresh device. */}
            {orderModePickerOpen && (
              <div onClick={() => setOrderModePickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0 }}>
                <div onClick={e => e.stopPropagation()} style={{ background: '#0f0f12', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, width: '100%', maxWidth: 480, color: '#fff', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -10px 40px rgba(0,0,0,0.6)' }}>
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 4 }} />
                  <div style={{ fontSize: 17, fontWeight: 800 }}>How would you like to send your order?</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: -8, marginBottom: 4 }}>
                    Both reach the same vendor.
                  </div>
                  <button
                    type="button"
                    onClick={submitViaChat}
                    disabled={chatSending}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', textAlign: 'left', cursor: chatSending ? 'wait' : 'pointer', minHeight: 64 }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${accent}25`, border: `1px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>💬</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>In-app chat</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.4 }}>Real-time replies · pay in-app · order tracking</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={submitViaWhatsApp}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#fff', textAlign: 'left', cursor: 'pointer', minHeight: 64 }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,211,102,0.18)', border: '1px solid rgba(37,211,102,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>📱</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>WhatsApp</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.4 }}>Opens WhatsApp with your order pre-filled · vendor confirms there</div>
                    </div>
                  </button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '6px 2px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={orderModeRemember} onChange={e => setOrderModeRemember(e.target.checked)} style={{ accentColor: accent }} />
                    <span>Always use this for {shopName}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setOrderModePickerOpen(false)}
                    style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Order button — fixed bottom */}
            {!orderDone && cart.length > 0 && (
              <div style={{ padding: '12px 14px 24px', flexShrink: 0 }}>
                <button
                  style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: accent, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={openOrderModePicker}
                  disabled={chatSending}
                >
                  {isCustomAccent && <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}><div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} /></div>}
                  <span style={{ position: 'relative', zIndex: 1 }}>{chatSending ? 'Sending…' : `Send Order — ${fmt(totalPrice + (delEnabled ? (deliveryZone.fee || 0) : 0))}`}</span>
                </button>
                {chatError && <div style={{ marginTop: 8, color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>{chatError}</div>}
              </div>
            )}
          </div>
        </div>
        )
      })()}


      {/* ═══ VENDOR ORDERS INBOX ═══ */}
      {isVendor && vendorTab === 'orders' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
          {/* Same bg + glass scrim as the main app — pulled from the saved
              theme bg so the Orders page sits inside the donut atmosphere. */}
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Orders</div>
            <button onClick={() => { setVendorTab('shop'); setVendorActiveConv(null) }} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 13, cursor: 'pointer', minHeight: 44, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>Close</button>
          </div>

          {!vendorActiveConv && (() => {
            // Mock conversations — shown when there are no real orders yet
            // AND the vendor is on donut theme. Gives a fresh shop a populated
            // preview so they can see what the inbox looks like in use.
            const now = Date.now()
            const MOCK_DONUT_CONVS = shopTheme === 'donut' && vendorConversations.length === 0 ? [
              { id: 'mock-1', customer_name: 'Maya P.',    customer_phone: '+62 812 3456 7890', last_message_at: new Date(now - 5*60*1000).toISOString(),       unread_vendor_count: 2, isMock: true, preview: 'Hi! Could I get 6 Glazed and 2 Boston Cream?' },
              { id: 'mock-2', customer_name: 'Jordan L.',  customer_phone: '+62 813 4567 8901', last_message_at: new Date(now - 32*60*1000).toISOString(),      unread_vendor_count: 0, isMock: true, preview: 'Thanks, picked up — these are amazing!' },
              { id: 'mock-3', customer_name: 'Ravi G.',    customer_phone: '+62 821 2345 6789', last_message_at: new Date(now - 2*60*60*1000).toISOString(),    unread_vendor_count: 1, isMock: true, preview: 'Is delivery available to Yogyakarta city centre?' },
              { id: 'mock-4', customer_name: 'Chloe B.',   customer_phone: '+62 815 6789 0123', last_message_at: new Date(now - 6*60*60*1000).toISOString(),    unread_vendor_count: 0, isMock: true, preview: '4 Sprinkle Donuts ordered · DD-487193' },
              { id: 'mock-5', customer_name: 'Ava M.',     customer_phone: '+62 819 1234 5678', last_message_at: new Date(now - 26*60*60*1000).toISOString(),   unread_vendor_count: 0, isMock: true, preview: 'Left a 5-star review · DD-301847' },
              { id: 'mock-6', customer_name: 'Marcus R.',  customer_phone: '+62 817 8901 2345', last_message_at: new Date(now - 2*24*60*60*1000).toISOString(), unread_vendor_count: 0, isMock: true, preview: 'Pickup confirmed for 3pm tomorrow' },
            ] : []
            const list = vendorConversations.length > 0 ? vendorConversations : MOCK_DONUT_CONVS
            const showingMocks = vendorConversations.length === 0 && MOCK_DONUT_CONVS.length > 0
            return (
              <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {showingMocks && (
                  <div style={{ margin: '4px 16px 10px', padding: '10px 12px', borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}55`, fontSize: 13, color: '#fff', lineHeight: 1.4, fontWeight: 500 }}>
                    👀 <span style={{ fontWeight: 800 }}>Sample orders</span> — real orders from customers will replace these here as soon as the first one arrives.
                  </div>
                )}
                {list.length === 0 && (
                  <div style={{ padding: 24, color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' }}>No orders yet. New orders will appear here with a chime + vibration.</div>
                )}
                {list.map((conv) => {
                  const isFlash = flashConvId === conv.id
                  const unread = conv.unread_vendor_count || 0
                  return (
                    <button
                      key={conv.id}
                      onClick={() => { if (!conv.isMock) openVendorConv(conv) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', border: 'none', background: isFlash ? 'rgba(250,204,21,0.18)' : 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: conv.isMock ? 'default' : 'pointer', textAlign: 'left', minHeight: 44, transition: 'background 200ms ease', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.18)' }}>
                        {(conv.customer_name || conv.customer_phone || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{conv.customer_name || conv.customer_phone}</span>
                          {conv.isMock && (
                            <span style={{ fontSize: 13, fontWeight: 700, color: accent, background: `${accent}22`, border: `1px solid ${accent}55`, padding: '1px 6px', borderRadius: 4, letterSpacing: 0.3 }}>SAMPLE</span>
                          )}
                        </div>
                        {conv.preview && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.preview}</div>}
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : ''}</div>
                      </div>
                      {unread > 0 && (
                        <span style={{ minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })()}

          {vendorActiveConv && (
            <VendorThreadView
              conversation={vendorActiveConv}
              messages={vendorThreadMessages}
              accent={accent}
              fmt={fmt}
              onBack={() => { setVendorActiveConv(null); setVendorActiveOrder(null); setVendorPayActionMsg('') }}
              draft={vendorReplyDraft}
              setDraft={setVendorReplyDraft}
              onSend={sendVendorReply}
              onStatus={sendVendorStatus}
              order={vendorActiveOrder}
              onReleaseEscrow={vendorReleaseEscrow}
              onCancelEscrow={vendorCancelEscrow}
              onRefund={vendorRefund}
              payActionBusy={vendorPayActionBusy}
              payActionMsg={vendorPayActionMsg}
            />
          )}
        </div>
      )}

      {/* ═══ SALES DASHBOARD ═══
          Aggregates orders from vendorConversations + their order_payload
          history. Shows today / week / month / all-time revenue, top
          sellers, and a recent activity feed. Vendor-only. */}
      {isVendor && salesDashboardOpen && (() => {
        // Pull every order_payload available across all conversations.
        const orders = []
        vendorConversations.forEach(conv => {
          const msgs = (conv.messages || []).filter(m => m.order_payload)
          msgs.forEach(m => orders.push({ ...m.order_payload, conv_id: conv.id, sender: conv.customer_name || conv.customer_phone || 'Customer' }))
        })
        // Donut-theme mock orders so a fresh vendor sees a populated dashboard.
        const useMocks = shopTheme === 'donut' && orders.length === 0
        const now = Date.now()
        const mockOrders = useMocks ? [
          { orderNumber: 'DD-487193', placedAt: new Date(now - 5*60*1000).toISOString(),       total: 84000,  items: [{ name: 'Glazed Donut', qty: 6, lineTotal: 60000 }, { name: 'Boston Cream', qty: 2, lineTotal: 24000 }], sender: 'Maya P.', isMock: true },
          { orderNumber: 'DD-301847', placedAt: new Date(now - 2*60*60*1000).toISOString(),    total: 36000,  items: [{ name: 'Sprinkle Donut', qty: 3, lineTotal: 36000 }], sender: 'Ravi G.', isMock: true },
          { orderNumber: 'DD-624518', placedAt: new Date(now - 6*60*60*1000).toISOString(),    total: 96000,  items: [{ name: 'Chocolate Frosted', qty: 4, lineTotal: 48000 }, { name: 'Glazed Donut', qty: 4, lineTotal: 40000 }, { name: 'Iced Coffee', qty: 1, lineTotal: 8000 }], sender: 'Chloe B.', isMock: true },
          { orderNumber: 'DD-958432', placedAt: new Date(now - 28*60*60*1000).toISOString(),   total: 60000,  items: [{ name: 'Strawberry Frosted', qty: 5, lineTotal: 50000 }, { name: 'Iced Coffee', qty: 1, lineTotal: 10000 }], sender: 'Jordan L.', isMock: true },
          { orderNumber: 'DD-117462', placedAt: new Date(now - 36*60*60*1000).toISOString(),   total: 120000, items: [{ name: 'Glazed Donut', qty: 12 }], sender: 'Marcus R.', isMock: true },
          { orderNumber: 'DD-840291', placedAt: new Date(now - 4*24*60*60*1000).toISOString(), total: 48000,  items: [{ name: 'Boston Cream', qty: 4, lineTotal: 48000 }], sender: 'Ava M.', isMock: true },
          { orderNumber: 'DD-553301', placedAt: new Date(now - 8*24*60*60*1000).toISOString(), total: 72000,  items: [{ name: 'Mochi Donut', qty: 6, lineTotal: 72000 }], sender: 'Lina K.', isMock: true },
          { orderNumber: 'DD-220947', placedAt: new Date(now - 22*24*60*60*1000).toISOString(),total: 144000, items: [{ name: 'Chocolate Frosted', qty: 6, lineTotal: 72000 }, { name: 'Glazed Donut', qty: 6, lineTotal: 60000 }], sender: 'Sara H.', isMock: true },
        ] : []
        const allOrders = orders.length > 0 ? orders : mockOrders
        const dayMs = 24*60*60*1000
        const todayStart = new Date(); todayStart.setHours(0,0,0,0)
        const weekStart  = new Date(now - 7*dayMs)
        const monthStart = new Date(now - 30*dayMs)
        const inRange = (o, since) => o.placedAt && new Date(o.placedAt) >= since
        const buckets = {
          today: allOrders.filter(o => inRange(o, todayStart)),
          week:  allOrders.filter(o => inRange(o, weekStart)),
          month: allOrders.filter(o => inRange(o, monthStart)),
          all:   allOrders,
        }
        const sum = arr => arr.reduce((s, o) => s + (Number(o.total) || 0), 0)
        const avg = arr => arr.length ? Math.round(sum(arr) / arr.length) : 0
        // Top sellers across all orders
        const itemTotals = {}
        allOrders.forEach(o => (o.items || []).forEach(it => {
          if (!it.name) return
          if (!itemTotals[it.name]) itemTotals[it.name] = { qty: 0, revenue: 0 }
          itemTotals[it.name].qty += Number(it.qty) || 0
          itemTotals[it.name].revenue += Number(it.lineTotal) || 0
        }))
        const topSellers = Object.entries(itemTotals)
          .sort((a, b) => b[1].qty - a[1].qty)
          .slice(0, 5)
        const recentSorted = [...allOrders].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)).slice(0, 8)

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
            <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setSalesDashboardOpen(false)} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Sales Dashboard</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{shopName}</div>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '14px 16px 24px' }}>
              {useMocks && (
                <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}55`, fontSize: 13, color: '#fff', lineHeight: 1.4, fontWeight: 500 }}>
                  👀 <span style={{ fontWeight: 800 }}>Sample data</span> — the numbers below come from sample orders so a fresh shop has something to look at. Real orders replace these as they arrive.
                </div>
              )}

              {/* Top stat tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[
                  { label: 'Today',       orders: buckets.today, accent: '#22C55E' },
                  { label: 'Last 7 days', orders: buckets.week,  accent: '#FACC15' },
                  { label: 'Last 30 days', orders: buckets.month, accent: accent },
                  { label: 'All time',    orders: buckets.all,   accent: '#A855F7' },
                ].map((b, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{b.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 6 }}>{fmt(sum(b.orders))}</div>
                    <div style={{ fontSize: 13, color: b.accent, fontWeight: 700, marginTop: 4 }}>{b.orders.length} order{b.orders.length === 1 ? '' : 's'}{b.orders.length > 0 ? ` · avg ${fmt(avg(b.orders))}` : ''}</div>
                  </div>
                ))}
              </div>

              {/* Top sellers */}
              <div style={{ marginTop: 6, padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Top sellers</div>
                {topSellers.length === 0 && (
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>No orders yet. Top items will appear here.</div>
                )}
                {topSellers.map(([name, stats], i) => {
                  const max = topSellers[0][1].qty || 1
                  const pct = Math.max(8, Math.round(stats.qty / max * 100))
                  return (
                    <div key={name} style={{ marginBottom: i === topSellers.length - 1 ? 0 : 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{i + 1}. {name}</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{stats.qty} sold · {fmt(stats.revenue)}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: accent, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Recent activity */}
              <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Recent orders</div>
                {recentSorted.length === 0 && (
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>No orders yet.</div>
                )}
                {recentSorted.map((o, i) => (
                  <div key={o.orderNumber || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: i === recentSorted.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{o.sender || 'Customer'}</span>
                        {o.isMock && <span style={{ fontSize: 13, fontWeight: 700, color: accent, background: `${accent}22`, border: `1px solid ${accent}55`, padding: '1px 6px', borderRadius: 4, letterSpacing: 0.3 }}>SAMPLE</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontFamily: 'monospace' }}>{o.orderNumber || '—'} · {o.placedAt ? new Date(o.placedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#FACC15', flexShrink: 0 }}>{fmt(o.total || 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══ VENDOR ORDER ALERTS / SETTINGS ═══ */}
      {isVendor && vendorTab === 'settings' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'linear-gradient(180deg, #1a1a1f 0%, #0c0c10 100%)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
          {/* Premium header — accent back button + title + subtitle, matches drawer pattern */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setVendorTab('shop')} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${accent}40` }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>Order Alerts</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontWeight: 500 }}>Sound · vibration · push notifications</div>
            </div>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Accent indicator — premium "you're here" mark */}
            <div style={{ width: 36, height: 3, borderRadius: 2, background: isCustomAccent ? accent : 'rgba(255,255,255,0.4)', marginBottom: 2 }} />

            {/* Sound + vibration */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${accent}25`, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🔔</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Sound &amp; Vibration</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Audio chime when inbox is open</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10, lineHeight: 1.55 }}>
                When the orders inbox is open and a new order arrives, the app plays a chime and vibrates. Tap below once to allow audio playback on this device.
              </div>
              <button onClick={() => { primeVendorChime(); playVendorChime(); try { navigator.vibrate && navigator.vibrate([200,100,200]) } catch {} }} style={{ padding: '11px 16px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44, boxShadow: `0 4px 12px ${accent}50` }}>
                Test chime &amp; vibration
              </button>
            </div>

            {/* Push notifications */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📱</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Push Notifications
                    {vendorPushEnabled && <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(34,197,94,0.2)', color: '#22c55e', padding: '2px 7px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)' }}>ON</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Alerts when app is closed</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10, lineHeight: 1.55 }}>
                Receive a system notification when a new order arrives even if the app is closed or the phone is asleep.
              </div>
              {!vendorPushEnabled ? (
                <button onClick={onEnableVendorPush} disabled={vendorPushBusy} style={{ padding: '11px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: vendorPushBusy ? 'wait' : 'pointer', minHeight: 44, boxShadow: '0 4px 12px rgba(34,197,94,0.4)', opacity: vendorPushBusy ? 0.7 : 1 }}>
                  {vendorPushBusy ? 'Enabling…' : 'Enable Order Alerts'}
                </button>
              ) : (
                <button onClick={onDisableVendorPush} disabled={vendorPushBusy} style={{ padding: '11px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: vendorPushBusy ? 'wait' : 'pointer', minHeight: 44, opacity: vendorPushBusy ? 0.7 : 1 }}>
                  {vendorPushBusy ? 'Disabling…' : 'Disable Order Alerts'}
                </button>
              )}
              {vendorPushMsg && <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.75)', borderLeft: `3px solid ${accent}` }}>{vendorPushMsg}</div>}
            </div>

            {/* Show WhatsApp toggle */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(37,211,102,0.18)', border: '1px solid rgba(37,211,102,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>💬</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>WhatsApp on Visit Us</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Public contact channel</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12, lineHeight: 1.55 }}>
                Off by default. When ON, your WhatsApp link appears on the public Visit Us page so customers can message you directly.
              </div>
              {/* Custom toggle pill matching app pattern */}
              <button type="button" onClick={() => setShowVisitUsWA(!showVisitUsWA)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 14px', borderRadius: 12, minHeight: 44,
                background: showVisitUsWA ? `${accent}20` : 'rgba(255,255,255,0.04)',
                border: showVisitUsWA ? `1px solid ${accent}55` : '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 150ms ease',
              }}>
                <span>Show WhatsApp link</span>
                <span style={{
                  width: 38, height: 22, borderRadius: 11, padding: 2,
                  background: showVisitUsWA ? accent : 'rgba(255,255,255,0.18)',
                  position: 'relative', transition: 'background 150ms ease',
                  display: 'inline-block',
                }}>
                  <span style={{
                    display: 'block', width: 18, height: 18, borderRadius: 9, background: '#fff',
                    transform: showVisitUsWA ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'transform 150ms ease',
                  }} />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PAYMENT METHODS — vendor connects their own gateways ═══ */}
      {isVendor && paymentMethodsOpen && (() => {
        const connectedCount = SUPPORTED_GATEWAYS.filter(g => paymentGateways[g.id]?.connected).length
        const liveOnes = SUPPORTED_GATEWAYS.filter(g => paymentGateways[g.id]?.connected)
        const availableOnes = SUPPORTED_GATEWAYS.filter(g => !paymentGateways[g.id]?.connected)
        // Clean fintech list row — no card chrome, just dotted divider between rows.
        // Brand color is preserved only on the small logo chip. App background bleeds through.
        const renderCard = (g, isLive, isLast) => (
          <button key={g.id} type="button" onClick={() => !g.comingSoon && setSetupGatewayId(g.id)} disabled={g.comingSoon}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
              padding: '14px 4px', border: 'none', background: 'transparent', cursor: g.comingSoon ? 'not-allowed' : 'pointer',
              borderBottom: isLast ? 'none' : '1px dashed rgba(255,255,255,0.10)',
              opacity: g.comingSoon ? 0.45 : 1,
              transition: 'background 120ms ease',
            }}
          >
            {/* Logo chip — keeps brand color identity */}
            <div style={{ width: 38, height: 38, borderRadius: 10, background: g.color, color: '#fff', fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 6px ${g.color}40`, overflow: 'hidden' }}>
              {g.logoUrl
                ? <img src={g.logoUrl} alt={g.name} onError={(e) => { e.currentTarget.parentElement.textContent = g.name.charAt(0) }} style={{ width: 24, height: 24, objectFit: 'contain', filter: 'brightness(1.1)' }} />
                : g.name.charAt(0)
              }
            </div>

            {/* Middle column — name + tagline + country count */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.1 }}>{g.name}</span>
                {isLive && <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(34,197,94,0.18)', color: '#86efac', padding: '1px 6px', borderRadius: 6, letterSpacing: 0.3 }}>LIVE</span>}
                {g.tier === 'enterprise' && <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(168,85,247,0.16)', color: '#D8B4FE', padding: '1px 6px', borderRadius: 6, letterSpacing: 0.3 }}>ENTERPRISE</span>}
                {g.comingSoon && <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(245,158,11,0.18)', color: '#FCD34D', padding: '1px 6px', borderRadius: 6, letterSpacing: 0.3 }}>SOON</span>}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginBottom: 2 }}>{g.tagline}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{g.countryCount}</div>
            </div>

            {/* Right arrow — high-end "tap to enter" affordance */}
            <div style={{ flexShrink: 0, color: g.comingSoon ? 'rgba(255,255,255,0.2)' : (isLive ? '#22c55e' : 'rgba(255,255,255,0.5)'), fontSize: 20, fontWeight: 300, lineHeight: 1, paddingRight: 4 }}>
              {g.comingSoon ? '·' : '›'}
            </div>
          </button>
        )
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* App theme background + glass overlay (matches the rest of the app) */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', zIndex: 0 }} />
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          {/* Scrollable foreground content */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', maxWidth: 480, width: '100%', margin: '0 auto' }}>
          {/* Header — transparent, no dark container */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
            <button onClick={() => setPaymentMethodsOpen(false)} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${accent}40` }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.2, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Payment Methods</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 1, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{connectedCount} of {SUPPORTED_GATEWAYS.filter(g => !g.comingSoon).length} active · funds go to your accounts</div>
            </div>
          </div>

          {/* Trust banner */}
          <div style={{ margin: '12px 16px 0', padding: '12px 14px', borderRadius: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🔒</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>Your money goes directly to you</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>StreetLocal never holds or processes your funds. Each gateway sends payouts straight to your own account. We're just the checkout UI.</div>
            </div>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: isCustomAccent ? accent : 'rgba(255,255,255,0.4)', marginBottom: 14, marginTop: 4 }} />

            {liveOnes.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(34,197,94,0.85)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                  Live · Accepting Payments
                </div>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, padding: '4px 14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 18 }}>
                  {liveOnes.map((g, i) => renderCard(g, true, i === liveOnes.length - 1))}
                </div>
              </>
            )}

            <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Available</div>
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, padding: '4px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {availableOnes.map((g, i) => renderCard(g, false, i === availableOnes.length - 1))}
            </div>

            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>How payments work</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
                1. Sign up directly with the gateway (Stripe, Midtrans, etc.)<br />
                2. Paste your keys / account ID here<br />
                3. Customers checkout in your app and pay via the gateway<br />
                4. Funds go straight into your own gateway account<br />
                5. You manage refunds, disputes, and payouts from the gateway's dashboard
              </div>
            </div>
          </div>
          </div>{/* close scrollable foreground */}
        </div>
        )
      })()}

      {/* ═══ GATEWAY SETUP — full page (matches Order Alerts chrome) ═══ */}
      {isVendor && setupGatewayId && (() => {
        const gw = SUPPORTED_GATEWAYS.find(g => g.id === setupGatewayId)
        if (!gw) return null
        const current = paymentGateways[gw.id] || {}
        const updateField = (key, value) => setPaymentGateways(p => ({ ...p, [gw.id]: { ...(p[gw.id] || {}), [key]: value } }))
        const isConnected = !!current.connected
        const save = async () => {
          const missing = gw.fields.filter(f => f.required && !(current[f.key] || '').toString().trim())
          if (missing.length) { alert('Required: ' + missing.map(m => m.label).join(', ')); return }
          // Build a config object containing only the fields the gateway needs
          const config = { mode: current.mode || 'test' }
          gw.fields.forEach(f => { if (current[f.key]) config[f.key] = current[f.key] })
          // Persist to Supabase so Edge Functions can use the keys
          await saveGatewayConnection(gw.id, config)
          setPaymentGateways(p => ({ ...p, [gw.id]: { ...(p[gw.id] || {}), connected: true, mode: config.mode, connectedAt: new Date().toISOString() } }))
          setSetupGatewayId(null)
        }
        const disconnect = async () => {
          if (!confirm(`Disconnect ${gw.name}? Your keys will be removed and payments via this gateway will stop working.`)) return
          await removeGatewayConnection(gw.id)
          setPaymentGateways(p => { const next = { ...p }; delete next[gw.id]; return next })
          setSetupGatewayId(null)
        }
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 700, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* App theme background — clear, no blur overlay on setup page */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', zIndex: 0 }} />
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', maxWidth: 480, width: '100%', margin: '0 auto' }}>
          {/* Header — transparent, no shade */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
            <button onClick={() => setSetupGatewayId(null)} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${accent}40` }}>←</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.2, textShadow: '0 1px 4px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {gw.name}
                {isConnected && <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(34,197,94,0.22)', color: '#22c55e', padding: '2px 7px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.4)' }}>CONNECTED</span>}
                {gw.tier === 'enterprise' && <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(168,85,247,0.18)', color: '#C084FC', padding: '2px 7px', borderRadius: 8, border: '1px solid rgba(168,85,247,0.35)' }}>ENTERPRISE</span>}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 1, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{gw.countryCount} active</div>
            </div>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: gw.color, marginBottom: 2 }} />

            {/* Brand hero card */}
            <div style={{ background: `linear-gradient(135deg, ${gw.color}28 0%, rgba(0,0,0,0.4) 100%)`, border: `1px solid ${gw.color}40`, borderRadius: 16, padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: `0 4px 18px ${gw.color}30` }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: gw.color, color: '#fff', fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${gw.color}55`, overflow: 'hidden' }}>
                {gw.logoUrl
                  ? <img src={gw.logoUrl} alt={gw.name} onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: 32, height: 32, objectFit: 'contain', filter: 'brightness(1.1)' }} />
                  : gw.name.charAt(0)
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{gw.tagline}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Best for: {gw.bestFor}</div>
              </div>
            </div>

            {/* Country availability — count only, no flags */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>🌍</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>Coverage</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{gw.countryCount} active</div>
              </div>
            </div>

            {/* Setup steps */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>How to set up</div>
              {gw.setupSteps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 10, background: `${gw.color}30`, border: `1px solid ${gw.color}60`, color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, lineHeight: 1.55 }}>{s}</span>
                </div>
              ))}
              {gw.docUrl && (
                <a href={gw.docUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '8px 12px', borderRadius: 10, background: `${gw.color}25`, border: `1px solid ${gw.color}45`, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Open {gw.name} dashboard ↗
                </a>
              )}
            </div>

            {/* Test/Live mode + Fields */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Your credentials</div>

              {/* Test/Live mode pill */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, padding: 3, borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {['test', 'live'].map(m => (
                  <button key={m} onClick={() => updateField('mode', m)} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                    background: (current.mode || 'test') === m ? (m === 'live' ? '#22C55E' : 'rgba(255,255,255,0.15)') : 'transparent',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{m === 'test' ? '🧪 Test' : '🚀 Live'}</button>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12, lineHeight: 1.5 }}>
                {(current.mode || 'test') === 'test'
                  ? 'Test mode uses fake transactions. Use it to verify the setup before going live.'
                  : '⚠️ Live mode processes real customer payments. Make sure your business is fully verified with the gateway.'}
              </div>

              {/* Form fields */}
              {gw.fields.map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 5 }}>
                    {f.label} {f.required && <span style={{ color: '#EF4444' }}>*</span>}
                    {f.secret && <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>🔒 encrypted</span>}
                  </label>
                  {f.type === 'bank-picker' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 4 }}>
                      {ID_BANKS.map(b => {
                        const picked = current.bankName === b.name
                        return (
                          <button key={b.code} type="button" onClick={() => updateField('bankName', b.name)} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 10, minHeight: 44,
                            background: picked ? `${accent}25` : 'rgba(255,255,255,0.04)',
                            border: picked ? `1px solid ${accent}60` : '1px solid rgba(255,255,255,0.08)',
                            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                          }}>
                            {b.logo
                              ? <img src={b.logo} alt={b.name} onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: 24, height: 16, objectFit: 'contain', flexShrink: 0, background: '#fff', borderRadius: 3, padding: 2 }} />
                              : <span style={{ width: 24, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>🏦</span>
                            }
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <input
                      type={f.type === 'password' ? 'password' : (f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : f.type === 'number' ? 'number' : 'text')}
                      placeholder={f.placeholder || ''}
                      value={current[f.key] || ''}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)',
                        color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                        fontFamily: f.secret ? 'monospace' : 'inherit',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingBottom: 24 }}>
              {isConnected && (
                <button onClick={disconnect} style={{
                  padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 48,
                }}>Disconnect</button>
              )}
              <button onClick={save} style={{
                flex: 1, padding: '13px 16px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${gw.color} 0%, ${gw.color}dd 100%)`,
                color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 48,
                boxShadow: `0 4px 14px ${gw.color}55`,
              }}>
                {isConnected ? `Update ${gw.name}` : `Connect ${gw.name}`}
              </button>
            </div>
          </div>
          </div>{/* close scrollable foreground */}
        </div>
        )
      })()}

      {/* ═══ SHARED COLOUR PALETTE DRAWER ═══
          Opens from any "Open palette" button. The opener supplies the
          target config (value + onChange + label + optional onInherit).
          Same palette across Landing Page Edit, Menu Cards, buttons — one
          source of truth for colours. */}
      {colorPickerTarget && (() => {
        const PALETTE = {
          Pinks:    ['#FFC0CB','#FFB6C1','#FF69B4','#FF1493','#F472B6','#EC4899','#DB2777','#BE185D','#9D174D'],
          Reds:     ['#FECACA','#FCA5A5','#F87171','#EF4444','#DC2626','#B91C1C','#8B0000'],
          Oranges:  ['#FED7AA','#FDBA74','#FB923C','#F97316','#EA580C','#C2410C'],
          Yellows:  ['#FEF08A','#FDE047','#FACC15','#EAB308','#CA8A04'],
          Greens:   ['#BBF7D0','#86EFAC','#4ADE80','#22C55E','#16A34A','#15803D'],
          Cyans:    ['#A5F3FC','#67E8F9','#22D3EE','#06B6D4','#0891B2'],
          Blues:    ['#BFDBFE','#93C5FD','#60A5FA','#3B82F6','#2563EB','#1D4ED8'],
          Purples:  ['#DDD6FE','#C4B5FD','#A855F7','#9333EA','#7E22CE'],
          Neutrals: ['#FFFFFF','#F5F5F5','#D4D4D8','#71717A','#404040','#1A1A1A','#000000'],
        }
        const close = () => setColorPickerTarget(null)
        const pick = (c) => { colorPickerTarget.onChange(c); close() }
        return (
          <>
            <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 700 }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '80vw', maxWidth: 360, background: '#0a0a0a', borderLeft: `1px solid ${accent}33`, zIndex: 701, overflowY: 'auto', boxShadow: '-12px 0 40px rgba(0,0,0,0.6)' }}>
              {/* Header */}
              <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{colorPickerTarget.label || 'Pick a colour'}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Current: <span style={{ fontFamily: 'monospace' }}>{colorPickerTarget.value || '(inherits theme)'}</span></div>
                </div>
                <button onClick={close} aria-label="Close" style={{ width: 32, height: 32, borderRadius: 16, background: '#8B0000', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>✕</button>
              </div>

              {/* Current swatch + hex input */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: colorPickerTarget.value || donutLanding.pink, border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                <input
                  key={colorPickerTarget.value || ''}
                  defaultValue={colorPickerTarget.value || ''}
                  placeholder="#F472B6"
                  maxLength={7}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, fontFamily: 'monospace', outline: 'none' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = e.currentTarget.value.trim()
                      if (/^#[0-9A-Fa-f]{6}$/.test(v)) pick(v)
                    }
                  }}
                />
                <button onClick={(e) => { const inp = e.currentTarget.previousSibling; const v = inp.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) pick(v) }} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Set</button>
              </div>

              {/* Inherit theme button — for overrides that can fall back */}
              {colorPickerTarget.allowInherit && colorPickerTarget.onInherit && (
                <div style={{ padding: '0 16px 12px' }}>
                  <button onClick={() => { colorPickerTarget.onInherit(); close() }} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${accent}55`, background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>↺ Inherit theme colour</span>
                    <span style={{ width: 20, height: 20, borderRadius: 10, background: donutLanding.pink, border: '2px solid rgba(255,255,255,0.2)' }} />
                  </button>
                </div>
              )}

              {/* Grouped swatches */}
              <div style={{ padding: '8px 16px 24px' }}>
                {Object.entries(PALETTE).map(([group, colors]) => (
                  <div key={group} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{group}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {colors.map(c => {
                        const isPicked = colorPickerTarget.value && colorPickerTarget.value.toUpperCase() === c.toUpperCase()
                        return (
                          <button key={c} onClick={() => pick(c)} aria-label={c} title={c} style={{ width: 38, height: 38, borderRadius: 10, border: isPicked ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0, boxShadow: isPicked ? '0 0 0 2px rgba(255,255,255,0.25)' : 'none' }} />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      })()}

      {/* ═══ VENDOR SIDE DRAWER ═══ */}
      {vendorDrawer && (
        <>
          {/* Page dim + soft blur behind the drawer. Slightly stronger scrim
              than before (0.5 → 0.65) plus a 4px backdrop-blur so the menu
              below feels properly "in the background" while the drawer is open. */}
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 500 }} onClick={() => setVendorDrawer(false)} />
          {/* Donut theme: dark drawer with a subtle pink wash at the top so
              it's clearly the donut shop's chrome without a busy photo behind
              the content. Standard themes keep solid black. */}
          <div style={shopTheme === 'donut'
            ? { position: 'fixed', top: 0, right: 0, bottom: 0, width: '75vw', maxWidth: 320, zIndex: 501, overflowY: 'auto', overflowX: 'hidden', borderLeft: `1px solid ${accent}33`, background: `linear-gradient(180deg, ${accent}22 0%, #0a0a0a 30%, #0a0a0a 100%)` }
            : { position: 'fixed', top: 0, right: 0, bottom: 0, width: '75vw', maxWidth: 320, background: '#000', zIndex: 501, overflowY: 'auto', overflowX: 'hidden', borderLeft: '1px solid rgba(255,255,255,0.08)' }
          }>
            {/* Donut: running pink light along the drawer's left edge — same
                pattern as the customer-side menu drawer. */}
            {shopTheme === 'donut' && (
              <>
                <style>{`@keyframes vendorDrawerRun { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }`}</style>
                <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '60%', background: `linear-gradient(180deg, transparent 0%, ${accent} 40%, ${accent} 60%, transparent 100%)`, filter: `drop-shadow(0 0 6px ${accent}CC)`, animation: 'vendorDrawerRun 2.4s linear infinite' }} />
                </div>
              </>
            )}
            {/* Header with logo */}
            <div style={{ padding: '20px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Honour shopLogoStyle everywhere — 'off' renders nothing,
                    'bare' renders the bare image (no circle, no tile),
                    'circle' renders the colour-tinted circle with image inside. */}
                {shopLogoStyle === 'off' ? null : shopLogo ? (
                  shopLogoStyle === 'bare' ? (
                    <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }}>
                      <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
                    </div>
                  )
                ) : (
                  shopLogoStyle === 'bare' ? null : (
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{shopName.charAt(0).toUpperCase()}</div>
                  )
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{shopName}</div>
                  <div style={{ fontSize: 13, color: accent, fontWeight: 600, marginTop: 1 }}>{shopFoodType}</div>
                </div>
                <button onClick={() => setVendorDrawer(false)} style={{ width: 32, height: 32, borderRadius: 16, background: '#8B0000', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(139,0,0,0.45)' }}>✕</button>
              </div>
            </div>

            {/* Shop status toggle */}
            <div style={{ margin: '0 16px 12px', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: shopOpen ? '#22c55e' : '#EF4444' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: shopOpen ? '#22c55e' : '#EF4444' }}>{shopOpen ? 'Shop Open' : 'Shop Closed'}</span>
                </div>
                <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{shopOpen ? 'Accepting orders' : 'Orders paused'}</span>
              </div>
              <button style={{ ...S.toggle(shopOpen), background: shopOpen ? accent : 'rgba(255,255,255,0.15)' }} onClick={() => setShopOpen(!shopOpen)}>
                <div style={S.toggleDot(shopOpen)} />
              </button>
            </div>

            {/* Landing Page toggle — when off, customers skip the splash and
                go straight to the menu/home. Vendor-controlled. */}
            <div style={{ margin: '0 16px 12px', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: landingEnabled ? '#22c55e' : 'rgba(255,255,255,0.3)' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: landingEnabled ? '#fff' : 'rgba(255,255,255,0.6)' }}>{landingEnabled ? 'Landing Page On' : 'Landing Page Off'}</span>
                </div>
                <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{landingEnabled ? 'Customers see the splash first' : 'Customers go straight to the menu'}</span>
              </div>
              <button style={{ ...S.toggle(landingEnabled), background: landingEnabled ? accent : 'rgba(255,255,255,0.15)' }} onClick={() => setLandingEnabled(!landingEnabled)}>
                <div style={S.toggleDot(landingEnabled)} />
              </button>
            </div>

            {/* Preview link — yellow pill button. Generous padding around it
                so finger-tap doesn't catch the buttons above/below. */}
            <div style={{ padding: '16px 16px 20px', textAlign: 'center' }}>
              <button onClick={() => { setPreviewMode(true); setIsVendor(false); setShowLanding(true); setVendorDrawer(false) }} style={{ background: '#FACC15', border: 'none', color: '#1a1a1a', fontSize: 14, fontWeight: 800, cursor: 'pointer', padding: '14px 24px', borderRadius: 22, lineHeight: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.35)', minHeight: 44 }}>
                Preview as Customer
              </button>
            </div>

            {/* ═══ GROUPED DRAWER SECTIONS ═══
                BRAND / MENU / ORDERS / ACCOUNT / ADVANCED. Section headers
                use small-caps + a coloured left bar to break the list into
                scannable buckets. Landing Page Edit is promoted to top-level
                in BRAND (was previously buried inside Design Studio). */}
            {(() => {
              const sectionHeader = (label) => (
                <div key={`sh-${label}`} style={{ margin: '14px 16px 6px', padding: '6px 0 6px 10px', borderLeft: `3px solid ${accent}`, fontSize: 13, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.18em' }}>{label}</div>
              )
              const drawerBtn = (item) => (
                <button key={item.label} onClick={() => { primeVendorChime(); item.onClick && item.onClick(); setVendorDrawer(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '12px 14px', borderRadius: 14,
                  border: `1.5px solid ${item.danger ? '#8B0000' : '#DC2626'}`,
                  background: item.danger ? 'rgba(139,0,0,0.18)' : 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  cursor: 'pointer', textAlign: 'left', minHeight: 44, marginBottom: 8,
                }}>
                  {/* Coloured tile + white icon silhouette (filter inverts the
                      emoji to pure white). Clean, uniform look across all
                      buttons regardless of which emoji is used. */}
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: item.danger ? '#8B0000' : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, lineHeight: 1 }}>
                    <span style={{ filter: 'brightness(0) invert(1)' }}>{item.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{item.desc}</div>
                  </div>
                  {item.badge ? (
                    <span style={{ minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.badge}</span>
                  ) : null}
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
                </button>
              )
              const orderBadge = vendorConversations.reduce((s, c) => s + (c.unread_vendor_count || 0), 0)
              const isDonut = shopTheme === 'donut'

              const orders = [
                { icon: '🔔', label: 'Orders', desc: 'In-app chat orders inbox', onClick: () => setVendorTab('orders'), badge: orderBadge },
                { icon: '📊', label: 'Sales Dashboard', desc: 'Revenue, top items, daily / weekly view', onClick: () => setSalesDashboardOpen(true) },
                { icon: '🛡️', label: 'Order Alerts', desc: 'Sound, vibration, push setup', onClick: () => setVendorTab('settings') },
                { icon: '🛵', label: 'Delivery', desc: 'Rates, distance, collection', onClick: () => setShowDeliverySettings(true) },
                { icon: '💳', label: 'Payment Methods', desc: 'Connect Stripe, Midtrans, PayPal, bank', onClick: () => setPaymentMethodsOpen(true) },
              ]

              // Brand = content-level customisation (text, images, donut-specific
              // card visuals). Design = app-wide visual system (themes, studio).
              const brand = [
                { icon: '🎨', label: 'Landing Page Edit', desc: 'Text, images, colours, font', onClick: () => setHeroEditor(true) },
                isDonut && { icon: '🍩', label: 'Menu Cards', desc: 'Card colour, glass, frame, promo bar', onClick: () => setMenuCardsPage(true) },
              ].filter(Boolean)

              const design = [
                { icon: '🖼️', label: 'Themes', desc: 'Browse & apply app themes', onClick: () => setThemeBrowser(true) },
                { icon: '✨', label: 'Design Studio', desc: 'Logo, layout, effects, splash', onClick: () => setDesignStudio(true) },
              ]

              const menu = [
                isDonut && { icon: '🍩', label: 'Donut Types', desc: 'Image + story for each donut — shows live', onClick: () => setDonutTypesPage(true) },
                isDonut && { icon: '🍩', label: 'Meet the Donuts', desc: 'Open the customer swipe gallery', onClick: () => { setDonutTypesIdx(0); setDonutTypesGallery(true) } },
              ].filter(Boolean)

              const account = [
                { icon: '⚙️', label: 'My Shop', desc: 'Name, phone, hours, socials', onClick: () => setShopConfig(true) },
                { icon: '🌐', label: 'Custom Domain', desc: 'Custom domain for your app', onClick: () => setDomainPage(true) },
                { icon: '📋', label: 'Terms of Listing', desc: 'Search listing requirements', onClick: () => setTermsOfListing(true) },
                { icon: '📍', label: 'Visit Us', desc: 'Address, map, opening hours', onClick: () => setShowLocation(true) },
              ]

              const advanced = isDonut ? [
                { icon: '↺', label: 'Reset Theme', desc: 'Restore the original donut design', danger: true, onClick: () => {
                  if (!window.confirm('Reset all donut theme customisations back to the original Theme #6 design? This wipes your card style, colours, button settings, hero image, and landing page edits.')) return
                  const keys = [
                    'foodlocalchat_donut_card_style', 'foodlocalchat_donut_card_color', 'foodlocalchat_donut_card_image',
                    'foodlocalchat_donut_frame_color', 'foodlocalchat_donut_promo_color',
                    'foodlocalchat_donut_addbtn_shape', 'foodlocalchat_donut_addbtn_color', 'foodlocalchat_donut_addbtn_text_color', 'foodlocalchat_donut_addbtn_text',
                    'foodlocalchat_donut_hero', 'foodlocalchat_donut_landing',
                  ]
                  keys.forEach(k => { try { localStorage.removeItem(k) } catch {} })
                  setDonutCardStyle('solid'); setDonutCardColor('#1a1a1a'); setDonutCardImage('')
                  setDonutFrameColor(''); setDonutPromoColor('')
                  setDonutAddBtnShape('circle'); setDonutAddBtnColor(''); setDonutAddBtnTextColor('#ffffff'); setDonutAddBtnText('Add to Cart')
                  resetDonutLanding()
                }}
              ] : []

              return (
                <div style={{ paddingBottom: 20 }}>
                  {sectionHeader('Orders')}
                  <div style={{ padding: '0 16px' }}>{orders.map(drawerBtn)}</div>
                  {sectionHeader('Brand')}
                  <div style={{ padding: '0 16px' }}>{brand.map(drawerBtn)}</div>
                  {sectionHeader('Design')}
                  <div style={{ padding: '0 16px' }}>{design.map(drawerBtn)}</div>
                  {menu.length > 0 && (<>
                    {sectionHeader('Menu')}
                    <div style={{ padding: '0 16px' }}>{menu.map(drawerBtn)}</div>
                  </>)}
                  {sectionHeader('Account')}
                  <div style={{ padding: '0 16px' }}>{account.map(drawerBtn)}</div>
                  {advanced.length > 0 && (<>
                    {sectionHeader('Advanced')}
                    <div style={{ padding: '0 16px' }}>{advanced.map(drawerBtn)}</div>
                  </>)}
                </div>
              )
            })()}

            {/* HIDDEN — Theme Backgrounds (kept for reference, moved to Design Studio) */}
            {false && (() => {
              const langCountries = LANG_TO_COUNTRIES[nativeLang] || []
              const { byFoodType, byCountry, rest } = getFilteredThemes(countryCode, shopFoodType, langCountries)

              const renderThemeCard = (theme) => (
                <div key={theme.id} style={{ flexShrink: 0, width: 160, position: 'relative' }}>
                  <button onClick={() => {
                    setShopTheme(theme.id)
                    setShopAccentColor(theme.accent || '#8DC63F')
                    setBtnColor('') // reset button override so it follows the new accent
                    localStorage.setItem('foodlocalchat_theme', theme.id)
                    localStorage.setItem('foodlocalchat_themeBg', theme.img)
                    localStorage.setItem('foodlocalchat_accentColor', theme.accent || '#8DC63F')
                    const bgImg = document.getElementById('app-bg-img')
                    if (bgImg) bgImg.src = theme.img
                    setVendorDrawer(false)
                    setShowLanding(true)
                  }} style={{ border: shopTheme === theme.id ? '3px solid #FFD600' : '3px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', padding: 0, background: 'none', width: '100%' }}>
                    <div style={{ width: '100%', height: 240, position: 'relative' }}>
                      <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: shopTheme === theme.id ? '#FFD600' : '#888', padding: '6px 0', textAlign: 'center', background: shopTheme === theme.id ? 'rgba(255,214,0,0.1)' : '#111' }}>
                      {shopTheme === theme.id ? '✓ ' : ''}{theme.label}
                    </div>
                  </button>
                  <div onClick={(e) => { e.stopPropagation(); setThemeEditor({ url: theme.img }); setEditorColor(theme.accent || '#8DC63F'); setEditorBaseColor(theme.accent || '#8DC63F'); setShopTheme(theme.id); setShopAccentColor(theme.accent || '#8DC63F'); setBtnColor(''); localStorage.setItem('foodlocalchat_theme', theme.id); localStorage.setItem('foodlocalchat_themeBg', theme.img); localStorage.setItem('foodlocalchat_accentColor', theme.accent || '#8DC63F'); const bgImg = document.getElementById('app-bg-img'); if (bgImg) bgImg.src = theme.img; setVendorDrawer(false) }} style={{ position: 'absolute', top: -6, right: -6, width: 30, height: 30, borderRadius: 15, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#1a1a1a', lineHeight: 1 }}>DEV</span>
                  </div>
                </div>
              )

              return (
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 4 }}>App Theme</h3>

                  {/* Section 1: Recommended for your food type */}
                  {byFoodType.length > 0 && (
                    <>
                      <p style={{ fontSize: 14, color: accent, fontWeight: 700, marginBottom: 8, marginTop: 12 }}>Recommended for {shopFoodType}</p>
                      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                        {byFoodType.map(renderThemeCard)}
                      </div>
                    </>
                  )}

                  {/* Section 2: Popular in your region */}
                  {byCountry.length > 0 && (
                    <>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 8, marginTop: 8 }}>Popular in your region</p>
                      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                        {byCountry.filter(t => !byFoodType.some(f => f.id === t.id)).map(renderThemeCard)}
                      </div>
                    </>
                  )}

                  {/* Section 3: More themes */}
                  {rest.length > 0 && (
                    <>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 8, marginTop: 8 }}>More themes</p>
                      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                        {rest.map(renderThemeCard)}
                      </div>
                    </>
                  )}

                  {/* Custom upload */}
                  <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 60% { transform: translateX(-2px); } 80% { transform: translateX(2px); } }`}</style>
                  <label style={{ display: 'block', marginTop: 10, padding: '14px', borderRadius: 14, border: 'none', background: '#FFD600', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#1a1a1a', animation: 'shake 3s ease-in-out infinite' }}>
                    Upload your own background
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      const url = await uploadMenuImage(vendorId, file)
                      if (url) {
                        setEditorColor(shopAccentColor)
                        setEditorPos({ x: 50, y: 50 })
                        setThemeEditor({ url })
                        setVendorDrawer(false)
                      }
                    }} />
                  </label>

                  {/* Custom services */}
                  <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: `${accent}10`, border: `1px solid ${accent}25` }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: accent, marginBottom: 12 }}>Professional Services</h4>

                    {/* Custom Theme */}
                    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.3)', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Custom Theme</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>Rp 100.000</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 8 }}>Exclusive background designed for your brand. Not shared with others. Unlimited revisions.</div>
                      <a href={`https://wa.me/6281392000050?text=${encodeURIComponent(`Hi! I'd like a custom theme.\n\nShop: ${shopName}\nFood Type: ${shopFoodType}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Order Theme — WhatsApp</a>
                    </div>

                    {/* Custom Logo */}
                    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Custom Logo</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>Rp 50.000</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 8 }}>Professional logo designed for your food business. Includes round format optimized for your app.</div>
                      <a href={`https://wa.me/6281392000050?text=${encodeURIComponent(`Hi! I'd like a custom logo.\n\nShop: ${shopName}\nFood Type: ${shopFoodType}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Order Logo — WhatsApp</a>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Logout */}
            <div style={{ padding: '16px' }}>
              <button onClick={() => { setIsVendor(false); setVendorDrawer(false) }} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Logout
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Powered by </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>StreetLocal</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ DELIVERY SETTINGS ═══ */}
      {showDeliverySettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setShowDeliverySettings(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Delivery Settings</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
              </div>
            </div>

            {/* Main card */}
            {(() => {
              const isIndonesia = shopCountry === 'Indonesia' || shopCountry === '' || delCurrency === 'Rp'
              return (
              <>
              <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '18px 16px', position: 'relative', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
                {isCustomAccent && <div style={{ position: 'absolute', top: 18, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

                {/* Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: delEnabled ? accent : '#F59E0B' }}>{delEnabled ? 'Delivery Available' : 'Collection Only'}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{delEnabled ? 'Customers will see delivery fees' : 'Customers collect from your location'}</div>
                  </div>
                  <button style={{ ...S.toggle(delEnabled), background: delEnabled ? accent : 'rgba(255,255,255,0.15)' }} onClick={() => setDelEnabled(!delEnabled)}>
                    <div style={S.toggleDot(delEnabled)} />
                  </button>
                </div>
              </div>

              {delEnabled && (
                <>
                  {/* Government rates notice — Indonesia only */}
                  {isIndonesia && (
                    <div style={{ margin: '0 14px 12px', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#FACC15', marginBottom: 4 }}>Tarif Ojol Resmi — {shopCity || 'Indonesia'}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        Rates are pre-set based on Indonesian government regulated ride-hailing tariffs (Kemenhub). You can adjust if needed.
                      </div>
                    </div>
                  )}

                  {/* Rate settings card */}
                  <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Delivery Rates</div>

                    {/* Min Fee + Per KM — the two main rates */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Min Fare</label>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Starting price for the first km</div>
                        <input type="number" value={delMinCharge} onChange={e => setDelMinCharge(parseInt(e.target.value) || 0)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 800 }} />
                        {delMinCharge > 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{delCurrency} {fmt(delMinCharge).replace('Rp ', '')}</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Per KM</label>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Extra charge for each km after min distance</div>
                        <input type="number" value={delPerKm} onChange={e => setDelPerKm(parseInt(e.target.value) || 0)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 800 }} />
                        {delPerKm > 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{delCurrency} {fmt(delPerKm).replace('Rp ', '')}/km</div>}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />

                    {/* Advanced settings */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Min Distance (km)</label>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Flat rate covers this distance</div>
                        <input type="number" value={delMinKm} onChange={e => setDelMinKm(parseInt(e.target.value) || 1)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Max Distance (km)</label>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Furthest you will deliver</div>
                        <input type="number" value={delMaxKm} onChange={e => setDelMaxKm(parseInt(e.target.value) || 0)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      {!isIndonesia && (
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Currency</label>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Your local currency symbol</div>
                          <input type="text" value={delCurrency} onChange={e => setDelCurrency(e.target.value)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Free Above (0=off)</label>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Free delivery if order exceeds this amount</div>
                        <input type="number" value={delFreeAbove} onChange={e => setDelFreeAbove(parseInt(e.target.value) || 0)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    </div>

                    {/* Summary */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        First {delMinKm}km = <strong style={{ color: '#FACC15' }}>{delCurrency} {fmt(delMinCharge).replace('Rp ', '')}</strong> flat
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        After {delMinKm}km = <strong style={{ color: '#FACC15' }}>+{delCurrency} {fmt(delPerKm).replace('Rp ', '')}</strong> per km
                      </div>
                      {delFreeAbove > 0 && (
                        <div style={{ fontSize: 13, color: accent, fontWeight: 700, marginTop: 4 }}>
                          Free delivery on orders above {delCurrency} {fmt(delFreeAbove).replace('Rp ', '')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reset button */}
                  {isIndonesia && (
                    <div style={{ margin: '0 14px 12px' }}>
                      <button onClick={() => {
                        const rates = getDeliveryDefaults('ID', shopCity)
                        setDelMinCharge(rates.minCharge); setDelMinKm(rates.minKm); setDelPerKm(rates.perKm); setDelMaxKm(rates.maxKm); setDelCurrency(rates.currency)
                      }} style={{ width: '100%', padding: 12, borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                        {isCustomAccent && <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 14 }}><div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} /></div>}
                        <span style={{ position: 'relative', zIndex: 1 }}>Reset to Indonesia Rates</span>
                      </button>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 6 }}>Based on Kemenhub regulated ojol tariffs</div>
                    </div>
                  )}

                  {/* Info for non-Indonesia */}
                  {!isIndonesia && (
                    <div style={{ margin: '0 14px 12px', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, textAlign: 'center' }}>
                        Set your own delivery rates based on local ride-hailing services in your area
                      </div>
                    </div>
                  )}

                  {/* Save button */}
                  <div style={{ margin: '0 14px 24px' }}>
                    <button onClick={() => setShowDeliverySettings(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
                      Save Rates
                    </button>
                  </div>
                </>
              )}
              </>
              )
            })()}
          </div>
        </div>
      )}


      {/* ═══ VENDOR EDIT ITEM PAGE ═══ */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setEditItem(null)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Edit Item</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
              </div>
            </div>

            {/* Live card preview */}
            <div style={{ padding: '0 14px 12px' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textAlign: 'center', fontWeight: 600 }}>Preview — how customers will see it</div>
              <div style={{ ...S.card, margin: 0, ...(isCustomAccent ? { borderLeft: `3px solid ${accent}` } : {}) }}>
                <label style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: formPhoto ? 'none' : `2px dashed ${accent}40`, background: formPhoto ? 'none' : 'rgba(0,0,0,0.4)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {formPhoto ? (
                    <>
                      <img src={formPhoto} alt="" onError={imgError('food')} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 19, background: '#8B0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 18, lineHeight: 1, display: 'block' }}>📷</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: accent, gap: 2 }}>
                      <span style={{ fontSize: 22 }}>📷</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Add Photo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (supabase && vendorId && !String(vendorId).startsWith('local')) {
                      const url = await uploadMenuImage(vendorId, file)
                      if (url) { setFormPhoto(url); return }
                    }
                    const reader = new FileReader()
                    reader.onload = () => {
                      const img = new Image()
                      img.onload = () => {
                        const canvas = document.createElement('canvas')
                        const max = 600
                        let w = img.width, h = img.height
                        if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r) }
                        canvas.width = w; canvas.height = h
                        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                        setFormPhoto(canvas.toDataURL('image/jpeg', 0.7))
                      }
                      img.src = reader.result
                    }
                    reader.readAsDataURL(file)
                  }} />
                </label>
                {formPopular && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 13, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 800, zIndex: 2 }}>Popular</span>}
                <div style={{ ...S.cardBody }}>
                  <div style={S.cardName}>{formName || 'Item Name'}{formSpice > 0 && shopTheme !== 'donut' &&<span style={{ marginLeft: 4 }}>{'🌶️'.repeat(formSpice)}</span>}</div>
                  <div style={S.cardDesc}>{formDesc || 'Description...'}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {formHalal && shopTheme !== 'donut' && <span style={{ fontSize: 13, background: 'rgba(34,197,94,0.8)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>Halal</span>}
                    {formPriceMode === 'promo' && formPromoPrice ? (
                      <>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{fmt(Number(formPrice) || 0)}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>{fmt(Number(formPromoPrice) || 0)}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{formPrice ? fmt(Number(formPrice)) : 'Rp 0'}</span>
                    )}
                  </div>
                </div>
                {formPhoto && <button onClick={(e) => { e.preventDefault(); setFormPhoto('') }} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>}
              </div>

              {/* 4 thumbnail slots — tap a filled thumbnail to swap with main image */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[0, 1, 2, 3].map(i => {
                  const url = formPhotos[i] || ''
                  const swapWithMain = () => {
                    const prevMain = formPhoto
                    setFormPhoto(url)
                    setFormPhotos(p => {
                      const next = [...p]
                      next[i] = prevMain
                      return next.filter(Boolean).slice(0, 4)
                    })
                  }
                  const remove = (e) => {
                    e.preventDefault(); e.stopPropagation()
                    setFormPhotos(p => p.filter((_, idx) => idx !== i))
                  }
                  if (url) {
                    return (
                      <div key={i} style={{ flex: 1, position: 'relative' }}>
                        <button type="button" onClick={swapWithMain} title="Tap to make main image" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', padding: 0, display: 'block', transition: 'transform 200ms ease, box-shadow 200ms ease' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 200ms ease' }} />
                        </button>
                        <button type="button" onClick={remove} style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, background: '#EF4444', border: '2px solid #1a1a1a', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    )
                  }
                  return (
                    <label key={i} style={{ flex: 1, aspectRatio: '1 / 1', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', gap: 2 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" /></svg>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Add</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files[0]; if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => {
                          const img = new Image()
                          img.onload = () => {
                            const canvas = document.createElement('canvas')
                            const max = 800
                            const scale = Math.min(max / img.width, max / img.height, 1)
                            canvas.width = img.width * scale
                            canvas.height = img.height * scale
                            const ctx = canvas.getContext('2d')
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
                            setFormPhotos(p => {
                              const next = [...p]
                              next[i] = dataUrl
                              return next.filter(Boolean).slice(0, 4)
                            })
                          }
                          img.src = reader.result
                        }
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                  )
                })}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4 }}>Tap a thumbnail to swap it with the main image</div>
            </div>

            {/* Form card */}
            <div style={{ margin: '0 14px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '18px 16px', position: 'relative', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
              {isCustomAccent && <div style={{ position: 'absolute', top: 18, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

              {/* Item name */}
              <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Item Name <span style={{ color: formName.length >= 25 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({formName.length}/25)</span></label>
              <input style={{ ...S.input, fontSize: 15, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. Nasi Goreng" maxLength={25} value={formName} onChange={(e) => setFormName(e.target.value)} />

              {/* Category + Spice */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>Category</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" onClick={() => { setCategoryPickerGroup(null); setCategoryPickerOpen(true) }} style={{ background: 'none', border: 'none', color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>＋ Browse all</button>
                      <button type="button" onClick={() => setVendorTypePickerOpen(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Change vendor type</button>
                    </div>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {categoryChips.map(c => {
                      const isActive = formCategory === c
                      return (
                        <button key={c} type="button" onClick={() => setFormCategory(c)} style={{
                          background: isActive ? (isCustomAccent ? accent : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.06)',
                          border: '1px solid ' + (isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'),
                          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          padding: '6px 10px', borderRadius: 14, minHeight: 30,
                        }}>{c}</button>
                      )
                    })}
                    <input
                      placeholder="+ Add custom"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setFormCategory(e.currentTarget.value.trim())
                          e.currentTarget.value = ''
                        }
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: 13, padding: '6px 10px', borderRadius: 14,
                        outline: 'none', minWidth: 100, fontWeight: 500,
                      }}
                    />
                  </div>
                </div>
                {shopTheme !== 'donut' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Spice Level</label>
                    <select value={formSpice} onChange={(e) => setFormSpice(Number(e.target.value))} style={{ ...S.input, marginBottom: 0, fontSize: 13, padding: '10px 12px', appearance: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', color: formSpice > 0 ? '#EF4444' : '#fff' }}>
                      <option value={0} style={{ background: '#1a1a1a' }}>None</option>
                      <option value={1} style={{ background: '#1a1a1a' }}>🌶️ Medium</option>
                      <option value={2} style={{ background: '#1a1a1a' }}>🌶️🌶️ Hot</option>
                      <option value={3} style={{ background: '#1a1a1a' }}>🌶️🌶️🌶️ Very Hot</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Portion size — important: visible by default in main form */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Portion</label>
                <select value={formPortionSize} onChange={(e) => setFormPortionSize(e.target.value)} style={{ ...S.input, marginBottom: 0, fontSize: 13, padding: '10px 12px', appearance: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                  <option value="" style={{ background: '#1a1a1a' }}>Choose portion size…</option>
                  <option value="Small" style={{ background: '#1a1a1a' }}>Small</option>
                  <option value="Medium" style={{ background: '#1a1a1a' }}>Medium</option>
                  <option value="Large" style={{ background: '#1a1a1a' }}>Large</option>
                </select>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {shopTheme !== 'donut' && (
                  <button onClick={() => setFormHalal(!formHalal)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: formHalal ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)', background: formHalal ? `${accent}20` : 'rgba(255,255,255,0.04)', color: formHalal ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>☪️ Halal</button>
                )}
                <button onClick={() => setFormPopular(!formPopular)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: formPopular ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.1)', background: formPopular ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)', color: formPopular ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⭐ Popular</button>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

              {/* Price toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setFormPriceMode('normal')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: formPriceMode === 'normal' ? accent : 'rgba(255,255,255,0.06)', color: formPriceMode === 'normal' ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Normal</button>
                <button onClick={() => setFormPriceMode('promo')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: formPriceMode === 'promo' ? '#FFD600' : 'rgba(255,255,255,0.06)', color: formPriceMode === 'promo' ? '#1a1a1a' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Promo</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Price</label>
                  <input style={{ ...S.input, marginBottom: 0, fontSize: 16, fontWeight: 800, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. 15000" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                  {formPrice && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{fmt(Number(formPrice))}</div>}
                </div>
                {formPriceMode === 'promo' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, color: '#EF4444', marginBottom: 4, display: 'block', fontWeight: 600 }}>Promo Price</label>
                    <input style={{ ...S.input, marginBottom: 0, fontSize: 16, fontWeight: 800, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(239,68,68,0.3)' }} placeholder="e.g. 10000" type="number" value={formPromoPrice} onChange={(e) => setFormPromoPrice(e.target.value)} />
                    {formPromoPrice && <div style={{ fontSize: 13, color: '#EF4444', marginTop: 4 }}>{fmt(Number(formPromoPrice))}</div>}
                  </div>
                )}
              </div>

              {/* Description */}
              <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Description <span style={{ color: formDesc.length >= 350 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({formDesc.length}/350)</span></label>
              <textarea style={{ ...S.input, width: '100%', boxSizing: 'border-box', minHeight: 110, resize: 'vertical', fontSize: 13, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.5, fontFamily: 'inherit' }} placeholder="Describe the dish — ingredients, flavour, what makes it special..." value={formDesc} maxLength={350} onChange={(e) => setFormDesc(e.target.value)} />

              {/* Prep Time */}
              <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Prep Time (minutes)</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[0, 5, 10, 15, 20, 30].map(t => (
                  <button key={t} onClick={() => setFormPrepTime(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: formPrepTime === t ? accent : 'rgba(255,255,255,0.06)', color: formPrepTime === t ? '#fff' : 'rgba(255,255,255,0.4)' }}>{t === 0 ? '—' : t}</button>
                ))}
              </div>
            </div>

            {/* Progressive-disclosure optional details */}
            {renderItemOptionalFields()}

            {/* Buttons */}
            <div style={{ padding: '16px 14px 28px', display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: 16, borderRadius: 16, border: 'none', background: '#8B0000', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }} onClick={() => setEditItem(null)}>Cancel</button>
              <button style={{ flex: 1, padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 15, fontWeight: 800, cursor: 'pointer' }} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VENDOR ADD ITEM PAGE ═══ */}
      {addingItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setAddingItem(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Add New Item</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
              </div>
            </div>

            {/* Live card preview — shows exactly how it will look */}
            <div style={{ padding: '0 14px 12px' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textAlign: 'center', fontWeight: 600 }}>Preview — how customers will see it</div>
              <div style={{ ...S.card, margin: 0, ...(isCustomAccent ? { borderLeft: `3px solid ${accent}` } : {}) }}>
                <label style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: formPhoto ? 'none' : `2px dashed ${accent}40`, background: formPhoto ? 'none' : 'rgba(0,0,0,0.4)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {formPhoto ? (
                    <img src={formPhoto} alt="" onError={imgError('food')} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: accent, gap: 2 }}>
                      <span style={{ fontSize: 22 }}>📷</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Add Photo</span>
                    </div>
                  )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (supabase && vendorId && !String(vendorId).startsWith('local')) {
                    const url = await uploadMenuImage(vendorId, file)
                    if (url) { setFormPhoto(url); return }
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    const img = new Image()
                    img.onload = () => {
                      const canvas = document.createElement('canvas')
                      const max = 600
                      let w = img.width, h = img.height
                      if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r) }
                      canvas.width = w; canvas.height = h
                      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                      setFormPhoto(canvas.toDataURL('image/jpeg', 0.7))
                    }
                    img.src = reader.result
                  }
                  reader.readAsDataURL(file)
                }} />
                </label>
                {/* Popular badge on image */}
                {formPopular && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 13, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 800, zIndex: 2 }}>Popular</span>}
                {/* Card body preview */}
                <div style={{ ...S.cardBody }}>
                  <div style={S.cardName}>{formName || 'Item Name'}{formSpice > 0 && shopTheme !== 'donut' &&<span style={{ marginLeft: 4 }}>{'🌶️'.repeat(formSpice)}</span>}</div>
                  <div style={S.cardDesc}>{formDesc || 'Description...'}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {formHalal && shopTheme !== 'donut' && <span style={{ fontSize: 13, background: 'rgba(34,197,94,0.8)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>Halal</span>}
                    {formPriceMode === 'promo' && formPromoPrice ? (
                      <>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{fmt(Number(formPrice) || 0)}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>{fmt(Number(formPromoPrice) || 0)}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{formPrice ? fmt(Number(formPrice)) : 'Rp 0'}</span>
                    )}
                  </div>
                </div>
                {formPhoto && <button onClick={(e) => { e.preventDefault(); setFormPhoto('') }} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>}
              </div>

              {/* 4 thumbnail slots — tap a filled thumbnail to swap with main image */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[0, 1, 2, 3].map(i => {
                  const url = formPhotos[i] || ''
                  const swapWithMain = () => {
                    const prevMain = formPhoto
                    setFormPhoto(url)
                    setFormPhotos(p => {
                      const next = [...p]
                      next[i] = prevMain
                      return next.filter(Boolean).slice(0, 4)
                    })
                  }
                  const remove = (e) => {
                    e.preventDefault(); e.stopPropagation()
                    setFormPhotos(p => p.filter((_, idx) => idx !== i))
                  }
                  if (url) {
                    return (
                      <div key={i} style={{ flex: 1, position: 'relative' }}>
                        <button type="button" onClick={swapWithMain} title="Tap to make main image" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', padding: 0, display: 'block', transition: 'transform 200ms ease, box-shadow 200ms ease' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 200ms ease' }} />
                        </button>
                        <button type="button" onClick={remove} style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, background: '#EF4444', border: '2px solid #1a1a1a', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    )
                  }
                  return (
                    <label key={i} style={{ flex: 1, aspectRatio: '1 / 1', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', gap: 2 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" /></svg>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Add</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files[0]; if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => {
                          const img = new Image()
                          img.onload = () => {
                            const canvas = document.createElement('canvas')
                            const max = 800
                            const scale = Math.min(max / img.width, max / img.height, 1)
                            canvas.width = img.width * scale
                            canvas.height = img.height * scale
                            const ctx = canvas.getContext('2d')
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
                            setFormPhotos(p => {
                              const next = [...p]
                              next[i] = dataUrl
                              return next.filter(Boolean).slice(0, 4)
                            })
                          }
                          img.src = reader.result
                        }
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                  )
                })}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4 }}>Tap a thumbnail to swap it with the main image</div>
            </div>

            {/* Form card */}
            <div style={{ margin: '0 14px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '18px 16px', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
              {isCustomAccent && <div style={{ position: 'absolute', top: 18, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

              {/* Item name */}
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Item Name <span style={{ color: formName.length >= 25 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({formName.length}/25)</span></label>
              <input style={{ ...S.input, fontSize: 15, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. Nasi Goreng" maxLength={25} value={formName} onChange={(e) => setFormName(e.target.value)} />

              {/* Category + Spice */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Category</label>
                  {(() => {
                    // Donut theme uses the 10 curated donut categories + Other
                    // (custom name input). Other themes keep the original
                    // Meal/Snack/Drink/etc. options unchanged.
                    const DONUT_FORM_CATS = (THEME_CATEGORY_OVERRIDES.donut?.[0]?.types) || []
                    const STD_CATS = ['Meal','Snack','Drink','Extra Sauce','Dessert']
                    const cats = shopTheme === 'donut' ? DONUT_FORM_CATS : STD_CATS
                    const inList = cats.includes(formCategory)
                    const isCustom = !!formCategory && !inList
                    const selectVal = inList ? formCategory : (isCustom || formCategory === '__OTHER__' ? '__OTHER__' : '')
                    return (
                      <>
                        <select value={selectVal} onChange={(e) => {
                          if (e.target.value === '__OTHER__') {
                            // Clear formCategory so the input below starts empty
                            setFormCategory('__OTHER__')
                          } else {
                            setFormCategory(e.target.value)
                          }
                        }} style={{ ...S.input, marginBottom: 0, fontSize: 13, padding: '10px 12px', appearance: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                          {!inList && !isCustom && formCategory !== '__OTHER__' && (
                            <option value="" style={{ background: '#1a1a1a' }} disabled>Choose a category…</option>
                          )}
                          {cats.map(c => (
                            <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
                          ))}
                          <option value="__OTHER__" style={{ background: '#1a1a1a' }}>Other (custom name)</option>
                        </select>
                        {(formCategory === '__OTHER__' || isCustom) && (
                          <input
                            value={formCategory === '__OTHER__' ? '' : formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            placeholder="Type your category name (e.g. Indonesian, Vegan, Savory)"
                            maxLength={30}
                            style={{ ...S.input, marginTop: 6, marginBottom: 0, fontSize: 13, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', boxSizing: 'border-box' }}
                          />
                        )}
                      </>
                    )
                  })()}
                </div>
                {shopTheme !== 'donut' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Spice Level</label>
                    <select value={formSpice} onChange={(e) => setFormSpice(Number(e.target.value))} style={{ ...S.input, marginBottom: 0, fontSize: 13, padding: '10px 12px', appearance: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', color: formSpice > 0 ? '#EF4444' : '#fff' }}>
                      <option value={0} style={{ background: '#1a1a1a' }}>None</option>
                      <option value={1} style={{ background: '#1a1a1a' }}>🌶️ Medium</option>
                      <option value={2} style={{ background: '#1a1a1a' }}>🌶️🌶️ Hot</option>
                      <option value={3} style={{ background: '#1a1a1a' }}>🌶️🌶️🌶️ Very Hot</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Badges row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {shopTheme !== 'donut' && (
                  <button onClick={() => setFormHalal(!formHalal)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: formHalal ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)', background: formHalal ? `${accent}20` : 'rgba(255,255,255,0.04)', color: formHalal ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>☪️ Halal</button>
                )}
                <button onClick={() => setFormPopular(!formPopular)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: formPopular ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.1)', background: formPopular ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)', color: formPopular ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⭐ Popular</button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

              {/* Price section */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setFormPriceMode('normal')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: formPriceMode === 'normal' ? accent : 'rgba(255,255,255,0.06)', color: formPriceMode === 'normal' ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Normal</button>
                <button onClick={() => setFormPriceMode('promo')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: formPriceMode === 'promo' ? '#FFD600' : 'rgba(255,255,255,0.06)', color: formPriceMode === 'promo' ? '#1a1a1a' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Promo</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Price</label>
                  <input style={{ ...S.input, marginBottom: 0, fontSize: 16, fontWeight: 800, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. 15000" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                  {formPrice && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{fmt(Number(formPrice))}</div>}
                </div>
                {formPriceMode === 'promo' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, color: '#EF4444', marginBottom: 4, display: 'block', fontWeight: 600 }}>Promo Price</label>
                    <input style={{ ...S.input, marginBottom: 0, fontSize: 16, fontWeight: 800, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(239,68,68,0.3)' }} placeholder="e.g. 10000" type="number" value={formPromoPrice} onChange={(e) => setFormPromoPrice(e.target.value)} />
                    {formPromoPrice && <div style={{ fontSize: 13, color: '#EF4444', marginTop: 4 }}>{fmt(Number(formPromoPrice))}</div>}
                  </div>
                )}
              </div>

              {/* Description */}
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Description <span style={{ color: formDesc.length >= 350 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({formDesc.length}/350)</span></label>
              <textarea
                style={{ ...S.input, width: '100%', boxSizing: 'border-box', minHeight: 110, resize: 'vertical', marginBottom: 0, fontSize: 13, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.5, fontFamily: 'inherit' }}
                placeholder="Describe the dish — ingredients, flavour, what makes it special..."
                value={formDesc}
                maxLength={350}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>

            {/* Progressive-disclosure optional details */}
            {renderItemOptionalFields()}

            {/* Add button — sticky bottom */}
            <div style={{ padding: '16px 14px 28px' }}>
              <button style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: accent, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={saveAdd}>
                {isCustomAccent && <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}><div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} /></div>}
                <span style={{ position: 'relative', zIndex: 1 }}>Add to Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SHOP CONFIG PAGE ═══ */}
      {shopConfig && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
            <button onClick={() => setShopConfig(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>My Shop</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
            </div>
          </div>
          {/* Share link card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 14, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6, display: 'block' }}>Your App Link</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input readOnly value={`streetlocal.live/${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} style={{ ...S.input, marginBottom: 0, flex: 1, fontSize: 13, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={(e) => { navigator.clipboard.writeText(`https://streetlocal.live/${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`); e.target.textContent = '✓'; setTimeout(() => { e.target.textContent = 'Copy' }, 2000) }} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Copy</button>
            </div>
          </div>

          {/* Logo + Basic Info card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '18px 16px', position: 'relative', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            {isCustomAccent && <div style={{ position: 'absolute', top: 18, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

            {/* Logo upload — shows exact landing page preview */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const url = await uploadMenuImage(vendorId, file)
                  if (url) { setShopLogo(url); localStorage.setItem('foodlocalchat_shopLogo', url) }
                }} />
                {shopLogo ? (
                  // Honour the chosen logo style so the preview matches the
                  // landing page exactly. Bare = image only, no ring, no
                  // background. Off = nothing rendered on landing.
                  shopLogoStyle === 'bare' ? (
                    <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
                  ) : shopLogoStyle === 'off' ? (
                    <div style={{ width: 100, height: 100, borderRadius: 50, border: '1px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', textAlign: 'center', boxSizing: 'border-box' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600, lineHeight: 1.3 }}>Logo hidden on landing</span>
                    </div>
                  ) : (
                    <div style={{ width: 100, height: 100, borderRadius: 50, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.15)', boxShadow: `0 4px 16px rgba(0,0,0,0.3)` }}>
                      <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 86, height: 86, borderRadius: 43, objectFit: 'cover' }} />
                    </div>
                  )
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: 50, background: `${accent}20`, border: `2px dashed ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 28 }}>📷</span>
                    <span style={{ fontSize: 13, color: accent, fontWeight: 700 }}>Add Logo</span>
                  </div>
                )}
              </label>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{shopLogo ? 'Tap to change' : 'This is how it looks on your landing page'}</div>
              {shopLogo && <button onClick={() => { setShopLogo(''); localStorage.removeItem('foodlocalchat_shopLogo') }} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>Remove</button>}

            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Shop Name <span style={{ color: shopName.length >= 20 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({shopName.length}/20)</span></label>
            <input style={{ ...S.input, background: 'rgba(255,255,255,0.06)', border: '1px solid ' + (shopNameError ? '#EF4444' : 'rgba(255,255,255,0.1)') }} value={shopName} maxLength={20} onChange={(e) => handleShopNameChange(e.target.value)} />
            {shopNameError && (
              <div role="alert" style={{ marginTop: 6, marginBottom: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: 13, fontWeight: 600, lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>⚠</span>
                <span>{shopNameError}</span>
              </div>
            )}

            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>WhatsApp Number</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(() => {
                // Country-specific prefix (digits only, no +). Use precise
                // startsWith stripping — the previous `\d{1,3}` regex was
                // greedy and ate too many digits, causing cursor jumps and
                // dropped/added digits on every keystroke.
                const cc = shopCountry === 'Indonesia' || shopCountry === '' ? '62'
                  : shopCountry === 'Malaysia' ? '60'
                  : shopCountry === 'Singapore' ? '65'
                  : shopCountry === 'Thailand' ? '66'
                  : ''
                const prefixLabel = cc ? `+${cc}` : '+'
                const digitsOnly = String(shopPhone || '').replace(/[^0-9]/g, '')
                const localPart = cc && digitsOnly.startsWith(cc) ? digitsOnly.slice(cc.length) : digitsOnly
                return (
                  <>
                    <div style={{ padding: '12px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{prefixLabel}</div>
                    <input style={{ ...S.input, marginBottom: 0, flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={localPart} onChange={(e) => {
                      const next = e.target.value.replace(/[^0-9]/g, '')
                      setShopPhone(cc ? cc + next : next)
                    }} placeholder="812 3456 7890" type="tel" inputMode="numeric" maxLength={14} />
                  </>
                )
              })()}
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Food Type</label>
            <input style={{ ...S.input, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopFoodType} onChange={(e) => setShopFoodType(e.target.value)} placeholder="e.g. Noodles" />

            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>About <span style={{ color: shopBio.length >= 350 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({shopBio.length}/350)</span></label>
            <textarea style={{ ...S.input, width: '100%', boxSizing: 'border-box', minHeight: 120, resize: 'vertical', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.5, fontFamily: 'inherit' }} value={shopBio} maxLength={350} onChange={(e) => setShopBio(e.target.value)} placeholder="Tell customers about your food, your story, what makes you special..." />
          </div>

          {/* Location card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Location</div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Address</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input style={{ ...S.input, flex: 1, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopAddress} onChange={async (e) => {
                setShopAddress(e.target.value)
                if (e.target.value.length > 3) {
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(e.target.value)}&format=json&limit=3&countrycodes=id`)
                    const data = await res.json()
                    setLocationSuggestions(data.map(d => d.display_name))
                  } catch { setLocationSuggestions([]) }
                } else { setLocationSuggestions([]) }
              }} placeholder="Search address or use GPS" />
              <button onClick={() => {
                if (!navigator.geolocation) return
                navigator.geolocation.getCurrentPosition(async ({ coords }) => {
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
                    const data = await res.json()
                    setShopAddress(data.display_name || `${coords.latitude}, ${coords.longitude}`)
                    // Extract city and country
                    const addr = data.address || {}
                    setShopCity(addr.city || addr.town || addr.village || addr.county || '')
                    setShopCountry(addr.country || '')
                    // Get 3 nearby suggestions
                    const nearby = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.address?.road || data.address?.suburb || '')}&format=json&limit=3&countrycodes=id&viewbox=${coords.longitude-0.01},${coords.latitude+0.01},${coords.longitude+0.01},${coords.latitude-0.01}`)
                    const nearbyData = await nearby.json()
                    setLocationSuggestions(nearbyData.map(d => d.display_name))
                  } catch { setShopAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`) }
                }, () => alert('Please allow location access'), { enableHighAccuracy: true, timeout: 10000 })
              }} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>📍</button>
            </div>
            {locationSuggestions.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                {locationSuggestions.map((s, i) => (
                  <button key={i} onClick={() => { setShopAddress(s); setLocationSuggestions([]) }} style={{
                    width: '100%', padding: '8px 12px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}>{s}</button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>City</label>
                <input style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopCity} onChange={(e) => setShopCity(e.target.value)} placeholder="e.g. Yogyakarta" />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Country</label>
                <input
                  style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={shopCountry}
                  onChange={(e) => {
                    const val = e.target.value
                    setShopCountry(val)
                    const q = val.trim().toLowerCase()
                    if (q.length === 0) { setCountrySuggestions([]); return }
                    // startsWith first (best matches), then includes to top 3
                    const starts = COUNTRIES.filter(c => c.toLowerCase().startsWith(q))
                    const extras = COUNTRIES.filter(c => !starts.includes(c) && c.toLowerCase().includes(q))
                    setCountrySuggestions([...starts, ...extras].slice(0, 3))
                  }}
                  onBlur={() => setTimeout(() => setCountrySuggestions([]), 150)}
                  placeholder="e.g. Indonesia"
                  autoComplete="off"
                />
                {countrySuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'rgba(15,15,15,0.97)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {countrySuggestions.map((c, i) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setShopCountry(c); setCountrySuggestions([]) }}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '10px 12px', minHeight: 40,
                          border: 'none', background: 'transparent',
                          color: '#fff', fontSize: 14, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          borderBottom: i < countrySuggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Google Maps Link</label>
            <input style={{ ...S.input, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopMapsLink} onChange={(e) => setShopMapsLink(e.target.value)} placeholder="Paste Google Maps link" />
          </div>

          {/* Hours card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Opening Hours</div>
            {[
              { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
              { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' }, { key: 'sun', label: 'Sun' },
            ].map(day => (
              <div key={day.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: shopSchedule[day.key]?.off ? '#EF4444' : 'rgba(255,255,255,0.6)', width: 30, flexShrink: 0 }}>{day.label}</span>
                {shopSchedule[day.key]?.off ? (
                  <span style={{ flex: 1, fontSize: 13, color: '#EF4444', fontWeight: 600 }}>Closed</span>
                ) : (
                  <>
                    <input type="time" value={shopSchedule[day.key]?.open || '17:00'} onChange={e => setShopSchedule({ ...shopSchedule, [day.key]: { ...shopSchedule[day.key], open: e.target.value } })} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'inherit', colorScheme: 'dark' }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>–</span>
                    <input type="time" value={shopSchedule[day.key]?.close || '23:00'} onChange={e => setShopSchedule({ ...shopSchedule, [day.key]: { ...shopSchedule[day.key], close: e.target.value } })} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'inherit', colorScheme: 'dark' }} />
                  </>
                )}
                <button onClick={() => setShopSchedule({ ...shopSchedule, [day.key]: { ...shopSchedule[day.key], off: !shopSchedule[day.key]?.off } })} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: shopSchedule[day.key]?.off ? 'rgba(239,68,68,0.2)' : '#FFD600', color: shopSchedule[day.key]?.off ? '#EF4444' : '#1a1a1a', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  {shopSchedule[day.key]?.off ? 'Off' : 'On'}
                </button>
              </div>
            ))}
          </div>

          {/* Social Media card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Social Media</div>
            {[
              { label: 'Instagram', icon: 'https://cdn.simpleicons.org/instagram/white', value: shopInstagram, set: setShopInstagram, placeholder: 'username' },
              { label: 'Facebook', icon: 'https://cdn.simpleicons.org/facebook/white', value: shopFacebook, set: setShopFacebook, placeholder: 'facebook.com/page' },
              { label: 'TikTok', icon: 'https://cdn.simpleicons.org/tiktok/white', value: shopTiktok, set: setShopTiktok, placeholder: 'username' },
              { label: 'X', icon: 'https://cdn.simpleicons.org/x/white', value: shopYoutube, set: setShopYoutube, placeholder: 'x.com/handle' },
              { label: 'Website', icon: 'https://api.iconify.design/mdi/web.svg?color=white', value: shopWebsite, set: setShopWebsite, placeholder: 'www.yoursite.com' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={s.icon} alt="" onError={imgError('generic')} style={{ width: 20, height: 20 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                  <input style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} value={s.value} onChange={(e) => s.set(e.target.value)} placeholder={s.placeholder} />
                </div>
              </div>
            ))}
          </div>

          {/* QRIS Payment QR */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Payment QR Code</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Upload your QRIS or payment QR. Customers see it after placing an order.</div>
            <div style={{ textAlign: 'center' }}>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const url = await uploadMenuImage(vendorId, file)
                  if (url) { setShopQris(url); localStorage.setItem('foodlocalchat_shopQris', url) }
                }} />
                {shopQris ? (
                  <img src={shopQris} alt="QRIS" onError={imgError('qr')} style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 12, background: '#fff', padding: 8 }} />
                ) : (
                  <div style={{ width: 160, height: 160, borderRadius: 12, background: `${accent}10`, border: `2px dashed ${accent}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontSize: 36 }}>📱</span>
                    <span style={{ fontSize: 13, color: accent, fontWeight: 700 }}>Upload QRIS</span>
                  </div>
                )}
              </label>
              {shopQris && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => { setShopQris(''); localStorage.removeItem('foodlocalchat_shopQris') }} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Remove QR</button>
                </div>
              )}
            </div>
          </div>

          {/* Save button */}
          <div style={{ padding: '8px 14px 28px' }}>
            <button onClick={() => {
              if (vendorId) updateVendorConfig(vendorId, { shop_name: shopName, shop_phone: shopPhone, shop_address: shopAddress, shop_hours: shopHours, shop_food_type: shopFoodType, shop_maps_link: shopMapsLink, shop_instagram: shopInstagram, shop_tiktok: shopTiktok, shop_facebook: shopFacebook, shop_youtube: shopYoutube, shop_website: shopWebsite, shop_open: shopOpen }).catch(() => {})
              setShopConfig(false)
            }} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Save Settings</button>
          </div>
          </div>
        </div>
      )}

      <style>{`@keyframes newBadgeDance { 0%, 100% { transform: scale(1) rotate(0deg); } 25% { transform: scale(1.15) rotate(-3deg); } 50% { transform: scale(1) rotate(3deg); } 75% { transform: scale(1.1) rotate(-2deg); } }`}</style>
      {/* ═══ THEME BROWSER PAGE ═══ */}
      {themeBrowser && (() => {
        const countries = [...new Set(THEME_PRESETS.flatMap(t => t.countries))]
        const COUNTRY_LABELS = { ID: 'Indonesia', MY: 'Malaysia', SG: 'Singapore', TH: 'Thailand', VN: 'Vietnam', PH: 'Philippines', US: 'USA', GB: 'UK', AU: 'Australia', NZ: 'New Zealand', CA: 'Canada', DE: 'Germany', FR: 'France', NL: 'Netherlands', AE: 'UAE', SA: 'Saudi', QA: 'Qatar', KW: 'Kuwait', EG: 'Egypt', KR: 'Korea' }
        const filtered = THEME_PRESETS.filter(t => {
          if (themeCountry !== 'all') {
            if (FOOD_CATEGORIES.includes(themeCountry)) { if (t.category !== themeCountry) return false }
            else { if (!t.countries.includes(themeCountry)) return false }
          }
          if (themeSearch && !t.label.toLowerCase().includes(themeSearch.toLowerCase()) && !t.category.toLowerCase().includes(themeSearch.toLowerCase()) && !t.foodTypes.some(ft => ft.toLowerCase().includes(themeSearch.toLowerCase()))) return false
          return true
        })
        const newThemes = filtered.filter(t => t.isNew)
        const otherThemes = filtered.filter(t => !t.isNew)

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
            {/* Themed background — matches the rest of the app */}
            <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
              {/* Header — branded with vendor's logo so it feels like their app */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
                <button onClick={() => setThemeBrowser(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
                {/* Respects shopLogoStyle — single source of truth. */}
                {shopLogoStyle === 'off' ? null : shopLogo ? (
                  shopLogoStyle === 'bare' ? (
                    <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.4))' }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: 19, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)' }}>
                      <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 32, height: 32, objectFit: 'contain', transform: `translate(${logoOffsetX * 32 / 156}px, ${logoOffsetY * 32 / 156}px)` }} />
                    </div>
                  )
                ) : (
                  shopLogoStyle === 'bare' ? null : (
                    <div style={{ width: 38, height: 38, borderRadius: 19, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{shopName.charAt(0).toUpperCase()}</div>
                  )
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shopName}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Themes · {THEME_PRESETS.length} available</div>
                </div>
              </div>

              {/* Search + Filter button */}
              <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input value={themeSearch} onChange={e => setThemeSearch(e.target.value)} placeholder="Search themes..." style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                </div>
                <button onClick={() => setThemeCountryDrawer(true)} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', boxShadow: '0 2px 8px rgba(239,68,68,0.45)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" /></svg>
                  {themeCountry !== 'all' && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, background: '#FACC15', border: '2px solid #EF4444' }} />}
                </button>
              </div>
              {themeCountry !== 'all' && (
                <div style={{ padding: '0 14px 8px', fontSize: 13, color: '#FFD600', fontWeight: 700 }}>
                  {FOOD_CATEGORIES.includes(themeCountry) ? themeCountry : (COUNTRY_LABELS[themeCountry] || themeCountry)}
                  <button onClick={() => setThemeCountry('all')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontWeight: 600, marginLeft: 6 }}>Clear</button>
                </div>
              )}

              {/* Category drawer — slides from left */}
              {themeCountryDrawer && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 400 }} onClick={() => setThemeCountryDrawer(false)}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
                  <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 270, background: '#1a1a1a', padding: '20px 0', overflowY: 'auto', animation: 'slideRight 0.2s ease' }}>
                    <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Categories</div>
                      <button onClick={() => setThemeCountryDrawer(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
                    </div>

                    {/* All */}
                    <button onClick={() => { setThemeCountry('all'); setThemeCountryDrawer(false) }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: themeCountry === 'all' ? '#FFD600' : 'transparent', color: themeCountry === 'all' ? '#1a1a1a' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>All Themes</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: themeCountry === 'all' ? '#1a1a1a' : 'rgba(255,255,255,0.25)' }}>{THEME_PRESETS.length}</span>
                    </button>

                    {/* Food categories */}
                    <div style={{ padding: '12px 16px 6px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Food Type</div>
                    {FOOD_CATEGORIES.map(cat => {
                      const count = THEME_PRESETS.filter(t => t.category === cat).length
                      return (
                        <button key={cat} onClick={() => { setThemeCountry(cat); setThemeCountryDrawer(false) }} style={{ width: '100%', padding: '11px 16px', border: 'none', background: themeCountry === cat ? '#FFD600' : 'transparent', color: themeCountry === cat ? '#1a1a1a' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{cat}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: themeCountry === cat ? '#1a1a1a' : 'rgba(255,255,255,0.25)' }}>{count}</span>
                        </button>
                      )
                    })}

                    {/* Countries */}
                    <div style={{ padding: '12px 16px 6px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Country</div>
                    {countries.map(c => {
                      const count = THEME_PRESETS.filter(t => t.countries.includes(c)).length
                      return (
                        <button key={c} onClick={() => { setThemeCountry(c); setThemeCountryDrawer(false) }} style={{ width: '100%', padding: '11px 16px', border: 'none', background: themeCountry === c ? '#FFD600' : 'transparent', color: themeCountry === c ? '#1a1a1a' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{COUNTRY_LABELS[c] || c}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: themeCountry === c ? '#1a1a1a' : 'rgba(255,255,255,0.25)' }}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Theme card renderer — iPhone frame style */}
              {(() => {
                const newBadgeDance = { animation: 'newBadgeDance 1.5s ease-in-out infinite' }
                const renderPhoneCard = (theme) => (
                  <div key={theme.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Theme name header */}
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.7)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {theme.label.replace(/^#\d+\s/, '')}
                      {theme.isNew && <span style={{ background: '#FFD600', color: '#1a1a1a', padding: '1px 6px', borderRadius: 4, fontSize: 13, fontWeight: 800, display: 'inline-block', ...newBadgeDance }}>NEW</span>}
                      {shopTheme === theme.id && <span style={{ background: '#22c55e', color: '#fff', padding: '1px 6px', borderRadius: 4, fontSize: 13, fontWeight: 800 }}>Active</span>}
                    </div>
                    {/* Mini phone frame */}
                    <div style={{ width: 140, height: 250, borderRadius: 20, background: '#1a1a1a', padding: 2, position: 'relative', border: shopTheme === theme.id ? '2px solid #FFD600' : '2px solid #333', boxShadow: shopTheme === theme.id ? '0 0 12px rgba(255,214,0,0.3)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
                      <div onClick={(e) => { e.stopPropagation(); setThemeBrowser(false); setShopTheme(theme.id); setShopAccentColor(theme.accent || '#8DC63F'); localStorage.setItem('foodlocalchat_theme', theme.id); localStorage.setItem('foodlocalchat_themeBg', theme.img); localStorage.setItem('foodlocalchat_accentColor', theme.accent || '#8DC63F'); const bgImg = document.getElementById('app-bg-img'); if (bgImg) bgImg.src = theme.img; setEditorColor(theme.accent || '#8DC63F'); setEditorBaseColor(theme.accent || '#8DC63F'); setThemeEditor({ url: theme.img }); }} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#1a1a1a', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 5, lineHeight: 1 }}>DEV</div>
                      <div style={{ width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', position: 'relative', background: '#000' }}>
                        <div style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', width: 32, height: 8, background: '#000', borderRadius: 6, zIndex: 3 }} />
                        <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                        <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 30, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 3 }} />
                      </div>
                    </div>
                    {/* View Theme button */}
                    <button onClick={() => { setThemePreviewImg(null); setThemePreviewPage('landing'); setThemePreviewId(theme.id) }} style={{ marginTop: 8, padding: '6px 20px', borderRadius: 8, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>View Theme</button>
                  </div>
                )

                return (
                  <>
                    {/* New themes */}
                    {newThemes.length > 0 && themeSearch === '' && (
                      <div style={{ padding: '0 14px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15', marginBottom: 10, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>New</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {newThemes.map(renderPhoneCard)}
                        </div>
                      </div>
                    )}

                    {/* All themes */}
                    <div style={{ padding: '0 14px 20px' }}>
                      {(newThemes.length > 0 && themeSearch === '') && <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>All Themes</div>}
                      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>No themes found</div>}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {(themeSearch ? filtered : otherThemes).map(renderPhoneCard)}
                      </div>
                    </div>
                  </>
                )
              })()}

              {/* Full-screen theme preview — standalone, no iframe */}
              {themePreviewId && (() => {
                const theme = THEME_PRESETS.find(t => t.id === themePreviewId)
                if (!theme) return null
                const activeImg = themePreviewImg || theme.img
                const allImages = [theme.img, ...(theme.variants || [])]
                const hasVariants = allImages.length > 1
                const ac = theme.accent || '#8DC63F'

                return (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }} onClick={() => { setThemePreviewId(null); setThemePreviewImg(null) }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 340, flexShrink: 0, padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>StreetLocal</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Business at your finger tips</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{theme.label.replace(/^#\d+\s/, '')}</div>
                    </div>

                    {/* Spacer — push phone to center */}
                    <div style={{ flex: 1, minHeight: 10 }} />

                    {/* Phone + Variants row — static mockup, no iframe */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <div style={{ width: 240, height: 480, borderRadius: 34, background: '#1a1a1a', padding: 4, position: 'relative', boxShadow: `0 16px 50px rgba(0,0,0,0.5), 0 0 16px ${ac}25`, border: '2px solid #333', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', right: -3, top: 100, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                      <div style={{ position: 'absolute', left: -3, top: 85, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                      <div style={{ position: 'absolute', left: -3, top: 110, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                      <div style={{ width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', position: 'relative', background: '#000' }}>
                        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 56, height: 16, background: '#000', borderRadius: 12, zIndex: 10 }} />
                        <img src={activeImg} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                        <div style={{ position: 'absolute', inset: 0, background: themePreviewPage === 'menu' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)', backdropFilter: themePreviewPage === 'menu' ? 'blur(6px)' : 'none', transition: 'all 0.3s' }} />
                        {themePreviewPage === 'landing' && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '0 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 32, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '3px solid rgba(255,255,255,0.15)' }}><span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>SN</span></div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)', textAlign: 'center', lineHeight: 1.1 }}>Street Noodle</div>
                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{theme.category}</div>
                            <button onClick={() => setThemePreviewPage('menu')} style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', padding: '10px 28px', borderRadius: 12, background: ac, fontSize: 14, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px ${ac}40` }}>View Menu</button>
                          </div>
                        )}
                        {themePreviewPage === 'menu' && (
                          <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '20px 8px 12px', background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)', position: 'sticky', top: 0, zIndex: 5 }}>
                              <button onClick={() => setThemePreviewPage('landing')} style={{ width: 22, height: 22, borderRadius: 11, background: ac, border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>←</button>
                              <div style={{ width: 22, height: 22, borderRadius: 11, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', marginRight: 6 }}><span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>SN</span></div>
                              <div><div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Street Noodle</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{theme.category}</div></div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, padding: '2px 8px 6px' }}>{['Menu', 'Drinks', 'Snacks'].map((t, i) => (<div key={t} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700, color: i === 0 ? ac : 'rgba(255,255,255,0.4)', borderBottom: i === 0 ? `2px solid ${ac}` : '2px solid transparent' }}>{t}</div>))}</div>
                            <div style={{ padding: '0 6px' }}>
                              {DEMO_MENU.filter(m => m.category === 'Meal').slice(0, 3).map(item => (
                                <div key={item.id} style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, margin: '0 0 5px', padding: 6, display: 'flex', gap: 6, alignItems: 'center', minHeight: 52, borderLeft: `3px solid ${ac}` }}>
                                  <img src={item.photo} alt="" onError={imgError('food')} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}{item.spice > 0 && shopTheme !== 'donut' &&' 🌶️'}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div><div style={{ fontSize: 13, fontWeight: 700, color: '#FACC15', marginTop: 1 }}>{fmt(item.price)}</div></div>
                                  <div style={{ width: 16, height: 16, borderRadius: 8, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>+</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ position: 'absolute', bottom: 10, left: 6, right: 6, background: `linear-gradient(135deg, ${ac}, ${ac}cc)`, borderRadius: 10, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>2 items · {fmt(41000)}</div>
                              <div style={{ background: '#fff', color: ac, borderRadius: 6, padding: '3px 8px', fontSize: 13, fontWeight: 700 }}>Checkout</div>
                            </div>
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
                      </div>
                    </div>
                    {/* Variant thumbnails — right side */}
                    {hasVariants && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        {allImages.map((img, i) => (
                          <button key={i} onClick={() => setThemePreviewImg(img)} style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', border: activeImg === img ? `3px solid ${ac}` : '2px solid rgba(255,255,255,0.15)', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
                            <img src={img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                        ))}
                      </div>
                    )}
                    </div>

                    {/* Bottom spacer */}
                    <div style={{ flex: 1, minHeight: 10 }} />

                    {/* Footer buttons */}
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingBottom: 20 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setThemePreviewId(null); setThemePreviewImg(null) }} style={{ padding: '10px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                      <button onClick={() => {
                        setShopTheme(theme.id); setShopAccentColor(theme.accent || '#8DC63F'); setBtnColor('') // reset button override so it follows the new accent
                        localStorage.setItem('foodlocalchat_theme', theme.id); localStorage.setItem('foodlocalchat_themeBg', activeImg); localStorage.setItem('foodlocalchat_accentColor', theme.accent || '#8DC63F')
                        const bgImg = document.getElementById('app-bg-img'); if (bgImg) bgImg.src = activeImg
                        setThemePreviewId(null); setThemePreviewImg(null); setThemeBrowser(false); setShowLanding(true)
                      }} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Use Theme</button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}

      {/* ═══ LANDING THEME PICKER ═══ */}
      {landingThemePicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column' }}>
          {/* Header — no tinted container (transparent over the page bg). */}
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setLandingThemePicker(false)} style={{ width: 36, height: 36, borderRadius: 18, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Choose Landing Theme</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Tap a theme preview, then "Use This Theme"</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxWidth: 480, width: '100%', margin: '0 auto' }}>
            {LANDING_THEMES.map(t => {
              const isSelected = landingThemeId === t.id
              return (
                <div key={t.id} style={{ borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${isSelected ? accent : 'rgba(255,255,255,0.08)'}`, overflow: 'visible' }}>
                  {/* Phone-shaped preview frame. 220×440 body — sized so the
                      chassis + side-button protrusion + pink card border all
                      coexist with breathing room (no edge-clipping). Internal
                      horizontal padding 20px keeps the side button off the
                      card border on narrow viewports. previewUrl is a
                      root-absolute path served by the LANDING app — build the
                      URL with the explicit origin to bypass Vite's /food/chat/
                      base rewriting. cover so the donut fills the screen
                      edge-to-edge (aspect already matches the donut design). */}
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 20px 14px' }}>
                    <div style={{ width: 220, height: 440, borderRadius: 32, background: '#1a1a1a', padding: 4, position: 'relative', boxShadow: `0 16px 50px rgba(0,0,0,0.5), 0 0 16px ${accent}25`, border: '2px solid #333', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', right: -3, top: 92, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                      <div style={{ width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', position: 'relative', background: '#000' }}>
                        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 52, height: 14, background: '#000', borderRadius: 10, zIndex: 10 }} />
                        <FitIframe
                          src={window.location.hostname === 'localhost'
                            ? 'http://localhost:5173' + t.previewUrl
                            : window.location.origin + t.previewUrl}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>{t.tagline}</div>
                    <button
                      onClick={() => {
                        setLandingThemeId(t.id)
                        try { localStorage.setItem('foodlocalchat_landing_theme_id', t.id) } catch {}
                        if (supabase && vendorId && !String(vendorId).startsWith('local')) {
                          supabase.from('vendor_accounts').update({ landing_theme_id: t.id }).eq('id', vendorId).then(() => {}).catch?.(() => {})
                        }
                        setLandingThemePicker(false)
                      }}
                      style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: isSelected ? '#FACC15' : accent, color: isSelected ? '#1a1a1a' : '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
                    >
                      {isSelected ? '✓ Currently Selected' : 'Use This Theme'}
                    </button>
                  </div>
                </div>
              )
            })}
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,215,0,0.08)', border: '1px dashed rgba(255,215,0,0.3)', fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
              More themes coming soon. Each one comes with its own colour palette, hero image, and decorative elements — pick the vibe that matches your shop.
            </div>
          </div>
        </div>
      )}

      {/* ═══ DESIGN STUDIO PAGE ═══ */}
      {/* ═══ MENU CARDS PAGE (donut theme only) ═══ */}
      {/* ═══ DONUT TYPES — vendor editor (donut theme only). Step-by-step
          flow: edit one type at a time → Save & Next advances → Save & Exit
          closes back to the drawer. ═══ */}
      {donutTypesPage && shopTheme === 'donut' && (() => {
        const types = (THEME_CATEGORY_OVERRIDES.donut?.[0]?.types) || []
        const publishedCount = Object.values(donutTypesContent).filter(c => c && c.image && c.description).length
        const safeIdx = Math.min(Math.max(0, donutTypesEditIdx), types.length - 1)
        const typeName = types[safeIdx]
        const data = donutTypesContent[typeName] || {}
        const isPublished = !!(data.image && data.description)
        const updateType = (patch) => {
          setDonutTypesContent(prev => ({ ...prev, [typeName]: { ...(prev[typeName] || {}), ...patch } }))
        }
        const removeCurrent = () => {
          setDonutTypesContent(prev => { const next = { ...prev }; delete next[typeName]; return next })
        }
        const saveAndNext = () => {
          if (safeIdx < types.length - 1) setDonutTypesEditIdx(safeIdx + 1)
          else setDonutTypesPage(false) // wrapped past the end
        }
        const saveAndExit = () => setDonutTypesPage(false)
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
            <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
              {/* Header — progress + back */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10, flexShrink: 0 }}>
                <button onClick={() => setDonutTypesPage(false)} style={{ width: 44, height: 44, borderRadius: 22, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Donut Types</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{safeIdx + 1} of {types.length} · {publishedCount} live</div>
                </div>
                {isPublished ? (
                  <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(34,197,94,0.2)', color: '#86EFAC', padding: '6px 10px', borderRadius: 8 }}>LIVE</span>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Draft</span>
                )}
              </div>
              {/* Type name banner */}
              <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{typeName}</div>
              </div>
              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 20px' }}>
                {/* IMAGE upload — large */}
                <label style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', borderRadius: 16, background: data.image ? '#000' : `${accent}18`, border: data.image ? '1px solid rgba(255,255,255,0.1)' : `2px dashed ${accent}55`, overflow: 'hidden', cursor: 'pointer', position: 'relative', marginBottom: 16 }}>
                  {data.image ? (
                    <img src={data.image} alt="" onError={imgError('food')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.6)' }}>
                      <span style={{ fontSize: 48 }}>📷</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>Tap to upload donut photo</span>
                    </div>
                  )}
                  {data.image && (
                    <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 13, fontWeight: 700 }}>Tap to change</div>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    e.target.value = ''
                    // Try Supabase upload first; fall back to a local data URL
                    // so the image saves even without a backend connection.
                    let url = null
                    try { url = await uploadMenuImage(vendorId, file) } catch {}
                    if (!url) {
                      const reader = new FileReader()
                      reader.onload = () => {
                        const img = new Image()
                        img.onload = () => {
                          const canvas = document.createElement('canvas')
                          const max = 900
                          let w = img.width, h = img.height
                          if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r) }
                          canvas.width = w; canvas.height = h
                          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                          updateType({ image: canvas.toDataURL('image/jpeg', 0.82) })
                        }
                        img.src = reader.result
                      }
                      reader.readAsDataURL(file)
                      return
                    }
                    updateType({ image: url })
                  }} />
                </label>
                {/* DESCRIPTION — large textarea, 1000 char max */}
                <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Story / description</div>
                    <div style={{ fontSize: 13, color: (data.description || '').length >= 950 ? '#FCD34D' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{(data.description || '').length}/1000</div>
                  </div>
                  <textarea
                    value={data.description || ''}
                    onChange={(e) => updateType({ description: e.target.value.slice(0, 1000) })}
                    placeholder={`Tell the story of your ${typeName.toLowerCase()} — ingredients, how it's made, why customers love it. Up to 1000 characters.`}
                    rows={10}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 14, lineHeight: 1.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', minHeight: 220, boxSizing: 'border-box' }}
                  />
                </div>
                {/* Star rating */}
                <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Rating</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <button key={i} type="button" onClick={() => updateType({ rating: (data.rating || 0) === i ? 0 : i })} aria-label={`${i} stars`} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', color: i <= (data.rating || 0) ? '#FACC15' : 'rgba(255,255,255,0.25)', fontSize: 28, cursor: 'pointer', padding: 0, lineHeight: 1 }}>★</button>
                    ))}
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{data.rating || 0}/5</div>
                </div>
                {/* Clear / remove */}
                {(data.image || data.description) && (
                  <button onClick={removeCurrent} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #8B0000', background: 'rgba(139,0,0,0.18)', color: '#FCA5A5', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
                    Clear this donut
                  </button>
                )}
              </div>
              {/* Preview Gallery button — opens the customer-facing swipe
                  gallery so the vendor can see exactly what customers see.
                  Only enabled when at least one type is published. */}
              {publishedCount > 0 && (
                <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
                  <button onClick={() => { setDonutTypesIdx(0); setDonutTypesGallery(true) }} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #FACC15', background: 'rgba(250,204,21,0.12)', color: '#FACC15', fontSize: 13, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}>
                    👁️ Preview Gallery ({publishedCount} live)
                  </button>
                </div>
              )}
              {/* Sticky action bar — Save & Next + Save & Exit */}
              <div style={{ display: 'flex', gap: 10, padding: '12px 16px 16px', flexShrink: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 60%)' }}>
                <button onClick={saveAndExit} style={{ flex: 1, padding: '14px 16px', borderRadius: 14, border: `1px solid ${accent}`, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 48 }}>
                  Save & Exit
                </button>
                <button onClick={saveAndNext} style={{ flex: 1.4, padding: '14px 16px', borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 18px ${accent}55`, minHeight: 48 }}>
                  {safeIdx < types.length - 1 ? `Save & Next → ${types[safeIdx + 1]}` : 'Save & Finish'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {menuCardsPage && shopTheme === 'donut' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setMenuCardsPage(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Menu Cards</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Style applies to all 3 layouts</div>
              </div>
            </div>

            {/* Live preview of all 3 card variants — they all reflect the
                current state so the vendor sees one change update everywhere. */}
            {(() => {
              const sample = { name: 'Glazed Donut', desc: 'Hand-glazed daily', price: 18000, photo: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_56_26%20AM.png' }
              // Landscape sample images supplied by the user. The horizontal/grid
              // cards use a thumbnail-friendly shot; the full-width card uses a
              // wider editorial-style donut shot.
              const sampleLandscape = 'https://ik.imagekit.io/nepgaxllc/Untitleddasdaccc.png'
              const sampleFullWidth = 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaaaaa.png'
              // Subtle gray rim around each card image so the photo doesn't bleed
              // straight into the card surface.
              const imgRim = '1px solid rgba(0,0,0,0.18)'
              const cardBg = donutCardStyles?.background || '#ffffff'
              const cardBdf = donutCardStyles?.backdropFilter || 'none'
              const cardTxt = donutCardStyles?.textColor || '#1a1a1a'
              const frameCol = donutFrameAccent
              const promoCol = donutPromoBarColor
              const dimTxt = cardTxt === '#fff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'
              const cardBase = { background: cardBg, backdropFilter: cardBdf, WebkitBackdropFilter: cardBdf, color: cardTxt, boxShadow: `inset 4px 0 0 ${frameCol}`, borderRadius: 10, overflow: 'hidden', position: 'relative' }
              // Add-to-Cart preview — reflects the live shape / colour / text settings.
              const btnBg = donutAddBtnBg
              const btnTxt = donutAddBtnTextColor
              const AddBtn = ({ size = 22 }) => (
                donutAddBtnShape === 'pill' ? (
                  <div style={{ height: size, padding: '0 ' + Math.round(size * 0.45) + 'px', borderRadius: size / 2, background: btnBg, color: btnTxt, fontSize: Math.max(13, Math.round(size * 0.45)), fontWeight: 800, display: 'inline-flex', alignItems: 'center', flexShrink: 0, lineHeight: 1, whiteSpace: 'nowrap' }}>{donutAddBtnText}</div>
                ) : (
                  <div style={{ width: size, height: size, borderRadius: size / 2, background: btnBg, color: btnTxt, fontSize: Math.max(13, Math.round(size * 0.65)), fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>+</div>
                )
              )
              // Donut theme bg URL (same as THEME_PRESETS['donut'].img). The
              // preview container paints this as a LOCAL background so the
              // glass cards blur the same pink surface they'll blur in the
              // live customer view — instead of blurring the Design Studio's
              // dark glass overlay, which was distorting the effect.
              const previewBg = 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_52_32-pm.png'
              return (
                <div style={{ margin: '0 14px 14px', borderRadius: 16, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.06)', isolation: 'isolate' }}>
                  {/* Local donut bg — what each glass card blurs */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${previewBg}")`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
                  {/* Lightweight scrim so the preview-label text is readable
                      without overpowering the bg for the glass-blur cards. */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 0 }} />
                  <div style={{ position: 'relative', zIndex: 1, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Live preview · all 3 layouts</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* HORIZONTAL — image left + body right, mirrors real card layout */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 4 }}>Horizontal</div>
                      <div style={{ ...cardBase, display: 'flex', gap: 8, padding: 8, paddingTop: 22 }}>
                        {/* Active perk top strip */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, background: promoCol, color: '#fff', fontSize: 13, fontWeight: 800, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>🎁 Buy 1 Get 1</div>
                        <img src={sampleLandscape} alt="" onError={imgError('food')} style={{ width: 60, height: 60, marginLeft: 4, borderRadius: 6, objectFit: 'contain', background: '#f5f5f5', flexShrink: 0, border: imgRim }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: cardTxt, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sample.name}</div>
                          <div style={{ fontSize: 13, color: dimTxt, marginTop: 2, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sample.desc}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: frameCol }}>Rp {sample.price.toLocaleString()}</span>
                            <AddBtn />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GRID — image top, body below, price-row at the bottom */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 4 }}>Grid</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[0, 1].map(i => (
                          <div key={i} style={{ ...cardBase }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 16, background: promoCol, color: '#fff', fontSize: 13, fontWeight: 800, padding: '0 6px', display: 'flex', alignItems: 'center', gap: 3, zIndex: 2 }}>🎁 Buy 1 Get 1</div>
                            <img src={sampleLandscape} alt="" onError={imgError('food')} style={{ width: 'calc(100% - 4px)', marginLeft: 4, aspectRatio: '4 / 3', objectFit: 'contain', background: '#f5f5f5', display: 'block', border: imgRim }} />
                            <div style={{ padding: '6px 8px 8px' }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: cardTxt, marginBottom: 3, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sample.name}</div>
                              <div style={{ fontSize: 13, color: dimTxt, marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sample.desc}</div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: frameCol }}>Rp {sample.price.toLocaleString()}</span>
                                <AddBtn size={22} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FULL WIDTH — wide image, body below with name + desc + price row */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 4 }}>Full Width</div>
                      <div style={{ ...cardBase }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, background: promoCol, color: '#fff', fontSize: 13, fontWeight: 800, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, zIndex: 2 }}>🎁 Buy 1 Get 1 — 12h left</div>
                        <img src={sampleFullWidth} alt="" onError={imgError('food')} style={{ width: 'calc(100% - 4px)', marginLeft: 4, height: 'auto', display: 'block', background: '#f5f5f5', border: imgRim }} />
                        <div style={{ padding: '10px 12px 12px' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: cardTxt, marginBottom: 3, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sample.name}</div>
                          <div style={{ fontSize: 13, color: dimTxt, marginBottom: 6, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sample.desc}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: frameCol }}>Rp {sample.price.toLocaleString()}</span>
                            <AddBtn size={26} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>{/* end content z:1 wrapper */}
                  </div>{/* end preview container */}
                </div>
              )
            })()}

            {/* Card Style picker */}
            <div style={{ margin: '0 14px 12px', padding: 14, borderRadius: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Card Background</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Pick how every menu card renders. Updates Grid, Horizontal, and Full Width.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
                {[
                  { id: 'solid', label: 'Solid' },
                  { id: 'glass', label: 'Glass' },
                  { id: 'frosted', label: 'Frosted' },
                  { id: 'image', label: 'Image' },
                ].map(opt => {
                  const isActive = donutCardStyle === opt.id
                  return (
                    <button key={opt.id} type="button" onClick={() => setDonutCardStyle(opt.id)} style={{ padding: '10px 4px', borderRadius: 10, border: isActive ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', background: isActive ? accent : 'rgba(0,0,0,0.55)', backdropFilter: !isActive ? 'blur(12px)' : 'none', WebkitBackdropFilter: !isActive ? 'blur(12px)' : 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}>{opt.label}</button>
                  )
                })}
              </div>
              {/* Color swatch — drives Solid bg + Glass/Frosted tint */}
              {donutCardStyle !== 'image' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{donutCardStyle === 'solid' ? 'Card colour' : 'Tint colour'}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                    {['#ffffff', '#FFF8F0', '#FCE7F3', '#FBCFE8', '#F9A8D4', '#FCD34D', '#FACC15', '#D4A373', '#A78BFA', '#7DD3FC', '#1a1a1a'].map(c => (
                      <button key={c} type="button" onClick={() => setDonutCardColor(c)} style={{ width: 36, height: 36, borderRadius: 18, border: donutCardColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0 }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input key={donutCardColor} defaultValue={donutCardColor} placeholder="#ffffff" maxLength={7} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none' }} onKeyDown={e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setDonutCardColor(v) } }} />
                    <button onClick={(e) => { const v = e.currentTarget.previousSibling.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setDonutCardColor(v) }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Set</button>
                  </div>
                  <button type="button" onClick={() => setColorPalette({ title: donutCardStyle === 'solid' ? 'Card colour' : 'Tint colour', current: donutCardColor, onPick: setDonutCardColor })} style={{ width: '100%', background: 'none', border: `1px solid ${accent}`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, minHeight: 44 }}>🎨 More colours →</button>
                </>
              )}
              {/* Image upload — drives the Image card style */}
              {donutCardStyle === 'image' && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 70, height: 70, borderRadius: 10, background: donutCardImage ? '#000' : `${accent}20`, border: donutCardImage ? '1px solid rgba(255,255,255,0.1)' : `2px dashed ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {donutCardImage ? <img src={donutCardImage} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🖼️</span>}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ padding: '10px 14px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {donutCardImage ? 'Change image' : '+ Upload image'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files[0]
                        if (!file) return
                        e.target.value = ''
                        const url = await uploadMenuImage(vendorId, file)
                        if (url) setDonutCardImage(url)
                      }} />
                    </label>
                    {donutCardImage && (
                      <button onClick={() => setDonutCardImage('')} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}>Remove image</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Frame side color */}
            <div style={{ margin: '0 14px 12px', padding: 14, borderRadius: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Frame Side Colour</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Left accent stripe + price colour on every card.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                {[accent, '#DB2777', '#EC4899', '#F472B6', '#FACC15', '#F97316', '#10B981', '#3B82F6', '#A855F7', '#1a1a1a', '#ffffff'].map((c, i) => (
                  <button key={c + i} type="button" onClick={() => setDonutFrameColor(i === 0 ? '' : c)} style={{ width: 36, height: 36, borderRadius: 18, border: (donutFrameColor === c || (i === 0 && !donutFrameColor)) ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0, position: 'relative' }}>{i === 0 && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 13, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>T</span>}</button>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>"T" = theme accent (pink). Tap to reset.</div>
              {/* Contrast warning: frame stripe vs card bg */}
              {(() => {
                const cardBg = donutCardStyle === 'image' ? '#888888' : donutCardColor
                const ratio = wcagContrastRatio(donutFrameAccent, cardBg)
                if (ratio >= 3.0) return null
                return (
                  <div style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', fontSize: 13, color: '#FCA5A5', fontWeight: 600, lineHeight: 1.4 }}>
                    ⚠️ Low contrast — frame stripe may be hard to see against your card colour ({ratio.toFixed(1)}:1, need ≥ 3:1).
                  </div>
                )
              })()}
              <button type="button" onClick={() => setColorPalette({ title: 'Frame Side Colour', current: donutFrameColor || accent, onPick: setDonutFrameColor })} style={{ width: '100%', background: 'none', border: `1px solid ${accent}`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, minHeight: 44 }}>🎨 More colours →</button>
            </div>

            {/* Add-to-Cart button — shape / colour / text colour / label */}
            <div style={{ margin: '0 14px 12px', padding: 14, borderRadius: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Add-to-Cart Button</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Shape, color, and text — applies to every menu card.</div>
              {/* Shape */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Shape</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                {[
                  { id: 'circle', label: 'Round +' },
                  { id: 'pill', label: 'Pill — Add to Cart' },
                ].map(opt => {
                  const isActive = donutAddBtnShape === opt.id
                  return (
                    <button key={opt.id} type="button" onClick={() => setDonutAddBtnShape(opt.id)} style={{ padding: '10px 4px', borderRadius: 10, border: isActive ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', background: isActive ? accent : 'rgba(0,0,0,0.55)', backdropFilter: !isActive ? 'blur(12px)' : 'none', WebkitBackdropFilter: !isActive ? 'blur(12px)' : 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}>{opt.label}</button>
                  )
                })}
              </div>
              {/* Button text (only relevant for pill) */}
              {donutAddBtnShape === 'pill' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Button text (max 16 chars)</div>
                  <input value={donutAddBtnText} maxLength={16} onChange={e => setDonutAddBtnText(e.target.value)} placeholder="Add to Cart" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                </>
              )}
              {/* Button bg color */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Button colour</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                {[donutPromoBarColor, '#DB2777', '#EC4899', '#FACC15', '#F97316', '#10B981', '#3B82F6', '#A855F7', '#1a1a1a', '#ffffff'].map((c, i) => (
                  <button key={c + i} type="button" onClick={() => setDonutAddBtnColor(i === 0 ? '' : c)} style={{ width: 36, height: 36, borderRadius: 18, border: (donutAddBtnColor === c || (i === 0 && !donutAddBtnColor)) ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0, position: 'relative' }}>{i === 0 && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 13, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>T</span>}</button>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>"T" = match promo bar colour. Tap to reset.</div>
              {/* Contrast warning: button bg vs button text */}
              {(() => {
                const ratio = wcagContrastRatio(donutAddBtnBg, donutAddBtnTextColor)
                if (ratio >= 4.5) return null
                return (
                  <div style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', fontSize: 13, color: '#FCA5A5', fontWeight: 600, lineHeight: 1.4 }}>
                    ⚠️ Low contrast — button text may be hard to read on this button colour ({ratio.toFixed(1)}:1, need ≥ 4.5:1).
                  </div>
                )
              })()}
              <button type="button" onClick={() => setColorPalette({ title: 'Button colour', current: donutAddBtnColor || donutPromoBarColor, onPick: setDonutAddBtnColor })} style={{ width: '100%', background: 'none', border: `1px solid ${accent}`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, minHeight: 44, marginBottom: 12 }}>🎨 More colours →</button>
              {/* Button text/icon color */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{donutAddBtnShape === 'pill' ? 'Text colour' : '+ icon colour'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                {['#ffffff', '#1a1a1a', '#FACC15', '#FCE7F3', '#DB2777', '#10B981', '#3B82F6'].map(c => (
                  <button key={c} type="button" onClick={() => setDonutAddBtnTextColor(c)} style={{ width: 36, height: 36, borderRadius: 18, border: donutAddBtnTextColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
              <button type="button" onClick={() => setColorPalette({ title: donutAddBtnShape === 'pill' ? 'Text colour' : '+ icon colour', current: donutAddBtnTextColor, onPick: setDonutAddBtnTextColor })} style={{ width: '100%', background: 'none', border: `1px solid ${accent}`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, minHeight: 44 }}>🎨 More colours →</button>
            </div>

            {/* Promo bar color */}
            <div style={{ margin: '0 14px 24px', padding: 14, borderRadius: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Promo Bar Colour</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Bar at the bottom of the menu showing your promo / running text.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
                {[accent, '#DB2777', '#EC4899', '#F472B6', '#FACC15', '#F97316', '#10B981', '#3B82F6', '#A855F7', '#1a1a1a'].map((c, i) => (
                  <button key={c + i} type="button" onClick={() => setDonutPromoColor(i === 0 ? '' : c)} style={{ width: 36, height: 36, borderRadius: 18, border: (donutPromoColor === c || (i === 0 && !donutPromoColor)) ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0, position: 'relative' }}>{i === 0 && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 13, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>T</span>}</button>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>"T" = theme accent (pink). Tap to reset.</div>
              <button type="button" onClick={() => setColorPalette({ title: 'Promo Bar Colour', current: donutPromoColor || accent, onPick: setDonutPromoColor })} style={{ width: '100%', background: 'none', border: `1px solid ${accent}`, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, minHeight: 44 }}>🎨 More colours →</button>
            </div>
          </div>

          {/* Full color palette side drawer — opens whenever a "More colours"
              link sets `colorPalette`. Slides in from the right with a curated
              55-color grid + custom hex entry. The picker section that opened
              it stays mounted underneath, so close = back to the picker. */}
          {colorPalette && (() => {
            // Same 27-hue-row × 6-shade pattern used by the Theme Editor at
            // line ~5277 — HSL-organised so the vendor can find the exact
            // tint/shade they want by hue family rather than picking from a
            // flat random grid.
            function hslToHex(h, s, l) {
              s /= 100; l /= 100
              const a = s * Math.min(l, 1 - l)
              const f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))) }
              return '#' + [f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('')
            }
            const HUE_ROWS = [
              { label: 'Red', h: 0 }, { label: 'Crimson', h: 345 }, { label: 'Rose', h: 330 }, { label: 'Pink', h: 315 },
              { label: 'Magenta', h: 300 }, { label: 'Fuchsia', h: 285 }, { label: 'Purple', h: 270 }, { label: 'Violet', h: 255 },
              { label: 'Indigo', h: 240 }, { label: 'Blue', h: 220 }, { label: 'Sky', h: 200 }, { label: 'Cyan', h: 185 },
              { label: 'Teal', h: 170 }, { label: 'Mint', h: 155 }, { label: 'Green', h: 140 }, { label: 'Emerald', h: 120 },
              { label: 'Lime', h: 90 }, { label: 'Chartreuse', h: 75 }, { label: 'Yellow', h: 55 }, { label: 'Gold', h: 45 },
              { label: 'Amber', h: 35 }, { label: 'Orange', h: 25 }, { label: 'Vermilion', h: 12 },
              { label: 'Brown', h: 20, sat: 60 }, { label: 'Maroon', h: 0, sat: 70 },
              { label: 'Grey', h: 0, sat: 0 }, { label: 'Cool Grey', h: 210, sat: 10 },
            ]
            const close = () => setColorPalette(null)
            return (
              <>
                <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300 }} />
                <div role="dialog" aria-label="Colour palette" style={{ position: 'fixed', top: 0, left: 0, width: '80%', maxWidth: 360, height: '100vh', zIndex: 502, overflowY: 'auto', background: '#111', boxShadow: '12px 0 40px rgba(0,0,0,0.55)' }}>
                  {/* Sticky header: title + hex input — matches Theme Editor's
                      "Pick Color" drawer pattern. */}
                  <div style={{ padding: '16px 12px 0', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{colorPalette.title || 'Pick Colour'}</span>
                      <button onClick={close} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: 8 }}>✕</button>
                    </div>
                    {/* Hex input row */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: colorPalette.current || '#1a1a1a', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                      <input type="text" placeholder="#8B0000" defaultValue={colorPalette.current} maxLength={7} style={{ flex: 1, padding: '7px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', outline: 'none' }} onKeyDown={e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) { colorPalette.onPick(v); close() } } }} />
                      <button onClick={(e) => { const v = e.currentTarget.previousSibling.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) { colorPalette.onPick(v); close() } }} style={{ padding: '7px 10px', borderRadius: 6, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Go</button>
                    </div>
                  </div>
                  {/* Hue × shade rows */}
                  <div style={{ padding: '0 8px 20px' }}>
                    {HUE_ROWS.map((row, ri) => {
                      const s = row.sat !== undefined ? row.sat : 80
                      const shades = row.sat === 0 || row.sat === 10
                        ? [12, 25, 40, 55, 72, 88].map(l => hslToHex(row.h, row.sat, l))
                        : [18, 30, 42, 54, 66, 80].map(l => hslToHex(row.h, l < 25 ? s + 10 : l > 70 ? s - 20 : s, l))
                      return (
                        <div key={ri} style={{ marginBottom: 5 }}>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 2, paddingLeft: 2 }}>{row.label}</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {shades.map((c, ci) => (
                              <button key={ci} onClick={() => { colorPalette.onPick(c); close() }} style={{
                                flex: 1, height: 36, borderRadius: 6,
                                border: colorPalette.current === c ? '2px solid #fff' : 'none',
                                background: c, cursor: 'pointer', padding: 0, minWidth: 0,
                              }} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {designStudio && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setDesignStudio(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Design Studio</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Customise your app appearance</div>
              </div>
            </div>

            {/* Choose Landing Theme — first step. Opens a curated theme picker; vendor's pick saves to landing_theme_id. */}
            <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFD600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>Step 1</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Choose Landing Theme</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.45 }}>
                Pick the look of your storefront. The colours from your theme apply across your whole shop — landing, menu, buttons.
              </div>
              <button
                onClick={() => { setLandingThemePicker(true) }}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${accent}`, background: `${accent}22`, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Browse themes</span>
                <span style={{ fontSize: 18, color: accent }}>›</span>
              </button>
            </div>

            {/* Logo Style */}
            <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Logo Style</div>
              {/* Upload Logo — feeds the same shopLogo state used by Shop Config.
                  On donut theme the logo doesn't render in the landing (frozen
                  HTML has its own hero) — only the in-app header consumes it,
                  which is fine for every theme. */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, padding: shopLogoStyle === 'bare' ? 0 : 10, borderRadius: 12, background: shopLogoStyle === 'bare' ? 'transparent' : 'rgba(255,255,255,0.04)', border: shopLogoStyle === 'bare' ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                {/* Honour the picked Logo Style so this preview tile matches the
                    actual landing page. "No Circle" → bare PNG with no
                    wrapper background AND no surrounding row container. */}
                {shopLogo ? (
                  shopLogoStyle === 'bare' ? (
                    <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
                  ) : shopLogoStyle === 'off' ? (
                    <div style={{ width: 56, height: 56, borderRadius: 28, border: '1px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 4px', textAlign: 'center' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600, lineHeight: 1.2 }}>Off</span>
                    </div>
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 28, background: accent, border: '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover' }} />
                    </div>
                  )
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 28, background: `${accent}20`, border: `2px dashed ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 22 }}>📷</span>
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ padding: '10px 14px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {shopLogo ? 'Change logo' : '+ Upload logo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      e.target.value = ''
                      const url = await uploadMenuImage(vendorId, file)
                      if (url) { setShopLogo(url); try { localStorage.setItem('foodlocalchat_shopLogo', url) } catch {} }
                    }} />
                  </label>
                  {shopLogo && (
                    <button onClick={() => { setShopLogo(''); try { localStorage.removeItem('foodlocalchat_shopLogo') } catch {} }} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                {[
                  { id: 'circle', label: 'Circle' },
                  { id: 'bare', label: 'No Circle' },
                  { id: 'off', label: 'Off' },
                ].map(opt => (
                  <button type="button" key={opt.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShopLogoStyle(opt.id) }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: shopLogoStyle === opt.id ? accent : 'rgba(255,255,255,0.08)', color: shopLogoStyle === opt.id ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 44 }}>{opt.label}</button>
                ))}
              </div>
              {shopLogoStyle !== 'off' && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>{shopLogoStyle === 'circle' ? 'Circle Size' : 'Logo Size'} ({logoScale}%)</label>
                  <input className="overlay-slider" type="range" min="50" max="300" step="10" value={logoScale} onChange={(e) => setLogoScale(Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.45) ${((logoScale - 50) / 250) * 100}%, rgba(255,255,255,0.15) ${((logoScale - 50) / 250) * 100}%, rgba(255,255,255,0.15) 100%)`, marginBottom: 10 }} />
                  {shopLogoStyle === 'circle' && (
                    <>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Logo Inside Circle ({logoInner}%)</label>
                      <input className="overlay-slider" type="range" min="40" max="100" step="2" value={logoInner} onChange={(e) => setLogoInner(Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.45) ${((logoInner - 40) / 60) * 100}%, rgba(255,255,255,0.15) ${((logoInner - 40) / 60) * 100}%, rgba(255,255,255,0.15) 100%)`, marginBottom: 10 }} />
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Logo Position</label>
                      {(() => {
                        // Match the phone-preview formula exactly so the circle here
                        // is the same pixel size as the one in the iPhone preview.
                        const PHONE_RATIO = 220 / 360
                        const PHONE_MAX = 220 - 20  // phone preview is 220px wide, 10px padding each side
                        const targetOuter = Math.round(156 * (logoScale / 100) * PHONE_RATIO)
                        const prevOuter = Math.min(PHONE_MAX, targetOuter)
                        const prevInner = Math.round(prevOuter * logoInner / 100)
                        const prevOffX = logoOffsetX * PHONE_RATIO
                        const prevOffY = logoOffsetY * PHONE_RATIO
                        return (
                          <div style={{ position: 'relative', minHeight: Math.max(prevOuter, 140) + 8, marginBottom: 6 }}>
                            {/* Live circle preview — left, matches phone preview pixel-for-pixel */}
                            <div style={{ width: prevOuter, height: prevOuter, borderRadius: prevOuter / 2, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.4)', transition: 'width 0.15s ease, height 0.15s ease' }}>
                              {shopLogo ? (
                                <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: prevInner, height: prevInner, objectFit: 'contain', transform: `translate(${prevOffX}px, ${prevOffY}px)`, transition: 'width 0.15s ease, height 0.15s ease' }} />
                              ) : (
                                <div style={{ fontSize: Math.round(prevOuter * 0.32), fontWeight: 900, color: '#fff' }}>{(shopName || '?').charAt(0)}</div>
                              )}
                            </div>
                            {/* Arrow pad — absolutely anchored to the right, fixed size */}
                            <div style={{ position: 'absolute', top: 0, right: 0, width: 144, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                              <div />
                              <button type="button" onClick={() => setLogoOffsetY(v => Math.max(-40, v - 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)' }}>↑</button>
                              <div />
                              <button type="button" onClick={() => setLogoOffsetX(v => Math.max(-40, v - 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)' }}>←</button>
                              <button type="button" onClick={() => { setLogoOffsetX(0); setLogoOffsetY(0) }} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.25)' }}>•</button>
                              <button type="button" onClick={() => setLogoOffsetX(v => Math.min(40, v + 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)' }}>→</button>
                              <div />
                              <button type="button" onClick={() => setLogoOffsetY(v => Math.min(40, v + 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)' }}>↓</button>
                              <div />
                            </div>
                          </div>
                        )
                      })()}
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>X: {logoOffsetX}px · Y: {logoOffsetY}px · tap • to reset</div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Hero Text Editor — open button */}
            <div style={{ margin: '0 14px 12px' }}>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHeroEditor(true); setDesignStudio(false) }} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${accent}40`, background: 'rgba(0,0,0,0.65)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: '#fff', fontWeight: 900 }}>T</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{landingThemeId === 'donuts' ? 'Landing Page Edit' : 'Hero Text Editor'}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{landingThemeId === 'donuts' ? 'Text, images, colours, size, font' : 'Font, size, color, effects'}</div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
              </button>
            </div>

            {/* Phone Preview + Toolbar — no wrapping container, sits directly on glass bg */}
            <div style={{ margin: '0 14px 12px', padding: 0 }}>
              {(() => {
                const HERO_FONTS_C = { system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', nunito: '"Nunito", sans-serif', poppins: '"Poppins", sans-serif', playfair: '"Playfair Display", serif', caveat: '"Caveat", cursive', bebas: '"Bebas Neue", sans-serif' }
                const ffC = HERO_FONTS_C[heroFont] || HERO_FONTS_C.system
                const btnR = btnShape === 'pill' ? 30 : btnShape === 'square' ? 4 : 12
                const bColor = btnColor || accent
                const previewTab = configPreviewTab
                const TOOLS = [
                  { id: 'layout', svg: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z', label: 'Layout', page: 'landing' },
                  { id: 'button', svg: 'M19 6H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm0 10H5V8h14v8z', label: 'Button', page: 'landing' },
                  { id: 'text', svg: 'M5 4v3h5.5v12h3V7H19V4H5z', label: 'Text', page: 'landing' },
                  { id: 'cards', svg: 'M4 5h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4z', label: 'Cards', page: 'menu' },
                  { id: 'promo', svg: 'M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm0 14H5.17L4 17.17V4h16v12z', label: 'Promo', page: 'menu' },
                  { id: 'splash', svg: 'M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z', label: 'More', page: 'landing' },
                ]

                return (
                  <>
                    <style>{`
                      @keyframes promoScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                      @keyframes promoPreviewWave { 0% { transform: translateX(100%) translateY(0); } 25% { transform: translateX(50%) translateY(-3px); } 50% { transform: translateX(0%) translateY(0); } 75% { transform: translateX(-50%) translateY(3px); } 100% { transform: translateX(-100%) translateY(0); } }
                      @keyframes promoPreviewGlow { 0%, 100% { text-shadow: 0 0 2px rgba(156,163,175,0.4); } 50% { text-shadow: 0 0 6px rgba(156,163,175,0.95), 0 0 10px rgba(156,163,175,0.5); } }
                      @keyframes promoPreviewPulse { 0%, 100% { transform: translateX(100%) scale(1); } 50% { transform: translateX(0%) scale(1.08); } }
                      @keyframes promoPreviewFade { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
                      @keyframes promoPreviewShake { 0%, 100% { transform: translateX(100%); } 10% { transform: translateX(95%) translateY(-0.5px); } 20% { transform: translateX(85%) translateY(0.5px); } 50% { transform: translateX(0%) translateY(-0.5px); } 80% { transform: translateX(-85%) translateY(0.5px); } 90% { transform: translateX(-95%) translateY(-0.5px); } }
                    `}</style>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                      {/* iPhone Frame */}
                      <div style={{ width: 220, height: 420, borderRadius: 32, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 8px 30px ${accent}15, 0 4px 12px rgba(0,0,0,0.3)`, border: '2px solid #333', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', right: -3, top: 85, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                        <div style={{ position: 'absolute', left: -3, top: 72, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                        <div style={{ position: 'absolute', left: -3, top: 96, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                        <div style={{ width: '100%', height: '100%', borderRadius: 29, overflow: 'hidden', position: 'relative', background: '#000' }}>
                          <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 52, height: 14, background: '#000', borderRadius: 10, zIndex: 10 }} />
                          {previewTab === 'landing' && landingThemeId === 'donuts' && (
                            // Donut theme uses a curated frozen HTML snapshot — its own
                            // bg, hero text, logo, and CTA are baked in. The generic
                            // customisable mock below would misrepresent what the real
                            // landing shows, so render the actual donut HTML in the
                            // preview phone too (same donutsHtmlSrc — includes any
                            // uploaded hero image). fit="contain" so the whole donut
                            // design is visible.
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <DonutSplash landing={donutLanding} onEnter={() => {}} fit="cover" />
                            </div>
                          )}
                          {previewTab === 'landing' && landingThemeId !== 'donuts' && (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <img src={(THEME_PRESETS.find(t => t.id === shopTheme) || {}).img || localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                              <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})` }} />
                              {!shopOpen && <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', background: '#EF4444', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 13, fontWeight: 800, zIndex: 5 }}>CLOSED</div>}
                              <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: landingLayout === 'footer' ? 'flex-end' : 'center', paddingBottom: landingLayout === 'footer' ? 54 : 0 }}>
                                {shopLogoStyle !== 'off' && shopLogo ? (() => {
                                  // Preview phone is 220px wide vs real ~360px → ratio 0.611 for WYSIWYG.
                                  const PHONE_RATIO = 220 / 360
                                  const sc = (logoScale / 100) * PHONE_RATIO
                                  const pBare = Math.round(200 * sc)
                                  const pOuter = Math.round(156 * sc)
                                  const pInner = Math.round(pOuter * logoInner / 100)
                                  const pX = logoOffsetX * PHONE_RATIO
                                  const pY = logoOffsetY * PHONE_RATIO
                                  return shopLogoStyle === 'bare'
                                    ? <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: pBare, height: pBare, maxWidth: 'calc(100% - 20px)', maxHeight: '50%', objectFit: 'contain', marginBottom: 6, transform: `translate(${pX}px, ${pY}px)` }} />
                                    : <div style={{ width: pOuter, height: pOuter, maxWidth: 'calc(100% - 20px)', maxHeight: '50%', borderRadius: pOuter / 2, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                                        <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: pInner, height: pInner, objectFit: 'contain', transform: `translate(${pX}px, ${pY}px)` }} />
                                      </div>
                                })() : shopLogoStyle !== 'off' ? (() => {
                                  const PHONE_RATIO = 220 / 360
                                  const fs = Math.round(90 * (logoScale / 100) * PHONE_RATIO)
                                  return <div style={{ width: fs, height: fs, borderRadius: fs / 2, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(40 * (logoScale / 100) * PHONE_RATIO), fontWeight: 900, color: '#fff', marginBottom: 6 }}>{shopName.charAt(0)}</div>
                                })() : null}
                                <div style={{ fontSize: 17, fontWeight: 800, color: heroColor, fontFamily: ffC, textAlign: landingLayout === 'left' ? 'left' : 'center', textShadow: '0 1px 3px rgba(0,0,0,0.9)', lineHeight: 1.1, padding: '0 8px' }}>{shopName}</div>
                                {(() => {
                                  const lines = (customTagline || shopFoodType).split('\n').filter(l => l.length > 0).slice(0, 2)
                                  return (
                                    <div style={{ padding: '0 8px', width: '100%', boxSizing: 'border-box' }}>
                                      {lines.map((line, i) => (
                                        <div key={i} style={{ fontSize: 13, color: heroSubColor || 'rgba(255,255,255,0.8)', fontFamily: ffC, marginTop: i === 0 ? 3 : 0, textShadow: '0 1px 2px rgba(0,0,0,0.9)', textAlign: 'center', wordBreak: 'break-word' }}>{line}</div>
                                      ))}
                                    </div>
                                  )
                                })()}
                                <div style={{
                                  position: 'absolute', bottom: 20, left: 0, right: 0,
                                  display: 'flex', justifyContent: 'center', pointerEvents: 'none',
                                }}>
                                  <div style={{
                                    position: 'relative', pointerEvents: 'auto',
                                    padding: `${Math.round(5 * btnSize / 100)}px ${Math.round(16 * btnSize / 100)}px`,
                                    borderRadius: btnR,
                                    background: bColor,
                                    fontSize: Math.round(9 * btnSize / 100), fontWeight: 700, color: '#fff', overflow: 'visible',
                                    whiteSpace: 'nowrap',
                                    transformOrigin: 'center center',
                                    ...(btnEffect === 'shake' ? { animation: 'btnShake 1s ease-in-out infinite' } : {}),
                                    ...(btnEffect === 'heartbeat' ? { animation: 'btnHeartbeat 1.2s ease-in-out infinite' } : {}),
                                  }}>
                                    {btnEffect === 'glow' && (
                                      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: btnR, pointerEvents: 'none' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)', animation: 'btnRunningGlow 2s linear infinite' }} />
                                      </div>
                                    )}
                                    {btnEffect === 'signal' && (
                                      <>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', borderRadius: btnR, border: `1.5px solid ${bColor}`, zIndex: -1, pointerEvents: 'none', animation: 'btnSignalPing 1.6s ease-out infinite' }} />
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', borderRadius: btnR, border: `1.5px solid ${bColor}`, zIndex: -1, pointerEvents: 'none', animation: 'btnSignalPing 1.6s ease-out infinite', animationDelay: '0.8s' }} />
                                      </>
                                    )}
                                    <span style={{ position: 'relative' }}>{btnText || 'View Menu'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {previewTab === 'menu' && (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
                              <div style={{ position: 'relative', zIndex: 2, padding: '24px 8px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><div style={{ width: 18, height: 18, borderRadius: 9, background: accent }} /><div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{shopName}</div></div>
                                {promoBanner && (() => {
                                  const pvAnim = { scroll: 'promoScroll 6s linear infinite', wave: 'promoPreviewWave 6s ease-in-out infinite', glow: 'promoScroll 6s linear infinite, promoPreviewGlow 2s ease-in-out infinite', pulse: 'promoPreviewPulse 6s ease-in-out infinite', fade: 'promoScroll 6s linear infinite, promoPreviewFade 2.5s ease-in-out infinite', shake: 'promoPreviewShake 6s linear infinite' }[promoBannerEffect] || 'promoScroll 6s linear infinite'
                                  return <div style={{ padding: '2px 8px', marginBottom: 5, overflow: 'hidden', opacity: promoBannerEnabled ? 1 : 0.35, position: 'relative' }}><div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 700, whiteSpace: 'nowrap', animation: pvAnim, display: 'inline-block' }}>{promoBanner}</div>{!promoBannerEnabled && <div style={{ position: 'absolute', top: 1, right: 3, fontSize: 13, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '0 3px', borderRadius: 2, letterSpacing: 0.5 }}>OFF</div>}</div>
                                })()}
                                {menuBanners.length > 0 && (
                                  <>
                                    {/* Hero banner in the preview phone — sized to match the
                                        native 3:1 landscape aspect of menu banners (220px wide
                                        × ~70px tall). The real menu banner above the customer
                                        menu uses its own native size. */}
                                    <div style={{ position: 'relative', width: '100%', height: 70, borderRadius: 6, overflow: 'hidden', marginBottom: menuBanners.length > 1 ? 4 : 6 }}>
                                      {menuBanners.map((url, i) => (
                                        <img key={url + i} src={url} alt="" onError={imgError('banner')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === menuBannerIdx ? 1 : 0, transition: 'opacity 0.6s ease' }} />
                                      ))}
                                    </div>
                                    {menuBanners.length > 1 && (
                                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 5 }}>
                                        {menuBanners.map((_, i) => (
                                          <div key={i} style={{ width: 10, height: 2, borderRadius: 1, background: i === menuBannerIdx ? accent : 'rgba(255,255,255,0.3)', transition: 'background 0.3s ease' }} />
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                                {menuCardStyle === 'grid' ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>{[1,2,3,4].map(i => <div key={i} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4 }}><div style={{ width: '100%', height: 32, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 3 }} /><div style={{ height: 5, width: '70%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '40%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div>)}</div>
                                ) : menuCardStyle === 'fullwidth' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[1,2].map(i => <div key={i} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}><div style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.1)' }} /><div style={{ padding: 4 }}><div style={{ height: 5, width: '60%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '30%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div></div>)}</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[1,2,3].map(i => <div key={i} style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4, borderLeft: `3px solid ${accent}` }}><div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ height: 5, width: '70%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 4, width: '90%', background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '35%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div></div>)}</div>
                                )}
                              </div>
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
                        </div>
                      </div>

                      {/* Side Toolbar — wider buttons so 13px bold labels
                          ("Layout", "Button") don't overflow inside the chip. */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        {TOOLS.map(t => {
                          const isActive = configTool === t.id
                          return (
                            <button key={t.id} onClick={() => { setConfigTool(isActive ? null : t.id); setConfigPreviewTab(t.page) }} style={{ width: 64, height: 56, borderRadius: 14, border: isActive ? '2px solid #FFD600' : '1px solid rgba(255,255,255,0.08)', background: isActive ? '#FFD600' : '#000', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.2s', boxShadow: isActive ? '0 0 12px rgba(255,214,0,0.6), 0 0 20px rgba(255,214,0,0.3)' : 'none', padding: '4px 2px' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive ? '#1a1a1a' : '#fff'}><path d={t.svg} /></svg>
                              <span style={{ fontSize: 13, fontWeight: 800, color: isActive ? '#1a1a1a' : '#fff', letterSpacing: 0.2, lineHeight: 1, whiteSpace: 'nowrap' }}>{t.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Contextual Controls */}
                    {configTool && (
                      <div style={{ padding: 12, borderRadius: 14, border: `1px solid ${accent}30`, background: `${accent}08`, marginTop: 6 }}>
                        {configTool === 'layout' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Layout & Overlay</div><label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Landing Layout</label><div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{[{ id: 'center', label: 'Center' }, { id: 'footer', label: 'Footer' }].map(opt => (<button key={opt.id} onClick={() => setLandingLayout(opt.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: landingLayout === opt.id ? accent : 'rgba(255,255,255,0.08)', color: landingLayout === opt.id ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 40 }}>{opt.label}</button>))}</div><label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Overlay Darkness ({overlayOpacity}%)</label><style>{`.overlay-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;outline:none;cursor:pointer;}.overlay-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;border-radius:13px;background:#DC2626;border:2px solid #FFFFFF;box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 1px 2px rgba(255,255,255,0.25);cursor:pointer;margin-top:-10px;}.overlay-slider::-moz-range-thumb{width:26px;height:26px;border-radius:13px;background:#DC2626;border:2px solid #FFFFFF;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;}.overlay-slider::-webkit-slider-runnable-track{height:6px;border-radius:3px;}.overlay-slider::-moz-range-track{height:6px;border-radius:3px;}`}</style><input className="overlay-slider" type="range" min="0" max="80" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.45) ${(overlayOpacity / 80) * 100}%, rgba(255,255,255,0.15) ${(overlayOpacity / 80) * 100}%, rgba(255,255,255,0.15) 100%)`, marginBottom: 8 }} /></>)}
                        {configTool === 'button' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Button Style</div><label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Shape</label><div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>{['rounded', 'pill', 'square'].map(s => (<button key={s} onClick={() => setBtnShape(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: btnShape === s ? accent : 'rgba(255,255,255,0.08)', color: btnShape === s ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 40 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>))}</div><label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Color</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 4 }}>{[{c: accent, label: 'Theme'}, {c: '#FACC15'}, {c: '#F59E0B'}, {c: '#EF4444'}, {c: '#DC2626'}, {c: '#EC4899'}, {c: '#A855F7'}, {c: '#3B82F6'}, {c: '#06B6D4'}, {c: '#22C55E'}, {c: '#10B981'}, {c: '#1A1A1A'}, {c: '#FFFFFF'}, {c: '#F97316'}].map(({c, label}, i) => { const isPicked = btnColor === c || (i === 0 && !btnColor); return (<button key={i + c} type="button" onClick={() => setBtnColor(i === 0 ? '' : c)} aria-label={label || c} title={label || c} style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '50%', background: c, border: isPicked ? `3px solid #fff` : (i === 0 ? '2px solid rgba(255,215,0,0.6)' : '1px solid rgba(255,255,255,0.18)'), cursor: 'pointer', padding: 0, position: 'relative' }}>{i === 0 && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 13, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)', letterSpacing: 0.5 }}>T</span>}</button>) })}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>The "T" swatch matches your theme accent exactly.</div>{btnColor && <button type="button" onClick={() => setBtnColor('')} style={{ fontSize: 13, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '0 6px', marginBottom: 8 }}>Reset to theme</button>}<label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Button Text</label><input style={{ ...S.input, marginBottom: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} value={btnText} onChange={(e) => setBtnText(e.target.value)} placeholder="View Menu" maxLength={20} /><label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 4, display: 'block' }}>Effect</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 10 }}>{[{ id: 'none', label: 'None' }, { id: 'glow', label: 'Glow' }, { id: 'shake', label: 'Shake' }, { id: 'signal', label: 'Signal' }, { id: 'heartbeat', label: 'Heart' }].map(opt => (<button key={opt.id} onClick={() => setBtnEffect(opt.id)} style={{ padding: '8px 2px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: btnEffect === opt.id ? accent : 'rgba(255,255,255,0.06)', color: btnEffect === opt.id ? '#fff' : 'rgba(255,255,255,0.55)', minHeight: 36 }}>{opt.label}</button>))}</div><label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 4, display: 'block' }}>Size ({btnSize}%)</label><style>{`.size-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;outline:none;cursor:pointer;}.size-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;border-radius:13px;background:#FACC15;border:2px solid #DC2626;box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 1px 2px rgba(255,255,255,0.4);cursor:pointer;margin-top:-10px;}.size-slider::-moz-range-thumb{width:26px;height:26px;border-radius:13px;background:#FACC15;border:2px solid #DC2626;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;}.size-slider::-webkit-slider-runnable-track{height:6px;border-radius:3px;}.size-slider::-moz-range-track{height:6px;border-radius:3px;}`}</style><input className="size-slider" type="range" min="60" max="160" step="5" value={btnSize} onChange={(e) => setBtnSize(Number(e.target.value))} style={{ background: `linear-gradient(to right, #DC2626 0%, #DC2626 ${((btnSize - 60) / 100) * 100}%, rgba(255,255,255,0.18) ${((btnSize - 60) / 100) * 100}%, rgba(255,255,255,0.18) 100%)`, marginBottom: 8 }} /></>)}
                        {configTool === 'text' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Tagline</div><label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Custom Tagline (Enter for line 2 — max 2 lines)</label><textarea value={customTagline} onChange={(e) => { const trimmed = e.target.value.split('\n').slice(0, 2).join('\n').slice(0, 60); setCustomTagline(trimmed) }} placeholder={"Line one\nLine two (optional)"} rows={2} maxLength={60} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, lineHeight: 1.4, outline: 'none', resize: 'none', fontFamily: 'inherit' }} /><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Replaces "{shopFoodType}" on your landing page. Has padding so it never touches the screen edge.</div></>)}
                        {configTool === 'cards' && (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Menu Cards</div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>Card Style</label>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                              {[{ id: 'horizontal', label: 'Horizontal' }, { id: 'grid', label: 'Grid' }, { id: 'fullwidth', label: 'Full Width' }].map(opt => (
                                <button key={opt.id} onClick={() => setMenuCardStyle(opt.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: menuCardStyle === opt.id ? accent : 'rgba(255,255,255,0.08)', color: menuCardStyle === opt.id ? '#fff' : 'rgba(255,255,255,0.7)', minHeight: 44 }}>{opt.label}</button>
                              ))}
                            </div>
                          </>
                        )}
                        {configTool === 'promo' && (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Promo Banner</div>
                            {/* Banner Carousel — moved from the Cards tool to live alongside
                                the running-text promo. Wide landscape PNG/JPG above the menu,
                                up to 5 images, auto-rotates every 4 seconds. */}
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 4, display: 'block' }}>Banner Carousel Above Menu ({menuBanners.length}/5)</label>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, lineHeight: 1.5 }}>Wide landscape image(s) shown above the menu. Add up to 5 — they auto-rotate every 4 seconds with an indicator bar below.</div>
                            <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 800, color: '#fff', background: accent, padding: '6px 10px', borderRadius: 8, marginBottom: 10, letterSpacing: 0.3 }}>📐 Recommended size: 1200 × 400 px</div>
                            {/* Banner thumbnails grid — comes first now (above the action buttons). */}
                            {menuBanners.length > 0 && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                {menuBanners.map((url, i) => (
                                  <div key={url + i} style={{ position: 'relative', width: 'calc(33% - 4px)' }}>
                                    <img src={url} alt="" onError={imgError('banner')} style={{ width: '100%', aspectRatio: '3 / 1', objectFit: 'cover', borderRadius: 6, border: i === menuBannerIdx ? `2px solid ${accent}` : '2px solid transparent' }} />
                                    <button onClick={() => setMenuBanners(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, border: '2px solid #1a1a1a', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Action row — Add Banner left, Clear All as small dark-red on the right. */}
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                              {menuBanners.length < 5 && (
                                <label style={{ padding: '10px 16px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>+ Add Banner
                                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => { const file = e.target.files[0]; if (!file) return; e.target.value = ''; const blobUrl = URL.createObjectURL(file); setMenuBanners(prev => [...prev, blobUrl].slice(0, 5)); const url = await uploadMenuImage(vendorId, file); if (url) { setMenuBanners(prev => prev.map(u => u === blobUrl ? url : u)); URL.revokeObjectURL(blobUrl) } }} />
                                </label>
                              )}
                              {menuBanners.length > 0 && (
                                <button onClick={() => setMenuBanners([])} style={{ marginLeft: 'auto', fontSize: 13, color: '#fff', background: '#8B0000', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '6px 12px', borderRadius: 8, lineHeight: 1, minHeight: 28 }}>Clear All</button>
                              )}
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginBottom: 6 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Running Text Promo</div>
                            </div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Running Text</label>
                            <textarea
                              value={promoBanner}
                              onChange={(e) => setPromoBanner(e.target.value.slice(0, 300))}
                              placeholder={"Free delivery this week!\nPress Enter for another promo\n10% off first order"}
                              rows={3}
                              style={{
                                width: '100%', boxSizing: 'border-box',
                                // Donut theme: tinted black glass per user spec; other themes keep the
                                // original light-translucent input style.
                                background: landingThemeId === 'donuts' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.06)',
                                backdropFilter: landingThemeId === 'donuts' ? 'blur(12px)' : 'none',
                                WebkitBackdropFilter: landingThemeId === 'donuts' ? 'blur(12px)' : 'none',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8, padding: '8px 12px',
                                color: '#fff', fontSize: 13, lineHeight: 1.5,
                                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                                minHeight: 90, marginBottom: 6,
                              }}
                            />
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.4 }}>
                              Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 13 }}>Enter</kbd> for another promo line. Lines join with <span style={{ color: accent, fontWeight: 700 }}> · </span> in the banner. {promoBanner.length}/300
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                              <button onClick={() => setPromoBannerEnabled(!promoBannerEnabled)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: promoBannerEnabled ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                                <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: promoBannerEnabled ? 19 : 3, transition: 'left 0.2s' }} />
                              </button>
                              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Enable</span>
                            </div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Effect</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                              {[
                                { id: 'scroll', label: 'Scroll' },
                                { id: 'wave',   label: 'Wave' },
                                { id: 'glow',   label: 'Glow' },
                                { id: 'pulse',  label: 'Pulse' },
                                { id: 'fade',   label: 'Fade' },
                                { id: 'shake',  label: 'Shake' },
                              ].map(opt => (
                                <button key={opt.id} onClick={() => setPromoBannerEffect(opt.id)} style={{
                                  padding: '8px 4px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                  // Donut theme: unselected = tinted black glass; selected = pink accent.
                                  background: promoBannerEffect === opt.id
                                    ? accent
                                    : (landingThemeId === 'donuts' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.06)'),
                                  backdropFilter: (promoBannerEffect !== opt.id && landingThemeId === 'donuts') ? 'blur(12px)' : 'none',
                                  WebkitBackdropFilter: (promoBannerEffect !== opt.id && landingThemeId === 'donuts') ? 'blur(12px)' : 'none',
                                  color: promoBannerEffect === opt.id ? '#fff' : 'rgba(255,255,255,0.55)',
                                  minHeight: 36,
                                }}>{opt.label}</button>
                              ))}
                            </div>
                          </>
                        )}
                        {configTool === 'splash' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Extra Features</div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => setSplashEnabled(!splashEnabled)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: splashEnabled ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: splashEnabled ? 19 : 3, transition: 'left 0.2s' }} /></button><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Splash Screen (2s branded loading)</span></div></>)}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Done button */}
            <div style={{ padding: '8px 14px 28px' }}>
              <button onClick={() => setDesignStudio(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Custom Domain Page ─── */}
      {domainPage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setDomainPage(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Custom Domain</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>StreetLocal</div>
            </div>

            {/* Current URL Card */}
            <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Your current app link</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  streetlocal.live/{shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30)}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(`streetlocal.live/${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30)}`) }} style={{ width: 40, height: 40, borderRadius: 10, background: accent, border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>📋</button>
              </div>
            </div>

            {/* Pricing Tiers */}
            {[
              {
                name: 'Subdomain',
                badge: '#FFD600',
                example: `${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30)}.streetlocal.live`,
                monthly: 25000,
                setup: 50000,
                tagline: 'Best for getting started',
                features: [
                  'Auto SSL included',
                  'Instant activation',
                  'Professional subdomain URL',
                  'Minimum commitment: 3 months',
                ],
              },
              {
                name: 'Custom Domain',
                badge: '#FFD600',
                example: 'menu.yourbrand.com',
                monthly: 75000,
                setup: 150000,
                tagline: 'Most popular for serious vendors',
                features: [
                  'Use your own domain (you purchase it)',
                  'We provide CNAME record instructions',
                  'SSL auto-provisioned',
                  'Setup fee includes DNS configuration',
                  'Minimum commitment: 3 months',
                ],
              },
              {
                name: 'Full Domain',
                badge: '#FFD600',
                example: 'yourbrand.com',
                monthly: 150000,
                setup: 300000,
                tagline: 'Premium — we handle everything',
                features: [
                  'We buy and manage your domain',
                  'Setup fee includes domain purchase + 1st year registration',
                  'Domain renewal included in monthly price',
                  'Full DNS management, SSL, redirects',
                  'Minimum commitment: 3 months',
                ],
              },
            ].map((tier, i) => (
              <div key={tier.name} style={{ margin: '0 16px 16px', padding: 20, borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: `1px solid ${tier.badge}40` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: `${tier.badge}20`, color: tier.badge, fontSize: 13, fontWeight: 800 }}>Tier {i + 1}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{tier.name}</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: accent, fontWeight: 700, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: `${accent}10`, border: `1px solid ${accent}25` }}>{tier.example}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{fmt(tier.monthly)}<span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>/month</span></div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>Setup fee: {fmt(tier.setup)} (one-time)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tier.badge, marginBottom: 10 }}>{tier.tagline}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                  {tier.features.map((f, j) => (
                    <li key={j} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: accent, fontSize: 14, lineHeight: '18px' }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/6281392000050?text=${encodeURIComponent(`Hi! I'd like the ${tier.name} domain plan for my shop "${shopName}".`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                >
                  Get Started →
                </a>
              </div>
            ))}

            {/* Important Notes */}
            <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Important Notes</div>
              {[
                'Setup fees are non-refundable and cover the configuration work',
                'Minimum 3-month commitment required for all plans',
                'Domain plans are in addition to your app subscription',
                'Cancel anytime after 3 months with 30 days notice',
                'Your app content and menu stay on streetlocal.live even if you cancel the domain',
              ].map((note, i) => (
                <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '5px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#F59E0B', fontSize: 13, lineHeight: '18px' }}>•</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14 }}>FAQ</div>
              {[
                { q: 'Do I need a domain plan?', a: 'No — your app works perfectly at streetlocal.live/yourshop. Domains are optional for vendors who want professional branding.' },
                { q: 'What if I already have a domain?', a: "Choose the Custom Domain plan. You'll keep ownership of your domain — we just point it to your app." },
                { q: 'What happens if I cancel?', a: 'Your app stays active at streetlocal.live. Only the custom domain stops working.' },
              ].map((faq, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: accent, marginBottom: 4 }}>{faq.q}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{faq.a}</div>
                </div>
              ))}
            </div>

            {/* Done button */}
            <div style={{ padding: '8px 16px 28px' }}>
              <button onClick={() => setDomainPage(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TERMS OF LISTING PAGE ═══ */}
      {termsOfListing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <img src={localStorage.getItem('foodlocalchat_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', padding: '20px 16px 40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setTermsOfListing(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Terms Of Listing</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Search listing requirements & benefits</div>
              </div>
            </div>

            {/* Intro */}
            <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Get Found by Local Customers</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Your menu items are searchable on StreetLocal.live. When customers search for food near them, your items appear in the results — but only if your listing meets the quality requirements below.
              </div>
            </div>

            {/* Required fields */}
            <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD600', marginBottom: 10 }}>Required For Each Menu Item</div>
              {[
                { field: 'Item Photo', desc: 'Clear, appetising photo of the dish. Items without photos will NOT appear in search results.' },
                { field: 'Item Name', desc: 'Descriptive name that customers can search for (e.g. "Nasi Goreng Spesial" not "Item 1").' },
                { field: 'Item Price', desc: 'Accurate current price. Promo/discounted items will be highlighted in search.' },
                { field: 'Item Description', desc: 'Short description of ingredients or what the dish includes.' },
                { field: 'Category', desc: 'Correct category (Meal, Drink, Snack, Dessert, Extra) for filtering.' },
                { field: 'Prep Time', desc: 'Estimated preparation time in minutes. Shown to customers before ordering.' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.field}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shop requirements */}
            <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD600', marginBottom: 10 }}>Shop Profile Requirements</div>
              {[
                { field: 'Shop Name', desc: 'Your business name as customers know it.' },
                { field: 'WhatsApp Number', desc: 'Active WhatsApp for receiving orders.' },
                { field: 'Shop Address', desc: 'Accurate address for distance calculation and customer directions.' },
                { field: 'Opening Hours', desc: 'Set your daily schedule so customers know when you are open.' },
                { field: 'Food Type', desc: 'Your main food category (e.g. Indonesian, Coffee, Satay).' },
                { field: 'Delivery Settings', desc: 'Configure delivery radius and pricing, or set to Pickup Only.' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.field}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* What you get */}
            <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD600', marginBottom: 10 }}>What Completed Listings Achieve</div>
              {[
                'Your items appear when customers search by food name, type, or category',
                'Most ordered items are shown first with their photo — the food sells itself',
                'Promo pricing is highlighted with a flashing animation to attract attention',
                'Free delivery vendors are listed first and highlighted prominently',
                'Customers see your prep time, distance, and delivery cost before clicking',
                'Your listing links directly to your app — one tap to browse your full menu',
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: '#FFD600', marginTop: 1 }}>★</span>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{b}</div>
                </div>
              ))}
            </div>

            {/* Customer expectations */}
            <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD600', marginBottom: 10 }}>Customer Expectations</div>
              {[
                'Photos should match the actual food served — misleading images damage trust',
                'Prices must be current — outdated pricing creates a bad customer experience',
                'Prep times should be realistic — underestimating leads to negative reviews',
                'Keep your open/close status accurate — showing "open" when closed frustrates customers',
                'Respond promptly to WhatsApp orders — customers expect confirmation within minutes',
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>⚠️</span>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{e}</div>
                </div>
              ))}
            </div>

            {/* Important notice */}
            <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 14, padding: 16, marginBottom: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Important</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Menu items missing a photo, name, price, or category will be excluded from search results. Incomplete listings do not qualify for search visibility. Keep your menu complete and up to date to maximise orders.
              </div>
            </div>

            <button onClick={() => setTermsOfListing(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Got It</button>
          </div>
        </div>
      )}

      {/* ── Vendor: admin inbox FAB (📨 with unread badge) — replaces wa.me-only contact path ── */}
      {isVendor && !vendorDrawer && (
        <AdminInboxFab
          supabase={supabase}
          vendorId={vendorId}
          vendorName="StreetLocal Admin"
          accent="#FFD600"
          bottom={150}
        />
      )}
    </div>
  )
}
