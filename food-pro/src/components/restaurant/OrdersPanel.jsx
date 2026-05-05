import { createPortal } from 'react-dom'
import { fmtRp, STATUS_COLORS, STATUS_LABELS } from './menuSheetConstants'

// Demo driver data per order
const DEMO_DRIVERS = {
  'FOOD-': { name: 'Agus Prasetyo', photo: 'https://i.pravatar.cc/60?img=12', rating: 4.9 },
}
function getDriver(orderId) {
  const seed = orderId?.replace(/\D/g, '') ?? '1'
  const imgId = (parseInt(seed, 10) % 50) + 1
  const names = ['Agus Prasetyo', 'Budi Santoso', 'Rizky Ramadhan', 'Wawan Setiawan', 'Deni Pratama', 'Yanto Wijaya']
  return {
    name: names[imgId % names.length],
    photo: `https://i.pravatar.cc/60?img=${imgId}`,
    rating: (4.5 + (imgId % 5) * 0.1).toFixed(1),
  }
}

export default function OrdersPanel({
  foodOrders,
  onClose,
  onCancelOrder,
  onReviewOrder,
  onReorder,
}) {
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9800,
      backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png?updatedAt=1776728649363)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#000',
      display: 'flex', flexDirection: 'column', isolation: 'isolate',
    }}>
      {/* Glass overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#EF4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>My Orders</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', display: 'block' }}>{foodOrders.length} order{foodOrders.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Orders list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px', position: 'relative', zIndex: 1 }}>
        {foodOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No orders yet — your first meal awaits</div>
        ) : foodOrders.map(order => {
          const driver = getDriver(order.id)
          const isDelivered = order.status === 'delivered' || order.status === 'completed' || order.status === 'driver_assigned'
          const reviewed = JSON.parse(localStorage.getItem('indoo_food_reviews') || '[]').some(r => r.order_id === order.id)
          return (
            <div key={order.id} style={{
              padding: 14, borderRadius: 16, marginBottom: 12,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              {/* Restaurant + status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{order.restaurant}</span>
                <span style={{
                  fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 6,
                  background: `${STATUS_COLORS[order.status] ?? '#666'}20`,
                  color: STATUS_COLORS[order.status] ?? '#666',
                  border: `1px solid ${STATUS_COLORS[order.status] ?? '#666'}40`,
                }}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 10 }}>
                {order.items.map((it, idx) => (
                  <div key={idx} style={{ marginBottom: it.extras?.length > 0 || it.note ? 6 : 0 }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1.7 }}>{it.qty}x {it.name}</span>
                    {it.extras?.length > 0 && (
                      <span style={{ fontSize: 14, color: '#8DC63F', display: 'block', paddingLeft: 16, lineHeight: 1.5 }}>+ {it.extras.map(e => `${e.label} x${e.qty}`).join(', ')}</span>
                    )}
                    {it.note && (
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', display: 'block', paddingLeft: 16, fontStyle: 'italic', lineHeight: 1.5 }}>"{it.note}"</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Total + date */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(order.total)}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Driver info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                <img src={driver.photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8DC63F' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{driver.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 13, color: '#FACC15' }}>★</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>{driver.rating}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>Driver</span>
                  </div>
                </div>
                <img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531" alt="" style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.4 }} />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Cancel */}
                {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                  <button onClick={() => onCancelOrder(order.id)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}

                {/* Review */}
                {isDelivered && !reviewed && (
                  <button onClick={() => onReviewOrder(order)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', color: '#FACC15', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    ★ Rate Order
                  </button>
                )}

                {/* Reorder */}
                {isDelivered && onReorder && (
                  <button onClick={() => onReorder(order.items)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
                    🔄 Order Again
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  )
}
