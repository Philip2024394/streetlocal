// Design Studio — vendor branding tool for foodlocal-pro. Mirrors
// food-basic/src/App.jsx lines 6846–7188 (logo, hero, layout, button,
// cards, banner, promo, splash) with the same 6-tool sidebar and an
// iPhone live preview. Saves to localStorage immediately for snappy
// editing, then upserts to restaurants.theme on Save Changes.
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import imgError from '../../imgFallback'

const LOCAL_KEY = 'foodlocalpro_theme'
const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const HERO_FONTS = {
  system:   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  nunito:   '"Nunito", sans-serif',
  poppins:  '"Poppins", sans-serif',
  playfair: '"Playfair Display", serif',
  caveat:   '"Caveat", cursive',
  bebas:    '"Bebas Neue", sans-serif',
}

// Default theme presets — vendor's restaurant background. Picked once,
// then editor overlays/buttons/text sit on top. Pro starts with red.
const THEME_BG = 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'

const DEFAULT_THEME = {
  logo_style:     'circle',
  logo_scale:     100,
  logo_inner:     70,
  logo_offset_x:  0,
  logo_offset_y:  0,
  hero_font:      'system',
  hero_color:     '#FFFFFF',
  hero_sub_color: 'rgba(255,255,255,0.8)',
  landing_layout: 'center',
  overlay_opacity: 40,
  btn_shape:      'rounded',
  btn_color:      '',
  btn_text:       'View Menu',
  btn_size:       100,
  btn_effect:     'glow',
  tagline:        '',
  menu_card_style:'horizontal',
  menu_banners:   [],
  promo_banner:   '',
  promo_enabled:  true,
  promo_effect:   'scroll',
  splash_enabled: false,
}

function loadTheme() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return DEFAULT_THEME
    return { ...DEFAULT_THEME, ...JSON.parse(raw) }
  } catch { return DEFAULT_THEME }
}
function saveLocal(theme) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(theme)) } catch {}
}

