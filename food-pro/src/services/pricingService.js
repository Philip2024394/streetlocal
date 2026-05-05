import { supabase } from '@/lib/supabase'

// ── INDOO Pricing Strategy ──────────────────────────────────────────────────
// INDOO commission: 10% (vs Gojek 20%, Maxim 15%)
// Formula: customer_rate = driver_minimum / (1 - 0.10)
// Driver always receives the full Kemenhub regulated minimum.
// Customer pays the LOWEST legal fare of any Indonesian ride-hailing app.
//
// ── Kemenhub regulated driver minimums ──────────────────────────────────────
// Zone 1 — Java, Bali, Sumatra:  Bike Rp 1,850/km | Car Rp 3,200/km
// Zone 2 — Jabodetabek:          Bike Rp 2,600/km | Car Rp 4,500/km
// Zone 3 — East Indonesia:       Bike Rp 2,100/km | Car Rp 3,600/km
//
// ── INDOO customer rates (10% commission) ───────────────────────────────────
// Zone 1: Bike Rp 2,055/km | Car Rp 3,555/km  (cheapest in Indonesia)
// Zone 2: Bike Rp 2,889/km | Car Rp 5,000/km
// Zone 3: Bike Rp 2,333/km | Car Rp 4,000/km
//
// ── Comparison (10km bike ride, Zone 1) ─────────────────────────────────────
// INDOO:  Customer Rp 20,555 | Driver Rp 18,500 | App Rp 2,055
// Maxim:  Customer Rp 21,764 | Driver Rp 18,500 | App Rp 3,264
// Gojek:  Customer Rp 23,125 | Driver Rp 18,500 | App Rp 4,625

export const INDOO_COMMISSION = 0.10

// Customer-facing rates = driver_minimum / (1 - INDOO_COMMISSION)
// Rounded to nearest Rp 5 for clean display
function cRate(driverMin) { return Math.ceil(driverMin / (1 - INDOO_COMMISSION) / 5) * 5 }

const Z1 = {
  bike_base_fare: cRate(9250),   // Rp 10,278 → rounded
  bike_per_km:    cRate(1850),   // Rp 2,056  → rounded
  car_base_fare:  cRate(15000),  // Rp 16,667 → rounded
  car_per_km:     cRate(3200),   // Rp 3,556  → rounded
  bike_driver_min: 1850, car_driver_min: 3200, base_driver_min_bike: 9250, base_driver_min_car: 15000,
  zone_number: 1, govt_rate: true, is_active: true,
}
const Z2 = {
  bike_base_fare: cRate(13000),
  bike_per_km:    cRate(2600),
  car_base_fare:  cRate(20000),
  car_per_km:     cRate(4500),
  bike_driver_min: 2600, car_driver_min: 4500, base_driver_min_bike: 13000, base_driver_min_car: 20000,
  zone_number: 2, govt_rate: true, is_active: true,
}
const Z3 = {
  bike_base_fare: cRate(10500),
  bike_per_km:    cRate(2100),
  car_base_fare:  cRate(16000),
  car_per_km:     cRate(3600),
  bike_driver_min: 2100, car_driver_min: 3600, base_driver_min_bike: 10500, base_driver_min_car: 16000,
  zone_number: 3, govt_rate: true, is_active: true,
}

