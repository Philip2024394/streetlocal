// Shared mock data helpers
export const BASE_LAT = 51.5074
export const BASE_LNG = -0.1278

export function offset(minM, maxM) {
  const r = (Math.random() * (maxM - minM) + minM) / 111320
  const angle = Math.random() * 2 * Math.PI
  const lat = BASE_LAT + r * Math.cos(angle)
  const lng = BASE_LNG + r * Math.sin(angle) / Math.cos(BASE_LAT * Math.PI / 180)
  const r2 = (Math.random() * 300 + 200) / 111320
  const a2 = Math.random() * 2 * Math.PI
  return {
    lat,
    lng,
    fuzzedLat: lat + r2 * Math.cos(a2),
    fuzzedLng: lng + r2 * Math.sin(a2) / Math.cos(lat * Math.PI / 180),
  }
}

export const now = Date.now()

const _ukHour = parseInt(
  new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hour12: false }),
  10
)
export const _isUKLateNight = _ukHour >= 0 && _ukHour < 7

export const _LDN = (dlat, dlng) => ({
  lat: 51.5074 + dlat, lng: -0.1278 + dlng,
  fuzzedLat: 51.5074 + dlat + 0.002, fuzzedLng: -0.1278 + dlng + 0.002,
})

export function tonight(hour = 20, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1)
  return d.getTime()
}

export function tomorrow(hour = 14, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}
