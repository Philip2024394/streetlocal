/**
 * Category-specific specification fields for marketplace listings.
 *
 * Each category defines:
 *  - specs:    fixed fields that describe the product (shown as key-value pairs)
 *  - variants: fields that buyers can choose between (shown as selectors)
 *
 * Field types:
 *  - text:     free text input
 *  - select:   dropdown with predefined options
 *  - multi:    comma-separated values (e.g. multiple sizes)
 *  - number:   numeric input
 *  - boolean:  yes/no toggle
 */

// ── Size systems ────────────────────────────────────────────────────────────────
const CLOTHING_SIZES   = ['XXS','XS','S','M','L','XL','XXL','3XL','4XL','5XL']
const SHOE_SIZES       = ['35','36','37','38','39','40','41','42','43','44','45','46','47']
const RING_SIZES       = ['5','6','7','8','9','10','11','12','13']
const KIDS_SIZES       = ['0-3m','3-6m','6-12m','1-2y','2-3y','3-4y','4-5y','5-6y','6-7y','7-8y','8-10y','10-12y']
const WAIST_SIZES      = ['26','28','30','32','34','36','38','40','42']

// ── Common options ──────────────────────────────────────────────────────────────
const CONDITIONS       = ['New','Like New','Good','Fair','For Parts']
const COLORS           = ['Black','White','Red','Blue','Navy','Green','Brown','Tan','Grey','Pink','Purple','Orange','Yellow','Gold','Silver','Beige','Cream','Multi']
const MATERIALS_FABRIC = ['Cotton','Polyester','Silk','Linen','Wool','Denim','Leather','Synthetic','Nylon','Cashmere','Velvet','Satin','Chiffon','Rayon','Spandex','Blend']
const MATERIALS_BAG    = ['Genuine Leather','Faux Leather','Canvas','Nylon','Straw','Suede','PVC','Cotton']

// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL FIELDS — apply to EVERY category (shown above category-specific)
// ═══════════════════════════════════════════════════════════════════════════════
export const UNIVERSAL_SPECS = [
  { key: 'new_or_used',      label: 'New or Used',          type: 'select',  options: ['Brand New','New (Open Box)','Used — Like New','Used — Good','Used — Fair','Refurbished','For Parts / Not Working'] },
  { key: 'stock',            label: 'Stock Quantity',       type: 'number',  placeholder: 'e.g. 10' },
  { key: 'custom_order',     label: 'Custom Order',         type: 'select',  options: ['No','Yes — Made to Order','Yes — Custom Design Available','Yes — Bulk Orders Welcome'] },
  { key: 'made_in',          label: 'Made In',              type: 'text',    placeholder: 'e.g. Indonesia, China, Italy' },
  { key: 'year_manufactured',label: 'Year Manufactured',    type: 'text',    placeholder: 'e.g. 2025' },
  { key: 'market_scope',     label: 'Market Scope',         type: 'select',  options: ['Local Market Only','Export Market Only','Local & Export Market'] },
  { key: 'child_certified',  label: 'Child Safety Certified',type: 'select', options: ['Not Applicable','Yes — Certified','No','Pending Certification'] },
  { key: 'eu_certification', label: 'European Certifications',type: 'select',options: ['None','CE Marked','EN71 (Toys)','REACH Compliant','RoHS Compliant','EU Organic','GMP','ISO Certified','OEKO-TEX','GOTS (Organic Textile)','Multiple — See Description'] },
]

