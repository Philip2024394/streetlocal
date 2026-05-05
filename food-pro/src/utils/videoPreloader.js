/**
 * videoPreloader.js
 *
 * Call preloadVideos(urls) once on app mount.
 * Creates detached <video> elements with preload="auto" — triggers the
 * browser to fetch and cache each file in the background without any
 * visible element or autoplay. By the time the user opens a screen that
 * uses the video, it loads from cache and plays instantly.
 *
 * Keeps a module-level cache so repeated calls don't re-fetch.
 */

const _cache = new Map() // url → HTMLVideoElement

export function preloadVideos(urls = []) {
  urls.filter(Boolean).forEach(url => {
    if (_cache.has(url)) return // already kicked off

    const v = document.createElement('video')
    v.preload  = 'auto'
    v.muted    = true
    v.playsInline = true
    v.src      = url
    v.load()            // starts fetching without playing
    _cache.set(url, v)
  })
}

/** Returns true if the URL is already in the preload cache */
export function isPreloaded(url) {
  return _cache.has(url)
}
