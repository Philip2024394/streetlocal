import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import imgError from '../imgFallback'
import {
  subscribeToRestaurantOrders,
  updateFoodOrderStatus,
} from '@/services/foodOrderService'
import { getDeliveryZones, saveDeliveryZones } from '@/services/deliveryZoneService'

// ── Notification sound (plays when new order arrives) ────────────────────────
function playOrderSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Play 3 beeps
    const playBeep = (time) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.value = 0.3
      osc.start(ctx.currentTime + time)
      osc.stop(ctx.currentTime + time + 0.15)
    }
    playBeep(0)
    playBeep(0.25)
    playBeep(0.5)
  } catch {}
}

// Request notification permission on load
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function showOrderNotification(order) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const items = (order.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')
    new Notification('🔔 New Order!', {
      body: `${order.customer_name || 'Customer'} — ${items}`,
      icon: '/favicon.ico',
      tag: order.id,
      requireInteraction: true,
    })
  }
}

// Order management helpers using original service
async function getRestaurantOrders(restaurantId) {
  if (!supabase || !restaurantId) return []
  const { data } = await supabase.from('food_orders').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(100)
  return data || []
}
async function confirmOrder(orderId) {
  if (!supabase) return
  await supabase.from('food_orders').update({ status: 'confirmed', payment_confirmed_at: new Date().toISOString() }).eq('id', orderId)
}
async function markOnTheWay(orderId) {
  if (!supabase) return
  await supabase.from('food_orders').update({ status: 'picked_up' }).eq('id', orderId)
}
async function markDelivered(orderId) {
  if (!supabase) return
  await supabase.from('food_orders').update({ status: 'delivered' }).eq('id', orderId)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtRp(n) { return `Rp ${Number(n || 0).toLocaleString('id-ID')}` }
function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'inherit', fontSize: 14 },
  container: { maxWidth: 800, margin: '0 auto', padding: '16px 12px' },
  tabs: { display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' },
  tab: { padding: '10px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  tabActive: { background: 'rgba(141,198,63,0.15)', color: '#8DC63F', border: '1px solid rgba(141,198,63,0.3)' },
  card: { background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 },
  label: { display: 'block', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: { padding: '12px 20px', borderRadius: 12, border: 'none', background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSmall: { padding: '8px 14px', borderRadius: 10, border: 'none', background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnOutline: { padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(141,198,63,0.3)', background: 'rgba(141,198,63,0.08)', color: '#8DC63F', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  statusBadge: { padding: '4px 10px', borderRadius: 8, fontSize: 14, fontWeight: 700, textTransform: 'capitalize' },
  toast: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: 12, background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 800, zIndex: 9999 },
  empty: { textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.35)', fontSize: 14 },
  toggle: (active) => ({ width: 48, height: 26, borderRadius: 13, border: 'none', background: active ? '#8DC63F' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }),
  toggleDot: (active) => ({ position: 'absolute', top: 3, left: active ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }),
}

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  on_the_way: '#06B6D4',
  delivered: '#10B981',
  cancelled: '#EF4444',
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const DEMO_DRIVERS = [
  { id: 'd1', name: 'Pak Andi', phone: '6281234567001', vehicle: 'Honda Beat', plate: 'AB 1234 CD', rating: 4.8, trips: 342, area: 'Malioboro', online: true, photo: 'https://i.pravatar.cc/100?img=11' },
  { id: 'd2', name: 'Mas Budi', phone: '6281234567002', vehicle: 'Yamaha NMAX', plate: 'AB 5678 EF', rating: 4.6, trips: 218, area: 'Kaliurang', online: true, photo: 'https://i.pravatar.cc/100?img=12' },
  { id: 'd3', name: 'Pak Joko', phone: '6281234567003', vehicle: 'Honda Vario', plate: 'AB 9012 GH', rating: 4.9, trips: 567, area: 'Prawirotaman', online: false, photo: 'https://i.pravatar.cc/100?img=13' },
  { id: 'd4', name: 'Mas Dedi', phone: '6281234567004', vehicle: 'Yamaha Aerox', plate: 'AB 3456 IJ', rating: 4.7, trips: 156, area: 'Condongcatur', online: true, photo: 'https://i.pravatar.cc/100?img=14' },
  { id: 'd5', name: 'Pak Rudi', phone: '6281234567005', vehicle: 'Honda PCX', plate: 'AB 7890 KL', rating: 4.5, trips: 89, area: 'Gejayan', online: true, photo: 'https://i.pravatar.cc/100?img=15' },
]

export default function VendorPanel({ restaurantId: propRestaurantId }) {
  const [restaurantId, setRestaurantId] = useState(propRestaurantId || null)
  const [restaurant, setRestaurant] = useState(null)
  const [tab, setTab] = useState('orders')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  // Orders
  const [orders, setOrders] = useState([])

  // Menu
  const [menuItems, setMenuItems] = useState([])
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [menuForm, setMenuForm] = useState({ name: '', price: '', category: 'Main', photo_url: '', description: '' })

  // Delivery Zones
  const [zones, setZones] = useState([])
  const [showZoneForm, setShowZoneForm] = useState(false)
  const [zoneForm, setZoneForm] = useState({ zone_name: '', radius_km: '', delivery_fee: '' })

  // Promos
  const [promos, setPromos] = useState([])
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [promoForm, setPromoForm] = useState({ message: '', expiry: '' })

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  // ── Resolve restaurant ID ──────────────────────────────────────────────────
  useEffect(() => {
    if (propRestaurantId) { setRestaurantId(propRestaurantId); return }
    // Try URL params
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('restaurantId') || params.get('rid')
    if (fromUrl) { setRestaurantId(fromUrl); return }
    // Try localStorage
    const stored = localStorage.getItem('indoo_vendor_restaurant_id')
    if (stored) { setRestaurantId(stored); return }
    setLoading(false)
  }, [propRestaurantId])

  // ── Load restaurant data ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!restaurantId || !supabase) { setLoading(false); return }
    setLoading(true)

    // Restaurant info
    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .maybeSingle()
    if (rest) setRestaurant(rest)

    // Menu items
    const { data: items } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
    if (items) setMenuItems(items)

    // Delivery zones
    const zoneData = await getDeliveryZones(restaurantId)
    setZones(zoneData)

    // Orders
    const orderData = await getRestaurantOrders(restaurantId)
    setOrders(orderData)

    // Promos from localStorage
    try {
      const savedPromos = JSON.parse(localStorage.getItem(`indoo_promos_${restaurantId}`) || '[]')
      setPromos(savedPromos)
    } catch { /* ignore */ }

    setLoading(false)
  }, [restaurantId])

  useEffect(() => { loadData() }, [loadData])

  // ── Request notification permission on mount ────────────────────────────────
  useEffect(() => { requestNotificationPermission() }, [])

  // ── Subscribe to orders (with sound + notification) ────────────────────────
  useEffect(() => {
    if (!restaurantId) return
    const unsub = subscribeToRestaurantOrders(restaurantId, (newOrder) => {
      setOrders(prev => {
        const idx = prev.findIndex(o => o.id === newOrder.id)
        if (idx === -1) {
          // NEW order — play sound + show notification
          playOrderSound()
          showOrderNotification(newOrder)
          return [newOrder, ...prev]
        }
        const next = [...prev]
        next[idx] = newOrder
        return next
      })
    })
    return unsub
  }, [restaurantId])

  // ══════════════════════════════════════════════════════════════════════════════
  // ORDER ACTIONS
  // ══════════════════════════════════════════════════════════════════════════════
  const handleConfirm = async (orderId) => {
    await confirmOrder(orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed' } : o))
    showToast('Order confirmed')
  }

  const handlePreparing = async (orderId) => {
    // Mark as preparing (reuse confirmOrder or direct update)
    if (supabase) {
      await supabase.from('food_orders').update({ status: 'preparing' }).eq('id', orderId)
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o))
    showToast('Marked as preparing')
  }

  const handleOnTheWay = async (orderId) => {
    await markOnTheWay(orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'on_the_way' } : o))
    showToast('Marked on the way')
  }

  const handleDelivered = async (orderId) => {
    await markDelivered(orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
    showToast('Order delivered')
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MENU ACTIONS
  // ══════════════════════════════════════════════════════════════════════════════
  const openMenuEditor = (item = null) => {
    if (item) {
      setEditingItem(item)
      setMenuForm({ name: item.name || '', price: String(item.price || ''), category: item.category || 'Main', photo_url: item.photo_url || '', description: item.description || '' })
    } else {
      setEditingItem(null)
      setMenuForm({ name: '', price: '', category: 'Main', photo_url: '', description: '' })
    }
    setShowMenuForm(true)
  }

  const saveMenuItem = async () => {
    if (!menuForm.name.trim() || !menuForm.price) return showToast('Name and price required')
    if (!supabase) return

    const payload = {
      restaurant_id: restaurantId,
      name: menuForm.name.trim(),
      price: Number(menuForm.price),
      category: menuForm.category || 'Main',
      photo_url: menuForm.photo_url || null,
      description: menuForm.description || null,
      is_available: true,
    }

    if (editingItem?.id) {
      await supabase.from('menu_items').update(payload).eq('id', editingItem.id)
      setMenuItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i))
    } else {
      const { data } = await supabase.from('menu_items').insert(payload).select().single()
      if (data) setMenuItems(prev => [data, ...prev])
    }
    setShowMenuForm(false)
    showToast('Menu item saved')
  }

  const deleteMenuItem = async (id) => {
    if (!supabase) return
    await supabase.from('menu_items').delete().eq('id', id)
    setMenuItems(prev => prev.filter(i => i.id !== id))
    showToast('Item deleted')
  }

  const toggleAvailable = async (item) => {
    const next = !item.is_available
    if (supabase) await supabase.from('menu_items').update({ is_available: next }).eq('id', item.id)
    setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: next } : i))
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DELIVERY ZONE ACTIONS
  // ══════════════════════════════════════════════════════════════════════════════
  const addZone = () => {
    if (!zoneForm.zone_name.trim() || !zoneForm.radius_km || !zoneForm.delivery_fee && zoneForm.delivery_fee !== '0' && zoneForm.delivery_fee !== 0) {
      return showToast('Fill all zone fields')
    }
    const newZone = {
      zone_name: zoneForm.zone_name.trim(),
      radius_km: Number(zoneForm.radius_km),
      delivery_fee: Number(zoneForm.delivery_fee),
      is_active: true,
    }
    const updated = [...zones, newZone]
    setZones(updated)
    saveDeliveryZones(restaurantId, updated)
    setZoneForm({ zone_name: '', radius_km: '', delivery_fee: '' })
    setShowZoneForm(false)
    showToast('Zone added')
  }

  const deleteZone = (idx) => {
    const updated = zones.filter((_, i) => i !== idx)
    setZones(updated)
    saveDeliveryZones(restaurantId, updated)
    showToast('Zone removed')
  }

  const toggleZone = (idx) => {
    const updated = zones.map((z, i) => i === idx ? { ...z, is_active: !z.is_active } : z)
    setZones(updated)
    saveDeliveryZones(restaurantId, updated)
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PROMO ACTIONS
  // ══════════════════════════════════════════════════════════════════════════════
  const addPromo = () => {
    if (!promoForm.message.trim()) return showToast('Enter a promo message')
    const newPromo = { id: Date.now(), message: promoForm.message.trim(), expiry: promoForm.expiry || null, createdAt: new Date().toISOString() }
    const updated = [newPromo, ...promos]
    setPromos(updated)
    localStorage.setItem(`indoo_promos_${restaurantId}`, JSON.stringify(updated))
    setPromoForm({ message: '', expiry: '' })
    setShowPromoForm(false)
    showToast('Promo added')
  }

  const deletePromo = (id) => {
    const updated = promos.filter(p => p.id !== id)
    setPromos(updated)
    localStorage.setItem(`indoo_promos_${restaurantId}`, JSON.stringify(updated))
    showToast('Promo removed')
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SETTINGS ACTIONS
  // ══════════════════════════════════════════════════════════════════════════════
  const toggleOpen = async () => {
    if (!supabase || !restaurantId) return
    const next = !restaurant?.is_open
    await supabase.from('restaurants').update({ is_open: next }).eq('id', restaurantId)
    setRestaurant(prev => ({ ...prev, is_open: next }))
    showToast(next ? 'Store is now OPEN' : 'Store is now CLOSED')
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  if (loading) return <div style={s.page}><div style={{ ...s.container, ...s.empty }}>Loading...</div></div>
  if (!restaurantId) return <div style={s.page}><div style={{ ...s.container, ...s.empty }}>No restaurant ID found. Pass restaurantId as prop, URL param, or set in localStorage.</div></div>

  const TABS = [
    { id: 'orders', label: 'Orders' },
    { id: 'menu', label: 'Menu' },
    { id: 'zones', label: 'Delivery Zones' },
    { id: 'promos', label: 'Promos' },
    { id: 'settings', label: 'Settings' },
    { id: 'drivers', label: 'Driver Fleet' },
  ]

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>
            {restaurant?.name || 'Vendor Panel'}
          </h1>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {restaurant?.is_open ? 'OPEN' : 'CLOSED'}
          </span>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ paddingTop: 16 }}>

          {/* ════════════════════════════════════════════════════════════════════
              TAB: ORDERS
          ════════════════════════════════════════════════════════════════════ */}
          {tab === 'orders' && (
            <div>
              {orders.length === 0 && <div style={s.empty}>No orders yet.</div>}
              {orders
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(order => (
                <div key={order.id} style={s.card}>
                  {/* Top row: ref + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                      {order.cash_ref || `#${String(order.id).slice(-6)}`}
                    </span>
                    <span style={{ ...s.statusBadge, background: `${STATUS_COLORS[order.status] || '#666'}22`, color: STATUS_COLORS[order.status] || '#999' }}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer */}
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                    Customer: <strong style={{ color: '#fff' }}>{order.customer_name || 'Guest'}</strong>
                    <span style={{ marginLeft: 10, fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>{timeAgo(order.created_at)}</span>
                  </div>

                  {/* Items */}
                  <div style={{ marginBottom: 8 }}>
                    {(order.items || []).map((it, i) => (
                      <div key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', padding: '2px 0' }}>
                        {it.qty}x {it.name} - {fmtRp(it.price * it.qty)}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', marginBottom: 10 }}>
                    Total: {fmtRp(order.total || order.subtotal)}
                  </div>

                  {/* Payment proof for transfer orders */}
                  {order.payment_method === 'transfer' && order.payment_screenshot_url && order.status === 'pending' && (
                    <div style={{ marginBottom: 10 }}>
                      <a href={order.payment_screenshot_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#8DC63F', textDecoration: 'underline' }}>
                        View Payment Proof
                      </a>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {order.status === 'pending' && (
                      <button onClick={() => handleConfirm(order.id)} style={s.btnSmall}>Confirm</button>
                    )}
                    {order.status === 'confirmed' && (
                      <button onClick={() => handlePreparing(order.id)} style={s.btnSmall}>Preparing</button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => handleOnTheWay(order.id)} style={s.btnSmall}>On The Way</button>
                    )}
                    {order.status === 'on_the_way' && (
                      <button onClick={() => handleDelivered(order.id)} style={s.btnSmall}>Delivered</button>
                    )}
                    {order.status === 'delivered' && (
                      <span style={{ fontSize: 14, color: '#10B981', fontWeight: 700 }}>Completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB: MENU
          ════════════════════════════════════════════════════════════════════ */}
          {tab === 'menu' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Menu Items ({menuItems.length})</span>
                <button onClick={() => openMenuEditor(null)} style={s.btn}>+ Add Item</button>
              </div>

              {menuItems.length === 0 && <div style={s.empty}>No menu items yet. Add your first item.</div>}

              {menuItems.map(item => (
                <div key={item.id} style={{ ...s.card, display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* Photo */}
                  {item.photo_url && (
                    <img src={item.photo_url} alt={item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} onError={imgError('food')} />
                  )}
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: 14, color: '#8DC63F', fontWeight: 700 }}>{fmtRp(item.price)}</div>
                    {item.category && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{item.category}</div>}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => toggleAvailable(item)} style={s.toggle(item.is_available)}>
                      <span style={s.toggleDot(item.is_available)} />
                    </button>
                    <button onClick={() => openMenuEditor(item)} style={s.btnOutline}>Edit</button>
                    <button onClick={() => deleteMenuItem(item.id)} style={{ ...s.btnDanger, padding: '8px 10px' }}>X</button>
                  </div>
                </div>
              ))}

              {/* Menu Form Modal */}
              {showMenuForm && (
                <div onClick={() => setShowMenuForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{editingItem ? 'Edit Item' : 'Add Item'}</h3>

                    <div>
                      <label style={s.label}>Name *</label>
                      <input style={s.input} value={menuForm.name} onChange={e => setMenuForm(f => ({ ...f, name: e.target.value }))} placeholder="Nasi Goreng Spesial" />
                    </div>
                    <div>
                      <label style={s.label}>Price (Rp) *</label>
                      <input style={s.input} type="number" value={menuForm.price} onChange={e => setMenuForm(f => ({ ...f, price: e.target.value }))} placeholder="25000" />
                    </div>
                    <div>
                      <label style={s.label}>Category</label>
                      <select style={{ ...s.input, appearance: 'auto' }} value={menuForm.category} onChange={e => setMenuForm(f => ({ ...f, category: e.target.value }))}>
                        {['Main', 'Sides', 'Drinks', 'Snacks', 'Desserts'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Photo URL</label>
                      <input style={s.input} value={menuForm.photo_url} onChange={e => setMenuForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div>
                      <label style={s.label}>Description</label>
                      <input style={s.input} value={menuForm.description} onChange={e => setMenuForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description..." />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      <button onClick={saveMenuItem} style={s.btn}>Save</button>
                      <button onClick={() => setShowMenuForm(false)} style={{ ...s.btnOutline, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB: DELIVERY ZONES
          ════════════════════════════════════════════════════════════════════ */}
          {tab === 'zones' && (
            <div>
              {/* Header + actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Delivery Zones</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => {
                    const standard = [
                      { zone_name: 'Free Delivery', radius_km: 2, delivery_fee: 0, is_active: true },
                      { zone_name: '0-5 km', radius_km: 5, delivery_fee: 5000, is_active: true },
                      { zone_name: '5-10 km', radius_km: 10, delivery_fee: 8000, is_active: true },
                      { zone_name: '10-15 km', radius_km: 15, delivery_fee: 12000, is_active: true },
                      { zone_name: '15-25 km', radius_km: 25, delivery_fee: 20000, is_active: true },
                    ]
                    setZones(standard)
                    saveDeliveryZones(restaurantId, standard)
                    showToast('Reset to Yogyakarta standard rates')
                  }} style={s.btnOutline}>Reset to Standard</button>
                  <button onClick={() => setShowZoneForm(true)} style={s.btn}>+ Add Zone</button>
                </div>
              </div>

              {/* Indonesian standard rates info */}
              <div style={{ ...s.card, background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA', marginBottom: 8 }}>Yogyakarta Standard Delivery Rates (Kemenhub)</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                  Based on Indonesian Ministry of Transport (Kemenhub) motorcycle delivery rates for DIY Yogyakarta zone:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Distance</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Standard Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['0-2 km', 'FREE (base)'],
                      ['0-5 km', 'Rp 5,000'],
                      ['5-10 km', 'Rp 8,000'],
                      ['10-15 km', 'Rp 12,000'],
                      ['15-25 km', 'Rp 20,000'],
                    ].map(([dist, rate]) => (
                      <tr key={dist}>
                        <td style={{ padding: '6px 10px', fontSize: 14, color: '#fff' }}>{dist}</td>
                        <td style={{ padding: '6px 10px', fontSize: 14, color: '#8DC63F', fontWeight: 700, textAlign: 'right' }}>{rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>
                  Tap "Reset to Standard" to apply these rates. You can customise individual zones or set your own free delivery radius.
                </div>
              </div>

              {/* Current zones */}
              {zones.length === 0 && (
                <div style={s.card}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    No delivery zones configured. Tap "Reset to Standard" to use Yogyakarta rates, or add custom zones.
                  </div>
                </div>
              )}

              {zones.map((zone, idx) => (
                <div key={idx} style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 12, opacity: zone.is_active ? 1 : 0.5 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{zone.zone_name}</span>
                      {zone.delivery_fee === 0 && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontSize: 14, fontWeight: 700 }}>FREE</span>}
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      Radius: {zone.radius_km} km | Fee: {zone.delivery_fee === 0 ? 'FREE' : fmtRp(zone.delivery_fee)}
                    </div>
                  </div>
                  {/* Edit fee inline */}
                  <input
                    type="number"
                    value={zone.delivery_fee}
                    onChange={e => {
                      const updated = zones.map((z, i) => i === idx ? { ...z, delivery_fee: Number(e.target.value) } : z)
                      setZones(updated)
                      saveDeliveryZones(restaurantId, updated)
                    }}
                    style={{ width: 80, padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, textAlign: 'right', fontFamily: 'inherit' }}
                  />
                  <button onClick={() => toggleZone(idx)} style={s.toggle(zone.is_active)}>
                    <span style={s.toggleDot(zone.is_active)} />
                  </button>
                  <button onClick={() => deleteZone(idx)} style={{ ...s.btnDanger, padding: '8px 10px' }}>X</button>
                </div>
              ))}

              {/* Free delivery radius shortcut */}
              <div style={{ ...s.card, marginTop: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Free Delivery Radius</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                  Set radius for free delivery. Orders within this distance pay no delivery fee.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[1, 2, 3, 5, 7, 10].map(km => {
                    const freeZone = zones.find(z => z.delivery_fee === 0)
                    const isSelected = freeZone?.radius_km === km
                    return (
                      <button key={km} onClick={() => {
                        let updated
                        const existingFreeIdx = zones.findIndex(z => z.delivery_fee === 0)
                        if (existingFreeIdx >= 0) {
                          updated = zones.map((z, i) => i === existingFreeIdx ? { ...z, radius_km: km, zone_name: `Free Delivery (${km}km)` } : z)
                        } else {
                          updated = [{ zone_name: `Free Delivery (${km}km)`, radius_km: km, delivery_fee: 0, is_active: true }, ...zones]
                        }
                        setZones(updated)
                        saveDeliveryZones(restaurantId, updated)
                        showToast(`Free delivery set to ${km} km`)
                      }} style={{
                        padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        border: isSelected ? '2px solid #8DC63F' : '2px solid #333',
                        background: isSelected ? 'rgba(141,198,63,0.1)' : 'rgba(0,0,0,0.6)',
                        color: isSelected ? '#8DC63F' : '#fff', fontSize: 14, fontWeight: 700,
                      }}>
                        {km} km
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Add Zone Form */}
              {showZoneForm && (
                <div style={{ ...s.card, marginTop: 12 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>Add Custom Zone</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={s.label}>Zone Name</label>
                      <input style={s.input} value={zoneForm.zone_name} onChange={e => setZoneForm(f => ({ ...f, zone_name: e.target.value }))} placeholder="e.g. Extended (10-20km)" />
                    </div>
                    <div>
                      <label style={s.label}>Radius (km)</label>
                      <input style={s.input} type="number" value={zoneForm.radius_km} onChange={e => setZoneForm(f => ({ ...f, radius_km: e.target.value }))} placeholder="e.g. 10" />
                    </div>
                    <div>
                      <label style={s.label}>Delivery Fee (Rp) — use 0 for free</label>
                      <input style={s.input} type="number" value={zoneForm.delivery_fee} onChange={e => setZoneForm(f => ({ ...f, delivery_fee: e.target.value }))} placeholder="e.g. 8000" />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={addZone} style={s.btn}>Save Zone</button>
                      <button onClick={() => setShowZoneForm(false)} style={{ ...s.btnOutline, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB: PROMOS
          ════════════════════════════════════════════════════════════════════ */}
          {tab === 'promos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Promotions</span>
                <button onClick={() => setShowPromoForm(true)} style={s.btn}>+ Add Promo</button>
              </div>

              {promos.length === 0 && <div style={s.empty}>No active promotions.</div>}

              {promos.map(promo => (
                <div key={promo.id} style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{promo.message}</div>
                    {promo.expiry && (
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                        Expires: {new Date(promo.expiry).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deletePromo(promo.id)} style={{ ...s.btnDanger, padding: '8px 10px' }}>X</button>
                </div>
              ))}

              {/* Promo Form */}
              {showPromoForm && (
                <div style={{ ...s.card, marginTop: 12 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>New Promotion</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={s.label}>Promo Message</label>
                      <input style={s.input} value={promoForm.message} onChange={e => setPromoForm(f => ({ ...f, message: e.target.value }))} placeholder="e.g. Free delivery this weekend!" />
                    </div>
                    <div>
                      <label style={s.label}>Expiry Date (optional)</label>
                      <input style={s.input} type="date" value={promoForm.expiry} onChange={e => setPromoForm(f => ({ ...f, expiry: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={addPromo} style={s.btn}>Save Promo</button>
                      <button onClick={() => setShowPromoForm(false)} style={{ ...s.btnOutline, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB: SETTINGS
          ════════════════════════════════════════════════════════════════════ */}
          {tab === 'settings' && (
            <div>
              {/* Open/Closed toggle */}
              <div style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Store Status</div>
                  <div style={{ fontSize: 14, color: restaurant?.is_open ? '#8DC63F' : '#EF4444', fontWeight: 700 }}>
                    {restaurant?.is_open ? 'OPEN - Accepting Orders' : 'CLOSED'}
                  </div>
                </div>
                <button onClick={toggleOpen} style={s.toggle(restaurant?.is_open)}>
                  <span style={s.toggleDot(restaurant?.is_open)} />
                </button>
              </div>

              {/* Restaurant info */}
              <div style={s.card}>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>Restaurant Info</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={s.label}>Name</label>
                    <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{restaurant?.name || '-'}</div>
                  </div>
                  <div>
                    <label style={s.label}>Phone</label>
                    <div style={{ fontSize: 14, color: '#fff' }}>{restaurant?.phone || '-'}</div>
                  </div>
                  <div>
                    <label style={s.label}>Address</label>
                    <div style={{ fontSize: 14, color: '#fff' }}>{restaurant?.address || '-'}</div>
                  </div>
                  <div>
                    <label style={s.label}>WhatsApp</label>
                    <div style={{ fontSize: 14, color: '#fff' }}>{restaurant?.phone || '-'}</div>
                  </div>
                  {restaurant?.slug && (
                    <div>
                      <label style={s.label}>Public Page</label>
                      <a href={`https://${restaurant.slug}.indoo.id`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#8DC63F', textDecoration: 'underline' }}>
                        {restaurant.slug}.indoo.id
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB: DRIVER FLEET
          ════════════════════════════════════════════════════════════════════ */}
          {tab === 'drivers' && (() => {
            const sortedDrivers = [...DEMO_DRIVERS].sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
            const onlineCount = DEMO_DRIVERS.filter(d => d.online).length
            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                    Available Drivers <span style={{ color: '#8DC63F' }}>({onlineCount} online)</span>
                  </span>
                </div>

                {sortedDrivers.map(driver => (
                  <div key={driver.id} style={{ ...s.card, display: 'flex', gap: 14, alignItems: 'center', opacity: driver.online ? 1 : 0.45 }}>
                    {/* Photo */}
                    <img src={driver.photo} alt={driver.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: driver.online ? '2px solid #8DC63F' : '2px solid #555' }} onError={imgError('logo')} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{driver.name}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                          background: driver.online ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: driver.online ? '#10B981' : '#EF4444',
                        }}>
                          {driver.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>
                        {driver.vehicle} — <span style={{ color: 'rgba(255,255,255,0.4)' }}>{driver.plate}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                        <span style={{ color: '#F59E0B' }}>{'★'.repeat(Math.round(driver.rating))} {driver.rating}</span>
                        <span>{driver.trips} trips</span>
                        <span>{driver.area}</span>
                      </div>
                    </div>

                    {/* Book button */}
                    {driver.online && (
                      <button onClick={() => {
                        window.open(`https://wa.me/${driver.phone}?text=${encodeURIComponent(`Hi ${driver.name}, we have a delivery order. Pickup: ${restaurant?.address || '[restaurant address]'}. Details to follow.`)}`, '_blank')
                      }} style={s.btnSmall}>
                        Book
                      </button>
                    )}
                  </div>
                ))}

                {/* Rate note */}
                <div style={{ ...s.card, background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)', marginTop: 8 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                    Suggested delivery rate: <strong style={{ color: '#60A5FA' }}>Rp 2,500/km</strong> (Kemenhub Yogyakarta standard)
                  </div>
                </div>
              </div>
            )
          })()}

        </div>
      </div>

      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}
