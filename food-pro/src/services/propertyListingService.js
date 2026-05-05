/**
 * Property Listing Service
 * Handles property listings for House, Villa, Kos, Factory/Warehouse.
 * No in-app payments — owners transfer commission to admin directly.
 * Commission: tracked in admin dashboard only, never shown to users.
 */

// Certificate types with legal status
export const CERTIFICATE_TYPES = [
  { id: 'shm',     label: 'SHM',        full: 'Sertifikat Hak Milik',    type: 'freehold',  color: '#8DC63F', foreignEligible: false },
  { id: 'hgb',     label: 'HGB',        full: 'Hak Guna Bangunan',       type: 'leasehold', color: '#FACC15', foreignEligible: false },
  { id: 'hp',      label: 'Hak Pakai',  full: 'Hak Pakai',               type: 'leasehold', color: '#60A5FA', foreignEligible: true },
  { id: 'shmsrs',  label: 'SHMSRS',     full: 'Strata Title',            type: 'freehold',  color: '#8DC63F', foreignEligible: true },
  { id: 'hgu',     label: 'HGU',        full: 'Hak Guna Usaha',          type: 'leasehold', color: '#FACC15', foreignEligible: false },
  { id: 'girik',   label: 'Girik',      full: 'Girik (Unregistered)',     type: 'warning',   color: '#EF4444', foreignEligible: false },
  { id: 'ajb',     label: 'AJB',        full: 'Akta Jual Beli',          type: 'warning',   color: '#F59E0B', foreignEligible: false },
  { id: 'ppjb',    label: 'PPJB',       full: 'Pre-Sale Agreement',       type: 'warning',   color: '#F59E0B', foreignEligible: false },
  { id: 'sewa',    label: 'Hak Sewa',   full: 'Lease Agreement',          type: 'leasehold', color: '#60A5FA', foreignEligible: true },
]

// Property categories with their specific fields
export const PROPERTY_CATEGORIES = {
  house: {
    id: 'house', label: 'Rumah', icon: '🏠',
    specs: ['bedrooms', 'bathrooms', 'land_area', 'building_area', 'floors', 'garage', 'carport', 'furnished', 'facing', 'house_type', 'year_built', 'condition'],
    primarySpecs: ['bedrooms', 'bathrooms', 'building_area', 'land_area'],
  },
  villa: {
    id: 'villa', label: 'Villa', icon: '🏖️',
    specs: ['bedrooms', 'bathrooms', 'land_area', 'building_area', 'pool', 'view_type', 'guest_capacity', 'staff_included', 'furnished', 'year_built'],
    primarySpecs: ['bedrooms', 'pool', 'view_type', 'guest_capacity'],
  },
  kos: {
    id: 'kos', label: 'Kos', icon: '🏘️',
    specs: ['gender_type', 'room_size', 'available_rooms', 'ac', 'wifi', 'bathroom_type', 'parking', 'deposit', 'min_duration'],
    primarySpecs: ['gender_type', 'ac', 'wifi', 'bathroom_type'],
  },
  factory: {
    id: 'factory', label: 'Pabrik', icon: '🏭',
    specs: ['land_area', 'building_area', 'power_kva', 'ceiling_height', 'loading_dock', 'truck_access', 'zoning', 'water_source', 'ipal'],
    primarySpecs: ['land_area', 'building_area', 'power_kva', 'zoning'],
  },
}

