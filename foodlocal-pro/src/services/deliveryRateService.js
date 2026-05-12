/**
 * Delivery Rate Service
 * Real Indonesian carrier rates with weight-based pricing.
 * Combined shipping for same-seller orders.
 * Volumetric weight calculation.
 * Cross-island multipliers.
 *
 * Note: Rates are estimated 2026 projections.
 * Sellers can override with their own prices.
 * Shown as "Estimated delivery cost" to buyers.
 */

// ── Carrier rate tables (Java-to-Java base, Rp) ─────────────────────────────
// rates: { weightKg: price } — lookup nearest weight bracket
export const CARRIER_RATES = {
  jne: {
    label: 'JNE REG', service: 'regular',
    rates: { 1: 10000, 2: 15000, 3: 20000, 5: 30000, 10: 55000 },
    perExtraKg: 5000, maxKg: 30,
  },
  jne_yes: {
    label: 'JNE YES', service: 'express',
    rates: { 1: 19000, 2: 29000, 3: 39000, 5: 59000, 10: 109000 },
    perExtraKg: 10000, maxKg: 30,
  },
  jnt_express: {
    label: 'J&T Express', service: 'regular',
    rates: { 1: 9000, 2: 13000, 3: 17000, 5: 25000, 10: 45000 },
    perExtraKg: 4000, maxKg: 30,
  },
  ninja: {
    label: 'Ninja Xpress', service: 'regular',
    rates: { 1: 10000, 2: 15000, 3: 20000, 5: 30000, 10: 55000 },
    perExtraKg: 5000, maxKg: 30,
  },
  sicepat: {
    label: 'SiCepat REG', service: 'regular',
    rates: { 1: 9000, 2: 13000, 3: 17000, 5: 25000, 10: 45000 },
    perExtraKg: 4000, maxKg: 30,
  },
  sicepat_best: {
    label: 'SiCepat BEST', service: 'express',
    rates: { 1: 16000, 2: 24000, 3: 32000, 5: 48000, 10: 88000 },
    perExtraKg: 8000, maxKg: 30,
  },
  pos_indo: {
    label: 'Pos Indonesia', service: 'regular',
    rates: { 1: 8000, 2: 12000, 3: 16000, 5: 24000, 10: 44000 },
    perExtraKg: 4000, maxKg: 30,
  },
  tiki: {
    label: 'TIKI REG', service: 'regular',
    rates: { 1: 10000, 2: 15000, 3: 20000, 5: 30000, 10: 55000 },
    perExtraKg: 5000, maxKg: 30,
  },
  antaraja: {
    label: 'Anteraja', service: 'regular',
    rates: { 1: 9000, 2: 13000, 3: 17000, 5: 25000, 10: 45000 },
    perExtraKg: 4000, maxKg: 30,
  },
  lion_parcel: {
    label: 'Lion Parcel', service: 'regular',
    rates: { 1: 9000, 2: 13000, 3: 17000, 5: 25000, 10: 45000 },
    perExtraKg: 4000, maxKg: 30,
  },
  idexpress: {
    label: 'IDExpress', service: 'regular',
    rates: { 1: 9000, 2: 13000, 3: 17000, 5: 25000, 10: 45000 },
    perExtraKg: 4000, maxKg: 30,
  },
  wahana: {
    label: 'Wahana Express', service: 'regular',
    rates: { 1: 8000, 2: 12000, 3: 16000, 5: 24000, 10: 44000 },
    perExtraKg: 4000, maxKg: 30,
  },
  sap: {
    label: 'SAP Express', service: 'regular',
    rates: { 1: 9000, 2: 13000, 3: 17000, 5: 25000, 10: 45000 },
    perExtraKg: 4000, maxKg: 30,
  },
}

// ── Cross-island multipliers ─────────────────────────────────────────────────
const ISLAND_GROUPS = {
  java:       ['Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Yogyakarta', 'Malang', 'Solo', 'Bekasi', 'Tangerang', 'Depok', 'Bogor', 'Cirebon'],
  sumatra:    ['Medan', 'Palembang', 'Padang', 'Pekanbaru', 'Lampung', 'Jambi', 'Bengkulu', 'Banda Aceh', 'Batam'],
  bali_ntb:   ['Denpasar', 'Bali', 'Mataram', 'Lombok', 'Kupang'],
  kalimantan: ['Pontianak', 'Banjarmasin', 'Balikpapan', 'Samarinda', 'Palangkaraya'],
  sulawesi:   ['Makassar', 'Manado', 'Palu', 'Kendari', 'Gorontalo'],
  papua:      ['Jayapura', 'Sorong', 'Manokwari', 'Merauke'],
}

