/**
 * vendorExtrasService.js
 * CRUD for vendor extras (sauces, drinks, sides) via Supabase.
 * Falls back to localStorage in demo mode.
 */
import { supabase } from '@/lib/supabase'

const LOCAL_KEY = 'indoo_vendor_extras'

// ── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all extras for a restaurant, grouped by category */
export async function getVendorExtras(restaurantId) {
  if (!supabase) return loadLocal()

  const { data, error } = await supabase
    .from('vendor_extras')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('category')
    .order('sort_order')

  if (error || !data) return loadLocal()

  // Group by category
  const grouped = { sauces: [], drinks: [], sides: [] }
  for (const row of data) {
    const cat = row.category
    if (grouped[cat]) {
      grouped[cat].push({
        id: row.item_id,
        name: row.name,
        price: Number(row.price),
        largePrice: row.large_price ? Number(row.large_price) : null,
        hasSize: row.has_size,
      })
    }
  }
  return grouped
}

/** Fetch extras for customer-facing dish detail (public read) */
export async function getRestaurantExtras(restaurantId) {
  if (!supabase) return loadLocal()

  const { data, error } = await supabase
    .from('vendor_extras')
    .select('item_id, name, price, large_price, has_size, category')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('sort_order')

  if (error || !data) return { sauces: [], drinks: [], sides: [] }

  const grouped = { sauces: [], drinks: [], sides: [] }
  for (const row of data) {
    if (grouped[row.category]) {
      grouped[row.category].push({
        label: row.name,
        price: Number(row.price),
      })
    }
  }
  return grouped
}

// ── Write ────────────────────────────────────────────────────────────────────

/** Save a full category of extras (replaces all items in that category) */
export async function saveVendorExtras(restaurantId, category, items) {
  // Always save locally as backup
  saveLocal(category, items)

  if (!supabase) return

  // Delete existing items in this category
  await supabase
    .from('vendor_extras')
    .delete()
    .eq('restaurant_id', restaurantId)
    .eq('category', category)

  if (items.length === 0) return

  // Insert new items
  const rows = items.map((item, i) => ({
    restaurant_id: restaurantId,
    category,
    item_id: item.id ?? `custom_${Date.now()}_${i}`,
    name: item.name,
    price: item.price,
    large_price: item.largePrice ?? null,
    has_size: item.hasSize ?? false,
    sort_order: i,
    is_available: true,
  }))

  await supabase.from('vendor_extras').insert(rows)
}

/** Save bundle discount for a restaurant */
export async function saveBundleDiscount(restaurantId, discount) {
  if (!supabase) {
    const local = loadLocal()
    local.bundleDiscount = discount
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
    return
  }

  await supabase
    .from('restaurants')
    .update({ extras_bundle_discount: discount })
    .eq('id', restaurantId)
}

// ── Save menu item with original_price ───────────────────────────────────────

/** Upsert a menu item (includes original_price for dual pricing) */
export async function saveMenuItem(restaurantId, item) {
  if (!supabase) return item

  const row = {
    restaurant_id: restaurantId,
    name: item.name,
    description: item.description ?? null,
    price: item.price,
    original_price: item.original_price ?? null,
    photo_url: item.photo_url ?? null,
    prep_time_min: item.prep_time_min ?? 10,
    category: item.category ?? 'Main',
    is_available: item.is_available ?? true,
    sort_order: item.sort_order ?? 0,
  }

  if (item.id && !String(item.id).startsWith('local')) {
    // Update existing
    const { data } = await supabase
      .from('menu_items')
      .update(row)
      .eq('id', item.id)
      .select()
      .single()
    return data ?? item
  } else {
    // Insert new
    const { data } = await supabase
      .from('menu_items')
      .insert(row)
      .select()
      .single()
    return data ?? item
  }
}

/** Delete a menu item */
export async function deleteMenuItem(itemId) {
  if (!supabase || String(itemId).startsWith('local')) return
  await supabase.from('menu_items').delete().eq('id', itemId)
}

// ── localStorage fallback ────────────────────────────────────────────────────

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') } catch { return {} }
}

function saveLocal(category, items) {
  const current = loadLocal()
  current[category] = items
  localStorage.setItem(LOCAL_KEY, JSON.stringify(current))
}
