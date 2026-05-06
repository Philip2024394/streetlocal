/**
 * PropertyMap — Leaflet map showing property location pin.
 * Works on both app and website.
 */
import { useEffect, useRef, useState } from 'react'

const DEFAULT_CENTER = [-7.7928, 110.3653] // Yogyakarta
const DEFAULT_ZOOM = 14

export default function PropertyMap({ lat, lng, title, height = 200, style = {} }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const [L, setL] = useState(null)

  const mapLat = lat || DEFAULT_CENTER[0]
  const mapLng = lng || DEFAULT_CENTER[1]

  // Dynamically import Leaflet
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.L) { setL(window.L); return }
    import('leaflet').then(mod => {
      const leaflet = mod.default || mod
      window.L = leaflet
      setL(leaflet)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!L || !containerRef.current) return
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

    const map = L.map(containerRef.current, {
      center: [mapLat, mapLng],
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Green dot with satellite ping effect
    const icon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:40px;height:40px;border-radius:50%;border:2px solid rgba(141,198,63,0.4);animation:mapPing 2s ease-out infinite"></div>
        <div style="position:absolute;width:28px;height:28px;border-radius:50%;border:1.5px solid rgba(141,198,63,0.25);animation:mapPing 2s ease-out infinite 0.5s"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:#8DC63F;border:2.5px solid #fff;box-shadow:0 0 12px rgba(141,198,63,0.6),0 0 24px rgba(141,198,63,0.3);position:relative;z-index:2"></div>
      </div>
      <style>@keyframes mapPing{0%{transform:scale(0.5);opacity:1}100%{transform:scale(1.8);opacity:0}}</style>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    L.marker([mapLat, mapLng], { icon }).addTo(map)
      .bindPopup(`<b style="font-size:13px">${title || 'Property Location'}</b>`)

    mapRef.current = map

    // Fix: invalidate size after render
    setTimeout(() => map.invalidateSize(), 200)

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [L, mapLat, mapLng, title])

  if (!L) {
    return (
      <div style={{ height, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, ...style }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 20, height: 20, border: '2px solid rgba(141,198,63,0.3)', borderTopColor: '#8DC63F', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 6px' }} />
          <span>Loading map...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', ...style }}>
      <div ref={containerRef} style={{ height, width: '100%' }} />
    </div>
  )
}
