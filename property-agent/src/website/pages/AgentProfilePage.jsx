/**
 * AgentProfilePage — Full agent profile on desktop website.
 * Stats, portfolio, testimonials, listings, contact.
 */
import { useState } from 'react'
import { usePropertyListings } from '../hooks/usePropertyListings'
import { ScrollReveal } from '../hooks/useScrollReveal'
import StatsCounter from '../components/StatsCounter'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const TESTIMONIALS = [
  { name: 'Rina Sari', text: 'Very professional. Found our dream villa in just 2 weeks!', rating: 5 },
  { name: 'Budi Hartono', text: 'Excellent negotiation skills. Got us a great price.', rating: 5 },
  { name: 'Sarah Chen', text: 'Made buying property in Indonesia easy and transparent.', rating: 4 },
]

const glass = { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

export default function AgentProfilePage({ agent, onBack, onSelectListing }) {
  const [activeTab, setActiveTab] = useState('active')
  const [showConsult, setShowConsult] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formSent, setFormSent] = useState(false)

  if (!agent) return null

  const { listings: allListings } = usePropertyListings()
  const listings = allListings.filter(l => l.owner_type === (agent.id ? 'agent' : 'owner')).slice(0, 10)
  const soldListings = [
    { id: 'sold1', title: 'Villa Sunset Seminyak', city: 'Bali', status: 'sold', buy_now: 2800000000 },
    { id: 'sold2', title: 'Rumah Minimalis Sleman', city: 'Yogyakarta', status: 'sold', buy_now: 850000000 },
  ]

  const sendWA = (msg) => { window.open(`https://wa.me/${(agent.whatsapp || '').replace(/^0/, '62')}?text=${encodeURIComponent(msg)}`, '_blank'); setFormSent(true) }

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">
        {/* Back */}
        {onBack && <button onClick={onBack} style={{ marginBottom: 16, padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back to Agents</button>}

        {/* ═══ HERO ═══ */}
        <ScrollReveal>
          <div style={{ ...glass, padding: '32px', marginBottom: 24, display: 'flex', gap: 32 }}>
            {/* Photo */}
            <div style={{ width: 120, height: 120, borderRadius: 28, overflow: 'hidden', flexShrink: 0, border: '3px solid rgba(141,198,63,0.4)' }}>
              <img src={agent.photo} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>{agent.name}</h1>
                {agent.verified && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>✓ Verified</span>}
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{agent.company}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>📍 {agent.city} · {agent.yearsActive} years experience</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {agent.specializations?.map(s => <span key={s} style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', fontSize: 12, fontWeight: 700, color: '#FACC15' }}>{s}</span>)}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{agent.bio}</div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 140, flexShrink: 0 }}>
              <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FACC15' }}>⭐ {agent.rating}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{agent.reviews} reviews</div>
              </div>
              <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F' }}>{agent.sold}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Properties Sold</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══ CTA ROW ═══ */}
        <ScrollReveal delay={0.1}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button onClick={() => setShowConsult(true)} style={{ flex: 1, padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(141,198,63,0.3)' }}>📞 Free Consultation</button>
            <a href={`https://wa.me/${(agent.whatsapp || '').replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}><img src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png?updatedAt=1777539531358" alt="WhatsApp" style={{ height: 48, objectFit: 'contain' }} /></a>
            {agent.instagram && <a href={`https://instagram.com/${agent.instagram}`} target="_blank" rel="noopener noreferrer" style={{ width: 50, borderRadius: 14, textDecoration: 'none', background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📸</a>}
            {agent.facebook && <a href={`https://facebook.com/${agent.facebook}`} target="_blank" rel="noopener noreferrer" style={{ width: 50, borderRadius: 14, textDecoration: 'none', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📘</a>}
            {agent.tiktok && <a href={`https://tiktok.com/@${agent.tiktok}`} target="_blank" rel="noopener noreferrer" style={{ width: 50, borderRadius: 14, textDecoration: 'none', background: '#000', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎵</a>}
            {agent.twitter && <a href={`https://x.com/${agent.twitter}`} target="_blank" rel="noopener noreferrer" style={{ width: 50, borderRadius: 14, textDecoration: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: '#fff', fontWeight: 900 }}>𝕏</a>}
          </div>
        </ScrollReveal>

        {/* ═══ OFFICE HOURS & AVAILABILITY ═══ */}
        <ScrollReveal delay={0.12}>
          {(() => {
            const now = new Date()
            const day = now.getDay() // 0=Sun
            const hour = now.getHours()
            const min = now.getMinutes()
            const t = hour + min / 60
            const isAvailable = (day >= 1 && day <= 5 && t >= 8.5 && t < 17) || (day === 6 && t >= 9 && t < 14)
            const officeHours = [
              { day: 'Monday - Friday', hours: '08:30 - 17:00' },
              { day: 'Saturday', hours: '09:00 - 14:00' },
              { day: 'Sunday', hours: 'Closed' },
            ]
            const viewingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            const responseHours = agent.responseTime || '1 hour'
            return (
              <div style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>🕐 Office Hours & Availability</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '5px 14px', borderRadius: 10, background: isAvailable ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${isAvailable ? 'rgba(141,198,63,0.3)' : 'rgba(239,68,68,0.3)'}`, fontSize: 12, fontWeight: 800, color: isAvailable ? '#8DC63F' : '#EF4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAvailable ? '#8DC63F' : '#EF4444', display: 'inline-block', boxShadow: isAvailable ? '0 0 6px rgba(141,198,63,0.6)' : 'none' }} />
                      {isAvailable ? 'Available Now' : 'Offline'}
                    </span>
                    <span style={{ padding: '5px 14px', borderRadius: 10, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', fontSize: 12, fontWeight: 800, color: '#60A5FA' }}>⚡ Responds within {responseHours}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Office Hours Table */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Office Hours</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {officeHours.map(r => (
                        <div key={r.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.day}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: r.hours === 'Closed' ? '#EF4444' : '#8DC63F' }}>{r.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Viewing Availability */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Property Viewing Days</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => {
                        const active = viewingDays.includes(d)
                        return (
                          <span key={d} style={{ padding: '6px 14px', borderRadius: 10, background: active ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(141,198,63,0.25)' : 'rgba(255,255,255,0.06)'}`, fontSize: 12, fontWeight: 700, color: active ? '#8DC63F' : 'rgba(255,255,255,0.2)' }}>
                            {active ? '✓ ' : ''}{d.slice(0, 3)}
                          </span>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                      Viewings available by appointment. Contact via WhatsApp to schedule.
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </ScrollReveal>

        {/* ═══ TESTIMONIALS ═══ */}
        <ScrollReveal delay={0.15}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>⭐ Client Testimonials</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ ...glass, padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{t.name}</span>
                  <span style={{ fontSize: 12, color: '#FACC15' }}>{'⭐'.repeat(t.rating)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontStyle: 'italic' }}>"{t.text}"</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* ═══ LISTINGS TABS ═══ */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[{ id: 'active', label: `Active Listings (${listings.length})` }, { id: 'sold', label: `Sold (${soldListings.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '14px 24px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', color: activeTab === tab.id ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 800, position: 'relative', borderBottom: activeTab === tab.id ? '2px solid #8DC63F' : '2px solid transparent' }}>{tab.label}</button>
          ))}
        </div>

        {/* Active */}
        {activeTab === 'active' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {listings.map((l, i) => {
              const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
              return (
                <ScrollReveal key={l.id} delay={i * 0.04}>
                  <div className="ws-card" onClick={() => onSelectListing?.(l)} style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                      <img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 6, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 10, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'SALE' : 'RENT'}</div>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>📍 {l.city}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginTop: 4 }}>{fmtRp(price)}</div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        )}

        {/* Sold */}
        {activeTab === 'sold' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {soldListings.map(l => (
              <div key={l.id} style={{ ...glass, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l.city} · SOLD</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(l.buy_now)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ CONSULTATION MODAL ═══ */}
      {showConsult && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowConsult(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 420, background: '#0a0a0a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '32px' }}>
            {formSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#8DC63F' }}>Sent via WhatsApp!</div>
                <button onClick={() => { setShowConsult(false); setFormSent(false) }} style={{ marginTop: 16, padding: '12px 28px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>📞 Free Consultation</h3>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="WhatsApp number" type="tel" style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowConsult(false)} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={() => sendWA(`Halo ${agent.name}, saya ${formName} ingin konsultasi tentang properti. HP: ${formPhone}`)} disabled={!formName.trim() || !formPhone.trim()} style={{ flex: 2, padding: '6px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: formName.trim() && formPhone.trim() ? 1 : 0.3 }}><img src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png?updatedAt=1777539531358" alt="Send via WhatsApp" style={{ height: 40, objectFit: 'contain' }} /></button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
