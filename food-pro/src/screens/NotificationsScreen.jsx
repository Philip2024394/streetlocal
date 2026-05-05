import { useState, useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { supabase } from '@/lib/supabase'
import ProfileStrip from '@/components/map/ProfileStrip'
import IndooFooter from '@/components/ui/IndooFooter'
import styles from './NotificationsScreen.module.css'

// ── Active vibe blasts targeting this user ────────────────────────────────
function useVibeBlasts(userId, userCity, userAge, userGender) {
  const [blasts, setBlasts] = useState([])

  useEffect(() => {
    if (!supabase || !userId || !userCity) return

    const load = async () => {
      const { data } = await supabase
        .from('vibe_blasts')
        .select('id, user_id, looking_for_gender, looking_for_age_min, looking_for_age_max, looking_for_distance_km, expires_at, seen_count, profiles:user_id(display_name, photo_url, age, city)')
        .eq('is_active', true)
        .eq('city', userCity)
        .gt('expires_at', new Date().toISOString())
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!data) return

      // Filter: blast must target this user's gender and age
      const filtered = data.filter(b => {
        if (b.looking_for_gender !== 'both') {
          if (userGender && b.looking_for_gender !== userGender) return false
        }
        if (userAge) {
          if (userAge < b.looking_for_age_min || userAge > b.looking_for_age_max) return false
        }
        return true
      })

      // Record view for each visible blast (fire-and-forget, errors are non-fatal)
      Promise.all(
        filtered.map(b =>
          supabase.from('vibe_blast_views').upsert(
            { spotlight_id: b.id, viewer_id: userId },
            { onConflict: 'spotlight_id,viewer_id' }
          )
        )
      ).catch(() => {})

      setBlasts(filtered)
    }

    load()
  }, [userId, userCity, userAge, userGender])

  return blasts
}

function timeLeftStr(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

const DEMO_RECENT_RIDES = [
  { id: 'BOOK_001', created_at: '2026-04-08T09:12:00Z', dropoff_location: 'Bandara Adisucipto', driver_name: 'Budi Santoso', driver_type: 'bike_ride', fare: 28000, status: 'completed' },
  { id: 'BOOK_002', created_at: '2026-04-08T10:45:00Z', dropoff_location: 'Prambanan Temple',    driver_name: 'Ani Rahayu',   driver_type: 'car_taxi',  fare: 45000, status: 'completed' },
  { id: 'BOOK_003', created_at: '2026-04-08T11:30:00Z', dropoff_location: 'Jl. Solo No. 8',      driver_name: 'Hendra Putra', driver_type: 'bike_ride', fare: null,  status: 'cancelled' },
]

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

function useRecentRides(userId) {
  const [rides, setRides] = useState([])
  useEffect(() => {
    if (!supabase || !userId) { setRides(DEMO_RECENT_RIDES); return }
    supabase
      .from('bookings')
      .select('id, created_at, dropoff_location, fare, status, service_type, driver:profiles!driver_id(display_name, driver_type)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setRides((data ?? []).map(b => ({
          ...b,
          driver_name: b.driver?.display_name ?? '—',
          driver_type: b.driver?.driver_type  ?? 'bike_ride',
        })))
      })
      .catch(() => setRides(DEMO_RECENT_RIDES))
  }, [userId])
  return rides
}

