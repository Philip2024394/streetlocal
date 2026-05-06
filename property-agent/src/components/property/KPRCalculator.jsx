/**
 * KPRCalculator — Mortgage/KPR calculator overlay for property FOR SALE listings.
 * Modes: Konvensional (with DTI), Syariah (Murabahah/Musyarakah), Take-Over (refinancing).
 * Banks loaded from Supabase via kprRatesService.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { fetchKprRates, DEFAULT_BANKS } from '@/services/kprRatesService'

const LOAN_TERMS = [10, 15, 20, 25, 30]
const MODES = [
  { id: 'konvensional', label: 'Konvensional', icon: '🏦' },
  { id: 'syariah', label: 'Syariah', icon: '🕌' },
  { id: 'takeover', label: 'Take-Over', icon: '🔄' },
]
const SYARIAH_BANKS = [
  { name: 'BSI', rate: 9.0, emoji: '🕌' },
  { name: 'BCA Syariah', rate: 9.5, emoji: '🏦' },
  { name: 'Mandiri Syariah', rate: 9.25, emoji: '🏛️' },
  { name: 'BNI Syariah', rate: 9.75, emoji: '🏢' },
]

function fmtRp(num) {
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(1)}M`
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`
}
function fmtRpFull(num) { return `Rp ${Math.round(num).toLocaleString('id-ID')}` }

function calcMonthly(principal, annualRate, years) {
  const r = annualRate / 100 / 12
  const n = years * 12
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function calcMurabahah(principal, marginRate, years) {
  const totalMargin = principal * (marginRate / 100) * years
  const total = principal + totalMargin
  return { monthly: total / (years * 12), total, totalMargin }
}

function calcMusyarakah(principal, marginRate, years) {
  // Simplified diminishing partnership: bank's share decreases linearly
  const months = years * 12
  const monthlyPrincipal = principal / months
  let totalPayment = 0
  for (let i = 0; i < months; i++) {
    const bankShare = principal - monthlyPrincipal * i
    const rent = bankShare * (marginRate / 100 / 12)
    totalPayment += monthlyPrincipal + rent
  }
  const avgMonthly = totalPayment / months
  return { monthly: avgMonthly, total: totalPayment, totalMargin: totalPayment - principal }
}

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
    border: active ? '2px solid #8DC63F' : '1px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
    color: active ? '#8DC63F' : 'rgba(255,255,255,0.6)',
    fontSize: 14, fontWeight: 700,
  }}>{children}</button>
)

const InputRp = ({ label, value, onChange, placeholder }) => (
  <div style={{ ...glass, padding: '14px 18px' }}>
    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 8 }}>{label}</div>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Rp 0'} style={{
      width: '100%', padding: '10px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
      color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    }} />
  </div>
)

export default function KPRCalculator({ open, onClose, propertyPrice = 500_000_000 }) {
  const [mode, setMode] = useState('konvensional')
  const [downPct, setDownPct] = useState(20)
  const [termIdx, setTermIdx] = useState(2)
  const [rate, setRate] = useState(8.5)
  const [toast, setToast] = useState('')
  const [banks, setBanks] = useState(DEFAULT_BANKS.map(b => ({ name: b.bank_name, rate: b.rate, emoji: b.emoji })))

  // Konvensional: DTI
  const [monthlyIncome, setMonthlyIncome] = useState('')

  // Syariah
  const [syariahMargin, setSyariahMargin] = useState(9.0)
  const [akadType, setAkadType] = useState('murabahah')

  // Take-Over
  const [toOutstanding, setToOutstanding] = useState('')
  const [toCurrentPayment, setToCurrentPayment] = useState('')
  const [toCurrentRate, setToCurrentRate] = useState('')
  const [toRemainingTenor, setToRemainingTenor] = useState('')
  const [toNewRate, setToNewRate] = useState(7.5)
  const [toNewTermIdx, setToNewTermIdx] = useState(2)

  useEffect(() => {
    fetchKprRates().then(data => {
      if (data?.length) setBanks(data.map(b => ({ name: b.bank_name, rate: b.rate, emoji: b.emoji })))
    })
  }, [])

  const term = LOAN_TERMS[termIdx]
  const downPayment = propertyPrice * (downPct / 100)
  const loanAmount = propertyPrice - downPayment

  // Konvensional result
  const konvResult = useMemo(() => {
    const monthly = calcMonthly(loanAmount, rate, term)
    const totalPayment = monthly * term * 12
    const totalInterest = totalPayment - loanAmount
    return { monthly, totalPayment, totalInterest }
  }, [loanAmount, rate, term])

  const bankResults = useMemo(() => banks.map(b => {
    const monthly = calcMonthly(loanAmount, b.rate, term)
    return { ...b, monthly, total: monthly * term * 12 }
  }), [loanAmount, term, banks])

  // DTI
  const incomeNum = parseFloat(String(monthlyIncome).replace(/\D/g, '')) || 0
  const dti = incomeNum > 0 ? (konvResult.monthly / incomeNum * 100) : 0
  const dtiColor = dti < 30 ? '#8DC63F' : dti < 40 ? '#FACC15' : '#EF4444'

  // Syariah result
  const syariahResult = useMemo(() => {
    if (akadType === 'murabahah') return calcMurabahah(loanAmount, syariahMargin, term)
    return calcMusyarakah(loanAmount, syariahMargin, term)
  }, [loanAmount, syariahMargin, term, akadType])

  const syariahBankResults = useMemo(() => SYARIAH_BANKS.map(b => {
    const r = akadType === 'murabahah' ? calcMurabahah(loanAmount, b.rate, term) : calcMusyarakah(loanAmount, b.rate, term)
    return { ...b, monthly: r.monthly, total: r.total }
  }), [loanAmount, term, akadType])

  // Take-Over result
  const toResult = useMemo(() => {
    const outstanding = parseFloat(String(toOutstanding).replace(/\D/g, '')) || 0
    const currentPmt = parseFloat(String(toCurrentPayment).replace(/\D/g, '')) || 0
    const remaining = parseFloat(toRemainingTenor) || 10
    if (!outstanding || !currentPmt) return null

    const newTerm = LOAN_TERMS[toNewTermIdx]
    const newMonthly = calcMonthly(outstanding, toNewRate, newTerm)
    const monthlySaving = currentPmt - newMonthly
    const totalSaving = monthlySaving * newTerm * 12
    const switchCostLow = outstanding * 0.01
    const switchCostHigh = outstanding * 0.02
    const breakEvenMonths = monthlySaving > 0 ? Math.ceil(switchCostHigh / monthlySaving) : 0
    const worthIt = totalSaving > switchCostHigh

    return { outstanding, currentPmt, newMonthly, monthlySaving, totalSaving, switchCostLow, switchCostHigh, breakEvenMonths, worthIt, newTerm }
  }, [toOutstanding, toCurrentPayment, toNewRate, toNewTermIdx, toRemainingTenor])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  if (!open) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9600, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ ...glass, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', flexShrink: 0, padding: '16px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>KPR Calculator</h1>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Mode Tabs */}
      <div style={{ flexShrink: 0, padding: '12px 16px 0', display: 'flex', gap: 8 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            border: mode === m.id ? '2px solid #8DC63F' : '1px solid rgba(255,255,255,0.08)',
            background: mode === m.id ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.03)',
            color: mode === m.id ? '#8DC63F' : 'rgba(255,255,255,0.45)',
            fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ═══ KONVENSIONAL ═══ */}
        {mode === 'konvensional' && <>
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6 }}>💰 Property Price</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FACC15' }}>{fmtRpFull(propertyPrice)}</div>
          </div>

          {/* DP */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>📊 Down Payment</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{downPct}%</span>
            </div>
            <input type="range" min={10} max={50} step={5} value={downPct} onChange={e => setDownPct(Number(e.target.value))} style={{ width: '100%', accentColor: '#8DC63F', height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>10%</span>
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{fmtRp(downPayment)}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>50%</span>
            </div>
          </div>

          {/* Term */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 10 }}>📅 Loan Term (Years)</div>
            <div style={{ display: 'flex', gap: 8 }}>{LOAN_TERMS.map((t, i) => <Pill key={t} active={termIdx === i} onClick={() => setTermIdx(i)}>{t}</Pill>)}</div>
          </div>

          {/* Rate */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>📈 Interest Rate</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{rate.toFixed(1)}%</span>
            </div>
            <input type="range" min={5} max={15} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))} style={{ width: '100%', accentColor: '#8DC63F', height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>5%</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>15%</span>
            </div>
          </div>

          {/* Monthly Income (DTI) */}
          <InputRp label="💼 Monthly Income (optional — for DTI)" value={monthlyIncome} onChange={setMonthlyIncome} placeholder="e.g. 15000000" />

          {/* Results */}
          <div style={{ ...glass, padding: '20px 18px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.2)' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 4 }}>💳 Monthly Payment</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', marginBottom: 6 }}>{fmtRpFull(konvResult.monthly)}</div>

            {/* DTI */}
            {incomeNum > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Debt-to-Income (DTI)</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: dtiColor }}>{dti.toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, dti)}%`, borderRadius: 3, background: dtiColor }} />
                </div>
                {dti > 40 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#EF4444', fontWeight: 600 }}>⚠️ DTI exceeds 40% — banks may reject this application</div>
                )}
                <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Most banks require DTI below 30-40%</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Loan Amount</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{fmtRp(loanAmount)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Total Interest</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ff6b6b' }}>{fmtRp(konvResult.totalInterest)}</div>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px', marginTop: 12 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Total Payment ({term} years)</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{fmtRp(konvResult.totalPayment)}</div>
            </div>
          </div>

          {/* Bank Comparison */}
          <div style={{ ...glass, padding: '18px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏦</span> Bank Rate Comparison
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bankResults.map(b => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{b.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.rate}% p.a.</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#FACC15' }}>{fmtRp(b.monthly)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/month</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => showToast('🏦 Contact bank directly to apply for KPR')} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6ba32e)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>
            <span style={{ fontSize: 18 }}>📋</span> Apply for KPR
          </button>
        </>}

        {/* ═══ SYARIAH ═══ */}
        {mode === 'syariah' && <>
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6 }}>💰 Property Price</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FACC15' }}>{fmtRpFull(propertyPrice)}</div>
          </div>

          {/* DP */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>📊 Down Payment</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{downPct}%</span>
            </div>
            <input type="range" min={10} max={50} step={5} value={downPct} onChange={e => setDownPct(Number(e.target.value))} style={{ width: '100%', accentColor: '#8DC63F', height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>10%</span>
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{fmtRp(downPayment)}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>50%</span>
            </div>
          </div>

          {/* Akad Type */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 10 }}>📜 Akad Type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAkadType('murabahah')} style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, textAlign: 'center',
                border: akadType === 'murabahah' ? '2px solid #8DC63F' : '1px solid rgba(255,255,255,0.1)',
                background: akadType === 'murabahah' ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                color: akadType === 'murabahah' ? '#8DC63F' : 'rgba(255,255,255,0.5)',
              }}>Murabahah<br /><span style={{ fontSize: 10, fontWeight: 500 }}>Cost + Margin</span></button>
              <button onClick={() => setAkadType('musyarakah')} style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, textAlign: 'center',
                border: akadType === 'musyarakah' ? '2px solid #8DC63F' : '1px solid rgba(255,255,255,0.1)',
                background: akadType === 'musyarakah' ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                color: akadType === 'musyarakah' ? '#8DC63F' : 'rgba(255,255,255,0.5)',
              }}>Musyarakah<br /><span style={{ fontSize: 10, fontWeight: 500 }}>Diminishing</span></button>
            </div>
          </div>

          {/* Term */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 10 }}>📅 Tenor (Years)</div>
            <div style={{ display: 'flex', gap: 8 }}>{LOAN_TERMS.map((t, i) => <Pill key={t} active={termIdx === i} onClick={() => setTermIdx(i)}>{t}</Pill>)}</div>
          </div>

          {/* Margin Rate */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>🕌 Margin Rate</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{syariahMargin.toFixed(1)}%</span>
            </div>
            <input type="range" min={5} max={15} step={0.25} value={syariahMargin} onChange={e => setSyariahMargin(Number(e.target.value))} style={{ width: '100%', accentColor: '#8DC63F', height: 6 }} />
          </div>

          {/* Results */}
          <div style={{ ...glass, padding: '20px 18px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.2)' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 4 }}>💳 Monthly Payment ({akadType === 'murabahah' ? 'Fixed' : 'Average'})</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', marginBottom: 12 }}>{fmtRpFull(syariahResult.monthly)}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Total Margin</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>{fmtRp(syariahResult.totalMargin)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Total ({term}yr)</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{fmtRp(syariahResult.total)}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(96,165,250,0.08)', fontSize: 12, color: '#60A5FA', fontWeight: 600 }}>
              ✓ {akadType === 'murabahah' ? 'Fixed payment — your installment never changes over the entire tenor' : 'Payment decreases over time as the bank\'s share diminishes'}
            </div>
          </div>

          {/* Syariah Bank Comparison */}
          <div style={{ ...glass, padding: '18px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🕌</span> Syariah Bank Comparison
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {syariahBankResults.map(b => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{b.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.rate}% margin</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#FACC15' }}>{fmtRp(b.monthly)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/month</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => showToast('🕌 Contact Syariah bank to apply for KPR Syariah')} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6ba32e)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>
            <span style={{ fontSize: 18 }}>📋</span> Apply for KPR Syariah
          </button>
        </>}

        {/* ═══ TAKE-OVER ═══ */}
        {mode === 'takeover' && <>
          <div style={{ ...glass, padding: '14px 18px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}>
            <div style={{ fontSize: 13, color: '#60A5FA', fontWeight: 700 }}>🔄 Refinance your existing KPR to a better rate</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Enter your current KPR details to see if switching is worth it.</div>
          </div>

          <InputRp label="💰 Current Outstanding Loan" value={toOutstanding} onChange={setToOutstanding} placeholder="e.g. 400000000" />
          <InputRp label="💳 Current Monthly Payment" value={toCurrentPayment} onChange={setToCurrentPayment} placeholder="e.g. 4500000" />

          <div style={{ ...glass, padding: '14px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 8 }}>📈 Current Interest Rate (%)</div>
            <input value={toCurrentRate} onChange={e => setToCurrentRate(e.target.value)} placeholder="e.g. 10.5" style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }} />
          </div>

          <div style={{ ...glass, padding: '14px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 8 }}>📅 Remaining Tenor (years)</div>
            <input value={toRemainingTenor} onChange={e => setToRemainingTenor(e.target.value)} placeholder="e.g. 15" style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }} />
          </div>

          {/* New Rate */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>✨ New Interest Rate</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{toNewRate.toFixed(1)}%</span>
            </div>
            <input type="range" min={5} max={15} step={0.5} value={toNewRate} onChange={e => setToNewRate(Number(e.target.value))} style={{ width: '100%', accentColor: '#8DC63F', height: 6 }} />
          </div>

          {/* New Term */}
          <div style={{ ...glass, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 10 }}>📅 New Tenor (Years)</div>
            <div style={{ display: 'flex', gap: 8 }}>{LOAN_TERMS.map((t, i) => <Pill key={t} active={toNewTermIdx === i} onClick={() => setToNewTermIdx(i)}>{t}</Pill>)}</div>
          </div>

          {/* Take-Over Results */}
          {toResult && (
            <div style={{ ...glass, padding: '20px 18px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.2)' }}>
              {/* Current vs New */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, background: 'rgba(239,68,68,0.08)', borderRadius: 12, padding: '14px', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>CURRENT</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#EF4444' }}>{fmtRpFull(toResult.currentPmt)}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/month</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(141,198,63,0.08)', borderRadius: 12, padding: '14px', border: '1px solid rgba(141,198,63,0.15)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>NEW</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>{fmtRpFull(toResult.newMonthly)}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/month</div>
                </div>
              </div>

              {/* Savings */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Monthly Saving</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: toResult.monthlySaving > 0 ? '#8DC63F' : '#EF4444' }}>
                    {toResult.monthlySaving > 0 ? '+' : ''}{fmtRp(toResult.monthlySaving)}
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Total Saving ({toResult.newTerm}yr)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: toResult.totalSaving > 0 ? '#8DC63F' : '#EF4444' }}>{fmtRp(toResult.totalSaving)}</div>
                </div>
              </div>

              {/* Switching Cost & Break-even */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Est. Switching Cost (1-2%)</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>{fmtRp(toResult.switchCostLow)} – {fmtRp(toResult.switchCostHigh)}</div>
                {toResult.monthlySaving > 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Break-even in ~{toResult.breakEvenMonths} months</div>
                )}
              </div>

              {/* Verdict */}
              <div style={{
                padding: '14px 18px', borderRadius: 14, textAlign: 'center',
                background: toResult.worthIt ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1.5px solid ${toResult.worthIt ? 'rgba(141,198,63,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: toResult.worthIt ? '#8DC63F' : '#EF4444' }}>
                  {toResult.worthIt ? '✓ Worth It!' : '✗ Not Worth It'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {toResult.worthIt ? `Total savings of ${fmtRp(toResult.totalSaving)} exceed switching costs` : 'Savings don\'t outweigh the cost of refinancing'}
                </div>
              </div>
            </div>
          )}

          <button onClick={() => showToast('🔄 Contact your bank to inquire about KPR Take-Over')} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6ba32e)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>
            <span style={{ fontSize: 18 }}>📋</span> Inquire Take-Over
          </button>
        </>}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.3)', borderRadius: 12, padding: '12px 20px', color: '#fff', fontSize: 14, fontWeight: 600, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>,
    document.body
  )
}
