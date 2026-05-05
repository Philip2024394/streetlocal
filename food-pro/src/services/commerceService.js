import { supabase } from '@/lib/supabase'
import { recordCommission } from './commissionService'
import { processCommission } from './walletService'

// ─────────────────────────────────────────────────────────────────────────────
// ECHO Commerce — data layer
// All functions gracefully return demo data on Supabase error / missing table
// ─────────────────────────────────────────────────────────────────────────────

// ── Demo fallbacks ──────────────────────────────────────────────────────────
export const DEMO_PRODUCTS = [
  {
    id: 'demo-1', name: 'Wireless Earbuds Pro', price: 350000, currency: 'IDR',
    category: 'electronics', stock: 12, active: true, isNew: true, condition: 'new',
    weight_grams: 250, dimensions: '8 x 6 x 4 cm',
    dispatch_time: '1-2 business days', brand_name: 'SoundMax',
    safeTrade: { enabled: true, paypal: true, escrow: true },
    flashSale: { active: true, discountPercent: 25, endsAt: Date.now() + 6 * 60 * 60 * 1000 },
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaa.png',
    description: 'Crystal clear sound, 24hr battery, IPX5 waterproof. Compatible with Android & iOS.',
    specs: {
      new_or_used:       'Brand New',
      stock:             '12',
      made_in:           'China',
      year_manufactured: '2025',
      market_scope:      'Local & Export Market',
      child_certified:   'Not Applicable',
      eu_certification:  'CE Marked',
      brand:             'SoundMax',
      model:             'EarPods X3',
      condition:         'New',
      warranty:          '12 months',
      storage:           'N/A',
      battery:           '24hr playback, fast charge',
      connectivity:      'Bluetooth 5.3, USB-C charging',
      includes:          'Earbuds, charging case, USB-C cable, 3 ear tip sizes, manual',
    },
    variants: {
      color: ['Black', 'White', 'Navy'],
    },
  },
  {
    id: 'demo-2', name: 'Leather Crossbody Bag', weight_grams: 650, dimensions: '26 x 18 x 8 cm', price: 1200000, currency: 'IDR',
    category: 'bags', stock: 5, active: true, isNew: true, condition: 'new',
    dispatch_time: '2-3 business days', brand_name: 'Kulit Asli',
    flashSale: { active: true, discountPercent: 30, endsAt: Date.now() + 8 * 60 * 60 * 1000 },
    safeTrade: { enabled: true, paypal: true, escrow: false },
    custom_branding: 'Yes — Custom packaging',
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaasss.png',
    description: 'Genuine full-grain leather, brass hardware, adjustable strap. Handcrafted in Jakarta.',
    specs: {
      new_or_used:       'Brand New',
      stock:             '5',
      custom_order:      'Yes — Custom Design Available',
      made_in:           'Indonesia',
      year_manufactured: '2025',
      market_scope:      'Local & Export Market',
      child_certified:   'Not Applicable',
      eu_certification:  'REACH Compliant',
      material:          'Genuine Leather',
      brand:             'Luxe Leather Studio',
      style:             'Crossbody',
      condition:         'New',
      dimensions:        '26 × 18 × 8 cm',
      closure:           'Magnetic',
      strap:             'Adjustable 55-120cm',
      origin:            'Jakarta, Indonesia',
    },
    variants: {
      color: [
        { label: 'Tan',        image: 'https://ik.imagekit.io/nepgaxllc/UntitledxcvzcvzxcvzxcASDASDfasdfsd.png' },
        { label: 'Black',      image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png' },
        { label: 'Cognac',     image: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png' },
        { label: 'Dark Brown', image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasdaasdasd.png' },
      ],
    },
  },
  {
    id: 'demo-3', name: 'Leather Tote Bag', price: 850000, currency: 'IDR',
    category: 'bags', stock: 8, active: true, condition: 'like_new', dispatch_time: '3-5 business days', brand_name: 'Kulit Asli',
    flashSale: { active: true, discountPercent: 20, endsAt: Date.now() + 5 * 60 * 60 * 1000 },
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxc.png',
    description: 'Spacious tote in full-grain leather. Perfect for work or weekend. Handcrafted in Bali.',
    specs: {
      new_or_used:       'Brand New',
      stock:             '8',
      custom_order:      'Yes — Made to Order',
      made_in:           'Indonesia',
      year_manufactured: '2025',
      market_scope:      'Local & Export Market',
      child_certified:   'Not Applicable',
      eu_certification:  'None',
      material:          'Genuine Leather',
      brand:             'Luxe Leather Studio',
      style:             'Tote',
      condition:         'New',
      dimensions:        '38 × 30 × 14 cm',
      closure:           'Open top',
      strap:             'Top handles, 22cm drop',
      origin:            'Bali, Indonesia',
    },
    variants: {
      color: ['Tan', 'Black', 'Cognac'],
    },
  },
  {
    id: 'demo-4', name: 'Slim Card Wallet', price: 320000, currency: 'IDR',
    category: 'bags', stock: 20, active: true, isNew: true, condition: 'new', dispatch_time: 'Same day', brand_name: 'Kulit Asli',
    flashSale: { active: true, discountPercent: 15, endsAt: Date.now() + 3 * 60 * 60 * 1000 },
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasda.png',
    description: 'Slim genuine leather card wallet. Holds 6 cards + cash pocket.',
    specs: {
      new_or_used:       'Brand New',
      stock:             '20',
      custom_order:      'Yes — Custom Design Available',
      made_in:           'Indonesia',
      year_manufactured: '2025',
      market_scope:      'Local & Export Market',
      child_certified:   'Not Applicable',
      eu_certification:  'None',
      material:          'Genuine Leather',
      brand:             'Luxe Leather Studio',
      style:             'Wallet',
      condition:         'New',
      dimensions:        '10 × 7 × 0.6 cm',
      closure:           'Open top',
      origin:            'Jakarta, Indonesia',
    },
    variants: {
      color: [
        { label: 'Black',  image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png' },
        { label: 'Tan',    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasdaasdasd.png' },
        { label: 'Brown',  image: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png' },
      ],
    },
  },
  {
    id: 'demo-5', name: 'Bifold Leather Wallet', price: 450000, currency: 'IDR',
    category: 'bags', stock: 15, active: true, condition: 'good', dispatch_time: '1 business day', brand_name: 'Kulit Asli',
    flashSale: { active: true, discountPercent: 35, endsAt: Date.now() + 4 * 60 * 60 * 1000 },
    image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasdadfssdf.png',
    description: 'Classic bifold with 8 card slots, ID window and bill compartment.',
    specs: {
      new_or_used:       'Brand New',
      stock:             '15',
      custom_order:      'No',
      made_in:           'Indonesia',
      year_manufactured: '2025',
      market_scope:      'Local Market Only',
      child_certified:   'Not Applicable',
      eu_certification:  'None',
      material:          'Genuine Leather',
      brand:             'Luxe Leather Studio',
      style:             'Wallet',
      condition:         'New',
      dimensions:        '11 × 9.5 × 1.2 cm',
      closure:           'Open top',
      origin:            'Jakarta, Indonesia',
    },
    variants: {
      color: [
        { label: 'Black',  image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png' },
        { label: 'Cognac', image: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png' },
      ],
    },
  },
  {
    id: 'demo-6', name: 'Leather Keychain', price: 95000, currency: 'IDR',
    category: 'handmade', stock: 40, active: true, condition: 'fair', dispatch_time: '2-4 weeks (made to order)',
    flashSale: { active: true, discountPercent: 40, endsAt: Date.now() + 2 * 60 * 60 * 1000 },
    custom_branding: 'Yes — Logo printing available',
    image: 'https://ik.imagekit.io/nepgaxllc/Untitledzxczxczxczx.png',
    description: 'Hand-stitched leather keychain. Personalised initials available.',
    specs: {
      new_or_used:       'Brand New',
      stock:             '40',
      custom_order:      'Yes — Custom Design Available',
      made_in:           'Indonesia',
      year_manufactured: '2025',
      market_scope:      'Local & Export Market',
      child_certified:   'Not Applicable',
      eu_certification:  'None',
      material:          'Full-grain leather',
      made_by:           'Handmade',
      condition:         'New',
      dimensions:        '8 × 3 cm',
      weight:            '25g',
      customisable:      'Yes',
      lead_time:         '2-3 days',
      origin:            'Jakarta, Indonesia',
    },
    variants: {
      color: ['Tan', 'Black', 'Dark Brown'],
    },
  },
]

export const DEMO_ORDERS = [
  { id: 'ord-001', product: 'Wireless Earbuds Pro',     buyer: 'Sari M.',   qty: 1, total: 350000,  status: 'pending',   time: '2 min ago' },
  { id: 'ord-002', product: 'Leather Crossbody Bag',    buyer: 'Budi K.',   qty: 1, total: 1200000, status: 'confirmed', time: '14 min ago' },
  { id: 'ord-003', product: 'Aromatherapy Candle Set',  buyer: 'Dewi N.',   qty: 2, total: 370000,  status: 'shipped',   time: '1 hr ago' },
]

export const DEMO_STATS = {
  views: 342, cartAdds: 28, whatsappClicks: 19, orders: 7,
}

// ── Business profile ─────────────────────────────────────────────────────────
export async function fetchBusiness(userId) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error) return null
    return data
  } catch { return null }
}

export async function saveBusiness(userId, payload) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  } catch { return null }
}

// ── Products ─────────────────────────────────────────────────────────────────
export async function fetchProducts(userId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error || !data) return DEMO_PRODUCTS
    return data.length ? data : DEMO_PRODUCTS
  } catch { return DEMO_PRODUCTS }
}

export async function toggleProductActive(productId, active) {
  try {
    await supabase.from('products').update({ active }).eq('id', productId)
  } catch { /* noop */ }
}

export async function saveProduct(userId, product) {
  try {
    const payload = { ...product, user_id: userId }
    if (product.id && !product.id.startsWith('demo-')) {
      const { data } = await supabase.from('products').update(payload).eq('id', product.id).select().single()
      return data
    } else {
      const { id: _id, ...rest } = payload
      void _id
      const { data } = await supabase.from('products').insert(rest).select().single()
      return data
    }
  } catch { return null }
}

export async function deleteProduct(productId) {
  try {
    await supabase.from('products').delete().eq('id', productId)
  } catch { /* noop */ }
}

// ── Browse all products (buyer-facing) ───────────────────────────────────────
export async function fetchAllProducts({ condition } = {}) {
  try {
    let q = supabase
      .from('products')
      .select('*, seller:user_id ( display_name, brand_name, avatar_url, city )')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(100)
    if (condition === 'used') q = q.in('condition', ['like_new', 'good', 'fair', 'used'])
    else if (condition === 'new') q = q.eq('condition', 'new')
    const { data, error } = await q
    if (error || !data?.length) {
      const filtered = condition === 'used'
        ? DEMO_PRODUCTS.filter(p => p.condition && p.condition !== 'new')
        : condition === 'new'
        ? DEMO_PRODUCTS.filter(p => !p.condition || p.condition === 'new')
        : DEMO_PRODUCTS
      return filtered
    }
    return data
  } catch {
    const filtered = condition === 'used'
      ? DEMO_PRODUCTS.filter(p => p.condition && p.condition !== 'new')
      : DEMO_PRODUCTS
    return filtered
  }
}

// ── Orders ───────────────────────────────────────────────────────────────────
export async function fetchOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    if (error || !data) return DEMO_ORDERS
    return data.length ? data : DEMO_ORDERS
  } catch { return DEMO_ORDERS }
}

export async function updateOrderStatus(orderId, status, { sellerId, orderTotal } = {}) {
  try {
    await supabase?.from('orders').update({ status }).eq('id', orderId)

    // Record commission when order complete — new wallet system (10%)
    if (status === 'complete' && sellerId && orderTotal) {
      processCommission(sellerId, 'marketplace', orderId, orderTotal)
      await recordCommission(sellerId, orderId, orderTotal)
    }
  } catch { /* noop */ }
}

// ── Stats ────────────────────────────────────────────────────────────────────
export async function fetchStats(userId) {
  try {
    const { data, error } = await supabase
      .from('commerce_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error || !data) return DEMO_STATS
    return data
  } catch { return DEMO_STATS }
}
