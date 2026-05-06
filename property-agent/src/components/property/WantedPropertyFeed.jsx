import React, { useState, useEffect } from 'react'
import { getWantedProperties, TIMELINE_OPTIONS } from '@/services/wantedPropertyService'
import WantedPropertyCard from './WantedPropertyCard'

const GREEN = '#8DC63F'

const PROPERTY_TYPES = ['Villa', 'House', 'Apartment', 'Kos', 'Tanah', 'Ruko']

export default function WantedPropertyFeed({ onRespond }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    property_type: '',
    listing_type: '',
    timeline: '',
    location: '',
  })

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      const activeFilters = {}
      if (filters.property_type) activeFilters.property_type = filters.property_type
      if (filters.listing_type) activeFilters.listing_type = filters.listing_type
      if (filters.timeline) activeFilters.timeline = filters.timeline
      if (filters.location) activeFilters.location = filters.location
      const data = await getWantedProperties(activeFilters)
      if (!cancelled) {
        setRequests(data)
        setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [filters])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Property Wanted</h2>
        <p style={styles.subtitle}>Buyers looking for properties — respond with your listing</p>
      </div>

      {/* Filter bar */}
      <div style={styles.filterBar}>
        {/* Property type dropdown */}
        <select
          style={styles.select}
          value={filters.property_type}
          onChange={e => updateFilter('property_type', e.target.value)}
        >
          <option value="">All Types</option>
          {PROPERTY_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Buy/Rent toggle */}
        <div style={styles.toggleGroup}>
          {['', 'buy', 'rent'].map(val => (
            <button
              key={val}
              style={{
                ...styles.toggleBtn,
                ...(filters.listing_type === val ? styles.toggleBtnActive : {}),
              }}
              onClick={() => updateFilter('listing_type', val)}
            >
              {val === '' ? 'All' : val === 'buy' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>

        {/* Timeline filter */}
        <select
          style={styles.select}
          value={filters.timeline}
          onChange={e => updateFilter('timeline', e.target.value)}
        >
          <option value="">Any Timeline</option>
          {TIMELINE_OPTIONS.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        {/* Location search */}
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search location..."
          value={filters.location}
          onChange={e => updateFilter('location', e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>🔍</p>
          <p style={styles.emptyText}>No property requests found</p>
          <p style={styles.emptySubtext}>Try adjusting your filters</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {requests.map(req => (
            <WantedPropertyCard
              key={req.id}
              request={req}
              onRespond={onRespond}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const inputBase = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  padding: '10px 14px',
  outline: 'none',
  minHeight: 44,
}

const styles = {
  container: {
    padding: '24px 16px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    margin: '6px 0 0',
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  select: {
    ...inputBase,
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    paddingRight: 32,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6.5 6.5-6.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  },
  toggleGroup: {
    display: 'flex',
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  toggleBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: 600,
    padding: '10px 16px',
    cursor: 'pointer',
    minHeight: 44,
  },
  toggleBtnActive: {
    background: GREEN,
    color: '#fff',
  },
  searchInput: {
    ...inputBase,
    flex: 1,
    minWidth: 160,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: 40,
    margin: '0 0 12px',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 4px',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    margin: 0,
  },
}