export const CATEGORY_SPECS = {
  // ════════════════════════════════════════════════════════════════════
  // FASHION
  // ════════════════════════════════════════════════════════════════════
  fashion: {
    label: 'Fashion & Clothing',
    specs: [
      { key: 'material',    label: 'Material',    type: 'select',  options: MATERIALS_FABRIC },
      { key: 'condition',   label: 'Condition',   type: 'select',  options: CONDITIONS },
      { key: 'brand',       label: 'Brand',       type: 'text' },
      { key: 'gender',      label: 'Gender',      type: 'select',  options: ['Men','Women','Unisex','Kids'] },
      { key: 'fit',         label: 'Fit',         type: 'select',  options: ['Regular','Slim','Loose','Oversized','Tailored'] },
      { key: 'care',        label: 'Care',        type: 'text',    placeholder: 'e.g. Machine wash cold' },
      { key: 'origin',      label: 'Origin',      type: 'text',    placeholder: 'e.g. Jakarta, Indonesia' },
    ],
    variants: [
      { key: 'size',  label: 'Sizes Available',  type: 'multi', options: CLOTHING_SIZES },
      { key: 'color', label: 'Colors Available',  type: 'multi', options: COLORS },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ELECTRONICS
  // ════════════════════════════════════════════════════════════════════
  electronics: {
    label: 'Electronics',
    specs: [
      { key: 'brand',       label: 'Brand',        type: 'text' },
      { key: 'model',       label: 'Model',        type: 'text' },
      { key: 'condition',   label: 'Condition',     type: 'select',  options: CONDITIONS },
      { key: 'warranty',    label: 'Warranty',      type: 'text',    placeholder: 'e.g. 6 months remaining' },
      { key: 'storage',     label: 'Storage',       type: 'text',    placeholder: 'e.g. 128GB' },
      { key: 'battery',     label: 'Battery',       type: 'text',    placeholder: 'e.g. 92% health' },
      { key: 'connectivity',label: 'Connectivity',  type: 'text',    placeholder: 'e.g. Bluetooth 5.3, WiFi 6' },
      { key: 'includes',    label: 'Includes',      type: 'text',    placeholder: 'e.g. Charger, box, manual' },
    ],
    variants: [
      { key: 'color', label: 'Colors Available', type: 'multi', options: COLORS },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // HANDMADE / CRAFT
  // ════════════════════════════════════════════════════════════════════
  handmade: {
    label: 'Handmade & Craft',
    specs: [
      { key: 'material',    label: 'Material',       type: 'text' },
      { key: 'made_by',     label: 'Made By',        type: 'select', options: ['Handmade','Machine-made','Hand-finished'] },
      { key: 'condition',   label: 'Condition',      type: 'select', options: CONDITIONS },
      { key: 'dimensions',  label: 'Dimensions',     type: 'text',   placeholder: 'e.g. 26 x 18 x 8 cm' },
      { key: 'weight',      label: 'Weight',         type: 'text',   placeholder: 'e.g. 350g' },
      { key: 'customisable',label: 'Customisable',   type: 'select', options: ['Yes','No'] },
      { key: 'lead_time',   label: 'Lead Time',      type: 'text',   placeholder: 'e.g. 3-5 days' },
      { key: 'origin',      label: 'Origin',         type: 'text' },
    ],
    variants: [
      { key: 'color', label: 'Colors Available', type: 'multi', options: COLORS },
      { key: 'size',  label: 'Sizes Available',  type: 'multi', options: ['Small','Medium','Large','Custom'] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FRESH PRODUCE
  // ════════════════════════════════════════════════════════════════════
  fresh_produce: {
    label: 'Fresh Produce',
    specs: [
      { key: 'type',        label: 'Type',          type: 'select', options: ['Fruit','Vegetable','Meat','Fish','Dairy','Egg','Grain','Spice','Herb','Other'] },
      { key: 'organic',     label: 'Organic',       type: 'select', options: ['Yes','No','Certified Organic'] },
      { key: 'farm',        label: 'Farm / Source',  type: 'text' },
      { key: 'harvest_date',label: 'Harvest Date',   type: 'text',   placeholder: 'e.g. Today, Yesterday' },
      { key: 'shelf_life',  label: 'Shelf Life',     type: 'text',   placeholder: 'e.g. 3 days' },
      { key: 'storage',     label: 'Storage',        type: 'text',   placeholder: 'e.g. Keep refrigerated' },
      { key: 'unit',        label: 'Unit',           type: 'select', options: ['kg','gram','piece','bunch','box','tray','dozen'] },
    ],
    variants: [
      { key: 'weight', label: 'Weight Options', type: 'multi', options: ['250g','500g','1kg','2kg','5kg'] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // BEAUTY & SKINCARE
  // ════════════════════════════════════════════════════════════════════
  beauty: {
    label: 'Beauty & Skincare',
    specs: [
      { key: 'brand',       label: 'Brand',          type: 'text' },
      { key: 'skin_type',   label: 'Skin Type',      type: 'select', options: ['All','Oily','Dry','Combination','Sensitive','Normal'] },
      { key: 'volume',      label: 'Volume / Size',   type: 'text',   placeholder: 'e.g. 50ml, 100g' },
      { key: 'ingredients', label: 'Key Ingredients', type: 'text',   placeholder: 'e.g. Hyaluronic acid, Niacinamide' },
      { key: 'condition',   label: 'Condition',       type: 'select', options: ['New & Sealed','New (opened)','Used','Sample'] },
      { key: 'expiry',      label: 'Expiry Date',     type: 'text',   placeholder: 'e.g. Dec 2027' },
      { key: 'cruelty_free',label: 'Cruelty Free',    type: 'select', options: ['Yes','No','Unknown'] },
      { key: 'halal',       label: 'Halal Certified', type: 'select', options: ['Yes','No','Unknown'] },
    ],
    variants: [
      { key: 'shade', label: 'Shades Available', type: 'multi', options: ['Light','Medium','Dark','Fair','Tan','Deep'] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FOOD & DRINK
  // ════════════════════════════════════════════════════════════════════
  food_drink: {
    label: 'Food & Drink',
    specs: [
      { key: 'type',        label: 'Type',          type: 'select', options: ['Snack','Meal','Drink','Dessert','Sauce','Spice','Packaged','Frozen','Other'] },
      { key: 'halal',       label: 'Halal',         type: 'select', options: ['Yes','No','Unknown'] },
      { key: 'vegan',       label: 'Vegan',         type: 'select', options: ['Yes','No'] },
      { key: 'allergens',   label: 'Allergens',     type: 'text',   placeholder: 'e.g. Nuts, Dairy, Gluten' },
      { key: 'shelf_life',  label: 'Shelf Life',    type: 'text',   placeholder: 'e.g. 7 days' },
      { key: 'storage',     label: 'Storage',       type: 'text',   placeholder: 'e.g. Keep refrigerated' },
      { key: 'weight',      label: 'Net Weight',    type: 'text',   placeholder: 'e.g. 250g' },
      { key: 'origin',      label: 'Origin',        type: 'text' },
    ],
    variants: [
      { key: 'flavor',  label: 'Flavors Available',  type: 'multi', options: ['Original','Spicy','Sweet','Sour','Mild','Extra Hot'] },
      { key: 'size',    label: 'Size Options',       type: 'multi', options: ['Small','Medium','Large','Family'] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ART & CRAFT SUPPLIES
  // ════════════════════════════════════════════════════════════════════
  art_craft: {
    label: 'Art & Craft',
    specs: [
      { key: 'medium',      label: 'Medium',        type: 'select', options: ['Acrylic','Oil','Watercolor','Digital','Pencil','Ink','Mixed Media','Textile','Ceramic','Wood','Other'] },
      { key: 'dimensions',  label: 'Dimensions',    type: 'text',   placeholder: 'e.g. 40 x 60 cm' },
      { key: 'framed',      label: 'Framed',        type: 'select', options: ['Yes','No','Frame included'] },
      { key: 'original',    label: 'Original / Print',type: 'select', options: ['Original','Limited Print','Open Print','Digital'] },
      { key: 'artist',      label: 'Artist',        type: 'text' },
      { key: 'year',        label: 'Year Created',  type: 'text' },
      { key: 'signed',      label: 'Signed',        type: 'select', options: ['Yes','No'] },
    ],
    variants: [],
  },

  // ════════════════════════════════════════════════════════════════════
  // VEHICLES
  // ════════════════════════════════════════════════════════════════════
  vehicles: {
    label: 'Vehicles',
    specs: [
      { key: 'make',        label: 'Make',          type: 'text',   placeholder: 'e.g. Honda' },
      { key: 'model',       label: 'Model',         type: 'text',   placeholder: 'e.g. Beat 2023' },
      { key: 'year',        label: 'Year',          type: 'number' },
      { key: 'mileage',     label: 'Mileage',       type: 'text',   placeholder: 'e.g. 12,000 km' },
      { key: 'fuel',        label: 'Fuel Type',     type: 'select', options: ['Petrol','Diesel','Electric','Hybrid'] },
      { key: 'transmission',label: 'Transmission',  type: 'select', options: ['Automatic','Manual','CVT'] },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'plate',       label: 'Plate Area',    type: 'text',   placeholder: 'e.g. B (Jakarta)' },
      { key: 'color',       label: 'Color',         type: 'select', options: COLORS },
      { key: 'documents',   label: 'Documents',     type: 'text',   placeholder: 'e.g. STNK + BPKB complete' },
    ],
    variants: [],
  },

  // ════════════════════════════════════════════════════════════════════
  // PROPERTY / RENTALS
  // ════════════════════════════════════════════════════════════════════
  property: {
    label: 'Property',
    specs: [
      { key: 'type',        label: 'Type',           type: 'select', options: ['Apartment','House','Room','Land','Office','Shop','Warehouse'] },
      { key: 'listing_type',label: 'Listing Type',    type: 'select', options: ['For Sale','For Rent','Daily Rental'] },
      { key: 'bedrooms',    label: 'Bedrooms',        type: 'number' },
      { key: 'bathrooms',   label: 'Bathrooms',       type: 'number' },
      { key: 'area_sqm',    label: 'Area (sqm)',      type: 'number' },
      { key: 'furnished',   label: 'Furnished',       type: 'select', options: ['Furnished','Semi-furnished','Unfurnished'] },
      { key: 'parking',     label: 'Parking',         type: 'select', options: ['Yes','No','Garage','Street'] },
      { key: 'facilities',  label: 'Facilities',      type: 'text',   placeholder: 'e.g. Pool, gym, security' },
      { key: 'available',   label: 'Available From',   type: 'text',   placeholder: 'e.g. Immediately, June 2026' },
    ],
    variants: [],
  },

  // ════════════════════════════════════════════════════════════════════
  // VINTAGE / SECOND HAND
  // ════════════════════════════════════════════════════════════════════
  vintage: {
    label: 'Vintage & Pre-owned',
    specs: [
      { key: 'era',         label: 'Era / Decade',  type: 'text',   placeholder: 'e.g. 1980s' },
      { key: 'brand',       label: 'Brand',         type: 'text' },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'authenticity',label: 'Authenticity',   type: 'select', options: ['Verified','Unverified','Certificate included'] },
      { key: 'material',    label: 'Material',      type: 'text' },
      { key: 'dimensions',  label: 'Dimensions',    type: 'text' },
      { key: 'origin',      label: 'Origin',        type: 'text' },
      { key: 'defects',     label: 'Defects / Wear',type: 'text',   placeholder: 'e.g. Minor scratches on base' },
    ],
    variants: [],
  },

  // ════════════════════════════════════════════════════════════════════
  // TOOLS & EQUIPMENT
  // ════════════════════════════════════════════════════════════════════
  tools_equip: {
    label: 'Tools & Equipment',
    specs: [
      { key: 'brand',       label: 'Brand',         type: 'text' },
      { key: 'model',       label: 'Model',         type: 'text' },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'power',       label: 'Power Source',  type: 'select', options: ['Electric','Battery','Manual','Petrol','Pneumatic'] },
      { key: 'voltage',     label: 'Voltage',       type: 'text',   placeholder: 'e.g. 220V, 18V' },
      { key: 'weight',      label: 'Weight',        type: 'text' },
      { key: 'warranty',    label: 'Warranty',      type: 'text' },
      { key: 'includes',    label: 'Includes',      type: 'text',   placeholder: 'e.g. Case, 2 batteries, charger' },
    ],
    variants: [],
  },

  // ════════════════════════════════════════════════════════════════════
  // CATERING
  // ════════════════════════════════════════════════════════════════════
  catering: {
    label: 'Catering',
    specs: [
      { key: 'cuisine',     label: 'Cuisine',       type: 'text',   placeholder: 'e.g. Indonesian, Western' },
      { key: 'min_pax',     label: 'Min Pax',       type: 'number' },
      { key: 'max_pax',     label: 'Max Pax',       type: 'number' },
      { key: 'halal',       label: 'Halal',         type: 'select', options: ['Yes','No','Available on request'] },
      { key: 'includes',    label: 'Includes',      type: 'text',   placeholder: 'e.g. Setup, utensils, cleanup' },
      { key: 'lead_time',   label: 'Lead Time',     type: 'text',   placeholder: 'e.g. 3 days notice' },
      { key: 'delivery',    label: 'Delivery',      type: 'select', options: ['Free delivery','Delivery fee','Pickup only'] },
      { key: 'area',        label: 'Service Area',  type: 'text',   placeholder: 'e.g. Jabodetabek' },
    ],
    variants: [
      { key: 'package', label: 'Packages', type: 'multi', options: ['Basic','Standard','Premium','Custom'] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SHOES & FOOTWEAR
  // ════════════════════════════════════════════════════════════════════
  shoes: {
    label: 'Shoes & Footwear',
    specs: [
      { key: 'brand',       label: 'Brand',         type: 'text' },
      { key: 'material',    label: 'Material',      type: 'select', options: ['Leather','Canvas','Mesh','Rubber','Synthetic','Suede'] },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'gender',      label: 'Gender',        type: 'select', options: ['Men','Women','Unisex','Kids'] },
      { key: 'style',       label: 'Style',         type: 'select', options: ['Sneakers','Sandals','Boots','Heels','Flats','Loafers','Slides','Sports','Formal'] },
      { key: 'sole',        label: 'Sole Type',     type: 'select', options: ['Rubber','Leather','Foam','EVA','Crepe'] },
      { key: 'origin',      label: 'Origin',        type: 'text' },
    ],
    variants: [
      { key: 'size',  label: 'Sizes Available',  type: 'multi', options: SHOE_SIZES },
      { key: 'color', label: 'Colors Available',  type: 'multi', options: COLORS },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // BAGS & ACCESSORIES
  // ════════════════════════════════════════════════════════════════════
  bags: {
    label: 'Bags & Accessories',
    specs: [
      { key: 'material',    label: 'Material',      type: 'select', options: MATERIALS_BAG },
      { key: 'brand',       label: 'Brand',         type: 'text' },
      { key: 'style',       label: 'Style',         type: 'select', options: ['Tote','Crossbody','Backpack','Clutch','Sling','Briefcase','Duffel','Wallet','Belt','Watch','Jewellery','Hat','Scarf','Sunglasses'] },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'dimensions',  label: 'Dimensions',    type: 'text',   placeholder: 'e.g. 26 x 18 x 8 cm' },
      { key: 'closure',     label: 'Closure',       type: 'select', options: ['Zipper','Magnetic','Buckle','Drawstring','Open top','Snap','Clasp'] },
      { key: 'strap',       label: 'Strap',         type: 'text',   placeholder: 'e.g. Adjustable 55-120cm' },
      { key: 'origin',      label: 'Origin',        type: 'text' },
    ],
    variants: [
      { key: 'color', label: 'Colors Available', type: 'multi', options: COLORS },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // JEWELLERY
  // ════════════════════════════════════════════════════════════════════
  jewellery: {
    label: 'Jewellery',
    specs: [
      { key: 'material',    label: 'Material',      type: 'select', options: ['Gold','Silver','Platinum','Stainless Steel','Titanium','Rose Gold','White Gold','Brass','Copper','Beads','Pearl','Crystal'] },
      { key: 'purity',      label: 'Purity',        type: 'text',   placeholder: 'e.g. 18K, 925 Sterling' },
      { key: 'stone',       label: 'Stone / Gem',   type: 'text',   placeholder: 'e.g. Diamond, Ruby, None' },
      { key: 'weight_g',    label: 'Weight (grams)', type: 'text' },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'certificate', label: 'Certificate',   type: 'select', options: ['Yes','No'] },
      { key: 'engraving',   label: 'Engraving',     type: 'select', options: ['Available','Not available','Included'] },
    ],
    variants: [
      { key: 'size', label: 'Ring Sizes', type: 'multi', options: RING_SIZES },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // KIDS & BABY
  // ════════════════════════════════════════════════════════════════════
  kids_baby: {
    label: 'Kids & Baby',
    specs: [
      { key: 'age_range',   label: 'Age Range',     type: 'select', options: ['0-6 months','6-12 months','1-2 years','2-4 years','4-6 years','6-8 years','8-12 years'] },
      { key: 'brand',       label: 'Brand',         type: 'text' },
      { key: 'material',    label: 'Material',      type: 'text' },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'safety',      label: 'Safety Cert',   type: 'text',   placeholder: 'e.g. SNI, CE marked' },
      { key: 'gender',      label: 'Gender',        type: 'select', options: ['Boy','Girl','Unisex'] },
    ],
    variants: [
      { key: 'size',  label: 'Sizes Available',  type: 'multi', options: KIDS_SIZES },
      { key: 'color', label: 'Colors Available',  type: 'multi', options: COLORS },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // HOME & FURNITURE
  // ════════════════════════════════════════════════════════════════════
  home_furniture: {
    label: 'Home & Furniture',
    specs: [
      { key: 'material',    label: 'Material',      type: 'text',   placeholder: 'e.g. Teak wood, Rattan' },
      { key: 'dimensions',  label: 'Dimensions',    type: 'text',   placeholder: 'e.g. 120 x 60 x 75 cm' },
      { key: 'weight',      label: 'Weight',        type: 'text' },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'assembly',    label: 'Assembly',      type: 'select', options: ['Assembled','Flat-pack','Professional install'] },
      { key: 'style',       label: 'Style',         type: 'select', options: ['Modern','Minimalist','Traditional','Industrial','Bohemian','Scandinavian','Rustic'] },
      { key: 'delivery',    label: 'Delivery',      type: 'select', options: ['Free delivery','Delivery fee','Pickup only'] },
    ],
    variants: [
      { key: 'color', label: 'Colors Available', type: 'multi', options: COLORS },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SPORTS & FITNESS
  // ════════════════════════════════════════════════════════════════════
  sports: {
    label: 'Sports & Fitness',
    specs: [
      { key: 'brand',       label: 'Brand',         type: 'text' },
      { key: 'sport',       label: 'Sport',         type: 'select', options: ['Running','Gym','Swimming','Cycling','Football','Basketball','Tennis','Badminton','Yoga','Hiking','Surfing','Boxing','Other'] },
      { key: 'condition',   label: 'Condition',     type: 'select', options: CONDITIONS },
      { key: 'weight',      label: 'Weight',        type: 'text' },
      { key: 'gender',      label: 'Gender',        type: 'select', options: ['Men','Women','Unisex'] },
    ],
    variants: [
      { key: 'size',  label: 'Sizes Available',  type: 'multi', options: CLOTHING_SIZES },
      { key: 'color', label: 'Colors Available',  type: 'multi', options: COLORS },
    ],
  },
}

/**
 * Get the spec config for a category. Returns empty arrays if unknown.
 */
export function getSpecsForCategory(category) {
  return CATEGORY_SPECS[category] ?? { label: category, specs: [], variants: [] }
}

/**
 * All category keys (for dropdowns).
 */
export const ALL_CATEGORIES = Object.entries(CATEGORY_SPECS).map(([key, val]) => ({
  key,
  label: val.label,
}))
