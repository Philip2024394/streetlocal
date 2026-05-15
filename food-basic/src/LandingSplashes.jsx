/* ─────────────────────────────────────────────────────────────
   LandingSplashes — React ports of the 5 saved landing-page
   designs from /landing-themes.html (Themes #1–#5). Each renders
   inside the 390×844 phone frame the donut app uses for its
   splash, and reads from the SAME `landing` state object the
   donut Hero Editor edits (heroLine1/2/3, subtitle, cta, accent,
   bgImg, heroFontSize, heroFontFamily, etc.) — so every editor
   control (text, colour, font size, font family, image upload)
   drives every theme without rewiring.

   Theme map:
     'classic'  → SplashClassic   (Theme #1)
     'glass'    → SplashGlassCard (Theme #2)
     'discover' → SplashDiscover  (Theme #3)
     'float'    → SplashFloat     (Theme #4)
     'warm'     → SplashWarmCard  (Theme #5)
     'donuts'   → DonutSplash     (Theme #6, lives in App.jsx)

   "Edit them same as the bouncing theme":
     - heroFontSize  scales the main headline (24-72px range — same
                     range the editor's slider produces)
     - heroFontFamily picks the headline typeface from FONT_MAP
     - heroImg       optionally rendered on themes that have room
                     for a hero photo (Glass Card, Discover, Warm)
     - bouncingImg / bottomLeftImg / flavourOrbImg are donut-specific
                     and ignored here — that's intentional, those
                     positions belong to the donut design
   ───────────────────────────────────────────────────────────── */
import React from 'react'

// Same map as in App.jsx DonutSplash — keeps fonts consistent.
const FONT_MAP = {
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  nunito: '"Nunito", system-ui, sans-serif',
  poppins: '"Poppins", system-ui, sans-serif',
  playfair: '"Playfair Display", Georgia, serif',
  caveat: '"Caveat", cursive',
  bebas: '"Bebas Neue", Impact, sans-serif',
}

/* Field with safe defaults. If the user hasn't edited a field, fall
   back to the original demo content from each theme. */
function field (landing, key, fallback) {
  const v = landing?.[key]
  return v == null || v === '' ? fallback : v
}

/* Resolve the headline font family + base size from the editor state.
   Themes scale the base size to fit their layout (Float wants huge,
   Classic wants moderate) — `mul` is the per-theme multiplier. */
function headlineStyle (landing, mul = 1) {
  const fontFamily = FONT_MAP[landing?.heroFontFamily] || FONT_MAP.system
  const base = Number(landing?.heroFontSize) || 44
  return { fontFamily, fontSize: Math.round(base * mul) }
}

/* Single uniform onEnter click — wraps the whole splash so any tap
   enters the menu. Matches the existing DonutSplash behaviour. */
function clickable (onEnter, children, extraStyle = {}) {
  return (
    <div
      onClick={onEnter}
      style={{ cursor: 'pointer', position: 'absolute', inset: 0, ...extraStyle }}
    >
      {children}
    </div>
  )
}

/* ── THEME #1 — Classic ─────────────────────────────────────── */
/* Centered logo + name + tag + button. Logo bg = accent, headline
   = white, button = accent. Hero image (heroImg) takes over the
   logo circle when uploaded. */
