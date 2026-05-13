/**
 * Complete food categories for Indonesian market.
 * Each category has an ID, display label, image URL, and subcategories.
 * Used by: Restaurant Dashboard, Food Menu Slider, Deal Hunt food selection.
 */

export const FOOD_CATEGORIES_FULL = [
  {
    id: 'noodles',
    label: 'Noodles',
    labelId: 'Mie & Bakmi',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_35_10-am.png',
    subs: ['Mie Goreng', 'Mie Ayam', 'Ramen', 'Kwetiau', 'Mie Kuah', 'Soba', 'Udon', 'Mie Aceh', 'Mie Jawa'],
  },
  {
    id: 'rice',
    label: 'Rice',
    labelId: 'Nasi',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2002_19_00%20PM.png',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_36_12-am.png',
    ],
    subs: ['Nasi Goreng', 'Nasi Campur', 'Nasi Uduk', 'Nasi Kuning', 'Rice Bowl', 'Nasi Bakar', 'Nasi Liwet', 'Nasi Timbel'],
  },
  {
    id: 'seafood',
    label: 'Fish & Seafood',
    labelId: 'Ikan & Seafood',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2003_19_10%20AM.png?updatedAt=1778617164520',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_36_56-am.png',
    ],
    subs: ['Ikan Bakar', 'Ikan Goreng', 'Udang', 'Kepiting', 'Cumi-Cumi', 'Gurame', 'Patin', 'Seafood Platter'],
  },
  {
    id: 'steak',
    label: 'Steak & Meat',
    labelId: 'Steak & Daging',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2003_16_03%20AM.png?updatedAt=1778616980763',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_37_37-am.png',
    ],
    subs: ['Beef Steak', 'Lamb Chop', 'Wagyu', 'BBQ Ribs', 'Tenderloin', 'Grilled Meat', 'Rendang', 'Empal'],
  },
  {
    id: 'burger',
    label: 'Burger & Chips',
    labelId: 'Burger & Kentang',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2003_17_01%20AM.png?updatedAt=1778617037436',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_39_31-am.png',
    ],
    subs: ['Beef Burger', 'Chicken Burger', 'Fish Burger', 'Veggie Burger', 'French Fries', 'Loaded Fries', 'Onion Rings'],
  },
  {
    id: 'hotdog',
    label: 'Hot Dog',
    labelId: 'Hot Dog',
    image: 'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimims.png',
    variants: [],
    subs: ['Classic Hot Dog', 'Chili Dog', 'Cheese Dog', 'Bratwurst', 'Corn Dog', 'Chicago Dog', 'Loaded Hot Dog'],
  },
  {
    id: 'corn',
    label: 'Corn on the Cob',
    labelId: 'Jagung Bakar',
    image: 'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimimsxxxxaaaxxz.png',
    variants: [
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimimsxxxxaaaxxzz.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimimsxxxxaaaxxzzz.png',
    ],
    subs: ['Grilled Corn', 'Buttered Corn', 'Cheese Corn', 'Jagung Bakar', 'Jagung Manis', 'Jagung Susu Keju', 'Sweet Corn'],
  },
  {
    id: 'pasta',
    label: 'Pasta',
    labelId: 'Pasta',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2003_25_16%20AM.png?updatedAt=1778617530116',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_40_54-am.png',
    ],
    subs: ['Spaghetti', 'Carbonara', 'Lasagna', 'Fettuccine', 'Penne', 'Mac & Cheese', 'Aglio Olio', 'Ravioli'],
  },
  {
    id: 'pizza',
    label: 'Pizza',
    labelId: 'Pizza',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2002_21_23%20PM.png',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_42_04-am.png',
      'https://ik.imagekit.io/nepgaxllc/Untitledimmmcdcfffduu.png?updatedAt=1778678033137',
    ],
    subs: ['Margherita', 'Pepperoni', 'BBQ Chicken', 'Hawaiian', 'Meat Lovers', 'Veggie', 'Calzone', 'Thin Crust'],
  },
  {
    id: 'sushi',
    label: 'Sushi & Japanese',
    labelId: 'Sushi & Jepang',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2003_23_26%20AM.png?updatedAt=1778617423904',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_45_59-am.png',
    ],
    subs: ['Sushi Roll', 'Sashimi', 'Bento', 'Teriyaki', 'Tempura', 'Donburi', 'Onigiri', 'Takoyaki', 'Okonomiyaki'],
  },
  {
    id: 'korean',
    label: 'Korean',
    labelId: 'Korea',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_47_45-am.png',
    subs: ['Korean BBQ', 'Bibimbap', 'Tteokbokki', 'Korean Fried Chicken', 'Kimchi Jjigae', 'Japchae', 'Kimbap', 'Ramyeon'],
  },
  {
    id: 'french',
    label: 'French',
    labelId: 'Perancis',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_51_19-am.png',
    subs: ['Croissant', 'Quiche', 'Crepe', 'Escargot', 'Ratatouille', 'Crème Brûlée', 'Coq au Vin', 'Baguette'],
  },
  {
    id: 'chinese',
    label: 'Chinese',
    labelId: 'Tionghoa',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2003_28_22%20AM.png?updatedAt=1778617718154',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_52_13-am.png',
    ],
    subs: ['Dim Sum', 'Capcay', 'Ayam Asam Manis', 'Nasi Goreng Chinese', 'Kwetiau', 'Bakpao', 'Pangsit', 'Hainan Chicken'],
  },
  {
    id: 'juice',
    label: 'Juice & Smoothie',
    labelId: 'Jus & Smoothie',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_52_56-am.png',
    subs: ['Orange Juice', 'Mango Juice', 'Avocado Juice', 'Mixed Fruit', 'Smoothie Bowl', 'Green Juice', 'Es Buah', 'Coconut Water'],
  },
  {
    id: 'soups',
    label: 'Soups',
    labelId: 'Sup & Soto',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2002_19_33%20PM.png',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_55_38-am.png',
    ],
    subs: ['Soto Ayam', 'Soto Betawi', 'Sop Buntut', 'Rawon', 'Tongseng', 'Tom Yum', 'Cream Soup', 'Sayur Asem'],
  },
  {
    id: 'soda',
    label: 'Soda & Soft Drinks',
    labelId: 'Soda & Minuman',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_56_14-am.png',
    subs: ['Cola', 'Sprite', 'Fanta', 'Soda Gembira', 'Sparkling Water', 'Energy Drink', 'Es Kelapa'],
  },
  {
    id: 'kebab',
    label: 'Kebab & Shawarma',
    labelId: 'Kebab',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_57_36-am.png',
    subs: ['Chicken Kebab', 'Beef Kebab', 'Lamb Kebab', 'Shawarma', 'Falafel', 'Doner', 'Kebab Wrap'],
  },
  {
    id: 'fried_chicken',
    label: 'Crispy Chicken',
    labelId: 'Ayam Goreng Krispi',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2002_23_19%20PM.png',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-01_58_16-am.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmm.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnm.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmn.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimimsxxxxaaa.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimimsxxxxaa.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimimsxxxxaaaxx.png',
    ],
    subs: ['Ayam Goreng', 'Fried Chicken', 'Ayam Geprek', 'Ayam Penyet', 'Chicken Wings', 'Chicken Strip', 'Chicken Katsu'],
  },
  {
    id: 'grilled_chicken',
    label: 'Grilled Chicken',
    labelId: 'Ayam Bakar',
    image: 'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmi.png',
    variants: [],
    subs: ['Ayam Bakar', 'Ayam Panggang', 'BBQ Chicken', 'Roasted Chicken', 'Ayam Taliwang', 'Ayam Kalasan', 'Chicken Skewer'],
  },
  {
    id: 'grilled',
    label: 'Grilled & BBQ',
    labelId: 'Panggang & BBQ',
    image: 'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmm.png',
    variants: [
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkm.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmm.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimim.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimi.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmm.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninm.png',
    ],
    subs: ['BBQ', 'Grilled Meat', 'Grilled Fish', 'Grilled Vegetables', 'Mixed Grill', 'Yakiniku', 'Korean BBQ', 'Iga Bakar'],
  },
  {
    id: 'tea_coffee',
    label: 'Tea & Coffee',
    labelId: 'Teh & Kopi',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_00_14-am.png',
    subs: ['Kopi Susu', 'Espresso', 'Cappuccino', 'Americano', 'Teh Tarik', 'Matcha Latte', 'Es Kopi', 'Jahe', 'Wedang'],
  },
  {
    id: 'desserts',
    label: 'Desserts',
    labelId: 'Makanan Penutup',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_02_58-am.png',
    subs: ['Es Campur', 'Es Teler', 'Kue', 'Cake', 'Pudding', 'Kolak', 'Klepon', 'Brownies', 'Churros'],
  },
  {
    id: 'satay',
    label: 'Satay & Grilled',
    labelId: 'Sate & Bakar',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2013,%202026,%2002_25_52%20PM.png',
    variants: [
      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_03_59-am.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmm.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmim.png',
      'https://ik.imagekit.io/nepgaxllc/sssafddsdddddddddfdsfdnninmmmmnmmmkmmmmmmimimsxxx.png',
    ],
    subs: ['Sate Ayam', 'Sate Kambing', 'Sate Padang', 'Sate Madura', 'Sate Lilit', 'Ayam Bakar', 'Ikan Bakar', 'Jagung Bakar'],
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    labelId: 'Sarapan',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_05_26-am.png',
    subs: ['Eggs Benedict', 'Pancakes', 'Toast', 'Omelette', 'Nasi Uduk', 'Bubur Ayam', 'Lontong Sayur', 'Nasi Kuning'],
  },
  {
    id: 'snacks',
    label: 'Snacks & Bites',
    labelId: 'Camilan',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_06_07-am.png',
    subs: ['Kentang Goreng', 'Roti Bakar', 'Siomay', 'Batagor', 'Cilok', 'Lumpia', 'Risol', 'Pastel', 'Tahu Crispy'],
  },
  {
    id: 'bakso',
    label: 'Bakso & Street Food',
    labelId: 'Bakso & Kaki Lima',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_08_24-am.png',
    subs: ['Bakso Urat', 'Bakso Jumbo', 'Bakso Beranak', 'Bakso Goreng', 'Pempek', 'Mie Kocok', 'Tahu Bulat'],
  },
  {
    id: 'martabak',
    label: 'Martabak',
    labelId: 'Martabak',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_10_50-am.png',
    subs: ['Martabak Manis', 'Martabak Telur', 'Martabak Mini', 'Terang Bulan', 'Martabak Keju', 'Martabak Coklat'],
  },
  {
    id: 'gorengan',
    label: 'Gorengan',
    labelId: 'Gorengan',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_11_46-am.png',
    subs: ['Tempe Goreng', 'Tahu Goreng', 'Pisang Goreng', 'Bakwan', 'Combro', 'Misro', 'Cireng', 'Ote-Ote'],
  },
  {
    id: 'nasi_padang',
    label: 'Nasi Padang',
    labelId: 'Masakan Padang',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_15_18-am.png',
    subs: ['Rendang', 'Ayam Pop', 'Gulai Otak', 'Dendeng Balado', 'Gulai Nangka', 'Sambal Lado', 'Gulai Tunjang', 'Sate Padang'],
  },
  {
    id: 'boba',
    label: 'Boba & Milk Tea',
    labelId: 'Boba & Teh Susu',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_16_53-am.png',
    subs: ['Brown Sugar Boba', 'Taro Milk Tea', 'Matcha Boba', 'Thai Tea', 'Cheese Tea', 'Fruit Tea Boba', 'Classic Milk Tea'],
  },
  {
    id: 'ice_cream',
    label: 'Ice Cream & Gelato',
    labelId: 'Es Krim & Gelato',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_17_47-am.png',
    subs: ['Gelato', 'Soft Serve', 'Sundae', 'Milkshake', 'Sorbet', 'Es Puter', 'Affogato', 'Ice Cream Sandwich'],
  },
  {
    id: 'healthy',
    label: 'Salad & Healthy',
    labelId: 'Salad & Sehat',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_18_50-am.png',
    subs: ['Garden Salad', 'Caesar Salad', 'Poke Bowl', 'Smoothie Bowl', 'Gado-Gado', 'Pecel', 'Karedok', 'Vegan Bowl'],
  },
  {
    id: 'kids',
    label: 'Kids Menu',
    labelId: 'Menu Anak',
    image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-21-2026-02_19_47-am.png',
    subs: ['Nuggets', 'Mini Burger', 'Fish Fingers', 'Mac & Cheese', 'Pancakes', 'Fried Rice Kids', 'Mini Pizza', 'Fruit Cup'],
  },
]

// Quick lookup by ID
export const FOOD_CATEGORY_MAP = Object.fromEntries(FOOD_CATEGORIES_FULL.map(c => [c.id, c]))

// Just the IDs and labels for dropdowns
export const FOOD_CATEGORY_OPTIONS = FOOD_CATEGORIES_FULL.map(c => ({ value: c.id, label: c.label, labelId: c.labelId }))

// Get subcategories for a given category ID
export function getSubcategories(categoryId) {
  return FOOD_CATEGORY_MAP[categoryId]?.subs ?? []
}
