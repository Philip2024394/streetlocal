import { useState, useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import RestaurantBrowseScreen from '@/screens/RestaurantBrowseScreen'
import DirectoryPage from './pages/DirectoryPage'
import RestaurantPage from './pages/RestaurantPage'
import VendorPanel from './pages/VendorPanel'
import VendorDashboardV2 from './components/restaurant/VendorDashboardV2'

export default function App() {
  const [restaurantSlug, setRestaurantSlug] = useState(null)
  const [view, setView] = useState('food') // 'food' | 'directory' | 'restaurant' | 'vendor' | 'dashboard'

  /* --- Agent referral tracking --- */
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref && supabase) {
      localStorage.setItem('sl_agent_ref', ref)
      supabase.from('affiliate_agents').select('id, total_clicks').eq('agent_code', ref).single().then(({ data }) => {
        if (data) {
          supabase.from('affiliate_agents').update({ total_clicks: (data.total_clicks || 0) + 1 }).eq('id', data.id)
        }
      })
    }
  }, [])

  useEffect(() => {
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    const params = new URLSearchParams(window.location.search)

    // Full vendor dashboard (menu CRUD, subscription, payments) — bypasses
    // VendorPanel's order-only view. Used by the DEV button in this app.
    if (params.get('view') === 'dashboard') {
      setView('dashboard')
      return
    }

    // Check for vendor panel
    if (window.location.pathname === '/vendor' || params.get('view') === 'vendor') {
      setView('vendor')
      return
    }

    // Check for directory view
    if (params.get('view') === 'directory') {
      setView('directory')
      return
    }

    // Check if we're on a subdomain (production) — only for indoo.id domain
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && hostname.includes('indoo.id')) {
      setRestaurantSlug(parts[0])
      setView('restaurant')
      return
    }

    // Development fallback: use query param
    const slug = params.get('restaurant')
    if (slug) {
      setRestaurantSlug(slug)
      setView('restaurant')
      return
    }

    // Default: show the food module (existing UI)
    setView('food')
  }, [])

  // Dev-only shortcut to jump straight into the vendor dashboard from
  // the customer-facing food view. Hidden on production hostnames.
  const isDevHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.vercel.app')
  )

  return (
    <AuthProvider>
      {view === 'food' && (
        <>
          <RestaurantBrowseScreen
            onClose={() => {}}
            onBackToCategories={() => {}}
            category={null}
            scrollToId={null}
            onOrderViaChat={() => {}}
          />
          {isDevHost && (
            <button
              onClick={() => { window.location.search = '?view=dashboard' }}
              style={{
                position: 'fixed', right: 12, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
                zIndex: 9999, padding: '8px 14px', borderRadius: 999,
                border: '1px solid rgba(255,0,0,0.4)',
                background: 'rgba(0,0,0,0.85)', color: '#FF6B6B',
                fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                fontFamily: 'inherit',
              }}
              title="Open vendor dashboard (dev only — hidden in production)"
            >
              DEV · Dashboard
            </button>
          )}
        </>
      )}

      {view === 'directory' && (
        <DirectoryPage onSelectRestaurant={(slug) => {
          if (window.location.hostname.includes('indoo.id')) {
            window.location.href = `https://${slug}.indoo.id`
          } else {
            window.location.search = `?restaurant=${slug}`
          }
        }} />
      )}

      {view === 'restaurant' && restaurantSlug && (
        <RestaurantPage slug={restaurantSlug} />
      )}

      {view === 'vendor' && (
        <VendorPanel />
      )}

      {view === 'dashboard' && (
        <VendorDashboardV2 onClose={() => { window.location.search = '' }} />
      )}
    </AuthProvider>
  )
}
