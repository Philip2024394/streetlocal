import React from 'react'
import {
  calculateInvestmentGrade,
  calculateRentalYield,
  convertFromIDR,
  isForeignEligible,
  CURRENCIES,
} from '@/services/investorService'

const glass = {
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  overflow: 'hidden',
  cursor: 'pointer',
}

const GREEN = '#8DC63F'
const GOLD = '#FACC15'

function formatIDR(n) {
  if (n == null) return '—'
  const num = Number(String(n).replace(/\./g, ''))
  if (num >= 1_000_000_000) return 'Rp ' + (num / 1_000_000_000).toFixed(1) + 'B'
  if (num >= 1_000_000) return 'Rp ' + (num / 1_000_000).toFixed(0) + 'M'
  return 'Rp ' + num.toLocaleString('id-ID')
}

function formatForeign(amountIDR, currencyCode) {
  const cur = CURRENCIES.find(c => c.code === currencyCode)
  if (!cur || currencyCode === 'IDR') return null
  const converted = convertFromIDR(amountIDR, currencyCode)
  return `${cur.flag} ${cur.symbol}${converted.toLocaleString('en-US')}`
}

export default function InvestorListingCard({ listing, onSelect, currency = 'USD' }) {
  if (!listing) return null

  const ef = listing.extra_fields || {}
  const grade = calculateInvestmentGrade(listing)
  const buyPrice = typeof listing.buy_now === 'object' ? listing.buy_now?.price : listing.buy_now
  const buyNum = Number(String(buyPrice || 0).replace(/\./g, ''))
  const rentNum = Number(String(listing.price_month || 0).replace(/\./g, ''))
  const yieldData = calculateRentalYield(buyPrice, listing.price_month)
  const eligibility = isForeignEligible(listing)
  const certType = ef.certificate || ef.certificateType || ''
  const image = listing.images?.[0] || ''

  return (
    <div style={glass} onClick={() => onSelect?.(listing)}>
      {/* Image section */}
      <div style={{ position: 'relative', height: 180, background: '#111' }}>
        {image && (
          <img
            src={image}
            alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Overlay badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {/* Investment grade */}
          <span style={{
            background: grade.color,
            color: grade.grade === 'B' || grade.grade === 'C' ? '#000' : '#fff',
            fontSize: 12,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 6,
          }}>
            {grade.grade} &middot; {grade.label}
          </span>

          {/* Foreign eligible */}
          {eligibility.eligible && (
            <span style={{
              background: GREEN,
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
            }}>
              Foreign Eligible
            </span>
          )}
        </div>

        {/* Supervised badge */}
        {listing.supervised && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: `${GOLD}22`,
            border: `1px solid ${GOLD}66`,
            color: GOLD,
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: 12 }}>&#x1F6E1;&#xFE0F;</span> INDOO Supervised
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {/* Title & location */}
        <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {listing.title}
        </h3>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>
          {listing.city}{ef.property_type ? ` \u00B7 ${ef.property_type}` : ''}
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ color: GREEN, fontSize: 17, fontWeight: 800 }}>
            {formatIDR(buyPrice)}
          </span>
          {currency !== 'IDR' && buyNum > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              {formatForeign(buyNum, currency)}
            </span>
          )}
        </div>

        {/* Specs row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          {ef.bedrooms != null && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {ef.bedrooms} bed
            </span>
          )}
          {ef.bathrooms != null && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {ef.bathrooms} bath
            </span>
          )}
          {(ef.building_area || ef.land_area) && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {ef.building_area || ef.land_area}
            </span>
          )}
        </div>

        {/* Yield display */}
        {yieldData && (
          <div style={{
            background: 'rgba(141,198,63,0.08)',
            border: '1px solid rgba(141,198,63,0.15)',
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Rental Yield</span>
            <span style={{ color: GREEN, fontSize: 14, fontWeight: 800 }}>{yieldData.grossYield}% gross</span>
          </div>
        )}

        {/* Bottom row: certificate + ownership */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {certType && (
            <span style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 6,
            }}>
              {certType}
            </span>
          )}
          {eligibility.method && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {eligibility.method}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
