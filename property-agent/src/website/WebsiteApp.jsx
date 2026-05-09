/**
 * WebsiteApp — Main router for the INDOO Property Website.
 * Standalone module — does not import or render any mobile app components.
 * Shares data services + reusable property components with the app.
 */
import { useState } from 'react'
import './styles/website.css'
import WebsiteNav from './components/WebsiteNav'
import WebsiteFooter from './components/WebsiteFooter'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import AgentDirectoryPage from './pages/AgentDirectoryPage'
import AgentProfilePage from './pages/AgentProfilePage'
import NewProjectsPage from './pages/NewProjectsPage'
import NewProjectDetail from '@/components/property/NewProjectDetail'
import PropertyListingForm from '@/domains/rentals/forms/PropertyListingForm'
import DashboardPage from './pages/DashboardPage'
import WantedPropertyPage from './pages/WantedPropertyPage'
import InvestorPage from './pages/InvestorPage'
import LegalGuidePage from './pages/LegalGuidePage'
import AreaGuidePage from './pages/AreaGuidePage'
import PropertyManagementPage from './pages/PropertyManagementPage'
import { createListing } from '@/services/rentalListingService'

const BG_IMG = 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-2-2026-02_15_43-am.png'

export default function WebsiteApp() {
  const [page, setPage] = useState('home')
  const [selectedListing, setSelectedListing] = useState(null)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showListForm, setShowListForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('all')

  const navigate = (target) => {
    setSelectedListing(null); setSelectedAgent(null)
    if (target === 'home') setPage('home')
    else if (target === 'sale') { setPage('search'); setFilterMode('sale') }
    else if (target === 'rent') { setPage('search'); setFilterMode('rent') }
    else if (target === 'commercial') { setPage('search'); setFilterMode('commercial') }
    else if (target === 'newprojects') setPage('newprojects')
    else if (target === 'agents') setPage('agents')
    else if (target === 'kpr') { setPage('search'); setFilterMode('all') }
    else if (target === 'wanted') setPage('wanted')
    else if (target === 'invest') setPage('invest')
    else if (target === 'legal') setPage('legal')
    else if (target === 'areas') setPage('areas')
    else if (target === 'management') setPage('management')
    else if (target === 'list') { setShowListForm(true) }
    else if (target === 'mylistings' || target === 'dashboard') { setPage('dashboard') }
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

  return (
    <div className="website-page" style={{
      position: 'relative',
      background: '#0a0a0a',
      minHeight: '100vh',
    }}>
      {/* Fixed background image */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url("${BG_IMG}")`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WebsiteNav activePage={page} onNavigate={navigate} onSearch={handleSearch} />

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

        {page === 'agents' && !selectedAgent && (
          <AgentDirectoryPage
            onSelectAgent={(a) => { setSelectedAgent(a); setPage('agentprofile') }}
            onBack={() => setPage('home')}
          />
        )}

        {page === 'agentprofile' && selectedAgent && (
          <AgentProfilePage
            agent={selectedAgent}
            onBack={() => { setSelectedAgent(null); setPage('agents') }}
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

        {page === 'wanted' && (
          <WantedPropertyPage
            onBack={() => setPage('home')}
          />
        )}

        {page === 'invest' && (
          <InvestorPage
            onBack={() => setPage('home')}
            onSelectListing={handleSelectListing}
          />
        )}

        {page === 'legal' && (
          <LegalGuidePage onBack={() => setPage('home')} onNavigate={navigate} />
        )}

        {page === 'areas' && (
          <AreaGuidePage onBack={() => setPage('home')} onNavigate={navigate} />
        )}

        {page === 'management' && (
          <PropertyManagementPage onBack={() => setPage('home')} onNavigate={navigate} />
        )}

        {page === 'dashboard' && (
          <DashboardPage
            onBack={() => setPage('home')}
            onSelectListing={handleSelectListing}
            onListProperty={() => setShowListForm(true)}
          />
        )}

        <WebsiteFooter onNavigate={navigate} />

        {/* List Property Form — pre-set to Property category */}
        {showListForm && (
          <PropertyListingForm
            open
            propertyType="House"
            listingMarket="rental"
            onClose={() => setShowListForm(false)}
            onSubmit={async (listing) => {
              await createListing(listing)
              setShowListForm(false)
              setRefreshKey(k => k + 1) // triggers re-fetch of listings
              setPage('search')
              setFilterMode('all')
            }}
          />
        )}
      </div>
    </div>
  )
}
