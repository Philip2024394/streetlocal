/**
 * AgentDirectoryPage — Browse all property agents.
 * Search, filter by specialization/area, view profiles.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import AgentProfilePage from '@/components/profile/AgentProfilePage'
import IndooFooter from '@/components/ui/IndooFooter'

// Demo agents
const DEMO_AGENTS = [
  { id: 'a1', name: 'Ahmad Pratama', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', company: 'Ray White Yogyakarta', city: 'Yogyakarta', ownerType: 'agent', verified: true, ktpVerified: true, rating: 4.8, reviewCount: 34, yearsActive: 8, memberSince: '2022', specializations: ['Villa', 'House', 'Land'], areasServed: ['Sleman', 'Bantul'], languages: ['Bahasa', 'English'], responseTime: '1 hour', avgDaysToSell: 35, totalSold: 45, bio: 'Specialized in villa and residential properties in Yogyakarta. 8 years experience helping local and international buyers find their dream property.', whatsapp: '081234567890', instagram: 'ahmadproperty', licenseNumber: 'PPAT-DIY-2018-001' },
  { id: 'a2', name: 'Dewi Anggraini', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', company: 'Brighton Real Estate', city: 'Bali', ownerType: 'agent', verified: true, ktpVerified: true, rating: 4.9, reviewCount: 56, yearsActive: 12, memberSince: '2021', specializations: ['Villa', 'Resort', 'Commercial'], areasServed: ['Seminyak', 'Canggu', 'Ubud'], languages: ['Bahasa', 'English', 'Mandarin'], responseTime: '30 min', avgDaysToSell: 28, totalSold: 78, bio: 'Bali villa specialist with deep knowledge of Seminyak, Canggu, and Ubud markets. Helping foreign investors navigate Indonesian property law.', whatsapp: '087654321098', instagram: 'dewibaliproperti', licenseNumber: 'PPAT-BALI-2014-023' },
  { id: 'a3', name: 'Hendra Wijaya', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', company: 'ERA Indonesia', city: 'Yogyakarta', ownerType: 'agent', verified: true, rating: 4.6, reviewCount: 21, yearsActive: 5, memberSince: '2023', specializations: ['Kos', 'Apartment', 'House'], areasServed: ['Yogyakarta City', 'Sleman'], languages: ['Bahasa', 'English'], responseTime: '2 hours', avgDaysToSell: 50, totalSold: 22, bio: 'Focus on student housing and apartments near UGM and UNY campuses. Expert in kos investment properties.', whatsapp: '085111222333', instagram: 'hendraproperti' },
  { id: 'a4', name: 'Sari Rahayu', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', company: 'Independent Agent', city: 'Yogyakarta', ownerType: 'agent', verified: false, rating: 4.5, reviewCount: 14, yearsActive: 3, memberSince: '2024', specializations: ['House', 'Land'], areasServed: ['Bantul', 'Kulon Progo'], languages: ['Bahasa'], responseTime: '3 hours', avgDaysToSell: 60, totalSold: 12, bio: 'Helping families find affordable homes in south Yogyakarta. Specializing in new builds and land investment.', whatsapp: '089876543210' },
  { id: 'a5', name: 'Made Surya', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', company: 'Century 21 Bali', city: 'Bali', ownerType: 'agent', verified: true, ktpVerified: true, rating: 4.7, reviewCount: 42, yearsActive: 10, memberSince: '2022', specializations: ['Villa', 'Land', 'Commercial'], areasServed: ['Uluwatu', 'Jimbaran', 'Nusa Dua'], languages: ['Bahasa', 'English', 'Japanese'], responseTime: '1 hour', avgDaysToSell: 32, totalSold: 63, bio: 'South Bali specialist. Expert in cliff-top villas and beachfront properties. Strong network with Japanese and Australian buyers.', whatsapp: '081999888777', instagram: 'madesurya_bali', licenseNumber: 'PPAT-BALI-2016-045' },
]

export default function AgentDirectoryPage({ open, onClose, onSelectListing }) {
  const [search, setSearch] = useState('')
  const [filterCity, setFilterCity] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState(null)

  if (!open) return null

  const cities = ['all', ...new Set(DEMO_AGENTS.map(a => a.city))]

  let agents = DEMO_AGENTS
  if (filterCity !== 'all') agents = agents.filter(a => a.city === filterCity)
  if (search.trim()) {
    const q = search.toLowerCase()
    agents = agents.filter(a => a.name.toLowerCase().includes(q) || a.company?.toLowerCase().includes(q) || a.specializations?.some(s => s.toLowerCase().includes(q)))
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9400, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 16px 10px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>🏢 Property <span style={{ color: '#8DC63F' }}>Agents</span></h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{agents.length} verified agents</p>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 42, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginTop: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents, companies, specializations..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {/* City filter */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {cities.map(c => (
            <button key={c} onClick={() => setFilterCity(c)} style={{
              padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
              background: filterCity === c ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
              border: filterCity === c ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: filterCity === c ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700,
            }}>{c === 'all' ? 'All Cities' : c}</button>
          ))}
        </div>
      </div>

      {/* Agent list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px 100px' }}>
        {agents.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)' }}>No agents found</div>}

        {agents.map(agent => (
          <button key={agent.id} onClick={() => setSelectedAgent(agent)} style={{
            width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            textAlign: 'left', padding: 0, background: 'none', marginBottom: 10,
          }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px', display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Photo */}
              <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(141,198,63,0.3)' }}>
                {agent.photo ? <img src={agent.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{agent.name}</span>
                  {agent.verified && <span style={{ fontSize: 10, color: '#60A5FA' }}>✓</span>}
                </div>
                {agent.company && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{agent.company}</div>}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>📍 {agent.city} · {agent.yearsActive}yr exp · {agent.totalSold} sold</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {agent.specializations?.slice(0, 3).map(s => (
                    <span key={s} style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(250,204,21,0.08)', fontSize: 9, fontWeight: 700, color: '#FACC15' }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>⭐ {agent.rating}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{agent.reviewCount} reviews</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <IndooFooter label="Agents" onBack={onClose} onHome={onClose} />

      {/* Agent profile overlay */}
      <AgentProfilePage
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        agent={selectedAgent}
        listings={[]} // Would come from Supabase in production
        onSelectListing={onSelectListing}
      />
    </div>,
    document.body
  )
}
