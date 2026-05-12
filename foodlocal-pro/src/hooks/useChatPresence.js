import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Returns { isOnline: boolean } for the given userId.
// Online = last_seen_at within the past 3 minutes.
// Updates in real-time via Supabase postgres_changes.
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000   // 3 minutes

export function useChatPresence(userId) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (!userId || !supabase) return

    let timer = null

    const checkOnline = (lastSeenAt) => {
      if (!lastSeenAt) { setIsOnline(false); return }
      const age = Date.now() - new Date(lastSeenAt).getTime()
      setIsOnline(age < ONLINE_THRESHOLD_MS)
    }

    // Initial fetch
    supabase
      .from('profiles')
      .select('last_seen_at')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) checkOnline(data.last_seen_at)
      })

    // Real-time subscription
    const channel = supabase
      .channel(`presence-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          checkOnline(payload.new?.last_seen_at)
        }
      )
      .subscribe()

    // Re-evaluate every 60s so stale "online" fades to offline naturally
    timer = setInterval(() => {
      supabase
        .from('profiles')
        .select('last_seen_at')
        .eq('id', userId)
        .single()
        .then(({ data }) => { if (data) checkOnline(data.last_seen_at) })
    }, 60_000)

    return () => {
      clearInterval(timer)
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { isOnline }
}
