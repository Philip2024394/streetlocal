/**
 * SellerOrdersScreen — full seller orders management with order detail view.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { fetchOrders, updateOrderStatus } from '@/services/commerceService'
import { useAuth } from '@/hooks/useAuth'
import styles from './SellerOrdersScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

const STATUS_FLOW = ['awaiting_payment', 'pending', 'confirmed', 'shipped', 'delivered']
const STATUS_COLORS = {
  awaiting_payment: { bg: 'rgba(251,191,36,0.15)', border: '#FBBF24', text: '#FBBF24' },
  pending:          { bg: 'rgba(251,191,36,0.15)', border: '#FBBF24', text: '#FBBF24' },
  confirmed:        { bg: '#8DC63F',               border: '#8DC63F', text: '#fff' },
  shipped:          { bg: '#8DC63F',               border: '#8DC63F', text: '#fff', glow: true },
  delivered:        { bg: 'rgba(52,199,89,0.15)',  border: '#34C759', text: '#34C759' },
  payment_failed:   { bg: '#EF4444',              border: '#EF4444', text: '#fff' },
  rejected:         { bg: 'rgba(239,68,68,0.15)', border: '#EF4444', text: '#EF4444' },
  cancelled:        { bg: 'rgba(239,68,68,0.15)', border: '#EF4444', text: '#EF4444' },
}

const CARRIERS = [
  { id: 'jne',     label: 'JNE',           logo: 'https://ik.imagekit.io/nepgaxllc/sssss-removebg-preview.png' },
  { id: 'jnt',     label: 'J&T Express',   logo: 'https://ik.imagekit.io/nepgaxllc/Untitledsdds-removebg-preview.png' },
  { id: 'sicepat', label: 'SiCepat',       logo: 'https://ik.imagekit.io/nepgaxllc/Untitleddfsfsd-removebg-preview.png' },
  { id: 'ninja',   label: 'Ninja Xpress',  logo: 'https://ik.imagekit.io/nepgaxllc/Untitledddddddss-removebg-preview.png' },
  { id: 'pos',     label: 'Pos Indonesia', logo: 'https://ik.imagekit.io/nepgaxllc/Untitledfffffddsdsdsdfsddasdassdfsdfsdfsd.png' },
  { id: 'anteraja',label: 'Anteraja',      logo: 'https://ik.imagekit.io/nepgaxllc/Untitledvvdasa-removebg-preview.png' },
  { id: 'grab',    label: 'GrabExpress',   logo: null },
  { id: 'gosend',  label: 'GoSend',        logo: null },
  { id: 'indoo',   label: 'Indoo Express', logo: null },
]

const PAYMENT_DEADLINE_HOURS = 72

const now = Date.now()
const DEMO_ORDERS = [
  {
    id: 'o1', orderRef: 'ORD-240417-001', product: 'Nike Air Max 90 Original', image: 'https://picsum.photos/seed/shoe1/200', price: 1250000,
    buyer: 'Ava Mitchell', buyerAvatar: 'https://i.pravatar.cc/80?img=1', buyerAddress: 'Jl. Malioboro No. 52, Yogyakarta 55271',
    buyerPhone: '+6281234567890', qty: 1, total: 1250000, status: 'awaiting_payment', time: '2h ago',
    orderedAt: new Date(now - 2 * 3600000).toISOString(), paymentDeadline: new Date(now - 2 * 3600000 + PAYMENT_DEADLINE_HOURS * 3600000).toISOString(),
    paymentScreenshot: null, paymentMethod: 'Bank Transfer (BCA)', carrier: null, trackingNo: null,
    reminders: { sent48h: false, sent24h: false, sent8h: false },
  },
  {
    id: 'o2', orderRef: 'ORD-240417-002', product: 'Samsung Galaxy Buds Pro', image: 'https://picsum.photos/seed/buds1/200', price: 445000,
    buyer: 'Ravi Gupta', buyerAvatar: 'https://i.pravatar.cc/80?img=11', buyerAddress: 'Jl. Gejayan No. 15, Sleman, Yogyakarta 55281',
    buyerPhone: '+6281234567891', qty: 2, total: 890000, status: 'confirmed', time: '5h ago',
    orderedAt: new Date(now - 5 * 3600000).toISOString(), paymentDeadline: null,
    paymentScreenshot: 'https://picsum.photos/seed/pay2/400/600', paymentMethod: 'QRIS (GoPay)', carrier: null, trackingNo: null,
    reminders: {},
  },
  {
    id: 'o3', orderRef: 'ORD-240416-003', product: 'Batik Shirt Premium Jogja', image: 'https://picsum.photos/seed/batik1/200', price: 340000,
    buyer: 'Maya Patel', buyerAvatar: 'https://i.pravatar.cc/80?img=9', buyerAddress: 'Jl. Prawirotaman No. 8, Yogyakarta 55153',
    buyerPhone: '+6281234567892', qty: 1, total: 340000, status: 'shipped', time: '1d ago',
    orderedAt: new Date(now - 24 * 3600000).toISOString(), paymentDeadline: null,
    paymentScreenshot: 'https://picsum.photos/seed/pay3/400/600', paymentMethod: 'Bank Transfer (Mandiri)', carrier: 'jne', trackingNo: 'JNE9876543210',
    reminders: {},
  },
  {
    id: 'o4', orderRef: 'ORD-240414-004', product: 'Aromatherapy Candle Set', image: 'https://picsum.photos/seed/candle1/200', price: 58333,
    buyer: 'Chloe Brennan', buyerAvatar: 'https://i.pravatar.cc/80?img=5', buyerAddress: 'Jl. Kaliurang Km 12, Sleman 55584',
    buyerPhone: '+6281234567893', qty: 3, total: 175000, status: 'delivered', time: '3d ago',
    orderedAt: new Date(now - 72 * 3600000).toISOString(), paymentDeadline: null,
    paymentScreenshot: null, paymentMethod: 'COD', carrier: 'sicepat', trackingNo: 'SCP1122334455',
    reminders: {},
  },
  {
    id: 'o5', orderRef: 'ORD-240417-005', product: 'Handmade Leather Wallet', image: 'https://picsum.photos/seed/wallet1/200', price: 285000,
    buyer: 'Jordan Lee', buyerAvatar: 'https://i.pravatar.cc/80?img=3', buyerAddress: 'Jl. Seturan No. 22, Depok, Sleman 55281',
    buyerPhone: '+6281234567894', qty: 1, total: 285000, status: 'awaiting_payment', time: '30m ago',
    orderedAt: new Date(now - 64 * 3600000).toISOString(), paymentDeadline: new Date(now - 64 * 3600000 + PAYMENT_DEADLINE_HOURS * 3600000).toISOString(),
    paymentScreenshot: null, paymentMethod: 'Bank Transfer (BRI)', carrier: null, trackingNo: null,
    reminders: { sent48h: true, sent24h: true, sent8h: false },
  },
  {
    id: 'o6', orderRef: 'ORD-240415-006', product: 'Ceramic Vase Handmade', image: 'https://picsum.photos/seed/vase1/200', price: 195000,
    buyer: 'Sam Okafor', buyerAvatar: 'https://i.pravatar.cc/80?img=7', buyerAddress: 'Jl. Sosrowijayan No. 3, Yogyakarta 55271',
    buyerPhone: '+6281234567895', qty: 1, total: 195000, status: 'payment_failed', time: '2d ago',
    orderedAt: new Date(now - 96 * 3600000).toISOString(), paymentDeadline: new Date(now - 24 * 3600000).toISOString(),
    paymentScreenshot: null, paymentMethod: 'Bank Transfer (BNI)', carrier: null, trackingNo: null,
    reminders: { sent48h: true, sent24h: true, sent8h: true },
  },
]

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

function PaymentCountdown({ deadline, onExpired }) {
  const [left, setLeft] = useState('')
  const [phase, setPhase] = useState('normal') // normal | warning | urgent | expired
  useEffect(() => {
    if (!deadline) return
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setLeft('Expired'); setPhase('expired'); onExpired?.(); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLeft(`${h}h ${m}m`)
      if (h < 8) setPhase('urgent')
      else if (h < 24) setPhase('warning')
      else setPhase('normal')
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [deadline])
  return (
    <div className={styles.paymentTimer}>
      <span className={styles.paymentTimerLabel}>Payment due in</span>
      <span className={`${styles.paymentTimerValue} ${phase === 'urgent' ? styles.timerUrgent : phase === 'warning' ? styles.timerWarning : phase === 'expired' ? styles.timerExpired : ''}`}>
        {left}
      </span>
      {phase === 'urgent' && <span className={styles.timerAlert}>Auto-cancel if not paid</span>}
      {phase === 'expired' && <span className={styles.timerAlert}>Payment window closed</span>}
    </div>
  )
}

function ShipCountdown({ orderedAt }) {
  const [left, setLeft] = useState('')
  useEffect(() => {
    const calc = () => {
      const deadline = new Date(orderedAt).getTime() + 48 * 3600000
      const diff = deadline - Date.now()
      if (diff <= 0) { setLeft('Overdue!'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLeft(`${h}h ${m}m`)
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [orderedAt])
  const deadline = new Date(orderedAt).getTime() + 48 * 3600000
  const isUrgent = deadline - Date.now() < 12 * 3600000
  return <span className={`${styles.countdown} ${isUrgent ? styles.countdownUrgent : ''}`}>{left}</span>
}

export default function SellerOrdersScreen({ open, onClose, onOpenChat }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState(DEMO_ORDERS)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [selectedCarrier, setSelectedCarrier] = useState('')
  const [paymentPreview, setPaymentPreview] = useState(null)

  useEffect(() => {
    if (!open || !user?.id) return
    fetchOrders(user.id).then(data => { if (data?.length) setOrders(data) })
  }, [open, user?.id])

  if (!open) return null

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const counts = { all: orders.length, awaiting_payment: orders.filter(o => o.status === 'awaiting_payment').length, pending: orders.filter(o => o.status === 'pending').length, confirmed: orders.filter(o => o.status === 'confirmed').length, shipped: orders.filter(o => o.status === 'shipped').length, delivered: orders.filter(o => o.status === 'delivered').length, payment_failed: orders.filter(o => o.status === 'payment_failed').length, rejected: orders.filter(o => o.status === 'rejected').length, cancelled: orders.filter(o => o.status === 'cancelled').length }

  const advanceOrder = (id, currentStatus) => {
    const nextIdx = STATUS_FLOW.indexOf(currentStatus) + 1
    if (nextIdx >= STATUS_FLOW.length) return
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: STATUS_FLOW[nextIdx] } : o))
  }

  const rejectOrder = (id) => {
    if (!window.confirm('Reject this order? The buyer will be notified.')) return
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected' } : o))
    setSelectedOrder(prev => prev ? { ...prev, status: 'rejected' } : prev)
    updateOrderStatus(id, 'rejected').catch(() => {})
  }

  const cancelOrder = (id) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
    setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev)
    updateOrderStatus(id, 'cancelled').catch(() => {})
  }

  const sendTracking = (orderId) => {
    if (!trackingInput.trim() || !selectedCarrier) return
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'shipped', carrier: selectedCarrier, trackingNo: trackingInput.trim() } : o))
    setSelectedOrder(prev => prev ? { ...prev, status: 'shipped', carrier: selectedCarrier, trackingNo: trackingInput.trim() } : prev)
    setTrackingInput('')
    setSelectedCarrier('')
  }

  const needsShipping = (o) => o.status === 'pending' || o.status === 'confirmed'
  const awaitingPayment = (o) => o.status === 'awaiting_payment'

  // Auto-expire payment
  const handlePaymentExpired = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'payment_failed' } : o))
  }
  const carrierInfo = (id) => CARRIERS.find(c => c.id === id)

  // ── ORDER DETAIL VIEW ──
  if (selectedOrder) {
    const o = selectedOrder
    const color = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending
    const ci = carrierInfo(o.carrier)

    return createPortal(
      <div className={styles.screen}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setSelectedOrder(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <img src={MARKET_LOGO} alt="" className={styles.headerLogo} />
          <h1 className={styles.title}>Order #{o.id.slice(-4)}</h1>
        </div>

        <div className={styles.detail}>
          {/* Status + timers */}
          <div className={styles.detailStatus}>
            <span className={`${styles.detailStatusBadge} ${color.glow ? styles.statusGlow : ''}`} style={{ background: color.bg, color: color.text }}>
              {o.status === 'awaiting_payment' ? 'Awaiting Payment' : o.status === 'payment_failed' ? 'Payment Failed' : o.status === 'rejected' ? 'Rejected' : o.status === 'cancelled' ? 'Cancelled' : o.status}
            </span>
            {needsShipping(o) && <ShipCountdown orderedAt={o.orderedAt} />}
          </div>
          {awaitingPayment(o) && o.paymentDeadline && (
            <PaymentCountdown deadline={o.paymentDeadline} onExpired={() => { handlePaymentExpired(o.id); setSelectedOrder(prev => prev ? { ...prev, status: 'payment_failed' } : prev) }} />
          )}
          {o.orderRef && <span className={styles.orderRef}>Ref: {o.orderRef}</span>}

          {/* Product */}
          <div className={styles.detailProduct}>
            <img src={o.image} alt={o.product} className={styles.detailProductImg} />
            <div className={styles.detailProductInfo}>
              <span className={styles.detailProductName}>{o.product}</span>
              <span className={styles.detailProductPrice}>{fmtRp(o.price)} x {o.qty}</span>
              <span className={styles.detailProductTotal}>Total: {fmtRp(o.total)}</span>
            </div>
          </div>

          {/* Payment proof */}
          <div className={styles.detailSection}>
            <span className={styles.detailSectionTitle}>Payment</span>
            <span className={styles.detailMeta}>{o.paymentMethod}</span>
            <span className={styles.detailMeta}>{new Date(o.orderedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            {o.paymentScreenshot && (
              <button className={styles.paymentThumb} onClick={() => setPaymentPreview(o.paymentScreenshot)}>
                <img src={o.paymentScreenshot} alt="Payment proof" />
                <span className={styles.paymentThumbLabel}>View payment proof</span>
              </button>
            )}
          </div>

          {/* Buyer info */}
          <div className={styles.detailSection}>
            <span className={styles.detailSectionTitle}>Buyer</span>
            <div className={styles.buyerRow}>
              <img src={o.buyerAvatar} alt={o.buyer} className={styles.buyerAvatar} />
              <div className={styles.buyerInfo}>
                <span className={styles.buyerName}>{o.buyer}</span>
                <span className={styles.buyerAddress}>{o.buyerAddress}</span>
                <span className={styles.buyerPhone}>{o.buyerPhone}</span>
              </div>
            </div>
            <button className={styles.chatBtn} onClick={() => onOpenChat?.(o)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Chat with {o.buyer.split(' ')[0]}
            </button>
          </div>

          {/* Shipping / Tracking */}
          {needsShipping(o) && (
            <div className={styles.detailSection}>
              <span className={styles.detailSectionTitle}>Ship this order</span>
              <span className={styles.detailSectionSub}>Select carrier and enter tracking number</span>
              <div className={styles.carrierGrid}>
                {CARRIERS.map(c => (
                  <button key={c.id} className={`${styles.carrierBtn} ${selectedCarrier === c.id ? styles.carrierBtnOn : ''}`} onClick={() => setSelectedCarrier(c.id)}>
                    {c.logo ? <img src={c.logo} alt={c.label} className={styles.carrierLogo} /> : <span className={styles.carrierEmoji}>📦</span>}
                    <span className={styles.carrierLabel}>{c.label}</span>
                  </button>
                ))}
              </div>
              <div className={styles.trackingRow}>
                <input className={styles.trackingInput} value={trackingInput} onChange={e => setTrackingInput(e.target.value)} placeholder="Enter tracking number" />
                <button className={styles.sendTrackingBtn} onClick={() => sendTracking(o.id)} disabled={!trackingInput.trim() || !selectedCarrier}>
                  Send Tracking
                </button>
              </div>
            </div>
          )}

          {/* Existing tracking */}
          {o.trackingNo && (
            <div className={styles.detailSection}>
              <span className={styles.detailSectionTitle}>Tracking</span>
              <div className={styles.trackingDisplay}>
                {ci?.logo && <img src={ci.logo} alt={ci.label} className={styles.trackingCarrierLogo} />}
                <div>
                  <span className={styles.trackingCarrier}>{ci?.label ?? 'Carrier'}</span>
                  <span className={styles.trackingNumber}>{o.trackingNo}</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm button for pending */}
          {o.status === 'pending' && (
            <button className={styles.confirmBtn} onClick={() => { advanceOrder(o.id, 'pending'); setSelectedOrder(prev => ({ ...prev, status: 'confirmed' })) }}>
              Confirm Order
            </button>
          )}

          {/* Reject button for pending orders */}
          {o.status === 'pending' && (
            <button
              style={{
                width: '100%', padding: '14px 0', marginTop: 8,
                background: 'transparent', border: '1.5px solid rgba(239,68,68,0.4)',
                borderRadius: 14, color: '#EF4444', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => rejectOrder(o.id)}
            >
              Reject Order
            </button>
          )}

          {/* Cancel button for confirmed orders */}
          {o.status === 'confirmed' && (
            <button
              style={{
                width: '100%', padding: '14px 0', marginTop: 12,
                background: 'transparent', border: '1.5px solid rgba(239,68,68,0.4)',
                borderRadius: 14, color: '#EF4444', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => cancelOrder(o.id)}
            >
              Cancel Order
            </button>
          )}
        </div>

        {/* Payment proof preview modal */}
        {paymentPreview && (
          <div className={styles.previewOverlay} onClick={() => setPaymentPreview(null)}>
            <img src={paymentPreview} alt="Payment proof" className={styles.previewImg} />
          </div>
        )}
      </div>,
      document.body
    )
  }

  // ── ORDER LIST VIEW ──
  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="" className={styles.headerLogo} />
        <h1 className={styles.title}>My Orders</h1>
      </div>

      <div className={styles.tabs}>
        {['all', 'awaiting_payment', 'pending', 'confirmed', 'shipped', 'delivered', 'rejected', 'cancelled', 'payment_failed'].map(t => (
          <button key={t} className={`${styles.tab} ${filter === t ? styles.tabActive : ''}`} onClick={() => setFilter(t)}>
            {t === 'all' ? 'All' : t === 'awaiting_payment' ? 'Awaiting Pay' : t === 'payment_failed' ? 'Failed' : t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && <div className={styles.empty}>No orders</div>}
        {filtered.map(order => {
          const color = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
          return (
            <button key={order.id} className={styles.card} onClick={() => { setSelectedOrder(order); setTrackingInput(''); setSelectedCarrier(order.carrier || '') }}>
              <img src={order.image} alt="" className={styles.cardThumb} />
              <div className={styles.cardBody}>
                <span className={styles.cardProduct}>{order.product}</span>
                <span className={styles.cardMeta}>{order.buyer} · Qty: {order.qty}</span>
                <span className={styles.cardTotal}>{fmtRp(order.total)}</span>
              </div>
              <div className={styles.cardRight}>
                <span className={`${styles.cardStatus} ${color.glow ? styles.statusGlow : ''}`} style={{ background: color.bg, borderColor: color.border, color: color.text }}>
                  {order.status === 'awaiting_payment' ? 'Awaiting Pay' : order.status === 'payment_failed' ? 'Failed' : order.status === 'rejected' ? 'Rejected' : order.status === 'cancelled' ? 'Cancelled' : order.status}
                </span>
                {awaitingPayment(order) && order.paymentDeadline && (
                  <PaymentCountdown deadline={order.paymentDeadline} onExpired={() => handlePaymentExpired(order.id)} />
                )}
                {needsShipping(order) && (
                  <span className={styles.shipBadge}>Ship now</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  )
}
