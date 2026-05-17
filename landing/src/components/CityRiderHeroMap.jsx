/* ─────────────────────────────────────────────────────────────────────────
   CityRiderHeroMap — selling-page background map
   Mirrors the live cityrider.id landing's hero map: dark OpenFreeMap
   style, all non-road layers hidden, brand-yellow primary roads, slow
   auto-pan, deterministic golden-angle scatter of 42 pulsing yellow
   rider pings around Yogyakarta.

   Lazy-loaded from CityRiderSellingPage via React.lazy() so maplibre-gl
   only enters the bundle when /cityrider is visited.
   ───────────────────────────────────────────────────────────────────── */
import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'

const YOGYA = { lat: -7.7928, lng: 110.3657 }

// Golden-angle scatter — deterministic, no randomness so SSR + hydration agree
function buildHeroRiders(count) {
  const out = []
  for (let i = 0; i < count; i++) {
    const angle = i * 2.39996323
    const radius = 0.005 + (i / count) * 0.045
    out.push({
      lat: YOGYA.lat + Math.sin(angle) * radius,
      lng: YOGYA.lng + Math.cos(angle) * radius,
    })
  }
  return out
}

export default function CityRiderHeroMap({ riderCount = 42, zoom = 13 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [YOGYA.lng, YOGYA.lat],
      zoom,
      attributionControl: false,
      interactive: false,
    })
    mapRef.current = map

    map.on('load', () => {
      try {
        const layers = map.getStyle().layers
        if (!layers) return
        for (const layer of layers) {
          if (layer.type === 'background') {
            map.setPaintProperty(layer.id, 'background-color', '#0A0A0A')
            continue
          }
          const srcLayer = layer['source-layer']
          const isTransport = srcLayer === 'transportation' || /road|highway|bridge|tunnel|transport/i.test(layer.id)
          if (!isTransport) {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
            continue
          }
          if (layer.type === 'line') {
            const isPrimary = /motorway|trunk|primary/i.test(layer.id)
            const isSecondary = /secondary|tertiary/i.test(layer.id)
            map.setPaintProperty(
              layer.id,
              'line-color',
              isPrimary ? '#FACC15' : isSecondary ? 'rgba(250,204,21,0.55)' : 'rgba(255,255,255,0.18)',
            )
            map.setPaintProperty(
              layer.id,
              'line-width',
              isPrimary
                ? ['interpolate', ['linear'], ['zoom'], 10, 1.5, 16, 4]
                : ['interpolate', ['linear'], ['zoom'], 10, 0.6, 16, 2],
            )
            map.setPaintProperty(layer.id, 'line-opacity', isPrimary ? 0.95 : 0.75)
          }
          // also strip any text/symbol layers regardless
          if (layer.type === 'symbol') {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        }
      } catch { /* style still loading — ignore */ }

      map.resize()
      requestAnimationFrame(() => map.resize())
      setTimeout(() => map.resize(), 300)

      // Slow auto-pan — full rotation every 4 minutes
      let bearing = 0
      const start = performance.now()
      const tick = (now) => {
        if (!mapRef.current) return
        const elapsed = (now - start) / 1000
        bearing = (elapsed * 1.5) % 360
        mapRef.current.setBearing(bearing)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)

      // Drop 42 pulsing yellow rider pings
      const riders = buildHeroRiders(riderCount)
      riders.forEach((r, i) => {
        const delay = -((i * 0.47) % 2.6).toFixed(2) + 's'
        const el = document.createElement('div')
        el.innerHTML = `
          <div style="position: relative; width: 12px; height: 12px;">
            <div style="
              position: absolute; left: 50%; top: 50%;
              width: 12px; height: 12px;
              transform: translate(-50%, -50%);
              border-radius: 50%;
              background: rgba(250,204,21,0.55);
              animation: crPing 2.6s ease-out infinite;
              animation-delay: ${delay};
            "></div>
            <div style="
              position: absolute; left: 50%; top: 50%;
              width: 8px; height: 8px;
              transform: translate(-50%, -50%);
              border-radius: 50%;
              background: #FACC15;
              box-shadow: 0 0 8px rgba(250,204,21,0.85), 0 0 2px rgba(250,204,21,1);
              z-index: 2;
            "></div>
          </div>
        `
        new maplibregl.Marker({ element: el })
          .setLngLat([r.lng, r.lat])
          .addTo(map)
      })
    })

    const ro = new ResizeObserver(() => { mapRef.current?.resize() })
    ro.observe(containerRef.current)

    return () => { ro.disconnect(); map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      <style>{`
        @keyframes crPing {
          0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0.85; }
          80%  { opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(5.5); opacity: 0; }
        }
      `}</style>
    </>
  )
}
