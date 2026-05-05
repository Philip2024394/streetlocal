/**
 * Marketplace Search & Discovery Algorithm
 *
 * Goals:
 *  1. Product-level search (not just sellers)
 *  2. Relevance scoring — name > tags > description > category
 *  3. Equal rotation — new sellers get boosted visibility
 *  4. Similar products — same category, lower/similar price
 *  5. Fair exposure — no seller dominates results
 */

// ── Relevance scoring ───────────────────────────────────────────────────────

/**
 * Score a product against a search query.
 * Higher score = better match.
 */
export function scoreProduct(product, query) {
  if (!query?.trim()) return 1
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const name = (product.name ?? '').toLowerCase()
  const desc = (product.description ?? '').toLowerCase()
  const category = (product.category ?? '').toLowerCase()
  const tags = (product.tags ?? []).join(' ').toLowerCase()
  const specs = Object.values(product.specs ?? {}).join(' ').toLowerCase()
  const seller = (product.profiles?.display_name ?? product.seller_name ?? '').toLowerCase()

  let score = 0

  for (const word of words) {
    // Exact name match = highest weight
    if (name === word) score += 100
    // Name contains word
    else if (name.includes(word)) score += 50
    // Name starts with word
    if (name.startsWith(word)) score += 30
    // Tags match
    if (tags.includes(word)) score += 25
    // Category match
    if (category.includes(word)) score += 20
    // Specs match
    if (specs.includes(word)) score += 15
    // Description match
    if (desc.includes(word)) score += 10
    // Seller name match
    if (seller.includes(word)) score += 5
  }

  return score
}

/**
 * Score a seller against a search query.
 */
export function scoreSeller(seller, query) {
  if (!query?.trim()) return 1
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const name = (seller.brandName ?? seller.displayName ?? '').toLowerCase()
  const bio = (seller.bio ?? '').toLowerCase()
  const tags = (seller.tags ?? []).join(' ').toLowerCase()
  const city = (seller.city ?? '').toLowerCase()

  let score = 0
  for (const word of words) {
    if (name.includes(word)) score += 50
    if (tags.includes(word)) score += 25
    if (bio.includes(word)) score += 10
    if (city.includes(word)) score += 5
  }
  return score
}

// ── Equal rotation / fair exposure ──────────────────────────────────────────

/**
 * Apply fair rotation to search results.
 * Ensures no single seller dominates the first page.
 * New sellers (joined < 30 days) get a boost.
 * Uses a deterministic daily seed so rotation changes each day.
 */
export function applyFairRotation(items, { maxPerSeller = 3, boostNewSellers = true } = {}) {
  // Daily seed for consistent rotation within a day
  const daySeed = Math.floor(Date.now() / 86400000)

  // Simple hash for deterministic shuffle
  const hash = (str, seed) => {
    let h = seed
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h)
  }

  // Group by seller
  const sellerCounts = {}
  const result = []
  const overflow = []

  // Add rotation score
  const scored = items.map(item => {
    const sellerId = item.user_id ?? item.userId ?? item.id
    const rotationScore = hash(String(sellerId), daySeed) % 1000

    // Boost new sellers (created_at within 30 days)
    let newBoost = 0
    if (boostNewSellers && item.created_at) {
      const age = Date.now() - new Date(item.created_at).getTime()
      const dayAge = age / 86400000
      if (dayAge < 7) newBoost = 200       // First week: strong boost
      else if (dayAge < 14) newBoost = 100  // Second week: medium boost
      else if (dayAge < 30) newBoost = 50   // Third-fourth week: slight boost
    }

    return { ...item, _rotationScore: rotationScore + newBoost }
  })

  // Sort by rotation score (changes daily)
  scored.sort((a, b) => b._rotationScore - a._rotationScore)

  // Enforce max per seller
  for (const item of scored) {
    const sellerId = item.user_id ?? item.userId ?? item.id
    sellerCounts[sellerId] = (sellerCounts[sellerId] ?? 0) + 1
    if (sellerCounts[sellerId] <= maxPerSeller) {
      result.push(item)
    } else {
      overflow.push(item)
    }
  }

  // Add overflow at the end (extra products from same seller after others)
  return [...result, ...overflow]
}

// ── Combined sort: relevance + rotation + location ──────────────────────────

/**
 * Sort products with combined scoring.
 * @param {Array} products
 * @param {string} query - search query
 * @param {string} userCity - buyer's city
 * @param {string} userCountry - buyer's country
 */
export function sortProducts(products, query, userCity, userCountry) {
  const scored = products.map(p => {
    let score = scoreProduct(p, query)

    // Location bonus
    const pCity = p.profiles?.city ?? p.city ?? ''
    const pCountry = p.profiles?.country ?? p.country ?? ''
    if (userCity && pCity.toLowerCase() === userCity.toLowerCase()) score += 15
    else if (userCountry && pCountry.toLowerCase() === userCountry.toLowerCase()) score += 5

    // Stock penalty — out of stock goes to bottom
    if (p.stock === 0) score -= 1000

    // Sale bonus — items on sale get slight boost
    if (p.sale_price && p.sale_price < p.price) score += 8

    return { ...p, _score: score }
  })

  // Sort by score descending
  scored.sort((a, b) => b._score - a._score)

  // Apply fair rotation
  return applyFairRotation(scored)
}

/**
 * Sort sellers with combined scoring.
 */
export function sortSellers(sellers, query, userCity, userCountry) {
  const scored = sellers.map(s => {
    let score = scoreSeller(s, query)

    // Location bonus
    if (userCity && (s.city ?? '').toLowerCase() === userCity.toLowerCase()) score += 20
    else if (userCountry && (s.country ?? '').toLowerCase() === userCountry.toLowerCase()) score += 10

    // Online bonus
    if (s.isOnline) score += 5

    return { ...s, _score: score }
  })

  scored.sort((a, b) => b._score - a._score)
  return applyFairRotation(scored, { maxPerSeller: 1 })
}

/**
 * Get similar products for recommendation.
 * Same category, sorted by price ascending (cheaper first).
 * Excludes the current product.
 * Limits per-seller to avoid one seller dominating.
 */
export function filterSimilarProducts(allProducts, currentProduct) {
  if (!currentProduct?.category) return []

  return applyFairRotation(
    allProducts
      .filter(p =>
        p.id !== currentProduct.id &&
        p.category === currentProduct.category &&
        p.active !== false &&
        p.stock !== 0
      )
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
    { maxPerSeller: 2 }
  )
}
