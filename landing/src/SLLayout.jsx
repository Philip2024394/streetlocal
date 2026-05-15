/* ─────────────────────────────────────────────────────────────
   SLLayout — shared header + footer for every static page on
   streetlocal.live. Matches the PremiumHome design system
   (white / yellow / black / gray). Import this from every
   page route file (About, FAQ, Terms, Privacy, Contact) so the
   chrome stays identical and the footer link grid stays in
   sync.
   ───────────────────────────────────────────────────────────── */
import React from 'react'

const STYLES = `
  :root {
    --sl-yellow: #FACC15; --sl-yellow-deep: #EAB308;
    --sl-black: #0A0A0A;
    --sl-gray-50: #FAFAFA; --sl-gray-100: #F4F4F5; --sl-gray-200: #E4E4E7;
    --sl-gray-400: #A1A1AA; --sl-gray-500: #71717A; --sl-gray-600: #52525B;
    --sl-gray-700: #3F3F46; --sl-gray-900: #18181B;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .sl-page { min-height: 100vh; background: #fff; color: var(--sl-black); display: flex; flex-direction: column; }
  .sl-page__body { flex: 1; }
  .sl-container { max-width: 1180px; margin: 0 auto; padding: 0 16px; }
  @media (min-width: 480px) { .sl-container { padding: 0 24px; } }

  /* NAV */
  .sl-nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.85); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-bottom: 1px solid var(--sl-gray-200); }
  .sl-nav__inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; }
  .sl-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--sl-black); }
  .sl-brand__mark { width: 36px; height: 36px; border-radius: 10px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  .sl-brand__name { font-size: 17px; font-weight: 900; letter-spacing: -0.3px; }
  .sl-nav__links { display: none; gap: 26px; }
  @media (min-width: 768px) { .sl-nav__links { display: flex; } }
  .sl-nav__link { color: var(--sl-gray-600); text-decoration: none; font-size: 14px; font-weight: 600; }
  .sl-nav__link:hover { color: var(--sl-black); }
  .sl-nav__right { display: flex; align-items: center; gap: 12px; }
  .sl-nav__signin { color: var(--sl-gray-600); text-decoration: none; font-size: 14px; font-weight: 600; display: none; }
  @media (min-width: 600px) { .sl-nav__signin { display: inline-flex; } }
  .sl-nav__signin:hover { color: var(--sl-black); }
  .sl-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; cursor: pointer; transition: all 0.2s ease; border: none; font-family: inherit; text-decoration: none; padding: 12px 22px; border-radius: 12px; font-size: 14px; line-height: 1; min-height: 44px; }
  .sl-btn--primary { background: linear-gradient(135deg, var(--sl-yellow) 0%, var(--sl-yellow-deep) 100%); color: var(--sl-black); box-shadow: 0 6px 22px rgba(250,204,21,0.45); }
  .sl-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(250,204,21,0.6); }
  .sl-btn--ghost { background: #fff; color: var(--sl-black); border: 1px solid var(--sl-gray-200); }
  .sl-btn--ghost:hover { background: var(--sl-gray-50); border-color: var(--sl-gray-400); }

  /* SECTION TYPOGRAPHY (reused on every static page) */
  .sl-page__hero { padding: 60px 0 40px; }
  @media (min-width: 768px) { .sl-page__hero { padding: 80px 0 60px; } }
  .sl-h1 { font-size: 36px; font-weight: 900; line-height: 1.06; letter-spacing: -1.2px; margin: 0 0 18px; color: var(--sl-black); }
  @media (min-width: 380px) { .sl-h1 { font-size: 44px; letter-spacing: -1.5px; } }
  @media (min-width: 768px) { .sl-h1 { font-size: 56px; } }
  .sl-h2 { font-size: 26px; font-weight: 900; line-height: 1.15; letter-spacing: -0.6px; margin: 32px 0 14px; color: var(--sl-black); }
  @media (min-width: 768px) { .sl-h2 { font-size: 32px; } }
  .sl-lede { font-size: 17px; line-height: 1.55; color: var(--sl-gray-600); max-width: 720px; margin: 0 0 18px; }
  .sl-prose { max-width: 760px; font-size: 15px; line-height: 1.7; color: var(--sl-gray-700); }
  .sl-prose p { margin: 0 0 16px; }
  .sl-prose strong { color: var(--sl-black); font-weight: 700; }
  .sl-prose ul, .sl-prose ol { padding-left: 22px; margin: 0 0 16px; }
  .sl-prose li { margin-bottom: 8px; }
  .sl-prose a { color: var(--sl-yellow-deep); text-decoration: underline; text-underline-offset: 3px; }
  .sl-prose code { background: var(--sl-gray-100); padding: 1px 6px; border-radius: 4px; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .sl-kicker { display: inline-block; padding: 5px 12px; border-radius: 999px; background: var(--sl-black); color: var(--sl-yellow); font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 14px; }

  /* FOOTER */
  .sl-footer { padding: 60px 0 40px; border-top: 1px solid var(--sl-gray-200); background: var(--sl-gray-50); }
  .sl-footer__grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
  @media (min-width: 700px) { .sl-footer__grid { grid-template-columns: 2fr 1fr 1fr 1fr; } }
  .sl-footer__about { font-size: 14px; color: var(--sl-gray-600); line-height: 1.55; max-width: 360px; margin: 14px 0 0; }
  .sl-footer__col-title { font-size: 13px; font-weight: 800; color: var(--sl-black); margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.5px; }
  .sl-footer__col a { display: block; color: var(--sl-gray-600); text-decoration: none; font-size: 14px; margin-bottom: 9px; }
  .sl-footer__col a:hover { color: var(--sl-black); }
  .sl-footer__copy { text-align: center; padding-top: 30px; margin-top: 36px; border-top: 1px solid var(--sl-gray-200); font-size: 13px; color: var(--sl-gray-500); }
`

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%206,%202026,%2002_50_47%20PM.png?updatedAt=1778053871353'

