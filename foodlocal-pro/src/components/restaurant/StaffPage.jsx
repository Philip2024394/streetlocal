// Staff & Roles — invite team members with scoped permissions. Owner is
// implicit (restaurants.owner_id). Staff rows extend access with a role
// (manager / chef / cashier / viewer) and status (invited / active / disabled).
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const card  = { padding: 14, borderRadius: 14, marginBottom: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

const ROLES = [
  { id: 'manager', label: 'Manager', desc: 'Full access except billing & staff management.' },
  { id: 'chef',    label: 'Chef / Kitchen', desc: 'Live Order Board, Menu, 86 List, Modifier Groups, Hours.' },
  { id: 'cashier', label: 'Cashier',   desc: 'Orders, Refunds (read), confirm payment, customer info.' },
  { id: 'viewer',  label: 'Viewer',    desc: 'Read-only — Analytics & Reviews. No edits.' },
]

const STATUS_COLOR = { invited: '#FACC15', active: '#22C55E', disabled: 'rgba(255,255,255,0.4)' }

function randomToken() {
  const a = new Uint8Array(8); crypto.getRandomValues(a)
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function StaffPage({ restaurant, onBack }) {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [invite, setInvite] = useState({ display_name: '', invite_email: '', invite_phone: '', role: 'cashier' })
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!supabase || !restaurant?.id) { setLoading(false); return }
    const { data } = await supabase
      .from('restaurant_staff')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
    setStaff(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [restaurant?.id])

  const sendInvite = async () => {
    if (!supabase || !restaurant?.id) return
    if (!invite.display_name.trim() || (!invite.invite_email.trim() && !invite.invite_phone.trim())) {
      setMsg('Enter a name plus an email or phone'); return
    }
    setMsg('Creating invite…')
    const token = randomToken()
    const { error } = await supabase.from('restaurant_staff').insert({
      restaurant_id: restaurant.id,
      display_name:  invite.display_name.trim(),
      invite_email:  invite.invite_email.trim() || null,
      invite_phone:  invite.invite_phone.trim() || null,
      role:          invite.role,
      status:        'invited',
      invite_token:  token,
    })
    if (error) { setMsg('Invite failed: ' + error.message); return }
    setInvite({ display_name: '', invite_email: '', invite_phone: '', role: 'cashier' })
    setInviting(false)
    setMsg('Invite created. Share the link with them.')
    await load()
    setTimeout(() => setMsg(''), 2000)
  }

  const setRole = async (s, role) => {
    if (!supabase) return
    await supabase.from('restaurant_staff').update({ role }).eq('id', s.id)
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, role } : x))
  }
  const setStatus = async (s, status) => {
    if (!supabase) return
    const patch = { status }
    if (status === 'active' && !s.activated_at) patch.activated_at = new Date().toISOString()
    await supabase.from('restaurant_staff').update(patch).eq('id', s.id)
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, ...patch } : x))
  }
  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.display_name} from staff?`)) return
    if (!supabase) return
    await supabase.from('restaurant_staff').delete().eq('id', s.id)
    setStaff(prev => prev.filter(x => x.id !== s.id))
  }
  const copyInvite = (s) => {
    const url = `${window.location.origin}${window.location.pathname}?staff_invite=${s.invite_token}`
    navigator.clipboard?.writeText(url).then(() => { setMsg('Invite link copied.'); setTimeout(() => setMsg(''), 1500) })
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Staff & Roles</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Team access</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
          Invite people to help run this restaurant with scoped permissions. You stay the owner — they can do their job without touching billing or payment-method connections.
        </div>
      </div>

      {!inviting && (
        <button onClick={() => setInviting(true)} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: BRAND.red, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 12 }}>+ Invite team member</button>
      )}

      {inviting && (
        <div style={card}>
          <span style={label}>Name</span>
          <input value={invite.display_name} onChange={e => setInvite(v => ({ ...v, display_name: e.target.value }))} placeholder="Their name" style={input} />
          <div style={{ height: 12 }} />
          <span style={label}>Email (optional)</span>
          <input type="email" value={invite.invite_email} onChange={e => setInvite(v => ({ ...v, invite_email: e.target.value }))} placeholder="name@email.com" style={input} />
          <div style={{ height: 12 }} />
          <span style={label}>WhatsApp / phone (optional)</span>
          <input type="tel" value={invite.invite_phone} onChange={e => setInvite(v => ({ ...v, invite_phone: e.target.value }))} placeholder="6281234567890" style={input} />
          <div style={{ height: 12 }} />
          <span style={label}>Role</span>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setInvite(v => ({ ...v, role: r.id }))} style={{ width: '100%', textAlign: 'left', padding: 10, marginBottom: 6, borderRadius: 10, border: `1px solid ${invite.role === r.id ? BRAND.red : 'rgba(255,255,255,0.1)'}`, background: invite.role === r.id ? BRAND.redGlow : 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{r.desc}</div>
            </button>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => setInviting(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={sendInvite} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>Create Invite</button>
          </div>
        </div>
      )}

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}

      {!loading && staff.length === 0 && !inviting && (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>You're running solo right now. Invite your team when you're ready.</div>
        </div>
      )}

      {staff.map(s => {
        const statusColor = STATUS_COLOR[s.status] || '#fff'
        return (
          <div key={s.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: BRAND.redGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.redLight, fontWeight: 900 }}>{(s.display_name || '?').charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{s.display_name || 'Pending'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.invite_email || s.invite_phone || '—'}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: `${statusColor}22`, color: statusColor, textTransform: 'uppercase' }}>{s.status}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(s, r.id)} style={{ padding: '5px 10px', borderRadius: 999, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: s.role === r.id ? BRAND.red : 'rgba(255,255,255,0.06)', color: '#fff' }}>{r.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {s.status === 'invited' && (
                <button onClick={() => copyInvite(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Copy invite link</button>
              )}
              {s.status === 'active'  && <button onClick={() => setStatus(s, 'disabled')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Disable</button>}
              {s.status === 'disabled' && <button onClick={() => setStatus(s, 'active')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: BRAND.red, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Re-activate</button>}
              <button onClick={() => remove(s)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        )
      })}

      {msg && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: 12, background: msg.toLowerCase().includes('fail') ? '#EF4444' : BRAND.red, color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 999 }}>{msg}</div>}
    </>
  )
}
