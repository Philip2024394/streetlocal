/**
 * RoomAvailability — Real-time room count badge for Kos listings.
 * Owner can update count. Shows green when available, red when full.
 */
import { useState } from 'react'

export default function RoomAvailability({ available = 0, total = 0, isOwner = false, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [count, setCount] = useState(available)

  const isFull = available <= 0
  const color = isFull ? '#EF4444' : available <= 2 ? '#F59E0B' : '#8DC63F'

  const handleSave = () => {
    onUpdate?.(count)
    setEditing(false)
  }

  return (
    <div style={{
      padding: '12px 16px', borderRadius: 14,
      background: `${color}10`,
      border: `1.5px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: isFull ? 'none' : 'rd_pulse 2s ease-in-out infinite',
        }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color }}>
            {isFull ? 'No Rooms Available' : `${available} Room${available > 1 ? 's' : ''} Available`}
          </div>
          {total > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>of {total} total rooms</div>}
        </div>
      </div>

      {isOwner && !editing && (
        <button onClick={() => setEditing(true)} style={{
          padding: '6px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>Update</button>
      )}

      {isOwner && editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setCount(c => Math.max(0, c - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', minWidth: 28, textAlign: 'center' }}>{count}</span>
          <button onClick={() => setCount(c => c + 1)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={handleSave} style={{ padding: '6px 12px', borderRadius: 8, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      )}
    </div>
  )
}

/** Small badge for listing cards */
export function RoomBadge({ available }) {
  if (available === undefined || available === null) return null
  const isFull = available <= 0
  const color = isFull ? '#EF4444' : available <= 2 ? '#F59E0B' : '#8DC63F'
  return (
    <div style={{
      padding: '3px 8px', borderRadius: 6,
      background: `${color}15`, border: `1px solid ${color}30`,
      fontSize: 10, fontWeight: 800, color,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {isFull ? 'Full' : `${available} room${available > 1 ? 's' : ''}`}
    </div>
  )
}
