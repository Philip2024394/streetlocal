import { useState } from 'react'
import styles from './RestaurantMenuSheet.module.css'

const BIRTHDAY_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2024,%202026,%2003_58_16%20PM.png'
const SEATING_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2024,%202026,%2003_53_13%20PM.png'
const LIVE_MUSIC_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2024,%202026,%2004_28_23%20PM.png'
const DJ_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2024,%202026,%2004_36_09%20PM.png'
const TOUR_IMG = 'https://ik.imagekit.io/nepgaxllc/6789D.png'

// Full event data — each has detail content for the expanded overlay
const EVENT_DATA = {
  seating: {
    img: SEATING_IMG, title: 'Venue & Seating', sub: 'Dine-in for groups & events',
    price: null,
    gallery: [SEATING_IMG, BIRTHDAY_IMG, LIVE_MUSIC_IMG, DJ_IMG],
    desc: (r) => `${r.name} offers spacious indoor seating for up to ${r.seating_capacity ?? 40} guests. The venue features comfortable seating arrangements perfect for family gatherings, team dinners, and social events. Air-conditioned space with clean facilities and dedicated parking. Our staff will help arrange tables to suit your group size — from intimate dinners of 10 to large parties filling the entire venue. Advance booking recommended for weekends and holidays.`,
    enquiry: 'venue seating and availability',
  },
  catering: {
    img: BIRTHDAY_IMG, title: 'Catering', sub: 'Weddings, corporate & events',
    price: 'From Rp 30.000/pax',
    gallery: [BIRTHDAY_IMG, SEATING_IMG, LIVE_MUSIC_IMG, TOUR_IMG],
    desc: (r) => `Full catering service by ${r.name} — we bring our kitchen to your event. Available for weddings, corporate functions, arisan gatherings, and outdoor celebrations. Our catering packages include main dishes, sides, drinks, and desserts with flexible menu options. Minimum order starts at 20 pax. We provide serving equipment, setup, and cleanup. Custom menus available — discuss your requirements and budget with our team. Delivery within Yogyakarta area included.`,
    enquiry: 'catering packages and pricing',
  },
  birthday_setup: {
    img: BIRTHDAY_IMG, title: 'Birthday Parties', sub: 'Setup, decorations & packages',
    price: 'From Rp 25.000/pax',
    gallery: [BIRTHDAY_IMG, SEATING_IMG, DJ_IMG, LIVE_MUSIC_IMG],
    desc: (r) => `Celebrate your birthday at ${r.name}! Our birthday packages include table decorations, balloon setup, a dedicated party area, and a special birthday menu. Choose from our standard package (decorations + set menu) or premium package (full decoration, sound system, birthday cake, and photographer). We handle everything so you can enjoy the party. Suitable for kids and adults — customise the theme to your preference. Book at least 3 days in advance.`,
    enquiry: 'birthday party packages',
  },
  private_room: {
    img: SEATING_IMG, title: 'Private Room', sub: 'Exclusive space for your group',
    price: 'From Rp 50.000/pax',
    gallery: [SEATING_IMG, BIRTHDAY_IMG, LIVE_MUSIC_IMG, DJ_IMG],
    desc: (r) => `${r.name} offers a private dining room for exclusive events. Perfect for business meetings, family celebrations, engagement dinners, and intimate gatherings. The room is fully enclosed with AC, dedicated service staff, and a separate sound system. Capacity up to ${Math.min(r.seating_capacity ?? 20, 30)} guests. Menu can be pre-selected or ordered on arrival. Minimum spend applies for weekend bookings. Privacy guaranteed — your event, your space.`,
    enquiry: 'private room booking',
  },
  party_package: {
    img: BIRTHDAY_IMG, title: 'Party Package', sub: 'All-in-one celebration',
    price: 'From Rp 35.000/pax',
    gallery: [BIRTHDAY_IMG, DJ_IMG, LIVE_MUSIC_IMG, SEATING_IMG],
    desc: (r) => `The ultimate party experience at ${r.name}. Our all-in-one package covers venue, food, drinks, decorations, sound system, and a dedicated event coordinator. Perfect for reunions, graduations, farewell parties, and celebrations of any kind. Choose your menu from our party selection — buffet or set menu options available. We accommodate groups from 15 to ${r.seating_capacity ?? 80} guests. Add-ons available: live music, DJ, photo booth, projector.`,
    enquiry: 'party packages',
  },
  live_music: {
    img: LIVE_MUSIC_IMG, title: 'Live Music', sub: 'Live entertainment & performances',
    price: 'From Rp 40.000/pax',
    gallery: [LIVE_MUSIC_IMG, DJ_IMG, SEATING_IMG, BIRTHDAY_IMG],
    desc: (r) => `Enjoy live music at ${r.name}! We host regular live performances featuring local bands, acoustic sessions, and solo artists. For private events, we can arrange dedicated live entertainment tailored to your taste — pop, jazz, keroncong, or dangdut. Our sound system is professional grade with proper stage lighting. Live music events include a special menu and drink packages. Book a table near the stage for the best experience. Weekend slots fill fast.`,
    enquiry: 'live music events and booking',
  },
  sound_system: {
    img: DJ_IMG, title: 'DJ & Sound System', sub: 'Professional DJ & PA setup',
    price: 'From Rp 45.000/pax',
    gallery: [DJ_IMG, LIVE_MUSIC_IMG, BIRTHDAY_IMG, SEATING_IMG],
    desc: (r) => `${r.name} is equipped with a professional sound system and DJ booth. Available for private hire — bring your own DJ or use our resident DJ for your event. The PA system supports wireless microphones for speeches and toasts. Perfect for wedding receptions, birthday bashes, corporate events, and themed nights. Our setup includes subwoofer, monitors, mixer, and LED lighting. Sound level managed to comply with local regulations. Package includes 4 hours of DJ time.`,
    enquiry: 'DJ and sound system hire',
  },
  tour_guide: {
    img: TOUR_IMG, title: 'Tour Guide Package', sub: 'Group booking for tour groups',
    price: null,
    gallery: [TOUR_IMG, SEATING_IMG, BIRTHDAY_IMG, LIVE_MUSIC_IMG],
    desc: (r) => {
      const pkg = r.tour_guide_package ?? {}
      const pax = pkg.min_pax ?? 20
      return `Welcome tour guides! ${r.name} offers special group rates for tour operators bringing guests to dine with us. Minimum group size ${pax} pax. We provide a set menu experience featuring our most popular dishes — designed to give your guests an authentic local food experience. Fast service guaranteed — we prepare in advance so your group is served within 15 minutes of arrival. ${pkg.bus_parking ? 'Bus and large vehicle parking available on-site.' : 'Street parking available nearby.'} Contact us to arrange menu, timing, and special requirements.`
    },
    enquiry: 'tour guide group booking',
  },
}

