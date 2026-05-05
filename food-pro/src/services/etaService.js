const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// In-memory cache: key -> { data, timestamp }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Straight-line distance between two points using the haversine formula.
 * Returns distance in kilometers.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format a duration in minutes to a human-readable string.
 * Examples: "5 min", "12 min", "1 hr 5 min"
 */
export function formatETA(minutes) {
  const rounded = Math.round(minutes);
  if (rounded < 60) {
    return `${rounded} min`;
  }
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (mins === 0) {
    return `${hrs} hr`;
  }
  return `${hrs} hr ${mins} min`;
}

/**
 * Build a cache key from coordinates rounded to 2 decimal places plus profile.
 */
function cacheKey(fromLat, fromLng, toLat, toLng, profile) {
  const round = (v) => Number(v).toFixed(2);
  return `${round(fromLat)},${round(fromLng)};${round(toLat)},${round(toLng)};${profile}`;
}

/**
 * Compute a fallback ETA estimate from straight-line distance.
 * Uses 25 km/h for cycling, 35 km/h for driving profiles.
 */
function fallbackEstimate(fromLat, fromLng, toLat, toLng, profile) {
  const distKm = haversineKm(fromLat, fromLng, toLat, toLng);
  const speedKmH = profile === 'cycling' ? 25 : 35;
  const durationMin = (distKm / speedKmH) * 60;

  return {
    durationMinutes: Math.round(durationMin),
    distanceKm: Math.round(distKm * 10) / 10,
    durationText: formatETA(durationMin),
    distanceText: `${(Math.round(distKm * 10) / 10).toFixed(1)} km`,
  };
}

/**
 * Calculate an ETA between two points using the Mapbox Directions API.
 *
 * @param {number} fromLat
 * @param {number} fromLng
 * @param {number} toLat
 * @param {number} toLng
 * @param {'driving'|'cycling'|'driving-traffic'} profile
 * @returns {Promise<{durationMinutes: number, distanceKm: number, durationText: string, distanceText: string}>}
 */
export async function calculateETA(
  fromLat,
  fromLng,
  toLat,
  toLng,
  profile = 'driving',
) {
  // Check cache first
  const key = cacheKey(fromLat, fromLng, toLat, toLng, profile);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // If no token, return fallback immediately
  if (!MAPBOX_TOKEN) {
    return fallbackEstimate(fromLat, fromLng, toLat, toLng, profile);
  }

  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      `?access_token=${MAPBOX_TOKEN}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Mapbox API responded with status ${res.status}`);
    }

    const json = await res.json();
    const route = json.routes?.[0];
    if (!route) {
      throw new Error('No route found');
    }

    const durationMin = route.duration / 60; // API returns seconds
    const distKm = route.distance / 1000; // API returns meters

    const data = {
      durationMinutes: Math.round(durationMin),
      distanceKm: Math.round(distKm * 10) / 10,
      durationText: formatETA(durationMin),
      distanceText: `${(Math.round(distKm * 10) / 10).toFixed(1)} km`,
    };

    // Store in cache
    cache.set(key, { data, timestamp: Date.now() });

    return data;
  } catch {
    // Graceful fallback on any error
    return fallbackEstimate(fromLat, fromLng, toLat, toLng, profile);
  }
}

/**
 * Calculate a delivery ETA across two legs: driver -> restaurant -> customer.
 * Adds 10 minutes for food prep/pickup.
 *
 * @param {number} restaurantLat
 * @param {number} restaurantLng
 * @param {number} customerLat
 * @param {number} customerLng
 * @param {number} driverLat
 * @param {number} driverLng
 * @returns {Promise<{totalMinutes: number, pickupMinutes: number, deliveryMinutes: number, totalDistanceKm: number, etaText: string}>}
 */
export async function calculateDeliveryETA(
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  driverLat,
  driverLng,
) {
  const PREP_TIME_MIN = 10;

  const [pickupLeg, deliveryLeg] = await Promise.all([
    calculateETA(driverLat, driverLng, restaurantLat, restaurantLng, 'driving'),
    calculateETA(
      restaurantLat,
      restaurantLng,
      customerLat,
      customerLng,
      'driving',
    ),
  ]);

  const pickupMinutes = pickupLeg.durationMinutes;
  const deliveryMinutes = deliveryLeg.durationMinutes;
  const totalMinutes = pickupMinutes + PREP_TIME_MIN + deliveryMinutes;
  const totalDistanceKm =
    Math.round((pickupLeg.distanceKm + deliveryLeg.distanceKm) * 10) / 10;

  return {
    totalMinutes,
    pickupMinutes,
    deliveryMinutes,
    totalDistanceKm,
    etaText: formatETA(totalMinutes),
  };
}
