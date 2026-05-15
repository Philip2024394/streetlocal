import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DonutSellingPage from './DonutSellingPage.jsx'
import PremiumHome from './PremiumHome.jsx'

// Simple path switch so each surface lives alongside the others
// without pulling in a router dependency.
//   /                  → PremiumHome (StreetLocal brand landing)
//   /donut, /sell/donut → DonutSellingPage
//   anything else      → App (legacy: about, terms, affiliate, admin)
const path = window.location.pathname.toLowerCase()
const isDonutSelling = path === '/donut' || path === '/donut-shop' || path === '/sell/donut'
const isHome = path === '/' || path === '/home'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isHome ? <PremiumHome /> : isDonutSelling ? <DonutSellingPage /> : <App />}
  </StrictMode>,
)
