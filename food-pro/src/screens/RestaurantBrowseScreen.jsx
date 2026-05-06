import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { supabase } from '@/lib/supabase'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useLanguage, LANGUAGES } from '@/i18n'
import { haversineKm } from '@/utils/distance'
import RestaurantMenuSheet from '@/components/restaurant/RestaurantMenuSheet'
import RestaurantLandingPage from '@/components/restaurant/RestaurantLandingPage'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import { hasVisitedSection, markSectionVisited } from '@/services/sectionVisitService'
import FoodFooterNav from '@/components/restaurant/FoodFooterNav'
import FoodDashboard from '@/components/restaurant/FoodDashboard'
import LiveChatSheet from '@/components/restaurant/LiveChatSheet'
import { lazy, Suspense } from 'react'
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'))
const NotificationsScreen = lazy(() => import('@/screens/NotificationsScreen'))
import { getRestaurantExtras } from '@/services/vendorExtrasService'
import { createFoodOrder, searchFoodDrivers, subscribeToFoodOrder } from '@/services/foodOrderService'
import { recordCommission } from '@/services/commissionService'
import { getFoodOrders, saveFoodOrders } from '@/components/restaurant/menuSheetConstants'
import PromoBannerPage from '@/components/restaurant/PromoBannerPage'
import ContactUsPage from '@/components/ui/ContactUsPage'
import WhatsAppInput from '@/components/ui/WhatsAppInput'
import { CustomerPopup, DeliveryBanner, useCustomerLocation, calculateDelivery } from '@/components/restaurant/DeliveryEstimate'
import styles from './RestaurantBrowseScreen.module.css'

// Footer nav button styles
const footerBtnStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', minWidth: 48 }
const footerLabelStyle = { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }

const FOOD_LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%204,%202026,%2004_13_42%20PM.png'

function FoodLanding({ onBrowse, onClose, onSelectVendorType }) {
  const [contactUsOpen, setContactUsOpen] = useState(false)
  const { lang, setLang } = useLanguage()
  const [showLangPicker, setShowLangPicker] = useState(false)
  return (
    <div className={styles.landingPage} style={{ backgroundImage: `url("${FOOD_LANDING_BG}")` }}>

      {/* Language button — top right */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', right: 16, zIndex: 20 }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLangPicker(prev => !prev)} style={{
            width: 40, height: 40, borderRadius: '50%', padding: 0,
            border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)',
            cursor: 'pointer', overflow: 'hidden', backdropFilter: 'blur(8px)',
          }}>
            <img src={LANGUAGES.find(l => l.code === lang)?.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </button>
          {showLangPicker && (
            <div style={{ position: 'absolute', top: 48, right: 0, background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 120, backdropFilter: 'blur(12px)' }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false) }} style={{
                  width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: l.code === lang ? 'rgba(141,198,63,0.1)' : 'none',
                  color: l.code === lang ? '#8DC63F' : '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <img src={l.image} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain' }} /> {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.landingContent}>
        <div style={{ marginTop: -370, marginBottom: 8, textAlign: 'center', width: '100%' }}>
          <span style={{
            fontSize: 10.9,
            fontWeight: 900,
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'transparent',
            backgroundImage: 'linear-gradient(180deg, rgba(60,28,6,0.8) 0%, rgba(60,28,6,0.8) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            textShadow: '0 1px 0 rgba(0,0,0,0.3)',
            letterSpacing: '8px',
            textTransform: 'uppercase',
            userSelect: 'none',
            filter: 'contrast(1.3)',
          }}>Street Local Live</span>
        </div>
      </div>

      {/* Enter button at footer */}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        <style>{`@keyframes btnGlow { 0% { left: -100%; } 100% { left: 200%; } }`}</style>
        <button
          onClick={onBrowse}
          style={{
            padding: '14px 50px', border: 'none',
            background: '#FACC15', borderRadius: 12,
            cursor: 'pointer',
            color: '#000', fontSize: 16, fontWeight: 800,
            letterSpacing: '3px', textTransform: 'uppercase',
            fontFamily: 'inherit',
            position: 'relative',
            overflow: 'hidden',
            marginTop: 8,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 12 }}>
            <div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', animation: 'btnGlow 3s ease-in-out infinite' }} />
          </div>
          <span style={{ position: 'relative', zIndex: 1 }}>Enter</span>
        </button>
      </div>
    </div>
  )
}

