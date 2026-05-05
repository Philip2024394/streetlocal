import { supabase } from '@/lib/supabase'

// ── Get or create a conversation between buyer and seller ────────────────────
export async function getOrCreateConversation(buyerId, sellerId) {
  if (!supabase) return null
  try {
    // Check existing
    const { data: existing } = await supabase
      .from('marketplace_conversations')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle()
    if (existing) return existing

    // Create new
    const { data, error } = await supabase
      .from('marketplace_conversations')
      .insert({ buyer_id: buyerId, seller_id: sellerId })
      .select()
      .single()
    if (error) throw error
    return data
  } catch (e) {
    console.warn('[chatService] getOrCreateConversation failed', e)
    return null
  }
}

// ── Fetch messages for a conversation ────────────────────────────────────────
export async function fetchMessages(conversationId, limit = 100) {
  if (!supabase || !conversationId) return []
  try {
    const { data, error } = await supabase
      .from('marketplace_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// ── Send a message ──────────────────────────────────────────────────────────
export async function sendMessage(conversationId, senderId, { text, imageUrl }) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('marketplace_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        text: text ?? null,
        image_url: imageUrl ?? null,
      })
      .select()
      .single()
    if (error) throw error

    // Update conversation last_message
    await supabase
      .from('marketplace_conversations')
      .update({
        last_message: text ?? '📷 Image',
        last_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    return data
  } catch (e) {
    console.warn('[chatService] sendMessage failed', e)
    return null
  }
}

// ── Fetch all conversations for a user ──────────────────────────────────────
export async function fetchConversations(userId) {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('marketplace_conversations')
      .select('*, buyer:buyer_id ( display_name, avatar_url ), seller:seller_id ( display_name, brand_name, avatar_url )')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// ── Check if seller is chat-blocked (commission unpaid) ─────────────────────
export async function isSellerChatBlocked(buyerId, sellerId) {
  if (!supabase) return false
  try {
    const { data } = await supabase
      .from('marketplace_conversations')
      .select('seller_blocked')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle()
    return data?.seller_blocked ?? false
  } catch {
    return false
  }
}

// ── Admin: block/unblock seller chat ────────────────────────────────────────
export async function setSellerChatBlock(sellerId, blocked) {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('marketplace_conversations')
      .update({ seller_blocked: blocked })
      .eq('seller_id', sellerId)
    return !error
  } catch {
    return false
  }
}

// ── Subscribe to new messages (realtime) ────────────────────────────────────
export function subscribeToMessages(conversationId, onMessage) {
  if (!supabase || !conversationId) return () => {}
  const channel = supabase
    .channel(`mkt-chat-${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'marketplace_messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => {
      onMessage(payload.new)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}
