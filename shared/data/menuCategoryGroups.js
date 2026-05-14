// Global menu category taxonomy for street food + restaurant + cafe + bar vendors.
// Used to populate the menu-item form's category picker and the customer-side filter drawer.
//
// Structure: super-category (9 groups) → tier-2 specific dish types (~85 total).
// Vendors pick a super-category first, then a tier-2 type. The "Other" group
// is a built-in escape hatch where vendors type their own category name + pick an icon.
//
// Dietary tags are SEPARATE from category — each menu item can carry multiple tags
// (Vegan + Halal + Gluten-Free), and tags are used as cross-cutting filters
// independent of the dish-format category (Pizza, Burger, etc.).

// SVG path data for each group — Material Symbols set, monochrome
const SVG = {
  mains:     'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
  starters:  'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z',
  snacks:    'M21.598 11.064a1.006 1.006 0 0 0-.854-.172A2.94 2.94 0 0 1 20 11c-1.654 0-3-1.346-3.001-2.999.001-.471.108-.94.315-1.391a.999.999 0 0 0-1.029-1.41c-.108.013-.221.023-.336.023-1.654 0-3-1.346-3-3 0-.116.011-.229.022-.336a1 1 0 0 0-1.412-1.029 9.012 9.012 0 0 0-3.598 12.974 9.012 9.012 0 0 0 13.65-3.769 1.005 1.005 0 0 0-.013-.999z',
  desserts:  'M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12c0-1.66-1.34-3-3-3z',
  beverages: 'M5 12l1.5 6h11L19 12V4H5v8zm2-6h10v2H7V6z',
  combos:    'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v16h2.5v-8H21V6c0-2.21-2.24-4-5-4z',
  extras:    'M5.5 21c.83 0 1.5-.67 1.5-1.5V14H4v5.5c0 .83.67 1.5 1.5 1.5zM18 6h-2V3c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v3H6c-.55 0-1 .45-1 1v6h14V7c0-.55-.45-1-1-1zm-7-2h2v2h-2V4zm7.5 17c.83 0 1.5-.67 1.5-1.5V14h-3v5.5c0 .83.67 1.5 1.5 1.5z',
  specials:  'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  other:     'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
}

export const MENU_CATEGORY_GROUPS = [
  {
    id: 'mains',
    label: 'Mains',
    icon: '🍱',
    svg: SVG.mains,
    desc: 'Substantial plates that constitute a meal',
    types: [
      'Breakfast', 'Brunch',
      'Burger', 'Sandwich', 'Sub', 'Wrap',
      'Pizza',
      'Pasta', 'Noodles', 'Ramen', 'Pho', 'Pad Thai',
      'Rice Plate', 'Nasi', 'Biryani',
      'Curry', 'Stir-Fry',
      'Bowl', 'Poke Bowl', 'Grain Bowl',
      'Sushi', 'Sashimi', 'Maki',
      'Dim Sum', 'Dumplings', 'Bao',
      'Taco', 'Burrito', 'Quesadilla',
      'Kebab', 'Shawarma', 'Gyro',
      'BBQ', 'Grill', 'Skewers', 'Satay',
      'Seafood', 'Steak', 'Roast',
      'Soup', 'Salad',
      'Meal', // legacy bucket — keeps existing items working
    ],
  },
  {
    id: 'starters',
    label: 'Starters & Sides',
    icon: '🥗',
    svg: SVG.starters,
    desc: 'Small dishes that accompany mains',
    types: [
      'Appetizer', 'Starter',
      'Tapas', 'Small Plates', 'Mezze',
      'Sides', 'Fries', 'Chips',
      'Bread', 'Pastries',
      'Cheese & Charcuterie',
      'Spring Rolls', 'Samosas', 'Crisp Bites',
      'Side Salad', 'Side Soup',
    ],
  },
  {
    id: 'snacks',
    label: 'Snacks & Street Food',
    icon: '🍢',
    svg: SVG.snacks,
    desc: 'Handheld, eat-on-the-go bites',
    types: [
      'Street Food',
      'Fried Snacks', 'Gorengan',
      'Skewered Snacks',
      'Buns', 'Bakpao',
      'Crepes', 'Pancakes', 'Roti',
      'Pretzels', 'Hot Dogs',
      'Donuts', 'Popcorn', 'Nuts',
      'Crackers', 'Kerupuk',
      'Snack', // legacy
    ],
  },
  {
    id: 'desserts',
    label: 'Desserts & Sweets',
    icon: '🍰',
    svg: SVG.desserts,
    desc: 'Sweet finishers',
    types: [
      'Cakes', 'Pastries',
      'Ice Cream', 'Gelato', 'Frozen Yogurt',
      'Pudding', 'Custard',
      'Cookies', 'Biscuits',
      'Indonesian Sweets', 'Asian Sweets', 'Western Sweets',
      'Candy', 'Chocolates',
      'Dessert', // legacy
    ],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    icon: '🥤',
    svg: SVG.beverages,
    desc: 'Hot, cold, alcoholic, anything drinkable',
    types: [
      'Coffee Hot', 'Coffee Cold', 'Espresso',
      'Tea Hot', 'Tea Cold',
      'Bubble Tea', 'Boba',
      'Smoothies', 'Shakes', 'Juices',
      'Soft Drinks', 'Sodas',
      'Water', 'Sparkling Water',
      'Energy Drinks',
      'Coconut Water', 'Tropical Drinks',
      'Mocktails',
      'Beer', 'Wine', 'Cocktails', 'Spirits', 'Sake', 'Soju',
      'Drink', // legacy
    ],
  },
  {
    id: 'combos',
    label: 'Combos & Sets',
    icon: '🍴',
    svg: SVG.combos,
    desc: 'Bundled value meals',
    types: [
      'Combo Meal',
      'Family Platter', 'Sharing Plate',
      'Bento', 'Set Meal',
      'Kids Meal',
      'Tasting Menu',
    ],
  },
  {
    id: 'extras',
    label: 'Add-Ons & Sauces',
    icon: '🌶️',
    svg: SVG.extras,
    desc: 'Modifiers that attach to other items',
    types: [
      'Sauce', 'Dip', 'Sambal',
      'Topping', 'Extra Protein',
      'Drink Upgrade', 'Side Upgrade',
      'Cutlery', 'Packaging',
      'Extra Sauce', // legacy
    ],
  },
  {
    id: 'specials',
    label: 'Specials & Promos',
    icon: '⭐',
    svg: SVG.specials,
    desc: 'Featured or time-limited items',
    types: [
      "Today's Special",
      "Chef's Recommendation",
      'Limited Time Offer',
      'Promo',
      'Seasonal',
    ],
  },
  {
    id: 'other',
    label: 'Other',
    icon: '✏️',
    svg: SVG.other,
    desc: 'Add your own category — name it, pick an icon',
    types: [], // vendor types their own name; stored on the vendor profile
    isCustom: true,
  },
]

