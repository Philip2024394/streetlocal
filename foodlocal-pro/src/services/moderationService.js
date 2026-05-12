import { supabase } from '@/lib/supabase'

/**
 * Report a user with a reason.
 */
export async function reportUser({ reportedUserId, sessionId, reason, details = '' }) {
  if (!supabase) return
  const { error } = await supabase.from('reports').insert({
    reported_user_id: reportedUserId,
    session_id:       sessionId ?? null,
    reason,
    details,
  })
  if (error) throw new Error(error.message)
}

/**
 * Block a user and optionally file a report in one atomic call.
 */
export async function blockUser(blockedUserId, sessionId = null, reason = null, details = null) {
  if (!supabase) return
  const { error } = await supabase.rpc('block_and_report_user', {
    p_blocked_user_id: blockedUserId,
    p_session_id:      sessionId,
    p_reason:          reason,
    p_details:         details,
  })
  if (error) throw new Error(error.message)
}
