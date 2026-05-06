/**
 * NewProjectsSection — Developer new-build property projects.
 * Brochure download, floor plans, unit types, payment schedule.
 */
import { useState } from 'react'

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

const DEMO_PROJECTS = [
  {
    id: 'np1',
    name: 'Grand Citra Residence',
    developer: 'Ciputra Group',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
    location: 'Sleman, Yogyakarta',
    startingPrice: 450000000,
    completionDate: '2027-Q2',
    status: 'Pre-Sale',
    units: [
      { type: 'Type 36/72', bedrooms: 2, bathrooms: 1, price: 450000000 },
      { type: 'Type 45/90', bedrooms: 3, bathrooms: 2, price: 650000000 },
      { type: 'Type 60/120', bedrooms: 3, bathrooms: 2, price: 850000000 },
    ],
    amenities: ['Pool', 'Gym', 'Security 24h', 'Garden', 'Playground', 'Mosque'],
    paymentSchedule: 'Booking fee Rp 5M → DP 20% (3x installment) → KPR/Cash',
    brochureUrl: null,
    floorPlanUrl: null,
  },
  {
    id: 'np2',
    name: 'The Green Villas Kaliurang',
    developer: 'Jogja Land Development',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
    location: 'Kaliurang, Sleman',
    startingPrice: 1200000000,
    completionDate: '2027-Q4',
    status: 'Under Construction',
    units: [
      { type: 'Villa A — 2BR Pool', bedrooms: 2, bathrooms: 2, price: 1200000000 },
      { type: 'Villa B — 3BR Pool', bedrooms: 3, bathrooms: 3, price: 1800000000 },
    ],
    amenities: ['Private Pool', 'Mountain View', 'Staff Quarter', 'Garden', 'BBQ Area'],
    paymentSchedule: 'Booking Rp 10M → DP 30% → Progress payment 40% → Handover 30%',
    brochureUrl: null,
    floorPlanUrl: null,
  },
  {
    id: 'np3',
    name: 'Apartemen Malioboro Square',
    developer: 'PP Properti',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
    location: 'Malioboro, Yogyakarta',
    startingPrice: 350000000,
    completionDate: '2028-Q1',
    status: 'Pre-Sale',
    units: [
      { type: 'Studio 22m²', bedrooms: 0, bathrooms: 1, price: 350000000 },
      { type: '1BR 35m²', bedrooms: 1, bathrooms: 1, price: 520000000 },
      { type: '2BR 55m²', bedrooms: 2, bathrooms: 1, price: 780000000 },
    ],
    amenities: ['Rooftop Pool', 'Sky Lounge', 'Gym', 'Co-working', 'Parking', 'Security'],
    paymentSchedule: 'NUP Rp 2M → Booking Rp 10M → DP 15% (6x) → KPR/Cash',
    brochureUrl: null,
    floorPlanUrl: null,
  },
]

function fmtRp(n) {
  if (!n) return '—'
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function NewProjectsSection({ onSelectProject }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🏗️</span> New Projects
        <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(250,204,21,0.12)', fontSize: 10, fontWeight: 800, color: '#FACC15' }}>NEW</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DEMO_PROJECTS.map(project => {
          const isOpen = expanded === project.id
          return (
            <div key={project.id} style={{ ...glass, overflow: 'hidden' }}>
              {/* Hero + info */}
              <button onClick={() => setExpanded(isOpen ? null : project.id)} style={{
                width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'left', padding: 0,
              }}>
                <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                  <img src={project.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.85))' }} />
                  {/* Status badge */}
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, background: project.status === 'Pre-Sale' ? 'rgba(250,204,21,0.15)' : 'rgba(141,198,63,0.15)', border: `1px solid ${project.status === 'Pre-Sale' ? 'rgba(250,204,21,0.3)' : 'rgba(141,198,63,0.3)'}`, fontSize: 11, fontWeight: 800, color: project.status === 'Pre-Sale' ? '#FACC15' : '#8DC63F' }}>
                    {project.status}
                  </div>
                  {/* Completion */}
                  <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>
                    📅 {project.completionDate}
                  </div>
                  {/* Name + developer */}
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>{project.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>by {project.developer} · {project.location}</div>
                  </div>
                </div>
                {/* Price row */}
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Starting from</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(project.startingPrice)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{isOpen ? '▲ Less' : '▼ Details'}</div>
                </div>
              </button>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ padding: '0 14px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {/* Unit types */}
                  <div style={{ marginTop: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>Available Units</div>
                    {project.units.map((u, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', marginBottom: 2 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{u.type}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.bedrooms}BR · {u.bathrooms}BA</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{fmtRp(u.price)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Amenities */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>Amenities</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {project.amenities.map(a => (
                        <span key={a} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{a}</span>
                      ))}
                    </div>
                  </div>

                  {/* Payment schedule */}
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', marginBottom: 4 }}>💳 Payment Schedule</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{project.paymentSchedule}</div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => {
                      if (project.brochureUrl) window.open(project.brochureUrl, '_blank')
                      else alert('Brochure not available yet — contact developer')
                    }} style={{
                      flex: 1, padding: '12px 0', borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>📄 Brochure</button>
                    <button onClick={() => onSelectProject?.(project)} style={{
                      flex: 1.5, padding: '12px 0', borderRadius: 12, border: 'none',
                      background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                      color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 4px 16px rgba(141,198,63,0.3)',
                    }}>📞 Contact Developer</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
