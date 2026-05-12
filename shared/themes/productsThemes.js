// Shared theme definitions for all ProductsLocal apps
// (products-local, productslocalchat, productslocalemail).
// Edit ONCE here — all three apps pick up the change automatically.

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt/'

function themeImg(prompt) {
  return POLLINATIONS_BASE + encodeURIComponent(prompt + ', dark moody background, professional product photography, cinematic lighting, 4k') + '?width=480&height=854&nologo=true&seed=42'
}

export const FOOD_TYPES = {
  'Fashion': ['Clothing', 'Shoes', 'Hijab & Scarves', 'Batik', 'Baby Clothes', 'Jewelry'],
  'Electronics': ['Electronics', 'Phone Cases', 'Phone Accessories', 'Gadgets'],
  'Beauty': ['Skincare', 'Cosmetics', 'Perfume'],
  'Home & Living': ['Home Decor', 'Furniture', 'Kitchenware', 'Candles'],
  'Handmade': ['Handicrafts', 'Jewelry', 'Candles'],
  'Sports': ['Sports', 'Outdoor'],
  'Automotive': ['Motorbike Tyres', 'Automotive'],
  'Books & School': ['School Accessories', 'Books & Stationery'],
  'Grocery': ['Grocery & Snacks', 'Tobacco', 'Herbal & Jamu'],
  'Digital': ['Digital Products'],
  'General': ['General Store'],
  'Baby & Kids': ['Baby Clothes', 'Baby & Kids'],
  'Pet Supplies': ['Pet Supplies', 'Pet Food'],
}

