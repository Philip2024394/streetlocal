/**
 * WantedPropertyForm — Modal form for buyers to post what property they are looking for.
 * Dark glass theme with green #8DC63F accents.
 */
import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createWantedProperty, TIMELINE_OPTIONS, PURPOSE_OPTIONS } from '@/services/wantedPropertyService'

// ── Constants ──

const PROPERTY_TYPES = ['House', 'Villa', 'Apartment', 'Kos', 'Tanah', 'Ruko', 'Gudang', 'Pabrik', 'Room', 'Studio']
const LAND_ONLY_TYPES = ['Tanah']
const NO_BEDROOM_TYPES = ['Tanah', 'Gudang', 'Pabrik', 'Ruko']

const GREEN = '#8DC63F'

// ── Shared inline styles ──

const overlay = {
  position: 'fixed', inset: 0, zIndex: 99999,
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
}

const card = {
  width: '100%', maxWidth: 560, maxHeight: '92vh',
  overflowY: 'auto', borderRadius: 18,
  background: 'rgba(20,20,20,0.88)',
  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '28px 24px 24px', color: '#fff',
}

const sectionHeader = {
  fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
  marginBottom: 10, marginTop: 22,
}

const pillBase = {
  padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
  border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer',
  transition: 'all 0.15s ease', minHeight: 44,
}

const pillInactive = {
  ...pillBase,
  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
}

const pillActive = {
  ...pillBase,
  background: GREEN, color: '#fff', borderColor: GREEN,
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14,
  background: 'rgba(255,255,255,0.06)', color: '#fff',
  border: '1px solid rgba(255,255,255,0.10)', outline: 'none',
  minHeight: 44,
}

const pillRow = {
  display: 'flex', flexWrap: 'wrap', gap: 8,
}

// ── Helpers ──

function formatRpDots(value) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseRpDots(formatted) {
  return Number(formatted.replace(/\./g, '')) || 0
}

// ── Sub-components ──

function SectionLabel({ children }) {
  return <div style={sectionHeader}>{children}</div>
}

function Pill({ active, onClick, children, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...(active ? pillActive : pillInactive), ...style }}
    >
      {children}
    </button>
  )
}

function TimelinePill({ active, onClick, children, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...pillBase,
        background: active ? color : 'rgba(255,255,255,0.06)',
        color: active ? '#fff' : 'rgba(255,255,255,0.7)',
        borderColor: active ? color : 'rgba(255,255,255,0.10)',
      }}
    >
      {children}
    </button>
  )
}

// ── Main Component ──

