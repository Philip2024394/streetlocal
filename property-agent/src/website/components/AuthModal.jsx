/**
 * AuthModal — Sign up / Sign in modal for website.
 * Email + password auth via Supabase. Profile setup after sign up.
 */
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const glass = { background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }
const inp = { width: '100%', padding: '14px 16px', borderRadius: 12, boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', marginBottom: 10 }

const ACCOUNT_TYPES = [
  { id: 'buyer', icon: '🏠', label: 'Buyer / Renter', desc: 'Looking to buy or rent property' },
  { id: 'seller', icon: '📋', label: 'Property Owner', desc: 'List your property for sale or rent' },
  { id: 'agent', icon: '🏢', label: 'Property Agent', desc: 'Professional agent with multiple listings' },
  { id: 'developer', icon: '🏗️', label: 'Developer', desc: 'New project listings with brochures' },
]

export default function AuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState('signin') // signin | signup | profile | success
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [accountType, setAccountType] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) { setError('Email and password required'); return }
    setLoading(true); setError('')
    if (!supabase) {
      // Demo mode — fake sign in
      localStorage.setItem('indoo_web_user', JSON.stringify({ email, name: email.split('@')[0] }))
      onAuth?.({ email, name: email.split('@')[0] })
      setLoading(false); return
    }
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      onAuth?.(data.user)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) { setError('Email and password required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    if (!supabase) {
      localStorage.setItem('indoo_web_user', JSON.stringify({ email, name: email.split('@')[0] }))
      setMode('profile'); setLoading(false); return
    }
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      setMode('profile')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleProfileComplete = async () => {
    if (!name.trim() || !accountType) { setError('Name and account type required'); return }
    setLoading(true); setError('')

    const profile = { name, phone, accountType, city, email, createdAt: new Date().toISOString() }
    localStorage.setItem('indoo_web_user', JSON.stringify(profile))

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          await supabase.from('profiles').upsert({
            id: userData.user.id,
            display_name: name,
            phone,
            account_type: accountType,
            city,
          }).catch(() => {}) // profiles table may not exist yet
        }
      } catch {}
    }

    setMode('success')
    setLoading(false)
    setTimeout(() => { onAuth?.(profile); onClose?.() }, 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ ...glass, width: 440, maxHeight: '90vh', overflowY: 'auto', padding: '36px 32px' }}>

        {/* ═══ SIGN IN ═══ */}
        {mode === 'signin' && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>Welcome Back</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center' }}>Sign in to your INDOO Property account</p>

            {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{error}</div>}

            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={inp} onKeyDown={e => e.key === 'Enter' && handleSignIn()} />

            <button onClick={handleSignIn} disabled={loading} style={{
              width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
              color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              marginTop: 6, opacity: loading ? 0.6 : 1,
            }}>{loading ? 'Signing in...' : 'Sign In'}</button>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }} style={{ background: 'none', border: 'none', color: '#8DC63F', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Sign Up</button>
            </div>
          </>
        )}

        {/* ═══ SIGN UP ═══ */}
        {mode === 'signup' && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>Create Account</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center' }}>Join INDOO Property — buy, sell, rent</p>

            {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{error}</div>}

            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 characters)" type="password" style={inp} />

            <button onClick={handleSignUp} disabled={loading} style={{
              width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
              color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              marginTop: 6, opacity: loading ? 0.6 : 1,
            }}>{loading ? 'Creating account...' : 'Create Account'}</button>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError('') }} style={{ background: 'none', border: 'none', color: '#8DC63F', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Sign In</button>
            </div>
          </>
        )}

        {/* ═══ PROFILE SETUP ═══ */}
        {mode === 'profile' && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>Complete Your Profile</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center' }}>Tell us about yourself</p>

            {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{error}</div>}

            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name *" style={inp} />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp number" type="tel" style={inp} />
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City (e.g. Yogyakarta)" style={inp} />

            {/* Account type */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>I am a *</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {ACCOUNT_TYPES.map(t => (
                <button key={t.id} onClick={() => setAccountType(t.id)} style={{
                  padding: '14px 12px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  background: accountType === t.id ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.03)',
                  border: accountType === t.id ? '2px solid rgba(141,198,63,0.5)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: accountType === t.id ? '#8DC63F' : '#fff' }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>

            <button onClick={handleProfileComplete} disabled={loading || !name.trim() || !accountType} style={{
              width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: name.trim() && accountType ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)',
              color: name.trim() && accountType ? '#000' : 'rgba(255,255,255,0.2)',
              fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
            }}>{loading ? 'Saving...' : 'Complete Setup'}</button>
          </>
        )}

        {/* ═══ SUCCESS ═══ */}
        {mode === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '3px solid #8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Welcome to INDOO!</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Your account is ready. Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  )
}
