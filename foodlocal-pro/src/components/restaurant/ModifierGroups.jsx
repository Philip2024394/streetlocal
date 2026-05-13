// Modifier Groups — reusable groups attached to many menu items.
// Toast / Square / Foodpanda pattern. Distinct from per-item variants
// stored in menu_items.extras: that's for one-off items; this is for
// rules shared across a menu ("Size", "Add toppings", "Sauce").
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const fmtRp = n => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

const card  = { padding: 14, borderRadius: 16, marginBottom: 12, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

export default function ModifierGroups({ restaurant, onBack }) {
  const [groups, setGroups] = useState([])
  const [options, setOptions] = useState({}) // { [groupId]: [opt, ...] }
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // group object being edited
  const [msg, setMsg] = useState('')

  // Load groups + options on mount.
  useEffect(() => {
    if (!supabase || !restaurant?.id) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const { data: gs } = await supabase
        .from('modifier_groups')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order')
      if (cancelled) return
      setGroups(gs || [])
      if (gs && gs.length) {
        const ids = gs.map(g => g.id)
        const { data: os } = await supabase
          .from('modifier_options')
          .select('*')
          .in('group_id', ids)
          .order('sort_order')
        if (cancelled) return
        const grouped = {}
        for (const o of os || []) {
          if (!grouped[o.group_id]) grouped[o.group_id] = []
          grouped[o.group_id].push(o)
        }
        setOptions(grouped)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [restaurant?.id])

  const newGroup = () => setEditing({ id: null, name: '', min_select: 0, max_select: 1, required: false, sort_order: groups.length, options: [{ name: '', price_delta: 0, is_default: false }] })

  const saveGroup = async (g) => {
    if (!supabase || !restaurant?.id) { setMsg('Supabase not configured'); return }
    setMsg('Saving…')
    let groupId = g.id
    const groupPayload = {
      restaurant_id: restaurant.id,
      name:       g.name.trim(),
      min_select: Number(g.min_select) || 0,
      max_select: Number(g.max_select) || 1,
      required:   !!g.required,
      sort_order: g.sort_order ?? 0,
    }
    if (groupId) {
      await supabase.from('modifier_groups').update(groupPayload).eq('id', groupId)
    } else {
      const { data, error } = await supabase.from('modifier_groups').insert(groupPayload).select().single()
      if (error) { setMsg('Save failed: ' + error.message); return }
      groupId = data.id
    }
    // Replace options for the group.
    await supabase.from('modifier_options').delete().eq('group_id', groupId)
    const optsPayload = (g.options || []).filter(o => o.name?.trim()).map((o, i) => ({
      group_id: groupId,
      name: o.name.trim(),
      price_delta: Number(o.price_delta) || 0,
      is_default: !!o.is_default,
      is_available: o.is_available !== false,
      sort_order: i,
    }))
    if (optsPayload.length) await supabase.from('modifier_options').insert(optsPayload)
    // Refresh.
    const { data: gs } = await supabase.from('modifier_groups').select('*').eq('restaurant_id', restaurant.id).order('sort_order')
    setGroups(gs || [])
    const ids = (gs || []).map(x => x.id)
    if (ids.length) {
      const { data: os } = await supabase.from('modifier_options').select('*').in('group_id', ids).order('sort_order')
      const grouped = {}
      for (const o of os || []) { if (!grouped[o.group_id]) grouped[o.group_id] = []; grouped[o.group_id].push(o) }
      setOptions(grouped)
    }
    setEditing(null); setMsg('Saved.')
    setTimeout(() => setMsg(''), 1500)
  }

  const deleteGroup = async (id) => {
    if (!window.confirm('Delete this modifier group? It will be removed from all menu items.')) return
    if (!supabase) return
    await supabase.from('modifier_groups').delete().eq('id', id)
    setGroups(prev => prev.filter(g => g.id !== id))
    setOptions(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  if (editing) return <Editor group={editing} onChange={setEditing} onSave={saveGroup} onCancel={() => setEditing(null)} />

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Modifier Groups</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Reusable add-on groups</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
          Create a group once ("Choose a Size", "Add Toppings"), then attach to many menu items. Customers see them in the order page. Per-item one-off modifiers still live on the item form.
        </div>
      </div>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}

      {!loading && groups.length === 0 && (
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>No modifier groups yet</div>
          <button onClick={newGroup} style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>+ Create your first group</button>
        </div>
      )}

      {!loading && groups.map(g => (
        <div key={g.id} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{g.name}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing({ ...g, options: options[g.id] || [] })} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => deleteGroup(g.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            {g.required && <span style={{ color: BRAND.redLight, fontWeight: 700 }}>Required · </span>}
            {g.max_select === 1 ? 'Pick one' : `Pick up to ${g.max_select}`}{g.min_select > 0 ? `, min ${g.min_select}` : ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(options[g.id] || []).map(o => (
              <span key={o.id} style={{ padding: '5px 10px', borderRadius: 999, background: o.is_available ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: o.is_available ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {o.name} {o.price_delta ? <span style={{ color: '#FACC15', fontWeight: 700 }}>{o.price_delta > 0 ? '+' : ''}{fmtRp(o.price_delta)}</span> : null}
                {o.is_default && <span style={{ color: BRAND.redLight, marginLeft: 4 }}>★</span>}
                {!o.is_available && <span style={{ color: '#EF4444', marginLeft: 4 }}>86'd</span>}
              </span>
            ))}
            {(options[g.id] || []).length === 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>No options yet</span>}
          </div>
        </div>
      ))}

      {!loading && groups.length > 0 && (
        <button onClick={newGroup} style={{ width: '100%', padding: 14, borderRadius: 14, border: `1px dashed ${BRAND.redBorder}`, background: BRAND.redGlow, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>+ Add modifier group</button>
      )}

      {msg && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: 12, background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 999 }}>{msg}</div>}
    </>
  )
}

function Editor({ group, onChange, onSave, onCancel }) {
  const g = group
  const set = (k, v) => onChange({ ...g, [k]: v })
  const setOpt = (i, k, v) => onChange({ ...g, options: g.options.map((o, j) => j === i ? { ...o, [k]: v } : o) })
  const rmOpt  = (i) => onChange({ ...g, options: g.options.filter((_, j) => j !== i) })
  const addOpt = () => onChange({ ...g, options: [...g.options, { name: '', price_delta: 0, is_default: false, is_available: true }] })

  const canSave = g.name?.trim() && g.options.some(o => o.name?.trim())

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>{g.id ? 'Edit Group' : 'New Group'}</h2>
      </div>

      <div style={card}>
        <span style={label}>Group name</span>
        <input value={g.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Choose a Size" style={input} />

        <div style={{ height: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={label}>Min picks</span>
            <input type="number" min={0} value={g.min_select} onChange={e => set('min_select', Number(e.target.value) || 0)} style={input} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={label}>Max picks</span>
            <input type="number" min={1} value={g.max_select} onChange={e => set('max_select', Number(e.target.value) || 1)} style={input} />
          </div>
        </div>

        <div style={{ height: 12 }} />
        <button onClick={() => set('required', !g.required)} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${g.required ? BRAND.redBorder : 'rgba(255,255,255,0.1)'}`, background: g.required ? BRAND.redGlow : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{g.required ? '✓ Required (customer must pick)' : 'Optional'}</button>
      </div>

      <div style={card}>
        <span style={label}>Options</span>
        {g.options.map((o, i) => (
          <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <input value={o.name} onChange={e => setOpt(i, 'name', e.target.value)} placeholder="Option name (e.g. Large)" style={{ ...input, flex: 2 }} />
              <input value={o.price_delta} onChange={e => setOpt(i, 'price_delta', Number(e.target.value) || 0)} type="number" placeholder="+0" style={{ ...input, width: 90 }} />
              <button onClick={() => rmOpt(i)} style={{ width: 36, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setOpt(i, 'is_default', !o.is_default)} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${o.is_default ? BRAND.redBorder : 'rgba(255,255,255,0.1)'}`, background: o.is_default ? BRAND.redGlow : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{o.is_default ? '★ Default' : 'Set default'}</button>
              <button onClick={() => setOpt(i, 'is_available', o.is_available === false)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: o.is_available === false ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', color: o.is_available === false ? '#FCA5A5' : '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{o.is_available === false ? "86'd · tap to un-86" : 'Available'}</button>
            </div>
          </div>
        ))}
        <button onClick={addOpt} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add option</button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => onSave(g)} disabled={!canSave} style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', background: BRAND.red, color: '#fff', fontSize: 14, fontWeight: 900, cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5 }}>{g.id ? 'Save Changes' : 'Create Group'}</button>
      </div>
    </>
  )
}
