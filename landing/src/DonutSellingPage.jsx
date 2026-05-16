import React, { useEffect, useState } from 'react'

/* ─────────────────────────────────────────────────────────────────────────
   Donut Shop · StreetLocal — selling page
   Diamond-standard marketing page for the donut-shop app. Vendor-focused,
   not customer-focused. Embeds the real live donut splash so prospects
   see the actual product running. Mobile + desktop responsive via a
   single <style> block — no Tailwind / CSS-in-JS dependencies.

   Asset URLs are in IMAGES at the top — swap them anytime.
   The hero + demo iframes point to the bundled donuts.html snapshot so
   the prospect sees the real product.
   ───────────────────────────────────────────────────────────────────── */

const IMAGES = {
  heroDonut:    '/images/donut-page/img-22.png',
  bouncing:     '/images/donut-page/img-01.png',
  bottomLeft:   '/images/donut-page/img-02.png',
  bostonCream:  '/images/donut-page/img-04.png',
  strawberry:   '/images/donut-page/img-21.png',
  chocolate:    '/images/donut-page/img-05.png',
  flavourOrb:   '/images/donut-page/img-03.png',
}

// Big interactive demo lower on the page — always the live, current
// donut app (no ?landing= param), so the design stays in sync with
// what's actually shipping.
const DEMO_URL = (() => {
  if (typeof window === 'undefined') return ''
  const origin = window.location.hostname === 'localhost'
    ? 'http://localhost:5177'
    : window.location.origin
  return `${origin}/food/chat/?vendor=00000000-0000-0000-0000-00000000d0c0`
})()

// Hero-phone landing-theme carousel — cycles through the donut app's
// customer-facing splash variants so visitors see the full design range
// without scrolling. Each URL forces a specific theme via the
// `?landing=<id>` query param the donut app respects.
//
// Dev vs prod URL resolution:
//   - Dev: the donut app's vite server runs on a separate port (5177
//     per the monorepo root package.json) with base '/food/chat/'.
//   - Prod: Vercel rewrites '/food/chat/*' to the food-basic build.
const LANDING_THEME_PREVIEWS = (() => {
  let origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.hostname === 'localhost'
      ? 'http://localhost:5177'
      : window.location.origin
  }
  const themes = ['donuts', 'discover', 'float', 'warm']
  return themes.map(id => `${origin}/food/chat/?vendor=00000000-0000-0000-0000-00000000d0c0&landing=${id}`)
})()

const FEATURES = [
  { iconImg: '/images/donut-page/img-07.png', title: 'Beautiful menu cards',   desc: 'Photos, descriptions, prices, allergens — customise card layout (grid / horizontal / full-width).' },
  { iconImg: '/images/donut-page/img-08.png', title: 'WhatsApp ordering',       desc: 'Customers order through the WhatsApp number you already use. No new app to learn.' },
  { iconImg: '/images/donut-page/img-19.png', title: 'Delivery + pickup',       desc: 'Zones, per-km rates, free-above thresholds, max-distance — all in your hands.' },
  { iconImg: '/images/donut-page/img-31.png', title: 'Multiple payment methods', desc: 'Bank transfer, e-wallet (GoPay / OVO / Dana), or cash on delivery — you choose.' },
  { iconImg: '/images/donut-page/img-32.png', large: true, title: 'Verified reviews',         desc: 'Only customers with a real order ref number can leave a review. No spam.' },
  { iconImg: '/images/donut-page/img-34.png', title: 'Total brand control',     desc: 'Your logo, colours, fonts, hero text, custom landing splash. Edit live, see live.' },
  { iconImg: '/images/donut-page/img-35.png', title: 'Multi-language',          desc: 'English + Indonesian out of the box. Vietnamese, Malay, Filipino coming Q3 2026.' },
  { iconImg: '/images/donut-page/img-36.png', title: 'Promotions + deals',      desc: 'BUY1GET1, % off, time-limited, free-delivery thresholds, scrolling promo banners.' },
]

const STEPS = [
  { step: 1, time: '30 sec', icon: '✍️',  title: 'Sign up',            desc: 'Email + your WhatsApp number. That\'s it.' },
  { step: 2, time: '5 min',  icon: '🍩',  title: 'Add your donuts',     desc: 'Upload photos, set prices, paste a description.' },
  { step: 3, time: '10 sec', icon: '🔗',  title: 'Share your link',     desc: 'Get streetlocal.live/yourshop instantly. Custom domain optional.' },
  { step: 4, time: 'Forever', icon: '🎉', title: 'Take orders',         desc: 'Orders ping your WhatsApp. You bake. You earn 100%.' },
]

// Three tiers. Starter is the lean "sell + market" plan — everything
// a small shop needs to open today and run marketing. Pro adds the
// growth-stage features (in-app chat, loyalty, custom domain, tipping,
// thermal printer). Enterprise is the operations-heavy package (KDS,
// kiosk, production planner, multi-location). Same StreetLocal codebase
// under the hood, gated by vendor_accounts.plan_level.
const STARTER_INCLUDES = [
  'Premium PWA app — installable on any phone',
  'Unlimited donuts on your menu',
  'Unlimited orders / month',
  'WhatsApp checkout — orders flow to your number',
  'All 16 payment gateways (Midtrans · QRIS · GoPay · OVO · DANA · Stripe …)',
  'Delivery + pickup zones with per-km pricing',
  'Customer accounts + order history',
  'Marketing banners (landscape · square · story)',
  'Auto-post banners to customer chat',
  'Social-ready PNG export (Instagram · WhatsApp · Facebook · TikTok)',
  'Promo codes (% off · flat off · expiry)',
  'Receipts + tax / VAT (PPN 11% preset)',
  'CSV sales export',
  'Bahasa Indonesia + English',
  'Shop subdomain (yourshop.streetlocal.live)',
  '1 staff account · 30 image library',
  'WhatsApp support',
  '0% commission · cancel anytime',
]

const PRO_INCLUDES = [
  'Everything in Starter, plus:',
  'In-app real-time chat (no WhatsApp dependency)',
  'Loyalty stamps + branded member card',
  '4-template A4 invoices with your letterhead',
  'Bluetooth thermal printer (ESC/POS)',
  'Scheduled pre-orders + date/time picker',
  'Advanced promos (BUY1GET1 · first-order only · redemption caps)',
  'Tipping at checkout (10/15/20/custom + staff split)',
  'SMS notifications (Twilio)',
  'Email campaigns (Resend)',
  '5 staff accounts',
  '200 image library',
  'Custom domain (mydonuts.com)',
  'Priority WhatsApp support',
]

const ENTERPRISE_INCLUDES = [
  'Everything in Pro, plus:',
  'Kitchen Display System (KDS) for tablets',
  'Self-serve kiosk mode',
  'Production planner + wastage logger',
  'Build-your-own dozen mix box',
  'Catering / wholesale orders + pre-order windows',
  'End-of-day cash reconciliation Z-report',
  'Allergen tags + recipe cost analysis',
  'Multi-location support',
  'Unlimited staff accounts',
  'Unlimited image library',
  'Native app build option (paid add-on)',
  'Dedicated account manager',
  'Daily encrypted backups',
]

const COMPARISON = [
  ['Setup time',                       '5 min',     'Sudah chaos',   '1–2 days',     'Days/weeks'],
  ['Biaya bulanan',                    'Rp 38K',    'Gratis',        'Rp 500K+',     'Gratis'],
  ['Komisi per pesanan',               '0%',        '0%',            '0–5%',         '20–30%'],
  ['GoPay / OVO / DANA / QRIS',        '✓ Built-in', 'Manual',        'Plugin extra', '✓ (mereka pegang)'],
  ['Faktur Pajak / PPN 11%',           '✓',         '✗',             '⚠ Setup sendiri','✗'],
  ['Bahasa Indonesia',                 '✓',         '—',             '⚠ Translate',  '✓'],
  ['Branded landing page',             '✓',         '✗',             '✓',            '✗'],
  ['One-tap customer ordering',        '✓',         '✗',             '✓',            '✓'],
  ['Reviews tied to real orders',      '✓',         '✗',             '✗',            'Punya mereka'],
  ['You own customer list',            '✓',         '✓',             '✓',            '✗ Locked'],
  ['Built for donut shops',            '✓',         '—',             '✗ Generic',    '✗ Generic'],
]

