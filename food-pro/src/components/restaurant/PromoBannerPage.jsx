/**
 * PromoBannerPage — all vendor promotional banners + promo codes
 * Shows paid banner ads from all vendors + platform promo codes
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { getPromoBanners } from '@/services/promoCodeService'

// All vendor promotional banners (same data that was on cuisine page)
const VENDOR_BANNERS = [
  { id: 'vb1', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2024,%202026,%2006_22_44%20PM.png', title: 'Warung Bu Sari', promo: '15% OFF Gudeg', color: '#8DC63F', restaurantId: 1 },
  { id: 'vb2', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2025,%202026,%2004_22_55%20AM.png', title: 'Seafood Pak Dhe Bejo', promo: 'Free Juice Today', color: '#8DC63F', restaurantId: 7 },
  { id: 'vb3', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2025,%202026,%2004_22_09%20AM.png', title: 'Ayam Geprek Mbak Rina', promo: 'Free French Fries', color: '#FACC15', restaurantId: 3 },
  { id: 'vb4', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600', title: 'Kopi Klotok Maguwo', promo: 'Happy Hour 3-5pm', color: '#FACC15', restaurantId: 9 },
]

export default function PromoBannerPage({ onClose, onApplyCode, onOpenRestaurant }) {
  const promoCodes = getPromoBanners()
  const [copiedCode, setCopiedCode] = useState(null)
  const [tab, setTab] = useState('banners') // 'banners' | 'codes'

  // Load vendor-purchased banners from localStorage
  const vendorBanners = (() => {
    try {
      const all = JSON.parse(localStorage.getItem('indoo_vendor_banners') || '[]')
      const active = all.filter(b => b.status === 'active' && new Date(b.expires_at) > new Date())
      return active
    } catch { return [] }
  })()

  const allBanners = [...vendorBanners.map(b => ({ id: b.id, image: b.template_img, title: b.restaurant_name, promo: b.promo_text, color: '#8DC63F' })), ...VENDOR_BANNERS]

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9950,
      backgroundColor: '#000',
      backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2020,%202026,%2011_03_28%20PM.png?updatedAt=1776701026914)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', isolation: 'isolate',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        position: 'relative', zIndex: 1,
      }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>Promotions</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{allBanners.length} active promotions</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => setTab('banners')} style={{ flex: 1, padding: '10px', borderRadius: 12, backgroundColor: tab === 'banners' ? '#8DC63F' : 'rgba(255,255,255,0.06)', border: 'none', color: tab === 'banners' ? '#000' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
          Vendor Deals
        </button>
        <button onClick={() => setTab('codes')} style={{ flex: 1, padding: '10px', borderRadius: 12, backgroundColor: tab === 'codes' ? '#FACC15' : 'rgba(255,255,255,0.06)', border: 'none', color: tab === 'codes' ? '#000' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
          Promo Codes
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px', position: 'relative', zIndex: 1 }}>

        {/* Vendor banners */}
        {tab === 'banners' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {allBanners.map(banner => (
              <button key={banner.id} onClick={() => onOpenRestaurant?.(banner.restaurantId)} style={{
                borderRadius: 20, overflow: 'hidden', position: 'relative', height: 160,
                border: `1.5px solid ${banner.color}33`, width: '100%', padding: 0, background: 'none', cursor: 'pointer', display: 'block',
              }}>
                <img src={banner.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%, ${banner.color}11 100%)` }} />
                <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{banner.title}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: banner.color }}>{banner.promo}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Promo codes */}
        {tab === 'codes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {promoCodes.map(banner => (
              <div key={banner.id} style={{
                borderRadius: 20, overflow: 'hidden', position: 'relative',
                border: `1.5px solid ${banner.color}33`, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
              }}>
                <div style={{ height: 120, position: 'relative', overflow: 'hidden' }}>
                  <img src={banner.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, #0a0a0a 0%, transparent 60%)` }} />
                </div>
                <div style={{ padding: '12px 16px 16px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>{banner.title}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 12px' }}>{banner.subtitle}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.15)', textAlign: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: banner.color, letterSpacing: '0.08em' }}>{banner.code}</span>
                    </div>
                    <button onClick={() => { navigator.clipboard?.writeText(banner.code); setCopiedCode(banner.code); setTimeout(() => setCopiedCode(null), 2000) }} style={{ padding: '8px 14px', borderRadius: 10, backgroundColor: copiedCode === banner.code ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copiedCode === banner.code ? '#8DC63F' : 'rgba(255,255,255,0.1)'}`, color: copiedCode === banner.code ? '#8DC63F' : '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      {copiedCode === banner.code ? 'Copied!' : 'Copy'}
                    </button>
                    {onApplyCode && (
                      <button onClick={() => onApplyCode(banner.code)} style={{ padding: '8px 14px', borderRadius: 10, backgroundColor: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Apply</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
