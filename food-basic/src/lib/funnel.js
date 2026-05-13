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
    // Fire-and-forget. on conflict do nothing (handled by unique index +
    // PostgREST `Prefer: resolution=merge-duplicates` would upsert, but we
    // want the FIRST timestamp preserved, so we just let conflicts error
    // silently — they're 23505 unique violations and harmless).
    supabase.from('funnel_events').insert({
      app_id: APP_ID,
      session_id: sessionId,
      vendor_id: vendorId || null,
      step,
      metadata: metadata || {},
    }).then(() => {}, () => {})
  } catch {
    /* never block UI for analytics */
  }
}