// Spec display config
export const SPEC_CONFIG = {
  bedrooms:       { icon: '🛏️', label: 'KT',        suffix: '' },
  bathrooms:      { icon: '🚿', label: 'KM',        suffix: '' },
  land_area:      { icon: '📏', label: 'Tanah',     suffix: 'm²' },
  building_area:  { icon: '📐', label: 'Bangunan',  suffix: 'm²' },
  floors:         { icon: '🏢', label: 'Lantai',    suffix: '' },
  garage:         { icon: '🚗', label: 'Garasi',    suffix: '' },
  carport:        { icon: '🅿️', label: 'Carport',   suffix: '' },
  pool:           { icon: '🏊', label: 'Pool',      suffix: '', boolean: true },
  view_type:      { icon: '🏔️', label: 'View',      suffix: '' },
  guest_capacity: { icon: '👥', label: 'Max',       suffix: ' tamu' },
  staff_included: { icon: '👨‍🍳', label: 'Staff',    suffix: '', boolean: true },
  gender_type:    { icon: '👤', label: '',          suffix: '' },
  room_size:      { icon: '📐', label: 'Kamar',     suffix: 'm²' },
  available_rooms:{ icon: '🚪', label: 'Tersedia',  suffix: ' kamar' },
  ac:             { icon: '❄️', label: 'AC',        suffix: '', boolean: true },
  wifi:           { icon: '📶', label: 'WiFi',      suffix: '', boolean: true },
  bathroom_type:  { icon: '🚿', label: '',          suffix: '' },
  parking:        { icon: '🅿️', label: 'Parkir',    suffix: '', boolean: true },
  deposit:        { icon: '💰', label: 'Deposit',   suffix: '' },
  min_duration:   { icon: '📅', label: 'Min',       suffix: ' bulan' },
  power_kva:      { icon: '⚡', label: '',          suffix: ' kVA' },
  ceiling_height: { icon: '📏', label: 'Tinggi',    suffix: 'm' },
  loading_dock:   { icon: '🚛', label: 'Dock',      suffix: '', boolean: true },
  truck_access:   { icon: '🚚', label: 'Truk',      suffix: '', boolean: true },
  zoning:         { icon: '🏭', label: 'Zonasi',    suffix: '' },
  water_source:   { icon: '💧', label: 'Air',       suffix: '' },
  ipal:           { icon: '♻️', label: 'IPAL',      suffix: '', boolean: true },
  furnished:      { icon: '🛋️', label: '',          suffix: '' },
  facing:         { icon: '🧭', label: 'Hadap',     suffix: '' },
  house_type:     { icon: '🏠', label: 'Tipe',      suffix: '' },
  year_built:     { icon: '📆', label: 'Tahun',     suffix: '' },
  condition:      { icon: '✅', label: '',          suffix: '' },
}

// Proximity tags
export const PROXIMITY_TAGS = [
  { id: 'transport',  label: 'Dekat Transportasi', icon: '🚉' },
  { id: 'school',     label: 'Dekat Sekolah',      icon: '🏫' },
  { id: 'shopping',   label: 'Dekat Mall',          icon: '🛒' },
  { id: 'hospital',   label: 'Dekat RS',            icon: '🏥' },
  { id: 'mosque',     label: 'Dekat Masjid',        icon: '🕌' },
  { id: 'beach',      label: 'Dekat Pantai',        icon: '🏖️' },
  { id: 'toll',       label: 'Dekat Tol',           icon: '🛣️' },
  { id: 'flood_free', label: 'Bebas Banjir',        icon: '✅' },
]

// Quick labels
export const QUICK_LABELS = [
  { id: 'siap_huni',   label: 'Siap Huni',         color: '#8DC63F' },
  { id: 'bisa_nego',   label: 'Bisa Nego',         color: '#FACC15' },
  { id: 'komplek',     label: 'Komplek Perumahan',  color: '#60A5FA' },
  { id: 'cocok_usaha', label: 'Cocok untuk Usaha',  color: '#F59E0B' },
  { id: 'cocok_kos',   label: 'Cocok untuk Kos',    color: '#A855F7' },
]

