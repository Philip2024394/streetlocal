/**
 * In-app chat between passenger/customer and driver.
 * Real-time via Supabase with quick reply templates.
 * Demo mode uses in-memory store shared across all components.
 */
import { supabase } from '@/lib/supabase'

const QUICK_REPLIES = {
  passenger: [
    'I\'m at the pickup point',
    'Please wait, coming down now',
    'Can you come to the lobby?',
    'I\'m wearing a red shirt',
    'How far are you?',
  ],
  driver: [
    'I\'m arriving in 2 minutes',
    'I\'m at the pickup location',
    'Traffic is heavy, please wait',
    'I\'m wearing a green jacket',
    'Food is picked up, on the way',
  ],
}

export { QUICK_REPLIES }

// ── In-memory message store (demo mode) ─────────────────────────────────────
const _demoMessages = {}
const _listeners = {}

function notifyListeners(bookingId) {
  if (_listeners[bookingId]) {
    _listeners[bookingId].forEach(fn => fn(_demoMessages[bookingId] || []))
  }
}

/**
 * Subscribe to message updates (works in both demo + production).
 * Returns unsubscribe function.
 */
export function onMessagesUpdated(bookingId, callback) {
  if (!supabase) {
    if (!_listeners[bookingId]) _listeners[bookingId] = new Set()
    _listeners[bookingId].add(callback)
    // Fire immediately with current messages
    callback(_demoMessages[bookingId] || [])
    return () => _listeners[bookingId]?.delete(callback)
  }

  // Production: use Supabase realtime
  const unsub = subscribeToMessages(bookingId, () => {
    getMessages(bookingId).then(callback)
  })
  getMessages(bookingId).then(callback)
  return unsub
}

/**
 * Send a chat message.
 */
export async function sendMessage(bookingId, senderId, senderRole, text) {
  const message = {
    booking_id: bookingId,
    sender_id: senderId,
    sender_role: senderRole,
    text: text.trim(),
    created_at: new Date().toISOString(),
  }

  if (!supabase) {
    const msg = { ...message, id: Date.now() + Math.random() }
    if (!_demoMessages[bookingId]) _demoMessages[bookingId] = []
    _demoMessages[bookingId].push(msg)
    notifyListeners(bookingId)
    return msg
  }

  const { data, error } = await supabase
    .from('booking_messages')
    .insert(message)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get chat history for a booking.
 */
export async function getMessages(bookingId) {
  if (!supabase) return _demoMessages[bookingId] || []
  const { data } = await supabase
    .from('booking_messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
  return data ?? []
}

/**
 * Get unread count for badge.
 */
export function getUnreadCount(bookingId, lastSeenId) {
  const msgs = _demoMessages[bookingId] || []
  if (!lastSeenId) return msgs.length
  const idx = msgs.findIndex(m => m.id === lastSeenId)
  return idx === -1 ? msgs.length : msgs.length - idx - 1
}

/**
 * Subscribe to new messages in real-time (Supabase).
 */
export function subscribeToMessages(bookingId, onMessage) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel(`chat-${bookingId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'booking_messages',
      filter: `booking_id=eq.${bookingId}`,
    }, payload => onMessage(payload.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
