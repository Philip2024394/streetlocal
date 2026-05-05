import styles from './RestaurantMenuSheet.module.css'

// ── Socials left drawer ───────────────────────────────────────────────────────
export default function SocialsDrawer({ restaurant, onClose }) {
  return (
    <div className={styles.panelBackdrop} onClick={onClose}>
      <div className={styles.infoPanel} onClick={e => e.stopPropagation()}>
        <h3 className={styles.infoPanelTitle}>Follow Us</h3>
        <p className={styles.infoPanelSub}>{restaurant.name}</p>

        {restaurant.instagram && (
          <a className={styles.socialLink} href={`https://instagram.com/${restaurant.instagram}`} target="_blank" rel="noreferrer">
            <span className={styles.socialIcon}>📸</span>
            <span className={styles.socialName}>Instagram</span>
            <span className={styles.socialHandle}>@{restaurant.instagram}</span>
          </a>
        )}
        {restaurant.tiktok && (
          <a className={styles.socialLink} href={`https://tiktok.com/@${restaurant.tiktok}`} target="_blank" rel="noreferrer">
            <span className={styles.socialIcon}>🎵</span>
            <span className={styles.socialName}>TikTok</span>
            <span className={styles.socialHandle}>@{restaurant.tiktok}</span>
          </a>
        )}
        {restaurant.facebook && (
          <a className={styles.socialLink} href={`https://facebook.com/${restaurant.facebook}`} target="_blank" rel="noreferrer">
            <span className={styles.socialIcon}>👥</span>
            <span className={styles.socialName}>Facebook</span>
            <span className={styles.socialHandle}>{restaurant.facebook}</span>
          </a>
        )}

        {!restaurant.instagram && !restaurant.tiktok && !restaurant.facebook && (
          <p className={styles.noSocials}>No social links added yet.</p>
        )}
      </div>
    </div>
  )
}
