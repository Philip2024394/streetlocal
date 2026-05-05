import { FOOD_CATEGORIES_FULL } from '@/constants/foodCategories'

// Map full categories to the format expected by CategoryDiscoveryScreen
export const FOOD_CATEGORIES = [
  {
    id: 'all',
    label: 'All Food',
    emoji: '🍽',
    tagline: 'Warung, street food, restaurants & more',
    color: '#8DC63F',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  ...FOOD_CATEGORIES_FULL.map(c => ({
    id: c.id,
    label: c.label,
    emoji: '',
    tagline: c.labelId,
    color: '#8DC63F',
    posterUrl: c.image,
  })),
]
