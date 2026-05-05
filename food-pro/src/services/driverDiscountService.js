/**
 * Driver Self-Discount Service
 * Drivers can offer 0-10% discount from their 90% share to attract more rides.
 * Admin can also set/override discount for drivers.
 * INDOO always keeps 10% of the (discounted) fare.
 *
 * Terms:
 * - Discount comes from driver's 90% share, NOT from INDOO's 10%
 * - Driver can set 0%, 3%, 5%, 7%, or 10% discount
 * - Admin can activate/deactivate discount for any driver
 * - Admin can set discount % for drivers who are idle for long periods
 * - Drivers are expected to accept discounted rides during off-peak times
 * - Customer sees "X% Off" badge on driver card during search
 * - Higher discount = higher visibility in search results
 */
import { supabase } from '@/lib/supabase'

export const DISCOUNT_OPTIONS = [
  { value: 0,  label: 'No Discount',  desc: 'Full fare — compete on rating & speed' },
  { value: 3,  label: '3% Off',       desc: 'Small boost to attract more rides' },
  { value: 5,  label: '5% Off',       desc: 'Competitive — popular with new drivers' },
  { value: 7,  label: '7% Off',       desc: 'Strong discount — high visibility' },
  { value: 10, label: '10% Off',      desc: 'Maximum — lowest possible fare on INDOO' },
]

// Demo discount data
const _demoDiscounts = {}

/**
 * Get driver's current discount setting.
 */
export async function getDriverDiscount(driverId) {
  if (!supabase) {
    return _demoDiscounts[driverId] || {
      driver_id: driverId,
      discount_percent: 0,
      is_active: false,
      set_by: 'driver',
      admin_override: false,
      admin_note: null,
      updated_at: new Date().toISOString(),
    }
  }

  const { data } = await supabase
    .from('driver_discounts')
    .select('*')
    .eq('driver_id', driverId)
    .maybeSingle()

  return data || { driver_id: driverId, discount_percent: 0, is_active: false, set_by: 'driver' }
}

/**
 * Driver sets their own discount.
 */
export async function setDriverDiscount(driverId, percent) {
  const clamped = Math.min(10, Math.max(0, percent))
  const record = {
    driver_id: driverId,
    discount_percent: clamped,
    is_active: clamped > 0,
    set_by: 'driver',
    admin_override: false,
    admin_note: null,
    updated_at: new Date().toISOString(),
  }

  if (!supabase) {
    _demoDiscounts[driverId] = record
    return record
  }

  const { data, error } = await supabase
    .from('driver_discounts')
    .upsert(record, { onConflict: 'driver_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Admin sets/overrides discount for a driver.
 */
export async function adminSetDiscount(driverId, percent, note) {
  const clamped = Math.min(10, Math.max(0, percent))
  const record = {
    driver_id: driverId,
    discount_percent: clamped,
    is_active: clamped > 0,
    set_by: 'admin',
    admin_override: true,
    admin_note: note || null,
    updated_at: new Date().toISOString(),
  }

  if (!supabase) {
    _demoDiscounts[driverId] = record
    return record
  }

  const { data, error } = await supabase
    .from('driver_discounts')
    .upsert(record, { onConflict: 'driver_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Admin removes override — returns control to driver.
 */
export async function adminRemoveOverride(driverId) {
  if (!supabase) {
    if (_demoDiscounts[driverId]) {
      _demoDiscounts[driverId].admin_override = false
      _demoDiscounts[driverId].set_by = 'driver'
      _demoDiscounts[driverId].admin_note = null
    }
    return _demoDiscounts[driverId]
  }

  const { data } = await supabase
    .from('driver_discounts')
    .update({ admin_override: false, set_by: 'driver', admin_note: null, updated_at: new Date().toISOString() })
    .eq('driver_id', driverId)
    .select()
    .single()

  return data
}

/**
 * Get all driver discounts (admin view).
 */
export async function getAllDriverDiscounts() {
  if (!supabase) return Object.values(_demoDiscounts)

  const { data } = await supabase
    .from('driver_discounts')
    .select('*')
    .order('discount_percent', { ascending: false })

  return data ?? []
}

/**
 * Apply discount to a fare calculation.
 * Returns the discounted fare breakdown.
 */
export function applyDriverDiscount(baseFare, discountPercent) {
  const d = Math.min(10, Math.max(0, discountPercent)) / 100
  const discountedFare = Math.round(baseFare * (1 - d))
  const indooKeeps = Math.round(discountedFare * 0.10)
  const driverGets = discountedFare - indooKeeps

  return {
    originalFare: baseFare,
    discountPercent: discountPercent,
    discountAmount: baseFare - discountedFare,
    discountedFare,
    indooKeeps,
    driverGets,
  }
}

/**
 * Terms and conditions text for driver discount feature.
 */
export const DISCOUNT_TERMS = [
  'You may set a personal discount of 0% to 10% on your rides.',
  'The discount is deducted from your 90% earnings share. INDOO\'s 10% commission remains unchanged.',
  'Higher discounts increase your visibility to customers during ride searches.',
  'INDOO admin may activate or adjust your discount during off-peak periods or if your account has been idle.',
  'Admin-set discounts are temporary and will be communicated to you via chat or notification.',
  'You are expected to accept discounted rides during off-peak hours as part of fleet participation.',
  'You may change your discount at any time from your dashboard, unless an admin override is active.',
  'At 10% discount, your earnings will be approximately 10% lower per ride, but ride volume typically increases.',
  'Discount badges are visible to customers — "3% Off", "5% Off", etc.',
  'INDOO reserves the right to cap or adjust discount ranges based on market conditions.',
]
