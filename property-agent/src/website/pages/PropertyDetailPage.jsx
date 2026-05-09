/**
 * PropertyDetailPage — Desktop 2-panel property detail.
 * Gallery left, details right. Integrates existing app components.
 */
import { useState, useRef, useEffect } from 'react'
import { usePropertyListings } from '../hooks/usePropertyListings'
import KPRCalculator from '@/components/property/KPRCalculator'
import PriceHistoryChart from '@/components/property/PriceHistoryChart'
import PropertyValuation from '@/components/property/PropertyValuation'
import ComparableSales from '@/components/property/ComparableSales'
import NeighborhoodGuide from '@/components/property/NeighborhoodGuide'
import TransportProximity from '@/components/property/TransportProximity'
import { ScrollReveal } from '../hooks/useScrollReveal'
import PropertyMap from '@/components/property/PropertyMap'
import FavoriteButton from '../components/FavoriteButton'
import MakeOffer from '@/components/property/MakeOffer'
import ShareButtons from '../components/ShareButtons'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const glass = { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

const DETAIL_ICONS = {
  Certificate: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsssvvvvv-removebg-preview.png',
  Furnished: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsssvvvvvdd-removebg-preview.png',
  Facing: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledssv-removebg-preview.png',
  Floors: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitled33-removebg-preview.png',
  'Year Built': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsssff-removebg-preview.png',
  Electricity: '⚡', Water: '💧', Parking: '🅿️', Pool: '🏊',
}

export default function PropertyDetailPage({ listing, onBack, onSelectListing }) {
  const [activeImg, setActiveImg] = useState(0)
  const [showKPR, setShowKPR] = useState(false)
  const { listings: allListings } = usePropertyListings()

  if (!listing) return null

  const images = listing.images?.length ? listing.images : [listing.image || '']
  const ef = listing.extra_fields || {}
  const price = listing.buy_now ? (typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now) : listing.price_month || listing.price_day || listing.price_year
  const priceLabel = listing.buy_now ? 'For Sale' : listing.price_month ? '/ month' : listing.price_day ? '/ day' : listing.price_year ? '/ year' : ''
  const isProperty = true
  const phone = ef.whatsapp || listing.whatsapp || '081234567890'

  // Similar listings from Supabase/demo
  const similar = allListings.filter(l => l.id !== listing.id && (l.city === listing.city || l.sub_category === listing.sub_category)).slice(0, 6)

  // Detail rows
  const details = [
    ef.certificate && ['Certificate', ef.certificate],
    ef.furnished && ['Furnished', ef.furnished],
    (ef.facing || ef.facingDirection) && ['Facing', ef.facing || ef.facingDirection],
    (ef.floors || ef.numFloors) && ['Floors', ef.floors || ef.numFloors],
    (ef.yearBuilt || ef.year_built) && ['Year Built', ef.yearBuilt || ef.year_built],
    ef.electricityCapacity && ['Electricity', ef.electricityCapacity],
    ef.waterType && ['Water', ef.waterType],
    ef.parking && ['Parking', `${ef.parking} spots`],
    ef.pool && ['Pool', 'Yes'],
    ef.zoning && ['Zoning', ef.zoning],
  ].filter(Array.isArray)

  // Rental periods
  const periods = []
  if (!listing.buy_now) {
    if (listing.price_day) periods.push({ label: 'Day', price: listing.price_day })
    if (listing.price_week) periods.push({ label: 'Week', price: listing.price_week })
    if (listing.price_month) periods.push({ label: 'Month', price: listing.price_month })
    if (listing.price_year) periods.push({ label: 'Year', price: listing.price_year })
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#8DC63F', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, padding: '8px 0', minHeight: 44 }}>← Back</button>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</div>
        <span style={{ padding: '3px 10px', borderRadius: 8, background: listing.buy_now ? '#FACC15' : '#8DC63F', fontSize: 10, fontWeight: 900, color: '#000', flexShrink: 0 }}>{listing.buy_now ? 'SALE' : 'RENT'}</span>
      </div>

      {/* ═══ SECTION 1: Gallery + Info ═══ */}
      <div className="ws-container" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {/* Gallery */}
        <div style={{ width: '100%' }}>
          <div style={{ ...glass, overflow: 'hidden' }}>
            <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
              <img src={images[activeImg]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }} />
              <div style={{ position: 'absolute', top: 14, left: 14, padding: '6px 16px', borderRadius: 10, background: listing.buy_now ? '#FACC15' : '#8DC63F', fontSize: 13, fontWeight: 900, color: '#000' }}>{listing.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: 72, height: 52, borderRadius: 10, overflow: 'hidden', border: activeImg === i ? '2.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: activeImg === i ? 1 : 0.6 }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Make Offer + Viewing — under thumbnails, same width as gallery */}
          {listing.offers_enabled !== false && <div style={{ marginTop: 10 }}><MakeOffer listing={listing} viewingSchedule={ef.viewing_schedule} officeHours={ef.office_hours} /></div>}

          {/* Pricing periods */}
          {periods.length > 0 && (
            <div style={{ ...glass, padding: '14px', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {periods.map(p => (
                  <div key={p.label} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{p.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#FACC15', marginTop: 3 }}>{fmtRp(p.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ width: '100%' }}>
          <div style={{ ...glass, padding: '14px' }}>
            {/* Badges + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>✓ Verified</span>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{listing.sub_category || ef.propType}</span>
                {ef.rentalType && ef.rentalType !== 'whole' && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 11, fontWeight: 800, color: '#8DC63F' }}>{ef.rentalType === 'room' ? 'Room Only' : 'Shared'}</span>}
                {listing.owner_type === 'agent' && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(96,165,250,0.08)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>Agent</span>}
                {ef.leaseDuration && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{ef.leaseDuration}</span>}
              </div>
              <FavoriteButton listingId={listing.id} size="md" />
            </div>
            {/* Specialty Tags */}
            {ef.specialtyTags?.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                {ef.specialtyTags.map(tagId => {
                  const icons = { holiday: '🌴', beachfront: '🏖️', mountain: '⛰️', luxury: '✨', eco: '🌱', pet_friendly: '🐾', investment: '📈', furnished_ready: '🔑' }
                  const labels = { holiday: 'Holiday Home', beachfront: 'Beachfront', mountain: 'Mountain View', luxury: 'Luxury', eco: 'Eco-friendly', pet_friendly: 'Pet Friendly', investment: 'Investment Ready', furnished_ready: 'Move-in Ready' }
                  return <span key={tagId} style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', fontSize: 11, fontWeight: 700, color: '#FACC15' }}>{icons[tagId] || ''} {labels[tagId] || tagId}</span>
                })}
              </div>
            )}

            <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>{listing.title}</h1>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>📍 {listing.address || listing.city}</div>

            {/* Description */}
            {listing.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 14 }}>{listing.description}</div>}

            {/* Price */}
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FACC15', marginBottom: 4 }}>{fmtRp(price)}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{priceLabel}{ef.land_area ? ` · ${fmtRp(Math.round(Number(String(price).replace(/\./g, '')) / parseInt(String(ef.land_area).replace(/[^\d]/g, ''), 10) || 1))}/m²` : ''}</div>
            <div style={{ marginBottom: 20 }}><ShareButtons title={listing.title} price={fmtRp(price)} /></div>

            {/* Specs grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                ef.bedrooms && { icon: '🛏️', val: ef.bedrooms, label: 'Beds' },
                ef.bathrooms && { icon: '🚿', val: ef.bathrooms, label: 'Bath' },
                ef.land_area && { icon: '📐', val: ef.land_area, label: 'Land' },
                ef.building_area && { icon: '🏗️', val: ef.building_area, label: 'Building' },
                ef.certificate && { icon: DETAIL_ICONS.Certificate, val: ef.certificate, label: 'Cert', isImg: true },
                ef.furnished && { icon: DETAIL_ICONS.Furnished, val: ef.furnished, label: 'Furnished', isImg: true },
              ].filter(Boolean).map(s => (
                <div key={s.label} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                  {s.isImg ? <img src={s.icon} alt="" style={{ width: 22, height: 22, objectFit: 'contain', display: 'inline-block' }} /> : <div style={{ fontSize: 16 }}>{s.icon}</div>}
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <a href={`https://wa.me/${phone.replace(/^0/, '62')}?text=${encodeURIComponent(`Halo, saya tertarik dengan ${listing.title}`)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/dfggdfgees-removebg-preview.png" alt="WhatsApp" style={{ height: 44, objectFit: 'contain' }} />
              </a>
              {listing.buy_now && (
                <button onClick={() => setShowKPR(true)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FACC15, #F59E0B)', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🏦 KPR</button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: Property Details — full width ═══ */}
      <div className="ws-container" style={{ marginBottom: 32 }}>
        <ScrollReveal>
          <div style={{ ...glass, padding: '20px', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>Property Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 0 }}>
              {details.map(([label, value], i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>{DETAIL_ICONS[label]?.startsWith?.('http') ? <img src={DETAIL_ICONS[label]} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> : (DETAIL_ICONS[label] || '•')} {label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{value}</span>
                </div>
              ))}
            </div>
            {/* Included Features */}
            {listing.features?.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Included Features</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {listing.features.map(f => <span key={f} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>{f}</span>)}
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* ═══ PROPERTY FEATURES GRID ═══ */}
      {(() => {
        const featureGroups = [
          { title: 'Interior', items: [ef.diningRoom && 'Dining Room', ef.livingRoom && 'Living Room', ef.storageRoom && 'Storage Room', ef.maidRoom && 'Maid Room', ef.maidBathroom && 'Maid Bathroom', ef.walkInCloset && 'Walk-in Closet', ef.smartHome && 'Smart Home', ef.kitchenType && `${ef.kitchenType} Kitchen`, ef.parkingCar && `${ef.parkingCar} Car Parking`, ef.parkingMotorbike && `${ef.parkingMotorbike} Bike Parking`].filter(Boolean) },
          { title: 'Exterior', items: [ef.frontYard && 'Front Yard', ef.terrace && 'Terrace/Patio', ef.gatedProperty && 'Gated Property', ef.outdoorKitchen && 'Outdoor Kitchen/BBQ'].filter(Boolean) },
          { title: 'Security', items: [ef.security24h && '24h Security', ef.alarmSystem && 'Alarm System', ef.smartLock && 'Smart Lock', ef.oneGateSystem && 'One Gate System'].filter(Boolean) },
          { title: 'Utilities', items: [ef.internetAvail && 'Internet', ef.cableTv && 'Cable TV', ef.drainageSystem && 'Drainage', ef.septicTank && 'Septic Tank', ef.powerSupplyVoltage && `${ef.powerSupplyVoltage}`, ef.powerSupplyPhase && ef.powerSupplyPhase].filter(Boolean) },
          { title: 'Pets', items: [ef.petFriendly && 'Pets Allowed', ...(ef.petsAllowed || []), ef.petDeposit && `Deposit: Rp ${ef.petDeposit}`].filter(Boolean) },
          { title: 'Facilities', items: [ef.elevator && 'Elevator', ef.gym && 'Gym', ef.playground && 'Playground', ef.clubhouse && 'Clubhouse', ef.joggingTrack && 'Jogging Track', ef.basementParking && 'Basement Parking', ef.sharedPool && 'Shared Pool', ef.mosque && 'Mosque'].filter(Boolean) },
          { title: 'Location', items: [ef.cornerLot && 'Corner Lot', ef.quietNeighborhood && 'Quiet Area', ef.nearMainRoad && 'Near Main Road', ef.nearSchools && 'Near Schools', ef.nearHospital && 'Near Hospital', ef.nearShopping && 'Near Shopping', ef.viewType && ef.viewType !== 'No View' && ef.viewType].filter(Boolean) },
        ].filter(g => g.items.length > 0)

        if (!featureGroups.length) return null
        return (
          <div className="ws-container" style={{ marginBottom: 32 }}>
            <ScrollReveal>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {featureGroups.map(g => (
                  <div key={g.title} style={{ ...glass, padding: '16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', marginBottom: 10 }}>{g.title}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {g.items.map(item => (
                        <span key={item} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
            {(ef.renovationYear || ef.occupancyStatus) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {ef.renovationYear && <span style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Renovated: {ef.renovationYear}</span>}
                {ef.occupancyStatus && <span style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{ef.occupancyStatus}</span>}
              </div>
            )}
          </div>
        )
      })()}

      {/* ═══ CONSTRUCTION & WARRANTY ═══ */}
      {(() => {
        const hasConstruction = ef.structureType || ef.roofType || ef.wallMaterial || ef.flooringType || ef.foundationType || ef.buildQuality
        const hasWarranty = ef.warrantyStructure || ef.warrantyRoof || ef.warrantyWaterproofing || ef.warrantyElectrical || ef.warrantyDeveloper
        if (!hasConstruction && !hasWarranty) return null

        return (
          <div className="ws-container" style={{ display: 'grid', gridTemplateColumns: hasConstruction && hasWarranty ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 32 }}>
            {hasConstruction && (
              <ScrollReveal>
                <div style={{ ...glass, padding: '18px', border: '1px solid rgba(250,204,21,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>Construction & Quality</span>
                    {ef.buildQuality && <span style={{ padding: '3px 10px', borderRadius: 6, background: ef.buildQuality === 'Luxury' ? 'rgba(250,204,21,0.12)' : ef.buildQuality === 'Premium' ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.04)', border: ef.buildQuality === 'Luxury' ? '1px solid rgba(250,204,21,0.25)' : ef.buildQuality === 'Premium' ? '1px solid rgba(141,198,63,0.2)' : '1px solid rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 800, color: ef.buildQuality === 'Luxury' ? '#FACC15' : ef.buildQuality === 'Premium' ? '#8DC63F' : '#fff' }}>{ef.buildQuality}</span>}
                  </div>
                  {[
                    ef.structureType && ['Structure', ef.structureType],
                    ef.roofType && ['Roof', ef.roofType],
                    ef.wallMaterial && ['Walls', ef.wallMaterial],
                    ef.flooringType && ['Flooring', ef.flooringType],
                    ef.foundationType && ef.foundationType !== 'Unknown' && ['Foundation', ef.foundationType],
                  ].filter(Boolean).map(([label, value], i, arr) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {hasWarranty && (
              <ScrollReveal delay={0.1}>
                <div style={{ ...glass, padding: '18px', border: '1px solid rgba(96,165,250,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA' }}>Warranty & Guarantees</span>
                    <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', fontSize: 10, fontWeight: 800, color: '#60A5FA' }}>WARRANTY INCLUDED</span>
                  </div>
                  {[
                    ef.warrantyStructure && ['Structural', ef.warrantyStructure],
                    ef.warrantyRoof && ['Roof', ef.warrantyRoof],
                    ef.warrantyWaterproofing && ['Waterproofing', ef.warrantyWaterproofing],
                    ef.warrantyElectrical && ['Electrical', ef.warrantyElectrical],
                    ef.warrantyDeveloper && ['Developer Guarantee', ef.warrantyDeveloper],
                  ].filter(Boolean).map(([label, value], i, arr) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#60A5FA' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </div>
        )
      })()}

      {/* ═══ SECTION 3: Analytics ═══ */}
      {listing.buy_now && (
        <div className="ws-container" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div style={{ ...glass, padding: 14 }}><PriceHistoryChart listing={listing} /></div>
          <div style={{ ...glass, padding: 14 }}><PropertyValuation listing={listing} /></div>
          <div style={{ ...glass, padding: 14 }}><ComparableSales listing={listing} /></div>
        </div>
      )}

      {/* ═══ SECTION 4: Location ═══ */}
      <div className="ws-container" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <div style={{ ...glass, padding: 14 }}><NeighborhoodGuide listing={listing} /></div>
        <div style={{ ...glass, padding: 14 }}><TransportProximity listing={listing} /></div>
      </div>

      {/* ═══ MAP ═══ */}
      <div className="ws-container" style={{ marginBottom: 32 }}>
        <ScrollReveal>
          <div style={{ ...glass, padding: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>📍 Property Location</h3>
            <PropertyMap lat={ef.lat || listing.lat} lng={ef.lng || listing.lng} title={listing.title} height={300} />
          </div>
        </ScrollReveal>
      </div>

      {/* ═══ SECTION 5: Similar ═══ */}
      {similar.length > 0 && (
        <div className="ws-container" style={{ marginBottom: 32 }}>
          <ScrollReveal>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Similar Properties</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {similar.map(l => {
                const p = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
                return (
                  <div key={l.id} className="ws-card" onClick={() => { onSelectListing?.(l); window.scrollTo(0, 0) }} style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ height: 140, overflow: 'hidden' }}><img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /></div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>📍 {l.city}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginTop: 4 }}>{fmtRp(p)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* KPR overlay */}
      {showKPR && <KPRCalculator open onClose={() => setShowKPR(false)} propertyPrice={price ? Number(String(price).replace(/\./g, '')) : 500000000} />}
    </div>
  )
}
