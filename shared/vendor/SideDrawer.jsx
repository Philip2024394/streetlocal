/**
 * SideDrawer — vendor control drawer ported from food-basic's pattern.
 *
 * Generic so food-basic, products-local, services-local all use the same
 * surface. Each host app passes its own tile list because the available
 * pages differ per app (e.g. food has "Order Channels", products has
 * "Themes & Categories", etc.).
 *
 * Props:
 *   - open              boolean — controls visibility
 *   - onClose           () => void
 *   - vendor            { shopName, shopLogo, shopType, shopOpen }
 *   - onToggleOpen      () => void — flips shopOpen
 *   - onPreviewAsCustomer  optional () => void — "Preview as Customer →" link
 *   - tiles             [{ id, icon, label, desc, onClick, badge? }]
 *   - designStudioTile  optional [{ icon, label, desc, onClick }] — rendered
 *                       as the hero tile under the standard tiles
 *   - accent            brand color
 */
import React from 'react'

const ICON_INVERT = { filter: 'brightness(0) invert(1)' }

export default function SideDrawer({
  open, onClose, vendor, onToggleOpen, onPreviewAsCustomer,
  tiles = [], designStudioTile = null, accent = '#DC2626',
}) {
  if (!open) return null
  const { shopName, shopLogo, shopType, shopOpen } = vendor || {}

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9990,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 'min(340px, 92vw)', background: '#0a0a0a',
        borderLeft: `1px solid ${accent}33`,
        overflowY: 'auto', padding: '14px 0 24px',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.6)',
      }}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ padding: '12px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {shopLogo && (
            <img src={shopLogo} alt=""
              style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover', background: accent, flexShrink: 0 }} />
          )}
          {!shopLogo && (
            <div style={{ width: 44, height: 44, borderRadius: 22, background: accent, color: '#fff', fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {(shopName || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shopName || 'Your Shop'}</div>
            {shopType && <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginTop: 1 }}>{shopType}</div>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>✕</button>
        </div>

        {/* ── Shop status toggle ────────────────────────────────────── */}
        {typeof shopOpen === 'boolean' && onToggleOpen && (
          <div style={{ margin: '0 16px 12px', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: shopOpen ? '#22c55e' : '#EF4444' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: shopOpen ? '#22c55e' : '#EF4444' }}>{shopOpen ? 'Shop Open' : 'Shop Closed'}</span>
              </div>
              <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{shopOpen ? 'Accepting orders' : 'Orders paused'}</span>
            </div>
            <button onClick={onToggleOpen} style={{
              width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: shopOpen ? accent : 'rgba(255,255,255,0.15)', position: 'relative', padding: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2, left: shopOpen ? 22 : 2,
                width: 22, height: 22, borderRadius: 11, background: '#fff',
                transition: 'left 0.18s',
              }} />
            </button>
          </div>
        )}

        {/* ── Preview as Customer ────────────────────────────────────── */}
        {onPreviewAsCustomer && (
          <div style={{ padding: '0 16px 12px', textAlign: 'center' }}>
            <button onClick={onPreviewAsCustomer} style={{ background: 'none', border: 'none', color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 4 }}>
              Preview as Customer →
            </button>
          </div>
        )}

        {/* ── Standard tiles ─────────────────────────────────────────── */}
        <div style={{ padding: '0 16px' }}>
          {tiles.map((t) => (
            <button key={t.id} onClick={t.onClick} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '14px 16px', borderRadius: 14,
              border: `1.5px solid ${accent}`, background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              cursor: 'pointer', textAlign: 'left', marginBottom: 8, minHeight: 44,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', flexShrink: 0 }}>
                <span style={typeof t.icon === 'string' && t.icon.length <= 4 ? {} : ICON_INVERT}>{t.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{t.label}</div>
                {t.desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{t.desc}</div>}
              </div>
              {t.badge ? (
                <span style={{ minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>
              ) : null}
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
            </button>
          ))}
        </div>

        {/* ── Design Studio hero tile ─────────────────────────────── */}
        {designStudioTile && (
          <div style={{ padding: '4px 16px 12px' }}>
            <button onClick={designStudioTile.onClick} style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              border: `1.5px solid ${accent}`, background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                <span style={typeof designStudioTile.icon === 'string' && designStudioTile.icon.length <= 4 ? {} : ICON_INVERT}>{designStudioTile.icon || '🎨'}</span>
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{designStudioTile.label || 'Design Studio'}</div>
                {designStudioTile.desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{designStudioTile.desc}</div>}
              </div>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
