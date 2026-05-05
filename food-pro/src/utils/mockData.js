/**
 * Mock / demo data seeder for Indoo Done Deal marketplace.
 * Populates localStorage with realistic Indonesian marketplace data
 * so the app feels alive with profiles, listings, bookings, chats,
 * reviews, and notifications.
 *
 * Called once on first mount of RentalSearchScreen — guarded by
 * the `indoo_mock_seeded` flag so it never overwrites user data.
 */

// ─── Seller Profiles ────────────────────────────────────────────────
const SELLERS = {
  wayan: {
    id: 'seller-wayan-001',
    name: 'Pak Wayan Sudarma',
    phone: '081237894512',
    city: 'Canggu, Bali',
    bio: 'Pemilik rental motor di Canggu sejak 2016. Fleet 12 motor siap pakai, servis rutin tiap bulan.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    type: 'owner',
  },
  sari: {
    id: 'seller-sari-002',
    name: 'Ibu Sari Permata',
    phone: '081953276481',
    city: 'Seminyak, Bali',
    bio: 'Agen properti berpengalaman di Seminyak. Spesialis villa dan rumah untuk jangka pendek & panjang.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    type: 'agent',
  },
  rizky: {
    id: 'seller-rizky-003',
    name: 'Mas Rizky Pratama',
    phone: '081338765210',
    city: 'Denpasar, Bali',
    bio: 'Rental sound system & lighting untuk event, wedding, dan konser. Pengalaman 8 tahun di Bali.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    type: 'owner',
  },
}

// ─── Buyer Profiles ─────────────────────────────────────────────────
const BUYERS = {
  sarah: {
    id: 'buyer-sarah-004',
    name: 'Sarah Mitchell',
    phone: '081290001234',
    city: 'Canggu, Bali',
    bio: 'Australian tourist exploring Bali for 3 weeks. Looking for motorbike and villa rentals.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    type: 'renter',
  },
  andi: {
    id: 'buyer-andi-005',
    name: 'Andi Wijaya',
    phone: '082145678901',
    city: 'Ubud, Bali',
    bio: 'Digital nomad Indonesia, pindah-pindah tiap beberapa bulan. Butuh tempat tinggal fleksibel.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    type: 'renter',
  },
}

// ─── Motorbike Listings (Pak Wayan) ─────────────────────────────────
const wayanListings = [
  {
    id: 'mock-moto-001',
    ref: 'WYN-VARIO-001',
    title: 'Honda Vario 125 2023 - Putih Bersih',
    description:
      'Motor matic Honda Vario 125 tahun 2023, kondisi terawat banget. Servis rutin setiap 2 minggu. Cocok untuk jalan-jalan di Bali. Helm 2 buah, jas hujan, dan phone holder disediakan gratis.',
    category: 'Motorcycles',
    sub_category: 'Matic',
    city: 'Canggu, Bali',
    price_day: 75000,
    price_week: 450000,
    price_month: 1500000,
    condition: 'like_new',
    images: [
      'https://ik.imagekit.io/nepgaxllc/Untitledasdadaa.png',
      'https://ik.imagekit.io/nepgaxllc/Untitledasdadaa.png',
    ],
    extra_fields: {
      cc: 125,
      year: 2023,
      brand: 'Honda',
      model: 'Vario 125',
      transmission: 'matic',
      helmet_count: 2,
      delivery_available: true,
    },
    status: 'live',
    owner_id: SELLERS.wayan.id,
    owner_name: SELLERS.wayan.name,
    owner_phone: SELLERS.wayan.phone,
    created_at: '2025-11-15T08:30:00Z',
    rating: 4.8,
    review_count: 23,
    view_count: 312,
    features: ['Helm 2 buah', 'Jas hujan', 'Phone holder', 'Servis rutin'],
  },
  {
    id: 'mock-moto-002',
    ref: 'WYN-NMAX-002',
    title: 'Yamaha NMAX 155 2022 - Abu-abu Metalik',
    description:
      'NMAX 155 2022, motor premium untuk riding nyaman di Bali. ABS, smart key, USB charger. Sudah dilengkapi box belakang untuk simpan barang. Free delivery area Canggu-Seminyak.',
    category: 'Motorcycles',
    sub_category: 'Matic',
    city: 'Canggu, Bali',
    price_day: 120000,
    price_week: 750000,
    price_month: 2500000,
    condition: 'good',
    images: [
      'https://ik.imagekit.io/nepgaxllc/Untitledasdadaa.png',
      'https://ik.imagekit.io/nepgaxllc/Untitledasdadaa.png',
    ],
    extra_fields: {
      cc: 155,
      year: 2022,
      brand: 'Yamaha',
      model: 'NMAX 155',
      transmission: 'matic',
      helmet_count: 2,
      delivery_available: true,
    },
    status: 'live',
    owner_id: SELLERS.wayan.id,
    owner_name: SELLERS.wayan.name,
    owner_phone: SELLERS.wayan.phone,
    created_at: '2025-10-20T10:15:00Z',
    rating: 4.7,
    review_count: 19,
    view_count: 267,
    features: ['Helm 2 buah', 'Jas hujan', 'ABS', 'Smart key', 'USB charger', 'Free delivery Canggu-Seminyak'],
  },
  {
    id: 'mock-moto-003',
    ref: 'WYN-PCX-003',
    title: 'Honda PCX 160 2024 - Hitam Premium',
    description:
      'PCX 160 terbaru 2024, full LED, ABS, idle stop system. Motor paling nyaman untuk touring Bali. Tersedia juga sarung tangan dan masker. Bisa antar ke hotel/villa.',
    category: 'Motorcycles',
    sub_category: 'Matic',
    city: 'Canggu, Bali',
    price_day: 150000,
    price_week: 900000,
    price_month: 3000000,
    condition: 'new',
    images: [
      'https://ik.imagekit.io/nepgaxllc/Untitledasdadaa.png',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600',
    ],
    extra_fields: {
      cc: 160,
      year: 2024,
      brand: 'Honda',
      model: 'PCX 160',
      transmission: 'matic',
      helmet_count: 2,
      delivery_available: true,
    },
    status: 'live',
    owner_id: SELLERS.wayan.id,
    owner_name: SELLERS.wayan.name,
    owner_phone: SELLERS.wayan.phone,
    created_at: '2026-01-05T09:00:00Z',
    rating: 4.9,
    review_count: 31,
    view_count: 420,
    features: ['Helm 2 buah', 'Jas hujan', 'Full LED', 'ABS', 'Idle stop', 'Delivery ke hotel'],
  },
]

