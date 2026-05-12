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
  'Javanese':    'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/traditional-javanese-feast-on-banana-leaves.png',
  'Indonesian':  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitled09809809fsdfsdsdfsdfssdasda.png',
  'Sundanese':   'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitled09809809fsdfsdsdfsdfssdasdaasdas.png',
  'Padang':      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/a-feast-of-nasi-padang-dishes.png',
  'Chinese':     'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitled09809809fsdfsdsdfsdfssdasdaasdasasdasd.png',
  'Japanese':    'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitled09809809fsdfsdsdfsdfssdasdaasdasasdasdasdasd.png',
  'Korean':      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitled09809809fsdfsdsdfsdfssdasdaasdasasdasdasdasdasdasd.png',
  'Indian':      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/bold-3d-_indoo_-logo-design.png',
  'Italian':     'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/44.png',
  'Western':     'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/grilled-steak-with-mashed-potatoes-and-salad.png',
  'Seafood':     'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/grilled-seafood-feast-with-garlic-butter.png',
  'Vegetarian':  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/vibrant-vegetarian-platter-with-falafel.png',
  'Street Food': 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/delicious-street-food-spread.png',
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
