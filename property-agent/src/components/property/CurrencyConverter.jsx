import React, { useState } from 'react'
import { convertFromIDR, CURRENCIES } from '@/services/investorService'

const glass = {
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
}

export default function CurrencyConverter({ amountIDR }) {
  const [selected, setSelected] = useState('USD')

  const foreignCurrencies = CURRENCIES.filter(c => c.code !== 'IDR')
  const cur = CURRENCIES.find(c => c.code === selected) || foreignCurrencies[0]
  const converted = convertFromIDR(amountIDR, selected)

  const formatNumber = (n) => {
    if (n == null) return '—'
    return n.toLocaleString('en-US')
  }

  return (
    <div style={{ ...glass, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.08)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '6px 8px',
          fontSize: 13,
          outline: 'none',
          cursor: 'pointer',
          minWidth: 72,
        }}
      >
        {foreignCurrencies.map(c => (
          <option key={c.code} value={c.code} style={{ background: '#1a1a1a' }}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>

      <span style={{ color: '#fff', fontSize: 15, fontWeight: 600, letterSpacing: 0.3 }}>
        {cur.flag} {cur.symbol}{formatNumber(converted)}
      </span>

      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 'auto' }}>
        {cur.name}
      </span>
    </div>
  )
}