// Kemenhub Zone 1 (Java/Bali) bike delivery rates

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_RESTAURANTS = [
  // ── RICE ────────────────────────────────────────────────────────────────────
  {
    id: 1, name: 'Street Local Live', cuisine_type: 'Grill & BBQ', category: 'rice', vendor_type: 'restaurant',
    address: 'Jl. Malioboro 45, Yogyakarta', city: 'Yogyakarta', lat: -7.7928, lng: 110.3657,
    phone: '6281234567890', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
    hero_dish_name: 'Grilled Platter',
    description: 'Indonesian & Western grilled favourites. Sate ayam, iga bakar, BBQ ribs, grilled seafood — fired over charcoal in the heart of Yogyakarta.',
    opening_hours: '07:00–21:00', is_open: true, rating: 4.8, review_count: 124,
    price_from: 5000, price_to: 28000, min_order: 20000,
    catering_available: true, seating_capacity: 40,
    event_features: ['birthday_setup', 'private_room'],
    featured_this_week: true, dine_in_discount: 10, status: 'approved',
    tour_guide_package: { min_pax: 20, price_per_pax: 25000, discount: 15, includes: 'Gudeg + rice + egg + tea', bus_parking: false },
    bank: { name: 'BCA', account_number: '1234 5678 90', account_holder: 'Sari Warung Jogja', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BCA-1234567890-SariWarung' },
    menu_items: [
      { id: 1,  name: 'Nasi Gudeg Komplit',  price: 28000, prep_time_min: 10, category: 'Rice',           description: 'Slow-cooked overnight jackfruit curry served with a perfectly boiled egg, shredded free-range chicken, crispy krecek beef skin, and fluffy steamed white rice. A Yogyakarta classic since 1985 — every spoonful tells the story of patience and tradition passed down through three generations.', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 2,  name: 'Nasi Gudeg Telur',    price: 18000, prep_time_min: 8,  category: 'Rice',           description: 'The classic Jogja combo — sweet jackfruit curry simmered in coconut milk for six hours, paired with a whole hard-boiled egg soaked in rich brown spice broth. Served on a bed of warm rice with sambal krecek on the side for that perfect kick of heat and crunch.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 3,  name: 'Nasi Gudeg Ayam',     price: 25000, prep_time_min: 10, category: 'Rice',           description: 'Tender shredded chicken slow-cooked alongside young jackfruit in a fragrant blend of palm sugar, galangal, and bay leaves. The meat falls apart at the touch of a fork, drenched in sweet coconut gravy — a comfort dish that locals queue for before sunrise every morning.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 4,  name: 'Krecek Sapi',         price: 12000, prep_time_min: 5,  category: 'Snacks & Bites', description: 'Crispy dried beef skin braised in a fiery coconut-chilli sauce until it absorbs every drop of flavour. The texture is addictive — crunchy on the outside, slightly chewy within. A beloved Javanese side dish that transforms any plate of rice into something extraordinary and unforgettable.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 5,  name: 'Tempe Bacem',         price: 8000,  prep_time_min: 3,  category: 'Gorengan',       description: 'Thick slabs of local tempeh braised in a sweet Javanese marinade of palm sugar, coriander, galangal, and bay leaves until deeply caramelised. Then lightly fried to golden perfection — crispy edges with a soft, nutty centre. The ultimate plant-based protein snack loved across all of Java.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 6,  name: 'Tahu Goreng',         price: 6000,  prep_time_min: 3,  category: 'Gorengan',       description: 'Fresh handmade tofu from the local market, deep-fried in clean oil until the outside is shatteringly crisp and golden while the inside stays silky smooth and pillowy soft. Served piping hot with a side of sweet kecap manis and sliced bird-eye chilli for dipping.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 7,  name: 'Kerupuk Udang',       price: 4000,  prep_time_min: 1,  category: 'Snacks & Bites', description: 'Light, airy prawn crackers made fresh daily from a generations-old family recipe. Real shrimp pounded into tapioca starch, sun-dried on bamboo racks, then flash-fried to order so every piece puffs up crisp and full of ocean flavour. The perfect crunchy companion to any Indonesian meal.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 8,  name: 'Es Teh Manis',        price: 5000,  prep_time_min: 2,  category: 'Tea & Coffee',   description: 'Javanese sweet iced tea brewed strong from premium local tea leaves, sweetened with pure cane sugar while still hot, then poured over a generous glass of crushed ice. Simple, refreshing, and absolutely essential — the drink that every Indonesian reaches for first on a hot afternoon.', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 9,  name: 'Es Jeruk Peras',      price: 8000,  prep_time_min: 3,  category: 'Juice & Smoothie', description: 'Hand-squeezed fresh local oranges — no concentrate, no preservatives, just pure citrus goodness served over ice with a touch of simple syrup. Each glass takes four whole oranges, pressed to order so the vitamins hit you at peak freshness. Tangy, sweet, and bursting with natural energy.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 10, name: 'Wedang Jahe',         price: 7000,  prep_time_min: 3,  category: 'Tea & Coffee',   description: 'A warming traditional Javanese ginger drink made from freshly pounded young ginger root, simmered with lemongrass, pandan leaf, and palm sugar until aromatic and golden. Served steaming hot — soothes the throat, warms the belly, and pairs beautifully with gudeg on cool evening visits.', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
    ],
  },
  {
    id: 4, name: 'Nasi Goreng Pak Harto', cuisine_type: 'Indonesian', category: 'rice', vendor_type: 'street_vendor',
    address: 'Jl. Kaliurang Km 3, Yogyakarta', city: 'Yogyakarta', lat: -7.7745, lng: 110.3802,
    phone: '6281234567894', cover_url: null, hero_dish_url: 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdfadsfasdfsdfsasdassdasd.png',
    hero_dish_name: 'Nasi Goreng Istimewa',
    description: 'Wok-fired fried rice cooked over charcoal. High heat, smoky flavour, zero shortcuts.',
    opening_hours: '10:00–23:00', is_open: true, rating: 4.7, review_count: 208,
    price_from: 15000, price_to: 35000, min_order: 15000,
    catering_available: false, seating_capacity: 20,
    event_features: [],
    featured_this_week: false, dine_in_discount: 15, status: 'approved',
    bank: { name: 'Mandiri', account_number: '1100 0987 6543', account_holder: 'Harto Wijaya', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Mandiri-11000987654-HartoWijaya' },
    menu_items: [
      { id: 20, name: 'Nasi Goreng Istimewa', price: 28000, prep_time_min: 12, category: 'Rice',             description: 'Our signature charcoal wok-fired fried rice. Cooked over intense flame for that smoky aroma you can smell from the street. Topped with a fried egg, shredded chicken, fresh vegetables, and our secret homemade shrimp paste that took years to perfect.', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 21, name: 'Nasi Goreng Seafood',  price: 35000, prep_time_min: 15, category: 'Rice',             description: 'Premium seafood fried rice loaded with fresh prawns, tender squid rings, and sweet crab meat. Every grain of rice is kissed by the charcoal wok flame and seasoned with garlic butter, fish sauce, and a touch of white pepper. The ocean on a plate.', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
      { id: 22, name: 'Nasi Goreng Kampung',  price: 20000, prep_time_min: 10, category: 'Rice',             description: 'Village-style fried rice the way your grandmother made it — simple, honest, and packed with flavour. Salted anchovies, free-range egg, bird-eye chilli, and fresh herbs from the morning market. No shortcuts, no fancy tricks, just pure Javanese soul food.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 23, name: 'Nasi Goreng Pete',     price: 22000, prep_time_min: 10, category: 'Rice',             description: 'Not for the faint-hearted. Stinky beans (petai) fried with rice, sambal terasi, egg, and anchovies over charcoal heat. The bold, pungent flavour of pete combined with smoky wok breath creates something unforgettable. You either love it or you run from it.', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 24, name: 'Sate Ayam 5pcs',       price: 18000, prep_time_min: 10, category: 'Satay & Grilled',  description: 'Five skewers of tender chicken thigh, marinated overnight in turmeric and coriander, grilled over real coconut shell charcoal until perfectly caramelised. Served with our creamy peanut sauce made fresh daily, plus lontong rice cake and pickled shallots.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 25, name: 'Kerupuk Kampung',      price: 3000,  prep_time_min: 1,  category: 'Snacks & Bites',   description: 'Homestyle cassava crackers made by hand in our kitchen every morning. Sun-dried on bamboo trays then flash-fried to golden perfection. Light, airy, and impossibly crunchy — the perfect companion to any rice dish. Simple pleasures done right, the village way.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 26, name: 'Es Kelapa Muda',       price: 12000, prep_time_min: 2,  category: 'Juice & Smoothie', description: 'Fresh young coconut cracked open to order. The water is pure, sweet, and ice-cold — nature\'s electrolyte drink. We scoop the soft jelly flesh into the glass with crushed ice and a drizzle of palm sugar syrup. Maximum refreshment after a spicy meal.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 27, name: 'Es Teh Tarik',         price: 8000,  prep_time_min: 3,  category: 'Tea & Coffee',     description: 'Malaysian-style pulled milk tea — premium black tea brewed strong, mixed with creamy condensed milk, then dramatically pulled between two cups to create a thick frothy top. Served over crushed ice. Rich, smooth, and dangerously addictive with every sip.', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 28, name: 'Jus Alpukat',          price: 12000, prep_time_min: 4,  category: 'Juice & Smoothie', description: 'Thick, creamy Indonesian-style avocado juice blended with condensed milk, a shot of chocolate syrup, and crushed ice. Not a health drink — this is pure indulgence. Each glass uses one whole ripe avocado, hand-picked for perfect ripeness. Dessert in a glass.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
    ],
  },
  {
    id: 5, name: 'Bubur Ayam Mbok Iyem', cuisine_type: 'Sundanese', category: 'rice', vendor_type: 'street_vendor',
    address: 'Jl. Parangtritis 8, Yogyakarta', city: 'Yogyakarta', lat: -7.8012, lng: 110.3678,
    phone: '6281234567895', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    hero_dish_name: 'Bubur Ayam Komplit',
    description: 'Morning institution since 1978. Silky rice porridge, shredded chicken, century egg. Queue forms before sunrise.',
    opening_hours: '05:30–11:00', is_open: true, rating: 4.9, review_count: 445,
    price_from: 8000, price_to: 22000, min_order: 10000,
    catering_available: true, seating_capacity: 60,
    event_features: ['birthday_setup'],
    featured_this_week: false, status: 'approved',
    bank: { name: 'BRI', account_number: '0096 0100 2233 5566', account_holder: 'Iyem Sukarti', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BRI-0096010022335566' },
    menu_items: [
      { id: 30, name: 'Bubur Ayam Komplit',   price: 22000, prep_time_min: 8,  category: 'Main',   description: 'Rice porridge, shredded chicken, century egg, crispy shallots, ginger broth', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 31, name: 'Bubur Ayam Polos',     price: 14000, prep_time_min: 6,  category: 'Main',   description: 'Plain rice porridge with chicken, soy sauce, crackers', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 32, name: 'Bubur Kacang Hijau',   price: 12000, prep_time_min: 5,  category: 'Main',   description: 'Mung bean sweet porridge with coconut milk', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 33, name: 'Cakwe',                price: 8000,  prep_time_min: 2,  category: 'Sides',  description: 'Crispy fried dough — dunk it in the porridge', photo_url: null, is_available: true },
      { id: 34, name: 'Telur Asin',           price: 6000,  prep_time_min: 1,  category: 'Sides',  description: 'Salted duck egg', photo_url: null, is_available: true },
      { id: 35, name: 'Kopi Tubruk',          price: 7000,  prep_time_min: 3,  category: 'Drinks', description: 'Traditional Indonesian black coffee — grounds included', photo_url: null, is_available: true },
      { id: 36, name: 'Teh Panas',            price: 4000,  prep_time_min: 2,  category: 'Drinks', description: 'Hot plain tea', photo_url: null, is_available: true },
    ],
  },
  {
    id: 6, name: 'Nasi Padang Sari Rasa', cuisine_type: 'Padang', category: 'rice', vendor_type: 'restaurant',
    address: 'Jl. Solo 12, Klaten', city: 'Yogyakarta', lat: -7.7065, lng: 110.6073,
    phone: '6281234567896', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    hero_dish_name: 'Rendang Daging Sapi',
    description: 'Authentic West Sumatran food. 23 dishes cooked fresh every morning. Rendang slow-cooked 4 hours minimum.',
    opening_hours: '08:00–20:00', is_open: true, rating: 4.6, review_count: 187,
    price_from: 5000, price_to: 45000, min_order: 25000,
    catering_available: true, seating_capacity: 100,
    event_features: ['birthday_setup', 'private_room', 'party_package'],
    featured_this_week: false, status: 'approved',
    tour_guide_package: { min_pax: 25, price_per_pax: 35000, discount: 20, includes: 'Rendang + rice + gulai + drink', bus_parking: true },
    bank: { name: 'BNI', account_number: '0441 2233 4455', account_holder: 'Sari Rasa Padang', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BNI-044122334455' },
    menu_items: [
      { id: 40, name: 'Rendang Daging Sapi',  price: 45000, prep_time_min: 5,  category: 'Main',   description: 'Dry-cooked beef in coconut milk & spices — 4 hrs slow cooked', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 41, name: 'Ayam Pop',             price: 30000, prep_time_min: 5,  category: 'Main',   description: 'White coconut milk poached chicken, sambal hijau', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 42, name: 'Gulai Ikan',           price: 32000, prep_time_min: 5,  category: 'Main',   description: 'Fish curry in turmeric coconut gravy', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
      { id: 43, name: 'Nasi Putih',           price: 5000,  prep_time_min: 1,  category: 'Main',   description: 'Steamed white rice', photo_url: null, is_available: true },
      { id: 44, name: 'Gulai Daun Singkong',  price: 10000, prep_time_min: 3,  category: 'Sides',  description: 'Cassava leaves in coconut curry', photo_url: null, is_available: true },
      { id: 45, name: 'Perkedel Jagung',      price: 8000,  prep_time_min: 3,  category: 'Sides',  description: 'Crispy corn fritters', photo_url: null, is_available: true },
      { id: 46, name: 'Sambal Hijau',         price: 5000,  prep_time_min: 1,  category: 'Sides',  description: 'Green chilli sambal — Padang style', photo_url: null, is_available: true },
      { id: 47, name: 'Es Cincau',            price: 8000,  prep_time_min: 2,  category: 'Drinks', description: 'Grass jelly iced drink with palm sugar', photo_url: null, is_available: true },
      { id: 48, name: 'Es Teh Manis',         price: 5000,  prep_time_min: 1,  category: 'Drinks', description: 'Sweet iced tea', photo_url: null, is_available: true },
      { id: 49, name: 'Jus Jambu',            price: 10000, prep_time_min: 4,  category: 'Drinks', description: 'Fresh guava juice', photo_url: null, is_available: false },
    ],
  },

  // ── NOODLES ─────────────────────────────────────────────────────────────────
  {
    id: 2, name: 'Bakso Pak Budi', cuisine_type: 'Indonesian', category: 'noodles', vendor_type: 'street_vendor',
    address: 'Jl. Kaliurang Km 5, Sleman', city: 'Yogyakarta', lat: -7.7601, lng: 110.3831,
    phone: '6281234567891', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    hero_dish_name: 'Bakso Spesial',
    description: 'Famous meatball soup. Made fresh every morning from scratch.',
    opening_hours: '09:00–20:00', is_open: true, rating: 4.6, review_count: 89,
    price_from: 8000, price_to: 25000, min_order: 15000,
    catering_available: false, seating_capacity: 25,
    event_features: [],
    featured_this_week: false, status: 'approved',
    bank: { name: 'BCA', account_number: '7788 9900 1122', account_holder: 'Budi Santoso', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BCA-77889900112' },
    menu_items: [
      { id: 6,  name: 'Bakso Spesial',  price: 22000, prep_time_min: 8,  category: 'Main',   description: 'Giant meatball, noodles, broth', photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', is_available: true },
      { id: 7,  name: 'Bakso Biasa',    price: 15000, prep_time_min: 7,  category: 'Main',   description: 'Regular meatball soup', photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', is_available: true },
      { id: 8,  name: 'Mie Goreng',     price: 18000, prep_time_min: 10, category: 'Main',   description: 'Fried noodles', photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', is_available: true },
      { id: 9,  name: 'Es Campur',      price: 8000,  prep_time_min: 3,  category: 'Drinks', description: 'Mixed ice dessert', photo_url: null, is_available: true },
    ],
  },

  // ── GRILLED ─────────────────────────────────────────────────────────────────
  {
    id: 3, name: 'Ayam Geprek Mbak Rina', cuisine_type: 'Indonesian', category: 'grilled', vendor_type: 'street_vendor',
    address: 'Jl. Parangtritis 22, Bantul', city: 'Yogyakarta', lat: -7.8347, lng: 110.3253,
    phone: '6281234567892', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800',
    hero_dish_name: 'Ayam Geprek Level 10',
    description: 'Crispy smashed chicken — choose your heat level 1–10. We dare you.',
    opening_hours: '10:00–22:00', is_open: true, rating: 4.9, review_count: 312,
    price_from: 7000, price_to: 30000, min_order: 20000,
    catering_available: true, seating_capacity: 80,
    event_features: ['live_music', 'birthday_setup', 'sound_system', 'private_room'],
    featured_this_week: true, status: 'approved',
    bank: { name: 'Mandiri', account_number: '1420 0055 6677', account_holder: 'Rina Ayam Geprek', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Mandiri-14200055667' },
    menu_items: [
      { id: 10, name: 'Ayam Geprek L5',  price: 25000, prep_time_min: 12, category: 'Main',   description: 'Medium spicy + rice', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 11, name: 'Ayam Geprek L10', price: 25000, prep_time_min: 12, category: 'Main',   description: 'Max heat — challenge!', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 12, name: 'Tahu Tempe',      price: 8000,  prep_time_min: 5,  category: 'Sides',  description: 'Fried tofu & tempeh', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 13, name: 'Es Teh Tarik',    price: 7000,  prep_time_min: 2,  category: 'Drinks', description: 'Pulled milk tea', photo_url: null, is_available: true },
    ],
  },

  // ── SEAFOOD ──────────────────────────────────────────────────────────────────
  {
    id: 7, name: 'Seafood Pak Dhe Bejo', cuisine_type: 'Seafood', category: 'seafood', vendor_type: 'restaurant',
    address: 'Jl. Laksda Adisucipto 88, Yogyakarta', city: 'Yogyakarta', lat: -7.7822, lng: 110.4021,
    phone: '6281234567897', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    hero_dish_name: 'Udang Bakar Madu',
    description: 'Freshest seafood in Yogya — delivered from Samas beach every morning. Grilled over coconut shell charcoal.',
    opening_hours: '11:00–22:00', is_open: true, rating: 4.7, review_count: 256,
    price_from: 25000, price_to: 120000, min_order: 35000,
    catering_available: true, seating_capacity: 120,
    event_features: ['birthday_setup', 'private_room', 'party_package', 'sound_system'],
    featured_this_week: true, dine_in_discount: 10, status: 'approved',
    tour_guide_package: { min_pax: 20, price_per_pax: 45000, discount: 15, includes: 'Seafood platter + rice + drink + dessert', bus_parking: true },
    bank: { name: 'BCA', account_number: '3344 5566 7788', account_holder: 'Bejo Seafood Resto', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BCA-33445566778' },
    menu_items: [
      { id: 50, name: 'Udang Bakar Madu',    price: 85000, prep_time_min: 15, category: 'Main',   description: 'Honey-glazed grilled prawns, butter garlic sauce', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
      { id: 51, name: 'Cumi Goreng Tepung',  price: 55000, prep_time_min: 12, category: 'Main',   description: 'Crispy battered squid rings, chilli mayo', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
      { id: 52, name: 'Ikan Bakar Bumbu Bali', price: 75000, prep_time_min: 18, category: 'Main', description: 'Whole grilled snapper, Balinese spice paste', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
      { id: 53, name: 'Kepiting Saus Tiram', price: 120000, prep_time_min: 20, category: 'Main',  description: 'Blue crab in oyster sauce, wok-fried to order', photo_url: null, is_available: true },
      { id: 54, name: 'Nasi Putih',          price:   5000, prep_time_min: 2,  category: 'Sides', description: 'Steamed white rice', photo_url: null, is_available: true },
      { id: 55, name: 'Kangkung Belacan',    price:  18000, prep_time_min: 8,  category: 'Sides', description: 'Stir-fried water spinach, shrimp paste', photo_url: null, is_available: true },
      { id: 56, name: 'Sambal Matah',        price:   8000, prep_time_min: 2,  category: 'Sides', description: 'Raw Balinese shallot & lemongrass sambal', photo_url: null, is_available: true },
      { id: 57, name: 'Es Kelapa Muda',      price:  15000, prep_time_min: 2,  category: 'Drinks', description: 'Young coconut served whole', photo_url: null, is_available: true },
      { id: 58, name: 'Jus Alpukat Susu',    price:  18000, prep_time_min: 4,  category: 'Drinks', description: 'Creamy avocado blended with condensed milk', photo_url: null, is_available: true },
      { id: 59, name: 'Es Teh Manis',        price:   5000, prep_time_min: 1,  category: 'Drinks', description: 'Sweet iced tea', photo_url: null, is_available: true },
    ],
  },

  // ── BURGERS / WESTERN ────────────────────────────────────────────────────────
  {
    id: 8, name: 'Steak 48 Jogja', cuisine_type: 'Western', category: 'burgers', vendor_type: 'restaurant',
    address: 'Jl. Magelang Km 4.5, Yogyakarta', city: 'Yogyakarta', lat: -7.7615, lng: 110.3511,
    phone: '6281234567898', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    hero_dish_name: 'Ribeye 200g',
    description: 'Proper steaks grilled over open flame. Australian grain-fed beef. No shortcuts, no frozen imports.',
    opening_hours: '11:00–23:00', is_open: true, rating: 4.5, review_count: 178,
    price_from: 35000, price_to: 185000, min_order: 45000,
    catering_available: false, seating_capacity: 60,
    event_features: ['birthday_setup', 'private_room'],
    featured_this_week: false, dine_in_discount: 0, status: 'approved',
    bank: { name: 'BNI', account_number: '0812 3344 5566', account_holder: 'Steak 48 Jogja', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BNI-08123344556' },
    menu_items: [
      { id: 60, name: 'Ribeye 200g',         price: 185000, prep_time_min: 20, category: 'Main',   description: 'Australian grain-fed ribeye, choice of sauce & side', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 61, name: 'Sirloin 180g',        price: 155000, prep_time_min: 18, category: 'Main',   description: 'Lean, tender sirloin. Best medium-rare.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 62, name: 'Beef Burger Komplit',  price:  65000, prep_time_min: 15, category: 'Main',   description: 'Double patty, cheddar, caramelised onion, house sauce', photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', is_available: true },
      { id: 63, name: 'Chicken Cordon Bleu', price:  75000, prep_time_min: 18, category: 'Main',   description: 'Stuffed chicken, ham, Swiss cheese, brown sauce', photo_url: null, is_available: true },
      { id: 64, name: 'Pasta Carbonara',     price:  55000, prep_time_min: 12, category: 'Main',   description: 'Spaghetti, guanciale, pecorino, egg yolk', photo_url: null, is_available: true },
      { id: 65, name: 'Truffle Fries',       price:  35000, prep_time_min: 8,  category: 'Sides',  description: 'Crispy fries, truffle oil, parmesan, parsley', photo_url: null, is_available: true },
      { id: 66, name: 'Garden Salad',        price:  28000, prep_time_min: 5,  category: 'Sides',  description: 'Mixed greens, cherry tomato, balsamic vinaigrette', photo_url: null, is_available: true },
      { id: 67, name: 'Lemon Ice Tea',       price:  22000, prep_time_min: 3,  category: 'Drinks', description: 'Fresh lemon, mint, sparkling water', photo_url: null, is_available: true },
      { id: 68, name: 'Chocolate Milkshake', price:  32000, prep_time_min: 5,  category: 'Drinks', description: 'Thick Belgian chocolate milkshake', photo_url: null, is_available: true },
    ],
  },

  // ── DRINKS / CAFE ────────────────────────────────────────────────────────────
  {
    id: 9, name: 'Kopi Klotok Maguwo', cuisine_type: 'Cafe', category: 'drinks', vendor_type: 'restaurant',
    address: 'Jl. Maguwo 15, Sleman', city: 'Yogyakarta', lat: -7.7891, lng: 110.4234,
    phone: '6281234567899', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    hero_dish_name: 'Kopi Joss',
    description: 'Iconic Jogja coffeehouse. Famous for Kopi Joss — black coffee with a glowing red charcoal dropped in. Must try.',
    opening_hours: '06:00–24:00', is_open: true, rating: 4.8, review_count: 521,
    price_from: 7000, price_to: 45000, min_order: 15000,
    catering_available: false, seating_capacity: 80,
    event_features: ['live_music', 'birthday_setup'],
    featured_this_week: true, dine_in_discount: 0, status: 'approved',
    bank: { name: 'BCA', account_number: '5566 7788 9900', account_holder: 'Kopi Klotok Maguwo', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BCA-55667788990' },
    menu_items: [
      { id: 70, name: 'Kopi Joss',           price: 12000, prep_time_min: 5,  category: 'Drinks', description: 'Black coffee with charcoal — the legendary Jogja drink', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 71, name: 'Kopi Susu Gula Aren', price: 18000, prep_time_min: 5,  category: 'Drinks', description: 'Espresso, palm sugar syrup, fresh milk over ice', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 72, name: 'Matcha Latte',        price: 22000, prep_time_min: 4,  category: 'Drinks', description: 'Ceremonial matcha, oat milk, light sweetness', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 73, name: 'Teh Tarik Spesial',   price: 15000, prep_time_min: 4,  category: 'Drinks', description: 'Pulled milk tea, frothy, rich — two mugs minimum', photo_url: null, is_available: true },
      { id: 74, name: 'Es Kopi Vietnam',     price: 20000, prep_time_min: 5,  category: 'Drinks', description: 'Drip coffee, condensed milk, crushed ice', photo_url: null, is_available: true },
      { id: 75, name: 'Roti Bakar Keju',     price: 22000, prep_time_min: 8,  category: 'Food',   description: 'Toasted bread, butter, condensed milk, cheese', photo_url: null, is_available: true },
      { id: 76, name: 'Pisang Goreng Keju',  price: 18000, prep_time_min: 8,  category: 'Food',   description: 'Crispy fried banana, melted cheese drizzle', photo_url: null, is_available: true },
      { id: 77, name: 'Indomie Goreng',      price: 15000, prep_time_min: 8,  category: 'Food',   description: 'The classic — dressed with egg, shallots, chilli', photo_url: null, is_available: true },
      { id: 78, name: 'Singkong Goreng',     price: 12000, prep_time_min: 10, category: 'Food',   description: 'Cassava chips, coconut sambal', photo_url: null, is_available: true },
    ],
  },

  // ── STREET FOOD ──────────────────────────────────────────────────────────────
  {
    id: 10, name: 'Sate & Gule Pak Sabar', cuisine_type: 'Javanese', category: 'street_food', vendor_type: 'street_vendor',
    address: 'Alun-Alun Selatan, Yogyakarta', city: 'Yogyakarta', lat: -7.8108, lng: 110.3642,
    phone: '6281234567800', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    hero_dish_name: 'Sate Kambing 10pcs',
    description: 'Street legend since 1971. Goat satay grilled to order over coconut charcoal. The smoke alone draws a crowd.',
    opening_hours: '17:00–01:00', is_open: true, rating: 4.8, review_count: 634,
    price_from: 3000, price_to: 55000, min_order: 20000,
    catering_available: true, seating_capacity: 30,
    event_features: ['birthday_setup', 'party_package'],
    featured_this_week: false, dine_in_discount: 0, status: 'approved',
    tour_guide_package: { min_pax: 15, price_per_pax: 30000, discount: 10, includes: 'Sate 10pcs + lontong + tea', bus_parking: false },
    bank: { name: 'BRI', account_number: '0096 0100 7788 4321', account_holder: 'Sabar Supriyanto', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BRI-00960100778843' },
    menu_items: [
      { id: 80, name: 'Sate Kambing 10pcs',  price: 55000, prep_time_min: 15, category: 'Main',   description: 'Goat satay, charcoal grilled, kecap manis, sambal', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 81, name: 'Sate Ayam 10pcs',     price: 35000, prep_time_min: 12, category: 'Main',   description: 'Chicken satay, peanut sauce, lontong', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 82, name: 'Gule Kambing',        price: 35000, prep_time_min: 5,  category: 'Main',   description: 'Spiced goat curry, warm & rich, eat with lontong', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 83, name: 'Tongseng Kambing',    price: 38000, prep_time_min: 8,  category: 'Main',   description: 'Goat in sweet spiced coconut broth, cabbage, tomato', photo_url: null, is_available: true },
      { id: 84, name: 'Lontong',             price:  5000, prep_time_min: 1,  category: 'Sides',  description: 'Compressed rice cake — perfect with satay', photo_url: null, is_available: true },
      { id: 85, name: 'Kerupuk',             price:  3000, prep_time_min: 1,  category: 'Sides',  description: 'Prawn crackers', photo_url: null, is_available: true },
      { id: 86, name: 'Es Teh Manis',        price:  5000, prep_time_min: 1,  category: 'Drinks', description: 'Sweet iced tea', photo_url: null, is_available: true },
      { id: 87, name: 'Jeruk Panas',         price:  7000, prep_time_min: 3,  category: 'Drinks', description: 'Hot fresh orange juice — great with goat dishes', photo_url: null, is_available: true },
    ],
  },
]


// ── Countdown helpers ─────────────────────────────────────────────────────────
function parseOpenTime(openingHours) {
  const part = (openingHours ?? '').split('–')[0].trim()
  const [h, m] = part.split(':').map(Number)
  return isNaN(h) ? null : { h, m }
}

function secsUntilOpen(openingHours) {
  const t = parseOpenTime(openingHours)
  if (!t) return null
  const now    = new Date()
  const target = new Date(now)
  target.setHours(t.h, t.m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return Math.max(0, Math.floor((target - now) / 1000))
}

function fmtCountdown(secs) {
  if (secs == null) return null
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h} hr ${String(m).padStart(2,'0')} min`
}

// ── Option B: smart-sorted categories ────────────────────────────────────────
// Street Food card → Indonesian street food types first, restaurants fill below
// Restaurant card  → restaurant/western types first, street food fills below
const STREET_FOOD_CATS = new Set(['rice', 'noodles', 'street_food', 'snacks', 'breakfast', 'vegetarian'])
const RESTAURANT_CATS  = new Set(['burgers', 'seafood', 'grilled', 'desserts', 'drinks'])

function primaryForCategory(restaurantCategory, selectedCategoryId) {
  if (selectedCategoryId === 'street_food') return STREET_FOOD_CATS.has(restaurantCategory)
  if (selectedCategoryId === 'all')         return RESTAURANT_CATS.has(restaurantCategory)
  return true // unknown category id → treat everything as primary
}

// ── Sales algorithm — scores each restaurant ──────────────────────────────────
// Higher score = shown earlier in the snap-scroll list
function scoreRestaurant(r, hour) {
  let s = 0
  if (r.is_open)            s += 10000          // open always beats closed
  if (r.featured_this_week) s += 500
  s += (r.rating ?? 0) * 60                     // 4.9 = +294

  // Time-of-day affinity — match category to meal period
  const cat = r.category
  if (hour >= 5  && hour < 11 && cat === 'breakfast') s += 800
  if (hour >= 10 && hour < 15 && (cat === 'rice' || cat === 'noodles')) s += 400
  if (hour >= 11 && hour < 16 && cat === 'grilled')   s += 300
  if (hour >= 14 && hour < 17 && cat === 'snacks')    s += 350
  if (hour >= 17 && hour < 23 && (cat === 'seafood' || cat === 'grilled')) s += 400
  if ((hour >= 20 || hour < 2) && cat === 'drinks')   s += 300
  if (hour >= 9  && hour < 21 && cat === 'burgers')   s += 200

  // Proximity bonus (max 200pts for <1 km)
  if (r.distKm != null) s += Math.max(0, 200 - r.distKm * 40)

  // Repeat-order discount set = restaurant is actively incentivising returns
  if (r.repeat_discount_percent > 0) s += 150

  return s
}

function Stars({ rating }) {
  const full = Math.floor(rating ?? 0)
  const half = (rating ?? 0) - full >= 0.5
  return (
    <span className={styles.stars}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  )
}

// ── Favorite helpers ──────────────────────────────────────────────────────────
function getFavorites() {
  return JSON.parse(localStorage.getItem('indoo_fav_restaurants') || '[]')
}

function isFavorite(restaurantId) {
  return getFavorites().some(f => f.id === restaurantId)
}

function toggleFavorite(restaurant) {
  const favs = getFavorites()
  const exists = favs.some(f => f.id === restaurant.id)
  const updated = exists
    ? favs.filter(f => f.id !== restaurant.id)
    : [...favs, { id: restaurant.id, name: restaurant.name, image: restaurant.cover_url, cuisine: restaurant.cuisine_type }]
  localStorage.setItem('indoo_fav_restaurants', JSON.stringify(updated))
  return updated
}

// ── Dish Reviews — expandable section ────────────────────────────────────────
const DEMO_REVIEWS = [
  { name: 'Rina S.', stars: 5, text: 'Porsinya besar, rasanya mantap! Sambalnya pedas pas.', date: '2 hari lalu', photos: ['https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300'] },
  { name: 'Budi P.', stars: 4, text: 'Enak sih tapi pengiriman agak lama. Makanannya masih hangat.', date: '5 hari lalu', photos: [] },
  { name: 'Ayu M.', stars: 5, text: 'Langganan! Selalu konsisten rasanya. Recommended banget.', date: '1 minggu lalu', photos: ['https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=300', 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=300'] },
  { name: 'Dimas R.', stars: 4, text: 'Harga terjangkau untuk porsi segini. Worth it.', date: '2 minggu lalu', photos: ['https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300'] },
]

function DishReviews({ rating, reviewCount }) {
  const [open, setOpen] = useState(false)
  const [viewPhoto, setViewPhoto] = useState(null)
  const stars = rating ?? 4.5
  const count = reviewCount ?? DEMO_REVIEWS.length
  const photoCount = DEMO_REVIEWS.reduce((s, r) => s + (r.photos?.length ?? 0), 0)
  return (
    <div style={{ marginBottom: 12, borderRadius: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', padding: '14px', borderRadius: 0,
        background: 'none', border: 'none',
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
      }}>
        <span style={{ fontSize: 14, color: '#FACC15' }}>★</span>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{stars}</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', flex: 1, textAlign: 'left' }}>· {count} reviews {photoCount > 0 && `· ${photoCount} photos`}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEMO_REVIEWS.map((r, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{r.name}</span>
                <span style={{ fontSize: 12, color: '#FACC15' }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{r.date}</span>
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, display: 'block' }}>{r.text}</span>
              {r.photos?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {r.photos.map((p, j) => (
                    <button key={j} onClick={() => setViewPhoto(p)} style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo popup viewer */}
      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <button onClick={() => setViewPhoto(null)} style={{
            position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', right: 16,
            width: 44, height: 44, borderRadius: '50%', background: '#8DC63F', border: 'none',
            color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
          }}>✕</button>
          <img src={viewPhoto} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 16, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}

// ── Order history — localStorage + reorder ───────────────────────────────────
const ORDER_HISTORY_KEY = 'indoo_order_history'

function saveOrderToHistory(dish, restaurant, qty, extras) {
  const history = loadOrderHistory()
  const entry = {
    id: Date.now(),
    dishId: dish.id,
    dishName: dish.name,
    dishPhoto: dish.photo_url,
    price: dish.price,
    qty,
    extras: extras.map(e => ({ label: e.label, qty: e.qty })),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    date: new Date().toISOString(),
  }
  // Keep last 20, no duplicates of same dish+restaurant
  const filtered = history.filter(h => !(h.dishId === dish.id && h.restaurantId === restaurant.id))
  const updated = [entry, ...filtered].slice(0, 20)
  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(updated))
}

function loadOrderHistory() {
  try { return JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || '[]') } catch { return [] }
}

// ── Cart Item Card with collapsible extras ──────────────────────────────────
function CartItemCard({ item, index, fmtC, setCartItems }) {
  const [extrasOpen, setExtrasOpen] = useState(false)
  const hasExtras = item.extras?.length > 0

  const updateExtra = (extraLabel, delta) => {
    setCartItems(prev => prev.map((c, j) => {
      if (j !== index) return c
      const updatedExtras = c.extras.map(e =>
        e.label === extraLabel ? { ...e, qty: Math.max(0, e.qty + delta) } : e
      ).filter(e => e.qty > 0)
      const extrasPrice = updatedExtras.reduce((s, e) => s + (e.price ?? 0) * e.qty, 0)
      return { ...c, extras: updatedExtras, extrasPrice }
    }))
  }

  const removeExtra = (extraLabel) => {
    setCartItems(prev => prev.map((c, j) => {
      if (j !== index) return c
      const updatedExtras = c.extras.filter(e => e.label !== extraLabel)
      const extrasPrice = updatedExtras.reduce((s, e) => s + (e.price ?? 0) * e.qty, 0)
      return { ...c, extras: updatedExtras, extrasPrice }
    }))
  }

  return (
    <div style={{ borderRadius: 16, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      {/* Main row */}
      <div style={{ display: 'flex', gap: 12, padding: '12px' }}>
        {item.photo_url && (
          <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{item.name}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.restaurant?.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>{fmtC((item.price * item.qty) + (item.extrasPrice ?? 0))}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setCartItems(prev => prev.filter((_, j) => j !== index))} style={{
            width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button onClick={() => setCartItems(prev => prev.map((c, j) => j === index ? { ...c, qty: Math.max(1, c.qty - 1) } : c))} style={{
              width: 40, height: 40, borderRadius: 10, background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden',
            }}><img src="https://ik.imagekit.io/nepgaxllc/sdfsdf-removebg-preview.png" alt="−" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
            <span style={{ width: 30, textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>{item.qty}</span>
            <button onClick={() => setCartItems(prev => prev.map((c, j) => j === index ? { ...c, qty: c.qty + 1 } : c))} style={{
              width: 40, height: 40, borderRadius: 10, background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden',
            }}><img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaaaccc-removebg-preview.png" alt="+" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
          </div>
        </div>
      </div>

      {/* Extras toggle */}
      {hasExtras && (
        <button onClick={() => setExtrasOpen(v => !v)} style={{
          width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F', flex: 1, textAlign: 'left' }}>{item.extras.length} extra{item.extras.length > 1 ? 's' : ''}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', transform: extrasOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </button>
      )}

      {/* Extras dropdown */}
      {hasExtras && extrasOpen && (
        <div style={{ padding: '0 12px 10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {item.extras.map(ex => (
            <div key={ex.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <button onClick={() => removeExtra(ex.label)} style={{
                width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#EF4444', fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0,
              }}>✕</button>
              <span style={{ fontSize: 13, color: '#fff', flex: 1 }}>{ex.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                <button onClick={() => updateExtra(ex.label, -1)} style={{
                  width: 40, height: 40, borderRadius: 10, background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden',
                }}><img src="https://ik.imagekit.io/nepgaxllc/sdfsdf-removebg-preview.png" alt="−" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
                <span style={{ width: 30, textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>{ex.qty}</span>
                <button onClick={() => updateExtra(ex.label, 1)} style={{
                  width: 40, height: 40, borderRadius: 10, background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden',
                }}><img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaaaccc-removebg-preview.png" alt="+" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Promo banners for cuisine grid ───────────────────────────────────────────
const CUISINE_BANNERS = [
  {
    id: 'banner1',
    restaurantId: 1,
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2024,%202026,%2006_22_44%20PM.png',
    title: 'Street Local Live',
    promo: '15% OFF Gudeg',
    color: '#8DC63F',
  },
  {
    id: 'banner2',
    restaurantId: 7,
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2025,%202026,%2004_22_55%20AM.png',
    title: 'Seafood Pak Dhe Bejo',
    promo: 'Free Juice Today',
    color: '#8DC63F',
  },
  {
    id: 'banner3',
    restaurantId: 3,
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2025,%202026,%2004_22_09%20AM.png',
    title: 'Ayam Geprek Mbak Rina',
    promo: 'Free French Fries',
    color: '#8DC63F',
  },
  {
    id: 'banner4',
    restaurantId: 9,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600',
    title: 'Kopi Klotok Maguwo',
    promo: 'Happy Hour 3-5pm',
    color: '#8DC63F',
  },
]

const CUISINE_GROUPS = [
  { country: 'Indonesian', flag: '🇮🇩', items: [
    { id: 'rice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvv-removebg-preview.png', label: 'Rice' },
    { id: 'noodles', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvd-removebg-preview.png', label: 'Noodles' },
    { id: 'chicken', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddd-removebg-preview.png', label: 'Chicken' },
    { id: 'satay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasda-removebg-preview.png', label: 'Satay' },
    { id: 'seafood', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassss-removebg-preview.png', label: 'Seafood' },
    { id: 'tofu_tempe', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccddd-removebg-preview.png', label: 'Tempe' },
    { id: 'siomay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccddddd-removebg-preview.png', label: 'Siomay' },
    { id: 'ketoprak', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssssddffdddd-removebg-preview.png', label: 'Ketoprak' },
    { id: 'padang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfss-removebg-preview.png', label: 'Padang' },
    { id: 'gudeg', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssd-removebg-preview.png', label: 'Gudeg' },
    { id: 'rendang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdss-removebg-preview.png', label: 'Rendang' },
    { id: 'soup', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdas-removebg-preview.png', label: 'Soup' },
    { id: 'porridge', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssdd-removebg-preview.png', label: 'Porridge' },
    { id: 'duck', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssss-removebg-preview.png', label: 'Duck' },
    { id: 'fish', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssssdd-removebg-preview.png', label: 'Fish' },
    { id: 'grilled', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdasss-removebg-preview.png', label: 'Snacks' },
    { id: 'martabak', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddf-removebg-preview.png', label: 'Martabak' },
  ]},
  { country: 'Western', flag: '🍔', items: [
    { id: 'burgers', img: 'https://ik.imagekit.io/nepgaxllc/od-removebg-preview.png', label: 'Burgers' },
    { id: 'steak', img: 'https://ik.imagekit.io/nepgaxllc/odf-removebg-preview.png', label: 'Steak' },
    { id: 'pizza', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsada-removebg-preview.png', label: 'Pizza' },
    { id: 'pasta', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadadd-removebg-preview.png', label: 'Pasta' },
    { id: 'breakfast', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaa-removebg-preview.png', label: 'Breakfast' },
    { id: 'salad', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasds-removebg-preview.png', label: 'Vegetarian' },
    { id: 'healthy', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddd-removebg-preview.png', label: 'Healthy' },
  ]},
  { country: 'Chinese', flag: '🇨🇳', items: [
    { id: 'chinese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxccc-removebg-preview.png', label: 'Chinese' },
  ]},
  { country: 'Japanese', flag: '🇯🇵', items: [
    { id: 'japanese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddss-removebg-preview.png', label: 'Japanese' },
  ]},
  { country: 'Korean', flag: '🇰🇷', items: [
    { id: 'korean', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxc-removebg-preview.png', label: 'Korean' },
  ]},
  { country: 'Indian', flag: '🇮🇳', items: [
    { id: 'indian', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddss-removebg-preview.png', label: 'Indian' },
  ]},
  { country: 'Drinks & Desserts', flag: '🥤', items: [
    { id: 'drinks', img: 'https://ik.imagekit.io/nepgaxllc/odfs-removebg-preview.png', label: 'Iced Drinks' },
    { id: 'traditional_drinks', img: 'https://ik.imagekit.io/nepgaxllc/odfss-removebg-preview.png', label: 'Traditional' },
    { id: 'coffee', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssda-removebg-preview.png', label: 'Tea & Coffee' },
    { id: 'juice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssdaasda-removebg-preview.png', label: 'Juice' },
    { id: 'cakes', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasd-removebg-preview.png', label: 'Cakes' },
    { id: 'desserts', img: 'https://ik.imagekit.io/nepgaxllc/odfssd-removebg-preview.png', label: 'Desserts' },
    { id: 'snacks', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaad-removebg-preview.png', label: 'Snacks' },
  ]},
]

// Flat list for banner insertion logic
const CUISINE_ITEMS = CUISINE_GROUPS.flatMap(g => g.items)

// Banners appear after these ROW numbers (0-based): after row 1 and row 5
const CuisineGridWithBanners = memo(function CuisineGridWithBanners({ onSelect }) {


  const circleStyle = {
    width: 64, height: 64, borderRadius: '50%', cursor: 'pointer',
    backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledfdssdfsd.png)',
    backgroundSize: 'cover', backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.15s', margin: '0 auto',
  }

  // Build output — grouped by country with flag headers + banners
  const output = []

  CUISINE_GROUPS.forEach((group, gi) => {
    // Country header (skip for "All")
    const slogans = {
      'Indonesian': 'Authentic flavours from across the archipelago',
      'Western': 'Classic comfort food & international favourites',
      'Chinese': 'Dim sum, stir-fry & Tionghoa classics',
      'Japanese': 'Sushi, ramen & Tokyo street food',
      'Korean': 'BBQ, kimchi & Seoul favourites',
      'Indian': 'Curry, naan & rich spices',
      'Drinks & Desserts': 'Cool down with local & international treats',
    }
    if (group.country !== 'All') {
      output.push(
        <div key={`header-${gi}`} style={{ padding: '10px 4px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{group.flag}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{group.country}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slogans[group.country] ?? ''}</span>
        </div>
      )
    }

    // Cuisine items in rows of 4 (round cards fit better in 4)
    for (let i = 0; i < group.items.length; i += 4) {
      const row = group.items.slice(i, i + 4)
      output.push(
        <div key={`row-${gi}-${i}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {row.map(c => (
            <button key={c.label} onClick={() => onSelect(c.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
              onPointerDown={e => { const el = e.currentTarget.firstChild; if (el) el.style.transform = 'scale(0.9)' }}
              onPointerUp={e => { const el = e.currentTarget.firstChild; if (el) el.style.transform = 'scale(1)' }}
              onPointerLeave={e => { const el = e.currentTarget.firstChild; if (el) el.style.transform = 'scale(1)' }}
            >
              <div style={circleStyle}>
                {c.img ? <img src={c.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} /> : <span style={{ fontSize: 26 }}>{c.emoji}</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{c.label}</span>
            </button>
          ))}
        </div>
      )


    }
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 100px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {output}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  )
})

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantBrowseScreen({ onClose, onBackToCategories, category, scrollToId, onOrderViaChat }) {
  const [showLanding, setShowLanding] = useState(true) // show landing page first
  const [vendorFilter, setVendorFilter] = useState(null) // null = all, 'restaurant', 'street_vendor'
  const { customer: slCustomer, showPopup: showCustomerPopup, setShowPopup: setShowCustomerPopup, save: saveCustomer } = useCustomerLocation()
  const [installDismissed, setInstallDismissed] = useState(() => localStorage.getItem('foodpro_installDismissed') === 'true')
  const [foodOrdersOpen, setFoodOrdersOpen] = useState(false)
  const [foodDashOpen, setFoodDashOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [promoBrowseOpen, setPromoBrowseOpen] = useState(false)

  const [restaurants,    setRestaurants]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [activeIndex,    setActiveIndex]    = useState(0)
  const [menuRestaurant, setMenuRestaurant] = useState(null)
  const [activeDeal, setActiveDeal] = useState(null) // { itemName, discountPercent, originalPrice, dealPrice } — passed to menu sheet
  const [selectedDish, setSelectedDish] = useState(null) // { dish, restaurant }
  const [viewRestaurant, setViewRestaurant] = useState(null) // restaurant object for full card view
  const [dishSearch, setDishSearch] = useState('') // search within dish feed
  const [cuisineSearch, setCuisineSearch] = useState('') // search on cuisine picker
  const [pickerTab, setPickerTab] = useState('cuisine') // 'cuisine' | 'deals' | 'discounts' | 'chefs'
  const [cartItems, setCartItems] = useState([]) // direct cart from dish detail
  const [cartToast, setCartToast] = useState(null) // toast message
  const [dishNote, setDishNote] = useState('') // special request note
  const [dishQty, setDishQty] = useState(1) // main dish quantity
  const [vendorExtras, setVendorExtras] = useState(null) // { sauces: [], drinks: [], sides: [] }
  const [cartOpen, setCartOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mealPaused, setMealPaused] = useState(false)
  const mealTapRef = useRef(0)
  const [checkoutStep, setCheckoutStep] = useState(null) // null | 'address' | 'processing' | 'done'
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [trackingStatus, setTrackingStatus] = useState('order_received')
  const [checkoutAddress, setCheckoutAddress] = useState(() => localStorage.getItem('indoo_last_address') ?? '')
  // Auto-calculate delivery fee when cart opens with saved address
  useEffect(() => {
    if (!cartOpen || !checkoutAddress.trim() || checkoutDeliveryFee) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const rest = cartItems[0]?.restaurant
      if (rest?.lat && rest?.lng) {
        const distKm = haversineKm(rest.lat, rest.lng, coords.latitude, coords.longitude) * 1.3
        const fee = Math.max(10000, 9250 + Math.round(distKm * 1850))
        setCheckoutDeliveryFee(fee)
      }
    }, () => {}, { timeout: 5000 })
  }, [cartOpen])
  const [checkoutWa, setCheckoutWa] = useState('')
  const [checkoutDriver, setCheckoutDriver] = useState(null)
  const [checkoutPayment, setCheckoutPayment] = useState('cod') // 'cod' or 'transfer'
  const [checkoutOrderId, setCheckoutOrderId] = useState(null)
  const [checkoutDeliveryFee, setCheckoutDeliveryFee] = useState(null)
  const [altRecipient, setAltRecipient] = useState(false)
  const [altWa, setAltWa] = useState('')
  const [dishImagePopup, setDishImagePopup] = useState(false)
  const [dishExtras, setDishExtras] = useState([]) // selected extras [{label, qty}]
  const [extrasTab, setExtrasTab] = useState('sauces') // 'sauces' | 'drinks' | 'sides'
  const [dishSort, setDishSort] = useState('rating') // 'price' | 'rating' | 'distance'
  const [allergenFilters, setAllergenFilters] = useState([]) // active allergen filters
  const [dishDiscountOnly, setDishDiscountOnly] = useState(false) // show only discounted dishes
  const [tick,           setTick]           = useState(0)
  const [showFavOnly,    setShowFavOnly]    = useState(false)
  const [showCuisinePicker, setShowCuisinePicker] = useState(false) // show after landing page
  const [cuisineFilter, setCuisineFilter] = useState(null)
  const [selectedCuisine, setSelectedCuisine] = useState(null) // cuisine selected from grid, filters discounts tab
  const [favTick,        setFavTick]        = useState(0)
  const containerRef = useRef(null)
  const { coords }   = useGeolocation()

  // Tick every 30s so countdown timers stay live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  // Load vendor extras when dish is selected
  useEffect(() => {
    if (!selectedDish?.restaurant?.id) { setVendorExtras(null); return }
    getRestaurantExtras(selectedDish.restaurant.id).then(setVendorExtras)
  }, [selectedDish?.restaurant?.id])


  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (!supabase) {
        // Always load all — Option B sorting happens client-side
        setRestaurants(DEMO_RESTAURANTS)
        setLoading(false)
        return
      }
      // Always fetch all approved restaurants — Option B sorting is client-side
      const { data } = await supabase
        .from('restaurants')
        .select('*, menu_items(*)')
        .eq('status', 'approved')
        .order('featured_this_week', { ascending: false })
        .order('rating', { ascending: false })
      setRestaurants(data?.length ? data : DEMO_RESTAURANTS)
      setLoading(false)
    }
    load()
  }, [category])

  // Enrich with distance + delivery fare, then apply Option B sort:
  // primary group (matches selected category) first, secondary fills below,
  // each group sorted by score. A divider sentinel separates the two groups.
  const hour = new Date().getHours()
  void tick // consumed here so countdown interval triggers re-score
  const catId = category?.id

  // Use haversine for initial fast render, then upgrade with Google Directions
  // Distance calculation — haversine for browse list (fast, no API calls)
  // Google Directions only used when user actually places an order
  const withMeta = useMemo(() => restaurants.map(r => {
    const distKm = coords && r.lat && r.lng
      ? Math.round(haversineKm(coords.lat, coords.lng, r.lat, r.lng) * 10) / 10
      : null
    return { ...r, distKm }
  }), [restaurants, coords?.lat, coords?.lng])

  // Apply vendor type filter (street_vendor / restaurant / null = all)
  const vendorFiltered = useMemo(() => withMeta
    .filter(r => !vendorFilter || (r.vendor_type ?? 'restaurant') === vendorFilter)
    .filter(r => !cuisineFilter || r.category === cuisineFilter || r.cuisine_type?.toLowerCase().includes(cuisineFilter.toLowerCase())),
  [withMeta, vendorFilter, cuisineFilter])

  const primary   = vendorFiltered.filter(r =>  primaryForCategory(r.category, catId))
                             .sort((a, b) => scoreRestaurant(b, hour) - scoreRestaurant(a, hour))
  const secondary = vendorFiltered.filter(r => !primaryForCategory(r.category, catId))
                             .sort((a, b) => scoreRestaurant(b, hour) - scoreRestaurant(a, hour))

  // Divider label depends on which card was tapped
  const dividerLabel = catId === 'street_food' ? 'Also Nearby' : 'More Street Food'
  const divider = { isDivider: true, label: dividerLabel }

  // Flatten: primary → divider (only if secondary exists) → secondary
  // Apply favorites filter if active
  void favTick // re-render when favorites change
  const applyFavFilter = (list) => showFavOnly ? list.filter(r => isFavorite(r.id)) : list
  const enriched = secondary.length
    ? [...applyFavFilter(primary), divider, ...applyFavFilter(secondary)].filter(r => r.isDivider ? applyFavFilter(secondary).length > 0 : true)
    : applyFavFilter(primary)

  // Track visible card on scroll
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    setActiveIndex(Math.round(el.scrollTop / el.clientHeight))
  }

  // Jump to specific restaurant if scrollToId supplied
  useEffect(() => {
    if (!scrollToId || !enriched.length) return
    const idx = enriched.findIndex(r => r.id === scrollToId)
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTop = idx * containerRef.current.clientHeight
      setActiveIndex(idx)
    }
  }, [scrollToId, enriched.length])

  // Category header info
  const catLabel  = category ? category.label : 'MAKAN'
  const catEmoji  = category ? category.emoji  : '🍽'
  const catColor  = category ? category.color  : '#8DC63F'

  return (<div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 100 }}>
    <div style={{ display: showLanding ? undefined : 'none' }}>
      <FoodLanding
        onBrowse={() => { markSectionVisited('food'); setVendorFilter(null); setShowLanding(false); setShowCuisinePicker(true) }}
        onClose={onClose}
        onSelectVendorType={(type) => { markSectionVisited('food'); setVendorFilter(type); setShowLanding(false); setShowCuisinePicker(true) }}
      />
    </div>

    {loading && !showLanding && (
      <div className={styles.screen}>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingSpinner} style={{ borderTopColor: catColor }} />
          <p className={styles.loadingText}>INDOO Street — finding {catLabel.toLowerCase()} near you…</p>
        </div>
      </div>
    )}

    {/* ── Cuisine picker ── */}
    {showCuisinePicker && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 110, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Blurred background image */}
        <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2004_47_24%20PM.png?updatedAt=1777542461928" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />
        {/* Burnt wood brand overlay */}
        <div style={{ position: 'absolute', top: 'calc(20% + 100px)', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, pointerEvents: 'none', textAlign: 'center' }}>
          <div style={{
            fontSize: 41,
            fontWeight: 900,
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'transparent',
            backgroundImage: 'linear-gradient(180deg, rgba(90,45,12,0.65) 0%, rgba(90,45,12,0.65) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            textShadow: '0 1px 0 rgba(0,0,0,0.2)',
            letterSpacing: '8px',
            textTransform: 'uppercase',
            userSelect: 'none',
            filter: 'contrast(1.3)',
            lineHeight: 1,
          }}>Street Local Live</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', margin: '6px 0' }}>
            <div style={{ width: 40, height: 1, background: 'rgba(90,45,12,0.4)' }} />
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: '"Georgia", serif', color: 'rgba(90,45,12,0.65)', letterSpacing: '6px', textTransform: 'uppercase', userSelect: 'none' }}>Yogyakarta</span>
            <div style={{ width: 40, height: 1, background: 'rgba(90,45,12,0.4)' }} />
          </div>
        </div>
        {/* Dark tint */}
        <div style={{
          padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 10px', flexShrink: 0, position: 'relative', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>What are you craving?</span>
          </div>
          {/* Search bar with autocomplete */}
          <div style={{ position: 'relative', marginTop: 14 }}>
            <style>{`
              @keyframes searchPlaceholder { 0%, 20% { content: '🔍 Nasi Goreng...'; } 25%, 45% { content: '🔍 Ayam Geprek...'; } 50%, 70% { content: '🔍 Es Teh Manis...'; } 75%, 95% { content: '🔍 Sate Ayam...'; } }
            `}</style>
            <input
              value={cuisineSearch}
              onChange={e => setCuisineSearch(e.target.value)}
              placeholder={['🔍 Nasi Goreng, Sate, Gudeg...', '🔍 Search any dish or restaurant...', '🔍 Ayam Geprek, Es Teh Manis...'][Math.floor(Date.now() / 5000) % 3]}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, backgroundColor: '#000', border: '1px solid rgba(141,198,63,0.25)', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            {cuisineSearch.trim().length >= 1 && (
              <button onClick={() => setCuisineSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            )}
            {/* Autocomplete dropdown */}
            {cuisineSearch.trim().length >= 1 && (() => {
              const q = cuisineSearch.toLowerCase().trim()
              const dishResults = withMeta.flatMap(r => (r.menu_items ?? []).filter(i =>
                (i.name ?? '').toLowerCase().includes(q) ||
                (i.description ?? '').toLowerCase().includes(q) ||
                (i.category ?? '').toLowerCase().includes(q)
              ).slice(0, 4).map(i => ({ type: 'dish', item: i, restaurant: r }))).slice(0, 12)
              const restResults = withMeta.filter(r => (r.name ?? '').toLowerCase().includes(q) || (r.cuisine_type ?? '').toLowerCase().includes(q)).slice(0, 3).map(r => ({ type: 'restaurant', restaurant: r }))
              const results = [...dishResults, ...restResults]
              if (results.length === 0) return (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 20, padding: '20px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No dishes found for "{cuisineSearch.trim()}"</span>
                </div>
              )
              return (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 20, maxHeight: 400, overflowY: 'auto' }}>
                  {results.map((r, i) => r.type === 'dish' ? (
                    <button key={`s-d-${i}`} onClick={() => { setSelectedDish({ dish: r.item, restaurant: r.restaurant }); setShowCuisinePicker(false); setCuisineFilter(r.item.category?.toLowerCase() ?? 'all'); setCuisineSearch('') }} style={{
                      width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    }}>
                      {r.item.photo_url ? (
                        <img src={r.item.photo_url} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 50, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🍽️</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{r.item.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 2 }}>{r.restaurant.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15', marginTop: 2, display: 'block' }}>Rp {(r.item.price ?? 0).toLocaleString('id-ID').replace(/,/g, '.')}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 10, color: '#FACC15' }}>★</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{r.restaurant.rating ?? '4.5'}</span>
                        </div>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontWeight: 700 }}>Order</span>
                      </div>
                    </button>
                  ) : (
                    <button key={`s-r-${i}`} onClick={() => { setCuisineSearch(''); setShowCuisinePicker(false); setCuisineFilter(null); setMenuRestaurant(r.restaurant) }} style={{
                      width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    }}>
                      <div style={{ width: 50, height: 50, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🏪</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{r.restaurant.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.restaurant.cuisine_type} · ★ {r.restaurant.rating}</span>
                      </div>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: '#60A5FA', fontWeight: 700 }}>Menu</span>
                    </button>
                  ))}
                  {/* Search all button */}
                  <button onClick={() => { setCuisineFilter(cuisineSearch.trim()); setDishSearch(cuisineSearch.trim()); setShowCuisinePicker(false); setCuisineSearch('') }} style={{
                    width: '100%', padding: '12px 14px', border: 'none', backgroundColor: 'rgba(141,198,63,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: '0 0 14px 14px',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>🔍 See all results for "{cuisineSearch.trim()}"</span>
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
        <style>{`
          @keyframes cuisineRunLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }
          @keyframes popularScroll { from { transform: translateX(0); } to { transform: translateX(-30%); } }
          @keyframes tickerDeal { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        `}</style>

        {/* Toggle tabs */}
        <style>{`
          @keyframes fireRise {
            0% { transform: translateY(0) scaleY(1); opacity: 0.8; }
            50% { transform: translateY(-8px) scaleY(1.3); opacity: 1; }
            100% { transform: translateY(-16px) scaleY(0.5); opacity: 0; }
          }
        `}</style>
        <div style={{ padding: '6px 16px 10px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'visible', position: 'relative' }}>
            {[
              { id: 'cuisine', label: '🍽️ Cuisine' },
              { id: 'deals', label: '🔥 Daily Deals' },
              { id: 'discounts', label: '💰 Promo' },
            ].map(t => (
              <button key={t.id} onClick={() => { setPickerTab(t.id); if (t.id === 'cuisine') setSelectedCuisine(null) }} style={{
                flex: 1, padding: '12px 4px', whiteSpace: 'nowrap',
                background: 'none', border: 'none',
                borderBottom: pickerTab === t.id ? '3px solid #8DC63F' : '3px solid transparent',
                color: '#fff',
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
                position: 'relative', overflow: 'visible',
              }}>
                {t.label}
                {pickerTab === t.id && (
                  <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2, pointerEvents: 'none' }}>
                    <span style={{ fontSize: 8, animation: 'fireRise 0.8s ease-out infinite', animationDelay: '0s' }}>🔥</span>
                    <span style={{ fontSize: 10, animation: 'fireRise 0.8s ease-out infinite', animationDelay: '0.2s' }}>🔥</span>
                    <span style={{ fontSize: 8, animation: 'fireRise 0.8s ease-out infinite', animationDelay: '0.4s' }}>🔥</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-scrolling meal types — cuisine picker images */}
        {(() => {
          const mealItems = [
            { id: 'rice', label: 'Rice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvv-removebg-preview.png' },
            { id: 'noodles', label: 'Noodles', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvd-removebg-preview.png' },
            { id: 'chicken', label: 'Chicken', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddd-removebg-preview.png' },
            { id: 'satay', label: 'Satay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasda-removebg-preview.png' },
            { id: 'grilled', label: 'Snacks', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdasss-removebg-preview.png' },
            { id: 'seafood', label: 'Seafood', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassss-removebg-preview.png' },
            { id: 'padang', label: 'Padang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfss-removebg-preview.png' },
            { id: 'gudeg', label: 'Gudeg', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssd-removebg-preview.png' },
            { id: 'rendang', label: 'Rendang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdss-removebg-preview.png' },
            { id: 'soup', label: 'Soup', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdas-removebg-preview.png' },
            { id: 'burgers', label: 'Burgers', img: 'https://ik.imagekit.io/nepgaxllc/od-removebg-preview.png' },
            { id: 'pizza', label: 'Pizza', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsada-removebg-preview.png' },
            { id: 'pasta', label: 'Pasta', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadadd-removebg-preview.png' },
            { id: 'japanese', label: 'Japanese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddss-removebg-preview.png' },
            { id: 'korean', label: 'Korean', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxc-removebg-preview.png' },
            { id: 'chinese', label: 'Chinese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxccc-removebg-preview.png' },
            { id: 'drinks', label: 'Drinks', img: 'https://ik.imagekit.io/nepgaxllc/odfs-removebg-preview.png' },
            { id: 'coffee', label: 'Coffee', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssda-removebg-preview.png' },
            { id: 'cakes', label: 'Cakes', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasd-removebg-preview.png' },
            { id: 'desserts', label: 'Desserts', img: 'https://ik.imagekit.io/nepgaxllc/odfssd-removebg-preview.png' },
          ]
          const doubled = [...mealItems, ...mealItems]

          const handleMealTap = (item) => {
            const now = Date.now()
            if (now - mealTapRef.current < 400) {
              // Double tap — same as selecting from cuisine grid buttons
              setSelectedCuisine(item.id)
              setPickerTab('discounts')
              setCuisineSearch('')
              return
            }
            mealTapRef.current = now
            // Single tap — pause for 3 seconds
            setMealPaused(true)
            setTimeout(() => setMealPaused(false), 3000)
          }

          return (
            <div style={{ overflowX: 'auto', overflowY: 'hidden', position: 'relative', zIndex: 1, padding: '14px 0 6px', WebkitOverflowScrolling: 'touch' }}
              onTouchStart={() => { setMealPaused(true); setTimeout(() => setMealPaused(false), 3000) }}
              onScroll={() => { setMealPaused(true); setTimeout(() => setMealPaused(false), 3000) }}
            >
              <div style={{ display: 'flex', gap: 12, animation: 'mealScroll 60s linear infinite', animationPlayState: mealPaused ? 'paused' : 'running', width: 'max-content', paddingLeft: 12 }}>
                {doubled.map((m, i) => (
                  <div key={`meal-${i}`} onClick={() => handleMealTap(m)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}>
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={m.img} alt="" style={{ width: 67, height: 67, objectFit: 'contain' }} />
                    </div>
                  </div>
                ))}
              </div>
              <style>{`@keyframes mealScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
            </div>
          )
        })()}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>

          {/* ── TAB: Daily Deals ── */}
          {pickerTab === 'deals' && <div style={{ padding: '8px 12px' }}>

          {/* Today's Deal — daily themed */}
          {(() => {
            const DAILY_THEMES = [
              { day: 0, name: 'Super Sunday', icon: '🌟', color: '#8DC63F', discount: 20 },
              { day: 1, name: 'Mega Monday', icon: '💥', color: '#8DC63F', discount: 25 },
              { day: 2, name: 'Tasty Tuesday', icon: '😋', color: '#8DC63F', discount: 15 },
              { day: 3, name: 'Wicked Wednesday', icon: '🔥', color: '#8DC63F', discount: 30 },
              { day: 4, name: 'Thirsty Thursday', icon: '🥤', color: '#8DC63F', discount: 20 },
              { day: 5, name: 'Crunchy Friday', icon: '🍗', color: '#8DC63F', discount: 25 },
              { day: 6, name: 'Sizzle Saturday', icon: '🥩', color: '#8DC63F', discount: 20 },
            ]
            const today = DAILY_THEMES[new Date().getDay()]
            const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999)
            void tick // trigger re-render for live countdown
            const msLeft = endOfDay - Date.now()
            const hrsLeft = Math.floor(msLeft / 3600000)
            const minsLeft = Math.floor((msLeft % 3600000) / 60000)
            const secsLeft = Math.floor((msLeft % 60000) / 1000)
            // Get 3 deal items from top restaurants
            const dealItems = withMeta.flatMap(r => (r.menu_items ?? []).filter(i => i.photo_url).slice(0, 2).map(i => ({ ...i, restaurant: r, dealPrice: Math.round(i.price * (1 - today.discount / 100)) })))

            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>{today.name}</span>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Up to {today.discount}% off selected dishes</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dealItems.map((d, i) => (
                    <div key={`deal-${i}`} onClick={() => { setSelectedDish({ dish: { ...d, price: d.dealPrice }, restaurant: d.restaurant }); setShowCuisinePicker(false); setCuisineFilter(d.category?.toLowerCase() ?? 'all') }} style={{
                      width: '100%', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', padding: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer', display: 'flex', textAlign: 'left', height: 90,
                    }}>
                      <div style={{ width: 110, flexShrink: 0, position: 'relative' }}>
                        <img src={d.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: 6, left: 6, padding: '3px 7px', borderRadius: 6, backgroundColor: '#FACC15', fontSize: 11, fontWeight: 900, color: '#000' }}>-{today.discount}%</span>
                        <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 16 }}>{(d.restaurant.vendor_type ?? 'restaurant') === 'street_vendor' ? '🛒' : '🍽️'}</span>
                        {/* Food tags on image */}
                        <div style={{ position: 'absolute', bottom: 4, left: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {(() => {
                            const txt = (d.name+' '+(d.description??'')).toLowerCase()
                            const tags = []
                            if (['pedas','sambal','geprek','spicy','balado','rica','cabai','cabe'].some(w => txt.includes(w))) {
                              const hot = txt.includes('level 10') || txt.includes('extra hot') || txt.includes('very hot') ? 3 : txt.includes('hot') || txt.includes('pedas') ? 2 : 1
                              tags.push(<span key="spicy" style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(239,68,68,0.8)', padding: '1px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>{'🌶️'.repeat(hot)}</span>)
                            }
                            if (['bawang','garlic','aglio'].some(w => txt.includes(w))) tags.push(<span key="garlic" style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(245,158,11,0.8)', padding: '1px 5px', borderRadius: 4 }}>🧄</span>)
                            if (['vegetarian','vegan','sayur','tahu','tempe','salad','gado','pecel'].some(w => txt.includes(w))) tags.push(<span key="veg" style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(141,198,63,0.8)', padding: '1px 5px', borderRadius: 4 }}>🥬</span>)
                            if (['halal'].some(w => txt.includes(w))) tags.push(<span key="halal" style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(59,130,246,0.8)', padding: '1px 5px', borderRadius: 4 }}>☪️</span>)
                            return tags
                          })()}
                        </div>
                      </div>
                      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1.3, flex: 1 }}>{d.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                            <span style={{ fontSize: 12, color: '#FACC15' }}>★</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{d.restaurant.rating ?? '4.5'}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, display: 'block' }}>{d.restaurant.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 }}>
                          <button onClick={(e) => { e.stopPropagation(); setShowCuisinePicker(false); setCuisineFilter(d.category?.toLowerCase() ?? 'all'); setSelectedDish({ dish: { ...d, price: d.dealPrice, original_price: d.price }, restaurant: d.restaurant }) }} style={{ padding: '5px 10px', borderRadius: 8, backgroundColor: '#8DC63F', border: 'none', color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}>Order Now</button>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#FACC15', position: 'absolute', left: 12, bottom: 10 }}>Rp {(d.dealPrice ?? 0).toLocaleString('id-ID').replace(/,/g, '.')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ── Vendor Deals from localStorage ── */}
          {(() => {
            let vendorDeals = []
            try { vendorDeals = JSON.parse(localStorage.getItem('indoo_vendor_deals') || '[]') } catch {}
            let publicDeals = []
            try { publicDeals = JSON.parse(localStorage.getItem('indoo_public_deals') || '[]').filter(d => d.status === 'active' && d.category === 'food') } catch {}
            const allVendorDeals = [...vendorDeals, ...publicDeals].filter(d => {
              if (!d.active && !d.status) return false
              const today = new Date().toISOString().split('T')[0]
              if (d.startDate && today < d.startDate) return false
              if (d.endDate && today > d.endDate) return false
              return true
            })
            if (allVendorDeals.length === 0) return null
            return (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block' }}>Vendor Deals</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{allVendorDeals.length} active</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {allVendorDeals.map((deal, di) => (
                    deal.items?.map((item, ii) => {
                      const dealPrice = Math.round((item.price ?? 0) * (1 - (deal.discountPercent ?? deal.discount_percent ?? 20) / 100))
                      const discPct = deal.discountPercent ?? deal.discount_percent ?? 20
                      const remaining = (deal.quantity ?? 50) - (deal.claimed ?? 0)
                      const matchedRestaurant = withMeta.find(r => r.menu_items?.some(mi => mi.name === item.name))
                      return (
                        <div key={`vd-${di}-${ii}`} style={{
                          borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', textAlign: 'left',
                        }}>
                          {/* Image */}
                          <div style={{ width: 110, flexShrink: 0, position: 'relative', minHeight: 100 }}>
                            {item.photo_url ? (
                              <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 32 }}>🍽️</span>
                              </div>
                            )}
                            <span style={{ position: 'absolute', top: 6, left: 6, padding: '3px 7px', borderRadius: 6, backgroundColor: '#FACC15', fontSize: 11, fontWeight: 900, color: '#000' }}>{discPct}% OFF</span>
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>{item.name}</span>
                            {matchedRestaurant && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{matchedRestaurant.name}</span>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>Rp {(item.price ?? 0).toLocaleString('id-ID').replace(/,/g, '.')}</span>
                              <span style={{ fontSize: 15, fontWeight: 900, color: '#8DC63F' }}>Rp {dealPrice.toLocaleString('id-ID').replace(/,/g, '.')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{remaining} left</span>
                                {deal.days && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{deal.days.join(', ')}</span>}
                              </div>
                              {matchedRestaurant && (
                                <button onClick={() => { setShowCuisinePicker(false); setCuisineFilter(item.category?.toLowerCase() ?? 'all'); setSelectedDish({ dish: { ...item, price: dealPrice, original_price: item.price }, restaurant: matchedRestaurant }) }} style={{ padding: '5px 10px', borderRadius: 8, backgroundColor: '#8DC63F', border: 'none', color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Order Now</button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ))}
                </div>
              </div>
            )
          })()}
          </div>}

          {/* ── TAB: Discounts ── */}
          {pickerTab === 'discounts' && <div style={{ padding: '8px 12px' }}>
                {(() => {
                  const openDish = (d) => { setSelectedDish({ dish: { ...d, price: d.dealPrice ?? d.price, original_price: d.dealPrice ? d.price : d.original_price }, restaurant: d.restaurant }); setShowCuisinePicker(false); setCuisineFilter(d.category?.toLowerCase() ?? 'all') }

                  const DCard = ({ d, onClick }) => {
                    const hasDiscount = (d.original_price && d.original_price > d.price) || d.discountPct
                    const discPct = d.discountPct || (d.original_price && d.original_price > d.price ? Math.round(((d.original_price - d.price) / d.original_price) * 100) : 0)
                    const txt = `${d.name ?? ''} ${d.description ?? ''}`.toLowerCase()
                    const tags = []
                    if (['pedas','sambal','geprek','spicy','balado','rica','cabai','cabe','chili'].some(w => txt.includes(w))) tags.push('🌶️')
                    if (['bawang','garlic','aglio'].some(w => txt.includes(w))) tags.push('🧄')
                    if (['vegetarian','vegan','sayur','tahu','tempe'].some(w => txt.includes(w))) tags.push('🥬')
                    if (['halal'].some(w => txt.includes(w))) tags.push('☪️')
                    if (['ikan','udang','seafood','fish','shrimp'].some(w => txt.includes(w))) tags.push('🦐')
                    return (
                      <div onClick={onClick} style={{ width: '100%', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', padding: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer', display: 'flex', textAlign: 'left', height: 90 }}>
                        <div style={{ width: 110, flexShrink: 0, position: 'relative' }}>
                          <img src={d.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {discPct > 0 && <span style={{ position: 'absolute', top: 6, left: 6, padding: '3px 7px', borderRadius: 6, backgroundColor: '#FACC15', fontSize: 11, fontWeight: 900, color: '#000' }}>-{discPct}%</span>}
                          <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 16 }}>{(d.restaurant?.vendor_type ?? 'restaurant') === 'street_vendor' ? '🛒' : '🍽️'}</span>
                        </div>
                        <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1.3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 6 }}>
                              <span style={{ fontSize: 12, color: '#FACC15' }}>★</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{d.restaurant?.rating ?? '4.5'}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.restaurant?.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: 900, color: '#FACC15' }}>Rp {(d.dealPrice ?? d.price ?? 0).toLocaleString('id-ID').replace(/,/g, '.')}</span>
                            <button onClick={(e) => { e.stopPropagation(); onClick() }} style={{ padding: '5px 10px', borderRadius: 8, backgroundColor: '#8DC63F', border: 'none', color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}>Order Now</button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // When a cuisine is selected, show filtered results
                  if (selectedCuisine) {
                    const filter = selectedCuisine.toLowerCase()
                    const cuisineDishes = withMeta.flatMap(r => (r.menu_items ?? []).filter(item => {
                      if (!item.photo_url) return false
                      const itemCat = (item.category ?? '').toLowerCase()
                      const itemName = (item.name ?? '').toLowerCase()
                      return itemCat.includes(filter) || itemName.includes(filter) || (r.cuisine_type ?? '').toLowerCase().includes(filter)
                    }).map(item => ({ ...item, restaurant: r })))

                    // Split: discounted first, then regular
                    const discounted = cuisineDishes.filter(d => d.original_price && d.original_price > d.price)
                      .sort((a, b) => {
                        const aPct = ((a.original_price - a.price) / a.original_price)
                        const bPct = ((b.original_price - b.price) / b.original_price)
                        return bPct - aPct
                      })
                    const regular = cuisineDishes.filter(d => !(d.original_price && d.original_price > d.price))
                      .sort((a, b) => (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0))

                    // Other cuisine deals
                    const cuisineIds = new Set(cuisineDishes.map(d => d.id))
                    const otherDeals = withMeta.flatMap(r => (r.menu_items ?? []).filter(item => {
                      if (!item.photo_url || cuisineIds.has(item.id)) return false
                      return item.original_price && item.original_price > item.price
                    }).map(item => ({ ...item, restaurant: r }))).slice(0, 8)

                    return (<div>
                      {/* Discounted dishes */}
                      {discounted.length > 0 && (<>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>🔥</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>Discounted</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{discounted.length} deals</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                          {discounted.map((d, i) => <DCard key={`disc-${i}`} d={d} onClick={() => openDish(d)} />)}
                        </div>
                      </>)}

                      {/* Regular dishes */}
                      {regular.length > 0 && (<>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>🍽️</span>
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F' }}>{selectedCuisine.charAt(0).toUpperCase() + selectedCuisine.slice(1)} Dishes</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{regular.length} dishes</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                          {regular.map((d, i) => <DCard key={`reg-${i}`} d={d} onClick={() => openDish(d)} />)}
                        </div>
                      </>)}

                      {/* More deals from other cuisines */}
                      {otherDeals.length > 0 && (<>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>💰</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>More Deals</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>other cuisines</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                          {otherDeals.map((d, i) => <DCard key={`other-${i}`} d={d} onClick={() => openDish(d)} />)}
                        </div>
                      </>)}

                      {cuisineDishes.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                          <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>🍽️</span>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>No {selectedCuisine} dishes found</span>
                        </div>
                      )}
                    </div>)
                  }

                  // Default: no cuisine selected — show general deals
                  const allDiscounted = withMeta.flatMap(r => {
                    const disc = r.dine_in_discount > 0 ? r.dine_in_discount : (r.featured_this_week ? 15 : 10)
                    return (r.menu_items ?? []).filter(i => i.photo_url).slice(0, 2).map((i, idx) => ({
                      ...i, restaurant: r, discountPct: disc,
                      dealPrice: Math.round(i.price * (1 - disc / 100)),
                      endsIn: 1 + ((i.id ?? idx) % 6),
                    }))
                  })
                  const flash = [...allDiscounted].sort((a, b) => a.endsIn - b.endsIn).slice(0, 5)
                  const biggest = [...allDiscounted].sort((a, b) => b.discountPct - a.discountPct).slice(0, 5)
                  const freeDelivery = withMeta.filter(r => r.featured_this_week).flatMap(r => (r.menu_items ?? []).filter(i => i.photo_url).slice(0, 1).map(i => ({ ...i, restaurant: r }))).slice(0, 4)
                  const chefPicks = withMeta.filter(r => (r.rating ?? 0) >= 4.7).flatMap(r => (r.menu_items ?? []).filter(i => i.photo_url).slice(0, 1).map(i => ({ ...i, restaurant: r }))).sort((a, b) => (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0)).slice(0, 5)

                  return (<div>
                    {/* 1. Free Delivery */}
                    {freeDelivery.length > 0 && (<>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block' }}>Free Delivery</span>
                        <span style={{ fontSize: 14, color: '#fff' }}>No delivery charge today</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {freeDelivery.map((d, i) => <DCard key={`free-${i}`} d={d} onClick={() => openDish(d)} />)}
                      </div>
                    </>)}

                    {/* 2. Flash Deals */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>Flash Deals</span>
                        <span style={{ fontSize: 13, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Ending soon — grab them now</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {flash.map((d, i) => <DCard key={`flash-${i}`} d={d} onClick={() => openDish(d)} />)}
                    </div>

                    {/* 3. Biggest Savings */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>Biggest Savings</span>
                        <span style={{ fontSize: 13, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Highest discount first</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {biggest.map((d, i) => <DCard key={`big-${i}`} d={d} onClick={() => openDish(d)} />)}
                    </div>

                    {/* 4. Chef's Picks */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>👨‍🍳</span>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>Chef's Picks</span>
                        <span style={{ fontSize: 13, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>★ 4.7+ rated from top kitchens</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {chefPicks.map((d, i) => <DCard key={`chef-${i}`} d={{ ...d, discountPct: null, endsIn: null }} onClick={() => openDish(d)} />)}
                    </div>
                  </div>)
                })()}
          </div>}


          {/* ── Recent Orders — reorder ── */}
          {pickerTab === 'cuisine' && (() => {
            const history = loadOrderHistory()
            const MOCK_REORDERS = [
              { id: 'm1', dishId: 1, dishName: 'Nasi Gudeg Telur', dishPhoto: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300', price: 18000, qty: 1, restaurantId: 1, restaurantName: 'Street Local Live' },
              { id: 'm2', dishId: 3, dishName: 'Nasi Gudeg Ayam', dishPhoto: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300', price: 25000, qty: 1, restaurantId: 1, restaurantName: 'Street Local Live' },
              { id: 'm3', dishId: 5, dishName: 'Ayam Geprek', dishPhoto: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300', price: 20000, qty: 1, restaurantId: 3, restaurantName: 'Ayam Geprek Mbak Rina' },
              { id: 'm4', dishId: 8, dishName: 'Es Teh Manis', dishPhoto: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300', price: 5000, qty: 2, restaurantId: 1, restaurantName: 'Street Local Live' },
              { id: 'm5', dishId: 10, dishName: 'Sate Ayam', dishPhoto: 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=300', price: 22000, qty: 1, restaurantId: 4, restaurantName: 'Sate Klathak Mas Bari' },
              { id: 'm6', dishId: 12, dishName: 'Nasi Goreng', dishPhoto: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300', price: 15000, qty: 1, restaurantId: 2, restaurantName: 'Nasi Goreng Pak Harto' },
              { id: 'm7', dishId: 14, dishName: 'Rendang Sapi', dishPhoto: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300', price: 32000, qty: 1, restaurantId: 5, restaurantName: 'Rumah Makan Padang' },
              { id: 'm8', dishId: 15, dishName: 'Mie Goreng', dishPhoto: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300', price: 14000, qty: 1, restaurantId: 1, restaurantName: 'Street Local Live' },
              { id: 'm9', dishId: 16, dishName: 'Bakso Malang', dishPhoto: 'https://images.unsplash.com/photo-1583224994076-0a3c45921cc8?w=300', price: 18000, qty: 1, restaurantId: 6, restaurantName: 'Bakso Pak Kumis' },
              { id: 'm10', dishId: 17, dishName: 'Gado-Gado', dishPhoto: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300', price: 16000, qty: 1, restaurantId: 7, restaurantName: 'Warung Bu Siti' },
              { id: 'm11', dishId: 18, dishName: 'Nasi Campur', dishPhoto: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300', price: 22000, qty: 1, restaurantId: 1, restaurantName: 'Street Local Live' },
              { id: 'm12', dishId: 19, dishName: 'Soto Ayam', dishPhoto: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=300', price: 15000, qty: 1, restaurantId: 8, restaurantName: 'Soto Lamongan Cak Har' },
              { id: 'm13', dishId: 20, dishName: 'Tahu Goreng', dishPhoto: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300', price: 10000, qty: 1, restaurantId: 1, restaurantName: 'Street Local Live' },
            ]
            const seen = new Set(history.map(h => h.dishId))
            const items = [...history, ...MOCK_REORDERS.filter(m => !seen.has(m.dishId))]
            const fmtH = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')
            return (
              <div style={{ padding: '0 12px 12px' }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15', display: 'block', marginBottom: 8 }}>Recent Orders</span>
                <style>{`@keyframes reorderScroll { 0%, 10% { transform: translateX(0); } 45%, 55% { transform: translateX(-30%); } 90%, 100% { transform: translateX(0); } }`}</style>
                <div style={{ overflow: 'hidden', paddingBottom: 4 }}>
                <div style={{ display: 'flex', gap: 10, animation: 'reorderScroll 12s ease-in-out infinite', width: 'max-content' }}>
                  {items.map(h => (
                    <button key={h.id} onClick={() => {
                      // Find the restaurant and dish in withMeta
                      const r = withMeta.find(r => r.id === h.restaurantId)
                      const d = r?.menu_items?.find(m => m.id === h.dishId)
                      if (r && d) {
                        setSelectedDish({ dish: d, restaurant: r })
                        setShowCuisinePicker(false)
                        setCuisineFilter(d.category?.toLowerCase() ?? 'all')
                        setDishQty(h.qty ?? 1)
                        setDishExtras(h.extras ?? [])
                      }
                    }} style={{
                      width: 120, flexShrink: 0, borderRadius: 14, overflow: 'hidden',
                      border: '1.5px solid rgba(153,27,27,0.5)', padding: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', textAlign: 'left',
                    }}>
                      <div style={{ height: 80, position: 'relative', overflow: 'hidden' }}>
                        {h.dishPhoto ? (
                          <img src={h.dishPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 28 }}>🍽️</span>
                          </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                        <div style={{ position: 'absolute', bottom: 4, right: 4, padding: '2px 6px', borderRadius: 6, background: '#991B1B' }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>Reorder</span>
                        </div>
                      </div>
                      <div style={{ padding: '6px 8px 8px', background: '#000' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.dishName}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 2 }}>{fmtH(h.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            )
          })()}

          {/* ── TAB: Cuisine ── */}
          {pickerTab === 'cuisine' && (
            <CuisineGridWithBanners
              onSelect={(id) => {
                setSelectedCuisine(id)
                setPickerTab('discounts')
              }}
            />
          )}
      </div>
      </div>
    )}

    {/* ── Dish Feed — shows when cuisine selected ── */}
    {cuisineFilter && !showLanding && !showCuisinePicker && !menuRestaurant && !selectedDish && (() => {
      // Aggregate all dishes matching the cuisine filter from all restaurants
      const allDishes = withMeta.flatMap(r => (r.menu_items ?? []).filter(item => {
        if (!item.photo_url) return false
        const itemCat = (item.category ?? '').toLowerCase()
        const itemName = (item.name ?? '').toLowerCase()
        const filter = cuisineFilter.toLowerCase()
        return itemCat.includes(filter) || itemName.includes(filter) || (r.category ?? '').includes(filter) || (r.cuisine_type ?? '').toLowerCase().includes(filter)
      }).map(item => {
        const txt = `${item.name ?? ''} ${item.description ?? ''} ${item.category ?? ''}`.toLowerCase()
        const tags = []
        if (['pedas','sambal','geprek','balado','rica','cabai','chili','hot','spicy','cabe'].some(w => txt.includes(w))) tags.push({ icon: '🌶️', label: 'Spicy' })
        if (['bawang','garlic','aglio'].some(w => txt.includes(w))) tags.push({ icon: '🧄', label: 'Garlic' })
        if (['vegetarian','vegan','sayur','salad','gado','pecel','karedok','tahu','tempe'].some(w => txt.includes(w))) tags.push({ icon: '🥬', label: 'Vegan' })
        if (['ikan','udang','kepiting','cumi','seafood','fish','shrimp','crab','squid','gurame'].some(w => txt.includes(w))) tags.push({ icon: '🦐', label: 'Seafood' })
        if (['kacang','nut','almond','peanut'].some(w => txt.includes(w))) tags.push({ icon: '🥜', label: 'Nuts' })
        if (['halal'].some(w => txt.includes(w))) tags.push({ icon: '☪️', label: 'Halal' })
        return { ...item, isSpicy: tags.some(t => t.label === 'Spicy'), tags, restaurant: r }
      }))

      // Filter by search
      let filteredDishes = dishSearch.trim()
        ? allDishes.filter(d => d.name.toLowerCase().includes(dishSearch.toLowerCase()) || d.restaurant.name.toLowerCase().includes(dishSearch.toLowerCase()))
        : allDishes

      // Allergen filters
      const ALLERGEN_OPTS = [
        { id: 'no_spicy', label: 'No Spicy', icon: '🌶️' },
        { id: 'no_nuts', label: 'No Nuts', icon: '🥜' },
        { id: 'no_seafood', label: 'No Seafood', icon: '🦐' },
        { id: 'vegan', label: 'Vegan', icon: '🥬' },
      ]
      if (allergenFilters.length > 0) {
        filteredDishes = filteredDishes.filter(d => {
          for (const f of allergenFilters) {
            if (f === 'no_spicy' && d.tags.some(t => t.label === 'Spicy')) return false
            if (f === 'no_nuts' && d.tags.some(t => t.label === 'Nuts')) return false
            if (f === 'no_seafood' && d.tags.some(t => t.label === 'Seafood')) return false
            if (f === 'vegan' && !d.tags.some(t => t.label === 'Vegan')) return false
          }
          return true
        })
      }

      // Discount filter
      if (dishDiscountOnly) {
        filteredDishes = filteredDishes.filter(d => (d.original_price && d.original_price > d.price) || d.restaurant.discount_percent > 0 || d.restaurant.has_deal)
      }

      // Sort — discounted dishes always float to top
      filteredDishes = [...filteredDishes].sort((a, b) => {
        const aDiscount = (a.original_price && a.original_price > a.price) ? 1 : 0
        const bDiscount = (b.original_price && b.original_price > b.price) ? 1 : 0
        if (aDiscount !== bDiscount) return bDiscount - aDiscount // discounted first
        if (dishSort === 'price') return (a.price ?? 0) - (b.price ?? 0)
        if (dishSort === 'distance') return (a.restaurant.distKm ?? 99) - (b.restaurant.distKm ?? 99)
        return (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0) // default: rating
      })

      // More deals from other cuisines (shown after main list)
      const filteredIds = new Set(filteredDishes.map(d => `${d.id}-${d.restaurant.id}`))
      const moreDealsDishes = withMeta.flatMap(r => (r.menu_items ?? []).filter(item => {
        if (!item.photo_url) return false
        if (!(item.original_price && item.original_price > item.price)) return false
        const key = `${item.id}-${r.id}`
        if (filteredIds.has(key)) return false // already in main list
        return true
      }).map(item => {
        const txt = `${item.name ?? ''} ${item.description ?? ''} ${item.category ?? ''}`.toLowerCase()
        const tags = []
        if (['pedas','sambal','geprek','balado','rica','cabai','chili','hot','spicy','cabe'].some(w => txt.includes(w))) tags.push({ icon: '🌶️', label: 'Spicy' })
        if (['vegetarian','vegan','sayur','salad','gado','pecel','karedok','tahu','tempe'].some(w => txt.includes(w))) tags.push({ icon: '🥬', label: 'Vegan' })
        if (['ikan','udang','kepiting','cumi','seafood','fish','shrimp','crab','squid','gurame'].some(w => txt.includes(w))) tags.push({ icon: '🦐', label: 'Seafood' })
        return { ...item, isSpicy: tags.some(t => t.label === 'Spicy'), tags, restaurant: r }
      })).slice(0, 12)

      const fmtPrice = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')
      const cartTotal = cartItems.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0)
      const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

      // Add to cart handler
      const addToCart = (dish) => {
        setCartItems(prev => {
          const existing = prev.find(c => c.id === dish.id && c.restaurant.id === dish.restaurant.id)
          if (existing) return prev.map(c => c.id === dish.id && c.restaurant.id === dish.restaurant.id ? { ...c, qty: c.qty + 1 } : c)
          return [...prev, { ...dish, qty: 1 }]
        })
        setCartToast(`${dish.name} added to cart`)
        setTimeout(() => setCartToast(null), 2000)
      }

      const getQty = (dishId, restId) => cartItems.find(c => c.id === dishId && c.restaurant?.id === restId)?.qty ?? 0
      const removeFromCart = (dishId, restId) => {
        setCartItems(prev => {
          const item = prev.find(c => c.id === dishId && c.restaurant?.id === restId)
          if (!item) return prev
          if (item.qty <= 1) return prev.filter(c => !(c.id === dishId && c.restaurant?.id === restId))
          return prev.map(c => c.id === dishId && c.restaurant?.id === restId ? { ...c, qty: c.qty - 1 } : c)
        })
      }

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 105, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Blurred background */}
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_44_19%20AM.png?updatedAt=1776728675957" alt="" style={{ position: 'absolute', inset: -20, width: 'calc(100% + 40px)', height: 'calc(100% + 40px)', objectFit: 'cover', filter: 'blur(12px)', zIndex: 0, opacity: 0.3 }} />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 0 }} />
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 6px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <button onClick={() => { setCuisineFilter(null); setDishSearch(''); setShowCuisinePicker(true) }} style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', flex: 1 }}>{cuisineFilter.charAt(0).toUpperCase() + cuisineFilter.slice(1)}</span>
              <button onClick={() => setDishDiscountOnly(v => !v)} style={{
                padding: '6px 12px', borderRadius: 10, whiteSpace: 'nowrap',
                backgroundColor: dishDiscountOnly ? '#8DC63F' : 'rgba(0,0,0,0.4)',
                border: dishDiscountOnly ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: dishDiscountOnly ? '#000' : 'rgba(255,255,255,0.6)',
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
              }}>💰 Discounts</button>
              {/* Cart icon */}
              {cartItems.length > 0 && (
                <button onClick={() => setCartOpen(true)} style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                  <img src="https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png?updatedAt=1775737452452" alt="cart" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', padding: '0 4px' }}>{cartItems.reduce((s, i) => s + i.qty, 0)}</span>
                </button>
              )}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{filteredDishes.length}</span>
            </div>
            {/* Search bar */}
            <input
              value={dishSearch}
              onChange={e => setDishSearch(e.target.value)}
              placeholder="🔍 Search dishes..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            {/* Sort + allergen filters */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {[{ id: 'rating', label: '⭐ Rating' }, { id: 'price', label: '💰 Price' }, { id: 'distance', label: '📍 Nearest' }].map(s => (
                <button key={s.id} onClick={() => setDishSort(s.id)} style={{
                  padding: '5px 10px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0,
                  backgroundColor: dishSort === s.id ? 'rgba(141,198,63,0.2)' : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${dishSort === s.id ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`,
                  color: dishSort === s.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
                  fontSize: 11, fontWeight: 800, cursor: 'pointer',
                }}>{s.label}</button>
              ))}
              <span style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />
              {ALLERGEN_OPTS.map(f => {
                const active = allergenFilters.includes(f.id)
                return (
                  <button key={f.id} onClick={() => setAllergenFilters(prev => active ? prev.filter(x => x !== f.id) : [...prev, f.id])} style={{
                    padding: '5px 10px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0,
                    backgroundColor: active ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${active ? '#EF4444' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? '#EF4444' : 'rgba(255,255,255,0.5)',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  }}>{f.icon} {f.label}</button>
                )
              })}
            </div>
          </div>

          {/* Dish grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 100px', position: 'relative', zIndex: 1 }}>
            {filteredDishes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🍽️</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 6 }}>No dishes found</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Try a different cuisine</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {filteredDishes.map((dish, i) => (
                  <button key={`${dish.id}-${i}`} onClick={() => setSelectedDish({ dish, restaurant: dish.restaurant })} style={{
                    borderRadius: 16, overflow: 'hidden', position: 'relative',
                    border: '1px solid rgba(255,255,255,0.08)', padding: 0, background: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', textAlign: 'left',
                  }}>
                    {/* Dish image */}
                    <div style={{ height: 120, position: 'relative', overflow: 'hidden' }}>
                      <img src={dish.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                      {/* Price badge */}
                      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {dish.original_price && dish.original_price > dish.price && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{fmtPrice(dish.original_price)}</span>
                        )}
                        <div style={{ padding: '4px 8px', borderRadius: 8, backgroundColor: '#8DC63F' }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#000' }}>{fmtPrice(dish.price)}</span>
                        </div>
                      </div>
                      {/* Discount badge */}
                      {dish.original_price && dish.original_price > dish.price && (
                        <div style={{ position: 'absolute', top: 6, left: 6, padding: '3px 6px', borderRadius: 6, backgroundColor: '#FACC15' }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#000' }}>{Math.round(((dish.original_price - dish.price) / dish.original_price) * 100)}% OFF</span>
                        </div>
                      )}
                      {dish.isSpicy && <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 18 }}>🌶️</span>}
                      <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 14 }}>{(dish.restaurant.vendor_type ?? 'restaurant') === 'street_vendor' ? '🛒' : '🍽️'}</span>
                    </div>
                    {/* Info */}
                    <div style={{ padding: '10px 10px 12px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.3 }}>{dish.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{dish.restaurant.name}</span>
                        {dish.restaurant.rating && <span style={{ fontSize: 10, color: '#FACC15', fontWeight: 800 }}>★ {dish.restaurant.rating}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      </div>
                      {dish.restaurant.min_order && dish.price < dish.restaurant.min_order && (
                        <span style={{ fontSize: 9, color: '#F59E0B', fontWeight: 700, marginTop: 2, display: 'block' }}>Min order {fmtPrice(dish.restaurant.min_order)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* More Deals from other cuisines */}
            {!dishDiscountOnly && moreDealsDishes.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>More Deals</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>from other cuisines</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {moreDealsDishes.map((dish, i) => (
                    <button key={`deal-${dish.id}-${i}`} onClick={() => setSelectedDish({ dish, restaurant: dish.restaurant })} style={{
                      borderRadius: 16, overflow: 'hidden', position: 'relative',
                      border: '1px solid rgba(255,255,255,0.08)', padding: 0, background: 'none', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', textAlign: 'left',
                    }}>
                      <div style={{ height: 120, position: 'relative', overflow: 'hidden' }}>
                        <img src={dish.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{fmtPrice(dish.original_price)}</span>
                          <div style={{ padding: '4px 8px', borderRadius: 8, backgroundColor: '#8DC63F' }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#000' }}>{fmtPrice(dish.price)}</span>
                          </div>
                        </div>
                        <div style={{ position: 'absolute', top: 6, left: 6, padding: '3px 6px', borderRadius: 6, backgroundColor: '#FACC15' }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#000' }}>{Math.round(((dish.original_price - dish.price) / dish.original_price) * 100)}% OFF</span>
                        </div>
                      </div>
                      <div style={{ padding: '10px 10px 12px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.3 }}>{dish.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{dish.restaurant.name}</span>
                          {dish.restaurant.rating && <span style={{ fontSize: 10, color: '#FACC15', fontWeight: 800 }}>★ {dish.restaurant.rating}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating cart total bar */}
          {cartCount > 0 && (
            <div style={{
              position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 9510,
              padding: '12px 16px', borderRadius: 16,
              backgroundColor: '#8DC63F', boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }} onClick={() => setCartOpen(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🛒</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#000' }}>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#000' }}>{fmtPrice(cartTotal)} →</span>
            </div>
          )}

          {/* Cart toast */}
          {cartToast && (
            <div style={{ position: 'fixed', bottom: cartCount > 0 ? 140 : 90, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 12, backgroundColor: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 800, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }}>
              ✓ {cartToast}
            </div>
          )}

          {/* Footer nav */}
          <FoodFooterNav
            onHome={onClose}
            onRestaurants={() => { const rest = selectedDish?.restaurant || (enriched && enriched[activeIndex]); if (rest) { setSelectedDish(null); setCuisineFilter(null); setCartOpen(false); setViewRestaurant(rest) } else { setShowCuisinePicker(true) } }}
            onNotifications={() => setNotifOpen(true)}
            onProfile={() => {}}
            activeTab={null}
          />
        </div>
      )
    })()}

    {/* ── Dish Detail Page — hero dish + restaurant's other dishes ── */}
    {selectedDish && (() => {
      const { dish, restaurant } = selectedDish
      const fmtP = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')
      const dishScrollRef = { current: null }

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 115, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Full screen background image */}
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2012_24_10%20PM.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />

          {/* Floating back + cart buttons — no header container */}
          <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2, pointerEvents: 'none' }}>
            <button onClick={() => { setSelectedDish(null); setCuisineFilter(null); setShowCuisinePicker(true) }} style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{restaurant.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {restaurant.rating && <span style={{ fontSize: 12, color: '#FACC15', fontWeight: 800 }}>★ {restaurant.rating}</span>}
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>· {restaurant.cuisine_type}</span>
              </div>
            </div>
            <button onClick={() => { setCartOpen(true) }} style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, pointerEvents: 'auto' }}>
              <img src="https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png?updatedAt=1775737452452" alt="cart" style={{ width: 48, height: 48, objectFit: 'contain' }} />
              {cartItems.length > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', padding: '0 3px' }}>{cartItems.reduce((s, i) => s + i.qty, 0)}</span>
              )}
            </button>
          </div>

          {/* Scrollable content */}
          <div ref={el => { dishScrollRef.current = el }} style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, padding: '0 0 20px' }}>

            {/* ── Dish hero + extras panel side by side ── */}
            {(() => {
              // Use vendor extras from Supabase, fallback to demo data
              const DEMO_EXTRAS = {
                sauces: [
                  { label: 'Extra Sambal', price: 3000 },
                  { label: 'Kecap Manis', price: 2000 },
                  { label: 'Chilli Oil', price: 3000 },
                  { label: 'Peanut Sauce', price: 3000 },
                  { label: 'Sambal Matah', price: 4000 },
                ],
                drinks: [
                  { label: 'Es Teh Manis', price: 5000 },
                  { label: 'Es Jeruk', price: 8000 },
                  { label: 'Kopi Susu', price: 12000 },
                  { label: 'Air Mineral', price: 4000 },
                  { label: 'Es Kelapa', price: 10000 },
                ],
                sides: [
                  { label: 'Extra Rice', price: 5000 },
                  { label: 'Fried Egg', price: 5000 },
                  { label: 'French Fries', price: 8000 },
                  { label: 'Kerupuk', price: 3000 },
                  { label: 'Extra Cheese', price: 8000 },
                ],
              }
              const hasVendorExtras = vendorExtras && (vendorExtras.sauces?.length > 0 || vendorExtras.drinks?.length > 0 || vendorExtras.sides?.length > 0)
              const EXTRAS = hasVendorExtras ? vendorExtras : DEMO_EXTRAS
              const ALL_EXTRAS = Object.values(EXTRAS).flat()
              const extrasCost = dishExtras.reduce((s, e) => s + (ALL_EXTRAS.find(x => x.label === e.label)?.price ?? 0) * (e.qty ?? 1), 0)
              const totalPrice = (dish.price * dishQty) + extrasCost

              return (
                <>
                  {/* Dish name above the row */}
                  <div style={{ margin: '70px 14px 20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2, flex: 1 }}>{dish.name}</span>
                      {dish.original_price && dish.original_price > dish.price && (
                        <span style={{ padding: '3px 7px', borderRadius: 6, backgroundColor: '#FACC15', fontSize: 11, fontWeight: 900, color: '#000', flexShrink: 0 }}>{Math.round(((dish.original_price - dish.price) / dish.original_price) * 100)}% OFF</span>
                      )}
                      <button onClick={() => setViewRestaurant(restaurant)} style={{
                        padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                        background: '#FACC15', border: 'none',
                        color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                      }}>View Menu</button>
                    </div>
                    {dish.description && <span style={{ fontSize: 12, color: '#fff', display: 'block', marginTop: 6, lineHeight: 1.4 }}>{dish.description.slice(0, 100)}</span>}
                  </div>

                  {/* Top row: dish image left + extras panel right */}
                  <div style={{ display: 'flex', gap: 10, margin: '0 14px', position: 'relative', alignItems: 'flex-start', zIndex: 1 }}>

                    {/* Left — image + delivery time */}
                    <div style={{ width: 160, flexShrink: 0 }}>
                      <div onClick={() => setDishImagePopup(true)} style={{ width: 160, height: 160, borderRadius: 18, overflow: 'hidden', position: 'relative', border: '2px solid #8DC63F', cursor: 'pointer' }}>
                        <img src={dish.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                        {/* Star rating */}
                        {restaurant.rating && (
                          <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontSize: 10, color: '#FACC15' }}>★</span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{restaurant.rating}</span>
                          </div>
                        )}
                        {/* Tags */}
                        {dish.tags?.length > 0 && (
                          <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {dish.tags.slice(0, 3).map(t => (
                              <span key={t.label} style={{ padding: '3px 8px', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span>{t.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{t.label}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Qty selector — below image */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                        <button onClick={() => setDishQty(q => Math.max(1, q - 1))} style={{
                          width: 40, height: 40, borderRadius: 10, background: 'none', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden',
                        }}><img src="https://ik.imagekit.io/nepgaxllc/sdfsdf-removebg-preview.png" alt="−" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
                        <span style={{ width: 36, textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>{dishQty}</span>
                        <button onClick={() => setDishQty(q => q + 1)} style={{
                          width: 40, height: 40, borderRadius: 10, background: 'none', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden',
                        }}><img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaaaccc-removebg-preview.png" alt="+" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
                      </div>
                    </div>

                    {/* Right — extras basket panel, min height matches image+delivery */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '2px solid #8DC63F', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', overflow: 'hidden' }}>
                      {/* Panel header */}
                      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F', display: 'block', lineHeight: 1.2 }}>Order Now</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 2 }}>{dishQty} x {fmtP(totalPrice)}</span>
                      </div>

                      {/* Selected extras list */}
                      <div style={{ padding: '6px 10px' }}>
                        {dishExtras.length === 0 ? (
                          <div style={{ padding: '8px 0', opacity: 0.35, textAlign: 'center' }}>
                            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Add extras below</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {dishExtras.map(item => (
                              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}>
                                <button onClick={() => setDishExtras(prev => prev.filter(e => e.label !== item.label))} style={{
                                  width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                  color: '#EF4444', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 6,
                                }}>✕</button>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', flex: 1, lineHeight: 1.2 }}>{item.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 900, color: '#8DC63F', flexShrink: 0 }}>x{item.qty}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Delivery estimate */}
                      <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <DeliveryBanner
                          customerLat={slCustomer?.lat}
                          customerLon={slCustomer?.lon}
                          vendorLat={enriched?.[activeIndex]?.lat || -7.7956}
                          vendorLon={enriched?.[activeIndex]?.lng || 110.3695}
                          subtotal={subtotal}
                          onChangeLocation={() => setShowCustomerPopup(true)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Easy Extra Adding */}
                  <div style={{ padding: '12px 14px', position: 'relative', zIndex: 1 }}>

                    {/* Banner card with header + toggle tabs */}
                    <div style={{ borderRadius: 16, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', marginBottom: 10, overflow: 'hidden' }}>
                      {/* Header */}
                      <div style={{ padding: '12px 14px 8px', textAlign: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 2 }}>Add Extras</span>
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', display: 'block' }}>Tap + to add sauces, drinks or sides</span>
                      </div>
                      {/* Toggle tabs */}
                      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                          { id: 'sauces', label: 'Sauces', img: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfssss-removebg-preview.png' },
                          { id: 'drinks', label: 'Drinks', img: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfsssssds-removebg-preview.png' },
                          { id: 'sides', label: 'Sides', img: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfsssssdss-removebg-preview.png' },
                        ].map(t => {
                          const tabCount = dishExtras.filter(e => (EXTRAS[t.id] ?? []).some(ex => ex.label === e.label)).reduce((s, e) => s + e.qty, 0)
                          return (
                          <button key={t.id} onClick={() => setExtrasTab(t.id)} style={{
                            flex: 1, padding: '10px 4px',
                            background: 'none',
                            border: 'none', borderBottom: extrasTab === t.id ? '3px solid #8DC63F' : '3px solid transparent',
                            color: extrasTab === t.id ? '#8DC63F' : '#fff',
                            fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}>
                            <img src={t.img} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                            {t.label}
                            {tabCount > 0 && <span style={{ padding: '1px 5px', borderRadius: 8, backgroundColor: '#8DC63F', color: '#000', fontSize: 10, fontWeight: 900 }}>{tabCount}</span>}
                          </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Extras options per tab — landscape cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {(EXTRAS[extrasTab] ?? []).map(ex => {
                        const existing = dishExtras.find(e => e.label === ex.label)
                        const qty = existing?.qty ?? 0
                        const isSelected = qty > 0
                        return (
                          <div key={ex.label} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                            borderRadius: 14, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                            border: `1.5px solid ${isSelected ? '#8DC63F' : 'rgba(255,255,255,0.06)'}`,
                          }}>
                            {/* Info */}
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1.2 }}>{ex.label}</span>
                              <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 3 }}>Rp {ex.price.toLocaleString('id-ID').replace(/,/g, '.')}</span>
                            </div>
                            {/* +/- controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                              <button onClick={() => setDishExtras(prev => qty <= 1 ? prev.filter(e => e.label !== ex.label) : prev.map(e => e.label === ex.label ? { ...e, qty: e.qty - 1 } : e))} style={{
                                width: 40, height: 40, borderRadius: 10, background: 'none', border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden',
                              }}><img src="https://ik.imagekit.io/nepgaxllc/sdfsdf-removebg-preview.png" alt="−" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
                              <span style={{ width: 30, textAlign: 'center', fontSize: 16, fontWeight: 900, color: isSelected ? '#fff' : 'rgba(255,255,255,0.2)' }}>{qty}</span>
                              <button onClick={() => setDishExtras(prev => {
                                if (existing) return prev.map(e => e.label === ex.label ? { ...e, qty: e.qty + 1 } : e)
                                return [...prev, { label: ex.label, qty: 1 }]
                              })} style={{
                                width: 40, height: 40, borderRadius: 10, background: 'none', border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden',
                              }}><img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaaaccc-removebg-preview.png" alt="+" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Special Instructions */}
                    <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.25)', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Special Instructions</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{dishNote.length}/150</span>
                      </div>
                      <textarea
                        value={dishNote}
                        onChange={e => setDishNote(e.target.value)}
                        placeholder="No chili, extra spicy, less salt..."
                        maxLength={150}
                        rows={3}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none', lineHeight: 1.4 }}
                      />
                    </div>

                    {/* Reviews section — expandable */}
                    <DishReviews rating={restaurant.rating} reviewCount={restaurant.review_count} />

                    {/* View Menu button */}
                    <button onClick={() => setViewRestaurant(restaurant)} style={{
                      width: '100%', padding: '14px', borderRadius: 14, marginTop: 12,
                      background: '#FACC15', border: 'none',
                      color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 0 12px rgba(250,204,21,0.4), 0 0 24px rgba(250,204,21,0.2)',
                      animation: 'menuBtnGlow 2s ease-in-out infinite',
                    }}>View Menu</button>
                    <style>{`@keyframes menuBtnGlow { 0%,100% { box-shadow: 0 0 12px rgba(250,204,21,0.4), 0 0 24px rgba(250,204,21,0.2); transform: scale(1); } 50% { box-shadow: 0 0 18px rgba(250,204,21,0.6), 0 0 36px rgba(250,204,21,0.3); transform: scale(1.03); } }`}</style>

                  </div>
                </>
              )
            })()}

          </div>

          {/* Dish image popup */}
          {dishImagePopup && (() => {
            const { dish: d, restaurant: r } = selectedDish
            return (
              <div onClick={() => setDishImagePopup(false)} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, borderRadius: 20, background: '#111', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  {/* Image */}
                  <div style={{ position: 'relative', height: 280 }}>
                    <img src={d.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)' }} />
                    {/* Close button */}
                    <button onClick={() => setDishImagePopup(false)} style={{
                      position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: '50%',
                      background: '#8DC63F', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    {/* Rating */}
                    {r.rating && (
                      <div style={{ position: 'absolute', top: 12, left: 12, padding: '6px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 14, color: '#FACC15' }}>★</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{r.rating}</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '16px' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.2 }}>{d.name}</span>
                    {d.description && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: 6, lineHeight: 1.4 }}>{d.description}</span>}
                    {/* Tags */}
                    {d.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {d.tags.map(t => (
                          <span key={t.label} style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 14 }}>{t.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.label}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                      {d.original_price && d.original_price > d.price && (
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{fmtP(d.original_price)}</span>
                      )}
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtP(d.price)}</span>
                    </div>
                    {/* Restaurant name */}
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 8 }}>{r.name} · {r.cuisine_type}</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Sticky Add to Cart footer */}
          {(() => {
            const DEMO_EX = [
              { label: 'Extra Sambal', price: 3000 }, { label: 'Kecap Manis', price: 2000 }, { label: 'Chilli Oil', price: 3000 }, { label: 'Peanut Sauce', price: 3000 }, { label: 'Sambal Matah', price: 4000 },
              { label: 'Es Teh Manis', price: 5000 }, { label: 'Es Jeruk', price: 8000 }, { label: 'Kopi Susu', price: 12000 }, { label: 'Air Mineral', price: 4000 }, { label: 'Es Kelapa', price: 10000 },
              { label: 'Extra Rice', price: 5000 }, { label: 'Fried Egg', price: 5000 }, { label: 'French Fries', price: 8000 }, { label: 'Kerupuk', price: 3000 }, { label: 'Extra Cheese', price: 8000 },
            ]
            const ALL_EX = vendorExtras ? Object.values(vendorExtras).flat() : DEMO_EX
            const exCost = dishExtras.reduce((s, e) => s + (ALL_EX.find(x => x.label === e.label)?.price ?? 0) * (e.qty ?? 1), 0)
            const total = (dish.price * dishQty) + exCost
            const fmtFooter = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')
            const alreadyInCart = cartItems.some(c => c.id === dish.id && c.restaurant?.id === restaurant.id)
            return (
              <div style={{ padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px)', flexShrink: 0, position: 'relative', zIndex: 2 }}>
                {(() => {
                  const hasChanges = dishQty > 1 || dishExtras.length > 0 || dishNote.trim()
                  const showAddToCart = !alreadyInCart || hasChanges
                  return showAddToCart ? (
                    <button onClick={() => {
                      setCartItems(prev => {
                        const existing = prev.find(c => c.id === dish.id && c.restaurant?.id === restaurant.id)
                        if (existing) return prev.map(c => c.id === dish.id && c.restaurant?.id === restaurant.id ? { ...c, qty: c.qty + dishQty } : c)
                        return [...prev, { ...dish, restaurant, qty: dishQty, note: dishNote, extras: dishExtras, extrasPrice: exCost }]
                      })
                      saveOrderToHistory(dish, restaurant, dishQty, dishExtras)
                      setCartToast(`${dishQty}x ${dish.name} added to cart`)
                      setTimeout(() => setCartToast(null), 2000)
                      setDishNote(''); setDishExtras([]); setDishQty(1)
                    }} style={{
                      width: '100%', padding: 0, borderRadius: 14,
                      background: 'none', border: 'none',
                      cursor: 'pointer', fontFamily: 'inherit',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <img src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                        Add to Cart — {fmtFooter(total)}
                      </span>
                    </button>
                  ) : (
                    <button onClick={() => setCartOpen(true)} style={{
                      width: '100%', padding: '14px', borderRadius: 14,
                      backgroundColor: '#8DC63F', border: 'none', color: '#000',
                      fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      View Cart — {cartItems.reduce((s, i) => s + i.qty, 0)} items
                    </button>
                  )
                })()}
              </div>
            )
          })()}
        </div>
      )
    })()}

    {/* ── Cart Page ── */}
    {cartOpen && (() => {
      const fmtC = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')
      const subtotal = cartItems.reduce((s, i) => s + (i.price ?? 0) * i.qty + (i.extrasPrice ?? 0), 0)

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2012_24_10%20PM.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 1 }}>
            <button onClick={() => setCartOpen(false)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', flex: 1 }}>Your Cart</span>
            <div style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png?updatedAt=1775737452452" alt="cart" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              {cartItems.length > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', padding: '0 4px' }}>{cartItems.reduce((s, i) => s + i.qty, 0)}</span>
              )}
            </div>
          </div>

          {/* Cart items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', position: 'relative', zIndex: 1 }}>

            {/* Delivery Location — top of cart */}
            {cartItems.length > 0 && (
              <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.25)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Delivery Location</span>
                  <img src="https://ik.imagekit.io/nepgaxllc/Untitledsdasdvvvdsds-removebg-preview.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 10 }}>Set location button or type in field</span>

                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <input value={checkoutAddress} onChange={e => {
                    setCheckoutAddress(e.target.value)
                    setCheckoutDeliveryFee(null)
                    const q = e.target.value.trim()
                    if (q.length >= 3) {
                      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=3&countrycodes=id,gb,us,au,sg,my`)
                        .then(r => r.json())
                        .then(data => {
                          const el = document.getElementById('cart-address-suggestions')
                          if (el) {
                            el.innerHTML = ''
                            el.style.display = data.length > 0 ? 'block' : 'none'
                            data.forEach(item => {
                              const btn = document.createElement('button')
                              btn.textContent = item.display_name
                              btn.style.cssText = 'width:100%;padding:10px 14px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.04);color:#fff;font-size:14px;font-weight:600;cursor:pointer;text-align:left;font-family:inherit;'
                              btn.onclick = () => { setCheckoutAddress(item.display_name); el.style.display = 'none' }
                              el.appendChild(btn)
                            })
                          }
                        }).catch(() => {})
                    } else {
                      const el = document.getElementById('cart-address-suggestions')
                      if (el) el.style.display = 'none'
                    }
                  }} placeholder="Enter address or use GPS" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  <div id="cart-address-suggestions" style={{ display: 'none', position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }} />
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => {
                    if (!navigator.geolocation) { alert('GPS not available on this device'); return }
                    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
                        const data = await res.json()
                        setCheckoutAddress(data.display_name ?? `${coords.latitude}, ${coords.longitude}`)
                      } catch { setCheckoutAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`) }
                      // Calculate delivery fee
                      const rest = cartItems[0]?.restaurant
                      if (rest?.lat && rest?.lng) {
                        const distKm = haversineKm(rest.lat, rest.lng, coords.latitude, coords.longitude) * 1.3
                        const fee = Math.max(10000, 9250 + Math.round(distKm * 1850))
                        setCheckoutDeliveryFee(fee)
                      } else {
                        setCheckoutDeliveryFee(10000)
                      }
                    }, (err) => {
                      alert('Please allow location access to set delivery address')
                    }, { enableHighAccuracy: true, timeout: 10000 })
                  }} style={{
                    flex: 1, padding: '14px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: checkoutDeliveryFee ? 'rgba(141,198,63,0.15)' : '#8DC63F',
                    color: checkoutDeliveryFee ? 'rgba(141,198,63,0.6)' : '#000',
                    fontSize: 14, fontWeight: 900, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={checkoutDeliveryFee ? 'rgba(141,198,63,0.6)' : '#000'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {checkoutDeliveryFee ? 'Location Set' : 'Set My Location'}
                  </button>
                  {checkoutAddress.trim() && (
                    <button onClick={() => { setCheckoutAddress(''); setCheckoutDeliveryFee(null) }} style={{ padding: '10px 16px', borderRadius: 10, background: '#991B1B', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🛒</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 6 }}>Cart is empty</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Add dishes from the menu</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cartItems.map((item, i) => (
                  <CartItemCard key={`${item.id}-${i}`} item={item} index={i} fmtC={fmtC} setCartItems={setCartItems} />
                ))}

                {/* Price breakdown — shows after location set */}
                {checkoutAddress.trim() && (
                  <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.25)', marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}><img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2004_54_54%20AM.png" alt="" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 4 }} />Food</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{fmtC(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} /></span>Delivery</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: checkoutDeliveryFee ? '#fff' : 'rgba(255,255,255,0.3)' }}>{checkoutDeliveryFee ? fmtC(checkoutDeliveryFee) : 'Tap Set My Location'}</span>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Total</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtC(subtotal + (checkoutDeliveryFee ?? 0))}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Proceed button — sticky footer */}
          {cartItems.length > 0 && !checkoutStep && (
            <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
              <button onClick={() => {
                if (!checkoutAddress.trim()) return
                localStorage.setItem('indoo_last_address', checkoutAddress.trim())
                setCheckoutStep('payment')
              }} disabled={!checkoutAddress.trim()} style={{
                width: '100%', padding: 16, borderRadius: 14, border: 'none',
                cursor: 'pointer', background: '#8DC63F', color: '#000',
                fontSize: 16, fontWeight: 900, fontFamily: 'inherit',
                opacity: checkoutAddress.trim() ? 1 : 0.4,
              }}>
                {!checkoutAddress.trim() ? 'Set Location to Order' : `Proceed — ${fmtC(subtotal + (checkoutDeliveryFee ?? 0))}`}
              </button>
            </div>
          )}

          {/* Payment choice → WhatsApp */}
          {checkoutStep === 'payment' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <img src="https://ik.imagekit.io/nepgaxllc/Untitledssssvsdfsdf.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8, position: 'relative', zIndex: 1 }}>Payment Method</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, position: 'relative', zIndex: 1 }}>How would you like to pay?</p>

              <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 320, marginBottom: 28, position: 'relative', zIndex: 1 }}>
                <button onClick={() => setCheckoutPayment('cod')} style={{
                  flex: 1, padding: '20px 14px', borderRadius: 16, cursor: 'pointer',
                  border: checkoutPayment === 'cod' ? '2px solid #8DC63F' : '2px solid #333',
                  background: checkoutPayment === 'cod' ? 'rgba(141,198,63,0.1)' : 'rgba(0,0,0,0.8)',
                  color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>💵</div>
                  Cash on Delivery
                </button>
                <button onClick={() => setCheckoutPayment('transfer')} style={{
                  flex: 1, padding: '20px 14px', borderRadius: 16, cursor: 'pointer',
                  border: checkoutPayment === 'transfer' ? '2px solid #60A5FA' : '2px solid #333',
                  background: checkoutPayment === 'transfer' ? 'rgba(96,165,250,0.1)' : 'rgba(0,0,0,0.8)',
                  color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🏦</div>
                  Bank Transfer
                </button>
              </div>

              <button onClick={async () => {
                const restaurant = cartItems[0]?.restaurant
                const orderRef = `FD-${Date.now().toString(36).toUpperCase().slice(-6)}`
                const itemsList = cartItems.map(c => `• ${c.qty}x ${c.name} — ${fmtC(c.price * c.qty)}`).join('\n')
                const deliveryEst = slCustomer?.lat ? calculateDelivery(slCustomer.lat, slCustomer.lon, restaurant?.lat || -7.7956, restaurant?.lng || 110.3695) : null
                const deliveryText = deliveryEst && !deliveryEst.tooFar ? `~${fmtC(deliveryEst.price)} (${deliveryEst.km}km est. — customer arranges own driver)` : 'Pickup / Customer arranges'
                const totalWithDelivery = subtotal + (checkoutDeliveryFee ?? 0)
                const payLabel = checkoutPayment === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'
                const customerName = slCustomer?.name || 'Customer'
                const customerPhone = slCustomer?.phone || ''
                const locationLink = slCustomer?.lat ? `https://maps.google.com/?q=${slCustomer.lat},${slCustomer.lon}` : checkoutAddress

                const message = `📋 *New Order — ${restaurant?.name || 'Restaurant'}*\nOrder Ref: ${orderRef}\n\n👤 *Customer:* ${customerName}\n📱 *WhatsApp:* ${customerPhone}\n\n🍽️ *Items:*\n${itemsList}\n\n💰 *Subtotal:* ${fmtC(subtotal)}\n🛵 *Delivery Est:* ${deliveryText}\n💵 *Total: ${fmtC(totalWithDelivery)}*\n\n📍 *Location:*\n${locationLink}\n\n💳 *Payment:* ${payLabel}`

                // Save to Supabase
                let savedOrderId = null
                if (supabase) {
                  try {
                    const { data: savedOrder } = await supabase.from('food_orders').insert({
                      restaurant_id: restaurant?.id,
                      restaurant_name: restaurant?.name,
                      restaurant_lat: restaurant?.lat,
                      restaurant_lng: restaurant?.lng,
                      customer_name: checkoutAddress ? 'Customer' : null,
                      customer_phone: null,
                      customer_address: checkoutAddress,
                      items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
                      subtotal: subtotal,
                      delivery_fee: checkoutDeliveryFee ?? 0,
                      total: subtotal + (checkoutDeliveryFee ?? 0),
                      payment_method: checkoutPayment,
                      status: 'order_received',
                      order_ref: orderRef,
                      created_at: new Date().toISOString(),
                    }).select().single()
                    if (savedOrder) savedOrderId = savedOrder.id
                  } catch (e) { console.warn('Order save failed:', e) }
                }

                const waNumber = restaurant?.phone || restaurant?.whatsapp || '6281573635143'
                window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank')

                // Save locally
                const order = { id: orderRef, restaurant: restaurant?.name, items: cartItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })), total: totalWithDelivery, payment_method: checkoutPayment, address: checkoutAddress, created_at: new Date().toISOString() }
                const orders = getFoodOrders(); orders.unshift(order); saveFoodOrders(orders)

                // Set tracking state
                setTrackingOrder({ orderRef, restaurantName: restaurant?.name, restaurantPhone: restaurant?.phone || restaurant?.whatsapp || '6281573635143', orderId: savedOrderId })
                setTrackingStatus('order_received')
                setCheckoutStep('sent')
              }} style={{
                width: '100%', maxWidth: 320, padding: 16, borderRadius: 14, border: 'none',
                background: '#8DC63F', color: '#000', fontSize: 16, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit', position: 'relative', zIndex: 1,
              }}>
                Place Order via WhatsApp →
              </button>

              <button onClick={() => { setCheckoutStep(null); setCartOpen(false); setCartItems([]); setSelectedDish(null); setCuisineFilter(null); setShowCuisinePicker(true) }} style={{
                marginTop: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', position: 'relative', zIndex: 1,
              }}>← Back</button>
            </div>
          )}

          {/* Order sent — real-time tracking */}
          {checkoutStep === 'sent' && (() => {
            const TRACKING_STEPS = [
              { key: 'order_received', label: 'Order Received' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'preparing', label: 'Preparing' },
              { key: 'on_the_way', label: 'On The Way' },
              { key: 'delivered', label: 'Delivered' },
            ]
            const currentIdx = TRACKING_STEPS.findIndex(s => s.key === trackingStatus)
            return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, overflowY: 'auto' }}>
              <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%203,%202026,%2009_56_21%20AM.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />

              {/* Checkmark */}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '3px solid #8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 14, position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 32, color: '#8DC63F' }}>✓</span>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4, position: 'relative', zIndex: 1 }}>Order Sent!</h2>
              {trackingOrder?.orderRef && (
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  Ref: <strong style={{ color: '#8DC63F' }}>{trackingOrder.orderRef}</strong>
                </p>
              )}

              {/* Timeline */}
              <div style={{ width: '100%', maxWidth: 320, position: 'relative', zIndex: 1, marginBottom: 24 }}>
                {TRACKING_STEPS.map((step, idx) => {
                  const isActive = idx <= currentIdx
                  const isCurrent = idx === currentIdx
                  return (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: idx < TRACKING_STEPS.length - 1 ? 0 : 0 }}>
                      {/* Dot + line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: isActive ? '#8DC63F' : 'rgba(255,255,255,0.1)',
                          border: isCurrent ? '3px solid #8DC63F' : isActive ? '3px solid #8DC63F' : '3px solid rgba(255,255,255,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isCurrent ? '0 0 12px rgba(141,198,63,0.4)' : 'none',
                        }}>
                          {isActive && <span style={{ color: '#000', fontSize: 12, fontWeight: 900 }}>✓</span>}
                        </div>
                        {idx < TRACKING_STEPS.length - 1 && (
                          <div style={{
                            width: 3, height: 32,
                            background: idx < currentIdx ? '#8DC63F' : 'rgba(255,255,255,0.1)',
                          }} />
                        )}
                      </div>
                      {/* Label */}
                      <div style={{ paddingTop: 2 }}>
                        <span style={{
                          fontSize: 14, fontWeight: isCurrent ? 800 : 600,
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                        }}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span style={{ display: 'block', fontSize: 12, color: '#8DC63F', fontWeight: 600, marginTop: 2 }}>
                            Current status
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Subscribe to real-time updates */}
              {trackingOrder?.orderId && (() => {
                // Use a self-invoking effect-like pattern via a tiny component
                const TrackingSub = memo(function TrackingSub({ orderId, onStatus }) {
                  useEffect(() => {
                    const unsub = subscribeToFoodOrder(orderId, (updated) => {
                      if (updated?.status) onStatus(updated.status)
                    })
                    return unsub
                  }, [orderId, onStatus])
                  return null
                })
                return <TrackingSub orderId={trackingOrder.orderId} onStatus={setTrackingStatus} />
              })()}

              {/* WhatsApp button */}
              {trackingOrder?.restaurantPhone && (
                <button onClick={() => {
                  window.open(`https://wa.me/${trackingOrder.restaurantPhone}?text=${encodeURIComponent(`Hi, checking on my order ${trackingOrder.orderRef || ''}. Thank you!`)}`, '_blank')
                }} style={{
                  width: '100%', maxWidth: 320, padding: 14, borderRadius: 12,
                  border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.1)',
                  color: '#25D366', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  fontFamily: 'inherit', position: 'relative', zIndex: 1, marginBottom: 10,
                }}>
                  Message Restaurant via WhatsApp
                </button>
              )}

              {/* Back to Menu */}
              <button onClick={() => {
                setCartOpen(false); setCartItems([]); setCheckoutStep(null)
                setSelectedDish(null); setCuisineFilter(null); setCheckoutPayment('cod')
                setMenuRestaurant(null); setShowCuisinePicker(true)
                setTrackingOrder(null); setTrackingStatus('order_received')
              }} style={{
                width: '100%', maxWidth: 320, padding: 14, borderRadius: 12, border: 'none',
                background: '#8DC63F', color: '#000', fontSize: 16, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit', position: 'relative', zIndex: 1,
              }}>Back to Menu</button>
            </div>
            )
          })()}

          {/* Step 1: Finding driver — satellite ping animation */}
          {checkoutStep === 'processing' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img src={new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'https://ik.imagekit.io/nepgaxllc/Indonesia%20cityscapes%20and%20landmarks%203D%20map.png?updatedAt=1776003140619' : 'https://ik.imagekit.io/nepgaxllc/Indonesia%20at%20night_%20map%20transforms%20to%20city.png?updatedAt=1776003167981'} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
              <style>{`
                @keyframes pingRing1 { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
                @keyframes pingRing2 { 0% { transform: scale(0.8); opacity: 0.6; } 100% { transform: scale(3); opacity: 0; } }
                @keyframes pingRing3 { 0% { transform: scale(0.8); opacity: 0.4; } 100% { transform: scale(3.5); opacity: 0; } }
                @keyframes pulseIcon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
              `}</style>
              {/* Header text */}
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 20, position: 'relative', zIndex: 1, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Processing Order</span>
              {/* Ping rings */}
              <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '2px solid #8DC63F', animation: 'pingRing1 2s ease-out infinite' }} />
                <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '2px solid #8DC63F', animation: 'pingRing2 2s ease-out infinite 0.5s' }} />
                <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(141,198,63,0.3)', animation: 'pingRing3 2s ease-out infinite 1s' }} />
                {/* Center order icon */}
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '2px solid #8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseIcon 2s ease-in-out infinite', zIndex: 1 }}>
                  <span style={{ fontSize: 36 }}>📋</span>
                </div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 24 }}>Sending to Restaurant</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Your order is being confirmed...</span>
            </div>
          )}

          {/* Step 2: Order confirmed */}
          {checkoutStep === 'found' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <img src={new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'https://ik.imagekit.io/nepgaxllc/Indonesia%20cityscapes%20and%20landmarks%203D%20map.png?updatedAt=1776003140619' : 'https://ik.imagekit.io/nepgaxllc/Indonesia%20at%20night_%20map%20transforms%20to%20city.png?updatedAt=1776003167981'} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
              <style>{`@keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
              <div style={{ animation: 'scaleIn 0.4s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {/* Restaurant icon */}
                <div style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid #8DC63F', overflow: 'hidden', marginBottom: 16, boxShadow: '0 0 30px rgba(141,198,63,0.3)', background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 48 }}>🍳</span>
                </div>
                {/* Restaurant name */}
                <span style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{menuRestaurant?.name ?? 'Restaurant'}</span>
                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 18, color: '#8DC63F' }}>✓</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>Confirmed</span>
                </div>
                {/* Order confirmed badge */}
                <div style={{ marginTop: 20, padding: '12px 28px', borderRadius: 14, background: '#8DC63F', border: 'none' }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#000' }}>Order Confirmed!</span>
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>Restaurant is preparing your food...</span>
              </div>
            </div>
          )}
        </div>
      )
    })()}

    {/* ── Full-screen Restaurant Card page ── */}
    {viewRestaurant && (
      <RestaurantLandingPage
        restaurant={viewRestaurant}
        onBack={() => setViewRestaurant(null)}
        onViewMenu={() => { setViewRestaurant(null); setSelectedDish(null); setCuisineFilter(null); setMenuRestaurant(viewRestaurant) }}
        onSelectDish={(dish, rest) => { setViewRestaurant(null); setSelectedDish({ dish, restaurant: rest }); setCuisineFilter(dish.category?.toLowerCase() ?? 'all') }}
      />
    )}

    <div className={styles.screen} style={{ display: showLanding || loading || showCuisinePicker || cuisineFilter ? 'none' : undefined }}>

      {/* Fixed header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, flex: 1 }}>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', display: 'inline' }}><span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F', marginLeft: -2 }}>OO</span></span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginLeft: 5 }}>STREET</span>
        </div>
      </div>

      {/* Vendor type toggle — compact text under header */}
      <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 48px)', left: 12, right: 70, zIndex: 200, display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { id: null, label: 'All' },
          { id: 'street_vendor', label: 'Street Food' },
          { id: 'restaurant', label: 'Restaurant' },
        ].map((tab, i) => (
          <span key={tab.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>|</span>}
            <button
              onClick={() => setVendorFilter(tab.id)}
              style={{
                background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer',
                fontSize: 11, fontWeight: vendorFilter === tab.id ? 900 : 600,
                color: vendorFilter === tab.id ? '#8DC63F' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          </span>
        ))}
      </div>


      {/* Scroll dots — dividers don't get a dot */}
      <div className={styles.dots}>
        {enriched.map((r, i) => r.isDivider ? null : (
          <div
            key={i}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            style={i === activeIndex ? { background: catColor } : {}}
          />
        ))}
      </div>

      {/* Full-height swipeable cards */}
      <div className={styles.cardContainer} ref={containerRef} onScroll={handleScroll}>
        {enriched.map((r, i) => r.isDivider
          ? (
            <div key="divider" className={styles.dividerCard}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>{r.label}</span>
              <div className={styles.dividerLine} />
            </div>
          ) : (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              rank={i + 1}
              isActive={i === activeIndex}
              onOpenMenu={() => setMenuRestaurant(r)}
              onToggleFavorite={() => { toggleFavorite(r); setFavTick(t => t + 1) }}
              isFav={isFavorite(r.id)}
              onOrderDeal={(deal) => { setActiveDeal(deal); setMenuRestaurant(r) }}
            />
          )
        )}
      </div>

      {/* Menu sheet */}
      {menuRestaurant && (
        <RestaurantMenuSheet
          restaurant={menuRestaurant}
          onClose={() => { setMenuRestaurant(null); setCartItems([]); setActiveDeal(null); window.__indooTrackingDriver = null }}
          onOrderViaChat={onOrderViaChat ?? null}
          initialCart={cartItems.length > 0 ? cartItems : undefined}
          startTracking={window.__indooTrackingDriver ? { driver: window.__indooTrackingDriver } : undefined}
          activeDeal={activeDeal}
        />
      )}

      {/* Customer food dashboard */}
      {foodDashOpen && (
        <FoodDashboard onClose={() => setFoodDashOpen(false)} />
      )}

      {/* ── Floating footer nav — disabled on home page ── */}

      {/* Notifications */}
      {notifOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9900, background: '#000' }}>
          <Suspense fallback={null}>
            <NotificationsScreen onClose={() => setNotifOpen(false)} />
          </Suspense>
        </div>
      )}

      {/* Profile */}
      {profileOpen && (
        <Suspense fallback={null}>
          <ProfileScreen onClose={() => setProfileOpen(false)} onOpenSettings={() => {}} />
        </Suspense>
      )}

      {/* Live Chat */}
      {chatOpen && (
        <LiveChatSheet
          order={getFoodOrders()[0] ?? null}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Promo banners */}
      {promoBrowseOpen && (
        <PromoBannerPage
          onClose={() => setPromoBrowseOpen(false)}
        />
      )}

      {/* --- Add to Home Screen banner --- */}
      {!installDismissed && !showLanding && (
        <div style={{ position: 'fixed', bottom: 80, left: 12, right: 12, padding: '10px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 9000 }}>
          <img src="https://ik.imagekit.io/nepgaxllc/Untitledsdfsdafaass-removebg-preview.png" alt="" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Add to Home Screen</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Quick access from your phone</div>
          </div>
          <button onClick={() => { setInstallDismissed(true); localStorage.setItem('foodpro_installDismissed', 'true') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Customer location popup — shown once on first visit */}
      {showCustomerPopup && !showLanding && (
        <CustomerPopup
          onSave={saveCustomer}
          onClose={() => setShowCustomerPopup(false)}
        />
      )}
    </div>
  </div>)
}

// ── Restaurant card ───────────────────────────────────────────────────────────
const RestaurantCard = memo(function RestaurantCard({ restaurant: r, rank, onOpenMenu, onToggleFavorite, isFav, onSelectDish, onOpenDeals, onOrderDeal }) {
  const [openTime, closeTime] = (r.opening_hours ?? '').split('–')
  const countdown = !r.is_open ? fmtCountdown(secsUntilOpen(r.opening_hours)) : null
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  const [dealsOpen, setDealsOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)
  const menuItems = r.menu_items ?? []
  const fmtM = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')

  // Group menu items by category
  const categories = {}
  menuItems.filter(i => i.is_available !== false).forEach(item => {
    const cat = item.category || 'Main'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(item)
  })

  return (
    <div className={styles.card}>

      {/* Rank number badge */}
      {rank && (
        <div style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', left: 16, zIndex: 10,
          width: 36, height: 36, borderRadius: 12,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(141,198,63,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>#{rank}</span>
        </div>
      )}

      {/* Right floating panel — 4 buttons: Menu, Deals, Share, Save */}
      <div style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {[
          { label: 'Menu', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>, action: () => setMenuDrawerOpen(true) },
          { label: 'Deals', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, action: () => setDealsOpen(true) },
          { label: 'Share', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>, action: () => navigator.share?.({ title: r.name, text: `Check out ${r.name} on INDOO` }).catch(() => {}) },
          { label: isFav ? 'Saved' : 'Save', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? '#EF4444' : 'none'} stroke={isFav ? '#EF4444' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, action: onToggleFavorite },
        ].map(item => (
          <button key={item.label} onClick={item.action} style={{
            width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 0', background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
          }}>
            {item.icon}
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Menu drawer — slides from left */}
      {menuDrawerOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex' }}>
          <div onClick={() => setMenuDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'relative', width: '80%', maxWidth: 320, height: '100%',
            background: '#0a0a0a',
            borderRight: '2px solid #8DC63F',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInLeft 0.25s ease', overflow: 'hidden',
          }}>
            <style>{`
              @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
              @keyframes drawerEdgeLight { 0% { top: -20%; } 100% { top: 120%; } }
            `}</style>
            {/* Running light on right edge */}
            <div style={{ position: 'absolute', top: 0, right: -1, width: 2, height: '100%', overflow: 'hidden', zIndex: 2 }}>
              <div style={{ width: 2, height: '20%', background: 'linear-gradient(to bottom, transparent, #8DC63F, transparent)', position: 'absolute', animation: 'drawerEdgeLight 2s linear infinite' }} />
            </div>
            <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 1 }}>
              <button onClick={() => setMenuDrawerOpen(false)} style={{ width: 44, height: 44, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>{r.name}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{menuItems.length} items</span>
              </div>
            </div>

            {/* Menu items grouped by category */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', position: 'relative', zIndex: 1 }}>
              {Object.keys(categories).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                  <span style={{ fontSize: 14 }}>No menu items yet</span>
                </div>
              ) : Object.entries(categories).map(([cat, items]) => (
                <div key={cat}>
                  {/* Category header */}
                  <div style={{ padding: '14px 16px 6px' }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat}</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 2 }}>
                      {cat === 'Main' ? 'Signature dishes from our kitchen' :
                       cat === 'Drinks' ? 'Refresh your meal' :
                       cat === 'Desserts' ? 'Sweet endings' :
                       cat === 'Snacks' ? 'Light bites to share' :
                       cat === 'Sides' ? 'Perfect pairings' :
                       cat === 'Breakfast' ? 'Start your day right' :
                       cat === 'Noodles' ? 'Hand-pulled favourites' :
                       cat === 'Rice' ? 'Hearty rice bowls' :
                       cat === 'Seafood' ? 'Fresh from the ocean' :
                       cat === 'Soup' ? 'Warm and comforting' :
                       `Explore our ${cat.toLowerCase()}`}
                    </span>
                  </div>
                  {/* Items */}
                  {items.map((item, i) => (
                    <button key={item.id ?? i} onClick={() => setPreviewItem(item)} style={{
                      width: 'calc(100% - 24px)', margin: '0 12px 8px', padding: '10px 12px',
                      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      border: `1.5px solid ${previewItem?.id === item.id ? '#8DC63F' : 'rgba(141,198,63,0.25)'}`,
                      borderRadius: 14, cursor: 'pointer',
                      display: 'flex', gap: 12, textAlign: 'left', height: 76, overflow: 'hidden',
                    }}>
                      {item.photo_url ? (
                        <img src={item.photo_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 24 }}>🍽️</span>
                        </div>
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                        {/* Name + rating on same row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 6 }}>
                            <span style={{ fontSize: 12, color: '#FACC15' }}>★</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{r.rating ?? '4.5'}</span>
                          </div>
                        </div>
                        {/* Description */}
                        {item.description && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description.slice(0, 40)}</span>}
                        {/* Tags + Price row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {(() => {
                              const txt = `${item.name ?? ''} ${item.description ?? ''}`.toLowerCase()
                              const tags = []
                              if (['pedas','sambal','geprek','spicy','balado','rica','cabai','cabe','chili'].some(w => txt.includes(w))) tags.push('🌶️')
                              if (['bawang','garlic','aglio'].some(w => txt.includes(w))) tags.push('🧄')
                              if (['vegetarian','vegan','sayur','tahu','tempe'].some(w => txt.includes(w))) tags.push('🥬')
                              if (['halal'].some(w => txt.includes(w))) tags.push('☪️')
                              if (['ikan','udang','seafood','fish','shrimp'].some(w => txt.includes(w))) tags.push('🦐')
                              return tags.map(t => <span key={t} style={{ fontSize: 14 }}>{t}</span>)
                            })()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            {item.original_price && item.original_price > item.price && (
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtM(item.original_price)}</span>
                            )}
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>{fmtM(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Preview card — enlarged item view */}
            {previewItem && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 16 }}>
                <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                <div style={{ borderRadius: 20, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                  {/* Large image */}
                  {previewItem.photo_url && (
                    <div style={{ height: 200, position: 'relative' }}>
                      <img src={previewItem.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)' }} />
                      {/* Tags */}
                      {(() => {
                        const txt = `${previewItem.name ?? ''} ${previewItem.description ?? ''} ${previewItem.category ?? ''}`.toLowerCase()
                        const tags = []
                        if (['pedas','sambal','geprek','spicy','balado','rica','cabai','cabe'].some(w => txt.includes(w))) tags.push({ icon: '🌶️', label: 'Spicy' })
                        if (['vegetarian','vegan','sayur','tahu','tempe'].some(w => txt.includes(w))) tags.push({ icon: '🥬', label: 'Vegan' })
                        if (['halal'].some(w => txt.includes(w))) tags.push({ icon: '☪️', label: 'Halal' })
                        if (['ikan','udang','seafood','fish','shrimp'].some(w => txt.includes(w))) tags.push({ icon: '🦐', label: 'Seafood' })
                        return tags.length > 0 ? (
                          <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 4 }}>
                            {tags.map(t => (
                              <span key={t.label} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span>{t.icon}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.label}</span>
                              </span>
                            ))}
                          </div>
                        ) : null
                      })()}
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.2 }}>{previewItem.name}</span>
                    {previewItem.description && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: 6, lineHeight: 1.4 }}>{previewItem.description}</span>}

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      {previewItem.original_price && previewItem.original_price > previewItem.price && (
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtM(previewItem.original_price)}</span>
                      )}
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtM(previewItem.price)}</span>
                      {previewItem.original_price && previewItem.original_price > previewItem.price && (
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: '#FACC15', fontSize: 14, fontWeight: 900, color: '#000' }}>{Math.round(((previewItem.original_price - previewItem.price) / previewItem.original_price) * 100)}% OFF</span>
                      )}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button onClick={() => setPreviewItem(null)} style={{
                        flex: 1, padding: '14px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                      }}>Close</button>
                      <button onClick={() => {
                        setPreviewItem(null); setMenuDrawerOpen(false); onSelectDish?.(previewItem, r)
                      }} style={{
                        flex: 2, padding: '14px', borderRadius: 14,
                        background: '#8DC63F', border: 'none', color: '#000',
                        fontSize: 16, fontWeight: 900, cursor: 'pointer',
                      }}>Add to Cart</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deals overlay — full page swipeable */}
      {dealsOpen && (() => {
        const dealItems = menuItems.filter(i => i.is_available !== false && i.original_price && i.original_price > i.price)
        const allItems = dealItems.length > 0 ? dealItems : menuItems.filter(i => i.is_available !== false).slice(0, 5)
        return (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
            {/* Header */}
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'relative', zIndex: 1 }}>
              <button onClick={() => setDealsOpen(false)} style={{ width: 44, height: 44, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>{r.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: 14, color: '#FACC15' }}>★</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{r.rating ?? '4.5'}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>· {r.cuisine_type ?? 'Restaurant'}</span>
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 2 }}>Today's deals and discounts</span>
              </div>
            </div>

            {/* Swipeable deal cards */}
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              {allItems.map((item, i) => {
                const discPct = item.original_price && item.original_price > item.price ? Math.round(((item.original_price - item.price) / item.original_price) * 100) : 0
                return (
                  <div key={item.id ?? i} style={{ minWidth: '100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
                    {/* Full size image */}
                    <div style={{ flex: 1, borderRadius: 20, overflow: 'hidden', position: 'relative', margin: '0 0 12px' }}>
                      {item.photo_url ? (
                        <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 48 }}>🍽️</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 40%)' }} />
                      {/* Top left — discount price */}
                      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {discPct > 0 && (
                          <div style={{ padding: '5px 10px', borderRadius: 8, background: '#FACC15', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#000' }}>{discPct}% OFF</span>
                          </div>
                        )}
                        <div style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtM(item.price)}</span>
                          {item.original_price && item.original_price > item.price && (
                            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginLeft: 6 }}>{fmtM(item.original_price)}</span>
                          )}
                        </div>
                      </div>
                      {/* Top right — swipe counter */}
                      {allItems.length > 1 && (
                        <div style={{ position: 'absolute', top: 14, right: 14, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)' }}>
                          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{i + 1}/{allItems.length}</span>
                        </div>
                      )}
                      {/* Bottom right — countdown + remaining */}
                      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <div style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{(() => {
                            const endH = 20 + (item.id ?? i) % 4
                            const now = new Date()
                            const end = new Date(now); end.setHours(endH, 0, 0, 0)
                            if (end <= now) end.setDate(end.getDate() + 1)
                            const diff = end - now
                            const h = Math.floor(diff / 3600000)
                            const m = Math.floor((diff % 3600000) / 60000)
                            return `${h}h ${m}m`
                          })()}</span>
                        </div>
                        <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#8DC63F' }}>{(item.stock ?? 10 + (item.id ?? i) % 15)} left</span>
                        </div>
                      </div>
                      {/* Item info */}
                      <div style={{ position: 'absolute', bottom: 16, left: 16, right: 130 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.2 }}>{item.name}</span>
                        {item.description && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: 4 }}>{item.description?.slice(0, 60)}</span>}
                        {/* Rating + Tags */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: 14, color: '#FACC15' }}>★</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{r.rating ?? '4.5'}</span>
                          {(() => {
                            const txt = `${item.name ?? ''} ${item.description ?? ''}`.toLowerCase()
                            const tags = []
                            if (['pedas','sambal','geprek','spicy','balado','rica','cabai','cabe','chili'].some(w => txt.includes(w))) tags.push('🌶️')
                            if (['bawang','garlic','aglio'].some(w => txt.includes(w))) tags.push('🧄')
                            if (['vegetarian','vegan','sayur','tahu','tempe'].some(w => txt.includes(w))) tags.push('🥬')
                            if (['halal'].some(w => txt.includes(w))) tags.push('☪️')
                            if (['ikan','udang','seafood','fish','shrimp'].some(w => txt.includes(w))) tags.push('🦐')
                            return tags.map(t => <span key={t} style={{ fontSize: 16 }}>{t}</span>)
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Add to cart button */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
                      <button onClick={() => { setDealsOpen(false); onSelectDish?.(item, r) }} style={{
                        flex: 1, padding: '16px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                        fontSize: 16, fontWeight: 900, cursor: 'pointer',
                      }}>Add to Cart</button>
                      <button onClick={() => { setDealsOpen(false); if (onOrderDeal) { onOrderDeal({ itemName: item.name, discountPercent: discPct, originalPrice: item.original_price ?? item.price, dealPrice: item.price }); } else { onOpenMenu?.(); } }} style={{
                        flex: 2, padding: '16px', borderRadius: 14,
                        background: '#8DC63F', border: 'none', color: '#000',
                        fontSize: 16, fontWeight: 900, cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
                      }}>Order Now — {fmtM(item.price)}</button>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Footer nav */}
            <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
              <FoodFooterNav onHome={() => setDealsOpen(false)} onRestaurants={() => { setDealsOpen(false); setShowCuisinePicker(true); setMenuRestaurant(null); setCuisineFilter(null) }} onNotifications={() => setNotifOpen(true)} onProfile={() => {}} activeTab={null} />
            </div>
          </div>
        )
      })()}

      {/* Background — cover > hero dish > gradient */}
      <div
        className={styles.cardBg}
        style={{
          backgroundImage: r.cover_url
            ? `url("${r.cover_url}")`
            : r.hero_dish_url
              ? `url("${r.hero_dish_url}")`
              : `linear-gradient(160deg, #1a1200 0%, #0d0d0d 100%)`,
        }}
      />
      <div className={styles.cardOverlay} />

      {/* Top badges */}
      <div className={styles.topBadges}>
        {/* Hours badge */}
        <span className={`${styles.statusBadge} ${r.is_open ? styles.statusOpen : styles.statusClosed}`}>
          <span className={styles.statusDot} />
          {r.is_open
            ? closeTime ? `Open · until ${closeTime}` : 'Open Now'
            : openTime  ? `Opens ${openTime}` : 'Closed'
          }
        </span>
      </div>


      {/* Bottom info — clean and sparse */}
      <div className={styles.cardBottom}>
        <span className={styles.cuisinePill}>{r.city || r.cuisine_type}</span>

        {/* Who's in the Kitchen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
          <div style={{ display: 'flex' }}>
            {[
              'https://i.pravatar.cc/100?img=1',
              'https://i.pravatar.cc/100?img=5',
              'https://i.pravatar.cc/100?img=9',
              'https://i.pravatar.cc/100?img=14',
              'https://i.pravatar.cc/100?img=20',
            ].map((url, i) => (
              <img key={i} src={url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #0a0a0a', marginLeft: i === 0 ? 0 : -6, objectFit: 'cover' }} />
            ))}
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid #0a0a0a', marginLeft: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>
              +{Math.floor(10 + Math.random() * 50)}
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>In the Kitchen</span>
        </div>

        <h2 className={styles.restaurantName}>{r.name}</h2>

        <div className={styles.ratingRow}>
          <Stars rating={r.rating} />
          <span className={styles.ratingNum}>{r.rating ?? '—'}</span>
          <span className={styles.ratingCount}>· {r.review_count} reviews</span>
        </div>

        <p className={styles.description}>{r.description}</p>

        {r.repeat_discount_percent > 0 && r.is_open && (
          <div className={styles.repeatBadge}>
            🔁 Order again within {r.repeat_discount_days ?? 3} days — {r.repeat_discount_percent}% off
          </div>
        )}

        {!r.is_open && countdown && (
          <div className={styles.countdown}>
            <span className={styles.countdownLabel}>Opening in</span>
            <span className={styles.countdownTime}>{countdown}</span>
          </div>
        )}

      </div>
    </div>
  )
})
