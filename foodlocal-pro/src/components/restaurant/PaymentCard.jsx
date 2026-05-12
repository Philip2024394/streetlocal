import styles from './PaymentCard.module.css'

const BANK_COLORS = {
  BCA:     { bg: '#005baa', accent: '#1a7dd8' },
  Mandiri: { bg: '#003d6b', accent: '#0066b3' },
  BRI:     { bg: '#003087', accent: '#1a5ba8' },
  BNI:     { bg: '#e65c00', accent: '#f47b20' },
  BSI:     { bg: '#1a6e3c', accent: '#2a9e58' },
  CIMB:    { bg: '#8b0000', accent: '#b22222' },
}

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

export default function PaymentCard({ restaurant, total, orderRef, onDone }) {
  const bank = {
    name:           restaurant.bank_name,
    account_number: restaurant.bank_account_number,
    account_holder: restaurant.bank_account_holder,
  }
  const colors = BANK_COLORS[bank.name] ?? { bg: '#1a1a1a', accent: '#333' }

  const handleSendScreenshot = () => {
    const msg = [
      `✅ *Payment Confirmation*`,
      `Order: ${orderRef}`,
      `Restaurant: ${restaurant.name}`,
      `Amount: ${fmtRp(total)}`,
      `Bank: ${bank?.name} — ${bank?.account_number}`,
      ``,
      `_Screenshot attached below_`,
    ].join('\n')
    window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className={styles.backdrop} onClick={onDone}>
      <div className={styles.wrap} onClick={e => e.stopPropagation()}>

        {/* ── The card ── */}
        <div className={styles.card} style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%)` }}>

          {/* Card top row */}
          <div className={styles.cardTop}>
            <div className={styles.cardBrand}>
              <span className={styles.cardBrandMakan}>MAKAN</span>
              <span className={styles.cardBrandBy}>by Indoo</span>
            </div>
            <span className={styles.bankName}>{bank?.name ?? '—'}</span>
          </div>

          {/* Chip */}
          <div className={styles.chip}>
            <div className={styles.chipLine} />
            <div className={styles.chipLine} />
            <div className={styles.chipLine} />
          </div>

          {/* Account number — large */}
          <div className={styles.accountNumber}>
            {bank?.account_number ?? '— — — —'}
          </div>

          {/* Account holder + total */}
          <div className={styles.cardBottom}>
            <div>
              <div className={styles.cardLabel}>Account Holder</div>
              <div className={styles.cardValue}>{bank?.account_holder ?? '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className={styles.cardLabel}>Transfer Amount</div>
              <div className={styles.cardValue}>{fmtRp(total)}</div>
            </div>
          </div>

          {/* Decorative circles */}
          <div className={styles.circle1} />
          <div className={styles.circle2} />
        </div>

        {/* ── Order ref ── */}
        <div className={styles.refRow}>
          <span className={styles.refLabel}>Order ref</span>
          <span className={styles.refValue}>{orderRef}</span>
        </div>

        {/* ── Instructions ── */}
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepText}>Open your banking app and transfer <strong>{fmtRp(total)}</strong> to the account above</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepText}>Take a screenshot of your transfer confirmation</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepText}>Tap the button below and attach your screenshot on WhatsApp</span>
          </div>
        </div>

        {/* ── CTA ── */}
        <button className={styles.screenshotBtn} onClick={handleSendScreenshot}>
          📲 I've Paid — Send Screenshot
        </button>

        <button className={styles.doneBtn} onClick={onDone}>
          Back to menu
        </button>

        {/* ── Disclaimer ── */}
        <p className={styles.disclaimer}>
          ⚠️ Payment is directly between you and {restaurant.name}. Indoo facilitates the order only and is not involved in this transaction. Always confirm with the restaurant before transferring.
        </p>

      </div>
    </div>
  )
}
