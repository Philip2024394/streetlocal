/**
 * Indoo Universal Wallet — one wallet for all services
 * Marketplace, Rentals, Rides, Food, Dating
 *
 * Commission: 10% rentals, 5% property sales, 5% motor sales
 * Debt limit: Rp 50.000 for new accounts
 * Credit limit increases with trading history
 *
 * Primary: Supabase (wallets + wallet_transactions tables)
 * Fallback: localStorage (demo mode / offline)
 */

import { supabase } from '@/lib/supabase'
import {
  notifyCommissionAdded,
  notifyAccountCapped,
} from '@/services/notificationService'

const WALLET_KEY = 'indoo_wallet'
export const COMMISSION_RATE = 0.10
export const COMMISSION_RATE_PROPERTY_SALE = 0.05
export const COMMISSION_RATE_MOTOR_SALE = 0.05

export function getCommissionRate(type) {
  if (type === 'property_sale') return COMMISSION_RATE_PROPERTY_SALE
  if (type === 'motor_sale') return COMMISSION_RATE_MOTOR_SALE
  return COMMISSION_RATE
}
export const DEFAULT_DEBT_LIMIT = 50000

const HISTORY_THRESHOLDS = [
  { orders: 50,  limit: 75000 },
  { orders: 100, limit: 100000 },
  { orders: 250, limit: 150000 },
  { orders: 500, limit: 200000 },
]

const LEVEL_GREEN = 'green'
const LEVEL_YELLOW = 'yellow'
const LEVEL_ORANGE = 'orange'
const LEVEL_RED = 'red'

// ── Local storage helpers (fallback) ────────────────────────────────────────
function getLocalWallet(userId) {
  try {
    const data = JSON.parse(localStorage.getItem(WALLET_KEY) || '{}')
    if (!data[userId]) {
      data[userId] = {
        balance: 0, commissionOwed: 0, totalEarned: 0,
        totalCommissionPaid: 0, totalOrders: 0,
        debtLimit: DEFAULT_DEBT_LIMIT, freeOrdersLeft: 1,
        transactions: [], created_at: new Date().toISOString(),
      }
      localStorage.setItem(WALLET_KEY, JSON.stringify(data))
    }
    return data[userId]
  } catch {
    return { balance: 0, commissionOwed: 0, totalEarned: 0, totalCommissionPaid: 0, totalOrders: 0, debtLimit: DEFAULT_DEBT_LIMIT, freeOrdersLeft: 1, transactions: [], created_at: new Date().toISOString() }
  }
}

function saveLocalWallet(userId, wallet) {
  try {
    const data = JSON.parse(localStorage.getItem(WALLET_KEY) || '{}')
    data[userId] = wallet
    localStorage.setItem(WALLET_KEY, JSON.stringify(data))
  } catch {}
}

function calcDebtLimit(totalOrders) {
  let limit = DEFAULT_DEBT_LIMIT
  for (const t of HISTORY_THRESHOLDS) {
    if (totalOrders >= t.orders) limit = t.limit
  }
  return limit
}

// ── Get wallet (Supabase → localStorage fallback) ───────────────────────────
export async function getWallet(userId = 'default') {
  if (supabase && userId !== 'default') {
    try {
      const { data } = await supabase.rpc('get_or_create_wallet', { p_user_id: userId })
      if (data) return {
        balance: data.balance, commissionOwed: data.commission_owed,
        totalEarned: data.total_earned, totalCommissionPaid: data.total_commission_paid,
        totalOrders: data.total_orders, debtLimit: data.debt_limit,
        freeOrdersLeft: data.free_orders_left, status: data.status,
      }
    } catch {}
  }
  return getLocalWallet(userId)
}

// Sync version for UI that can't await
export function getWalletSync(userId = 'default') {
  return getLocalWallet(userId)
}

