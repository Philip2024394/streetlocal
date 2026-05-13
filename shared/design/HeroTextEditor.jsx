/**
 * HeroTextEditor — full-page modal for editing the hero/shop-name typography.
 *
 * Props:
 *   - design          { heroSize, heroFont, heroColor, heroSubColor, heroEffect }
 *   - shopName        for the preview
 *   - bgUrl           background image for the preview
 *   - accent          theme accent
 *   - onChange(key, value)  fires per-control
 *   - onClose         () => void
 */
import React from 'react'

const FONTS = [
  { id: 'system',   label: 'Default',     family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { id: 'nunito',   label: 'Rounded',     family: '"Nunito", sans-serif' },
  { id: 'poppins',  label: 'Bold',        family: '"Poppins", sans-serif' },
  { id: 'playfair', label: 'Elegant',     family: '"Playfair Display", serif' },
  { id: 'caveat',   label: 'Handwritten', family: '"Caveat", cursive' },
  { id: 'bebas',    label: 'Street',      family: '"Bebas Neue", sans-serif' },
]

const SIZES = [
  { id: 'normal', label: 'Normal' },
  { id: 'large',  label: 'Large' },
  { id: 'xl',     label: 'Extra Large' },
]

const EFFECTS = [
  { id: 'shadow',  label: 'Shadow' },
  { id: 'glow',    label: 'Glow' },
  { id: 'runGlow', label: 'Pulse Glow' },
  { id: 'outline', label: 'Outline' },
  { id: 'neon',    label: 'Neon' },
  { id: 'none',    label: 'None' },
]

const SWATCHES = [
  '#FFFFFF', '#000000', '#FACC15', '#F59E0B', '#EF4444', '#DC2626',
  '#22C55E', '#10B981', '#3B82F6', '#6366F1', '#A855F7', '#EC4899',
  '#F87171', '#FB923C', '#84CC16', '#06B6D4', '#8B5CF6', '#F472B6',
]

function previewStyle(design, accent) {
  const color = design.heroColor || '#fff'
  const size  = design.heroSize === 'xl' ? 30 : design.heroSize === 'large' ? 26 : 22
  const ff    = (FONTS.find((f) => f.id === design.heroFont) || FONTS[0]).family
  const base  = { color, fontFamily: ff, fontSize: size, fontWeight: 900, lineHeight: 1.05, letterSpacing: -0.5 }
  switch (design.heroEffect) {
    case 'glow':    return { ...base, textShadow: `0 0 8px ${color}, 0 0 18px ${color}55` }
    case 'runGlow': return { ...base, textShadow: `0 0 12px ${color}`, animation: 'heroPulseGlow 2.4s ease-in-out infinite' }
    case 'outline': return { ...base, color: 'transparent', WebkitTextStroke: `1.5px ${color}` }
    case 'neon':    return { ...base, textShadow: `0 0 4px #fff, 0 0 12px ${accent}, 0 0 20px ${accent}` }
    case 'none':    return base
    case 'shadow':
    default:        return { ...base, textShadow: '0 2px 8px rgba(0,0,0,0.7)' }
  }
}

export default function HeroTextEditor({ design = {}, shopName = '', bgUrl, accent = '#DC2626', onChange, onClose }) {
  const subColor = design.heroSubColor || 'rgba(255,255,255,0.7)'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes heroPulseGlow { 0%, 100% { text-shadow: 0 0 6px currentColor; } 50% { text-shadow: 0 0 18px currentColor, 0 0 28px currentColor; } }`}</style>

      {bgUrl && (
        <img src={bgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Hero Text Editor</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Font, size, color, effects</div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '0 14px 100px' }}>
        {/* Live preview */}
        <div style={{ padding: 24, margin: '0 0 14px', borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: `1px solid ${accent}30`, textAlign: 'center', minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={previewStyle(design, accent)}>{shopName || 'Your Shop'}</div>
          <div style={{ color: subColor, fontSize: 13, fontWeight: 600 }}>Live preview</div>
        </div>

        {/* Size */}
        <Section title="Size" accent={accent}>
          <Row>
            {SIZES.map((s) => (
              <Pill key={s.id} active={design.heroSize === s.id} accent={accent} onClick={() => onChange('heroSize', s.id)}>{s.label}</Pill>
            ))}
          </Row>
        </Section>

        {/* Font */}
        <Section title="Font" accent={accent}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {FONTS.map((f) => (
              <button key={f.id} onClick={() => onChange('heroFont', f.id)} style={{
                padding: '12px 8px', borderRadius: 10, border: 'none',
                background: design.heroFont === f.id ? accent : 'rgba(255,255,255,0.08)',
                color: design.heroFont === f.id ? '#fff' : 'rgba(255,255,255,0.7)',
                fontFamily: f.family, fontSize: 13, fontWeight: 800, cursor: 'pointer', minHeight: 44,
              }}>{f.label}</button>
            ))}
          </div>
        </Section>

        {/* Effect */}
        <Section title="Effect" accent={accent}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {EFFECTS.map((e) => (
              <Pill key={e.id} active={design.heroEffect === e.id} accent={accent} onClick={() => onChange('heroEffect', e.id)}>{e.label}</Pill>
            ))}
          </div>
        </Section>

        {/* Title color */}
        <Section title="Title Color" accent={accent}>
          <SwatchGrid value={design.heroColor || '#FFFFFF'} onChange={(v) => onChange('heroColor', v)} accent={accent} />
        </Section>

        {/* Sub color */}
        <Section title="Sub-text Color" accent={accent}>
          <SwatchGrid value={design.heroSubColor || ''} onChange={(v) => onChange('heroSubColor', v)} accent={accent} />
          <button onClick={() => onChange('heroSubColor', '')} style={{ marginTop: 8, fontSize: 12, color: accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Reset to auto</button>
        </Section>

        <button onClick={() => {
          onChange('heroSize', 'normal'); onChange('heroFont', 'system')
          onChange('heroColor', '#FFFFFF'); onChange('heroSubColor', '')
          onChange('heroEffect', 'shadow')
        }} style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 800, cursor: 'pointer', marginTop: 8 }}>
          Reset All
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '12px 14px calc(12px + env(safe-area-inset-bottom,0))', background: 'rgba(0,0,0,0.85)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onClose} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>Save Changes</button>
      </div>
    </div>
  )
}

function Section({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>
}

function Pill({ active, accent, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none',
      background: active ? accent : 'rgba(255,255,255,0.08)',
      color: active ? '#fff' : 'rgba(255,255,255,0.7)',
      fontSize: 12, fontWeight: 800, cursor: 'pointer', minHeight: 40,
    }}>{children}</button>
  )
}

function SwatchGrid({ value, onChange, accent }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 5, marginBottom: 8 }}>
        {SWATCHES.map((c) => (
          <button key={c} onClick={() => onChange(c)} style={{
            width: '100%', aspectRatio: '1', borderRadius: 6,
            border: value === c ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.15)',
            background: c, cursor: 'pointer',
          }} />
        ))}
      </div>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#FFFFFF" style={{
        width: '100%', padding: '10px 12px', borderRadius: 8,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
      }} />
    </>
  )
}
