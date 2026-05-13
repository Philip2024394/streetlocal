// Coupons — code-based promo. Vendor creates a code, customer applies at
// checkout. Distinct from per-dish "deals" which already exist as a
// separate page. Schema: coupons + coupon_redemptions (Phase C migration).
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')
const fmtDate = iso => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const card  = { padding: 12, borderRadius: 12, marginBottom: 8, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

const blank = () => ({
  id: null,
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: 10,
  min_subtotal: 0,
  max_uses: null,
  valid_from: new Date().toISOString().slice(0, 10),
  valid_to: '',
  is_active: true,
  applies_to: 'all',
})

export default function CouponsPage({ restaurant, onBack }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!supabase || !restaurant?.id) { setLoading(false); return }
    const { data } = await supabase
      .from('coupons').select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [restaurant?.id])

  const save = async (c) => {
    if (!supabase || !restaurant?.id) return
    setMsg('Saving…')
    const payload = {
      restaurant_id: restaurant.id,
      code: c.code.trim().toUpperCase(),
      description: c.description.trim() || null,
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value) || 0,
      min_subtotal: Number(c.min_subtotal) || 0,
      max_uses: c.max_uses === '' || c.max_uses == null ? null : Number(c.max_uses),
      valid_from: c.valid_from || new Date().toISOString(),
      valid_to: c.valid_to || null,
      is_active: !!c.is_active,
      applies_to: c.applies_to || 'all',
    }
    const { error } = c.id
      ? await supabase.from('coupons').update(payload).eq('id', c.id)
      : await supabase.from('coupons').insert(payload)
    if (error) { setMsg('Save failed: ' + error.message); return }
    setMsg('Saved.')
    setEditing(null)
    await load()
    setTimeout(() => setMsg(''), 1500)
  }

  const toggleActive = async (c) => {
    if (!supabase) return
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
  }

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}? Past redemptions stay in the ledger.`)) return
    if (!supabase) return
    await supabase.from('coupons').delete().eq('id', c.id)
    setCoupons(prev => prev.filter(x => x.id !== c.id))
  }

  if (editing) {
    return <Editor coupon={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} />
  }

  const active = coupons.filter(c => c.is_active)
  const inactive = coupons.filter(c => !c.is_active)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Coupons & Codes</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Order-wide promo codes</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
          Customers type the code at checkout to get a discount on the whole order. For per-dish discounts use the <strong>Deals</strong> page instead.
        </div>
      </div>

      <button onClick={() => setEditing(blank())} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: BRAND.red, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 12 }}>+ New Coupon</button>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}

      {!loading && coupons.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏷️</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No coupons yet</div>
        </div>
      )}

      {!loading && active.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '8px 0' }}>Active ({active.length})</div>
          {active.map(c => <Row key={c.id} c={c} onEdit={setEditing} onToggle={toggleActive} onDelete={remove} />)}
        </>
      )}

      {!loading && inactive.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '12px 0 8px' }}>Inactive ({inactive.length})</div>
          {inactive.map(c => <Row key={c.id} c={c} onEdit={setEditing} onToggle={toggleActive} onDelete={remove} />)}
        </>
      )}

      {msg && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: 12, background: msg.toLowerCase().includes('fail') ? '#EF4444' : BRAND.red, color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 999 }}>{msg}</div>}
    </>
  )
}

function Row({ c, onEdit, onToggle, onDelete }) {
  const valueStr = c.discount_type === 'percent' ? `${c.discount_value}% off` : `${fmtRp(c.discount_value)} off`
  const expired = c.valid_to && new Date(c.valid_to) < new Date()
  const usesStr = c.max_uses ? `${c.used_count}/${c.max_uses}` : `${c.used_count} used`
  return (
    <div style={{ ...card, opacity: c.is_active ? 1 : 0.5 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>{c.code}</span>
          {expired && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', fontSize: 10, fontWeight: 800 }}>EXPIRED</span>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 900, color: BRAND.redLight }}>{valueStr}</span>
      </div>
      {c.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{c.description}</div>}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.5 }}>
        {c.min_subtotal > 0 && <>Min {fmtRp(c.min_subtotal)} · </>}
        {usesStr}
        {c.valid_to && <> · until {fmtDate(c.valid_to)}</>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onEdit(c)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
        <button onClick={() => onToggle(c)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${c.is_active ? 'rgba(255,255,255,0.1)' : BRAND.redBorder}`, background: c.is_active ? 'rgba(255,255,255,0.04)' : BRAND.redGlow, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{c.is_active ? 'Pause' : 'Activate'}</button>
        <button onClick={() => onDelete(c)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Delete</button>
      </div>
    </div>
  )
}

