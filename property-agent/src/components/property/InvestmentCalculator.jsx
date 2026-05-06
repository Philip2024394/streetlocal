import React from 'react'
import { calculateRentalYield } from '@/services/investorService'

const glass = {
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
}

const GREEN = '#8DC63F'
const GOLD = '#FACC15'

function formatIDR(n) {
  if (n == null) return '—'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function YieldBar({ label, value, max, color }) {
  const pct = Math.min((parseFloat(value) / max) * 100, 100)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{label}</span>
        <span style={{ color, fontSize: 13, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

export default function InvestmentCalculator({ buyPrice, monthlyRent }) {
  const yieldData = calculateRentalYield(buyPrice, monthlyRent)

  if (!yieldData) {
    return (
      <div style={{ ...glass, padding: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, textAlign: 'center' }}>
          Insufficient data to calculate investment returns.
        </p>
      </div>
    )
  }

  const { grossYield, netYield, annualIncome } = yieldData
  const buy = Number(String(buyPrice).replace(/\./g, ''))
  const breakEvenYears = annualIncome > 0 ? Math.ceil(buy / annualIncome) : null
  const maxBar = Math.max(parseFloat(grossYield), 12)

  // Reference comparison benchmarks
  const comparisons = [
    { label: 'Indonesia Bank Deposit', yield: 3.5 },
    { label: 'S&P 500 Average', yield: 7.0 },
    { label: 'This Property (Gross)', yield: parseFloat(grossYield) },
  ]

  return (
    <div style={{ ...glass, padding: 20 }}>
      <h4 style={{ color: '#fff', margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>
        Investment Calculator
      </h4>

      {/* Key metrics row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1, background: 'rgba(141,198,63,0.1)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>Gross Yield</div>
          <div style={{ color: GREEN, fontSize: 20, fontWeight: 800 }}>{grossYield}%</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(250,204,21,0.1)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>Net Yield</div>
          <div style={{ color: GOLD, fontSize: 20, fontWeight: 800 }}>{netYield}%</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>Annual Income</div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{formatIDR(annualIncome)}</div>
        </div>
      </div>

      {/* ROI timeline */}
      {breakEvenYears && (
        <div style={{
          background: 'rgba(141,198,63,0.08)',
          border: '1px solid rgba(141,198,63,0.2)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>&#x1F4C8;</span>
          <div>
            <div style={{ color: GREEN, fontSize: 13, fontWeight: 700 }}>
              Break even in ~{breakEvenYears} years
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
              Based on current rental income at net yield
            </div>
          </div>
        </div>
      )}

      {/* Yield bars */}
      <div style={{ marginBottom: 18 }}>
        <YieldBar label="Gross Yield" value={grossYield} max={maxBar} color={GREEN} />
        <YieldBar label="Net Yield" value={netYield} max={maxBar} color={GOLD} />
      </div>

      {/* Comparison section */}
      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Yield Comparison
        </div>
        {comparisons.map((c, i) => {
          const isProperty = i === comparisons.length - 1
          return (
            <div key={c.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ color: isProperty ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: isProperty ? 600 : 400 }}>
                {c.label}
              </span>
              <span style={{ color: isProperty ? GREEN : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700 }}>
                {c.yield.toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
