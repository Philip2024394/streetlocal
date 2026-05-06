/**
 * HomePage — INDOO Property website landing page.
 * Hero + carousels + stats + cities + features + download CTA.
 */
import { useState, useRef, useEffect } from 'react'
import { usePropertyListings } from '../hooks/usePropertyListings'
import { useLanguage } from '@/i18n'
import { DEMO_AGENTS } from './AgentDirectoryPage'
import { getNewProjects, STATUS_LABELS } from '@/services/newProjectService'
import KPRCalculator from '@/components/property/KPRCalculator'
import PriceHistoryChart from '@/components/property/PriceHistoryChart'
import PropertyValuation from '@/components/property/PropertyValuation'
import ComparableSales from '@/components/property/ComparableSales'
import NeighborhoodGuide from '@/components/property/NeighborhoodGuide'
import TransportProximity from '@/components/property/TransportProximity'
// ScrollReveal disabled for mobile — passthrough wrapper
function ScrollReveal({ children, style, delay }) { return <div style={style}>{children}</div> }
import StatsCounter from '../components/StatsCounter'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const TYPES = [
  { id: 'House', icon: '🏠', label: 'House' }, { id: 'Villa', icon: '🏡', label: 'Villa' },
  { id: 'Apartment', icon: '🏢', label: 'Apartment' }, { id: 'Kos', icon: '🛏️', label: 'Kos' },
  { id: 'Tanah', icon: '🌍', label: 'Land' }, { id: 'Ruko', icon: '🏪', label: 'Ruko' },
  { id: 'Gudang', icon: '🏭', label: 'Warehouse' }, { id: 'Pabrik', icon: '⚙️', label: 'Factory' },
]
const CITIES = [
  { name: 'Yogyakarta', count: 86, img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=200&fit=crop' },
  { name: 'Bali', count: 54, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop' },
  { name: 'Jakarta', count: 38, img: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&h=200&fit=crop' },
  { name: 'Surabaya', count: 22, img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop' },
  { name: 'Bandung', count: 18, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop' },
  { name: 'Semarang', count: 14, img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop' },
]
const FEATURES = [
  { icon: '💳', title: 'KPR Calculator', desc: 'Konvensional, Syariah & Take-Over with 5+ bank comparison', toolId: 'kpr' },
  { icon: '📊', title: 'Price History', desc: '12-month trend charts — first in Indonesia', toolId: 'history' },
  { icon: '🏷️', title: 'Property Valuation', desc: 'A/B/C/D scoring with factor breakdown', toolId: 'valuation' },
  { icon: '🏘️', title: 'Comparable Sales', desc: 'Recently sold nearby with real market data', toolId: 'comparable' },
  { icon: '📍', title: 'Neighborhood Guide', desc: 'Transport, schools, hospitals, dining — walkability score', toolId: 'neighborhood' },
  { icon: '🚇', title: 'Transport Nearby', desc: 'MRT, KRL, LRT, bus stations with transit score', toolId: 'transport' },
  { icon: '🏢', title: 'Agent Directory', desc: 'Verified agents with portfolios & testimonials', toolId: 'agents' },
  { icon: '🏗️', title: 'New Projects', desc: 'Pre-sale villas, apartments — brochures & floor plans', toolId: 'newprojects' },
  { icon: '🔍', title: 'Property Wanted', desc: 'Post what you need — agents respond with matching listings', toolId: 'wanted' },
  { icon: '🌏', title: 'Global Invest', desc: 'Foreign-eligible properties with supervised transactions', toolId: 'invest' },
]

// Sample listing for tool demos
const SAMPLE_LISTING = { id: 'demo', title: 'Villa Mewah Kaliurang', category: 'Property', sub_category: 'Villa', city: 'Yogyakarta', buy_now: 2800000000, price_month: 15000000, rating: 4.7, review_count: 19, condition: 'good', features: ['Pool', 'AC', 'WiFi', 'Garden'], extra_fields: { bedrooms: 3, bathrooms: 2, land_area: '300 m²', building_area: '150 m²', certificate: 'SHM', furnished: 'Fully Furnished', property_type: 'Villa' } }


function PropertyCard({ l, onClick, mode }) {
  const isSale = mode === 'sale' || (!mode && !!l.buy_now)
  const price = isSale ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day || l.price_year
  const priceTag = isSale ? '' : (l.price_month ? '/mo' : l.price_day ? '/day' : l.price_year ? '/yr' : '')
  const ef = l.extra_fields || {}
  return (
    <div className="ws-card" onClick={onClick} style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        <img src={l.images?.[0]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7))' }} />
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 8, background: isSale ? '#FACC15' : '#8DC63F', fontSize: 11, fontWeight: 900, color: '#000' }}>{isSale ? 'FOR SALE' : 'FOR RENT'}</div>
        {l.rating && <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 7px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 12, fontWeight: 800, color: '#FACC15' }}>⭐ {l.rating}</div>}
        {ef.certificate && <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 10, fontWeight: 800, color: '#fff' }}>{ef.certificate}</div>}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>📍 {l.city} · {l.sub_category || ef.property_type}</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: isSale ? '#FACC15' : '#8DC63F' }}>{fmtRp(price)}{priceTag && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{priceTag}</span>}</div>
        {(ef.bedrooms || ef.land_area) && (
          <div style={{ marginTop: 5, fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 8 }}>
            {ef.bedrooms && <span>🛏️ {ef.bedrooms}</span>}
            {ef.bathrooms && <span>🚿 {ef.bathrooms}</span>}
            {ef.land_area && <span>📐 {ef.land_area}</span>}
            {ef.building_area && <span>🏠 {ef.building_area}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectCircleCarousel() {
  const [projects, setProjects] = useState([])
  const ref = useRef(null)

  useEffect(() => { getNewProjects().then(setProjects) }, [])

  useEffect(() => {
    const el = ref.current; if (!el || projects.length < 2) return
    let raf
    const tick = () => { el.scrollLeft += 0.3; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    const stop = () => cancelAnimationFrame(raf)
    const go = () => { raf = requestAnimationFrame(tick) }
    el.addEventListener('mouseenter', stop); el.addEventListener('mouseleave', go)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('mouseenter', stop); el.removeEventListener('mouseleave', go) }
  }, [projects])

  if (projects.length === 0) return null
  const doubled = [...projects, ...projects]
  return (
    <div ref={ref} style={{ display: 'flex', gap: 24, overflowX: 'hidden', scrollbarWidth: 'none', padding: '8px 0' }}>
      {doubled.map((p, i) => {
        const status = STATUS_LABELS[p.status] || STATUS_LABELS.pre_sale
        return (
          <div key={`${p.id}-${i}`} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', width: 100 }}
            onMouseEnter={e => e.currentTarget.querySelector('.ring').style.borderColor = status.color}
            onMouseLeave={e => e.currentTarget.querySelector('.ring').style.borderColor = 'rgba(250,204,21,0.3)'}
          >
            <div className="ring" style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              border: '3px solid rgba(250,204,21,0.3)', padding: 2,
              transition: 'border-color 0.3s, transform 0.3s',
            }}>
              <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200'} alt={p.project_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{p.project_name}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: status.color }}>{status.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Newly Listed + Projects combined carousel ── */
function NewlyListedCarousel({ allProperty, onSelectListing }) {
  const [projects, setProjects] = useState([])
  useEffect(() => { getNewProjects().then(setProjects) }, [])

  return (
    <div style={{ marginTop: 60, marginBottom: 6 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a', marginBottom: 10 }}>Newly Listed</div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
        {/* New Projects first */}
        {projects.map(p => {
          const status = STATUS_LABELS[p.status] || STATUS_LABELS.pre_sale
          return (
            <div key={'proj-' + p.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', width: 70 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(250,204,21,0.5)' }}>
                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>{p.project_name?.split(' ').slice(0, 2).join(' ') || 'Project'}</div>
              <div style={{ fontSize: 8, fontWeight: 800, color: status.color }}>{status.label}</div>
            </div>
          )
        })}
        {/* Properties */}
        {allProperty.slice(0, 10).map(l => (
          <div key={l.id} onClick={() => onSelectListing?.(l)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', width: 70 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(141,198,63,0.4)' }}>
              <img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>{l.title.split(' ').slice(0, 2).join(' ')}</div>
            <div style={{ fontSize: 9, color: '#8DC63F', fontWeight: 700 }}>{fmtRp(l.buy_now || l.price_month)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Tool Modal wrapper ── */
function ToolModal({ open, onClose, title, children, small }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: small ? 420 : 600, maxHeight: '80vh', overflowY: 'auto', background: '#0a0a0a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function TopAgentsCarousel() {
  const ref = useRef(null)
  const agents = DEMO_AGENTS.sort((a, b) => b.sold - a.sold).slice(0, 6)
  useEffect(() => {
    const el = ref.current; if (!el || agents.length < 2) return
    let raf
    const tick = () => { el.scrollLeft += 0.3; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    const stop = () => cancelAnimationFrame(raf)
    const go = () => { raf = requestAnimationFrame(tick) }
    el.addEventListener('mouseenter', stop); el.addEventListener('mouseleave', go)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('mouseenter', stop); el.removeEventListener('mouseleave', go) }
  }, [agents])
  const doubled = [...agents, ...agents]
  return (
    <div ref={ref} style={{ display: 'flex', gap: 24, overflowX: 'hidden', scrollbarWidth: 'none', padding: '8px 0' }}>
      {doubled.map((a, i) => (
        <div key={`${a.id}-${i}`} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 90, cursor: 'pointer' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(96,165,250,0.3)', transition: 'border-color 0.3s' }}>
            <img src={a.photo} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{a.name}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#60A5FA' }}>{a.sold} sold</div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage({ onSearch, onBrowseSale, onBrowseRent, onBrowseAll, onSelectListing, onNavigate }) {
  const { t } = useLanguage()
  const [searchVal, setSearchVal] = useState('')
  const [listingMode, setListingMode] = useState('sale')
  const [salePage, setSalePage] = useState(0)
  const [rentPage, setRentPage] = useState(0)
  const [activeTool, setActiveTool] = useState(null)
  const { listings: allProperty } = usePropertyListings()
  const sampleListing = allProperty[0] || SAMPLE_LISTING
  const forSale = allProperty.filter(l => !!l.buy_now)
  const forRent = allProperty.filter(l => l.price_month || l.price_day || l.price_week || l.price_year)

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section style={{ padding: '52px 14px 10px' }}>
        <div style={{ display: 'flex', marginBottom: 12 }}>
          <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch?.(searchVal)}
            placeholder="Search villas, apartments, land..."
            style={{ flex: 1, padding: '12px 14px', borderRadius: '12px 0 0 12px', border: '1.5px solid rgba(141,198,63,0.3)', borderRight: 'none', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={() => onSearch?.(searchVal)} style={{ padding: '12px 18px', borderRadius: '0 12px 12px 0', border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '40px 0 6px', lineHeight: 1.15, textAlign: 'center', textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.5)' }}>
          Find Your Dream<br /><span style={{ color: '#8DC63F', textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 0 20px rgba(141,198,63,0.3)' }}>Property</span> in Indonesia
        </h1>
        <p style={{ fontSize: 13, color: '#fff', margin: '0 0 10px', lineHeight: 1.5, textAlign: 'center', textShadow: '0 1px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.4)' }}>
          Buy, sell, rent — houses, villas, apartments, kos, land, factories & more.
        </p>
        {/* Newly Listed + New Projects — combined round image scroll */}
        <NewlyListedCarousel allProperty={allProperty} onSelectListing={onSelectListing} />
      </section>


      {/* ═══ SALE / RENT TOGGLE + CARDS ═══ */}
      <section style={{ padding: '14px' }}>
        <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 3, marginBottom: 14 }}>
          <button onClick={() => { setListingMode('sale'); setSalePage(0) }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', background: listingMode === 'sale' ? '#FACC15' : 'transparent', color: listingMode === 'sale' ? '#000' : 'rgba(255,255,255,0.4)' }}>
            For Sale ({forSale.length})
          </button>
          <button onClick={() => { setListingMode('rent'); setRentPage(0) }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', background: listingMode === 'rent' ? '#8DC63F' : 'transparent', color: listingMode === 'rent' ? '#000' : 'rgba(255,255,255,0.4)' }}>
            For Rent ({forRent.length})
          </button>
        </div>
        {(() => {
          const items = listingMode === 'sale' ? forSale : forRent
          const page = listingMode === 'sale' ? salePage : rentPage
          const setPage = listingMode === 'sale' ? setSalePage : setRentPage
          const perPage = 6
          const totalPages = Math.ceil(items.length / perPage)
          const visible = items.slice(page * perPage, (page + 1) * perPage)

          return (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 20, fontSize: 13 }}>No properties found</p>
                )}
                {visible.map(l => (
                  <PropertyCard key={l.id} l={l} mode={listingMode} onClick={() => onSelectListing?.(l)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 14 }}>
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: page === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(141,198,63,0.15)', color: page === 0 ? 'rgba(255,255,255,0.2)' : '#8DC63F', fontSize: 18, fontWeight: 900, cursor: page === 0 ? 'default' : 'pointer' }}
                  >←</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: page >= totalPages - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(141,198,63,0.15)', color: page >= totalPages - 1 ? 'rgba(255,255,255,0.2)' : '#8DC63F', fontSize: 18, fontWeight: 900, cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}
                  >→</button>
                </div>
              )}
            </>
          )
        })()}
      </section>


      {/* ═══ BROWSE BY CITY ═══ */}
      <section style={{ padding: '14px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 10px' }}>Browse by City</h2>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
          {CITIES.map(c => (
            <div key={c.name} onClick={() => onSearch?.(c.name)} style={{ flexShrink: 0, width: 140, borderRadius: 12, overflow: 'hidden', position: 'relative', height: 100, cursor: 'pointer' }}>
              <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.8))' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700 }}>{c.count} properties</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PROPERTY TOOLS — clickable, open real tools ═══ */}
      <section style={{ padding: '48px 0' }}>
        <div className="ws-container">
          <ScrollReveal>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Property Tools</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', margin: '0 0 28px' }}>Click any tool to try it — features no other Indonesian property platform has</p>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.05}>
                <div className="ws-card" onClick={() => { if (['agents', 'newprojects', 'wanted', 'invest'].includes(f.toolId)) { onNavigate?.(f.toolId) } else if (f.toolId === 'dealhunt') { onNavigate?.('home') } else { setActiveTool(f.toolId) } }} style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{f.desc}</div>
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Try it →</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TOOL MODALS ═══ */}
      {activeTool === 'kpr' && <KPRCalculator open onClose={() => setActiveTool(null)} propertyPrice={850000000} />}
      <ToolModal open={activeTool === 'history'} onClose={() => setActiveTool(null)} title="📊 Price History" small>
        <PriceHistoryChart listing={sampleListing} />
      </ToolModal>
      <ToolModal open={activeTool === 'valuation'} onClose={() => setActiveTool(null)} title="🏷️ Property Valuation" small>
        <PropertyValuation listing={sampleListing} />
      </ToolModal>
      <ToolModal open={activeTool === 'comparable'} onClose={() => setActiveTool(null)} title="🏘️ Comparable Sales" small>
        <ComparableSales listing={sampleListing} />
      </ToolModal>
      <ToolModal open={activeTool === 'neighborhood'} onClose={() => setActiveTool(null)} title="📍 Neighborhood Guide">
        <NeighborhoodGuide listing={sampleListing} />
      </ToolModal>
      <ToolModal open={activeTool === 'transport'} onClose={() => setActiveTool(null)} title="🚇 Transport Nearby" small>
        <TransportProximity listing={sampleListing} />
      </ToolModal>


      {/* ═══ COMMERCIAL OPPORTUNITIES ═══ */}
      <section style={{ padding: '48px 0' }}>
        <div className="ws-container">
          <ScrollReveal>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Commercial <span style={{ color: '#FACC15' }}>Opportunities</span></h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>Restaurants, factories, warehouses, and land available for lease or purchase.</p>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { icon: '☕', label: 'Cafes & Restaurants', search: 'Restaurant' },
              { icon: '🏭', label: 'Factories', search: 'Pabrik' },
              { icon: '🏪', label: 'Ruko / Shophouse', search: 'Ruko' },
              { icon: '📦', label: 'Warehouses', search: 'Gudang' },
              { icon: '🌍', label: 'Land', search: 'Tanah' },
              { icon: '🏢', label: 'Office Space', search: 'Office' },
              { icon: '🏨', label: 'Hotels & Guesthouses', search: 'Hotel' },
              { icon: '🏗️', label: 'Development Land', search: 'Land Development' },
            ].map((c, i) => (
              <ScrollReveal key={c.label} delay={i * 0.05}>
                <div className="ws-card" onClick={() => onSearch?.(c.search)} style={{ padding: '22px 16px', borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{c.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ APP DOWNLOAD CTA ═══ */}
      <section style={{ padding: '64px 0', background: 'linear-gradient(135deg, rgba(141,198,63,0.08), rgba(0,0,0,0.6))', borderTop: '1px solid rgba(141,198,63,0.1)' }}>
        <div className="ws-container" style={{ textAlign: 'center' }}>
          <ScrollReveal>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Search Faster on the App</h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', margin: '0 auto 32px', maxWidth: 480 }}>Download INDOO for the full experience — GPS search, video tours, instant booking.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <button style={{ padding: '16px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(141,198,63,0.3)' }}>📱 Download for Android</button>
              <button style={{ padding: '16px 36px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🍎 Download for iOS</button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
