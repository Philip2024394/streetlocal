/* ─────────────────────────────────────────────────────────────
   Dedicated /food/chat/login surface — self-contained component
   with its own hooks. Lives OUTSIDE App.jsx so the App's hook
   list stays consistent across renders (the previous in-App
   early-return was triggering React's rules-of-hooks check).

   Flow:
     1. Vendor enters phone + password (or signs up)
     2. Calls vendorLogin() / vendorSignup() from lib/chat
     3. supabase.auth.signInWithPassword issues a session JWT
        with app_metadata.vendor_id baked in
     4. Redirect to /food/chat/ — App.jsx mounts, finds the
        session, loads vendor data normally
   ───────────────────────────────────────────────────────────── */
import React, { useEffect, useState } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase'
import { useAppLocale } from './i18n'

// Lightweight email regex — same heuristic the rest of the app uses
// (good enough to catch typos; full validation happens server-side).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Match the donut app's vendor signup helper from App.jsx so we
// can sign up without going through App's state setters.
// owner_* + city + province are nullable on vendor_accounts so we
// pass through whatever the signup form collected — required ones
// are validated client-side before this fires.
async function vendorSignup (phone, password, name, extra = {}) {
  if (!supabase) return null
  const { data, error } = await supabase.from('vendor_accounts').insert({
    phone: phone.replace(/[^0-9]/g, ''),
    password_hash: password,
    shop_name: name,
    shop_phone: phone.replace(/[^0-9]/g, ''),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30),
    status: 'pending',
    owner_name: extra.ownerName || null,
    owner_email: extra.ownerEmail || null,
    // Owner WhatsApp defaults to the signup phone when left blank —
    // most solo vendors use the same number for shop + personal.
    owner_whatsapp: (extra.ownerWhatsapp || '').replace(/[^0-9]/g, '') || phone.replace(/[^0-9]/g, '') || null,
    city: extra.city || null,
    province: extra.province || null,
  }).select().single()
  if (error) throw new Error(error.message)
  return data
}

// Sign-in via the vendor-login Edge Function (bridges to Supabase Auth).
async function vendorLoginViaBridge (phone, password) {
  if (!SUPABASE_URL) return null
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/vendor-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ phone: phone.replace(/[^0-9]/g, ''), password }),
  })
  const data = await resp.json().catch(() => null)
  if (!resp.ok || !data?.email) return { error: data?.error || 'Login failed' }
  const { data: session, error } = await supabase.auth.signInWithPassword({ email: data.email, password })
  if (error || !session?.session) return { error: error?.message || 'Auth failed' }
  return { vendor: data.vendor }
}

// Categories shown in the signup dropdown. Same list as App.jsx
// (kept inline so this page can render standalone without pulling
// the 14k-line App into the login bundle).
const CATEGORIES = [
  'Donut Shop', 'Bakery', 'Cafe', 'Restaurant', 'Warung', 'Coffee Shop',
  'Juice Bar', 'Dessert Shop', 'Ice Cream', 'Fast Food', 'Asian Food',
  'Pizza', 'Burger', 'Salad', 'Healthy Food', 'Other',
]

