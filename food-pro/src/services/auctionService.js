/**
 * Auction Service
 *
 * Rules:
 * - Seller sets: starting price, reserve (optional), Buy Now price (optional), time window (max 6hrs)
 * - Price INCLUDES delivery within Indonesia
 * - Tiered bid increments with MIN and MAX caps
 * - Buy Now: 5-minute payment window, auction pauses, non-payment = ban
 * - Winner has 1 hour to upload payment proof after auction ends
 * - Auction only truly completes when payment proof is received
 * - Non-payment = auction ban (30d / 90d / permanent)
 * - Admin takes 10% commission from final price
 * - Second chance goes to runner-up on forfeit
 */
import { supabase } from '@/lib/supabase'

// ── Commission rate ──────────────────────────────────────────────────────────
export const AUCTION_COMMISSION_RATE = 0.10 // 10%

// ── Tiered bid increments (min/max per bid) ──────────────────────────────────
const BID_TIERS = [
  { maxPrice: 50000,    minIncrement: 1000,  maxIncrement: 5000   },
  { maxPrice: 200000,   minIncrement: 2000,  maxIncrement: 10000  },
  { maxPrice: 500000,   minIncrement: 5000,  maxIncrement: 25000  },
  { maxPrice: 2000000,  minIncrement: 10000, maxIncrement: 50000  },
  { maxPrice: Infinity, minIncrement: 25000, maxIncrement: 100000 },
]

export function getBidLimits(currentPrice) {
  const tier = BID_TIERS.find(t => currentPrice < t.maxPrice) ?? BID_TIERS[BID_TIERS.length - 1]
  return { min: currentPrice + tier.minIncrement, max: currentPrice + tier.maxIncrement }
}

// Backward compat
export function getBidIncrement(currentPrice) {
  return getBidLimits(currentPrice).min - currentPrice
}

// ── Buy Now threshold — disappears at 80% of Buy Now price ───────────────────
export function isBuyNowAvailable(auction) {
  if (!auction.buyNowPrice) return false
  return auction.currentPrice < auction.buyNowPrice * 0.8
}

// ── Ban durations by offence count ───────────────────────────────────────────
const BAN_DURATIONS = { 1: 30 * 86400000, 2: 90 * 86400000 } // 3+ = permanent

export function getBanDuration(offenceCount) {
  if (offenceCount >= 3) return Infinity
  return BAN_DURATIONS[offenceCount] ?? 30 * 86400000
}

export function isAuctionBanned(profile) {
  if (!profile?.auctionBan) return false
  if (profile.auctionBan.permanent) return true
  if (!profile.auctionBan.until) return false
  return Date.now() < profile.auctionBan.until
}

// ── Auction statuses ─────────────────────────────────────────────────────────
export const AUCTION_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  PAUSED_BUY_NOW: 'paused_buy_now',    // Auction paused — Buy Now buyer has 5 min
  ENDED: 'ended',
  AWAITING_PAYMENT: 'awaiting_payment', // Winner has 1 hour
  PAID: 'paid',
  FORFEITED: 'forfeited',
  SECOND_CHANCE: 'second_chance',
  UNSOLD: 'unsold',
}

