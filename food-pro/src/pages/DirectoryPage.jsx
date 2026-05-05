import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FOOD_CATEGORIES_FULL } from '../constants/foodCategories'

const DEMO_RESTAURANTS = [
  { id: '1', name: 'Warung Bu Tini', cuisine_type: 'Javanese', cover_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', rating: 4.8, is_open: true, slug: 'warung-bu-tini' },
  { id: '2', name: 'Bakso Pak Kumis', cuisine_type: 'Street Food', cover_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=250&fit=crop', rating: 4.5, is_open: true, slug: 'bakso-pak-kumis' },
  { id: '3', name: 'Ayam Geprek Jogja', cuisine_type: 'Indonesian', cover_url: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=250&fit=crop', rating: 4.6, is_open: false, slug: 'ayam-geprek-jogja' },
  { id: '4', name: 'Sate Klathak Mbah Jo', cuisine_type: 'Street Food', cover_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=250&fit=crop', rating: 4.9, is_open: true, slug: 'sate-klathak' },
  { id: '5', name: 'Kopi Joss Malioboro', cuisine_type: 'Cafe', cover_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop', rating: 4.3, is_open: true, slug: 'kopi-joss' },
  { id: '6', name: 'Gudeg Yu Djum', cuisine_type: 'Javanese', cover_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop', rating: 4.7, is_open: true, slug: 'gudeg-yu-djum' },
]

function StarRating({ rating }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  return (
    <span style={{ color: '#FACC15', fontSize: '14px' }}>
      {'★'.repeat(full)}{hasHalf ? '☆' : ''}
      <span style={{ color: '#999', marginLeft: '4px', fontSize: '14px' }}>{rating}</span>
    </span>
  )
}

export default function DirectoryPage({ onSelectRestaurant }) {
  const [restaurants, setRestaurants] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRestaurants() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('status', 'approved')
          if (!error && data?.length) {
            setRestaurants(data)
            setLoading(false)
            return
          }
        } catch (e) {
          // fallback to demo
        }
      }
      setRestaurants(DEMO_RESTAURANTS)
      setLoading(false)
    }
    fetchRestaurants()
  }, [])

  const filtered = restaurants.filter((r) => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine_type.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || r.cuisine_type.toLowerCase().includes(selectedCategory.toLowerCase())
    return matchesSearch && matchesCategory
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero Section */}
      <header style={{ padding: '60px 24px 40px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', lineHeight: 1.2 }}>
          Order Food Direct — <span style={{ color: '#8DC63F' }}>No Commission</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '32px' }}>
          Support local restaurants. Order directly from their own page.
        </p>
        <input
          type="text"
          placeholder="Search restaurants or cuisine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '14px 20px',
            borderRadius: '12px',
            border: '1px solid #333',
            background: '#1a1a1a',
            color: '#fff',
            fontSize: '16px',
            outline: 'none',
          }}
        />
      </header>

      {/* Category Chips */}
      <section style={{ padding: '0 24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: !selectedCategory ? '#8DC63F' : '#222',
              color: !selectedCategory ? '#000' : '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            All
          </button>
          {FOOD_CATEGORIES_FULL.slice(0, 12).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.label === selectedCategory ? null : cat.label)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: selectedCategory === cat.label ? '#8DC63F' : '#222',
                color: selectedCategory === cat.label ? '#000' : '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {cat.labelId}
            </button>
          ))}
        </div>
      </section>

      {/* Restaurant Grid */}
      <section style={{ padding: '0 24px 60px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '16px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '16px' }}>No restaurants found.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filtered.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => onSelectRestaurant(restaurant.slug)}
                style={{
                  background: 'rgba(0,0,0,0.8)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid #222',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#8DC63F' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#222' }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={restaurant.cover_url}
                    alt={restaurant.name}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: restaurant.is_open ? '#8DC63F' : '#ef4444',
                    color: restaurant.is_open ? '#000' : '#fff',
                  }}>
                    {restaurant.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{restaurant.name}</h3>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>{restaurant.cuisine_type}</p>
                  <StarRating rating={restaurant.rating} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '60px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
        borderTop: '1px solid #222',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>For Restaurant Owners</h2>
        <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
          Get your own ordering page — <span style={{ color: '#FACC15', fontWeight: '700' }}>Rp 50,000/month</span>
        </p>
        <a
          href="https://wa.me/6281573635143"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#8DC63F',
            color: '#000',
            fontWeight: '700',
            fontSize: '16px',
            borderRadius: '12px',
            textDecoration: 'none',
          }}
        >
          Chat via WhatsApp
        </a>
      </section>
    </div>
  )
}
