/**
 * RentalCalendar — shared calendar for owners (mark booked) and customers (view/select dates)
 * Red = booked, Green = available, Yellow = selected
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const BOOKED_KEY = 'indoo_booked_dates'

// Get booked dates for a listing
export function getBookedDates(listingRef) {
  try {
    const all = JSON.parse(localStorage.getItem(BOOKED_KEY) || '{}')
    return all[listingRef] || []
  } catch { return [] }
}

// Save booked dates for a listing
export function saveBookedDates(listingRef, dates) {
  try {
    const all = JSON.parse(localStorage.getItem(BOOKED_KEY) || '{}')
    all[listingRef] = dates
    localStorage.setItem(BOOKED_KEY, JSON.stringify(all))
  } catch {}
}

// Check if a listing has any future bookings
export function isListingBooked(listingRef) {
  const dates = getBookedDates(listingRef)
  const today = new Date().toISOString().split('T')[0]
  return dates.some(d => d >= today)
}

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function RentalCalendar({ open, onClose, listingRef, listingTitle, mode = 'view', onSelectDate }) {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [bookedDates, setBookedDates] = useState(() => getBookedDates(listingRef))
  const [selectedDate, setSelectedDate] = useState(null)

  if (!open) return null

  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const toggleBooked = (dateStr) => {
    if (mode !== 'owner') return
    const updated = bookedDates.includes(dateStr)
      ? bookedDates.filter(d => d !== dateStr)
      : [...bookedDates, dateStr]
    setBookedDates(updated)
    saveBookedDates(listingRef, updated)
  }

  const handleDayClick = (dateStr) => {
    if (dateStr < today) return // can't select past dates
    if (mode === 'owner') {
      toggleBooked(dateStr)
    } else {
      // Customer mode — select available date
      if (bookedDates.includes(dateStr)) return // can't select booked
      setSelectedDate(dateStr)
      onSelectDate?.(dateStr)
    }
  }

  const cells = []
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) cells.push(null)
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'rgba(10,10,15,0.95)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 20px rgba(141,198,63,0.08)' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>
              {mode === 'owner' ? '📅 Manage Availability' : '📅 Check Availability'}
            </div>
            {listingTitle && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{listingTitle}</div>}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 12px', gap: 2 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '4px 12px 16px', gap: 3 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />
            const dateStr = toDateStr(year, month, day)
            const isPast = dateStr < today
            const isBooked = bookedDates.includes(dateStr)
            const isSelected = selectedDate === dateStr
            const isToday = dateStr === today

            return (
              <button
                key={i}
                onClick={() => handleDayClick(dateStr)}
                style={{
                  width: '100%', aspectRatio: '1', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, cursor: isPast ? 'default' : 'pointer',
                  border: isToday ? '2px solid #FFD700' : 'none',
                  background: isBooked ? 'rgba(239,68,68,0.15)' : isSelected ? 'rgba(255,215,0,0.15)' : isPast ? 'transparent' : 'rgba(141,198,63,0.04)',
                  color: isPast ? 'rgba(255,255,255,0.1)' : isBooked ? '#EF4444' : isSelected ? '#FFD700' : '#fff',
                  fontFamily: 'inherit', padding: 0,
                  transition: 'all 0.15s',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ padding: '8px 16px 14px', display: 'flex', gap: 14, justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Booked</span>
          </div>
          {mode === 'owner' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, border: '2px solid #FFD700' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Today</span>
            </div>
          )}
        </div>

        {/* Owner: instruction */}
        {mode === 'owner' && (
          <div style={{ padding: '0 16px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: 0 }}>Tap dates to mark as booked (red) or available (green)</p>
          </div>
        )}

        {/* Customer: selected date action */}
        {mode === 'view' && selectedDate && (
          <div style={{ padding: '0 16px 14px' }}>
            <button onClick={() => { onSelectDate?.(selectedDate); onClose() }} style={{ width: '100%', padding: '13px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
              Select {selectedDate} →
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
