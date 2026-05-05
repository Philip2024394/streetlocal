import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { usePushNotifications } from './usePushNotifications'
import { filterExpiredNotifications } from '@/utils/offlineBuffer'

function mapNotif(row) {
  return {
    id:          row.id,
    type:        row.type,
    title:       row.title,
    body:        row.body ?? '',
    fromUserId:  row.from_user_id ?? null,
    sessionId:   row.session_id ?? null,
    read:        row.read ?? false,
    createdAt:   row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    // Profile join (if queried with from_profile)
    fromName:    row.from_profile?.display_name ?? null,
    fromPhoto:   row.from_profile?.photo_url ?? null,
  }
}

export function useNotifications() {
  const { user } = useAuth()
  const { notify } = usePushNotifications()
  const [notifications, setNotifications] = useState([])
  const [profileViews, setProfileViews] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [serviceUnreadCounts, setServiceUnreadCounts] = useState({})
  const channelRef = useRef(null)
  const knownIdsRef = useRef(new Set())

  useEffect(() => {
    // Demo mode — show sample notification counts on module icons
    if (!supabase || !user) {
      setServiceUnreadCounts({ food: 2, bike_ride: 1, dating: 3, shopping: 1, car_taxi: 0, massage: 0, rentals: 0, dealhunt: 1 })
      setUnreadCount(8)
      return
    }
    let mounted = true

    async function fetchAll(isRealtime = false) {
      // Fetch notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*, from_profile:profiles!from_user_id(display_name, photo_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Fetch profile views (who viewed me — last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: views } = await supabase
        .from('profile_views')
        .select('*, viewer:profiles!viewer_id(display_name, photo_url, age, city)')
        .eq('viewed_id', user.id)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false })

      if (!mounted) return
      const mapped = (notifs ?? []).map(mapNotif)

      // Fire push for any new unread notifications that arrived via real-time
      // Suppressed if the user is outside their typical active time window (P6)
      if (isRealtime) {
        const newNotifs = mapped.filter(n => !n.read && !knownIdsRef.current.has(n.id))
        if (newNotifs.length > 0) {
          // Read own bucket — owner-only RLS, safe to query client-side
          const { data: bucketRow } = await supabase
            .from('user_behaviour_buckets')
            .select('bucket')
            .eq('user_id', user.id)
            .maybeSingle()

          let suppress = false
          if (bucketRow?.bucket) {
            const hour = new Date().getHours()
            const dow  = new Date().getDay()
            const b    = bucketRow.bucket
            suppress =
              (b === 'late_night'         && !(hour >= 0 && hour < 3))                              ||
              (b === 'evening_socialiser' && !(hour >= 17))                                         ||
              (b === 'weekend_only'       && !(dow === 0 || dow === 6))                             ||
              (b === 'business_hours'     && !(hour >= 9 && hour <= 17 && dow >= 1 && dow <= 5))
          }

          if (!suppress) {
            newNotifs.forEach(n => notify(n.title || 'Indoo', { body: n.body || '', tag: n.id }))
          }
        }
      }
      mapped.forEach(n => knownIdsRef.current.add(n.id))

      const filtered = filterExpiredNotifications(mapped)
      setNotifications(filtered)
      const unread = filtered.filter(n => !n.read)
      setUnreadCount(unread.length)

      // Per-service unread counts — maps notification type → FloatingIcons icon ID
      const SERVICE_MAP = {
        ride_request:             ['bike_ride', 'car_taxi'],
        ride_accepted:            ['bike_ride', 'car_taxi'],
        ride_expired:             ['bike_ride', 'car_taxi'],
        ride_cancelled:           ['bike_ride', 'car_taxi'],
        date_invite:              ['dating'],
        date_accepted:            ['dating'],
        date_suggestion_accepted: ['dating'],
        wave:                     ['dating'],
        liked:                    ['dating'],
        food_order:               ['food'],
        food_ready:               ['food'],
        market_message:           ['shopping'],
        market_order:             ['shopping'],
        market_review:            ['shopping'],
        massage_booking:          ['massage'],
        massage_confirmed:        ['massage'],
        rental_booking:           ['rentals'],
        rental_confirmed:         ['rentals'],
        dealhunt_alert:           ['dealhunt'],
        dealhunt_won:             ['dealhunt'],
      }
      const svc = { bike_ride: 0, car_taxi: 0, food: 0, dating: 0, shopping: 0, massage: 0, rentals: 0, dealhunt: 0 }
      unread.forEach(n => {
        const targets = SERVICE_MAP[n.type] ?? []
        targets.forEach(id => { svc[id] = (svc[id] ?? 0) + 1 })
      })
      setServiceUnreadCounts({ ...svc })
      setProfileViews((views ?? []).map(v => ({
        id:          v.id,
        viewerId:    v.viewer_id,
        displayName: v.viewer?.display_name ?? 'Someone',
        photoURL:    v.viewer?.photo_url ?? null,
        age:         v.viewer?.age ?? null,
        city:        v.viewer?.city ?? null,
        createdAt:   new Date(v.created_at).getTime(),
      })))
    }

    fetchAll(false)

    channelRef.current = supabase
      .channel(`notifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { if (mounted) fetchAll(true) }
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

  async function markAllRead() {
    if (!supabase || !user) return
    await supabase.rpc('mark_notifications_read')
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return { notifications, profileViews, unreadCount, serviceUnreadCounts, markAllRead }
}
