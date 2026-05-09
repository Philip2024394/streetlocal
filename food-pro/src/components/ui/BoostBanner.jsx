import { useEffect, useMemo } from 'react'
import styles from './BoostBanner.module.css'
import imgError from '../../imgFallback'

const BADGE_IMAGES = {
  now:    "https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/bold-3d-_indoo_-logo-design.png'm%20out%20boosted%20badge%20design.png",
  invite: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/golden-badge-with-vibrant-rocket-and-confetti.png',
  later:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/later-out-boosted-badge-design.png',
}

const LABELS = {
  now:    "You're Out Now",
  invite: 'Invite Out',
  later:  'Out Later',
}

const STAR_CHARS = ['★', '✦', '✧', '⭐', '✨', '💫']

// Generate 24 stars with stable random positions/timings
function useStars(count = 24) {
  return useMemo(() => (
    Array.from({ length: count }, (_, i) => ({
      id:    i,
      char:  STAR_CHARS[i % STAR_CHARS.length],
      left:  `${(i * 37 + 11) % 100}%`,
      size:  10 + (i * 7) % 18,
      delay: `${((i * 0.19) % 2.2).toFixed(2)}s`,
      dur:   `${(1.8 + (i * 0.23) % 1.6).toFixed(2)}s`,
      rot:   (i * 47) % 360,
      opacity: 0.5 + (i % 5) * 0.1,
    }))
  ), [count])
}

export default function BoostBanner({ filter, onDone }) {
  const stars = useStars()

  // Auto-dismiss after 3.2 s
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={styles.overlay} onClick={onDone}>

      {/* Falling stars */}
      {stars.map(s => (
        <span
          key={s.id}
          className={styles.star}
          style={{
            left:            s.left,
            fontSize:        `${s.size}px`,
            animationDelay:  s.delay,
            animationDuration: s.dur,
            '--rot':         `${s.rot}deg`,
            opacity:         s.opacity,
          }}
        >
          {s.char}
        </span>
      ))}

      {/* Badge */}
      <div className={styles.card}>
        <img
          src={BADGE_IMAGES[filter]}
          alt={`${LABELS[filter]} Boosted`}
          className={styles.badge}
          onError={imgError('generic')}
        />
        <p className={styles.label}>{LABELS[filter]}</p>
        <p className={styles.sub}>Profile Boosted 🚀</p>
        <span className={styles.tap}>Tap anywhere to dismiss</span>
      </div>
    </div>
  )
}
