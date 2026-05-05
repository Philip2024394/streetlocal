import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/ui/ImageUpload'
import styles from './RestaurantsTab.module.css'
import { CUISINE_TYPES as CUISINES } from '@/constants/cuisineTypes'

const DEMO = [
  { id: 1, name: 'Warung Bu Sari',        cuisine_type: 'Javanese',   address: 'Jl. Malioboro 45, Yogyakarta', phone: '6281234567890', status: 'pending',  is_open: false, rating: null, review_count: 0,   created_at: '2026-04-09T08:00:00Z', owner_id: 'u1', menu_items: [{ id:1 },{ id:2 }],             photo_url: 'https://picsum.photos/seed/warung/80',  description: 'Traditional Javanese cuisine' },
  { id: 2, name: 'Bakso Pak Budi',         cuisine_type: 'Indonesian', address: 'Jl. Kaliurang Km 5, Sleman',  phone: '6281234567891', status: 'approved', is_open: true,  rating: 4.6, review_count: 89,  created_at: '2026-04-08T11:00:00Z', owner_id: 'u2', menu_items: [{ id:3 },{ id:4 },{ id:5 }],        photo_url: 'https://picsum.photos/seed/bakso/80',   description: 'Best bakso in town' },
  { id: 3, name: 'Ayam Geprek Mbak Rina',  cuisine_type: 'Indonesian', address: 'Jl. Parangtritis 22, Bantul', phone: '6281234567892', status: 'approved', is_open: false, rating: 4.9, review_count: 312, created_at: '2026-04-07T09:30:00Z', owner_id: 'u3', menu_items: [{ id:6 },{ id:7 },{ id:8 },{ id:9 }], photo_url: 'https://picsum.photos/seed/geprek/80',  description: 'Crispy spicy fried chicken' },
  { id: 4, name: 'Soto Ayam Bu Tinah',     cuisine_type: 'Javanese',   address: 'Jl. Solo Km 8, Klaten',      phone: '6281234567893', status: 'rejected', is_open: false, rating: null, review_count: 0,   created_at: '2026-04-06T14:00:00Z', owner_id: 'u4', menu_items: [],                                    photo_url: 'https://picsum.photos/seed/soto/80',    description: 'Authentic soto ayam recipe' },
]

const FILTER_TABS = [
  { id: 'pending',  label: 'Pending',  color: '#F59E0B' },
  { id: 'approved', label: 'Approved', color: '#F59E0B' },
  { id: 'rejected', label: 'Rejected', color: '#ff6b6b' },
  { id: 'all',      label: 'All',      color: '#888' },
]


function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name:         item.name         || '',
    cuisine_type: item.cuisine_type || 'Indonesian',
    address:      item.address      || '',
    phone:        item.phone        || '',
    description:  item.description  || '',
    photo_url:    item.photo_url    || '',
    status:       item.status       || 'pending',
    is_open:      item.is_open      || false,
  })
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#0d0d1a', border:'1px solid rgba(249,115,22,0.25)', borderRadius:16,
        width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 24px 80px rgba(0,0,0,0.7)', animation:'none', padding:0,
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0' }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#F97316' }}>✏️ Edit Restaurant</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:18, fontFamily:'inherit' }}>✕</button>
        </div>

        {/* Photo upload */}
        <div style={{ padding:'18px 24px 0' }}>
          <ImageUpload
            value={form.photo_url}
            onChange={url => setForm(p => ({ ...p, photo_url: url }))}
            folder="restaurants"
            size={80}
            shape="square"
            accentColor="#F97316"
          />
        </div>

        {/* Grid fields */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14, padding:'18px 24px 0' }}>
          <Field label="Restaurant Name *"><input value={form.name} onChange={f('name')} style={inputStyle} /></Field>
          <Field label="Cuisine Type">
            <select value={form.cuisine_type} onChange={f('cuisine_type')} style={inputStyle}>
              {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Phone"><input value={form.phone} onChange={f('phone')} style={inputStyle} placeholder="628…" /></Field>
          <Field label="Status">
            <select value={form.status} onChange={f('status')} style={inputStyle}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
          <Field label="Open Now">
            <select value={form.is_open ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, is_open: e.target.value === 'true' }))} style={inputStyle}>
              <option value="true">Open</option>
              <option value="false">Closed</option>
            </select>
          </Field>
          <div style={{ gridColumn:'1 / -1' }}>
            <Field label="Address"><input value={form.address} onChange={f('address')} style={inputStyle} /></Field>
          </div>
          <div style={{ gridColumn:'1 / -1' }}>
            <Field label="Description"><textarea value={form.description} onChange={f('description')} rows={3} style={{ ...inputStyle, resize:'vertical', width:'100%' }} /></Field>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', padding:'18px 24px 24px' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={() => onSave(form)} style={saveBtnStyle('#F97316')}>✓ Save Changes</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8,
  padding:'9px 12px', color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none',
  width:'100%', boxSizing:'border-box',
}
const cancelBtnStyle = {
  padding:'9px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:8, color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', fontFamily:'inherit',
}
const saveBtnStyle = (color) => ({
  padding:'9px 24px', background:`rgba(${hexToRgb(color)},0.15)`, border:`1px solid rgba(${hexToRgb(color)},0.35)`,
  borderRadius:8, color, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
})
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

