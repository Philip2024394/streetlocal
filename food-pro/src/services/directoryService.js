/**
 * Destination Directory Service
 * Real GPS coordinates for Yogyakarta destinations.
 * Pricing: uses pricingService (government-regulated Zone rates) as single source of truth.
 * Under 10km = one-way fare, over 10km = return trip fare.
 */
import { estimateFare, DEFAULT_ZONES, DEFAULT_SETTINGS } from './pricingService'

// City center reference point (Malioboro, Yogyakarta)
const CITY_CENTER = { lat: -7.7928, lng: 110.3653 }
const ONE_WAY_LIMIT_KM = 10

// Haversine distance
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function roundPrice(n) {
  return Math.round(n / 1000) * 1000
}

export function calculateDirectoryPrice(destination, zones, settings) {
  const km = destination.distanceKm
  const z = zones || DEFAULT_ZONES
  const s = settings || DEFAULT_SETTINGS

  return {
    bike: roundPrice(estimateFare('bike_ride', 'Yogyakarta', km, z, s)),
    car: roundPrice(estimateFare('car_taxi', 'Yogyakarta', km, z, s)),
    isReturn: false,
    oneWayKm: km,
    tripKm: km,
  }
}

// ── Yogyakarta Directory ─────────────────────────────────────────────────────
export const DIRECTORY_CATEGORIES = [
  { id: 'airport',    icon: '✈️', label: 'Airports' },
  { id: 'temple',     icon: '🛕', label: 'Temples' },
  { id: 'beach',      icon: '🏖️', label: 'Beaches' },
  { id: 'nightlife',  icon: '🍸', label: 'Nightlife' },
  { id: 'restaurant', icon: '🍽️', label: 'Restaurants' },
  { id: 'art',        icon: '🎨', label: 'Art & Culture' },
  { id: 'hospital',   icon: '🏥', label: 'Hospitals' },
  { id: 'transport',  icon: '🚉', label: 'Transport' },
  { id: 'shopping',   icon: '🛍️', label: 'Shopping' },
  { id: 'university', icon: '🎓', label: 'Universities' },
  { id: 'government', icon: '🏛️', label: 'Government' },
  { id: 'nature',     icon: '🌿', label: 'Nature' },
  { id: 'food',       icon: '🍔', label: 'Food Areas' },
  { id: 'fastfood',   icon: '🍟', label: 'Fast Food' },
  { id: 'gym',        icon: '💪', label: 'Gyms' },
  { id: 'salon',      icon: '💇', label: 'Hair & Beauty' },
  { id: 'spa',        icon: '💆', label: 'Massage & Spa' },
  { id: 'money',      icon: '💱', label: 'Money Exchange' },
  { id: 'dentist',    icon: '🦷', label: 'Dentist' },
  { id: 'karaoke',    icon: '🎤', label: 'Karaoke' },
  { id: 'mall',       icon: '🏬', label: 'Shopping Malls' },
  { id: 'market',     icon: '🏪', label: 'Markets' },
  { id: 'waterpark',  icon: '🏊', label: 'Waterparks' },
  { id: 'bus',        icon: '🚌', label: 'Bus Stations' },
  { id: 'train',      icon: '🚆', label: 'Train Stations' },
  { id: 'pizza',      icon: '🍕', label: 'Pizza' },
  { id: 'chinese',    icon: '🥡', label: 'Chinese Food' },
  { id: 'sushi',      icon: '🍣', label: 'Sushi & Japanese' },
  { id: 'billiards',  icon: '🎱', label: 'Billiards' },
  { id: 'western',    icon: '🥩', label: 'Western Food' },
]

