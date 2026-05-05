import { supabase } from '../lib/supabase';

const isDemo = (id) =>
  !supabase || !id || id.startsWith('demo-') || id.startsWith('conv-') || id.startsWith('meet-');

export async function sendMessage(conversationId, senderId, text) {
  if (isDemo(conversationId)) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      id: `m-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      text,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, text })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendImageMessage(conversationId, senderId, imageURL) {
  if (isDemo(conversationId)) {
    return {
      id: `m-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      text: null,
      image_url: imageURL,
      created_at: new Date().toISOString(),
    };
  }

  // In production would upload to storage first; for now insert the object URL directly
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, text: null, image_url: imageURL })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendContactMessage(conversationId, senderId, contactType, contactValue) {
  if (isDemo(conversationId)) {
    return {
      id: `m-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      text: null,
      contact_type: contactType,
      contact_value: contactValue,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      text: null,
      contact_type: contactType,
      contact_value: contactValue,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unlockConversation(conversationId) {
  if (isDemo(conversationId)) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return;
  }

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'unlocked', unlocked_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}

/**
 * Post a system-generated contact reveal card into the conversation.
 * Called automatically when a buyer completes their unlock payment.
 * sellerDetails = { displayName, phone, instagram, tiktok, facebook, youtube, website }
 */
export async function postSellerContactReveal(conversationId, senderId, sellerDetails) {
  const localMsg = {
    id:              `m-reveal-${Date.now()}`,
    fromMe:          true,
    isContactReveal: true,
    sellerDetails,
    time:            Date.now(),
  }

  if (isDemo(conversationId)) {
    await new Promise(r => setTimeout(r, 80))
    return localMsg
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id:       senderId,
      text:            null,
      contact_type:    'reveal',
      contact_value:   JSON.stringify(sellerDetails),
    })
    .select()
    .single()

  if (error) throw error
  return { ...localMsg, id: data.id }
}

/**
 * Create (or reuse) a Supabase conversation with a seller and insert the
 * opening order-card message.  Returns { convId, msgId } — both real UUIDs.
 *
 * sellerId must be a valid auth.users UUID.  If it isn't (e.g. demo restaurant
 * with integer id) the call is skipped and null is returned.
 */
export async function saveOrderConversation(sellerId, orderCard) {
  if (!supabase) return null
  // Reject obviously non-UUID seller IDs (demo restaurants use integers)
  if (!sellerId || !/^[0-9a-f-]{36}$/i.test(String(sellerId))) return null
  try {
    const { data, error } = await supabase
      .rpc('create_order_conversation', {
        p_seller_id:  sellerId,
        p_order_card: orderCard,
      })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    return row ? { convId: row.conv_id, msgId: row.msg_id } : null
  } catch {
    return null
  }
}

export async function likeMessage(messageId, liked) {
  if (isDemo(messageId)) return;

  await supabase
    .from('messages')
    .update({ liked })
    .eq('id', messageId);
}

export async function markConversationRead(conversationId, isUserA) {
  if (isDemo(conversationId)) return;

  await supabase
    .from('conversations')
    .update(isUserA ? { unread_a: 0 } : { unread_b: 0 })
    .eq('id', conversationId);
}
