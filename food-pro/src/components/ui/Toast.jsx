import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

/* ── Icon helpers ── */
const icons = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
}

const colors = {
  success: '#8DC63F',
  warning: '#FFD700',
  error: '#EF4444',
  info: '#ffffff',
}

/* ── Single Toast ── */
function ToastItem({ id, message, type, onDismiss }) {
  const [state, setState] = useState('entering') // entering | visible | exiting
  const timerRef = useRef(null)

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setState('visible'), 10)
    // Auto dismiss after 3s
    timerRef.current = setTimeout(() => {
      setState('exiting')
      setTimeout(() => onDismiss(id), 300)
    }, 3000)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(timerRef.current)
    }
  }, [id, onDismiss])

  const handleDismiss = () => {
    clearTimeout(timerRef.current)
    setState('exiting')
    setTimeout(() => onDismiss(id), 300)
  }

  const color = colors[type] || colors.info

  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: 'rgba(13,13,15,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${color}33`,
    borderRadius: 14,
    minWidth: 260,
    maxWidth: 380,
    boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    transform: state === 'entering' ? 'translateY(-20px)' : state === 'exiting' ? 'translateY(-20px)' : 'translateY(0)',
    opacity: state === 'entering' ? 0 : state === 'exiting' ? 0 : 1,
    pointerEvents: 'auto',
  }

  return (
    <div style={baseStyle}>
      {/* Icon */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: `${color}18`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 900, color, flexShrink: 0,
      }}>
        {icons[type] || icons.info}
      </div>

      {/* Message */}
      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
        {message}
      </span>

      {/* Dismiss */}
      <button onClick={handleDismiss} style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        ✕
      </button>
    </div>
  )
}

/* ── useToast hook ── */
let toastIdCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter
    setToasts(prev => {
      const next = [...prev, { id, message, type }]
      // Stack up to 3
      if (next.length > 3) return next.slice(next.length - 3)
      return next
    })
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ToastContainer = useCallback(() => {
    if (toasts.length === 0) return null
    return createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 99999, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8, padding: '16px 16px 0',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} onDismiss={dismiss} />
        ))}
      </div>,
      document.body
    )
  }, [toasts, dismiss])

  return { showToast, ToastContainer }
}

/* ── Default export for backward compat ── */
export default function Toast({ message, type = 'info', onDismiss, duration = 3000 }) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!message) return
    timerRef.current = setTimeout(onDismiss, duration)
    return () => clearTimeout(timerRef.current)
  }, [message, duration, onDismiss])

  if (!message) return null

  const color = colors[type] || colors.info

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 99999, display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', background: 'rgba(13,13,15,0.92)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${color}33`, borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: `${color}18`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 900, color, flexShrink: 0,
      }}>
        {icons[type] || icons.info}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{message}</span>
    </div>
  )
}
