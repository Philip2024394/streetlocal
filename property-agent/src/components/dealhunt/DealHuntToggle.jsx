/**
 * DealHuntToggle — Add-on toggle for listing forms.
 * Lets sellers opt-in to show their listing on Deal Hunt with a discount.
 * Category-specific minimum discounts enforced.
 */
import { useState } from 'react'
import { getMinDiscount } from '@/services/dealService'

const glass = {
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

function fmtRp(n) {
  if (!n) return 'Rp 0'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

/**
 * Props:
 * - category: 'Property' | 'Cars' | 'Motorcycles' | etc.
 * - isSale: boolean (buy_now vs rental)
 * - price: number (the listed price)
 * - onToggle: (enabled, discountPct) => void
 */
export default function DealHuntToggle({ category, isSale, price, onToggle }) {
  const [enabled, setEnabled] = useState(false)
  const [pct, setPct] = useState(0)

  const minPct = getMinDiscount(category, isSale)
  const numPrice = Number(String(price || 0).replace(/\./g, '')) || 0
  const dealPrice = numPrice > 0 && pct > 0 ? Math.round(numPrice * (1 - pct / 100)) : 0
  const saving = numPrice - dealPrice

  // Build discount options based on min
  const options = []
  for (let v = minPct; v <= Math.min(50, minPct + 30); v += minPct <= 3 ? 2.5 : 5) {
    options.push(Math.round(v * 10) / 10)
  }
  if (!options.includes(minPct)) options.unshift(minPct)

  const handleToggle = () => {
    const next = !enabled
    setEnabled(next)
    if (next && pct === 0) {
      setPct(minPct)
      onToggle?.(true, minPct)
    } else {
      onToggle?.(next, next ? pct : 0)
    }
  }

  const handlePct = (v) => {
    setPct(v)
    onToggle?.(enabled, v)
  }

  return (
    <div style={{ ...glass, padding: 16, border: enabled ? '1.5px solid rgba(250,120,0,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enabled ? 14 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: enabled ? '#F97316' : '#fff' }}>Also list on Deal Hunt</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Reach more buyers with a deal</div>
          </div>
        </div>
        <button onClick={handleToggle} style={{
          width: 50, height: 28, borderRadius: 14, cursor: 'pointer', padding: 2,
          background: enabled ? '#F97316' : 'rgba(255,255,255,0.12)',
          border: 'none', display: 'flex', alignItems: 'center',
          justifyContent: enabled ? 'flex-end' : 'flex-start',
          transition: 'all 0.2s',
        }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: '#fff', transition: 'all 0.2s' }} />
        </button>
      </div>

      {enabled && (
        <>
          {/* Min info */}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
            Minimum discount for {category}{isSale ? ' (sale)' : ''}: <strong style={{ color: '#F97316' }}>{minPct}%</strong>
          </div>

          {/* Discount pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {options.map(v => (
              <button key={v} onClick={() => handlePct(v)} style={{
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                minWidth: 44, minHeight: 44,
                background: pct === v ? 'rgba(249,115,22,0.15)' : 'rgba(0,0,0,0.4)',
                border: pct === v ? '2px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color: pct === v ? '#F97316' : 'rgba(255,255,255,0.4)',
                fontSize: 14, fontWeight: 800,
              }}>{v}%</button>
            ))}
          </div>

          {/* Price preview */}
          {numPrice > 0 && pct > 0 && (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Listed price</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{fmtRp(numPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#F97316', fontWeight: 700 }}>Deal price ({pct}% off)</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#F97316' }}>{fmtRp(dealPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#8DC63F' }}>Buyer saves</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>{fmtRp(saving)}</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            ⏰ Deal appears on Deal Hunt for 7 days · You can renew anytime
          </div>
        </>
      )}
    </div>
  )
}
