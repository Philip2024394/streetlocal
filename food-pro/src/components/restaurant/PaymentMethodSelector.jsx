/**
 * PaymentMethodSelector
 * Bottom sheet — buyer chooses COD or Bank Transfer before confirming order.
 * Bank transfer shows a 3% discount badge and the discounted total.
 */
import { useState } from 'react'
import styles from './PaymentMethodSelector.module.css'

const DISCOUNT_RATE = 0.03   // 3%

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

export default function PaymentMethodSelector({ open, total, onConfirm, onClose }) {
  const [selected, setSelected] = useState('cod')

  if (!open) return null

  const discount     = selected === 'bank_transfer' ? Math.round(total * DISCOUNT_RATE) : 0
  const finalTotal   = total - discount

  const handleConfirm = () => {
    onConfirm?.({
      paymentMethod:  selected,
      grossTotal:     total,
      discountAmount: discount,
      finalTotal,
    })
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        <div className={styles.header}>
          <span className={styles.title}>Payment Method</span>
          <span className={styles.sub}>Choose how you want to pay</span>
        </div>

        <div className={styles.options}>

          {/* COD */}
          <button
            className={`${styles.option} ${selected === 'cod' ? styles.optionSelected : ''}`}
            onClick={() => setSelected('cod')}
          >
            <div className={styles.optionIconWrap}>
              <span className={styles.optionIcon}>💵</span>
            </div>
            <div className={styles.optionBody}>
              <span className={styles.optionTitle}>Cash on Delivery</span>
              <span className={styles.optionDesc}>Driver collects cash from you. Pay at your door.</span>
            </div>
            <div className={`${styles.radio} ${selected === 'cod' ? styles.radioSelected : ''}`} />
          </button>

          {/* Bank Transfer */}
          <button
            className={`${styles.option} ${selected === 'bank_transfer' ? styles.optionSelected : ''}`}
            onClick={() => setSelected('bank_transfer')}
          >
            <div className={styles.optionIconWrap}>
              <span className={styles.optionIcon}>🏦</span>
            </div>
            <div className={styles.optionBody}>
              <span className={styles.optionTitle}>
                Bank Transfer
                <span className={styles.discountBadge}>3% OFF</span>
              </span>
              <span className={styles.optionDesc}>Transfer to restaurant bank account. Cheaper & instant confirmation.</span>
            </div>
            <div className={`${styles.radio} ${selected === 'bank_transfer' ? styles.radioSelected : ''}`} />
          </button>

        </div>

        {/* Total preview */}
        <div className={styles.totalPreview}>
          {discount > 0 ? (
            <>
              <div className={styles.totalRow}>
                <span className={styles.totalLabelCross}>Original total</span>
                <span className={styles.totalValueCross}>{fmtRp(total)}</span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalDiscount}>3% bank transfer discount</span>
                <span className={styles.totalDiscount}>− {fmtRp(discount)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.totalRowFinal}`}>
                <span>You pay</span>
                <span className={styles.totalFinal}>{fmtRp(finalTotal)}</span>
              </div>
            </>
          ) : (
            <div className={`${styles.totalRow} ${styles.totalRowFinal}`}>
              <span>You pay</span>
              <span className={styles.totalFinal}>{fmtRp(total)}</span>
            </div>
          )}
        </div>

        <button className={styles.confirmBtn} onClick={handleConfirm}>
          Confirm — {selected === 'cod' ? 'Pay on Delivery' : 'Pay by Transfer'}
        </button>

      </div>
    </div>
  )
}
