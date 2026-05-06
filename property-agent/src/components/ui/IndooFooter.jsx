/**
 * IndooFooter — Shared floating footer panel for all app pages
 * Shows: INDOO branding · Home button · Close button
 */
import { createPortal } from 'react-dom'

export default function IndooFooter({ label = '', onHome, onClose, onBack }) {
  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      left: 16,
      right: 16,
      zIndex: 10010,
      padding: '10px 16px',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 20,
      border: '1.5px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {/* Branding */}
      <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.4)', flex: 1 }}>
        <span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span>
        {label && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>· {label}</span>}
      </span>

      {/* Back button */}
      {onBack && (
        <button onClick={onBack} style={{
          padding: '8px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
      )}

      {/* Home button */}
      {onHome && (
        <button onClick={onHome} style={{
          padding: '8px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </button>
      )}

    </div>,
    document.body
  )
}
