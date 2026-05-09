/**
 * NeighborhoodGuide — Section showing nearby POIs and area information.
 */
import { useState } from 'react'

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
}

const ICON_IMAGES = {
  '🚌': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdss-removebg-preview.png',
  '🚂': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafd-removebg-preview.png',
  '✈️': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssss-removebg-preview.png',
  '🏬': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssssds-removebg-preview.png',
  '🏫': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssssdssdads-removebg-preview.png',
  '🛍️': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssssdssdadssa-removebg-preview.png',
  '🏪': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssssdssdadssa-removebg-preview.png',
  '🌳': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssssdssdadssadsds-removebg-preview.png',
  '🚇': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafd-removebg-preview.png',
  '🚈': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafd-removebg-preview.png',
  '🏛️': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssssdssdadssadsdsqww-removebg-preview.png',
  '🏰': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssssdssdadssadsdsqww-removebg-preview.png',
  '👑': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssssdssdadssadsdsqww-removebg-preview.png',
}

function PoiIcon({ emoji, size = 22 }) {
  const img = ICON_IMAGES[emoji]
  if (img) return <img src={img} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
  return <span style={{ fontSize: size - 2 }}>{emoji}</span>
}

const CATEGORIES = [
  { id: 'transport', icon: '🚇', label: 'Transport' },
  { id: 'shopping', icon: '🛒', label: 'Shopping' },
  { id: 'education', icon: '🎓', label: 'Education' },
  { id: 'health', icon: '🏥', label: 'Health' },
  { id: 'dining', icon: '🍽️', label: 'Dining' },
  { id: 'lifestyle', icon: '🎭', label: 'Lifestyle' },
]

const POI_DATA = {
  Yogyakarta: {
    transport: [
      { name: 'Stasiun Tugu', type: 'KRL', dist: 2.1, icon: '🚂' },
      { name: 'Halte TransJogja Malioboro', type: 'Bus', dist: 0.8, icon: '🚌' },
      { name: 'Stasiun Lempuyangan', type: 'KRL', dist: 3.2, icon: '🚂' },
      { name: 'Bandara Adisucipto', type: 'Airport', dist: 8.5, icon: '✈️' },
    ],
    shopping: [
      { name: 'Malioboro Mall', type: 'Mall', dist: 1.2, icon: '🏬' },
      { name: 'Hartono Mall', type: 'Mall', dist: 4.5, icon: '🏬' },
      { name: 'Mirota Batik', type: 'Market', dist: 1.8, icon: '🛍️' },
      { name: 'Pasar Beringharjo', type: 'Traditional', dist: 1.5, icon: '🏪' },
    ],
    education: [
      { name: 'UGM (Gadjah Mada)', type: 'University', dist: 3.0, icon: '🏫' },
      { name: 'UNY', type: 'University', dist: 4.2, icon: '🏫' },
      { name: 'UII', type: 'University', dist: 7.0, icon: '🏫' },
      { name: 'SD Negeri 1', type: 'School', dist: 0.5, icon: '📚' },
    ],
    health: [
      { name: 'RS Sardjito', type: 'Hospital', dist: 3.5, icon: '🏥' },
      { name: 'RS Panti Rapih', type: 'Hospital', dist: 2.0, icon: '🏥' },
      { name: 'Apotek Kimia Farma', type: 'Pharmacy', dist: 0.6, icon: '💊' },
    ],
    dining: [
      { name: 'Gudeg Yu Djum', type: 'Local', dist: 1.0, icon: '🍛' },
      { name: 'Mediterania Restaurant', type: 'Fine Dining', dist: 2.3, icon: '🍽️' },
      { name: 'Angkringan Tugu', type: 'Street Food', dist: 1.8, icon: '🥘' },
    ],
    lifestyle: [
      { name: 'Taman Sari Water Castle', type: 'Heritage', dist: 2.0, icon: '🏰' },
      { name: 'Alun-Alun Kidul', type: 'Park', dist: 2.5, icon: '🌳' },
      { name: 'Keraton Yogyakarta', type: 'Culture', dist: 2.2, icon: '👑' },
    ],
  },
  Bali: {
    transport: [
      { name: 'Bandara I Gusti Ngurah Rai', type: 'Airport', dist: 12.0, icon: '✈️' },
      { name: 'Terminal Ubung', type: 'Bus', dist: 5.0, icon: '🚌' },
      { name: 'Shuttle Perama', type: 'Shuttle', dist: 2.5, icon: '🚐' },
    ],
    shopping: [
      { name: 'Beachwalk Mall', type: 'Mall', dist: 3.0, icon: '🏬' },
      { name: 'Seminyak Square', type: 'Mall', dist: 2.5, icon: '🏬' },
      { name: 'Pasar Ubud', type: 'Traditional', dist: 15.0, icon: '🏪' },
      { name: 'Bintang Supermarket', type: 'Supermarket', dist: 1.0, icon: '🛒' },
    ],
    education: [
      { name: 'Udayana University', type: 'University', dist: 8.0, icon: '🏫' },
      { name: 'Green School Bali', type: 'Int. School', dist: 20.0, icon: '🏫' },
    ],
    health: [
      { name: 'BIMC Hospital', type: 'Hospital', dist: 4.0, icon: '🏥' },
      { name: 'RS Kasih Ibu', type: 'Hospital', dist: 6.0, icon: '🏥' },
      { name: 'Guardian Pharmacy', type: 'Pharmacy', dist: 1.2, icon: '💊' },
    ],
    dining: [
      { name: 'Warung Babi Guling', type: 'Local', dist: 1.5, icon: '🍛' },
      { name: 'La Lucciola', type: 'Fine Dining', dist: 3.0, icon: '🍽️' },
      { name: 'Cafe Organic', type: 'Cafe', dist: 2.0, icon: '☕' },
    ],
    lifestyle: [
      { name: 'Kuta Beach', type: 'Beach', dist: 3.5, icon: '🏖️' },
      { name: 'Waterbom Bali', type: 'Waterpark', dist: 5.0, icon: '🎢' },
      { name: 'Potato Head Beach Club', type: 'Club', dist: 4.0, icon: '🎵' },
    ],
  },
  Jakarta: {
    transport: [
      { name: 'MRT Bundaran HI', type: 'MRT', dist: 1.5, icon: '🚇' },
      { name: 'MRT Dukuh Atas', type: 'MRT', dist: 2.0, icon: '🚇' },
      { name: 'KRL Sudirman', type: 'KRL', dist: 2.5, icon: '🚂' },
      { name: 'TransJakarta Sarinah', type: 'BRT', dist: 0.8, icon: '🚌' },
      { name: 'LRT Cawang', type: 'LRT', dist: 6.0, icon: '🚈' },
    ],
    shopping: [
      { name: 'Grand Indonesia', type: 'Mall', dist: 1.5, icon: '🏬' },
      { name: 'Plaza Indonesia', type: 'Mall', dist: 1.8, icon: '🏬' },
      { name: 'Sarinah', type: 'Mall', dist: 1.0, icon: '🏬' },
    ],
    education: [
      { name: 'Universitas Indonesia', type: 'University', dist: 12.0, icon: '🏫' },
      { name: 'Jakarta Intercultural School', type: 'Int. School', dist: 5.0, icon: '🏫' },
    ],
    health: [
      { name: 'RS Medistra', type: 'Hospital', dist: 2.0, icon: '🏥' },
      { name: 'RS Pondok Indah', type: 'Hospital', dist: 8.0, icon: '🏥' },
    ],
    dining: [
      { name: 'Skye Bar & Restaurant', type: 'Rooftop', dist: 1.5, icon: '🍷' },
      { name: 'Sate Khas Senayan', type: 'Local', dist: 2.0, icon: '🍛' },
    ],
    lifestyle: [
      { name: 'Monas', type: 'Monument', dist: 3.0, icon: '🏛️' },
      { name: 'Ancol Dreamland', type: 'Theme Park', dist: 10.0, icon: '🎢' },
    ],
  },
}