const MULTIPLIERS = {
  'java-java': 1.0,
  'java-bali_ntb': 1.2,
  'java-sumatra': 1.3,
  'java-kalimantan': 1.5,
  'java-sulawesi': 1.5,
  'java-papua': 2.0,
  'sumatra-sumatra': 1.0,
  'bali_ntb-bali_ntb': 1.0,
  'kalimantan-kalimantan': 1.0,
  'sulawesi-sulawesi': 1.0,
}
const DEFAULT_MULTIPLIER = 1.5

function getIsland(city) {
  if (!city) return 'java'
  const c = city.toLowerCase()
  for (const [island, cities] of Object.entries(ISLAND_GROUPS)) {
    if (cities.some(ci => c.includes(ci.toLowerCase()))) return island
  }
  return 'java' // default
}

export function getRouteMultiplier(sellerCity, buyerCity) {
  const from = getIsland(sellerCity)
  const to = getIsland(buyerCity)
  const key1 = `${from}-${to}`
  const key2 = `${to}-${from}`
  return MULTIPLIERS[key1] ?? MULTIPLIERS[key2] ?? DEFAULT_MULTIPLIER
}

// ── Volumetric weight ────────────────────────────────────────────────────────
// dimensions string like "26 x 18 x 8 cm" or "26x18x8"
export function parseVolumetricWeight(dimensions) {
  if (!dimensions) return 0
  const nums = dimensions.match(/[\d.]+/g)
  if (!nums || nums.length < 3) return 0
  const [l, w, h] = nums.map(Number)
  return (l * w * h) / 6000 // industry standard divisor
}

// ── Calculate delivery cost for a carrier ────────────────────────────────────
export function calculateCarrierRate(carrierKey, weightKg, sellerCity, buyerCity) {
  const carrier = CARRIER_RATES[carrierKey]
  if (!carrier) return null

  const w = Math.max(1, Math.ceil(weightKg)) // minimum 1kg, round up
  if (w > carrier.maxKg) return null // too heavy for this carrier

  // Find the rate bracket
  const brackets = Object.entries(carrier.rates)
    .map(([kg, price]) => ({ kg: Number(kg), price }))
    .sort((a, b) => a.kg - b.kg)

  let rate = 0
  const lastBracket = brackets[brackets.length - 1]

  if (w <= lastBracket.kg) {
    // Find the bracket that covers this weight
    const bracket = brackets.find(b => w <= b.kg)
    rate = bracket ? bracket.price : lastBracket.price
  } else {
    // Beyond last bracket — use last bracket + per extra kg
    const extraKg = w - lastBracket.kg
    rate = lastBracket.price + (extraKg * carrier.perExtraKg)
  }

  // Apply cross-island multiplier
  const multiplier = getRouteMultiplier(sellerCity, buyerCity)
  rate = Math.round(rate * multiplier)

  return {
    carrier: carrierKey,
    label: carrier.label,
    service: carrier.service,
    weight: w,
    baseRate: rate,
    multiplier,
    total: rate,
  }
}

// ── Calculate combined shipping for cart items from same seller ───────────────
export function calculateCombinedShipping(cartItems, products, sellerCity, buyerCity) {
  // Sum weights — use actual weight or estimate 500g per item if not set
  let totalWeightGrams = 0
  let maxVolumetricKg = 0

  cartItems.forEach(item => {
    const product = products.find(p => p.id === item.id)
    const qty = item.qty ?? 1
    const weightG = product?.weight_grams ?? product?.weight ?? 500 // default 500g
    totalWeightGrams += weightG * qty

    // Check volumetric weight
    if (product?.dimensions) {
      const volKg = parseVolumetricWeight(product.dimensions)
      if (volKg > maxVolumetricKg) maxVolumetricKg = volKg * qty
    }
  })

  const actualKg = totalWeightGrams / 1000
  const chargeableKg = Math.max(actualKg, maxVolumetricKg) // use whichever is higher

  // Calculate rates for all carriers
  const allRates = Object.keys(CARRIER_RATES).map(key =>
    calculateCarrierRate(key, chargeableKg, sellerCity, buyerCity)
  ).filter(Boolean)

  // Sort by price — cheapest first
  allRates.sort((a, b) => a.total - b.total)

  // Split by service type
  const regular = allRates.filter(r => r.service === 'regular')
  const express = allRates.filter(r => r.service === 'express')

  return {
    totalWeightGrams,
    chargeableKg: Math.ceil(chargeableKg * 10) / 10, // round to 0.1
    itemCount: cartItems.reduce((s, i) => s + (i.qty ?? 1), 0),
    cheapest: regular[0] ?? allRates[0] ?? null,
    fastest: express[0] ?? null,
    allRates,
    regular,
    express,
    isEstimate: true, // flag so UI can show "estimated"
  }
}

export function fmtIDR(n) {
  if (!n && n !== 0) return '—'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

export function fmtWeight(grams) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1).replace('.0', '')}kg`
  return `${grams}g`
}
