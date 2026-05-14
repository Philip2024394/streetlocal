/* Funnel drop-off tracking — fire-and-forget step events.
 *
 * Each step is recorded at most once per session (DB unique index on
 * (session_id, step) — we ignore the resulting conflict client-side).
 * Errors are swallowed so a flaky network or RLS hiccup never blocks UI.
 *
 * session_id is shared with the traffic agent under 'sl_session_id' so
 * funnel events can be joined back to traffic-source data.
 */
import { supabase } from './supabase'

const APP_ID = 'food-basic'
const SESSION_KEY = 'sl_session_id'

// Once an emit fails (e.g. 401 from a missing RLS policy on funnel_events),
// stop trying for the rest of the tab session. Persisted in sessionStorage
// so StrictMode double-invokes and quick refreshes don't re-fire the same
// 401 over and over while we wait for the RLS policy to land server-side.
const DISABLED_KEY = 'sl_funnel_disabled'
let funnelDisabled = (() => {
  try { return sessionStorage.getItem(DISABLED_KEY) === '1' } catch { return false }
})()
// Also guard against StrictMode dev double-fire issuing two requests in the
// same tick before the first .then() flips the flag.
let inflight = 0
function markDisabled() {
  funnelDisabled = true
  try { sessionStorage.setItem(DISABLED_KEY, '1') } catch {}
}

function getSessionId() {
  if (typeof window === 'undefined') return null
  try {
    let sid = localStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      localStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    return null
  }
}

export function emitFunnelStep(step, { vendorId = null, metadata = {} } = {}) {
  try {
    if (funnelDisabled) return
    // Don't double-fire while a probe is already in flight — if the first
    // one fails, the flag flips and we never have to issue the second one.
    if (inflight > 0) return
    if (!supabase) return
    const sessionId = getSessionId()
    if (!sessionId) return
    inflight++
    // Use upsert with ignoreDuplicates so the DB handles conflicts via
    // ON CONFLICT DO NOTHING at SQL level (Prefer: resolution=ignore-duplicates)
    // — no more 409 logs from re-mounts hitting the (session_id, step) unique
    // index. First insert wins, subsequent calls are no-ops.
    supabase.from('funnel_events').upsert({
      app_id: APP_ID,
      session_id: sessionId,
      vendor_id: vendorId || null,
      step,
      metadata: metadata || {},
    }, { onConflict: 'session_id,step', ignoreDuplicates: true }).then(
      () => { inflight = Math.max(0, inflight - 1) },
      () => { inflight = Math.max(0, inflight - 1); markDisabled() },
    )
  } catch {
    /* never block UI for analytics */
  }
}