const DEFAULT_POIS = {
  transport: [{ name: 'Bus Terminal', type: 'Bus', dist: 3.0, icon: '🚌' }],
  shopping: [{ name: 'Local Market', type: 'Market', dist: 1.5, icon: '🏪' }],
  education: [{ name: 'Local School', type: 'School', dist: 1.0, icon: '🏫' }],
  health: [{ name: 'Puskesmas', type: 'Clinic', dist: 0.8, icon: '🏥' }],
  dining: [{ name: 'Local Warung', type: 'Local', dist: 0.3, icon: '🍛' }],
  lifestyle: [{ name: 'City Park', type: 'Park', dist: 2.0, icon: '🌳' }],
}

function getWalkTime(km) {
  const mins = Math.round(km * 12)
  return mins <= 60 ? `${mins} min walk` : `${Math.round(km * 3)} min drive`
}

function getDistColor(km) {
  if (km < 0.5) return '#8DC63F'
  if (km < 1) return '#FACC15'
  if (km < 3) return '#60A5FA'
  return 'rgba(255,255,255,0.4)'
}

export default function NeighborhoodGuide({ listing }) {
  const [activeCat, setActiveCat] = useState('transport')

  if (!listing) return null

  const cityKey = Object.keys(POI_DATA).find(c => listing.city?.includes(c)) || null
  const cityPois = cityKey ? POI_DATA[cityKey] : DEFAULT_POIS
  const pois = cityPois[activeCat] || []

  // Walkability score based on number of nearby POIs
  const allPois = Object.values(cityPois).flat()
  const nearbyCount = allPois.filter(p => p.dist < 2).length
  const walkScore = Math.min(95, Math.max(40, Math.round(nearbyCount * 8 + 30)))

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Section Title */}
      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>📍</span> Neighborhood Guide
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `conic-gradient(#8DC63F ${walkScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#8DC63F' }}>{walkScore}</div>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Walk<br />Score</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
            padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: activeCat === cat.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            color: activeCat === cat.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 4,
            outline: activeCat === cat.id ? '1.5px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 14 }}>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* POI List */}
      <div style={{ ...glass, overflow: 'hidden' }}>
        {pois.map((poi, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderBottom: i < pois.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
          }}>
            <span style={{ width: 28, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PoiIcon emoji={poi.icon} size={22} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{poi.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{getWalkTime(poi.dist)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: getDistColor(poi.dist) }}>{poi.dist} km</div>
              <div style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: 3, display: 'inline-block' }}>{poi.type}</div>
            </div>
          </div>
        ))}
        {pois.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No data available for this area</div>
        )}
      </div>
    </div>
  )
}
