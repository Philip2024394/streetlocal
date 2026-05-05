// ─────────────────────────────────────────────────────────────────────────────
// Indoo — Category / Sub-category directory
// Every main category → specific positions → auto search keywords
// ─────────────────────────────────────────────────────────────────────────────

export const LOOKING_FOR_GROUPS = [
  { key: 'featured',    label: 'Most Popular' },
  { key: 'commerce',    label: 'Buying & Selling' },
  { key: 'social',      label: 'Social & Personal' },
  { key: 'activities',  label: 'Activities & Going Out' },
  { key: 'trades',      label: 'Trades & Home Services' },
  { key: 'health',      label: 'Health & Wellness' },
  { key: 'hospitality', label: 'Food, Hospitality & Events' },
  { key: 'creative',    label: 'Creative & Media' },
  { key: 'professional',label: 'Professional & Business' },
  { key: 'work',        label: 'Work & Employment' },
  { key: 'education',   label: 'Education & Learning' },
  { key: 'community',   label: 'Community & Causes' },
  { key: 'transport',   label: 'Driver Services' },
  { key: 'other',       label: 'Other' },
]

export const LOOKING_FOR_OPTIONS = [
  // ── Most Popular ─────────────────────────────────────────────
  { value: 'bike_ride',  emoji: '🛵', label: 'Bike Ride Service',  group: 'featured', img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237' },
  { value: 'car_taxi',   emoji: '🚗', label: 'Car Taxi Service',   group: 'featured', img: 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566' },
  { value: 'restaurant', emoji: '🍴', label: 'Restaurant Owner',   group: 'featured' },

  // ── Buying & Selling ─────────────────────────────────────────
  { value: 'buy_sell',       emoji: '🛒', label: 'Buy & Sell — General',        group: 'commerce' },
  { value: 'fresh_produce',  emoji: '🌾', label: 'Fresh Produce & Market',      group: 'commerce' },
  { value: 'agri_goods',     emoji: '🚜', label: 'Farm & Agricultural Goods',   group: 'commerce' },
  { value: 'fashion',        emoji: '👗', label: 'Fashion & Clothing',           group: 'commerce' },
  { value: 'electronics',    emoji: '📱', label: 'Electronics & Gadgets',       group: 'commerce' },
  { value: 'vehicles',       emoji: '🚗', label: 'Vehicles & Transport',        group: 'commerce' },
  { value: 'property',       emoji: '🏠', label: 'Property & Rentals',          group: 'commerce' },
  { value: 'hardware',       emoji: '🔨', label: 'Hardware & Building Supplies', group: 'commerce' },
  { value: 'tools_equip',    emoji: '🔩', label: 'Tools & Equipment',           group: 'commerce' },
  { value: 'antiques',       emoji: '🏺', label: 'Antiques & Collectibles',     group: 'commerce' },
  { value: 'import_export',  emoji: '🚢', label: 'Import / Export / Wholesale', group: 'commerce' },

  // ── Social & Personal ────────────────────────────────────────
  { value: 'meet_new',       emoji: '👋', label: 'Meet New People',             group: 'social' },
  { value: 'marriage',       emoji: '💍', label: 'Marriage',                    group: 'social' },
  { value: 'dating',         img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdasaaaaaaa-removebg-preview.png?updatedAt=1775627388475', label: 'Dating / Romance', group: 'social' },
  { value: 'date_night',     emoji: '🍽️', label: 'Date Night',                 group: 'social' },
  { value: 'friendship',     emoji: '🤝', label: 'Friendship / Social',         group: 'social' },
  { value: 'travel',         emoji: '✈️', label: 'Travel & Explore',            group: 'social' },
  { value: 'pen_pal',        emoji: '✉️', label: 'Pen Pal',                    group: 'social' },
  { value: 'expats',         emoji: '🌍', label: 'Expats & International',       group: 'social' },
  { value: 'language',       emoji: '🗣️', label: 'Language Exchange',           group: 'social' },

  // ── Activities & Going Out ───────────────────────────────────
  { value: 'nightlife',      emoji: '🎵', label: 'Music & Nightlife',           group: 'activities' },
  { value: 'sports',         emoji: '⚽', label: 'Sports & Fitness',             group: 'activities' },
  { value: 'food_dining',    emoji: '🍽️', label: 'Food & Dining',               group: 'activities' },
  { value: 'events',         emoji: '🎉', label: 'Events & Activities',          group: 'activities' },
  { value: 'arts',           emoji: '🎨', label: 'Arts & Culture',               group: 'activities' },
  { value: 'outdoor',        emoji: '🏕️', label: 'Outdoor & Adventure',         group: 'activities' },
  { value: 'gaming',         emoji: '🎮', label: 'Gaming & Esports',             group: 'activities' },
  { value: 'comedy',         emoji: '🎭', label: 'Comedy & Entertainment',       group: 'activities' },
  { value: 'markets_fairs',  emoji: '🏪', label: 'Markets & Fairs',              group: 'activities' },

  // ── Trades & Home Services ───────────────────────────────────
  { value: 'trades',         emoji: '🔧', label: 'Trades & Construction',       group: 'trades' },
  { value: 'auto_repair',    emoji: '🚘', label: 'Auto Repair & Mechanics',     group: 'trades' },
  { value: 'cleaning',       emoji: '🧹', label: 'Cleaning & Home Help',        group: 'trades' },
  { value: 'garden',         emoji: '🌿', label: 'Garden & Outdoor Services',   group: 'trades' },
  { value: 'security',       emoji: '🔒', label: 'Security Services',           group: 'trades' },
  { value: 'laundry',        emoji: '👕', label: 'Laundry & Dry Cleaning',      group: 'trades' },
  { value: 'tailoring',      emoji: '🧵', label: 'Tailoring & Alterations',     group: 'trades' },
  { value: 'childcare',      emoji: '👶', label: 'Child Care & Babysitting',    group: 'trades' },
  { value: 'eldercare',      emoji: '🤗', label: 'Elder Care & Companionship',  group: 'trades' },
  { value: 'pet_care',       emoji: '🐾', label: 'Pet Care & Grooming',         group: 'trades' },
  { value: 'transport',      emoji: '🚚', label: 'Transport & Delivery',        group: 'trades' },

  // ── Health & Wellness ────────────────────────────────────────
  { value: 'healthcare',     emoji: '🏥', label: 'Healthcare & Medical',        group: 'health' },
  { value: 'beauty',         emoji: '💈', label: 'Beauty & Wellness',           group: 'health' },
  { value: 'fitness_pt',     emoji: '🏋️', label: 'Personal Training',          group: 'health' },
  { value: 'mental_health',  emoji: '🧠', label: 'Mental Health & Therapy',    group: 'health' },
  { value: 'alt_medicine',   emoji: '🌱', label: 'Alternative & Traditional Medicine', group: 'health' },
  { value: 'veterinary',     emoji: '🐶', label: 'Veterinary & Animal Health',  group: 'health' },
  { value: 'pharmacy',       emoji: '💊', label: 'Pharmacy & Supplements',      group: 'health' },

  // ── Food, Hospitality & Events ───────────────────────────────
  { value: 'catering',       emoji: '🍳', label: 'Food & Catering',             group: 'hospitality' },
  { value: 'restaurant',     emoji: '🍴', label: 'Restaurant & Café',           group: 'hospitality' },
  { value: 'hotel_accom',    emoji: '🏨', label: 'Hotel & Accommodation',       group: 'hospitality' },
  { value: 'tourism_guide',  emoji: '🗺️', label: 'Tourism & Local Guide',       group: 'hospitality' },
  { value: 'event_planning', emoji: '🎊', label: 'Event Planning & Weddings',   group: 'hospitality' },
  { value: 'bar_nightclub',  emoji: '🍸', label: 'Bar & Nightclub',             group: 'hospitality' },

  // ── Creative & Media ─────────────────────────────────────────
  { value: 'creative',       emoji: '📸', label: 'Photography / Video / Design', group: 'creative' },
  { value: 'content_creator',emoji: '📲', label: 'Content Creator / Influencer', group: 'creative' },
  { value: 'music_perform',  emoji: '🎤', label: 'Music & Performance',         group: 'creative' },
  { value: 'writing',        emoji: '✍️', label: 'Writing & Journalism',        group: 'creative' },
  { value: 'fashion_design', emoji: '✂️', label: 'Fashion Design & Styling',    group: 'creative' },
  { value: 'art_craft',      emoji: '🎨', label: 'Art, Craft & Handmade',       group: 'creative' },

  // ── Professional & Business ──────────────────────────────────
  { value: 'business',       emoji: '💼', label: 'Business & Networking',       group: 'professional' },
  { value: 'technology',     emoji: '💻', label: 'Technology & IT',             group: 'professional' },
  { value: 'legal',          emoji: '⚖️', label: 'Legal & Financial',           group: 'professional' },
  { value: 'engineering',    emoji: '🏗️', label: 'Engineering & Architecture',  group: 'professional' },
  { value: 'sales_leads',    emoji: '📈', label: 'Sales & New Leads',           group: 'professional' },
  { value: 'consulting',     emoji: '🤝', label: 'Consulting & Strategy',       group: 'professional' },
  { value: 'real_estate',    emoji: '🏢', label: 'Real Estate & Development',   group: 'professional' },
  { value: 'marketing',      emoji: '📣', label: 'Marketing & Advertising',     group: 'professional' },
  { value: 'media_pro',      emoji: '📺', label: 'Media & Broadcasting',        group: 'professional' },

  // ── Work & Employment ────────────────────────────────────────
  { value: 'job_seeker',     emoji: '🔍', label: 'Looking for Work',            group: 'work' },
  { value: 'hiring',         emoji: '👥', label: 'Hiring / Recruiting',         group: 'work' },
  { value: 'freelance',      emoji: '💪', label: 'Freelance / Contract',        group: 'work' },
  { value: 'digital_nomad',  emoji: '🌐', label: 'Digital Nomad / Remote Work', group: 'work' },
  { value: 'apprentice',     emoji: '🎓', label: 'Apprenticeship & Training',   group: 'work' },
  { value: 'domestic_work',  emoji: '🏡', label: 'Domestic & Household Work',   group: 'work' },
  { value: 'agri_work',      emoji: '🌾', label: 'Agricultural & Farm Work',    group: 'work' },
  { value: 'manufacturing',  emoji: '🏭', label: 'Manufacturing & Industrial',  group: 'work' },
  { value: 'mining',         emoji: '⛏️', label: 'Mining & Natural Resources',  group: 'work' },

  // ── Education & Learning ─────────────────────────────────────
  { value: 'students',       emoji: '🎓', label: 'Students',                    group: 'education' },
  { value: 'education',      emoji: '📚', label: 'Teaching & Tutoring',         group: 'education' },
  { value: 'research',       emoji: '🔬', label: 'Research & Academia',         group: 'education' },
  { value: 'skills',         emoji: '🛠️', label: 'Skills & Workshops',          group: 'education' },
  { value: 'coaching',       emoji: '🏆', label: 'Coaching & Mentoring',        group: 'education' },

  // ── Community & Causes ───────────────────────────────────────
  { value: 'family',         emoji: '👨‍👩‍👧', label: 'Family & Parenting',        group: 'community' },
  { value: 'faith',          emoji: '🤲', label: 'Faith & Community',           group: 'community' },
  { value: 'volunteering',   emoji: '💚', label: 'Volunteering & NGO',          group: 'community' },
  { value: 'wellbeing',      emoji: '🧘', label: 'Health & Wellbeing',          group: 'community' },
  { value: 'seniors',        emoji: '👴', label: 'Seniors & Retired',           group: 'community' },
  { value: 'youth',          emoji: '🌟', label: 'Youth & Young Adults',        group: 'community' },
  { value: 'lgbtq',          emoji: '🏳️‍🌈', label: 'LGBTQ+ Community',           group: 'community' },
  { value: 'environment',    emoji: '🌱', label: 'Environmental & Eco',         group: 'community' },
  { value: 'civic',          emoji: '🗳️', label: 'Civic & Political',           group: 'community' },
  { value: 'disability',     emoji: '♿', label: 'Disability & Accessibility',   group: 'community' },

  // ── Driver Services ─────────────────────────────────────────
  { value: 'car_taxi',       emoji: '🚗', label: 'Car Taxi Service',             group: 'transport' },
  { value: 'bike_ride',      emoji: '🛵', label: 'Bike Ride Service',            group: 'transport' },

  // ── Other ────────────────────────────────────────────────────
  { value: 'browsing',       emoji: '👀', label: 'Just Browsing',               group: 'other' },
]

// ─────────────────────────────────────────────────────────────────────────────
// SUB-CATEGORIES  { mainValue: [{ value, label, emoji, keywords[] }] }
// keywords = auto-applied search tags when this sub-category is selected
// ─────────────────────────────────────────────────────────────────────────────
export const SUB_CATEGORIES = {

  // ── Buying & Selling ─────────────────────────────────────────
  buy_sell: [
    { value: 'general_seller',  emoji: '🛒', label: 'General Seller',           keywords: ['seller', 'selling', 'for sale', 'buy', 'sell', 'shop'] },
    { value: 'second_hand',     emoji: '♻️', label: 'Second Hand / Preloved',   keywords: ['second hand', 'preloved', 'used', 'vintage', 'thrift', 'nearly new'] },
    { value: 'market_trader',   emoji: '🏪', label: 'Market Trader',            keywords: ['market trader', 'market stall', 'street market', 'flea market'] },
    { value: 'street_vendor',   emoji: '🛍️', label: 'Street Vendor',            keywords: ['street vendor', 'street seller', 'hawker', 'roadside seller'] },
    { value: 'online_seller',   emoji: '💻', label: 'Online Seller',            keywords: ['online seller', 'ecommerce', 'ebay', 'etsy', 'amazon seller'] },
    { value: 'wholesaler',      emoji: '📦', label: 'Wholesaler / Bulk',        keywords: ['wholesale', 'bulk', 'trade price', 'distributor', 'stockist'] },
    { value: 'dropshipper',     emoji: '🚀', label: 'Dropshipper',              keywords: ['dropship', 'dropshipping', 'no stock', 'print on demand'] },
  ],

  fresh_produce: [
    { value: 'fruit_veg',       emoji: '🥦', label: 'Fruit & Vegetables',       keywords: ['fruit', 'vegetables', 'veg', 'fresh produce', 'greengrocer', 'organic veg'] },
    { value: 'meat_poultry',    emoji: '🥩', label: 'Meat & Poultry',           keywords: ['meat', 'butcher', 'chicken', 'beef', 'lamb', 'pork', 'halal meat'] },
    { value: 'fish_seafood',    emoji: '🐟', label: 'Fish & Seafood',           keywords: ['fish', 'seafood', 'fishmonger', 'prawns', 'lobster', 'fresh fish'] },
    { value: 'dairy_eggs',      emoji: '🥚', label: 'Dairy & Eggs',             keywords: ['dairy', 'eggs', 'milk', 'cheese', 'butter', 'yoghurt', 'farm eggs'] },
    { value: 'bakery',          emoji: '🍞', label: 'Bakery & Bread',           keywords: ['bakery', 'bread', 'pastry', 'cakes', 'baker', 'sourdough', 'rolls'] },
    { value: 'herbs_spices',    emoji: '🌿', label: 'Herbs & Spices',           keywords: ['herbs', 'spices', 'seasonings', 'chilli', 'pepper', 'fresh herbs'] },
    { value: 'organic',         emoji: '🌱', label: 'Organic Produce',          keywords: ['organic', 'natural', 'chemical free', 'pesticide free', 'farm fresh'] },
    { value: 'honey_beekeeper', emoji: '🍯', label: 'Honey & Beekeeping',       keywords: ['honey', 'beekeeper', 'raw honey', 'bee products', 'wax'] },
  ],

  agri_goods: [
    { value: 'crop_seller',     emoji: '🌾', label: 'Crop & Grain Seller',      keywords: ['crops', 'grain', 'wheat', 'maize', 'rice', 'corn', 'harvest'] },
    { value: 'livestock_seller',emoji: '🐄', label: 'Livestock Seller',         keywords: ['livestock', 'cattle', 'goats', 'sheep', 'pigs', 'farm animals'] },
    { value: 'seeds_fertilizer',emoji: '🌱', label: 'Seeds & Fertilizer',       keywords: ['seeds', 'fertilizer', 'compost', 'manure', 'agri input', 'farming supplies'] },
    { value: 'agri_equipment',  emoji: '🚜', label: 'Agricultural Equipment',   keywords: ['tractor', 'farm equipment', 'agricultural machinery', 'plough', 'harvester'] },
    { value: 'poultry_eggs',    emoji: '🐓', label: 'Poultry & Eggs',           keywords: ['poultry', 'chickens', 'eggs', 'turkey', 'duck', 'farm eggs'] },
    { value: 'fish_farming',    emoji: '🐠', label: 'Fish Farming',             keywords: ['fish farm', 'aquaculture', 'tilapia', 'catfish', 'fish pond'] },
    { value: 'forestry_timber', emoji: '🌲', label: 'Forestry & Timber',        keywords: ['timber', 'lumber', 'wood', 'forestry', 'firewood', 'charcoal'] },
  ],

  fashion: [
    { value: 'womens_fashion',  emoji: '👩', label: "Women's Fashion",          keywords: ['women fashion', 'ladies clothing', 'dresses', 'tops', 'women wear'] },
    { value: 'mens_fashion',    emoji: '👔', label: "Men's Fashion",            keywords: ['men fashion', 'menswear', 'suits', 'shirts', 'men clothing'] },
    { value: 'childrens_clothing',emoji:'👧',label: "Children's Clothing",      keywords: ['kids clothes', 'children clothing', 'baby clothes', 'school uniform'] },
    { value: 'shoes_footwear',  emoji: '👟', label: 'Shoes & Footwear',         keywords: ['shoes', 'trainers', 'boots', 'heels', 'sandals', 'footwear'] },
    { value: 'bags_accessories',emoji: '👜', label: 'Bags & Accessories',       keywords: ['bags', 'handbags', 'backpack', 'accessories', 'belts', 'scarves'] },
    { value: 'sportswear',      emoji: '🏃', label: 'Sportswear & Activewear',  keywords: ['sportswear', 'gym wear', 'activewear', 'leggings', 'tracksuits'] },
    { value: 'traditional_wear',emoji: '🪭', label: 'Traditional & Cultural Wear', keywords: ['traditional wear', 'cultural clothing', 'national dress', 'ethnic wear', 'sari', 'dashiki', 'abaya'] },
    { value: 'vintage_clothing',emoji: '🕰️', label: 'Vintage & Second Hand',   keywords: ['vintage', 'retro', 'second hand clothes', 'preloved fashion', 'thrift'] },
  ],

  electronics: [
    { value: 'mobile_phones',   emoji: '📱', label: 'Mobile Phones & Tablets',  keywords: ['mobile', 'phone', 'smartphone', 'tablet', 'iphone', 'samsung', 'android'] },
    { value: 'computers',       emoji: '💻', label: 'Computers & Laptops',      keywords: ['laptop', 'computer', 'pc', 'desktop', 'macbook', 'chromebook'] },
    { value: 'tv_audio',        emoji: '📺', label: 'TV & Audio',               keywords: ['tv', 'television', 'speakers', 'headphones', 'home cinema', 'sound system'] },
    { value: 'gaming_consoles', emoji: '🎮', label: 'Gaming Consoles & Games',  keywords: ['gaming', 'playstation', 'xbox', 'nintendo', 'console', 'games'] },
    { value: 'smart_home',      emoji: '🏠', label: 'Smart Home & Tech',        keywords: ['smart home', 'alexa', 'google home', 'smart lights', 'cctv', 'security camera'] },
    { value: 'accessories_parts',emoji:'🔌', label: 'Accessories & Parts',      keywords: ['phone case', 'charger', 'cables', 'spare parts', 'accessories', 'adaptor'] },
    { value: 'solar_energy',    emoji: '☀️', label: 'Solar & Energy Products',  keywords: ['solar panel', 'solar energy', 'inverter', 'battery storage', 'off grid'] },
    { value: 'electronics_repair',emoji:'🔧',label: 'Electronics Repair',       keywords: ['phone repair', 'screen repair', 'laptop repair', 'electronics fix', 'tech repair'] },
  ],

  vehicles: [
    { value: 'cars',            emoji: '🚗', label: 'Cars',                     keywords: ['car', 'cars for sale', 'used cars', 'second hand car', 'auto'] },
    { value: 'motorcycles',     emoji: '🏍️', label: 'Motorcycles & Scooters',   keywords: ['motorcycle', 'motorbike', 'scooter', 'moped', 'bike for sale'] },
    { value: 'trucks_vans',     emoji: '🚛', label: 'Trucks, Vans & HGV',       keywords: ['truck', 'van', 'lorry', 'hgv', 'commercial vehicle', 'tipper'] },
    { value: 'boats_marine',    emoji: '⛵', label: 'Boats & Marine',           keywords: ['boat', 'marine', 'yacht', 'speedboat', 'canoe', 'fishing boat'] },
    { value: 'agri_vehicles',   emoji: '🚜', label: 'Agricultural Vehicles',    keywords: ['tractor', 'combine harvester', 'farm vehicle', 'agricultural'] },
    { value: 'vehicle_parts',   emoji: '⚙️', label: 'Vehicle Parts & Tyres',   keywords: ['car parts', 'tyres', 'spare parts', 'engine', 'exhaust', 'wheels'] },
    { value: 'car_rental',      emoji: '🔑', label: 'Car Rental & Hire',        keywords: ['car hire', 'car rental', 'vehicle hire', 'rent a car'] },
    { value: 'electric_vehicles',emoji:'⚡', label: 'Electric Vehicles (EV)',   keywords: ['electric car', 'ev', 'tesla', 'electric vehicle', 'hybrid'] },
  ],

  property: [
    { value: 'residential_sale',emoji: '🏡', label: 'Residential Sale',         keywords: ['house for sale', 'property sale', 'home for sale', 'buy house'] },
    { value: 'residential_rent',emoji: '🔑', label: 'Residential Rental',       keywords: ['house rent', 'flat to rent', 'apartment rental', 'room to rent', 'tenant'] },
    { value: 'commercial_prop', emoji: '🏢', label: 'Commercial Property',      keywords: ['commercial property', 'office for rent', 'shop to let', 'warehouse'] },
    { value: 'land_plots',      emoji: '🌳', label: 'Land & Plots',             keywords: ['land for sale', 'plot', 'building plot', 'agricultural land', 'land'] },
    { value: 'short_let',       emoji: '🏖️', label: 'Short Term / Holiday Let', keywords: ['airbnb', 'holiday let', 'short term rental', 'vacation rental', 'serviced'] },
    { value: 'new_development', emoji: '🏗️', label: 'New Build & Development', keywords: ['new build', 'off plan', 'development', 'new homes', 'developer'] },
    { value: 'student_accom',   emoji: '🎓', label: 'Student Accommodation',    keywords: ['student accommodation', 'student housing', 'university digs', 'hmo'] },
    { value: 'storage_units',   emoji: '📦', label: 'Storage & Warehouses',     keywords: ['storage', 'warehouse', 'self storage', 'lock up', 'unit'] },
  ],

  hardware: [
    { value: 'building_materials',emoji:'🧱',label: 'Building Materials',       keywords: ['cement', 'bricks', 'blocks', 'sand', 'aggregate', 'building materials'] },
    { value: 'plumbing_supplies',emoji: '🚰',label: 'Plumbing Supplies',        keywords: ['pipes', 'plumbing supplies', 'fittings', 'valves', 'bathroom supplies'] },
    { value: 'electrical_supplies',emoji:'⚡',label: 'Electrical Supplies',     keywords: ['electrical supplies', 'cable', 'wiring', 'circuit breaker', 'switches', 'sockets'] },
    { value: 'paint_finishes',  emoji: '🎨', label: 'Paint & Finishes',         keywords: ['paint', 'primer', 'varnish', 'wallpaper', 'coatings', 'emulsion'] },
    { value: 'timber_wood',     emoji: '🪵', label: 'Timber & Wood',            keywords: ['timber', 'wood', 'mdf', 'plywood', 'planks', 'lumber', 'hardwood'] },
    { value: 'fixings',         emoji: '🔩', label: 'Fixings & Fasteners',      keywords: ['screws', 'bolts', 'nails', 'fixings', 'anchors', 'brackets'] },
    { value: 'safety_ppe',      emoji: '🦺', label: 'Safety & PPE',             keywords: ['safety equipment', 'ppe', 'hard hat', 'gloves', 'hi vis', 'boots'] },
    { value: 'ironmongery',     emoji: '🔑', label: 'Ironmongery & Locks',      keywords: ['locks', 'keys', 'hinges', 'handles', 'ironmongery', 'security'] },
  ],

  tools_equip: [
    { value: 'hand_tools',      emoji: '🔨', label: 'Hand Tools',               keywords: ['hammer', 'screwdriver', 'spanner', 'hand tools', 'wrench', 'pliers'] },
    { value: 'power_tools',     emoji: '⚡', label: 'Power Tools',              keywords: ['drill', 'saw', 'grinder', 'power tools', 'sander', 'jigsaw'] },
    { value: 'construction_equip',emoji:'🏗️',label:'Construction Equipment',    keywords: ['scaffolding', 'mixer', 'compressor', 'generator', 'digger', 'plant hire'] },
    { value: 'garden_tools',    emoji: '🌿', label: 'Garden Tools',             keywords: ['lawnmower', 'strimmer', 'garden tools', 'spade', 'rake', 'wheelbarrow'] },
    { value: 'industrial_machinery',emoji:'🏭',label:'Industrial Machinery',    keywords: ['industrial', 'machinery', 'cnc', 'lathe', 'press', 'conveyor', 'forklift'] },
    { value: 'catering_equip',  emoji: '🍳', label: 'Catering Equipment',       keywords: ['catering equipment', 'commercial oven', 'fridge', 'fryer', 'food prep'] },
    { value: 'medical_equip',   emoji: '🏥', label: 'Medical Equipment',        keywords: ['medical equipment', 'wheelchair', 'hospital bed', 'oxygen', 'blood pressure'] },
  ],

  antiques: [
    { value: 'antique_furniture',emoji:'🪑', label: 'Antique Furniture',        keywords: ['antique furniture', 'vintage furniture', 'period furniture', 'restoration'] },
    { value: 'art_paintings',   emoji: '🖼️', label: 'Art & Paintings',          keywords: ['art', 'paintings', 'prints', 'sculpture', 'original art', 'gallery'] },
    { value: 'coins_currency',  emoji: '🪙', label: 'Coins & Currency',         keywords: ['coins', 'numismatic', 'banknotes', 'currency', 'rare coins', 'gold coins'] },
    { value: 'jewellery_watches',emoji:'⌚', label: 'Jewellery & Watches',      keywords: ['jewellery', 'watches', 'gold', 'silver', 'diamonds', 'vintage watches'] },
    { value: 'books_manuscripts',emoji:'📖',label: 'Books & Manuscripts',       keywords: ['rare books', 'manuscripts', 'first edition', 'vintage books', 'maps'] },
    { value: 'memorabilia',     emoji: '🏆', label: 'Sports & Music Memorabilia',keywords: ['memorabilia', 'signed', 'autograph', 'vintage sports', 'music collectibles'] },
    { value: 'ceramics_glass',  emoji: '🏺', label: 'Ceramics, Pottery & Glass',keywords: ['ceramics', 'pottery', 'glassware', 'porcelain', 'vintage china'] },
  ],

  import_export: [
    { value: 'food_bev_trade',  emoji: '🥫', label: 'Food & Beverage',         keywords: ['food import', 'beverage trade', 'food export', 'fmcg', 'grocery wholesale'] },
    { value: 'clothing_textiles',emoji:'👘',label: 'Clothing & Textiles',       keywords: ['clothing import', 'textile trade', 'fabric wholesale', 'garment export'] },
    { value: 'electronics_trade',emoji:'📱',label: 'Electronics',              keywords: ['electronics import', 'tech wholesale', 'gadget trade', 'electronics export'] },
    { value: 'raw_materials',   emoji: '⛏️', label: 'Raw Materials & Commodities',keywords: ['raw materials', 'commodities', 'minerals', 'metals', 'ore', 'crude'] },
    { value: 'agri_commodity',  emoji: '🌾', label: 'Agricultural Commodities', keywords: ['cocoa', 'coffee', 'cotton', 'sugar', 'grain trade', 'commodity'] },
    { value: 'machinery_trade', emoji: '⚙️', label: 'Machinery & Industrial',  keywords: ['machinery import', 'industrial export', 'equipment trade'] },
    { value: 'freight_logistics',emoji:'🚢', label: 'Freight & Logistics',      keywords: ['freight', 'shipping', 'logistics', 'customs', 'clearance', 'forwarding'] },
  ],

  // ── Trades & Construction ────────────────────────────────────
  trades: [
    { value: 'builder',         emoji: '🏗️', label: 'Builder / General Contractor', keywords: ['builder', 'building', 'construction', 'contractor', 'extension', 'renovation', 'new build'] },
    { value: 'plumber',         emoji: '🚰', label: 'Plumber',                  keywords: ['plumber', 'plumbing', 'boiler', 'pipes', 'heating', 'drainage', 'bathroom', 'water leak'] },
    { value: 'electrician',     emoji: '⚡', label: 'Electrician',              keywords: ['electrician', 'electrical', 'wiring', 'fuse box', 'sockets', 'lighting', 'electrics'] },
    { value: 'carpenter',       emoji: '🪚', label: 'Carpenter / Joiner',       keywords: ['carpenter', 'joiner', 'carpentry', 'woodwork', 'doors', 'stairs', 'skirting', 'fitted'] },
    { value: 'painter_decorator',emoji:'🖌️',label: 'Painter & Decorator',      keywords: ['painter', 'decorator', 'painting', 'decorating', 'wallpaper', 'coving', 'filler'] },
    { value: 'roofer',          emoji: '🏠', label: 'Roofer',                   keywords: ['roofer', 'roofing', 'roof repair', 'tiles', 'gutters', 'fascia', 'flat roof', 'felt'] },
    { value: 'tiler',           emoji: '🔲', label: 'Tiler — Floor & Wall',     keywords: ['tiler', 'tiling', 'floor tiles', 'wall tiles', 'bathroom tiling', 'kitchen tiles'] },
    { value: 'plasterer',       emoji: '🪣', label: 'Plasterer',                keywords: ['plasterer', 'plastering', 'skim coat', 'render', 'artex', 'dry lining'] },
    { value: 'bricklayer',      emoji: '🧱', label: 'Bricklayer / Stonemason',  keywords: ['bricklayer', 'brickwork', 'stonemason', 'masonry', 'pointing', 'repointing'] },
    { value: 'gas_hvac',        emoji: '🔥', label: 'Gas Engineer / HVAC',      keywords: ['gas engineer', 'boiler service', 'hvac', 'heating', 'air conditioning', 'gas safe'] },
    { value: 'glazier',         emoji: '🪟', label: 'Glazier / Window Fitter',  keywords: ['glazier', 'windows', 'glass', 'double glazing', 'upvc', 'window repair'] },
    { value: 'welder',          emoji: '🔩', label: 'Welder & Metal Fabricator',keywords: ['welder', 'welding', 'fabricator', 'metal work', 'steel', 'aluminium', 'gates'] },
    { value: 'scaffolder',      emoji: '🪜', label: 'Scaffolder',               keywords: ['scaffolding', 'scaffold', 'access', 'tower scaffold'] },
    { value: 'landscape_hard',  emoji: '🏡', label: 'Landscaper / Groundwork',  keywords: ['landscaping', 'groundwork', 'driveway', 'patio', 'drainage', 'block paving'] },
    { value: 'handyman',        emoji: '🔧', label: 'Handyman / General Repairs',keywords: ['handyman', 'odd jobs', 'general repairs', 'maintenance', 'fix it', 'small jobs'] },
    { value: 'demolition',      emoji: '🏚️', label: 'Demolition Contractor',    keywords: ['demolition', 'knock down', 'structural', 'strip out', 'asbestos removal'] },
    { value: 'foreman',         emoji: '👷', label: 'Foreman / Site Manager',   keywords: ['foreman', 'site manager', 'construction manager', 'project management'] },
    { value: 'surveyor',        emoji: '📐', label: 'Surveyor',                 keywords: ['surveyor', 'survey', 'quantity surveyor', 'building survey', 'structural survey'] },
    { value: 'interior_fitout', emoji: '🛋️', label: 'Interior Fit-Out',         keywords: ['fit out', 'interior fit out', 'shopfitting', 'office fit out', 'refurbishment'] },
  ],

  auto_repair: [
    { value: 'general_mechanic',emoji: '🔧', label: 'General Mechanic',        keywords: ['mechanic', 'car repair', 'servicing', 'mot', 'engine repair', 'garage'] },
    { value: 'auto_electrician',emoji: '⚡', label: 'Auto Electrician',        keywords: ['auto electrician', 'car electrics', 'diagnostics', 'ecu', 'car wiring'] },
    { value: 'body_shop',       emoji: '🚘', label: 'Body Shop / Panel Beater', keywords: ['body shop', 'panel beater', 'dent repair', 'spray paint', 'accident repair'] },
    { value: 'tyre_specialist', emoji: '🔄', label: 'Tyre Specialist',          keywords: ['tyres', 'tyre fitting', 'wheel alignment', 'balancing', 'puncture repair'] },
    { value: 'mot_diagnostics', emoji: '🔍', label: 'MOT & Diagnostics',        keywords: ['mot', 'diagnostics', 'fault finding', 'obd', 'car inspection'] },
    { value: 'motorcycle_mech', emoji: '🏍️', label: 'Motorcycle Mechanic',     keywords: ['motorcycle mechanic', 'bike repair', 'motorbike service', 'scooter repair'] },
    { value: 'hgv_truck_mech',  emoji: '🚛', label: 'HGV / Truck Mechanic',    keywords: ['hgv mechanic', 'truck repair', 'lorry mechanic', 'commercial vehicle'] },
    { value: 'car_valeting',    emoji: '✨', label: 'Car Valeting & Detailing', keywords: ['car valeting', 'car wash', 'detailing', 'polishing', 'ceramic coating'] },
    { value: 'windscreen',      emoji: '🪟', label: 'Windscreen Repair',        keywords: ['windscreen', 'chip repair', 'screen replacement', 'autoglass'] },
    { value: 'recovery',        emoji: '🆘', label: 'Vehicle Recovery & Towing',keywords: ['vehicle recovery', 'towing', 'breakdown', 'rescue', 'roadside'] },
  ],

  cleaning: [
    { value: 'domestic_clean',  emoji: '🏠', label: 'Domestic / Home Cleaning', keywords: ['cleaner', 'home cleaning', 'house cleaner', 'domestic cleaning', 'maid'] },
    { value: 'commercial_clean',emoji: '🏢', label: 'Commercial & Office Cleaning',keywords: ['office cleaning', 'commercial cleaning', 'contract cleaning', 'janitorial'] },
    { value: 'deep_clean',      emoji: '🧼', label: 'Deep Cleaning',            keywords: ['deep clean', 'spring clean', 'intensive cleaning', 'sanitising', 'disinfection'] },
    { value: 'end_tenancy',     emoji: '🔑', label: 'End of Tenancy Cleaning',  keywords: ['end of tenancy', 'move out clean', 'checkout clean', 'landlord clean'] },
    { value: 'window_clean',    emoji: '🪟', label: 'Window Cleaning',          keywords: ['window cleaner', 'window cleaning', 'squeegee', 'exterior windows'] },
    { value: 'carpet_cleaning', emoji: '🧹', label: 'Carpet & Upholstery',      keywords: ['carpet cleaning', 'upholstery cleaning', 'steam clean', 'stain removal'] },
    { value: 'pressure_wash',   emoji: '💦', label: 'Pressure Washing',         keywords: ['pressure washing', 'jet wash', 'driveway cleaning', 'patio cleaning'] },
    { value: 'housekeeper',     emoji: '🫧', label: 'Housekeeper',              keywords: ['housekeeper', 'housekeeping', 'live in housekeeper', 'household management'] },
  ],

  garden: [
    { value: 'landscaper',      emoji: '🌳', label: 'Landscaper / Garden Design',keywords: ['landscaper', 'landscaping', 'garden design', 'garden makeover', 'soft landscaping'] },
    { value: 'lawn_care',       emoji: '🌿', label: 'Lawn Care & Mowing',       keywords: ['lawn mowing', 'grass cutting', 'lawn care', 'lawn treatment', 'edging'] },
    { value: 'tree_surgeon',    emoji: '🪓', label: 'Tree Surgeon / Arborist',  keywords: ['tree surgeon', 'arborist', 'tree removal', 'tree pruning', 'crown reduction'] },
    { value: 'fencing_decking', emoji: '🪵', label: 'Fencing & Decking',        keywords: ['fencing', 'fence panels', 'decking', 'garden fence', 'gate'] },
    { value: 'paving_drives',   emoji: '🏡', label: 'Paving & Driveways',       keywords: ['paving', 'driveway', 'block paving', 'slabs', 'patios', 'resin driveway'] },
    { value: 'irrigation',      emoji: '💧', label: 'Irrigation & Water Features',keywords: ['irrigation', 'sprinkler', 'water feature', 'pond', 'water garden'] },
    { value: 'garden_clearance',emoji: '♻️', label: 'Garden Clearance',         keywords: ['garden clearance', 'waste removal', 'rubbish removal', 'skip', 'green waste'] },
  ],

  security: [
    { value: 'security_guard',  emoji: '💂', label: 'Security Guard',           keywords: ['security guard', 'security officer', 'door staff', 'doorman', 'bouncer'] },
    { value: 'cctv_install',    emoji: '📹', label: 'CCTV & Alarm Installation',keywords: ['cctv', 'alarm system', 'intruder alarm', 'security cameras', 'smart alarm'] },
    { value: 'key_holding',     emoji: '🔑', label: 'Key Holding & Patrol',     keywords: ['key holding', 'mobile patrol', 'security patrol', 'alarm response'] },
    { value: 'event_security',  emoji: '🎪', label: 'Event Security',           keywords: ['event security', 'crowd control', 'festival security', 'venue security'] },
    { value: 'cyber_security',  emoji: '🛡️', label: 'Cyber Security',          keywords: ['cyber security', 'it security', 'penetration testing', 'firewall', 'data protection'] },
  ],

  laundry: [
    { value: 'laundry_service', emoji: '🧺', label: 'Laundry Service',          keywords: ['laundry', 'washing service', 'laundry pickup', 'laundry delivery', 'wash and fold'] },
    { value: 'dry_cleaning',    emoji: '👔', label: 'Dry Cleaning',             keywords: ['dry cleaning', 'dry cleaner', 'suits cleaning', 'garment cleaning'] },
    { value: 'ironing_service', emoji: '👕', label: 'Ironing Service',          keywords: ['ironing', 'pressing', 'shirt ironing', 'laundry ironing'] },
    { value: 'uniform_cleaning',emoji: '🦺', label: 'Uniform & Workwear',       keywords: ['uniform cleaning', 'workwear laundry', 'hi vis cleaning', 'industrial laundry'] },
  ],

  tailoring: [
    { value: 'bespoke_tailor',  emoji: '🎩', label: 'Bespoke Tailor',           keywords: ['bespoke tailor', 'made to measure', 'suit tailor', 'custom clothing', 'master tailor'] },
    { value: 'alterations',     emoji: '✂️', label: 'Alterations & Repairs',    keywords: ['alterations', 'clothing repairs', 'hemming', 'taking in', 'zip repair'] },
    { value: 'dressmaker',      emoji: '👗', label: 'Dressmaker',               keywords: ['dressmaker', 'dress making', 'wedding dress', 'prom dress', 'bespoke dress'] },
    { value: 'traditional_garments',emoji:'🪭',label:'Traditional Garments',   keywords: ['traditional clothing', 'cultural garments', 'sari blouse', 'agbada', 'kaftan', 'abaya'] },
    { value: 'embroidery',      emoji: '🪡', label: 'Embroidery & Printing',    keywords: ['embroidery', 'printing', 'custom printing', 'logo embroidery', 'personalised clothing'] },
  ],

  childcare: [
    { value: 'babysitter',      emoji: '👶', label: 'Babysitter',               keywords: ['babysitter', 'babysitting', 'evening babysitter', 'babysitting service'] },
    { value: 'nanny',           emoji: '🧑‍🍼', label: 'Nanny',                  keywords: ['nanny', 'full time nanny', 'live in nanny', 'au pair', 'childcare'] },
    { value: 'childminder',     emoji: '🏡', label: 'Childminder',              keywords: ['childminder', 'registered childminder', 'ofsted childminder', 'home daycare'] },
    { value: 'after_school',    emoji: '🏫', label: 'After School & Holiday Club',keywords: ['after school', 'holiday club', 'breakfast club', 'wraparound care'] },
    { value: 'nursery_daycare', emoji: '🌈', label: 'Nursery & Day Care',       keywords: ['nursery', 'daycare', 'creche', 'preschool', 'toddler group'] },
    { value: 'sen_support',     emoji: '♿', label: 'Special Needs Support',    keywords: ['sen', 'special needs', 'disability support', 'autism', 'learning difficulties'] },
  ],

  eldercare: [
    { value: 'home_carer',      emoji: '🏠', label: 'Home Carer',               keywords: ['home carer', 'care worker', 'domiciliary care', 'home help', 'personal care'] },
    { value: 'live_in_carer',   emoji: '🛏️', label: 'Live-in Carer',            keywords: ['live in carer', 'residential carer', '24 hour care', 'full time carer'] },
    { value: 'companion',       emoji: '🤝', label: 'Companion & Visitor',      keywords: ['companion', 'befriender', 'elderly visitor', 'companion care', 'social visits'] },
    { value: 'dementia_care',   emoji: '🧠', label: 'Dementia Care',            keywords: ['dementia care', 'alzheimers', 'memory care', 'specialist dementia'] },
    { value: 'driver_errands',  emoji: '🚗', label: 'Driver & Errands',         keywords: ['elderly driver', 'hospital transport', 'shopping help', 'errands', 'appointments'] },
  ],

  pet_care: [
    { value: 'dog_walker',      emoji: '🐕', label: 'Dog Walker',               keywords: ['dog walker', 'dog walking', 'dog walk', 'pet walk', 'daily dog walk'] },
    { value: 'pet_sitter',      emoji: '🐾', label: 'Pet Sitter / Boarding',    keywords: ['pet sitter', 'pet sitting', 'pet boarding', 'dog boarding', 'cat sitting'] },
    { value: 'dog_groomer',     emoji: '✂️', label: 'Dog & Cat Groomer',        keywords: ['dog groomer', 'pet grooming', 'dog wash', 'cat grooming', 'mobile groomer'] },
    { value: 'pet_training',    emoji: '🎓', label: 'Pet Training',             keywords: ['dog training', 'puppy training', 'obedience training', 'dog behaviourist'] },
    { value: 'vet_technician',  emoji: '💉', label: 'Veterinary Technician',    keywords: ['vet tech', 'veterinary nurse', 'animal nurse', 'veterinary assistant'] },
  ],

  transport: [
    { value: 'courier',         emoji: '📦', label: 'Courier / Parcel Delivery',keywords: ['courier', 'parcel delivery', 'package delivery', 'same day delivery', 'courier service'] },
    { value: 'food_delivery',   emoji: '🍔', label: 'Food Delivery',            keywords: ['food delivery', 'delivery driver', 'restaurant delivery', 'takeaway delivery'] },
    { value: 'removals',        emoji: '🚛', label: 'Removals & Relocation',    keywords: ['removals', 'moving house', 'man and van', 'relocation', 'storage and removals'] },
    { value: 'taxi_hire',       emoji: '🚖', label: 'Taxi / Private Hire',      keywords: ['taxi', 'private hire', 'minicab', 'uber driver', 'chauffeur', 'cab'] },
    { value: 'man_van',         emoji: '🚐', label: 'Man & Van',                keywords: ['man and van', 'van hire', 'furniture delivery', 'small removals', 'collection'] },
    { value: 'moto_courier',    emoji: '🏍️', label: 'Motorcycle Courier',      keywords: ['motorcycle courier', 'bike courier', 'moto delivery', 'dispatch rider'] },
    { value: 'airport_transfer',emoji: '✈️', label: 'Airport Transfer',        keywords: ['airport transfer', 'airport taxi', 'meet and greet', 'airport pickup'] },
    { value: 'freight_haulage', emoji: '🚜', label: 'Freight & Haulage',        keywords: ['freight', 'haulage', 'lorry driver', 'hgv driver', 'logistics', 'trucking'] },
  ],

  // ── Health & Wellness ────────────────────────────────────────
  healthcare: [
    { value: 'gp_doctor',       emoji: '👨‍⚕️', label: 'Doctor / GP',            keywords: ['doctor', 'gp', 'general practitioner', 'physician', 'medical doctor', 'clinic'] },
    { value: 'nurse',           emoji: '💉', label: 'Nurse',                    keywords: ['nurse', 'nursing', 'registered nurse', 'healthcare assistant', 'community nurse'] },
    { value: 'dentist',         emoji: '🦷', label: 'Dentist',                  keywords: ['dentist', 'dental', 'teeth', 'oral health', 'dental clinic', 'orthodontist'] },
    { value: 'physiotherapist', emoji: '🤸', label: 'Physiotherapist',          keywords: ['physiotherapist', 'physio', 'physiotherapy', 'rehabilitation', 'sports injury'] },
    { value: 'optician',        emoji: '👁️', label: 'Optician / Optometrist',   keywords: ['optician', 'optometrist', 'eye test', 'glasses', 'contact lenses', 'vision'] },
    { value: 'midwife',         emoji: '👶', label: 'Midwife',                  keywords: ['midwife', 'midwifery', 'maternity', 'birth', 'prenatal', 'antenatal'] },
    { value: 'paramedic',       emoji: '🚑', label: 'Paramedic / First Aider',  keywords: ['paramedic', 'first aid', 'emergency', 'ambulance', 'first responder'] },
    { value: 'occupational_therapist',emoji:'🧩',label:'Occupational Therapist',keywords: ['occupational therapy', 'ot', 'rehabilitation', 'daily living', 'disability support'] },
    { value: 'radiographer',    emoji: '🩻', label: 'Radiographer / Radiologist',keywords: ['radiographer', 'x-ray', 'mri', 'radiology', 'imaging', 'ultrasound'] },
    { value: 'surgeon',         emoji: '🏥', label: 'Surgeon / Specialist',     keywords: ['surgeon', 'specialist', 'consultant', 'hospital specialist', 'private specialist'] },
    { value: 'nutritionist',    emoji: '🥗', label: 'Nutritionist / Dietitian', keywords: ['nutritionist', 'dietitian', 'diet plan', 'weight loss', 'nutrition advice', 'healthy eating'] },
    { value: 'speech_therapist',emoji: '🗣️', label: 'Speech & Language Therapist',keywords: ['speech therapist', 'salt', 'speech therapy', 'language therapy', 'stammer'] },
  ],

  beauty: [
    { value: 'hairdresser',     emoji: '💇', label: 'Hairdresser',              keywords: ['hairdresser', 'hair salon', 'haircut', 'hair colour', 'stylist', 'barber'] },
    { value: 'barber',          emoji: '💈', label: 'Barber',                   keywords: ['barber', 'barbershop', 'mens haircut', 'fade', 'shave', 'beard trim'] },
    { value: 'nail_tech',       emoji: '💅', label: 'Nail Technician',          keywords: ['nail tech', 'nails', 'acrylic nails', 'gel nails', 'manicure', 'pedicure'] },
    { value: 'beauty_therapist',emoji: '✨', label: 'Beauty Therapist',         keywords: ['beauty therapist', 'facials', 'body treatments', 'waxing', 'beauty salon'] },
    { value: 'makeup_artist',   emoji: '💄', label: 'Makeup Artist',            keywords: ['makeup artist', 'mua', 'bridal makeup', 'wedding makeup', 'professional makeup'] },
    { value: 'lash_brow',       emoji: '👁️', label: 'Lash & Brow Technician',  keywords: ['lash extensions', 'lashes', 'eyebrows', 'microblading', 'brow lamination', 'henna brows'] },
    { value: 'massage_therapist',emoji:'💆', label: 'Massage Therapist',        keywords: ['massage', 'massage therapist', 'deep tissue', 'swedish massage', 'sports massage'] },
    { value: 'skin_specialist', emoji: '🧴', label: 'Skin Specialist / Aesthetician',keywords: ['skin specialist', 'aesthetician', 'skin treatments', 'chemical peel', 'dermal filler', 'botox'] },
    { value: 'spray_tan',       emoji: '🌅', label: 'Spray Tan',                keywords: ['spray tan', 'tanning', 'fake tan', 'sunbed', 'tanning salon'] },
    { value: 'waxing_threading',emoji: '🪡', label: 'Waxing & Threading',       keywords: ['waxing', 'threading', 'hair removal', 'eyebrow threading', 'full body wax'] },
    { value: 'pmu_tattooist',   emoji: '🎨', label: 'PMU / Tattooist',          keywords: ['tattoo', 'tattooist', 'permanent makeup', 'pmu', 'semi permanent', 'tattoo artist'] },
  ],

  fitness_pt: [
    { value: 'personal_trainer',emoji: '🏋️', label: 'Personal Trainer',        keywords: ['personal trainer', 'pt', 'fitness trainer', 'gym training', 'one to one training'] },
    { value: 'yoga_teacher',    emoji: '🧘', label: 'Yoga Teacher',             keywords: ['yoga teacher', 'yoga instructor', 'yoga class', 'hatha yoga', 'vinyasa', 'hot yoga'] },
    { value: 'pilates_instructor',emoji:'🤸', label:'Pilates Instructor',       keywords: ['pilates', 'pilates instructor', 'reformer pilates', 'mat pilates', 'core strength'] },
    { value: 'group_fitness',   emoji: '👥', label: 'Group Fitness Instructor', keywords: ['group fitness', 'fitness class', 'aerobics', 'zumba', 'bootcamp', 'hiit class'] },
    { value: 'martial_arts',    emoji: '🥊', label: 'Martial Arts Instructor',  keywords: ['martial arts', 'boxing coach', 'karate', 'judo', 'mma', 'kickboxing', 'muay thai'] },
    { value: 'swimming_coach',  emoji: '🏊', label: 'Swimming Coach',           keywords: ['swimming coach', 'swim teacher', 'swimming lessons', 'aqua aerobics'] },
    { value: 'sports_coach',    emoji: '🏆', label: 'Sports Coach',             keywords: ['sports coach', 'football coach', 'athletics coach', 'cricket coach', 'tennis coach'] },
    { value: 'dance_instructor',emoji: '💃', label: 'Dance Instructor',         keywords: ['dance teacher', 'dance instructor', 'ballet', 'salsa', 'ballroom', 'street dance'] },
  ],

  mental_health: [
    { value: 'psychologist',    emoji: '🧠', label: 'Psychologist',             keywords: ['psychologist', 'psychology', 'cognitive therapy', 'mental health support', 'clinical psychologist'] },
    { value: 'counsellor',      emoji: '💬', label: 'Counsellor / Therapist',   keywords: ['counsellor', 'therapist', 'talking therapy', 'counselling', 'psychotherapy'] },
    { value: 'life_coach',      emoji: '🌟', label: 'Life Coach',               keywords: ['life coach', 'life coaching', 'mindset coach', 'personal development'] },
    { value: 'cbt_therapist',   emoji: '🔄', label: 'CBT Therapist',            keywords: ['cbt', 'cognitive behavioural therapy', 'cognitive therapy', 'anxiety treatment'] },
    { value: 'couples_therapist',emoji:'💑', label: 'Couples Therapist',        keywords: ['couples therapy', 'relationship counselling', 'marriage counselling', 'relationship therapist'] },
    { value: 'addiction_counsellor',emoji:'🆘',label:'Addiction Counsellor',    keywords: ['addiction', 'substance abuse', 'recovery', 'alcohol counselling', 'drug counselling'] },
    { value: 'hypnotherapist',  emoji: '🌀', label: 'Hypnotherapist',           keywords: ['hypnotherapy', 'hypnotherapist', 'hypnosis', 'stop smoking', 'phobia treatment'] },
    { value: 'art_music_therapist',emoji:'🎨',label:'Art / Music Therapist',    keywords: ['art therapy', 'music therapy', 'creative therapy', 'expressive therapy'] },
    { value: 'psychiatrist',    emoji: '🏥', label: 'Psychiatrist',             keywords: ['psychiatrist', 'psychiatry', 'mental health medication', 'psychiatric assessment'] },
  ],

  alt_medicine: [
    { value: 'herbalist',       emoji: '🌿', label: 'Herbalist',                keywords: ['herbalist', 'herbal medicine', 'herbs', 'natural remedies', 'plant medicine'] },
    { value: 'traditional_healer',emoji:'🌍',label: 'Traditional Healer',       keywords: ['traditional healer', 'sangoma', 'shaman', 'indigenous medicine', 'spiritual healing'] },
    { value: 'acupuncturist',   emoji: '📍', label: 'Acupuncturist',            keywords: ['acupuncture', 'acupuncturist', 'needles', 'tcm', 'traditional chinese medicine'] },
    { value: 'ayurvedic',       emoji: '🪷', label: 'Ayurvedic Practitioner',   keywords: ['ayurveda', 'ayurvedic', 'indian medicine', 'dosha', 'panchakarma'] },
    { value: 'homeopath',       emoji: '💧', label: 'Homeopath',                keywords: ['homeopathy', 'homeopath', 'natural health', 'homeopathic remedies'] },
    { value: 'chiropractor',    emoji: '🦴', label: 'Chiropractor',             keywords: ['chiropractor', 'chiropractic', 'spine', 'back pain', 'neck pain', 'adjustment'] },
    { value: 'osteopath',       emoji: '🤲', label: 'Osteopath',                keywords: ['osteopath', 'osteopathy', 'musculoskeletal', 'joint pain', 'back treatment'] },
    { value: 'reflexologist',   emoji: '🦶', label: 'Reflexologist',            keywords: ['reflexology', 'foot massage', 'zone therapy', 'pressure points'] },
    { value: 'reiki',           emoji: '✨', label: 'Reiki Practitioner',        keywords: ['reiki', 'energy healing', 'chakra', 'spiritual healing', 'healing touch'] },
  ],

  veterinary: [
    { value: 'vet',             emoji: '🐾', label: 'Veterinarian',             keywords: ['vet', 'veterinarian', 'animal doctor', 'small animal vet', 'veterinary clinic'] },
    { value: 'vet_nurse',       emoji: '💉', label: 'Veterinary Nurse',         keywords: ['vet nurse', 'veterinary nurse', 'rvn', 'animal nurse', 'vet technician'] },
    { value: 'livestock_vet',   emoji: '🐄', label: 'Livestock Vet',            keywords: ['livestock vet', 'farm vet', 'large animal vet', 'cattle vet', 'equine vet'] },
    { value: 'exotic_vet',      emoji: '🦎', label: 'Exotic Animal Specialist', keywords: ['exotic vet', 'reptile vet', 'bird vet', 'exotic animals', 'zoo vet'] },
    { value: 'animal_physio',   emoji: '🤸', label: 'Animal Physiotherapist',   keywords: ['animal physio', 'canine physio', 'equine physio', 'animal rehabilitation'] },
  ],

  pharmacy: [
    { value: 'pharmacist',      emoji: '💊', label: 'Pharmacist',               keywords: ['pharmacist', 'pharmacy', 'dispensing', 'prescriptions', 'medications', 'chemist'] },
    { value: 'supplement_supplier',emoji:'🥗',label:'Supplement & Nutrition Supplier',keywords: ['supplements', 'vitamins', 'protein powder', 'health supplements', 'nutrition'] },
    { value: 'herbal_medicine_shop',emoji:'🌿',label:'Herbal Medicine Shop',    keywords: ['herbal shop', 'health store', 'herbal remedies', 'natural health', 'health food shop'] },
  ],

  // ── Food, Hospitality & Events ───────────────────────────────
  catering: [
    { value: 'private_chef',    emoji: '👨‍🍳', label: 'Private Chef',            keywords: ['private chef', 'personal chef', 'chef for hire', 'dinner party chef', 'home chef'] },
    { value: 'catering_company',emoji: '🍽️', label: 'Catering Company',        keywords: ['catering', 'catering company', 'event catering', 'outside catering', 'buffet'] },
    { value: 'wedding_caterer', emoji: '💒', label: 'Wedding Caterer',          keywords: ['wedding catering', 'wedding food', 'wedding caterer', 'wedding buffet'] },
    { value: 'corporate_catering',emoji:'💼',label: 'Corporate Catering',       keywords: ['corporate catering', 'office catering', 'business lunch', 'boardroom catering'] },
    { value: 'street_food',     emoji: '🚐', label: 'Street Food / Food Truck', keywords: ['street food', 'food truck', 'mobile catering', 'food van', 'pop up food'] },
    { value: 'meal_prep',       emoji: '🥡', label: 'Meal Prep Service',        keywords: ['meal prep', 'meal planning', 'healthy meals', 'batch cooking', 'meal delivery'] },
    { value: 'bespoke_cakes',   emoji: '🎂', label: 'Bespoke Cakes & Pastry',   keywords: ['cake maker', 'bespoke cakes', 'wedding cake', 'birthday cake', 'pastry chef'] },
  ],

  restaurant: [
    { value: 'restaurant_owner',emoji: '🍴', label: 'Restaurant',              keywords: ['restaurant', 'dining', 'sit down restaurant', 'full service restaurant'] },
    { value: 'cafe_owner',      emoji: '☕', label: 'Café / Coffee Shop',       keywords: ['cafe', 'coffee shop', 'coffee house', 'brunch', 'breakfast cafe'] },
    { value: 'fast_food',       emoji: '🍔', label: 'Fast Food',                keywords: ['fast food', 'burger', 'chips', 'fried chicken', 'quick service'] },
    { value: 'takeaway',        emoji: '📦', label: 'Takeaway / Delivery',      keywords: ['takeaway', 'delivery', 'just eat', 'deliveroo', 'order online'] },
    { value: 'bakery_patisserie',emoji:'🥐', label: 'Bakery & Patisserie',      keywords: ['bakery', 'patisserie', 'croissants', 'pastries', 'artisan bread'] },
    { value: 'dessert_parlour', emoji: '🍦', label: 'Dessert Parlour / Ice Cream',keywords: ['ice cream', 'desserts', 'waffle', 'milkshake', 'crepe', 'sundae'] },
    { value: 'vegan_vegetarian',emoji: '🥑', label: 'Vegan / Vegetarian',       keywords: ['vegan', 'vegetarian', 'plant based', 'vegan restaurant', 'meat free'] },
    { value: 'fine_dining',     emoji: '🌟', label: 'Fine Dining',              keywords: ['fine dining', 'michelin', 'tasting menu', 'fine restaurant', 'gourmet'] },
    { value: 'juice_health_bar',emoji: '🥤', label: 'Juice Bar / Health Food',  keywords: ['juice bar', 'smoothies', 'health food', 'acai', 'protein shakes', 'healthy cafe'] },
  ],

  hotel_accom: [
    { value: 'hotel',           emoji: '🏨', label: 'Hotel',                    keywords: ['hotel', 'hotel rooms', 'hotel booking', 'accommodation', 'lodging'] },
    { value: 'guesthouse_bnb',  emoji: '🏡', label: 'Guesthouse / B&B',        keywords: ['guesthouse', 'bed and breakfast', 'bnb', 'b&b', 'guest house'] },
    { value: 'hostel',          emoji: '🛏️', label: 'Hostel',                  keywords: ['hostel', 'backpacker', 'dormitory', 'budget accommodation'] },
    { value: 'airbnb_selfcater',emoji: '🔑', label: 'Self-Catering / Airbnb',  keywords: ['airbnb', 'self catering', 'holiday home', 'vacation rental', 'serviced apartment'] },
    { value: 'camping_glamping',emoji: '⛺', label: 'Camping & Glamping',       keywords: ['camping', 'glamping', 'campsite', 'bell tent', 'luxury camping'] },
    { value: 'boutique_hotel',  emoji: '✨', label: 'Boutique / Luxury Hotel',  keywords: ['boutique hotel', 'luxury hotel', '5 star', 'resort', 'spa hotel'] },
  ],

  tourism_guide: [
    { value: 'city_tour_guide', emoji: '🗺️', label: 'City Tour Guide',          keywords: ['city tour', 'tour guide', 'sightseeing', 'walking tour', 'guided tour'] },
    { value: 'food_tour',       emoji: '🍽️', label: 'Food Tour Guide',         keywords: ['food tour', 'culinary tour', 'foodie tour', 'street food tour'] },
    { value: 'adventure_guide', emoji: '🏔️', label: 'Adventure Tour Guide',    keywords: ['adventure guide', 'trekking guide', 'hiking guide', 'mountain guide'] },
    { value: 'cultural_guide',  emoji: '🏛️', label: 'Cultural & Heritage Guide',keywords: ['cultural tour', 'heritage guide', 'history tour', 'museum guide', 'art tour'] },
    { value: 'wildlife_guide',  emoji: '🦁', label: 'Wildlife & Safari Guide',  keywords: ['safari guide', 'wildlife guide', 'game ranger', 'nature guide', 'birdwatching'] },
    { value: 'boat_trip',       emoji: '⛵', label: 'Boat Trip Operator',       keywords: ['boat trip', 'boat tour', 'sailing', 'cruise', 'snorkelling', 'diving'] },
    { value: 'private_driver',  emoji: '🚗', label: 'Private Driver / Chauffeur',keywords: ['private driver', 'chauffeur', 'tour driver', 'day driver', 'airport driver'] },
  ],

  event_planning: [
    { value: 'wedding_planner', emoji: '💒', label: 'Wedding Planner',          keywords: ['wedding planner', 'wedding organiser', 'wedding coordinator', 'wedding planning'] },
    { value: 'corporate_events',emoji: '💼', label: 'Corporate Event Planner',  keywords: ['corporate events', 'conference organiser', 'team building', 'awards ceremony'] },
    { value: 'birthday_parties',emoji: '🎂', label: 'Birthday & Party Planner', keywords: ['party planner', 'birthday party', 'kids party', 'party organiser'] },
    { value: 'dj_entertainment',emoji: '🎧', label: 'DJ & Entertainment',       keywords: ['dj', 'wedding dj', 'party dj', 'entertainment', 'live band', 'karaoke'] },
    { value: 'florist',         emoji: '💐', label: 'Florist',                  keywords: ['florist', 'flowers', 'wedding flowers', 'floral arrangements', 'bouquets'] },
    { value: 'event_photographer',emoji:'📸',label: 'Event Photographer',       keywords: ['event photographer', 'wedding photographer', 'party photographer', 'photo booth'] },
    { value: 'mc_host',         emoji: '🎤', label: 'MC / Host',                keywords: ['mc', 'master of ceremonies', 'event host', 'wedding mc', 'party host'] },
    { value: 'venue_hire',      emoji: '🏛️', label: 'Venue Hire',               keywords: ['venue hire', 'event venue', 'party venue', 'function room', 'hall hire'] },
  ],

  bar_nightclub: [
    { value: 'bar_owner',       emoji: '🍺', label: 'Bar / Pub',                keywords: ['bar', 'pub', 'drinks', 'local pub', 'sports bar', 'craft beer'] },
    { value: 'nightclub',       emoji: '🕺', label: 'Nightclub',                keywords: ['nightclub', 'club night', 'dance club', 'rave', 'club venue'] },
    { value: 'cocktail_bar',    emoji: '🍸', label: 'Cocktail Bar',             keywords: ['cocktail bar', 'cocktails', 'mixologist', 'speakeasy', 'craft cocktails'] },
    { value: 'wine_bar',        emoji: '🍷', label: 'Wine Bar',                 keywords: ['wine bar', 'wine', 'sommelier', 'wine tasting', 'vineyard'] },
    { value: 'rooftop_bar',     emoji: '🌆', label: 'Rooftop / Terrace Bar',    keywords: ['rooftop bar', 'terrace bar', 'outdoor bar', 'sky bar'] },
    { value: 'karaoke_bar',     emoji: '🎤', label: 'Karaoke Bar',              keywords: ['karaoke', 'karaoke bar', 'singing', 'private karaoke room'] },
  ],

  // ── Creative & Media ─────────────────────────────────────────
  creative: [
    { value: 'photographer',    emoji: '📷', label: 'Photographer',             keywords: ['photographer', 'photography', 'portrait', 'commercial photography', 'event photography'] },
    { value: 'videographer',    emoji: '🎬', label: 'Videographer / Filmmaker', keywords: ['videographer', 'filmmaker', 'video production', 'drone footage', 'documentary'] },
    { value: 'graphic_designer',emoji: '🎨', label: 'Graphic Designer',        keywords: ['graphic designer', 'design', 'branding', 'logo design', 'print design'] },
    { value: 'web_designer',    emoji: '💻', label: 'Web Designer / UI Designer',keywords: ['web designer', 'ui designer', 'ux designer', 'website design', 'app design'] },
    { value: 'motion_designer', emoji: '✨', label: 'Motion Designer / Animator',keywords: ['motion graphics', 'animator', 'animation', '3d animation', 'after effects'] },
    { value: 'product_photographer',emoji:'📦',label:'Product Photographer',   keywords: ['product photography', 'e-commerce photography', 'lifestyle photography', 'food photography'] },
    { value: 'wedding_photo_video',emoji:'💒',label:'Wedding Photographer & Videographer',keywords: ['wedding photographer', 'wedding videographer', 'wedding films', 'bridal photography'] },
  ],

  content_creator: [
    { value: 'social_media_influencer',emoji:'📲',label:'Social Media Influencer',keywords: ['influencer', 'social media', 'instagram', 'tiktok', 'brand deals', 'sponsored'] },
    { value: 'youtuber',        emoji: '▶️', label: 'YouTuber',                keywords: ['youtube', 'youtuber', 'youtube channel', 'content creator', 'vlogger'] },
    { value: 'tiktoker',        emoji: '🎵', label: 'TikToker',                 keywords: ['tiktok', 'tiktoker', 'tiktok creator', 'short video', 'viral content'] },
    { value: 'podcaster',       emoji: '🎙️', label: 'Podcaster',               keywords: ['podcast', 'podcaster', 'podcast host', 'audio content', 'interview podcast'] },
    { value: 'blogger',         emoji: '✍️', label: 'Blogger',                 keywords: ['blogger', 'blog', 'travel blog', 'food blog', 'lifestyle blog', 'content'] },
    { value: 'streamer',        emoji: '🎮', label: 'Live Streamer / Twitch',   keywords: ['streamer', 'twitch', 'live streaming', 'gaming stream', 'livestream'] },
    { value: 'brand_ambassador',emoji: '⭐', label: 'Brand Ambassador',         keywords: ['brand ambassador', 'brand rep', 'ambassador', 'promoter', 'brand promotion'] },
  ],

  music_perform: [
    { value: 'singer_vocalist', emoji: '🎤', label: 'Singer / Vocalist',        keywords: ['singer', 'vocalist', 'solo artist', 'singer songwriter', 'session singer'] },
    { value: 'musician',        emoji: '🎸', label: 'Musician / Instrumentalist',keywords: ['musician', 'guitarist', 'pianist', 'drummer', 'bassist', 'violinist'] },
    { value: 'dj',              emoji: '🎧', label: 'DJ',                       keywords: ['dj', 'disc jockey', 'wedding dj', 'club dj', 'festival dj', 'mobile dj'] },
    { value: 'music_producer',  emoji: '🎛️', label: 'Music Producer / Beatmaker',keywords: ['music producer', 'producer', 'beatmaker', 'studio producer', 'beat production'] },
    { value: 'band',            emoji: '🎶', label: 'Band',                     keywords: ['band', 'live band', 'function band', 'wedding band', 'cover band', 'jazz band'] },
    { value: 'rapper_mc',       emoji: '🎤', label: 'Rapper / MC',              keywords: ['rapper', 'mc', 'hip hop', 'grime', 'rap artist', 'freestyler'] },
    { value: 'dancer_choreographer',emoji:'💃',label:'Dancer / Choreographer',  keywords: ['dancer', 'choreographer', 'dance', 'dance performer', 'ballet dancer', 'street dancer'] },
    { value: 'spoken_word',     emoji: '📜', label: 'Spoken Word / Poet',       keywords: ['spoken word', 'poet', 'poetry', 'slam poetry', 'performance poetry'] },
    { value: 'voice_actor',     emoji: '🎙️', label: 'Voice Actor / Narrator',  keywords: ['voice actor', 'voice over', 'narrator', 'voiceover artist', 'dubbing'] },
  ],

  writing: [
    { value: 'journalist',      emoji: '📰', label: 'Journalist / Reporter',    keywords: ['journalist', 'reporter', 'news writer', 'press', 'media', 'editorial'] },
    { value: 'copywriter',      emoji: '✍️', label: 'Copywriter',               keywords: ['copywriter', 'copywriting', 'ad copy', 'marketing copy', 'brand writing'] },
    { value: 'content_writer',  emoji: '💻', label: 'Content Writer / SEO',     keywords: ['content writer', 'seo writer', 'blog writer', 'web content', 'article writing'] },
    { value: 'scriptwriter',    emoji: '🎬', label: 'Scriptwriter / Screenwriter',keywords: ['scriptwriter', 'screenwriter', 'screenplay', 'script', 'film writing'] },
    { value: 'author_novelist', emoji: '📚', label: 'Author / Novelist',        keywords: ['author', 'novelist', 'book writer', 'fiction writer', 'self published'] },
    { value: 'translator',      emoji: '🌐', label: 'Translator / Interpreter', keywords: ['translator', 'interpreter', 'translation', 'localization', 'language services'] },
    { value: 'proofreader',     emoji: '🔍', label: 'Proofreader / Editor',     keywords: ['proofreader', 'editor', 'proofreading', 'editing', 'manuscript editing'] },
    { value: 'technical_writer',emoji: '⚙️', label: 'Technical Writer',         keywords: ['technical writer', 'technical writing', 'user manual', 'documentation', 'user guide'] },
  ],

  fashion_design: [
    { value: 'fashion_designer',emoji: '👗', label: 'Fashion Designer',         keywords: ['fashion designer', 'clothing designer', 'fashion design', 'ready to wear', 'couture'] },
    { value: 'personal_stylist',emoji: '✨', label: 'Personal Stylist',         keywords: ['personal stylist', 'image consultant', 'wardrobe stylist', 'fashion stylist'] },
    { value: 'personal_shopper',emoji: '🛍️', label: 'Personal Shopper',        keywords: ['personal shopper', 'shopping service', 'fashion shopping', 'wardrobe help'] },
    { value: 'costume_designer',emoji: '🎭', label: 'Costume Designer',         keywords: ['costume designer', 'film costumes', 'theatre costume', 'costume maker'] },
    { value: 'textile_designer',emoji: '🪡', label: 'Textile Designer',         keywords: ['textile designer', 'fabric design', 'pattern design', 'print design', 'fabric maker'] },
  ],

  art_craft: [
    { value: 'fine_artist',     emoji: '🖼️', label: 'Fine Artist / Painter',    keywords: ['fine artist', 'painter', 'oil painting', 'watercolour', 'acrylic', 'canvas art'] },
    { value: 'sculptor',        emoji: '🗿', label: 'Sculptor',                 keywords: ['sculptor', 'sculpture', 'carving', '3d art', 'clay sculpture', 'metal sculpture'] },
    { value: 'ceramicist',      emoji: '🏺', label: 'Ceramicist / Potter',       keywords: ['ceramicist', 'pottery', 'ceramic artist', 'potter', 'kiln', 'hand thrown'] },
    { value: 'jewellery_maker', emoji: '💍', label: 'Jewellery Maker',           keywords: ['jewellery maker', 'jeweller', 'handmade jewellery', 'bespoke jewellery', 'silversmith'] },
    { value: 'candle_soap',     emoji: '🕯️', label: 'Candle & Soap Maker',      keywords: ['candle maker', 'soap maker', 'handmade candles', 'soy candles', 'natural soap'] },
    { value: 'woodcarver',      emoji: '🪵', label: 'Wood Carver / Woodworker', keywords: ['woodcarver', 'woodworker', 'wood art', 'wooden crafts', 'whittling'] },
    { value: 'leather_worker',  emoji: '👜', label: 'Leather Worker',           keywords: ['leather worker', 'leather craft', 'leather goods', 'leather bags', 'leather belts'] },
    { value: 'printmaker',      emoji: '🖨️', label: 'Printmaker',               keywords: ['printmaker', 'screen printing', 'linocut', 'etching', 'block printing'] },
    { value: 'textile_artist',  emoji: '🪡', label: 'Textile Artist / Weaver',  keywords: ['textile artist', 'weaver', 'knitting', 'crochet', 'embroidery', 'quilting'] },
  ],

  // ── Professional & Business ──────────────────────────────────
  business: [
    { value: 'entrepreneur',    emoji: '🚀', label: 'Entrepreneur / Founder',   keywords: ['entrepreneur', 'founder', 'startup', 'business owner', 'ceo', 'md'] },
    { value: 'sales_director',  emoji: '📈', label: 'Sales Director / Manager', keywords: ['sales director', 'sales manager', 'head of sales', 'commercial director'] },
    { value: 'operations_manager',emoji:'⚙️',label: 'Operations Manager',      keywords: ['operations manager', 'ops manager', 'operations director', 'coo'] },
    { value: 'investor',        emoji: '💰', label: 'Investor / VC',            keywords: ['investor', 'venture capital', 'angel investor', 'vc', 'private equity', 'funding'] },
    { value: 'business_dev',    emoji: '🤝', label: 'Business Development',     keywords: ['business development', 'bd', 'partnerships', 'growth', 'expansion'] },
    { value: 'chairman_nxd',    emoji: '🏛️', label: 'Chairman / Non-Exec',     keywords: ['chairman', 'non executive director', 'nxd', 'board member', 'advisor'] },
    { value: 'franchise_owner', emoji: '🏪', label: 'Franchise Owner',          keywords: ['franchise', 'franchise owner', 'franchisee', 'franchisor'] },
  ],

  technology: [
    { value: 'software_engineer',emoji:'💻', label: 'Software Engineer / Developer',keywords: ['software engineer', 'developer', 'programmer', 'coder', 'software development'] },
    { value: 'web_developer',   emoji: '🌐', label: 'Web Developer',            keywords: ['web developer', 'frontend', 'backend', 'full stack', 'web development'] },
    { value: 'mobile_developer',emoji: '📱', label: 'Mobile App Developer',     keywords: ['app developer', 'ios developer', 'android developer', 'mobile development', 'react native'] },
    { value: 'data_scientist',  emoji: '📊', label: 'Data Scientist / Analyst', keywords: ['data scientist', 'data analyst', 'data engineer', 'machine learning', 'analytics'] },
    { value: 'ai_ml_engineer',  emoji: '🤖', label: 'AI / Machine Learning Engineer',keywords: ['ai engineer', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning'] },
    { value: 'cybersecurity',   emoji: '🛡️', label: 'Cybersecurity Specialist', keywords: ['cybersecurity', 'security engineer', 'ethical hacker', 'pen tester', 'infosec'] },
    { value: 'devops_cloud',    emoji: '☁️', label: 'DevOps / Cloud Engineer',  keywords: ['devops', 'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'infrastructure'] },
    { value: 'product_manager', emoji: '📋', label: 'Product Manager',          keywords: ['product manager', 'pm', 'product owner', 'product development', 'roadmap'] },
    { value: 'it_support',      emoji: '🖥️', label: 'IT Support / Systems Admin',keywords: ['it support', 'helpdesk', 'sysadmin', 'systems administrator', 'network admin'] },
    { value: 'blockchain_web3', emoji: '⛓️', label: 'Blockchain / Web3 Developer',keywords: ['blockchain', 'web3', 'crypto developer', 'smart contracts', 'solidity', 'nft'] },
    { value: 'qa_tester',       emoji: '🔍', label: 'QA / Test Engineer',       keywords: ['qa', 'quality assurance', 'software testing', 'test engineer', 'automation testing'] },
  ],

  legal: [
    { value: 'solicitor',       emoji: '⚖️', label: 'Solicitor / Lawyer',       keywords: ['solicitor', 'lawyer', 'legal advice', 'law firm', 'legal services'] },
    { value: 'barrister',       emoji: '🎓', label: 'Barrister / Advocate',     keywords: ['barrister', 'advocate', 'court', 'chambers', 'litigation', 'criminal barrister'] },
    { value: 'accountant',      emoji: '📊', label: 'Accountant',               keywords: ['accountant', 'accounting', 'bookkeeper', 'tax accountant', 'chartered accountant'] },
    { value: 'financial_advisor',emoji:'💷', label: 'Financial Advisor / IFA',  keywords: ['financial advisor', 'ifa', 'financial planning', 'pensions', 'investments'] },
    { value: 'tax_specialist',  emoji: '🧾', label: 'Tax Specialist',           keywords: ['tax specialist', 'tax advisor', 'vat', 'corporation tax', 'self assessment'] },
    { value: 'auditor',         emoji: '🔍', label: 'Auditor',                  keywords: ['auditor', 'audit', 'internal audit', 'external audit', 'compliance'] },
    { value: 'insurance_broker',emoji: '🛡️', label: 'Insurance Broker',        keywords: ['insurance broker', 'insurance advisor', 'commercial insurance', 'life insurance'] },
    { value: 'mortgage_advisor',emoji: '🏠', label: 'Mortgage Advisor',         keywords: ['mortgage advisor', 'mortgage broker', 'home loans', 'remortgage', 'first time buyer'] },
    { value: 'notary',          emoji: '📝', label: 'Notary / Commissioner',    keywords: ['notary', 'notarial', 'apostille', 'certified documents', 'commissioner of oaths'] },
    { value: 'paralegal',       emoji: '📋', label: 'Paralegal / Legal Assistant',keywords: ['paralegal', 'legal assistant', 'legal secretary', 'legal support'] },
  ],

  engineering: [
    { value: 'civil_engineer',  emoji: '🏗️', label: 'Civil Engineer',          keywords: ['civil engineer', 'civil engineering', 'infrastructure', 'roads', 'bridges'] },
    { value: 'structural_engineer',emoji:'🏛️',label:'Structural Engineer',     keywords: ['structural engineer', 'structural engineering', 'buildings', 'foundations', 'calculations'] },
    { value: 'mechanical_engineer',emoji:'⚙️',label:'Mechanical Engineer',     keywords: ['mechanical engineer', 'mechanical engineering', 'machinery', 'manufacturing engineering'] },
    { value: 'electrical_engineer',emoji:'⚡',label:'Electrical Engineer',     keywords: ['electrical engineer', 'power systems', 'electrical design', 'control systems'] },
    { value: 'chemical_engineer',emoji: '🧪', label: 'Chemical Engineer',      keywords: ['chemical engineer', 'chemical engineering', 'process engineering', 'refinery'] },
    { value: 'architect',       emoji: '📐', label: 'Architect',                keywords: ['architect', 'architecture', 'building design', 'planning', 'arb'] },
    { value: 'interior_designer',emoji:'🛋️', label: 'Interior Designer',       keywords: ['interior designer', 'interior design', 'space planning', 'interior decoration'] },
    { value: 'urban_planner',   emoji: '🏙️', label: 'Urban Planner',           keywords: ['urban planner', 'town planner', 'planning consultant', 'planning permission'] },
    { value: 'aerospace_engineer',emoji:'✈️',label: 'Aerospace Engineer',      keywords: ['aerospace', 'aviation engineer', 'aircraft', 'aerospace engineering'] },
    { value: 'petroleum_engineer',emoji:'⛽',label: 'Petroleum / Oil & Gas Engineer',keywords: ['petroleum engineer', 'oil and gas', 'upstream', 'drilling engineer', 'reservoir'] },
    { value: 'environmental_engineer',emoji:'🌱',label:'Environmental Engineer',keywords: ['environmental engineer', 'sustainability', 'environmental impact', 'waste management'] },
    { value: 'marine_engineer', emoji: '⛵', label: 'Marine Engineer',          keywords: ['marine engineer', 'naval architecture', 'shipping', 'offshore engineer'] },
  ],

  sales_leads: [
    { value: 'sales_rep',       emoji: '📈', label: 'Sales Representative',     keywords: ['sales rep', 'sales representative', 'field sales', 'b2b sales', 'account manager'] },
    { value: 'telesales',       emoji: '📞', label: 'Telesales / Telemarketing',keywords: ['telesales', 'telemarketing', 'cold calling', 'outbound sales', 'inside sales'] },
    { value: 'business_dev_mgr',emoji: '🤝', label: 'Business Development Manager',keywords: ['business development', 'bdm', 'new business', 'pipeline', 'lead generation'] },
    { value: 'territory_manager',emoji:'🗺️', label: 'Territory Manager',        keywords: ['territory manager', 'area manager', 'regional sales', 'territory sales'] },
    { value: 'retail_sales',    emoji: '🏪', label: 'Retail Sales',             keywords: ['retail sales', 'shop assistant', 'retail associate', 'customer service', 'floor sales'] },
  ],

  consulting: [
    { value: 'management_consultant',emoji:'💼',label:'Management Consultant',  keywords: ['management consultant', 'strategy consultant', 'mckinsey', 'deloitte', 'big 4'] },
    { value: 'hr_consultant',   emoji: '👥', label: 'HR Consultant',            keywords: ['hr consultant', 'human resources', 'people consultant', 'talent consultant'] },
    { value: 'it_consultant',   emoji: '💻', label: 'IT Consultant',            keywords: ['it consultant', 'technology consultant', 'digital transformation', 'it advisory'] },
    { value: 'financial_consultant',emoji:'💷',label:'Financial Consultant',    keywords: ['financial consultant', 'cfo services', 'finance advisory', 'fractional cfo'] },
    { value: 'operations_consultant',emoji:'⚙️',label:'Operations Consultant', keywords: ['operations consultant', 'process improvement', 'lean', 'six sigma', 'efficiency'] },
    { value: 'brand_consultant',emoji: '🎨', label: 'Brand Consultant',         keywords: ['brand consultant', 'brand strategy', 'brand identity', 'rebranding'] },
    { value: 'sustainability_consultant',emoji:'🌱',label:'Sustainability Consultant',keywords: ['sustainability consultant', 'esg', 'carbon footprint', 'net zero', 'green consultant'] },
  ],

  real_estate: [
    { value: 'estate_agent',    emoji: '🏡', label: 'Estate Agent / Realtor',   keywords: ['estate agent', 'realtor', 'property agent', 'house sales', 'letting agent'] },
    { value: 'property_developer',emoji:'🏗️',label:'Property Developer',       keywords: ['property developer', 'development', 'house builder', 'property investment'] },
    { value: 'property_manager',emoji: '🔑', label: 'Property Manager',         keywords: ['property manager', 'letting management', 'property management', 'landlord services'] },
    { value: 'property_investor',emoji:'💰', label: 'Property Investor',        keywords: ['property investor', 'buy to let', 'investment property', 'hmo investor', 'flipping'] },
    { value: 'land_surveyor',   emoji: '📐', label: 'Land Surveyor / Valuer',   keywords: ['land surveyor', 'valuer', 'rics surveyor', 'property valuation', 'homebuyers report'] },
    { value: 'commercial_agent',emoji: '🏢', label: 'Commercial Property Agent',keywords: ['commercial agent', 'commercial property', 'retail units', 'office agent', 'industrial units'] },
  ],

  marketing: [
    { value: 'digital_marketer',emoji: '📲', label: 'Digital Marketer',        keywords: ['digital marketer', 'digital marketing', 'ppc', 'paid ads', 'google ads', 'facebook ads'] },
    { value: 'seo_specialist',  emoji: '🔍', label: 'SEO Specialist',           keywords: ['seo', 'search engine optimisation', 'organic search', 'keyword research', 'backlinks'] },
    { value: 'social_media_mgr',emoji: '📱', label: 'Social Media Manager',     keywords: ['social media manager', 'instagram manager', 'social media marketing', 'community manager'] },
    { value: 'brand_manager',   emoji: '⭐', label: 'Brand Manager',            keywords: ['brand manager', 'brand marketing', 'brand strategy', 'brand identity'] },
    { value: 'pr_communications',emoji:'📣', label: 'PR & Communications',      keywords: ['pr', 'public relations', 'communications', 'press office', 'media relations'] },
    { value: 'email_marketer',  emoji: '📧', label: 'Email Marketer',           keywords: ['email marketing', 'email campaigns', 'crm', 'mailchimp', 'klaviyo', 'newsletter'] },
    { value: 'growth_hacker',   emoji: '🚀', label: 'Growth Marketer',          keywords: ['growth hacker', 'growth marketer', 'user acquisition', 'viral growth', 'funnel'] },
    { value: 'market_researcher',emoji:'📊', label: 'Market Researcher',        keywords: ['market research', 'consumer insights', 'focus groups', 'surveys', 'data analysis'] },
  ],

  media_pro: [
    { value: 'journalist_tv',   emoji: '📺', label: 'TV Journalist / Reporter', keywords: ['tv journalist', 'news reporter', 'broadcast journalist', 'tv presenter', 'news anchor'] },
    { value: 'radio_presenter', emoji: '📻', label: 'Radio Presenter / DJ',     keywords: ['radio presenter', 'radio dj', 'radio host', 'on air presenter', 'broadcaster'] },
    { value: 'tv_producer',     emoji: '🎬', label: 'TV / Film Producer',       keywords: ['tv producer', 'film producer', 'production company', 'executive producer'] },
    { value: 'documentary',     emoji: '🎥', label: 'Documentary Maker',        keywords: ['documentary', 'documentary maker', 'factual content', 'documentary filmmaker'] },
    { value: 'magazine_editor', emoji: '📰', label: 'Magazine / Newspaper Editor',keywords: ['editor', 'magazine editor', 'newspaper editor', 'editorial director', 'sub editor'] },
    { value: 'media_buyer',     emoji: '📊', label: 'Media Buyer / Planner',    keywords: ['media buyer', 'media planner', 'advertising buying', 'programmatic', 'media agency'] },
  ],

  // ── Work & Employment ────────────────────────────────────────
  job_seeker: [
    { value: 'seek_hospitality',emoji: '🍽️', label: 'Hospitality & Catering',   keywords: ['hospitality jobs', 'hotel jobs', 'restaurant work', 'chef jobs', 'waiting staff'] },
    { value: 'seek_retail',     emoji: '🛍️', label: 'Retail & Customer Service',keywords: ['retail jobs', 'shop work', 'customer service', 'sales assistant jobs'] },
    { value: 'seek_construction',emoji:'🔧', label: 'Construction & Trades',    keywords: ['construction jobs', 'trade jobs', 'labour', 'site work', 'skilled trades'] },
    { value: 'seek_technology', emoji: '💻', label: 'Technology & IT',          keywords: ['tech jobs', 'it jobs', 'developer jobs', 'software jobs', 'it positions'] },
    { value: 'seek_healthcare', emoji: '🏥', label: 'Healthcare',               keywords: ['healthcare jobs', 'nhs jobs', 'nursing jobs', 'care worker jobs', 'medical jobs'] },
    { value: 'seek_education',  emoji: '📚', label: 'Education',                keywords: ['teaching jobs', 'teacher vacancy', 'education jobs', 'school jobs', 'tutor jobs'] },
    { value: 'seek_finance',    emoji: '💷', label: 'Finance & Accounting',     keywords: ['finance jobs', 'accounting jobs', 'accounts jobs', 'bookkeeping jobs'] },
    { value: 'seek_manufacturing',emoji:'🏭',label: 'Manufacturing & Warehouse', keywords: ['factory jobs', 'warehouse jobs', 'production jobs', 'forklift jobs', 'packing jobs'] },
    { value: 'seek_transport',  emoji: '🚛', label: 'Transport & Logistics',    keywords: ['driver jobs', 'hgv jobs', 'logistics jobs', 'delivery jobs', 'courier jobs'] },
    { value: 'seek_domestic',   emoji: '🏠', label: 'Domestic & Household',     keywords: ['domestic work', 'cleaning jobs', 'housekeeper jobs', 'carer jobs', 'nanny jobs'] },
    { value: 'seek_creative',   emoji: '🎨', label: 'Creative & Media',         keywords: ['creative jobs', 'design jobs', 'media jobs', 'marketing jobs', 'pr jobs'] },
    { value: 'seek_any',        emoji: '🔍', label: 'Any / Open to All',        keywords: ['any job', 'open to work', 'all industries', 'flexible', 'any position'] },
  ],

  hiring: [
    { value: 'recruiter_agency',emoji: '🏢', label: 'Recruitment Agency',       keywords: ['recruiter', 'recruitment agency', 'staffing agency', 'headhunter', 'talent acquisition'] },
    { value: 'hr_manager',      emoji: '👥', label: 'HR Manager / Director',    keywords: ['hr manager', 'human resources', 'people manager', 'hr director', 'talent manager'] },
    { value: 'small_business_hiring',emoji:'🏪',label:'Small Business Hiring',  keywords: ['small business jobs', 'local jobs', 'sme hiring', 'local employer', 'part time'] },
    { value: 'temp_contract',   emoji: '📋', label: 'Temporary & Contract',     keywords: ['temp work', 'contract work', 'temporary jobs', 'contract roles', 'seasonal work'] },
    { value: 'graduate_recruitment',emoji:'🎓',label:'Graduate Recruitment',    keywords: ['graduate scheme', 'graduate jobs', 'graduate recruitment', 'entry level', 'trainee'] },
    { value: 'executive_search',emoji: '🔭', label: 'Executive Search',         keywords: ['executive search', 'c-suite hiring', 'senior roles', 'leadership hiring', 'headhunting'] },
  ],

  freelance: [
    { value: 'freelance_tech',  emoji: '💻', label: 'Tech & Development',       keywords: ['freelance developer', 'contract developer', 'freelance engineer', 'contract tech'] },
    { value: 'freelance_design',emoji: '🎨', label: 'Design & Creative',        keywords: ['freelance designer', 'contract designer', 'freelance creative', 'design work'] },
    { value: 'freelance_writing',emoji:'✍️', label: 'Writing & Content',        keywords: ['freelance writer', 'content writing', 'copywriting freelance', 'freelance journalist'] },
    { value: 'freelance_marketing',emoji:'📣',label: 'Marketing',               keywords: ['freelance marketer', 'marketing contractor', 'freelance digital marketing'] },
    { value: 'freelance_finance',emoji:'💷', label: 'Finance & Accounting',     keywords: ['freelance accountant', 'contract finance', 'interim finance', 'freelance bookkeeper'] },
    { value: 'freelance_va',    emoji: '🖥️', label: 'Virtual Assistant',        keywords: ['virtual assistant', 'va', 'remote assistant', 'online pa', 'executive virtual assistant'] },
    { value: 'freelance_consulting',emoji:'🤝',label:'Consulting',              keywords: ['freelance consultant', 'independent consultant', 'interim consultant', 'contract consultant'] },
    { value: 'freelance_trades',emoji: '🔧', label: 'Trades & Construction',    keywords: ['self employed trades', 'freelance builder', 'subcontractor', 'subbies', 'labour only'] },
  ],

  manufacturing: [
    { value: 'automotive_mfg',  emoji: '🚗', label: 'Automotive',               keywords: ['automotive manufacturing', 'car factory', 'vehicle production', 'auto parts manufacturing'] },
    { value: 'textiles_garments',emoji:'👕', label: 'Textiles & Garments',       keywords: ['textile factory', 'garment manufacturing', 'clothing factory', 'apparel production'] },
    { value: 'food_processing', emoji: '🏭', label: 'Food Processing & Packaging',keywords: ['food factory', 'food processing', 'packaging', 'fmcg manufacturing', 'food production'] },
    { value: 'electronics_mfg', emoji: '📱', label: 'Electronics Manufacturing',keywords: ['electronics factory', 'pcb assembly', 'electronic components', 'semiconductor'] },
    { value: 'pharmaceutical_mfg',emoji:'💊',label: 'Pharmaceutical',            keywords: ['pharma manufacturing', 'drug production', 'medicine manufacturing', 'pharmaceutical factory'] },
    { value: 'chemical_plastics',emoji:'🧪', label: 'Chemical & Plastics',       keywords: ['chemical plant', 'plastics manufacturing', 'polymer', 'chemical production'] },
    { value: 'steel_metal',     emoji: '⚙️', label: 'Steel & Metal Fabrication',keywords: ['steel manufacturing', 'metal fabrication', 'steelworks', 'rolling mill', 'foundry'] },
    { value: 'timber_wood_mfg', emoji: '🪵', label: 'Timber & Wood Products',   keywords: ['sawmill', 'timber production', 'wood manufacturing', 'furniture manufacturing', 'joinery factory'] },
    { value: 'construction_materials_mfg',emoji:'🧱',label:'Construction Materials',keywords: ['brick factory', 'cement manufacturing', 'precast concrete', 'roofing materials factory'] },
    { value: 'consumer_goods',  emoji: '🛒', label: 'Consumer Goods',           keywords: ['consumer goods manufacturing', 'household products', 'fmcg production', 'mass production'] },
    { value: 'printing_packaging',emoji:'🖨️',label:'Printing & Packaging',      keywords: ['printing', 'packaging manufacturing', 'label printing', 'corrugated packaging'] },
    { value: 'agri_processing', emoji: '🌾', label: 'Agricultural Processing',  keywords: ['agri processing', 'grain milling', 'cocoa processing', 'palm oil', 'cotton gin'] },
  ],

  mining: [
    { value: 'mining_operative',emoji: '⛏️', label: 'Mining Operative',         keywords: ['miner', 'underground mining', 'open cast mining', 'mining worker', 'mine operator'] },
    { value: 'geologist',       emoji: '🪨', label: 'Geologist',                keywords: ['geologist', 'geology', 'exploration geologist', 'mining geologist', 'earth science'] },
    { value: 'oil_gas_tech',    emoji: '⛽', label: 'Oil & Gas Technician',      keywords: ['oil and gas', 'petroleum technician', 'rig worker', 'offshore', 'downstream'] },
    { value: 'mining_engineer_pro',emoji:'🏗️',label:'Mining Engineer',          keywords: ['mining engineer', 'mine design', 'extraction engineering', 'mineral processing'] },
    { value: 'quarry_worker',   emoji: '🪨', label: 'Quarry / Stone Worker',     keywords: ['quarry', 'stone quarrying', 'aggregate', 'sand and gravel', 'limestone quarry'] },
    { value: 'gold_mineral',    emoji: '🥇', label: 'Gold & Precious Minerals',  keywords: ['gold mining', 'diamond mining', 'precious metals', 'artisanal mining', 'small scale mining'] },
  ],

  // ── Education & Learning ─────────────────────────────────────
  students: [
    { value: 'university_student',emoji:'🎓',label: 'University / College Student',keywords: ['university student', 'college student', 'undergraduate', 'fresher', 'student life'] },
    { value: 'postgraduate',    emoji: '📜', label: 'Postgraduate / Masters',   keywords: ['masters student', 'postgraduate', 'msc', 'mba student', 'postgrad'] },
    { value: 'phd_researcher',  emoji: '🔬', label: 'PhD Researcher',           keywords: ['phd', 'phd student', 'doctoral researcher', 'doctorate', 'thesis'] },
    { value: 'international_student',emoji:'🌍',label:'International Student',  keywords: ['international student', 'studying abroad', 'foreign student', 'visa student'] },
    { value: 'apprentice_student',emoji:'🛠️',label:'Apprentice / Vocational',   keywords: ['apprentice', 'vocational training', 'nvq', 'btec', 'college course', 'trade school'] },
    { value: 'school_student',  emoji: '📚', label: 'School Student (16+)',     keywords: ['school student', 'sixth form', 'a-levels', 'gcse', 'high school', 'secondary school'] },
  ],

  education: [
    { value: 'primary_teacher', emoji: '🏫', label: 'Primary / Elementary Teacher',keywords: ['primary teacher', 'elementary teacher', 'class teacher', 'ks1', 'ks2', 'infant teacher'] },
    { value: 'secondary_teacher',emoji:'🎓',label: 'Secondary / High School Teacher',keywords: ['secondary teacher', 'high school teacher', 'gcse teacher', 'sixth form teacher'] },
    { value: 'university_lecturer',emoji:'🏛️',label:'University Lecturer',      keywords: ['lecturer', 'university lecturer', 'professor', 'senior lecturer', 'academic'] },
    { value: 'private_tutor',   emoji: '📖', label: 'Private Tutor',            keywords: ['private tutor', 'tutoring', 'home tutor', 'one to one tuition', 'maths tutor', 'english tutor'] },
    { value: 'language_teacher',emoji: '🗣️', label: 'Language Teacher',        keywords: ['language teacher', 'english teacher', 'esl', 'esol', 'ielts tutor', 'tefl teacher'] },
    { value: 'music_teacher_edu',emoji:'🎵', label: 'Music Teacher',            keywords: ['music teacher', 'piano teacher', 'guitar teacher', 'singing teacher', 'music lessons'] },
    { value: 'special_needs_teacher',emoji:'♿',label:'SEN Teacher / Specialist',keywords: ['sen teacher', 'special needs teacher', 'learning support', 'autism specialist', 'send'] },
    { value: 'online_tutor',    emoji: '💻', label: 'Online Tutor',             keywords: ['online tutor', 'virtual tutor', 'online teaching', 'zoom tutor', 'e-learning'] },
    { value: 'driving_instructor',emoji:'🚗',label:'Driving Instructor',        keywords: ['driving instructor', 'driving lessons', 'adi', 'driving school', 'theory lessons'] },
  ],

  research: [
    { value: 'university_researcher',emoji:'🔬',label:'University Researcher',  keywords: ['researcher', 'university research', 'research fellow', 'academic researcher'] },
    { value: 'medical_researcher',emoji:'💉', label: 'Medical / Clinical Researcher',keywords: ['clinical research', 'medical research', 'clinical trial', 'research nurse', 'gcp'] },
    { value: 'market_research_analyst',emoji:'📊',label:'Market Research Analyst',keywords: ['market research', 'research analyst', 'consumer research', 'data research'] },
    { value: 'policy_researcher',emoji:'🏛️', label: 'Policy Researcher',        keywords: ['policy research', 'think tank', 'policy analyst', 'public policy', 'government research'] },
    { value: 'environmental_researcher',emoji:'🌱',label:'Environmental Researcher',keywords: ['environmental research', 'ecology', 'climate research', 'field research', 'conservation'] },
  ],

  skills: [
    { value: 'cooking_classes', emoji: '🍳', label: 'Cooking & Baking Classes', keywords: ['cooking class', 'baking class', 'cookery course', 'food skills', 'culinary workshop'] },
    { value: 'art_craft_workshops',emoji:'🎨',label: 'Art & Craft Workshops',   keywords: ['art workshop', 'craft class', 'pottery class', 'painting class', 'creative workshop'] },
    { value: 'diy_home_skills', emoji: '🔨', label: 'DIY & Home Improvement',   keywords: ['diy course', 'home improvement', 'tiling course', 'plastering course', 'trade skills'] },
    { value: 'it_tech_training',emoji: '💻', label: 'IT & Tech Training',       keywords: ['it training', 'coding bootcamp', 'tech skills', 'computer course', 'excel training'] },
    { value: 'language_class',  emoji: '🗣️', label: 'Language Classes',        keywords: ['language class', 'learn english', 'spanish class', 'french lessons', 'language school'] },
    { value: 'business_skills', emoji: '💼', label: 'Business & Finance Skills',keywords: ['business course', 'accounting course', 'bookkeeping', 'business skills', 'financial training'] },
    { value: 'fitness_course',  emoji: '🏋️', label: 'Fitness & Sports Coaching',keywords: ['fitness course', 'pt qualification', 'sports coaching certificate', 'fitness instructor'] },
  ],

  coaching: [
    { value: 'life_coach_edu',  emoji: '🌟', label: 'Life Coach',               keywords: ['life coach', 'life coaching', 'personal development', 'mindset', 'goals coach'] },
    { value: 'business_coach',  emoji: '💼', label: 'Business Coach',           keywords: ['business coach', 'business coaching', 'entrepreneur coach', 'startup mentor'] },
    { value: 'career_coach',    emoji: '📈', label: 'Career Coach',             keywords: ['career coach', 'career coaching', 'cv help', 'interview coaching', 'career change'] },
    { value: 'executive_coach', emoji: '🏛️', label: 'Executive / Leadership Coach',keywords: ['executive coach', 'leadership coach', 'c-suite coach', 'leadership development'] },
    { value: 'sports_mentor',   emoji: '🏆', label: 'Sports Mentor',            keywords: ['sports mentor', 'athlete mentor', 'sports development', 'performance coach'] },
    { value: 'youth_mentor',    emoji: '🌟', label: 'Youth Mentor',             keywords: ['youth mentor', 'mentoring young people', 'youth development', 'young people mentor'] },
    { value: 'wellness_coach',  emoji: '🧘', label: 'Wellness / Mindset Coach', keywords: ['wellness coach', 'mindset coach', 'wellbeing coach', 'health coach', 'holistic coach'] },
  ],
}

export const LANGUAGE_FLAGS = {
  'English':    '🇬🇧', 'Mandarin':   '🇨🇳', 'Hindi':      '🇮🇳', 'Spanish':    '🇪🇸',
  'French':     '🇫🇷', 'Arabic':     '🇸🇦', 'Bengali':    '🇧🇩', 'Portuguese': '🇵🇹',
  'Russian':    '🇷🇺', 'Urdu':       '🇵🇰', 'Indonesian': '🇮🇩', 'Filipino':   '🇵🇭',
  'Vietnamese': '🇻🇳', 'Thai':       '🇹🇭', 'Malay':      '🇲🇾', 'Japanese':   '🇯🇵',
  'Korean':     '🇰🇷', 'Turkish':    '🇹🇷', 'Italian':    '🇮🇹', 'German':     '🇩🇪',
  'Dutch':      '🇳🇱', 'Polish':     '🇵🇱', 'Ukrainian':  '🇺🇦', 'Swedish':    '🇸🇪',
  'Norwegian':  '🇳🇴', 'Danish':     '🇩🇰', 'Finnish':    '🇫🇮', 'Swahili':    '🇰🇪',
  'Amharic':    '🇪🇹', 'Yoruba':     '🇳🇬', 'Zulu':       '🇿🇦', 'Tamil':      '🇱🇰',
  'Telugu':     '🇮🇳', 'Punjabi':    '🇮🇳', 'Burmese':    '🇲🇲', 'Khmer':      '🇰🇭',
  'Lao':        '🇱🇦', 'Sinhala':    '🇱🇰', 'Nepali':     '🇳🇵', 'Georgian':   '🇬🇪',
  'Armenian':   '🇦🇲', 'Hebrew':     '🇮🇱', 'Persian':    '🇮🇷', 'Pashto':     '🇦🇫',
  'Somali':     '🇸🇴', 'Hausa':      '🇳🇬',
}

/** Returns "👋 Meet New People" for value "meet_new", etc. Falls back to raw value. */
export function lookingForText(value) {
  if (!value) return null
  const entry = LOOKING_FOR_OPTIONS.find(o => o.value === value)
  if (!entry) return value
  return `${entry.emoji} ${entry.label}`
}

/** Returns full label for a sub-category value */
export function subCategoryText(mainValue, subValue) {
  if (!mainValue || !subValue) return null
  const subs = SUB_CATEGORIES[mainValue]
  if (!subs) return null
  const entry = subs.find(s => s.value === subValue)
  return entry ? `${entry.emoji} ${entry.label}` : null
}

/** Returns all search keywords for a given main + sub combination */
export function getSearchKeywords(mainValue, subValue) {
  const keywords = []
  const mainOpt = LOOKING_FOR_OPTIONS.find(o => o.value === mainValue)
  if (mainOpt) keywords.push(mainOpt.label.toLowerCase())
  if (subValue && SUB_CATEGORIES[mainValue]) {
    const sub = SUB_CATEGORIES[mainValue].find(s => s.value === subValue)
    if (sub) keywords.push(sub.label.toLowerCase(), ...sub.keywords)
  }
  return [...new Set(keywords)]
}
