/**
 * Multi-Restaurant Cart Service
 * Manages a global cart that can hold items from multiple restaurants.
 * Each restaurant's items are grouped and checkout creates separate orders per restaurant.
 */

const CART_KEY = 'indoo_multi_cart'
const CART_TTL = 24 * 60 * 60 * 1000

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY))
    if (saved && Date.now() - saved.ts < CART_TTL) return saved.carts
  } catch {}
  return {}
}

function saveCart(carts) {
  if (Object.keys(carts).length === 0) {
    localStorage.removeItem(CART_KEY)
  } else {
    localStorage.setItem(CART_KEY, JSON.stringify({ carts, ts: Date.now() }))
  }
}

/** Get all restaurant carts: { [restaurantId]: { restaurant, items: [...] } } */
export function getMultiCart() {
  return loadCart()
}

/** Add item to a specific restaurant's cart */
export function addToMultiCart(restaurant, item) {
  const carts = loadCart()
  const key = String(restaurant.id)
  if (!carts[key]) {
    carts[key] = {
      restaurant: { id: restaurant.id, name: restaurant.name, bank: restaurant.bank, address: restaurant.address },
      items: [],
    }
  }
  const existing = carts[key].items.find(i => i.id === item.id)
  if (existing) {
    existing.qty += 1
  } else {
    carts[key].items.push({ ...item, qty: 1 })
  }
  saveCart(carts)
  return carts
}

/** Remove one qty of item from restaurant cart */
export function removeFromMultiCart(restaurantId, itemId) {
  const carts = loadCart()
  const key = String(restaurantId)
  if (!carts[key]) return carts
  const item = carts[key].items.find(i => i.id === itemId)
  if (!item) return carts
  if (item.qty <= 1) {
    carts[key].items = carts[key].items.filter(i => i.id !== itemId)
  } else {
    item.qty -= 1
  }
  // Remove restaurant entry if empty
  if (carts[key].items.length === 0) delete carts[key]
  saveCart(carts)
  return carts
}

/** Clear a specific restaurant's cart */
export function clearRestaurantCart(restaurantId) {
  const carts = loadCart()
  delete carts[String(restaurantId)]
  saveCart(carts)
  return carts
}

/** Clear entire multi-cart */
export function clearMultiCart() {
  localStorage.removeItem(CART_KEY)
}

/** Get total item count across all restaurants */
export function getMultiCartCount() {
  const carts = loadCart()
  return Object.values(carts).reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.qty, 0), 0)
}

/** Get total price across all restaurants */
export function getMultiCartTotal() {
  const carts = loadCart()
  return Object.values(carts).reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.price * i.qty, 0), 0)
}

/** Get number of restaurants in cart */
export function getRestaurantCount() {
  return Object.keys(loadCart()).length
}

/** Split into separate orders per restaurant for checkout */
export function splitOrdersByRestaurant() {
  const carts = loadCart()
  return Object.values(carts).map(c => ({
    restaurant: c.restaurant,
    items: c.items,
    subtotal: c.items.reduce((s, i) => s + i.price * i.qty, 0),
  }))
}
