// Reviews — list, reply, hide spam. Uses the existing restaurant_reviews
// table extended in the Phase C migration with vendor_reply / is_hidden.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const fmtDate = iso => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const card  = { padding: 14, borderRadius: 14, marginBottom: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }

function Stars({ n, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#FACC15' : 'rgba(255,255,255,0.15)', fontSize: size }}>★</span>
      ))}
    </span>
  )
}

export default function ReviewsPage({ restaurant, onBack }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | '1' | '2' | '3' | '4' | '5' | 'unanswered' | 'hidden'
  const [replyText, setReplyText] = useState({}) // { [id]: text }
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!supabase || !restaurant?.id) { setLoading(false); return }
    const { data } = await supabase
      .from('restaurant_reviews')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
      .limit(200)
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [restaurant?.id])

  const sendReply = async (r) => {
    if (!supabase) return
    const text = (replyText[r.id] || '').trim()
    if (!text) return
    setMsg('Saving…')
    const { error } = await supabase.from('restaurant_reviews').update({
      vendor_reply: text,
      vendor_replied_at: new Date().toISOString(),
    }).eq('id', r.id)
    if (error) { setMsg('Save failed: ' + error.message); return }
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, vendor_reply: text, vendor_replied_at: new Date().toISOString() } : x))
    setReplyText(p => ({ ...p, [r.id]: '' }))
    setMsg('Reply posted.')
    setTimeout(() => setMsg(''), 1500)
  }

  const toggleHide = async (r) => {
    if (!supabase) return
    const next = !r.is_hidden
    await supabase.from('restaurant_reviews').update({ is_hidden: next }).eq('id', r.id)
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, is_hidden: next } : x))
  }

  const stats = useMemo(() => {
    const visible = reviews.filter(r => !r.is_hidden)
    const total = visible.length
    const avg = total ? visible.reduce((s, r) => s + (r.stars || 0), 0) / total : 0
    const dist = [0, 0, 0, 0, 0, 0]
    for (const r of visible) dist[r.stars || 0] = (dist[r.stars || 0] || 0) + 1
    const unanswered = visible.filter(r => !r.vendor_reply).length
    return { total, avg, dist, unanswered, hiddenCount: reviews.length - visible.length }
  }, [reviews])

  const filtered = reviews.filter(r => {
    if (filter === 'all') return !r.is_hidden
    if (filter === 'hidden') return r.is_hidden
    if (filter === 'unanswered') return !r.is_hidden && !r.vendor_reply
    return !r.is_hidden && r.stars === Number(filter)
  })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Reviews</h2>
      </div>

      {/* Summary */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.avg ? stats.avg.toFixed(1) : '—'}</div>
            <div style={{ marginTop: 4 }}><Stars n={Math.round(stats.avg)} size={16} /></div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{stats.total} review{stats.total === 1 ? '' : 's'}</div>
          </div>
          <div style={{ flex: 1 }}>
            {[5,4,3,2,1].map(n => {
              const pct = stats.total ? (stats.dist[n] || 0) / stats.total * 100 : 0
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 12 }}>{n}</span>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: BRAND.red }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 24, textAlign: 'right' }}>{stats.dist[n] || 0}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{stats.unanswered} unanswered</span>
          <span style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{stats.hiddenCount} hidden</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {[
          { id: 'all', l: 'All' },
          { id: 'unanswered', l: 'Unanswered' },
          { id: '5', l: '★ 5' },
          { id: '4', l: '★ 4' },
          { id: '3', l: '★ 3' },
          { id: '2', l: '★ 2' },
          { id: '1', l: '★ 1' },
          { id: 'hidden', l: 'Hidden' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '6px 12px', borderRadius: 999, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', background: filter === f.id ? BRAND.red : 'rgba(255,255,255,0.06)', color: '#fff' }}>{f.l}</button>
        ))}
      </div>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No reviews in this view.</div>
        </div>
      )}

      {filtered.map(r => (
        <div key={r.id} style={{ ...card, opacity: r.is_hidden ? 0.55 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <Stars n={r.stars} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtDate(r.created_at)}</span>
          </div>
          {r.comment && <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.5, marginBottom: 8 }}>{r.comment}</div>}
          {r.vendor_reply ? (
            <div style={{ padding: 10, borderRadius: 10, background: BRAND.redGlow, borderLeft: `3px solid ${BRAND.red}`, marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: BRAND.redLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Your reply · {r.vendor_replied_at ? fmtDate(r.vendor_replied_at) : ''}</div>
              <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.5 }}>{r.vendor_reply}</div>
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <textarea value={replyText[r.id] || ''} onChange={e => setReplyText(p => ({ ...p, [r.id]: e.target.value }))} placeholder="Reply to this review…" rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 12, outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: 6 }} />
              <button onClick={() => sendReply(r)} disabled={!(replyText[r.id] || '').trim()} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: BRAND.red, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', opacity: (replyText[r.id] || '').trim() ? 1 : 0.5 }}>Reply</button>
            </div>
          )}
          <button onClick={() => toggleHide(r)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
            {r.is_hidden ? '↺ Unhide' : '🚫 Hide (spam)'}
          </button>
        </div>
      ))}

      {msg && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: 12, background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 999 }}>{msg}</div>}
    </>
  )
}
