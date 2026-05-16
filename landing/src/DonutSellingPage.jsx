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
  heroDonut:    'https://ik.imagekit.io/nepgaxllc/Untitleddasddasdfssdfsdfsdsdasdss-removebg-preview.png',
  bouncing:     'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_26_20%20AM.png?updatedAt=1778707604129',
  bottomLeft:   'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_30_51%20AM.png',
  bostonCream:  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2008_45_54%20PM.png',
  strawberry:   'https://ik.imagekit.io/nepgaxllc/Untitledasdaaaavdddddd-removebg-preview%20(1).png',
  chocolate:    'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2009_19_03%20PM.png',
  flavourOrb:   'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_56_26%20AM.png',
}

// Bigger interactive demo lower on the page — uses the frozen
// donuts.html static snapshot served by the LANDING vite (so 5173
// is correct here, not 5177).
const DEMO_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5173/themes/donuts.html'
  : '/themes/donuts.html'

// Landing splash themes — the donut app's customer-facing splash
// supports 6 variants. The hero phone cycles through each so visitors
// see the full design range. Each URL forces a specific theme via
// the `?landing=<id>` query param the donut app respects.
//
// Dev vs prod URL resolution:
//   - Dev: the donut app's vite server runs on a separate port (5177
//     per the monorepo root package.json) with base '/food/chat/'.
//     We point the iframe at that port directly so it loads the
//     actual donut app, not the landing site at :5173.
//   - Prod: Vercel rewrites '/food/chat/*' to the food-basic build.
//     Same-origin works fine via window.location.origin.
const LANDING_THEME_PREVIEWS = (() => {
  let origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.hostname === 'localhost'
      ? 'http://localhost:5177'   // donut app dev port (see /package.json scripts)
      : window.location.origin
  }
  const themes = ['donuts', 'classic', 'glass', 'discover', 'float', 'warm']
  return themes.map(id => `${origin}/food/chat/?vendor=00000000-0000-0000-0000-00000000d0c0&landing=${id}`)
})()

const FEATURES = [
  { icon: '🍩', title: 'Beautiful menu cards',   desc: 'Photos, descriptions, prices, allergens — customise card layout (grid / horizontal / full-width).' },
  { icon: '📲', title: 'WhatsApp ordering',       desc: 'Customers order through the WhatsApp number you already use. No new app to learn.' },
  { icon: '🛵', title: 'Delivery + pickup',       desc: 'Zones, per-km rates, free-above thresholds, max-distance — all in your hands.' },
  { icon: '💳', title: 'Multiple payment methods', desc: 'Bank transfer, e-wallet (GoPay / OVO / Dana), or cash on delivery — you choose.' },
  { icon: '⭐', title: 'Verified reviews',         desc: 'Only customers with a real order ref number can leave a review. No spam.' },
  { icon: '🎨', title: 'Total brand control',     desc: 'Your logo, colours, fonts, hero text, custom landing splash. Edit live, see live.' },
  { icon: '🌍', title: 'Multi-language',          desc: 'English + Indonesian out of the box. Vietnamese, Malay, Filipino coming Q3 2026.' },
  { icon: '📊', title: 'Promotions + deals',      desc: 'BUY1GET1, % off, time-limited, free-delivery thresholds, scrolling promo banners.' },
]

const STEPS = [
  { step: 1, time: '30 sec', icon: '✍️',  title: 'Sign up',            desc: 'Email + your WhatsApp number. That\'s it.' },
  { step: 2, time: '5 min',  icon: '🍩',  title: 'Add your donuts',     desc: 'Upload photos, set prices, paste a description.' },
  { step: 3, time: '10 sec', icon: '🔗',  title: 'Share your link',     desc: 'Get streetlocal.live/yourshop instantly. Custom domain optional.' },
  { step: 4, time: 'Forever', icon: '🎉', title: 'Take orders',         desc: 'Orders ping your WhatsApp. You bake. You earn 100%.' },
]

