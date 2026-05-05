/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Daily Deal Service — restaurants set daily specials per day of week
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Restaurant picks menu item(s) + discount for each day they want.
 * Auto-posts to Deal Hunt. Customer sees it on browse + deal hunt.
 */
import { supabase } from '@/lib/supabase'

const LOCAL_KEY = 'indoo_daily_deals'

// Get WIB day (0=Sun, 6=Sat)
function getWIBDay() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  return new Date(utcMs + 7 * 3_600_000).getDay()
}

/**
 * Get a restaurant's daily deals config
 * Returns: { [dayIndex]: { items: [{ itemId, itemName, originalPrice, discountPct }], active: true } }
 */
export async function getRestaurantDailyDeals(restaurantId) {
  if (supabase) {
    const { data } = await supabase
      .from('restaurant_daily_deals')
      .select('*')
      .eq('restaurant_id', restaurantId)
    if (data?.length) {
      const config = {}
      data.forEach(d => { config[d.day_index] = { items: d.items ?? [], active: d.active ?? true } })
      return config
    }
  }
  // Demo fallback
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
    return all[restaurantId] ?? {}
  } catch { return {} }
}

/**
 * Get today's active deal for a restaurant (if any)
 */
export async function getTodayDealForRestaurant(restaurantId) {
  const config = await getRestaurantDailyDeals(restaurantId)
  const today = getWIBDay()
  const todayDeal = config[today]
  if (!todayDeal || !todayDeal.active || !todayDeal.items?.length) return null
  return { day: today, ...todayDeal }
}

/**
 * Check if restaurant has ANY daily deals configured (any day)
 */
export async function hasAnyDailyDeals(restaurantId) {
  const config = await getRestaurantDailyDeals(restaurantId)
  return Object.values(config).some(d => d.active && d.items?.length > 0)
}

/**
 * Save a daily deal for a restaurant (restaurant dashboard)
 */
export async function saveDailyDeal(restaurantId, dayIndex, items, active = true) {
  if (supabase) {
    await supabase.from('restaurant_daily_deals').upsert({
      restaurant_id: restaurantId,
      day_index: dayIndex,
      items,
      active,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'restaurant_id,day_index' })
  }
  // Always save locally
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
    if (!all[restaurantId]) all[restaurantId] = {}
    all[restaurantId][dayIndex] = { items, active }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all))
  } catch {}
}

/**
 * Remove a daily deal
 */
export async function removeDailyDeal(restaurantId, dayIndex) {
  if (supabase) {
    await supabase.from('restaurant_daily_deals')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('day_index', dayIndex)
  }
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
    if (all[restaurantId]) { delete all[restaurantId][dayIndex]; localStorage.setItem(LOCAL_KEY, JSON.stringify(all)) }
  } catch {}
}

/**
 * Get all restaurants with active deals today (for browse screen / deal hunt)
 */
export async function getAllTodayDeals() {
  const today = getWIBDay()
  if (supabase) {
    const { data } = await supabase
      .from('restaurant_daily_deals')
      .select('*, restaurant:restaurants(id, name, cover_url, cuisine_type, city, rating, bank)')
      .eq('day_index', today)
      .eq('active', true)
    return data ?? []
  }
  // Demo: mock deals — 1 discount per listing, up to 3 items
  return [
    {
      id: 'dd1', restaurant_id: 1, day_index: today, active: true, discountPct: 25,
      items: [
        { itemId: 1, itemName: 'Nasi Gudeg Komplit', originalPrice: 28000, quantity: 50, claimed: 14, photoUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400' },
        { itemId: 2, itemName: 'Nasi Gudeg Telur', originalPrice: 18000, quantity: 40, claimed: 28, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
        { itemId: 8, itemName: 'Es Teh Manis', originalPrice: 5000, quantity: 100, claimed: 62, photoUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400' },
      ],
      restaurant: { id: 1, name: 'Warung Bu Sari', city: 'Yogyakarta', cuisine_type: 'Javanese', rating: 4.8 },
    },
    {
      id: 'dd2', restaurant_id: 2, day_index: today, active: true, discountPct: 30,
      items: [
        { itemId: 14, itemName: 'Bakso Jumbo Urat', originalPrice: 25000, quantity: 60, claimed: 41, photoUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400' },
        { itemId: 15, itemName: 'Bakso Isi Telur', originalPrice: 20000, quantity: 45, claimed: 12, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
        { itemId: 16, itemName: 'Mie Ayam Bakso', originalPrice: 22000, quantity: 30, claimed: 22, photoUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400' },
      ],
      restaurant: { id: 2, name: 'Bakso Pak Budi', city: 'Yogyakarta', cuisine_type: 'Indonesian', rating: 4.5 },
    },
    {
      id: 'dd3', restaurant_id: 4, day_index: today, active: true, discountPct: 20,
      items: [
        { itemId: 20, itemName: 'Nasi Goreng Istimewa', originalPrice: 28000, quantity: 80, claimed: 33, photoUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400' },
        { itemId: 21, itemName: 'Nasi Goreng Seafood', originalPrice: 35000, quantity: 40, claimed: 18, photoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400' },
        { itemId: 24, itemName: 'Sate Ayam 5pcs', originalPrice: 18000, quantity: 50, claimed: 37, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
      ],
      restaurant: { id: 4, name: 'Nasi Goreng Pak Harto', city: 'Yogyakarta', cuisine_type: 'Indonesian', rating: 4.7 },
    },
    {
      id: 'dd4', restaurant_id: 10, day_index: today, active: true, discountPct: 25,
      items: [
        { itemId: 81, itemName: 'Sate Ayam 10pcs', originalPrice: 35000, quantity: 70, claimed: 48, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
        { itemId: 82, itemName: 'Gule Kambing', originalPrice: 35000, quantity: 30, claimed: 11, photoUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400' },
        { itemId: 80, itemName: 'Sate Kambing 10pcs', originalPrice: 55000, quantity: 25, claimed: 19, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
      ],
      restaurant: { id: 10, name: 'Sate & Gule Pak Sabar', city: 'Yogyakarta', cuisine_type: 'Javanese', rating: 4.8 },
    },
    {
      id: 'dd5', restaurant_id: 7, day_index: today, active: true, discountPct: 20,
      items: [
        { itemId: 50, itemName: 'Udang Bakar Madu', originalPrice: 85000, quantity: 20, claimed: 7, photoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400' },
        { itemId: 51, itemName: 'Cumi Goreng Tepung', originalPrice: 55000, quantity: 35, claimed: 21, photoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400' },
        { itemId: 52, itemName: 'Ikan Bakar Bumbu Bali', originalPrice: 75000, quantity: 15, claimed: 9, photoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400' },
      ],
      restaurant: { id: 7, name: 'Seafood Pak Dhe Bejo', city: 'Yogyakarta', cuisine_type: 'Seafood', rating: 4.9 },
    },
  ]
}

/**
 * Apply daily deal discount to a cart item (if applicable)
 */
export function applyDealDiscount(item, todayDeal) {
  if (!todayDeal?.items?.length) return item
  const dealItem = todayDeal.items.find(d => d.itemId === item.id)
  if (!dealItem) return item
  const discountedPrice = Math.round(item.price * (1 - dealItem.discountPct / 100))
  return {
    ...item,
    originalPrice: item.price,
    price: discountedPrice,
    dealDiscount: dealItem.discountPct,
    isDealItem: true,
  }
}
