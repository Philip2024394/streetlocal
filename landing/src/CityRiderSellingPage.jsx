import React, { useState, useEffect, lazy, Suspense } from 'react'

// Lazy-loaded — maplibre-gl (~85KB gzipped) only enters the bundle when
// /cityrider is visited, not on every page in the landing app.
const CityRiderHeroMap = lazy(() => import('./components/CityRiderHeroMap.jsx'))

/* ─────────────────────────────────────────────────────────────────────────
   City Rider — selling page
   Dark-themed sales page. Single file, vanilla CSS in a <style> block,
   inline ID/EN translations (no fetch). Hero phone iframe renders at
   real mobile viewport (390px wide) and is scaled down via CSS transform
   so responsive content inside the live app looks right at any frame size.
   ───────────────────────────────────────────────────────────────────── */

// Live app URL — dev vs prod
const CITYRIDER_URL = (() => {
  if (typeof window === 'undefined') return 'https://cityrider.id'
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5186'
    : 'https://cityrider.id'
})()

const LANGUAGES = [
  { code: 'id', label: 'ID' },
  { code: 'en', label: 'EN' },
]

// All visible text. EN mirrors ID structure. Adapt copy as you like.
const STRINGS = {
  id: {
    nav: { how: 'Cara kerja', vs: 'vs Gojek', price: 'Harga', faq: 'FAQ' },
    hero: {
      h1Pre: 'Punya motor?',
      h1Main: 'Jadi',
      h1Accent: 'kurir mandiri',
      h1Post: 'dengan City Rider.',
      lede: 'Marketplace untuk rider motor independen. Atur harga sendiri, simpan 100% pendapatan, kontak customer langsung lewat WhatsApp. Tanpa komisi dan tanpa dispatch.',
      ctaSignup: 'Daftar sebagai rider →',
      ctaMarketplace: 'Lihat marketplace',
      pill: 'Rp 30.000/bulan · 0% komisi · cancel kapan saja',
    },
    // The 3 service categories City Rider supports — Bike Ride, Bike Parcel,
    // Bike Food. Each card uses a transparent-bg PNG from imagekit (cached
    // CDN, no upload needed). Bahasa descriptions below the card title.
    stats: [
      { img: 'https://ik.imagekit.io/nepgaxllc/Untitleddasdas-removebg-preview.png', value: 'Bike Ride',   label: 'Ojek harian · antar-jemput · ojek event' },
      { img: 'https://ik.imagekit.io/nepgaxllc/Untitledsddasd-removebg-preview.png?updatedAt=1779013880961', value: 'Bike Parcel', label: 'Dokumen · paket besar · kurir luar kota' },
      { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2017,%202026,%2005_29_25%20PM.png?updatedAt=1779013783890', value: 'Bike Food', label: 'Resto · warung · COD bahan dapur' },
    ],
    split: {
      r: { kicker: 'Untuk rider', title: 'Bangun bisnis kurir sendiri',
           desc: 'Daftar gratis, set motor + harga, bayar Rp 30K/bulan, go online. Customer kontak kamu langsung lewat WhatsApp. Tidak ada algoritma, tidak ada komisi, tidak ada suspend.',
           list: ['Atur harga per km dan minimum fee sendiri', 'Customer book — pelanggan kamu, bukan platform', 'Profile publik dengan QR code untuk marketing offline'] },
      c: { kicker: 'Untuk customer', title: 'Cari kurir terdekat, harga jelas',
           desc: 'Marketplace gratis untuk siapapun yang butuh kurir motor. Set jemput + antar, bandingkan rider dan harga total, pilih, kontak langsung lewat WhatsApp.',
           list: ['Tidak perlu install app — buka di browser saja', 'Lihat harga total sebelum kontak rider', 'Bayar langsung ke rider, sesuai kesepakatan'] },
    },
    steps: {
      kicker: 'Cara kerja',
      title: 'Dari daftar ke online dalam 5 menit',
      items: [
        { time: '30 detik', icon: '✍️',  title: 'Daftar gratis',         desc: 'Email + nama + WhatsApp + password. Tidak ada KTP upload, tidak ada training video.' },
        { time: '2 menit',  icon: '🛵',  title: 'Set motor + harga',     desc: 'Merk, model, tahun, warna, plat. Atur sendiri tarif per km (mis. Rp 2.500) dan minimum fee.' },
        { time: '1 menit',  icon: '💳',  title: 'Aktifkan Rp 30.000/bulan', desc: 'Bayar via QRIS, GoPay, OVO, Dana, atau transfer bank. Auto-renew, bisa cancel kapan saja.' },
        { time: 'Selamanya', icon: '🟢',  title: 'Go online → terima quote', desc: 'Tap "Go Online" di dashboard. Customer kontak kamu lewat WhatsApp. Kamu yang atur jam kerjamu.' },
      ],
    },
    compare: {
      kicker: 'Perbandingan',
      title: 'Kenapa rider pindah ke City Rider',
      them: 'Gojek / Grab', us: 'City Rider',
      rows: [
        { feat: 'Komisi per order',        them: '15-20% per order',        us: '0% — selamanya' },
        { feat: 'Harga ditentukan oleh',   them: 'Algoritma platform',      us: 'Kamu sendiri' },
        { feat: 'Kepemilikan customer',    them: 'Platform',                us: 'Kamu (Customer Book)' },
        { feat: 'Jam kerja',               them: 'Random dispatch',         us: 'Kamu pilih sendiri' },
        { feat: 'Risiko suspend',          them: 'Tinggi (rating, cancel)', us: 'Tidak ada' },
        { feat: 'Pembayaran customer',     them: 'Lewat platform',          us: 'Langsung COD/QRIS/transfer' },
        { feat: 'Biaya tetap bulanan',     them: 'Tidak ada (tapi cut order)', us: 'Rp 30.000 flat' },
        { feat: 'Bisa luar kota',          them: 'Sering ditolak',          us: 'Kamu yang setuju' },
      ],
    },
    features: {
      kicker: 'Apa kamu dapat',
      title: 'Yang termasuk dalam Rp 30.000/bulan',
      items: [
        { icon: '🌐', title: 'Profile publik dengan URL sendiri',  desc: 'Dapat link cityrider.id/r/nama-kamu — share di WhatsApp Status, Instagram, Facebook.' },
        { icon: '📍', title: 'Listing di marketplace GPS',         desc: 'Saat online, otomatis muncul di marketplace untuk customer terdekat. GPS dot kuning berdenyut.' },
        { icon: '💬', title: 'Quote inbox + notifikasi suara',     desc: 'Setiap kali customer tap WhatsApp, kamu dapat beep + notifikasi. Tidak pernah lewat customer.' },
        { icon: '📒', title: 'Customer Book — database sendiri',   desc: 'Daftar semua pelanggan, tracker repeat, "Pesan ulang" 1 tap. Customer kamu, bukan platform.' },
        { icon: '🪪', title: 'Kartu nama digital + QR',            desc: 'Print kartu nama dengan QR code. Tempel di motor, kasih ke customer, sebar di warung.' },
        { icon: '⚡', title: '8 template balasan WhatsApp',         desc: 'Salam, info kapasitas, COD, ETA, penutup. Tap copy → paste. Terlihat profesional tanpa ribet.' },
        { icon: '📊', title: 'Dashboard ROI bulanan',              desc: 'Lihat berapa quote diterima, nilai total, ROI vs subscription. Pasti tahu apakah worth it.' },
        { icon: '🔄', title: 'Offline fallback (reciprocal)',      desc: 'Saat kamu offline, profilemu rekomendasi rider lain → mereka rekomendasi balik. Network growth.' },
      ],
    },
    pricing: {
      kicker: 'Harga', title: 'Satu paket, satu harga, semua termasuk',
      ribbon: '⚡ Aktif sekarang',
      name: 'City Rider — Rider',
      period: '/bulan',
      sub: '0% komisi · auto-renew · cancel kapan saja',
      list: [
        'Listing profile di marketplace GPS',
        'Quote inbox + notifikasi beep + haptic',
        'Customer Book — database pelanggan sendiri',
        'Kartu nama digital + QR (printable)',
        '8 template balasan WhatsApp Bahasa Indonesia',
        'Dashboard ROI bulanan',
        'Profile publik URL: cityrider.id/r/nama-kamu',
        'Offline fallback reciprocal network',
      ],
      cta: 'Daftar & aktifkan sekarang →',
      note: 'Bayar via QRIS, GoPay, OVO, Dana, ShopeePay, atau transfer bank.',
    },
    demo: { kicker: 'Coba langsung', title: 'Lihat aplikasinya bekerja sekarang',
            ctaFull: 'Buka full di tab baru →', ctaDashboard: 'Lihat rider dashboard' },
    testi: {
      kicker: 'Rider stories', title: 'Apa kata rider yang sudah pakai',
      items: [
        { name: 'Andi Pratama', area: 'Yogyakarta Tengah', bike: 'Honda BeAT 2023',
          quote: 'Setelah 3 tahun di Gojek, City Rider buat saya merasa punya bisnis sendiri. Customer langganan saya sekarang 12 orang yang chat saya langsung — itu yang Gojek tidak pernah kasih.' },
        { name: 'Citra Wulandari', area: 'Bantul', bike: 'Honda Scoopy 2024',
          quote: 'Saya rider perempuan. Di City Rider saya bisa atur jam kerja sendiri (cuma siang) tanpa takut rating turun atau dispatch ke malam. Customer book saya isi 23 langganan dalam 2 bulan.' },
        { name: 'Gilang Saputra', area: 'Yogyakarta Utara', bike: 'Honda CB150R 2024',
          quote: 'Motor sport saya untuk paket urgent — di Gojek harga sama dengan motor matic. Di City Rider saya pasang Rp 3.500/km dan customer yang butuh cepat ya bayar harga itu. Selisih ratusan ribu per bulan.' },
      ],
    },
    faq: {
      kicker: 'FAQ', title: 'Pertanyaan yang sering ditanyakan rider',
      items: [
        ['Apa saya bisa cancel subscription kapan saja?',
         'Ya, kapan saja. Subscription auto-renew bulanan via Midtrans. Tap "Cancel" di dashboard kapanpun — masa aktif berjalan sampai akhir periode yang sudah dibayar, lalu profile otomatis tidak aktif. Tidak ada penalty, tidak ada minimum kontrak.'],
        ['Bagaimana cara bayar Rp 30.000/bulan?',
         'Lewat Midtrans — bisa pakai QRIS (semua bank), GoPay, OVO, Dana, ShopeePay, atau transfer BCA/Mandiri/BRI/BNI Virtual Account. Sekali setup, auto-renew tiap bulan. Kalau gagal bayar, ada 3 hari grace period sebelum profile disembunyikan.'],
        ['Customer bayar ke saya langsung atau ke City Rider?',
         'Langsung ke kamu. City Rider sama sekali tidak terlibat di transaksi customer-rider. Kamu nego sendiri dengan customer di WhatsApp — COD, transfer ke rekeningmu, QRIS ke barcode kamu, terserah. City Rider cuma platform listing — kamu yang jalankan bisnis.'],
        ['Berapa lama setup sampai bisa terima customer?',
         'Sekitar 5 menit total — 30 detik daftar, 2 menit isi profile + motor + harga, 1 menit bayar QRIS, lalu tap "Go Online". Setelah itu profilemu langsung muncul di marketplace untuk customer di area sekitarmu.'],
        ['Bagaimana City Rider beda dari Gojek atau Grab?',
         'Gojek/Grab adalah perusahaan dispatch — mereka ambil 15-20% per order, tentukan harga, dan algoritma mereka yang assign customer. City Rider bukan dispatch — kita cuma platform listing seperti yellow pages digital. Kamu yang muncul di pencarian customer, kamu yang nego, kamu yang antar, kamu yang dibayar. 0% komisi, kamu pemilik bisnis.'],
        ['Apa kalau saya offline (libur, sakit, dsb)?',
         'Profilemu tetap online di marketplace tapi dengan label "offline". Customer yang mampir ke profilemu otomatis dialihkan ke 5 rider terdekat yang sedang aktif. Saat kamu kembali aktif, profilemu otomatis muncul di pencarian lagi. Tidak ada penalty saat offline.'],
        ['Customer bisa rating saya?',
         'Belum di Phase 1 — kami sengaja menunda rating system karena di Gojek/Grab sering disalahgunakan untuk suspend rider tanpa konteks. Kami sedang riset model rating yang adil untuk rider. Untuk sekarang, social proof berdasarkan repeat customer di Customer Book kamu.'],
        ['Bisa antar luar kota / luar daerah?',
         'Bisa — kamu yang setuju. Saat customer kontak via WhatsApp, kamu bebas terima atau tolak job manapun. Beberapa rider kami punya niche "kurir luar kota" (Yogya-Magelang, Yogya-Klaten) dan pasang harga lebih tinggi untuk jarak jauh. City Rider tidak ngatur.'],
      ],
    },
    cta: { title: 'Siap jadi kurir mandiri?',
           sub: '5 menit setup. Rp 30.000/bulan. 0% komisi selamanya. Customer kamu, harga kamu, jam kamu.',
           primary: 'Daftar sebagai rider →', ghost: 'Buka marketplace' },
    footer: { tag: 'Bagian dari keluarga aplikasi StreetLocal',
              links: { home: 'StreetLocal', donut: 'Donut app', affiliate: 'Jadi agen', faq: 'FAQ', contact: 'Kontak' },
              legal: 'StreetLocal · cityrider.id · Yogyakarta, Indonesia' },
  },

  en: {
    nav: { how: 'How it works', vs: 'vs Gojek', price: 'Pricing', faq: 'FAQ' },
    hero: {
      h1Pre: 'Got a bike?',
      h1Main: 'Become an',
      h1Accent: 'independent courier',
      h1Post: 'with City Rider.',
      lede: 'A marketplace for independent motorcycle couriers. Set your own prices, keep 100% of earnings, contact customers directly on WhatsApp. No commission, no dispatch.',
      ctaSignup: 'Sign up as a rider →',
      ctaMarketplace: 'View marketplace',
      pill: 'Rp 30,000/month · 0% commission · cancel anytime',
    },
    stats: [
      { img: 'https://ik.imagekit.io/nepgaxllc/Untitleddasdas-removebg-preview.png', value: 'Bike Ride',   label: 'Daily ojek · school/office pickup · event rides' },
      { img: 'https://ik.imagekit.io/nepgaxllc/Untitledsddasd-removebg-preview.png?updatedAt=1779013880961', value: 'Bike Parcel', label: 'Documents · large parcels · out-of-town courier' },
      { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2017,%202026,%2005_29_25%20PM.png?updatedAt=1779013783890', value: 'Bike Food', label: 'Restaurants · warungs · COD groceries' },
    ],
    split: {
      r: { kicker: 'For riders', title: 'Run your own courier business',
           desc: 'Sign up free, set your bike + price, pay Rp 30K/month, go online. Customers contact you directly on WhatsApp. No algorithm, no commission, no suspension risk.',
           list: ['Set your own per-km rate and minimum fee', 'Customer book — your customers, not the platform', 'Public profile with QR code for offline marketing'] },
      c: { kicker: 'For customers', title: 'Find a nearby courier, clear pricing',
           desc: 'Free marketplace for anyone needing a motorcycle courier. Set pickup + dropoff, compare riders and prices, pick one, contact them directly on WhatsApp.',
           list: ['No app install — works in any browser', 'See total price before contacting the rider', 'Pay the rider directly, however you agree'] },
    },
    steps: {
      kicker: 'How it works',
      title: 'From sign-up to online in 5 minutes',
      items: [
        { time: '30 sec',  icon: '✍️',  title: 'Sign up free',          desc: 'Email + name + WhatsApp + password. No KYC upload, no training video.' },
        { time: '2 min',   icon: '🛵',  title: 'Set bike + price',      desc: 'Make, model, year, colour, plate. Set your own per-km rate (e.g. Rp 2,500) and minimum fee.' },
        { time: '1 min',   icon: '💳',  title: 'Activate Rp 30K/month', desc: 'Pay via QRIS, GoPay, OVO, Dana, or bank transfer. Auto-renew, cancel anytime.' },
        { time: 'Forever', icon: '🟢',  title: 'Go online → get quotes', desc: 'Tap "Go Online" in the dashboard. Customers contact you on WhatsApp. You set your own hours.' },
      ],
    },
    compare: {
      kicker: 'Comparison',
      title: 'Why riders switch to City Rider',
      them: 'Gojek / Grab', us: 'City Rider',
      rows: [
        { feat: 'Commission per order',    them: '15-20% per order',        us: '0% — forever' },
        { feat: 'Price set by',            them: 'Platform algorithm',      us: 'You' },
        { feat: 'Customer ownership',      them: 'Platform',                us: 'You (Customer Book)' },
        { feat: 'Working hours',           them: 'Random dispatch',         us: 'You choose' },
        { feat: 'Suspension risk',         them: 'High (rating, cancel)',   us: 'None' },
        { feat: 'Customer payment',        them: 'Via platform',            us: 'Direct COD/QRIS/transfer' },
        { feat: 'Monthly fixed cost',      them: 'None (but per-order cut)', us: 'Rp 30,000 flat' },
        { feat: 'Out-of-town trips',       them: 'Often rejected',          us: 'You decide' },
      ],
    },
    features: {
      kicker: 'What you get',
      title: 'Everything included in Rp 30,000/month',
      items: [
        { icon: '🌐', title: 'Public profile with your own URL', desc: 'Get cityrider.id/r/your-name — share on WhatsApp Status, Instagram, Facebook.' },
        { icon: '📍', title: 'GPS marketplace listing',          desc: 'When online, you automatically appear for nearby customers. Pulsing yellow GPS dot.' },
        { icon: '💬', title: 'Quote inbox + sound alerts',       desc: 'Every time a customer taps WhatsApp, you get a beep + notification. Never miss a customer.' },
        { icon: '📒', title: 'Customer Book — your own database', desc: 'List of all customers, repeat tracking, "Message again" in 1 tap. Your customers, not the platform.' },
        { icon: '🪪', title: 'Digital business card + QR',       desc: 'Print a name card with QR code. Stick it on your bike, hand it to customers, spread it at warungs.' },
        { icon: '⚡', title: '8 WhatsApp reply templates',        desc: 'Greeting, capacity info, COD, ETA, closing. Tap copy → paste. Look professional without typing.' },
        { icon: '📊', title: 'Monthly ROI dashboard',            desc: 'See how many quotes you got, total value, ROI vs subscription. Always know if it pays back.' },
        { icon: '🔄', title: 'Offline fallback (reciprocal)',    desc: 'When you go offline, your profile recommends other riders → they recommend yours. Network growth.' },
      ],
    },
    pricing: {
      kicker: 'Pricing', title: 'One plan, one price, all included',
      ribbon: '⚡ Active now',
      name: 'City Rider — Rider',
      period: '/month',
      sub: '0% commission · auto-renew · cancel anytime',
      list: [
        'Profile listing on the GPS marketplace',
        'Quote inbox + beep + haptic notifications',
        'Customer Book — your own customer database',
        'Digital business card + QR (printable)',
        '8 Bahasa Indonesia WhatsApp reply templates',
        'Monthly ROI dashboard',
        'Public profile URL: cityrider.id/r/your-name',
        'Offline fallback reciprocal network',
      ],
      cta: 'Sign up & activate now →',
      note: 'Pay via QRIS, GoPay, OVO, Dana, ShopeePay, or bank transfer.',
    },
    demo: { kicker: 'Try it', title: 'See the app working right now',
            ctaFull: 'Open full in new tab →', ctaDashboard: 'View rider dashboard' },
    testi: {
      kicker: 'Rider stories', title: 'What riders are saying',
      items: [
        { name: 'Andi Pratama', area: 'Yogyakarta Central', bike: 'Honda BeAT 2023',
          quote: 'After 3 years on Gojek, City Rider makes me feel like I own a real business. I now have 12 regular customers who chat me directly — something Gojek never gave me.' },
        { name: 'Citra Wulandari', area: 'Bantul', bike: 'Honda Scoopy 2024',
          quote: "I'm a female rider. On City Rider I can set my own hours (daytime only) without worrying about a rating drop or being dispatched at night. My Customer Book filled with 23 regulars in 2 months." },
        { name: 'Gilang Saputra', area: 'Yogyakarta North', bike: 'Honda CB150R 2024',
          quote: 'My sport bike is for urgent packages — on Gojek I get paid the same as a matic. On City Rider I charge Rp 3,500/km and customers who need speed pay it. Hundreds of thousands more per month.' },
      ],
    },
    faq: {
      kicker: 'FAQ', title: 'Frequently asked rider questions',
      items: [
        ['Can I cancel my subscription anytime?',
         'Yes, anytime. Auto-renews monthly via Midtrans. Tap "Cancel" in the dashboard whenever — your active period runs to the end of the cycle you already paid for, then your profile is hidden automatically. No penalty, no minimum contract.'],
        ['How do I pay the Rp 30,000/month?',
         'Through Midtrans — QRIS (any bank), GoPay, OVO, Dana, ShopeePay, or BCA/Mandiri/BRI/BNI Virtual Account transfer. One-time setup, then auto-renew monthly. If payment fails, there is a 3-day grace period before your profile is hidden.'],
        ['Do customers pay me directly or through City Rider?',
         "Directly to you. City Rider is not involved in the customer-rider transaction at all. You negotiate on WhatsApp — COD, transfer to your account, QRIS to your barcode, however you like. We're just the listing platform; you run the business."],
        ['How long to set up and start receiving customers?',
         'About 5 minutes total — 30 seconds to register, 2 minutes for profile + bike + price, 1 minute to pay via QRIS, then tap "Go Online". Your profile then appears immediately for customers in your area.'],
        ['How is City Rider different from Gojek or Grab?',
         "Gojek/Grab are dispatch companies — they take 15-20% per order, set the price, and their algorithm assigns customers. City Rider is NOT a dispatcher — we're just a listing platform like digital yellow pages. You appear in customer searches, you negotiate, you deliver, you get paid. 0% commission, you own the business."],
        ['What happens when I go offline (off-day, sick, etc.)?',
         'Your profile stays in the marketplace with an "offline" label. Customers who land on your profile are automatically shown the 5 nearest active riders. When you come back online, your profile appears in search again. No penalty for being offline.'],
        ['Can customers rate me?',
         'Not in Phase 1 — we intentionally delayed ratings because on Gojek/Grab they are frequently abused to suspend riders without context. We are researching a fair rating model. For now, social proof is based on repeat customers in your Customer Book.'],
        ['Can I take out-of-town trips?',
         "Yes — you decide. When a customer contacts you on WhatsApp, you are free to accept or reject any job. Some of our riders specialise in out-of-town runs (Yogya-Magelang, Yogya-Klaten) and charge more for distance. City Rider doesn't interfere."],
      ],
    },
    cta: { title: 'Ready to be an independent courier?',
           sub: '5 min setup. Rp 30,000/month. 0% commission forever. Your customers, your prices, your hours.',
           primary: 'Sign up as a rider →', ghost: 'Open marketplace' },
    footer: { tag: 'Part of the StreetLocal family of apps',
              links: { home: 'StreetLocal', donut: 'Donut app', affiliate: 'Become an agent', faq: 'FAQ', contact: 'Contact' },
              legal: 'StreetLocal · cityrider.id · Yogyakarta, Indonesia' },
  },
}

function getStoredLocale() {
  if (typeof window === 'undefined') return 'id'
  try {
    const ls = localStorage.getItem('sl_cityrider_locale')
    if (ls && STRINGS[ls]) return ls
  } catch { /* ignore */ }
  return 'id'
}

export default function CityRiderSellingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [locale, setLocale] = useState(getStoredLocale)
  const t = STRINGS[locale]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function changeLocale(code) {
    setLocale(code)
    try { localStorage.setItem('sl_cityrider_locale', code) } catch { /* ignore */ }
  }

  function openLiveApp(path = '/') {
    window.open(`${CITYRIDER_URL}${path}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="cr-page">
      <PageStyles />

      {/* ─── BACKGROUND MAP ─── */}
      <div className="cr-page-bg" aria-hidden>
        <Suspense fallback={null}>
          <CityRiderHeroMap />
        </Suspense>
        <div className="cr-page-bg__overlay" />
      </div>

      {/* ─── NAV ─── */}
      <header className={`cr-nav ${scrolled ? 'cr-nav--scrolled' : ''}`}>
        <div className="cr-nav__inner">
          <a href="/" className="cr-brand">
            <span className="cr-brand__icon">🛵</span>
            <span>City <span className="cr-grad">Rider</span></span>
          </a>
          <nav className="cr-nav__links">
            <a href="#how">{t.nav.how}</a>
            <a href="#vs">{t.nav.vs}</a>
            <a href="#price">{t.nav.price}</a>
            <a href="#faq">{t.nav.faq}</a>
            <div className="cr-langtog" role="group" aria-label="Language">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => changeLocale(l.code)}
                  className={'cr-langtog__btn ' + (locale === l.code ? 'cr-langtog__btn--on' : '')}
                  aria-pressed={locale === l.code}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="cr-hero">
        <div className="cr-hero__bg" />
        <div className="cr-hero__inner">
          <div className="cr-hero__left">
            <h1 className="cr-h1">
              {t.hero.h1Pre}<br />
              {t.hero.h1Main} <span className="cr-grad">{t.hero.h1Accent}</span> {t.hero.h1Post}
            </h1>
            <p className="cr-hero__lede">{t.hero.lede}</p>
            <div className="cr-hero__cta">
              <button onClick={() => openLiveApp('/signup')} className="cr-btn cr-btn--primary cr-btn--lg">
                {t.hero.ctaSignup}
              </button>
              <button onClick={() => openLiveApp('/')} className="cr-btn cr-btn--ghost cr-btn--lg">
                {t.hero.ctaMarketplace}
              </button>
            </div>
            <div className="cr-hero__pill">
              <span className="cr-dot" />
              {t.hero.pill}
            </div>
          </div>
          <div className="cr-hero__right">
            <div className="cr-phone">
              <div className="cr-phone__notch" />
              <div className="cr-phone__screen">
                <iframe
                  src={CITYRIDER_URL + '/'}
                  title="City Rider live demo"
                  className="cr-phone__frame"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICE CATEGORIES (replaces old stats strip) ─── */}
      <section className="cr-stats">
        <div className="cr-container">
          <div className="cr-stats__grid">
            {t.stats.map(s => (
              <div key={s.value} className="cr-stat">
                {s.img && <img src={s.img} alt="" className="cr-stat__img" loading="lazy" />}
                {s.icon && !s.img && <div className="cr-stat__icon">{s.icon}</div>}
                <div className="cr-stat__value cr-grad">{s.value}</div>
                <div className="cr-stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TWO COLUMNS ─── */}
      <section className="cr-section">
        <div className="cr-container">
          <div className="cr-split">
            <div className="cr-split__col">
              <span className="cr-kicker cr-kicker--inline">{t.split.r.kicker}</span>
              <h3 className="cr-h3">{t.split.r.title}</h3>
              <p className="cr-muted">{t.split.r.desc}</p>
              <ul className="cr-checklist">
                {t.split.r.list.map((li, i) => <li key={i}>{li}</li>)}
              </ul>
            </div>
            <div className="cr-split__col">
              <span className="cr-kicker cr-kicker--inline">{t.split.c.kicker}</span>
              <h3 className="cr-h3">{t.split.c.title}</h3>
              <p className="cr-muted">{t.split.c.desc}</p>
              <ul className="cr-checklist">
                {t.split.c.list.map((li, i) => <li key={i}>{li}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="cr-section" id="how">
        <div className="cr-container">
          <SectionHead kicker={t.steps.kicker} title={t.steps.title} />
          <div className="cr-steps">
            {t.steps.items.map((s, i) => (
              <div key={i} className="cr-step">
                <div className="cr-step__num">
                  <span className="cr-step__icon">{s.icon}</span>
                  <span className="cr-step__time">{s.time}</span>
                </div>
                <div className="cr-step__title">{s.title}</div>
                <div className="cr-step__desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section className="cr-section cr-section--alt" id="vs">
        <div className="cr-container">
          <SectionHead kicker={t.compare.kicker} title={t.compare.title} />
          <div className="cr-compare">
            <div className="cr-compare__head">
              <div></div>
              <div className="cr-compare__col-head cr-compare__col-head--them">{t.compare.them}</div>
              <div className="cr-compare__col-head cr-compare__col-head--us">{t.compare.us}</div>
            </div>
            {t.compare.rows.map((row, i) => (
              <div key={i} className="cr-compare__row">
                <div className="cr-compare__feat">{row.feat}</div>
                <div className="cr-compare__cell cr-compare__cell--them">
                  <span className="cr-cell-x">✕</span>
                  <span>{row.them}</span>
                </div>
                <div className="cr-compare__cell cr-compare__cell--us">
                  <span className="cr-cell-check">✓</span>
                  <span>{row.us}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="cr-section">
        <div className="cr-container">
          <SectionHead kicker={t.features.kicker} title={t.features.title} />
          <div className="cr-features">
            {t.features.items.map((f, i) => (
              <div key={i} className="cr-feat">
                <div className="cr-feat__icon">{f.icon}</div>
                <div className="cr-feat__title">{f.title}</div>
                <div className="cr-feat__desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="cr-section cr-section--alt" id="price">
        <div className="cr-container">
          <SectionHead kicker={t.pricing.kicker} title={t.pricing.title} />
          <div className="cr-price">
            <div className="cr-price__card">
              <div className="cr-price__ribbon">{t.pricing.ribbon}</div>
              <div className="cr-price__name">{t.pricing.name}</div>
              <div className="cr-price__amount">
                <span className="cr-price__num cr-grad">Rp 30.000</span>
                <span className="cr-price__period">{t.pricing.period}</span>
              </div>
              <div className="cr-price__sub">{t.pricing.sub}</div>
              <ul className="cr-price__list">
                {t.pricing.list.map((li, i) => <li key={i}>{li}</li>)}
              </ul>
              <button onClick={() => openLiveApp('/signup')} className="cr-btn cr-btn--primary cr-btn--lg cr-price__cta">
                {t.pricing.cta}
              </button>
              <div className="cr-price__note">{t.pricing.note}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE DEMO ─── */}
      <section className="cr-section">
        <div className="cr-container">
          <SectionHead kicker={t.demo.kicker} title={t.demo.title} />
          <div className="cr-demo">
            <div className="cr-demo__frame">
              <iframe
                src={CITYRIDER_URL + '/cari/rider?pLat=-7.7928&pLng=110.3657&pName=Malioboro&dLat=-7.7700&dLng=110.3782&dName=UGM'}
                title="City Rider — daftar driver"
                loading="lazy"
              />
            </div>
            <div className="cr-demo__actions">
              <button onClick={() => openLiveApp('/')} className="cr-btn cr-btn--primary cr-btn--lg">
                {t.demo.ctaFull}
              </button>
              <button onClick={() => openLiveApp('/dashboard')} className="cr-btn cr-btn--ghost cr-btn--lg">
                {t.demo.ctaDashboard}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="cr-section cr-section--alt">
        <div className="cr-container">
          <SectionHead kicker={t.testi.kicker} title={t.testi.title} />
          <div className="cr-testi-grid">
            {t.testi.items.map((ti, i) => (
              <div key={i} className="cr-testi">
                <div className="cr-testi__quote">&ldquo;{ti.quote}&rdquo;</div>
                <div className="cr-testi__meta">
                  <div className="cr-testi__avatar">{ti.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
                  <div>
                    <div className="cr-testi__name">{ti.name}</div>
                    <div className="cr-testi__sub">{ti.area} · {ti.bike}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="cr-section" id="faq">
        <div className="cr-container cr-container--narrow">
          <SectionHead kicker={t.faq.kicker} title={t.faq.title} />
          <div className="cr-faq">
            {t.faq.items.map(([q, a], i) => (
              <details key={i} className="cr-faq__item" open={openFaq === i} onToggle={(e) => {
                if ((e.currentTarget).open) setOpenFaq(i)
              }}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="cr-cta">
        <div className="cr-container">
          <div className="cr-cta__inner">
            <span className="cr-emoji-big">🛵</span>
            <h2 className="cr-h2">{t.cta.title}</h2>
            <p className="cr-muted cr-cta__sub">{t.cta.sub}</p>
            <div className="cr-cta__btns">
              <button onClick={() => openLiveApp('/signup')} className="cr-btn cr-btn--primary cr-btn--xl">
                {t.cta.primary}
              </button>
              <button onClick={() => openLiveApp('/')} className="cr-btn cr-btn--ghost cr-btn--xl">
                {t.cta.ghost}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="cr-foot">
        <div className="cr-container cr-foot__inner">
          <div>
            <a href="/" className="cr-brand">
              <span className="cr-brand__icon">🛵</span>
              <span>City <span className="cr-grad">Rider</span></span>
            </a>
            <div className="cr-foot__tag">{t.footer.tag}</div>
          </div>
          <div className="cr-foot__links">
            <a href="/">{t.footer.links.home}</a>
            <a href="/donut">{t.footer.links.donut}</a>
            <a href="/affiliate">{t.footer.links.affiliate}</a>
            <a href="/faq">{t.footer.links.faq}</a>
            <a href="/contact">{t.footer.links.contact}</a>
          </div>
        </div>
        <div className="cr-foot__legal">
          © {new Date().getFullYear()} {t.footer.legal}
        </div>
      </footer>
    </div>
  )
}

function SectionHead({ kicker, title }) {
  return (
    <div className="cr-section-head">
      <span className="cr-kicker">{kicker}</span>
      <h2 className="cr-h2">{title}</h2>
    </div>
  )
}

function PageStyles() {
  return (
    <style>{`
      .cr-page {
        position: relative;
        background: #0A0A0A; color: #FFFFFF;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased; line-height: 1.55;
      }
      .cr-page * { box-sizing: border-box; }

      /* Live map background — fixed behind everything. Overlay above for
         text legibility. Only the hero section reveals the map at full
         strength; lower sections sit on near-opaque section backgrounds
         so the map fades into the brand. */
      .cr-page-bg {
        position: fixed; inset: 0; z-index: 0;
        overflow: hidden; pointer-events: none;
      }
      .cr-page-bg__overlay {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse 80% 60% at 50% 35%, rgba(250,204,21,0.06) 0%, transparent 60%),
          linear-gradient(180deg, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0.62) 30%, rgba(10,10,10,0.78) 100%);
      }
      /* Content sits above the background. */
      .cr-nav, .cr-hero, .cr-stats, .cr-section, .cr-cta, .cr-foot {
        position: relative; z-index: 1;
      }

      .cr-container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
      .cr-container--narrow { max-width: 820px; }

      .cr-grad {
        background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%);
        -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
      }
      .cr-muted { color: rgba(255,255,255,0.6); font-size: 15px; line-height: 1.7; }

      /* ── NAV ── */
      .cr-nav {
        position: sticky; top: 0; z-index: 50;
        background: rgba(10,10,10,0.7); backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border-bottom: 1px solid rgba(255,255,255,0.04);
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      .cr-nav--scrolled { background: rgba(10,10,10,0.92); border-bottom-color: rgba(255,255,255,0.08); }
      .cr-nav__inner {
        max-width: 1180px; margin: 0 auto; padding: 0 24px;
        height: 64px; display: flex; align-items: center; justify-content: space-between;
      }
      .cr-brand {
        display: inline-flex; align-items: center; gap: 8px;
        text-decoration: none; color: #fff; font-weight: 900; font-size: 17px; letter-spacing: -0.01em;
      }
      .cr-brand__icon {
        width: 30px; height: 30px; border-radius: 9px;
        background: linear-gradient(135deg, #FACC15, #EAB308); color: #0A0A0A;
        display: inline-flex; align-items: center; justify-content: center; font-size: 17px;
        box-shadow: 0 0 16px rgba(250,204,21,0.35);
      }
      .cr-nav__links { display: flex; align-items: center; gap: 6px; }
      .cr-nav__links a {
        color: rgba(255,255,255,0.65); text-decoration: none;
        font-size: 14px; font-weight: 700; padding: 8px 12px; border-radius: 8px;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .cr-nav__links a:hover { color: #FFF; background: rgba(255,255,255,0.05); }
      @media (max-width: 640px) {
        .cr-nav__links a { display: none; }
      }
      /* Language toggle */
      .cr-langtog {
        display: inline-flex; padding: 3px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 9999px;
      }
      .cr-langtog__btn {
        background: transparent; border: none; cursor: pointer;
        font-family: inherit; font-size: 12px; font-weight: 800; letter-spacing: 0.04em;
        color: rgba(255,255,255,0.55);
        padding: 5px 12px; border-radius: 9999px;
        transition: background 0.15s ease, color 0.15s ease;
        min-height: 28px;
      }
      .cr-langtog__btn:hover { color: #fff; }
      .cr-langtog__btn--on {
        background: linear-gradient(135deg, #FACC15, #EAB308); color: #0A0A0A;
      }

      /* ── BUTTONS ── */
      .cr-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        font-family: inherit; font-weight: 800;
        border-radius: 12px; cursor: pointer; border: none;
        transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.15s ease;
        text-decoration: none; white-space: nowrap;
      }
      .cr-btn--primary {
        background: linear-gradient(135deg, #FACC15, #EAB308); color: #0A0A0A;
        box-shadow: 0 8px 22px rgba(250,204,21,0.22);
      }
      .cr-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(250,204,21,0.36); }
      .cr-btn--ghost {
        background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.12);
      }
      .cr-btn--ghost:hover { border-color: rgba(250,204,21,0.4); background: rgba(255,255,255,0.06); }
      .cr-btn--sm  { padding: 8px 14px; font-size: 13px; min-height: 36px; }
      .cr-btn--lg  { padding: 14px 22px; font-size: 15px; min-height: 48px; }
      .cr-btn--xl  { padding: 18px 30px; font-size: 17px; min-height: 56px; }

      /* ── KICKER + HEADINGS ── */
      .cr-kicker {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
        color: #FACC15; background: rgba(250,204,21,0.10);
        border: 1px solid rgba(250,204,21,0.22);
        padding: 6px 12px; border-radius: 9999px;
      }
      .cr-kicker--inline { background: transparent; border: none; padding: 0; }
      .cr-h2 {
        font-size: clamp(28px, 4.2vw, 40px); font-weight: 900; line-height: 1.1;
        letter-spacing: -0.01em; margin: 14px 0 0;
      }
      .cr-h3 { font-size: clamp(22px, 3vw, 28px); font-weight: 900; line-height: 1.15; margin: 12px 0 12px; }
      .cr-dot { width: 8px; height: 8px; border-radius: 50%; background: #FACC15; }

      /* ── HERO ──
         Mobile-first: text left, phone right, side-by-side from the
         smallest screens. */
      .cr-hero {
        position: relative; padding: 24px 0 56px; overflow: hidden;
      }
      .cr-hero__bg {
        position: absolute; inset: 0; pointer-events: none; z-index: 0;
        background:
          radial-gradient(ellipse 60% 50% at 20% 20%, rgba(250,204,21,0.10), transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 80%, rgba(250,204,21,0.06), transparent 60%);
      }
      .cr-hero__inner {
        position: relative; z-index: 1;
        max-width: 1180px; margin: 0 auto; padding: 0 20px;
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
        gap: 18px; align-items: start;
      }
      .cr-hero__left  { min-width: 0; padding-top: 4px; }
      .cr-hero__right { display: flex; justify-content: center; min-width: 0; }
      .cr-h1 {
        font-size: 28px; line-height: 1.05; letter-spacing: -0.02em;
        font-weight: 900; margin: 4px 0 0;
      }
      .cr-hero__lede {
        font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.65);
        max-width: 540px; margin: 12px 0 0;
      }
      .cr-hero__cta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      .cr-hero__pill {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.7);
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
        padding: 6px 12px; border-radius: 9999px;
        margin-top: 12px;
      }
      /* PHONE FRAME — sized to wrap a 390px iframe scaled down. */
      .cr-phone {
        position: relative;
        width: 158px; height: 332px;
        background: #1A1A1A; border-radius: 28px;
        border: 2px solid rgba(255,255,255,0.08);
        padding: 6px; overflow: hidden;
        box-shadow: 0 22px 46px rgba(0,0,0,0.45), 0 0 0 1px rgba(250,204,21,0.06);
      }
      .cr-phone__notch {
        position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
        width: 60px; height: 16px; background: #0A0A0A; border-radius: 12px; z-index: 2;
      }
      .cr-phone__screen {
        position: absolute; inset: 6px; border-radius: 22px; overflow: hidden;
        background: #0A0A0A;
      }
      /* Iframe renders at real mobile viewport (390×800) and is scaled down
         to fit the phone frame. This way the inner app sees a true mobile
         width and its responsive breakpoints fire correctly. */
      .cr-phone__frame {
        width: 390px; height: 800px;
        border: 0; display: block;
        transform-origin: top left;
        transform: scale(0.374);
        background: #0A0A0A;
      }
      /* ≥480px: phone scales up modestly */
      @media (min-width: 480px) {
        .cr-h1        { font-size: 34px; }
        .cr-hero__lede{ font-size: 14px; }
        .cr-phone     { width: 184px; height: 388px; border-radius: 30px; }
        .cr-phone__frame { transform: scale(0.441); }
      }
      /* ≥768px tablet */
      @media (min-width: 768px) {
        .cr-hero { padding: 36px 0 80px; }
        .cr-hero__inner { gap: 40px; padding: 0 24px; }
        .cr-h1 { font-size: clamp(38px, 5vw, 52px); }
        .cr-hero__lede { font-size: 16px; line-height: 1.7; }
        .cr-hero__cta { gap: 12px; margin-top: 24px; }
        .cr-hero__pill { font-size: 13px; padding: 8px 14px; margin-top: 18px; }
        .cr-phone { width: 210px; height: 442px; border-radius: 32px; padding: 7px; }
        .cr-phone__notch { width: 76px; height: 18px; top: 13px; }
        .cr-phone__screen { inset: 7px; border-radius: 25px; }
        .cr-phone__frame { transform: scale(0.502); }
      }
      /* ≥1024px desktop */
      @media (min-width: 1024px) {
        .cr-hero__inner { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 56px; }
        .cr-h1 { font-size: 60px; line-height: 1.05; }
        .cr-phone { width: 256px; height: 540px; border-radius: 38px; padding: 8px; }
        .cr-phone__notch { width: 88px; height: 20px; top: 15px; }
        .cr-phone__screen { inset: 8px; border-radius: 30px; }
        .cr-phone__frame { transform: scale(0.616); }
      }

      /* ── STATS ── */
      .cr-stats {
        padding: 36px 0; border-top: 1px solid rgba(255,255,255,0.05);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        background: rgba(10,10,10,0.85); backdrop-filter: blur(8px);
      }
      .cr-stats__grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;
      }
      .cr-stat__icon  { font-size: 30px; line-height: 1; margin-bottom: 10px; }
      .cr-stat__img {
        width: 96px; height: 96px;
        object-fit: contain;
        margin: 0 auto 14px;
        display: block;
        filter: drop-shadow(0 6px 16px rgba(250,204,21,0.18));
        transition: transform 0.25s ease;
      }
      .cr-stat:hover .cr-stat__img { transform: translateY(-3px) scale(1.04); }
      @media (min-width: 640px) {
        .cr-stat__img { width: 120px; height: 120px; }
      }
      .cr-stat__value { font-size: clamp(18px, 2.4vw, 22px); font-weight: 900; line-height: 1.2; }
      .cr-stat__label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.55); margin-top: 8px; line-height: 1.5; }

      /* ── SECTION ── */
      .cr-section { padding: 72px 0; background: rgba(10,10,10,0.88); backdrop-filter: blur(8px); }
      .cr-section--alt { background: rgba(10,10,10,0.92); border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); backdrop-filter: blur(8px); }
      .cr-section-head { text-align: center; margin-bottom: 44px; }
      .cr-section-head .cr-h2 { margin-top: 14px; }

      /* ── SPLIT ── */
      .cr-split {
        display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
      }
      .cr-split__col {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 22px; padding: 32px;
      }
      .cr-checklist { list-style: none; padding: 0; margin: 18px 0 0; }
      .cr-checklist li {
        position: relative; padding: 6px 0 6px 30px;
        font-size: 15px; color: rgba(255,255,255,0.78);
      }
      .cr-checklist li::before {
        content: '✓'; position: absolute; left: 0; top: 4px;
        color: #FACC15; font-weight: 900;
        background: rgba(250,204,21,0.10); border-radius: 50%;
        width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
        font-size: 13px;
      }
      @media (max-width: 768px) {
        .cr-split { grid-template-columns: 1fr; }
      }

      /* ── STEPS ── */
      .cr-steps {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;
      }
      .cr-step {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 22px;
        transition: border-color 0.2s ease, transform 0.2s ease;
      }
      .cr-step:hover { border-color: rgba(250,204,21,0.3); transform: translateY(-2px); }
      .cr-step__num { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .cr-step__icon {
        width: 44px; height: 44px; border-radius: 14px;
        background: linear-gradient(135deg, rgba(250,204,21,0.15), rgba(250,204,21,0.04));
        display: inline-flex; align-items: center; justify-content: center; font-size: 22px;
      }
      .cr-step__time { font-size: 13px; font-weight: 800; color: #FACC15; }
      .cr-step__title { font-size: 17px; font-weight: 900; margin-bottom: 6px; }
      .cr-step__desc { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
      @media (max-width: 860px) {
        .cr-steps { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 480px) {
        .cr-steps { grid-template-columns: 1fr; }
      }

      /* ── COMPARISON ── */
      .cr-compare {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px;
        overflow: hidden;
      }
      .cr-compare__head {
        display: grid; grid-template-columns: 1.4fr 1fr 1fr;
        padding: 16px 22px; gap: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.02);
      }
      .cr-compare__col-head {
        font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; text-align: center;
      }
      .cr-compare__col-head--them { color: rgba(255,255,255,0.5); }
      .cr-compare__col-head--us { color: #FACC15; }
      .cr-compare__row {
        display: grid; grid-template-columns: 1.4fr 1fr 1fr;
        padding: 14px 22px; gap: 16px; align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .cr-compare__row:last-child { border-bottom: none; }
      .cr-compare__feat { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.85); }
      .cr-compare__cell {
        display: flex; align-items: center; gap: 8px;
        font-size: 14px;
        padding: 8px 12px; border-radius: 10px;
      }
      .cr-compare__cell--them { color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.02); }
      .cr-compare__cell--us { color: #FFFFFF; background: rgba(250,204,21,0.08); }
      .cr-cell-x { color: rgba(255,255,255,0.4); font-weight: 900; flex-shrink: 0; }
      .cr-cell-check { color: #22C55E; font-weight: 900; flex-shrink: 0; }
      @media (max-width: 720px) {
        .cr-compare__head, .cr-compare__row { grid-template-columns: 1fr; padding: 16px; gap: 8px; }
        .cr-compare__col-head { text-align: left; }
        .cr-compare__feat { font-weight: 900; color: #FACC15; margin-bottom: 4px; }
      }

      /* ── FEATURES ── */
      .cr-features {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
      }
      .cr-feat {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px;
        transition: border-color 0.2s ease, transform 0.2s ease;
      }
      .cr-feat:hover { border-color: rgba(250,204,21,0.3); transform: translateY(-2px); }
      .cr-feat__icon {
        width: 38px; height: 38px; border-radius: 12px;
        background: linear-gradient(135deg, rgba(250,204,21,0.18), rgba(250,204,21,0.05));
        display: inline-flex; align-items: center; justify-content: center; font-size: 19px;
        margin-bottom: 12px;
      }
      .cr-feat__title { font-size: 15px; font-weight: 900; margin-bottom: 6px; line-height: 1.25; }
      .cr-feat__desc { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.55; }
      @media (max-width: 1024px) { .cr-features { grid-template-columns: repeat(3, 1fr); } }
      @media (max-width: 720px)  { .cr-features { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 460px)  { .cr-features { grid-template-columns: 1fr; } }

      /* ── PRICING ── */
      .cr-price { display: flex; justify-content: center; }
      .cr-price__card {
        position: relative;
        width: 100%; max-width: 480px;
        background: rgba(255,255,255,0.025);
        border: 2px solid rgba(250,204,21,0.32);
        border-radius: 26px; padding: 36px 32px 30px;
        box-shadow: 0 24px 60px rgba(250,204,21,0.10);
      }
      .cr-price__ribbon {
        position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #FACC15, #EAB308); color: #0A0A0A;
        padding: 5px 14px; border-radius: 9999px;
        font-size: 13px; font-weight: 900;
        box-shadow: 0 8px 20px rgba(250,204,21,0.35);
      }
      .cr-price__name { font-size: 15px; font-weight: 900; color: rgba(255,255,255,0.85); margin-bottom: 8px; }
      .cr-price__amount { display: flex; align-items: baseline; gap: 6px; }
      .cr-price__num { font-size: 46px; font-weight: 900; line-height: 1; }
      .cr-price__period { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.55); }
      .cr-price__sub { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.55); margin-top: 6px; }
      .cr-price__list { list-style: none; padding: 0; margin: 22px 0; }
      .cr-price__list li {
        position: relative; padding: 7px 0 7px 30px;
        font-size: 14px; color: rgba(255,255,255,0.85);
      }
      .cr-price__list li::before {
        content: '✓'; position: absolute; left: 0; top: 9px;
        color: #FACC15; font-weight: 900; font-size: 14px;
      }
      .cr-price__cta { width: 100%; }
      .cr-price__note {
        font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 14px; text-align: center;
      }

      /* ── DEMO ── */
      .cr-demo {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 22px;
        padding: 24px; max-width: 980px; margin: 0 auto;
      }
      .cr-demo__frame {
        aspect-ratio: 16/9; max-height: 560px;
        border-radius: 14px; overflow: hidden;
        background: #0A0A0A; border: 1px solid rgba(255,255,255,0.06);
      }
      .cr-demo__frame iframe { width: 100%; height: 100%; border: 0; display: block; }
      .cr-demo__actions {
        display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 22px;
      }
      @media (max-width: 720px) {
        .cr-demo__frame { aspect-ratio: 9/16; max-height: 700px; }
      }

      /* ── TESTIMONIALS ── */
      .cr-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
      .cr-testi {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 24px;
      }
      .cr-testi__quote { font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.85); margin-bottom: 18px; }
      .cr-testi__meta { display: flex; align-items: center; gap: 12px; }
      .cr-testi__avatar {
        width: 42px; height: 42px; border-radius: 14px;
        background: linear-gradient(135deg, rgba(250,204,21,0.25), rgba(250,204,21,0.08));
        border: 1px solid rgba(250,204,21,0.3);
        display: flex; align-items: center; justify-content: center;
        color: #FACC15; font-weight: 900; font-size: 14px;
      }
      .cr-testi__name { font-size: 14px; font-weight: 900; }
      .cr-testi__sub { font-size: 13px; color: rgba(255,255,255,0.5); }
      @media (max-width: 860px) { .cr-testi-grid { grid-template-columns: 1fr; } }

      /* ── FAQ ── */
      .cr-faq { display: flex; flex-direction: column; gap: 8px; }
      .cr-faq__item {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 0;
        overflow: hidden;
      }
      .cr-faq__item summary {
        cursor: pointer; list-style: none;
        padding: 18px 22px;
        font-size: 15px; font-weight: 800;
        display: flex; justify-content: space-between; align-items: center; gap: 12px;
      }
      .cr-faq__item summary::-webkit-details-marker { display: none; }
      .cr-faq__item summary::after {
        content: '+'; color: #FACC15; font-size: 22px; font-weight: 700; transition: transform 0.2s ease;
      }
      .cr-faq__item[open] summary::after { content: '−'; }
      .cr-faq__item p {
        padding: 0 22px 22px; margin: 0;
        font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.7);
      }

      /* ── CTA ── */
      .cr-cta {
        padding: 100px 0; position: relative; overflow: hidden;
        background:
          radial-gradient(ellipse 80% 60% at 50% 50%, rgba(250,204,21,0.10), transparent 60%),
          rgba(10,10,10,0.78);
        backdrop-filter: blur(8px);
      }
      .cr-cta__inner { text-align: center; max-width: 680px; margin: 0 auto; }
      .cr-emoji-big { font-size: 60px; display: inline-block; margin-bottom: 14px; }
      .cr-cta__sub { font-size: 16px; margin: 14px auto 28px; max-width: 540px; }
      .cr-cta__btns { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }

      /* ── FOOTER ── */
      .cr-foot {
        background: #050505;
        border-top: 1px solid rgba(255,255,255,0.05);
        padding: 40px 0 24px;
      }
      .cr-foot__inner {
        display: flex; flex-wrap: wrap; gap: 24px;
        justify-content: space-between; align-items: flex-start;
      }
      .cr-foot__tag { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 8px; }
      .cr-foot__links {
        display: flex; flex-wrap: wrap; gap: 18px;
      }
      .cr-foot__links a {
        font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.55); text-decoration: none;
        transition: color 0.15s ease;
      }
      .cr-foot__links a:hover { color: #FACC15; }
      .cr-foot__legal {
        max-width: 1180px; margin: 24px auto 0; padding: 16px 24px 0;
        border-top: 1px solid rgba(255,255,255,0.04);
        font-size: 13px; color: rgba(255,255,255,0.35);
      }
    `}</style>
  )
}
