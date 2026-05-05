import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Deal Hunt — data layer
// All functions gracefully return demo data when Supabase is null / missing table
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateVoucher() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
}

function endOfDay() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function expiresAtForDealType(dealType) {
  if (dealType === 'eat_in') return endOfDay()
  if (dealType === 'delivery') return daysFromNow(7)
  return daysFromNow(3) // pickup
}

const MIN_DISCOUNT_BY_CATEGORY = {
  food: 10,
  massage: 10,
  marketplace: 10,
  rentals: 5,
  rides: 3,
  property_sale: 2.5,
  property_rental: 5,
  cars_sale: 3,
  bikes_sale: 3,
  trucks_sale: 3,
  audio: 10,
  fashion: 10,
  event: 10,
}
const DEFAULT_MIN_DISCOUNT = 10

/** Get minimum discount % for a category */
export function getMinDiscount(category, isSale = false) {
  if (category === 'Property' && isSale) return MIN_DISCOUNT_BY_CATEGORY.property_sale
  if (category === 'Property') return MIN_DISCOUNT_BY_CATEGORY.property_rental
  if (['Cars', 'Motorcycles', 'Trucks'].includes(category) && isSale) return MIN_DISCOUNT_BY_CATEGORY[`${category === 'Cars' ? 'cars' : category === 'Motorcycles' ? 'bikes' : 'trucks'}_sale`]
  const key = category?.toLowerCase().replace(/\s+/g, '_')
  return MIN_DISCOUNT_BY_CATEGORY[key] || DEFAULT_MIN_DISCOUNT
}

// ── Demo deals ──────────────────────────────────────────────────────────────

