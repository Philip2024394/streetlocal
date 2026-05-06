/**
 * PropertyComparison — Side-by-side comparison of up to 3 property listings.
 * Full-screen overlay with comparison table.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

function fmtRp(n) {
  if (!n) return '—'
  const num = typeof n === 'object' ? n.price : n
  if (!num) return '—'
  const v = Number(String(num).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

function parseArea(a) {
  if (!a) return 0
  return parseInt(String(a).replace(/[^\d]/g, ''), 10) || 0
}

function pricePerSqm(listing) {
  const price = listing.buy_now
    ? Number(String(typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now).replace(/\./g, ''))
    : listing.price_month || 0
  const area = parseArea(listing.extra_fields?.land_area) || parseArea(listing.extra_fields?.building_area)
  if (!price || !area) return '—'
  return fmtRp(Math.round(price / area)) + '/m²'
}

const ROWS = [
  { key: 'price', label: 'Price', get: l => fmtRp(l.buy_now || l.price_month || l.price_day), best: 'low', raw: l => Number(String(typeof l.buy_now === 'object' ? l.buy_now?.price : l.buy_now || l.price_month || l.price_day || 0).replace(/\./g, '')) },
  { key: 'price_sqm', label: 'Price/m²', get: l => pricePerSqm(l) },
  { key: 'city', label: 'Location', get: l => l.city || '—' },
  { key: 'land_area', label: 'Land Area', get: l => l.extra_fields?.land_area || '—' },
  { key: 'building_area', label: 'Building Area', get: l => l.extra_fields?.building_area || '—' },
  { key: 'bedrooms', label: 'Bedrooms', get: l => l.extra_fields?.bedrooms || '—', best: 'high', raw: l => l.extra_fields?.bedrooms || 0 },
  { key: 'bathrooms', label: 'Bathrooms', get: l => l.extra_fields?.bathrooms || '—', best: 'high', raw: l => l.extra_fields?.bathrooms || 0 },
  { key: 'certificate', label: 'Certificate', get: l => l.extra_fields?.certificate || l.extra_fields?.certificateType || '—' },
  { key: 'furnished', label: 'Furnished', get: l => l.extra_fields?.furnished || '—' },
  { key: 'parking', label: 'Parking', get: l => l.extra_fields?.parking ? `${l.extra_fields.parking} spots` : '—' },
  { key: 'pool', label: 'Pool', get: l => l.extra_fields?.pool ? '✓ Yes' : '✗ No' },
  { key: 'floors', label: 'Floors', get: l => l.extra_fields?.floors || l.extra_fields?.numFloors || '—' },
  { key: 'year_built', label: 'Year Built', get: l => l.extra_fields?.year_built || l.extra_fields?.yearBuilt || '—' },
  { key: 'rating', label: 'Rating', get: l => l.rating ? `⭐ ${l.rating}` : '—', best: 'high', raw: l => l.rating || 0 },
]

export default function PropertyComparison({ open, onClose, properties = [], onRemove }) {
  if (!open) return null

  const cols = properties.slice(0, 3)

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9700, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ ...glass, borderRadius: 0, flexShrink: 0, padding: '16px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚖️</span>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Compare Properties</h1>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{cols.length}/3</span>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '16px' }}>
        {cols.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚖️</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>No properties to compare</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Add properties from the listing page to compare them side by side.</div>
          </div>
        ) : (
          <div style={{ minWidth: cols.length * 200 }}>
            {/* Column Headers */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, position: 'sticky', top: 0, zIndex: 2 }}>
              <div style={{ width: 120, flexShrink: 0 }} />
              {cols.map((p, i) => (
                <div key={p.id || i} style={{ flex: 1, minWidth: 160, ...glass, padding: '12px', textAlign: 'center' }}>
                  <div style={{ width: '100%', height: 100, borderRadius: 10, overflow: 'hidden', marginBottom: 10, background: 'rgba(0,0,0,0.3)' }}>
                    <img src={p.images?.[0] || p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{p.sub_category || p.category}</div>
                  {onRemove && (
                    <button onClick={() => onRemove(p.id)} style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                  )}
                </div>
              ))}
              {cols.length < 3 && (
                <div style={{ flex: 1, minWidth: 160, ...glass, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>+</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Add property</div>
                </div>
              )}
            </div>

            {/* Comparison Rows */}
            {ROWS.map((row, ri) => {
              const values = cols.map(p => row.get(p))
              let bestIdx = -1
              if (row.best && row.raw && cols.length > 1) {
                const raws = cols.map(p => row.raw(p))
                if (row.best === 'low') bestIdx = raws.indexOf(Math.min(...raws.filter(v => v > 0)))
                if (row.best === 'high') bestIdx = raws.indexOf(Math.max(...raws))
              }

              return (
                <div key={row.key} style={{ display: 'flex', gap: 12, marginBottom: 2, background: ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: 8 }}>
                  <div style={{ width: 120, flexShrink: 0, padding: '12px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>{row.label}</div>
                  {cols.map((p, ci) => (
                    <div key={p.id || ci} style={{ flex: 1, minWidth: 160, padding: '12px', fontSize: 13, fontWeight: 700, color: bestIdx === ci ? '#8DC63F' : '#fff', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {bestIdx === ci && <span style={{ marginRight: 4, fontSize: 10 }}>✓</span>}
                      {values[ci]}
                    </div>
                  ))}
                  {cols.length < 3 && <div style={{ flex: 1, minWidth: 160 }} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
