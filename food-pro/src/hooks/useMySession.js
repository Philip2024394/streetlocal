import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

const ACTIVE_STATUSES = ['active', 'scheduled', 'invite_out']

function mapRow(row) {
  return {
    id: row.id,
    status: row.status,
    activityType: row.activity_type ?? null,
    activities: row.activities ?? [],
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    placeId: row.place_id ?? null,
    placeName: row.place_name ?? null,
    venueCategory: row.venue_category ?? null,
    expiresAtMs: row.expires_at ? new Date(row.expires_at).getTime() : 0,
    scheduledFor: row.scheduled_for ? new Date(row.scheduled_for).getTime() : null,
    needsCheckIn: row.needs_check_in ?? false,
    isGroup: row.is_group ?? false,
    groupSize: row.group_size ?? null,
    groupMembers: row.group_members ?? [],
    vibe: row.vibe ?? null,
    area: row.area ?? null,
    message: row.message ?? '',
    socialLink: row.social_link ?? null,
  }
}

export function useMySession() {
  const { user } = useAuth()
  const [session, setSession] = useState(undefined)
  const [needsCheckIn, setNeedsCheckIn] = useState(false)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!supabase) {
      if (window.__DEMO_SCHEDULED) {
        setSession({
          id: 'demo-my-scheduled',
          status: 'scheduled',
          activityType: 'drinks',
          scheduledFor: Date.now() + 45 * 60 * 1000,
          expiresAtMs: Date.now() + 165 * 60 * 1000,
        })
      } else {
        setSession(null)
      }
      return
    }

    if (!user) {
      setSession(null)
      return
    }

    let mounted = true

    async function fetchMine() {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!mounted) return
      if (error) { setSession(null); return }
      if (!data) { setSession(null); setNeedsCheckIn(false); return }

      setSession(mapRow(data))
      setNeedsCheckIn(data.needs_check_in === true)
    }

    fetchMine()

    channelRef.current = supabase
      .channel(`my-session-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!mounted) return
          if (payload.eventType === 'DELETE') { setSession(null); setNeedsCheckIn(false); return }
          const row = payload.new
          if (!ACTIVE_STATUSES.includes(row?.status)) {
            setSession(null)
            setNeedsCheckIn(false)
            return
          }
          setSession(mapRow(row))
          setNeedsCheckIn(row.needs_check_in === true)
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
  }, [user])

  return {
    session,
    needsCheckIn,
    isLive: !!session,
    loading: session === undefined,
  }
}
