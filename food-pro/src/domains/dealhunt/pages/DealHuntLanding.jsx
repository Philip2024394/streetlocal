import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '@/i18n'
import styles from './DealHuntLanding.module.css'
import DealReviewCarousel from '../components/DealReviewCarousel'
import DealChat from '../components/DealChat'
import SellerDealsDrawer, { MOCK_SELLER_DEALS } from '../components/SellerDealsDrawer'

// ── Promo banners — full-screen, no text, random rotation ────────────────────
const PROMO_BANNERS = [
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_41_31%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_38_42%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_35_03%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_29_29%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_46_04%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_51_11%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_55_19%20AM.png',
]
function getRandomBanner(exclude) {
  const available = PROMO_BANNERS.filter(b => b !== exclude)
  return available[Math.floor(Math.random() * available.length)]
}

// ── Demo deals with larger images ─────────────────────────────────────────────
const DEMO_DEALS = [
  { id: 'd1', title: 'Nasi Goreng Spesial', domain: 'food', sub: 'Nasi goreng kampung dengan telur mata sapi, kerupuk, dan acar segar', seller_name: 'Warung Bu Sari', seller_photo: 'https://i.pravatar.cc/80?img=1', seller_rating: 4.8, original_price: 35000, deal_price: 19000, quantity_available: 50, quantity_claimed: 38, end_time: Date.now() + 3*3600000, images: ['https://picsum.photos/seed/nasgor/1080/1920'], city: 'Yogyakarta', is_hot: true },
  { id: 'd2', title: 'Leather Wallet Handmade', domain: 'marketplace', sub: 'Dompet kulit asli buatan tangan, jahitan rapi, tahan lama', seller_name: 'Kulit Asli', seller_photo: 'https://i.pravatar.cc/80?img=5', seller_rating: 4.6, original_price: 250000, deal_price: 149000, quantity_available: 20, quantity_claimed: 14, end_time: Date.now() + 5*3600000, images: ['https://picsum.photos/seed/wallet/1080/1920'], city: 'Jakarta' },
  { id: 'd3', title: 'Full Body Massage 90min', domain: 'massage', sub: 'Relaksasi total dengan aromaterapi dan hot stone pilihan', seller_name: 'Zen Spa Jogja', seller_photo: 'https://i.pravatar.cc/80?img=9', seller_rating: 4.9, original_price: 200000, deal_price: 120000, quantity_available: 15, quantity_claimed: 11, end_time: Date.now() + 2*3600000, images: ['https://picsum.photos/seed/massage/1080/1920'], city: 'Yogyakarta', is_hot: true },
  { id: 'd4', title: 'Honda Vario 125 Sewa Harian', domain: 'rentals', sub: 'Motor matic terawat, helm & jas hujan gratis, antar jemput', seller_name: 'Jogja Rental', seller_photo: 'https://i.pravatar.cc/80?img=14', seller_rating: 4.7, original_price: 100000, deal_price: 65000, quantity_available: 8, quantity_claimed: 5, end_time: Date.now() + 7*3600000, images: ['https://picsum.photos/seed/vario/1080/1920'], city: 'Yogyakarta' },
  { id: 'd5', title: 'Bakso Jumbo + Es Teh', domain: 'food', sub: 'Bakso urat jumbo dengan kuah kaldu sapi spesial, es teh manis', seller_name: 'Bakso Pak Budi', seller_photo: 'https://i.pravatar.cc/80?img=20', seller_rating: 4.8, original_price: 25000, deal_price: 15000, quantity_available: 100, quantity_claimed: 87, end_time: Date.now() + 1*3600000, images: ['https://picsum.photos/seed/bakso/1080/1920'], city: 'Semarang', is_hot: true },
  { id: 'd6', title: 'Wireless Earbuds Pro', domain: 'marketplace', sub: 'TWS noise cancelling, 30 jam battery, waterproof IPX5', seller_name: 'TechMax ID', seller_photo: 'https://i.pravatar.cc/80?img=25', seller_rating: 4.5, original_price: 450000, deal_price: 279000, quantity_available: 30, quantity_claimed: 12, end_time: Date.now() + 6*3600000, images: ['https://picsum.photos/seed/earbuds/1080/1920'], city: 'Jakarta' },
  { id: 'd7', title: 'Ojek Bandara Jogja', domain: 'rides', sub: 'Antar jemput bandara Adisucipto, motor bersih, driver ramah', seller_name: 'IndooRide Partner', seller_photo: 'https://i.pravatar.cc/80?img=33', seller_rating: 4.6, original_price: 80000, deal_price: 45000, quantity_available: 25, quantity_claimed: 18, end_time: Date.now() + 4*3600000, images: ['https://picsum.photos/seed/ojek/1080/1920'], city: 'Yogyakarta' },
  { id: 'd8', title: 'Couple Massage + Sauna', domain: 'massage', sub: 'Paket romantis 120 menit untuk berdua, include sauna & teh herbal', seller_name: 'Bali Spa', seller_photo: 'https://i.pravatar.cc/80?img=44', seller_rating: 4.9, original_price: 500000, deal_price: 299000, quantity_available: 10, quantity_claimed: 8, end_time: Date.now() + 1.5*3600000, images: ['https://picsum.photos/seed/couple/1080/1920'], city: 'Bali', is_hot: true },
]

const DISCOUNT_IMAGES = {
  10: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaa-removebg-preview.png',
  15: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaad-removebg-preview.png',
  20: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaada-removebg-preview.png',
  25: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadaf-removebg-preview.png',
  30: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafd-removebg-preview.png',
  35: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafde-removebg-preview.png',
  40: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafdedd-removebg-preview.png',
  45: 'https://ik.imagekit.io/nepgaxllc/6789.png',
  50: 'https://ik.imagekit.io/nepgaxllc/Untitledttt-removebg-preview.png',
}

function getDiscountImage(pct) {
  const tiers = [10, 15, 20, 25, 30, 35, 40, 45, 50]
  const closest = tiers.reduce((prev, curr) => Math.abs(curr - pct) < Math.abs(prev - pct) ? curr : prev)
  return DISCOUNT_IMAGES[closest]
}

