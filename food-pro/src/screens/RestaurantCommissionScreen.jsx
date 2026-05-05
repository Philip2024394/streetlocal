/**
 * RestaurantCommissionScreen
 * Restaurant-owner view: 10% commission balance, history, pay CTA,
 * and upgrade-to-monthly escape hatch.
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSellerBalance, getSellerCommissions, fmtIDR } from '@/services/commissionService'
import CommissionPaymentScreen from './CommissionPaymentScreen'
import styles from './RestaurantCommissionScreen.module.css'

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
  { id: 'r1', order_id: '#MAKAN_11223344', amount: 8100,  status: 'pending', commission_type: 'restaurant', created_at: new Date(Date.now() - 3600000).toISOString(),      due_at: new Date(Date.now() + 3600000 * 71).toISOString() },
  { id: 'r2', order_id: '#MAKAN_55667788', amount: 15500, status: 'overdue', commission_type: 'restaurant', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), due_at: new Date(Date.now() - 3600000 * 6).toISOString()  },
  { id: 'r3', order_id: '#MAKAN_99001122', amount: 6600,  status: 'paid',    commission_type: 'restaurant', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), paid_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'r4', order_id: '#MAKAN_33445566', amount: 12000, status: 'paid',    commission_type: 'restaurant', created_at: new Date(Date.now() - 86400000 * 10).toISOString(), paid_at: new Date(Date.now() - 86400000 * 9).toISOString() },
]

export default function RestaurantCommissionScreen({ onClose, onUpgrade }) {
  const { user } = useAuth()
  const [balance, setBalance]       = useState({ totalOwed: 0, totalPaid: 0, pendingCount: 0, overdueCount: 0 })
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('unpaid')
  const [paymentOpen, setPaymentOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const uid = user?.uid ?? user?.id
    if (!uid) {
      setBalance({ totalOwed: 23600, totalPaid: 18600, pendingCount: 1, overdueCount: 1 })
      setCommissions(DEMO_COMMISSIONS)
      setLoading(false)
      return
    }
    const [bal, hist] = await Promise.all([
      getSellerBalance(uid, 'restaurant'),
      getSellerCommissions(uid, { type: 'restaurant' }),
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

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Restaurant Commission</span>
        <div className={styles.headerRight} />
      </div>

      <div className={styles.scroll}>

        {/* Rate badge */}
        <div className={styles.rateBadge}>
          <span className={styles.rateBadgeIcon}>🍽️</span>
          <div>
            <span className={styles.rateBadgeTitle}>10% per completed order</span>
            <span className={styles.rateBadgeSub}>Indoo charges 10% on every restaurant order marked complete</span>
          </div>
        </div>

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
                Pay your outstanding commission to restore full chat access with customers.
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
              <span>✅</span>
              <span className={styles.allClearText}>All commissions paid — chat fully open</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.infoCard}>
          <span className={styles.infoIcon}>ℹ️</span>
          <div className={styles.infoBody}>
            <span className={styles.infoTitle}>How restaurant commission works</span>
            <p className={styles.infoText}>
              Indoo charges <strong>10% commission</strong> when you mark an order as
              complete. You have <strong>72 hours</strong> to pay. Unpaid commissions
              lock your chat — customers can still message you but you cannot reply.
            </p>
            <p className={styles.infoText}>
              Monthly subscribers pay <strong>zero commission</strong> on all orders.
            </p>
          </div>
        </div>

        {/* History */}
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

      </div>
      <CommissionPaymentScreen open={paymentOpen} onClose={() => setPaymentOpen(false)} />
    </div>
  )
}
