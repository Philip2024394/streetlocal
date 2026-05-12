import { supabase } from '@/lib/supabase'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function postInviteOut({ activityType, message }) {
  if (!supabase) {
    await delay(600)
    return { sessionId: `demo-invite-out-${Date.now()}` }
  }
  const { data, error } = await supabase.rpc('post_invite_out', {
    p_activity_type: activityType ?? null,
    p_message: message ?? '',
  })
  if (error) throw new Error(error.message)
  return { sessionId: data }
}

export async function cancelInviteOut(sessionId) {
  if (!supabase) { await delay(300); return }
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'ended' })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}
