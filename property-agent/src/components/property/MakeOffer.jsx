/**
 * MakeOffer — Compact offer strip that sits under the property thumbnail.
 * Shows header + amount input + "Make Offer" button.
 * Expands down for name + WhatsApp only when button is clicked.
 */
import { useState, useMemo, useCallback } from 'react'
import { createOffer, fmtOffer, offerStrength } from '@/services/offerService'

function parseNum(str) { return str ? Number(String(str).replace(/\./g, '')) : 0 }
function formatDots(val) { const d = String(val).replace(/[^0-9.]/g, '').replace(/\./g, ''); return d ? Number(d).toLocaleString('id-ID').replace(/,/g, '.') : '' }
function getUser() { try { return JSON.parse(localStorage.getItem('indoo_web_user')) || {} } catch { return {} } }

export default function MakeOffer({ listing, onOfferMade, viewingSchedule, officeHours }) {
  const user = useMemo(() => getUser(), [])
  const offerType = listing?.buy_now ? 'buy' : 'rent'
  const listedPrice = offerType === 'buy' ? (typeof listing?.buy_now === 'object' ? listing.buy_now.price : listing?.buy_now) : listing?.price_month
  const offersEnabled = listing?.offers_enabled !== false

  const [amount, setAmount] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState(user.name || '')
  const [phonePrefix, setPhonePrefix] = useState('+62')
  const [phone, setPhone] = useState(user.phone ? user.phone.replace(/^\+?62/, '') : '')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const numericAmount = parseNum(amount)
  const strength = useMemo(() => offerStrength(numericAmount, listedPrice), [numericAmount, listedPrice])

  const minPrice = listing?.min_accepted_price || listing?.extra_fields?.min_accepted_price
  const minHint = useMemo(() => {
    if (!minPrice || !listedPrice) return null
    const pct = Math.round((minPrice / parseNum(listedPrice)) * 100)
    return { formatted: fmtOffer(minPrice), pct }
  }, [minPrice, listedPrice])

  const handleSubmit = async () => {
    if (!numericAmount || !name.trim() || !phone.trim()) return
    setSubmitting(true)
    try {
      const result = await createOffer({
        listing_id: listing.id, listing_title: listing.title, listing_price: listedPrice,
        offer_amount: numericAmount, offer_type: offerType,
        buyer_name: name.trim(), buyer_phone: `${phonePrefix}${phone.trim()}`, buyer_id: user.id || null,
      })
      setSuccess(true)
      onOfferMade?.(result)
    } catch {}
    setSubmitting(false)
  }

  if (!listing || !offersEnabled) return null

  if (success) {
    return (
      <div style={{ background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>Offer Submitted</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>The seller will contact you via WhatsApp</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(250,204,21,0.15)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header strip */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>Make an Offer</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Listed: {fmtOffer(listedPrice)}</span>
      </div>

      {/* Amount + Button row */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', padding: '0 10px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F', marginRight: 6 }}>Rp</span>
          <input value={amount} onChange={e => setAmount(formatDots(e.target.value))} placeholder="e.g. 2.500.000.000" inputMode="text" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontWeight: 700, padding: '10px 0', fontFamily: 'inherit' }} />
        </div>
        <button onClick={() => { if (!expanded && numericAmount > 0) setExpanded(true); else if (expanded) handleSubmit() }} disabled={!numericAmount || submitting} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: numericAmount > 0 ? 'linear-gradient(135deg, #FACC15, #F59E0B)' : 'rgba(255,255,255,0.06)', color: numericAmount > 0 ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 900, cursor: numericAmount > 0 ? 'pointer' : 'default', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{expanded ? (submitting ? 'Sending...' : 'Submit') : 'Make Offer'}</button>
      </div>

      {/* Strength indicator */}
      {numericAmount > 0 && (
        <div style={{ padding: '0 14px 6px' }}>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginBottom: 3 }}>
            <div style={{ height: '100%', width: `${Math.min(strength.pct, 100)}%`, borderRadius: 2, background: strength.color, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700 }}>
            <span style={{ color: strength.color }}>{strength.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>{strength.pct}% of listed</span>
          </div>
        </div>
      )}

      {/* Min accepted hint */}
      {minHint && !expanded && (
        <div style={{ padding: '0 14px 8px', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Offers from {minHint.formatted} considered</div>
      )}

      {/* Expanded: Name + WhatsApp with country prefix */}
      {expanded && (
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>Name</div>
            <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>WhatsApp</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none' }} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <select value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRight: '1px solid rgba(255,255,255,0.08)', color: '#8DC63F', fontSize: 12, fontWeight: 700, padding: '10px 4px 10px 8px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', width: 58, textAlign: 'center' }}>
                {['+62','+1','+44','+61','+65','+86','+971','+81','+60','+82','+49','+33','+31','+46'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="812345678" type="tel" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 10px', fontFamily: 'inherit' }} />
            </div>
          </div>
        </div>
      )}

      {/* Viewing Times — inside same container */}
      {(() => {
        const vs = viewingSchedule || { days: ['mon','tue','wed','thu','fri','sat'], morning: true, afternoon: true, evening: false }
        const oh = officeHours || { weekdays: '09:00 - 17:00', saturday: '09:00 - 14:00', sunday: 'Closed' }
        const now = new Date()
        const dayIdx = now.getDay()
        const hour = now.getHours()
        const isAvailable = (dayIdx >= 1 && dayIdx <= 5 && hour >= 9 && hour < 17) || (dayIdx === 6 && hour >= 9 && hour < 14)
        const dayLabels = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' }
        const allDays = ['mon','tue','wed','thu','fri','sat','sun']
        return (
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>Viewing Times</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: isAvailable ? '#8DC63F' : 'rgba(255,255,255,0.25)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: isAvailable ? '#8DC63F' : 'rgba(255,255,255,0.15)', boxShadow: isAvailable ? '0 0 6px #8DC63F' : 'none' }} />{isAvailable ? 'Available Now' : 'Offline'}</span>
            </div>
            <div style={{ display: 'flex', gap: 2, marginBottom: 5 }}>
              {allDays.map(d => <div key={d} style={{ flex: 1, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, background: vs.days?.includes(d) ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.02)', color: vs.days?.includes(d) ? '#8DC63F' : 'rgba(255,255,255,0.1)', border: vs.days?.includes(d) ? '1px solid rgba(141,198,63,0.2)' : '1px solid rgba(255,255,255,0.03)' }}>{dayLabels[d]}</div>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              <span>Mon-Fri <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{oh.weekdays}</span></span>
              <span>Sat <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{oh.saturday}</span></span>
              <span>Sun <span style={{ color: oh.sunday === 'Closed' ? '#EF4444' : 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{oh.sunday}</span></span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
