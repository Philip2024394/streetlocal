// Hours & Holidays — weekly schedule, multi-slot per day, date overrides,
// and "Busy now" auto-resume. Mirrors Uber Eats / DoorDash store-hours
// controls. Persists to restaurants.hours (jsonb).
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const DAYS = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
  { id: 'sun', label: 'Sunday' },
]

const DEFAULT_HOURS = {
  mon: [{ open: '08:00', close: '22:00' }],
  tue: [{ open: '08:00', close: '22:00' }],
  wed: [{ open: '08:00', close: '22:00' }],
  thu: [{ open: '08:00', close: '22:00' }],
  fri: [{ open: '08:00', close: '23:00' }],
  sat: [{ open: '09:00', close: '23:00' }],
  sun: [{ open: '09:00', close: '21:00' }],
  holidays: [],
  busy_until: null,
}

const card = { padding: 14, borderRadius: 16, marginBottom: 12, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', colorScheme: 'dark' }

export default function HoursHolidays({ restaurant, onBack }) {
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [savingMsg, setSavingMsg] = useState('')
  const [busyMinutes, setBusyMinutes] = useState(30)

  useEffect(() => {
    if (!supabase || !restaurant?.id) return
    let cancelled = false
    supabase.from('restaurants').select('hours').eq('id', restaurant.id).single()
      .then(({ data }) => {
        if (cancelled || !data?.hours) return
        const next = { ...DEFAULT_HOURS, ...data.hours }
        // Ensure every day key is an array.
        DAYS.forEach(d => { if (!Array.isArray(next[d.id])) next[d.id] = [] })
        if (!Array.isArray(next.holidays)) next.holidays = []
        setHours(next)
      }).catch(() => {})
    return () => { cancelled = true }
  }, [restaurant?.id])

  const setDay = (dayId, slots) => setHours(h => ({ ...h, [dayId]: slots }))
  const addSlot = (dayId) => setDay(dayId, [...(hours[dayId] || []), { open: '12:00', close: '14:00' }])
  const rmSlot = (dayId, i) => setDay(dayId, hours[dayId].filter((_, j) => j !== i))
  const setSlot = (dayId, i, field, value) => setDay(dayId, hours[dayId].map((s, j) => j === i ? { ...s, [field]: value } : s))
  const copyMonToAll = () => {
    const monSlots = hours.mon || []
    setHours(h => ({ ...h, tue: [...monSlots], wed: [...monSlots], thu: [...monSlots], fri: [...monSlots], sat: [...monSlots], sun: [...monSlots] }))
  }

  const addHoliday = () => setHours(h => ({ ...h, holidays: [...(h.holidays || []), { date: new Date().toISOString().slice(0, 10), closed: true, label: '' }] }))
  const setHoliday = (i, field, value) => setHours(h => ({ ...h, holidays: h.holidays.map((x, j) => j === i ? { ...x, [field]: value } : x) }))
  const rmHoliday = (i) => setHours(h => ({ ...h, holidays: h.holidays.filter((_, j) => j !== i) }))

  const startBusy = () => {
    const until = new Date(Date.now() + busyMinutes * 60000).toISOString()
    setHours(h => ({ ...h, busy_until: until }))
  }
  const clearBusy = () => setHours(h => ({ ...h, busy_until: null }))

  const busyActive = hours.busy_until && new Date(hours.busy_until) > new Date()
  const busyEndsIn = busyActive ? Math.max(0, Math.round((new Date(hours.busy_until) - Date.now()) / 60000)) : 0

  const handleSave = async () => {
    if (!supabase || !restaurant?.id) { setSavingMsg('Saved locally.'); setTimeout(() => setSavingMsg(''), 1500); return }
    setSavingMsg('Saving…')
    const { error } = await supabase.from('restaurants').update({ hours }).eq('id', restaurant.id)
    setSavingMsg(error ? `Save failed: ${error.message}` : 'Saved.')
    setTimeout(() => setSavingMsg(''), 1800)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Hours & Holidays</h2>
      </div>

      {/* Busy now — auto-resume */}
      <div style={{ ...card, border: busyActive ? `1.5px solid ${BRAND.red}` : '1px solid rgba(255,255,255,0.06)', background: busyActive ? BRAND.redGlow : 'rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{busyActive ? `🔥 Busy — ${busyEndsIn} min left` : 'Pause incoming orders'}</span>
          {busyActive && <button onClick={clearBusy} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Resume now</button>}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 10 }}>
          Temporarily stop accepting new orders. Auto-resumes after the selected time. Existing orders are unaffected.
        </div>
        {!busyActive && (
          <div style={{ display: 'flex', gap: 8 }}>
            {[10, 20, 30, 45, 60].map(m => (
              <button key={m} onClick={() => setBusyMinutes(m)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: busyMinutes === m ? BRAND.red : 'rgba(255,255,255,0.08)', color: '#fff' }}>{m}m</button>
            ))}
            <button onClick={startBusy} style={{ flex: 2, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 900, cursor: 'pointer', background: BRAND.red, color: '#fff' }}>Pause {busyMinutes}m</button>
          </div>
        )}
      </div>

      {/* Weekly schedule */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Weekly schedule</span>
          <button onClick={copyMonToAll} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Copy Mon → all days</button>
        </div>
        {DAYS.map(d => {
          const slots = hours[d.id] || []
          const isClosed = slots.length === 0
          return (
            <div key={d.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>{d.label}</span>
                <button onClick={() => setDay(d.id, isClosed ? [{ open: '08:00', close: '22:00' }] : [])} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${isClosed ? 'rgba(239,68,68,0.3)' : BRAND.redBorder}`, background: isClosed ? 'rgba(239,68,68,0.1)' : BRAND.redGlow, color: isClosed ? '#FCA5A5' : '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{isClosed ? 'Closed' : 'Open'}</button>
                {!isClosed && <button onClick={() => addSlot(d.id)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Slot</button>}
              </div>
              {slots.map((slot, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <input type="time" value={slot.open} onChange={e => setSlot(d.id, i, 'open', e.target.value)} style={{ ...input, flex: 1 }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
                  <input type="time" value={slot.close} onChange={e => setSlot(d.id, i, 'close', e.target.value)} style={{ ...input, flex: 1 }} />
                  {slots.length > 1 && <button onClick={() => rmSlot(d.id, i)} style={{ width: 32, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Holiday overrides */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Holidays & special dates</span>
          <button onClick={addHoliday} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add holiday</button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 10 }}>Override weekly schedule on specific dates — e.g. Pancasila Day closed, Christmas Eve early close.</div>
        {(hours.holidays || []).length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 12 }}>No holidays added.</div>}
        {(hours.holidays || []).map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input type="date" value={h.date} onChange={e => setHoliday(i, 'date', e.target.value)} style={{ ...input, width: 150 }} />
            <input value={h.label || ''} onChange={e => setHoliday(i, 'label', e.target.value)} placeholder="Label (optional)" style={{ ...input, flex: 1 }} />
            <button onClick={() => setHoliday(i, 'closed', !h.closed)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${h.closed ? 'rgba(239,68,68,0.3)' : BRAND.redBorder}`, background: h.closed ? 'rgba(239,68,68,0.1)' : BRAND.redGlow, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{h.closed ? 'Closed' : 'Custom'}</button>
            <button onClick={() => rmHoliday(i)} style={{ width: 32, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
          </div>
        ))}
      </div>

      {savingMsg && <div style={{ padding: 10, borderRadius: 12, fontSize: 13, color: '#fff', textAlign: 'center', background: savingMsg.includes('fail') ? 'rgba(239,68,68,0.15)' : BRAND.redGlow, border: savingMsg.includes('fail') ? '1px solid rgba(239,68,68,0.3)' : `1px solid ${BRAND.redBorder}`, marginBottom: 12 }}>{savingMsg}</div>}
      <button onClick={handleSave} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: BRAND.red, color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Save Hours</button>
    </>
  )
}
