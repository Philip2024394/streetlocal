/**
 * Voucher/Coupon Service
 * Sellers create discount codes, buyers apply at checkout.
 */

const STORAGE_KEY = 'indoo_vouchers'

// Demo vouchers
const DEMO_VOUCHERS = [
  { code: 'WELCOME10', sellerId: 'seller-2', sellerName: 'Kulit Asli', discountPercent: 10, minOrder: 100000, maxUses: 50, used: 12, expiresAt: Date.now() + 30 * 24 * 3600000, active: true },
  { code: 'FLASH25', sellerId: 'seller-1', sellerName: 'SoundMax', discountPercent: 25, minOrder: 200000, maxUses: 20, used: 8, expiresAt: Date.now() + 7 * 24 * 3600000, active: true },
  { code: 'NEWBUYER', sellerId: null, sellerName: 'Indoo Market', discountPercent: 15, minOrder: 50000, maxUses: 100, used: 45, expiresAt: Date.now() + 14 * 24 * 3600000, active: true },
]

export function getVouchers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? DEMO_VOUCHERS
  } catch { return DEMO_VOUCHERS }
}

export function saveVouchers(vouchers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers))
}

export function createVoucher({ code, sellerId, sellerName, discountPercent, minOrder, maxUses, expiresAt }) {
  const vouchers = getVouchers()
  if (vouchers.find(v => v.code.toUpperCase() === code.toUpperCase())) {
    return { error: 'Code already exists' }
  }
  vouchers.push({
    code: code.toUpperCase(),
    sellerId, sellerName,
    discountPercent: Number(discountPercent),
    minOrder: Number(minOrder) || 0,
    maxUses: Number(maxUses) || 999,
    used: 0,
    expiresAt: expiresAt ?? Date.now() + 30 * 24 * 3600000,
    active: true,
  })
  saveVouchers(vouchers)
  return { success: true }
}

export function validateVoucher(code, orderTotal, sellerId) {
  const vouchers = getVouchers()
  const v = vouchers.find(vc => vc.code.toUpperCase() === code.toUpperCase() && vc.active)
  if (!v) return { valid: false, error: 'Invalid voucher code' }
  if (v.expiresAt < Date.now()) return { valid: false, error: 'Voucher has expired' }
  if (v.used >= v.maxUses) return { valid: false, error: 'Voucher fully redeemed' }
  if (v.sellerId && v.sellerId !== sellerId) return { valid: false, error: 'Voucher not valid for this seller' }
  if (orderTotal < v.minOrder) return { valid: false, error: `Min order Rp ${v.minOrder.toLocaleString('id-ID')}` }
  const discount = Math.round(orderTotal * (v.discountPercent / 100))
  return { valid: true, voucher: v, discount, discountPercent: v.discountPercent }
}

export function redeemVoucher(code) {
  const vouchers = getVouchers()
  const v = vouchers.find(vc => vc.code.toUpperCase() === code.toUpperCase())
  if (v) v.used++
  saveVouchers(vouchers)
}

export function getSellerVouchers(sellerId) {
  return getVouchers().filter(v => v.sellerId === sellerId)
}

export function deleteVoucher(code) {
  const vouchers = getVouchers().filter(v => v.code !== code)
  saveVouchers(vouchers)
}

export function fmtIDR(n) {
  if (!n) return 'Rp 0'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
