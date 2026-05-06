/**
 * NewProjectsPage — Browse new developer projects on desktop website.
 * Constrained layout with video, map, site office hours, viewing schedule.
 */
import { useState, useEffect } from 'react'
import { getNewProjects, fmtRp, STATUS_LABELS } from '@/services/newProjectService'
import { ScrollReveal } from '../hooks/useScrollReveal'
import PropertyMap from '@/components/property/PropertyMap'

const glass = { background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export default function NewProjectsPage({ onSelectProject, onBack }) {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => { getNewProjects().then(setProjects) }, [])

  let filtered = projects
  if (search.trim()) { const q = search.toLowerCase(); filtered = projects.filter(p => p.project_name?.toLowerCase().includes(q) || p.developer_name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)) }

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <ScrollReveal>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 12 }}><img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2003_29_33%20AM.png?updatedAt=1777667392389" alt="" style={{ width: 130, height: 130, objectFit: 'contain' }} /> <span style={{ color: '#FACC15' }}>New</span> Projects</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{filtered.length} projects · Pre-sale & under construction</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220 }} />
              {onBack && <button onClick={onBack} style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>}
            </div>
          </div>
        </ScrollReveal>

        {/* Slow turn animation */}
        <style>{`
          @keyframes slowTurn {
            0% { transform: perspective(1200px) rotateY(0deg); }
            25% { transform: perspective(1200px) rotateY(2deg); }
            50% { transform: perspective(1200px) rotateY(0deg); }
            75% { transform: perspective(1200px) rotateY(-2deg); }
            100% { transform: perspective(1200px) rotateY(0deg); }
          }
          .np-card { animation: slowTurn 6s ease-in-out infinite; transition: transform 0.3s, box-shadow 0.3s; }
          .np-card:hover { animation-play-state: paused; transform: perspective(1200px) rotateY(0deg) scale(1.02) !important; box-shadow: 0 8px 32px rgba(141,198,63,0.15); }
          @keyframes npMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        `}</style>

        {/* Projects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {filtered.map((p, i) => {
            const status = STATUS_LABELS[p.status] || STATUS_LABELS.pre_sale
            const soldPct = p.total_units > 0 ? Math.round((p.units_sold || 0) / p.total_units * 100) : 0
            const office = p.site_office || {}
            const schedule = p.viewing_schedule || {}

            return (
              <ScrollReveal key={p.id} delay={i * 0.06}>
                <div className="np-card" style={{ ...glass, overflow: 'hidden', animationDelay: `${i * 0.8}s` }}>

                  {/* ── Top: Image + Info side by side ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr' }}>

                    {/* Left: Image + Thumbnails */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', flex: 1, minHeight: 220 }} onClick={() => onSelectProject?.(p)}>
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'} alt={p.project_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.7))' }} />
                        <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 12px', borderRadius: 8, background: `${status.color}20`, border: `1.5px solid ${status.color}50`, fontSize: 11, fontWeight: 800, color: status.color }}>{status.label}</div>
                        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                          {p.verified && <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2006_18_19%20AM.png?updatedAt=1777677521038" alt="Verified" style={{ width: 26, height: 26, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />}
                        </div>
                        {p.video_url && (
                          <div style={{ position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.6)', border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <div style={{ width: 0, height: 0, borderLeft: '12px solid #fff', borderTop: '7px solid transparent', borderBottom: '7px solid transparent', marginLeft: 3 }} />
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{p.project_name}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>by {p.developer_name}</div>
                        </div>
                      </div>
                      {/* Thumbnails — max 5 */}
                      {p.images?.length > 1 && (
                        <div style={{ display: 'flex', gap: 4, padding: '6px 8px', background: 'rgba(0,0,0,0.3)' }}>
                          {p.images.slice(0, 5).map((img, idx) => (
                            <div key={idx} style={{ flex: 1, height: 48, borderRadius: 6, overflow: 'hidden', border: idx === 0 ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.08)', opacity: idx === 0 ? 1 : 0.7 }}>
                              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                            </div>
                          ))}
                          {p.images.length > 5 && (
                            <div style={{ flex: 1, height: 48, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>+{p.images.length - 5}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Details */}
                    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      {/* Location + Date */}
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{p.project_name}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>📍 {p.location}</div>
                        <div style={{ fontSize: 12, color: '#60A5FA', marginBottom: 12 }}>📅 Completion: {p.completion_date}</div>

                        {/* Price + Units */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Starting from</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#FACC15' }}>{fmtRp(p.min_price)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>{p.units_sold || 0}/{p.total_units} sold</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{p.units?.length || 0} unit types</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 12 }}>
                          <div style={{ height: '100%', width: `${soldPct}%`, borderRadius: 2, background: soldPct > 80 ? '#EF4444' : '#8DC63F' }} />
                        </div>
                      </div>

                      {/* Booking Deposit */}
                      {p.payment_schedule && (
                        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.1)', marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#FACC15', marginBottom: 3 }}>Booking & Payment</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{p.payment_schedule}</div>
                        </div>
                      )}

                      {/* Amenities — 2 columns, gray text */}
                      {p.amenities?.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', marginBottom: 10 }}>
                          {p.amenities.slice(0, 6).map(a => (
                            <div key={a} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>· {a}</div>
                          ))}
                          {p.amenities.length > 6 && <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', padding: '3px 0' }}>+{p.amenities.length - 6} more</div>}
                        </div>
                      )}

                      {/* CTA */}
                      <button onClick={() => onSelectProject?.(p)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>View Project Details</button>
                    </div>
                  </div>

                  {/* ── Bottom: Map + Video + Office Hours side by side ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: '1px solid rgba(255,255,255,0.04)' }}>

                    {/* Map */}
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                      {p.lat && p.lng ? (
                        <PropertyMap lat={p.lat} lng={p.lng} title={p.project_name} height={200} style={{ borderRadius: 0 }} />
                      ) : (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>📍 Map not available</div>
                      )}
                    </div>

                    {/* Video — native player */}
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                      {p.video_url ? (
                        <div style={{ height: 200, position: 'relative', overflow: 'hidden', background: '#000' }}>
                          <video src={p.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls preload="metadata" />
                        </div>
                      ) : (
                        <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, gap: 4 }}>
                          <span style={{ fontSize: 24 }}>🎬</span>
                          Video coming soon
                        </div>
                      )}
                    </div>

                    {/* Site Office & Viewing */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#FACC15', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Site Office</div>

                      {office.address && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, lineHeight: 1.4 }}>📍 {office.address}</div>}

                      {office.hours && (
                        <div style={{ marginBottom: 8 }}>
                          {office.hours.weekdays && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', justifyContent: 'space-between' }}><span>Mon-Fri</span><span style={{ color: '#8DC63F', fontWeight: 700 }}>{office.hours.weekdays}</span></div>}
                          {office.hours.saturday && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', justifyContent: 'space-between' }}><span>Saturday</span><span style={{ color: '#8DC63F', fontWeight: 700 }}>{office.hours.saturday}</span></div>}
                          {office.hours.sunday && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', justifyContent: 'space-between' }}><span>Sunday</span><span style={{ color: office.hours.sunday === 'Closed' ? '#EF4444' : '#8DC63F', fontWeight: 700 }}>{office.hours.sunday}</span></div>}
                        </div>
                      )}

                      {/* Viewing days dots */}
                      {schedule.days && (
                        <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                          {ALL_DAYS.map(d => (
                            <div key={d} style={{ width: 28, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, background: schedule.days.includes(d) ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.02)', color: schedule.days.includes(d) ? '#8DC63F' : 'rgba(255,255,255,0.15)', border: schedule.days.includes(d) ? '1px solid rgba(141,198,63,0.25)' : '1px solid rgba(255,255,255,0.04)' }}>{DAY_LABELS[d]}</div>
                          ))}
                        </div>
                      )}

                      {schedule.notes && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>{schedule.notes}</div>}

                      {p.contact_whatsapp && (
                        <a href={`https://wa.me/${p.contact_whatsapp.replace(/^0/, '62')}?text=${encodeURIComponent(`Hi, I'd like to book a site visit for ${p.project_name}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginTop: 6 }}><img src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png?updatedAt=1777539531358" alt="Book Site Visit" style={{ height: 32, objectFit: 'contain' }} /></a>
                      )}
                    </div>
                  </div>

                  {/* Running text — developer bio */}
                  {(p.description || p.developer_name) && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '8px 0', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ display: 'flex', animation: 'npMarquee 20s linear infinite', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', paddingRight: 60 }}>{p.developer_name} — {p.description || `Premium development in ${p.city}`}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', paddingRight: 60 }}>{p.developer_name} — {p.description || `Premium development in ${p.city}`}</span>
                      </div>
                    </div>
                  )}

                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>No projects found</div>}
      </div>
    </div>
  )
}
