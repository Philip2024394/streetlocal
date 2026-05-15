/* ─────────────────────────────────────────────────────────────
   StreetLocal home page (streetlocal.live/).
   - Dark premium aesthetic (distinct from the light DonutSellingPage).
   - Inline styles + a single <style> block — matches landing/App.jsx
     and DonutSellingPage.jsx conventions (NO Tailwind).
   - Real product previews via FitIframe — embeds the live demo donut
     vendor running inside food-basic.
   - IP-localised pricing using the same PLAN_PRICING table the app
     itself uses (15 markets, single unified plan, single price tile
     with manual country override).
   ───────────────────────────────────────────────────────────── */
import React, { useEffect, useRef, useState } from 'react'

// ── Verticals shown on the home page. `live: true` means the
//    selling page is built and the card links there. `live: false`
//    means the app exists but the selling page isn't ready yet —
//    the card shows a "Coming soon" badge and (optionally) links
//    to the live app demo.
//
//    To add a new selling page later: flip `live: true` + update
//    `href` to its sales-page route. Single-line change per app.
const VERTICALS = [
  { id: 'donut',    label: 'Bakery & Donut Shops',     emoji: '🍩', desc: 'Pre-orders, loyalty stamps, in-app chat, kitchen printer, 0% commission.', href: '/donut',          demoHref: '/food/chat/?vendor=00000000-0000-0000-0000-00000000d0c0', live: true,  cta: 'View selling page →' },
  { id: 'food',     label: 'Restaurant & Food Delivery', emoji: '🍜', desc: 'WhatsApp orders, delivery zones, multi-currency checkout, marketing.', href: '/food/chat',     demoHref: '/food/chat',     live: false, cta: 'Try the demo →' },
  { id: 'food-pro', label: 'Restaurant Pro (Full POS)',  emoji: '🍽️', desc: 'Table service, kitchen tickets, multi-staff roles, daily sales reports.', href: '/food/pro',      demoHref: '/food/pro',      live: false, cta: 'Try the demo →' },
  { id: 'products', label: 'Retail & Local Products',    emoji: '🛍️', desc: 'Catalog, stock, multi-image gallery, anything you sell physically.',     href: '/products/local', demoHref: '/products/local', live: false, cta: 'Try the demo →' },
  { id: 'services', label: 'Salons, Tattoo Studios & Bookings', emoji: '💇', desc: 'Time-slot bookings, service menu, deposit-on-book — any appointment trade.', href: '/services',       demoHref: '/services',       live: false, cta: 'Try the demo →' },
]

// ── Country × tier pricing matrix.
//
//    Three tiers (starter / professional / enterprise) × 15 markets =
//    45 prices. Asia keeps the historical Starter anchor (Rp 38k etc.)
//    and adds Pro / Enterprise on top. International gets the full
//    USD / GBP / EUR matrix the user signed off on.
//
//    Currency + symbol are per-country (currency doesn't change with
//    tier). Tier prices are integers in the display unit (you'll
//    show "$19" not "$19.00").
const PLAN_PRICING = {
  // International — USD anchor, PPP-light pricing
  US:   { code: 'US', currency: 'USD', symbol: '$',  starter: '19',     professional: '49',     enterprise: '99' },
  GB:   { code: 'GB', currency: 'GBP', symbol: '£',  starter: '15',     professional: '39',     enterprise: '79' },
  EU:   { code: 'EU', currency: 'EUR', symbol: '€',  starter: '17',     professional: '45',     enterprise: '89' },
  AU:   { code: 'AU', currency: 'AUD', symbol: 'A$', starter: '29',     professional: '69',     enterprise: '139' },
  CA:   { code: 'CA', currency: 'CAD', symbol: 'C$', starter: '25',     professional: '69',     enterprise: '129' },
  NZ:   { code: 'NZ', currency: 'NZD', symbol: 'NZ$',starter: '29',     professional: '79',     enterprise: '149' },
  SG:   { code: 'SG', currency: 'SGD', symbol: 'S$', starter: '25',     professional: '69',     enterprise: '129' },
  MY:   { code: 'MY', currency: 'MYR', symbol: 'RM', starter: '69',     professional: '179',    enterprise: '359' },
  AE:   { code: 'AE', currency: 'AED', symbol: 'AED',starter: '75',     professional: '199',    enterprise: '399' },
  SA:   { code: 'SA', currency: 'SAR', symbol: 'SAR',starter: '75',     professional: '199',    enterprise: '399' },
  // Asia PPP — Starter keeps the historic anchor (we promised not to
  // raise it on existing markets). Pro / Ent revised upward to ~5×
  // Starter so a single month's revenue safely covers a year of domain
  // registration cost in the rare 1-month-then-quit scenario. Also
  // brings these markets in line with local POS competitor pricing
  // (Pawoon Premium Rp 199k, Moka Pro Rp 290k, etc.).
  ID:   { code: 'ID', currency: 'IDR', symbol: 'Rp', starter: '38,000', professional: '199,000', enterprise: '449,000' },
  PH:   { code: 'PH', currency: 'PHP', symbol: '₱',  starter: '999',    professional: '4,999',   enterprise: '9,999' },
  VN:   { code: 'VN', currency: 'VND', symbol: '₫',  starter: '399,000',professional: '1,999,000',enterprise: '3,999,000' },
  TH:   { code: 'TH', currency: 'THB', symbol: '฿',  starter: '599',    professional: '2,999',   enterprise: '5,999' },
  IN:   { code: 'IN', currency: 'INR', symbol: '₹',  starter: '1,499',  professional: '6,999',   enterprise: '13,999' },
}
const EU_COUNTRIES = new Set(['FR','DE','ES','IT','NL','BE','IE','PT','AT','FI','GR','LU','SE','DK','NO','CH','PL','CZ','RO','HU'])
function resolvePlanPricing (cc) {
  const code = String(cc || '').toUpperCase()
  if (PLAN_PRICING[code]) return PLAN_PRICING[code]
  if (EU_COUNTRIES.has(code)) return PLAN_PRICING.EU
  return PLAN_PRICING.US
}
// What each tier promises on the landing. Drives the 3-card pricing
// display below. Source of truth = the TIER_FEATURES contract in the
// donut app; this is the marketing-friendly bullet list version.
const TIER_BULLETS = {
  starter: {
    label: 'Starter',
    blurb: 'For small shops & single-owner businesses',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2015,%202026,%2007_06_01%20PM.png',
    bullets: [
      'Premium PWA app + mobile install',
      'Unlimited menu items',
      'WhatsApp + in-app chat checkout',
      'Loyalty stamps, tax / VAT, receipts',
      'Stock auto-hide',
      '11 languages, 15 currencies',
      '1 staff account',
      'Shop subdomain (your-shop.streetlocal.live)',
    ],
  },
  professional: {
    label: 'Professional',
    blurb: 'For busy cafes & growing brands · most popular',
    featured: true,
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2015,%202026,%2007_07_02%20PM.png',
    bullets: [
      'Everything in Starter',
      '15 payment gateways (Stripe, Midtrans, …)',
      'Bluetooth kitchen printer (ESC/POS)',
      'Scheduled pre-orders',
      'Marketing banners + auto-post countdown',
      '14-day re-engagement automation',
      'Promo codes (% / flat / first-order)',
      'AI menu descriptions (✨ powered by Claude)',
      'Custom domain support (you bring the domain — CNAME instructions + auto-SSL)',
      'Advanced analytics + profit estimator',
      'Backup & restore',
      'Up to 5 staff accounts',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    blurb: 'For multi-location chains & premium brands',
    image: 'https://ik.imagekit.io/nepgaxllc/Untitledasda-removebg-preview.png',
    bullets: [
      'Everything in Professional',
      'Full domain management (we register, renew + SSL — annual)',
      'Multi-location management',
      'Centralised cross-location analytics',
      'Unlimited staff accounts',
      'White-label branding (no "Powered by")',
      'Priority support',
      'Early access to new features',
    ],
  },
}

// ── FitIframe: renders an iframe at NATURAL design size and scales
//    via CSS transform to fit its parent. Same pattern used by the
//    existing landing App.jsx for theme previews.
function FitIframe ({ src, designW = 390, designH = 844 }) {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      const h = e.contentRect.height
      const s = Math.min(w / designW, h / designH)
      setScale(s > 0 ? s : 1)
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [designW, designH])
  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <iframe
        src={src}
        title="StreetLocal app preview"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        style={{
          position: 'absolute', top: 0, left: 0,
          width: designW, height: designH, border: 0,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          background: '#0a0a0a',
        }}
      />
    </div>
  )
}

