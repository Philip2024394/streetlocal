/**
 * Canonical cuisine type list — single source of truth.
 * Used by: RestaurantDashboard, RestaurantsTab (admin), DatingCard food carousel.
 * Any new cuisine type must be added here first.
 */

export const CUISINE_TYPES = [
  'Javanese',
  'Indonesian',
  'Sundanese',
  'Padang',
  'Chinese',
  'Japanese',
  'Korean',
  'Indian',
  'Italian',
  'Western',
  'Seafood',
  'Vegetarian',
  'Street Food',
]

/**
 * Hero image for each cuisine type.
 * Used as: dating profile cuisine circles, restaurant cover fallback.
 */
export const CUISINE_IMAGES = {
  'Javanese':    'https://ik.imagekit.io/nepgaxllc/Traditional%20Javanese%20feast%20on%20banana%20leaves.png',
  'Indonesian':  'https://ik.imagekit.io/nepgaxllc/Untitled09809809fsdfsdsdfsdfssdasda.png',
  'Sundanese':   'https://ik.imagekit.io/nepgaxllc/Untitled09809809fsdfsdsdfsdfssdasdaasdas.png',
  'Padang':      'https://ik.imagekit.io/nepgaxllc/A%20feast%20of%20nasi%20Padang%20dishes.png',
  'Chinese':     'https://ik.imagekit.io/nepgaxllc/Untitled09809809fsdfsdsdfsdfssdasdaasdasasdasd.png',
  'Japanese':    'https://ik.imagekit.io/nepgaxllc/Untitled09809809fsdfsdsdfsdfssdasdaasdasasdasdasdasd.png',
  'Korean':      'https://ik.imagekit.io/nepgaxllc/Untitled09809809fsdfsdsdfsdfssdasdaasdasasdasdasdasdasdasd.png',
  'Indian':      'https://ik.imagekit.io/nepgaxllc/Untitled09809809fsdfsdsdfsdfssdasdaasdasasdasdasdasdasdasdasdasd.png',
  'Italian':     'https://ik.imagekit.io/nepgaxllc/44.png',
  'Western':     'https://ik.imagekit.io/nepgaxllc/Grilled%20steak%20with%20mashed%20potatoes%20and%20salad.png',
  'Seafood':     'https://ik.imagekit.io/nepgaxllc/Grilled%20seafood%20feast%20with%20garlic%20butter.png',
  'Vegetarian':  'https://ik.imagekit.io/nepgaxllc/Vibrant%20vegetarian%20platter%20with%20falafel.png',
  'Street Food': 'https://ik.imagekit.io/nepgaxllc/Delicious%20street%20food%20spread.png',
}

/** Emoji for each cuisine type — fallback when no CUISINE_IMAGES entry exists */
export const CUISINE_EMOJIS = {
  'Javanese':    '🍚',
  'Indonesian':  '🥘',
  'Sundanese':   '🌿',
  'Padang':      '🍖',
  'Chinese':     '🥡',
  'Japanese':    '🍣',
  'Korean':      '🍜',
  'Indian':      '🍛',
  'Italian':     '🍝',
  'Western':     '🍔',
  'Seafood':     '🦐',
  'Vegetarian':  '🥗',
  'Street Food': '🌮',
}
