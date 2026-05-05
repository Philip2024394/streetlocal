import { supabase } from '@/lib/supabase'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

// ── Input sanitisation ────────────────────────────────────────────────────────

/**
 * Validate GPS coordinates. Throws if out of range or non-numeric.
 * Prevents fake/malicious coordinates being stored.
 */
function validateCoords(lat, lng) {
  if (lat == null || lng == null) return { lat: null, lng: null }
  const la = parseFloat(lat)
  const lo = parseFloat(lng)
  if (isNaN(la) || isNaN(lo))   throw new Error('Invalid coordinates')
  if (la < -90  || la > 90)     throw new Error('Latitude out of range (-90 to 90)')
  if (lo < -180 || lo > 180)    throw new Error('Longitude out of range (-180 to 180)')
  return { lat: la, lng: lo }
}

/**
 * Strip dangerous characters from free-text social link.
 * Allows only http/https URLs to known social domains — rejects everything else.
 */
function sanitiseSocialLink(link) {
  if (!link) return null
  const trimmed = link.trim()
  // Allow only http(s) URLs — reject javascript:/data:/etc.
  if (!/^https?:\/\//i.test(trimmed)) return null
  try {
    const url  = new URL(trimmed)
    const host = url.hostname.toLowerCase()
    const allowed = ['instagram.com','tiktok.com','facebook.com','youtube.com',
                     'twitter.com','x.com','linkedin.com','t.me','wa.me']
    if (!allowed.some(d => host === d || host.endsWith(`.${d}`))) return null
    return url.href
  } catch {
    return null
  }
}

export async function goLive({ lat, lng, placeId, placeName, venueCategory, activityType, activities, isGroup, groupSize, vibe, area, tier }) {
  if (!supabase) {
    await delay(1200)
    return { sessionId: `demo-my-session-${Date.now()}` }
  }
  const coords = validateCoords(lat, lng)
  const { data, error } = await supabase.rpc('go_live', {
    p_activity_type:  activityType ?? null,
    p_activities:     activities ?? [],
    p_lat:            coords.lat,
    p_lng:            coords.lng,
    p_place_id:       placeId ?? null,
    p_place_name:     placeName ?? null,
    p_venue_category: venueCategory ?? null,
    p_duration_min:   parseInt(import.meta.env.VITE_SESSION_DURATION_MINUTES ?? '90', 10),
    p_is_group:       isGroup ?? false,
    p_group_size:     groupSize ?? null,
    p_vibe:           vibe ?? null,
    p_area:           area ?? null,
  })
  if (error) throw new Error(error.message)
  if (tier === 'business') {
    await supabase.from('sessions').update({ international: true }).eq('id', data)
  }
  return { sessionId: data }
}

export async function endSession(sessionId) {
  if (!supabase) { await delay(400); return }
  const { error } = await supabase.rpc('end_session', { p_session_id: sessionId })
  if (error) throw new Error(error.message)
}

export async function confirmCheckIn(sessionId) {
  if (!supabase) { await delay(300); return }
  const { error } = await supabase
    .from('sessions')
    .update({ needs_check_in: false })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function scheduleLive({ lat, lng, placeId, placeName, venueCategory, activityType, activities, durationMinutes, socialLink, scheduledFor, vibe, tier }) {
  if (!supabase) {
    await delay(800)
    return { sessionId: `demo-my-scheduled-${Date.now()}`, scheduledFor }
  }
  const coords = validateCoords(lat, lng)
  const { data, error } = await supabase.rpc('schedule_live', {
    p_activity_type:  activityType ?? null,
    p_activities:     activities ?? [],
    p_lat:            coords.lat,
    p_lng:            coords.lng,
    p_place_id:       placeId ?? null,
    p_place_name:     placeName ?? null,
    p_venue_category: venueCategory ?? null,
    p_duration_min:   durationMinutes ?? 90,
    p_scheduled_for:  scheduledFor ? new Date(scheduledFor).toISOString() : null,
    p_social_link:    sanitiseSocialLink(socialLink),
    p_vibe:           vibe ?? null,
  })
  if (error) throw new Error(error.message)
  if (tier === 'business') {
    await supabase.from('sessions').update({ international: true }).eq('id', data)
  }
  return { sessionId: data, scheduledFor }
}

export async function cancelScheduled(sessionId) {
  if (!supabase) { await delay(300); return }
  await endSession(sessionId)
}

export async function postInviteOut({ activityType, message, vibe, tier } = {}) {
  if (!supabase) {
    await delay(400)
    return { sessionId: `demo-my-invite-${Date.now()}` }
  }
  const { data, error } = await supabase.rpc('post_invite_out', {
    p_activity_type: activityType ?? null,
    p_message:       message ?? '',
  })
  if (error) throw new Error(error.message)
  // Patch vibe + international flag in one update
  const patch = {}
  if (vibe) patch.vibe = vibe
  if (tier === 'business') patch.international = true
  if (Object.keys(patch).length) {
    await supabase.from('sessions').update(patch).eq('id', data)
  }
  return { sessionId: data }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION EXTENSION — adds extra minutes to an active session's expiry
// Called from the "Still out? Extend 30min" prompt in ExtendSessionPrompt
// ─────────────────────────────────────────────────────────────────────────────
export async function extendSession(sessionId, extraMinutes = 30) {
  if (!supabase) { await delay(300); return }
  const { error } = await supabase.rpc('extend_session', {
    p_session_id:    sessionId,
    p_extra_minutes: extraMinutes,
  })
  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────────────────────────────────────
// OTW REQUEST — guard: only allowed when target session is 'active'
// Uses the send_otw_request RPC which enforces the status check server-side
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOtwRequest(toUserId, sessionId) {
  if (!supabase) { await delay(500); return { otwId: `demo-otw-${Date.now()}` } }
  const { data, error } = await supabase.rpc('send_otw_request', {
    p_to_user_id: toUserId,
    p_session_id: sessionId,
  })
  if (error) throw new Error(error.message)
  return { otwId: data }
}
