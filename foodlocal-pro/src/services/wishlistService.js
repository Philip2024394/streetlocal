/**
 * wishlistService.js
 * Profile wishlist — up to 5 items per type pinned to a dating profile.
 * item_type: 'product' (marketplace gifts) | 'food' (dish cravings)
 * Anyone can view a profile's wishlist and send any item as an anonymous gift.
 */
import { supabase } from '@/lib/supabase'

const DEMO_WISHLIST = []

const DEMO_FOOD_WISHLIST = [
  {
    id:               'demo-food-1',
    product_id:       'demo-food-1',
    product_name:     'Nasi Goreng Special',
    product_price:    45000,
    product_currency: 'IDR',
    product_image:    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&q=70',
    seller_name:      'Warung Bu Sri',
    seller_id:        'demo-seller-1',
    seller_wa:        null,
    item_type:        'food',
  },
  {
    id:               'demo-food-2',
    product_id:       'demo-food-2',
    product_name:     'Pad Thai Prawn',
    product_price:    72000,
    product_currency: 'IDR',
    product_image:    'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=300&q=70',
    seller_name:      'Bangkok Street',
    seller_id:        'demo-seller-2',
    seller_wa:        null,
    item_type:        'food',
  },
  {
    id:               'demo-food-3',
    product_id:       'demo-food-3',
    product_name:     'Matcha Latte',
    product_price:    38000,
    product_currency: 'IDR',
    product_image:    'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300&q=70',
    seller_name:      'Kafe Hijau',
    seller_id:        'demo-seller-3',
    seller_wa:        null,
    item_type:        'food',
  },
  {
    id:               'demo-food-4',
    product_id:       'demo-food-4',
    product_name:     'Beef Ramen',
    product_price:    89000,
    product_currency: 'IDR',
    product_image:    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=70',
    seller_name:      'Ramen Taro',
    seller_id:        'demo-seller-4',
    seller_wa:        null,
    item_type:        'food',
  },
]

// ── Add ───────────────────────────────────────────────────────────────────────

/**
 * Add a product/dish to the signed-in user's wishlist.
 * itemType: 'product' | 'food'
 * Returns { ok, msg } — msg is 'added' | 'already_added' | 'limit_reached' | error string
 */
export async function addToWishlist(product, seller, itemType = 'product') {
  if (!supabase) return { ok: true, msg: 'added' }

  const { data, error } = await supabase.rpc('add_to_wishlist', {
    p_product_id:       String(product.id),
    p_seller_id:        seller.id,
    p_product_name:     product.name,
    p_product_price:    Number(product.price),
    p_product_currency: product.currency ?? 'IDR',
    p_product_image:    product.image ?? product.image_url ?? null,
    p_seller_name:      seller.brandName ?? seller.displayName ?? null,
    p_item_type:        itemType,
  })

  if (error) return { ok: false, msg: error.message }
  return data  // { ok, msg }
}

// ── Remove ────────────────────────────────────────────────────────────────────

export async function removeFromWishlist(userId, productId, itemType = 'product') {
  if (!supabase) return { error: null }
  const { error } = await supabase
    .from('profile_wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', String(productId))
    .eq('item_type', itemType)
  return { error: error?.message ?? null }
}

// ── Read ──────────────────────────────────────────────────────────────────────

/** Fetch the signed-in user's own wishlist for a given type. */
export async function getMyWishlist(userId, itemType = 'product') {
  if (!supabase) return DEMO_WISHLIST
  const { data } = await supabase
    .from('profile_wishlists')
    .select('*')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .order('added_at', { ascending: false })
  return data ?? []
}

/** Fetch any user's public wishlist for a given type (for buyers viewing a profile). */
export async function getProfileWishlist(userId, itemType = 'product') {
  if (!supabase) return itemType === 'food' ? DEMO_FOOD_WISHLIST : DEMO_WISHLIST
  const { data } = await supabase
    .from('profile_wishlists')
    .select('*')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .order('added_at', { ascending: true })
  // Fall back to demo items so the food slider always shows on dating profiles
  if (itemType === 'food' && (!data || data.length === 0)) return DEMO_FOOD_WISHLIST
  return data ?? []
}

/** Check if a specific product is already in the user's wishlist for a given type. */
export async function isInWishlist(userId, productId, itemType = 'product') {
  if (!supabase) return false
  const { data } = await supabase
    .from('profile_wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', String(productId))
    .eq('item_type', itemType)
    .maybeSingle()
  return !!data
}
