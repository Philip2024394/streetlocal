/**
 * Places Service — OpenStreetMap Overpass API
 * Free, legal, no API key required.
 * Downloads and caches all businesses/POIs in Yogyakarta.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Yogyakarta bounding box (covers city + surrounding area)
const YOGYA_BBOX = '-7.85,110.30,-7.72,110.45'

// Cache in memory + localStorage
let placesCache = null
const CACHE_KEY = 'indoo_places_yogyakarta'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

// ─── Category definitions ───

const PLACE_CATEGORIES = {
  restaurant: { query: 'amenity~"restaurant|fast_food|food_court|cafe"', icon: '🍽️', label: 'Restaurants' },
  hotel: { query: 'tourism~"hotel|hostel|guest_house|motel"', icon: '🏨', label: 'Hotels' },
  shop: { query: 'shop~"supermarket|convenience|mall|department_store|clothes|electronics"', icon: '🛒', label: 'Shops' },
  hospital: { query: 'amenity~"hospital|clinic|doctors|pharmacy"', icon: '🏥', label: 'Health' },
  education: { query: 'amenity~"school|university|college|library"', icon: '🎓', label: 'Education' },
  transport: { query: 'amenity~"bus_station|taxi"|railway~"station|halt"', icon: '🚉', label: 'Transport' },
  worship: { query: 'amenity~"place_of_worship"', icon: '🕌', label: 'Worship' },
  bank: { query: 'amenity~"bank|atm"', icon: '🏦', label: 'Banks & ATM' },
  fuel: { query: 'amenity~"fuel"', icon: '⛽', label: 'Fuel' },
  tourism: { query: 'tourism~"attraction|museum|zoo|theme_park|viewpoint"', icon: '📸', label: 'Tourism' },
  government: { query: 'office~"government"|amenity~"townhall|police|fire_station|post_office"', icon: '🏛️', label: 'Government' },
  entertainment: { query: 'leisure~"park|sports_centre|swimming_pool|fitness_centre"|amenity~"cinema|theatre"', icon: '🎭', label: 'Entertainment' },
}

// ─── Overpass query builder ───

function buildOverpassQuery(categoryKey) {
  const cat = PLACE_CATEGORIES[categoryKey]
  if (!cat) return null

  // Split compound queries (key~"val1|val2")
  const parts = cat.query.split('|').length > 1 ? [cat.query] : [cat.query]

  // Build Overpass QL — query nodes AND ways (buildings) in bbox
  return `
[out:json][timeout:60];
(
  nwr[${cat.query}](${YOGYA_BBOX});
);
out center tags;
`.trim()
}

function buildFullQuery() {
  // Single query for ALL categories at once — more efficient
  const filters = Object.values(PLACE_CATEGORIES).map(c => c.query)
  const nwrBlocks = filters.map(f => `  nwr[${f}](${YOGYA_BBOX});`).join('\n')

  return `
[out:json][timeout:120][maxsize:52428800];
(
${nwrBlocks}
);
out center tags;
`.trim()
}

// ─── Parse OSM elements to places ───

function parseElement(el) {
  const tags = el.tags || {}
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon

  if (!lat || !lng || !tags.name) return null

  // Determine category
  let category = 'other'
  for (const [key, cat] of Object.entries(PLACE_CATEGORIES)) {
    const queryParts = cat.query.match(/(\w+)~"([^"]+)"/g) || []
    for (const part of queryParts) {
      const match = part.match(/(\w+)~"([^"]+)"/)
      if (match) {
        const [, tagKey, values] = match
        const vals = values.split('|')
        if (vals.some(v => tags[tagKey] === v)) {
          category = key
          break
        }
      }
    }
    if (category !== 'other') break
  }

  return {
    id: `osm-${el.type}-${el.id}`,
    osm_id: el.id,
    osm_type: el.type,
    name: tags.name,
    name_en: tags['name:en'] || null,
    category,
    icon: PLACE_CATEGORIES[category]?.icon || '📍',
    lat,
    lng,
    address: buildAddress(tags),
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    opening_hours: tags.opening_hours || null,
    cuisine: tags.cuisine || null,
    brand: tags.brand || null,
    tags_raw: tags,
  }
}

function buildAddress(tags) {
  const parts = []
  if (tags['addr:street']) {
    let street = tags['addr:street']
    if (tags['addr:housenumber']) street += ` ${tags['addr:housenumber']}`
    parts.push(street)
  }
  if (tags['addr:city']) parts.push(tags['addr:city'])
  if (tags['addr:postcode']) parts.push(tags['addr:postcode'])
  return parts.join(', ') || null
}

// ─── Fetch from Overpass API ───

async function fetchFromOverpass() {
  const query = buildFullQuery()

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`)

  const data = await res.json()
  const elements = data.elements || []

  const places = elements
    .map(parseElement)
    .filter(Boolean)

  // Deduplicate by name + proximity (within 50m)
  const deduped = []
  const seen = new Set()
  for (const p of places) {
    const key = `${p.name.toLowerCase()}-${Math.round(p.lat * 1000)}-${Math.round(p.lng * 1000)}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(p)
    }
  }

  return deduped
}

// ─── Public API ───

/**
 * Get all places in Yogyakarta. Cached for 7 days.
 */
export async function getYogyakartaPlaces() {
  // Memory cache
  if (placesCache) return placesCache

  // localStorage cache
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL && data?.length > 0) {
        placesCache = data
        return data
      }
    }
  } catch {}

  // Fetch fresh
  try {
    const places = await fetchFromOverpass()
    placesCache = places

    // Cache to localStorage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: places,
        timestamp: Date.now(),
      }))
    } catch {} // quota exceeded is fine

    return places
  } catch (err) {
    console.warn('Overpass API fetch failed:', err.message)
    return placesCache || []
  }
}

/**
 * Search places by name or category.
 */
export async function searchPlaces(query, category = null, limit = 20) {
  const places = await getYogyakartaPlaces()
  const q = query?.toLowerCase().trim()

  let results = places

  if (category && category !== 'all') {
    results = results.filter(p => p.category === category)
  }

  if (q) {
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.name_en?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    )
  }

  return results.slice(0, limit)
}

/**
 * Get places near a coordinate, sorted by distance.
 */
export async function getNearbyPlaces(lat, lng, radiusKm = 2, category = null, limit = 20) {
  const places = await getYogyakartaPlaces()

  let results = places.map(p => ({
    ...p,
    distKm: haversineQuick(lat, lng, p.lat, p.lng),
  }))

  if (category && category !== 'all') {
    results = results.filter(p => p.category === category)
  }

  results = results
    .filter(p => p.distKm <= radiusKm)
    .sort((a, b) => a.distKm - b.distKm)

  return results.slice(0, limit)
}

/**
 * Get all available categories with counts.
 */
export async function getPlaceCategories() {
  const places = await getYogyakartaPlaces()
  const counts = {}
  for (const p of places) {
    counts[p.category] = (counts[p.category] || 0) + 1
  }

  return Object.entries(PLACE_CATEGORIES).map(([key, val]) => ({
    key,
    icon: val.icon,
    label: val.label,
    count: counts[key] || 0,
  }))
}

/**
 * Force refresh the cache.
 */
export async function refreshPlacesCache() {
  placesCache = null
  try { localStorage.removeItem(CACHE_KEY) } catch {}
  return getYogyakartaPlaces()
}

// Quick haversine (no import needed)
function haversineQuick(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Export categories for UI
export { PLACE_CATEGORIES }
