/* Services Local Chat — chat helpers (Supabase) */
import { supabase } from './supabase'

const LS_KEY = 'serviceslocalchat_customer_conversations'

export function loadCustomerConvos() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

export function rememberCustomerConvo(vendorId, conversationId, customerPhone, customerName) {
  if (!vendorId || !conversationId) return
  const all = loadCustomerConvos()
  all[vendorId] = { conversationId, customerPhone, customerName, updatedAt: Date.now() }
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)) } catch {}
}

export function getRememberedConvo(vendorId) {
  const all = loadCustomerConvos()
  return all[vendorId] || null
}

export function fmtRupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}

/**
 * Find or create a conversation for (vendorId, customerPhone) and insert the order message.
 * Returns { conversation, message } on success, or { error } on failure.
 */
export async function sendCustomerOrder({ vendorId, customerPhone, customerName, orderPayload, summaryBody }) {
  if (!supabase) return { error: 'Supabase not configured' }
  if (!vendorId) return { error: 'Missing vendor id' }
  const phone = String(customerPhone || '').replace(/[^0-9]/g, '')
  if (!phone) return { error: 'Phone required' }

  // Find existing conversation
  let conversation = null
  {
    const { data } = await supabase.from('chat_conversations')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('customer_phone', phone)
      .maybeSingle()
    conversation = data || null
  }
  if (!conversation) {
    const { data, error } = await supabase.from('chat_conversations').insert({
      vendor_id: vendorId,
      customer_phone: phone,
      customer_name: customerName || null,
    }).select().single()
    if (error) return { error: error.message }
    conversation = data
  } else if (customerName && customerName !== conversation.customer_name) {
    await supabase.from('chat_conversations').update({ customer_name: customerName }).eq('id', conversation.id)
    conversation.customer_name = customerName
  }

  // Insert order message
  const { data: message, error: msgErr } = await supabase.from('chat_messages').insert({
    conversation_id: conversation.id,
    sender_role: 'customer',
    body: summaryBody || 'New order',
    order_payload: orderPayload || null,
  }).select().single()
  if (msgErr) return { error: msgErr.message }

  rememberCustomerConvo(vendorId, conversation.id, phone, customerName)
  return { conversation, message }
}

/**
 * Send a text message from customer or vendor.
 */
export async function sendChatText({ conversationId, senderRole, body }) {
  if (!supabase) return { error: 'Supabase not configured' }
  if (!conversationId || !body || !body.trim()) return { error: 'Empty' }
  const { data, error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_role: senderRole,
    body: body.trim(),
  }).select().single()
  if (error) return { error: error.message }
  return { message: data }
}

export async function sendSystemStatus({ conversationId, body }) {
  if (!supabase) return { error: 'Supabase not configured' }
  const { data, error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_role: 'system',
    body,
  }).select().single()
  if (error) return { error: error.message }
  return { message: data }
}

export async function loadMessages(conversationId, limit = 200) {
  if (!supabase || !conversationId) return []
  const { data } = await supabase.from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)
  return data || []
}

export async function loadVendorConversations(vendorId) {
  if (!supabase || !vendorId) return []
  const { data } = await supabase.from('chat_conversations')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('last_message_at', { ascending: false })
  return data || []
}

export async function clearVendorUnread(conversationId) {
  if (!supabase || !conversationId) return
  await supabase.from('chat_conversations').update({ unread_vendor_count: 0 }).eq('id', conversationId)
}

export async function clearCustomerUnread(conversationId) {
  if (!supabase || !conversationId) return
  await supabase.from('chat_conversations').update({ unread_customer_count: 0 }).eq('id', conversationId)
}

/**
 * Subscribe to message INSERTs in a conversation. Returns an unsub function.
 */
export function subscribeToMessages(conversationId, onMessage) {
  if (!supabase || !conversationId) return () => {}
  const channel = supabase
    .channel('chat_messages:' + conversationId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => onMessage(payload.new))
    .subscribe()
  return () => { try { supabase.removeChannel(channel) } catch {} }
}

/**
 * Subscribe to all message INSERTs for a vendor's conversations.
 * Implementation: subscribe to chat_messages INSERTs without filter, then filter
 * in handler by conversation_id ∈ vendorConvIds (passed as a getter so it stays
 * fresh as new conversations appear).
 */
export function subscribeToVendorMessages(vendorId, onMessage) {
  if (!supabase || !vendorId) return () => {}
  const channel = supabase
    .channel('vendor_msgs:' + vendorId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
    }, (payload) => onMessage(payload.new))
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chat_conversations',
      filter: `vendor_id=eq.${vendorId}`,
    }, (payload) => onMessage({ __conv: true, ...payload.new }))
    .subscribe()
  return () => { try { supabase.removeChannel(channel) } catch {} }
}
