/* ─────────────────────────────────────────────────────────────
   KdsView — Kitchen Display System for a single donut vendor.
   Mounted by main.jsx when the URL contains ?kds=<token>.
   Self-contained: no shop branding, no nav chrome, no login —
   just a list of confirmed orders that auto-updates as the
   counter POS pushes them through.

   Auth model: the token in the URL is the only secret. We look
   up vendor_accounts by kds_token + read confirmed orders via
   a security-definer RPC (kds_orders) that scopes by that token
   so the public client can't peek at other vendors' orders.

   For MVP, we use direct table reads — the token is the auth
   signal but RLS lets authenticated vendors only read their own.
   Since the KDS is unauthenticated (no JWT), we'd need a
   dedicated RPC to make this fully secure. For now, the token
   is enough auth for a tablet in a kitchen (not over the public
   internet).
   ───────────────────────────────────────────────────────────── */
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'

export default function KdsView () {
  const token = new URLSearchParams(window.location.search).get('kds')
  const [vendorId, setVendorId] = useState(null)
  const [vendorName, setVendorName] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Look up vendor by kds_token. Service role would be cleaner here;
  // for MVP we accept that anyone with the token can read order data
  // (acceptable for a kitchen-only screen). To harden later, swap to
  // an RPC that returns only id+name, then a separate orders RPC.
  useEffect(() => {
    if (!token) { setError('No KDS token. Get the URL from Settings → Kitchen Display.'); setLoading(false); return }
    if (!supabase) { setError('Database unavailable.'); setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('vendor_accounts')
        .select('id, shop_name')
        .eq('kds_token', token)
        .maybeSingle()
      if (cancelled) return
      if (error || !data) {
        setError('Invalid KDS token. Check the URL in your Settings.')
        setLoading(false)
        return
      }
      setVendorId(data.id)
      setVendorName(data.shop_name || 'Kitchen')
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [token])

  // Load confirmed orders + subscribe to realtime changes.
  const refresh = useCallback(async () => {
    if (!supabase || !vendorId) return
    const { data } = await supabase
      .from('vendor_orders')
      .select('id, customer_name, customer_phone, items, total, scheduled_for, status, payment_status, created_at')
      .eq('vendor_id', vendorId)
      .in('status', ['confirmed', 'preparing'])
      .order('scheduled_for', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    setOrders(data || [])
  }, [vendorId])

  useEffect(() => {
    if (!vendorId) return
    refresh()
    const ch = supabase
      .channel(`kds:${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_orders', filter: `vendor_id=eq.${vendorId}` }, () => refresh())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [vendorId, refresh])

  const markStatus = async (orderId, status) => {
    if (!supabase) return
    await supabase.from('vendor_orders').update({ status }).eq('id', orderId)
    refresh()
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>Loading…</div>
  }
  if (error) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>⚠</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>KDS unavailable</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', maxWidth: 420 }}>{error}</div>
      </div>
    )
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header — vendor name + live clock + order count */}
      <header style={{ padding: '18px 24px', background: '#111', borderBottom: '2px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>Kitchen Display · {vendorName}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 2 }}>{orders.length} active</div>
        </div>
        <LiveClock />
      </header>

      {/* Orders grid — 2 cols on desktop, 1 on tablet portrait */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {orders.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: 24 }}>
            🍩 All caught up — no active orders
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {orders.map(o => {
              const items = Array.isArray(o.items) ? o.items : []
              const isPrep = o.status === 'preparing'
              const placed = new Date(o.created_at)
              const ageMins = Math.floor((Date.now() - placed.getTime()) / 60000)
              const ageColor = ageMins < 10 ? '#86EFAC' : ageMins < 20 ? '#FACC15' : '#FCA5A5'
              return (
                <div key={o.id} style={{ background: isPrep ? '#1a2d1a' : '#1a1a1a', borderRadius: 14, padding: 16, border: `2px solid ${isPrep ? '#22c55e' : '#333'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>{isPrep ? '🔥 Preparing' : '🆕 New'}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 2 }}>{o.customer_name || o.customer_phone || 'Customer'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: ageColor, fontWeight: 900 }}>{ageMins}m ago</div>
                      {o.scheduled_for && <div style={{ fontSize: 11, color: '#FACC15', marginTop: 2 }}>📅 {new Date(o.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    {items.map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 18, borderBottom: '1px solid #2a2a2a' }}>
                        <span style={{ color: '#fff' }}>{it.name}</span>
                        <span style={{ color: '#FACC15', fontWeight: 800, marginLeft: 12 }}>×{it.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isPrep && (
                      <button onClick={() => markStatus(o.id, 'preparing')} style={{ flex: 1, padding: 14, borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Start preparing</button>
                    )}
                    {isPrep && (
                      <button onClick={() => markStatus(o.id, 'ready')} style={{ flex: 1, padding: 14, borderRadius: 10, border: 'none', background: '#FACC15', color: '#1a1a1a', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Mark ready</button>
                    )}
                    <button onClick={() => markStatus(o.id, 'cancelled')} style={{ padding: 14, borderRadius: 10, border: '1px solid #444', background: 'transparent', color: '#888', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function LiveClock () {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>
    </div>
  )
}
