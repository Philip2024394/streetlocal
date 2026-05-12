import { supabase } from '@/lib/supabase'

const delay = (ms) => new Promise(r => setTimeout(r, ms))
const isDemo = (id) => !supabase || !id || id.startsWith('dev-') || id.startsWith('demo-')

export async function sendMeetRequest(fromUser, targetUserId, sessionId) {
  if (isDemo(sessionId)) { await delay(400); return { id: `demo-meet-${Date.now()}` } }
  const { data, error } = await supabase
    .from('interests')
    .insert({
      from_user_id:       fromUser.id,
      from_display_name:  fromUser.displayName ?? null,
      from_photo_url:     fromUser.photoURL ?? null,
      to_user_id:         targetUserId,
      session_id:         sessionId,
      status:             'pending',
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function acceptMeetRequest(interestId) {
  if (isDemo(interestId)) { await delay(400); return }
  const { error } = await supabase
    .from('interests')
    .update({ status: 'accepted' })
    .eq('id', interestId)
  if (error) throw new Error(error.message)
}

export async function declineMeetRequest(interestId) {
  if (isDemo(interestId)) { await delay(400); return }
  const { error } = await supabase
    .from('interests')
    .update({ status: 'declined' })
    .eq('id', interestId)
  if (error) throw new Error(error.message)
}

// Creates (or returns existing) real Supabase conversation UUID for a meet request.
export async function createMeetConversation(otherUserId, sessionId = null) {
  if (!supabase || !otherUserId) return null
  const { data, error } = await supabase
    .rpc('create_meet_conversation', {
      p_other_user_id: otherUserId,
      p_session_id:    sessionId ?? null,
    })
  if (error) throw new Error(error.message)
  return data // real UUID string
}