// Theme-specific category groups. Prepended to MENU_CATEGORY_GROUPS in the
// vendor's category picker when shopTheme matches a key here, so a donut-shop
// vendor sees donut subtypes (glazed, iced, cream-filled, coffee donuts, etc.)
// instead of just the single global 'Donuts' chip under Snacks.
export const THEME_CATEGORY_OVERRIDES = {
  donut: [
    {
      id: 'donut-shop',
      label: 'Donuts',
      icon: '🍩',
      svg: SVG.desserts,
      desc: 'Donut shop specialties — glazed, filled, iced, infused',
      // Full 30-type donut taxonomy (user-provided). The first 3 appear inline
      // as menu-page toggle tabs (Glazed / Chocolate Frosted / Jelly Filled);
      // the rest are accessible from the side drawer. food-basic strips the
      // trailing " Donut" suffix in the toggle display so tabs stay compact,
      // while filters + drawer use the full label.
      types: [
        'Glazed Donut',
        'Chocolate Frosted Donut',
        'Jelly Filled Donut',
        'Boston Cream Donut',
        'Powdered Sugar Donut',
        'Cinnamon Sugar Donut',
        'Old Fashioned Donut',
        'Cruller Donut',
        'Apple Fritter',
        'Maple Bar',
        'Long John Donut',
        'Sprinkle Donut',
        'Strawberry Frosted Donut',
        'Blueberry Cake Donut',
        'Coconut Donut',
        'Custard Filled Donut',
        'Cream Filled Donut',
        'Mochi Donut',
        'Cronut',
        'Ring Donut',
        'Yeast Donut',
        'Cake Donut',
        'Twist Donut',
        'Caramel Donut',
        'Red Velvet Donut',
        'Matcha Donut',
        'Peanut Butter Donut',
        'Nutella Donut',
        'Banana Donut',
        'Mini Donut',
      ],
    },
    {
      id: 'donut-drinks',
      label: 'Drinks',
      icon: '🥤',
      svg: SVG.beverages,
      desc: 'Drinks that pair with donuts — juice, soda, water, iced',
      types: [
        'Fresh Juice',
        'Soda Drinks',
        'Water',
        'Ice Drinks',
      ],
    },
  ],
}

// Flat array of every preset category name (handy for default chip pool / search).
export const MENU_CATEGORY_FLAT = MENU_CATEGORY_GROUPS.flatMap(g => g.types)

// Map of "free-text category" → "super-category id" so we can group existing items
// when rendering the customer-side drawer.
export const CATEGORY_TO_GROUP = (() => {
  const map = {}
  for (const group of MENU_CATEGORY_GROUPS) {
    for (const type of group.types) {
      map[type.toLowerCase()] = group.id
    }
  }
  return map
})()