function timeAgo(ms) {
  if (!ms) return ''
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Notification type → emoji
const NOTIF_EMOJI = {
  connect:       '🤝',
  like:          '💚',
  system:        '🛡️',
  date_invite:   '💕',
  date_accepted: '🎉',
  message:       '💬',
  ride:          '🏍️',
  ride_accepted: '✅',
}

// Types that open chat when tapped
const CHAT_TYPES = new Set(['date_invite', 'date_accepted', 'message', 'connect'])

export const DEMO_UNREAD_COUNT = 2

export default function NotificationsScreen({ onClose, onOpenChat, userId, userProfile, onOpenRideHistory, stripProps }) {
  const notifData = useNotifications()
  const { notifications = [], profileViews = [], unreadCount = 0, markAllRead = () => {} } = notifData || {}
  const recentRides = useRecentRides(userId)
  const vibeBlasts  = useVibeBlasts(
    userId,
    userProfile?.city ?? null,
    userProfile?.age  ?? null,
    userProfile?.gender ?? null,
  )

  // Use real notifications if available, otherwise show demo placeholders
  const hasRealNotifs = notifications.length > 0

  // ── Categorise by app section ────────────────────────────────────────────
  const datingNotifs      = notifications.filter(n => ['date_invite', 'date_accepted'].includes(n.type))
  const socialNotifs      = notifications.filter(n => ['like', 'wave', 'connect'].includes(n.type))
  const messageNotifs     = notifications.filter(n => n.type === 'message')
  const rideNotifs        = notifications.filter(n => ['ride', 'ride_accepted'].includes(n.type))
  const marketNotifs      = notifications.filter(n => n.type === 'marketplace')
  const restaurantNotifs  = notifications.filter(n => n.type === 'restaurant')
  const systemNotifs      = notifications.filter(n => n.type === 'system')

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <img src="https://ik.imagekit.io/nepgaxllc/UntitledasdsSDdasdASDSFSD-removebg-preview.png" alt="" className={styles.headerIcon} aria-hidden="true" />
        <span className={styles.title}>Notifications</span>
      </div>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statChip}>
          <span className={styles.statNum}>{rideNotifs.length + recentRides.length || '—'}</span>
          <span className={styles.statMeta}>Rides</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statChip}>
          <span className={styles.statNum}>{restaurantNotifs.length || '—'}</span>
          <span className={styles.statMeta}>Food Orders</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statChip}>
          <span className={styles.statNum}>{messageNotifs.length || '—'}</span>
          <span className={styles.statMeta}>Messages</span>
        </div>
      </div>

      <div className={styles.scroll}>

        {/* WHO VIEWED YOUR PROFILE — hidden for launch */}

        {/* VIBE BLASTS — hidden for launch */}
        {false && vibeBlasts.length > 0 && (
          <>
            <div className={`${styles.sectionHeader} ${styles.sectionVibe}`}>
              <span className={styles.sectionIcon}>⚡</span>
              <span className={styles.sectionTitle}>Vibe Blasting nearby</span>
              <span className={styles.sectionCount}>{vibeBlasts.length}</span>
            </div>
            {vibeBlasts.map(b => (
              <div key={b.id} className={styles.vibeBlastRow}>
                <div className={styles.vibeBlastAvatar}>
                  {b.profiles?.photo_url
                    ? <img src={b.profiles.photo_url} alt={b.profiles?.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 20 }}>⚡</span>
                  }
                </div>
                <div className={styles.vibeBlastBody}>
                  <div className={styles.vibeBlastName}>
                    {b.profiles?.display_name ?? 'Someone nearby'}
                    {b.profiles?.age ? `, ${b.profiles.age}` : ''}
                  </div>
                  <div className={styles.vibeBlastMeta}>
                    Looking for {b.looking_for_gender === 'both' ? 'everyone' : b.looking_for_gender === 'male' ? 'men' : 'women'}
                    {' · '}age {b.looking_for_age_min}–{b.looking_for_age_max}
                    {' · '}within {b.looking_for_distance_km} km
                  </div>
                  <div className={styles.vibeBlastExpiry}>⏱ {timeLeftStr(b.expires_at)}</div>
                </div>
                <div className={styles.vibeBlastPink}>⚡</div>
              </div>
            ))}
          </>
        )}

        {/* DATING — hidden for launch */}
        {false && datingNotifs.length > 0 && (
          <>
            <div className={`${styles.sectionHeader} ${styles.sectionDating}`}>
              <span className={styles.sectionIcon}>💕</span>
              <span className={styles.sectionTitle}>Dating</span>
              <span className={styles.sectionCount}>{datingNotifs.length}</span>
            </div>
            {datingNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onOpenChat={onOpenChat} />
            ))}
          </>
        )}

        {/* MARKETPLACE — hidden for launch */}
        {false && marketNotifs.length > 0 && (
          <>
            <div className={`${styles.sectionHeader} ${styles.sectionMarket}`}>
              <span className={styles.sectionIcon}>🛍️</span>
              <span className={styles.sectionTitle}>Marketplace</span>
              <span className={styles.sectionCount}>{marketNotifs.length}</span>
            </div>
            {marketNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onOpenChat={onOpenChat} />
            ))}
          </>
        )}

        {/* ── RESTAURANT ── */}
        {restaurantNotifs.length > 0 && (
          <>
            <div className={`${styles.sectionHeader} ${styles.sectionFood}`}>
              <span className={styles.sectionIcon}>🍽️</span>
              <span className={styles.sectionTitle}>Restaurant</span>
              <span className={styles.sectionCount}>{restaurantNotifs.length}</span>
            </div>
            {restaurantNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onOpenChat={onOpenChat} />
            ))}
          </>
        )}

        {/* ── RIDES ── */}
        {(rideNotifs.length > 0 || recentRides.length > 0) && (
          <>
            <div className={`${styles.sectionHeader} ${styles.sectionRide}`}>
              <img src="https://ik.imagekit.io/nepgaxllc/Green%20and%20black%20speed%20machines.png?updatedAt=1775635360641" alt="" className={styles.sectionImgIcon} aria-hidden="true" />
              <span className={styles.sectionTitle}>Bike / Car Service</span>
              {onOpenRideHistory && (
                <button className={styles.viewAllBtn} onClick={onOpenRideHistory}>View All →</button>
              )}
            </div>
            {rideNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onOpenChat={onOpenChat} />
            ))}
            {recentRides.map(ride => (
              <div key={ride.id} className={styles.rideRow}>
                <span className={styles.rideIcon}>
                  {ride.status === 'cancelled'
                    ? '📦'
                    : ride.driver_type === 'car_taxi'
                      ? <img src="https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566" alt="car" className={styles.rideIconImg} />
                      : <img src="https://ik.imagekit.io/nepgaxllc/Riders%20on%20a%20sleek%20scooter.png?updatedAt=1775657336879" alt="bike" className={styles.rideIconImg} />
                  }
                </span>
                <div className={styles.rideBody}>
                  <span className={styles.rideDest}>{ride.dropoff_location ?? '—'}</span>
                  <span className={styles.rideMeta}>
                    {ride.driver_name} · {new Date(ride.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className={styles.rideRight}>
                  {ride.status === 'completed' && ride.fare != null
                    ? <span className={styles.rideFare}>{fmtRp(ride.fare)}</span>
                    : (
                      <img
                        src="https://ik.imagekit.io/nepgaxllc/Order%20canceled%20warning%20banner.png"
                        alt="Cancelled"
                        className={styles.warningBadge}
                      />
                    )
                  }
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── MESSAGES ── */}
        {messageNotifs.length > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>💬</span>
              <span className={styles.sectionTitle}>Messages</span>
              <span className={styles.sectionCount}>{messageNotifs.length}</span>
            </div>
            {messageNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onOpenChat={onOpenChat} />
            ))}
          </>
        )}

        {/* SOCIAL — hidden for launch */}
        {false && socialNotifs.length > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🤝</span>
              <span className={styles.sectionTitle}>Social</span>
              <span className={styles.sectionCount}>{socialNotifs.length}</span>
            </div>
            {socialNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onOpenChat={onOpenChat} />
            ))}
          </>
        )}

        {/* ── SYSTEM ── */}
        {systemNotifs.length > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🛡️</span>
              <span className={styles.sectionTitle}>System</span>
              <span className={styles.sectionCount}>{systemNotifs.length}</span>
            </div>
            {systemNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onOpenChat={onOpenChat} />
            ))}
          </>
        )}

        {/* Empty state */}
        {!hasRealNotifs && (
          <div className={styles.sectionHeader} style={{ opacity: 0.5, justifyContent: 'center' }}>
            <span className={styles.sectionTitle}>No notifications yet — get out there!</span>
          </div>
        )}

      </div>

      {stripProps && <ProfileStrip {...stripProps} />}
      <IndooFooter label="Notifications" onHome={onClose} onClose={onClose} />
    </div>
  )
}


