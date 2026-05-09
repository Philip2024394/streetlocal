/**
 * DashboardPage — Full user dashboard for website.
 * Create/manage property listings, edit profile, view bookings/saved.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { createListing, getMyListings, deactivateListing, updateListing } from '@/services/rentalListingService'
import { ScrollReveal } from '../hooks/useScrollReveal'
import PropertyListingForm from '@/domains/rentals/forms/PropertyListingForm'
import OfferPanel from '@/components/property/OfferPanel'
import { getOffersForMyListings, DEMO_OFFERS } from '@/services/offerService'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const glass = { background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }
const inp = { width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', marginBottom: 10 }

export default function DashboardPage({ onBack, onSelectListing }) {
  const [tab, setTab] = useState('listings')
  const [myListings, setMyListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingListing, setEditingListing] = useState(null)
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('indoo_web_user')) } catch { return {} } })
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')
  const [profileCity, setProfileCity] = useState(user?.city || '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [bookings, setBookings] = useState([])
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    loadListings()
    try { setBookings(JSON.parse(localStorage.getItem('indoo_rental_bookings') || '[]')) } catch {}
    try { setSavedCount(JSON.parse(localStorage.getItem('indoo_web_favorites') || '[]').length) } catch {}
  }, [])

  async function loadListings() {
    setLoading(true)
    const data = await getMyListings()
    setMyListings(data)
    setLoading(false)
  }

  async function handleDeactivate(id, reason) {
    await deactivateListing(id, reason)
    loadListings()
  }

  function saveProfile() {
    const updated = { ...user, name: profileName, phone: profilePhone, city: profileCity }
    localStorage.setItem('indoo_web_user', JSON.stringify(updated))
    setUser(updated)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const active = myListings.filter(l => l.status === 'active' || l.status === 'live')
  const sold = myListings.filter(l => l.status === 'sold')
  const rented = myListings.filter(l => l.status === 'rented')
  const totalViews = myListings.reduce((s, l) => s + (l.view_count || Math.floor(Math.random() * 100 + 10)), 0)

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">

        {/* Header */}
        <ScrollReveal>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>My Dashboard</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Welcome, {user?.name || 'User'} · {user?.accountType === 'agent' ? 'Agent' : user?.accountType === 'seller' ? 'Owner' : user?.accountType === 'developer' ? 'Developer' : 'Buyer'}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCreateForm(true)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ New Listing</button>
              {onBack && <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>}
            </div>
          </div>
        </ScrollReveal>

        {/* ═══ 2-COLUMN DESKTOP LAYOUT: Sidebar left + Main right ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT SIDEBAR: Profile + Stats ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 90 }}>

            {/* Profile Card */}
            <div style={{ ...glass, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(141,198,63,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#8DC63F', flexShrink: 0 }}>{(user.name || 'U')[0].toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'User'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email || '—'}</div>
                </div>
              </div>
              {user.accountType && <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(141,198,63,0.1)', fontSize: 11, fontWeight: 800, color: '#8DC63F', display: 'inline-block', marginBottom: 12 }}>{user.accountType}</span>}

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { val: active.length, label: 'Active', color: '#8DC63F' },
                  { val: sold.length, label: 'Sold', color: '#EF4444' },
                  { val: rented.length, label: 'Rented', color: '#60A5FA' },
                  { val: totalViews, label: 'Views', color: '#FACC15' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '8px 6px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Nav */}
            <div style={{ ...glass, padding: '6px' }}>
              {[
                { id: 'listings', label: 'My Listings', count: myListings.length, icon: '🏠' },
                { id: 'bookings', label: 'Bookings', count: bookings.length, icon: '📅' },
                { id: 'saved', label: 'Saved', count: savedCount, icon: '❤️' },
                { id: 'offers', label: 'Offers', count: null, icon: '💰' },
                { id: 'profile', label: 'Edit Profile', count: null, icon: '👤' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10,
                  background: tab === t.id ? 'rgba(141,198,63,0.1)' : 'transparent',
                  color: tab === t.id ? '#8DC63F' : 'rgba(255,255,255,0.4)',
                  fontSize: 13, fontWeight: 700, textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 15 }}>{t.icon}</span>
                  <span style={{ flex: 1 }}>{t.label}</span>
                  {t.count !== null && <span style={{ fontSize: 11, fontWeight: 800, color: tab === t.id ? '#8DC63F' : 'rgba(255,255,255,0.2)', background: tab === t.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 8 }}>{t.count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Main Content ── */}
          <div>

            {/* ═══ MY LISTINGS ═══ */}
            {tab === 'listings' && (
              <>
                {myListings.length === 0 && !loading && (
                  <div style={{ ...glass, textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>No listings yet</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Create your first property listing to get started</div>
                    <button onClick={() => setShowCreateForm(true)} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ Create Listing</button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                  {myListings.map(l => {
                    const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
                    const isSoldRented = l.status === 'sold' || l.status === 'rented'
                    return (
                      <div key={l.id || l.ref} style={{ ...glass, overflow: 'hidden' }}>
                        <div style={{ height: 130, overflow: 'hidden', position: 'relative' }}>
                          {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🏠</div>}
                          {isSoldRented && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={l.status === 'sold' ? 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-2-2026-04_45_33-am.png' : 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-2-2026-04_43_39-am.png'} alt="" style={{ width: '35%', objectFit: 'contain' }} /></div>}
                          <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4 }}>
                            <span style={{ padding: '2px 7px', borderRadius: 5, background: l.status === 'active' || l.status === 'live' ? '#8DC63F' : l.status === 'sold' ? '#EF4444' : l.status === 'rented' ? '#60A5FA' : '#F59E0B', fontSize: 9, fontWeight: 900, color: '#000' }}>{l.status || 'active'}</span>
                            <span style={{ padding: '2px 7px', borderRadius: 5, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 9, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'Sale' : 'Rent'}</span>
                          </div>
                        </div>

                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || 'Untitled'}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{l.city || '—'} · {l.sub_category || l.extra_fields?.propType || l.category}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginBottom: 8 }}>{fmtRp(price)}</div>

                          <div style={{ display: 'flex', gap: 5 }}>
                            <button onClick={() => onSelectListing?.(l)} style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View</button>
                            <button onClick={() => { setEditingListing(l); setShowCreateForm(true) }} style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)', color: '#60A5FA', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                            {(l.status === 'active' || l.status === 'live') && (
                              <>
                                <button onClick={() => handleDeactivate(l.id || l.ref, 'sold')} style={{ padding: '7px 8px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sold</button>
                                <button onClick={() => handleDeactivate(l.id || l.ref, 'rented')} style={{ padding: '7px 8px', borderRadius: 7, border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)', color: '#60A5FA', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rented</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ═══ BOOKINGS ═══ */}
            {tab === 'bookings' && (
              <div>
                {bookings.length === 0 && <div style={{ ...glass, textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.25)' }}>No bookings received yet</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                  {bookings.map((b, i) => (
                    <div key={b.id || i} style={{ ...glass, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{b.vehicleName || b.listingTitle || 'Booking'}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{b.renterName || 'Renter'} · {b.startDate} → {b.endDate}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(b.total)}</div>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: b.status === 'confirmed' ? 'rgba(141,198,63,0.12)' : 'rgba(245,158,11,0.12)', color: b.status === 'confirmed' ? '#8DC63F' : '#F59E0B' }}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ SAVED ═══ */}
            {tab === 'saved' && (
              <div>
                {savedCount === 0 && <div style={{ ...glass, textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.25)' }}>No saved properties. Use the heart icon on listings to save them.</div>}
              </div>
            )}

            {/* ═══ OFFERS ═══ */}
            {tab === 'offers' && (
              <div>
                {myListings.length === 0 ? (
                  <div style={{ ...glass, textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.25)' }}>Create a listing first to start receiving offers</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
                    {myListings.map(l => {
                      const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
                      return (
                        <OfferPanel
                          key={l.id || l.ref}
                          listingId={l.id || l.ref}
                          listingTitle={l.title}
                          listingPrice={price}
                          offers={l.id === 'demo' || l.ref === 'demo' ? DEMO_OFFERS : undefined}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══ PROFILE ═══ */}
            {tab === 'profile' && user && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Personal Info */}
                <div style={{ ...glass, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Personal Info</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 5, textTransform: 'uppercase' }}>Full Name</div>
                  <input value={profileName} onChange={e => setProfileName(e.target.value)} style={inp} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 5, textTransform: 'uppercase' }}>City</div>
                  <input value={profileCity} onChange={e => setProfileCity(e.target.value)} placeholder="e.g. Yogyakarta" style={inp} />
                </div>
                {/* Contact */}
                <div style={{ ...glass, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Contact</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 5, textTransform: 'uppercase' }}>Email</div>
                  <div style={{ ...inp, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', cursor: 'not-allowed' }}>{user.email || '—'}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 5, textTransform: 'uppercase' }}>WhatsApp</div>
                  <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="081234567890" type="tel" style={inp} />
                </div>
                {/* Save — spans full */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <button onClick={saveProfile} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{profileSaved ? 'Saved!' : 'Save Profile'}</button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Create/Edit Listing Form */}
      {showCreateForm && (
        <PropertyListingForm
          open
          propertyType="House"
          listingMarket="rental"
          editListing={editingListing}
          onClose={() => { setShowCreateForm(false); setEditingListing(null); loadListings() }}
          onSubmit={async (listing) => {
            if (editingListing) {
              await updateListing(editingListing.id || editingListing.ref, listing)
            } else {
              await createListing(listing)
            }
            setShowCreateForm(false)
            setEditingListing(null)
            loadListings()
          }}
        />
      )}
    </div>
  )
}
