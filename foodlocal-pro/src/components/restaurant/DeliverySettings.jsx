// Delivery Settings — vendor controls the km-based price customers see.
// Default rates mirror GoSend so a vendor that never opens this page
// still gets sane suggestions. Persists to restaurants.delivery_settings.
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const SUGGESTED = {
  gosend:     { label: 'GoSend Instant',    base_fare: 8000,  base_km: 2, per_km: 2500, max_km: 15 },
  grabexpress:{ label: 'GrabExpress',       base_fare: 9000,  base_km: 2, per_km: 3000, max_km: 18 },
  vendor:     { label: 'Own driver',        base_fare: 5000,  base_km: 1, per_km: 4000, max_km: 8 },
  pickup:     { label: 'Pickup only',       base_fare: 0,     base_km: 0, per_km: 0,    max_km: 0 },
}

const DEFAULTS = {
  base_fare:    8000,
  base_km:      2,
  per_km:       3000,
  max_km:       15,
  free_above:   100000,
  weekend_surcharge: 0,
}

const fmtRp = n => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

const card  = { padding: 14, borderRadius: 16, marginBottom: 12, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

export default function DeliverySettings({ restaurant, onBack }) {
  const [s, setS] = useState(DEFAULTS)
  const [msg, setMsg] = useState('')
  const set = (k, v) => setS(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!supabase || !restaurant?.id) return
    let cancelled = false
    supabase.from('restaurants').select('delivery_settings').eq('id', restaurant.id).single()
      .then(({ data }) => {
        if (cancelled || !data?.delivery_settings) return
        setS({ ...DEFAULTS, ...data.delivery_settings })
      }).catch(() => {})
    return () => { cancelled = true }
  }, [restaurant?.id])

  const applyPreset = (preset) => setS(p => ({ ...p, ...preset }))
  const handleSave = async () => {
    if (!supabase || !restaurant?.id) { setMsg('Saved locally.'); setTimeout(() => setMsg(''), 1500); return }
    setMsg('Saving…')
    const { error } = await supabase.from('restaurants').update({ delivery_settings: s }).eq('id', restaurant.id)
    setMsg(error ? `Save failed: ${error.message}` : 'Saved.')
    setTimeout(() => setMsg(''), 1800)
  }

  // Live calculator preview at 1, 3, 5, 10 km
  const priceAt = (km) => {
    if (km > s.max_km) return null
    if (km <= s.base_km) return s.base_fare
    return s.base_fare + Math.ceil(km - s.base_km) * s.per_km
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Delivery Settings</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Per-km delivery pricing</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
          The estimate customers see when ordering. Used by the delivery banner on the menu page. You arrange your own driver — this is just the price you charge the customer for delivery.
        </div>
      </div>

      {/* Quick presets */}
      <div style={card}>
        <span style={label}>Quick presets</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {Object.entries(SUGGESTED).map(([id, p]) => (
            <button key={id} onClick={() => applyPreset(p)} style={{ padding: '12px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontWeight: 900, marginBottom: 2 }}>{p.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                {p.base_fare ? `${fmtRp(p.base_fare)} base · ${fmtRp(p.per_km)}/km` : 'No delivery'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rate inputs */}
      <div style={card}>
        <span style={label}>Base fare (first {s.base_km} km)</span>
        <input value={s.base_fare} onChange={e => set('base_fare', Number(e.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" placeholder="8000" style={input} />

        <div style={{ height: 12 }} />
        <span style={label}>Base km included</span>
        <input type="number" value={s.base_km} onChange={e => set('base_km', Number(e.target.value) || 0)} min={0} max={10} style={input} />

        <div style={{ height: 12 }} />
        <span style={label}>Price per km (after base)</span>
        <input value={s.per_km} onChange={e => set('per_km', Number(e.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" placeholder="3000" style={input} />

        <div style={{ height: 12 }} />
        <span style={label}>Maximum delivery distance (km)</span>
        <input type="number" value={s.max_km} onChange={e => set('max_km', Number(e.target.value) || 0)} min={0} max={50} style={input} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Beyond this, customers see "too far for delivery — pickup only".</div>

        <div style={{ height: 12 }} />
        <span style={label}>Free delivery threshold (subtotal)</span>
        <input value={s.free_above} onChange={e => set('free_above', Number(e.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" placeholder="100000" style={input} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Orders at or above this subtotal get free delivery. Set 0 to disable.</div>

        <div style={{ height: 12 }} />
        <span style={label}>Weekend surcharge (added to fare on Sat/Sun)</span>
        <input value={s.weekend_surcharge} onChange={e => set('weekend_surcharge', Number(e.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" placeholder="0" style={input} />
      </div>

      {/* Live calculator */}
      <div style={card}>
        <span style={label}>Customer sees</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[1, 3, 5, 10].map(km => {
            const p = priceAt(km)
            return (
              <div key={km} style={{ padding: '10px 8px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', textAlign: 'center', border: `1px solid ${BRAND.redBorder}` }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{km} km</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{p == null ? 'Too far' : fmtRp(p)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {msg && <div style={{ padding: 10, borderRadius: 12, fontSize: 13, color: '#fff', textAlign: 'center', background: msg.includes('fail') ? 'rgba(239,68,68,0.15)' : BRAND.redGlow, border: msg.includes('fail') ? '1px solid rgba(239,68,68,0.3)' : `1px solid ${BRAND.redBorder}`, marginBottom: 12 }}>{msg}</div>}
      <button onClick={handleSave} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: BRAND.red, color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Save Delivery Settings</button>
    </>
  )
}