// Dietary attributes that cross all categories. Each menu item can carry
// multiple tags. Customers filter by tag independently of category.
// Spicy levels are numeric (0–3) — use spice property; everything else is a boolean tag.

// Monochrome SVG paths for dietary tags — simple Material-style icons
const TAG_SVG = {
  leaf:    'M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z',
  moon:    'M9.37 5.51A7.35 7.35 0 0 0 9.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27A7.014 7.014 0 0 1 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z',
  star:    'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  wheat:   'M2.28 3.71L1 5l5 5-1.41 1.41L3 9.83l-1 1L4.59 13.41 3 15l1.41 1.41 1.59-1.58 2.59 2.58L7.17 19l1.41 1.41 5.59-5.59 5 5L20.59 18.41l-5-5 5.59-5.58L19.76 6.42l-2.58 2.58-1.59-1.58L17 6 15.59 4.59l-1.59 1.58L11.42 3.58 10 5l1.59 1.59L10 8.17 3.71 1.88z',
  drop:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z',
  nut:     'M12 2C9.24 2 7 4.24 7 7c0 1.27.47 2.42 1.25 3.31C5.81 11.51 4 13.96 4 17v5h16v-5c0-3.04-1.81-5.49-4.25-6.69C16.53 9.42 17 8.27 17 7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3z',
  heart:   'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  muscle:  'M21 16c-1.66 0-3-1.34-3-3 0-.55-.45-1-1-1s-1 .45-1 1c0 2.21 1.79 4 4 4v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V17c0-.55-.45-1-1-1zm-12-9.5C9 5.12 7.88 4 6.5 4S4 5.12 4 6.5 5.12 9 6.5 9 9 7.88 9 6.5zm5.5 7.5c-.55 0-1 .45-1 1v1c0 1.66-1.34 3-3 3s-3-1.34-3-3v-1c0-.55-.45-1-1-1s-1 .45-1 1v1c0 2.76 2.24 5 5 5s5-2.24 5-5v-1c0-.55-.45-1-1-1zM12 11l1.5-1.5L15 11l-1.5 1.5L12 11z',
  globe:   'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM18.92 8h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 0 1 5.08 16zm2.95-8H5.08a7.987 7.987 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
}

export const DIETARY_TAGS = [
  { id: 'vegetarian',   label: 'Vegetarian',     icon: '🌱', svg: TAG_SVG.leaf,   color: '#22c55e' },
  { id: 'vegan',        label: 'Vegan',          icon: '🌿', svg: TAG_SVG.leaf,   color: '#16a34a' },
  { id: 'halal',        label: 'Halal',          icon: '🕌', svg: TAG_SVG.moon,   color: '#0d9488' },
  { id: 'kosher',       label: 'Kosher',         icon: '✡️', svg: TAG_SVG.star,   color: '#2563eb' },
  { id: 'gluten_free',  label: 'Gluten-Free',    icon: '🌾', svg: TAG_SVG.wheat,  color: '#ca8a04' },
  { id: 'dairy_free',   label: 'Dairy-Free',     icon: '🥛', svg: TAG_SVG.drop,   color: '#0891b2' },
  { id: 'nut_free',     label: 'Nut-Free',       icon: '🥜', svg: TAG_SVG.nut,    color: '#a16207' },
  { id: 'healthy',      label: 'Healthy / Low-Cal', icon: '🥗', svg: TAG_SVG.heart, color: '#15803d' },
  { id: 'high_protein', label: 'High-Protein',   icon: '💪', svg: TAG_SVG.muscle, color: '#9333ea' },
  { id: 'organic',      label: 'Organic',        icon: '🌎', svg: TAG_SVG.globe,  color: '#65a30d' },
]


// Suggested icon palette for vendor "Other" custom categories — vendor picks one
// to attach to their custom-named category.
export const CUSTOM_CATEGORY_ICONS = [
  '🍲', '🥘', '🍛', '🍱', '🥣', '🍜', '🥟', '🥯', '🥨', '🌮',
  '🌯', '🫔', '🍕', '🍔', '🌭', '🥪', '🥗', '🥙', '🫓', '🍝',
  '🍣', '🍤', '🍙', '🍚', '🍘', '🍢', '🍡', '🍧', '🍨', '🍦',
  '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍩', '🍪', '🥐',
  '☕', '🍵', '🥤', '🧋', '🍹', '🍸', '🍺', '🍷', '🍶', '🥃',
  '🥥', '🍇', '🍎', '🍊', '🍋', '🍌', '🍓', '🫐', '🍒', '🍑',
  '🥑', '🫒', '🌽', '🥕', '🌶️', '🫑', '🧄', '🧅', '🍄', '🥬',
]
