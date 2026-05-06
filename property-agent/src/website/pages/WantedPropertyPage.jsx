/**
 * WantedPropertyPage — Buyers submit property requirements,
 * agents respond with matching listings. Form displayed inline on page.
 */
import { useState, useEffect } from 'react'
import { getWantedProperties, fmtBudget, TIMELINE_OPTIONS, PURPOSE_OPTIONS, createWantedProperty } from '@/services/wantedPropertyService'
import { ScrollReveal } from '../hooks/useScrollReveal'

const glass = { background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }
const PROPERTY_TYPES = ['House', 'Villa', 'Apartment', 'Condominium', 'Townhouse', 'Studio', 'Kos', 'Room', 'Penthouse', 'Ruko', 'Office', 'Gudang', 'Tanah']
const inp = { width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none' }

function fmtRp(n) {
  if (!n) return '—'
  if (n >= 1e12) return `Rp ${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

/* ── Wanted Card — premium design ── */
function WantedCard({ req, isAgent, onRespond }) {
  const timeline = TIMELINE_OPTIONS.find(t => t.id === req.timeline)
  const purpose = PURPOSE_OPTIONS.find(p => p.id === req.purpose)
  const typeIcons = { House: '🏠', Villa: '🏡', Apartment: '🏢', Kos: '🏘️', Tanah: '🌍', Ruko: '🏪', Gudang: '📦', Room: '🚪', Studio: '🎨', Penthouse: '🏙️', Condominium: '🏢', Townhouse: '🏘️', Office: '💼' }
  const isBuy = req.listing_type === 'buy'
  return (
    <div style={{ ...glass, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }} className="ws-card">
      {/* Gradient header with type icon */}
      <div style={{ padding: '16px 18px 14px', background: isBuy ? 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(250,204,21,0.02))' : 'linear-gradient(135deg, rgba(141,198,63,0.08), rgba(141,198,63,0.02))', borderBottom: `1px solid ${isBuy ? 'rgba(250,204,21,0.1)' : 'rgba(141,198,63,0.1)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: isBuy ? 'rgba(250,204,21,0.1)' : 'rgba(141,198,63,0.1)', border: `1px solid ${isBuy ? 'rgba(250,204,21,0.2)' : 'rgba(141,198,63,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{typeIcons[req.property_type] || '🏠'}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{req.property_type} <span style={{ fontWeight: 700, color: isBuy ? '#FACC15' : '#8DC63F' }}>· {isBuy ? 'Purchase' : 'Rental'}</span></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{req.location}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {timeline && <div style={{ fontSize: 12, fontWeight: 800, color: timeline.color }}>{timeline.label}</div>}
            {req.buyer_verified && <div style={{ fontSize: 10, fontWeight: 700, color: '#8DC63F', marginTop: 2 }}>Verified Buyer</div>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px 16px' }}>
        {/* Budget */}
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 6 }}>Budget Range</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(req.budget_min)}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', padding: '0 8px' }}>—</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(req.budget_max)}</span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginTop: 8 }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #8DC63F, #FACC15)', width: '100%' }} />
          </div>
        </div>

        {/* Specs row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {req.bedrooms && <span style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{req.bedrooms} Bed</span>}
          {req.bathrooms && <span style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{req.bathrooms} Bath</span>}
          {req.land_area_min && <span style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{req.land_area_min}+ m²</span>}
          {purpose && <span style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>{purpose.label}</span>}
        </div>

        {/* Requirements quote */}
        {req.requirements && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid rgba(141,198,63,0.3)', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{req.requirements}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{(req.anonymous ? '?' : (req.buyer_name || 'B')[0]).toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{req.anonymous ? 'Anonymous' : req.buyer_name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{req.responses_count || 0} responses {req.buyer_verified ? '· Verified' : ''}</div>
            </div>
          </div>
          {isAgent && <button onClick={() => onRespond?.(req)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Respond</button>}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE — form inline, not modal
   ═══════════════════════════════════════════════════════════════════════ */
export default function WantedPropertyPage({ onBack }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterListingType, setFilterListingType] = useState('')
  const [filterTimeline, setFilterTimeline] = useState('')
  const [searchLoc, setSearchLoc] = useState('')

  // Form state
  const [type, setType] = useState('House')
  const [listingType, setListingType] = useState('buy')
  const [location, setLocation] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [purpose, setPurpose] = useState('personal')
  const [timeline, setTimeline] = useState('within_3_months')
  const [requirements, setRequirements] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const user = (() => { try { return JSON.parse(localStorage.getItem('indoo_web_user')) } catch { return null } })()
  const isAgent = user?.accountType === 'agent'
  const isLand = type === 'Tanah'

  useEffect(() => { loadRequests() }, [filterType, filterListingType, filterTimeline])

  async function loadRequests() {
    setLoading(true)
    const filters = {}
    if (filterType) filters.property_type = filterType
    if (filterListingType) filters.listing_type = filterListingType
    if (filterTimeline) filters.timeline = filterTimeline
    if (searchLoc) filters.location = searchLoc
    const data = await getWantedProperties(filters)
    setRequests(data)
    setLoading(false)
  }

  async function handleSubmit() {
    if (!location || !budgetMin) return
    setSubmitting(true)
    await createWantedProperty({
      property_type: type, listing_type: listingType, location,
      budget_min: Number(budgetMin.replace(/\./g, '')), budget_max: Number((budgetMax || budgetMin).replace(/\./g, '')),
      bedrooms: isLand ? null : bedrooms, bathrooms: isLand ? null : bathrooms,
      purpose, timeline, requirements, anonymous,
      buyer_name: user?.name || 'Buyer', buyer_id: user?.id, buyer_verified: !!user?.phone,
    })
    setSubmitting(false)
    setSubmitted(true)
    loadRequests()
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">

        {/* Hero */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Property Requirements</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>Submit your property criteria and let verified agents match you with suitable listings. Every enquiry is reviewed and responded to directly.</p>
            {onBack && <button onClick={onBack} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>}
          </div>
        </ScrollReveal>

        {/* ═══ 2-COLUMN: Form left + Requests right ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Enquiry Form (inline on page) ── */}
          <ScrollReveal>
            <div style={{ position: 'sticky', top: 80, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Submit Your Requirements</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Our agents will review and respond within 24 hours</div>

              {/* Property Type */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Property Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {PROPERTY_TYPES.map(t => (
                  <button key={t} onClick={() => setType(t)} style={{ padding: '6px 12px', borderRadius: 8, border: type === t ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.06)', background: type === t ? 'rgba(141,198,63,0.1)' : 'transparent', color: type === t ? '#8DC63F' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
                ))}
              </div>

              {/* Buy / Rent */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {['buy', 'rent'].map(lt => (
                  <button key={lt} onClick={() => setListingType(lt)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: listingType === lt ? `1.5px solid ${lt === 'buy' ? '#FACC15' : '#8DC63F'}` : '1.5px solid rgba(255,255,255,0.06)', background: listingType === lt ? (lt === 'buy' ? 'rgba(250,204,21,0.06)' : 'rgba(141,198,63,0.06)') : 'transparent', color: listingType === lt ? (lt === 'buy' ? '#FACC15' : '#8DC63F') : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{lt === 'buy' ? 'Purchase' : 'Rental'}</button>
                ))}
              </div>

              {/* Location */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase' }}>Preferred Location</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Canggu, Bali" style={{ ...inp, flex: 1 }} />
                <button onClick={() => { setLocation('Detecting...'); navigator.geolocation.getCurrentPosition(async (pos) => { try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`); const d = await r.json(); setLocation([d.address?.city, d.address?.town, d.address?.village, d.address?.state].filter(Boolean).slice(0, 2).join(', ') || 'Location set') } catch { setLocation('') } }, () => setLocation('')) }} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(141,198,63,0.2)', background: 'rgba(141,198,63,0.06)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>GPS</button>
              </div>

              {/* Budget */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase' }}>Budget Range (Rp)</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
                <input value={budgetMin} onChange={e => setBudgetMin(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Minimum" style={{ ...inp, flex: 1 }} inputMode="text" />
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>—</span>
                <input value={budgetMax} onChange={e => setBudgetMax(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Maximum" style={{ ...inp, flex: 1 }} inputMode="text" />
              </div>

              {/* Beds/Baths */}
              {!isLand && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase' }}>Bedrooms</div>
                    <input value={bedrooms} onChange={e => setBedrooms(e.target.value)} placeholder="e.g. 3" style={inp} inputMode="numeric" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase' }}>Bathrooms</div>
                    <input value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="e.g. 2" style={inp} inputMode="numeric" />
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Purpose</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {PURPOSE_OPTIONS.map(p => (
                  <button key={p.id} onClick={() => setPurpose(p.id)} style={{ padding: '6px 12px', borderRadius: 8, border: purpose === p.id ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.06)', background: purpose === p.id ? 'rgba(141,198,63,0.08)' : 'transparent', color: purpose === p.id ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{p.label}</button>
                ))}
              </div>

              {/* Timeline */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Timeline</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {TIMELINE_OPTIONS.map(t => (
                  <button key={t.id} onClick={() => setTimeline(t.id)} style={{ padding: '6px 12px', borderRadius: 8, border: timeline === t.id ? `1.5px solid ${t.color}` : '1.5px solid rgba(255,255,255,0.06)', background: timeline === t.id ? `${t.color}12` : 'transparent', color: timeline === t.id ? t.color : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t.label}</button>
                ))}
              </div>

              {/* Requirements */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase' }}>Additional Requirements</div>
              <textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Describe any specific features, preferences, or conditions..." style={{ ...inp, resize: 'none', minHeight: 70, marginBottom: 14 }} />

              {/* Anonymous */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Submit anonymously</span>
                <div onClick={() => setAnonymous(!anonymous)} style={{ width: 40, height: 22, borderRadius: 11, background: anonymous ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.06)', border: anonymous ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.06)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: anonymous ? '#8DC63F' : 'rgba(255,255,255,0.3)', position: 'absolute', top: 2, left: anonymous ? 20 : 2, transition: 'all 0.2s' }} />
                </div>
              </div>

              {/* Submit */}
              {submitted ? (
                <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Enquiry Submitted</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Our agents will review your requirements shortly</div>
                </div>
              ) : (
                <button onClick={handleSubmit} disabled={!location || !budgetMin || submitting} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: (!location || !budgetMin) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: (!location || !budgetMin) ? 'rgba(255,255,255,0.2)' : '#000', fontSize: 14, fontWeight: 900, cursor: (!location || !budgetMin) ? 'default' : 'pointer', fontFamily: 'inherit' }}>{submitting ? 'Submitting...' : 'Submit Enquiry'}</button>
              )}
            </div>
          </ScrollReveal>

          {/* ── RIGHT: Active Requests ── */}
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { val: requests.length, label: 'Active', color: '#8DC63F' },
                { val: requests.filter(r => r.timeline === 'buying_now').length, label: 'Urgent', color: '#EF4444' },
                { val: requests.filter(r => r.buyer_verified).length, label: 'Verified', color: '#FACC15' },
                { val: requests.reduce((s, r) => s + (r.responses_count || 0), 0), label: 'Responses', color: '#60A5FA' },
              ].map(s => (
                <div key={s.label} style={{ ...glass, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <input value={searchLoc} onChange={e => setSearchLoc(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadRequests()} placeholder="Filter location..." style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none', minWidth: 140 }} />
              {['', 'buy', 'rent'].map(lt => (
                <button key={lt} onClick={() => setFilterListingType(lt)} style={{ padding: '7px 12px', borderRadius: 7, border: filterListingType === lt ? '1px solid #8DC63F' : '1px solid rgba(255,255,255,0.06)', background: filterListingType === lt ? 'rgba(141,198,63,0.08)' : 'transparent', color: filterListingType === lt ? '#8DC63F' : 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{lt === '' ? 'All' : lt === 'buy' ? 'Buy' : 'Rent'}</button>
              ))}
            </div>

            {/* Requests Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Loading...</div>
            ) : requests.length === 0 ? (
              <div style={{ ...glass, textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>No active enquiries</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Submit your requirements to get started</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {requests.map(req => (
                  <WantedCard key={req.id} req={req} isAgent={isAgent} onRespond={(r) => alert(`Respond to ${r.buyer_name}'s request`)} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