const DOMAIN_COLORS = { food: '#F97316', marketplace: '#8DC63F', massage: '#A855F7', rentals: '#3B82F6', rides: '#EAB308' }
const DOMAIN_LABELS = { food: 'Makanan', marketplace: 'Market', massage: 'Massage', rentals: 'Rental', rides: 'Ojek' }

const FILTER_CITIES = ['All Cities', 'Yogyakarta', 'Jakarta', 'Surabaya', 'Bandung', 'Semarang', 'Medan', 'Makassar', 'Denpasar', 'Malang', 'Solo', 'Bali']
const FILTER_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'marketplace', label: 'Shopping' },
  { value: 'massage', label: 'Spa & Massage' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'rides', label: 'Rides & Transport' },
  { value: 'beauty', label: 'Beauty & Wellness' },
  { value: 'services', label: 'Services' },
]
const FILTER_CONDITIONS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
]
const FILTER_SORT = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest Discount' },
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'most_claimed', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
]
const FILTER_AVAILABILITY = [
  { value: 'all', label: 'All Deals' },
  { value: 'active', label: 'Active Only' },
  { value: 'almost_gone', label: 'Almost Gone (80%+)' },
  { value: 'hot', label: 'Hot Deals' },
]
const DISCOUNT_TIERS = [0, 10, 20, 30, 40, 50]

// ── Mock menu/catalogue items per seller ──────────────────────────────────────
const SELLER_ITEMS = {
  'Warung Bu Sari': [
    { id: 'm1', name: 'Nasi Goreng Spesial', price: 35000, image: 'https://picsum.photos/seed/ng1/200/200', category: 'Rice' },
    { id: 'm2', name: 'Mie Goreng Jawa', price: 30000, image: 'https://picsum.photos/seed/mg1/200/200', category: 'Noodles' },
    { id: 'm3', name: 'Ayam Penyet', price: 28000, image: 'https://picsum.photos/seed/ap1/200/200', category: 'Chicken' },
    { id: 'm4', name: 'Es Teh Manis', price: 5000, image: 'https://picsum.photos/seed/et1/200/200', category: 'Drinks' },
    { id: 'm5', name: 'Es Jeruk Segar', price: 8000, image: 'https://picsum.photos/seed/ej1/200/200', category: 'Drinks' },
    { id: 'm6', name: 'Soto Ayam', price: 25000, image: 'https://picsum.photos/seed/sa1/200/200', category: 'Soup' },
  ],
  'Bakso Pak Budi': [
    { id: 'm7', name: 'Bakso Jumbo', price: 25000, image: 'https://picsum.photos/seed/bk1/200/200', category: 'Bakso' },
    { id: 'm8', name: 'Bakso Urat', price: 30000, image: 'https://picsum.photos/seed/bu1/200/200', category: 'Bakso' },
    { id: 'm9', name: 'Mie Ayam', price: 20000, image: 'https://picsum.photos/seed/ma1/200/200', category: 'Noodles' },
    { id: 'm10', name: 'Es Teh', price: 5000, image: 'https://picsum.photos/seed/et2/200/200', category: 'Drinks' },
  ],
  'Kulit Asli': [
    { id: 'p1', name: 'Leather Wallet', price: 250000, image: 'https://picsum.photos/seed/lw1/200/200', category: 'Wallets' },
    { id: 'p2', name: 'Leather Belt', price: 180000, image: 'https://picsum.photos/seed/lb1/200/200', category: 'Belts' },
    { id: 'p3', name: 'Card Holder', price: 120000, image: 'https://picsum.photos/seed/ch1/200/200', category: 'Accessories' },
    { id: 'p4', name: 'Keychain Leather', price: 45000, image: 'https://picsum.photos/seed/kl1/200/200', category: 'Accessories' },
    { id: 'p5', name: 'Laptop Sleeve', price: 350000, image: 'https://picsum.photos/seed/ls1/200/200', category: 'Bags' },
  ],
  'TechMax ID': [
    { id: 'p6', name: 'Wireless Earbuds Pro', price: 450000, image: 'https://picsum.photos/seed/we1/200/200', category: 'Audio' },
    { id: 'p7', name: 'USB-C Hub 7in1', price: 285000, image: 'https://picsum.photos/seed/uh1/200/200', category: 'Accessories' },
    { id: 'p8', name: 'Phone Stand Magnetic', price: 95000, image: 'https://picsum.photos/seed/ps1/200/200', category: 'Accessories' },
    { id: 'p9', name: 'Portable Charger 20K', price: 320000, image: 'https://picsum.photos/seed/pc1/200/200', category: 'Power' },
  ],
  _default: [
    { id: 'g1', name: 'Service Package A', price: 150000, image: 'https://picsum.photos/seed/sp1/200/200', category: 'Services' },
    { id: 'g2', name: 'Service Package B', price: 250000, image: 'https://picsum.photos/seed/sp2/200/200', category: 'Services' },
    { id: 'g3', name: 'Premium Package', price: 400000, image: 'https://picsum.photos/seed/sp3/200/200', category: 'Premium' },
  ],
}

const DEMO_REVIEW_DATA = [
  { id: 'r1', deal_title: 'Nasi Goreng Spesial', stars: 5, photo_url: 'https://picsum.photos/seed/rev1/200/200', caption: 'Enak banget! Porsi besar', reviewer_name: 'Sari', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'r2', deal_title: 'Nasi Goreng Spesial', stars: 4, photo_url: 'https://picsum.photos/seed/rev2/200/200', caption: 'Sambalnya mantap', reviewer_name: 'Budi', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'r3', deal_title: 'Leather Wallet Handmade', stars: 5, photo_url: 'https://picsum.photos/seed/rev3/200/200', caption: 'Kualitas kulit bagus', reviewer_name: 'Rina', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 'r4', deal_title: 'Bakso Jumbo + Es Teh', stars: 5, photo_url: 'https://picsum.photos/seed/rev4/200/200', caption: 'Bakso terenak di Semarang!', reviewer_name: 'Agus', created_at: new Date(Date.now() - 345600000).toISOString() },
  { id: 'r5', deal_title: 'Full Body Massage 90min', stars: 4, photo_url: 'https://picsum.photos/seed/rev5/200/200', caption: 'Relax banget, recommended', reviewer_name: 'Dewi', created_at: new Date(Date.now() - 432000000).toISOString() },
]

