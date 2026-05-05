import { useState, useEffect, useRef } from 'react'
import { PLATFORMS } from '@/constants/messagingPlatforms'
import styles from './PlatformPicker.module.css'

/**
 * Compact horizontal-scroll platform picker.
 * Renders inline (no overlay) as a small-height strip with a search bar above it.
 * Single-select; highlights the active choice with a ring.
 */
export default function PlatformPicker({ selected, onSelect }) {
  const [query, setQuery] = useState('')
  const scrollRef = useRef(null)

  // Scroll selected item into view when it changes
  useEffect(() => {
    if (!selected || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-id="${selected}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selected])

  const filtered = query.trim().length > 0
    ? PLATFORMS.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : PLATFORMS

  return (
    <div className={styles.wrap}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search platforms…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
        )}
      </div>

      {/* Horizontal scroll strip */}
      <div className={styles.strip} ref={scrollRef}>
        {filtered.map(platform => {
          const isSelected = selected === platform.id
          return (
            <button
              key={platform.id}
              data-id={platform.id}
              className={`${styles.cell} ${isSelected ? styles.cellSelected : ''}`}
              onClick={() => onSelect(platform.id)}
            >
              <span
                className={styles.icon}
                style={{ background: platform.color, color: platform.textColor,
                  outline: isSelected ? `2px solid ${platform.color}` : 'none',
                  outlineOffset: 2 }}
              >
                {platform.abbr}
              </span>
              <span className={styles.label}>{platform.label}</span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className={styles.empty}>No match for "{query}"</p>
        )}
      </div>
    </div>
  )
}
