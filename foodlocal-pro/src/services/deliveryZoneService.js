/**
 * deliveryZoneService.js — Manage delivery zones for restaurants.
 */
import { supabase } from '@/lib/supabase'

/** Get delivery zones for a restaurant. */
export async function getDeliveryZones(restaurantId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('radius_km', { ascending: true })
  return data || []
}

/** Save/update delivery zones for a restaurant. */
export async function saveDeliveryZones(restaurantId, zones) {
  if (!supabase) return
  await supabase.from('delivery_zones').delete().eq('restaurant_id', restaurantId)
  if (zones.length > 0) {
    await supabase.from('delivery_zones').insert(
      zones.map(z => ({
        restaurant_id: restaurantId,
        zone_name: z.zone_name,
        radius_km: z.radius_km,
        delivery_fee: z.delivery_fee,
        is_active: true,
      }))
    )
  }
}

/** Calculate delivery fee based on distance and zones. */
export function calculateDeliveryFee(distanceKm, zones) {
  if (!zones?.length) return 0
  const sorted = [...zones].sort((a, b) => a.radius_km - b.radius_km)
  for (const zone of sorted) {
    if (distanceKm <= zone.radius_km) return zone.delivery_fee
  }
  return null // beyond all zones
}