export default function DesignStudio({ restaurant, onClose }) {
  const [t, setT] = useState(loadTheme)
  const set = (key, value) => setT(prev => { const next = { ...prev, [key]: value }; saveLocal(next); return next })

  // Pull saved theme from Supabase on mount so localStorage merges with
  // server state (server wins on conflict).
  useEffect(() => {
    if (!supabase || !restaurant?.id) return
    let cancelled = false
    supabase.from('restaurants').select('theme, shop_logo, name')
      .eq('id', restaurant.id).single()
      .then(({ data }) => {
        if (cancelled || !data?.theme) return
        const merged = { ...DEFAULT_THEME, ...data.theme }
        setT(merged); saveLocal(merged)
      }).catch(() => {})
    return () => { cancelled = true }
  }, [restaurant?.id])

  const [configTool, setConfigTool] = useState(null)
  const [previewTab, setPreviewTab] = useState('landing')
  const [savingMsg, setSavingMsg] = useState('')
  const [banner, setBanner] = useState(0)

  // Auto-rotate banners every 4s in the preview
  useEffect(() => {
    if (!t.menu_banners?.length || t.menu_banners.length < 2) return
    const id = setInterval(() => setBanner(b => (b + 1) % t.menu_banners.length), 4000)
    return () => clearInterval(id)
  }, [t.menu_banners])

  const shopName = restaurant?.name || 'My Restaurant'
  const shopLogo = restaurant?.shop_logo || ''
  const shopOpen = restaurant?.is_open !== false
  const heroFont = HERO_FONTS[t.hero_font] || HERO_FONTS.system
  const btnR = t.btn_shape === 'pill' ? 30 : t.btn_shape === 'square' ? 4 : 12
  const bColor = t.btn_color || BRAND.red

  const TOOLS = [
    { id: 'layout', svg: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z', label: 'Layout', page: 'landing' },
    { id: 'button', svg: 'M19 6H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm0 10H5V8h14v8z',     label: 'Button', page: 'landing' },
    { id: 'text',   svg: 'M5 4v3h5.5v12h3V7H19V4H5z',                                                            label: 'Text',   page: 'landing' },
    { id: 'cards',  svg: 'M4 5h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4z',                                     label: 'Cards',  page: 'menu' },
    { id: 'promo',  svg: 'M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm0 14H5.17L4 17.17V4h16v12z',label: 'Promo',  page: 'menu' },
    { id: 'splash', svg: 'M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z', label: 'More', page: 'landing' },
  ]

  const handleSave = async () => {
    saveLocal(t)
    if (!supabase || !restaurant?.id) { setSavingMsg('Saved locally.'); setTimeout(() => setSavingMsg(''), 1800); return }
    setSavingMsg('Saving…')
    const { error } = await supabase.from('restaurants').update({ theme: t }).eq('id', restaurant.id)
    setSavingMsg(error ? `Save failed: ${error.message}` : 'Saved.')
    setTimeout(() => setSavingMsg(''), 1800)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10005 }}>
      <img src={THEME_BG} alt="" onError={imgError('theme')} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
      <style>{`
        @keyframes promoScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes promoWave  { 0% { transform: translateX(100%) translateY(0); } 25% { transform: translateX(50%) translateY(-3px); } 50% { transform: translateX(0%) translateY(0); } 75% { transform: translateX(-50%) translateY(3px); } 100% { transform: translateX(-100%) translateY(0); } }
        @keyframes promoGlow  { 0%,100% { text-shadow: 0 0 2px rgba(156,163,175,0.4); } 50% { text-shadow: 0 0 6px rgba(255,255,255,0.95), 0 0 10px rgba(255,255,255,0.5); } }
        @keyframes promoPulse { 0%,100% { transform: translateX(100%) scale(1); } 50% { transform: translateX(0%) scale(1.08); } }
        @keyframes promoFade  { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes promoShake { 0%,100% { transform: translateX(100%); } 10% { transform: translateX(95%) translateY(-0.5px); } 50% { transform: translateX(0%); } 90% { transform: translateX(-95%) translateY(-0.5px); } }
        @keyframes btnShake    { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-1deg); } 75% { transform: rotate(1deg); } }
        @keyframes btnHeartbeat{ 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes btnRunGlow  { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
        @keyframes btnSignalPing { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
        .ds-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
        .ds-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 12px; background: ${BRAND.red}; border: 2px solid #FFF; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer; margin-top: -9px; }
        .ds-slider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 12px; background: ${BRAND.red}; border: 2px solid #FFF; cursor: pointer; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 520, margin: '0 auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', gap: 10 }}>
          <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 19, background: BRAND.red, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Design Studio</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Customise your restaurant appearance</div>
          </div>
        </div>

        {/* Logo Style card */}
        <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: `1px solid ${BRAND.redBorder}` }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Logo Style</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { id: 'circle', label: 'Circle' },
              { id: 'bare',   label: 'No Circle' },
              { id: 'off',    label: 'Off' },
            ].map(opt => (
              <button key={opt.id} type="button" onClick={() => set('logo_style', opt.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: t.logo_style === opt.id ? BRAND.red : 'rgba(255,255,255,0.08)', color: t.logo_style === opt.id ? '#fff' : 'rgba(255,255,255,0.55)' }}>{opt.label}</button>
            ))}
          </div>
          {t.logo_style !== 'off' && (
            <>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>{t.logo_style === 'circle' ? 'Circle Size' : 'Logo Size'} ({t.logo_scale}%)</label>
              <input className="ds-slider" type="range" min="50" max="300" step="10" value={t.logo_scale} onChange={e => set('logo_scale', Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0% ${((t.logo_scale - 50) / 250) * 100}%, rgba(255,255,255,0.15) ${((t.logo_scale - 50) / 250) * 100}% 100%)`, marginBottom: 10 }} />
              {t.logo_style === 'circle' && (
                <>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Logo Inside Circle ({t.logo_inner}%)</label>
                  <input className="ds-slider" type="range" min="40" max="100" step="2" value={t.logo_inner} onChange={e => set('logo_inner', Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0% ${((t.logo_inner - 40) / 60) * 100}%, rgba(255,255,255,0.15) ${((t.logo_inner - 40) / 60) * 100}% 100%)`, marginBottom: 10 }} />
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Logo Position (X: {t.logo_offset_x}px · Y: {t.logo_offset_y}px)</label>
                  <div style={{ width: 144, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 6 }}>
                    <div /><button type="button" onClick={() => set('logo_offset_y', Math.max(-40, t.logo_offset_y - 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>↑</button><div />
                    <button type="button" onClick={() => set('logo_offset_x', Math.max(-40, t.logo_offset_x - 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>←</button>
                    <button type="button" onClick={() => { set('logo_offset_x', 0); set('logo_offset_y', 0) }} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>•</button>
                    <button type="button" onClick={() => set('logo_offset_x', Math.min(40, t.logo_offset_x + 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>→</button>
                    <div /><button type="button" onClick={() => set('logo_offset_y', Math.min(40, t.logo_offset_y + 4))} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>↓</button><div />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Phone Preview + Toolbar */}
        <div style={{ margin: '0 14px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            {/* iPhone frame */}
            <div style={{ width: 220, height: 420, borderRadius: 32, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 8px 30px ${BRAND.redGlow}, 0 4px 12px rgba(0,0,0,0.3)`, border: '2px solid #333', flexShrink: 0 }}>
              <div style={{ position: 'absolute', right: -3, top: 85, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
              <div style={{ position: 'absolute', left: -3, top: 72, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
              <div style={{ position: 'absolute', left: -3, top: 96, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
              <div style={{ width: '100%', height: '100%', borderRadius: 29, overflow: 'hidden', position: 'relative', background: '#000' }}>
                <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 52, height: 14, background: '#000', borderRadius: 10, zIndex: 10 }} />
                {previewTab === 'landing' && (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img src={THEME_BG} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${t.overlay_opacity / 100})` }} />
                    {!shopOpen && <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', background: '#EF4444', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 6, fontWeight: 800, zIndex: 5 }}>CLOSED</div>}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: t.landing_layout === 'footer' ? 'flex-end' : 'center', paddingBottom: t.landing_layout === 'footer' ? 54 : 0 }}>
                      {t.logo_style !== 'off' && (() => {
                        const PHONE_RATIO = 220 / 360
                        const sc = (t.logo_scale / 100) * PHONE_RATIO
                        const pBare  = Math.round(200 * sc)
                        const pOuter = Math.round(156 * sc)
                        const pInner = Math.round(pOuter * t.logo_inner / 100)
                        const pX = t.logo_offset_x * PHONE_RATIO
                        const pY = t.logo_offset_y * PHONE_RATIO
                        if (t.logo_style === 'bare' && shopLogo)
                          return <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: pBare, height: pBare, maxWidth: 'calc(100% - 20px)', maxHeight: '50%', objectFit: 'contain', marginBottom: 6, transform: `translate(${pX}px, ${pY}px)` }} />
                        return (
                          <div style={{ width: pOuter, height: pOuter, maxWidth: 'calc(100% - 20px)', maxHeight: '50%', borderRadius: pOuter / 2, background: BRAND.red, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                            {shopLogo
                              ? <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: pInner, height: pInner, objectFit: 'contain', transform: `translate(${pX}px, ${pY}px)` }} />
                              : <div style={{ fontSize: Math.round(pOuter * 0.32), fontWeight: 900, color: '#fff' }}>{shopName.charAt(0)}</div>}
                          </div>
                        )
                      })()}
                      <div style={{ fontSize: 17, fontWeight: 800, color: t.hero_color, fontFamily: heroFont, textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.9)', lineHeight: 1.1, padding: '0 8px' }}>{shopName}</div>
                      {(() => {
                        const lines = (t.tagline || '').split('\n').filter(l => l.length > 0).slice(0, 2)
                        if (!lines.length) return null
                        return (
                          <div style={{ padding: '0 8px', width: '100%', boxSizing: 'border-box' }}>
                            {lines.map((line, i) => (
                              <div key={i} style={{ fontSize: 9, color: t.hero_sub_color, fontFamily: heroFont, marginTop: i === 0 ? 3 : 0, textShadow: '0 1px 2px rgba(0,0,0,0.9)', textAlign: 'center', wordBreak: 'break-word' }}>{line}</div>
                            ))}
                          </div>
                        )
                      })()}
                      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{
                          position: 'relative', pointerEvents: 'auto', overflow: 'visible',
                          padding: `${Math.round(5 * t.btn_size / 100)}px ${Math.round(16 * t.btn_size / 100)}px`,
                          borderRadius: btnR, background: bColor,
                          fontSize: Math.round(9 * t.btn_size / 100), fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                          ...(t.btn_effect === 'shake' ? { animation: 'btnShake 1s ease-in-out infinite' } : {}),
                          ...(t.btn_effect === 'heartbeat' ? { animation: 'btnHeartbeat 1.2s ease-in-out infinite' } : {}),
                        }}>
                          {t.btn_effect === 'glow' && (
                            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: btnR, pointerEvents: 'none' }}>
                              <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)', animation: 'btnRunGlow 2s linear infinite' }} />
                            </div>
                          )}
                          {t.btn_effect === 'signal' && (
                            <>
                              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', borderRadius: btnR, border: `1.5px solid ${bColor}`, zIndex: -1, pointerEvents: 'none', animation: 'btnSignalPing 1.6s ease-out infinite' }} />
                              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', borderRadius: btnR, border: `1.5px solid ${bColor}`, zIndex: -1, pointerEvents: 'none', animation: 'btnSignalPing 1.6s ease-out infinite', animationDelay: '0.8s' }} />
                            </>
                          )}
                          <span style={{ position: 'relative' }}>{t.btn_text || 'View Menu'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {previewTab === 'menu' && (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img src={THEME_BG} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
                    <div style={{ position: 'relative', zIndex: 2, padding: '24px 8px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 9, background: BRAND.red }} />
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>{shopName}</div>
                      </div>
                      {t.promo_banner && (() => {
                        const animMap = { scroll: 'promoScroll 6s linear infinite', wave: 'promoWave 6s ease-in-out infinite', glow: 'promoScroll 6s linear infinite, promoGlow 2s ease-in-out infinite', pulse: 'promoPulse 6s ease-in-out infinite', fade: 'promoScroll 6s linear infinite, promoFade 2.5s ease-in-out infinite', shake: 'promoShake 6s linear infinite' }
                        const anim = animMap[t.promo_effect] || animMap.scroll
                        return (
                          <div style={{ padding: '2px 8px', marginBottom: 5, overflow: 'hidden', opacity: t.promo_enabled ? 1 : 0.35, position: 'relative' }}>
                            <div style={{ fontSize: 7, color: '#fde68a', fontWeight: 700, whiteSpace: 'nowrap', animation: anim, display: 'inline-block' }}>{t.promo_banner.split('\n').filter(Boolean).join(' · ')}</div>
                            {!t.promo_enabled && <div style={{ position: 'absolute', top: 1, right: 3, fontSize: 6, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '0 3px', borderRadius: 2, letterSpacing: 0.5 }}>OFF</div>}
                          </div>
                        )
                      })()}
                      {t.menu_banners?.length > 0 && (
                        <>
                          <div style={{ position: 'relative', width: '100%', height: 36, borderRadius: 5, overflow: 'hidden', marginBottom: t.menu_banners.length > 1 ? 2 : 5 }}>
                            {t.menu_banners.map((url, i) => (
                              <img key={url + i} src={url} alt="" onError={imgError('banner')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === banner ? 1 : 0, transition: 'opacity 0.6s ease' }} />
                            ))}
                          </div>
                          {t.menu_banners.length > 1 && (
                            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 5 }}>
                              {t.menu_banners.map((_, i) => <div key={i} style={{ width: 10, height: 2, borderRadius: 1, background: i === banner ? BRAND.red : 'rgba(255,255,255,0.3)' }} />)}
                            </div>
                          )}
                        </>
                      )}
                      {t.menu_card_style === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          {[1,2,3,4].map(i => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4 }}>
                              <div style={{ width: '100%', height: 32, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 3 }} />
                              <div style={{ height: 5, width: '70%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} />
                              <div style={{ height: 5, width: '40%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} />
                            </div>
                          ))}
                        </div>
                      ) : t.menu_card_style === 'fullwidth' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {[1,2].map(i => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}>
                              <div style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.1)' }} />
                              <div style={{ padding: 4 }}>
                                <div style={{ height: 5, width: '60%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} />
                                <div style={{ height: 5, width: '30%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {[1,2,3].map(i => (
                            <div key={i} style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4, borderLeft: `3px solid ${BRAND.red}` }}>
                              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ height: 5, width: '70%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} />
                                <div style={{ height: 4, width: '90%', background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 2 }} />
                                <div style={{ height: 5, width: '35%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
              </div>
            </div>

            {/* Side Toolbar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              {TOOLS.map(tool => {
                const isActive = configTool === tool.id
                return (
                  <button key={tool.id} onClick={() => { setConfigTool(isActive ? null : tool.id); setPreviewTab(tool.page) }} style={{ width: 46, height: 46, borderRadius: 14, border: isActive ? `2px solid ${BRAND.red}` : '1px solid rgba(255,255,255,0.08)', background: isActive ? BRAND.red : '#000', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, boxShadow: isActive ? `0 0 12px ${BRAND.redGlow}, 0 0 20px ${BRAND.redBorder}` : 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d={tool.svg} /></svg>
                    <span style={{ fontSize: 7, fontWeight: 800, color: '#fff', letterSpacing: 0.3 }}>{tool.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contextual Controls */}
          {configTool && (
            <div style={{ padding: 12, borderRadius: 14, border: `1px solid ${BRAND.redBorder}`, background: 'rgba(0,0,0,0.55)', marginTop: 6 }}>
              {configTool === 'layout' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Layout & Overlay</div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Landing Layout</label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {[{ id: 'center', label: 'Center' }, { id: 'footer', label: 'Footer' }].map(opt => (
                      <button key={opt.id} onClick={() => set('landing_layout', opt.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: t.landing_layout === opt.id ? BRAND.red : 'rgba(255,255,255,0.08)', color: '#fff' }}>{opt.label}</button>
                    ))}
                  </div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Overlay Darkness ({t.overlay_opacity}%)</label>
                  <input className="ds-slider" type="range" min="0" max="80" value={t.overlay_opacity} onChange={e => set('overlay_opacity', Number(e.target.value))} style={{ background: `linear-gradient(to right, rgba(255,255,255,0.45) 0% ${(t.overlay_opacity / 80) * 100}%, rgba(255,255,255,0.15) ${(t.overlay_opacity / 80) * 100}% 100%)` }} />
                </>
              )}

              {configTool === 'button' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Button Style</div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Shape</label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {['rounded', 'pill', 'square'].map(s => (
                      <button key={s} onClick={() => set('btn_shape', s)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: t.btn_shape === s ? BRAND.red : 'rgba(255,255,255,0.08)', color: '#fff' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                    ))}
                  </div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Color</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
                    {[
                      { c: '',         label: 'Theme' },
                      { c: '#FACC15' }, { c: '#F59E0B' }, { c: '#EF4444' }, { c: '#DC2626' },
                      { c: '#EC4899' }, { c: '#A855F7' }, { c: '#3B82F6' }, { c: '#06B6D4' },
                      { c: '#22C55E' }, { c: '#10B981' }, { c: '#1A1A1A' }, { c: '#FFFFFF' }, { c: '#F97316' },
                    ].map(({ c, label }, i) => {
                      const isPicked = t.btn_color === c
                      return (
                        <button key={i + c} type="button" onClick={() => set('btn_color', c)} aria-label={label || c} title={label || c} style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '50%', background: c || BRAND.red, border: isPicked ? '3px solid #fff' : '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', padding: 0, position: 'relative' }}>
                          {i === 0 && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 8, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>T</span>}
                        </button>
                      )
                    })}
                  </div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Button Text</label>
                  <input value={t.btn_text} onChange={e => set('btn_text', e.target.value.slice(0, 20))} placeholder="View Menu" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, marginBottom: 10, outline: 'none', fontFamily: 'inherit' }} />
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Effect</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 10 }}>
                    {[{ id: 'none', label: 'None' }, { id: 'glow', label: 'Glow' }, { id: 'shake', label: 'Shake' }, { id: 'signal', label: 'Signal' }, { id: 'heartbeat', label: 'Heart' }].map(opt => (
                      <button key={opt.id} onClick={() => set('btn_effect', opt.id)} style={{ padding: '8px 2px', borderRadius: 8, border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer', background: t.btn_effect === opt.id ? BRAND.red : 'rgba(255,255,255,0.06)', color: '#fff' }}>{opt.label}</button>
                    ))}
                  </div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Size ({t.btn_size}%)</label>
                  <input className="ds-slider" type="range" min="60" max="160" step="5" value={t.btn_size} onChange={e => set('btn_size', Number(e.target.value))} style={{ background: `linear-gradient(to right, ${BRAND.red} 0% ${((t.btn_size - 60) / 100) * 100}%, rgba(255,255,255,0.18) ${((t.btn_size - 60) / 100) * 100}% 100%)` }} />
                </>
              )}

              {configTool === 'text' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Hero Text & Tagline</div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Font</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                    {Object.keys(HERO_FONTS).map(f => (
                      <button key={f} onClick={() => set('hero_font', f)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: HERO_FONTS[f], background: t.hero_font === f ? BRAND.red : 'rgba(255,255,255,0.08)', color: '#fff' }}>{f}</button>
                    ))}
                  </div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Hero Color</label>
                  <input type="color" value={t.hero_color} onChange={e => set('hero_color', e.target.value)} style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', marginBottom: 10, cursor: 'pointer' }} />
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Tagline (Enter for line 2 — max 2 lines, 60 chars)</label>
                  <textarea value={t.tagline} onChange={e => set('tagline', e.target.value.split('\n').slice(0, 2).join('\n').slice(0, 60))} placeholder={"Line one\nLine two (optional)"} rows={2} maxLength={60} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, lineHeight: 1.4, outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                </>
              )}

              {configTool === 'cards' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Menu Cards & Banner Carousel</div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Card Style</label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                    {[{ id: 'horizontal', label: 'Horizontal' }, { id: 'grid', label: 'Grid' }, { id: 'fullwidth', label: 'Full Width' }].map(opt => (
                      <button key={opt.id} onClick={() => set('menu_card_style', opt.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: t.menu_card_style === opt.id ? BRAND.red : 'rgba(255,255,255,0.08)', color: '#fff' }}>{opt.label}</button>
                    ))}
                  </div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Banner URLs ({(t.menu_banners || []).length}/5)</label>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Wide landscape (recommended 1200 × 400). Auto-rotates every 4s.</div>
                  {(t.menu_banners || []).map((url, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <input value={url} onChange={e => set('menu_banners', t.menu_banners.map((u, j) => j === i ? e.target.value : u))} placeholder="https://..." style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                      <button onClick={() => set('menu_banners', t.menu_banners.filter((_, j) => j !== i))} style={{ width: 34, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                  {(t.menu_banners || []).length < 5 && (
                    <button type="button" onClick={() => set('menu_banners', [...(t.menu_banners || []), ''])} style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add banner URL</button>
                  )}
                </>
              )}

              {configTool === 'promo' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Promo Banner</div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Running Text</label>
                  <textarea value={t.promo_banner} onChange={e => set('promo_banner', e.target.value.slice(0, 300))} placeholder={"Free delivery this week!\nPress Enter for another promo"} rows={3} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, lineHeight: 1.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', minHeight: 80, marginBottom: 6 }} />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{t.promo_banner?.length || 0}/300 — lines join with " · "</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => set('promo_enabled', !t.promo_enabled)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: t.promo_enabled ? BRAND.red : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: t.promo_enabled ? 19 : 3, transition: 'left 0.2s' }} />
                    </button>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Enable</span>
                  </div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Effect</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {[
                      { id: 'scroll', label: 'Scroll' }, { id: 'wave', label: 'Wave' }, { id: 'glow', label: 'Glow' },
                      { id: 'pulse', label: 'Pulse' },   { id: 'fade', label: 'Fade' }, { id: 'shake', label: 'Shake' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => set('promo_effect', opt.id)} style={{ padding: '8px 4px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: t.promo_effect === opt.id ? BRAND.red : 'rgba(255,255,255,0.06)', color: '#fff' }}>{opt.label}</button>
                    ))}
                  </div>
                </>
              )}

              {configTool === 'splash' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Extra Features</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => set('splash_enabled', !t.splash_enabled)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: t.splash_enabled ? BRAND.red : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: t.splash_enabled ? 19 : 3, transition: 'left 0.2s' }} />
                    </button>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Splash Screen (2s branded loading)</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Save bar */}
        {savingMsg && <div style={{ margin: '0 14px 8px', padding: 10, borderRadius: 12, fontSize: 13, color: '#fff', background: savingMsg.includes('fail') ? 'rgba(239,68,68,0.15)' : BRAND.redGlow, border: savingMsg.includes('fail') ? '1px solid rgba(239,68,68,0.3)' : `1px solid ${BRAND.redBorder}`, textAlign: 'center' }}>{savingMsg}</div>}
        <div style={{ padding: '8px 14px calc(env(safe-area-inset-bottom, 0px) + 28px)' }}>
          <button onClick={handleSave} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: BRAND.red, color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>Save Changes</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
