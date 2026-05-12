/**
 * Sides Library — pre-loaded side dish options for vendors
 * Grouped by type. Vendor toggles on/off, sets price + optional Large size.
 */

export const SIDES_LIBRARY = [
  {
    category: 'Rice',
    icon: '🍚',
    items: [
      { id: 'nasi_putih', name: 'Steamed Rice (Nasi Putih)', defaultPrice: 5000, defaultLarge: 8000 },
      { id: 'nasi_goreng_side', name: 'Fried Rice (Small)', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'nasi_uduk', name: 'Coconut Rice (Nasi Uduk)', defaultPrice: 6000, defaultLarge: 10000 },
      { id: 'nasi_kuning', name: 'Yellow Rice (Nasi Kuning)', defaultPrice: 6000, defaultLarge: 10000 },
      { id: 'sticky_rice', name: 'Sticky Rice', defaultPrice: 5000 },
      { id: 'lontong', name: 'Lontong (Rice Cake)', defaultPrice: 4000 },
      { id: 'mie_goreng_side', name: 'Fried Noodles (Small)', defaultPrice: 10000, defaultLarge: 15000 },
    ],
  },
  {
    category: 'Fried Snacks',
    icon: '🍟',
    items: [
      { id: 'french_fries', name: 'French Fries', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'curly_fries', name: 'Curly Fries', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'waffle_fries', name: 'Waffle Fries', defaultPrice: 12000 },
      { id: 'sweet_potato_fries', name: 'Sweet Potato Fries', defaultPrice: 12000 },
      { id: 'potato_wedges', name: 'Potato Wedges', defaultPrice: 10000 },
      { id: 'onion_rings', name: 'Onion Rings', defaultPrice: 10000 },
      { id: 'chicken_nuggets', name: 'Chicken Nuggets', defaultPrice: 12000, defaultLarge: 18000 },
      { id: 'chicken_popcorn', name: 'Chicken Popcorn', defaultPrice: 12000 },
      { id: 'tempura', name: 'Tempura (Shrimp / Veg)', defaultPrice: 15000 },
      { id: 'tahu_goreng', name: 'Fried Tofu (Tahu Goreng)', defaultPrice: 5000 },
      { id: 'tempe_goreng', name: 'Fried Tempeh (Tempe Goreng)', defaultPrice: 5000 },
      { id: 'tahu_crispy', name: 'Crispy Tofu (Tahu Crispy)', defaultPrice: 6000 },
    ],
  },
  {
    category: 'Bread',
    icon: '🍞',
    items: [
      { id: 'garlic_bread', name: 'Garlic Bread', defaultPrice: 8000 },
      { id: 'butter_rolls', name: 'Butter Bread Rolls', defaultPrice: 5000 },
      { id: 'toast', name: 'Toast', defaultPrice: 5000 },
      { id: 'flatbread', name: 'Flatbread', defaultPrice: 8000 },
      { id: 'baguette', name: 'Baguette Slices', defaultPrice: 6000 },
      { id: 'cheese_bread', name: 'Cheese Bread', defaultPrice: 8000 },
    ],
  },
  {
    category: 'Vegetables & Salad',
    icon: '🥗',
    items: [
      { id: 'side_salad', name: 'Side Salad', defaultPrice: 10000 },
      { id: 'coleslaw', name: 'Coleslaw', defaultPrice: 5000 },
      { id: 'coleslaw_spicy', name: 'Spicy Coleslaw', defaultPrice: 6000 },
      { id: 'steamed_veg', name: 'Steamed Vegetables', defaultPrice: 8000 },
      { id: 'stirfry_veg', name: 'Stir-Fried Vegetables', defaultPrice: 10000 },
      { id: 'grilled_veg', name: 'Grilled Vegetables', defaultPrice: 12000 },
      { id: 'acar', name: 'Pickles / Acar', defaultPrice: 3000 },
      { id: 'corn', name: 'Corn on the Cob', defaultPrice: 6000 },
      { id: 'edamame', name: 'Edamame', defaultPrice: 8000 },
      { id: 'kimchi', name: 'Kimchi', defaultPrice: 6000 },
    ],
  },
  {
    category: 'Potato',
    icon: '🥔',
    items: [
      { id: 'mashed_potato', name: 'Mashed Potatoes', defaultPrice: 10000 },
      { id: 'baked_potato', name: 'Baked Potato', defaultPrice: 12000 },
      { id: 'roasted_potato', name: 'Roasted Potatoes', defaultPrice: 10000 },
      { id: 'potato_salad', name: 'Potato Salad', defaultPrice: 8000 },
    ],
  },
  {
    category: 'Asian Sides',
    icon: '🍜',
    items: [
      { id: 'noodle_side', name: 'Small Noodle Portion', defaultPrice: 8000 },
      { id: 'gyoza', name: 'Gyoza / Dumplings', defaultPrice: 12000 },
      { id: 'spring_rolls', name: 'Spring Rolls', defaultPrice: 8000 },
      { id: 'siomay', name: 'Siomay (Indonesian Dumplings)', defaultPrice: 8000 },
      { id: 'bao_buns', name: 'Bao Buns', defaultPrice: 10000 },
      { id: 'lumpia', name: 'Lumpia (Indonesian Spring Roll)', defaultPrice: 5000 },
      { id: 'otak_otak', name: 'Otak-Otak (Fish Cake)', defaultPrice: 5000 },
    ],
  },
  {
    category: 'Extra Add-ons',
    icon: '🧀',
    items: [
      { id: 'extra_cheese', name: 'Extra Cheese', defaultPrice: 5000 },
      { id: 'fried_egg', name: 'Fried Egg', defaultPrice: 5000 },
      { id: 'boiled_egg', name: 'Boiled Egg', defaultPrice: 4000 },
      { id: 'sausage', name: 'Sausage', defaultPrice: 8000 },
      { id: 'bacon', name: 'Bacon', defaultPrice: 10000 },
      { id: 'meatballs', name: 'Meatballs', defaultPrice: 8000 },
      { id: 'extra_meat', name: 'Extra Meat Portion', defaultPrice: 15000 },
      { id: 'sambal_kerupuk', name: 'Sambal + Kerupuk', defaultPrice: 5000 },
    ],
  },
  {
    category: 'Indonesian Traditional',
    icon: '🍘',
    items: [
      { id: 'kerupuk', name: 'Kerupuk (Crackers)', defaultPrice: 3000 },
      { id: 'emping', name: 'Emping (Melinjo Crackers)', defaultPrice: 4000 },
      { id: 'perkedel', name: 'Perkedel (Potato Fritter)', defaultPrice: 5000 },
      { id: 'bakwan', name: 'Bakwan (Vegetable Fritter)', defaultPrice: 4000 },
      { id: 'lalapan', name: 'Lalapan (Raw Veg + Sambal)', defaultPrice: 5000 },
      { id: 'risoles', name: 'Risoles', defaultPrice: 5000 },
      { id: 'pastel', name: 'Pastel (Fried Pastry)', defaultPrice: 5000 },
      { id: 'cireng', name: 'Cireng (Fried Tapioca)', defaultPrice: 4000 },
    ],
  },
]

// Flat list
export const ALL_SIDES = SIDES_LIBRARY.flatMap(g => g.items)

// Get side by ID
export function getSideById(id) {
  return ALL_SIDES.find(s => s.id === id) ?? null
}
