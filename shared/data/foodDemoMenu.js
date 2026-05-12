// Shared demo menu data for food family apps (foodlocalchat, foodlocalwhatsapp).

export const DEMO_MENU = [
  // Meals
  { id: 1, name: 'Pepper Noodles', price: 23000, photo: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-08_12_38-pm.png', desc: 'Noodles fried light with slight sauce and chopped peppers', category: 'Meal', available: true, spice: 1, perks: ['bogo'] },
  { id: 2, name: 'Sate Ayam', price: 18000, photo: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300', desc: 'Grilled chicken skewers with peanut sauce', category: 'Meal', available: true, perks: ['freeDrink'], perkLimit: { type: 'stock', remaining: 18 } },
  { id: 3, name: 'Bakso', price: 12000, photo: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300', desc: 'Meatball soup with noodles and vegetables', category: 'Meal', available: true, perkText: 'Lunch Special!', perkLimit: { type: 'time', endAt: new Date(Date.now() + 2 * 3600000).toISOString() } },
  { id: 4, name: 'Mie Goreng', price: 13000, photo: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300', desc: 'Stir-fried noodles with vegetables and egg', category: 'Meal', available: true },
  { id: 5, name: 'Ayam Geprek', price: 20000, photo: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=300', desc: 'Crispy smashed chicken with sambal', category: 'Meal', available: true },
  // Drinks
  { id: 6, name: 'Es Teh Manis', price: 5000, photo: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300', desc: 'Sweet iced tea', category: 'Drink', available: true },
  { id: 7, name: 'Es Jeruk', price: 7000, photo: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300', desc: 'Fresh orange juice', category: 'Drink', available: true },
  { id: 8, name: 'Kopi Hitam', price: 5000, photo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300', desc: 'Black coffee, strong Indonesian brew', category: 'Drink', available: true },
  { id: 9, name: 'Es Alpukat', price: 10000, photo: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=300', desc: 'Creamy avocado smoothie with chocolate', category: 'Drink', available: true },
  { id: 10, name: 'Air Mineral', price: 3000, photo: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300', desc: 'Bottled mineral water', category: 'Drink', available: true },
  { id: 23, name: 'Es Kelapa Muda', price: 8000, photo: 'https://images.unsplash.com/photo-1544252890-c8e1a1080400?w=300', desc: 'Fresh young coconut water with ice', category: 'Drink', available: true },
  { id: 24, name: 'Jus Mangga', price: 10000, photo: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300', desc: 'Fresh mango juice blended smooth', category: 'Drink', available: true },
  { id: 25, name: 'Es Cendol', price: 8000, photo: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300', desc: 'Pandan jelly with coconut milk and palm sugar', category: 'Drink', available: true },
  { id: 26, name: 'Teh Tarik', price: 7000, photo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300', desc: 'Pulled milk tea, hot or iced', category: 'Drink', available: true },
  // Snacks
  { id: 11, name: 'Gorengan', price: 5000, photo: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300', desc: 'Assorted fried snacks — tempe, tahu, bakwan', category: 'Snack', available: true },
  { id: 12, name: 'Kerupuk', price: 3000, photo: 'https://images.unsplash.com/photo-1630384060421-cb20aed56993?w=300', desc: 'Crispy prawn crackers', category: 'Snack', available: true },
  { id: 13, name: 'Pisang Goreng', price: 5000, photo: 'https://images.unsplash.com/photo-1600326145552-327f74b9c189?w=300', desc: 'Fried banana fritters with crispy batter', category: 'Snack', available: true },
  { id: 14, name: 'Tahu Crispy', price: 4000, photo: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300', desc: 'Crispy fried tofu bites', category: 'Snack', available: true },
  { id: 19, name: 'Tempe Mendoan', price: 5000, photo: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=300', desc: 'Thinly sliced fried tempeh', category: 'Snack', available: true },
  { id: 20, name: 'Cireng Isi', price: 6000, photo: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300', desc: 'Fried tapioca balls with filling', category: 'Snack', available: true },
  { id: 21, name: 'Lumpia Goreng', price: 5000, photo: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300', desc: 'Crispy fried spring rolls', category: 'Snack', available: true },
  { id: 22, name: 'Bakwan Jagung', price: 4000, photo: 'https://images.unsplash.com/photo-1600326145552-327f74b9c189?w=300', desc: 'Corn fritters with vegetables', category: 'Snack', available: true },
  { id: 27, name: 'Roti Manis', price: 10000, photo: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%209,%202026,%2001_15_32%20PM.png?updatedAt=1778307350320', desc: 'Soft sweet bread, freshly baked', category: 'Snack', available: true },
  { id: 28, name: 'Sweet Bun Classic', price: 8000, photo: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_21_47-pm.png', desc: 'Classic soft sweet bun', category: 'Snack', available: true },
  { id: 29, name: 'Sweet Bun Cream', price: 10000, photo: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_24_02-pm.png', desc: 'Cream-filled sweet bun', category: 'Snack', available: true },
  { id: 30, name: 'Sweet Bun Chocolate', price: 10000, photo: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_26_47-pm.png', desc: 'Chocolate-filled sweet bun', category: 'Snack', available: true },
  // Extra Sauce
  { id: 15, name: 'Sambal Extra', price: 2000, photo: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=300', desc: 'Extra portion of spicy chili sambal', category: 'Extra Sauce', available: true },
  { id: 16, name: 'Kecap Manis', price: 1000, photo: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300', desc: 'Sweet soy sauce', category: 'Extra Sauce', available: true },
  { id: 17, name: 'Saus Kacang', price: 3000, photo: 'https://images.unsplash.com/photo-1635321593217-40050ad13c74?w=300', desc: 'Creamy peanut sauce for satay and gado-gado', category: 'Extra Sauce', available: true },
  { id: 18, name: 'Sambal Matah', price: 3000, photo: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300', desc: 'Fresh Balinese shallot and lemongrass sambal', category: 'Extra Sauce', available: true },
]

