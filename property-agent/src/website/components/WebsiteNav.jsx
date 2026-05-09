/**
 * WebsiteNav — Sticky top navigation with auth.
 */
import { useState, useEffect } from 'react'
import { useLanguage, LANGUAGES } from '@/i18n'
import AuthModal from './AuthModal'

const LOGO = 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/bold-3d-_indoo_-logo-design.png'

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'sale', label: 'For Sale' },
  { id: 'rent', label: 'For Rent' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'invest', label: 'Invest' },
  { id: 'newprojects', label: 'New Projects' },
  { id: 'areas', label: 'Areas' },
  { id: 'wanted', label: 'Wanted' },
  { id: 'agents', label: 'Agents' },
  { id: 'management', label: 'Management' },
  { id: 'legal', label: 'Legal Guide' },
]

export default function WebsiteNav({ activePage, onNavigate, onSearch }) {
  const { lang, setLang } = useLanguage()
  const [searchVal, setSearchVal] = useState('')
  const [showLang, setShowLang] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('indoo_web_user')) } catch { return null }
  })
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleAuth = (userData) => {
    setUser(userData)
    setShowAuth(false)
  }

  const handleSignOut = () => {
    localStorage.removeItem('indoo_web_user')
    setUser(null)
    setShowUserMenu(false)
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 9999,
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: 'none',
        padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', gap: 20,
      }}>
        {/* Green rim with running light */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(141,198,63,0.25)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 120, height: '100%', background: 'linear-gradient(90deg, transparent, #8DC63F, #8DC63F, transparent)', animation: 'navRunLight 3s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes navRunLight { 0% { left: -120px; } 100% { left: 100%; } }`}</style>
        <a href="/property" onClick={e => { e.preventDefault(); onNavigate?.('home') }} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0, marginRight: 8 }}>
          <img src={LOGO} alt="Indoo" style={{ height: 32 }} />
          <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.08em' }}><span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span> <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em' }}>PROPERTY</span></span>
        </a>

        {NAV.map(item => (
          <button key={item.id} onClick={() => onNavigate?.(item.id)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: activePage === item.id ? 'rgba(141,198,63,0.1)' : 'transparent',
            color: activePage === item.id ? '#8DC63F' : 'rgba(255,255,255,0.45)',
            fontSize: 13, fontWeight: 700, transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>{item.label}</button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, width: 200 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch?.(searchVal)} placeholder="Search..."
            style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {/* Language */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLang(!showLang)} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <img src={LANGUAGES.find(l => l.code === lang)?.image} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'contain' }} />
          </button>
          {showLang && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', minWidth: 130, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false) }} style={{
                  width: '100%', padding: '8px 12px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: l.code === lang ? 'rgba(141,198,63,0.08)' : 'none',
                  color: l.code === lang ? '#8DC63F' : '#fff', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <img src={l.image} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} /> {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auth */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(141,198,63,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#8DC63F', fontWeight: 900 }}>{(user.name || user.email || 'U')[0].toUpperCase()}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#8DC63F', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email?.split('@')[0]}</span>
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{user.name || 'User'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{user.email}</div>
                  {user.accountType && <div style={{ marginTop: 4, padding: '2px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{user.accountType === 'agent' ? '🏢 Agent' : user.accountType === 'developer' ? '🏗️ Developer' : user.accountType === 'seller' ? '📋 Owner' : '🏠 Buyer'}</div>}
                </div>
                {[
                  { icon: '📋', label: 'List Property', action: () => { setShowUserMenu(false); onNavigate?.('list') } },
                  { icon: '🏠', label: 'My Dashboard', action: () => { setShowUserMenu(false); onNavigate?.('dashboard') } },
                ].map(item => (
                  <button key={item.label} onClick={item.action} style={{
                    width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                  }}>{item.icon} {item.label}</button>
                ))}
                <button onClick={handleSignOut} style={{
                  width: '100%', padding: '12px 16px', border: 'none',
                  background: 'none', color: '#EF4444', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                }}>🚪 Sign Out</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAuth(true)} style={{
              padding: '7px 18px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Sign In</button>
            <button onClick={() => { setShowAuth(true) }} style={{
              padding: '7px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
              color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}>List Property</button>
          </div>
        )}
      </nav>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onAuth={handleAuth} />
    </>
  )
}
