import { useState } from 'react'

const PHASE_IMAGES = {
  pending:         'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_44_19%20AM.png',
  confirmed:       'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png',
  driver_heading:  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2009_26_49%20PM.png',
  picked_up:       'https://ik.imagekit.io/nepgaxllc/Motorcycle%20view%20on%20city%20street.png?updatedAt=1776062865270',
  on_the_way:      'https://ik.imagekit.io/nepgaxllc/Speeding%20through%20the%20vibrant%20city%20streets.png?updatedAt=1776061842808',
  arrived:         'https://ik.imagekit.io/nepgaxllc/Up%20close%20on%20the%20green%20ride.png?updatedAt=1776062117020',
  delivered:       'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png',
}

const PHASES = [
  { key: 'pending',        label: 'Order Received',        color: '#FACC15', icon: '📋' },
  { key: 'confirmed',      label: 'Confirmed by Kitchen',  color: '#FACC15', icon: '✅' },
  { key: 'driver_heading', label: 'Driver → Restaurant',   color: '#8DC63F', icon: '🏍️' },
  { key: 'picked_up',      label: 'Food Picked Up',        color: '#8DC63F', icon: '📦' },
  { key: 'on_the_way',     label: 'On The Way to Customer',color: '#8DC63F', icon: '🛵' },
  { key: 'arrived',        label: 'Driver Arrived',        color: '#8DC63F', icon: '📍' },
  { key: 'delivered',      label: 'Delivered',             color: '#22C55E', icon: '🎉' },
]

const DEMO_ORDERS = [
  { id: 'FOOD-3847', restaurant: 'Warung Bu Sari', customer: 'Ahmad R.', driver: 'Agus Prasetyo', items: '2× Nasi Gudeg, 1× Es Teh', total: 61000, status: 'on_the_way', payment: 'cod', eta: 8, created: '12:34' },
  { id: 'FOOD-2915', restaurant: 'Nasi Goreng Pak Harto', customer: 'Siti W.', driver: 'Budi Santoso', items: '1× Nasi Goreng Istimewa, 1× Jus Alpukat', total: 40000, status: 'picked_up', payment: 'bank', eta: 15, created: '12:21' },
  { id: 'FOOD-1082', restaurant: 'Bakso Pak Budi', customer: 'Dewi L.', driver: 'Ani Rahayu', items: '3× Bakso Spesial', total: 66000, status: 'driver_heading', payment: 'cod', eta: 22, created: '12:10' },
  { id: 'FOOD-4421', restaurant: 'Ayam Geprek Bu Tini', customer: 'Rudi P.', driver: '—', items: '1× Ayam Geprek L10', total: 25000, status: 'pending', payment: 'bank', eta: null, created: '12:45' },
  { id: 'FOOD-0091', restaurant: 'Warung Seafood Mbak Sri', customer: 'Andi K.', driver: 'Hendra Putra', items: '1× Udang Bakar, 1× Nasi', total: 90000, status: 'delivered', payment: 'bank', eta: 0, created: '11:50' },
]

function fmtRp(n) { return 'Rp ' + (n ?? 0).toLocaleString('id-ID') }

export default function FoodOrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? DEMO_ORDERS : DEMO_ORDERS.filter(o => o.status === filter)

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Food Orders</h2>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[{ key: 'all', label: 'All' }, ...PHASES].map(p => (
          <button key={p.key} onClick={() => setFilter(p.key)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
            background: filter === p.key ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filter === p.key ? 'rgba(141,198,63,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: filter === p.key ? '#8DC63F' : 'rgba(255,255,255,0.5)',
          }}>{p.icon ?? '📋'} {p.label}</button>
        ))}
      </div>

      {/* Order list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(order => {
          const phase = PHASES.find(p => p.key === order.status)
          return (
            <div key={order.id} onClick={() => setSelectedOrder(order)} style={{
              padding: 16, borderRadius: 16, cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              transition: 'border-color 0.2s',
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{order.id}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: phase?.color ?? '#888', padding: '3px 10px', borderRadius: 6, background: `${phase?.color ?? '#888'}18`, border: `1px solid ${phase?.color ?? '#888'}40` }}>
                  {phase?.icon} {phase?.label}
                </span>
              </div>
              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Restaurant</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{order.restaurant}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Customer</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{order.customer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Driver</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{order.driver}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Items</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{order.items}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total</span>
                  <span style={{ color: '#FACC15', fontWeight: 900, fontSize: 14 }}>{fmtRp(order.total)}</span>
                </div>
              </div>
              {/* ETA */}
              {order.eta > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8DC63F', animation: 'pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#8DC63F' }}>ETA ~{order.eta} min</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>Payment: {order.payment === 'bank' ? 'Bank Transfer' : 'COD'}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Order detail modal — shows phase image */}
      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Phase image */}
            <div style={{ position: 'relative', height: 220 }}>
              <img src={PHASE_IMAGES[selectedOrder.status] ?? PHASE_IMAGES.pending} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{selectedOrder.id}</span>
                <span style={{ display: 'block', fontSize: 12, color: PHASES.find(p => p.key === selectedOrder.status)?.color ?? '#888', fontWeight: 800, marginTop: 4 }}>
                  {PHASES.find(p => p.key === selectedOrder.status)?.icon} {PHASES.find(p => p.key === selectedOrder.status)?.label}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Progress timeline */}
            <div style={{ padding: '16px 16px 8px' }}>
              {PHASES.map((phase, i) => {
                const currentIdx = PHASES.findIndex(p => p.key === selectedOrder.status)
                const isDone = i <= currentIdx
                const isActive = i === currentIdx
                return (
                  <div key={phase.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                      {isDone ? (
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: phase.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isActive
                            ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }} />
                            : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </div>
                      ) : (
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', marginTop: 2 }} />
                      )}
                      {i < PHASES.length - 1 && (
                        <div style={{ width: 2, height: 20, background: i < currentIdx ? phase.color : 'rgba(255,255,255,0.06)', marginTop: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: isDone ? '#fff' : 'rgba(255,255,255,0.3)', display: 'block' }}>{phase.icon} {phase.label}</span>
                      {isActive && <span style={{ fontSize: 10, color: phase.color, fontWeight: 700 }}>Current</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order details */}
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Restaurant</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{selectedOrder.restaurant}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Customer</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{selectedOrder.customer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Driver</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{selectedOrder.driver}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Payment</span>
                <span style={{ color: '#FACC15', fontWeight: 700 }}>{selectedOrder.payment === 'bank' ? 'Bank Transfer' : 'Cash on Delivery'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Total</span>
                <span style={{ color: '#FACC15', fontWeight: 900, fontSize: 16 }}>{fmtRp(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
