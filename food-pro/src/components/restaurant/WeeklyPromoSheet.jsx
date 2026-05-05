import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './WeeklyPromoSheet.module.css'

// ── Named deal days ───────────────────────────────────────────────────────────
export const DEAL_DAYS = {
  0: { name: 'Sunny Sunday',        emoji: '☀️', color: '#FACC15', sub: 'Bright deals for a bright day' },
  1: { name: 'Magic Monday',        emoji: '✨', color: '#38bdf8', sub: 'Start the week with magic'     },
  2: { name: 'Tempting Tuesday',    emoji: '😋', color: '#f472b6', sub: 'Too good to resist'            },
  3: { name: 'Wicked Wednesday',    emoji: '😈', color: '#a78bfa', sub: 'Midweek madness deals'         },
  4: { name: 'Throwback Thursday',  emoji: '🔙', color: '#fb923c', sub: 'Classic flavours, new prices'  },
  5: { name: 'Crunchy Friday',      emoji: '🔥', color: '#ff6b35', sub: 'Fried, grilled & bold'         },
  6: { name: 'Sizzling Saturday',   emoji: '🥩', color: '#8DC63F', sub: 'Hot deals, hotter food'        },
}

// ── Demo promos (replaced by Supabase when live) ──────────────────────────────
const DEMO_PROMOS = [
  { id: 1, restaurant: 'Nasi Goreng Pak Nasio', day: 1, start: '14:00', end: '17:00', offer: '20% Off',   detail: 'All rice dishes',       color: '#F59E0B' },
  { id: 2, restaurant: 'Ayam Geprek Bu Tini',   day: 2, start: '11:00', end: '14:00', offer: 'Free Drink',detail: 'With any main order',   color: '#F59E0B' },
  { id: 3, restaurant: 'Bakso Pak Budi',        day: 3, start: '17:00', end: '21:00', offer: '2 for 1',   detail: 'Select noodle bowls',   color: '#38bdf8' },
  { id: 4, restaurant: 'Warung Seafood Mbak Sri',day: 4, start: '12:00', end: '15:00', offer: '15% Off',  detail: 'Seafood platters',       color: '#fb923c' },
  { id: 5, restaurant: 'Geprek Corner',         day: 5, start: '17:00', end: '22:00', offer: '2 for 1',   detail: 'Ayam geprek, all levels',color: '#ff6b35' },
  { id: 6, restaurant: 'Kopi & Musik Warung',   day: 6, start: '19:00', end: '23:00', offer: 'Free Kopi', detail: 'With any food order',   color: '#a78bfa' },
  { id: 7, restaurant: 'Pisang Goreng Mbok Tum',day: 0, start: '10:00', end: '13:00', offer: '30% Off',   detail: 'All snack items',        color: '#f472b6' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTime(str) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + m
}

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function secondsUntil(timeStr) {
  const d       = new Date()
  const [h, m]  = timeStr.split(':').map(Number)
  const target  = new Date(d); target.setHours(h, m, 0, 0)
  return Math.max(0, Math.floor((target - d) / 1000))
}

function fmtCountdown(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${h}h ${String(m).padStart(2,'0')}m`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function getPromoStatus(promo) {
  const today  = new Date().getDay()
  const now    = nowMinutes()
  const start  = parseTime(promo.start)
  const end    = parseTime(promo.end)

  if (promo.day === today) {
    if (now >= end)   return 'expired'
    if (now >= start) return 'active'
    return 'soon'     // today but not yet started
  }

  // Work out if this day has passed this week
  const diff = promo.day - today
  return diff > 0 ? 'upcoming' : 'expired'
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Day accent colours (fallback palette) ────────────────────────────────────
const DAY_COLORS = ['#a78bfa','#38bdf8','#f472b6','#F59E0B','#fb923c','#ff6b35','#F59E0B']

function normalisePromo(row, restaurantName) {
  return {
    id:         row.id,
    restaurant: restaurantName ?? row.restaurant ?? '—',
    day:        row.day_of_week ?? row.day,
    start:      (row.start_time ?? row.start ?? '').slice(0, 5),
    end:        (row.end_time   ?? row.end   ?? '').slice(0, 5),
    offer:      row.title ?? (`${row.offer_type ?? ''} ${row.offer_value ?? ''}`.trim() || row.offer),
    detail:     row.detail ?? '',
    color:      DAY_COLORS[row.day_of_week ?? row.day] ?? '#F59E0B',
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WeeklyPromoSheet({ onClose, restaurant }) {
  const [promos,    setPromos]    = useState([])
  const [claimed,   setClaimed]   = useState(new Set())
  const [tick,      setTick]      = useState(0)   // forces re-render every second

  // Load promos from Supabase (or fall back to demo)
  useEffect(() => {
    async function load() {
      if (supabase && restaurant?.id) {
        const { data } = await supabase
          .from('promos')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true)
        if (data?.length) {
          setPromos(data.map(r => normalisePromo(r, restaurant.name)))
          return
        }
      }
      setPromos(DEMO_PROMOS)
    }
    load()
  }, [restaurant?.id, restaurant?.name])

  // Tick every second so countdowns stay live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const handleClaim = useCallback(async (promo) => {
    // Optimistic update
    setClaimed(prev => new Set([...prev, promo.id]))
    // Server-side atomic claim via RPC (validates day/time window server-side)
    if (supabase) {
      const { data } = await supabase.rpc('claim_promo', { p_promo_id: promo.id })
      if (data && !data.ok) {
        // Server rejected — roll back
        setClaimed(prev => { const next = new Set(prev); next.delete(promo.id); return next })
      }
    }
  }, [])

  // Sort: active first, then soon, then upcoming by day, then expired
  const ORDER = { active: 0, soon: 1, upcoming: 2, expired: 3 }
  const sorted = [...promos].sort((a, b) => {
    const sa = ORDER[getPromoStatus(a)]
    const sb = ORDER[getPromoStatus(b)]
    if (sa !== sb) return sa - sb
    return a.day - b.day
  })

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h2 className={styles.title}>This Week's Deals</h2>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
          <p className={styles.sub}>Tap to claim when unlocked</p>
        </div>

        {/* Promo cards */}
        <div className={styles.list}>
          {sorted.map(promo => (
            <PromoCard
              key={promo.id}
              promo={promo}
              status={getPromoStatus(promo)}
              claimed={claimed.has(promo.id)}
              onClaim={() => handleClaim(promo)}
              tick={tick}
            />
          ))}
        </div>

        <p className={styles.footer}>INDOO STREET · Weekly Deals</p>
      </div>
    </div>
  )
}

// ── Promo card ────────────────────────────────────────────────────────────────
function PromoCard({ promo, status, claimed, onClaim, tick }) {
  // tick is passed from parent's setInterval — referencing it here forces
  // this component to re-render every second so countdowns stay live
  void tick

  const dealDay = DEAL_DAYS[promo.day]
  const isLocked = status === 'soon' || status === 'upcoming'
  const isExpired = status === 'expired'
  const isActive = status === 'active'

  const soonSecs = status === 'soon' ? secondsUntil(promo.start) : 0

  return (
    <div
      className={`${styles.card}
        ${isActive  ? styles.cardActive  : ''}
        ${isExpired ? styles.cardExpired : ''}
        ${claimed   ? styles.cardClaimed : ''}
      `}
      style={{ '--accent': promo.color }}
    >
      {/* Card background glow */}
      <div className={styles.cardGlow} style={{ background: `radial-gradient(ellipse at top left, ${promo.color}22 0%, transparent 70%)` }} />

      {/* Top row: deal day name + day label */}
      <div className={styles.cardTop}>
        <span className={styles.dealDayEmoji}>{dealDay.emoji}</span>
        <div className={styles.dealDayInfo}>
          <span className={styles.dealDayName} style={{ color: isExpired ? '#444' : promo.color }}>
            {dealDay.name}
          </span>
          <span className={styles.dealDaySub}>{dealDay.sub}</span>
        </div>
        <span className={styles.dayTag}>{DAY_NAMES[promo.day]}</span>
      </div>

      {/* Offer — big text */}
      <div className={styles.offerWrap}>
        <span className={styles.offerText} style={{ color: isExpired ? '#333' : '#fff' }}>
          {promo.offer}
        </span>
        <span className={styles.offerDetail}>{promo.detail}</span>
      </div>

      {/* Time window — start & finish */}
      <div className={styles.meta}>
        <span className={styles.timeWindow}>Start {promo.start}</span>
        <span className={styles.timeWindow}>Finish {promo.end}</span>
      </div>

      {/* Status footer */}
      <div className={styles.cardFooter}>
        {claimed ? (
          <div className={styles.claimedBadge}>✓ Claimed — show to staff</div>
        ) : isActive ? (
          <button className={styles.claimBtn} style={{ background: promo.color }} onClick={onClaim}>
            Claim Now
          </button>
        ) : status === 'soon' ? (
          <div className={styles.lockedRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span className={styles.countdownBox}>{fmtCountdown(soonSecs)}</span>
            </div>
            <button className={styles.remindCircle} onClick={(e) => { e.stopPropagation(); alert('Reminder set! We\'ll notify you when this deal unlocks.') }} title="Remind me">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
          </div>
        ) : status === 'upcoming' ? (
          <div className={styles.lockedRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span className={styles.countdownBox}>{DAY_NAMES[promo.day]} · {promo.start}</span>
            </div>
            <button className={styles.remindCircle} onClick={(e) => { e.stopPropagation(); alert('Reminder set! We\'ll notify you when this deal unlocks.') }} title="Remind me">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className={styles.expiredLabel}>Expired</div>
        )}
      </div>

      {/* Lock overlay for locked cards */}
      {isLocked && <div className={styles.lockOverlay} />}
    </div>
  )
}
