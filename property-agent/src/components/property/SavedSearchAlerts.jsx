/**
 * SavedSearchAlerts — Full-screen overlay for managing property search alerts.
 * Persists to localStorage key 'indoo_search_alerts'.
 * Props: { open, onClose }
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const PROPERTY_TYPES = ['House', 'Villa', 'Kos', 'Factory']
const CITIES = [
  'Jakarta',
  'Surabaya',
  'Bandung',
  'Bali (Denpasar)',
  'Yogyakarta',
  'Semarang',
  'Medan',
  'Makassar',
  'Malang',
  'Solo',
]
const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4+']

const STORAGE_KEY = 'indoo_search_alerts'

const DEFAULT_ALERTS = [
  {
    id: 'demo_1',
    name: 'Kos Murah Jakarta',
    propertyType: 'Kos',
    city: 'Jakarta',
    priceMin: 500000,
    priceMax: 1500000,
    bedrooms: '1',
    active: true,
    hasNew: true,
    createdAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 'demo_2',
    name: 'Villa Bali Weekend',
    propertyType: 'Villa',
    city: 'Bali (Denpasar)',
    priceMin: 2000000,
    priceMax: 8000000,
    bedrooms: '2',
    active: false,
    hasNew: false,
    createdAt: '2026-04-01T08:30:00Z',
  },
]

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 16,
    overflowY: 'auto',
  },
  container: {
    background: 'rgba(20,20,20,0.95)',
    border: '1px solid rgba(141,198,63,0.2)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    padding: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 18,
    minHeight: 44,
    minWidth: 44,
  },
  createBtn: {
    width: '100%',
    padding: '12px 0',
    background: 'rgba(141,198,63,0.15)',
    border: '1px dashed rgba(141,198,63,0.4)',
    borderRadius: 12,
    color: '#8DC63F',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 20,
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  formCard: {
    background: 'rgba(141,198,63,0.06)',
    border: '1px solid rgba(141,198,63,0.2)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 44,
    appearance: 'none',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 44,
  },
  priceRow: {
    display: 'flex',
    gap: 10,
  },
  formActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelBtn: {
    padding: '8px 20px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
  },
  saveBtn: {
    padding: '8px 24px',
    background: '#8DC63F',
    border: 'none',
    borderRadius: 10,
    color: '#0a0a0a',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 44,
  },
  alertCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  alertTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#FACC15',
    display: 'inline-block',
    flexShrink: 0,
  },
  alertCriteria: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.5,
    margin: 0,
    marginBottom: 12,
  },
  alertActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'background 0.2s',
    position: 'relative',
    border: 'none',
    padding: 0,
    minHeight: 24,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: 3,
    transition: 'left 0.2s',
  },
  deleteBtn: {
    padding: '6px 14px',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 36,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
}

function formatRupiah(num) {
  if (!num) return 'Rp 0'
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

export default function SavedSearchAlerts({ open, onClose }) {
  const [alerts, setAlerts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    propertyType: 'House',
    city: 'Jakarta',
    priceMin: '',
    priceMax: '',
    bedrooms: 'Any',
  })

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setAlerts(JSON.parse(saved))
      } else {
        setAlerts(DEFAULT_ALERTS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ALERTS))
      }
      setShowForm(false)
    }
  }, [open])

  function persist(updated) {
    setAlerts(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSaveAlert() {
    const alertName = `${form.propertyType} in ${form.city}`
    const newAlert = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: alertName,
      propertyType: form.propertyType,
      city: form.city,
      priceMin: form.priceMin ? Number(form.priceMin) : 0,
      priceMax: form.priceMax ? Number(form.priceMax) : 0,
      bedrooms: form.bedrooms,
      active: true,
      hasNew: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [newAlert, ...alerts]
    persist(updated)
    setShowForm(false)
    setForm({ propertyType: 'House', city: 'Jakarta', priceMin: '', priceMax: '', bedrooms: 'Any' })
  }

  function toggleAlert(id) {
    const updated = alerts.map((a) =>
      a.id === id ? { ...a, active: !a.active, hasNew: false } : a
    )
    persist(updated)
  }

  function deleteAlert(id) {
    const updated = alerts.filter((a) => a.id !== id)
    persist(updated)
  }

  if (!open) return null

  const content = (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Search Alerts</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>

        {/* Create Alert Button */}
        {!showForm && (
          <button style={styles.createBtn} onClick={() => setShowForm(true)}>
            <span style={{ fontSize: 20 }}>+</span> Create Alert
          </button>
        )}

        {/* Create Form */}
        {showForm && (
          <div style={styles.formCard}>
            <p style={styles.formTitle}>Create New Alert</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Property Type</label>
              <select
                value={form.propertyType}
                onChange={(e) => handleFormChange('propertyType', e.target.value)}
                style={styles.select}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>City</label>
              <select
                value={form.city}
                onChange={(e) => handleFormChange('city', e.target.value)}
                style={styles.select}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Price Range (Rp)</label>
              <div style={styles.priceRow}>
                <input
                  type="number"
                  placeholder="Min"
                  value={form.priceMin}
                  onChange={(e) => handleFormChange('priceMin', e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={form.priceMax}
                  onChange={(e) => handleFormChange('priceMax', e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bedrooms</label>
              <select
                value={form.bedrooms}
                onChange={(e) => handleFormChange('bedrooms', e.target.value)}
                style={styles.select}
              >
                {BEDROOM_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleSaveAlert}>
                Save Alert
              </button>
            </div>
          </div>
        )}

        {/* Alert List */}
        {alerts.length === 0 && !showForm && (
          <div style={styles.emptyState}>
            <p>No search alerts yet. Create one to get notified when new listings match your criteria.</p>
          </div>
        )}

        {alerts.map((alert) => (
          <div key={alert.id} style={styles.alertCard}>
            <div style={styles.alertTop}>
              <p style={styles.alertName}>
                {alert.name}
                {alert.hasNew && <span style={styles.notificationDot} title="New matches available" />}
              </p>
            </div>
            <p style={styles.alertCriteria}>
              {alert.propertyType} &middot; {alert.city}
              {alert.priceMin || alert.priceMax
                ? ` · ${formatRupiah(alert.priceMin)} - ${formatRupiah(alert.priceMax)}`
                : ''}
              {alert.bedrooms && alert.bedrooms !== 'Any' ? ` · ${alert.bedrooms} BR` : ''}
            </p>
            <div style={styles.alertActions}>
              <button
                style={{
                  ...styles.toggleTrack,
                  background: alert.active ? '#8DC63F' : 'rgba(255,255,255,0.15)',
                }}
                onClick={() => toggleAlert(alert.id)}
                aria-label={alert.active ? 'Disable alert' : 'Enable alert'}
              >
                <div
                  style={{
                    ...styles.toggleThumb,
                    left: alert.active ? 23 : 3,
                  }}
                />
              </button>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flex: 1 }}>
                {alert.active ? 'Active' : 'Paused'}
              </span>
              <button style={styles.deleteBtn} onClick={() => deleteAlert(alert.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
