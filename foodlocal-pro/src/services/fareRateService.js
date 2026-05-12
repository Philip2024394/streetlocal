/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Fare Rate Service — government-regulated km rates for rides & delivery
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Rates set by Kemenhub (Ministry of Transport Indonesia).
 * Admin can update via dashboard. INDOO takes 10% from driver fare.
 * Daily deal orders get 5% off delivery (INDOO absorbs from commission).
 */
import { supabase } from '@/lib/supabase'

// Customer-facing rates (10% commission built in, driver gets 90%)
// Zone 1: driver min bike Rp 1,850/km, car Rp 3,200/km
// Customer rate = driver_min / 0.90
const DEFAULT_RATES = {
  bike: { baseFare: 10280, perKm: 2055, minFare: 10280, maxFare: 100000, surgeMax: 2.0 },
  car:  { baseFare: 16670, perKm: 3555, minFare: 16670, maxFare: 100000, surgeMax: 2.0 },
}

const DEFAULT_DELIVERY = {
  baseFare: 9250, perKm: 1850, minFare: 10000, maxFare: 80000,
}

const INDOO_COMMISSION = 0.10
const DEAL_DELIVERY_DISCOUNT = 0.05

/**
 * Get ride fare rates for a zone + vehicle type
 */
export async function getRideRate(zone = 'zone_1', vehicleType = 'bike') {
  if (supabase) {
    const { data } = await supabase
      .from('fare_rates')
      .select('*')
      .eq('zone', zone)
      .eq('vehicle_type', vehicleType)
      .eq('is_active', true)
      .maybeSingle()
    if (data) return {
      baseFare: data.base_fare,
      perKm: data.per_km_rate,
      minFare: data.min_fare,
      maxFare: data.max_fare,
      surgeMax: data.surge_max,
      commission: data.indoo_commission / 100,
    }
  }
  return { ...DEFAULT_RATES[vehicleType] ?? DEFAULT_RATES.bike, commission: INDOO_COMMISSION }
}

/**
 * Get delivery fare rates for a zone
 */
export async function getDeliveryRate(zone = 'zone_1') {
  if (supabase) {
    const { data } = await supabase
      .from('delivery_rates')
      .select('*')
      .eq('zone', zone)
      .eq('is_active', true)
      .maybeSingle()
    if (data) return {
      baseFare: data.base_fare,
      perKm: data.per_km_rate,
      minFare: data.min_fare,
      maxFare: data.max_fare,
      dealDiscountPct: data.deal_discount_pct / 100,
      commission: data.indoo_commission / 100,
    }
  }
  return { ...DEFAULT_DELIVERY, dealDiscountPct: DEAL_DELIVERY_DISCOUNT, commission: INDOO_COMMISSION }
}

/**
 * Calculate ride fare
 */
export function calcRideFare(distKm, rate, surgeMultiplier = 1.0) {
  const surge = Math.min(surgeMultiplier, rate.surgeMax ?? 2.0)
  const raw = Math.round((rate.baseFare + distKm * rate.perKm) * surge)
  const fare = Math.max(raw, rate.minFare)
  return rate.maxFare ? Math.min(fare, rate.maxFare) : fare
}

/**
 * Calculate delivery fare (with optional daily deal discount)
 */
export function calcDeliveryFare(distKm, rate, isDailyDeal = false) {
  if (distKm == null) return null
  const raw = rate.baseFare + Math.round(distKm * rate.perKm)
  let fare = Math.min(Math.max(raw, rate.minFare), rate.maxFare ?? 999999)
  if (isDailyDeal) {
    const discount = Math.round(fare * (rate.dealDiscountPct ?? DEAL_DELIVERY_DISCOUNT))
    fare -= discount
  }
  return fare
}

/**
 * Calculate commission split
 * For daily deal delivery: INDOO absorbs 5% discount from their 10% food commission
 */
export function calcCommission(fare, isDailyDeal = false) {
  const driverCut = Math.round(fare * (1 - INDOO_COMMISSION))
  const indooCut = fare - driverCut

  if (isDailyDeal) {
    // INDOO absorbs the 5% delivery discount from food commission
    // Driver always gets full rate
    return {
      driverReceives: Math.round(fare * (1 - INDOO_COMMISSION)),
      indooReceives: indooCut,
      dealDeliveryDiscount: Math.round(fare * DEAL_DELIVERY_DISCOUNT),
      indooNetAfterDiscount: indooCut - Math.round(fare * DEAL_DELIVERY_DISCOUNT),
    }
  }

  return { driverReceives: driverCut, indooReceives: indooCut }
}

/**
 * Admin: update fare rate
 */
export async function updateFareRate(zone, vehicleType, updates) {
  if (!supabase) return { error: 'No database' }
  const { error } = await supabase.from('fare_rates').update({
    base_fare: updates.baseFare,
    per_km_rate: updates.perKm,
    min_fare: updates.minFare,
    max_fare: updates.maxFare,
    surge_max: updates.surgeMax,
    indoo_commission: updates.commission * 100,
    updated_at: new Date().toISOString(),
  }).eq('zone', zone).eq('vehicle_type', vehicleType)
  return error ? { error: error.message } : { success: true }
}

/**
 * Admin: update delivery rate
 */
export async function updateDeliveryRate(zone, updates) {
  if (!supabase) return { error: 'No database' }
  const { error } = await supabase.from('delivery_rates').update({
    base_fare: updates.baseFare,
    per_km_rate: updates.perKm,
    min_fare: updates.minFare,
    max_fare: updates.maxFare,
    deal_discount_pct: (updates.dealDiscountPct ?? 0.05) * 100,
    indoo_commission: (updates.commission ?? 0.10) * 100,
    updated_at: new Date().toISOString(),
  }).eq('zone', zone)
  return error ? { error: error.message } : { success: true }
}