// ── Get warning level ───────────────────────────────────────────────────────
export function getWarningLevel(userId = 'default') {
  const w = getLocalWallet(userId)
  const ratio = w.debtLimit > 0 ? w.commissionOwed / w.debtLimit : 0
  if (ratio >= 1) return { level: LEVEL_RED, message: `Account capped — pay Rp ${fmtK(w.commissionOwed)} to resume receiving orders`, paused: true }
  if (ratio >= 0.8) return { level: LEVEL_ORANGE, message: `Please clear balance — Rp ${fmtK(w.commissionOwed)} due`, paused: false }
  if (ratio >= 0.5) return { level: LEVEL_YELLOW, message: `Top up soon — Rp ${fmtK(w.commissionOwed)} commission due`, paused: false }
  return { level: LEVEL_GREEN, message: w.commissionOwed > 0 ? `Commission due: Rp ${fmtK(w.commissionOwed)}` : 'Wallet clear', paused: false }
}

// ── Check if user can receive orders ────────────────────────────────────────
export function canReceiveOrders(userId = 'default') {
  const w = getLocalWallet(userId)
  return w.commissionOwed < w.debtLimit
}

// ── Process commission (Supabase + localStorage) ────────────────────────────
export async function processCommission(userId = 'default', service, orderId, orderAmount) {
  // Supabase call
  if (supabase && userId !== 'default') {
    try {
      const { data } = await supabase.rpc('process_wallet_commission', {
        p_user_id: userId, p_service: service,
        p_order_id: String(orderId), p_order_amount: Math.round(orderAmount),
      })
      if (data) {
        // Sync to local
        const w = getLocalWallet(userId)
        if (data.free) { w.freeOrdersLeft = data.free_left ?? w.freeOrdersLeft - 1 }
        w.totalOrders++; w.totalEarned += orderAmount
        if (data.deducted) { w.balance = data.balance ?? Math.max(0, w.balance - data.commission) }
        if (data.owed) { w.commissionOwed = data.owed }
        w.debtLimit = calcDebtLimit(w.totalOrders)
        w.transactions.push({ id: `tx_${Date.now()}`, type: data.free ? 'free_order' : data.deducted ? 'commission_paid' : 'commission_owed', service, orderId, amount: orderAmount, commission: data.commission || 0, date: new Date().toISOString() })
        saveLocalWallet(userId, w)
        return data
      }
    } catch {}
  }

  // localStorage fallback
  const w = getLocalWallet(userId)
  const rate = getCommissionRate(service)
  const commission = Math.round(orderAmount * rate)

  if (w.freeOrdersLeft > 0) {
    w.freeOrdersLeft--; w.totalOrders++; w.totalEarned += orderAmount
    w.debtLimit = calcDebtLimit(w.totalOrders)
    w.transactions.push({ id: `tx_${Date.now()}`, type: 'free_order', service, orderId, amount: orderAmount, commission: 0, note: `Free order (${w.freeOrdersLeft} left)`, date: new Date().toISOString() })
    saveLocalWallet(userId, w)
    return { success: true, free: true, freeLeft: w.freeOrdersLeft, commission: 0 }
  }

  if (w.balance >= commission) {
    w.balance -= commission; w.totalCommissionPaid += commission; w.totalOrders++; w.totalEarned += orderAmount
    w.debtLimit = calcDebtLimit(w.totalOrders)
    w.transactions.push({ id: `tx_${Date.now()}`, type: 'commission_paid', service, orderId, amount: orderAmount, commission, note: 'Auto-deducted from wallet', date: new Date().toISOString() })
    saveLocalWallet(userId, w)
    return { success: true, free: false, deducted: true, commission, balanceLeft: w.balance }
  }

  const fromWallet = w.balance; const remaining = commission - fromWallet
  w.balance = 0; w.commissionOwed += remaining; w.totalCommissionPaid += fromWallet; w.totalOrders++; w.totalEarned += orderAmount
  w.debtLimit = calcDebtLimit(w.totalOrders)
  w.transactions.push({ id: `tx_${Date.now()}`, type: 'commission_owed', service, orderId, amount: orderAmount, commission, paid: fromWallet, owed: remaining, note: fromWallet > 0 ? `Rp ${fmtK(fromWallet)} from wallet, Rp ${fmtK(remaining)} owed` : `Rp ${fmtK(remaining)} added to debt`, date: new Date().toISOString() })
  saveLocalWallet(userId, w)

  const capped = w.commissionOwed >= w.debtLimit

  // Fire commission notifications (non-blocking)
  notifyCommissionAdded(userId, String(orderId), commission, w.commissionOwed).catch(() => {})
  if (capped) {
    notifyAccountCapped(userId, w.commissionOwed, w.debtLimit).catch(() => {})
  }

  return { success: true, free: false, deducted: false, commission, owed: w.commissionOwed, capped, paused: capped }
}

