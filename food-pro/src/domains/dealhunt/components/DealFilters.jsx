/**
 * DealFilters — Horizontal scrolling category pills + sort dropdown.
 * Indonesian labels. Dark glass aesthetic.
 */
import styles from './DealFilters.module.css'

const CATEGORIES = [
  { key: 'all', emoji: '🔥', label: 'Semua' },
  { key: 'food', emoji: '🍜', label: 'Food' },
  { key: 'market', emoji: '🛒', label: 'Market' },
  { key: 'massage', emoji: '💆', label: 'Massage' },
  { key: 'rentals', emoji: '🏠', label: 'Rentals' },
  { key: 'rides', emoji: '🛵', label: 'Rides' },
]

const SORT_OPTIONS = [
  { value: 'ending_soon', label: 'Segera Berakhir' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'biggest_discount', label: 'Diskon Terbesar' },
  { value: 'price_low', label: 'Harga Terendah' },
]

export default function DealFilters({
  activeCategory = 'all',
  onCategoryChange,
  sortBy = 'ending_soon',
  onSortChange,
}) {
  return (
    <div className={styles.wrap}>
      {/* Category pills — horizontal scroll */}
      <div className={styles.pillScroll}>
        <div className={styles.pillTrack}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`${styles.pill} ${activeCategory === cat.key ? styles.pillActive : ''}`}
              onClick={() => onCategoryChange?.(cat.key)}
            >
              <span className={styles.pillEmoji}>{cat.emoji}</span>
              <span className={styles.pillLabel}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort dropdown */}
      <div className={styles.sortWrap}>
        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => onSortChange?.(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg className={styles.sortIcon} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  )
}
