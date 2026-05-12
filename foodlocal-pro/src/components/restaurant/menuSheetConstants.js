// Shared constants and helpers for RestaurantMenuSheet sub-components

export function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

// ── Demo food orders seed ──────────────────────────────────────────────────────
const DEMO_FOOD_ORDERS = [
  { id: 'food-001', restaurant: 'Warung Mak Beng', items: [{name: 'Nasi Goreng', qty: 2, price: 25000}], total: 60000, delivery: 10000, status: 'delivered', created_at: '2026-04-19T10:00:00Z' },
  { id: 'food-002', restaurant: 'Babi Guling Pak Malen', items: [{name: 'Babi Guling Set', qty: 1, price: 45000}], total: 55000, delivery: 10000, status: 'preparing', created_at: '2026-04-20T08:30:00Z' },
  { id: 'food-003', restaurant: 'Ayam Betutu Men Tempeh', items: [{name: 'Ayam Betutu', qty: 1, price: 55000}, {name: 'Es Jeruk', qty: 2, price: 8000}], total: 81000, delivery: 10000, status: 'pending', created_at: '2026-04-20T09:00:00Z' },
]

function seedDemoOrders() {
  const existing = localStorage.getItem('indoo_food_orders')
  if (!existing) {
    localStorage.setItem('indoo_food_orders', JSON.stringify(DEMO_FOOD_ORDERS))
    return DEMO_FOOD_ORDERS
  }
  return JSON.parse(existing)
}

export function getFoodOrders() {
  return seedDemoOrders()
}

export function saveFoodOrders(orders) {
  localStorage.setItem('indoo_food_orders', JSON.stringify(orders))
}

export const STATUS_COLORS = {
  pending: '#F59E0B',
  awaiting_payment: '#F59E0B',
  preparing: '#3B82F6',
  on_delivery: '#8B5CF6',
  delivered: '#22C55E',
  cancelled: '#EF4444',
}

export const STATUS_LABELS = {
  pending: 'Pending',
  awaiting_payment: 'Awaiting Payment',
  preparing: 'Preparing',
  on_delivery: 'On Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const EVENT_LABELS = {
  live_music:    '🎵 Live Music',
  birthday_setup:'🎂 Birthday Setup',
  private_room:  '🚪 Private Room',
  sound_system:  '🎤 Sound System',
  party_package: '🥂 Party Packages',
  wedding:       '💍 Weddings',
}

export const CATEGORY_EMOJIS = {
  'Main':     '🍽',
  'Drinks':   '🥤',
  'Snacks':   '🍿',
  'Sides':    '🥗',
  'Desserts': '🧁',
  'Rice':     '🍚',
  'Noodles':  '🍜',
  'Grilled':  '🔥',
  'Seafood':  '🦐',
  'Breakfast':'🌅',
  'Soup':     '🍲',
  'Salad':    '🥗',
}

export const CATEGORY_GRADIENTS = {
  'Main':     'linear-gradient(160deg, #1a0d00 0%, #0d0d0d 100%)',
  'Drinks':   'linear-gradient(160deg, #000d1a 0%, #0d0d0d 100%)',
  'Snacks':   'linear-gradient(160deg, #0d1a00 0%, #0d0d0d 100%)',
  'Sides':    'linear-gradient(160deg, #1a1500 0%, #0d0d0d 100%)',
  'Desserts': 'linear-gradient(160deg, #1a0015 0%, #0d0d0d 100%)',
}