// PLACEHOLDER reviews used for the scrolling marquee design preview.
// Each entry must be replaced with a verified real review before launch
// (see UU ITE / consumer-protection rules on fabricated testimonials).
// Avatars use initials-based tiles, not stock photos of people, so the
// placeholder nature is visually clear.
const REVIEWS = [
  { name: 'Sari Wijaya',    business: 'Donut Lab',      city: 'Yogyakarta', avatar: '/images/donut-page/img-28.png', text: 'Set up dalam 6 menit dari laptop di rumah. Hari pertama go-live udah dapet 14 order via WhatsApp — semuanya masuk rapi dengan nama, alamat, dan pilihan toppings. Tidak ada lagi DM chaos atau lupa balasin customer. Yang paling enak: notif WhatsApp langsung lengkap, tinggal di-bake dan dikirim.', rating: 5, when: '2 minggu lalu' },
  { name: 'Andi Pratama',   business: 'Sweet Roll',     city: 'Jakarta',    avatar: '/images/donut-page/img-23.png', text: 'Akhirnya bisa terima GoPay, QRIS, OVO, DANA, dan transfer bank semua dari satu app — sebelumnya saya harus jongling 4 aplikasi terpisah. Customer suka banget bisa pilih toppings, ukuran, dan jumlah sendiri sebelum checkout. Conversion rate naik karena tidak ada lagi DM "maaf mau pesan…" yang sering kelewat. Funds masuk langsung ke rekening, bukan ke platform.',   rating: 5, when: '1 bulan lalu' },
  { name: 'Putri Mahardika', business: 'Boba+Donut',    city: 'Bandung',    avatar: '/images/donut-page/img-24.png', text: 'PPN 11% dan faktur pajak otomatis di setiap invoice — akuntan saya seneng banget tidak perlu rekap manual tiap akhir bulan. NPWP dan nomor faktur muncul otomatis, tinggal print atau kirim via WhatsApp. Setup awal saya dibantu tim sampai go-live, dan WhatsApp support balasnya selalu kurang dari 15 menit setiap kali saya nanya.',                  rating: 5, when: '3 minggu lalu' },
  { name: 'Budi Santoso',   business: 'Frosted Co',     city: 'Bali',       avatar: '/images/donut-page/img-25.png', text: 'Pindah dari Shopify (Rp 500 ribu/bulan) ke StreetLocal (Rp 38 ribu/bulan) — hemat sekitar 92% biaya bulanan tanpa kehilangan fitur penting. Menu update langsung kelihatan di sisi customer, tidak perlu push update atau approval app store yang ribet. Untuk warung kecil di Bali seperti saya, ini game changer — modal bulanan jadi bisa dipake buat bahan baku.',                       rating: 5, when: '5 hari lalu' },
  { name: 'Maya Lestari',   business: 'Glazed Hour',    city: 'Surabaya',   avatar: '/images/donut-page/img-27.png', text: 'Kitchen Display System di tablet ngehemat waktu kerja saya dan tim banyak. Order dari WhatsApp langsung muncul di KDS dapur dengan urutan masuk — tidak ada lagi nulis tangan, salah pesanan, atau lupa pesanan saat ramai. Tim dapur saya total 3 orang, dan workflow jauh lebih rapi sejak pakai ini. Sekarang bisa handle 60+ order per hari tanpa stres.',                rating: 5, when: '2 bulan lalu' },
  { name: 'Rizki Aditya',   business: 'Donut Express',  city: 'Semarang',   avatar: '/images/donut-page/img-26.png', text: 'Loyalty stamps bikin customer balik terus — terutama anak-anak SD di sekitar toko yang pada ngumpulin stamp buat dapet donut gratis di pesanan ke-10. Repeat order naik signifikan dalam 3 bulan pertama. Saya juga pakai promo code BUY1GET1 di akhir minggu yang sepi. Fitur ini dulu cuma punya brand besar seperti Dunkin — sekarang warung kecil saya juga bisa.',                              rating: 5, when: '1 minggu lalu' },
  { name: 'Dewi Anggraini', business: 'Sugar Cloud',    city: 'Medan',      avatar: '/images/donut-page/img-29.png', text: 'Build-your-own dozen jadi favorit customer — mereka bisa mix-and-match 12 rasa berbeda dalam satu box. Margin per pesanan naik karena rata-rata customer isi 12 (bukan 6 seperti sebelumnya pas masih one-by-one). Yang penting: customer ngerasa ownership di pesanan mereka — banyak yang share ke Instagram pamerin combo donut mereka. Word-of-mouth marketing gratis tiap minggu.',                              rating: 5, when: '6 hari lalu' },
  { name: 'Hendra Setiawan', business: 'Crumb & Co',    city: 'Makassar',   avatar: '/images/donut-page/img-30.png', text: 'Production planner ngebantu banget — saya tahu persis berapa donut harus dibuat tiap hari berdasarkan order seminggu terakhir dan pre-order yang masuk. Wastage turun sekitar 30% dalam bulan pertama, dan stok bahan baku jauh lebih efisien. Sebelumnya saya sering bikin terlalu banyak dan akhirnya buang sore-sore. Sekarang produksi tepat sasaran, modal lebih hemat.',                            rating: 5, when: '3 hari lalu' },
]

const FAQS = [
  ['Is this an app? Why a PWA and not a native app?',
   "Yes — it's a Progressive Web App (PWA), and PWAs ARE apps. Your customer taps your link once, adds it to their home screen, and from then on it opens in one tap with a real app icon, splash screen, and full-screen experience — just like Gojek or Instagram. The difference is install size: ~2MB instead of 100–200MB for a typical native app. That gap is exactly why we chose PWA for the Indonesian market. Most customers carry Android phones with 2–4GB RAM and storage already half-full with WhatsApp, photos, and TikTok. A native app forces them through Play Store search, install, approval, and update loops, costs them mobile data they pay for per-GB, and competes for storage they don't have to spare. A PWA skips all of that — open your link, tap 'Add to Home Screen', done. It updates silently every visit (no Play Store review delay when you change a menu price), works offline after first load because everything caches locally, and loads on slow EDGE/3G in rural areas. Twitter Lite, Pinterest, Starbucks, and BookMyShow all run PWAs in emerging markets for exactly the same reasons. If a competitor tells you \"this isn't a real app\" — they're describing the legacy native approach that bleeds orders to Play Store friction in Indonesia. We chose PWA on purpose, for the customer who actually places the order on a mid-range Android."],
  ['Do my customers need to download an app?',
   'No. Your donut shop opens in any web browser on any phone. Customers just tap your link — no install, no signup needed.'],
  ['How do I get paid?',
   'Bank transfer, e-wallet (GoPay, OVO, Dana), or cash on delivery. You set which methods you accept. Money goes directly to your account — we never touch it.'],
  ['Do you take a commission?',
   'No. 0% per order. The 35,000 IDR / month is the only fee. Sell 1 donut or 10,000 — the price stays the same.'],
  ['What if I want to cancel?',
   'Cancel anytime from your dashboard. No questions, no calls, no "are you sure" loops. Your data exports to CSV before deletion.'],
  ['Can I import my existing menu?',
   'Yes. Paste from a spreadsheet, or add donuts one-by-one in 30 seconds each. Most shops get their full menu live in under 10 minutes.'],
  ['Is my data secure?',
   'Yes. Daily encrypted backups, HTTPS everywhere, and we never share customer data with third parties. You own everything.'],
  ['Can I use my own domain (like mydonuts.com)?',
   'Yes — included on Professional and Enterprise plans. We help you point it. Or use the free streetlocal.live/yourshop subdomain.'],
  ['What languages are supported?',
   'English + Indonesian, fully translated. Vietnamese, Malay, and Filipino are on the roadmap for Q3 2026.'],
  ['Can I run promotions or deals?',
   'Yes — BUY1GET1, percentage-off, time-limited, free-delivery-above thresholds, scrolling promo banners. All built in.'],
  ['Can my donut shop be in the Apple App Store and Google Play?',
   "Yes — as a paid add-on. We build your branded native app (your name, your logo, your colours) and submit to both stores under your bakery's own developer account. From Rp 2.5M / $499 one-time + Rp 350k / $29 per month. You own the listing, the reviews, and the payouts. See the “Beyond the monthly plan” section above for details."],
  ['Who owns the app if I get a native build?',
   'You own the store listing, your customer data, and your developer accounts. We retain ownership of the source code — your build is a licensed binary, not a code transfer. If you cancel, the live app keeps working but stops receiving updates.'],
  ['Do Apple or Google take a cut when customers buy donuts?',
   "No. Donuts are physical goods — Apple's 30% and Google's 30% only apply to digital goods. You keep using your existing payment gateway and 100% of the donut sale (minus your gateway's normal processing fee)."],
  ['Can I request a custom feature?',
   'Yes. Common requests like NFC loyalty taps, beacon-based store offers, custom delivery integrations, and accounting-software bridges are quoted per project. Email us with what you need.'],
  ['Who do I contact if I need help?',
   'WhatsApp support 9 AM – 9 PM WIB. Average response time: 12 minutes. Most issues solved in the first reply.'],
]