// ─── Property Listings (Ibu Sari) ───────────────────────────────────
const sariListings = [
  {
    id: 'mock-prop-001',
    ref: 'SRI-VILLA-001',
    title: 'Villa Tropis 2BR + Pool - Seminyak',
    description:
      'Villa tropis di jantung Seminyak, 2 kamar tidur dengan AC, kolam renang pribadi, dapur lengkap, dan taman hijau. Jalan kaki ke pantai Double Six. Staff pembersih harian. Wifi 100 Mbps.',
    category: 'Property',
    sub_category: 'Villa',
    city: 'Seminyak, Bali',
    price_day: 1200000,
    price_week: 7500000,
    price_month: 25000000,
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600',
      'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=600',
    ],
    extra_fields: {
      bedrooms: 2,
      bathrooms: 2,
      property_type: 'Villa',
      wifi_included: true,
      pool: true,
      parking: true,
    },
    status: 'live',
    owner_id: SELLERS.sari.id,
    owner_name: SELLERS.sari.name,
    owner_phone: SELLERS.sari.phone,
    created_at: '2025-09-10T14:00:00Z',
    rating: 4.9,
    review_count: 34,
    view_count: 580,
    features: ['Kolam renang pribadi', 'Dapur lengkap', 'Wifi 100 Mbps', 'Staff harian', 'Dekat pantai Double Six'],
  },
  {
    id: 'mock-prop-002',
    ref: 'SRI-HOUSE-002',
    title: 'Rumah Furnished 3BR - Kerobokan',
    description:
      'Rumah fully furnished 3 kamar tidur di Kerobokan, area tenang tapi dekat Seminyak. Garasi mobil, taman, laundry room. Kontrak minimal 3 bulan. Cocok untuk keluarga atau remote worker.',
    category: 'Property',
    sub_category: 'Rumah',
    city: 'Kerobokan, Bali',
    price_day: null,
    price_week: null,
    price_month: 15000000,
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=600',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600',
    ],
    extra_fields: {
      bedrooms: 3,
      bathrooms: 2,
      property_type: 'Rumah',
      wifi_included: true,
      parking: true,
    },
    status: 'live',
    owner_id: SELLERS.sari.id,
    owner_name: SELLERS.sari.name,
    owner_phone: SELLERS.sari.phone,
    created_at: '2025-08-20T11:00:00Z',
    rating: 4.6,
    review_count: 12,
    view_count: 210,
    features: ['Fully furnished', 'Garasi mobil', 'Taman', 'Laundry room', 'Area tenang'],
  },
  {
    id: 'mock-prop-003',
    ref: 'SRI-VILLA-003',
    title: 'Villa Mewah 4BR Ocean View - Uluwatu',
    description:
      'Villa mewah 4 kamar tidur di tebing Uluwatu dengan pemandangan laut langsung. Infinity pool, outdoor shower, BBQ area. Cocok untuk liburan grup atau retreat perusahaan. Butler service tersedia.',
    category: 'Property',
    sub_category: 'Villa',
    city: 'Uluwatu, Bali',
    price_day: 2000000,
    price_week: 12000000,
    price_month: 40000000,
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600',
      'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=600',
    ],
    extra_fields: {
      bedrooms: 4,
      bathrooms: 4,
      property_type: 'Villa',
      wifi_included: true,
      pool: true,
      parking: true,
    },
    status: 'live',
    owner_id: SELLERS.sari.id,
    owner_name: SELLERS.sari.name,
    owner_phone: SELLERS.sari.phone,
    created_at: '2026-02-01T16:00:00Z',
    rating: 5.0,
    review_count: 8,
    view_count: 340,
    features: ['Infinity pool', 'Ocean view', 'BBQ area', 'Outdoor shower', 'Butler service', '4 kamar tidur'],
  },
]

