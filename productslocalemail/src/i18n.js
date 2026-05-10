/**
 * i18n for Food Basic App
 * 10 languages with English fallback.
 */
import { useState, useEffect } from 'react'

const COUNTRY_TO_LANG = {
  ID: 'id', MY: 'ms', SG: 'en', TH: 'th', VN: 'vi', PH: 'fil',
  FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr',
  DE: 'de', AT: 'de',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es',
  CN: 'zh', TW: 'zh', HK: 'zh',
  AE: 'ar', SA: 'ar', QA: 'ar', KW: 'ar', EG: 'ar',
  US: 'en', GB: 'en', AU: 'en', NZ: 'en', IN: 'en',
}

// Reverse lookup: lang code → country codes
const LANG_TO_COUNTRIES = {
  id: ['ID'], ms: ['MY'], th: ['TH'], vi: ['VN'], fil: ['PH'],
  fr: ['FR', 'BE', 'CH', 'CA'], de: ['DE', 'AT'],
  es: ['ES', 'MX', 'AR', 'CO'], zh: ['CN', 'TW', 'HK'],
  ar: ['AE', 'SA', 'QA', 'KW', 'EG'], en: ['US', 'GB', 'AU', 'NZ', 'SG', 'IN'],
}

export const LANGUAGES = [
  { code: 'en', flag: 'https://flagcdn.com/w40/gb.png', label: 'EN' },
  { code: 'id', flag: 'https://flagcdn.com/w40/id.png', label: 'ID' },
  { code: 'ms', flag: 'https://flagcdn.com/w40/my.png', label: 'MY' },
  { code: 'vi', flag: 'https://flagcdn.com/w40/vn.png', label: 'VN' },
  { code: 'th', flag: 'https://flagcdn.com/w40/th.png', label: 'TH' },
  { code: 'fr', flag: 'https://flagcdn.com/w40/fr.png', label: 'FR' },
  { code: 'de', flag: 'https://flagcdn.com/w40/de.png', label: 'DE' },
  { code: 'es', flag: 'https://flagcdn.com/w40/es.png', label: 'ES' },
  { code: 'zh', flag: 'https://flagcdn.com/w40/cn.png', label: 'CN' },
  { code: 'ar', flag: 'https://flagcdn.com/w40/sa.png', label: 'AR' },
  { code: 'fil', flag: 'https://flagcdn.com/w40/ph.png', label: 'PH' },
]

// Translations loaded from public folder at runtime
const cache = {}

async function loadLang(code) {
  if (cache[code]) return cache[code]
  try {
    const base = import.meta.env.BASE_URL || '/'
    const res = await fetch(`${base}i18n/app-${code}.json`)
    if (!res.ok) throw new Error('not found')
    cache[code] = await res.json()
    return cache[code]
  } catch {
    return null
  }
}

export function useAppLocale() {
  const [locale, setLocale] = useState(() => {
    // Priority: URL param > localStorage > default
    const urlLang = new URLSearchParams(window.location.search).get('lang')
    if (urlLang && LANGUAGES.some(l => l.code === urlLang)) {
      localStorage.setItem('sl_app_locale', urlLang)
      localStorage.setItem('sl_app_native', urlLang)
      return urlLang
    }
    return localStorage.getItem('sl_app_locale') || 'en'
  })
  const [nativeLang, setNativeLang] = useState(() => localStorage.getItem('sl_app_native') || 'en')
  const [countryCode, setCountryCode] = useState(() => localStorage.getItem('sl_app_country') || null)
  const [t, setT] = useState({})

  useEffect(() => {
    Promise.all([loadLang('en'), loadLang(locale)]).then(([en, loc]) => {
      setT({ ...(en || {}), ...(loc || {}) })
    })
  }, [locale])

  // Auto-detect on first visit (only if no URL param and no saved locale)
  useEffect(() => {
    if (localStorage.getItem('sl_app_native')) return
    if (new URLSearchParams(window.location.search).get('lang')) return
    fetch('https://ip2c.org/s')
      .then(r => r.text())
      .then(text => {
        const country = text.split(';')[1]
        const lang = COUNTRY_TO_LANG[country] || 'en'
        localStorage.setItem('sl_app_native', lang)
        localStorage.setItem('sl_app_locale', lang)
        localStorage.setItem('sl_app_country', country)
        setNativeLang(lang)
        setCountryCode(country)
        setLocale(lang)
      })
      .catch(() => {})
  }, [])

  const setLocaleAndSave = (lang) => {
    localStorage.setItem('sl_app_locale', lang)
    setLocale(lang)
  }

  return { locale, setLocale: setLocaleAndSave, t, nativeLang, countryCode, LANG_TO_COUNTRIES }
}
