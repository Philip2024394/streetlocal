/**
 * TransportProximity — Section showing nearby transit options with connectivity score.
 */
import { useState, useMemo } from 'react'

const ICON_IMAGES = {
  '🚇': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafd-removebg-preview.png',
  '🚂': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafd-removebg-preview.png',
  '🚌': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdss-removebg-preview.png',
  '🚈': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafd-removebg-preview.png',
  '✈️': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdsssss-removebg-preview.png',
  '🚐': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddfsafdss-removebg-preview.png',
}
function TransitIcon({ emoji, size = 22 }) {
  const img = ICON_IMAGES[emoji]
  if (img) return <img src={img} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
  return <span style={{ fontSize: size - 2 }}>{emoji}</span>
}

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
}

const TRANSIT_DATA = {
  Jakarta: [
    { name: 'MRT Bundaran HI', type: 'MRT', dist: 1.5, icon: '🚇' },
    { name: 'MRT Dukuh Atas', type: 'MRT', dist: 2.0, icon: '🚇' },
    { name: 'MRT Blok M', type: 'MRT', dist: 3.5, icon: '🚇' },
    { name: 'KRL Sudirman', type: 'KRL', dist: 2.5, icon: '🚂' },
    { name: 'KRL Tanah Abang', type: 'KRL', dist: 3.0, icon: '🚂' },
    { name: 'TransJakarta Sarinah', type: 'BRT', dist: 0.8, icon: '🚌' },
    { name: 'LRT Cawang', type: 'LRT', dist: 6.0, icon: '🚈' },
  ],
  Yogyakarta: [
    { name: 'Stasiun Tugu', type: 'KRL', dist: 2.1, icon: '🚂' },
    { name: 'Stasiun Lempuyangan', type: 'KRL', dist: 3.2, icon: '🚂' },
    { name: 'Halte TransJogja Malioboro', type: 'BRT', dist: 0.8, icon: '🚌' },
    { name: 'Halte TransJogja UGM', type: 'BRT', dist: 2.5, icon: '🚌' },
    { name: 'Terminal Giwangan', type: 'Bus', dist: 5.0, icon: '🚌' },
  ],
  Bali: [
    { name: 'Terminal Ubung', type: 'Bus', dist: 5.0, icon: '🚌' },
    { name: 'Terminal Mengwi', type: 'Bus', dist: 12.0, icon: '🚌' },
    { name: 'Bandara Ngurah Rai', type: 'Airport', dist: 15.0, icon: '✈️' },
  ],
  Surabaya: [
    { name: 'Stasiun Gubeng', type: 'KRL', dist: 3.0, icon: '🚂' },
    { name: 'Stasiun Pasar Turi', type: 'KRL', dist: 4.0, icon: '🚂' },
    { name: 'Halte Suroboyo Bus', type: 'Bus', dist: 1.5, icon: '🚌' },
    { name: 'Terminal Purabaya', type: 'Bus', dist: 10.0, icon: '🚌' },
  ],
  Bandung: [
    { name: 'Stasiun Bandung', type: 'KRL', dist: 2.0, icon: '🚂' },
    { name: 'Terminal Cicaheum', type: 'Bus', dist: 5.0, icon: '🚌' },
    { name: 'Trans Metro Bandung', type: 'BRT', dist: 1.0, icon: '🚌' },
  ],
  Semarang: [
    { name: 'Stasiun Tawang', type: 'KRL', dist: 3.0, icon: '🚂' },
    { name: 'Stasiun Poncol', type: 'KRL', dist: 4.0, icon: '🚂' },
    { name: 'Trans Semarang', type: 'BRT', dist: 1.5, icon: '🚌' },
  ],
}

const DEFAULT_TRANSIT = [
  { name: 'Local Bus Terminal', type: 'Bus', dist: 3.0, icon: '🚌' },
  { name: 'Nearest Train Station', type: 'KRL', dist: 8.0, icon: '🚂' },
]

function getDistColor(km) {
  if (km <= 0.5) return '#8DC63F'
  if (km <= 1) return '#FACC15'
  if (km <= 3) return '#60A5FA'
  return 'rgba(255,255,255,0.4)'
}

function getWalkTime(km) {
  const mins = Math.round(km * 12)
  if (mins <= 45) return `${mins} min walk`
  return `${Math.round(km * 3)} min drive`
}

export default function TransportProximity({ listing }) {
  if (!listing) return null

  const cityKey = Object.keys(TRANSIT_DATA).find(c => listing.city?.includes(c))
  const stations = cityKey ? TRANSIT_DATA[cityKey] : DEFAULT_TRANSIT

  // Connectivity score
  const nearbyCount = stations.filter(s => s.dist <= 3).length
  const hasRail = stations.some(s => ['MRT', 'KRL', 'LRT'].includes(s.type))
  const score = Math.min(100, Math.round(nearbyCount * 12 + (hasRail ? 25 : 0) + 15))

  const noRail = !hasRail && !cityKey?.includes('Jakarta')

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🚇</span> Transport Nearby
        {/* Score circle */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `conic-gradient(${score >= 60 ? '#8DC63F' : score >= 30 ? '#FACC15' : '#EF4444'} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: score >= 60 ? '#8DC63F' : score >= 30 ? '#FACC15' : '#EF4444' }}>{score}</div>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, lineHeight: 1.2 }}>Transit<br />Score</span>
        </div>
      </div>

      {noRail && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
          ℹ️ No rail transit (MRT/KRL/LRT) available in this area. Nearest options shown below.
        </div>
      )}

      <div style={{ ...glass, overflow: 'hidden' }}>
        {stations.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderBottom: i < stations.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
          }}>
            <span style={{ width: 28, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TransitIcon emoji={s.icon} size={22} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{getWalkTime(s.dist)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: getDistColor(s.dist) }}>{s.dist} km</div>
              <div style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: 3, display: 'inline-block' }}>{s.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
