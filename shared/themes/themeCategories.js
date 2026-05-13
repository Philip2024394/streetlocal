/**
 * Per-theme menu categories — research-based starter taxonomy.
 *
 * When a vendor picks a theme, they get the right category structure
 * for their industry. The vendor can still rename / reorder / add /
 * delete categories — these are sensible defaults, not enforcement.
 *
 * 6–8 categories per theme. Indonesian-market aware where relevant.
 * Source of truth replaces the older 3-tab THEME_MENU_TABS in
 * products-local + services-local.
 */

// ────────────────────────────────────────────────────────────────────────
//  PRODUCTS — 42 themes
// ────────────────────────────────────────────────────────────────────────
export const PRODUCTS_CATEGORIES = {
  clothing:      ['Men', 'Women', 'Kids', 'Outerwear', 'Activewear', 'Accessories', 'Underwear'],
  shoes:         ['Men', 'Women', 'Kids', 'Sneakers', 'Formal', 'Sandals', 'Athletic'],
  raincoats:     ['Adults', 'Kids', 'Ponchos', 'Rain Boots', 'Umbrellas', 'Accessories'],
  running:       ["Men's Running", "Women's Running", 'Trail', 'Marathon', 'Walking', 'Insoles & Socks'],
  hijab:         ['Square Hijab', 'Pashmina', 'Instant Hijab', 'Premium', 'Inner & Ciput', 'Accessories'],
  batik:         ['Men', 'Women', 'Kids', 'Fabric / Kain', 'Accessories', 'Traditional Wear'],
  tshirts:       ['Plain', 'Graphic', 'Polo', 'Long Sleeve', 'Tank Tops', 'Custom Print'],
  helmets:       ['Half-face', 'Full-face', 'Modular', 'Off-road', 'Bicycle', 'Visors & Parts', 'Bags'],
  electronics:   ['Phones & Tablets', 'Laptops & PCs', 'Audio', 'TV & Home Theater', 'Cameras', 'Gaming', 'Accessories'],
  comprepair:    ['Phone Repair', 'Laptop Repair', 'Diagnostic', 'Parts', 'Upgrades', 'Maintenance Plans'],
  phoneacc:      ['Cases', 'Screen Protectors', 'Chargers & Cables', 'Earphones', 'Power Banks', 'Stands & Holders'],
  skincare:      ['Cleansers', 'Moisturizers', 'Serums', 'Sunscreens', 'Masks', 'Tools & Brushes', 'Sets'],
  cosmetics:     ['Face', 'Eyes', 'Lips', 'Nails', 'Brushes', 'Sets & Gifts'],
  perfume:       ['For Him', 'For Her', 'Unisex', 'Body Sprays', 'Travel Size', 'Gift Sets'],
  homedecor:     ['Wall Art', 'Lighting', 'Vases & Plants', 'Cushions & Textiles', 'Mirrors', 'Decorative Objects'],
  tradfurniture: ['Living Room', 'Dining', 'Bedroom', 'Outdoor', 'Storage', 'Antique', 'Custom Orders'],
  furniture:     ['Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Office', 'Outdoor'],
  kitchenware:   ['Cookware', 'Bakeware', 'Utensils', 'Knives', 'Storage', 'Tableware', 'Appliances'],
  packaging:     ['Boxes', 'Bags', 'Envelopes', 'Wrapping', 'Tape & Labels', 'Custom Print', 'Bulk'],
  handicraft:    ['Wood', 'Pottery', 'Weaving & Textiles', 'Leather', 'Bamboo', 'Silver & Beads'],
  carvedwood:    ['Wall Panels', 'Statues', 'Furniture', 'Door Carvings', 'Decorative', 'Custom Orders'],
  secondhand:    ['Electronics', 'Clothing', 'Furniture', 'Books', 'Toys', 'Bicycles', 'Misc'],
  womensclothes: ['Tops', 'Bottoms', 'Dresses', 'Suits & Sets', 'Lingerie', 'Sleepwear', 'Maternity'],
  jewelry:       ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Watches', 'Sets', 'Custom'],
  sports:        ['Football', 'Badminton', 'Fitness', 'Swimming', 'Outdoor', 'Apparel', 'Equipment'],
  baby:          ['Newborn (0–3m)', '3–6m', '6–12m', '1–2yr', 'Accessories', 'Bedding', 'Bottles & Pacifiers'],
  school:        ['Backpacks', 'Stationery', 'Uniforms', 'Books', 'Lunch Boxes', 'Art Supplies'],
  bicycle:       ['Mountain', 'Road', 'City', 'Kids', 'Helmets', 'Parts & Accessories', 'Maintenance'],
  toys:          ['0–3 years', '4–7 years', '8–12 years', 'Educational', 'Outdoor', 'Plush', 'Games'],
  motortyres:    ['Sport Tyres', 'Touring', 'Scooter', 'Off-road', 'Tubes & Rims', 'Accessories'],
  tobacco:       ['Cigarettes', 'Cigars', 'Rolling Tobacco', 'Pipes', 'Lighters', 'Accessories'],
  pets:          ['Dog Supplies', 'Cat Supplies', 'Birds', 'Aquarium', 'Reptile', 'Small Pets', 'Accessories'],
  petfood:       ['Dry Dog Food', 'Wet Dog Food', 'Dry Cat Food', 'Wet Cat Food', 'Treats', 'Special Diet', 'Supplements'],
  grocery:       ['Fresh Produce', 'Dairy', 'Meat & Fish', 'Pantry', 'Snacks', 'Beverages', 'Frozen', 'Household'],
  digital:       ['Software', 'Game Vouchers', 'Phone Top-ups', 'eBooks', 'Templates', 'Online Courses'],
  general:       ['Featured', 'New Arrivals', 'Discount', 'Bestsellers', 'For Him', 'For Her', 'For Home'],
  handbags:      ['Tote', 'Crossbody', 'Backpacks', 'Clutches', 'Wallets', 'Briefcases', 'Wristlets'],
  automotive:    ['Engine Parts', 'Oils & Fluids', 'Tools', 'Cleaning', 'Audio', 'Lighting', 'Interior', 'Exterior'],
  books:         ['Fiction', 'Non-Fiction', "Children's", 'Educational', 'Religion', 'Indonesian Literature', 'Imports'],
  candles:       ['Scented', 'Soy', 'Pillars', 'Tealights', 'Gift Sets', 'Candle Holders', 'DIY Kits'],
  herbal:        ['Herbs & Spices', 'Teas', 'Tinctures', 'Capsules', 'Oils', 'Jamu Tradisional', 'Powders'],
  seatcovers:    ['Car Seat Covers', 'Motorbike Covers', 'Pet Covers', 'Cushions', 'Custom', 'Materials'],
}

