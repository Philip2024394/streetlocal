/**
 * AreaGuidePage — Area investment guide for foreign investors looking at Indonesian property.
 * Detailed breakdowns of key investment regions with honest assessments.
 */

const REGIONS = [
  {
    name: 'Bali',
    area: 'Canggu / Seminyak',
    priceRange: '$300K-$700K',
    propertyType: 'Avg villa price',
    yield: '10-15%',
    yieldNote: 'Airbnb',
    occupancy: '70-85% high season, 40-55% low season',
    growth: '~50% (2024)',
    bestFor: 'Short-term rental investors',
    risk: 'Medium',
    riskDetail: 'Oversupply in some areas, seasonal',
    honestNote: 'Premium locations still perform, but emerging areas carry higher risk. Due diligence essential.',
  },
  {
    name: 'Bali',
    area: 'Uluwatu / Nusa Dua',
    priceRange: '$400K-$1M+',
    propertyType: 'Avg villa price',
    yield: '8-12%',
    yieldNote: '',
    occupancy: '65-80%',
    growth: 'Strong (luxury segment)',
    bestFor: 'Luxury/premium investors',
    risk: 'Medium',
    riskDetail: 'Higher entry cost, longer ROI timeline',
    honestNote: 'Luxury market is resilient but capital-intensive. Best for investors with $500K+ budget.',
  },
  {
    name: 'Bali',
    area: 'Tabanan / North Bali',
    priceRange: '$100K-$250K',
    propertyType: 'Avg price',
    yield: '6-10%',
    yieldNote: 'emerging',
    occupancy: '30-50% (growing)',
    growth: 'Early stage',
    bestFor: 'Long-term capital growth, patient investors',
    risk: 'High',
    riskDetail: 'Infrastructure still developing, lower demand currently',
    honestNote: 'Emerging area — lower entry price but unproven rental demand. Speculative.',
  },
  {
    name: 'Jakarta',
    area: '',
    priceRange: '$150K-$400K',
    propertyType: 'Avg apartment price',
    yield: '5-8%',
    yieldNote: '',
    occupancy: '75-90% (long-term tenants)',
    growth: 'Stable 3-5%/year',
    bestFor: 'Stable long-term rental income',
    risk: 'Low',
    riskDetail: 'Oversupply of apartments in some areas',
    honestNote: 'Reliable income, lower growth. Best for risk-averse investors seeking steady yield.',
  },
  {
    name: 'Lombok',
    area: '',
    priceRange: '$80K-$200K',
    propertyType: 'Avg villa/land price',
    yield: '8-12%',
    yieldNote: 'projected',
    occupancy: '40-60% (growing fast)',
    growth: '15-25%/year (early market)',
    bestFor: 'Early movers, high growth potential',
    risk: 'High',
    riskDetail: 'Infrastructure gaps, less proven market',
    honestNote: "The 'next Bali' narrative — genuine potential but 5-10 year timeline. Low entry, high reward if patient.",
  },
  {
    name: 'Yogyakarta',
    area: '',
    priceRange: '$50K-$150K',
    propertyType: 'Avg price',
    yield: '6-9%',
    yieldNote: 'student + tourism',
    occupancy: '70-85% (students are stable tenants)',
    growth: '5-8%/year',
    bestFor: 'Budget investors, student rental market',
    risk: 'Low',
    riskDetail: 'Lower capital appreciation, smaller market',
    honestNote: "Affordable entry with stable demand from universities and tourism. Won't make you rich fast, but reliable.",
  },
]

const RISK_COLORS = {
  Low: '#8DC63F',
  Medium: '#FACC15',
  High: '#EF4444',
}

export default function AreaGuidePage({ onBack, onNavigate }) {
  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="ws-container">
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            marginBottom: 24,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Back
        </button>

        {/* Title */}
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
          Area <span style={{ color: '#8DC63F' }}>Investment Guide</span>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', margin: '0 0 48px', maxWidth: 650 }}>
          Detailed breakdown of key Indonesian property investment regions. Honest data for foreign investors making real decisions.
        </p>

        {/* Region Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24, marginBottom: 64 }}>
          {REGIONS.map((r, i) => (
            <div
              key={i}
              style={{
                padding: '28px 24px',
                borderRadius: 20,
                background: 'rgba(0,0,0,0.8)',
                border: `1px solid ${RISK_COLORS[r.risk]}33`,
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {/* Region Header */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
                  {r.name}
                  {r.area && <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}> — {r.area}</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: RISK_COLORS[r.risk], marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {r.risk} Risk
                </div>
              </div>

              {/* Data Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                <DataRow label={r.propertyType} value={r.priceRange} />
                <DataRow label="Rental Yield" value={r.yieldNote ? `${r.yield} (${r.yieldNote})` : r.yield} />
                <DataRow label="Occupancy" value={r.occupancy} />
                <DataRow label="Growth" value={r.growth} />
                <DataRow label="Best For" value={r.bestFor} />
                <DataRow label="Risk Factors" value={r.riskDetail} />
              </div>

              {/* Honest Note */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(250,204,21,0.06)',
                  border: '1px solid rgba(250,204,21,0.15)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FACC15', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>
                  Honest Assessment
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  {r.honestNote}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>
          Region Comparison
        </h2>
        <div style={{ overflowX: 'auto', marginBottom: 56, borderRadius: 16, border: '1px solid rgba(141,198,63,0.12)', background: 'rgba(141,198,63,0.03)', padding: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: 'inherit' }}>
            <thead>
              <tr style={{ background: 'rgba(141,198,63,0.08)' }}>
                {['Region', 'Price Range', 'Yield', 'Occupancy', 'Growth', 'Risk', 'Best For'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      fontSize: 14,
                      letterSpacing: 0.5,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#fff' }}>
                    {r.name}{r.area ? ` — ${r.area}` : ''}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{r.priceRange}</td>
                  <td style={{ padding: '12px 16px', color: '#8DC63F', fontWeight: 700 }}>{r.yield}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{r.occupancy}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{r.growth}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: RISK_COLORS[r.risk], fontWeight: 700 }}>{r.risk}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{r.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA — Not sure which area? */}
        <div
          style={{
            padding: '40px 32px',
            borderRadius: 20,
            background: 'rgba(141,198,63,0.06)',
            border: '1px solid rgba(141,198,63,0.2)',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
            Not sure which area?
          </h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Get a free consultation with our Indonesia property specialists. We will help you find the right region based on your budget, goals, and risk appetite.
          </p>
          <a
            href="https://wa.me/6281573635143"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              borderRadius: 12,
              background: '#8DC63F',
              color: '#000',
              fontSize: 15,
              fontWeight: 800,
              textDecoration: 'none',
              fontFamily: 'inherit',
            }}
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{value}</div>
    </div>
  )
}
