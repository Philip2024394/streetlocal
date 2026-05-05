// ─────────────────────────────────────────────────────────────────────────────
// ECHO Commerce — per-category specification fields
// Researched from Etsy, eBay, Amazon, Tokopedia seller forms
//
// Field types:
//   select  → dropdown with predefined options
//   text    → free-text input
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_SPECS = {
  'Leather Handbags': [
    { key: 'Material',   type: 'select', options: ['Full-grain leather', 'Top-grain leather', 'Genuine leather', 'Vegan leather', 'Suede', 'Nubuck', 'Canvas', 'Mixed'] },
    { key: 'Style',      type: 'select', options: ['Crossbody', 'Tote', 'Clutch', 'Satchel', 'Shoulder bag', 'Backpack', 'Hobo', 'Bucket bag', 'Mini bag', 'Wristlet'] },
    { key: 'Made by',    type: 'select', options: ['Handmade', 'Machine-made', 'Hand-finished'] },
    { key: 'Condition',  type: 'select', options: ['New', 'Like New', 'Used — Excellent', 'Used — Good', 'Vintage'] },
    { key: 'Closure',    type: 'select', options: ['Magnetic snap', 'Zipper', 'Buckle', 'Button', 'Open top', 'Drawstring', 'Frame clasp', 'Turn lock'] },
    { key: 'Hardware',   type: 'select', options: ['Brass', 'Gold-tone', 'Silver-tone', 'Gunmetal', 'Rose gold', 'Bronze', 'No hardware'] },
    { key: 'Interior',   type: 'text',   placeholder: 'e.g. Fully lined, 3 pockets, 1 zip compartment' },
    { key: 'Strap',      type: 'select', options: ['Adjustable & removable', 'Adjustable fixed', 'Chain', 'Top handles only', 'Backpack straps', 'No strap'] },
    { key: 'Dimensions', type: 'text',   placeholder: 'W × H × D in cm' },
    { key: 'Origin',     type: 'text',   placeholder: 'e.g. Jakarta, Indonesia' },
  ],

  'Leather Wallets': [
    { key: 'Material',         type: 'select', options: ['Full-grain leather', 'Top-grain leather', 'Genuine leather', 'Vegan leather', 'Crocodile-embossed'] },
    { key: 'Style',            type: 'select', options: ['Bifold', 'Trifold', 'Card holder', 'Money clip', 'Zip-around', 'Long wallet', 'Coin purse', 'Travel wallet'] },
    { key: 'Made by',          type: 'select', options: ['Handmade', 'Machine-made', 'Hand-finished'] },
    { key: 'Condition',        type: 'select', options: ['New', 'Like New', 'Used — Excellent', 'Used — Good'] },
    { key: 'Card slots',       type: 'select', options: ['2–4', '5–6', '7–8', '9–12', '12+'] },
    { key: 'ID window',        type: 'select', options: ['Yes', 'No'] },
    { key: 'Coin pocket',      type: 'select', options: ['Yes', 'No'] },
    { key: 'Bill compartment', type: 'select', options: ['Yes', 'No'] },
    { key: 'Closure',          type: 'select', options: ['Open fold', 'Button snap', 'Zipper', 'No closure'] },
    { key: 'Dimensions',       type: 'text',   placeholder: 'W × H × D in cm' },
    { key: 'Origin',           type: 'text',   placeholder: 'e.g. Jakarta, Indonesia' },
  ],

  'Accessories': [
    { key: 'Material',        type: 'select', options: ['Full-grain leather', 'Genuine leather', 'Vegan leather', 'Metal', 'Brass', 'Sterling silver', 'Mixed'] },
    { key: 'Type',            type: 'select', options: ['Keychain', 'Belt', 'Watch strap', 'Phone case', 'Lanyard', 'Bracelet', 'Bag charm', 'Card holder', 'Luggage tag', 'Bookmark'] },
    { key: 'Made by',         type: 'select', options: ['Handmade', 'Machine-made', 'Hand-finished'] },
    { key: 'Condition',       type: 'select', options: ['New', 'Like New', 'Used'] },
    { key: 'Personalisation', type: 'select', options: ['Available on request', 'Not available'] },
    { key: 'Dimensions',      type: 'text',   placeholder: 'Size or length in cm' },
    { key: 'Origin',          type: 'text',   placeholder: 'e.g. Jakarta, Indonesia' },
  ],

  'Electronics': [
    { key: 'Brand',         type: 'text',   placeholder: 'e.g. Sony, Samsung, Apple' },
    { key: 'Model',         type: 'text',   placeholder: 'e.g. WH-1000XM5' },
    { key: 'Condition',     type: 'select', options: ['New — sealed', 'New — open box', 'Like New', 'Used — Excellent', 'Used — Good', 'Refurbished', 'For parts'] },
    { key: 'Connectivity',  type: 'select', options: ['Bluetooth', 'WiFi', 'Wired', 'Bluetooth + Wired', 'NFC', 'USB-C', 'Lightning', 'Multiple'] },
    { key: 'Battery life',  type: 'text',   placeholder: 'e.g. 24 hours playback' },
    { key: 'Compatibility', type: 'select', options: ['Universal', 'iOS only', 'Android only', 'iOS & Android', 'Windows', 'macOS', 'Multiple'] },
    { key: 'Warranty',      type: 'select', options: ['No warranty', '1 month', '3 months', '6 months', '1 year', '2 years'] },
    { key: 'Color',         type: 'text',   placeholder: 'e.g. Midnight Black' },
    { key: 'In box',        type: 'text',   placeholder: 'e.g. Unit, charging cable, manual' },
  ],

  'Clothing': [
    { key: 'Material', type: 'text',   placeholder: 'e.g. 100% cotton, linen blend' },
    { key: 'Size',     type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free size', 'Custom'] },
    { key: 'Gender',   type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls', 'Baby'] },
    { key: 'Fit',      type: 'select', options: ['Regular', 'Slim', 'Loose', 'Oversized', 'Relaxed', 'Fitted'] },
    { key: 'Condition',type: 'select', options: ['New with tags', 'New without tags', 'Like New', 'Used — Excellent', 'Used — Good'] },
    { key: 'Care',     type: 'select', options: ['Machine wash cold', 'Machine wash warm', 'Hand wash only', 'Dry clean only', 'Spot clean only'] },
    { key: 'Origin',   type: 'text',   placeholder: 'e.g. Bandung, Indonesia' },
  ],

  'Footwear': [
    { key: 'Material',  type: 'select', options: ['Full-grain leather', 'Genuine leather', 'Suede', 'Canvas', 'Synthetic', 'Rubber', 'Mixed'] },
    { key: 'Style',     type: 'select', options: ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats', 'Loafers', 'Oxfords', 'Slip-ons', 'Wedges'] },
    { key: 'Size',      type: 'text',   placeholder: 'EU / UK / US size (e.g. EU 40)' },
    { key: 'Gender',    type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'] },
    { key: 'Condition', type: 'select', options: ['New with box', 'New without box', 'Like New', 'Used — Excellent', 'Used — Good'] },
    { key: 'Sole',      type: 'select', options: ['Rubber', 'Leather', 'Synthetic', 'Crepe', 'Cork'] },
    { key: 'Origin',    type: 'text',   placeholder: 'e.g. Jakarta, Indonesia' },
  ],

  'Jewelry': [
    { key: 'Metal',       type: 'select', options: ['Gold', 'Silver', 'Rose gold', 'Platinum', 'Stainless steel', 'Brass', 'Copper', 'No metal'] },
    { key: 'Karat',       type: 'select', options: ['Not applicable', '9k', '14k', '18k', '22k', '24k'] },
    { key: 'Gemstone',    type: 'select', options: ['None', 'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Amethyst', 'Turquoise', 'Cubic Zirconia', 'Other natural stone'] },
    { key: 'Type',        type: 'select', options: ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Anklet', 'Brooch', 'Pendant', 'Chain', 'Bangle', 'Charm'] },
    { key: 'Size / Length', type: 'text', placeholder: 'Ring size or chain length in cm' },
    { key: 'Condition',   type: 'select', options: ['New', 'Like New', 'Used', 'Vintage / Antique'] },
    { key: 'Hallmarked',  type: 'select', options: ['Yes', 'No'] },
    { key: 'Origin',      type: 'text',   placeholder: 'e.g. Yogyakarta, Indonesia' },
  ],

  'Home & Decor': [
    { key: 'Material',   type: 'text',   placeholder: 'e.g. Teak wood, rattan, ceramic' },
    { key: 'Dimensions', type: 'text',   placeholder: 'W × H × D in cm' },
    { key: 'Weight',     type: 'text',   placeholder: 'e.g. 1.2 kg' },
    { key: 'Color',      type: 'text',   placeholder: 'e.g. Natural, White, Terracotta' },
    { key: 'Style',      type: 'select', options: ['Modern', 'Traditional / Batik', 'Boho', 'Industrial', 'Minimalist', 'Rustic', 'Scandinavian', 'Tropical'] },
    { key: 'Condition',  type: 'select', options: ['New', 'Like New', 'Used — Excellent', 'Used — Good', 'Vintage'] },
    { key: 'Care',       type: 'text',   placeholder: 'e.g. Wipe with dry cloth' },
    { key: 'Origin',     type: 'text',   placeholder: 'e.g. Bali, Indonesia' },
  ],

  'Food & Beverages': [
    { key: 'Weight / Volume', type: 'text',   placeholder: 'e.g. 250g, 500ml' },
    { key: 'Ingredients',     type: 'text',   placeholder: 'Main ingredients list' },
    { key: 'Allergens',       type: 'text',   placeholder: 'e.g. Contains nuts — or gluten-free' },
    { key: 'Shelf life',      type: 'text',   placeholder: 'e.g. 6 months from production date' },
    { key: 'Packaging',       type: 'select', options: ['Vacuum sealed', 'Glass jar', 'Plastic bag', 'Cardboard box', 'Tin can', 'Gift box'] },
    { key: 'Halal certified', type: 'select', options: ['Yes — MUI certified', 'Yes — self-certified', 'No', 'Pending'] },
    { key: 'Origin',          type: 'text',   placeholder: 'e.g. Surabaya, Indonesia' },
  ],

  'Beauty & Health': [
    { key: 'Type',             type: 'select', options: ['Skincare', 'Haircare', 'Makeup', 'Fragrance', 'Supplement', 'Essential oil', 'Handmade soap', 'Candle', 'Massage oil'] },
    { key: 'Volume / Weight',  type: 'text',   placeholder: 'e.g. 50ml, 100g' },
    { key: 'Skin type',        type: 'select', options: ['All skin types', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'Mature'] },
    { key: 'Key ingredients',  type: 'text',   placeholder: 'e.g. Vitamin C, Hyaluronic acid, Argan oil' },
    { key: 'Cruelty-free',     type: 'select', options: ['Yes', 'No'] },
    { key: 'BPOM certified',   type: 'select', options: ['Yes', 'No', 'Pending'] },
    { key: 'Shelf life',       type: 'text',   placeholder: 'e.g. 24 months unopened' },
    { key: 'Origin',           type: 'text',   placeholder: 'e.g. Jakarta, Indonesia' },
  ],

  'Art & Collectibles': [
    { key: 'Type',       type: 'select', options: ['Painting', 'Print', 'Sculpture', 'Photograph', 'Digital art', 'Ceramics', 'Textile art', 'Woodwork', 'Glasswork'] },
    { key: 'Medium',     type: 'text',   placeholder: 'e.g. Oil on canvas, watercolour, resin' },
    { key: 'Dimensions', type: 'text',   placeholder: 'W × H (× D) in cm' },
    { key: 'Signed',     type: 'select', options: ['Yes — signed by artist', 'Yes — signed & numbered', 'No'] },
    { key: 'Edition',    type: 'select', options: ['Original', 'Limited edition', 'Open edition', 'Print on demand'] },
    { key: 'Condition',  type: 'select', options: ['Mint', 'Excellent', 'Good', 'Fair'] },
    { key: 'Framed',     type: 'select', options: ['Yes', 'No', 'Frame optional'] },
    { key: 'Origin',     type: 'text',   placeholder: 'e.g. Bali, Indonesia' },
  ],

  'Books & Stationery': [
    { key: 'Type',       type: 'select', options: ['Book', 'Notebook / Journal', 'Planner', 'Greeting card', 'Sticker pack', 'Washi tape', 'Pen / Marker', 'Calendar'] },
    { key: 'Language',   type: 'select', options: ['Indonesian', 'English', 'Bilingual', 'Other'] },
    { key: 'Condition',  type: 'select', options: ['New — sealed', 'New — unsealed', 'Like New', 'Used — Good', 'Used — Acceptable'] },
    { key: 'Author',     type: 'text',   placeholder: 'Author or brand name' },
    { key: 'Publisher',  type: 'text',   placeholder: 'Publisher or manufacturer' },
    { key: 'Pages',      type: 'text',   placeholder: 'Number of pages (books/notebooks)' },
    { key: 'Dimensions', type: 'text',   placeholder: 'W × H in cm' },
  ],

  'Baby & Kids': [
    { key: 'Type',       type: 'select', options: ['Toy', 'Clothing', 'Feeding', 'Nursery', 'Carrier', 'Educational', 'Safety gear', 'Bath & care'] },
    { key: 'Age range',  type: 'select', options: ['0–6 months', '6–12 months', '1–2 years', '3–5 years', '6–8 years', '9–12 years', 'All ages'] },
    { key: 'Material',   type: 'text',   placeholder: 'e.g. BPA-free plastic, organic cotton' },
    { key: 'Condition',  type: 'select', options: ['New with tags', 'New without tags', 'Like New', 'Used — Excellent', 'Used — Good'] },
    { key: 'Safety cert',type: 'select', options: ['SNI certified', 'CE marked', 'ASTM compliant', 'None'] },
    { key: 'Origin',     type: 'text',   placeholder: 'e.g. Jakarta, Indonesia' },
  ],

  'Sports & Outdoors': [
    { key: 'Type',       type: 'select', options: ['Fitness equipment', 'Cycling', 'Running', 'Water sports', 'Camping', 'Climbing', 'Team sports', 'Racket sports', 'Yoga & Pilates'] },
    { key: 'Material',   type: 'text',   placeholder: 'e.g. Aluminium alloy, neoprene, carbon fibre' },
    { key: 'Size',       type: 'text',   placeholder: 'Dimensions or clothing size' },
    { key: 'Condition',  type: 'select', options: ['New — sealed', 'New — open box', 'Like New', 'Used — Excellent', 'Used — Good'] },
    { key: 'Brand',      type: 'text',   placeholder: 'e.g. Nike, Decathlon, Consina' },
    { key: 'Warranty',   type: 'select', options: ['No warranty', '1 month', '3 months', '6 months', '1 year'] },
    { key: 'Origin',     type: 'text',   placeholder: 'Country or city of origin' },
  ],
}

// Flat list of all known categories (for dropdowns / datalists)
export const ALL_CATEGORIES = Object.keys(CATEGORY_SPECS)
