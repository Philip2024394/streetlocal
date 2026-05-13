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
    if (!supabase) return
    const sessionId = getSessionId()
    if (!sessionId) return
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
    }, { onConflict: 'session_id,step', ignoreDuplicates: true }).then(() => {}, () => {})
  } catch {
    /* never block UI for analytics */
  }
}
