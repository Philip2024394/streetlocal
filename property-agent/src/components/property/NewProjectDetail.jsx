/**
 * NewProjectDetail — Full detail page for a developer project.
 * Desktop: 2-column layout. Hero/video left, details right. Compact sections.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { fmtRp, STATUS_LABELS } from '@/services/newProjectService'
import PropertyMap from '@/components/property/PropertyMap'

const glass = { background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

export default function NewProjectDetail({ open, onClose, project }) {
  const [activeImg, setActiveImg] = useState(0)
  const [selectedUnit, setSelectedUnit] = useState(0)
  const [dpPct, setDpPct] = useState(20)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitName, setVisitName] = useState('')
  const [visitPhone, setVisitPhone] = useState('')
  const [visitSent, setVisitSent] = useState(false)

  if (!open || !project) return null

  const images = project.images?.length ? project.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600']
  const units = project.units || []
  const unit = units[selectedUnit] || {}
  const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.pre_sale
  const soldPct = project.total_units > 0 ? Math.round((project.units_sold || 0) / project.total_units * 100) : 0
  const office = project.site_office || {}

  const dp = unit.price ? Math.round(unit.price * dpPct / 100) : 0
  const loanAmount = unit.price ? unit.price - dp : 0
  const monthlyKpr = loanAmount > 0 ? Math.round(loanAmount * (8.5 / 100 / 12) * Math.pow(1 + 8.5 / 100 / 12, 240) / (Math.pow(1 + 8.5 / 100 / 12, 240) - 1)) : 0

  const handleVisitSubmit = () => {
    const msg = `Halo, saya ${visitName} ingin booking site visit untuk project ${project.project_name}. No HP: ${visitPhone}`
    window.open(`https://wa.me/${(project.contact_whatsapp || '').replace(/^0/, '62')}?text=${encodeURIComponent(msg)}`, '_blank')
    setVisitSent(true)
  }

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#0a0a0a', overflowY: 'auto' }}>

      {/* Back button */}
      <button onClick={onClose} style={{ position: 'fixed', top: 14, left: 14, zIndex: 9999, width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 32px 60px' }}>

        {/* ═══ TOP: Image/Video + Project Info side by side ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Left — Gallery + Video */}
          <div>
            {/* Main image */}
            <div style={{ ...glass, overflow: 'hidden', marginBottom: 10, position: 'relative' }}>
              {project.video_url && activeImg === -1 ? (
                <video src={project.video_url} style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }} controls autoPlay />
              ) : (
                <img src={images[activeImg] || images[0]} alt="" style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 8, background: `${statusInfo.color}20`, border: `1.5px solid ${statusInfo.color}50`, fontSize: 11, fontWeight: 800, color: statusInfo.color }}>{statusInfo.label}</div>
              {project.verified && <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2006_18_19%20AM.png?updatedAt=1777677521038" alt="Verified" style={{ position: 'absolute', top: 12, left: 56, width: 28, height: 28, objectFit: 'contain' }} />}
            </div>

            {/* Thumbnails + video toggle */}
            <div style={{ display: 'flex', gap: 6 }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{ width: 60, height: 44, borderRadius: 8, overflow: 'hidden', border: activeImg === i ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, opacity: activeImg === i ? 1 : 0.6 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
              {project.video_url && (
                <button onClick={() => setActiveImg(-1)} style={{ width: 60, height: 44, borderRadius: 8, border: activeImg === -1 ? '2px solid #8DC63F' : '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeImg === -1 ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800 }}>Video</button>
              )}
            </div>
          </div>

          {/* Right — Project Info */}
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{project.project_name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>by {project.developer_name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>📍 {project.location}</div>

            {project.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14 }}>{project.description}</div>}

            {/* Price + Completion */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ ...glass, flex: 1, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Starting from</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(project.min_price)}</div>
              </div>
              <div style={{ ...glass, flex: 1, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Completion</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#60A5FA' }}>{project.completion_date}</div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Units Sold</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F' }}>{project.units_sold || 0}/{project.total_units}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${soldPct}%`, borderRadius: 3, background: soldPct > 80 ? '#EF4444' : '#8DC63F' }} />
              </div>
            </div>

            {/* Payment schedule */}
            {project.payment_schedule && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.1)', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#FACC15', marginBottom: 3 }}>Booking & Payment</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{project.payment_schedule}</div>
              </div>
            )}

            {/* Contact */}
            <div style={{ display: 'flex', gap: 8 }}>
              {project.contact_whatsapp && (
                <a href={`https://wa.me/${project.contact_whatsapp.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <img src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png?updatedAt=1777539531358" alt="WhatsApp" style={{ height: 40, objectFit: 'contain' }} />
                </a>
              )}
              {project.instagram && (
                <a href={`https://instagram.com/${project.instagram}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '10px', borderRadius: 10, textDecoration: 'none', background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.2)', color: '#E1306C', fontSize: 12, fontWeight: 800, textAlign: 'center' }}>Instagram</a>
              )}
              <button onClick={() => project.brochure_url ? window.open(project.brochure_url, '_blank') : null} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Brochure</button>
            </div>
          </div>
        </div>

        {/* ═══ MIDDLE: Units + Payment + Amenities ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Unit Selector */}
          <div style={{ ...glass, padding: '16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Unit Types</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {units.map((u, i) => (
                <button key={i} onClick={() => setSelectedUnit(i)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: selectedUnit === i ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.02)',
                  border: selectedUnit === i ? '1.5px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: selectedUnit === i ? '#FACC15' : '#fff' }}>{u.type}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{u.bedrooms}BR · {u.bathrooms}BA · {u.area_sqm}m²</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(u.price)}</div>
                    {u.available_count !== undefined && <div style={{ fontSize: 9, color: u.available_count <= 3 ? '#EF4444' : '#8DC63F', fontWeight: 700 }}>{u.available_count} left</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Calculator */}
          <div style={{ ...glass, padding: '16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Payment Estimate</div>
            {unit.price > 0 ? (
              <>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Selected: {unit.type}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Down Payment</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>{dpPct}%</span>
                </div>
                <input type="range" min={10} max={50} step={5} value={dpPct} onChange={e => setDpPct(Number(e.target.value))} style={{ width: '100%', accentColor: '#8DC63F', height: 4, marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>DP ({dpPct}%)</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(dp)}</div>
                  </div>
                  <div style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>KPR/mo (20yr)</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>{fmtRp(monthlyKpr)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: 20 }}>Select a unit type</div>
            )}
          </div>

          {/* Amenities */}
          <div style={{ ...glass, padding: '16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Amenities</div>
            {project.amenities?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px' }}>
                {project.amenities.map(a => (
                  <div key={a} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>· {a}</div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: 20 }}>No amenities listed</div>
            )}
          </div>
        </div>

        {/* ═══ BOTTOM: Map + Site Office + Book Visit ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* Map */}
          <div style={{ ...glass, overflow: 'hidden' }}>
            {project.lat && project.lng ? (
              <PropertyMap lat={project.lat} lng={project.lng} title={project.project_name} height={200} style={{ borderRadius: 14 }} />
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Map not available</div>
            )}
          </div>

          {/* Site Office */}
          <div style={{ ...glass, padding: '16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15', marginBottom: 10 }}>Site Office</div>
            {office.address && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.4 }}>📍 {office.address}</div>}
            {office.hours && (
              <div style={{ marginBottom: 8 }}>
                {office.hours.weekdays && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between' }}><span>Mon-Fri</span><span style={{ color: '#8DC63F', fontWeight: 700 }}>{office.hours.weekdays}</span></div>}
                {office.hours.saturday && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between' }}><span>Saturday</span><span style={{ color: '#8DC63F', fontWeight: 700 }}>{office.hours.saturday}</span></div>}
                {office.hours.sunday && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between' }}><span>Sunday</span><span style={{ color: office.hours.sunday === 'Closed' ? '#EF4444' : '#8DC63F', fontWeight: 700 }}>{office.hours.sunday}</span></div>}
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{project.developer_name}</div>
            {project.website && <div style={{ fontSize: 11, color: '#60A5FA' }}>{project.website}</div>}
            {project.verified && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', fontSize: 10, fontWeight: 800, color: '#60A5FA', marginTop: 6 }}><img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2006_18_19%20AM.png?updatedAt=1777677521038" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> Verified</div>}
          </div>

          {/* Book Site Visit */}
          <div style={{ ...glass, padding: '16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Book Site Visit</div>
            {visitSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Request sent via WhatsApp</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Developer will confirm your visit</div>
              </div>
            ) : (
              <>
                <input value={visitName} onChange={e => setVisitName(e.target.value)} placeholder="Your name" style={inp} />
                <input value={visitPhone} onChange={e => setVisitPhone(e.target.value)} placeholder="WhatsApp number" type="tel" style={inp} />
                <button onClick={handleVisitSubmit} disabled={!visitName.trim() || !visitPhone.trim()} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: visitName.trim() && visitPhone.trim() ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)', color: visitName.trim() && visitPhone.trim() ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Send Request</button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}
