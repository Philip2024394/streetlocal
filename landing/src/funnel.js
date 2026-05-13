/* Funnel drop-off tracking — fire-and-forget step events.
 * See food-basic/src/lib/funnel.js for the canonical comment block.
 */
import { supabase } from './supabase'

const APP_ID = 'landing'
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