function EventCard({ data, rating, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{
        borderRadius: 18, overflow: 'hidden', position: 'relative', height: 150,
        border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, cursor: 'pointer',
      }}
    >
      <img src={data.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.1) 100%)' }} />

      {rating != null && (
        <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#FACC15' }}>★</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{rating}</span>
        </div>
      )}

      {/* Yellow info button — bottom right */}
      <div style={{
        position: 'absolute', bottom: 10, right: 10,
        width: 34, height: 34, borderRadius: '50%',
        background: '#FACC15', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(250,204,21,0.4)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 54, padding: '12px 14px' }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'block' }}>{data.title}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, display: 'block' }}>{data.sub}</span>
      </div>
    </div>
  )
}

function EventDetail({ data, restaurant, vendorData, onClose }) {
  // Use vendor-uploaded images if available, fall back to defaults
  const vendorImages = vendorData?.images ?? []
  const gallery = vendorImages.length > 0 ? vendorImages : data.gallery
  const [mainImg, setMainImg] = useState(vendorImages[0] ?? data.img)
  const vendorDesc = vendorData?.description ?? null
  const desc = vendorDesc || (typeof data.desc === 'function' ? data.desc(restaurant) : data.desc)
  const priceDisplay = vendorData?.priceFrom
    ? `From Rp ${Number(vendorData.priceFrom).toLocaleString('id-ID')}${vendorData.priceTo ? ` – Rp ${Number(vendorData.priceTo).toLocaleString('id-ID')}` : ''}/pax`
    : data.price

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10, background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', borderRadius: '0 24px 24px 0',
      overflow: 'hidden',
    }}>
      {/* Hero image */}
      <div style={{ position: 'relative', height: 200, flexShrink: 0 }}>
        <img src={mainImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, transparent 50%)' }} />

        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Title over image */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>{data.title}</span>
          {priceDisplay && (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15', marginTop: 4, display: 'block' }}>{priceDisplay}</span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 20px' }}>

        {/* Thumbnail gallery */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => setMainImg(img)}
              style={{
                width: 58, height: 58, borderRadius: 12, overflow: 'hidden',
                border: mainImg === img ? '2px solid #FACC15' : '2px solid rgba(255,255,255,0.1)',
                padding: 0, cursor: 'pointer', flexShrink: 0,
                opacity: mainImg === img ? 1 : 0.6,
                transition: 'all 0.15s',
              }}
            >
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)',
          margin: '0 0 16px', fontWeight: 600,
        }}>
          {desc.slice(0, 500)}
        </p>

        {/* Restaurant info strip */}
        <div style={{
          padding: '10px 12px', borderRadius: 12,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block' }}>{restaurant.name}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{restaurant.address ?? restaurant.city ?? ''}</span>
          </div>
          {restaurant.rating != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13, color: '#FACC15' }}>★</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{restaurant.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom enquiry button */}
      <div style={{ padding: '12px 14px calc(env(safe-area-inset-bottom, 0px) + 12px)', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => {
            const msg = `Hi ${restaurant.name}, I'd like to enquire about ${data.enquiry}. Please share details about availability, packages, and pricing.`
            window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(msg)}`, '_blank')
          }}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            background: '#FACC15', border: 'none', color: '#000',
            fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Enquire via WhatsApp
        </button>
      </div>
    </div>
  )
}

export default function EventsDrawer({ restaurant, onClose, onOrderViaChat }) {
  const [openDetail, setOpenDetail] = useState(null) // { data, key }
  const features = restaurant.event_features ?? []
  const hasTourPkg = restaurant.tour_guide_package || restaurant.seating_capacity >= 30

  // Load vendor-uploaded event data
  let vendorEvents = {}
  try { vendorEvents = JSON.parse(localStorage.getItem('indoo_vendor_events') || '{}') } catch {}

  // Build the list of cards to show
  const cards = []
  if (restaurant.seating_capacity) {
    cards.push({ key: 'seating', data: EVENT_DATA.seating })
  }
  if (restaurant.catering_available) {
    cards.push({ key: 'catering', data: EVENT_DATA.catering })
  }
  features.forEach(f => {
    if (EVENT_DATA[f]) cards.push({ key: f, data: EVENT_DATA[f] })
  })
  if (hasTourPkg) {
    cards.push({ key: 'tour_guide', data: EVENT_DATA.tour_guide })
  }

  // Also add any vendor-enabled events not already in the list
  Object.entries(vendorEvents).forEach(([id, data]) => {
    if (data.enabled && !cards.find(c => c.key === id) && EVENT_DATA[id]) {
      cards.push({ key: id, data: EVENT_DATA[id] })
    }
  })

  const isEmpty = cards.length === 0

  return (
    <div className={styles.panelBackdrop} onClick={onClose}>
      <div className={styles.infoPanel} onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Detail overlay — slides over the cards */}
        {openDetail && (
          <EventDetail
            data={openDetail.data}
            vendorData={vendorEvents[openDetail.key] ?? null}
            restaurant={restaurant}
            onClose={() => setOpenDetail(null)}
          />
        )}

        {/* Header */}
        <div style={{ flexShrink: 0, marginBottom: 14 }}>
          <h3 className={styles.infoPanelTitle}>Events & Venue</h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontWeight: 700 }}>{restaurant.name}</p>
        </div>

        {/* Scrollable cards */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
          {isEmpty ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
              <span style={{ fontSize: 48, marginBottom: 16 }}>🎪</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>No events yet</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                This restaurant hasn't set up any event or venue packages yet. Check back later or enquire directly.
              </span>
            </div>
          ) : (
            cards.map(c => {
              // Use vendor's first image as card image if uploaded
              const vd = vendorEvents[c.key]
              const cardData = (vd?.images?.length > 0) ? { ...c.data, img: vd.images[0] } : c.data
              return (
                <EventCard
                  key={c.key}
                  data={cardData}
                  rating={restaurant.rating}
                  onOpen={() => setOpenDetail({ data: c.data, key: c.key })}
                />
              )
            })
          )}
        </div>

        {/* General enquiry button */}
        <button
          className={styles.eventEnquiryBtn}
          style={{ flexShrink: 0 }}
          onClick={() => {
            if (onOrderViaChat) {
              onOrderViaChat({ restaurant, items: [], subtotal: 0, deliveryFee: 0, total: 0, notes: 'Event enquiry — please send details about availability and packages.', ref: `#EVENT_${Date.now().toString().slice(-6)}` })
            } else {
              const msg = `Hi ${restaurant.name}, I'd like to enquire about hosting an event at your venue. Please send me details about availability and packages.`
              window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(msg)}`, '_blank')
            }
          }}
        >
          💬 Enquire via Chat
        </button>
      </div>
    </div>
  )
}
