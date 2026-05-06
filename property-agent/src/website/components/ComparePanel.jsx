/**
 * ComparePanel — Compare up to 3 properties side-by-side.
 * Floating bottom bar when properties are selected for comparison.
 */
import { useState } from 'react'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const ROWS = [
  { key: 'price', label: 'Price', get: l => fmtRp(l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day) },
  { key: 'type', label: 'Type', get: l => l.sub_category || '—' },
  { key: 'city', label: 'City', get: l => l.city || '—' },
  { key: 'beds', label: 'Bedrooms', get: l => l.extra_fields?.bedrooms || '—' },
  { key: 'baths', label: 'Bathrooms', get: l => l.extra_fields?.bathrooms || '—' },
  { key: 'land', label: 'Land Area', get: l => l.extra_fields?.land_area || '—' },
  { key: 'building', label: 'Building', get: l => l.extra_fields?.building_area || '—' },
  { key: 'cert', label: 'Certificate', get: l => l.extra_fields?.certificate || '—' },
  { key: 'furnished', label: 'Furnished', get: l => l.extra_fields?.furnished || '—' },
  { key: 'rating', label: 'Rating', get: l => l.rating ? `⭐ ${l.rating}` : '—' },
]

export function useCompare() {
  const [items, setItems] = useState([])
  const toggle = (listing) => {
    setItems(prev => {
      if (prev.find(l => l.id === listing.id)) return prev.filter(l => l.id !== listing.id)
      if (prev.length >= 3) return prev
      return [...prev, listing]
    })
  }
  const clear = () => setItems([])
  const isSelected = (id) => items.some(l => l.id === id)
  return { items, toggle, clear, isSelected, count: items.length }
}

/* ── Floating bar shown when 1+ items selected ── */
export function CompareBar({ items, onClear, onCompare }) {
  if (items.length === 0) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9998,
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
      background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)',
      border: '1.5px solid rgba(141,198,63,0.3)', borderRadius: 16,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {items.map(l => (
          <div key={l.id} style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', border: '2px solid #8DC63F' }}>
            <img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
        {Array.from({ length: 3 - items.length }).map((_, i) => (
          <div key={`empty-${i}`} style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.15)' }}>+</div>
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{items.length}/3</span>
      <button onClick={onCompare} disabled={items.length < 2} style={{
        padding: '10px 20px', borderRadius: 12, border: 'none',
        background: items.length >= 2 ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)',
        color: items.length >= 2 ? '#000' : 'rgba(255,255,255,0.2)',
        fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
      }}>Compare</button>
      <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
    </div>
  )
}

/* ── Full comparison modal ── */
export default function ComparePanel({ items, onClose }) {
  if (!items || items.length < 2) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, maxHeight: '85vh', overflowY: 'auto', background: '#0a0a0a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>⚖️ Compare Properties</h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
        </div>

        {/* Headers */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 120, flexShrink: 0 }} />
          {items.map(l => (
            <div key={l.id} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 100, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                <img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {ROWS.map((row, ri) => (
          <div key={row.key} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', background: ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderRadius: 6 }}>
            <div style={{ width: 120, flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>{row.label}</div>
            {items.map(l => (
              <div key={l.id} style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{row.get(l)}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