// ─── Audio & Event Listings (Mas Rizky) ─────────────────────────────
const rizkyListings = [
  {
    id: 'mock-audio-001',
    ref: 'RZK-SOUND-001',
    title: 'Sound System 3000W - Pesta & Wedding',
    description:
      'Paket sound system 3000 watt untuk pesta, wedding, atau acara outdoor. 2x subwoofer 15 inch, 4x speaker mid-high, mixer Yamaha 12 channel, 3x mic wireless Shure. Sudah termasuk operator berpengalaman dan kabel lengkap.',
    category: 'Audio & Sound',
    sub_category: 'Speaker',
    city: 'Denpasar, Bali',
    price_day: 350000,
    price_week: null,
    price_month: null,
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    ],
    extra_fields: {
      brand: 'JBL / Yamaha',
      power_watts: 3000,
      includes_operator: true,
    },
    status: 'live',
    owner_id: SELLERS.rizky.id,
    owner_name: SELLERS.rizky.name,
    owner_phone: SELLERS.rizky.phone,
    created_at: '2025-12-01T08:00:00Z',
    rating: 4.8,
    review_count: 15,
    view_count: 145,
    features: ['Operator included', 'Subwoofer 15" x2', 'Mixer Yamaha 12ch', 'Mic wireless x3', 'Antar-jemput'],
  },
  {
    id: 'mock-audio-002',
    ref: 'RZK-LIGHT-002',
    title: 'Paket Lighting Panggung - Moving Head + LED Par',
    description:
      'Paket lighting lengkap untuk panggung: 4x moving head beam 230W, 8x LED par 54, 2x follow spot, smoke machine, dan DMX controller. Cocok untuk konser, fashion show, atau corporate event. Include teknisi.',
    category: 'Party & Event',
    sub_category: 'Lighting',
    city: 'Denpasar, Bali',
    price_day: 500000,
    price_week: null,
    price_month: null,
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=600',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
    ],
    extra_fields: {
      brand: 'Various',
      includes_operator: true,
      setup_included: true,
    },
    status: 'live',
    owner_id: SELLERS.rizky.id,
    owner_name: SELLERS.rizky.name,
    owner_phone: SELLERS.rizky.phone,
    created_at: '2025-11-05T13:00:00Z',
    rating: 4.7,
    review_count: 9,
    view_count: 98,
    features: ['Moving head x4', 'LED par x8', 'Smoke machine', 'DMX controller', 'Teknisi included'],
  },
]

