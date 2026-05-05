import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Commission Service (Legacy — wallet system is primary)
// All services: 10% flat commission via walletService.js
// This file kept for Supabase RPC backward compatibility
// ─────────────────────────────────────────────────────────────────────────────

export const COMMISSION_RATES = {
  marketplace:      0.10,   // 10% — general marketplace
  restaurant:       0.10,   // 10%
  rental:           0.10,   // 10% — rental orders (vehicles, equipment, fashion)
  massage:          0.10,   // 10%
  driver_bike:      0.10,   // 10%
  driver_car:       0.10,   // 10%
  dating:           0.10,   // 10%
  food:             0.10,   // 10%
  property_sale:    0.05,   // 5% — house, factory, kos, villa sales
  motor_sale:       0.05,   // 5% — motorcycle/vehicle sales
}

// ── Record a new commission when order is marked complete ─────────────────────
// type: 'marketplace' | 'restaurant'
export async function recordCommission(sellerId, orderId, orderTotal, type = 'marketplace') {
  if (!supabase) return null
  const rate = COMMISSION_RATES[type] ?? COMMISSION_RATES.marketplace
  try {
    const { data, error } = await supabase.rpc('record_commission', {
      p_seller_id:       sellerId,
      p_order_id:        orderId,
      p_order_total:     orderTotal,
      p_commission_type: type,
      p_rate:            rate,
    })
    if (error) throw error
    return { commissionId: data, amount: Math.round(orderTotal * rate), rate, type }
  } catch (e) {
    console.warn('[commissionService] recordCommission failed', e)
    return null
  }
}

// ── Check if seller has any unpaid commissions ────────────────────────────────
// type: null = any type,  'marketplace' | 'restaurant' to filter
export async function hasUnpaidCommission(sellerId, type = null) {
  if (!supabase) return false
  try {
    let q = supabase
      .from('seller_commissions')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .in('status', ['pending', 'overdue'])
    if (type) q = q.eq('commission_type', type)
    const { count, error } = await q
    return !error && (count ?? 0) > 0
  } catch {
    return false
  }
}

// ── Check if a specific order has an unpaid commission ────────────────────────
export async function orderHasUnpaidCommission(orderId) {
  if (!supabase) return false
  try {
    const { data, error } = await supabase
      .from('seller_commissions')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', ['pending', 'overdue'])
      .maybeSingle()
    if (error) return false
    return !!data
  } catch {
    return false
  }
}

// ── Get seller balance summary ────────────────────────────────────────────────
// type: null = combined, 'marketplace' | 'restaurant' to filter
export async function getSellerBalance(sellerId, type = null) {
  if (!supabase) return { totalOwed: 0, totalPaid: 0, pendingCount: 0, overdueCount: 0 }
  try {
    const params = { p_seller_id: sellerId }
    if (type) params.p_commission_type = type
    const { data, error } = await supabase.rpc('get_seller_commission_balance', params)
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    return {
      totalOwed:    Number(row?.total_owed    ?? 0),
      totalPaid:    Number(row?.total_paid    ?? 0),
      pendingCount: Number(row?.pending_count ?? 0),
      overdueCount: Number(row?.overdue_count ?? 0),
    }
  } catch {
    return { totalOwed: 0, totalPaid: 0, pendingCount: 0, overdueCount: 0 }
  }
}

