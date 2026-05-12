/**
 * Rental Listing Service
 * Owners create/manage vehicle & property listings.
 * Primary: Supabase `rental_listings` table. Fallback: localStorage.
 */
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'indoo_rental_listings_owner'

export const VEHICLE_TYPES = [
  { id: 'motorcycle', label: 'Motor Bike', icon: '🏍️' },
  { id: 'car',        label: 'Car',        icon: '🚗' },
  { id: 'truck',      label: 'Truck',      icon: '🚛' },
  { id: 'bus',        label: 'Bus',        icon: '🚌' },
]

export const FUEL_OPTIONS = [
  { id: 'excluded', label: 'Fuel Excluded' },
  { id: 'included', label: 'Fuel Included' },
]

/* ── localStorage helpers (cache/fallback) ── */
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}
function saveLocal(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

async function getCurrentUserId() {
  if (!supabase) return null
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user?.id || null
  } catch { return null }
}

/** Create a new rental listing — Supabase + localStorage */
export async function createListing(data) {
  const entry = {
    id: 'rl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    ...data,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    bookings: 0,
  }

  // Always save to localStorage as cache
  const local = loadLocal()
  local.unshift(entry)
  saveLocal(local)

  // Try Supabase
  if (supabase) {
    try {
      const userId = await getCurrentUserId()
      const { error } = await supabase.from('rental_listings').insert({
        owner_id: userId,
        ref: data.ref || entry.id,
        title: data.title,
        description: data.description || '',
        category: data.category,
        sub_category: data.sub_category || data.category,
        city: data.city || '',
        address: data.address || '',
        price_day: data.price_day || null,
        price_week: data.price_week || null,
        price_month: data.price_month || null,
        buy_now: data.buy_now || null,
        extra_fields: data.extra_fields || {},
        condition: data.condition || 'good',
        status: 'active',
        images: data.images || [],
        features: data.features || [],
        video_url: data.video_url || null,
        video_thumbnail: data.video_thumbnail || null,
        owner_type: data.owner_type || 'owner',
        whatsapp: data.whatsapp || null,
      })
      if (error) console.warn('Supabase insert failed, using localStorage:', error.message)
    } catch (e) {
      console.warn('Supabase insert error:', e)
    }
  }

  return entry
}

/** Get all listings for current owner — Supabase first, localStorage fallback */
export async function getMyListings() {
  if (supabase) {
    try {
      const userId = await getCurrentUserId()
      if (userId) {
        const { data, error } = await supabase
          .from('rental_listings')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
        if (!error && data?.length) {
          // Merge with localStorage (dedup by ref/id)
          const localListings = loadLocal()
          const supaRefs = new Set(data.map(l => l.ref))
          const merged = [...data, ...localListings.filter(l => !supaRefs.has(l.ref) && !supaRefs.has(l.id))]
          return merged
        }
      }
    } catch (e) {
      console.warn('Supabase fetch error:', e)
    }
  }
  // Fallback: also load from all category-specific localStorage keys
  const allKeys = [
    STORAGE_KEY,
    'indoo_my_listings',
    'indoo_my_car_listings',
    'indoo_my_truck_listings',
    'indoo_my_bus_listings',
    'indoo_event_listings',
    'indoo_my_property_listings',
    'indoo_my_bicycle_listings',
  ]
  const all = []
  allKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]')
      if (Array.isArray(data)) all.push(...data)
    } catch {}
  })
  return all
}

/** Update a listing — Supabase + localStorage */
export async function updateListing(id, updates) {
  // Update localStorage
  const listings = loadLocal()
  const idx = listings.findIndex(l => l.id === id || l.ref === id)
  if (idx >= 0) {
    listings[idx] = { ...listings[idx], ...updates, updatedAt: new Date().toISOString() }
    saveLocal(listings)
  }

  // Update Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('rental_listings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .or(`ref.eq.${id},id.eq.${id}`)
      if (error) console.warn('Supabase update failed:', error.message)
    } catch (e) {
      console.warn('Supabase update error:', e)
    }
  }

  return idx >= 0 ? listings[idx] : null
}

/** Delete a listing — Supabase + localStorage */
export async function deleteListing(id) {
  saveLocal(loadLocal().filter(l => l.id !== id && l.ref !== id))

  if (supabase) {
    try {
      await supabase.from('rental_listings').delete().or(`ref.eq.${id},id.eq.${id}`)
    } catch (e) {
      console.warn('Supabase delete error:', e)
    }
  }
}

/** Toggle listing status — Supabase + localStorage */
export async function toggleListingStatus(id) {
  const listings = loadLocal()
  const idx = listings.findIndex(l => l.id === id || l.ref === id)
  if (idx === -1) return null
  listings[idx].status = listings[idx].status === 'active' ? 'paused' : 'active'
  listings[idx].updatedAt = new Date().toISOString()
  saveLocal(listings)

  if (supabase) {
    try {
      await supabase
        .from('rental_listings')
        .update({ status: listings[idx].status, updated_at: new Date().toISOString() })
        .or(`ref.eq.${id},id.eq.${id}`)
    } catch (e) {
      console.warn('Supabase toggle error:', e)
    }
  }

  return listings[idx]
}

/** Deactivate listing — marks as 'sold' or 'rented' for 7 days then hides */
export async function deactivateListing(id, reason = 'sold') {
  const status = reason === 'rented' ? 'rented' : 'sold'
  const hideAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // localStorage
  const listings = loadLocal()
  const idx = listings.findIndex(l => l.id === id || l.ref === id)
  if (idx >= 0) {
    listings[idx].status = status
    listings[idx].hideAfter = hideAfter
    listings[idx].updatedAt = new Date().toISOString()
    saveLocal(listings)
  }

  // Supabase
  if (supabase) {
    try {
      await supabase
        .from('rental_listings')
        .update({ status, updated_at: new Date().toISOString() })
        .or(`ref.eq.${id},id.eq.${id}`)
    } catch (e) {
      console.warn('Supabase deactivate error:', e)
    }
  }

  return idx >= 0 ? listings[idx] : null
}

/** Check if listing should be hidden (past 3-day sold/rented window) */
export function isListingExpired(listing) {
  if (!listing.hideAfter) return false
  return new Date() > new Date(listing.hideAfter)
}

/** Format price */
export function fmtPrice(n) {
  if (!n) return '-'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