// ── Demo auctions ────────────────────────────────────────────────────────────
const now = Date.now()
export const DEMO_AUCTIONS = [
  {
    id: 'auc-1',
    productId: 'demo-1',
    productName: 'Wireless Earbuds Pro',
    productImage: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaa.png',
    description: 'Crystal clear sound, 24hr battery, IPX5 waterproof. Compatible with Android & iOS.',
    material: 'ABS Plastic, Silicone ear tips',
    weight: '250g', dimensions: '8 × 6 × 4 cm', condition: 'new', itemCondition: 'new_unused', rating: 4.5,
    sellerId: 'seller-1',
    sellerName: 'SoundMax',
    startPrice: 10000,
    reservePrice: 200000,
    buyNowPrice: 300000,
    currentPrice: 185000,
    bidCount: 24,
    startTime: now - 2 * 3600000,
    endTime: now + 4 * 3600000,
    pausedTimeLeft: null,
    status: AUCTION_STATUS.LIVE,
    deliveryIncluded: true,
    winnerId: null, winnerName: null, paymentDeadline: null,
    buyNowBuyerId: null, buyNowDeadline: null,
    commission: null,
    bids: [
      { id: 'b1', buyerId: 'u1', buyerName: 'Sarah M.', amount: 185000, time: now - 120000 },
      { id: 'b2', buyerId: 'u2', buyerName: 'Andi P.', amount: 175000, time: now - 300000 },
      { id: 'b3', buyerId: 'u3', buyerName: 'Dewi S.', amount: 160000, time: now - 600000 },
      { id: 'b4', buyerId: 'u4', buyerName: 'Budi R.', amount: 150000, time: now - 900000 },
    ],
  },
  {
    id: 'auc-2',
    productId: 'demo-4',
    productName: 'Slim Card Wallet',
    productImage: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasda.png',
    description: 'Slim genuine leather card wallet. Holds 6 cards + cash pocket. Handcrafted in Bali.',
    material: 'Genuine Leather',
    weight: '120g', dimensions: '10 × 7 × 1 cm', condition: 'new', itemCondition: 'new_unused', rating: 0,
    sellerId: 'seller-2',
    sellerName: 'Kulit Asli',
    startPrice: 5000,
    reservePrice: 150000,
    buyNowPrice: 280000,
    currentPrice: 95000,
    bidCount: 15,
    startTime: now - 1 * 3600000,
    endTime: now + 5 * 3600000,
    pausedTimeLeft: null,
    status: AUCTION_STATUS.LIVE,
    deliveryIncluded: true,
    winnerId: null, winnerName: null, paymentDeadline: null,
    buyNowBuyerId: null, buyNowDeadline: null,
    commission: null,
    bids: [
      { id: 'b6', buyerId: 'u2', buyerName: 'Andi P.', amount: 95000, time: now - 60000 },
      { id: 'b7', buyerId: 'u5', buyerName: 'Rina K.', amount: 85000, time: now - 180000 },
    ],
  },
  {
    id: 'auc-3',
    productId: 'demo-2',
    productName: 'Leather Crossbody Bag',
    productImage: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaasss.png',
    description: 'Genuine full-grain leather, brass hardware, adjustable strap. Handcrafted in Jakarta.',
    material: 'Genuine Leather',
    weight: '650g', dimensions: '26 × 18 × 8 cm', condition: 'new', itemCondition: 'new_unused', rating: 4.8,
    sellerId: 'seller-2',
    sellerName: 'Kulit Asli',
    startPrice: 50000,
    reservePrice: 800000,
    buyNowPrice: 1100000,
    currentPrice: 420000,
    bidCount: 18,
    startTime: now - 3 * 3600000,
    endTime: now + 3 * 3600000,
    pausedTimeLeft: null,
    status: AUCTION_STATUS.LIVE,
    deliveryIncluded: true,
    winnerId: null, winnerName: null, paymentDeadline: null,
    buyNowBuyerId: null, buyNowDeadline: null,
    commission: null,
    bids: [
      { id: 'b8', buyerId: 'u3', buyerName: 'Dewi S.', amount: 420000, time: now - 90000 },
      { id: 'b9', buyerId: 'u1', buyerName: 'Sarah M.', amount: 400000, time: now - 240000 },
      { id: 'b10', buyerId: 'u6', buyerName: 'Maya L.', amount: 375000, time: now - 480000 },
    ],
  },
  {
    id: 'auc-4',
    productId: 'demo-5',
    productName: 'Bifold Leather Wallet',
    productImage: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasdadfssdf.png',
    description: 'Classic bifold with 8 card slots, ID window and bill compartment.',
    material: 'Genuine Leather',
    weight: '150g', dimensions: '11 × 9.5 × 1.2 cm', condition: 'new', itemCondition: 'new_unused', rating: 4.2,
    sellerId: 'seller-2',
    sellerName: 'Kulit Asli',
    startPrice: 10000,
    reservePrice: 200000,
    buyNowPrice: 400000,
    currentPrice: 310000,
    bidCount: 32,
    startTime: now - 5 * 3600000,
    endTime: now - 1 * 3600000,
    pausedTimeLeft: null,
    status: AUCTION_STATUS.PAID,
    deliveryIncluded: true,
    winnerId: 'u3', winnerName: 'Dewi S.', paymentDeadline: null,
    buyNowBuyerId: null, buyNowDeadline: null,
    commission: 15500,
    bids: [
      { id: 'b11', buyerId: 'u3', buyerName: 'Dewi S.', amount: 310000, time: now - 1.1 * 3600000 },
      { id: 'b12', buyerId: 'u2', buyerName: 'Andi P.', amount: 295000, time: now - 1.3 * 3600000 },
      { id: 'b13', buyerId: 'u5', buyerName: 'Rina K.', amount: 280000, time: now - 1.5 * 3600000 },
    ],
  },
  {
    id: 'auc-5',
    productId: 'demo-6',
    productName: 'Leather Keychain',
    productImage: 'https://ik.imagekit.io/nepgaxllc/Untitledzxczxczxczx.png',
    description: 'Hand-stitched leather keychain. Personalised initials available.',
    material: 'Full-grain leather',
    weight: '25g', dimensions: '8 × 3 cm', condition: 'new', itemCondition: 'new_unused', rating: 4.0,
    sellerId: 'seller-2',
    sellerName: 'Kulit Asli',
    startPrice: 5000,
    reservePrice: 50000,
    buyNowPrice: 80000,
    currentPrice: 72000,
    bidCount: 14,
    startTime: now - 6 * 3600000,
    endTime: now - 2 * 3600000,
    pausedTimeLeft: null,
    status: AUCTION_STATUS.PAID,
    deliveryIncluded: true,
    winnerId: 'u1', winnerName: 'Sarah M.', paymentDeadline: null,
    buyNowBuyerId: null, buyNowDeadline: null,
    commission: 3600,
    bids: [
      { id: 'b14', buyerId: 'u1', buyerName: 'Sarah M.', amount: 72000, time: now - 2.2 * 3600000 },
      { id: 'b15', buyerId: 'u4', buyerName: 'Budi R.', amount: 65000, time: now - 2.5 * 3600000 },
    ],
  },
]

// ── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'indoo_auctions'

export function getAuctions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? DEMO_AUCTIONS }
  catch { return DEMO_AUCTIONS }
}

export function saveAuctions(auctions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auctions))
}

// ── Create auction ───────────────────────────────────────────────────────────
export function createAuction({ productId, productName, productImage, description, material, weight, dimensions, condition, itemCondition, sellerId, sellerName, startPrice, reservePrice, buyNowPrice, startTime, endTime }) {
  const auctions = getAuctions()
  const auction = {
    id: `auc-${Date.now()}`,
    productId, productName, productImage,
    description: description || '', material: material || '', weight: weight || '', dimensions: dimensions || '', condition: condition || 'new', itemCondition: itemCondition || 'new_unused',
    sellerId, sellerName,
    startPrice, reservePrice: reservePrice || null,
    buyNowPrice: buyNowPrice || null,
    currentPrice: startPrice,
    bidCount: 0,
    startTime, endTime,
    pausedTimeLeft: null,
    status: Date.now() >= startTime ? AUCTION_STATUS.LIVE : AUCTION_STATUS.SCHEDULED,
    deliveryIncluded: true,
    winnerId: null, winnerName: null, paymentDeadline: null,
    buyNowBuyerId: null, buyNowDeadline: null,
    commission: null,
    bids: [],
  }
  auctions.push(auction)
  saveAuctions(auctions)
  return auction
}

// ── Place bid (with min/max caps) ────────────────────────────────────────────
export function placeBid(auctionId, buyerId, buyerName, amount) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return { error: 'Auction not found' }
  if (auc.status !== AUCTION_STATUS.LIVE) return { error: 'Auction not active' }
  if (Date.now() > auc.endTime) return { error: 'Auction has ended' }

  const { min, max } = getBidLimits(auc.currentPrice)
  if (amount < min) return { error: `Min bid: ${fmtIDR(min)}` }
  if (amount > max) return { error: `Max bid: ${fmtIDR(max)} — keep it fair for everyone` }

  auc.bids.unshift({ id: `b-${Date.now()}`, buyerId, buyerName, amount, time: Date.now() })
  auc.currentPrice = amount
  auc.bidCount++
  saveAuctions(auctions)
  return { success: true, auction: auc }
}

// ── Buy Now — pauses auction, 5-min payment window ──────────────────────────
export function buyNow(auctionId, buyerId, buyerName) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return { error: 'Auction not found' }
  if (auc.status !== AUCTION_STATUS.LIVE) return { error: 'Auction not active' }
  if (!isBuyNowAvailable(auc)) return { error: 'Buy Now no longer available' }

  // Pause auction — save remaining time
  auc.pausedTimeLeft = auc.endTime - Date.now()
  auc.status = AUCTION_STATUS.PAUSED_BUY_NOW
  auc.buyNowBuyerId = buyerId
  auc.buyNowDeadline = Date.now() + 5 * 60 * 1000 // 5 minutes
  auc.winnerId = buyerId
  auc.winnerName = buyerName
  auc.currentPrice = auc.buyNowPrice

  saveAuctions(auctions)
  return { success: true, auction: auc }
}

// ── Buy Now payment uploaded — auction complete ──────────────────────────────
export function confirmBuyNowPayment(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc || auc.status !== AUCTION_STATUS.PAUSED_BUY_NOW) return { error: 'Not in Buy Now state' }

  auc.status = AUCTION_STATUS.PAID
  auc.commission = Math.round(auc.currentPrice * AUCTION_COMMISSION_RATE)
  saveAuctions(auctions)
  return { success: true, commission: auc.commission }
}

