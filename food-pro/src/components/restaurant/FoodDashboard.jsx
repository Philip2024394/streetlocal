/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FoodDashboard — Customer food module dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. Active promos with countdown timers (drives orders)
 * 2. Order history with reorder button
 * 3. Favourite restaurants (auto from 2+ orders)
 * 4. Saved addresses
 * 5. Spending summary
 */
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getFoodOrders } from './menuSheetConstants'
import { getSavedAddresses, getLocalDefaultAddress } from '@/services/addressService'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

// ── Demo promos (live: fetched from Supabase per restaurant) ─────────────────
const DEMO_PROMOS = [
  { id: 'p1', restaurant: 'Warung Sari Rasa', dish: 'Nasi Goreng Spesial', discount: '30%', endsAt: Date.now() + 2 * 60 * 60 * 1000, img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2002_07_07%20AM.png?updatedAt=1776539245009' },
  { id: 'p2', restaurant: 'Bakso Mas Kumis', dish: 'Bakso Urat Jumbo', discount: '20%', endsAt: Date.now() + 45 * 60 * 1000, img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2002_10_36%20AM.png?updatedAt=1776539452508' },
  { id: 'p3', restaurant: 'Sate Pak Haji', dish: 'Sate Ayam 20 Tusuk', discount: '15%', endsAt: Date.now() + 5 * 60 * 60 * 1000, img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2002_08_50%20AM.png?updatedAt=1776539347891' },
]

function CountdownTimer({ endsAt }) {
  const [remaining, setRemaining] = useState(endsAt - Date.now())
  useEffect(() => {
    const id = setInterval(() => {
      const r = endsAt - Date.now()
      setRemaining(r > 0 ? r : 0)
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (remaining <= 0) return <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444' }}>Expired</span>

  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)

  const urgent = remaining < 30 * 60 * 1000 // under 30 min
  return (
    <span style={{
      fontSize: 12, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
      color: urgent ? '#EF4444' : '#FACC15',
      animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none',
    }}>
      {h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`}
    </span>
  )
}

export default function FoodDashboard({ onClose, onOpenRestaurant }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [activeTab, setActiveTab] = useState('promos')

  useEffect(() => {
    setOrders(getFoodOrders())
    const uid = user?.id ?? user?.uid
    if (uid) {
      getSavedAddresses(uid).then(setAddresses)
    } else {
      try { setAddresses(JSON.parse(localStorage.getItem('indoo_saved_addresses')) ?? []) } catch {}
    }
  }, [user])

  // Compute favourites: restaurants with 2+ orders
  const restaurantCounts = {}
  orders.forEach(o => {
    restaurantCounts[o.restaurant] = (restaurantCounts[o.restaurant] ?? 0) + 1
  })
  const favourites = Object.entries(restaurantCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  // Spending summary
  const thisMonth = orders.filter(o => {
    const d = new Date(o.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalSpent = thisMonth.reduce((sum, o) => sum + (o.total ?? 0), 0)

  const TABS = [
    { id: 'promos', label: 'Promos' },
    { id: 'orders', label: 'Orders' },
    { id: 'favourites', label: 'Favourites' },
    { id: 'addresses', label: 'Addresses' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9800, background: '#0a0a0a', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>My Food</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {thisMonth.length} orders this month · {fmtRp(totalSpent)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, padding: '0 16px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
              color: activeTab === tab.id ? '#8DC63F' : 'rgba(255,255,255,0.3)',
              borderBottom: activeTab === tab.id ? '2px solid #8DC63F' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* ── PROMOS TAB ── */}
        {activeTab === 'promos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Active deals near you</span>
            {DEMO_PROMOS.map(promo => (
              <div key={promo.id} style={{
                display: 'flex', gap: 12, padding: 12, borderRadius: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <img src={promo.img} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block' }}>{promo.dish}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 2 }}>{promo.restaurant}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F', background: 'rgba(141,198,63,0.1)', padding: '2px 8px', borderRadius: 6 }}>{promo.discount} OFF</span>
                    <CountdownTimer endsAt={promo.endsAt} />
                  </div>
                </div>
                <button style={{
                  alignSelf: 'center', padding: '8px 14px', borderRadius: 10,
                  background: '#8DC63F', border: 'none', color: '#000',
                  fontSize: 11, fontWeight: 900, cursor: 'pointer', flexShrink: 0,
                }}>
                  Order
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: 40 }}>No orders yet — your first meal awaits</p>
            ) : orders.map(order => (
              <div key={order.id} style={{
                padding: 14, borderRadius: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{order.restaurant}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {order.items.map((it, i) => (
                    <span key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6 }}>
                      {it.qty}x {it.name}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(order.total)}</span>
                  <button style={{
                    padding: '6px 14px', borderRadius: 8, background: 'rgba(141,198,63,0.1)',
                    border: '1px solid rgba(141,198,63,0.2)', color: '#8DC63F',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  }}>
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FAVOURITES TAB ── */}
        {activeTab === 'favourites' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {favourites.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: 40 }}>Order from a restaurant twice and it shows here</p>
            ) : favourites.map(fav => (
              <div key={fav.name} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#8DC63F" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block' }}>{fav.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fav.count} orders</span>
                </div>
                <button style={{
                  padding: '8px 14px', borderRadius: 10, background: '#111',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                  fontSize: 11, fontWeight: 800, cursor: 'pointer',
                }}>
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── ADDRESSES TAB ── */}
        {activeTab === 'addresses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {addresses.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: 40 }}>No saved addresses yet</p>
            ) : addresses.map((addr, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: addr.isDefault ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: addr.isDefault ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={addr.isDefault ? '#8DC63F' : '#555'} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-4-8-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{addr.label}</span>
                    {addr.isDefault && <span style={{ fontSize: 8, fontWeight: 800, color: '#8DC63F', background: 'rgba(141,198,63,0.15)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Default</span>}
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{addr.address}</span>
                </div>
              </div>
            ))}
            <button style={{
              padding: '12px', borderRadius: 12, background: 'none',
              border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
            }}>
              + Add new address
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
