import styles from '../ProfileScreen.module.css'
import { DATING_REL_GOAL_OPTIONS, DATING_STAR_SIGNS } from './ProfileBioSection'

export default function ProfileDatingFields({
  relationshipGoal, setRelGoalOpen,
  starSign, setStarSign, setStarSignOpen,
  height, setHeight,
  dealBreakers, setDealBreakers,
  HelpTip,
}) {
  return (
    <>
      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>Looking for</label>
          <HelpTip text="What kind of connection are you hoping to make? Be honest — it helps everyone find the right match." />
        </div>
        <button type="button" className={styles.lookingForTrigger} onClick={() => setRelGoalOpen(true)}>
          {relationshipGoal
            ? (() => {
                const opt = DATING_REL_GOAL_OPTIONS.find(o => o.value === relationshipGoal)
                return opt ? <span>{opt.emoji} {opt.label}</span> : <span>{relationshipGoal}</span>
              })()
            : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
          }
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>Star Sign</label>
          <HelpTip text="Your star sign is shown on your dating profile — optional but adds a personal touch." />
        </div>
        <button type="button" className={styles.lookingForTrigger} onClick={() => setStarSignOpen(true)}>
          {starSign
            ? (() => {
                const s = DATING_STAR_SIGNS.find(o => o.value === starSign)
                return s ? <span>{s.emoji} {s.label}</span> : <span>{starSign}</span>
              })()
            : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
          }
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {starSign && (
          <button type="button" className={styles.brandQuickBtn} onClick={() => setStarSign('')}>✕ Clear</button>
        )}
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>Height</label>
          <HelpTip text="Your height is shown as a chip on your dating card — optional." />
        </div>
        <input className={styles.fieldInput} value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 172 cm or 5ft 7" />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>Deal Breakers</label>
          <HelpTip text="Be upfront about what you can't compromise on — it saves everyone time." />
        </div>
        <textarea
          className={styles.fieldInput}
          value={dealBreakers}
          onChange={e => setDealBreakers(e.target.value.slice(0, 200))}
          placeholder="e.g. No smokers, must love dogs…"
          rows={3}
          style={{ resize: 'none', lineHeight: 1.5 }}
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{dealBreakers.length}/200</span>
      </div>
    </>
  )
}