// ─── Mock Bookings ──────────────────────────────────────────────────
const MOCK_BOOKINGS = [
  {
    id: 'booking-001',
    listing_id: 'mock-moto-001',
    listing_title: 'Honda Vario 125 2023 - Putih Bersih',
    listing_image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdadaa.png',
    renter_id: BUYERS.sarah.id,
    renter_name: BUYERS.sarah.name,
    renter_phone: BUYERS.sarah.phone,
    owner_id: SELLERS.wayan.id,
    owner_name: SELLERS.wayan.name,
    owner_phone: SELLERS.wayan.phone,
    start_date: '2026-04-20',
    end_date: '2026-04-27',
    days: 7,
    total_price: 450000,
    price_per_day: 75000,
    status: 'confirmed',
    payment_method: 'cash',
    created_at: '2026-04-18T10:30:00Z',
    notes: 'Delivery to Canggu Surf House please',
  },
  {
    id: 'booking-002',
    listing_id: 'mock-prop-001',
    listing_title: 'Villa Tropis 2BR + Pool - Seminyak',
    listing_image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600',
    renter_id: BUYERS.andi.id,
    renter_name: BUYERS.andi.name,
    renter_phone: BUYERS.andi.phone,
    owner_id: SELLERS.sari.id,
    owner_name: SELLERS.sari.name,
    owner_phone: SELLERS.sari.phone,
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    days: 30,
    total_price: 25000000,
    price_per_day: 1200000,
    status: 'pending',
    payment_method: 'transfer',
    created_at: '2026-04-17T14:00:00Z',
    notes: 'Butuh meja kerja dan kursi ergonomis kalau bisa',
  },
  {
    id: 'booking-003',
    listing_id: 'mock-audio-001',
    listing_title: 'Sound System 3000W - Pesta & Wedding',
    listing_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
    renter_id: BUYERS.sarah.id,
    renter_name: BUYERS.sarah.name,
    renter_phone: BUYERS.sarah.phone,
    owner_id: SELLERS.rizky.id,
    owner_name: SELLERS.rizky.name,
    owner_phone: SELLERS.rizky.phone,
    start_date: '2026-04-10',
    end_date: '2026-04-12',
    days: 2,
    total_price: 700000,
    price_per_day: 350000,
    status: 'completed',
    payment_method: 'cash',
    created_at: '2026-04-08T09:00:00Z',
    notes: 'Beach party at Finns Beach Club area',
  },
]

// ─── Mock Chat History ──────────────────────────────────────────────
const MOCK_CHATS = [
  {
    id: 'chat-001',
    listing_id: 'mock-moto-001',
    listing_title: 'Honda Vario 125 2023 - Putih Bersih',
    seller_id: SELLERS.wayan.id,
    seller_name: SELLERS.wayan.name,
    buyer_id: BUYERS.sarah.id,
    buyer_name: BUYERS.sarah.name,
    last_message: 'Siap kak, besok pagi saya antarkan ke Canggu Surf House ya. Helm 2 sudah disiapkan.',
    last_message_time: '2026-04-18T11:45:00Z',
    unread: 0,
  },
  {
    id: 'chat-002',
    listing_id: 'mock-prop-001',
    listing_title: 'Villa Tropis 2BR + Pool - Seminyak',
    seller_id: SELLERS.sari.id,
    seller_name: SELLERS.sari.name,
    buyer_id: BUYERS.andi.id,
    buyer_name: BUYERS.andi.name,
    last_message: 'Untuk meja kerja bisa saya siapkan sebelum check-in. Apakah mas Andi juga butuh monitor tambahan?',
    last_message_time: '2026-04-17T15:20:00Z',
    unread: 1,
  },
  {
    id: 'chat-003',
    listing_id: 'mock-audio-001',
    listing_title: 'Sound System 3000W - Pesta & Wedding',
    seller_id: SELLERS.rizky.id,
    seller_name: SELLERS.rizky.name,
    buyer_id: BUYERS.sarah.id,
    buyer_name: BUYERS.sarah.name,
    last_message: 'Thank you Mas Rizky! The sound was amazing, everyone loved it. Will definitely book again!',
    last_message_time: '2026-04-12T22:00:00Z',
    unread: 0,
  },
]

