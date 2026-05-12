/**
 * OrderCard — inline chat message card for marketplace and restaurant orders.
 *
 * Rendered inside ChatWindow whenever msg.orderCard is present.
 *
 * orderCard shape:
 *   { type, ref, sellerName, sellerId, items, subtotal, deliveryFee, total,
 *     notes, status, updatedAt }
 *
 * status lifecycle:  pending → confirmed → complete | cancelled
 *
 * Props:
 *   orderCard   — the orderCard object from the message
 *   fromMe      — true if the viewer sent this card (i.e. the buyer)
 *   onStatusChange(newStatus) — called when a button is pressed
 */
import { useState } from 'react'
import styles from './OrderCard.module.css'
import SafeTradeModal from '@/components/commerce/SafeTradeModal'

function fmtRp(n) {
  if (!n && n !== 0) return '—'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f5c518', bg: 'rgba(245,197,24,0.12)',   border: 'rgba(245,197,24,0.3)'  },
  confirmed: { label: 'Confirmed', color: '#8DC63F', bg: 'rgba(141,198,63,0.12)',    border: 'rgba(141,198,63,0.3)'   },
  complete:  { label: 'Complete',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   border: 'rgba(96,165,250,0.3)'  },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.3)'   },
}

const TYPE_BADGE = {
  marketplace: { emoji: '🛍️', label: 'Marketplace Order' },
  restaurant:  { emoji: '🍽️', label: 'Restaurant Order'  },
}

// PayPal / Escrow fee percentages
const SAFE_TRADE_FEES = {
  paypal: { label: 'PayPal', incoming: 3.49, outgoing: 0, note: '+ Rp 5,000 fixed fee per transaction' },
  escrow: { label: 'Escrow', incoming: 3.25, outgoing: 0, note: 'Fee varies by transaction size' },
}

