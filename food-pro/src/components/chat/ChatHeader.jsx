import styles from './ChatWindow.module.css'

export default function ChatHeader({
  conv, isOnline, switcherOpen, setSwitcherOpen, otherConvs,
  videoAvailable, videoPhase, sendVideoRequest,
  setShareOpen, onBack, isDatingTheme, contactUnlocked, themeConfig,
}) {
  return (
    <div className={`${styles.header} ${themeConfig ? styles[themeConfig.headerClass] : ''}`}>
      <div className={styles.headerUser}>
        <div className={styles.headerAvatar}>
          {conv.photoURL
            ? <img src={conv.photoURL} alt={conv.displayName} className={styles.headerAvatarImg} />
            : <span className={styles.headerAvatarEmoji}>{conv.emoji}</span>
          }
          <span className={`${styles.presenceDot} ${isOnline ? styles.presenceDotOnline : styles.presenceDotOffline}`} />
        </div>
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{conv.displayName}</span>
          <span className={`${styles.presenceLabel} ${isOnline ? styles.presenceLabelOnline : styles.presenceLabelOffline}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className={styles.headerRight}>
        {otherConvs.length > 0 && (
          <button
            className={`${styles.switcherBtn} ${switcherOpen ? styles.switcherBtnActive : ''}`}
            onClick={() => setSwitcherOpen(v => !v)}
            aria-label="Switch chat"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{otherConvs.length}</span>
            {otherConvs.some(c => c.unread > 0) && <span className={styles.switcherBadge} />}
          </button>
        )}

        {videoAvailable && videoPhase === 'idle' && (
          <button className={styles.idCheckBtn} onClick={sendVideoRequest} aria-label="Request live ID check">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>ID Check</span>
          </button>
        )}

        <button className={styles.shareBtn} onClick={() => setShareOpen(true)} aria-label="Share contact">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>Share</span>
        </button>

        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {isDatingTheme && (
        <div className={styles.headerNoticeRow}>
          {contactUnlocked
            ? '✅ Contact details unlocked'
            : '💬 Free chat · Unlock to view social details'}
        </div>
      )}
    </div>
  )
}
