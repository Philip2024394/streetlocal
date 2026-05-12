import React from 'react'

export default function DesignStudio({
  // close handler
  setDesignStudio, setHeroEditor,
  // app-specific config (these vary per app)
  lsPrefix,
  defaultThemeBg,
  themePresets,
  // shop state
  shopName, shopFoodType, shopLogo, shopLogoStyle, shopTheme, shopOpen,
  setShopLogoStyle,
  // logo controls
  logoScale, setLogoScale, logoInner, setLogoInner,
  logoOffsetX, setLogoOffsetX, logoOffsetY, setLogoOffsetY,
  // hero text
  customTagline, setCustomTagline, heroFont, heroColor, heroSubColor,
  // layout
  landingLayout, setLandingLayout, overlayOpacity, setOverlayOpacity,
  // button
  btnEffect, setBtnEffect, btnShape, setBtnShape,
  btnColor, setBtnColor, btnSize, setBtnSize, btnText, setBtnText,
  // promo
  promoBanner, setPromoBanner, promoBannerEnabled, setPromoBannerEnabled,
  // menu banners + cards
  menuBanners, setMenuBanners, menuBannerIdx, menuCardStyle, setMenuCardStyle,
  // splash
  splashEnabled, setSplashEnabled,
  // tool selector
  configTool, setConfigTool, configPreviewTab, setConfigPreviewTab,
  // helpers
  accent, isCustomAccent, bgStyle, imgError, S, vendorId, uploadMenuImage,
}) {
  return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <img src={localStorage.getItem(`${lsPrefix}_themeBg`) || defaultThemeBg} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setDesignStudio(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Design Studio</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Customise your app appearance</div>
              </div>
            </div>

            {/* Logo Style */}
            <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Logo Style</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                {[
                  { id: 'circle', label: 'Circle' },
                  { id: 'bare', label: 'No Circle' },
                  { id: 'off', label: 'Off' },
                ].map(opt => (
                  <button type="button" key={opt.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShopLogoStyle(opt.id) }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: shopLogoStyle === opt.id ? accent : 'rgba(255,255,255,0.08)', color: shopLogoStyle === opt.id ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 44 }}>{opt.label}</button>
                ))}
              </div>
              {shopLogoStyle !== 'off' && (
                <>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>{shopLogoStyle === 'circle' ? 'Circle Size' : 'Logo Size'} ({logoScale}%)</label>
                  <input className="overlay-slider" type="range" min="50" max="300" step="10" value={logoScale} onChange={(e) => setLogoScale(Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.45) ${((logoScale - 50) / 250) * 100}%, rgba(255,255,255,0.15) ${((logoScale - 50) / 250) * 100}%, rgba(255,255,255,0.15) 100%)`, marginBottom: 10 }} />
                  {shopLogoStyle === 'circle' && (
                    <>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Logo Inside Circle ({logoInner}%)</label>
                      <input className="overlay-slider" type="range" min="40" max="100" step="2" value={logoInner} onChange={(e) => setLogoInner(Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.45) ${((logoInner - 40) / 60) * 100}%, rgba(255,255,255,0.15) ${((logoInner - 40) / 60) * 100}%, rgba(255,255,255,0.15) 100%)`, marginBottom: 10 }} />
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Logo Position</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6, minHeight: 150 }}>
                        {/* Live circle preview — scales with logoScale, just like the phone */}
                        {(() => {
                          const prevOuter = Math.min(140, Math.max(30, Math.round(0.5 * logoScale)))
                          const prevInner = Math.round(prevOuter * logoInner / 100)
                          const prevOffX = logoOffsetX * prevOuter / 250
                          const prevOffY = logoOffsetY * prevOuter / 250
                          return (
                            <div style={{ flexShrink: 0, width: prevOuter, height: prevOuter, borderRadius: prevOuter / 2, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.4)', transition: 'width 0.15s ease, height 0.15s ease' }}>
                              {shopLogo ? (
                                <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: prevInner, height: prevInner, objectFit: 'contain', transform: `translate(${prevOffX}px, ${prevOffY}px)`, transition: 'width 0.15s ease, height 0.15s ease' }} />
                              ) : (
                                <div style={{ fontSize: Math.round(prevOuter * 0.32), fontWeight: 900, color: '#fff' }}>{(shopName || '?').charAt(0)}</div>
                              )}
                            </div>
                          )
                        })()}
                        {/* Arrow pad — right */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, flex: 1, maxWidth: 144 }}>
                          <div />
                          <button type="button" onClick={() => setLogoOffsetY(v => Math.max(-40, v - 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)' }}>↑</button>
                          <div />
                          <button type="button" onClick={() => setLogoOffsetX(v => Math.max(-40, v - 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)' }}>←</button>
                          <button type="button" onClick={() => { setLogoOffsetX(0); setLogoOffsetY(0) }} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.25)' }}>•</button>
                          <button type="button" onClick={() => setLogoOffsetX(v => Math.min(40, v + 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)' }}>→</button>
                          <div />
                          <button type="button" onClick={() => setLogoOffsetY(v => Math.min(40, v + 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', minHeight: 36, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)' }}>↓</button>
                          <div />
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>X: {logoOffsetX}px · Y: {logoOffsetY}px · tap • to reset</div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Hero Text Editor — open button */}
            <div style={{ margin: '0 14px 12px' }}>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHeroEditor(true); setDesignStudio(false) }} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${accent}40`, background: 'rgba(0,0,0,0.65)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: '#fff', fontWeight: 900 }}>T</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Hero Text Editor</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Font, size, color, effects</div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
              </button>
            </div>

            {/* Phone Preview + Toolbar — no wrapping container, sits directly on glass bg */}
            <div style={{ margin: '0 14px 12px', padding: 0 }}>
              {(() => {
                const HERO_FONTS_C = { system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', nunito: '"Nunito", sans-serif', poppins: '"Poppins", sans-serif', playfair: '"Playfair Display", serif', caveat: '"Caveat", cursive', bebas: '"Bebas Neue", sans-serif' }
                const ffC = HERO_FONTS_C[heroFont] || HERO_FONTS_C.system
                const btnR = btnShape === 'pill' ? 30 : btnShape === 'square' ? 4 : 12
                const bColor = btnColor || accent
                const previewTab = configPreviewTab
                const TOOLS = [
                  { id: 'layout', svg: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z', label: 'Layout', page: 'landing' },
                  { id: 'button', svg: 'M19 6H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm0 10H5V8h14v8z', label: 'Button', page: 'landing' },
                  { id: 'text', svg: 'M5 4v3h5.5v12h3V7H19V4H5z', label: 'Text', page: 'landing' },
                  { id: 'cards', svg: 'M4 5h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4z', label: 'Cards', page: 'menu' },
                  { id: 'promo', svg: 'M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm0 14H5.17L4 17.17V4h16v12z', label: 'Promo', page: 'menu' },
                  { id: 'splash', svg: 'M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z', label: 'More', page: 'landing' },
                ]

                return (
                  <>
                    <style>{`@keyframes promoScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                      {/* iPhone Frame */}
                      <div style={{ width: 220, height: 420, borderRadius: 32, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 8px 30px ${accent}15, 0 4px 12px rgba(0,0,0,0.3)`, border: '2px solid #333', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', right: -3, top: 85, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                        <div style={{ position: 'absolute', left: -3, top: 72, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                        <div style={{ position: 'absolute', left: -3, top: 96, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                        <div style={{ width: '100%', height: '100%', borderRadius: 29, overflow: 'hidden', position: 'relative', background: '#000' }}>
                          <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 52, height: 14, background: '#000', borderRadius: 10, zIndex: 10 }} />
                          {previewTab === 'landing' && (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <img src={(themePresets.find(t => t.id === shopTheme) || {}).img || localStorage.getItem(`${lsPrefix}_themeBg`) || defaultThemeBg} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                              <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})` }} />
                              {!shopOpen && <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', background: '#EF4444', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 6, fontWeight: 800, zIndex: 5 }}>CLOSED</div>}
                              <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: landingLayout === 'footer' ? 'flex-end' : 'center', paddingBottom: landingLayout === 'footer' ? 54 : 0 }}>
                                {shopLogoStyle !== 'off' && shopLogo ? (() => {
                                  // Preview phone is 220px wide vs real ~360px → ratio 0.611 for WYSIWYG.
                                  const PHONE_RATIO = 220 / 360
                                  const sc = (logoScale / 100) * PHONE_RATIO
                                  const pBare = Math.round(200 * sc)
                                  const pOuter = Math.round(156 * sc)
                                  const pInner = Math.round(pOuter * logoInner / 100)
                                  const pX = logoOffsetX * PHONE_RATIO
                                  const pY = logoOffsetY * PHONE_RATIO
                                  return shopLogoStyle === 'bare'
                                    ? <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: pBare, height: pBare, maxWidth: '85%', maxHeight: '50%', objectFit: 'contain', marginBottom: 6, transform: `translate(${pX}px, ${pY}px)` }} />
                                    : <div style={{ width: pOuter, height: pOuter, maxWidth: '85%', maxHeight: '50%', borderRadius: pOuter / 2, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                                        <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: pInner, height: pInner, objectFit: 'contain', transform: `translate(${pX}px, ${pY}px)` }} />
                                      </div>
                                })() : shopLogoStyle !== 'off' ? (() => {
                                  const PHONE_RATIO = 220 / 360
                                  const fs = Math.round(90 * (logoScale / 100) * PHONE_RATIO)
                                  return <div style={{ width: fs, height: fs, borderRadius: fs / 2, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(40 * (logoScale / 100) * PHONE_RATIO), fontWeight: 900, color: '#fff', marginBottom: 6 }}>{shopName.charAt(0)}</div>
                                })() : null}
                                <div style={{ fontSize: 17, fontWeight: 800, color: heroColor, fontFamily: ffC, textAlign: landingLayout === 'left' ? 'left' : 'center', textShadow: '0 1px 3px rgba(0,0,0,0.9)', lineHeight: 1.1, padding: '0 8px' }}>{shopName}</div>
                                <div style={{ fontSize: 9, color: heroSubColor || 'rgba(255,255,255,0.8)', fontFamily: ffC, marginTop: 3, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>{customTagline || shopFoodType}</div>
                                <div style={{
                                  position: 'absolute', bottom: 20, left: 0, right: 0,
                                  display: 'flex', justifyContent: 'center', pointerEvents: 'none',
                                }}>
                                  <div style={{
                                    position: 'relative', pointerEvents: 'auto',
                                    padding: `${Math.round(5 * btnSize / 100)}px ${Math.round(16 * btnSize / 100)}px`,
                                    borderRadius: btnR,
                                    background: bColor,
                                    fontSize: Math.round(9 * btnSize / 100), fontWeight: 700, color: '#fff', overflow: 'visible',
                                    whiteSpace: 'nowrap',
                                    transformOrigin: 'center center',
                                    ...(btnEffect === 'shake' ? { animation: 'btnShake 1s ease-in-out infinite' } : {}),
                                    ...(btnEffect === 'heartbeat' ? { animation: 'btnHeartbeat 1.2s ease-in-out infinite' } : {}),
                                  }}>
                                    {btnEffect === 'glow' && (
                                      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: btnR, pointerEvents: 'none' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)', animation: 'btnRunningGlow 2s linear infinite' }} />
                                      </div>
                                    )}
                                    {btnEffect === 'signal' && (
                                      <>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', borderRadius: btnR, border: `1.5px solid ${bColor}`, zIndex: -1, pointerEvents: 'none', animation: 'btnSignalPing 1.6s ease-out infinite' }} />
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', borderRadius: btnR, border: `1.5px solid ${bColor}`, zIndex: -1, pointerEvents: 'none', animation: 'btnSignalPing 1.6s ease-out infinite', animationDelay: '0.8s' }} />
                                      </>
                                    )}
                                    <span style={{ position: 'relative' }}>{btnText || 'View Menu'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {previewTab === 'menu' && (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <img src={localStorage.getItem(`${lsPrefix}_themeBg`) || defaultThemeBg} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
                              <div style={{ position: 'relative', zIndex: 2, padding: '24px 8px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><div style={{ width: 18, height: 18, borderRadius: 9, background: accent }} /><div style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>{shopName}</div></div>
                                {promoBanner && <div style={{ background: accent, padding: '2px 8px', borderRadius: 4, marginBottom: 5, overflow: 'hidden', opacity: promoBannerEnabled ? 1 : 0.35, position: 'relative' }}><div style={{ fontSize: 7, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', animation: 'promoScroll 6s linear infinite' }}>{promoBanner}</div>{!promoBannerEnabled && <div style={{ position: 'absolute', top: 1, right: 3, fontSize: 6, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '0 3px', borderRadius: 2, letterSpacing: 0.5 }}>OFF</div>}</div>}
                                {menuBanners.length > 0 && (
                                  <>
                                    <div style={{ position: 'relative', width: '100%', height: 36, borderRadius: 5, overflow: 'hidden', marginBottom: menuBanners.length > 1 ? 2 : 5 }}>
                                      {menuBanners.map((url, i) => (
                                        <img key={url + i} src={url} alt="" onError={imgError('banner')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === menuBannerIdx ? 1 : 0, transition: 'opacity 0.6s ease' }} />
                                      ))}
                                    </div>
                                    {menuBanners.length > 1 && (
                                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 5 }}>
                                        {menuBanners.map((_, i) => (
                                          <div key={i} style={{ width: 10, height: 2, borderRadius: 1, background: i === menuBannerIdx ? accent : 'rgba(255,255,255,0.3)', transition: 'background 0.3s ease' }} />
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                                {menuCardStyle === 'grid' ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>{[1,2,3,4].map(i => <div key={i} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4 }}><div style={{ width: '100%', height: 32, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 3 }} /><div style={{ height: 5, width: '70%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '40%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div>)}</div>
                                ) : menuCardStyle === 'fullwidth' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[1,2].map(i => <div key={i} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}><div style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.1)' }} /><div style={{ padding: 4 }}><div style={{ height: 5, width: '60%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '30%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div></div>)}</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[1,2,3].map(i => <div key={i} style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4, borderLeft: `3px solid ${accent}` }}><div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ height: 5, width: '70%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 4, width: '90%', background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '35%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div></div>)}</div>
                                )}
                              </div>
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
                        </div>
                      </div>

                      {/* Side Toolbar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        {TOOLS.map(t => {
                          const isActive = configTool === t.id
                          return (
                            <button key={t.id} onClick={() => { setConfigTool(isActive ? null : t.id); setConfigPreviewTab(t.page) }} style={{ width: 46, height: 46, borderRadius: 14, border: isActive ? '2px solid #FFD600' : '1px solid rgba(255,255,255,0.08)', background: isActive ? '#FFD600' : '#000', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'all 0.2s', boxShadow: isActive ? '0 0 12px rgba(255,214,0,0.6), 0 0 20px rgba(255,214,0,0.3)' : 'none' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill={isActive ? '#1a1a1a' : '#fff'}><path d={t.svg} /></svg>
                              <span style={{ fontSize: 7, fontWeight: 800, color: isActive ? '#1a1a1a' : '#fff', letterSpacing: 0.3 }}>{t.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Contextual Controls */}
                    {configTool && (
                      <div style={{ padding: 12, borderRadius: 14, border: `1px solid ${accent}30`, background: `${accent}08`, marginTop: 6 }}>
                        {configTool === 'layout' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Layout & Overlay</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Landing Layout</label><div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{[{ id: 'center', label: 'Center' }, { id: 'footer', label: 'Footer' }].map(opt => (<button key={opt.id} onClick={() => setLandingLayout(opt.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: landingLayout === opt.id ? accent : 'rgba(255,255,255,0.08)', color: landingLayout === opt.id ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 40 }}>{opt.label}</button>))}</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Overlay Darkness ({overlayOpacity}%)</label><style>{`.overlay-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;outline:none;cursor:pointer;}.overlay-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;border-radius:13px;background:#DC2626;border:2px solid #FFFFFF;box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 1px 2px rgba(255,255,255,0.25);cursor:pointer;margin-top:-10px;}.overlay-slider::-moz-range-thumb{width:26px;height:26px;border-radius:13px;background:#DC2626;border:2px solid #FFFFFF;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;}.overlay-slider::-webkit-slider-runnable-track{height:6px;border-radius:3px;}.overlay-slider::-moz-range-track{height:6px;border-radius:3px;}`}</style><input className="overlay-slider" type="range" min="0" max="80" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.45) ${(overlayOpacity / 80) * 100}%, rgba(255,255,255,0.15) ${(overlayOpacity / 80) * 100}%, rgba(255,255,255,0.15) 100%)`, marginBottom: 8 }} /></>)}
                        {configTool === 'button' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Button Style</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Shape</label><div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>{['rounded', 'pill', 'square'].map(s => (<button key={s} onClick={() => setBtnShape(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: btnShape === s ? accent : 'rgba(255,255,255,0.08)', color: btnShape === s ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 40 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>))}</div><label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Color</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 4 }}>{[{c: accent, label: 'Theme'}, {c: '#FACC15'}, {c: '#F59E0B'}, {c: '#EF4444'}, {c: '#DC2626'}, {c: '#EC4899'}, {c: '#A855F7'}, {c: '#3B82F6'}, {c: '#06B6D4'}, {c: '#22C55E'}, {c: '#10B981'}, {c: '#1A1A1A'}, {c: '#FFFFFF'}, {c: '#F97316'}].map(({c, label}, i) => { const isPicked = btnColor === c || (i === 0 && !btnColor); return (<button key={i + c} type="button" onClick={() => setBtnColor(i === 0 ? '' : c)} aria-label={label || c} title={label || c} style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '50%', background: c, border: isPicked ? `3px solid #fff` : (i === 0 ? '2px solid rgba(255,215,0,0.6)' : '1px solid rgba(255,255,255,0.18)'), cursor: 'pointer', padding: 0, position: 'relative' }}>{i === 0 && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 8, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)', letterSpacing: 0.5 }}>T</span>}</button>) })}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>The "T" swatch matches your theme accent exactly.</div>{btnColor && <button type="button" onClick={() => setBtnColor('')} style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '0 6px', marginBottom: 8 }}>Reset to theme</button>}<label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Button Text</label><input style={{ ...S.input, marginBottom: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} value={btnText} onChange={(e) => setBtnText(e.target.value)} placeholder="View Menu" maxLength={20} /><label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 4, display: 'block' }}>Effect</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 10 }}>{[{ id: 'none', label: 'None' }, { id: 'glow', label: 'Glow' }, { id: 'shake', label: 'Shake' }, { id: 'signal', label: 'Signal' }, { id: 'heartbeat', label: 'Heart' }].map(opt => (<button key={opt.id} onClick={() => setBtnEffect(opt.id)} style={{ padding: '8px 2px', borderRadius: 8, border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer', background: btnEffect === opt.id ? accent : 'rgba(255,255,255,0.06)', color: btnEffect === opt.id ? '#fff' : 'rgba(255,255,255,0.55)', minHeight: 36 }}>{opt.label}</button>))}</div><label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 4, display: 'block' }}>Size ({btnSize}%)</label><style>{`.size-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;outline:none;cursor:pointer;}.size-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;border-radius:13px;background:#FACC15;border:2px solid #DC2626;box-shadow:0 2px 8px rgba(0,0,0,0.4),inset 0 1px 2px rgba(255,255,255,0.4);cursor:pointer;margin-top:-10px;}.size-slider::-moz-range-thumb{width:26px;height:26px;border-radius:13px;background:#FACC15;border:2px solid #DC2626;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;}.size-slider::-webkit-slider-runnable-track{height:6px;border-radius:3px;}.size-slider::-moz-range-track{height:6px;border-radius:3px;}`}</style><input className="size-slider" type="range" min="60" max="160" step="5" value={btnSize} onChange={(e) => setBtnSize(Number(e.target.value))} style={{ background: `linear-gradient(to right, #DC2626 0%, #DC2626 ${((btnSize - 60) / 100) * 100}%, rgba(255,255,255,0.18) ${((btnSize - 60) / 100) * 100}%, rgba(255,255,255,0.18) 100%)`, marginBottom: 8 }} /></>)}
                        {configTool === 'text' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Tagline</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Custom Tagline</label><input style={{ ...S.input, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={customTagline} onChange={(e) => setCustomTagline(e.target.value)} placeholder="Leave empty to use food type" maxLength={40} /><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Replaces "{shopFoodType}" on your landing page</div></>)}
                        {configTool === 'cards' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Menu Cards & Banner</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Card Style</label><div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{[{ id: 'horizontal', label: 'Horizontal' }, { id: 'grid', label: 'Grid' }, { id: 'fullwidth', label: 'Full Width' }].map(opt => (<button key={opt.id} onClick={() => setMenuCardStyle(opt.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: menuCardStyle === opt.id ? accent : 'rgba(255,255,255,0.08)', color: menuCardStyle === opt.id ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 40 }}>{opt.label}</button>))}</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 2, display: 'block' }}>Banner Carousel Above Menu ({menuBanners.length}/5)</label><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, lineHeight: 1.4 }}>Wide landscape image(s) shown above the menu. Add up to 5 — they auto-rotate every 4 seconds with an indicator bar below. Recommended 1200×280px.</div><div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>{menuBanners.length < 5 && <label style={{ padding: '8px 14px', borderRadius: 10, background: accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add Banner<input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => { const file = e.target.files[0]; if (!file) return; e.target.value = ''; const url = await uploadMenuImage(vendorId, file); if (url) setMenuBanners(prev => [...prev, url].slice(0, 5)) }} /></label>}{menuBanners.length > 0 && <button onClick={() => setMenuBanners([])} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear All</button>}</div>{menuBanners.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{menuBanners.map((url, i) => (<div key={url + i} style={{ position: 'relative', width: 'calc(33% - 4px)' }}><img src={url} alt="" onError={imgError('banner')} style={{ width: '100%', height: 44, objectFit: 'cover', borderRadius: 6, border: i === menuBannerIdx ? `2px solid ${accent}` : '2px solid transparent' }} /><button onClick={() => setMenuBanners(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, border: '2px solid #1a1a1a', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button></div>))}</div>}</>)}
                        {configTool === 'promo' && (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Promo Banner</div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Running Text</label>
                            <textarea
                              value={promoBanner}
                              onChange={(e) => setPromoBanner(e.target.value.slice(0, 300))}
                              placeholder={"Free delivery this week!\nPress Enter for another promo\n10% off first order"}
                              rows={3}
                              style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8, padding: '8px 12px',
                                color: '#fff', fontSize: 13, lineHeight: 1.5,
                                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                                minHeight: 90, marginBottom: 6,
                              }}
                            />
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.4 }}>
                              Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 9 }}>Enter</kbd> for another promo line. Lines join with <span style={{ color: accent, fontWeight: 700 }}> · </span> in the banner. {promoBanner.length}/300
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={() => setPromoBannerEnabled(!promoBannerEnabled)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: promoBannerEnabled ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                                <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: promoBannerEnabled ? 19 : 3, transition: 'left 0.2s' }} />
                              </button>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Enable</span>
                            </div>
                          </>
                        )}
                        {configTool === 'splash' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Extra Features</div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => setSplashEnabled(!splashEnabled)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: splashEnabled ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: splashEnabled ? 19 : 3, transition: 'left 0.2s' }} /></button><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Splash Screen (2s branded loading)</span></div></>)}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Done button */}
            <div style={{ padding: '8px 14px 28px' }}>
              <button onClick={() => setDesignStudio(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
  )
}