export default function WantedPropertyForm({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    property_type: '',
    listing_type: 'buy',
    location: '',
    budget_min: '',
    budget_max: '',
    bedrooms: '',
    bathrooms: '',
    land_area_min: '',
    purpose: '',
    timeline: '',
    requirements: '',
    anonymous: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  const set = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }, [])

  const showBedBath = form.property_type && !NO_BEDROOM_TYPES.includes(form.property_type)
  const showLandArea = form.property_type === 'Tanah'

  // GPS detect
  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`
          )
          const data = await res.json()
          const parts = [
            data.address?.suburb || data.address?.village || data.address?.town,
            data.address?.city || data.address?.county,
            data.address?.state,
          ].filter(Boolean)
          set('location', parts.join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } catch {
          const { latitude, longitude } = pos.coords
          set('location', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [set])

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!form.property_type || !form.location) return
    setSubmitting(true)
    try {
      const payload = {
        property_type: form.property_type,
        listing_type: form.listing_type,
        location: form.location,
        budget_min: parseRpDots(form.budget_min),
        budget_max: parseRpDots(form.budget_max),
        bedrooms: showBedBath ? form.bedrooms : null,
        bathrooms: showBedBath ? form.bathrooms : null,
        land_area_min: showLandArea ? form.land_area_min : null,
        purpose: form.purpose,
        timeline: form.timeline,
        requirements: form.requirements,
        anonymous: form.anonymous,
      }
      const result = await createWantedProperty(payload)
      if (onSubmit) onSubmit(result)
      onClose()
    } catch (err) {
      console.error('WantedPropertyForm submit error:', err)
    } finally {
      setSubmitting(false)
    }
  }, [form, showBedBath, showLandArea, onSubmit, onClose])

  if (!open) return null

  return createPortal(
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={card}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>Post Property Request</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Tell agents what you need</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* 1. Property Type */}
        <SectionLabel>Property Type</SectionLabel>
        <div style={pillRow}>
          {PROPERTY_TYPES.map(t => (
            <Pill key={t} active={form.property_type === t} onClick={() => set('property_type', t)}>{t}</Pill>
          ))}
        </div>

        {/* 2. Buy or Rent */}
        <SectionLabel>Buy or Rent</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <Pill active={form.listing_type === 'buy'} onClick={() => set('listing_type', 'buy')}>Buy</Pill>
          <Pill active={form.listing_type === 'rent'} onClick={() => set('listing_type', 'rent')}>Rent</Pill>
        </div>

        {/* 3. Location */}
        <SectionLabel>Location</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="e.g. Canggu, Bali"
            value={form.location}
            onChange={e => set('location', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={detectGPS}
            disabled={gpsLoading}
            style={{
              ...pillBase, background: 'rgba(255,255,255,0.08)', color: GREEN,
              borderColor: 'rgba(255,255,255,0.10)', display: 'flex',
              alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 13,
            }}
          >
            {gpsLoading ? '...' : '📍 GPS'}
          </button>
        </div>

        {/* 4. Budget Range */}
        <SectionLabel>Budget Range</SectionLabel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Min"
              value={form.budget_min}
              onChange={e => set('budget_min', formatRpDots(e.target.value))}
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>—</span>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Max"
              value={form.budget_max}
              onChange={e => set('budget_max', formatRpDots(e.target.value))}
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
          </div>
        </div>

        {/* 5. Bedrooms & Bathrooms — only for non-land types */}
        {showBedBath && (
          <>
            <SectionLabel>Bedrooms</SectionLabel>
            <div style={pillRow}>
              {['1','2','3','4','5','6','7','8','9','10+'].map(n => (
                <Pill key={n} active={form.bedrooms === n} onClick={() => set('bedrooms', n)}>{n}</Pill>
              ))}
            </div>

            <SectionLabel>Bathrooms</SectionLabel>
            <div style={pillRow}>
              {['1','2','3','4','5+'].map(n => (
                <Pill key={n} active={form.bathrooms === n} onClick={() => set('bathrooms', n)}>{n}</Pill>
              ))}
            </div>
          </>
        )}

        {/* 6. Land Area — only for Tanah */}
        {showLandArea && (
          <>
            <SectionLabel>Minimum Land Area (m²)</SectionLabel>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 500"
              value={form.land_area_min}
              onChange={e => set('land_area_min', e.target.value.replace(/\D/g, ''))}
              style={inputStyle}
            />
          </>
        )}

        {/* 7. Purpose */}
        <SectionLabel>Purpose</SectionLabel>
        <div style={pillRow}>
          {PURPOSE_OPTIONS.map(p => (
            <Pill key={p.id} active={form.purpose === p.id} onClick={() => set('purpose', p.id)}>{p.label}</Pill>
          ))}
        </div>

        {/* 8. Timeline Urgency */}
        <SectionLabel>Timeline</SectionLabel>
        <div style={pillRow}>
          {TIMELINE_OPTIONS.map(t => (
            <TimelinePill
              key={t.id}
              active={form.timeline === t.id}
              onClick={() => set('timeline', t.id)}
              color={t.color}
            >
              {t.label}
            </TimelinePill>
          ))}
        </div>

        {/* 9. Requirements */}
        <SectionLabel>Specific Requirements</SectionLabel>
        <textarea
          placeholder="Pool, near school, SHM certificate, quiet area..."
          value={form.requirements}
          onChange={e => set('requirements', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
        />

        {/* 10. Anonymous Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Post Anonymously</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Hide your identity from agents</div>
          </div>
          <button
            type="button"
            onClick={() => set('anonymous', !form.anonymous)}
            style={{
              width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: form.anonymous ? GREEN : 'rgba(255,255,255,0.15)',
              position: 'relative', transition: 'background 0.2s ease',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3,
              left: form.anonymous ? 23 : 3,
              transition: 'left 0.2s ease',
            }} />
          </button>
        </div>

        {/* 11. Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.property_type || !form.location}
          style={{
            width: '100%', marginTop: 24, padding: '16px 0', borderRadius: 14,
            border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            color: '#fff', minHeight: 52,
            background: (!form.property_type || !form.location)
              ? 'rgba(255,255,255,0.10)'
              : `linear-gradient(135deg, ${GREEN}, #6BA332)`,
            opacity: submitting ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {submitting ? 'Posting...' : 'Post Property Request'}
        </button>

      </div>
    </div>,
    document.body
  )
}
