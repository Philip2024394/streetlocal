/**
 * SellerWalletScreen — seller earnings, commission balance, and payment history.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { getSellerBalance, getSellerCommissions, COMMISSION_RATES } from '@/services/commissionService'
import styles from './SellerWalletScreen.module.css'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

const DEMO_HISTORY = [
  { id:'w1', type:'sale', amount:1250000, commission:62500, status:'paid', date:'Apr 15', product:'Nike Air Max 90' },
  { id:'w2', type:'sale', amount:340000, commission:17000, status:'pending', date:'Apr 16', product:'Batik Shirt Premium' },
  { id:'w3', type:'sale', amount:890000, commission:44500, status:'pending', date:'Apr 17', product:'Samsung Galaxy Buds' },
  { id:'w4', type:'payout', amount:285000, commission:0, status:'completed', date:'Apr 14', product:'Payout to BCA' },
  { id:'w5', type:'sale', amount:175000, commission:8750, status:'paid', date:'Apr 12', product:'Aromatherapy Candle Set' },
]

export default function SellerWalletScreen({ open, onClose }) {
  const { user } = useAuth()
  const [balance, setBalance] = useState({ totalOwed: 132750, totalPaid: 71250, pendingCount: 2, overdueCount: 0 })
  const [history, setHistory] = useState(DEMO_HISTORY)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    if (!open || !user?.id) return
    getSellerBalance(user.id).then(b => { if (b.totalOwed || b.totalPaid) setBalance(b) })
    getSellerCommissions(user.id).then(data => { if (data?.length) setHistory(data) })
  }, [open, user?.id])

  if (!open) return null

  const totalEarnings = history.filter(h => h.type === 'sale').reduce((s, h) => s + h.amount, 0)
  const totalCommission = history.filter(h => h.type === 'sale').reduce((s, h) => s + h.commission, 0)
  const netEarnings = totalEarnings - totalCommission

  const filtered = tab === 'all' ? history : history.filter(h => h.type === tab)

  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className={styles.title}>Wallet</h1>
      </div>

      {/* Balance cards */}
      <div className={styles.balanceRow}>
        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Total Sales</span>
          <span className={styles.balanceValue} style={{ color: '#34C759' }}>{fmtRp(totalEarnings)}</span>
        </div>
        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Commission (10%)</span>
          <span className={styles.balanceValue} style={{ color: '#FF9500' }}>{fmtRp(totalCommission)}</span>
        </div>
        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Net Earnings</span>
          <span className={styles.balanceValue} style={{ color: '#fff' }}>{fmtRp(netEarnings)}</span>
        </div>
      </div>

      {/* Commission status */}
      <div className={styles.commissionBar}>
        <div className={styles.commissionItem}>
          <span className={styles.commissionDot} style={{ background: '#FF9500' }} />
          <span>Pending: {fmtRp(balance.totalOwed)}</span>
          <span className={styles.commissionCount}>({balance.pendingCount})</span>
        </div>
        <div className={styles.commissionItem}>
          <span className={styles.commissionDot} style={{ background: '#34C759' }} />
          <span>Paid: {fmtRp(balance.totalPaid)}</span>
        </div>
        {balance.overdueCount > 0 && (
          <div className={styles.commissionItem}>
            <span className={styles.commissionDot} style={{ background: '#FF3B30' }} />
            <span style={{ color: '#FF3B30' }}>Overdue: {balance.overdueCount}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['all', 'sale', 'payout'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? 'All' : t === 'sale' ? 'Sales' : 'Payouts'}
          </button>
        ))}
      </div>

      {/* History */}
      <div className={styles.list}>
        {filtered.length === 0 && <div className={styles.empty}>No transactions</div>}
        {filtered.map(h => (
          <div key={h.id} className={styles.card}>
            <div className={styles.cardIcon}>{h.type === 'sale' ? '💰' : '🏦'}</div>
            <div className={styles.cardInfo}>
              <span className={styles.cardProduct}>{h.product}</span>
              <span className={styles.cardDate}>{h.date}</span>
            </div>
            <div className={styles.cardRight}>
              <span className={styles.cardAmount} style={{ color: h.type === 'payout' ? '#818CF8' : '#34C759' }}>
                {h.type === 'payout' ? '-' : '+'}{fmtRp(h.amount)}
              </span>
              {h.commission > 0 && (
                <span className={styles.cardCommission}>-{fmtRp(h.commission)} fee</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}
