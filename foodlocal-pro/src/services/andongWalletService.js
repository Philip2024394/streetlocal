/**
 * Andong Wallet Service
 * Handles payments, commission deductions, and owner wallet balance.
 * Customer pays upfront → 10% goes to INDOO → 90% goes to owner wallet.
 * Owner can withdraw from wallet to bank account.
 *
 * This prevents bypassing: owner can't just share WhatsApp because
 * the booking + payment happens in-app first.
 */
import { supabase } from '@/lib/supabase'

const COMMISSION_RATE = 0.10

// ── Demo wallet data ────────────────────────────────────────────────────────

const DEMO_WALLETS = {
  'horse-001': { owner_id: 'horse-001', owner_name: 'Pak Slamet', balance: 1850000, total_earned: 8500000, total_commission: 945000, total_withdrawals: 6650000, pending_withdrawal: 0 },
  'horse-002': { owner_id: 'horse-002', owner_name: 'Pak Bambang', balance: 920000, total_earned: 4200000, total_commission: 467000, total_withdrawals: 3280000, pending_withdrawal: 0 },
  'horse-003': { owner_id: 'horse-003', owner_name: 'Pak Widodo', balance: 2450000, total_earned: 12000000, total_commission: 1333000, total_withdrawals: 9550000, pending_withdrawal: 0 },
  'horse-004': { owner_id: 'horse-004', owner_name: 'Pak Harto', balance: 560000, total_earned: 2800000, total_commission: 311000, total_withdrawals: 2240000, pending_withdrawal: 0 },
  'horse-005': { owner_id: 'horse-005', owner_name: 'Pak Suryo', balance: 1680000, total_earned: 9800000, total_commission: 1089000, total_withdrawals: 8120000, pending_withdrawal: 0 },
}

const DEMO_TRANSACTIONS = [
  { id: 't1', owner_id: 'horse-001', type: 'earning', amount: 225000, commission: 25000, net: 225000, booking_id: 'a-001', package_name: 'Royal Heritage', customer_name: 'Sarah J.', created_at: '2026-04-30T08:30:00Z' },
  { id: 't2', owner_id: 'horse-001', type: 'earning', amount: 360000, commission: 40000, net: 360000, booking_id: 'a-002', package_name: 'Prambanan Village', customer_name: 'Tom W.', created_at: '2026-04-29T09:15:00Z' },
  { id: 't3', owner_id: 'horse-001', type: 'withdrawal', amount: -500000, commission: 0, net: -500000, bank_name: 'BCA', account_number: '****5678', created_at: '2026-04-28T14:00:00Z' },
  { id: 't4', owner_id: 'horse-001', type: 'earning', amount: 450000, commission: 50000, net: 450000, booking_id: 'a-003', package_name: 'Full City Culture', customer_name: 'Yuki M.', created_at: '2026-04-27T10:00:00Z' },
  { id: 't5', owner_id: 'horse-001', type: 'earning', amount: 90000, commission: 10000, net: 90000, booking_id: 'a-004', package_name: 'Malioboro Classic', customer_name: 'David L.', created_at: '2026-04-26T18:30:00Z' },
]

// ── Process booking payment ─────────────────────────────────────────────────

/**
 * Process payment for an andong booking.
 * Customer pays full price → split into owner earnings + INDOO commission.
 */
export async function processAndongPayment(bookingId, ownerId, customerFare, packageName, customerName) {
  const commission = Math.round(customerFare * COMMISSION_RATE)
  const ownerEarnings = customerFare - commission

  const transaction = {
    id: `txn-${Date.now()}`,
    owner_id: ownerId,
    type: 'earning',
    amount: ownerEarnings,
    commission,
    net: ownerEarnings,
    booking_id: bookingId,
    package_name: packageName,
    customer_name: customerName,
    created_at: new Date().toISOString(),
  }

  if (!supabase) {
    // Demo mode — update local wallet
    if (DEMO_WALLETS[ownerId]) {
      DEMO_WALLETS[ownerId].balance += ownerEarnings
      DEMO_WALLETS[ownerId].total_earned += ownerEarnings
      DEMO_WALLETS[ownerId].total_commission += commission
    }
    return { transaction, ownerEarnings, commission }
  }

  // Production — insert transaction + update wallet
  const { error: txnErr } = await supabase.from('andong_transactions').insert(transaction)
  if (txnErr) throw txnErr

  const { error: walErr } = await supabase.rpc('andong_wallet_credit', {
    p_owner_id: ownerId,
    p_amount: ownerEarnings,
    p_commission: commission,
  })
  if (walErr) throw walErr

  return { transaction, ownerEarnings, commission }
}

// ── Wallet queries ──────────────────────────────────────────────────────────

export async function getOwnerWallet(ownerId) {
  if (!supabase) return DEMO_WALLETS[ownerId] || null

  const { data } = await supabase
    .from('andong_wallets')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle()
  return data
}

export async function getOwnerTransactions(ownerId, limit = 20) {
  if (!supabase) return DEMO_TRANSACTIONS.filter(t => t.owner_id === ownerId).slice(0, limit)

  const { data } = await supabase
    .from('andong_transactions')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function requestWithdrawal(ownerId, amount, bankName, accountNumber) {
  const wallet = await getOwnerWallet(ownerId)
  if (!wallet || wallet.balance < amount) throw new Error('Insufficient balance')

  const withdrawal = {
    id: `wd-${Date.now()}`,
    owner_id: ownerId,
    type: 'withdrawal',
    amount: -amount,
    commission: 0,
    net: -amount,
    bank_name: bankName,
    account_number: accountNumber,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  if (!supabase) {
    DEMO_WALLETS[ownerId].balance -= amount
    DEMO_WALLETS[ownerId].total_withdrawals += amount
    DEMO_WALLETS[ownerId].pending_withdrawal += amount
    return withdrawal
  }

  await supabase.from('andong_transactions').insert(withdrawal)
  await supabase.rpc('andong_wallet_debit', { p_owner_id: ownerId, p_amount: amount })
  return withdrawal
}

// ── Admin queries ───────────────────────────────────────────────────────────

export async function getAllWallets() {
  if (!supabase) return Object.values(DEMO_WALLETS)

  const { data } = await supabase
    .from('andong_wallets')
    .select('*')
    .order('total_earned', { ascending: false })
  return data ?? Object.values(DEMO_WALLETS)
}

export async function getAllTransactions(limit = 50) {
  if (!supabase) return DEMO_TRANSACTIONS.slice(0, limit)

  const { data } = await supabase
    .from('andong_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? DEMO_TRANSACTIONS
}

export async function getTotalCommission() {
  if (!supabase) {
    return Object.values(DEMO_WALLETS).reduce((sum, w) => sum + w.total_commission, 0)
  }

  const { data } = await supabase.rpc('andong_total_commission')
  return data ?? 0
}

export function formatRpWallet(n) {
  return `Rp ${Math.abs(Number(n)).toLocaleString('id-ID')}`
}