function fmtRp(n) { return `Rp${(n ?? 0).toLocaleString('id-ID')}` }

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, endTime - now)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, expired: diff <= 0, urgent: diff < 3600000 && diff > 0 }
}

// ── Single full-screen deal slide ─────────────────────────────────────────────
function fmtRpShort(n) { return n >= 1000000 ? `${(n/1000000).toFixed(1).replace('.0','')}jt` : `Rp${(n??0).toLocaleString('id-ID')}` }

// ── Mock owner menus using real category images ───────────────────────────────
const MOCK_OWNER_MENU = [
  {
    catId: 'noodles', label: 'Noodles', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_35_10%20AM.png?updatedAt=1776710128590',
    dishes: [
      { id: 'n1', name: 'Mie Goreng Jawa', price: 28000 },
      { id: 'n2', name: 'Mie Ayam Bakso', price: 25000 },
      { id: 'n3', name: 'Kwetiau Seafood', price: 35000 },
    ],
  },
  {
    catId: 'rice', label: 'Rice', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_36_12%20AM.png?updatedAt=1776710188384',
    dishes: [
      { id: 'r1', name: 'Nasi Goreng Spesial', price: 35000 },
      { id: 'r2', name: 'Nasi Campur Bali', price: 32000 },
      { id: 'r3', name: 'Nasi Uduk Komplit', price: 22000 },
    ],
  },
  {
    catId: 'fried_chicken', label: 'Chicken', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_58_16%20AM.png',
    dishes: [
      { id: 'c1', name: 'Ayam Geprek Sambal', price: 25000 },
      { id: 'c2', name: 'Ayam Bakar Madu', price: 30000 },
      { id: 'c3', name: 'Chicken Katsu', price: 28000 },
    ],
  },
  {
    catId: 'satay', label: 'Satay', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_03_59%20AM.png',
    dishes: [
      { id: 's1', name: 'Sate Ayam 10pcs', price: 25000 },
      { id: 's2', name: 'Sate Kambing 10pcs', price: 35000 },
    ],
  },
  {
    catId: 'soups', label: 'Soups', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_55_38%20AM.png',
    dishes: [
      { id: 'sp1', name: 'Soto Ayam', price: 22000 },
      { id: 'sp2', name: 'Bakso Jumbo', price: 25000 },
      { id: 'sp3', name: 'Sop Buntut', price: 45000 },
    ],
  },
  {
    catId: 'tea_coffee', label: 'Drinks', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_00_14%20AM.png',
    dishes: [
      { id: 'd1', name: 'Es Teh Manis', price: 5000 },
      { id: 'd2', name: 'Kopi Susu', price: 15000 },
      { id: 'd3', name: 'Es Jeruk Segar', price: 8000 },
    ],
  },
  {
    catId: 'desserts', label: 'Desserts', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_02_58%20AM.png',
    dishes: [
      { id: 'ds1', name: 'Es Campur', price: 12000 },
      { id: 'ds2', name: 'Pisang Goreng Keju', price: 15000 },
    ],
  },
]

// ── Domain-specific mock catalogues (used in demo mode only) ─────────────────
const MOCK_CATALOGUES = {
  food: MOCK_OWNER_MENU,
  marketplace: [
    { catId: 'bags', label: 'Bags & Wallets', dishes: [
      { id: 'mp1', name: 'Handmade Leather Tote', price: 450000 },
      { id: 'mp2', name: 'Canvas Sling Bag', price: 185000 },
      { id: 'mp3', name: 'Minimalist Card Wallet', price: 95000 },
    ]},
    { catId: 'accessories', label: 'Accessories', dishes: [
      { id: 'mp4', name: 'Beaded Bracelet Set', price: 65000 },
      { id: 'mp5', name: 'Silver Ring — Handcrafted', price: 280000 },
      { id: 'mp6', name: 'Batik Silk Scarf', price: 175000 },
    ]},
    { catId: 'clothing', label: 'Clothing', dishes: [
      { id: 'mp7', name: 'Linen Oversized Shirt', price: 225000 },
      { id: 'mp8', name: 'Batik Print Shorts', price: 145000 },
    ]},
  ],
  massage: [
    { catId: 'body', label: 'Full Body', dishes: [
      { id: 'ms1', name: 'Traditional Javanese Massage — 60min', price: 150000 },
      { id: 'ms2', name: 'Deep Tissue — 90min', price: 220000 },
      { id: 'ms3', name: 'Aromatherapy — 60min', price: 180000 },
    ]},
    { catId: 'foot', label: 'Reflexology', dishes: [
      { id: 'ms4', name: 'Foot Reflexology — 45min', price: 95000 },
      { id: 'ms5', name: 'Hot Stone Feet — 60min', price: 130000 },
    ]},
    { catId: 'combo', label: 'Packages', dishes: [
      { id: 'ms6', name: 'Couple Spa Package — 120min', price: 500000 },
      { id: 'ms7', name: 'Full Day Wellness — 4hrs', price: 850000 },
    ]},
  ],
  rentals: [
    { catId: 'bikes', label: 'Motorcycles', dishes: [
      { id: 'rn1', name: 'Honda Vario 125 — per day', price: 75000 },
      { id: 'rn2', name: 'Yamaha NMAX — per day', price: 120000 },
      { id: 'rn3', name: 'Honda PCX 160 — per day', price: 150000 },
    ]},
    { catId: 'cars', label: 'Cars', dishes: [
      { id: 'rn4', name: 'Toyota Avanza — per day', price: 350000 },
      { id: 'rn5', name: 'Honda Jazz — per day', price: 400000 },
    ]},
    { catId: 'other', label: 'Other', dishes: [
      { id: 'rn6', name: 'Bicycle — per day', price: 35000 },
      { id: 'rn7', name: 'Portable Speaker — per day', price: 50000 },
    ]},
  ],
  rides: [
    { catId: 'promo', label: 'Ride Promos', dishes: [
      { id: 'rd1', name: 'Bike Ride — 5km', price: 15000 },
      { id: 'rd2', name: 'Car Taxi — 10km', price: 45000 },
      { id: 'rd3', name: 'Airport Transfer', price: 120000 },
    ]},
  ],
  property: [
    { catId: 'rooms', label: 'Rooms', dishes: [
      { id: 'pr1', name: 'Kos AC — monthly', price: 1500000 },
      { id: 'pr2', name: 'Studio Apartment — monthly', price: 3500000 },
    ]},
    { catId: 'villa', label: 'Villas', dishes: [
      { id: 'pr3', name: 'Bali Villa 2BR — per night', price: 850000 },
      { id: 'pr4', name: 'Jogja Guesthouse — per night', price: 350000 },
    ]},
  ],
}