// ────────────────────────────────────────────────────────────────────────
//  SERVICES — 47 themes
//  Categories here represent service PACKAGES the customer can book.
// ────────────────────────────────────────────────────────────────────────
export const SERVICES_CATEGORIES = {
  accountant:      ['Bookkeeping', 'Tax Filing', 'Audit', 'Payroll', 'Financial Advice', 'Business Setup'],
  aircon:          ['Installation', 'Repair', 'Cleaning', 'Maintenance Contract', 'Refrigerant Refill', 'Parts & Filters'],
  barber:          ['Haircut', 'Beard Trim', 'Hot Shave', 'Hair Wash', 'Kids Cut', 'Packages'],
  beautician:      ['Facial', 'Waxing', 'Body Treatments', 'Makeup', 'Bridal', 'Packages'],
  cardriver:       ['Hourly Driver', 'Daily Driver', 'Airport Transfer', 'Out-of-Town', 'Wedding', 'City Tour'],
  carpenter:       ['Custom Furniture', 'Repairs', 'Installation', 'Built-ins', 'Doors & Windows', 'Restoration'],
  carrent:         ['Sedan', 'MPV', 'SUV', 'Van', 'Luxury', 'Daily', 'Weekly', 'Monthly'],
  carwash:         ['Basic Wash', 'Premium Wash', 'Interior Detail', 'Full Detail', 'Wax & Polish', 'Membership'],
  childcare:       ['Hourly', 'Half-day', 'Full-day', 'Overnight', 'Tutoring Combo', 'Activities'],
  cleaning:        ['Basic Cleaning', 'Deep Cleaning', 'Move-in / Move-out', 'Office', 'Post-Construction', 'Weekly Contract'],
  courier:         ['Same-day', 'Next-day', 'Express', 'Documents', 'Packages', 'Bulk', 'International'],
  driving:         ['Beginner Lessons', 'License Prep', 'Refresher', 'Highway', 'Manual', 'Automatic'],
  electrician:     ['Installation', 'Repair', 'Wiring', 'Inspection', 'Emergency Call-out', 'Solar Setup'],
  event:           ['Wedding', 'Birthday', 'Corporate', 'Catering Setup', 'Decoration', 'Sound & Lighting'],
  gardening:       ['Lawn Mowing', 'Landscaping', 'Tree Trimming', 'Plant Care', 'Garden Design', 'Monthly Contract'],
  glass:           ['Window Repair', 'Mirror Installation', 'Custom Glass', 'Tinting', 'Replacement', 'Cleaning'],
  hairsalon:       ['Cut', 'Color', 'Treatment', 'Bridal', 'Hair Spa', 'Extensions', 'Keratin'],
  jeeptour:        ['Half-day Tour', 'Full-day', 'Sunrise', 'Sunset', 'Off-road Adventure', 'Private Charter'],
  laser:           ['Hair Removal', 'Skin Treatments', 'Tattoo Removal', 'Anti-aging', 'Consultation', 'Package Deals'],
  lawyer:          ['Consultation', 'Legal Documents', 'Business Law', 'Family Law', 'Property Law', 'Litigation'],
  leather:         ['Repair', 'Restoration', 'Custom Goods', 'Cleaning', 'Re-coloring', 'Bag Making'],
  locksmith:       ['Emergency Lockout', 'Lock Installation', 'Rekey', 'Smart Locks', 'Auto Lockout', 'Security Audit'],
  maid:            ['Daily', 'Weekly', 'Monthly', 'Live-in', 'Cooking Add-on', 'Childcare Combo'],
  massage:         ['Swedish', 'Deep Tissue', 'Thai', 'Reflexology', 'Aromatherapy', 'Couples', 'Packages'],
  mechanic:        ['Oil Change', 'Brakes', 'Engine', 'Transmission', 'Inspection', 'Emergency', 'Customization'],
  motorrent:       ['Scooter Daily', 'Sport Bike Daily', 'Adventure Daily', 'Weekly', 'Monthly', 'Helmet Included'],
  music:           ['Live Band', 'DJ', 'Solo Acoustic', 'Wedding', 'Corporate', 'Lessons', 'Equipment Rental'],
  nailart:         ['Manicure', 'Pedicure', 'Gel', 'Acrylic', 'Custom Art', 'Bridal', 'Packages'],
  painter:         ['Interior', 'Exterior', 'Touch-up', 'Wallpaper', 'Decorative', 'Industrial'],
  pest:            ['Termites', 'Ants', 'Cockroaches', 'Rodents', 'Mosquitoes', 'General Treatment', 'Monthly Contract'],
  petgroom:        ['Bath & Brush', 'Full Groom', 'Nail Trim', 'Teeth Cleaning', 'De-shedding', 'Specialty Cuts'],
  photographer:    ['Wedding', 'Events', 'Portrait', 'Product', 'Real Estate', 'Family', 'Engagement'],
  plastering:      ['Wall Plastering', 'Ceiling', 'Repair', 'Decorative', 'Texturing', 'Skim Coat'],
  plumbing:        ['Leak Repair', 'Installation', 'Drain Cleaning', 'Water Heater', 'Emergency', 'Inspection'],
  propertyrentals: ['1BR Apartment', '2BR', '3BR+ House', 'Studio', 'Villa', 'Office', 'Commercial'],
  propertysales:   ['1BR', '2BR', '3BR+', 'Land', 'Commercial', 'Villa', 'New Development'],
  roofrepair:      ['Leak Repair', 'Full Replacement', 'Inspection', 'Gutter', 'Solar Prep', 'Emergency'],
  salon:           ['Hair', 'Nails', 'Makeup', 'Skincare', 'Spa', 'Bridal Packages'],
  tailor:          ['Custom Suits', 'Dresses', 'Alterations', 'Repair', 'Wedding', 'Uniforms', 'Batik'],
  tattoo:          ['Small Tattoo', 'Medium', 'Large', 'Cover-up', 'Custom Design', 'Touch-up', 'Removal Referral'],
  tourguide:       ['Half-day', 'Full-day', 'Multi-day', 'City Tour', 'Cultural', 'Adventure', 'Custom'],
  translator:      ['Document', 'Live Interpretation', 'Legal', 'Medical', 'Business', 'Per-page Rate', 'Subtitling'],
  tutor:           ['Math', 'Science', 'English', 'Indonesian', 'Music', 'Test Prep (UTBK / IELTS)', 'Online'],
  webdev:          ['Landing Page', 'E-commerce', 'Custom App', 'Mobile App', 'SEO', 'Maintenance', 'Consultation'],
  website:         ['Template Site', 'Custom Design', 'Logo Design', 'Hosting', 'Maintenance', 'SEO Starter'],
  wedding:         ['Full Package', 'Day-of Coordination', 'Decoration', 'Catering', 'Photography', 'Music', 'Venue'],
  yoga:            ['Group Class', 'Private 1-on-1', 'Beach Yoga', 'Retreat', 'Online', 'Workshop'],
}

// Generic fallback when theme is unknown.
const FALLBACK = ['Featured', 'New', 'Bestsellers', 'Other']

/** Look up categories for a theme. appKind: 'products' | 'services' */
export function getCategoriesForTheme(themeId, appKind = 'products') {
  const table = appKind === 'services' ? SERVICES_CATEGORIES : PRODUCTS_CATEGORIES
  return table[themeId] || FALLBACK
}

/** Short tab list (first 3) — for compact tab strips, kept for legacy callers. */
export function getMenuTabsForTheme(themeId, appKind = 'products') {
  return getCategoriesForTheme(themeId, appKind).slice(0, 3)
}
