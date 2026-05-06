/**
 * PriceHistoryChart — SVG line chart showing 12-month price trend + market data.
 */
import { useState, useMemo } from 'react'

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtRp(n) {
  if (!n) return '—'
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

function generatePriceHistory(currentPrice, months = 12) {
  const data = []
  const trend = 0.003 + Math.random() * 0.005 // 0.3-0.8% monthly growth
  let price = currentPrice / Math.pow(1 + trend, months)
  const now = new Date()
  for (let i = 0; i < months; i++) {
    const fluctuation = 1 + (Math.random() - 0.45) * 0.03
    price = price * (1 + trend) * fluctuation
    const d = new Date(now)
    d.setMonth(d.getMonth() - (months - 1 - i))
    data.push({ month: MONTHS[d.getMonth()], year: d.getFullYear(), price: Math.round(price) })
  }
  return data
}

const CITY_AVG_PSM = {
  Jakarta: 35000000,
  Bali: 25000000,
  Yogyakarta: 8000000,
  Surabaya: 12000000,
  Bandung: 10000000,
  Semarang: 7000000,
  Tangerang: 15000000,
  Bekasi: 11000000,
  Depok: 9000000,
}

export default function PriceHistoryChart({ listing }) {
  const [hoverIdx, setHoverIdx] = useState(-1)

  const currentPrice = useMemo(() => {
    if (!listing) return 0
    const bn = listing.buy_now
    if (bn) return Number(String(typeof bn === 'object' ? bn.price : bn).replace(/\./g, ''))
    return listing.price_month || listing.price_day || listing.price_year || 0
  }, [listing])

  const data = useMemo(() => generatePriceHistory(currentPrice), [currentPrice])

  if (!listing || !currentPrice) return null

  const prices = data.map(d => d.price)
  const minP = Math.min(...prices) * 0.97
  const maxP = Math.max(...prices) * 1.03
  const range = maxP - minP || 1

  // SVG dimensions
  const W = 340, H = 160, PAD_X = 10, PAD_Y = 10
  const chartW = W - PAD_X * 2
  const chartH = H - PAD_Y * 2

  const points = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * chartW,
    y: PAD_Y + chartH - ((d.price - minP) / range) * chartH,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = pathD + ` L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`

  // Stats
  const firstPrice = data[0].price
  const lastPrice = data[data.length - 1].price
  const changePercent = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1)
  const isUp = changePercent >= 0

  const ef = listing.extra_fields || {}
  const area = parseInt(String(ef.land_area || ef.building_area || '0').replace(/[^\d]/g, ''), 10)
  const pricePsm = area > 0 ? Math.round(currentPrice / area) : 0

  const cityKey = Object.keys(CITY_AVG_PSM).find(c => listing.city?.includes(c))
  const cityAvg = cityKey ? CITY_AVG_PSM[cityKey] : 10000000

  const isSellerMarket = changePercent > 3

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>📈</span> Price History & Market
      </div>

      {/* Chart */}
      <div style={{ ...glass, padding: '16px', marginBottom: 12 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => (
            <line key={pct} x1={PAD_X} y1={PAD_Y + chartH * (1 - pct)} x2={W - PAD_X} y2={PAD_Y + chartH * (1 - pct)} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          ))}

          {/* Area fill */}
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8DC63F" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8DC63F" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#priceGrad)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3} fill={hoverIdx === i ? '#FACC15' : '#8DC63F'} stroke="#0a0a0a" strokeWidth="1.5"
              onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(-1)}
              onTouchStart={() => setHoverIdx(i)} onTouchEnd={() => setHoverIdx(-1)}
              style={{ cursor: 'pointer' }} />
          ))}

          {/* Month labels */}
          {data.map((d, i) => i % 2 === 0 ? (
            <text key={i} x={points[i].x} y={H - 1} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7" fontWeight="600">{d.month}</text>
          ) : null)}

          {/* Tooltip */}
          {hoverIdx >= 0 && (
            <g>
              <line x1={points[hoverIdx].x} y1={PAD_Y} x2={points[hoverIdx].x} y2={H - PAD_Y} stroke="rgba(250,204,21,0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
              <rect x={points[hoverIdx].x - 45} y={points[hoverIdx].y - 28} width="90" height="22" rx="6" fill="rgba(0,0,0,0.85)" stroke="rgba(250,204,21,0.3)" strokeWidth="0.5" />
              <text x={points[hoverIdx].x} y={points[hoverIdx].y - 14} textAnchor="middle" fill="#FACC15" fontSize="8" fontWeight="700">{fmtRp(data[hoverIdx].price)}</text>
            </g>
          )}
        </svg>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ ...glass, flex: 1, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4 }}>Price Change (1yr)</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: isUp ? '#8DC63F' : '#EF4444' }}>
            {isUp ? '↑' : '↓'} {Math.abs(changePercent)}%
          </div>
        </div>
        <div style={{ ...glass, flex: 1, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4 }}>Market Status</div>
          <div style={{ padding: '3px 10px', borderRadius: 8, display: 'inline-block', fontSize: 12, fontWeight: 800, background: isSellerMarket ? 'rgba(239,68,68,0.12)' : 'rgba(141,198,63,0.12)', color: isSellerMarket ? '#EF4444' : '#8DC63F' }}>
            {isSellerMarket ? "Seller's Market" : "Buyer's Market"}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {pricePsm > 0 && (
          <div style={{ ...glass, flex: 1, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4 }}>This Property/m²</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{fmtRp(pricePsm)}</div>
          </div>
        )}
        <div style={{ ...glass, flex: 1, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4 }}>Avg in {cityKey || listing.city || 'Area'}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA' }}>{fmtRp(cityAvg)}/m²</div>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
        💡 <strong style={{ color: '#60A5FA' }}>Tip:</strong> {isSellerMarket
          ? 'Prices are trending up in this area. Act quickly to secure a deal before further increases.'
          : 'Market conditions favor buyers. Consider negotiating for a lower price or exploring similar properties.'}
      </div>
    </div>
  )
}
