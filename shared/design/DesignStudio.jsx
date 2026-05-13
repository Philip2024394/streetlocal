/**
 * DesignStudio — premium vendor design surface, ported from food-basic.
 *
 * Faithful reproduction of food-basic's surface so vendors can pick a
 * theme (fast & simple) OR open this studio for full control. Reusable
 * across food-basic / products-local / services-local — each host app
 * passes its own design state, theme, and per-theme categories.
 *
 * Props:
 *   - design          object with all design tokens (see DEFAULT_DESIGN below
 *                     for the full shape)
 *   - onChange(key, value)  fires per-control. Host persists.
 *   - vendor          { shopName, shopLogo, shopType, shopOpen, shopAddress }
 *   - bgUrl           background image url (theme bg)
 *   - accent          theme accent color
 *   - categories      [{ id, label, image? }] — per-theme categories for the
 *                     Cards tool's preview
 *   - appKind         'food' | 'products' | 'services'
 *   - onOpenHeroEditor () => void
 *   - onUploadImage    optional (file) => Promise<url>  — for menu banners
 *   - onClose         () => void
 */
import React, { useState, useEffect } from 'react'
import PhonePreview from './PhonePreview.jsx'

export const DEFAULT_DESIGN = {
  // Logo
  shopLogoStyle: 'circle', logoScale: 200, logoInner: 75, logoOffsetX: 0, logoOffsetY: 0,
  // Hero
  heroSize: 'normal', heroFont: 'system', heroColor: '#FFFFFF', heroSubColor: '', heroEffect: 'shadow',
  // Layout
  landingLayout: 'center', overlayOpacity: 40,
  // Button
  btnShape: 'rounded', btnColor: '', btnText: 'View Menu', btnSize: 100, btnEffect: 'none',
  // Text
  customTagline: '',
  // Cards
  menuCardStyle: 'horizontal', menuBanners: [],
  // Promo
  promoBanner: '', promoBannerEnabled: false, promoBannerEffect: 'scroll',
  // Splash
  splashEnabled: false,
}

const BTN_COLOR_SWATCHES = ['', '#FACC15', '#F59E0B', '#EF4444', '#DC2626', '#22C55E', '#10B981', '#3B82F6', '#A855F7', '#EC4899', '#000000', '#FFFFFF', '#84CC16', '#06B6D4']

