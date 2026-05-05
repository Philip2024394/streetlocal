import { supabase } from '@/lib/supabase'

const BUCKET = 'product-images'
const PREMIUM_LIMIT = 6

/**
 * Fetch active products for a given user (public view).
 */
export async function getProducts(userId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Fetch all products for owner (includes inactive).
 */
export async function getMyProducts(userId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Add a product with all fields.
 */
export async function addProduct({
  userId, tier, name, price, currency = 'IDR',
  imageUrl, images, description, category, specs,
  variants, stock, salePrice, weight, dimensions,
  tags, condition, madeIn, customOrder, marketScope,
  childCertified, euCertification, yearManufactured,
  returnPolicy,
}) {
  if (!supabase) return null
  if (tier !== 'business') {
    const existing = await getMyProducts(userId)
    if (existing.length >= PREMIUM_LIMIT) {
      throw new Error(`Premium shops are limited to ${PREMIUM_LIMIT} products. Upgrade to Business for unlimited listings.`)
    }
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id:           userId,
      name:              name.trim(),
      price:             parseFloat(price),
      currency,
      image_url:         imageUrl ?? null,
      images:            images ?? null,
      description:       description?.trim() ?? null,
      category:          category ?? null,
      specs:             specs ?? null,
      variants:          variants ?? null,
      stock:             stock != null ? parseInt(stock) : null,
      sale_price:        salePrice != null ? parseFloat(salePrice) : null,
      weight_grams:      weight != null ? parseFloat(weight) : null,
      dimensions:        dimensions ?? null,
      tags:              tags ?? null,
      condition:         condition ?? null,
      made_in:           madeIn ?? null,
      custom_order:      customOrder ?? null,
      market_scope:      marketScope ?? null,
      child_certified:   childCertified ?? null,
      eu_certification:  euCertification ?? null,
      year_manufactured: yearManufactured ?? null,
      return_policy:     returnPolicy ?? null,
      order_index:       0,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Update an existing product — accepts any subset of fields.
 */
export async function updateProduct(productId, fields) {
  if (!supabase) return
  const FIELD_MAP = {
    name:              v => ({ name: v.trim() }),
    price:             v => ({ price: parseFloat(v) }),
    currency:          v => ({ currency: v }),
    imageUrl:          v => ({ image_url: v }),
    images:            v => ({ images: v }),
    description:       v => ({ description: v?.trim() ?? null }),
    category:          v => ({ category: v }),
    specs:             v => ({ specs: v }),
    variants:          v => ({ variants: v }),
    stock:             v => ({ stock: v != null ? parseInt(v) : null }),
    salePrice:         v => ({ sale_price: v != null ? parseFloat(v) : null }),
    weight:            v => ({ weight_grams: v != null ? parseFloat(v) : null }),
    dimensions:        v => ({ dimensions: v }),
    tags:              v => ({ tags: v }),
    condition:         v => ({ condition: v }),
    madeIn:            v => ({ made_in: v }),
    customOrder:       v => ({ custom_order: v }),
    marketScope:       v => ({ market_scope: v }),
    childCertified:    v => ({ child_certified: v }),
    euCertification:   v => ({ eu_certification: v }),
    yearManufactured:  v => ({ year_manufactured: v }),
    returnPolicy:      v => ({ return_policy: v }),
    active:            v => ({ active: v }),
    orderIndex:        v => ({ order_index: v }),
  }

  const patch = {}
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && FIELD_MAP[key]) {
      Object.assign(patch, FIELD_MAP[key](val))
    }
  }

  if (Object.keys(patch).length === 0) return
  const { error } = await supabase.from('products').update(patch).eq('id', productId)
  if (error) throw new Error(error.message)
}

/**
 * Toggle product active/inactive.
 */
export async function toggleProductActive(productId, active) {
  return updateProduct(productId, { active })
}

/**
 * Delete a product and its storage images.
 */
export async function deleteProduct(productId, imageUrl) {
  if (!supabase) return
  if (imageUrl) {
    try {
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split(`/${BUCKET}/`)
      if (pathParts.length > 1) {
        await supabase.storage.from(BUCKET).remove([pathParts[1]])
      }
    } catch { /* silent */ }
  }
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw new Error(error.message)
}

/**
 * Upload a product image and return the public URL.
 */
export async function uploadProductImage(userId, file) {
  if (!supabase) return URL.createObjectURL(file)
  const ext = file.name.split('.').pop().toLowerCase()
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif']
  if (!allowed.includes(ext)) throw new Error('Only JPG, PNG, WEBP or AVIF images are allowed.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be under 10 MB.')

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Search products across all sellers.
 */
export async function searchProducts(query, { category, maxPrice, city, limit = 40 } = {}) {
  if (!supabase || !query?.trim()) return []
  let q = supabase
    .from('products')
    .select('*, profiles:user_id(display_name, photo_url, city, country)')
    .eq('active', true)
    .ilike('name', `%${query.trim()}%`)
    .limit(limit)

  if (category) q = q.eq('category', category)
  if (maxPrice) q = q.lte('price', maxPrice)

  const { data } = await q
  return data ?? []
}

/**
 * Get similar products (same category, different seller, lower price).
 */
export async function getSimilarProducts(productId, category, price, { limit = 8 } = {}) {
  if (!supabase || !category) return []
  const { data } = await supabase
    .from('products')
    .select('*, profiles:user_id(display_name, photo_url, city)')
    .eq('active', true)
    .eq('category', category)
    .neq('id', productId)
    .lte('price', price * 1.2)
    .order('price', { ascending: true })
    .limit(limit)
  return data ?? []
}
