/**
 * NewProjectListingForm — Multi-step form for developers to list new projects.
 * Step 1: Project info → Step 2: Unit types → Step 3: Media → Step 4: Payment + brochure → Step 5: Publish
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createProject } from '@/services/newProjectService'
import { useGeolocation } from '@/hooks/useGeolocation'
import IndooFooter from '@/components/ui/IndooFooter'

const BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2007_44_48%20PM.png'
const glass = { background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }
const inp = { width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box', background: 'rgba(0,0,0,0.6)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none' }
const lbl = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }

const STATUS_OPTIONS = [
  { id: 'pre_sale', label: 'Pre-Sale', icon: '📋' },
  { id: 'construction', label: 'Under Construction', icon: '🏗️' },
  { id: 'topping_off', label: 'Topping Off', icon: '🏢' },
  { id: 'finishing', label: 'Finishing', icon: '🎨' },
  { id: 'ready', label: 'Ready to Move', icon: '✅' },
]

const AMENITY_OPTIONS = [
  'Swimming Pool', 'Gym', 'Security 24h', 'Garden', 'Playground', 'Mosque', 'Jogging Track',
  'Clubhouse', 'Co-working', 'Rooftop', 'Parking', 'CCTV', 'Concierge', 'Laundry',
  'BBQ Area', 'Yoga Deck', 'Tennis Court', 'Basketball Court', 'Mini Market', 'Café',
]

function fmtRp(n) { return n ? `Rp ${Number(n).toLocaleString('id-ID')}` : '' }

export default function NewProjectListingForm({ open, onClose }) {
  const { coords } = useGeolocation()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const imgRef = useRef(null)

  // Step 1: Project Info
  const [projectName, setProjectName] = useState('')
  const [developerName, setDeveloperName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('Yogyakarta')
  const [useGps, setUseGps] = useState(false)
  const [status, setStatus] = useState('pre_sale')
  const [completionDate, setCompletionDate] = useState('')
  const [totalUnits, setTotalUnits] = useState('')

  // Step 2: Units
  const [units, setUnits] = useState([{ type: '', bedrooms: '2', bathrooms: '1', area_sqm: '', price: '', available_count: '' }])

  // Step 3: Media
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [videoUrl, setVideoUrl] = useState('')

  // Step 4: Payment + Contact
  const [paymentSchedule, setPaymentSchedule] = useState('')
  const [amenities, setAmenities] = useState([])
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')

  if (!open) return null

  const addUnit = () => setUnits([...units, { type: '', bedrooms: '2', bathrooms: '1', area_sqm: '', price: '', available_count: '' }])
  const updateUnit = (i, field, val) => { const u = [...units]; u[i] = { ...u[i], [field]: val }; setUnits(u) }
  const removeUnit = (i) => setUnits(units.filter((_, idx) => idx !== i))

  const handleImages = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(f => {
      setImages(prev => [...prev, f])
      setImagePreviews(prev => [...prev, URL.createObjectURL(f)])
    })
  }

  const toggleAmenity = (a) => setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  const canNext = () => {
    if (step === 1) return projectName.trim() && developerName.trim() && (location.trim() || useGps) && completionDate.trim()
    if (step === 2) return units.length > 0 && units[0].type.trim() && units[0].price
    if (step === 3) return true
    if (step === 4) return whatsapp.trim()
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const prices = units.map(u => Number(String(u.price).replace(/\D/g, ''))).filter(Boolean)
    await createProject({
      project_name: projectName,
      developer_name: developerName,
      description,
      location: useGps && coords ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : location,
      city,
      lat: useGps && coords ? coords.lat : null,
      lng: useGps && coords ? coords.lng : null,
      status,
      completion_date: completionDate,
      total_units: Number(totalUnits) || units.reduce((s, u) => s + (Number(u.available_count) || 0), 0),
      units: units.map(u => ({
        type: u.type, bedrooms: Number(u.bedrooms), bathrooms: Number(u.bathrooms),
        area_sqm: Number(u.area_sqm), price: Number(String(u.price).replace(/\D/g, '')),
        available_count: Number(u.available_count) || 0,
      })),
      amenities,
      payment_schedule: paymentSchedule,
      video_url: videoUrl || null,
      contact_whatsapp: whatsapp,
      contact_email: email,
      website: website || null,
      instagram: instagram || null,
      min_price: prices.length ? Math.min(...prices) : 0,
      max_price: prices.length ? Math.max(...prices) : 0,
    })
    setSubmitting(false)
    setSuccess(true)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: `#0a0a0a url("${BG}") center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 16px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>🏗️ List <span style={{ color: '#FACC15' }}>New Project</span></h1>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
          {step === 1 ? 'Project details' : step === 2 ? 'Unit types & pricing' : step === 3 ? 'Photos & video' : step === 4 ? 'Payment & contact' : 'Review'}
        </p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px 12px' }}>
        {[1,2,3,4,5].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? '#FACC15' : 'rgba(255,255,255,0.08)' }} />)}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>

        {/* ═══ SUCCESS ═══ */}
        {success && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '3px solid #8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>Project Listed!</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', maxWidth: 280, lineHeight: 1.5 }}>
              Your project "{projectName}" is now visible to thousands of potential buyers on INDOO.
            </p>
            <button onClick={onClose} style={{ padding: '14px 40px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>Done</button>
          </div>
        )}

        {/* ═══ STEP 1: Project Info ═══ */}
        {!success && step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Project Name *</label>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Grand Citra Residence" style={inp} />
            </div>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Developer / Company Name *</label>
              <input value={developerName} onChange={e => setDeveloperName(e.target.value)} placeholder="e.g. Ciputra Group" style={inp} />
            </div>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell buyers about your project..." rows={3} style={{ ...inp, resize: 'none', minHeight: 70 }} />
            </div>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Location *</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => setUseGps(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', background: !useGps ? 'rgba(250,204,21,0.12)' : 'rgba(0,0,0,0.4)', border: !useGps ? '1.5px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.08)', color: !useGps ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>📝 Address</button>
                <button onClick={() => setUseGps(true)} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', background: useGps ? 'rgba(250,204,21,0.12)' : 'rgba(0,0,0,0.4)', border: useGps ? '1.5px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.08)', color: useGps ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>📍 GPS</button>
              </div>
              {!useGps && <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Full project address" style={inp} />}
              {useGps && coords && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', fontSize: 13, color: '#FACC15', fontWeight: 700 }}>✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ ...glass, padding: 14, flex: 1 }}>
                <label style={lbl}>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} style={inp} />
              </div>
              <div style={{ ...glass, padding: 14, flex: 1 }}>
                <label style={lbl}>Total Units</label>
                <input value={totalUnits} onChange={e => setTotalUnits(e.target.value)} type="number" placeholder="e.g. 50" style={inp} />
              </div>
            </div>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Project Status *</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s.id} onClick={() => setStatus(s.id)} style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                    background: status === s.id ? 'rgba(250,204,21,0.12)' : 'rgba(0,0,0,0.4)',
                    border: status === s.id ? '1.5px solid rgba(250,204,21,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    color: status === s.id ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700,
                  }}>{s.icon} {s.label}</button>
                ))}
              </div>
            </div>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Completion Date *</label>
              <input value={completionDate} onChange={e => setCompletionDate(e.target.value)} placeholder="e.g. 2027-Q2" style={inp} />
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Unit Types ═══ */}
        {!success && step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {units.map((u, i) => (
              <div key={i} style={{ ...glass, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>Unit {i + 1}</span>
                  {units.length > 1 && <button onClick={() => removeUnit(i)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>}
                </div>
                <label style={lbl}>Type Name *</label>
                <input value={u.type} onChange={e => updateUnit(i, 'type', e.target.value)} placeholder="e.g. Type 45/90 or Villa A — 2BR Pool" style={{ ...inp, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}><label style={lbl}>Beds</label><input value={u.bedrooms} onChange={e => updateUnit(i, 'bedrooms', e.target.value)} type="number" style={inp} /></div>
                  <div style={{ flex: 1 }}><label style={lbl}>Baths</label><input value={u.bathrooms} onChange={e => updateUnit(i, 'bathrooms', e.target.value)} type="number" style={inp} /></div>
                  <div style={{ flex: 1 }}><label style={lbl}>m²</label><input value={u.area_sqm} onChange={e => updateUnit(i, 'area_sqm', e.target.value)} type="number" style={inp} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 2 }}><label style={lbl}>Price (Rp) *</label><input value={u.price} onChange={e => updateUnit(i, 'price', e.target.value)} placeholder="e.g. 650000000" style={inp} /></div>
                  <div style={{ flex: 1 }}><label style={lbl}>Available</label><input value={u.available_count} onChange={e => updateUnit(i, 'available_count', e.target.value)} type="number" style={inp} /></div>
                </div>
              </div>
            ))}
            <button onClick={addUnit} style={{ padding: '14px', borderRadius: 14, border: '2px dashed rgba(250,204,21,0.3)', background: 'rgba(250,204,21,0.04)', color: '#FACC15', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Unit Type</button>
          </div>
        )}

        {/* ═══ STEP 3: Media ═══ */}
        {!success && step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Project Photos</label>
              <button onClick={() => imgRef.current?.click()} style={{
                width: '100%', height: 120, borderRadius: 14, border: '2px dashed rgba(250,204,21,0.3)',
                background: 'rgba(0,0,0,0.4)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
                color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700,
              }}>📷 Upload photos<span style={{ fontSize: 11 }}>Recommended: 1200×800px landscape</span></button>
              <input ref={imgRef} type="file" accept="image/*" multiple onChange={handleImages} style={{ display: 'none' }} />
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
                  {imagePreviews.map((p, i) => (
                    <img key={i} src={p} alt="" style={{ width: 80, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Video URL (YouTube / drone footage)</label>
              <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={inp} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Drone footage or walkthrough video of the project site</div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Payment + Contact ═══ */}
        {!success && step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Payment Schedule</label>
              <textarea value={paymentSchedule} onChange={e => setPaymentSchedule(e.target.value)} placeholder="e.g. Booking Rp 5M → DP 20% (3x) → KPR/Cash" rows={3} style={{ ...inp, resize: 'none', minHeight: 70 }} />
            </div>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Amenities</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AMENITY_OPTIONS.map(a => (
                  <button key={a} onClick={() => toggleAmenity(a)} style={{
                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    background: amenities.includes(a) ? 'rgba(141,198,63,0.12)' : 'rgba(0,0,0,0.4)',
                    border: amenities.includes(a) ? '1.5px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    color: amenities.includes(a) ? '#8DC63F' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700,
                  }}>{a}</button>
                ))}
              </div>
            </div>
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>WhatsApp Contact *</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="081234567890" type="tel" style={{ ...inp, marginBottom: 8 }} />
              <label style={lbl}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="sales@company.com" type="email" style={{ ...inp, marginBottom: 8 }} />
              <label style={lbl}>Website</label>
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.company.com" style={{ ...inp, marginBottom: 8 }} />
              <label style={lbl}>Instagram</label>
              <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@companyname" style={inp} />
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Review ═══ */}
        {!success && step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...glass, padding: 16, fontSize: 13 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginBottom: 12 }}>Review Your Project</div>
              {[
                ['Project', projectName],
                ['Developer', developerName],
                ['Location', useGps ? 'GPS Location' : location],
                ['Status', STATUS_OPTIONS.find(s => s.id === status)?.label],
                ['Completion', completionDate],
                ['Units', `${units.length} type${units.length > 1 ? 's' : ''} · ${totalUnits || units.reduce((s,u) => s + (Number(u.available_count)||0), 0)} total`],
                ['Price Range', `${fmtRp(Math.min(...units.map(u => Number(String(u.price).replace(/\D/g,''))).filter(Boolean)))} — ${fmtRp(Math.max(...units.map(u => Number(String(u.price).replace(/\D/g,''))).filter(Boolean)))}`],
                ['Amenities', amenities.length ? amenities.join(', ') : '—'],
                ['WhatsApp', whatsapp],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                  <span style={{ color: '#fff', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={submitting} style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #FACC15, #F59E0B)',
              color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(250,204,21,0.3)',
            }}>{submitting ? 'Publishing...' : '🏗️ Publish Project'}</button>
          </div>
        )}
      </div>

      {/* Nav */}
      {!success && (
        <div style={{ flexShrink: 0, padding: '10px 16px 20px', display: 'flex', gap: 10 }}>
          {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
          {step < 5 && <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{
            flex: 2, padding: '14px 0', borderRadius: 14, border: 'none',
            background: canNext() ? 'linear-gradient(135deg, #FACC15, #F59E0B)' : 'rgba(255,255,255,0.06)',
            color: canNext() ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 900,
            cursor: canNext() ? 'pointer' : 'default', fontFamily: 'inherit',
          }}>Next →</button>}
        </div>
      )}

      {success && <IndooFooter label="New Project" onHome={onClose} />}
    </div>,
    document.body
  )
}
