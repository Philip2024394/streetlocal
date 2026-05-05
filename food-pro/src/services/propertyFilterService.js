/**
 * propertyFilterService — Filter utilities and property data helpers.
 */

/* ── Certificate Info ── */
export const CERTIFICATE_INFO = {
  SHM:       { full: 'Sertifikat Hak Milik',              desc: 'Strongest ownership — full individual rights',       strength: 10 },
  HGB:       { full: 'Hak Guna Bangunan',                 desc: 'Right to build — 30yr renewable',                    strength: 8 },
  SHMSRS:    { full: 'SHM Sarusun',                        desc: 'Apartment unit ownership',                           strength: 9 },
  'Hak Pakai': { full: 'Hak Pakai',                        desc: 'Right to use — foreigners eligible',                 strength: 7 },
  AJB:       { full: 'Akta Jual Beli',                     desc: 'Sale deed — transfer in progress',                   strength: 6 },
  PPJB:      { full: 'Perjanjian Pengikatan Jual Beli',    desc: 'Pre-sale agreement — not yet transferred',            strength: 5 },
  Girik:     { full: 'Girik/Letter C',                     desc: 'Traditional land record — needs conversion',          strength: 4 },
  'Petok D': { full: 'Petok D',                            desc: 'Village-level land record',                          strength: 3 },
  Adat:      { full: 'Hak Adat',                           desc: 'Customary/traditional rights',                       strength: 2 },
}

/* ── Helpers ── */
export function calculatePricePerSqm(price, areaStr) {
  const num = parseFloat(String(price).replace(/\./g, '')) || 0
  const area = parseInt(String(areaStr).replace(/[^\d]/g, ''), 10) || 0
  if (!num || !area) return 0
  return Math.round(num / area)
}

export function formatArea(sqm) {
  return sqm ? `${sqm} m²` : '—'
}

export function getFilterCount(filters) {
  if (!filters) return 0
  let c = 0
  if (filters.types?.length) c++
  if (filters.mode && filters.mode !== 'all') c++
  if (filters.priceMin || filters.priceMax) c++
  if (filters.ltMin || filters.ltMax) c++
  if (filters.lbMin || filters.lbMax) c++
  if (filters.bedrooms?.length) c++
  if (filters.bathrooms?.length) c++
  if (filters.certificates?.length) c++
  if (filters.furnished?.length) c++
  if (filters.amenities?.length) c++
  if (filters.transportTypes?.length) c++
  if (filters.ownerType && filters.ownerType !== 'all') c++
  if (filters.conditions?.length) c++
  if (filters.sortBy && filters.sortBy !== 'newest') c++
  return c
}

/* ── Apply filters to listing array ── */
export function applyPropertyFilters(listings, filters) {
  if (!filters) return listings
  let result = [...listings]

  // Property type
  if (filters.types?.length) {
    result = result.filter(l => {
      const subCat = l.sub_category || l.category || ''
      return filters.types.some(t => subCat.toLowerCase().includes(t.toLowerCase()) || l.category?.toLowerCase().includes(t.toLowerCase()))
    })
  }

  // Mode (sale/rent)
  if (filters.mode === 'sale') result = result.filter(l => !!l.buy_now)
  if (filters.mode === 'rent') result = result.filter(l => !l.buy_now)

  // Price range
  if (filters.priceMin) {
    const min = Number(String(filters.priceMin).replace(/\D/g, ''))
    result = result.filter(l => {
      const p = l.buy_now ? Number(String(typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now).replace(/\./g, '')) : l.price_month || l.price_day || 0
      return p >= min
    })
  }
  if (filters.priceMax) {
    const max = Number(String(filters.priceMax).replace(/\D/g, ''))
    result = result.filter(l => {
      const p = l.buy_now ? Number(String(typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now).replace(/\./g, '')) : l.price_month || l.price_day || 0
      return p <= max
    })
  }

  // Land area
  if (filters.ltMin) {
    const min = Number(filters.ltMin)
    result = result.filter(l => parseInt(String(l.extra_fields?.land_area || '0').replace(/[^\d]/g, ''), 10) >= min)
  }
  if (filters.ltMax) {
    const max = Number(filters.ltMax)
    result = result.filter(l => {
      const v = parseInt(String(l.extra_fields?.land_area || '0').replace(/[^\d]/g, ''), 10)
      return v > 0 && v <= max
    })
  }

  // Building area
  if (filters.lbMin) {
    const min = Number(filters.lbMin)
    result = result.filter(l => parseInt(String(l.extra_fields?.building_area || '0').replace(/[^\d]/g, ''), 10) >= min)
  }
  if (filters.lbMax) {
    const max = Number(filters.lbMax)
    result = result.filter(l => {
      const v = parseInt(String(l.extra_fields?.building_area || '0').replace(/[^\d]/g, ''), 10)
      return v > 0 && v <= max
    })
  }

  // Bedrooms
  if (filters.bedrooms?.length) {
    result = result.filter(l => {
      const beds = l.extra_fields?.bedrooms || 0
      return filters.bedrooms.some(b => b === '5+' ? beds >= 5 : beds === Number(b))
    })
  }

  // Bathrooms
  if (filters.bathrooms?.length) {
    result = result.filter(l => {
      const baths = l.extra_fields?.bathrooms || 0
      return filters.bathrooms.some(b => b === '5+' ? baths >= 5 : baths === Number(b))
    })
  }

  // Certificate
  if (filters.certificates?.length) {
    result = result.filter(l => {
      const cert = l.extra_fields?.certificate || l.extra_fields?.certificateType || ''
      return filters.certificates.some(c => cert.includes(c))
    })
  }

  // Furnished
  if (filters.furnished?.length) {
    result = result.filter(l => {
      const f = l.extra_fields?.furnished || ''
      return filters.furnished.some(opt => f.toLowerCase().includes(opt.toLowerCase()))
    })
  }

  // Owner type
  if (filters.ownerType === 'owner') result = result.filter(l => l.owner_type === 'owner')
  if (filters.ownerType === 'agent') result = result.filter(l => l.owner_type === 'agent')

  // Condition
  if (filters.conditions?.length) {
    result = result.filter(l => filters.conditions.includes(l.condition))
  }

  // Sort
  if (filters.sortBy === 'price_low') {
    result.sort((a, b) => {
      const pa = a.buy_now ? Number(String(typeof a.buy_now === 'object' ? a.buy_now.price : a.buy_now).replace(/\./g, '')) : a.price_month || a.price_day || 0
      const pb = b.buy_now ? Number(String(typeof b.buy_now === 'object' ? b.buy_now.price : b.buy_now).replace(/\./g, '')) : b.price_month || b.price_day || 0
      return pa - pb
    })
  } else if (filters.sortBy === 'price_high') {
    result.sort((a, b) => {
      const pa = a.buy_now ? Number(String(typeof a.buy_now === 'object' ? a.buy_now.price : a.buy_now).replace(/\./g, '')) : a.price_month || a.price_day || 0
      const pb = b.buy_now ? Number(String(typeof b.buy_now === 'object' ? b.buy_now.price : b.buy_now).replace(/\./g, '')) : b.price_month || b.price_day || 0
      return pb - pa
    })
  } else if (filters.sortBy === 'rating') {
    result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  } else if (filters.sortBy === 'views') {
    result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
  }

  return result
}
