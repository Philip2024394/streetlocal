/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CINEMATIC DELIVERY IMAGES — Daytime Restaurant Orders
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Single source of truth for the visual delivery tracking experience.
 * Each entry: { img, text, speed } — image URL, status text, km/h speed.
 *
 * RULES:
 * - These arrays are ONLY for daytime restaurant delivery tracking.
 * - Do NOT import or mix with any other image set (night, street vendor, etc).
 * - Images are preloaded on mount for offline/slow-network resilience.
 * - Each image within a stage displays for EQUAL time (no skipping, no repeating).
 * - Fallback placeholder guarantees something always shows if CDN fails.
 */

// ── Fallback: solid branded frame shown if any image fails to load ──────────
export const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect fill="#0a0a0a" width="800" height="600"/>
    <circle cx="400" cy="260" r="40" fill="none" stroke="#8DC63F" stroke-width="4">
      <animateTransform attributeName="transform" type="rotate" from="0 400 260" to="360 400 260" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <text x="400" y="340" text-anchor="middle" fill="#8DC63F" font-family="system-ui" font-size="18" font-weight="800">INDOO</text>
    <text x="400" y="365" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-family="system-ui" font-size="12">Loading delivery view...</text>
  </svg>`
)

// ── Stage 1: Driver heading to restaurant (8 images) ───────────────────────
export const STAGE1_IMAGES = [
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2006_36_14%20PM.png?updatedAt=1776339391906', text: 'Your driver is en route to the restaurant', speed: 38 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2006_35_10%20PM.png?updatedAt=1776339327027', text: 'Travelling on a clear route', speed: 45 },
  { img: 'https://ik.imagekit.io/nepgaxllc/Rider_s%20view%20of%20a%20sport%20motorcycle%20dashboard.png?updatedAt=1776155502901', text: 'Adjusting speed through a residential zone', speed: 18 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2004_55_25%20AM.png', text: 'Maintaining excellent pace', speed: 40 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2004_06_54%20AM.png', text: 'Restaurant notified — your order is being prepared', speed: 35 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2004_01_25%20AM.png', text: 'Briefly stopped at a traffic signal', speed: 0 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2002_55_36%20AM.png?updatedAt=1776801354200', text: 'Approaching the restaurant for collection', speed: 30 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2003_04_40%20AM.png?updatedAt=1776801900155', text: 'Driver has arrived at the restaurant', speed: 0 },
]

// ── Stage 2: Driver picked up food → heading to customer (5 images) ─────────
export const STAGE2_IMAGES = [
  { img: 'https://ik.imagekit.io/nepgaxllc/pick%204.png?updatedAt=1776800928696', text: 'Collecting your order from the restaurant', speed: 0 },
  { img: 'https://ik.imagekit.io/nepgaxllc/Untitleddsddaadsds333sa.png', text: 'Your order is on its way to you', speed: 38 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2005_24_01%20AM.png', text: 'Making excellent progress on a clear route', speed: 45 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2005_14_30%20AM.png', text: 'Entering your delivery area', speed: 32 },
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2004_55_25%20AM.png', text: 'Right on schedule', speed: 28 },
]

// ── Stage 2 — STREET VENDOR variants (day + night pickup image, rest same) ──
export const STAGE2_STREET_DAY = [
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2007_27_08%20AM.png', text: 'Collecting your order from the street vendor', speed: 0 },
  ...STAGE2_IMAGES.slice(1),
]

export const STAGE2_STREET_NIGHT = [
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2007_23_20%20AM.png', text: 'Collecting your order from the street vendor', speed: 0 },
  ...STAGE2_IMAGES.slice(1),
]

// ── Stage 3: Driver arrived (1 image) ───────────────────────────────────────
export const STAGE3_IMAGES = [
  { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2005_03_00%20AM.png', text: 'Your driver has arrived — enjoy your meal', speed: 0 },
]

// ── All image URLs for preloading ───────────────────────────────────────────
export const ALL_CINEMATIC_URLS = [
  ...STAGE1_IMAGES,
  ...STAGE2_IMAGES,
  ...STAGE3_IMAGES,
  STAGE2_STREET_DAY[0],
  STAGE2_STREET_NIGHT[0],
].map(s => s.img)

/**
 * Preload all cinematic delivery images into browser cache.
 * Call once when delivery tracking begins. Each image loads in parallel.
 * Failed loads are silently caught — the fallback SVG covers failures.
 */
export function preloadCinematicImages() {
  ALL_CINEMATIC_URLS.forEach(url => {
    const img = new Image()
    img.src = url
  })
}

/**
 * Get the correct stage array for a given driver phase.
 * Accepts optional vendorType ('restaurant' | 'street_vendor') and isNight boolean.
 * Centralised — no phase-to-array mapping logic elsewhere.
 */
export function getStageImages(driverPhase, vendorType = 'restaurant', isNight = false) {
  if (driverPhase === 'to_restaurant') return STAGE1_IMAGES
  if (driverPhase === 'to_customer') {
    if (vendorType === 'street_vendor') {
      return isNight ? STAGE2_STREET_NIGHT : STAGE2_STREET_DAY
    }
    return STAGE2_IMAGES
  }
  return STAGE3_IMAGES
}

/**
 * DEMO_INTERVAL_MS — fixed equal interval per image in demo mode.
 * In live mode the interval is ETA ÷ image count (min 3s).
 */
export const DEMO_INTERVAL_MS = 4000