const FAQS = [
  ['What does StreetLocal cost?', 'Three tiers — Starter, Professional, Enterprise — localised to your country. For example Starter is Rp 38,000 in Indonesia, $19 in the US, £15 in the UK. No setup fee, no commission on orders, cancel any time.'],
  ['Do you take a commission on my orders?', 'No. Zero. Your customers pay you directly through your own payment gateway. We never see or hold your money.'],
  ['How long does it take to set up?', 'About 5 minutes for the PWA. Sign up, add your items, pick a theme, share your link. If you also want a native app in Apple / Google stores, that takes 2–3 weeks for review.'],
  ['Do my customers need to install an app?', "No — the PWA opens instantly in any browser, no App Store delay. If you'd like a branded native app too, we build that as a paid add-on (see Native Apps section above)."],
  ['Can I bring my own payment gateway?', 'Yes — 16 gateways supported including Stripe, Midtrans, Xendit, PayPal, Razorpay, HitPay, Adyen, CyberSource, Worldpay and more. Funds settle to YOUR account; we never touch them.'],
  ['Multi-location? Multi-staff?', 'Multi-staff (manager / cashier / kitchen) is on Professional & Enterprise. Multi-location (one account, multiple shops, separate inventory and orders) is Enterprise-tier.'],
  ['Can I also get my app in the Apple App Store and Google Play?', "Yes. We build your branded native app — your name, your logo, your colours — and submit to both stores under your bakery's own developer account. One-time setup from $499 + $29/month maintenance. See the Native Apps section above for full pricing and IP-protection terms."],
  ['Who owns the app code if I get a native build?', 'You own your store listing, your reviews, your customer data, your developer accounts. StreetLocal owns the underlying source code — your build is a licensed binary, not a transfer of code. If you cancel, your live app keeps working but stops receiving updates. This is the same model Glide, Adalo, and other SaaS app-builders use.'],
  ['Do Apple or Google take a cut of my donut sales?', "No. Donuts are physical goods — Apple's 30% and Google's 30% only apply to digital goods (in-app purchases). You keep using your existing payment gateway and 100% of the sale (minus your gateway's processing fee)."],
  ['What if I want a custom feature?', "We do custom work as a separate engagement — quote per project. Common requests: NFC loyalty taps, beacon-based promotions, integrations with accounting software, custom delivery integrations. Email streetlocallive@gmail.com with what you need."],
  ['Can I cancel any time?', 'Yes for the monthly subscription. The day you cancel, your shop stays live until the end of the paid period. Native app maintenance has a 6-month minimum.'],
]

// Supabase Edge Function URL — the server-side authority on pricing.
// We never trust client-detected country; this is the geofence boundary.
const RESOLVE_PRICING_URL = 'https://fjvafjkzvygkhiwjuvla.supabase.co/functions/v1/resolve-pricing'
const RESOLVE_PRICING_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdmFmamt6dnlna2hpd2p1dmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDk0NDEsImV4cCI6MjA5MDY4NTQ0MX0.UoXfKznY9gAEqZDSTegDjIfYAeAeFg6Eh1D40Hoe2KM'

