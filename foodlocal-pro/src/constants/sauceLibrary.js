/**
 * Sauce Library — pre-loaded sauce options for vendors to select from
 * Grouped by cuisine type. Vendor toggles on/off and sets price.
 */

export const SAUCE_LIBRARY = [
  {
    category: 'Indonesian Sambal',
    icon: '🇮🇩',
    items: [
      { id: 'sambal_terasi', name: 'Sambal Terasi', defaultPrice: 3000 },
      { id: 'sambal_matah', name: 'Sambal Matah (Bali)', defaultPrice: 4000 },
      { id: 'sambal_ijo', name: 'Sambal Ijo (Padang)', defaultPrice: 3000 },
      { id: 'sambal_bawang', name: 'Sambal Bawang', defaultPrice: 3000 },
      { id: 'sambal_kecap', name: 'Sambal Kecap', defaultPrice: 2000 },
      { id: 'sambal_dabu', name: 'Sambal Dabu-Dabu', defaultPrice: 4000 },
      { id: 'sambal_roa', name: 'Sambal Roa (Smoked Fish)', defaultPrice: 5000 },
      { id: 'sambal_andaliman', name: 'Sambal Andaliman (Batak)', defaultPrice: 5000 },
      { id: 'sambal_mangga', name: 'Sambal Mangga', defaultPrice: 4000 },
      { id: 'sambal_pete', name: 'Sambal Pete', defaultPrice: 5000 },
      { id: 'sambal_tumpang', name: 'Sambal Tumpang', defaultPrice: 4000 },
      { id: 'sambal_bajak', name: 'Sambal Bajak', defaultPrice: 3000 },
      { id: 'sambal_kemiri', name: 'Sambal Kemiri', defaultPrice: 4000 },
    ],
  },
  {
    category: 'Indonesian Sauces',
    icon: '🫗',
    items: [
      { id: 'kecap_manis', name: 'Kecap Manis (Sweet Soy)', defaultPrice: 2000 },
      { id: 'kecap_asin', name: 'Kecap Asin (Salty Soy)', defaultPrice: 2000 },
      { id: 'saus_kacang', name: 'Saus Kacang (Peanut Sauce)', defaultPrice: 3000 },
      { id: 'bumbu_rujak', name: 'Bumbu Rujak', defaultPrice: 3000 },
      { id: 'gulai_sauce', name: 'Gulai / Kari Sauce', defaultPrice: 5000 },
    ],
  },
  {
    category: 'Asian Sauces',
    icon: '🌏',
    items: [
      { id: 'sweet_chili', name: 'Sweet Chili Sauce (Thai)', defaultPrice: 3000 },
      { id: 'sriracha', name: 'Sriracha', defaultPrice: 3000 },
      { id: 'hoisin', name: 'Hoisin Sauce', defaultPrice: 4000 },
      { id: 'oyster_sauce', name: 'Oyster Sauce', defaultPrice: 3000 },
      { id: 'teriyaki', name: 'Teriyaki Sauce', defaultPrice: 4000 },
      { id: 'soy_light', name: 'Soy Sauce (Light)', defaultPrice: 2000 },
      { id: 'soy_dark', name: 'Soy Sauce (Dark)', defaultPrice: 2000 },
      { id: 'chili_oil', name: 'Chili Oil', defaultPrice: 3000 },
      { id: 'black_bean', name: 'Black Bean Sauce', defaultPrice: 4000 },
      { id: 'gochujang', name: 'Korean Gochujang', defaultPrice: 5000 },
      { id: 'kewpie', name: 'Japanese Kewpie Mayo', defaultPrice: 4000 },
    ],
  },
  {
    category: 'Western Sauces',
    icon: '🍔',
    items: [
      { id: 'ketchup', name: 'Tomato Ketchup', defaultPrice: 2000 },
      { id: 'mayo', name: 'Mayonnaise', defaultPrice: 2000 },
      { id: 'mustard', name: 'Mustard', defaultPrice: 3000 },
      { id: 'bbq', name: 'BBQ Sauce', defaultPrice: 3000 },
      { id: 'cheese_sauce', name: 'Cheese Sauce', defaultPrice: 5000 },
      { id: 'garlic_mayo', name: 'Garlic Mayo', defaultPrice: 3000 },
      { id: 'spicy_mayo', name: 'Spicy Mayo', defaultPrice: 3000 },
      { id: 'truffle_mayo', name: 'Truffle Mayo', defaultPrice: 8000 },
      { id: 'ranch', name: 'Ranch Dressing', defaultPrice: 4000 },
      { id: 'thousand_island', name: 'Thousand Island', defaultPrice: 3000 },
      { id: 'honey_mustard', name: 'Honey Mustard', defaultPrice: 4000 },
      { id: 'buffalo', name: 'Buffalo Sauce', defaultPrice: 4000 },
      { id: 'tartar', name: 'Tartar Sauce', defaultPrice: 3000 },
    ],
  },
  {
    category: 'Salad & Light',
    icon: '🥗',
    items: [
      { id: 'caesar', name: 'Caesar Dressing', defaultPrice: 4000 },
      { id: 'vinaigrette', name: 'Balsamic Vinaigrette', defaultPrice: 4000 },
      { id: 'olive_oil', name: 'Olive Oil', defaultPrice: 3000 },
      { id: 'yogurt_sauce', name: 'Yogurt Sauce', defaultPrice: 4000 },
      { id: 'sesame', name: 'Sesame Dressing', defaultPrice: 4000 },
    ],
  },
  {
    category: 'Premium Add-ons',
    icon: '✨',
    items: [
      { id: 'truffle_sauce', name: 'Truffle Sauce', defaultPrice: 12000 },
      { id: 'mushroom_sauce', name: 'Mushroom Sauce', defaultPrice: 8000 },
      { id: 'black_pepper', name: 'Black Pepper Sauce', defaultPrice: 5000 },
      { id: 'creamy_garlic', name: 'Creamy Garlic Sauce', defaultPrice: 5000 },
      { id: 'butter_sauce', name: 'Butter Sauce', defaultPrice: 5000 },
      { id: 'peri_peri', name: 'Peri-Peri Sauce', defaultPrice: 5000 },
      { id: 'chimichurri', name: 'Chimichurri', defaultPrice: 6000 },
      { id: 'salsa', name: 'Fresh Salsa', defaultPrice: 5000 },
      { id: 'guacamole', name: 'Guacamole', defaultPrice: 8000 },
    ],
  },
]

// Flat list for quick lookup
export const ALL_SAUCES = SAUCE_LIBRARY.flatMap(g => g.items)

// Get sauce by ID
export function getSauceById(id) {
  return ALL_SAUCES.find(s => s.id === id) ?? null
}
