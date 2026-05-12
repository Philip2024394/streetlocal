import { useState } from 'react'
import { useFeatureIntro } from './FeatureIntro'
import styles from './MapIntroOverlay.module.css'

const STEPS = [
  {
    icon: '🗺️',
    title: 'This is your live map',
    body: 'Coloured pins show real people out in your city right now. Tap any pin or photo to view their profile and connect.',
    pills: [
      { color: '#8DC63F', label: 'Hanging Out' },
      { color: '#F5C518', label: 'Want to Hang' },
    ],
  },
  {
    icon: '🟢',
    title: 'Filter by status',
    body: 'The coloured buttons on the right side open a list of profiles for that status. The footer buttons filter the map pins.',
    pills: [
      { color: '#8DC63F', label: 'Green → Hanging Out' },
      { color: '#F5C518', label: 'Yellow → Want to Hang' },
    ],
  },
  {
    icon: '🚀',
    title: 'Start hanging to be found',
    body: "Tap your profile photo at the bottom of the right panel to set your status. Once live, others can see you on the map and connect.",
    pills: null,
    cta: true,
  },
]

export default function MapIntroOverlay({ onGoLive }) {
  const { show, dismiss } = useFeatureIntro('map_intro')
  const [step, setStep] = useState(0)

  if (!show) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function handleNext() {
    if (isLast) { dismiss(); return }
    setStep(s => s + 1)
  }

  function handleGoLive() {
    dismiss()
    onGoLive?.()
  }

  return (
    <div className={styles.backdrop} onClick={isLast ? dismiss : undefined}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>

        {/* Step indicator */}
        <div className={styles.stepRow}>
          {STEPS.map((_, i) => (
            <div key={i} className={`${styles.stepDot} ${i === step ? styles.stepDotActive : i < step ? styles.stepDotDone : ''}`} />
          ))}
        </div>

        <div className={styles.icon}>{current.icon}</div>
        <h2 className={styles.title}>{current.title}</h2>
        <p className={styles.body}>{current.body}</p>

        {current.pills && (
          <div className={styles.pills}>
            {current.pills.map(({ color, label }) => (
              <span key={label} className={styles.pill} style={{ background: color }}>
                {label}
              </span>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          {current.cta && (
            <button className={styles.goLiveBtn} onClick={handleGoLive}>
              🚀 Go Live Now
            </button>
          )}
          <button className={`${styles.nextBtn} ${current.cta ? styles.nextBtnGhost : ''}`} onClick={handleNext}>
            {isLast ? 'Got it' : 'Next →'}
          </button>
        </div>

        {step === 0 && (
          <button className={styles.skipBtn} onClick={dismiss}>Skip intro</button>
        )}
      </div>
    </div>
  )
}
