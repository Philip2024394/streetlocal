import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LANGUAGE_FLAGS } from '@/utils/lookingForLabels'
import styles from './LanguagePickerSheet.module.css'

const LANGUAGES = [
  'English', 'Mandarin', 'Hindi', 'Spanish', 'French', 'Arabic', 'Bengali',
  'Portuguese', 'Russian', 'Urdu', 'Indonesian', 'Filipino', 'Vietnamese',
  'Thai', 'Malay', 'Japanese', 'Korean', 'Turkish', 'Italian', 'German',
  'Dutch', 'Polish', 'Ukrainian', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Swahili', 'Amharic', 'Yoruba', 'Zulu', 'Tamil', 'Telugu', 'Punjabi',
  'Burmese', 'Khmer', 'Lao', 'Sinhala', 'Nepali', 'Georgian', 'Armenian',
  'Hebrew', 'Persian', 'Pashto', 'Somali', 'Hausa',
].sort()

export { LANGUAGES }

export default function LanguagePickerSheet({ open, value, exclude, onChange, onClose }) {
  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !open) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${delta}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 80) onClose()
      else sheet.style.transform = ''
      startYRef.current = null
      currentYRef.current = 0
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [open, onClose])

  if (!open) return null

  const filtered = LANGUAGES.filter(l =>
    l !== exclude &&
    l.toLowerCase().includes(query.toLowerCase())
  )

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.headerTitle}>Second Language</span>
            <span className={styles.headerSub}>Choose a language you also speak</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search languages…"
            autoComplete="off"
          />
          {query && (
            <button className={styles.searchClear} onClick={() => setQuery('')} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className={styles.list}>
          {value && !query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => { onChange(''); onClose() }}
            >
              ✕ Remove second language
            </button>
          )}
          {filtered.map(lang => {
            const active = value === lang
            return (
              <button
                key={lang}
                type="button"
                className={`${styles.item} ${active ? styles.itemActive : ''}`}
                onClick={() => { onChange(lang); onClose() }}
              >
                <span className={styles.itemFlag}>{LANGUAGE_FLAGS[lang] ?? '🌐'}</span>
                <span className={styles.itemLabel}>{lang}</span>
                {active && (
                  <svg className={styles.itemCheck} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className={styles.empty}>No languages match &ldquo;{query}&rdquo;</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
