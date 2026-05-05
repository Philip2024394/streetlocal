/**
 * Drinks Library — pre-loaded drink options for vendors
 * Used for extras add-on AND main menu drinks.
 * Vendor toggles on/off, sets price + optional Large size.
 */

export const DRINKS_LIBRARY = [
  {
    category: 'Soft Drinks',
    icon: '🥤',
    items: [
      { id: 'cola', name: 'Cola', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'diet_cola', name: 'Diet / Zero Cola', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'lemon_lime', name: 'Lemon-Lime Soda', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'orange_soda', name: 'Orange Soda', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'cream_soda', name: 'Cream Soda', defaultPrice: 10000 },
      { id: 'root_beer', name: 'Root Beer', defaultPrice: 10000 },
      { id: 'soda_water', name: 'Soda Water', defaultPrice: 6000 },
      { id: 'tonic_water', name: 'Tonic Water', defaultPrice: 8000 },
    ],
  },
  {
    category: 'Water',
    icon: '💧',
    items: [
      { id: 'mineral_water', name: 'Mineral Water', defaultPrice: 4000, defaultLarge: 6000 },
      { id: 'sparkling_water', name: 'Sparkling Water', defaultPrice: 8000 },
      { id: 'flavored_water', name: 'Flavored Water', defaultPrice: 8000 },
    ],
  },
  {
    category: 'Fresh Juice',
    icon: '🧃',
    items: [
      { id: 'orange_juice', name: 'Orange Juice', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'apple_juice', name: 'Apple Juice', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'mango_juice', name: 'Mango Juice', defaultPrice: 12000, defaultLarge: 18000 },
      { id: 'pineapple_juice', name: 'Pineapple Juice', defaultPrice: 10000 },
      { id: 'watermelon_juice', name: 'Watermelon Juice', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'guava_juice', name: 'Guava Juice', defaultPrice: 10000 },
      { id: 'avocado_juice', name: 'Avocado Juice', defaultPrice: 12000, defaultLarge: 18000 },
      { id: 'mixed_fruit', name: 'Mixed Fruit Juice', defaultPrice: 12000 },
      { id: 'lime_juice', name: 'Lime Juice (Jeruk Nipis)', defaultPrice: 8000 },
      { id: 'tomato_juice', name: 'Tomato Juice', defaultPrice: 8000 },
    ],
  },
  {
    category: 'Indonesian Traditional',
    icon: '🇮🇩',
    items: [
      { id: 'es_teh_manis', name: 'Es Teh Manis (Sweet Iced Tea)', defaultPrice: 5000, defaultLarge: 8000 },
      { id: 'teh_tawar', name: 'Teh Tawar (Plain Tea)', defaultPrice: 4000 },
      { id: 'es_jeruk', name: 'Es Jeruk (Iced Orange)', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'es_campur', name: 'Es Campur', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'es_teler', name: 'Es Teler', defaultPrice: 12000 },
      { id: 'es_cendol', name: 'Es Cendol / Dawet', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'es_kelapa', name: 'Es Kelapa Muda', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'bandrek', name: 'Bandrek (Hot Ginger)', defaultPrice: 8000 },
      { id: 'wedang_jahe', name: 'Wedang Jahe (Ginger Tea)', defaultPrice: 7000 },
      { id: 'bajigur', name: 'Bajigur', defaultPrice: 8000 },
      { id: 'stmj', name: 'STMJ (Milk, Egg, Honey, Ginger)', defaultPrice: 12000 },
    ],
  },
  {
    category: 'Tea',
    icon: '🍵',
    items: [
      { id: 'black_tea', name: 'Black Tea', defaultPrice: 5000 },
      { id: 'green_tea', name: 'Green Tea', defaultPrice: 6000 },
      { id: 'jasmine_tea', name: 'Jasmine Tea', defaultPrice: 6000 },
      { id: 'lemon_tea', name: 'Lemon Tea', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'milk_tea', name: 'Milk Tea', defaultPrice: 12000, defaultLarge: 18000 },
      { id: 'thai_tea', name: 'Thai Tea', defaultPrice: 12000, defaultLarge: 18000 },
      { id: 'iced_tea', name: 'Iced Tea', defaultPrice: 6000, defaultLarge: 10000 },
      { id: 'herbal_tea', name: 'Herbal Tea', defaultPrice: 8000 },
    ],
  },
  {
    category: 'Coffee',
    icon: '☕',
    items: [
      { id: 'black_coffee', name: 'Black Coffee', defaultPrice: 8000 },
      { id: 'americano', name: 'Americano', defaultPrice: 15000, defaultLarge: 20000 },
      { id: 'espresso', name: 'Espresso', defaultPrice: 12000 },
      { id: 'cappuccino', name: 'Cappuccino', defaultPrice: 18000, defaultLarge: 22000 },
      { id: 'latte', name: 'Latte', defaultPrice: 18000, defaultLarge: 22000 },
      { id: 'iced_coffee', name: 'Iced Coffee', defaultPrice: 12000, defaultLarge: 18000 },
      { id: 'iced_latte', name: 'Iced Latte', defaultPrice: 18000, defaultLarge: 22000 },
      { id: 'kopi_susu', name: 'Kopi Susu (Indonesian)', defaultPrice: 15000, defaultLarge: 20000 },
      { id: 'kopi_tubruk', name: 'Kopi Tubruk', defaultPrice: 7000 },
      { id: 'cold_brew', name: 'Cold Brew', defaultPrice: 20000, defaultLarge: 25000 },
    ],
  },
  {
    category: 'Milk-Based',
    icon: '🥛',
    items: [
      { id: 'fresh_milk', name: 'Fresh Milk', defaultPrice: 8000, defaultLarge: 12000 },
      { id: 'chocolate_milk', name: 'Chocolate Milk', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'strawberry_milk', name: 'Strawberry Milk', defaultPrice: 10000 },
      { id: 'banana_milk', name: 'Banana Milk', defaultPrice: 10000 },
      { id: 'milkshake_choc', name: 'Chocolate Milkshake', defaultPrice: 18000, defaultLarge: 25000 },
      { id: 'milkshake_vanilla', name: 'Vanilla Milkshake', defaultPrice: 18000, defaultLarge: 25000 },
      { id: 'milkshake_strawberry', name: 'Strawberry Milkshake', defaultPrice: 18000, defaultLarge: 25000 },
      { id: 'malt_drink', name: 'Malt Drink', defaultPrice: 8000 },
    ],
  },
  {
    category: 'Trending',
    icon: '🧋',
    items: [
      { id: 'boba', name: 'Bubble Tea (Boba)', defaultPrice: 18000, defaultLarge: 25000 },
      { id: 'cheese_tea', name: 'Cheese Tea', defaultPrice: 20000 },
      { id: 'fruit_tea', name: 'Fruit Tea', defaultPrice: 15000, defaultLarge: 20000 },
      { id: 'yakult_drink', name: 'Yakult Drink', defaultPrice: 12000 },
      { id: 'smoothie', name: 'Smoothie', defaultPrice: 18000, defaultLarge: 25000 },
      { id: 'slushie', name: 'Slushie / Ice Blended', defaultPrice: 15000, defaultLarge: 20000 },
    ],
  },
  {
    category: 'Specialty',
    icon: '🍫',
    items: [
      { id: 'hot_chocolate', name: 'Hot Chocolate', defaultPrice: 15000, defaultLarge: 20000 },
      { id: 'iced_chocolate', name: 'Iced Chocolate', defaultPrice: 15000, defaultLarge: 20000 },
      { id: 'matcha_latte', name: 'Matcha Latte', defaultPrice: 20000, defaultLarge: 25000 },
      { id: 'taro_drink', name: 'Taro Drink', defaultPrice: 15000 },
      { id: 'cookies_cream', name: 'Cookies & Cream', defaultPrice: 20000 },
    ],
  },
  {
    category: 'Refreshers',
    icon: '🍋',
    items: [
      { id: 'lemonade', name: 'Lemonade', defaultPrice: 10000, defaultLarge: 15000 },
      { id: 'lime_soda', name: 'Lime Soda', defaultPrice: 8000 },
      { id: 'infused_water', name: 'Infused Water', defaultPrice: 8000 },
      { id: 'honey_lemon', name: 'Iced Honey Lemon', defaultPrice: 10000 },
      { id: 'lychee_tea', name: 'Iced Lychee Tea', defaultPrice: 12000 },
    ],
  },
]

export const ALL_DRINKS = DRINKS_LIBRARY.flatMap(g => g.items)

export function getDrinkById(id) {
  return ALL_DRINKS.find(d => d.id === id) ?? null
}