const PRICING_INCLUDES = [
  'Unlimited donuts in menu',
  'Unlimited orders / month',
  'In-app chat + WhatsApp ordering',
  'All 16 payment gateways (Midtrans · QRIS · Stripe · …)',
  'Delivery + pickup zones',
  'Marketing banners + auto-post to chat',
  'Promo codes (% / flat / first-order / expiry)',
  'Tipping at checkout (10/15/20/custom)',
  'Loyalty stamps + member card',
  '4-template A4 invoices with your letterhead',
  'Tax / VAT (PPN 11% preset)',
  'Production planner + wastage logger',
  'Kitchen Display System (KDS) for tablets',
  'Build-your-own dozen mix box',
  'Bluetooth thermal printer',
  'Customer accounts + order history',
  'Pre-order windows (Mother\'s Day, Valentine\'s)',
  'Catering / wholesale orders',
  'End-of-day cash reconciliation',
  'Self-serve kiosk mode',
  'Allergen tags + recipe cost analysis',
  'SMS notifications (Twilio)',
  'Email campaigns (Resend)',
  'CSV sales export · backup & restore',
  'Image library + curated stock photos',
  '11 languages, 15 currencies',
  '24/7 hosting + daily backups',
  'WhatsApp support',
  'No commission, ever',
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

const FAQS = [
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
  // Hero phone cycles through 6 landing splash designs every 5s so a
  // visitor sees the full design range without scrolling. Indexes the
  // LANDING_THEME_PREVIEWS array; clicking a chip below the phone
  // pauses auto-rotate + jumps to that theme.
  const [heroThemeIdx, setHeroThemeIdx] = useState(0)
  const [heroThemePaused, setHeroThemePaused] = useState(false)
  useEffect(() => {
    if (heroThemePaused) return
    const t = setInterval(() => setHeroThemeIdx(i => (i + 1) % LANDING_THEME_PREVIEWS.length), 5000)
    return () => clearInterval(t)
  }, [heroThemePaused])
  // Settings dropdown — slides down from the ⚙ button on the right of
  // the nav. Holds 4 menu items that each open a full-screen info page.
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePage, setActivePage] = useState(null) // 'faq' | 'setup' | 'about' | 'support'
  const [supportMsg, setSupportMsg] = useState('')
  // Support online/offline status — true when within Mon-Sat 09:00–21:00
  // local time. Drives the dot colour + label in the chat header.
  const supportOnline = (() => {
    const d = new Date()
    const day = d.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const hour = d.getHours()
    return day >= 1 && day <= 6 && hour >= 9 && hour < 21
  })()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when a full-screen info page is open — otherwise the
  // page under the overlay scrolls behind and breaks the reading flow.
  useEffect(() => {
    if (!activePage) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [activePage])

  const openPage = (p) => { setMenuOpen(false); setActivePage(p) }

  return (
    <div className="ds">
      <PageStyles />

      {/* ═══ NAVIGATION ═══ */}
      <header className={`ds-nav ${scrolled ? 'ds-nav--scrolled' : ''}`}>
        <div className="ds-nav__inner">
          <a href="#top" className="ds-brand" aria-label="Donut Selling App home">
            <img
              src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2016,%202026,%2003_24_01%20PM.png"
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
          {/* Settings ⚙ — opens a slide-down menu with the four info
              pages (FAQ, Setup, About us, Customer service). Replaces
              the old "See demo / Start your shop" CTA cluster. */}
          <button
            type="button"
            className={`ds-gear ${menuOpen ? 'ds-gear--open' : ''}`}
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            <span aria-hidden style={{ display: 'block', transition: 'transform 0.4s ease' }}>⚙</span>
          </button>
        </div>
        {menuOpen && (
          <div className="ds-menu-drop" role="menu">
            <button type="button" className="ds-menu-row" role="menuitem" onClick={() => openPage('faq')}>
              <span className="ds-menu-icon">❓</span>
              <span className="ds-menu-text">
                <span className="ds-menu-title">FAQ</span>
                <span className="ds-menu-sub">Common questions — answered</span>
              </span>
            </button>
            <button type="button" className="ds-menu-row" role="menuitem" onClick={() => openPage('setup')}>
              <span className="ds-menu-icon">🚀</span>
              <span className="ds-menu-text">
                <span className="ds-menu-title">Setup</span>
                <span className="ds-menu-sub">5 steps to your live shop</span>
              </span>
            </button>
            <button type="button" className="ds-menu-row" role="menuitem" onClick={() => openPage('about')}>
              <span className="ds-menu-icon">🏠</span>
              <span className="ds-menu-text">
                <span className="ds-menu-title">About us</span>
                <span className="ds-menu-sub">Who built this and why</span>
              </span>
            </button>
            <button type="button" className="ds-menu-row" role="menuitem" onClick={() => openPage('support')}>
              <span className="ds-menu-icon">💬</span>
              <span className="ds-menu-text">
                <span className="ds-menu-title">Customer service</span>
                <span className="ds-menu-sub">Email, WhatsApp, hours</span>
              </span>
            </button>
          </div>
        )}
      </header>
      {/* Backdrop closes the menu when tapping outside */}
      {menuOpen && <div className="ds-menu-backdrop" aria-hidden onClick={() => setMenuOpen(false)} />}

      {/* ═══ INFO PAGES (full-screen overlays) ═══
          Support gets its own chat-window layout below, so we skip the
          generic .ds-info card shell for it. */}
      {activePage && activePage !== 'support' && (
        <div className="ds-info" role="dialog" aria-modal="true">
          <div className="ds-info__bar">
            <button type="button" className="ds-info__back" aria-label="Close" onClick={() => setActivePage(null)}>←</button>
            <div className="ds-info__title">
              {activePage === 'faq' && 'FAQ'}
              {activePage === 'setup' && 'Setup'}
              {activePage === 'about' && 'About us'}
              {activePage === 'support' && 'Customer service'}
            </div>
            <span style={{ width: 36 }} />
          </div>
          <div className="ds-info__body">
            {activePage === 'faq' && (
              <>
                <p className="ds-info__lede">Short answers to the questions every donut seller asks before signing up.</p>
                {FAQS.map(([q, a], i) => (
                  <details key={i} className="ds-info-faq" open={i === 0}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </>
            )}

            {activePage === 'setup' && (
              <>
                <p className="ds-info__lede">From signup to your first sale in about 5 minutes. No installs, no cards, no contracts.</p>
                <ol className="ds-info-steps">
                  <li>
                    <strong>1. Sign up with your WhatsApp number.</strong>
                    <p>That's your login. No long forms, no email verification loop. You're inside the app within 30 seconds.</p>
                  </li>
                  <li>
                    <strong>2. Add your donuts.</strong>
                    <p>Photo, name, price, a short description. Repeat for every flavour. Mark some as Popular and they get a yellow badge. Out of stock → toggle off, it hides from customers automatically.</p>
                  </li>
                  <li>
                    <strong>3. Pick your order channel.</strong>
                    <p>Two modes. <em>WhatsApp orders</em> — customers tap "Order now" and the cart drops into your WhatsApp DM. <em>In-app chat</em> — customers pay by card / QRIS / bank in your shop, and you reply in a chat panel. You can switch any time.</p>
                  </li>
                  <li>
                    <strong>4. Make it yours.</strong>
                    <p>Upload your logo, pick a theme colour, choose card style (grid, fullwidth, horizontal). Edit the landing text. Add a delivery zone with a per-km rate. The whole brand surface is editable.</p>
                  </li>
                  <li>
                    <strong>5. Pay to activate. Then share your link.</strong>
                    <p>Rp 35,000/month for WhatsApp orders, Rp 50,000/month for in-app chat + payments. Pay via QRIS, GoPay, OVO, ShopeePay, card, or bank transfer. Your link goes live the moment payment clears. Copy it, post it on your Instagram bio, and you're trading.</p>
                  </li>
                </ol>
              </>
            )}

            {activePage === 'about' && (
              <>
                <p className="ds-info__lede">A small team building tools that let local sellers keep their margin.</p>
                <h3 className="ds-info-h3">Who we are</h3>
                <p>StreetLocal is a family of apps built for street vendors, makers, and small businesses across Southeast Asia. We started with food because that's where the platform commissions hurt most — donut shops, noodle stalls, coffee carts — small operations giving up 20-30% per order to apps that didn't make their product.</p>
                <h3 className="ds-info-h3">Why we built this</h3>
                <p>Most "shop builders" are designed for shops that already have a customer base, a logo, an SEO plan, a credit card on file. Donut sellers don't need a website. They need a phone-shaped storefront they can drop into a WhatsApp message — and a way to get paid without losing a third of the sale.</p>
                <h3 className="ds-info-h3">Where we operate</h3>
                <p>Indonesia first (because that's where we live), then Malaysia, Singapore, Thailand, Vietnam, and the Philippines. Currency, language, and payment rails are localised for each market. 11 UI languages so far — every menu in the app translates to the customer's phone language automatically.</p>
                <h3 className="ds-info-h3">What we don't do</h3>
                <p>We don't take a commission on your orders. We don't see your customers' card data — payments go straight from the buyer's bank to your bank via your chosen gateway. We don't lock your customer list inside a closed platform; you own the relationship.</p>
              </>
            )}

          </div>
        </div>
      )}

      {/* ═══ CUSTOMER SERVICE CHAT WINDOW ═══
          Full-screen WhatsApp-style chat layout: provided bg image,
          logo + Street Local + online/offline status in the header,
          welcome bubbles in the thread, type-and-send footer that
          opens WhatsApp pre-filled with the customer's message. */}
      {activePage === 'support' && (
        <div className="ds-cs" role="dialog" aria-modal="true">
          <img loading="lazy" className="ds-cs__bg" src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2015,%202026,%2002_40_27%20PM.png" alt="" aria-hidden />
          <div className="ds-cs__scrim" aria-hidden />

          {/* Header: back arrow + logo + Street Local + status dot */}
          <div className="ds-cs__header">
            <button type="button" className="ds-cs__back" aria-label="Close" onClick={() => setActivePage(null)}>←</button>
            <img loading="lazy" className="ds-cs__logo" src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%206,%202026,%2002_50_47%20PM.png?updatedAt=1778053871353" alt="Street Local" />
            <div className="ds-cs__brand">
              <div className="ds-cs__name">Street Local</div>
              <div className="ds-cs__status">
                <span className={`ds-cs__dot ${supportOnline ? 'ds-cs__dot--on' : 'ds-cs__dot--off'}`} />
                <span>{supportOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Welcome thread */}
          <div className="ds-cs__thread">
            <div className="ds-cs__bubble ds-cs__bubble--in">
              <div className="ds-cs__bubble-text">👋 Welcome to StreetLocal support. We respond within one business day — most issues are resolved same-day.</div>
              <div className="ds-cs__bubble-time">Mon–Sat · 09:00 – 21:00 WIB</div>
            </div>
            <div className="ds-cs__bubble ds-cs__bubble--in">
              <div className="ds-cs__bubble-text">How can we help you today?</div>
              <div className="ds-cs__quick">
                <a className="ds-cs__quick-btn" href="mailto:streetlocallive@gmail.com">📧 Email us</a>
                <a className="ds-cs__quick-btn" href="https://wa.me/6281234567890?text=Hi%20StreetLocal" target="_blank" rel="noreferrer">📱 WhatsApp</a>
              </div>
            </div>
            <div className="ds-cs__bubble ds-cs__bubble--in">
              <div className="ds-cs__bubble-text">Common topics:</div>
              <div className="ds-cs__quick">
                <a className="ds-cs__quick-btn" href="https://wa.me/6281234567890?text=My%20link%20isn%27t%20working%20after%20payment" target="_blank" rel="noreferrer">My link isn't working</a>
                <a className="ds-cs__quick-btn" href="https://wa.me/6281234567890?text=Payment%20gateway%20not%20connecting" target="_blank" rel="noreferrer">Payment gateway issue</a>
                <a className="ds-cs__quick-btn" href="https://wa.me/6281234567890?text=I%20want%20to%20cancel%20my%20subscription" target="_blank" rel="noreferrer">Cancel my subscription</a>
              </div>
            </div>
            {!supportOnline && (
              <div className="ds-cs__bubble ds-cs__bubble--in ds-cs__bubble--note">
                <div className="ds-cs__bubble-text">🌙 We're offline right now. Send a message anyway — we'll reply by email next morning.</div>
              </div>
            )}
          </div>

          {/* Footer input — submits to WhatsApp with the typed text */}
          <form
            className="ds-cs__footer"
            onSubmit={(e) => {
              e.preventDefault()
              const t = supportMsg.trim()
              if (!t) return
              window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(t)}`, '_blank', 'noopener,noreferrer')
              setSupportMsg('')
            }}
          >
            <input
              type="text"
              className="ds-cs__input"
              placeholder="Type a message…"
              value={supportMsg}
              onChange={(e) => setSupportMsg(e.target.value)}
              maxLength={500}
            />
            <button type="submit" className="ds-cs__send" aria-label="Send">
              <span aria-hidden>➤</span>
            </button>
          </form>
        </div>
      )}

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
              <li><span className="ds-check">✓</span> 7-day free trial</li>
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
            {/* Theme picker chips — click any to jump to that design.
                Auto-rotate pauses after first manual selection so the
                visitor can compare. */}
            <div className="ds-theme-chips" aria-label="Landing splash theme previews">
              {['Donuts','Classic','Glass','Discover','Float','Warm'].map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setHeroThemePaused(true); setHeroThemeIdx(i) }}
                  className={`ds-theme-chip ${heroThemeIdx === i ? 'ds-theme-chip--active' : ''}`}
                  aria-pressed={heroThemeIdx === i}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ds-phone__tag">
              <span className="ds-phone__tag-dot" aria-hidden></span>
              {heroThemePaused
                ? `${['Donuts','Classic','Glass','Discover','Float','Warm'][heroThemeIdx]} theme — tap a chip to switch`
                : 'Cycling 6 landing designs · tap to pause'}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PAIN POINTS ═══ */}
      <section className="ds-section ds-section--white">
        <div className="ds-container">
          <div className="ds-section__head">
            <span className="ds-kicker">The problem</span>
            <h2 className="ds-h2">Stop losing orders to…</h2>
          </div>
          <div className="ds-pain-grid">
            {[
              { icon: '📱', title: 'WhatsApp chaos',       desc: 'Pesanan tersembunyi di DM. Customer menunggu. Lupa siapa pesan apa.' },
              { icon: '🧾', title: 'Manual menu updates',  desc: 'Edit bio Instagram setiap kali rasa habis atau harga berubah. Capek.' },
              { icon: '💸', title: '20–30% komisi aplikasi',  desc: 'GrabFood dan Gojek makan margin Anda. Setiap. Satu. Pesanan.' },
            ].map((p, i) => (
              <div key={i} className="ds-pain-card">
                <div className="ds-pain-card__icon">{p.icon}</div>
                <h3 className="ds-pain-card__title">{p.title}</h3>
                <p className="ds-pain-card__desc">{p.desc}</p>
              </div>
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
            <h2 className="ds-h2">Made in Yogyakarta.<br /><span className="ds-pink">Sized for warungs, kafe, & UMKM.</span></h2>
            <p className="ds-section__sub">
              Most "POS" apps come from the US and charge in dollars. We built this in Indonesia, for the way Indonesian customers actually buy donuts.
            </p>
          </div>
          <div className="ds-indo-grid">
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">💳 Pembayaran lokal</div>
              <h3>All Indonesian payment methods</h3>
              <p>GoPay, OVO, DANA, ShopeePay, QRIS, virtual account, kartu, transfer bank. Connect Midtrans atau Xendit langsung — funds masuk ke rekening Anda, bukan ke kami.</p>
              <div className="ds-indo-card__chips">
                <span>GoPay</span>
                <span>OVO</span>
                <span>DANA</span>
                <span>ShopeePay</span>
                <span>QRIS</span>
                <span>BCA</span>
                <span>Mandiri</span>
                <span>BRI</span>
              </div>
            </div>
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">💸 Harga UMKM</div>
              <h3>Rp 38,000 per bulan. Sudah termasuk semua.</h3>
              <p>Tidak ada komisi per pesanan. Tidak ada biaya setup. Tidak perlu kartu kredit. Bandingkan: Shopify Rp 500,000+ per bulan, GrabFood ambil 20-30% per pesanan, ChatRestaurant baru ada di sini.</p>
              <div className="ds-indo-card__compare">
                <div><strong>StreetLocal</strong><span style={{ color: '#22C55E' }}>Rp 38,000/bln · 0% komisi</span></div>
                <div><strong>GrabFood / Gojek</strong><span style={{ color: '#EF4444' }}>Gratis daftar · 20-30% per pesanan</span></div>
                <div><strong>Shopify</strong><span style={{ color: '#EF4444' }}>~Rp 500,000/bln + biaya gateway</span></div>
              </div>
            </div>
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">📜 Pajak siap pakai</div>
              <h3>PPN 11% + Faktur Pajak</h3>
              <p>PPN 11% sudah preset. NPWP & nomor faktur otomatis di setiap invoice. 4 template invoice — pilih yang cocok untuk akuntan Anda. Auto-kirim ke WhatsApp customer setelah bayar.</p>
            </div>
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">💬 Bahasa Indonesia</div>
              <h3>Customer lihat menu dalam Bahasa</h3>
              <p>Aplikasi customer-facing penuh Bahasa Indonesia. Bahasa Inggris juga ada — kalau ada turis di Bali atau expat di Jakarta, mereka switch dengan 1 klik.</p>
            </div>
            <div className="ds-indo-card">
              <div className="ds-indo-card__head">📱 Hemat data + RAM</div>
              <h3>Jalan di HP Android murah</h3>
              <p>PWA = ukuran cuma 2MB, bukan 200MB seperti aplikasi native. Customer pakai HP RAM 2GB? Tetap lancar. Customer di pelosok dengan sinyal lambat? Tetap order.</p>
            </div>
            <div className="ds-indo-card ds-indo-card--featured">
              <div className="ds-indo-card__head">🎯 Sudah lengkap</div>
              <h3>Tidak ada fitur terkunci di paket Standard</h3>
              <p>Loyalty stamps, marketing banner, promo code, KDS untuk dapur, invoice A4, tip handling, mix-and-match dozen, customer accounts, kiosk mode — semua sudah termasuk di Rp 38,000. Upgrade ke Pro hanya kalau butuh multi-staff atau automasi.</p>
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
                <div className="ds-feature-card__icon" aria-hidden>{f.icon}</div>
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
            <h2 className="ds-h2">One price. <span className="ds-pink">No surprises.</span></h2>
            <p className="ds-section__sub">No commission per order. No setup fee. No card upfront.</p>
          </div>
          <div className="ds-pricing-wrap">
            <div className="ds-pricing-glow" aria-hidden></div>
            <div className="ds-pricing-card">
              <div className="ds-pricing-card__head">
                <span className="ds-kicker ds-kicker--small">Everything included</span>
                <span className="ds-badge-pop">Most popular</span>
              </div>
              <div className="ds-pricing-card__price">
                <span className="ds-price-num">38,000</span>
                <span className="ds-price-cur">IDR</span>
              </div>
              <p className="ds-price-sub">per month · ~$2.50 USD · everything included</p>
              <ul className="ds-pricing-card__list">
                {PRICING_INCLUDES.map((feat, i) => (
                  <li key={i}><span className="ds-check">✓</span>{feat}</li>
                ))}
              </ul>
              <a href="#" className="ds-btn ds-btn--primary ds-btn--block">Start your 7-day free trial →</a>
              <p className="ds-price-reassurance">
                <span className="ds-check">✓</span> No card required &nbsp;·&nbsp;
                <span className="ds-check">✓</span> Cancel anytime &nbsp;·&nbsp;
                <span className="ds-check">✓</span> Your data stays yours
              </p>
            </div>
          </div>
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
          <h2 className="ds-h2">Built with shops in <span className="ds-pink">Yogyakarta, Jakarta, Bali</span>.</h2>
          <p className="ds-section__sub">
            Real testimonials coming soon. Want to be one of the first 10 donut shops to launch?{' '}
            <a href="#pricing" className="ds-link">Start your trial</a> and get 50% off your first 3 months.
          </p>
          <div className="ds-trust-marquee" aria-hidden>
            <div className="ds-trust-marquee__track">
              {['Donut Lab ★★★★★ "Set up in 6 min"', 'Sweet Roll · Yogyakarta', 'Boba+Donut · Jakarta',
                'Frosted Co · Bali', '★★★★★ "First order in 14 min"', 'Glazed Hour · Surabaya',
                'Donut Lab ★★★★★ "Set up in 6 min"', 'Sweet Roll · Yogyakarta', 'Boba+Donut · Jakarta',
                'Frosted Co · Bali', '★★★★★ "First order in 14 min"', 'Glazed Hour · Surabaya',
              ].map((t, i) => (
                <span key={i} className="ds-trust-marquee__item">{t}</span>
              ))}
            </div>
          </div>
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

          {/* Protection / ownership card */}
          <div className="ds-beyond-protect">
            <div className="ds-beyond-protect__title">What's protected, what's yours</div>
            <div className="ds-beyond-protect__list">
              <div className="ds-beyond-protect__item">
                <strong>Source code stays with StreetLocal.</strong> We build the binary on our servers — your app cannot be extracted or transferred. You're licensing a finished product, not buying our codebase.
              </div>
              <div className="ds-beyond-protect__item">
                <strong>Your developer accounts are yours.</strong> Apple ($99/yr) + Google ($25 one-time) registered in your bakery's legal name. You own the listing, reviews, and payouts.
              </div>
              <div className="ds-beyond-protect__item">
                <strong>Donut sales = 0% Apple/Google cut.</strong> Physical goods are exempt from the 30% in-app purchase tax. You keep using your own payment gateway.
              </div>
              <div className="ds-beyond-protect__item">
                <strong>If you cancel:</strong> the live app keeps working, store listing stays yours, but the app stops receiving updates and the source-code license terminates.
              </div>
            </div>
            <a href="mailto:streetlocallive@gmail.com?subject=Native%20app%20request" className="ds-btn ds-btn--primary ds-beyond-protect__cta">Request a native app quote</a>
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
                src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2016,%202026,%2003_24_01%20PM.png"
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
      .ds { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FFF8F8; color: #2D1B1B; -webkit-font-smoothing: antialiased; line-height: 1.5; }
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

      /* ── GEAR + SLIDE-DOWN MENU ───────────────────────────────── */
      .ds-gear { width: 42px; height: 42px; border-radius: 12px; border: 1px solid rgba(236,72,153,0.25); background: linear-gradient(180deg, #fff 0%, #FFF5F8 100%); color: #EC4899; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 2px 8px rgba(236,72,153,0.12); transition: all 0.2s ease; line-height: 1; }
      .ds-gear:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(236,72,153,0.22); }
      .ds-gear--open span { transform: rotate(90deg); }
      /* Backdrop sits BELOW the header (z-index 50) so the menu drop —
         which lives inside the header — stays crisp on top while the
         page content underneath dims. */
      .ds-menu-backdrop { position: fixed; inset: 0; background: rgba(45,27,27,0.35); z-index: 40; backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); }
      .ds-menu-drop { position: absolute; top: 100%; right: 12px; left: 12px; margin-top: 8px; padding: 8px; background: #fff; border-radius: 18px; box-shadow: 0 20px 50px rgba(0,0,0,0.18), 0 4px 14px rgba(236,72,153,0.15); z-index: 95; animation: dsMenuDrop 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); display: flex; flex-direction: column; gap: 4px; max-width: 480px; margin-left: auto; }
      @keyframes dsMenuDrop { 0% { transform: translateY(-12px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      .ds-menu-row { display: flex; align-items: center; gap: 14px; padding: 14px 14px; border-radius: 14px; border: none; background: transparent; cursor: pointer; text-align: left; font-family: inherit; transition: background 0.15s ease; min-height: 64px; }
      .ds-menu-row:hover { background: #FDF2F8; }
      .ds-menu-row:active { background: #FCE7F3; }
      .ds-menu-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #FFE4EC 0%, #FBCFE8 100%); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
      .ds-menu-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .ds-menu-title { font-size: 16px; font-weight: 800; color: #2D1B1B; line-height: 1.2; }
      .ds-menu-sub { font-size: 13px; font-weight: 500; color: #8B6B6B; line-height: 1.3; }

      /* ── FULL-SCREEN INFO PAGE OVERLAY ────────────────────────── */
      .ds-info { position: fixed; inset: 0; z-index: 100; background: #FFF8FA; display: flex; flex-direction: column; animation: dsInfoSlide 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
      @keyframes dsInfoSlide { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      .ds-info__bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 12px; background: #fff; border-bottom: 1px solid rgba(236,72,153,0.12); position: sticky; top: 0; z-index: 2; box-shadow: 0 2px 8px rgba(45,27,27,0.04); }
      .ds-info__back { width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(236,72,153,0.2); background: #fff; color: #EC4899; font-size: 20px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1; }
      .ds-info__back:hover { background: #FDF2F8; }
      .ds-info__title { flex: 1; text-align: center; font-size: 17px; font-weight: 800; color: #2D1B1B; }
      .ds-info__body { flex: 1; overflow-y: auto; padding: 18px 18px 60px; max-width: 720px; width: 100%; margin: 0 auto; -webkit-overflow-scrolling: touch; }
      .ds-info__lede { font-size: 15px; line-height: 1.55; color: #5C3A3A; margin: 0 0 22px; padding: 14px 16px; background: linear-gradient(135deg, #FFE4EC 0%, #FCE7F3 100%); border-radius: 14px; border-left: 4px solid #EC4899; }
      .ds-info-h3 { font-size: 17px; font-weight: 800; color: #2D1B1B; margin: 22px 0 8px; }
      .ds-info__body p { font-size: 14px; line-height: 1.6; color: #4A2E2E; margin: 0 0 12px; }
      .ds-info__body p em { color: #EC4899; font-style: normal; font-weight: 700; }
      .ds-info-faq { background: #fff; border-radius: 12px; border: 1px solid rgba(236,72,153,0.12); padding: 0; margin-bottom: 10px; overflow: hidden; }
      .ds-info-faq summary { padding: 14px 16px; font-size: 14px; font-weight: 700; color: #2D1B1B; cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; }
      .ds-info-faq summary::-webkit-details-marker { display: none; }
      .ds-info-faq summary::after { content: '+'; color: #EC4899; font-size: 20px; font-weight: 800; transition: transform 0.2s ease; flex-shrink: 0; }
      .ds-info-faq[open] summary::after { transform: rotate(45deg); }
      .ds-info-faq p { padding: 0 16px 14px; margin: 0; font-size: 14px; line-height: 1.55; color: #5C3A3A; }
      .ds-info-steps { list-style: none; padding: 0; margin: 0; counter-reset: step; }
      .ds-info-steps li { background: #fff; border-radius: 14px; padding: 16px; margin-bottom: 10px; border: 1px solid rgba(236,72,153,0.12); }
      .ds-info-steps li strong { display: block; font-size: 15px; font-weight: 800; color: #2D1B1B; margin-bottom: 6px; }
      .ds-info-steps li p { font-size: 14px; line-height: 1.6; color: #5C3A3A; margin: 0; }
      .ds-info-card { background: #fff; border-radius: 14px; padding: 16px; margin-bottom: 12px; border: 1px solid rgba(236,72,153,0.12); }
      .ds-info-card__label { font-size: 12px; font-weight: 800; color: #8B6B6B; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
      .ds-info-card__value { display: block; font-size: 16px; font-weight: 800; color: #EC4899; text-decoration: none; margin-bottom: 6px; word-break: break-word; }
      .ds-info-card__value:hover { color: #BE185D; text-decoration: underline; }
      .ds-info-card__hint { font-size: 13px; color: #8B6B6B; line-height: 1.5; }

      /* ── CUSTOMER SERVICE CHAT WINDOW ───────────────────────── */
      .ds-cs { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; background: #0a0a0a; animation: dsInfoSlide 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); overflow: hidden; }
      .ds-cs__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none; }
      .ds-cs__scrim { position: absolute; inset: 0; background: rgba(0,0,0,0.35); z-index: 0; pointer-events: none; }
      .ds-cs__header { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: linear-gradient(180deg, rgba(236,72,153,0.95) 0%, rgba(190,24,93,0.95) 100%); box-shadow: 0 4px 16px rgba(236,72,153,0.35); flex-shrink: 0; }
      .ds-cs__back { width: 36px; height: 36px; border-radius: 18px; background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 18px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0; line-height: 1; }
      .ds-cs__logo { width: 44px; height: 44px; border-radius: 22px; object-fit: cover; background: #fff; border: 2px solid rgba(255,255,255,0.5); flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
      .ds-cs__brand { flex: 1; min-width: 0; color: #fff; }
      .ds-cs__name { font-size: 16px; font-weight: 900; line-height: 1.15; }
      .ds-cs__status { font-size: 13px; opacity: 0.95; margin-top: 2px; display: flex; align-items: center; gap: 5px; }
      .ds-cs__dot { width: 8px; height: 8px; border-radius: 4px; flex-shrink: 0; }
      .ds-cs__dot--on  { background: #22C55E; box-shadow: 0 0 6px rgba(34,197,94,0.9); }
      .ds-cs__dot--off { background: #EF4444; box-shadow: 0 0 6px rgba(239,68,68,0.85); }
      .ds-cs__thread { position: relative; z-index: 1; flex: 1; overflow-y: auto; padding: 14px 12px; display: flex; flex-direction: column; gap: 8px; -webkit-overflow-scrolling: touch; }
      .ds-cs__bubble { max-width: 82%; padding: 10px 14px; border-radius: 16px; align-self: flex-start; background: linear-gradient(180deg, #FCE4EC 0%, #F8BBD0 100%); color: #3a1a2a; border: 1px solid rgba(236,72,153,0.25); box-shadow: 0 2px 10px rgba(236,72,153,0.18); }
      .ds-cs__bubble--note { background: linear-gradient(180deg, rgba(250,204,21,0.95) 0%, rgba(245,158,11,0.95) 100%); color: #2D1B0A; border-color: rgba(245,158,11,0.4); }
      .ds-cs__bubble-text { font-size: 14px; line-height: 1.45; font-weight: 500; }
      .ds-cs__bubble-time { font-size: 12px; margin-top: 6px; opacity: 0.7; font-weight: 600; }
      .ds-cs__quick { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
      .ds-cs__quick-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 16px; background: rgba(0,0,0,0.78); color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: transform 0.15s ease; }
      .ds-cs__quick-btn:hover { transform: translateY(-1px); }
      .ds-cs__footer { position: relative; z-index: 2; display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px calc(env(safe-area-inset-bottom, 0px) + 10px); background: rgba(0,0,0,0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
      .ds-cs__input { flex: 1; padding: 12px 16px; border-radius: 22px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.08); color: #fff; font-size: 14px; outline: none; font-family: inherit; min-height: 44px; }
      .ds-cs__input::placeholder { color: rgba(255,255,255,0.45); }
      .ds-cs__send { width: 44px; height: 44px; border-radius: 22px; border: none; background: linear-gradient(180deg, #EC4899 0%, #BE185D 100%); color: #fff; font-size: 18px; cursor: pointer; box-shadow: 0 4px 12px rgba(236,72,153,0.5); padding: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
      .ds-cs__send:hover { transform: translateY(-1px); }

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
      .ds-hero { position: relative; padding: 90px 0 60px; overflow: hidden; }
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

      /* View demo — single-line link with a running shimmer-glow
         that sweeps left-to-right every 2.4s. Uses background-clip:
         text so the gradient masks to the letterforms. Falls back
         to plain pink when -webkit-background-clip isn't supported. */
      .ds-view-demo {
        display: inline-block; padding: 4px 2px;
        font-size: 15px; font-weight: 800; letter-spacing: 0.02em;
        text-decoration: none; text-transform: uppercase;
        color: #EC4899;
        background: linear-gradient(90deg, #EC4899 0%, #EC4899 35%, #fff7fb 50%, #EC4899 65%, #EC4899 100%);
        background-size: 220% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: dsViewDemoShine 2.4s linear infinite;
        position: relative;
      }
      .ds-view-demo::after {
        content: ' →';
        -webkit-text-fill-color: #EC4899;
        color: #EC4899;
        transition: transform 0.2s ease;
        display: inline-block;
        margin-left: 2px;
      }
      .ds-view-demo:hover::after { transform: translateX(3px); }
      @keyframes dsViewDemoShine {
        0%   { background-position: 220% 0; }
        100% { background-position: -120% 0; }
      }
      @media (min-width: 640px) { .ds-view-demo { font-size: 16px; } }
      @media (min-width: 980px) { .ds-view-demo { font-size: 17px; } }
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
      .ds-hero__float { position: absolute; border-radius: 50%; object-fit: cover; display: none; pointer-events: none; }
      .ds-hero__float--tr { top: -40px; right: -120px; width: 280px; height: 280px; filter: drop-shadow(0 30px 60px rgba(236,72,153,0.22)); }
      .ds-hero__float--bl { bottom: -80px; left: -120px; width: 240px; height: 240px; filter: drop-shadow(0 30px 60px rgba(34,211,238,0.18)); }
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

      /* Theme picker chips below the hero phone — controls the
         cycling preview iframe. Active chip highlighted in pink. */
      .ds-theme-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 24px auto 0; max-width: 360px; }
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

      /* ── FEATURES ─────────────────────────────────────────────── */
      .ds-feature-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
      .ds-feature-card { padding: 26px; background: #fff; border-radius: 22px; border: 1px solid rgba(251,207,232,0.5); box-shadow: 0 4px 14px rgba(45,27,27,0.04); transition: all 0.25s ease; }
      .ds-feature-card:hover { transform: translateY(-4px); box-shadow: 0 22px 50px rgba(236,72,153,0.18); border-color: #F9A8D4; }
      .ds-feature-card__icon { width: 56px; height: 56px; border-radius: 16px; background: #FCE7F3; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; transition: transform 0.25s ease; }
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
      .ds-pricing-wrap { position: relative; max-width: 620px; margin: 0 auto; }
      .ds-pricing-glow { position: absolute; inset: -10px; background: linear-gradient(135deg, #F472B6, #EC4899); border-radius: 32px; filter: blur(28px); opacity: 0.35; z-index: 0; }
      .ds-pricing-card { position: relative; z-index: 1; background: #fff; border-radius: 28px; padding: 36px; box-shadow: 0 30px 60px rgba(236,72,153,0.22); border: 1px solid rgba(251,207,232,0.6); }
      .ds-pricing-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .ds-badge-pop { background: #FACC15; color: #2D1B1B; font-size: 11px; font-weight: 900; padding: 5px 11px; border-radius: 999px; letter-spacing: 0.1em; text-transform: uppercase; }
      .ds-pricing-card__price { display: flex; align-items: baseline; gap: 8px; margin-top: 14px; }
      .ds-price-num { font-size: 56px; line-height: 1; font-weight: 900; letter-spacing: -0.03em; }
      .ds-price-cur { font-size: 22px; font-weight: 800; color: #6B5555; }
      .ds-price-sub { margin: 6px 0 0; color: #6B5555; font-size: 14px; }
      .ds-pricing-card__list { list-style: none; padding: 0; margin: 26px 0 0; display: grid; grid-template-columns: 1fr; gap: 10px; }
      .ds-pricing-card__list li { font-size: 14px; display: flex; align-items: flex-start; }
      .ds-pricing-card .ds-btn { margin-top: 28px; }
      .ds-price-reassurance { margin: 14px 0 0; text-align: center; font-size: 13px; color: #6B5555; }

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

      .ds-beyond-protect { margin-top: 30px; padding: 24px 22px; border-radius: 18px; background: #2D1B1B; color: #fff; max-width: 1100px; margin-left: auto; margin-right: auto; }
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
        .ds-hero__float { display: block; }
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
