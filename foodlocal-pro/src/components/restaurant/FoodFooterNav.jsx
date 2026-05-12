/**
 * FoodFooterNav — universal floating footer for food module (customer only)
 * Home | Chat | Notifications | Profile
 * Same across all modules.
 */
import { createPortal } from 'react-dom'

const btnStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', minWidth: 48, position: 'relative' }
const labelStyle = { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }

export default function FoodFooterNav({ onHome, onChat, onRestaurants, onNotifications, onProfile, activeTab, notifCount = 0 }) {
  return createPortal(
    <div style={{
      position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      left: 16, right: 16, zIndex: 9500,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(16px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      border: '1.5px solid rgba(141,198,63,0.3)',
      borderRadius: 28,
      padding: '12px 7px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {/* Home */}
        <button onClick={onHome} style={btnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'home' ? '#8DC63F' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span style={{ ...labelStyle, color: activeTab === 'home' ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>Home</span>
        </button>

        {/* Visit Us */}
        <button onClick={onRestaurants} style={btnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'restaurants' ? '#8DC63F' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ ...labelStyle, color: activeTab === 'restaurants' ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>Visit Us</span>
        </button>

        {/* Notifications */}
        <button onClick={onNotifications} style={btnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'notifications' ? '#8DC63F' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          {notifCount > 0 && (
            <span style={{ position: 'absolute', top: -2, right: 2, minWidth: 16, height: 16, borderRadius: 8, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>{notifCount > 99 ? '99+' : notifCount}</span>
            </span>
          )}
          <span style={{ ...labelStyle, color: activeTab === 'notifications' ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>Alerts</span>
        </button>

        {/* Profile */}
        <button onClick={onProfile} style={btnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'profile' ? '#8DC63F' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style={{ ...labelStyle, color: activeTab === 'profile' ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>Profile</span>
        </button>
      </div>
    </div>,
    document.body
  )
}