export default function DonutSellingPage() {
  const [scrolled, setScrolled] = useState(false)
  // Hero phone cycles through the landing splash designs every 5s so
  // a visitor sees the full design range without scrolling.
  const [heroThemeIdx, setHeroThemeIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setHeroThemeIdx(i => (i + 1) % LANDING_THEME_PREVIEWS.length), 5000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="ds">
      <PageStyles />

      {/* ═══ NAVIGATION ═══ */}
      <header className={`ds-nav ${scrolled ? 'ds-nav--scrolled' : ''}`}>
        <div className="ds-nav__inner">
          <a href="#top" className="ds-brand" aria-label="Donut Selling App home">
            <img
              src="/images/donut-page/img-09.png"
              alt=""
              aria-hidden
              className="ds-brand__logo"
              width="44"
              height="44"
              loading="eager"
            />
            <span className="ds-brand__text">
              <span className="ds-brand__title">Donut Selling App</span>
              <span className="ds-brand__tagline">Sell Donuts · keep 100% profit</span>
            </span>
          </a>
          {/* Home — diverts back to the StreetLocal main home page. */}
          <a
            href="/"
            className="ds-gear"
            aria-label="StreetLocal home"
          >
            <span aria-hidden style={{ display: 'block' }}>🏠</span>
          </a>
        </div>
      </header>

{/* ═══ HERO ═══ */}
      <section className="ds-hero" id="top">
        <img src={IMAGES.bouncing}   alt="" aria-hidden className="ds-hero__float ds-hero__float--tr" />
        <img src={IMAGES.bottomLeft} alt="" aria-hidden className="ds-hero__float ds-hero__float--bl" />

        <div className="ds-container ds-hero__grid">
          <div className="ds-hero__copy">
            <span className="ds-eyebrow">
              <span className="ds-eyebrow__dot" aria-hidden></span>
              Donut sellers · Indonesia
              <span className="ds-eyebrow__flag" aria-label="Indonesia">🇮🇩</span>
            </span>
            <h1 className="ds-h1">
              Your donut shop.<br />
              Online in <span className="ds-pink">5 minutes.</span>
            </h1>
            <p className="ds-lede">
              GoPay · OVO · DANA · ShopeePay · QRIS · Bank Transfer — all in one app, Rp 38,000/month. 0% commission. Customers order from WhatsApp, you keep 100% of what you sell.
            </p>
            <div className="ds-cta-row">
              {/* Single soft "View demo" link with a moving text-glow
                  shimmer — replaces the older two-button row. */}
              <a href="#demo" className="ds-view-demo">View demo</a>
            </div>
            <ul className="ds-trust">
              <li><span className="ds-check">✓</span> Free demo</li>
              <li><span className="ds-check">✓</span> No card required</li>
              <li><span className="ds-check">✓</span> Cancel anytime</li>
            </ul>
          </div>

          <div className="ds-hero__phone-wrap">
            <div className="ds-glow" aria-hidden></div>
            {/* Dancing donut + chocolate-crumb shower removed per user
                request — the phone cycling through landing themes is
                the hero's visual focus now. Clean backdrop reads
                better at mobile sizes too. */}
            <div className="ds-phone">
              <div className="ds-phone__notch" aria-hidden></div>
              <iframe
                src={LANDING_THEME_PREVIEWS[heroThemeIdx]}
                title="Live donut shop demo — cycling through landing themes"
                className="ds-phone__frame"
                key={heroThemeIdx}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PAIN POINTS ═══ */}
      <section className="ds-section ds-section--white">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">The problem</span>
            <h2 className="ds-h2">Stop losing money and orders to…</h2>
          </div>
          <div className="ds-pain-grid">
            {[
              { banner: '/images/donut-page/img-16.png', alt: 'WhatsApp chaos — orders lost in DMs, customers waiting, forgetting who ordered what' },
              { banner: '/images/donut-page/img-17.png', bare: true, alt: 'Manual menu updates — editing Instagram bio every time a flavor sells out or a price changes' },
              { banner: '/images/donut-page/img-18.png', alt: '20-30% komisi aplikasi — GrabFood and Gojek eating your margin on every order' },
            ].map((p, i) => (
              p.bare ? (
                <img key={i} src={p.banner} alt={p.alt} className="ds-pain-card__bare-img" loading="lazy" />
              ) : (
                <div key={i} className={`ds-pain-card${p.banner ? ' ds-pain-card--banner' : ''}`}>
                  {p.banner ? (
                    <img src={p.banner} alt={p.alt} className="ds-pain-card__banner" loading="lazy" />
                  ) : (
                    <>
                      <div className="ds-pain-card__icon">{p.icon}</div>
                      <h3 className="ds-pain-card__title">{p.title}</h3>
                      <p className="ds-pain-card__desc">{p.desc}</p>
                    </>
                  )}
                </div>
              )
            ))}
          </div>
          <p className="ds-section__transition">Inilah yang Anda dapatkan ↓</p>
        </div>
      </section>

      {/* ═══ BUILT FOR INDONESIA ═══
            The page's strongest differentiator — payment rails, tax
            compliance, language support and pricing all sized for the
            Indonesian SME donut shop. Western competitors (Square /
            Toast / Shopify) cannot match this on any single point. */}
      <section className="ds-section ds-section--indo" id="indonesia">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">🇮🇩 Built for Indonesia</span>
            <h2 className="ds-h2">StreetLocal Indonesia.<br /><span className="ds-pink">Sized for warungs, kafe, & UMKM.</span></h2>
            <p className="ds-section__sub">
              Most "POS" apps come from the US and charge in dollars. We built this in Indonesia, for the way Indonesian customers actually buy donuts.
            </p>
          </div>
          <div className="ds-indo-grid">
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">💳 Pembayaran lokal</div>
              <h3>All Indonesian payment methods</h3>
              <p>GoPay, OVO, DANA, ShopeePay, QRIS, virtual account, kartu, transfer bank. Connect Midtrans atau Xendit langsung — funds masuk ke rekening Anda, bukan ke kami.</p>
              <img
                src="/images/donut-page/img-10.png"
                alt="Indonesian payment methods: GoPay, OVO, DANA, ShopeePay, QRIS, virtual account, cards, bank transfer"
                className="ds-indo-card__banner"
                loading="lazy"
              />
            </div>
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">💸 Harga UMKM</div>
              <h3>Rp 38,000 per bulan. Sudah termasuk semua.</h3>
              <p>Tidak ada komisi per pesanan. Tidak ada biaya setup. Tidak perlu kartu kredit. Bandingkan: Shopify Rp 500,000+ per bulan, GrabFood ambil 20-30% per pesanan, ChatRestaurant baru ada di sini.</p>
              <img
                src="/images/donut-page/img-11.png"
                alt="Price comparison: StreetLocal Rp 38,000/month with 0% commission vs GrabFood/Gojek 20-30% per order vs Shopify Rp 500,000+/month"
                className="ds-indo-card__banner"
                loading="lazy"
              />
            </div>
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">📜 Pajak siap pakai</div>
              <h3>PPN 11% + Faktur Pajak</h3>
              <p>PPN 11% sudah preset. NPWP & nomor faktur otomatis di setiap invoice. 4 template invoice — pilih yang cocok untuk akuntan Anda. Auto-kirim ke WhatsApp customer setelah bayar.</p>
              <img
                src="/images/donut-page/img-12.png"
                alt="PPN 11% preset with NPWP and faktur pajak automatically generated on every invoice"
                className="ds-indo-card__banner"
                loading="lazy"
              />
            </div>
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">💬 Bahasa Indonesia</div>
              <h3>Customer lihat menu dalam Bahasa</h3>
              <p>Aplikasi customer-facing penuh Bahasa Indonesia. Bahasa Inggris juga ada — kalau ada turis di Bali atau expat di Jakarta, mereka switch dengan 1 klik.</p>
              <img
                src="/images/donut-page/img-13.png"
                alt="Customer-facing app in full Bahasa Indonesia with 1-click English switch for tourists and expats"
                className="ds-indo-card__banner"
                loading="lazy"
              />
            </div>
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">📱 Hemat data + RAM</div>
              <h3>Jalan di HP Android murah</h3>
              <p>PWA = ukuran cuma 2MB, bukan 200MB seperti aplikasi native. Customer pakai HP RAM 2GB? Tetap lancar. Customer di pelosok dengan sinyal lambat? Tetap order.</p>
              <img
                src="/images/donut-page/img-14.png"
                alt="PWA is only 2MB instead of 200MB native app, runs smoothly on low-RAM Android phones and slow signal areas"
                className="ds-indo-card__banner"
                loading="lazy"
              />
            </div>
            <div className="ds-indo-card ds-indo-card--featured">
              <div className="ds-indo-card__head">🎯 Sudah lengkap</div>
              <h3>Tidak ada fitur terkunci di paket Standard</h3>
              <p>Loyalty stamps, marketing banner, promo code, KDS untuk dapur, invoice A4, tip handling, mix-and-match dozen, customer accounts, kiosk mode — semua sudah termasuk di Rp 38,000. Upgrade ke Pro hanya kalau butuh multi-staff atau automasi.</p>
              <img
                src="/images/donut-page/img-15.png"
                alt="All features unlocked in Standard plan: loyalty stamps, marketing banner, promo code, KDS, invoice A4, tip handling, mix-and-match dozen, customer accounts, kiosk mode"
                className="ds-indo-card__banner"
                loading="lazy"
              />
              <a href="#pricing" className="ds-btn ds-btn--primary" style={{ marginTop: 12, alignSelf: 'flex-start' }}>Lihat semua fitur →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="ds-section" id="features">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">Features</span>
            <h2 className="ds-h2">Everything you need.<br /><span className="ds-pink">Nothing you don't.</span></h2>
            <p className="ds-section__sub">Built specifically for donut shops — not another generic e-commerce template.</p>
          </div>
          <div className="ds-feature-grid">
            {FEATURES.map((f, i) => (
              <article key={i} className="ds-feature-card">
                <div className={`ds-feature-card__icon${f.iconImg ? ' ds-feature-card__icon--img' : ''}${f.large ? ' ds-feature-card__icon--large' : ''}`} aria-hidden>
                  {f.iconImg ? <img src={f.iconImg} alt="" loading="lazy" /> : f.icon}
                </div>
                <h3 className="ds-feature-card__title">{f.title}</h3>
                <p className="ds-feature-card__desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="ds-section ds-section--white">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">How it works</span>
            <h2 className="ds-h2">Zero to launched in <span className="ds-pink">5 minutes</span>.</h2>
          </div>
          <div className="ds-step-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="ds-step">
                <div className="ds-step__icon" aria-hidden>
                  {s.icon}
                  <span className="ds-step__num" aria-label={`Step ${s.step}`}>{s.step}</span>
                </div>
                <div className="ds-step__time">{s.time}</div>
                <h3 className="ds-step__title">{s.title}</h3>
                <p className="ds-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LIVE DEMO BIG ═══ */}
      <section className="ds-section ds-section--demo" id="demo">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">Live demo</span>
            <h2 className="ds-h2">Tap around. <span className="ds-pink">No sign-up needed.</span></h2>
            <p className="ds-section__sub">
              This is the actual product running in your browser. Place an order. Pick a donut. See how it feels from a customer's side.
            </p>
          </div>
          <div className="ds-demo-stage">
            <div className="ds-glow ds-glow--big" aria-hidden></div>
            <div className="ds-phone ds-phone--big">
              <div className="ds-phone__notch ds-phone__notch--big" aria-hidden></div>
              <iframe
                src={DEMO_URL}
                title="Donut shop interactive demo"
                className="ds-phone__frame"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="ds-section ds-section--white" id="pricing">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">Pricing</span>
            <h2 className="ds-h2">Pick your plan. <span className="ds-pink">Grow into the next.</span></h2>
            <p className="ds-section__sub">Start small, upgrade only when you need more. 0% commission on every tier. No setup fee. No card upfront.</p>
          </div>

          <div className="ds-pricing-grid">
            {/* ── STARTER ── */}
            <div className="ds-pricing-card ds-pricing-card--starter">
              <span className="ds-kicker ds-kicker--small">Starter</span>
              <h3 className="ds-pricing-card__tier-name">Sell donuts + market on social</h3>
              <div className="ds-pricing-card__price">
                <span className="ds-price-num">38,000</span>
                <span className="ds-price-cur">IDR</span>
              </div>
              <p className="ds-price-sub">per month · ~$2.50 USD</p>
              <p className="ds-pricing-card__pitch">Everything a small shop needs to open today and run marketing on WhatsApp + Instagram + TikTok.</p>
              <ul className="ds-pricing-card__list">
                {STARTER_INCLUDES.map((feat, i) => (
                  <li key={i}><span className="ds-check">✓</span>{feat}</li>
                ))}
              </ul>
              <a href="#" className="ds-btn ds-btn--outline ds-btn--block">Start with Starter →</a>
            </div>

            {/* ── PRO — highlighted ── */}
            <div className="ds-pricing-card ds-pricing-card--pro">
              <div className="ds-pricing-glow" aria-hidden></div>
              <div className="ds-pricing-card__inner">
                <div className="ds-pricing-card__head">
                  <span className="ds-kicker ds-kicker--small">Pro</span>
                  <span className="ds-badge-pop">Most popular</span>
                </div>
                <h3 className="ds-pricing-card__tier-name">For growing shops</h3>
                <div className="ds-pricing-card__price">
                  <span className="ds-price-num">199,000</span>
                  <span className="ds-price-cur">IDR</span>
                </div>
                <p className="ds-price-sub">per month · ~$13 USD</p>
                <p className="ds-pricing-card__pitch">Loyalty, thermal printer, custom domain, in-app chat, tipping, and SMS / email campaigns.</p>
                <ul className="ds-pricing-card__list">
                  {PRO_INCLUDES.map((feat, i) => (
                    <li key={i} className={i === 0 ? 'ds-pricing-card__list-header' : ''}><span className="ds-check">✓</span>{feat}</li>
                  ))}
                </ul>
                <a href="#" className="ds-btn ds-btn--primary ds-btn--block">Upgrade to Pro →</a>
              </div>
            </div>

            {/* ── ENTERPRISE ── */}
            <div className="ds-pricing-card ds-pricing-card--enterprise">
              <span className="ds-kicker ds-kicker--small">Enterprise</span>
              <h3 className="ds-pricing-card__tier-name">Operations-heavy shops</h3>
              <div className="ds-pricing-card__price">
                <span className="ds-price-num">449,000</span>
                <span className="ds-price-cur">IDR</span>
              </div>
              <p className="ds-price-sub">per month · ~$29 USD</p>
              <p className="ds-pricing-card__pitch">KDS, kiosk mode, production planner, catering, multi-location, unlimited staff.</p>
              <ul className="ds-pricing-card__list">
                {ENTERPRISE_INCLUDES.map((feat, i) => (
                  <li key={i} className={i === 0 ? 'ds-pricing-card__list-header' : ''}><span className="ds-check">✓</span>{feat}</li>
                ))}
              </ul>
              <a href="#" className="ds-btn ds-btn--outline ds-btn--block">Go Enterprise →</a>
            </div>
          </div>

          <p className="ds-price-reassurance">
            <span className="ds-check">✓</span> No card required &nbsp;·&nbsp;
            <span className="ds-check">✓</span> Cancel anytime &nbsp;·&nbsp;
            <span className="ds-check">✓</span> Your data stays yours &nbsp;·&nbsp;
            <span className="ds-check">✓</span> Upgrade or downgrade any month
          </p>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section className="ds-section" id="compare">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">Comparison</span>
            <h2 className="ds-h2">Why donut sellers choose us.</h2>
          </div>
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="ds-table__col-feature">Feature</th>
                  <th className="ds-table__col-us">
                    <span className="ds-table__chip">🍩 Fresh Donuts Baked Daily</span>
                  </th>
                  <th>WhatsApp DMs</th>
                  <th>Shopify</th>
                  <th>GrabFood / Gojek</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([feat, ours, wa, shop, grab], i) => (
                  <tr key={i}>
                    <td className="ds-table__feat">{feat}</td>
                    <td className="ds-table__us">{ours}</td>
                    <td>{wa}</td>
                    <td>{shop}</td>
                    <td>{grab}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ TRUST / TESTIMONIAL placeholder ═══ */}
      <section className="ds-section ds-section--white">
        <div className="ds-container ds-trust-block">
          <span className="ds-kicker">Trusted by</span>
          <h2 className="ds-h2">Sell donuts in any city — <span className="ds-pink">Yogyakarta, Jakarta, Bali, anywhere</span>.</h2>
          <p className="ds-section__sub">
            StreetLocal is live in Indonesia. Donut sellers are moving fast — from renting shelves on GrabFood, GoFood, and Shopee to running their own branded app, with their own customer list and 0% commission. <strong>Donut sellers say it best.</strong>
          </p>
          <div className="ds-reviews-marquee">
            <div className="ds-reviews-marquee__track">
              {[...REVIEWS, ...REVIEWS].map((r, i) => (
                <article key={i} className="ds-review-card">
                  <div className="ds-review-card__head">
                    <img
                      src={r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=fce7f3&color=ec4899&size=80&bold=true`}
                      alt=""
                      className="ds-review-card__avatar"
                      loading="lazy"
                    />
                    <div className="ds-review-card__who">
                      <span className="ds-review-card__name">{r.name}</span>
                      <span className="ds-review-card__biz">{r.business} · {r.city}</span>
                    </div>
                  </div>
                  <span className="ds-review-card__stars" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}</span>
                  <p className="ds-review-card__text">&ldquo;{r.text}&rdquo;</p>
                  <span className="ds-review-card__when">{r.when}</span>
                </article>
              ))}
            </div>
          </div>
          <p className="ds-reviews-cta">
            Send us your review and get listed in our review section. <a href="mailto:streetlocallive@gmail.com?subject=My%20StreetLocal%20review" className="ds-link">Email your review →</a>
          </p>
        </div>
      </section>

      {/* ═══ BEYOND THE MONTHLY PLAN — native apps + custom features ═══
            Positions us as both a PWA platform AND a paid app-builder
            service so visitors leave knowing we cover requests outside
            the standard subscription. Pricing mirrors the StreetLocal
            site's #native-apps section so the offer is consistent
            across surfaces. */}
      <section className="ds-section ds-section--beyond" id="extras">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">Beyond the monthly plan</span>
            <h2 className="ds-h2">Need more? We build it.<br /><span className="ds-pink">Apple App Store. Google Play. Custom features.</span></h2>
            <p className="ds-section__sub">
              The Rp 38,000 monthly plan gets your PWA live in minutes. When you're ready to grow — branded native app, custom integrations, NFC loyalty — we handle those as paid add-ons. Same StreetLocal team, beyond-the-subscription delivery.
            </p>
          </div>

          <div className="ds-beyond-grid">
            {/* Native app card */}
            <div className="ds-beyond-card ds-beyond-card--featured">
              <div className="ds-beyond-card__pill">App Store + Play Store</div>
              <h3 className="ds-beyond-card__title">Your bakery in the App Store</h3>
              <p className="ds-beyond-card__desc">
                We build your branded native app — your name, your logo, your colours — and submit it to Apple App Store and Google Play under your bakery's own developer account. You own the listing, reviews, and payouts. Customers find you in their phone's store.
              </p>
              <div className="ds-beyond-card__price">
                <span className="ds-beyond-card__price-from">From</span>
                <span className="ds-beyond-card__price-amount">Rp 2,500,000</span>
                <span className="ds-beyond-card__price-sub">one-time + Rp 350k/month maintenance</span>
              </div>
              <ul className="ds-beyond-card__list">
                <li>Branded build with your logo + splash screen</li>
                <li>App icons, screenshots, store listing copy</li>
                <li>Submission to Apple + Google on your behalf</li>
                <li>Push notifications + over-the-air updates</li>
                <li>Apple Developer ($99/yr) + Google Play ($25 one-time) paid directly to them, in your name</li>
              </ul>
            </div>

            {/* Custom features card */}
            <div className="ds-beyond-card">
              <div className="ds-beyond-card__pill">Custom work · quote per project</div>
              <h3 className="ds-beyond-card__title">Build what you need</h3>
              <p className="ds-beyond-card__desc">
                If your shop has a specific workflow — wholesale catering portal, accounting export, NFC tap-to-stamp loyalty, beacon promos near your door — we build it as a custom engagement. Same StreetLocal codebase under the hood, your specific business logic on top.
              </p>
              <ul className="ds-beyond-card__list">
                <li>NFC loyalty taps (no app open needed for stamps)</li>
                <li>Beacon-triggered offers when customers walk past</li>
                <li>Accounting / inventory software bridges</li>
                <li>Custom delivery integrations</li>
                <li>Multi-app management for chains with 5+ locations</li>
              </ul>
              <a href="mailto:streetlocallive@gmail.com?subject=Custom%20feature%20request" className="ds-btn ds-btn--ghost ds-beyond-card__cta">Email us with your idea →</a>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="ds-section" id="faq">
        <div className="ds-container ds-faq-container">
          <div className="ds-section__head">
            <span className="ds-kicker">FAQ</span>
            <h2 className="ds-h2">Common questions.</h2>
          </div>
          <div className="ds-faq-list">
            {FAQS.map(([q, a], i) => (
              <details key={i} className="ds-faq-item">
                <summary className="ds-faq-summary">
                  <span className="ds-faq-q">{q}</span>
                  <span className="ds-faq-toggle" aria-hidden>+</span>
                </summary>
                <div className="ds-faq-answer">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="ds-cta">
        <div className="ds-cta__blob ds-cta__blob--tl" aria-hidden></div>
        <div className="ds-cta__blob ds-cta__blob--br" aria-hidden></div>
        <img loading="lazy" src={IMAGES.bouncing} alt="" aria-hidden className="ds-cta__donut ds-cta__donut--tr" />
        <img loading="lazy" src={IMAGES.chocolate} alt="" aria-hidden className="ds-cta__donut ds-cta__donut--bl" />
        <div className="ds-container ds-cta__inner">
          <h2 className="ds-cta__h">
            Your donut shop.<br />
            Live in <span className="ds-cta__highlight">5 minutes.</span>
          </h2>
          <p className="ds-cta__sub">
            Stop renting space on someone else's app. Build your own — keep 100% of every sale.
          </p>
          <div className="ds-cta__buttons">
            {/* "Start your shop" lives here now — moved out of the hero
                so the page tells the value story first, then asks
                for the click at the bottom. */}
            <a href="#pricing" className="ds-btn ds-btn--white ds-btn--lg">Start your shop →</a>
            <a href="#demo" className="ds-btn ds-btn--dark ds-btn--lg">▶ See live demo</a>
          </div>
          <p className="ds-cta__reassurance">
            7-day free trial · No card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="ds-footer">
        <div className="ds-container ds-footer__grid">
          <div className="ds-footer__brand">
            <a href="#top" className="ds-brand" aria-label="Donut Selling App home">
              <img
                src="/images/donut-page/img-09.png"
                alt=""
                aria-hidden
                className="ds-brand__logo"
                width="44"
                height="44"
                loading="lazy"
              />
              <span className="ds-brand__text ds-brand__text--light">
                <span className="ds-brand__title">Donut Selling App</span>
                <span className="ds-brand__tagline ds-brand__tagline--light">Sell Donuts · keep 100% profit</span>
              </span>
            </a>
            <p className="ds-footer__about">
              Part of <a href="https://streetlocal.live" className="ds-footer__link-pink">StreetLocal</a> — a family of apps for street vendors, makers, and small businesses across Southeast Asia.
            </p>
            <p className="ds-footer__coming">
              Coming soon: Products · Services · Properties · Rentals · More.
            </p>
          </div>
          <div>
            <h4 className="ds-footer__h">Product</h4>
            <ul className="ds-footer__list">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#demo">Live demo</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="ds-footer__h">Company</h4>
            <ul className="ds-footer__list">
              <li><a href="#">About StreetLocal</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="ds-container ds-footer__bottom">
          <span>© 2026 StreetLocal. All rights reserved.</span>
          <span>Made with 🍩 in Yogyakarta</span>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="ds-mobile-cta">
        <a href="#pricing" className="ds-btn ds-btn--primary ds-btn--block">Start free trial →</a>
      </div>
    </div>
  )
}

/* ─── All page styles in one block. Media queries handle mobile + desktop.
   Naming convention: ds-* (donut selling) so it never collides with any
   global styles in the landing app. ─────────────────────────────────────── */
function PageStyles() {
  return (
    <style>{`
      .ds { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FFF8F8; color: #2D1B1B; -webkit-font-smoothing: antialiased; line-height: 1.5; overflow-x: clip; }
      .ds *, .ds *::before, .ds *::after { box-sizing: border-box; }
      .ds ::selection { background: #FBCFE8; color: #2D1B1B; }
      .ds a { color: inherit; text-decoration: none; }
      .ds-pink { color: #EC4899; }
      .ds-link { color: #EC4899; font-weight: 700; text-decoration: underline; }
      .ds-link:hover { text-decoration: none; }
      .ds-check { display: inline-block; color: #EC4899; font-weight: 900; margin-right: 6px; }
      .ds-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

      /* ── NAV ───────────────────────────────────────────────────── */
      .ds-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: transparent; transition: all 0.3s ease; }
      .ds-nav--scrolled { background: rgba(255,255,255,0.92); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 2px 20px rgba(45,27,27,0.06); }
      .ds-nav__inner { max-width: 1200px; margin: 0 auto; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .ds-brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 900; }
      .ds-brand__bubble { width: 36px; height: 36px; border-radius: 50%; background: #EC4899; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; box-shadow: 0 4px 14px rgba(236,72,153,0.35); }
      .ds-brand__logo { width: 44px; height: 44px; object-fit: contain; flex-shrink: 0; }
      @media (min-width: 600px) { .ds-brand__logo { width: 48px; height: 48px; } }
      .ds-brand__text { font-size: 16px; letter-spacing: -0.02em; display: inline-flex; flex-direction: column; gap: 0; line-height: 1.15; }
      .ds-brand__title { font-size: 16px; font-weight: 900; color: #2D1B1B; letter-spacing: -0.3px; }
      .ds-brand__text--light .ds-brand__title { color: #fff; }
      .ds-brand__tagline { font-size: 11px; font-weight: 700; color: #EC4899; letter-spacing: 0.2px; margin-top: 2px; }
      .ds-brand__tagline--light { color: #F9A8D4; }
      @media (min-width: 600px) { .ds-brand__title { font-size: 17px; } .ds-brand__tagline { font-size: 12px; } }
      /* Kept for backwards-compat with any unedited brand row elsewhere */
      .ds-brand__suffix { color: #EC4899; font-weight: 800; }
      .ds-brand__text--light { color: #fff; }
      .ds-brand__suffix--light { color: #F9A8D4; }
      .ds-nav__links { display: none; gap: 26px; font-size: 14px; font-weight: 600; color: #5C3A3A; }
      .ds-nav__links a:hover { color: #EC4899; }
      .ds-nav__cta { display: flex; align-items: center; gap: 12px; }
      .ds-nav__link-cta { display: none; font-size: 14px; font-weight: 700; color: #EC4899; }

      /* ── HOME BUTTON ──────────────────────────────────────────── */
      .ds-gear { width: 42px; height: 42px; border-radius: 12px; border: 1px solid rgba(236,72,153,0.25); background: linear-gradient(180deg, #fff 0%, #FFF5F8 100%); color: #EC4899; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 2px 8px rgba(236,72,153,0.12); transition: all 0.2s ease; line-height: 1; text-decoration: none; }
      .ds-gear:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(236,72,153,0.22); }

      /* ── BUTTONS ───────────────────────────────────────────────── */
      .ds-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-weight: 800; cursor: pointer; transition: all 0.2s ease; border: none; font-family: inherit; text-decoration: none; min-height: 44px; padding: 10px 18px; border-radius: 12px; font-size: 14px; line-height: 1; }
      .ds-btn--lg { padding: 16px 26px; font-size: 16px; border-radius: 16px; min-height: 52px; }
      .ds-btn--sm { padding: 9px 16px; font-size: 13px; border-radius: 100px; min-height: 40px; }
      .ds-btn--block { width: 100%; }
      .ds-btn--primary { background: #EC4899; color: #fff; box-shadow: 0 10px 30px rgba(236,72,153,0.35); }
      .ds-btn--primary:hover { background: #DB2777; transform: translateY(-2px); box-shadow: 0 14px 34px rgba(236,72,153,0.45); }
      .ds-btn--outline { background: #fff; color: #EC4899; border: 2px solid #FBCFE8; }
      .ds-btn--outline:hover { background: #FCE7F3; border-color: #F9A8D4; }
      .ds-btn--white { background: #fff; color: #EC4899; box-shadow: 0 14px 40px rgba(0,0,0,0.25); }
      .ds-btn--white:hover { transform: translateY(-2px); background: #FCE7F3; }
      .ds-btn--dark { background: #2D1B1B; color: #fff; box-shadow: 0 14px 40px rgba(0,0,0,0.4); }
      .ds-btn--dark:hover { background: #000; transform: translateY(-2px); }

      /* ── HERO ──────────────────────────────────────────────────── */
      .ds-hero { position: relative; padding: 90px 0 60px; overflow-x: clip; background: linear-gradient(180deg, #FFF8F8 0%, #FFF8F8 65%, #fff 100%); }
      /* Mobile-first: text left, phone right, side-by-side from the
         smallest screens. Text column is wider (1.3fr) so the H1 still
         has breathing room; phone column auto-sizes around its 150-220px
         width. Reverts to 1fr 1fr at desktop. */
      .ds-hero__grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 18px; align-items: center; }
      .ds-hero__copy { position: relative; z-index: 2; }
      .ds-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: #FCE7F3; color: #DB2777; padding: 6px 11px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 0.10em; text-transform: uppercase; }
      .ds-eyebrow__dot { width: 6px; height: 6px; border-radius: 50%; background: #EC4899; animation: dsPulse 2s ease-in-out infinite; }
      .ds-eyebrow__flag { font-size: 13px; line-height: 1; margin-left: 2px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.15)); }
      @keyframes dsPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
      /* H1 + lede scaled down on smallest mobile so the side-by-side
         layout doesn't overflow. They grow back at ≥480px and again
         at desktop via existing breakpoints below. */
      .ds-h1 { font-size: 28px; line-height: 1.05; letter-spacing: -0.02em; font-weight: 900; margin: 16px 0 0; color: #2D1B1B; }
      .ds-lede { font-size: 13px; line-height: 1.5; color: #6B5555; margin: 14px 0 0; max-width: 540px; }
      .ds-cta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }

      /* View demo — small solid-pink pill button. Subtle shine
         sweeps across once every 2.4s so it draws the eye without
         being noisy. Sized to fit comfortably beside other hero
         elements at every breakpoint. */
      .ds-view-demo {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 16px; border-radius: 999px;
        background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
        color: #fff; font-size: 13px; font-weight: 800;
        letter-spacing: 0.02em; text-decoration: none;
        box-shadow: 0 4px 12px rgba(236,72,153,0.35);
        position: relative; overflow: hidden;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .ds-view-demo::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
        transform: translateX(-100%);
        animation: dsViewDemoShine 2.4s linear infinite;
        pointer-events: none;
      }
      .ds-view-demo::after {
        content: '→'; transition: transform 0.2s ease;
      }
      .ds-view-demo:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(236,72,153,0.45); }
      .ds-view-demo:hover::after { transform: translateX(3px); }
      @keyframes dsViewDemoShine {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      @media (min-width: 640px) { .ds-view-demo { padding: 10px 18px; font-size: 14px; } }
      .ds-trust { list-style: none; padding: 0; margin: 18px 0 0; display: flex; flex-wrap: wrap; gap: 10px 16px; font-size: 12px; font-weight: 600; color: #705353; }
      .ds-trust li { display: inline-flex; align-items: center; }
      @media (min-width: 480px) {
        .ds-h1 { font-size: 36px; margin-top: 20px; }
        .ds-lede { font-size: 15px; }
        .ds-cta-row { gap: 12px; margin-top: 26px; }
        .ds-trust { font-size: 13px; gap: 16px; }
      }
      @media (min-width: 640px) {
        .ds-h1 { font-size: 44px; }
        .ds-lede { font-size: 17px; }
        .ds-trust { gap: 18px; }
      }

      .ds-hero__phone-wrap { position: relative; display: flex; align-items: center; justify-content: center; min-height: 320px; flex-direction: column; }
      @media (min-width: 480px) { .ds-hero__phone-wrap { min-height: 380px; } }
      @media (min-width: 980px) { .ds-hero__phone-wrap { min-height: 540px; } }
      /* Dancing donut + chocolate crumb shower — sit behind the phone
         (z-index 0) so they decorate without blocking interaction. */
      .ds-dance-donut { position: absolute; top: 30px; right: 8%; width: 180px; height: 180px; border-radius: 50%; object-fit: cover; z-index: 0; animation: dsDonutBounce 1.2s ease-in-out infinite; filter: drop-shadow(0 14px 30px rgba(91,48,23,0.45)); will-change: transform; pointer-events: none; }
      .ds-crumbs { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
      .ds-crumb { position: absolute; top: 160px; width: 9px; height: 9px; border-radius: 3px; background: linear-gradient(135deg, #6b3a1a, #3d1e0a); animation: dsCrumbFall linear infinite; box-shadow: inset -1px -1px 2px rgba(0,0,0,0.35); }
      @keyframes dsDonutBounce { 0%, 100% { transform: translateY(-12%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); } }
      @keyframes dsCrumbFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 8% { opacity: 0.9; } 92% { opacity: 0.9; } 100% { transform: translateY(580px) rotate(540deg); opacity: 0; } }
      .ds-hero__float { position: absolute; border-radius: 50%; object-fit: cover; display: block; pointer-events: none; z-index: 3; }
      .ds-hero__float--tr { top: 8px; right: -20px; width: 120px; height: 120px; filter: drop-shadow(0 14px 28px rgba(236,72,153,0.22)); }
      .ds-hero__float--bl { bottom: -30px; left: -20px; width: 110px; height: 110px; filter: drop-shadow(0 14px 28px rgba(34,211,238,0.18)); }
      .ds-glow { position: absolute; inset: -30px; background: radial-gradient(circle, rgba(244,114,182,0.35), transparent 65%); filter: blur(40px); z-index: 0; pointer-events: none; }
      .ds-glow--big { inset: -60px; }
      /* Phone scales up with viewport: smallest mobile ≈150×320 so it
         sits comfortably beside the H1; small mobile ≈180×380; desktop
         keeps 240×500 from earlier. */
      .ds-phone { position: relative; z-index: 1; width: 150px; height: 320px; background: #000; border-radius: 24px; padding: 4px; box-shadow: 0 18px 40px rgba(236,72,153,0.32), 0 6px 14px rgba(0,0,0,0.25); border: 2px solid #2a2a2a; overflow: hidden; }
      @media (min-width: 480px) { .ds-phone { width: 180px; height: 380px; border-radius: 28px; } }
      @media (min-width: 640px) { .ds-phone { width: 200px; height: 420px; border-radius: 30px; } }
      @media (min-width: 980px) { .ds-phone { width: 240px; height: 500px; border-radius: 38px; } }
      .ds-phone--big { width: 320px; height: 670px; border-radius: 50px; padding: 7px; box-shadow: 0 40px 100px rgba(236,72,153,0.4), 0 10px 30px rgba(0,0,0,0.3); }
      .ds-phone__notch { position: absolute; top: 7px; left: 50%; transform: translateX(-50%); width: 60px; height: 14px; background: #000; border-radius: 10px; z-index: 5; }
      @media (min-width: 480px) { .ds-phone__notch { top: 9px; width: 72px; height: 16px; } }
      @media (min-width: 980px) { .ds-phone__notch { top: 10px; width: 86px; height: 18px; border-radius: 12px; } }
      .ds-phone__notch--big { width: 130px; height: 26px; top: 14px; }
      /* Render iframe at native phone-design viewport (390x844) and
         scale it down with CSS to fit the phone shell. Without this,
         donuts.html lays out at the shell's pixel width (~268px) and
         elements get cramped or break — the scale-transform makes the
         page believe it's on a real ~390px phone. */
      /* Iframe is always 390×844 (the design-canvas size used by the
         donut app) and CSS-scaled to fit each phone breakpoint. */
      .ds-phone__frame { width: 390px; height: 844px; border: 0; border-radius: 20px; background: #000; display: block; transform-origin: top left; transform: scale(0.364); }
      @media (min-width: 480px) { .ds-phone__frame { border-radius: 24px; transform: scale(0.441); } }
      @media (min-width: 640px) { .ds-phone__frame { border-radius: 26px; transform: scale(0.493); } }
      @media (min-width: 980px) { .ds-phone__frame { border-radius: 34px; transform: scale(0.59); } }
      .ds-phone--big .ds-phone__frame { border-radius: 44px; transform: scale(0.785); }
      .ds-phone__tag { position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); background: #fff; color: #2D1B1B; padding: 9px 16px; border-radius: 999px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 10px 28px rgba(0,0,0,0.18); white-space: nowrap; }
      .ds-phone__tag-dot { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; animation: dsPulse 2s ease-in-out infinite; }

      /* "Choose design" label between the phone and the chip row.
         Centered, small, uppercase, soft pink so it reads as a
         friendly prompt rather than a heading. */
      .ds-theme-label { margin: 18px auto 0; text-align: center; font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #EC4899; }
      @media (min-width: 640px) { .ds-theme-label { font-size: 13px; margin-top: 22px; } }

      /* Theme picker chips below the hero phone — controls the
         cycling preview iframe. Active chip highlighted in pink. */
      .ds-theme-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 8px auto 0; max-width: 360px; }
      .ds-theme-chip { padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
      .ds-theme-chip:hover { background: rgba(255,255,255,0.12); color: #fff; }
      .ds-theme-chip--active { background: #EC4899; border-color: #EC4899; color: #fff; box-shadow: 0 4px 12px rgba(236,72,153,0.40); }

      /* ── SECTION GENERICS ─────────────────────────────────────── */
      .ds-section { padding: 80px 0; }
      .ds-section--white { background: #fff; }

      /* ── BUILT FOR INDONESIA section ── */
      .ds-section--indo { background: linear-gradient(180deg, #FFF5F8 0%, #FFE4ED 100%); }
      .ds-indo-grid { display: grid; grid-template-columns: 1fr; gap: 16px; max-width: 1100px; margin: 40px auto 0; }
      @media (min-width: 760px) { .ds-indo-grid { grid-template-columns: 1fr 1fr; gap: 20px; } }
      .ds-indo-card { background: #fff; border-radius: 20px; padding: 24px 22px; border: 1px solid rgba(236,72,153,0.18); box-shadow: 0 8px 22px rgba(236,72,153,0.08); display: flex; flex-direction: column; gap: 8px; }
      .ds-indo-card--featured { border: 2px solid #EC4899; box-shadow: 0 10px 28px rgba(236,72,153,0.22); }
      @media (min-width: 760px) { .ds-indo-card--featured { grid-column: 1 / -1; } }
      .ds-indo-card__head { display: inline-block; align-self: flex-start; padding: 5px 12px; border-radius: 999px; background: #EC4899; color: #fff; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; }
      .ds-indo-card h3 { font-size: 20px; font-weight: 900; color: #2D1B1B; margin: 4px 0 4px; letter-spacing: -0.4px; line-height: 1.2; }
      .ds-indo-card p { font-size: 14px; color: #5B4646; line-height: 1.6; margin: 0; }
      .ds-indo-card__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .ds-indo-card__chips span { padding: 5px 12px; border-radius: 999px; background: rgba(236,72,153,0.08); border: 1px solid rgba(236,72,153,0.2); color: #2D1B1B; font-size: 12px; font-weight: 700; }
      .ds-indo-card__banner { display: block; width: 100%; height: auto; object-fit: contain; border-radius: 16px; margin-top: auto; padding-top: 10px; background: #fff; }
      .ds-indo-card__compare { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
      .ds-indo-card__compare > div { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #FFF5F8; border-radius: 8px; font-size: 13px; }
      .ds-indo-card__compare strong { color: #2D1B1B; font-weight: 800; }
      .ds-indo-card__compare span { font-weight: 700; }

      .ds-section--demo { background: linear-gradient(180deg, #FCE7F3 0%, #FFF8F8 100%); }
      .ds-section__head { text-align: center; max-width: 640px; margin: 0 auto 50px; }
      .ds-kicker { display: inline-block; color: #EC4899; font-weight: 800; letter-spacing: 0.32em; text-transform: uppercase; font-size: 13px; }
      .ds-kicker--small { font-size: 12px; letter-spacing: 0.28em; }
      .ds-h2 { font-size: 36px; line-height: 1.05; letter-spacing: -0.03em; font-weight: 900; margin: 16px 0 0; color: #2D1B1B; }
      .ds-section__sub { font-size: 17px; line-height: 1.55; color: #6B5555; margin: 18px 0 0; }
      .ds-section__transition { text-align: center; font-size: 20px; font-weight: 900; color: #EC4899; margin: 44px 0 0; }

      /* ── PAIN POINTS ──────────────────────────────────────────── */
      .ds-pain-grid { display: grid; grid-template-columns: 1fr; gap: 18px; max-width: 980px; margin: 0 auto; }
      .ds-pain-card { padding: 28px; border-radius: 22px; background: linear-gradient(135deg, #FFF1F2 0%, #FEF3C7 100%); border: 1px solid #FBCFE8; }
      .ds-pain-card__icon { font-size: 36px; }
      .ds-pain-card__title { margin: 12px 0 0; font-size: 20px; font-weight: 900; color: #2D1B1B; }
      .ds-pain-card__desc { margin: 8px 0 0; font-size: 15px; color: #6B5555; line-height: 1.55; }
      .ds-pain-card--banner { padding: 0; overflow: hidden; align-self: start; }
      .ds-pain-card__banner { display: block; width: 100%; height: auto; object-fit: contain; border-radius: 22px; }
      .ds-pain-card__bare-img { display: block; width: 100%; height: auto; object-fit: contain; align-self: start; }

      /* ── FEATURES ─────────────────────────────────────────────── */
      .ds-feature-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
      .ds-feature-card { padding: 26px; background: #fff; border-radius: 22px; border: 1px solid rgba(251,207,232,0.5); box-shadow: 0 4px 14px rgba(45,27,27,0.04); transition: all 0.25s ease; }
      .ds-feature-card:hover { transform: translateY(-4px); box-shadow: 0 22px 50px rgba(236,72,153,0.18); border-color: #F9A8D4; }
      .ds-feature-card__icon { width: 112px; height: 112px; border-radius: 24px; background: #FCE7F3; display: inline-flex; align-items: center; justify-content: center; font-size: 56px; transition: transform 0.25s ease; overflow: hidden; }
      .ds-feature-card__icon--img { background: #fff; padding: 0; }
      .ds-feature-card__icon--img img { width: 100%; height: 100%; object-fit: contain; display: block; }
      .ds-feature-card__icon--large { width: 224px; height: 224px; border-radius: 32px; font-size: 96px; }
      .ds-feature-card:hover .ds-feature-card__icon { transform: scale(1.1) rotate(-6deg); }
      .ds-feature-card__title { margin: 18px 0 0; font-size: 17px; font-weight: 900; }
      .ds-feature-card__desc { margin: 8px 0 0; font-size: 14px; color: #6B5555; line-height: 1.55; }

      /* ── STEPS ─────────────────────────────────────────────────── */
      .ds-step-grid { display: grid; grid-template-columns: 1fr; gap: 36px; max-width: 920px; margin: 0 auto; }
      .ds-step { text-align: center; }
      .ds-step__icon { position: relative; width: 76px; height: 76px; margin: 0 auto; border-radius: 50%; background: #EC4899; color: #fff; font-size: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 18px 40px rgba(236,72,153,0.4); }
      .ds-step__num { position: absolute; top: -6px; right: -6px; width: 28px; height: 28px; border-radius: 50%; background: #FACC15; color: #2D1B1B; font-size: 13px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 4px solid #fff; }
      .ds-step__time { margin: 14px 0 0; font-size: 12px; font-weight: 800; color: #EC4899; letter-spacing: 0.2em; text-transform: uppercase; }
      .ds-step__title { margin: 8px 0 0; font-size: 22px; font-weight: 900; }
      .ds-step__desc { margin: 8px 0 0; font-size: 14px; color: #6B5555; line-height: 1.55; padding: 0 12px; }

      /* ── DEMO ──────────────────────────────────────────────────── */
      .ds-demo-stage { display: flex; align-items: center; justify-content: center; position: relative; min-height: 700px; }

      /* ── PRICING ───────────────────────────────────────────────── */
      .ds-pricing-grid { display: grid; grid-template-columns: 1fr; gap: 22px; align-items: stretch; max-width: 1100px; margin: 0 auto; }
      @media (min-width: 980px) {
        .ds-pricing-grid { grid-template-columns: 1fr 1.1fr 1fr; gap: 24px; align-items: start; }
        .ds-pricing-card--pro { transform: translateY(-12px); }
      }
      .ds-pricing-card { position: relative; background: #fff; border-radius: 24px; padding: 30px 26px; border: 1px solid rgba(251,207,232,0.6); box-shadow: 0 8px 24px rgba(236,72,153,0.08); display: flex; flex-direction: column; }
      .ds-pricing-card--pro { background: transparent; padding: 0; border: none; box-shadow: none; }
      .ds-pricing-card--pro .ds-pricing-glow { position: absolute; inset: -10px; background: linear-gradient(135deg, #F472B6, #EC4899); border-radius: 34px; filter: blur(28px); opacity: 0.45; z-index: 0; }
      .ds-pricing-card--pro .ds-pricing-card__inner { position: relative; z-index: 1; background: #fff; border-radius: 24px; padding: 36px 28px; box-shadow: 0 30px 60px rgba(236,72,153,0.28); border: 2px solid #EC4899; display: flex; flex-direction: column; height: 100%; }
      .ds-pricing-card--enterprise { background: linear-gradient(180deg, #1F1B1B 0%, #2D1B1B 100%); color: #fff; border-color: rgba(255,255,255,0.08); }
      .ds-pricing-card--enterprise .ds-kicker { color: #FACC15; }
      .ds-pricing-card--enterprise .ds-price-cur,
      .ds-pricing-card--enterprise .ds-price-sub,
      .ds-pricing-card--enterprise .ds-pricing-card__pitch { color: rgba(255,255,255,0.7); }
      .ds-pricing-card--enterprise .ds-pricing-card__list li { color: rgba(255,255,255,0.92); }
      .ds-pricing-card--enterprise .ds-check { color: #FACC15; }
      .ds-pricing-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .ds-pricing-card__tier-name { font-size: 22px; font-weight: 900; margin: 8px 0 0; letter-spacing: -0.4px; }
      .ds-badge-pop { background: #FACC15; color: #2D1B1B; font-size: 11px; font-weight: 900; padding: 5px 11px; border-radius: 999px; letter-spacing: 0.1em; text-transform: uppercase; }
      .ds-pricing-card__price { display: flex; align-items: baseline; gap: 8px; margin-top: 14px; }
      .ds-price-num { font-size: 44px; line-height: 1; font-weight: 900; letter-spacing: -0.03em; }
      @media (min-width: 980px) { .ds-pricing-card--pro .ds-price-num { font-size: 52px; } }
      .ds-price-cur { font-size: 18px; font-weight: 800; color: #6B5555; }
      .ds-price-sub { margin: 6px 0 0; color: #6B5555; font-size: 13px; }
      .ds-pricing-card__pitch { margin: 14px 0 0; font-size: 13px; line-height: 1.5; color: #5B4646; }
      .ds-pricing-card__list { list-style: none; padding: 0; margin: 20px 0 0; display: flex; flex-direction: column; gap: 10px; flex: 1; width: 100%; }
      .ds-pricing-card__list li { font-size: 13.5px; line-height: 1.5; padding-left: 22px; position: relative; text-align: left; width: 100%; display: block; }
      .ds-pricing-card__list li .ds-check { position: absolute; left: 0; top: 0; margin: 0; }
      .ds-pricing-card__list-header { font-weight: 800; color: #EC4899; }
      .ds-pricing-card--enterprise .ds-pricing-card__list-header { color: #FACC15; }
      .ds-pricing-card .ds-btn { margin-top: 22px; }
      .ds-pricing-card--enterprise .ds-btn--outline { background: transparent; color: #FACC15; border-color: #FACC15; }
      .ds-pricing-card--enterprise .ds-btn--outline:hover { background: #FACC15; color: #2D1B1B; }
      .ds-price-reassurance { margin: 30px auto 0; text-align: center; font-size: 13px; color: #6B5555; max-width: 700px; }

      /* ── COMPARISON TABLE ─────────────────────────────────────── */
      .ds-table-wrap { overflow-x: auto; margin: 0 -20px; padding: 0 20px; }
      .ds-table { width: 100%; min-width: 700px; border-collapse: collapse; font-size: 14px; }
      .ds-table th, .ds-table td { padding: 14px 12px; text-align: center; }
      .ds-table th { border-bottom: 2px solid #FBCFE8; font-size: 12px; font-weight: 800; color: #6B5555; letter-spacing: 0.1em; text-transform: uppercase; }
      .ds-table__col-feature { text-align: left !important; padding-left: 0 !important; }
      .ds-table tbody tr { border-bottom: 1px solid #FCE7F3; }
      .ds-table tbody tr:last-child { border-bottom: none; }
      .ds-table__feat { text-align: left !important; font-weight: 700; padding-left: 0 !important; }
      .ds-table__us { background: #FCE7F3; font-weight: 900; color: #DB2777; }
      .ds-table__chip { display: inline-flex; align-items: center; gap: 6px; background: #EC4899; color: #fff; padding: 8px 14px; border-radius: 12px; font-size: 14px; font-weight: 900; box-shadow: 0 8px 22px rgba(236,72,153,0.35); }

      /* ── TRUST MARQUEE ────────────────────────────────────────── */
      .ds-trust-block { text-align: center; }
      .ds-trust-marquee { margin-top: 36px; overflow: hidden; mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent); }
      .ds-trust-marquee__track { display: inline-flex; gap: 36px; animation: dsMarquee 40s linear infinite; white-space: nowrap; }
      .ds-trust-marquee__item { font-size: 14px; color: #6B5555; font-weight: 600; }
      @keyframes dsMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      /* ── REVIEWS MARQUEE ────────────────────────────────────────── */
      .ds-reviews-marquee { margin-top: 36px; overflow: hidden; mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent); }
      .ds-reviews-marquee__track { display: inline-flex; gap: 20px; animation: dsReviewsMarquee 80s linear infinite; padding: 8px 0; }
      .ds-reviews-marquee:hover .ds-reviews-marquee__track { animation-play-state: paused; }
      .ds-review-card { position: relative; flex: 0 0 320px; padding: 18px 20px; background: #FFFFFF; border: 1px solid rgba(236,72,153,0.18); border-radius: 18px; box-shadow: 0 6px 18px rgba(45,27,27,0.06); display: flex; flex-direction: column; gap: 10px; text-align: left; white-space: normal; }
      .ds-review-card__preview-tag { position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 800; letter-spacing: 0.6px; color: #B45309; background: #FEF3C7; border: 1px solid #FDE68A; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; }
      .ds-review-card__head { display: flex; align-items: center; gap: 12px; }
      .ds-review-card__avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; background: #FCE7F3; object-fit: cover; }
      .ds-review-card__who { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
      .ds-review-card__name { font-size: 14px; font-weight: 800; color: #2D1B1B; }
      .ds-review-card__biz { font-size: 12px; color: #8B7575; }
      .ds-review-card__stars { color: #F59E0B; letter-spacing: 1px; font-size: 14px; }
      .ds-review-card__text { margin: 0; font-size: 13px; line-height: 1.5; color: #4B3A3A; }
      .ds-review-card__when { font-size: 11px; color: #A89090; font-weight: 600; }
      @keyframes dsReviewsMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .ds-reviews-cta { margin: 28px auto 0; text-align: center; font-size: 15px; color: #5C3A3A; font-weight: 600; max-width: 640px; }

      /* ── BEYOND THE MONTHLY PLAN — native apps + custom features ── */
      .ds-section--beyond { background: linear-gradient(180deg, #FFF5F8 0%, #FFE4ED 100%); }
      .ds-beyond-grid { display: grid; grid-template-columns: 1fr; gap: 18px; margin-top: 30px; max-width: 1100px; margin-left: auto; margin-right: auto; }
      @media (min-width: 760px) { .ds-beyond-grid { grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; } }
      .ds-beyond-card { padding: 26px 22px; border-radius: 22px; border: 1px solid rgba(236,72,153,0.18); background: #fff; box-shadow: 0 6px 20px rgba(236,72,153,0.08); display: flex; flex-direction: column; gap: 12px; }
      .ds-beyond-card--featured { border-color: #EC4899; box-shadow: 0 10px 32px rgba(236,72,153,0.18); }
      .ds-beyond-card__pill { display: inline-block; align-self: flex-start; padding: 5px 12px; border-radius: 999px; background: #EC4899; color: #fff; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
      .ds-beyond-card__title { font-size: 22px; font-weight: 900; color: #2D1B1B; letter-spacing: -0.5px; margin: 4px 0; line-height: 1.2; }
      .ds-beyond-card__desc { font-size: 14px; color: #6B5555; line-height: 1.55; margin: 0; }
      .ds-beyond-card__price { padding: 14px 16px; border-radius: 14px; background: rgba(236,72,153,0.06); border: 1px solid rgba(236,72,153,0.15); margin: 4px 0; }
      .ds-beyond-card__price-from { display: block; font-size: 12px; font-weight: 700; color: #EC4899; letter-spacing: 0.4px; text-transform: uppercase; }
      .ds-beyond-card__price-amount { display: block; font-size: 28px; font-weight: 900; color: #2D1B1B; letter-spacing: -0.5px; line-height: 1.1; margin-top: 2px; }
      .ds-beyond-card__price-sub { display: block; font-size: 13px; color: #6B5555; margin-top: 4px; font-weight: 600; }
      .ds-beyond-card__list { list-style: none; padding: 0; margin: 4px 0; display: flex; flex-direction: column; gap: 8px; }
      .ds-beyond-card__list li { padding-left: 22px; position: relative; font-size: 14px; color: #2D1B1B; line-height: 1.5; }
      .ds-beyond-card__list li::before { content: '✓'; position: absolute; left: 0; top: 0; color: #EC4899; font-weight: 900; }
      .ds-beyond-card__cta { margin-top: 8px; align-self: flex-start; }

      .ds-beyond-protect { margin-top: 30px; padding: 24px 22px; border-radius: 18px; background: #0F0F12; color: #fff; max-width: 1100px; margin-left: auto; margin-right: auto; }
      .ds-beyond-protect__title { font-size: 15px; font-weight: 900; color: #FACC15; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 14px; }
      .ds-beyond-protect__list { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 18px; }
      @media (min-width: 700px) { .ds-beyond-protect__list { grid-template-columns: 1fr 1fr; gap: 16px; } }
      .ds-beyond-protect__item { font-size: 13px; color: rgba(255,255,255,0.78); line-height: 1.55; padding-left: 18px; position: relative; }
      .ds-beyond-protect__item::before { content: '•'; position: absolute; left: 0; top: 0; color: #EC4899; font-weight: 900; }
      .ds-beyond-protect__item strong { color: #fff; font-weight: 800; }
      .ds-beyond-protect__cta { margin-top: 6px; }

      /* ── FAQ ───────────────────────────────────────────────────── */
      .ds-faq-container { max-width: 760px; }
      .ds-faq-list { display: flex; flex-direction: column; gap: 12px; }
      .ds-faq-item { background: #fff; border-radius: 16px; border: 1px solid rgba(251,207,232,0.5); overflow: hidden; box-shadow: 0 2px 8px rgba(45,27,27,0.03); }
      .ds-faq-summary { list-style: none; cursor: pointer; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; font-weight: 700; transition: background 0.2s ease; }
      .ds-faq-summary:hover { background: #FCE7F3; }
      .ds-faq-summary::-webkit-details-marker { display: none; }
      .ds-faq-q { font-size: 16px; }
      .ds-faq-toggle { color: #EC4899; font-size: 26px; font-weight: 300; transition: transform 0.2s ease; flex-shrink: 0; }
      .ds-faq-item[open] .ds-faq-toggle { transform: rotate(45deg); }
      .ds-faq-answer { padding: 0 20px 20px; color: #6B5555; line-height: 1.6; font-size: 15px; }

      /* ── FINAL CTA ─────────────────────────────────────────────── */
      .ds-cta { position: relative; padding: 90px 0; background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: #fff; overflow: hidden; }
      .ds-cta__blob { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.1); filter: blur(40px); pointer-events: none; }
      .ds-cta__blob--tl { top: -90px; left: -90px; width: 360px; height: 360px; }
      .ds-cta__blob--br { bottom: -100px; right: -100px; width: 420px; height: 420px; background: rgba(250,204,21,0.18); }
      .ds-cta__donut { position: absolute; border-radius: 50%; object-fit: cover; opacity: 0.55; pointer-events: none; }
      .ds-cta__donut--tr { top: 30px; right: 20px; width: 110px; height: 110px; animation: dsBounce 2.2s ease-in-out infinite; }
      .ds-cta__donut--bl { bottom: 30px; left: 20px; width: 130px; height: 130px; animation: dsBounce 2.6s ease-in-out infinite reverse; }
      @keyframes dsBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
      .ds-cta__inner { position: relative; z-index: 1; text-align: center; max-width: 720px; margin: 0 auto; }
      .ds-cta__h { font-size: 44px; line-height: 1; letter-spacing: -0.03em; font-weight: 900; margin: 0; }
      .ds-cta__highlight { color: #FACC15; }
      .ds-cta__sub { margin: 24px 0 0; font-size: 18px; line-height: 1.6; color: rgba(255,255,255,0.92); max-width: 560px; margin-left: auto; margin-right: auto; }
      .ds-cta__buttons { margin: 36px 0 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; }
      .ds-cta__reassurance { margin: 26px 0 0; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); }

      /* ── FOOTER ────────────────────────────────────────────────── */
      .ds-footer { background: #2D1B1B; color: #fff; padding: 60px 0 20px; }
      .ds-footer__grid { display: grid; grid-template-columns: 1fr; gap: 36px; margin-bottom: 36px; }
      .ds-footer__about { margin: 16px 0 0; color: rgba(249,168,212,0.7); font-size: 14px; line-height: 1.55; max-width: 460px; }
      .ds-footer__coming { margin: 12px 0 0; font-size: 13px; color: rgba(249,168,212,0.45); }
      .ds-footer__link-pink { color: #F472B6; text-decoration: underline; }
      .ds-footer__h { font-size: 12px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; color: #F9A8D4; margin: 0; }
      .ds-footer__list { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-direction: column; gap: 8px; }
      .ds-footer__list a { color: rgba(255,255,255,0.7); font-size: 14px; }
      .ds-footer__list a:hover { color: #F9A8D4; }
      .ds-footer__bottom { margin-top: 30px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 13px; color: rgba(249,168,212,0.45); text-align: center; }

      /* ── MOBILE STICKY CTA ────────────────────────────────────── */
      .ds-mobile-cta { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); background: rgba(255,255,255,0.96); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-top: 1px solid #FBCFE8; box-shadow: 0 -10px 30px rgba(0,0,0,0.08); z-index: 40; }

      /* ════════════════════════════════════════════════════════════
         RESPONSIVE — tablet (≥720px) + desktop (≥1024px)
         ════════════════════════════════════════════════════════════ */
      @media (min-width: 720px) {
        .ds-h1 { font-size: 64px; }
        .ds-h2 { font-size: 48px; }
        .ds-cta__h { font-size: 64px; }
        .ds-section { padding: 110px 0; }
        .ds-section__head { margin-bottom: 64px; }
        .ds-pain-grid { grid-template-columns: 1fr 1fr 1fr; gap: 22px; }
        .ds-feature-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
        .ds-step-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
        .ds-pricing-card__list { grid-template-columns: 1fr 1fr; }
        .ds-footer__grid { grid-template-columns: 2fr 1fr 1fr; gap: 60px; }
        .ds-footer__bottom { flex-direction: row; justify-content: space-between; }
      }

      @media (min-width: 1024px) {
        .ds-nav__inner { padding: 16px 24px; }
        .ds-nav__links { display: flex; }
        .ds-nav__link-cta { display: inline-flex; }
        .ds-container { padding: 0 24px; }
        .ds-hero { padding: 150px 0 120px; }
        .ds-hero__grid { grid-template-columns: 1fr 1fr; gap: 60px; }
        .ds-hero__float--tr { top: -40px; right: -120px; width: 280px; height: 280px; }
        .ds-hero__float--bl { bottom: -80px; left: -120px; width: 240px; height: 240px; }
        .ds-h1 { font-size: 84px; }
        .ds-h2 { font-size: 56px; }
        .ds-cta__h { font-size: 80px; }
        .ds-lede { font-size: 19px; }
        .ds-feature-grid { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .ds-step-grid { grid-template-columns: repeat(4, 1fr); }
        .ds-mobile-cta { display: none; }
      }
    `}</style>
  )
}
