import { quoteForUser } from '@/data/brandQuotes'
import styles from './Avatar.module.css'

export default function Avatar({
  src, name, size = 48,
  live = false, mutual = false, scheduled = false, inviteOut = false, dating = false,
}) {
  const showBrand = !src
  const showQuote = showBrand && size >= 44

  return (
    <div
      className={[
        styles.avatar,
        live      ? styles.live      : '',
        mutual    ? styles.mutual    : '',
        scheduled ? styles.scheduled : '',
        dating    ? styles.dating    : inviteOut ? styles.inviteOut : '',
        showBrand ? styles.brandCard : '',
      ].filter(Boolean).join(' ')}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {src ? (
        <img src={src} alt={name ?? 'User'} />
      ) : showQuote ? (
        <div className={styles.brandInner}>
          <span className={styles.brandMark}>ion</span>
          <span className={styles.brandQuote}>{quoteForUser(name)}</span>
          <span className={styles.noPhotoTag}>📷 No photo yet</span>
        </div>
      ) : (
        /* Very small sizes — just the brand mark */
        <span className={styles.brandMarkSm}>✦</span>
      )}
    </div>
  )
}