const DEMO_DEALS = [
  {
    id: 'deal-1', seller_id: 'demo-seller-1', domain: 'food', sub_category: 'nasi',
    title: 'Nasi Goreng Spesial Pak Budi', description: 'Nasi goreng seafood jumbo + es teh manis. Porsi besar, rasa mantap!',
    original_price: 45000, deal_price: 25000, discount_pct: 44.4,
    quantity_available: 20, quantity_claimed: 12, quantity_per_user: 2,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(3),
    redemption_method: 'qr', terms: 'Berlaku untuk dine-in saja. Tidak bisa digabung promo lain.',
    status: 'active', seller_name: 'Warung Pak Budi', seller_photo: null, seller_rating: 4.8,
    city: 'Jakarta', lat: -6.2088, lng: 106.8456, view_count: 342, claim_count: 12, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-2', seller_id: 'demo-seller-2', domain: 'food', sub_category: 'minuman',
    title: 'Kopi Susu Gula Aren 1L', description: 'Kopi susu gula aren fresh, botol 1 liter. Arabika Toraja pilihan.',
    original_price: 65000, deal_price: 35000, discount_pct: 46.2,
    quantity_available: 50, quantity_claimed: 31, quantity_per_user: 3,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(5),
    redemption_method: 'voucher', terms: 'Ambil di outlet. Berlaku semua cabang Jakarta.',
    status: 'active', seller_name: 'Kopi Kenangan Lokal', seller_photo: null, seller_rating: 4.6,
    city: 'Jakarta', lat: -6.1751, lng: 106.8650, view_count: 578, claim_count: 31, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-3', seller_id: 'demo-seller-3', domain: 'marketplace', sub_category: 'fashion',
    title: 'Kaos Polos Premium Cotton 30s', description: 'Kaos polos bahan cotton combed 30s. Tersedia ukuran S-XXL, 12 warna.',
    original_price: 120000, deal_price: 59000, discount_pct: 50.8,
    quantity_available: 100, quantity_claimed: 67, quantity_per_user: 5,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(6),
    redemption_method: 'chat', terms: 'Gratis ongkir Jabodetabek. Tukar ukuran 1x gratis.',
    status: 'active', seller_name: 'Toko Baju Murah', seller_photo: null, seller_rating: 4.5,
    city: 'Bandung', lat: -6.9175, lng: 107.6191, view_count: 1203, claim_count: 67, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-4', seller_id: 'demo-seller-4', domain: 'massage', sub_category: 'full_body',
    title: 'Full Body Massage 90 Menit', description: 'Pijat seluruh badan 90 menit oleh terapis bersertifikat. Termasuk aromaterapi.',
    original_price: 350000, deal_price: 175000, discount_pct: 50.0,
    quantity_available: 10, quantity_claimed: 6, quantity_per_user: 1,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(4),
    redemption_method: 'voucher', terms: 'Booking via chat minimal H-1. Berlaku Senin-Jumat.',
    status: 'active', seller_name: 'Relax Spa Bali', seller_photo: null, seller_rating: 4.9,
    city: 'Denpasar', lat: -8.6500, lng: 115.2167, view_count: 189, claim_count: 6, is_hot: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-5', seller_id: 'demo-seller-5', domain: 'rentals', sub_category: 'motor',
    title: 'Sewa Motor Harian Honda Vario', description: 'Sewa motor Honda Vario 125cc per hari. Helm & jas hujan included.',
    original_price: 100000, deal_price: 55000, discount_pct: 45.0,
    quantity_available: 8, quantity_claimed: 3, quantity_per_user: 1,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(7),
    redemption_method: 'chat', terms: 'KTP/paspor sebagai jaminan. Bensin tanggung sendiri.',
    status: 'active', seller_name: 'Bali Motor Rental', seller_photo: null, seller_rating: 4.3,
    city: 'Kuta', lat: -8.7180, lng: 115.1690, view_count: 95, claim_count: 3, is_hot: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-6', seller_id: 'demo-seller-6', domain: 'rides', sub_category: 'airport',
    title: 'Antar Jemput Bandara Ngurah Rai', description: 'Layanan antar-jemput bandara. Mobil AC, driver ramah, free WiFi.',
    original_price: 250000, deal_price: 125000, discount_pct: 50.0,
    quantity_available: 15, quantity_claimed: 9, quantity_per_user: 2,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(8),
    redemption_method: 'chat', terms: 'Booking minimal 3 jam sebelum. Area Kuta/Seminyak/Ubud.',
    status: 'active', seller_name: 'Bali Driver Pro', seller_photo: null, seller_rating: 4.7,
    city: 'Denpasar', lat: -8.7467, lng: 115.1708, view_count: 267, claim_count: 9, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-7', seller_id: 'demo-seller-7', domain: 'food', sub_category: 'bakso',
    title: 'Bakso Urat Jumbo Isi 10', description: 'Bakso urat sapi asli, frozen, isi 10 butir. Bumbu kuah spesial included.',
    original_price: 85000, deal_price: 49000, discount_pct: 42.4,
    quantity_available: 30, quantity_claimed: 18, quantity_per_user: 3,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(2),
    redemption_method: 'qr', terms: 'Ambil di toko. Simpan freezer tahan 3 bulan.',
    status: 'active', seller_name: 'Bakso Mas Joko', seller_photo: null, seller_rating: 4.4,
    city: 'Surabaya', lat: -7.2575, lng: 112.7521, view_count: 412, claim_count: 18, is_hot: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-8', seller_id: 'demo-seller-8', domain: 'marketplace', sub_category: 'elektronik',
    title: 'TWS Earbuds Bluetooth 5.3', description: 'Earbuds wireless bass tebal, baterai 30 jam, waterproof IPX5.',
    original_price: 450000, deal_price: 199000, discount_pct: 55.8,
    quantity_available: 25, quantity_claimed: 19, quantity_per_user: 2,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(4),
    redemption_method: 'voucher', terms: 'Garansi 6 bulan. Gratis ongkir seluruh Indonesia.',
    status: 'active', seller_name: 'Gadget Murah ID', seller_photo: null, seller_rating: 4.2,
    city: 'Jakarta', lat: -6.2000, lng: 106.8166, view_count: 834, claim_count: 19, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-9', seller_id: 'demo-seller-9', domain: 'massage', sub_category: 'reflexology',
    title: 'Refleksi Kaki 60 Menit', description: 'Pijat refleksi kaki tradisional Jawa. Terapis pengalaman 10+ tahun.',
    original_price: 150000, deal_price: 75000, discount_pct: 50.0,
    quantity_available: 12, quantity_claimed: 5, quantity_per_user: 1,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(5),
    redemption_method: 'voucher', terms: 'Walk-in atau booking. Berlaku setiap hari.',
    status: 'active', seller_name: 'Pijat Sehat Yogya', seller_photo: null, seller_rating: 4.8,
    city: 'Yogyakarta', lat: -7.7956, lng: 110.3695, view_count: 156, claim_count: 5, is_hot: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-10', seller_id: 'demo-seller-10', domain: 'rentals', sub_category: 'villa',
    title: 'Villa Private Pool 2BR Ubud', description: 'Villa private pool 2 kamar tidur, view sawah. Sarapan included.',
    original_price: 1500000, deal_price: 750000, discount_pct: 50.0,
    quantity_available: 3, quantity_claimed: 1, quantity_per_user: 1,
    images: [], start_time: new Date().toISOString(), end_time: hoursFromNow(6),
    redemption_method: 'chat', terms: 'Minimal 2 malam. Berlaku weekday only. Check-in 14:00.',
    status: 'active', seller_name: 'Ubud Villa Escape', seller_photo: null, seller_rating: 4.9,
    city: 'Ubud', lat: -8.5069, lng: 115.2625, view_count: 523, claim_count: 1, is_hot: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

// ── Demo reviews ────────────────────────────────────────────────────────────

const DEMO_REVIEWS = [
  { id: 'r1', deal_title: 'Nasi Goreng Spesial', seller_id: 's1', stars: 5, photo_url: 'https://picsum.photos/seed/rev1/200/200', caption: 'Enak banget! Porsi besar', reviewer_name: 'Sari', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'r2', deal_title: 'Nasi Goreng Spesial', seller_id: 's1', stars: 4, photo_url: 'https://picsum.photos/seed/rev2/200/200', caption: 'Sambalnya mantap', reviewer_name: 'Budi', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'r3', deal_title: 'Leather Wallet Handmade', seller_id: 's2', stars: 5, photo_url: 'https://picsum.photos/seed/rev3/200/200', caption: 'Kualitas kulit bagus', reviewer_name: 'Rina', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 'r4', deal_title: 'Bakso Jumbo + Es Teh', seller_id: 's5', stars: 5, photo_url: 'https://picsum.photos/seed/rev4/200/200', caption: 'Bakso terenak di Semarang!', reviewer_name: 'Agus', created_at: new Date(Date.now() - 345600000).toISOString() },
  { id: 'r5', deal_title: 'Full Body Massage 90min', seller_id: 's3', stars: 4, photo_url: 'https://picsum.photos/seed/rev5/200/200', caption: 'Relax banget, recommended', reviewer_name: 'Dewi', created_at: new Date(Date.now() - 432000000).toISOString() },
]

// In-memory demo claims store
let demoClaims = []

// ── Fetch active deals ──────────────────────────────────────────────────────

export async function fetchActiveDeals({ domain, sort, search, limit = 20, offset = 0 } = {}) {
  if (!supabase) {
    let filtered = [...DEMO_DEALS]
    if (domain) filtered = filtered.filter(d => d.domain === domain)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.seller_name?.toLowerCase().includes(q)
      )
    }
    if (sort === 'end_time')     filtered.sort((a, b) => new Date(a.end_time) - new Date(b.end_time))
    if (sort === 'discount_pct') filtered.sort((a, b) => b.discount_pct - a.discount_pct)
    if (sort === 'deal_price')   filtered.sort((a, b) => a.deal_price - b.deal_price)
    return filtered.slice(offset, offset + limit)
  }

  try {
    let q = supabase
      .from('deals')
      .select('*')
      .eq('status', 'active')
      .gte('end_time', new Date().toISOString())

    if (domain) q = q.eq('domain', domain)
    if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%,seller_name.ilike.%${search}%`)

    if (sort === 'end_time')     q = q.order('end_time', { ascending: true })
    else if (sort === 'discount_pct') q = q.order('discount_pct', { ascending: false })
    else if (sort === 'deal_price')   q = q.order('deal_price', { ascending: true })
    else q = q.order('created_at', { ascending: false })

    q = q.range(offset, offset + limit - 1)

    const { data, error } = await q
    if (error || !data?.length) return DEMO_DEALS.slice(0, limit)
    return data
  } catch {
    return DEMO_DEALS.slice(0, limit)
  }
}

// ── Fetch single deal ───────────────────────────────────────────────────────

export async function fetchDealById(id) {
  if (!supabase) {
    return DEMO_DEALS.find(d => d.id === id) ?? null
  }

  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return DEMO_DEALS.find(d => d.id === id) ?? null
    return data
  } catch {
    return DEMO_DEALS.find(d => d.id === id) ?? null
  }
}

// ── Create deal ─────────────────────────────────────────────────────────────

export async function createDeal(dealData) {
  // Validate minimum discount per category
  const minDiscount = MIN_DISCOUNT_BY_CATEGORY[dealData.domain] || DEFAULT_MIN_DISCOUNT
  if (dealData.discount_pct != null && dealData.discount_pct < minDiscount) {
    throw new Error(`Minimum diskon untuk ${dealData.domain} adalah ${minDiscount}%`)
  }

  // Ensure deal_type is set
  const dealType = dealData.deal_type || 'pickup'

  if (!supabase) {
    const newDeal = {
      id: 'deal-' + Date.now(),
      ...dealData,
      deal_type: dealType,
      quantity_claimed: 0,
      view_count: 0,
      claim_count: 0,
      is_hot: false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    DEMO_DEALS.push(newDeal)
    return newDeal
  }

  try {
    const { data, error } = await supabase
      .from('deals')
      .insert({ ...dealData, deal_type: dealType })
      .select()
      .single()
    if (error) throw error
    return data
  } catch (e) {
    console.warn('[dealService] createDeal failed', e)
    return null
  }
}

// ── Create deal from a listing (property, car, rental, etc.) ────────────────

export async function createDealFromListing({ listing, discountPct, category, isSale }) {
  const minPct = getMinDiscount(category, isSale)
  if (discountPct < minPct) throw new Error(`Minimum discount for ${category} is ${minPct}%`)

  const originalPrice = isSale
    ? Number(String(typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now || 0).replace(/\./g, ''))
    : listing.price_month || listing.price_day || 0
  const dealPrice = Math.round(originalPrice * (1 - discountPct / 100))

  const domain = category === 'Property' ? (isSale ? 'property_sale' : 'rentals')
    : ['Cars', 'Motorcycles', 'Trucks'].includes(category) ? 'rides'
    : 'marketplace'

  return createDeal({
    title: listing.title,
    description: listing.description || `${discountPct}% off — ${listing.title}`,
    domain,
    sub_category: listing.sub_category || category,
    original_price: originalPrice,
    deal_price: dealPrice,
    discount_pct: discountPct,
    quantity_available: 1,
    image: listing.images?.[0] || listing.image || null,
    images: listing.images || [],
    seller_name: listing.ownerName || 'Owner',
    seller_id: listing.owner_id || null,
    city: listing.city || '',
    end_time: daysFromNow(7),
    deal_type: 'pickup',
    listing_ref: listing.ref || listing.id,
    listing_category: category,
  })
}

// ── Claim deal ──────────────────────────────────────────────────────────────

export async function claimDeal(dealId, buyerId) {
  if (!supabase) {
    const deal = DEMO_DEALS.find(d => d.id === dealId)
    if (!deal) return { error: 'Deal tidak ditemukan' }
    if (deal.status !== 'active') return { error: 'Deal sudah tidak aktif' }
    if (deal.quantity_claimed >= deal.quantity_available) return { error: 'Deal sudah habis' }

    const buyerClaims = demoClaims.filter(c => c.deal_id === dealId && c.buyer_id === buyerId && c.status === 'active')
    if (buyerClaims.length >= deal.quantity_per_user) return { error: 'Sudah mencapai batas klaim' }

    const claim = {
      id: 'claim-' + Date.now(),
      deal_id: dealId,
      buyer_id: buyerId,
      voucher_code: generateVoucher(),
      status: 'active',
      claimed_at: new Date().toISOString(),
      redeemed_at: null,
      expires_at: expiresAtForDealType(deal.deal_type),
      ...(deal.deal_type === 'eat_in' ? { is_eat_in: true } : {}),
    }
    demoClaims.push(claim)
    deal.quantity_claimed += 1
    deal.claim_count += 1
    return { claim }
  }

  try {
    // Check availability
    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .select('quantity_available, quantity_claimed, quantity_per_user, end_time, status, deal_type')
      .eq('id', dealId)
      .single()
    if (dealErr || !deal) return { error: 'Deal tidak ditemukan' }
    if (deal.status !== 'active') return { error: 'Deal sudah tidak aktif' }
    if (deal.quantity_claimed >= deal.quantity_available) return { error: 'Deal sudah habis' }

    // Check per-user limit
    const { count } = await supabase
      .from('deal_claims')
      .select('id', { count: 'exact', head: true })
      .eq('deal_id', dealId)
      .eq('buyer_id', buyerId)
      .eq('status', 'active')
    if ((count ?? 0) >= deal.quantity_per_user) return { error: 'Sudah mencapai batas klaim' }

    // Insert claim
    const voucherCode = generateVoucher()
    const claimInsert = {
      deal_id: dealId,
      buyer_id: buyerId,
      voucher_code: voucherCode,
      expires_at: expiresAtForDealType(deal.deal_type),
    }
    if (deal.deal_type === 'eat_in') claimInsert.is_eat_in = true
    const { data: claim, error: claimErr } = await supabase
      .from('deal_claims')
      .insert(claimInsert)
      .select()
      .single()
    if (claimErr) throw claimErr

    // Increment quantity_claimed + claim_count
    await supabase
      .from('deals')
      .update({
        quantity_claimed: deal.quantity_claimed + 1,
        claim_count: (deal.claim_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)

    return { claim }
  } catch (e) {
    console.warn('[dealService] claimDeal failed', e)
    return { error: 'Gagal klaim deal' }
  }
}

// ── Cancel claim (within 15 min) ────────────────────────────────────────────

export async function cancelClaim(claimId) {
  if (!supabase) {
    const claim = demoClaims.find(c => c.id === claimId)
    if (!claim) return { error: 'Klaim tidak ditemukan' }
    const elapsed = Date.now() - new Date(claim.claimed_at).getTime()
    if (elapsed > 15 * 60 * 1000) return { error: 'Batas waktu pembatalan 15 menit sudah lewat' }
    claim.status = 'cancelled'
    const deal = DEMO_DEALS.find(d => d.id === claim.deal_id)
    if (deal) {
      deal.quantity_claimed = Math.max(0, deal.quantity_claimed - 1)
      deal.claim_count = Math.max(0, deal.claim_count - 1)
    }
    return { success: true }
  }

  try {
    const { data: claim, error: fetchErr } = await supabase
      .from('deal_claims')
      .select('*')
      .eq('id', claimId)
      .single()
    if (fetchErr || !claim) return { error: 'Klaim tidak ditemukan' }

    const elapsed = Date.now() - new Date(claim.claimed_at).getTime()
    if (elapsed > 15 * 60 * 1000) return { error: 'Batas waktu pembatalan 15 menit sudah lewat' }

    const { error: updateErr } = await supabase
      .from('deal_claims')
      .update({ status: 'cancelled' })
      .eq('id', claimId)
    if (updateErr) throw updateErr

    // Restore quantity
    const { data: deal } = await supabase
      .from('deals')
      .select('quantity_claimed, claim_count')
      .eq('id', claim.deal_id)
      .single()
    if (deal) {
      await supabase
        .from('deals')
        .update({
          quantity_claimed: Math.max(0, deal.quantity_claimed - 1),
          claim_count: Math.max(0, (deal.claim_count ?? 0) - 1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.deal_id)
    }

    return { success: true }
  } catch (e) {
    console.warn('[dealService] cancelClaim failed', e)
    return { error: 'Gagal membatalkan klaim' }
  }
}

// ── Fetch buyer's claimed deals ─────────────────────────────────────────────

export async function fetchMyDeals(buyerId) {
  if (!supabase) {
    return demoClaims
      .filter(c => c.buyer_id === buyerId)
      .map(c => ({
        ...c,
        deal: DEMO_DEALS.find(d => d.id === c.deal_id) ?? null,
      }))
  }

  try {
    const { data, error } = await supabase
      .from('deal_claims')
      .select('*, deal:deal_id (*)')
      .eq('buyer_id', buyerId)
      .order('claimed_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

// ── Fetch seller's deals ────────────────────────────────────────────────────

export async function fetchSellerDeals(sellerId) {
  if (!supabase) {
    return DEMO_DEALS.filter(d => d.seller_id === sellerId)
  }

  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

// ── Redeem deal ─────────────────────────────────────────────────────────────

export async function redeemDeal(claimId) {
  if (!supabase) {
    const claim = demoClaims.find(c => c.id === claimId)
    if (!claim) return { error: 'Klaim tidak ditemukan' }
    if (claim.status !== 'active') return { error: 'Klaim sudah tidak aktif' }
    claim.status = 'redeemed'
    claim.redeemed_at = new Date().toISOString()
    return { success: true }
  }

  try {
    const { data: claim, error: fetchErr } = await supabase
      .from('deal_claims')
      .select('status')
      .eq('id', claimId)
      .single()
    if (fetchErr || !claim) return { error: 'Klaim tidak ditemukan' }
    if (claim.status !== 'active') return { error: 'Klaim sudah tidak aktif' }

    const { error } = await supabase
      .from('deal_claims')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('id', claimId)
    if (error) throw error

    return { success: true }
  } catch (e) {
    console.warn('[dealService] redeemDeal failed', e)
    return { error: 'Gagal redeem deal' }
  }
}

// ── Auto-redeem via geofence ───────────────────────────────────────────────

export async function autoRedeemByLocation(claimId) {
  if (!supabase) return { success: true, method: 'geofence' }
  const { error } = await supabase.from('deal_claims')
    .update({ status: 'redeemed', redeemed_at: new Date().toISOString(), redeem_method: 'geofence' })
    .eq('id', claimId)
    .eq('status', 'active')
  return { success: !error, method: 'geofence' }
}

// ── Restore expired vouchers back to deal quantity ─────────────────────────

export async function restoreExpiredVouchers() {
  if (!supabase) return
  const { data: expired } = await supabase.from('deal_claims')
    .select('id, deal_id')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
  if (!expired?.length) return
  for (const claim of expired) {
    await supabase.from('deal_claims').update({ status: 'expired' }).eq('id', claim.id)
    await supabase.rpc('decrement_deal_claimed', { p_deal_id: claim.deal_id })
  }
}

// ── Fetch reviews for a deal (by title + seller, so reviews carry over when deal is reposted) ──

export async function fetchDealReviews(dealTitle, sellerId) {
  if (!supabase) return DEMO_REVIEWS.filter(r => r.deal_title === dealTitle)
  const { data } = await supabase.from('deal_reviews')
    .select('*')
    .eq('deal_title', dealTitle)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

// ── Submit a review ─────────────────────────────────────────────────────────

export async function submitDealReview({ dealId, dealTitle, sellerId, reviewerId, reviewerName, stars, photoUrl, caption }) {
  if (!supabase) return { id: `r-${Date.now()}`, deal_title: dealTitle, stars, photo_url: photoUrl, caption, reviewer_name: reviewerName, created_at: new Date().toISOString() }
  const { data, error } = await supabase.from('deal_reviews').insert({
    deal_id: dealId, deal_title: dealTitle, seller_id: sellerId,
    reviewer_id: reviewerId, reviewer_name: reviewerName,
    stars, photo_url: photoUrl, caption,
  }).select().single()
  if (error) throw error
  return data
}
