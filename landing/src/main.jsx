import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DonutSellingPage from './DonutSellingPage.jsx'
import PremiumHome from './PremiumHome.jsx'
import PremiumSoftwareHomepage from './PremiumSoftwareHomepage.jsx'

// Path switch — each surface lives alongside the others.
//   /                            → PremiumHome (StreetLocal brand landing)
//   /theme                       → PremiumSoftwareHomepage (your original Tailwind file)
//   /donut, /sell/donut          → DonutSellingPage
//   anything else                → App (legacy: about, terms, affiliate, admin)
const path = window.location.pathname.toLowerCase()
const isDonutSelling = path === '/donut' || path === '/donut-shop' || path === '/sell/donut'
const isHome = path === '/' || path === '/home'
const isTheme = path === '/theme' || path === '/theme/'

let view
const isLanding = isTheme || isHome || isDonutSelling
if (isTheme) view = <PremiumSoftwareHomepage />
else if (isHome) view = <PremiumHome />
else if (isDonutSelling) view = <DonutSellingPage />
else view = <App />

// Landing routes need to escape the 480px phone-frame shell that wraps
// the legacy admin app — see index.html for the `.is-landing` overrides.
if (isLanding) document.body.classList.add('is-landing')

createRoot(document.getElementById('root')).render(
  <StrictMode>{view}</StrictMode>,
)