// ── Top up wallet ───────────────────────────────────────────────────────────
export async function topUpWallet(userId = 'default', amount) {
  if (supabase && userId !== 'default') {
    try {
      const { data } = await supabase.rpc('top_up_wallet', { p_user_id: userId, p_amount: Math.round(amount) })
      if (data) {
        const w = getLocalWallet(userId)
        w.balance = data.balance; w.commissionOwed = data.commission_owed
        w.transactions.push({ id: `tx_${Date.now()}`, type: 'top_up', amount, date: new Date().toISOString() })
        saveLocalWallet(userId, w)
        return data
      }
    } catch {}
  }

  // localStorage fallback
  const w = getLocalWallet(userId)
  if (w.commissionOwed > 0) {
    if (amount >= w.commissionOwed) { amount -= w.commissionOwed; w.totalCommissionPaid += w.commissionOwed; w.commissionOwed = 0 }
    else { w.commissionOwed -= amount; w.totalCommissionPaid += amount; amount = 0 }
  }
  w.balance += amount
  w.transactions.push({ id: `tx_${Date.now()}`, type: 'top_up', amount, note: 'Wallet topped up', date: new Date().toISOString() })
  saveLocalWallet(userId, w)
  return { balance: w.balance, commissionOwed: w.commissionOwed }
}

// ── Admin adjust wallet ─────────────────────────────────────────────────────
export async function adminAdjustWallet(adminId, userId, amount, type, note) {
  if (supabase) {
    try {
      const { data } = await supabase.rpc('admin_adjust_wallet', {
        p_admin_id: adminId, p_user_id: userId,
        p_amount: Math.round(amount), p_type: type, p_note: note,
      })
      if (data) {
        const w = getLocalWallet(userId)
        w.balance = data.balance; w.commissionOwed = data.commission_owed
        saveLocalWallet(userId, w)
        return data
      }
    } catch {}
  }

  // localStorage fallback
  const w = getLocalWallet(userId)
  if (type === 'credit') { w.balance += amount }
  else if (type === 'debit') { w.balance = Math.max(0, w.balance - amount) }
  else if (type === 'clear_debt') { w.commissionOwed = 0 }
  w.transactions.push({ id: `tx_${Date.now()}`, type: `admin_${type}`, amount, note: note || `Admin ${type}`, date: new Date().toISOString() })
  saveLocalWallet(userId, w)
  return { balance: w.balance, commissionOwed: w.commissionOwed }
}

// ── Get transactions ────────────────────────────────────────────────────────
export async function getTransactions(userId = 'default', limit = 20) {
  if (supabase && userId !== 'default') {
    try {
      const { data } = await supabase.from('wallet_transactions')
        .select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(limit)
      if (data?.length) return data
    } catch {}
  }
  const w = getLocalWallet(userId)
  return w.transactions.slice(-limit).reverse()
}

// ── Get wallet summary ──────────────────────────────────────────────────────
export function getWalletSummary(userId = 'default') {
  const w = getLocalWallet(userId)
  const warning = getWarningLevel(userId)
  return {
    balance: w.balance, commissionOwed: w.commissionOwed, debtLimit: w.debtLimit,
    totalEarned: w.totalEarned, totalCommissionPaid: w.totalCommissionPaid,
    totalOrders: w.totalOrders, freeOrdersLeft: w.freeOrdersLeft,
    commissionRate: COMMISSION_RATE, warning,
    canReceiveOrders: w.commissionOwed < w.debtLimit,
  }
}

// ── Format helpers ──────────────────────────────────────────────────────────
function fmtK(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'jt'
  return n.toLocaleString('id-ID')
}

