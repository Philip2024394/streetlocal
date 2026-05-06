/**
 * AdvancedPropertyFilter — Bottom-sheet overlay with comprehensive property search filters.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
}

const PROPERTY_TYPES = ['House', 'Villa', 'Apartment', 'Condominium', 'Townhouse', 'Studio', 'Serviced Apartment', 'Penthouse', 'Kos', 'Room', 'Bungalow', 'Ruko', 'Office', 'Restaurant', 'Co-working', 'Gudang', 'Pabrik', 'Tanah']
const CERTIFICATES = ['SHM', 'HGB', 'PPJB', 'Hak Pakai', 'Girik', 'AJB', 'SHMSRS', 'Petok D', 'Adat']
const FURNISHED_OPTS = ['Fully Furnished', 'Semi Furnished', 'Unfurnished']
const AMENITIES = [
  { id: 'pool', icon: '🏊', label: 'Pool' },
  { id: 'ac', icon: '❄️', label: 'AC' },
  { id: 'wifi', icon: '📶', label: 'WiFi' },
  { id: 'kitchen', icon: '🍳', label: 'Kitchen' },
  { id: 'parking', icon: '🅿️', label: 'Parking' },
  { id: 'garden', icon: '🌿', label: 'Garden' },
  { id: 'security', icon: '🔒', label: 'Security' },
  { id: 'cctv', icon: '📹', label: 'CCTV' },
  { id: 'hotwater', icon: '🚿', label: 'Hot Water' },
]
const TRANSPORT_TYPES = [
  { id: 'mrt', icon: '🚇', label: 'MRT' },
  { id: 'krl', icon: '🚂', label: 'KRL' },
  { id: 'lrt', icon: '🚈', label: 'LRT' },
  { id: 'bus', icon: '🚌', label: 'Bus' },
]
const CONDITIONS = ['New', 'Like New', 'Good', 'Renovated']
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'price_low', label: 'Price: Low → High' },
  { id: 'price_high', label: 'Price: High → Low' },
  { id: 'rating', label: 'Top Rated' },
  { id: 'views', label: 'Most Viewed' },
]

const DEFAULT_FILTERS = {
  types: [], mode: 'all', priceMin: '', priceMax: '',
  ltMin: '', ltMax: '', lbMin: '', lbMax: '',
  bedrooms: [], bathrooms: [], certificates: [], furnished: [],
  amenities: [], transportTypes: [], transportDist: '<2km',
  ownerType: 'all', conditions: [], sortBy: 'newest',
}

function toggleInArray(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

function countActive(filters) {
  let c = 0
  if (filters.types.length) c++
  if (filters.mode !== 'all') c++
  if (filters.priceMin || filters.priceMax) c++
  if (filters.ltMin || filters.ltMax) c++
  if (filters.lbMin || filters.lbMax) c++
  if (filters.bedrooms.length) c++
  if (filters.bathrooms.length) c++
  if (filters.certificates.length) c++
  if (filters.furnished.length) c++
  if (filters.amenities.length) c++
  if (filters.transportTypes.length) c++
  if (filters.ownerType !== 'all') c++
  if (filters.conditions.length) c++
  if (filters.sortBy !== 'newest') c++
  return c
}

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, marginTop: 18 }}>{children}</div>
)

const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
    background: active ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
    border: active ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.08)',
    color: active ? '#8DC63F' : 'rgba(255,255,255,0.5)',
  }}>{children}</button>
)

const InputField = ({ label, value, onChange, placeholder }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
      width: '100%', padding: '10px 12px', borderRadius: 10,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none',
      boxSizing: 'border-box',
    }} />
  </div>
)

export default function AdvancedPropertyFilter({ open, onClose, filters: initialFilters, onApply }) {
  const [f, setF] = useState({ ...DEFAULT_FILTERS, ...initialFilters })

  if (!open) return null

  const activeCount = countActive(f)

  const update = (key, val) => setF(prev => ({ ...prev, [key]: val }))

  const handleReset = () => setF({ ...DEFAULT_FILTERS })
  const handleApply = () => { onApply?.(f); onClose?.() }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9650, display: 'flex', flexDirection: 'column' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ flex: '0 0 60px', background: 'rgba(0,0,0,0.5)' }} />

      {/* Sheet */}
      <div style={{
        flex: 1, background: '#0a0a0a', borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'rd_slideUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ flexShrink: 0, padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔍</span>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Filters</h2>
            {activeCount > 0 && (
              <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontSize: 11, fontWeight: 800 }}>{activeCount}</span>
            )}
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          {/* Property Type */}
          <SectionLabel>Property Type</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PROPERTY_TYPES.map(t => (
              <Pill key={t} active={f.types.includes(t)} onClick={() => update('types', toggleInArray(f.types, t))}>{t}</Pill>
            ))}
          </div>

          {/* Listing Mode */}
          <SectionLabel>Listing Mode</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'sale', 'rent'].map(m => (
              <Pill key={m} active={f.mode === m} onClick={() => update('mode', m)}>
                {m === 'all' ? 'All' : m === 'sale' ? 'For Sale' : 'For Rent'}
              </Pill>
            ))}
          </div>

          {/* Price Range */}
          <SectionLabel>Price Range (Rp)</SectionLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <InputField label="Min" value={f.priceMin} onChange={v => update('priceMin', v)} placeholder="0" />
            <InputField label="Max" value={f.priceMax} onChange={v => update('priceMax', v)} placeholder="Any" />
          </div>

          {/* Land & Building Area */}
          <SectionLabel>Land Area LT (m²)</SectionLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <InputField label="Min" value={f.ltMin} onChange={v => update('ltMin', v)} placeholder="0" />
            <InputField label="Max" value={f.ltMax} onChange={v => update('ltMax', v)} placeholder="Any" />
          </div>

          <SectionLabel>Building Area LB (m²)</SectionLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <InputField label="Min" value={f.lbMin} onChange={v => update('lbMin', v)} placeholder="0" />
            <InputField label="Max" value={f.lbMax} onChange={v => update('lbMax', v)} placeholder="Any" />
          </div>

          {/* Bedrooms */}
          <SectionLabel>Bedrooms</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {['1', '2', '3', '4', '5+'].map(n => (
              <Pill key={n} active={f.bedrooms.includes(n)} onClick={() => update('bedrooms', toggleInArray(f.bedrooms, n))}>{n}</Pill>
            ))}
          </div>

          {/* Bathrooms */}
          <SectionLabel>Bathrooms</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {['1', '2', '3', '4', '5+'].map(n => (
              <Pill key={n} active={f.bathrooms.includes(n)} onClick={() => update('bathrooms', toggleInArray(f.bathrooms, n))}>{n}</Pill>
            ))}
          </div>

          {/* Certificate */}
          <SectionLabel>Certificate Type</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CERTIFICATES.map(c => (
              <Pill key={c} active={f.certificates.includes(c)} onClick={() => update('certificates', toggleInArray(f.certificates, c))}>{c}</Pill>
            ))}
          </div>

          {/* Furnished */}
          <SectionLabel>Furnishing</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FURNISHED_OPTS.map(o => (
              <Pill key={o} active={f.furnished.includes(o)} onClick={() => update('furnished', toggleInArray(f.furnished, o))}>{o}</Pill>
            ))}
          </div>

          {/* Amenities */}
          <SectionLabel>Amenities</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AMENITIES.map(a => (
              <Pill key={a.id} active={f.amenities.includes(a.id)} onClick={() => update('amenities', toggleInArray(f.amenities, a.id))}>
                {a.icon} {a.label}
              </Pill>
            ))}
          </div>

          {/* Transport */}
          <SectionLabel>Transport Proximity</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {TRANSPORT_TYPES.map(t => (
              <Pill key={t.id} active={f.transportTypes.includes(t.id)} onClick={() => update('transportTypes', toggleInArray(f.transportTypes, t.id))}>
                {t.icon} {t.label}
              </Pill>
            ))}
          </div>
          {f.transportTypes.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {['<500m', '<1km', '<2km'].map(d => (
                <Pill key={d} active={f.transportDist === d} onClick={() => update('transportDist', d)}>{d}</Pill>
              ))}
            </div>
          )}

          {/* Owner Type */}
          <SectionLabel>Owner Type</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'owner', 'agent'].map(o => (
              <Pill key={o} active={f.ownerType === o} onClick={() => update('ownerType', o)}>
                {o === 'all' ? 'All' : o === 'owner' ? '👤 Owner' : '🏢 Agent'}
              </Pill>
            ))}
          </div>

          {/* Condition */}
          <SectionLabel>Condition</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CONDITIONS.map(c => (
              <Pill key={c} active={f.conditions.includes(c)} onClick={() => update('conditions', toggleInArray(f.conditions, c.toLowerCase()))}>{c}</Pill>
            ))}
          </div>

          {/* Sort */}
          <SectionLabel>Sort By</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SORT_OPTIONS.map(s => (
              <Pill key={s.id} active={f.sortBy === s.id} onClick={() => update('sortBy', s.id)}>{s.label}</Pill>
            ))}
          </div>

          <div style={{ height: 20 }} />
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '14px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12 }}>
          <button onClick={handleReset} style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
            color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          }}>Reset All</button>
          <button onClick={handleApply} style={{
            flex: 2, padding: '14px 0', borderRadius: 14,
            border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
            color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
          }}>
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export { DEFAULT_FILTERS, countActive }
