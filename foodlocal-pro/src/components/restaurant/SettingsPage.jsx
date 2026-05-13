// Settings — restaurant profile editing. Writes back to restaurants table.
// Hours, Delivery, Payments live in their own nav entries; this is the
// remaining identity/profile fields.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import imgError from '../../imgFallback'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const card  = { padding: 14, borderRadius: 14, marginBottom: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

const FIELDS = [
  { key: 'name',           label: 'Restaurant name',  placeholder: 'e.g. Warung Pak Joko' },
  { key: 'cuisine_type',   label: 'Cuisine',          placeholder: 'Indonesian, Chinese, Pizza…' },
  { key: 'phone',          label: 'WhatsApp / phone', placeholder: '6281234567890', type: 'tel' },
  { key: 'address',        label: 'Address',          placeholder: 'Street, city',  multiline: true },
  { key: 'description',    label: 'Description',      placeholder: 'Tell customers what makes you special…', multiline: true },
  { key: 'admin_notes',    label: 'Opening hours summary', placeholder: '08:00 – 22:00 daily (override in Hours & Holidays)' },
  { key: 'cover_url',      label: 'Cover photo URL',  placeholder: 'https://...' },
  { key: 'hero_dish_url',  label: 'Signature dish photo URL', placeholder: 'https://...' },
  { key: 'hero_dish_name', label: 'Signature dish name', placeholder: 'Nasi Goreng Spesial' },
  { key: 'shop_logo',      label: 'Logo URL',         placeholder: 'https://...' },
]

export default function SettingsPage({ restaurant, onBack }) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!supabase || !restaurant?.id) { setLoading(false); return }
    let cancelled = false
    supabase.from('restaurants')
      .select('id, name, cuisine_type, phone, address, description, admin_notes, cover_url, hero_dish_url, hero_dish_name, shop_logo, lat, lng, is_open, status')
      .eq('id', restaurant.id).single()
      .then(({ data: row }) => {
        if (!cancelled && row) setData(row)
        setLoading(false)
      }).catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [restaurant?.id])

  const set = (k, v) => { setData(prev => ({ ...prev, [k]: v })); setDirty(true) }

  const save = async () => {
    if (!supabase || !restaurant?.id) { setMsg('Saved locally.'); setTimeout(() => setMsg(''), 1500); return }
    setMsg('Saving…')
    const patch = {}
    for (const f of FIELDS) patch[f.key] = data[f.key] ?? null
    const { error } = await supabase.from('restaurants').update(patch).eq('id', restaurant.id)
    if (error) { setMsg('Save failed: ' + error.message); return }
    setDirty(false); setMsg('Saved.')
    setTimeout(() => setMsg(''), 1800)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Restaurant Profile</h2>
      </div>

      {/* Status row */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
          Approval status: <strong style={{ color: data.status === 'approved' ? '#22C55E' : '#FACC15' }}>{data.status || 'unknown'}</strong>
          {data.status === 'pending' && <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Customers can find you once an admin approves your profile.</span>}
        </span>
      </div>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}

      {!loading && FIELDS.map(f => (
        <div key={f.key} style={card}>
          <span style={label}>{f.label}</span>
          {f.multiline ? (
            <textarea value={data[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} rows={3} style={{ ...input, resize: 'none', lineHeight: 1.5 }} />
          ) : (
            <input type={f.type || 'text'} value={data[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={input} />
          )}
          {(f.key === 'cover_url' || f.key === 'hero_dish_url' || f.key === 'shop_logo') && data[f.key] && (
            <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', height: 100, background: 'rgba(0,0,0,0.5)' }}>
              <img src={data[f.key]} alt="" onError={imgError('logo')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      ))}

      {/* Cross-links to dedicated pages */}
      <div style={{ ...card, background: BRAND.redGlow, border: `1px solid ${BRAND.redBorder}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Manage elsewhere</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
          • <strong>Hours & Holidays</strong> — weekly schedule + closure dates<br/>
          • <strong>Delivery Settings</strong> — per-km pricing<br/>
          • <strong>Design Studio</strong> — logo, theme, banner, promo strip<br/>
          • <strong>Payment Methods</strong> — connect your gateway<br/>
          • <strong>Subscription</strong> — renew your monthly plan
        </div>
      </div>

      {msg && <div style={{ padding: 10, borderRadius: 12, fontSize: 13, color: '#fff', textAlign: 'center', background: msg.toLowerCase().includes('fail') ? 'rgba(239,68,68,0.15)' : BRAND.redGlow, border: msg.toLowerCase().includes('fail') ? '1px solid rgba(239,68,68,0.3)' : `1px solid ${BRAND.redBorder}`, marginBottom: 12 }}>{msg}</div>}
      <button onClick={save} disabled={!dirty} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: BRAND.red, color: '#fff', fontSize: 15, fontWeight: 900, cursor: dirty ? 'pointer' : 'not-allowed', opacity: dirty ? 1 : 0.5 }}>{dirty ? 'Save Changes' : 'No changes'}</button>
    </>
  )
}
