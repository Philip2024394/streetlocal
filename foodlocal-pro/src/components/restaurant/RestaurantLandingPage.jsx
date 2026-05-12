/**
 * RestaurantLandingPage — Beautiful welcome page for individual restaurants.
 * Indonesian wood-themed design. Shows before the menu.
 */
import { useState } from 'react'
import imgError from '../../imgFallback'

function fmtRp(n) { return 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.') }

export default function RestaurantLandingPage({ restaurant, onViewMenu, onSelectDish, onBack }) {
  const r = restaurant || {}
  const menuItems = r.menu_items || []
  const [dealsOpen, setDealsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [visitOpen, setVisitOpen] = useState(false)
  const [dealIdx, setDealIdx] = useState(0)
  const [previewDish, setPreviewDish] = useState(null)

  // Group menu items by category
  const categories = {}
  menuItems.filter(i => i.is_available !== false).forEach(item => {
    const cat = item.category || 'Main'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(item)
  })

  // Generate deals from menu items (20% discount on items with photos)
  const dealItems = menuItems.filter(i => i.photo_url).slice(0, 6).map(i => ({
    ...i,
    dealPrice: Math.round(i.price * 0.8),
    discount: 20,
  }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 130, background: '#1a0e04', overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* ═══ FULL SCREEN — single page, no scroll ═══ */}
      <section style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 24px 40px' }}>
        {/* Background */}
        <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-3-2026-11_54_05-am.png" alt="" onError={imgError('banner')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,14,4,0.95) 0%, rgba(26,14,4,0.6) 40%, rgba(26,14,4,0.3) 70%, rgba(26,14,4,0.1) 100%)', zIndex: 1 }} />

        {/* Back button */}
        <button onClick={onBack} style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', left: 16, zIndex: 10,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>

        {/* Right floating panel — Menu, Deals, Share, Save */}
        <div style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {[
            { label: 'Menu', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>, action: () => setMenuOpen(true) },
            { label: 'Deals', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, action: () => setDealsOpen(true) },
            { label: 'Share', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>, action: () => navigator.share?.({ title: r.name, text: `Check out ${r.name} on FoodLocal Pro` }).catch(() => {}) },
            { label: 'Save', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, action: () => {} },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 0', background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
            }}>
              {item.icon}
              <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)', fontWeight: 600, marginBottom: 4, letterSpacing: '1px' }}>Welcome to</p>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#f5e6d0', margin: '0 0 12px', lineHeight: 1.05, fontFamily: '"Georgia", serif' }}>
            {r.name || 'Our Restaurant'}
          </h1>
          <div style={{ width: 60, height: 2, background: 'rgba(210,180,140,0.4)', marginBottom: 14 }} />
          <p style={{ fontSize: 15, color: 'rgba(210,180,140,0.6)', margin: '0 0 24px', maxWidth: 280, lineHeight: 1.5 }}>
            {r.description || 'Where authentic flavors meet the beauty of nature.'}
          </p>

          {/* Rating + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {r.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#FACC15', fontSize: 16 }}>★</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#f5e6d0' }}>{r.rating}</span>
              </div>
            )}
            <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: r.is_open !== false ? 'rgba(141,198,63,0.2)' : 'rgba(239,68,68,0.2)', color: r.is_open !== false ? '#8DC63F' : '#EF4444' }}>
              {r.is_open !== false ? 'Open Now' : 'Closed'}
            </span>
            {r.cuisine_type && <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.5)' }}>{r.cuisine_type}</span>}
          </div>

          {/* Visit Us Button */}
          <button onClick={() => setVisitOpen(true)} style={{
            padding: '14px 32px', borderRadius: 12, border: 'none',
            background: '#000',
            color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer',
            fontFamily: '"Georgia", serif', letterSpacing: '1px',
          }}>
            Visit Us
          </button>
        </div>
      </section>

      {/* ═══ VISIT US PAGE ═══ */}
      {visitOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#1a0e04', overflowY: 'auto' }}>
          <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-3-2026-12_07_40-pm.png" alt="" onError={imgError('banner')} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(210,180,140,0.1)', position: 'relative', zIndex: 1 }}>
            <button onClick={() => setVisitOpen(false)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(210,180,140,0.1)', border: '1px solid rgba(210,180,140,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5e6d0" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f5e6d0', fontFamily: '"Georgia", serif' }}>{r.name}</span>
              <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.5)', display: 'block' }}>Visit Us</span>
            </div>
          </div>

          {/* Map */}
          <div style={{ margin: '16px', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(210,180,140,0.1)', height: 200, position: 'relative', background: '#0d0704' }}>
            {r.lat && r.lng ? (
              <iframe
                src={`https://www.google.com/maps?q=${r.lat},${r.lng}&z=15&output=embed`}
                style={{ width: '100%', height: '100%', border: 'none', filter: 'invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }}
                loading="lazy"
                title="Restaurant Location"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 40 }}>📍</span>
                <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.5)' }}>{r.address || 'Yogyakarta, Indonesia'}</span>
              </div>
            )}
            {/* Distance badge */}
            <div style={{ position: 'absolute', top: 10, right: 10, padding: '6px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(141,198,63,0.3)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>📍 {r.distance_km ? `${r.distance_km.toFixed(1)} km away` : '2.3 km away'}</span>
            </div>
          </div>

          {/* Address */}
          <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 14, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(210,180,140,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f5e6d0' }}>{r.address || 'Jl. Malioboro, Yogyakarta'}</span>
            </div>
            {r.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📱</span>
                <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)' }}>{r.phone}</span>
              </div>
            )}
          </div>

          {/* Seating & Opening Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px 16px' }}>
            <div style={{ padding: 16, borderRadius: 14, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(210,180,140,0.08)', textAlign: 'center' }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🪑</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#f5e6d0', display: 'block' }}>Seating</span>
              <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.6)' }}>{r.seating_capacity ? `${r.seating_capacity} seats` : '20-40 seats'}</span>
            </div>
            <div style={{ padding: 16, borderRadius: 14, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(210,180,140,0.08)', textAlign: 'center' }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🕐</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#f5e6d0', display: 'block' }}>Hours</span>
              <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.6)' }}>{r.opening_hours || '08:00 – 22:00'}</span>
            </div>
          </div>

          {/* Dining Options */}
          <div style={{ margin: '0 16px 16px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f5e6d0', margin: '0 0 12px', fontFamily: '"Georgia", serif' }}>Dining Options</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '🍽️', label: 'Dine In', active: true },
                { icon: '🥡', label: 'Takeaway', active: r.takeaway !== false },
                { icon: '🛵', label: 'Delivery', active: r.delivery !== false },
                { icon: '📦', label: 'Catering', active: r.catering_available !== false },
              ].map(opt => (
                <div key={opt.label} style={{ padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.7)', border: `1px solid ${opt.active ? 'rgba(141,198,63,0.2)' : 'rgba(210,180,140,0.08)'}`, textAlign: 'center', opacity: opt.active ? 1 : 0.4 }}>
                  <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>{opt.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: opt.active ? '#8DC63F' : 'rgba(210,180,140,0.5)' }}>{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Catering & Events */}
          <div style={{ margin: '0 16px 16px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', margin: '0 0 12px', fontFamily: '"Georgia", serif' }}>Catering & Events</h3>
            <div style={{ padding: 16, borderRadius: 14, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(250,204,21,0.1)', marginBottom: 10 }}>
              <p style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)', margin: '0 0 12px', lineHeight: 1.6 }}>
                We cater for private events, parties, and special occasions. Contact us for custom menus and packages.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { icon: '🎂', label: 'Birthdays' },
                  { icon: '👶', label: "Children's Parties" },
                  { icon: '💍', label: 'Weddings' },
                  { icon: '🏢', label: 'Corporate Events' },
                  { icon: '🎓', label: 'Graduations' },
                  { icon: '🥡', label: 'Takeaway Catering' },
                  { icon: '🏠', label: 'In-House Parties' },
                  { icon: '🎉', label: 'Private Hire' },
                ].map(e => (
                  <span key={e.label} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.12)', fontSize: 13, fontWeight: 700, color: 'rgba(210,180,140,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {e.icon} {e.label}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => { if (r.phone) window.open(`https://wa.me/${r.phone}?text=Hi, I would like to enquire about catering/events at ${r.name}`, '_blank') }} style={{
              width: '100%', padding: 14, borderRadius: 12, border: '1.5px solid rgba(250,204,21,0.3)',
              background: 'rgba(250,204,21,0.06)', color: '#FACC15', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Enquire About Catering & Events →
            </button>
          </div>

          {/* Live Entertainment */}
          <div style={{ margin: '0 16px 16px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#A78BFA', margin: '0 0 12px', fontFamily: '"Georgia", serif' }}>Entertainment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(r.entertainment || [
                { type: 'Live Music', icon: '🎵', days: 'Friday & Saturday', time: '19:00 – 22:00', details: 'Local acoustic bands' },
                { type: 'DJ Night', icon: '🎧', days: 'Saturday', time: '21:00 – 00:00', details: 'Guest DJs every week' },
              ]).map((ent, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(167,139,250,0.12)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 24 }}>{ent.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#f5e6d0', display: 'block' }}>{ent.type}</span>
                    <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.5)', display: 'block', marginTop: 2 }}>{ent.days} · {ent.time}</span>
                    {ent.details && <span style={{ fontSize: 12, color: 'rgba(167,139,250,0.6)', display: 'block', marginTop: 2 }}>{ent.details}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Happy Hour */}
          <div style={{ margin: '0 16px 16px', padding: 20, borderRadius: 16, background: 'linear-gradient(135deg, rgba(251,146,60,0.08), rgba(250,204,21,0.05))', border: '1px solid rgba(251,146,60,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>🍺</span>
              <div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#FB923C', display: 'block' }}>Happy Hour</span>
                <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.6)' }}>{r.happy_hour_time || 'Daily 15:00 – 17:00'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(r.happy_hour_deals || ['Buy 1 Get 1 Drinks', '30% off Snacks', 'Free Kerupuk']).map((deal, i) => (
                <span key={i} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)', fontSize: 13, fontWeight: 700, color: '#FB923C' }}>{deal}</span>
              ))}
            </div>
          </div>

          {/* Dine-In Discount */}
          <div style={{ margin: '0 16px 16px', padding: 20, borderRadius: 16, background: 'linear-gradient(135deg, rgba(141,198,63,0.08), rgba(250,204,21,0.05))', border: '1px solid rgba(141,198,63,0.15)', textAlign: 'center' }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🎉</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F', display: 'block' }}>{r.dine_in_discount || 10}% OFF</span>
            <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)', display: 'block', marginTop: 4 }}>Dine-in discount when you visit us</span>
            <span style={{ fontSize: 12, color: 'rgba(210,180,140,0.4)', display: 'block', marginTop: 8 }}>Show this screen to your waiter</span>
          </div>

          {/* Get Directions button */}
          <div style={{ margin: '0 16px 16px' }}>
            <button onClick={() => {
              const lat = r.lat || -7.7928
              const lng = r.lng || 110.3657
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
            }} style={{
              width: '100%', padding: 16, borderRadius: 14, border: 'none',
              background: '#8DC63F', color: '#000', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Get Directions →
            </button>
          </div>

          {/* Restaurant Info Card */}
          <div style={{ margin: '0 16px 16px', padding: 20, borderRadius: 16, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(210,180,140,0.1)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#f5e6d0', margin: '0 0 12px', fontFamily: '"Georgia", serif' }}>{r.name || 'Street Local Live'}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)' }}>{r.address || 'Jl. Malioboro 45, Yogyakarta'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📱</span>
              <a href={`https://wa.me/${r.phone || '6281234567890'}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#8DC63F', fontWeight: 700, textDecoration: 'none' }}>{r.phone || '0812-3456-7890'}</a>
            </div>
          </div>

          {/* Welcome + Promo Code */}
          <div style={{ margin: '0 16px 16px', padding: 24, borderRadius: 16, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(250,204,21,0.15)', textAlign: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'rgba(210,180,140,0.6)', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Welcome to visit us</span>
            <span style={{ fontSize: 15, color: 'rgba(210,180,140,0.7)', display: 'block', marginBottom: 16 }}>With the following promo code receive</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', display: 'block', marginBottom: 8 }}>10% OFF</span>
            <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.5)', display: 'block', marginBottom: 14 }}>your final bill</span>
            <div style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, background: 'rgba(250,204,21,0.08)', border: '2px dashed rgba(250,204,21,0.4)' }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#FACC15', letterSpacing: '4px' }}>VISITCITY10</span>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(210,180,140,0.4)', display: 'block', marginTop: 10 }}>Show this screen to your waiter</span>
          </div>

          {/* Happy Hour */}
          <div style={{ margin: '0 16px 24px', padding: 20, borderRadius: 16, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(251,146,60,0.15)', textAlign: 'center' }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🍺</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#FB923C', display: 'block' }}>Happy Hour</span>
            <span style={{ fontSize: 15, color: 'rgba(210,180,140,0.7)', display: 'block', marginTop: 6 }}>2pm to 7pm · Monday – Friday</span>
          </div>
        </div>
      )}

      {/* ═══ MENU SLIDER — slides from left ═══ */}
      {menuOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex' }}>
          {/* Backdrop */}
          <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

          {/* Slider */}
          <div style={{
            position: 'relative', width: '82%', maxWidth: 340, height: '100%',
            background: 'linear-gradient(135deg, rgba(26,14,4,0.98), rgba(10,5,0,0.98))',
            borderRight: '2px solid #8DC63F',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInMenuLeft 0.25s ease', overflow: 'hidden',
          }}>
            {/* Background image */}
            <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-3-2026-12_07_40-pm.png" alt="" onError={imgError('banner')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />
            <style>{`
              @keyframes slideInMenuLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
              @keyframes menuEdgeGlow { 0% { top: -20%; } 100% { top: 120%; } }
            `}</style>
            {/* Green running light on right edge */}
            <div style={{ position: 'absolute', top: 0, right: -1, width: 2, height: '100%', overflow: 'hidden', zIndex: 2 }}>
              <div style={{ width: 2, height: '20%', background: 'linear-gradient(to bottom, transparent, #8DC63F, #8DC63F, transparent)', position: 'absolute', animation: 'menuEdgeGlow 2s linear infinite' }} />
            </div>
            {/* Subtle green glow along edge */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: '100%', background: 'linear-gradient(to left, rgba(141,198,63,0.08), transparent)', zIndex: 1, pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, borderBottom: '1px solid rgba(210,180,140,0.1)', position: 'relative', zIndex: 1 }}>
              <button onClick={() => setMenuOpen(false)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(210,180,140,0.15)', border: '1px solid rgba(210,180,140,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5e6d0" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#f5e6d0', display: 'block', fontFamily: '"Georgia", serif' }}>{r.name}</span>
                <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.5)' }}>{menuItems.length} items</span>
              </div>
            </div>

            {/* Menu items grouped by category */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', position: 'relative', zIndex: 1 }}>
              {Object.keys(categories).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(210,180,140,0.4)' }}>
                  <span style={{ fontSize: 14 }}>No menu items yet</span>
                </div>
              ) : Object.entries(categories).map(([cat, items]) => (
                <div key={cat}>
                  {/* Category header */}
                  <div style={{ padding: '14px 16px 8px' }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: '"Georgia", serif' }}>{cat}</span>
                  </div>
                  {/* Items */}
                  {items.map((item, i) => (
                    <div key={item.id ?? i} onClick={() => setPreviewDish(item)} style={{
                      margin: '0 12px 8px', padding: '10px 12px',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(210,180,140,0.08)',
                      borderRadius: 14, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                    }}>
                      {item.photo_url && (
                        <img src={item.photo_url} alt="" onError={imgError('food')} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#f5e6d0', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        {item.description && <span style={{ fontSize: 12, color: 'rgba(210,180,140,0.4)', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</span>}
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 4 }}>{fmtRp(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* View Full Menu button at bottom */}
            <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', borderTop: '1px solid rgba(210,180,140,0.1)', flexShrink: 0 }}>
              <button onClick={onViewMenu} style={{
                width: '100%', padding: 14, borderRadius: 12,
                background: 'rgba(210,180,140,0.15)', border: '1.5px solid rgba(210,180,140,0.3)',
                color: '#f5e6d0', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: '"Georgia", serif',
              }}>
                Order from Full Menu →
              </button>
            </div>

            {/* Dish preview popup */}
            {previewDish && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div onClick={() => setPreviewDish(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
                <div style={{ position: 'relative', width: '100%', maxWidth: 300, borderRadius: 20, overflow: 'hidden', background: 'rgba(26,14,4,0.98)', border: '1px solid rgba(210,180,140,0.15)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)', animation: 'popIn 0.2s ease' }}>
                  <style>{`@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
                  {/* Image */}
                  {previewDish.photo_url && (
                    <div style={{ height: 180, position: 'relative' }}>
                      <img src={previewDish.photo_url} alt={previewDish.name} onError={imgError('food')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(26,14,4,0.9))' }} />
                    </div>
                  )}
                  {/* Details */}
                  <div style={{ padding: '16px 20px 20px' }}>
                    <h4 style={{ fontSize: 20, fontWeight: 900, color: '#f5e6d0', margin: '0 0 6px', fontFamily: '"Georgia", serif' }}>{previewDish.name}</h4>
                    {previewDish.description && <p style={{ fontSize: 13, color: 'rgba(210,180,140,0.6)', margin: '0 0 10px', lineHeight: 1.5 }}>{previewDish.description}</p>}
                    {previewDish.category && <span style={{ fontSize: 12, color: 'rgba(210,180,140,0.4)', display: 'block', marginBottom: 12 }}>{previewDish.category}</span>}
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FACC15', marginBottom: 16 }}>{fmtRp(previewDish.price)}</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => { setPreviewDish(null); setMenuOpen(false); if (onSelectDish) onSelectDish(previewDish, r); else onViewMenu() }} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#8DC63F', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Order</button>
                      <button onClick={() => setPreviewDish(null)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1.5px solid rgba(210,180,140,0.3)', background: 'none', color: '#f5e6d0', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>Close</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DEALS CAROUSEL OVERLAY ═══ */}
      {dealsOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
          {/* Background image + dark overlay */}
          <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-3-2026-12_07_40-pm.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          <div onClick={() => setDealsOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

          {/* Close button */}
          <button onClick={() => setDealsOpen(false)} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', right: 16, zIndex: 30, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          {/* Header */}
          <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 20px)', left: 20, zIndex: 25 }}>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#f5e6d0', margin: 0, fontFamily: '"Georgia", serif' }}>Today's Deals</h3>
            <p style={{ fontSize: 13, color: 'rgba(210,180,140,0.5)', margin: '4px 0 0' }}>{r.name}</p>
          </div>

          {dealItems.length === 0 ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25 }}>
              <p style={{ fontSize: 16, color: 'rgba(210,180,140,0.4)' }}>No deals available right now.</p>
            </div>
          ) : (
            <>
              {/* Carousel card — centered */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 80px)', maxWidth: 320, zIndex: 25 }}>
                {(() => {
                  const d = dealItems[dealIdx] || dealItems[0]
                  if (!d) return null
                  return (
                    <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(26,14,4,0.95)', border: '1px solid rgba(210,180,140,0.15)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
                      {/* Image */}
                      <div style={{ height: 200, position: 'relative' }}>
                        <img src={d.photo_url} alt={d.name} onError={imgError('food')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(26,14,4,0.9))' }} />
                        <span style={{ position: 'absolute', top: 12, left: 12, padding: '6px 14px', borderRadius: 10, background: '#FACC15', fontSize: 16, fontWeight: 900, color: '#000' }}>-{d.discount}%</span>
                        {/* Dots indicator */}
                        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                          {dealItems.map((_, di) => (
                            <div key={di} style={{ width: dealIdx === di ? 20 : 8, height: 8, borderRadius: 4, background: dealIdx === di ? '#8DC63F' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s' }} />
                          ))}
                        </div>
                      </div>
                      {/* Info */}
                      <div style={{ padding: '16px 20px 20px' }}>
                        <h4 style={{ fontSize: 20, fontWeight: 900, color: '#f5e6d0', margin: '0 0 4px', fontFamily: '"Georgia", serif' }}>{d.name}</h4>
                        {d.description && <p style={{ fontSize: 13, color: 'rgba(210,180,140,0.5)', margin: '0 0 12px' }}>{d.description}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.35)', textDecoration: 'line-through', marginRight: 8 }}>{fmtRp(d.price)}</span>
                            <span style={{ fontSize: 22, fontWeight: 900, color: '#FACC15' }}>{fmtRp(d.dealPrice)}</span>
                          </div>
                          <button onClick={() => { setDealsOpen(false); if (onSelectDish) onSelectDish(d, r); else onViewMenu() }} style={{ padding: '10px 20px', borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Order Now</button>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Left arrow */}
              {dealItems.length > 1 && (
                <button onClick={() => setDealIdx((dealIdx - 1 + dealItems.length) % dealItems.length)} style={{
                  position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 30,
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(210,180,140,0.2)',
                  color: '#f5e6d0', fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>‹</button>
              )}

              {/* Right arrow */}
              {dealItems.length > 1 && (
                <button onClick={() => setDealIdx((dealIdx + 1) % dealItems.length)} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 30,
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(210,180,140,0.2)',
                  color: '#f5e6d0', fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>›</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