export const THEME_PRESETS = [
  // Clothing & Fashion
  { id: 'clothing', accent: '#4A90D9', img: themeImg('Clothing store display with folded shirts jeans and sneakers on dark wooden shelves warm lighting'), label: '#1 Clothing', category: 'Clothing', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'TH'], foodTypes: ['Clothing', 'Fashion'] },
  { id: 'shoes', accent: '#8B4513', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-shoes.png', label: '#2 Shoes', category: 'Shoes', countries: ['ID', 'MY', 'US', 'GB', 'AU'], foodTypes: ['Shoes', 'Fashion'] },
  { id: 'raincoats', isNew: true, accent: '#2C5F8A', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-raincoats.png', label: '#3 Raincoats', category: 'Raincoats', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'JP', 'KR', 'TH', 'VN', 'DE', 'NL'], foodTypes: ['Raincoats', 'Clothing', 'Outdoor', 'Fashion'] },
  { id: 'running', isNew: true, accent: '#1B2A4A', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-running-footwear.png', label: '#4 Running Footwear', category: 'Running Footwear', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'DE', 'JP', 'KR', 'TH'], foodTypes: ['Running Footwear', 'Shoes', 'Sports', 'Fashion'] },
  { id: 'handbags', isNew: true, accent: '#8B4513', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags.png', label: '#4 Handbags', category: 'Handbags', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'TH', 'FR'], foodTypes: ['Handbags', 'Fashion', 'Accessories'], variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags-v2.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags-v3.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags-v4.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags-v5.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags-v6.png'] },
  { id: 'hijab', accent: '#9B59B6', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2004_57_19%20PM.png?updatedAt=1778407052888', label: '#4 Hijab & Scarves', category: 'Hijab & Scarves', countries: ['ID', 'MY', 'SG', 'AE', 'SA', 'EG'], foodTypes: ['Hijab & Scarves', 'Fashion'] },
  { id: 'batik', isNew: true, accent: '#B8860B', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2011_41_38%20AM.png?updatedAt=1778388112989', label: '#4 Batik', category: 'Batik', countries: ['ID', 'MY'], foodTypes: ['Batik', 'Fashion', 'Traditional'] },
  { id: 'tshirts', isNew: true, accent: '#4A90D9', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasd.png?updatedAt=1778435998178', label: '#24 T-Shirts', category: 'T-Shirts', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'TH', 'VN', 'PH', 'JP', 'KR', 'DE', 'FR'], foodTypes: ['T-Shirts', 'Clothing', 'Fashion'], variants: ['https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvv.png?updatedAt=1778434284405', 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdas.png?updatedAt=1778434574941'] },

  // Electronics & Gadgets
  { id: 'electronics', accent: '#2ECC71', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-electrical.png', label: '#5 Electronics', category: 'Electronics', countries: ['ID', 'MY', 'US', 'GB', 'SG', 'AU', 'JP', 'KR'], foodTypes: ['Electronics', 'Gadgets'] },
  { id: 'comprepair', isNew: true, accent: '#1E90FF', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair.png', label: '#6 Computer Repair', category: 'Computer Repair', countries: ['ID', 'MY', 'US', 'GB', 'SG', 'AU', 'JP', 'KR', 'DE', 'TH', 'VN', 'PH'], foodTypes: ['Computer Repair', 'Electronics', 'Gadgets'], variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair-v2.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair-v3.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair-v4.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair-v5.png'] },
  { id: 'phoneacc', accent: '#3498DB', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2012,%202026,%2006_20_44%20PM.png', label: '#7 Phone Cases', category: 'Phone Cases', countries: ['ID', 'MY', 'US', 'GB', 'SG', 'TH', 'VN', 'PH'], foodTypes: ['Phone Cases', 'Phone Accessories', 'Electronics'], variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-phone-cases.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-phone-cases-v2.png', 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2012,%202026,%2006_20_15%20PM.png', 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2012,%202026,%2006_08_51%20PM.png'] },

  // Beauty & Health
  { id: 'skincare', accent: '#E91E90', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-beauty-products.png', label: '#7 Beauty Products', category: 'Beauty Products', countries: ['ID', 'MY', 'KR', 'JP', 'US', 'GB', 'TH'], foodTypes: ['Skincare', 'Beauty', 'Cosmetics'] },
  { id: 'cosmetics', accent: '#C0392B', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-cosmetics.png', label: '#8 Cosmetics', category: 'Cosmetics', countries: ['ID', 'MY', 'US', 'GB', 'KR', 'JP'], foodTypes: ['Cosmetics', 'Beauty'] },
  { id: 'perfume', isNew: true, accent: '#8E44AD', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-perfume.png', label: '#9 Perfume', category: 'Perfume', countries: ['ID', 'MY', 'AE', 'SA', 'FR', 'US', 'GB'], foodTypes: ['Perfume', 'Beauty'] },

  // Home & Living
  { id: 'homedecor', accent: '#D4A373', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_38_44%20PM.png', label: '#10 Home Decor', category: 'Home Decor', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG'], foodTypes: ['Home Decor', 'Home & Living'], variants: [themeImg('Home decor items candles vases cushions on wooden shelf cozy dark interior')] },
  { id: 'furniture', isNew: true, accent: '#8FB4A3', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-home-furniture.png', label: '#11 Home Furniture', category: 'Home Furniture', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'JP', 'KR', 'DE', 'FR', 'NL', 'TH'], foodTypes: ['Furniture', 'Home & Living', 'Home Decor'] },
  { id: 'tradfurniture', isNew: true, accent: '#6F4E37', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_43_17%20PM.png', label: '#11b Traditional Furniture', category: 'Traditional Furniture', countries: ['ID', 'MY', 'TH', 'VN', 'PH', 'IN', 'JP'], foodTypes: ['Traditional Furniture', 'Furniture', 'Home & Living', 'Heritage'] },
  { id: 'kitchenware', accent: '#FF6B35', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511015514.png', label: '#12 Kitchenware', category: 'Kitchenware', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'JP'], foodTypes: ['Kitchenware', 'Home & Living'] },

  // Packaging
  { id: 'packaging', isNew: true, accent: '#795548', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-packaging.png', label: '#15 Packaging', category: 'Packaging', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'TH', 'VN'], foodTypes: ['Packaging', 'Business Supplies'] },

  // Crafts & Handmade
  { id: 'handicraft', accent: '#e8992c', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_40_27%20PM.png', label: '#13 Handicrafts', category: 'Handicrafts', countries: ['ID', 'MY', 'TH', 'VN', 'PH'], foodTypes: ['Handicrafts', 'Handmade'], variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handicrafts.png'] },
  { id: 'carvedwood', isNew: true, accent: '#8B4513', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_42_11%20PM.png', label: '#13b Carved Wood', category: 'Carved Wood', countries: ['ID', 'MY', 'TH', 'VN', 'PH', 'IN'], foodTypes: ['Carved Wood', 'Handicrafts', 'Handmade', 'Heritage'] },
  { id: 'secondhand', isNew: true, accent: '#5D6D7E', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_44_25%20PM.png', label: '#13c Second Hand', category: 'Second Hand', countries: ['ID', 'MY', 'TH', 'VN', 'PH', 'US', 'GB', 'AU', 'DE', 'FR', 'NL'], foodTypes: ['Second Hand', 'Thrift', 'Preloved', 'Used Goods'] },
  { id: 'womensclothes', isNew: true, accent: '#E91E63', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_45_41%20PM.png', label: '#13d Women\'s Clothes', category: 'Women\'s Clothes', countries: ['ID', 'MY', 'TH', 'VN', 'PH', 'SG', 'US', 'GB', 'AU', 'JP', 'KR', 'FR', 'DE'], foodTypes: ['Women\'s Clothes', 'Womenswear', 'Fashion', 'Clothing', 'Dress'] },
  { id: 'jewelry', accent: '#FFD700', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-jewelry.png', label: '#14 Jewelry', category: 'Jewelry', countries: ['ID', 'MY', 'US', 'GB', 'TH', 'IN'], foodTypes: ['Jewelry', 'Handmade', 'Fashion'], variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-jewelry-v2.png'] },
  { id: 'candles', isNew: true, accent: '#e8b92c', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-candles.png', label: '#15 Candles', category: 'Candles', countries: ['ID', 'MY', 'US', 'GB', 'AU'], foodTypes: ['Candles', 'Handmade', 'Home & Living'], variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-candles-v2.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-candles-v3.png'] },

  // Sports & Outdoor
  { id: 'sports', accent: '#27AE60', img: themeImg('Sports equipment sneakers basketball dumbbells water bottle on dark gym floor'), label: '#16 Sports', category: 'Sports', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'DE'], foodTypes: ['Sports', 'Outdoor'] },

  // Baby & Kids
  { id: 'baby', isNew: true, accent: '#FF69B4', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-baby-clothes.png', label: '#17 Baby Clothes', category: 'Baby Clothes', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'TH', 'VN', 'PH', 'JP', 'KR'], foodTypes: ['Baby Clothes', 'Baby & Kids', 'Fashion'] },
  { id: 'toys', isNew: true, accent: '#FF6B35', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-childrens-toys.png', label: '#18 Children\'s Toys', category: 'Children\'s Toys', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'JP', 'KR', 'TH', 'VN', 'PH', 'DE', 'FR'], foodTypes: ['Children\'s Toys', 'Baby & Kids', 'Toys'] },

  // School & Stationery
  { id: 'school', accent: '#4A90D9', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-school-accessories.png', label: '#18 School Accessories', category: 'School Accessories', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'JP', 'KR', 'TH', 'VN', 'PH'], foodTypes: ['School Accessories', 'Books & Stationery'] },
  { id: 'books', accent: '#2C3E50', img: themeImg('Stack of books notebooks and stationery on dark wooden desk warm lamp light'), label: '#19 Books & Stationery', category: 'Books & Stationery', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'JP'], foodTypes: ['Books & Stationery'] },

  // Automotive
  { id: 'motortyres', isNew: true, accent: '#dc2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-motorbike-tyres.png', label: '#20 Motorbike Tyres', category: 'Motorbike Tyres', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'TH', 'VN', 'PH', 'IN'], foodTypes: ['Motorbike Tyres', 'Automotive'] },
  { id: 'seatcovers', isNew: true, accent: '#795548', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2011_14_54%20AM.png?updatedAt=1778386510220', label: '#21 Seat Covers', category: 'Seat Covers', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'TH', 'VN', 'PH', 'IN', 'DE', 'JP'], foodTypes: ['Seat Covers', 'Automotive'] },
  { id: 'bicycle', isNew: true, accent: '#2E86AB', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-bicycle.png', label: '#22 Bicycle', category: 'Bicycle', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'JP', 'KR', 'TH', 'VN', 'DE', 'NL', 'FR'], foodTypes: ['Bicycle', 'Sports', 'Outdoor', 'Automotive'] },
  { id: 'automotive', isNew: true, accent: '#dc2626', img: themeImg('Car accessories parts tools and detailing products on dark garage workbench'), label: '#23 Automotive', category: 'Automotive', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'DE', 'JP'], foodTypes: ['Automotive'] },
  { id: 'helmets', isNew: true, accent: '#1a1a1a', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasdsdsasddd.png', label: '#25 Helmets', category: 'Helmets', countries: ['ID', 'MY', 'TH', 'VN', 'PH', 'IN', 'US', 'GB', 'AU', 'DE', 'JP'], foodTypes: ['Helmets', 'Motorcycle', 'Automotive', 'Sports', 'Outdoor'], variants: ['https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasdsdsasd.png', 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasds.png?updatedAt=1778436294045'] },

  // Pet Supplies
  { id: 'pets', isNew: true, accent: '#6b8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-pet-supplies.png', label: '#23 Pet Supplies', category: 'Pet Supplies', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG'], foodTypes: ['Pet Supplies'] },

  // Pet Food
  { id: 'petfood', isNew: true, accent: '#c97800', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2012,%202026,%2003_01_45%20AM.png', label: '#23b Pet Food', category: 'Pet Food', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'TH', 'VN', 'PH', 'DE', 'JP'], foodTypes: ['Pet Food', 'Pet Supplies'], variants: ['https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2012,%202026,%2003_02_34%20AM.png'] },

  // Grocery & Snacks
  { id: 'grocery', accent: '#c15d15', img: themeImg('Packaged snacks chips cookies and grocery items displayed on dark shelves store'), label: '#24 Grocery & Snacks', category: 'Grocery & Snacks', countries: ['ID', 'MY', 'SG', 'TH', 'VN', 'PH'], foodTypes: ['Grocery & Snacks'] },

  // Tobacco
  { id: 'tobacco', isNew: true, accent: '#8B0000', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-tobacco.png', label: '#25 Tobacco', category: 'Tobacco', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'DE', 'FR', 'TH', 'VN'], foodTypes: ['Tobacco'] },

  // Herbal & Traditional
  { id: 'herbal', isNew: true, accent: '#4d8a0f', img: themeImg('Traditional herbal medicine jamu bottles spices and natural remedies on dark wood'), label: '#26 Herbal & Jamu', category: 'Herbal & Jamu', countries: ['ID', 'MY'], foodTypes: ['Herbal & Jamu', 'Traditional'] },

  // Digital Products
  { id: 'digital', isNew: true, accent: '#8E44AD', img: themeImg('Digital products gift cards software boxes on futuristic dark desk with neon glow'), label: '#27 Digital Products', category: 'Digital Products', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'JP', 'KR'], foodTypes: ['Digital Products'] },

  // General Merchandise
  { id: 'general', accent: '#4A90D9', img: themeImg('Mixed merchandise products variety of items on dark display table organized'), label: '#28 General Store', category: 'General Store', countries: ['ID', 'MY', 'US', 'GB', 'AU', 'SG', 'TH', 'VN', 'PH'], foodTypes: ['General Store'] },
]
