// CheckoutSheet — full-screen overlay that opens Midtrans Snap for the
// customer using the VENDOR'S connected gateway keys. Server-side webhook
// auto-confirms the order. No layout changes to RestaurantMenuSheet —
// this is a peer component the menu mounts when the customer hits pay.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { chargeFoodOrder, pollOrderConfirmed } from '@/services/foodOrderChargeService'

const fmtRp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')

export default function CheckoutSheet({ foodOrderId, restaurantId, total, restaurantName, onClose, onConfirmed }) {
  const [phase, setPhase] = useState('idle')  // idle | charging | activating | confirmed | failed | closed
  const [msg, setMsg] = useState('')

  // Kick off Snap as soon as the sheet opens.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setPhase('charging'); setMsg('')
      try {
        const result = await chargeFoodOrder({ foodOrderId, restaurantId })
        if (cancelled) return
        setPhase('activating'); setMsg('Confirming with the gateway…')
        const row = await pollOrderConfirmed(foodOrderId)
        if (cancelled) return
        if (row?.status === 'confirmed') {
          setPhase('confirmed'); setMsg('Payment confirmed!')
          onConfirmed?.(row)
        } else {
          // Pending — webhook might still arrive.
          setPhase('confirmed'); setMsg(result?.pending ? 'Payment pending — we will confirm once your bank clears it.' : 'Payment received. If the order doesn\'t move, refresh in a minute.')
          onConfirmed?.({ id: foodOrderId, status: result?.pending ? 'payment_submitted' : 'confirmed' })
        }
      } catch (e) {
        if (cancelled) return
        if (e?.message === 'closed') { setPhase('closed'); setMsg('Checkout closed — no charge.') }
        else { setPhase('failed'); setMsg(e?.message || 'Checkout failed. Try again.') }
      }
    })()
    return () => { cancelled = true }
  }, [foodOrderId, restaurantId])

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10010,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f0f12', borderRadius: 24, padding: 24, maxWidth: 380, width: '100%',
        color: '#fff', border: '1px solid rgba(220,38,38,0.30)', boxShadow: '0 12px 40px rgba(220,38,38,0.18)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Secure payment via Midtrans</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{restaurantName || 'Restaurant'}</div>
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
    </div>,
    document.body
  )
}
