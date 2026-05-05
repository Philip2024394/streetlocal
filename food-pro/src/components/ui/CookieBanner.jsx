import { useState, useEffect } from 'react'
import styles from './CookieBanner.module.css'

const STORAGE_KEY = 'indoo_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const id = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(id)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'all')
    setVisible(false)
  }

  function essentialOnly() {
    localStorage.setItem(STORAGE_KEY, 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner} role="dialog" aria-label="Cookie consent">
      <div className={styles.text}>
        <span className={styles.icon}>🍪</span>
        <p>
          We use essential cookies to keep you signed in and improve your
          experience. See our{' '}
          <a href="/privacy" className={styles.link} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" className={styles.link} target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>.
        </p>
      </div>
      <div className={styles.actions}>
        <button className={styles.btnEssential} onClick={essentialOnly}>
          Essential only
        </button>
        <button className={styles.btnAccept} onClick={accept}>
          Accept all
        </button>
      </div>
    </div>
  )
}
