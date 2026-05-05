// Shown once per feature — never again after user taps "Got it"
// Uses localStorage key `fi_${featureKey}` to track seen state
import { useState } from 'react'
import styles from './FeatureIntro.module.css'

export function useFeatureIntro(featureKey) {
  const storageKey = `fi_${featureKey}`
  const [show, setShow] = useState(() => !localStorage.getItem(storageKey))
  const dismiss = () => {
    localStorage.setItem(storageKey, '1')
    setShow(false)
  }
  return { show, dismiss }
}

export default function FeatureIntro({ emoji, title, bullets, onDone }) {
  return (
    <div className={styles.backdrop} onClick={onDone}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <span className={styles.emoji}>{emoji}</span>
        <h2 className={styles.title}>{title}</h2>
        <ul className={styles.bullets}>
          {bullets.map((b, i) => (
            <li key={i} className={styles.bullet}>
              <span className={styles.bulletDot} />
              {b}
            </li>
          ))}
        </ul>
        <button className={styles.btn} onClick={onDone}>Got it</button>
      </div>
    </div>
  )
}
