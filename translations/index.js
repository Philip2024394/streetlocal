/**
 * Translation system for StreetLocal.
 * Auto-detects language from IP, account country, or manual selection.
 * Supports: en, id, ms, vi, th, fr, de, es, zh, ar
 */

// Country code → language code mapping
export const COUNTRY_TO_LANG = {
  ID: 'id', // Indonesia
  MY: 'ms', // Malaysia
  SG: 'en', // Singapore
  BN: 'ms', // Brunei
  TH: 'th', // Thailand
  VN: 'vi', // Vietnam
  PH: 'en', // Philippines
  KH: 'en', // Cambodia
  MM: 'en', // Myanmar
  LA: 'en', // Laos
  FR: 'fr', // France
  BE: 'fr', // Belgium
  CH: 'fr', // Switzerland (French)
  CA: 'fr', // Canada (French)
  MC: 'fr', // Monaco
  DE: 'de', // Germany
  AT: 'de', // Austria
  LI: 'de', // Liechtenstein
  ES: 'es', // Spain
  MX: 'es', // Mexico
  AR: 'es', // Argentina
  CO: 'es', // Colombia
  CL: 'es', // Chile
  PE: 'es', // Peru
  VE: 'es', // Venezuela
  CN: 'zh', // China
  TW: 'zh', // Taiwan
  HK: 'zh', // Hong Kong
  MO: 'zh', // Macau
  AE: 'ar', // UAE
  SA: 'ar', // Saudi Arabia
  QA: 'ar', // Qatar
  KW: 'ar', // Kuwait
  BH: 'ar', // Bahrain
  OM: 'ar', // Oman
  EG: 'ar', // Egypt
  JO: 'ar', // Jordan
  LB: 'ar', // Lebanon
  US: 'en',
  GB: 'en',
  AU: 'en',
  NZ: 'en',
  IE: 'en',
  IN: 'en',
  JP: 'en', // Japanese not supported yet, fallback to English
  KR: 'en', // Korean not supported yet
  IT: 'en', // Italian not supported yet
  PT: 'es', // Portuguese close enough to Spanish for now
  BR: 'es', // Brazil
  NL: 'en', // Dutch not supported yet
  SE: 'en', // Swedish not supported yet
  NO: 'en', // Norwegian not supported yet
  DK: 'en', // Danish not supported yet
  FI: 'en', // Finnish not supported yet
  PL: 'en', // Polish not supported yet
  RU: 'en', // Russian not supported yet
}

// Supported languages with labels
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'ms', label: 'Melayu', flag: '🇲🇾' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
]

// Get language from country code
export function getLangFromCountry(countryCode) {
  return COUNTRY_TO_LANG[countryCode] || 'en'
}
