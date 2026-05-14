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
  bouncing:     'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_26_20%20AM.png',
  bottomLeft:   'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_30_51%20AM.png',
  bostonCream:  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2008_45_54%20PM.png',
  strawberry:   'https://ik.imagekit.io/nepgaxllc/Untitledasdaaaavdddddd-removebg-preview%20(1).png',
  chocolate:    'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2009_19_03%20PM.png',
  flavourOrb:   'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_56_26%20AM.png',
}

const DEMO_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5173/themes/donuts.html'
  : '/themes/donuts.html'

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
  'WhatsApp ordering',
  'Delivery + pickup zones',
  'Verified reviews',
  'Multi-language support',
  'Custom branding & landing',
  'Daily deals + promo banners',
  'Custom subdomain',
  '24/7 hosting + backups',
  'WhatsApp support',
  'No commission, ever',
]

const COMPARISON = [
  ['Setup time',                   '5 min',  'Already chaos', '1–2 days',  'Days/weeks'],
  ['Monthly cost',                 '35K IDR', 'Free',         '500K+ IDR', 'Free'],
  ['Commission per order',         '0%',     '0%',            '0–5%',      '20–30%'],
  ['Branded landing page',         '✓',      '✗',             '✓',         '✗'],
  ['One-tap customer ordering',    '✓',      '✗',             '✓',         '✓'],
  ['Reviews tied to real orders',  '✓',      '✗',             '✗',         'Theirs'],
  ['You own your customer list',   '✓',      '✓',             '✓',         '✗ Locked'],
  ['Built for donut shops',        '✓',      '—',             '✗ Generic', '✗ Generic'],
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
   'Yes — included at no extra cost. We help you point it. Or use the free streetlocal.live/yourshop subdomain.'],
  ['What languages are supported?',
   'English + Indonesian, fully translated. Vietnamese, Malay, and Filipino are on the roadmap for Q3 2026.'],
  ['Can I run promotions or deals?',
   'Yes — BUY1GET1, percentage-off, time-limited, free-delivery-above thresholds, scrolling promo banners. All built in.'],
  ['Who do I contact if I need help?',
   'WhatsApp support 9 AM – 9 PM WIB. Average response time: 12 minutes. Most issues solved in the first reply.'],
]