export default function PremiumHome () {
  // Pricing market is resolved SERVER-SIDE — IP + VPN flags + timezone
  // triangulation. We never read country from URL params, localStorage,
  // or the manual picker (which is intentionally removed). On failure
  // we hold at US pricing — never default to Asia.
  const [market, setMarket] = useState('US')
  const [marketLoaded, setMarketLoaded] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        const lang = (navigator.language || navigator.userLanguage || '').slice(0, 12)
        const resp = await fetch(RESOLVE_PRICING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': RESOLVE_PRICING_KEY },
          body: JSON.stringify({ timezone: tz, language: lang }),
          signal: ctrl.signal,
        })
        const data = await resp.json()
        if (data?.market) setMarket(String(data.market).toUpperCase())
      } catch { /* keep US default */ }
      finally { setMarketLoaded(true) }
    })()
    return () => ctrl.abort()
  }, [])

  const plan = resolvePlanPricing(market)

  return (
    <div className="sl-home">
      <style>{`
        /* White / black / yellow / gray theme — premium fresh look. */
        :root {
          --sl-yellow: #FACC15; --sl-yellow-deep: #EAB308;
          --sl-black: #0A0A0A;
          --sl-gray-50: #FAFAFA; --sl-gray-100: #F4F4F5; --sl-gray-200: #E4E4E7;
          --sl-gray-400: #A1A1AA; --sl-gray-500: #71717A; --sl-gray-600: #52525B;
          --sl-gray-700: #3F3F46; --sl-gray-900: #18181B;
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
        .sl-home { min-height: 100vh; background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(250,204,21,0.18) 0%, transparent 60%), #FFFFFF; color: var(--sl-black); overflow-x: hidden; }
        .sl-container { max-width: 1180px; margin: 0 auto; padding: 0 16px; }
        @media (min-width: 480px) { .sl-container { padding: 0 24px; } }
        .sl-nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.85); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-bottom: 1px solid var(--sl-gray-200); }
        .sl-nav__inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; }
        .sl-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--sl-black); }
        .sl-brand__mark { width: 36px; height: 36px; border-radius: 10px; background: var(--sl-black); color: var(--sl-yellow); display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 900; }
        .sl-brand__mark--img { object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .sl-brand__name { font-size: 17px; font-weight: 900; letter-spacing: -0.3px; }
        .sl-nav__links { display: none; gap: 26px; }
        @media (min-width: 768px) { .sl-nav__links { display: flex; } }
        @media (min-width: 600px) { [data-sl-nav-signin] { display: inline-flex !important; } }
        .sl-nav__link { color: var(--sl-gray-600); text-decoration: none; font-size: 14px; font-weight: 600; }
        .sl-nav__link:hover { color: var(--sl-black); }
        .sl-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; cursor: pointer; transition: all 0.2s ease; border: none; font-family: inherit; text-decoration: none; padding: 12px 22px; border-radius: 12px; font-size: 14px; line-height: 1; min-height: 44px; }
        .sl-btn--primary { background: linear-gradient(135deg, var(--sl-yellow) 0%, var(--sl-yellow-deep) 100%); color: var(--sl-black); box-shadow: 0 6px 22px rgba(250,204,21,0.45); }
        .sl-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(250,204,21,0.6); }
        .sl-btn--ghost { background: #fff; color: var(--sl-black); border: 1px solid var(--sl-gray-200); }
        .sl-btn--ghost:hover { background: var(--sl-gray-50); border-color: var(--sl-gray-400); }
        .sl-btn--lg { padding: 16px 28px; font-size: 15px; min-height: 52px; border-radius: 14px; }

        /* HERO */
        .sl-hero { padding: 60px 0 80px; position: relative; }
        @media (min-width: 768px) { .sl-hero { padding: 90px 0 110px; } }
        .sl-hero__grid { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
        @media (min-width: 900px) { .sl-hero__grid { grid-template-columns: 1.05fr 1fr; gap: 64px; } }
        .sl-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; background: rgba(250,204,21,0.15); border: 1px solid rgba(234,179,8,0.5); color: #854D0E; font-size: 13px; font-weight: 700; margin-bottom: 22px; }
        .sl-eyebrow__dot { width: 7px; height: 7px; border-radius: 4px; background: var(--sl-yellow-deep); box-shadow: 0 0 10px rgba(250,204,21,0.9); }
        .sl-h1 { font-size: 38px; font-weight: 900; line-height: 1.04; letter-spacing: -1.2px; margin: 0 0 24px; color: var(--sl-black); }
        @media (min-width: 380px) { .sl-h1 { font-size: 44px; letter-spacing: -1.5px; } }
        @media (min-width: 768px) { .sl-h1 { font-size: 64px; } }
        @media (min-width: 1100px) { .sl-h1 { font-size: 76px; } }
        .sl-h1__accent { background: linear-gradient(120deg, var(--sl-yellow-deep) 0%, var(--sl-yellow) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .sl-lede { font-size: 17px; line-height: 1.55; color: var(--sl-gray-600); max-width: 560px; margin: 0 0 30px; }
        @media (min-width: 768px) { .sl-lede { font-size: 19px; } }
        .sl-cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }
        .sl-trust-row { display: flex; flex-wrap: wrap; gap: 20px; font-size: 13px; color: var(--sl-gray-500); font-weight: 600; }
        .sl-trust-row span { display: inline-flex; align-items: center; gap: 6px; }
        .sl-trust-row span::before { content: '✓'; color: var(--sl-black); background: var(--sl-yellow); width: 18px; height: 18px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; }

        /* HERO phone */
        .sl-phone-wrap { display: flex; justify-content: center; align-items: center; min-height: 540px; position: relative; }
        .sl-phone-glow { position: absolute; inset: 0; background: radial-gradient(closest-side, rgba(250,204,21,0.4), transparent 70%); filter: blur(40px); pointer-events: none; animation: slPulse 5s ease-in-out infinite; }
        @keyframes slPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 0.9; } }
        .sl-phone { position: relative; width: min(290px, 78vw); height: min(600px, 165vw); max-height: 620px; background: linear-gradient(180deg, #1a1a1a, #0a0a0a); border-radius: 44px; padding: 7px; box-shadow: 0 30px 80px rgba(0,0,0,0.25), 0 12px 28px rgba(250,204,21,0.18); border: 2.5px solid #2a2a2a; overflow: hidden; animation: slFloat 6s ease-in-out infinite; }
        @media (min-width: 480px) { .sl-phone { width: 290px; height: 600px; } }
        @keyframes slFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .sl-phone__notch { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); width: 110px; height: 22px; background: #000; border-radius: 14px; z-index: 3; }
        .sl-phone__screen { width: 100%; height: 100%; border-radius: 38px; overflow: hidden; position: relative; background: #000; }
        .sl-phone__tag { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); background: var(--sl-black); color: #fff; padding: 9px 18px; border-radius: 999px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 10px 28px rgba(0,0,0,0.25); white-space: nowrap; }
        .sl-phone__tag-dot { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; animation: slPulse 2s ease-in-out infinite; }

        /* SECTION shared */
        .sl-section { padding: 70px 0; }
        @media (min-width: 768px) { .sl-section { padding: 100px 0; } }
        .sl-kicker { display: inline-block; padding: 6px 14px; border-radius: 999px; background: var(--sl-black); color: var(--sl-yellow); font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 14px; }
        .sl-h2 { font-size: 28px; font-weight: 900; line-height: 1.12; margin: 0 0 16px; letter-spacing: -0.6px; color: var(--sl-black); }
        @media (min-width: 480px) { .sl-h2 { font-size: 32px; letter-spacing: -0.8px; } }
        @media (min-width: 768px) { .sl-h2 { font-size: 46px; } }
        .sl-h2__accent { background: linear-gradient(120deg, var(--sl-yellow-deep) 0%, var(--sl-yellow) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .sl-section__lede { font-size: 16px; line-height: 1.55; color: var(--sl-gray-600); max-width: 600px; margin: 0 auto; }

        /* VERTICALS */
        .sl-vert-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 50px; }
        @media (min-width: 600px) { .sl-vert-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1000px) { .sl-vert-grid { grid-template-columns: 1fr 1fr 1fr; } }
        .sl-vert { position: relative; background: #fff; border: 1px solid var(--sl-gray-200); border-radius: 22px; padding: 26px; text-decoration: none; color: inherit; transition: all 0.25s ease; overflow: hidden; display: block; }
        .sl-vert:hover { transform: translateY(-4px); border-color: var(--sl-yellow); box-shadow: 0 16px 40px rgba(250,204,21,0.18); }
        .sl-vert::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(250,204,21,0.08) 0%, transparent 50%); opacity: 0; transition: opacity 0.25s ease; pointer-events: none; }
        .sl-vert:hover::before { opacity: 1; }
        .sl-vert__emoji { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, var(--sl-yellow) 0%, var(--sl-yellow-deep) 100%); display: flex; align-items: center; justify-content: center; font-size: 30px; line-height: 1; margin-bottom: 18px; box-shadow: 0 6px 18px rgba(250,204,21,0.4); }
        .sl-vert__badge { position: absolute; top: 18px; right: 18px; padding: 3px 9px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; }
        .sl-vert__badge--live { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
        .sl-vert__badge--soon { background: var(--sl-gray-100); color: var(--sl-gray-600); border: 1px solid var(--sl-gray-200); }
        .sl-vert__title { font-size: 18px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.3px; color: var(--sl-black); }
        .sl-vert__desc { font-size: 14px; color: var(--sl-gray-600); line-height: 1.5; margin: 0 0 16px; }
        .sl-vert__cta { display: inline-flex; align-items: center; gap: 4px; color: var(--sl-black); font-size: 13px; font-weight: 800; }
        .sl-vert__cta--soon { color: var(--sl-gray-500); }

        /* FEATURES */
        .sl-features { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 50px; }
        @media (min-width: 800px) { .sl-features { grid-template-columns: 1fr 1fr 1fr; } }
        .sl-feature { background: #fff; border: 1px solid var(--sl-gray-200); border-radius: 22px; padding: 28px; transition: all 0.2s ease; }
        .sl-feature:hover { border-color: var(--sl-yellow); }
        .sl-feature__icon { width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, var(--sl-yellow) 0%, var(--sl-yellow-deep) 100%); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 18px; box-shadow: 0 6px 18px rgba(250,204,21,0.35); }
        .sl-feature__title { font-size: 19px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.2px; color: var(--sl-black); }
        .sl-feature__desc { font-size: 14px; color: var(--sl-gray-600); line-height: 1.55; margin: 0; }

        /* PRICING — 3-tier card grid */
        .sl-pricing-bg { background: var(--sl-gray-50); border-top: 1px solid var(--sl-gray-200); border-bottom: 1px solid var(--sl-gray-200); }
        .sl-tier-grid { display: grid; grid-template-columns: 1fr; gap: 28px; margin: 50px auto 0; max-width: 1100px; }
        @media (min-width: 760px) { .sl-tier-grid { grid-template-columns: 1fr 1fr 1fr; gap: 22px; align-items: start; } }
        /* Each tier is now a column: standalone banner card on top,
           clear gap, package card below. They never share a border. */
        .sl-tier-col { display: flex; flex-direction: column; gap: 22px; }
        .sl-tier-banner-card { background: var(--sl-gray-100); border-radius: 22px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        /* Bleed the image 2px past the card on all sides — the card's
           overflow:hidden clips it, covering the thin black edge line
           that some of the source PNGs have around their outer pixels. */
        .sl-tier-banner-card img { width: calc(100% + 4px); height: auto; display: block; margin: -2px; }
        .sl-tier { position: relative; background: #fff; border: 1px solid var(--sl-gray-200); border-radius: 22px; padding: 28px 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .sl-tier--featured { background: var(--sl-black); color: #fff; border-color: var(--sl-black); box-shadow: 0 22px 50px rgba(0,0,0,0.25); }
        .sl-tier__ribbon { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--sl-yellow) 0%, var(--sl-yellow-deep) 100%); color: var(--sl-black); padding: 5px 14px; border-radius: 999px; font-size: 11px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 6px 16px rgba(250,204,21,0.5); z-index: 2; white-space: nowrap; }
        .sl-tier__label { font-size: 14px; font-weight: 800; color: var(--sl-yellow-deep); letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 6px; }
        .sl-tier--featured .sl-tier__label { color: var(--sl-yellow); }
        .sl-tier__blurb { font-size: 13px; color: var(--sl-gray-500); line-height: 1.45; margin-bottom: 20px; min-height: 38px; }
        .sl-tier--featured .sl-tier__blurb { color: rgba(255,255,255,0.65); }
        .sl-tier__amount { font-size: 48px; font-weight: 900; line-height: 1; letter-spacing: -1.4px; display: flex; align-items: baseline; gap: 4px; margin-bottom: 22px; }
        .sl-tier__symbol { font-size: 24px; font-weight: 800; opacity: 0.75; }
        .sl-tier__per { font-size: 14px; font-weight: 600; color: var(--sl-gray-500); margin-left: 6px; }
        .sl-tier--featured .sl-tier__per { color: rgba(255,255,255,0.55); }
        .sl-tier__list { list-style: none; padding: 0; margin: 0 0 24px; flex: 1; }
        .sl-tier__list li { padding: 6px 0 6px 22px; position: relative; font-size: 13px; line-height: 1.45; color: var(--sl-gray-700); }
        .sl-tier--featured .sl-tier__list li { color: rgba(255,255,255,0.85); }
        .sl-tier__list li::before { content: '✓'; position: absolute; left: 0; top: 6px; width: 16px; height: 16px; border-radius: 4px; background: var(--sl-yellow); color: var(--sl-black); font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        .sl-tier__cta { width: 100%; margin-top: auto; }
        .sl-tier--featured .sl-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.2); }
        .sl-price-card::before { content: ''; position: absolute; top: -50%; right: -30%; width: 80%; height: 200%; background: radial-gradient(closest-side, rgba(250,204,21,0.25) 0%, transparent 70%); pointer-events: none; }
        .sl-price-card__label { font-size: 12px; font-weight: 800; color: var(--sl-yellow); letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 10px; position: relative; }
        .sl-price-card__amount { font-size: 48px; font-weight: 900; line-height: 1; letter-spacing: -1.4px; display: flex; align-items: baseline; gap: 6px; position: relative; }
        @media (min-width: 480px) { .sl-price-card__amount { font-size: 60px; letter-spacing: -2px; } }
        .sl-price-card__amount-symbol { font-size: 32px; font-weight: 800; opacity: 0.7; }
        .sl-price-card__per { color: rgba(255,255,255,0.6); font-size: 15px; font-weight: 600; margin: 6px 0 20px; position: relative; }
        .sl-price-card__inc { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 22px; position: relative; }
        .sl-price-card__chip { font-size: 12px; font-weight: 700; padding: 5px 11px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); }
        .sl-price-card__country { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 14px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); font-size: 13px; font-weight: 600; cursor: pointer; width: 100%; color: #fff; font-family: inherit; position: relative; }
        .sl-country-list { margin-top: 8px; max-height: 200px; overflow-y: auto; border-radius: 10px; border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.42); position: relative; }
        .sl-country-list button { display: flex; width: 100%; align-items: center; justify-content: space-between; padding: 10px 14px; border: none; background: transparent; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sl-country-list button:hover { background: rgba(250,204,21,0.15); }

        /* Native app add-on — Apple App Store + Google Play */
        .sl-native { background: #0A0A0A; color: #fff; border-top: 1px solid rgba(255,255,255,0.05); }
        .sl-native__head { text-align: center; padding-top: 14px; }
        .sl-native__head .sl-kicker { background: var(--sl-yellow); color: var(--sl-black); }
        .sl-native__head .sl-h2 { color: #fff; }
        .sl-native__head .sl-section__lede { color: rgba(255,255,255,0.65); }
        .sl-native__badges { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin: 22px 0 32px; }
        .sl-native__badge { display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); font-size: 14px; font-weight: 700; }
        .sl-native-grid { display: grid; grid-template-columns: 1fr; gap: 18px; max-width: 1100px; margin: 0 auto; }
        @media (min-width: 760px) { .sl-native-grid { grid-template-columns: 1fr 1fr 1fr; gap: 18px; align-items: start; } }
        .sl-native-tier { padding: 26px 22px; border-radius: 22px; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.04); display: flex; flex-direction: column; gap: 14px; min-height: 100%; }
        .sl-native-tier--featured { border-color: var(--sl-yellow); background: linear-gradient(180deg, rgba(250,204,21,0.10) 0%, rgba(255,255,255,0.03) 100%); position: relative; }
        .sl-native-tier__ribbon { position: absolute; top: -12px; left: 22px; padding: 4px 12px; border-radius: 999px; background: var(--sl-yellow); color: var(--sl-black); font-size: 11px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase; }
        .sl-native-tier__label { font-size: 18px; font-weight: 900; letter-spacing: -0.3px; }
        .sl-native-tier__blurb { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5; min-height: 38px; }
        .sl-native-tier__price { font-size: 32px; font-weight: 900; line-height: 1; letter-spacing: -1px; margin-top: 6px; }
        .sl-native-tier__price-sub { font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 600; margin-top: 4px; }
        .sl-native-tier__list { list-style: none; padding: 0; margin: 8px 0 6px; display: flex; flex-direction: column; gap: 8px; }
        .sl-native-tier__list li { font-size: 13px; color: rgba(255,255,255,0.85); line-height: 1.5; padding-left: 22px; position: relative; }
        .sl-native-tier__list li::before { content: '✓'; position: absolute; left: 0; top: 0; color: var(--sl-yellow); font-weight: 900; }
        .sl-native__notes { max-width: 920px; margin: 32px auto 0; padding: 18px 20px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.75); }
        .sl-native__notes strong { color: #fff; }
        .sl-native__notes ul { padding-left: 20px; margin: 8px 0 0; }
        .sl-native__notes li { margin-bottom: 6px; }

        /* FAQ */
        .sl-faq-list { margin-top: 40px; max-width: 760px; margin-left: auto; margin-right: auto; }
        .sl-faq-item { background: #fff; border: 1px solid var(--sl-gray-200); border-radius: 14px; margin-bottom: 10px; padding: 0; overflow: hidden; }
        .sl-faq-item summary { padding: 16px 20px; cursor: pointer; font-size: 15px; font-weight: 700; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--sl-black); }
        .sl-faq-item summary::-webkit-details-marker { display: none; }
        .sl-faq-item summary::after { content: '+'; color: var(--sl-yellow-deep); font-size: 22px; font-weight: 800; transition: transform 0.2s ease; flex-shrink: 0; }
        .sl-faq-item[open] summary::after { transform: rotate(45deg); }
        .sl-faq-item p { margin: 0; padding: 0 20px 18px; font-size: 14px; line-height: 1.6; color: var(--sl-gray-600); }

        /* CTA */
        .sl-final-cta { text-align: center; padding: 70px 28px; background: var(--sl-black); color: #fff; border-radius: 32px; position: relative; overflow: hidden; }
        @media (min-width: 768px) { .sl-final-cta { padding: 90px 40px; } }
        .sl-final-cta::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 0%, rgba(250,204,21,0.2) 0%, transparent 60%); pointer-events: none; }
        .sl-final-cta h2 { font-size: 30px; font-weight: 900; margin: 0 0 18px; letter-spacing: -0.7px; color: #fff; position: relative; }
        @media (min-width: 480px) { .sl-final-cta h2 { font-size: 36px; letter-spacing: -1px; } }
        @media (min-width: 768px) { .sl-final-cta h2 { font-size: 56px; } }
        .sl-final-cta p { color: rgba(255,255,255,0.7); font-size: 17px; max-width: 560px; margin: 0 auto 30px; line-height: 1.55; position: relative; }
        .sl-final-cta__row { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; position: relative; }
        .sl-final-cta .sl-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
        .sl-final-cta .sl-btn--ghost:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.4); }

        /* FOOTER */
        .sl-footer { padding: 50px 0 36px; border-top: 1px solid var(--sl-gray-200); background: var(--sl-gray-50); }
        .sl-footer__grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
        @media (min-width: 700px) { .sl-footer__grid { grid-template-columns: 1.5fr 1fr 1fr; } }
        .sl-footer__about { font-size: 14px; color: var(--sl-gray-600); line-height: 1.55; max-width: 320px; margin: 14px 0 0; }
        .sl-footer__col-title { font-size: 13px; font-weight: 800; color: var(--sl-black); margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .sl-footer__col a { display: block; color: var(--sl-gray-600); text-decoration: none; font-size: 14px; margin-bottom: 9px; }
        .sl-footer__col a:hover { color: var(--sl-black); }
        .sl-footer__copy { text-align: center; padding-top: 30px; margin-top: 30px; border-top: 1px solid var(--sl-gray-200); font-size: 13px; color: var(--sl-gray-500); }
      `}</style>

      {/* ─── NAV ─── */}
      <nav className="sl-nav">
        <div className="sl-container sl-nav__inner">
          <a href="/" className="sl-brand">
            <img fetchpriority="high" src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%206,%202026,%2002_50_47%20PM.png?updatedAt=1778053871353" alt="StreetLocal" className="sl-brand__mark sl-brand__mark--img" />
            <div className="sl-brand__name">StreetLocal</div>
          </a>
          <div className="sl-nav__links">
            <a className="sl-nav__link" href="#apps">Apps</a>
            <a className="sl-nav__link" href="#features">Features</a>
            <a className="sl-nav__link" href="#pricing">Pricing</a>
            <a className="sl-nav__link" href="#faq">FAQ</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a className="sl-nav__link" href="/food/chat/login" style={{ display: 'none' }} data-sl-nav-signin>Sign in</a>
            <a href="#pricing" className="sl-btn sl-btn--primary">Start your app</a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="sl-hero">
        <div className="sl-container sl-hero__grid">
          <div>
            <div className="sl-eyebrow"><span className="sl-eyebrow__dot" />Premium PWA platform · 0% commission</div>
            <h1 className="sl-h1">Your business.<br /><span className="sl-h1__accent">Your own app.</span><br />Five minutes to live.</h1>
            <p className="sl-lede">
              StreetLocal builds premium, animated, mobile-first apps for bakeries, restaurants,
              salons, retail shops, and service businesses. No commission per order. No setup fee.
              No App Store delay. One link — your customers tap and they're inside your shop.
            </p>
            <div className="sl-cta-row">
              <a href="#pricing" className="sl-btn sl-btn--primary sl-btn--lg">Start your app →</a>
              <a href="/donut" className="sl-btn sl-btn--ghost sl-btn--lg">See live demo</a>
            </div>
            <div className="sl-trust-row">
              <span>0% commission</span>
              <span>5-minute setup</span>
              <span>15 currencies</span>
              <span>11 languages</span>
            </div>
          </div>
          <div className="sl-phone-wrap">
            <div className="sl-phone-glow" />
            <div className="sl-phone">
              <div className="sl-phone__notch" />
              <div className="sl-phone__screen">
                <FitIframe src="/food/chat/?vendor=00000000-0000-0000-0000-00000000d0c0" />
              </div>
            </div>
            <div className="sl-phone__tag">
              <span className="sl-phone__tag-dot" />This is the real product. Tap around.
            </div>
          </div>
        </div>
      </section>

      {/* ─── VERTICALS ─── */}
      <section className="sl-section" id="apps">
        <div className="sl-container">
          <div style={{ textAlign: 'center' }}>
            <span className="sl-kicker">App family</span>
            <h2 className="sl-h2">One platform. <span className="sl-h2__accent">Many businesses.</span></h2>
            <p className="sl-section__lede">Built for the local trades that actually exist — every category below is a live, shippable product, not a placeholder.</p>
          </div>
          <div className="sl-vert-grid">
            {VERTICALS.map(v => (
              <a key={v.id} href={v.href} className="sl-vert">
                <span className={`sl-vert__badge ${v.live ? 'sl-vert__badge--live' : 'sl-vert__badge--soon'}`}>
                  {v.live ? 'LIVE' : 'SOON'}
                </span>
                <div className="sl-vert__emoji">{v.emoji}</div>
                <div className="sl-vert__title">{v.label}</div>
                <p className="sl-vert__desc">{v.desc}</p>
                <span className={`sl-vert__cta ${!v.live ? 'sl-vert__cta--soon' : ''}`}>{v.cta}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="sl-section" id="features" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="sl-container">
          <div style={{ textAlign: 'center' }}>
            <span className="sl-kicker">Why StreetLocal</span>
            <h2 className="sl-h2">Premium, <span className="sl-h2__accent">without the premium price tag.</span></h2>
          </div>
          <div className="sl-features">
            <div className="sl-feature">
              <div className="sl-feature__icon">⚡</div>
              <h3 className="sl-feature__title">Lightning-fast PWAs</h3>
              <p className="sl-feature__desc">Installable apps that feel native, in any browser. No App Store wait. No download friction.</p>
            </div>
            <div className="sl-feature">
              <div className="sl-feature__icon">💸</div>
              <h3 className="sl-feature__title">0% commission, forever</h3>
              <p className="sl-feature__desc">Your customers pay directly through your gateway. We never see, hold, or take a cut of your money.</p>
            </div>
            <div className="sl-feature">
              <div className="sl-feature__icon">🌏</div>
              <h3 className="sl-feature__title">Built for SEA, used worldwide</h3>
              <p className="sl-feature__desc">15 currencies, 11 languages, IP-detected pricing. Local-first design that scales globally.</p>
            </div>
            <div className="sl-feature">
              <div className="sl-feature__icon">🖨️</div>
              <h3 className="sl-feature__title">Bluetooth kitchen printer</h3>
              <p className="sl-feature__desc">Pair any ESC/POS thermal printer in seconds. Orders auto-print in the kitchen when they arrive.</p>
            </div>
            <div className="sl-feature">
              <div className="sl-feature__icon">📣</div>
              <h3 className="sl-feature__title">Marketing built-in</h3>
              <p className="sl-feature__desc">Banner builder, auto-post to customer chat after dispatch, 14-day re-engagement broadcast.</p>
            </div>
            <div className="sl-feature">
              <div className="sl-feature__icon">🎟️</div>
              <h3 className="sl-feature__title">Loyalty + multi-staff</h3>
              <p className="sl-feature__desc">Stamp cards for repeat customers. Role-based staff accounts for manager, cashier, kitchen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="sl-section" id="pricing">
        <div className="sl-container">
          <div style={{ textAlign: 'center' }}>
            <span className="sl-kicker">One plan · all features</span>
            <h2 className="sl-h2">Your country's price.<br /><span className="sl-h2__accent">All-inclusive.</span></h2>
            <p className="sl-section__lede">No tiers. No surprises. Everything in the platform is included — pricing localised to your market via your IP.</p>
          </div>
          <div className="sl-tier-grid">
            {['starter', 'professional', 'enterprise'].map(tierKey => {
              const tier = TIER_BULLETS[tierKey]
              const price = plan[tierKey]
              return (
                <div key={tierKey} className="sl-tier-col">
                  {tier.image && (
                    <div className="sl-tier-banner-card">
                      <img src={tier.image} alt={`${tier.label} plan`} loading="lazy" />
                    </div>
                  )}
                  <div className={`sl-tier${tier.featured ? ' sl-tier--featured' : ''}`}>
                    {tier.featured && <div className="sl-tier__ribbon">Most popular</div>}
                    <div className="sl-tier__label">{tier.label}</div>
                    <div className="sl-tier__blurb">{tier.blurb}</div>
                    <div className="sl-tier__amount">
                      <span className="sl-tier__symbol">{plan.symbol}</span>{price}
                      <span className="sl-tier__per">/month</span>
                    </div>
                    <ul className="sl-tier__list">
                      {tier.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                    <a href="/food/chat" className={`sl-btn ${tier.featured ? 'sl-btn--primary' : 'sl-btn--ghost'} sl-btn--lg sl-tier__cta`}>
                      Start {tier.label}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--sl-gray-500)', textAlign: 'center', marginTop: 18 }}>
            Pricing for <strong style={{ color: 'var(--sl-black)', fontWeight: 800 }}>{plan.code}</strong>{!marketLoaded && ' …'} · auto-detected from your location · no commission on orders, ever
          </div>
        </div>
      </section>

      {/* ─── NATIVE APP ADD-ON — Apple App Store + Google Play ─── */}
      {/* Positions us as both a PWA platform AND an app-builder service.
          Pricing mirrors the Asia / Western pattern used by PLAN_PRICING:
          Western markets pay full rate, Asian markets ~40% less. */}
      <section className="sl-section sl-native" id="native-apps">
        <div className="sl-container">
          <div className="sl-native__head">
            <span className="sl-kicker">Add-on · Apple + Google</span>
            <h2 className="sl-h2">Want your bakery in the <span style={{ color: 'var(--sl-yellow)' }}>App Store?</span></h2>
            <p className="sl-section__lede">We build your branded native app — your name, your logo, your colours — and submit it to both Apple App Store and Google Play under your bakery's developer account. You own the listing. Customers find you by searching their phone's store.</p>
            <div className="sl-native__badges">
              <span className="sl-native__badge"><span aria-hidden></span>Apple App Store</span>
              <span className="sl-native__badge"><span aria-hidden></span>Google Play Store</span>
              <span className="sl-native__badge">PWA included free</span>
            </div>
          </div>

          <div className="sl-native-grid">
            {/* STANDARD */}
            <div className="sl-native-tier">
              <div className="sl-native-tier__label">Standard wrap</div>
              <div className="sl-native-tier__blurb">Your branded app live in both stores within 2 weeks.</div>
              <div className="sl-native-tier__price">{plan.gateway === 'midtrans' ? `${plan.symbol} 2,500,000` : `${plan.symbol}499`}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginLeft: 6 }}>one-time</span></div>
              <div className="sl-native-tier__price-sub">+ {plan.gateway === 'midtrans' ? `${plan.symbol} 350,000` : `${plan.symbol}29`}/month maintenance</div>
              <ul className="sl-native-tier__list">
                <li>Capacitor build — your logo, name, colours, splash screen</li>
                <li>App icons + 5 screenshots + store listing copy</li>
                <li>Submission to Apple App Store + Google Play</li>
                <li>Review-response handling on your behalf</li>
                <li>Push notifications setup</li>
                <li>Over-the-air JS updates (no store re-review)</li>
              </ul>
            </div>

            {/* PREMIUM — featured */}
            <div className="sl-native-tier sl-native-tier--featured">
              <div className="sl-native-tier__ribbon">Most popular</div>
              <div className="sl-native-tier__label">Premium wrap</div>
              <div className="sl-native-tier__blurb">Everything in Standard plus campaigns, ASO, and store-listing optimisation.</div>
              <div className="sl-native-tier__price">{plan.gateway === 'midtrans' ? `${plan.symbol} 5,000,000` : `${plan.symbol}999`}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginLeft: 6 }}>one-time</span></div>
              <div className="sl-native-tier__price-sub">+ {plan.gateway === 'midtrans' ? `${plan.symbol} 750,000` : `${plan.symbol}49`}/month maintenance</div>
              <ul className="sl-native-tier__list">
                <li>Everything in Standard</li>
                <li>Custom animated splash + launch screen</li>
                <li>Segmented push-notification campaigns</li>
                <li>App Store Optimisation — keywords tuned to your city</li>
                <li>Apple Pay + Google Pay deep integration</li>
                <li>Quarterly store-listing refresh</li>
              </ul>
            </div>

            {/* ENTERPRISE */}
            <div className="sl-native-tier">
              <div className="sl-native-tier__label">Enterprise wrap</div>
              <div className="sl-native-tier__blurb">Multi-app chains, custom plugins, priority store-review escalation.</div>
              <div className="sl-native-tier__price">{plan.gateway === 'midtrans' ? `${plan.symbol} 12,500,000` : `${plan.symbol}2,499`}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginLeft: 6 }}>one-time</span></div>
              <div className="sl-native-tier__price-sub">+ {plan.gateway === 'midtrans' ? `${plan.symbol} 1,500,000` : `${plan.symbol}99`}/month maintenance</div>
              <ul className="sl-native-tier__list">
                <li>Everything in Premium</li>
                <li>Custom Capacitor plugins (NFC loyalty taps, beacons)</li>
                <li>Priority Apple expedited review (24-hour, when available)</li>
                <li>Multi-app management — chains with 5+ locations</li>
                <li>Dedicated review-escalation handler</li>
              </ul>
            </div>
          </div>

          <div className="sl-native__notes">
            <strong>What's protected, what's yours, what's separate:</strong>
            <ul>
              <li><strong>Source code stays with StreetLocal.</strong> We build the binary on our servers — your app cannot be extracted, decompiled, or transferred to another platform. You're licensing a finished product, not buying our codebase.</li>
              <li><strong>Your developer accounts are yours.</strong> Apple Developer ($99/year) and Google Play ($25 one-time) go in your bakery's legal name. You own the store listing, the reviews, the payouts. We just hold delegate access to upload + manage.</li>
              <li><strong>Both fees pass through to Apple/Google directly.</strong> $99/year Apple + $25 Google are not included above — they go to them, not us.</li>
              <li><strong>If you cancel:</strong> the live app keeps working but stops receiving updates. Your store listing + reviews stay with you. The source code license terminates.</li>
              <li><strong>Donuts are physical goods.</strong> Apple/Google take 0% commission on donut sales — you keep using your normal payment gateways. The 30% in-app purchase tax only applies to digital goods (which you don't sell).</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <a href="mailto:streetlocallive@gmail.com?subject=Native%20app%20request" className="sl-btn sl-btn--primary sl-btn--lg">
              Request a native app quote
            </a>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="sl-section" id="faq" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="sl-container">
          <div style={{ textAlign: 'center' }}>
            <span className="sl-kicker">Questions, answered</span>
            <h2 className="sl-h2">The short version.</h2>
          </div>
          <div className="sl-faq-list">
            {FAQS.map(([q, a], i) => (
              <details key={i} className="sl-faq-item" open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="sl-section">
        <div className="sl-container">
          <div className="sl-final-cta">
            <h2>Ready to launch your<br /><span style={{ color: 'var(--sl-yellow)' }}>premium app?</span></h2>
            <p>Five minutes from now your customers could be tapping your link, scrolling your menu, and placing their first order.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <a href="#pricing" className="sl-btn sl-btn--primary sl-btn--lg">Start your app for {plan.symbol}{plan.display}</a>
              <a href="mailto:streetlocallive@gmail.com" className="sl-btn sl-btn--ghost sl-btn--lg">Talk to us</a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="sl-footer">
        <div className="sl-container">
          <div className="sl-footer__grid">
            <div>
              <a href="/" className="sl-brand">
                <div className="sl-brand__mark">S</div>
                <div className="sl-brand__name">StreetLocal</div>
              </a>
              <p className="sl-footer__about">A family of apps for street vendors, bakeries, restaurants, salons and small businesses across Southeast Asia and beyond.</p>
            </div>
            <div className="sl-footer__col">
              <div className="sl-footer__col-title">Vendors</div>
              <a href="/food/chat/login"><strong>Sign in to dashboard →</strong></a>
              <a href="/food/chat/login?signup=true">Start a new shop</a>
              <a href="#pricing">Pricing &amp; plans</a>
              <a href="/faq">FAQ</a>
              <a href="/affiliate">Affiliate program</a>
            </div>
            <div className="sl-footer__col">
              <div className="sl-footer__col-title">Apps</div>
              <a href="/donut">Bakery &amp; donut shops</a>
              <a href="/food/chat">Restaurants (soon)</a>
              <a href="/products/local">Retail &amp; products (soon)</a>
              <a href="/services">Salons &amp; services (soon)</a>
              <a href="/themes">Theme catalogue (21)</a>
            </div>
            <div className="sl-footer__col">
              <div className="sl-footer__col-title">Company</div>
              <a href="/about">About</a>
              <a href="/security">Security</a>
              <a href="/terms">Terms of service</a>
              <a href="/privacy">Privacy policy</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
          <div className="sl-footer__copy">© {new Date().getFullYear()} StreetLocal · streetlocal.live · Built in Yogyakarta, Indonesia · 0% commission, ever</div>
        </div>
      </footer>
    </div>
  )
}
