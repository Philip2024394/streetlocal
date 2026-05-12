// Shared vendor-type definitions for ProductsLocal apps
// (products-local, productslocalchat, productslocalemail).
// Edit ONCE here — all apps pick up the change automatically.

export const VENDOR_TYPES = {
  fashion: {
    id: 'fashion', label: 'Fashion / Clothing', emoji: '👗',
    tagline: 'Apparel, shoes, accessories',
    categories: ['Tops', 'Bottoms', 'Dresses', 'Shoes', 'Bags', 'Accessories', 'Promo'],
  },
  electronics: {
    id: 'electronics', label: 'Electronics / Tech', emoji: '📱',
    tagline: 'Phones, gadgets, accessories',
    categories: ['Phones', 'Accessories', 'Audio', 'Computers', 'Gaming', 'Cables', 'Promo'],
  },
  grocery: {
    id: 'grocery', label: 'Grocery / Sembako', emoji: '🛒',
    tagline: 'Daily essentials and food items',
    categories: ['Sembako', 'Beverages', 'Snacks', 'Frozen', 'Fresh', 'Household', 'Promo'],
  },
  beauty: {
    id: 'beauty', label: 'Beauty / Cosmetics', emoji: '💄',
    tagline: 'Skincare, makeup, fragrance',
    categories: ['Skincare', 'Makeup', 'Hair Care', 'Fragrance', 'Tools', 'Promo'],
  },
  general: {
    id: 'general', label: 'General / Other', emoji: '🛍️',
    tagline: 'Mixed product retail',
    categories: ['Main', 'Accessories', 'New Arrivals', 'Sale', 'Promo'],
  },
}
