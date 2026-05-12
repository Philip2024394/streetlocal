/**
 * offerService — Property offer system.
 * Buyers make offers, sellers Accept / Counter / Redirect.
 * Every offer = qualified lead, even rejected ones.
 */
import { supabase } from '@/lib/supabase'

const LS_KEY = 'indoo_property_offers'

function getLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
function setLocal(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)) }
function genId() { return 'OFR-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString(36).slice(-4) }

// ── OFFER STATUS ──
export const OFFER_STATUS = {
  pending: { label: 'Pending', color: '#F59E0B' },
  accepted: { label: 'Accepted', color: '#8DC63F' },
  countered: { label: 'Countered', color: '#60A5FA' },
  rejected: { label: 'Declined', color: '#EF4444' },
  redirected: { label: 'Redirected', color: '#A78BFA' },
  expired: { label: 'Expired', color: 'rgba(255,255,255,0.3)' },
}

// ── CREATE OFFER ──
export async function createOffer(offer) {
  const entry = {
    id: genId(),
    listing_id: offer.listing_id,
    listing_title: offer.listing_title,
    listing_price: offer.listing_price,
    offer_amount: offer.offer_amount,
    offer_type: offer.offer_type || 'buy', // buy or rent
    buyer_name: offer.buyer_name,
    buyer_phone: offer.buyer_phone,
    buyer_email: offer.buyer_email,
    buyer_id: offer.buyer_id,
    message: offer.message || '',
    status: 'pending',
    counter_amount: null,
    seller_message: null,
    redirect_listing_id: null,
    redirect_listing_title: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.from('property_offers').insert(entry).select().single()
      if (!error) return data
    } catch {}
  }

  const list = getLocal()
  list.unshift(entry)
  setLocal(list)
  return entry
}

// ── GET OFFERS FOR A LISTING (seller view) ──
export async function getOffersForListing(listingId) {
  if (supabase) {
    try {
      const { data } = await supabase.from('property_offers').select('*').eq('listing_id', listingId).order('created_at', { ascending: false })
      if (data?.length) return data
    } catch {}
  }
  return getLocal().filter(o => o.listing_id === listingId)
}

// ── GET MY OFFERS (buyer view) ──
export async function getMyOffers() {
  const userId = (() => { try { return JSON.parse(localStorage.getItem('indoo_web_user'))?.id } catch { return null } })()
  if (supabase && userId) {
    try {
      const { data } = await supabase.from('property_offers').select('*').eq('buyer_id', userId).order('created_at', { ascending: false })
      if (data?.length) return data
    } catch {}
  }
  return getLocal().filter(o => o.buyer_id === userId)
}

// ── GET ALL OFFERS FOR MY LISTINGS (seller dashboard) ──
export async function getOffersForMyListings() {
  // In localStorage mode, return all offers (since we can't filter by seller)
  const userId = (() => { try { return JSON.parse(localStorage.getItem('indoo_web_user'))?.id } catch { return null } })()
  if (supabase && userId) {
    try {
      const { data } = await supabase.from('property_offers').select('*').eq('seller_id', userId).order('created_at', { ascending: false })
      if (data?.length) return data
    } catch {}
  }
  return getLocal()
}

// ── RESPOND TO OFFER ──
export async function respondToOffer(offerId, response) {
  // response: { status: 'accepted'|'countered'|'rejected'|'redirected', counter_amount?, seller_message?, redirect_listing_id?, redirect_listing_title? }
  const update = {
    status: response.status,
    counter_amount: response.counter_amount || null,
    seller_message: response.seller_message || null,
    redirect_listing_id: response.redirect_listing_id || null,
    redirect_listing_title: response.redirect_listing_title || null,
    updated_at: new Date().toISOString(),
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.from('property_offers').update(update).eq('id', offerId).select().single()
      if (!error) return data
    } catch {}
  }

  const list = getLocal()
  const idx = list.findIndex(o => o.id === offerId)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...update }
    setLocal(list)
    return list[idx]
  }
  return null
}

// ── FORMAT PRICE ──
export function fmtOffer(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

// ── OFFER STRENGTH ── how close is the offer to asking price
export function offerStrength(offerAmount, listingPrice) {
  if (!offerAmount || !listingPrice) return { pct: 0, label: 'Unknown', color: 'rgba(255,255,255,0.3)' }
  const offer = Number(String(offerAmount).replace(/\./g, ''))
  const price = Number(String(listingPrice).replace(/\./g, ''))
  if (!price) return { pct: 0, label: 'Unknown', color: 'rgba(255,255,255,0.3)' }
  const pct = Math.round((offer / price) * 100)
  if (pct >= 95) return { pct, label: 'Strong Offer', color: '#8DC63F' }
  if (pct >= 85) return { pct, label: 'Fair Offer', color: '#FACC15' }
  if (pct >= 70) return { pct, label: 'Below Market', color: '#F59E0B' }
  return { pct, label: 'Low Offer', color: '#EF4444' }
}

// ── DEMO OFFERS ──
export const DEMO_OFFERS = [
  { id: 'ofr-demo-1', listing_id: 'demo', listing_title: 'Villa Mewah Kaliurang', listing_price: 2800000000, offer_amount: 2500000000, offer_type: 'buy', buyer_name: 'Sarah L.', buyer_phone: '081234567890', message: 'Very interested, can close within 2 weeks. Cash buyer.', status: 'pending', created_at: '2026-05-01T10:00:00Z' },
  { id: 'ofr-demo-2', listing_id: 'demo', listing_title: 'Villa Mewah Kaliurang', listing_price: 2800000000, offer_amount: 2200000000, offer_type: 'buy', buyer_name: 'Budi P.', buyer_phone: '087654321098', message: 'Looking for investment property. Open to negotiation.', status: 'countered', counter_amount: 2600000000, seller_message: 'We can meet at Rp 2.6B — includes all furniture.', created_at: '2026-04-30T14:00:00Z' },
  { id: 'ofr-demo-3', listing_id: 'demo', listing_title: 'Villa Mewah Kaliurang', listing_price: 2800000000, offer_amount: 1500000000, offer_type: 'buy', buyer_name: 'James T.', buyer_phone: '085612345678', message: 'Budget is tight but love the location.', status: 'redirected', seller_message: 'Your budget matches our other property — check it out!', redirect_listing_title: 'Cozy House Denpasar', created_at: '2026-04-29T08:00:00Z' },
]
