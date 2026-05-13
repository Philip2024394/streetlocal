// Payouts & Settlement — read-only ledger view.
// FoodLocal Pro takes no commission; customer payments land directly in
// the vendor's connected gateway balance. We can't see that balance from
// here (it's the vendor's own Stripe/Midtrans). What we can show:
//
//   1. Today / 7d / 30d gross revenue from food_orders (status = paid)
//   2. Refund total (food_orders.refund_amount where refund_status='completed')
//   3. Subscription history (foodpro_payment_records)
//   4. Direct link out to the gateway dashboard for actual payouts.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')
const fmtDate = iso => new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })

const card = { padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }

const GATEWAY_DASHBOARDS = {
  midtrans:        'https://dashboard.midtrans.com/',
  stripe:          'https://dashboard.stripe.com/payouts',
  xendit:          'https://dashboard.xendit.co/',
  paypal:          'https://www.paypal.com/businessmanage/',
  razorpay:        'https://dashboard.razorpay.com/',
}

export default function PayoutsPage({ restaurant, subscription, onBack }) {
  const [orders, setOrders] = useState([])
  const [subPayments, setSubPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [connectedGateways, setConnectedGateways] = useState([])

  useEffect(() => {
    if (!supabase || !restaurant?.id) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const since30d = new Date(Date.now() - 30 * 86400000).toISOString()
      const [ordersRes, subRes, connRes] = await Promise.all([
        supabase.from('food_orders')
          .select('id, total, status, refund_status, refund_amount, payment_confirmed_at, gateway_used')
          .eq('restaurant_id', restaurant.id)
          .gte('payment_confirmed_at', since30d)
          .order('payment_confirmed_at', { ascending: false })
          .limit(500),
        supabase.from('foodpro_payment_records')
          .select('id, amount, status, payment_method, period_start, period_end, verified_at, midtrans_order_id, notes')
          .eq('restaurant_id', restaurant.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('vendor_payment_connections')
          .select('gateway_id, mode')
          .eq('vendor_id', restaurant.id)
          .eq('is_active', true),
      ])
      if (cancelled) return
      setOrders(ordersRes.data || [])
      setSubPayments(subRes.data || [])
      setConnectedGateways(connRes.data || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [restaurant?.id])

  const stats = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const day7  = Date.now() - 7  * 86400000
    const day30 = Date.now() - 30 * 86400000

    let today = 0, sevenDay = 0, thirtyDay = 0, refunds30 = 0
    for (const o of orders) {
      if (!o.payment_confirmed_at) continue
      const t = new Date(o.payment_confirmed_at).getTime()
      const v = Number(o.total) || 0
      if (t >= todayStart.getTime()) today += v
      if (t >= day7)  sevenDay  += v
      if (t >= day30) thirtyDay += v
      if (o.refund_status === 'completed') refunds30 += Number(o.refund_amount) || 0
    }
    return { today, sevenDay, thirtyDay, refunds30, netThirty: thirtyDay - refunds30 }
  }, [orders])

  const renewAt = subscription?.expires_at ? new Date(subscription.expires_at) : null
  const daysLeft = renewAt ? Math.max(0, Math.ceil((renewAt - new Date()) / 86400000)) : null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Payouts & Settlement</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>You keep 100% — paid directly to your gateway</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
          FoodLocal Pro takes no commission. Customer payments settle straight into the bank or wallet linked to your connected gateway. Actual payout timing (T+1, T+2, etc.) is set by the gateway, not by us.
        </div>
      </div>

      {/* Headline stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Today</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtRp(stats.today)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Last 7 days</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtRp(stats.sevenDay)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Last 30 days</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtRp(stats.thirtyDay)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Refunds (30d)</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#EF4444' }}>−{fmtRp(stats.refunds30)}</div>
        </div>
      </div>

      <div style={{ ...card, background: BRAND.redGlow, border: `1px solid ${BRAND.redBorder}` }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Net last 30 days</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: BRAND.redLight }}>{fmtRp(stats.netThirty)}</div>
      </div>

      {/* Subscription / next renew */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Subscription</span>
          {subscription?.url_active && <span style={{ fontSize: 10, fontWeight: 800, color: '#22C55E', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 999 }}>● LIVE</span>}
        </div>
        {renewAt ? (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {subscription?.subscription_tier === 'chat' ? 'Chat orders tier' : 'WhatsApp orders tier'} · next renewal {fmtDate(renewAt)} ({daysLeft} days)
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Not subscribed yet — see the Subscription tab.</div>
        )}
      </div>

      {/* Connected gateway links */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Open your gateway</div>
        {connectedGateways.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No gateway connected. Connect one on the Payment Methods tab so customers can pay.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {connectedGateways.map(g => (
              <a key={g.gateway_id} href={GATEWAY_DASHBOARDS[g.gateway_id] || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                <span>{g.gateway_id} <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginLeft: 6 }}>· {g.mode}</span></span>
                <span style={{ color: BRAND.redLight, fontWeight: 800 }}>open ↗</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Subscription payment history */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Subscription payments to StreetLocal</div>
        {subPayments.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No subscription payments yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {subPayments.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{fmtRp(p.amount)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{p.notes || p.payment_method || ''} · {p.verified_at ? fmtDate(p.verified_at) : 'pending'}</div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                  background: p.status === 'paid' ? 'rgba(34,197,94,0.15)' : p.status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(250,204,21,0.15)',
                  color: p.status === 'paid' ? '#22C55E' : p.status === 'failed' ? '#FCA5A5' : '#FACC15' }}>{p.status?.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}
    </>
  )
}