export default function DesignStudio({
  design, onChange, vendor, bgUrl, accent = '#DC2626',
  categories = [], appKind = 'food',
  onOpenHeroEditor, onUploadImage, onClose,
}) {
  const d = { ...DEFAULT_DESIGN, ...(design || {}) }
  const [tool, setTool] = useState(null)               // null | 'layout' | 'button' | 'text' | 'cards' | 'promo' | 'splash'
  const [previewTab, setPreviewTab] = useState('landing')

  const isCustomAccent = false
  const set = (k, v) => onChange && onChange(k, v)

  // Auto-flip preview tab to match the open tool's preferred view.
  useEffect(() => {
    if (tool === 'cards' || tool === 'promo') setPreviewTab('menu')
    else if (tool) setPreviewTab('landing')
  }, [tool])

  const TOOLS = [
    { id: 'layout', label: 'Layout',  icon: '▦' },
    { id: 'button', label: 'Button',  icon: '⏺' },
    { id: 'text',   label: 'Text',    icon: 'T' },
    { id: 'cards',  label: 'Cards',   icon: '▤' },
    { id: 'promo',  label: 'Promo',   icon: '◐' },
    { id: 'splash', label: 'More',    icon: '★' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {bgUrl && <img src={bgUrl} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
          <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Design Studio</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Customise your app appearance</div>
          </div>
        </div>

        {/* ── Logo Style ─────────────────────────────────────────── */}
        <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Logo Style</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
            {[{ id: 'circle', label: 'Circle' }, { id: 'bare', label: 'No Circle' }, { id: 'off', label: 'Off' }].map(o => (
              <button key={o.id} onClick={() => set('shopLogoStyle', o.id)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                background: d.shopLogoStyle === o.id ? accent : 'rgba(255,255,255,0.08)',
                color: d.shopLogoStyle === o.id ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44,
              }}>{o.label}</button>
            ))}
          </div>
          {d.shopLogoStyle !== 'off' && (
            <>
              <Label>{d.shopLogoStyle === 'circle' ? 'Circle Size' : 'Logo Size'} ({d.logoScale}%)</Label>
              <Slider value={d.logoScale} min={50} max={300} step={10} onChange={(v) => set('logoScale', v)} />
              {d.shopLogoStyle === 'circle' && (
                <>
                  <Label>Logo Inside Circle ({d.logoInner}%)</Label>
                  <Slider value={d.logoInner} min={40} max={100} step={2} onChange={(v) => set('logoInner', v)} />
                  <Label>Logo Position</Label>
                  <LogoDpad x={d.logoOffsetX} y={d.logoOffsetY} onChange={(x, y) => { set('logoOffsetX', x); set('logoOffsetY', y) }} accent={accent} />
                </>
              )}
            </>
          )}
        </div>

        {/* ── Hero Text Editor link ─────────────────────────────── */}
        {onOpenHeroEditor && (
          <div style={{ margin: '0 14px 12px' }}>
            <button onClick={onOpenHeroEditor} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${accent}40`, background: 'rgba(0,0,0,0.65)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: accent, color: '#fff', fontWeight: 900, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>T</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Hero Text Editor</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Font, size, color, effects</div>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
            </button>
          </div>
        )}

        {/* ── Phone preview + tools ─────────────────────────────── */}
        <div style={{ margin: '0 14px 12px', padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 10 }}>
            <PhonePreview design={d} vendor={vendor} bgUrl={bgUrl} accent={accent} tab={previewTab} categories={categories} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TOOLS.map((t) => (
                <button key={t.id} onClick={() => setTool((cur) => cur === t.id ? null : t.id)} style={{
                  width: 64, padding: '10px 6px', borderRadius: 12,
                  background: tool === t.id ? accent : 'rgba(0,0,0,0.65)',
                  color: tool === t.id ? '#fff' : 'rgba(255,255,255,0.65)',
                  fontSize: 18, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  border: `1px solid ${tool === t.id ? accent : 'rgba(255,255,255,0.08)'}`,
                }}>
                  <span>{t.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tool body */}
          {tool === 'layout' && <ToolLayout d={d} set={set} accent={accent} />}
          {tool === 'button' && <ToolButton d={d} set={set} accent={accent} />}
          {tool === 'text'   && <ToolText   d={d} set={set} accent={accent} />}
          {tool === 'cards'  && <ToolCards  d={d} set={set} accent={accent} categories={categories} onUploadImage={onUploadImage} />}
          {tool === 'promo'  && <ToolPromo  d={d} set={set} accent={accent} />}
          {tool === 'splash' && <ToolSplash d={d} set={set} accent={accent} />}
        </div>
      </div>

      {/* Save bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 14px calc(12px + env(safe-area-inset-bottom,0))', background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7))', zIndex: 2 }}>
        <button onClick={onClose} style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'block', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>Save Changes</button>
      </div>
    </div>
  )
}

// ─── Tool bodies ─────────────────────────────────────────────────────────

function ToolLayout({ d, set, accent }) {
  return (
    <ToolCard title="Layout & Overlay" accent={accent}>
      <Label>Landing Layout</Label>
      <Row>
        <Pill active={d.landingLayout === 'center'} accent={accent} onClick={() => set('landingLayout', 'center')}>Center</Pill>
        <Pill active={d.landingLayout === 'footer'} accent={accent} onClick={() => set('landingLayout', 'footer')}>Footer</Pill>
      </Row>
      <Label style={{ marginTop: 14 }}>Overlay Darkness ({d.overlayOpacity}%)</Label>
      <Slider value={d.overlayOpacity} min={0} max={80} step={5} onChange={(v) => set('overlayOpacity', v)} />
    </ToolCard>
  )
}

function ToolButton({ d, set, accent }) {
  return (
    <ToolCard title="Button" accent={accent}>
      <Label>Shape</Label>
      <Row>
        <Pill active={d.btnShape === 'rounded'} accent={accent} onClick={() => set('btnShape', 'rounded')}>Rounded</Pill>
        <Pill active={d.btnShape === 'pill'}    accent={accent} onClick={() => set('btnShape', 'pill')}>Pill</Pill>
        <Pill active={d.btnShape === 'square'}  accent={accent} onClick={() => set('btnShape', 'square')}>Square</Pill>
      </Row>
      <Label style={{ marginTop: 14 }}>Color</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 6 }}>
        {BTN_COLOR_SWATCHES.map((c, i) => (
          <button key={i} onClick={() => set('btnColor', c)} style={{
            width: '100%', aspectRatio: '1', borderRadius: 6,
            border: d.btnColor === c ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.15)',
            background: c || `repeating-linear-gradient(45deg, ${accent}, ${accent} 4px, rgba(255,255,255,0.12) 4px, rgba(255,255,255,0.12) 8px)`,
            cursor: 'pointer', fontSize: 9, fontWeight: 900, color: c === '' ? '#fff' : (c === '#FFFFFF' ? '#000' : '#fff'),
          }}>{c === '' ? 'T' : ''}</button>
        ))}
      </div>
      <input type="text" value={d.btnColor || ''} onChange={(e) => set('btnColor', e.target.value)} placeholder="#HEX or blank = theme" style={inputStyle} />
      <Label style={{ marginTop: 14 }}>Button Text</Label>
      <input type="text" maxLength={20} value={d.btnText || ''} onChange={(e) => set('btnText', e.target.value)} placeholder="View Menu" style={inputStyle} />
      <Label style={{ marginTop: 14 }}>Effect</Label>
      <Row>
        {['none', 'glow', 'shake', 'signal', 'heartbeat'].map((e) => (
          <Pill key={e} active={d.btnEffect === e} accent={accent} onClick={() => set('btnEffect', e)}>{e[0].toUpperCase() + e.slice(1)}</Pill>
        ))}
      </Row>
      <Label style={{ marginTop: 14 }}>Size ({d.btnSize}%)</Label>
      <Slider value={d.btnSize} min={60} max={160} step={5} onChange={(v) => set('btnSize', v)} />
    </ToolCard>
  )
}

function ToolText({ d, set, accent }) {
  return (
    <ToolCard title="Custom Tagline" accent={accent}>
      <textarea maxLength={60} value={d.customTagline || ''} onChange={(e) => set('customTagline', e.target.value)} placeholder="Short tagline shown under the shop name" rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }} />
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Up to 60 chars · 2 lines</div>
    </ToolCard>
  )
}

function ToolCards({ d, set, accent, categories, onUploadImage }) {
  const banners = Array.isArray(d.menuBanners) ? d.menuBanners : []
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - banners.length)
    if (files.length === 0 || !onUploadImage) return
    const urls = []
    for (const file of files) {
      try { const url = await onUploadImage(file); if (url) urls.push(url) } catch {}
    }
    if (urls.length) set('menuBanners', [...banners, ...urls].slice(0, 5))
    e.target.value = ''
  }
  return (
    <ToolCard title="Menu Cards & Banners" accent={accent}>
      <Label>Card Style</Label>
      <Row>
        <Pill active={d.menuCardStyle === 'horizontal'} accent={accent} onClick={() => set('menuCardStyle', 'horizontal')}>Horizontal</Pill>
        <Pill active={d.menuCardStyle === 'grid'}       accent={accent} onClick={() => set('menuCardStyle', 'grid')}>Grid</Pill>
        <Pill active={d.menuCardStyle === 'fullwidth'}  accent={accent} onClick={() => set('menuCardStyle', 'fullwidth')}>Full Width</Pill>
      </Row>

      {categories.length > 0 && (
        <>
          <Label style={{ marginTop: 14 }}>This theme's categories ({categories.length})</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {categories.map((c) => (
              <span key={c.id} style={{ padding: '4px 10px', borderRadius: 10, background: `${accent}22`, border: `1px solid ${accent}55`, color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {c.label}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Change theme to switch categories</div>
        </>
      )}

      <Label style={{ marginTop: 14 }}>Menu Banners ({banners.length}/5)</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {banners.map((url, i) => (
          <div key={i} style={{ position: 'relative', aspectRatio: '3/1', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => set('menuBanners', banners.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, background: '#DC2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>×</button>
          </div>
        ))}
        {banners.length < 5 && onUploadImage && (
          <label style={{ aspectRatio: '3/1', borderRadius: 8, border: `2px dashed ${accent}55`, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: 20, fontWeight: 900, cursor: 'pointer' }}>
            +
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleUpload} />
          </label>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>1200×400px landscape, up to 5</div>
    </ToolCard>
  )
}

function ToolPromo({ d, set, accent }) {
  return (
    <ToolCard title="Promo Banner" accent={accent}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Enable promo banner</span>
        <Toggle on={!!d.promoBannerEnabled} accent={accent} onClick={() => set('promoBannerEnabled', !d.promoBannerEnabled)} />
      </div>
      <textarea maxLength={300} value={d.promoBanner || ''} onChange={(e) => set('promoBanner', e.target.value)} placeholder="Running promo text" rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }} />
      <Label style={{ marginTop: 12 }}>Effect</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
        {['scroll', 'wave', 'glow', 'pulse', 'fade', 'shake'].map((e) => (
          <Pill key={e} active={d.promoBannerEffect === e} accent={accent} onClick={() => set('promoBannerEffect', e)}>{e[0].toUpperCase() + e.slice(1)}</Pill>
        ))}
      </div>
    </ToolCard>
  )
}

function ToolSplash({ d, set, accent }) {
  return (
    <ToolCard title="Splash Screen" accent={accent}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Splash on launch</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>2-second branded loading screen</div>
        </div>
        <Toggle on={!!d.splashEnabled} accent={accent} onClick={() => set('splashEnabled', !d.splashEnabled)} />
      </div>
    </ToolCard>
  )
}

// ─── Reusable atoms ───────────────────────────────────────────────────────

function ToolCard({ title, accent, children }) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.65)', border: `1px solid ${accent}30` }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Label({ children, style }) {
  return <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6, ...style }}>{children}</label>
}

function Row({ children }) { return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div> }

function Pill({ active, accent, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
      background: active ? accent : 'rgba(255,255,255,0.08)',
      color: active ? '#fff' : 'rgba(255,255,255,0.65)',
      fontSize: 11, fontWeight: 800, cursor: 'pointer', minHeight: 38,
    }}>{children}</button>
  )
}

function Slider({ value, min, max, step, onChange }) {
  return <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', marginBottom: 10 }} />
}

function Toggle({ on, onClick, accent }) {
  return (
    <button onClick={onClick} style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: on ? accent : 'rgba(255,255,255,0.15)' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'left 0.18s' }} />
    </button>
  )
}

function LogoDpad({ x, y, onChange, accent }) {
  const step = 4
  const Btn = ({ children, onClick, bg = '#FACC15', color = '#000' }) => (
    <button onClick={onClick} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: bg, color, fontSize: 14, fontWeight: 900, cursor: 'pointer', minHeight: 34 }}>{children}</button>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, maxWidth: 160, marginBottom: 10 }}>
      <div /> <Btn onClick={() => onChange(x, Math.max(-40, y - step))}>↑</Btn> <div />
      <Btn onClick={() => onChange(Math.max(-40, x - step), y)}>←</Btn>
      <Btn onClick={() => onChange(0, 0)} bg="#DC2626" color="#fff">•</Btn>
      <Btn onClick={() => onChange(Math.min(40, x + step), y)}>→</Btn>
      <div /> <Btn onClick={() => onChange(x, Math.min(40, y + step))}>↓</Btn> <div />
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}
