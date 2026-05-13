/**
 * Shared PayoutsPage — read-only revenue + payout view for products /
 * services vendors. Pulls from vendor_orders, sums by window, shows
 * a link out to the vendor's connected-gateway dashboard for actual
 * settlement timing (which is the gateway's responsibility, not ours).
 */
import React, { useEffect, useMemo, useState } from 'react'

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')
const fmtDate = iso => new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })

const card = { padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }

const GATEWAY_DASHBOARDS = {
  midtrans:        'https://dashboard.midtrans.com/',
  stripe:          'https://dashboard.stripe.com/payouts',
  xendit:          'https://dashboard.xendit.co/',
  paypal:          'https://www.paypal.com/businessmanage/',
  razorpay:        'https://dashboard.razorpay.com/',
  hitpay:          'https://dashboard.hit-pay.com/',
  mollie:          'https://www.mollie.com/dashboard/',
  adyen:           'https://ca-live.adyen.com/',
  'checkout-com':  'https://sandbox.dashboard.checkout.com/',
}

export default function PayoutsPage({ supabase, vendorId, onBack, accent = '#DC2626' }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [connectedGateways, setConnectedGateways] = useState([])

  useEffect(() => {
    if (!supabase || !vendorId) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const since30d = new Date(Date.now() - 30 * 86400000).toISOString()
      const [ordersRes, connRes] = await Promise.all([
        supabase.from('vendor_orders')
          .select('id, total, subtotal, status, refund_status, refund_amount, payment_confirmed_at, gateway_used, payment_status')
          .eq('vendor_id', vendorId)
          .gte('created_at', since30d)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('vendor_payment_connections')
          .select('gateway_id, mode')
          .eq('vendor_id', vendorId)
          .eq('is_active', true),
      ])
      if (cancelled) return
      setOrders(ordersRes.data || [])
      setConnectedGateways(connRes.data || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [vendorId])

  const stats = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const day7 = Date.now() - 7 * 86400000
    const day30 = Date.now() - 30 * 86400000
    let today = 0, sevenDay = 0, thirtyDay = 0, refunds30 = 0
    for (const o of orders) {
      const t = new Date(o.payment_confirmed_at || o.created_at || 0).getTime()
      const v = Number(o.total ?? o.subtotal) || 0
      if (o.payment_status === 'paid' || o.status === 'delivered' || o.status === 'done') {
        if (t >= todayStart.getTime()) today += v
        if (t >= day7) sevenDay += v
        if (t >= day30) thirtyDay += v
      }
      if (o.refund_status === 'completed') refunds30 += Number(o.refund_amount) || 0
    }
    return { today, sevenDay, thirtyDay, refunds30, netThirty: thirtyDay - refunds30 }
  }, [orders])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Payouts & Settlement</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${accent}55`, background: `${accent}22` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>You keep 100% — paid directly to your gateway</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
          StreetLocal takes no commission. Customer payments settle straight into the bank or wallet linked to your connected gateway. Payout timing (T+1, T+2, etc.) is the gateway's decision.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
        <div style={card}><div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Today</div><div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtRp(stats.today)}</div></div>
        <div style={card}><div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Last 7 days</div><div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtRp(stats.sevenDay)}</div></div>
        <div style={card}><div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Last 30 days</div><div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtRp(stats.thirtyDay)}</div></div>
        <div style={card}><div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Refunds (30d)</div><div style={{ fontSize: 22, fontWeight: 900, color: '#EF4444' }}>−{fmtRp(stats.refunds30)}</div></div>
      </div>

      <div style={{ ...card, background: `${accent}22`, border: `1px solid ${accent}55` }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Net last 30 days</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: accent }}>{fmtRp(stats.netThirty)}</div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Open your gateway</div>
        {connectedGateways.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No gateway connected. Connect one to start receiving payments.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {connectedGateways.map(g => (
              <a key={g.gateway_id} href={GATEWAY_DASHBOARDS[g.gateway_id] || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                <span>{g.gateway_id} <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginLeft: 6 }}>· {g.mode}</span></span>
                <span style={{ color: accent, fontWeight: 800 }}>open ↗</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {loading && <div style={{ padding: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>}
    </>
  )
}
