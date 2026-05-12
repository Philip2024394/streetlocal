import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

function mapMsg(row, myUid) {
  return {
    id: row.id,
    fromMe: row.sender_id === myUid,
    senderId: row.sender_id,
    text: row.text ?? null,
    imageURL: row.image_url ?? null,
    contactType: row.contact_type ?? null,
    contactValue: row.contact_value ?? null,
    orderCard: row.order_card ?? null,
    liked: row.liked ?? false,
    time: new Date(row.created_at).getTime(),
  }
}

export function useMessages(conversationId, demoMessages = []) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const channelRef = useRef(null)

  useEffect(() => {
    if (!supabase || !conversationId ||
        conversationId.startsWith('demo-') ||
        conversationId.startsWith('conv-') ||
        conversationId.startsWith('meet-') ||
        conversationId.startsWith('dating-') ||
        conversationId.startsWith('notif-') ||
        conversationId.startsWith('order-')) {
      setMessages(demoMessages)
      return
    }

    if (!user) {
      setMessages([])
      return
    }

    let mounted = true

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (!mounted) return
      if (error) return

      setMessages((data ?? []).map(row => mapMsg(row, user.id)))
    }

    fetchMessages()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    channelRef.current = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (!mounted || !payload.new) return
          const incoming = mapMsg(payload.new, user.id)
          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (!mounted || !payload.new) return
          const updated = mapMsg(payload.new, user.id)
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
        }
      )
      .subscribe()

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, user])

  return { messages, setMessages }
}
