import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DonutSellingPage from './DonutSellingPage.jsx'

// Simple path switch so the new selling pages can live alongside App
// without pulling in a router dependency.
const path = window.location.pathname.toLowerCase()
const isDonutSelling = path === '/donut' || path === '/donut-shop' || path === '/sell/donut'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDonutSelling ? <DonutSellingPage /> : <App />}
  </StrictMode>,
)