// ── Get commission history for a seller ──────────────────────────────────────
export async function getSellerCommissions(sellerId, { limit = 50, type = null } = {}) {
  if (!supabase) return []
  try {
    let q = supabase
      .from('seller_commissions')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (type) q = q.eq('commission_type', type)
    const { data, error } = await q
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ── Admin: get all pending/overdue commissions ────────────────────────────────
export async function getAllPendingCommissions(type = null) {
  if (!supabase) return []
  try {
    let q = supabase
      .from('seller_commissions')
      .select('*, profiles:seller_id ( display_name, avatar_url, phone )')
      .in('status', ['pending', 'overdue'])
      .order('due_at', { ascending: true })
    if (type) q = q.eq('commission_type', type)
    const { data, error } = await q
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ── Admin: get all commissions (full history) ─────────────────────────────────
export async function getAllCommissions(filters = {}) {
  if (!supabase) return []
  try {
    let q = supabase
      .from('seller_commissions')
      .select('*, profiles:seller_id ( display_name, avatar_url )')
      .order('created_at', { ascending: false })
      .limit(200)

    if (filters.status) q = q.eq('status', filters.status)
    if (filters.sellerId) q = q.eq('seller_id', filters.sellerId)
    if (filters.type) q = q.eq('commission_type', filters.type)

    const { data, error } = await q
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ── Admin: mark all unpaid commissions paid for a seller ──────────────────────
export async function markSellerCommissionsPaid(sellerId, notes = '', type = null) {
  if (!supabase) return false
  try {
    let q = supabase
      .from('seller_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString(), notes })
      .eq('seller_id', sellerId)
      .in('status', ['pending', 'overdue'])
    if (type) q = q.eq('commission_type', type)
    const { error } = await q
    if (error) throw error
    return true
  } catch {
    return false
  }
}

// ── Admin: mark a single commission paid ─────────────────────────────────────
export async function markCommissionPaid(commissionId, notes = '') {
  if (!supabase) return false
  try {
    const { data, error } = await supabase
      .from('seller_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString(), notes })
      .eq('id', commissionId)
      .select('order_id, commission_type')
      .single()
    if (error) throw error

    const table = data?.commission_type === 'restaurant' ? 'restaurant_orders' : 'orders'
    if (data?.order_id) {
      await supabase
        .from(table)
        .update({ commission_status: 'paid' })
        .eq('id', data.order_id)
        .catch(() => {})
    }
    return true
  } catch {
    return false
  }
}

// ── Block an account ──────────────────────────────────────────────────────────
export async function blockAccount({ phone, userId, reason = 'commission_avoidance', notes = '' }) {
  if (!supabase) return false
  try {
    const payload = { reason, notes }
    if (phone)  payload.phone   = phone
    if (userId) payload.user_id = userId
    const { error } = await supabase
      .from('blocked_accounts')
      .upsert(payload, { onConflict: phone ? 'phone' : 'user_id' })
    return !error
  } catch {
    return false
  }
}

// ── Check if phone/user is blocked ───────────────────────────────────────────
export async function isAccountBlocked({ phone, userId }) {
  if (!supabase) return false
  try {
    let q = supabase
      .from('blocked_accounts')
      .select('id', { head: true, count: 'exact' })
      .is('unblocked_at', null)
    if (userId)     q = q.eq('user_id', userId)
    else if (phone) q = q.eq('phone', phone)
    else return false
    const { count, error } = await q
    return !error && (count ?? 0) > 0
  } catch {
    return false
  }
}

// ── Unblock an account ────────────────────────────────────────────────────────
export async function unblockAccount({ phone, userId }) {
  if (!supabase) return false
  try {
    let q = supabase.from('blocked_accounts').update({ unblocked_at: new Date().toISOString() })
    if (userId)     q = q.eq('user_id', userId)
    else if (phone) q = q.eq('phone', phone)
    const { error } = await q
    return !error
  } catch {
    return false
  }
}

// ── Delivery options helpers ──────────────────────────────────────────────────
// Marketplace sellers can use couriers. Food delivery is Indoo Ride only.
export const DELIVERY_SERVICES = [
  { type: 'indoo_ride', label: 'Indoo Ride 🚲', cityOnly: true,  baseFare: 15000, perKm: 3000, food: true  },
  { type: 'jne',          label: 'JNE',              cityOnly: false, baseFare: 9000,  perKm: 0,    food: false },
  { type: 'jnt',          label: 'J&T Express',      cityOnly: false, baseFare: 8000,  perKm: 0,    food: false },
  { type: 'sicepat',      label: 'SiCepat',          cityOnly: false, baseFare: 8000,  perKm: 0,    food: false },
  { type: 'ninja',        label: 'Ninja Express',    cityOnly: false, baseFare: 9000,  perKm: 0,    food: false },
  { type: 'pos',          label: 'Kantor Pos',       cityOnly: false, baseFare: 7000,  perKm: 0,    food: false },
]

// ── Freight companies — Parcels & Packages ───────────────────────────────────
export const PARCEL_CARRIERS = [
  { type: 'tiki',         label: 'TIKI',                      logo: 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsss-removebg-preview.png',                    deliveryDays: '3-4 days',  express: '1 day (ONS)' },
  { type: 'jne',          label: 'JNE',                       logo: 'https://ik.imagekit.io/nepgaxllc/sssss-removebg-preview.png',                             deliveryDays: '2-3 days',  express: '1 day (YES)' },
  { type: 'jnt_express',  label: 'J&T Express',               logo: 'https://ik.imagekit.io/nepgaxllc/Untitledsdds-removebg-preview.png',                      deliveryDays: '2-3 days',  express: '1 day' },
  { type: 'sicepat',      label: 'SiCepat Ekspres',           logo: 'https://ik.imagekit.io/nepgaxllc/Untitleddfsfsd-removebg-preview.png',                    deliveryDays: '2-3 days',  express: '1 day (BEST)' },
  { type: 'ninja',        label: 'Ninja Xpress',              logo: 'https://ik.imagekit.io/nepgaxllc/Untitledddddddss-removebg-preview.png',                  deliveryDays: '2-3 days',  express: '1 day' },
  { type: 'lion_parcel',  label: 'Lion Parcel',               logo: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdasdasdd-removebg-preview.png',              deliveryDays: '2-3 days',  express: '1 day (ONEPACK)' },
  { type: 'antaraja',     label: 'Anteraja',                  logo: 'https://ik.imagekit.io/nepgaxllc/Untitledvvdasa-removebg-preview.png',                    deliveryDays: '2-3 days',  express: 'Next day' },
  { type: 'wahana',       label: 'Wahana Express',            logo: 'https://ik.imagekit.io/nepgaxllc/Untitledvv-removebg-preview.png',                        deliveryDays: '3-5 days',  express: null },
  { type: 'sap',          label: 'SAP Express',               logo: 'https://ik.imagekit.io/nepgaxllc/Untitleddsfsdss-removebg-preview.png',                   deliveryDays: '2-4 days',  express: '1 day' },
  { type: 'idexpress',    label: 'IDExpress',                 logo: 'https://ik.imagekit.io/nepgaxllc/Untitledsddsdsdsasdasd-removebg-preview.png',             deliveryDays: '2-3 days',  express: '1 day' },
  { type: 'pos_indo',     label: 'Pos Indonesia',             logo: 'https://ik.imagekit.io/nepgaxllc/Untitledfffffddsdsdsdfsddasdassdfsdfsdfsd.png',           deliveryDays: '3-7 days',  express: '1-2 days' },
]

// ── Freight companies — Large Cargo ──────────────────────────────────────────
export const CARGO_CARRIERS = [
  { type: 'geodis',       label: 'GEODIS',                    logo: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdasddaaa-removebg-preview.png',              deliveryDays: '5-10 days', express: null },
  { type: 'jnt_cargo',    label: 'J&T Cargo',                 logo: 'https://ik.imagekit.io/nepgaxllc/Untitleddsfsdsssss-removebg-preview.png',                deliveryDays: '5-7 days',  express: '3-5 days' },
  { type: 'selog',        label: 'SELOG',                      logo: 'https://ik.imagekit.io/nepgaxllc/Untitledfffffdd-removebg-preview.png',                   deliveryDays: '5-10 days', express: null },
  { type: 'intl_flight',  label: 'International Freight',     logo: 'https://ik.imagekit.io/nepgaxllc/Untitledfffffddsdsdsdfsd-removebg-preview.png',           deliveryDays: '7-14 days', express: '3-5 days' },
  { type: 'lion_air',     label: 'Lion Air',                   logo: 'https://ik.imagekit.io/nepgaxllc/Untitledfffffddsdsd-removebg-preview.png',               deliveryDays: '3-5 days',  express: '1-2 days' },
]

// ── Export / International carriers ──────────────────────────────────────────
export const EXPORT_CARRIERS = [
  { type: 'dhl',            label: 'DHL',            logo: 'https://ik.imagekit.io/nepgaxllc/Untitledfffffddsdsdsdfsddasdas-removebg-preview.png',              deliveryDays: '5-10 days', express: '2-4 days' },
  { type: 'fedex',          label: 'FedEx',          logo: 'https://ik.imagekit.io/nepgaxllc/Untitledfffffddsdsdsdfsddasdassdfsdf-removebg-preview.png',        deliveryDays: '5-10 days', express: '2-3 days' },
  { type: 'pos_indo_intl',  label: 'Pos Indonesia',  logo: 'https://ik.imagekit.io/nepgaxllc/Untitledfffffddsdsdsdfsddasdassdfsdfsdfsd.png',                    deliveryDays: '7-14 days', express: '5-7 days' },
]

// All freight carriers combined
export const ALL_CARRIERS = [...PARCEL_CARRIERS, ...CARGO_CARRIERS, ...EXPORT_CARRIERS]

// Food delivery only uses Indoo Ride (bike) — couriers don't deliver hot food.
export const FOOD_DELIVERY_SERVICES = DELIVERY_SERVICES.filter(s => s.food)

export async function saveDeliveryOptions(userId, options) {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('businesses')
      .upsert({ user_id: userId, delivery_options: options }, { onConflict: 'user_id' })
    return !error
  } catch {
    return false
  }
}

export async function fetchDeliveryOptions(userId) {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('delivery_options')
      .eq('user_id', userId)
      .single()
    if (error || !data) return []
    return data.delivery_options ?? []
  } catch {
    return []
  }
}

// ── Driver cash float helpers ─────────────────────────────────────────────────
// Called by the booking matcher before assigning a COD food order to a driver.
// Rule: driver.cashFloat must be >= order.foodTotal to be eligible.
// If driver declared Rp 50.000 and food order is Rp 100.000 → NOT eligible.

/**
 * Returns true when a driver is eligible to accept a COD food order.
 * @param {number} driverCashFloat  – amount declared at sign-in (IDR)
 * @param {number} orderFoodTotal   – total food cost to be paid to restaurant (IDR)
 * @param {string} paymentMethod    – 'cod' | 'transfer'
 */
export function driverEligibleForOrder(driverCashFloat, orderFoodTotal, paymentMethod) {
  if (paymentMethod !== 'cod') return true          // transfer orders have no float requirement
  return (driverCashFloat ?? 0) >= orderFoodTotal   // float must cover the full food price
}

/**
 * Save the driver's declared cash float to Supabase.
 * Updates driver_profiles.cash_float and cash_float_declared_at.
 */
export async function saveDriverCashFloat(driverId, amount) {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('driver_profiles')
      .update({
        cash_float: amount,
        cash_float_declared_at: new Date().toISOString(),
      })
      .eq('user_id', driverId)
    return !error
  } catch {
    return false
  }
}

/**
 * Fetch the driver's current declared cash float.
 */
export async function getDriverCashFloat(driverId) {
  if (!supabase) return 0
  try {
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('cash_float, cash_float_declared_at')
      .eq('user_id', driverId)
      .single()
    if (error || !data) return 0
    return data.cash_float ?? 0
  } catch {
    return 0
  }
}

// ── IDR formatter ─────────────────────────────────────────────────────────────
export function fmtIDR(amount) {
  if (!amount) return 'Rp 0'
  return 'Rp ' + Number(amount).toLocaleString('id-ID')
}