function getMockCatalogue(domain) {
  return MOCK_CATALOGUES[domain] ?? MOCK_CATALOGUES.marketplace
}

// ── Seller menu/catalogue left-side drawer ────────────────────────────────────
// Shows real seller products/menu based on deal domain.
// Food deals → restaurant menu items. Other deals → marketplace products. Falls back to domain mock.
function SellerDrawer({ deal, open, onClose, onAddItem }) {
  const [expandedCat, setExpandedCat] = useState(null)
  const [sellerItems, setSellerItems] = useState(null)

  useEffect(() => {
    if (!open || !deal) return
    // Try to load real seller data
    const loadItems = async () => {
      const { supabase } = await import('@/lib/supabase')
      if (!supabase) { setSellerItems(null); return }

      if (deal.domain === 'food') {
        // Load menu items from this seller's restaurant
        const { data } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', deal.seller_id)
          .eq('is_available', true)
          .order('category')
        if (data?.length) {
          // Group by category
          const grouped = {}
          data.forEach(item => {
            const cat = item.category || 'Other'
            if (!grouped[cat]) grouped[cat] = { catId: cat, label: cat, dishes: [] }
            grouped[cat].dishes.push({ id: item.id, name: item.name, price: item.price })
          })
          setSellerItems(Object.values(grouped))
          return
        }
      } else {
        // Load marketplace products from this seller
        const { data } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('seller_id', deal.seller_id)
          .eq('status', 'active')
          .order('category')
        if (data?.length) {
          const grouped = {}
          data.forEach(item => {
            const cat = item.category || 'Other'
            if (!grouped[cat]) grouped[cat] = { catId: cat, label: cat, dishes: [] }
            grouped[cat].dishes.push({ id: item.id, name: item.name, price: item.price })
          })
          setSellerItems(Object.values(grouped))
          return
        }
      }
      setSellerItems(null) // fallback to mock
    }
    loadItems()
  }, [open, deal])

  if (!open) return null

  const menu = sellerItems ?? getMockCatalogue(deal?.domain)
  const isFood = deal?.domain === 'food'

  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawerPanel} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{deal?.seller_name ?? 'Seller'}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 2 }}>
            {isFood ? 'Full Menu' : 'Full Catalogue'} · {menu.reduce((t, c) => t + (c.dishes?.length ?? 0), 0)} items
          </span>
        </div>
        {menu.map(cat => (
          <div key={cat.catId}>
            <button
              className={`${styles.drawerCard} ${expandedCat === cat.catId ? styles.drawerCardActive : ''}`}
              onClick={() => setExpandedCat(expandedCat === cat.catId ? null : cat.catId)}
            >
              {cat.image && <img src={cat.image} alt="" className={styles.drawerCardImg} />}
              <span className={styles.drawerCardName}>{cat.label}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{cat.dishes?.length ?? 0}</span>
            </button>

            {expandedCat === cat.catId && (
              <div className={styles.drawerDishes}>
                {(cat.dishes ?? []).map(dish => (
                  <button key={dish.id} className={styles.drawerDish} onClick={() => onAddItem?.(dish, deal)}>
                    <span className={styles.drawerDishName}>{dish.name}</span>
                    <span className={styles.drawerDishPrice}>{fmtRpShort(dish.price)}</span>
                    <span className={styles.drawerDishAdd}>+</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DealSlide({ deal, isActive, onClaim, onChat, onViewSeller, onOpenMenu, onOpenDrawer, onChatInquiryChange, onHome, onReviewsChange }) {
  const { h, m, s, expired, urgent } = useCountdown(deal.end_time)
  const pct = Math.round((deal.quantity_claimed / deal.quantity_available) * 100)
  const discount = Math.round((1 - deal.deal_price / deal.original_price) * 100)
  const almostGone = pct >= 80
  const dealReviews = useMemo(() => DEMO_REVIEW_DATA.filter(r => r.deal_title === deal.title), [deal.title])
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatInquiryOpen, setChatInquiryOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const chatInputRef = useRef(null)

  const userProfile = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('indoo_demo_profile') || '{}') } catch { return {} }
  }, [])
  const userName = userProfile.name || userProfile.displayName || 'Guest'

  const handleSendInquiry = () => {
    if (!chatMsg.trim()) return
    const chatKey = `indoo_deal_chat_${deal.id}_${Date.now()}`
    const initMessages = [
      { id: Date.now(), from: 'system', text: `💬 Deal Inquiry\n\n${deal.title}\nPrice: ${fmtRp(deal.deal_price)}\nDiscount: ${discount}% OFF`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), image: deal.images?.[0] ?? null },
      { id: Date.now() + 1, from: 'customer', text: chatMsg.trim(), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
    ]
    localStorage.setItem(chatKey, JSON.stringify(initMessages))
    setChatInquiryOpen(false)
    onChatInquiryChange?.(false)
    setChatMsg('')
    onChat?.({ ...deal, _chatKey: chatKey, _inquiry: true })
  }

  return (
    <div className={styles.slide}>
      {/* Full-screen background image */}
      <div className={styles.slideBg} style={{ backgroundImage: `url("${deal.images?.[0] ?? ''}")` }} />
      <div className={styles.slideScrim} />

      {/* Discount + countdown — header right */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 10px)', right: 12, zIndex: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#FACC15', fontSize: 14, fontWeight: 900 }}>-{discount}%</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>·</span>
        <span style={{ color: urgent ? '#EF4444' : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 800 }}>
          {expired ? 'EXPIRED' : `Deal Ends ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
        </span>
      </div>

      {/* Right-side action buttons (TikTok style) */}
      <div className={styles.sideActions}>
        <button className={styles.sideBtn} onClick={() => onHome?.()}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </button>
        <button className={styles.sideBtn} onClick={() => { setChatInquiryOpen(true); onChatInquiryChange?.(true); setTimeout(() => chatInputRef.current?.focus(), 300) }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Chat</span>
        </button>
        <button className={styles.sideBtn} onClick={() => { setReviewsOpen(true); onReviewsChange?.(true) }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>{dealReviews.length || ''}</span>
          <span>Reviews</span>
        </button>
        <button className={styles.sideBtn} onClick={() => { try { navigator.share?.({ title: deal.title, text: `${deal.title} only ${fmtRp(deal.deal_price)}! 🔥`, url: window.location.href }) } catch {} }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="none"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#fff" strokeWidth="1.5"/></svg>
          <span>Share</span>
        </button>
        {onOpenDrawer && (
          <button className={styles.sideBtn} onClick={() => onOpenDrawer?.(deal)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span>Deals</span>
          </button>
        )}
      </div>

      {/* ── Chat inquiry popup ── */}
      {chatInquiryOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', touchAction: 'none', overscrollBehavior: 'contain' }} onClick={() => { setChatInquiryOpen(false); onChatInquiryChange?.(false) }} onTouchMove={e => e.stopPropagation()}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, borderRadius: '24px 24px 0 0', background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '2px solid rgba(141,198,63,0.5)', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', padding: '16px 18px 24px', animation: 'slideUp 0.3s ease-out' }}>
            {/* Drag handle — green */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#8DC63F', margin: '0 auto 14px' }} />

            {/* Deal card preview */}
            <div style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
                {deal.images?.[0] && <img src={deal.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.title}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(deal.deal_price)}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(deal.original_price)}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#FACC15' }}>-{discount}%</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, display: 'block' }}>by {deal.seller_name}</span>
              </div>
            </div>

            {/* User info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#8DC63F', fontWeight: 800 }}>{userName.charAt(0).toUpperCase()}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{userName}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>Anonymous Chat</span>
            </div>

            {/* Message input */}
            <div style={{ position: 'relative' }}>
              <textarea
                ref={chatInputRef}
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                placeholder="Ask about this deal..."
                rows={3}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendInquiry() } }}
              />
            </div>

            {/* Quick question chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, marginBottom: 14 }}>
              {['Is this still available?', 'Can I pick up today?', 'Any other sizes?', 'Can you deliver?'].map(q => (
                <button key={q} onClick={() => setChatMsg(q)} style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{q}</button>
              ))}
            </div>

            {/* Send button */}
            <button
              onClick={handleSendInquiry}
              disabled={!chatMsg.trim()}
              style={{ width: '100%', padding: 14, borderRadius: 14, background: chatMsg.trim() ? '#8DC63F' : 'rgba(141,198,63,0.2)', border: 'none', color: chatMsg.trim() ? '#000' : 'rgba(0,0,0,0.3)', fontSize: 15, fontWeight: 900, cursor: chatMsg.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.2s' }}
            >
              Send Message
            </button>
          </div>
        </div>
      )}

      {/* Reviews panel — slides up from bottom */}
      {reviewsOpen && (
        <div className={styles.reviewsOverlay} onClick={() => { setReviewsOpen(false); onReviewsChange?.(false) }}>
          <div className={styles.reviewsPanel} onClick={e => e.stopPropagation()}>
            {/* Green drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><span style={{ width: 36, height: 4, borderRadius: 2, background: '#8DC63F' }} /></div>

            {/* Header — logo style + rating + close */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '4px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 0.02 }}>Reviews</h2>
                {dealReviews.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#FACC15' }}>{(dealReviews.reduce((a, r) => a + r.stars, 0) / dealReviews.length).toFixed(1)}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 14, color: '#FACC15', letterSpacing: 1 }}>{'���'.repeat(Math.round(dealReviews.reduce((a, r) => a + r.stars, 0) / dealReviews.length))}{'☆'.repeat(5 - Math.round(dealReviews.reduce((a, r) => a + r.stars, 0) / dealReviews.length))}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{dealReviews.length} review{dealReviews.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => { setReviewsOpen(false); onReviewsChange?.(false) }} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Write review button */}
            <div style={{ padding: '12px 16px' }}>
              <button onClick={() => { setReviewsOpen(false); onReviewsChange?.(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.25)', borderRadius: 14, cursor: 'pointer', color: '#8DC63F', fontSize: 14, fontWeight: 800, fontFamily: 'inherit' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>Write a Review</span>
              </button>
            </div>

            {/* Review cards */}
            {dealReviews.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 40 }}>⭐</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>No reviews yet</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Be the first to review this deal</span>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dealReviews.map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 12, padding: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }}>
                    <img src={r.photo_url} alt="" style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{r.reviewer_name}</span>
                        <span style={{ fontSize: 12, color: '#FACC15', letterSpacing: 1 }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4 }}>{r.caption}</p>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom overlay — deal info */}
      <div className={styles.slideBottom}>
        {/* Title */}
        <h2 className={styles.slideTitle}>{deal.title}</h2>

        {/* Description */}
        <p className={styles.slideSub}>{deal.sub}</p>

        {/* Seller + location */}
        <div className={styles.sellerRow}>
          <img src={deal.seller_photo ?? 'https://i.pravatar.cc/40'} alt="" className={styles.sellerThumb} />
          <span className={styles.sellerName}>{deal.seller_name}</span>
          {deal.seller_rating && <span className={styles.sellerRating}>★ {deal.seller_rating}</span>}
        </div>

        {/* Price row */}
        <div className={styles.priceRow}>
          <span className={styles.dealPrice}>{fmtRp(deal.deal_price)}</span>
          <span className={styles.origPrice}>{fmtRp(deal.original_price)}</span>
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{
                width: `${pct}%`,
                background: pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#8DC63F',
              }}
            />
          </div>
          <div className={styles.progressInfo}>
            <span>{deal.quantity_claimed} of {deal.quantity_available} claimed</span>
            {almostGone && <span className={styles.almostGone}>Almost Gone!</span>}
          </div>
        </div>

        {/* Claim button */}
        <button
          className={`${styles.claimBtn} ${expired || pct >= 100 ? styles.claimBtnDisabled : ''}`}
          onClick={() => !expired && pct < 100 && onClaim?.(deal)}
          disabled={expired || pct >= 100}
        >
          {pct >= 100 ? 'Sold Out!' : expired ? 'Deal Ended' : `🔥 -{discount}% Get This Deal — ${fmtRp(deal.deal_price)}`}
        </button>

        {/* Social proof */}
        <p className={styles.socialProof}>{Math.floor(Math.random() * 200 + 50)} people viewing this deal</p>
      </div>

      {/* Seller menu/catalogue drawer */}
      <SellerDrawer
        deal={deal}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAddItem={(item, d) => { setMenuOpen(false); onChat?.(d) }}
      />
    </div>
  )
}

// ── Main TikTok-style feed ────────────────────────────────────────────────────
const LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2020,%202026,%2011_03_28%20PM.png'

export default function DealHuntLanding({ open, onClose, onSelectDeal, onCreateDeal, onViewSeller }) {
  const { t, lang, setLang } = useLanguage()
  const [showLanding, setShowLanding] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [onBanner, setOnBanner] = useState(true)
  const [userTouched, setUserTouched] = useState(false)
  const [confirmDeal, setConfirmDeal] = useState(null)
  const [dealChatOpen, setDealChatOpen] = useState(null)
  const [sellerDrawerDeal, setSellerDrawerDeal] = useState(null)
  const [fullCardDeal, setFullCardDeal] = useState(null) // deal to show as full screen card overlay
  const [chatInquiryVisible, setChatInquiryVisible] = useState(false)
  const [reviewsVisible, setReviewsVisible] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    city: 'all',
    category: 'all',
    priceMin: '',
    priceMax: '',
    condition: 'all',
    sortBy: 'relevance',
    discountMin: 0,
    availability: 'all',
  })
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  const handleGetDeal = (deal) => setConfirmDeal(deal)

  const handleRequestExpiredDeal = (deal) => {
    const chatKey = `indoo_deal_chat_${deal.id}_${Date.now()}`
    const discount = deal.original_price > 0 ? Math.round((1 - (deal.deal_price || deal.dealPrice || 0) / (deal.original_price || deal.originalPrice || 1)) * 100) : 0
    const price = (deal.deal_price || deal.dealPrice || 0)
    const initMessages = [
      { id: Date.now(), from: 'system', text: `🔥 Deal Request\n\nA buyer is interested in your expired deal:\n\n${deal.title}\nPrevious Price: Rp ${price.toLocaleString('id-ID')}\nDiscount: ${discount}% OFF`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), image: deal.images?.[0] ?? null },
      { id: Date.now() + 1, from: 'customer', text: `Hi! I noticed your deal for "${deal.title}" has expired. I'm really interested — would you be able to reactivate it at the same price of Rp ${price.toLocaleString('id-ID')}? Let me know if this deal is still available! 🙏`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
      { id: Date.now() + 2, from: 'seller', text: `Thanks for your interest in "${deal.title}"! Let me check if I can reactivate this deal for you. One moment please... 🔥`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
    ]
    localStorage.setItem(chatKey, JSON.stringify(initMessages))
    setSellerDrawerDeal(null)
    setDealChatOpen({ ...deal, _chatKey: chatKey })
  }

  const handleConfirmYes = () => {
    const deal = confirmDeal
    setConfirmDeal(null)
    // Auto-post initial deal message in chat
    const chatKey = `indoo_deal_chat_${deal.id}_${Date.now()}`
    const userProfile = (() => { try { return JSON.parse(localStorage.getItem('indoo_demo_profile') || '{}') } catch { return {} } })()
    const initMessages = [
      { id: Date.now(), from: 'system', text: `🔥 Deal Confirmed!\n\n${deal.title}\nLocked Price: Rp ${(deal.deal_price ?? 0).toLocaleString('id-ID')}\nDiscount: ${Math.round((1 - deal.deal_price / deal.original_price) * 100)}% OFF`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), image: deal.images?.[0] ?? null },
      { id: Date.now() + 1, from: 'customer', text: `Hi, I'd like to confirm this deal for ${deal.title} at the locked price of Rp ${(deal.deal_price ?? 0).toLocaleString('id-ID')}. Can we discuss the details?`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
    ]
    localStorage.setItem(chatKey, JSON.stringify(initMessages))
    setDealChatOpen({ ...deal, _chatKey: chatKey })
  }

  // Reset to landing page every time Deal Hunt opens
  useEffect(() => {
    if (open) {
      setShowLanding(true)
      setActiveIndex(0)
      setUserTouched(false)
    }
  }, [open])
  const containerRef = useRef(null)
  const autoScrollRef = useRef(null)
  const deals = DEMO_DEALS

  // Banner positions in the feed: 0, 11, 22, 33... (every 10 deals + 1 banner)
  const bannerPositions = useMemo(() => {
    const positions = new Set()
    let feedIdx = 0
    for (let i = 0; i < deals.length; i++) {
      if (i % 10 === 0) { positions.add(feedIdx); feedIdx++ }
      feedIdx++
    }
    return positions
  }, [deals.length])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    setActiveIndex(idx)
    setOnBanner(bannerPositions.has(idx))
  }, [bannerPositions])

  // Auto-scroll through all deals once on first load, stop when user touches
  useEffect(() => {
    if (!open || userTouched) return
    let current = 0
    autoScrollRef.current = setInterval(() => {
      current++
      if (current >= deals.length) {
        clearInterval(autoScrollRef.current)
        // Scroll back to first deal
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      containerRef.current?.scrollTo({
        top: current * window.innerHeight,
        behavior: 'smooth',
      })
    }, 3000) // 3 seconds per deal
    return () => clearInterval(autoScrollRef.current)
  }, [open, userTouched, deals.length])

  // Stop auto-scroll on any touch
  const handleTouch = useCallback(() => {
    if (!userTouched) {
      setUserTouched(true)
      clearInterval(autoScrollRef.current)
    }
  }, [userTouched])

  if (!open) return null

  return createPortal(
    <div className={styles.screen} onTouchStart={handleTouch} onMouseDown={handleTouch}>

      {/* ── Landing splash ── */}
      {showLanding && (
        <div className={styles.landingSplash}>
          <img src={LANDING_BG} alt="" className={styles.landingBgImg} />
          <div className={styles.landingOverlay} />

          {/* Header */}
          <div className={styles.landingHeader}>
            <div className={styles.landingHeaderTop}>
              <span className={styles.landingHeaderBrand}>IND<span>OO</span></span>
              <span className={styles.landingHeaderLive}>● LIVE</span>
            </div>
          </div>

          {/* Side nav — Home + Join */}
          <div className={styles.landingSideNav}>
            <button className={styles.landingSideBtn} onClick={onClose}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </button>
            <button className={styles.landingSideBtn} onClick={() => { setShowLanding(false); onCreateDeal?.() }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <span>Join</span>
            </button>
          </div>

          <div className={styles.landingContent}>
            <h1 className={styles.landingTitle}>{t('dealhunt.landing.title')}</h1>
            <p className={styles.landingSub}>{t('dealhunt.landing.sub')}</p>

            {/* Language selector */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, marginBottom: 8 }}>
              {[
                { code: 'en', flag: '🇬🇧', label: 'English' },
                { code: 'id', flag: '🇮🇩', label: 'Bahasa' },
                { code: 'zh', flag: '🇨🇳', label: '中文' },
                { code: 'ar', flag: '🇸🇦', label: 'العربية' },
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  style={{
                    padding: '6px 12px', borderRadius: 12,
                    background: lang === l.code ? 'rgba(141,198,63,0.2)' : 'rgba(0,0,0,0.4)',
                    border: lang === l.code ? '1.5px solid rgba(141,198,63,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                    color: lang === l.code ? '#8DC63F' : 'rgba(255,255,255,0.6)',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.landingBtnWrap}>
              <div className={styles.fireParticles}>
                {[...Array(6)].map((_, i) => (
                  <span key={i} className={styles.fireParticle} style={{ '--i': i }} />
                ))}
              </div>
              <button className={styles.landingBtn} onClick={() => setShowLanding(false)}>
                {t('dealhunt.landing.start')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title + search bar */}
      {!showLanding && !onBanner && (
        <div style={{ position: 'fixed', top: 'env(safe-area-inset-top, 0px)', left: 0, right: 0, zIndex: 9510, padding: '8px 14px 0', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'auto' }}>
            <span className={styles.headerBrand}>DEAL <span style={{ color: '#8DC63F' }}>HUNT</span></span>
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
            <div
              onClick={() => {/* TODO: open search */}}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Search deals, sellers...</span>
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              style={{ padding: '8px 14px', borderRadius: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, position: 'relative' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F' }}>Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hide feed + header sub when landing is showing */}
      {showLanding && <style>{`.${styles.headerSub}, .${styles.feed}, .${styles.fab} { display: none !important; }`}</style>}

      {/* Snap-scroll vertical feed with promo banners */}
      <div className={styles.feed} ref={containerRef} onScroll={handleScroll}>
        {(() => {
          const items = []
          let lastBanner = null
          deals.forEach((deal, i) => {
            // Insert banner at start and every 10 deals
            if (i % 10 === 0) {
              const banner = getRandomBanner(lastBanner)
              lastBanner = banner
              items.push(
                <div key={`banner-${i}`} className={styles.slide} style={{ background: '#000' }}>
                  {/* Banner image — full screen width, stretched to fill */}
                  <img
                    src={banner}
                    alt=""
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100vw', height: '100%',
                      objectFit: 'fill',
                    }}
                  />
                  {/* Swipe hint — yellow arrow button, tap to scroll down */}
                  <div style={{
                    position: 'absolute', bottom: 50, left: 0, right: 0, zIndex: 3,
                    display: 'flex', justifyContent: 'center',
                    animation: 'arrowFloat 1.2s ease-in-out infinite',
                  }}>
                    <button
                      onClick={() => {
                        const el = containerRef.current
                        if (el) el.scrollBy({ top: el.clientHeight, behavior: 'smooth' })
                      }}
                      style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.8)', border: '2px solid rgba(250,204,21,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 16px rgba(250,204,21,0.4)',
                        cursor: 'pointer', padding: 0,
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 14" fill="#FACC15" stroke="none" style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.8))' }}>
                        <path d="M4 2l8 8 8-8 2 2-10 10L2 4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            }
            items.push(
              <DealSlide
                key={deal.id}
                deal={deal}
                isActive={false}
                onClaim={(d) => handleGetDeal(d)}
                onChat={(d) => d._chatKey ? setDealChatOpen(d) : handleGetDeal(d)}
                onOpenMenu={(d) => setSellerDrawerDeal(d)}
                onOpenDrawer={(d) => setSellerDrawerDeal(d)}
                onChatInquiryChange={setChatInquiryVisible}
                onReviewsChange={setReviewsVisible}
                onHome={onClose}
              />
            )
          })
          return items
        })()}
      </div>

      {/* Seller Deals Drawer */}
      {sellerDrawerDeal && (
        <SellerDealsDrawer
          open={!!sellerDrawerDeal}
          onClose={() => setSellerDrawerDeal(null)}
          sellerId={'demo'}
          sellerName={sellerDrawerDeal.seller_name ?? 'Seller'}
          onSelectDeal={(deal) => { setSellerDrawerDeal(null); setFullCardDeal(deal) }}
          onRequestDeal={handleRequestExpiredDeal}
        />
      )}

      {/* ── Full-screen scrollable feed from drawer selection ── */}
      {fullCardDeal && (() => {
        // Build feed: selected deal → other live seller deals → normal feed
        const sellerId = fullCardDeal.seller_id || fullCardDeal.sellerId || ''
        const sellerLiveDeals = MOCK_SELLER_DEALS.filter(
          d => (d.status === 'active' || d.active === true) && d.id !== fullCardDeal.id
        )
        const normalDeals = DEMO_DEALS.filter(d => d.id !== fullCardDeal.id)
        const combinedFeed = [fullCardDeal, ...sellerLiveDeals, ...normalDeals]

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9600, background: '#000' }}>
            {/* Scrollable snap feed */}
            <div style={{ width: '100%', height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}>
              {combinedFeed.map((d, i) => (
                <DealSlide
                  key={d.id + '-overlay-' + i}
                  deal={d}
                  isActive={true}
                  onClaim={(dd) => { setFullCardDeal(null); handleGetDeal(dd) }}
                  onChat={(dd) => { setFullCardDeal(null); dd._chatKey ? setDealChatOpen(dd) : handleGetDeal(dd) }}
                  onOpenDrawer={(dd) => setSellerDrawerDeal(dd)}
                  onChatInquiryChange={setChatInquiryVisible}
                  onReviewsChange={setReviewsVisible}
                  onHome={() => { setFullCardDeal(null); onClose?.() }}
                />
              ))}
            </div>
            {/* Close button */}
            <button
              onClick={() => setFullCardDeal(null)}
              style={{
                position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', left: 12,
                zIndex: 9610, width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
          </div>
        )
      })()}

      {/* FAB — create deal (hidden when chat inquiry is open) */}
      <button className={styles.fab} onClick={onCreateDeal} style={(chatInquiryVisible || reviewsVisible) ? { display: 'none' } : undefined}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Confirm Deal Popup */}
      {confirmDeal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '90%', maxWidth: 340, borderRadius: 24, background: 'rgba(10,10,10,0.95)', border: '1.5px solid rgba(141,198,63,0.2)', padding: 24, textAlign: 'center' }}>
            {confirmDeal.images?.[0] && (
              <img src={confirmDeal.images[0]} alt="" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', margin: '0 auto 16px', display: 'block' }} />
            )}
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 4 }}>Confirm Deal?</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 12 }}>{confirmDeal.title}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F' }}>Rp {(confirmDeal.deal_price ?? 0).toLocaleString('id-ID')}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>Rp {(confirmDeal.original_price ?? 0).toLocaleString('id-ID')}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15', display: 'block', marginBottom: 20 }}>🏷️ {Math.round((1 - confirmDeal.deal_price / confirmDeal.original_price) * 100)}% OFF — Locked Price</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDeal(null)} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                No Deal
              </button>
              <button onClick={handleConfirmYes} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes Deal! 🔥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Sheet — Premium ── */}
      {filterOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: '2px solid rgba(141,198,63,0.5)', animation: 'slideUp 0.3s ease-out' }}>

          {/* ─ Page content (no scroll) ─ */}
          <div style={{ flex: 1, padding: '18px 16px 100px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

            {/* Header — logo + sub + close + reset */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 0.04, margin: 0, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>DEAL <span style={{ color: '#8DC63F' }}>HUNT</span></h1>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'block', marginTop: 2 }}>Refine your search results</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => { setFilters({ city: 'all', category: 'all', priceMin: '', priceMax: '', condition: 'all', sortBy: 'relevance', discountMin: 0, availability: 'all' }); setActiveFilterCount(0) }} style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Reset</button>
                <button onClick={() => setFilterOpen(false)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* ── Sort By — dropdown ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Sort By</span>
              </div>
              <select
                value={filters.sortBy}
                onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(141,198,63,0.2)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%238DC63F\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
              >
                {FILTER_SORT.map(s => <option key={s.value} value={s.value} style={{ background: '#111', color: '#fff' }}>{s.label}</option>)}
              </select>
            </div>

            {/* ── City — dropdown ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>City</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>Select location</span>
              </div>
              <select
                value={filters.city}
                onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(141,198,63,0.2)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%238DC63F\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
              >
                {FILTER_CITIES.map(c => <option key={c} value={c === 'All Cities' ? 'all' : c} style={{ background: '#111', color: '#fff' }}>{c}</option>)}
              </select>
            </div>

            {/* ── Category — dropdown ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Category</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>Product type</span>
              </div>
              <select
                value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(141,198,63,0.2)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%238DC63F\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
              >
                {FILTER_CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: '#111', color: '#fff' }}>{c.label}</option>)}
              </select>
            </div>

            {/* ── Price Range ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Price Range</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>IDR</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="number" placeholder="Min" value={filters.priceMin} onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value }))} style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(141,198,63,0.2)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <span style={{ color: 'rgba(141,198,63,0.4)', fontSize: 16, fontWeight: 700 }}>—</span>
                <input type="number" placeholder="Max" value={filters.priceMax} onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value }))} style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(141,198,63,0.2)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>

            {/* ── Minimum Discount ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Minimum Discount</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {DISCOUNT_TIERS.map(d => (
                  <button key={d} onClick={() => setFilters(f => ({ ...f, discountMin: d }))} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: filters.discountMin === d ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${filters.discountMin === d ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.08)'}`, color: filters.discountMin === d ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>{d === 0 ? 'Any' : `${d}%+`}</button>
                ))}
              </div>
            </div>

            {/* ── Condition — dropdown ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Condition</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>New or used</span>
              </div>
              <select
                value={filters.condition}
                onChange={e => setFilters(f => ({ ...f, condition: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(141,198,63,0.2)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%238DC63F\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
              >
                {FILTER_CONDITIONS.map(c => <option key={c.value} value={c.value} style={{ background: '#111', color: '#fff' }}>{c.label}</option>)}
              </select>
            </div>

            {/* ── Availability — dropdown ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Availability</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>Deal status</span>
              </div>
              <select
                value={filters.availability}
                onChange={e => setFilters(f => ({ ...f, availability: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(141,198,63,0.2)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%238DC63F\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
              >
                {FILTER_AVAILABILITY.map(a => <option key={a.value} value={a.value} style={{ background: '#111', color: '#fff' }}>{a.label}</option>)}
              </select>
            </div>
          </div>

          {/* ─ Sticky apply bar ─ */}
          <div style={{ flexShrink: 0, padding: '14px 16px', background: '#080808', borderTop: '1px solid rgba(141,198,63,0.15)' }}>
            <button
              onClick={() => {
                let count = 0
                if (filters.city !== 'all') count++
                if (filters.category !== 'all') count++
                if (filters.priceMin) count++
                if (filters.priceMax) count++
                if (filters.condition !== 'all') count++
                if (filters.sortBy !== 'relevance') count++
                if (filters.discountMin > 0) count++
                if (filters.availability !== 'all') count++
                setActiveFilterCount(count)
                setFilterOpen(false)
              }}
              style={{ width: '100%', padding: 15, borderRadius: 16, background: 'linear-gradient(135deg, #8DC63F 0%, #6ba32e 100%)', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5 }}
            >
              Apply Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        </div>
      )}

      {/* Deal Chat */}
      {dealChatOpen && <DealChat deal={dealChatOpen} onClose={() => setDealChatOpen(null)} />}
    </div>,
    document.body
  )
}
