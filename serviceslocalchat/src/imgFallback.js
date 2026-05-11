/* ─── Offline Image Fallback Utility ───
 * Provides inline SVG data-URI placeholders when external images fail to load.
 * Usage: <img onError={imgError} ... /> or <img onError={imgError('food')} ... />
 */

// --- Fallback SVG generators (inline data URIs, no network needed) ---

const svgDataUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`

const FALLBACKS = {
  // Generic placeholder — grey box with image icon
  generic: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><path d="M70 130l25-35 15 20 20-30 30 45H55z" fill="#ccc"/><circle cx="80" cy="75" r="12" fill="#ccc"/></svg>`),

  // Food/menu item — plate with utensils
  food: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff5f0"/><circle cx="100" cy="105" r="50" fill="none" stroke="#ffcbb3" stroke-width="3"/><circle cx="100" cy="105" r="35" fill="#ffcbb3" opacity="0.3"/><rect x="68" y="60" width="3" height="45" rx="1.5" fill="#ffcbb3"/><rect x="78" y="55" width="3" height="50" rx="1.5" fill="#ffcbb3"/><path d="M125 55c0 15-8 20-8 35h3c0-15 8-20 8-35z" fill="#ffcbb3"/><text x="100" y="175" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#cc8866">No image</text></svg>`),

  // Phone screenshot — phone outline
  screenshot: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="400" viewBox="0 0 200 400"><rect width="200" height="400" fill="#1a1a1a" rx="24"/><rect x="8" y="8" width="184" height="384" fill="#2a2a2a" rx="20"/><rect x="70" y="16" width="60" height="18" fill="#1a1a1a" rx="9"/><rect x="80" y="380" width="40" height="4" fill="#444" rx="2"/><text x="100" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#555">Preview</text></svg>`),

  // Theme thumbnail — paint palette style
  theme: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="110" viewBox="0 0 64 110"><rect width="64" height="110" fill="#f8f8f8" rx="8"/><rect x="4" y="4" width="56" height="80" fill="#eee" rx="6"/><circle cx="20" cy="30" r="8" fill="#FFD600" opacity="0.6"/><circle cx="44" cy="25" r="6" fill="#FF6B35" opacity="0.6"/><circle cx="32" cy="50" r="10" fill="#8B0000" opacity="0.4"/><text x="32" y="102" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#999">Theme</text></svg>`),

  // Logo/icon — SL text
  logo: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42"><rect width="42" height="42" fill="#FFD600" rx="10"/><text x="21" y="28" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="900" fill="#1a1a1a">SL</text></svg>`),

  // Banner — wide gradient
  banner: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF6B35" stop-opacity="0.2"/><stop offset="100%" stop-color="#FFD600" stop-opacity="0.2"/></linearGradient></defs><rect width="400" height="200" fill="url(#g)"/><text x="200" y="105" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#999">StreetLocal</text></svg>`),

  // QR code placeholder
  qr: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><rect x="20" y="20" width="50" height="50" fill="#ddd" rx="4"/><rect x="130" y="20" width="50" height="50" fill="#ddd" rx="4"/><rect x="20" y="130" width="50" height="50" fill="#ddd" rx="4"/><rect x="80" y="80" width="40" height="40" fill="#eee" rx="2"/><text x="100" y="185" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#aaa">QR unavailable</text></svg>`),

  // Payment/upload icon
  payment: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f0f4ff" rx="12"/><rect x="15" y="25" width="50" height="30" fill="#ccd6ff" rx="4"/><circle cx="55" cy="40" r="6" fill="#99aadd"/><text x="40" y="70" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#7788bb">Payment</text></svg>`),
}

// Default handler — detects context from image dimensions/alt or falls back to generic
export function imgError(type) {
  if (typeof type === 'object' && type?.target) {
    // Called directly as onError={imgError} (event passed)
    const e = type
    e.target.onerror = null
    e.target.src = FALLBACKS.generic
    return
  }
  // Called as onError={imgError('food')} (returns handler)
  return (e) => {
    e.target.onerror = null
    e.target.src = FALLBACKS[type] || FALLBACKS.generic
  }
}

// Named exports for direct use in background-image CSS fallbacks
export const FALLBACK_URLS = FALLBACKS

export default imgError