export function fmtIDR(n) {
  if (!n) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

// ═══════════════════════════════════════════════════════════════════════════════
// Prepaid Wallet System (driver/restaurant wallets with minimums)
// localStorage keys: indoo_wallet_{userId}, indoo_wallet_topups_{userId},
//   indoo_wallet_deductions_{userId}, indoo_wallet_alerts_{userId}
// ═══════════════════════════════════════════════════════════════════════════════

const MINIMUM_BALANCES = {
  bike_rider: 30000,
  car_driver: 100000,
  restaurant: 50000,
}

const DEFAULT_DEMO_BALANCE = 50000
const DEACTIVATION_HOURS = 24

function getPrepaidWalletKey(userId) { return `indoo_wallet_${userId}` }
function getTopupsKey(userId) { return `indoo_wallet_topups_${userId}` }
function getDeductionsKey(userId) { return `indoo_wallet_deductions_${userId}` }
function getAlertsKey(userId) { return `indoo_wallet_alerts_${userId}` }

function readJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback }
  catch { return fallback }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

/**
 * Get or create a prepaid wallet for a user.
 * Creates with demo balance (Rp 50,000) if none exists.
 */
export async function getPrepaidWallet(userId, userType = 'bike_rider') {
  // Try Supabase first
  if (supabase && userId && userId !== 'demo') {
    try {
      const { data } = await supabase.from('wallets').select('*').eq('user_id', userId).single()
      if (data) return data
    } catch {}
  }

  // localStorage demo mode
  const key = getPrepaidWalletKey(userId)
  let w = readJSON(key)
  if (!w) {
    w = {
      user_id: userId,
      user_type: userType,
      balance: DEFAULT_DEMO_BALANCE,
      minimum: MINIMUM_BALANCES[userType] || 30000,
      status: 'active',
      created_at: new Date().toISOString(),
      restricted_at: null,
      deactivated_at: null,
    }
    writeJSON(key, w)
  }
  return w
}

/**
 * Top up wallet balance.
 * @returns updated wallet object
 */
export async function topUpPrepaidWallet(userId, amount, method = 'bank_transfer') {
  if (supabase && userId && userId !== 'demo') {
    try {
      const { data } = await supabase.rpc('prepaid_top_up', {
        p_user_id: userId, p_amount: Math.round(amount), p_method: method,
      })
      if (data) return data
    } catch {}
  }

  const key = getPrepaidWalletKey(userId)
  const w = readJSON(key)
  if (!w) return null

  w.balance = (w.balance || 0) + Math.round(amount)

  // If was restricted/deactivated and now meets minimum, reactivate
  if ((w.status === 'restricted' || w.status === 'deactivated') && w.balance >= (w.minimum || 30000)) {
    w.status = 'active'
    w.restricted_at = null
    w.deactivated_at = null
  }
  writeJSON(key, w)

  // Record topup
  const topups = readJSON(getTopupsKey(userId), [])
  topups.push({
    id: `tu_${Date.now()}`,
    amount: Math.round(amount),
    method,
    balance_after: w.balance,
    date: new Date().toISOString(),
  })
  writeJSON(getTopupsKey(userId), topups)

  return w
}

/**
 * Deduct commission from wallet after an order.
 * If balance drops below minimum, sets status to 'restricted'.
 */
export async function deductCommission(userId, orderId, orderType, orderTotal, rate = 0.10) {
  const commission = Math.round(orderTotal * rate)

  if (supabase && userId && userId !== 'demo') {
    try {
      const { data } = await supabase.rpc('deduct_wallet_commission', {
        p_user_id: userId, p_order_id: String(orderId),
        p_order_type: orderType, p_amount: commission,
      })
      if (data) return data
    } catch {}
  }

  const key = getPrepaidWalletKey(userId)
  const w = readJSON(key)
  if (!w) return { success: false }

  w.balance = Math.max(0, (w.balance || 0) - commission)

  const deduction = {
    id: `ded_${Date.now()}`,
    order_id: orderId,
    order_type: orderType,
    order_total: orderTotal,
    commission,
    rate,
    balance_after: w.balance,
    date: new Date().toISOString(),
  }

  // Check if below minimum
  if (w.balance < (w.minimum || 30000) && w.status === 'active') {
    w.status = 'restricted'
    w.restricted_at = new Date().toISOString()
    // Add alert
    const alerts = readJSON(getAlertsKey(userId), [])
    alerts.push({
      id: `alert_${Date.now()}`,
      type: 'balance_low',
      message: `Balance dropped below minimum (Rp ${(w.minimum || 30000).toLocaleString('id-ID')}). Top up to continue receiving orders.`,
      read: false,
      date: new Date().toISOString(),
    })
    writeJSON(getAlertsKey(userId), alerts)
  }

  writeJSON(key, w)

  // Record deduction
  const deductions = readJSON(getDeductionsKey(userId), [])
  deductions.push(deduction)
  writeJSON(getDeductionsKey(userId), deductions)

  return { success: true, wallet: w, deduction }
}

