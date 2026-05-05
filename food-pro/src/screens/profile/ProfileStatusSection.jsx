import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '@/firebase/collections'
import styles from '../ProfileScreen.module.css'

export default function ProfileStatusSection({
  lookingFor, makerCategories,
  selectedActivity, setSelectedActivity,
  expandedCategory, setExpandedCategory,
  pendingStatus, particles, handleStatusClick, mySession,
  HelpTip,
}) {
  return (
    <>
      {/* Let's Meet With accordion — non-maker, non-driver */}
      {lookingFor && !makerCategories.includes(lookingFor) && lookingFor !== 'car_taxi' && lookingFor !== 'bike_ride' && (
        <div className={styles.section}>
          <div className={styles.sectionLabelRow}>
            <span className={styles.sectionLabel}>Let's Meet With</span>
            <HelpTip text="Pick what best describes your plans. People with matching interests will find you on the map." />
          </div>
          <div className={styles.accordionList}>
            {ACTIVITY_CATEGORIES.map(cat => {
              const items = ACTIVITY_TYPES.filter(a => a.category === cat.id)
              if (!items.length) return null
              const isOpen   = expandedCategory === cat.id
              const selected = items.find(a => a.id === selectedActivity)
              return (
                <div key={cat.id} className={`${styles.accordionItem} ${selected ? styles.accordionItemSelected : ''}`}>
                  <button
                    className={styles.accordionHeader}
                    onClick={() => setExpandedCategory(isOpen ? null : cat.id)}
                  >
                    <span className={styles.accordionLabel}>{cat.label}</span>
                    {selected && <span className={styles.accordionPick}>{selected.label}</span>}
                    <svg
                      className={`${styles.accordionChevron} ${isOpen ? styles.chevronOpen : ''}`}
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className={styles.accordionBody}>
                      {items.map(a => (
                        <button
                          key={a.id}
                          className={`${styles.accordionChip} ${selectedActivity === a.id ? styles.accordionChipActive : ''}`}
                          onClick={() => {
                            setSelectedActivity(prev => prev === a.id ? null : a.id)
                            setExpandedCategory(null)
                          }}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Set Your Status */}
      <div className={styles.section}>
        <div className={styles.sectionLabelRow}>
          <span className={styles.sectionLabel}>Set Your Status</span>
          <HelpTip text="Let people know if you're ready to meet. I'm Out — you're out right now. Invite Out — you want someone to invite you out. Later Out — set a time for when you'll be going out." />
        </div>
        <p className={styles.activityHint}>Let people know you're available — your status is set when you save your profile</p>

        <div className={styles.particleContainer}>
          {particles.map(p => (
            <span
              key={p.id}
              className={styles.particle}
              style={{ left: p.left, animationDuration: p.dur, animationDelay: p.delay }}
            >
              {p.char}
            </span>
          ))}

          <div className={styles.statusBtnRow}>
            <button
              className={`${styles.statusBtn} ${pendingStatus === 'im_out' ? styles.statusBtnGreen : mySession?.status === 'active' && !pendingStatus ? styles.statusBtnGreen : ''}`}
              onClick={() => handleStatusClick('im_out')}
            >
              <span className={`${styles.statusDot} ${styles.statusDotGreen}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
              </span>
              <span className={styles.statusBtnLabel}>I&apos;m Out</span>
            </button>
            <button
              className={`${styles.statusBtn} ${pendingStatus === 'invite_out' ? styles.statusBtnYellow : mySession?.status === 'invite_out' && !pendingStatus ? styles.statusBtnYellow : ''}`}
              onClick={() => handleStatusClick('invite_out')}
            >
              <span className={`${styles.statusDot} ${styles.statusDotYellow}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
              </span>
              <span className={styles.statusBtnLabel}>Invite Out</span>
            </button>
            <button
              className={`${styles.statusBtn} ${pendingStatus === 'later_out' ? styles.statusBtnOrange : mySession?.status === 'scheduled' && !pendingStatus ? styles.statusBtnOrange : ''}`}
              onClick={() => handleStatusClick('later_out')}
            >
              <span className={`${styles.statusDot} ${styles.statusDotOrange}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
              </span>
              <span className={styles.statusBtnLabel}>Later Out</span>
            </button>
          </div>
        </div>

        {pendingStatus && (
          <p className={styles.statusSelectedNote}>
            {pendingStatus === 'im_out'     && '🚀 You\'ll be set live — save your profile to continue to location setup'}
            {pendingStatus === 'invite_out' && '💌 You\'ll appear as wanting an invite — save your profile to confirm'}
            {pendingStatus === 'later_out'  && '🕐 You\'re going out later — save your profile to set your time & place'}
          </p>
        )}
      </div>
    </>
  )
}
