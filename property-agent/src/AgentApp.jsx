/**
 * AgentApp — Mobile agent wrapper.
 * Reuses all existing website pages/components but replaces
 * desktop WebsiteNav/Footer with mobile agent header + bottom nav.
 */
import { useState } from 'react'
import './website/styles/website.css'
import HomePage from './website/pages/HomePage'
import SearchPage from './website/pages/SearchPage'
import PropertyDetailPage from './website/pages/PropertyDetailPage'
import NewProjectsPage from './website/pages/NewProjectsPage'
import NewProjectDetail from '@/components/property/NewProjectDetail'
import DashboardPage from './website/pages/DashboardPage'
import InvestorPage from './website/pages/InvestorPage'
import PropertyListingForm from '@/domains/rentals/forms/PropertyListingForm'
import { createListing } from '@/services/rentalListingService'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2007_33_38%20PM.png'

const DEMO_AGENT = {
  name: 'Agent Name',
  tagline: 'Your Trusted Property Partner',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  phone: '+62 812 3456 7890',
  accentColor: '#8DC63F',
}

const MENU_PAGES = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'all', label: 'All Properties', icon: '🔍' },
  { id: 'sale', label: 'For Sale', icon: '🏷️' },
  { id: 'rent', label: 'For Rent', icon: '🔑' },
  { id: 'newprojects', label: 'New Projects', icon: '🏗️' },
  { id: 'invest', label: 'Foreign Investment', icon: '🌍' },
  { id: 'dashboard', label: 'Dashboard', icon: '📋' },
  { id: 'list', label: 'List Property', icon: '➕' },
]

export default function AgentApp() {
  const [page, setPage] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showListForm, setShowListForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const agent = DEMO_AGENT

  const navigate = (target) => {
    setSelectedListing(null); setSelectedProject(null)
    if (target === 'home') setPage('home')
    else if (target === 'sale') { setPage('search'); setFilterMode('sale') }
    else if (target === 'rent') { setPage('search'); setFilterMode('rent') }
    else if (target === 'commercial') { setPage('search'); setFilterMode('commercial') }
    else if (target === 'all') { setPage('search'); setFilterMode('all') }
    else if (target === 'newprojects') setPage('newprojects')
    else if (target === 'invest') setPage('invest')
    else if (target === 'list') setShowListForm(true)
    else if (target === 'mylistings' || target === 'dashboard') setPage('dashboard')
    else setPage(target)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setPage('search')
    setSelectedListing(null)
  }

  const handleSelectListing = (listing) => {
    setSelectedListing(listing)
    setPage('detail')
  }

  // Hide bottom nav on detail/form pages
  const showBottomNav = !selectedListing && !showListForm && !selectedProject

  return (
    <div style={s.shell}>
      {/* Fixed background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url("${BG_IMG}")`, backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />

      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', letterSpacing: '0.1em' }}>STREET LOCAL PROPERTY</div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={s.burgerBtn}>
          <span style={{ fontSize: 20 }}>{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div style={s.menuOverlay} onClick={() => setMenuOpen(false)}>
          <div style={s.menuDropdown} onClick={e => e.stopPropagation()}>
            {MENU_PAGES.map(m => (
              <button
                key={m.id}
                onClick={() => { navigate(m.id); setMenuOpen(false) }}
                style={{ ...s.menuItem, ...(page === m.id || (m.id === 'all' && page === 'search') ? s.menuItemActive : {}) }}
              >
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div style={s.content}>
        {page === 'home' && (
          <HomePage
            onSearch={handleSearch}
            onBrowseSale={() => { setFilterMode('sale'); setPage('search') }}
            onBrowseRent={() => { setFilterMode('rent'); setPage('search') }}
            onBrowseAll={() => { setFilterMode('all'); setPage('search') }}
            onSelectListing={handleSelectListing}
            onNavigate={navigate}
          />
        )}

        {page === 'search' && (
          <SearchPage
            initialSearch={searchQuery}
            initialMode={filterMode}
            onSelectListing={handleSelectListing}
            onBack={() => setPage('home')}
          />
        )}

        {page === 'detail' && selectedListing && (
          <PropertyDetailPage
            listing={selectedListing}
            onBack={() => setPage('search')}
            onSelectListing={handleSelectListing}
          />
        )}

        {page === 'newprojects' && !selectedProject && (
          <NewProjectsPage
            onSelectProject={(p) => { setSelectedProject(p); setPage('projectdetail') }}
            onBack={() => setPage('home')}
          />
        )}

        {page === 'projectdetail' && selectedProject && (
          <NewProjectDetail
            open
            onClose={() => { setSelectedProject(null); setPage('newprojects') }}
            project={selectedProject}
          />
        )}

        {page === 'invest' && (
          <InvestorPage
            onBack={() => setPage('home')}
            onSelectListing={handleSelectListing}
          />
        )}

        {page === 'dashboard' && (
          <DashboardPage
            onBack={() => setPage('home')}
            onSelectListing={handleSelectListing}
            onListProperty={() => setShowListForm(true)}
          />
        )}

        {/* List Property Form */}
        {showListForm && (
          <PropertyListingForm
            onClose={() => setShowListForm(false)}
            onSubmit={async (data) => {
              await createListing({ ...data, category: 'Property' })
              setShowListForm(false)
              setRefreshKey(k => k + 1)
              setPage('dashboard')
            }}
            presetCategory="Property"
          />
        )}
      </div>

      {/* Bottom Navigation — removed, using page navigation instead */}

      {/* Powered by */}
      <div style={s.powered}>Powered by StreetLocal</div>
    </div>
  )
}

const s = {
  shell: {
    position: 'relative',
    background: '#ffffff',
    minHeight: '100vh',
    color: '#1a1a1a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  agentHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  agentPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    objectFit: 'cover',
    border: '2px solid #8DC63F',
    flexShrink: 0,
  },
  agentName: {
    fontSize: 14,
    fontWeight: 900,
    color: '#fff',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  agentTagline: {
    fontSize: 10,
    color: '#888',
    margin: 0,
  },
  headerWA: {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: '#25D366',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    textDecoration: 'none',
    flexShrink: 0,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: 'transparent',
  },
  burgerBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    borderRadius: 10,
    width: 38,
    height: 38,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  menuOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
  },
  menuDropdown: {
    position: 'absolute',
    top: 56,
    right: 14,
    width: 220,
    background: 'rgba(20,20,20,0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '8px',
    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 14px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 10,
    width: '100%',
    textAlign: 'left',
  },
  menuItemActive: {
    background: 'rgba(141,198,63,0.12)',
    color: '#8DC63F',
    fontWeight: 800,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    paddingBottom: 0,
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    background: 'rgba(0,0,0,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    zIndex: 100,
    padding: '6px 0 env(safe-area-inset-bottom, 8px)',
  },
  navBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '6px 0',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.4)',
  },
  navBtnActive: {
    color: '#8DC63F',
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: 700,
  },
  powered: {
    textAlign: 'center',
    fontSize: 9,
    color: '#333',
    padding: '8px 0 80px',
  },
}
