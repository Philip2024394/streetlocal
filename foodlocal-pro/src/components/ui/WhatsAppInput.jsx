/**
 * WhatsAppInput — Country prefix selector + phone number input
 * Reusable across checkout, profile, registration
 */
import { useState } from 'react'

const COUNTRY_CODES = [
  { code: '+62', flag: '🇮🇩', country: 'Indonesia' },
  { code: '+44', flag: '🇬🇧', country: 'UK' },
  { code: '+1', flag: '🇺🇸', country: 'USA' },
  { code: '+61', flag: '🇦🇺', country: 'Australia' },
  { code: '+65', flag: '🇸🇬', country: 'Singapore' },
  { code: '+60', flag: '🇲🇾', country: 'Malaysia' },
  { code: '+81', flag: '🇯🇵', country: 'Japan' },
  { code: '+82', flag: '🇰🇷', country: 'Korea' },
  { code: '+86', flag: '🇨🇳', country: 'China' },
  { code: '+31', flag: '🇳🇱', country: 'Netherlands' },
  { code: '+49', flag: '🇩🇪', country: 'Germany' },
  { code: '+33', flag: '🇫🇷', country: 'France' },
  { code: '+91', flag: '🇮🇳', country: 'India' },
  { code: '+66', flag: '🇹🇭', country: 'Thailand' },
  { code: '+84', flag: '🇻🇳', country: 'Vietnam' },
  { code: '+63', flag: '🇵🇭', country: 'Philippines' },
  { code: '+971', flag: '🇦🇪', country: 'UAE' },
  { code: '+966', flag: '🇸🇦', country: 'Saudi' },
]

export default function WhatsAppInput({ value, onChange, locked = false, label, placeholder }) {
  const [prefix, setPrefix] = useState('+62')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [number, setNumber] = useState(value?.replace(/^\+\d{1,3}/, '') ?? '')

  const handleChange = (num) => {
    const cleaned = num.replace(/[^\d]/g, '')
    setNumber(cleaned)
    onChange?.(prefix + cleaned)
  }

  const selectPrefix = (code) => {
    setPrefix(code)
    setDropdownOpen(false)
    onChange?.(code + number)
  }

  const selected = COUNTRY_CODES.find(c => c.code === prefix) ?? COUNTRY_CODES[0]

  return (
    <div>
      {label && <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>{label}</span>}
      <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
        {/* Prefix selector */}
        <button onClick={() => !locked && setDropdownOpen(v => !v)} style={{
          padding: '12px 10px', borderRadius: '12px 0 0 12px',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none',
          color: '#fff', fontSize: 14, fontWeight: 800, cursor: locked ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          <span style={{ fontSize: 18 }}>{selected.flag}</span>
          <span>{prefix}</span>
          {!locked && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>▼</span>}
        </button>

        {/* Number input */}
        <input
          value={locked ? (value?.replace(/^\+\d{1,3}/, '') ?? '') : number}
          onChange={e => handleChange(e.target.value)}
          readOnly={locked}
          placeholder={placeholder ?? '81234567890'}
          inputMode="numeric"
          style={{
            flex: 1, padding: '12px 14px', borderRadius: '0 12px 12px 0',
            background: locked ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none',
            color: locked ? 'rgba(255,255,255,0.5)' : '#fff',
            fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />

        {/* Country dropdown */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4,
            width: 220, maxHeight: 250, overflowY: 'auto',
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          }}>
            {COUNTRY_CODES.map(c => (
              <button key={c.code} onClick={() => selectPrefix(c.code)} style={{
                width: '100%', padding: '10px 14px', background: c.code === prefix ? 'rgba(141,198,63,0.1)' : 'none',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 18 }}>{c.flag}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1 }}>{c.country}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {locked && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4 }}>Registered number</span>}
    </div>
  )
}

export { COUNTRY_CODES }
