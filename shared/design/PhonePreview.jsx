/**
 * PhonePreview — iPhone frame that renders a live preview of how the
 * vendor's landing or menu will look with the current design tokens.
 *
 * Reads the design object (logo, hero, button, layout, cards, promo)
 * and produces a faithful but generic preview. The menu tab shows the
 * per-theme categories so the vendor can see how their picks lay out.
 *
 * Props:
 *   - design          design state object (see DesignStudio.jsx)
 *   - vendor          { shopName, shopLogo }
 *   - bgUrl           background image url
 *   - accent          theme accent color
 *   - tab             'landing' | 'menu'
 *   - categories      [{ id, label, image? }] — used for the menu tab tiles
 */
import React, { useEffect, useState } from 'react'

const HERO_FONTS = {
  system:   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  nunito:   '"Nunito", sans-serif',
  poppins:  '"Poppins", sans-serif',
  playfair: '"Playfair Display", serif',
  caveat:   '"Caveat", cursive',
  bebas:    '"Bebas Neue", sans-serif',
}

const HERO_FONT_SIZES = { normal: 22, large: 28, xl: 34 }

function heroTextStyle(d, accent) {
  const color = d.heroColor || '#fff'
  const ff = HERO_FONTS[d.heroFont] || HERO_FONTS.system
  const size = HERO_FONT_SIZES[d.heroSize] || HERO_FONT_SIZES.normal
  const base = { color, fontFamily: ff, fontSize: size, fontWeight: 900, lineHeight: 1.05, letterSpacing: -0.5 }
  switch (d.heroEffect) {
    case 'glow':    return { ...base, textShadow: `0 0 8px ${color}, 0 0 18px ${color}55` }
    case 'runGlow': return { ...base, textShadow: `0 0 12px ${color}`, animation: 'phonePreviewRunGlow 2.4s ease-in-out infinite' }
    case 'outline': return { ...base, color: 'transparent', WebkitTextStroke: `1.5px ${color}` }
    case 'neon':    return { ...base, textShadow: `0 0 4px #fff, 0 0 12px ${accent}, 0 0 20px ${accent}` }
    case 'none':    return base
    case 'shadow':
    default:        return { ...base, textShadow: '0 2px 8px rgba(0,0,0,0.7)' }
  }
}

function btnEffectStyle(effect, color) {
  switch (effect) {
    case 'glow':      return { boxShadow: `0 0 12px ${color}88, 0 0 24px ${color}55` }
    case 'shake':     return { animation: 'phonePreviewShake 1.6s ease-in-out infinite' }
    case 'signal':    return { animation: 'phonePreviewPulseRing 1.6s ease-out infinite' }
    case 'heartbeat': return { animation: 'phonePreviewHeartbeat 1.4s ease-in-out infinite' }
    default:          return {}
  }
}

