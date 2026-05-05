/**
 * DailyDealStrip — horizontal row of 7 daily deal containers
 * Today's deal is live with countdown. Others show as upcoming.
 */
import { useState, useEffect } from 'react'
import { DAILY_DEALS, getTodayDeal, getMsUntilMidnightWIB } from '@/constants/dailyDeals'

function pad(n) { return String(n).padStart(2, '0') }

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function MiniCountdown() {
  const [ms, setMs] = useState(getMsUntilMidnightWIB())
  useEffect(() => {
    const id = setInterval(() => setMs(getMsUntilMidnightWIB()), 1000)
    return () => clearInterval(id)
  }, [])
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const urgent = ms < 2 * 3600000
  return (
    <span style={{
      fontSize: 9, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
      color: urgent ? '#EF4444' : '#FACC15',
      animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none',
    }}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  )
}

export default function DailyDealCard({ onTap }) {
  const deal = getTodayDeal()
  const [remaining, setRemaining] = useState(getMsUntilMidnightWIB())

  useEffect(() => {
    const id = setInterval(() => setRemaining(getMsUntilMidnightWIB()), 1000)
    return () => clearInterval(id)
  }, [])

  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  const urgent = remaining < 2 * 3600000

  return (
    <div onClick={onTap} style={{ position: 'absolute', inset: 0, cursor: 'pointer', background: '#000' }}>
      {/* Background — full width + height */}
      <img src={deal.img} alt={deal.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />

      {/* Center: glowing discount + countdown */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {/* Discount with pulse ring */}
        <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `2px solid ${deal.color}`, animation: 'dealPulseRing 2s ease-in-out infinite', opacity: 0.4 }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${deal.color}25 0%, transparent 70%)`, animation: 'dealGlow 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 48, fontWeight: 900, color: deal.color, textShadow: `0 0 30px ${deal.color}, 0 0 60px ${deal.color}80`, lineHeight: 1, position: 'relative', zIndex: 1 }}>{deal.discount}%</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', textShadow: `0 0 12px ${deal.color}`, letterSpacing: '0.15em', position: 'relative', zIndex: 1 }}>OFF</span>
        </div>

        {/* Deal name */}
        <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 8 }}>
          {deal.emoji} {deal.name}
        </span>

        {/* Countdown */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {[{ val: pad(h), label: 'HRS' }, { val: pad(m), label: 'MIN' }, { val: pad(s), label: 'SEC' }].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.3)' : `${deal.color}30`}`, textAlign: 'center', minWidth: 44 }}>
                <span style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: urgent ? '#EF4444' : deal.color, display: 'block', lineHeight: 1, animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none' }}>{t.val}</span>
                <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{t.label}</span>
              </div>
              {i < 2 && <span style={{ fontSize: 20, fontWeight: 900, color: deal.color, opacity: 0.5 }}>:</span>}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes dealPulseRing { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.15); opacity: 0; } }
      `}</style>
    </div>
  )
}

export function DailyDealStrip({ onSelectDeal }) {
  const today = getTodayDeal()
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const wibDay = new Date(utcMs + 7 * 3_600_000).getDay()

  return (
    <>
      {DAILY_DEALS.map(deal => {
        const isToday = deal.day === wibDay
        return (
          <div
            key={deal.day}
            onClick={() => onSelectDeal?.(deal)}
            style={{
              flexShrink: 0, width: 110, height: 130, borderRadius: 14,
              overflow: 'hidden', position: 'relative', cursor: 'pointer',
              border: isToday ? `2px solid ${deal.color}50` : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isToday ? `0 0 16px ${deal.color}30` : 'none',
              opacity: isToday ? 1 : 0.6,
              transition: 'all 0.3s',
            }}
          >
            {/* Background image */}
            <img
              src={deal.img}
              alt={deal.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: isToday ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.65)' }} />

            {/* Content */}
            <div style={{
              position: 'relative', zIndex: 2, height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 6, gap: 3,
            }}>
              {/* Day label */}
              <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {DAY_NAMES[deal.day]}
              </span>

              {/* Discount — glowing */}
              <span style={{
                fontSize: isToday ? 28 : 22, fontWeight: 900, color: deal.color, lineHeight: 1,
                textShadow: isToday ? `0 0 16px ${deal.color}, 0 0 32px ${deal.color}60` : 'none',
                animation: isToday ? 'dealGlow 2s ease-in-out infinite' : 'none',
              }}>
                {deal.discount}%
              </span>
              <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>OFF</span>

              {/* Deal name */}
              <span style={{
                fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.7)',
                textAlign: 'center', lineHeight: 1.2, marginTop: 2,
              }}>
                {deal.name}
              </span>

              {/* Countdown for today only */}
              {isToday && (
                <div style={{ marginTop: 2 }}>
                  <MiniCountdown />
                </div>
              )}

              {/* LIVE badge for today */}
              {isToday && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  padding: '2px 6px', borderRadius: 4,
                  background: deal.color, fontSize: 7, fontWeight: 900,
                  color: '#000', letterSpacing: '0.1em',
                }}>
                  LIVE
                </div>
              )}
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes dealGlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </>
  )
}
