/**
 * Promo Code Service — validates and applies promo codes & banners
 */

const PROMO_CODES = [
  { code: 'INDOO10', discount: 10, type: 'percent', minOrder: 25000, maxDiscount: 15000, label: 'INDOO Launch 10% Off', expires: '2026-12-31', usageLimit: 1 },
  { code: 'MAKAN50', discount: 50, type: 'percent', minOrder: 50000, maxDiscount: 25000, label: 'Half Price Feast!', expires: '2026-06-30', usageLimit: 1 },
  { code: 'GRATIS', discount: 0, type: 'free_delivery', minOrder: 30000, maxDiscount: 0, label: 'Free Delivery', expires: '2026-12-31', usageLimit: 3 },
  { code: 'HEMAT20', discount: 20000, type: 'flat', minOrder: 40000, maxDiscount: 20000, label: 'Rp 20.000 Off', expires: '2026-09-30', usageLimit: 2 },
  { code: 'WELCOME', discount: 15, type: 'percent', minOrder: 20000, maxDiscount: 20000, label: 'Welcome Bonus 15%', expires: '2027-12-31', usageLimit: 1, newUserOnly: true },
  { code: 'JUMAT25', discount: 25, type: 'percent', minOrder: 35000, maxDiscount: 30000, label: 'Friday Special 25%', expires: '2026-12-31', usageLimit: 1, dayOnly: 5 },
]

const PROMO_BANNERS = [
  {
    id: 'banner_launch',
    title: 'INDOO Launch Special',
    subtitle: 'Get 10% off your first 3 orders',
    code: 'INDOO10',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2006_04_21%20PM.png',
    color: '#8DC63F',
    active: true,
  },
  {
    id: 'banner_friday',
    title: 'Jumat Hemat',
    subtitle: 'Every Friday — 25% off all food orders',
    code: 'JUMAT25',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_36_12%20AM.png?updatedAt=1776710188384',
    color: '#FACC15',
    active: true,
  },
  {
    id: 'banner_feast',
    title: 'Half Price Feast',
    subtitle: 'Up to 50% off — limited time only',
    code: 'MAKAN50',
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_35_10%20AM.png?updatedAt=1776710128590',
    color: '#EF4444',
    active: true,
  },
  {
    id: 'banner_free_delivery',
    title: 'Free Delivery Week',
    subtitle: 'No delivery charge on orders above Rp 30.000',
    code: 'GRATIS',
    image: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237',
    color: '#3B82F6',
    active: true,
  },
]

function getAdminPromos() {
  try { return JSON.parse(localStorage.getItem('indoo_admin_promos') || '[]') } catch { return [] }
}

function getAllPromoCodes() {
  // Merge hardcoded promos with admin-created promos; admin codes override if duplicate
  const adminPromos = getAdminPromos()
  const merged = [...PROMO_CODES]
  for (const ap of adminPromos) {
    const idx = merged.findIndex(p => p.code === ap.code)
    if (idx >= 0) merged[idx] = ap
    else merged.push(ap)
  }
  return merged
}

function getUsedCodes() {
  return JSON.parse(localStorage.getItem('indoo_used_promos') || '{}')
}

function markCodeUsed(code) {
  const used = getUsedCodes()
  used[code] = (used[code] || 0) + 1
  localStorage.setItem('indoo_used_promos', JSON.stringify(used))
}

export function validatePromoCode(code, cartTotal) {
  const allCodes = getAllPromoCodes()
  const promo = allCodes.find(p => p.code === code.toUpperCase().trim())
  if (!promo) return { valid: false, error: 'Invalid promo code' }

  const now = new Date()
  if (new Date(promo.expires) < now) return { valid: false, error: 'This promo code has expired' }

  if (promo.dayOnly != null && now.getDay() !== promo.dayOnly) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    return { valid: false, error: `This code is only valid on ${days[promo.dayOnly]}` }
  }

  const used = getUsedCodes()
  if ((used[promo.code] || 0) >= promo.usageLimit) return { valid: false, error: 'You have already used this promo code' }

  if (cartTotal < promo.minOrder) return { valid: false, error: `Minimum order Rp ${promo.minOrder.toLocaleString('id-ID')} required` }

  // Calculate discount
  let discountAmount = 0
  if (promo.type === 'percent') {
    discountAmount = Math.min(Math.round(cartTotal * promo.discount / 100), promo.maxDiscount)
  } else if (promo.type === 'flat') {
    discountAmount = promo.discount
  }
  // free_delivery handled separately

  return {
    valid: true,
    promo,
    discountAmount,
    isFreeDelivery: promo.type === 'free_delivery',
    label: promo.label,
  }
}

export function applyPromoCode(code) {
  markCodeUsed(code.toUpperCase().trim())
}

export function getPromoBanners() {
  return PROMO_BANNERS.filter(b => b.active)
}

export function getPromoByCode(code) {
  return getAllPromoCodes().find(p => p.code === code.toUpperCase().trim()) ?? null
}
