/* ─────────────────────────────────────────────────────────────
   donutI18n — runtime translation hook for DonutSellingPage.

   Mirrors the food-basic/src/i18n.js pattern but scoped to two
   languages (EN + ID) since the donut selling page is targeted
   at Indonesia. Translations live in /public/i18n/donut-<lang>.json
   and are fetched at runtime so adding/editing copy doesn't need
   a rebuild — drop a new key into both JSON files and it's live.

   Locale persistence:
     - URL ?lang=id  → write to localStorage, use immediately
     - localStorage  → restore on next visit
     - default       → 'id' (this page is Indonesia-first)
   ───────────────────────────────────────────────────────────── */
import { useState, useEffect } from 'react'

export const DONUT_LANGUAGES = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'id', label: 'ID', flag: '🇮🇩' },
]

const cache = {}
async function loadLang (code) {
  if (cache[code]) return cache[code]
  try {
    const base = import.meta.env.BASE_URL || '/'
    const res = await fetch(`${base}i18n/donut-${code}.json`)
    if (!res.ok) throw new Error('not found')
    cache[code] = await res.json()
    return cache[code]
  } catch {
    return null
  }
}

export function useDonutLocale () {
  const [locale, setLocale] = useState(() => {
    if (typeof window === 'undefined') return 'id'
    const urlLang = new URLSearchParams(window.location.search).get('lang')
    if (urlLang && DONUT_LANGUAGES.some(l => l.code === urlLang)) {
      localStorage.setItem('sl_donut_locale', urlLang)
      return urlLang
    }
    return localStorage.getItem('sl_donut_locale') || 'id'
  })
  const [t, setT] = useState({})

  useEffect(() => {
    // English is always the fallback — load it first, then overlay the
    // active locale so any missing key on the locale side falls back to EN.
    Promise.all([loadLang('en'), loadLang(locale)]).then(([en, loc]) => {
      setT({ ...(en || {}), ...(loc || {}) })
    })
  }, [locale])

  const setLocaleAndSave = (lang) => {
    try { localStorage.setItem('sl_donut_locale', lang) } catch {}
    setLocale(lang)
  }

  // tx(key, fallback) — returns the translation, or the fallback if the
  // key isn't loaded yet. Use the existing English copy as the fallback
  // so the page never shows raw {{keys}} during the initial fetch.
  const tx = (key, fallback = '') => (t && t[key] != null ? t[key] : fallback)

  return { locale, setLocale: setLocaleAndSave, tx }
}