// ── Buy Now expired — buyer banned, auction resumes ─────────────────────────
export function buyNowExpired(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc || auc.status !== AUCTION_STATUS.PAUSED_BUY_NOW) return null

  // Resume auction — restore remaining time
  auc.status = AUCTION_STATUS.LIVE
  auc.endTime = Date.now() + (auc.pausedTimeLeft ?? 3600000)
  auc.pausedTimeLeft = null
  // Revert price to last bid
  auc.currentPrice = auc.bids.length > 0 ? auc.bids[0].amount : auc.startPrice
  auc.winnerId = null
  auc.winnerName = null
  auc.buyNowBuyerId = null
  auc.buyNowDeadline = null

  saveAuctions(auctions)
  return auc
}

// ── End auction (timer reached zero) ─────────────────────────────────────────
export function endAuction(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return null

  if (auc.bids.length === 0) {
    auc.status = AUCTION_STATUS.UNSOLD
  } else {
    const winner = auc.bids[0]
    const reserveMet = !auc.reservePrice || winner.amount >= auc.reservePrice
    if (reserveMet) {
      auc.status = AUCTION_STATUS.AWAITING_PAYMENT
      auc.winnerId = winner.buyerId
      auc.winnerName = winner.buyerName
      auc.paymentDeadline = Date.now() + 3600000 // 1 hour
    } else {
      auc.status = AUCTION_STATUS.UNSOLD
    }
  }
  saveAuctions(auctions)
  return auc
}

// ── Payment proof uploaded — auction complete + commission ────────────────────
export function markAuctionPaid(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return null
  auc.status = AUCTION_STATUS.PAID
  auc.commission = Math.round(auc.currentPrice * AUCTION_COMMISSION_RATE)
  saveAuctions(auctions)
  return auc
}

// ── Forfeit winner — move to runner-up ───────────────────────────────────────
export function forfeitWinner(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return null

  const runnerUp = auc.bids.find(b => b.buyerId !== auc.winnerId)
  if (runnerUp) {
    auc.status = AUCTION_STATUS.SECOND_CHANCE
    auc.winnerId = runnerUp.buyerId
    auc.winnerName = runnerUp.buyerName
    auc.currentPrice = runnerUp.amount
    auc.paymentDeadline = Date.now() + 3600000
  } else {
    auc.status = AUCTION_STATUS.UNSOLD
  }
  saveAuctions(auctions)
  return auc
}

// ── Edit/cancel (only before first bid) ──────────────────────────────────────
export function canEditAuction(auction) {
  return auction && auction.status === AUCTION_STATUS.LIVE && auction.bidCount === 0
}

export function cancelAuction(auctionId) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return { error: 'Not found' }
  if (auc.bidCount > 0) return { error: 'Cannot cancel — has bids' }
  auc.status = AUCTION_STATUS.UNSOLD
  saveAuctions(auctions)
  return { success: true }
}

export function editAuction(auctionId, updates) {
  const auctions = getAuctions()
  const auc = auctions.find(a => a.id === auctionId)
  if (!auc) return { error: 'Not found' }
  if (auc.bidCount > 0) return { error: 'Cannot edit — has bids' }
  if (updates.startPrice != null) { auc.startPrice = updates.startPrice; auc.currentPrice = updates.startPrice }
  if (updates.reservePrice !== undefined) auc.reservePrice = updates.reservePrice || null
  if (updates.buyNowPrice !== undefined) auc.buyNowPrice = updates.buyNowPrice || null
  if (updates.endTime != null) auc.endTime = updates.endTime
  saveAuctions(auctions)
  return { success: true }
}

// ── Admin stats ──────────────────────────────────────────────────────────────
export function getAuctionStats() {
  const auctions = getAuctions()
  const live = auctions.filter(a => a.status === AUCTION_STATUS.LIVE || a.status === AUCTION_STATUS.PAUSED_BUY_NOW)
  const awaiting = auctions.filter(a => a.status === AUCTION_STATUS.AWAITING_PAYMENT)
  const totalBids = auctions.reduce((s, a) => s + a.bidCount, 0)
  const paidAuctions = auctions.filter(a => a.status === AUCTION_STATUS.PAID)
  const totalRevenue = paidAuctions.reduce((s, a) => s + a.currentPrice, 0)
  const totalCommission = paidAuctions.reduce((s, a) => s + (a.commission ?? 0), 0)
  return { total: auctions.length, live: live.length, awaiting: awaiting.length, totalBids, totalRevenue, totalCommission, auctions }
}

export function fmtIDR(n) {
  if (!n && n !== 0) return '—'
  n = Number(n)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}