export default function SLLayout ({ title, kicker, lede, children }) {
  // `title`, `kicker`, `lede` render a uniform hero across every
  // static page. Pass null for a page that wants its own custom
  // hero block.
  return (
    <div className="sl-page">
      <style>{STYLES}</style>
      <nav className="sl-nav">
        <div className="sl-container sl-nav__inner">
          <a href="/" className="sl-brand">
            <img className="sl-brand__mark" src={LOGO_URL} alt="StreetLocal" />
            <div className="sl-brand__name">StreetLocal</div>
          </a>
          <div className="sl-nav__links">
            <a className="sl-nav__link" href="/#apps">Apps</a>
            <a className="sl-nav__link" href="/#features">Features</a>
            <a className="sl-nav__link" href="/#pricing">Pricing</a>
            <a className="sl-nav__link" href="/faq">FAQ</a>
          </div>
          <div className="sl-nav__right">
            <a className="sl-nav__signin" href="/food/chat/login">Sign in</a>
            <a href="/#pricing" className="sl-btn sl-btn--primary">Start your app</a>
          </div>
        </div>
      </nav>

      <div className="sl-page__body">
        {(title || kicker || lede) && (
          <section className="sl-page__hero">
            <div className="sl-container">
              {kicker && <span className="sl-kicker">{kicker}</span>}
              {title && <h1 className="sl-h1">{title}</h1>}
              {lede && <p className="sl-lede">{lede}</p>}
            </div>
          </section>
        )}
        {children}
      </div>

      <footer className="sl-footer">
        <div className="sl-container">
          <div className="sl-footer__grid">
            <div>
              <a href="/" className="sl-brand">
                <img className="sl-brand__mark" src={LOGO_URL} alt="StreetLocal" />
                <div className="sl-brand__name">StreetLocal</div>
              </a>
              <p className="sl-footer__about">
                A premium PWA platform for local businesses — bakeries, restaurants, salons, retail, services.
                Built in Yogyakarta, serving shops worldwide. 0% commission, your funds, your customers.
              </p>
            </div>
            <div className="sl-footer__col">
              <div className="sl-footer__col-title">Vendors</div>
              <a href="/food/chat/login"><strong>Sign in to dashboard →</strong></a>
              <a href="/food/chat/login?signup=true">Start a new shop</a>
              <a href="/#pricing">Pricing &amp; plans</a>
              <a href="/faq">FAQ</a>
              <a href="/affiliate">Affiliate program</a>
            </div>
            <div className="sl-footer__col">
              <div className="sl-footer__col-title">Apps</div>
              <a href="/donut">Bakery &amp; donut shops</a>
              <a href="/#apps">Restaurants (soon)</a>
              <a href="/#apps">Retail &amp; products (soon)</a>
              <a href="/#apps">Salons &amp; services (soon)</a>
              <a href="/theme">Theme preview</a>
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
          <div className="sl-footer__copy">
            © {new Date().getFullYear()} StreetLocal · streetlocal.live · Built in Yogyakarta, Indonesia · 0% commission, ever
          </div>
        </div>
      </footer>
    </div>
  )
}