export const YOGYAKARTA_DESTINATIONS = [
  // Airports
  { id: 'jog', name: 'Adisucipto Airport (JOG)', category: 'airport', lat: -7.7882, lng: 110.4317, address: 'Jl. Solo Km 9, Sleman' },
  { id: 'yia', name: 'YIA International Airport', category: 'airport', lat: -7.9008, lng: 110.0577, address: 'Kulon Progo, DIY' },

  // Temples
  { id: 'prambanan', name: 'Prambanan Temple', category: 'temple', lat: -7.7520, lng: 110.4915, address: 'Jl. Raya Solo-Yogya, Sleman' },
  { id: 'borobudur', name: 'Borobudur Temple', category: 'temple', lat: -7.6079, lng: 110.2038, address: 'Magelang, Central Java' },
  { id: 'ratuboko', name: 'Ratu Boko Palace', category: 'temple', lat: -7.7704, lng: 110.4892, address: 'Prambanan, Sleman' },
  { id: 'kraton', name: 'Kraton (Sultan Palace)', category: 'temple', lat: -7.8052, lng: 110.3642, address: 'Jl. Rotowijayan, Kraton' },
  { id: 'tamansari', name: 'Taman Sari Water Castle', category: 'temple', lat: -7.8100, lng: 110.3593, address: 'Jl. Taman, Kraton' },

  // Beaches
  { id: 'parangtritis', name: 'Parangtritis Beach', category: 'beach', lat: -8.0253, lng: 110.3286, address: 'Parangtritis, Bantul' },
  { id: 'timang', name: 'Timang Beach', category: 'beach', lat: -8.1464, lng: 110.6294, address: 'Gunungkidul, DIY' },
  { id: 'indrayanti', name: 'Indrayanti Beach', category: 'beach', lat: -8.1504, lng: 110.6127, address: 'Gunungkidul, DIY' },
  { id: 'drini', name: 'Drini Beach', category: 'beach', lat: -8.1483, lng: 110.5766, address: 'Gunungkidul, DIY' },

  // Hospitals
  { id: 'sardjito', name: 'RSUP Dr Sardjito', category: 'hospital', lat: -7.7685, lng: 110.3735, address: 'Jl. Kesehatan, Sleman' },
  { id: 'siloam', name: 'Siloam Hospital', category: 'hospital', lat: -7.7478, lng: 110.3893, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'bethesda', name: 'RS Bethesda', category: 'hospital', lat: -7.7835, lng: 110.3783, address: 'Jl. Jend. Sudirman 70' },
  { id: 'panti_rapih', name: 'RS Panti Rapih', category: 'hospital', lat: -7.7772, lng: 110.3844, address: 'Jl. Cik Di Tiro 30' },

  // Transport
  { id: 'tugu', name: 'Tugu Station', category: 'transport', lat: -7.7893, lng: 110.3614, address: 'Jl. Mangkubumi, Gedongtengen' },
  { id: 'lempuyangan', name: 'Lempuyangan Station', category: 'transport', lat: -7.7879, lng: 110.3768, address: 'Jl. Lempuyangan, Danurejan' },
  { id: 'giwangan', name: 'Giwangan Bus Terminal', category: 'transport', lat: -7.8236, lng: 110.3883, address: 'Jl. Imogiri Timur, Umbulharjo' },
  { id: 'jombor', name: 'Jombor Bus Terminal', category: 'transport', lat: -7.7468, lng: 110.3586, address: 'Jl. Magelang Km 5, Sleman' },

  // Shopping
  { id: 'malioboro', name: 'Malioboro Street', category: 'shopping', lat: -7.7928, lng: 110.3653, address: 'Jl. Malioboro, Gedongtengen' },
  { id: 'amplaz', name: 'Ambarukmo Plaza', category: 'shopping', lat: -7.7821, lng: 110.4017, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'hartono', name: 'Hartono Mall', category: 'shopping', lat: -7.7512, lng: 110.4109, address: 'Jl. Ring Road Utara, Sleman' },
  { id: 'jogja_city', name: 'Jogja City Mall', category: 'shopping', lat: -7.7757, lng: 110.3899, address: 'Jl. Magelang, Sleman' },
  { id: 'beringharjo', name: 'Pasar Beringharjo', category: 'shopping', lat: -7.7981, lng: 110.3658, address: 'Jl. Pabringan, Gondomanan' },

  // Universities
  { id: 'ugm', name: 'Universitas Gadjah Mada', category: 'university', lat: -7.7713, lng: 110.3776, address: 'Bulaksumur, Sleman' },
  { id: 'uny', name: 'Universitas Negeri Yogya', category: 'university', lat: -7.7728, lng: 110.3863, address: 'Jl. Colombo, Sleman' },
  { id: 'uii', name: 'Universitas Islam Indonesia', category: 'university', lat: -7.6896, lng: 110.4103, address: 'Jl. Kaliurang Km 14, Sleman' },
  { id: 'umy', name: 'Universitas Muhammadiyah', category: 'university', lat: -7.8147, lng: 110.3239, address: 'Jl. Brawijaya, Bantul' },

  // Government
  { id: 'immigration', name: 'Immigration Office', category: 'government', lat: -7.7546, lng: 110.3827, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'polda', name: 'Police HQ (Polda DIY)', category: 'government', lat: -7.7826, lng: 110.3887, address: 'Jl. Ring Road Utara' },
  { id: 'gubernur', name: 'Governor Office', category: 'government', lat: -7.7960, lng: 110.3690, address: 'Jl. Malioboro, Gedongtengen' },

  // Nature
  { id: 'jomblang', name: 'Jomblang Cave', category: 'nature', lat: -7.9546, lng: 110.6357, address: 'Gunungkidul, DIY' },
  { id: 'pindul', name: 'Pindul Cave (Tubing)', category: 'nature', lat: -7.9447, lng: 110.6054, address: 'Gunungkidul, DIY' },
  { id: 'kalibiru', name: 'Kalibiru National Park', category: 'nature', lat: -7.8161, lng: 110.1047, address: 'Kulon Progo, DIY' },
  { id: 'merapi', name: 'Mount Merapi Viewpoint', category: 'nature', lat: -7.6646, lng: 110.4265, address: 'Kaliurang, Sleman' },

  // Nightlife — Bars & Clubs
  { id: 'boshe', name: 'Boshe VVIP Club', category: 'nightlife', lat: -7.7825, lng: 110.3895, address: 'Jl. Magelang Km 6, Sleman' },
  { id: 'liquid', name: 'Liquid Next Level', category: 'nightlife', lat: -7.7835, lng: 110.3780, address: 'Jl. Magelang, Sleman' },
  { id: 'hugos', name: 'Hugo\'s Cafe & Bar', category: 'nightlife', lat: -7.8108, lng: 110.3670, address: 'Jl. Prawirotaman II' },
  { id: 'momobar', name: 'Momo Bar Prawirotaman', category: 'nightlife', lat: -7.8115, lng: 110.3685, address: 'Jl. Prawirotaman, Mergangsan' },
  { id: 'jazzspot', name: 'Jazz Spot Jogja', category: 'nightlife', lat: -7.7940, lng: 110.3620, address: 'Jl. Pakuningratan, Jetis' },
  { id: 'viavia', name: 'ViaVia Jogja', category: 'nightlife', lat: -7.8120, lng: 110.3665, address: 'Jl. Prawirotaman 30' },

  // Restaurants
  { id: 'gudeg_yu_djum', name: 'Gudeg Yu Djum', category: 'restaurant', lat: -7.7835, lng: 110.3880, address: 'Jl. Kaliurang Km 4, Sleman' },
  { id: 'bale_raos', name: 'Bale Raos (Royal Cuisine)', category: 'restaurant', lat: -7.8055, lng: 110.3625, address: 'Kraton Yogyakarta' },
  { id: 'mediterranean', name: 'Mediterranea Restaurant', category: 'restaurant', lat: -7.7753, lng: 110.3890, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'milas', name: 'Milas Vegetarian', category: 'restaurant', lat: -7.8125, lng: 110.3672, address: 'Jl. Prawirotaman, Mergangsan' },
  { id: 'sate_klathak', name: 'Sate Klathak Pak Pong', category: 'restaurant', lat: -7.8340, lng: 110.3460, address: 'Jl. Imogiri Barat, Bantul' },
  { id: 'house_raminten', name: 'House of Raminten', category: 'restaurant', lat: -7.7820, lng: 110.3752, address: 'Jl. FM Noto 7, Kotabaru' },
  { id: 'jejamuran', name: 'Jejamuran (Mushroom)', category: 'restaurant', lat: -7.6865, lng: 110.3420, address: 'Jl. Magelang Km 12, Sleman' },
  { id: 'abhayagiri', name: 'Abhayagiri Restaurant', category: 'restaurant', lat: -7.6150, lng: 110.4235, address: 'Kaliurang, Sleman (mountain view)' },

  // Art & Culture
  { id: 'affandi', name: 'Affandi Museum', category: 'art', lat: -7.7810, lng: 110.3965, address: 'Jl. Laksda Adisucipto 167' },
  { id: 'sonobudoyo', name: 'Sonobudoyo Museum', category: 'art', lat: -7.8000, lng: 110.3635, address: 'Jl. Pangurakan, Kraton' },
  { id: 'ullen_sentalu', name: 'Ullen Sentalu Museum', category: 'art', lat: -7.5990, lng: 110.4175, address: 'Kaliurang, Sleman' },
  { id: 'taman_budaya', name: 'Taman Budaya Yogyakarta', category: 'art', lat: -7.7930, lng: 110.3745, address: 'Jl. Sriwedani, Gondomanan' },
  { id: 'batik_center', name: 'Batik Craft Center', category: 'art', lat: -7.8040, lng: 110.3660, address: 'Jl. Tirtodipuran, Mantrijeron' },
  { id: 'cemeti', name: 'Cemeti Art House', category: 'art', lat: -7.8080, lng: 110.3745, address: 'Jl. D.I. Panjaitan 41' },

  // Food Areas
  { id: 'prawirotaman', name: 'Jl. Prawirotaman', category: 'food', lat: -7.8127, lng: 110.3677, address: 'Prawirotaman, Mergangsan' },
  { id: 'kaliurang', name: 'Kaliurang Food Street', category: 'food', lat: -7.6035, lng: 110.4240, address: 'Jl. Kaliurang, Sleman' },
  { id: 'alun_selatan', name: 'Alun-Alun Kidul (Night)', category: 'food', lat: -7.8122, lng: 110.3637, address: 'Alun-Alun Selatan, Kraton' },

  // Fast Food
  { id: 'mcd_malioboro', name: 'McDonald\'s Malioboro', category: 'fastfood', lat: -7.7935, lng: 110.3645, address: 'Jl. Malioboro, Gedongtengen' },
  { id: 'kfc_amplaz', name: 'KFC Ambarukmo Plaza', category: 'fastfood', lat: -7.7823, lng: 110.4020, address: 'Ambarukmo Plaza, Sleman' },
  { id: 'burger_king', name: 'Burger King Hartono', category: 'fastfood', lat: -7.7510, lng: 110.4105, address: 'Hartono Mall, Sleman' },
  { id: 'phd_jogja', name: 'Pizza Hut Delivery', category: 'fastfood', lat: -7.7830, lng: 110.3770, address: 'Jl. Gejayan, Sleman' },
  { id: 'jco', name: 'J.CO Donuts Jogja City', category: 'fastfood', lat: -7.7755, lng: 110.3895, address: 'Jogja City Mall, Sleman' },
  { id: 'starbucks', name: 'Starbucks Malioboro', category: 'fastfood', lat: -7.7940, lng: 110.3650, address: 'Jl. Malioboro, Gedongtengen' },

  // Gyms
  { id: 'celebrity_fitness', name: 'Celebrity Fitness Amplaz', category: 'gym', lat: -7.7820, lng: 110.4015, address: 'Ambarukmo Plaza Lt. 3' },
  { id: 'gold_gym', name: 'Gold\'s Gym Hartono', category: 'gym', lat: -7.7515, lng: 110.4112, address: 'Hartono Mall, Sleman' },
  { id: 'fitness_first', name: 'Fitness First Jogja City', category: 'gym', lat: -7.7758, lng: 110.3900, address: 'Jogja City Mall Lt. 3' },
  { id: 'atlas_gym', name: 'Atlas Sports Club', category: 'gym', lat: -7.7680, lng: 110.3880, address: 'Jl. Colombo, Sleman' },
  { id: 'crossfit_jogja', name: 'CrossFit Yogyakarta', category: 'gym', lat: -7.7790, lng: 110.3840, address: 'Jl. Gejayan, Sleman' },

  // Hair & Beauty Salons
  { id: 'johnny_andrean', name: 'Johnny Andrean Salon', category: 'salon', lat: -7.7825, lng: 110.4018, address: 'Ambarukmo Plaza, Sleman' },
  { id: 'irwan_team', name: 'Irwan Team Hairdesign', category: 'salon', lat: -7.7760, lng: 110.3898, address: 'Jogja City Mall, Sleman' },
  { id: 'flaurent', name: 'Flaurent Hair Studio', category: 'salon', lat: -7.7838, lng: 110.3775, address: 'Jl. Gejayan, Sleman' },
  { id: 'nail_plus', name: 'The Nail Plus Spa', category: 'salon', lat: -7.7830, lng: 110.3760, address: 'Jl. Kaliurang Km 5, Sleman' },
  { id: 'browbar', name: 'BrowBar Beauty Lounge', category: 'salon', lat: -7.7850, lng: 110.3890, address: 'Jl. Laksda Adisucipto, Sleman' },

  // Massage & Spa
  { id: 'kraton_spa', name: 'Kraton Spa & Wellness', category: 'spa', lat: -7.8045, lng: 110.3640, address: 'Jl. Rotowijayan, Kraton' },
  { id: 'jamu_spa', name: 'Jamu Traditional Spa', category: 'spa', lat: -7.8110, lng: 110.3660, address: 'Jl. Prawirotaman, Mergangsan' },
  { id: 'kirana_spa', name: 'Kirana Spa', category: 'spa', lat: -7.7830, lng: 110.3900, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'taman_sari_spa', name: 'Taman Sari Royal Heritage', category: 'spa', lat: -7.8095, lng: 110.3595, address: 'Jl. Taman, Kraton' },
  { id: 'martha_tilaar', name: 'Martha Tilaar Salon & Spa', category: 'spa', lat: -7.7762, lng: 110.3893, address: 'Jogja City Mall, Sleman' },

  // Money Exchange
  { id: 'bca_malioboro', name: 'BCA Money Changer', category: 'money', lat: -7.7932, lng: 110.3648, address: 'Jl. Malioboro, Gedongtengen' },
  { id: 'vr_money', name: 'VR Money Changer (Official)', category: 'money', lat: -7.7940, lng: 110.3655, address: 'Jl. Malioboro 60' },
  { id: 'pt_central', name: 'PT Central Valuta', category: 'money', lat: -7.7835, lng: 110.3890, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'bni_forex', name: 'BNI Currency Exchange', category: 'money', lat: -7.7890, lng: 110.3620, address: 'Jl. Trikora, Gedongtengen' },

  // Dentist
  { id: 'audy_dental', name: 'Audy Dental Clinic', category: 'dentist', lat: -7.7815, lng: 110.3870, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'happy_dental', name: 'Happy Dental Jogja', category: 'dentist', lat: -7.7780, lng: 110.3840, address: 'Jl. Colombo, Sleman' },
  { id: 'jogja_dental', name: 'Jogja Dental Center', category: 'dentist', lat: -7.7920, lng: 110.3710, address: 'Jl. Cik Di Tiro, Jetis' },
  { id: 'my_dental', name: 'My Dental Clinic', category: 'dentist', lat: -7.7755, lng: 110.3895, address: 'Jogja City Mall, Sleman' },

  // Karaoke
  { id: 'inul_vista', name: 'Inul Vizta Family KTV', category: 'karaoke', lat: -7.7820, lng: 110.4012, address: 'Ambarukmo Plaza, Sleman' },
  { id: 'happy_puppy', name: 'Happy Puppy KTV', category: 'karaoke', lat: -7.7760, lng: 110.3900, address: 'Jogja City Mall, Sleman' },
  { id: 'nav_karaoke', name: 'NAV Karaoke', category: 'karaoke', lat: -7.7830, lng: 110.3775, address: 'Jl. Gejayan, Sleman' },
  { id: 'diva_ktv', name: 'Diva Family Karaoke', category: 'karaoke', lat: -7.7515, lng: 110.4110, address: 'Hartono Mall, Sleman' },

  // Shopping Malls
  { id: 'mall_amplaz', name: 'Ambarukmo Plaza', category: 'mall', lat: -7.7821, lng: 110.4017, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'mall_hartono', name: 'Hartono Mall', category: 'mall', lat: -7.7512, lng: 110.4109, address: 'Jl. Ring Road Utara, Sleman' },
  { id: 'mall_jogja_city', name: 'Jogja City Mall', category: 'mall', lat: -7.7757, lng: 110.3899, address: 'Jl. Magelang, Sleman' },
  { id: 'mall_galeria', name: 'Galeria Mall', category: 'mall', lat: -7.7870, lng: 110.3715, address: 'Jl. Jend. Sudirman, Gondokusuman' },
  { id: 'mall_sleman_city', name: 'Sleman City Hall', category: 'mall', lat: -7.7465, lng: 110.3580, address: 'Jl. Magelang Km 5, Sleman' },
  { id: 'mall_lippo', name: 'Lippo Plaza Jogja', category: 'mall', lat: -7.7850, lng: 110.3780, address: 'Jl. Laksda Adisucipto, Sleman' },

  // Traditional Markets
  { id: 'pasar_beringharjo', name: 'Pasar Beringharjo', category: 'market', lat: -7.7981, lng: 110.3658, address: 'Jl. Pabringan, Gondomanan' },
  { id: 'malioboro_market', name: 'Malioboro Street Market', category: 'market', lat: -7.7928, lng: 110.3653, address: 'Jl. Malioboro, Gedongtengen' },
  { id: 'pasar_kranggan', name: 'Pasar Kranggan', category: 'market', lat: -7.7975, lng: 110.3720, address: 'Jl. Kranggan, Gondomanan' },
  { id: 'pasar_demangan', name: 'Pasar Demangan', category: 'market', lat: -7.7730, lng: 110.3850, address: 'Jl. Gejayan, Sleman' },
  { id: 'pasar_ngasem', name: 'Pasar Ngasem (Bird Market)', category: 'market', lat: -7.8085, lng: 110.3615, address: 'Jl. Polowijan, Kraton' },
  { id: 'pasar_godean', name: 'Pasar Godean', category: 'market', lat: -7.7745, lng: 110.2950, address: 'Godean, Sleman' },

  // Waterparks
  { id: 'jogja_bay', name: 'Jogja Bay Waterpark', category: 'waterpark', lat: -7.7375, lng: 110.4210, address: 'Jl. Stadion Maguwoharjo, Sleman' },
  { id: 'galaxy_waterpark', name: 'Galaxy Waterpark', category: 'waterpark', lat: -7.8320, lng: 110.3520, address: 'Jl. Wonosari, Bantul' },
  { id: 'kids_fun', name: 'Kids Fun Waterpark', category: 'waterpark', lat: -7.8270, lng: 110.3620, address: 'Jl. Wonosari Km 10, Bantul' },

  // Bus Stations
  { id: 'giwangan_bus', name: 'Terminal Giwangan', category: 'bus', lat: -7.8236, lng: 110.3883, address: 'Jl. Imogiri Timur, Umbulharjo' },
  { id: 'jombor_bus', name: 'Terminal Jombor', category: 'bus', lat: -7.7468, lng: 110.3586, address: 'Jl. Magelang Km 5, Sleman' },
  { id: 'condongcatur_bus', name: 'Terminal Condongcatur', category: 'bus', lat: -7.7570, lng: 110.3920, address: 'Jl. Ring Road Utara, Sleman' },
  { id: 'wates_bus', name: 'Terminal Wates', category: 'bus', lat: -7.8620, lng: 110.1545, address: 'Wates, Kulon Progo' },
  { id: 'prambanan_bus', name: 'Terminal Prambanan', category: 'bus', lat: -7.7530, lng: 110.4930, address: 'Prambanan, Sleman' },

  // Train Stations
  { id: 'tugu_train', name: 'Stasiun Tugu (Main)', category: 'train', lat: -7.7893, lng: 110.3614, address: 'Jl. Mangkubumi, Gedongtengen' },
  { id: 'lempuyangan_train', name: 'Stasiun Lempuyangan', category: 'train', lat: -7.7879, lng: 110.3768, address: 'Jl. Lempuyangan, Danurejan' },
  { id: 'klaten_train', name: 'Stasiun Klaten', category: 'train', lat: -7.7050, lng: 110.6060, address: 'Klaten, Central Java' },
  { id: 'solo_train', name: 'Stasiun Solo Balapan', category: 'train', lat: -7.5665, lng: 110.8218, address: 'Solo, Central Java' },
  { id: 'maguwo_train', name: 'Stasiun Maguwo (Airport)', category: 'train', lat: -7.7870, lng: 110.4280, address: 'Near Adisucipto Airport, Sleman' },

  // Pizza
  { id: 'pizza_hut_malioboro', name: 'Pizza Hut Malioboro', category: 'pizza', lat: -7.7938, lng: 110.3648, address: 'Jl. Malioboro, Gedongtengen' },
  { id: 'dominos_gejayan', name: 'Domino\'s Pizza Gejayan', category: 'pizza', lat: -7.7828, lng: 110.3778, address: 'Jl. Gejayan, Sleman' },
  { id: 'phd_seturan', name: 'Pizza Hut Delivery Seturan', category: 'pizza', lat: -7.7680, lng: 110.4020, address: 'Jl. Seturan Raya, Sleman' },
  { id: 'dominos_amplaz', name: 'Domino\'s Ambarukmo Plaza', category: 'pizza', lat: -7.7823, lng: 110.4020, address: 'Ambarukmo Plaza, Sleman' },
  { id: 'papa_rons', name: 'Papa Ron\'s Pizza', category: 'pizza', lat: -7.7758, lng: 110.3898, address: 'Jogja City Mall, Sleman' },
  { id: 'panties_pizza', name: 'Panties Pizza Jogja', category: 'pizza', lat: -7.7840, lng: 110.3770, address: 'Jl. Gejayan, Sleman' },

  // Chinese Food
  { id: 'ta_wan', name: 'Ta Wan Restaurant', category: 'chinese', lat: -7.7822, lng: 110.4018, address: 'Ambarukmo Plaza, Sleman' },
  { id: 'din_tai_fung', name: 'Din Tai Fung', category: 'chinese', lat: -7.7515, lng: 110.4112, address: 'Hartono Mall, Sleman' },
  { id: 'imperial_kitchen', name: 'Imperial Kitchen & Dimsum', category: 'chinese', lat: -7.7760, lng: 110.3900, address: 'Jogja City Mall, Sleman' },
  { id: 'bakmi_jawa', name: 'Bakmi Jawa Pak Yono', category: 'chinese', lat: -7.7890, lng: 110.3660, address: 'Jl. Mangkubumi, Gedongtengen' },
  { id: 'swikee_purwodadi', name: 'Swikee Purwodadi Jogja', category: 'chinese', lat: -7.7945, lng: 110.3710, address: 'Jl. Pasar Kembang, Gedongtengen' },
  { id: 'phoenix_dimsum', name: 'Phoenix Chinese Restaurant', category: 'chinese', lat: -7.7870, lng: 110.3720, address: 'Jl. Jend. Sudirman, Gondokusuman' },

  // Sushi & Japanese
  { id: 'sushi_tei', name: 'Sushi Tei', category: 'sushi', lat: -7.7822, lng: 110.4015, address: 'Ambarukmo Plaza, Sleman' },
  { id: 'genki_sushi', name: 'Genki Sushi', category: 'sushi', lat: -7.7758, lng: 110.3898, address: 'Jogja City Mall, Sleman' },
  { id: 'ichiban_sushi', name: 'Ichiban Sushi', category: 'sushi', lat: -7.7515, lng: 110.4110, address: 'Hartono Mall, Sleman' },
  { id: 'marugame', name: 'Marugame Udon', category: 'sushi', lat: -7.7823, lng: 110.4020, address: 'Ambarukmo Plaza, Sleman' },
  { id: 'yoshinoya', name: 'Yoshinoya', category: 'sushi', lat: -7.7760, lng: 110.3900, address: 'Jogja City Mall, Sleman' },
  { id: 'okinawa_sushi', name: 'Okinawa Sushi Jogja', category: 'sushi', lat: -7.7838, lng: 110.3775, address: 'Jl. Gejayan, Sleman' },

  // Billiards
  { id: 'strikes_billiard', name: 'Strikes Billiard & Bar', category: 'billiards', lat: -7.7835, lng: 110.3780, address: 'Jl. Gejayan, Sleman' },
  { id: 'zone_billiard', name: 'Zone Billiard', category: 'billiards', lat: -7.7760, lng: 110.3898, address: 'Jogja City Mall Lt. 4, Sleman' },
  { id: 'masterpiece_billiard', name: 'Masterpiece Billiard', category: 'billiards', lat: -7.7850, lng: 110.3890, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'kings_billiard', name: 'King\'s Pool & Lounge', category: 'billiards', lat: -7.7830, lng: 110.3765, address: 'Jl. Gejayan, Sleman' },
  { id: 'century_billiard', name: 'Century Billiard Jogja', category: 'billiards', lat: -7.7515, lng: 110.4108, address: 'Hartono Mall, Sleman' },

  // Western Food
  { id: 'steak_holycow', name: 'Steak Holic / HolyCow', category: 'western', lat: -7.7840, lng: 110.3772, address: 'Jl. Gejayan, Sleman' },
  { id: 'outback', name: 'Outback Steakhouse', category: 'western', lat: -7.7822, lng: 110.4018, address: 'Ambarukmo Plaza, Sleman' },
  { id: 'pepper_lunch', name: 'Pepper Lunch', category: 'western', lat: -7.7760, lng: 110.3900, address: 'Jogja City Mall, Sleman' },
  { id: 'tgif_jogja', name: 'TGI Friday\'s Jogja', category: 'western', lat: -7.7515, lng: 110.4110, address: 'Hartono Mall, Sleman' },
  { id: 'abuba_steak', name: 'Abuba Steak Jogja', category: 'western', lat: -7.7838, lng: 110.3775, address: 'Jl. Gejayan, Sleman' },
  { id: 'the_house', name: 'The House of Raminten Western', category: 'western', lat: -7.7820, lng: 110.3752, address: 'Jl. FM Noto, Kotabaru' },
  { id: 'nanamia_pizzeria', name: 'Nanamia Pizzeria', category: 'western', lat: -7.7830, lng: 110.3760, address: 'Jl. Kaliurang Km 5, Sleman' },
].map(d => ({
  ...d,
  distanceKm: Math.round(distanceKm(CITY_CENTER.lat, CITY_CENTER.lng, d.lat, d.lng) * 10) / 10,
}))

export function getDestinationsByCategory(categoryId) {
  if (categoryId === 'all') return YOGYAKARTA_DESTINATIONS
  return YOGYAKARTA_DESTINATIONS.filter(d => d.category === categoryId)
}

/** Get destinations relative to user location, filtered by radius and sorted by nearest */
export function getDestinationsNearUser(userLat, userLng, radiusKm = 50, categoryId = 'all') {
  const base = categoryId === 'all' ? YOGYAKARTA_DESTINATIONS : YOGYAKARTA_DESTINATIONS.filter(d => d.category === categoryId)
  return base
    .map(d => ({ ...d, distanceKm: Math.round(distanceKm(userLat, userLng, d.lat, d.lng) * 10) / 10 }))
    .filter(d => d.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

export { distanceKm }

export function fmtIDR(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
