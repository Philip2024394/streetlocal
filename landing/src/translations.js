/**
 * Translation loader for StreetLocal landing page.
 * Loads from shared /translations/ JSON files.
 * Falls back to English for missing keys.
 */
import en from '../../translations/en.json'
import id from '../../translations/id.json'
import ms from '../../translations/ms.json'
import vi from '../../translations/vi.json'
import th from '../../translations/th.json'
import fr from '../../translations/fr.json'
import de from '../../translations/de.json'
import es from '../../translations/es.json'
import zh from '../../translations/zh.json'
import ar from '../../translations/ar.json'
import { COUNTRY_TO_LANG, LANGUAGES } from '../../translations/index.js'

const ALL_TRANSLATIONS = { en, id, ms, vi, th, fr, de, es, zh, ar }

/**
 * Get translations for a locale, with English fallback for missing keys.
 */
export function getTranslation(locale) {
  const t = ALL_TRANSLATIONS[locale] || en
  // Deep merge with English fallback
  if (locale === 'en') return t
  return deepMerge(en, t)
}

function deepMerge(base, override) {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] || {}, override[key])
    } else {
      result[key] = override[key]
    }
  }
  return result
}

export { COUNTRY_TO_LANG, LANGUAGES, ALL_TRANSLATIONS }
