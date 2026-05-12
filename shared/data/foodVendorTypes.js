// Shared vendor-type definitions for FoodLocal apps
// (foodlocalchat, foodlocalwhatsapp).
// Edit ONCE here — all apps pick up the change automatically.

export const VENDOR_TYPES = {
  warung: {
    id: 'warung', label: 'Warung / Street Food', emoji: '🍜',
    tagline: 'Indonesian everyday food',
    categories: ['Nasi', 'Mie', 'Lauk', 'Sate', 'Cemilan', 'Minuman', 'Promo', 'Extra'],
  },
  bakery: {
    id: 'bakery', label: 'Bakery / Cake Shop', emoji: '🍰',
    tagline: 'Bread, cakes, pastries',
    categories: ['Roti', 'Kue', 'Pastry', 'Sandwich', 'Kopi', 'Minuman', 'Promo'],
  },
  cafe: {
    id: 'cafe', label: 'Cafe / Coffee', emoji: '☕',
    tagline: 'Coffee, light food, snacks',
    categories: ['Coffee', 'Tea', 'Cold Drinks', 'Pastry', 'Sandwich', 'Dessert', 'Promo'],
  },
  restaurant: {
    id: 'restaurant', label: 'Restaurant', emoji: '🍽️',
    tagline: 'Full-service dining',
    categories: ['Appetizer', 'Main Course', 'Signature', 'Side Dish', 'Dessert', 'Drinks', 'Promo'],
  },
  general: {
    id: 'general', label: 'General / Other', emoji: '🛒',
    tagline: 'Mixed food and drinks',
    categories: ['Main', 'Drinks', 'Snacks', 'Dessert', 'Promo', 'Extra'],
  },
}
