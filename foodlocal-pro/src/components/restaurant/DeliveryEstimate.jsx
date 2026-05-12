/**
 * DeliveryEstimate — Shows estimated delivery cost based on distance.
 * Customer location from localStorage or GPS.
 * Rates from admin settings (hardcoded defaults as fallback).
 */
import { useState, useEffect } from 'react'

const DEFAULT_RATES = {
  base: 5000,
  perKm: 2500,
  min: 7000,
  maxKm: 15,
  freeAbove: 100000,
  roundTo: 1000,
}

// Haversine distance in km
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getCustomer() {
  try { return JSON.parse(localStorage.getItem('sl_customer')) || null } catch { return null }
}
function saveCustomer(data) {
  localStorage.setItem('sl_customer', JSON.stringify(data))
}

export function calculateDelivery(customerLat, customerLon, vendorLat, vendorLon, rates = DEFAULT_RATES) {
  if (!customerLat || !vendorLat) return null
  const km = getDistanceKm(customerLat, customerLon, vendorLat, vendorLon)
  if (km > rates.maxKm) return { km, price: null, tooFar: true }
  const raw = rates.base + (km * rates.perKm)
  const price = Math.max(rates.min, Math.ceil(raw / rates.roundTo) * rates.roundTo)
  return { km: Math.round(km * 10) / 10, price, tooFar: false }
}

export function useCustomerLocation() {
  const [customer, setCustomer] = useState(getCustomer)
  const [showPopup, setShowPopup] = useState(!getCustomer())

  const save = (data) => {
    saveCustomer(data)
    setCustomer(data)
    setShowPopup(false)
  }

  return { customer, showPopup, setShowPopup, save }
}

/**
 * CustomerPopup — First-time popup to get name, WhatsApp, location.
 */
export function CustomerPopup({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [locating, setLocating] = useState(false)
  const [lat, setLat] = useState(null)
  const [lon, setLon] = useState(null)
  const [locError, setLocError] = useState(null)

  const getLocation = () => {
    setLocating(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLon(pos.coords.longitude)
        setLocating(false)
      },
      (err) => {
        setLocError('Could not get location. You can still order for pickup.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return
    onSave({ name: name.trim(), phone: phone.trim(), lat, lon })
  }

  return (
    <div style={s.overlay}>
      <div style={s.popup}>
        <div style={s.handle} />
        <h3 style={s.title}>Welcome! 👋</h3>
        <p style={s.subtitle}>To show delivery estimates and send your order, we need a few details:</p>

        <label style={s.label}>Your Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={s.input} />

        <label style={s.label}>WhatsApp Number</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+62 812 3456 7890" style={s.input} />

        <label style={s.label}>Delivery Location</label>
        {lat ? (
          <div style={s.locDone}>
            <span>📍 Location set</span>
            <button onClick={getLocation} style={s.locRetry}>Update</button>
          </div>
        ) : (
          <button onClick={getLocation} disabled={locating} style={s.locBtn}>
            {locating ? '📡 Getting location...' : '📍 Use My Location'}
          </button>
        )}
        {locError && <p style={s.locError}>{locError}</p>}
        <p style={s.locNote}>Optional — needed for delivery estimates. Skip for pickup orders.</p>

        <button onClick={handleSubmit} style={{
          ...s.submitBtn,
          opacity: name && phone ? 1 : 0.4,
          cursor: name && phone ? 'pointer' : 'default',
        }}>
          Continue
        </button>
        {onClose && <button onClick={onClose} style={s.skipBtn}>Skip for now</button>}
      </div>
    </div>
  )
}

/**
 * DeliveryBanner — Compact delivery estimate shown in cart area.
 */
export function DeliveryBanner({ customerLat, customerLon, vendorLat, vendorLon, subtotal, onChangeLocation }) {
  const delivery = calculateDelivery(customerLat, customerLon, vendorLat || -7.7956, vendorLon || 110.3695)

  if (!delivery) {
    return (
      <div style={s.banner}>
        <span style={{ fontSize: 13, color: '#888' }}>📍 Set location for delivery estimate</span>
        {onChangeLocation && <button onClick={onChangeLocation} style={s.bannerBtn}>Set</button>}
      </div>
    )
  }

  if (delivery.tooFar) {
    return (
      <div style={{ ...s.banner, borderColor: 'rgba(239,68,68,0.3)' }}>
        <div>
          <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 700 }}>📍 {delivery.km} km — Too far for delivery</span>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Pickup only for this distance</div>
        </div>
      </div>
    )
  }

  const isFree = subtotal >= (DEFAULT_RATES.freeAbove)

  return (
    <div style={s.banner}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
          🛵 {delivery.km} km — {isFree ? <span style={{ color: '#8DC63F' }}>FREE delivery</span> : <span>Est. Rp {delivery.price.toLocaleString('id-ID')}</span>}
        </div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
          Estimate based on GoSend rates. You arrange your own driver.
        </div>
      </div>
      {onChangeLocation && <button onClick={onChangeLocation} style={s.bannerBtn}>📍</button>}
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  popup: {
    background: '#1a1a1a',
    borderRadius: '24px 24px 0 0',
    padding: '12px 20px 32px',
    width: '100%',
    maxWidth: 480,
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: '#444',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: 20,
    fontWeight: 900,
    color: '#fff',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    margin: '0 0 20px',
    lineHeight: 1.5,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#aaa',
    display: 'block',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 15,
    marginBottom: 14,
    outline: 'none',
    fontFamily: 'inherit',
  },
  locBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 12,
    border: '1.5px solid rgba(141,198,63,0.3)',
    background: 'rgba(141,198,63,0.08)',
    color: '#8DC63F',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 6,
    fontFamily: 'inherit',
  },
  locDone: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(141,198,63,0.1)',
    border: '1.5px solid rgba(141,198,63,0.3)',
    color: '#8DC63F',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
  },
  locRetry: {
    background: 'none',
    border: 'none',
    color: '#8DC63F',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  locError: {
    fontSize: 12,
    color: '#EF4444',
    margin: '4px 0',
  },
  locNote: {
    fontSize: 11,
    color: '#666',
    margin: '0 0 20px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    border: 'none',
    background: '#8DC63F',
    color: '#000',
    fontSize: 16,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    minHeight: 48,
  },
  skipBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: '#666',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: 'inherit',
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 12,
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(141,198,63,0.15)',
    marginBottom: 10,
  },
  bannerBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 8,
    padding: '6px 10px',
    color: '#8DC63F',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
}
