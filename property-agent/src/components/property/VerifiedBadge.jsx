/**
 * VerifiedBadge — Badge component for listing verification status.
 * Types: verified, premium, trusted, new
 * Sizes: sm, md, lg
 */

const CONFIG = {
  verified: { icon: '✓', label: 'Verified', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', color: '#60A5FA', glow: '0 0 8px rgba(96,165,250,0.3)' },
  premium:  { icon: '★', label: 'Premium', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.3)', color: '#FACC15', glow: '0 0 8px rgba(250,204,21,0.3)' },
  trusted:  { icon: '🛡', label: 'Trusted Owner', bg: 'rgba(141,198,63,0.12)', border: 'rgba(141,198,63,0.3)', color: '#8DC63F', glow: '0 0 8px rgba(141,198,63,0.3)' },
  new:      { icon: '●', label: 'New Listing', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', color: '#F97316', glow: '0 0 8px rgba(249,115,22,0.3)' },
}

const SIZES = {
  sm: { fontSize: 10, padding: '2px 8px', gap: 3, iconSize: 10 },
  md: { fontSize: 12, padding: '4px 12px', gap: 4, iconSize: 12 },
  lg: { fontSize: 14, padding: '6px 16px', gap: 5, iconSize: 14 },
}

export default function VerifiedBadge({ type = 'verified', size = 'md' }) {
  const cfg = CONFIG[type] || CONFIG.verified
  const sz = SIZES[size] || SIZES.md

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: sz.gap,
      padding: sz.padding, borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: sz.fontSize, fontWeight: 800,
      fontFamily: 'inherit', whiteSpace: 'nowrap',
      boxShadow: cfg.glow, lineHeight: 1,
    }}>
      <span style={{ fontSize: sz.iconSize }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}
