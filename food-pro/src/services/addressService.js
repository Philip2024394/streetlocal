/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Unified Address Service — single source for all modules
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * All modules (food, rides, marketplace, massage, rentals) read delivery
 * addresses from here. Users enter their address ONCE during onboarding.
 * Additional addresses can be added later from any module.
 */
import { supabase } from '@/lib/supabase'

const LOCAL_KEY = 'indoo_saved_addresses'

// ── Get all saved addresses (Supabase or localStorage fallback) ──────────
export async function getSavedAddresses(userId) {
  if (supabase && userId) {
    const { data } = await supabase
      .from('profiles')
      .select('saved_addresses')
      .eq('id', userId)
      .maybeSingle()
    return data?.saved_addresses ?? []
  }
  // Demo/offline fallback
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) ?? [] } catch { return [] }
}

// ── Get the default address ──────────────────────────────────────────────
export async function getDefaultAddress(userId) {
  const addresses = await getSavedAddresses(userId)
  return addresses.find(a => a.isDefault) ?? addresses[0] ?? null
}

// ── Save a new address (or update existing by label) ─────────────────────
export async function saveAddress(userId, { label, address, lat, lng, isDefault = false }) {
  const addresses = await getSavedAddresses(userId)

  // If setting as default, unset others
  if (isDefault) {
    addresses.forEach(a => { a.isDefault = false })
  }

  // Update existing or add new
  const existing = addresses.findIndex(a => a.label === label)
  const entry = { label, address, lat: lat ?? null, lng: lng ?? null, isDefault }
  if (existing >= 0) {
    addresses[existing] = entry
  } else {
    addresses.push(entry)
  }

  // If only one address, make it default
  if (addresses.length === 1) addresses[0].isDefault = true

  // Persist
  if (supabase && userId) {
    const defaultAddr = addresses.find(a => a.isDefault)
    await supabase.from('profiles').update({
      saved_addresses: addresses,
      primary_address: defaultAddr?.address ?? null,
      primary_lat: defaultAddr?.lat ?? null,
      primary_lng: defaultAddr?.lng ?? null,
    }).eq('id', userId)
  }

  // Always save locally for offline access
  localStorage.setItem(LOCAL_KEY, JSON.stringify(addresses))

  return addresses
}

// ── Remove an address by label ───────────────────────────────────────────
export async function removeAddress(userId, label) {
  let addresses = await getSavedAddresses(userId)
  addresses = addresses.filter(a => a.label !== label)

  // Ensure at least one default if addresses remain
  if (addresses.length > 0 && !addresses.some(a => a.isDefault)) {
    addresses[0].isDefault = true
  }

  if (supabase && userId) {
    const defaultAddr = addresses.find(a => a.isDefault)
    await supabase.from('profiles').update({
      saved_addresses: addresses,
      primary_address: defaultAddr?.address ?? null,
      primary_lat: defaultAddr?.lat ?? null,
      primary_lng: defaultAddr?.lng ?? null,
    }).eq('id', userId)
  }

  localStorage.setItem(LOCAL_KEY, JSON.stringify(addresses))
  return addresses
}

// ── Quick access: get address text for display ───────────────────────────
export function getLocalDefaultAddress() {
  try {
    const addresses = JSON.parse(localStorage.getItem(LOCAL_KEY)) ?? []
    const def = addresses.find(a => a.isDefault) ?? addresses[0]
    return def?.address ?? ''
  } catch { return '' }
}
