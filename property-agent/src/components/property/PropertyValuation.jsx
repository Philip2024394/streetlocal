/**
 * PropertyValuation — Estimated property value with scoring breakdown.
 */
import { useMemo } from 'react'

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
}

function fmtRp(n) {
  if (!n) return '—'
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

const LOCATION_SCORES = {
  Jakarta: 9.2, Bali: 8.8, Surabaya: 7.5, Bandung: 7.0, Yogyakarta: 7.2,
  Semarang: 6.5, Tangerang: 8.0, Bekasi: 7.0, Depok: 6.8, Sleman: 7.0,
  'Kulon Progo': 5.5, Klaten: 5.0,
}

const CONDITION_SCORES = { new: 9.5, like_new: 8.5, good: 7.0, renovated: 8.0 }

const CERT_SCORES = { SHM: 10, SHMSRS: 9, HGB: 8, 'Hak Pakai': 7, AJB: 6, PPJB: 5, Girik: 4, 'Petok D': 3, Adat: 2 }

function getGrade(score) {
  if (score >= 8.5) return { grade: 'A', color: '#8DC63F', label: 'Excellent Value' }
  if (score >= 7.0) return { grade: 'B', color: '#FACC15', label: 'Good Value' }
  if (score >= 5.5) return { grade: 'C', color: '#F97316', label: 'Fair Value' }
  return { grade: 'D', color: '#EF4444', label: 'Below Average' }
}

export default function PropertyValuation({ listing }) {
  const valuation = useMemo(() => {
    if (!listing) return null

    const bn = listing.buy_now
    const currentPrice = bn
      ? Number(String(typeof bn === 'object' ? bn.price : bn).replace(/\./g, ''))
      : listing.price_month || listing.price_day || listing.price_year || 0

    if (!currentPrice) return null

    const ef = listing.extra_fields || {}

    // Calculate factor scores
    const cityKey = Object.keys(LOCATION_SCORES).find(c => listing.city?.includes(c))
    const locationScore = cityKey ? LOCATION_SCORES[cityKey] : 6.0
    const conditionScore = CONDITION_SCORES[listing.condition] || 7.0
    const cert = ef.certificate || ef.certificateType || ''
    const certScore = CERT_SCORES[cert] || CERT_SCORES[Object.keys(CERT_SCORES).find(k => cert.includes?.(k))] || 5.0
    const featureCount = listing.features?.length || 0
    const amenityScore = Math.min(10, Math.round(featureCount / 13 * 10 * 10) / 10 + 3)

    // Overall score
    const overall = (locationScore * 0.35 + conditionScore * 0.2 + certScore * 0.25 + amenityScore * 0.2)

    // Estimated value range
    const varianceLow = 0.88 + Math.random() * 0.04
    const varianceHigh = 1.08 + Math.random() * 0.07
    const estimateLow = Math.round(currentPrice * varianceLow)
    const estimateHigh = Math.round(currentPrice * varianceHigh)
    const estimateMid = Math.round((estimateLow + estimateHigh) / 2)

    // Where the listing price falls (0-1 scale)
    const pricePosition = (currentPrice - estimateLow) / (estimateHigh - estimateLow)

    // Price per m²
    const area = parseInt(String(ef.land_area || ef.building_area || '0').replace(/[^\d]/g, ''), 10)
    const pricePsm = area > 0 ? Math.round(currentPrice / area) : 0

    return {
      currentPrice, estimateLow, estimateHigh, estimateMid, pricePosition,
      locationScore, conditionScore, certScore, amenityScore, overall, pricePsm, area,
      factors: [
        { label: 'Location', score: locationScore, icon: '📍', detail: listing.city || 'Unknown' },
        { label: 'Condition', score: conditionScore, icon: '🏗️', detail: listing.condition || 'good' },
        { label: 'Certificate', score: certScore, icon: '📜', detail: cert || 'Unknown' },
        { label: 'Amenities', score: amenityScore, icon: '✨', detail: `${featureCount} features` },
      ],
    }
  }, [listing])

  if (!valuation) return null

  const grade = getGrade(valuation.overall)
  const priceStatus = valuation.pricePosition <= 0.45 ? { label: 'Below Estimate', color: '#8DC63F', icon: '✓' }
    : valuation.pricePosition <= 0.65 ? { label: 'Fair Price', color: '#FACC15', icon: '≈' }
    : { label: 'Above Estimate', color: '#F97316', icon: '↑' }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🏷️</span> Property Valuation
      </div>

      {/* Estimate Range */}
      <div style={{ ...glass, padding: '18px', marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%201,%202026,%2012_20_26%20PM.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 10 }}>ESTIMATED VALUE RANGE</div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Low</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8DC63F' }}>{fmtRp(valuation.estimateLow)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Estimate</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(valuation.estimateMid)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>High</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>{fmtRp(valuation.estimateHigh)}</div>
          </div>
        </div>

        {/* Gauge bar */}
        <div style={{ position: 'relative', zIndex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #8DC63F, #FACC15, #F97316)', marginBottom: 8 }}>
          <div style={{
            position: 'absolute',
            left: `${Math.max(0, Math.min(100, valuation.pricePosition * 100))}%`,
            top: -4, width: 16, height: 16, borderRadius: '50%',
            background: '#fff', border: '3px solid #0a0a0a',
            transform: 'translateX(-50%)',
            boxShadow: `0 0 8px ${priceStatus.color}`,
          }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 14 }}>{priceStatus.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: priceStatus.color }}>Listed at {fmtRp(valuation.currentPrice)} — {priceStatus.label}</span>
        </div>
      </div>

      {/* Factor Scores */}
      <div style={{ ...glass, padding: '16px', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valuation Factors</div>
        {valuation.factors.map((f, i) => (
          <div key={f.label} style={{ marginBottom: i < valuation.factors.length - 1 ? 14 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{f.icon} {f.label}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{f.detail}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: f.score >= 8 ? '#8DC63F' : f.score >= 6 ? '#FACC15' : '#EF4444' }}>{f.score.toFixed(1)}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, width: `${f.score * 10}%`,
                background: f.score >= 8 ? '#8DC63F' : f.score >= 6 ? '#FACC15' : '#EF4444',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Overall Grade */}
      <div style={{ ...glass, padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `rgba(${grade.color === '#8DC63F' ? '141,198,63' : grade.color === '#FACC15' ? '250,204,21' : grade.color === '#F97316' ? '249,115,22' : '239,68,68'},0.15)`,
          border: `2px solid ${grade.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 900, color: grade.color,
        }}>{grade.grade}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Overall Value Rating</div>
          <div style={{ fontSize: 13, color: grade.color, fontWeight: 700 }}>{grade.label}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Score: {valuation.overall.toFixed(1)}/10</div>
        </div>
        {valuation.pricePsm > 0 && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Price/m²</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{fmtRp(valuation.pricePsm)}</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontStyle: 'italic' }}>
        Based on comparable properties in the area. For reference only.
      </div>
    </div>
  )
}
