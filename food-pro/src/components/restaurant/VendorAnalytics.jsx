import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

// ── HelpTip (self-contained) ──────────────────────────────────────────────────
function HelpTip({ text }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const toggle = useCallback(() => {
    setOpen(p => {
      if (!p) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setOpen(false), 6000)
      }
      return !p
    })
  }, [])
  useEffect(() => () => clearTimeout(timerRef.current), [])
  return (
    <span style={helpS.wrap}>
      <button style={helpS.btn} onClick={toggle} aria-label="Help" type="button">?</button>
      {open && <span style={helpS.tip}>{text}</span>}
    </span>
  )
}
const helpS = {
  wrap: { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', verticalAlign: 'middle', marginLeft: 6 },
  btn:  { width: 18, height: 18, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, fontFamily: 'inherit', padding: 0 },
  tip:  { position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, background: '#1c1c1c', border: '1px solid rgba(141,198,63,0.25)', borderRadius: 12, padding: '10px 13px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, whiteSpace: 'normal', width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' },
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_ANALYTICS = {
  todayRevenue: 1250000,
  yesterdayRevenue: 980000,
  weekRevenue: 8750000,
  monthRevenue: 35200000,
  totalOrders: 487,
  popularItems: [
    { name: 'Nasi Goreng Spesial', orders: 89, revenue: 3115000 },
    { name: 'Mie Ayam Bakso',      orders: 67, revenue: 1675000 },
    { name: 'Ayam Geprek Sambal',   orders: 54, revenue: 1350000 },
    { name: 'Es Teh Manis',        orders: 203, revenue: 1015000 },
    { name: 'Bakso Jumbo',         orders: 41, revenue: 1025000 },
  ],
  hourlyOrders: [0,0,0,0,0,1,3,8,12,7,5,18,25,22,8,6,10,15,22,28,19,12,5,2],
  dailyRevenue: [
    { day: 'Mon', amount: 1100000 },
    { day: 'Tue', amount: 1350000 },
    { day: 'Wed', amount: 980000 },
    { day: 'Thu', amount: 1450000 },
    { day: 'Fri', amount: 1850000 },
    { day: 'Sat', amount: 2100000 },
    { day: 'Sun', amount: 1750000 },
  ],
  statusBreakdown: { completed: 412, cancelled: 38, pending: 37 },
  uniqueCustomers: 189,
  repeatCustomers: 67,
  avgOrderValue: 72000,
}

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 16,
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: 900,
  color: '#fff',
  margin: '0 0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VendorAnalytics({ restaurantId, userId, orders }) {
  const data = useMemo(() => {
    // If real orders exist we could compute analytics from them,
    // but for now always use demo data since no real orders exist yet.
    if (orders && orders.length > 0) {
      // Future: compute from real orders
    }
    return DEMO_ANALYTICS
  }, [orders])

  const currentHour = new Date().getHours()
  const maxHourly = Math.max(...data.hourlyOrders)
  const maxDailyRev = Math.max(...data.dailyRevenue.map(d => d.amount))
  const maxItemOrders = Math.max(...data.popularItems.map(i => i.orders))
  const totalStatus = data.statusBreakdown.completed + data.statusBreakdown.cancelled + data.statusBreakdown.pending

  // Trend calculation
  const todayTrend = data.yesterdayRevenue > 0
    ? ((data.todayRevenue - data.yesterdayRevenue) / data.yesterdayRevenue * 100).toFixed(1)
    : 0
  const todayUp = data.todayRevenue >= data.yesterdayRevenue

  // Donut chart via conic-gradient
  const completedPct = (data.statusBreakdown.completed / totalStatus * 100)
  const cancelledPct = (data.statusBreakdown.cancelled / totalStatus * 100)
  const pendingPct   = (data.statusBreakdown.pending / totalStatus * 100)
  const donutGradient = `conic-gradient(
    #8DC63F 0deg ${completedPct * 3.6}deg,
    #EF4444 ${completedPct * 3.6}deg ${(completedPct + cancelledPct) * 3.6}deg,
    #FFD700 ${(completedPct + cancelledPct) * 3.6}deg 360deg
  )`

  // Hour zone labels
  const getZoneLabel = (h) => {
    if (h >= 6 && h <= 9) return 'Breakfast'
    if (h >= 11 && h <= 14) return 'Lunch Rush'
    if (h >= 17 && h <= 21) return 'Dinner'
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '16px 0' }}>

      {/* ══════════════════════════════════════════════════════════════════════
          1. REVENUE SUMMARY CARDS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Today's Revenue */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Today's Revenue</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: todayUp ? '#8DC63F' : '#EF4444' }}>{fmtRp(data.todayRevenue)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: todayUp ? '#8DC63F' : '#EF4444' }}>
            {todayUp ? '↑' : '↓'} {Math.abs(todayTrend)}% vs yesterday
          </span>
        </div>

        {/* This Week */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>This Week</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{fmtRp(data.weekRevenue)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>↑ 12.3% vs last week</span>
        </div>

        {/* This Month */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>This Month</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{fmtRp(data.monthRevenue)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>↑ 8.7% vs last month</span>
        </div>

        {/* Total Orders */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Orders</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{data.totalOrders}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>↑ 15 today</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. POPULAR ITEMS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={card}>
        <h3 style={sectionTitle}>
          Best Sellers
          <HelpTip text="Your top 5 most-ordered items ranked by total order count. Use this to understand what customers love most and consider promoting these dishes." />
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.popularItems.map((item, idx) => (
            <div key={idx} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, overflow: 'hidden' }}>
              {/* Background bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${(item.orders / maxItemOrders) * 100}%`,
                background: 'rgba(141,198,63,0.08)',
                borderRadius: 12,
                transition: 'width 0.3s',
              }} />
              {/* Rank */}
              <span style={{ position: 'relative', fontSize: 16, fontWeight: 900, color: idx < 3 ? '#8DC63F' : 'rgba(255,255,255,0.3)', minWidth: 24, textAlign: 'center' }}>
                {idx + 1}
              </span>
              {/* Name */}
              <span style={{ position: 'relative', flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {item.name}
              </span>
              {/* Stats */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{item.orders}x</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{fmtRp(item.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. PEAK HOURS CHART
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={card}>
        <h3 style={sectionTitle}>
          Peak Hours
          <HelpTip text="Shows when your restaurant gets the most orders throughout the day. Green bars highlight peak hours. Use this to plan staffing and prep schedules." />
        </h3>

        {/* Zone labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '0 2px' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>Breakfast</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>Lunch Rush</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>Dinner</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
          {data.hourlyOrders.map((count, h) => {
            const height = maxHourly > 0 ? (count / maxHourly) * 100 : 0
            const isPeak = count >= maxHourly * 0.7 && count > 0
            const isCurrent = h === currentHour
            return (
              <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{
                  width: '100%',
                  height: `${height}%`,
                  minHeight: count > 0 ? 4 : 1,
                  background: isCurrent
                    ? '#FFD700'
                    : isPeak
                      ? '#8DC63F'
                      : 'rgba(255,255,255,0.12)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s',
                  position: 'relative',
                }}>
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                      fontSize: 8, fontWeight: 900, color: '#FFD700', whiteSpace: 'nowrap',
                    }}>NOW</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Hour labels — show every 3rd */}
        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
          {data.hourlyOrders.map((_, h) => (
            <div key={h} style={{ flex: 1, textAlign: 'center', fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
              {h % 3 === 0 ? h : ''}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. ORDER STATUS BREAKDOWN (Donut)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={card}>
        <h3 style={sectionTitle}>
          Order Status
          <HelpTip text="Shows the breakdown of all your orders by status. A high cancellation rate may indicate issues with availability or prep times." />
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Donut */}
          <div style={{
            width: 110, height: 110, borderRadius: '50%',
            background: donutGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%',
              background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{totalStatus}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>total</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Completed', count: data.statusBreakdown.completed, pct: completedPct.toFixed(1), color: '#8DC63F' },
              { label: 'Cancelled', count: data.statusBreakdown.cancelled, pct: cancelledPct.toFixed(1), color: '#EF4444' },
              { label: 'Pending',   count: data.statusBreakdown.pending,   pct: pendingPct.toFixed(1),   color: '#FFD700' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.count} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>({s.pct}%)</span></span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5. CUSTOMER INSIGHTS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={card}>
        <h3 style={sectionTitle}>
          Customer Insights
          <HelpTip text="Key metrics about your customer base. Repeat customers are those who have ordered 2 or more times. A high repeat rate means strong loyalty." />
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Unique Customers',  value: data.uniqueCustomers,         icon: '👥' },
            { label: 'Repeat Customers',  value: `${data.repeatCustomers} (${(data.repeatCustomers / data.uniqueCustomers * 100).toFixed(0)}%)`, icon: '🔁' },
            { label: 'Avg Order Value',   value: fmtRp(data.avgOrderValue),    icon: '💰' },
            { label: 'Top Payment',       value: 'Bank Transfer',              icon: '💳' },
          ].map(m => (
            <div key={m.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '12px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center',
            }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{m.value}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          6. DAILY REVENUE CHART (Last 7 Days)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={card}>
        <h3 style={sectionTitle}>
          Last 7 Days Revenue
          <HelpTip text="Your daily revenue for the past week. Look for patterns — weekends often perform better. Use slow days to run promotions." />
        </h3>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
          {data.dailyRevenue.map((d, idx) => {
            const height = maxDailyRev > 0 ? (d.amount / maxDailyRev) * 100 : 0
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {/* Amount label */}
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {(d.amount / 1000000).toFixed(1)}M
                </span>
                {/* Bar */}
                <div style={{
                  width: '100%',
                  height: `${height}%`,
                  minHeight: 8,
                  background: 'linear-gradient(to top, rgba(141,198,63,0.6), #8DC63F)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s',
                }} />
                {/* Day label */}
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{d.day}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Demo data notice */}
      <div style={{
        textAlign: 'center', padding: '12px 16px',
        fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        Demo data shown — real analytics will appear once you start receiving orders.
      </div>
    </div>
  )
}