export default function RestaurantsTab() {
  const [restaurants,   setRestaurants]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState('pending')
  const [expanded,      setExpanded]      = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal,   setRejectModal]   = useState(null)
  const [rejectNote,    setRejectNote]    = useState('')
  const [editItem,      setEditItem]      = useState(null)
  const [toast,         setToast]         = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    if (!supabase) { setRestaurants(DEMO); setLoading(false); return }
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, menu_items(id)')
      .order('created_at', { ascending: false })
    setRestaurants(error || !data?.length ? DEMO : data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status, notes = null) => {
    setActionLoading(id)
    if (supabase) await supabase.from('restaurants').update({ status, admin_notes: notes, updated_at: new Date().toISOString() }).eq('id', id)
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status, admin_notes: notes } : r))
    setActionLoading(null)
  }

  const handleApprove = (id) => updateStatus(id, 'approved')
  const handleReject  = async () => {
    if (!rejectModal) return
    await updateStatus(rejectModal, 'rejected', rejectNote.trim() || null)
    setRejectModal(null); setRejectNote('')
  }

  const handleSuspend = async (id) => {
    setActionLoading(id)
    if (supabase) await supabase.from('restaurants').update({ status: 'pending', admin_notes: '⚠️ Suspended', updated_at: new Date().toISOString() }).eq('id', id)
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: 'pending', admin_notes: '⚠️ Suspended' } : r))
    setActionLoading(null)
  }

  const handleForceClose = async (id, currentlyOpen) => {
    setActionLoading(id)
    if (supabase) await supabase.from('restaurants').update({ is_open: !currentlyOpen, updated_at: new Date().toISOString() }).eq('id', id)
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_open: !currentlyOpen } : r))
    setActionLoading(null)
  }

  const handleToggleFeatured = async (id, currentlyFeatured) => {
    setActionLoading(id)
    if (supabase) await supabase.from('restaurants').update({ featured_this_week: !currentlyFeatured, updated_at: new Date().toISOString() }).eq('id', id)
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, featured_this_week: !currentlyFeatured } : r))
    setActionLoading(null)
  }

  const handleEditSave = async (updated) => {
    if (!updated.name) { showToast('Name required', 'error'); return }
    if (supabase) {
      supabase.from('restaurants').update({
        name: updated.name, cuisine_type: updated.cuisine_type,
        address: updated.address, phone: updated.phone,
        description: updated.description, photo_url: updated.photo_url,
        status: updated.status, is_open: updated.is_open,
        updated_at: new Date().toISOString(),
      }).eq('id', editItem.id).catch(() => {})
    }
    setRestaurants(prev => prev.map(r => r.id === editItem.id ? { ...r, ...updated } : r))
    setEditItem(null)
    showToast(`✅ "${updated.name}" updated`)
  }

  const visible  = filter === 'all' ? restaurants : restaurants.filter(r => r.status === filter)
  const countFor = (s) => restaurants.filter(r => r.status === s).length

  if (loading) return <div className={styles.loading}>Loading restaurants…</div>

  return (
    <div className={styles.root}>
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:9999,
          padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600,
          background: toast.type === 'error' ? 'rgba(255,68,68,0.12)' : 'rgba(0,255,157,0.12)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(255,68,68,0.3)' : 'rgba(0,255,157,0.3)'}`,
          color: toast.type === 'error' ? '#FF4444' : '#00FF9D',
        }}>{toast.msg}</div>
      )}

      {editItem && <EditModal item={editItem} onSave={handleEditSave} onClose={() => setEditItem(null)} />}

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statNum}>{countFor('pending')}</span><span className={styles.statLbl}>Pending</span></div>
        <div className={styles.stat}><span className={styles.statNum} style={{ color:'#F59E0B' }}>{countFor('approved')}</span><span className={styles.statLbl}>Approved</span></div>
        <div className={styles.stat}><span className={styles.statNum} style={{ color:'#ff6b6b' }}>{countFor('rejected')}</span><span className={styles.statLbl}>Rejected</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{restaurants.length}</span><span className={styles.statLbl}>Total</span></div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {FILTER_TABS.map(t => (
          <button key={t.id}
            className={`${styles.filterBtn} ${filter === t.id ? styles.filterBtnActive : ''}`}
            style={filter === t.id ? { color: t.color, borderColor: t.color } : {}}
            onClick={() => setFilter(t.id)}>
            {t.label}
            {t.id !== 'all' && <span className={styles.filterCount}>{countFor(t.id)}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0
        ? <div className={styles.empty}>No {filter === 'all' ? '' : filter} restaurants.</div>
        : <div className={styles.list}>
            {visible.map(r => {
              const isExpanded = expanded === r.id
              const isBusy     = actionLoading === r.id
              return (
                <div key={r.id} className={`${styles.card} ${styles['status_' + r.status]}`}>
                  <div className={styles.cardHeader} onClick={() => setExpanded(isExpanded ? null : r.id)}>
                    {r.photo_url
                      ? <img src={r.photo_url} style={{ width:44, height:44, borderRadius:8, objectFit:'cover', flexShrink:0 }} alt="" />
                      : <div className={styles.restaurantIcon}>🍽</div>
                    }
                    <div className={styles.restaurantInfo}>
                      <span className={styles.restaurantName}>{r.name}</span>
                      <span className={styles.restaurantMeta}>{r.cuisine_type} · {r.address} · {fmtDate(r.created_at)}</span>
                      <span className={styles.restaurantMeta}>📱 {r.phone} · {r.menu_items?.length ?? 0} menu items{r.rating ? ` · ⭐ ${r.rating} (${r.review_count})` : ''}</span>
                      {r.admin_notes && <span className={styles.adminNote}>Note: {r.admin_notes}</span>}
                    </div>
                    <div className={styles.cardRight}>
                      <span className={`${styles.statusPill} ${styles['pill_' + r.status]}`}>{r.status}</span>
                      {r.status === 'approved' && (
                        <span className={`${styles.openPill} ${r.is_open ? styles.openPillOn : styles.openPillOff}`}>{r.is_open ? 'Open' : 'Closed'}</span>
                      )}
                    </div>
                    <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {isExpanded && (
                    <div className={styles.actions}>
                      {/* Payment QR */}
                      {r.bank?.qr_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <img src={r.bank.qr_url} alt="QR" onClick={() => window.open(r.bank.qr_url, '_blank')} style={{ width: 60, height: 60, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#fff', cursor: 'pointer', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{r.bank?.name} — {r.bank?.account_number}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.bank?.account_holder}</div>
                            <div style={{ fontSize: 10, color: '#8DC63F', marginTop: 2 }}>Click QR to enlarge</div>
                          </div>
                        </div>
                      )}
                      <button className={`${styles.btn} ${styles.btnFeature}`} onClick={() => setEditItem(r)} disabled={isBusy}>✏️ Edit</button>
                      {r.status !== 'approved' && <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => handleApprove(r.id)} disabled={isBusy}>{isBusy ? '…' : '✓ Approve'}</button>}
                      {r.status !== 'rejected' && <button className={`${styles.btn} ${styles.btnReject}`}  onClick={() => { setRejectModal(r.id); setRejectNote('') }} disabled={isBusy}>✕ Reject</button>}
                      {r.status === 'rejected' && <button className={`${styles.btn} ${styles.btnResubmit}`} onClick={() => updateStatus(r.id, 'pending', 'Resubmission requested')} disabled={isBusy}>↩ Pending</button>}
                      {r.status === 'approved' && <button className={`${styles.btn} ${styles.btnSuspend}`} onClick={() => handleSuspend(r.id)} disabled={isBusy}>⚠ Suspend</button>}
                      {r.status === 'approved' && <button className={`${styles.btn} ${r.is_open ? styles.btnClose : styles.btnOpen}`} onClick={() => handleForceClose(r.id, r.is_open)} disabled={isBusy}>{r.is_open ? '🔒 Force Close' : '🔓 Force Open'}</button>}
                      {r.status === 'approved' && <button className={`${styles.btn} ${r.featured_this_week ? styles.btnUnfeature : styles.btnFeature}`} onClick={() => handleToggleFeatured(r.id, r.featured_this_week)} disabled={isBusy}>{r.featured_this_week ? '★ Unfeature' : '☆ Feature'}</button>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      }

      {/* Reject modal */}
      {rejectModal && (
        <div className={styles.modalBackdrop} onClick={() => setRejectModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Reject Restaurant</h3>
            <p className={styles.modalSub}>Provide a reason so the owner knows what to fix.</p>
            <textarea className={styles.notesInput} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g. Address is incomplete" rows={4} />
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnReject}`}  onClick={handleReject}>Confirm Rejection</button>
              <button className={`${styles.btn} ${styles.btnCancel}`}  onClick={() => setRejectModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
