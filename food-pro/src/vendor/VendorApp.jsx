/**
 * VendorApp — Standalone merchant PWA entry point
 * This is the entire app for indoobiz.id
 * Login → Dashboard (VendorDashboardV2)
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import VendorDashboardV2 from '@/components/restaurant/VendorDashboardV2'
import VendorOnboarding from '@/components/restaurant/VendorOnboarding'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2006_04_21%20PM.png'

export default function VendorApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [signingIn, setSigningIn] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem('indoo_vendor_restaurant'))

  // PWA Install prompt
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (navigator.standalone) return // iOS

    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setTimeout(() => setShowInstallBanner(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) setTimeout(() => setShowInstallBanner(true), 5000)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const result = await installPrompt.userChoice
      if (result.outcome === 'accepted') setShowInstallBanner(false)
    }
    setShowInstallBanner(false)
  }

  // Check existing session
  useEffect(() => {
    if (!supabase) {
      // Demo mode — show login screen (no auto-login)
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  const handleAuth = async () => {
    if (!loginEmail.trim() || !loginPass.trim()) return
    setSigningIn(true)
    setLoginError(null)

    if (!supabase) {
      // Demo mode
      setTimeout(() => {
        setUser({ id: 'demo', email: loginEmail })
        setSigningIn(false)
      }, 800)
      return
    }

    try {
      const fn = isRegister ? supabase.auth.signUp : supabase.auth.signInWithPassword
      const { error } = await fn.call(supabase.auth, { email: loginEmail, password: loginPass })
      if (error) setLoginError(error.message)
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setSigningIn(false)
    }
  }

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }

  // Loading
  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(141,198,63,0.2)', borderTopColor: '#8DC63F', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Loading INDOO Biz...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Logged in — show onboarding if no restaurant, otherwise dashboard
  if (user) {
    if (!onboardingDone) {
      return (
        <VendorOnboarding
          open={true}
          onClose={handleLogout}
          onComplete={() => setOnboardingDone(true)}
          userId={user.id ?? user.uid}
        />
      )
    }
    return (
      <>
        <VendorDashboardV2 onClose={handleLogout} />
        {/* PWA Install Banner */}
        {showInstallBanner && (
          <div style={{
            position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 10000,
            padding: '14px 16px', borderRadius: 20,
            background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(141,198,63,0.25)',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block' }}>Install INDOO Business</span>
              {installPrompt ? (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, display: 'block' }}>Add to your home screen for the best experience</span>
              ) : (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, display: 'block' }}>Tap Share then "Add to Home Screen"</span>
              )}
            </div>
            {installPrompt && (
              <button onClick={handleInstall} style={{
                padding: '10px 18px', borderRadius: 14, background: '#8DC63F', border: 'none',
                color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>Install</button>
            )}
            <button onClick={() => setShowInstallBanner(false)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: 18, cursor: 'pointer', padding: '4px 4px', lineHeight: 1,
            }}>✕</button>
          </div>
        )}
      </>
    )
  }

  // Login screen
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      backgroundImage: `url("${BG_IMG}")`, backgroundSize: 'cover', backgroundPosition: 'center',
      position: 'relative',
    }}>
      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
            <span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>BIZ</span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Merchant Dashboard</p>
        </div>

        {/* Login card */}
        <div style={{
          width: '100%', maxWidth: 360, padding: '28px 24px', borderRadius: 24,
          background: 'rgba(10,10,10,0.9)', border: '1.5px solid rgba(141,198,63,0.2)',
          backdropFilter: 'blur(20px)', animation: 'slideUp 0.4s ease',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>
            {isRegister ? 'Register your restaurant on INDOO' : 'Access your restaurant dashboard'}
          </p>

          <input
            type="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />

          <input
            type="password"
            value={loginPass}
            onChange={e => setLoginPass(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAuth() }}
            placeholder="Password"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />

          {loginError && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>{loginError}</span>
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={signingIn}
            style={{
              width: '100%', padding: '16px', borderRadius: 16,
              background: signingIn ? 'rgba(141,198,63,0.5)' : '#8DC63F',
              border: 'none', color: '#000', fontSize: 16, fontWeight: 900,
              cursor: signingIn ? 'wait' : 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
          >
            {signingIn ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={() => { setIsRegister(!isRegister); setLoginError(null) }}
              style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>indoobiz.id · Powered by INDOO</span>
        </div>
      </div>
    </div>
  )
}
