import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DonutSellingPage from './DonutSellingPage.jsx'
import PremiumHome from './PremiumHome.jsx'
import PremiumSoftwareHomepage from './PremiumSoftwareHomepage.jsx'

// Static StreetLocal pages — all share SLLayout for nav + footer.
// These replace the legacy landing/src/App.jsx route handlers.
import About from './pages/About.jsx'
import Faq from './pages/Faq.jsx'
import Terms from './pages/Terms.jsx'
import Privacy from './pages/Privacy.jsx'
import Security from './pages/Security.jsx'
import Contact from './pages/Contact.jsx'
import Themes from './pages/Themes.jsx'

// Standalone tools kept from the legacy stack — they have their own
// chrome and don't fit the public marketing pages. Mounted directly
// at /admin (sales-team console) and /affiliate (program page).
import Admin from './Admin.jsx'
import Affiliate from './Affiliate.jsx'

// Path switch — each surface lives alongside the others.
//
//   /                            → PremiumHome (StreetLocal brand landing)
//   /theme                       → PremiumSoftwareHomepage (your original Tailwind file)
//   /donut, /sell/donut          → DonutSellingPage
//   /about                       → About
//   /faq                         → Faq
//   /terms                       → Terms
//   /privacy                     → Privacy
//   /security                    → Security
//   /contact                     → Contact
//   anything else                → home (legacy admin / affiliate / etc. NO LONGER served)
//
// IMPORTANT: legacy landing/src/App.jsx is no longer imported. Any
// historic deep-link (e.g. /faq?...) that the old App.jsx handled
// is now served by these new pages. Unknown paths fall through to
// PremiumHome.
const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/'
const search = window.location.search

const ROUTES = {
  '/':         <PremiumHome />,
  '/home':     <PremiumHome />,
  '/theme':    <PremiumSoftwareHomepage />,
  '/donut':    <DonutSellingPage />,
  '/donut-shop': <DonutSellingPage />,
  '/sell/donut': <DonutSellingPage />,
  '/about':    <About />,
  '/faq':      <Faq />,
  '/terms':    <Terms />,
  '/privacy':  <Privacy />,
  '/security': <Security />,
  '/contact':  <Contact />,
  '/themes':   <Themes />,
  '/admin':    <Admin onClose={() => { window.location.href = '/' }} />,
  '/affiliate': <Affiliate onClose={() => { window.location.href = '/' }} />,
  // Legacy URL redirects — map old App.jsx pages to the closest
  // new-design page so any inbound link (Google index, old shared
  // URL) still lands somewhere sensible. Keeps the visitor on the
  // new chrome instead of falling back to the legacy App.
  '/services': <Terms />,         // old "services" page was the terms page
  '/policy':   <Privacy />,
  '/legal':    <Terms />,
  '/help':     <Faq />,
  '/support':  <Contact />,
}

// Legacy paths that should now silently redirect to home rather
// than 404. The OLD App.jsx had a tangle of themes/no-commission/
// warung-app/etc. pages — none of which fit our new positioning.
const LEGACY_REDIRECTS = new Set([
  '/pro-themes', '/product-themes', '/service-themes',
  '/no-commission', '/warung-app', '/online-store', '/whatsapp-booking',
  '/domains', '/checkoutchooser-food', '/checkoutchooser-products', '/checkoutchooser-services',
])
if (LEGACY_REDIRECTS.has(path)) {
  try { window.history.replaceState({}, '', '/' + search) } catch {}
}

const view = ROUTES[path] || ROUTES['/']
// Landing routes (all of them — everything routed by this file)
// need to escape the 480px phone-frame shell that wraps the legacy
// admin app — see index.html for the `.is-landing` overrides.
if (typeof document !== 'undefined') document.body.classList.add('is-landing')

createRoot(document.getElementById('root')).render(
  <StrictMode>{view}</StrictMode>,
)
