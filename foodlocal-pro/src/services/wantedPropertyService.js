/**
 * wantedPropertyService — CRUD for Wanted Property requests + agent responses.
 * Supabase + localStorage fallback.
 */
import { supabase } from '@/lib/supabase'

const LS_KEY = 'indoo_wanted_properties'
const LS_RESP_KEY = 'indoo_wanted_responses'

// ── Helpers ──
function getLocal(key) { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
function setLocal(key, data) { localStorage.setItem(key, JSON.stringify(data)) }
function genId() { return 'WP-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString(36).slice(-4) }

// ── DEMO DATA ──
const DEMO_WANTED = [
  { id: 'wp-demo-1', property_type: 'Villa', location: 'Canggu, Bali', budget_min: 3000000000, budget_max: 5000000000, bedrooms: '3', bathrooms: '2', purpose: 'investment', timeline: 'buying_now', listing_type: 'buy', requirements: 'Pool required, close to beach, modern design', buyer_name: 'Michael R.', buyer_verified: true, status: 'active', created_at: '2026-04-28T10:00:00Z', responses_count: 4 },
  { id: 'wp-demo-2', property_type: 'Apartment', location: 'Jakarta Selatan', budget_min: 800000000, budget_max: 1500000000, bedrooms: '2', bathrooms: '1', purpose: 'personal', timeline: 'within_3_months', listing_type: 'buy', requirements: 'Near MRT station, furnished, high floor with city view', buyer_name: 'Sarah L.', buyer_verified: true, status: 'active', created_at: '2026-04-30T14:00:00Z', responses_count: 7 },
  { id: 'wp-demo-3', property_type: 'Kos', location: 'Yogyakarta', budget_min: 1000000, budget_max: 2500000, bedrooms: '1', bathrooms: '1', purpose: 'personal', timeline: 'buying_now', listing_type: 'rent', requirements: 'Near UGM campus, WiFi included, AC, clean shared kitchen', buyer_name: 'Andi P.', buyer_verified: false, status: 'active', created_at: '2026-05-01T08:00:00Z', responses_count: 12 },
  { id: 'wp-demo-4', property_type: 'House', location: 'Bandung', budget_min: 1500000000, budget_max: 2500000000, bedrooms: '4', bathrooms: '3', purpose: 'personal', timeline: 'within_3_months', listing_type: 'buy', requirements: 'SHM certificate, quiet neighborhood, garage for 2 cars, garden', buyer_name: 'Dewi S.', buyer_verified: true, status: 'active', created_at: '2026-04-29T12:00:00Z', responses_count: 3 },
  { id: 'wp-demo-5', property_type: 'Tanah', location: 'Lombok', budget_min: 500000000, budget_max: 2000000000, bedrooms: null, bathrooms: null, land_area_min: '500', purpose: 'investment', timeline: 'exploring', listing_type: 'buy', requirements: 'Beachfront or ocean view, SHM, road access, flat contour', buyer_name: 'James T.', buyer_verified: true, anonymous: true, status: 'active', created_at: '2026-04-27T09:00:00Z', responses_count: 6 },
  { id: 'wp-demo-6', property_type: 'Ruko', location: 'Surabaya', budget_min: 15000000, budget_max: 30000000, bedrooms: null, bathrooms: '1', purpose: 'business', timeline: 'buying_now', listing_type: 'rent', requirements: '2-3 floors, main road frontage, parking area, near commercial district', buyer_name: 'Budi H.', buyer_verified: false, status: 'active', created_at: '2026-05-02T06:00:00Z', responses_count: 2 },
]

// ── CREATE ──
export async function createWantedProperty(data) {
  const entry = { ...data, id: genId(), status: 'active', created_at: new Date().toISOString(), responses_count: 0 }
  if (supabase) {
    try {
      const { data: row, error } = await supabase.from('wanted_properties').insert(entry).select().single()
      if (!error) return row
    } catch {}
  }
  const list = getLocal(LS_KEY)
  list.unshift(entry)
  setLocal(LS_KEY, list)
  return entry
}

// ── READ ALL (active) ──
export async function getWantedProperties(filters = {}) {
  let results = []
  if (supabase) {
    try {
      let q = supabase.from('wanted_properties').select('*').eq('status', 'active').order('created_at', { ascending: false })
      if (filters.property_type) q = q.eq('property_type', filters.property_type)
      if (filters.location) q = q.ilike('location', `%${filters.location}%`)
      if (filters.listing_type) q = q.eq('listing_type', filters.listing_type)
      const { data } = await q
      if (data?.length) results = data
    } catch {}
  }
  if (!results.length) {
    results = [...getLocal(LS_KEY).filter(w => w.status === 'active'), ...DEMO_WANTED]
  }
  // Apply local filters
  if (filters.property_type) results = results.filter(w => w.property_type === filters.property_type)
  if (filters.listing_type) results = results.filter(w => w.listing_type === filters.listing_type)
  if (filters.location) results = results.filter(w => w.location?.toLowerCase().includes(filters.location.toLowerCase()))
  if (filters.timeline) results = results.filter(w => w.timeline === filters.timeline)
  return results
}

// ── GET MY REQUESTS ──
export async function getMyWantedProperties() {
  const userId = (() => { try { return JSON.parse(localStorage.getItem('indoo_web_user'))?.id } catch { return null } })()
  if (supabase && userId) {
    try {
      const { data } = await supabase.from('wanted_properties').select('*').eq('buyer_id', userId).order('created_at', { ascending: false })
      if (data?.length) return data
    } catch {}
  }
  return getLocal(LS_KEY)
}

// ── RESPOND TO REQUEST ──
export async function respondToWanted(wantedId, response) {
  const entry = { id: genId(), wanted_id: wantedId, ...response, created_at: new Date().toISOString(), status: 'pending' }
  if (supabase) {
    try {
      const { data, error } = await supabase.from('wanted_responses').insert(entry).select().single()
      if (!error) return data
    } catch {}
  }
  const list = getLocal(LS_RESP_KEY)
  list.unshift(entry)
  setLocal(LS_RESP_KEY, list)
  return entry
}

// ── GET RESPONSES FOR A REQUEST ──
export async function getResponsesForWanted(wantedId) {
  if (supabase) {
    try {
      const { data } = await supabase.from('wanted_responses').select('*').eq('wanted_id', wantedId).order('created_at', { ascending: false })
      if (data) return data
    } catch {}
  }
  return getLocal(LS_RESP_KEY).filter(r => r.wanted_id === wantedId)
}

// ── MATCH SCORE ── compares an agent's listing against a wanted request
export function calculateMatchScore(wanted, listing) {
  let score = 0, total = 0
  const ef = listing.extra_fields || {}

  // Property type match
  total += 30
  if (wanted.property_type && (listing.sub_category === wanted.property_type || ef.property_type === wanted.property_type || ef.propType === wanted.property_type)) score += 30

  // Location match
  total += 25
  if (wanted.location && listing.city) {
    const wLoc = wanted.location.toLowerCase()
    const lCity = listing.city.toLowerCase()
    if (lCity.includes(wLoc) || wLoc.includes(lCity)) score += 25
    else if (wLoc.split(',').some(p => lCity.includes(p.trim()))) score += 15
  }

  // Budget match
  total += 25
  const listingPrice = listing.buy_now ? (typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now) : listing.price_month || listing.price_day || 0
  const price = Number(String(listingPrice).replace(/\./g, ''))
  if (price && wanted.budget_min && wanted.budget_max) {
    if (price >= wanted.budget_min && price <= wanted.budget_max) score += 25
    else if (price >= wanted.budget_min * 0.8 && price <= wanted.budget_max * 1.2) score += 15
  }

  // Bedrooms match
  if (wanted.bedrooms) {
    total += 10
    if (String(ef.bedrooms) === String(wanted.bedrooms)) score += 10
    else if (Math.abs(Number(ef.bedrooms) - Number(wanted.bedrooms)) <= 1) score += 5
  }

  // Bathrooms match
  if (wanted.bathrooms) {
    total += 10
    if (String(ef.bathrooms) === String(wanted.bathrooms)) score += 10
    else if (Math.abs(Number(ef.bathrooms) - Number(wanted.bathrooms)) <= 1) score += 5
  }

  return total > 0 ? Math.round((score / total) * 100) : 0
}

// ── FORMAT BUDGET ──
export function fmtBudget(n) {
  if (!n) return '—'
  if (n >= 1e12) return `Rp ${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

// ── TIMELINE LABELS ──
export const TIMELINE_OPTIONS = [
  { id: 'buying_now', label: 'Buying Now', color: '#EF4444' },
  { id: 'within_3_months', label: 'Within 3 Months', color: '#F59E0B' },
  { id: 'within_6_months', label: 'Within 6 Months', color: '#60A5FA' },
  { id: 'exploring', label: 'Exploring', color: 'rgba(255,255,255,0.4)' },
]

export const PURPOSE_OPTIONS = [
  { id: 'personal', label: 'Personal Residence' },
  { id: 'investment', label: 'Investment' },
  { id: 'business', label: 'Business' },
  { id: 'holiday', label: 'Holiday Home' },
]