export function SplashClassic ({ landing = {}, accent = '#DC2626', onEnter }) {
  const shopName = field(landing, 'heroLine1', 'Your Shop Name')
  const tag = field(landing, 'subtitle', 'Fresh · Fast · Local')
  const cta = field(landing, 'cta', 'View Menu')
  const heroImg = field(landing, 'heroImg', '')
  const initial = String(shopName).charAt(0).toUpperCase()
  const headStyle = headlineStyle(landing, 0.85)
  return clickable(onEnter, (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', fontFamily: FONT_MAP.system }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 16 }}>
        <div style={{ width: 128, height: 128, borderRadius: 64, background: heroImg ? '#fff' : accent, border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
          {heroImg
            ? <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 48, fontWeight: 900, color: '#fff' }}>{initial}</span>
          }
        </div>
        <h1 style={{ ...headStyle, fontWeight: 900, color: '#fff', letterSpacing: -0.5, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>{shopName}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600, maxWidth: 260, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{tag}</p>
        <button onClick={onEnter} style={{ marginTop: 16, padding: '16px 32px', borderRadius: 12, background: accent, color: '#fff', fontWeight: 900, fontSize: 16, border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', cursor: 'pointer' }}>{cta}</button>
      </div>
    </div>
  ))
}

/* ── THEME #2 — Glass Card ──────────────────────────────────── */
/* All decorative colours derive from `accent` so the theme stays
   in the donut shop palette when the vendor switches to it. */
export function SplashGlassCard ({ landing = {}, accent = '#F472B6', onEnter }) {
  const head1 = field(landing, 'heroLine1', 'Delicious')
  const head2 = field(landing, 'heroLine2', 'Food Delivered')
  const head3 = field(landing, 'heroLine3', 'In Minutes')
  const sub = field(landing, 'subtitle', 'Experience premium restaurant quality food with ultra-fast delivery, beautiful presentation, and live order tracking.')
  const cta = field(landing, 'cta', 'Start Order')
  const heroImg = field(landing, 'heroImg', '')
  const stat1 = { n: field(landing, 'stat1Num', '15K+'), l: field(landing, 'stat1Label', 'Happy Customers') }
  const stat2 = { n: field(landing, 'stat2Num', '25m'), l: field(landing, 'stat2Label', 'Delivery Time') }
  const stat3 = { n: field(landing, 'stat3Num', '4.9★'), l: field(landing, 'stat3Label', 'Customer Rating') }
  const liveLabel = field(landing, 'openNow', 'Fast Delivery Live')
  const headStyle = headlineStyle(landing, 1.0)
  return clickable(onEnter, (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', color: '#fff', fontFamily: FONT_MAP.system, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: -120, right: -120, width: 260, height: 260, background: accent + '4D', filter: 'blur(64px)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 240, height: 240, background: accent + '33', filter: 'blur(64px)', borderRadius: '50%' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 390, borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: 24, boxShadow: `0 25px 50px -12px ${accent}33`, overflow: 'hidden', zIndex: 2 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 28 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#4ADE80', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{liveLabel}</span>
        </div>
        <h1 style={{ ...headStyle, lineHeight: 1.05, fontWeight: 900, letterSpacing: -1, margin: 0 }}>
          {head1}<br />{head2}
          <span style={{ display: 'block', color: accent, marginTop: 4 }}>{head3}</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.55, paddingRight: 8, marginTop: 16 }}>{sub}</p>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onEnter} style={{ height: 52, borderRadius: 16, background: accent, color: '#fff', fontSize: 17, fontWeight: 700, border: 'none', boxShadow: `0 25px 50px -12px ${accent}66`, cursor: 'pointer' }}>{cta}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
          {[stat1, stat2, stat3].map((s, i) => (
            <div key={i} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: 12, backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: accent }}>{s.n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, lineHeight: 1.2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ))
}

/* ── THEME #3 — Discover ────────────────────────────────────── */
/* Root is transparent so the donut bg image behind the splash
   shows through (matches Classic + Glass Card). Blur orbs and
   the hero gradient derive from `accent` so the theme stays in
   the pink palette — no hardcoded cyan/purple/blue that fights
   the donut shop look. */
export function SplashDiscover ({ landing = {}, accent = '#F472B6', onEnter }) {
  const greeting = field(landing, 'kicker', 'Welcome Back')
  const dock = field(landing, 'openNow', 'Discover Food')
  const head1 = field(landing, 'heroLine1', 'Modern')
  const head2 = field(landing, 'heroLine2', 'Food')
  const head3 = field(landing, 'heroLine3', 'Discovery')
  const sub = field(landing, 'subtitle', 'Explore futuristic menus with immersive ordering and premium app interactions.')
  const cta = field(landing, 'cta', 'Start Now')
  const heroImg = field(landing, 'heroImg', '')
  const headStyle = headlineStyle(landing, 1.2)
  return clickable(onEnter, (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent', overflow: 'hidden', color: '#fff', fontFamily: FONT_MAP.system, padding: '16px 20px' }}>
      <div style={{ position: 'absolute', top: -150, left: -120, width: 320, height: 320, background: `${accent}33`, filter: 'blur(64px)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: -180, right: -100, width: 300, height: 300, background: `${accent}33`, filter: 'blur(64px)', borderRadius: '50%' }} />
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 8 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>{greeting}</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>{dock}</h2>
        </div>
        <div style={{ position: 'relative', borderRadius: 36, padding: '28px 24px 40px', background: `linear-gradient(135deg, ${accent} 0%, ${accent} 60%, ${accent}dd 100%)`, boxShadow: `0 20px 80px ${accent}59`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 16, right: 16, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }} />
          {heroImg
            ? <img src={heroImg} alt="" style={{ position: 'absolute', top: 24, right: -6, width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', zIndex: 2, boxShadow: '0 20px 80px rgba(0,0,0,0.45)', animation: 'bounce 1s infinite' }} />
            : <div style={{ position: 'absolute', top: 24, right: -6, width: 130, height: 130, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, animation: 'bounce 1s infinite' }}>🍔</div>
          }
          <div style={{ position: 'relative', zIndex: 2, paddingTop: 60 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 999, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 20 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: '#86EFAC', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>LIVE</span>
            </div>
            <h1 style={{ ...headStyle, lineHeight: 0.95, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 20px', maxWidth: 320 }}>
              {head1}<br />{head2}
              <span style={{ display: 'block', color: '#000', marginTop: 6 }}>{head3}</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.55, maxWidth: 260, margin: 0 }}>{sub}</p>
            <button onClick={onEnter} style={{ marginTop: 24, height: 52, padding: '0 32px', borderRadius: 16, background: '#000', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', cursor: 'pointer' }}>{cta}</button>
          </div>
        </div>
      </div>
    </div>
  ))
}

/* ── THEME #4 — Float ───────────────────────────────────────── */
/* Root transparent so donut bg image shows through. Decorative
   blur orbs + CTA gradient derived from the pink accent. */
export function SplashFloat ({ landing = {}, accent = '#F472B6', onEnter }) {
  const head1 = field(landing, 'heroLine1', 'View')
  const head2 = field(landing, 'heroLine2', 'The')
  const head3 = field(landing, 'heroLine3', 'Menu')
  const sub = field(landing, 'subtitle', 'Discover premium meals, immersive food experiences and ultra modern ordering.')
  const cta = field(landing, 'cta', 'View Menu')
  const heroImg = field(landing, 'heroImg', '')
  const headStyle = headlineStyle(landing, 1.4)
  return clickable(onEnter, (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent', overflow: 'hidden', color: '#fff', fontFamily: FONT_MAP.system, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', top: -200, left: -120, width: 420, height: 420, borderRadius: '50%', background: `${accent}33`, filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: -240, right: -100, width: 420, height: 420, borderRadius: '50%', background: `${accent}33`, filter: 'blur(80px)' }} />
      {heroImg
        ? <img src={heroImg} alt="" style={{ position: 'absolute', top: 60, right: -20, width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', boxShadow: `0 30px 120px ${accent}66`, animation: 'bounce 1s infinite' }} />
        : <div style={{ position: 'absolute', top: 80, right: -20, width: 140, height: 140, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 30px 120px ${accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, animation: 'bounce 1s infinite' }}>🍩</div>
      }
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <h1 style={{ ...headStyle, lineHeight: 0.88, fontWeight: 900, letterSpacing: -2.5, margin: '0 0 24px' }}>
          {head1}<br />{head2}
          <span style={{ display: 'block', color: accent }}>{head3}</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.55, maxWidth: 300, margin: '0 auto 24px' }}>{sub}</p>
        <button onClick={onEnter} style={{ width: '100%', height: 60, borderRadius: 28, background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, color: '#fff', fontSize: 18, fontWeight: 900, border: 'none', boxShadow: `0 25px 100px ${accent}73`, cursor: 'pointer' }}>{cta}</button>
      </div>
    </div>
  ))
}

/* ── THEME #5 — Warm Card ───────────────────────────────────── */
/* Root transparent so donut bg image shows through. Decorative
   blur orbs + emoji bubbles + CTA gradient derived from the pink
   accent — no hardcoded orange/red palette. */
export function SplashWarmCard ({ landing = {}, accent = '#F472B6', onEnter }) {
  const head1 = field(landing, 'heroLine1', 'Food')
  const head2 = field(landing, 'heroLine2', 'Worth')
  const head3 = field(landing, 'heroLine3', 'Sharing')
  const sub = field(landing, 'subtitle', 'Experience modern dining with immersive menus, luxury presentation and instant ordering.')
  const cta = field(landing, 'cta', 'Explore Dishes')
  const pill = field(landing, 'openNow', 'OPEN NOW')
  const heroImg = field(landing, 'heroImg', '')
  const stat1 = { n: field(landing, 'stat1Num', '4.9★'), l: field(landing, 'stat1Label', 'Customer Rating') }
  const stat2 = { n: field(landing, 'stat2Num', '15m'), l: field(landing, 'stat2Label', 'Fast Delivery') }
  const headStyle = headlineStyle(landing, 1.3)
  return clickable(onEnter, (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent', overflow: 'hidden', color: '#fff', fontFamily: FONT_MAP.system, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', top: -200, right: -120, width: 500, height: 500, borderRadius: '50%', background: `${accent}1A`, filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: -220, left: -120, width: 420, height: 420, borderRadius: '50%', background: `${accent}26`, filter: 'blur(80px)' }} />
      {heroImg
        ? <img src={heroImg} alt="" style={{ position: 'absolute', top: 60, left: -20, width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', boxShadow: `0 30px 120px ${accent}59`, animation: 'bounce 1s infinite' }} />
        : <div style={{ position: 'absolute', top: 80, left: -20, width: 140, height: 140, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 30px 120px ${accent}59`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, animation: 'bounce 1s infinite' }}>🍩</div>
      }
      <div style={{ position: 'absolute', bottom: 80, right: -30, width: 130, height: 130, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 30px 120px ${accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>🍩</div>
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360, borderRadius: 36, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', padding: 28, overflow: 'hidden', boxShadow: '0 30px 120px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 999, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', marginBottom: 28 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#4ADE80', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>{pill}</span>
        </div>
        <h1 style={{ ...headStyle, lineHeight: 0.85, letterSpacing: -2, fontWeight: 900, margin: '0 0 16px' }}>
          {head1}<br />{head2}
          <span style={{ display: 'block', color: accent }}>{head3}</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.55, maxWidth: 320, margin: '0 0 18px' }}>{sub}</p>
        <button onClick={onEnter} style={{ width: '100%', height: 58, borderRadius: 28, background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, color: '#fff', fontSize: 17, fontWeight: 900, border: 'none', boxShadow: `0 30px 100px ${accent}66`, cursor: 'pointer' }}>{cta}</button>
        <div style={{ marginTop: 16, borderRadius: 24, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{stat1.n}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{stat1.l}</div>
          </div>
          <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{stat2.n}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{stat2.l}</div>
          </div>
        </div>
      </div>
    </div>
  ))
}

/* ── Dispatch helper — pick a splash by theme id ───────────────
   Each entry carries:
     - id      stable key persisted to vendor_accounts.landing_theme_id
     - label   short text used by compact button rows
     - name    long display name used by the picker tile heading
     - tagline one-line teaser shown under the tile name
     - source  'inline' → rendered by DonutSplash in App.jsx
               'react'  → rendered via renderLandingSplash()
   ─────────────────────────────────────────────────────────── */
export const LANDING_THEMES = [
  { id: 'donuts',   label: 'Beyond (donuts)', name: 'Donuts — Sweet Glazed',  tagline: 'Hand-crafted donut shop landing with pink palette and dancing donut hero.',     source: 'inline' },
  { id: 'classic',  label: 'Classic',        name: 'Classic — Centered Hero', tagline: 'Bold centered hero over your background image. The safe, evergreen pick.',    source: 'react'  },
  { id: 'glass',    label: 'Glass Card',     name: 'Glass Card — Editorial',  tagline: 'Frosted glass card floats over your photo. Premium editorial feel.',           source: 'react'  },
  { id: 'discover', label: 'Discover',       name: 'Discover — Magazine',     tagline: 'Magazine cover layout with a corner kicker and confident type.',               source: 'react'  },
  { id: 'float',    label: 'Float',          name: 'Float — Minimal',         tagline: 'Light, airy splash with a floating CTA. Best for product-led shops.',          source: 'react'  },
  { id: 'warm',     label: 'Warm Card',      name: 'Warm Card — Cosy',        tagline: 'Warm card on a backdrop photo. Best for bakeries, cafés, comfort food.',     source: 'react'  },
]

export function renderLandingSplash (themeId, props) {
  switch (themeId) {
    case 'classic':  return <SplashClassic {...props} />
    case 'glass':    return <SplashGlassCard {...props} />
    case 'discover': return <SplashDiscover {...props} />
    case 'float':    return <SplashFloat {...props} />
    case 'warm':     return <SplashWarmCard {...props} />
    default:         return null  // 'donuts' is rendered by DonutSplash inline
  }
}
