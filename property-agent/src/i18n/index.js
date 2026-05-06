import { createElement, createContext, useContext, useEffect, useState } from 'react'
import en from './en'
import id from './id'
import ar from './ar'
import zh from './zh'

export const LANGUAGES = [
  { code: 'id', label: 'Bahasa',   flag: '🇮🇩', dir: 'ltr', image: 'https://ik.imagekit.io/nepgaxllc/Untitledxxxxcc-removebg-preview.png?updatedAt=1777592820803' },
  { code: 'en', label: 'English',  flag: '🇬🇧', dir: 'ltr', image: 'https://ik.imagekit.io/nepgaxllc/Untitledxxxx-removebg-preview.png?updatedAt=1777592742536' },
  { code: 'zh', label: '中文',     flag: '🇨🇳', dir: 'ltr', image: 'https://ik.imagekit.io/nepgaxllc/Untitledxxxxcccc-removebg-preview.png?updatedAt=1777592894702' },
  { code: 'ar', label: 'عربي',     flag: '🇸🇦', dir: 'rtl', image: 'https://ik.imagekit.io/nepgaxllc/Untitledxxxxcccccc-removebg-preview.png?updatedAt=1777592959431' },
]

const TRANSLATIONS = { en, id, ar, zh }
const STORAGE_KEY  = 'indoo_lang'

/** Default to Indonesian — respects any previously saved preference */
function detectLang() {
  return localStorage.getItem(STORAGE_KEY) ?? 'id'
}

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  isFirstPick: false,
  dismissFirstPick: () => {},
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)
  // Show language toast on very first visit (no explicit selection yet)
  const [isFirstPick, setIsFirstPick] = useState(
    () => !localStorage.getItem(STORAGE_KEY)
  )

  const setLang = (code) => {
    localStorage.setItem(STORAGE_KEY, code)
    setLangState(code)
    setIsFirstPick(false)
    // Apply RTL/LTR to document
    const langMeta = LANGUAGES.find(l => l.code === code)
    document.documentElement.dir = langMeta?.dir ?? 'ltr'
    document.documentElement.lang = code
  }

  const dismissFirstPick = () => {
    localStorage.setItem(STORAGE_KEY, lang)
    setIsFirstPick(false)
  }

  // Apply dir on mount
  useEffect(() => {
    const langMeta = LANGUAGES.find(l => l.code === lang)
    document.documentElement.dir = langMeta?.dir ?? 'ltr'
    document.documentElement.lang = lang
  }, [])

  const t = (key) => {
    const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en
    return dict[key] ?? TRANSLATIONS.en[key] ?? key
  }

  return createElement(
    LanguageContext.Provider,
    { value: { lang, setLang, t, isFirstPick, dismissFirstPick } },
    children
  )
}

export const useLanguage = () => useContext(LanguageContext)