export default function PhonePreview({ design = {}, vendor = {}, bgUrl, accent = '#DC2626', tab = 'landing', categories = [] }) {
  const d = design
  const [bannerIdx, setBannerIdx] = useState(0)

  useEffect(() => {
    if (!Array.isArray(d.menuBanners) || d.menuBanners.length < 2) return
    const id = setInterval(() => setBannerIdx((i) => (i + 1) % d.menuBanners.length), 4000)
    return () => clearInterval(id)
  }, [d.menuBanners])

  const accentCol = accent || '#DC2626'
  const btnColor  = d.btnColor || accentCol
  const btnText   = d.btnText || 'View Menu'
  const btnSize   = (d.btnSize || 100) / 100
  const btnR      = d.btnShape === 'pill' ? 24 : d.btnShape === 'square' ? 4 : 10
  const overlay   = ((d.overlayOpacity ?? 40) / 100)

  // Logo dimensions (matches food-basic preview math)
  const PHONE_RATIO = 220 / 360
  const PHONE_MAX   = 220 - 20
  const targetOuter = Math.round(156 * ((d.logoScale || 200) / 100) * PHONE_RATIO)
  const prevOuter   = Math.min(PHONE_MAX, targetOuter)
  const prevInner   = Math.round(prevOuter * ((d.logoInner || 75) / 100))
  const offX        = (d.logoOffsetX || 0) * PHONE_RATIO
  const offY        = (d.logoOffsetY || 0) * PHONE_RATIO

  return (
    <>
      <style>{`
        @keyframes phonePreviewShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
        @keyframes phonePreviewHeartbeat { 0%, 100% { transform: scale(1); } 14% { transform: scale(1.06); } 28% { transform: scale(1); } 42% { transform: scale(1.06); } 70% { transform: scale(1); } }
        @keyframes phonePreviewPulseRing { 0% { box-shadow: 0 0 0 0 currentColor; } 100% { box-shadow: 0 0 0 12px transparent; } }
        @keyframes phonePreviewRunGlow { 0%, 100% { text-shadow: 0 0 6px currentColor; } 50% { text-shadow: 0 0 18px currentColor, 0 0 28px currentColor; } }
        @keyframes phonePreviewPromoScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes phonePreviewPromoWave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes phonePreviewPromoGlow { 0%, 100% { text-shadow: 0 0 4px ${accentCol}; } 50% { text-shadow: 0 0 12px ${accentCol}, 0 0 16px ${accentCol}; } }
        @keyframes phonePreviewPromoPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes phonePreviewPromoFade { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes phonePreviewPromoShake { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-1.5px); } }
      `}</style>

      <div style={{
        width: 220, height: 420, borderRadius: 32, padding: 3,
        background: '#1a1a1a', border: '2px solid #333',
        boxShadow: `0 8px 30px ${accentCol}15, 0 4px 12px rgba(0,0,0,0.3)`,
        position: 'relative', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', right: -3, top: 85, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
        <div style={{ position: 'absolute', left: -3, top: 72, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
        <div style={{ position: 'absolute', left: -3, top: 96, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />

        <div style={{
          width: '100%', height: '100%', borderRadius: 29, overflow: 'hidden',
          position: 'relative', background: '#000',
        }}>
          {/* Background image */}
          {bgUrl && (
            <img src={bgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.05)' }} />
          )}
          {/* Dim overlay */}
          <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlay})` }} />

          {tab === 'landing' ? (
            // ── Landing preview ─────────────────────────────────────
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              flexDirection: 'column',
              justifyContent: d.landingLayout === 'footer' ? 'flex-end' : 'center',
              alignItems: 'center', padding: 14, gap: 10, textAlign: 'center',
            }}>
              {d.shopLogoStyle !== 'off' && (
                d.shopLogoStyle === 'circle' ? (
                  <div style={{
                    width: prevOuter, height: prevOuter, borderRadius: prevOuter / 2,
                    background: accentCol, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  }}>
                    {vendor.shopLogo ? (
                      <img src={vendor.shopLogo} alt="" style={{ width: prevInner, height: prevInner, objectFit: 'contain', transform: `translate(${offX}px, ${offY}px)` }} />
                    ) : (
                      <div style={{ fontSize: Math.round(prevOuter * 0.32), fontWeight: 900, color: '#fff' }}>{(vendor.shopName || '?').charAt(0)}</div>
                    )}
                  </div>
                ) : (
                  vendor.shopLogo ? (
                    <img src={vendor.shopLogo} alt="" style={{ width: prevOuter, height: prevOuter, objectFit: 'contain', transform: `translate(${offX}px, ${offY}px)` }} />
                  ) : (
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>{vendor.shopName || ''}</div>
                  )
                )
              )}
              <div style={heroTextStyle(d, accentCol)}>
                {vendor.shopName || 'Your Shop'}
              </div>
              {d.customTagline && (
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.7)', whiteSpace: 'pre-line', maxWidth: 180, padding: '0 8px' }}>
                  {d.customTagline}
                </div>
              )}
              <button style={{
                marginTop: 4, padding: `${10 * btnSize}px ${22 * btnSize}px`,
                borderRadius: btnR, border: 'none', background: btnColor,
                color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'default',
                ...btnEffectStyle(d.btnEffect, btnColor),
              }}>{btnText}</button>
            </div>
          ) : (
            // ── Menu preview ────────────────────────────────────────
            <div style={{ position: 'absolute', inset: 0, padding: 10, overflowY: 'auto' }}>
              {/* Promo banner */}
              {d.promoBannerEnabled && d.promoBanner && (
                <div style={{
                  height: 22, borderRadius: 11, background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${accentCol}55`, marginBottom: 8,
                  display: 'flex', alignItems: 'center', overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: accentCol, whiteSpace: 'nowrap',
                    animation: `phonePreviewPromo${d.promoBannerEffect ? d.promoBannerEffect.charAt(0).toUpperCase() + d.promoBannerEffect.slice(1) : 'Scroll'} 6s linear infinite`,
                    paddingLeft: 8, position: 'absolute',
                  }}>
                    {String(d.promoBanner).split('\n').join(' · ')}
                  </div>
                </div>
              )}
              {/* Menu banner carousel */}
              {Array.isArray(d.menuBanners) && d.menuBanners.length > 0 && (
                <div style={{ width: '100%', height: 60, borderRadius: 10, overflow: 'hidden', marginBottom: 8, background: '#000' }}>
                  <img src={d.menuBanners[bannerIdx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {/* Category tiles — driven by per-theme categories */}
              <div style={
                d.menuCardStyle === 'grid'
                  ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }
                  : d.menuCardStyle === 'fullwidth'
                  ? { display: 'flex', flexDirection: 'column', gap: 6 }
                  : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }
              }>
                {(categories.length ? categories : [
                  { id: 'a', label: 'Featured' },
                  { id: 'b', label: 'Popular' },
                  { id: 'c', label: 'New' },
                  { id: 'd', label: 'Promo' },
                  { id: 'e', label: 'Bestseller' },
                  { id: 'f', label: 'Special' },
                ]).slice(0, d.menuCardStyle === 'fullwidth' ? 4 : 6).map((c) => (
                  <div key={c.id} style={{
                    background: 'rgba(0,0,0,0.5)', borderRadius: 6,
                    border: `1px solid ${accentCol}40`, padding: 6,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: d.menuCardStyle === 'fullwidth' ? 26 : 44,
                    fontSize: 9, fontWeight: 700, color: '#fff', textAlign: 'center',
                  }}>
                    {c.image && <img src={c.image} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', marginBottom: 3 }} />}
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