export const DEFAULT_ZONES = [
  // ── Zone 1 — Java (excl. Jabodetabek) ──────────────────────────────────────
  { id:  1, zone_id:  1, city_name: 'Yogyakarta',          ...Z1 },
  { id:  2, zone_id:  2, city_name: 'Surabaya',            ...Z1 },
  { id:  3, zone_id:  3, city_name: 'Bandung',             ...Z1 },
  { id:  4, zone_id:  4, city_name: 'Semarang',            ...Z1 },
  { id:  5, zone_id:  5, city_name: 'Malang',              ...Z1 },
  { id:  6, zone_id:  6, city_name: 'Solo',                ...Z1 },
  { id:  7, zone_id:  7, city_name: 'Cirebon',             ...Z1 },
  { id:  8, zone_id:  8, city_name: 'Tasikmalaya',         ...Z1 },
  { id:  9, zone_id:  9, city_name: 'Kediri',              ...Z1 },
  { id: 10, zone_id: 10, city_name: 'Madiun',              ...Z1 },
  // ── Zone 1 — Bali ───────────────────────────────────────────────────────────
  { id: 11, zone_id: 11, city_name: 'Bali (Denpasar)',     ...Z1 },
  { id: 12, zone_id: 12, city_name: 'Bali (Ubud)',         ...Z1 },
  // ── Zone 1 — Sumatra ────────────────────────────────────────────────────────
  { id: 13, zone_id: 13, city_name: 'Medan',               ...Z1 },
  { id: 14, zone_id: 14, city_name: 'Palembang',           ...Z1 },
  { id: 15, zone_id: 15, city_name: 'Pekanbaru',           ...Z1 },
  { id: 16, zone_id: 16, city_name: 'Batam',               ...Z1 },
  { id: 17, zone_id: 17, city_name: 'Padang',              ...Z1 },
  { id: 18, zone_id: 18, city_name: 'Bandar Lampung',      ...Z1 },
  { id: 19, zone_id: 19, city_name: 'Jambi',               ...Z1 },
  // ── Zone 2 — Jabodetabek ────────────────────────────────────────────────────
  { id: 20, zone_id: 20, city_name: 'Jakarta',             ...Z2 },
  { id: 21, zone_id: 21, city_name: 'Bogor',               ...Z2 },
  { id: 22, zone_id: 22, city_name: 'Depok',               ...Z2 },
  { id: 23, zone_id: 23, city_name: 'Tangerang',           ...Z2 },
  { id: 24, zone_id: 24, city_name: 'Bekasi',              ...Z2 },
  // ── Zone 3 — Kalimantan ─────────────────────────────────────────────────────
  { id: 30, zone_id: 30, city_name: 'Balikpapan',          ...Z3 },
  { id: 31, zone_id: 31, city_name: 'Samarinda',           ...Z3 },
  { id: 32, zone_id: 32, city_name: 'Banjarmasin',         ...Z3 },
  { id: 33, zone_id: 33, city_name: 'Pontianak',           ...Z3 },
  // ── Zone 3 — Sulawesi ───────────────────────────────────────────────────────
  { id: 34, zone_id: 34, city_name: 'Makassar',            ...Z3 },
  { id: 35, zone_id: 35, city_name: 'Manado',              ...Z3 },
  { id: 36, zone_id: 36, city_name: 'Palu',                ...Z3 },
  { id: 37, zone_id: 37, city_name: 'Kendari',             ...Z3 },
  // ── Zone 3 — Eastern Indonesia ──────────────────────────────────────────────
  { id: 38, zone_id: 38, city_name: 'Mataram (NTB)',       ...Z3 },
  { id: 39, zone_id: 39, city_name: 'Kupang (NTT)',        ...Z3 },
  { id: 40, zone_id: 40, city_name: 'Ambon',               ...Z3 },
  { id: 41, zone_id: 41, city_name: 'Jayapura',            ...Z3 },
  { id: 42, zone_id: 42, city_name: 'Sorong',              ...Z3 },
  // ── Fallback ─────────────────────────────────────────────────────────────────
  { id: 99, zone_id: 99, city_name: 'Other Areas',         ...Z1 },
]

export const ZONE_INFO = {
  1: { label: 'Zone 1 — Java, Bali, Sumatra',        bike_per_km: Z1.bike_per_km, car_per_km: Z1.car_per_km, bike_driver_min: 1850, car_driver_min: 3200 },
  2: { label: 'Zone 2 — Jabodetabek',                bike_per_km: Z2.bike_per_km, car_per_km: Z2.car_per_km, bike_driver_min: 2600, car_driver_min: 4500 },
  3: { label: 'Zone 3 — Kalimantan, Sulawesi, East', bike_per_km: Z3.bike_per_km, car_per_km: Z3.car_per_km, bike_driver_min: 2100, car_driver_min: 3600 },
}

export const DEFAULT_SETTINGS = { minimum_fare: cRate(9250), max_fare: 100000, max_distance_km: 50, driver_timeout_seconds: 60 }

export async function fetchPricingZones() {
  if (!supabase) return DEFAULT_ZONES
  const { data, error } = await supabase.from('pricing_zones').select('*').order('zone_id')
  if (error || !data?.length) return DEFAULT_ZONES
  return data
}

export async function upsertPricingZone(zone) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('pricing_zones')
    .upsert({ ...zone, updated_at: new Date().toISOString() })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deletePricingZone(id) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('pricing_zones').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchGlobalSettings() {
  if (!supabase) return DEFAULT_SETTINGS
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'ride_settings').maybeSingle()
  return data?.value ?? DEFAULT_SETTINGS
}

export async function saveGlobalSettings(settings) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('app_settings').upsert({
    key: 'ride_settings', value: settings, updated_at: new Date().toISOString(),
  }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}

/** Pure client-side fare estimate — no network call needed.
 *  Returns customer fare (what customer pays).
 *  Driver receives 90% (fare × (1 - INDOO_COMMISSION)).
 */
export function estimateFare(driverType, cityName, distanceKm, zones, settings) {
  const zone = zones.find(z => z.city_name.toLowerCase() === (cityName ?? '').toLowerCase())
             ?? zones.find(z => z.zone_id === 99)
             ?? zones[0]
  const base    = driverType === 'car_taxi' ? zone.car_base_fare : zone.bike_base_fare
  const perKm   = driverType === 'car_taxi' ? zone.car_per_km   : zone.bike_per_km
  const minFare = settings?.minimum_fare ?? cRate(9250)
  const maxFare = settings?.max_fare     ?? 100000
  return Math.min(Math.max(base + Math.round(distanceKm * perKm), minFare), maxFare)
}

/** Get fare breakdown: customer pays, driver gets, INDOO keeps */
export function fareSplit(customerFare) {
  const driverGets = Math.round(customerFare * (1 - INDOO_COMMISSION))
  const indooKeeps = customerFare - driverGets
  return { customerFare, driverGets, indooKeeps, commission: INDOO_COMMISSION }
}

export function formatRp(amount) {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`
}
