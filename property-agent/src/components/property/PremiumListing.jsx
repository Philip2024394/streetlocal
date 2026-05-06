/**
 * PremiumListing — Full-screen overlay for listing owners to boost their listings.
 * Display-only pricing, no payment processing.
 * Props: { open, onClose, listingId }
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'

const TIERS = [
  {
    id: 'boost',
    icon: '\uD83D\uDE80',
    title: 'Boost',
    price: 'Rp 25,000',
    period: '/week',
    description: 'Push to top of search results. Your listing appears first when tenants search in your area.',
    color: '#8DC63F',
    features: ['Top of search results', 'Priority in category', '7-day visibility boost'],
  },
  {
    id: 'verified',
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Verified',
    price: 'Rp 100,000',
    period: ' one-time',
    description: 'INDOO verified badge on your listing. Build trust with tenants through our verification process.',
    color: '#FACC15',
    features: ['Green verified badge', 'Identity verification', 'Trusted owner status'],
  },
  {
    id: 'highlighted',
    icon: '\u2B50',
    title: 'Highlighted',
    price: 'Rp 35,000',
    period: '/week',
    description: 'Gold border + featured carousel placement. Stand out from other listings with premium styling.',
    color: '#FACC15',
    features: ['Gold border highlight', 'Featured carousel spot', 'Eye-catching design'],
  },
]

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 16,
    overflowY: 'auto',
  },
  container: {
    background: 'rgba(20,20,20,0.95)',
    border: '1px solid rgba(141,198,63,0.2)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    padding: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 18,
    minHeight: 44,
    minWidth: 44,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
    marginBottom: 24,
  },
  tiersRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  tierCard: {
    flex: '1 1 160px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'border-color 0.2s, background 0.2s',
    cursor: 'pointer',
    position: 'relative',
  },
  tierCardSelected: {
    background: 'rgba(141,198,63,0.08)',
    borderColor: '#8DC63F',
  },
  tierIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  tierTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    marginBottom: 8,
  },
  tierDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
    margin: 0,
    marginBottom: 14,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    width: '100%',
  },
  featureItem: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    padding: '4px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  featureCheck: {
    color: '#8DC63F',
    fontSize: 13,
    flexShrink: 0,
  },
  selectBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 16,
    minHeight: 44,
    transition: 'background 0.2s',
  },
  agentSection: {
    background: 'rgba(250,204,21,0.06)',
    border: '1px solid rgba(250,204,21,0.2)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  agentTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#FACC15',
    margin: 0,
    marginBottom: 6,
  },
  agentPrice: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    marginBottom: 4,
  },
  agentPeriod: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
    marginBottom: 12,
  },
  agentDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
    margin: 0,
    marginBottom: 16,
  },
  contactBtn: {
    width: '100%',
    padding: '14px 0',
    background: '#8DC63F',
    border: 'none',
    borderRadius: 12,
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 48,
  },
  selectedBanner: {
    background: 'rgba(141,198,63,0.1)',
    border: '1px solid rgba(141,198,63,0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  selectedText: {
    fontSize: 14,
    color: '#8DC63F',
    fontWeight: 600,
    margin: 0,
    marginBottom: 12,
  },
}

export default function PremiumListing({ open, onClose, listingId }) {
  const [selected, setSelected] = useState(null)
  const [contacted, setContacted] = useState(false)

  if (!open) return null

  function handleSelect(tierId) {
    setSelected(tierId)
    setContacted(false)
  }

  function handleContact() {
    setContacted(true)
  }

  const selectedTier = TIERS.find((t) => t.id === selected)

  const content = (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Boost Your Listing</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>
        <p style={styles.subtitle}>Get more tenants and fill your property faster</p>

        {/* Tier Cards */}
        <div style={styles.tiersRow}>
          {TIERS.map((tier) => {
            const isSelected = selected === tier.id
            return (
              <div
                key={tier.id}
                style={{
                  ...styles.tierCard,
                  ...(isSelected ? styles.tierCardSelected : {}),
                }}
                onClick={() => handleSelect(tier.id)}
              >
                <div style={styles.tierIcon}>{tier.icon}</div>
                <h3 style={styles.tierTitle}>{tier.title}</h3>
                <p style={{ ...styles.tierPrice, color: tier.color }}>
                  {tier.price}
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>
                    {tier.period}
                  </span>
                </p>
                <p style={styles.tierDesc}>{tier.description}</p>
                <ul style={styles.featureList}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={styles.featureItem}>
                      <span style={styles.featureCheck}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  style={{
                    ...styles.selectBtn,
                    background: isSelected ? tier.color : 'rgba(255,255,255,0.08)',
                    color: isSelected ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Selected Info */}
        {selectedTier && (
          <div style={styles.selectedBanner}>
            <p style={styles.selectedText}>
              {selectedTier.icon} {selectedTier.title} — {selectedTier.price}{selectedTier.period}
            </p>
            {!contacted ? (
              <button style={styles.contactBtn} onClick={handleContact}>
                Contact INDOO
              </button>
            ) : (
              <p style={{ fontSize: 14, color: '#8DC63F', margin: 0, fontWeight: 600 }}>
                Our team will contact you via WhatsApp shortly.
              </p>
            )}
          </div>
        )}

        {/* Agent Subscription */}
        <div style={styles.agentSection}>
          <p style={styles.agentTitle}>Agent Subscription</p>
          <p style={styles.agentPrice}>Rp 200,000</p>
          <p style={styles.agentPeriod}>/month</p>
          <p style={styles.agentDesc}>
            Unlimited listings, priority support, analytics dashboard, and verified agent badge.
            Perfect for property agents managing multiple listings.
          </p>
          <button
            style={{
              ...styles.contactBtn,
              background: 'rgba(250,204,21,0.15)',
              color: '#FACC15',
              border: '1px solid rgba(250,204,21,0.3)',
            }}
            onClick={handleContact}
          >
            Contact INDOO
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
