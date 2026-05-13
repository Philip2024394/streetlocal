/**
 * Shared channel-flip module — used by foodlocal-pro, products-local,
 * services-local, and (next iteration) food-basic.
 *
 * One canonical place that knows:
 *  - The channel schema shape (whatsapp / chat / email)
 *  - Per-app defaults (food = wa + chat; products/services = wa + chat + email)
 *  - How to format an order as a message per channel
 *  - How to route the customer (wa.me link / in-app chat / mailto)
 *
 * Each app:
 *  1. Reads the vendor's `channels` field at customer-facing time.
 *  2. Calls `resolveChannels(vendor, appKind)` to get the effective set
 *     (with defaults filled in).
 *  3. Renders <ChannelPicker /> when multiple enabled, OR auto-routes
 *     via openChannel() when only one is enabled.
 */

// ── Defaults per app kind ─────────────────────────────────────────────────
const DEFAULTS = {
  food: {
    whatsapp: { enabled: true,  phone: '' },
    chat:     { enabled: true },
    email:    { enabled: false, address: '' },
  },
  products: {
    whatsapp: { enabled: true,  phone: '' },
    chat:     { enabled: true },
    email:    { enabled: false, address: '' },
  },
  services: {
    whatsapp: { enabled: true,  phone: '' },
    chat:     { enabled: true },
    email:    { enabled: false, address: '' },
  },
}

export const CHANNEL_IDS = ['whatsapp', 'chat', 'email']

/**
 * Merge stored channels with app defaults. Returns the canonical shape
 * the customer page can rely on. Pulls phone/email from the vendor row
 * if the channels object doesn't already have them set.
 */
export function resolveChannels(vendor, appKind = 'food') {
  const defaults = DEFAULTS[appKind] || DEFAULTS.food
  const stored   = (vendor && vendor.channels) || {}

  const merged = {
    whatsapp: { ...defaults.whatsapp, ...(stored.whatsapp || {}) },
    chat:     { ...defaults.chat,     ...(stored.chat     || {}) },
    email:    { ...defaults.email,    ...(stored.email    || {}) },
  }
  // Inherit contact info from the vendor row if missing.
  if (!merged.whatsapp.phone) {
    merged.whatsapp.phone = vendor?.shop_phone || vendor?.phone || ''
  }
  if (!merged.email.address) {
    merged.email.address = vendor?.shop_email || vendor?.email || ''
  }
  // A channel is genuinely usable only if it has the contact info it needs.
  merged.whatsapp.enabled = !!(merged.whatsapp.enabled && merged.whatsapp.phone)
  merged.email.enabled    = !!(merged.email.enabled && merged.email.address)
  return merged
}

/** Returns the ids of enabled channels (in canonical order). */
export function enabledChannelIds(channels) {
  return CHANNEL_IDS.filter((id) => channels[id]?.enabled)
}

// ── Format an order as a message ──────────────────────────────────────────
/**
 * Render a cart as a single plain-text message suitable for WhatsApp / email.
 * Items: [{ name, qty, price }]. Total = sum + delivery + extras.
 */
export function formatOrderMessage(order) {
  const lines = []
  lines.push(`*Order from ${order.customerName || 'Customer'}*`)
  if (order.shopName) lines.push(`Shop: ${order.shopName}`)
  lines.push('')
  for (const it of (order.items || [])) {
    const sub = (Number(it.price) || 0) * (Number(it.qty) || 1)
    lines.push(`- ${it.qty}× ${it.name} — Rp ${sub.toLocaleString('id-ID')}`)
  }
  if (order.extras) lines.push(`Extras: Rp ${Number(order.extras).toLocaleString('id-ID')}`)
  if (order.delivery) lines.push(`Delivery: Rp ${Number(order.delivery).toLocaleString('id-ID')}`)
  lines.push('')
  lines.push(`*TOTAL: Rp ${Number(order.total || 0).toLocaleString('id-ID')}*`)
  if (order.address)     lines.push(`Address: ${order.address}`)
  if (order.customerPhone) lines.push(`Phone:   ${order.customerPhone}`)
  if (order.notes)       lines.push(`Notes:   ${order.notes}`)
  return lines.join('\n')
}

// ── Route to a channel ────────────────────────────────────────────────────
/**
 * Open the right destination for a chosen channel. Returns a Promise so
 * callers can chain (e.g. write the food_orders row first).
 *
 * For 'chat' the caller passes its own handler (openChatSheet) because
 * each app's chat is a different component. For 'whatsapp' and 'email'
 * we generate the URL ourselves and call window.open.
 */
export function openChannel(channelId, channels, order, opts = {}) {
  if (channelId === 'whatsapp') {
    const phone = (channels.whatsapp?.phone || '').replace(/[^0-9]/g, '')
    if (!phone) throw new Error('WhatsApp channel has no phone number')
    const text = encodeURIComponent(formatOrderMessage(order))
    const url = `https://wa.me/${phone}?text=${text}`
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener')
    return { url, channel: 'whatsapp' }
  }
  if (channelId === 'email') {
    const addr = channels.email?.address || ''
    if (!addr) throw new Error('Email channel has no address')
    const subject = encodeURIComponent(`Order — ${order.shopName || 'Order'}`)
    const body = encodeURIComponent(formatOrderMessage(order))
    const url = `mailto:${addr}?subject=${subject}&body=${body}`
    if (typeof window !== 'undefined') window.location.href = url
    return { url, channel: 'email' }
  }
  if (channelId === 'chat') {
    if (typeof opts.openChatSheet === 'function') opts.openChatSheet(order)
    return { channel: 'chat' }
  }
  throw new Error(`Unknown channel: ${channelId}`)
}

// ── Display metadata for UI ───────────────────────────────────────────────
export const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', icon: '💬', color: '#25D366' },
  chat:     { label: 'In-app chat', icon: '💭', color: '#3B82F6' },
  email:    { label: 'Email',    icon: '✉️', color: '#A855F7' },
}