/* ── Profile viewer card (real data) ── */
function ViewerCard({ viewer }) {
  return (
    <div className={styles.viewerCard}>
      <div className={styles.viewerAvatar}>
        {viewer.photoURL
          ? <img src={viewer.photoURL} alt={viewer.displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : viewer.displayName?.[0]?.toUpperCase() ?? '?'
        }
      </div>
      <div className={styles.viewerBody}>
        <div className={styles.viewerTop}>
          <span className={styles.viewerName}>{viewer.displayName}</span>
          {viewer.age && <span className={styles.viewerAge}>{viewer.age}</span>}
        </div>
        {viewer.city && <span className={styles.viewerCity}>📍 {viewer.city}</span>}
        <span className={styles.viewerViews}>{timeAgo(viewer.createdAt)}</span>
      </div>
    </div>
  )
}

/* ── Notification row (real Supabase data) ── */
function NotifRow({ notif, onOpenChat }) {
  const tappable = CHAT_TYPES.has(notif.type) && !!onOpenChat
  const handleTap = () => {
    if (!tappable) return
    onOpenChat({ fromUserId: notif.fromUserId, displayName: notif.fromName, photoURL: notif.fromPhoto })
  }
  return (
    <div
      className={`${styles.row} ${!notif.read ? styles.rowUnread : ''} ${tappable ? styles.rowTappable : ''}`}
      onClick={tappable ? handleTap : undefined}
      role={tappable ? 'button' : undefined}
    >
      <div className={`${styles.rowEmoji} ${!notif.read ? styles.rowEmojiUnread : ''}`}>
        {NOTIF_EMOJI[notif.type] ?? '🔔'}
      </div>
      <div className={styles.rowText}>
        <span className={styles.rowTitle}>{notif.title}</span>
        {notif.body && <span className={styles.rowBody}>{notif.body}</span>}
        <span className={styles.rowTime}>{timeAgo(notif.createdAt)}</span>
      </div>
      <div className={styles.rowRight}>
        {tappable && <span className={styles.rowChevron}>›</span>}
        {!notif.read && <span className={styles.dot} />}
      </div>
    </div>
  )
}
