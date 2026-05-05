/**
 * SellerDealsDrawer — Slides from the left showing all deals by a seller.
 * Reads from localStorage `indoo_public_deals` filtered by seller_id.
 *
 * Props: { open, onClose, sellerId, sellerName, onSelectDeal }
 */
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

// ── helpers ──────────────────────────────────────────────

function formatRp(n) {
  return `Rp${Number(n).toLocaleString('id-ID')}`
}

const MOCK_SELLER_DEALS = [
  { id: 'sd1', title: 'Nasi Goreng Spesial', domain: 'food', sub: 'Nasi goreng kampung dengan telur mata sapi', deal_price: 19000, original_price: 35000, quantity_available: 50, quantity_claimed: 38, images: ['https://picsum.photos/seed/nasgor/1080/1920'], active: true, status: 'active', end_time: Date.now() + 3 * 3600000, seller_id: 'demo', seller_name: 'Warung Bu Sari', seller_photo: 'https://i.pravatar.cc/80?img=1', seller_rating: 4.8, city: 'Yogyakarta' },
  { id: 'sd2', title: 'Mie Goreng Jawa', domain: 'food', sub: 'Mie goreng dengan bumbu khas Jawa', deal_price: 22000, original_price: 30000, quantity_available: 30, quantity_claimed: 12, images: ['https://picsum.photos/seed/miegoreng/1080/1920'], active: true, status: 'active', end_time: Date.now() + 5 * 3600000, seller_id: 'demo', seller_name: 'Warung Bu Sari', seller_photo: 'https://i.pravatar.cc/80?img=1', seller_rating: 4.8, city: 'Yogyakarta' },
  { id: 'sd3', title: 'Ayam Penyet Sambal', domain: 'food', sub: 'Ayam penyet sambal terasi pedas', deal_price: 18000, original_price: 28000, quantity_available: 25, quantity_claimed: 8, images: ['https://picsum.photos/seed/ayampenyet/1080/1920'], active: true, status: 'active', end_time: Date.now() + 2 * 3600000, seller_id: 'demo', seller_name: 'Warung Bu Sari', seller_photo: 'https://i.pravatar.cc/80?img=1', seller_rating: 4.8, city: 'Yogyakarta' },
  { id: 'sd4', title: 'Es Teh Manis Jumbo', domain: 'food', sub: 'Es teh manis segar ukuran jumbo', deal_price: 3000, original_price: 5000, quantity_available: 100, quantity_claimed: 90, images: ['https://picsum.photos/seed/esteh/1080/1920'], active: false, status: 'expired', end_time: Date.now() - 2 * 86400000, updated_at: new Date(Date.now() - 2 * 86400000).toISOString(), seller_id: 'demo', seller_name: 'Warung Bu Sari', seller_photo: 'https://i.pravatar.cc/80?img=1', seller_rating: 4.8, city: 'Yogyakarta' },
  { id: 'sd5', title: 'Soto Ayam Lamongan', domain: 'food', sub: 'Soto ayam kuah bening khas Lamongan', deal_price: 15000, original_price: 25000, quantity_available: 40, quantity_claimed: 35, images: ['https://picsum.photos/seed/sotoayam/1080/1920'], active: false, status: 'expired', end_time: Date.now() - 3 * 86400000, updated_at: new Date(Date.now() - 3 * 86400000).toISOString(), seller_id: 'demo', seller_name: 'Warung Bu Sari', seller_photo: 'https://i.pravatar.cc/80?img=1', seller_rating: 4.8, city: 'Yogyakarta' },
]

function isWithinLastWeek(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  return now - d.getTime() <= weekMs
}

// ── keyframes (injected once) ────────────────────────────

let injected = false
function injectKeyframes() {
  if (injected) return
  injected = true
  const sheet = document.createElement('style')
  sheet.textContent = `
    @keyframes sellerDrawerSlideRight {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
    @keyframes sellerDrawerFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes sellerDrawerEdgeGlow {
      0%   { top: -60px; }
      100% { top: 100%; }
    }
  `
  document.head.appendChild(sheet)
}

// ── Time remaining helper ────────────────────────────────
function getTimeRemaining(endTime) {
  if (!endTime) return null
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ── Landscape DealCard ──────────────────────────────────

function DealCard({ deal, expired, onSelect, onActivate }) {
  const photo = deal.images?.[0] || deal.image || deal.photo || null
  const title = deal.title || 'Untitled Deal'
  const dealPrice = deal.deal_price || deal.dealPrice || 0
  const originalPrice = deal.original_price || deal.originalPrice || 0
  const discount = originalPrice > 0 ? Math.round((1 - dealPrice / originalPrice) * 100) : (deal.discount || 0)
  const endTime = deal.end_time || deal.endTime || null
  const timeLeft = !expired ? getTimeRemaining(endTime) : null

  return (
    <div onClick={() => expired ? onActivate?.(deal) : onSelect?.(deal)} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, marginBottom: 10, opacity: expired ? 0.7 : 1, position: 'relative', cursor: 'pointer' }}>
      {/* Photo */}
      <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'rgba(255,255,255,0.04)' }}>
        {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'rgba(255,255,255,0.15)' }}>🏷️</div>}
        {discount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, background: '#FACC15', color: '#000', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 6 }}>-{discount}%</span>}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#8DC63F' }}>{formatRp(dealPrice)}</span>
            {originalPrice > 0 && originalPrice !== dealPrice && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{formatRp(originalPrice)}</span>}
          </div>
          {timeLeft && <span style={{ fontSize: 10, fontWeight: 700, color: '#FACC15', marginTop: 4, display: 'block' }}>⏱ {timeLeft} remaining</span>}
          {expired && <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', marginTop: 4, display: 'block' }}>Expired</span>}
        </div>

        {/* Action button */}
        {expired ? (
          <button onClick={(e) => { e.stopPropagation(); onActivate?.(deal) }} style={{ marginTop: 6, padding: '6px 12px', borderRadius: 8, background: '#FACC15', border: 'none', color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer', alignSelf: 'flex-start', animation: 'locationShake 4s ease-in-out infinite' }}>
            🔥 REQUEST DEAL
          </button>
        ) : (
          <button onClick={() => onSelect?.(deal)} style={{ marginTop: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 11, fontWeight: 900, cursor: 'pointer', alignSelf: 'flex-start' }}>
            View Deal
          </button>
        )}
      </div>
    </div>
  )
}

// ── Section header ───────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.7)',
        padding: '16px 0 8px',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </div>
  )
}