// Demo property listings
export const DEMO_PROPERTIES = [
  {
    id: 'prop-001',
    category: 'house',
    listing_type: 'sale',
    title: 'Rumah Minimalis 3KT di Sleman',
    description: 'Rumah baru minimalis modern, lokasi strategis dekat kampus UGM. Lingkungan aman dan nyaman, akses jalan mudah.',
    price: 850000000,
    negotiable: true,
    city: 'Sleman, Yogyakarta',
    address: 'Jl. Kaliurang KM 8, Sleman',
    lat: -7.7490, lng: 110.3820,
    certificate: 'shm',
    certificate_years: null,
    building_permit: 'PBG',
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'],
    specs: { bedrooms: 3, bathrooms: 2, land_area: 150, building_area: 100, floors: 2, garage: 1, carport: 1, furnished: 'Semi Furnished', facing: 'Selatan', house_type: 'Tipe 100', year_built: 2024, condition: 'Baru' },
    facilities: ['AC', 'Water Heater', 'CCTV', 'Taman'],
    proximity: ['school', 'shopping', 'transport'],
    labels: ['siap_huni', 'bisa_nego'],
    electricity: '2200W',
    water_source: 'PDAM',
    owner: { name: 'Pak Hendra', phone: '081234567890', photo: 'https://i.pravatar.cc/200?img=12', verified: true, type: 'owner', joined: '2025-03' },
    created_at: '2026-04-28', updated_at: '2026-04-30',
    views: 234, saves: 18,
  },
  {
    id: 'prop-002',
    category: 'villa',
    listing_type: 'rent',
    title: 'Villa Mewah Pool View Sawah Ubud Style',
    description: 'Villa fully furnished dengan private pool, pemandangan sawah. Cocok untuk liburan keluarga atau investasi Airbnb.',
    price: 15000000,
    price_period: 'month',
    negotiable: false,
    city: 'Sleman, Yogyakarta',
    address: 'Jl. Palagan KM 12, Sleman',
    lat: -7.7100, lng: 110.3700,
    certificate: 'hgb',
    certificate_years: 22,
    building_permit: 'PBG',
    images: ['https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600'],
    specs: { bedrooms: 4, bathrooms: 3, land_area: 500, building_area: 250, pool: true, view_type: 'Rice Field', guest_capacity: 8, staff_included: true, furnished: 'Fully Furnished', year_built: 2022 },
    facilities: ['AC', 'WiFi', 'Pool', 'Garden', 'BBQ', 'Parking'],
    proximity: ['beach', 'shopping'],
    labels: [],
    electricity: '5500W',
    owner: { name: 'Bu Sari', phone: '081298765432', photo: 'https://i.pravatar.cc/200?img=5', verified: true, type: 'owner', joined: '2024-11' },
    created_at: '2026-04-25', updated_at: '2026-04-29',
    views: 567, saves: 45,
  },
  {
    id: 'prop-003',
    category: 'kos',
    listing_type: 'rent',
    title: 'Kos Putri AC WiFi Dekat UGM',
    description: 'Kos eksklusif putri, full furnished, kamar mandi dalam, AC, WiFi. Lokasi strategis 5 menit ke kampus UGM.',
    price: 1500000,
    price_period: 'month',
    negotiable: false,
    city: 'Sleman, Yogyakarta',
    address: 'Jl. Colombo No. 15, Caturtunggal',
    lat: -7.7750, lng: 110.3850,
    certificate: 'shm',
    certificate_years: null,
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600'],
    specs: { gender_type: 'Putri', room_size: 12, available_rooms: 3, ac: true, wifi: true, bathroom_type: 'KM Dalam', parking: true, deposit: 1500000, min_duration: 6 },
    facilities: ['AC', 'WiFi', 'KM Dalam', 'Parkir Motor', 'Dapur Bersama', 'CCTV'],
    proximity: ['school', 'shopping', 'transport'],
    labels: [],
    rules: { overnight_guests: false, pets: false, curfew: '23:00', smoking: false },
    owner: { name: 'Bu Ratna', phone: '081356789012', photo: 'https://i.pravatar.cc/200?img=9', verified: true, type: 'owner', joined: '2025-06' },
    created_at: '2026-04-20', updated_at: '2026-04-30',
    views: 890, saves: 67,
  },
  {
    id: 'prop-004',
    category: 'factory',
    listing_type: 'rent',
    title: 'Pabrik 3000m² Kawasan Industri Sentolo',
    description: 'Pabrik siap operasi dengan loading dock, akses kontainer, daya listrik 200kVA. Lokasi kawasan industri resmi.',
    price: 75000000,
    price_period: 'month',
    negotiable: true,
    city: 'Kulon Progo, Yogyakarta',
    address: 'Kawasan Industri Sentolo, Kulon Progo',
    lat: -7.8200, lng: 110.2300,
    certificate: 'hgb',
    certificate_years: 18,
    building_permit: 'PBG + SLF',
    images: ['https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600'],
    specs: { land_area: 5000, building_area: 3000, power_kva: 200, ceiling_height: 8, loading_dock: true, truck_access: true, zoning: 'Industri', water_source: 'PDAM + Sumur Bor', ipal: true },
    facilities: ['Loading Dock', 'Truck Access', 'IPAL', 'Security 24h', 'CCTV'],
    proximity: ['toll'],
    labels: [],
    electricity: '200kVA',
    owner: { name: 'Pak Widodo', phone: '081467890123', photo: 'https://i.pravatar.cc/200?img=18', verified: true, type: 'owner', joined: '2025-01' },
    created_at: '2026-04-15', updated_at: '2026-04-28',
    views: 123, saves: 8,
  },
  {
    id: 'prop-005',
    category: 'house',
    listing_type: 'rent',
    title: 'Rumah Furnished 4KT Dekat Malioboro',
    description: 'Rumah fully furnished, lokasi strategis 10 menit ke Malioboro. Cocok untuk keluarga expatriat.',
    price: 8000000,
    price_period: 'month',
    negotiable: true,
    city: 'Yogyakarta',
    address: 'Jl. Prawirotaman, Yogyakarta',
    lat: -7.8100, lng: 110.3650,
    certificate: 'hp',
    certificate_years: 25,
    building_permit: 'IMB',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'],
    specs: { bedrooms: 4, bathrooms: 3, land_area: 200, building_area: 180, floors: 2, garage: 2, furnished: 'Fully Furnished', facing: 'Timur', year_built: 2020, condition: 'Bagus' },
    facilities: ['AC', 'Water Heater', 'WiFi', 'Garden', 'CCTV', 'Parking'],
    proximity: ['shopping', 'transport', 'mosque'],
    labels: ['siap_huni'],
    electricity: '3500W',
    water_source: 'PDAM',
    owner: { name: 'Pak Ahmad', phone: '081578901234', photo: 'https://i.pravatar.cc/200?img=22', verified: true, type: 'owner', joined: '2024-08' },
    created_at: '2026-04-22', updated_at: '2026-04-30',
    views: 445, saves: 32,
    foreigner_eligible: true,
  },
]

// Format price
export function fmtPropertyPrice(price, type, period) {
  const formatted = 'Rp ' + Number(price).toLocaleString('id-ID').replace(/,/g, '.')
  if (type === 'rent') {
    return { main: formatted, sub: period === 'year' ? '/tahun' : '/bulan' }
  }
  return { main: formatted, sub: '' }
}

// Get certificate info
export function getCertificateInfo(certId) {
  return CERTIFICATE_TYPES.find(c => c.id === certId) || CERTIFICATE_TYPES[0]
}

// Get category config
export function getCategoryConfig(catId) {
  return PROPERTY_CATEGORIES[catId] || PROPERTY_CATEGORIES.house
}

// Get properties by category
export function getPropertiesByCategory(category, listingType) {
  let results = DEMO_PROPERTIES
  if (category && category !== 'all') results = results.filter(p => p.category === category)
  if (listingType === 'sale') results = results.filter(p => p.listing_type === 'sale')
  if (listingType === 'rent') results = results.filter(p => p.listing_type === 'rent')
  return results
}

// Search properties
export function searchProperties(query) {
  const q = query.toLowerCase().trim()
  if (!q) return DEMO_PROPERTIES
  return DEMO_PROPERTIES.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.city.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  )
}
