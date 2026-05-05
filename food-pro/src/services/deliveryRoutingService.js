/**
 * Delivery Routing Service
 * Routes orders to the correct driver type based on:
 * - Food delivery → always bike first, car fallback if no bike available
 * - Package/marketplace → under 25kg = bike, over 25kg = car only
 * - Passenger ride → bike or car based on user selection
 *
 * Indonesian law (PP No. 55/2012): motorcycle max cargo 25kg
 */
import { fetchNearbyDrivers } from './bookingService'

const MAX_BIKE_WEIGHT_KG = 25

/**
 * Determine which driver type(s) to search for based on order type and weight
 * @param {'food'|'package'|'marketplace'|'dealhunt'|'ride'} orderType
 * @param {number|null} weightKg - estimated weight for packages
 * @param {'bike_ride'|'car_taxi'|null} preferredVehicle - user preference for rides
 * @returns {{ primary: string, fallback: string|null, reason: string }}
 */
export function getDriverTypeForOrder(orderType, weightKg = null, preferredVehicle = null) {
  // Passenger rides — user picks
  if (orderType === 'ride') {
    return {
      primary: preferredVehicle ?? 'bike_ride',
      fallback: null,
      reason: 'User selected vehicle',
    }
  }

  // Food delivery — always bike, car fallback
  if (orderType === 'food') {
    return {
      primary: 'bike_ride',
      fallback: 'car_taxi',
      reason: 'Food delivery — bike priority, car if no bike available',
    }
  }

  // Package, marketplace, deal hunt — weight-based
  if (weightKg != null && weightKg > MAX_BIKE_WEIGHT_KG) {
    return {
      primary: 'car_taxi',
      fallback: null,
      reason: `Over ${MAX_BIKE_WEIGHT_KG}kg — car only (Indonesian law PP 55/2012)`,
    }
  }

  return {
    primary: 'bike_ride',
    fallback: 'car_taxi',
    reason: weightKg != null
      ? `${weightKg}kg — under ${MAX_BIKE_WEIGHT_KG}kg limit, bike first`
      : 'Default bike delivery, car fallback',
  }
}

/**
 * Search for available drivers using routing rules
 * Tries primary type first, falls back if no drivers found
 * @returns {{ drivers: Array, vehicleType: string, usedFallback: boolean, reason: string }}
 */
export async function findDriverForDelivery(lat, lng, orderType, weightKg = null, excludeIds = []) {
  const routing = getDriverTypeForOrder(orderType, weightKg)

  // Search primary type
  let drivers = await fetchNearbyDrivers(lat, lng, routing.primary, excludeIds)
  drivers = drivers.filter(d => !d.driver_busy)

  if (drivers.length > 0) {
    return {
      drivers,
      vehicleType: routing.primary,
      usedFallback: false,
      reason: routing.reason,
      weightKg,
    }
  }

  // Try fallback if available
  if (routing.fallback) {
    let fallbackDrivers = await fetchNearbyDrivers(lat, lng, routing.fallback, excludeIds)
    fallbackDrivers = fallbackDrivers.filter(d => !d.driver_busy)

    if (fallbackDrivers.length > 0) {
      return {
        drivers: fallbackDrivers,
        vehicleType: routing.fallback,
        usedFallback: true,
        reason: `No ${routing.primary === 'bike_ride' ? 'bike' : 'car'} available — using ${routing.fallback === 'car_taxi' ? 'car' : 'bike'} instead`,
        weightKg,
      }
    }
  }

  // No drivers at all
  return {
    drivers: [],
    vehicleType: routing.primary,
    usedFallback: false,
    reason: 'No drivers available',
    weightKg,
  }
}

/**
 * Calculate delivery fare with vehicle type adjustment
 * Car delivery costs more than bike
 */
export function calculateDeliveryFare(distKm, vehicleType, usedFallback = false) {
  // Kemenhub Zone 1 (Java/Bali) rates
  const rates = {
    bike_ride: { base: 9250, perKm: 1850, min: 10000, max: 80000 },
    car_taxi:  { base: 12000, perKm: 3500, min: 15000, max: 150000 },
  }

  const rate = rates[vehicleType] ?? rates.bike_ride
  let fare = Math.min(Math.max(rate.base + Math.round(distKm * rate.perKm), rate.min), rate.max)

  // If car was fallback for food (no bikes available), show original bike fare
  // but note the upgrade — customer shouldn't pay more because bikes were busy
  if (usedFallback && vehicleType === 'car_taxi') {
    const bikeFare = Math.min(Math.max(rates.bike_ride.base + Math.round(distKm * rates.bike_ride.perKm), rates.bike_ride.min), rates.bike_ride.max)
    return {
      fare: bikeFare, // charge bike rate
      vehicleFare: fare, // actual car rate (INDOO absorbs difference)
      savings: fare - bikeFare,
      note: 'Car delivery at bike price — no bikes available',
    }
  }

  return { fare, vehicleFare: fare, savings: 0, note: null }
}

/**
 * Get weight category label for UI display
 */
export function getWeightCategory(weightKg) {
  if (weightKg == null) return null
  if (weightKg <= 5)  return { label: 'Light', icon: '🪶', color: '#8DC63F', vehicle: 'bike' }
  if (weightKg <= 15) return { label: 'Medium', icon: '📦', color: '#FACC15', vehicle: 'bike' }
  if (weightKg <= 25) return { label: 'Heavy', icon: '📦', color: '#F59E0B', vehicle: 'bike' }
  if (weightKg <= 50) return { label: 'Very Heavy', icon: '🚗', color: '#EF4444', vehicle: 'car' }
  return { label: 'Oversized', icon: '🚛', color: '#DC2626', vehicle: 'car' }
}

/**
 * Weight input options for quick selection
 */
export const WEIGHT_OPTIONS = [
  { label: 'Under 5kg', value: 3, icon: '🪶' },
  { label: '5-15kg', value: 10, icon: '📦' },
  { label: '15-25kg', value: 20, icon: '📦' },
  { label: '25-50kg', value: 35, icon: '🚗' },
  { label: 'Over 50kg', value: 60, icon: '🚛' },
]
