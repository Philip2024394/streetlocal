/**
 * Shared RefundsConsole — lists paid vendor_orders, lets vendor refund
 * via the gateway that captured the charge. Reuses the gateway-specific
 * refund edge functions (midtrans-refund, stripe-refund, etc.) deployed
 * for food-basic — same dispatch table.
 */
import React, { useEffect, useState } from 'react'

const REFUND_FUNCTION_BY_GATEWAY = {
  midtrans:        'midtrans-refund',
  stripe:          'stripe-refund',
  xendit:          'xendit-refund',
  paypal:          'paypal-refund',
  razorpay:        'razorpay-refund',
  braintree:       'braintree-refund',
  mollie:          'mollie-refund',
  hitpay:          'hitpay-refund',
  adyen:           'adyen-refund',
  rapyd:           'rapyd-refund',
  'checkout-com':  'checkout-com-refund',
  'fomo-pay':      'fomopay-refund',
  'authorize-net': 'authorize-net-refund',
  '2checkout':     '2checkout-refund',
  cybersource:     'cybersource-refund',
  worldpay:        'worldpay-refund',
}

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')
const fmtDate = iso => new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })

const card = { padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }

export default function RefundsConsole({ supabase, vendorId, onBack, accent = '#DC2626' }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('paid')
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!supabase || !vendorId) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('vendor_orders')
        .select('id, status, items, subtotal, total, customer_name, gateway_used, payment_intent_id, payment_status, refund_status, refund_amount, refunded_at, payment_confirmed_at, payment_method, created_at')
        .eq('vendor_id', vendorId)
        .not('payment_intent_id', 'is', null)
        .order('payment_confirmed_at', { ascending: false, nullsFirst: false })
        .limit(200)
      if (!cancelled) { setOrders(data || []); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [vendorId])

  const filtered = orders.filter(o => {
    if (filter === 'refunded') return o.refund_status
    if (filter === 'paid')     return o.payment_status === 'paid' && !o.refund_status
    return true
  })

  const doRefund = async (order, amount) => {
    if (!supabase) return
    const fn = REFUND_FUNCTION_BY_GATEWAY[order.gateway_used]
    if (!fn) { setMsg(`No refund function for "${order.gateway_used || 'unknown gateway'}".`); setTimeout(() => setMsg(''), 2400); return }
    setBusy(order.id); setMsg('')
    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { order_id: order.id, payment_intent_id: order.payment_intent_id, amount, vendor_id: vendorId, table: 'vendor_orders' },
      })
      if (error) throw error
      await supabase.from('vendor_orders').update({
        refund_status: 'requested', refund_amount: amount, refund_id: data?.refund_id || null,
      }).eq('id', order.id)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, refund_status: 'requested', refund_amount: amount } : o))
      setMsg(`Refund requested for #${String(order.id).slice(-6)}.`)
    } catch (e) {
      setMsg(`Refund failed: ${e?.message || e}`)
    } finally {
      setBusy(null)
      setTimeout(() => setMsg(''), 2800)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Refunds</h2>
      </div>

      <div style={{ ...card, marginBottom: 12, border: `1px solid ${accent}55`, background: `${accent}22` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>How refunds work</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
          Refunds go through your connected gateway. StreetLocal doesn't hold any funds. The amount is reversed straight from your gateway balance.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[{ id: 'paid', l: 'Paid' }, { id: 'refunded', l: 'Refunded' }, { id: 'all', l: 'All' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: filter === f.id ? accent : 'rgba(255,255,255,0.08)', color: '#fff' }}>{f.l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 30, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          {filter === 'refunded' ? 'No refunds yet.' : 'No paid orders to refund.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(o => {
            const total = Number(o.total ?? o.subtotal) || 0
            const refunded = !!o.refund_status
            return (
              <div key={o.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>#{String(o.id).slice(-6)}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginLeft: 8 }}>{o.customer_name || 'Customer'}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(total)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  {o.gateway_used || o.payment_method} · {o.payment_confirmed_at ? fmtDate(o.payment_confirmed_at) : '—'}
                </div>
                {refunded ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                      background: o.refund_status === 'completed' ? 'rgba(34,197,94,0.15)' : o.refund_status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(250,204,21,0.15)',
                      color: o.refund_status === 'completed' ? '#22C55E' : o.refund_status === 'failed' ? '#FCA5A5' : '#FACC15' }}>
                      {String(o.refund_status).toUpperCase()}
                    </span>
                    {o.refund_amount && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{fmtRp(o.refund_amount)} {o.refunded_at ? `· ${fmtDate(o.refunded_at)}` : ''}</span>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => doRefund(o, total)} disabled={busy === o.id || !o.gateway_used} style={{ flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', opacity: busy === o.id || !o.gateway_used ? 0.5 : 1 }}>
                      {busy === o.id ? 'Refunding…' : `Full refund ${fmtRp(total)}`}
                    </button>
                    <button onClick={() => {
                      const partial = Number(window.prompt('Partial refund amount (IDR)', String(Math.round(total / 2))) || 0)
                      if (partial > 0 && partial <= total) doRefund(o, partial)
                    }} disabled={busy === o.id || !o.gateway_used} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Partial</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {msg && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: 12, background: msg.toLowerCase().includes('fail') ? '#EF4444' : accent, color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 999 }}>{msg}</div>}
    </>
  )
}
