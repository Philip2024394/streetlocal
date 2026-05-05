import { useLanguage } from '@/i18n'
import styles from './ProfileStrip.module.css'

const TAB_ICONS = {
  map: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  notifications: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  chat: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
}

export default function ProfileStrip({ activeTab = 'map', onTabChange, notifCount = 0, unreadCount = 0, userPhoto = null }) {
  const { t } = useLanguage()

  const TABS = [
    { id: 'map',           labelKey: 'nav.home'    },
    { id: 'notifications', labelKey: 'nav.alerts'  },
    { id: 'chat',          labelKey: 'nav.chat'    },
    { id: 'profile',       labelKey: 'nav.profile' },
  ]

  return (
    <div className={styles.bar}>
      <div className={styles.pill}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const badge = tab.id === 'notifications' ? notifCount
                      : tab.id === 'chat'          ? unreadCount
                      : 0

          return (
            <button
              key={tab.id}
              className={`${styles.btn} ${isActive ? styles.btnActive : ''}`}
              onClick={() => onTabChange?.(tab.id)}
              aria-label={t(tab.labelKey)}
            >
              <div className={styles.iconWrap}>
                {tab.id === 'profile' && userPhoto
                  ? <img src={userPhoto} alt="Profile" className={styles.avatar} />
                  : TAB_ICONS[tab.id]
                }
                {badge > 0 && (
                  <span className={styles.badge}>{badge > 9 ? '9+' : badge}</span>
                )}
              </div>
              <span className={styles.label}>{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
