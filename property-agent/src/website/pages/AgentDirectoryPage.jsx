/**
 * AgentDirectoryPage — Browse agents grouped by city/location.
 * Click agent → opens full profile with listings, sales records, contacts.
 */
import { useState, useRef, useEffect } from 'react'
import { ScrollReveal } from '../hooks/useScrollReveal'

const DEMO_AGENTS = [
  { id: 'a1', name: 'Ahmad Pratama', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', company: 'Ray White Yogyakarta', city: 'Yogyakarta', rating: 4.8, reviews: 34, sold: 45, yearsActive: 8, specializations: ['Villa', 'House', 'Land'], languages: ['Bahasa', 'English'], responseTime: '1 hour', avgDaysToSell: 35, totalTransactionValue: 25000000000, bio: 'Specialized in villa and residential properties in Yogyakarta. 8 years helping local and international buyers find their dream property.', whatsapp: '081234567890', instagram: 'ahmadproperty', verified: true, licenseNumber: 'PPAT-DIY-2018-001' },
  { id: 'a2', name: 'Dewi Anggraini', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', company: 'Brighton Real Estate', city: 'Bali', rating: 4.9, reviews: 56, sold: 78, yearsActive: 12, specializations: ['Villa', 'Resort', 'Commercial'], languages: ['Bahasa', 'English', 'Mandarin'], responseTime: '30 min', avgDaysToSell: 28, totalTransactionValue: 58000000000, bio: 'Bali villa specialist with deep knowledge of Seminyak, Canggu, and Ubud markets. Helping foreign investors navigate Indonesian property law.', whatsapp: '087654321098', instagram: 'dewibaliproperti', verified: true, licenseNumber: 'PPAT-BALI-2014-023' },
  { id: 'a3', name: 'Hendra Wijaya', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', company: 'ERA Indonesia', city: 'Yogyakarta', rating: 4.6, reviews: 21, sold: 22, yearsActive: 5, specializations: ['Kos', 'Apartment', 'House'], languages: ['Bahasa', 'English'], responseTime: '2 hours', avgDaysToSell: 50, totalTransactionValue: 8000000000, bio: 'Focus on student housing and apartments near UGM and UNY campuses. Expert in kos investment properties.', whatsapp: '085111222333', verified: true },
  { id: 'a4', name: 'Sari Rahayu', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', company: 'Independent', city: 'Yogyakarta', rating: 4.5, reviews: 14, sold: 12, yearsActive: 3, specializations: ['House', 'Land'], languages: ['Bahasa'], responseTime: '3 hours', avgDaysToSell: 60, totalTransactionValue: 4000000000, bio: 'Helping families find affordable homes in south Yogyakarta. Specializing in new builds and land investment.', whatsapp: '089876543210', verified: false },
  { id: 'a5', name: 'Made Surya', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', company: 'Century 21 Bali', city: 'Bali', rating: 4.7, reviews: 42, sold: 63, yearsActive: 10, specializations: ['Villa', 'Land', 'Commercial'], languages: ['Bahasa', 'English', 'Japanese'], responseTime: '1 hour', avgDaysToSell: 32, totalTransactionValue: 42000000000, bio: 'South Bali specialist. Expert in cliff-top villas and beachfront properties. Strong network with Japanese and Australian buyers.', whatsapp: '081999888777', instagram: 'madesurya_bali', verified: true, licenseNumber: 'PPAT-BALI-2016-045' },
  { id: 'a6', name: 'Rina Kusuma', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', company: 'Coldwell Banker', city: 'Jakarta', rating: 4.8, reviews: 38, sold: 52, yearsActive: 9, specializations: ['Apartment', 'House', 'Ruko'], languages: ['Bahasa', 'English'], responseTime: '1 hour', avgDaysToSell: 40, totalTransactionValue: 35000000000, bio: 'Jakarta property expert specializing in South Jakarta premium residential and commercial properties.', whatsapp: '081222333444', instagram: 'rinakusuma_property', verified: true },
  { id: 'a7', name: 'Wayan Dharma', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', company: 'Independent', city: 'Bali', rating: 4.4, reviews: 18, sold: 15, yearsActive: 4, specializations: ['Villa', 'Land'], languages: ['Bahasa', 'English'], responseTime: '2 hours', avgDaysToSell: 55, totalTransactionValue: 12000000000, bio: 'Ubud and north Bali specialist. Focus on eco-friendly villas and rice field properties.', whatsapp: '087888999000', verified: false },
  { id: 'a8', name: 'Putri Ayu', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', company: 'LJ Hooker', city: 'Jakarta', rating: 4.7, reviews: 29, sold: 38, yearsActive: 7, specializations: ['Apartment', 'Commercial'], languages: ['Bahasa', 'English', 'Korean'], responseTime: '45 min', avgDaysToSell: 35, totalTransactionValue: 28000000000, bio: 'Premium apartment specialist in Jakarta CBD. Strong connections with Korean expat community.', whatsapp: '081333444555', instagram: 'putriayu_property', verified: true },
]

function fmtRpShort(n) {
  if (!n) return '—'
  if (n >= 1e12) return `Rp ${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(0)}B`
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)}M`
  return `Rp ${n.toLocaleString('id-ID')}`
}

const CITIES = ['All', 'Yogyakarta', 'Bali', 'Jakarta']
const SPECS = ['All', 'Villa', 'House', 'Apartment', 'Kos', 'Land', 'Commercial']

const pill = (active) => ({ padding: '7px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, border: 'none', background: active ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#8DC63F' : 'rgba(255,255,255,0.4)', outline: active ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)' })
const glass = { background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 }

export default function AgentDirectoryPage({ onSelectAgent, onBack }) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All')
  const [spec, setSpec] = useState('All')
  const [sortBy, setSortBy] = useState('rating') // rating | sold | experience

  let agents = [...DEMO_AGENTS]
  if (city !== 'All') agents = agents.filter(a => a.city === city)
  if (spec !== 'All') agents = agents.filter(a => a.specializations.includes(spec))
  if (search.trim()) { const q = search.toLowerCase(); agents = agents.filter(a => a.name.toLowerCase().includes(q) || a.company.toLowerCase().includes(q) || a.specializations.some(s => s.toLowerCase().includes(q))) }
  if (sortBy === 'rating') agents.sort((a, b) => b.rating - a.rating)
  if (sortBy === 'sold') agents.sort((a, b) => b.sold - a.sold)
  if (sortBy === 'experience') agents.sort((a, b) => b.yearsActive - a.yearsActive)

  // Group by city
  const grouped = {}
  agents.forEach(a => { if (!grouped[a.city]) grouped[a.city] = []; grouped[a.city].push(a) })

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">
        {/* Header */}
        <ScrollReveal>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>🏢 Property <span style={{ color: '#8DC63F' }}>Agents</span></h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{agents.length} verified professionals · Grouped by location</p>
            </div>
            {onBack && <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.1}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            {[
              { val: agents.length, label: 'Total Agents', color: '#fff' },
              { val: agents.reduce((s, a) => s + a.sold, 0), label: 'Total Sales', color: '#8DC63F' },
              { val: agents.filter(a => a.verified).length, label: 'Verified', color: '#60A5FA' },
              { val: fmtRpShort(agents.reduce((s, a) => s + (a.totalTransactionValue || 0), 0)), label: 'Transaction Value', color: '#FACC15' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, padding: '14px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={0.1}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents, companies..." style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 220 }} />
            <div style={{ display: 'flex', gap: 6 }}>{CITIES.map(c => <button key={c} onClick={() => setCity(c)} style={pill(city === c)}>{c}</button>)}</div>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', gap: 6 }}>{SPECS.map(s => <button key={s} onClick={() => setSpec(s)} style={pill(spec === s)}>{s}</button>)}</div>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ id: 'rating', label: '⭐ Rating' }, { id: 'sold', label: '📊 Most Sales' }, { id: 'experience', label: '📅 Experience' }].map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)} style={pill(sortBy === s.id)}>{s.label}</button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Agents grouped by city */}
        {city === 'All' ? (
          Object.entries(grouped).map(([cityName, cityAgents]) => (
            <div key={cityName} style={{ marginBottom: 32 }}>
              <ScrollReveal>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📍 {cityName}
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{cityAgents.length} agent{cityAgents.length > 1 ? 's' : ''}</span>
                </h2>
              </ScrollReveal>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {cityAgents.map((a, i) => <AgentCard key={a.id} agent={a} delay={i * 0.05} onSelect={() => onSelectAgent?.(a)} />)}
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {agents.map((a, i) => <AgentCard key={a.id} agent={a} delay={i * 0.05} onSelect={() => onSelectAgent?.(a)} />)}
          </div>
        )}

        {agents.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>No agents found</div>}

        {/* Top Agents This Month — under city groups */}
        <ScrollReveal>
          <div style={{ marginTop: 40, marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>🏆 <span style={{ color: '#60A5FA' }}>Top Agents</span> This Month</h2>
            <TopAgentsRow agents={DEMO_AGENTS} />
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

function isAgentAvailableNow() {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const min = now.getMinutes()
  const t = hour + min / 60
  return (day >= 1 && day <= 5 && t >= 8 && t < 17) || (day === 6 && t >= 9 && t < 14)
}

function AgentCard({ agent: a, delay, onSelect }) {
  const available = isAgentAvailableNow()
  return (
    <ScrollReveal delay={delay}>
      <div className="ws-card" onClick={onSelect} style={{ ...glass, padding: '24px', cursor: 'pointer' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={a.photo} alt={a.name} style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover', border: '2.5px solid rgba(141,198,63,0.3)' }} />
            {available && <span style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#8DC63F', border: '2px solid rgba(0,0,0,0.7)', boxShadow: '0 0 6px rgba(141,198,63,0.6)' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{a.name}</span>
              {a.verified && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(96,165,250,0.12)', fontSize: 9, fontWeight: 800, color: '#60A5FA' }}>✓</span>}
              {available && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.25)', fontSize: 9, fontWeight: 800, color: '#8DC63F' }}>Available</span>}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{a.company}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{a.yearsActive}yr exp · 🗣️ {a.languages?.join(', ')}</div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12, minHeight: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.bio}</div>

        {/* Specializations */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
          {a.specializations.map(s => <span key={s} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', fontSize: 11, fontWeight: 700, color: '#FACC15' }}>{s}</span>)}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>⭐ {a.rating}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{a.reviews} reviews</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>{a.sold}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Sold</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#60A5FA' }}>~{a.avgDaysToSell}d</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Avg Sale</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{a.responseTime}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Reply</div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`https://wa.me/${a.whatsapp.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/dfggdfgees-removebg-preview.png" alt="WhatsApp" style={{ height: 40, objectFit: 'contain' }} /></a>
          <button onClick={onSelect} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid rgba(141,198,63,0.3)', background: 'rgba(141,198,63,0.08)', color: '#8DC63F', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>View Profile →</button>
        </div>
      </div>
    </ScrollReveal>
  )
}

function TopAgentsRow({ agents }) {
  const ref = useRef(null)
  const sorted = [...agents].sort((a, b) => b.sold - a.sold).slice(0, 8)
  useEffect(() => {
    const el = ref.current; if (!el || sorted.length < 3) return
    let raf
    const tick = () => { el.scrollLeft += 0.3; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    const stop = () => cancelAnimationFrame(raf)
    const go = () => { raf = requestAnimationFrame(tick) }
    el.addEventListener('mouseenter', stop); el.addEventListener('mouseleave', go)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('mouseenter', stop); el.removeEventListener('mouseleave', go) }
  }, [sorted])
  const doubled = [...sorted, ...sorted]
  return (
    <div ref={ref} style={{ display: 'flex', gap: 20, overflowX: 'hidden', scrollbarWidth: 'none', padding: '4px 0' }}>
      {doubled.map((a, i) => (
        <div key={`${a.id}-${i}`} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 90 }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(96,165,250,0.3)' }}>
            <img src={a.photo} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{a.name}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#60A5FA' }}>{a.sold} sold · ⭐ {a.rating}</div>
        </div>
      ))}
    </div>
  )
}

export { DEMO_AGENTS }