function Editor({ coupon, onChange, onSave, onCancel }) {
  const c = coupon
  const set = (k, v) => onChange({ ...c, [k]: v })
  const canSave = c.code?.trim() && Number(c.discount_value) > 0

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>{c.id ? 'Edit Coupon' : 'New Coupon'}</h2>
      </div>

      <div style={{ ...card, marginBottom: 12 }}>
        <span style={label}>Code</span>
        <input value={c.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24))} placeholder="WELCOME10" style={{ ...input, fontFamily: 'monospace', letterSpacing: 1 }} />
        <div style={{ height: 12 }} />
        <span style={label}>Description (optional)</span>
        <input value={c.description} onChange={e => set('description', e.target.value)} placeholder="e.g. New customer 10% off" style={input} />
      </div>

      <div style={{ ...card, marginBottom: 12 }}>
        <span style={label}>Discount type</span>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[{ id: 'percent', l: 'Percent off' }, { id: 'fixed', l: 'Fixed Rp off' }].map(t => (
            <button key={t.id} onClick={() => set('discount_type', t.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: c.discount_type === t.id ? BRAND.red : 'rgba(255,255,255,0.08)', color: '#fff' }}>{t.l}</button>
          ))}
        </div>
        <span style={label}>{c.discount_type === 'percent' ? 'Percent (1–100)' : 'Amount (IDR)'}</span>
        <input type="number" min={1} max={c.discount_type === 'percent' ? 100 : undefined} value={c.discount_value} onChange={e => set('discount_value', Number(e.target.value) || 0)} style={input} />
        <div style={{ height: 12 }} />
        <span style={label}>Minimum subtotal (0 = no minimum)</span>
        <input type="number" min={0} value={c.min_subtotal} onChange={e => set('min_subtotal', Number(e.target.value) || 0)} style={input} />
      </div>

      <div style={{ ...card, marginBottom: 12 }}>
        <span style={label}>Max uses (blank = unlimited)</span>
        <input type="number" min={1} value={c.max_uses ?? ''} onChange={e => set('max_uses', e.target.value === '' ? null : Number(e.target.value))} placeholder="Unlimited" style={input} />
        <div style={{ height: 12 }} />
        <span style={label}>Valid from</span>
        <input type="date" value={(c.valid_from || '').slice(0, 10)} onChange={e => set('valid_from', e.target.value)} style={{ ...input, colorScheme: 'dark' }} />
        <div style={{ height: 12 }} />
        <span style={label}>Valid to (blank = no expiry)</span>
        <input type="date" value={(c.valid_to || '').slice(0, 10)} onChange={e => set('valid_to', e.target.value)} style={{ ...input, colorScheme: 'dark' }} />
        <div style={{ height: 12 }} />
        <button onClick={() => set('is_active', !c.is_active)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${c.is_active ? BRAND.redBorder : 'rgba(255,255,255,0.1)'}`, background: c.is_active ? BRAND.redGlow : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{c.is_active ? '✓ Active — customers can use this' : 'Inactive — paused'}</button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => onSave(c)} disabled={!canSave} style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', background: BRAND.red, color: '#fff', fontSize: 14, fontWeight: 900, cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5 }}>{c.id ? 'Save Changes' : 'Create Coupon'}</button>
      </div>
    </>
  )
}
