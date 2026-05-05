import styles from './RestaurantMenuSheet.module.css'
import { FOOD_CATEGORIES_FULL } from '@/constants/foodCategories'

// Build lookup: category name (lowercase) → image URL
const CAT_IMAGES = {}
FOOD_CATEGORIES_FULL.forEach(c => {
  CAT_IMAGES[c.id] = c.image
  CAT_IMAGES[c.label.toLowerCase()] = c.image
  CAT_IMAGES[c.labelId.toLowerCase()] = c.image
  c.subs.forEach(sub => { CAT_IMAGES[sub.toLowerCase()] = c.image })
})

function getCatImage(catName) {
  if (!catName) return null
  const lower = catName.toLowerCase()
  // Try exact match, then first word, then partial
  if (CAT_IMAGES[lower]) return CAT_IMAGES[lower]
  const firstWord = lower.split(' ')[0]
  if (CAT_IMAGES[firstWord]) return CAT_IMAGES[firstWord]
  // Try checking if any key includes this name
  for (const [key, val] of Object.entries(CAT_IMAGES)) {
    if (key.includes(lower) || lower.includes(key)) return val
  }
  return null
}

// All food categories for drawer preview
// Display names override for shorter labels
const DISPLAY_NAMES = {
  'Fish & Seafood': 'Seafood',
  'Steak & Meat': 'Meat',
  'Burger & Chips': 'Burger',
  'Juice & Smoothie': 'Juice',
  'Sushi & Japanese': 'Sushi',
  'Soda & Soft Drinks': 'Soda',
  'Crispy Chicken': 'Chicken',
  'Kebab & Shawarma': 'Kebab',
  'Snacks & Bites': 'Snacks',
  'Bakso & Street Food': 'Soups',
  'Salad & Healthy': 'Salad',
  'Ice Cream & Gelato': 'Deserts',
  'Boba & Milk Tea': 'Ice Drinks',
  'Satay & Grilled': 'Grilled',
  'Tea & Coffee': 'Tea Coffee',
}

const DRAWER_CATEGORIES = [
  'Rice', 'Noodles', 'Fish & Seafood', 'Steak & Meat',
  'Burger & Chips', 'Pasta', 'Pizza', 'Sushi & Japanese',
  'Korean', 'French', 'Chinese', 'Juice & Smoothie',
  'Soups', 'Soda & Soft Drinks', 'Kebab & Shawarma', 'Crispy Chicken',
  'Tea & Coffee', 'Desserts', 'Satay & Grilled', 'Breakfast',
  'Snacks & Bites', 'Bakso & Street Food', 'Martabak', 'Gorengan',
  'Nasi Padang', 'Boba & Milk Tea', 'Ice Cream & Gelato', 'Salad & Healthy',
  'Kids Menu',
]

// ── Category floating grid (left side) with images ──────────────────────────
export default function CategoryDrawer({
  items,
  categories,
  activeCategory,
  onClose,
  onJumpToCategory,
}) {
  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawerGrid} onClick={e => e.stopPropagation()}>
        {DRAWER_CATEGORIES.map(cat => {
          const img = getCatImage(cat)
          const count = items.filter(i => i.category === cat).length
          return (
            <button
              key={cat}
              className={`${styles.drawerCat} ${activeCategory === cat ? styles.drawerCatActive : ''}`}
              onClick={() => onJumpToCategory(cat)}
              style={{ padding: 0 }}
            >
              {img && (
                <img src={img} alt={cat} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 20 }} />
              )}
              {/* Dark gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 100%)', borderRadius: 'inherit' }} />
              {/* Star rating top-right */}
              <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 2, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 11, color: '#F59E0B' }}>⭐</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>4.8</span>
              </div>
              {/* Category name centered on image */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)', letterSpacing: '0.03em', textAlign: 'center', padding: '0 6px' }}>{DISPLAY_NAMES[cat] ?? cat}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
