/**
 * SellerCommissionScreen
 * Seller-facing dashboard: unpaid balance, commission history, pay CTA,
 * and upgrade-to-monthly escape hatch.
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getSellerBalance,
  getSellerCommissions,
  fmtIDR,
  DELIVERY_SERVICES,
} from '@/services/commissionService'
import CommissionPaymentScreen from './CommissionPaymentScreen'
import styles from './SellerCommissionScreen.module.css'

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)',   border: 'rgba(255,149,0,0.3)'  },
  overdue:  { label: 'Overdue',  color: '#FF3B30', bg: 'rgba(255,59,48,0.1)',   border: 'rgba(255,59,48,0.3)'  },
  paid:     { label: 'Paid',     color: '#34C759', bg: 'rgba(52,199,89,0.1)',   border: 'rgba(52,199,89,0.3)'  },
  waived:   { label: 'Waived',   color: '#8DC63F', bg: 'rgba(141,198,63,0.1)', border: 'rgba(141,198,63,0.3)' },
}

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const DEMO_COMMISSIONS = [
  { id: 'c1', order_id: '#SHOP_98765432', amount: 20000,  status: 'pending', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), due_at: new Date(Date.now() + 3600000 * 70).toISOString() },
  { id: 'c2', order_id: '#SHOP_55512345', amount: 47500,  status: 'overdue', created_at: new Date(Date.now() - 86400000 * 4).toISOString(), due_at: new Date(Date.now() - 3600000 * 5).toISOString()  },
  { id: 'c3', order_id: '#SHOP_22389901', amount: 16000,  status: 'paid',    created_at: new Date(Date.now() - 86400000 * 7).toISOString(), paid_at: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: 'c4', order_id: '#SHOP_10293847', amount: 60000,  status: 'paid',    created_at: new Date(Date.now() - 86400000 * 14).toISOString(), paid_at: new Date(Date.now() - 86400000 * 12).toISOString() },
]

export default function SellerCommissionScreen({ onClose, onUpgrade }) {
  const { user } = useAuth()
  const [balance, setBalance] = useState({ totalOwed: 0, totalPaid: 0, pendingCount: 0, overdueCount: 0 })
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('unpaid')
  const [paymentOpen, setPaymentOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const uid = user?.uid ?? user?.id
    if (!uid) {
      setBalance({ totalOwed: 67500, totalPaid: 76000, pendingCount: 1, overdueCount: 1 })
      setCommissions(DEMO_COMMISSIONS)
      setLoading(false)
      return
    }
    const [bal, hist] = await Promise.all([
      getSellerBalance(uid),
      getSellerCommissions(uid),
    ])
    setBalance(bal)
    setCommissions(hist.length ? hist : DEMO_COMMISSIONS)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const unpaid = commissions.filter(c => c.status === 'pending' || c.status === 'overdue')
  const paid   = commissions.filter(c => c.status === 'paid' || c.status === 'waived')
  const rows   = tab === 'unpaid' ? unpaid : paid

  const hasOverdue = balance.overdueCount > 0

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Commission Balance</span>
        <div className={styles.headerRight} />
      </div>

      <div className={styles.scroll}>

        {/* Balance card */}
        <div className={`${styles.balanceCard} ${hasOverdue ? styles.balanceCardOverdue : ''}`}>
          <div className={styles.balanceRow}>
            <div className={styles.balanceStat}>
              <span className={styles.balanceLabel}>Outstanding</span>
              <span className={`${styles.balanceAmount} ${hasOverdue ? styles.balanceAmountRed : styles.balanceAmountOrange}`}>
                {fmtIDR(balance.totalOwed)}
              </span>
              {balance.overdueCount > 0 && (
                <span className={styles.overdueChip}>🚨 {balance.overdueCount} overdue</span>
              )}
            </div>
            <div className={styles.balanceDivider} />
            <div className={styles.balanceStat}>
              <span className={styles.balanceLabel}>Total Paid</span>
              <span className={styles.balanceAmountGreen}>{fmtIDR(balance.totalPaid)}</span>
              <span className={styles.paidChip}>✓ All time</span>
            </div>
          </div>

          {balance.totalOwed > 0 && (
            <div className={styles.paySection}>
              <p className={styles.payNote}>
                Pay your outstanding commission to restore full chat access with buyers.
              </p>
              <div className={styles.payActions}>
                <button
                  className={styles.btnPay}
                  onClick={() => setPaymentOpen(true)}
                >
                  💳 Pay {fmtIDR(balance.totalOwed)}
                </button>
                <button className={styles.btnUpgrade} onClick={onUpgrade}>
                  ⭐ Upgrade — Skip commissions
                </button>
              </div>
            </div>
          )}

          {balance.totalOwed === 0 && (
            <div className={styles.allClearRow}>
              <span className={styles.allClearIcon}>✅</span>
              <span className={styles.allClearText}>All commissions paid — chat fully open</span>
            </div>
          )}
        </div>

        {/* What is 10% commission */}
        <div className={styles.infoCard}>
          <span className={styles.infoIcon}>ℹ️</span>
          <div className={styles.infoBody}>
            <span className={styles.infoTitle}>How commission works</span>
            <p className={styles.infoText}>
              Indoo charges a <strong>10% commission</strong> on rentals, <strong>5%</strong> on property sales (house, factory, kos, villa), and <strong>5%</strong> on motor sales.
              You have <strong>72 hours</strong> after marking "Payment Received" to settle.
              Unpaid commissions lock your chat reply — buyers can still reach you.
            </p>
            <p className={styles.infoText}>
              Monthly subscribers pay <strong>zero per-sale commission</strong>.
            </p>
          </div>
        </div>

        {/* History tabs */}
        <div className={styles.section}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabBtn} ${tab === 'unpaid' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('unpaid')}
            >
              Unpaid
              {unpaid.length > 0 && <span className={styles.tabBadge}>{unpaid.length}</span>}
            </button>
            <button
              className={`${styles.tabBtn} ${tab === 'paid' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('paid')}
            >
              Paid history
            </button>
          </div>

          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : rows.length === 0 ? (
            <div className={styles.empty}>
              {tab === 'unpaid' ? 'No outstanding commissions 🎉' : 'No payment history yet'}
            </div>
          ) : (
            <div className={styles.list}>
              {rows.map(c => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending
                return (
                  <div key={c.id} className={styles.row}>
                    <div className={styles.rowLeft}>
                      <span className={styles.rowRef}>{c.order_id}</span>
                      <span className={styles.rowDate}>
                        {tab === 'paid' && c.paid_at
                          ? `Paid ${fmtDate(c.paid_at)}`
                          : c.status === 'overdue'
                          ? `Due ${fmtDate(c.due_at)} — OVERDUE`
                          : `Due ${fmtDate(c.due_at)}`}
                      </span>
                    </div>
                    <div className={styles.rowRight}>
                      <span className={styles.rowAmount}>{fmtIDR(c.amount)}</span>
                      <span
                        className={styles.rowStatus}
                        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Delivery services info */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Accepted Delivery Services</span>
          <div className={styles.deliveryGrid}>
            {DELIVERY_SERVICES.map(s => (
              <div key={s.type} className={styles.deliveryChip}>
                <span>{s.label}</span>
                {s.cityOnly && <span className={styles.cityTag}>City only</span>}
              </div>
            ))}
          </div>
        </div>

      </div>

      <CommissionPaymentScreen open={paymentOpen} onClose={() => setPaymentOpen(false)} />
    </div>
  )
}
