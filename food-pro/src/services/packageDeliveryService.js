/**
 * Package Delivery Service
 * Handles package/parcel delivery with weight-based vehicle routing.
 * Under 25kg → bike, over 25kg → car (Indonesian law PP 55/2012)
 */
import { supabase } from '@/lib/supabase'
import { findDriverForDelivery, calculateDeliveryFare, getWeightCategory } from './deliveryRoutingService'

const PACKAGE_KEY = 'indoo_package_deliveries'

function loadLocalPackages() {
  try { return JSON.parse(localStorage.getItem(PACKAGE_KEY) || '[]') } catch { return [] }
}

function saveLocalPackage(pkg) {
  const all = loadLocalPackages()
  all.unshift(pkg)
  localStorage.setItem(PACKAGE_KEY, JSON.stringify(all))
}

/**
 * Create a package delivery order
 */
export async function createPackageDelivery({
  senderId, senderName, senderPhone,
  pickupAddress, pickupLat, pickupLng,
  dropoffAddress, dropoffLat, dropoffLng,
  description, weightKg,
}) {
  // Determine vehicle type based on weight
  const weightCat = getWeightCategory(weightKg)
  const vehicleType = weightKg > 25 ? 'car_taxi' : 'bike_ride'

  // Find driver
  const result = await findDriverForDelivery(pickupLat, pickupLng, 'package', weightKg)
  const driver = result.drivers[0] ?? null

  // Calculate fare
  const distKm = pickupLat && dropoffLat
    ? Math.round(haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng) * 10) / 10
    : 5
  const fareResult = calculateDeliveryFare(distKm, result.vehicleType, result.usedFallback)

  const cashRef = `PKG-${Date.now().toString(36).toUpperCase().slice(-6)}`

  const pkg = {
    id: cashRef,
    sender_id: senderId ?? null,
    sender_name: senderName ?? null,
    sender_phone: senderPhone ?? null,
    pickup_address: pickupAddress,
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    dropoff_address: dropoffAddress,
    dropoff_lat: dropoffLat,
    dropoff_lng: dropoffLng,
    description: description?.trim() ?? null,
    weight_kg: weightKg,
    weight_category: weightCat?.label ?? null,
    vehicle_type: result.vehicleType,
    used_fallback: result.usedFallback,
    routing_reason: result.reason,
    driver_id: driver?.id ?? null,
    driver_name: driver?.display_name ?? null,
    driver_phone: driver?.phone ?? null,
    delivery_fee: fareResult.fare,
    distance_km: distKm,
    status: driver ? 'driver_assigned' : 'pending',
    cash_ref: cashRef,
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('package_deliveries')
        .insert(pkg)
        .select()
        .single()
      if (!error && data) return data
    } catch {}
  }

  // Demo fallback
  saveLocalPackage(pkg)
  return pkg
}

/**
 * Get user's package deliveries
 */
export async function getMyPackages(userId) {
  if (!supabase) return loadLocalPackages()
  const { data } = await supabase
    .from('package_deliveries')
    .select('*')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? loadLocalPackages()
}

/**
 * Get driver's assigned packages
 */
export async function getDriverPackages(driverId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('package_deliveries')
    .select('*')
    .eq('driver_id', driverId)
    .in('status', ['driver_assigned', 'picked_up'])
    .order('created_at', { ascending: false })
  return data ?? []
}

/**
 * Update package status (driver actions)
 */
export async function updatePackageStatus(packageId, status) {
  const updates = { status }
  if (status === 'picked_up') updates.picked_up_at = new Date().toISOString()
  if (status === 'delivered') updates.delivered_at = new Date().toISOString()

  if (!supabase) {
    const all = loadLocalPackages()
    const updated = all.map(p => p.id === packageId ? { ...p, ...updates } : p)
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(updated))
    return
  }

  await supabase.from('package_deliveries').update(updates).eq('id', packageId)
}

// Simple haversine for distance
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
