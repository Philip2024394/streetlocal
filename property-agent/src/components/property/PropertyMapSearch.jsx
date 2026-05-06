/**
 * PropertyMapSearch — Map-based property search overlay using OpenStreetMap tiles.
 * Shows property listings as colored pins on a tile grid with mini card popups.
 *
 * Props: { open, onClose, listings, onSelect }
 */
import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'

const CITIES = [
  { name: 'Yogyakarta', z: 13, x: 4104, y: 2648 },
  { name: 'Bali', z: 13, x: 4141, y: 2660 },
  { name: 'Jakarta', z: 13, x: 4090, y: 2641 },
  { name: 'Surabaya', z: 13, x: 4121, y: 2646 },
  { name: 'Bandung', z: 13, x: 4096, y: 2645 },
]

const PROPERTY_TYPES = ['All', 'House', 'Villa', 'Kos', 'Factory']

const TILE_URL = 'https://tile.openstreetmap.org'

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
}

// Pseudo-random position based on index and a seed
function pinPosition(index, total) {
  const goldenAngle = 137.508
  const r = 0.15 + 0.6 * Math.sqrt((index + 1) / (total + 1))
  const theta = (index * goldenAngle * Math.PI) / 180
  const x = 50 + r * 40 * Math.cos(theta)
  const y = 50 + r * 40 * Math.sin(theta)
  return {
    left: `${Math.max(8, Math.min(92, x))}%`,
    top: `${Math.max(8, Math.min(92, y))}%`,
  }
}

function formatPrice(price) {
  if (!price && price !== 0) return 'Contact'
  if (price >= 1_000_000_000) return `Rp ${(price / 1_000_000_000).toFixed(1)}B`
  if (price >= 1_000_000) return `Rp ${(price / 1_000_000).toFixed(0)}M`
  if (price >= 1_000) return `Rp ${(price / 1_000).toFixed(0)}K`
  return `Rp ${price}`
}

export default function PropertyMapSearch({ open, onClose, listings = [], onSelect }) {
  const [cityIdx, setCityIdx] = useState(0)
  const [selectedPin, setSelectedPin] = useState(null)
  const [typeFilter, setTypeFilter] = useState('All')

  const city = CITIES[cityIdx]

  const filtered = useMemo(() => {
    if (typeFilter === 'All') return listings
    return listings.filter((l) => {
      const t = (l.type || l.propertyType || '').toLowerCase()
      return t.includes(typeFilter.toLowerCase())
    })
  }, [listings, typeFilter])

  const handlePinClick = useCallback((idx) => {
    setSelectedPin((prev) => (prev === idx ? null : idx))
  }, [])

  const handleView = useCallback(
    (listing) => {
      onSelect?.(listing)
      onClose?.()
    },
    [onSelect, onClose]
  )

  if (!open) return null

  // Build 3x3 tile grid starting from city center tile
  const tiles = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push({
        x: city.x + dx,
        y: city.y + dy,
        key: `${dx}_${dy}`,
      })
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9600, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ ...glass, borderRadius: 0, flexShrink: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🗺️</span>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Map Search</h1>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={cityIdx}
            onChange={(e) => { setCityIdx(Number(e.target.value)); setSelectedPin(null) }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              appearance: 'auto',
            }}
          >
            {CITIES.map((c, i) => (
              <option key={c.name} value={i} style={{ background: '#1a1a1a', color: '#fff' }}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Tile Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          filter: 'brightness(0.35) contrast(1.1) saturate(0.3)',
        }}>
          {tiles.map((t) => (
            <img
              key={t.key}
              src={`${TILE_URL}/${city.z}/${t.x}/${t.y}.png`}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              draggable={false}
            />
          ))}
        </div>

        {/* Dark overlay on map */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.3)', pointerEvents: 'none' }} />

        {/* City Label */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', ...glass, borderRadius: 10, padding: '6px 14px', zIndex: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>📍 {city.name}</span>
        </div>

        {/* Property Pins */}
        {filtered.map((listing, i) => {
          const pos = pinPosition(i, filtered.length)
          const isRent = (listing.listingType || listing.type || '').toLowerCase().includes('rent')
          const pinColor = isRent ? '#8DC63F' : '#FACC15'
          const isSelected = selectedPin === i

          return (
            <div key={listing.id || i} style={{ position: 'absolute', ...pos, transform: 'translate(-50%, -50%)', zIndex: isSelected ? 8 : 3 }}>
              {/* Pin dot */}
              <button
                onClick={() => handlePinClick(i)}
                style={{
                  width: isSelected ? 20 : 14,
                  height: isSelected ? 20 : 14,
                  borderRadius: '50%',
                  background: pinColor,
                  border: `2px solid ${isSelected ? '#fff' : 'rgba(0,0,0,0.4)'}`,
                  boxShadow: `0 0 ${isSelected ? 12 : 6}px ${pinColor}80`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
                aria-label={`View ${listing.title || 'property'}`}
              />

              {/* Mini Card Popup */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  bottom: 28,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 220,
                  background: 'rgba(20,20,20,0.95)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}>
                  {/* Image */}
                  {listing.image || listing.images?.[0] ? (
                    <div style={{ width: '100%', height: 100, overflow: 'hidden' }}>
                      <img
                        src={listing.image || listing.images[0]}
                        alt={listing.title || ''}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 60, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 28 }}>🏠</span>
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {listing.title || 'Property Listing'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15', marginBottom: 6 }}>
                      {formatPrice(listing.price)}
                      {isRent && <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>/mo</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      {(listing.bedrooms !== undefined || listing.beds !== undefined) && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                          🛏️ {listing.bedrooms ?? listing.beds ?? 0}
                        </span>
                      )}
                      {(listing.bathrooms !== undefined || listing.baths !== undefined) && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                          🚿 {listing.bathrooms ?? listing.baths ?? 0}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleView(listing)}
                      style={{
                        width: '100%',
                        padding: '8px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: '#8DC63F',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      View
                    </button>
                  </div>

                  {/* Arrow pointer */}
                  <div style={{
                    position: 'absolute',
                    bottom: -6,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: 12,
                    height: 12,
                    background: 'rgba(20,20,20,0.95)',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                  }} />
                </div>
              )}
            </div>
          )
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
            <div style={{ ...glass, borderRadius: 16, padding: '24px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏘️</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>No properties found</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Try a different filter or city</div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 70, right: 12, ...glass, borderRadius: 10, padding: '8px 12px', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FACC15' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Sale</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Rent</span>
          </div>
        </div>

        {/* Tap-to-dismiss overlay for selected pin */}
        {selectedPin !== null && (
          <div
            onClick={() => setSelectedPin(null)}
            style={{ position: 'absolute', inset: 0, zIndex: 2 }}
          />
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ ...glass, borderRadius: 0, flexShrink: 0, padding: '12px 16px', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setSelectedPin(null) }}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: typeFilter === t ? '1.5px solid #8DC63F' : '1px solid rgba(255,255,255,0.1)',
                background: typeFilter === t ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                color: typeFilter === t ? '#8DC63F' : 'rgba(255,255,255,0.6)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t === 'All' && '🏘️ '}
              {t === 'House' && '🏠 '}
              {t === 'Villa' && '🏡 '}
              {t === 'Kos' && '🏢 '}
              {t === 'Factory' && '🏭 '}
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
