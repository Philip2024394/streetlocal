// Multi-location — brand owners with multiple branches see all locations
// in one view. Switching context updates the local 'indoo_vendor_restaurant'
// key so the rest of the dashboard scopes to the picked branch.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const LOCAL_KEY = 'indoo_vendor_restaurant'
const card  = { padding: 14, borderRadius: 14, marginBottom: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

export default function LocationsPage({ restaurant, onBack, onSwitchContext }) {
  const [group, setGroup] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newBranch, setNewBranch] = useState({ label: '', address: '' })
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!supabase || !restaurant?.id) { setLoading(false); return }
    // Find this restaurant + its group + sibling branches.
    const { data: r } = await supabase
      .from('restaurants')
      .select('id, name, group_id, branch_label, owner_id')
      .eq('id', restaurant.id)
      .single()
    if (r?.group_id) {
      const { data: g } = await supabase.from('restaurant_groups').select('*').eq('id', r.group_id).single()
      setGroup(g)
      const { data: sibs } = await supabase
        .from('restaurants')
        .select('id, name, branch_label, address, is_open, status, url_active, phone')
        .eq('group_id', r.group_id)
        .order('id')
      setBranches(sibs || [])
    } else {
      setGroup(null)
      setBranches([r])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [restaurant?.id])

  const createGroup = async () => {
    if (!supabase || !restaurant?.id) return
    if (!newGroupName.trim()) { setMsg('Enter a brand name'); return }
    setMsg('Creating brand…')
    const { data: r } = await supabase.from('restaurants').select('owner_id').eq('id', restaurant.id).single()
    if (!r?.owner_id) { setMsg('Owner missing on restaurant — sign in first'); return }
    const { data: g, error } = await supabase.from('restaurant_groups')
      .insert({ owner_id: r.owner_id, name: newGroupName.trim() })
      .select().single()
    if (error || !g) { setMsg('Create failed: ' + (error?.message || 'unknown')); return }
    await supabase.from('restaurants').update({ group_id: g.id, branch_label: restaurant.name }).eq('id', restaurant.id)
    setNewGroupName('')
    setCreatingGroup(false)
    setMsg('Brand created.')
    await load()
    setTimeout(() => setMsg(''), 1500)
  }

  const addBranch = async () => {
    if (!supabase || !group?.id) return
    if (!newBranch.label.trim()) { setMsg('Enter a branch label'); return }
    setMsg('Adding branch…')
    const { data: r } = await supabase.from('restaurants').select('owner_id').eq('id', restaurant.id).single()
    const { error } = await supabase.from('restaurants').insert({
      owner_id:     r.owner_id,
      group_id:     group.id,
      name:         `${group.name} – ${newBranch.label.trim()}`,
      branch_label: newBranch.label.trim(),
      address:      newBranch.address.trim() || null,
      status:       'pending',
      is_open:      false,
    })
    if (error) { setMsg('Add failed: ' + error.message); return }
    setNewBranch({ label: '', address: '' })
    setMsg('Branch added (pending approval).')
    await load()
    setTimeout(() => setMsg(''), 1800)
  }

  const switchTo = (b) => {
    // Persist the picked branch so other dashboard pages scope to it.
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}')
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...stored, ...b }))
    } catch {}
    onSwitchContext?.(b)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Locations</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Brand & branches</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
          Group multiple restaurants under one brand. Each branch keeps its own menu, hours, gateway and orders — but you can see them all here and switch context with one tap.
        </div>
      </div>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}

      {!loading && !group && (
        creatingGroup ? (
          <div style={card}>
            <span style={label}>Brand name</span>
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Warung Pak Joko" style={input} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setCreatingGroup(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={createGroup} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>Create Brand</button>
            </div>
          </div>
        ) : (
          <div style={{ ...card, textAlign: 'center', padding: 30 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏪</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 12, lineHeight: 1.5 }}>You currently run one location.<br/>Turn this into a chain to manage multiple branches.</div>
            <button onClick={() => setCreatingGroup(true)} style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>Create Brand / Chain</button>
          </div>
        )
      )}

      {!loading && group && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: BRAND.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>{group.name.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{group.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{branches.length} branch{branches.length === 1 ? '' : 'es'}</div>
              </div>
            </div>
          </div>

          {branches.map(b => {
            const isCurrent = b.id === restaurant.id
            return (
              <div key={b.id} style={{ ...card, border: isCurrent ? `1.5px solid ${BRAND.red}` : '1px solid rgba(255,255,255,0.06)', background: isCurrent ? BRAND.redGlow : 'rgba(0,0,0,0.45)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{b.branch_label || b.name}</span>
                    {isCurrent && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: BRAND.redLight, background: BRAND.redGlow, padding: '2px 8px', borderRadius: 6 }}>CURRENT</span>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                    background: b.url_active ? 'rgba(34,197,94,0.15)' : 'rgba(250,204,21,0.15)',
                    color: b.url_active ? '#22C55E' : '#FACC15' }}>
                    {b.url_active ? '● LIVE' : 'OFFLINE'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                  {b.address || '—'} {b.phone ? `· ${b.phone}` : ''}
                </div>
                {!isCurrent && (
                  <button onClick={() => switchTo(b)} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Switch to this branch</button>
                )}
              </div>
            )
          })}

          <div style={card}>
            <span style={label}>Add a new branch</span>
            <input value={newBranch.label} onChange={e => setNewBranch(b => ({ ...b, label: e.target.value }))} placeholder="Branch label (e.g. Sudirman, Kemang)" style={input} />
            <div style={{ height: 8 }} />
            <input value={newBranch.address} onChange={e => setNewBranch(b => ({ ...b, address: e.target.value }))} placeholder="Address (optional)" style={input} />
            <button onClick={addBranch} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', marginTop: 10 }}>+ Add Branch</button>
          </div>
        </>
      )}

      {msg && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: 12, background: msg.toLowerCase().includes('fail') ? '#EF4444' : BRAND.red, color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 999 }}>{msg}</div>}
    </>
  )
}
