/**
 * Indoo Phase 1 Algorithm
 *
 * Scores each session so the discovery list surfaces the most
 * relevant people first. No ML — pure signal weighting.
 *
 * Max possible score: ~315
 *
 * Factors (in priority order):
 *   1. Mutual interest (both liked each other)  +80
 *   2. Live status  (Out Now > Invite > Later)   0–100
 *   3. Distance     (closer = higher)            0–80
 *   4. Activity overlap (shared interests)       0–60
 *   5. Profile quality (photo + bio)             0–25
 *   6. Has photo                                 +15
 *   7. Recent activity (started session recently)+10
 *   8. Anti-fatigue  (×0.6 after 3 views, 6h window)
 */

// ─── Impression tracking (anti-fatigue) ───────────────────────────────────────
// Tracks how many times a session card has been shown within a 6-hour window.
// After FATIGUE_THRESHOLD views with no interaction the score is multiplied by
// FATIGUE_PENALTY so the same face stops dominating the feed.

const IMPRESSION_TTL_MS  = 6 * 60 * 60 * 1000  // 6 hours
const FATIGUE_THRESHOLD  = 3
const FATIGUE_PENALTY    = 0.6

function _impressionKey(sessionId) { return `imp_${sessionId}` }

function _getImpressionCount(sessionId) {
  if (!sessionId) return 0
  try {
    const raw = localStorage.getItem(_impressionKey(sessionId))
    if (!raw) return 0
    const { count, firstSeen } = JSON.parse(raw)
    return Date.now() - firstSeen > IMPRESSION_TTL_MS ? 0 : count
  } catch { return 0 }
}

/** Call this each time a session appears in the visible feed. */
export function recordImpression(sessionId) {
  if (!sessionId) return
  try {
    const key = _impressionKey(sessionId)
    const raw = localStorage.getItem(key)
    const now = Date.now()
    const prev = raw ? JSON.parse(raw) : { count: 0, firstSeen: now }
    if (now - prev.firstSeen > IMPRESSION_TTL_MS) {
      localStorage.setItem(key, JSON.stringify({ count: 1, firstSeen: now }))
    } else {
      localStorage.setItem(key, JSON.stringify({ count: prev.count + 1, firstSeen: prev.firstSeen }))
    }
  } catch {}
}

/** Call this when the user interacts (opens profile, sends interest, etc.). */
export function resetImpressions(sessionId) {
  if (!sessionId) return
  try { localStorage.removeItem(_impressionKey(sessionId)) } catch {}
}

// ─── Status score ────────────────────────────────────────────────────────────
function statusScore(session) {
  if (session.status === 'active' || session.status === 'live') return 100
  if (session.status === 'invite_out')  return 60
  if (session.status === 'scheduled')   return 30
  return 50 // unknown / online
}

// ─── Distance score ───────────────────────────────────────────────────────────
function distanceScore(distanceKm) {
  if (distanceKm == null) return 20 // no data — neutral
  if (distanceKm < 0.1)  return 80
  if (distanceKm < 0.25) return 72
  if (distanceKm < 0.5)  return 62
  if (distanceKm < 1)    return 50
  if (distanceKm < 2)    return 38
  if (distanceKm < 5)    return 22
  if (distanceKm < 10)   return 12
  return 5
}

// ─── Activity overlap score ───────────────────────────────────────────────────
function activityScore(session, mySession) {
  if (!mySession) return 0
  const mine   = new Set([
    ...(mySession.activities   ?? []),
    ...(mySession.activityType ? [mySession.activityType] : []),
  ])
  const theirs = [
    ...(session.activities   ?? []),
    ...(session.activityType ? [session.activityType] : []),
  ]
  if (mine.size === 0 || theirs.length === 0) return 0
  const matches = theirs.filter(a => mine.has(a)).length
  return Math.min(matches * 20, 60)
}

// ─── Profile quality score ────────────────────────────────────────────────────
function profileScore(session) {
  let s = 0
  if (session.photoURL || session.photos?.length) s += 15
  if (session.bio?.trim())                        s += 10
  return s
}

