/**
 * SearchPage — Property search with filter sidebar + results grid.
 */
import { useState, useMemo } from 'react'
import { usePropertyListings } from '../hooks/usePropertyListings'
import { ScrollReveal } from '../hooks/useScrollReveal'
import FavoriteButton from '../components/FavoriteButton'
import ComparePanel, { CompareBar, useCompare } from '../components/ComparePanel'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const PROP_TYPES = ['House', 'Villa', 'Apartment', 'Kos', 'Tanah', 'Ruko', 'Gudang', 'Pabrik']
const CITY_LIST = ['All', 'Yogyakarta', 'Bali', 'Jakarta', 'Surabaya', 'Bandung', 'Semarang']
const CERTS = ['SHM', 'HGB', 'PPJB', 'Hak Pakai', 'Girik']
const SORT_OPTIONS = [{ id: 'newest', label: 'Newest' }, { id: 'price_low', label: 'Price: Low' }, { id: 'price_high', label: 'Price: High' }, { id: 'rating', label: 'Rating' }]

const pill = (active) => ({
  padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, border: 'none',
  background: active ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
  color: active ? '#8DC63F' : 'rgba(255,255,255,0.4)',
  outline: active ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
})

export default function SearchPage({ initialSearch = '', initialMode = 'all', onSelectListing, onBack }) {
  const compare = useCompare()
  const [showCompare, setShowCompare] = useState(false)
  const [search, setSearch] = useState(initialSearch)
  const [mode, setMode] = useState(initialMode)
  const [types, setTypes] = useState([])
  const [city, setCity] = useState('All')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [beds, setBeds] = useState('')
  const [certs, setCerts] = useState([])
  const [sort, setSort] = useState('newest')

  const { listings: allProperty } = usePropertyListings()

  const filtered = useMemo(() => {
    let result = [...allProperty]
    if (mode === 'sale') result = result.filter(l => !!l.buy_now)
    if (mode === 'rent') result = result.filter(l => !l.buy_now)
    if (types.length) result = result.filter(l => types.includes(l.sub_category) || types.includes(l.extra_fields?.property_type))
    if (city !== 'All') result = result.filter(l => l.city?.includes(city))
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter(l => l.title?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.sub_category?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q)) }
    if (priceMin) { const min = Number(priceMin); result = result.filter(l => { const p = l.buy_now ? Number(String(typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now).replace(/\./g, '')) : l.price_month || 0; return p >= min }) }
    if (priceMax) { const max = Number(priceMax); result = result.filter(l => { const p = l.buy_now ? Number(String(typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now).replace(/\./g, '')) : l.price_month || 0; return p <= max }) }
    if (beds) result = result.filter(l => l.extra_fields?.bedrooms >= Number(beds))
    if (certs.length) result = result.filter(l => { const c = l.extra_fields?.certificate || ''; return certs.some(ct => c.includes(ct)) })
    if (sort === 'price_low') result.sort((a, b) => (a.price_month || 0) - (b.price_month || 0))
    if (sort === 'price_high') result.sort((a, b) => (b.price_month || 0) - (a.price_month || 0))
    if (sort === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return result
  }, [allProperty, mode, types, city, search, priceMin, priceMax, beds, certs, sort])

  const toggleType = (t) => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  const toggleCert = (c) => setCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  const activeCount = (mode !== 'all' ? 1 : 0) + types.length + (city !== 'All' ? 1 : 0) + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (beds ? 1 : 0) + certs.length
  const resetAll = () => { setMode('all'); setTypes([]); setCity('All'); setPriceMin(''); setPriceMax(''); setBeds(''); setCerts([]); setSort('newest'); setSearch('') }

  const lbl = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return (
    <div className="ws-container" style={{ display: 'flex', gap: 24, padding: '24px 48px 60px', minHeight: '80vh' }}>
      {/* ═══ FILTER SIDEBAR ═══ */}
      <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 80, alignSelf: 'flex-start', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: '20px 16px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Filters</span>
          {activeCount > 0 && <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontSize: 11, fontWeight: 800 }}>{activeCount}</span>}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Search</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Property name, city..." style={inp} />
        </div>

        {/* Mode */}
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Listing Type</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'sale', 'rent'].map(m => <button key={m} onClick={() => setMode(m)} style={pill(mode === m)}>{m === 'all' ? 'All' : m === 'sale' ? 'Sale' : 'Rent'}</button>)}
          </div>
        </div>

        {/* Type */}
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Property Type</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PROP_TYPES.map(t => <button key={t} onClick={() => toggleType(t)} style={pill(types.includes(t))}>{t}</button>)}
          </div>
        </div>

        {/* City */}
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>City</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CITY_LIST.map(c => <button key={c} onClick={() => setCity(c)} style={pill(city === c)}>{c}</button>)}
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Price Range</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min" style={{ ...inp, flex: 1 }} />
            <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max" style={{ ...inp, flex: 1 }} />
          </div>
        </div>

        {/* Bedrooms */}
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Min Bedrooms</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['', '1', '2', '3', '4'].map(b => <button key={b} onClick={() => setBeds(b)} style={pill(beds === b)}>{b || 'Any'}</button>)}
          </div>
        </div>

        {/* Certificate */}
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Certificate</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CERTS.map(c => <button key={c} onClick={() => toggleCert(c)} style={pill(certs.includes(c))}>{c}</button>)}
          </div>
        </div>

        {/* Sort */}
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Sort By</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SORT_OPTIONS.map(s => <button key={s.id} onClick={() => setSort(s.id)} style={pill(sort === s.id)}>{s.label}</button>)}
          </div>
        </div>

        {activeCount > 0 && <button onClick={resetAll} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Reset All</button>}
      </div>

      {/* ═══ RESULTS GRID ═══ */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>{filtered.length} Properties Found</h2>
          {onBack && <button onClick={onBack} style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
        </div>

        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>No properties match your filters</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map((l, i) => {
            const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
            const ef = l.extra_fields || {}
            const isSold = l.status === 'sold' || l.status === 'rented'
            return (
              <ScrollReveal key={l.id} delay={Math.min(i * 0.03, 0.3)}>
                <div className="ws-card" onClick={() => onSelectListing?.(l)} style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                  {isSold && <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}><img src={l.status === 'sold' ? 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-2-2026-04_45_33-am.png' : 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-2-2026-04_43_39-am.png'} alt={l.status} style={{ width: '55%', maxWidth: 140, objectFit: 'contain', opacity: 0.9 }} /></div>}
                  <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                    <img src={l.images?.[0]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 12px', borderRadius: 8, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 11, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
                    {l.sub_category && <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 10, fontWeight: 700, color: '#fff' }}>{l.sub_category}</div>}
                    {l.rating && <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 800, color: '#FACC15' }}>⭐ {l.rating}</div>}
                    {/* Favorite + Compare */}
                    <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 6 }}>
                      <FavoriteButton listingId={l.id} size="sm" />
                      <button onClick={(e) => { e.stopPropagation(); compare.toggle(l) }} style={{
                        width: 28, height: 28, borderRadius: 14, cursor: 'pointer', padding: 0,
                        background: compare.isSelected(l.id) ? 'rgba(141,198,63,0.2)' : 'rgba(0,0,0,0.5)',
                        border: compare.isSelected(l.id) ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: compare.isSelected(l.id) ? '#8DC63F' : '#fff',
                      }}>⚖️</button>
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>📍 {l.city}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}{!l.buy_now && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l.price_month ? '/mo' : '/day'}</span>}</div>
                    {(ef.bedrooms || ef.land_area) && <div style={{ marginTop: 6, display: 'flex', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{ef.bedrooms && <span>🛏️ {ef.bedrooms}</span>}{ef.bathrooms && <span>🚿 {ef.bathrooms}</span>}{ef.land_area && <span>📐 {ef.land_area}</span>}{ef.certificate && <span>📜 {ef.certificate}</span>}</div>}
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>

      {/* Compare bar + modal */}
      <CompareBar items={compare.items} onClear={compare.clear} onCompare={() => setShowCompare(true)} />
      {showCompare && <ComparePanel items={compare.items} onClose={() => setShowCompare(false)} />}
    </div>
  )
}
