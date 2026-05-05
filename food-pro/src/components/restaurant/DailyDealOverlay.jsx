/**
 * DailyDealOverlay — swipeable full-page daily deal cards
 * Shows current restaurant's deal first, then all other restaurants with deals today.
 * If no deal, shows "no deal" state then swipe to see others.
 */
import { useState, useEffect, useRef } from 'react'
import { getTodayDeal } from '@/constants/dailyDeals'
import { getAllTodayDeals } from '@/services/dailyDealService'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

function DealItemCard({ item, todayTheme, qty, onQtyChange, dealDiscount, onAdd }) {
  const [zoomed, setZoomed] = useState(false)
  const [added, setAdded] = useState(false)
  const pct = item.discountPct ?? dealDiscount ?? 0
  const discountedPrice = Math.round(item.originalPrice * (1 - pct / 100))
  const remaining = (item.quantity ?? 50) - (item.claimed ?? 0)
  const soldOut = remaining <= 0
  const almostGone = remaining > 0 && remaining <= 10
  return (
    <>
    <div style={{
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(14px)',
      border: '1.5px solid rgba(141,198,63,0.3)', borderRadius: 14,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      padding: '10px 12px',
      position: 'relative', overflow: 'hidden',
      opacity: soldOut ? 0.4 : 1,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Running green light */}
      {!soldOut && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runningLight 3s linear infinite', boxShadow: '0 0 8px #8DC63F' }} />
        </div>
      )}

      {/* Photo */}
      {item.photoUrl ? (
        <img src={item.photoUrl} alt="" onClick={(e) => { e.stopPropagation(); setZoomed(true) }}
          style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
        />
      ) : (
        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 24 }}>{todayTheme.emoji}</span>
        </div>
      )}

      {/* Name + price + discount below */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 3 }}>{fmtRp(discountedPrice)}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444', display: 'block', marginTop: 2 }}>Discounted {pct}%</span>
      </div>

      {/* Remaining + view button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: soldOut ? '#EF4444' : '#FACC15', animation: soldOut ? 'none' : 'discountFlash 1.5s ease-in-out infinite' }}>
          {soldOut ? 'Sold Out' : `${remaining} left`}
        </span>
        {!soldOut && (
          <button
            onClick={(e) => { e.stopPropagation(); setZoomed(true) }}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(141,198,63,0.3)',
              background: 'rgba(141,198,63,0.15)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/></svg>
          </button>
        )}
      </div>
    </div>
    {/* Item detail — centered popup */}
    {zoomed && item.photoUrl && (
      <>
        <div onClick={() => setZoomed(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998, background: 'rgba(0,0,0,0.5)' }} />
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 40px)', maxWidth: 360, zIndex: 99999,
          background: '#0a0a0a', borderRadius: 20,
          border: '1px solid rgba(141,198,63,0.2)',
          overflow: 'hidden', animation: 'popIn 0.25s ease',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}>
          {/* Image */}
          <div style={{ position: 'relative', width: '100%', height: 200 }}>
            <img src={item.photoUrl} alt={item.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Discount badge */}
            {/* Discount badge — top left */}
            <div style={{
              position: 'absolute', top: 10, left: 10,
              padding: '4px 10px', borderRadius: 8,
              background: '#FACC15', color: '#000',
              fontSize: 13, fontWeight: 900,
              animation: 'discountFlash 1.5s ease-in-out infinite',
            }}>
              {pct}% OFF
            </div>
            {/* Remaining — bottom right */}
            <span style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 14, fontWeight: 900, color: '#FACC15', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 8 }}>{remaining} Remaining</span>
            {/* Close X — top right */}
            <button onClick={(e) => { e.stopPropagation(); setZoomed(false) }} style={{
              position: 'absolute', top: 10, right: 10,
              width: 32, height: 32, borderRadius: '50%',
              background: '#EF4444', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Name + rating + price */}
          <div style={{ padding: '12px 14px 0' }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', display: 'block' }}>{item.itemName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 14, color: '#FACC15' }}>★</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>4.8</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(discountedPrice)}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(item.originalPrice)}</span>
            </div>
            {item.description && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 6, lineHeight: 1.5 }}>{item.description}</span>
            )}
          </div>

          {/* Qty controls + Add to Cart */}
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={(e) => { e.stopPropagation(); onQtyChange(-1) }} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer' }}>-</button>
              <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 16, fontWeight: 900 }}>{qty}</span>
              <button onClick={(e) => { e.stopPropagation(); onQtyChange(1) }} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer' }}>+</button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onAdd?.(item, qty); setAdded(true); setTimeout(() => { setAdded(false); setZoomed(false) }, 800) }}
              style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: added ? '#FACC15' : '#8DC63F', color: '#000',
                fontSize: 14, fontWeight: 900, transition: 'background 0.2s',
              }}
            >{added ? '✓ Added!' : '🛒 Add to Cart'}</button>
          </div>
        </div>
        <style>{`@keyframes popIn { from { transform: translate(-50%,-50%) scale(0.9); opacity: 0; } to { transform: translate(-50%,-50%) scale(1); opacity: 1; } }`}</style>
      </>
    )}
    </>
  )
}

