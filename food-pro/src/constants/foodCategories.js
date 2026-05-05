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
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_35_10%20AM.png?updatedAt=1776710128590',
    subs: ['Mie Goreng', 'Mie Ayam', 'Ramen', 'Kwetiau', 'Mie Kuah', 'Soba', 'Udon', 'Mie Aceh', 'Mie Jawa'],
  },
  {
    id: 'rice',
    label: 'Rice',
    labelId: 'Nasi',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_36_12%20AM.png?updatedAt=1776710188384',
    subs: ['Nasi Goreng', 'Nasi Campur', 'Nasi Uduk', 'Nasi Kuning', 'Rice Bowl', 'Nasi Bakar', 'Nasi Liwet', 'Nasi Timbel'],
  },
  {
    id: 'seafood',
    label: 'Fish & Seafood',
    labelId: 'Ikan & Seafood',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_36_56%20AM.png?updatedAt=1776710234849',
    subs: ['Ikan Bakar', 'Ikan Goreng', 'Udang', 'Kepiting', 'Cumi-Cumi', 'Gurame', 'Patin', 'Seafood Platter'],
  },
  {
    id: 'steak',
    label: 'Steak & Meat',
    labelId: 'Steak & Daging',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_37_37%20AM.png?updatedAt=1776710272663',
    subs: ['Beef Steak', 'Lamb Chop', 'Wagyu', 'BBQ Ribs', 'Tenderloin', 'Grilled Meat', 'Rendang', 'Empal'],
  },
  {
    id: 'burger',
    label: 'Burger & Chips',
    labelId: 'Burger & Kentang',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_39_31%20AM.png?updatedAt=1776710385538',
    subs: ['Beef Burger', 'Chicken Burger', 'Fish Burger', 'Veggie Burger', 'French Fries', 'Loaded Fries', 'Onion Rings'],
  },
  {
    id: 'pasta',
    label: 'Pasta',
    labelId: 'Pasta',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_40_54%20AM.png',
    subs: ['Spaghetti', 'Carbonara', 'Lasagna', 'Fettuccine', 'Penne', 'Mac & Cheese', 'Aglio Olio', 'Ravioli'],
  },
  {
    id: 'pizza',
    label: 'Pizza',
    labelId: 'Pizza',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_42_04%20AM.png',
    subs: ['Margherita', 'Pepperoni', 'BBQ Chicken', 'Hawaiian', 'Meat Lovers', 'Veggie', 'Calzone', 'Thin Crust'],
  },
  {
    id: 'sushi',
    label: 'Sushi & Japanese',
    labelId: 'Sushi & Jepang',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_45_59%20AM.png',
    subs: ['Sushi Roll', 'Sashimi', 'Bento', 'Teriyaki', 'Tempura', 'Donburi', 'Onigiri', 'Takoyaki', 'Okonomiyaki'],
  },
  {
    id: 'korean',
    label: 'Korean',
    labelId: 'Korea',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_47_45%20AM.png',
    subs: ['Korean BBQ', 'Bibimbap', 'Tteokbokki', 'Korean Fried Chicken', 'Kimchi Jjigae', 'Japchae', 'Kimbap', 'Ramyeon'],
  },
  {
    id: 'french',
    label: 'French',
    labelId: 'Perancis',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_51_19%20AM.png',
    subs: ['Croissant', 'Quiche', 'Crepe', 'Escargot', 'Ratatouille', 'Crème Brûlée', 'Coq au Vin', 'Baguette'],
  },
  {
    id: 'chinese',
    label: 'Chinese',
    labelId: 'Tionghoa',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_52_13%20AM.png',
    subs: ['Dim Sum', 'Capcay', 'Ayam Asam Manis', 'Nasi Goreng Chinese', 'Kwetiau', 'Bakpao', 'Pangsit', 'Hainan Chicken'],
  },
  {
    id: 'juice',
    label: 'Juice & Smoothie',
    labelId: 'Jus & Smoothie',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_52_56%20AM.png',
    subs: ['Orange Juice', 'Mango Juice', 'Avocado Juice', 'Mixed Fruit', 'Smoothie Bowl', 'Green Juice', 'Es Buah', 'Coconut Water'],
  },
  {
    id: 'soups',
    label: 'Soups',
    labelId: 'Sup & Soto',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_55_38%20AM.png',
    subs: ['Soto Ayam', 'Soto Betawi', 'Sop Buntut', 'Rawon', 'Tongseng', 'Tom Yum', 'Cream Soup', 'Sayur Asem'],
  },
  {
    id: 'soda',
    label: 'Soda & Soft Drinks',
    labelId: 'Soda & Minuman',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_56_14%20AM.png',
    subs: ['Cola', 'Sprite', 'Fanta', 'Soda Gembira', 'Sparkling Water', 'Energy Drink', 'Es Kelapa'],
  },
  {
    id: 'kebab',
    label: 'Kebab & Shawarma',
    labelId: 'Kebab',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_57_36%20AM.png',
    subs: ['Chicken Kebab', 'Beef Kebab', 'Lamb Kebab', 'Shawarma', 'Falafel', 'Doner', 'Kebab Wrap'],
  },
  {
    id: 'fried_chicken',
    label: 'Crispy Chicken',
    labelId: 'Ayam Goreng Krispi',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_58_16%20AM.png',
    subs: ['Ayam Goreng', 'Fried Chicken', 'Ayam Geprek', 'Ayam Penyet', 'Chicken Wings', 'Chicken Strip', 'Chicken Katsu'],
  },
  {
    id: 'tea_coffee',
    label: 'Tea & Coffee',
    labelId: 'Teh & Kopi',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_00_14%20AM.png',
    subs: ['Kopi Susu', 'Espresso', 'Cappuccino', 'Americano', 'Teh Tarik', 'Matcha Latte', 'Es Kopi', 'Jahe', 'Wedang'],
  },
  {
    id: 'desserts',
    label: 'Desserts',
    labelId: 'Makanan Penutup',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_02_58%20AM.png',
    subs: ['Es Campur', 'Es Teler', 'Kue', 'Cake', 'Pudding', 'Kolak', 'Klepon', 'Brownies', 'Churros'],
  },
  {
    id: 'satay',
    label: 'Satay & Grilled',
    labelId: 'Sate & Bakar',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_03_59%20AM.png',
    subs: ['Sate Ayam', 'Sate Kambing', 'Sate Padang', 'Sate Madura', 'Sate Lilit', 'Ayam Bakar', 'Ikan Bakar', 'Jagung Bakar'],
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    labelId: 'Sarapan',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_05_26%20AM.png',
    subs: ['Eggs Benedict', 'Pancakes', 'Toast', 'Omelette', 'Nasi Uduk', 'Bubur Ayam', 'Lontong Sayur', 'Nasi Kuning'],
  },
  {
    id: 'snacks',
    label: 'Snacks & Bites',
    labelId: 'Camilan',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_06_07%20AM.png',
    subs: ['Kentang Goreng', 'Roti Bakar', 'Siomay', 'Batagor', 'Cilok', 'Lumpia', 'Risol', 'Pastel', 'Tahu Crispy'],
  },
  {
    id: 'bakso',
    label: 'Bakso & Street Food',
    labelId: 'Bakso & Kaki Lima',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_08_24%20AM.png',
    subs: ['Bakso Urat', 'Bakso Jumbo', 'Bakso Beranak', 'Bakso Goreng', 'Pempek', 'Mie Kocok', 'Tahu Bulat'],
  },
  {
    id: 'martabak',
    label: 'Martabak',
    labelId: 'Martabak',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_10_50%20AM.png',
    subs: ['Martabak Manis', 'Martabak Telur', 'Martabak Mini', 'Terang Bulan', 'Martabak Keju', 'Martabak Coklat'],
  },
  {
    id: 'gorengan',
    label: 'Gorengan',
    labelId: 'Gorengan',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_11_46%20AM.png',
    subs: ['Tempe Goreng', 'Tahu Goreng', 'Pisang Goreng', 'Bakwan', 'Combro', 'Misro', 'Cireng', 'Ote-Ote'],
  },
  {
    id: 'nasi_padang',
    label: 'Nasi Padang',
    labelId: 'Masakan Padang',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_15_18%20AM.png',
    subs: ['Rendang', 'Ayam Pop', 'Gulai Otak', 'Dendeng Balado', 'Gulai Nangka', 'Sambal Lado', 'Gulai Tunjang', 'Sate Padang'],
  },
  {
    id: 'boba',
    label: 'Boba & Milk Tea',
    labelId: 'Boba & Teh Susu',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_16_53%20AM.png',
    subs: ['Brown Sugar Boba', 'Taro Milk Tea', 'Matcha Boba', 'Thai Tea', 'Cheese Tea', 'Fruit Tea Boba', 'Classic Milk Tea'],
  },
  {
    id: 'ice_cream',
    label: 'Ice Cream & Gelato',
    labelId: 'Es Krim & Gelato',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_17_47%20AM.png',
    subs: ['Gelato', 'Soft Serve', 'Sundae', 'Milkshake', 'Sorbet', 'Es Puter', 'Affogato', 'Ice Cream Sandwich'],
  },
  {
    id: 'healthy',
    label: 'Salad & Healthy',
    labelId: 'Salad & Sehat',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_18_50%20AM.png',
    subs: ['Garden Salad', 'Caesar Salad', 'Poke Bowl', 'Smoothie Bowl', 'Gado-Gado', 'Pecel', 'Karedok', 'Vegan Bowl'],
  },
  {
    id: 'kids',
    label: 'Kids Menu',
    labelId: 'Menu Anak',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_19_47%20AM.png',
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