// ─── Recency score ────────────────────────────────────────────────────────────
// Reward sessions that started recently (fresh energy on the app)
function recencyScore(session) {
  if (!session.startedAtMs) return 0
  const minutesAgo = (Date.now() - session.startedAtMs) / 60000
  if (minutesAgo < 10)  return 10
  if (minutesAgo < 30)  return 7
  if (minutesAgo < 60)  return 4
  return 0
}

// ─── Category affinity score ─────────────────────────────────────────────────
// Built-in affinity pairs: interactions with one category lift related ones.
// These are static defaults — DB weights layer on top as a multiplier.
const AFFINITY_PAIRS = {
  handmade:        ['art_craft'],
  restaurant:      ['catering'],
  fitness_pt:      ['healthcare', 'alt_medicine'],
  content_creator: ['creative', 'music_perform', 'photography'],
  creative:        ['events', 'event_planning'],
  music_perform:   ['bar_nightclub'],
  buy_sell:        ['fashion', 'retail'],
}

function categoryAffinityScore(session, mySession) {
  const weight = session.affinityWeight ?? 1.0
  // Weight is 1.0 (neutral) → 5.0 (strong affinity).
  // Map to a 0–30 bonus so it nudges without overriding primary signals.
  let score = Math.round((weight - 1.0) / 4.0 * 30)

  // Static pair boost: if this session's category is a known affinity match for
  // the user's own session category, add a 5-point base even before DB weight exists.
  if (weight === 1.0 && mySession?.lookingFor && session.lookingFor) {
    const pairs = AFFINITY_PAIRS[mySession.lookingFor] ?? []
    if (pairs.includes(session.lookingFor)) score += 5
  }

  return score
}

// ─── Main scorer ─────────────────────────────────────────────────────────────
/**
 * @param {object} session     — the profile to score
 * @param {object} mySession   — the current user's own session (for activity overlap)
 * @param {Set}    mutualSet   — Set of session IDs that are mutual interests
 * @returns {number}           — higher = more relevant
 */
export function scoreSession(session, mySession, mutualSet = new Set()) {
  const mutual   = mutualSet.has(session.id) ? 80 : 0
  const status   = statusScore(session)
  const distance = distanceScore(session.distanceKm)
  const activity = activityScore(session, mySession)
  const profile  = profileScore(session)
  const recency  = recencyScore(session)
  const affinity = categoryAffinityScore(session, mySession)

  let total = mutual + status + distance + activity + profile + recency + affinity

  // Anti-fatigue: penalise sessions shown 3+ times with no interaction in 6h window.
  // Seeded/demo profiles are exempt — they are always shown when needed.
  if (!session.isSeeded && _getImpressionCount(session.id) >= FATIGUE_THRESHOLD) {
    total *= FATIGUE_PENALTY
  }

  return total
}

/**
 * Sort a sessions array by relevance score, highest first.
 * Mutual interests always float to the top regardless of other signals.
 */
export function sortByRelevance(sessions, mySession, mutualSet = new Set()) {
  return [...sessions].sort((a, b) =>
    scoreSession(b, mySession, mutualSet) - scoreSession(a, mySession, mutualSet)
  )
}

/**
 * Debug helper — returns a breakdown for each factor.
 * Usage: console.table(explainScore(session, mySession, mutualSet))
 */
export function explainScore(session, mySession, mutualSet = new Set()) {
  return {
    displayName: session.displayName,
    mutual:      mutualSet.has(session.id) ? 80 : 0,
    status:      statusScore(session),
    distance:    distanceScore(session.distanceKm),
    activity:    activityScore(session, mySession),
    profile:     profileScore(session),
    recency:     recencyScore(session),
    affinity:    categoryAffinityScore(session, mySession),
    impressions: _getImpressionCount(session.id),
    fatigued:    !session.isSeeded && _getImpressionCount(session.id) >= FATIGUE_THRESHOLD,
    total:       scoreSession(session, mySession, mutualSet),
  }
}