// ─── Mock Reviews ───────────────────────────────────────────────────
const MOCK_REVIEWS = [
  {
    id: 'review-001',
    listing_id: 'mock-moto-001',
    listing_title: 'Honda Vario 125 2023 - Putih Bersih',
    reviewer_id: BUYERS.sarah.id,
    reviewer_name: BUYERS.sarah.name,
    rating: 5,
    text: 'Pak Wayan is so reliable! Bike was in perfect condition, delivered right to my villa. Highly recommend for anyone in Canggu.',
    created_at: '2026-04-15T08:00:00Z',
  },
  {
    id: 'review-002',
    listing_id: 'mock-moto-002',
    listing_title: 'Yamaha NMAX 155 2022 - Abu-abu Metalik',
    reviewer_id: BUYERS.andi.id,
    reviewer_name: BUYERS.andi.name,
    rating: 4,
    text: 'Motor enak banget buat keliling Bali. Cuma box belakangnya agak susah dibuka. Overall recommended.',
    created_at: '2026-03-28T12:00:00Z',
  },
  {
    id: 'review-003',
    listing_id: 'mock-prop-001',
    listing_title: 'Villa Tropis 2BR + Pool - Seminyak',
    reviewer_id: BUYERS.sarah.id,
    reviewer_name: BUYERS.sarah.name,
    rating: 5,
    text: 'Absolutely stunning villa! The pool was perfect, staff was so friendly. Walking distance to the beach and great restaurants.',
    created_at: '2026-03-10T16:00:00Z',
  },
  {
    id: 'review-004',
    listing_id: 'mock-audio-001',
    listing_title: 'Sound System 3000W - Pesta & Wedding',
    reviewer_id: BUYERS.sarah.id,
    reviewer_name: BUYERS.sarah.name,
    rating: 5,
    text: 'Sound quality luar biasa! Mas Rizky sangat profesional, setup cepat dan beres. Highly recommended for beach parties!',
    created_at: '2026-04-13T09:00:00Z',
  },
  {
    id: 'review-005',
    listing_id: 'mock-prop-003',
    listing_title: 'Villa Mewah 4BR Ocean View - Uluwatu',
    reviewer_id: BUYERS.andi.id,
    reviewer_name: BUYERS.andi.name,
    rating: 5,
    text: 'View-nya gila sih ini villa. Infinity pool + sunset = sempurna. Butler service juga top. Pasti balik lagi.',
    created_at: '2026-02-20T18:00:00Z',
  },
]

// ─── Mock Notifications ─────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-001',
    type: 'booking_received',
    title: 'Booking Baru!',
    message: 'Sarah Mitchell memesan Honda Vario 125 untuk 7 hari (20-27 Apr). Konfirmasi sekarang.',
    listing_id: 'mock-moto-001',
    read: false,
    created_at: '2026-04-18T10:30:00Z',
  },
  {
    id: 'notif-002',
    type: 'review_posted',
    title: 'Review Baru',
    message: 'Sarah Mitchell memberikan bintang 5 untuk Sound System 3000W. "Sound quality luar biasa!"',
    listing_id: 'mock-audio-001',
    read: false,
    created_at: '2026-04-13T09:05:00Z',
  },
  {
    id: 'notif-003',
    type: 'wallet_low',
    title: 'Saldo Wallet Rendah',
    message: 'Saldo Indoo Wallet kamu tinggal Rp 15.000. Top up sekarang supaya bisa terima pembayaran.',
    read: true,
    created_at: '2026-04-12T07:00:00Z',
  },
  {
    id: 'notif-004',
    type: 'booking_received',
    title: 'Booking Pending',
    message: 'Andi Wijaya mengajukan booking Villa Tropis 2BR untuk 30 hari (1-31 Mei). Menunggu konfirmasi.',
    listing_id: 'mock-prop-001',
    read: false,
    created_at: '2026-04-17T14:00:00Z',
  },
]

// ─── Seeder Function ────────────────────────────────────────────────

/**
 * Populate localStorage with demo data if it hasn't been seeded yet.
 * Safe to call multiple times — guarded by `indoo_mock_seeded` flag.
 */
const SEED_VERSION = '2' // bump to force re-seed with new data

export function seedMockData() {
  if (localStorage.getItem('indoo_mock_seeded') === SEED_VERSION) return

  // Helper: only set if key is empty
  const setIfEmpty = (key, data) => {
    const existing = localStorage.getItem(key)
    if (!existing || existing === '[]') {
      localStorage.setItem(key, JSON.stringify(data))
    }
  }

  // Listings — motorbikes go to indoo_my_listings, property to indoo_my_property_listings
  setIfEmpty('indoo_my_listings', wayanListings)
  setIfEmpty('indoo_my_property_listings', sariListings)
  // Audio & event listings go into indoo_event_listings (read by browse grid + MyListingsScreen)
  setIfEmpty('indoo_event_listings', rizkyListings)

  // Bookings
  setIfEmpty('indoo_rental_bookings', MOCK_BOOKINGS)

  // Chat history
  setIfEmpty('indoo_chat_history', MOCK_CHATS)

  // Reviews
  setIfEmpty('indoo_reviews', MOCK_REVIEWS)

  // Notifications
  setIfEmpty('indoo_notifications', MOCK_NOTIFICATIONS)

  // Mark as seeded
  localStorage.setItem('indoo_mock_seeded', SEED_VERSION)
}