export default function DonutSellingPage() {
  const [scrolled, setScrolled] = useState(false)

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
          <a href="#top" className="ds-brand" aria-label="Fresh Donuts Baked Daily home">
            <span className="ds-brand__bubble" aria-hidden>🍩</span>
            <span className="ds-brand__text">
              Fresh Donuts Baked Daily<span className="ds-brand__suffix"> · StreetLocal</span>
            </span>
          </a>
          <nav className="ds-nav__links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#demo">Live demo</a>
            <a href="#pricing">Pricing</a>
            <a href="#compare">Compare</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="ds-nav__cta">
            <a href="#demo" className="ds-nav__link-cta">See demo</a>
            <a href="#pricing" className="ds-btn ds-btn--primary ds-btn--sm">Start your shop</a>
          </div>
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
              For donut sellers
            </span>
            <h1 className="ds-h1">
              Your donut shop.<br />
              Online in <span className="ds-pink">5 minutes.</span>
            </h1>
            <p className="ds-lede">
              Take WhatsApp orders, manage your menu, accept payments — without writing a single line of code, and with 0% commission. You keep 100% of what you earn.
            </p>
            <div className="ds-cta-row">
              <a href="#pricing" className="ds-btn ds-btn--primary ds-btn--lg">Start your shop →</a>
              <a href="#demo" className="ds-btn ds-btn--outline ds-btn--lg">▶ See live demo</a>
            </div>
            <ul className="ds-trust">
              <li><span className="ds-check">✓</span> 7-day free trial</li>
              <li><span className="ds-check">✓</span> No card required</li>
              <li><span className="ds-check">✓</span> Cancel anytime</li>
            </ul>
          </div>

          <div className="ds-hero__phone-wrap">
            <div className="ds-glow" aria-hidden></div>
            {/* Dancing donut sits BEHIND the phone (z-index 0) and bounces
                in place. Chocolate-coloured crumbs spawn from around its
                base and fall past the phone for a continuous shower. */}
            <img
              className="ds-dance-donut"
              src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2014,%202026,%2004_26_20%20AM.png"
              alt=""
              aria-hidden
            />
            <div className="ds-crumbs" aria-hidden>
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="ds-crumb"
                  style={{
                    left: `${(i / 14) * 100}%`,
                    animationDelay: `${(i * 0.37) % 5}s`,
                    animationDuration: `${4 + (i % 4)}s`,
                  }}
                />
              ))}
            </div>
            <div className="ds-phone">
              <div className="ds-phone__notch" aria-hidden></div>
              <iframe
                src={DEMO_URL}
                title="Live donut shop demo"
                className="ds-phone__frame"
                loading="lazy"
              />
            </div>
            <div className="ds-phone__tag">
              <span className="ds-phone__tag-dot" aria-hidden></span>
              This is the real product. Tap around.
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
              { icon: '📱', title: 'WhatsApp chaos',       desc: 'Orders buried in DMs. Customers waiting. You forgetting who ordered what.' },
              { icon: '🧾', title: 'Manual menu updates',  desc: 'Editing your Instagram bio every time a flavour sells out or a price changes.' },
              { icon: '💸', title: '30% app commissions',  desc: 'GrabFood and Gojek eat into your profit margin. Every. Single. Order.' },
            ].map((p, i) => (
              <div key={i} className="ds-pain-card">
                <div className="ds-pain-card__icon">{p.icon}</div>
                <h3 className="ds-pain-card__title">{p.title}</h3>
                <p className="ds-pain-card__desc">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="ds-section__transition">Here's what you get instead ↓</p>
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
                <span className="ds-price-num">35,000</span>
                <span className="ds-price-cur">IDR</span>
              </div>
              <p className="ds-price-sub">per month · ~$2 USD</p>
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
        <img src={IMAGES.bouncing} alt="" aria-hidden className="ds-cta__donut ds-cta__donut--tr" />
        <img src={IMAGES.chocolate} alt="" aria-hidden className="ds-cta__donut ds-cta__donut--bl" />
        <div className="ds-container ds-cta__inner">
          <h2 className="ds-cta__h">
            Your donut shop.<br />
            Live in <span className="ds-cta__highlight">5 minutes.</span>
          </h2>
          <p className="ds-cta__sub">
            Stop renting space on someone else's app. Build your own — keep 100% of every sale.
          </p>
          <div className="ds-cta__buttons">
            <a href="#pricing" className="ds-btn ds-btn--white ds-btn--lg">Start free trial →</a>
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
            <a href="#top" className="ds-brand" aria-label="Fresh Donuts Baked Daily home">
              <span className="ds-brand__bubble" aria-hidden>🍩</span>
              <span className="ds-brand__text ds-brand__text--light">
                Fresh Donuts Baked Daily<span className="ds-brand__suffix ds-brand__suffix--light"> · StreetLocal</span>
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
      .ds-brand__text { font-size: 16px; letter-spacing: -0.02em; }
      .ds-brand__suffix { color: #EC4899; font-weight: 800; }
      .ds-brand__text--light { color: #fff; }
      .ds-brand__suffix--light { color: #F9A8D4; }
      .ds-nav__links { display: none; gap: 26px; font-size: 14px; font-weight: 600; color: #5C3A3A; }
      .ds-nav__links a:hover { color: #EC4899; }
      .ds-nav__cta { display: flex; align-items: center; gap: 12px; }
      .ds-nav__link-cta { display: none; font-size: 14px; font-weight: 700; color: #EC4899; }

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
      .ds-hero { position: relative; padding: 110px 0 80px; overflow: hidden; }
      .ds-hero__grid { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
      .ds-hero__copy { position: relative; z-index: 2; }
      .ds-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: #FCE7F3; color: #DB2777; padding: 7px 13px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
      .ds-eyebrow__dot { width: 6px; height: 6px; border-radius: 50%; background: #EC4899; animation: dsPulse 2s ease-in-out infinite; }
      @keyframes dsPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
      .ds-h1 { font-size: 44px; line-height: 0.95; letter-spacing: -0.03em; font-weight: 900; margin: 22px 0 0; color: #2D1B1B; }
      .ds-lede { font-size: 17px; line-height: 1.55; color: #6B5555; margin: 22px 0 0; max-width: 540px; }
      .ds-cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
      .ds-trust { list-style: none; padding: 0; margin: 26px 0 0; display: flex; flex-wrap: wrap; gap: 18px; font-size: 14px; font-weight: 600; color: #705353; }
      .ds-trust li { display: inline-flex; align-items: center; }

      .ds-hero__phone-wrap { position: relative; display: flex; align-items: center; justify-content: center; min-height: 520px; }
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
      .ds-phone { position: relative; z-index: 1; width: 280px; height: 590px; background: #000; border-radius: 44px; padding: 6px; box-shadow: 0 30px 70px rgba(236,72,153,0.32), 0 8px 20px rgba(0,0,0,0.25); border: 2px solid #2a2a2a; overflow: hidden; }
      .ds-phone--big { width: 320px; height: 670px; border-radius: 50px; padding: 7px; box-shadow: 0 40px 100px rgba(236,72,153,0.4), 0 10px 30px rgba(0,0,0,0.3); }
      .ds-phone__notch { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 110px; height: 22px; background: #000; border-radius: 14px; z-index: 5; }
      .ds-phone__notch--big { width: 130px; height: 26px; top: 14px; }
      /* Render iframe at native phone-design viewport (390x844) and
         scale it down with CSS to fit the phone shell. Without this,
         donuts.html lays out at the shell's pixel width (~268px) and
         elements get cramped or break — the scale-transform makes the
         page believe it's on a real ~390px phone. */
      .ds-phone__frame { width: 390px; height: 844px; border: 0; border-radius: 38px; background: #000; display: block; transform-origin: top left; transform: scale(0.687); }
      .ds-phone--big .ds-phone__frame { border-radius: 44px; transform: scale(0.785); }
      .ds-phone__tag { position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); background: #fff; color: #2D1B1B; padding: 9px 16px; border-radius: 999px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 10px 28px rgba(0,0,0,0.18); white-space: nowrap; }
      .ds-phone__tag-dot { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; animation: dsPulse 2s ease-in-out infinite; }

      /* ── SECTION GENERICS ─────────────────────────────────────── */
      .ds-section { padding: 80px 0; }
      .ds-section--white { background: #fff; }
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