export default function DailyDealOverlay({ restaurant, dealItems, onClose, onAddToCart, onViewMenu }) {
  const todayTheme = getTodayDeal()
  const scrollRef = useRef(null)
  const [otherDeals, setOtherDeals] = useState([])
  const [quantities, setQuantities] = useState(() => {
    const q = {}
    ;(dealItems ?? []).slice(0, 3).forEach(d => { q[d.itemId] = 1 })
    return q
  })

  // Countdown to midnight WIB
  const [countdown, setCountdown] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
      const wib = new Date(utcMs + 7 * 3_600_000)
      const midnight = new Date(wib); midnight.setHours(23, 59, 59, 999)
      const diff = midnight.getTime() - wib.getTime()
      if (diff <= 0) { setCountdown('00:00:00'); return }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setCountdown(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Random viewer count (40-120) + mock avatar indices
  const [viewerCount] = useState(() => 40 + Math.floor(Math.random() * 81))
  const [avatarIds] = useState(() => {
    const ids = []
    const used = new Set()
    while (ids.length < 5) {
      const id = 1 + Math.floor(Math.random() * 70)
      if (!used.has(id)) { used.add(id); ids.push(id) }
    }
    return ids
  })

  // Load all other restaurants' deals today
  useEffect(() => {
    getAllTodayDeals().then(deals => {
      // Filter out current restaurant
      setOtherDeals(deals.filter(d => d.restaurant_id !== restaurant?.id))
    })
  }, [restaurant?.id])

  const setQty = (itemId, delta) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, Math.min(10, (prev[itemId] ?? 1) + delta)) }))
  }

  const [addedFlash, setAddedFlash] = useState(false)
  const handleAddAll = () => {
    const discount = todayTheme.discount
    ;(dealItems ?? []).slice(0, 3).forEach(item => {
      const pct = item.discountPct ?? discount
      const qty = quantities[item.itemId] ?? 1
      for (let i = 0; i < qty; i++) {
        onAddToCart?.({
          id: item.itemId,
          name: item.itemName,
          price: Math.round(item.originalPrice * (1 - pct / 100)),
          originalPrice: item.originalPrice,
          dealDiscount: pct,
          isDealItem: true,
          photo_url: item.photoUrl ?? null,
        })
      }
    })
    setAddedFlash(true)
    setTimeout(() => setAddedFlash(false), 1500)
    onViewMenu?.()
  }

  const hasItems = dealItems && dealItems.length > 0
  const totalCards = 1 + otherDeals.length // this restaurant + others
  const [onSplash, setOnSplash] = useState(true)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9700, background: '#0a0a0a' }}>
      <style>{`.deal-swipe-feed::-webkit-scrollbar { display: none; }`}</style>

      {/* Cart icon — fixed top right */}
      <div onClick={onClose} style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', right: 16, zIndex: 9720, cursor: 'pointer' }}>
        <img src="https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png?updatedAt=1775737452452" alt="Cart" style={{ width: 32, height: 32, objectFit: 'contain' }} />
      </div>

      {/* Floating discount balls — higher on splash, lower on deal cards */}
      <div style={{ position: 'fixed', bottom: onSplash ? '18%' : '8%', left: 0, right: 0, height: onSplash ? '25%' : '15%', zIndex: 99000, pointerEvents: 'none', overflow: 'hidden', transition: 'bottom 0.5s, height 0.5s' }}>
        {[
          { pct: 30, size: 36, left: '10%', delay: '0s', dur: '3.5s', color: '#F87171' },
          { pct: 20, size: 32, left: '28%', delay: '0.5s', dur: '3s', color: '#60A5FA' },
          { pct: 15, size: 28, left: '48%', delay: '1s', dur: '4s', color: '#34D399' },
          { pct: 25, size: 34, left: '68%', delay: '0.3s', dur: '3.2s', color: '#FACC15' },
          { pct: 35, size: 30, left: '85%', delay: '0.8s', dur: '3.8s', color: '#FB923C' },
        ].map((ball, i) => (
          <div key={i} style={{
            position: 'absolute', left: ball.left, bottom: '-10%',
            width: ball.size, height: ball.size, borderRadius: '50%',
            background: `${ball.color}25`, border: `2px solid ${ball.color}50`,
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: `ballFloat ${ball.dur} ease-in-out infinite`,
            animationDelay: ball.delay,
            transform: 'translateX(-50%)',
          }}>
            <span style={{ fontSize: ball.size * 0.32, fontWeight: 900, color: ball.color, textShadow: `0 0 10px ${ball.color}80` }}>{ball.pct}%</span>
          </div>
        ))}
      </div>
      {/* Vertical snap-scroll */}
      <div
        ref={scrollRef}
        className="deal-swipe-feed"
        onScroll={() => { const el = scrollRef.current; if (el) setOnSplash(el.scrollTop < el.clientHeight * 0.5) }}
        style={{
          width: '100%', height: '100%',
          overflowX: 'hidden', overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          display: 'flex', flexDirection: 'column',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}
      >
        {/* ── Card 1: Hero splash — no restaurant name, just theme ── */}
        <div style={{ width: '100%', minHeight: '100dvh', scrollSnapAlign: 'start', position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Full background image */}
          <img src={todayTheme.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', pointerEvents: 'none', zIndex: 0 }} />

          {/* Center: hero text + profiles */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, padding: '0 20px' }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', textShadow: '0 3px 20px rgba(0,0,0,0.9), 0 0 50px rgba(0,0,0,0.5)', textAlign: 'center', letterSpacing: '0.04em' }}>{todayTheme.name}</span>
            {todayTheme.slogan && <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontStyle: 'italic', marginTop: 10, textShadow: '0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center' }}>{todayTheme.slogan}</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
              {avatarIds.map((id, i) => (
                <img key={id} src={`https://i.pravatar.cc/40?img=${id}`} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8DC63F', marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i, position: 'relative' }} />
              ))}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginLeft: 6, fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}><span style={{ color: '#8DC63F' }}>{viewerCount}</span> viewing</span>
            </div>
            {/* Discount badge */}
            <span style={{ marginTop: 20, padding: '8px 24px', borderRadius: 12, background: '#FACC15', color: '#000', fontSize: 18, fontWeight: 900, animation: 'shake 0.5s ease-in-out infinite', boxShadow: '0 0 20px rgba(250,204,21,0.5)' }}>Discounts Up To {todayTheme.discount}%</span>
          </div>

          {/* Arrow button — swipe to see deals */}
          <div style={{
            position: 'absolute', bottom: 100, left: 0, right: 0, zIndex: 3,
            display: 'flex', justifyContent: 'center',
            animation: 'arrowFloat 1.2s ease-in-out infinite',
          }}>
            <button
              onClick={() => { if (scrollRef.current) scrollRef.current.scrollBy({ top: scrollRef.current.clientHeight, behavior: 'smooth' }) }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(0,0,0,0.8)', border: '2px solid rgba(250,204,21,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 14px rgba(250,204,21,0.4)', cursor: 'pointer', padding: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 14" fill="#FACC15" stroke="none" style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.8))' }}>
                <path d="M4 2l8 8 8-8 2 2-10 10L2 4z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Other restaurant deal cards ── */}
        {otherDeals.map(deal => (
          <div key={deal.id} style={{ width: '100%', minHeight: '100dvh', scrollSnapAlign: 'start', position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
            <img src={todayTheme.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Top banner — solid dark */}
            <div style={{
              position: 'relative', zIndex: 2, flexShrink: 0,
              padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 16px 8px',
              background: '#0a0a0a', borderRadius: '0 0 16px 16px', borderBottom: '2px solid #8DC63F', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #fff, transparent)', animation: 'runningLight 3s linear infinite', opacity: 0.7 }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'block' }}>{deal.restaurant?.name ?? 'Restaurant'}</span>
              </div>
            </div>


            {/* Hero text */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', textShadow: '0 3px 16px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.5)', textAlign: 'center', letterSpacing: '0.04em' }}>{todayTheme.name}</span>
              {todayTheme.slogan && <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontStyle: 'italic', marginTop: 8, textShadow: '0 2px 8px rgba(0,0,0,0.8)', textAlign: 'center' }}>{todayTheme.slogan}</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                {[11,22,33,44].map((id, i) => (
                  <img key={id} src={`https://i.pravatar.cc/40?img=${id + (deal.restaurant_id ?? 0)}`} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8DC63F', marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i, position: 'relative' }} />
                ))}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 4, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}><span style={{ color: '#8DC63F', fontWeight: 900 }}>{40 + Math.floor((deal.restaurant_id ?? 1) * 7.3 % 81)}</span> viewing</span>
              </div>
            </div>

            {/* Deal content — above footer panel */}
            <div style={{ position: 'relative', zIndex: 2, padding: '0 16px', marginBottom: 90, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Discount + countdown */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 14, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <span style={{ padding: '6px 18px', borderRadius: 8, background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, animation: 'shake 0.5s ease-in-out infinite', boxShadow: '0 0 16px rgba(250,204,21,0.5)' }}>{deal.discountPct ?? todayTheme.discount}% Off</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
              </div>
              {(deal.items ?? []).slice(0, 3).map(item => (
                <DealItemCard
                  key={item.itemId}
                  item={item}
                  todayTheme={todayTheme}
                  qty={1}
                  dealDiscount={deal.discountPct ?? todayTheme.discount}
                  onQtyChange={() => {}}
                  onAdd={() => {}}
                />
              ))}
            </div>

          </div>
        ))}
      </div>

      <style>{`
        @keyframes swipeHintDown { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes arrowFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
        @keyframes ballFloat {
          0% { transform: translateX(-50%) translateY(100%) scale(0.5); opacity: 0; }
          15% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          30% { transform: translateX(calc(-50% + 10px)) translateY(-15px) scale(1.05); }
          50% { transform: translateX(calc(-50% - 8px)) translateY(-25px) scale(0.95); }
          70% { transform: translateX(calc(-50% + 6px)) translateY(-10px) scale(1); }
          85% { transform: translateX(-50%) translateY(-20px) scale(1.02); opacity: 1; }
          100% { transform: translateX(-50%) translateY(100%) scale(0.5); opacity: 0; }
        }
        @keyframes discountFlash { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
        @keyframes runningLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }
        @keyframes shake { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-3deg); } 40% { transform: rotate(3deg); } 60% { transform: rotate(-2deg); } 80% { transform: rotate(2deg); } }
        @keyframes fireUp { 0% { opacity: 1; transform: translateY(0) scale(1); } 50% { opacity: 0.8; } 100% { opacity: 0; transform: translateY(-50px) scale(0.3); } }
        @keyframes bikeDrift { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
        @keyframes foodFloat { 0%,100% { transform: translateY(-10px) rotate(3deg); } 50% { transform: translateY(0) rotate(-3deg); } }
        @keyframes bikeGlow { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.2); opacity: 0; } }
      `}</style>
    </div>
  )
}
