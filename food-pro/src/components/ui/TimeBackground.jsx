import { useState, useEffect } from 'react'
import styles from './TimeBackground.module.css'

/**
 * Time-based full-screen background that cycles through three images
 * based on Indonesia WIB time (UTC+7).
 *
 * Periods (WIB):
 *   05:00 – 07:30  → Sunrise/sunset image
 *   07:30 – 17:30  → Daytime image
 *   17:30 – 19:30  → Sunset image (same as sunrise), with progressive dark overlay
 *   19:30 – 05:00  → Night image
 */

const IMAGES = {
  sunrise: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  day:     'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  night:   'https://ik.imagekit.io/nepgaxllc/Untitledfsdf.png?updatedAt=1775555383465',
}

// WIB = UTC+7, returns fractional hours 0..24
function getWIBHour() {
  // Use user's local time so background matches their actual daylight
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

function getPhase(h) {
  if (h >= 5   && h < 7.5)  return 'sunrise'
  if (h >= 7.5 && h < 17.5) return 'day'
  if (h >= 17.5 && h < 19.5) return 'sunset'   // sunset = same image as sunrise
  return 'night'
}

/**
 * During sunset (17:30 → 19:30) return 0..1 progress toward darkness.
 * 0 = bright start of sunset, 1 = fully dark (max overlay).
 */
function getSunsetProgress(h) {
  if (h < 17.5 || h >= 19.5) return 0
  return (h - 17.5) / 2  // 0 at 17:30, 1 at 19:30
}

export default function TimeBackground({ children }) {
  const [hour,   setHour]   = useState(getWIBHour)
  const [loaded, setLoaded] = useState({})

  // Refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => setHour(getWIBHour()), 60_000)
    return () => clearInterval(id)
  }, [])

  const phase    = getPhase(hour)
  const progress = getSunsetProgress(hour)
  const isNight  = phase === 'night'
  const isSunset = phase === 'sunset'
  const isDay    = phase === 'day'

  // Shade peaks mid-sunset then fades to 0 as night image covers — no shade at night
  const overlayOpacity = isSunset ? Math.sin(progress * Math.PI) * 0.45 : 0

  // Which image to show per phase
  const bgSrc  = isDay ? IMAGES.day : isNight ? IMAGES.night : IMAGES.sunrise

  // Cross-fade: night image fades in across full sunset window, fully opaque by night
  const nightFadeOpacity = isSunset ? progress : 0

  const handleLoad = (key) => setLoaded(prev => ({ ...prev, [key]: true }))

  return (
    <div className={styles.root}>

      {/* Base image — sunrise or day or night */}
      <img
        key={bgSrc}
        src={bgSrc}
        alt=""
        className={`${styles.layer} ${loaded[bgSrc] ? styles.layerVisible : ''}`}
        onLoad={() => handleLoad(bgSrc)}
        draggable={false}
      />

      {/* Night image fades in progressively during sunset */}
      {isSunset && (
        <img
          src={IMAGES.night}
          alt=""
          className={styles.layer}
          style={{ opacity: nightFadeOpacity, transition: 'opacity 4s ease' }}
          onLoad={() => handleLoad('night-fade')}
          draggable={false}
        />
      )}

      {/* Dark overlay that deepens during sunset */}
      {overlayOpacity > 0 && (
        <div
          className={styles.darkOverlay}
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Permanent base dim for readability */}
      <div className={styles.baseDim} />

      {/* All app UI on top */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
