import { useState, useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import RestaurantBrowseScreen from '@/screens/RestaurantBrowseScreen'
import DirectoryPage from './pages/DirectoryPage'
import RestaurantPage from './pages/RestaurantPage'
import VendorPanel from './pages/VendorPanel'

export default function App() {
  const [restaurantSlug, setRestaurantSlug] = useState(null)
  const [view, setView] = useState('food') // 'food' | 'directory' | 'restaurant' | 'vendor'

  useEffect(() => {
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    const params = new URLSearchParams(window.location.search)

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

  return (
    <AuthProvider>
      {view === 'food' && (
        <RestaurantBrowseScreen
          onClose={() => {}}
          onBackToCategories={() => {}}
          category={null}
          scrollToId={null}
          onOrderViaChat={() => {}}
        />
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
    </AuthProvider>
  )
}
