// Live Order Board — KDS kanban. Real-time view of food_orders for one
// restaurant. Columns are the seven status values from the food_orders
// CHECK constraint. SLA timers tick once per second so vendors can see
// at a glance which orders are running late.
//
// Real-time delivery uses Supabase realtime (postgres_changes). Falls
// back to a 15s poll if the channel never connects.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const COLUMNS = [
  { id: 'awaiting_payment', label: 'Awaiting pay', color: '#9CA3AF' },
  { id: 'payment_submitted',label: 'Submitted',    color: '#FACC15' },
  { id: 'confirmed',        label: 'Confirmed',    color: '#22C55E' },
  { id: 'driver_heading',   label: 'Driver here',  color: '#06B6D4' },
  { id: 'picked_up',        label: 'Picked up',    color: '#3B82F6' },
  { id: 'delivered',        label: 'Delivered',    color: '#A855F7' },
]

const NEXT_STATUS = {
  awaiting_payment: 'payment_submitted',
  payment_submitted: 'confirmed',
  confirmed: 'driver_heading',
  driver_heading: 'picked_up',
  picked_up: 'delivered',
}

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')

// SLA buckets per column (minutes). Cards turn yellow then red when overdue.
const SLA = { awaiting_payment: 10, payment_submitted: 5, confirmed: 15, driver_heading: 10, picked_up: 30 }

function ageMin(iso, now) {
  if (!iso) return 0
  return Math.floor((now - new Date(iso).getTime()) / 60000)
}

export default function OrderBoard({ restaurant, onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState('')
  const pollRef = useRef(null)
  const channelRef = useRef(null)

  const restaurantId = restaurant?.id

  const fetchOrders = async () => {
    if (!supabase || !restaurantId) { setLoading(false); return }
    const { data, error } = await supabase
      .from('food_orders')
      .select('id, status, items, total, customer_name, customer_phone, customer_address, payment_method, payment_intent_id, gateway_used, auto_confirmed_at, created_at, updated_at, pickup_code, driver_name')
      .eq('restaurant_id', restaurantId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(150)
    if (error) setError(error.message || 'Could not load orders')
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [restaurantId])

  // Tick once per second to keep SLA timers fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Realtime subscription + 15s poll fallback.
  useEffect(() => {
    if (!supabase || !restaurantId) return
    const ch = supabase.channel('food_orders:' + restaurantId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_orders', filter: `restaurant_id=eq.${restaurantId}` }, () => fetchOrders())
      .subscribe()
    channelRef.current = ch
    pollRef.current = setInterval(fetchOrders, 15000)
    return () => {
      try { supabase.removeChannel(ch) } catch {}
      clearInterval(pollRef.current)
    }
  }, [restaurantId])

  const advance = async (order) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    if (!supabase) return
    const patch = { status: next, updated_at: new Date().toISOString() }
    if (next === 'confirmed' && !order.auto_confirmed_at) patch.payment_confirmed_at = new Date().toISOString()
    await supabase.from('food_orders').update(patch).eq('id', order.id)
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...patch } : o))
  }

  const cancel = async (order) => {
    if (!window.confirm('Cancel this order? The customer will be notified.')) return
    if (!supabase) return
    await supabase.from('food_orders').update({ status: 'cancelled', cancel_reason: 'vendor cancelled', updated_at: new Date().toISOString() }).eq('id', order.id)
    setOrders(prev => prev.filter(o => o.id !== order.id))
  }

  const grouped = {}
  COLUMNS.forEach(c => { grouped[c.id] = [] })
  for (const o of orders) if (grouped[o.status]) grouped[o.status].push(o)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Live Order Board</h2>
        <button onClick={fetchOrders} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      {error && <div style={{ padding: 10, borderRadius: 10, marginBottom: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 12 }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 30, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading orders…</div>
      ) : (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8, marginLeft: -16, marginRight: -16, padding: '0 16px 8px' }}>
          {COLUMNS.map(col => {
            const cards = grouped[col.id] || []
            return (
              <div key={col.id} style={{ flexShrink: 0, width: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: `${col.color}15`, border: `1px solid ${col.color}30` }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: col.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{col.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: col.color, padding: '2px 8px', borderRadius: 999 }}>{cards.length}</span>
                </div>
                {cards.length === 0 && (
                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>—</div>
                )}
                {cards.map(o => {
                  const age = ageMin(o.updated_at || o.created_at, now)
                  const sla = SLA[o.status] || 0
                  const slaColor = sla === 0 ? col.color : age >= sla * 1.5 ? '#EF4444' : age >= sla ? '#FACC15' : col.color
                  const itemsLine = (o.items || []).slice(0, 3).map(it => `${it.qty || 1}× ${it.name}`).join(', ')
                  const more = (o.items || []).length > 3 ? ` +${o.items.length - 3} more` : ''
                  return (
                    <div key={o.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: `1.5px solid ${slaColor}40`, borderLeft: `4px solid ${slaColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>#{o.id}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: slaColor }}>{age}m</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>{o.customer_name || 'Customer'} · {o.customer_phone || '—'}</div>
                      <div style={{ fontSize: 12, color: '#fff', marginBottom: 6, lineHeight: 1.35 }}>{itemsLine}{more}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(o.total)}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                          {o.gateway_used ? `✓ ${o.gateway_used}` : o.payment_method || 'cash'}
                        </span>
                      </div>
                      {o.pickup_code && (
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Pickup code: <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'monospace' }}>{o.pickup_code}</span></div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {NEXT_STATUS[o.status] && (
                          <button onClick={() => advance(o)} style={{ flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: BRAND.red, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                            → {COLUMNS.find(c => c.id === NEXT_STATUS[o.status])?.label || 'Next'}
                          </button>
                        )}
                        {o.status !== 'delivered' && (
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
