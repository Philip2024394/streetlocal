/**
 * Shared CheckoutSheet — overlay that mints a gateway charge against a
 * vendor_orders or food_orders row, then opens Snap (Midtrans) or
 * redirects (Stripe / Xendit) to collect payment.
 *
 * Polls the order row for ~30s after the gateway callback to confirm
 * the webhook auto-marked it as paid. Renders status updates inline.
 *
 * Props:
 *   - supabase        Supabase client
 *   - orderId         row id (uuid for vendor_orders, bigint for food_orders)
 *   - orderTable      'vendor_orders' | 'food_orders'
 *   - vendorId        for vendor_orders flow
 *   - restaurantId    for food_orders flow
 *   - chargeFnName    'vendor-order-create-charge' | 'food-order-create-charge'
 *   - paymentField    'payment_status' (vendor_orders) | 'status' (food_orders)
 *   - paidValues      array of values that mean "paid" for paymentField
 *   - total           IDR, for header display
 *   - shopName        for header
 *   - onClose / onConfirmed
 */
import React, { useEffect, useState } from 'react'

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')

async function loadSnap(clientKey, mode) {
  if (typeof window === 'undefined') return null
  if (window.snap) return window.snap
  const src = mode === 'live'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    if (clientKey) s.setAttribute('data-client-key', clientKey)
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return window.snap || null
}

export default function CheckoutSheet({
  supabase, orderId, orderTable, vendorId, restaurantId,
  chargeFnName, paymentField = 'payment_status', paidValues = ['paid', 'confirmed'],
  total, shopName, onClose, onConfirmed,
}) {
  const [phase, setPhase] = useState('idle')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setPhase('charging'); setMsg('')
      try {
        const body = orderTable === 'vendor_orders'
          ? { vendorOrderId: orderId, vendorId, returnUrl: window.location.href }
          : { foodOrderId: orderId, restaurantId, returnUrl: window.location.href }
        const { data, error } = await supabase.functions.invoke(chargeFnName, { body })
        if (cancelled) return
        if (error) throw new Error(error.message || 'Could not create charge')
        if (data?.error) throw new Error(data.error)

        let snapResult = null
        if (data.gateway === 'midtrans' && data.token) {
          const snap = await loadSnap(data.clientKey, data.mode)
          if (snap) {
            snapResult = await new Promise((resolve, reject) => {
              snap.pay(data.token, {
                onSuccess: () => resolve({ paid: true }),
                onPending: () => resolve({ pending: true }),
                onError:   (err) => reject(err),
                onClose:   () => reject(new Error('closed')),
              })
            })
          }
        }
        if (!snapResult && data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
        }

        setPhase('activating'); setMsg('Confirming with the gateway…')
        // Poll the order row for up to 30s.
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000))
          if (cancelled) return
          const { data: row } = await supabase.from(orderTable).select(`id, ${paymentField}`).eq('id', orderId).single()
          if (row && paidValues.includes(row[paymentField])) {
            setPhase('confirmed'); setMsg('Payment confirmed!')
            onConfirmed?.(row); return
          }
        }
        setPhase('confirmed'); setMsg('Payment processing — your order will update once the gateway clears it.')
        onConfirmed?.({ id: orderId })
      } catch (e) {
        if (cancelled) return
        if (e?.message === 'closed') { setPhase('closed'); setMsg('Checkout closed — no charge.') }
        else { setPhase('failed'); setMsg(e?.message || 'Checkout failed.') }
      }
    })()
    return () => { cancelled = true }
  }, [orderId])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10010,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f0f12', borderRadius: 24, padding: 24, maxWidth: 380, width: '100%',
        color: '#fff', border: '1px solid rgba(220,38,38,0.30)', boxShadow: '0 12px 40px rgba(220,38,38,0.18)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Secure payment</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{shopName || 'Order'}</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#FACC15', marginBottom: 16 }}>{fmtRp(total)}</div>

        <div style={{ padding: 14, borderRadius: 12, background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.30)', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            {phase === 'charging'   && '🔄 Opening payment…'}
            {phase === 'activating' && '⏳ Confirming with gateway…'}
            {phase === 'confirmed'  && '✓ Confirmed'}
            {phase === 'failed'     && '✕ Could not complete'}
            {phase === 'closed'     && '✕ Closed — no charge made'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            {msg || 'Card, GoPay, ShopeePay, QRIS, BCA/BNI/BRI/Mandiri VA all supported.'}
          </div>
        </div>

        <button onClick={onClose} style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none',
          background: phase === 'confirmed' ? '#DC2626' : 'rgba(255,255,255,0.06)',
          color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
        }}>{phase === 'confirmed' ? 'View order' : 'Close'}</button>
      </div>
    </div>
  )
}
