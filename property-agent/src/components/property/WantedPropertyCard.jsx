import React from 'react'
import { fmtBudget, TIMELINE_OPTIONS, PURPOSE_OPTIONS } from '@/services/wantedPropertyService'

const TIMELINE_MAP = Object.fromEntries(TIMELINE_OPTIONS.map(t => [t.id, t]))
const PURPOSE_MAP = Object.fromEntries(PURPOSE_OPTIONS.map(p => [p.id, p]))

const GREEN = '#8DC63F'

export default function WantedPropertyCard({ request, onRespond, matchScore }) {
  const r = request
  const timeline = TIMELINE_MAP[r.timeline]
  const purpose = PURPOSE_MAP[r.purpose]
  const buyerLabel = r.anonymous ? 'Anonymous Buyer' : (r.buyer_name || 'Anonymous Buyer')
  const isRent = r.listing_type === 'rent'

  // Budget bar percentage (visual only)
  const budgetMin = r.budget_min || 0
  const budgetMax = r.budget_max || 0
  const barLeft = 0
  const barRight = budgetMax > 0 ? 100 : 0

  return (
    <div style={styles.card}>
      {/* Top badges row */}
      <div style={styles.topRow}>
        {timeline && (
          <span style={{ ...styles.badge, background: timeline.color, color: timeline.id === 'exploring' ? '#fff' : '#fff' }}>
            {timeline.label}
          </span>
        )}
        <span style={{ ...styles.badge, background: isRent ? '#60A5FA' : GREEN }}>
          {isRent ? 'Rent' : 'Buy'}
        </span>
      </div>

      {/* Property type + location */}
      <div style={styles.typeLocation}>
        <span style={styles.propType}>{r.property_type}</span>
        <span style={styles.location}>{r.location}</span>
      </div>

      {/* Budget range bar */}
      <div style={styles.budgetSection}>
        <div style={styles.budgetLabels}>
          <span style={styles.budgetText}>{fmtBudget(budgetMin)}</span>
          <span style={styles.budgetDash}>—</span>
          <span style={styles.budgetText}>{fmtBudget(budgetMax)}</span>
        </div>
        <div style={styles.budgetBarOuter}>
          <div style={{ ...styles.budgetBarInner, width: `${barRight}%` }} />
        </div>
      </div>

      {/* Requirements */}
      {r.requirements && (
        <p style={styles.requirements}>{r.requirements}</p>
      )}

      {/* Specs row */}
      <div style={styles.specsRow}>
        {r.bedrooms && (
          <span style={styles.spec}>🛏 {r.bedrooms} bd</span>
        )}
        {r.bathrooms && (
          <span style={styles.spec}>🚿 {r.bathrooms} ba</span>
        )}
        {r.land_area_min && (
          <span style={styles.spec}>📐 {r.land_area_min}m²</span>
        )}
      </div>

      {/* Purpose badge */}
      {purpose && (
        <span style={styles.purposeBadge}>{purpose.label}</span>
      )}

      {/* Buyer info row */}
      <div style={styles.buyerRow}>
        <div style={styles.buyerInfo}>
          <span style={styles.buyerName}>{buyerLabel}</span>
          {r.buyer_verified && (
            <span style={styles.verifiedBadge}>✓ Verified</span>
          )}
        </div>
        <span style={styles.responseCount}>{r.responses_count || 0} responses</span>
      </div>

      {/* Bottom row: match score + respond button */}
      <div style={styles.bottomRow}>
        {matchScore != null && matchScore > 0 && (
          <div style={styles.matchCircle}>
            <span style={styles.matchText}>{matchScore}%</span>
          </div>
        )}
        <button style={styles.respondBtn} onClick={() => onRespond?.(r)}>
          Respond
        </button>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    color: '#fff',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
    letterSpacing: 0.3,
  },
  typeLocation: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  propType: {
    fontSize: 18,
    fontWeight: 700,
  },
  location: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  budgetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  budgetLabels: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
  },
  budgetText: {
    color: GREEN,
    fontWeight: 600,
  },
  budgetDash: {
    color: 'rgba(255,255,255,0.3)',
  },
  budgetBarOuter: {
    height: 6,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  budgetBarInner: {
    height: '100%',
    borderRadius: 3,
    background: `linear-gradient(90deg, ${GREEN}, #6BA828)`,
  },
  requirements: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: '1.4',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  specsRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  spec: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.06)',
    padding: '4px 10px',
    borderRadius: 8,
  },
  purposeBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: GREEN,
    border: `1px solid ${GREEN}`,
    padding: '3px 10px',
    borderRadius: 20,
  },
  buyerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  buyerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  buyerName: {
    fontSize: 13,
    fontWeight: 600,
  },
  verifiedBadge: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: 600,
  },
  responseCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  matchCircle: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'rgba(141,198,63,0.15)',
    border: `2px solid ${GREEN}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchText: {
    fontSize: 12,
    fontWeight: 700,
    color: GREEN,
  },
  respondBtn: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    borderRadius: 12,
    background: `linear-gradient(135deg, ${GREEN}, #6BA828)`,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 44,
  },
}
