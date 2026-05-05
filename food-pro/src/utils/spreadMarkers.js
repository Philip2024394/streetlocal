/**
 * Prevents map markers from overlapping by arranging close markers into a
 * staggered honeycomb grid — natural looking, fills center first, capped at
 * MAX_PER_ROW columns (~60% of a phone screen) before wrapping to a new row.
 *
 * Odd rows are offset by half the horizontal spacing (brick/honeycomb pattern).
 *
 * @param {Array}  items        - array of session/venue objects
 * @param {string} latKey       - key holding latitude  (e.g. 'lat' or 'fuzzedLat')
 * @param {string} lngKey       - key holding longitude (e.g. 'lng' or 'fuzzedLng')
 * @param {number} thresholdDeg - center-to-center distance (degrees) that counts as overlapping
 * @param {number} spacingDeg   - horizontal distance (degrees) between marker centres
 * @returns {Array} new array with adjusted lat/lng — originals are NOT mutated
 */
export function spreadMarkers(
  items,
  latKey       = 'lat',
  lngKey       = 'lng',
  thresholdDeg = 0.0075,
  spacingDeg   = 0.0095,
) {
  if (!items || items.length <= 1) return items ?? []

  const n = items.length

  // Build overlap adjacency
  const overlaps = Array.from({ length: n }, () => new Set())
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dlat = Math.abs(items[i][latKey] - items[j][latKey])
      const dlng = Math.abs(items[i][lngKey] - items[j][lngKey])
      if (dlat < thresholdDeg && dlng < thresholdDeg) {
        overlaps[i].add(j)
        overlaps[j].add(i)
      }
    }
  }

  // Connected components via BFS
  const visited = new Set()
  const groups  = []
  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue
    const group = []
    const queue = [i]
    visited.add(i)
    while (queue.length) {
      const curr = queue.shift()
      group.push(curr)
      for (const nb of overlaps[curr]) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
      }
    }
    groups.push(group)
  }

  // Clone and apply offsets
  const result = items.map(item => ({ ...item }))

  for (const group of groups) {
    if (group.length <= 1) continue

    // Centre of mass
    const cLat = group.reduce((s, i) => s + items[i][latKey], 0) / group.length
    const cLng = group.reduce((s, i) => s + items[i][lngKey], 0) / group.length

    // ── Honeycomb staggered grid ──────────────────────────────────────────
    // Max 3 per row keeps the spread within ~60% of a 390px phone screen at
    // zoom 14 (3 × 95px ≈ 190px). Rows beyond that wrap downward with a
    // half-step stagger on alternating rows for a natural brick pattern.
    const MAX_PER_ROW = 2
    const hStep = spacingDeg          // horizontal centre-to-centre
    const vStep = spacingDeg * 0.88   // vertical step — slightly tighter than horizontal

    // Slice group into rows of at most MAX_PER_ROW
    const rows = []
    for (let i = 0; i < group.length; i += MAX_PER_ROW) {
      rows.push(group.slice(i, i + MAX_PER_ROW))
    }

    const totalRows = rows.length
    // Total vertical span, centred on cLat
    const totalVSpan = (totalRows - 1) * vStep

    rows.forEach((row, rowIdx) => {
      // Odd rows staggered by half horizontal step (brick pattern)
      const stagger  = rowIdx % 2 === 1 ? hStep * 0.5 : 0
      const rowWidth = (row.length - 1) * hStep
      // lat increases northward; row 0 at top (highest lat)
      const rowLat   = cLat + totalVSpan / 2 - rowIdx * vStep

      row.forEach((idx, colIdx) => {
        result[idx][latKey] = rowLat
        result[idx][lngKey] = cLng - rowWidth / 2 + stagger + colIdx * hStep
      })
    })
  }

  return result
}