export default function OrderCard({ orderCard, fromMe, onStatusChange, onSafeTradeSelect }) {
  const [selectedSafeTrade, setSelectedSafeTrade] = useState(null) // 'paypal' | 'escrow' | null
  const [showSafeTradeInfo, setShowSafeTradeInfo] = useState(false)

  if (!orderCard) return null

  const { type, ref: orderRef, sellerName, items = [], subtotal, deliveryFee, total, notes, status = 'pending', salesNumber, safeTrade } = orderCard
  const st   = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const badge = TYPE_BADGE[type] ?? TYPE_BADGE.marketplace
  const isBuyer  = fromMe   // the person who placed the order
  const isSeller = !fromMe  // the person receiving the order

  // Safe Trade availability from seller's product config
  const safeTradeEnabled = safeTrade?.enabled ?? false
  const hasPaypal = safeTrade?.paypal ?? false
  const hasEscrow = safeTrade?.escrow ?? false
  const safeTradeAvailable = safeTradeEnabled && (hasPaypal || hasEscrow)

  const handleSafeTradeSelect = (method) => {
    const next = selectedSafeTrade === method ? null : method
    setSelectedSafeTrade(next)
    onSafeTradeSelect?.(next)
  }

  return (
    <div className={styles.card}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.typeEmoji}>{badge.emoji}</span>
          <div>
            <div className={styles.typeLabel}>{badge.label}</div>
            <div className={styles.ref}>{orderRef}</div>
            {salesNumber && <div className={styles.salesNumber}>{salesNumber}</div>}
          </div>
        </div>
        <span
          className={styles.statusBadge}
          style={{ color: st.color, background: st.bg, borderColor: st.border }}
        >
          {st.label}
        </span>
      </div>

      {/* Seller */}
      {sellerName && (
        <div className={styles.sellerRow}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {sellerName}
        </div>
      )}

      {/* Items */}
      <div className={styles.items}>
        {items.map((item, i) => (
          <div key={i} className={styles.item}>
            <div className={styles.itemLeft}>
              <span className={styles.itemName}>{item.name}</span>
              {item.variant && <span className={styles.itemVariant}>{item.variant}</span>}
              {item.note    && <span className={styles.itemNote}>📝 {item.note}</span>}
            </div>
            <div className={styles.itemRight}>
              <span className={styles.itemQty}>×{item.qty}</span>
              <span className={styles.itemPrice}>{fmtRp(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Totals */}
      <div className={styles.totals}>
        {subtotal != null && deliveryFee != null && (
          <>
            <div className={styles.totalRow}>
              <span>Items</span><span>{fmtRp(subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Delivery</span><span>{deliveryFee > 0 ? fmtRp(deliveryFee) : 'Free'}</span>
            </div>
          </>
        )}
        <div className={`${styles.totalRow} ${styles.totalRowGrand}`}>
          <span>Total</span><span>{fmtRp(total)}</span>
        </div>
      </div>

      {/* Notes */}
      {notes?.trim() && (
        <div className={styles.notes}>
          <span className={styles.notesLabel}>Note:</span> {notes}
        </div>
      )}

      {/* Safe Trade selection — shown to buyer when order is confirmed and seller offers it */}
      {safeTradeAvailable && isBuyer && (status === 'pending' || status === 'confirmed') && (
        <div className={styles.safeTradeSection}>
          <div className={styles.safeTradeHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className={styles.safeTradeTitle}>Safe Trade Available</span>
          </div>
          <p className={styles.safeTradeDesc}>
            This seller offers buyer protection. Select a payment method for secure checkout.
          </p>

          <div className={styles.safeTradeOptions}>
            {hasPaypal && (
              <button
                className={`${styles.safeTradeOption} ${selectedSafeTrade === 'paypal' ? styles.safeTradeOptionActive : ''}`}
                onClick={() => handleSafeTradeSelect('paypal')}
              >
                <div className={styles.safeTradeOptionTop}>
                  <span className={styles.safeTradeOptionName}>PayPal</span>
                  {selectedSafeTrade === 'paypal' && <span className={styles.safeTradeCheck}>✓</span>}
                </div>
                <div className={styles.safeTradeOptionFees}>
                  <span className={styles.safeTradeOptionFee}>{SAFE_TRADE_FEES.paypal.incoming}% processing fee</span>
                  <span className={styles.safeTradeOptionNote}>{SAFE_TRADE_FEES.paypal.note}</span>
                </div>
              </button>
            )}
            {hasEscrow && (
              <button
                className={`${styles.safeTradeOption} ${selectedSafeTrade === 'escrow' ? styles.safeTradeOptionActive : ''}`}
                onClick={() => handleSafeTradeSelect('escrow')}
              >
                <div className={styles.safeTradeOptionTop}>
                  <span className={styles.safeTradeOptionName}>Escrow</span>
                  {selectedSafeTrade === 'escrow' && <span className={styles.safeTradeCheck}>✓</span>}
                </div>
                <div className={styles.safeTradeOptionFees}>
                  <span className={styles.safeTradeOptionFee}>{SAFE_TRADE_FEES.escrow.incoming}% processing fee</span>
                  <span className={styles.safeTradeOptionNote}>{SAFE_TRADE_FEES.escrow.note}</span>
                </div>
              </button>
            )}
          </div>

          {selectedSafeTrade && (
            <div className={styles.safeTradeTotal}>
              <span>Processing fee</span>
              <span className={styles.safeTradeFeeAmount}>
                {fmtRp(Math.round((total ?? 0) * (SAFE_TRADE_FEES[selectedSafeTrade].incoming / 100)))}
              </span>
            </div>
          )}

          <button className={styles.safeTradeInfoLink} onClick={() => setShowSafeTradeInfo(true)}>
            What is Safe Trade? Learn about buyer protection →
          </button>
        </div>
      )}

      {/* Safe Trade info modal */}
      {showSafeTradeInfo && (
        <SafeTradeModal
          open={showSafeTradeInfo}
          onClose={() => setShowSafeTradeInfo(false)}
          product={{ safeTrade }}
          sellerName={sellerName}
        />
      )}

      {/* Action buttons — only show if not already complete/cancelled */}
      {status === 'pending' && isSeller && onStatusChange && (
        <div className={styles.actions}>
          <button className={styles.btnConfirm} onClick={() => onStatusChange('confirmed')}>
            ✓ Confirm Order
          </button>
          <button className={styles.btnCancel} onClick={() => onStatusChange('cancelled')}>
            Decline
          </button>
        </div>
      )}

      {status === 'confirmed' && (
        <div className={styles.actions}>
          {isBuyer && onStatusChange && (
            <button className={styles.btnComplete} onClick={() => onStatusChange('complete')}>
              ✓ Mark as Received
            </button>
          )}
          {isSeller && onStatusChange && (
            <button className={styles.btnCancel} onClick={() => onStatusChange('cancelled')}>
              Cancel
            </button>
          )}
        </div>
      )}

      {status === 'complete' && (
        <div className={styles.completedNote}>Order completed · Thank you!</div>
      )}

      {status === 'cancelled' && (
        <div className={styles.cancelledNote}>Order was cancelled</div>
      )}
    </div>
  )
}
