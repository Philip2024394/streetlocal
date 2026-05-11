// Shared delivery zones + per-country defaults.
// Phase 4 consolidation across all 8 customer-facing apps.
// Order matters: buildDeliveryZones is declared before DEFAULT_DELIVERY_ZONES which calls it.

export function buildDeliveryZones(minCharge = 7000, minKm = 2, perKm = 2500, maxKm = 15, roundTo = 1000, currency = 'Rp') {
  // minCharge covers 0 to minKm (flat fee)
  // After minKm, each additional km adds perKm
  const calc = (km) => {
    if (km <= minKm) return minCharge
    const extra = km - minKm
    return Math.ceil((minCharge + extra * perKm) / roundTo) * roundTo
  }
  const zones = [
    { name: 'Pickup', radius: 0, fee: 0, label: 'Pickup / Walk-in' },
    { name: `0-${minKm} km`, radius: minKm, fee: minCharge, label: `~${currency} ${minCharge.toLocaleString()}` },
  ]
  if (maxKm > minKm) zones.push({ name: `${minKm}-5 km`, radius: 5, fee: calc(5), label: `~${currency} ${calc(5).toLocaleString()}` })
  if (maxKm > 5) zones.push({ name: '5-10 km', radius: 10, fee: calc(10), label: `~${currency} ${calc(10).toLocaleString()}` })
  if (maxKm > 10) zones.push({ name: '10-15 km', radius: 15, fee: calc(15), label: `~${currency} ${calc(15).toLocaleString()}` })
  if (maxKm > 15) zones.push({ name: '15-20 km', radius: 20, fee: calc(20), label: `~${currency} ${calc(20).toLocaleString()}` })
  return zones
}

export const DEFAULT_DELIVERY_ZONES = buildDeliveryZones()

/* ─── City/Country Delivery Defaults (GoJek/Grab research 2025) ─── */
export const DELIVERY_DEFAULTS = {
  // Indonesia — based on GoJek/Grab bike rates per city
  ID: {
    currency: 'Rp', cities: {
      Jakarta: { minCharge: 10000, minKm: 4, perKm: 2500, maxKm: 25 },
      Surabaya: { minCharge: 8000, minKm: 3, perKm: 2000, maxKm: 20 },
      Bandung: { minCharge: 8000, minKm: 3, perKm: 2000, maxKm: 20 },
      Yogyakarta: { minCharge: 7000, minKm: 3, perKm: 2000, maxKm: 15 },
      Semarang: { minCharge: 7000, minKm: 3, perKm: 2000, maxKm: 15 },
      Medan: { minCharge: 8000, minKm: 3, perKm: 2000, maxKm: 20 },
      Makassar: { minCharge: 7000, minKm: 3, perKm: 2000, maxKm: 15 },
      Bali: { minCharge: 10000, minKm: 4, perKm: 2500, maxKm: 25 },
      Malang: { minCharge: 7000, minKm: 3, perKm: 2000, maxKm: 15 },
      Palembang: { minCharge: 7000, minKm: 3, perKm: 2000, maxKm: 15 },
      Tangerang: { minCharge: 9000, minKm: 4, perKm: 2500, maxKm: 20 },
      Bekasi: { minCharge: 9000, minKm: 4, perKm: 2500, maxKm: 20 },
      Depok: { minCharge: 9000, minKm: 4, perKm: 2500, maxKm: 20 },
      Bogor: { minCharge: 8000, minKm: 3, perKm: 2000, maxKm: 20 },
      _default: { minCharge: 7000, minKm: 3, perKm: 2000, maxKm: 15 },
    }
  },
  MY: { currency: 'RM', cities: { _default: { minCharge: 5, minKm: 3, perKm: 1.5, maxKm: 20 } } },
  SG: { currency: 'S$', cities: { _default: { minCharge: 3, minKm: 3, perKm: 1, maxKm: 15 } } },
  TH: { currency: '฿', cities: { _default: { minCharge: 25, minKm: 3, perKm: 8, maxKm: 20 } } },
  VN: { currency: '₫', cities: { _default: { minCharge: 15000, minKm: 3, perKm: 5000, maxKm: 20 } } },
  PH: { currency: '₱', cities: { _default: { minCharge: 49, minKm: 3, perKm: 15, maxKm: 20 } } },
  IN: { currency: '₹', cities: { _default: { minCharge: 30, minKm: 3, perKm: 10, maxKm: 20 } } },
  AU: { currency: 'A$', cities: { _default: { minCharge: 6, minKm: 3, perKm: 2, maxKm: 15 } } },
  GB: { currency: '£', cities: { _default: { minCharge: 3, minKm: 3, perKm: 1.5, maxKm: 15 } } },
  US: { currency: '$', cities: { _default: { minCharge: 4, minKm: 3, perKm: 1.5, maxKm: 15 } } },
  AE: { currency: 'AED', cities: { _default: { minCharge: 8, minKm: 3, perKm: 2, maxKm: 20 } } },
  SA: { currency: 'SAR', cities: { _default: { minCharge: 8, minKm: 3, perKm: 2, maxKm: 20 } } },
  JP: { currency: '¥', cities: { _default: { minCharge: 300, minKm: 3, perKm: 100, maxKm: 15 } } },
  KR: { currency: '₩', cities: { _default: { minCharge: 3000, minKm: 3, perKm: 1000, maxKm: 15 } } },
  DE: { currency: '€', cities: { _default: { minCharge: 3, minKm: 3, perKm: 1.5, maxKm: 15 } } },
  FR: { currency: '€', cities: { _default: { minCharge: 3, minKm: 3, perKm: 1.5, maxKm: 15 } } },
}

export function getDeliveryDefaults(countryCode, city) {
  const country = DELIVERY_DEFAULTS[countryCode] || DELIVERY_DEFAULTS.ID
  const cityRates = country.cities[city] || country.cities._default
  return { ...cityRates, currency: country.currency }
}

export function getDeliveryFee(distKm, zones) {
  const z = zones || DEFAULT_DELIVERY_ZONES
  for (let i = z.length - 1; i >= 0; i--) {
    if (distKm <= z[i].radius) return z[i]
  }
  return z[z.length - 1]
}
