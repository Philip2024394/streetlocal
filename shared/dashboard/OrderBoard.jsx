/**
 * Shared OrderBoard — kanban for vendor_orders.
 *
 * Reused by products-local + services-local. Status columns are passed in
 * via props because products ('new' → 'shipped') and services
 * ('new' → 'done') have different lifecycles.
 *
 * Real-time via Supabase channel + 15s poll fallback (same pattern as
 * the foodlocal-pro OrderBoard).
 */
import React, { useEffect, useRef, useState } from 'react'

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')

function ageMin(iso, now) {
  if (!iso) return 0
  return Math.floor((now - new Date(iso).getTime()) / 60000)
}

export default function OrderBoard({ supabase, vendorId, columns, onBack, accent = '#DC2626', onOpenChat }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState('')
  const pollRef = useRef(null)
  const channelRef = useRef(null)

  const NEXT = {}
  columns.forEach((c, i) => { if (i + 1 < columns.length) NEXT[c.id] = columns[i + 1].id })

  const fetchOrders = async () => {
    if (!supabase || !vendorId) { setLoading(false); return }
    const { data, error } = await supabase
      .from('vendor_orders')
      .select('id, status, items, subtotal, total, customer_name, customer_phone, customer_address, payment_method, payment_status, gateway_used, scheduled_for, note, created_at, updated_at')
      .eq('vendor_id', vendorId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(150)
    if (error) setError(error.message || 'Could not load orders')
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [vendorId])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!supabase || !vendorId) return
    const ch = supabase.channel('vendor_orders:' + vendorId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_orders', filter: `vendor_id=eq.${vendorId}` }, () => fetchOrders())
      .subscribe()
    channelRef.current = ch
    pollRef.current = setInterval(fetchOrders, 15000)
    return () => {
      try { supabase.removeChannel(ch) } catch {}
      clearInterval(pollRef.current)
    }
  }, [vendorId])

  const advance = async (order) => {
    const next = NEXT[order.status]
    if (!next) return
    if (!supabase) return
    const patch = { status: next, updated_at: new Date().toISOString() }
    await supabase.from('vendor_orders').update(patch).eq('id', order.id)
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...patch } : o))
  }

  const cancel = async (order) => {
    if (!window.confirm('Cancel this order? The customer will be notified.')) return
    if (!supabase) return
    await supabase.from('vendor_orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', order.id)
    setOrders(prev => prev.filter(o => o.id !== order.id))
  }

  const grouped = {}
  columns.forEach(c => { grouped[c.id] = [] })
  for (const o of orders) if (grouped[o.status]) grouped[o.status].push(o)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Live Order Board</h2>
        <button onClick={fetchOrders} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${accent}55`, background: `${accent}22`, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      {error && <div style={{ padding: 10, borderRadius: 10, marginBottom: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 12 }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 30, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading orders…</div>
      ) : (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, margin: '0 -16px', padding: '0 16px 8px' }}>
          {columns.map(col => {
            const cards = grouped[col.id] || []
            return (
              <div key={col.id} style={{ flexShrink: 0, width: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: `${col.color}15`, border: `1px solid ${col.color}30` }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: col.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{col.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: col.color, padding: '2px 8px', borderRadius: 999 }}>{cards.length}</span>
                </div>
                {cards.length === 0 && <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>—</div>}
                {cards.map(o => {
                  const age = ageMin(o.updated_at || o.created_at, now)
                  const items = Array.isArray(o.items) ? o.items : []
                  const itemsLine = items.slice(0, 3).map(it => `${it.qty || 1}× ${it.name}`).join(', ')
                  const more = items.length > 3 ? ` +${items.length - 3} more` : ''
                  const total = o.total ?? o.subtotal ?? 0
                  return (
                    <div key={o.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: `1.5px solid ${col.color}40`, borderLeft: `4px solid ${col.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>#{String(o.id).slice(-6)}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: col.color }}>{age}m</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>{o.customer_name || 'Customer'} · {o.customer_phone || '—'}</div>
                      <div style={{ fontSize: 12, color: '#fff', marginBottom: 6, lineHeight: 1.35 }}>{itemsLine}{more}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(total)}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                          {o.payment_status === 'paid' && o.gateway_used ? `✓ ${o.gateway_used}` : (o.payment_method || 'cash')}
                        </span>
                      </div>
                      {o.scheduled_for && (
                        <div style={{ fontSize: 11, color: '#FACC15', marginBottom: 8 }}>📅 {new Date(o.scheduled_for).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      )}
                      {o.customer_address && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6, lineHeight: 1.3 }}>📍 {o.customer_address}</div>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {NEXT[o.status] && (
                          <button onClick={() => advance(o)} style={{ flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                            → {columns.find(c => c.id === NEXT[o.status])?.label || 'Next'}
                          </button>
                        )}
                        {onOpenChat && (
                          <button onClick={() => onOpenChat(o)} title="Chat with customer" style={{ width: 36, padding: '8px 0', borderRadius: 8, border: `1px solid ${accent}55`, background: `${accent}22`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>💬</button>
                        )}
                        {o.status !== 'cancelled' && (
                          <button onClick={() => cancel(o)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
