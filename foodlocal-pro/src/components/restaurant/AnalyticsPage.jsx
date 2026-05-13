// Analytics — reads from food_orders. Computes daily/weekly/monthly sales,
// top items, peak hours, basket avg, repeat-customer rate. No charts
// library — inline bar/heatmap rendered with divs to keep the bundle
// small and the styling consistent with the rest of the dashboard.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')
const card  = { padding: 14, borderRadius: 14, marginBottom: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }

const PERIODS = [
  { id: '7',  l: '7d',  days: 7 },
  { id: '30', l: '30d', days: 30 },
  { id: '90', l: '90d', days: 90 },
]

export default function AnalyticsPage({ restaurant, onBack }) {
  const [orders, setOrders] = useState([])
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !restaurant?.id) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const since = new Date(Date.now() - 90 * 86400000).toISOString()
      const { data } = await supabase
        .from('food_orders')
        .select('id, total, items, customer_phone, status, payment_confirmed_at, auto_confirmed_at, created_at')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000)
      if (cancelled) return
      setOrders(data || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [restaurant?.id])

  const days = Number(period)
  const cutoff = Date.now() - days * 86400000
  const windowed = useMemo(() => orders.filter(o => new Date(o.created_at).getTime() >= cutoff && o.status !== 'cancelled'), [orders, cutoff])

  // Daily sales bars
  const daily = useMemo(() => {
    const buckets = {}
    for (const o of windowed) {
      const d = new Date(o.created_at).toISOString().slice(0, 10)
      buckets[d] = (buckets[d] || 0) + (Number(o.total) || 0)
    }
    const rows = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      rows.push({ date: d, total: buckets[d] || 0 })
    }
    return rows
  }, [windowed, days])

  const maxDaily = Math.max(1, ...daily.map(r => r.total))

  // Top items
  const topItems = useMemo(() => {
    const m = {}
    for (const o of windowed) {
      for (const it of o.items || []) {
        const key = String(it.name || 'Item')
        const qty = Number(it.qty) || 1
        const rev = (Number(it.price) || 0) * qty
        if (!m[key]) m[key] = { name: key, qty: 0, revenue: 0 }
        m[key].qty += qty
        m[key].revenue += rev
      }
    }
    return Object.values(m).sort((a, b) => b.qty - a.qty).slice(0, 10)
  }, [windowed])

  // Peak hours (heatmap row: 24 hours)
  const hourly = useMemo(() => {
    const counts = Array(24).fill(0)
    for (const o of windowed) {
      const h = new Date(o.created_at).getHours()
      counts[h]++
    }
    return counts
  }, [windowed])
  const maxHour = Math.max(1, ...hourly)

  // Basket avg + repeat customers
  const stats = useMemo(() => {
    const n = windowed.length
    const revenue = windowed.reduce((s, o) => s + (Number(o.total) || 0), 0)
    const avgBasket = n ? Math.round(revenue / n) : 0
    const byPhone = {}
    for (const o of windowed) {
      const p = o.customer_phone
      if (!p) continue
      byPhone[p] = (byPhone[p] || 0) + 1
    }
    const repeatCount = Object.values(byPhone).filter(c => c > 1).length
    const totalCustomers = Object.keys(byPhone).length
    const repeatRate = totalCustomers ? Math.round((repeatCount / totalCustomers) * 100) : 0
    return { n, revenue, avgBasket, repeatRate, totalCustomers, repeatCount }
  }, [windowed])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Analytics</h2>
      </div>

      {/* Period switch */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: period === p.id ? BRAND.red : 'rgba(255,255,255,0.08)', color: '#fff' }}>{p.l}</button>
        ))}
      </div>

      {/* Headline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtRp(stats.revenue)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Orders</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{stats.n}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Avg basket</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtRp(stats.avgBasket)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Repeat customers</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{stats.repeatRate}%</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{stats.repeatCount} of {stats.totalCustomers}</div>
        </div>
      </div>

      {/* Daily sales bars */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Daily revenue · {days}d</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100 }}>
          {daily.map(r => (
            <div key={r.date} title={`${r.date}: ${fmtRp(r.total)}`} style={{ flex: 1, height: `${(r.total / maxDaily) * 100}%`, background: r.total ? BRAND.red : 'rgba(255,255,255,0.08)', borderRadius: 2, minHeight: 2 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{daily[0]?.date}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>today</span>
        </div>
      </div>

      {/* Peak hours */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Peak hours (orders by hour of day)</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 60, marginBottom: 4 }}>
          {hourly.map((c, h) => (
            <div key={h} title={`${h}:00–${h+1}:00 — ${c} orders`} style={{ flex: 1, height: `${(c / maxHour) * 100}%`, background: c ? BRAND.redLight : 'rgba(255,255,255,0.08)', borderRadius: 2, minHeight: 1 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>00</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>06</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>12</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>18</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>23</span>
        </div>
      </div>

      {/* Top items */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Top items</div>
        {topItems.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 12 }}>No orders in this window.</div>
        ) : topItems.map((it, i) => {
          const maxQty = Math.max(1, ...topItems.map(x => x.qty))
          const pct = (it.qty / maxQty) * 100
          return (
            <div key={it.name} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{i + 1}. {it.name}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{it.qty} · {fmtRp(it.revenue)}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: BRAND.red }} />
              </div>
            </div>
          )
        })}
      </div>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}
    </>
  )
}
