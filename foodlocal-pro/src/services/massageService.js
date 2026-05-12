/**
 * Massage Service — therapist profiles, bookings, reviews.
 * Demo mode with localStorage. Production uses Supabase.
 */

const STORAGE_KEY = 'indoo_massage_therapists'
const BOOKINGS_KEY = 'indoo_massage_bookings'

export const MASSAGE_TYPES = [
  'Traditional', 'Swedish', 'Deep Tissue', 'Thai', 'Balinese',
  'Shiatsu', 'Hot Stone', 'Aromatherapy', 'Sports', 'Reflexology',
]

export const AVAILABILITY = {
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  OFFLINE: 'Offline',
}

// Demo therapist profiles
const DEMO_THERAPISTS = [
  {
    id: 'th1', name: 'Dewi Sari', age: 28, yearsOfExperience: 6,
    profileImage: 'https://i.pravatar.cc/300?img=45',
    description: 'Certified Balinese massage therapist with 6+ years experience. Specialized in deep tissue and aromatherapy techniques. Available for home, hotel, and villa services.',
    location: 'Yogyakarta', area: 'Sleman',
    lat: -7.7713, lng: 110.3776,
    massageTypes: ['Balinese', 'Deep Tissue', 'Aromatherapy'],
    price60: 150000, price90: 200000, price120: 250000,
    rating: 4.9, reviewCount: 87,
    status: 'Available', isVerified: true, isLive: true,
    clientPreferences: 'All',
    languages: ['Indonesian', 'English'],
    phone: '+6281234567890',
    menu: [
      { name: 'Balinese Massage', price60: 150000, price90: 200000, price120: 250000 },
      { name: 'Deep Tissue', price60: 175000, price90: 225000, price120: 275000 },
      { name: 'Aromatherapy', price60: 160000, price90: 210000, price120: 260000 },
      { name: 'Hot Stone', price60: 200000, price90: 275000, price120: 350000 },
      { name: 'Reflexology', price60: 120000, price90: 0, price120: 0 },
    ],
  },
  {
    id: 'th2', name: 'Putu Ayu', age: 32, yearsOfExperience: 10,
    profileImage: 'https://i.pravatar.cc/300?img=47',
    description: 'Master therapist trained in traditional Javanese and Thai techniques. 10 years serving international clients.',
    location: 'Yogyakarta', area: 'Kraton',
    lat: -7.8052, lng: 110.3642,
    massageTypes: ['Thai', 'Traditional', 'Swedish'],
    price60: 180000, price90: 250000, price120: 300000,
    rating: 4.8, reviewCount: 124,
    status: 'Available', isVerified: true, isLive: true,
    clientPreferences: 'Females Only',
    languages: ['Indonesian', 'English', 'Japanese'],
    phone: '+6281234567891',
    menu: [
      { name: 'Thai Massage', price60: 180000, price90: 250000, price120: 300000 },
      { name: 'Traditional Javanese', price60: 160000, price90: 220000, price120: 280000 },
      { name: 'Swedish Relaxation', price60: 170000, price90: 230000, price120: 290000 },
    ],
  },
  {
    id: 'th3', name: 'Wayan Surya', age: 35, yearsOfExperience: 12,
    profileImage: 'https://i.pravatar.cc/300?img=52',
    description: 'Sports massage specialist with background in physiotherapy. Ideal for athletes and active individuals. Deep tissue and sports recovery focus.',
    location: 'Yogyakarta', area: 'Gejayan',
    lat: -7.7838, lng: 110.3775,
    massageTypes: ['Sports', 'Deep Tissue', 'Swedish'],
    price60: 200000, price90: 275000, price120: 350000,
    rating: 4.7, reviewCount: 56,
    status: 'Busy', isVerified: true, isLive: true,
    clientPreferences: 'All',
    languages: ['Indonesian', 'English'],
    phone: '+6281234567892',
    menu: [
      { name: 'Sports Recovery', price60: 200000, price90: 275000, price120: 350000 },
      { name: 'Deep Tissue', price60: 190000, price90: 260000, price120: 330000 },
      { name: 'Swedish', price60: 175000, price90: 240000, price120: 300000 },
      { name: 'Cupping Therapy', price60: 220000, price90: 0, price120: 0 },
    ],
    busyUntil: new Date(Date.now() + 45 * 60000).toISOString(),
  },
  {
    id: 'th4', name: 'Nia Rahmawati', age: 26, yearsOfExperience: 4,
    profileImage: 'https://i.pravatar.cc/300?img=44',
    description: 'Specializing in relaxation and aromatherapy massage. Trained at Bali International Spa Academy. Gentle, calming techniques for stress relief.',
    location: 'Yogyakarta', area: 'Prawirotaman',
    lat: -7.8127, lng: 110.3677,
    massageTypes: ['Aromatherapy', 'Swedish', 'Hot Stone'],
    price60: 130000, price90: 175000, price120: 220000,
    rating: 4.6, reviewCount: 34,
    status: 'Available', isVerified: false, isLive: true,
    clientPreferences: 'All',
    languages: ['Indonesian'],
    phone: '+6281234567893',
    menu: [
      { name: 'Aromatherapy Bliss', price60: 130000, price90: 175000, price120: 220000 },
      { name: 'Swedish Relaxation', price60: 125000, price90: 170000, price120: 215000 },
      { name: 'Hot Stone Therapy', price60: 160000, price90: 210000, price120: 260000 },
    ],
  },
  {
    id: 'th5', name: 'Kadek Yoga', age: 30, yearsOfExperience: 8,
    profileImage: 'https://i.pravatar.cc/300?img=53',
    description: 'Hotel and villa massage specialist. Expert in Balinese, hot stone and reflexology. Premium service for discerning clients.',
    location: 'Yogyakarta', area: 'Malioboro',
    lat: -7.7928, lng: 110.3653,
    massageTypes: ['Balinese', 'Hot Stone', 'Reflexology'],
    price60: 175000, price90: 230000, price120: 280000,
    rating: 4.9, reviewCount: 98,
    status: 'Available', isVerified: true, isLive: true,
    clientPreferences: 'All',
    languages: ['Indonesian', 'English', 'Mandarin'],
    phone: '+6281234567894',
    menu: [
      { name: 'Balinese Traditional', price60: 175000, price90: 230000, price120: 280000 },
      { name: 'Hot Stone Premium', price60: 225000, price90: 300000, price120: 375000 },
      { name: 'Reflexology', price60: 120000, price90: 160000, price120: 0 },
      { name: 'Couples Massage', price60: 0, price90: 400000, price120: 500000 },
      { name: 'Prenatal Massage', price60: 150000, price90: 200000, price120: 0 },
      { name: 'Head & Shoulder', price60: 100000, price90: 0, price120: 0 },
    ],
  },
  {
    id: 'th6', name: 'Sri Wahyuni', age: 29, yearsOfExperience: 7,
    profileImage: 'https://i.pravatar.cc/300?img=46',
    description: 'Traditional Javanese massage expert. Specializes in prenatal massage and women-only services. Gentle yet effective techniques passed down through generations.',
    location: 'Yogyakarta', area: 'Kaliurang',
    lat: -7.6035, lng: 110.4240,
    massageTypes: ['Traditional', 'Shiatsu', 'Reflexology'],
    price60: 140000, price90: 190000, price120: 240000,
    rating: 4.8, reviewCount: 67,
    status: 'Offline', isVerified: true, isLive: false,
    clientPreferences: 'Females Only',
    languages: ['Indonesian', 'Javanese'],
    phone: '+6281234567895',
    menu: [
      { name: 'Traditional Javanese', price60: 140000, price90: 190000, price120: 240000 },
      { name: 'Shiatsu', price60: 155000, price90: 210000, price120: 260000 },
      { name: 'Reflexology', price60: 110000, price90: 150000, price120: 0 },
      { name: 'Prenatal Massage', price60: 145000, price90: 195000, price120: 0 },
    ],
  },
]

export function getTherapists() { return DEMO_THERAPISTS }

export function getTherapistById(id) {
  return DEMO_THERAPISTS.find(t => t.id === id) || null
}

export function searchTherapists({ query, massageType, city, status }) {
  let results = DEMO_THERAPISTS
  if (query) {
    const q = query.toLowerCase()
    results = results.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.area.toLowerCase().includes(q) ||
      t.massageTypes.some(m => m.toLowerCase().includes(q))
    )
  }
  if (massageType && massageType !== 'all') {
    results = results.filter(t => t.massageTypes.includes(massageType))
  }
  if (status && status !== 'all') {
    results = results.filter(t => t.status === status)
  }
  return results
}

export function fmtPrice(n) {
  if (!n) return '-'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