export default function VendorLoginPage () {
  const { t } = useAppLocale()
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'login'
    const q = new URLSearchParams(window.location.search)
    return q.get('signup') === 'true' ? 'signup' : 'login'
  })
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [category, setCategory] = useState('')
  // Owner contact + location — written to vendor_accounts on signup.
  // owner_whatsapp defaults to `phone` server-side when blank so solo
  // vendors don't have to type the same number twice.
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // If a vendor session already exists, bounce them to the dashboard.
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled && session) {
          window.location.href = '/food/chat/'
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const onSignIn = async () => {
    setError('')
    if (!phone.trim()) { setError('Enter WhatsApp number'); return }
    if (!password.trim()) { setError('Enter password'); return }
    setBusy(true)
    try {
      const res = await vendorLoginViaBridge(phone, password)
      if (res?.error || !res?.vendor) { setError(res?.error || 'Wrong phone or password'); setBusy(false); return }
      // Session is set — redirect to dashboard. App.jsx will pick up
      // the JWT + load this vendor's data.
      window.location.href = '/food/chat/'
    } catch (e) {
      setError(e?.message || 'Login failed')
      setBusy(false)
    }
  }

  const onSignUp = async () => {
    setError('')
    if (!shopName.trim()) { setError('Enter your shop name'); return }
    if (!category) { setError('Pick your category'); return }
    if (!phone.trim()) { setError('Enter WhatsApp number'); return }
    if (!password.trim()) { setError('Create a password'); return }
    if (password.length < 4) { setError('Password min 4 characters'); return }
    // Owner contact: name + email required, WhatsApp optional.
    if (!ownerName.trim()) { setError(t.errOwnerNameRequired || "Enter the owner's full name"); return }
    if (!ownerEmail.trim()) { setError(t.errOwnerEmailRequired || "Enter the owner's email"); return }
    if (!EMAIL_RE.test(ownerEmail.trim())) { setError(t.errOwnerEmailInvalid || 'Email format looks wrong'); return }
    if (!city.trim()) { setError(t.errCityRequired || 'Enter your city'); return }
    setBusy(true)
    try {
      await vendorSignup(phone, password, shopName, {
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerWhatsapp: ownerWhatsapp.trim(),
        city: city.trim(),
        province: province.trim(),
      })
      // After signup, immediately sign them in via the bridge so they
      // get a JWT session, then redirect.
      const res = await vendorLoginViaBridge(phone, password)
      if (res?.error) { setError(res.error); setBusy(false); return }
      // Stash category so App.jsx applies the right theme on mount.
      try { localStorage.setItem('foodlocalchat_shopFoodType', category) } catch {}
      window.location.href = '/food/chat/'
    } catch (e) {
      setError(e?.message || 'Signup failed')
      setBusy(false)
    }
  }

  const submit = () => mode === 'login' ? onSignIn() : onSignUp()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', position: 'relative' }}>
      <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2015,%202026,%2001_57_58%20PM.png" alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%206,%202026,%2002_50_47%20PM.png?updatedAt=1778053871353" alt="StreetLocal" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', marginBottom: 14 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.4, marginBottom: 4 }}>StreetLocal Dashboard</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{mode === 'signup' ? 'Create your shop in under 5 minutes' : 'Sign in to manage your shop'}</div>
          </div>

          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(0,0,0,0.55)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => { setMode('login'); setError('') }} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', background: mode === 'login' ? '#FACC15' : 'transparent', color: mode === 'login' ? '#000' : 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}>Sign in</button>
            <button onClick={() => { setMode('signup'); setError('') }} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', background: mode === 'signup' ? '#FACC15' : 'transparent', color: mode === 'signup' ? '#000' : 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}>Sign up</button>
          </div>

          {mode === 'signup' && (
            <>
              <input type="text" value={shopName} onChange={(e) => { setShopName(e.target.value); setError('') }} placeholder="Shop name (e.g. Sweet Donut Shop)" maxLength={60}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50 }} />
              <select value={category} onChange={(e) => { setCategory(e.target.value); setError('') }}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50, appearance: 'none' }}>
                <option value="" style={{ color: '#000' }}>Pick your category…</option>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
              </select>
              {/* Owner contact + location — required for ops, billing,
                  and account recovery. These map 1:1 to vendor_accounts
                  columns added by the 2026-05 migration. */}
              <input type="text" value={ownerName} onChange={(e) => { setOwnerName(e.target.value); setError('') }} placeholder={t.ownerName ? `${t.ownerName} (${t.ownerNamePh})` : 'Owner full name (e.g. Joko Widodo)'} maxLength={80}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50 }} />
              <input type="email" autoComplete="email" value={ownerEmail} onChange={(e) => { setOwnerEmail(e.target.value); setError('') }} placeholder={t.ownerEmail ? `${t.ownerEmail} (${t.ownerEmailPh})` : 'Owner email (owner@yourshop.com)'} maxLength={120}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50 }} />
              <input type="tel" inputMode="numeric" value={ownerWhatsapp} onChange={(e) => { setOwnerWhatsapp(e.target.value); setError('') }} placeholder={t.ownerWhatsapp ? `${t.ownerWhatsapp} (${t.ownerWhatsappPh})` : 'Owner WhatsApp (optional — defaults to shop number)'} maxLength={20}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50, letterSpacing: 0.5 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={city} onChange={(e) => { setCity(e.target.value); setError('') }} placeholder={t.ownerCity || 'City'} maxLength={60}
                  style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50 }} />
                <input type="text" value={province} onChange={(e) => { setProvince(e.target.value); setError('') }} placeholder={t.ownerProvince || 'Province'} maxLength={60}
                  style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50 }} />
              </div>
            </>
          )}

          <input type="tel" inputMode="numeric" autoComplete={mode === 'login' ? 'username' : 'tel'} value={phone} onChange={(e) => { setPhone(e.target.value); setError('') }} placeholder="WhatsApp number (with country code)" maxLength={20}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50, letterSpacing: 0.5 }} />
          <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder={mode === 'signup' ? 'Create password (min 4 chars)' : 'Password'} maxLength={120}
            onKeyDown={(e) => { if (e.key === 'Enter' && !busy) submit() }}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 50 }} />

          {error && (
            <div role="alert" style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.45)', fontSize: 13, color: '#FCA5A5', fontWeight: 600 }}>{error}</div>
          )}

          <button onClick={submit} disabled={busy}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none', background: busy ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', color: busy ? 'rgba(255,255,255,0.6)' : '#000', fontSize: 15, fontWeight: 900, cursor: busy ? 'wait' : 'pointer', minHeight: 52, boxShadow: busy ? 'none' : '0 6px 18px rgba(250,204,21,0.45)', letterSpacing: 0.3 }}>
            {busy ? 'Signing in…' : (mode === 'login' ? 'Sign in to Dashboard' : 'Create my shop →')}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <a href="mailto:streetlocallive@gmail.com?subject=Password%20reset" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
            <a href="/food/chat/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600 }}>← Back to shop</a>
          </div>

          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 14, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FDE68A', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>What you get</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
              Premium PWA shop · 15 payment gateways · 0% commission · multi-staff · loyalty stamps · marketing automation. Three tiers — Starter, Professional, Enterprise.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