/**
 * Check wallet status. If restricted for 24+ hours, deactivate.
 */
export async function checkWalletStatus(userId) {
  if (supabase && userId && userId !== 'demo') {
    try {
      const { data } = await supabase.from('wallets').select('*').eq('user_id', userId).single()
      if (data) return {
        status: data.status,
        balance: data.balance,
        minimum: data.minimum,
        canReceiveOrders: data.status === 'active',
        hoursRemaining: null,
      }
    } catch {}
  }

  const key = getPrepaidWalletKey(userId)
  const w = readJSON(key)
  if (!w) return { status: 'unknown', balance: 0, minimum: 30000, canReceiveOrders: false, hoursRemaining: 0 }

  let hoursRemaining = null

  if (w.status === 'restricted' && w.restricted_at) {
    const elapsed = (Date.now() - new Date(w.restricted_at).getTime()) / (1000 * 60 * 60)
    if (elapsed >= DEACTIVATION_HOURS) {
      w.status = 'deactivated'
      w.deactivated_at = new Date().toISOString()
      writeJSON(key, w)
      // Alert
      const alerts = readJSON(getAlertsKey(userId), [])
      alerts.push({
        id: `alert_${Date.now()}`,
        type: 'deactivated',
        message: 'Account deactivated due to low balance. Top up to reactivate.',
        read: false,
        date: new Date().toISOString(),
      })
      writeJSON(getAlertsKey(userId), alerts)
    } else {
      hoursRemaining = Math.ceil(DEACTIVATION_HOURS - elapsed)
    }
  }

  return {
    status: w.status,
    balance: w.balance,
    minimum: w.minimum || 30000,
    canReceiveOrders: w.status === 'active',
    hoursRemaining,
  }
}

/**
 * Reactivate wallet if balance meets minimum.
 */
export async function reactivateWallet(userId) {
  if (supabase && userId && userId !== 'demo') {
    try {
      const { data } = await supabase.rpc('reactivate_wallet', { p_user_id: userId })
      if (data) return data
    } catch {}
  }

  const key = getPrepaidWalletKey(userId)
  const w = readJSON(key)
  if (!w) return null

  if (w.balance >= (w.minimum || 30000)) {
    w.status = 'active'
    w.restricted_at = null
    w.deactivated_at = null
    writeJSON(key, w)
  }
  return w
}

/**
 * Get last 20 topups and deductions combined, sorted by date desc.
 */
export async function getWalletHistory(userId) {
  if (supabase && userId && userId !== 'demo') {
    try {
      const { data } = await supabase.from('wallet_transactions')
        .select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(20)
      if (data?.length) return data
    } catch {}
  }

  const topups = readJSON(getTopupsKey(userId), []).map(t => ({ ...t, type: 'topup' }))
  const deductions = readJSON(getDeductionsKey(userId), []).map(d => ({ ...d, type: 'deduction' }))
  return [...topups, ...deductions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
}

/**
 * Get unread alerts for a user's wallet.
 */
export async function getWalletAlerts(userId) {
  if (supabase && userId && userId !== 'demo') {
    try {
      const { data } = await supabase.from('wallet_alerts')
        .select('*').eq('user_id', userId).eq('read', false)
        .order('created_at', { ascending: false })
      if (data) return data
    } catch {}
  }

  const alerts = readJSON(getAlertsKey(userId), [])
  return alerts.filter(a => !a.read)
}