// ── Main component ───────────────────────────────────────

export { MOCK_SELLER_DEALS }

export default function SellerDealsDrawer({ open, onClose, sellerId, sellerName, onSelectDeal, onRequestDeal }) {
  const [visible, setVisible] = useState(false)
  const [activatePopup, setActivatePopup] = useState(null) // deal to activate

  const handleActivateDeal = (deal) => setActivatePopup(deal)
  const handleConfirmActivate = () => {
    if (!activatePopup) return
    setActivatePopup(null)
    onRequestDeal?.(activatePopup)
  }

  useEffect(() => {
    injectKeyframes()
  }, [])

  useEffect(() => {
    if (open) setVisible(true)
  }, [open])

  // Read deals from localStorage
  const { activeDeals, weekDeals } = useMemo(() => {
    if (!open || !sellerId) return { activeDeals: [], weekDeals: [] }

    let allDeals = []
    try {
      const raw = localStorage.getItem('indoo_public_deals')
      if (raw) allDeals = JSON.parse(raw)
    } catch { /* ignore */ }

    if (!Array.isArray(allDeals)) allDeals = []

    // Merge with mock deals for demo
    const combined = [...allDeals]
    MOCK_SELLER_DEALS.forEach(d => {
      if (!combined.some(c => c.id === d.id)) combined.push(d)
    })

    const sellerDeals = combined.filter(
      (d) => d.seller_id === sellerId || d.sellerId === sellerId || sellerId === 'demo'
    )

    const active = sellerDeals.filter((d) => d.active === true || d.status === 'active')
    const expired = sellerDeals
      .filter((d) => {
        const isInactive = d.active === false || d.status === 'expired' || d.status === 'paused'
        const endDate = d.endTime || d.end_time || d.updated_at
        return isInactive && isWithinLastWeek(endDate)
      })

    return { activeDeals: active, weekDeals: expired }
  }, [open, sellerId])

  if (!visible) return null

  const handleAnimEnd = () => {
    if (!open) setVisible(false)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        animation: open
          ? 'sellerDrawerFadeIn 0.25s ease-out forwards'
          : 'sellerDrawerFadeIn 0.2s ease-in reverse forwards',
      }}
      onAnimationEnd={handleAnimEnd}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '80%',
          maxWidth: 400,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          animation: open
            ? 'sellerDrawerSlideRight 0.3s cubic-bezier(0.22,1,0.36,1) forwards'
            : 'sellerDrawerSlideRight 0.25s ease-in reverse forwards',
          overflow: 'hidden',
          borderRight: '3px solid rgba(141,198,63,0.3)',
        }}
      >
        {/* Green running light on right edge */}
        <div style={{ position: 'absolute', top: 0, right: -3, width: 3, height: '100%', overflow: 'hidden', zIndex: 1 }}>
          <div style={{ position: 'absolute', width: '100%', height: 60, background: 'linear-gradient(180deg, transparent, #8DC63F, transparent)', animation: 'sellerDrawerEdgeGlow 3s linear infinite' }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
            {sellerName ? `${sellerName} Deals` : 'Seller Deals'}
          </div>
          <button
            onClick={onClose}
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 18,
              lineHeight: 1,
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="Close seller deals drawer"
          >
            &#10005;
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 14px 24px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Active Deals */}
          <SectionHeader label={`🟢 Live Deals (${activeDeals.length})`} />
          {activeDeals.length > 0 ? (
            <div>
              {activeDeals.map((deal, i) => (
                <DealCard key={deal.id || i} deal={deal} expired={false} onSelect={onSelectDeal} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', padding: '12px 0' }}>No active deals right now</div>
          )}

          {/* This Week */}
          <SectionHeader label={`📅 This Week (${weekDeals.length})`} />
          {weekDeals.length > 0 ? (
            <div>
              {weekDeals.map((deal, i) => (
                <DealCard key={deal.id || i} deal={deal} expired={true} onSelect={onSelectDeal} onActivate={handleActivateDeal} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', padding: '12px 0' }}>No deals this week</div>
          )}
        </div>
      </div>

      {/* Activate Deal Popup */}
      {activatePopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '85%', maxWidth: 320, borderRadius: 24, background: 'rgba(10,10,10,0.95)', border: '1.5px solid rgba(250,204,21,0.3)', padding: 24, textAlign: 'center' }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🔥</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 6 }}>Request This Deal?</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 12 }}>{activatePopup.title}</span>
            <span style={{ fontSize: 13, color: '#FACC15', fontWeight: 700, display: 'block', marginBottom: 16 }}>This deal has expired. Send a request to the seller — if they can reactivate it for you, they'll respond in chat.</span>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F' }}>{formatRp(activatePopup.deal_price || activatePopup.dealPrice || 0)}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{formatRp(activatePopup.original_price || activatePopup.originalPrice || 0)}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setActivatePopup(null)} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleConfirmActivate} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#FACC15', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Send Request 🔥</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
